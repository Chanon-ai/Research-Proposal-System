<template>
  <CDropdown
    placement="bottom-end"
    :caret="false"
    in-nav
    class="c-header-nav-item mx-1"
  >
    <template #toggler>
      <CHeaderNavLink class="header-switch-link">
        <CIcon :name="currentTheme === 'dark' ? 'cil-moon' : 'cil-sun'" size="lg"/>
      </CHeaderNavLink>
    </template>

    <CDropdownHeader tag="div" class="text-center bg-light">
      <strong>{{ $t('header.theme') }}</strong>
    </CDropdownHeader>

    <CDropdownItem
      class="theme-item"
      :class="{ active: currentTheme === 'light' }"
      @click="setTheme('light')"
    >
      <CIcon name="cil-sun" class="mr-2"/>
      <span class="mr-auto">{{ $t('theme.light') }}</span>
      <CIcon v-if="currentTheme === 'light'" name="cil-check"/>
    </CDropdownItem>

    <CDropdownItem
      class="theme-item"
      :class="{ active: currentTheme === 'dark' }"
      @click="setTheme('dark')"
    >
      <CIcon name="cil-moon" class="mr-2"/>
      <span class="mr-auto">{{ $t('theme.dark') }}</span>
      <CIcon v-if="currentTheme === 'dark'" name="cil-check"/>
    </CDropdownItem>
  </CDropdown>
</template>

<script>
export default {
  name: 'TheHeaderDropdownTheme',
  computed: {
    currentTheme () {
      return this.$store.state.darkMode ? 'dark' : 'light'
    }
  },
  watch: {
    currentTheme (theme) {
      this.applyTheme(theme)
    }
  },
  mounted () {
    this.applyTheme(this.currentTheme)
  },
  methods: {
    setTheme (theme) {
      this.$store.commit('setThemeMode', theme)
      this.applyTheme(theme)
    },
    applyTheme (theme) {
      if (typeof document === 'undefined') return
      const normalized = theme === 'dark' ? 'dark' : 'light'
      document.documentElement.setAttribute('data-coreui-theme', normalized)
      document.body.setAttribute('data-coreui-theme', normalized)
      document.body.classList.toggle('c-dark-theme', normalized === 'dark')
    }
  }
}
</script>

<style scoped>
.header-switch-link {
  padding: 0.35rem 0.45rem;
}

.theme-item {
  display: flex;
  align-items: center;
  min-width: 180px;
  gap: 8px;
}
</style>
