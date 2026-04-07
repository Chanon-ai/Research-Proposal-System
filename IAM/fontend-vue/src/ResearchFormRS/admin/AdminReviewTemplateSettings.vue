<template>
  <div class="review-template-settings">
    <CAlert show color="info" class="mt-3">
      ใช้หน้านี้แก้ไข template สำหรับ checklist ของประธาน และ rubric การประเมินของคณะกรรมการ โดยจะบันทึกเป็น setting ของระบบเพื่อให้หน้า review ใช้งานชุดข้อมูลเดียวกัน
    </CAlert>

    <CCard class="mt-3">
      <CCardHeader>Import Template จาก PDF</CCardHeader>
      <CCardBody>
        <CRow>
          <CCol md="4">
            <CSelect
              label="ประเภท template ที่ต้องการ import"
              :value="templateImport.targetType"
              :options="templateImportTargetOptions"
              @change="handleImportTargetChange(getSelectValue($event))"
            />
          </CCol>
          <CCol v-if="templateImport.targetType === 'chairman'" md="4">
            <CInput label="Funding Type Key" v-model="templateImport.fundingTypeKey" />
          </CCol>
          <CCol v-if="templateImport.targetType === 'chairman'" md="4">
            <CInput label="Funding Type Label" v-model="templateImport.fundingTypeLabel" />
          </CCol>
        </CRow>

        <div class="template-toolbar mt-2">
          <div class="template-import-file">
            <label class="d-block font-weight-bold mb-1">ไฟล์ PDF</label>
            <input
              class="form-control"
              type="file"
              accept=".pdf,application/pdf"
              @change="handleTemplateImportFileChange"
            >
            <div v-if="templateImport.fileName" class="small text-muted mt-1">{{ templateImport.fileName }}</div>
          </div>
          <div class="template-toolbar__actions">
            <CButton size="sm" color="secondary" variant="outline" @click="clearTemplateImportState">ล้าง Preview</CButton>
            <CButton size="sm" color="primary" :disabled="!canPreviewTemplateImport" @click="previewTemplateImport">Preview จาก PDF</CButton>
          </div>
        </div>

        <div v-if="templateImport.error" class="text-danger small mt-3">{{ templateImport.error }}</div>

        <div v-if="templateImport.preview" class="template-preview mt-3">
          <div class="template-preview__title">Preview ก่อนอนุมัติ</div>
          <div class="text-muted small mb-3">{{ templateImport.preview.fileName }} · {{ templateImportTargetLabel }}</div>

          <div class="import-summary-grid">
            <div class="import-summary-grid__item">
              <div class="import-summary-grid__label">Sections / Rows</div>
              <div class="import-summary-grid__value">{{ importSummaryPrimaryValue }}</div>
            </div>
            <div class="import-summary-grid__item">
              <div class="import-summary-grid__label">Items / Fund Types</div>
              <div class="import-summary-grid__value">{{ importSummarySecondaryValue }}</div>
            </div>
            <div class="import-summary-grid__item">
              <div class="import-summary-grid__label">Warnings</div>
              <div class="import-summary-grid__value">{{ importSummaryWarningCount }}</div>
            </div>
          </div>

          <div v-if="templateImport.preview.warnings && templateImport.preview.warnings.length" class="mt-3">
            <div class="font-weight-bold small mb-1">คำเตือนจาก parser</div>
            <ul class="template-preview__list mb-0">
              <li v-for="(warning, warningIndex) in templateImport.preview.warnings" :key="`warning-${warningIndex}`">{{ warning }}</li>
            </ul>
          </div>

          <CTextarea
            class="mt-3"
            label="ข้อความที่ parser อ่านได้จาก PDF (ตัวอย่าง)"
            rows="10"
            :value="templateImport.preview.extractedTextPreview"
            readonly
          />

          <div class="template-toolbar__actions mt-3">
            <CButton size="sm" color="info" variant="outline" @click="applyImportedDraftToForm">โหลด draft ลงแบบฟอร์มด้านล่าง</CButton>
            <CButton size="sm" color="success" :disabled="templateImport.applying" @click="approveImportedDraft">อนุมัติและบันทึกเข้าระบบ</CButton>
          </div>
        </div>
      </CCardBody>
    </CCard>

    <CCard class="mt-3">
      <CCardHeader>Template Checklist ของประธาน</CCardHeader>
      <CCardBody>
        <CRow class="template-two-pane">
          <CCol lg="4" class="mb-3 mb-lg-0">
            <div class="template-two-pane__preview">
              <CSelect
                class="template-toolbar__select"
                label="Preview ตามประเภททุน"
                :value="chairmanPreviewFundingType"
                :options="chairmanFundingTypeOptions"
                @change="chairmanPreviewFundingType = getSelectValue($event)"
              />

              <div v-if="chairmanPreviewTemplate" class="template-preview template-preview--sticky template-preview--with-select-gap">
                <div class="template-preview__title">ตัวอย่าง Checklist</div>
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
                  <div class="template-pane-context__label">กำลังแก้ไข</div>
                  <div class="template-pane-context__value">{{ chairmanSelectedFundingTemplate.fundingTypeLabel || chairmanSelectedFundingTemplate.fundingTypeKey }}</div>
                </div>
                <div class="template-toolbar__actions ml-auto">
                  <CButton size="sm" color="warning" variant="outline" @click="resetChairmanTemplate">รีเซ็ตค่าเริ่มต้น</CButton>
                  <CButton size="sm" color="primary" @click="saveChairmanTemplate">บันทึก Template ประธาน</CButton>
                </div>
              </div>

              <div class="template-two-pane__editor-scroll">
                <CRow>
                  <CCol md="4"><CInput label="Version" type="number" v-model.number="chairmanForm.templateVersion" /></CCol>
                  <CCol md="4"><CInput label="Reviewer Role" v-model="chairmanForm.reviewerRole" /></CCol>
                  <CCol md="4"><CInput label="Reviewer Label" v-model="chairmanForm.reviewerLabel" /></CCol>
                </CRow>
                <CRow>
                  <CCol md="4"><CInput label="Import Status" v-model="chairmanForm.importStatus" /></CCol>
                  <CCol md="8"><CTextarea label="หมายเหตุ" rows="3" v-model="chairmanForm.note" /></CCol>
                </CRow>

                <div class="template-section-header mt-3">
                  <div>
                    <div class="template-section-title">Funding Templates</div>
                    <div class="text-muted small">จัดการ checklist แยกตามประเภททุน</div>
                  </div>
                  <CButton size="sm" color="success" variant="outline" @click="addChairmanFundingTemplate">เพิ่มประเภททุน</CButton>
                </div>

                <div v-if="chairmanSelectedFundingTemplate" class="editor-card mt-3">
                  <div class="editor-card__header">
                    <div class="editor-card__title">ประเภททุน {{ chairmanSelectedFundingTemplateIndex + 1 }}</div>
                    <CButton size="sm" color="danger" variant="outline" @click="removeChairmanFundingTemplate(chairmanSelectedFundingTemplateIndex)">ลบประเภททุน</CButton>
                  </div>
                  <CRow>
                    <CCol md="4"><CInput label="Funding Type Key" v-model="chairmanSelectedFundingTemplate.fundingTypeKey" /></CCol>
                    <CCol md="8"><CInput label="Funding Type Label" v-model="chairmanSelectedFundingTemplate.fundingTypeLabel" /></CCol>
                  </CRow>

                  <div class="template-section-header template-section-header--inner">
                    <div class="template-section-title">Sections</div>
                    <CButton size="sm" color="info" variant="outline" @click="addChairmanSection(chairmanSelectedFundingTemplateIndex)">เพิ่ม Section</CButton>
                  </div>

                  <div v-for="(section, sectionIndex) in chairmanSelectedFundingTemplate.sections" :key="`section-${chairmanSelectedFundingTemplateIndex}-${sectionIndex}`" class="editor-card editor-card--nested mt-2">
                    <div class="editor-card__header">
                      <div class="editor-card__title">Section {{ sectionIndex + 1 }}</div>
                      <CButton size="sm" color="danger" variant="outline" @click="removeChairmanSection(chairmanSelectedFundingTemplateIndex, sectionIndex)">ลบ Section</CButton>
                    </div>
                    <CRow>
                      <CCol md="4"><CInput label="Section Key" v-model="section.sectionKey" /></CCol>
                      <CCol md="8"><CInput label="Section Label" v-model="section.sectionLabel" /></CCol>
                    </CRow>
                    <CTextarea label="Section Description" rows="2" v-model="section.description" />

                    <div class="template-section-header template-section-header--inner">
                      <div class="template-section-title">Items</div>
                      <CButton size="sm" color="info" variant="outline" @click="addChairmanItem(chairmanSelectedFundingTemplateIndex, sectionIndex)">เพิ่ม Item</CButton>
                    </div>

                    <div v-for="(item, itemIndex) in section.items" :key="`item-${chairmanSelectedFundingTemplateIndex}-${sectionIndex}-${itemIndex}`" class="editor-card editor-card--subnested mt-2">
                      <div class="editor-card__header">
                        <div class="editor-card__title">Item {{ itemIndex + 1 }}</div>
                        <CButton size="sm" color="danger" variant="outline" @click="removeChairmanItem(chairmanSelectedFundingTemplateIndex, sectionIndex, itemIndex)">ลบ Item</CButton>
                      </div>
                      <CRow>
                        <CCol md="4"><CInput label="Item Key" v-model="item.itemKey" /></CCol>
                        <CCol md="8"><CInput label="Label" v-model="item.label" /></CCol>
                      </CRow>
                      <CTextarea label="Description" rows="2" v-model="item.description" />
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
      <CCardHeader>Template Rubric ของคณะกรรมการ</CCardHeader>
      <CCardBody>
        <CRow class="template-two-pane">
          <CCol lg="4" class="mb-3 mb-lg-0">
            <div class="template-two-pane__preview">
              <CSelect
                class="template-toolbar__select"
                label="Preview น้ำหนักคะแนนตามประเภททุน"
                :value="committeePreviewFundType"
                :options="committeeFundTypeOptions"
                @change="committeePreviewFundType = getSelectValue($event)"
              />

              <div v-if="committeePreviewConfig" class="template-preview template-preview--sticky template-preview--with-select-gap">
                <div class="template-preview__title">ตัวอย่าง Rubric</div>
                <div class="text-muted small mb-2">{{ committeePreviewFundTypeLabel }}</div>
                <div class="table-responsive">
                  <table class="table table-sm table-bordered mb-0">
                    <thead>
                      <tr>
                        <th style="width:64px;">ข้อ</th>
                        <th>หัวข้อ</th>
                        <th style="width:120px;">น้ำหนัก</th>
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
                  <div class="template-pane-context__label">กำลังแก้ไข</div>
                  <div class="template-pane-context__value">{{ committeeSelectedFundTypeOption.label || committeeSelectedFundTypeOption.value }}</div>
                </div>
                <div class="template-toolbar__actions ml-auto">
                  <CButton size="sm" color="warning" variant="outline" @click="resetCommitteeTemplate">รีเซ็ตค่าเริ่มต้น</CButton>
                  <CButton size="sm" color="primary" @click="saveCommitteeTemplate">บันทึก Template กรรมการ</CButton>
                </div>
              </div>

              <div class="template-two-pane__editor-scroll">
                <CRow>
                  <CCol md="4"><CInput label="Version" type="number" v-model.number="committeeForm.templateVersion" /></CCol>
                  <CCol md="4"><CInput label="Reviewer Role" v-model="committeeForm.reviewerRole" /></CCol>
                  <CCol md="4"><CInput label="Reviewer Label" v-model="committeeForm.reviewerLabel" /></CCol>
                </CRow>

                <div class="template-section-header mt-3">
                  <div>
                    <div class="template-section-title">ประเภททุนสำหรับ rubric</div>
                    <div class="text-muted small">กำหนด key ที่ใช้จับคู่กับน้ำหนักคะแนน</div>
                  </div>
                  <CButton size="sm" color="success" variant="outline" @click="addCommitteeFundTypeOption">เพิ่มประเภททุน</CButton>
                </div>

                <div v-if="committeeSelectedFundTypeOption" class="editor-card mt-2">
                  <div class="editor-card__header">
                    <div class="editor-card__title">ประเภททุน {{ committeeSelectedFundTypeIndex + 1 }}</div>
                    <CButton size="sm" color="danger" variant="outline" @click="removeCommitteeFundTypeOption(committeeSelectedFundTypeIndex)">ลบประเภททุน</CButton>
                  </div>
                  <CRow>
                    <CCol md="4"><CInput label="Value" v-model="committeeSelectedFundTypeOption.value" /></CCol>
                    <CCol md="8"><CInput label="Label" v-model="committeeSelectedFundTypeOption.label" /></CCol>
                  </CRow>
                </div>

                <div class="template-section-header mt-3">
                  <div>
                    <div class="template-section-title">Rubric Rows</div>
                    <div class="text-muted small">แก้หัวข้อประเมินและน้ำหนักคะแนนของแต่ละประเภททุน</div>
                  </div>
                  <CButton size="sm" color="success" variant="outline" @click="addCommitteeRubricRow">เพิ่มหัวข้อ</CButton>
                </div>

                <div v-for="(row, rowIndex) in committeeForm.rubricRows" :key="`committee-row-${rowIndex}`" class="editor-card mt-3">
                  <div class="editor-card__header">
                    <div class="editor-card__title">หัวข้อประเมิน {{ rowIndex + 1 }}</div>
                    <CButton size="sm" color="danger" variant="outline" @click="removeCommitteeRubricRow(rowIndex)">ลบหัวข้อ</CButton>
                  </div>

                  <CRow>
                    <CCol md="2"><CInput label="No" type="number" v-model.number="row.no" /></CCol>
                    <CCol md="6"><CInput label="Title" v-model="row.title" /></CCol>
                    <CCol md="4"><CInput label="Description" v-model="row.desc" /></CCol>
                  </CRow>

                  <div class="weights-grid">
                    <div v-if="committeeSelectedFundTypeOption" :key="`weight-${rowIndex}-${committeeSelectedFundTypeOption.value}`" class="weights-grid__item">
                      <CInput
                        :label="`น้ำหนัก: ${committeeSelectedFundTypeOption.label || committeeSelectedFundTypeOption.value}`"
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
        fundingTypeLabel: 'ทุนนักวิจัยรุ่นใหม่',
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
        { value: 'chairman', label: 'Chairman Checklist' },
        { value: 'committee', label: 'Committee Rubric' }
      ]
    },
    templateImportTargetLabel () {
      return this.templateImport.targetType === 'committee' ? 'Committee Rubric' : 'Chairman Checklist'
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
    resetTemplateImportDefaults () {
      const firstFundingTemplate = this.chairmanParsedConfig && this.chairmanParsedConfig.fundingTemplates && this.chairmanParsedConfig.fundingTemplates[0]
      this.templateImport.fundingTypeKey = firstFundingTemplate ? firstFundingTemplate.fundingTypeKey : 'new-researcher'
      this.templateImport.fundingTypeLabel = firstFundingTemplate ? firstFundingTemplate.fundingTypeLabel : 'ทุนนักวิจัยรุ่นใหม่'
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
        this.templateImport.error = (error && error.response && error.response.data && error.response.data.message) || error.message || 'Preview ไม่สำเร็จ'
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

      this.chairmanForm = this.cloneValue(normalizeChairmanChecklistConfig(this.templateImport.preview.draftConfig))
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
        await Swal.fire({ icon: 'success', title: 'นำเข้า template สำเร็จ', timer: 1400, showConfirmButton: false })
      } catch (error) {
        this.templateImport.error = (error && error.response && error.response.data && error.response.data.message) || error.message || 'บันทึก import ไม่สำเร็จ'
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

      this.chairmanForm = this.cloneValue(chairmanConfig)
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
        fundingTypeKey: `funding_${Date.now()}`,
        fundingTypeLabel: 'ประเภททุนใหม่',
        sections: []
      }
    },
    createChairmanSection () {
      return {
        sectionKey: `section_${Date.now()}`,
        sectionLabel: 'Section ใหม่',
        description: '',
        items: []
      }
    },
    createChairmanItem () {
      return {
        itemKey: `item_${Date.now()}`,
        label: 'รายการใหม่',
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
      this.chairmanForm.fundingTemplates[fundingIndex].sections.push(this.createChairmanSection())
    },
    removeChairmanSection (fundingIndex, sectionIndex) {
      this.chairmanForm.fundingTemplates[fundingIndex].sections.splice(sectionIndex, 1)
    },
    addChairmanItem (fundingIndex, sectionIndex) {
      this.chairmanForm.fundingTemplates[fundingIndex].sections[sectionIndex].items.push(this.createChairmanItem())
    },
    removeChairmanItem (fundingIndex, sectionIndex, itemIndex) {
      this.chairmanForm.fundingTemplates[fundingIndex].sections[sectionIndex].items.splice(itemIndex, 1)
    },
    resetChairmanTemplate () {
      const config = getDefaultChairmanChecklistConfig()
      this.chairmanTemplateError = ''
      this.chairmanForm = this.cloneValue(config)
      this.chairmanPreviewFundingType = config && config.fundingTemplates && config.fundingTemplates[0]
        ? config.fundingTemplates[0].fundingTypeKey
        : 'new-researcher'
    },
    async saveChairmanTemplate () {
      const parsed = normalizeChairmanChecklistConfig(this.cloneValue(this.chairmanForm))
      this.chairmanTemplateError = ''
      try {
        await this.upsertSetting(CHAIRMAN_CHECKLIST_SETTING_KEY, parsed, 'Chairman checklist templates for ResearchFormRS')
        setChairmanChecklistRuntimeConfig(parsed)
        this.chairmanForm = this.cloneValue(parsed)
        await this.loadTemplates()
        await Swal.fire({ icon: 'success', title: 'บันทึก template ประธานสำเร็จ', timer: 1400, showConfirmButton: false })
      } catch (error) {
        this.chairmanTemplateError = (error && error.response && error.response.data && error.response.data.message) || error.message || 'บันทึกไม่สำเร็จ'
      }
    },
    createCommitteeFundTypeOption () {
      return {
        value: `fund_${Date.now()}`,
        label: 'ประเภททุนใหม่'
      }
    },
    createCommitteeRubricRow () {
      const weights = (this.committeeForm.fundTypeOptions || []).reduce((result, fundType) => {
        result[fundType.value] = null
        return result
      }, {})
      return {
        no: (this.committeeForm.rubricRows || []).length + 1,
        title: 'หัวข้อใหม่',
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
        await Swal.fire({ icon: 'success', title: 'บันทึก template กรรมการสำเร็จ', timer: 1400, showConfirmButton: false })
      } catch (error) {
        this.committeeTemplateError = (error && error.response && error.response.data && error.response.data.message) || error.message || 'บันทึกไม่สำเร็จ'
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