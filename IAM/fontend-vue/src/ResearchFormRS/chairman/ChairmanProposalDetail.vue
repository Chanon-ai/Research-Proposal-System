<template>
  <div class="chairman-proposal-detail" :class="{ 'is-dark': isDarkTheme }">
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

              <CCard class="rubric-card evaluation-section">
                <CCardBody class="rubric-card__body">
                  <div class="rubric-toolbar rubric-toolbar--readonly">
                    <div class="rubric-toolbar__left">
                      <div class="rubric-toolbar__label">{{ $t('chairman.proposalDetail.fundingLabel') }}</div>
                    </div>
                      <div class="rubric-toolbar__right">
                        <div class="rubric-fund-readonly" role="textbox" aria-readonly="true">
                          {{ selectedFundingLabel }}
                      </div>
                    </div>
                  </div>

                  <CAlert v-if="importPlaceholderMessage" color="info" show class="small mb-3">
                    {{ importPlaceholderMessage }}
                  </CAlert>

                  <div class="rubric-list">
                    <div v-for="section in templateSections" :key="section.sectionKey" class="rubric-item">
                      <div class="rubric-item__main rubric-item__main--checklist">
                        <div>
                          <div class="rubric-topic-title">{{ resolveChecklistText(section, 'sectionLabel') }}</div>
                          <div v-if="resolveChecklistText(section, 'description')" class="text-muted small mt-1">{{ resolveChecklistText(section, 'description') }}</div>
                        </div>
                      </div>

                      <div v-if="section.items.length === 0" class="checklist-empty-state">
                        {{ $t('chairman.proposalDetail.emptyChecklist') }}
                      </div>

                      <div v-else class="checklist-items">
                         <div class="checklist-table-header text-muted small">
                           <div class="checklist-table-header__no">#</div>
                           <div class="checklist-table-header__label">{{ $t('chairman.proposalDetail.checklistItemLabel') }}</div>
                           <div class="checklist-table-header__choices">
                            <span>{{ $t('chairman.proposalDetail.checklistAnswer') }}</span>
                           </div>
                         </div>

                        <div
                          v-for="(item, itemIndex) in section.items"
                          :key="resolveChecklistItemId(section, item)"
                          class="checklist-row"
                          :class="{ 'is-unanswered': !isChecklistAnswered(section, item) }"
                        >
                          <div class="checklist-row__no">{{ itemIndex + 1 }}</div>
                          <div class="checklist-row__text">
                            <div class="checklist-row__label">{{ resolveChecklistText(item, 'label') }}</div>
                            <div v-if="resolveChecklistText(item, 'description')" class="checklist-row__desc">{{ resolveChecklistText(item, 'description') }}</div>
                          </div>

                          <div class="checklist-row__choices" @click.stop>
                            <label class="checklist-choice">
                              <input
                                type="radio"
                                :name="`check:${resolveChecklistItemId(section, item)}`"
                                value="yes"
                                :checked="getChecklistAnswer(section, item) === 'yes'"
                                :disabled="isEvaluationLocked"
                                @change="setChecklistAnswer(section, item, 'yes')"
                              >
                              <span class="checklist-choice__control" aria-hidden="true"></span>
                              <span class="checklist-choice__text">{{ $t('chairman.proposalDetail.checklistYes') }}</span>
                            </label>
                            <label class="checklist-choice">
                              <input
                                type="radio"
                                :name="`check:${resolveChecklistItemId(section, item)}`"
                                value="no"
                                :checked="getChecklistAnswer(section, item) === 'no'"
                                :disabled="isEvaluationLocked"
                                @change="setChecklistAnswer(section, item, 'no')"
                              >
                              <span class="checklist-choice__control" aria-hidden="true"></span>
                              <span class="checklist-choice__text">{{ $t('chairman.proposalDetail.checklistNo') }}</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CCardBody>
              </CCard>

              <CCard class="chairman-signature-card evaluation-section">
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
                <div class="comments-block evaluation-section">
                  <div class="floating-field">
                    <textarea
                      v-model="form.comments"
                      class="form-control floating-field__input"
                      rows="5"
                      :placeholder="' '"
                      :disabled="isEvaluationLocked"
                    ></textarea>
                    <label class="floating-field__label">
                      {{ $t('chairman.proposalDetail.comments') }}
                    </label>
                  </div>
                </div>

                <div class="evaluation-file-panel evaluation-section">
                  <div class="evaluation-file-panel__header">
                    <div class="evaluation-file-panel__title">
                      {{ $t('chairman.proposalDetail.uploadLabel') }}
                    </div>
                    <div class="evaluation-file-panel__picker">
                      <CButton
                        color="secondary"
                        variant="outline"
                        size="sm"
                        class="evaluation-file-panel__pick-btn"
                        :disabled="isEvaluationLocked || evaluationFileUploading"
                        @click="openEvaluationFilePicker"
                      >
                        <CIcon name="cil-library-add" class="mr-1" />
                        {{ $t('chairman.proposalDetail.pickFile') }}
                      </CButton>
                      <input
                        ref="evaluationFileInput"
                        type="file"
                        accept=".pdf,.doc,.docx,.xlsx"
                        style="display: none"
                        :disabled="isEvaluationLocked || evaluationFileUploading"
                        @change="onEvaluationFileChange($event.target.files, $event)"
                      >
                    </div>
                  </div>
                  <div v-if="evaluationFiles.length || (evaluationFileUploading && evaluationFileName)" class="evaluation-file-list evaluation-file-panel__body">
                    <div v-if="evaluationFileUploading && evaluationFileName" class="evaluation-file-item evaluation-file-item--pending">
                      <button type="button" class="evaluation-file-item__name" disabled>
                        <CIcon name="cil-cloud-upload" class="mr-2" />
                        <span class="text-truncate">{{ evaluationFileName }}</span>
                      </button>
                      <div class="evaluation-file-item__actions">
                        <span class="evaluation-file-item__status text-muted small">{{ $t('chairman.proposalDetail.uploading') }}</span>
                      </div>
                    </div>
                    <div v-for="fileItem in evaluationFiles" :key="resolveFileId(fileItem)" class="evaluation-file-item">
                      <button
                        type="button"
                        class="evaluation-file-item__name"
                        :disabled="evaluationFileUploading"
                        @click="openEvaluationFile(fileItem)"
                      >
                        <CIcon name="cil-paperclip" class="mr-2" />
                        <span class="text-truncate">{{ fileItem.name || '-' }}</span>
                      </button>
                      <div class="evaluation-file-item__actions">
                        <CButton
                          size="sm"
                          color="danger"
                          variant="outline"
                          class="evaluation-file-item__btn"
                          :disabled="isEvaluationLocked || evaluationFileUploading"
                          @click="deleteEvaluationFile(fileItem)"
                        >
                          <CIcon name="cil-trash" class="mr-1" /> {{ $t('chairman.proposalDetail.deleteFile') }}
                        </CButton>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="decision-block evaluation-section">
                  <div class="decision-block__header">
                    <div class="decision-block__title">{{ $t('chairman.proposalDetail.decision') }}</div>
                  </div>

                  <div v-if="isEvaluationLocked" class="decision-readonly">
                    {{ decisionLabel }}
                  </div>
                  <div v-else class="decision-choices">
                    <label class="decision-choice">
                      <input
                        type="radio"
                        name="chairman-decision"
                        value="approve"
                        :checked="String(form.decision || '').toLowerCase() === 'approve'"
                        :disabled="isEvaluationLocked"
                        @change="form.decision = 'approve'"
                      >
                      <span class="decision-choice__control" aria-hidden="true"></span>
                      <span class="decision-choice__text">{{ $t('chairman.proposalDetail.decisionOptions.approve') }}</span>
                    </label>
                    <label class="decision-choice">
                      <input
                        type="radio"
                        name="chairman-decision"
                        value="reject"
                        :checked="String(form.decision || '').toLowerCase() === 'reject'"
                        :disabled="isEvaluationLocked"
                        @change="form.decision = 'reject'"
                      >
                      <span class="decision-choice__control" aria-hidden="true"></span>
                      <span class="decision-choice__text">{{ $t('chairman.proposalDetail.decisionOptions.reject') }}</span>
                    </label>
                  </div>
                </div>

                <div class="evaluation-actions">
                  <div class="form-actions">
                    <CButton color="secondary" variant="outline" :disabled="isEvaluationLocked || isSubmitting" @click="onSaveDraftClick">
                      <CIcon name="cil-save" class="mr-1" /> {{ $t('chairman.proposalDetail.saveDraft') }}
                    </CButton>
                    <CButton color="primary" class="ml-2" :disabled="isEvaluationLocked || isSubmitting" @click="onSubmitClick">
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
      formFiles: [],
      draftSaved: false,
      submittedBannerVisible: false,
      isEvaluationLocked: false,
      evaluationFileName: '',
      evaluationFileUploading: false,
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
    isDarkTheme () {
      return Boolean(this.$store && this.$store.state && this.$store.state.darkMode)
    },
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
      if (Array.isArray(this.formFiles)) return this.formFiles
      const snapshot = this.proposal && this.proposal.formSnapshotJson ? this.proposal.formSnapshotJson : {}
      return Array.isArray(snapshot.files) ? snapshot.files : []
    },
    evaluationFiles () {
      const files = this.attachments
      const matched = files.filter((f) => {
        const t = String((f && (f.type || f.fileType || f.category || f.docType)) || '').trim().toLowerCase()
        return t === 'chairman_evaluation'
      })
      matched.sort((a, b) => {
        const at = new Date((a && (a.createdAt || a.updatedAt || a.uploadedAt)) || 0).getTime()
        const bt = new Date((b && (b.createdAt || b.updatedAt || b.uploadedAt)) || 0).getTime()
        return bt - at
      })
      return matched
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
      const resolved = this.resolveChecklistText(template, 'fundingTypeLabel')
      if (resolved) return resolved
      return String((this.proposal && this.proposal.fundingType) || '-').trim() || '-'
    },
    templateSections () {
      const template = this.selectedFundingTemplate
      return Array.isArray(template && template.sections) ? template.sections : []
    },
    importPlaceholderMessage () {
      const config = getChairmanChecklistConfig()
      const importStatus = String(config && config.importStatus ? config.importStatus : '').trim().toLowerCase()
      if (importStatus && importStatus !== 'partial') return ''
      const note = String(config && config.note ? config.note : '').trim()
      if (!note) return ''
      if (note.toLowerCase().includes('imported checklist for new-researcher')) return ''
      return note
    },
    checklistTotalCount () {
      return (this.templateSections || []).reduce((sum, section) => {
        const items = Array.isArray(section && section.items) ? section.items : []
        return sum + items.length
      }, 0)
    },
    checklistAnsweredCount () {
      return (this.templateSections || []).reduce((sum, section) => {
        const items = Array.isArray(section && section.items) ? section.items : []
        const answered = items.reduce((count, item) => count + (this.isChecklistAnswered(section, item) ? 1 : 0), 0)
        return sum + answered
      }, 0)
    },
    checklistRemainingCount () {
      const remaining = this.checklistTotalCount - this.checklistAnsweredCount
      return remaining > 0 ? remaining : 0
    },
    allChecklistAnswered () {
      if (this.checklistTotalCount <= 0) return true
      return this.checklistRemainingCount === 0
    },
    canSubmit () {
      return !!this.proposal && !this.isEvaluationLocked && this.isPendingChairmanReview && this.hasSignatureData && this.allChecklistAnswered
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
    decisionBadgeClass () {
      const value = String(this.form && this.form.decision ? this.form.decision : '').trim().toLowerCase()
      if (value === 'approve') return 'is-approve'
      if (value === 'reject') return 'is-reject'
      return ''
    },
    decisionOptions () {
      return [
        { value: 'approve', label: this.$t('chairman.proposalDetail.decisionOptions.approve') },
        { value: 'reject', label: this.$t('chairman.proposalDetail.decisionOptions.reject') }
      ]
    }
  },
  watch: {
    isDarkTheme () {
      this.$nextTick(() => {
        if (!this.isEvaluationLocked) {
          this.initializeSignatureCanvas()
          return
        }
        if (this.signatureData) this.renderSignatureToCanvas()
      })
    },
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
    resolveChecklistText (entity, field) {
      const rawLocale = String(this.$i18n && this.$i18n.locale ? this.$i18n.locale : '').trim().toLowerCase()
      const locale = rawLocale === 'en' || rawLocale.startsWith('en-') || rawLocale.startsWith('en_') ? 'en' : 'th'
      const source = entity && typeof entity === 'object' ? entity : null
      if (!source) return ''

      const suffixKey = locale === 'en' ? `${field}En` : `${field}Th`
      const underscoreKey = `${field}_${locale}`
      const localizedValue = source[suffixKey] !== undefined ? source[suffixKey] : source[underscoreKey]
      if (localizedValue !== undefined && localizedValue !== null) {
        const text = String(localizedValue).trim()
        if (text) return text
      }

      if (source[field] !== undefined && source[field] !== null) return String(source[field]).trim()
      return ''
    },
    resolveChecklistItemId (section, item) {
      const sectionKey = String(section && section.sectionKey ? section.sectionKey : 'section').trim() || 'section'
      const itemKey = String(item && item.itemKey ? item.itemKey : item && item.key ? item.key : 'item').trim() || 'item'
      return `${sectionKey}:${itemKey}`
    },
    resolveFileId (fileItem) {
      const id = fileItem && (fileItem.fileId || fileItem.id || fileItem._id)
      const name = fileItem && fileItem.name ? String(fileItem.name) : ''
      return String(id || name || Math.random()).trim()
    },
    getChecklistAnswer (section, item) {
      const key = this.resolveChecklistItemId(section, item)
      const raw = this.form && this.form.checklistValues ? this.form.checklistValues[key] : ''
      if (raw === true) return 'yes'
      const value = String(raw || '').trim().toLowerCase()
      if (value === 'yes' || value === 'no') return value
      return ''
    },
    isChecklistAnswered (section, item) {
      return this.getChecklistAnswer(section, item) === 'yes' || this.getChecklistAnswer(section, item) === 'no'
    },
    setChecklistAnswer (section, item, answer) {
      if (this.isEvaluationLocked) return
      const key = this.resolveChecklistItemId(section, item)
      const normalized = String(answer || '').trim().toLowerCase()
      if (normalized !== 'yes' && normalized !== 'no') return
      this.$set(this.form.checklistValues, key, normalized)
    },
    clearChecklistAnswer (section, item) {
      if (this.isEvaluationLocked) return
      const key = this.resolveChecklistItemId(section, item)
      if (this.form && this.form.checklistValues && Object.prototype.hasOwnProperty.call(this.form.checklistValues, key)) {
        this.$delete(this.form.checklistValues, key)
      }
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
      ctx.fillStyle = this.isDarkTheme ? '#0b1220' : '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = this.isDarkTheme ? '#e6edf7' : '#8b1212'
      this.signatureHasStroke = false
      if (this.signatureData) {
        this.renderSignatureToCanvas()
      }
    },
    normalizeSignatureBackground (dataUrl) {
      return new Promise((resolve) => {
        const source = typeof dataUrl === 'string' ? dataUrl : ''
        if (!source.startsWith('data:image/')) return resolve('')
        const image = new Image()
        image.onload = () => {
          try {
            const off = document.createElement('canvas')
            off.width = image.width || 1
            off.height = image.height || 1
            const offCtx = off.getContext('2d')
            if (!offCtx) return resolve(source)
            offCtx.clearRect(0, 0, off.width, off.height)
            offCtx.drawImage(image, 0, 0)
            const imgData = offCtx.getImageData(0, 0, off.width, off.height)
            const data = imgData.data
            const bgR = data[0]
            const bgG = data[1]
            const bgB = data[2]
            const threshold = 20
            for (let i = 0; i < data.length; i += 4) {
              const dr = Math.abs(data[i] - bgR)
              const dg = Math.abs(data[i + 1] - bgG)
              const db = Math.abs(data[i + 2] - bgB)
              if (dr + dg + db <= threshold) data[i + 3] = 0
            }
            offCtx.putImageData(imgData, 0, 0)
            return resolve(off.toDataURL('image/png'))
          } catch (_) {
            return resolve(source)
          }
        }
        image.onerror = () => resolve(source)
        image.src = source
      })
    },
    updateStoredSignatureData (dataUrl) {
      try {
        if (!dataUrl) return
        const raw = localStorage.getItem(this.signatureKey())
        if (!raw) return
        const saved = JSON.parse(raw)
        if (!saved || typeof saved !== 'object') return
        localStorage.setItem(this.signatureKey(), JSON.stringify({
          ...saved,
          signatureData: dataUrl
        }))
      } catch (_) {
        // ignore storage errors
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
        ctx.fillStyle = this.isDarkTheme ? '#0b1220' : '#ffffff'
        ctx.fillRect(0, 0, width, height)

        const scale = Math.min(width / image.width, height / image.height, 1)
        const drawWidth = image.width * scale
        const drawHeight = image.height * scale
        const offsetX = (width - drawWidth) / 2
        const offsetY = (height - drawHeight) / 2
        try {
          const off = document.createElement('canvas')
          off.width = image.width || 1
          off.height = image.height || 1
          const offCtx = off.getContext('2d')
          if (offCtx) {
            offCtx.clearRect(0, 0, off.width, off.height)
            offCtx.drawImage(image, 0, 0)
            const imgData = offCtx.getImageData(0, 0, off.width, off.height)
            const data = imgData.data
            const bgR = data[0]
            const bgG = data[1]
            const bgB = data[2]
            const threshold = 20
            for (let i = 0; i < data.length; i += 4) {
              const dr = Math.abs(data[i] - bgR)
              const dg = Math.abs(data[i + 1] - bgG)
              const db = Math.abs(data[i + 2] - bgB)
              if (dr + dg + db <= threshold) data[i + 3] = 0
            }
            offCtx.putImageData(imgData, 0, 0)
            ctx.drawImage(off, offsetX, offsetY, drawWidth, drawHeight)
          } else {
            ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)
          }
        } catch (_) {
          ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)
        }
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
      const raw = canvas.toDataURL('image/png')
      this.normalizeSignatureBackground(raw).then((normalized) => {
        this.signatureData = normalized || raw
        this.signatureTimestamp = new Date().toISOString()
        this.updateStoredSignatureData(this.signatureData)
      })
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
        sectionLabel: this.resolveChecklistText(section, 'sectionLabel'),
        items: (Array.isArray(section.items) ? section.items : []).map((item) => ({
          itemKey: item.itemKey,
          label: this.resolveChecklistText(item, 'label'),
          answer: this.getChecklistAnswer(section, item),
          checked: this.getChecklistAnswer(section, item) === 'yes'
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
            const rawAnswer = item && item.answer ? String(item.answer).trim().toLowerCase() : ''
            if (rawAnswer === 'yes' || rawAnswer === 'no') {
              result[`${sectionKey}:${itemKey}`] = rawAnswer
              return
            }
            // Backward compatibility: older payload stored only boolean "checked"
            if (item && item.checked === true) {
              result[`${sectionKey}:${itemKey}`] = 'yes'
            }
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
      this.formFiles = []
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

        const proposalId = this.proposal && (this.proposal._id || this.proposal.id)
        if (proposalId) {
          try {
            const fileRes = await Service.proposal.listFormFiles(encodeURIComponent(proposalId))
            const list = fileRes && fileRes.data && fileRes.data.data ? fileRes.data.data : (fileRes ? fileRes.data : null)
            this.formFiles = Array.isArray(list) ? list : []
          } catch (err) {
            console.warn('Load form files failed:', err)
            const snapshot = this.proposal && this.proposal.formSnapshotJson ? this.proposal.formSnapshotJson : {}
            this.formFiles = Array.isArray(snapshot.files) ? snapshot.files : []
          }
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
        if (this.signatureData) {
          this.normalizeSignatureBackground(this.signatureData).then((normalized) => {
            if (!normalized || normalized === this.signatureData) return
            this.signatureData = normalized
            this.updateStoredSignatureData(normalized)
            this.$nextTick(() => this.renderSignatureToCanvas())
          })
        }
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
    async onSaveDraftClick () {
      if (this.isEvaluationLocked || !this.proposal) return
      this.saveDraft()
      await this.showAlert({
        icon: 'success',
        title: this.$t('chairman.proposalDetail.alerts.draftSavedTitle'),
        text: this.$t('chairman.proposalDetail.alerts.draftSavedText'),
        timer: 1200,
        showConfirmButton: false
      })
    },
    async onSubmitClick () {
      if (this.isSubmitting || !this.proposal) return
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
      if (!this.allChecklistAnswered) {
        await this.showAlert({
          icon: 'warning',
          title: this.$t('chairman.proposalDetail.alerts.cannotSubmitTitle'),
          text: this.$t('chairman.proposalDetail.checklistCompleteRequired')
        })
        return
      }

      const result = await this.showAlert({
        icon: 'question',
        title: this.$t('chairman.proposalDetail.alerts.confirmSubmitTitle'),
        text: this.$t('chairman.proposalDetail.alerts.confirmSubmitText'),
        showCancelButton: true,
        confirmButtonText: this.$t('chairman.proposalDetail.submit'),
        cancelButtonText: this.$t('common.cancel')
      })
      if (!result || !result.isConfirmed) return
      await this.submitEvaluation()
    },
    openEvaluationFilePicker () {
      if (this.isEvaluationLocked || this.evaluationFileUploading) return
      const input = this.$refs.evaluationFileInput
      if (input && typeof input.click === 'function') input.click()
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
      if (!this.allChecklistAnswered) {
        await this.showAlert({
          icon: 'warning',
          title: this.$t('chairman.proposalDetail.alerts.cannotSubmitTitle'),
          text: `${this.$t('chairman.proposalDetail.checklistCompleteRequired')} (${this.$t('chairman.proposalDetail.checklistCompleteRemaining', { count: this.checklistRemainingCount })})`
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
    async onEvaluationFileChange (files, event) {
      if (this.isEvaluationLocked || this.evaluationFileUploading) return
      const input = event && event.target ? event.target : null
      const list = (files && typeof files === 'object' && typeof files.length === 'number')
        ? files
        : (input && input.files ? input.files : null)
      const file = list && list[0] ? list[0] : null
      if (!file || !this.proposalId) {
        this.evaluationFileName = ''
        return
      }

      const allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
      if (file.type && !allowed.includes(file.type)) {
        this.evaluationFileName = ''
        if (input) input.value = ''
        await this.showAlert({
          icon: 'warning',
          title: this.$t('chairman.proposalDetail.fileNotSupportedTitle'),
          text: this.$t('chairman.proposalDetail.fileNotSupportedText')
        })
        return
      }

      this.evaluationFileName = file.name
      this.evaluationFileUploading = true
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'chairman_evaluation')
      formData.append('note', `uploaded_by:${this.currentUserDisplayName || '-'}`)

      try {
        const response = await Service.proposal.uploadFormFile(encodeURIComponent(this.proposalId), formData)
        const entry = response && response.data && response.data.data ? response.data.data : null
        if (entry) {
          const entryId = entry.fileId || entry.id || entry._id
          const existing = Array.isArray(this.formFiles) ? this.formFiles : []
          this.formFiles = [
            ...existing.filter((f) => {
              const fid = f && (f.fileId || f.id || f._id)
              return String(fid) !== String(entryId)
            }),
            entry
          ]
        }
        await this.showAlert({
          icon: 'success',
          title: this.$t('chairman.proposalDetail.uploadSuccessTitle'),
          text: file.name,
          timer: 1500,
          showConfirmButton: false
        })
      } catch (error) {
        await this.showAlert({
          icon: 'error',
          title: this.$t('chairman.proposalDetail.uploadErrorTitle'),
          text: (error && error.response && error.response.data && error.response.data.message) || this.$t('chairman.proposalDetail.uploadErrorText')
        })
      } finally {
        this.evaluationFileUploading = false
        this.evaluationFileName = ''
        if (input) input.value = ''
      }
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
    async openEvaluationFile (fileItem) {
      const fileId = fileItem && (fileItem.fileId || fileItem.id || fileItem._id)
      if (!fileId || !this.proposalId) return
      try {
        const response = await Service.proposal.downloadFormFile(encodeURIComponent(this.proposalId), encodeURIComponent(fileId))
        const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' })
        const url = window.URL.createObjectURL(blob)
        const opened = window.open(url, '_blank')
        if (!opened) {
          const link = document.createElement('a')
          link.href = url
          link.download = fileItem.name || 'attachment'
          document.body.appendChild(link)
          link.click()
          link.remove()
        }
        window.setTimeout(() => window.URL.revokeObjectURL(url), 60 * 1000)
      } catch (error) {
        await this.downloadAttachment(fileItem)
      }
    },
    async deleteEvaluationFile (fileItem) {
      if (this.isEvaluationLocked || this.evaluationFileUploading) return
      const fileId = fileItem && (fileItem.fileId || fileItem.id || fileItem._id)
      if (!fileId || !this.proposalId) return

      const name = fileItem && fileItem.name ? String(fileItem.name) : '-'
      const result = await this.showAlert({
        icon: 'warning',
        title: this.$t('chairman.proposalDetail.deleteFileConfirmTitle'),
        text: this.$t('chairman.proposalDetail.deleteFileConfirmText', { name }),
        showCancelButton: true,
        confirmButtonText: this.$t('chairman.proposalDetail.deleteFile'),
        cancelButtonText: this.$t('common.cancel')
      })
      if (!result || !result.isConfirmed) return

      try {
        await Service.proposal.deleteFormFile(encodeURIComponent(this.proposalId), encodeURIComponent(fileId))
        this.formFiles = Array.isArray(this.formFiles)
          ? this.formFiles.filter((f) => {
            const fid = f && (f.fileId || f.id || f._id)
            return String(fid) !== String(fileId)
          })
          : []
        await this.showAlert({
          icon: 'success',
          title: this.$t('chairman.proposalDetail.deleteFileSuccessTitle'),
          text: name,
          timer: 1400,
          showConfirmButton: false
        })
      } catch (error) {
        await this.showAlert({
          icon: 'error',
          title: this.$t('chairman.proposalDetail.deleteFileErrorTitle'),
          text: (error && error.response && error.response.data && error.response.data.message) || this.$t('chairman.proposalDetail.alerts.retry')
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
  color: #ffffff;
  background: linear-gradient(135deg, #7f1d1d 0%, #8b1212 55%, #c59b3a 140%);
  border-bottom: 1px solid rgba(197, 155, 58, 0.55);
}

.evaluation-card__body {
  background: #ffffff;
}

.evaluation-card__body.evaluation-locked {
  opacity: 0.92;
}

.evaluation-card__body .btn-primary {
  background-color: #8b1212;
  border-color: #8b1212;
}

.evaluation-card__body .btn-primary:hover {
  background-color: #7f1d1d;
  border-color: #7f1d1d;
}

.evaluation-card__body .btn-primary:focus,
.evaluation-card__body .btn-primary.focus {
  box-shadow: 0 0 0 0.2rem rgba(197, 155, 58, 0.35);
}

.evaluation-card__body .btn-outline-secondary {
  color: #7f1d1d;
  border-color: rgba(197, 155, 58, 0.7);
}

.evaluation-card__body .btn-outline-secondary:hover {
  background: #fffbeb;
  color: #7f1d1d;
  border-color: rgba(197, 155, 58, 0.9);
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

.rubric-card {
  border: none;
  box-shadow: none;
  background: transparent;
}

.rubric-card__header {
  border: none;
  background: transparent;
  padding-left: 0;
  padding-right: 0;
}

.rubric-card__body {
  padding: 0.75rem;
  background: transparent;
}

.evaluation-section {
  margin-bottom: 1rem;
}

.evaluation-section:last-child {
  margin-bottom: 0;
}

.evaluation-file-panel {
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.95);
}

.evaluation-file-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.65rem;
}

.evaluation-file-panel__title {
  font-weight: 800;
  color: #7f1d1d;
}

.evaluation-file-panel__picker {
  flex: 1;
  max-width: 420px;
  display: flex;
  justify-content: flex-end;
}

.evaluation-file-panel__pick-btn {
  border-radius: 10px;
  font-weight: 700;
  border-color: rgba(197, 155, 58, 0.75);
  color: #7f1d1d;
}

.evaluation-file-panel__pick-btn:hover:not(:disabled) {
  background: rgba(197, 155, 58, 0.12);
  border-color: rgba(197, 155, 58, 0.95);
  color: #7f1d1d;
}

.evaluation-file-panel__body {
  padding-top: 0.65rem;
  border-top: 1px solid rgba(226, 232, 240, 0.9);
}

.decision-block {
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.95);
}

.decision-block__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.decision-block__title {
  font-weight: 800;
  color: #7f1d1d;
}

.decision-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.85rem;
  border: 1px solid rgba(197, 155, 58, 0.65);
  background: #fffdf8;
  color: #334155;
}

.decision-badge.is-approve {
  color: #7c5a10;
  background: rgba(197, 155, 58, 0.18);
}

.decision-badge.is-reject {
  color: #7f1d1d;
  background: rgba(127, 29, 29, 0.1);
}

.decision-readonly {
  margin-top: 0.25rem;
  font-weight: 700;
  color: #0f172a;
}

.evaluation-file-list {
  display: grid;
  gap: 0.5rem;
}

.evaluation-file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.65rem;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 10px;
  background: #ffffff;
}

.evaluation-file-item__name {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
  color: #7f1d1d;
  font-weight: 600;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.evaluation-file-item__name:hover {
  text-decoration: underline;
}

.evaluation-file-item__name:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  text-decoration: none;
}

.evaluation-file-item__name:focus-visible {
  outline: 2px solid rgba(197, 155, 58, 0.9);
  outline-offset: 2px;
  border-radius: 8px;
}

.evaluation-file-item__actions {
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
}

.evaluation-file-item__status {
  font-weight: 600;
}

.evaluation-file-item--pending {
  border-style: dashed;
  background: rgba(197, 155, 58, 0.08);
}

@media (max-width: 575px) {
  .evaluation-file-panel__header {
    flex-direction: column;
    align-items: stretch;
  }

  .evaluation-file-panel__picker {
    max-width: none;
  }
}

.evaluation-file-item__btn {
  border-radius: 10px;
  font-weight: 600;
}

.decision-choices {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.decision-choice {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  cursor: pointer;
  user-select: none;
  font-weight: 650;
  color: #0f172a;
}

.decision-choice input[type="radio"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.decision-choice__control {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid rgba(197, 155, 58, 0.9);
  background: #fff;
  position: relative;
  flex: 0 0 auto;
}

.decision-choice__control::after {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #7f1d1d;
  transform: scale(0);
}

.decision-choice input:checked + .decision-choice__control {
  border-color: #7f1d1d;
  box-shadow: 0 0 0 4px rgba(197, 155, 58, 0.22);
}

.decision-choice input:checked + .decision-choice__control::after {
  transform: scale(1);
}

.decision-choice input:focus-visible + .decision-choice__control {
  box-shadow: 0 0 0 4px rgba(197, 155, 58, 0.28);
  outline: none;
}

.decision-choice input:disabled + .decision-choice__control {
  opacity: 0.55;
}

.decision-choice input:disabled ~ .decision-choice__text {
  opacity: 0.7;
  cursor: not-allowed;
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
  font-weight: 800;
  margin-top: 8px;
  color: #7f1d1d;
}

.rubric-fund-readonly {
  min-width: 180px;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(197, 155, 58, 0.65);
  border-radius: 0.5rem;
  background: #fffbeb;
  font-weight: 600;
  color: #7f1d1d;
}

.rubric-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rubric-item {
  border: none;
  border-radius: 0;
  padding: 0;
  background: transparent;
}

.rubric-item__main--checklist {
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
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
  gap: 0;
  font-size: 0.9rem;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 0.75rem;
  overflow: hidden;
}

.checklist-table-header {
  display: grid;
  grid-template-columns: 32px 1fr 140px;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(90deg, rgba(139, 18, 18, 0.06) 0%, rgba(197, 155, 58, 0.10) 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.95);
  color: #7f1d1d;
}

.checklist-table-header__no {
  text-align: center;
}

.checklist-table-header__choices {
  display: flex;
  justify-content: center;
  align-items: center;
}

.checklist-row {
  display: grid;
  grid-template-columns: 32px 1fr 140px;
  align-items: flex-start;
  gap: 0.75rem;
  margin: 0;
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

.checklist-row.is-unanswered {
  background: transparent;
  border-left: none;
}

.checklist-row:last-child {
  border-bottom: none;
}

.floating-field {
  position: relative;
}

.floating-field__input {
  padding-top: 1.25rem;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 0.75rem;
  box-shadow: none;
}

.floating-field__label {
  position: absolute;
  top: 0.8rem;
  left: 0.75rem;
  margin: 0;
  pointer-events: none;
  color: #7f1d1d;
  font-weight: 800;
  background: transparent;
  padding: 0;
  line-height: 1.1;
  opacity: 0.82;
  transition: top 120ms ease-out, left 120ms ease-out, transform 120ms ease-out, opacity 120ms ease-out, background-color 120ms ease-out;
}

.floating-field__input:focus + .floating-field__label,
.floating-field__input:not(:placeholder-shown) + .floating-field__label {
  top: -0.65rem;
  left: 0.6rem;
  background: #ffffff;
  padding: 0 0.4rem;
  opacity: 0.95;
  transform: scale(0.92);
  transform-origin: left top;
}

.floating-field__input:focus {
  border-color: rgba(203, 213, 225, 0.95);
  box-shadow: none;
}

.floating-field__input:disabled + .floating-field__label {
  opacity: 0.7;
}

.checklist-row__no {
  text-align: center;
  font-weight: 600;
  color: #64748b;
  line-height: 1.2;
}

.checklist-row__text {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.checklist-row__label {
  font-weight: 550;
  font-size: 0.9rem;
  line-height: 1.25;
}

.checklist-row__desc {
  color: #64748b;
  font-size: 0.8rem;
  line-height: 1.25;
}

.checklist-row__choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  align-items: center;
  justify-items: center;
  padding-top: 0.1rem;
}

.checklist-choice {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0;
  cursor: pointer;
  user-select: none;
  font-weight: 550;
  font-size: 0.85rem;
  line-height: 1.2;
  position: relative;
}

.checklist-choice input[type="radio"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.checklist-choice__control {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 2px solid rgba(197, 155, 58, 0.9);
  background: #fff;
  position: relative;
  flex: 0 0 auto;
}

.checklist-choice__control::after {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #7f1d1d;
  transform: scale(0);
}

.checklist-choice input:checked + .checklist-choice__control {
  border-color: #7f1d1d;
  box-shadow: 0 0 0 4px rgba(197, 155, 58, 0.22);
}

.checklist-choice input:checked + .checklist-choice__control::after {
  transform: scale(1);
}

.checklist-choice input:focus-visible + .checklist-choice__control {
  box-shadow: 0 0 0 4px rgba(197, 155, 58, 0.28);
  outline: none;
}

.checklist-choice input:disabled + .checklist-choice__control {
  opacity: 0.55;
}

.checklist-choice input:disabled ~ .checklist-choice__text {
  opacity: 0.7;
  cursor: not-allowed;
}

.checklist-row {
  transition: none;
}

.chairman-proposal-detail.is-dark {
  color: #e5e7eb;
}

.chairman-proposal-detail.is-dark .evaluation-card__body {
  background: #0b1220;
}

.chairman-proposal-detail.is-dark .evaluation-card__header {
  background: linear-gradient(135deg, #111827 0%, #0f172a 60%, #1f2937 140%);
  border-bottom-color: rgba(148, 163, 184, 0.18);
}

.chairman-proposal-detail.is-dark .evaluation-file-panel,
.chairman-proposal-detail.is-dark .decision-block,
.chairman-proposal-detail.is-dark .checklist-items,
.chairman-proposal-detail.is-dark .chairman-signature-card,
.chairman-proposal-detail.is-dark .chairman-signature-card__body,
.chairman-proposal-detail.is-dark .rubric-card__body {
  background: #0b1220;
  border-color: rgba(148, 163, 184, 0.18);
}

.chairman-proposal-detail.is-dark .chairman-signature-card__header {
  background: #0b1220;
  border-bottom-color: rgba(148, 163, 184, 0.18);
}

.chairman-proposal-detail.is-dark .chairman-signature-card__subtitle,
.chairman-proposal-detail.is-dark .chairman-signature-card__hint,
.chairman-proposal-detail.is-dark .chairman-signature-card__meta,
.chairman-proposal-detail.is-dark .chairman-signature-card__empty {
  color: rgba(229, 231, 235, 0.75) !important;
}

.chairman-proposal-detail.is-dark .chairman-signature-card__saved {
  color: #86efac !important;
}

.chairman-proposal-detail.is-dark .chairman-signature-card__canvas-wrap,
.chairman-proposal-detail.is-dark .chairman-signature-card__preview {
  background: #0b1220;
  border-color: rgba(148, 163, 184, 0.18);
}

.chairman-proposal-detail.is-dark .chairman-signature-card__header .badge-warning {
  background: rgba(245, 158, 11, 0.16);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.35);
}

.chairman-proposal-detail.is-dark .chairman-signature-card__alert.alert-warning {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.28);
  color: rgba(251, 191, 36, 0.95);
}

.chairman-proposal-detail.is-dark .chairman-signature-card__toolbar .btn-outline-primary,
.chairman-proposal-detail.is-dark .chairman-signature-card__toolbar .btn-outline-success,
.chairman-proposal-detail.is-dark .chairman-signature-card__toolbar .btn-outline-secondary {
  color: #e5e7eb;
  border-color: rgba(148, 163, 184, 0.38);
}

.chairman-proposal-detail.is-dark .chairman-signature-card__toolbar .btn-outline-primary:hover:not(:disabled),
.chairman-proposal-detail.is-dark .chairman-signature-card__toolbar .btn-outline-success:hover:not(:disabled),
.chairman-proposal-detail.is-dark .chairman-signature-card__toolbar .btn-outline-secondary:hover:not(:disabled) {
  background: rgba(148, 163, 184, 0.10);
  border-color: rgba(148, 163, 184, 0.5);
  color: #e5e7eb;
}

.chairman-proposal-detail.is-dark .rubric-toolbar__label,
.chairman-proposal-detail.is-dark .evaluation-file-panel__title,
.chairman-proposal-detail.is-dark .decision-block__title,
.chairman-proposal-detail.is-dark .chairman-signature-card__title,
.chairman-proposal-detail.is-dark .checklist-table-header {
  color: #e5e7eb;
}

.chairman-proposal-detail.is-dark .rubric-fund-readonly {
  background: rgba(148, 163, 184, 0.08);
  border-color: rgba(148, 163, 184, 0.22);
  color: #e5e7eb;
}

.chairman-proposal-detail.is-dark .checklist-table-header {
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.10) 0%, rgba(148, 163, 184, 0.04) 100%);
  border-bottom-color: rgba(148, 163, 184, 0.18);
}

.chairman-proposal-detail.is-dark .checklist-row {
  border-bottom-color: rgba(148, 163, 184, 0.12);
}

.chairman-proposal-detail.is-dark .checklist-row__no {
  color: rgba(229, 231, 235, 0.75);
}

.chairman-proposal-detail.is-dark .floating-field__input {
  background: #0b1220;
  border-color: rgba(148, 163, 184, 0.18);
  color: #e5e7eb;
}

.chairman-proposal-detail.is-dark .floating-field__label {
  color: rgba(229, 231, 235, 0.85);
}

.chairman-proposal-detail.is-dark .floating-field__input:focus + .floating-field__label,
.chairman-proposal-detail.is-dark .floating-field__input:not(:placeholder-shown) + .floating-field__label {
  background: #0b1220;
}

.chairman-proposal-detail.is-dark .evaluation-file-item {
  background: rgba(148, 163, 184, 0.06);
  border-color: rgba(148, 163, 184, 0.18);
}

.chairman-proposal-detail.is-dark .evaluation-file-item--pending {
  background: rgba(148, 163, 184, 0.08);
}

.chairman-proposal-detail.is-dark .evaluation-file-item__name {
  color: #e5e7eb;
}

.chairman-proposal-detail.is-dark .evaluation-file-panel__pick-btn {
  border-color: rgba(148, 163, 184, 0.35);
  color: #e5e7eb;
}

.chairman-proposal-detail.is-dark .evaluation-file-panel__pick-btn:hover:not(:disabled) {
  background: rgba(148, 163, 184, 0.10);
  border-color: rgba(148, 163, 184, 0.45);
  color: #e5e7eb;
}

.chairman-proposal-detail.is-dark .decision-badge {
  border-color: rgba(148, 163, 184, 0.22);
  background: rgba(148, 163, 184, 0.08);
  color: #e5e7eb;
}

.chairman-proposal-detail.is-dark .decision-badge.is-approve,
.chairman-proposal-detail.is-dark .decision-badge.is-reject {
  background: rgba(148, 163, 184, 0.08);
  color: #e5e7eb;
}

.chairman-proposal-detail.is-dark .decision-choice__control,
.chairman-proposal-detail.is-dark .checklist-choice__control {
  border-color: rgba(229, 231, 235, 0.65);
  background: #0b1220;
}

.chairman-proposal-detail.is-dark .decision-choice__control::after,
.chairman-proposal-detail.is-dark .checklist-choice__control::after {
  background: #e5e7eb;
}

.chairman-proposal-detail.is-dark .decision-choice input:checked + .decision-choice__control,
.chairman-proposal-detail.is-dark .checklist-choice input:checked + .checklist-choice__control {
  border-color: #e5e7eb;
  box-shadow: 0 0 0 4px rgba(148, 163, 184, 0.18);
}

.chairman-proposal-detail.is-dark .decision-choice input:focus-visible + .decision-choice__control,
.chairman-proposal-detail.is-dark .checklist-choice input:focus-visible + .checklist-choice__control {
  box-shadow: 0 0 0 4px rgba(148, 163, 184, 0.22);
}

.chairman-proposal-detail.is-dark .evaluation-card__body .btn-primary {
  background-color: #e5e7eb;
  border-color: #e5e7eb;
  color: #111827;
}

.chairman-proposal-detail.is-dark .evaluation-card__body .btn-primary:hover {
  background-color: #f3f4f6;
  border-color: #f3f4f6;
  color: #111827;
}

.chairman-proposal-detail.is-dark .evaluation-card__body .btn-outline-secondary {
  color: #e5e7eb;
  border-color: rgba(148, 163, 184, 0.38);
}

.chairman-proposal-detail.is-dark .evaluation-card__body .btn-outline-secondary:hover {
  background: rgba(148, 163, 184, 0.10);
  color: #e5e7eb;
  border-color: rgba(148, 163, 184, 0.5);
}

@media (max-width: 991px) {
  .checklist-table-header {
    grid-template-columns: 36px 1fr;
  }

  .checklist-table-header__choices {
    display: none;
  }

  .checklist-row {
    grid-template-columns: 36px 1fr;
    grid-template-rows: auto auto;
  }

  .checklist-row__choices {
    grid-column: 1 / -1;
    justify-items: start;
    grid-template-columns: auto auto;
  }
}

.chairman-signature-card {
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 0.75rem;
  overflow: hidden;
  background: #ffffff;
}

.chairman-signature-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  background: #ffffff;
  border-bottom: 1px solid rgba(226, 232, 240, 0.95);
}

.chairman-signature-card__title {
  font-weight: 700;
  color: #7f1d1d;
}

.chairman-signature-card__body {
  background: #ffffff;
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
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 0.75rem;
  background: #ffffff;
  min-height: 190px;
}

.chairman-signature-card__canvas {
  display: block;
  width: 100%;
  height: 190px;
  touch-action: none;
  border-radius: 0.75rem;
}

.chairman-signature-card__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
}

.chairman-signature-card__preview.is-empty {
  background: #ffffff;
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

