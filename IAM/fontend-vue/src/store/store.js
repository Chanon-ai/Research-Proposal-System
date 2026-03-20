import Vue from "vue";
import Vuex from "vuex";
Vue.use(Vuex);

import DialogMessages from "./modules/Dialog/index";
import Setting from './modules/Setting/index'
import Auth from "./modules/Authen/index";
import Authentication from "./modules/Authentication/index";
import Security from "./modules/Security/index";
import Accounts from './modules/Accounts/index'
import Training from './modules/Training/index'
import Organization from './modules/organization/index'

const THEME_STORAGE_KEY = 'app-theme'

function getInitialDarkMode () {
  if (typeof window === 'undefined' || !window.localStorage) return false
  const saved = (window.localStorage.getItem(THEME_STORAGE_KEY) || '').toLowerCase()
  if (saved === 'dark') return true
  if (saved === 'light') return false
  return false
}


const state = {
  XAccessToken: '',
  sidebarShow: 'responsive',
  sidebarMinimize: false,
  asideShow: false,
  darkMode: getInitialDarkMode()
}

const mutations = {
  toggleSidebarDesktop (state) {
    const sidebarOpened = [true, 'responsive'].includes(state.sidebarShow)
    state.sidebarShow = sidebarOpened ? false : 'responsive'
  },
  toggleSidebarMobile (state) {
    const sidebarClosed = [false, 'responsive'].includes(state.sidebarShow)
    state.sidebarShow = sidebarClosed ? true : 'responsive'
  },
  set (state, [variable, value]) {
    state[variable] = value
  },
  toggle (state, variable) {
    state[variable] = !state[variable]
  },
  setThemeMode (state, theme) {
    const normalized = String(theme || '').toLowerCase() === 'dark' ? 'dark' : 'light'
    state.darkMode = normalized === 'dark'
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(THEME_STORAGE_KEY, normalized)
    }
  }
}


export default new Vuex.Store({
  state,
  mutations,
  modules : {
    dialog: DialogMessages,
    setting : Setting,
    //
    auth : Auth,
    Authentication,
    organization: Organization,
    security: Security,
    accounts: Accounts,
    training: Training,
  }
});
