import Service from "@/service/api";
import menu from './menu'
import group from './group'
import permissionMatrix from './permission-matrix'

const ServerModule = {
  namespaced: true,
  modules: {
    menu,
    group,
    permissionMatrix
  },
  state: {
    matrix: {},
    assignments: [],
    permissions: [],
    loaded: false,
    loading: false
  },
  mutations: {
    setLoading(state, value) {
      state.loading = value;
    },
    setMyPermissions(state, payload) {
      state.matrix = payload && payload.matrix ? payload.matrix : {};
      state.assignments = payload && payload.assignments ? payload.assignments : [];
      state.permissions = payload && payload.permissions ? payload.permissions : [];
      state.loaded = true;
    },
    reset(state) {
      state.matrix = {};
      state.assignments = [];
      state.permissions = [];
      state.loaded = false;
      state.loading = false;
    }
  },
  actions: {
    async fetchMyPermissions({ state, commit }, params = {}) {
      if (state.loading) return;
      commit('setLoading', true);
      try {
        const response = await Service.security('my-permissions', params);
        const data = response && response.data && response.data.data ? response.data.data : {};
        commit('setMyPermissions', data);
      } finally {
        commit('setLoading', false);
      }
    }
  },
  getters: {
    matrix(state) {
      return state.matrix;
    },
    loaded(state) {
      return state.loaded;
    },
    canAccess: (state) => (path, action = 'view') => {
      if (!path) return true;
      const rule = state.matrix[path];
      if (!rule) return false;
      return !!(rule.all || rule[action]);
    }
  }
};

export default ServerModule;
