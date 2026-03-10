<template>
  <div class="security-page">
    <AppSectionHero
      title="Setting Status"
      subtitle="Manage status keys, labels, descriptions, and active state for shared master data."
      :meta-label="'Last updated'"
      :meta-value="lastUpdatedLabel"
      @refresh="loadData"
    />

    <ManagementTableBase
      title="Status Management"
      icon="cil-tags"
      add-label="Add Status"
      empty-message="No status found"
      :items="items"
      :fields="fields"
      @add="openCreateModal"
      @edit="openEditModal"
      @remove="removeItem"
    >
      <template #state="{ item }">
        <td class="text-center">
          <CBadge :color="item.state ? 'success' : 'secondary'">
            {{ item.statusText }}
          </CBadge>
        </td>
      </template>
    </ManagementTableBase>

    <StatusFormModal
      :show.sync="showModal"
      :title="modalTitle"
      :value="draft"
      :groups="groups"
      @submit="saveItem"
      @invalid="handleInvalid"
      @cancel="closeModal"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import AppSectionHero from '@/projects/components/layout/AppSectionHero'
import { formatDateTime24 } from '@/projects/utils/date-time'
import ManagementTableBase from '@/projects/views/setting/components/ManagementTableBase'
import StatusFormModal from '@/projects/views/setting/components/StatusFormModal'
import { notifyError, notifyInfo, notifySuccess, notifyWarning } from '@/projects/utils/notify'

function createEmptyDraft () {
  return {
    _id: null,
    groupId: '',
    key: '',
    titleItems: [{ key: 'th', value: '' }, { key: 'en', value: '' }],
    descriptionItems: [{ key: 'th', value: '' }, { key: 'en', value: '' }],
    state: true
  }
}

export default {
  name: 'SettingStatus',
  components: {
    AppSectionHero,
    ManagementTableBase,
    StatusFormModal
  },
  data () {
    return {
      showModal: false,
      lastUpdatedAt: null,
      draft: createEmptyDraft(),
      selectedItem: null,
      fields: [
        { key: 'groupName', label: 'Group' },
        { key: 'key', label: 'Key' },
        { key: 'titleTh', label: 'Title (TH)' },
        { key: 'titleEn', label: 'Title (EN)' },
        { key: 'descriptionTh', label: 'Description (TH)' },
        { key: 'descriptionEn', label: 'Description (EN)' },
        { key: 'state', label: 'State', _style: 'width: 180px; text-align: center;' },
        { key: 'actions', label: '#', _style: 'width: 120px; text-align: center;' }
      ]
    }
  },
  computed: {
    ...mapGetters({
      items: 'setting/settingStatus/items',
      groups: 'setting/settingStatus/groups'
    }),
    modalTitle () {
      return this.draft && this.draft._id ? 'Edit Status' : 'Create Status'
    },
    lastUpdatedLabel () {
      return formatDateTime24(this.lastUpdatedAt)
    }
  },
  created () {
    this.loadData()
  },
  methods: {
    loadData () {
      return this.$store.dispatch('setting/settingStatus/explorer')
        .then(() => { this.lastUpdatedAt = new Date() })
        .catch(() => {
          notifyError(this.$store, 'Failed to load status list.')
        })
    },
    handleInvalid (message) {
      notifyWarning(this.$store, message)
    },
    openCreateModal () {
      this.draft = Object.assign(createEmptyDraft(), {
        groupId: this.groups && this.groups[0] ? this.groups[0]._id : ''
      })
      this.showModal = true
    },
    openEditModal (item) {
      this.$store.dispatch('setting/settingStatus/toDraft', item)
        .then((draft) => {
          this.draft = draft
          this.showModal = true
        })
        .catch(() => {
          notifyError(this.$store, 'Cannot load selected status.')
        })
    },
    closeModal () {
      this.draft = Object.assign(createEmptyDraft(), {
        groupId: this.groups && this.groups[0] ? this.groups[0]._id : ''
      })
      this.showModal = false
    },
    saveItem (payload) {
      const action = payload && payload._id
        ? 'setting/settingStatus/update'
        : 'setting/settingStatus/create'

      return this.$store.dispatch(action, payload)
        .then(() => {
          notifySuccess(this.$store, payload && payload._id ? 'Status updated.' : 'Status created successfully.')
          this.closeModal()
        })
        .catch(() => {
          notifyError(this.$store, 'Cannot save status.')
        })
    },
    removeItem (item) {
      this.selectedItem = item
      return this.$store.dispatch('dialog/openConfirm', {
        title: 'Remove Status',
        message: 'Are you sure you want to remove this status?'
      }).then((confirmed) => {
        if (!confirmed) {
          this.selectedItem = null
          return
        }
        return this.confirmRemove()
      })
    },
    confirmRemove () {
      if (!this.selectedItem) return
      return this.$store.dispatch('setting/settingStatus/remove', this.selectedItem)
        .then(() => {
          notifyInfo(this.$store, 'Status removed.')
          this.selectedItem = null
        })
        .catch(() => {
          notifyError(this.$store, 'Cannot remove status.')
          this.selectedItem = null
        })
    }
  }
}
</script>
