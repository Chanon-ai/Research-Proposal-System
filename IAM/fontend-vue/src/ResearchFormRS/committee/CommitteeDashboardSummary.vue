<template>
  <div class="committee-summary-page">
    <div class="page-hero mb-4">
      <div class="hero-title">
        <span class="hero-icon" aria-hidden="true">
          <CIcon name="cil-speedometer" width="34" height="34" />
        </span>
        <div>
          <h2>{{ $t('committee.dashboard.title') }}</h2>
          <div class="subtext">{{ $t('committee.dashboard.subtitle') }}</div>
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
              {{ $t('committee.dashboard.exportCsv') }}
            </CButton>
          </div>
        </div>
      </div>
    </div>

    <CRow class="mb-3">
      <CCol sm="6" lg="3" class="mb-2">
        <div class="kpi-card kpi-card--all">
          <small class="kpi-label">{{ $t('committee.dashboard.kpi.total') }}</small>
          <div class="kpi-number">{{ proposalKpis.total }}</div>
          <div class="kpi-note">{{ $t('committee.dashboard.kpi.totalNote') }}</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3" class="mb-2">
        <div class="kpi-card kpi-card--pending">
          <small class="kpi-label">{{ $t('committee.dashboard.kpi.pending') }}</small>
          <div class="kpi-number">{{ proposalKpis.pending }}</div>
          <div class="kpi-note">{{ $t('committee.dashboard.kpi.pendingNote') }}</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3" class="mb-2">
        <div class="kpi-card kpi-card--announced">
          <small class="kpi-label">{{ $t('committee.dashboard.kpi.announced') }}</small>
          <div class="kpi-number">{{ proposalKpis.announced }}</div>
          <div class="kpi-note">{{ $t('committee.dashboard.kpi.announcedNote') }}</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3" class="mb-2">
        <div class="kpi-card kpi-card--reviewed">
          <small class="kpi-label">{{ $t('committee.dashboard.kpi.reviewed') }}</small>
          <div class="kpi-number">{{ proposalKpis.reviewed }}</div>
          <div class="kpi-note">{{ $t('committee.dashboard.kpi.reviewedNote') }}</div>
        </div>
      </CCol>
    </CRow>

    <CRow class="mb-3">
      <CCol lg="6" class="mb-2">
        <CCard>
          <CCardHeader class="font-weight-bold">{{ $t('committee.dashboard.decision.title') }}</CCardHeader>
          <CCardBody>
            <div class="decision-layout">
              <div class="decision-left">
                <div class="decision-grid">
                  <div class="decision-item decision-item--approve">
                    <div class="decision-item__label">{{ $t('committee.dashboard.decision.approve') }}</div>
                    <div class="decision-item__value">{{ decisionStats.approve }}</div>
                    <CProgress class="progress-xs" color="success" :value="decisionStats.approvePct" />
                  </div>
                  <div class="decision-item decision-item--revise">
                    <div class="decision-item__label">{{ $t('committee.dashboard.decision.revise') }}</div>
                    <div class="decision-item__value">{{ decisionStats.revise }}</div>
                    <CProgress class="progress-xs" color="info" :value="decisionStats.revisePct" />
                  </div>
                  <div class="decision-item decision-item--reject">
                    <div class="decision-item__label">{{ $t('committee.dashboard.decision.reject') }}</div>
                    <div class="decision-item__value">{{ decisionStats.reject }}</div>
                    <CProgress class="progress-xs" color="danger" :value="decisionStats.rejectPct" />
                  </div>
                </div>
                <div class="text-muted small mt-2">{{ $t('committee.dashboard.decision.total', { count: decisionStats.total }) }}</div>
              </div>

              <div class="decision-right">
                <div class="chart-title chart-title--tight">{{ $t('committee.dashboard.decision.chartTitle') }}</div>
                <div v-if="decisionStats.total === 0" class="text-muted small text-center py-3">
                  {{ $t('committee.dashboard.decision.empty') }}
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

        <CCard class="mt-1">
          <CCardHeader class="font-weight-bold">{{ $t('committee.dashboard.proposalStatus.title') }}</CCardHeader>
          <CCardBody>
            <div v-if="loading" class="text-center py-4">
              <CSpinner color="primary" size="sm" />
              <span class="text-muted ml-2">{{ $t('committee.dashboard.proposalStatus.loading') }}</span>
            </div>
            <div v-else-if="fetchError" class="text-center py-4">
              <div class="text-danger mb-2">{{ $t('committee.dashboard.proposalStatus.loadErrorTitle') }}</div>
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
                  v-for="item in committeeStatusBreakdown.items"
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
      </CCol>

      <CCol lg="6" class="mb-2">
        <CCard>
          <CCardHeader class="font-weight-bold">{{ $t('committee.dashboard.score.title') }}</CCardHeader>
          <CCardBody>
            <div class="score-row">
              <div class="score-box">
                <div class="score-box__label">{{ $t('committee.dashboard.score.avg') }}</div>
                <div class="score-box__value">{{ scoreStats.avgPercentDisplay }}</div>
                <CProgress class="mt-1" color="warning" :value="scoreStats.avgPercent" />
              </div>
              <div class="stale-box">
                <div class="stale-box__label">{{ $t('committee.dashboard.score.pending') }}</div>
                <div class="stale-box__value">{{ staleStats.pending }}</div>
                <div class="stale-box__sub">
                  {{ $t('committee.dashboard.score.over7') }} <strong>{{ staleStats.over7Days }}</strong> |
                  {{ $t('committee.dashboard.score.over14') }} <strong>{{ staleStats.over14Days }}</strong>
                </div>
              </div>
            </div>
          </CCardBody>
        </CCard>

        <CCard class="mt-1">
          <CCardHeader class="font-weight-bold">{{ $t('committee.dashboard.meetings.title') }}</CCardHeader>
          <CCardBody>
            <div v-if="meetingSummaryLoading" class="text-center py-4">
              <CSpinner color="primary" size="sm" />
              <span class="text-muted ml-2">{{ $t('committee.dashboard.meetings.loading') }}</span>
            </div>
            <div v-else>
              <CRow class="mb-2">
                <CCol sm="6" class="mb-2 mb-sm-0">
                  <div class="meeting-kpi meeting-kpi--scheduled">
                    <div class="meeting-kpi__label">{{ $t('committee.dashboard.meetings.scheduled') }}</div>
                    <div class="meeting-kpi__value">{{ meetingSummary.scheduled }}</div>
                  </div>
                </CCol>
                <CCol sm="6">
                  <div class="meeting-kpi meeting-kpi--completed">
                    <div class="meeting-kpi__label">{{ $t('committee.dashboard.meetings.completed') }}</div>
                    <div class="meeting-kpi__value">{{ meetingSummary.completed }}</div>
                  </div>
                </CCol>
              </CRow>
              <CRow class="mb-2">
                <CCol sm="6" class="mb-2 mb-sm-0">
                  <div class="meeting-kpi meeting-kpi--cancelled">
                    <div class="meeting-kpi__label">{{ $t('committee.dashboard.meetings.cancelled') }}</div>
                    <div class="meeting-kpi__value">{{ meetingSummary.cancelled }}</div>
                  </div>
                </CCol>
                <CCol sm="6">
                  <div class="meeting-kpi meeting-kpi--total">
                    <div class="meeting-kpi__label">{{ $t('committee.dashboard.meetings.total') }}</div>
                    <div class="meeting-kpi__value">{{ meetingSummary.total }}</div>
                  </div>
                </CCol>
              </CRow>

              <div class="chart-wrap chart-wrap--bar">
                <CChartBar :datasets="meetingBar.datasets" :labels="meetingBar.labels" :options="meetingBar.options" />
              </div>

              <div class="text-right mt-3">
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  </div>
</template>

<script>
import Service, { instance as axios } from '@/service/api'
import { CChartBar, CChartDoughnut } from '@coreui/vue-chartjs'
import {
  COMMITTEE_DASHBOARD_FLOW_STATUSES,
  COMMITTEE_PENDING_STATUSES,
  COMMITTEE_REVIEWED_STATUSES,
  PROPOSAL_STATUS_COLORS_COREUI_ADMIN as STATUS_COLORS,
  deriveProposalRoundNo,
  getCoreUiColorHex,
  getCommitteeDashboardStatusLabel,
  normalizeProposalStatus
} from '@/ResearchFormRS/constants/proposalWorkflow'
import { loadResearchFormRuntimeConfigs } from '@/ResearchFormRS/utils/researchConfigRuntime'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'

export default {
  name: 'CommitteeDashboardSummary',
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
    assignedProposalsRaw() {
      if (!(this.currentUser && this.currentUser.role === 'committee' && this.currentUserId)) {
        return this.proposalsRaw || []
      }

      return (this.proposalsRaw || []).filter(p => {
        const ids = Array.isArray(p && p.committeeIds) ? p.committeeIds.map(x => String(x)) : []
        return ids.includes(this.currentUserId)
      })
    },
    reviewMap() {
      const map = {}
        ; (this.myReviewsRaw || []).forEach(r => {
          const pid = r && r.proposalId ? String(r.proposalId) : ''
          if (!pid) return
          const current = map[pid]
          if (!current) {
            map[pid] = r
            return
          }
          const currentTs = new Date(current.updatedAt || current.submittedAt || 0).getTime()
          const nextTs = new Date(r.updatedAt || r.submittedAt || 0).getTime()
          if (nextTs >= currentTs) map[pid] = r
        })
      return map
    },
    filteredAssignedProposals() {
      const rows = this.assignedProposalsRaw || []
      return rows.filter(p => {
        const roundNo = this.deriveRoundNo(p)
        const fundTypeLabel = this.fundTypeLabel(p)
        const proposalId = p && p._id ? String(p._id) : ''
        const review = proposalId ? this.reviewMap[proposalId] : null
        const isReviewed = this.isCommitteeReviewSubmitted(review && review.reviewStatus)

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
          const decision = String(review && review.decision ? review.decision : '')
          return decision === String(this.filterDecision)
        }

        return true
      })
    },
    committeeStatusBreakdown() {
      this.runtimeConfigVersion
      const rows = this.filteredAssignedProposals || []
      const counts = COMMITTEE_DASHBOARD_FLOW_STATUSES.reduce((acc, key) => {
        acc[key] = 0
        return acc
      }, {})

      rows.forEach(p => {
        const key = this.getCommitteeFlowStatusKey(p)
        if (!key || !Object.prototype.hasOwnProperty.call(counts, key)) return
        counts[key] += 1
      })

      const labels = COMMITTEE_DASHBOARD_FLOW_STATUSES.map(key => this.committeeStatusLabelByKey(key, null, false))
      const semanticColors = COMMITTEE_DASHBOARD_FLOW_STATUSES.map(key => this.getCommitteeFlowColorName(key))
      const backgroundColor = semanticColors.map(color => getCoreUiColorHex(color, 0.28))
      const borderColor = semanticColors.map(color => getCoreUiColorHex(color))
      const data = COMMITTEE_DASHBOARD_FLOW_STATUSES.map(key => counts[key] || 0)
      const items = COMMITTEE_DASHBOARD_FLOW_STATUSES.map((key, index) => ({
        key,
        label: labels[index],
        badgeColor: semanticColors[index],
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
    bucketCounts() {
      const counts = { pending: 0, reviewed: 0, announced: 0, total: 0 }
      const rows = this.filteredAssignedProposals || []
      counts.total = rows.length

      rows.forEach(p => {
        const statusKey = this.getCommitteeStatusKey(p)
        if (!Object.prototype.hasOwnProperty.call(counts, statusKey)) return
        counts[statusKey] += 1
      })

      return counts
    },
    proposalKpis() {
      return {
        total: this.bucketCounts.total,
        pending: this.bucketCounts.pending,
        announced: this.bucketCounts.announced,
        reviewed: this.bucketCounts.reviewed
      }
    },
    proposalDoughnut() {
      return {
        labels: this.committeeStatusBreakdown.labels,
        datasets: [
          {
            backgroundColor: this.committeeStatusBreakdown.backgroundColor,
            borderColor: this.committeeStatusBreakdown.borderColor,
            borderWidth: 1,
            data: this.committeeStatusBreakdown.data
          }
        ]
      }
    },
    decisionDoughnut() {
      return {
        labels: [
          this.$t('committee.dashboard.decision.approve'),
          this.$t('committee.dashboard.decision.revise'),
          this.$t('committee.dashboard.decision.reject')
        ],
        datasets: [
          {
            backgroundColor: ['rgba(197, 155, 58, 0.5)', 'rgba(139, 26, 26, 0.45)', 'rgba(55, 65, 81, 0.4)'],
            borderColor: ['rgba(197, 155, 58, 1)', 'rgba(139, 26, 26, 1)', 'rgba(55, 65, 81, 1)'],
            borderWidth: 1,
            data: [this.decisionStats.approve, this.decisionStats.revise, this.decisionStats.reject]
          }
        ]
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
              const v = (data && data.datasets && data.datasets[0] && Array.isArray(data.datasets[0].data))
                ? data.datasets[0].data[tooltipItem.index]
                : ''
              return `${label}: ${v}`
            }
          }
        }
      }
    },
    roundFilterOptions() {
      const rows = this.assignedProposalsRaw || []
      const rounds = Array.from(new Set(
        rows.map(p => Number(this.deriveRoundNo(p))).filter(n => Number.isFinite(n) && n > 0)
      )).sort((a, b) => a - b)
      const options = rounds.length > 0 ? rounds : [1]
      return [{ value: 'all', label: this.$t('committee.dashboard.filters.allRounds') }].concat(options.map(r => ({ value: r, label: this.$t('committee.dashboard.filters.round', { round: r }) })))
    },
    fundTypeFilterOptions() {
      const rows = this.assignedProposalsRaw || []
      const labels = rows.map(p => String(this.fundTypeLabel(p) || '-'))
      const unique = Array.from(new Set(labels.filter(Boolean)))

      const ordered = [
        this.$t('committee.dashboard.fundingTypes.newResearcher'),
        this.$t('committee.dashboard.fundingTypes.researcherDevelopment'),
        this.$t('committee.dashboard.fundingTypes.strategicResearch'),
        this.$t('committee.dashboard.fundingTypes.industryExtension')
      ]

      // Always show all 4 types (even if current data has none for some types).
      const options = ordered.map(label => ({ value: label, label }))

      // Keep unknown/missing types (and '-' if any) at the end.
      const rest = unique
        .filter(label => !ordered.includes(label))
        .sort((a, b) => a.localeCompare(b, 'th'))
        .map(v => ({ value: v, label: v === '-' ? this.$t('committee.dashboard.filters.unknownFunding') : v }))

      return [{ value: 'all', label: this.$t('committee.dashboard.filters.allFundingTypes') }].concat(options, rest)
    },
    decisionFilterOptions() {
      return [
        { value: 'all', label: this.$t('committee.dashboard.filters.allDecisions') },
        { value: 'approve', label: this.$t('committee.dashboard.decision.approve') },
        { value: 'revise', label: this.$t('committee.dashboard.decision.revise') },
        { value: 'reject', label: this.$t('committee.dashboard.decision.reject') },
        { value: 'none', label: this.$t('committee.dashboard.filters.none') }
      ]
    },
    decisionStats() {
      const reviewed = (this.filteredAssignedProposals || []).filter(p => {
        const pid = p && p._id ? String(p._id) : ''
        const review = pid ? this.reviewMap[pid] : null
        return this.isCommitteeReviewSubmitted(review && review.reviewStatus)
      })
      const total = reviewed.length
      const countBy = (key) => reviewed.filter(p => {
        const pid = p && p._id ? String(p._id) : ''
        const review = pid ? this.reviewMap[pid] : null
        return String(review && review.decision ? review.decision : '') === key
      }).length
      const approve = countBy('approve')
      const revise = countBy('revise')
      const reject = countBy('reject')
      const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0
      return {
        total,
        approve,
        revise,
        reject,
        approvePct: pct(approve),
        revisePct: pct(revise),
        rejectPct: pct(reject)
      }
    },
    scoreStats() {
      const reviewed = (this.filteredAssignedProposals || []).map(p => {
        const pid = p && p._id ? String(p._id) : ''
        const review = pid ? this.reviewMap[pid] : null
        return this.isCommitteeReviewSubmitted(review && review.reviewStatus) ? review : null
      }).filter(Boolean)
      const percents = reviewed
        .map(r => {
          const totalScore = (typeof r.totalScore === 'number') ? Number(r.totalScore) : null
          const maxScore = (typeof r.maxScore === 'number') ? Number(r.maxScore) : null
          if (totalScore === null || !maxScore) return null
          return (totalScore / maxScore) * 100
        })
        .filter(v => typeof v === 'number' && Number.isFinite(v))
      if (!percents.length) {
        return { avgPercent: 0, avgPercentDisplay: '-' }
      }
      const avg = percents.reduce((a, b) => a + b, 0) / percents.length
      const rounded = Math.round(avg * 10) / 10
      return {
        avgPercent: Math.max(0, Math.min(100, rounded)),
        avgPercentDisplay: `${rounded}%`
      }
    },
    staleStats() {
      const rows = this.filteredAssignedProposals || []
      const pending = rows.filter(p => this.getCommitteeStatusKey(p) === 'pending')
      const daysSince = (dateStr) => {
        const d = new Date(dateStr || 0)
        if (Number.isNaN(d.getTime())) return null
        const diff = Date.now() - d.getTime()
        return Math.floor(diff / (1000 * 60 * 60 * 24))
      }
      let over7Days = 0
      let over14Days = 0
      pending.forEach(p => {
        const baseDate = p && (p.submittedAt || p.createdAt) ? (p.submittedAt || p.createdAt) : null
        const days = daysSince(baseDate)
        if (days === null) return
        if (days > 7) over7Days += 1
        if (days > 14) over14Days += 1
      })
      return { pending: pending.length, over7Days, over14Days }
    },
    meetingBar() {
      return {
        labels: [
          this.$t('committee.dashboard.meetings.scheduled'),
          this.$t('committee.dashboard.meetings.completed'),
          this.$t('committee.dashboard.meetings.cancelled')
        ],
        datasets: [
          {
            label: this.$t('committee.dashboard.meetings.chartSeries'),
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
    resetFilters() {
      this.filterRound = 'all'
      this.filterFundType = 'all'
      this.filterDecision = 'all'
    },
    deriveRoundNo(proposal) {
      return deriveProposalRoundNo(proposal, proposal && proposal.currentStatus)
    },
    getReviewStatusForProposal(proposal) {
      const pid = proposal && proposal._id ? String(proposal._id) : ''
      const review = pid ? this.reviewMap[pid] : null
      return review && review.reviewStatus ? String(review.reviewStatus).toLowerCase() : ''
    },
    isCommitteeReviewSubmitted(reviewStatus) {
      const normalized = String(reviewStatus || '').toLowerCase()
      return normalized === 'submitted' || normalized === 'certified'
    },
    getCommitteeStatusKey(statusOrProposal, explicitReviewStatus = null) {
      const proposal = statusOrProposal && typeof statusOrProposal === 'object' ? statusOrProposal : null
      const status = proposal ? proposal.currentStatus : statusOrProposal
      const reviewStatus = explicitReviewStatus || (proposal ? this.getReviewStatusForProposal(proposal) : '')
      const key = normalizeProposalStatus(status)
      if (key === 'announced') return 'announced'
      if (this.isCommitteeReviewSubmitted(reviewStatus)) return 'reviewed'
      if (COMMITTEE_PENDING_STATUSES.includes(key)) return 'pending'
      if (COMMITTEE_REVIEWED_STATUSES.includes(key)) return 'reviewed'
      return 'pending'
    },
    getCommitteeFlowStatusKey(statusOrProposal, explicitReviewStatus = null) {
      const proposal = statusOrProposal && typeof statusOrProposal === 'object' ? statusOrProposal : null
      const status = proposal ? proposal.currentStatus : statusOrProposal
      const reviewStatus = explicitReviewStatus || (proposal ? this.getReviewStatusForProposal(proposal) : '')
      const key = normalizeProposalStatus(status)
      if (this.isCommitteeReviewSubmitted(reviewStatus) && key !== 'announced' && key !== 'revision_requested' && key !== 'resubmitted') {
        return 'committee_valuated'
      }
      if (key === 'approved' || key === 'rejected') return 'committee_valuated'
      if (COMMITTEE_DASHBOARD_FLOW_STATUSES.includes(key)) return key
      return 'assigned_to_committee'
    },
    committeeStatusLabelByKey(statusKey, roundNo, includeRound = true) {
      return getCommitteeDashboardStatusLabel(statusKey, roundNo, {
        nextRoundForSecondRoundReview: !includeRound
      })
    },
    fundTypeLabel(proposal) {
      const ft = proposal && proposal.fundingType ? String(proposal.fundingType) : ''
      const k = ft.toLowerCase()
      if (!k) return '-'
      if (k === 'new-researcher' || k.includes('new')) return this.$t('committee.dashboard.fundingTypes.newResearcher')
      if (k === 'researcher-development' || k.includes('develop')) return this.$t('committee.dashboard.fundingTypes.researcherDevelopment')
      if (k.includes('strategic') || k.includes('strategy')) return this.$t('committee.dashboard.fundingTypes.strategicResearch')
      if (k === 'industry-extension' || k.includes('extension') || k.includes('industry')) return this.$t('committee.dashboard.fundingTypes.industryExtension')
      return ft
    },
    committeeStatusLabel(status, roundNo, includeRound = true, reviewStatus = null) {
      const statusKey = this.getCommitteeFlowStatusKey(status, reviewStatus)
      return this.committeeStatusLabelByKey(statusKey, roundNo, includeRound)
    },
    getCommitteeFlowColorName(status) {
      return STATUS_COLORS[normalizeProposalStatus(status)] || 'secondary'
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
          .map(p => ({
            id: p && p._id ? String(p._id) : '',
            roundNo: this.deriveRoundNo(p)
          }))
          .filter(x => x && x.id)

        if (assignedTargets.length > 0) {
          const settled = await Promise.allSettled(
            assignedTargets.map(t => Service.proposal.getMyReview(encodeURIComponent(t.id), { roundNo: t.roundNo }))
          )

          const reviews = []
          settled.forEach(result => {
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
      const escapeCell = (val) => {
        const s = String(val === null || val === undefined ? '' : val)
        if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
        return s
      }
      const decisionLabel = (key) => {
        if (key === 'approve') return this.$t('committee.dashboard.decision.approve')
        if (key === 'reject') return this.$t('committee.dashboard.decision.reject')
        if (key === 'revise') return this.$t('committee.dashboard.decision.revise')
        return ''
      }
      const statusLabel = (p) => {
        const roundNo = this.deriveRoundNo(p)
        const pid = p && p._id ? String(p._id) : ''
        const review = pid ? this.reviewMap[pid] : null
        const reviewStatus = review && review.reviewStatus ? String(review.reviewStatus).toLowerCase() : ''
        return this.committeeStatusLabel(p && p.currentStatus, roundNo, true, reviewStatus)
      }
      const rowFor = (p) => {
        const pid = p && p._id ? String(p._id) : ''
        const review = pid ? this.reviewMap[pid] : null
        const roundNo = this.deriveRoundNo(p)
        const fund = this.fundTypeLabel(p)
        const totalScore = review && typeof review.totalScore === 'number' ? review.totalScore : ''
        const maxScore = review && typeof review.maxScore === 'number' ? review.maxScore : ''
        const percent = (typeof totalScore === 'number' && typeof maxScore === 'number' && maxScore)
          ? Math.round((totalScore / maxScore) * 1000) / 10
          : ''
        return [
          p.proposalCode || p._id || '-',
          p.projectTitleTh || p.projectTitleEn || this.$t('committee.dashboard.unnamedProject'),
          p.projectLeaderName || '-',
          p.projectLeaderAffiliation || p.departmentName || p.facultyName || '-',
          roundNo,
          fund,
          statusLabel(p),
          decisionLabel(String(review && review.decision ? review.decision : '')),
          totalScore,
          maxScore,
          percent,
          (review && (review.updatedAt || review.submittedAt)) || p.updatedAt || ''
        ]
      }
      const header = [
        this.$t('committee.dashboard.csv.proposalCode'),
        this.$t('committee.dashboard.csv.projectTitle'),
        this.$t('committee.dashboard.csv.projectLeader'),
        this.$t('committee.dashboard.csv.department'),
        this.$t('committee.dashboard.csv.round'),
        this.$t('committee.dashboard.csv.fundingType'),
        this.$t('committee.dashboard.csv.status'),
        this.$t('committee.dashboard.csv.decision'),
        this.$t('committee.dashboard.csv.score'),
        this.$t('committee.dashboard.csv.maxScore'),
        this.$t('committee.dashboard.csv.percent'),
        this.$t('committee.dashboard.csv.updatedAt')
      ]
      const rows = items.map(rowFor)
      const csv = '\ufeff' + [header, ...rows].map(r => r.map(escapeCell).join(',')).join('\r\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const yyyyMmDd = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `committee-overview-${yyyyMmDd}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
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
.committee-summary-page {
  --theme-red: #8b1a1a;
  --theme-red-dark: #6f1111;
  --theme-gold: #c59b3a;
  --theme-gold-soft: rgba(181, 133, 34, 0.25);
  --theme-ivory: #fffaf0;
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
  justify-content: flex-end;
}

.filter-bar__selects {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.filter-bar__actions {
  display: flex;
  justify-content: flex-end;
}

.filter-select {
  min-width: 140px;
}

.filter-select::v-deep .vs__dropdown-toggle {
  min-height: 34px;
  border-radius: 12px;
  border: 2px solid rgba(181, 133, 34, 0.55);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
  padding: 1px 8px;
  margin-bottom: 15px;
}

.filter-select::v-deep .vs__selected,
.filter-select::v-deep .vs__search {
  font-weight: 800;
  color: #1f2937;
  margin: 0;
}

.filter-select::v-deep .vs__search::placeholder {
  color: rgba(31, 41, 55, 0.62);
  font-weight: 700;
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
  margin-top: 6px;
  border-radius: 14px;
  border: 1px solid rgba(181, 133, 34, 0.55) !important;
  background: #fffaf2 !important;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
  padding: 6px;
  max-height: 260px;
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
  border-color:  rgba(139, 26, 26, 0.98);
  padding: 0.45rem 0.85rem;
  font-weight: 800;
  letter-spacing: 0.2px;
}

.filter-btn::v-deep svg {
  width: 16px;
  height: 16px;
}

.filter-btn::v-deep.btn-outline-warning {
  background: rgba(139, 26, 26, 0.98);
  border-color: rgba(181, 133, 34, 0.95);
  color: #ffffff;
  box-shadow: 0 10px 18px rgba(111, 17, 17, 0.18);
}

.filter-btn::v-deep.btn-outline-warning:hover:not(:disabled) {
  background: rgba(111, 17, 17, 1);
  border-color: rgba(181, 133, 34, 1);
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

.committee-summary-page ::v-deep .card {
  border-radius: var(--card-radius);
  border: 1px solid rgba(181, 133, 34, 0.22);
  box-shadow: 0 10px 24px rgba(111, 17, 17, 0.06);
}

.committee-summary-page ::v-deep .card-header {
  border-top-left-radius: var(--card-radius);
  border-top-right-radius: var(--card-radius);
  background: linear-gradient(90deg, var(--theme-red-dark), var(--theme-red));
  color: #ffffff;
  border-bottom: 2px solid rgba(181, 133, 34, 0.85);
}

.committee-summary-page ::v-deep .card-header.font-weight-bold {
  font-weight: 800;
}

.committee-summary-page ::v-deep .card-body {
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
    min-width: 160px;
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
    justify-content: flex-start;
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

.kpi-card--announced {
  --summary-start: #1f2937;
  --summary-end: #111827;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='58' cy='60' r='28' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M44 60h28M72 60c7 0 12-5 12-12M72 60c7 0 12 5 12 12' stroke='%23000000' stroke-width='6' stroke-linecap='round' stroke-opacity='0.2' fill='none'/%3E%3Cpath d='M38 60l8 8M38 60l8-8' stroke='%23000000' stroke-width='6' stroke-linecap='round' stroke-opacity='0.2'/%3E%3C/svg%3E");
}

.kpi-card--reviewed {
  --summary-start: #16a34a;
  --summary-end: #15803d;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M46 61l9 9 20-20' stroke='%23000000' stroke-width='8' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.24' fill='none'/%3E%3Ccircle cx='60' cy='60' r='44' stroke='white' stroke-opacity='0.42' stroke-width='5' fill='none'/%3E%3C/svg%3E");
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
</style>
