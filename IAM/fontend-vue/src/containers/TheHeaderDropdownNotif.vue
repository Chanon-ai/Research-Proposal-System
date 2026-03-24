<template>
  <CDropdown
    placement="bottom-end"
    :caret="false"
    in-nav
    :show.sync="isNotificationOpen"
    class="c-header-nav-item mx-2 notification-dropdown"
    :add-menu-classes="menuClasses"
  >
    <template #toggler>
      <CHeaderNavLink class="notification-bell-link">
        <span class="notification-bell-wrap">
          <CIcon name="cil-bell" size="lg"/>
          <CBadge
            v-if="notificationCount > 0"
            shape="pill"
            color="danger"
            class="notification-bell-badge"
          >
            {{ notificationCount > 99 ? '99+' : notificationCount }}
          </CBadge>
        </span>
      </CHeaderNavLink>
    </template>

    <CDropdownHeader tag="div" class="notification-header notification-dropdown__header">
      <strong>{{ $t('header.youHave', { count: notificationCount }) }}</strong>
    </CDropdownHeader>

    <div class="notification-list notification-dropdown__list">
      <CDropdownItem
        v-for="notif in notifications"
        :key="notif.id"
        class="notification-item notification-dropdown__item d-block"
        @click="openNotification(notif)"
      >
        <div class="notification-row">
          <div class="notification-avatar-wrap notification-dropdown__avatar-wrap">
            <div v-if="notif.avatar" class="c-avatar">
              <img :src="notif.avatar" class="c-avatar-img" :alt="notif.senderName">
            </div>
            <div v-else class="notification-type-icon" :class="`type-${notif.type}`">
              <CIcon :name="iconByType(notif.type)" size="sm"/>
            </div>
          </div>

          <div class="notification-content">
            <div class="notification-top-line">
              <small class="notification-sender notification-dropdown__sender text-truncate pr-2">{{ notif.senderName }}</small>
              <small class="notification-time notification-dropdown__time">{{ notif.timeLabel }}</small>
            </div>
            <div class="notification-title notification-dropdown__title" :class="{ 'is-unread': notif.unread }">{{ notif.title }}</div>
            <div class="notification-message notification-dropdown__message">{{ notif.message }}</div>
          </div>

          <span v-if="notif.unread" class="unread-dot" aria-hidden="true"></span>
        </div>
      </CDropdownItem>

      <CDropdownItem v-if="notifications.length === 0" class="text-center notification-empty">
        {{ $t('header.noNotifications') }}
      </CDropdownItem>
    </div>

    <CDropdownItem class="border-top text-center notification-footer notification-dropdown__footer" @click="viewAll">
      <strong>{{ $t('common.viewAll') }}</strong>
    </CDropdownItem>
  </CDropdown>
</template>

<script>
import Service from '@/service/api'

export default {
  name: 'TheHeaderDropdownNotif',
  data () {
    return {
      isNotificationOpen: false,
      notificationCount: 0,
      notifications: []
    }
  },

  computed: {
    isDarkTheme () {
      return Boolean(this.$store && this.$store.state && this.$store.state.darkMode)
    },

    menuClasses () {
      return this.isDarkTheme
        ? 'pt-0 notification-menu notification-dropdown__menu notification-dropdown__menu--dark'
        : 'pt-0 notification-menu notification-dropdown__menu'
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
    }
  },

  watch: {
    isNotificationOpen (open) {
      if (open) {
        this.fetchNotifications()
      }
    }
  },

  async mounted () {
    await this.fetchNotifications()
    document.addEventListener('click', this.handleClickOutside, true)
  },

  beforeDestroy () {
    document.removeEventListener('click', this.handleClickOutside, true)
  },

  methods: {
    handleClickOutside (event) {
      if (!this.isNotificationOpen) return
      if (!this.$el || this.$el.contains(event.target)) return
      this.isNotificationOpen = false
    },

    async fetchNotifications () {
      try {
        const res = await Service.notification.list({ page: 1, limit: 6 })
        const payload = res && res.data && res.data.data ? res.data.data : {}
        const rows = Array.isArray(payload.notifications)
          ? payload.notifications
          : (Array.isArray(payload.items) ? payload.items : [])

        const mapped = rows.map(this.normalizeNotification)
        this.notifications = mapped
        this.notificationCount = mapped.filter(n => n.unread).length
      } catch (e) {
        const mock = this.getMockNotifications()
        this.notifications = mock
        this.notificationCount = mock.filter(n => n.unread).length
      }
    },

    normalizeNotification (n) {
      const eventKey = String(n && n.eventKey ? n.eventKey : '').toLowerCase()
      const type = this.typeByEvent(eventKey)
      const createdAt = n && (n.createdAt || n.sentAt || n.updatedAt)
      const payload = n && n.payload ? n.payload : {}
      return {
        id: n && n._id ? String(n._id) : String(Math.random()),
        title: n && n.title ? n.title : 'การแจ้งเตือน',
        message: n && n.message ? n.message : '-',
        senderName: payload.senderName || (eventKey ? 'ระบบแจ้งเตือน' : 'ระบบ'),
        avatar: payload.avatar || null,
        timestamp: createdAt || null,
        timeLabel: this.timeAgo(createdAt),
        unread: !(n && n.isRead),
        type,
        raw: n
      }
    },

    getMockNotifications () {
      const now = Date.now()
      return [
        {
          id: 'mock-1',
          title: 'โครงการถูกส่งเพื่อพิจารณา',
          message: 'ระบบได้รับข้อเสนอโครงการของคุณเรียบร้อยแล้ว',
          senderName: 'ระบบงานวิจัย',
          avatar: null,
          timestamp: new Date(now - 2 * 60 * 1000).toISOString(),
          timeLabel: 'Just now',
          unread: true,
          type: 'info',
          raw: null
        },
        {
          id: 'mock-2',
          title: 'มีคำขอแก้ไขเอกสาร',
          message: 'กรุณาตรวจสอบความคิดเห็นจากคณะกรรมการและแก้ไขก่อนส่งรอบถัดไป',
          senderName: 'คณะกรรมการ',
          avatar: null,
          timestamp: new Date(now - 25 * 60 * 1000).toISOString(),
          timeLabel: '25 minutes ago',
          unread: true,
          type: 'warning',
          raw: null
        },
        {
          id: 'mock-3',
          title: 'โครงการได้รับการอนุมัติ',
          message: 'ยินดีด้วย โครงการของคุณผ่านการอนุมัติแล้ว',
          senderName: 'สำนักงานวิจัย',
          avatar: null,
          timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
          timeLabel: '3 days ago',
          unread: false,
          type: 'success',
          raw: null
        }
      ]
    },

    timeAgo (dateStr) {
      if (!dateStr) return '-'
      const diff = Date.now() - new Date(dateStr).getTime()
      if (!Number.isFinite(diff) || diff < 0) return '-'
      const minutes = Math.floor(diff / 60000)
      if (minutes < 1) return 'Just now'
      if (minutes < 60) return `${minutes} minutes ago`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours} hours ago`
      const days = Math.floor(hours / 24)
      return `${days} days ago`
    },

    typeByEvent (eventKey) {
      if (eventKey.includes('approved') || eventKey.includes('announce')) return 'success'
      if (eventKey.includes('revision') || eventKey.includes('reject')) return 'warning'
      if (eventKey.includes('assign') || eventKey.includes('committee')) return 'primary'
      return 'info'
    },

    iconByType (type) {
      if (type === 'success') return 'cil-check-circle'
      if (type === 'warning') return 'cil-warning'
      if (type === 'primary') return 'cil-user'
      return 'cil-bell'
    },

    async openNotification (notif) {
      if (notif && notif.unread && notif.raw && notif.raw._id) {
        try {
          await Service.notification.markRead(notif.raw._id)
        } catch (e) {
          // Ignore mark-read error in dropdown mode.
        }
      }
      await this.fetchNotifications()
    },

    viewAll () {
      this.isNotificationOpen = false

      const role = this.currentRole
      if (['admin', 'legacy_admin', 'chairman'].includes(String(role || ''))) {
        this.$router.push('/admin/notifications')
        return
      }

      this.$router.push('/user/notification')
    }
  }
}
</script>

<style scoped>
.notification-bell-link {
  padding: 0.35rem 0.45rem;
  color: #6b0f0f;
}

.notification-bell-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.notification-bell-badge {
  position: absolute;
  top: -7px;
  right: -10px;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  font-size: 10px;
  padding: 0 4px;
  line-height: 18px;
  text-align: center;
}

.notification-header {
  min-width: 320px;
  padding: 0.66rem 1rem;
  background: var(--notif-header-bg, linear-gradient(90deg, #8c1515, rgba(107, 15, 15, 0.98)));
  border-bottom: 1px solid var(--notif-border, #e5e7eb);
  color: var(--notif-header-text, #ffffff);
}

.notification-list {
  max-height: 300px;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--notif-dropdown-bg, #fff);
}

.notification-item {
  padding: 0.72rem 1rem;
  color: var(--notif-text-main, #212529);
  border-bottom: 1px solid var(--notif-border, #eef2f6);
  background: var(--notif-item-bg, transparent);
}

.notification-row {
  display: flex;
  align-items: flex-start;
  width: 100%;
  gap: 0;
}

.notification-avatar-wrap {
  flex: 0 0 auto;
  margin-right: 0.75rem;
}

.notification-type-icon {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.notification-type-icon.type-success { background: rgba(40, 167, 69, 0.16); color: #28a745; }
.notification-type-icon.type-warning { background: #fff8ef; color: #d97706; }
.notification-type-icon.type-primary { background: #eef2ff; color: #2563eb; }
.notification-type-icon.type-info { background: #f3f4f6; color: #6b7280; }

.notification-content {
  min-width: 0;
  flex: 1;
}

.notification-sender {
  color: var(--notif-sender, #4b5563);
  min-width: 0;
}

.notification-top-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
  gap: 6px;
}

.notification-time {
  flex: 0 0 auto;
  text-align: right;
  white-space: nowrap;
  color: var(--notif-time, #6b7280);
  font-size: 0.72rem;
}

.notification-title {
  font-size: 0.835rem;
  color: var(--notif-title, #1f2937);
  line-height: 1.25;
  margin-bottom: 2px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-title.is-unread {
  font-weight: 700;
  color: var(--notif-title-unread, #8c1515);
}

.notification-message {
  font-size: 0.76rem;
  color: var(--notif-muted, #6b7280);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-empty {
  color: var(--notif-muted, #6b7280);
  padding: 1rem;
}

.notification-footer {
  background: var(--notif-dropdown-bg, #fff);
  color: var(--notif-footer, #1f2937);
  padding: 0.7rem 1rem;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #2f74ff;
  margin-top: 5px;
  margin-left: 8px;
  flex: 0 0 auto;
}

:deep(.notification-menu) {
  width: 380px !important;
  min-width: 340px !important;
  max-width: min(420px, calc(100vw - 20px)) !important;
  max-height: min(460px, calc(100vh - 110px)) !important;
  overflow: hidden;
  border-radius: 0.7rem;
  padding-bottom: 0;
  left: auto !important;
  right: -6px !important;
  transform: translate3d(0, 0, 0) !important;
  --notif-dropdown-bg: #ffffff;
  --notif-header-bg: linear-gradient(90deg, #8c1515, rgba(107, 15, 15, 0.98));
  --notif-header-text: #ffffff;
  --notif-item-bg: transparent;
  --notif-text-main: #1f2937;
  --notif-title: #1f2937;
  --notif-title-unread: #8c1515;
  --notif-sender: #6b7280;
  --notif-muted: #6b7280;
  --notif-time: #9ca3af;
  --notif-footer: #6b0f0f;
  --notif-border: rgba(140, 21, 21, 0.14);
  --notif-item-hover: rgba(254, 194, 96, 0.22);
  --notif-footer-hover: rgba(254, 194, 96, 0.18);
  background: var(--notif-dropdown-bg);
  border: 1px solid var(--notif-border);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.2);
}

:deep(.notification-dropdown__menu) .dropdown-item {
  white-space: normal;
}

:deep(.notification-dropdown__menu--dark) {
  --notif-dropdown-bg: #111827;
  --notif-header-bg: linear-gradient(90deg, #1f2937, #111827);
  --notif-header-text: #f8fafc;
  --notif-item-bg: transparent;
  --notif-text-main: #e5e7eb;
  --notif-title: #f3f4f6;
  --notif-title-unread: #fde68a;
  --notif-sender: #cbd5e1;
  --notif-muted: #9ca3af;
  --notif-time: #9ca3af;
  --notif-footer: #e5e7eb;
  --notif-border: rgba(148, 163, 184, 0.34);
  --notif-item-hover: rgba(51, 65, 85, 0.76);
  --notif-footer-hover: rgba(51, 65, 85, 0.76);
  background: var(--notif-dropdown-bg);
  border-color: var(--notif-border);
  box-shadow: 0 20px 44px rgba(2, 6, 23, 0.52);
}

:deep(.notification-dropdown__menu--dark) .notification-dropdown__header {
  color: var(--notif-text-main);
  background: var(--notif-header-bg);
  border-bottom-color: var(--notif-border);
}

:deep(.notification-dropdown__menu--dark) .notification-dropdown__item {
  color: var(--notif-text-main);
  background: transparent;
  border-bottom-color: rgba(148, 163, 184, 0.22);
}

:deep(.notification-dropdown__menu--dark) .notification-dropdown__item:hover {
  background: var(--notif-item-hover);
}

:deep(.notification-dropdown__menu--dark) .notification-dropdown__item:active {
  background: rgba(51, 65, 85, 0.9);
}

:deep(.notification-dropdown__menu--dark) .notification-dropdown__item .notification-dropdown__title.is-unread {
  color: var(--notif-title-unread);
}

:deep(.notification-dropdown__menu--dark) .notification-dropdown__footer {
  background: var(--notif-dropdown-bg);
  color: var(--notif-footer);
  border-top-color: var(--notif-border) !important;
}

:deep(.notification-dropdown__menu--dark) .notification-dropdown__footer:hover {
  background: var(--notif-footer-hover);
  color: #f5f8fd;
}

:deep(.notification-dropdown__menu--dark) .notification-empty {
  background: var(--notif-dropdown-bg);
  color: var(--notif-muted) !important;
}

:deep(.notification-dropdown__menu--dark) .notification-type-icon.type-warning {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.2);
}

:deep(.notification-dropdown__menu--dark) .notification-type-icon.type-info {
  color: #cbd5e1;
  background: rgba(148, 163, 184, 0.2);
}

:deep(.notification-dropdown__menu--dark) .notification-type-icon.type-primary {
  color: #93c5fd;
  background: rgba(59, 130, 246, 0.2);
}

:deep(.notification-dropdown__menu--dark) .notification-type-icon.type-success {
  color: #fde68a;
  background: rgba(245, 158, 11, 0.22);
}

:deep(.notification-dropdown__menu--dark) .notification-dropdown__sender {
  color: var(--notif-sender);
}

:deep(.notification-dropdown__menu--dark) .notification-dropdown__time {
  color: var(--notif-time);
}

:deep(.notification-dropdown__menu--dark) .notification-dropdown__title {
  color: var(--notif-title);
}

:deep(.notification-dropdown__menu--dark) .notification-dropdown__message {
  color: var(--notif-muted);
}

:deep(.notification-dropdown__menu--dark) .notification-dropdown__list {
  max-height: 300px;
  background: var(--notif-dropdown-bg);
}

:deep(.notification-dropdown__menu--dark) .notification-dropdown__list::-webkit-scrollbar {
  width: 8px;
}

:deep(.notification-dropdown__menu--dark) .notification-dropdown__list::-webkit-scrollbar-track {
  background: #17212d;
}

:deep(.notification-dropdown__menu--dark) .notification-dropdown__list::-webkit-scrollbar-thumb {
  background: #324355;
  border-radius: 999px;
  border: 2px solid #17212d;
}

:deep(.notification-dropdown__menu--dark) .notification-dropdown__list {
  scrollbar-color: #324355 #17212d;
}

:deep([data-coreui-theme='dark'] .notification-menu),
:deep(.c-dark-theme .notification-menu) {
  background: #111827;
  border-color: rgba(148, 163, 184, 0.34);
}

@media (max-width: 767.98px) {
  .notification-header {
    min-width: 260px;
  }

  .notification-item {
    padding: 0.62rem 0.76rem;
  }

  :deep(.notification-menu) {
    min-width: 0;
    width: min(320px, calc(100vw - 16px)) !important;
    max-width: calc(100vw - 16px) !important;
    right: 0 !important;
  }

  .notification-list {
    max-height: min(260px, calc(100vh - 160px));
  }
}
</style>
