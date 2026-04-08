export const ROLE_PAGE_ACCESS_SETTING_KEY = 'research_role_page_access_config_json'
export const ROLE_PAGE_ACCESS_LOCAL_FALLBACK_KEY = 'admin_role_page_access_settings_fallback_v1'

export const RESEARCH_ROLE_PAGE_ACCESS_ROLES = Object.freeze([
  { value: 'researcher', label: 'นักวิจัย' },
  { value: 'committee', label: 'คณะกรรมการ' },
  { value: 'admin', label: 'ผู้ดูแลระบบ' },
  { value: 'chairman', label: 'ประธานสำนัก' }
])

const KNOWN_ROLE_SET = new Set(RESEARCH_ROLE_PAGE_ACCESS_ROLES.map(role => role.value))

const DEFAULT_ROLE_PAGE_ACCESS_CONFIG_SOURCE = [
  {
    pageKey: 'user-dashboard',
    label: 'หน้าหลักผู้วิจัย',
    path: '/userdashboard',
    matchMode: 'exact',
    roles: ['researcher']
  },
  {
    pageKey: 'user-profile',
    label: 'โปรไฟล์ผู้วิจัย',
    path: '/user/profile',
    matchMode: 'exact',
    roles: ['researcher']
  },
  {
    pageKey: 'user-history',
    label: 'ประวัติการยื่นโครงการ',
    path: '/user/history',
    matchMode: 'exact',
    roles: ['researcher']
  },
  {
    pageKey: 'user-notification',
    label: 'การแจ้งเตือนผู้วิจัย',
    path: '/user/notification',
    matchMode: 'exact',
    roles: ['researcher']
  },
  {
    pageKey: 'user-meetings',
    label: 'ตารางประชุมผู้วิจัย',
    path: '/user/meetings',
    matchMode: 'exact',
    roles: ['researcher']
  },
  {
    pageKey: 'research-form',
    label: 'ฟอร์มข้อเสนอโครงการ',
    path: '/research-form',
    matchMode: 'prefix',
    roles: ['researcher', 'committee', 'admin', 'chairman']
  },
  {
    pageKey: 'admin-dashboard',
    label: 'แดชบอร์ดแอดมิน',
    path: '/admin/dashboard',
    matchMode: 'exact',
    roles: ['admin']
  },
  {
    pageKey: 'admin-proposals',
    label: 'จัดการโครงการ',
    path: '/admin/proposals',
    matchMode: 'prefix',
    roles: ['admin']
  },
  {
    pageKey: 'admin-documents',
    label: 'เอกสารโครงการ',
    path: '/admin/documents',
    matchMode: 'exact',
    roles: ['admin']
  },
  {
    pageKey: 'admin-users',
    label: 'จัดการผู้ใช้งาน',
    path: '/admin/users',
    matchMode: 'exact',
    roles: ['admin']
  },
  {
    pageKey: 'admin-meetings',
    label: 'จัดการประชุม',
    path: '/admin/meetings',
    matchMode: 'exact',
    roles: ['admin']
  },
  {
    pageKey: 'admin-notifications',
    label: 'การแจ้งเตือนแอดมิน',
    path: '/admin/notifications',
    matchMode: 'exact',
    roles: ['admin']
  },
  {
    pageKey: 'admin-reports',
    label: 'รายงาน',
    path: '/admin/reports',
    matchMode: 'exact',
    roles: ['admin']
  },
  {
    pageKey: 'admin-settings',
    label: 'ตั้งค่าระบบ',
    path: '/admin/settings',
    matchMode: 'exact',
    roles: ['admin'],
    requiredRoles: ['admin']
  },
  {
    pageKey: 'committee-dashboard',
    label: 'แดชบอร์ดคณะกรรมการ',
    path: '/committee/dashboard',
    matchMode: 'exact',
    roles: ['committee']
  },
  {
    pageKey: 'committee-assigned',
    label: 'รายการที่ได้รับมอบหมาย',
    path: '/committee/assigned',
    matchMode: 'exact',
    roles: ['committee']
  },
  {
    pageKey: 'committee-meetings',
    label: 'ประชุมคณะกรรมการ',
    path: '/committee/meetings',
    matchMode: 'exact',
    roles: ['committee']
  },
  {
    pageKey: 'committee-notifications',
    label: 'การแจ้งเตือนคณะกรรมการ',
    path: '/committee/notifications',
    matchMode: 'exact',
    roles: ['committee']
  },
  {
    pageKey: 'committee-proposals',
    label: 'หน้าอ่านข้อเสนอของกรรมการ',
    path: '/committee/proposals',
    matchMode: 'prefix',
    roles: ['committee']
  },
  {
    pageKey: 'chairman-dashboard',
    label: 'แดชบอร์ดประธานสำนัก',
    path: '/chairman/dashboard',
    matchMode: 'exact',
    roles: ['chairman']
  },
  {
    pageKey: 'chairman-assigned',
    label: 'รายการที่ได้รับมอบหมายประธานสำนัก',
    path: '/chairman/assigned',
    matchMode: 'exact',
    roles: ['chairman']
  },
  {
    pageKey: 'chairman-meetings',
    label: 'ประชุมประธานสำนัก',
    path: '/chairman/meetings',
    matchMode: 'exact',
    roles: ['chairman']
  },
  {
    pageKey: 'chairman-notifications',
    label: 'การแจ้งเตือนประธานสำนัก',
    path: '/chairman/notifications',
    matchMode: 'exact',
    roles: ['chairman']
  },
  {
    pageKey: 'chairman-proposals',
    label: 'หน้าอ่านข้อเสนอของประธานสำนัก',
    path: '/chairman/proposals',
    matchMode: 'prefix',
    roles: ['chairman']
  }
]

const DEFAULT_ROLE_LANDING_PATHS = Object.freeze({
  researcher: ['/userdashboard', '/user/profile', '/research-form'],
  committee: ['/committee/assigned', '/committee/dashboard', '/committee/meetings'],
  admin: ['/admin/dashboard', '/admin/settings', '/admin/proposals'],
  chairman: ['/chairman/assigned', '/chairman/dashboard', '/chairman/meetings']
})

const cloneConfigRow = (row) => ({
  pageKey: String(row && row.pageKey || '').trim(),
  label: String(row && row.label || '').trim(),
  path: normalizePath(row && row.path),
  matchMode: normalizeMatchMode(row && row.matchMode),
  roles: normalizeRoleList(row && row.roles),
  requiredRoles: normalizeRoleList(row && row.requiredRoles)
})

const normalizePageKey = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9_-]/g, '')

export const normalizeResearchRole = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  return KNOWN_ROLE_SET.has(normalized) ? normalized : ''
}

const normalizeRoleList = (value) => {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  const roles = []
  value.forEach((role) => {
    const normalized = normalizeResearchRole(role)
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    roles.push(normalized)
  })
  return roles
}

const normalizeMatchMode = (value) => (
  String(value || '').trim().toLowerCase() === 'prefix' ? 'prefix' : 'exact'
)

const normalizePathAlias = (value) => {
  const path = normalizePath(value)
  if (path === '/profile') return '/user/profile'
  if (path === '/admin-dashboard') return '/admin/dashboard'
  if (path.startsWith('/review/proposals/')) {
    return path.replace('/review/proposals/', '/committee/proposals/')
  }
  if (path === '/review/proposals') return '/committee/proposals'
  return path
}

export const normalizePath = (value) => {
  if (!value) return ''
  let normalized = String(value).trim()
  const queryIndex = normalized.indexOf('?')
  if (queryIndex !== -1) normalized = normalized.slice(0, queryIndex)
  const hashIndex = normalized.indexOf('#')
  if (hashIndex !== -1) normalized = normalized.slice(0, hashIndex)
  normalized = normalized.replace(/\/{2,}/g, '/')
  if (!normalized.startsWith('/')) normalized = `/${normalized}`
  if (normalized.length > 1 && normalized.endsWith('/')) normalized = normalized.slice(0, -1)
  return normalized
}

const normalizeComparablePath = (value) => normalizePathAlias(normalizePath(value))

const DEFAULT_ROLE_PAGE_ACCESS_CONFIG = DEFAULT_ROLE_PAGE_ACCESS_CONFIG_SOURCE
  .map(row => cloneConfigRow(row))
  .filter(row => row.pageKey && row.path)

export const createDefaultRolePageAccessConfig = () => (
  JSON.parse(JSON.stringify(DEFAULT_ROLE_PAGE_ACCESS_CONFIG))
)

const ensureRequiredRoles = (roles, requiredRoles) => {
  const merged = new Set(normalizeRoleList(roles))
  normalizeRoleList(requiredRoles).forEach(role => merged.add(role))
  return RESEARCH_ROLE_PAGE_ACCESS_ROLES
    .map(role => role.value)
    .filter(role => merged.has(role))
}

export const normalizeRolePageAccessConfig = (rawConfig, { fallbackToDefault = true } = {}) => {
  const source = Array.isArray(rawConfig) ? rawConfig : []
  const sourceByPageKey = new Map()
  const sourceByPath = new Map()

  source.forEach((item) => {
    const pageKey = normalizePageKey(item && item.pageKey)
    const path = normalizeComparablePath(item && item.path)
    if (pageKey && !sourceByPageKey.has(pageKey)) sourceByPageKey.set(pageKey, item)
    if (path && !sourceByPath.has(path)) sourceByPath.set(path, item)
  })

  const normalized = DEFAULT_ROLE_PAGE_ACCESS_CONFIG.map((defaultRow) => {
    const sourceRow = sourceByPageKey.get(defaultRow.pageKey) || sourceByPath.get(defaultRow.path) || null
    const hasRolesField = !!(sourceRow && Object.prototype.hasOwnProperty.call(sourceRow, 'roles'))
    const roles = hasRolesField
      ? normalizeRoleList(sourceRow.roles)
      : normalizeRoleList(defaultRow.roles)
    const requiredRoles = normalizeRoleList(defaultRow.requiredRoles)

    return {
      pageKey: defaultRow.pageKey,
      label: defaultRow.label,
      path: defaultRow.path,
      matchMode: defaultRow.matchMode,
      roles: ensureRequiredRoles(roles, requiredRoles),
      requiredRoles
    }
  })

  if (!normalized.length && fallbackToDefault) {
    return createDefaultRolePageAccessConfig()
  }
  return normalized
}

export const parseRolePageAccessSettingValue = (settingValue, { fallbackToDefault = true } = {}) => {
  if (settingValue === undefined || settingValue === null || settingValue === '') {
    return fallbackToDefault ? createDefaultRolePageAccessConfig() : []
  }

  try {
    const parsed = typeof settingValue === 'string'
      ? JSON.parse(settingValue)
      : settingValue
    return normalizeRolePageAccessConfig(parsed, { fallbackToDefault })
  } catch (_) {
    return fallbackToDefault ? createDefaultRolePageAccessConfig() : []
  }
}

export const sanitizeRolePageAccessConfigForSave = (rawConfig) => {
  const normalized = normalizeRolePageAccessConfig(rawConfig, { fallbackToDefault: true })
  return normalized.map((row) => ({
    pageKey: row.pageKey,
    label: row.label,
    path: row.path,
    matchMode: row.matchMode,
    roles: ensureRequiredRoles(row.roles, row.requiredRoles)
  }))
}

export const readRolePageAccessConfigFromFallbackStorage = () => {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(ROLE_PAGE_ACCESS_LOCAL_FALLBACK_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.rolePageAccessConfig)) return []
    return normalizeRolePageAccessConfig(parsed.rolePageAccessConfig, { fallbackToDefault: false })
  } catch (_) {
    return []
  }
}

export const writeRolePageAccessConfigToFallbackStorage = (config) => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(ROLE_PAGE_ACCESS_LOCAL_FALLBACK_KEY, JSON.stringify({
      rolePageAccessConfig: sanitizeRolePageAccessConfigForSave(config),
      savedAt: new Date().toISOString()
    }))
  } catch (_) {
    // Ignore localStorage write error.
  }
}

const isPrefixPathMatch = (targetPath, rulePath) => (
  targetPath === rulePath || targetPath.startsWith(`${rulePath}/`)
)

export const findRolePageAccessRuleByPath = (config, path) => {
  const normalizedPath = normalizeComparablePath(path)
  const normalizedConfig = normalizeRolePageAccessConfig(config, { fallbackToDefault: true })

  const exactMatch = normalizedConfig.find(row => (
    row.matchMode === 'exact' && normalizedPath === row.path
  ))
  if (exactMatch) return exactMatch

  const prefixMatches = normalizedConfig
    .filter(row => row.matchMode === 'prefix' && isPrefixPathMatch(normalizedPath, row.path))
    .sort((a, b) => b.path.length - a.path.length)

  return prefixMatches[0] || null
}

export const isRoleAllowedForPath = (config, path, role, { defaultAllow = true } = {}) => {
  const normalizedRole = normalizeResearchRole(role)
  if (!normalizedRole) return false

  const matchedRule = findRolePageAccessRuleByPath(config, path)
  if (!matchedRule) return defaultAllow

  return Array.isArray(matchedRule.roles) && matchedRule.roles.includes(normalizedRole)
}

export const resolveRoleLandingPath = (config, role, fallbackPath = '') => {
  const normalizedRole = normalizeResearchRole(role)
  if (!normalizedRole) return normalizePath(fallbackPath) || '/pages/404'

  const candidatePaths = Array.isArray(DEFAULT_ROLE_LANDING_PATHS[normalizedRole])
    ? DEFAULT_ROLE_LANDING_PATHS[normalizedRole]
    : []

  for (let i = 0; i < candidatePaths.length; i += 1) {
    const path = normalizePath(candidatePaths[i])
    if (isRoleAllowedForPath(config, path, normalizedRole, { defaultAllow: false })) {
      return path
    }
  }

  const normalizedConfig = normalizeRolePageAccessConfig(config, { fallbackToDefault: true })
  const accessiblePath = normalizedConfig.find(row => (
    Array.isArray(row.roles) && row.roles.includes(normalizedRole)
  ))
  if (accessiblePath && accessiblePath.path) return accessiblePath.path

  const fallback = normalizePath(fallbackPath)
  if (fallback && isRoleAllowedForPath(config, fallback, normalizedRole, { defaultAllow: true })) {
    return fallback
  }

  return '/pages/404'
}
