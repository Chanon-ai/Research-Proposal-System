import Service from '@/service/api'

function normalizeLangArray (value) {
  if (Array.isArray(value)) {
    return value
      .map(item => ({
        key: item && item.key ? String(item.key).trim().toLowerCase() : '',
        value: item && item.value ? String(item.value) : ''
      }))
      .filter(item => item.key)
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).map(key => ({
      key: String(key).trim().toLowerCase(),
      value: value[key] == null ? '' : String(value[key])
    }))
  }
  return []
}

function langText (items, lang = 'th') {
  const normalized = normalizeLangArray(items)
  const direct = normalized.find(item => item.key === lang && item.value)
  if (direct) return direct.value
  const fallbackEn = normalized.find(item => item.key === 'en' && item.value)
  if (fallbackEn) return fallbackEn.value
  const first = normalized.find(item => item.value)
  return first ? first.value : ''
}

function toLanguageMap (items) {
  return {
    th: langText(items, 'th'),
    en: langText(items, 'en')
  }
}

function toStatusPayload (payload) {
  const title = normalizeLangArray(payload && (payload.title || payload.titleItems))
    .filter(item => item.value && String(item.value).trim())
  const description = normalizeLangArray(payload && (payload.description || payload.descriptionItems))
    .filter(item => item.value && String(item.value).trim())
  return {
    _id: payload && payload._id ? payload._id : null,
    group: payload && (payload.group || payload.groupId) ? String(payload.group || payload.groupId) : '',
    key: payload && payload.key ? String(payload.key).trim().toUpperCase() : '',
    title,
    description,
    state: !(payload && payload.state === false)
  }
}

function toGroupPayload (payload) {
  const title = normalizeLangArray(payload && (payload.title || payload.titleItems))
    .filter(item => item.value && String(item.value).trim())
  const description = normalizeLangArray(payload && (payload.description || payload.descriptionItems))
    .filter(item => item.value && String(item.value).trim())
  return {
    _id: payload && payload._id ? payload._id : null,
    key: payload && payload.key ? String(payload.key).trim().toUpperCase() : '',
    title,
    description,
    state: !(payload && payload.state === false)
  }
}

function mapGroup (item) {
  const titleItems = normalizeLangArray(item && item.title)
  const descriptionItems = normalizeLangArray(item && item.description)
  const state = !(item && item.state === false)
  const createdAt = item && item.create && item.create.datetime ? String(item.create.datetime) : ''
  const createdByName = accountDisplayName(item && item.create && item.create.by)
  const updatedAt = item && item.update && item.update.datetime ? String(item.update.datetime) : ''
  const updatedByName = accountDisplayName(item && item.update && item.update.by)
  return {
    _id: item && item._id ? String(item._id) : '',
    key: item && item.key ? String(item.key) : '',
    title: titleItems,
    titleItems,
    descriptionItems,
    titleTh: langText(titleItems, 'th'),
    titleEn: langText(titleItems, 'en'),
    descriptionTh: langText(descriptionItems, 'th'),
    descriptionEn: langText(descriptionItems, 'en'),
    name: langText(titleItems),
    state,
    createdAt,
    createdByName,
    updatedAt,
    updatedByName
  }
}

function mapStatusItem (item) {
  const groupObj = item && item.group && typeof item.group === 'object' ? item.group : null
  const titleItems = normalizeLangArray(item && item.title)
  const descriptionItems = normalizeLangArray(item && item.description)
  const state = !(item && item.state === false)
  const createdAt = item && item.create && item.create.datetime ? String(item.create.datetime) : ''
  const createdByName = accountDisplayName(item && item.create && item.create.by)
  const updatedAt = item && item.update && item.update.datetime ? String(item.update.datetime) : ''
  const updatedByName = accountDisplayName(item && item.update && item.update.by)
  return {
    _id: item && item._id ? String(item._id) : '',
    groupId: groupObj && groupObj._id ? String(groupObj._id) : (item && item.group ? String(item.group) : ''),
    groupName: groupObj ? langText(groupObj.title) : '',
    key: item && item.key ? String(item.key) : '',
    titleItems,
    descriptionItems,
    titleTh: langText(titleItems, 'th'),
    titleEn: langText(titleItems, 'en'),
    descriptionTh: langText(descriptionItems, 'th'),
    descriptionEn: langText(descriptionItems, 'en'),
    statusText: state ? 'Active' : 'Inactive',
    state,
    createdAt,
    createdByName,
    updatedAt,
    updatedByName
  }
}

function mapAuthMessageItem (item) {
  const titleItems = normalizeLangArray(item && item.title)
  const descriptionItems = normalizeLangArray(item && item.description)
  const status = item && item.status && typeof item.status === 'object' ? item.status : null
  const statusKey = status && status.key ? String(status.key).toLowerCase() : ''
  const isDraft = statusKey.includes('draft')
  const isInactive = !isDraft && status && status.state === false
  const statusOption = isDraft ? 'draft' : (isInactive ? 'inactive' : 'active')
  const startDate = item && item.startDate ? String(item.startDate).slice(0, 10) : ''
  const endDate = item && item.endDate ? String(item.endDate).slice(0, 10) : ''
  const createdAt = item && item.create && item.create.datetime ? String(item.create.datetime) : ''
  const createdByName = accountDisplayName(item && item.create && item.create.by)
  const updatedAt = item && item.update && item.update.datetime ? String(item.update.datetime) : ''
  const updatedByName = accountDisplayName(item && item.update && item.update.by)
  return {
    _id: item && item._id ? String(item._id) : '',
    titleItems,
    descriptionItems,
    titleText: langText(titleItems),
    descriptionText: langText(descriptionItems),
    startDate,
    endDate,
    periodText: [startDate, endDate].filter(Boolean).join(' - ') || '-',
    showOnLogin: statusOption === 'active',
    statusOption,
    statusId: status && status._id ? String(status._id) : '',
    statusText: statusOption === 'draft' ? 'Draft' : (statusOption === 'inactive' ? 'Inactive' : 'Active'),
    isActive: statusOption === 'active',
    createdAt,
    createdByName,
    updatedAt,
    updatedByName
  }
}

function mapSettingMessageItem (item) {
  const messageItems = normalizeLangArray(item && item.message)
  const descriptionItems = normalizeLangArray(item && item.description)
  const createdAt = item && item.create && item.create.datetime ? String(item.create.datetime) : ''
  const createdByName = accountDisplayName(item && item.create && item.create.by)
  const updatedAt = item && item.update && item.update.datetime ? String(item.update.datetime) : ''
  const updatedByName = accountDisplayName(item && item.update && item.update.by)
  return {
    _id: item && item._id ? String(item._id) : '',
    number: item && item.number != null ? Number(item.number) : 0,
    code: item && item.code != null ? Number(item.code) : 0,
    messageItems,
    descriptionItems,
    messageTh: langText(messageItems, 'th'),
    messageEn: langText(messageItems, 'en'),
    descriptionTh: langText(descriptionItems, 'th'),
    descriptionEn: langText(descriptionItems, 'en'),
    createdAt,
    createdByName,
    updatedAt,
    updatedByName
  }
}

function toSettingMessagePayload (payload) {
  return {
    _id: payload && payload._id ? payload._id : null,
    number: payload && payload.number != null ? Number(payload.number) : 0,
    code: payload && payload.code != null ? Number(payload.code) : 0,
    message: normalizeLangArray(payload && (payload.message || payload.messageItems))
      .filter(item => item.value && String(item.value).trim()),
    description: normalizeLangArray(payload && (payload.description || payload.descriptionItems))
      .filter(item => item.value && String(item.value).trim())
  }
}

function mapVerificationItem (item) {
  const titleItems = normalizeLangArray(item && item.title)
  const descriptionItems = normalizeLangArray(item && item.description)
  const groupObj = item && item.group && typeof item.group === 'object' ? item.group : null
  const statusObj = item && item.status && typeof item.status === 'object' ? item.status : null
  const createdAt = item && item.create && item.create.datetime ? String(item.create.datetime) : ''
  const createdByName = accountDisplayName(item && item.create && item.create.by)
  const updatedAt = item && item.update && item.update.datetime ? String(item.update.datetime) : ''
  const updatedByName = accountDisplayName(item && item.update && item.update.by)
  return {
    _id: item && item._id ? String(item._id) : '',
    titleItems,
    descriptionItems,
    titleTh: langText(titleItems, 'th'),
    titleEn: langText(titleItems, 'en'),
    descriptionTh: langText(descriptionItems, 'th'),
    descriptionEn: langText(descriptionItems, 'en'),
    groupId: groupObj && groupObj._id ? String(groupObj._id) : (item && item.group ? String(item.group) : ''),
    groupName: groupObj ? langText(groupObj.title) : '',
    statusId: statusObj && statusObj._id ? String(statusObj._id) : (item && item.status ? String(item.status) : ''),
    statusName: statusObj ? langText(statusObj.title) : '',
    createdAt,
    createdByName,
    updatedAt,
    updatedByName
  }
}

function toVerificationPayload (payload) {
  return {
    _id: payload && payload._id ? payload._id : null,
    title: normalizeLangArray(payload && (payload.title || payload.titleItems))
      .filter(item => item.value && String(item.value).trim()),
    description: normalizeLangArray(payload && (payload.description || payload.descriptionItems))
      .filter(item => item.value && String(item.value).trim()),
    group: payload && payload.groupId ? String(payload.groupId) : '',
    status: payload && payload.statusId ? String(payload.statusId) : ''
  }
}

function buildStatusCatalog (items) {
  const catalog = { active: '', inactive: '', draft: '' }
  ;(items || []).forEach(item => {
    const key = item && item.key ? String(item.key).toLowerCase() : ''
    const id = item && item._id ? String(item._id) : ''
    if (!id) return
    if (!catalog.draft && key.includes('draft')) {
      catalog.draft = id
      return
    }
    if (!catalog.inactive && item && item.state === false) {
      catalog.inactive = id
      return
    }
    if (!catalog.active && item && item.state !== false) {
      catalog.active = id
    }
  })
  return catalog
}

function accountDisplayName (account) {
  if (!account || typeof account !== 'object') return ''
  const prefix = langText(account.userinfo && account.userinfo.prefix)
  const firstName = langText(account.userinfo && account.userinfo.firstName)
  const lastName = langText(account.userinfo && account.userinfo.lastName)
  const fullName = [prefix, firstName, lastName].filter(Boolean).join(' ').trim()
  if (fullName) return fullName
  if (account.code) return String(account.code)
  if (account.email) return String(account.email)
  return ''
}

const settingStatus = {
  namespaced: true,
  state: {
    items: [],
    groups: []
  },
  mutations: {
    items (state, value) {
      state.items = Array.isArray(value) ? value : []
    },
    groups (state, value) {
      state.groups = Array.isArray(value) ? value : []
    }
  },
  actions: {
    async explorer ({ commit }) {
      const [groupsRes, statusRes] = await Promise.all([
        Service.settings('groups', {}),
        Service.settings('status', {})
      ])
      const groups = (groupsRes && groupsRes.data && groupsRes.data.data) || []
      const statuses = (statusRes && statusRes.data && statusRes.data.data) || []
      commit('groups', groups.map(mapGroup))
      commit('items', statuses.map(mapStatusItem))
      return true
    },
    toDraft (_, item) {
      return Promise.resolve({
        _id: item && item._id ? String(item._id) : null,
        groupId: item && item.groupId ? String(item.groupId) : '',
        key: item && item.key ? String(item.key) : '',
        titleItems: normalizeLangArray(item && item.titleItems),
        descriptionItems: normalizeLangArray(item && item.descriptionItems),
        state: !(item && item.state === false),
        createdAt: item && item.createdAt ? String(item.createdAt) : '',
        createdByName: item && item.createdByName ? String(item.createdByName) : '',
        updatedAt: item && item.updatedAt ? String(item.updatedAt) : '',
        updatedByName: item && item.updatedByName ? String(item.updatedByName) : ''
      })
    },
    async create ({ dispatch }, payload) {
      const normalized = toStatusPayload(payload)
      if (!normalized.group || !normalized.key) {
        throw new Error('invalid_payload')
      }
      await Service.settings('create-status', {
        group: normalized.group,
        key: normalized.key,
        title: normalized.title,
        description: normalized.description,
        state: normalized.state
      })
      await dispatch('explorer')
      return true
    },
    async update ({ dispatch }, payload) {
      const normalized = toStatusPayload(payload)
      if (!normalized._id || !normalized.group || !normalized.key) {
        throw new Error('invalid_payload')
      }
      await Service.settings('update-status', {
        _id: normalized._id,
        group: normalized.group,
        key: normalized.key,
        title: normalized.title,
        description: normalized.description,
        state: normalized.state
      })
      await dispatch('explorer')
      return true
    },
    async remove ({ dispatch }, item) {
      const id = item && item._id ? String(item._id) : ''
      if (!id) throw new Error('invalid_id')
      await Service.settings('delete-status', { id })
      await dispatch('explorer')
      return true
    }
  },
  getters: {
    items (state) {
      return state.items
    },
    groups (state) {
      return state.groups
    }
  }
}

const settingGroup = {
  namespaced: true,
  state: {
    items: []
  },
  mutations: {
    items (state, value) {
      state.items = Array.isArray(value) ? value : []
    }
  },
  actions: {
    async explorer ({ commit }) {
      const response = await Service.settings('groups', {})
      const groups = (response && response.data && response.data.data) || []
      commit('items', groups.map(mapGroup))
      return true
    },
    toDraft (_, item) {
      return Promise.resolve({
        _id: item && item._id ? String(item._id) : null,
        key: item && item.key ? String(item.key) : '',
        titleItems: normalizeLangArray(item && item.titleItems),
        descriptionItems: normalizeLangArray(item && item.descriptionItems),
        state: !(item && item.state === false),
        createdAt: item && item.createdAt ? String(item.createdAt) : '',
        createdByName: item && item.createdByName ? String(item.createdByName) : '',
        updatedAt: item && item.updatedAt ? String(item.updatedAt) : '',
        updatedByName: item && item.updatedByName ? String(item.updatedByName) : ''
      })
    },
    async create ({ dispatch }, payload) {
      const normalized = toGroupPayload(payload)
      if (!normalized.title.length) {
        throw new Error('invalid_payload')
      }
      await Service.settings('create-group', {
        key: normalized.key,
        title: normalized.title,
        description: normalized.description,
        state: normalized.state
      })
      await dispatch('explorer')
      return true
    },
    async update ({ dispatch }, payload) {
      const normalized = toGroupPayload(payload)
      if (!normalized._id || !normalized.title.length) {
        throw new Error('invalid_payload')
      }
      await Service.settings('update-group', {
        _id: normalized._id,
        key: normalized.key,
        title: normalized.title,
        description: normalized.description,
        state: normalized.state
      })
      await dispatch('explorer')
      return true
    },
    async remove ({ dispatch }, item) {
      const id = item && item._id ? String(item._id) : ''
      if (!id) throw new Error('invalid_id')
      await Service.settings('delete-group', { id })
      await dispatch('explorer')
      return true
    }
  },
  getters: {
    items (state) {
      return state.items
    }
  }
}

const settingMessageAuthen = {
  namespaced: true,
  state: {
    items: [],
    statusCatalog: { active: '', inactive: '', draft: '' }
  },
  mutations: {
    items (state, value) {
      state.items = Array.isArray(value) ? value : []
    },
    statusCatalog (state, value) {
      state.statusCatalog = Object.assign({ active: '', inactive: '', draft: '' }, value || {})
    }
  },
  actions: {
    async ensureStatusCatalog ({ state, commit }) {
      if (state.statusCatalog.active || state.statusCatalog.inactive || state.statusCatalog.draft) {
        return state.statusCatalog
      }
      const statusRes = await Service.settings('status', {})
      const statuses = (statusRes && statusRes.data && statusRes.data.data) || []
      const catalog = buildStatusCatalog(statuses)
      commit('statusCatalog', catalog)
      return catalog
    },
    async explorer ({ commit, dispatch }) {
      await dispatch('ensureStatusCatalog')
      const response = await Service.authenticated('message', {}, {})
      const items = (response && response.data && response.data.data) || []
      commit('items', items.map(mapAuthMessageItem))
      return true
    },
    toDraft (_, item) {
      return Promise.resolve({
        _id: item && item._id ? String(item._id) : null,
        titleItems: normalizeLangArray(item && item.titleItems),
        descriptionItems: normalizeLangArray(item && item.descriptionItems),
        startDate: item && item.startDate ? String(item.startDate) : '',
        endDate: item && item.endDate ? String(item.endDate) : '',
        showOnLogin: !!(item && item.showOnLogin),
        statusOption: item && item.statusOption ? String(item.statusOption) : 'active',
        createdAt: item && item.createdAt ? String(item.createdAt) : '',
        createdByName: item && item.createdByName ? String(item.createdByName) : '',
        updatedAt: item && item.updatedAt ? String(item.updatedAt) : '',
        updatedByName: item && item.updatedByName ? String(item.updatedByName) : ''
      })
    },
    async create ({ dispatch }, payload) {
      const catalog = await dispatch('ensureStatusCatalog')
      const statusOption = payload && payload.statusOption ? String(payload.statusOption) : 'active'
      const statusId = catalog[statusOption] || catalog.active || ''
      await Service.authenticated('create-message', {
        title: normalizeLangArray(payload && payload.titleItems),
        description: normalizeLangArray(payload && payload.descriptionItems),
        startDate: payload && payload.startDate ? payload.startDate : null,
        endDate: payload && payload.endDate ? payload.endDate : null,
        status: statusId || undefined
      }, {})
      await dispatch('explorer')
      return true
    },
    async update ({ dispatch }, payload) {
      const catalog = await dispatch('ensureStatusCatalog')
      const statusOption = payload && payload.statusOption ? String(payload.statusOption) : 'active'
      const statusId = catalog[statusOption] || catalog.active || ''
      await Service.authenticated('update-message', {
        _id: payload && payload._id ? payload._id : '',
        title: normalizeLangArray(payload && payload.titleItems),
        description: normalizeLangArray(payload && payload.descriptionItems),
        startDate: payload && payload.startDate ? payload.startDate : null,
        endDate: payload && payload.endDate ? payload.endDate : null,
        status: statusId || undefined
      }, {})
      await dispatch('explorer')
      return true
    },
    async remove ({ dispatch }, item) {
      const id = item && item._id ? String(item._id) : ''
      if (!id) throw new Error('invalid_id')
      await Service.authenticated('remove-message', { id }, {})
      await dispatch('explorer')
      return true
    },
    async toggle ({ dispatch }, item) {
      const nextOption = item && item.isActive ? 'inactive' : 'active'
      await dispatch('update', {
        _id: item && item._id ? item._id : '',
        titleItems: normalizeLangArray(item && item.titleItems),
        descriptionItems: normalizeLangArray(item && item.descriptionItems),
        startDate: item && item.startDate ? item.startDate : null,
        endDate: item && item.endDate ? item.endDate : null,
        showOnLogin: nextOption === 'active',
        statusOption: nextOption
      })
      return true
    }
  },
  getters: {
    items (state) {
      return state.items
    }
  }
}

const settingMessage = {
  namespaced: true,
  state: {
    items: []
  },
  mutations: {
    items (state, value) {
      state.items = Array.isArray(value) ? value : []
    }
  },
  actions: {
    async explorer ({ commit }) {
      const response = await Service.settings('messages', {})
      const items = (response && response.data && response.data.data) || []
      commit('items', items.map(mapSettingMessageItem))
      return true
    },
    toDraft (_, item) {
      return Promise.resolve({
        _id: item && item._id ? String(item._id) : null,
        number: item && item.number != null ? Number(item.number) : 0,
        code: item && item.code != null ? Number(item.code) : 0,
        messageItems: normalizeLangArray(item && item.messageItems),
        descriptionItems: normalizeLangArray(item && item.descriptionItems),
        createdAt: item && item.createdAt ? String(item.createdAt) : '',
        createdByName: item && item.createdByName ? String(item.createdByName) : '',
        updatedAt: item && item.updatedAt ? String(item.updatedAt) : '',
        updatedByName: item && item.updatedByName ? String(item.updatedByName) : ''
      })
    },
    async create ({ dispatch }, payload) {
      const normalized = toSettingMessagePayload(payload)
      if (!normalized.number || !normalized.code || !normalized.message.length) throw new Error('invalid_payload')
      await Service.settings('create-setting-message', normalized)
      await dispatch('explorer')
      return true
    },
    async update ({ dispatch }, payload) {
      const normalized = toSettingMessagePayload(payload)
      if (!normalized._id || !normalized.number || !normalized.code || !normalized.message.length) throw new Error('invalid_payload')
      await Service.settings('update-setting-message', normalized)
      await dispatch('explorer')
      return true
    },
    async remove ({ dispatch }, item) {
      const id = item && item._id ? String(item._id) : ''
      if (!id) throw new Error('invalid_id')
      await Service.settings('delete-setting-message', { id })
      await dispatch('explorer')
      return true
    }
  },
  getters: {
    items (state) {
      return state.items
    }
  }
}

const settingVerification = {
  namespaced: true,
  state: {
    items: [],
    groups: [],
    statuses: []
  },
  mutations: {
    items (state, value) {
      state.items = Array.isArray(value) ? value : []
    },
    groups (state, value) {
      state.groups = Array.isArray(value) ? value : []
    },
    statuses (state, value) {
      state.statuses = Array.isArray(value) ? value : []
    }
  },
  actions: {
    async explorer ({ commit }) {
      const [verificationRes, groupRes, statusRes] = await Promise.all([
        Service.settings('verification', {}),
        Service.settings('groups', {}),
        Service.settings('status', {})
      ])
      const items = (verificationRes && verificationRes.data && verificationRes.data.data) || []
      const groups = (groupRes && groupRes.data && groupRes.data.data) || []
      const statuses = (statusRes && statusRes.data && statusRes.data.data) || []
      commit('items', items.map(mapVerificationItem))
      commit('groups', groups.map(mapGroup))
      commit('statuses', statuses.map(mapStatusItem))
      return true
    },
    toDraft (_, item) {
      return Promise.resolve({
        _id: item && item._id ? String(item._id) : null,
        titleItems: normalizeLangArray(item && item.titleItems),
        descriptionItems: normalizeLangArray(item && item.descriptionItems),
        groupId: item && item.groupId ? String(item.groupId) : '',
        statusId: item && item.statusId ? String(item.statusId) : '',
        createdAt: item && item.createdAt ? String(item.createdAt) : '',
        createdByName: item && item.createdByName ? String(item.createdByName) : '',
        updatedAt: item && item.updatedAt ? String(item.updatedAt) : '',
        updatedByName: item && item.updatedByName ? String(item.updatedByName) : ''
      })
    },
    async create ({ dispatch }, payload) {
      const normalized = toVerificationPayload(payload)
      if (!normalized.title.length || !normalized.group || !normalized.status) throw new Error('invalid_payload')
      await Service.settings('create-verification', normalized)
      await dispatch('explorer')
      return true
    },
    async update ({ dispatch }, payload) {
      const normalized = toVerificationPayload(payload)
      if (!normalized._id || !normalized.title.length || !normalized.group || !normalized.status) throw new Error('invalid_payload')
      await Service.settings('update-verification', normalized)
      await dispatch('explorer')
      return true
    },
    async remove ({ dispatch }, item) {
      const id = item && item._id ? String(item._id) : ''
      if (!id) throw new Error('invalid_id')
      await Service.settings('delete-verification', { id })
      await dispatch('explorer')
      return true
    }
  },
  getters: {
    items (state) {
      return state.items
    },
    groups (state) {
      return state.groups
    },
    statuses (state) {
      return state.statuses
    }
  }
}

const module = {
  namespaced: true,
  state: {
    lang: 'en'
  },
  mutations: {
    lang (state, obj) {
      state.lang = obj;
    }
  },
  actions: {},
  getters: {
    lang (state) {
      return state.lang;
    }
  },
  modules: {
    settingMessage,
    settingVerification,
    settingGroup,
    settingStatus,
    settingMessageAuthen
  }
};

export default module;
