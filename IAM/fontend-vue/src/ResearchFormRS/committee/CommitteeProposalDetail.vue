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
              <CRow v-for="(f, idx) in attachments" :key="idx" class="align-items-center mb-2">
                <CCol sm="8">
                  <CIcon name="cil-paperclip" class="mr-2" />
                  <span class="font-weight-bold">{{ f.name }}</span>
                </CCol>
                <CCol sm="4" class="text-sm-right mt-2 mt-sm-0">
                  <CButton size="sm" color="primary" variant="outline" @click="downloadAttachment(f)">
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
              แบบประเมินข้อเสนอโครงการ
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
                ส่งผลการประเมินเรียบร้อยแล้ว (ส่งซ้ำไม่ได้)
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

              <CCard class="rubric-card mb-3">
                <CCardHeader class="rubric-card__header">
                  <div class="rubric-card__header-row">
                    <div class="rubric-card__title">เกณฑ์การพิจารณาข้อเสนอโครงการวิจัย และระดับคะแนน</div>
                    <CLink class="card-header-action btn-minimize" @click="showRubric = !showRubric">
                      <CIcon :name="`cil-chevron-${showRubric ? 'top' : 'bottom'}`" />
                    </CLink>
                  </div>
                </CCardHeader>
                <CCollapse :show="showRubric" :duration="250">
                  <CCardBody class="rubric-card__body">
                    <div class="rubric-toolbar rubric-toolbar--readonly">
                      <div class="rubric-toolbar__left">
                        <div class="rubric-toolbar__label">ประเภททุนสำหรับคำนวณค่าน้ำหนัก</div>
                        <div v-if="!fundTypeFallback" class="rubric-toolbar__help text-muted small">
                          ยึดตามประเภททุนที่ผู้ยื่นเลือกในแบบฟอร์ม
                        </div>
                        <div v-else class="rubric-toolbar__help small text-danger">
                          ไม่พบประเภททุนจากแบบฟอร์ม จึงใช้ค่าเริ่มต้นเพื่อคำนวณน้ำหนัก
                        </div>
                      </div>
                      <div class="rubric-toolbar__right">
                        <div class="rubric-fund-readonly" role="textbox" aria-readonly="true">
                          {{ selectedFundTypeLabel }}
                        </div>
                      </div>
                    </div>

                    <div class="rubric-list">
                      <div v-for="row in rubricRows" :key="row.no" class="rubric-item">
                        <div class="rubric-item__main">
                          <div class="rubric-topic-title">{{ row.no }}. {{ row.title }}</div>
                          <div class="rubric-score">
                            <div class="rubric-controls">
                              <div class="rubric-controls__radios">
                                <div class="rubric-radio-group" :class="{ 'is-disabled': !isScorable(row) }">
                                  <label v-for="opt in rubricScoreOptions" :key="opt" class="rubric-radio">
                                    <input
                                      type="radio"
                                      :name="`rubric-${row.no}`"
                                      :value="opt"
                                      v-model.number="form.rubricScores[row.no]"
                                      :disabled="!isScorable(row) || isEvaluationLocked">
                                    <span class="rubric-radio__label">{{ opt }}</span>
                                  </label>
                                </div>
                              </div>
                              <div class="rubric-controls__pill">
                                <span class="rubric-scorepill" aria-label="คะแนนต่อค่าน้ำหนัก">
                                  <span class="rubric-scorepill__score">{{ formatScore(weightedScore(row)) }}</span>
                                  <span class="rubric-scorepill__sep">/</span>
                                  <span class="rubric-scorepill__weight">{{ formatWeight(weightFor(row)) }}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div v-if="shouldShowRowComment(row)" class="rubric-item__comment">
                          <label class="rubric-comment-label">ข้อเสนอแนะสำหรับหัวข้อนี้</label>
                          <textarea
                            v-model.trim="form.rowComments[row.no]"
                            class="form-control form-control-sm"
                            rows="3"
                            :disabled="isEvaluationLocked"
                            placeholder="ระบุสิ่งที่ต้องการให้นักวิจัยแก้ไขในหัวข้อนี้"
                          />
                        </div>
                      </div>
                    </div>
                  </CCardBody>
                </CCollapse>
              </CCard>

              <CForm @submit.prevent>
                <CRow class="mb-3">
                  <CCol sm="6">
                    <div class="text-muted">คะแนนรวม</div>
                    <div class="font-weight-bold">{{ totalScore }}</div>
                  </CCol>
                  <CCol sm="6">
                    <div class="text-muted">คะแนนเต็ม</div>
                    <div class="font-weight-bold">{{ maxScore }}</div>
                  </CCol>
                </CRow>

                <CTextarea
                  label="ข้อคิดเห็นและข้อเสนอแนะ"
                  rows="5"
                  placeholder="พิมพ์ความคิดเห็น..."
                  :value.sync="form.comments"
                  :disabled="isEvaluationLocked"
                />

                <CInputFile
                  label="อัปโหลดไฟล์ประกอบการประเมินเพิ่มเติม (PDF, DOCX, XLSX)"
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
                      <CIcon name="cil-paper-plane" class="mr-1" /> ส่งผลการประเมิน
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
import {
  LOW_SCORE_THRESHOLD,
  buildCommitteeSectionComment,
  getCommitteeFeedbackMeta
} from '@/ResearchFormRS/constants/committeeFeedback'
import { getCommitteeRubricConfig } from '@/ResearchFormRS/constants/committeeRubric'
import { loadResearchFormRuntimeConfigs } from '@/ResearchFormRS/utils/researchConfigRuntime'

export default {
  name: 'CommitteeProposalDetail',
  components: {
    ResearchForm
  },
  data() {
    return {
      loading: false,
      isSubmitting: false,
      error: null,
      proposal: null,
      draftSaved: false,
      submittedBannerVisible: false,
      isEvaluationLocked: false,
      evaluationFileName: '',
      showRubric: true,
      selectedFundType: 'new',
      fundTypeLocked: false,
      fundTypeFallback: false,
      decisionOptions: [
        { value: 'approve', label: 'อนุมัติ' },
        { value: 'reject', label: 'ไม่อนุมัติ' },
        { value: 'revision', label: 'ขอแก้ไขเพิ่มเติม' }
      ],
      form: {
        rubricScores: {},
        rowComments: {},
        comments: '',
        decision: 'approve'
      }
    }
  },
  computed: {
    committeeRubricConfig() {
      return getCommitteeRubricConfig()
    },
    fundTypeOptions() {
      return this.committeeRubricConfig && Array.isArray(this.committeeRubricConfig.fundTypeOptions)
        ? this.committeeRubricConfig.fundTypeOptions
        : []
    },
    rubricScoreOptions() {
      return this.committeeRubricConfig && Array.isArray(this.committeeRubricConfig.scoreOptions)
        ? this.committeeRubricConfig.scoreOptions
        : [0, 1, 2]
    },
    rubricRows() {
      return this.committeeRubricConfig && Array.isArray(this.committeeRubricConfig.rubricRows)
        ? this.committeeRubricConfig.rubricRows
        : []
    },
    proposalId() {
      return this.proposal && this.proposal._id ? this.proposal._id : (this.$route.params.id || '')
    },
    currentUserId () {
      const user = this.$store && this.$store.getters
        ? this.$store.getters['Authentication/currentUser']
        : null
      const id = user && (user._id || user.id)
      return id ? String(id) : ''
    },
    activeRoundNo() {
      const round = Number(this.proposal && this.proposal.currentRound)
      if (Number.isFinite(round) && round > 0) return Math.floor(round)
      const status = String(this.proposal && this.proposal.currentStatus ? this.proposal.currentStatus : '').toLowerCase()
      if (status === 'second_round_review' || status.includes('second_round')) return 2
      return 1
    },
    attachments() {
      const snapshot = this.proposal && this.proposal.formSnapshotJson ? this.proposal.formSnapshotJson : {}
      return Array.isArray(snapshot.files) ? snapshot.files : []
    },
    researchPrefill() {
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
    totalScore() {
      return this.rubricRows.reduce((sum, row) => sum + this.weightedScore(row), 0)
    },
    maxScore() {
      return this.rubricRows.reduce((sum, row) => sum + (Number(this.weightFor(row)) || 0), 0)
    },
    canSubmit() {
      return !!this.proposal && !this.isEvaluationLocked
    },
    selectedFundTypeLabel() {
      const match = (this.fundTypeOptions || []).find(o => o && o.value === this.selectedFundType)
      return match ? match.label : this.selectedFundType
    },
    decisionLabel() {
      const match = (this.decisionOptions || []).find(o => o && o.value === (this.form && this.form.decision))
      return match ? match.label : ((this.form && this.form.decision) || '-')
    }
  },
  watch: {
    $route: {
      immediate: true,
      handler() {
        this.load()
      }
    },
    selectedFundType() {
      if (!this.form || !this.form.rubricScores) return
      this.rubricRows.forEach(row => {
        if (!this.isScorable(row)) this.$set(this.form.rubricScores, row.no, 0)
      })
    }
  },
  methods: {
    showAlert(options) {
      if (this.$swal && typeof this.$swal.fire === 'function') {
        return this.$swal.fire(options)
      }
      return Swal.fire(options)
    },
    deriveFundTypeKeyFromProposal(proposal) {
      const ft = proposal && proposal.fundingType ? String(proposal.fundingType) : ''
      if (!ft) return null

      if (ft === 'new-researcher') return 'new'
      if (ft === 'researcher-development' || ft === 'strategic-research') return 'develop'
      if (ft === 'industry-extension') return 'extension'

      if (ft.includes('new')) return 'new'
      if (ft.includes('develop') || ft.includes('strategic')) return 'develop'
      if (ft.includes('extension') || ft.includes('industry')) return 'extension'

      return null
    },
    applyFundTypeFromProposal() {
      const derived = this.deriveFundTypeKeyFromProposal(this.proposal)
      const fallbackFundType = this.fundTypeOptions && this.fundTypeOptions[0] ? this.fundTypeOptions[0].value : 'new'
      this.fundTypeLocked = true
      this.fundTypeFallback = !derived
      this.selectedFundType = derived || this.selectedFundType || fallbackFundType
    },
    buildEmptyRubricScores() {
      return (this.rubricRows || []).reduce((result, row) => {
        result[row.no] = 0
        return result
      }, {})
    },
    buildEmptyRowComments() {
      return (this.rubricRows || []).reduce((result, row) => {
        result[row.no] = ''
        return result
      }, {})
    },
    buildInitialForm() {
      return {
        rubricScores: this.buildEmptyRubricScores(),
        rowComments: this.buildEmptyRowComments(),
        comments: '',
        decision: 'approve'
      }
    },
    async load() {
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

      if (!id) return
      this.loading = true
      try {
        const response = await Service.proposal.getById(encodeURIComponent(id))
        const p = response && response.data && response.data.data ? response.data.data : (response ? response.data : null)
        this.proposal = p || null
      } catch (e) {
        this.error = (e && e.response && e.response.data && e.response.data.message) || e.message || 'Unknown error'
        this.proposal = null
      } finally {
        this.loading = false
      }

      this.applyFundTypeFromProposal()

      this.form = this.buildInitialForm()

      if (this.proposal) this.loadDraft()
      if (this.proposal) await this.loadSavedReview()
      if (this.proposal) this.loadLocalSubmissionLock()
    },
    async loadSavedReview() {
      if (!this.proposal) return
      const pid = this.proposal._id || this.proposal.id
      if (!pid) return

      try {
        const res = await Service.proposal.getMyReview(encodeURIComponent(pid), { roundNo: this.activeRoundNo })
        const review = res && res.data && res.data.data ? res.data.data : null
        if (!review) return

        const nextScores = { ...this.form.rubricScores }
        ;(review.scoreItems || []).forEach(item => {
          const key = Number(item && item.criteriaKey)
          if (!Number.isNaN(key) && Object.prototype.hasOwnProperty.call(nextScores, key)) {
            nextScores[key] = Number(item.score) || 0
          }
        })

        this.form = {
          ...this.form,
          rubricScores: nextScores,
          rowComments: this.extractRowComments(review.commentItems),
          comments: review.summaryComment || '',
          decision: review.decision === 'revise' ? 'revision' : (review.decision || this.form.decision)
        }

        if (review.reviewStatus === 'submitted') {
          this.isEvaluationLocked = true
          this.submittedBannerVisible = true
        }
      } catch (e) {
        const status = e && e.response ? e.response.status : null
        if (status === 404) return
        console.warn('Load saved review failed:', e)
      }
    },
    loadLocalSubmissionLock() {
      try {
        const raw = localStorage.getItem(this.submissionKey())
        if (raw) {
          const parsed = JSON.parse(raw)
          // Only lock when the submission belongs to the currently logged in reviewer.
          if (!parsed || typeof parsed !== 'object') return
          if (String(parsed.userId || '') !== String(this.currentUserId || '')) return
          this.isEvaluationLocked = true
          this.submittedBannerVisible = true
        }
      } catch (e) { void e }
    },
    draftKey() {
      const pid = this.proposal ? (this.proposal._id || this.proposal.id) : ''
      const uid = this.currentUserId || 'unknown'
      return pid ? `committeeDraft:${pid}:round:${this.activeRoundNo}:user:${uid}` : ''
    },
    submissionKey() {
      const pid = this.proposal ? (this.proposal._id || this.proposal.id) : ''
      const uid = this.currentUserId || 'unknown'
      return pid ? `committeeSubmission:${pid}:round:${this.activeRoundNo}:user:${uid}` : ''
    },
    loadDraft() {
      try {
        const raw = localStorage.getItem(this.draftKey())
        if (!raw) return
        const draft = JSON.parse(raw)
        const draftForm = (draft && typeof draft === 'object' && draft.form && typeof draft.form === 'object')
          ? draft.form
          : draft
        const allowedKeys = ['rubricScores', 'rowComments', 'selectedFundType', 'comments', 'decision']
        const sanitized = {}
        allowedKeys.forEach(k => {
          if (Object.prototype.hasOwnProperty.call(draftForm || {}, k)) sanitized[k] = draftForm[k]
        })
        this.form = { ...this.form, ...sanitized }
        if (!this.fundTypeLocked && sanitized.selectedFundType) this.selectedFundType = sanitized.selectedFundType
      } catch (e) { void e }
    },
    saveDraft() {
      if (!this.proposal) return
      if (this.isEvaluationLocked) return
      try {
        localStorage.setItem(this.draftKey(), JSON.stringify({
          form: {
            ...this.form,
            selectedFundType: this.selectedFundType
          },
          savedAt: new Date().toISOString(),
          userId: this.currentUserId || ''
        }))
      } catch (e) { void e }
      this.draftSaved = true
    },
    async submitEvaluation() {
      if (!this.proposal || this.isSubmitting) return
      if (this.isEvaluationLocked) {
        await this.showAlert({
          icon: 'info',
          title: 'ส่งผลการประเมินแล้ว',
          text: 'รายการนี้ส่งได้เพียงครั้งเดียว และไม่สามารถส่งซ้ำได้'
        })
        return
      }
      const pid = this.proposal._id || this.proposal.id
      const scoreItems = this.rubricRows
        .filter(row => this.isScorable(row))
        .map(row => ({
          criteriaKey: String(row.no),
          criteriaLabel: row.title,
          score: Number(this.form.rubricScores[row.no] || 0),
          maxScore: 2,
          note: ''
        }))

      const decisionMap = {
        approve: 'approve',
        reject: 'reject',
        revision: 'revise'
      }

      const payload = {
        roundNo: this.activeRoundNo,
        scoreItems,
        commentItems: this.buildCommentItems(),
        decision: decisionMap[this.form.decision] || null,
        summaryComment: this.form.comments || '',
        totalScore: this.totalScore,
        isSubmit: true
      }

      this.isSubmitting = true
      try {
        await Service.proposal.saveReview(encodeURIComponent(pid), payload)

        localStorage.setItem(this.submissionKey(), JSON.stringify({
          ...payload,
          userId: this.currentUserId || '',
          submittedAt: new Date().toISOString(),
          maxScore: this.maxScore,
          selectedFundType: this.selectedFundType,
          form: { ...this.form }
        }))
        localStorage.removeItem(this.draftKey())

        this.isEvaluationLocked = true
        this.submittedBannerVisible = true
        await this.loadSavedReview()

        await this.showAlert({
          icon: 'success',
          title: 'ส่งผลการประเมินสำเร็จ',
          text: 'ระบบได้บันทึกผลการประเมินเรียบร้อยแล้ว',
          timer: 1800,
          showConfirmButton: false
        })
      } catch (e) {
        const status = e && e.response ? e.response.status : null
        if (status === 409) {
          this.isEvaluationLocked = true
          this.submittedBannerVisible = true
          await this.showAlert({
            icon: 'info',
            title: 'ส่งผลการประเมินแล้ว',
            text: 'ระบบไม่อนุญาตให้ส่งซ้ำ เนื่องจากมีการส่งผลการประเมินไปแล้ว'
          })
          return
        }
        await this.showAlert({
          icon: 'error',
          title: 'ส่งผลการประเมินไม่สำเร็จ',
          text: (e && e.response && e.response.data && e.response.data.message) || 'กรุณาลองใหม่อีกครั้ง'
        })
      } finally {
        this.isSubmitting = false
      }
    },
    onEvaluationFileChange(event) {
      if (this.isEvaluationLocked) return
      const file = (event && event.target && event.target.files && event.target.files[0]) ? event.target.files[0] : null
      this.evaluationFileName = file ? file.name : ''
    },
    formatWeight(value) {
      return (value === null || value === undefined || value === '') ? '-' : String(value)
    },
    formatScore(value) {
      const n = Number(value)
      if (Number.isNaN(n)) return '-'
      if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n))
      return n.toFixed(1)
    },
    weightFor(row) {
      if (!row || !row.weights) return null
      const w = row.weights[this.selectedFundType]
      return (w === null || w === undefined || w === '') ? null : Number(w)
    },
    weightedScore(row) {
      const w = this.weightFor(row)
      if (!w) return 0
      const raw = this.form && this.form.rubricScores ? this.form.rubricScores[row.no] : 0
      const score = Number(raw) || 0
      return (w * Math.max(0, Math.min(2, score))) / 2
    },
    shouldShowRowComment(row) {
      if (!this.isScorable(row)) return false
      return Number(this.form.rubricScores[row.no] || 0) <= LOW_SCORE_THRESHOLD
    },
    buildCommentItems() {
      const items = this.rubricRows
        .filter(row => this.shouldShowRowComment(row))
        .map(row => {
          const meta = this.feedbackMetaForRow(row)
          if (!meta) return null

          return {
            sectionKey: meta.sectionKey,
            fieldKey: `criteria_${row.no}`,
            commentType: 'required_fix',
            commentText: buildCommitteeSectionComment(meta, this.form.rowComments[row.no]),
            visibility: 'researcher_visible'
          }
        })
        .filter(Boolean)

      if (this.form.comments) {
        items.push({
          sectionKey: 'summary',
          fieldKey: '',
          commentType: 'suggestion',
          commentText: this.form.comments,
          visibility: 'researcher_visible'
        })
      }

      return items
    },
    extractRowComments(commentItems) {
      const base = this.buildEmptyRowComments()
      ;(Array.isArray(commentItems) ? commentItems : []).forEach(item => {
        const key = String(item && item.fieldKey ? item.fieldKey : '')
        const matched = key.match(/^criteria_(\d+)$/)
        if (!matched) return
        if (Object.prototype.hasOwnProperty.call(base, matched[1])) {
          base[matched[1]] = item && item.commentText ? item.commentText : ''
        }
      })
      return base
    },
    feedbackMetaForRow(row) {
      return getCommitteeFeedbackMeta(row && row.no)
    },
    isScorable(row) {
      return Boolean(this.weightFor(row))
    },
    downloadAttachment(file) {
      const blob = new Blob([file.content || ''], { type: file.mime || 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name || 'attachment'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    },
    goBack() {
      this.$router.push({ path: '/committee/assigned' })
    }
  }
}
</script>

<style scoped>
.evaluation-card {
  --theme-red: #8b1a1a;
  --theme-red-dark: #6f1111;
  --theme-gold: #d4af37;
  --theme-gold-soft: rgba(212, 175, 55, 0.32);

  border: 1px solid var(--theme-gold-soft);
  border-radius: 10px;
  overflow: visible;
  box-shadow: 0 10px 28px rgba(111, 17, 17, 0.08);
}

.evaluation-card__header {
  background: linear-gradient(90deg, var(--theme-red-dark), var(--theme-red));
  border-bottom: 2px solid var(--theme-gold);
  font-weight: 800;
  color: #ffffff;
}

.evaluation-card__body {
  background: #ffffff;
}

.evaluation-alert {
  border: 1px solid var(--theme-gold-soft);
  border-radius: 10px;
  background: #ffffff;
}

.evaluation-alert--submitted {
  border-left: 6px solid var(--theme-gold);
  color: var(--theme-red-dark);
  font-weight: 700;
}

.evaluation-alert--draft {
  border-left: 6px solid rgba(212, 175, 55, 0.8);
  color: var(--theme-red-dark);
  font-weight: 700;
}

.evaluation-locked {
  scroll-behavior: auto;
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

.rubric-card__header {
  background: #ffffff;
  border-bottom: 1px solid var(--theme-gold-soft);
}

.rubric-card__header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.rubric-card__title {
  font-weight: 800;
  color: var(--theme-red-dark);
}

.rubric-card__body {
  padding: 0;
}

.rubric-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 0.75rem 1rem;
  background: #ffffff;
  border-bottom: 1px solid var(--theme-gold-soft);
  box-shadow: 0 1px 0 rgba(111, 17, 17, 0.04);
}

.rubric-toolbar__left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.rubric-toolbar__label {
  font-weight: 700;
  color: var(--theme-red-dark);
}

.rubric-toolbar__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.rubric-fund-readonly {
  min-width: 210px;
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--theme-gold-soft);
  border-radius: 0.2rem;
  background: #fffaf0;
  color: var(--theme-red-dark);
  font-weight: 700;
  text-align: center;
}

.rubric-list {
  padding: 0.75rem 1rem;
}

.rubric-item {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(212, 175, 55, 0.22);
}

.rubric-item:last-child {
  border-bottom: 0;
}

.rubric-item__main {
  flex: 1;
  min-width: 0;
}

.rubric-item__comment {
  width: 100%;
  margin-top: 10px;
}

.rubric-comment-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--theme-red-dark);
  margin-bottom: 6px;
}

.rubric-topic-title {
  font-weight: 800;
  color: var(--theme-red-dark);
  margin-bottom: 6px;
}

.rubric-score {
  margin-top: 8px;
}

.evaluation-actions {
  margin-top: 14px;
}

.rubric-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.rubric-radio-group {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.rubric-radio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  cursor: pointer;
  user-select: none;
}

.rubric-radio input[type="radio"] {
  width: 16px;
  height: 16px;
  accent-color: var(--theme-gold);
}

.rubric-radio__label {
  font-weight: 400;
  color: #1f2937;
}

.rubric-radio-group.is-disabled {
  opacity: 0.55;
}

.rubric-radio-group.is-disabled .rubric-radio {
  cursor: not-allowed;
}

.rubric-scorepill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 3px 8px;
  border: 1px solid rgba(212, 175, 55, 0.28);
  border-radius: 8px;
  background: rgba(212, 175, 55, 0.08);
  font-variant-numeric: tabular-nums;
  min-width: 64px;
  font-weight: 400;
  color: var(--theme-red-dark);
  font-size: 0.9rem;
}

.rubric-scorepill__sep {
  color: rgba(111, 17, 17, 0.55);
  font-weight: 400;
}

.decision-readonly {
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(212, 175, 55, 0.35);
  border-radius: 10px;
  background: #ffffff;
  font-weight: 800;
  color: var(--theme-red-dark);
}

.evaluation-actions ::v-deep .btn-primary {
  background-color: var(--theme-red);
  border-color: var(--theme-red);
}

.evaluation-actions ::v-deep .btn-primary:hover:not(:disabled),
.evaluation-actions ::v-deep .btn-primary:focus:not(:disabled) {
  background-color: var(--theme-red-dark);
  border-color: var(--theme-red-dark);
}

.evaluation-actions ::v-deep .btn-primary:disabled {
  background-color: rgba(139, 26, 26, 0.45);
  border-color: rgba(139, 26, 26, 0.35);
}

.evaluation-actions ::v-deep .btn-outline-secondary {
  color: var(--theme-red-dark);
  border-color: rgba(212, 175, 55, 0.75);
}

.evaluation-actions ::v-deep .btn-outline-secondary:hover:not(:disabled),
.evaluation-actions ::v-deep .btn-outline-secondary:focus:not(:disabled) {
  background-color: rgba(212, 175, 55, 0.14);
  color: var(--theme-red-dark);
  border-color: rgba(212, 175, 55, 0.95);
}
</style>
