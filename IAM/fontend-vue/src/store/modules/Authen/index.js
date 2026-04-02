import store from "@/store/store";
import Service from "@/service/api";
import { setItem, getItem, removeItem } from '@/utils/db';
import router from "../../../router/index.js";

const TRUSTED_DEVICE_ID_KEY = 'trusted-device-id-v1';
const X_ACCESS_TOKEN_STORAGE_KEY = 'x-access-token';
const RESEARCH_TOKEN_STORAGE_KEY = 'auth_token';
const RESEARCH_USER_STORAGE_KEY = 'auth_user';

function getOrCreateDeviceId() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return '';
    }
    var existed = window.localStorage.getItem(TRUSTED_DEVICE_ID_KEY);
    if (existed && String(existed).trim()) {
        return String(existed).trim();
    }
    var randomPart = Math.random().toString(36).slice(2);
    var id = 'dev-' + Date.now() + '-' + randomPart;
    window.localStorage.setItem(TRUSTED_DEVICE_ID_KEY, id);
    return id;
}

function getTokenFromLocalStorage() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return '';
    }
    const raw = window.localStorage.getItem(X_ACCESS_TOKEN_STORAGE_KEY);
    return raw && String(raw).trim() ? String(raw).trim() : '';
}

function setTokenToLocalStorage(token) {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }
    if (token && String(token).trim()) {
        window.localStorage.setItem(X_ACCESS_TOKEN_STORAGE_KEY, String(token).trim());
    } else {
        window.localStorage.removeItem(X_ACCESS_TOKEN_STORAGE_KEY);
    }
}

function parseResearchAuth(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const token = raw.token ? String(raw.token).trim() : '';
    const user = raw.user && typeof raw.user === 'object' ? raw.user : null;
    if (!token || !user) return null;
    return { token, user };
}

function applyResearchAuth(raw) {
    const auth = parseResearchAuth(raw);
    if (!auth) return false;
    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(RESEARCH_TOKEN_STORAGE_KEY, auth.token);
        window.localStorage.setItem(RESEARCH_USER_STORAGE_KEY, JSON.stringify(auth.user));
    }
    store.commit('Authentication/SET_AUTH', auth);
    return true;
}

function clearResearchAuth() {
    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(RESEARCH_TOKEN_STORAGE_KEY);
        window.localStorage.removeItem(RESEARCH_USER_STORAGE_KEY);
    }
    store.commit('Authentication/CLEAR_AUTH');
}

function resolveSignedInRoute() {
    const isResearchSignedIn = !!(store.getters && store.getters['Authentication/isAuthenticated']);
    if (!isResearchSignedIn) {
        return '/dashboard';
    }

    const role = store.getters && store.getters['Authentication/userRole']
        ? String(store.getters['Authentication/userRole']).trim().toLowerCase()
        : '';

    if (role === 'admin' || role === 'chairman') return '/admin/dashboard';
    if (role === 'committee') return '/committee/assigned';
    return '/userdashboard';
}


const ServerModule = {
    namespaced: true,
    state: {
        authenticated: {
            isAuthen: false,
            isOAuth: false,
        },
        pendingToken: '',
        isSignIn: true,
        is2FA: false,
        profile: null,
        message:[],
    },

    modules: {

    },

    mutations: {
        authenticated(state, obj) {
            state.authenticated = Object.assign({}, state.authenticated, obj || {});
        },

        message(state, obj) {
            state.message = obj;
        },
        profile(state, obj) {
            state.profile = obj || null;
        },
        isSignIn(state, value) {
            state.isSignIn = !!value;
        },
        is2FA(state, value) {
            state.is2FA = !!value;
        },
        pendingToken(state, value) {
            state.pendingToken = value ? String(value) : '';
        }

    },

    actions: {
        async bootstrapSession({ commit }) {
            try {
                const objs = await getItem('objs');
                const tokenFromDb = objs && objs.xAccessToken ? String(objs.xAccessToken).trim() : '';
                const tokenFromLocal = getTokenFromLocalStorage();
                const token = tokenFromDb || tokenFromLocal;
                if (token) {
                    store.commit('set', ['XAccessToken', token]);
                    setTokenToLocalStorage(token);
                    if (!tokenFromDb) {
                        await setItem('objs', { xAccessToken: token });
                    }
                    commit('authenticated', { isAuthen: true, isOAuth: true });
                    commit('isSignIn', false);
                    try {
                        const meRes = await Service.authenticated('me', {}, {});
                        const mePayload = meRes && meRes.data ? meRes.data.data : null;
                        if (mePayload && mePayload.researchAuth) {
                            applyResearchAuth(mePayload.researchAuth);
                        }
                        const me = mePayload && typeof mePayload === 'object'
                            ? Object.assign({}, mePayload)
                            : mePayload;
                        if (me && typeof me === 'object' && Object.prototype.hasOwnProperty.call(me, 'researchAuth')) {
                            delete me.researchAuth;
                        }
                        commit('profile', me);
                    } catch (err) {
                        removeItem('objs');
                        store.commit('set', ['XAccessToken', '']);
                        setTokenToLocalStorage('');
                        commit('authenticated', { isAuthen: false, isOAuth: false });
                        commit('profile', null);
                        commit('isSignIn', true);
                        commit('is2FA', false);
                    }
                }
            } catch (err) {
                commit('authenticated', { isAuthen: false, isOAuth: false });
                commit('profile', null);
                commit('isSignIn', true);
                commit('is2FA', false);
            }
        },
        message({commit}, data) {

            Service.authenticated('message', data, {})
                .then((response) => {
                    store.commit("auth/message", response.data.data)
                }).catch((err) => {

            });
        },

        createMessage({commit}, data) {

            Service.authenticated('create-message', data, {})
                .then((response) => {
                    store.commit("auth/message", response.data.data);
                    store.dispatch("auth/message",{});
                }).catch((err) => {
            });
        },


        updateMessage({commit}, data) {
            Service.authenticated('update-message', data, {})
                .then((response) => {
                    store.commit("auth/message", response.data.data);
                    store.dispatch("auth/message",{});
                }).catch((err) => {
            });
        },

        removeMessage({commit}, data) {
            Service.authenticated('remove-message', data)
                .then((response) => {
                    store.commit("auth/message", response.data.data);
                    store.dispatch("auth/message",{});
                }).catch((err) => {
            });


        },


        async signIn({commit, dispatch}, data) {
            store.commit("dialog/loading", true);
            try {
                clearResearchAuth();
                const payload = Object.assign({}, data || {});
                payload.deviceId = getOrCreateDeviceId();

                const response = await Service.authenticated('signin', payload, {});
                const objs = response && response.data ? response.data.data : null;
                const researchAuthFromSignin = objs && objs.researchAuth ? objs.researchAuth : null;
                const token = objs && objs.xAccessToken ? String(objs.xAccessToken) : '';
                if (!token) {
                    throw new Error('missing_token');
                }
                setTokenToLocalStorage(token);
                const require2FA = !(objs && objs.require2FA === false);

                store.commit('set', ['XAccessToken', token]);
                commit('pendingToken', token);
                commit('authenticated', { isAuthen: false, isOAuth: false });
                commit('profile', null);
                commit('isSignIn', false);
                commit('is2FA', require2FA);

                if (!require2FA) {
                    await setItem('objs', { xAccessToken: token });
                    setTokenToLocalStorage(token);
                    let hasAppliedResearchAuth = applyResearchAuth(researchAuthFromSignin);
                    const meRes = await Service.authenticated('me', {}, {});
                    const mePayload = meRes && meRes.data ? meRes.data.data : null;
                    if (!hasAppliedResearchAuth && mePayload && mePayload.researchAuth) {
                        hasAppliedResearchAuth = applyResearchAuth(mePayload.researchAuth);
                    }
                    const me = mePayload && typeof mePayload === 'object'
                        ? Object.assign({}, mePayload)
                        : mePayload;
                    if (me && typeof me === 'object' && Object.prototype.hasOwnProperty.call(me, 'researchAuth')) {
                        delete me.researchAuth;
                    }
                    commit('profile', me);
                    commit('authenticated', { isAuthen: true, isOAuth: true });
                    commit('isSignIn', false);
                    commit('is2FA', false);
                    commit('pendingToken', '');
                    if (router && typeof router.push === 'function') {
                        router.push(resolveSignedInRoute());
                    }
                    return;
                }

                try {
                    await dispatch('twofa', {});
                } catch (err) {
                    store.commit('set', ['XAccessToken', '']);
                    setTokenToLocalStorage('');
                    commit('pendingToken', '');
                    commit('authenticated', { isAuthen: false, isOAuth: false });
                    commit('profile', null);
                    commit('isSignIn', true);
                    commit('is2FA', false);
                    store.commit('dialog/showError', {
                        title: "Authentication Error",
                        message: "Unable to send verification code. Please try again.",
                        code: "AUTH_2FA_REQUEST_FAILED",
                        number: "1",
                        status: true
                    })
                    return;
                }
            } catch (err) {
                store.commit("dialog/loading",false)
                const backendCode = err && err.response && err.response.data && err.response.data.code
                  ? String(err.response.data.code)
                  : "AUTH_SIGNIN_FAILED";
                const backendMessage = err && err.response && err.response.data && err.response.data.message
                  ? String(err.response.data.message)
                  : "Sign in failed. Please try again.";
                store.commit('dialog/showError', {
                    title: "Authentication Error",
                    message: backendMessage,
                    code: backendCode,
                    number: "1",
                    status: true
                })
            } finally {
                store.commit("dialog/loading",false)
            }
        },

        async twofa({ commit }, data) {
            commit('is2FA', true);
            await Service.authenticated('twofa-request', data || {}, {});
            return true;
        },

        async twofaSend({ commit, state }, data) {
            const verifyRes = await Service.authenticated('twofa-verify', data || {}, {});
            const verifyPayload = verifyRes && verifyRes.data ? verifyRes.data.data : null;
            let hasAppliedResearchAuth = false;
            if (verifyPayload && verifyPayload.researchAuth) {
                hasAppliedResearchAuth = applyResearchAuth(verifyPayload.researchAuth);
            }
            if (!state.pendingToken) {
                throw new Error('missing_pending_token');
            }
            await setItem('objs', { xAccessToken: state.pendingToken });
            setTokenToLocalStorage(state.pendingToken);
            const meRes = await Service.authenticated('me', {}, {});
            const mePayload = meRes && meRes.data ? meRes.data.data : null;
            if (!hasAppliedResearchAuth && mePayload && mePayload.researchAuth) {
                hasAppliedResearchAuth = applyResearchAuth(mePayload.researchAuth);
            }
            const me = mePayload && typeof mePayload === 'object'
                ? Object.assign({}, mePayload)
                : mePayload;
            if (me && typeof me === 'object' && Object.prototype.hasOwnProperty.call(me, 'researchAuth')) {
                delete me.researchAuth;
            }

            commit('profile', me);
            commit('authenticated', { isAuthen: true, isOAuth: true });
            commit('isSignIn', false);
            commit('is2FA', false);
            commit('pendingToken', '');
            return true;
        },

        async trustDevice() {
            await Service.authenticated('trust-device', {}, {});
            return true;
        },

        async completeSignInFlow({ dispatch }, payload) {
            var trustDevice = !!(payload && payload.trustDevice);
            if (trustDevice) {
                try {
                    await dispatch('trustDevice');
                } catch (err) {
                    // Do not block login completion if trust-device fails.
                }
            }
            if (router && typeof router.push === 'function') {
                router.push(resolveSignedInRoute());
            }
            return true;
        },

        signOut({commit}, data) {
            removeItem('objs')
            store.commit('set', ['XAccessToken', '']);
            setTokenToLocalStorage('');
            clearResearchAuth();
            commit('authenticated', { isAuthen: false, isOAuth: false });
            commit('profile', null);
            commit('isSignIn', true);
            commit('is2FA', false);
            commit('pendingToken', '');
            store.commit('security/reset')
            if (router && typeof router.push === 'function') {
                router.push('/login');
            }
        },

    },

    getters: {

        message(state) {
            return state.message;
        },

        authenticated(state) {
            return state.authenticated;
        },
        profile(state) {
            return state.profile;
        },
        isSignIn(state) {
            return state.isSignIn;
        },
        is2FA(state) {
            return state.is2FA;
        },
        pendingToken(state) {
            return state.pendingToken;
        }
    },
};

export default ServerModule;
