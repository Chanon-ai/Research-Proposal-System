<template>
  <div class="admin-proposal-list">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">จัดการโครงการ (Admin)</h2>
    </div>

    <CCard class="mb-3 admin-proposal-list__filter-card">
      <CCardBody class="admin-proposal-list__filter-body">
        <CRow>
          <CCol md="5" class="mb-2 mb-md-0">
            <CInput
              v-model="filters.keyword"
              placeholder="ค้นหาชื่อโครงการ หรือ รหัส..."
            />
          </CCol>
          <CCol md="3" class="mb-2 mb-md-0">
            <CSelect
              :value="filters.status"
              :options="statusFilterOptions"
              @change="onStatusChange"
            />
          </CCol>
          <CCol md="2" class="mb-2 mb-md-0">
            <CSelect
              :value="filters.fiscalYear"
              :options="fiscalYearOptions"
              @change="onFiscalYearChange"
            />
          </CCol>
          <CCol md="2" class="text-md-right">
            <CButton color="secondary" variant="outline" block @click="resetFilters">รีเซ็ต</CButton>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <CCard class="admin-proposal-list__table-card">
      <CCardHeader class="admin-proposal-list__table-header">
        <div class="d-flex justify-content-between align-items-center flex-wrap" style="gap: 8px;">
          <strong>รายการโครงการ</strong>
          <small class="text-muted">แสดง {{ displayFrom }}-{{ displayTo }} จาก {{ total }} รายการ</small>
        </div>
      </CCardHeader>
      <CCardBody class="admin-proposal-list__table-body">
        <div v-if="loading" class="text-center py-5">
          <CSpinner color="primary" />
          <div class="mt-2 text-muted">กำลังโหลดข้อมูล...</div>
        </div>

        <div v-else>
          <div class="admin-proposal-list__table-surface">
            <CDataTable
              :items="tableItems"
              :fields="fields"
              hover
              striped
              bordered
              small
              :items-per-page="limit"
              :no-items-view="{ noResults: 'ไม่พบข้อมูล', noItems: 'ยังไม่มีรายการโครงการ' }"
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

              <template #currentStatus="{ item }">
                <td>
                  <CBadge :color="getStatusColor(item.currentStatus)">
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
                  <CButton color="primary" size="sm" class="mr-1 admin-proposal-action-btn" @click="onView(item)">View</CButton>
                </td>
              </template>
            </CDataTable>
          </div>

          <div class="d-flex justify-content-between align-items-center mt-3 flex-wrap admin-proposal-list__pager" style="gap: 8px;">
            <small class="text-muted">หน้าที่ {{ page }} / {{ totalPages }}</small>
            <div>
              <CButton
                size="sm"
                color="secondary"
                variant="outline"
                class="mr-2"
                :disabled="page <= 1 || loading"
                @click="changePage(page - 1)"
              >
                ก่อนหน้า
              </CButton>
              <CButton
                size="sm"
                color="secondary"
                variant="outline"
                :disabled="page >= totalPages || loading"
                @click="changePage(page + 1)"
              >
                ถัดไป
              </CButton>
            </div>
          </div>
        </div>
      </CCardBody>
    </CCard>

    <CModal
      :show.sync="showStatusModal"
      :close-on-backdrop="false"
      centered
      title="เปลี่ยนสถานะโครงการ"
    >
      <template #body-wrapper>
        <div v-if="selectedProposal">
          <div class="mb-2"><strong>รหัสโครงการ:</strong> {{ selectedProposal.proposalCode || '-' }}</div>
          <div class="mb-2"><strong>ชื่อโครงการ:</strong> {{ selectedProposal.projectTitleTh || '-' }}</div>
          <div class="mb-3">
            <strong>สถานะปัจจุบัน:</strong>
            <CBadge :color="getStatusColor(selectedProposal.currentStatus)" class="ml-1">
              {{ getStatusLabel(selectedProposal.currentStatus) }}
            </CBadge>
          </div>

          <CSelect
            label="เปลี่ยนสถานะเป็น"
            :value="statusForm.toStatus"
            :options="nextStatusOptions"
            @change="onToStatusChange"
          />

          <label class="mt-2">หมายเหตุ / เหตุผล (ไม่บังคับ)</label>
          <textarea
            v-model="statusForm.remark"
            class="form-control"
            rows="3"
            placeholder="ระบุหมายเหตุเพิ่มเติม"
          />
        </div>
      </template>

      <template #footer-wrapper>
        <div class="d-flex justify-content-end w-100">
          <CButton color="secondary" class="mr-2" @click="closeStatusModal">ยกเลิก</CButton>
          <CButton
            color="primary"
            :disabled="!statusForm.toStatus || submittingStatus"
            @click="confirmChangeStatus"
          >
            {{ submittingStatus ? 'กำลังบันทึก...' : 'ยืนยัน' }}
          </CButton>
        </div>
      </template>
    </CModal>

    <CModal
      :show.sync="showCommitteeModal"
      :close-on-backdrop="false"
      centered
      title="มอบหมายกรรมการ"
    >
      <template #body-wrapper>
        <div v-if="selectedProposal">
          <div class="mb-2"><strong>รหัสโครงการ:</strong> {{ selectedProposal.proposalCode || '-' }}</div>
          <div class="mb-3"><strong>ชื่อโครงการ:</strong> {{ selectedProposal.projectTitleTh || '-' }}</div>

          <CInput
            label="กรอก Committee IDs (comma separated)"
            v-model="committeeForm.committeeIdsText"
            placeholder="เช่น 65fa..., 65fb..., 65fc..."
          />
        </div>
      </template>

      <template #footer-wrapper>
        <div class="d-flex justify-content-end w-100">
          <CButton color="secondary" class="mr-2" @click="closeCommitteeModal">ยกเลิก</CButton>
          <CButton
            color="success"
            :disabled="submittingCommittee"
            @click="confirmAssignCommittee"
          >
            {{ submittingCommittee ? 'กำลังบันทึก...' : 'ยืนยัน' }}
          </CButton>
        </div>
      </template>
    </CModal>
  </div>
</template>

<script>
import { instance as axios } from '@/service/api'
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
  pending_confirm: 'รอการยืนยัน',
  submitted: 'ยื่นแล้ว',
  faculty_review_pending: 'รอประธานพิจารณา',
  faculty_approved: 'ประธานอนุมัติ',
  office_received: 'ส่วนบริหารรับแล้ว',
  document_checking: 'ตรวจสอบเอกสาร',
  assigned_to_committee: 'มอบหมายกรรมการแล้ว',
  under_review: 'กรรมการได้ให้ความเห็นแล้ว',
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
  pending_confirm: 'secondary',
  submitted: 'info',
  faculty_review_pending: 'warning',
  faculty_approved: 'primary',
  office_received: 'primary',
  document_checking: 'warning',
  assigned_to_committee: 'info',
  under_review: 'warning',
  meeting_completed: 'primary',
  revision_requested: 'danger',
  resubmitted: 'info',
  second_round_review: 'warning',
  approved: 'success',
  rejected: 'danger',
  announced: 'success'
}

const STATUS_KEYS = [
  'draft',
  'pending_confirm',
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
  name: 'AdminProposalList',
  data () {
    return {
      fields: [
        { key: 'index', label: '#' },
        { key: 'proposalCode', label: 'Proposal Code' },
        { key: 'projectTitleTh', label: 'ชื่อโครงการ (TH)' },
        { key: 'fiscalYear', label: 'ปีงบ' },
        { key: 'fundingType', label: 'ประเภททุน' },
        { key: 'currentStatus', label: 'สถานะ' },
        { key: 'currentRound', label: 'รอบ' },
        { key: 'updatedAt', label: 'อัปเดต' },
        { key: 'actions', label: 'Actions', _classes: 'text-center text-nowrap' }
      ],
      proposals: [],
      loading: false,
      page: 1,
      total: 0,
      totalPages: 1,
      limit: 10,
      filters: {
        keyword: '',
        status: '',
        fiscalYear: ''
      },
      searchDebounceTimer: null,

      showStatusModal: false,
      submittingStatus: false,

      showCommitteeModal: false,
      submittingCommittee: false,

      selectedProposal: null,
      statusForm: {
        toStatus: '',
        remark: ''
      },
      committeeForm: {
        committeeIdsText: ''
      }
    }
  },
  computed: {
    tableItems () {
      return this.proposals.map((item, idx) => ({
        ...item,
        index: (this.page - 1) * this.limit + idx + 1
      }))
    },
    displayFrom () {
      if (this.total === 0) return 0
      return (this.page - 1) * this.limit + 1
    },
    displayTo () {
      if (this.total === 0) return 0
      return Math.min(this.page * this.limit, this.total)
    },
    statusFilterOptions () {
      return [
        { value: '', label: 'ทั้งหมด' },
        ...STATUS_KEYS.map(status => ({ value: status, label: this.getStatusLabel(status) }))
      ]
    },
    fiscalYearOptions () {
      return [
        { value: '', label: 'ทุกปีงบประมาณ' },
        { value: 2023, label: '2023' },
        { value: 2024, label: '2024' },
        { value: 2025, label: '2025' },
        { value: 2026, label: '2026' }
      ]
    },
    nextStatusOptions () {
      const currentStatus = this.selectedProposal && this.selectedProposal.currentStatus
      const nextStatuses = currentStatus ? (ALLOWED_TRANSITIONS[currentStatus] || []) : []
      if (nextStatuses.length === 0) {
        return [{ value: '', label: 'ไม่มีสถานะถัดไปที่อนุญาต' }]
      }
      return [{ value: '', label: 'เลือกสถานะ' }, ...nextStatuses.map(s => ({ value: s, label: this.getStatusLabel(s) }))]
    }
  },
  watch: {
    'filters.keyword' () {
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer)
      }
      this.searchDebounceTimer = setTimeout(() => {
        this.page = 1
        this.fetchProposals()
      }, 500)
    }
  },
  mounted () {
    this.fetchProposals()
  },
  beforeDestroy () {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer)
    }
  },
  methods: {
    hasAssignedCommittee (proposal) {
      return Array.isArray(proposal && proposal.committeeIds) && proposal.committeeIds.length > 0
    },
    async fetchProposals () {
      this.loading = true
      try {
        const params = {
          page: this.page,
          limit: this.limit
        }
        if (this.filters.keyword) params.keyword = this.filters.keyword
        if (this.filters.status) params.status = this.filters.status
        if (this.filters.fiscalYear) params.fiscalYear = this.filters.fiscalYear

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
        console.error('[AdminProposalList] Error fetching proposals:', error)
        this.proposals = []
        this.total = 0
        this.totalPages = 1
        await Swal.fire({
          icon: 'error',
          title: 'โหลดข้อมูลไม่สำเร็จ',
          text: 'ไม่สามารถดึงรายการโครงการได้ กรุณาลองใหม่อีกครั้ง'
        })
      } finally {
        this.loading = false
      }
    },
    onStatusChange (val) {
      this.filters.status = val && val.target ? val.target.value : val
      this.page = 1
      this.fetchProposals()
    },
    onFiscalYearChange (val) {
      this.filters.fiscalYear = val && val.target ? val.target.value : val
      this.page = 1
      this.fetchProposals()
    },
    resetFilters () {
      this.filters.keyword = ''
      this.filters.status = ''
      this.filters.fiscalYear = ''
      this.page = 1
      this.fetchProposals()
    },
    changePage (nextPage) {
      if (nextPage < 1 || nextPage > this.totalPages) return
      this.page = nextPage
      this.fetchProposals()
    },
    getStatusLabel (status) {
      return STATUS_LABELS[status] || status || '-'
    },
    getStatusColor (status) {
      return STATUS_COLORS[status] || 'secondary'
    },
    formatDate (value) {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '-'
      return date.toLocaleString('th-TH')
    },
    onView (item) {
      this.$router.push({
        path: '/research-form',
        query: {
          id: item._id,
          readOnly: 'true',
          mode: 'admin-view',
          scrollReviews: '1'
        }
      })
    },
    openStatusModal (item) {
      this.selectedProposal = item
      this.statusForm.toStatus = ''
      this.statusForm.remark = ''
      this.showStatusModal = true
    },
    closeStatusModal () {
      this.showStatusModal = false
      this.selectedProposal = null
      this.statusForm.toStatus = ''
      this.statusForm.remark = ''
    },
    onToStatusChange (val) {
      this.statusForm.toStatus = val && val.target ? val.target.value : val
    },
    async confirmChangeStatus () {
      if (!this.selectedProposal || !this.statusForm.toStatus) return
      this.submittingStatus = true
      try {
        await axios.patch(`/api/v1/proposals/${this.selectedProposal._id}/status`, {
          toStatus: this.statusForm.toStatus,
          remark: this.statusForm.remark || ''
        })
        this.closeStatusModal()
        await this.fetchProposals()
        await Swal.fire({
          icon: 'success',
          title: 'เปลี่ยนสถานะสำเร็จ',
          timer: 1600,
          showConfirmButton: false
        })
      } catch (error) {
        console.error('[AdminProposalList] Error changing status:', error)
        await Swal.fire({
          icon: 'error',
          title: 'เปลี่ยนสถานะไม่สำเร็จ',
          text: (error && error.response && error.response.data && error.response.data.message) || 'กรุณาตรวจสอบข้อมูลแล้วลองใหม่อีกครั้ง'
        })
      } finally {
        this.submittingStatus = false
      }
    },
    openCommitteeModal (item) {
      this.selectedProposal = item
      this.committeeForm.committeeIdsText = (item.committeeIds || []).join(', ')
      this.showCommitteeModal = true
    },
    closeCommitteeModal () {
      this.showCommitteeModal = false
      this.selectedProposal = null
      this.committeeForm.committeeIdsText = ''
    },
    async confirmAssignCommittee () {
      if (!this.selectedProposal) return
      this.submittingCommittee = true
      try {
        const committeeIds = (this.committeeForm.committeeIdsText || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)

        await axios.post(`/api/v1/proposals/${this.selectedProposal._id}/assign-committee`, {
          committeeIds
        })

        this.closeCommitteeModal()
        await this.fetchProposals()
        await Swal.fire({
          icon: 'success',
          title: 'มอบหมายกรรมการสำเร็จ',
          timer: 1600,
          showConfirmButton: false
        })
      } catch (error) {
        console.error('[AdminProposalList] Error assigning committee:', error)
        await Swal.fire({
          icon: 'error',
          title: 'มอบหมายกรรมการไม่สำเร็จ',
          text: (error && error.response && error.response.data && error.response.data.message) || 'กรุณาตรวจสอบข้อมูลแล้วลองใหม่อีกครั้ง'
        })
      } finally {
        this.submittingCommittee = false
      }
    }
  }
}
</script>

<style scoped>
.admin-proposal-list {
  width: 100%;
}

[data-coreui-theme='dark'] .admin-proposal-list,
body.c-dark-theme .admin-proposal-list {
  color: #e5e7eb;
}

[data-coreui-theme='dark'] .admin-proposal-list h2,
body.c-dark-theme .admin-proposal-list h2 {
  color: #f8fafc;
}

[data-coreui-theme='dark'] .admin-proposal-list .text-muted,
body.c-dark-theme .admin-proposal-list .text-muted {
  color: #9ca3af !important;
}

[data-coreui-theme='dark'] .admin-proposal-list__filter-card,
body.c-dark-theme .admin-proposal-list__filter-card,
[data-coreui-theme='dark'] .admin-proposal-list__table-card,
body.c-dark-theme .admin-proposal-list__table-card {
  background: transparent;
  border-color: rgba(148, 163, 184, 0.3);
}

[data-coreui-theme='dark'] .admin-proposal-list__filter-body,
body.c-dark-theme .admin-proposal-list__filter-body,
[data-coreui-theme='dark'] .admin-proposal-list__table-body,
body.c-dark-theme .admin-proposal-list__table-body {
  background: #0f172a;
}

[data-coreui-theme='dark'] .admin-proposal-list__table-header,
body.c-dark-theme .admin-proposal-list__table-header {
  background: linear-gradient(90deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.95));
  border-bottom-color: rgba(148, 163, 184, 0.3);
  color: #f8fafc;
}

[data-coreui-theme='dark'] .admin-proposal-list::v-deep .form-control,
body.c-dark-theme .admin-proposal-list::v-deep .form-control,
[data-coreui-theme='dark'] .admin-proposal-list::v-deep .custom-select,
body.c-dark-theme .admin-proposal-list::v-deep .custom-select {
  background: #111827;
  border-color: rgba(148, 163, 184, 0.45);
  color: #e5e7eb;
}

[data-coreui-theme='dark'] .admin-proposal-list::v-deep .form-control::placeholder,
body.c-dark-theme .admin-proposal-list::v-deep .form-control::placeholder {
  color: #94a3b8;
}

[data-coreui-theme='dark'] .admin-proposal-list::v-deep select option,
body.c-dark-theme .admin-proposal-list::v-deep select option {
  background: #111827;
  color: #e5e7eb;
}

[data-coreui-theme='dark'] .admin-proposal-list__table-surface,
body.c-dark-theme .admin-proposal-list__table-surface {
  background: #111827;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 10px;
  overflow: hidden;
}

[data-coreui-theme='dark'] .admin-proposal-list__table-surface::v-deep .table,
body.c-dark-theme .admin-proposal-list__table-surface::v-deep .table {
  margin-bottom: 0;
}

[data-coreui-theme='dark'] .admin-proposal-list__table-surface::v-deep .table thead th,
body.c-dark-theme .admin-proposal-list__table-surface::v-deep .table thead th {
  background: linear-gradient(90deg, #1f2937, #111827) !important;
  color: #f9fafb !important;
  border-color: rgba(148, 163, 184, 0.35) !important;
}

[data-coreui-theme='dark'] .admin-proposal-list__table-surface::v-deep .table tbody td,
body.c-dark-theme .admin-proposal-list__table-surface::v-deep .table tbody td {
  background: #111827;
  color: #e5e7eb;
  border-color: rgba(148, 163, 184, 0.24) !important;
}

[data-coreui-theme='dark'] .admin-proposal-list__table-surface::v-deep .table-striped tbody tr:nth-of-type(odd),
body.c-dark-theme .admin-proposal-list__table-surface::v-deep .table-striped tbody tr:nth-of-type(odd) {
  background-color: #0f172a;
}

[data-coreui-theme='dark'] .admin-proposal-list__table-surface::v-deep .table tbody tr:hover,
body.c-dark-theme .admin-proposal-list__table-surface::v-deep .table tbody tr:hover {
  background: rgba(51, 65, 85, 0.75) !important;
}

[data-coreui-theme='dark'] .admin-proposal-list__table-surface::v-deep .small,
body.c-dark-theme .admin-proposal-list__table-surface::v-deep .small {
  color: #cbd5e1 !important;
}

[data-coreui-theme='dark'] .admin-proposal-list__table-surface::v-deep td.c-datatable-empty,
body.c-dark-theme .admin-proposal-list__table-surface::v-deep td.c-datatable-empty {
  color: #9ca3af;
}

[data-coreui-theme='dark'] .admin-proposal-list__pager .btn-outline-secondary,
body.c-dark-theme .admin-proposal-list__pager .btn-outline-secondary {
  color: #e5e7eb;
  border-color: rgba(148, 163, 184, 0.45);
  background: rgba(30, 41, 59, 0.35);
}

[data-coreui-theme='dark'] .admin-proposal-list__pager .btn-outline-secondary:hover,
body.c-dark-theme .admin-proposal-list__pager .btn-outline-secondary:hover {
  background: rgba(71, 85, 105, 0.45);
  color: #ffffff;
}

[data-coreui-theme='dark'] .admin-proposal-action-btn,
body.c-dark-theme .admin-proposal-action-btn {
  border-color: rgba(96, 165, 250, 0.7);
}

[data-coreui-theme='dark'] .admin-proposal-list::v-deep .modal-content,
body.c-dark-theme .admin-proposal-list::v-deep .modal-content {
  background: #0f172a;
  border: 1px solid rgba(148, 163, 184, 0.35);
  color: #e5e7eb;
}

[data-coreui-theme='dark'] .admin-proposal-list::v-deep .modal-header,
body.c-dark-theme .admin-proposal-list::v-deep .modal-header,
[data-coreui-theme='dark'] .admin-proposal-list::v-deep .modal-footer,
body.c-dark-theme .admin-proposal-list::v-deep .modal-footer {
  border-color: rgba(148, 163, 184, 0.25);
}

[data-coreui-theme='dark'] .admin-proposal-list::v-deep textarea.form-control,
body.c-dark-theme .admin-proposal-list::v-deep textarea.form-control {
  background: #111827;
  color: #e5e7eb;
}
</style>
