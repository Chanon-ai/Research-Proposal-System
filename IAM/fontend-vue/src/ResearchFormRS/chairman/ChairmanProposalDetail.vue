<template>
  <div>
    <div v-if="loading" class="text-center py-4">
      <CSpinner color="primary" />
      <div class="text-muted mt-2">กำลังโหลดรายละเอียดโครงการ...</div>
    </div>
    <CAlert v-else-if="error" color="danger" show>
      ไม่สามารถโหลดข้อมูลโครงการได้: {{ error }}
    </CAlert>
    <CRow>
      <CCol col="12" lg="7">
        <div v-if="proposal">
          <ResearchForm :prefill="researchPrefill" :proposal-id="proposalId" :read-only="true" />

          <CCard class="mt-3 mb-0">
            <CCardHeader>
              ไฟล์เอกสารแนบ
            </CCardHeader>
            <CCardBody>
              <CRow v-for="(fileItem, idx) in attachments" :key="idx" class="align-items-center mb-2">
                <CCol sm="8">
                  <CIcon name="cil-paperclip" class="mr-2" />
                  <span class="font-weight-bold">{{ fileItem.name }}</span>
                </CCol>
                <CCol sm="4" class="text-sm-right mt-2 mt-sm-0">
                  <CButton size="sm" color="primary" variant="outline" @click="downloadAttachment(fileItem)">
                    <CIcon name="cil-cloud-download" class="mr-1" /> ดาวน์โหลด
                  </CButton>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </div>

        <CCard v-else>
          <CCardBody>
            <CAlert color="warning" show>ไม่พบข้อเสนอโครงการ</CAlert>
            <CButton color="secondary" @click="goBack"><CIcon name="cil-chevron-right" class="mr-1" /> ย้อนกลับ</CButton>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol col="12" lg="5">
        <div class="evaluation-sticky">
          <CCard class="evaluation-card">
            <CCardHeader class="evaluation-card__header">
              Checklist พิจารณาข้อเสนอโครงการ
            </CCardHeader>
            <CCardBody v-if="proposal" class="evaluation-card__body" :class="{ 'evaluation-locked': isEvaluationLocked }">
              <CAlert
                color="light"
                v-if="submittedBannerVisible"
                show
                close-button
                class="evaluation-alert evaluation-alert--submitted"
                @update:show="submittedBannerVisible = false"
              >
                ส่งผลการพิจารณาเรียบร้อยแล้ว (ส่งซ้ำไม่ได้)
              </CAlert>
              <CAlert
                color="light"
                v-if="draftSaved"
                show
                close-button
                class="evaluation-alert evaluation-alert--draft"
                @update:show="draftSaved = false"
              >
                บันทึกฉบับร่างแล้ว
              </CAlert>
              <CAlert
                color="warning"
                v-if="reviewAvailabilityMessage"
                show
                class="evaluation-alert evaluation-alert--status"
              >
                {{ reviewAvailabilityMessage }}
              </CAlert>

              <CCard class="rubric-card mb-3">
                <CCardHeader class="rubric-card__header">
                  <div class="rubric-card__header-row">
                    <div class="rubric-card__title">Template checklist ตามประเภททุน</div>
                  </div>
                </CCardHeader>
                <CCardBody class="rubric-card__body">
                  <div class="rubric-toolbar rubric-toolbar--readonly">
                    <div class="rubric-toolbar__left">
                      <div class="rubric-toolbar__label">ประเภททุนที่ใช้อ้างอิง template</div>
                      <div class="rubric-toolbar__help text-muted small">
                        Template นี้ดึงจาก backend setting ตามทุนที่ผู้ยื่นเลือกไว้
                      </div>
                    </div>
                    <div class="rubric-toolbar__right">
                      <div class="rubric-fund-readonly" role="textbox" aria-readonly="true">
                        {{ selectedFundingLabel }}
                      </div>
                    </div>
                  </div>

                  <CAlert color="info" show class="small mb-3">
                    {{ importPlaceholderMessage }}
                  </CAlert>

                  <div class="rubric-list">
                    <div v-for="section in templateSections" :key="section.sectionKey" class="rubric-item">
                      <div class="rubric-item__main rubric-item__main--checklist">
                        <div>
                          <div class="rubric-topic-title">{{ section.sectionLabel }}</div>
                          <div v-if="section.description" class="text-muted small mt-1">{{ section.description }}</div>
                        </div>
                      </div>

                      <div v-if="section.items.length === 0" class="checklist-empty-state">
                        ยังไม่มี checklist item ใน template นี้ ตอนนี้เว้นส่วนนี้ไว้สำหรับ import ภายหลัง
                      </div>

                      <div v-else class="checklist-items">
                        <label v-for="item in section.items" :key="resolveChecklistItemId(section, item)" class="checklist-row">
                          <input
                            type="checkbox"
                            :checked="isChecklistChecked(section, item)"
                            :disabled="isEvaluationLocked"
                            @change="toggleChecklistItem(section, item, $event)"
                          >
                          <span class="checklist-row__text">
                            <span class="checklist-row__label">{{ item.label }}</span>
                            <span v-if="item.description" class="checklist-row__desc">{{ item.description }}</span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </CCardBody>
              </CCard>

              <CForm @submit.prevent>
                <CTextarea
                  label="ข้อคิดเห็นและข้อเสนอแนะ"
                  rows="5"
                  placeholder="พิมพ์ความคิดเห็น..."
                  :value.sync="form.comments"
                  :disabled="isEvaluationLocked"
                />

                <CInputFile
                  label="อัปโหลดไฟล์ประกอบการพิจารณาเพิ่มเติม (ยังไม่เชื่อม import จริง)"
                  custom
                  accept=".pdf,.doc,.docx,.xlsx"
                  :disabled="isEvaluationLocked"
                  @change="onEvaluationFileChange"
                />
                <div class="text-muted small" v-if="evaluationFileName">
                  ไฟล์ที่เลือก: {{ evaluationFileName }}
                </div>

                <div class="mt-3 mb-2 text-muted">ผลการพิจารณา</div>
                <div v-if="isEvaluationLocked" class="decision-readonly">
                  {{ decisionLabel }}
                </div>
                <CInputRadioGroup v-else :options="decisionOptions" :checked.sync="form.decision" custom />

                <div class="evaluation-actions">
                  <div class="form-actions">
                    <CButton color="secondary" variant="outline" :disabled="isEvaluationLocked" @click="saveDraft">
                      <CIcon name="cil-save" class="mr-1" /> บันทึกฉบับร่าง
                    </CButton>
                    <CButton color="primary" class="ml-2" :disabled="!canSubmit || isSubmitting" @click="submitEvaluation">
                      <CIcon name="cil-paper-plane" class="mr-1" /> ส่งผลการพิจารณา
                    </CButton>
                  </div>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </div>
      </CCol>
    </CRow>
  </div>
</template>

<script>
import Service from '@/service/api'
import ResearchForm from '../ResearchForm.vue'
import Swal from 'sweetalert2'
import { loadResearchFormRuntimeConfigs } from '@/ResearchFormRS/utils/researchConfigRuntime'
import {
  getChairmanChecklistConfig,
  getChairmanChecklistTemplate
} from '@/ResearchFormRS/constants/chairmanChecklist'

const INTERNAL_CHECKLIST_FIELD_KEY = 'checklist_payload'

export default {
  name: 'ChairmanProposalDetail',
  components: {
    ResearchForm
  },
  data () {
    return {
      loading: false,
      isSubmitting: false,
      error: null,
      proposal: null,
      draftSaved: false,
      submittedBannerVisible: false,
      isEvaluationLocked: false,
      evaluationFileName: '',
      decisionOptions: [
        { value: 'approve', label: 'อนุมัติ' },
        { value: 'reject', label: 'ไม่อนุมัติ' }
      ],
      form: {
        checklistValues: {},
        comments: '',
        decision: 'approve'
      }
    }
  },
  computed: {
    proposalId () {
      return this.proposal && this.proposal._id ? this.proposal._id : (this.$route.params.id || '')
    },
    currentUserId () {
      const user = this.$store && this.$store.getters
        ? this.$store.getters['Authentication/currentUser']
        : null
      const id = user && (user._id || user.id)
      return id ? String(id) : ''
    },
    activeRoundNo () {
      const round = Number(this.proposal && this.proposal.currentRound)
      if (Number.isFinite(round) && round > 0) return Math.floor(round)
      const status = String(this.proposal && this.proposal.currentStatus ? this.proposal.currentStatus : '').toLowerCase()
      if (status === 'second_round_review' || status.includes('second_round')) return 2
      return 1
    },
    attachments () {
      const snapshot = this.proposal && this.proposal.formSnapshotJson ? this.proposal.formSnapshotJson : {}
      return Array.isArray(snapshot.files) ? snapshot.files : []
    },
    researchPrefill () {
      if (!this.proposal) return null
      const snapshot = this.proposal.formSnapshotJson || {}
      const team = snapshot.researchTeam || {}
      const leader = team.projectLeader || {}

      return {
        projectNameThai: this.proposal.projectTitleTh || '',
        projectNameEnglish: this.proposal.projectTitleEn || '',
        projectLeaderName: this.proposal.projectLeaderName || leader.name || '',
        projectLeaderAffiliation: this.proposal.projectLeaderAffiliation || leader.affiliation || ''
      }
    },
    selectedFundingTemplate () {
      return getChairmanChecklistTemplate(this.proposal && this.proposal.fundingType)
    },
    selectedFundingLabel () {
      const template = this.selectedFundingTemplate
      if (template && template.fundingTypeLabel) return template.fundingTypeLabel
      return String((this.proposal && this.proposal.fundingType) || '-').trim() || '-'
    },
    templateSections () {
      const template = this.selectedFundingTemplate
      return Array.isArray(template && template.sections) ? template.sections : []
    },
    importPlaceholderMessage () {
      const config = getChairmanChecklistConfig()
      const note = String(config && config.note ? config.note : '').trim()
      return note || 'พื้นที่ checklist ยังเว้นไว้สำหรับ import จาก backend ในขั้นถัดไป'
    },
    canSubmit () {
      return !!this.proposal && !this.isEvaluationLocked && this.isPendingChairmanReview
    },
    isPendingChairmanReview () {
      const status = String(this.proposal && this.proposal.currentStatus ? this.proposal.currentStatus : '').trim().toLowerCase()
      return status === 'faculty_review_pending'
    },
    reviewAvailabilityMessage () {
      if (!this.proposal || this.isPendingChairmanReview || this.submittedBannerVisible) return ''
      const status = String(this.proposal.currentStatus || '').trim().toLowerCase()
      if (status === 'faculty_approved') return 'รายการนี้ถูกประธานอนุมัติแล้ว จึงไม่สามารถแก้ไขผลการพิจารณาได้'
      if (status === 'faculty_rejected' || status === 'rejected') return 'รายการนี้ถูกประธานไม่อนุมัติแล้ว จึงไม่สามารถแก้ไขผลการพิจารณาได้'
      return 'รายการนี้ไม่ได้อยู่ในสถานะรอการพิจารณาของประธานแล้ว'
    },
    decisionLabel () {
      const match = (this.decisionOptions || []).find(option => option && option.value === (this.form && this.form.decision))
      return match ? match.label : ((this.form && this.form.decision) || '-')
    }
  },
  watch: {
    $route: {
      immediate: true,
      handler () {
        this.load()
      }
    }
  },
  methods: {
    showAlert (options) {
      if (this.$swal && typeof this.$swal.fire === 'function') {
        return this.$swal.fire(options)
      }
      return Swal.fire(options)
    },
    resolveChecklistItemId (section, item) {
      const sectionKey = String(section && section.sectionKey ? section.sectionKey : 'section').trim() || 'section'
      const itemKey = String(item && item.itemKey ? item.itemKey : item && item.key ? item.key : 'item').trim() || 'item'
      return `${sectionKey}:${itemKey}`
    },
    isChecklistChecked (section, item) {
      const key = this.resolveChecklistItemId(section, item)
      return Boolean(this.form && this.form.checklistValues && this.form.checklistValues[key])
    },
    toggleChecklistItem (section, item, event) {
      if (this.isEvaluationLocked) return
      const key = this.resolveChecklistItemId(section, item)
      const checked = Boolean(event && event.target && event.target.checked)
      this.$set(this.form.checklistValues, key, checked)
    },
    checklistSnapshot () {
      return this.templateSections.map((section) => ({
        sectionKey: section.sectionKey,
        sectionLabel: section.sectionLabel,
        items: (Array.isArray(section.items) ? section.items : []).map((item) => ({
          itemKey: item.itemKey,
          label: item.label,
          checked: this.isChecklistChecked(section, item)
        }))
      }))
    },
    buildCommentItems () {
      return [
        {
          sectionKey: 'chairman_checklist',
          fieldKey: INTERNAL_CHECKLIST_FIELD_KEY,
          commentType: 'suggestion',
          commentText: JSON.stringify({
            fundingTypeKey: this.selectedFundingTemplate && this.selectedFundingTemplate.fundingTypeKey ? this.selectedFundingTemplate.fundingTypeKey : '',
            fundingTypeLabel: this.selectedFundingLabel,
            sections: this.checklistSnapshot()
          }),
          visibility: 'internal'
        }
      ]
    },
    extractChecklistValues (review) {
      const items = Array.isArray(review && review.commentItems) ? review.commentItems : []
      const payloadItem = items.find((item) => item && item.fieldKey === INTERNAL_CHECKLIST_FIELD_KEY)
      if (!payloadItem || !payloadItem.commentText) return {}
      try {
        const parsed = JSON.parse(payloadItem.commentText)
        const sections = Array.isArray(parsed && parsed.sections) ? parsed.sections : []
        return sections.reduce((result, section) => {
          const sectionKey = String(section && section.sectionKey ? section.sectionKey : '').trim()
          const rows = Array.isArray(section && section.items) ? section.items : []
          rows.forEach((item) => {
            const itemKey = String(item && item.itemKey ? item.itemKey : '').trim()
            if (!sectionKey || !itemKey) return
            result[`${sectionKey}:${itemKey}`] = Boolean(item && item.checked)
          })
          return result
        }, {})
      } catch (_) {
        return {}
      }
    },
    async load () {
      await loadResearchFormRuntimeConfigs()
      this.$forceUpdate()
      const id = decodeURIComponent(this.$route.params.id || '')
      this.proposal = null
      this.error = null
      this.loading = false
      this.draftSaved = false
      this.submittedBannerVisible = false
      this.isEvaluationLocked = false
      this.evaluationFileName = ''
      this.form = {
        checklistValues: {},
        comments: '',
        decision: 'approve'
      }

      if (!id) return
      this.loading = true
      try {
        const response = await Service.proposal.getById(encodeURIComponent(id))
        const proposal = response && response.data && response.data.data ? response.data.data : (response ? response.data : null)
        this.proposal = proposal || null
        if (this.proposal && !this.isPendingChairmanReview) {
          this.isEvaluationLocked = true
        }
      } catch (error) {
        this.error = (error && error.response && error.response.data && error.response.data.message) || error.message || 'Unknown error'
        this.proposal = null
      } finally {
        this.loading = false
      }

      if (this.proposal) this.loadDraft()
      if (this.proposal) await this.loadSavedReview()
      if (this.proposal) this.loadLocalSubmissionLock()
    },
    async loadSavedReview () {
      if (!this.proposal) return
      const proposalId = this.proposal._id || this.proposal.id
      if (!proposalId) return

      try {
        const response = await Service.proposal.getMyReview(encodeURIComponent(proposalId), { roundNo: this.activeRoundNo })
        const review = response && response.data && response.data.data ? response.data.data : null
        if (!review) return

        this.form = {
          ...this.form,
          checklistValues: this.extractChecklistValues(review),
          comments: review.summaryComment || '',
          decision: review.decision === 'reject' ? 'reject' : 'approve'
        }

        if (review.reviewStatus === 'submitted') {
          this.isEvaluationLocked = true
          this.submittedBannerVisible = true
        }
      } catch (error) {
        const status = error && error.response ? error.response.status : null
        if (status === 404) return
        console.warn('Load saved chairman review failed:', error)
      }
    },
    loadLocalSubmissionLock () {
      try {
        const raw = localStorage.getItem(this.submissionKey())
        if (!raw) return
        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object') return
        if (String(parsed.userId || '') !== String(this.currentUserId || '')) return
        this.isEvaluationLocked = true
        this.submittedBannerVisible = true
      } catch (_) {
        return undefined
      }
      return undefined
    },
    draftKey () {
      const proposalId = this.proposal ? (this.proposal._id || this.proposal.id) : ''
      const userId = this.currentUserId || 'unknown'
      return proposalId ? `chairmanDraft:${proposalId}:round:${this.activeRoundNo}:user:${userId}` : ''
    },
    submissionKey () {
      const proposalId = this.proposal ? (this.proposal._id || this.proposal.id) : ''
      const userId = this.currentUserId || 'unknown'
      return proposalId ? `chairmanSubmission:${proposalId}:round:${this.activeRoundNo}:user:${userId}` : ''
    },
    loadDraft () {
      try {
        const raw = localStorage.getItem(this.draftKey())
        if (!raw) return
        const draft = JSON.parse(raw)
        const form = draft && typeof draft === 'object' && draft.form && typeof draft.form === 'object'
          ? draft.form
          : draft
        this.form = {
          ...this.form,
          checklistValues: form && form.checklistValues && typeof form.checklistValues === 'object' ? form.checklistValues : {},
          comments: String(form && form.comments ? form.comments : ''),
          decision: String(form && form.decision ? form.decision : 'approve') || 'approve'
        }
        this.evaluationFileName = String(draft && draft.evaluationFileName ? draft.evaluationFileName : '')
      } catch (_) {
        return undefined
      }
      return undefined
    },
    saveDraft () {
      if (!this.proposal || this.isEvaluationLocked) return
      try {
        localStorage.setItem(this.draftKey(), JSON.stringify({
          form: {
            ...this.form
          },
          evaluationFileName: this.evaluationFileName,
          savedAt: new Date().toISOString(),
          userId: this.currentUserId || ''
        }))
      } catch (_) {
        return undefined
      }
      this.draftSaved = true
      return undefined
    },
    async submitEvaluation () {
      if (!this.proposal || this.isSubmitting) return
      if (this.isEvaluationLocked) {
        await this.showAlert({
          icon: 'info',
          title: 'ส่งผลการพิจารณาแล้ว',
          text: 'รายการนี้ส่งได้เพียงครั้งเดียว และไม่สามารถส่งซ้ำได้'
        })
        return
      }
      if (!this.isPendingChairmanReview) {
        await this.showAlert({
          icon: 'warning',
          title: 'ไม่สามารถส่งผลการพิจารณาได้',
          text: this.reviewAvailabilityMessage || 'รายการนี้ไม่ได้อยู่ในสถานะรอการพิจารณาของประธานแล้ว'
        })
        return
      }

      const proposalId = this.proposal._id || this.proposal.id
      const decisionMap = {
        approve: 'approve',
        reject: 'reject'
      }

      const payload = {
        roundNo: this.activeRoundNo,
        scoreItems: [],
        commentItems: this.buildCommentItems(),
        decision: decisionMap[this.form.decision] || null,
        summaryComment: this.form.comments || '',
        totalScore: null,
        isSubmit: true
      }

      this.isSubmitting = true
      try {
        await Service.proposal.saveReview(encodeURIComponent(proposalId), payload)

        localStorage.setItem(this.submissionKey(), JSON.stringify({
          ...payload,
          userId: this.currentUserId || '',
          submittedAt: new Date().toISOString(),
          form: { ...this.form }
        }))
        localStorage.removeItem(this.draftKey())

        this.isEvaluationLocked = true
        this.submittedBannerVisible = true
        await this.loadSavedReview()

        await this.showAlert({
          icon: 'success',
          title: 'ส่งผลการพิจารณาสำเร็จ',
          text: 'ระบบได้บันทึกผลการพิจารณาเรียบร้อยแล้ว',
          timer: 1800,
          showConfirmButton: false
        })
      } catch (error) {
        const status = error && error.response ? error.response.status : null
        if (status === 409) {
          this.isEvaluationLocked = true
          this.submittedBannerVisible = true
          await this.showAlert({
            icon: 'info',
            title: 'ส่งผลการพิจารณาแล้ว',
            text: 'ระบบไม่อนุญาตให้ส่งซ้ำ เนื่องจากมีการส่งผลการพิจารณาไปแล้ว'
          })
          return
        }
        await this.showAlert({
          icon: 'error',
          title: 'ส่งผลการพิจารณาไม่สำเร็จ',
          text: (error && error.response && error.response.data && error.response.data.message) || 'กรุณาลองใหม่อีกครั้ง'
        })
      } finally {
        this.isSubmitting = false
      }
    },
    onEvaluationFileChange (event) {
      if (this.isEvaluationLocked) return
      const file = event && event.target && event.target.files && event.target.files[0] ? event.target.files[0] : null
      this.evaluationFileName = file ? file.name : ''
    },
    async downloadAttachment (fileItem) {
      const fileId = fileItem && (fileItem.fileId || fileItem.id || fileItem._id)
      if (!fileId || !this.proposalId) return
      try {
        const response = await Service.proposal.downloadFormFile(encodeURIComponent(this.proposalId), encodeURIComponent(fileId))
        const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileItem.name || 'attachment'
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } catch (error) {
        await this.showAlert({
          icon: 'error',
          title: 'ดาวน์โหลดไม่สำเร็จ',
          text: (error && error.response && error.response.data && error.response.data.message) || 'ไม่สามารถดาวน์โหลดไฟล์ได้'
        })
      }
    },
    goBack () {
      this.$router.push({ path: '/chairman/assigned' })
    }
  }
}
</script>

<style scoped>
.evaluation-card {
  border-radius: 10px;
  overflow: visible;
}

.evaluation-sticky {
  position: static;
}

@media (min-width: 992px) {
  .evaluation-sticky {
    position: sticky;
    top: 4.5rem;
  }

  .evaluation-card {
    max-height: calc(100vh - 4.5rem - 3.5rem);
    display: flex;
    flex-direction: column;
  }

  .evaluation-card__body {
    overflow: auto;
    position: relative;
    padding-bottom: 4.5rem;
  }
}

.evaluation-card__header {
  font-weight: 700;
}

.evaluation-card__body {
  background: #ffffff;
}

.evaluation-card__body.evaluation-locked {
  opacity: 0.92;
}

.evaluation-alert {
  border: none;
}

.evaluation-alert--submitted {
  background: rgba(5, 150, 105, 0.08);
}

.evaluation-alert--draft {
  background: rgba(59, 130, 246, 0.08);
}

.rubric-card__header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rubric-card__title {
  font-weight: 700;
}

.rubric-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.rubric-toolbar__label {
  font-weight: 600;
}

.rubric-fund-readonly {
  min-width: 180px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d8e2ef;
  border-radius: 0.5rem;
  background: #f8fafc;
  font-weight: 600;
}

.rubric-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rubric-item {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 0.875rem 1rem;
  background: #fff;
}

.rubric-item__main--checklist {
  margin-bottom: 0.5rem;
}

.rubric-topic-title {
  font-weight: 700;
}

.checklist-empty-state {
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: #f8fafc;
  color: #64748b;
  font-size: 0.9rem;
}

.checklist-items {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.checklist-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin: 0;
  cursor: pointer;
}

.checklist-row__text {
  display: flex;
  flex-direction: column;
}

.checklist-row__label {
  font-weight: 600;
}

.checklist-row__desc {
  color: #64748b;
  font-size: 0.875rem;
}

.decision-readonly {
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  background: #f8fafc;
  border: 1px solid #d8e2ef;
  font-weight: 600;
}

.evaluation-actions {
  margin-top: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
