import 'core-js/stable'
import Vue from 'vue'
import CoreuiVuePro from '@coreui/vue-pro'
// import CoreuiVuePro from '../node_modules/@coreui/vue-pro/src/index.js'
// import CoreuiVue from '@coreui/vue'
import App from './App'
import router from './router/index'
import { iconsSet as icons } from './assets/icons/icons.js'
import i18n from './i18n.js'
import store from "@/store/store";
import CSidebarNavDropdownTemplate from '@/components/coreui/CSidebarNavDropdownTemplate.vue'

// เพิ่มการ import CIcon และ CSS ของ CoreUI Icons
import { CIcon } from '@coreui/icons-vue'
Vue.component('CIcon', CIcon)
import '@coreui/icons/css/all.min.css'
import '@/projects/styles/global.scss'

import OtpInput from "@bachdgvn/vue-otp-input";
Vue.component("v-otp-input", OtpInput);

import VueQRCodeComponent from 'vue-qrcode-component'
Vue.component('qr-code', VueQRCodeComponent)

Vue.use(CoreuiVuePro)
// Custom dropdown renderer that supports mixed items (title/divider/nested dropdown).
Vue.component('CSidebarNavDropdownTemplate', CSidebarNavDropdownTemplate)
Vue.prototype.$log = console.log.bind(console)
import moment from 'moment'
Vue.prototype.moment = moment

import GAuth from 'vue-google-oauth2'
const gauthOption = {
  clientId: process.env.VUE_APP_CLIENTID || '225788483142-8pkg8on8nh60ao83ve33ff3lflv2ccvo.apps.googleusercontent.com',
  scope: process.env.VUE_APP_SCOPE || 'profile email',
  prompt: process.env.VUE_APP_PROMPT || 'select_account'
}
Vue.use(GAuth, gauthOption)

if (typeof document !== 'undefined') {
  document.title = 'researchproposal.mfu.ac.th'
  const initialTheme = store.state.darkMode ? 'dark' : 'light'
  document.documentElement.setAttribute('data-coreui-theme', initialTheme)
  document.body.setAttribute('data-coreui-theme', initialTheme)
  document.body.classList.toggle('c-dark-theme', initialTheme === 'dark')
}

new Vue({
  el: '#app',
  router,
  store,
  //CIcon component documentation: https://coreui.io/vue/docs/components/icon
  icons,
  i18n,
  template: '<App/>',
  components: {
    App
  }
})
