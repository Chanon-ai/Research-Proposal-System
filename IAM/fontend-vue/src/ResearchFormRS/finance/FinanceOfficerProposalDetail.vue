<template>
  <div>
    <div v-if="loading" class="text-center py-5">
      <CSpinner color="primary" />
      <div class="mt-2 text-muted">กำลังโหลดรายละเอียดโครงการ...</div>
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
              <strong>สรุปงบประมาณโครงการ</strong>
            </CCardHeader>
            <CCardBody>
              <div class="finance-metric-grid">
                <div class="finance-metric-box">
                  <small class="text-muted d-block">ประเภททุน</small>
                  <strong>{{ fundingDisplay }}</strong>
                </div>
                <div class="finance-metric-box">
                  <small class="text-muted d-block">สถานะงาน</small>
                  <CBadge :color="assignmentBadgeColor">{{ assignmentLabel }}</CBadge>
                </div>
                <div class="finance-metric-box">
                  <small class="text-muted d-block">งบที่เสนอ</small>
                  <strong>{{ formatMoney(budgetTotal) }}</strong>
                </div>
                <div class="finance-metric-box">
                  <small class="text-muted d-block">เพดานงบ</small>
                  <strong>{{ budgetLimit > 0 ? formatMoney(budgetLimit) : '-' }}</strong>
                </div>
                <div class="finance-metric-box">
                  <small class="text-muted d-block">คงเหลือ</small>
                  <strong :class="remainingClass">{{ budgetLimit > 0 ? formatMoney(remainingBudget) : '-' }}</strong>
                </div>
                <div class="finance-metric-box">
                  <small class="text-muted d-block">ผู้รับผิดชอบ</small>
                  <strong>{{ applicantName }}</strong>
                </div>
              </div>
              <div class="mt-3 text-muted small">
                สถานะปัจจุบันของโครงการ: {{ proposal.currentStatus || '-' }}
              </div>
            </CCardBody>
          </CCard>

          <CCard class="finance-detail-card">
            <CCardHeader class="d-flex justify-content-between align-items-center flex-wrap" style="gap: 8px;">
              <strong>บันทึกผลการตรวจสอบงบประมาณ</strong>
              <small class="text-muted">ผลการบันทึกจะถูกส่งกลับไปยังแอดมิน</small>
            </CCardHeader>
            <CCardBody>
              <CTextarea
                v-model="form.summaryComment"
                label="บันทึกผลการตรวจสอบ"
                rows="8"
                placeholder="ระบุข้อสังเกต ข้อเสนอแนะ หรือประเด็นที่ต้องการให้แอดมินติดตาม"
                :disabled="isLocked"
              />

              <CAlert v-if="budgetLimit > 0 && budgetTotal > budgetLimit" color="warning" show class="mt-3 mb-0">
                งบประมาณที่เสนอเกินเพดานงบที่กำหนด
              </CAlert>

              <CAlert v-if="submittedAtText" color="success" show class="mt-3 mb-0">
                ส่งผลการตรวจสอบแล้วเมื่อ {{ submittedAtText }}
              </CAlert>

              <div class="d-flex justify-content-end mt-4">
                <CButton color="secondary" variant="outline" class="mr-2" @click="goBack">กลับ</CButton>
                <CButton color="info" class="mr-2" :disabled="isLocked || isSubmitting" @click="saveDraft">บันทึกฉบับร่าง</CButton>
                <CButton color="primary" :disabled="isLocked || isSubmitting" @click="submitReview">ส่งผลให้แอดมิน</CButton>
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
  getFinanceAssignmentStatusLabel,
  getFundingDisplay,
  resolveBudgetTotal
} from '@/ResearchFormRS/utils/financeBudget'

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
    assignmentLabel () {
      return getFinanceAssignmentStatusLabel(this.proposal)
    },
    assignmentBadgeColor () {
      return this.assignmentLabel === 'ส่งผลการตรวจสอบแล้ว' ? 'success' : 'warning'
    },
    isLocked () {
      return this.assignmentLabel === 'ส่งผลการตรวจสอบแล้ว' || String(this.proposal && this.proposal.currentStatus || '') !== 'finance_budget_checking'
    },
    remainingClass () {
      return this.budgetLimit > 0 && this.budgetTotal > this.budgetLimit ? 'text-danger' : 'text-success'
    },
    submittedAtText () {
      const submittedAt = this.financeAssignment && this.financeAssignment.submittedAt
      if (!submittedAt) return ''
      const date = new Date(submittedAt)
      return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('th-TH')
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
        this.error = (error && error.response && error.response.data && error.response.data.message) || error.message || 'ไม่สามารถโหลดรายละเอียดโครงการได้'
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
        await Swal.fire({ icon: 'success', title: 'บันทึกฉบับร่างแล้ว', timer: 1400, showConfirmButton: false })
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: 'บันทึกฉบับร่างไม่สำเร็จ',
          text: (error && error.response && error.response.data && error.response.data.message) || 'กรุณาลองใหม่อีกครั้ง'
        })
      } finally {
        this.isSubmitting = false
      }
    },
    async submitReview () {
      if (!String(this.form.summaryComment || '').trim()) {
        await Swal.fire({ icon: 'warning', title: 'กรุณาระบุบันทึกผลการตรวจสอบก่อนส่ง' })
        return
      }

      const confirmed = await Swal.fire({
        icon: 'question',
        title: 'ยืนยันการส่งผลการตรวจสอบงบประมาณ',
        text: 'เมื่อส่งแล้ว ระบบจะส่งบันทึกนี้กลับไปยังแอดมินและล็อกการแก้ไข',
        showCancelButton: true,
        confirmButtonText: 'ยืนยันการส่ง',
        cancelButtonText: 'ยกเลิก'
      })
      if (!confirmed.isConfirmed) return

      this.isSubmitting = true
      try {
        await Service.proposal.saveFinanceReview(encodeURIComponent(this.proposalId), {
          summaryComment: this.form.summaryComment,
          isSubmit: true
        })
        await this.fetchProposal()
        await Swal.fire({ icon: 'success', title: 'ส่งผลการตรวจสอบให้แอดมินแล้ว', timer: 1600, showConfirmButton: false })
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: 'ส่งผลการตรวจสอบไม่สำเร็จ',
          text: (error && error.response && error.response.data && error.response.data.message) || 'กรุณาลองใหม่อีกครั้ง'
        })
      } finally {
        this.isSubmitting = false
      }
    },
    goBack () {
      this.$router.push('/finance-officer/assigned')
    },
    formatMoney (value) {
      return `${Number(value || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท`
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