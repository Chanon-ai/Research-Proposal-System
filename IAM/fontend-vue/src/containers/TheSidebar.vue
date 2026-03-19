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
    <CSidebarMinimizer
        class="c-d-md-down-none"
        @click.native="$store.commit('toggle', 'sidebarMinimize')"
    />
  </CSidebar>
</template>

<script>
import nav from './_nav'

export default {
  name: 'TheSidebar',
  computed: {
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
      if (!role) return nav

      const filterByRole = (items) => {
        return (items || []).reduce((acc, item) => {
          if (item.roles && !item.roles.includes(role)) {
            return acc
          }

          const next = { ...item }
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

      return nav.map(section => {
        if (!section || !Array.isArray(section._children)) return section
        return {
          ...section,
          _children: filterByRole(section._children)
        }
      })
    }
  },
  data() {
    return {
    }
  }
}
</script>

<style>
.bg-style1{
  background: linear-gradient(30deg,#FEC260 0%,#8c1515 60%);
}
</style>
