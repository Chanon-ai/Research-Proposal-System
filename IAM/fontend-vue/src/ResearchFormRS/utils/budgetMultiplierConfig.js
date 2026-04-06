import { normalizeFundingBudgetKey } from '@/ResearchFormRS/utils/fundingBudgetConfig'

export const BUDGET_MULTIPLIER_SETTING_KEY = 'budget_multiplier_config_json'
export const BUDGET_MULTIPLIER_LOCAL_FALLBACK_KEY = 'admin_budget_multiplier_settings_fallback_v1'

export const BUDGET_MULTIPLIER_CATEGORY_KEYS = Object.freeze({
  COMPENSATION: 'compensation',
  OPERATING: 'operating',
  TRAVEL: 'travel',
  MATERIAL: 'material',
  UTILITY: 'utility',
  EQUIPMENT: 'equipment',
  OTHER: 'other'
})

const CATEGORY_KEY_ORDER = Object.freeze([
  BUDGET_MULTIPLIER_CATEGORY_KEYS.COMPENSATION,
  BUDGET_MULTIPLIER_CATEGORY_KEYS.OPERATING,
  BUDGET_MULTIPLIER_CATEGORY_KEYS.TRAVEL,
  BUDGET_MULTIPLIER_CATEGORY_KEYS.MATERIAL,
  BUDGET_MULTIPLIER_CATEGORY_KEYS.UTILITY,
  BUDGET_MULTIPLIER_CATEGORY_KEYS.EQUIPMENT,
  BUDGET_MULTIPLIER_CATEGORY_KEYS.OTHER
])

const KNOWN_CATEGORY_KEY_SET = new Set(CATEGORY_KEY_ORDER)

export const DEFAULT_BUDGET_MULTIPLIER_CONFIG = Object.freeze([
  {
    categoryKey: BUDGET_MULTIPLIER_CATEGORY_KEYS.COMPENSATION,
    categoryLabel: 'หมวดค่าตอบแทน',
    multipliers: [
      { label: 'จำนวน (คน)', value: 1, maxValue: null, isAdmin: false },
      { label: 'จำนวน (ครั้ง/ด.)', value: 1, maxValue: null, isAdmin: false },
      { label: 'อัตรา (บาท)', value: 5000, maxValue: null, isAdmin: true }
    ]
  },
  {
    categoryKey: BUDGET_MULTIPLIER_CATEGORY_KEYS.OPERATING,
    categoryLabel: 'หมวดค่าใช้สอย',
    multipliers: [
      { label: 'จำนวน (คน/ชิ้น)', value: 1, maxValue: null, isAdmin: false },
      { label: 'จำนวน (วัน/ครั้ง)', value: 1, maxValue: null, isAdmin: false },
      { label: 'อัตรา (บาท)', value: 5000, maxValue: null, isAdmin: true }
    ]
  },
  {
    categoryKey: BUDGET_MULTIPLIER_CATEGORY_KEYS.TRAVEL,
    categoryLabel: 'หมวดค่าเดินทาง',
    multipliers: [
      { label: 'จำนวน (คน)', value: 1, maxValue: null, isAdmin: false },
      { label: 'จำนวน (วัน/เที่ยว)', value: 1, maxValue: null, isAdmin: false },
      { label: 'อัตรา (บาท)', value: 5000, maxValue: null, isAdmin: true }
    ]
  },
  {
    categoryKey: BUDGET_MULTIPLIER_CATEGORY_KEYS.MATERIAL,
    categoryLabel: 'หมวดค่าวัสดุ',
    multipliers: [
      { label: 'จำนวน', value: 1, maxValue: null, isAdmin: false },
      { label: 'ตัวคูณ (ถ้ามี)', value: 1, maxValue: null, isAdmin: false },
      { label: 'ราคา/หน่วย', value: 5000, maxValue: null, isAdmin: true }
    ]
  },
  {
    categoryKey: BUDGET_MULTIPLIER_CATEGORY_KEYS.UTILITY,
    categoryLabel: 'หมวดค่าสาธารณูปโภค',
    multipliers: [
      { label: 'จำนวน (เดือน)', value: 1, maxValue: null, isAdmin: false },
      { label: 'จำนวน (หน่วย)', value: 1, maxValue: null, isAdmin: false },
      { label: 'อัตรา (บาท)', value: 5000, maxValue: null, isAdmin: true }
    ]
  },
  {
    categoryKey: BUDGET_MULTIPLIER_CATEGORY_KEYS.EQUIPMENT,
    categoryLabel: 'หมวดครุภัณฑ์',
    multipliers: [
      { label: 'จำนวน (รายการ)', value: 1, maxValue: null, isAdmin: false },
      { label: 'ตัวคูณ (ถ้ามี)', value: 1, maxValue: null, isAdmin: false },
      { label: 'ราคา/ชุด', value: 5000, maxValue: null, isAdmin: true }
    ]
  },
  {
    categoryKey: BUDGET_MULTIPLIER_CATEGORY_KEYS.OTHER,
    categoryLabel: 'หมวดอื่นๆ',
    multipliers: [
      { label: 'จำนวน', value: 1, maxValue: null, isAdmin: false },
      { label: 'หน่วย', value: 1, maxValue: null, isAdmin: false },
      { label: 'ราคา/หน่วย', value: 0, maxValue: null, isAdmin: false }
    ]
  }
])

export const createDefaultBudgetMultiplierConfig = () => (
  JSON.parse(JSON.stringify(DEFAULT_BUDGET_MULTIPLIER_CONFIG))
)

export const toMultiplierNumber = (value, fallback = 0) => {
  if (value === '' || value === undefined || value === null) return fallback
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.max(0, numeric)
}

export const toMultiplierMaxNumber = (value, fallback = null) => {
  if (value === '' || value === undefined || value === null) return fallback
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.max(0, value) : fallback
  }

  const text = String(value || '').trim().replace(/,/g, '')
  if (!text) return fallback

  const normalizedPercentText = text.replace(/\s+/g, '')
  const percentMatch = normalizedPercentText.match(/^(\d+(?:\.\d+)?)%$/)
  if (percentMatch) {
    const percentValue = Number(percentMatch[1])
    if (!Number.isFinite(percentValue)) return fallback
    return `${Math.max(0, percentValue)}%`
  }

  const numeric = Number(text)
  if (!Number.isFinite(numeric)) return fallback
  return Math.max(0, numeric)
}

export const resolveMultiplierMaxNumber = (value, budgetLimit, fallback = null) => {
  const normalized = toMultiplierMaxNumber(value, null)
  if (normalized === null) return fallback
  if (typeof normalized === 'string' && normalized.endsWith('%')) {
    const numericBudgetLimit = Number(budgetLimit)
    if (!Number.isFinite(numericBudgetLimit) || numericBudgetLimit <= 0) return fallback
    const percentValue = Number(normalized.slice(0, -1))
    if (!Number.isFinite(percentValue)) return fallback
    return Math.max(0, Math.floor((numericBudgetLimit * percentValue) / 100))
  }
  return normalized
}

const normalizeCategoryKey = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/_/g, '-')
  return KNOWN_CATEGORY_KEY_SET.has(normalized) ? normalized : ''
}

const normalizeFundingTypeKeys = (value) => {
  const source = Array.isArray(value) ? value : []
  const seen = new Set()
  return source.reduce((result, item) => {
    const normalized = normalizeFundingBudgetKey(item)
    if (!normalized || seen.has(normalized)) return result
    seen.add(normalized)
    result.push(normalized)
    return result
  }, [])
}

const normalizeMultiplierEntry = (entry) => ({
  label: String(entry && entry.label !== undefined ? entry.label : '').trim(),
  value: toMultiplierNumber(entry && entry.value, 0),
  maxValue: toMultiplierMaxNumber(entry && entry.maxValue, null),
  isAdmin: Boolean(entry && entry.isAdmin)
})

const normalizeOverrideMatchText = (value) => String(value || '').trim()

const cloneMultipliers = (multipliers) => (
  (Array.isArray(multipliers) ? multipliers : []).map(multiplier => ({
    label: String(multiplier && multiplier.label !== undefined ? multiplier.label : '').trim(),
    value: toMultiplierNumber(multiplier && multiplier.value, 0),
    maxValue: toMultiplierMaxNumber(multiplier && multiplier.maxValue, null),
    isAdmin: Boolean(multiplier && multiplier.isAdmin)
  }))
)

const normalizeItemOverrideEntry = (entry) => ({
  matchText: normalizeOverrideMatchText(entry && entry.matchText),
  applyToAllFundingTypes: entry && entry.applyToAllFundingTypes !== undefined
    ? Boolean(entry.applyToAllFundingTypes)
    : true,
  fundingTypeKeys: normalizeFundingTypeKeys(entry && entry.fundingTypeKeys),
  multipliers: cloneMultipliers(entry && entry.multipliers).filter(multiplier => multiplier.label)
})

const cloneItemOverrides = (itemOverrides) => (
  (Array.isArray(itemOverrides) ? itemOverrides : []).map(itemOverride => ({
    matchText: normalizeOverrideMatchText(itemOverride && itemOverride.matchText),
    applyToAllFundingTypes: itemOverride && itemOverride.applyToAllFundingTypes !== undefined
      ? Boolean(itemOverride.applyToAllFundingTypes)
      : true,
    fundingTypeKeys: normalizeFundingTypeKeys(itemOverride && itemOverride.fundingTypeKeys),
    multipliers: cloneMultipliers(itemOverride && itemOverride.multipliers)
  })).filter(itemOverride => itemOverride.matchText && itemOverride.multipliers.length > 0)
)

const normalizeFromSource = (source, fallbackToDefault) => {
  const defaults = createDefaultBudgetMultiplierConfig()
  const defaultMap = new Map(defaults.map(category => [category.categoryKey, category]))
  const normalizedMap = new Map()

  ;(Array.isArray(source) ? source : []).forEach((category) => {
    const categoryKey = normalizeCategoryKey(category && (category.categoryKey !== undefined ? category.categoryKey : category.key))
    if (!categoryKey || normalizedMap.has(categoryKey)) return

    const fallbackCategory = defaultMap.get(categoryKey) || { categoryKey, categoryLabel: categoryKey, multipliers: [], itemOverrides: [] }
    const normalizedMultipliers = (Array.isArray(category && category.multipliers) ? category.multipliers : [])
      .map(normalizeMultiplierEntry)
      .filter(multiplier => multiplier.label)
    const normalizedItemOverrides = (Array.isArray(category && category.itemOverrides) ? category.itemOverrides : [])
      .map(normalizeItemOverrideEntry)
      .filter(itemOverride => itemOverride.matchText && itemOverride.multipliers.length > 0)

    normalizedMap.set(categoryKey, {
      categoryKey,
      categoryLabel: String(
        category && (category.categoryLabel !== undefined ? category.categoryLabel : category.label)
      || fallbackCategory.categoryLabel || categoryKey).trim() || fallbackCategory.categoryLabel || categoryKey,
      multipliers: normalizedMultipliers.length
        ? normalizedMultipliers
        : (fallbackToDefault ? cloneMultipliers(fallbackCategory.multipliers) : []),
      itemOverrides: cloneItemOverrides(normalizedItemOverrides)
    })
  })

  if (fallbackToDefault) {
    return CATEGORY_KEY_ORDER.map((categoryKey) => {
      const fallbackCategory = defaultMap.get(categoryKey) || { categoryKey, categoryLabel: categoryKey, multipliers: [], itemOverrides: [] }
      const normalizedCategory = normalizedMap.get(categoryKey)
      if (!normalizedCategory) {
        return {
          categoryKey,
          categoryLabel: fallbackCategory.categoryLabel || categoryKey,
          multipliers: cloneMultipliers(fallbackCategory.multipliers),
          itemOverrides: cloneItemOverrides(fallbackCategory.itemOverrides)
        }
      }
      return {
        categoryKey,
        categoryLabel: normalizedCategory.categoryLabel || fallbackCategory.categoryLabel || categoryKey,
        multipliers: cloneMultipliers(normalizedCategory.multipliers),
        itemOverrides: cloneItemOverrides(normalizedCategory.itemOverrides)
      }
    })
  }

  return Array.from(normalizedMap.values()).map(category => ({
    categoryKey: category.categoryKey,
    categoryLabel: String(category.categoryLabel || '').trim(),
    multipliers: cloneMultipliers(category.multipliers).filter(multiplier => multiplier.label),
    itemOverrides: cloneItemOverrides(category.itemOverrides)
  }))
}

export const normalizeBudgetMultiplierConfig = (rawConfig, { fallbackToDefault = true } = {}) => {
  const source = Array.isArray(rawConfig) ? rawConfig : []
  const normalized = normalizeFromSource(source, fallbackToDefault)
  if (!normalized.length && fallbackToDefault) return createDefaultBudgetMultiplierConfig()
  return normalized
}

export const parseBudgetMultiplierSettingValue = (settingValue, { fallbackToDefault = true } = {}) => {
  if (settingValue === undefined || settingValue === null || settingValue === '') {
    return fallbackToDefault ? createDefaultBudgetMultiplierConfig() : []
  }

  try {
    const parsed = typeof settingValue === 'string'
      ? JSON.parse(settingValue)
      : settingValue
    return normalizeBudgetMultiplierConfig(parsed, { fallbackToDefault })
  } catch (_) {
    return fallbackToDefault ? createDefaultBudgetMultiplierConfig() : []
  }
}

export const sanitizeBudgetMultiplierConfigForSave = (rawConfig) => {
  const normalized = normalizeBudgetMultiplierConfig(rawConfig, { fallbackToDefault: true })
  return normalized.map(category => ({
    categoryKey: normalizeCategoryKey(category.categoryKey),
    categoryLabel: String(category.categoryLabel || '').trim(),
    multipliers: cloneMultipliers(category.multipliers).filter(multiplier => multiplier.label),
    itemOverrides: cloneItemOverrides(category.itemOverrides)
  })).filter(category => category.categoryKey)
}

export const mergeBudgetMultiplierMaxValues = (primaryConfig, fallbackConfig) => {
  const primary = normalizeBudgetMultiplierConfig(primaryConfig, { fallbackToDefault: true })
  const fallback = normalizeBudgetMultiplierConfig(fallbackConfig, { fallbackToDefault: true })
  const fallbackCategoryMap = new Map(fallback.map(category => [category.categoryKey, category]))

  return primary.map((category) => {
    const fallbackCategory = fallbackCategoryMap.get(category.categoryKey)
    const fallbackOverrideMap = new Map(
      ((fallbackCategory && Array.isArray(fallbackCategory.itemOverrides)) ? fallbackCategory.itemOverrides : [])
        .map(itemOverride => [normalizeOverrideMatchText(itemOverride.matchText), itemOverride])
    )

    return {
      ...category,
      multipliers: (Array.isArray(category.multipliers) ? category.multipliers : []).map((multiplier, index) => {
        const fallbackMultiplier = fallbackCategory && Array.isArray(fallbackCategory.multipliers)
          ? fallbackCategory.multipliers[index]
          : null
        return {
          ...multiplier,
          maxValue: multiplier && multiplier.maxValue !== null && multiplier.maxValue !== undefined
            ? multiplier.maxValue
            : toMultiplierMaxNumber(fallbackMultiplier && fallbackMultiplier.maxValue, null)
        }
      }),
      itemOverrides: (Array.isArray(category.itemOverrides) ? category.itemOverrides : []).map((itemOverride) => {
        const fallbackOverride = fallbackOverrideMap.get(normalizeOverrideMatchText(itemOverride && itemOverride.matchText))
        return {
          ...itemOverride,
          applyToAllFundingTypes: itemOverride && itemOverride.applyToAllFundingTypes === false
            ? false
            : (fallbackOverride && fallbackOverride.applyToAllFundingTypes === false ? false : true),
          fundingTypeKeys: itemOverride && Array.isArray(itemOverride.fundingTypeKeys) && itemOverride.fundingTypeKeys.length > 0
            ? normalizeFundingTypeKeys(itemOverride.fundingTypeKeys)
            : normalizeFundingTypeKeys(fallbackOverride && fallbackOverride.fundingTypeKeys),
          multipliers: (Array.isArray(itemOverride && itemOverride.multipliers) ? itemOverride.multipliers : []).map((multiplier, index) => {
            const fallbackMultiplier = fallbackOverride && Array.isArray(fallbackOverride.multipliers)
              ? fallbackOverride.multipliers[index]
              : null
            return {
              ...multiplier,
              maxValue: multiplier && multiplier.maxValue !== null && multiplier.maxValue !== undefined
                ? multiplier.maxValue
                : toMultiplierMaxNumber(fallbackMultiplier && fallbackMultiplier.maxValue, null)
            }
          })
        }
      })
    }
  })
}

export const buildBudgetMultiplierConfigMap = (config) => {
  const categoryMap = buildBudgetMultiplierCategoryMap(config)
  const mapped = new Map()
  categoryMap.forEach((category, categoryKey) => {
    mapped.set(categoryKey, cloneMultipliers(category && category.multipliers))
  })
  return mapped
}

export const buildBudgetMultiplierCategoryMap = (config) => {
  const normalized = normalizeBudgetMultiplierConfig(config, { fallbackToDefault: true })
  const mapped = new Map()
  normalized.forEach((category) => {
    mapped.set(category.categoryKey, {
      categoryKey: category.categoryKey,
      categoryLabel: String(category.categoryLabel || '').trim(),
      multipliers: cloneMultipliers(category.multipliers),
      itemOverrides: cloneItemOverrides(category.itemOverrides)
    })
  })
  return mapped
}

export const getBudgetCategoryMultipliers = (config, categoryKey) => {
  const key = normalizeCategoryKey(categoryKey)
  if (!key) return []
  const map = buildBudgetMultiplierConfigMap(config)
  return map.get(key) || []
}

export const readBudgetMultiplierConfigFromFallbackStorage = () => {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(BUDGET_MULTIPLIER_LOCAL_FALLBACK_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.budgetMultiplierConfig)) return []
    return normalizeBudgetMultiplierConfig(parsed.budgetMultiplierConfig, { fallbackToDefault: false })
  } catch (_) {
    return []
  }
}

export const writeBudgetMultiplierConfigToFallbackStorage = (config) => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(BUDGET_MULTIPLIER_LOCAL_FALLBACK_KEY, JSON.stringify({
      budgetMultiplierConfig: sanitizeBudgetMultiplierConfigForSave(config),
      savedAt: new Date().toISOString()
    }))
  } catch (_) {
    // Ignore localStorage write error.
  }
}
