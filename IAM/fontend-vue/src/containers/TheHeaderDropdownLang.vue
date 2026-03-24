<template>
  <CHeaderNavItem class="c-header-nav-item mx-1">
    <button
      type="button"
      class="c-header-nav-btn header-switch-link"
      :class="{ 'is-animating': isAnimating }"
      :title="$t('header.language')"
      @click="toggleLanguage"
      @animationend="isAnimating = false"
    >
      <CIcon name="cil-language" size="lg" class="switch-icon"/>
    </button>
  </CHeaderNavItem>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'TheHeaderDropdownLang',
  data () {
    return {
      isAnimating: false
    }
  },
  computed: {
    ...mapGetters({
      currentLanguage: 'setting/lang'
    })
  },
  methods: {
    toggleLanguage () {
      const next = this.currentLanguage === 'th' ? 'en' : 'th'
      this.isAnimating = false
      // ensure animation re-triggers on rapid clicks
      this.$nextTick(() => {
        this.isAnimating = true
      })
      this.$store.commit('setting/lang', next)
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
  animation: switchPop 220ms ease;
}

@keyframes switchPop {
  0% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: scale(1.18) rotate(10deg);
    opacity: 0.92;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}
</style>
