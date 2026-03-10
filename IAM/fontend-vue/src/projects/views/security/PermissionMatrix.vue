<template>
  <div class="security-page">
    <AppSectionHero
      title="Permission Matrix"
      subtitle="Review group-to-menu rules, tune access switches, and keep the permission grid controlled."
      :stats="heroStats"
      :meta-label="'Last updated'"
      :meta-value="lastUpdatedLabel"
      @refresh="loadData"
    />
    <CRow>
      <CCol col="12">
        <PermissionMatrixTable
          :items="filteredPermissionRows"
          :fields="fields"
          @toggle="onToggle"
        >
          <template #header-actions>
            <div class="d-flex flex-wrap align-items-center mt-2 mt-md-0">
              <span class="small text-muted mr-2">Group</span>
              <CSelect
                size="sm"
                class="permission-filter mr-2"
                :value.sync="selectedGroupId"
                :options="groupOptions"
              />
              <CSelect
                size="sm"
                class="permission-filter mr-2"
                :value.sync="selectedMenuType"
                :options="menuTypeOptions"
              />
            </div>
          </template>
        </PermissionMatrixTable>
      </CCol>
    </CRow>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import AppSectionHero from '@/projects/components/layout/AppSectionHero'
import PermissionMatrixTable from '@/projects/views/security/components/PermissionMatrixTable'
import { formatDateTime24 } from '@/projects/utils/date-time'
import { notifyError } from '@/projects/utils/notify'
import { getTextByLanguage } from '@/store/modules/Security/shared'

export default {
  name: 'PermissionMatrix',
  components: { AppSectionHero, PermissionMatrixTable },
  data () {
    return {
      fields: [
        { key: 'group', label: 'Group', _style: 'width: 120px; text-align: center;' },
        { key: 'menu', label: 'Menu' },
        { key: 'type', label: 'Type' },
        { key: 'path', label: 'Path' },
        { key: 'source', label: 'Source' },
        { key: 'all', label: 'All', _style: 'width: 100px; text-align: center;' },
        { key: 'view', label: 'View', _style: 'width: 100px; text-align: center;' },
        { key: 'edit', label: 'Edit', _style: 'width: 100px; text-align: center;' },
        { key: 'delete', label: 'Delete', _style: 'width: 100px; text-align: center;' },
        { key: 'action', label: 'Action', _style: 'width: 100px; text-align: center;' },
        { key: 'owner', label: 'Owner', _style: 'width: 100px; text-align: center;' },
        { key: 'logs', label: 'Logs', _style: 'width: 100px; text-align: center;' }
      ],
      lastUpdatedAt: null,
      selectedGroupId: 'all',
      selectedMenuType: 'all'
    }
  },
  computed: {
    ...mapGetters({
      groups: 'security/permissionMatrix/groups',
      types: 'security/permissionMatrix/types',
      menus: 'security/permissionMatrix/menus',
      permissions: 'security/permissionMatrix/permissions',
      currentLang: 'setting/lang'
    }),
    heroStats () {
      return [
        { label: 'Groups', value: this.groups.length, icon: 'cil-people', iconClass: 'security-stat__icon--primary' },
        { label: 'Menus', value: this.menus.length, icon: 'cil-list', iconClass: 'security-stat__icon--success' },
        { label: 'Rules', value: this.permissions.length, icon: 'cil-shield-alt', iconClass: 'security-stat__icon--warning' }
      ]
    },
    lastUpdatedLabel () {
      return formatDateTime24(this.lastUpdatedAt)
    },
    groupOptions () {
      return [{ value: 'all', label: 'All Groups' }, ...this.groups.map(group => ({
        value: group._id,
        label: getTextByLanguage(group.title, this.currentLang) || group.name
      }))]
    },
    menuTypeOptions () {
      return [{ value: 'all', label: 'All Types' }, ...this.types.map(type => ({
        value: type._id,
        label: getTextByLanguage(type.title, this.currentLang) || type.name
      }))]
    },
    permissionTableRows () {
      const map = {}
      this.permissions.forEach(row => {
        map[`${row.groupId}:${row.menuId}`] = row
      })

      const rows = []
      this.groups.forEach(group => {
        this.menus.forEach(menu => {
          if (group.visibleTypeId && menu.typeId && group.visibleTypeId !== menu.typeId) return
          const key = `${group._id}:${menu._id}`
          const current = map[key] || {}
          rows.push({
            _id: current._id || null,
            groupId: group._id,
            menuId: menu._id,
            all: !!current.all,
            view: !!current.view,
            edit: !!current.edit,
            delete: !!current.delete,
            action: !!current.action,
            owner: !!current.owner,
            logs: !!current.logs,
            group: getTextByLanguage(group.title, this.currentLang) || group.name,
            menu: getTextByLanguage(menu.title, this.currentLang) || menu.name,
            type: this.resolveTypeName(menu.typeId) || '-',
            path: menu.path || '-',
            source: menu.source || '-'
          })
        })
      })
      return rows
    },
    filteredPermissionRows () {
      let rows = this.permissionTableRows
      if (this.selectedGroupId !== 'all') {
        rows = rows.filter(row => row.groupId === this.selectedGroupId)
      }
      if (this.selectedMenuType !== 'all') {
        rows = rows.filter(row => {
          const menu = this.menus.find(item => item._id === row.menuId)
          return menu && menu.typeId === this.selectedMenuType
        })
      }
      return rows
    }
  },
  async created () {
    await this.loadData()
  },
  methods: {
    resolveTypeName (typeId) {
      const type = this.types.find(item => item && item._id === typeId)
      return type ? (getTextByLanguage(type.title, this.currentLang) || type.name) : ''
    },
    async loadData () {
      try {
        await this.$store.dispatch('security/permissionMatrix/explorer')
        this.lastUpdatedAt = new Date()
      } catch (err) {
        notifyError(this.$store, 'Failed to load security data.')
      }
    },
    async onToggle (row, key, checked) {
      const working = {
        _id: row._id || null,
        groupId: row.groupId,
        menuId: row.menuId,
        all: !!row.all,
        view: !!row.view,
        edit: !!row.edit,
        delete: !!row.delete,
        action: !!row.action,
        owner: !!row.owner,
        logs: !!row.logs
      }

      if (!working._id) {
        Object.assign(working, {
          _id: null,
          groupId: row.groupId,
          menuId: row.menuId,
          all: false,
          view: false,
          edit: false,
          delete: false,
          action: false,
          owner: false,
          logs: false
        })
      }

      if (key === 'all') {
        working.all = checked
        working.view = checked
        working.edit = checked
        working.delete = checked
        working.action = checked
        working.owner = checked
        working.logs = checked
      } else {
        working[key] = checked
        working.all = working.view && working.edit && working.delete && working.action && working.owner && working.logs
      }

      try {
        await this.$store.dispatch('security/permissionMatrix/save', working)
      } catch (err) {
        notifyError(this.$store, 'Failed to save permissions.')
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import "./security-page.shared";

.permission-filter {
  min-width: 180px;
}
</style>
