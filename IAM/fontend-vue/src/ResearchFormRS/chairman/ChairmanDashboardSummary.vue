<template>
  <div class="chairman-summary-page">
    <div class="page-hero mb-4">
      <div class="hero-title">
        <span class="hero-icon" aria-hidden="true">
          <CIcon name="cil-speedometer" width="34" height="34" />
        </span>
        <div>
          <h2>{{ $t('chairman.dashboard.title') }}</h2>
          <div class="subtext">{{ $t('chairman.dashboard.subtitle') }}</div>
        </div>
      </div>
      <div class="hero-actions mt-1">
        <div class="filter-bar">
          <div class="filter-bar__selects">
            <vSelect
              class="filter-select"
              :options="roundFilterOptions"
              label="label"
              :reduce="o => o.value"
              :clearable="false"
              :searchable="false"
              :value="filterRound"
              @input="onRoundChange"
            />
            <vSelect
              class="filter-select"
              :options="fundTypeFilterOptions"
              label="label"
              :reduce="o => o.value"
              :clearable="false"
              :searchable="false"
              :value="filterFundType"
              @input="onFundTypeChange"
            />
            <vSelect
              class="filter-select"
              :options="decisionFilterOptions"
              label="label"
              :reduce="o => o.value"
              :clearable="false"
              :searchable="false"
              :value="filterDecision"
              @input="onDecisionChange"
            />
          </div>

          <div class="filter-bar__actions">
            <CButton
              size="sm"
              color="secondary"
              variant="outline"
              class="filter-btn"
              :disabled="loading || filteredAssignedProposals.length === 0"
              @click="exportOverviewCsv"
            >
              <CIcon name="cil-cloud-download" class="mr-1" />
              {{ $t('chairman.dashboard.exportCsv') }}
            </CButton>
          </div>
        </div>
      </div>
    </div>

    <CRow class="mb-3">
      <CCol sm="6" lg="3" class="mb-2">
        <div class="kpi-card kpi-card--all">
          <small class="kpi-label">{{ $t('chairman.dashboard.kpi.total') }}</small>
          <div class="kpi-number">{{ proposalKpis.total }}</div>
          <div class="kpi-note">{{ $t('chairman.dashboard.kpi.totalNote') }}</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3" class="mb-2">
        <div class="kpi-card kpi-card--pending">
          <small class="kpi-label">{{ $t('chairman.dashboard.kpi.pending') }}</small>
          <div class="kpi-number">{{ proposalKpis.pending }}</div>
          <div class="kpi-note">{{ $t('chairman.dashboard.kpi.pendingNote') }}</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3" class="mb-2">
        <div class="kpi-card kpi-card--approved">
          <small class="kpi-label">{{ $t('chairman.dashboard.kpi.approved') }}</small>
          <div class="kpi-number">{{ proposalKpis.approved }}</div>
          <div class="kpi-note">{{ $t('chairman.dashboard.kpi.approvedNote') }}</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3" class="mb-2">
        <div class="kpi-card kpi-card--rejected">
          <small class="kpi-label">{{ $t('chairman.dashboard.kpi.rejected') }}</small>
          <div class="kpi-number">{{ proposalKpis.rejected }}</div>
          <div class="kpi-note">{{ $t('chairman.dashboard.kpi.rejectedNote') }}</div>
        </div>
      </CCol>
    </CRow>

    <div class="dashboard-grid mb-3">

      <!-- Row 1, Col 1: ภาพรวมผลการพิจารณา -->
      <CCard>
        <CCardHeader class="font-weight-bold">{{ $t('chairman.dashboard.decision.title') }}</CCardHeader>
        <CCardBody>
          <div class="decision-layout">
            <div class="decision-left">
              <div class="decision-grid">
                <div class="decision-item decision-item--approve">
                  <div class="decision-item__label">{{ $t('chairman.dashboard.decision.approve') }}</div>
                  <div class="decision-item__value">{{ decisionStats.approve }}</div>
                  <CProgress class="progress-xs" color="success" :value="decisionStats.approvePct" />
                </div>
                <div class="decision-item decision-item--pending">
                  <div class="decision-item__label">{{ $t('chairman.dashboard.decision.pending') }}</div>
                  <div class="decision-item__value">{{ decisionStats.pending }}</div>
                  <CProgress class="progress-xs" color="warning" :value="decisionStats.pendingPct" />
                </div>
                <div class="decision-item decision-item--reject">
                  <div class="decision-item__label">{{ $t('chairman.dashboard.decision.reject') }}</div>
                  <div class="decision-item__value">{{ decisionStats.reject }}</div>
                  <CProgress class="progress-xs" color="danger" :value="decisionStats.rejectPct" />
                </div>
              </div>
              <div class="text-muted small mt-2">{{ $t('chairman.dashboard.decision.total', { count: decisionStats.total }) }}</div>
            </div>
            <div class="decision-right">
              <div class="chart-title chart-title--tight">{{ $t('chairman.dashboard.decision.chartTitle') }}</div>
              <div v-if="decisionStats.total === 0" class="text-muted small text-center py-3">
                {{ $t('chairman.dashboard.decision.empty') }}
              </div>
              <div v-else class="chart-wrap chart-wrap--doughnut">
                <CChartDoughnut
                  :datasets="decisionDoughnut.datasets"
                  :labels="decisionDoughnut.labels"
                  :options="doughnutOptions"
                />
              </div>
            </div>
          </div>
        </CCardBody>
      </CCard>

      <!-- Row 1, Col 2: ความคืบหน้าการพิจารณา -->
      <CCard>
        <CCardHeader class="font-weight-bold">{{ $t('chairman.dashboard.progress.title') }}</CCardHeader>
        <CCardBody>
          <div class="score-row">
            <div class="score-box">
              <div class="score-box__label">{{ $t('chairman.dashboard.progress.completion') }}</div>
              <div class="score-box__value">{{ progressStats.completionRateDisplay }}</div>
              <CProgress class="mt-1" color="warning" :value="progressStats.completionRate" />
            </div>
            <div class="stale-box">
              <div class="stale-box__label">{{ $t('chairman.dashboard.progress.pending') }}</div>
              <div class="stale-box__value">{{ staleStats.pending }}</div>
              <div class="stale-box__sub">
                {{ $t('chairman.dashboard.progress.over7') }} <strong>{{ staleStats.over7Days }}</strong> |
                {{ $t('chairman.dashboard.progress.over14') }} <strong>{{ staleStats.over14Days }}</strong>
              </div>
            </div>
          </div>
        </CCardBody>
      </CCard>

      <!-- Row 2, Col 1: สถานะข้อเสนอที่เกี่ยวข้อง -->
      <CCard>
        <CCardHeader class="font-weight-bold">{{ $t('chairman.dashboard.proposalStatus.title') }}</CCardHeader>
        <CCardBody>
          <div v-if="loading" class="text-center py-4">
            <CSpinner color="primary" size="sm" />
            <span class="text-muted ml-2">{{ $t('chairman.dashboard.proposalStatus.loading') }}</span>
          </div>
          <div v-else-if="fetchError" class="text-center py-4">
            <div class="text-danger mb-2">{{ $t('chairman.dashboard.proposalStatus.loadErrorTitle') }}</div>
            <small class="text-muted">{{ fetchError }}</small>
          </div>
          <div v-else>
            <div class="chart-wrap chart-wrap--doughnut">
              <CChartDoughnut
                :datasets="proposalDoughnut.datasets"
                :labels="proposalDoughnut.labels"
                :options="doughnutOptions"
              />
            </div>
            <div class="status-breakdown-list mt-3">
              <div
                v-for="item in chairmanStatusBreakdown.items"
                :key="item.key"
                class="status-breakdown-item"
              >
                <span class="status-breakdown-dot" :style="{ backgroundColor: item.color }" />
                <span class="status-breakdown-label">{{ item.label }}</span>
                <span class="status-breakdown-count">{{ item.count }}</span>
              </div>
            </div>
          </div>
        </CCardBody>
      </CCard>

      <!-- Row 2, Col 2: สรุปการประชุม -->
      <CCard>
        <CCardHeader class="font-weight-bold">{{ $t('chairman.dashboard.meetings.title') }}</CCardHeader>
        <CCardBody>
          <div v-if="meetingSummaryLoading" class="text-center py-4">
            <CSpinner color="primary" size="sm" />
            <span class="text-muted ml-2">{{ $t('chairman.dashboard.meetings.loading') }}</span>
          </div>
          <div v-else>
            <CRow class="mb-2">
              <CCol sm="6" class="mb-2 mb-sm-0">
                <div class="meeting-kpi meeting-kpi--scheduled">
                  <div class="meeting-kpi__label">{{ $t('chairman.dashboard.meetings.scheduled') }}</div>
                  <div class="meeting-kpi__value">{{ meetingSummary.scheduled }}</div>
                </div>
              </CCol>
              <CCol sm="6">
                <div class="meeting-kpi meeting-kpi--completed">
                  <div class="meeting-kpi__label">{{ $t('chairman.dashboard.meetings.completed') }}</div>
                  <div class="meeting-kpi__value">{{ meetingSummary.completed }}</div>
                </div>
              </CCol>
            </CRow>
            <CRow class="mb-2">
              <CCol sm="6" class="mb-2 mb-sm-0">
                <div class="meeting-kpi meeting-kpi--cancelled">
                  <div class="meeting-kpi__label">{{ $t('chairman.dashboard.meetings.cancelled') }}</div>
                  <div class="meeting-kpi__value">{{ meetingSummary.cancelled }}</div>
                </div>
              </CCol>
              <CCol sm="6">
                <div class="meeting-kpi meeting-kpi--total">
                  <div class="meeting-kpi__label">{{ $t('chairman.dashboard.meetings.total') }}</div>
                  <div class="meeting-kpi__value">{{ meetingSummary.total }}</div>
                </div>
              </CCol>
            </CRow>
            <div class="chart-wrap chart-wrap--bar">
              <CChartBar :datasets="meetingBar.datasets" :labels="meetingBar.labels" :options="meetingBar.options" />
            </div>
          </div>
        </CCardBody>
      </CCard>

    </div>
  </div>
</template>

<script>
import Service, { instance as axios } from '@/service/api'
import { CChartBar, CChartDoughnut } from '@coreui/vue-chartjs'
import {
  PROPOSAL_STATUS_COLORS_COREUI_BADGE as STATUS_COLORS,
  deriveProposalRoundNo,
  getCoreUiColorHex,
  normalizeProposalStatus
} from '@/ResearchFormRS/constants/proposalWorkflow'
import { loadResearchFormRuntimeConfigs } from '@/ResearchFormRS/utils/researchConfigRuntime'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import centerLoadingMixin from '@/ResearchFormRS/utils/centerLoadingMixin'

const CHAIRMAN_DASHBOARD_FLOW_STATUSES = Object.freeze([
  'faculty_review_pending',
  'faculty_approved',
  'faculty_rejected',
  'announced'
])

export default {
  name: 'ChairmanDashboardSummary',
  mixins: [centerLoadingMixin],
  components: { CChartBar, CChartDoughnut, vSelect },
  data() {
    return {
      loading: false,
      fetchError: null,
      proposalsRaw: [],
      myReviewsRaw: [],
      filterRound: 'all',
      filterFundType: 'all',
      filterDecision: 'all',
      runtimeConfigVersion: 0,
      meetingSummaryLoading: false,
      meetingSummary: {
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        total: 0
      }
    }
  },
  async mounted() {
    await loadResearchFormRuntimeConfigs()
    this.runtimeConfigVersion += 1
    await Promise.all([
      this.fetchAssignedProposals(),
      this.fetchMeetingSummary()
    ])
  },
  computed: {
    currentUser() {
      try {
        const raw = localStorage.getItem('auth_user')
        return raw ? JSON.parse(raw) : null
      } catch (e) {
        return null
      }
    },
    currentUserId() {
      const user = this.currentUser
      return user && user._id ? String(user._id) : ''
    },
    centerLoadingActive() {
      return Boolean(this.loading || this.meetingSummaryLoading)
    },
    assignedProposalsRaw() {
      if (!(this.currentUser && this.currentUser.role === 'chairman' && this.currentUserId)) {
        return this.proposalsRaw || []
      }

      return (this.proposalsRaw || []).filter((proposal) => this.hasChairmanAccessToProposal(proposal))
    },
    reviewMap() {
      const map = {}
      ;(this.myReviewsRaw || []).forEach((review) => {
        const proposalId = review && review.proposalId ? String(review.proposalId) : ''
        if (!proposalId) return
        const current = map[proposalId]
        if (!current) {
          map[proposalId] = review
          return
        }
        const currentTs = new Date(current.updatedAt || current.submittedAt || 0).getTime()
        const nextTs = new Date(review.updatedAt || review.submittedAt || 0).getTime()
        if (nextTs >= currentTs) map[proposalId] = review
      })
      return map
    },
    filteredAssignedProposals() {
      const rows = this.assignedProposalsRaw || []
      return rows.filter((proposal) => {
        const roundNo = this.deriveRoundNo(proposal)
        const fundTypeLabel = this.fundTypeLabel(proposal)
        const proposalId = proposal && proposal._id ? String(proposal._id) : ''
        const review = proposalId ? this.reviewMap[proposalId] : null
        const isReviewed = this.isChairmanReviewSubmitted(review && review.reviewStatus)
        const decision = String(review && review.decision ? review.decision : '')

        if (this.filterRound !== 'all') {
          const target = Number(this.filterRound)
          if (Number(roundNo) !== target) return false
        }

        if (this.filterFundType !== 'all') {
          if (String(fundTypeLabel || '-') !== String(this.filterFundType)) return false
        }

        if (this.filterDecision !== 'all') {
          if (this.filterDecision === 'none') return !isReviewed
          if (!isReviewed) return false
          return decision === String(this.filterDecision)
        }

        return true
      })
    },
    chairmanStatusBreakdown() {
      this.runtimeConfigVersion
      const rows = this.filteredAssignedProposals || []
      const counts = CHAIRMAN_DASHBOARD_FLOW_STATUSES.reduce((acc, key) => {
        acc[key] = 0
        return acc
      }, {})

      rows.forEach((proposal) => {
        const key = this.getChairmanFlowStatusKey(proposal)
        if (!key || !Object.prototype.hasOwnProperty.call(counts, key)) return
        counts[key] += 1
      })

      const labels = CHAIRMAN_DASHBOARD_FLOW_STATUSES.map((key) => this.getChairmanFlowStatusLabel(key))
      const semanticColors = CHAIRMAN_DASHBOARD_FLOW_STATUSES.map((key) => this.getChairmanFlowColorName(key))
      const backgroundColor = semanticColors.map((color) => getCoreUiColorHex(color, 0.28))
      const borderColor = semanticColors.map((color) => getCoreUiColorHex(color))
      const data = CHAIRMAN_DASHBOARD_FLOW_STATUSES.map((key) => counts[key] || 0)
      const items = CHAIRMAN_DASHBOARD_FLOW_STATUSES.map((key, index) => ({
        key,
        label: labels[index],
        color: borderColor[index],
        count: data[index]
      }))

      return {
        labels,
        backgroundColor,
        borderColor,
        data,
        items
      }
    },
    proposalKpis() {
      const rows = this.filteredAssignedProposals || []
      const counts = { total: rows.length, pending: 0, approved: 0, rejected: 0 }
      rows.forEach((proposal) => {
        const key = this.getChairmanFlowStatusKey(proposal)
        if (key === 'faculty_approved' || key === 'announced') counts.approved += 1
        else if (key === 'faculty_rejected') counts.rejected += 1
        else counts.pending += 1
      })
      return counts
    },
    proposalDoughnut() {
      return {
        labels: this.chairmanStatusBreakdown.labels,
        datasets: [
          {
            backgroundColor: this.chairmanStatusBreakdown.backgroundColor,
            borderColor: this.chairmanStatusBreakdown.borderColor,
            borderWidth: 1,
            data: this.chairmanStatusBreakdown.data
          }
        ]
      }
    },
    decisionStats() {
      const rows = this.filteredAssignedProposals || []
      const total = rows.length
      const approve = rows.filter((proposal) => this.getChairmanDecisionForProposal(proposal) === 'approve').length
      const reject = rows.filter((proposal) => this.getChairmanDecisionForProposal(proposal) === 'reject').length
      const pending = Math.max(0, total - approve - reject)
      const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0
      return {
        total,
        approve,
        reject,
        pending,
        approvePct: pct(approve),
        rejectPct: pct(reject),
        pendingPct: pct(pending)
      }
    },
    decisionDoughnut() {
      return {
        labels: [
          this.$t('chairman.dashboard.decision.approve'),
          this.$t('chairman.dashboard.decision.pending'),
          this.$t('chairman.dashboard.decision.reject')
        ],
        datasets: [
          {
            backgroundColor: ['rgba(22, 163, 74, 0.45)', 'rgba(181, 133, 34, 0.45)', 'rgba(185, 28, 28, 0.45)'],
            borderColor: ['rgba(22, 163, 74, 1)', 'rgba(181, 133, 34, 1)', 'rgba(185, 28, 28, 1)'],
            borderWidth: 1,
            data: [this.decisionStats.approve, this.decisionStats.pending, this.decisionStats.reject]
          }
        ]
      }
    },
    progressStats() {
      const total = this.proposalKpis.total
      const completed = this.proposalKpis.approved + this.proposalKpis.rejected
      const completionRate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0
      return {
        completionRate,
        completionRateDisplay: total > 0 ? `${completionRate}%` : '-'
      }
    },
    doughnutOptions() {
      return {
        maintainAspectRatio: false,
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 10,
            fontSize: 12
          }
        },
        tooltips: {
          callbacks: {
            label: function (tooltipItem, data) {
              const label = (data && data.labels && data.labels[tooltipItem.index]) ? data.labels[tooltipItem.index] : ''
              const value = (data && data.datasets && data.datasets[0] && Array.isArray(data.datasets[0].data))
                ? data.datasets[0].data[tooltipItem.index]
                : ''
              return `${label}: ${value}`
            }
          }
        }
      }
    },
    roundFilterOptions() {
      const rows = this.assignedProposalsRaw || []
      const rounds = Array.from(new Set(
        rows.map((proposal) => Number(this.deriveRoundNo(proposal))).filter((n) => Number.isFinite(n) && n > 0)
      )).sort((a, b) => a - b)
      const options = rounds.length > 0 ? rounds : [1]
      return [{ value: 'all', label: this.$t('chairman.dashboard.filters.allRounds') }].concat(
        options.map((round) => ({ value: round, label: this.$t('chairman.dashboard.filters.round', { round }) }))
      )
    },
    fundTypeFilterOptions() {
      const rows = this.assignedProposalsRaw || []
      const labels = rows.map((proposal) => String(this.fundTypeLabel(proposal) || '-'))
      const unique = Array.from(new Set(labels.filter(Boolean)))
      const ordered = [
        this.$t('chairman.dashboard.fundingTypes.newResearcher'),
        this.$t('chairman.dashboard.fundingTypes.researcherDevelopment'),
        this.$t('chairman.dashboard.fundingTypes.strategicResearch'),
        this.$t('chairman.dashboard.fundingTypes.industryExtension')
      ]
      const options = ordered.map((label) => ({ value: label, label }))
      const rest = unique
        .filter((label) => !ordered.includes(label))
        .sort((a, b) => a.localeCompare(b, 'th'))
        .map((value) => ({ value, label: value === '-' ? this.$t('chairman.dashboard.filters.unknownFunding') : value }))

      return [{ value: 'all', label: this.$t('chairman.dashboard.filters.allFundingTypes') }].concat(options, rest)
    },
    decisionFilterOptions() {
      return [
        { value: 'all', label: this.$t('chairman.dashboard.filters.allDecisions') },
        { value: 'approve', label: this.$t('chairman.dashboard.decision.approve') },
        { value: 'reject', label: this.$t('chairman.dashboard.decision.reject') },
        { value: 'none', label: this.$t('chairman.dashboard.filters.none') }
      ]
    },
    staleStats() {
      const rows = this.filteredAssignedProposals || []
      const pendingRows = rows.filter((proposal) => this.getChairmanFlowStatusKey(proposal) === 'faculty_review_pending')
      const daysSince = (dateStr) => {
        const date = new Date(dateStr || 0)
        if (Number.isNaN(date.getTime())) return null
        return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
      }
      let over7Days = 0
      let over14Days = 0
      pendingRows.forEach((proposal) => {
        const baseDate = proposal && (proposal.submittedAt || proposal.createdAt) ? (proposal.submittedAt || proposal.createdAt) : null
        const days = daysSince(baseDate)
        if (days === null) return
        if (days > 7) over7Days += 1
        if (days > 14) over14Days += 1
      })
      return { pending: pendingRows.length, over7Days, over14Days }
    },
    meetingBar() {
      return {
        labels: [
          this.$t('chairman.dashboard.meetings.scheduled'),
          this.$t('chairman.dashboard.meetings.completed'),
          this.$t('chairman.dashboard.meetings.cancelled')
        ],
        datasets: [
          {
            label: this.$t('chairman.dashboard.meetings.chartSeries'),
            backgroundColor: ['rgba(181, 133, 34, 0.45)', 'rgba(22, 163, 74, 0.45)', 'rgba(185, 28, 28, 0.45)'],
            borderColor: ['rgba(181, 133, 34, 1)', 'rgba(22, 163, 74, 1)', 'rgba(185, 28, 28, 1)'],
            borderWidth: 1,
            data: [this.meetingSummary.scheduled, this.meetingSummary.completed, this.meetingSummary.cancelled]
          }
        ],
        options: {
          maintainAspectRatio: false,
          legend: { display: false },
          scales: {
            yAxes: [{ ticks: { beginAtZero: true, precision: 0 } }]
          }
        }
      }
    }
  },
  methods: {
    normalizeSelectValue(value) {
      return value && value.target ? value.target.value : value
    },
    onRoundChange(value) {
      this.filterRound = this.normalizeSelectValue(value)
    },
    onFundTypeChange(value) {
      this.filterFundType = this.normalizeSelectValue(value)
    },
    onDecisionChange(value) {
      this.filterDecision = this.normalizeSelectValue(value)
    },
    deriveRoundNo(proposal) {
      return deriveProposalRoundNo(proposal, proposal && proposal.currentStatus)
    },
    getAssignedChairmanIds(proposal) {
      const assignment = proposal && proposal.chairmanAssignment && typeof proposal.chairmanAssignment === 'object'
        ? proposal.chairmanAssignment
        : {}
      return Array.isArray(assignment.assignedChairmanIds) ? assignment.assignedChairmanIds.map(String) : []
    },
    hasChairmanAccessToProposal(proposal) {
      if (!(proposal && this.currentUserId)) return false
      const assignedChairmanIds = this.getAssignedChairmanIds(proposal)
      if (assignedChairmanIds.includes(this.currentUserId)) return true
      const reviewedBy = proposal && proposal.chairmanAssignment && proposal.chairmanAssignment.reviewedBy
        ? String(proposal.chairmanAssignment.reviewedBy)
        : ''
      return reviewedBy === this.currentUserId
    },
    getReviewStatusForProposal(proposal) {
      const proposalId = proposal && proposal._id ? String(proposal._id) : ''
      const review = proposalId ? this.reviewMap[proposalId] : null
      return review && review.reviewStatus ? String(review.reviewStatus).toLowerCase() : ''
    },
    isChairmanReviewSubmitted(reviewStatus) {
      const normalized = String(reviewStatus || '').toLowerCase()
      return normalized === 'submitted' || normalized === 'certified'
    },
    getChairmanDecisionForProposal(proposal) {
      const proposalId = proposal && proposal._id ? String(proposal._id) : ''
      const review = proposalId ? this.reviewMap[proposalId] : null
      if (!this.isChairmanReviewSubmitted(review && review.reviewStatus)) return ''
      return String(review && review.decision ? review.decision : '').trim().toLowerCase()
    },
    getChairmanFlowStatusKey(statusOrProposal, explicitReviewStatus = null, explicitDecision = null) {
      const proposal = statusOrProposal && typeof statusOrProposal === 'object' ? statusOrProposal : null
      const status = proposal ? proposal.currentStatus : statusOrProposal
      const reviewStatus = explicitReviewStatus || (proposal ? this.getReviewStatusForProposal(proposal) : '')
      const decision = explicitDecision || (proposal ? this.getChairmanDecisionForProposal(proposal) : '')
      const key = normalizeProposalStatus(status)
      if (key === 'announced') return 'announced'
      if (this.isChairmanReviewSubmitted(reviewStatus) && decision === 'approve') return 'faculty_approved'
      if (this.isChairmanReviewSubmitted(reviewStatus) && decision === 'reject') return 'faculty_rejected'
      if (key === 'faculty_approved' || key === 'approved') return 'faculty_approved'
      if (key === 'faculty_rejected' || key === 'rejected') return 'faculty_rejected'
      return 'faculty_review_pending'
    },
    getChairmanFlowStatusLabel(key) {
      const map = {
        faculty_review_pending: this.$t('chairman.dashboard.proposalStatus.labels.pending'),
        faculty_approved: this.$t('chairman.dashboard.proposalStatus.labels.approved'),
        faculty_rejected: this.$t('chairman.dashboard.proposalStatus.labels.rejected'),
        announced: this.$t('chairman.dashboard.proposalStatus.labels.announced')
      }
      return map[key] || key
    },
    getChairmanFlowColorName(status) {
      return STATUS_COLORS[normalizeProposalStatus(status)] || 'secondary'
    },
    fundTypeLabel(proposal) {
      const fundType = proposal && proposal.fundingType ? String(proposal.fundingType) : ''
      const key = fundType.toLowerCase()
      if (!key) return '-'
      if (key === 'new-researcher' || key.includes('new')) return this.$t('chairman.dashboard.fundingTypes.newResearcher')
      if (key === 'researcher-development' || key.includes('develop')) return this.$t('chairman.dashboard.fundingTypes.researcherDevelopment')
      if (key.includes('strategic') || key.includes('strategy')) return this.$t('chairman.dashboard.fundingTypes.strategicResearch')
      if (key === 'industry-extension' || key.includes('extension') || key.includes('industry')) return this.$t('chairman.dashboard.fundingTypes.industryExtension')
      return fundType
    },
    async fetchAssignedProposals() {
      this.loading = true
      this.fetchError = null
      this.myReviewsRaw = []
      try {
        const proposalRes = await Service.proposal.list({ page: 1, limit: 300 })
        const proposalPayload = proposalRes && proposalRes.data ? proposalRes.data : null
        let proposals = []
        if (Array.isArray(proposalPayload)) proposals = proposalPayload
        else if (proposalPayload && proposalPayload.data && Array.isArray(proposalPayload.data.items)) proposals = proposalPayload.data.items
        else if (proposalPayload && proposalPayload.data && Array.isArray(proposalPayload.data.data)) proposals = proposalPayload.data.data
        else if (proposalPayload && proposalPayload.data && Array.isArray(proposalPayload.data)) proposals = proposalPayload.data

        this.proposalsRaw = proposals

        const assignedTargets = (this.assignedProposalsRaw || [])
          .map((proposal) => ({
            id: proposal && proposal._id ? String(proposal._id) : '',
            roundNo: this.deriveRoundNo(proposal)
          }))
          .filter((row) => row && row.id)

        if (assignedTargets.length > 0) {
          const settled = await Promise.allSettled(
            assignedTargets.map((target) => Service.proposal.getMyReview(encodeURIComponent(target.id), { roundNo: target.roundNo }))
          )

          const reviews = []
          settled.forEach((result) => {
            if (result.status === 'fulfilled') {
              const payload = result.value && result.value.data ? result.value.data : null
              const review = payload && payload.data ? payload.data : null
              if (review && review.proposalId) reviews.push(review)
            }
          })

          this.myReviewsRaw = reviews
        }
      } catch (err) {
        this.proposalsRaw = []
        this.myReviewsRaw = []
        this.fetchError = (err && err.response && err.response.data && err.response.data.message) || err.message || 'Unknown error'
      } finally {
        this.loading = false
      }
    },
    exportOverviewCsv() {
      const items = this.filteredAssignedProposals || []
      const escapeCell = (value) => {
        const text = String(value === null || value === undefined ? '' : value)
        if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
        return text
      }
      const decisionLabel = (key) => {
        if (key === 'approve') return this.$t('chairman.dashboard.decision.approve')
        if (key === 'reject') return this.$t('chairman.dashboard.decision.reject')
        return this.$t('chairman.dashboard.filters.none')
      }
      const statusLabel = (proposal) => this.getChairmanFlowStatusLabel(this.getChairmanFlowStatusKey(proposal))
      const rowFor = (proposal) => {
        const proposalId = proposal && proposal._id ? String(proposal._id) : ''
        const review = proposalId ? this.reviewMap[proposalId] : null
        return [
          proposal.proposalCode || proposal._id || '-',
          proposal.projectTitleTh || proposal.projectTitleEn || this.$t('chairman.dashboard.unnamedProject'),
          proposal.projectLeaderName || '-',
          proposal.projectLeaderAffiliation || proposal.departmentName || proposal.facultyName || '-',
          this.deriveRoundNo(proposal),
          this.fundTypeLabel(proposal),
          statusLabel(proposal),
          decisionLabel(this.getChairmanDecisionForProposal(proposal)),
          (review && (review.updatedAt || review.submittedAt)) || proposal.updatedAt || ''
        ]
      }
      const header = [
        this.$t('chairman.dashboard.csv.proposalCode'),
        this.$t('chairman.dashboard.csv.projectTitle'),
        this.$t('chairman.dashboard.csv.projectLeader'),
        this.$t('chairman.dashboard.csv.department'),
        this.$t('chairman.dashboard.csv.round'),
        this.$t('chairman.dashboard.csv.fundingType'),
        this.$t('chairman.dashboard.csv.status'),
        this.$t('chairman.dashboard.csv.decision'),
        this.$t('chairman.dashboard.csv.updatedAt')
      ]
      const csv = '\ufeff' + [header, ...items.map(rowFor)].map((row) => row.map(escapeCell).join(',')).join('\r\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `chairman-overview-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    },
    async fetchMeetingSummary() {
      this.meetingSummaryLoading = true
      try {
        const response = await axios.get('/api/v1/meetings/summary')
        const payload = (response && response.data && response.data.data) || {}
        this.meetingSummary = {
          scheduled: Number(payload.scheduled) || 0,
          completed: Number(payload.completed) || 0,
          cancelled: Number(payload.cancelled) || 0,
          total: Number(payload.total) || 0
        }
      } catch (error) {
        this.meetingSummary = { scheduled: 0, completed: 0, cancelled: 0, total: 0 }
      } finally {
        this.meetingSummaryLoading = false
      }
    }
  }
}
</script>

<style scoped>
.chairman-summary-page {
  --theme-red: #8b1a1a;
  --theme-red-dark: #6f1111;
  --theme-gold: #c59b3a;
  --theme-gold-soft: rgba(181, 133, 34, 0.25);
  --card-radius: 12px;

  max-width: 1240px;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
}

.page-hero {
  padding: 12px 12px 10px;
  border-radius: var(--card-radius);
  border: 1px solid var(--theme-gold-soft);
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.28), transparent 30%),
    linear-gradient(135deg, var(--theme-red) 0%, var(--theme-gold) 115%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.hero-title {
  display: flex;
  gap: 10px;
  align-items: center;
}

.hero-icon {
  width: 60px;
  height: 60px;
  margin: 15px 12px 10px 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.22);
  flex: 0 0 auto;
}

.page-hero h2 {
  margin: 0;
  font-size: 1.65rem;
  font-weight: 800;
  color: #ffffff;
  text-align: start;
}

.subtext {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.84);
  font-size: 0.95rem;
  text-align: center;
}

.hero-actions {
  display: flex;
  align-items: flex-start;
}

.filter-bar {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.filter-bar__selects {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.filter-bar__actions {
  display: flex;
  align-items: center;
}

.filter-select {
  width: 175px;
  flex-shrink: 0;
}

.filter-select::v-deep .vs__dropdown-toggle {
  height: 40px;
  border-radius: 12px;
  border: 2px solid rgba(181, 133, 34, 0.55);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
  padding: 0 8px;
  margin-bottom: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.filter-select::v-deep .vs__selected-options {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.filter-select::v-deep .vs__selected {
  font-weight: 800;
  color: #1f2937;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.filter-select::v-deep .vs__search {
  flex: 0 0 0px;
  width: 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  border: 0 !important;
  height: 0 !important;
  opacity: 0 !important;
}

.filter-select::v-deep .vs__actions {
  padding: 0 2px 0 6px;
}

.filter-select::v-deep .vs__open-indicator {
  fill: rgba(111, 17, 17, 0.92);
}

.filter-select.vs--open::v-deep .vs__dropdown-toggle,
.filter-select.vs--focused::v-deep .vs__dropdown-toggle {
  border-color: rgba(181, 133, 34, 0.92);
  box-shadow: 0 0 0 3px rgba(181, 133, 34, 0.18), 0 12px 22px rgba(15, 23, 42, 0.09);
}


.filter-select::v-deep .vs__dropdown-menu {
  margin-top: 4px;
  border-radius: 14px;
  border: 1px solid rgba(181, 133, 34, 0.55) !important;
  background: #fffaf2 !important;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
  padding: 6px;
  max-height: 260px;
  min-width: 100%;
  width: max-content;
}

.filter-select::v-deep .vs__dropdown-option {
  border-radius: 10px;
  padding: 10px 12px;
  font-weight: 800;
  color: #1f2937 !important;
  background: transparent !important;
}

.filter-select::v-deep .vs__dropdown-option--highlight {
  background: linear-gradient(135deg, rgba(139, 18, 18, 0.92), rgba(197, 155, 58, 0.92)) !important;
  color: #ffffff !important;
}

.filter-select::v-deep .vs__dropdown-option--selected {
  background: rgba(197, 155, 58, 0.18) !important;
  color: #6f1111 !important;
}

.filter-btn {
  white-space: nowrap;
  border-radius: 10px;
  border-color: rgba(139, 26, 26, 0.98);
  padding: 0.45rem 0.85rem;
  font-weight: 800;
  letter-spacing: 0.2px;
}

.filter-btn::v-deep svg {
  width: 16px;
  height: 16px;
}

.filter-btn::v-deep.btn-outline-secondary {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.35);
  color: #ffffff;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.14);
}

.filter-btn::v-deep.btn-outline-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.55);
}

.filter-btn::v-deep.btn:disabled {
  opacity: 0.55;
  box-shadow: none;
}

.chairman-summary-page ::v-deep .card {
  border-radius: var(--card-radius);
  border: 1px solid rgba(181, 133, 34, 0.22);
  box-shadow: 0 10px 24px rgba(111, 17, 17, 0.06);
}

.chairman-summary-page ::v-deep .card-header {
  border-top-left-radius: var(--card-radius);
  border-top-right-radius: var(--card-radius);
  background: linear-gradient(90deg, var(--theme-red-dark), var(--theme-red));
  color: #ffffff;
  border-bottom: 2px solid rgba(181, 133, 34, 0.85);
}

.chairman-summary-page ::v-deep .card-header.font-weight-bold {
  font-weight: 800;
}

.chairman-summary-page ::v-deep .card-body {
  background: #ffffff;
}

.decision-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.decision-item {
  border: 1px solid rgba(181, 133, 34, 0.22);
  border-radius: var(--card-radius);
  padding: 12px 12px 10px;
  background: #ffffff;
}

.decision-item__label {
  color: #6b7280;
  font-size: 0.88rem;
  font-weight: 700;
}

.decision-item__value {
  margin-top: 6px;
  font-size: 1.55rem;
  font-weight: 900;
  color: #111827;
  line-height: 1;
}

.chart-title {
  font-weight: 900;
  color: #111827;
  font-size: 0.95rem;
  margin-bottom: 6px;
}

.chart-title--tight {
  margin-bottom: 4px;
}

.decision-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 12px;
  align-items: start;
}

.decision-right {
  border-left: 1px dashed rgba(181, 133, 34, 0.35);
  padding-left: 12px;
}

.chart-wrap {
  width: 100%;
  position: relative;
}

.chart-wrap--doughnut {
  height: 170px;
}

.chart-wrap--bar {
  height: 180px;
}

.score-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.score-box,
.stale-box {
  border: 1px solid rgba(181, 133, 34, 0.22);
  border-radius: var(--card-radius);
  padding: 12px;
  background: #ffffff;
}

.score-box__label,
.stale-box__label {
  color: #6b7280;
  font-size: 0.88rem;
  font-weight: 700;
}

.score-box__value,
.stale-box__value {
  margin-top: 6px;
  font-size: 1.55rem;
  font-weight: 900;
  color: #111827;
  line-height: 1;
}

.stale-box__sub {
  margin-top: 6px;
  font-size: 0.88rem;
  color: #374151;
}

@media (max-width: 900px) {
  .filter-select {
    width: 160px;
  }

  .decision-grid {
    grid-template-columns: 1fr;
  }

  .decision-layout {
    grid-template-columns: 1fr;
  }

  .decision-right {
    border-left: 0;
    padding-left: 0;
    padding-top: 8px;
    border-top: 1px dashed rgba(181, 133, 34, 0.35);
  }

  .score-row {
    grid-template-columns: 1fr;
  }

  .status-breakdown-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .filter-bar {
    align-items: stretch;
  }

  .filter-bar__selects {
    flex-direction: column;
  }

  .filter-select {
    width: 100%;
  }
}

.kpi-card {
  border: 0;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, var(--summary-start, #8c1515), var(--summary-end, #6b0f0f));
  padding: 12px 14px;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
  height: 100%;
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.kpi-label {
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.kpi-number {
  font-size: 1.8rem;
  font-weight: 900;
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.98);
}

.kpi-note {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 2px;
}

.kpi-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image: var(--summary-graphic);
  background-repeat: no-repeat;
  background-size: 122px 122px;
  background-position: calc(100% + 10px) -12px;
  opacity: 0.22;
  pointer-events: none;
  z-index: 1;
}

.kpi-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 60%);
  pointer-events: none;
  z-index: 1;
}

.kpi-card > * {
  position: relative;
  z-index: 2;
}

.kpi-card--all {
  --summary-start: #8c1515;
  --summary-end: #6b0f0f;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect x='24' y='22' width='72' height='76' rx='12' fill='white' fill-opacity='0.9'/%3E%3Crect x='38' y='40' width='44' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3Crect x='38' y='54' width='40' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3Crect x='38' y='68' width='33' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3C/svg%3E");
}

.kpi-card--pending {
  --summary-start: #f59e0b;
  --summary-end: #d97706;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M60 42v18l14 10' stroke='%23000000' stroke-width='7' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.22' fill='none'/%3E%3C/svg%3E");
}

.kpi-card--approved {
  --summary-start: #16a34a;
  --summary-end: #15803d;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M46 61l9 9 20-20' stroke='%23000000' stroke-width='8' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.24' fill='none'/%3E%3Ccircle cx='60' cy='60' r='44' stroke='white' stroke-opacity='0.42' stroke-width='5' fill='none'/%3E%3C/svg%3E");
}

.kpi-card--rejected {
  --summary-start: #7f1d1d;
  --summary-end: #991b1b;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M48 48l24 24M72 48L48 72' stroke='%23000000' stroke-width='8' stroke-linecap='round' stroke-opacity='0.24'/%3E%3C/svg%3E");
}

.status-breakdown-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 10px;
}

.status-breakdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(181, 133, 34, 0.2);
  border-radius: 10px;
  padding: 6px 8px;
  background: rgba(255, 250, 240, 0.6);
}

.status-breakdown-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex: 0 0 10px;
}

.status-breakdown-label {
  flex: 1 1 auto;
  font-size: 0.84rem;
  color: #374151;
  line-height: 1.25;
}

.status-breakdown-count {
  flex: 0 0 auto;
  font-weight: 800;
  color: #111827;
  min-width: 18px;
  text-align: right;
}

.meeting-kpi {
  border: 1px solid rgba(181, 133, 34, 0.22);
  border-radius: var(--card-radius);
  background: #fff;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.meeting-kpi__label {
  color: #6b7280;
  font-size: 0.92rem;
}

.meeting-kpi__value {
  font-weight: 900;
  font-size: 1.35rem;
  color: #111827;
}

.meeting-kpi--scheduled {
  border-left: 4px solid rgba(181, 133, 34, 0.95);
}

.meeting-kpi--completed {
  border-left: 4px solid rgba(22, 163, 74, 0.95);
}

.meeting-kpi--cancelled {
  border-left: 4px solid rgba(185, 28, 28, 0.95);
}

.meeting-kpi--total {
  border-left: 4px solid rgba(107, 114, 128, 0.85);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 1rem;
}

@media (max-width: 991px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
/* Non-scoped: fix vue-select's default "position: absolute" on selected text when open
   Default: .vs--single.vs--open .vs__selected { position: absolute; opacity: .4 }
   The position:absolute causes text to escape overflow:hidden and become invisible */
.filter-select.vs--single.vs--open .vs__selected {
  position: static;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
