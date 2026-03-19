<template>
  <div class="admin-reports-page">
    <div class="d-flex justify-content-between align-items-start mb-4 flex-wrap" style="gap: 8px;">
      <div>
        <h2 class="mb-1">ระบบรายงาน (Admin)</h2>
        <p class="text-muted mb-0">สรุปข้อมูลและสถิติโครงการวิจัยทั้งระบบ</p>
      </div>
      <div class="d-flex" style="gap: 8px;">
        <CButton color="danger" @click="openExportModal('pdf')">Export PDF</CButton>
        <CButton color="success" @click="openExportModal('excel')">Export Excel</CButton>
      </div>
    </div>

    <CCard class="mb-3">
      <CCardBody>
        <CRow>
          <CCol md="4" class="mb-2 mb-md-0">
            <CSelect
              :value="filterYear"
              :options="yearOptions"
              @change="onYearChange"
            />
          </CCol>
          <CCol md="4" class="mb-2 mb-md-0">
            <CSelect
              :value="filterStatus"
              :options="statusOptions"
              @change="onStatusChange"
            />
          </CCol>
          <CCol md="4">
            <CButton color="primary" block @click="fetchData">โหลดข้อมูล</CButton>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <div v-if="loading" class="text-center py-5">
      <CSpinner color="primary" />
      <div class="mt-2 text-muted">กำลังโหลดข้อมูลรายงาน...</div>
    </div>

    <div v-else>
      <CRow class="mb-2">
        <CCol sm="6" lg="3" class="mb-3">
          <div class="kpi-card border-primary">
            <small class="text-muted">โครงการทั้งหมด</small>
            <div class="kpi-number">{{ totalProjects }}</div>
          </div>
        </CCol>
        <CCol sm="6" lg="3" class="mb-3">
          <div class="kpi-card border-success">
            <small class="text-muted">อนุมัติแล้ว</small>
            <div class="kpi-number">{{ approvedCount }}</div>
          </div>
        </CCol>
        <CCol sm="6" lg="3" class="mb-3">
          <div class="kpi-card border-warning">
            <small class="text-muted">รอพิจารณา</small>
            <div class="kpi-number">{{ pendingCount }}</div>
          </div>
        </CCol>
        <CCol sm="6" lg="3" class="mb-3">
          <div class="kpi-card border-danger">
            <small class="text-muted">ปฏิเสธ</small>
            <div class="kpi-number">{{ rejectedCount }}</div>
          </div>
        </CCol>
      </CRow>

      <CRow class="mb-4">
        <CCol sm="6" lg="4" class="mb-3">
          <div class="kpi-card border-info">
            <small class="text-muted">อัตราอนุมัติ</small>
            <div class="kpi-number">{{ approvalRate }}%</div>
          </div>
        </CCol>
        <CCol sm="6" lg="4" class="mb-3">
          <div class="kpi-card border-warning">
            <small class="text-muted">รอแก้ไข</small>
            <div class="kpi-number">{{ reportSummary.revision_requested || 0 }}</div>
          </div>
        </CCol>
        <CCol sm="6" lg="4" class="mb-3">
          <div class="kpi-card border-primary">
            <small class="text-muted">ประกาศแล้ว</small>
            <div class="kpi-number">{{ reportSummary.announced || 0 }}</div>
          </div>
        </CCol>
      </CRow>

      <CRow class="mb-4">
        <CCol lg="6" class="mb-3">
          <CCard>
            <CCardHeader>สัดส่วนสถานะโครงการ</CCardHeader>
            <CCardBody>
              <CChartDoughnut :datasets="doughnutChartData.datasets" :labels="doughnutChartData.labels" />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg="6" class="mb-3">
          <CCard>
            <CCardHeader>จำนวนโครงการตามประเภททุน</CCardHeader>
            <CCardBody>
              <CChartBar :datasets="barChartData.datasets" :labels="barChartData.labels" />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CCard class="mb-4">
        <CCardHeader>แนวโน้มการยื่นโครงการ (12 เดือนล่าสุด)</CCardHeader>
        <CCardBody>
          <CChartLine :datasets="lineChartData.datasets" :labels="lineChartData.labels" />
        </CCardBody>
      </CCard>

      <CCard class="mb-4">
        <CCardHeader>รายงานสรุปโดยละเอียด</CCardHeader>
        <CCardBody>
          <div class="table-responsive">
            <table class="table table-bordered table-striped mb-0">
              <thead>
                <tr>
                  <th>สถานะ</th>
                  <th class="text-right">จำนวน</th>
                  <th class="text-right">% จากทั้งหมด</th>
                  <th style="width: 35%;">Progress Bar</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in summaryTableRows" :key="row.status">
                  <td>{{ row.label }}</td>
                  <td class="text-right">{{ row.count }}</td>
                  <td class="text-right">{{ row.percent.toFixed(1) }}%</td>
                  <td>
                    <div class="progress" style="height: 14px;">
                      <div
                        class="progress-bar"
                        :style="{ width: row.percent + '%', backgroundColor: row.color }"
                        role="progressbar"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th>รวม</th>
                  <th class="text-right">{{ totalProjects }}</th>
                  <th class="text-right">100%</th>
                  <th><div class="text-muted">-</div></th>
                </tr>
              </tfoot>
            </table>
          </div>
        </CCardBody>
      </CCard>

      <CCard>
        <CCardHeader>โครงการที่ผ่านการอนุมัติล่าสุด</CCardHeader>
        <CCardBody>
          <div v-if="approvedProposals.length === 0" class="text-muted">ยังไม่มีโครงการที่อนุมัติ</div>
          <CDataTable
            v-else
            :items="approvedTableItems"
            :fields="approvedFields"
            hover
            striped
            bordered
            small
          >
            <template #index="{ item }">
              <td>{{ item.index }}</td>
            </template>
            <template #fundingType="{ item }">
              <td>{{ item.fundingType || 'ไม่ระบุ' }}</td>
            </template>
            <template #approvedAt="{ item }">
              <td>{{ formatDate(item.approvedAt || item.updatedAt) }}</td>
            </template>
          </CDataTable>
        </CCardBody>
      </CCard>
    </div>

    <CModal
      :show.sync="showExportModal"
      :close-on-backdrop="false"
      centered
      title="Export รายงาน"
    >
      <template #body-wrapper>
        <div class="modal-body export-modal-body">
          <div class="mb-3">
            <CSelect
              label="รูปแบบ"
              :value="exportForm.format"
              :options="[
                { value: 'pdf', label: 'PDF' },
                { value: 'excel', label: 'Excel' }
              ]"
              @change="onExportFormatChange"
            />
          </div>

          <div class="mb-3">
            <CSelect
              label="ปีงบประมาณ"
              :value="exportForm.fiscalYear"
              :options="yearOptions"
              @change="onExportYearChange"
            />
          </div>

          <div class="mb-3">
            <CSelect
              label="สถานะ"
              :value="exportForm.status"
              :options="statusOptions"
              @change="onExportStatusChange"
            />
          </div>

          <div class="custom-control custom-checkbox mb-3" v-if="exportForm.format === 'pdf'">
            <input
              id="includeCharts"
              v-model="exportForm.includeCharts"
              type="checkbox"
              class="custom-control-input"
            >
            <label class="custom-control-label" for="includeCharts">รวมกราฟ</label>
          </div>

          <div class="custom-control custom-checkbox mb-3">
            <input
              id="sendEmail"
              v-model="exportForm.sendEmail"
              type="checkbox"
              class="custom-control-input"
            >
            <label class="custom-control-label" for="sendEmail">ส่งทางอีเมล</label>
          </div>

          <div v-if="exportForm.sendEmail">
            <CInput
              label="อีเมลผู้รับ"
              type="email"
              v-model="exportForm.emailAddress"
              placeholder="example@mfu.ac.th"
            />
          </div>
        </div>
      </template>

      <template #footer-wrapper>
        <footer class="modal-footer export-modal-footer">
          <div class="d-flex justify-content-end w-100" style="gap: 10px;">
            <CButton color="secondary" @click="closeExportModal">ยกเลิก</CButton>
            <CButton color="primary" :disabled="exportLoading" @click="doExport">
              {{ exportLoading ? 'กำลัง Export...' : 'Export' }}
            </CButton>
          </div>
        </footer>
      </template>
    </CModal>
  </div>
</template>

<script>
import { instance as axios } from '@/service/api'
import Swal from 'sweetalert2'
import { CChartBar, CChartDoughnut, CChartLine } from '@coreui/vue-chartjs'

const STATUS_LABELS = {
  draft: 'แบบร่าง',
  submitted: 'ยื่นแล้ว',
  faculty_review_pending: 'รอประธานพิจารณา',
  faculty_approved: 'ประธานอนุมัติ',
  office_received: 'ส่วนบริหารรับแล้ว',
  document_checking: 'ตรวจสอบเอกสาร',
  assigned_to_committee: 'มอบหมายกรรมการแล้ว',
  under_review: 'กำลังพิจารณา',
  meeting_completed: 'ประชุมเสร็จแล้ว',
  revision_requested: 'ขอแก้ไข',
  resubmitted: 'ส่งแก้ไขแล้ว',
  second_round_review: 'พิจารณารอบ 2',
  approved: 'อนุมัติ',
  rejected: 'ปฏิเสธ',
  announced: 'ประกาศผลแล้ว'
}

const STATUS_COLORS = {
  draft: '#6c757d',
  submitted: '#17a2b8',
  faculty_review_pending: '#ffc107',
  faculty_approved: '#007bff',
  office_received: '#17a2b8',
  document_checking: '#fd7e14',
  assigned_to_committee: '#007bff',
  under_review: '#e83e8c',
  meeting_completed: '#6f42c1',
  revision_requested: '#dc3545',
  resubmitted: '#20c997',
  second_round_review: '#fd7e14',
  approved: '#28a745',
  rejected: '#dc3545',
  announced: '#007bff'
}

const STATUS_KEYS = [
  'draft',
  'submitted',
  'faculty_review_pending',
  'faculty_approved',
  'office_received',
  'document_checking',
  'assigned_to_committee',
  'under_review',
  'meeting_completed',
  'revision_requested',
  'resubmitted',
  'second_round_review',
  'approved',
  'rejected',
  'announced'
]

export default {
  name: 'AdminReports',
  components: {
    CChartBar,
    CChartDoughnut,
    CChartLine
  },
  data () {
    return {
      summary: {},
      proposals: [],
      approvedProposals: [],
      loading: false,
      filterYear: '',
      filterStatus: '',

      showExportModal: false,
      exportFormat: 'pdf',
      exportLoading: false,
      exportForm: {
        format: 'pdf',
        fiscalYear: '',
        status: '',
        includeCharts: true,
        sendEmail: false,
        emailAddress: ''
      },
      approvedFields: [
        { key: 'index', label: '#' },
        { key: 'proposalCode', label: 'Proposal Code' },
        { key: 'projectTitleTh', label: 'ชื่อโครงการ' },
        { key: 'fiscalYear', label: 'ปีงบ' },
        { key: 'fundingType', label: 'ประเภททุน' },
        { key: 'approvedAt', label: 'วันที่อนุมัติ' }
      ]
    }
  },
  computed: {
    yearOptions () {
      return [
        { value: '', label: 'ทั้งหมด' },
        { value: 2023, label: '2023' },
        { value: 2024, label: '2024' },
        { value: 2025, label: '2025' },
        { value: 2026, label: '2026' }
      ]
    },
    statusOptions () {
      return [{ value: '', label: 'ทั้งหมด' }, ...STATUS_KEYS.map(key => ({ value: key, label: STATUS_LABELS[key] || key }))]
    },
    reportSummary () {
      // If user applies filters, rebuild summary from filtered proposals so KPIs/charts match current view.
      if (this.filterYear || this.filterStatus) {
        const rebuilt = {}
        STATUS_KEYS.forEach(key => {
          rebuilt[key] = 0
        })
        this.proposals.forEach(proposal => {
          const status = proposal.currentStatus
          if (Object.prototype.hasOwnProperty.call(rebuilt, status)) {
            rebuilt[status] += 1
          }
        })
        return rebuilt
      }
      return this.summary
    },
    totalProjects () {
      return STATUS_KEYS.reduce((sum, key) => sum + (Number(this.reportSummary[key]) || 0), 0)
    },
    approvedCount () {
      return Number(this.reportSummary.approved) || 0
    },
    rejectedCount () {
      return Number(this.reportSummary.rejected) || 0
    },
    pendingCount () {
      const keys = ['submitted', 'faculty_review_pending', 'document_checking', 'assigned_to_committee', 'under_review', 'meeting_completed']
      return keys.reduce((sum, key) => sum + (Number(this.reportSummary[key]) || 0), 0)
    },
    approvalRate () {
      const denominator = this.approvedCount + this.rejectedCount
      if (denominator === 0) return '0.0'
      return ((this.approvedCount / denominator) * 100).toFixed(1)
    },
    summaryTableRows () {
      const total = this.totalProjects || 1
      return STATUS_KEYS.map(status => {
        const count = Number(this.reportSummary[status]) || 0
        return {
          status,
          label: STATUS_LABELS[status] || status,
          count,
          percent: this.totalProjects ? (count / total) * 100 : 0,
          color: this.getStatusColor(status)
        }
      })
    },
    doughnutChartData () {
      const labels = STATUS_KEYS.map(status => STATUS_LABELS[status] || status)
      const data = STATUS_KEYS.map(status => Number(this.reportSummary[status]) || 0)
      const colors = STATUS_KEYS.map(status => STATUS_COLORS[status] || '#6c757d')
      return {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors
          }
        ]
      }
    },
    barChartData () {
      const grouped = this.groupByFundingType()
      return {
        labels: Object.keys(grouped),
        datasets: [
          {
            label: 'จำนวนโครงการ',
            data: Object.values(grouped),
            backgroundColor: '#007bff'
          }
        ]
      }
    },
    lineChartData () {
      const grouped = this.groupByMonth()
      return {
        labels: grouped.labels,
        datasets: [
          {
            label: 'จำนวนโครงการ',
            data: grouped.values,
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.2)',
            pointBackgroundColor: '#28a745',
            fill: true
          }
        ]
      }
    },
    approvedTableItems () {
      return this.approvedProposals.map((item, index) => ({
        ...item,
        index: index + 1
      }))
    }
  },
  mounted () {
    this.fetchData()
  },
  methods: {
    toAbsoluteUrl (url) {
      if (!url) return ''
      if (/^https?:\/\//i.test(url)) return url
      const base = (axios && axios.defaults && axios.defaults.baseURL) || process.env.VUE_APP_API_URL || ''
      return `${String(base).replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`
    },
    getSelectValue (val) {
      return val && val.target ? val.target.value : val
    },
    onYearChange (val) {
      this.filterYear = this.getSelectValue(val)
    },
    onStatusChange (val) {
      this.filterStatus = this.getSelectValue(val)
    },
    async fetchData () {
      this.loading = true
      try {
        await Promise.all([
          this.fetchSummary(),
          this.fetchProposals(),
          this.fetchApproved()
        ])
      } finally {
        this.loading = false
      }
    },
    async fetchSummary () {
      try {
        const response = await axios.get('/api/v1/proposals/admin/dashboard-summary')
        const payload = (response && response.data && response.data.data) || {}
        this.summary = payload
      } catch (error) {
        console.error('[AdminReports] Error fetching summary:', error)
        this.summary = {}
      }
    },
    async fetchProposals () {
      try {
        const params = { limit: 100 }
        if (this.filterStatus) params.status = this.filterStatus
        if (this.filterYear) params.fiscalYear = this.filterYear
        const response = await axios.get('/api/v1/proposals', { params })
        const payload = (response && response.data && response.data.data) || {}
        const list = Array.isArray(payload.proposals)
          ? payload.proposals
          : (Array.isArray(payload.data) ? payload.data : [])
        this.proposals = list
      } catch (error) {
        console.error('[AdminReports] Error fetching proposals:', error)
        this.proposals = []
      }
    },
    async fetchApproved () {
      try {
        const params = { status: 'approved', limit: 10 }
        if (this.filterYear) params.fiscalYear = this.filterYear
        const response = await axios.get('/api/v1/proposals', { params })
        const payload = (response && response.data && response.data.data) || {}
        const list = Array.isArray(payload.proposals)
          ? payload.proposals
          : (Array.isArray(payload.data) ? payload.data : [])
        this.approvedProposals = list
      } catch (error) {
        console.error('[AdminReports] Error fetching approved proposals:', error)
        this.approvedProposals = []
      }
    },
    groupByFundingType () {
      const map = {}
      this.proposals.forEach(proposal => {
        const key = proposal.fundingType || 'ไม่ระบุ'
        map[key] = (map[key] || 0) + 1
      })
      return Object.keys(map).length ? map : { 'ไม่ระบุ': 0 }
    },
    groupByMonth () {
      const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
      const labels = []
      const values = []
      const keyToIndex = {}

      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - 11, 1)

      for (let i = 0; i < 12; i++) {
        const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        keyToIndex[key] = i
        labels.push(`${thaiMonths[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`)
        values.push(0)
      }

      this.proposals.forEach(proposal => {
        const d = new Date(proposal.createdAt)
        if (!Number.isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          if (Object.prototype.hasOwnProperty.call(keyToIndex, key)) {
            values[keyToIndex[key]] += 1
          }
        }
      })
      return { labels, values }
    },
    openExportModal (fmt) {
      this.exportFormat = fmt
      this.exportForm = {
        format: fmt,
        fiscalYear: this.filterYear,
        status: this.filterStatus,
        includeCharts: true,
        sendEmail: false,
        emailAddress: ''
      }
      this.showExportModal = true
    },
    closeExportModal () {
      this.showExportModal = false
      this.exportLoading = false
    },
    onExportFormatChange (val) {
      this.exportForm.format = this.getSelectValue(val)
      if (this.exportForm.format !== 'pdf') {
        this.exportForm.includeCharts = false
      }
    },
    onExportYearChange (val) {
      this.exportForm.fiscalYear = this.getSelectValue(val)
    },
    onExportStatusChange (val) {
      this.exportForm.status = this.getSelectValue(val)
    },
    async doExport () {
      this.exportLoading = true
      try {
        const response = await axios.post('/api/v1/reports/export', {
          type: this.exportForm.format,
          fiscalYear: this.exportForm.fiscalYear || null,
          status: this.exportForm.status || null,
          includeCharts: this.exportForm.format === 'pdf' ? this.exportForm.includeCharts : false,
          sendEmail: this.exportForm.sendEmail,
          emailAddress: this.exportForm.sendEmail ? this.exportForm.emailAddress : null
        })

        const downloadUrl = response && response.data && response.data.data && response.data.data.downloadUrl
        if (downloadUrl) {
          window.open(this.toAbsoluteUrl(downloadUrl), '_blank')
          await Swal.fire({ icon: 'success', title: 'Export สำเร็จ' })
        } else {
          await Swal.fire({ icon: 'info', title: 'กำลังพัฒนา', text: 'ฟีเจอร์ Export อยู่ระหว่างพัฒนา' })
        }
        this.closeExportModal()
      } catch (error) {
        console.error('[AdminReports] Export not ready:', error)
        await Swal.fire({ icon: 'info', title: 'กำลังพัฒนา', text: 'ฟีเจอร์นี้อยู่ระหว่างพัฒนา' })
      } finally {
        this.exportLoading = false
      }
    },
    getStatusColor (status) {
      return STATUS_COLORS[status] || '#6c757d'
    },
    formatDate (dateStr) {
      if (!dateStr) return '-'
      const d = new Date(dateStr)
      if (Number.isNaN(d.getTime())) return '-'
      return d.toLocaleString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.admin-reports-page {
  width: 100%;
}

.kpi-card {
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-left-width: 5px;
  border-radius: 8px;
  padding: 14px 16px;
}

.kpi-number {
  font-size: 1.7rem;
  font-weight: 700;
  line-height: 1.1;
}

.export-modal-body {
  /* Ensure comfortable spacing even when CoreUI form-group margins are customized. */
  padding-top: 18px;
  padding-bottom: 18px;
}

.export-modal-footer {
  padding-top: 14px;
  padding-bottom: 14px;
}
</style>
