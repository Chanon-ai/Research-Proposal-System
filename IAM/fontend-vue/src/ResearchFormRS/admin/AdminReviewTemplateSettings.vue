<template>
  <div class="review-template-settings">
    <CAlert show color="info" class="mt-3">
      ใช้หน้านี้แก้ไข template สำหรับ checklist ของประธาน และ rubric การประเมินของคณะกรรมการ โดยจะบันทึกเป็น setting ของระบบเพื่อให้หน้า review ใช้งานชุดข้อมูลเดียวกัน
    </CAlert>

    <CCard class="mt-3">
      <CCardHeader>Template Checklist ของประธาน</CCardHeader>
      <CCardBody>
        <div class="template-toolbar mb-3">
          <CSelect
            class="template-toolbar__select"
            label="Preview ตามประเภททุน"
            :value="chairmanPreviewFundingType"
            :options="chairmanFundingTypeOptions"
            @change="chairmanPreviewFundingType = getSelectValue($event)"
          />
          <div class="template-toolbar__actions">
            <CButton size="sm" color="secondary" variant="outline" @click="formatChairmanTemplate">จัดรูปแบบ JSON</CButton>
            <CButton size="sm" color="warning" variant="outline" @click="resetChairmanTemplate">รีเซ็ตค่าเริ่มต้น</CButton>
            <CButton size="sm" color="primary" @click="saveChairmanTemplate">บันทึก Template ประธาน</CButton>
          </div>
        </div>

        <textarea v-model="chairmanTemplateText" class="form-control template-editor" rows="18" spellcheck="false" />
        <div v-if="chairmanTemplateError" class="text-danger small mt-2">{{ chairmanTemplateError }}</div>

        <div v-if="chairmanPreviewTemplate" class="template-preview mt-3">
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
      </CCardBody>
    </CCard>

    <CCard class="mt-3">
      <CCardHeader>Template Rubric ของคณะกรรมการ</CCardHeader>
      <CCardBody>
        <div class="template-toolbar mb-3">
          <CSelect
            class="template-toolbar__select"
            label="Preview น้ำหนักคะแนนตามประเภททุน"
            :value="committeePreviewFundType"
            :options="committeeFundTypeOptions"
            @change="committeePreviewFundType = getSelectValue($event)"
          />
          <div class="template-toolbar__actions">
            <CButton size="sm" color="secondary" variant="outline" @click="formatCommitteeTemplate">จัดรูปแบบ JSON</CButton>
            <CButton size="sm" color="warning" variant="outline" @click="resetCommitteeTemplate">รีเซ็ตค่าเริ่มต้น</CButton>
            <CButton size="sm" color="primary" @click="saveCommitteeTemplate">บันทึก Template กรรมการ</CButton>
          </div>
        </div>

        <textarea v-model="committeeTemplateText" class="form-control template-editor" rows="18" spellcheck="false" />
        <div v-if="committeeTemplateError" class="text-danger small mt-2">{{ committeeTemplateError }}</div>

        <div v-if="committeePreviewConfig" class="template-preview mt-3">
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
      chairmanTemplateText: '',
      committeeTemplateText: '',
      chairmanTemplateError: '',
      committeeTemplateError: '',
      chairmanPreviewFundingType: 'new-researcher',
      committeePreviewFundType: 'new'
    }
  },
  computed: {
    chairmanParsedConfig () {
      return this.parseTemplateText(this.chairmanTemplateText, normalizeChairmanChecklistConfig)
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
    committeeParsedConfig () {
      return this.parseTemplateText(this.committeeTemplateText, normalizeCommitteeRubricConfig)
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
    parseTemplateText (text, normalizeFn) {
      try {
        return normalizeFn(JSON.parse(String(text || '{}')))
      } catch (_) {
        return null
      }
    },
    prettify (value) {
      return JSON.stringify(value, null, 2)
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

      this.chairmanTemplateText = this.prettify(chairmanConfig)
      this.committeeTemplateText = this.prettify(committeeConfig)
      this.chairmanPreviewFundingType = chairmanConfig && chairmanConfig.fundingTemplates && chairmanConfig.fundingTemplates[0]
        ? chairmanConfig.fundingTemplates[0].fundingTypeKey
        : 'new-researcher'
      this.committeePreviewFundType = committeeConfig && committeeConfig.fundTypeOptions && committeeConfig.fundTypeOptions[0]
        ? committeeConfig.fundTypeOptions[0].value
        : 'new'
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
    formatChairmanTemplate () {
      const parsed = this.parseTemplateText(this.chairmanTemplateText, normalizeChairmanChecklistConfig)
      if (!parsed) {
        this.chairmanTemplateError = 'JSON ของ checklist ประธานไม่ถูกต้อง'
        return
      }
      this.chairmanTemplateError = ''
      this.chairmanTemplateText = this.prettify(parsed)
    },
    resetChairmanTemplate () {
      const config = getDefaultChairmanChecklistConfig()
      this.chairmanTemplateError = ''
      this.chairmanTemplateText = this.prettify(config)
      this.chairmanPreviewFundingType = config && config.fundingTemplates && config.fundingTemplates[0]
        ? config.fundingTemplates[0].fundingTypeKey
        : 'new-researcher'
    },
    async saveChairmanTemplate () {
      const parsed = this.parseTemplateText(this.chairmanTemplateText, normalizeChairmanChecklistConfig)
      if (!parsed) {
        this.chairmanTemplateError = 'JSON ของ checklist ประธานไม่ถูกต้อง'
        return
      }
      this.chairmanTemplateError = ''
      try {
        await this.upsertSetting(CHAIRMAN_CHECKLIST_SETTING_KEY, parsed, 'Chairman checklist templates for ResearchFormRS')
        setChairmanChecklistRuntimeConfig(parsed)
        this.chairmanTemplateText = this.prettify(parsed)
        await this.loadTemplates()
        await Swal.fire({ icon: 'success', title: 'บันทึก template ประธานสำเร็จ', timer: 1400, showConfirmButton: false })
      } catch (error) {
        this.chairmanTemplateError = (error && error.response && error.response.data && error.response.data.message) || error.message || 'บันทึกไม่สำเร็จ'
      }
    },
    formatCommitteeTemplate () {
      const parsed = this.parseTemplateText(this.committeeTemplateText, normalizeCommitteeRubricConfig)
      if (!parsed) {
        this.committeeTemplateError = 'JSON ของ rubric กรรมการไม่ถูกต้อง'
        return
      }
      this.committeeTemplateError = ''
      this.committeeTemplateText = this.prettify(parsed)
    },
    resetCommitteeTemplate () {
      const config = getDefaultCommitteeRubricConfig()
      this.committeeTemplateError = ''
      this.committeeTemplateText = this.prettify(config)
      this.committeePreviewFundType = config && config.fundTypeOptions && config.fundTypeOptions[0]
        ? config.fundTypeOptions[0].value
        : 'new'
    },
    async saveCommitteeTemplate () {
      const parsed = this.parseTemplateText(this.committeeTemplateText, normalizeCommitteeRubricConfig)
      if (!parsed) {
        this.committeeTemplateError = 'JSON ของ rubric กรรมการไม่ถูกต้อง'
        return
      }
      this.committeeTemplateError = ''
      try {
        await this.upsertSetting(COMMITTEE_RUBRIC_SETTING_KEY, parsed, 'Committee rubric templates for ResearchFormRS')
        setCommitteeRubricRuntimeConfig(parsed)
        this.committeeTemplateText = this.prettify(parsed)
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

.template-editor {
  min-height: 360px;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13px;
}

.template-preview {
  border: 1px solid rgba(140, 21, 21, 0.14);
  border-radius: 12px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.72);
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
</style>