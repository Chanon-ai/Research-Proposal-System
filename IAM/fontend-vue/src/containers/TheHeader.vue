<template>
  <CHeader with-subheader>
    <CToggler
      in-header
      class="ml-3 d-lg-none"
      @click="$store.commit('toggleSidebarMobile')"
    />
    <CToggler
      in-header
      class="ml-3 d-md-down-none"
      @click="$store.commit('toggleSidebarDesktop')"
    />
    <CHeaderBrand class="mx-auto d-lg-none" to="/">
<!--      <img src="@/assets/logo.svg" height="48"/>-->
    </CHeaderBrand>
    <CHeaderNav class="d-md-down-none mr-auto">
<!--      <CHeaderNavItem class="px-3">-->
<!--        <CHeaderNavLink to="/dashboard">-->
<!--          Dashboard-->
<!--        </CHeaderNavLink>-->
<!--      </CHeaderNavItem>-->
<!--      <CHeaderNavItem class="px-3">-->
<!--        <CHeaderNavLink to="/users" exact>-->
<!--          Users-->
<!--        </CHeaderNavLink>-->
<!--      </CHeaderNavItem>-->
<!--      <CHeaderNavItem class="px-3">-->
<!--        <CHeaderNavLink>-->
<!--          settings-->
<!--        </CHeaderNavLink>-->
<!--      </CHeaderNavItem>-->
    </CHeaderNav>
    <CHeaderNav>
<!--      <CHeaderNavItem class="px-3">-->
<!--        <button-->
<!--          @click="() => $store.commit('toggle', 'darkMode')"-->
<!--          class="c-header-nav-btn"-->
<!--        >-->
<!--          <CIcon v-if="$store.state.darkMode" name="cil-sun"/>-->
<!--          <CIcon v-else name="cil-moon"/>-->
<!--        </button>-->
<!--      </CHeaderNavItem>-->
<!--      <TheHeaderDropdownNotif/>-->
<!--      <TheHeaderDropdownTasks/>-->
<!--      <TheHeaderDropdownMssgs/>-->
<!--      <TheHeaderDropdownAccnt/>-->
<!--      <CHeaderNavItem class="px-3">-->
<!--        <button-->
<!--          in-header-->
<!--          class="c-header-nav-btn"-->
<!--          @click="$store.commit('toggle', 'asideShow')"-->
<!--        >-->
<!--          <CIcon size="lg" name="cil-applications-settings" class="mr-2"/>-->
<!--        </button>-->
<!--      </CHeaderNavItem>-->
      <CHeaderNavItem >
        <CButton size="sm" color="info" shape="pill" variant="outline" style="width: 35px; height:35px;" @click="onSwitchLang" >
          {{lang.toUpperCase()}}
        </CButton>
      </CHeaderNavItem>

      <CHeaderNavItem class="position-relative ml-2">
        <CButton class="c-header-nav-btn" @click="$router.push('/user/notification')">
          <CBadge
            v-if="unreadCount > 0"
            color="danger"
            shape="pill"
            style="position:absolute;top:6px;right:6px;font-size:10px;min-width:16px;padding:2px 4px"
          >
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </CBadge>
          <CIcon name="cil-bell" size="lg"/>
        </CButton>
      </CHeaderNavItem>

      <TheHeaderDropdownAccnt class="pr-3"/>
    </CHeaderNav>

<!--    <CSubheader class="px-3">-->
<!--      <CBreadcrumbRouter class="border-0 mb-0"/>-->
<!--    </CSubheader>-->
  </CHeader>
</template>

<script>
import TheHeaderDropdownAccnt from './TheHeaderDropdownAccnt'
import TheHeaderDropdownNotif from './TheHeaderDropdownNotif'
import TheHeaderDropdownTasks from './TheHeaderDropdownTasks'
import TheHeaderDropdownMssgs from './TheHeaderDropdownMssgs'
import {mapGetters} from "vuex";
import Service from '@/service/api'

export default {
  name: 'TheHeader',
  components: {
    TheHeaderDropdownAccnt,
    TheHeaderDropdownNotif,
    TheHeaderDropdownTasks,
    TheHeaderDropdownMssgs
  },
  data() {
    return {
      unreadCount: 0
    }
  },
  async mounted() {
    await this.fetchUnreadCount()
  },

  methods: {
    async fetchUnreadCount() {
      try {
        const res = await Service.notification.list({ isRead: false, limit: 1 })
        this.unreadCount = res && res.data && res.data.data && res.data.data.total
          ? Number(res.data.data.total)
          : 0
      } catch (e) {
        this.unreadCount = 0
      }
    },
    onSwitchLang(){
      switch (this.lang) {
        case "th":
          this.$store.commit("setting/lang", "en")
          break;
        case "en":
          this.$store.commit("setting/lang", "th")
          break;
      }
    }
  },

  computed: {
    ...mapGetters({
      lang: "setting/lang",
    })
  },
}
</script>
