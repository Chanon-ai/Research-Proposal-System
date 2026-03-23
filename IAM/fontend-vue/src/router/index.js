import Vue from 'vue'
import Router from 'vue-router'
import store from '@/store/store'

const TheContainer = () => import('@/containers/TheContainer')

const Dashboard = () => import('@/views/Dashboard')
const UserDashboard = () => import('@/ResearchFormRS/user/UserDashboard.vue')
const UserProfile = () => import('@/ResearchFormRS/user/UserProfile.vue')
const UserHistory = () => import('@/ResearchFormRS/user/UserHistory.vue')
const UserNotification = () => import('@/ResearchFormRS/user/UserNotification.vue')

const AdminDashboard = () => import('@/ResearchFormRS/admin/AdminDashboard.vue')
const AdminProposalList = () => import('@/ResearchFormRS/admin/AdminProposalList.vue')
const AdminProposalDetail = () => import('@/ResearchFormRS/admin/AdminProposalDetail.vue')
const AdminDocuments = () => import('@/ResearchFormRS/admin/AdminDocuments.vue')
const AdminMeetings = () => import('@/ResearchFormRS/admin/AdminMeetings.vue')
const AdminNotifications = () => import('@/ResearchFormRS/admin/AdminNotifications.vue')
const AdminReports = () => import('@/ResearchFormRS/admin/AdminReports.vue')
const AdminSettings = () => import('@/ResearchFormRS/admin/AdminSettings.vue')
const AdminUsers = () => import('@/ResearchFormRS/admin/AdminUsers.vue')

const CommitteeDashboard = () => import('@/ResearchFormRS/committee/CommitteeDashboardSummary.vue')
const CommitteeAssigned = () => import('@/ResearchFormRS/committee/ReviewerDashboard.vue')
const CommitteeMeetings = () => import('@/ResearchFormRS/committee/CommitteeMeetings.vue')
const CommitteeNotifications = () => import('@/ResearchFormRS/committee/CommitteeNotifications.vue')
const CommitteeProposalDetail = () => import('@/ResearchFormRS/committee/CommitteeProposalDetail.vue')
const ResearchForm = () => import('@/ResearchFormRS/ResearchForm.vue')

const Colors = () => import('@/views/theme/Colors')
const Typography = () => import('@/views/theme/Typography')
const Charts = () => import('@/views/charts/Charts')
const Widgets = () => import('@/views/widgets/Widgets')

const Cards = () => import('@/views/base/Cards')
const Switches = () => import('@/views/base/Switches')
const Tabs = () => import('@/views/base/Tabs')
const Breadcrumbs = () => import('@/views/base/Breadcrumbs')
const Carousels = () => import('@/views/base/Carousels')
const Collapses = () => import('@/views/base/Collapses')
const Jumbotrons = () => import('@/views/base/Jumbotrons')
const ListGroups = () => import('@/views/base/ListGroups')
const Navs = () => import('@/views/base/Navs')
const Navbars = () => import('@/views/base/Navbars')
const Paginations = () => import('@/views/base/Paginations')
const Popovers = () => import('@/views/base/Popovers')
const ProgressBars = () => import('@/views/base/ProgressBars')
const Tables = () => import('@/views/tables/Tables')
const AdvancedTables = () => import('@/views/tables/AdvancedTables')
const Tooltips = () => import('@/views/base/Tooltips')

const StandardButtons = () => import('@/views/buttons/StandardButtons')
const ButtonGroups = () => import('@/views/buttons/ButtonGroups')
const Dropdowns = () => import('@/views/buttons/Dropdowns')
const BrandButtons = () => import('@/views/buttons/BrandButtons')

const TextEditors = () => import('@/views/editors/TextEditors')
const CodeEditors = () => import('@/views/editors/CodeEditors')

const BasicForms = () => import('@/views/forms/Forms')
const AdvancedForms = () => import('@/views/forms/AdvancedForms')
const ValidationForms = () => import('@/views/forms/ValidationForms')

const GoogleMaps = () => import('@/views/GoogleMaps')

const CoreUIIcons = () => import('@/views/icons/CoreUIIcons')
const Brands = () => import('@/views/icons/Brands')
const Flags = () => import('@/views/icons/Flags')

const Alerts = () => import('@/views/notifications/Alerts')
const Badges = () => import('@/views/notifications/Badges')
const Modals = () => import('@/views/notifications/Modals')
const Toaster = () => import('@/views/notifications/Toaster')

const Page404 = () => import('@/views/pages/Page404')
const Page500 = () => import('@/views/pages/Page500')
const Login = () => import('@/views/pages/Login')
const ResearchLogin = () => import('@/views/pages/ResearchLogin')
const Register = () => import('@/views/pages/Register')

const Users = () => import('@/views/users/Users')
const User = () => import('@/views/users/User')

const Draggable = () => import('@/views/plugins/Draggable')
const Calendar = () => import('@/views/plugins/Calendar')
const Spinners = () => import('@/views/plugins/Spinners')

const Invoice = () => import('@/views/apps/invoicing/Invoice')
const Compose = () => import('@/views/apps/email/Compose')
const Inbox = () => import('@/views/apps/email/Inbox')
const Message = () => import('@/views/apps/email/Message')

const CreateGroup = () => import('@/projects/views/security/CreateGroup')
const CreateMenu = () => import('@/projects/views/security/CreateMenu')
const PermissionMatrix = () => import('@/projects/views/security/PermissionMatrix')
const SettingMessage = () => import('@/projects/views/setting/Message')
const SettingVerification = () => import('@/projects/views/setting/Verification')
const SettingGroup = () => import('@/projects/views/setting/Group')
const SettingMessageAuthen = () => import('@/projects/views/setting/MessageAuthen')
const SettingMessageStatus = () => import('@/projects/views/setting/Status')
const AccountManagement = () => import('@/projects/views/accounts/Management')
const TrainingRequests = () => import('@/projects/views/training/Requests')
const TrainingRecords = () => import('@/projects/views/training/Records')

Vue.use(Router)

function emptyRouterView() {
  return {
    render(c) {
      return c('router-view')
    }
  }
}

const router = new Router({
  hash: false,
  mode: 'history',
  linkActiveClass: 'open active',
  scrollBehavior: () => ({ y: 0 }),
  routes: [
    {
      path: '/',
      redirect: '/pages/research-login',
      name: 'Home',
      component: TheContainer,
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: Dashboard
        },
        {
          path: 'userdashboard',
          name: 'UserDashboard',
          component: UserDashboard,
          meta: { appAuth: 'research', roles: ['researcher', 'admin', 'chairman'] }
        },
        {
          path: 'profile',
          redirect: '/user/profile'
        },
        {
          path: 'user/profile',
          alias: '/profile',
          name: 'UserProfile',
          component: UserProfile,
          meta: { appAuth: 'research', roles: ['researcher', 'admin', 'chairman'] }
        },
        {
          path: 'user/history',
          name: 'UserHistory',
          component: UserHistory,
          meta: { appAuth: 'research', roles: ['researcher', 'admin', 'chairman'] }
        },
        {
          path: 'user/notification',
          name: 'UserNotification',
          component: UserNotification,
          meta: { appAuth: 'research', roles: ['researcher', 'admin', 'chairman'] }
        },
        {
          path: 'admin-dashboard',
          name: 'AdminDashboardLegacy',
          component: AdminDashboard,
          meta: { appAuth: 'research', roles: ['admin', 'chairman'] }
        },
        {
          path: 'admin/dashboard',
          name: 'AdminDashboard',
          component: AdminDashboard,
          meta: { appAuth: 'research', roles: ['admin', 'chairman'] }
        },
        {
          path: 'admin/proposals',
          name: 'AdminProposalList',
          component: AdminProposalList,
          meta: { appAuth: 'research', roles: ['admin', 'chairman'] }
        },
        {
          path: 'admin/proposals/:id',
          name: 'AdminProposalDetail',
          component: AdminProposalDetail,
          meta: { appAuth: 'research', roles: ['admin', 'chairman'] }
        },
        {
          path: 'admin/documents',
          name: 'AdminDocuments',
          component: AdminDocuments,
          meta: { appAuth: 'research', roles: ['admin', 'chairman'] }
        },
        {
          path: 'admin/users',
          name: 'AdminUsers',
          component: AdminUsers,
          meta: { appAuth: 'research', roles: ['admin', 'chairman'] }
        },
        {
          path: 'admin/meetings',
          name: 'AdminMeetings',
          component: AdminMeetings,
          meta: { appAuth: 'research', roles: ['admin', 'chairman'] }
        },
        {
          path: 'admin/notifications',
          name: 'AdminNotifications',
          component: AdminNotifications,
          meta: { appAuth: 'research', roles: ['admin', 'chairman'] }
        },
        {
          path: 'admin/reports',
          name: 'AdminReports',
          component: AdminReports,
          meta: { appAuth: 'research', roles: ['admin', 'chairman'] }
        },
        {
          path: 'admin/settings',
          name: 'AdminSettings',
          component: AdminSettings,
          meta: { appAuth: 'research', roles: ['admin', 'chairman'] }
        },
        {
          path: 'research-form/:id?',
          name: 'ResearchForm',
          component: ResearchForm,
          props: route => ({
            proposalId: route.params.id || route.query.id || null,
            readOnly: route.query.readOnly === 'true' || route.query.readOnly === '1'
          }),
          meta: { appAuth: 'research', roles: ['researcher', 'admin', 'chairman', 'committee'] }
        },
        {
          path: 'committee/meetings',
          name: 'CommitteeMeetings',
          component: CommitteeMeetings,
          meta: { appAuth: 'research', roles: ['committee', 'admin', 'chairman'] }
        },
        {
          path: 'committee/notifications',
          name: 'CommitteeNotifications',
          component: CommitteeNotifications,
          meta: { appAuth: 'research', roles: ['committee', 'admin', 'chairman'] }
        },
        {
          path: 'committee/dashboard',
          name: 'CommitteeDashboard',
          component: CommitteeDashboard,
          meta: { appAuth: 'research', roles: ['committee', 'admin', 'chairman'] }
        },
        {
          path: 'committee/assigned',
          name: 'CommitteeAssigned',
          component: CommitteeAssigned,
          meta: { appAuth: 'research', roles: ['committee', 'admin', 'chairman'] }
        },
        {
          path: 'committee/proposals/:id',
          alias: '/review/proposals/:id',
          name: 'committeeProposalDetail',
          component: CommitteeProposalDetail,
          meta: { appAuth: 'research', roles: ['committee', 'admin', 'chairman'] }
        },
        {
          path: 'committee/logout',
          redirect: '/committee/dashboard'
        },
        {
          path: 'theme',
          redirect: '/theme/colors',
          name: 'Theme',
          component: emptyRouterView(),
          children: [
            {
              path: 'colors',
              name: 'Colors',
              component: Colors
            },
            {
              path: 'typography',
              name: 'Typography',
              component: Typography
            }
          ]
        },
        {
          path: 'charts',
          name: 'Charts',
          component: Charts
        },
        {
          path: 'security/permissions',
          redirect: '/security/permissions/menu',
          name: 'Permission'
        },
        {
          path: 'security/permissions/group',
          name: '2. Create Group',
          meta: { permission: { path: '/security/permission', action: 'view' } },
          component: CreateGroup
        },
        {
          path: 'security/permissions/menu',
          name: '1. Create Menu',
          meta: { permission: { path: '/security/permission', action: 'view' } },
          component: CreateMenu
        },
        {
          path: 'security/permissions/matrix',
          name: '3. Permission Matrix',
          meta: { permission: { path: '/security/permission', action: 'view' } },
          component: PermissionMatrix
        },
        {
          path: 'config/message-authen',
          name: 'Message Authen',
          component: SettingMessageAuthen
        },
        {
          path: 'config/setting-message',
          name: 'Setting Message',
          component: SettingMessage
        },
        {
          path: 'config/verification',
          name: 'Setting Verification',
          component: SettingVerification
        },
        {
          path: 'setting/message-status',
          name: 'Message Status',
          component: SettingMessageStatus
        },
        {
          path: 'setting/group',
          name: 'Setting Group',
          component: SettingGroup
        },
        {
          path: 'accounts/management',
          name: 'Account Management',
          component: AccountManagement
        },
        {
          path: 'training/requests',
          name: 'Training Requests',
          meta: { permission: { path: '/training/requests', action: 'view' } },
          component: TrainingRequests
        },
        {
          path: 'training/records',
          name: 'Training Records',
          meta: { permission: { path: '/training/requests', action: 'view' } },
          component: TrainingRecords
        },
        {
          path: 'tables',
          redirect: '/tables/tables',
          name: 'Tables',
          component: emptyRouterView(),
          children: [
            {
              path: 'tables',
              name: 'Basic tables',
              component: Tables
            },
            {
              path: 'advanced-tables',
              name: 'Advanced tables',
              component: AdvancedTables
            }
          ]
        },
        {
          path: 'widgets',
          name: 'Widgets',
          component: Widgets
        },
        {
          path: 'users',
          meta: { label: 'Users' },
          component: emptyRouterView(),
          children: [
            {
              path: '',
              name: 'Users',
              component: Users
            },
            {
              path: ':id',
              meta: {
                label: 'User Details'
              },
              name: 'User',
              component: User
            }
          ]
        },
        {
          path: 'base',
          redirect: '/base/cards',
          name: 'Base',
          component: emptyRouterView(),
          children: [
            {
              path: 'breadcrumbs',
              name: 'Breadcrumbs',
              component: Breadcrumbs
            },
            {
              path: 'cards',
              name: 'Cards',
              component: Cards
            },
            {
              path: 'carousels',
              name: 'Carousels',
              component: Carousels
            },
            {
              path: 'collapses',
              name: 'Collapses',
              component: Collapses
            },
            {
              path: 'jumbotrons',
              name: 'Jumbotrons',
              component: Jumbotrons
            },
            {
              path: 'list-groups',
              name: 'List Groups',
              component: ListGroups
            },
            {
              path: 'navs',
              name: 'Navs',
              component: Navs
            },
            {
              path: 'navbars',
              name: 'Navbars',
              component: Navbars
            },
            {
              path: 'paginations',
              name: 'Paginations',
              component: Paginations
            },
            {
              path: 'popovers',
              name: 'Popovers',
              component: Popovers
            },
            {
              path: 'progress-bars',
              name: 'Progress Bars',
              component: ProgressBars
            },
            {
              path: 'switches',
              name: 'Switches',
              component: Switches
            },
            {
              path: 'tabs',
              name: 'Tabs',
              component: Tabs
            },
            {
              path: 'tooltips',
              name: 'Tooltips',
              component: Tooltips
            }
          ]
        },
        {
          path: 'buttons',
          redirect: '/buttons/standard-buttons',
          name: 'Buttons',
          component: emptyRouterView(),
          children: [
            {
              path: 'standard-buttons',
              name: 'Standard Buttons',
              component: StandardButtons
            },
            {
              path: 'button-groups',
              name: 'Button Groups',
              component: ButtonGroups
            },
            {
              path: 'dropdowns',
              name: 'Dropdowns',
              component: Dropdowns
            },
            {
              path: 'brand-buttons',
              name: 'Brand Buttons',
              component: BrandButtons
            }
          ]
        },
        {
          path: 'editors',
          redirect: '/editors/text-editors',
          name: 'Editors',
          component: emptyRouterView(),
          children: [
            {
              path: 'text-editors',
              name: 'Text Editors',
              component: TextEditors
            },
            {
              path: 'code-editors',
              name: 'Code Editors',
              component: CodeEditors
            }
          ]
        },
        {
          path: 'forms',
          redirect: '/forms/basic-forms',
          name: 'Forms',
          component: emptyRouterView(),
          children: [
            {
              path: 'basic-forms',
              name: 'Basic Forms',
              component: BasicForms
            },
            {
              path: 'advanced-forms',
              name: 'Advanced Forms',
              component: AdvancedForms
            },
            {
              path: 'validation-forms',
              name: 'Form Validation',
              component: ValidationForms
            }
          ]
        },
        {
          path: 'google-maps',
          name: 'Google Maps',
          component: GoogleMaps
        },
        {
          path: 'icons',
          redirect: '/icons/coreui-icons',
          name: 'Icons',
          component: emptyRouterView(),
          children: [
            {
              path: 'coreui-icons',
              name: 'CoreUI Icons',
              component: CoreUIIcons
            },
            {
              path: 'flags',
              name: 'Flags',
              component: Flags
            },
            {
              path: 'brands',
              name: 'Brands',
              component: Brands
            }
          ]
        },
        {
          path: 'notifications',
          redirect: '/notifications/alerts',
          name: 'Notifications',
          component: emptyRouterView(),
          children: [
            {
              path: 'alerts',
              name: 'Alerts',
              component: Alerts
            },
            {
              path: 'badges',
              name: 'Badges',
              component: Badges
            },
            {
              path: 'modals',
              name: 'Modals',
              component: Modals
            },
            {
              path: 'toaster',
              name: 'Toaster',
              component: Toaster
            }
          ]
        },
        {
          path: 'plugins',
          redirect: '/plugins/draggable',
          name: 'Plugins',
          component: emptyRouterView(),
          children: [
            {
              path: 'draggable',
              name: 'Draggable Cards',
              component: Draggable
            },
            {
              path: 'calendar',
              name: 'Calendar',
              component: Calendar
            },
            {
              path: 'spinners',
              name: 'Spinners',
              component: Spinners
            }
          ]
        },
        {
          path: 'apps',
          name: 'Apps',
          component: emptyRouterView(),
          children: [
            {
              path: 'invoicing',
              redirect: '/apps/invoicing/invoice',
              name: 'Invoicing',
              component: emptyRouterView(),
              children: [
                {
                  path: 'invoice',
                  name: 'Invoice',
                  component: Invoice
                }
              ]
            },
            {
              path: 'email',
              redirect: '/apps/email/inbox',
              name: 'Email',
              component: emptyRouterView(),
              children: [
                {
                  path: 'compose',
                  name: 'Compose',
                  component: Compose
                },
                {
                  path: 'inbox',
                  name: 'Inbox',
                  component: Inbox
                },
                {
                  path: 'message',
                  name: 'Message',
                  component: Message
                }
              ]
            }
          ]
        }
      ]
    },
    {
      path: '/review/login',
      redirect: '/committee/dashboard'
    },
    {
      path: '/pages',
      redirect: '/pages/404',
      name: 'Pages',
      component: emptyRouterView(),
      children: [
        {
          path: '404',
          name: 'Page404',
          component: Page404
        },
        {
          path: '500',
          name: 'Page500',
          component: Page500
        },
        {
          path: 'login',
          name: 'Login',
          component: Login,
          meta: { guestOnly: true }
        },
        {
          path: 'research-login',
          name: 'ResearchLogin',
          component: ResearchLogin,
          meta: { guestOnly: true }
        },
        {
          path: 'register',
          name: 'Register',
          component: Register,
          meta: { guestOnly: true }
        }
      ]
    }
  ]
})

function normalizePermissionPath(path) {
  if (!path) return ''
  let normalized = String(path).trim()
  const queryIndex = normalized.indexOf('?')
  if (queryIndex !== -1) normalized = normalized.slice(0, queryIndex)
  const hashIndex = normalized.indexOf('#')
  if (hashIndex !== -1) normalized = normalized.slice(0, hashIndex)
  normalized = normalized.replace(/\/{2,}/g, '/')
  if (!normalized.startsWith('/')) normalized = `/${normalized}`
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }
  return normalized
}

function swapPermissionPlurality(path) {
  const normalized = normalizePermissionPath(path)
  if (!normalized) return ''
  if (normalized.includes('/permissions')) {
    return normalized.replace('/permissions', '/permission')
  }
  if (normalized.includes('/permission')) {
    return normalized.replace('/permission', '/permissions')
  }
  return ''
}

function buildPermissionCandidates(to, permissionMeta) {
  const candidates = new Set()
  const rawMetaPath = permissionMeta && permissionMeta.path ? permissionMeta.path : ''
  const rawRoutePath = to && to.path ? to.path : ''

  const normalizedMetaPath = normalizePermissionPath(rawMetaPath)
  const normalizedRoutePath = normalizePermissionPath(rawRoutePath)

  ;[
    normalizedMetaPath,
    normalizedRoutePath,
    swapPermissionPlurality(normalizedMetaPath),
    swapPermissionPlurality(normalizedRoutePath)
  ].filter(Boolean).forEach(item => candidates.add(item))

  return Array.from(candidates)
}

function normalizeRoleToken(value) {
  return String(value || '').trim().toLowerCase()
}

function isOwnerProfile(profile) {
  if (!profile || typeof profile !== 'object') return false

  const tokens = new Set()
  const pushRole = (role) => {
    if (!role) return
    if (typeof role === 'string') {
      tokens.add(normalizeRoleToken(role))
      return
    }
    if (typeof role === 'object') {
      [
        role.name,
        role.title,
        role.code,
        role.key,
        role.slug,
        role.role,
        role.roleName
      ].forEach(item => {
        if (item) tokens.add(normalizeRoleToken(item))
      })
    }
  }

  pushRole(profile.role)
  pushRole(profile.roleName)
  pushRole(profile.type)
  if (Array.isArray(profile.roles)) profile.roles.forEach(pushRole)

  return tokens.has('owner')
}

function getStoredRole() {
  const storeRole = store.getters && store.getters['Authentication/userRole']
  if (storeRole) return storeRole
  try {
    const raw = localStorage.getItem('auth_user')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && parsed.role ? parsed.role : null
  } catch (e) {
    return null
  }
}

function getRoleHome(role) {
  if (role === 'committee') return '/committee/dashboard'
  if (role === 'admin' || role === 'chairman') return '/admin/dashboard'
  return '/userdashboard'
}

function hasResearchToken() {
  if (typeof window === 'undefined' || !window.localStorage) return false
  return !!window.localStorage.getItem('auth_token')
}

router.beforeEach(async (to, from, next) => {
  const isResearchRoute = to.matched.some(record => record.meta && record.meta.appAuth === 'research')

  if (!isResearchRoute) {
    try {
      await store.dispatch('auth/bootstrapSession')
    } catch (err) {
      // ignore legacy bootstrap error
    }
  }

  let researchAuthenticated = !!store.getters['Authentication/isAuthenticated']
  if (!researchAuthenticated && hasResearchToken()) {
    try {
      await store.dispatch('Authentication/restoreSession')
    } catch (err) {
      // ignore research bootstrap error
    }
    researchAuthenticated = !!store.getters['Authentication/isAuthenticated']
  }

  const researchRole = store.getters['Authentication/userRole'] || getStoredRole()
  const researchHome = getRoleHome(researchRole)
  const isResearchGuestOnly = to.matched.some(record => record.meta && record.meta.guestOnly)

  if (isResearchGuestOnly) {
    if (researchAuthenticated && researchRole) {
      return next(researchHome)
    }
    return next()
  }

  if (isResearchRoute) {
    if (!researchAuthenticated) {
      return next('/pages/research-login')
    }

    const roleRecords = to.matched.filter(record => (
      record.meta && Array.isArray(record.meta.roles) && record.meta.roles.length > 0
    ))
    if (roleRecords.length) {
      const allowed = roleRecords.every(record => record.meta.roles.includes(researchRole))
      if (!allowed) {
        if (researchRole === 'admin' || researchRole === 'chairman') return next('/admin/dashboard')
        if (researchRole === 'committee') return next('/committee/dashboard')
        return next('/userdashboard')
      }
    }

    return next()
  }

  if (to.path.startsWith('/pages/')) {
    return next()
  }

  const authState = store.getters['auth/authenticated'] || {}
  const legacyAuthenticated = !!authState.isAuthen

  if (!researchAuthenticated && !legacyAuthenticated) {
    return next('/pages/research-login')
  }

  const permissionMeta = to.meta && to.meta.permission
  const hasLegacyToken = !!store.state.XAccessToken
  const profile = store.getters['auth/profile'] || null
  const isOwner = isOwnerProfile(profile)
  if (permissionMeta && hasLegacyToken && legacyAuthenticated && !isOwner) {
    if (!store.getters['security/loaded']) {
      try {
        await store.dispatch('security/fetchMyPermissions')
      } catch (err) {
        // permission fetch failed, fallback to denied
      }
    }
    const action = permissionMeta.action || 'view'
    const pathCandidates = buildPermissionCandidates(to, permissionMeta)
    const canAccess = pathCandidates.some(path => (
      store.getters['security/canAccess'](path, action)
    ))
    if (!canAccess) {
      return next({ path: '/pages/404' })
    }
  }

  return next()
})

export default router
