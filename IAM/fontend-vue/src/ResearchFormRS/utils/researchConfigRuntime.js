import { instance as axios } from '@/service/api'
import { setProposalWorkflowRuntimeConfig } from '@/ResearchFormRS/constants/proposalWorkflow'
import { setCommitteeFeedbackRuntimeConfig } from '@/ResearchFormRS/constants/committeeFeedback'
import { setOfficeChairmanChecklistRuntimeConfig } from '@/ResearchFormRS/constants/officeChairmanChecklist'
import { setResearchStandardRuntimeConfig } from '@/ResearchFormRS/constants/researchStandard'

const RESEARCH_CONFIG_CACHE_TTL_MS = 60 * 1000
const PROPOSAL_WORKFLOW_SETTING_KEY = 'proposal_workflow_config_json'
const COMMITTEE_FEEDBACK_SETTING_KEY = 'committee_feedback_config_json'
const OFFICE_CHAIRMAN_CHECKLIST_SETTING_KEY = 'office_chairman_checklist_config_json'
const RESEARCH_STANDARD_SETTING_KEY = 'research_standard_config_json'

let cachedAt = 0
let pendingRequest = null

const parseSettingsPayload = (response) => {
  const payload = response && response.data && response.data.data
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.settings)) return payload.settings
  if (Array.isArray(response && response.data)) return response.data
  return []
}

const parseSettingValue = (setting) => {
  if (!setting || setting.value === undefined || setting.value === null || setting.value === '') return null
  if (typeof setting.value === 'string') {
    try {
      return JSON.parse(setting.value)
    } catch (_) {
      return null
    }
  }
  return setting.value
}

export const clearResearchFormRuntimeConfigCache = () => {
  cachedAt = 0
  pendingRequest = null
}

export const loadResearchFormRuntimeConfigs = async ({ force = false } = {}) => {
  const now = Date.now()
  if (!force && cachedAt > 0 && (now - cachedAt) < RESEARCH_CONFIG_CACHE_TTL_MS) {
    return { loaded: true, source: 'cache' }
  }

  if (pendingRequest && !force) return pendingRequest

  pendingRequest = (async () => {
    try {
      const response = await axios.get('/api/v1/setting')
      const settings = parseSettingsPayload(response)
      const workflowSetting = settings.find(item => item && item.key === PROPOSAL_WORKFLOW_SETTING_KEY)
      const committeeFeedbackSetting = settings.find(item => item && item.key === COMMITTEE_FEEDBACK_SETTING_KEY)
      const officeChairmanChecklistSetting = settings.find(item => item && item.key === OFFICE_CHAIRMAN_CHECKLIST_SETTING_KEY)
      const researchStandardSetting = settings.find(item => item && item.key === RESEARCH_STANDARD_SETTING_KEY)

      const workflowValue = parseSettingValue(workflowSetting)
      const committeeFeedbackValue = parseSettingValue(committeeFeedbackSetting)
      const officeChairmanChecklistValue = parseSettingValue(officeChairmanChecklistSetting)
      const researchStandardValue = parseSettingValue(researchStandardSetting)

      if (workflowValue) setProposalWorkflowRuntimeConfig(workflowValue)
      if (committeeFeedbackValue) setCommitteeFeedbackRuntimeConfig(committeeFeedbackValue)
      if (officeChairmanChecklistValue) setOfficeChairmanChecklistRuntimeConfig(officeChairmanChecklistValue)
      if (researchStandardValue) setResearchStandardRuntimeConfig(researchStandardValue)

      cachedAt = Date.now()
      return { loaded: true, source: 'api' }
    } catch (error) {
      return { loaded: false, source: 'fallback', error }
    } finally {
      pendingRequest = null
    }
  })()

  return pendingRequest
}