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
          <img :src="avatarSrc" class="c-avatar-img" style="height: 100%" @error="onAvatarError"/>
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
  data() {
    return {
      defaultAvatarSrc: require('@/assets/avatars/1.jpg'),
      avatarLoadFailed: false,
      avatarBootstrapTried: false
    }
  },

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

    researchUser () {
      const fromStore = this.$store.getters['Authentication/currentUser']
      if (fromStore && typeof fromStore === 'object') return fromStore

      try {
        const raw = localStorage.getItem('auth_user')
        if (!raw) return null
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : null
      } catch (e) {
        return null
      }
    },

    legacyProfile () {
      const profile = this.$store.getters['auth/profile']
      return profile && typeof profile === 'object' ? profile : null
    },

    avatarHint () {
      try {
        const raw = localStorage.getItem('auth_avatar_hint')
        return raw && String(raw).trim() ? String(raw).trim() : ''
      } catch (e) {
        return ''
      }
    },

    rawAvatarSrc () {
      const legacyProfileImage = this.legacyProfile && this.legacyProfile.userinfo && this.legacyProfile.userinfo.image
      const legacyProfileImageNested = this.legacyProfile
        && this.legacyProfile.userinfo
        && this.legacyProfile.userinfo.imageProfile
        && this.legacyProfile.userinfo.imageProfile.src

      const candidates = [
        this.researchUser && this.researchUser.avatarUrl,
        this.researchUser && this.researchUser.avatar,
        this.researchUser && this.researchUser.picture,
        this.researchUser && this.researchUser.image,
        this.researchUser && this.researchUser.photo,
        this.researchUser && this.researchUser.photoURL,
        this.researchUser && this.researchUser.profileImage,
        this.researchUser && this.researchUser.profileImageUrl,
        this.researchUser && this.researchUser.userinfo && this.researchUser.userinfo.image,
        this.researchUser && this.researchUser.userinfo && this.researchUser.userinfo.imageProfile && this.researchUser.userinfo.imageProfile.src,
        this.legacyProfile && this.legacyProfile.avatarUrl,
        this.legacyProfile && this.legacyProfile.avatar,
        this.legacyProfile && this.legacyProfile.picture,
        this.legacyProfile && this.legacyProfile.photo,
        legacyProfileImage,
        legacyProfileImageNested,
        this.avatarHint
      ]

      const found = candidates.find(item => typeof item === 'string' && item.trim())
      return this.normalizeAvatarUrl(found || '')
    },

    avatarSrc () {
      if (this.avatarLoadFailed) {
        return this.defaultAvatarSrc
      }
      return this.rawAvatarSrc || this.defaultAvatarSrc
    },

    showUserMenu () {
      return ['researcher', 'admin', 'chairman', 'finance_officer'].includes(this.currentRole)
    }
  },

  watch: {
    rawAvatarSrc (value) {
      this.avatarLoadFailed = false
      if (!value) {
        this.tryBootstrapLegacyProfile()
      }
    }
  },

  mounted () {
    this.tryBootstrapLegacyProfile()
  },

  methods: {
    getApiBaseUrl () {
      const raw = process.env.VUE_APP_API_BASE_URL || process.env.VUE_APP_API_URL || ''
      return String(raw || '').trim().replace(/\/+$/, '')
    },

    normalizeAvatarUrl (value) {
      const raw = String(value || '').trim()
      if (!raw) return ''

      if (/^data:/i.test(raw) || /^blob:/i.test(raw)) {
        return raw
      }

      if (/^https?:\/\//i.test(raw)) {
        return raw
      }

      if (raw.startsWith('//')) {
        const protocol = (typeof window !== 'undefined' && window.location && window.location.protocol)
          ? window.location.protocol
          : 'https:'
        return `${protocol}${raw}`
      }

      const baseUrl = this.getApiBaseUrl()
      if (!baseUrl) return raw

      if (raw.startsWith('/')) {
        return `${baseUrl}${raw}`
      }

      return `${baseUrl}/${raw.replace(/^\.?\//, '')}`
    },

    hasLegacyToken () {
      const fromStore = this.$store && this.$store.state ? this.$store.state.XAccessToken : ''
      if (fromStore && String(fromStore).trim()) return true

      try {
        const fromLocalStorage = localStorage.getItem('x-access-token')
        return !!(fromLocalStorage && String(fromLocalStorage).trim())
      } catch (e) {
        return false
      }
    },

    async tryBootstrapLegacyProfile () {
      if (this.rawAvatarSrc) return
      if (this.avatarBootstrapTried) return
      if (!this.hasLegacyToken()) return
      if (this.legacyProfile) return

      this.avatarBootstrapTried = true
      try {
        await this.$store.dispatch('auth/bootstrapSession')
      } catch (e) {
        // Ignore avatar fallback failures to avoid blocking the UI.
      }
    },

    onAvatarError () {
      this.avatarLoadFailed = true
    },

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
        window.location.href = '/pages/login'
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
