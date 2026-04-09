export const BUDGET_ATTACHMENT_EXAMPLE_SETTING_KEY = 'budget_attachment_example_config_json'
export const BUDGET_ATTACHMENT_EXAMPLE_LOCAL_FALLBACK_KEY = 'admin_budget_attachment_example_settings_fallback_v1'
export const BUDGET_ATTACHMENT_EXAMPLE_BASE_URL = '/budget-example-docs'
export const BUDGET_ATTACHMENT_EXAMPLE_FILE_API_PATH = '/api/v1/setting/files'

export const BUDGET_ATTACHMENT_EXAMPLE_DOC_TYPES = Object.freeze([
  { key: 'TOR', label: 'TOR' },
  { key: 'Quotation', label: 'Quotation' },
  { key: 'Specification', label: 'Specification' },
  { key: 'CV', label: 'CV' },
  { key: 'ServiceRates', label: 'Service Rates' }
])

export const DEFAULT_BUDGET_ATTACHMENT_EXAMPLE_CONFIG = Object.freeze([
  {
    key: 'TOR',
    label: 'TOR',
    files: [
      {
        label: 'แบบคุณลักษณะเฉพาะและร่างขอบเขตงาน (TOR)',
        fileId: '',
        fileName: 'แบบ-คุณลักษณะเฉพาะ-และร่างขอบเขตงาน-TOR.docx',
        originalName: 'แบบ-คุณลักษณะเฉพาะ-และร่างขอบเขตงาน-TOR.docx'
      },
      {
        label: 'TOR กรณีการจ้างทั่วไป',
        fileId: '',
        fileName: 'TOR- กรณีการจ้างทั่วไป.docx',
        originalName: 'TOR- กรณีการจ้างทั่วไป.docx'
      }
    ]
  },
  {
    key: 'Quotation',
    label: 'Quotation',
    files: []
  },
  {
    key: 'Specification',
    label: 'Specification',
    files: [
      {
        label: 'Specification กรณีการจัดซื้อครุภัณฑ์',
        fileId: '',
        fileName: 'Spec-กรณีการจัดซื้อครุภัณฑ์.docx',
        originalName: 'Spec-กรณีการจัดซื้อครุภัณฑ์.docx'
      },
      {
        label: 'Specification กรณีการจัดซื้อวัสดุ (เกิน 1 แสนบาท)',
        fileId: '',
        fileName: 'Spec-กรณีการจัดซื้อวัสดุ (กรณีเกิน 1 แสนบาท).docx',
        originalName: 'Spec-กรณีการจัดซื้อวัสดุ (กรณีเกิน 1 แสนบาท).docx'
      },
      {
        label: 'Specification กรณีการซื้อขายและอนุญาตให้ใช้สิทธิในโปรแกรมคอมพิวเตอร์',
        fileId: '',
        fileName: 'Spec-กรณีการซื้อขายและอนุญาตให้ใช้สิทธิในโปรแกรมคอมพิวเตอร์.docx',
        originalName: 'Spec-กรณีการซื้อขายและอนุญาตให้ใช้สิทธิในโปรแกรมคอมพิวเตอร์.docx'
      }
    ]
  },
  {
    key: 'CV',
    label: 'CV',
    files: []
  },
  {
    key: 'ServiceRates',
    label: 'Service Rates',
    files: []
  }
])

const DOC_TYPE_KEY_SET = new Set(BUDGET_ATTACHMENT_EXAMPLE_DOC_TYPES.map(item => item.key))

const clone = (value) => JSON.parse(JSON.stringify(value))

const normalizeDocTypeKey = (value) => {
  const normalized = String(value || '').trim()
  return DOC_TYPE_KEY_SET.has(normalized) ? normalized : ''
}

const normalizeFileEntry = (file) => {
  const label = String(file && file.label ? file.label : '').trim()
  const fileId = String(file && (file.fileId || file.id || file._id) ? (file.fileId || file.id || file._id) : '').trim()
  const fileName = String(file && (file.fileName || file.originalName || file.name) ? (file.fileName || file.originalName || file.name) : '').trim()
  const originalName = String(file && (file.originalName || file.fileName || file.name) ? (file.originalName || file.fileName || file.name) : '').trim()
  const mimeType = String(file && file.mimeType ? file.mimeType : '').trim()
  const uploadedAt = file && file.uploadedAt ? file.uploadedAt : null
  const size = Number(file && file.size)
  if (!label && !fileId && !fileName) return null
  return {
    label: label || originalName || fileName,
    fileId,
    fileName: originalName || fileName,
    originalName: originalName || fileName,
    mimeType,
    size: Number.isFinite(size) && size > 0 ? size : 0,
    uploadedAt
  }
}

const buildApiUrl = (path) => {
  const normalizedPath = String(path || '').trim()
  if (!normalizedPath) return ''
  const baseUrl = String(process.env.VUE_APP_API_BASE_URL || process.env.VUE_APP_API_URL || '').trim().replace(/\/+$/, '')
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath
}

export const createDefaultBudgetAttachmentExampleConfig = () => (
  clone(DEFAULT_BUDGET_ATTACHMENT_EXAMPLE_CONFIG)
)

export const normalizeBudgetAttachmentExampleConfig = (rawConfig, { fallbackToDefault = true } = {}) => {
  const source = Array.isArray(rawConfig) ? rawConfig : []
  const sourceMap = new Map()

  source.forEach((item) => {
    const key = normalizeDocTypeKey(item && item.key)
    if (!key) return
    sourceMap.set(key, item)
  })

  const normalized = BUDGET_ATTACHMENT_EXAMPLE_DOC_TYPES.map((docType) => {
    const sourceItem = sourceMap.get(docType.key) || null
    const files = (Array.isArray(sourceItem && sourceItem.files) ? sourceItem.files : [])
      .map(normalizeFileEntry)
      .filter(Boolean)

    return {
      key: docType.key,
      label: String(sourceItem && sourceItem.label ? sourceItem.label : docType.label).trim() || docType.label,
      files
    }
  })

  if (!normalized.length && fallbackToDefault) return createDefaultBudgetAttachmentExampleConfig()
  return normalized
}

export const parseBudgetAttachmentExampleSettingValue = (settingValue, { fallbackToDefault = true } = {}) => {
  if (settingValue === undefined || settingValue === null || settingValue === '') {
    return fallbackToDefault ? createDefaultBudgetAttachmentExampleConfig() : []
  }

  try {
    const parsed = typeof settingValue === 'string' ? JSON.parse(settingValue) : settingValue
    return normalizeBudgetAttachmentExampleConfig(parsed, { fallbackToDefault })
  } catch (_) {
    return fallbackToDefault ? createDefaultBudgetAttachmentExampleConfig() : []
  }
}

export const sanitizeBudgetAttachmentExampleConfigForSave = (rawConfig) => {
  return normalizeBudgetAttachmentExampleConfig(rawConfig, { fallbackToDefault: true }).map((docType) => ({
    key: docType.key,
    label: String(docType.label || '').trim() || docType.key,
    files: (Array.isArray(docType.files) ? docType.files : [])
      .map(normalizeFileEntry)
      .filter(Boolean)
  }))
}

export const buildBudgetAttachmentExampleConfigMap = (config) => {
  const normalized = normalizeBudgetAttachmentExampleConfig(config, { fallbackToDefault: true })
  return normalized.reduce((map, item) => {
    map.set(item.key, item)
    return map
  }, new Map())
}

export const resolveBudgetAttachmentExampleFileUrl = (fileEntry) => {
  const fileId = String(fileEntry && (fileEntry.fileId || fileEntry.id || fileEntry._id) ? (fileEntry.fileId || fileEntry.id || fileEntry._id) : '').trim()
  if (fileId) {
    return buildApiUrl(`${BUDGET_ATTACHMENT_EXAMPLE_FILE_API_PATH}/${encodeURIComponent(fileId)}`)
  }

  const fileName = String(fileEntry && (fileEntry.originalName || fileEntry.fileName || fileEntry.name) ? (fileEntry.originalName || fileEntry.fileName || fileEntry.name) : '').trim()
  if (!fileName) return ''
  return `${BUDGET_ATTACHMENT_EXAMPLE_BASE_URL}/${encodeURIComponent(fileName)}`
}

export const readBudgetAttachmentExampleConfigFromFallbackStorage = () => {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(BUDGET_ATTACHMENT_EXAMPLE_LOCAL_FALLBACK_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.budgetAttachmentExampleConfig)) return []
    return normalizeBudgetAttachmentExampleConfig(parsed.budgetAttachmentExampleConfig, { fallbackToDefault: false })
  } catch (_) {
    return []
  }
}

export const writeBudgetAttachmentExampleConfigToFallbackStorage = (config) => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(BUDGET_ATTACHMENT_EXAMPLE_LOCAL_FALLBACK_KEY, JSON.stringify({
      budgetAttachmentExampleConfig: sanitizeBudgetAttachmentExampleConfigForSave(config),
      savedAt: new Date().toISOString()
    }))
  } catch (_) {
    // Ignore localStorage write error.
  }
}
