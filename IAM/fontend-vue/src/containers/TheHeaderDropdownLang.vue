<template>
  <CDropdown
    placement="bottom-end"
    :caret="false"
    in-nav
    class="c-header-nav-item mx-1"
  >
    <template #toggler>
      <CHeaderNavLink class="header-switch-link">
        <CIcon name="cil-globe-alt" size="lg"/>
      </CHeaderNavLink>
    </template>

    <CDropdownHeader tag="div" class="text-center bg-light">
      <strong>{{ $t('header.language') }}</strong>
    </CDropdownHeader>

    <CDropdownItem
      class="lang-item"
      :class="{ active: currentLanguage === 'th' }"
      @click="setLanguage('th')"
    >
      <span class="flag mr-2">🇹🇭</span>
      <span class="mr-auto">{{ $t('lang.th') }}</span>
      <CIcon v-if="currentLanguage === 'th'" name="cil-check"/>
    </CDropdownItem>

    <CDropdownItem
      class="lang-item"
      :class="{ active: currentLanguage === 'en' }"
      @click="setLanguage('en')"
    >
      <span class="flag mr-2">🇬🇧</span>
      <span class="mr-auto">{{ $t('lang.en') }}</span>
      <CIcon v-if="currentLanguage === 'en'" name="cil-check"/>
    </CDropdownItem>
  </CDropdown>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'TheHeaderDropdownLang',
  computed: {
    ...mapGetters({
      currentLanguage: 'setting/lang'
    })
  },
  methods: {
    setLanguage (lang) {
      this.$store.commit('setting/lang', lang)
    }
  }
}
</script>

<style scoped>
.header-switch-link {
  padding: 0.35rem 0.45rem;
}

.lang-item {
  display: flex;
  align-items: center;
  min-width: 180px;
  gap: 8px;
}

.flag {
  font-size: 16px;
  width: 18px;
  text-align: center;
}
</style>
