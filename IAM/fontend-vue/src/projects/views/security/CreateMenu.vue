<template>
  <div class="security-page">
    <AppSectionHero
      title="Create Menu"
      subtitle="Manage menu types, register navigable paths, and keep the permission catalog aligned."
      :stats="heroStats"
      :meta-label="'Last updated'"
      :meta-value="lastUpdatedLabel"
      @refresh="loadData"
    />
    <CRow>
      <CCol md="4" col="12">
        <TypeManagementTable
          :items="typesTableItems"
          :fields="typeFields"
          @add="openCreateTypeModal"
          @edit="openEditTypeModal"
          @remove="removeType"
        />
      </CCol>

      <CCol md="8" col="12">
        <MenuManagementTable
          :items="menuTableItems"
          :fields="menuFields"
          @add="openCreateMenuModal"
          @edit="openEditMenuModal"
          @remove="removeMenu"
        />
      </CCol>

      <MenuFormModal
        :show.sync="menuModal"
        :title="menuDraft._id ? 'Edit Menu' : 'Create Menu'"
        :value="menuDraft"
        :type-options="menuTypeOptions"
        @submit="saveMenu"
        @invalid="handleInvalid"
        @cancel="closeMenuModal"
      />

      <TypeFormModal
        :show.sync="typeModal"
        :title="typeDraft._id ? 'Edit Type' : 'Add Type'"
        :value="typeDraft"
        @submit="saveType"
        @invalid="handleInvalid"
        @cancel="closeTypeModal"
      />
    </CRow>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import TypeManagementTable from '@/projects/views/security/components/TypeManagementTable'
import MenuManagementTable from '@/projects/views/security/components/MenuManagementTable'
import MenuFormModal from '@/projects/views/security/components/MenuFormModal'
import TypeFormModal from '@/projects/views/security/components/TypeFormModal'
import AppSectionHero from '@/projects/components/layout/AppSectionHero'
import { formatDateTime24 } from '@/projects/utils/date-time'
import { notifyError, notifyInfo, notifySuccess, notifyWarning } from '@/projects/utils/notify'
import { normalizeOrDefault } from '@/projects/views/security/components/security-multilang.shared'
import { getTextByLanguage } from '@/store/modules/Security/shared'

const createTypeDraft = () => ({
  _id: null,
  title: normalizeOrDefault([]),
  state: true
})

const createMenuDraft = (defaultTypeId = '') => ({
  _id: null,
  title: normalizeOrDefault([]),
  description: normalizeOrDefault([]),
  path: '',
  typeId: defaultTypeId,
  state: true
})

export default {
  name: 'CreateMenu',
  components: {
    AppSectionHero,
    TypeManagementTable,
    MenuManagementTable,
    MenuFormModal,
    TypeFormModal
  },
  data () {
    return {
      menuModal: false,
      typeModal: false,
      typeFields: [
        { key: 'name', label: 'Type' },
        { key: 'stateLabel', label: 'Status' },
        { key: 'actions', label: '', _style: 'width: 200px; text-align: center;' }
      ],
      menuFields: [
        { key: 'name', label: 'Menu Title' },
        { key: 'descriptionText', label: 'Description' },
        { key: 'path', label: 'Path' },
        { key: 'typeName', label: 'Type' },
        { key: 'stateLabel', label: 'Status' },
        { key: 'actions', label: '', _style: 'width: 200px; text-align: center;' }
      ],
      lastUpdatedAt: null,
      menuDraft: createMenuDraft(),
      typeDraft: createTypeDraft()
    }
  },
  computed: {
    ...mapGetters({
      types: 'security/menu/types',
      menus: 'security/menu/menus',
      currentLang: 'setting/lang'
    }),
    heroStats () {
      return [
        { label: 'Types', value: this.types.length, icon: 'cil-layers', iconClass: 'security-stat__icon--primary' },
        { label: 'Menus', value: this.menus.length, icon: 'cil-list', iconClass: 'security-stat__icon--success' },
        { label: 'Mapped', value: this.menus.filter(item => item && item.source === 'mapped').length, icon: 'cil-link', iconClass: 'security-stat__icon--warning' }
      ]
    },
    menuTypeOptions () {
      return this.types.map(type => ({
        value: type._id,
        label: getTextByLanguage(type.title, this.currentLang) || type.name
      }))
    },
    lastUpdatedLabel () {
      return formatDateTime24(this.lastUpdatedAt)
    },
    typesTableItems () {
      return this.types.map(type => ({
        _id: type._id,
        name: getTextByLanguage(type.title, this.currentLang) || type.name
      }))
    },
    menuTableItems () {
      return this.menus.map(menu => ({
        ...menu,
        name: getTextByLanguage(menu.title, this.currentLang) || menu.name,
        descriptionText: getTextByLanguage(menu.description, this.currentLang) || menu.descriptionText,
        typeName: this.resolveTypeName(menu.typeId)
      }))
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
    handleInvalid (message) {
      notifyWarning(this.$store, message)
    },
    async loadData () {
      try {
        await this.$store.dispatch('security/menu/explorer')
        this.lastUpdatedAt = new Date()
      } catch (err) {
        notifyError(this.$store, 'Failed to load security data.')
      }
    },
    openCreateTypeModal () {
      this.typeDraft = createTypeDraft()
      this.typeModal = true
    },
    openEditTypeModal (type) {
      this.typeDraft = {
        _id: type._id,
        title: normalizeOrDefault(type && type.title),
        state: typeof type.state === 'boolean' ? type.state : true
      }
      this.typeModal = true
    },
    async saveType (payload) {
      try {
        if (payload._id) {
          await this.$store.dispatch('security/menu/updateType', payload)
          notifySuccess(this.$store, 'Type updated.')
        } else {
          await this.$store.dispatch('security/menu/createType', payload)
          notifySuccess(this.$store, 'Type created successfully.')
        }
        this.closeTypeModal()
      } catch (err) {
        notifyError(this.$store, 'Cannot save type.')
      }
    },
    async removeType (type) {
      try {
        await this.$store.dispatch('security/menu/removeType', type)
        notifyInfo(this.$store, 'Type removed.')
      } catch (err) {
        notifyWarning(this.$store, 'Cannot remove type in use.')
      }
    },
    openCreateMenuModal () {
      this.menuDraft = createMenuDraft(this.types[0] ? this.types[0]._id : '')
      this.menuModal = true
    },
    openEditMenuModal (menu) {
      if (menu.source === 'mapped') {
        notifyWarning(this.$store, 'Mapped menu cannot be edited.')
        return
      }
      this.menuDraft = {
        _id: menu._id,
        title: normalizeOrDefault(menu && menu.title),
        description: normalizeOrDefault(menu && menu.description),
        path: menu.path,
        typeId: menu.typeId,
        state: typeof menu.state === 'boolean' ? menu.state : true
      }
      this.menuModal = true
    },
    async saveMenu (payload) {
      try {
        if (payload._id) {
          await this.$store.dispatch('security/menu/updateMenu', payload)
          notifySuccess(this.$store, 'Menu updated.')
        } else {
          await this.$store.dispatch('security/menu/createMenu', payload)
          notifySuccess(this.$store, 'Menu created successfully.')
        }
        this.closeMenuModal()
      } catch (err) {
        notifyError(this.$store, 'Cannot save menu.')
      }
    },
    async removeMenu (menu) {
      if (menu.source === 'mapped') {
        notifyWarning(this.$store, 'Mapped menu cannot be removed.')
        return
      }
      try {
        await this.$store.dispatch('security/menu/removeMenu', menu)
        notifyInfo(this.$store, 'Menu removed.')
      } catch (err) {
        notifyError(this.$store, 'Cannot remove menu.')
      }
    },
    closeMenuModal () {
      this.menuDraft = createMenuDraft(this.types[0] ? this.types[0]._id : '')
      this.menuModal = false
    },
    closeTypeModal () {
      this.typeDraft = createTypeDraft()
      this.typeModal = false
    }
  }
}
</script>

<style scoped lang="scss">
@import "./security-page.shared";
</style>
