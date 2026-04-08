<template>
  <div class="finance-dashboard-page">
    <div v-if="loading" class="text-center py-5">
      <CSpinner color="primary" />
      <div class="mt-2 text-muted">{{ $t('finance.dashboard.loading') }}</div>
    </div>

    <CAlert v-else-if="fetchError" color="danger" show>
      {{ fetchError }}
    </CAlert>

    <div v-else>
      <CRow class="mb-4">
        <CCol sm="6" lg="3" class="mb-3 mb-lg-0">
          <CCallout color="primary" class="finance-summary-card mb-0">
            <small class="text-muted">{{ $t('finance.dashboard.cards.assigned') }}</small><br>
            <strong class="h4">{{ summary.assignedCount }}</strong>
          </CCallout>
        </CCol>
        <CCol sm="6" lg="3" class="mb-3 mb-lg-0">
          <CCallout color="warning" class="finance-summary-card mb-0">
            <small class="text-muted">{{ $t('finance.dashboard.cards.pending') }}</small><br>
            <strong class="h4">{{ summary.pendingCount }}</strong>
          </CCallout>
        </CCol>
        <CCol sm="6" lg="3" class="mb-3 mb-sm-0">
          <CCallout color="success" class="finance-summary-card mb-0">
            <small class="text-muted">{{ $t('finance.dashboard.cards.submitted') }}</small><br>
            <strong class="h4">{{ summary.submittedCount }}</strong>
          </CCallout>
        </CCol>
        <CCol sm="6" lg="3">
          <CCallout color="info" class="finance-summary-card mb-0">
            <small class="text-muted">{{ $t('finance.dashboard.cards.totalBudget') }}</small><br>
            <strong class="h5">{{ formatMoney(summary.totalBudget) }}</strong>
          </CCallout>
        </CCol>
      </CRow>

      <CCard class="finance-highlight-card mb-4">
        <CCardHeader class="d-flex justify-content-between align-items-center flex-wrap" style="gap: 8px;">
          <strong>{{ $t('finance.dashboard.cardTitle') }}</strong>
          <CButton size="sm" color="primary" variant="outline" @click="$router.push('/finance-officer/assigned')">{{ $t('common.viewAll') }}</CButton>
        </CCardHeader>
        <CCardBody>
          <div v-if="cards.length === 0" class="text-muted text-center py-4">{{ $t('finance.dashboard.empty') }}</div>
          <div v-else class="finance-card-grid">
            <div v-for="item in cards" :key="item._id" class="finance-project-card">
              <div class="finance-project-card__top">
                <div>
                  <div class="finance-project-card__code">{{ item.proposalCode || '-' }}</div>
                  <div class="finance-project-card__title">{{ item.projectTitleTh || '-' }}</div>
                </div>
                <CBadge :color="item.assignmentColor">{{ item.assignmentLabel }}</CBadge>
              </div>
              <div class="finance-project-card__meta">{{ item.fundingDisplay }}</div>
              <div class="finance-project-card__leader">{{ $t('finance.dashboard.projectLeader', { name: item.applicantName }) }}</div>
              <div class="finance-project-card__stats">
                <div>
                  <small class="text-muted d-block">{{ $t('finance.labels.proposedBudget') }}</small>
                  <strong>{{ formatMoney(item.budgetTotal) }}</strong>
                </div>
                <div>
                  <small class="text-muted d-block">{{ $t('finance.labels.budgetLimit') }}</small>
                  <strong>{{ formatMoney(item.budgetLimit) }}</strong>
                </div>
                <div>
                  <small class="text-muted d-block">{{ $t('finance.labels.remainingBudget') }}</small>
                  <strong :class="item.remainingClass">{{ formatMoney(item.remainingBudget) }}</strong>
                </div>
              </div>
              <div class="finance-project-card__footer">
                <small class="text-muted">{{ $t('finance.dashboard.latestUpdated', { date: formatDate(item.latestActivityAt) }) }}</small>
                <CButton size="sm" color="primary" @click="viewProposal(item)">{{ $t('finance.actions.reviewBudget') }}</CButton>
              </div>
            </div>
          </div>
        </CCardBody>
      </CCard>
    </div>
  </div>
</template>

<script>
import Service from '@/service/api'
import { loadResearchFormRuntimeConfigs } from '@/ResearchFormRS/utils/researchConfigRuntime'
import centerLoadingMixin from '@/ResearchFormRS/utils/centerLoadingMixin'
import {
  createDefaultFundingBudgetConfig,
  readFundingBudgetConfigFromFallbackStorage
} from '@/ResearchFormRS/utils/fundingBudgetConfig'
import {
  getApplicantName,
  getBudgetLimit,
  getBudgetRemaining,
  getFinanceAssignmentStatusKey,
  getFinanceAssignmentStatusLabel,
  getFundingDisplay,
  getLatestProposalActivity,
  resolveBudgetTotal
} from '@/ResearchFormRS/utils/financeBudget'

export default {
  name: 'FinanceOfficerDashboardSummary',
  mixins: [centerLoadingMixin],
  data () {
    return {
      loading: false,
      fetchError: '',
      proposalsRaw: [],
      fundingBudgetConfig: createDefaultFundingBudgetConfig()
    }
  },
  async mounted () {
    await loadResearchFormRuntimeConfigs()
    this.loadFundingBudgetConfig()
    this.fetchAssignedProposals()
  },
  computed: {
    centerLoadingActive () {
      return Boolean(this.loading)
    },
    proposals () {
      return (this.proposalsRaw || [])
        .map(item => {
          const budgetTotal = resolveBudgetTotal(item)
          const budgetLimit = getBudgetLimit(item, this.fundingBudgetConfig)
          const remainingBudget = getBudgetRemaining(item, this.fundingBudgetConfig)
          const assignmentStatusKey = getFinanceAssignmentStatusKey(item)
          const assignmentLabel = getFinanceAssignmentStatusLabel(item, key => this.$t(key))
          return {
            ...item,
            applicantName: getApplicantName(item),
            budgetTotal,
            budgetLimit,
            remainingBudget,
            fundingDisplay: getFundingDisplay(item, this.fundingBudgetConfig),
            latestActivityAt: getLatestProposalActivity(item),
            assignmentStatusKey,
            assignmentLabel,
            assignmentColor: assignmentStatusKey === 'submitted' ? 'success' : 'warning',
            remainingClass: budgetLimit > 0 && budgetTotal > budgetLimit ? 'text-danger' : 'text-success'
          }
        })
        .sort((left, right) => new Date(right.latestActivityAt || 0).getTime() - new Date(left.latestActivityAt || 0).getTime())
    },
    summary () {
      return this.proposals.reduce((acc, item) => {
        acc.assignedCount += 1
        acc.totalBudget += item.budgetTotal
        if (item.assignmentStatusKey === 'submitted') {
          acc.submittedCount += 1
        } else {
          acc.pendingCount += 1
        }
        return acc
      }, {
        assignedCount: 0,
        pendingCount: 0,
        submittedCount: 0,
        totalBudget: 0
      })
    },
    cards () {
      return this.proposals.slice(0, 6)
    }
  },
  methods: {
    loadFundingBudgetConfig () {
      const fallbackConfig = readFundingBudgetConfigFromFallbackStorage()
      this.fundingBudgetConfig = Array.isArray(fallbackConfig) && fallbackConfig.length > 0
        ? fallbackConfig
        : createDefaultFundingBudgetConfig()
    },
    async fetchAssignedProposals () {
      this.loading = true
      this.fetchError = ''
      try {
        const response = await Service.proposal.list({ limit: 200, sortBy: 'latestStatusUpdatedAt', sortOrder: 'desc' })
        const payload = response && response.data && response.data.data ? response.data.data : {}
        this.proposalsRaw = Array.isArray(payload.proposals)
          ? payload.proposals
          : (Array.isArray(payload.data) ? payload.data : [])
      } catch (error) {
        this.proposalsRaw = []
        this.fetchError = (error && error.response && error.response.data && error.response.data.message) || error.message || this.$t('finance.errors.loadData')
      } finally {
        this.loading = false
      }
    },
    viewProposal (item) {
      this.$router.push(`/finance-officer/proposals/${item._id}`)
    },
    formatMoney (value) {
      return `${Number(value || 0).toLocaleString(this.$i18n.locale === 'en' ? 'en-US' : 'th-TH', { maximumFractionDigits: 2 })} ${this.$t('finance.common.currency')}`
    },
    formatDate (value) {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '-'
      return date.toLocaleString(this.$i18n.locale === 'en' ? 'en-US' : 'th-TH')
    }
  }
}
</script>

<style scoped>
.finance-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.finance-project-card {
  border: 1px solid #dbe4f0;
  border-radius: 16px;
  padding: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.finance-project-card__top,
.finance-project-card__footer,
.finance-project-card__stats {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.finance-project-card__code {
  font-size: 0.85rem;
  color: #8c1515;
  font-weight: 700;
}

.finance-project-card__title {
  font-weight: 700;
  color: #1f2937;
}

.finance-project-card__meta,
.finance-project-card__leader {
  margin-top: 8px;
  color: #4b5563;
}

.finance-project-card__stats {
  margin-top: 14px;
}

.finance-project-card__footer {
  margin-top: 16px;
  align-items: center;
}
</style>
