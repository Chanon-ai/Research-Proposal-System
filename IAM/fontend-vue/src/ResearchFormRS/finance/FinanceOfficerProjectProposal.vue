<template>
  <div class="finance-assigned-page">
    <div class="summary-strip mb-4">
      <div
        v-for="tile in summaryTiles"
        :key="tile.key"
        class="summary-strip__card"
        :class="[`summary-strip__card--${tile.key}`, { 'is-active': filterStatus === tile.key }]"
        role="button"
        tabindex="0"
        @click="filterStatus = tile.key"
        @keydown.enter.prevent="filterStatus = tile.key"
        @keydown.space.prevent="filterStatus = tile.key"
      >
        <div class="strip-left">
          <span class="strip-icon-wrap">
            <CIcon :name="tile.icon" class="strip-icon" />
          </span>
          <span class="strip-label">{{ tile.label }}</span>
        </div>
        <div class="strip-right">
          <span class="strip-count">{{ tile.value }}</span>
        </div>
      </div>
    </div>

    <CCard>
      <CCardHeader class="d-flex justify-content-between align-items-center flex-wrap" style="gap: 8px;">
        <strong>{{ $t('finance.assigned.title') }}</strong>
        <CInput class="finance-search" :value.sync="searchQuery" :placeholder="$t('finance.assigned.searchPlaceholder')" />
      </CCardHeader>
      <CCardBody>
        <div v-if="loading" class="text-center py-5">
          <CSpinner color="primary" />
          <div class="mt-2 text-muted">{{ $t('finance.assigned.loading') }}</div>
        </div>
        <CAlert v-else-if="fetchError" color="danger" show>
          {{ fetchError }}
        </CAlert>
        <div v-else>
          <CDataTable
            :items="displayItems"
            :fields="fields"
            hover
            striped
            bordered
            small
            :items-per-page="10"
            :no-items-view="{ noResults: $t('finance.assigned.noResults'), noItems: $t('finance.assigned.noItems') }"
          >
            <template #projectTitleTh="{ item }">
              <td>
                <div class="font-weight-bold">{{ item.projectTitleTh || '-' }}</div>
                <small class="text-muted">{{ item.applicantName }}</small>
              </td>
            </template>
            <template #budgetTotal="{ item }">
              <td>{{ formatMoney(item.budgetTotal) }}</td>
            </template>
            <template #budgetLimit="{ item }">
              <td>{{ item.budgetLimit > 0 ? formatMoney(item.budgetLimit) : '-' }}</td>
            </template>
            <template #remainingBudget="{ item }">
              <td :class="item.remainingClass">{{ item.budgetLimit > 0 ? formatMoney(item.remainingBudget) : '-' }}</td>
            </template>
            <template #assignmentLabel="{ item }">
              <td>
                <CBadge :color="item.assignmentColor">{{ item.assignmentLabel }}</CBadge>
              </td>
            </template>
            <template #actions="{ item }">
              <td>
                <CButton size="sm" color="primary" @click="viewProposal(item)">{{ $t('finance.actions.reviewBudget') }}</CButton>
              </td>
            </template>
          </CDataTable>
        </div>
      </CCardBody>
    </CCard>
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
  resolveBudgetTotal
} from '@/ResearchFormRS/utils/financeBudget'

export default {
  name: 'FinanceOfficerProjectProposal',
  mixins: [centerLoadingMixin],
  data () {
    return {
      loading: false,
      fetchError: '',
      proposalsRaw: [],
      fundingBudgetConfig: createDefaultFundingBudgetConfig(),
      searchQuery: '',
      filterStatus: 'all'
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
    fields () {
      return [
        { key: 'proposalCode', label: this.$t('finance.assigned.fields.proposalCode') },
        { key: 'projectTitleTh', label: this.$t('finance.assigned.fields.projectTitle') },
        { key: 'budgetTotal', label: this.$t('finance.assigned.fields.budgetTotal') },
        { key: 'budgetLimit', label: this.$t('finance.assigned.fields.budgetLimit') },
        { key: 'remainingBudget', label: this.$t('finance.assigned.fields.remainingBudget') },
        { key: 'assignmentLabel', label: this.$t('finance.assigned.fields.assignmentStatus') },
        { key: 'actions', label: '' }
      ]
    },
    proposals () {
      return (this.proposalsRaw || []).map(item => {
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
          assignmentStatusKey,
          assignmentLabel,
          assignmentColor: assignmentStatusKey === 'submitted' ? 'success' : 'warning',
          remainingClass: budgetLimit > 0 && budgetTotal > budgetLimit ? 'text-danger font-weight-bold' : 'text-success font-weight-bold'
        }
      })
    },
    displayItems () {
      const keyword = String(this.searchQuery || '').trim().toLowerCase()
      return this.proposals.filter(item => {
        if (this.filterStatus === 'pending' && item.assignmentStatusKey === 'submitted') return false
        if (this.filterStatus === 'submitted' && item.assignmentStatusKey !== 'submitted') return false
        if (this.filterStatus === 'over_limit' && !(item.budgetLimit > 0 && item.budgetTotal > item.budgetLimit)) return false
        if (!keyword) return true
        return [item.proposalCode, item.projectTitleTh, item.projectTitleEn, item.applicantName]
          .map(value => String(value || '').toLowerCase())
          .some(value => value.includes(keyword))
      })
    },
    summaryTiles () {
      const submittedCount = this.proposals.filter(item => item.assignmentStatusKey === 'submitted').length
      const pendingCount = this.proposals.filter(item => item.assignmentStatusKey !== 'submitted').length
      const overLimitCount = this.proposals.filter(item => item.budgetLimit > 0 && item.budgetTotal > item.budgetLimit).length
      return [
        { key: 'all',        label: this.$t('finance.assigned.tiles.all'),       value: this.proposals.length, color: 'gray',  icon: 'cil-layers' },
        { key: 'pending',    label: this.$t('finance.assigned.tiles.pending'),    value: pendingCount,          color: 'amber', icon: 'cil-clock' },
        { key: 'submitted',  label: this.$t('finance.assigned.tiles.submitted'),  value: submittedCount,        color: 'green', icon: 'cil-check-circle' },
        { key: 'over_limit', label: this.$t('finance.assigned.tiles.overLimit'),  value: overLimitCount,        color: 'red',   icon: 'cil-warning' }
      ]
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
    }
  }
}
</script>

<style scoped>
.finance-assigned-page ::v-deep .card-body,
.finance-assigned-page ::v-deep .table,
.finance-assigned-page ::v-deep .table-responsive {
  background: #ffffff;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (max-width: 768px) {
  .summary-strip { grid-template-columns: repeat(2, 1fr); }
}

.summary-strip__card {
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
  cursor: pointer;
  transform: scale(1);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  user-select: none;
  background: linear-gradient(135deg, var(--summary-start, #6b7280), var(--summary-end, #374151));
}

/* SVG graphic top-right */
.summary-strip__card::before {
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
/* Gloss overlay */
.summary-strip__card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 60%);
  pointer-events: none;
  z-index: 1;
}
.summary-strip__card > * { position: relative; z-index: 2; }

.summary-strip__card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.2);
}
.summary-strip__card.is-active {
  transform: scale(1.02);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.24);
}

/* Color + graphic per tile */
.summary-strip__card--all {
  --summary-start: #6b7280;
  --summary-end:   #4b5563;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect x='24' y='22' width='72' height='76' rx='12' fill='white' fill-opacity='0.9'/%3E%3Crect x='38' y='40' width='44' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3Crect x='38' y='54' width='40' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3Crect x='38' y='68' width='33' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3C/svg%3E");
}
.summary-strip__card--pending {
  --summary-start: #f59e0b;
  --summary-end:   #d97706;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M60 42v18l14 10' stroke='%23000000' stroke-width='7' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.22' fill='none'/%3E%3C/svg%3E");
}
.summary-strip__card--submitted {
  --summary-start: #16a34a;
  --summary-end:   #15803d;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M46 61l9 9 20-20' stroke='%23000000' stroke-width='8' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.24' fill='none'/%3E%3Ccircle cx='60' cy='60' r='44' stroke='white' stroke-opacity='0.42' stroke-width='5' fill='none'/%3E%3C/svg%3E");
}
.summary-strip__card--over_limit {
  --summary-start: #dc2626;
  --summary-end:   #b91c1c;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Cpolygon points='60%2C22 98%2C90 22%2C90' fill='white' fill-opacity='0.9'/%3E%3Cline x1='60' y1='50' x2='60' y2='70' stroke='%23000000' stroke-width='7' stroke-linecap='round' stroke-opacity='0.22'/%3E%3Ccircle cx='60' cy='80' r='4' fill='%23000000' fill-opacity='0.22'/%3E%3C/svg%3E");
}

/* Left: icon circle + label */
.strip-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.strip-icon-wrap {
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
.strip-card:hover .strip-icon-wrap,
.summary-strip__card:hover .strip-icon-wrap {
  transform: translateY(-3px);
  box-shadow: 0 10px 26px rgba(16,24,40,0.18);
}
.strip-icon {
  font-size: 1.9rem;
  display: inline-block;
  line-height: 1;
}
.strip-label {
  font-size: 0.82rem;
  color: rgba(255,255,255,0.9);
  font-weight: 600;
}

/* Right: count */
.strip-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
}
.strip-count {
  font-size: 2.2rem;
  font-weight: 800;
  color: rgba(255,255,255,0.98);
  text-shadow: 0 2px 8px rgba(0,0,0,0.18);
  text-align: right;
}

.finance-search {
  width: 320px;
  max-width: 100%;
}
</style>
