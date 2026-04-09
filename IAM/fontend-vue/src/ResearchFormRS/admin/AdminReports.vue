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
            <div class="report-kpi__left">
              <span class="report-kpi__icon-wrap"><CIcon name="cil-layers" class="report-kpi__icon" /></span>
              <small class="report-kpi__label">โครงการทั้งหมด</small>
            </div>
            <div class="report-kpi__right"><span class="report-kpi__value">{{ totalProjects }}</span></div>
          </div>
        </CCol>
        <CCol sm="6" lg="3" class="mb-3">
          <div class="report-kpi report-kpi--success">
            <div class="report-kpi__left">
              <span class="report-kpi__icon-wrap"><CIcon name="cil-check-circle" class="report-kpi__icon" /></span>
              <small class="report-kpi__label">อนุมัติแล้ว</small>
            </div>
            <div class="report-kpi__right"><span class="report-kpi__value">{{ approvedCount }}</span></div>
          </div>
        </CCol>
        <CCol sm="6" lg="3" class="mb-3">
          <div class="report-kpi report-kpi--warning">
            <div class="report-kpi__left">
              <span class="report-kpi__icon-wrap"><CIcon name="cil-clock" class="report-kpi__icon" /></span>
              <small class="report-kpi__label">รอพิจารณา</small>
            </div>
            <div class="report-kpi__right"><span class="report-kpi__value">{{ pendingCount }}</span></div>
          </div>
        </CCol>
        <CCol sm="6" lg="3" class="mb-3">
          <div class="report-kpi report-kpi--danger">
            <div class="report-kpi__left">
              <span class="report-kpi__icon-wrap"><CIcon name="cil-x-circle" class="report-kpi__icon" /></span>
              <small class="report-kpi__label">ปฏิเสธ</small>
            </div>
            <div class="report-kpi__right"><span class="report-kpi__value">{{ rejectedCount }}</span></div>
          </div>
        </CCol>
      </CRow>

      <CRow class="mb-4">
        <CCol sm="6" lg="4" class="mb-3">
          <div class="report-kpi report-kpi--info">
            <div class="report-kpi__left">
              <span class="report-kpi__icon-wrap"><CIcon name="cil-chart-pie" class="report-kpi__icon" /></span>
              <small class="report-kpi__label">อัตราอนุมัติ</small>
            </div>
            <div class="report-kpi__right"><span class="report-kpi__value">{{ approvalRate }}%</span></div>
          </div>
        </CCol>
        <CCol sm="6" lg="4" class="mb-3">
          <div class="report-kpi report-kpi--revision">
            <div class="report-kpi__left">
              <span class="report-kpi__icon-wrap"><CIcon name="cil-pencil" class="report-kpi__icon" /></span>
              <small class="report-kpi__label">รอแก้ไข</small>
            </div>
            <div class="report-kpi__right"><span class="report-kpi__value">{{ reportSummary.revision_requested || 0 }}</span></div>
          </div>
        </CCol>
        <CCol sm="6" lg="4" class="mb-3">
          <div class="report-kpi report-kpi--primary">
            <div class="report-kpi__left">
              <span class="report-kpi__icon-wrap"><CIcon name="cil-bullhorn" class="report-kpi__icon" /></span>
              <small class="report-kpi__label">ประกาศแล้ว</small>
            </div>
            <div class="report-kpi__right"><span class="report-kpi__value">{{ reportSummary.announced || 0 }}</span></div>
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
import * as XLSX from 'xlsx'
import {
  PROPOSAL_STATUS_COLORS_COREUI_ADMIN as STATUS_COLORS,
  PROPOSAL_STATUS_KEYS_REPORT as STATUS_KEYS,
  PROPOSAL_STATUS_LABELS_TH_ADMIN as STATUS_LABELS,
  getCoreUiColorHex,
  normalizeProposalStatus
} from '@/ResearchFormRS/constants/proposalWorkflow'
import { loadResearchFormRuntimeConfigs } from '@/ResearchFormRS/utils/researchConfigRuntime'
import centerLoadingMixin from '@/ResearchFormRS/utils/centerLoadingMixin'

const FINAL_PROPOSAL_STATUSES = Object.freeze(['approved', 'rejected', 'announced'])
const DEFAULT_PAGE_SIZE = 200

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
      const currentYear = new Date().getFullYear()
      const years = new Set([currentYear, currentYear - 1, currentYear - 2])
      this.proposals.forEach((proposal) => {
        const fiscalYear = Number(proposal && proposal.fiscalYear)
        if (Number.isFinite(fiscalYear) && fiscalYear > 0) years.add(fiscalYear)
      })
      this.approvedProposals.forEach((proposal) => {
        const fiscalYear = Number(proposal && proposal.fiscalYear)
        if (Number.isFinite(fiscalYear) && fiscalYear > 0) years.add(fiscalYear)
      })

      return [
        { value: '', label: 'ทั้งหมด' },
        ...Array.from(years).sort((left, right) => right - left).map((year) => ({ value: year, label: String(year) }))
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
      if (this.filterYear || this.filterStatus || !this.hasSummaryData(this.summary)) {
        return this.buildSummaryFromProposals(this.proposals)
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
      return STATUS_KEYS.reduce((sum, key) => {
        if (FINAL_PROPOSAL_STATUSES.includes(key)) return sum
        return sum + (Number(this.reportSummary[key]) || 0)
      }, 0)
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
        this.summary = this.normalizeSummaryPayload(payload)
      } catch (error) {
        console.error('[AdminReports] Error fetching summary:', error)
        this.summary = {}
      }
    },
    async fetchProposals () {
      try {
        const list = await this.fetchAllProposalPages({
          fiscalYear: this.filterYear || null,
          status: this.filterStatus || null
        })
        this.proposals = list
      } catch (error) {
        console.error('[AdminReports] Error fetching proposals:', error)
        this.proposals = []
      }
    },
    async fetchAllProposalPages ({ fiscalYear = null, status = null } = {}) {
      const params = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      }
      if (status) params.status = status
      if (fiscalYear) params.fiscalYear = fiscalYear

      const firstResponse = await axios.get('/api/v1/proposals', { params })
      const firstPayload = (firstResponse && firstResponse.data && firstResponse.data.data) || {}
      const firstList = this.extractProposalList(firstPayload)
      const totalPages = Math.max(1, Number(firstPayload.totalPages) || 1)

      if (totalPages === 1) return firstList

      const requests = []
      for (let page = 2; page <= totalPages; page += 1) {
        requests.push(axios.get('/api/v1/proposals', { params: { ...params, page } }))
      }

      const responses = await Promise.all(requests)
      return responses.reduce((accumulator, response) => {
        const payload = (response && response.data && response.data.data) || {}
        return accumulator.concat(this.extractProposalList(payload))
      }, firstList)
    },
    extractProposalList (payload) {
      const list = Array.isArray(payload.proposals)
        ? payload.proposals
        : (Array.isArray(payload.data) ? payload.data : [])

      return list.map((item) => ({
        ...item,
        currentStatus: normalizeProposalStatus(item && item.currentStatus),
        fiscalYear: item && item.fiscalYear ? item.fiscalYear : '',
        fundingType: item && item.fundingType ? item.fundingType : 'ไม่ระบุ'
      }))
    },
    normalizeSummaryPayload (payload = {}) {
      const summary = {}
      STATUS_KEYS.forEach((key) => {
        summary[key] = Number(payload[key]) || 0
      })
      return summary
    },
    buildSummaryFromProposals (proposals = []) {
      const summary = this.normalizeSummaryPayload()
      proposals.forEach((proposal) => {
        const status = normalizeProposalStatus(proposal && proposal.currentStatus)
        if (Object.prototype.hasOwnProperty.call(summary, status)) {
          summary[status] += 1
        }
      })
      return summary
    },
    hasSummaryData (payload = {}) {
      return STATUS_KEYS.some((key) => Number(payload[key]) > 0)
    },
    async fetchApproved () {
      try {
        this.approvedProposals = await this.fetchApprovedProposalRows({ fiscalYear: this.filterYear || null })
      } catch (error) {
        console.error('[AdminReports] Error fetching approved proposals:', error)
        this.approvedProposals = []
      }
    },
    async fetchApprovedProposalRows ({ fiscalYear = null } = {}) {
      const params = {
        status: 'approved',
        limit: 10,
        page: 1,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      }
      if (fiscalYear) params.fiscalYear = fiscalYear
      const response = await axios.get('/api/v1/proposals', { params })
      const payload = (response && response.data && response.data.data) || {}
      return this.extractProposalList(payload)
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
      if (this.exportForm.sendEmail && !this.isValidEmail(this.exportForm.emailAddress)) {
        await Swal.fire({ icon: 'warning', title: 'อีเมลไม่ถูกต้อง', text: 'กรุณากรอกอีเมลผู้รับให้ถูกต้องก่อน Export' })
        return
      }

      this.exportLoading = true
      try {
        const serverResult = await this.requestServerExport()
        if (!serverResult || !serverResult.downloadUrl) throw new Error('server_export_unavailable')

        window.open(this.toAbsoluteUrl(serverResult.downloadUrl), '_blank', 'noopener,noreferrer')
        await Swal.fire({
          icon: 'success',
          title: 'Export สำเร็จ',
          text: serverResult.emailed
            ? 'ระบบสร้างไฟล์รายงานและส่งอีเมลแนบไฟล์ให้แล้ว'
            : 'ระบบสร้างไฟล์รายงานจากเซิร์ฟเวอร์ให้เรียบร้อยแล้ว'
        })
        this.closeExportModal()
      } catch (error) {
        console.error('[AdminReports] Server export failed, fallback to local export:', error)
        try {
          const exportContext = await this.buildExportContext()
          if (this.exportForm.format === 'excel') {
            this.exportAsExcel(exportContext)
          } else {
            this.exportAsPrintablePdf(exportContext)
          }

          if (this.exportForm.sendEmail) this.openMailClientForExport()

          await Swal.fire({
            icon: 'success',
            title: 'Export สำเร็จ',
            text: this.exportForm.sendEmail
              ? 'เซิร์ฟเวอร์ยังส่งอีเมลให้ไม่ได้ จึงสร้างไฟล์ในเครื่องและเปิดหน้าอีเมลให้แทน'
              : 'เซิร์ฟเวอร์ไม่พร้อม จึงสร้างไฟล์ในเครื่องให้แทนเรียบร้อยแล้ว'
          })
          this.closeExportModal()
        } catch (fallbackError) {
          console.error('[AdminReports] Export fallback failed:', fallbackError)
          await Swal.fire({ icon: 'error', title: 'Export ไม่สำเร็จ', text: 'ไม่สามารถสร้างไฟล์รายงานได้ กรุณาลองใหม่อีกครั้ง' })
        }
      } finally {
        this.exportLoading = false
      }
    },
    async requestServerExport () {
      const response = await axios.post('/api/v1/reports/export', {
        type: this.exportForm.format,
        fiscalYear: this.exportForm.fiscalYear || null,
        status: this.exportForm.status || null,
        includeCharts: this.exportForm.format === 'pdf' ? this.exportForm.includeCharts : false,
        sendEmail: this.exportForm.sendEmail,
        emailAddress: this.exportForm.sendEmail ? this.exportForm.emailAddress : null
      })
      return response && response.data && response.data.data ? response.data.data : null
    },
    async buildExportContext () {
      const fiscalYear = this.exportForm.fiscalYear || null
      const status = this.exportForm.status || null
      const isCurrentYear = String(fiscalYear || '') === String(this.filterYear || '')
      const isCurrentStatus = String(status || '') === String(this.filterStatus || '')

      if (isCurrentYear && isCurrentStatus) {
        return {
          usesCurrentView: true,
          proposals: this.proposals,
          summary: this.reportSummary,
          approvedProposals: this.approvedProposals,
          totalProjects: this.totalProjects,
          approvedCount: this.approvedCount,
          pendingCount: this.pendingCount,
          rejectedCount: this.rejectedCount,
          approvalRate: this.approvalRate,
          summaryTableRows: this.summaryTableRows
        }
      }

      const proposals = await this.fetchAllProposalPages({ fiscalYear, status })
      const summary = this.buildSummaryFromProposals(proposals)
      const totalProjects = STATUS_KEYS.reduce((sum, key) => sum + (Number(summary[key]) || 0), 0)
      const approvedCount = Number(summary.approved) || 0
      const rejectedCount = Number(summary.rejected) || 0
      const pendingCount = STATUS_KEYS.reduce((sum, key) => {
        if (FINAL_PROPOSAL_STATUSES.includes(key)) return sum
        return sum + (Number(summary[key]) || 0)
      }, 0)
      const approvalRate = approvedCount + rejectedCount > 0
        ? ((approvedCount / (approvedCount + rejectedCount)) * 100).toFixed(1)
        : '0.0'
      const summaryTableRows = STATUS_KEYS.map((proposalStatus) => {
        const count = Number(summary[proposalStatus]) || 0
        return {
          status: proposalStatus,
          label: STATUS_LABELS[proposalStatus] || proposalStatus,
          count,
          percent: totalProjects ? (count / totalProjects) * 100 : 0,
          color: this.getStatusColorValue(proposalStatus)
        }
      })

      return {
        usesCurrentView: false,
        proposals,
        summary,
        approvedProposals: await this.fetchApprovedProposalRows({ fiscalYear }),
        totalProjects,
        approvedCount,
        pendingCount,
        rejectedCount,
        approvalRate,
        summaryTableRows
      }
    },
    exportAsExcel (context) {
      const workbook = XLSX.utils.book_new()

      const overviewRows = [
        ['ตัวชี้วัด', 'ค่า'],
        ['โครงการทั้งหมด', context.totalProjects],
        ['อนุมัติแล้ว', context.approvedCount],
        ['รอพิจารณา', context.pendingCount],
        ['ปฏิเสธ', context.rejectedCount],
        ['อัตราอนุมัติ (%)', context.approvalRate],
        ['รอแก้ไข', Number(context.summary.revision_requested) || 0],
        ['ประกาศแล้ว', Number(context.summary.announced) || 0]
      ]

      const summaryRows = [
        ['สถานะ', 'จำนวน', '% จากทั้งหมด'],
        ...context.summaryTableRows.map((row) => [row.label, row.count, Number(row.percent.toFixed(1))])
      ]

      const approvedRows = [
        ['Proposal Code', 'ชื่อโครงการ', 'ปีงบ', 'ประเภททุน', 'วันที่อนุมัติ'],
        ...context.approvedProposals.map((item) => [
          item.proposalCode || '-',
          item.projectTitleTh || '-',
          item.fiscalYear || '-',
          item.fundingType || 'ไม่ระบุ',
          this.formatDate(item.approvedAt || item.updatedAt)
        ])
      ]

      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(overviewRows), 'Overview')
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), 'Status Summary')
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(approvedRows), 'Approved Projects')

      XLSX.writeFile(workbook, `${this.buildExportFileName('xlsx')}`)
    },
    exportAsPrintablePdf (context) {
      const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900')
      if (!printWindow) throw new Error('popup_blocked')

      const charts = this.exportForm.includeCharts && context.usesCurrentView ? this.captureChartImages() : []
      const html = this.buildPrintableReportHtml(context, charts)
      printWindow.document.open()
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      printWindow.onload = () => {
        printWindow.print()
      }
    },
    captureChartImages () {
      return Array.from(this.$el.querySelectorAll('canvas')).map((canvas, index) => ({
        id: `chart-${index + 1}`,
        title: index === 0
          ? 'สัดส่วนสถานะโครงการ'
          : (index === 1 ? 'จำนวนโครงการตามประเภททุน' : 'แนวโน้มการยื่นโครงการ'),
        src: typeof canvas.toDataURL === 'function' ? canvas.toDataURL('image/png') : ''
      })).filter((item) => item.src)
    },
    buildPrintableReportHtml (context, charts = []) {
      const summaryRows = context.summaryTableRows.map((row) => `
        <tr>
          <td>${this.escapeHtml(row.label)}</td>
          <td style="text-align:right;">${row.count}</td>
          <td style="text-align:right;">${row.percent.toFixed(1)}%</td>
        </tr>
      `).join('')

      const approvedRows = context.approvedProposals.map((item) => `
        <tr>
          <td>${this.escapeHtml(item.proposalCode || '-')}</td>
          <td>${this.escapeHtml(item.projectTitleTh || '-')}</td>
          <td style="text-align:center;">${this.escapeHtml(String(item.fiscalYear || '-'))}</td>
          <td>${this.escapeHtml(item.fundingType || 'ไม่ระบุ')}</td>
          <td style="text-align:center;">${this.escapeHtml(this.formatDate(item.approvedAt || item.updatedAt))}</td>
        </tr>
      `).join('')

      const chartSection = charts.length > 0
        ? `<div class="charts">${charts.map((chart) => `
            <section class="chart-card">
              <h3>${this.escapeHtml(chart.title)}</h3>
              <img src="${chart.src}" alt="${this.escapeHtml(chart.title)}" />
            </section>
          `).join('')}</div>`
        : ''

      return `<!doctype html>
      <html lang="th">
        <head>
          <meta charset="utf-8" />
          <title>รายงานโครงการวิจัย</title>
          <style>
            body { font-family: Tahoma, Arial, sans-serif; margin: 24px; color: #1f2937; }
            h1 { margin: 0 0 8px; color: #8c1515; }
            h2 { margin: 24px 0 12px; color: #6b0f0f; }
            h3 { margin: 0 0 10px; color: #374151; font-size: 16px; }
            .meta { margin-bottom: 16px; color: #4b5563; }
            .kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 18px 0 24px; }
            .kpi { border: 1px solid #e5e7eb; border-top: 4px solid #8c1515; border-radius: 10px; padding: 12px; }
            .kpi small { display: block; color: #6b7280; margin-bottom: 6px; }
            .kpi strong { font-size: 24px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e5e7eb; padding: 10px 12px; }
            th { background: #8c1515; color: #fff; text-align: left; }
            .charts { display: grid; gap: 16px; margin-top: 16px; }
            .chart-card { page-break-inside: avoid; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
            .chart-card img { max-width: 100%; height: auto; display: block; }
            @media print { body { margin: 12px; } .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
          </style>
        </head>
        <body>
          <h1>รายงานโครงการวิจัย</h1>
          <div class="meta">สร้างเมื่อ ${this.escapeHtml(this.formatDate(new Date().toISOString()))}</div>
          <div class="kpis">
            <div class="kpi"><small>โครงการทั้งหมด</small><strong>${context.totalProjects}</strong></div>
            <div class="kpi"><small>อนุมัติแล้ว</small><strong>${context.approvedCount}</strong></div>
            <div class="kpi"><small>รอพิจารณา</small><strong>${context.pendingCount}</strong></div>
            <div class="kpi"><small>ปฏิเสธ</small><strong>${context.rejectedCount}</strong></div>
          </div>
          ${chartSection}
          <h2>สรุปตามสถานะ</h2>
          <table>
            <thead><tr><th>สถานะ</th><th>จำนวน</th><th>% จากทั้งหมด</th></tr></thead>
            <tbody>${summaryRows}</tbody>
          </table>
          <h2>โครงการที่ผ่านการอนุมัติล่าสุด</h2>
          <table>
            <thead><tr><th>Proposal Code</th><th>ชื่อโครงการ</th><th>ปีงบ</th><th>ประเภททุน</th><th>วันที่อนุมัติ</th></tr></thead>
            <tbody>${approvedRows || '<tr><td colspan="5">ยังไม่มีข้อมูล</td></tr>'}</tbody>
          </table>
        </body>
      </html>`
    },
    buildExportFileName (extension) {
      const parts = ['research-report']
      if (this.exportForm.fiscalYear) parts.push(`fy-${this.exportForm.fiscalYear}`)
      if (this.exportForm.status) parts.push(normalizeProposalStatus(this.exportForm.status))
      parts.push(new Date().toISOString().slice(0, 10))
      return `${parts.join('-')}.${extension}`
    },
    openMailClientForExport () {
      const subject = encodeURIComponent('รายงานโครงการวิจัย')
      const body = encodeURIComponent('แนบไฟล์รายงานที่ระบบสร้างไว้แล้ว และส่งต่อให้ผู้รับได้เลย')
      const recipient = String(this.exportForm.emailAddress || '').trim()
      window.open(`mailto:${recipient}?subject=${subject}&body=${body}`, '_self')
    },
    isValidEmail (email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
    },
    escapeHtml (value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
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
  background: #ffffff;
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
  border: 0;
  border-radius: 0.5rem;
  padding: 14px 16px;
  overflow: hidden;
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-shadow: none;
  background: linear-gradient(135deg, var(--kpi-start), var(--kpi-end));
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.report-kpi:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.18);
}

/* SVG graphic top-right */
.report-kpi::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image: var(--kpi-graphic);
  background-repeat: no-repeat;
  background-size: 122px 122px;
  background-position: calc(100% + 10px) -12px;
  opacity: 0.22;
  pointer-events: none;
  z-index: 1;
}
/* Gloss overlay */
.report-kpi::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 60%);
  pointer-events: none;
  z-index: 1;
}
.report-kpi > * { position: relative; z-index: 2; }

/* Color + graphic variants */
.report-kpi--neutral {
  --kpi-start: #6b7280; --kpi-end: #4b5563;
  --kpi-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect x='24' y='22' width='72' height='76' rx='12' fill='white' fill-opacity='0.9'/%3E%3Crect x='38' y='40' width='44' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3Crect x='38' y='54' width='40' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3Crect x='38' y='68' width='33' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3C/svg%3E");
}
.report-kpi--success {
  --kpi-start: #16a34a; --kpi-end: #15803d;
  --kpi-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M46 61l9 9 20-20' stroke='%23000000' stroke-width='8' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.24' fill='none'/%3E%3Ccircle cx='60' cy='60' r='44' stroke='white' stroke-opacity='0.42' stroke-width='5' fill='none'/%3E%3C/svg%3E");
}
.report-kpi--warning {
  --kpi-start: #f59e0b; --kpi-end: #d97706;
  --kpi-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M60 42v18l14 10' stroke='%23000000' stroke-width='7' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.22' fill='none'/%3E%3C/svg%3E");
}
.report-kpi--danger {
  --kpi-start: #dc2626; --kpi-end: #b91c1c;
  --kpi-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M48 48l24 24M72 48L48 72' stroke='%23000000' stroke-width='8' stroke-linecap='round' stroke-opacity='0.24' fill='none'/%3E%3C/svg%3E");
}
.report-kpi--info {
  --kpi-start: #0ea5e9; --kpi-end: #0284c7;
  --kpi-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Ccircle cx='60' cy='48' r='4' fill='%23000000' fill-opacity='0.2'/%3E%3Cline x1='60' y1='58' x2='60' y2='76' stroke='%23000000' stroke-width='7' stroke-linecap='round' stroke-opacity='0.2'/%3E%3Ccircle cx='60' cy='60' r='44' stroke='white' stroke-opacity='0.35' stroke-width='5' fill='none'/%3E%3C/svg%3E");
}
.report-kpi--revision {
  --kpi-start: #7c3aed; --kpi-end: #5b21b6;
  --kpi-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect x='30' y='28' width='60' height='64' rx='8' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M70 38 L78 46 L56 68 L46 70 L48 60 Z' fill='%23000000' fill-opacity='0.18'/%3E%3C/svg%3E");
}
.report-kpi--primary {
  --kpi-start: #8c1515; --kpi-end: #6b0f0f;
  --kpi-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Cpath d='M82 34 L44 50 L30 50 L30 70 L44 70 L82 86 Z' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M44 70 L48 88 L56 88 L52 70 Z' fill='white' fill-opacity='0.7'/%3E%3Cellipse cx='90' cy='60' rx='10' ry='18' fill='white' fill-opacity='0.5'/%3E%3C/svg%3E");
}

/* Left: circle icon + label */
.report-kpi__left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.report-kpi__icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.32);
  box-shadow: 0 4px 12px rgba(16,24,40,0.12);
  transition: transform 0.12s ease;
  color: rgba(255,255,255,0.98);
}
.report-kpi:hover .report-kpi__icon-wrap {
  transform: translateY(-3px);
}
.report-kpi__icon {
  font-size: 1.6rem;
  display: inline-block;
  line-height: 1;
}
.report-kpi__label {
  font-size: 0.82rem;
  color: rgba(255,255,255,0.9);
  font-weight: 600;
}

/* Right: value */
.report-kpi__right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.report-kpi__value {
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1;
  color: rgba(255,255,255,0.98);
  text-shadow: 0 2px 8px rgba(0,0,0,0.18);
  text-align: right;
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
