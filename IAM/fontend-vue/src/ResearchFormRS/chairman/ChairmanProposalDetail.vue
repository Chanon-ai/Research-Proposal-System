<template>
  <div>
    <div v-if="loading" class="text-center py-4">
      <CSpinner color="primary" />
      <div class="text-muted mt-2">{{ $t('chairman.proposalDetail.loading') }}</div>
    </div>
    <CAlert v-else-if="error" color="danger" show>
      {{ $t('chairman.proposalDetail.loadError', { error }) }}
    </CAlert>
    <CRow>
      <CCol col="12" lg="7">
        <div v-if="proposal">
          <ResearchForm :prefill="researchPrefill" :proposal-id="proposalId" :read-only="true" />

          <CCard class="mt-3 mb-0">
            <CCardHeader>
              {{ $t('chairman.proposalDetail.attachments') }}
            </CCardHeader>
            <CCardBody>
              <CRow v-for="(fileItem, idx) in attachments" :key="idx" class="align-items-center mb-2">
                <CCol sm="8">
                  <CIcon name="cil-paperclip" class="mr-2" />
                  <span class="font-weight-bold">{{ fileItem.name }}</span>
                </CCol>
                <CCol sm="4" class="text-sm-right mt-2 mt-sm-0">
                  <CButton size="sm" color="primary" variant="outline" @click="downloadAttachment(fileItem)">
                    <CIcon name="cil-cloud-download" class="mr-1" /> {{ $t('chairman.proposalDetail.download') }}
                  </CButton>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </div>

        <CCard v-else>
          <CCardBody>
            <CAlert color="warning" show>{{ $t('chairman.proposalDetail.notFound') }}</CAlert>
            <CButton color="secondary" @click="goBack"><CIcon name="cil-chevron-right" class="mr-1" /> {{ $t('chairman.proposalDetail.back') }}</CButton>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol col="12" lg="5">
        <div class="evaluation-sticky">
          <CCard class="evaluation-card">
            <CCardHeader class="evaluation-card__header">
              {{ $t('chairman.proposalDetail.title') }}
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
                {{ $t('chairman.proposalDetail.submitted') }}
              </CAlert>
              <CAlert
                color="light"
                v-if="draftSaved"
                show
                close-button
                class="evaluation-alert evaluation-alert--draft"
                @update:show="draftSaved = false"
              >
                {{ $t('chairman.proposalDetail.draftSaved') }}
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
                    <div class="rubric-card__title">{{ $t('chairman.proposalDetail.rubricTitle') }}</div>
                  </div>
                </CCardHeader>
                <CCardBody class="rubric-card__body">
                  <div class="rubric-toolbar rubric-toolbar--readonly">
                    <div class="rubric-toolbar__left">
                      <div class="rubric-toolbar__label">{{ $t('chairman.proposalDetail.fundingLabel') }}</div>
                      <div class="rubric-toolbar__help text-muted small">
                        {{ $t('chairman.proposalDetail.fundingHelp') }}
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
                        {{ $t('chairman.proposalDetail.emptyChecklist') }}
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

              <CCard class="chairman-signature-card mb-3">
                <CCardHeader class="chairman-signature-card__header">
                  <div>
                    <div class="chairman-signature-card__title">{{ $t('chairman.proposalDetail.signature.title') }}</div>
                    <div class="chairman-signature-card__subtitle text-muted small">{{ $t('chairman.proposalDetail.signature.help') }}</div>
                  </div>
                  <CBadge color="warning">{{ $t('chairman.proposalDetail.signature.required') }}</CBadge>
                </CCardHeader>
                <CCardBody class="chairman-signature-card__body">
                  <div v-if="!isEvaluationLocked" class="chairman-signature-card__toolbar">
                    <div class="chairman-signature-card__toolbar-actions">
                      <input
                        ref="signatureUpload"
                        type="file"
                        accept="image/*"
                        class="d-none"
                        @change="onSignatureUpload"
                      >
                      <CButton size="sm" color="primary" variant="outline" @click="openSignatureUpload">
                        <CIcon name="cil-cloud-upload" class="mr-1" /> {{ $t('chairman.proposalDetail.signature.upload') }}
                      </CButton>
                      <CButton size="sm" color="success" variant="outline" :disabled="!hasSignatureData" @click="saveSignature">
                        <CIcon name="cil-save" class="mr-1" /> {{ $t('chairman.proposalDetail.signature.save') }}
                      </CButton>
                    </div>
                    <CButton size="sm" color="secondary" variant="outline" :disabled="!signatureData" @click="clearSignature">
                      <CIcon name="cil-trash" class="mr-1" /> {{ $t('chairman.proposalDetail.signature.clear') }}
                    </CButton>
                  </div>

                  <div class="chairman-signature-card__surface">
                    <div v-if="!isEvaluationLocked" class="chairman-signature-card__draw-panel">
                      <div class="chairman-signature-card__canvas-wrap">
                        <canvas
                          ref="signatureCanvas"
                          class="chairman-signature-card__canvas"
                          @mousedown="startSignatureDrawing"
                          @mousemove="drawSignature"
                          @mouseup="stopSignatureDrawing"
                          @mouseleave="stopSignatureDrawing"
                          @touchstart.prevent="startSignatureDrawing"
                          @touchmove.prevent="drawSignature"
                          @touchend.prevent="stopSignatureDrawing"
                        ></canvas>
                      </div>
                      <div class="chairman-signature-card__hint text-muted small">{{ $t('chairman.proposalDetail.signature.drawHint') }}</div>
                      <div v-if="signatureSavedAt" class="chairman-signature-card__saved text-success small">
                        {{ $t('chairman.proposalDetail.signature.savedAt', { date: formatDateTime(signatureSavedAt) }) }}
                      </div>
                    </div>

                    <div v-else class="chairman-signature-card__preview" :class="{ 'is-empty': !signatureData }">
                      <img v-if="signatureData" :src="signatureData" :alt="$t('chairman.proposalDetail.signature.previewAlt')" class="chairman-signature-card__image">
                      <div v-else class="chairman-signature-card__empty">{{ $t('chairman.proposalDetail.signature.empty') }}</div>
                    </div>
                  </div>

                  <div class="chairman-signature-card__meta">
                    <div>{{ $t('chairman.proposalDetail.signature.signedBy', { username: currentUserSignatureName }) }}</div>
                    <div>{{ $t('chairman.proposalDetail.signature.committeeAffiliation', { affiliation: chairmanAffiliationText }) }}</div>
                    <div>{{ $t('chairman.proposalDetail.signature.submittedOn', { date: chairmanSubmittedAtDisplay }) }}</div>
                  </div>

                  <CAlert v-if="!hasSignatureData" color="warning" show class="mb-0 mt-3 chairman-signature-card__alert">
                    {{ $t('chairman.proposalDetail.signature.missing') }}
                  </CAlert>
                </CCardBody>
              </CCard>

              <CForm @submit.prevent>
                <CTextarea
                  :label="$t('chairman.proposalDetail.comments')"
                  rows="5"
                  :placeholder="$t('chairman.proposalDetail.commentsPlaceholder')"
                  :value.sync="form.comments"
                  :disabled="isEvaluationLocked"
                />

                <CInputFile
                  :label="$t('chairman.proposalDetail.uploadLabel')"
                  custom
                  accept=".pdf,.doc,.docx,.xlsx"
                  :disabled="isEvaluationLocked"
                  @change="onEvaluationFileChange"
                />
                <div class="text-muted small" v-if="evaluationFileName">
                  {{ $t('chairman.proposalDetail.selectedFile', { name: evaluationFileName }) }}
                </div>

                <div class="mt-3 mb-2 text-muted">{{ $t('chairman.proposalDetail.decision') }}</div>
                <div v-if="isEvaluationLocked" class="decision-readonly">
                  {{ decisionLabel }}
                </div>
                <CInputRadioGroup v-else :options="decisionOptions" :checked.sync="form.decision" custom />

                <div class="evaluation-actions">
                  <div class="form-actions">
                    <CButton color="secondary" variant="outline" :disabled="isEvaluationLocked" @click="saveDraft">
                      <CIcon name="cil-save" class="mr-1" /> {{ $t('chairman.proposalDetail.saveDraft') }}
                    </CButton>
                    <CButton color="primary" class="ml-2" :disabled="!canSubmit || isSubmitting" @click="submitEvaluation">
                      <CIcon name="cil-paper-plane" class="mr-1" /> {{ $t('chairman.proposalDetail.submit') }}
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
import centerLoadingMixin from '@/ResearchFormRS/utils/centerLoadingMixin'
import {
  getChairmanChecklistConfig,
  getChairmanChecklistTemplate
} from '@/ResearchFormRS/constants/chairmanChecklist'

const INTERNAL_CHECKLIST_FIELD_KEY = 'checklist_payload'

export default {
  name: 'ChairmanProposalDetail',
  mixins: [centerLoadingMixin],
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
      signatureData: '',
      signatureTimestamp: '',
      submittedAt: '',
      signatureSavedAt: '',
      isSignatureDrawing: false,
      signatureHasStroke: false,
      form: {
        checklistValues: {},
        comments: '',
        decision: 'approve'
      }
    }
  },
  computed: {
    currentUser () {
      const user = this.$store && this.$store.getters
        ? this.$store.getters['Authentication/currentUser']
        : null
      if (user && typeof user === 'object') return user
      try {
        const raw = localStorage.getItem('auth_user')
        return raw ? JSON.parse(raw) : null
      } catch (_) {
        return null
      }
    },
    proposalId () {
      return this.proposal && this.proposal._id ? this.proposal._id : (this.$route.params.id || '')
    },
    currentUserId () {
      const user = this.currentUser
      const id = user && (user._id || user.id)
      return id ? String(id) : ''
    },
    currentUserDisplayName () {
      const user = this.currentUser
      return (user && (user.fullName || user.email || user.username)) || '-'
    },
    currentUserSignatureName () {
      const user = this.currentUser
      return (user && (user.username || user.fullName || user.email)) || '-'
    },
    chairmanAffiliationText () {
      const user = this.currentUser
      if (!user || typeof user !== 'object') return '-'
      const department = user.department && typeof user.department === 'object'
        ? (user.department.name || user.department.title || user.department.departmentName)
        : user.department
      const faculty = user.faculty && typeof user.faculty === 'object'
        ? (user.faculty.name || user.faculty.title || user.faculty.facultyName)
        : user.faculty
      const affiliation = user.affiliation || department || faculty || user.organization || user.unit || ''
      return String(affiliation || '').trim() || '-'
    },
    chairmanSubmittedAtDisplay () {
      return this.submittedAt ? this.formatDateTime(this.submittedAt) : '-'
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
      return note || this.$t('chairman.proposalDetail.importPlaceholderFallback')
    },
    canSubmit () {
      return !!this.proposal && !this.isEvaluationLocked && this.isPendingChairmanReview && this.hasSignatureData
    },
    centerLoadingActive () {
      return Boolean(this.loading || this.isSubmitting)
    },
    hasSignatureData () {
      return typeof this.signatureData === 'string' && this.signatureData.startsWith('data:image/')
    },
    isPendingChairmanReview () {
      const status = String(this.proposal && this.proposal.currentStatus ? this.proposal.currentStatus : '').trim().toLowerCase()
      return status === 'faculty_review_pending'
    },
    reviewAvailabilityMessage () {
      if (!this.proposal || this.isPendingChairmanReview || this.submittedBannerVisible) return ''
      const status = String(this.proposal.currentStatus || '').trim().toLowerCase()
      if (status === 'faculty_approved') return this.$t('chairman.proposalDetail.status.approved')
      if (status === 'faculty_rejected' || status === 'rejected') return this.$t('chairman.proposalDetail.status.rejected')
      return this.$t('chairman.proposalDetail.status.notPending')
    },
    decisionLabel () {
      const match = (this.decisionOptions || []).find(option => option && option.value === (this.form && this.form.decision))
      return match ? match.label : ((this.form && this.form.decision) || '-')
    },
    decisionOptions () {
      return [
        { value: 'approve', label: this.$t('chairman.proposalDetail.decisionOptions.approve') },
        { value: 'reject', label: this.$t('chairman.proposalDetail.decisionOptions.reject') }
      ]
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
    formatDateTime (value) {
      if (!value) return '-'
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return '-'
      return d.toLocaleString(this.$i18n && this.$i18n.locale === 'en' ? 'en-GB' : 'th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    initializeSignatureCanvas () {
      const canvas = this.$refs.signatureCanvas
      if (!canvas) return
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      const width = Math.max(Math.floor(canvas.clientWidth || 560), 320)
      const height = 180
      canvas.width = width * ratio
      canvas.height = height * ratio
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(ratio, ratio)
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#8b1212'
      this.signatureHasStroke = false
      if (this.signatureData) {
        this.renderSignatureToCanvas()
      }
    },
    renderSignatureToCanvas () {
      const canvas = this.$refs.signatureCanvas
      if (!canvas || !this.signatureData) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const image = new Image()
      image.onload = () => {
        const width = canvas.clientWidth || 560
        const height = 180
        ctx.clearRect(0, 0, width, height)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)

        const scale = Math.min(width / image.width, height / image.height, 1)
        const drawWidth = image.width * scale
        const drawHeight = image.height * scale
        const offsetX = (width - drawWidth) / 2
        const offsetY = (height - drawHeight) / 2
        ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)
        this.signatureHasStroke = true
      }
      image.src = this.signatureData
    },
    signaturePointFromEvent (event) {
      const canvas = this.$refs.signatureCanvas
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const source = event && event.touches && event.touches[0]
        ? event.touches[0]
        : (event && event.changedTouches && event.changedTouches[0] ? event.changedTouches[0] : event)
      if (!source) return null
      return {
        x: source.clientX - rect.left,
        y: source.clientY - rect.top
      }
    },
    startSignatureDrawing (event) {
      if (this.isEvaluationLocked) return
      const canvas = this.$refs.signatureCanvas
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      const point = this.signaturePointFromEvent(event)
      if (!ctx || !point) return
      this.isSignatureDrawing = true
      ctx.beginPath()
      ctx.moveTo(point.x, point.y)
    },
    drawSignature (event) {
      if (!this.isSignatureDrawing || this.isEvaluationLocked) return
      const canvas = this.$refs.signatureCanvas
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      const point = this.signaturePointFromEvent(event)
      if (!ctx || !point) return
      ctx.lineTo(point.x, point.y)
      ctx.stroke()
      this.signatureHasStroke = true
    },
    stopSignatureDrawing () {
      if (!this.isSignatureDrawing) return
      this.isSignatureDrawing = false
      const canvas = this.$refs.signatureCanvas
      if (!canvas || !this.signatureHasStroke) return
      this.signatureData = canvas.toDataURL('image/png')
      this.signatureTimestamp = new Date().toISOString()
    },
    clearSignature () {
      this.signatureData = ''
      this.signatureTimestamp = ''
      this.signatureSavedAt = ''
      this.signatureHasStroke = false
      try {
        localStorage.removeItem(this.signatureKey())
      } catch (_) {
        // ignore local storage cleanup errors
      }
      const upload = this.$refs.signatureUpload
      if (upload) upload.value = ''
      this.$nextTick(() => {
        if (!this.isEvaluationLocked) this.initializeSignatureCanvas()
      })
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
      this.signatureData = ''
      this.signatureTimestamp = ''
      this.submittedAt = ''
      this.signatureSavedAt = ''
      this.isSignatureDrawing = false
      this.signatureHasStroke = false
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

      if (this.proposal) this.loadSavedSignature()
      if (this.proposal) this.loadDraft()
      if (this.proposal) await this.loadSavedReview()
      if (this.proposal) this.loadLocalSubmissionLock()
      this.$nextTick(() => {
        if (!this.isEvaluationLocked) this.initializeSignatureCanvas()
      })
    },
    async loadSavedReview () {
      if (!this.proposal) return
      const proposalId = this.proposal._id || this.proposal.id
      if (!proposalId) return

      try {
        const response = await Service.proposal.getMyReview(encodeURIComponent(proposalId), { roundNo: this.activeRoundNo })
        const review = response && response.data && response.data.data ? response.data.data : null
        const reviewStatus = review && review.reviewStatus ? String(review.reviewStatus).toLowerCase() : ''
        const isLockedReview = reviewStatus === 'submitted' || reviewStatus === 'certified'
        if (!review) {
          this.clearLocalSubmissionLock()
          this.isEvaluationLocked = false
          this.submittedBannerVisible = false
          this.submittedAt = ''
          return
        }

        this.form = {
          ...this.form,
          checklistValues: this.extractChecklistValues(review),
          comments: review.summaryComment || '',
          decision: review.decision === 'reject' ? 'reject' : 'approve'
        }
        this.signatureData = String(review && review.signatureData ? review.signatureData : '')
        this.signatureTimestamp = review && (review.signatureUpdatedAt || review.submittedAt)
          ? String(review.signatureUpdatedAt || review.submittedAt)
          : ''
        this.submittedAt = review && review.submittedAt ? String(review.submittedAt) : ''
        if (this.signatureData) this.saveSignatureToStorage()

        if (isLockedReview) {
          this.isEvaluationLocked = true
          this.submittedBannerVisible = true
        } else {
          this.clearLocalSubmissionLock()
          this.isEvaluationLocked = false
          this.submittedBannerVisible = false
          this.submittedAt = ''
        }
      } catch (error) {
        const status = error && error.response ? error.response.status : null
        if (status === 404) {
          this.clearLocalSubmissionLock()
          this.isEvaluationLocked = false
          this.submittedBannerVisible = false
          this.submittedAt = ''
          return
        }
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
        this.submittedAt = String(parsed.submittedAt || this.submittedAt || '')
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
    signatureKey () {
      const proposalId = this.proposal ? (this.proposal._id || this.proposal.id) : ''
      const userId = this.currentUserId || 'unknown'
      return proposalId ? `chairmanSignature:${proposalId}:user:${userId}` : ''
    },
    clearLocalSubmissionLock () {
      try {
        localStorage.removeItem(this.submissionKey())
      } catch (_) {
        return undefined
      }
      return undefined
    },
    loadSavedSignature () {
      try {
        const raw = localStorage.getItem(this.signatureKey())
        if (!raw) return
        const saved = JSON.parse(raw)
        if (!saved || typeof saved !== 'object') return
        this.signatureData = String(saved.signatureData || '')
        this.signatureTimestamp = String(saved.signatureTimestamp || '')
        this.signatureSavedAt = String(saved.savedAt || '')
      } catch (_) {
        return undefined
      }
      return undefined
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
        if (draft && draft.signatureData) {
          this.signatureData = String(draft.signatureData)
          this.signatureTimestamp = String(draft.signatureTimestamp || '')
        }
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
          signatureData: this.signatureData,
          signatureTimestamp: this.signatureTimestamp,
          evaluationFileName: this.evaluationFileName,
          savedAt: new Date().toISOString(),
          userId: this.currentUserId || ''
        }))
      } catch (_) {
        return undefined
      }
      this.saveSignatureToStorage()
      this.draftSaved = true
      return undefined
    },
    saveSignatureToStorage () {
      if (!this.proposal || !this.hasSignatureData) return false
      const savedAt = new Date().toISOString()
      try {
        localStorage.setItem(this.signatureKey(), JSON.stringify({
          proposalId: this.proposal._id || this.proposal.id || '',
          userId: this.currentUserId || '',
          signatureData: this.signatureData,
          signatureTimestamp: this.signatureTimestamp || savedAt,
          savedAt
        }))
        this.signatureSavedAt = savedAt
        return true
      } catch (_) {
        return false
      }
    },
    async saveSignature () {
      if (!this.hasSignatureData) {
        await this.showAlert({
          icon: 'warning',
          title: this.$t('chairman.proposalDetail.alerts.signatureRequiredTitle'),
          text: this.$t('chairman.proposalDetail.alerts.signatureRequiredText')
        })
        return
      }
      const ok = this.saveSignatureToStorage()
      await this.showAlert({
        icon: ok ? 'success' : 'error',
        title: ok
          ? this.$t('chairman.proposalDetail.signature.saveSuccessTitle')
          : this.$t('chairman.proposalDetail.signature.saveErrorTitle'),
        text: ok
          ? this.$t('chairman.proposalDetail.signature.saveSuccessText')
          : this.$t('chairman.proposalDetail.alerts.retry')
      })
    },
    openSignatureUpload () {
      if (this.isEvaluationLocked) return
      const input = this.$refs.signatureUpload
      if (input && typeof input.click === 'function') input.click()
    },
    onSignatureUpload (event) {
      if (this.isEvaluationLocked) return
      const file = event && event.target && event.target.files && event.target.files[0] ? event.target.files[0] : null
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        this.signatureData = typeof reader.result === 'string' ? reader.result : ''
        this.signatureTimestamp = this.signatureData ? new Date().toISOString() : ''
        this.$nextTick(() => this.renderSignatureToCanvas())
        if (event && event.target) event.target.value = ''
      }
      reader.readAsDataURL(file)
    },
    async submitEvaluation () {
      if (!this.proposal || this.isSubmitting) return
      if (this.isEvaluationLocked) {
        await this.showAlert({
          icon: 'info',
          title: this.$t('chairman.proposalDetail.alerts.alreadySubmittedTitle'),
          text: this.$t('chairman.proposalDetail.alerts.alreadySubmittedText')
        })
        return
      }
      if (!this.isPendingChairmanReview) {
        await this.showAlert({
          icon: 'warning',
          title: this.$t('chairman.proposalDetail.alerts.cannotSubmitTitle'),
          text: this.reviewAvailabilityMessage || this.$t('chairman.proposalDetail.status.notPending')
        })
        return
      }
      if (!this.hasSignatureData) {
        await this.showAlert({
          icon: 'warning',
          title: this.$t('chairman.proposalDetail.alerts.signatureRequiredTitle'),
          text: this.$t('chairman.proposalDetail.alerts.signatureRequiredText')
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
        signatureData: this.signatureData,
        isSubmit: true
      }

      this.isSubmitting = true
      try {
        const submittedAt = new Date().toISOString()
        await Service.proposal.saveReview(encodeURIComponent(proposalId), payload)

        localStorage.setItem(this.submissionKey(), JSON.stringify({
          ...payload,
          userId: this.currentUserId || '',
          submittedAt,
          form: { ...this.form },
          signatureData: this.signatureData,
          signatureTimestamp: this.signatureTimestamp
        }))
        localStorage.removeItem(this.draftKey())
        this.saveSignatureToStorage()
        this.submittedAt = submittedAt

        this.isEvaluationLocked = true
        this.submittedBannerVisible = true
        await this.loadSavedReview()

        await this.showAlert({
          icon: 'success',
          title: this.$t('chairman.proposalDetail.alerts.submitSuccessTitle'),
          text: this.$t('chairman.proposalDetail.alerts.submitSuccessText'),
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
            title: this.$t('chairman.proposalDetail.alerts.alreadySubmittedTitle'),
            text: this.$t('chairman.proposalDetail.alerts.duplicateSubmitText')
          })
          return
        }
        await this.showAlert({
          icon: 'error',
          title: this.$t('chairman.proposalDetail.alerts.submitErrorTitle'),
          text: (error && error.response && error.response.data && error.response.data.message) || this.$t('chairman.proposalDetail.alerts.retry')
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
          title: this.$t('chairman.proposalDetail.downloadErrorTitle'),
          text: (error && error.response && error.response.data && error.response.data.message) || this.$t('chairman.proposalDetail.downloadErrorText')
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

.chairman-signature-card {
  border: 1px solid #e8d6ad;
  border-radius: 0.9rem;
  overflow: hidden;
}

.chairman-signature-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  background: linear-gradient(135deg, rgba(139, 18, 18, 0.04) 0%, rgba(197, 155, 58, 0.14) 100%);
}

.chairman-signature-card__title {
  font-weight: 700;
  color: #7f1d1d;
}

.chairman-signature-card__body {
  background: #fffdf8;
}

.chairman-signature-card__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.chairman-signature-card__toolbar-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.chairman-signature-card__surface {
  display: grid;
}

.chairman-signature-card__canvas-wrap,
.chairman-signature-card__preview {
  border: 1px dashed #d5b46d;
  border-radius: 0.9rem;
  background: #ffffff;
  min-height: 190px;
}

.chairman-signature-card__canvas {
  display: block;
  width: 100%;
  height: 190px;
  touch-action: none;
  border-radius: 0.9rem;
}

.chairman-signature-card__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
}

.chairman-signature-card__preview.is-empty {
  background: #fffaf0;
}

.chairman-signature-card__image {
  max-width: 100%;
  max-height: 170px;
  object-fit: contain;
}

.chairman-signature-card__empty {
  color: #94a3b8;
  font-size: 0.95rem;
  text-align: center;
}

.chairman-signature-card__meta {
  display: grid;
  gap: 0.35rem;
  margin-top: 1rem;
  color: #475569;
  font-size: 0.92rem;
}

.chairman-signature-card__hint {
  margin-top: 0.5rem;
}

.chairman-signature-card__saved {
  margin-top: 0.35rem;
  font-weight: 600;
}

.chairman-signature-card__alert {
  border-color: #f4d38b;
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

@media (max-width: 576px) {
  .chairman-signature-card__header,
  .chairman-signature-card__toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
