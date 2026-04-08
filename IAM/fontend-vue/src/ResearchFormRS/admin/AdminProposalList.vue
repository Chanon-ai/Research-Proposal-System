<template>
  <div class="admin-proposal-list">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">{{ $t('adminProposalList.title') }}</h2>
    </div>

    <CCard class="mb-3 admin-proposal-list__filter-card">
      <CCardBody class="admin-proposal-list__filter-body">
        <CRow>
          <CCol md="5" class="mb-2 mb-md-0">
            <CInput
              v-model="filters.keyword"
              :placeholder="$t('adminProposalList.searchPlaceholder')"
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
            <CButton color="secondary" variant="outline" block @click="resetFilters"><CIcon name="cil-chevron-right" class="mr-1" /> {{ $t('adminProposalList.reset') }}</CButton>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <CCard class="admin-proposal-list__table-card">
      <CCardHeader class="admin-proposal-list__table-header">
        <div class="d-flex justify-content-between align-items-center flex-wrap" style="gap: 8px;">
          <strong>{{ $t('adminProposalList.listTitle') }}</strong>
          <small class="text-muted">{{ $t('adminProposalList.summary', { from: displayFrom, to: displayTo, total }) }}</small>
        </div>
      </CCardHeader>
      <CCardBody class="admin-proposal-list__table-body">
        <div v-if="loading" class="text-center py-5">
          <CSpinner color="primary" />
          <div class="mt-2 text-muted">{{ $t('adminProposalList.loading') }}</div>
        </div>

        <div v-else>
          <div class="admin-proposal-list__table-surface">
            <CDataTable
              :items="tableItems"
              :fields="tableFields"
              hover
              striped
              bordered
              small
              :items-per-page="limit"
              :no-items-view="{ noResults: $t('adminProposalList.noResults'), noItems: $t('adminProposalList.noItems') }"
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
                    {{ getStatusLabel(item.currentStatus, item) }}
                  </CBadge>
                  <div v-if="getChairmanStatusText(item)" class="small text-muted mt-1">
                    {{ getChairmanStatusText(item) }}
                  </div>
                  <div v-if="getFinanceStatusText(item)" class="small text-muted mt-1">
                    {{ getFinanceStatusText(item) }}
                  </div>
                </td>
              </template>

              <template #currentRound="{ item }">
                <td>{{ item.currentRound ? $t('adminProposalList.currentRound', { round: item.currentRound }) : '-' }}</td>
              </template>

              <template #updatedAt="{ item }">
                <td>{{ formatDate(getLatestStatusUpdatedAt(item)) }}</td>
              </template>

              <template #actions="{ item }">
                <td class="text-nowrap">
                  <CButton color="primary" size="sm" class="mr-1 admin-proposal-action-btn" @click="onView(item)"><CIcon name="cil-folder-open" class="mr-1" /> {{ $t('adminProposalList.view') }}</CButton>
                  <CButton v-if="canOpenFinanceAssign(item)" color="info" size="sm" class="mr-1 admin-proposal-action-btn" @click="openFinanceModal(item)">มอบหมายการเงิน</CButton>
                </td>
              </template>
            </CDataTable>
          </div>

          <div class="d-flex justify-content-between align-items-center mt-3 flex-wrap admin-proposal-list__pager" style="gap: 8px;">
            <small class="text-muted">{{ $t('adminProposalList.page', { page, totalPages }) }}</small>
            <div>
              <CButton
                size="sm"
                color="secondary"
                variant="outline"
                class="mr-2"
                :disabled="page <= 1 || loading"
                @click="changePage(page - 1)"
              >
                <CIcon name="cil-chevron-right" class="mr-1" /> {{ $t('adminProposalList.previous') }}
              </CButton>
              <CButton
                size="sm"
                color="secondary"
                variant="outline"
                :disabled="page >= totalPages || loading"
                @click="changePage(page + 1)"
              >
                <CIcon name="cil-chevron-right" class="mr-1" /> {{ $t('adminProposalList.next') }}
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
      :title="$t('adminProposalList.modals.changeStatus.title')"
    >
      <template #body-wrapper>
        <div v-if="selectedProposal">
          <div class="mb-2"><strong>{{ $t('adminProposalList.modals.changeStatus.proposalCode') }}</strong> {{ selectedProposal.proposalCode || '-' }}</div>
          <div class="mb-2"><strong>{{ $t('adminProposalList.modals.changeStatus.projectTitle') }}</strong> {{ selectedProposal.projectTitleTh || '-' }}</div>
          <div class="mb-3">
            <strong>{{ $t('adminProposalList.modals.changeStatus.currentStatus') }}</strong>
            <CBadge :color="getStatusColor(selectedProposal.currentStatus)" class="ml-1">
              {{ getStatusLabel(selectedProposal.currentStatus, selectedProposal) }}
            </CBadge>
          </div>

          <CSelect
            :label="$t('adminProposalList.modals.changeStatus.toStatus')"
            :value="statusForm.toStatus"
            :options="nextStatusOptions"
            @change="onToStatusChange"
          />

          <label class="mt-2">{{ $t('adminProposalList.modals.changeStatus.remarkLabel') }}</label>
          <textarea
            v-model="statusForm.remark"
            class="form-control"
            rows="3"
            :placeholder="$t('adminProposalList.modals.changeStatus.remarkPlaceholder')"
          />
        </div>
      </template>

      <template #footer-wrapper>
        <div class="d-flex justify-content-end w-100">
          <CButton color="secondary" class="mr-2" @click="closeStatusModal"><CIcon name="cil-chevron-right" class="mr-1" /> {{ $t('adminProposalList.modals.changeStatus.cancel') }}</CButton>
          <CButton
            color="primary"
            :disabled="!statusForm.toStatus || submittingStatus"
            @click="confirmChangeStatus"
          >
            <CIcon name="cil-check-circle" class="mr-1" /> {{ submittingStatus ? $t('adminProposalList.modals.changeStatus.saving') : $t('adminProposalList.modals.changeStatus.confirm') }}
          </CButton>
        </div>
      </template>
    </CModal>

    <CModal
      :show.sync="showChairmanModal"
      :close-on-backdrop="false"
      centered
      :title="$t('adminProposalList.modals.assignChairman.title')"
    >
      <template #body-wrapper>
        <div v-if="selectedProposal">
          <div class="mb-2"><strong>{{ $t('adminProposalList.modals.assignChairman.proposalCode') }}</strong> {{ selectedProposal.proposalCode || '-' }}</div>
          <div class="mb-3"><strong>{{ $t('adminProposalList.modals.assignChairman.projectTitle') }}</strong> {{ selectedProposal.projectTitleTh || '-' }}</div>

          <div v-if="chairmanLoading" class="text-center py-3">
            <CSpinner size="sm" color="primary" />
            <div class="small text-muted mt-2">{{ $t('adminProposalList.modals.assignChairman.loading') }}</div>
          </div>

          <CAlert v-else-if="chairmanError" color="warning" show>
            {{ chairmanError }}
          </CAlert>

          <CSelect
            v-else
            :label="$t('adminProposalList.modals.assignChairman.select')"
            :value="selectedChairmanId"
            :options="chairmanOptions"
            @change="onChairmanChange"
          />
        </div>
      </template>

      <template #footer-wrapper>
        <div class="d-flex justify-content-end w-100">
          <CButton color="secondary" class="mr-2" @click="closeChairmanModal"><CIcon name="cil-chevron-right" class="mr-1" /> {{ $t('adminProposalList.modals.assignChairman.cancel') }}</CButton>
          <CButton
            color="warning"
            :disabled="!selectedChairmanId || sendingChairman"
            @click="confirmAssignChairman"
          >
            <CIcon name="cil-check-circle" class="mr-1" /> {{ sendingChairman ? $t('adminProposalList.modals.assignChairman.sending') : $t('adminProposalList.modals.assignChairman.confirm') }}
          </CButton>
        </div>
      </template>
    </CModal>

    <CModal
      :show.sync="showCommitteeModal"
      :close-on-backdrop="false"
      centered
      :title="$t('adminProposalList.modals.assignCommittee.title')"
    >
      <template #body-wrapper>
        <div v-if="selectedProposal">
          <div class="mb-2"><strong>{{ $t('adminProposalList.modals.assignCommittee.proposalCode') }}</strong> {{ selectedProposal.proposalCode || '-' }}</div>
          <div class="mb-3"><strong>{{ $t('adminProposalList.modals.assignCommittee.projectTitle') }}</strong> {{ selectedProposal.projectTitleTh || '-' }}</div>

          <CInput
            :label="$t('adminProposalList.modals.assignCommittee.input')"
            v-model="committeeForm.committeeIdsText"
            :placeholder="$t('adminProposalList.modals.assignCommittee.placeholder')"
          />
        </div>
      </template>

      <template #footer-wrapper>
        <div class="d-flex justify-content-end w-100">
          <CButton color="secondary" class="mr-2" @click="closeCommitteeModal"><CIcon name="cil-chevron-right" class="mr-1" /> {{ $t('adminProposalList.modals.assignCommittee.cancel') }}</CButton>
          <CButton
            color="success"
            :disabled="submittingCommittee"
            @click="confirmAssignCommittee"
          >
            <CIcon name="cil-check-circle" class="mr-1" /> {{ submittingCommittee ? $t('adminProposalList.modals.assignCommittee.saving') : $t('adminProposalList.modals.assignCommittee.confirm') }}
          </CButton>
        </div>
      </template>
    </CModal>

    <CModal
      :show.sync="showFinanceModal"
      :close-on-backdrop="false"
      centered
      title="มอบหมายเจ้าหน้าที่การเงิน"
    >
      <template #body-wrapper>
        <div v-if="selectedProposal">
          <div class="mb-2"><strong>รหัสโครงการ</strong> {{ selectedProposal.proposalCode || '-' }}</div>
          <div class="mb-3"><strong>ชื่อโครงการ</strong> {{ selectedProposal.projectTitleTh || '-' }}</div>

          <div v-if="financeLoading" class="text-center py-3">
            <CSpinner size="sm" color="primary" />
            <div class="small text-muted mt-2">กำลังโหลดรายชื่อเจ้าหน้าที่การเงิน...</div>
          </div>

          <CAlert v-else-if="financeError" color="warning" show>
            {{ financeError }}
          </CAlert>

          <CSelect
            v-else
            label="เลือกเจ้าหน้าที่การเงิน"
            :value="selectedFinanceOfficerId"
            :options="financeOptions"
            @change="onFinanceOfficerChange"
          />
        </div>
      </template>

      <template #footer-wrapper>
        <div class="d-flex justify-content-end w-100">
          <CButton color="secondary" class="mr-2" @click="closeFinanceModal">ยกเลิก</CButton>
          <CButton
            color="info"
            :disabled="!selectedFinanceOfficerId || submittingFinance"
            @click="confirmAssignFinanceOfficer"
          >
            {{ submittingFinance ? 'กำลังบันทึก...' : 'ยืนยันการมอบหมาย' }}
          </CButton>
        </div>
      </template>
    </CModal>
  </div>
</template>

<script>
import Service, { instance as axios } from '@/service/api'
import Swal from 'sweetalert2'
import {
  PROPOSAL_ALLOWED_TRANSITIONS as ALLOWED_TRANSITIONS,
  PROPOSAL_STATUS_COLORS_COREUI_BADGE as STATUS_COLORS,
  PROPOSAL_STATUS_KEYS as STATUS_KEYS,
  PROPOSAL_STATUS_LABELS_TH_ADMIN as STATUS_LABELS,
  getProposalStatusLabel,
  normalizeProposalStatus
} from '@/ResearchFormRS/constants/proposalWorkflow'
import { loadResearchFormRuntimeConfigs } from '@/ResearchFormRS/utils/researchConfigRuntime'
import centerLoadingMixin from '@/ResearchFormRS/utils/centerLoadingMixin'

export default {
  name: 'AdminProposalList',
  mixins: [centerLoadingMixin],
  data () {
    return {
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

      showChairmanModal: false,
      chairmanLoading: false,
      chairmanError: '',
      chairmanUsers: [],
      selectedChairmanId: '',
      sendingChairman: false,

      showFinanceModal: false,
      financeLoading: false,
      financeError: '',
      financeUsers: [],
      selectedFinanceOfficerId: '',
      submittingFinance: false,

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
    tableFields () {
      return [
        { key: 'index', label: '#' },
        { key: 'proposalCode', label: this.$t('adminProposalList.fields.proposalCode') },
        { key: 'projectTitleTh', label: this.$t('adminProposalList.fields.projectTitleTh') },
        { key: 'fiscalYear', label: this.$t('adminProposalList.fields.fiscalYear') },
        { key: 'fundingType', label: this.$t('adminProposalList.fields.fundingType') },
        { key: 'currentStatus', label: this.$t('adminProposalList.fields.currentStatus') },
        { key: 'currentRound', label: this.$t('adminProposalList.fields.currentRound') },
        { key: 'updatedAt', label: this.$t('adminProposalList.fields.updatedAt') },
        { key: 'actions', label: this.$t('adminProposalList.fields.actions'), _classes: 'text-center text-nowrap' }
      ]
    },
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
    centerLoadingActive () {
      return Boolean(
        this.loading ||
        this.submittingStatus ||
        this.submittingCommittee ||
        this.chairmanLoading ||
        this.sendingChairman
      )
    },
    statusFilterOptions () {
      return [
        { value: '', label: this.$t('adminProposalList.statusFilterAll') },
        ...STATUS_KEYS.map(status => ({ value: status, label: this.getStatusLabel(status) }))
      ]
    },
    fiscalYearOptions () {
      return [
        { value: '', label: this.$t('adminProposalList.fiscalYearAll') },
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
        return [{ value: '', label: this.$t('adminProposalList.nextStatusNone') }]
      }
      return [{
        value: '',
        label: this.$t('adminProposalList.nextStatusSelect')
      }, ...nextStatuses.map(s => ({
        value: s,
        label: s === 'second_round_review'
          ? this.$t('adminProposalList.nextStatusSecondRound')
          : this.getStatusLabel(s, this.selectedProposal, { nextRoundForSecondRoundReview: true })
      }))]
    },
    chairmanOptions () {
      return [
        { value: '', label: this.$t('adminProposalList.chairmanSelect') },
        ...(this.chairmanUsers || []).map(user => ({
          value: user && user._id ? String(user._id) : '',
          label: user && user.fullName ? `${user.fullName}${user.department ? ` (${user.department})` : ''}` : '-'
        }))
      ]
    },
    financeOptions () {
      return [
        { value: '', label: 'เลือกเจ้าหน้าที่การเงิน' },
        ...(this.financeUsers || []).map(user => ({
          value: user && user._id ? String(user._id) : '',
          label: user && user.fullName ? `${user.fullName}${user.department ? ` (${user.department})` : ''}` : '-'
        }))
      ]
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
  async mounted () {
    await loadResearchFormRuntimeConfigs()
    this.$forceUpdate()
    this.fetchChairmanUsers()
    this.fetchFinanceUsers()
    this.fetchProposals()
  },
  beforeDestroy () {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer)
    }
  },
  methods: {
    getChairmanAssignment (proposal) {
      return proposal && proposal.chairmanAssignment && typeof proposal.chairmanAssignment === 'object'
        ? proposal.chairmanAssignment
        : {}
    },
    getAssignedChairmanIds (proposal) {
      const assignment = this.getChairmanAssignment(proposal)
      return Array.isArray(assignment.assignedChairmanIds) ? assignment.assignedChairmanIds.map(String) : []
    },
    getChairmanNames (proposal) {
      const ids = this.getAssignedChairmanIds(proposal)
      if (!ids.length) return ''
      const byId = new Map((this.chairmanUsers || []).map(user => [String(user._id), user]))
      const names = ids
        .map(id => byId.get(String(id)))
        .filter(Boolean)
        .map(user => user.fullName || '')
        .filter(Boolean)
      if (names.length > 0) return names.join(', ')
      return this.$t('adminProposalList.chairmanCount', { count: ids.length })
    },
    getChairmanStatusText (proposal) {
      const assignment = this.getChairmanAssignment(proposal)
      const status = String(assignment.status || '').trim().toLowerCase()
      const names = this.getChairmanNames(proposal)
      if (status === 'pending') return names ? this.$t('adminProposalList.chairmanSentWithName', { name: names }) : this.$t('adminProposalList.chairmanSent')
      if (status === 'approved') return names ? this.$t('adminProposalList.chairmanApprovedWithName', { name: names }) : this.$t('adminProposalList.chairmanApproved')
      if (status === 'rejected') return names ? this.$t('adminProposalList.chairmanRejectedWithName', { name: names }) : this.$t('adminProposalList.chairmanRejected')
      return ''
    },
    getFinanceAssignment (proposal) {
      return proposal && proposal.financeAssignment && typeof proposal.financeAssignment === 'object'
        ? proposal.financeAssignment
        : {}
    },
    getAssignedFinanceOfficerIds (proposal) {
      const assignment = this.getFinanceAssignment(proposal)
      return Array.isArray(assignment.assignedFinanceOfficerIds) ? assignment.assignedFinanceOfficerIds.map(String) : []
    },
    getFinanceNames (proposal) {
      const ids = this.getAssignedFinanceOfficerIds(proposal)
      if (!ids.length) return ''
      const byId = new Map((this.financeUsers || []).map(user => [String(user._id), user]))
      return ids
        .map(id => byId.get(String(id)))
        .filter(Boolean)
        .map(user => user.fullName || '')
        .filter(Boolean)
        .join(', ')
    },
    getFinanceStatusText (proposal) {
      const assignment = this.getFinanceAssignment(proposal)
      const status = String(assignment.status || '').trim().toLowerCase()
      const names = this.getFinanceNames(proposal)
      if (status === 'pending') return names ? `มอบหมายให้ ${names} ตรวจสอบงบประมาณ` : 'มอบหมายเจ้าหน้าที่การเงินแล้ว'
      if (status === 'submitted') return names ? `${names} ส่งผลการตรวจสอบงบประมาณแล้ว` : 'ส่งผลการตรวจสอบงบประมาณแล้ว'
      return ''
    },
    getChairmanActionLabel (proposal) {
      const status = String(this.getChairmanAssignment(proposal).status || '').trim().toLowerCase()
      if (status === 'pending') return this.$t('adminProposalList.chairmanActionSent')
      if (status === 'rejected') return this.$t('adminProposalList.chairmanActionResend')
      if (status === 'approved') return this.$t('adminProposalList.chairmanActionApproved')
      return this.$t('adminProposalList.chairmanActionSend')
    },
    canOpenChairmanAssign (proposal) {
      const currentStatus = normalizeProposalStatus(proposal && proposal.currentStatus)
      const status = String(this.getChairmanAssignment(proposal).status || '').trim().toLowerCase()
      if (status === 'pending' || status === 'approved') return false
      return currentStatus === 'submitted'
    },
    canOpenFinanceAssign (proposal) {
      const currentStatus = normalizeProposalStatus(proposal && proposal.currentStatus)
      return ['office_received', 'finance_budget_checking'].includes(currentStatus)
    },
    hasAssignedCommittee (proposal) {
      return Array.isArray(proposal && proposal.committeeIds) && proposal.committeeIds.length > 0
    },
    async fetchChairmanUsers () {
      this.chairmanLoading = true
      this.chairmanError = ''
      try {
        const response = await Service.proposal.getCommitteeUsers({ role: 'chairman', limit: 100 })
        const payload = response && response.data ? response.data : null
        const wrapped = payload && payload.data && !Array.isArray(payload.data) ? payload.data : null
        this.chairmanUsers = wrapped && Array.isArray(wrapped.items)
          ? wrapped.items
          : (payload && Array.isArray(payload.data) ? payload.data : [])
      } catch (error) {
        this.chairmanUsers = []
        this.chairmanError = (error && error.response && error.response.data && error.response.data.message) || error.message || this.$t('adminProposalList.chairmanLoadError')
      } finally {
        this.chairmanLoading = false
      }
    },
    async fetchFinanceUsers () {
      this.financeLoading = true
      this.financeError = ''
      try {
        const response = await Service.proposal.getCommitteeUsers({ role: 'finance_officer', limit: 100 })
        const payload = response && response.data ? response.data : null
        const wrapped = payload && payload.data && !Array.isArray(payload.data) ? payload.data : null
        this.financeUsers = wrapped && Array.isArray(wrapped.items)
          ? wrapped.items
          : (payload && Array.isArray(payload.data) ? payload.data : [])
      } catch (error) {
        this.financeUsers = []
        this.financeError = (error && error.response && error.response.data && error.response.data.message) || error.message || 'ไม่สามารถโหลดรายชื่อเจ้าหน้าที่การเงินได้'
      } finally {
        this.financeLoading = false
      }
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
          title: this.$t('adminProposalList.loadErrorTitle'),
          text: this.$t('adminProposalList.loadErrorText')
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
    getStatusLabel (status, roundSource = null, options = {}) {
      return getProposalStatusLabel(status, STATUS_LABELS, roundSource, options)
    },
    getStatusColor (status) {
      return STATUS_COLORS[normalizeProposalStatus(status)] || 'secondary'
    },
    formatDate (value) {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '-'
      return date.toLocaleString('th-TH')
    },
    getLatestStatusUpdatedAt (item) {
      if (!item || typeof item !== 'object') return null
      return item.lastStatusActionAt || item.currentStatusUpdatedAt || item.statusUpdatedAt || item.updatedAt || item.createdAt || null
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
    async openChairmanModal (item) {
      this.selectedProposal = item
      this.selectedChairmanId = ''
      this.showChairmanModal = true
      if (!(this.chairmanUsers || []).length) {
        await this.fetchChairmanUsers()
      }
    },
    closeChairmanModal () {
      this.showChairmanModal = false
      this.selectedProposal = null
      this.selectedChairmanId = ''
    },
    async openFinanceModal (item) {
      this.selectedProposal = item
      this.selectedFinanceOfficerId = ''
      this.showFinanceModal = true
      if (!(this.financeUsers || []).length) {
        await this.fetchFinanceUsers()
      }
    },
    closeFinanceModal () {
      this.showFinanceModal = false
      this.selectedProposal = null
      this.selectedFinanceOfficerId = ''
    },
    onChairmanChange (val) {
      this.selectedChairmanId = val && val.target ? val.target.value : val
    },
    onFinanceOfficerChange (val) {
      this.selectedFinanceOfficerId = val && val.target ? val.target.value : val
    },
    async confirmAssignChairman () {
      if (!this.selectedProposal || !this.selectedChairmanId) return
      this.sendingChairman = true
      try {
        await Service.proposal.assignChairman(this.selectedProposal._id, {
          chairmanIds: [this.selectedChairmanId]
        })
        this.closeChairmanModal()
        await this.fetchProposals()
        await Swal.fire({
          icon: 'success',
          title: this.$t('admin.assignChairman.successTitle'),
          timer: 1600,
          showConfirmButton: false
        })
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: this.$t('admin.assignChairman.errorTitle'),
          text: (error && error.response && error.response.data && error.response.data.message) || this.$t('adminProposalList.genericRetry')
        })
      } finally {
        this.sendingChairman = false
      }
    },
    async confirmAssignFinanceOfficer () {
      if (!this.selectedProposal || !this.selectedFinanceOfficerId) return
      this.submittingFinance = true
      try {
        await Service.proposal.assignFinanceOfficer(this.selectedProposal._id, {
          financeOfficerIds: [this.selectedFinanceOfficerId]
        })
        this.closeFinanceModal()
        await this.fetchProposals()
        await Swal.fire({
          icon: 'success',
          title: 'มอบหมายเจ้าหน้าที่การเงินสำเร็จ',
          timer: 1600,
          showConfirmButton: false
        })
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: 'มอบหมายเจ้าหน้าที่การเงินไม่สำเร็จ',
          text: (error && error.response && error.response.data && error.response.data.message) || this.$t('adminProposalList.genericRetry')
        })
      } finally {
        this.submittingFinance = false
      }
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
          title: this.$t('adminProposalList.changeStatusSuccess'),
          timer: 1600,
          showConfirmButton: false
        })
      } catch (error) {
        console.error('[AdminProposalList] Error changing status:', error)
        await Swal.fire({
          icon: 'error',
          title: this.$t('adminProposalList.changeStatusError'),
          text: (error && error.response && error.response.data && error.response.data.message) || this.$t('adminProposalList.genericRetry')
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
          title: this.$t('adminProposalList.assignCommitteeSuccess'),
          timer: 1600,
          showConfirmButton: false
        })
      } catch (error) {
        console.error('[AdminProposalList] Error assigning committee:', error)
        await Swal.fire({
          icon: 'error',
          title: this.$t('adminProposalList.assignCommitteeError'),
          text: (error && error.response && error.response.data && error.response.data.message) || this.$t('adminProposalList.genericRetry')
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
