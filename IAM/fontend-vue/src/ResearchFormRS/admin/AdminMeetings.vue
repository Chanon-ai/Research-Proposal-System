<template>
  <div class="admin-meetings-page">
    <section class="meetings-hero">
      <div class="meetings-hero__content">
        <div class="meetings-hero__eyebrow">Meeting Management</div>
        <h2 class="meetings-hero__title">จัดการการประชุมให้เป็นระเบียบ ดูง่าย และพร้อมติดตามผล</h2>
        <p class="meetings-hero__subtitle mb-0">
          รวมกำหนดการประชุม สถานะ และบันทึกผลไว้ในหน้าเดียว เพื่อให้ทีมแอดมินทำงานต่อเนื่องได้เร็วขึ้น
        </p>
      </div>
      <div class="meetings-hero__action">
        <CButton color="primary" size="lg" class="hero-action-btn" @click="openCreateModal">+ สร้างการประชุมใหม่</CButton>
      </div>
    </section>

    <CRow class="summary-row">
      <CCol sm="6" lg="4" class="mb-3">
        <div class="summary-card summary-card--info">
          <div class="summary-label">กำหนดการแล้ว</div>
          <div class="summary-number">{{ getSummaryCount('scheduled') }}</div>
          <div class="summary-caption">รายการที่กำลังรอวันประชุมหรือยังไม่ปิดผล</div>
        </div>
      </CCol>
      <CCol sm="6" lg="4" class="mb-3">
        <div class="summary-card summary-card--success">
          <div class="summary-label">เสร็จสิ้น</div>
          <div class="summary-number">{{ getSummaryCount('completed') }}</div>
          <div class="summary-caption">ประชุมที่บันทึกผลเรียบร้อยแล้ว</div>
        </div>
      </CCol>
      <CCol sm="6" lg="4" class="mb-3">
        <div class="summary-card summary-card--danger">
          <div class="summary-label">ยกเลิก</div>
          <div class="summary-number">{{ getSummaryCount('cancelled') }}</div>
          <div class="summary-caption">ใช้ติดตามรายการที่ต้องนัดหมายใหม่</div>
        </div>
      </CCol>
    </CRow>

    <CCard class="filter-card mb-4">
      <CCardBody>
        <div class="filter-card__header">
          <div>
            <div class="filter-card__title">ตัวกรองการประชุม</div>
            <div class="filter-card__subtitle">เลือกสถานะที่ต้องการเพื่อโฟกัสเฉพาะรายการสำคัญ</div>
          </div>
        </div>
        <CRow class="align-items-end">
          <CCol md="4" class="mb-2 mb-md-0">
            <CSelect
              label="สถานะ"
              :value="filterStatus"
              :options="statusFilterOptions"
              @change="onFilterStatusChange"
            />
          </CCol>
          <CCol md="3" lg="2">
            <CButton color="secondary" variant="outline" block class="filter-reset-btn" @click="onReset">ล้างตัวกรอง</CButton>
          </CCol>
        </CRow>

        <div class="filter-card__bottom-actions">
          <small v-if="!selectedMeetingForActions" class="text-muted mr-3">เลือกการประชุมด้านล่างเพื่อใช้งานปุ่มแก้ไข/ลบ</small>
          <CButton
            size="sm"
            color="warning"
            class="mr-2"
            :disabled="!selectedMeetingForActions"
            @click="selectedMeetingForActions && openEditModal(selectedMeetingForActions)"
          >
            แก้ไข
          </CButton>
          <CButton
            size="sm"
            color="danger"
            :disabled="!selectedMeetingForActions"
            @click="selectedMeetingForActions && deleteMeeting(selectedMeetingForActions)"
          >
            ลบ
          </CButton>
        </div>
      </CCardBody>
    </CCard>

    <div v-if="loading" class="text-center py-5">
      <CSpinner color="primary" />
      <div class="mt-2 text-muted">กำลังโหลดรายการประชุม...</div>
    </div>

    <div v-else>
      <div v-if="meetings.length === 0" class="empty-state">
        <div class="empty-state__icon">🗓️</div>
        <div class="empty-state__title">ยังไม่มีรายการประชุม</div>
        <div class="empty-state__text">เริ่มต้นด้วยการสร้างการประชุมใหม่เพื่อจัดการรอบประชุมและบันทึกผลภายหลัง</div>
      </div>

      <div v-else class="meeting-grid">
        <div
          v-for="meeting in meetings"
          :key="meeting._id"
          class="meeting-card"
          :class="[getMeetingCardClass(meeting), isSelectedMeeting(meeting) ? 'meeting-card--selected' : '']"
          @click="selectMeetingForActions(meeting)"
          @keydown.enter.prevent="selectMeetingForActions(meeting)"
          @keydown.space.prevent="selectMeetingForActions(meeting)"
          role="button"
          tabindex="0"
        >
          <div class="meeting-card__top">
            <CBadge class="meeting-card__badge" :color="getStatusMeta(meeting.status).color">{{ getStatusMeta(meeting.status).label }}</CBadge>
            <span class="meeting-card__participant-pill">
              <CIcon name="cil-people" width="16" class="meeting-card__participant-ic" aria-hidden="true" />
              {{ Array.isArray(meeting.participantIds) ? meeting.participantIds.length : 0 }} ผู้เข้าร่วม
            </span>
          </div>

          <div class="meeting-card__body">
            <h5 class="meeting-card__title">{{ meeting.title || '-' }}</h5>
            <div class="meeting-card__meta">
              <CWidgetIcon
                class="meeting-card__meta-widget"
                :header="formatDate(meeting.meetingDate)"
                text="วันที่ประชุม"
                color="gradient-primary"
                :icon-padding="false"
              >
                <CIcon name="cil-calendar" width="24" />
              </CWidgetIcon>
              <CWidgetIcon
                class="meeting-card__meta-widget"
                :header="`${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}`"
                text="เวลา"
                color="gradient-info"
                :icon-padding="false"
              >
                <CIcon name="cil-clock" width="24" />
              </CWidgetIcon>
            </div>

            <div class="meeting-card__detail-list">
              <div class="meeting-card__detail">
                <span class="meeting-card__detail-key">รูปแบบ</span>
                <span class="meeting-card__detail-value">{{ getMeetingModeLabel(meeting) }}</span>
              </div>
              <div class="meeting-card__detail">
                <span class="meeting-card__detail-key">สถานที่</span>
                <span class="meeting-card__detail-value">{{ meeting.location || '-' }}</span>
              </div>
              <div class="meeting-card__detail">
                <span class="meeting-card__detail-key">ลิงก์ประชุม</span>
                <span class="meeting-card__detail-value">
                  <template v-if="meeting.videoLink">
                    <a :href="meeting.videoLink" target="_blank" rel="noopener noreferrer">{{ meeting.videoLink }}</a>
                  </template>
                  <template v-else>-</template>
                </span>
              </div>
            </div>

          </div>

          <div class="meeting-card__footer">
            <CButton
              size="sm"
              block
              :color="meeting.status === 'completed' ? 'secondary' : 'primary'"
              @click="openMinutesModal(meeting)"
            >
              {{ meeting.status === 'completed' ? 'ดูผลประชุม' : 'บันทึกผลประชุม' }}
            </CButton>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center mt-3 flex-wrap" style="gap: 8px;">
        <small class="text-muted">หน้าที่ {{ page }} / {{ totalPages }} | ทั้งหมด {{ total }} รายการ</small>
        <div>
          <CButton
            size="sm"
            color="secondary"
            variant="outline"
            class="mr-2"
            :disabled="page <= 1 || loading"
            @click="onPageChange(page - 1)"
          >
            ก่อนหน้า
          </CButton>
          <CButton
            size="sm"
            color="secondary"
            variant="outline"
            :disabled="page >= totalPages || loading"
            @click="onPageChange(page + 1)"
          >
            ถัดไป
          </CButton>
        </div>
      </div>
    </div>

    <CModal
      :show.sync="showMeetingModal"
      :close-on-backdrop="false"
      centered
      size="xl"
      class="meeting-modal"
      :title="isEditMode ? 'แก้ไขการประชุม' : 'สร้างการประชุมใหม่'"
    >
      <template #body-wrapper>
        <div class="meeting-form">
          <div class="field full-field">
            <label class="form-label">โครงการที่เกี่ยวข้อง</label>
            <multiselect
              v-model="selectedProposalOption"
              :options="proposalOptions"
              :searchable="true"
              :clear-on-select="false"
              :close-on-select="true"
              :preserve-search="true"
              :allow-empty="true"
              :loading="proposalOptionsLoading"
              label="searchText"
              track-by="_id"
              placeholder="พิมพ์เพื่อค้นหาโครงการ..."
              :custom-label="formatProposalTitle"
              @input="onProposalSelected"
            >
              <template slot="singleLabel" slot-scope="{ option }">
                <span>{{ formatProposalTitle(option) }}</span>
              </template>
              <template slot="option" slot-scope="{ option }">
                <div>
                  <div class="font-weight-bold">{{ option.projectTitleTh || option.projectTitleEn || '-' }}</div>
                </div>
              </template>
            </multiselect>
            <small class="text-muted d-block mt-1">ระบบจะแสดงโครงการที่เลือกจากหน้าจัดการโครงการโดยอัตโนมัติ</small>
            <small v-if="proposalOptionsError" class="text-warning d-block mt-1">โหลดรายชื่อโครงการไม่สำเร็จ: {{ proposalOptionsError }}</small>
          </div>
          <div class="field full-field">
            <label class="form-label">ผู้เข้าร่วมเพิ่มเติม (ไม่บังคับ)</label>
            <multiselect
              v-model="selectedParticipantOptions"
              :options="participantOptions"
              :searchable="true"
              :multiple="true"
              :close-on-select="false"
              :clear-on-select="false"
              :preserve-search="true"
              :allow-empty="true"
              :loading="participantOptionsLoading"
              label="searchText"
              track-by="_id"
              placeholder="พิมพ์เพื่อค้นหาผู้ใช้..."
              :custom-label="formatParticipantLabel"
            >
              <template slot="option" slot-scope="{ option }">
                <div>
                  <div class="font-weight-bold">{{ option.fullName || '-' }}</div>
                  <small class="text-muted">{{ option.email || '' }}</small>
                </div>
              </template>
            </multiselect>
            <small v-if="participantOptionsError" class="text-warning d-block mt-1">โหลดรายชื่อผู้ใช้ไม่สำเร็จ: {{ participantOptionsError }}</small>
          </div>
          <div class="field full-field">
            <label class="form-label">ชื่อการประชุม <span class="required">*</span></label>
            <CInput class="full" v-model="meetingForm.title" />
          </div>

          <div class="small-row">
            <div class="field small-field">
              <label class="form-label">วันที่ประชุม <span class="required">*</span></label>
              <CInput type="date" v-model="meetingForm.meetingDate" />
            </div>
            <div class="field small-field">
              <label class="form-label">เวลาเริ่ม <span class="required">*</span></label>
              <CInput type="time" v-model="meetingForm.startTime" />
            </div>
            <div class="field small-field">
              <label class="form-label">เวลาสิ้นสุด</label>
              <CInput type="time" v-model="meetingForm.endTime" />
            </div>
          </div>

          <div class="field full-field">
            <label class="form-label">สถานที่</label>
            <CInput class="full" v-model="meetingForm.location" />
          </div>

          <div class="field full-field">
            <label class="form-label">ลิงก์วิดีโอประชุม</label>
            <CInput
              class="full"
              type="url"
              placeholder="https://zoom.us/... หรือ https://meet.google.com/..."
              v-model="meetingForm.videoLink"
            />
            <small class="form-text">ตัวอย่าง: https://zoom.us/meeting/xxx หรือ https://meet.google.com/xxx</small>
          </div>

          <div class="field full-field">
            <label class="form-label">วาระการประชุม</label>
            <CTextarea class="full" rows="4" v-model="meetingForm.agenda" />
            <small class="form-text">ใส่หัวข้อย่อยหรือประเด็นหลักที่ต้องหารือ (ถ้ามี)</small>
          </div>

          <CSelect
            class="full"
            label="สถานะ"
            :value="meetingForm.status"
            :options="statusSelectOptions"
            @change="meetingForm.status = getSelectValue($event)"
          />
        </div>
      </template>

      <template #footer-wrapper>
        <div class="d-flex justify-content-end w-100 modal-actions-wrapper">
          <CButton
            color="secondary"
            class="mr-2 floating-action"
            @click="closeMeetingModal"
          >ยกเลิก</CButton>
          <CButton
            color="primary"
            class="floating-action btn-save"
            :disabled="savingMeeting"
            @click="saveMeeting"
          >
            {{ savingMeeting ? 'กำลังบันทึก...' : 'บันทึก' }}
          </CButton>
        </div>
      </template>
    </CModal>

    <CModal
      :show.sync="showMinutesModal"
      :close-on-backdrop="false"
      centered
      size="xl"
      class="minutes-modal"
      :title="`บันทึกผลการประชุม — ${minutesMeeting ? (minutesMeeting.title || '-') : '-'}`"
    >
      <template #body-wrapper>
        <div class="minutes-form">
          <div v-if="minutesMeeting" class="mb-3">
            <small class="text-muted">📅 {{ formatDate(minutesMeeting.meetingDate) }} | 📍 {{ minutesMeeting.location || '-' }}</small>
          </div>

          <CTextarea
            label="บันทึกการประชุม"
            rows="5"
            placeholder="บันทึกสิ่งที่เกิดขึ้นในการประชุม..."
            v-model="minutesForm.minutes"
            :disabled="isReadOnly(minutesMeeting)"
          />

          <CTextarea
            label="มติที่ประชุม"
            rows="4"
            placeholder="มติหรือข้อสรุปสำคัญจากที่ประชุม..."
            v-model="minutesForm.decisions"
            :disabled="isReadOnly(minutesMeeting)"
          />

          <div class="table-responsive">
            <table class="table table-bordered table-sm">
              <thead>
                <tr>
                  <th>งานที่ต้องทำ</th>
                  <th>ผู้รับผิดชอบ</th>
                  <th>กำหนดเสร็จ</th>
                  <th style="width: 60px;">#</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in minutesForm.actionItems" :key="index">
                  <td><CInput v-model="item.task" :disabled="isReadOnly(minutesMeeting)" /></td>
                  <td><CInput v-model="item.assignee" :disabled="isReadOnly(minutesMeeting)" /></td>
                  <td><CInput type="date" v-model="item.deadline" :disabled="isReadOnly(minutesMeeting)" /></td>
                  <td>
                    <CButton
                      size="sm"
                      color="danger"
                      :disabled="isReadOnly(minutesMeeting)"
                      @click="removeActionItem(index)"
                    >
                      X
                    </CButton>
                  </td>
                </tr>
                <tr v-if="minutesForm.actionItems.length === 0">
                  <td colspan="4" class="text-center text-muted">ยังไม่มี Action Items</td>
                </tr>
              </tbody>
            </table>
          </div>

          <CButton
            v-if="!isReadOnly(minutesMeeting)"
            size="sm"
            color="primary"
            variant="outline"
            @click="addActionItem"
          >
            + เพิ่ม Action Item
          </CButton>
        </div>
      </template>

      <template #footer-wrapper>
        <div class="d-flex justify-content-end w-100 modal-actions-wrapper">
          <CButton color="secondary" class="mr-2 floating-action" @click="closeMinutesModal">ยกเลิก</CButton>
          <CButton
            v-if="!isReadOnly(minutesMeeting)"
            color="primary"
            class="floating-action btn-save"
            :disabled="savingMinutes"
            @click="saveMinutes"
          >
            {{ savingMinutes ? 'กำลังบันทึก...' : 'บันทึกผลประชุม' }}
          </CButton>
        </div>
      </template>
    </CModal>
  </div>
</template>

<script>
import { instance as axios } from '@/service/api'
import Swal from 'sweetalert2'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'

const MEETING_STATUS = {
  scheduled: { label: 'กำหนดการแล้ว', color: 'info' },
  completed: { label: 'เสร็จสิ้น', color: 'success' },
  cancelled: { label: 'ยกเลิก', color: 'danger' }
}

export default {
  name: 'AdminMeetings',
  components: { Multiselect },
  data () {
    return {
      meetings: [],
      total: 0,
      page: 1,
      totalPages: 1,
      limit: 9,
      loading: false,
      filterStatus: '',

      showMeetingModal: false,
      isEditMode: false,
      selectedMeeting: null,
      selectedMeetingForActions: null,
      pendingProposalIds: [],
      pendingProjectTitle: '',
      proposalOptions: [],
      proposalOptionsLoading: false,
      proposalOptionsError: null,
      selectedProposalOption: null,
      autoProjectTitle: '',
      participantOptions: [],
      participantOptionsLoading: false,
      participantOptionsError: null,
      pendingParticipantIds: [],
      selectedParticipantOptions: [],
      savingMeeting: false,
      meetingForm: {
        title: '',
        meetingDate: '',
        startTime: '',
        endTime: '',
        location: '',
        videoLink: '',
        agenda: '',
        status: 'scheduled'
      },

      showMinutesModal: false,
      minutesMeeting: null,
      savingMinutes: false,
      minutesForm: {
        minutes: '',
        decisions: '',
        actionItems: []
      }
    }
  },
  computed: {
    statusFilterOptions () {
      return [
        { value: '', label: 'ทั้งหมด' },
        { value: 'scheduled', label: MEETING_STATUS.scheduled.label },
        { value: 'completed', label: MEETING_STATUS.completed.label },
        { value: 'cancelled', label: MEETING_STATUS.cancelled.label }
      ]
    },
    statusSelectOptions () {
      return [
        { value: 'scheduled', label: MEETING_STATUS.scheduled.label },
        { value: 'completed', label: MEETING_STATUS.completed.label },
        { value: 'cancelled', label: MEETING_STATUS.cancelled.label }
      ]
    }
  },
  mounted () {
    this.fetchMeetings()
    this.fetchProposalOptions()
    this.fetchParticipantOptions()
    this.consumeProposalContext()
  },
  watch: {
    '$route.query' () {
      this.consumeProposalContext()
    }
  },
  methods: {
    formatProposalTitle (p) {
      if (!p) return '-'
      return p.projectTitleTh || p.projectTitleEn || p.projectTitle || '-'
    },
    formatParticipantLabel (u) {
      if (!u) return '-'
      return u.fullName || u.email || '-'
    },
    async fetchProposalOptions () {
      this.proposalOptionsLoading = true
      this.proposalOptionsError = null
      try {
        const response = await axios.get('/api/v1/proposals', { params: { page: 1, limit: 300 } })
        const payload = (response && response.data && response.data.data) || {}
        const list = Array.isArray(payload.proposals)
          ? payload.proposals
          : (Array.isArray(payload.data) ? payload.data : [])
        this.proposalOptions = list.map(p => {
          const th = (p && p.projectTitleTh) ? String(p.projectTitleTh) : ''
          const en = (p && p.projectTitleEn) ? String(p.projectTitleEn) : ''
          const code = (p && p.proposalCode) ? String(p.proposalCode) : ''
          const searchText = [th, en, code].filter(Boolean).join(' ')
          return { ...p, searchText }
        })
        this.resolveSelectedProposalOption()
      } catch (err) {
        console.error('[AdminMeetings] Error fetching proposals for select:', err)
        this.proposalOptions = []
        this.proposalOptionsError = (err && err.message) || 'โหลดข้อมูลไม่สำเร็จ'
      } finally {
        this.proposalOptionsLoading = false
      }
    },
    async fetchParticipantOptions () {
      this.participantOptionsLoading = true
      this.participantOptionsError = null
      try {
        const response = await axios.get('/api/v1/users', { params: { page: 1, limit: 200 } })
        const payload = (response && response.data && response.data.data) || {}
        const list = Array.isArray(payload.users) ? payload.users : []
        this.participantOptions = list.map(u => {
          const name = (u && u.fullName) ? String(u.fullName) : ''
          const email = (u && u.email) ? String(u.email) : ''
          return {
            ...u,
            searchText: `${name} ${email}`.trim()
          }
        })
        this.resolveSelectedParticipantOptions()
      } catch (err) {
        console.error('[AdminMeetings] Error fetching users for participant select:', err)
        this.participantOptions = []
        this.participantOptionsError = (err && err.message) || 'โหลดข้อมูลไม่สำเร็จ'
      } finally {
        this.participantOptionsLoading = false
      }
    },
    resolveSelectedParticipantOptions () {
      const ids = (Array.isArray(this.pendingParticipantIds) && this.pendingParticipantIds.length)
        ? this.pendingParticipantIds
        : (this.isEditMode && this.selectedMeeting && Array.isArray(this.selectedMeeting.participantIds) ? this.selectedMeeting.participantIds.map(String) : [])
      if (!ids.length || !Array.isArray(this.participantOptions) || !this.participantOptions.length) return
      this.selectedParticipantOptions = this.participantOptions.filter(u => ids.includes(String(u && u._id)))
    },
    resolveSelectedProposalOption () {
      const id = (this.pendingProposalIds && this.pendingProposalIds[0])
        || (this.selectedMeeting && Array.isArray(this.selectedMeeting.proposalIds) && this.selectedMeeting.proposalIds[0])
        || ''
      if (!id || !Array.isArray(this.proposalOptions) || !this.proposalOptions.length) return
      const match = this.proposalOptions.find(p => String(p && p._id) === String(id))
      if (match) {
        this.selectedProposalOption = match
        const title = match.projectTitleTh || match.projectTitleEn || match.projectTitle || ''
        if (title) this.applyProjectToForm(title)
      }
    },
    applyProjectToForm (projectTitle) {
      const title = String(projectTitle || '').trim()
      if (!title) return

      const nextAutoTitle = `ประชุมพิจารณาโครงการ: ${title}`
      const nextAutoPrefix = `โครงการ: ${title}`

      if (!this.meetingForm.title || (this.autoProjectTitle && this.meetingForm.title === `ประชุมพิจารณาโครงการ: ${this.autoProjectTitle}`)) {
        this.meetingForm.title = nextAutoTitle
      }

      if (!this.meetingForm.agenda || (this.autoProjectTitle && this.meetingForm.agenda.trim().startsWith(`โครงการ: ${this.autoProjectTitle}`))) {
        this.meetingForm.agenda = nextAutoPrefix
      }

      this.autoProjectTitle = title
    },
    onProposalSelected (opt) {
      if (!opt) {
        this.selectedProposalOption = null
        this.pendingProposalIds = []
        this.pendingProjectTitle = ''
        this.autoProjectTitle = ''
        return
      }
      this.selectedProposalOption = opt
      this.pendingProposalIds = [String(opt._id)]
      const title = opt.projectTitleTh || opt.projectTitleEn || opt.projectTitle || ''
      this.pendingProjectTitle = title
      if (title) this.applyProjectToForm(title)
    },
    consumeProposalContext () {
      const q = (this.$route && this.$route.query) ? this.$route.query : {}
      const proposalId = q.fromProposalId || q.proposalId || ''
      const projectTitle = q.fromProjectTitle || q.projectTitle || ''

      if (!proposalId && !projectTitle) return

      this.openCreateModal()

      this.pendingProposalIds = proposalId ? [String(proposalId)] : []
      this.pendingProjectTitle = projectTitle ? String(projectTitle) : ''
      this.selectedProposalOption = null
      this.autoProjectTitle = ''

      if (this.pendingProjectTitle) {
        this.applyProjectToForm(this.pendingProjectTitle)
      }

      if (!this.proposalOptionsLoading && (!this.proposalOptions || !this.proposalOptions.length)) {
        this.fetchProposalOptions()
      } else {
        this.resolveSelectedProposalOption()
      }

      const nextQuery = { ...q }
      delete nextQuery.fromProposalId
      delete nextQuery.proposalId
      delete nextQuery.fromProjectTitle
      delete nextQuery.projectTitle
      this.$router.replace({ path: this.$route.path, query: nextQuery })
    },
    getSelectValue (val) {
      return val && val.target ? val.target.value : val
    },
    getStatusMeta (status) {
      return MEETING_STATUS[status] || { label: status || '-', color: 'secondary' }
    },
    getMeetingCardClass (meeting) {
      return {
        scheduled: meeting.status === 'scheduled',
        completed: meeting.status === 'completed',
        cancelled: meeting.status === 'cancelled'
      }
    },
    selectMeetingForActions (meeting) {
      this.selectedMeetingForActions = meeting || null
    },
    isSelectedMeeting (meeting) {
      if (!meeting || !this.selectedMeetingForActions) return false
      return String(meeting._id) === String(this.selectedMeetingForActions._id)
    },
    getMeetingModeLabel (meeting) {
      if (!meeting) return '-'
      const videoLink = meeting.videoLink ? String(meeting.videoLink).trim() : ''
      const location = meeting.location ? String(meeting.location).trim() : ''
      const locationLooksOnline = /online|zoom|teams|meet|webex/i.test(location) || /^https?:\/\//i.test(location)
      return (videoLink || locationLooksOnline) ? 'ออนไลน์' : 'ออนไซต์'
    },
    async fetchMeetings () {
      this.loading = true
      try {
        const params = {
          page: this.page,
          limit: this.limit
        }
        if (this.filterStatus) params.status = this.filterStatus

        const response = await axios.get('/api/v1/meetings', { params })
        const payload = (response && response.data && response.data.data) || {}
        const list = Array.isArray(payload.meetings)
          ? payload.meetings
          : (Array.isArray(payload.data) ? payload.data : [])

        this.meetings = list
        this.total = Number(payload.total) || list.length
        this.page = Number(payload.page) || this.page
        this.totalPages = Number(payload.totalPages) || Math.max(1, Math.ceil(this.total / this.limit))

        if (!this.selectedMeetingForActions && this.meetings.length > 0) {
          this.selectedMeetingForActions = this.meetings[0]
        } else if (this.selectedMeetingForActions) {
          const stillExists = this.meetings.find(m => String(m._id) === String(this.selectedMeetingForActions._id))
          this.selectedMeetingForActions = stillExists || (this.meetings[0] || null)
        }
      } catch (error) {
        console.error('[AdminMeetings] Error fetching meetings:', error)
        this.meetings = []
        this.total = 0
        this.totalPages = 1
        this.selectedMeetingForActions = null
      } finally {
        this.loading = false
      }
    },
    onFilterStatusChange (val) {
      this.filterStatus = this.getSelectValue(val)
      this.page = 1
      this.fetchMeetings()
    },
    onReset () {
      this.filterStatus = ''
      this.page = 1
      this.fetchMeetings()
    },
    onPageChange (nextPage) {
      if (nextPage < 1 || nextPage > this.totalPages) return
      this.page = nextPage
      this.fetchMeetings()
    },
    openCreateModal () {
      this.isEditMode = false
      this.selectedMeeting = null
      this.pendingProposalIds = []
      this.pendingProjectTitle = ''
      this.selectedProposalOption = null
      this.autoProjectTitle = ''
      this.pendingParticipantIds = []
      this.selectedParticipantOptions = []
      this.meetingForm = {
        title: '',
        meetingDate: '',
        startTime: '',
        endTime: '',
        location: '',
        videoLink: '',
        agenda: '',
        status: 'scheduled'
      }
      this.showMeetingModal = true
      if (!this.participantOptionsLoading && (!this.participantOptions || !this.participantOptions.length)) {
        this.fetchParticipantOptions()
      }
    },
    openEditModal (meeting) {
      this.isEditMode = true
      this.selectedMeeting = meeting
      this.pendingProposalIds = []
      this.pendingProjectTitle = ''
      this.selectedProposalOption = null
      this.autoProjectTitle = ''
      this.pendingParticipantIds = Array.isArray(meeting && meeting.participantIds) ? meeting.participantIds.map(String) : []
      this.selectedParticipantOptions = []
      this.meetingForm = {
        title: meeting.title || '',
        meetingDate: meeting.meetingDate || '',
        startTime: meeting.startTime || '',
        endTime: meeting.endTime || '',
        location: meeting.location || '',
        videoLink: meeting.videoLink || '',
        agenda: meeting.agenda || '',
        status: meeting.status || 'scheduled'
      }
      this.showMeetingModal = true
      this.$nextTick(() => {
        this.resolveSelectedProposalOption()
        this.resolveSelectedParticipantOptions()
      })
      if (!this.participantOptionsLoading && (!this.participantOptions || !this.participantOptions.length)) {
        this.fetchParticipantOptions()
      }
    },
    closeMeetingModal () {
      this.showMeetingModal = false
      this.savingMeeting = false
    },
    async saveMeeting () {
      if (!this.meetingForm.title || !this.meetingForm.meetingDate || !this.meetingForm.startTime) {
        await Swal.fire({ icon: 'warning', title: 'กรอกข้อมูลไม่ครบ', text: 'ชื่อการประชุม วันที่ประชุม และเวลาเริ่ม เป็นข้อมูลบังคับ' })
        return
      }

      this.savingMeeting = true
      try {
        const proposalIds = this.selectedProposalOption && this.selectedProposalOption._id
          ? [String(this.selectedProposalOption._id)]
          : ((this.isEditMode && this.selectedMeeting && this.selectedMeeting.proposalIds) ? this.selectedMeeting.proposalIds : [])

        let participantIds = Array.isArray(this.selectedParticipantOptions)
          ? this.selectedParticipantOptions.map(u => String(u && u._id)).filter(Boolean)
          : []

        // If options failed to load during edit, preserve existing participants instead of wiping.
        if (this.isEditMode && (!participantIds || participantIds.length === 0) && this.selectedMeeting && Array.isArray(this.selectedMeeting.participantIds)) {
          participantIds = this.selectedMeeting.participantIds
        }

        const body = {
          title: this.meetingForm.title,
          meetingDate: this.meetingForm.meetingDate,
          startTime: this.meetingForm.startTime,
          endTime: this.meetingForm.endTime,
          location: this.meetingForm.location,
          videoLink: this.meetingForm.videoLink,
          proposalIds,
          participantIds,
          agenda: this.meetingForm.agenda,
          status: this.meetingForm.status
        }

        if (this.isEditMode && this.selectedMeeting && this.selectedMeeting._id) {
          await axios.put(`/api/v1/meetings/${this.selectedMeeting._id}`, body)
        } else {
          await axios.post('/api/v1/meetings', body)
        }

        this.closeMeetingModal()
        await this.fetchMeetings()
        await Swal.fire({ icon: 'success', title: 'บันทึกข้อมูลการประชุมสำเร็จ', timer: 1400, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminMeetings] Error saving meeting:', error)
        await Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: 'API การประชุมยังไม่พร้อมใช้งาน' })
      } finally {
        this.savingMeeting = false
      }
    },
    async deleteMeeting (meeting) {
      const result = await Swal.fire({
        icon: 'warning',
        title: 'ยืนยันการลบ',
        text: `ลบการประชุม '${meeting.title || ''}'? ไม่สามารถกู้คืนได้`,
        showCancelButton: true,
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#e55353'
      })
      if (!result.isConfirmed) return

      try {
        await axios.delete(`/api/v1/meetings/${meeting._id}`)
        await this.fetchMeetings()
        await Swal.fire({ icon: 'success', title: 'ลบการประชุมสำเร็จ', timer: 1300, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminMeetings] Error deleting meeting:', error)
        await Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ', text: 'API การประชุมยังไม่พร้อมใช้งาน' })
      }
    },
    openMinutesModal (meeting) {
      this.minutesMeeting = meeting
      this.minutesForm = {
        minutes: meeting.minutes || '',
        decisions: meeting.decisions || '',
        actionItems: Array.isArray(meeting.actionItems) ? meeting.actionItems.map(item => ({ ...item })) : []
      }
      if (!Array.isArray(this.minutesForm.actionItems)) {
        this.minutesForm.actionItems = []
      }
      this.showMinutesModal = true
    },
    closeMinutesModal () {
      this.showMinutesModal = false
      this.minutesMeeting = null
      this.savingMinutes = false
      this.minutesForm = {
        minutes: '',
        decisions: '',
        actionItems: []
      }
    },
    addActionItem () {
      this.minutesForm.actionItems.push({ task: '', assignee: '', deadline: '' })
    },
    removeActionItem (index) {
      this.minutesForm.actionItems.splice(index, 1)
    },
    async saveMinutes () {
      if (!this.minutesMeeting || !this.minutesMeeting._id) return

      this.savingMinutes = true
      try {
        await axios.put(`/api/v1/meetings/${this.minutesMeeting._id}/minutes`, {
          minutes: this.minutesForm.minutes,
          decisions: this.minutesForm.decisions,
          actionItems: this.minutesForm.actionItems
        })

        await axios.patch(`/api/v1/meetings/${this.minutesMeeting._id}/status`, {
          status: 'completed'
        })

        this.closeMinutesModal()
        await this.fetchMeetings()
        await Swal.fire({ icon: 'success', title: 'บันทึกผลการประชุมสำเร็จ', timer: 1400, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminMeetings] Error saving minutes:', error)
        await Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: 'API การประชุมยังไม่พร้อมใช้งาน' })
      } finally {
        this.savingMinutes = false
      }
    },
    getSummaryCount (status) {
      return this.meetings.filter(m => m.status === status).length
    },
    formatDate (dateStr) {
      if (!dateStr) return '-'
      const d = new Date(dateStr)
      if (Number.isNaN(d.getTime())) return '-'
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const yearBE = d.getFullYear() + 543
      return `${day}/${month}/${yearBE}`
    },
    formatTime (time) {
      return time || '-'
    },
    isReadOnly (meeting) {
      return meeting && meeting.status === 'completed'
    }
  }
}
</script>

<style scoped>
.admin-meetings-page {
  width: 100%;
  padding-bottom: 24px;
}

.meetings-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 28px;
  margin-bottom: 24px;
  border-radius: 22px;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.28), transparent 30%),
    linear-gradient(135deg, #1d4ed8, #0f766e);
  color: #ffffff;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.16);
}

.meetings-hero__content {
  max-width: 720px;
}

.meetings-hero__eyebrow {
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

.meetings-hero__title {
  margin-bottom: 10px;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.3;
}

.meetings-hero__subtitle {
  max-width: 620px;
  color: rgba(255, 255, 255, 0.84);
  font-size: 0.98rem;
  line-height: 1.7;
}

.hero-action-btn {
  min-width: 210px;
  border-radius: 14px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.18);
}

.summary-row {
  margin-bottom: 8px;
}

/* vue-multiselect: remove default green highlight/selected background */
::v-deep .multiselect__option--highlight {
  background: #eef2f7;
  color: #0f172a;
}

::v-deep .multiselect__option--highlight::after {
  content: '';
  display: none;
}

::v-deep .multiselect__option--selected {
  background: #f8fafc;
  color: #0f172a;
  font-weight: 600;
}

::v-deep .multiselect__option--selected::after {
  content: '';
  display: none;
}

.summary-card {
  height: 100%;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.summary-card--info {
  border-top: 4px solid #3b82f6;
}

.summary-card--success {
  border-top: 4px solid #22c55e;
}

.summary-card--danger {
  border-top: 4px solid #ef4444;
}

.summary-label {
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 600;
}

.summary-number {
  margin: 10px 0 8px;
  color: #111827;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.summary-caption {
  color: #6b7280;
  font-size: 0.88rem;
  line-height: 1.5;
}

.filter-card {
  border: none;
  border-radius: 20px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.filter-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.filter-card__title {
  color: #111827;
  font-size: 1rem;
  font-weight: 700;
}

.filter-card__subtitle {
  margin-top: 4px;
  color: #6b7280;
  font-size: 0.88rem;
}

.filter-reset-btn {
  min-height: 44px;
  border-radius: 12px;
}

.filter-card__bottom-actions {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.meeting-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 18px;
}

.meeting-card {
  --status-rgb: 59, 130, 246;
  display: flex;
  flex-direction: column;
  height: 480px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 20px;
  padding: 18px;
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  overflow: hidden;
  outline: none;
}

.meeting-card--selected {
  border-color: rgba(var(--status-rgb), 0.65);
  box-shadow: 0 0 0 3px rgba(var(--status-rgb), 0.16), 0 14px 30px rgba(15, 23, 42, 0.06);
}

.meeting-card:focus,
.meeting-card:focus-visible {
  border-color: rgba(var(--status-rgb), 0.65);
  box-shadow: 0 0 0 3px rgba(var(--status-rgb), 0.16), 0 14px 30px rgba(15, 23, 42, 0.06);
}

.meeting-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 42px rgba(15, 23, 42, 0.1);
}

.meeting-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  margin-left: -18px;
  margin-right: -18px;
  margin-top: -18px;
  padding: 12px 18px;
  background: linear-gradient(90deg, rgba(var(--status-rgb), 0.22), rgba(var(--status-rgb), 0.08));
  border-bottom: 1px solid rgba(var(--status-rgb), 0.18);
}

.meeting-card__actions {
  display: flex;
  align-items: center;
}

.meeting-card__badge {
  padding: 6px 10px;
  border-radius: 999px;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
}

.meeting-card__participant-pill {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(var(--status-rgb), 0.22);
  color: rgb(15, 23, 42);
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.meeting-card__participant-ic {
  color: rgba(var(--status-rgb), 0.92);
}

.meeting-card.scheduled {
  --status-rgb: 59, 130, 246;
}

.meeting-card.completed {
  --status-rgb: 34, 197, 94;
}

.meeting-card.cancelled {
  --status-rgb: 239, 68, 68;
}

.meeting-card__body {
  flex: 1;
}

.meeting-card__title {
  margin-bottom: 14px;
  color: #111827;
  font-size: 1.18rem;
  font-weight: 800;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meeting-card__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.meeting-card__meta-widget {
  margin-bottom: 0;
}

.meeting-card__meta-widget::v-deep.card {
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.06);
}

.meeting-card__meta-widget::v-deep .card-body {
  padding: 0 !important;
  align-items: stretch !important;
}

.meeting-card__meta-widget::v-deep .card-body > .mr-3 {
  margin: 0 !important;
  padding: 0 !important;
  width: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.meeting-card__meta-widget::v-deep .card-body > div:not(.mr-3) {
  padding: 10px 12px !important;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.meeting-card__meta-widget::v-deep .text-value {
  line-height: 1.1;
  margin-bottom: 2px;
}

.meeting-card__meta-widget::v-deep .small {
  line-height: 1.1;
}

.meeting-card__detail-list {
  padding: 14px 0;
  border-top: 1px solid rgba(148, 163, 184, 0.22);
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
}

.meeting-card__detail {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.22);
}

.meeting-card__detail:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.meeting-card__detail-key {
  min-width: 82px;
  color: #6b7280;
  font-size: 0.86rem;
  flex: 0 0 auto;
}

.meeting-card__detail-value {
  color: #111827;
  font-size: 0.9rem;
  text-align: right;
  flex: 1 1 auto;
  max-width: 70%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meeting-card__detail-value a {
  color: #2563eb;
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meeting-card__footer {
  margin-top: 18px;
}

.meeting-card.completed {
  border-color: rgba(34, 197, 94, 0.35);
  background: linear-gradient(180deg, #ffffff, #f3fff7);
}

.meeting-card.cancelled {
  border-color: rgba(239, 68, 68, 0.3);
  background: linear-gradient(180deg, #ffffff, #fff5f5);
  opacity: 0.88;
}

.empty-state {
  padding: 40px 24px;
  border: 1px dashed #cbd5e1;
  border-radius: 20px;
  background: #ffffff;
  text-align: center;
  color: #64748b;
}

.empty-state__icon {
  margin-bottom: 12px;
  font-size: 2.25rem;
}

.empty-state__title {
  margin-bottom: 6px;
  color: #0f172a;
  font-size: 1.05rem;
  font-weight: 700;
}

.empty-state__text {
  max-width: 520px;
  margin: 0 auto;
  line-height: 1.6;
}

@media (max-width: 991px) {
  .meetings-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .meetings-hero__action {
    width: 100%;
  }

  .hero-action-btn {
    width: 100%;
  }
}

@media (max-width: 767px) {
  .meetings-hero {
    padding: 22px 18px;
    border-radius: 18px;
  }

  .meetings-hero__title {
    font-size: 1.5rem;
  }

  .meeting-card__top,
  .meeting-card__detail {
    flex-direction: column;
    align-items: flex-start;
  }

  .meeting-card__actions {
    width: 100%;
  }

  .meeting-card__meta {
    grid-template-columns: 1fr;
  }

  .meeting-card__detail-value {
    text-align: left;
    max-width: 100%;
  }
}

/* Modal form improvements */
.meeting-modal .meeting-form,
.minutes-modal .minutes-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 6px 0 2px;
  align-items: start;
}

.meeting-modal .meeting-form .full,
.minutes-modal .minutes-form .full {
  grid-column: 1 / -1;
}

.meeting-modal .meeting-form .small-row {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.meeting-modal input,
.meeting-modal textarea,
.meeting-modal select,
.minutes-modal input,
.minutes-modal textarea,
.minutes-modal select {
  min-height: 44px;
  padding: 10px 12px;
  border-radius: 10px;
}

.meeting-modal input,
.meeting-modal textarea,
.meeting-modal select,
.minutes-modal input,
.minutes-modal textarea,
.minutes-modal select {
  width: 100%;
  box-sizing: border-box;
}

.meeting-modal .modal-body,
.minutes-modal .modal-body {
  padding: 10px 16px !important;
}

.meeting-modal .modal-content,
.minutes-modal .modal-content {
  background: #ffffff;
  overflow: hidden;
}

.meeting-modal .meeting-form,
.minutes-modal .minutes-form {
  max-width: 100%;
  margin: 0;
  width: 100%;
  padding-left: 12px;
  padding-right: 12px;
  box-sizing: border-box;
}

.meeting-modal .form-label,
.minutes-modal .form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  text-align: left;
}

.meeting-modal .required,
.minutes-modal .required { color: #e11d48; margin-left: 0; }

.meeting-modal .full-field,
.minutes-modal .full-field { grid-column: 1 / -1; }

.meeting-modal .form-text,
.minutes-modal .form-text { display:block; color:#6b7280; margin-top:6px; font-size:0.92rem; }

.meeting-modal .meeting-form .form-text,
.minutes-modal .minutes-form .form-text {
  color: #6b7280;
}

.btn-save {
  min-width: 140px;
  border-radius: 10px !important;
}

@media (max-width: 767px) {
  .meeting-modal .meeting-form,
  .minutes-modal .minutes-form {
    gap: 10px;
  }
}
/* Footer buttons: make both floating buttons equal and aligned with documents modal */
.meeting-modal .modal-actions-wrapper { padding-right: 48px !important; justify-content: flex-end !important; }
.meeting-modal .modal-actions-wrapper > .floating-action,
.meeting-modal .modal-actions-wrapper > .floating-action + .floating-action,
.meeting-modal .modal-footer .d-flex.justify-content-end > * {
  transform: translateY(-8px) scale(1) !important;
  box-shadow: 0 8px 20px rgba(15,23,42,0.12) !important;
  position: relative !important;
  z-index: 11000 !important;
  padding: 8px 14px !important;
  font-size: 0.9rem !important;
  min-width: 110px !important;
  border-radius: 8px !important;
}
.meeting-modal .btn-save { min-width: 110px !important; }
</style>

<style>
/* Global modal footer/button + required asterisk rules (apply to teleported modals) */
.meeting-modal .modal-actions-wrapper,
.minutes-modal .modal-actions-wrapper { padding-right: 48px !important; justify-content: flex-end !important; }
.meeting-modal .modal-actions-wrapper > .floating-action,
.minutes-modal .modal-actions-wrapper > .floating-action,
.meeting-modal .modal-actions-wrapper > .floating-action + .floating-action,
.minutes-modal .modal-actions-wrapper > .floating-action + .floating-action,
.meeting-modal .modal-footer .d-flex.justify-content-end > *,
.minutes-modal .modal-footer .d-flex.justify-content-end > * {
  transform: translateY(-8px) !important;
  box-shadow: 0 8px 20px rgba(15,23,42,0.12) !important;
  position: relative !important;
  z-index: 11000 !important;
  padding: 8px 14px !important;
  font-size: 0.9rem !important;
  min-width: 110px !important;
  border-radius: 8px !important;
}
.meeting-modal .btn-save,
.minutes-modal .btn-save { min-width: 110px !important; }
.meeting-modal .required,
.minutes-modal .required { color: #e11d48 !important; margin-left: 0; }
</style>
