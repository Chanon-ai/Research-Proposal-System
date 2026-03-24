import axios from 'axios';
import store from '@/store/store'
import router from '@/router/index'
const instance = axios.create();

instance.defaults.baseURL = process.env.VUE_APP_API_BASE_URL || process.env.VUE_APP_API_URL || 'http://127.0.0.1:8081';

instance.defaults.headers = {
  "Content-Type": "application/json",
}

function getLegacyToken() {
  return store.state.XAccessToken ? String(store.state.XAccessToken) : '';
}

function getResearchToken() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return '';
  }
  const token = window.localStorage.getItem('auth_token');
  return token ? String(token) : '';
}

function isResearchAppPath(pathname) {
  return [
    '/admin',
    '/committee',
    '/user',
    '/research-form',
    '/userdashboard'
  ].some(prefix => String(pathname || '').startsWith(prefix))
}

instance.interceptors.request.use(
    (config) => {
      const legacyToken = getLegacyToken();
      const researchToken = getResearchToken();
      const bearerToken = researchToken || legacyToken;

      if (bearerToken) {
        config.headers.Authorization = `Bearer ${bearerToken}`;
      }

      if (legacyToken) {
        config.headers['x-access-token'] = legacyToken;
      }

      const lang = store.getters && store.getters['setting/lang']
        ? store.getters['setting/lang']
        : 'en';
      config.headers.lang = `${lang}`;
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
);

instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response && error.response.status === 401) {
        const requestUrl = error.config && error.config.url ? String(error.config.url) : '';
        const is2FAFlow = requestUrl.includes('/auth/2fa/') || requestUrl.includes('/auth/trust-device') || requestUrl.includes('/auth/me');
        console.warn('[AXIOS-401]', requestUrl, is2FAFlow ? '(skipped redirect)' : '(redirecting)');
        if (!is2FAFlow) {
          const currentPath = router && router.currentRoute ? router.currentRoute.path : '';
          if (isResearchAppPath(currentPath) || getResearchToken()) {
            if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.removeItem('auth_token');
              window.localStorage.removeItem('auth_user');
            }
            if (currentPath !== '/pages/research-login') {
              router.push('/pages/research-login');
            }
          } else if (currentPath !== '/pages/login') {
            router.push('/pages/login');
          }
        }
      }
      return Promise.reject(error);
    }
);

export default {
  campus(method, data, configs) {
    switch (method){
      case 'exp':
        return instance.post("/api/v1/setting/explore/campus",data);
      case 'get':
        return instance.get("/api/v1/setting/campus");
      case 'post':
        delete data._id;
        return instance.post("/api/v1/setting/campus", data);
      case 'put':
        return instance.put("/api/v1/setting/campus", data);
      case 'delete':
        return instance.delete("/api/v1/setting/campus");
      default:
        break;
    }
  },

  facultys(method, data, configs) {
    switch (method){
      case 'get':
        return instance.get("/api/v1/setting/faculty");
      case 'post':
        delete data._id;
        return instance.post("/api/v1/setting/faculty", data);
      case 'put':
        return instance.put("/api/v1/setting/faculty", data);
      case 'delete':
        return instance.delete("/api/v1/setting/faculty");
      default:
        break;
    }
  },

  departments(method, data, configs) {
    switch (method){
      case 'exp':
        return instance.post("/api/v1/explore/departments",data);
      case 'get':
        return instance.get("/api/v1/setting/department");
      case 'post':
        delete data._id;
        return instance.post("/api/v1/setting/department", data);
      case 'put':
        return instance.put("/api/v1/setting/department", data);
      case 'delete':
        return instance.delete("/api/v1/setting/department");
      default:
        break;
    }
  },

  members(method, data, configs) {
    switch (method){
      case 'exp':
        return instance.post("/api/v1/explore/profile",data);
      default:
        break;
    }
  },

  roles(method, data, configs) {
    switch (method){
      case 'exp':
        return instance.get("/api/v1/setting/role",data);
      case 'post':
        return instance.post("/api/v1/setting/role",data);
      case 'put':
        return instance.put("/api/v1/setting/role",data);
      default:
        break;
    }
  },

  authenticated(method, data, configs) {
    switch (method){
      case 'signin':
        return instance.post("/api/v1/signin",data);
      case 'twofa-request':
        return instance.post("/api/v1/auth/2fa/request", data || {});
      case 'twofa-verify':
        return instance.post("/api/v1/auth/2fa/verify", data || {});
      case 'trust-device':
        return instance.post("/api/v1/auth/trust-device", data || {});
      case 'me':
        return instance.get("/api/v1/auth/me");
      case 'message':
        return instance.get("/api/v1/setting/auth/message",data);
      case 'create-message':
        return instance.post("/api/v1/setting/auth/message",data);
      case 'update-message':
        return instance.put("/api/v1/setting/auth/message",data);
      case 'remove-message':
        return instance.delete("/api/v1/setting/auth/message", { data: data || {} });
      default:
        break;
    }
  },

  auth: {
    login: (data) => instance.post('/api/v1/auth/login', data),
    register: (data) => instance.post('/api/v1/auth/register', data),
    me: () => instance.get('/api/v1/auth/user/me'),
    logout: () => instance.post('/api/v1/auth/logout'),
    changePassword: (data) => instance.put('/api/v1/auth/change-password', data),
  },

  proposal: {
    create: (data) => instance.post('/api/v1/proposals', data),
    updateDraft: (id, data) => instance.patch(`/api/v1/proposals/${id}`, data),
    deleteDraft: (id) => instance.delete(`/api/v1/proposals/${id}`),
    submit: (id) => instance.post(`/api/v1/proposals/${id}/submit`),
    resubmit: (id) => instance.post(`/api/v1/proposals/${id}/resubmit`),
    changeStatus: (id, data) => instance.patch(`/api/v1/proposals/${id}/status`, data),
    assignCommittee: (id, data) => instance.post(`/api/v1/proposals/${id}/assign-committee`, data),
    saveReview: (id, data) => instance.post(`/api/v1/proposals/${id}/reviews`, data),
    getMyReview: (id, params) => instance.get(`/api/v1/proposals/${id}/reviews/me`, { params }),
    getReviewsByProposal: (id, params) => instance.get(`/api/v1/proposals/${id}/reviews`, { params }),
    getReviewsByProposalAlt: (id, params) => instance.get(`/api/v1/proposals/reviews/by-proposal/${id}`, { params }),
    getFeedback: (id) => instance.get(`/api/v1/proposals/${id}/feedback`),
    getResearcherUsers: (params) => instance.get('/api/v1/proposals/researcher-users', { params }),
    getCommitteeUsers: (params) => instance.get('/api/v1/proposals/committee-users', { params }),
    getById: (id) => instance.get(`/api/v1/proposals/${id}`),
    list: (params) => instance.get('/api/v1/proposals', { params }),
    listFormFiles: (id) => instance.get(`/api/v1/proposals/${id}/form-files`),
    uploadFormFile: (id, formData) =>
      instance.post(`/api/v1/proposals/${id}/form-files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }),
    downloadFormFile: (id, fileId) =>
      instance.get(`/api/v1/proposals/${id}/form-files/${fileId}`, { responseType: 'blob' }),
    deleteFormFile: (id, fileId) => instance.delete(`/api/v1/proposals/${id}/form-files/${fileId}`),
  },

  research: {
    list: (params) => instance.get('/api/v1/proposals', { params }),
  },

  notification: {
    list: (params) => instance.get('/api/v1/notifications', { params }),
    markRead: (id) => instance.patch(`/api/v1/notifications/${id}/read`),
    markAllRead: () => instance.patch('/api/v1/notifications/mark-all-read'),
  },

  meeting: {
    list: (params) => instance.get('/api/v1/meetings', { params }),
  },

  organization(method, data, configs) {
    switch (method) {
      case 'explorers':
        return instance.post('/api/v1/organization/explorers', data);
      default:
        break;
    }
  },

  agencies(method, data, configs) {
    switch (method) {
      case 'explorers':
        return instance.post('/api/v1/organization/agencies/explorers', data);
      default:
        break;
    }
  },

  department(method, data, configs) {
    switch (method) {
      case 'explorers':
        return instance.post('/api/v1/organization/department/explorers', data);
      default:
        break;
    }
  },

  accounts(method, data, configs) {
    switch (method) {
      case 'list':
        return instance.get('/api/v1/accounts', { params: data || {} });
      case 'update':
        return instance.put(`/api/v1/accounts/${data && (data.id || data._id)}`, data || {});
      case 'group-options':
        return instance.get('/api/v1/accounts/group/options', { params: data || {} });
      case 'effective-permissions':
        return instance.get(`/api/v1/accounts/${data && (data.id || data._id)}/effective-permissions`, { params: data || {} });
      case 'status-options':
        return instance.get('/api/v1/accounts/status/options', { params: data || {} });
      case 'change-status':
        return instance.put(`/api/v1/accounts/${data && (data.id || data._id)}/status`, data || {});
      default:
        break;
    }
  },

  chat(userId, message) {
    return instance.post('/api/v1/chat/chat', { userId, message });
  },

  security(method, data) {
    switch (method) {
      case 'types':
        return instance.get('/api/v1/security/type');
      case 'create-type':
        return instance.post('/api/v1/security/type', data);
      case 'update-type':
        return instance.put('/api/v1/security/type', data);
      case 'delete-type':
        return instance.delete('/api/v1/security/type', { data: { id: data.id } });
      case 'menus':
        return instance.get('/api/v1/security/menu');
      case 'create-menu':
        return instance.post('/api/v1/security/menu', data);
      case 'update-menu':
        return instance.put('/api/v1/security/menu', data);
      case 'delete-menu':
        return instance.delete('/api/v1/security/menu', { data: { id: data.id } });
      case 'groups':
        return instance.get('/api/v1/security/group');
      case 'create-group':
        return instance.post('/api/v1/security/group', data);
      case 'update-group':
        return instance.put('/api/v1/security/group', data);
      case 'delete-group':
        return instance.delete('/api/v1/security/group', { data: { id: data.id } });
      case 'permissions':
        return instance.get('/api/v1/security/permission');
      case 'my-permissions':
        return instance.get('/api/v1/security/permission/my', { params: data || {} });
      case 'create-permission':
        return instance.post('/api/v1/security/permission', data);
      case 'update-permission':
        return instance.put('/api/v1/security/permission', data);
      case 'create-permission-batch':
        return instance.post('/api/v1/security/permission/create/batch', data);
      case 'update-permission-batch':
        return instance.put('/api/v1/security/permission/update/batch', data);
      case 'delete-permission':
        return instance.delete('/api/v1/security/permission', { data: { id: data.id } });
      case 'assignments':
        return instance.get('/api/v1/security/assignment', { params: data || {} });
      case 'create-assignment':
        return instance.post('/api/v1/security/assignment', data);
      case 'update-assignment':
        return instance.put('/api/v1/security/assignment', data);
      case 'delete-assignment':
        return instance.delete('/api/v1/security/assignment', { data: { id: data.id } });
      default:
        break;
    }
  },

  settings(method, data) {
    switch (method) {
      case 'groups':
        return instance.get('/api/v1/setting/groups', { params: data || {} });
      case 'bulk-update':
        return instance.put('/api/v1/setting/bulk', data);
      case 'create-group':
        return instance.post('/api/v1/setting/groups', data);
      case 'update-group':
        return instance.put('/api/v1/setting/groups', data);
      case 'delete-group':
        return instance.delete('/api/v1/setting/groups', { data: { id: data.id || data._id } });
      case 'status':
        return instance.get('/api/v1/setting/status', { params: data || {} });
      case 'create-status':
        return instance.post('/api/v1/setting/status', data);
      case 'update-status':
        return instance.put('/api/v1/setting/status', data);
      case 'delete-status':
        return instance.delete('/api/v1/setting/status', { data: { id: data.id || data._id } });
      case 'messages':
        return instance.get('/api/v1/setting/message', { params: data || {} });
      case 'create-setting-message':
        return instance.post('/api/v1/setting/message', data);
      case 'update-setting-message':
        return instance.put('/api/v1/setting/message', data);
      case 'delete-setting-message':
        return instance.delete('/api/v1/setting/message', { data: { id: data.id || data._id } });
      case 'verification':
        return instance.get('/api/v1/setting/verification', { params: data || {} });
      case 'create-verification':
        return instance.post('/api/v1/setting/verification', data);
      case 'update-verification':
        return instance.put('/api/v1/setting/verification', data);
      case 'delete-verification':
        return instance.delete('/api/v1/setting/verification', { data: { id: data.id || data._id } });
      case 'work-status-timeline':
        return instance.get('/api/v1/setting/work-status/timeline', { params: data || {} });
      case 'work-status-timeline-one':
        return instance.get('/api/v1/setting/work-status/timeline/one', { params: data || {} });
      case 'create-work-status-timeline':
        return instance.post('/api/v1/setting/work-status/timeline', data);
      case 'update-work-status-timeline':
        return instance.put('/api/v1/setting/work-status/timeline', data);
      case 'delete-work-status-timeline':
        return instance.delete('/api/v1/setting/work-status/timeline', { data: { id: data.id || data._id } });
      case 'work-status-timeline-decision':
        return instance.put('/api/v1/setting/work-status/timeline/decision', data);
      case 'universities':
        return instance.get('/api/v1/setting/universities', { params: data || {} });
      case 'create-university':
        return instance.post('/api/v1/setting/universities', data);
      case 'update-university':
        return instance.put('/api/v1/setting/universities', data);
      case 'delete-university':
        return instance.delete('/api/v1/setting/universities', { data: { id: data.id || data._id } });
      case 'positions':
        return instance.get('/api/v1/setting/positions', { params: data || {} });
      case 'create-position':
        return instance.post('/api/v1/setting/positions', data);
      case 'update-position':
        return instance.put('/api/v1/setting/positions', data);
      case 'delete-position':
        return instance.delete('/api/v1/setting/positions', { data: { id: data.id || data._id } });
      case 'work-status-types':
        return instance.get('/api/v1/setting/work-status-types', { params: data || {} });
      case 'create-work-status-type':
        return instance.post('/api/v1/setting/work-status-types', data);
      case 'update-work-status-type':
        return instance.put('/api/v1/setting/work-status-types', data);
      case 'delete-work-status-type':
        return instance.delete('/api/v1/setting/work-status-types', { data: { id: data.id || data._id } });
      case 'training-courses':
        return instance.get('/api/v1/setting/training-courses', { params: data || {} });
      case 'create-training-course':
        return instance.post('/api/v1/setting/training-courses', data);
      case 'update-training-course':
        return instance.put('/api/v1/setting/training-courses', data);
      case 'delete-training-course':
        return instance.delete('/api/v1/setting/training-courses', { data: { id: data.id || data._id } });
      default:
        break;
    }
  },

  employment(method, data) {
    switch (method) {
      case 'records':
        return instance.get('/api/v1/employment/records', { params: data || {} });
      case 'create-record':
        return instance.post('/api/v1/employment/records', data);
      case 'update-record':
        return instance.put('/api/v1/employment/records', data);
      case 'transfer-record':
        return instance.put('/api/v1/employment/records/transfer', data);
      case 'delete-record':
        return instance.delete('/api/v1/employment/records', { data: { id: data.id || data._id } });
      case 'contracts':
        return instance.get('/api/v1/employment/contracts', { params: data || {} });
      case 'create-contract':
        return instance.post('/api/v1/employment/contracts', data);
      case 'update-contract':
        return instance.put('/api/v1/employment/contracts', data);
      case 'delete-contract':
        return instance.delete('/api/v1/employment/contracts', { data: { id: data.id || data._id } });
      case 'history':
        return instance.get('/api/v1/employment/history', { params: data || {} });
      case 'history-timeline':
        return instance.get('/api/v1/employment/history/timeline', { params: data || {} });
      case 'create-history':
        return instance.post('/api/v1/employment/history', data);
      case 'update-history':
        return instance.put('/api/v1/employment/history', data);
      case 'delete-history':
        return instance.delete('/api/v1/employment/history', { data: { id: data.id || data._id } });
      case 'references':
        return instance.get('/api/v1/employment/references', { params: data || {} });
      case 'create-reference':
        return instance.post('/api/v1/employment/references', data);
      case 'update-reference':
        return instance.put('/api/v1/employment/references', data);
      case 'delete-reference':
        return instance.delete('/api/v1/employment/references', { data: { id: data.id || data._id } });
      case 'organization-groups':
        return instance.get('/api/v1/employment/organization-groups', { params: data || {} });
      case 'create-organization-group':
        return instance.post('/api/v1/employment/organization-groups', data);
      case 'update-organization-group':
        return instance.put('/api/v1/employment/organization-groups', data);
      case 'delete-organization-group':
        return instance.delete('/api/v1/employment/organization-groups', { data: { id: data.id || data._id } });
      case 'organization-units':
        return instance.get('/api/v1/employment/organization-units', { params: data || {} });
      case 'create-organization-unit':
        return instance.post('/api/v1/employment/organization-units', data);
      case 'update-organization-unit':
        return instance.put('/api/v1/employment/organization-units', data);
      case 'delete-organization-unit':
        return instance.delete('/api/v1/employment/organization-units', { data: { id: data.id || data._id } });
      case 'academic-ranks':
        return instance.get('/api/v1/employment/academic-ranks', { params: data || {} });
      case 'create-academic-rank':
        return instance.post('/api/v1/employment/academic-ranks', data);
      case 'update-academic-rank':
        return instance.put('/api/v1/employment/academic-ranks', data);
      case 'delete-academic-rank':
        return instance.delete('/api/v1/employment/academic-ranks', { data: { id: data.id || data._id } });
      case 'work-lines':
        return instance.get('/api/v1/employment/work-lines', { params: data || {} });
      case 'create-work-line':
        return instance.post('/api/v1/employment/work-lines', data);
      case 'update-work-line':
        return instance.put('/api/v1/employment/work-lines', data);
      case 'delete-work-line':
        return instance.delete('/api/v1/employment/work-lines', { data: { id: data.id || data._id } });
      case 'employee-types':
        return instance.get('/api/v1/employment/employee-types', { params: data || {} });
      case 'create-employee-type':
        return instance.post('/api/v1/employment/employee-types', data);
      case 'update-employee-type':
        return instance.put('/api/v1/employment/employee-types', data);
      case 'delete-employee-type':
        return instance.delete('/api/v1/employment/employee-types', { data: { id: data.id || data._id } });
      case 'import-hr-csv':
        return instance.post('/api/v1/employment/import/hr/csv', data);
      case 'import-hr-review':
        return instance.get('/api/v1/employment/import/hr/review', { params: data || {} });
      default:
        break;
    }
  },

  training(method, data) {
    switch (method) {
      case 'requests':
        return instance.get('/api/v1/training/requests', { params: data || {} });
      case 'create-request':
        return instance.post('/api/v1/training/requests', data);
      case 'submit-request':
        return instance.put('/api/v1/training/requests/submit', data);
      case 'decision-request':
        return instance.put('/api/v1/training/requests/decision', data);
      case 'approve-request':
        return instance.put('/api/v1/training/requests/approve', data);
      case 'reject-request':
        return instance.put('/api/v1/training/requests/reject', data);
      case 'complete-request':
        return instance.put('/api/v1/training/requests/complete', data);
      case 'actions':
        return instance.get('/api/v1/training/actions', { params: data || {} });
      case 'records':
        return instance.get('/api/v1/training/records', { params: data || {} });
      default:
        break;
    }
  },

  method(method, data, configs) {
    switch (method) {
      case 'exp':
        return instance.post('/api/v1/payment/method/explorers', data);
      case 'get':
        return instance.get('/api/v1/payment/method');
      case 'post':
        return instance.post('/api/v1/payment/method', data);
      case 'put':
        return instance.put('/api/v1/payment/method', data);
      case 'delete':
        return instance.delete('/api/v1/payment/method');
      default:
        break;
    }
  },

  payment(method, data, configs) {
    switch (method) {
      case 'explorers-transaction':
        return instance.post('/api/v1/payment/transaction/explorers', data);
      default:
        break;
    }
  },

  attachments(method, data) {
    switch (method) {
      case 'list':
        return instance.get('/api/v1/attachments', { params: data || {} });
      case 'create':
        return instance.post('/api/v1/attachments', data);
      case 'update':
        return instance.put('/api/v1/attachments', data);
      case 'delete':
        return instance.delete('/api/v1/attachments', { data: { id: data && (data.id || data._id) } });
      default:
        break;
    }
  },

  audit(method, data) {
    switch (method) {
      case 'logs':
        return instance.get('/api/v1/audit/logs', { params: data || {} });
      case 'create-log':
        return instance.post('/api/v1/audit/logs', data);
      case 'update-log':
        return instance.put('/api/v1/audit/logs', data);
      case 'delete-log':
        return instance.delete('/api/v1/audit/logs', { data: { id: data && (data.id || data._id) } });
      default:
        break;
    }
  }
}

export { instance }
