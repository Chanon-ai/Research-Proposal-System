<template>
  <CDropdown
    placement="bottom-end"
    :caret="false"
    in-nav
    :show.sync="isNotificationOpen"
    class="c-header-nav-item mx-2"
    add-menu-classes="pt-0 notification-menu"
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

    <CDropdownHeader tag="div" class="notification-header bg-light">
      <strong>{{ $t('header.youHave', { count: notificationCount }) }}</strong>
    </CDropdownHeader>

    <CDropdownItem
      v-for="notif in notifications"
      :key="notif.id"
      class="notification-item d-block"
      @click="openNotification(notif)"
    >
      <div class="notification-row">
        <div class="notification-avatar-wrap mr-3">
          <div v-if="notif.avatar" class="c-avatar">
            <img :src="notif.avatar" class="c-avatar-img" :alt="notif.senderName">
          </div>
          <div v-else class="notification-type-icon" :class="`type-${notif.type}`">
            <CIcon :name="iconByType(notif.type)" size="sm"/>
          </div>
        </div>

        <div class="notification-content">
          <div class="notification-top-line">
            <small class="text-muted text-truncate pr-2">{{ notif.senderName }}</small>
            <small class="text-muted notification-time">{{ notif.timeLabel }}</small>
          </div>
          <div class="notification-title" :class="{ 'is-unread': notif.unread }">{{ notif.title }}</div>
          <div class="notification-message">{{ notif.message }}</div>
        </div>

        <span v-if="notif.unread" class="unread-dot" aria-hidden="true"></span>
      </div>
    </CDropdownItem>

    <CDropdownItem v-if="notifications.length === 0" class="text-center text-muted">
      {{ $t('header.noNotifications') }}
    </CDropdownItem>

    <CDropdownItem class="border-top text-center" @click="viewAll">
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
      this.$router.push('/user/notification')
    }
  }
}
</script>

<style scoped>
.notification-bell-link {
  padding: 0.35rem 0.45rem;
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
}

.notification-item {
  padding: 0.7rem 0.85rem;
}

.notification-row {
  display: flex;
  align-items: flex-start;
  width: 100%;
  gap: 0;
}

.notification-avatar-wrap {
  flex: 0 0 auto;
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
.notification-type-icon.type-warning { background: rgba(255, 193, 7, 0.22); color: #c69500; }
.notification-type-icon.type-primary { background: rgba(0, 123, 255, 0.16); color: #007bff; }
.notification-type-icon.type-info { background: rgba(23, 162, 184, 0.16); color: #17a2b8; }

.notification-content {
  min-width: 0;
  flex: 1;
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
}

.notification-title {
  font-size: 0.835rem;
  color: #212529;
  line-height: 1.25;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-title.is-unread {
  font-weight: 700;
}

.notification-message {
  font-size: 0.76rem;
  color: #6c757d;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

.notification-menu {
  max-width: calc(100vw - 24px);
}

@media (max-width: 767.98px) {
  .notification-header {
    min-width: 280px;
  }

  .notification-item {
    padding: 0.6rem 0.7rem;
  }
}
</style>