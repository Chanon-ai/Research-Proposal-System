export default [{
  _name: 'CSidebarNav',
  _children: [
    {
      _name: 'CSidebarNavTitle',
      roles: ['researcher'],
      _children: ['nav.researcherMenu']
    },
    {
      _name: 'CSidebarNavDropdown',
      name: 'nav.userPanel',
      show: false,
      icon: 'cil-user',
      roles: ['researcher'],
      items: [
        {
          name: 'nav.profile',
          to: '/user/profile',
          roles: ['researcher']
        },
        {
          name: 'nav.history',
          to: '/user/history',
          roles: ['researcher']
        },
        {
          name: 'Notifications',
          to: '/user/notification',
          roles: ['researcher']
        }
      ]
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.userDashboard',
      to: '/userdashboard',
      icon: 'cil-user',
      roles: ['researcher']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.userMeetings',
      to: '/user/meetings',
      icon: 'cil-calendar',
      roles: ['researcher']
    },
    {
      _name: 'CSidebarNavTitle',
      roles: ['admin', 'legacy_admin'],
      _children: ['nav.adminMenu']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.adminDashboard',
      to: '/admin/dashboard',
      icon: 'cil-speedometer',
      roles: ['admin', 'legacy_admin']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.meetings',
      to: '/admin/meetings',
      icon: 'cil-calendar',
      roles: ['admin', 'legacy_admin']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'Notifications',
      to: '/admin/notifications',
      icon: 'cil-bell',
      roles: ['admin', 'legacy_admin']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.reports',
      to: '/admin/reports',
      icon: 'cil-chart-pie',
      roles: ['admin', 'legacy_admin']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.settings',
      to: '/admin/settings',
      icon: 'cil-settings',
      roles: ['admin', 'legacy_admin']
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
      name: 'Notifications',
      to: '/committee/notifications',
      icon: 'cil-bell',
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
      _children: ['nav.chairmanMenu']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.assignedTasks',
      to: '/chairman/assigned',
      icon: 'cil-list',
      roles: ['chairman']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.meetings',
      to: '/chairman/meetings',
      icon: 'cil-calendar',
      roles: ['chairman']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'Notifications',
      to: '/chairman/notifications',
      icon: 'cil-bell',
      roles: ['chairman']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.committeeSummary',
      to: '/chairman/dashboard',
      icon: 'cil-speedometer',
      roles: ['chairman']
    },
    {
      _name: 'CSidebarNavItem',
      name: 'nav.researchForm',
      to: '/research-form',
      icon: 'cil-notes',
      roles: ['chairman']
    }
  ]
}]
