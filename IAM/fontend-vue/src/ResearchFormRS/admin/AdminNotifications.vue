<template>
  <div class="admin-notifications-page">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap" style="gap: 8px;">
      <h2 class="mb-0">ระบบแจ้งเตือน (Admin)</h2>
      <div class="d-flex" style="gap: 8px;">
        <CButton color="secondary" @click="markAllRead">ทำเครื่องหมายอ่านทั้งหมด</CButton>
      </div>
    </div>

    <CRow class="mb-3">
      <CCol sm="6" lg="3" class="mb-3 mb-lg-0">
        <div class="summary-card border-primary">
          <small class="text-muted">แจ้งเตือนทั้งหมด</small>
          <div class="summary-number">{{ total }}</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3" class="mb-3 mb-lg-0">
        <div class="summary-card border-warning">
          <small class="text-muted">ยังไม่อ่าน</small>
          <div class="summary-number">{{ summaryUnread }}</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3" class="mb-3 mb-sm-0">
        <div class="summary-card border-success">
          <small class="text-muted">อ่านแล้ว</small>
          <div class="summary-number">{{ summaryRead }}</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3">
        <div class="summary-card border-info">
          <small class="text-muted">ส่งวันนี้</small>
          <div class="summary-number">{{ summaryToday }}</div>
        </div>
      </CCol>
    </CRow>

    <CCard class="mb-3">
      <CCardBody>
        <div class="d-flex justify-content-between align-items-center flex-wrap" style="gap: 8px;">
          <div class="d-flex flex-wrap" style="gap: 8px;">
            <CButton :color="activeTab === 'all' ? 'primary' : 'secondary'" variant="outline" size="sm" @click="onTabChange('all')">ทั้งหมด</CButton>
            <CButton :color="activeTab === 'unread' ? 'primary' : 'secondary'" variant="outline" size="sm" @click="onTabChange('unread')">ยังไม่อ่าน</CButton>
            <CButton :color="activeTab === 'read' ? 'primary' : 'secondary'" variant="outline" size="sm" @click="onTabChange('read')">อ่านแล้ว</CButton>
          </div>
          <div style="min-width: 280px;">
            <CSelect :value="filterType" :options="typeFilterOptions" @change="onTypeFilterChange" />
          </div>
        </div>
      </CCardBody>
    </CCard>

    <div v-if="apiNotReady" class="alert alert-warning">
      ยังไม่มีข้อมูล (API ยังไม่พร้อม)
    </div>

    <div v-if="loading" class="text-center py-5">
      <CSpinner color="primary" />
      <div class="mt-2 text-muted">กำลังโหลดการแจ้งเตือน...</div>
    </div>

    <div v-else>
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
            <CButton size="sm" color="secondary" variant="outline" class="mr-2" :disabled="notif.isRead" @click="markAsRead(notif)">
              ทำเครื่องหมายอ่าน
            </CButton>
            <CButton size="sm" color="danger" @click="deleteNotification(notif)">ลบ</CButton>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center mt-3 flex-wrap" style="gap: 8px;">
        <small class="text-muted">หน้าที่ {{ page }} / {{ totalPages }}</small>
        <div>
          <CButton size="sm" color="secondary" variant="outline" class="mr-2" :disabled="page <= 1 || loading" @click="onPageChange(page - 1)">ก่อนหน้า</CButton>
          <CButton size="sm" color="secondary" variant="outline" :disabled="page >= totalPages || loading" @click="onPageChange(page + 1)">ถัดไป</CButton>
        </div>
      </div>
    </div>

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
        <div class="send-modal-inner" style="padding: 1.25rem 1.5rem; box-sizing: border-box;">

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
            <CButton size="sm" color="secondary" variant="outline" @click="applyTemplate">ใช้ Template</CButton>
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
        <div class="d-flex justify-content-end w-100" style="padding: 0.875rem 1.5rem 1.1rem; gap: 10px; border-top: 1px solid #e4e7ea; background: #f8f9fa; box-sizing: border-box;">
          <CButton color="secondary" variant="outline" class="modal-btn" @click="closeSendModal">ยกเลิก</CButton>
          <CButton color="primary" class="modal-btn btn-save" :disabled="sendLoading" @click="sendNotification">
            {{ sendLoading ? 'กำลังส่ง...' : 'ส่งการแจ้งเตือน' }}
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
  </div>
</template>

<script>
import { instance as axios } from '@/service/api'
import Swal from 'sweetalert2'

const NOTIFICATION_TYPES = {
  status_changed: 'สถานะโครงการเปลี่ยนแปลง',
  revision_requested: 'ขอแก้ไขเอกสาร',
  approved: 'โครงการได้รับการอนุมัติ',
  rejected: 'โครงการถูกปฏิเสธ',
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
      if (this.sendForm.recipientType === 'all_committee') return this.users.filter(u => u.role === 'committee').length
      return this.users.length
    }
  },
  mounted () { this.fetchNotifications() },
  methods: {
    getSelectValue (val) { return val && val.target ? val.target.value : val },
    formatDate (dateStr) {
      if (!dateStr) return '-'
      const d = new Date(dateStr)
      if (Number.isNaN(d.getTime())) return '-'
      return d.toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    },
    getTypeLabel (type) { return NOTIFICATION_TYPES[type] || type || '-' },
    getTypeBadgeColor (type) { return TYPE_BADGE_COLOR[type] || 'secondary' },
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
        await axios.post('/api/v1/notifications/send', { recipientType: this.sendForm.recipientType, recipientIds: this.sendForm.recipientType === 'specific' ? this.sendForm.recipientIds : [], type: this.sendForm.type, title: this.sendForm.title, message: this.sendForm.message, proposalId: this.sendForm.proposalId || null })
        this.closeSendModal(); await this.fetchNotifications()
        await Swal.fire({ icon: 'success', title: 'ส่งการแจ้งเตือนสำเร็จ', timer: 1500, showConfirmButton: false })
      } catch (error) {
        await Swal.fire({ icon: 'error', title: 'ส่งการแจ้งเตือนไม่สำเร็จ', text: (error && error.response && error.response.data && error.response.data.message) || 'ยังไม่มีข้อมูล (API ยังไม่พร้อม)' })
      } finally { this.sendLoading = false }
    }
  }
}
</script>

<style scoped>
.admin-notifications-page { width: 100%; }

.summary-card {
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-left-width: 5px;
  border-radius: 8px;
  padding: 14px 16px;
}
.summary-number { font-size: 1.65rem; font-weight: 700; line-height: 1.1; }

.notification-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 12px;
}
.notification-card.unread { background: #eef6ff; border-left: 5px solid #39f; }
.notification-card.read { background: #f8f9fa; }

.message-clamp { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; }

.empty-state { border: 1px dashed #c8ced3; border-radius: 8px; padding: 20px; text-align: center; color: #768192; }

.recipient-box { border: 1px solid #d8dbe0; border-radius: 8px; padding: 10px; background: #fafbfc; }
.recipient-list { max-height: 180px; overflow-y: auto; }

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

@media (max-width: 768px) {
  .admin-email-widget__fab {
    right: 16px;
    bottom: 16px;
  }
}
</style>