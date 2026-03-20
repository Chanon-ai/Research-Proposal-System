<template>
  <CDropdown
    inNav
    class="c-header-nav-items"
    placement="bottom-end"
    :add-menu-classes="menuClasses"
  >
    <template #toggler>
      <CHeaderNavLink>
        <div class="c-avatar">
          <img src="@/assets/avatars/1.jpg"  class="c-avatar-img" style="height: 100%"/>
<!--          <img :src="profile.userinfo.imageProfile.src" class="c-avatar-img" style="height: 100%"/>-->
        </div>
      </CHeaderNavLink>
    </template>
    <CDropdownHeader tag="div" class="account-dropdown-header">
      <strong>{{ $t('nav.userPanel') }}</strong>
    </CDropdownHeader>

    <CDropdownItem
      v-if="showUserMenu"
      class="account-dropdown-item"
      :class="{ active: isActiveRoute('/user/profile') }"
      @click="goTo('/user/profile')"
    >
      <CIcon name="cil-user" /> {{ $t('nav.profile') }}
    </CDropdownItem>

    <CDropdownItem
      v-if="showUserMenu"
      class="account-dropdown-item"
      :class="{ active: isActiveRoute('/user/history') }"
      @click="goTo('/user/history')"
    >
      <CIcon name="cil-history" /> {{ $t('nav.history') }}
    </CDropdownItem>

    <CDropdownDivider/>
    <CDropdownItem @click="onLogout">
      <CIcon name="cil-account-logout" /> Logout
    </CDropdownItem>
  </CDropdown>
</template>

<script>
export default {
  name: 'TheHeaderDropdownAccnt',

  computed: {
    isDarkTheme () {
      return Boolean(this.$store && this.$store.state && this.$store.state.darkMode)
    },

    menuClasses () {
      return this.isDarkTheme
        ? 'pt-0 mt-2 account-menu account-menu--dark'
        : 'pt-0 mt-2 account-menu'
    },

    currentRole () {
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

    showUserMenu () {
      return ['researcher', 'admin', 'chairman'].includes(this.currentRole)
    }
  },

  methods: {
    isActiveRoute (targetPath) {
      return this.$route && this.$route.path === targetPath
    },

    goTo (targetPath) {
      if (this.$route && this.$route.path === targetPath) return
      this.$router.push(targetPath)
    },

    async onLogout() {
      try {
        await this.$store.dispatch('Authentication/logout')
      } catch (e) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        window.location.href = '/pages/research-login'
      }
    }
  }
}
</script>

<style scoped>
.c-icon {
  margin-right: 0.45rem;
}

.c-header-nav .dropdown-item {
  min-width: 230px;
}

.account-dropdown-header {
  padding: 0.7rem 1rem;
}

.account-dropdown-item {
  display: flex;
  align-items: center;
  padding-top: 0.6rem;
  padding-bottom: 0.6rem;
}

.account-menu {
  border-radius: 0.5rem;
  border: 1px solid rgba(60, 75, 100, 0.15);
}

.account-menu.account-menu--dark {
  background: #2d2f34;
  border-color: rgba(255, 255, 255, 0.12);
}

.account-menu.account-menu--dark .dropdown-header,
.account-menu.account-menu--dark .dropdown-item {
  color: #e6e7eb;
}

.account-menu.account-menu--dark .dropdown-item:hover,
.account-menu.account-menu--dark .dropdown-item:focus,
.account-menu.account-menu--dark .dropdown-item.active {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.account-menu.account-menu--dark .dropdown-divider {
  border-top-color: rgba(255, 255, 255, 0.12);
}
</style>
