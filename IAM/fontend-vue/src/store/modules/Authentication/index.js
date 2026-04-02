import Service from '../../../service/api.js';
import { removeItem } from '../../../utils/db';

const LEGACY_TOKEN_STORAGE_KEY = 'x-access-token';

const Authentication = {
  namespaced: true,
  state: {
    user: null,
    token: null,
    isAuthenticated: false
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user;
      state.isAuthenticated = !!state.token && !!user;
    },
    SET_TOKEN(state, token) {
      state.token = token;
      state.isAuthenticated = !!token && !!state.user;
    },
    SET_AUTH(state, { user, token }) {
      state.user = user;
      state.token = token;
      state.isAuthenticated = !!token && !!user;
    },
    CLEAR_AUTH(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    // Legacy shim: old dialog components commit 'auth/isSignIn'
    isSignIn(state, value) {
      if (!value) {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      }
    }
  },
  actions: {
    async login({ commit }, { email, password }) {
      const response = await Service.auth.login({ email, password });
      const payload = response.data && response.data.data ? response.data.data : {};
      const user = payload.user || null;
      const token = payload.token || null;

      commit('SET_AUTH', { user, token });
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));

      return { user, token };
    },

    async register({ commit }, data) {
      const response = await Service.auth.register(data);
      const payload = response.data && response.data.data ? response.data.data : {};
      const user = payload.user || null;
      const token = payload.token || null;

      commit('SET_AUTH', { user, token });
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));

      return { user, token };
    },

    async logout({ commit }) {
      try {
        await Service.auth.logout();
      } catch (err) {
        // Fire-and-forget logout endpoint.
      }

      try {
        await removeItem('objs');
      } catch (err) {
        // Ignore IndexedDB cleanup failures.
      }

      commit('CLEAR_AUTH');
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
      }

      commit('set', ['XAccessToken', ''], { root: true });
      commit('auth/authenticated', { isAuthen: false, isOAuth: false }, { root: true });
      commit('auth/profile', null, { root: true });
      commit('auth/isSignIn', true, { root: true });
      commit('auth/is2FA', false, { root: true });
      commit('auth/pendingToken', '', { root: true });
      commit('security/reset', null, { root: true });

      window.location.href = '/pages/research-login';
    },

    async restoreSession({ commit }) {
      const token = localStorage.getItem('auth_token');
      const userRaw = localStorage.getItem('auth_user');

      if (!token || !userRaw) {
        commit('CLEAR_AUTH');
        return null;
      }

      try {
        const response = await Service.auth.me();
        const user = response.data && response.data.data ? response.data.data : JSON.parse(userRaw);

        commit('SET_AUTH', { user, token });
        localStorage.setItem('auth_user', JSON.stringify(user));
        return user;
      } catch (err) {
        commit('CLEAR_AUTH');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        return null;
      }
    }
  },
  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    // Legacy aliases used by old dialog components
    isSignIn: (state) => !!state.token && !!state.user,
    is2FA: () => false,
    currentUser: (state) => state.user,
    userRole: (state) => (state.user ? state.user.role : null),
    isAdmin: (state) => !!state.user && state.user.role === 'admin',
    isMFUStaff: (state) => !!state.user && !!state.user.isMFUStaff
  }
};

export default Authentication;
