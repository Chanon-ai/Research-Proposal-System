<template>
  <div class="review-template-settings">
    <CAlert show color="info" class="mt-3">
      {{ $t('reviewTemplate.alert') }}
    </CAlert>

    <CCard class="mt-3">
      <CCardHeader>{{ $t('reviewTemplate.import.cardTitle') }}</CCardHeader>
      <CCardBody>
        <CRow>
          <CCol md="4">
            <CSelect
              :label="$t('reviewTemplate.import.typeLabel')"
              :value="templateImport.targetType"
              :options="templateImportTargetOptions"
              @change="handleImportTargetChange(getSelectValue($event))"
            />
          </CCol>
          <CCol v-if="templateImport.targetType === 'chairman'" md="4">
            <CInput :label="$t('reviewTemplate.fields.fundingTypeKey')" v-model="templateImport.fundingTypeKey" />
          </CCol>
          <CCol v-if="templateImport.targetType === 'chairman'" md="4">
            <CInput :label="$t('reviewTemplate.fields.fundingTypeLabel')" v-model="templateImport.fundingTypeLabel" />
          </CCol>
        </CRow>

        <div class="template-toolbar mt-2">
          <div class="template-import-file">
            <label class="d-block font-weight-bold mb-1">{{ $t('reviewTemplate.import.fileLabel') }}</label>
            <input
              class="form-control"
              type="file"
              accept=".pdf,application/pdf"
              @change="handleTemplateImportFileChange"
            >
            <div v-if="templateImport.fileName" class="small text-muted mt-1">{{ templateImport.fileName }}</div>
          </div>
          <div class="template-toolbar__actions">
            <CButton size="sm" color="secondary" variant="outline" @click="clearTemplateImportState">{{ $t('reviewTemplate.import.clearBtn') }}</CButton>
            <CButton size="sm" color="primary" :disabled="!canPreviewTemplateImport" @click="previewTemplateImport">{{ $t('reviewTemplate.import.previewBtn') }}</CButton>
          </div>
        </div>

        <div v-if="templateImport.error" class="text-danger small mt-3">{{ templateImport.error }}</div>

        <div v-if="templateImport.preview" class="template-preview mt-3">
          <div class="template-preview__title">{{ $t('reviewTemplate.import.previewTitle') }}</div>
          <div class="text-muted small mb-3">{{ templateImport.preview.fileName }} · {{ templateImportTargetLabel }}</div>

          <div class="import-summary-grid">
            <div class="import-summary-grid__item">
              <div class="import-summary-grid__label">{{ templateImport.targetType === 'committee' ? $t('reviewTemplate.import.summaryPrimaryCommittee') : $t('reviewTemplate.import.summaryPrimaryChairman') }}</div>
              <div class="import-summary-grid__value">{{ importSummaryPrimaryValue }}</div>
            </div>
            <div class="import-summary-grid__item">
              <div class="import-summary-grid__label">{{ templateImport.targetType === 'committee' ? $t('reviewTemplate.import.summarySecondaryCommittee') : $t('reviewTemplate.import.summarySecondaryChairman') }}</div>
              <div class="import-summary-grid__value">{{ importSummarySecondaryValue }}</div>
            </div>
            <div class="import-summary-grid__item">
              <div class="import-summary-grid__label">{{ $t('reviewTemplate.import.summaryWarnings') }}</div>
              <div class="import-summary-grid__value">{{ importSummaryWarningCount }}</div>
            </div>
          </div>

          <div v-if="templateImport.preview.warnings && templateImport.preview.warnings.length" class="mt-3">
            <div class="font-weight-bold small mb-1">{{ $t('reviewTemplate.import.parserWarnings') }}</div>
            <ul class="template-preview__list mb-0">
              <li v-for="(warning, warningIndex) in templateImport.preview.warnings" :key="`warning-${warningIndex}`">{{ warning }}</li>
            </ul>
          </div>

          <CTextarea
            class="mt-3"
            :label="$t('reviewTemplate.import.extractedTextLabel')"
            rows="10"
            :value="templateImport.preview.extractedTextPreview"
            readonly
          />

          <div class="template-toolbar__actions mt-3">
            <CButton size="sm" color="info" variant="outline" @click="applyImportedDraftToForm">{{ $t('reviewTemplate.import.loadDraftBtn') }}</CButton>
            <CButton size="sm" color="success" :disabled="templateImport.applying" @click="approveImportedDraft">{{ $t('reviewTemplate.import.approveBtn') }}</CButton>
          </div>
        </div>
      </CCardBody>
    </CCard>

    <CCard class="mt-3">
      <CCardHeader>{{ $t('reviewTemplate.chairman.cardTitle') }}</CCardHeader>
      <CCardBody>
        <CRow class="template-two-pane">
          <CCol lg="4" class="mb-3 mb-lg-0">
            <div class="template-two-pane__preview">
              <CSelect
                class="template-toolbar__select"
                :label="$t('reviewTemplate.chairman.previewLabel')"
                :value="chairmanPreviewFundingType"
                :options="chairmanFundingTypeOptions"
                @change="chairmanPreviewFundingType = getSelectValue($event)"
              />

              <div v-if="chairmanPreviewTemplate" class="template-preview template-preview--sticky template-preview--with-select-gap">
                <div class="template-preview__title">{{ $t('reviewTemplate.chairman.previewTitle') }}</div>
                <div class="text-muted small mb-2">{{ chairmanPreviewTemplate.fundingTypeLabel }}</div>
                <div v-for="section in chairmanPreviewTemplate.sections" :key="section.sectionKey" class="template-preview__block">
                  <div class="font-weight-bold">{{ section.sectionLabel }}</div>
                  <div v-if="section.description" class="text-muted small mb-2">{{ section.description }}</div>
                  <ul class="template-preview__list mb-0">
                    <li v-for="item in section.items" :key="item.itemKey">{{ item.label }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </CCol>

          <CCol lg="8">
            <div class="template-two-pane__editor">
              <div class="template-toolbar mb-3">
                <div class="template-pane-context" v-if="chairmanSelectedFundingTemplate">
                  <div class="template-pane-context__label">{{ $t('reviewTemplate.editing') }}</div>
                  <div class="template-pane-context__value">{{ chairmanSelectedFundingTemplate.fundingTypeLabel || chairmanSelectedFundingTemplate.fundingTypeKey }}</div>
                </div>
                <div class="template-toolbar__actions ml-auto">
                  <CButton size="sm" color="warning" variant="outline" @click="resetChairmanTemplate">{{ $t('reviewTemplate.resetBtn') }}</CButton>
                  <CButton size="sm" color="primary" @click="saveChairmanTemplate">{{ $t('reviewTemplate.chairman.saveBtn') }}</CButton>
                </div>
              </div>

              <div class="template-two-pane__editor-scroll">
                <CRow>
                  <CCol md="4"><CInput :label="$t('reviewTemplate.fields.version')" type="number" v-model.number="chairmanForm.templateVersion" /></CCol>
                  <CCol md="4"><CInput :label="$t('reviewTemplate.fields.reviewerRole')" v-model="chairmanForm.reviewerRole" /></CCol>
                  <CCol md="4"><CInput :label="$t('reviewTemplate.fields.reviewerLabel')" v-model="chairmanForm.reviewerLabel" /></CCol>
                </CRow>
                <CRow>
                  <CCol md="12"><CTextarea :label="$t('reviewTemplate.noteLabel')" rows="3" v-model="chairmanForm.note" /></CCol>
                </CRow>

                <div class="template-section-header mt-3">
                  <div>
                    <div class="template-section-title">{{ $t('reviewTemplate.chairman.fundingSection') }}</div>
                    <div class="text-muted small">{{ $t('reviewTemplate.chairman.fundingDesc') }}</div>
                  </div>
                  <CButton size="sm" color="success" variant="outline" @click="addChairmanFundingTemplate">{{ $t('reviewTemplate.addFundingTypeBtn') }}</CButton>
                </div>

                <div v-if="chairmanSelectedFundingTemplate" class="editor-card mt-3">
                  <div class="editor-card__header">
                    <div class="editor-card__title">{{ $t('reviewTemplate.fundingTypeN', { n: chairmanSelectedFundingTemplateIndex + 1 }) }}</div>
                    <CButton size="sm" color="danger" variant="outline" @click="removeChairmanFundingTemplate(chairmanSelectedFundingTemplateIndex)">{{ $t('reviewTemplate.removeFundingTypeBtn') }}</CButton>
                  </div>
                  <CInput :label="$t('reviewTemplate.fields.fundingTypeLabel')" v-model="chairmanSelectedFundingTemplate.fundingTypeLabel" />

                  <div class="template-section-header template-section-header--inner">
                    <div class="template-section-title">{{ $t('reviewTemplate.sectionsTitle') }}</div>
                    <CButton size="sm" color="info" variant="outline" @click="addChairmanSection(chairmanSelectedFundingTemplateIndex)">{{ $t('reviewTemplate.addSectionBtn') }}</CButton>
                  </div>

                  <div v-for="(section, sectionIndex) in chairmanSelectedFundingTemplate.sections" :key="`section-${chairmanSelectedFundingTemplateIndex}-${sectionIndex}`" class="editor-card editor-card--nested mt-2">
                    <div class="editor-card__header">
                      <div class="editor-card__title">{{ $t('reviewTemplate.sectionN', { n: sectionIndex + 1 }) }}</div>
                      <CButton size="sm" color="danger" variant="outline" @click="removeChairmanSection(chairmanSelectedFundingTemplateIndex, sectionIndex)">{{ $t('reviewTemplate.removeSectionBtn') }}</CButton>
                    </div>
                    <CInput :label="$t('reviewTemplate.fields.sectionLabel')" v-model="section.sectionLabel" />
                    <CTextarea :label="$t('reviewTemplate.fields.sectionDescription')" rows="2" v-model="section.description" />

                    <div class="template-section-header template-section-header--inner">
                      <div class="template-section-title">{{ $t('reviewTemplate.itemsTitle') }}</div>
                      <CButton size="sm" color="info" variant="outline" @click="addChairmanItem(chairmanSelectedFundingTemplateIndex, sectionIndex)">{{ $t('reviewTemplate.addItemBtn') }}</CButton>
                    </div>

                    <div v-for="(item, itemIndex) in section.items" :key="`item-${chairmanSelectedFundingTemplateIndex}-${sectionIndex}-${itemIndex}`" class="editor-card editor-card--subnested mt-2">
                      <div class="editor-card__header">
                        <div class="editor-card__title">{{ $t('reviewTemplate.itemN', { n: itemIndex + 1 }) }}</div>
                        <CButton size="sm" color="danger" variant="outline" @click="removeChairmanItem(chairmanSelectedFundingTemplateIndex, sectionIndex, itemIndex)">{{ $t('reviewTemplate.removeItemBtn') }}</CButton>
                      </div>
                      <CTextarea :label="$t('reviewTemplate.fields.itemLabel')" rows="3" v-model="item.label" />
                    </div>
                  </div>
                </div>

                <div v-if="chairmanTemplateError" class="text-danger small mt-3">{{ chairmanTemplateError }}</div>
              </div>
            </div>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <CCard class="mt-3">
      <CCardHeader>{{ $t('reviewTemplate.committee.cardTitle') }}</CCardHeader>
      <CCardBody>
        <CRow class="template-two-pane">
          <CCol lg="4" class="mb-3 mb-lg-0">
            <div class="template-two-pane__preview">
              <CSelect
                class="template-toolbar__select"
                :label="$t('reviewTemplate.committee.previewLabel')"
                :value="committeePreviewFundType"
                :options="committeeFundTypeOptions"
                @change="committeePreviewFundType = getSelectValue($event)"
              />

              <div v-if="committeePreviewConfig" class="template-preview template-preview--sticky template-preview--with-select-gap">
                <div class="template-preview__title">{{ $t('reviewTemplate.committee.previewTitle') }}</div>
                <div class="text-muted small mb-2">{{ committeePreviewFundTypeLabel }}</div>
                <div class="table-responsive">
                  <table class="table table-sm table-bordered mb-0">
                    <thead>
                      <tr>
                        <th style="width:64px;">{{ $t('reviewTemplate.committee.colNo') }}</th>
                        <th>{{ $t('reviewTemplate.committee.colTitle') }}</th>
                        <th style="width:120px;">{{ $t('reviewTemplate.committee.colWeight') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in committeePreviewConfig.rubricRows" :key="row.no">
                        <td class="text-center">{{ row.no }}</td>
                        <td>{{ row.title }}</td>
                        <td class="text-center">{{ formatCommitteeWeight(row) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CCol>

          <CCol lg="8">
            <div class="template-two-pane__editor">
              <div class="template-toolbar mb-3">
                <div class="template-pane-context" v-if="committeeSelectedFundTypeOption">
                  <div class="template-pane-context__label">{{ $t('reviewTemplate.editing') }}</div>
                  <div class="template-pane-context__value">{{ committeeSelectedFundTypeOption.label || committeeSelectedFundTypeOption.value }}</div>
                </div>
                <div class="template-toolbar__actions ml-auto">
                  <CButton size="sm" color="warning" variant="outline" @click="resetCommitteeTemplate">{{ $t('reviewTemplate.resetBtn') }}</CButton>
                  <CButton size="sm" color="primary" @click="saveCommitteeTemplate">{{ $t('reviewTemplate.committee.saveBtn') }}</CButton>
                </div>
              </div>

              <div class="template-two-pane__editor-scroll">
                <CRow>
                  <CCol md="4"><CInput :label="$t('reviewTemplate.fields.version')" type="number" v-model.number="committeeForm.templateVersion" /></CCol>
                  <CCol md="4"><CInput :label="$t('reviewTemplate.fields.reviewerRole')" v-model="committeeForm.reviewerRole" /></CCol>
                  <CCol md="4"><CInput :label="$t('reviewTemplate.fields.reviewerLabel')" v-model="committeeForm.reviewerLabel" /></CCol>
                </CRow>

                <div class="template-section-header mt-3">
                  <div>
                    <div class="template-section-title">{{ $t('reviewTemplate.committee.fundingSection') }}</div>
                    <div class="text-muted small">{{ $t('reviewTemplate.committee.fundingDesc') }}</div>
                  </div>
                  <CButton size="sm" color="success" variant="outline" @click="addCommitteeFundTypeOption">{{ $t('reviewTemplate.addFundingTypeBtn') }}</CButton>
                </div>

                <div v-if="committeeSelectedFundTypeOption" class="editor-card mt-2">
                  <div class="editor-card__header">
                    <div class="editor-card__title">{{ $t('reviewTemplate.fundingTypeN', { n: committeeSelectedFundTypeIndex + 1 }) }}</div>
                    <CButton size="sm" color="danger" variant="outline" @click="removeCommitteeFundTypeOption(committeeSelectedFundTypeIndex)">{{ $t('reviewTemplate.removeFundingTypeBtn') }}</CButton>
                  </div>
                  <CRow>
                    <CCol md="4"><CInput :label="$t('reviewTemplate.fields.value')" v-model="committeeSelectedFundTypeOption.value" /></CCol>
                    <CCol md="8"><CInput :label="$t('reviewTemplate.fields.label')" v-model="committeeSelectedFundTypeOption.label" /></CCol>
                  </CRow>
                </div>

                <div class="template-section-header mt-3">
                  <div>
                    <div class="template-section-title">{{ $t('reviewTemplate.rubricRowsTitle') }}</div>
                    <div class="text-muted small">{{ $t('reviewTemplate.committee.rubricDesc') }}</div>
                  </div>
                  <CButton size="sm" color="success" variant="outline" @click="addCommitteeRubricRow">{{ $t('reviewTemplate.committee.addRowBtn') }}</CButton>
                </div>

                <div v-for="(row, rowIndex) in committeeForm.rubricRows" :key="`committee-row-${rowIndex}`" class="editor-card mt-3">
                  <div class="editor-card__header">
                    <div class="editor-card__title">{{ $t('reviewTemplate.committee.rowN', { n: rowIndex + 1 }) }}</div>
                    <CButton size="sm" color="danger" variant="outline" @click="removeCommitteeRubricRow(rowIndex)">{{ $t('reviewTemplate.committee.removeRowBtn') }}</CButton>
                  </div>

                  <CRow>
                    <CCol md="2"><CInput :label="$t('reviewTemplate.fields.no')" type="number" v-model.number="row.no" /></CCol>
                    <CCol md="6"><CInput :label="$t('reviewTemplate.fields.title')" v-model="row.title" /></CCol>
                    <CCol md="4"><CInput :label="$t('reviewTemplate.fields.description')" v-model="row.desc" /></CCol>
                  </CRow>

                  <div class="weights-grid">
                    <div v-if="committeeSelectedFundTypeOption" :key="`weight-${rowIndex}-${committeeSelectedFundTypeOption.value}`" class="weights-grid__item">
                      <CInput
                        :label="`${$t('reviewTemplate.committee.weightLabel')}: ${committeeSelectedFundTypeOption.label || committeeSelectedFundTypeOption.value}`"
                        type="number"
                        :value="row.weights[committeeSelectedFundTypeOption.value]"
                        @input="updateCommitteeWeight(rowIndex, committeeSelectedFundTypeOption.value, $event)"
                      />
                    </div>
                  </div>
                </div>

                <div v-if="committeeTemplateError" class="text-danger small mt-3">{{ committeeTemplateError }}</div>
              </div>
            </div>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>
  </div>
</template>

<script>
import { instance as axios } from '@/service/api'
import Swal from 'sweetalert2'
import {
  CHAIRMAN_CHECKLIST_SETTING_KEY,
  getDefaultChairmanChecklistConfig,
  normalizeChairmanChecklistConfig,
  setChairmanChecklistRuntimeConfig
} from '@/ResearchFormRS/constants/chairmanChecklist'
import {
  COMMITTEE_RUBRIC_SETTING_KEY,
  getDefaultCommitteeRubricConfig,
  normalizeCommitteeRubricConfig,
  setCommitteeRubricRuntimeConfig
} from '@/ResearchFormRS/constants/committeeRubric'

const RESEARCH_FORM_GROUP = 'research_form'

export default {
  name: 'AdminReviewTemplateSettings',
  data () {
    return {
      settingsMap: {},
      chairmanForm: getDefaultChairmanChecklistConfig(),
      committeeForm: getDefaultCommitteeRubricConfig(),
      chairmanTemplateError: '',
      committeeTemplateError: '',
      chairmanPreviewFundingType: 'new-researcher',
      committeePreviewFundType: 'new',
      templateImport: {
        targetType: 'chairman',
        fundingTypeKey: 'new-researcher',
        fundingTypeLabel: this.$t('reviewTemplate.chairman.defaultFundingTypeLabel'),
        file: null,
        fileName: '',
        preview: null,
        error: '',
        applying: false
      }
    }
  },
  computed: {
    templateImportTargetOptions () {
      return [
        { value: 'chairman', label: this.$t('reviewTemplate.import.typeChairman') },
        { value: 'committee', label: this.$t('reviewTemplate.import.typeCommittee') }
      ]
    },
    templateImportTargetLabel () {
      return this.templateImport.targetType === 'committee' ? this.$t('reviewTemplate.import.typeCommittee') : this.$t('reviewTemplate.import.typeChairman')
    },
    canPreviewTemplateImport () {
      if (!this.templateImport.file) return false
      if (this.templateImport.targetType !== 'chairman') return true
      return Boolean(String(this.templateImport.fundingTypeKey || '').trim()) && Boolean(String(this.templateImport.fundingTypeLabel || '').trim())
    },
    importSummaryPrimaryValue () {
      const summary = this.templateImport.preview && this.templateImport.preview.summary
      if (!summary) return '-'
      return this.templateImport.targetType === 'committee'
        ? String(summary.rubricRowCount || 0)
        : String(summary.sectionCount || 0)
    },
    importSummarySecondaryValue () {
      const summary = this.templateImport.preview && this.templateImport.preview.summary
      if (!summary) return '-'
      return this.templateImport.targetType === 'committee'
        ? String(summary.fundTypeCount || 0)
        : String(summary.itemCount || 0)
    },
    importSummaryWarningCount () {
      const summary = this.templateImport.preview && this.templateImport.preview.summary
      return summary ? String(summary.warningCount || 0) : '0'
    },
    chairmanParsedConfig () {
      return normalizeChairmanChecklistConfig(this.cloneValue(this.chairmanForm))
    },
    chairmanFundingTypeOptions () {
      const config = this.chairmanParsedConfig
      if (!config) return []
      return (config.fundingTemplates || []).map((item) => ({
        value: item.fundingTypeKey,
        label: item.fundingTypeLabel
      }))
    },
    chairmanPreviewTemplate () {
      const config = this.chairmanParsedConfig
      if (!config) return null
      return (config.fundingTemplates || []).find((item) => item.fundingTypeKey === this.chairmanPreviewFundingType)
        || (config.fundingTemplates || [])[0]
        || null
    },
    chairmanSelectedFundingTemplateIndex () {
      const templates = (this.chairmanForm && this.chairmanForm.fundingTemplates) || []
      const matchedIndex = templates.findIndex((item) => item && item.fundingTypeKey === this.chairmanPreviewFundingType)
      return matchedIndex >= 0 ? matchedIndex : (templates.length > 0 ? 0 : -1)
    },
    chairmanSelectedFundingTemplate () {
      const templates = (this.chairmanForm && this.chairmanForm.fundingTemplates) || []
      return this.chairmanSelectedFundingTemplateIndex >= 0 ? templates[this.chairmanSelectedFundingTemplateIndex] : null
    },
    committeeParsedConfig () {
      return normalizeCommitteeRubricConfig(this.cloneValue(this.committeeForm))
    },
    committeeFundTypeOptions () {
      const config = this.committeeParsedConfig
      return config && Array.isArray(config.fundTypeOptions) ? config.fundTypeOptions : []
    },
    committeePreviewConfig () {
      return this.committeeParsedConfig
    },
    committeePreviewFundTypeLabel () {
      const matched = (this.committeeFundTypeOptions || []).find((option) => option && option.value === this.committeePreviewFundType)
      return matched ? matched.label : this.committeePreviewFundType
    },
    committeeSelectedFundTypeIndex () {
      const options = (this.committeeForm && this.committeeForm.fundTypeOptions) || []
      const matchedIndex = options.findIndex((option) => option && option.value === this.committeePreviewFundType)
      return matchedIndex >= 0 ? matchedIndex : (options.length > 0 ? 0 : -1)
    },
    committeeSelectedFundTypeOption () {
      const options = (this.committeeForm && this.committeeForm.fundTypeOptions) || []
      return this.committeeSelectedFundTypeIndex >= 0 ? options[this.committeeSelectedFundTypeIndex] : null
    }
  },
  mounted () {
    this.loadTemplates()
  },
  methods: {
    getSelectValue (val) {
      return val && val.target ? val.target.value : val
    },
    parseSettingsPayload (response) {
      const payload = response && response.data && response.data.data
      if (Array.isArray(payload)) return payload
      if (payload && Array.isArray(payload.settings)) return payload.settings
      if (Array.isArray(response && response.data)) return response.data
      return []
    },
    parseSettingValue (setting, fallbackValue) {
      if (!setting || setting.value === undefined || setting.value === null || setting.value === '') return fallbackValue
      if (typeof setting.value === 'string') {
        try {
          return JSON.parse(setting.value)
        } catch (_) {
          return fallbackValue
        }
      }
      return setting.value
    },
    cloneValue (value) {
      return JSON.parse(JSON.stringify(value))
    },
    normalizeChairmanSectionItems (section) {
      const targetSection = section && typeof section === 'object' ? section : null
      if (!targetSection) return targetSection
      const items = Array.isArray(targetSection.items) ? targetSection.items : []
      targetSection.items = items.map((item, index) => ({
        ...(item || {}),
        itemKey: `item_${index + 1}`,
        label: item && item.label ? item.label : '',
        description: item && item.description ? item.description : ''
      }))
      return targetSection
    },
    normalizeChairmanFundingTemplateItems (template) {
      const targetTemplate = template && typeof template === 'object' ? template : null
      if (!targetTemplate) return targetTemplate
      const sections = Array.isArray(targetTemplate.sections) ? targetTemplate.sections : []
      targetTemplate.sections = sections.map((section, index) => {
        const normalizedSection = this.normalizeChairmanSectionItems(section)
        normalizedSection.sectionKey = `section_${index + 1}`
        normalizedSection.sectionLabel = normalizedSection.sectionLabel || ''
        normalizedSection.description = normalizedSection.description || ''
        return normalizedSection
      })
      return targetTemplate
    },
    normalizeChairmanEditorForm (form) {
      const nextForm = this.cloneValue(form || getDefaultChairmanChecklistConfig())
      const templates = Array.isArray(nextForm.fundingTemplates) ? nextForm.fundingTemplates : []
      nextForm.fundingTemplates = templates.map((template, index) => {
        const normalizedTemplate = this.normalizeChairmanFundingTemplateItems(template)
        normalizedTemplate.fundingTypeKey = `funding_${index + 1}`
        normalizedTemplate.fundingTypeLabel = normalizedTemplate.fundingTypeLabel || ''
        return normalizedTemplate
      })
      return nextForm
    },
    resetTemplateImportDefaults () {
      const firstFundingTemplate = this.chairmanParsedConfig && this.chairmanParsedConfig.fundingTemplates && this.chairmanParsedConfig.fundingTemplates[0]
      this.templateImport.fundingTypeKey = firstFundingTemplate ? firstFundingTemplate.fundingTypeKey : 'new-researcher'
      this.templateImport.fundingTypeLabel = firstFundingTemplate ? firstFundingTemplate.fundingTypeLabel : this.$t('reviewTemplate.chairman.defaultFundingTypeLabel')
    },
    handleImportTargetChange (targetType) {
      this.templateImport.targetType = targetType === 'committee' ? 'committee' : 'chairman'
      this.templateImport.preview = null
      this.templateImport.error = ''
      if (this.templateImport.targetType === 'chairman') {
        this.resetTemplateImportDefaults()
      }
    },
    handleTemplateImportFileChange (event) {
      const files = event && event.target && event.target.files ? event.target.files : []
      const nextFile = files && files[0] ? files[0] : null
      this.templateImport.file = nextFile
      this.templateImport.fileName = nextFile ? nextFile.name : ''
      this.templateImport.preview = null
      this.templateImport.error = ''
    },
    clearTemplateImportState () {
      this.templateImport.file = null
      this.templateImport.fileName = ''
      this.templateImport.preview = null
      this.templateImport.error = ''
      this.templateImport.applying = false
    },
    buildTemplateImportFormData () {
      const formData = new FormData()
      formData.append('file', this.templateImport.file)
      formData.append('targetType', this.templateImport.targetType)
      if (this.templateImport.targetType === 'chairman') {
        formData.append('fundingTypeKey', String(this.templateImport.fundingTypeKey || '').trim())
        formData.append('fundingTypeLabel', String(this.templateImport.fundingTypeLabel || '').trim())
      } else {
        formData.append('fundTypeOptions', JSON.stringify(this.committeeFundTypeOptions || []))
        formData.append('scoreOptions', JSON.stringify((this.committeeParsedConfig && this.committeeParsedConfig.scoreOptions) || [0, 1, 2]))
      }
      return formData
    },
    async previewTemplateImport () {
      this.templateImport.error = ''
      try {
        const response = await axios.post('/api/v1/setting/template-import/preview', this.buildTemplateImportFormData(), {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        this.templateImport.preview = response && response.data ? response.data.data : null
      } catch (error) {
        this.templateImport.preview = null
        this.templateImport.error = (error && error.response && error.response.data && error.response.data.message) || error.message || this.$t('reviewTemplate.import.previewError')
      }
    },
    applyImportedDraftToForm () {
      if (!this.templateImport.preview || !this.templateImport.preview.draftConfig) return
      if (this.templateImport.targetType === 'committee') {
        this.committeeForm = this.cloneValue(normalizeCommitteeRubricConfig(this.templateImport.preview.draftConfig))
        this.committeePreviewFundType = this.committeeForm && this.committeeForm.fundTypeOptions && this.committeeForm.fundTypeOptions[0]
          ? this.committeeForm.fundTypeOptions[0].value
          : 'new'
        return
      }

      this.chairmanForm = this.normalizeChairmanEditorForm(normalizeChairmanChecklistConfig(this.templateImport.preview.draftConfig))
      this.chairmanPreviewFundingType = this.templateImport.fundingTypeKey || (this.chairmanForm && this.chairmanForm.fundingTemplates && this.chairmanForm.fundingTemplates[0]
        ? this.chairmanForm.fundingTemplates[0].fundingTypeKey
        : 'new-researcher')
    },
    async approveImportedDraft () {
      if (!this.templateImport.preview || !this.templateImport.preview.draftConfig) return
      this.templateImport.error = ''
      this.templateImport.applying = true
      try {
        await axios.post('/api/v1/setting/template-import/apply', {
          targetType: this.templateImport.targetType,
          draftConfig: this.templateImport.preview.draftConfig
        })

        if (this.templateImport.targetType === 'committee') {
          setCommitteeRubricRuntimeConfig(this.templateImport.preview.draftConfig)
        } else {
          setChairmanChecklistRuntimeConfig(this.templateImport.preview.draftConfig)
        }

        this.applyImportedDraftToForm()
        await this.loadTemplates()
        this.clearTemplateImportState()
        await Swal.fire({ icon: 'success', title: this.$t('reviewTemplate.import.successMsg'), timer: 1400, showConfirmButton: false })
      } catch (error) {
        this.templateImport.error = (error && error.response && error.response.data && error.response.data.message) || error.message || this.$t('reviewTemplate.import.applyError')
      } finally {
        this.templateImport.applying = false
      }
    },
    async loadTemplates () {
      const response = await axios.get('/api/v1/setting')
      const settings = this.parseSettingsPayload(response)
      this.settingsMap = settings.reduce((result, item) => {
        if (item && item.key) result[item.key] = item
        return result
      }, {})

      const chairmanConfig = normalizeChairmanChecklistConfig(this.parseSettingValue(this.settingsMap[CHAIRMAN_CHECKLIST_SETTING_KEY], getDefaultChairmanChecklistConfig()))
      const committeeConfig = normalizeCommitteeRubricConfig(this.parseSettingValue(this.settingsMap[COMMITTEE_RUBRIC_SETTING_KEY], getDefaultCommitteeRubricConfig()))

      this.chairmanForm = this.normalizeChairmanEditorForm(chairmanConfig)
      this.committeeForm = this.cloneValue(committeeConfig)
      this.chairmanPreviewFundingType = chairmanConfig && chairmanConfig.fundingTemplates && chairmanConfig.fundingTemplates[0]
        ? chairmanConfig.fundingTemplates[0].fundingTypeKey
        : 'new-researcher'
      this.committeePreviewFundType = committeeConfig && committeeConfig.fundTypeOptions && committeeConfig.fundTypeOptions[0]
        ? committeeConfig.fundTypeOptions[0].value
        : 'new'
      this.resetTemplateImportDefaults()
    },
    async upsertSetting (key, value, description) {
      const existing = this.settingsMap[key]
      if (existing && existing._id) {
        await axios.put(`/api/v1/setting/${existing._id}`, {
          value,
          description,
          group: RESEARCH_FORM_GROUP
        })
        return
      }

      await axios.post('/api/v1/setting', {
        key,
        value,
        description,
        group: RESEARCH_FORM_GROUP
      })
    },
    createChairmanFundingTemplate () {
      return {
        fundingTypeKey: 'funding_1',
        fundingTypeLabel: this.$t('reviewTemplate.chairman.newFundingTypeLabel'),
        sections: []
      }
    },
    createChairmanSection () {
      return {
        sectionKey: 'section_1',
        sectionLabel: this.$t('reviewTemplate.chairman.newSectionLabel'),
        description: '',
        items: []
      }
    },
    createChairmanItem (section) {
      const nextIndex = Array.isArray(section && section.items) ? section.items.length + 1 : 1
      return {
        itemKey: `item_${nextIndex}`,
        label: '',
        description: ''
      }
    },
    addChairmanFundingTemplate () {
      const nextTemplate = this.createChairmanFundingTemplate()
      this.chairmanForm.fundingTemplates.push(nextTemplate)
      this.chairmanPreviewFundingType = nextTemplate.fundingTypeKey
    },
    removeChairmanFundingTemplate (fundingIndex) {
      const removed = this.chairmanForm.fundingTemplates.splice(fundingIndex, 1)
      const removedKey = removed && removed[0] ? removed[0].fundingTypeKey : ''
      if (removedKey && removedKey === this.chairmanPreviewFundingType) {
        const nextTemplate = this.chairmanForm.fundingTemplates[fundingIndex] || this.chairmanForm.fundingTemplates[fundingIndex - 1] || this.chairmanForm.fundingTemplates[0] || null
        this.chairmanPreviewFundingType = nextTemplate ? nextTemplate.fundingTypeKey : ''
      }
    },
    addChairmanSection (fundingIndex) {
      const template = this.chairmanForm.fundingTemplates[fundingIndex]
      template.sections.push(this.createChairmanSection())
      this.normalizeChairmanFundingTemplateItems(template)
    },
    removeChairmanSection (fundingIndex, sectionIndex) {
      const template = this.chairmanForm.fundingTemplates[fundingIndex]
      template.sections.splice(sectionIndex, 1)
      this.normalizeChairmanFundingTemplateItems(template)
    },
    addChairmanItem (fundingIndex, sectionIndex) {
      const section = this.chairmanForm.fundingTemplates[fundingIndex].sections[sectionIndex]
      section.items.push(this.createChairmanItem(section))
      this.normalizeChairmanSectionItems(section)
    },
    removeChairmanItem (fundingIndex, sectionIndex, itemIndex) {
      const section = this.chairmanForm.fundingTemplates[fundingIndex].sections[sectionIndex]
      section.items.splice(itemIndex, 1)
      this.normalizeChairmanSectionItems(section)
    },
    resetChairmanTemplate () {
      const config = getDefaultChairmanChecklistConfig()
      this.chairmanTemplateError = ''
      this.chairmanForm = this.normalizeChairmanEditorForm(config)
      this.chairmanPreviewFundingType = config && config.fundingTemplates && config.fundingTemplates[0]
        ? config.fundingTemplates[0].fundingTypeKey
        : 'new-researcher'
    },
    async saveChairmanTemplate () {
      const parsed = normalizeChairmanChecklistConfig(this.normalizeChairmanEditorForm(this.chairmanForm))
      this.chairmanTemplateError = ''
      try {
        await this.upsertSetting(CHAIRMAN_CHECKLIST_SETTING_KEY, parsed, 'Chairman checklist templates for ResearchFormRS')
        setChairmanChecklistRuntimeConfig(parsed)
        this.chairmanForm = this.normalizeChairmanEditorForm(parsed)
        await this.loadTemplates()
        await Swal.fire({ icon: 'success', title: this.$t('reviewTemplate.chairman.saveSuccess'), timer: 1400, showConfirmButton: false })
      } catch (error) {
        this.chairmanTemplateError = (error && error.response && error.response.data && error.response.data.message) || error.message || this.$t('reviewTemplate.chairman.saveError')
      }
    },
    createCommitteeFundTypeOption () {
      return {
        value: `fund_${Date.now()}`,
        label: this.$t('reviewTemplate.committee.newFundTypeLabel')
      }
    },
    createCommitteeRubricRow () {
      const weights = (this.committeeForm.fundTypeOptions || []).reduce((result, fundType) => {
        result[fundType.value] = null
        return result
      }, {})
      return {
        no: (this.committeeForm.rubricRows || []).length + 1,
        title: this.$t('reviewTemplate.committee.newRowTitle'),
        desc: '0–2',
        weights
      }
    },
    addCommitteeFundTypeOption () {
      const nextOption = this.createCommitteeFundTypeOption()
      this.committeeForm.fundTypeOptions.push(nextOption)
      this.committeeForm.rubricRows.forEach((row) => {
        this.$set(row.weights, nextOption.value, null)
      })
      this.committeePreviewFundType = nextOption.value
    },
    removeCommitteeFundTypeOption (fundTypeIndex) {
      const removed = this.committeeForm.fundTypeOptions.splice(fundTypeIndex, 1)
      const removedKey = removed && removed[0] ? removed[0].value : ''
      if (removedKey) {
        this.committeeForm.rubricRows.forEach((row) => {
          if (row && row.weights && Object.prototype.hasOwnProperty.call(row.weights, removedKey)) {
            this.$delete(row.weights, removedKey)
          }
        })
        if (removedKey === this.committeePreviewFundType) {
          const nextOption = this.committeeForm.fundTypeOptions[fundTypeIndex] || this.committeeForm.fundTypeOptions[fundTypeIndex - 1] || this.committeeForm.fundTypeOptions[0] || null
          this.committeePreviewFundType = nextOption ? nextOption.value : ''
        }
      }
    },
    addCommitteeRubricRow () {
      this.committeeForm.rubricRows.push(this.createCommitteeRubricRow())
    },
    removeCommitteeRubricRow (rowIndex) {
      this.committeeForm.rubricRows.splice(rowIndex, 1)
    },
    updateCommitteeWeight (rowIndex, fundTypeKey, val) {
      const value = val && val.target ? val.target.value : val
      const normalizedValue = value === '' || value === null || value === undefined ? null : Number(value)
      this.$set(this.committeeForm.rubricRows[rowIndex].weights, fundTypeKey, Number.isFinite(normalizedValue) ? normalizedValue : null)
    },
    resetCommitteeTemplate () {
      const config = getDefaultCommitteeRubricConfig()
      this.committeeTemplateError = ''
      this.committeeForm = this.cloneValue(config)
      this.committeePreviewFundType = config && config.fundTypeOptions && config.fundTypeOptions[0]
        ? config.fundTypeOptions[0].value
        : 'new'
    },
    async saveCommitteeTemplate () {
      const parsed = normalizeCommitteeRubricConfig(this.cloneValue(this.committeeForm))
      this.committeeTemplateError = ''
      try {
        await this.upsertSetting(COMMITTEE_RUBRIC_SETTING_KEY, parsed, 'Committee rubric templates for ResearchFormRS')
        setCommitteeRubricRuntimeConfig(parsed)
        this.committeeForm = this.cloneValue(parsed)
        await this.loadTemplates()
        await Swal.fire({ icon: 'success', title: this.$t('reviewTemplate.committee.saveSuccess'), timer: 1400, showConfirmButton: false })
      } catch (error) {
        this.committeeTemplateError = (error && error.response && error.response.data && error.response.data.message) || error.message || this.$t('reviewTemplate.committee.saveError')
      }
    },
    formatCommitteeWeight (row) {
      if (!row || !row.weights) return '-'
      const value = row.weights[this.committeePreviewFundType]
      return value === null || value === undefined || value === '' ? '-' : String(value)
    }
  }
}
</script>

<style scoped>
.template-toolbar {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
}

.template-toolbar__select {
  min-width: 280px;
  margin-bottom: 0;
}

.template-toolbar__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.template-import-file {
  min-width: 320px;
  flex: 1 1 320px;
}

.template-pane-context {
  min-width: 220px;
}

.template-pane-context__label {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.2;
}

.template-pane-context__value {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  color: #3f0d12;
}

.template-two-pane__preview {
  height: 100%;
}

.template-two-pane__editor {
  min-width: 0;
}

.template-two-pane__editor-scroll {
  min-width: 0;
}

.template-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.template-section-header--inner {
  margin-top: 12px;
}

.template-section-title {
  font-weight: 700;
}

.editor-card {
  border: 1px solid rgba(140, 21, 21, 0.14);
  border-radius: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.7);
}

.editor-card--nested {
  background: rgba(248, 250, 252, 0.95);
}

.editor-card--subnested {
  background: #ffffff;
}

.editor-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.editor-card__title {
  font-weight: 700;
}

.weights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.template-preview {
  border: 1px solid rgba(140, 21, 21, 0.14);
  border-radius: 12px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.72);
}

.template-preview--sticky {
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 160px);
  overflow: auto;
}

.template-preview--with-select-gap {
  margin-top: 18px;
}

@media (min-width: 992px) {
  .template-two-pane__editor {
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 16px;
    max-height: calc(100vh - 160px);
  }

  .template-two-pane__editor-scroll {
    overflow: auto;
    padding-right: 6px;
  }
}

.template-preview__title {
  font-weight: 700;
  margin-bottom: 4px;
}

.template-preview__block + .template-preview__block {
  margin-top: 10px;
}

.template-preview__list {
  padding-left: 20px;
}

.import-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.import-summary-grid__item {
  border: 1px solid rgba(140, 21, 21, 0.12);
  border-radius: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.82);
}

.import-summary-grid__label {
  font-size: 12px;
  color: #6b7280;
}

.import-summary-grid__value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  margin-top: 2px;
}
</style>