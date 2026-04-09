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
      <div class="finance-stat-grid mb-4">
        <div
          v-for="card in statCards"
          :key="card.key"
          class="finance-stat-card"
          :class="[`finance-stat-card--${card.color}`, { 'is-active': activeFilter === card.filterKey && card.filterKey !== null }]"
          :style="{ cursor: card.filterKey !== null ? 'pointer' : 'default' }"
          @click="toggleFilter(card.filterKey)"
        >
          <div class="fsc-left">
            <span class="fsc-icon-wrap">
              <CIcon :name="card.icon" class="fsc-icon" />
            </span>
            <span class="fsc-label">{{ card.label }}</span>
          </div>
          <div class="fsc-right">
            <span class="fsc-count">{{ card.value }}</span>
          </div>
        </div>
      </div>

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
      fundingBudgetConfig: createDefaultFundingBudgetConfig(),
      activeFilter: null
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
    statCards () {
      return [
        { key: 'assigned',  filterKey: null,        color: 'gray',  label: this.$t('finance.dashboard.cards.assigned'),    value: this.summary.assignedCount,                 icon: 'cil-layers' },
        { key: 'pending',   filterKey: 'pending',   color: 'amber', label: this.$t('finance.dashboard.cards.pending'),     value: this.summary.pendingCount,                  icon: 'cil-clock' },
        { key: 'submitted', filterKey: 'submitted', color: 'green', label: this.$t('finance.dashboard.cards.submitted'),   value: this.summary.submittedCount,                icon: 'cil-check-circle' },
        { key: 'budget',    filterKey: null,        color: 'blue',  label: this.$t('finance.dashboard.cards.totalBudget'), value: this.formatMoney(this.summary.totalBudget), icon: 'cil-dollar' }
      ]
    },
    cards () {
      if (this.activeFilter) {
        return this.proposals.filter(p => p.assignmentStatusKey === this.activeFilter)
      }
      return this.proposals.slice(0, 6)
    }
  },
  methods: {
    toggleFilter (filterKey) {
      if (filterKey === null) return
      this.activeFilter = this.activeFilter === filterKey ? null : filterKey
    },
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
/* ─── Stat Cards ─────────────────────────────────── */
.finance-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (max-width: 768px) {
  .finance-stat-grid { grid-template-columns: repeat(2, 1fr); }
}

.finance-stat-card {
  flex: 1;
  min-width: 170px;
  border-radius: 0.5rem;
  border: 0;
  box-shadow: none;
  padding: 14px 16px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  position: relative;
  overflow: hidden;
  isolation: isolate;
  transform: scale(1);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  user-select: none;
  background: linear-gradient(135deg, var(--fsc-start), var(--fsc-end));
}

/* SVG graphic top-right */
.finance-stat-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image: var(--fsc-graphic);
  background-repeat: no-repeat;
  background-size: 122px 122px;
  background-position: calc(100% + 10px) -12px;
  opacity: 0.22;
  pointer-events: none;
  z-index: 1;
}
/* Gloss overlay */
.finance-stat-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 60%);
  pointer-events: none;
  z-index: 1;
}
.finance-stat-card > * { position: relative; z-index: 2; }

.finance-stat-card[style*="pointer"]:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.2);
}
.finance-stat-card.is-active {
  transform: scale(1.02);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.24);
}

/* Color + graphic */
.finance-stat-card--gray {
  --fsc-start: #6b7280; --fsc-end: #4b5563;
  --fsc-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect x='24' y='22' width='72' height='76' rx='12' fill='white' fill-opacity='0.9'/%3E%3Crect x='38' y='40' width='44' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3Crect x='38' y='54' width='40' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3Crect x='38' y='68' width='33' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3C/svg%3E");
}
.finance-stat-card--amber {
  --fsc-start: #f59e0b; --fsc-end: #d97706;
  --fsc-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M60 42v18l14 10' stroke='%23000000' stroke-width='7' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.22' fill='none'/%3E%3C/svg%3E");
}
.finance-stat-card--green {
  --fsc-start: #16a34a; --fsc-end: #15803d;
  --fsc-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M46 61l9 9 20-20' stroke='%23000000' stroke-width='8' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.24' fill='none'/%3E%3Ccircle cx='60' cy='60' r='44' stroke='white' stroke-opacity='0.42' stroke-width='5' fill='none'/%3E%3C/svg%3E");
}
.finance-stat-card--blue {
  --fsc-start: #2563eb; --fsc-end: #1d4ed8;
  --fsc-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='28' fill='none' stroke='white' stroke-opacity='0.9' stroke-width='6'/%3E%3Cpath d='M52 54h16M60 46v16' stroke='white' stroke-opacity='0.9' stroke-width='5' stroke-linecap='round'/%3E%3Ccircle cx='60' cy='60' r='44' stroke='white' stroke-opacity='0.35' stroke-width='5' fill='none'/%3E%3C/svg%3E");
}

/* Left: circle icon + label */
.fsc-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.fsc-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.32);
  box-shadow: 0 4px 12px rgba(16,24,40,0.12);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  color: rgba(255,255,255,0.98);
}
.finance-stat-card[style*="pointer"]:hover .fsc-icon-wrap {
  transform: translateY(-3px);
  box-shadow: 0 10px 26px rgba(16,24,40,0.18);
}
.fsc-icon {
  font-size: 1.9rem;
  display: inline-block;
  line-height: 1;
}
.fsc-label {
  font-size: 0.82rem;
  color: rgba(255,255,255,0.9);
  font-weight: 600;
}

/* Right: count */
.fsc-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
}
.fsc-count {
  font-size: 2.2rem;
  font-weight: 800;
  color: rgba(255,255,255,0.98);
  text-shadow: 0 2px 8px rgba(0,0,0,0.18);
  text-align: right;
}

.finance-stat-card.is-active .fsc-label::before {
  content: '✦ ';
  font-size: 0.6rem;
  opacity: 0.9;
  vertical-align: middle;
}

/* ─── Project Cards ──────────────────────────────── */
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
