<template>
  <div class="finance-dashboard-page">
    <div v-if="loading" class="text-center py-5">
      <CSpinner color="primary" />
      <div class="mt-2 text-muted">กำลังโหลดข้อมูลงบประมาณ...</div>
    </div>

    <CAlert v-else-if="fetchError" color="danger" show>
      {{ fetchError }}
    </CAlert>

    <div v-else>
      <CRow class="mb-4">
        <CCol sm="6" lg="3" class="mb-3 mb-lg-0">
          <CCallout color="primary" class="finance-summary-card mb-0">
            <small class="text-muted">โครงการที่ได้รับมอบหมาย</small><br>
            <strong class="h4">{{ summary.assignedCount }}</strong>
          </CCallout>
        </CCol>
        <CCol sm="6" lg="3" class="mb-3 mb-lg-0">
          <CCallout color="warning" class="finance-summary-card mb-0">
            <small class="text-muted">รอบันทึกผล</small><br>
            <strong class="h4">{{ summary.pendingCount }}</strong>
          </CCallout>
        </CCol>
        <CCol sm="6" lg="3" class="mb-3 mb-sm-0">
          <CCallout color="success" class="finance-summary-card mb-0">
            <small class="text-muted">ส่งผลแล้ว</small><br>
            <strong class="h4">{{ summary.submittedCount }}</strong>
          </CCallout>
        </CCol>
        <CCol sm="6" lg="3">
          <CCallout color="info" class="finance-summary-card mb-0">
            <small class="text-muted">งบรวมที่ได้รับมอบหมาย</small><br>
            <strong class="h5">{{ formatMoney(summary.totalBudget) }}</strong>
          </CCallout>
        </CCol>
      </CRow>

      <CCard class="finance-highlight-card mb-4">
        <CCardHeader class="d-flex justify-content-between align-items-center flex-wrap" style="gap: 8px;">
          <strong>การ์ดสรุปงบประมาณโครงการที่ได้รับมอบหมาย</strong>
          <CButton size="sm" color="primary" variant="outline" @click="$router.push('/finance-officer/assigned')">ดูรายการทั้งหมด</CButton>
        </CCardHeader>
        <CCardBody>
          <div v-if="cards.length === 0" class="text-muted text-center py-4">ยังไม่มีโครงการที่ได้รับมอบหมาย</div>
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
              <div class="finance-project-card__leader">หัวหน้าโครงการ: {{ item.applicantName }}</div>
              <div class="finance-project-card__stats">
                <div>
                  <small class="text-muted d-block">งบที่เสนอ</small>
                  <strong>{{ formatMoney(item.budgetTotal) }}</strong>
                </div>
                <div>
                  <small class="text-muted d-block">เพดานงบ</small>
                  <strong>{{ formatMoney(item.budgetLimit) }}</strong>
                </div>
                <div>
                  <small class="text-muted d-block">คงเหลือ</small>
                  <strong :class="item.remainingClass">{{ formatMoney(item.remainingBudget) }}</strong>
                </div>
              </div>
              <div class="finance-project-card__footer">
                <small class="text-muted">อัปเดตล่าสุด {{ formatDate(item.latestActivityAt) }}</small>
                <CButton size="sm" color="primary" @click="viewProposal(item)">ตรวจสอบงบประมาณ</CButton>
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
          const assignmentLabel = getFinanceAssignmentStatusLabel(item)
          return {
            ...item,
            applicantName: getApplicantName(item),
            budgetTotal,
            budgetLimit,
            remainingBudget,
            fundingDisplay: getFundingDisplay(item, this.fundingBudgetConfig),
            latestActivityAt: getLatestProposalActivity(item),
            assignmentLabel,
            assignmentColor: assignmentLabel === 'ส่งผลการตรวจสอบแล้ว' ? 'success' : 'warning',
            remainingClass: budgetLimit > 0 && budgetTotal > budgetLimit ? 'text-danger' : 'text-success'
          }
        })
        .sort((left, right) => new Date(right.latestActivityAt || 0).getTime() - new Date(left.latestActivityAt || 0).getTime())
    },
    summary () {
      return this.proposals.reduce((acc, item) => {
        acc.assignedCount += 1
        acc.totalBudget += item.budgetTotal
        if (item.assignmentLabel === 'ส่งผลการตรวจสอบแล้ว') {
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
        this.fetchError = (error && error.response && error.response.data && error.response.data.message) || error.message || 'ไม่สามารถโหลดข้อมูลได้'
      } finally {
        this.loading = false
      }
    },
    viewProposal (item) {
      this.$router.push(`/finance-officer/proposals/${item._id}`)
    },
    formatMoney (value) {
      return `${Number(value || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท`
    },
    formatDate (value) {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '-'
      return date.toLocaleString('th-TH')
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
