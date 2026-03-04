<template>
  <div class="account-page">
    <AppSectionHero
      title="Account Directory"
      subtitle="Review profile details, manage lifecycle status, and keep account records current."
      :stats="heroStats"
      :meta-label="'Last updated'"
      :meta-value="lastUpdatedLabel"
      @refresh="loadData"
    />

    <AccountDirectoryTable
      :items="items"
      @access="openPermissionsModal"
      @edit="openEditModal"
      @remove="removeItem"
    />

    <EditAccountModal
      :show.sync="showEditModal"
      :value="selectedAccount"
      :status-options="statusOptions"
      :group-options="groupOptions"
      @submit="saveAccount"
      @cancel="closeEditModal"
    />

    <AccountPermissionsModal
      :show.sync="showPermissionsModal"
      :groups="accessGroups"
      :permissions="accessPermissions"
      @close="closePermissionsModal"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import AppSectionHero from '@/projects/components/layout/AppSectionHero'
import AccountDirectoryTable from './components/AccountDirectoryTable'
import EditAccountModal from './EditAccountModal'
import AccountPermissionsModal from './AccountPermissionsModal'
import { notifyError, notifyInfo, notifySuccess } from '@/projects/utils/notify'

export default {
  name: 'AccountManagement',
  components: { AppSectionHero, AccountDirectoryTable, EditAccountModal, AccountPermissionsModal },
  data () {
    return {
      showEditModal: false,
      showPermissionsModal: false,
      selectedAccount: null
    }
  },
  computed: {
    ...mapGetters({
      items: 'accounts/items',
      statusOptions: 'accounts/statusOptions',
      groupOptions: 'accounts/groupOptions',
      lastUpdatedLabel: 'accounts/lastUpdatedLabel',
      accessGroups: 'accounts/accessGroups',
      accessPermissions: 'accounts/accessPermissions'
    }),
    activeCount () {
      return this.items.filter(item => item && item.statusKey === 'ACTIVE').length
    },
    attentionCount () {
      return this.items.filter(item => item && ['LOCKED', 'SUSPENDED', 'PENDING'].includes(item.statusKey)).length
    },
    heroStats () {
      return [
        { label: 'Total Accounts', value: this.items.length, hint: 'All profiles in the current directory', icon: 'cil-people', iconClass: 'app-section-stat__icon--total' },
        { label: 'Active', value: this.activeCount, hint: 'Ready for sign-in and access', icon: 'cil-check-circle', iconClass: 'app-section-stat__icon--active' },
        { label: 'Attention Needed', value: this.attentionCount, hint: 'Pending, locked, or suspended', icon: 'cil-warning', iconClass: 'app-section-stat__icon--attention' }
      ]
    }
  },
  created () {
    this.loadData()
  },
  methods: {
    async loadData () {
      try {
        await this.$store.dispatch('accounts/explorer')
      } catch (error) {
        notifyError(this.$store, 'Failed to load accounts.')
      }
    },
    openEditModal (item) {
      this.selectedAccount = item
      this.showEditModal = true
    },
    async openPermissionsModal (item) {
      if (!(item && item._id)) return
      try {
        await this.$store.dispatch('accounts/fetchAccessReview', item._id)
        this.selectedAccount = item
        this.showPermissionsModal = true
      } catch (error) {
        notifyError(this.$store, 'Cannot load effective permissions.')
      }
    },
    closePermissionsModal () {
      this.showPermissionsModal = false
      this.selectedAccount = null
      this.$store.commit('accounts/clearAccessReview')
    },
    removeItem (item) {
      if (!(item && item._id)) return
      this.selectedAccount = item
      return this.$store.dispatch('dialog/openConfirm', {
        title: 'Remove Account',
        message: `Are you sure you want to remove ${item.fullName || 'this account'}? This will archive the account instead of deleting the record.`,
        confirmText: 'Remove',
        cancelText: 'Cancel',
        confirmIcon: 'cil-trash'
      }).then((confirmed) => {
        if (!confirmed) {
          this.selectedAccount = null
          return
        }
        return this.confirmRemove()
      })
    },
    async confirmRemove () {
      if (!(this.selectedAccount && this.selectedAccount._id)) return
      try {
        await this.$store.dispatch('accounts/archive', this.selectedAccount._id)
        notifyInfo(this.$store, 'Account removed.')
        this.selectedAccount = null
      } catch (error) {
        notifyError(this.$store, 'Cannot remove account.')
        this.selectedAccount = null
      }
    },
    closeEditModal () {
      this.showEditModal = false
      this.selectedAccount = null
    },
    async saveAccount (payload) {
      if (!(payload && payload._id)) return
      try {
        await this.$store.dispatch('accounts/update', payload)
        notifySuccess(this.$store, 'Account updated.')
        this.closeEditModal()
      } catch (error) {
        notifyError(this.$store, 'Cannot update account.')
      }
    }
  }
}
</script>

<style scoped lang="scss">
.account-page {}
</style>
