import { instance as axios } from '@/service/api'
import {
  ROLE_PAGE_ACCESS_SETTING_KEY,
  createDefaultRolePageAccessConfig,
  parseRolePageAccessSettingValue,
  readRolePageAccessConfigFromFallbackStorage,
  writeRolePageAccessConfigToFallbackStorage
} from '@/ResearchFormRS/utils/rolePageAccessConfig'

const ROLE_PAGE_ACCESS_CACHE_TTL_MS = 60 * 1000

let cachedConfig = null
let cachedAt = 0
let pendingRequest = null

const parseSettingsPayload = (response) => {
  const payload = response && response.data && response.data.data
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.settings)) return payload.settings
  if (Array.isArray(response && response.data)) return response.data
  return []
}

export const mapRoleForResearchAccess = (role) => {
  const normalized = String(role || '').trim().toLowerCase().replace(/-/g, '_')
  if (normalized === 'legacy_admin') return 'admin'
  if (normalized === 'finance_office') return 'finance_officer'
  return normalized
}

export const clearRolePageAccessRuntimeCache = () => {
  cachedConfig = null
  cachedAt = 0
  pendingRequest = null
}

export const loadRolePageAccessRuntimeConfig = async ({ force = false } = {}) => {
  const now = Date.now()
  if (!force && Array.isArray(cachedConfig) && cachedConfig.length > 0 && (now - cachedAt) < ROLE_PAGE_ACCESS_CACHE_TTL_MS) {
    return cachedConfig
  }

  if (pendingRequest && !force) return pendingRequest

  pendingRequest = (async () => {
    try {
      const response = await axios.get('/api/v1/setting')
      const settings = parseSettingsPayload(response)
      const setting = settings.find(item => item && item.key === ROLE_PAGE_ACCESS_SETTING_KEY)
      const config = parseRolePageAccessSettingValue(setting ? setting.value : null, { fallbackToDefault: true })
      cachedConfig = config
      cachedAt = Date.now()
      writeRolePageAccessConfigToFallbackStorage(config)
      return config
    } catch (error) {
      const fallbackConfig = readRolePageAccessConfigFromFallbackStorage()
      cachedConfig = (Array.isArray(fallbackConfig) && fallbackConfig.length > 0)
        ? parseRolePageAccessSettingValue(fallbackConfig, { fallbackToDefault: true })
        : createDefaultRolePageAccessConfig()
      cachedAt = Date.now()
      return cachedConfig
    } finally {
      pendingRequest = null
    }
  })()

  return pendingRequest
}
