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
      <CCol col="12">
        <div class="finance-detail-sticky">
          <CCard class="mb-3 finance-detail-card">
            <CCardHeader>
              <strong>{{ $t('finance.detail.summaryTitle') }}</strong>
            </CCardHeader>
            <CCardBody>
              <div class="finance-meta-grid">
                <div class="finance-meta-item">
                  <small class="text-muted d-block">{{ $t('finance.detail.fundingType') }}</small>
                  <strong>{{ fundingDisplay }}</strong>
                </div>
                <div class="finance-meta-item">
                  <small class="text-muted d-block">{{ $t('finance.detail.assignmentStatus') }}</small>
                  <CBadge :color="assignmentBadgeColor">{{ assignmentLabel }}</CBadge>
                </div>
                <div class="finance-meta-item">
                  <small class="text-muted d-block">{{ $t('finance.detail.applicant') }}</small>
                  <strong>{{ applicantName }}</strong>
                </div>
              </div>

              <CCard class="mt-3 mb-0 shadow-sm border-0 finance-budget-report-card" :class="{ 'is-dark': isDarkTheme }">
                <CCardBody class="p-3">
                  <BudgetReport
                    :model-value="budgetSnapshot"
                    :is-read-only="true"
                    :current-status="proposal && proposal.currentStatus"
                  />
                </CCardBody>
              </CCard>

              <div class="mt-3 text-muted small">
                {{ $t('finance.detail.currentStatus', { status: currentStatusLabel }) }}
              </div>

              <div class="finance-review-section mt-4 pt-4">
                <div class="d-flex justify-content-between align-items-center flex-wrap" style="gap: 8px;">
                  <strong>{{ $t('finance.detail.reviewTitle') }}</strong>
                  <small class="text-muted">{{ $t('finance.detail.reviewHint') }}</small>
                </div>

                <CTextarea
                  v-model="form.summaryComment"
                  :label="$t('finance.detail.reviewLabel')"
                  rows="8"
                  :placeholder="$t('finance.detail.reviewPlaceholder')"
                  :disabled="isLocked"
                  class="mt-3"
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
                  <CButton color="warning" class="mr-2" :disabled="isLocked || isSubmitting" @click="submitReview('revision')">{{ $t('finance.actions.requestRevision') }}</CButton>
                  <CButton color="primary" :disabled="isLocked || isSubmitting" @click="submitReview('submit')">{{ $t('finance.actions.submitToAdmin') }}</CButton>
                </div>
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
import BudgetReport from '@/ResearchFormRS/component/BudgetReport.vue'
import { loadResearchFormRuntimeConfigs } from '@/ResearchFormRS/utils/researchConfigRuntime'
import centerLoadingMixin from '@/ResearchFormRS/utils/centerLoadingMixin'
import {
  createDefaultFundingBudgetConfig,
  readFundingBudgetConfigFromFallbackStorage
} from '@/ResearchFormRS/utils/fundingBudgetConfig'
import {
  getApplicantName,
  getBudgetLimit,
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
    BudgetReport
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
    isDarkTheme () {
      return Boolean(this.$store && this.$store.state && this.$store.state.darkMode)
    },
    centerLoadingActive () {
      return Boolean(this.loading || this.isSubmitting)
    },
    budgetSnapshot () {
      return this.proposal && this.proposal.formSnapshotJson && typeof this.proposal.formSnapshotJson === 'object'
        ? this.proposal.formSnapshotJson.budget || {}
        : {}
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
    async submitReview (mode = 'submit') {
      if (!String(this.form.summaryComment || '').trim()) {
        await Swal.fire({ icon: 'warning', title: this.$t('finance.alerts.requireComment') })
        return
      }

      const isRevisionMode = mode === 'revision'

      const confirmed = await Swal.fire({
        icon: 'question',
        title: isRevisionMode ? this.$t('finance.alerts.confirmRevisionTitle') : this.$t('finance.alerts.confirmSubmitTitle'),
        text: isRevisionMode ? this.$t('finance.alerts.confirmRevisionText') : this.$t('finance.alerts.confirmSubmitText'),
        showCancelButton: true,
        confirmButtonText: isRevisionMode ? this.$t('finance.alerts.confirmRevisionButton') : this.$t('finance.alerts.confirmSubmitButton'),
        cancelButtonText: this.$t('finance.alerts.cancel')
      })
      if (!confirmed.isConfirmed) return

      this.isSubmitting = true
      try {
        await Service.proposal.saveFinanceReview(encodeURIComponent(this.proposalId), {
          summaryComment: this.form.summaryComment,
          decision: isRevisionMode ? 'revision' : 'submit',
          isSubmit: true
        })
        await this.fetchProposal()
        await Swal.fire({
          icon: 'success',
          title: isRevisionMode ? this.$t('finance.alerts.revisionSuccess') : this.$t('finance.alerts.submitSuccess'),
          timer: 1600,
          showConfirmButton: false
        })
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: isRevisionMode ? this.$t('finance.alerts.revisionError') : this.$t('finance.alerts.submitError'),
          text: (error && error.response && error.response.data && error.response.data.message) || this.$t('finance.alerts.retry')
        })
      } finally {
        this.isSubmitting = false
      }
    },
    goBack () {
      this.$router.push('/finance-officer/assigned')
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

.finance-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.finance-meta-item {
  border: 1px solid #dbe4f0;
  border-radius: 14px;
  padding: 14px;
  background: #f8fbff;
}

.finance-budget-report-card {
  border: 2px solid #8b1212 !important;
  border-radius: 14px !important;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.2), 0 4px 12px rgba(139, 18, 18, 0.18);
}

.finance-review-section {
  border-top: 1px solid #dbe4f0;
}

.finance-budget-report-card.is-dark {
  background-color: #1f2b39 !important;
  border-color: #33475c !important;
}

.finance-budget-report-card.is-dark ::v-deep .budget-report-table {
  background: #1a2432;
  border-color: #324458;
}

.finance-budget-report-card.is-dark ::v-deep .budget-report-table th,
.finance-budget-report-card.is-dark ::v-deep .budget-report-table td {
  border-color: #324458 !important;
}

.finance-budget-report-card.is-dark ::v-deep .budget-report-table thead th {
  background: #243548;
  color: #e6edf7;
}

.finance-budget-report-card.is-dark ::v-deep .budget-report-category-row td {
  background: #1f2d3d;
  color: #e6edf7;
  border-top-color: #3b5168 !important;
}

.finance-budget-report-card.is-dark ::v-deep .budget-report-item-row td {
  background: #1a2432;
  color: #dce7f5;
}

.finance-budget-report-card.is-dark ::v-deep .budget-report-total-row td {
  background: #223142;
  color: #f3f7fd;
}

.finance-budget-report-card.is-dark ::v-deep .budget-report-chip {
  color: #fecaca;
  background: rgba(127, 29, 29, 0.34);
  border-color: rgba(248, 113, 113, 0.42);
}

@media (max-width: 991px) {
  .finance-detail-sticky {
    position: static;
    margin-top: 16px;
  }

  .finance-meta-grid,
  .finance-meta-grid {
    grid-template-columns: 1fr;
  }
}
</style>