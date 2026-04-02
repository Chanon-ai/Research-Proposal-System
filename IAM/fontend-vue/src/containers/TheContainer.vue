<template>
  <div class="c-app" :class="{ 'c-dark-theme': $store.state.darkMode }">
    <TheSidebar/>
    <TheAside/>
    <CWrapper>
      <TheHeader/>
      <div class="c-body">
        <main class="c-main">
          <CContainer fluid>
            <transition name="fade">
              <router-view></router-view>
            </transition>
          </CContainer>
        </main>
        <TheFooter/>
      </div>
    </CWrapper>
    <SignIn/>
    <CenterLoading/>
    <DialogMessage/>
    <CenterToaster/>
    <CConfirmDialog />

  </div>
</template>

<script>
import TheSidebar from './TheSidebar'
import TheHeader from './TheHeader'
import TheFooter from './TheFooter'
import TheAside from './TheAside'
import {mapGetters} from "vuex";
import DialogMessage from "@/projects/components/dialog/DialogMessage.vue";
import CenterLoading from "@/projects/components/dialog/CenterLoading.vue";
import SignIn from "@/projects/components/dialog/SignIn.vue";
import CenterToaster from "@/projects/components/dialog/CenterToaster.vue";
import CConfirmDialog from "@/projects/components/dialog/CConfirmDialog.vue";
//
export default {
  name: 'TheContainer',
  components: {
    CConfirmDialog,
    CenterToaster,
    SignIn,
    CenterLoading,
    DialogMessage,
    TheSidebar,
    TheHeader,
    TheFooter,
    TheAside
  },

  async mounted() {
    const route = this.$route || {}
    const isResearchRoute = !!(route.meta && route.meta.appAuth === 'research')
    if (isResearchRoute) {
      this.$store.commit('auth/isSignIn', false)
      const isAuthenticated = !!this.$store.getters['Authentication/isAuthenticated']
      if (isAuthenticated) {
        return
      }

      const restored = await this.$store.dispatch('Authentication/restoreSession')
      if (!restored && this.$route && this.$route.path !== '/pages/research-login') {
        this.$router.replace('/pages/research-login')
      }
      return
    }
    await this.$store.dispatch('auth/bootstrapSession')
  },

  methods: {

  },
  computed: {
    ...mapGetters({
    })
  },

  watch: {

  }

}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
