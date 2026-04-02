<template>
  <CSidebar
      class="bg-style1"
      :minimize="minimize"
      unfoldable
      :show="show"
      @update:show="(value) => $store.commit('set', ['sidebarShow', value])"
  >
    <CSidebarBrand class="d-md-down-none" >
<!--      <CIcon-->
<!--          class="c-sidebar-brand-full"-->
<!--          name="logo"-->
<!--          size="custom-size"-->
<!--          :height="35"-->
<!--          viewBox="0 0 556 134"-->
<!--      />-->
      <div class="c-sidebar-brand-full" >
        <a href="/">
          <CRow >
            <img class="pt-2 pb-2" src="@/assets/logo.svg" height="60px">
            <CCol class="text-white">
              <p class="font-weight-bold mb-0 mt-2 h5">MFU</p>
              <p class="font-weight-bold">Dashboard System</p>
            </CCol>
          </CRow>
        </a>

      </div>


      <!--      <img src="@/assets/logo.svg" height="48"/>-->
      <CIcon
          class="c-sidebar-brand-minimized"
          name="logo"
          size="custom-size"
          :height="35"
          viewBox="0 0 110 134"
      />
    </CSidebarBrand>
    <CRenderFunction flat :contentToRender="navs"/>
  </CSidebar>
</template>

<script>
import nav from './_nav'
import { mapGetters } from 'vuex'
import {
  createDefaultRolePageAccessConfig,
  isRoleAllowedForPath
} from '@/ResearchFormRS/utils/rolePageAccessConfig'
import {
  loadRolePageAccessRuntimeConfig,
  mapRoleForResearchAccess
} from '@/ResearchFormRS/utils/rolePageAccessRuntime'

export default {
  name: 'TheSidebar',
  data() {
    return {
      rolePageAccessConfig: createDefaultRolePageAccessConfig()
    }
  },
  mounted() {
    this.fetchRolePageAccessConfig()
  },
  computed: {
    ...mapGetters({
      currentLanguage: 'setting/lang'
    }),

    show() {
      return this.$store.state.sidebarShow
    },
    minimize() {
      return this.$store.state.sidebarMinimize
    },
    currentRole() {
      const storeRole = this.$store.getters['Authentication/userRole']
      if (storeRole) return storeRole

      try {
        const raw = localStorage.getItem('auth_user')
        if (!raw) return null
        const parsed = JSON.parse(raw)
        return parsed && parsed.role ? parsed.role : null
      } catch (e) {
        return null
      }
    },
    navs() {
      const role = this.currentRole
      const roleForAccess = mapRoleForResearchAccess(role)
      if (!role) return this.translateNavTree(nav)

      const filterByRole = (items) => {
        return (items || []).reduce((acc, item) => {
          if (typeof item === 'string') {
            acc.push(item)
            return acc
          }

          if (item.roles && !item.roles.includes(role)) {
            return acc
          }

          const next = { ...item }
          const targetPath = this.resolveNavTargetPath(next)
          if (
            targetPath &&
            roleForAccess &&
            !isRoleAllowedForPath(this.rolePageAccessConfig, targetPath, roleForAccess, { defaultAllow: true })
          ) {
            return acc
          }

          if (Array.isArray(next.items)) {
            next.items = filterByRole(next.items)
            if (next.items.length === 0 && !next.to) {
              return acc
            }
          }

          if (Array.isArray(next._children)) {
            next._children = filterByRole(next._children)
            if (next._children.length === 0 && !next.to) {
              return acc
            }
          }

          acc.push(next)
          return acc
        }, [])
      }

      const filtered = nav.map(section => {
        if (!section || !Array.isArray(section._children)) return section
        return {
          ...section,
          _children: filterByRole(section._children)
        }
      }).filter(section => (
        !section || !Array.isArray(section._children) || section._children.length > 0
      ))

      return this.translateNavTree(filtered)
    }
  },
  methods: {
    async fetchRolePageAccessConfig() {
      try {
        const config = await loadRolePageAccessRuntimeConfig()
        if (Array.isArray(config) && config.length > 0) {
          this.rolePageAccessConfig = config
        }
      } catch (error) {
        void error
      }
    },
    resolveNavTargetPath(item) {
      if (!item) return ''
      if (typeof item.to === 'string') return item.to
      if (item.to && typeof item.to === 'object' && typeof item.to.path === 'string') return item.to.path
      if (typeof item.route === 'string') return item.route
      return ''
    },
    translateLabel (label) {
      if (typeof label === 'string' && (label.startsWith('nav.') || label.startsWith('common.') || label.startsWith('header.'))) {
        return this.$t(label)
      }
      const map = {
        Dashboard: this.$t('nav.dashboard'),
        'User Panel': this.$t('nav.userPanel'),
        'User Dashboard': this.$t('nav.userDashboard'),
        Profile: this.$t('nav.profile'),
        History: this.$t('nav.history'),
        'Research Form': this.$t('nav.researchForm')
      }
      return map[label] || label
    },

    translateNavTree (items) {
      return (items || []).map(item => {
        if (!item) return item
        const next = { ...item }
        if (typeof next.name === 'string') {
          next.name = this.translateLabel(next.name)
        }
        if (Array.isArray(next.items)) {
          next.items = this.translateNavTree(next.items)
        }
        if (Array.isArray(next._children)) {
          next._children = next._children.map(child => {
            if (typeof child === 'string') return this.translateLabel(child)
            return this.translateNavTree([child])[0]
          })
        }
        return next
      })
    }
  }
}
</script>

<style>
.bg-style1{
  background: linear-gradient(30deg,#FEC260 0%,#8c1515 60%);
}
</style>
