// NOTE: "legacy_admin" was used in older builds. Current auth uses "admin",
// so keep both to avoid hiding Access Control menus.
// (Filtering happens in `src/containers/TheSidebar.vue` via `item.roles.includes(role)`.)
const ACCESS_CONTROL_ROLES = ['admin', 'legacy_admin']

export default [{
  _name: 'CSidebarNav',
  _children: [
    {
      _name: 'CSidebarNavTitle',
      roles: ['researcher', 'chairman'],
      _children: ['nav.researcherMenu']
    },
    {
      _name: 'CSidebarNavDropdown',
      name: 'nav.userPanel',
      route: '/user',
      icon: 'cil-user',
      roles: ['researcher', 'chairman'],
      items: [
        {
          name: 'nav.profile',
          to: '/user/profile',
          roles: ['chairman']
        },
        {
          name: 'nav.history',
          to: '/user/history',
          roles: ['chairman']
        }
      ]
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.userDashboard',
      to: '/userdashboard',
      icon: 'cil-user',
      roles: ['researcher', 'chairman']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.userMeetings',
      to: '/user/meetings',
      icon: 'cil-calendar',
      roles: ['researcher', 'chairman']
    },
    {
      _name: 'CSidebarNavTitle',
      roles: ['admin', 'legacy_admin', 'chairman'],
      _children: ['nav.adminMenu']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.adminDashboard',
      to: '/admin/dashboard',
      icon: 'cil-speedometer',
      roles: ['admin', 'legacy_admin', 'chairman']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.meetings',
      to: '/admin/meetings',
      icon: 'cil-calendar',
      roles: ['admin', 'legacy_admin', 'chairman']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.reports',
      to: '/admin/reports',
      icon: 'cil-chart-pie',
      roles: ['admin', 'legacy_admin', 'chairman']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.settings',
      to: '/admin/settings',
      icon: 'cil-settings',
      roles: ['admin', 'legacy_admin', 'chairman']
    },
    {
      _name: 'CSidebarNavTitle',
      roles: ['committee'],
      _children: ['nav.committeeMenu']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.assignedTasks',
      to: '/committee/assigned',
      icon: 'cil-list',
      roles: ['committee']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.meetings',
      to: '/committee/meetings',
      icon: 'cil-calendar',
      roles: ['committee']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.committeeSummary',
      to: '/committee/dashboard',
      icon: 'cil-speedometer',
      roles: ['committee']
    },
    {
      _name: 'CSidebarNavTitle',
      roles: ['chairman'],
      _children: ['nav.officeChairmanMenu']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.assignedTasks',
      to: '/office-chairman/assigned',
      icon: 'cil-list',
      roles: ['chairman']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.meetings',
      to: '/office-chairman/meetings',
      icon: 'cil-calendar',
      roles: ['chairman']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.committeeSummary',
      to: '/office-chairman/dashboard',
      icon: 'cil-speedometer',
      roles: ['chairman']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.researchForm',
      to: '/research-form',
      icon: 'cil-notes',
      roles: ['researcher', 'admin', 'chairman', 'committee']
    },
    {
      _name: 'CSidebarNavDivider'
    },

    {
      _name: 'CSidebarNavDropdownTemplate',
      name: 'Template',
      icon: 'cil-layers',
      roles: ['admin', 'chairman', 'legacy_admin'],
      items: [
        {
          name: 'Banks',
          to: '/banks',
          icon: 'cil-settings'
        },
        {
          _name: 'CSidebarNavTitle',
          name: 'Access Control'
        },
        {
          _name: 'CSidebarNavDropdown',
          name: 'Config',
          route: '/config',
          icon: 'cil-settings',
          roles: ACCESS_CONTROL_ROLES,
          items: [
            {
              name: 'Message Authen',
              to: '/config/message-authen'
            },
            {
              name: 'Setting Message',
              to: '/config/setting-message'
            },
            {
              name: 'Setting Verification',
              to: '/config/verification'
            }
          ]
        },
        {
          _name: 'CSidebarNavDropdown',
          name: 'Setting',
          route: '/setting',
          icon: 'cil-list',
          roles: ACCESS_CONTROL_ROLES,
          items: [
            {
              name: 'Setting Group',
              to: '/setting/group'
            },
            {
              name: 'Message Status',
              to: '/setting/message-status'
            }
          ]
        },
        {
          _name: 'CSidebarNavDropdown',
          name: 'Accounts',
          route: '/accounts',
          icon: 'cil-user',
          roles: ACCESS_CONTROL_ROLES,
          items: [
            {
              name: 'Account Directory',
              to: '/accounts/management'
            }
          ]
        },
        {
          _name: 'CSidebarNavDropdown',
          name: 'Training',
          route: '/training',
          icon: 'cil-library',
          roles: ACCESS_CONTROL_ROLES,
          items: [
            {
              name: 'Training Requests',
              to: '/training/requests'
            },
            {
              name: 'Training Records',
              to: '/training/records'
            }
          ]
        },
        {
          _name: 'CSidebarNavDropdown',
          name: 'Permission',
          route: '/security/permissions',
          icon: 'cil-lock-locked',
          roles: ACCESS_CONTROL_ROLES,
          items: [
            {
              name: 'Create Menu',
              to: '/security/permissions/menu'
            },
            {
              name: 'Create Group',
              to: '/security/permissions/group'
            },
            {
              name: 'Permission Matrix',
              to: '/security/permissions/matrix'
            }
          ]
        },
        {
          _name: 'CSidebarNavDivider'
        },
        {
          _name: 'CSidebarNavTitle',
          _children: ['Theme']
        },
        {
          _name: 'CSidebarNavItem',
          name: 'Colors',
          to: '/theme/colors',
          icon: 'cil-drop'
        },
        {
          _name: 'CSidebarNavItem',
          name: 'Typography',
          to: '/theme/typography',
          icon: 'cil-pencil'
        },
        {
          _name: 'CSidebarNavTitle',
          _children: ['Components']
        },
        {
          _name: 'CSidebarNavDropdown',
          name: 'Base',
          route: '/base',
          icon: 'cil-puzzle',
          items: [{
              name: 'Breadcrumbs',
              to: '/base/breadcrumbs'
            },
            {
              name: 'Cards',
              to: '/base/cards'
            },
            {
              name: 'Carousels',
              to: '/base/carousels'
            },
            {
              name: 'Collapses',
              to: '/base/collapses'
            },
            {
              name: 'Jumbotrons',
              to: '/base/jumbotrons'
            },
            {
              name: 'List Groups',
              to: '/base/list-groups'
            },
            {
              name: 'Navs',
              to: '/base/navs'
            },
            {
              name: 'Navbars',
              to: '/base/navbars'
            },
            {
              name: 'Paginations',
              to: '/base/paginations'
            },
            {
              name: 'Popovers',
              to: '/base/popovers'
            },
            {
              name: 'Progress Bars',
              to: '/base/progress-bars'
            },
            {
              name: 'Switches',
              to: '/base/switches'
            },
            {
              name: 'Tabs',
              to: '/base/tabs'
            },
            {
              name: 'Tooltips',
              to: '/base/tooltips'
            }
          ]
        },
        {
          _name: 'CSidebarNavDropdown',
          name: 'Buttons',
          route: '/buttons',
          icon: 'cil-cursor',
          items: [{
              name: 'Buttons',
              to: '/buttons/standard-buttons'
            },
            {
              name: 'Button Dropdowns',
              to: '/buttons/dropdowns'
            },
            {
              name: 'Button Groups',
              to: '/buttons/button-groups'
            },
            {
              name: 'Brand Buttons',
              to: '/buttons/brand-buttons'
            }
          ]
        },
        {
          _name: 'CSidebarNavItem',
          name: 'Charts',
          to: '/charts',
          icon: 'cil-chart-pie'
        },
        {
          _name: 'CSidebarNavDropdown',
          name: 'Editors',
          route: '/editors',
          icon: 'cil-code',
          items: [
            {
              name: 'Code editors',
              to: '/editors/code-editors',
              icon: 'cil-code',
              badge: {
                color: 'danger',
                text: 'PRO'
              }
            },
            {
              name: 'Text editors',
              to: '/editors/text-editors',
              icon: 'cil-justify-left'
            }
          ]
        },
        {
          _name: 'CSidebarNavDropdown',
          name: 'Forms',
          route: '/forms',
          icon: 'cil-notes',
          items: [
            {
              name: 'Basic forms',
              to: '/forms/basic-forms'
            },
            {
              name: 'Advanced forms',
              to: '/forms/advanced-forms',
              badge: {
                color: 'danger',
                text: 'PRO'
              }
            },
            {
              name: 'Validation forms',
              to: '/forms/validation-forms',
              badge: {
                color: 'danger',
                text: 'PRO'
              }
            }
          ]
        },
        {
          _name: 'CSidebarNavItem',
          name: 'Google Maps',
          to: '/google-maps',
          icon: 'cil-map',
          badge: {
            color: 'danger',
            text: 'PRO'
          }
        },
        {
          _name: 'CSidebarNavDropdown',
          name: 'Icons',
          route: '/icons',
          icon: 'cil-star',
          items: [{
              name: 'CoreUI Icons',
              to: '/icons/coreui-icons',
              badge: {
                color: 'info',
                text: 'NEW'
              }
            },
            {
              name: 'Brands',
              to: '/icons/brands'
            },
            {
              name: 'Flags',
              to: '/icons/flags'
            }
          ]
        },
        {
          _name: 'CSidebarNavDropdown',
          name: 'Notifications',
          route: '/notifications',
          icon: 'cil-bell',
          items: [{
              name: 'Alerts',
              to: '/notifications/alerts',
            },
            {
              name: 'Badges',
              to: '/notifications/badges'
            },
            {
              name: 'Modals',
              to: '/notifications/modals'
            },
            {
              name: 'Toaster',
              to: '/notifications/toaster',
              badge: {
                color: 'danger',
                text: 'PRO'
              }
            }
          ]
        },
        {
          _name: 'CSidebarNavDropdown',
          name: 'Plugins',
          route: '/plugins',
          icon: 'cil-input-power',
          items: [
            {
              name: 'Draggable',
              to: '/plugins/draggable',
              icon: 'cil-cursor-move',
              badge: {
                color: 'danger',
                text: 'PRO'
              }
            },
            {
              name: 'Calendar',
              to: '/plugins/calendar',
              icon: 'cil-calendar',
              badge: {
                color: 'danger',
                text: 'PRO'
              }
            },
            {
              name: 'Spinners',
              to: '/plugins/spinners',
              icon: 'cil-circle',
              badge: {
                color: 'danger',
                text: 'PRO'
              }
            }
          ]
        },
        {
          _name: 'CSidebarNavDropdown',
          name: 'Tables',
          route: '/tables',
          icon: 'cil-list',
          items: [
            {
              name: 'Basic Tables',
              to: '/tables/tables',
              icon: 'cil-list',
            },
            {
              name: 'Advanced tables',
              to: '/tables/advanced-tables',
              icon: 'cil-list-rich'
            }
          ]
        },
        {
          _name: 'CSidebarNavItem',
          name: 'Widgets',
          to: '/widgets',
          icon: 'cil-calculator',
          badge: {
            color: 'primary',
            text: 'NEW',
            shape: 'pill'
          }
        },
        {
          _name: 'CSidebarNavDivider'
        },
        {
          _name: 'CSidebarNavTitle',
          _children: ['Extras']
        },
        {
          _name: 'CSidebarNavDropdown',
          name: 'Pages',
          route: '/pages',
          icon: 'cil-star',
          items: [
            {
              name: 'Login',
              to: '/pages/login'
            },
            {
              name: 'Register',
              to: '/pages/register'
            },
            {
              name: 'Error 404',
              to: '/pages/404'
            },
            {
              name: 'Error 500',
              to: '/pages/500'
            }
          ]
        },
        {
          _name: 'CSidebarNavDropdown',
          name: 'Apps',
          route: '/apps',
          icon: 'cil-layers',
          items: [
            {
              _name: 'CSidebarNavDropdown',
              name: 'Invoicing',
              route: '/apps/invoicing',
              icon: 'cil-spreadsheet',
              items: [
                {
                  name: 'Invoice',
                  to: '/apps/invoicing/invoice',
                  badge: {
                    color: 'danger',
                    text: 'PRO'
                  }
                }
              ]
            },
            {
              _name: 'CSidebarNavDropdown',
              name: 'Email',
              route: '/apps/email',
              icon: 'cil-envelope-closed',
              items: [
                {
                  name: 'Inbox',
                  to: '/apps/email/inbox',
                  icon: 'cil-envelope-closed',
                  badge: {
                    color: 'danger',
                    text: 'PRO'
                  }
                },
                {
                  name: 'Message',
                  to: '/apps/email/message',
                  icon: 'cil-envelope-open',
                  badge: {
                    color: 'danger',
                    text: 'PRO'
                  }
                },
                {
                  name: 'Compose',
                  to: '/apps/email/compose',
                  icon: 'cil-envelope-letter',
                  badge: {
                    color: 'danger',
                    text: 'PRO'
                  }
                }
              ]
            }
          ]
        },
        {
          _name: 'CSidebarNavDivider',
          _class: 'm-2'
        },
        {
          _name: 'CSidebarNavTitle',
          _children: ['Labels']
        },
        {
          _name: 'CSidebarNavItem',
          name: 'Label danger',
          icon: {
            name: 'cil-star',
            class: 'text-danger'
          },
          label: true
        },
        {
          _name: 'CSidebarNavItem',
          name: 'Label info',
          icon: {
            name: 'cil-star',
            class: 'text-info'
          },
          label: true
        },
        {
          _name: 'CSidebarNavItem',
          name: 'Label warning',
          icon: {
            name: 'cil-star',
            class: 'text-warning'
          },
          label: true
        }
      ]
    }
  ]
}]
