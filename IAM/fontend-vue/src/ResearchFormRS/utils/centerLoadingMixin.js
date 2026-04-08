export default {
  computed: {
    centerLoadingActive () {
      return false
    }
  },
  watch: {
    centerLoadingActive: {
      immediate: true,
      handler (next) {
        this.setCenterLoading(next)
      }
    }
  },
  beforeDestroy () {
    this.setCenterLoading(false)
  },
  methods: {
    setCenterLoading (enabled) {
      if (!this.$store || typeof this.$store.commit !== 'function') return
      this.$store.commit('dialog/loading', Boolean(enabled))
    }
  }
}