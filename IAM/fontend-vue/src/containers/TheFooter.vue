<template>
  <CFooter v-if="!hideForResearchModule" :fixed="false">
    <div>
      <a href="https://coreui.io" target="_blank">CoreUI</a>
      <span class="ml-1">&copy; {{new Date().getFullYear()}} creativeLabs.</span>
    </div>
    <div class="ml-auto">
      <span class="mr-1" target="_blank">Powered by</span>
      <a href="https://coreui.io/vue">CoreUI for Vue</a>
    </div>
  </CFooter>
</template>

<script>
export default {
  name: 'TheFooter',
  computed: {
    hideForResearchModule () {
      const route = this.$route || {}
      const directMeta = route.meta && route.meta.appAuth === 'research'
      const matched = Array.isArray(route.matched) ? route.matched : []
      const matchedMeta = matched.some(record => record && record.meta && record.meta.appAuth === 'research')
      return directMeta || matchedMeta
    }
  }
}
</script>
