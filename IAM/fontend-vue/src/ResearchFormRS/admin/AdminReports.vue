<template>
  <div class="admin-reports-page">
    <CCard class="reports-hero mb-4">
      <CCardBody class="reports-hero__body">
        <div class="reports-hero__row">
          <div class="reports-hero__left">
            <div class="reports-hero__pill">ADMIN REPORTS</div>
            <h2 class="reports-hero__title">ระบบรายงาน</h2>
            <p class="reports-hero__subtitle">สรุปข้อมูลและสถิติโครงการวิจัยทั้งระบบ</p>
          </div>
          <div class="reports-hero__right">
            <CButton class="reports-hero__btn" variant="outline" color="light" @click="openExportModal('pdf')"><CIcon name="cil-cloud-download" class="mr-1" /> Export PDF</CButton>
            <CButton class="reports-hero__btn" variant="outline" color="light" @click="openExportModal('excel')"><CIcon name="cil-cloud-download" class="mr-1" /> Export Excel</CButton>
          </div>
        </div>
      </CCardBody>
    </CCard>

    <CCard class="reviewer-dashboard-card no-table-divider mb-3">
      <CCardHeader class="dashboard-card-header">
        <div class="dashboard-card-header__row">
          <div class="dashboard-card-title">ตัวกรองรายงาน</div>
          <div class="header-tools">
            <CButton class="collapse-toggle reports-refresh-btn" color="secondary" variant="outline" size="sm" @click="fetchData">
              <CIcon name="cil-cloud-download" class="mr-1" /> โหลดข้อมูล
            </CButton>
          </div>
        </div>
      </CCardHeader>
      <CCardBody class="card-body-tight">
        <CRow class="justify-content-center align-items-center reports-filter-row">
          <CCol md="4" lg="3" class="mb-2 mb-md-0">
            <CSelect
              :value="filterYear"
              :options="yearOptions"
              @change="onYearChange"
            />
          </CCol>
          <CCol md="4" lg="3" class="mb-2 mb-md-0">
            <CSelect
              :value="filterStatus"
              :options="statusOptions"
              @change="onStatusChange"
            />
          </CCol>
          <CCol md="4" lg="3">
            <CButton class="reports-refresh-btn w-100" color="primary" variant="outline" @click="fetchData"><CIcon name="cil-cloud-download" class="mr-1" /> โหลดข้อมูล</CButton>
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
          <div class="report-kpi report-kpi--neutral">
            <small class="report-kpi__label">โครงการทั้งหมด</small>
            <div class="report-kpi__value">{{ totalProjects }}</div>
          </div>
        </CCol>
        <CCol sm="6" lg="3" class="mb-3">
          <div class="report-kpi report-kpi--success">
            <small class="report-kpi__label">อนุมัติแล้ว</small>
            <div class="report-kpi__value">{{ approvedCount }}</div>
          </div>
        </CCol>
        <CCol sm="6" lg="3" class="mb-3">
          <div class="report-kpi report-kpi--warning">
            <small class="report-kpi__label">รอพิจารณา</small>
            <div class="report-kpi__value">{{ pendingCount }}</div>
          </div>
        </CCol>
        <CCol sm="6" lg="3" class="mb-3">
          <div class="report-kpi report-kpi--danger">
            <small class="report-kpi__label">ปฏิเสธ</small>
            <div class="report-kpi__value">{{ rejectedCount }}</div>
          </div>
        </CCol>
      </CRow>

      <CRow class="mb-4">
        <CCol sm="6" lg="4" class="mb-3">
          <div class="report-kpi report-kpi--info">
            <small class="report-kpi__label">อัตราอนุมัติ</small>
            <div class="report-kpi__value">{{ approvalRate }}%</div>
          </div>
        </CCol>
        <CCol sm="6" lg="4" class="mb-3">
          <div class="report-kpi report-kpi--warning">
            <small class="report-kpi__label">รอแก้ไข</small>
            <div class="report-kpi__value">{{ reportSummary.revision_requested || 0 }}</div>
          </div>
        </CCol>
        <CCol sm="6" lg="4" class="mb-3">
          <div class="report-kpi report-kpi--primary">
            <small class="report-kpi__label">ประกาศแล้ว</small>
            <div class="report-kpi__value">{{ reportSummary.announced || 0 }}</div>
          </div>
        </CCol>
      </CRow>

      <CRow class="mb-4">
        <CCol lg="6" class="mb-3">
          <CCard class="reviewer-dashboard-card no-table-divider">
            <CCardHeader class="dashboard-card-header">
              <div class="dashboard-card-header__row">
                <div class="dashboard-card-title">สัดส่วนสถานะโครงการ</div>
              </div>
            </CCardHeader>
            <CCardBody class="card-body-tight">
              <CChartDoughnut :datasets="doughnutChartData.datasets" :labels="doughnutChartData.labels" />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg="6" class="mb-3">
          <CCard class="reviewer-dashboard-card no-table-divider">
            <CCardHeader class="dashboard-card-header">
              <div class="dashboard-card-header__row">
                <div class="dashboard-card-title">จำนวนโครงการตามประเภททุน</div>
              </div>
            </CCardHeader>
            <CCardBody class="card-body-tight">
              <CChartBar :datasets="barChartData.datasets" :labels="barChartData.labels" />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CCard class="reviewer-dashboard-card no-table-divider mb-4">
        <CCardHeader class="dashboard-card-header">
          <div class="dashboard-card-header__row">
            <div class="dashboard-card-title">แนวโน้มการยื่นโครงการ (12 เดือนล่าสุด)</div>
          </div>
        </CCardHeader>
        <CCardBody class="card-body-tight">
          <CChartLine :datasets="lineChartData.datasets" :labels="lineChartData.labels" />
        </CCardBody>
      </CCard>

      <CCard class="reviewer-dashboard-card no-table-divider mb-4">
        <CCardHeader class="dashboard-card-header">
          <div class="dashboard-card-header__row">
            <div class="dashboard-card-title">รายงานสรุปโดยละเอียด</div>
          </div>
        </CCardHeader>
        <CCardBody class="card-body-tight">
          <div class="table-surface">
            <div class="table-responsive">
              <table class="table table-striped mb-0">
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
                    <div class="progress report-progress" style="height: 14px;">
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
          </div>
        </CCardBody>
      </CCard>

      <CCard class="reviewer-dashboard-card no-table-divider">
        <CCardHeader class="dashboard-card-header">
          <div class="dashboard-card-header__row">
            <div class="dashboard-card-title">โครงการที่ผ่านการอนุมัติล่าสุด</div>
          </div>
        </CCardHeader>
        <CCardBody class="card-body-tight">
          <div v-if="approvedProposals.length === 0" class="text-muted">ยังไม่มีโครงการที่อนุมัติ</div>
          <div v-else class="table-surface">
            <CDataTable
              :items="approvedTableItems"
              :fields="approvedFields"
              hover
              striped
              small
            >
              <template #index="{ item }">
                <td style="text-align:center; vertical-align:middle">{{ item.index }}</td>
              </template>
              <template #fundingType="{ item }">
                <td style="text-align:center; vertical-align:middle">{{ item.fundingType || 'ไม่ระบุ' }}</td>
              </template>
              <template #approvedAt="{ item }">
                <td style="text-align:center; vertical-align:middle">{{ formatDate(item.approvedAt || item.updatedAt) }}</td>
              </template>
            </CDataTable>
          </div>
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
            <CButton color="secondary" @click="closeExportModal"><CIcon name="cil-chevron-right" class="mr-1" /> ยกเลิก</CButton>
            <CButton color="primary" :disabled="exportLoading" @click="doExport">
              <CIcon name="cil-cloud-download" class="mr-1" /> {{ exportLoading ? 'กำลัง Export...' : 'Export' }}
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
import {
  PROPOSAL_STATUS_COLORS_COREUI_ADMIN as STATUS_COLORS,
  PROPOSAL_STATUS_KEYS_REPORT as STATUS_KEYS,
  PROPOSAL_STATUS_LABELS_TH_ADMIN as STATUS_LABELS,
  getCoreUiColorHex
} from '@/ResearchFormRS/constants/proposalWorkflow'
import { loadResearchFormRuntimeConfigs } from '@/ResearchFormRS/utils/researchConfigRuntime'
import centerLoadingMixin from '@/ResearchFormRS/utils/centerLoadingMixin'

export default {
  name: 'AdminReports',
  mixins: [centerLoadingMixin],
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
    centerLoadingActive () {
      return Boolean(this.loading || this.exportLoading)
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
      const keys = ['submitted', 'faculty_review_pending', 'faculty_approved', 'faculty_rejected', 'document_checking', 'assigned_to_committee', 'under_review', 'committee_valuated']
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
          color: this.getStatusColorValue(status)
        }
      })
    },
    doughnutChartData () {
      const labels = STATUS_KEYS.map(status => STATUS_LABELS[status] || status)
      const data = STATUS_KEYS.map(status => Number(this.reportSummary[status]) || 0)
      const colors = STATUS_KEYS.map(status => this.getStatusColorValue(status, 0.9))
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
            backgroundColor: 'rgba(140, 21, 21, 0.82)'
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
            borderColor: '#8c1515',
            backgroundColor: 'rgba(140, 21, 21, 0.16)',
            pointBackgroundColor: '#c59b3a',
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
  async mounted () {
    await loadResearchFormRuntimeConfigs()
    this.$forceUpdate()
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
      return STATUS_COLORS[normalizeProposalStatus(status)] || 'secondary'
    },
    getStatusColorValue (status, alpha = null) {
      return getCoreUiColorHex(this.getStatusColor(status), alpha)
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

/* ── Theme (match committee) ───────────────────────────────────────────── */
.card-body-tight {
  padding: 1rem;
  background: #f7f1ea;
}

.reviewer-dashboard-card {
  border-radius: 12px;
  overflow: hidden;
}

.dashboard-card-header {
  background: linear-gradient(90deg, rgba(140, 21, 21, 0.1), rgba(254, 194, 96, 0.22));
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 0 1.25rem;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.dashboard-card-header__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  min-height: 64px;
}

.dashboard-card-title {
  color: #6b0f0f;
  font-weight: 800;
  font-size: 1.15rem;
  line-height: 1.2;
}

.header-tools {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.header-tools /deep/ .form-group,
.header-tools >>> .form-group,
.header-tools::v-deep .form-group {
  margin: 0 !important;
}

.collapse-toggle {
  height: 34px;
  padding: 0 0.75rem;
  border-radius: 10px;
  color: #6b0f0f;
  border-color: rgba(181, 133, 34, 0.3);
  background: rgba(181, 133, 34, 0.1);
}

.collapse-toggle:hover {
  background: rgba(181, 133, 34, 0.16);
  border-color: rgba(181, 133, 34, 0.42);
  color: #6b0f0f;
}

.reports-filter-row /deep/ .form-group,
.reports-filter-row >>> .form-group,
.reports-filter-row::v-deep .form-group {
  margin: 0 !important;
}

.reports-filter-row /deep/ .custom-select,
.reports-filter-row >>> .custom-select,
.reports-filter-row::v-deep .custom-select {
  height: 38px;
  min-height: 38px;
  border-radius: 10px;
  border-color: rgba(181, 133, 34, 0.35);
}

.reports-filter-row /deep/ .custom-select:focus,
.reports-filter-row >>> .custom-select:focus,
.reports-filter-row::v-deep .custom-select:focus {
  border-color: rgba(181, 133, 34, 0.7);
  box-shadow: 0 0 0 3px rgba(181, 133, 34, 0.16);
}

.reports-refresh-btn {
  height: 38px;
  border-radius: 10px;
}

.reports-refresh-btn.btn-outline-primary {
  color: #8c1515;
  border-color: #8c1515;
}

.reports-refresh-btn.btn-outline-primary:hover {
  color: #ffffff;
  background: #8c1515;
  border-color: #8c1515;
}

.table-surface {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(140, 21, 21, 0.14);
  overflow: hidden;
}

.no-table-divider /deep/ .table,
.no-table-divider >>> .table,
.no-table-divider::v-deep .table,
.no-table-divider /deep/ .table thead th,
.no-table-divider >>> .table thead th,
.no-table-divider::v-deep .table thead th,
.no-table-divider /deep/ .table thead tr,
.no-table-divider >>> .table thead tr,
.no-table-divider::v-deep .table thead tr,
.no-table-divider /deep/ .table thead,
.no-table-divider >>> .table thead,
.no-table-divider::v-deep .table thead,
.no-table-divider /deep/ .table-responsive,
.no-table-divider >>> .table-responsive,
.no-table-divider::v-deep .table-responsive {
  border-top: 0 !important;
}

.table-surface /deep/ .table,
.table-surface >>> .table,
.table-surface::v-deep .table {
  margin-bottom: 0;
}

.table-surface /deep/ .table thead th,
.table-surface >>> .table thead th,
.table-surface::v-deep .table thead th {
  background: linear-gradient(90deg, #8c1515, rgba(107, 15, 15, 0.98)) !important;
  color: #ffffff !important;
  font-weight: 800 !important;
  text-align: center !important;
  border-bottom: 0 !important;
  border-right: 1px solid rgba(254, 194, 96, 0.5) !important;
}

.table-surface /deep/ .table thead th:last-child,
.table-surface >>> .table thead th:last-child,
.table-surface::v-deep .table thead th:last-child {
  border-right: 0;
}

.table-surface /deep/ .table tbody td,
.table-surface >>> .table tbody td,
.table-surface::v-deep .table tbody td {
  border-bottom: 1px solid rgba(140, 21, 21, 0.12) !important;
  border-right: 1px solid rgba(140, 21, 21, 0.12) !important;
  vertical-align: middle !important;
}

.table-surface /deep/ .table tbody td:last-child,
.table-surface >>> .table tbody td:last-child,
.table-surface::v-deep .table tbody td:last-child {
  border-right: 0;
}

.table-surface /deep/ .table tbody tr:hover,
.table-surface >>> .table tbody tr:hover,
.table-surface::v-deep .table tbody tr:hover {
  background: rgba(254, 194, 96, 0.22) !important;
}

.report-progress {
  background: rgba(181, 133, 34, 0.14);
}

/* ── Hero ─────────────────────────────────────────────────────────────── */
.reports-hero {
  border: 0;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, #8c1515 0%, #b25b25 55%, #fec260 130%);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.14);
}

.reports-hero__body {
  padding: 22px 24px;
}

.reports-hero__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.reports-hero__pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.08em;
  background: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.92);
  width: fit-content;
  margin-bottom: 8px;
}

.reports-hero__title {
  color: #ffffff;
  margin: 0 0 4px 0;
  font-weight: 900;
  letter-spacing: -0.01em;
}

.reports-hero__subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.88);
  font-weight: 500;
}

.reports-hero__right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.reports-hero__btn {
  border-radius: 12px;
  border-color: rgba(255, 255, 255, 0.55) !important;
  color: rgba(255, 255, 255, 0.94) !important;
  background: rgba(255, 255, 255, 0.06) !important;
}

.reports-hero__btn:hover {
  background: rgba(255, 255, 255, 0.14) !important;
}

/* ── KPI ─────────────────────────────────────────────────────────────── */
.report-kpi {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(140, 21, 21, 0.14);
  padding: 14px 16px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
}

.report-kpi::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--kpi-accent, #8c1515), rgba(197, 155, 58, 0.65));
}

.report-kpi__label {
  color: #6b7280;
  font-weight: 600;
}

.report-kpi__value {
  font-size: 1.7rem;
  font-weight: 900;
  line-height: 1.1;
  margin-top: 6px;
  color: #111827;
}

.report-kpi--neutral { --kpi-accent: #8c1515; }
.report-kpi--primary { --kpi-accent: #8c1515; }
.report-kpi--success { --kpi-accent: #16a34a; }
.report-kpi--warning { --kpi-accent: #f59e0b; }
.report-kpi--danger { --kpi-accent: #dc2626; }
.report-kpi--info { --kpi-accent: #0ea5e9; }

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
