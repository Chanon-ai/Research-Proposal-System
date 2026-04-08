<template>
  <div>
    <div v-if="loading" class="text-center py-5">
      <CSpinner color="primary" />
      <div class="mt-2 text-muted">{{ $t('finance.detail.loading') }}</div>
    </div>

    <CAlert v-else-if="error" color="danger" show>
      {{ error }}
    </CAlert>

    <CRow v-else-if="proposal">
      <CCol col="12" lg="7">
        <ResearchForm :prefill="researchPrefill" :proposal-id="proposalId" :read-only="true" />
      </CCol>
      <CCol col="12" lg="5">
        <div class="finance-detail-sticky">
          <CCard class="mb-3 finance-detail-card">
            <CCardHeader>
              <strong>{{ $t('finance.detail.summaryTitle') }}</strong>
            </CCardHeader>
            <CCardBody>
              <div class="finance-metric-grid">
                <div class="finance-metric-box">
                  <small class="text-muted d-block">{{ $t('finance.detail.fundingType') }}</small>
                  <strong>{{ fundingDisplay }}</strong>
                </div>
                <div class="finance-metric-box">
                  <small class="text-muted d-block">{{ $t('finance.detail.assignmentStatus') }}</small>
                  <CBadge :color="assignmentBadgeColor">{{ assignmentLabel }}</CBadge>
                </div>
                <div class="finance-metric-box">
                  <small class="text-muted d-block">{{ $t('finance.labels.proposedBudget') }}</small>
                  <strong>{{ formatMoney(budgetTotal) }}</strong>
                </div>
                <div class="finance-metric-box">
                  <small class="text-muted d-block">{{ $t('finance.labels.budgetLimit') }}</small>
                  <strong>{{ budgetLimit > 0 ? formatMoney(budgetLimit) : '-' }}</strong>
                </div>
                <div class="finance-metric-box">
                  <small class="text-muted d-block">{{ $t('finance.labels.remainingBudget') }}</small>
                  <strong :class="remainingClass">{{ budgetLimit > 0 ? formatMoney(remainingBudget) : '-' }}</strong>
                </div>
                <div class="finance-metric-box">
                  <small class="text-muted d-block">{{ $t('finance.detail.applicant') }}</small>
                  <strong>{{ applicantName }}</strong>
                </div>
              </div>
              <div class="mt-3 text-muted small">
                {{ $t('finance.detail.currentStatus', { status: currentStatusLabel }) }}
              </div>
            </CCardBody>
          </CCard>

          <CCard class="finance-detail-card">
            <CCardHeader class="d-flex justify-content-between align-items-center flex-wrap" style="gap: 8px;">
              <strong>{{ $t('finance.detail.reviewTitle') }}</strong>
              <small class="text-muted">{{ $t('finance.detail.reviewHint') }}</small>
            </CCardHeader>
            <CCardBody>
              <CTextarea
                v-model="form.summaryComment"
                :label="$t('finance.detail.reviewLabel')"
                rows="8"
                :placeholder="$t('finance.detail.reviewPlaceholder')"
                :disabled="isLocked"
              />

              <CAlert v-if="budgetLimit > 0 && budgetTotal > budgetLimit" color="warning" show class="mt-3 mb-0">
                {{ $t('finance.detail.overLimit') }}
              </CAlert>

              <CAlert v-if="submittedAtText" color="success" show class="mt-3 mb-0">
                {{ $t('finance.detail.submittedAt', { date: submittedAtText }) }}
              </CAlert>

              <div class="d-flex justify-content-end mt-4">
                <CButton color="secondary" variant="outline" class="mr-2" @click="goBack">{{ $t('finance.actions.back') }}</CButton>
                <CButton color="info" class="mr-2" :disabled="isLocked || isSubmitting" @click="saveDraft">{{ $t('finance.actions.saveDraft') }}</CButton>
                <CButton color="primary" :disabled="isLocked || isSubmitting" @click="submitReview">{{ $t('finance.actions.submitToAdmin') }}</CButton>
              </div>
            </CCardBody>
          </CCard>
        </div>
      </CCol>
    </CRow>
  </div>
</template>

<script>
import Swal from 'sweetalert2'
import Service from '@/service/api'
import ResearchForm from '../ResearchForm.vue'
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
  getFinanceAssignment,
  getFinanceAssignmentStatusKey,
  getFinanceAssignmentStatusLabel,
  getFundingDisplay,
  resolveBudgetTotal
} from '@/ResearchFormRS/utils/financeBudget'
import { normalizeProposalStatus } from '@/ResearchFormRS/constants/proposalWorkflow'

export default {
  name: 'FinanceOfficerProposalDetail',
  components: {
    ResearchForm
  },
  mixins: [centerLoadingMixin],
  data () {
    return {
      loading: false,
      isSubmitting: false,
      error: '',
      proposal: null,
      fundingBudgetConfig: createDefaultFundingBudgetConfig(),
      form: {
        summaryComment: ''
      }
    }
  },
  computed: {
    proposalId () {
      return this.$route.params.id || ''
    },
    centerLoadingActive () {
      return Boolean(this.loading || this.isSubmitting)
    },
    researchPrefill () {
      if (!this.proposal) return null
      const snapshot = this.proposal.formSnapshotJson || {}
      return {
        projectNameThai: this.proposal.projectTitleTh || snapshot.projectNameThai || '',
        projectNameEnglish: this.proposal.projectTitleEn || snapshot.projectNameEnglish || ''
      }
    },
    applicantName () {
      return getApplicantName(this.proposal)
    },
    budgetTotal () {
      return resolveBudgetTotal(this.proposal)
    },
    budgetLimit () {
      return getBudgetLimit(this.proposal, this.fundingBudgetConfig)
    },
    remainingBudget () {
      return getBudgetRemaining(this.proposal, this.fundingBudgetConfig)
    },
    fundingDisplay () {
      return getFundingDisplay(this.proposal, this.fundingBudgetConfig)
    },
    financeAssignment () {
      return getFinanceAssignment(this.proposal)
    },
    assignmentStatusKey () {
      return getFinanceAssignmentStatusKey(this.proposal)
    },
    assignmentLabel () {
      return getFinanceAssignmentStatusLabel(this.proposal, key => this.$t(key))
    },
    assignmentBadgeColor () {
      return this.assignmentStatusKey === 'submitted' ? 'success' : 'warning'
    },
    isLocked () {
      return this.assignmentStatusKey === 'submitted' || String(this.proposal && this.proposal.currentStatus || '') !== 'finance_budget_checking'
    },
    currentStatusLabel () {
      const statusKey = normalizeProposalStatus(this.proposal && this.proposal.currentStatus)
      if (!statusKey) return '-'
      return this.$te(`proposalStatus.${statusKey}`) ? this.$t(`proposalStatus.${statusKey}`) : statusKey
    },
    remainingClass () {
      return this.budgetLimit > 0 && this.budgetTotal > this.budgetLimit ? 'text-danger' : 'text-success'
    },
    submittedAtText () {
      const submittedAt = this.financeAssignment && this.financeAssignment.submittedAt
      if (!submittedAt) return ''
      const date = new Date(submittedAt)
      return Number.isNaN(date.getTime()) ? '' : date.toLocaleString(this.$i18n.locale === 'en' ? 'en-US' : 'th-TH')
    }
  },
  watch: {
    '$route.params.id': {
      immediate: true,
      handler () {
        this.load()
      }
    }
  },
  methods: {
    loadFundingBudgetConfig () {
      const fallbackConfig = readFundingBudgetConfigFromFallbackStorage()
      this.fundingBudgetConfig = Array.isArray(fallbackConfig) && fallbackConfig.length > 0
        ? fallbackConfig
        : createDefaultFundingBudgetConfig()
    },
    async load () {
      if (!this.proposalId) return
      await loadResearchFormRuntimeConfigs()
      this.loadFundingBudgetConfig()
      await this.fetchProposal()
    },
    async fetchProposal () {
      this.loading = true
      this.error = ''
      try {
        const response = await Service.proposal.getById(encodeURIComponent(this.proposalId))
        const payload = response && response.data ? response.data : {}
        this.proposal = payload.data || payload
        this.form.summaryComment = this.financeAssignment && this.financeAssignment.summaryComment
          ? String(this.financeAssignment.summaryComment)
          : ''
      } catch (error) {
        this.proposal = null
        this.error = (error && error.response && error.response.data && error.response.data.message) || error.message || this.$t('finance.errors.loadDetail')
      } finally {
        this.loading = false
      }
    },
    async saveDraft () {
      this.isSubmitting = true
      try {
        await Service.proposal.saveFinanceReview(encodeURIComponent(this.proposalId), {
          summaryComment: this.form.summaryComment,
          isSubmit: false
        })
        await this.fetchProposal()
        await Swal.fire({ icon: 'success', title: this.$t('finance.alerts.saveDraftSuccess'), timer: 1400, showConfirmButton: false })
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: this.$t('finance.alerts.saveDraftError'),
          text: (error && error.response && error.response.data && error.response.data.message) || this.$t('finance.alerts.retry')
        })
      } finally {
        this.isSubmitting = false
      }
    },
    async submitReview () {
      if (!String(this.form.summaryComment || '').trim()) {
        await Swal.fire({ icon: 'warning', title: this.$t('finance.alerts.requireComment') })
        return
      }

      const confirmed = await Swal.fire({
        icon: 'question',
        title: this.$t('finance.alerts.confirmSubmitTitle'),
        text: this.$t('finance.alerts.confirmSubmitText'),
        showCancelButton: true,
        confirmButtonText: this.$t('finance.alerts.confirmSubmitButton'),
        cancelButtonText: this.$t('finance.alerts.cancel')
      })
      if (!confirmed.isConfirmed) return

      this.isSubmitting = true
      try {
        await Service.proposal.saveFinanceReview(encodeURIComponent(this.proposalId), {
          summaryComment: this.form.summaryComment,
          isSubmit: true
        })
        await this.fetchProposal()
        await Swal.fire({ icon: 'success', title: this.$t('finance.alerts.submitSuccess'), timer: 1600, showConfirmButton: false })
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: this.$t('finance.alerts.submitError'),
          text: (error && error.response && error.response.data && error.response.data.message) || this.$t('finance.alerts.retry')
        })
      } finally {
        this.isSubmitting = false
      }
    },
    goBack () {
      this.$router.push('/finance-officer/assigned')
    },
    formatMoney (value) {
      return `${Number(value || 0).toLocaleString(this.$i18n.locale === 'en' ? 'en-US' : 'th-TH', { maximumFractionDigits: 2 })} ${this.$t('finance.common.currency')}`
    }
  }
}
</script>

<style scoped>
.finance-detail-sticky {
  position: sticky;
  top: 16px;
}

.finance-detail-card {
  border-radius: 16px;
  overflow: hidden;
}

.finance-metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.finance-metric-box {
  border: 1px solid #dbe4f0;
  border-radius: 14px;
  padding: 14px;
  background: #f8fbff;
}

@media (max-width: 991px) {
  .finance-detail-sticky {
    position: static;
    margin-top: 16px;
  }
}
</style>