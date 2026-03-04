import Service from '@/service/api'
import { formatDateTime24 } from '@/projects/utils/date-time'

function pickLangValue(items) {
  if (!Array.isArray(items)) return ''
  const found = items.find(item => item && item.value)
  return found ? String(found.value) : ''
}

function getStatusLabel(status) {
  if (!status || typeof status !== 'object') return '-'
  return pickLangValue(status.title) || status.key || '-'
}

function getGroupLabel(group) {
  if (!group) return '-'
  if (typeof group === 'string') return String(group || '-') || '-'
  if (typeof group !== 'object') return '-'
  if (Array.isArray(group.title)) return pickLangValue(group.title) || group.key || '-'
  return group.title || group.name || group.key || '-'
}

function mapAccount(item) {
  const status = item && item.status && typeof item.status === 'object' ? item.status : null
  const securityGroups = item && Array.isArray(item.securityGroups) ? item.securityGroups : []
  const prefix = item && item.userinfo && Array.isArray(item.userinfo.prefix) ? pickLangValue(item.userinfo.prefix) : ''
  const firstName = item && item.userinfo && Array.isArray(item.userinfo.firstName) ? pickLangValue(item.userinfo.firstName) : ''
  const lastName = item && item.userinfo && Array.isArray(item.userinfo.lastName) ? pickLangValue(item.userinfo.lastName) : ''
  const birthdayRaw = item && item.userinfo && item.userinfo.birthday ? new Date(item.userinfo.birthday) : null
  const deviceLogs = item && item.control && Array.isArray(item.control.device) ? item.control.device : []
  const lastLoginRaw = deviceLogs
    .map(device => device && device.dateTime ? new Date(device.dateTime) : null)
    .filter(value => value instanceof Date && !Number.isNaN(value.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0] || null

  return {
    _id: item && item._id ? String(item._id) : '',
    code: item && item.code ? String(item.code) : '-',
    email: item && item.email ? String(item.email) : '-',
    prefix,
    firstName,
    lastName,
    fullName: `${prefix} ${firstName} ${lastName}`.trim() || '-',
    msisdn: item && item.userinfo && item.userinfo.msisdn ? String(item.userinfo.msisdn) : '-',
    lineId: item && item.userinfo && item.userinfo.lineId ? String(item.userinfo.lineId) : '-',
    cardId: item && item.userinfo && item.userinfo.cardId ? String(item.userinfo.cardId) : '-',
    religion: item && item.userinfo && item.userinfo.religion ? String(item.userinfo.religion) : '-',
    birthday: birthdayRaw && !Number.isNaN(birthdayRaw.getTime()) ? birthdayRaw.toISOString().slice(0, 10) : '',
    birthdayLabel: birthdayRaw && !Number.isNaN(birthdayRaw.getTime()) ? birthdayRaw.toLocaleDateString() : '-',
    image: item && item.userinfo && item.userinfo.image ? String(item.userinfo.image) : '',
    groupLabel: securityGroups.length ? securityGroups.map(getGroupLabel).join(', ') : '-',
    groupIds: securityGroups
      .map(group => group && group._id ? String(group._id) : '')
      .filter(Boolean),
    lastLoginLabel: formatDateTime24(lastLoginRaw),
    lastLoginDateLabel: lastLoginRaw ? lastLoginRaw.toLocaleDateString() : '-',
    lastLoginTimeLabel: lastLoginRaw ? lastLoginRaw.toLocaleTimeString() : '-',
    statusKey: status && status.key ? String(status.key) : '',
    statusLabel: getStatusLabel(status),
    raw: item
  }
}

const state = {
  items: [],
  statusOptions: [],
  groupOptions: [],
  lastUpdatedAt: null,
  accessGroups: [],
  accessPermissions: []
}

export default {
  namespaced: true,
  state,
  mutations: {
    items(state, value) {
      state.items = Array.isArray(value) ? value : []
    },
    statusOptions(state, value) {
      state.statusOptions = Array.isArray(value) ? value : []
    },
    groupOptions(state, value) {
      state.groupOptions = Array.isArray(value) ? value : []
    },
    lastUpdatedAt(state, value) {
      state.lastUpdatedAt = value instanceof Date ? value : null
    },
    accessReview(state, value) {
      state.accessGroups = Array.isArray(value && value.groups) ? value.groups : []
      state.accessPermissions = Array.isArray(value && value.permissions) ? value.permissions : []
    },
    clearAccessReview(state) {
      state.accessGroups = []
      state.accessPermissions = []
    }
  },
  actions: {
    async explorer({ commit }) {
      const [accountsRes, statusRes, groupRes] = await Promise.all([
        Service.accounts('list'),
        Service.accounts('status-options'),
        Service.accounts('group-options')
      ])

      const items = Array.isArray(accountsRes && accountsRes.data && accountsRes.data.data)
        ? accountsRes.data.data.map(mapAccount)
        : []
      const rawStatuses = statusRes && statusRes.data && statusRes.data.data && Array.isArray(statusRes.data.data.statuses)
        ? statusRes.data.data.statuses
        : []
      const statusOptions = rawStatuses.map(item => ({
        key: item && item.key ? String(item.key) : '',
        label: getStatusLabel(item)
      })).filter(item => item.key)
      const rawGroups = groupRes && groupRes.data && groupRes.data.data && Array.isArray(groupRes.data.data.groups)
        ? groupRes.data.data.groups
        : []
      const groupOptions = rawGroups.map(item => ({
        _id: item && item._id ? String(item._id) : '',
        label: item && item.label ? String(item.label) : '-'
      })).filter(item => item._id)

      commit('items', items)
      commit('statusOptions', statusOptions)
      commit('groupOptions', groupOptions)
      commit('lastUpdatedAt', new Date())
      return items
    },
    async fetchAccessReview({ commit }, id) {
      const response = await Service.accounts('effective-permissions', { id })
      const data = response && response.data ? response.data.data : {}
      commit('accessReview', {
        groups: Array.isArray(data && data.groups) ? data.groups : [],
        permissions: Array.isArray(data && data.effectivePermissions) ? data.effectivePermissions : []
      })
      return data
    },
    async archive({ dispatch }, id) {
      await Service.accounts('change-status', {
        id,
        toStatusKey: 'ARCHIVED',
        action: 'archive'
      })
      await dispatch('explorer')
      return true
    },
    async update({ dispatch }, payload) {
      await Service.accounts('update', payload)
      if (payload && payload.statusKey) {
        await Service.accounts('change-status', {
          id: payload._id,
          toStatusKey: payload.statusKey,
          action: String(payload.statusKey).toLowerCase()
        })
      }
      await dispatch('explorer')
      return true
    }
  },
  getters: {
    items: state => state.items,
    statusOptions: state => state.statusOptions,
    groupOptions: state => state.groupOptions,
    lastUpdatedAt: state => state.lastUpdatedAt,
    accessGroups: state => state.accessGroups,
    accessPermissions: state => state.accessPermissions,
    lastUpdatedLabel: state => formatDateTime24(state.lastUpdatedAt)
  }
}
