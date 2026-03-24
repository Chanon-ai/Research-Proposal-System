<template>
  <CHeaderNavItem class="c-header-nav-item mx-1">
    <button
      type="button"
      class="c-header-nav-btn header-switch-link"
      :class="{ 'is-animating': isAnimating }"
      :title="$t('header.theme')"
      @click="toggleTheme"
      @animationend="isAnimating = false"
    >
      <transition name="switchFade" mode="out-in">
        <CIcon
          :key="currentTheme"
          :name="currentTheme === 'dark' ? 'cil-moon' : 'cil-sun'"
          size="lg"
          class="switch-icon"
        />
      </transition>
    </button>
  </CHeaderNavItem>
</template>

<script>
export default {
  name: 'TheHeaderDropdownTheme',
  data () {
    return {
      isAnimating: false,
      themeSwitchTimer: null
    }
  },
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
    toggleTheme () {
      const next = this.currentTheme === 'dark' ? 'light' : 'dark'
      this.isAnimating = false
      // ensure animation re-triggers on rapid clicks
      this.$nextTick(() => {
        this.isAnimating = true
      })
      this.$store.commit('setThemeMode', next)
    },
    applyTheme (theme) {
      if (typeof document === 'undefined') return
      const normalized = theme === 'dark' ? 'dark' : 'light'

      // Add a short-lived class to enable smoother CSS transitions.
      try {
        if (this.themeSwitchTimer) window.clearTimeout(this.themeSwitchTimer)
        document.body.classList.add('theme-switching')
        this.themeSwitchTimer = window.setTimeout(() => {
          document.body.classList.remove('theme-switching')
        }, 260)
      } catch (e) {
        // ignore
      }

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
  line-height: 1;
}

.switch-icon {
  will-change: transform, opacity;
}

.is-animating .switch-icon {
  animation: switchSpin 240ms ease;
}

.switchFade-enter-active,
.switchFade-leave-active {
  transition: opacity 140ms ease;
}

.switchFade-enter,
.switchFade-leave-to {
  opacity: 0.3;
}

@keyframes switchSpin {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(18deg) scale(1.12);
  }
  100% {
    transform: rotate(0deg) scale(1);
  }
}
</style>
