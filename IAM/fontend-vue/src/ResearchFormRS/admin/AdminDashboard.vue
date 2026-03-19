<template>
  <div class="admin-dashboard-page">
    <div class="mb-3">
      <h2 class="mb-1">Admin Proposal Dashboard</h2>
      <p class="text-muted mb-0">ภาพรวมข้อเสนอโครงการทั้งระบบ</p>
    </div>

    <div v-if="loadingSummary" class="text-center py-3">
      <CSpinner color="primary" size="sm" />
      <small class="text-muted ml-2">กำลังโหลดสรุปสถานะ...</small>
    </div>

    <div v-else>
      <CRow class="mb-2">
        <CCol sm="6" lg="3" class="mb-3" v-for="card in summaryRow1" :key="card.status">
          <div
            class="summary-card"
            :class="[`border-${card.borderColor}`, { active: selectedStatus === card.status }]"
            @click="onCardClick(card.status)"
          >
            <small class="text-muted">{{ card.label }}</small>
            <div class="summary-number">{{ summary[card.status] || 0 }}</div>
          </div>
        </CCol>
      </CRow>

      <CRow class="mb-2">
        <CCol sm="6" lg="3" class="mb-3" v-for="card in summaryRow2" :key="card.status">
          <div
            class="summary-card"
            :class="[`border-${card.borderColor}`, { active: selectedStatus === card.status }]"
            @click="onCardClick(card.status)"
          >
            <small class="text-muted">{{ card.label }}</small>
            <div class="summary-number">{{ summary[card.status] || 0 }}</div>
          </div>
        </CCol>
      </CRow>

      <CRow class="mb-4">
        <CCol sm="6" lg="3" class="mb-3" v-for="card in summaryRow3" :key="card.status">
          <div
            class="summary-card summary-card-small"
            :class="[`border-${card.borderColor}`, { active: selectedStatus === card.status }]"
            @click="onCardClick(card.status)"
          >
            <small class="text-muted">{{ card.label }}</small>
            <div class="summary-number">{{ summary[card.status] || 0 }}</div>
          </div>
        </CCol>
      </CRow>
    </div>

    <section ref="tableSection">
      <CCard class="mb-3">
        <CCardBody>
          <CRow>
            <CCol md="5" class="mb-2 mb-md-0">
              <CInput
                v-model="searchKeyword"
                placeholder="ค้นหาชื่อโครงการ หรือ รหัส..."
                @input="onSearch"
              />
            </CCol>
            <CCol md="3" class="mb-2 mb-md-0">
              <CSelect
                :value="selectedStatus"
                :options="statusFilterOptions"
                @change="onStatusChange"
              />
            </CCol>
            <CCol md="2" class="mb-2 mb-md-0">
              <CSelect
                :value="selectedYear"
                :options="yearFilterOptions"
                @change="onYearChange"
              />
            </CCol>
            <CCol md="2">
              <CButton color="secondary" variant="outline" block @click="onReset">รีเซ็ต</CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <CCard>
        <CCardHeader>
          <strong>รายการข้อเสนอโครงการ</strong>
        </CCardHeader>
        <CCardBody>
          <div v-if="loadingTable" class="text-center py-5">
            <CSpinner color="primary" />
            <div class="mt-2 text-muted">กำลังโหลดรายการโครงการ...</div>
          </div>

          <div v-else>
            <CDataTable
              :items="tableItems"
              :fields="tableFields"
              hover
              striped
              bordered
              small
              :items-per-page="limit"
              :no-items-view="{ noItems: 'ไม่พบข้อมูลโครงการ', noResults: 'ไม่พบข้อมูลโครงการ' }"
            >
              <template #index="{ item }">
                <td>{{ item.index }}</td>
              </template>

              <template #projectTitleTh="{ item }">
                <td>
                  <div class="font-weight-bold">{{ item.projectTitleTh || '-' }}</div>
                  <small class="text-muted" v-if="item.projectTitleEn">{{ item.projectTitleEn }}</small>
                </td>
              </template>

              <template #fundingType="{ item }">
                <td>{{ item.fundingType || '-' }}</td>
              </template>

              <template #currentStatus="{ item }">
                <td>
                  <CBadge :color="getStatusBadgeColor(item.currentStatus)">
                    {{ getStatusLabel(item.currentStatus) }}
                  </CBadge>
                </td>
              </template>

              <template #currentRound="{ item }">
                <td>{{ item.currentRound ? `รอบ ${item.currentRound}` : '-' }}</td>
              </template>

              <template #updatedAt="{ item }">
                <td>{{ formatDate(item.updatedAt) }}</td>
              </template>

              <template #actions="{ item }">
                <td class="text-nowrap">
                  <div class="admin-actions">
                    <CButton color="primary" size="sm" class="admin-action-btn" @click="viewDetail(item)">ดูรายละเอียด</CButton>
                  </div>
                </td>
              </template>
            </CDataTable>

            <div class="d-flex justify-content-between align-items-center mt-3 flex-wrap" style="gap: 8px;">
              <small class="text-muted">หน้าที่ {{ page }} / {{ totalPages }}</small>
              <div>
                <CButton
                  size="sm"
                  color="secondary"
                  variant="outline"
                  class="mr-2"
                  :disabled="page <= 1 || loadingTable"
                  @click="onPageChange(page - 1)"
                >
                  ก่อนหน้า
                </CButton>
                <CButton
                  size="sm"
                  color="secondary"
                  variant="outline"
                  :disabled="page >= totalPages || loadingTable"
                  @click="onPageChange(page + 1)"
                >
                  ถัดไป
                </CButton>
              </div>
            </div>
          </div>
        </CCardBody>
      </CCard>
    </section>

    <CModal
      :show.sync="showStatusModal"
      :close-on-backdrop="false"
      centered
      size="lg"
      scrollable
      title="เปลี่ยนสถานะโครงการ"
    >
      <template #body-wrapper>
        <div v-if="selectedProposal" class="status-modal-body" style="padding: 20px 24px 8px; max-height: calc(100vh - 220px); overflow-y: auto;">
          <div class="status-modal-proposal">
            <div class="status-modal-meta"><strong>รหัสโครงการ:</strong> {{ selectedProposal.proposalCode || '-' }}</div>
            <div class="status-modal-meta"><strong>ชื่อโครงการ:</strong> {{ selectedProposal.projectTitleTh || '-' }}</div>
          </div>
          <div class="status-modal-current">
            <strong>สถานะปัจจุบัน:</strong>
            <CBadge :color="getStatusBadgeColor(selectedProposal.currentStatus)" class="ml-1">
              {{ getStatusLabel(selectedProposal.currentStatus) }}
            </CBadge>
          </div>

          <CSelect
            class="status-modal-select"
            label="เปลี่ยนสถานะเป็น"
            :value="newStatus"
            :options="nextStatusOptions"
            @change="onNewStatusChange"
          />

          <label class="status-modal-remark-label">หมายเหตุ / เหตุผล</label>
          <textarea
            v-model="statusRemark"
            class="form-control"
            rows="3"
            placeholder="ระบุหมายเหตุเพิ่มเติม (ไม่บังคับ)"
          />
        </div>
      </template>

      <template #footer-wrapper>
        <div class="status-modal-footer d-flex justify-content-end w-100" style="padding: 12px 24px 20px;">
          <CButton color="secondary" class="mr-2" @click="closeStatusModal">ยกเลิก</CButton>
          <CButton color="primary" :disabled="!newStatus || submittingStatus" @click="confirmChangeStatus">
            {{ submittingStatus ? 'กำลังบันทึก...' : 'ยืนยัน' }}
          </CButton>
        </div>
      </template>
    </CModal>

    <CModal
      :show.sync="showCommitteeModal"
      :close-on-backdrop="false"
      centered
      size="lg"
      scrollable
      title="มอบหมายกรรมการ"
    >
      <template #body-wrapper>
        <div v-if="selectedProposal" class="committee-modal-body" style="padding: 20px 24px 8px; max-height: calc(100vh - 220px); overflow-y: auto;">
          <div class="committee-modal-proposal">
            <div class="committee-modal-meta"><strong>รหัสโครงการ:</strong> {{ selectedProposal.proposalCode || '-' }}</div>
            <div class="committee-modal-meta"><strong>ชื่อโครงการ:</strong> {{ selectedProposal.projectTitleTh || '-' }}</div>
          </div>

          <div class="committee-selection-panel">
            <div class="mb-2"><strong>คณะกรรมการที่เลือก ({{ selectedCommitteeIds.length }}/3)</strong></div>
            <div class="committee-selection-summary">
            <span v-if="selectedCommitteeProfiles.length === 0" class="text-muted">ยังไม่ได้เลือกคณะกรรมการ</span>
            <span
              v-for="u in selectedCommitteeProfiles"
              :key="`sel-${u._id}`"
              class="badge badge-info mr-2 mb-2 p-2"
              style="font-weight: 500;"
            >
              {{ u.fullName || '-' }}
              <button
                type="button"
                class="btn btn-sm btn-link text-white p-0 ml-2"
                style="line-height: 1; text-decoration: none;"
                @click="removeSelectedCommittee(u._id)"
              >
                ×
              </button>
            </span>
          </div>
          </div>

          <div class="committee-filter-toolbar mb-3">
            <div class="mb-2"><strong>ตัวกรองกรรมการ</strong></div>
            <div class="d-flex flex-wrap align-items-center" style="gap: 8px;">
              <CButton
                size="sm"
                :color="committeeFilterMode === 'recommended' ? 'info' : 'secondary'"
                :variant="committeeFilterMode === 'recommended' ? undefined : 'outline'"
                :disabled="!hasRecommendedCommitteeUsers"
                @click="setCommitteeFilterMode('recommended')"
              >
                Recommended for this proposal
              </CButton>
              <CButton
                size="sm"
                :color="committeeFilterMode === 'all' ? 'info' : 'secondary'"
                :variant="committeeFilterMode === 'all' ? undefined : 'outline'"
                @click="setCommitteeFilterMode('all')"
              >
                All committees
              </CButton>
              <CButton
                size="sm"
                :color="committeeFilterMode === 'department' ? 'info' : 'secondary'"
                :variant="committeeFilterMode === 'department' ? undefined : 'outline'"
                @click="setCommitteeFilterMode('department')"
              >
                Filter by department
              </CButton>
            </div>
            <div class="mt-2">
              <CSelect
                label="Filter by department"
                :value="selectedCommitteeDepartment"
                :options="committeeDepartmentOptions"
                @change="onCommitteeDepartmentChange"
              />
            </div>
          </div>

          <CInput
            class="committee-search-field"
            label="ค้นหากรรมการ (ชื่อ, อีเมล, สังกัด)"
            v-model="committeeSearch"
            placeholder="พิมพ์เพื่อค้นหา..."
          />

          <div v-if="committeeUsersLoading" class="text-center py-2">
            <CSpinner size="sm" color="primary" />
            <small class="text-muted ml-2">กำลังโหลดรายชื่อคณะกรรมการ...</small>
          </div>
          <CAlert v-else-if="committeeUsersError" color="warning" show>
            ไม่สามารถโหลดรายชื่อคณะกรรมการได้: {{ committeeUsersError }}
          </CAlert>
          <div v-else class="committee-user-list">
            <div v-if="filteredCommitteeUsers.length === 0" class="text-muted py-2">ไม่พบรายชื่อกรรมการ</div>
            <label
              v-for="u in filteredCommitteeUsers"
              :key="u._id"
              class="committee-user-item d-flex align-items-start border rounded"
              :class="{ 'is-selected': isSelectedCommittee(u._id) }"
            >
              <input
                type="checkbox"
                class="committee-user-checkbox"
                :checked="isSelectedCommittee(u._id)"
                :disabled="!isSelectedCommittee(u._id) && selectedCommitteeIds.length >= 3"
                @change="toggleCommitteeSelection(u)"
              />
              <div class="committee-user-details">
                <div class="font-weight-bold">{{ u.fullName || '-' }}</div>
                <div class="small text-muted">{{ u.email || '-' }}</div>
                <div class="small text-muted">{{ u.department || '-' }}</div>
                <div v-if="u.isRecommended" class="small text-info font-weight-bold">แนะนำจากหน่วยงานโครงการ</div>
              </div>
            </label>
          </div>
          <small class="committee-modal-note text-muted">เลือกได้สูงสุด 3 คน</small>
        </div>
      </template>

      <template #footer-wrapper>
        <div class="committee-modal-footer d-flex justify-content-end w-100" style="padding: 12px 24px 20px;">
          <CButton color="secondary" class="mr-2" @click="closeCommitteeModal">ยกเลิก</CButton>
          <CButton color="success" :disabled="submittingCommittee || selectedCommitteeIds.length === 0" @click="confirmAssignCommittee">
            {{ submittingCommittee ? 'กำลังบันทึก...' : 'ยืนยัน' }}
          </CButton>
        </div>
      </template>
    </CModal>
  </div>
</template>

<script>
import Service, { instance as axios } from '@/service/api'
import Swal from 'sweetalert2'

const ALLOWED_TRANSITIONS = {
  submitted: ['faculty_review_pending'],
  faculty_approved: ['office_received'],
  office_received: ['document_checking'],
  document_checking: ['assigned_to_committee', 'revision_requested'],
  under_review: ['meeting_completed'],
  meeting_completed: ['approved', 'rejected', 'revision_requested'],
  revision_requested: ['resubmitted'],
  resubmitted: ['second_round_review'],
  second_round_review: ['approved', 'rejected', 'revision_requested'],
  approved: ['announced'],
  rejected: ['announced']
}

const STATUS_LABELS = {
  draft: 'แบบร่าง',
  submitted: 'ยื่นแล้ว',
  faculty_review_pending: 'รอประธานพิจารณา',
  faculty_approved: 'ประธานอนุมัติ',
  office_received: 'ส่วนบริหารรับแล้ว',
  document_checking: 'ตรวจสอบเอกสาร',
  assigned_to_committee: 'มอบหมายกรรมการแล้ว',
  under_review: 'กำลังพิจารณา',
  meeting_completed: 'ประชุมเสร็จแล้ว',
  revision_requested: 'ขอแก้ไข',
  resubmitted: 'ส่งแก้ไขแล้ว',
  second_round_review: 'พิจารณารอบ 2',
  approved: 'อนุมัติ',
  rejected: 'ปฏิเสธ',
  announced: 'ประกาศผลแล้ว'
}

const STATUS_COLORS = {
  draft: 'secondary',
  submitted: 'info',
  faculty_review_pending: 'warning',
  faculty_approved: 'primary',
  office_received: 'primary',
  document_checking: 'warning',
  assigned_to_committee: 'info',
  under_review: 'danger',
  meeting_completed: 'primary',
  revision_requested: 'danger',
  resubmitted: 'info',
  second_round_review: 'warning',
  approved: 'success',
  rejected: 'danger',
  announced: 'primary'
}

const SUMMARY_CARDS = {
  draft: { label: 'แบบร่าง', borderColor: 'secondary' },
  submitted: { label: 'ยื่นแล้ว', borderColor: 'info' },
  faculty_review_pending: { label: 'รอประธานพิจารณา', borderColor: 'warning' },
  document_checking: { label: 'ตรวจสอบเอกสาร', borderColor: 'warning' },
  assigned_to_committee: { label: 'มอบหมายกรรมการแล้ว', borderColor: 'info' },
  under_review: { label: 'กำลังพิจารณา', borderColor: 'danger' },
  revision_requested: { label: 'ขอแก้ไข', borderColor: 'danger' },
  approved: { label: 'อนุมัติ', borderColor: 'success' },
  rejected: { label: 'ปฏิเสธ', borderColor: 'danger' },
  announced: { label: 'ประกาศผลแล้ว', borderColor: 'primary' }
}

const STATUS_KEYS = [
  'draft',
  'submitted',
  'faculty_review_pending',
  'faculty_approved',
  'office_received',
  'document_checking',
  'assigned_to_committee',
  'under_review',
  'meeting_completed',
  'revision_requested',
  'resubmitted',
  'second_round_review',
  'approved',
  'rejected',
  'announced'
]

export default {
  name: 'AdminDashboard',
  data () {
    return {
      summary: {},
      proposals: [],
      total: 0,
      page: 1,
      totalPages: 1,
      loadingSummary: false,
      loadingTable: false,
      searchKeyword: '',
      selectedStatus: '',
      selectedYear: '',
      searchTimer: null,
      limit: 10,

      showStatusModal: false,
      selectedProposal: null,
      newStatus: '',
      statusRemark: '',
      submittingStatus: false,

      showCommitteeModal: false,
      submittingCommittee: false,
      committeeUsersLoading: false,
      committeeUsersError: null,
      committeeUsers: [],
      committeeSearch: '',
      selectedCommitteeIds: [],
      committeeFilterMode: 'all',
      selectedCommitteeDepartment: '',
      committeeDepartments: [],
      proposalDepartmentHint: '',

      tableFields: [
        { key: 'index', label: '#' },
        { key: 'proposalCode', label: 'Proposal Code' },
        { key: 'projectTitleTh', label: 'ชื่อโครงการ (TH)' },
        { key: 'fundingType', label: 'ประเภททุน' },
        { key: 'currentStatus', label: 'สถานะ' },
        { key: 'currentRound', label: 'รอบ' },
        { key: 'updatedAt', label: 'อัปเดต' },
        { key: 'actions', label: 'การดำเนินการ', _classes: 'text-center text-nowrap' }
      ]
    }
  },
  computed: {
    summaryRow1 () {
      return ['draft', 'submitted', 'faculty_review_pending', 'document_checking'].map(this.toSummaryCard)
    },
    summaryRow2 () {
      return ['assigned_to_committee', 'under_review', 'revision_requested', 'approved'].map(this.toSummaryCard)
    },
    summaryRow3 () {
      return ['rejected', 'announced'].map(this.toSummaryCard)
    },
    statusFilterOptions () {
      return [
        { value: '', label: 'ทั้งหมด' },
        ...STATUS_KEYS.map(status => ({ value: status, label: this.getStatusLabel(status) }))
      ]
    },
    yearFilterOptions () {
      return [
        { value: '', label: 'ทุกปีงบประมาณ' },
        { value: 2023, label: '2023' },
        { value: 2024, label: '2024' },
        { value: 2025, label: '2025' },
        { value: 2026, label: '2026' }
      ]
    },
    tableItems () {
      return this.proposals.map((proposal, idx) => ({
        ...proposal,
        index: (this.page - 1) * this.limit + idx + 1
      }))
    },
    nextStatusOptions () {
      const statuses = this.selectedProposal ? this.getNextStatuses(this.selectedProposal.currentStatus) : []
      if (!statuses.length) return [{ value: '', label: 'ไม่มีสถานะถัดไปที่อนุญาต' }]
      return [{ value: '', label: 'เลือกสถานะ' }, ...statuses.map(s => ({ value: s, label: this.getStatusLabel(s) }))]
    },
    filteredCommitteeUsers () {
      let scopedUsers = this.committeeUsers || []

      if (this.committeeFilterMode === 'recommended') {
        scopedUsers = scopedUsers.filter(u => Boolean(u && u.isRecommended))
      } else if (this.committeeFilterMode === 'department') {
        const selected = String(this.selectedCommitteeDepartment || '').trim().toLowerCase()
        if (selected) {
          scopedUsers = scopedUsers.filter(u => String(u && u.department ? u.department : '').trim().toLowerCase() === selected)
        }
      }

      const q = String(this.committeeSearch || '').trim().toLowerCase()
      if (!q) return scopedUsers
      return scopedUsers.filter(u => {
        const text = [u.fullName, u.email, u.department].filter(Boolean).join(' ').toLowerCase()
        return text.includes(q)
      })
    },
    committeeDepartmentOptions () {
      const options = [{ value: '', label: 'ทุกหน่วยงาน' }]
      ;(this.committeeDepartments || []).forEach(dep => {
        if (dep) options.push({ value: dep, label: dep })
      })
      return options
    },
    hasRecommendedCommitteeUsers () {
      return (this.committeeUsers || []).some(u => Boolean(u && u.isRecommended))
    },
    selectedCommitteeProfiles () {
      const byId = new Map((this.committeeUsers || []).map(u => [String(u._id), u]))
      return (this.selectedCommitteeIds || [])
        .map(id => byId.get(String(id)))
        .filter(Boolean)
    }
  },
  mounted () {
    this.fetchSummary()
    this.fetchProposals()
  },
  beforeDestroy () {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
    }
  },
  methods: {
    hasAssignedCommittee (proposal) {
      return Array.isArray(proposal && proposal.committeeIds) && proposal.committeeIds.length > 0
    },
    isSelectedCommittee (id) {
      const key = String(id)
      return (this.selectedCommitteeIds || []).map(String).includes(key)
    },
    toggleCommitteeSelection (user) {
      const key = String(user && user._id ? user._id : '')
      if (!key) return
      const current = (this.selectedCommitteeIds || []).map(String)
      const idx = current.indexOf(key)
      if (idx >= 0) {
        current.splice(idx, 1)
      } else {
        if (current.length >= 3) return
        current.push(key)
      }
      this.selectedCommitteeIds = current
    },
    removeSelectedCommittee (id) {
      const key = String(id)
      this.selectedCommitteeIds = (this.selectedCommitteeIds || []).map(String).filter(x => x !== key)
    },
    setCommitteeFilterMode (mode) {
      this.committeeFilterMode = mode
      if (mode === 'department' && !this.selectedCommitteeDepartment) {
        this.selectedCommitteeDepartment = this.proposalDepartmentHint || ''
      }
    },
    onCommitteeDepartmentChange (val) {
      this.selectedCommitteeDepartment = this.getSelectValue(val)
      this.committeeFilterMode = this.selectedCommitteeDepartment ? 'department' : 'all'
    },
    async fetchCommitteeUsers () {
      this.committeeUsersLoading = true
      this.committeeUsersError = null
      try {
        const proposalId = this.selectedProposal && this.selectedProposal._id ? String(this.selectedProposal._id) : ''
        const res = await Service.proposal.getCommitteeUsers({ limit: 200, proposalId })
        const payload = res && res.data ? res.data : null
        if (Array.isArray(payload)) this.committeeUsers = payload
        else if (payload && Array.isArray(payload.data)) this.committeeUsers = payload.data
        else this.committeeUsers = []

        this.committeeDepartments = []
        this.proposalDepartmentHint = ''

        if (payload && payload.data && !Array.isArray(payload.data)) {
          const wrapped = payload.data
          this.committeeUsers = Array.isArray(wrapped.items) ? wrapped.items : []
          this.committeeDepartments = Array.isArray(wrapped.departments) ? wrapped.departments : []
          this.proposalDepartmentHint = String(wrapped.proposalDepartment || '').trim()
        }

        if (!this.committeeDepartments.length) {
          const dedup = Array.from(new Set((this.committeeUsers || []).map(u => String(u && u.department ? u.department : '').trim()).filter(Boolean)))
          this.committeeDepartments = dedup.sort((a, b) => a.localeCompare(b, 'th'))
        }

        if (this.hasRecommendedCommitteeUsers) {
          this.committeeFilterMode = 'recommended'
        } else {
          this.committeeFilterMode = 'all'
        }
        this.selectedCommitteeDepartment = this.proposalDepartmentHint || ''
      } catch (err) {
        this.committeeUsers = []
        this.committeeDepartments = []
        this.proposalDepartmentHint = ''
        this.committeeFilterMode = 'all'
        this.selectedCommitteeDepartment = ''
        this.committeeUsersError = (err && err.response && err.response.data && err.response.data.message)
          || err.message
          || 'Unknown error'
      } finally {
        this.committeeUsersLoading = false
      }
    },
    toSummaryCard (status) {
      return { status, ...SUMMARY_CARDS[status] }
    },
    getStatusLabel (status) {
      return STATUS_LABELS[status] || status || '-'
    },
    getStatusBadgeColor (status) {
      return STATUS_COLORS[status] || 'secondary'
    },
    getNextStatuses (currentStatus) {
      return ALLOWED_TRANSITIONS[currentStatus] || []
    },
    getSelectValue (val) {
      return val && val.target ? val.target.value : val
    },
    formatDate (value) {
      if (!value) return '-'
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return '-'
      return d.toLocaleString('th-TH')
    },
    async fetchSummary () {
      this.loadingSummary = true
      try {
        const response = await axios.get('/api/v1/proposals/admin/dashboard-summary')
        this.summary = (response && response.data && response.data.data) || {}
      } catch (error) {
        console.error('[AdminDashboard] Error fetching summary:', error)
        this.summary = {}
        await Swal.fire({ icon: 'error', title: 'โหลดสรุปไม่สำเร็จ', text: 'ไม่สามารถโหลดข้อมูล summary ได้' })
      } finally {
        this.loadingSummary = false
      }
    },
    async fetchProposals () {
      this.loadingTable = true
      try {
        const params = {
          page: this.page,
          limit: this.limit
        }
        if (this.searchKeyword) params.keyword = this.searchKeyword
        if (this.selectedStatus) params.status = this.selectedStatus
        if (this.selectedYear) params.fiscalYear = this.selectedYear

        const response = await axios.get('/api/v1/proposals', { params })
        const payload = (response && response.data && response.data.data) || {}

        const list = Array.isArray(payload.proposals)
          ? payload.proposals
          : (Array.isArray(payload.data) ? payload.data : [])

        this.proposals = list
        this.total = Number(payload.total) || list.length
        this.page = Number(payload.page) || this.page
        this.totalPages = Number(payload.totalPages) || Math.max(1, Math.ceil(this.total / this.limit))
      } catch (error) {
        console.error('[AdminDashboard] Error fetching proposals:', error)
        this.proposals = []
        this.total = 0
        this.totalPages = 1
        await Swal.fire({ icon: 'error', title: 'โหลดรายการไม่สำเร็จ', text: 'ไม่สามารถดึงรายการโครงการได้' })
      } finally {
        this.loadingTable = false
      }
    },
    onCardClick (status) {
      this.selectedStatus = status
      this.page = 1
      this.fetchProposals()
      this.$nextTick(() => {
        if (this.$refs.tableSection && this.$refs.tableSection.scrollIntoView) {
          this.$refs.tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    },
    onSearch () {
      if (this.searchTimer) clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => {
        this.page = 1
        this.fetchProposals()
      }, 500)
    },
    onStatusChange (val) {
      this.selectedStatus = this.getSelectValue(val)
      this.page = 1
      this.fetchProposals()
    },
    onYearChange (val) {
      this.selectedYear = this.getSelectValue(val)
      this.page = 1
      this.fetchProposals()
    },
    onReset () {
      this.searchKeyword = ''
      this.selectedStatus = ''
      this.selectedYear = ''
      this.page = 1
      this.fetchProposals()
    },
    onPageChange (p) {
      if (p < 1 || p > this.totalPages) return
      this.page = p
      this.fetchProposals()
    },
    viewDetail (proposal) {
      this.$router.push({
        path: '/research-form',
        query: {
          id: proposal._id,
          readOnly: 'true',
          mode: 'admin-view',
          scrollReviews: '1'
        }
      })
    },
    openStatusModal (proposal) {
      this.selectedProposal = proposal
      this.newStatus = ''
      this.statusRemark = ''
      this.showStatusModal = true
    },
    closeStatusModal () {
      this.showStatusModal = false
      this.selectedProposal = null
      this.newStatus = ''
      this.statusRemark = ''
    },
    onNewStatusChange (val) {
      this.newStatus = this.getSelectValue(val)
    },
    async confirmChangeStatus () {
      console.log('=== confirmChangeStatus ===')
      console.log('proposalId:', this.selectedProposal ? this.selectedProposal._id : null)
      console.log('toStatus:', this.newStatus)
      console.log('remark:', this.statusRemark)
      console.log('token:', localStorage.getItem('auth_token') ? 'exists' : 'MISSING')

      if (!this.newStatus) {
        await Swal.fire('กรุณาเลือกสถานะ', '', 'warning')
        return
      }

      if (!this.selectedProposal || !this.selectedProposal._id) {
        await Swal.fire('เปลี่ยนสถานะไม่สำเร็จ', 'ไม่พบรหัสโครงการ', 'error')
        return
      }

      this.submittingStatus = true
      try {
        const id = this.selectedProposal._id
        const res = await Service.proposal.changeStatus(id, {
          toStatus: this.newStatus,
          remark: this.statusRemark || ''
        })

        if (res && res.data && res.data.success) {
          this.showStatusModal = false
          this.newStatus = ''
          this.statusRemark = ''
          await this.fetchSummary()
          await this.fetchProposals()
          await Swal.fire({
            icon: 'success',
            title: 'เปลี่ยนสถานะสำเร็จ',
            timer: 1500,
            showConfirmButton: false
          })
        }
      } catch (err) {
        console.error('changeStatus error:', (err && err.response && err.response.data) || (err && err.message) || err)
        const msg = (err && err.response && err.response.data && err.response.data.message) || 'กรุณาลองใหม่อีกครั้ง'
        await Swal.fire('เปลี่ยนสถานะไม่สำเร็จ', msg, 'error')
      } finally {
        this.submittingStatus = false
      }
    },
    openCommitteeModal (proposal) {
      this.selectedProposal = proposal
      this.committeeSearch = ''
      this.committeeFilterMode = 'all'
      this.selectedCommitteeDepartment = ''
      this.committeeDepartments = []
      this.proposalDepartmentHint = ''
      const ids = Array.isArray(proposal && proposal.committeeIds) ? proposal.committeeIds : []
      this.selectedCommitteeIds = ids.map(String).slice(0, 3)
      this.showCommitteeModal = true
      this.fetchCommitteeUsers()
    },
    closeCommitteeModal () {
      this.showCommitteeModal = false
      this.selectedProposal = null
      this.committeeSearch = ''
      this.committeeFilterMode = 'all'
      this.selectedCommitteeDepartment = ''
      this.committeeDepartments = []
      this.proposalDepartmentHint = ''
      this.selectedCommitteeIds = []
    },
    async confirmAssignCommittee () {
      if (!this.selectedProposal || !this.selectedProposal._id) {
        await Swal.fire('ไม่สำเร็จ', 'ไม่พบรหัสโครงการ', 'error')
        return
      }

      if (!this.selectedCommitteeIds.length) {
        await Swal.fire('กรุณาเลือกคณะกรรมการ', '', 'warning')
        return
      }

      if (this.selectedCommitteeIds.length > 3) {
        await Swal.fire('เลือกได้สูงสุด 3 คน', '', 'warning')
        return
      }

      this.submittingCommittee = true
      try {
        const id = this.selectedProposal._id
        const committeeIds = (this.selectedCommitteeIds || []).map(String)

        const res = await Service.proposal.assignCommittee(id, { committeeIds })

        if (res && res.data && res.data.success) {
          this.showCommitteeModal = false
          this.committeeSearch = ''
          this.selectedCommitteeIds = []
          await this.fetchProposals()
          await Swal.fire({
            icon: 'success',
            title: 'Assign กรรมการสำเร็จ',
            timer: 1500,
            showConfirmButton: false
          })
        }
      } catch (err) {
        console.error('assignCommittee error:', (err && err.response && err.response.data) || (err && err.message) || err)
        await Swal.fire('ไม่สำเร็จ', (err && err.response && err.response.data && err.response.data.message) || 'ลองใหม่', 'error')
      } finally {
        this.submittingCommittee = false
      }
    },
    openMeetingManage (proposal) {
      const p = proposal || {}
      const projectTitle = p.projectTitleTh || p.projectTitleEn || p.projectTitle || ''
      const proposalId = p._id || p.proposalId || ''
      this.$router.push({
        path: '/admin/meetings',
        query: {
          fromProposalId: proposalId,
          fromProjectTitle: projectTitle
        }
      })
    }
  }
}
</script>

<style scoped>
.summary-card {
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-left-width: 5px;
  border-radius: 8px;
  padding: 14px 16px;
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.summary-card.active {
  box-shadow: 0 0 0 2px rgba(50, 31, 219, 0.15);
}

.summary-card-small {
  padding-top: 12px;
  padding-bottom: 12px;
}

.summary-number {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.1;
}

.admin-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.admin-action-btn {
  white-space: nowrap;
}

.admin-action-btn-committee {
  display: inline-flex;
  justify-content: center;
  min-width: 140px;
}

.committee-modal-body {
  padding: 1.25rem 1.5rem 0.5rem;
}

.committee-modal-proposal {
  margin-bottom: 1.25rem;
}

.committee-modal-meta {
  margin-bottom: 0.75rem;
  line-height: 1.7;
}

.committee-modal-meta:last-child {
  margin-bottom: 0;
}

.committee-selection-panel {
  margin-bottom: 1.25rem;
}

.committee-selection-summary {
  margin-top: 0.5rem;
  padding: 0.9rem 1rem 0.25rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.75rem;
}

.committee-search-field {
  margin-bottom: 1rem;
}

.committee-user-list {
  margin-top: 1rem;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.committee-user-item {
  gap: 0.875rem;
  padding: 0.95rem 1rem;
  margin-bottom: 0.75rem;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.committee-user-item:hover {
  background: #fafbfc;
  border-color: #d5dbe1;
}

.committee-user-item.is-selected {
  background: #f3f6ff;
  border-color: #c9d4ff;
}

.committee-user-checkbox {
  margin-top: 0.35rem;
  flex-shrink: 0;
}

.committee-user-details {
  line-height: 1.6;
}

.committee-modal-note {
  display: block;
  margin-top: 0.75rem;
}

.committee-modal-footer {
  padding: 0.75rem 1.5rem 1.25rem;
}

.status-modal-body {
  padding: 1.25rem 1.5rem 0.5rem;
}

.status-modal-footer {
  padding: 0.75rem 1.5rem 1.25rem;
}

.status-modal-proposal {
  margin-bottom: 1rem;
}

.status-modal-meta {
  margin-bottom: 0.6rem;
  line-height: 1.7;
}

.status-modal-meta:last-child {
  margin-bottom: 0;
}

.status-modal-current {
  margin-bottom: 1.1rem;
}

.status-modal-select {
  margin-bottom: 0.9rem;
}

.status-modal-remark-label {
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
}
</style>
