<template>
  <div class="admin-notifications-page">
    <section class="notif-hero mb-4">
      <div class="notif-hero__content">
        <div class="notif-hero__eyebrow">ADMIN NOTIFICATIONS</div>
        <h2 class="notif-hero__title">ระบบแจ้งเตือน</h2>
        <p class="notif-hero__subtitle mb-0">จัดการและติดตามการแจ้งเตือนทั้งระบบ</p>
      </div>
      <div class="notif-hero__action">
        <CButton color="primary" size="lg" class="notif-hero__btn" @click="markAllRead"><CIcon name="cil-chevron-right" class="mr-1" /> ทำเครื่องหมายอ่านทั้งหมด</CButton>
      </div>
    </section>

    <CRow class="mb-3">
      <CCol sm="6" lg="3" class="mb-3 mb-lg-0">
        <div class="notif-summary-card notif-tone-total">
          <div class="notif-summary-bg" aria-hidden="true"></div>
          <div class="notif-summary-content">
            <small class="notif-summary-label">แจ้งเตือนทั้งหมด</small>
            <div class="notif-summary-number">{{ total }}</div>
          </div>
        </div>
      </CCol>
      <CCol sm="6" lg="3" class="mb-3 mb-lg-0">
        <div class="notif-summary-card notif-tone-unread">
          <div class="notif-summary-bg" aria-hidden="true"></div>
          <div class="notif-summary-content">
            <small class="notif-summary-label">ยังไม่อ่าน</small>
            <div class="notif-summary-number">{{ summaryUnread }}</div>
          </div>
        </div>
      </CCol>
      <CCol sm="6" lg="3" class="mb-3 mb-sm-0">
        <div class="notif-summary-card notif-tone-read">
          <div class="notif-summary-bg" aria-hidden="true"></div>
          <div class="notif-summary-content">
            <small class="notif-summary-label">อ่านแล้ว</small>
            <div class="notif-summary-number">{{ summaryRead }}</div>
          </div>
        </div>
      </CCol>
      <CCol sm="6" lg="3">
        <div class="notif-summary-card notif-tone-today">
          <div class="notif-summary-bg" aria-hidden="true"></div>
          <div class="notif-summary-content">
            <small class="notif-summary-label">ส่งวันนี้</small>
            <div class="notif-summary-number">{{ summaryToday }}</div>
          </div>
        </div>
      </CCol>
    </CRow>

    <div v-if="apiNotReady" class="alert alert-warning">
      ยังไม่มีข้อมูล (API ยังไม่พร้อม)
    </div>

    <div v-if="loading" class="text-center py-5">
      <CSpinner color="primary" />
      <div class="mt-2 text-muted">กำลังโหลดการแจ้งเตือน...</div>
    </div>

    <CCard v-else class="reviewer-dashboard-card no-table-divider notif-list-card">
      <CCardHeader class="dashboard-card-header">
        <div class="dashboard-card-header__row">
          <div class="dashboard-card-title">
            รายการแจ้งเตือน
            <CBadge class="ml-2 notif-count-badge">{{ total }}</CBadge>
          </div>
          <div class="header-tools">
            <div class="notif-tabs">
              <CButton :color="activeTab === 'all' ? 'primary' : 'secondary'" variant="outline" size="sm" @click="onTabChange('all')"><CIcon name="cil-chevron-right" class="mr-1" /> ทั้งหมด</CButton>
              <CButton :color="activeTab === 'unread' ? 'primary' : 'secondary'" variant="outline" size="sm" @click="onTabChange('unread')"><CIcon name="cil-chevron-right" class="mr-1" /> ยังไม่อ่าน</CButton>
              <CButton :color="activeTab === 'read' ? 'primary' : 'secondary'" variant="outline" size="sm" @click="onTabChange('read')"><CIcon name="cil-chevron-right" class="mr-1" /> อ่านแล้ว</CButton>
            </div>
            <CSelect class="notif-type-select" :value="filterType" :options="typeFilterOptions" @change="onTypeFilterChange" />
          </div>
        </div>
      </CCardHeader>
      <CCardBody class="card-body-tight">
        <div v-if="notifications.length === 0" class="empty-state">ไม่พบข้อมูลการแจ้งเตือน</div>

        <div v-for="notif in notifications" :key="notif._id" class="notification-card" :class="notif.isRead ? 'read' : 'unread'">
          <div class="d-flex justify-content-between align-items-start flex-wrap" style="gap: 8px;">
            <div>
              <span class="mr-2">🔔</span>
              <CBadge :color="getTypeBadgeColor(notif.type)" class="mr-2">{{ getTypeLabel(notif.type) }}</CBadge>
              <CBadge v-if="!notif.isRead" color="info">ยังไม่อ่าน</CBadge>
            </div>
            <small class="text-muted">{{ formatDate(notif.sentAt || notif.createdAt) }}</small>
          </div>

          <div class="mt-2" :class="{ 'font-weight-bold': !notif.isRead }">{{ notif.title || '-' }}</div>
          <div class="text-muted message-clamp mt-1">{{ notif.message || '-' }}</div>

          <div class="d-flex justify-content-between align-items-end flex-wrap mt-2" style="gap: 8px;">
            <small class="text-muted">
              👤 ผู้รับ: {{ notif.recipientName || notif.recipientEmail || '-' }}
              <span v-if="notif.proposalCode"> | 📋 {{ notif.proposalCode }}</span>
            </small>
            <div>
              <CButton size="sm" color="primary" variant="outline" class="mr-2" @click="openNotificationDetail(notif)">
                <CIcon name="cil-chevron-right" class="mr-1" /> ดูรายละเอียด
              </CButton>
              <CButton size="sm" color="secondary" variant="outline" class="mr-2" :disabled="notif.isRead" @click="markAsRead(notif)">
                <CIcon name="cil-chevron-right" class="mr-1" /> ทำเครื่องหมายอ่าน
              </CButton>
              <CButton size="sm" color="danger" @click="deleteNotification(notif)"><CIcon name="cil-chevron-right" class="mr-1" /> ลบ</CButton>
            </div>
          </div>
        </div>

        <div class="notif-footer">
          <small class="text-muted">หน้าที่ {{ page }} / {{ totalPages }}</small>
          <div>
            <CButton size="sm" color="secondary" variant="outline" class="mr-2" :disabled="page <= 1 || loading" @click="onPageChange(page - 1)"><CIcon name="cil-chevron-right" class="mr-1" /> ก่อนหน้า</CButton>
            <CButton size="sm" color="secondary" variant="outline" :disabled="page >= totalPages || loading" @click="onPageChange(page + 1)"><CIcon name="cil-chevron-right" class="mr-1" /> ถัดไป</CButton>
          </div>
        </div>
      </CCardBody>
    </CCard>

    <CModal
      :show.sync="showSendModal"
      :close-on-backdrop="false"
      centered
      size="lg"
      scrollable
      title="ส่งการแจ้งเตือน"
      class="send-modal"
    >
      <template #body-wrapper>
        <div class="send-modal-inner">

          <CSelect
            label="ผู้รับ"
            :value="sendForm.recipientType"
            :options="recipientTypeOptions"
            @change="onRecipientTypeChange"
          />

          <div v-if="sendForm.recipientType === 'specific'" class="recipient-box mb-3">
            <CInput v-model="userSearchKeyword" placeholder="ค้นหาผู้รับ..." class="mb-2" />
            <div class="recipient-list">
              <div class="custom-control custom-checkbox" v-for="user in filteredUsers" :key="user._id">
                <input
                  :id="`recipient-${user._id}`"
                  type="checkbox"
                  class="custom-control-input"
                  :checked="sendForm.recipientIds.includes(user._id)"
                  @change="toggleRecipient(user._id)"
                >
                <label class="custom-control-label" :for="`recipient-${user._id}`">
                  {{ user.fullName || user.email || '-' }}
                  <small class="text-muted">({{ user.role || '-' }})</small>
                </label>
              </div>
              <div v-if="filteredUsers.length === 0" class="text-muted small">ไม่พบผู้ใช้งาน</div>
            </div>
          </div>

          <CSelect
            label="โครงการที่เกี่ยวข้อง (ไม่บังคับ)"
            :value="sendForm.proposalId"
            :options="proposalOptions"
            @change="onProposalChange"
          />

          <!-- ประเภท + ชื่อเรื่อง + ข้อความ — label แยกเพื่อใส่ * สีแดงได้ -->
          <div class="form-group">
            <label class="modal-field-label">ประเภทการแจ้งเตือน <span class="text-required">*</span></label>
            <select class="form-control" :value="sendForm.type" @change="onTypeChange">
              <option value="">เลือกประเภทการแจ้งเตือน</option>
              <option v-for="opt in typeSelectOptions.slice(1)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="modal-field-label">ชื่อเรื่อง <span class="text-required">*</span></label>
            <input class="form-control" v-model="sendForm.title" placeholder="ระบุชื่อเรื่อง" />
          </div>

          <div class="form-group">
            <label class="modal-field-label">ข้อความ <span class="text-required">*</span></label>
            <textarea class="form-control" v-model="sendForm.message" rows="6" placeholder="ระบุข้อความที่ต้องการแจ้ง" style="resize:vertical;"></textarea>
          </div>

          <div class="mb-3" v-if="hasTemplateForType(sendForm.type)">
            <CButton size="sm" color="secondary" variant="outline" @click="applyTemplate"><CIcon name="cil-chevron-right" class="mr-1" /> ใช้ Template</CButton>
          </div>

          <div class="preview-box">
            <div class="preview-box__label">Preview</div>
            <div class="preview-box__text">
              จะส่งให้: <strong>{{ previewRecipientCount }} คน</strong>
              &nbsp;·&nbsp;
              ประเภท: <strong>{{ getTypeLabel(sendForm.type) || '-' }}</strong>
            </div>
          </div>

        </div>
      </template>

      <!-- ✅ footer: padding รอบด้าน, ปุ่มสีน้ำเงิน -->
      <template #footer-wrapper>
        <div class="send-modal-footer d-flex justify-content-end w-100">
          <CButton color="secondary" variant="outline" class="modal-btn" @click="closeSendModal"><CIcon name="cil-chevron-right" class="mr-1" /> ยกเลิก</CButton>
          <CButton color="primary" class="modal-btn btn-save" :disabled="sendLoading" @click="sendNotification">
            <CIcon name="cil-chevron-right" class="mr-1" /> {{ sendLoading ? 'กำลังส่ง...' : 'ส่งการแจ้งเตือน' }}
          </CButton>
        </div>
      </template>
    </CModal>

    <button
      type="button"
      class="admin-email-widget__fab"
      :class="{ 'is-open': showSendModal }"
      aria-label="เปิดฟอร์มส่งการแจ้งเตือน"
      @click="toggleSendModal"
    >
      <CIcon :name="showSendModal ? 'cil-x' : 'cil-envelope-open'" size="lg" />
    </button>

    <CModal
      :show.sync="showDetailModal"
      centered
      size="lg"
      title="รายละเอียดการแจ้งเตือน"
    >
      <template #body-wrapper>
        <div v-if="selectedNotification" class="admin-notification-detail">
          <div class="admin-notification-detail__row">
            <div class="admin-notification-detail__label">ประเภท</div>
            <div class="admin-notification-detail__value">{{ getTypeLabel(selectedNotification.type) }}</div>
          </div>
          <div class="admin-notification-detail__row">
            <div class="admin-notification-detail__label">ส่งเมื่อ</div>
            <div class="admin-notification-detail__value">{{ formatDate(selectedNotification.sentAt || selectedNotification.createdAt) }}</div>
          </div>
          <div class="admin-notification-detail__row">
            <div class="admin-notification-detail__label">ผู้รับ</div>
            <div class="admin-notification-detail__value">{{ selectedNotification.recipientName || selectedNotification.recipientEmail || '-' }}</div>
          </div>
          <div class="admin-notification-detail__row" v-if="selectedNotification.proposalCode || selectedNotification.proposalTitle">
            <div class="admin-notification-detail__label">โครงการ</div>
            <div class="admin-notification-detail__value">{{ selectedNotification.proposalCode || '-' }}<span v-if="selectedNotification.proposalTitle"> | {{ selectedNotification.proposalTitle }}</span></div>
          </div>
          <div class="admin-notification-detail__message-title">หัวข้อ</div>
          <div class="admin-notification-detail__message-box">{{ selectedNotification.title || '-' }}</div>
          <div class="admin-notification-detail__message-title">ข้อความ</div>
          <div class="admin-notification-detail__message-box">{{ selectedNotification.message || '-' }}</div>
        </div>
      </template>
      <template #footer-wrapper>
        <div class="admin-notification-detail__footer">
          <CButton color="secondary" variant="outline" @click="showDetailModal = false"><CIcon name="cil-chevron-right" class="mr-1" /> ปิด</CButton>
          <CButton v-if="proposalIdOf(selectedNotification)" color="primary" @click="goToProposal(selectedNotification)"><CIcon name="cil-chevron-right" class="mr-1" /> เปิดโครงการที่เกี่ยวข้อง</CButton>
        </div>
      </template>
    </CModal>
  </div>
</template>

<script>
import { instance as axios } from '@/service/api'
import Swal from 'sweetalert2'
import { PROPOSAL_STATUS_LABELS_TH_BADGE as STATUS_LABELS } from '@/ResearchFormRS/constants/proposalWorkflow'
import { loadResearchFormRuntimeConfigs } from '@/ResearchFormRS/utils/researchConfigRuntime'

const NOTIFICATION_TYPES = {
  status_changed: 'สถานะโครงการเปลี่ยนแปลง',
  revision_requested: 'ขอแก้ไขเอกสาร',
  approved: 'โครงการได้รับการอนุมัติ',
  rejected: 'โครงการถูกปฏิเสธ',
  committee_valuated: 'กรรมการได้ให้ความเห็นแล้ว',
  meeting_completed: 'ส่วนบริหารกำลังจัดเตรียมผล',
  collaboration_confirmation: 'ยืนยันความร่วมมือ',
  meeting_scheduled: 'กำหนดการประชุม',
  document_required: 'ขอเอกสารเพิ่มเติม',
  committee_assigned: 'ได้รับมอบหมายพิจารณาโครงการ',
  announcement: 'ประกาศทั่วไป'
}

const TYPE_BADGE_COLOR = {
  status_changed: 'info',
  revision_requested: 'warning',
  approved: 'success',
  rejected: 'danger',
  committee_valuated: 'danger',
  meeting_completed: 'danger',
  collaboration_confirmation: 'info',
  meeting_scheduled: 'primary',
  document_required: 'warning',
  committee_assigned: 'info',
  announcement: 'secondary'
}

const RECIPIENT_TYPES = {
  specific: 'เลือกผู้รับเฉพาะเจาะจง',
  all_researchers: 'นักวิจัยทั้งหมด',
  all_committee: 'คณะกรรมการทั้งหมด',
  all_users: 'ผู้ใช้ทั้งระบบ'
}

const EMAIL_TEMPLATES = {
  revision_requested: {
    title: 'แจ้งขอแก้ไขเอกสารโครงการวิจัย',
    message: 'เรียน นักวิจัย\n\nโครงการของท่านได้รับการพิจารณาและมีข้อเสนอแนะให้แก้ไข กรุณาเข้าสู่ระบบเพื่อดูรายละเอียดและดำเนินการแก้ไขภายในกำหนด\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย'
  },
  approved: {
    title: 'แจ้งผลการอนุมัติโครงการวิจัย',
    message: 'เรียน นักวิจัย\n\nยินดีด้วย! โครงการวิจัยของท่านได้รับการอนุมัติแล้ว กรุณาเข้าสู่ระบบเพื่อดูรายละเอียดเพิ่มเติม\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย'
  },
  rejected: {
    title: 'แจ้งผลการพิจารณาโครงการวิจัย',
    message: 'เรียน นักวิจัย\n\nโครงการวิจัยของท่านไม่ผ่านการพิจารณาในรอบนี้ กรุณาเข้าสู่ระบบเพื่อดูรายละเอียดเหตุผล\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย'
  },
  meeting_scheduled: {
    title: 'แจ้งกำหนดการประชุมพิจารณาโครงการวิจัย',
    message: 'เรียน ผู้เกี่ยวข้อง\n\nขอแจ้งกำหนดการประชุมพิจารณาโครงการวิจัย กรุณาตรวจสอบรายละเอียดในระบบและเตรียมเอกสารให้พร้อม\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย'
  }
}

export default {
  name: 'AdminNotifications',
  data () {
    return {
      notifications: [],
      users: [],
      proposals: [],
      total: 0,
      page: 1,
      totalPages: 1,
      limit: 15,
      loading: false,
      apiNotReady: false,
      activeTab: 'all',
      filterType: '',
      showSendModal: false,
      showDetailModal: false,
      selectedNotification: null,
      sendLoading: false,
      sendForm: {
        recipientType: 'all_researchers',
        recipientIds: [],
        type: '',
        title: '',
        message: '',
        proposalId: ''
      },
      userSearchKeyword: ''
    }
  },
  computed: {
    summaryToday () {
      const today = new Date()
      return this.notifications.filter(notif => {
        const d = new Date(notif.sentAt || notif.createdAt)
        if (Number.isNaN(d.getTime())) return false
        return d.toDateString() === today.toDateString()
      }).length
    },
    summaryUnread () { return this.notifications.filter(n => !n.isRead).length },
    summaryRead () { return this.notifications.filter(n => n.isRead).length },
    filteredUsers () {
      const kw = this.userSearchKeyword.trim().toLowerCase()
      if (!kw) return this.users
      return this.users.filter(u => `${u.fullName || ''} ${u.email || ''}`.toLowerCase().includes(kw))
    },
    typeFilterOptions () {
      return [{ value: '', label: 'ทั้งหมด' }, ...Object.keys(NOTIFICATION_TYPES).map(t => ({ value: t, label: NOTIFICATION_TYPES[t] }))]
    },
    typeSelectOptions () {
      return [{ value: '', label: 'เลือกประเภทการแจ้งเตือน' }, ...Object.keys(NOTIFICATION_TYPES).map(t => ({ value: t, label: NOTIFICATION_TYPES[t] }))]
    },
    recipientTypeOptions () {
      return Object.keys(RECIPIENT_TYPES).map(t => ({ value: t, label: RECIPIENT_TYPES[t] }))
    },
    proposalOptions () {
      return [{ value: '', label: 'ไม่ระบุ' }, ...this.proposals.map(p => ({ value: p._id, label: `${p.proposalCode || '-'} - ${p.projectTitleTh || '-'}` }))]
    },
    previewRecipientCount () {
      if (this.sendForm.recipientType === 'specific') return this.sendForm.recipientIds.length
      if (this.sendForm.recipientType === 'all_researchers') return this.users.filter(u => u.role === 'researcher').length
      if (this.sendForm.recipientType === 'all_committee') return this.users.filter(u => ['committee', 'chairman'].includes(u.role)).length
      return this.users.length
    }
  },
  async mounted () {
    await loadResearchFormRuntimeConfigs()
    this.$forceUpdate()
    this.fetchNotifications()
  },
  methods: {
    getSelectValue (val) { return val && val.target ? val.target.value : val },
    humanizeKey (value) {
      const raw = String(value || '').trim()
      if (!raw) return '-'
      const last = raw.includes('.') ? raw.split('.').pop() : raw
      const key = String(last || '').trim().toLowerCase()
      return STATUS_LABELS[key] || String(last || '').replace(/_/g, ' ')
    },
    formatDate (dateStr) {
      if (!dateStr) return '-'
      const d = new Date(dateStr)
      if (Number.isNaN(d.getTime())) return '-'
      return d.toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    },
    getTypeLabel (type) {
      const raw = String(type || '').trim()
      const key = raw.toLowerCase()
      const tailKey = key.includes('.') ? key.split('.').pop() : key
      return NOTIFICATION_TYPES[raw] || NOTIFICATION_TYPES[key] || STATUS_LABELS[key] || STATUS_LABELS[tailKey] || this.humanizeKey(raw)
    },
    getTypeBadgeColor (type) {
      const raw = String(type || '').trim()
      const key = raw.toLowerCase()
      const tailKey = key.includes('.') ? key.split('.').pop() : key
      if (TYPE_BADGE_COLOR[raw]) return TYPE_BADGE_COLOR[raw]
      if (TYPE_BADGE_COLOR[key]) return TYPE_BADGE_COLOR[key]
      if (STATUS_LABELS[key]) return 'info'
      if (STATUS_LABELS[tailKey]) return 'info'
      return 'secondary'
    },
    proposalIdOf (notif) {
      if (!notif) return ''
      if (notif.proposal && typeof notif.proposal === 'object' && notif.proposal._id) return String(notif.proposal._id)
      return notif.proposalId ? String(notif.proposalId) : ''
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
    getProposalRoute (notif) {
      const proposalId = this.proposalIdOf(notif)
      if (!proposalId) return null
      const role = String(this.currentRole() || '').trim().toLowerCase()
      if (role === 'chairman') {
        return { name: 'chairmanProposalDetail', params: { id: proposalId } }
      }
      return { name: 'AdminProposalDetail', params: { id: proposalId } }
    },
    async openNotificationDetail (notif) {
      if (!notif) return
      await this.markAsRead(notif)
      this.selectedNotification = notif
      this.showDetailModal = true
    },
    goToProposal (notif) {
      const route = this.getProposalRoute(notif)
      if (!route) return
      this.showDetailModal = false
      this.$router.push(route)
    },
    hasTemplateForType (type) { return Boolean(EMAIL_TEMPLATES[type]) },
    async fetchNotifications () {
      this.loading = true
      try {
        const params = { page: this.page, limit: this.limit }
        if (this.filterType) params.type = this.filterType
        if (this.activeTab === 'unread') params.isRead = false
        if (this.activeTab === 'read') params.isRead = true
        const response = await axios.get('/api/v1/notifications', { params })
        const payload = (response && response.data && response.data.data) || {}
        const list = Array.isArray(payload.notifications) ? payload.notifications : (Array.isArray(payload.data) ? payload.data : [])
        this.notifications = list
        this.total = Number(payload.total) || list.length
        this.page = Number(payload.page) || this.page
        this.totalPages = Number(payload.totalPages) || Math.max(1, Math.ceil(this.total / this.limit))
        this.apiNotReady = false
      } catch (error) {
        console.error('[AdminNotifications] Error fetching notifications:', error)
        this.notifications = []; this.total = 0; this.totalPages = 1; this.apiNotReady = true
      } finally { this.loading = false }
    },
    async fetchUsers () {
      try {
        const response = await axios.get('/api/v1/users', { params: { limit: 100 } })
        const payload = (response && response.data && response.data.data) || {}
        this.users = Array.isArray(payload.users) ? payload.users : (Array.isArray(payload.data) ? payload.data : [])
      } catch (error) { console.error('[AdminNotifications] Error fetching users:', error); this.users = [] }
    },
    async fetchProposals () {
      try {
        const response = await axios.get('/api/v1/proposals', { params: { limit: 100 } })
        const payload = (response && response.data && response.data.data) || {}
        this.proposals = Array.isArray(payload.proposals) ? payload.proposals : (Array.isArray(payload.data) ? payload.data : [])
      } catch (error) { console.error('[AdminNotifications] Error fetching proposals:', error); this.proposals = [] }
    },
    onTabChange (tab) { this.activeTab = tab; this.page = 1; this.fetchNotifications() },
    onTypeFilterChange (val) { this.filterType = this.getSelectValue(val); this.page = 1; this.fetchNotifications() },
    onPageChange (nextPage) { if (nextPage < 1 || nextPage > this.totalPages) return; this.page = nextPage; this.fetchNotifications() },
    async markAsRead (notif) {
      if (notif.isRead) return
      try {
        await axios.patch(`/api/v1/notifications/${notif._id}/read`, {})
        notif.isRead = true; notif.readAt = new Date().toISOString()
      } catch (error) { await Swal.fire({ icon: 'error', title: 'ทำรายการไม่สำเร็จ', text: 'ยังไม่มีข้อมูล (API ยังไม่พร้อม)' }) }
    },
    async markAllRead () {
      const result = await Swal.fire({ icon: 'question', title: 'ยืนยันทำเครื่องหมายอ่านทั้งหมด?', showCancelButton: true, confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก' })
      if (!result.isConfirmed) return
      try { await axios.patch('/api/v1/notifications/mark-all-read', {}); await this.fetchNotifications(); await Swal.fire({ icon: 'success', title: 'อัปเดตสถานะสำเร็จ', timer: 1400, showConfirmButton: false }) } catch (error) { await Swal.fire({ icon: 'error', title: 'ทำรายการไม่สำเร็จ', text: 'ยังไม่มีข้อมูล (API ยังไม่พร้อม)' }) }
    },
    async deleteNotification (notif) {
      const result = await Swal.fire({ icon: 'warning', title: `ยืนยันลบการแจ้งเตือน: ${notif.title || ''}?`, showCancelButton: true, confirmButtonText: 'ยืนยันการลบ', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#e55353' })
      if (!result.isConfirmed) return
      try { await axios.delete(`/api/v1/notifications/${notif._id}`); await this.fetchNotifications(); await Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1200, showConfirmButton: false }) } catch (error) { await Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ', text: 'ยังไม่มีข้อมูล (API ยังไม่พร้อม)' }) }
    },
    async openSendModal () {
      this.sendForm = { recipientType: 'all_researchers', recipientIds: [], type: '', title: '', message: '', proposalId: '' }
      this.userSearchKeyword = ''
      await Promise.all([this.fetchUsers(), this.fetchProposals()])
      this.showSendModal = true
    },
    closeSendModal () { this.showSendModal = false; this.sendLoading = false },
    async toggleSendModal () {
      if (this.showSendModal) {
        this.closeSendModal()
        return
      }
      await this.openSendModal()
    },
    onRecipientTypeChange (val) { this.sendForm.recipientType = this.getSelectValue(val); if (this.sendForm.recipientType !== 'specific') this.sendForm.recipientIds = [] },
    onProposalChange (val) { this.sendForm.proposalId = this.getSelectValue(val) },
    onTypeChange (val) { this.sendForm.type = this.getSelectValue(val); if (this.hasTemplateForType(this.sendForm.type)) this.applyTemplate() },
    applyTemplate () { const t = EMAIL_TEMPLATES[this.sendForm.type]; if (!t) return; this.sendForm.title = t.title; this.sendForm.message = t.message },
    toggleRecipient (userId) { const i = this.sendForm.recipientIds.indexOf(userId); if (i >= 0) this.sendForm.recipientIds.splice(i, 1); else this.sendForm.recipientIds.push(userId) },
    async sendNotification () {
      if (!this.sendForm.type || !this.sendForm.title || !this.sendForm.message) { await Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาเลือกประเภท ระบุชื่อเรื่อง และข้อความ' }); return }
      if (this.sendForm.recipientType === 'specific' && this.sendForm.recipientIds.length === 0) { await Swal.fire({ icon: 'warning', title: 'ยังไม่เลือกผู้รับ', text: 'กรุณาเลือกผู้รับอย่างน้อย 1 คน' }); return }
      this.sendLoading = true
      try {
        const response = await axios.post('/api/v1/notifications/send', { recipientType: this.sendForm.recipientType, recipientIds: this.sendForm.recipientType === 'specific' ? this.sendForm.recipientIds : [], type: this.sendForm.type, title: this.sendForm.title, message: this.sendForm.message, proposalId: this.sendForm.proposalId || null })
        const payload = (response && response.data) || {}
        const summary = payload.summary || {}
        const diagnostics = payload.diagnostics || {}
        const legacy = payload.data || {}

        const inAppCount = Number(summary.inAppCount !== undefined ? summary.inAppCount : (legacy.inAppCount || 0))
        const emailSentCount = Number(summary.emailSentCount !== undefined ? summary.emailSentCount : (legacy.emailSentCount || 0))
        const emailFailedCount = Number(summary.emailFailedCount !== undefined ? summary.emailFailedCount : (legacy.emailFailedCount || 0))
        const emailSkippedCount = Number(summary.emailSkippedCount !== undefined ? summary.emailSkippedCount : (legacy.emailSkippedCount || 0))
        const skippedReason = diagnostics.skippedReason || legacy.skippedReason || ''
        const failedRecipients = Array.isArray(diagnostics.failedRecipients) ? diagnostics.failedRecipients : (Array.isArray(legacy.failedRecipients) ? legacy.failedRecipients : [])
        const skippedRecipients = Array.isArray(diagnostics.skippedRecipients) ? diagnostics.skippedRecipients : (Array.isArray(legacy.skippedRecipients) ? legacy.skippedRecipients : [])
        const reasons = Array.isArray(diagnostics.reasons) ? diagnostics.reasons : []

        this.closeSendModal(); await this.fetchNotifications()

        if (emailFailedCount > 0 || emailSkippedCount > 0 || skippedReason) {
          const failedPreview = failedRecipients
            .slice(0, 5)
            .map(item => (item && item.email) ? item.email : '-')
            .join(', ')
          const skippedPreview = skippedRecipients
            .slice(0, 5)
            .map(item => {
              const email = (item && item.email) ? item.email : '-'
              const reason = (item && (item.reason || item.reasonCode)) ? (item.reason || item.reasonCode) : 'ไม่ทราบสาเหตุ'
              return `${email} (${reason})`
            })
            .join(', ')
          const reasonLine = skippedReason
            ? `เหตุผลหลักที่ข้ามส่งอีเมล: ${skippedReason}`
            : (reasons.length > 0
              ? `เหตุผลที่ข้าม/ล้มเหลว: ${reasons.slice(0, 3).map(r => `${r.reasonCode || '-'}(${Number(r.count || 0)})`).join(', ')}`
              : '')
          const failedLine = emailFailedCount > 0
            ? `อีเมลล้มเหลว ${emailFailedCount} ราย${failedPreview ? ` (${failedPreview})` : ''}`
            : ''
          const skippedLine = emailSkippedCount > 0
            ? `อีเมลถูกข้าม ${emailSkippedCount} ราย${skippedPreview ? ` (${skippedPreview})` : ''}`
            : ''
          await Swal.fire({
            icon: 'warning',
            title: 'ส่งแจ้งเตือนสำเร็จบางส่วน',
            text: [
              `ส่งแจ้งเตือนในระบบสำเร็จ ${inAppCount} ราย`,
              `ส่งอีเมลสำเร็จ ${emailSentCount} ราย`,
              failedLine,
              skippedLine,
              reasonLine
            ].filter(Boolean).join(' | ')
          })
        } else {
          await Swal.fire({
            icon: 'success',
            title: 'ส่งการแจ้งเตือนสำเร็จ',
            text: `ส่งแจ้งเตือนในระบบสำเร็จ ${inAppCount} ราย | ส่งอีเมลสำเร็จ ${emailSentCount} ราย`,
            timer: 1700,
            showConfirmButton: false
          })
        }
      } catch (error) {
        await Swal.fire({ icon: 'error', title: 'ส่งการแจ้งเตือนไม่สำเร็จ', text: (error && error.response && error.response.data && error.response.data.message) || 'ยังไม่มีข้อมูล (API ยังไม่พร้อม)' })
      } finally { this.sendLoading = false }
    }
  }
}
</script>

<style scoped>
.admin-notifications-page { width: 100%; }

.card-body-tight {
  padding: 1rem;
  background: #f7f1ea;
}

.reviewer-dashboard-card {
  border-radius: 12px;
  overflow: hidden;
}

.dashboard-card-header {
  background: linear-gradient(90deg, rgba(140, 21, 21, 0.1), rgba(254, 194, 96, 0.22));
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 0 1.25rem;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.dashboard-card-header__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  min-height: 64px;
}

.dashboard-card-title {
  color: #6b0f0f;
  font-weight: 800;
  font-size: 1.15rem;
  line-height: 1.2;
}

.header-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.header-tools /deep/ .form-group,
.header-tools >>> .form-group,
.header-tools::v-deep .form-group {
  margin: 0 !important;
}

.notif-type-select {
  min-width: 260px;
}

.notif-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Make outline-primary match MFU theme */
.admin-notifications-page /deep/ .btn-outline-primary,
.admin-notifications-page >>> .btn-outline-primary,
.admin-notifications-page::v-deep .btn-outline-primary {
  color: #8c1515;
  border-color: #8c1515;
}

.admin-notifications-page /deep/ .btn-outline-primary:hover,
.admin-notifications-page >>> .btn-outline-primary:hover,
.admin-notifications-page::v-deep .btn-outline-primary:hover {
  color: #ffffff;
  background: #8c1515;
  border-color: #8c1515;
}

.admin-notifications-page /deep/ .btn-primary,
.admin-notifications-page >>> .btn-primary,
.admin-notifications-page::v-deep .btn-primary {
  background: #8c1515;
  border-color: #8c1515;
}

/* ── Hero ─────────────────────────────────────────────────────────────── */
.notif-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 28px;
  border-radius: 22px;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.28), transparent 30%),
    linear-gradient(135deg, #8b1212 0%, #c59b3a 115%);
  color: #ffffff;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.16);
}

.notif-hero__content { max-width: 720px; }

.notif-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  margin-bottom: 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.notif-hero__title {
  margin-bottom: 10px;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.3;
}

.notif-hero__subtitle {
  max-width: 620px;
  color: rgba(255, 255, 255, 0.84);
  font-size: 0.98rem;
  line-height: 1.7;
}

.notif-hero__btn {
  min-width: 240px;
  border-radius: 14px;
  font-weight: 800;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.18);
  background: #ffffff !important;
  border-color: #8c1515 !important;
  color: #8c1515 !important;
}

.notif-hero__btn:hover {
  background: #fff7f7 !important;
  border-color: #6b0f0f !important;
  color: #6b0f0f !important;
}

/* Summary cards (match AdminDashboard look) */
.notif-summary-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  padding: 16px 18px;
  min-height: 86px;
  cursor: default;
  transform: translateY(0);
  transition: box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
  isolation: isolate;
}

.notif-summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.18);
}

.notif-summary-bg {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  overflow: hidden;
  z-index: 1;
  background: linear-gradient(135deg, var(--summary-start, #8c1515), var(--summary-end, #6b0f0f));
}

.notif-summary-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image: var(--summary-graphic);
  background-repeat: no-repeat;
  background-size: 122px 122px;
  background-position: calc(100% + 10px) -12px;
  opacity: 0.22;
  pointer-events: none;
}

.notif-summary-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.10) 0%, rgba(255, 255, 255, 0) 60%);
  pointer-events: none;
}

.notif-summary-content {
  position: relative;
  z-index: 2;
}

.notif-summary-label {
  color: rgba(255, 255, 255, 0.92);
  font-weight: 600;
  font-size: 0.86rem;
}

.notif-summary-number {
  font-size: 1.9rem;
  font-weight: 900;
  line-height: 1.1;
  color: #ffffff;
  margin-top: 6px;
}

.notif-tone-total {
  --summary-start: #8c1515;
  --summary-end: #6b0f0f;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Cpath d='M24 70h56l20 18V32L80 50H24z' fill='white' fill-opacity='0.88'/%3E%3Ccircle cx='36' cy='86' r='6' fill='white' fill-opacity='0.7'/%3E%3Ccircle cx='56' cy='86' r='6' fill='white' fill-opacity='0.58'/%3E%3C/svg%3E");
}

.notif-tone-unread {
  --summary-start: #f59e0b;
  --summary-end: #d97706;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M60 40v24' stroke='%23000000' stroke-width='7' stroke-linecap='round' stroke-opacity='0.22'/%3E%3Ccircle cx='60' cy='78' r='5' fill='%23000000' fill-opacity='0.22'/%3E%3C/svg%3E");
}

.notif-tone-read {
  --summary-start: #16a34a;
  --summary-end: #15803d;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M46 61l9 9 20-20' stroke='%23000000' stroke-width='8' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.24' fill='none'/%3E%3Ccircle cx='60' cy='60' r='44' stroke='white' stroke-opacity='0.42' stroke-width='5' fill='none'/%3E%3C/svg%3E");
}

.notif-tone-today {
  --summary-start: #0ea5e9;
  --summary-end: #0369a1;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect x='20' y='24' width='80' height='72' rx='12' fill='white' fill-opacity='0.9'/%3E%3Crect x='20' y='36' width='80' height='14' fill='%23000000' fill-opacity='0.13'/%3E%3Ccircle cx='38' cy='64' r='7' fill='%23000000' fill-opacity='0.18'/%3E%3Ccircle cx='60' cy='64' r='7' fill='%23000000' fill-opacity='0.18'/%3E%3Ccircle cx='82' cy='64' r='7' fill='%23000000' fill-opacity='0.18'/%3E%3C/svg%3E");
}

.notification-card {
  border: 1px solid rgba(140, 21, 21, 0.14);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
  background: #ffffff;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
  transition: transform 0.12s ease, background-color 0.18s ease, border-color 0.18s ease;
}
.notification-card:hover { transform: translateY(-1px); background: #fffaf2; border-color: rgba(181, 133, 34, 0.45); }
.notification-card.unread { border-left: 5px solid #8c1515; }
.notification-card.read { background: #ffffff; opacity: 0.92; }

.message-clamp { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; }
.message-clamp { -webkit-line-clamp: 2; }

.empty-state {
  border: 1px dashed rgba(140, 21, 21, 0.22);
  background: rgba(254, 194, 96, 0.14);
  color: #6b0f0f;
  padding: 16px 14px;
  border-radius: 12px;
  text-align: center;
  font-weight: 600;
}

.notif-count-badge {
  background: rgba(140, 21, 21, 0.1);
  color: #6b0f0f;
  border: 1px solid rgba(140, 21, 21, 0.18);
  border-radius: 9999px;
  font-weight: 800;
  font-size: 12px;
}

.notif-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(140, 21, 21, 0.12);
}

.empty-state { border: 1px dashed #c8ced3; border-radius: 8px; padding: 20px; text-align: center; color: #768192; }

.send-modal-inner {
  padding: 1.25rem 1.5rem;
  box-sizing: border-box;
  max-height: min(68vh, calc(100vh - 260px));
  overflow-y: auto;
  overscroll-behavior: contain;
}

.send-modal-footer {
  position: sticky;
  bottom: 0;
  padding: 0.875rem 1.5rem 1.1rem;
  gap: 10px;
  border-top: 1px solid #e4e7ea;
  background: #f8f9fa;
  box-sizing: border-box;
  z-index: 2;
}

.recipient-box {
  border: 1px solid #d8dbe0;
  border-radius: 8px;
  padding: 10px;
  background: #fafbfc;
}

.recipient-list {
  max-height: min(34vh, 260px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 2px;
}

/* ─── modal field labels ─── */
.modal-field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 6px;
}

/* ─── red asterisk ─── */
.text-required { color: #e55353; margin-left: 2px; }

/* ─── preview box ─── */
.preview-box {
  border: 1px solid #d8dbe0;
  border-radius: 8px;
  padding: 10px 14px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}
.preview-box__label {
  font-size: 11px;
  font-weight: 600;
  color: #768192;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}
.preview-box__text { font-size: 13px; color: #4a5568; }

.send-modal ::v-deep .modal-dialog {
  margin: 1rem auto;
  max-height: calc(100vh - 2rem);
}

.send-modal ::v-deep .modal-content {
  max-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
}

.send-modal ::v-deep .modal-body {
  padding: 0;
  overflow: hidden;
}

[data-coreui-theme='dark'] .admin-notifications-page,
body.c-dark-theme .admin-notifications-page {
  color: #e7eeff;
}

[data-coreui-theme='dark'] .admin-notifications-page h2,
body.c-dark-theme .admin-notifications-page h2 {
  color: #f4f8ff;
}

[data-coreui-theme='dark'] .notif-summary-card,
body.c-dark-theme .notif-summary-card {
  background: #162235;
  border-color: #2f3e55;
}

[data-coreui-theme='dark'] .notif-summary-label,
body.c-dark-theme .notif-summary-label {
  color: #b3c2dd !important;
}

[data-coreui-theme='dark'] .notif-summary-number,
body.c-dark-theme .notif-summary-number {
  color: #eef4ff;
}

[data-coreui-theme='dark'] .admin-notifications-page ::v-deep .card,
body.c-dark-theme .admin-notifications-page ::v-deep .card {
  background: #162235;
  border-color: #2f3e55;
  box-shadow: 0 14px 32px rgba(2, 6, 23, 0.38);
}

[data-coreui-theme='dark'] .admin-notifications-page ::v-deep .card-body,
body.c-dark-theme .admin-notifications-page ::v-deep .card-body {
  color: #e7eeff;
}

[data-coreui-theme='dark'] .admin-notifications-page ::v-deep .form-control,
body.c-dark-theme .admin-notifications-page ::v-deep .form-control,
[data-coreui-theme='dark'] .admin-notifications-page ::v-deep .custom-select,
body.c-dark-theme .admin-notifications-page ::v-deep .custom-select,
[data-coreui-theme='dark'] .admin-notifications-page ::v-deep select,
body.c-dark-theme .admin-notifications-page ::v-deep select {
  background: #121c2a;
  border-color: #3a4b67;
  color: #e7eeff;
}

[data-coreui-theme='dark'] .notification-card,
body.c-dark-theme .notification-card {
  border-color: #2f3e55;
  background: #162235;
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.3);
}

[data-coreui-theme='dark'] .notification-card.unread,
body.c-dark-theme .notification-card.unread {
  background: #1f2f45;
  border-left-color: #4f8cff;
}

[data-coreui-theme='dark'] .notification-card.read,
body.c-dark-theme .notification-card.read {
  background: #162235;
}

[data-coreui-theme='dark'] .notification-card .text-muted,
body.c-dark-theme .notification-card .text-muted {
  color: #b3c2dd !important;
}

[data-coreui-theme='dark'] .message-clamp,
body.c-dark-theme .message-clamp {
  color: #d4deee !important;
}

[data-coreui-theme='dark'] .empty-state,
body.c-dark-theme .empty-state {
  border-color: #3a4b67;
  background: #162235;
  color: #b8c7dd;
}

[data-coreui-theme='dark'] .send-modal-inner,
body.c-dark-theme .send-modal-inner {
  background: #1a2739;
}

[data-coreui-theme='dark'] .recipient-box,
body.c-dark-theme .recipient-box {
  border-color: #3a4b67;
  background: #121c2a;
}

[data-coreui-theme='dark'] .send-modal-footer,
body.c-dark-theme .send-modal-footer {
  border-top-color: #2f3e55;
  background: #182233;
}

[data-coreui-theme='dark'] .preview-box,
body.c-dark-theme .preview-box {
  border-color: #3a4b67;
  background: #121c2a;
}

[data-coreui-theme='dark'] .preview-box__label,
body.c-dark-theme .preview-box__label {
  color: #b3c2dd;
}

[data-coreui-theme='dark'] .preview-box__text,
body.c-dark-theme .preview-box__text {
  color: #e7eeff;
}

.admin-email-widget__fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 56px;
  height: 56px;
  border: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2f6de1 0%, #1748a3 100%);
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(20, 46, 101, 0.35);
  z-index: 1100;
  cursor: pointer;
}

.admin-email-widget__fab.is-open {
  background: linear-gradient(135deg, #4a5f84 0%, #2b3d5e 100%);
}

.admin-notification-detail {
  display: grid;
  gap: 14px;
}

.admin-notification-detail__row {
  display: grid;
  gap: 4px;
}

.admin-notification-detail__label,
.admin-notification-detail__message-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #8b1212;
}

.admin-notification-detail__value,
.admin-notification-detail__message-box {
  padding: 12px 14px;
  border-radius: 14px;
  background: #fff9ef;
  border: 1px solid rgba(181, 133, 34, 0.18);
  color: #3f2d17;
  white-space: pre-wrap;
  word-break: break-word;
}

.admin-notification-detail__footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 1rem 1rem;
}

[data-coreui-theme='dark'] .admin-notification-detail__value,
body.c-dark-theme .admin-notification-detail__value,
[data-coreui-theme='dark'] .admin-notification-detail__message-box,
body.c-dark-theme .admin-notification-detail__message-box {
  background: rgba(23, 30, 45, 0.9);
  border-color: rgba(255, 255, 255, 0.12);
  color: #e5edf5;
}

[data-coreui-theme='dark'] .admin-notification-detail__label,
body.c-dark-theme .admin-notification-detail__label,
[data-coreui-theme='dark'] .admin-notification-detail__message-title,
body.c-dark-theme .admin-notification-detail__message-title {
  color: #f5d28c;
}

@media (max-width: 768px) {
  .send-modal-inner {
    padding: 1rem;
    max-height: calc(100vh - 230px);
  }

  .send-modal-footer {
    padding: 0.75rem 1rem 0.9rem;
  }

  .recipient-list {
    max-height: min(32vh, 220px);
  }

  .admin-email-widget__fab {
    right: 16px;
    bottom: 16px;
  }
}
</style>
