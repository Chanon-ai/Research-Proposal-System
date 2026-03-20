export default [{
  _name: 'CSidebarNav',
  _children: [
    {
      _name: 'CSidebarNavItem',
      name: 'Dashboard',
      to: '/dashboard',
      icon: 'cil-speedometer'
    },
    {
      _name: 'CSidebarNavDropdown',
      name: 'User Panel',
      route: '/user',
      icon: 'cil-user',
      roles: ['researcher', 'chairman'],
      items: [
        {
          name: 'User Dashboard',
          to: '/userdashboard',
          roles: ['researcher', 'chairman']
        },
        {
          name: 'Profile',
          to: '/user/profile',
          roles: ['chairman']
        },
        {
          name: 'History',
          to: '/user/history',
          roles: ['chairman']
        }
      ]
    },
    {
      _name: 'CSidebarNavDropdown',
      name: 'Admin Panel',
      route: '/admin',
      icon: 'cil-settings',
      roles: ['admin', 'chairman'],
      items: [
        {
          name: 'Admin Dashboard',
          to: '/admin/dashboard'
        },
        {
          name: 'Proposal List',
          to: '/admin/proposals'
        },
        {
          name: 'Documents',
          to: '/admin/documents'
        },
        {
          name: 'Meetings',
          to: '/admin/meetings'
        },
        {
          name: 'Notifications',
          to: '/admin/notifications'
        },
        {
          name: 'Reports',
          to: '/admin/reports'
        },
        {
          name: 'Settings',
          to: '/admin/settings'
        },
        {
          name: 'Users',
          to: '/admin/users'
        }
      ]
    },
    {
      _name: 'CSidebarNavDropdown',
      name: 'Committee Panel',
      route: '/committee',
      icon: 'cil-people',
      roles: ['committee'],
      items: [
        {
          name: 'Dashboard',
          to: '/committee/dashboard'
        },
        {
          name: 'Meetings',
          to: '/committee/meetings'
        },
        {
          name: 'Notifications',
          to: '/committee/notifications'
        }
      ]
    },
    {
      _name: 'CSidebarNavItem',
      name: 'Research Form',
      to: '/research-form',
      icon: 'cil-notes',
      roles: ['researcher', 'admin', 'chairman', 'committee']
    },
    {
      _name: 'CSidebarNavDivider'
    },

    {
      _name: 'CSidebarNavItem',
      name: 'Banks',
      to: '/banks',
      icon: 'cil-settings',
      badge: {
        color: 'primary',
        text: 'Themplate'
      }
    },
    {
      _name: 'CSidebarNavTitle',
      _children: ['Access Control']
    },
    {
      _name: 'CSidebarNavDropdown',
      name: 'Config',
      route: '/config',
      icon: 'cil-settings',
      roles: ['legacy_admin'],
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
      roles: ['legacy_admin'],
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
      roles: ['legacy_admin'],
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
      roles: ['legacy_admin'],
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
      roles: ['legacy_admin'],
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
      _name: 'CSidebarNavDropdownTemplate',
      name: 'Template',
      icon: 'cil-layers',
      items: [
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
