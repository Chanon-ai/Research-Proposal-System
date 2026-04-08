<template>
  <div class="app-layout">
    <!-- Overlay -->
    <Transition name="overlay-fade">
      <div v-if="sidebarExpanded" class="sidebar-overlay" @click="sidebarExpanded = false" />
    </Transition>

    <!-- ───────────── MAIN BODY ───────────── -->
    <div class="app-body" :class="{ 'sidebar-open': sidebarExpanded }">

      <div class="page-wrapper" :class="{ 'is-dark': isDarkTheme }">
        <div class="notif-card" :class="{ 'is-dark': isDarkTheme }">

          <!-- Header: title (top-left) + filter buttons + toolbar -->
          <div class="notif-header">
            <div class="header-left">
              <h2 class="page-title">{{ $t('userNotification.title') }}</h2>
              <div class="filter-tabs">
                <button
                  v-for="tab in filterTabs"
                  :key="tab.key"
                  :class="['filter-tab', { active: activeFilter === tab.key }]"
                  @click="activeFilter = tab.key"
                ><CIcon name="cil-chevron-right" class="mr-1" /> {{ tab.label }}</button>
              </div>
            </div>

            <div class="header-right">
              <div class="notif-toolbar" v-if="unreadCount > 0">
                <span class="unread-count">{{ $t('userNotification.unreadCount', { count: unreadCount }) }}</span>
                <button class="btn-mark-all" @click="markAllRead"><CIcon name="cil-chevron-right" class="mr-1" /> {{ $t('userNotification.actions.markAllRead') }}</button>
              </div>
            </div>
          </div>

          <div v-if="loading" class="empty-state">
            <p>{{ $t('userNotification.states.loading') }}</p>
          </div>

          <!-- Groups -->
          <div v-else v-for="group in filteredGroups" :key="group.label" class="notif-group">

            <!-- Group header -->
            <div class="group-header">
              <span class="group-label">{{ group.label }}</span>
            </div>

            <!-- Notification items -->
            <div
              v-for="item in group.items"
              :key="item.id"
              class="notif-item"
              :class="{ unread: !item.read }"
              @click="showNotificationDetail(item)"
            >
              <!-- Icon -->
              <div class="notif-icon" :class="item.iconClass">
                <!-- person -->
                <svg v-if="item.icon === 'person'" width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <!-- edit -->
                <svg v-else-if="item.icon === 'edit'" width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <!-- check -->
                <svg v-else-if="item.icon === 'check'" width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <!-- info -->
                <svg v-else-if="item.icon === 'info'" width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <!-- alert -->
                <svg v-else-if="item.icon === 'alert'" width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>

              <!-- Content -->
              <div class="notif-content">
                <div class="notif-title">{{ item.title }}</div>
                <div class="notif-desc">{{ item.desc }}</div>
                <div class="notif-actions" v-if="item.actions && item.actions.length">
                  <button
                    v-for="action in item.actions"
                    :key="action.label"
                    class="notif-action-btn"
                    @click.stop="action.handler && action.handler()"
                  ><CIcon name="cil-chevron-right" class="mr-1" /> {{ action.label }} ›</button>
                </div>
              </div>

              <!-- Right: time + unread dot -->
              <div class="notif-meta">
                <span class="notif-time">{{ item.time }}</span>
                <span v-if="!item.read" class="unread-dot"></span>
              </div>
            </div>

          </div>

          <!-- Empty state -->
          <div v-if="!loading && filteredGroups.length === 0" class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
              stroke="#ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <p>{{ $t('userNotification.states.empty') }}</p>
          </div>

          <CModal
            :show.sync="showDetailModal"
            centered
            size="lg"
            :title="$t('userNotification.details.title')"
            @update:show="onDetailModalToggle"
          >
            <template #body-wrapper>
              <div v-if="selectedNotification" class="notification-detail">
                <div class="notification-detail__hero" :class="selectedNotification.iconClass">
                  <div class="notification-detail__icon-shell">
                    <div class="notification-detail__icon" :class="selectedNotification.iconClass">
                      <CIcon :name="selectedNotification.detailIcon || 'cil-bell'" height="24" />
                    </div>
                  </div>
                  <div class="notification-detail__hero-copy">
                    <div class="notification-detail__eyebrow">{{ $t('userNotification.details.fields.type') }}</div>
                    <div class="notification-detail__title">{{ selectedNotification.title }}</div>
                    <div class="notification-detail__meta-line">
                      <span class="notification-detail__chip notification-detail__chip--solid">{{ getNotificationTypeLabel(selectedNotification.eventKey) }}</span>
                      <span class="notification-detail__chip" :class="selectedNotification.read ? 'notification-detail__chip--muted' : 'notification-detail__chip--fresh'">
                        {{ selectedNotification.read ? 'อ่านแล้ว' : 'ยังไม่อ่าน' }}
                      </span>
                      <span class="notification-detail__meta-sep"></span>
                      <div class="notification-detail__time">{{ selectedNotification.timeAbsolute }}</div>
                    </div>
                  </div>
                </div>

                <div class="notification-detail__message-card">
                  <div class="notification-detail__section-title">ข้อความแจ้งเตือน</div>
                  <div class="notification-detail__message">{{ selectedNotification.desc }}</div>
                </div>

                <div
                  v-if="selectedNotification.payload && selectedNotification.payload.fromStatus && selectedNotification.payload.toStatus"
                  class="notification-detail__transition"
                >
                  <div class="notification-detail__transition-status">
                    <span class="notification-detail__status-pill notification-detail__status-pill--from">{{ humanizeStatus(selectedNotification.payload.fromStatus) }}</span>
                    <span class="notification-detail__transition-arrow">→</span>
                    <span class="notification-detail__status-pill notification-detail__status-pill--to">{{ humanizeStatus(selectedNotification.payload.toStatus) }}</span>
                  </div>
                </div>

                <div class="notification-detail__grid">
                  <div class="notification-detail__field">
                    <div class="notification-detail__label">{{ $t('userNotification.details.fields.sentAt') }}</div>
                    <div class="notification-detail__value notification-detail__value--strong">{{ selectedNotification.timeAbsolute }}</div>
                  </div>
                  <div class="notification-detail__field notification-detail__field--wide" v-if="selectedNotification.proposalCode || selectedNotification.proposalTitle">
                    <div class="notification-detail__label">{{ $t('userNotification.details.fields.proposal') }}</div>
                    <div class="notification-detail__value">
                      <span class="notification-detail__proposal-code">{{ selectedNotification.proposalCode || '-' }}</span>
                      <span v-if="selectedNotification.proposalTitle" class="notification-detail__proposal-title">{{ selectedNotification.proposalTitle }}</span>
                    </div>
                  </div>
                  <div class="notification-detail__field" v-if="selectedNotification.payload && selectedNotification.payload.fromStatus">
                    <div class="notification-detail__label">{{ $t('userNotification.details.fields.fromStatus') }}</div>
                    <div class="notification-detail__value">{{ humanizeStatus(selectedNotification.payload.fromStatus) }}</div>
                  </div>
                  <div class="notification-detail__field" v-if="selectedNotification.payload && selectedNotification.payload.toStatus">
                    <div class="notification-detail__label">{{ $t('userNotification.details.fields.toStatus') }}</div>
                    <div class="notification-detail__value">{{ humanizeStatus(selectedNotification.payload.toStatus) }}</div>
                  </div>
                  <div class="notification-detail__field" v-if="notificationRemark(selectedNotification)">
                    <div class="notification-detail__label">{{ $t('userNotification.details.fields.remark') }}</div>
                    <div class="notification-detail__value">{{ notificationRemark(selectedNotification) }}</div>
                  </div>
                </div>
              </div>
            </template>
            <template #footer-wrapper>
              <div class="notification-detail__footer">
                <CButton color="secondary" variant="outline" @click="closeDetailModal"><CIcon name="cil-chevron-right" class="mr-1" /> {{ $t('userNotification.details.actions.close') }}</CButton>
                <CButton v-if="selectedNotification && selectedNotification.proposalId" color="primary" @click="openProposalFromDetail"><CIcon name="cil-chevron-right" class="mr-1" /> {{ $t('userNotification.details.actions.openProposal') }}</CButton>
              </div>
            </template>
          </CModal>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Service from '@/service/api'

export default {
  name: 'UserNotification',

  data() {
    return {
         
      // Layout
      sidebarExpanded: false,
      lang: 'TH',
      currentRoute: '/notifications',
      navItems: [
        { icon: 'grid', label: 'โครงการของฉัน',  route: '/projects' },
        { icon: 'bell', label: 'การแจ้งเตือน',    route: '/notifications' },
        { icon: 'file', label: 'รายงาน',           route: '/reports' },
        { icon: 'user', label: 'โปรไฟล์',          route: '/profile' },
      ],

      // Filter
      activeFilter: 'all',
      loading: false,
      notifications: [],
      showDetailModal: false,
      selectedNotification: null,
      pagination: {
        page: 1,
        total: 0,
        totalPages: 1,
      },

      
    }
  },

  async mounted () {
    await this.fetchNotifications()
  },

  computed: {
    isDarkTheme () {
      return Boolean(this.$store && this.$store.state && this.$store.state.darkMode)
    },

    currentRole () {
      const storeRole = this.$store && this.$store.getters
        ? this.$store.getters['Authentication/userRole']
        : null
      if (storeRole) return storeRole

      try {
        const raw = localStorage.getItem('auth_user')
        if (!raw) return null
        const parsed = JSON.parse(raw)
        return parsed && parsed.role ? parsed.role : null
      } catch (e) {
        return null
      }
    },

    unreadCount() {
      return this.notifications.filter(n => !n.read).length
    },

    filteredNotifications() {
      if (this.activeFilter === 'unread') {
        return this.notifications.filter(n => !n.read)
      }
      return this.notifications
    },

    filterTabs() {
      return [
        { key: 'all', label: this.$t('userNotification.filters.all') },
        { key: 'unread', label: this.$t('userNotification.filters.unread') },
      ]
    },

    filteredGroups() {
      const groups = [
        { key: 'recent',  label: this.$t('userNotification.groups.recent') },
        { key: 'earlier', label: this.$t('userNotification.groups.earlier') },
      ]
      return groups
        .map(g => ({
          label: g.label,
          items: this.filteredNotifications.filter(n => n.group === g.key),
        }))
        .filter(g => g.items.length > 0)
    },
  },

  watch: {
    '$route.query.notificationId' () {
      this.openNotificationFromRoute()
    }
  },

  methods: {
    async fetchNotifications () {
      this.loading = true
      try {
        const res = await Service.notification.list({ page: 1, limit: 50 })
        const payload = res && res.data && res.data.data ? res.data.data : {}
        const rows = Array.isArray(payload.notifications) ? payload.notifications : []
        this.notifications = rows.map(this.toNotificationItem)
        this.pagination.total = payload.total || 0
        this.pagination.page = payload.page || 1
        this.pagination.totalPages = payload.totalPages || 1
        this.openNotificationFromRoute()
      } catch (err) {
        this.notifications = []
      } finally {
        this.loading = false
      }
    },

    toNotificationItem (n) {
      const eventKey = String(n && n.eventKey ? n.eventKey : '').toLowerCase()
      const group = this.isRecent(n && (n.createdAt || n.sentAt)) ? 'recent' : 'earlier'
      const proposal = n && n.proposal && typeof n.proposal === 'object' ? n.proposal : null
      const proposalId = proposal && proposal._id
        ? String(proposal._id)
        : (n && n.proposalId ? String(n.proposalId) : null)
      const createdAt = n && (n.createdAt || n.sentAt)
      return {
        id: n && n._id,
        proposalId,
        proposalCode: n && n.proposalCode ? n.proposalCode : (proposal && proposal.proposalCode ? proposal.proposalCode : ''),
        proposalTitle: n && n.proposalTitle ? n.proposalTitle : (proposal && proposal.projectTitleTh ? proposal.projectTitleTh : ''),
        eventKey,
        group,
        icon: this.iconByEvent(eventKey),
        detailIcon: this.detailIconByEvent(eventKey),
        iconClass: this.iconClassByEvent(eventKey),
        title: n && n.title ? n.title : this.$t('userNotification.defaultTitle'),
        desc: n && n.message ? n.message : '-',
        time: this.timeAgo(createdAt),
        timeAbsolute: this.formatDate(createdAt),
        read: Boolean(n && n.isRead),
        payload: n && n.payload && typeof n.payload === 'object' ? n.payload : {},
        raw: n,
        actions: proposalId ? [{ label: this.$t('userNotification.actions.viewProposal'), handler: () => this.openProposal({ proposalId, eventKey }) }] : [],
      }
    },

    formatDate (dateStr) {
      if (!dateStr) return '-'
      const d = new Date(dateStr)
      if (Number.isNaN(d.getTime())) return '-'
      return d.toLocaleString(this.$i18n && this.$i18n.locale === 'en' ? 'en-GB' : 'th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    isRecent (dateStr) {
      if (!dateStr) return true
      const d = new Date(dateStr)
      if (Number.isNaN(d.getTime())) return true
      return (Date.now() - d.getTime()) < 24 * 60 * 60 * 1000
    },

    iconByEvent (eventKey) {
      if (eventKey.includes('approved') || eventKey.includes('submit')) return 'check'
      if (eventKey.includes('revision') || eventKey.includes('reject')) return 'alert'
      if (eventKey.includes('assign')) return 'person'
      if (eventKey.includes('status')) return 'info'
      return 'info'
    },

    iconClassByEvent (eventKey) {
      if (eventKey.includes('approved') || eventKey.includes('submit')) return 'icon-green'
      if (eventKey.includes('revision') || eventKey.includes('reject')) return 'icon-orange'
      if (eventKey.includes('assign')) return 'icon-blue'
      return 'icon-gray'
    },

    detailIconByEvent (eventKey) {
      if (eventKey.includes('approved') || eventKey.includes('certified')) return 'cil-check-circle'
      if (eventKey.includes('reject')) return 'cil-x-circle'
      if (eventKey.includes('revision') || eventKey.includes('document_required')) return 'cil-warning'
      if (eventKey.includes('assign') || eventKey.includes('committee') || eventKey.includes('chairman')) return 'cil-user-follow'
      if (eventKey.includes('meeting')) return 'cil-calendar'
      if (eventKey.includes('submit') || eventKey.includes('resubmit')) return 'cil-description'
      if (eventKey.includes('status')) return 'cil-sync'
      return 'cil-bell'
    },

    timeAgo (dateStr) {
      if (!dateStr) return '-'
      const diff = Date.now() - new Date(dateStr).getTime()
      if (!Number.isFinite(diff) || diff < 0) return '-'
      const minutes = Math.floor(diff / 60000)
      if (minutes < 1) return this.$t('userNotification.time.justNow')
      if (minutes < 60) return this.$t('userNotification.time.minutesAgo', { count: minutes })
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return this.$t('userNotification.time.hoursAgo', { count: hours })
      const days = Math.floor(hours / 24)
      return this.$t('userNotification.time.daysAgo', { count: days })
    },

    async markRead(item) {
      if (!item || !item.id || item.read) return
      item.read = true
      try {
        await Service.notification.markRead(item.id)
      } catch (err) {
        item.read = false
      }
    },

    async showNotificationDetail (item) {
      if (!item) return
      await this.markRead(item)
      this.selectedNotification = item
      this.showDetailModal = true
      this.syncNotificationQuery(item.id)
    },

    openNotificationFromRoute () {
      const targetId = this.$route && this.$route.query ? this.$route.query.notificationId : ''
      if (!targetId || !Array.isArray(this.notifications) || this.notifications.length === 0) return
      const target = this.notifications.find(item => String(item.id) === String(targetId))
      if (!target) return
      this.selectedNotification = target
      this.showDetailModal = true
    },

    syncNotificationQuery (notificationId = '') {
      if (!this.$route || !this.$router) return
      const query = { ...(this.$route.query || {}) }
      if (notificationId) query.notificationId = String(notificationId)
      else delete query.notificationId
      this.$router.replace({ query }).catch(() => {})
    },

    onDetailModalToggle (visible) {
      if (!visible) this.closeDetailModal()
    },

    closeDetailModal () {
      this.showDetailModal = false
      this.selectedNotification = null
      this.syncNotificationQuery('')
    },

    openProposalFromDetail () {
      if (!this.selectedNotification) return
      this.openProposal(this.selectedNotification)
      this.closeDetailModal()
    },

    getProposalRoute (item) {
      const proposalId = item && item.proposalId ? String(item.proposalId) : ''
      if (!proposalId) return null

      const role = String(this.currentRole || '').trim().toLowerCase()
      if (role === 'committee') {
        return { name: 'committeeProposalDetail', params: { id: proposalId } }
      }
      if (role === 'chairman') {
        return { name: 'chairmanProposalDetail', params: { id: proposalId } }
      }
      if (role === 'finance_officer') {
        return { name: 'FinanceOfficerProposalDetail', params: { id: proposalId } }
      }
      if (['admin', 'legacy_admin'].includes(role)) {
        return { name: 'AdminProposalDetail', params: { id: proposalId } }
      }

      const key = String(item && item.eventKey ? item.eventKey : '').toLowerCase()
      const isRevisionRelated = key.includes('revision') || key.includes('reject')
      return {
        name: 'ResearchForm',
        params: { id: proposalId },
        query: {
          readOnly: isRevisionRelated ? 'false' : 'true',
          scrollFeedback: isRevisionRelated ? '1' : '0'
        }
      }
    },

    getNotificationTypeLabel (eventKey) {
      const key = String(eventKey || '').toLowerCase()
      if (key.includes('approved') || key.includes('submit')) return this.$t('userNotification.typeLabels.approved')
      if (key.includes('revision')) return this.$t('userNotification.typeLabels.revision')
      if (key.includes('reject')) return this.$t('userNotification.typeLabels.rejected')
      if (key.includes('assign')) return this.$t('userNotification.typeLabels.assignment')
      if (key.includes('meeting')) return this.$t('userNotification.typeLabels.meeting')
      return this.$t('userNotification.typeLabels.general')
    },

    humanizeStatus (status) {
      const labels = {
        draft: 'ร่าง',
        pending_confirm: 'รอการยืนยัน',
        submitted: 'ยื่นแล้ว',
        faculty_review_pending: 'ประธานกำลังพิจารณา',
        faculty_approved: 'ประธานอนุมัติ',
        faculty_rejected: 'ประธานไม่อนุมัติ',
        office_received: 'ส่วนบริหารรับแล้ว',
        document_checking: 'ตรวจเอกสาร',
        assigned_to_committee: 'มอบหมายกรรมการแล้ว',
        under_review: 'พิจารณา',
        committee_valuated: 'กรรมการได้ให้ความเห็นแล้ว',
        meeting_completed: 'ส่วนบริหารกำลังจัดเตรียมผล',
        meeting_in_progress: 'กำลังจัดการประชุม',
        revision_requested: 'ขอแก้ไข',
        resubmitted: 'ส่งแก้ไขแล้ว',
        second_round_review: 'พิจารณารอบ 2',
        approved: 'อนุมัติ',
        rejected: 'ไม่อนุมัติ',
        announced: 'ประกาศผลแล้ว'
      }
      const key = String(status || '').trim().toLowerCase()
      return labels[key] || key || '-'
    },

    notificationRemark (item) {
      const payload = item && item.payload && typeof item.payload === 'object' ? item.payload : {}
      return payload.remark || payload.remarks || payload.meetingTitle || ''
    },

    async markAllRead() {
      this.notifications.forEach(n => { n.read = true })
      try {
        await Service.notification.markAllRead()
      } catch (err) {
        await this.fetchNotifications()
      }
    },

    openProposal (item) {
      const route = this.getProposalRoute(item)
      if (!route) return
      this.$router.push(route)
    },
  },
}
</script>

<style scoped>
/* ══════════════════════════════════
   Layout
══════════════════════════════════ */
.app-layout { display: flex; min-height: 100vh; }

.app-body {
  margin-left: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.app-body.sidebar-open { margin-left: 0; }

/* ══════════════════════════════════
   Sidebar
══════════════════════════════════ */
.sidebar {
  width: 72px;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  position: fixed;
  top: 0; left: 0;
  height: 100vh;
  z-index: 200;
  border-right: 1px solid #2a2a2a;
  overflow: hidden;
  transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar.expanded { width: 240px; }

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  background: #111;
  border-bottom: 1px solid #2a2a2a;
  flex-shrink: 0;
}

.sidebar-logo {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.2s;
}
.sidebar.expanded .sidebar-logo { opacity: 1; }

.logo-text {
  font-weight: 700;
  font-size: 15px;
  color: #c8e6c9;
  letter-spacing: 2px;
  white-space: nowrap;
}

.hamburger-btn {
  flex-shrink: 0;
  width: 72px; height: 60px;
  background: none; border: none;
  color: #aaa;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: color 0.2s;
}
.hamburger-btn:hover { color: #c8e6c9; }

.sidebar-subtitle {
  height: 44px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  overflow: hidden;
  flex-shrink: 0;
  border-bottom: 1px solid #242424;
}
.sidebar-subtitle span {
  font-size: 11.5px;
  color: #6a8c6b;
  white-space: nowrap;
  font-weight: 500;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 10px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  height: 46px;
  border-radius: 10px;
  padding: 0 12px;
  color: #888;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  transition: background 0.2s, color 0.2s;
}
.nav-item:hover,
.nav-item.active { background: #2a2a2a; color: #c8e6c9; }

.nav-icon-wrap {
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  width: 22px;
}
.nav-label { font-size: 14px; font-weight: 500; color: inherit; }

.sidebar-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 199;
}

.fade-text-enter-active { transition: opacity 0.2s ease 0.1s, transform 0.2s ease 0.1s; }
.fade-text-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.fade-text-enter-from,
.fade-text-leave-to     { opacity: 0; transform: translateX(-8px); }

.overlay-fade-enter-active,
.overlay-fade-leave-active { transition: opacity 0.28s ease; }
.overlay-fade-enter-from,
.overlay-fade-leave-to     { opacity: 0; }

/* ══════════════════════════════════
   Topbar
══════════════════════════════════ */
.topbar {
  position: fixed;
  top: 0; right: 0;
  height: 60px;
  background: #2d3a2e;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 24px;
  z-index: 100;
  border-bottom: 1px solid #3a4a3b;
  transition: left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.topbar-right {
  display: flex; align-items: center; gap: 16px; color: #d0d0d0;
}

.lang-switcher { display: flex; align-items: center; gap: 4px; font-size: 14px; }
.lang-switcher span { cursor: pointer; padding: 2px 4px; border-radius: 4px; color: #aaa; transition: color 0.2s; }
.lang-switcher span.active { color: #fff; font-weight: 600; }
.lang-switcher span:hover  { color: #c8e6c9; }
.lang-switcher .divider    { color: #555; cursor: default; }

.bell-btn {
  background: none; border: none;
  color: #c8e6c9; position: relative;
  display: flex; align-items: center; cursor: pointer;
}
.bell-badge {
  position: absolute; top: -2px; right: -2px;
  width: 9px; height: 9px;
  background: #ef5350; border-radius: 50%;
  border: 1.5px solid #2d3a2e;
}

.user-menu {
  display: flex; align-items: center; gap: 8px;
  cursor: pointer; padding: 6px 10px;
  border-radius: 8px; transition: background 0.2s;
}
.user-menu:hover { background: rgba(255,255,255,0.08); }

.user-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: #4a7c59;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
}
.caret { font-size: 12px; color: #aaa; }

/* ══════════════════════════════════
   Page
══════════════════════════════════ */
.page-wrapper {
  margin-top: 60px;
  background: #e8eaf0;
  padding: 16px;
  min-height: calc(100vh - 60px);
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  box-sizing: border-box;
}

.notif-card {
  background: #fff;
  border-radius: 16px;
  border: none;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

/* ══════════════════════════════════
   Notification Header
══════════════════════════════════ */
.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 28px;
  flex-wrap: nowrap;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.filter-tab {
  padding: 7px 18px;
  border-radius: 99px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: 'Sarabun', sans-serif;
  background: #f3f4f6;
  color: #6b7280;
  transition: background 0.2s, color 0.2s;
}

.filter-tab.active {
  background: #8b1212;
  color: #fff;
  box-shadow: none !important;
  border: none !important;
  outline: none !important;
  filter: none !important;
}

.header-left { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
.header-right { display: flex; align-items: center; gap: 12px; }

/* Toolbar */
.notif-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  gap: 8px;
}

.unread-count { font-size: 13px; color: #9ca3af; }

.btn-mark-all {
  font-size: 13px;
  color: #8b1212;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-family: 'Sarabun', sans-serif;
  transition: opacity 0.2s;
}
.btn-mark-all:hover { opacity: 0.7; }

/* ══════════════════════════════════
   Group
══════════════════════════════════ */
.notif-group { margin-bottom: 4px; }

.group-header {
  background: transparent;
  padding: 12px 28px;
}

.group-label {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.page-wrapper.is-dark {
  background: transparent;
}

.notif-card.is-dark {
  background: #1f2933;
  border: 1px solid #334155;
  box-shadow: 0 1px 0 rgba(148, 163, 184, 0.08);
}

.page-wrapper.is-dark .page-title,
.page-wrapper.is-dark .group-label,
.page-wrapper.is-dark .notif-title {
  color: #e5edf5;
}

.page-wrapper.is-dark .unread-count,
.page-wrapper.is-dark .notif-desc,
.page-wrapper.is-dark .notif-time,
.page-wrapper.is-dark .empty-state p {
  color: #9fb0c3;
}

/* .page-wrapper.is-dark .filter-tab {
  background: #253240;
  color: #dce7f3;
} */

.page-wrapper.is-dark .filter-tab.active {
  background: #8b1212;
  color: #fff;
}

.page-wrapper.is-dark .notif-item {
  background: #1f2933;
  border-bottom-color: #334155;
}

.page-wrapper.is-dark .notif-item:hover {
  background: #253240;
}

.page-wrapper.is-dark .notif-item.unread {
  background: #20303f;
}

.page-wrapper.is-dark .notif-item.unread:hover {
  background: #27384a;
}

.page-wrapper.is-dark .notif-action-btn {
  /* use the same red action tone in dark mode (darker gradient) */
  background: linear-gradient(180deg, #7a0f0f 0%, #5b0b0b 60%, #3c0808 100%);
  color: #fff;
  box-shadow: 0 6px 14px rgba(139,18,18,0.18), inset 0 -3px 6px rgba(0,0,0,0.12);
}

.page-wrapper.is-dark .notif-action-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
  box-shadow: 0 10px 22px rgba(16,44,30,0.28), inset 0 -2px 4px rgba(255,255,255,0.02);
}

.page-wrapper.is-dark .btn-mark-all {
  color: #8b1212;
}

.page-wrapper.is-dark .notif-header {
  border-bottom: 1px solid #334155;
}

.page-wrapper.is-dark .notif-group {
  background: #1f2933;
}

.page-wrapper.is-dark .group-header {
  border-top: 1px solid #334155;
}

.page-wrapper.is-dark .group-header:first-of-type {
  border-top: none;
}

.page-wrapper.is-dark .notif-item {
  border-bottom-color: #334155;
}

.page-wrapper.is-dark .notif-item:last-child {
  border-bottom-color: transparent;
}

.page-wrapper.is-dark .icon-blue {
  background: rgba(59, 130, 246, 0.12);
  color: #93c5fd;
}

.page-wrapper.is-dark .icon-orange {
  background: rgba(251, 146, 60, 0.10);
  color: #fbc38a;
}

.page-wrapper.is-dark .icon-green {
  background: rgba(52, 211, 153, 0.10);
  color: #8ee7b7;
}

.page-wrapper.is-dark .icon-gray {
  background: rgba(148, 163, 184, 0.08);
  color: #cbd5e1;
}

/* ══════════════════════════════════
   Notification Item
══════════════════════════════════ */
.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #eef2ff;
  cursor: pointer;
  transition: background 0.15s;
  background: #fff;
}
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: #f9fafb; }
.notif-item.unread { background: #f0faf3; }
.notif-item.unread:hover { background: #e6f7ed; }

/* Icon */
.notif-icon {
  flex-shrink: 0;
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  margin-top: 2px;
  /* remove any visible border/outline that may appear as a thick black edge */
  border: none;
  box-shadow: none;
  background-clip: padding-box;
}

/* Force-clear any inherited outline/border from global styles or browser focus */
.notif-icon,
.notif-icon *,
.notif-icon svg {
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

/* Ensure SVG strokes are not overly thick */
.notif-icon svg {
  stroke-width: 1.6 !important;
}

/* Stronger scoped overrides to prevent other global styles from adding a dark ring */
.notif-item .notif-icon,
.notif-item .notif-icon svg {
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

/* Ensure SVG strokes follow the icon color and stay thin in both themes */
.notif-item .notif-icon svg {
  stroke: currentColor !important;
  stroke-width: 1.2 !important;
}

/* Dark theme: make sure icon stroke is visible on dark background */
.page-wrapper.is-dark .notif-item .notif-icon svg {
  stroke: #e5edf5 !important;
}

.icon-blue   { background: #eef2ff; color: #2563eb; }
.icon-orange { background: #fff8ef; color: #f97316; }
.icon-green  { background: #f0fdf4; color: #16a34a; }
.icon-gray   { background: #f7fafb; color: #4b5563; }
.icon-red    { background: #fee2e2; color: #dc2626; }

/* Content */
.notif-content { flex: 1; min-width: 0; }

.notif-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
  line-height: 1.4;
}

.notif-desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 10px;
}

.notif-actions { display: flex; flex-wrap: wrap; gap: 8px; }

.notif-action-btn {
  padding: 5px 14px;
  border-radius: 99px;
  border: none;
  background: linear-gradient(180deg, #8b1212 0%, rgba(197, 155, 58, 0.98) 100%);
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Sarabun', sans-serif;
  box-shadow: 0 6px 14px rgba(139,18,18,0.18), inset 0 -3px 6px rgba(0,0,0,0.12);
  transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
}

.notif-action-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.06);
  box-shadow: 0 10px 20px rgba(139,18,18,0.22), inset 0 -2px 4px rgba(255,255,255,0.03);
}

.notif-action-btn:active {
  transform: translateY(0);
  filter: brightness(0.96);
  box-shadow: 0 4px 10px rgba(0,0,0,0.18), inset 0 3px 6px rgba(0,0,0,0.12);
}

.notif-action-btn:focus {
  outline: none;
  box-shadow: 0 10px 20px rgba(139,18,18,0.18), 0 0 0 6px rgba(178,31,31,0.12);
}

.notification-detail {
  display: grid;
  gap: 18px;
  padding: 1.1rem;
  background:
    radial-gradient(circle at top right, rgba(197, 155, 58, 0.10), transparent 32%),
    linear-gradient(180deg, #fcfcfb 0%, #ffffff 100%);
}

.notification-detail__hero {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 18px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(139, 18, 18, 0.06) 0%, rgba(197, 155, 58, 0.12) 100%);
  color: #0f172a;
  border: 1px solid rgba(197, 155, 58, 0.28);
  box-shadow: 0 10px 24px rgba(139, 18, 18, 0.06);
}

.notification-detail__icon-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(139, 18, 18, 0.12) 0%, rgba(197, 155, 58, 0.24) 100%);
  border: 1px solid rgba(197, 155, 58, 0.28);
}

.notification-detail__icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--am-accent, #8b1212);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(197, 155, 58, 0.24);
}

.notification-detail__icon .c-icon {
  width: 24px;
  height: 24px;
}

.notification-detail__hero-copy {
  min-width: 0;
  display: grid;
  gap: 8px;
}

.notification-detail__eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(139, 18, 18, 0.7);
}

.notification-detail__title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
}

.notification-detail__time {
  font-size: 13px;
  color: #475569;
}

.notification-detail__meta-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.notification-detail__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.notification-detail__chip--solid {
  background: rgba(139, 18, 18, 0.08);
  color: var(--am-accent, #8b1212);
  border: 1px solid rgba(139, 18, 18, 0.14);
}

.notification-detail__chip--fresh {
  background: rgba(197, 155, 58, 0.16);
  color: #7c5b12;
  border: 1px solid rgba(197, 155, 58, 0.22);
}

.notification-detail__chip--muted {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.notification-detail__meta-sep {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #cbd5e1;
}

.notification-detail__message-card {
  padding: 16px;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(197, 155, 58, 0.16);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
}

.notification-detail__section-title {
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--am-accent, #8b1212);
}

.notification-detail__message {
  padding: 16px 18px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 250, 240, 0.96) 0%, rgba(255, 255, 255, 1) 100%);
  color: #1e293b;
  line-height: 1.8;
  white-space: pre-wrap;
  border: 1px solid rgba(197, 155, 58, 0.18);
}

.notification-detail__transition {
  padding: 14px 16px;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(197, 155, 58, 0.16);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
}

.notification-detail__transition-status {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.notification-detail__status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.notification-detail__status-pill--from {
  background: rgba(139, 18, 18, 0.08);
  color: var(--am-accent, #8b1212);
}

.notification-detail__status-pill--to {
  background: rgba(197, 155, 58, 0.18);
  color: #7c5b12;
}

.notification-detail__transition-arrow {
  font-size: 20px;
  font-weight: 700;
  color: rgba(139, 18, 18, 0.66);
}

.notification-detail__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.notification-detail__field {
  padding: 14px 16px;
  border: 1px solid rgba(197, 155, 58, 0.14);
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.03);
}

.notification-detail__field--wide {
  grid-column: 1 / -1;
}

.notification-detail__label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(139, 18, 18, 0.74);
  margin-bottom: 8px;
}

.notification-detail__value {
  font-size: 14px;
  color: #0f172a;
  word-break: break-word;
  line-height: 1.6;
}

.notification-detail__value--strong {
  font-weight: 700;
}

.notification-detail__proposal-code {
  display: inline-flex;
  align-items: center;
  margin-right: 8px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(197, 155, 58, 0.18);
  color: #7c5b12;
  font-weight: 700;
}

.notification-detail__proposal-title {
  color: #334155;
}

.notification-detail__footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 1.1rem 1.1rem;
}

.page-wrapper.is-dark .notification-detail {
  background:
    radial-gradient(circle at top right, rgba(197, 155, 58, 0.12), transparent 32%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(15, 23, 42, 0.98) 100%);
}

.page-wrapper.is-dark .notification-detail__hero {
  background: linear-gradient(135deg, rgba(139, 18, 18, 0.22) 0%, rgba(197, 155, 58, 0.12) 100%);
  border-color: rgba(197, 155, 58, 0.2);
  box-shadow: 0 14px 32px rgba(2, 6, 23, 0.26);
}

.page-wrapper.is-dark .notification-detail__icon-shell {
  background: rgba(139, 18, 18, 0.22);
  border-color: rgba(197, 155, 58, 0.22);
}

.page-wrapper.is-dark .notification-detail__icon {
  color: #f8fafc;
  background: rgba(15, 23, 42, 0.72);
  border-color: rgba(148, 163, 184, 0.18);
}

.page-wrapper.is-dark .notification-detail__message,
.page-wrapper.is-dark .notification-detail__field {
  background: rgba(15, 23, 42, 0.82);
  border-color: rgba(197, 155, 58, 0.16);
}

.page-wrapper.is-dark .notification-detail__message-card,
.page-wrapper.is-dark .notification-detail__transition {
  background: rgba(15, 23, 42, 0.9);
  border-color: rgba(197, 155, 58, 0.18);
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.2);
}

.page-wrapper.is-dark .notification-detail__title,
.page-wrapper.is-dark .notification-detail__value {
  color: #f9fafb;
}

.page-wrapper.is-dark .notification-detail__section-title,
.page-wrapper.is-dark .notification-detail__label {
  color: #f5d28c;
}

.page-wrapper.is-dark .notification-detail__time,
.page-wrapper.is-dark .notification-detail__proposal-title,
.page-wrapper.is-dark .notification-detail__meta-sep {
  color: #cbd5e1;
}

.page-wrapper.is-dark .notification-detail__chip--solid {
  background: rgba(139, 18, 18, 0.24);
  color: #f8d7d7;
  border-color: rgba(139, 18, 18, 0.24);
}

.page-wrapper.is-dark .notification-detail__chip--fresh {
  background: rgba(197, 155, 58, 0.22);
  color: #fde7aa;
  border-color: rgba(197, 155, 58, 0.22);
}

.page-wrapper.is-dark .notification-detail__chip--muted {
  background: rgba(51, 65, 85, 0.8);
  color: #e2e8f0;
  border-color: rgba(148, 163, 184, 0.14);
}

.page-wrapper.is-dark .notification-detail__status-pill--from {
  background: rgba(139, 18, 18, 0.22);
  color: #f8d7d7;
}

.page-wrapper.is-dark .notification-detail__status-pill--to {
  background: rgba(197, 155, 58, 0.22);
  color: #fde7aa;
}

.page-wrapper.is-dark .notification-detail__proposal-code {
  background: rgba(197, 155, 58, 0.18);
  color: #fde7aa;
}

@media (max-width: 768px) {
  .notification-detail {
    padding: 0.85rem;
  }

  .notification-detail__hero {
    align-items: flex-start;
    padding: 16px;
  }

  .notification-detail__meta-line {
    align-items: flex-start;
  }

  .notification-detail__transition-status {
    flex-direction: column;
  }
}

/* Meta */
.notif-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.notif-time {
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
}

.unread-dot {
  width: 9px; height: 9px;
  border-radius: 50%;
  background: #ef5350;
}

/* ══════════════════════════════════
   Empty
══════════════════════════════════ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  color: #ccc;
  gap: 12px;
}
.empty-state p { font-size: 15px; color: #9ca3af; }

/* ══ Notification Dropdown ══ */
.notif-dropdown-wrap { position: relative; }

.bell-btn {
  background: none; border: none;
  color: #c8e6c9; position: relative;
  display: flex; align-items: center;
  cursor: pointer; padding: 4px;
  border-radius: 8px;
  transition: background 0.2s;
}
.bell-btn:hover { background: rgba(255,255,255,0.1); }

.bell-badge {
  position: absolute; top: 2px; right: 2px;
  width: 9px; height: 9px;
  background: #ef5350; border-radius: 50%;
  border: 1.5px solid #2d3a2e;
}

.dp-backdrop {
  position: fixed; inset: 0; z-index: 149;
}

.dropdown-panel {
  position: absolute;
  top: calc(100% + 14px);
  right: 0;
  width: 360px;
  background: #1e1e1e;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.45);
  z-index: 150;
  overflow: hidden;
  border: 1px solid #2a2a2a;
}

.dropdown-panel::before {
  content: '';
  position: absolute;
  top: -8px; right: 18px;
  width: 16px; height: 16px;
  background: #1e1e1e;
  border-left: 1px solid #2a2a2a;
  border-top: 1px solid #2a2a2a;
  transform: rotate(45deg);
  border-radius: 2px;
}

.dp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid #2a2a2a;
}
.dp-title { font-size: 16px; font-weight: 700; color: #e0e0e0; }
.dp-unread {
  font-size: 12px; font-weight: 600; color: #fff;
  background: #ef5350; padding: 2px 10px; border-radius: 99px;
}

.dp-list {
  max-height: 320px; overflow-y: auto;
  scrollbar-width: thin; scrollbar-color: #333 transparent;
}
.dp-list::-webkit-scrollbar { width: 4px; }
.dp-list::-webkit-scrollbar-thumb { background: #333; border-radius: 99px; }

.dp-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #2a2a2a;
  cursor: pointer; transition: background 0.15s;
  position: relative;
}
.dp-item:last-child { border-bottom: none; }
.dp-item:hover { background: #252525; }
.dp-item.unread { background: #1a2820; }
.dp-item.unread:hover { background: #1e3025; }

.dp-icon {
  flex-shrink: 0; width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  margin-top: 2px;
}
.icon-blue   { background: #dbeafe; color: #1d4ed8; }
.icon-orange { background: #ffedd5; color: #c2410c; }
.icon-green  { background: #dcfce7; color: #15803d; }
.icon-gray   { background: #f3f4f6; color: #4b5563; }

.dp-content { flex: 1; min-width: 0; }
.dp-item-title {
  font-size: 13px; font-weight: 600; color: #e0e0e0;
  line-height: 1.4; margin-bottom: 3px;
  display: -webkit-box;   line-clamp: 1;  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}
.dp-item-desc {
  font-size: 12px; color: #777; line-height: 1.4; margin-bottom: 5px;
  display: -webkit-box;   line-clamp: 1;  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical; overflow: hidden;
}
.dp-item-time { font-size: 11px; color: #555; }

.dp-dot {
  flex-shrink: 0; width: 8px; height: 8px;
  border-radius: 50%; background: #ef5350; margin-top: 6px;
}

.dp-footer {
  padding: 12px 20px;
  border-top: 1px solid #2a2a2a;
}
.dp-view-all {
  width: 100%; padding: 10px;
  background: #2a2a2a; border: none; border-radius: 10px;
  color: #c8e6c9; font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: 'Sarabun', sans-serif;
  transition: background 0.2s;
}
.dp-view-all:hover { background: #333; }

.dropdown-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.dropdown-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.dropdown-enter-from,
.dropdown-leave-to { opacity: 0; transform: translateY(-8px) scale(0.97); }

/* Responsive adjustments for mobile */
@media (max-width: 900px) {
  .page-wrapper { padding: 12px 18px; }
  .notif-card { max-width: 100%; border-radius: 12px; }
  .notif-header { flex-wrap: wrap; padding: 12px 16px; gap: 12px; }
  .header-left { align-items: flex-start; }
  .page-title { font-size: 20px }
  .filter-tabs { order: 2; }
  .header-right { order: 3; width: 100%; justify-content: flex-start; }
  .notif-toolbar { padding: 6px 0; }
  .notif-item { padding: 12px 16px; gap: 12px }
  .notif-icon { width: 40px; height: 40px; border-radius: 10px }
  .notif-title { font-size: 13px }
  .notif-desc { font-size: 12px }
  .notif-meta { align-items: flex-start; }
}

@media (max-width: 520px) {
  .page-wrapper { padding: 10px 12px; }
  .notif-header { padding: 10px 12px; }
  .filter-tabs { display: flex; gap: 6px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  /* .filter-tab { padding: 6px 12px; font-size: 13px } */
  .notif-item { flex-direction: column; align-items: stretch; }
  .notif-icon { width: 48px; height: 48px; margin-bottom: 8px }
  .notif-content { margin-bottom: 8px }
  .notif-meta { flex-direction: row; justify-content: space-between; width: 100%; }
  .notif-time { font-size: 12px }
  .notif-action-btn { padding: 6px 12px; font-size: 13px }
  .group-label { font-size: 18px }
  .empty-state { padding: 40px 12px }
}

/* Force remove dark borders on notification UI when user reports no visible change */
.notif-card.is-dark,
.page-wrapper.is-dark .notif-header,
.dropdown-panel,
.dropdown-panel::before,
.bell-badge,
.dp-item,
.dp-footer {
  border-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

/* If any outline/pseudo-element adds a ring, hide it */
.notif-card.is-dark::before,
.dropdown-panel::after,
.bell-badge::before,
.notif-item::before {
  display: none !important;
  border: none !important;
}
/* High-specificity override: remove persistent black rings/borders on tabs and buttons */
.page-wrapper .filter-tab,
.page-wrapper .filter-tab *,
.page-wrapper .filter-tab svg,
.page-wrapper .filter-tab:focus,
.page-wrapper .filter-tab:focus-visible,
.page-wrapper .filter-tab.active,
.page-wrapper .btn-mark-all,
.page-wrapper .btn-mark-all *,
.bell-btn,
.bell-btn * {
  border: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
  outline: none !important;
  background-clip: padding-box !important;
}

.page-wrapper .filter-tab.active {
  box-shadow: none !important;
  border: none !important;
}

.page-wrapper .filter-tab svg,
.bell-btn svg {
  stroke: currentColor !important;
  stroke-width: 0.9 !important;
}

/* Force-remove any thick border/halo left by other global styles or browser UA styles */
.page-wrapper .filter-tab,
.page-wrapper .filter-tab:focus,
.page-wrapper .filter-tab:focus-visible,
.page-wrapper .filter-tab.active,
.page-wrapper .filter-tab::before,
.page-wrapper .filter-tab::after {
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
  background-clip: padding-box !important;
}

</style>
