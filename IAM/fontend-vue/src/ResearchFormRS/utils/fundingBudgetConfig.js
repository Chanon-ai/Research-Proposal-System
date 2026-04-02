export const FUNDING_BUDGET_SETTING_KEY = 'funding_budget_config_json'
export const FUNDING_BUDGET_LOCAL_FALLBACK_KEY = 'admin_funding_budget_settings_fallback_v1'

export const DEFAULT_FUNDING_BUDGET_CONFIG = Object.freeze([
  {
    key: 'new-researcher',
    label: 'ทุนนักวิจัยรุ่นใหม่',
    budgetLimit: 100000,
    subOptions: [
      { key: 'qualification-alignment', label: 'สอดคล้องกับคุณวุฒิ/สาขาวิชา/ภาระงาน', budgetLimit: null }
    ]
  },
  {
    key: 'researcher-development',
    label: 'ทุนพัฒนานักวิจัย',
    budgetLimit: 200000,
    subOptions: [
      { key: 'economic-development', label: 'เศรษฐกิจสร้างสรรค์และการแข่งขัน', budgetLimit: null },
      { key: 'social-environment', label: 'สังคมและสิ่งแวดล้อม', budgetLimit: null },
      { key: 'science-technology', label: 'วิทยาศาสตร์ เทคโนโลยี และนวัตกรรม', budgetLimit: null },
      { key: 'human-resources', label: 'กำลังคนและสถาบันวิจัย', budgetLimit: null }
    ]
  },
  {
    key: 'strategic-research',
    label: 'ทุนวิจัยที่สอดคล้องกับยุทธศาสตร์',
    budgetLimit: 300000,
    subOptions: []
  },
  {
    key: 'industry-extension',
    label: 'ทุนต่อยอดสู่ภาคอุตสาหกรรม',
    budgetLimit: 300000,
    subOptions: [
      { key: 'competitiveness', label: 'การเพิ่มขีดความสามารถการแข่งขัน', budgetLimit: null }
    ]
  }
])

export const DEFAULT_SUBTYPE_REQUIRED_FUNDING_KEYS = Object.freeze([
  'new-researcher',
  'researcher-development',
  'industry-extension'
])

export const createDefaultFundingBudgetConfig = () => (
  JSON.parse(JSON.stringify(DEFAULT_FUNDING_BUDGET_CONFIG))
)

export const normalizeFundingBudgetKey = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9\s_-]/g, '')
  .replace(/[\s_]+/g, '-')
  .replace(/-+/g, '-')

export const toBudgetLimitNumber = (value, fallback = 0) => {
  if (value === '' || value === undefined || value === null) return fallback
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.max(0, numeric)
}

export const toOptionalBudgetLimitNumber = (value) => {
  if (value === '' || value === undefined || value === null) return null
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return null
  return Math.max(0, numeric)
}

export const normalizeFundingBudgetConfig = (rawConfig, { fallbackToDefault = true } = {}) => {
  const source = Array.isArray(rawConfig) ? rawConfig : []
  const normalized = source.map(type => {
    const subOptions = Array.isArray(type && type.subOptions) ? type.subOptions : []
    return {
      key: normalizeFundingBudgetKey(type && (type.key !== undefined ? type.key : type.value)),
      label: String(type && (type.label !== undefined ? type.label : (type.shortName !== undefined ? type.shortName : type.name)) || '').trim(),
      budgetLimit: toBudgetLimitNumber(type && type.budgetLimit, 0),
      subOptions: subOptions.map(subOption => ({
        key: normalizeFundingBudgetKey(subOption && (subOption.key !== undefined ? subOption.key : subOption.value)),
        label: String(subOption && (subOption.label !== undefined ? subOption.label : (subOption.shortName !== undefined ? subOption.shortName : subOption.name)) || '').trim(),
        budgetLimit: toOptionalBudgetLimitNumber(subOption && subOption.budgetLimit)
      })).filter(subOption => subOption.key || subOption.label)
    }
  }).filter(type => type.key || type.label)

  if (!normalized.length && fallbackToDefault) return createDefaultFundingBudgetConfig()
  return normalized
}

export const parseFundingBudgetSettingValue = (settingValue, { fallbackToDefault = true } = {}) => {
  if (settingValue === undefined || settingValue === null || settingValue === '') {
    return fallbackToDefault ? createDefaultFundingBudgetConfig() : []
  }

  try {
    const parsed = typeof settingValue === 'string'
      ? JSON.parse(settingValue)
      : settingValue
    return normalizeFundingBudgetConfig(parsed, { fallbackToDefault })
  } catch (_) {
    return fallbackToDefault ? createDefaultFundingBudgetConfig() : []
  }
}

export const sanitizeFundingBudgetConfigForSave = (rawConfig) => {
  const normalized = normalizeFundingBudgetConfig(rawConfig, { fallbackToDefault: false })
  return normalized.map(type => ({
    key: normalizeFundingBudgetKey(type.key),
    label: String(type.label || '').trim(),
    budgetLimit: toBudgetLimitNumber(type.budgetLimit, 0),
    subOptions: (Array.isArray(type.subOptions) ? type.subOptions : []).map(subOption => ({
      key: normalizeFundingBudgetKey(subOption.key),
      label: String(subOption.label || '').trim(),
      budgetLimit: toOptionalBudgetLimitNumber(subOption.budgetLimit)
    })).filter(subOption => subOption.key || subOption.label)
  })).filter(type => type.key || type.label)
}

export const findFundingTypeConfig = (config, fundingType) => {
  const key = normalizeFundingBudgetKey(fundingType)
  if (!key) return null
  const list = normalizeFundingBudgetConfig(config, { fallbackToDefault: false })
  return list.find(item => item && item.key === key) || null
}

export const findFundingSubTypeConfig = (config, fundingType, fundingSubType) => {
  const type = findFundingTypeConfig(config, fundingType)
  if (!type || !Array.isArray(type.subOptions)) return null
  const subTypeKey = normalizeFundingBudgetKey(fundingSubType)
  if (!subTypeKey) return null
  return type.subOptions.find(item => item && item.key === subTypeKey) || null
}

export const getFundingTypeBudgetLimit = (config, fundingType) => {
  const type = findFundingTypeConfig(config, fundingType)
  return toBudgetLimitNumber(type && type.budgetLimit, 0)
}

export const getFundingTypeLabel = (config, fundingType, fallback = '') => {
  const type = findFundingTypeConfig(config, fundingType)
  if (!type) return fallback
  return String(type.label || '').trim() || fallback
}

export const getFundingSubTypeBudgetLimit = (config, fundingType, fundingSubType) => {
  const subType = findFundingSubTypeConfig(config, fundingType, fundingSubType)
  return toOptionalBudgetLimitNumber(subType && subType.budgetLimit)
}

export const getFundingSubTypeLabel = (config, fundingType, fundingSubType, fallback = '') => {
  const subType = findFundingSubTypeConfig(config, fundingType, fundingSubType)
  if (!subType) return fallback
  return String(subType.label || '').trim() || fallback
}

export const shouldRequireFundingSubType = (config, fundingType) => {
  const fundingTypeKey = normalizeFundingBudgetKey(fundingType)
  if (!fundingTypeKey) return false

  const type = findFundingTypeConfig(config, fundingTypeKey)
  if (type) {
    return Array.isArray(type.subOptions) && type.subOptions.length > 0
  }

  return DEFAULT_SUBTYPE_REQUIRED_FUNDING_KEYS.includes(fundingTypeKey)
}

export const readFundingBudgetConfigFromFallbackStorage = () => {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(FUNDING_BUDGET_LOCAL_FALLBACK_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.fundingBudgetConfig)) return []
    return normalizeFundingBudgetConfig(parsed.fundingBudgetConfig, { fallbackToDefault: false })
  } catch (_) {
    return []
  }
}

export const writeFundingBudgetConfigToFallbackStorage = (config) => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(FUNDING_BUDGET_LOCAL_FALLBACK_KEY, JSON.stringify({
      fundingBudgetConfig: sanitizeFundingBudgetConfigForSave(config),
      savedAt: new Date().toISOString()
    }))
  } catch (_) {
    // Ignore localStorage write error.
  }
}
