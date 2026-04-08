<template>
  <div class="admin-role-page-access-settings">
    <CCard class="mt-3">
      <CCardHeader>
        <div class="role-access-toolbar">
          <div>
            <div class="font-weight-bold">{{ $t('roleAccess.title') }}</div>
            <small class="text-muted">
              {{ $t('roleAccess.subtitle') }}
            </small>
          </div>
          <div class="role-access-summary">
            <CBadge color="info">{{ $t('roleAccess.badgePages') }} {{ rolePageAccessConfig.length }}</CBadge>
            <CBadge color="secondary">{{ $t('roleAccess.badgeTotal') }} {{ totalRoleAssignments }}</CBadge>
          </div>
        </div>
      </CCardHeader>

      <CCardBody>
        <div v-if="loading" class="text-center py-4">
          <CSpinner color="primary" />
          <div class="mt-2 text-muted">{{ $t('roleAccess.loading') }}</div>
        </div>

        <template v-else>
          <CRow class="mb-3">
            <CCol md="6">
              <CInput
                :label="$t('roleAccess.searchLabel')"
                :placeholder="$t('roleAccess.searchPlaceholder')"
                v-model.trim="searchKeyword"
              />
            </CCol>
          </CRow>

          <div v-if="filteredRows.length === 0" class="text-center text-muted py-3">
            {{ $t('roleAccess.noResults') }}
          </div>

          <div v-else class="table-responsive role-access-table-wrap">
            <table class="table table-bordered table-striped mb-0 role-access-table">
              <thead>
                <tr>
                  <th class="role-access-table__page-col">{{ $t('roleAccess.colPage') }}</th>
                  <th
                    v-for="role in roleOptions"
                    :key="`role-head-${role.value}`"
                    class="text-center role-access-table__role-col"
                  >
                    {{ $t('roleAccess.roles.' + role.value) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in filteredRows"
                  :key="`role-page-${row.page.pageKey}`"
                >
                  <td>
                    <div class="role-access-page-label">
                      {{ $te('roleAccess.pages.' + row.page.pageKey) ? $t('roleAccess.pages.' + row.page.pageKey) : (row.page.label || row.page.pageKey) }}
                    </div>
                    <div class="role-access-page-path">
                      {{ row.page.path }}
                      <span v-if="row.page.matchMode === 'prefix'" class="role-access-chip ml-1">prefix</span>
                    </div>
                  </td>
                  <td
                    v-for="role in roleOptions"
                    :key="`role-cell-${row.page.pageKey}-${role.value}`"
                    class="text-center align-middle"
                    :class="{ 'role-access-cell--required': isRequiredRole(row.page, role.value) }"
                  >
                    <input
                      type="checkbox"
                      class="role-access-checkbox"
                      :checked="hasRole(row.page, role.value)"
                      :disabled="isRequiredRole(row.page, role.value)"
                      @change="onToggleRole(row.index, role.value, $event.target.checked)"
                    />
                    <div v-if="isRequiredRole(row.page, role.value)" class="role-access-required-text">
                      {{ $t('roleAccess.required') }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="role-access-actions">
            <CButton color="warning" variant="outline" @click="resetToDefault">
              <CIcon name="cil-reload" class="mr-1" /> {{ $t('roleAccess.resetBtn') }}
            </CButton>
            <CButton color="primary" :disabled="saving" @click="saveRolePageAccessConfig">
              <CIcon name="cil-save" class="mr-1" /> {{ saving ? $t('roleAccess.saving') : $t('roleAccess.saveBtn') }}
            </CButton>
          </div>
        </template>
      </CCardBody>
    </CCard>
  </div>
</template>

<script>
import { instance as axios } from '@/service/api'
import Swal from 'sweetalert2'
import {
  ROLE_PAGE_ACCESS_SETTING_KEY,
  RESEARCH_ROLE_PAGE_ACCESS_ROLES,
  createDefaultRolePageAccessConfig,
  normalizeRolePageAccessConfig as normalizeRolePageAccessConfigUtil,
  parseRolePageAccessSettingValue,
  sanitizeRolePageAccessConfigForSave as sanitizeRolePageAccessConfigForSaveUtil,
  readRolePageAccessConfigFromFallbackStorage,
  writeRolePageAccessConfigToFallbackStorage
} from '@/ResearchFormRS/utils/rolePageAccessConfig'

export default {
  name: 'AdminRolePageAccessSettings',
  data () {
    return {
      loading: false,
      saving: false,
      settingsCache: [],
      searchKeyword: '',
      rolePageAccessConfig: createDefaultRolePageAccessConfig()
    }
  },
  computed: {
    roleOptions () {
      return RESEARCH_ROLE_PAGE_ACCESS_ROLES
    },
    totalRoleAssignments () {
      return this.rolePageAccessConfig.reduce((sum, row) => (
        sum + (Array.isArray(row && row.roles) ? row.roles.length : 0)
      ), 0)
    },
    filteredRows () {
      const keyword = String(this.searchKeyword || '').trim().toLowerCase()
      const rows = this.rolePageAccessConfig.map((page, index) => ({ page, index }))
      if (!keyword) return rows
      return rows.filter((row) => {
        const page = row.page || {}
        return [
          page.label,
          page.path,
          page.pageKey
        ].some(text => String(text || '').toLowerCase().includes(keyword))
      })
    }
  },
  async mounted () {
    this.loading = true
    try {
      await this.fetchRolePageAccessConfig()
    } finally {
      this.loading = false
    }
  },
  methods: {
    parseSettingsPayload (response) {
      const payload = response && response.data && response.data.data
      if (Array.isArray(payload)) return payload
      if (payload && Array.isArray(payload.settings)) return payload.settings
      if (Array.isArray(response && response.data)) return response.data
      return []
    },
    normalizeRolePageAccessConfig (rawConfig) {
      return normalizeRolePageAccessConfigUtil(rawConfig, { fallbackToDefault: true })
    },
    sanitizeRolePageAccessConfigForSave (config = this.rolePageAccessConfig) {
      return sanitizeRolePageAccessConfigForSaveUtil(config)
    },
    hasRole (page, roleValue) {
      return Array.isArray(page && page.roles) && page.roles.includes(roleValue)
    },
    isRequiredRole (page, roleValue) {
      return Array.isArray(page && page.requiredRoles) && page.requiredRoles.includes(roleValue)
    },
    onToggleRole (pageIndex, roleValue, checked) {
      const page = this.rolePageAccessConfig[pageIndex]
      if (!page) return

      if (!Array.isArray(page.roles)) {
        this.$set(page, 'roles', [])
      }

      if (this.isRequiredRole(page, roleValue) && !checked) return

      const roleSet = new Set(Array.isArray(page.roles) ? page.roles : [])
      if (checked) roleSet.add(roleValue)
      else roleSet.delete(roleValue)

      const normalizedRoles = RESEARCH_ROLE_PAGE_ACCESS_ROLES
        .map(role => role.value)
        .filter(role => roleSet.has(role))

      this.$set(page, 'roles', normalizedRoles)
    },
    async fetchSettingCache () {
      const response = await axios.get('/api/v1/setting')
      this.settingsCache = this.parseSettingsPayload(response)
      return this.settingsCache
    },
    findSettingByKey (key) {
      return (Array.isArray(this.settingsCache) ? this.settingsCache : []).find(item => item && item.key === key)
    },
    async upsertSettingByKey (key, value, description, group) {
      if (!Array.isArray(this.settingsCache) || this.settingsCache.length === 0) {
        await this.fetchSettingCache()
      }

      let existed = this.findSettingByKey(key)
      if (!existed) {
        await this.fetchSettingCache()
        existed = this.findSettingByKey(key)
      }

      if (existed && existed._id) {
        await axios.put(`/api/v1/setting/${existed._id}`, { value, description })
      } else {
        await axios.post('/api/v1/setting', { key, value, description, group })
      }
    },
    loadFallback () {
      const fallback = readRolePageAccessConfigFromFallbackStorage()
      if (!Array.isArray(fallback) || fallback.length === 0) return false
      this.rolePageAccessConfig = this.normalizeRolePageAccessConfig(fallback)
      return true
    },
    saveFallback () {
      writeRolePageAccessConfigToFallbackStorage(this.rolePageAccessConfig)
    },
    async fetchRolePageAccessConfig () {
      try {
        const settings = await this.fetchSettingCache()
        const setting = settings.find(item => item && item.key === ROLE_PAGE_ACCESS_SETTING_KEY)
        const rawValue = setting ? setting.value : null
        this.rolePageAccessConfig = parseRolePageAccessSettingValue(rawValue, { fallbackToDefault: true })
        this.saveFallback()
      } catch (error) {
        if (!this.loadFallback()) {
          this.rolePageAccessConfig = createDefaultRolePageAccessConfig()
        }
      }
    },
    async resetToDefault () {
      const result = await Swal.fire({
        icon: 'warning',
        title: this.$t('roleAccess.resetConfirmTitle'),
        text: this.$t('roleAccess.resetConfirmText'),
        showCancelButton: true,
        confirmButtonText: this.$t('roleAccess.resetConfirmBtn'),
        cancelButtonText: this.$t('roleAccess.cancelBtn')
      })
      if (!result.isConfirmed) return
      this.rolePageAccessConfig = createDefaultRolePageAccessConfig()
    },
    async saveRolePageAccessConfig () {
      const payload = this.sanitizeRolePageAccessConfigForSave()

      this.saving = true
      try {
        await this.upsertSettingByKey(
          ROLE_PAGE_ACCESS_SETTING_KEY,
          JSON.stringify(payload),
          'Role based page access for ResearchFormRS routes',
          'general'
        )
        this.rolePageAccessConfig = this.normalizeRolePageAccessConfig(payload)
        this.saveFallback()
        await this.fetchRolePageAccessConfig()
        await Swal.fire({
          icon: 'success',
          title: this.$t('roleAccess.saveSuccess'),
          timer: 1300,
          showConfirmButton: false
        })
      } catch (error) {
        this.saveFallback()
        await Swal.fire({
          icon: 'info',
          title: this.$t('roleAccess.saveFallbackTitle'),
          text: this.$t('roleAccess.saveFallbackText')
        })
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.admin-role-page-access-settings {
  width: 100%;
}

.role-access-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  flex-wrap: wrap;
}

.role-access-summary {
  display: flex;
  gap: 6px;
  align-items: center;
}

.role-access-table-wrap {
  border: 1px solid #e8ebf1;
  border-radius: 10px;
  overflow: hidden;
}

.role-access-table th,
.role-access-table td {
  vertical-align: middle;
}

.role-access-table__page-col {
  min-width: 260px;
}

.role-access-table__role-col {
  min-width: 150px;
}

.role-access-page-label {
  font-weight: 600;
  color: #172b4d;
}

.role-access-page-path {
  font-size: 12px;
  color: #6c757d;
}

.role-access-chip {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: #edf2ff;
  color: #3f51b5;
}

.role-access-checkbox {
  width: 17px;
  height: 17px;
  cursor: pointer;
}

.role-access-cell--required {
  background: #f8f9fa;
}

.role-access-required-text {
  font-size: 11px;
  color: #6c757d;
}

.role-access-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
}
</style>
