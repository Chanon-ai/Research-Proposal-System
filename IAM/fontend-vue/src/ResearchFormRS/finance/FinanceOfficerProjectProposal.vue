<template>
  <div class="finance-assigned-page">
    <div class="summary-strip mb-4">
      <div
        v-for="tile in summaryTiles"
        :key="tile.key"
        class="summary-strip__card"
        :class="{ 'is-active': filterStatus === tile.key }"
        role="button"
        tabindex="0"
        @click="filterStatus = tile.key"
        @keydown.enter.prevent="filterStatus = tile.key"
        @keydown.space.prevent="filterStatus = tile.key"
      >
        <small class="text-muted d-block">{{ tile.label }}</small>
        <strong class="h4 mb-0">{{ tile.value }}</strong>
      </div>
    </div>

    <CCard>
      <CCardHeader class="d-flex justify-content-between align-items-center flex-wrap" style="gap: 8px;">
        <strong>รายการโครงการที่ได้รับมอบหมายด้านงบประมาณ</strong>
        <CInput class="finance-search" :value.sync="searchQuery" placeholder="ค้นหาชื่อโครงการ หรือ รหัสโครงการ" />
      </CCardHeader>
      <CCardBody>
        <div v-if="loading" class="text-center py-5">
          <CSpinner color="primary" />
          <div class="mt-2 text-muted">กำลังโหลดรายการ...</div>
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
            :no-items-view="{ noResults: 'ไม่พบข้อมูลที่ค้นหา', noItems: 'ยังไม่มีโครงการที่ได้รับมอบหมาย' }"
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
                <CButton size="sm" color="primary" @click="viewProposal(item)">ตรวจสอบงบประมาณ</CButton>
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
      filterStatus: 'all',
      fields: [
        { key: 'proposalCode', label: 'รหัสโครงการ' },
        { key: 'projectTitleTh', label: 'ชื่อโครงการ' },
        { key: 'budgetTotal', label: 'งบที่เสนอ' },
        { key: 'budgetLimit', label: 'เพดานงบ' },
        { key: 'remainingBudget', label: 'คงเหลือ' },
        { key: 'assignmentLabel', label: 'สถานะงาน' },
        { key: 'actions', label: '' }
      ]
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
      return (this.proposalsRaw || []).map(item => {
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
          assignmentLabel,
          assignmentColor: assignmentLabel === 'ส่งผลการตรวจสอบแล้ว' ? 'success' : 'warning',
          remainingClass: budgetLimit > 0 && budgetTotal > budgetLimit ? 'text-danger font-weight-bold' : 'text-success font-weight-bold'
        }
      })
    },
    displayItems () {
      const keyword = String(this.searchQuery || '').trim().toLowerCase()
      return this.proposals.filter(item => {
        if (this.filterStatus === 'pending' && item.assignmentLabel === 'ส่งผลการตรวจสอบแล้ว') return false
        if (this.filterStatus === 'submitted' && item.assignmentLabel !== 'ส่งผลการตรวจสอบแล้ว') return false
        if (this.filterStatus === 'over_limit' && !(item.budgetLimit > 0 && item.budgetTotal > item.budgetLimit)) return false
        if (!keyword) return true
        return [item.proposalCode, item.projectTitleTh, item.projectTitleEn, item.applicantName]
          .map(value => String(value || '').toLowerCase())
          .some(value => value.includes(keyword))
      })
    },
    summaryTiles () {
      const submittedCount = this.proposals.filter(item => item.assignmentLabel === 'ส่งผลการตรวจสอบแล้ว').length
      const pendingCount = this.proposals.filter(item => item.assignmentLabel !== 'ส่งผลการตรวจสอบแล้ว').length
      const overLimitCount = this.proposals.filter(item => item.budgetLimit > 0 && item.budgetTotal > item.budgetLimit).length
      return [
        { key: 'all', label: 'ทั้งหมด', value: this.proposals.length },
        { key: 'pending', label: 'รอบันทึกผล', value: pendingCount },
        { key: 'submitted', label: 'ส่งผลแล้ว', value: submittedCount },
        { key: 'over_limit', label: 'เกินเพดานงบ', value: overLimitCount }
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
    }
  }
}
</script>

<style scoped>
.summary-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.summary-strip__card {
  border: 1px solid #dbe4f0;
  border-radius: 14px;
  padding: 14px 16px;
  background: #fff;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.06);
  cursor: pointer;
}

.summary-strip__card.is-active {
  border-color: #8c1515;
  box-shadow: 0 14px 26px rgba(140, 21, 21, 0.12);
}

.finance-search {
  width: 320px;
  max-width: 100%;
}
</style>
