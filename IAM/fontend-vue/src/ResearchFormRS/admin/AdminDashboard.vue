<template>
  <div class="admin-dashboard-page">
    <div class="mb-3">
      <h2 class="mb-1">{{ $t('admin.dashboard.title') }}</h2>
      <p class="text-muted mb-0">{{ $t('admin.dashboard.subtitle') }}</p>
    </div>

    <div v-if="loadingSummary" class="text-center py-3">
      <CSpinner color="primary" size="sm" />
      <small class="text-muted ml-2">{{ $t('admin.dashboard.loadingSummary') }}</small>
    </div>

    <div v-else>
      <CRow class="mb-4">
        <CCol sm="6" lg="3" class="mb-3" v-for="card in summaryCards" :key="card.key">
          <div
            class="summary-card"
            :class="[card.toneClass, { active: selectedSummaryFilter === card.key }]"
            @click="onCardClick(card.key)"
          >
            <div class="summary-card-bg" aria-hidden="true"></div>
            <div class="summary-card-content">
              <small class="summary-label">{{ card.label }}</small>
              <div class="summary-number">{{ card.count }}</div>
            </div>
          </div>
        </CCol>
      </CRow>
    </div>

    <section ref="tableSection">
      <CCard class="mfu-dashboard-table-card mfu-no-table-divider">
        <CCardHeader class="mfu-dashboard-card-header">
          <div class="mfu-dashboard-card-header__row">
            <div class="mfu-dashboard-card-title">
              {{ $t('admin.dashboard.listTitle') }}
              <CBadge class="ml-2 mfu-count-badge">{{ total }}</CBadge>
            </div>
            <div class="mfu-header-tools" aria-label="ตัวกรองตาราง">
              <CSelect
                class="mfu-header-select"
                :value="selectedStatus"
                :options="statusFilterOptions"
                @change="onStatusChange"
              />
              <CSelect
                class="mfu-header-select"
                :value="selectedYear"
                :options="yearFilterOptions"
                @change="onYearChange"
              />
            </div>
          </div>
        </CCardHeader>
        <CCardBody class="mfu-card-body-tight">
          <div v-if="loadingTable" class="text-center py-5">
            <CSpinner color="primary" />
            <div class="mt-2 text-muted">{{ $t('admin.dashboard.loadingTable') }}</div>
          </div>

          <div v-else>
            <div class="mfu-table-surface">
              <CDataTable
                :items="tableItems"
                :fields="tableFields"
                :sorter="{ resetable: false }"
                :sorter-value.sync="sorterValue"
                hover
                striped
                :items-per-page="limit"
                :no-items-view="{ noItems: $t('admin.table.noItems'), noResults: $t('admin.table.noResults') }"
              >
                <template #projectTitleTh="{ item }">
                  <td>
                    <div class="font-weight-bold">{{ item.projectTitleTh || '-' }}</div>
                    <small class="text-muted" v-if="item.projectTitleEn">{{ item.projectTitleEn }}</small>
                  </td>
                </template>

                <template #currentStatus="{ item }">
                  <td class="current-status-cell">
                    <CBadge class="mb-2 status-badge" :color="getStatusBadgeColor(item.currentStatus)">
                      {{ getStatusLabel(item.currentStatus, item) }}
                    </CBadge>
                    <div class="status-progress-label">
                      {{ getProgressLabel(item) }}
                    </div>
                    <div class="status-last-action-time" :title="formatAbsoluteDate(getLastActionAt(item))">
                      {{ getLastActionElapsedLabel(item) }}
                    </div>
                  </td>
                </template>

                <template #currentRound="{ item }">
                  <td>{{ item.currentRound ? $t('admin.table.roundLabel', { n: item.currentRound }) : '-' }}</td>
                </template>

                <template #updatedAt="{ item }">
                  <td :title="formatAbsoluteDate(getLastActionAt(item))">
                    {{ formatElapsedFromLastAction(item) }}
                  </td>
                </template>

                <template #actions="{ item }">
                  <td class="text-nowrap">
                    <div class="admin-actions">
                      <CButton v-if="canAccessResearchForm" color="primary" variant="outline" size="sm" class="admin-action-btn" @click="viewDetail(item)"><CIcon name="cil-folder-open" class="mr-1" /> {{ $t('admin.actions.viewDetail') }}</CButton>
                    </div>
                  </td>
                </template>
              </CDataTable>
            </div>

            <div class="mfu-table-footer">
                <div class="mfu-table-footer__left">
                <span class="mfu-table-footer__label">{{ $t('admin.table.perPage') }}</span>
                <select v-model.number="limit" class="form-control form-control-sm mfu-per-page-select" :aria-label="$t('admin.table.perPage')" @change="onLimitChange">
                  <option v-for="n in perPageOptions" :key="n" :value="n">{{ n }}</option>
                </select>
                <span class="mfu-table-footer__suffix">{{ $t('admin.table.itemsSuffix') }}</span>
              </div>
              <div class="mfu-table-footer__right">
                <CPagination
                  :pages="totalPages"
                  :active-page="page"
                  align="end"
                  :arrows="true"
                  :double-arrows="true"
                  size="sm"
                  @update:activePage="onPageChange"
                />
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
      :title="$t('admin.changeStatus.title')"
    >
      <template #body-wrapper>
        <div v-if="selectedProposal" class="status-modal-body" style="padding: 20px 24px 8px; max-height: calc(100vh - 220px); overflow-y: auto;">
          <div class="status-modal-proposal">
            <div class="status-modal-meta"><strong>{{ $t('admin.changeStatus.proposalCode') }}</strong> {{ selectedProposal.proposalCode || '-' }}</div>
            <div class="status-modal-meta"><strong>{{ $t('admin.changeStatus.projectTitle') }}</strong> {{ selectedProposal.projectTitleTh || '-' }}</div>
          </div>
          <div class="status-modal-current">
            <strong>{{ $t('admin.changeStatus.currentStatus') }}</strong>
            <CBadge :color="getStatusBadgeColor(selectedProposal.currentStatus)" class="ml-1">
              {{ getStatusLabel(selectedProposal.currentStatus, selectedProposal) }}
            </CBadge>
          </div>

          <CSelect
            class="status-modal-select"
            :label="$t('admin.changeStatus.selectTo')"
            :value="newStatus"
            :options="nextStatusOptions"
            @change="onNewStatusChange"
          />

          <label class="status-modal-remark-label">{{ $t('admin.changeStatus.remarkLabel') }}</label>
          <textarea
            v-model="statusRemark"
            class="form-control"
            rows="3"
            :placeholder="$t('admin.changeStatus.remarkPlaceholder')"
          />
        </div>
      </template>

      <template #footer-wrapper>
          <div class="status-modal-footer d-flex justify-content-end w-100" style="padding: 12px 24px 20px;">
          <CButton color="secondary" class="mr-2" @click="closeStatusModal"><CIcon name="cil-x" class="mr-1" /> {{ $t('admin.actions.cancel') }}</CButton>
          <CButton color="primary" :disabled="!newStatus || submittingStatus" @click="confirmChangeStatus">
            <CIcon name="cil-check-circle" class="mr-1" /> {{ submittingStatus ? $t('admin.actions.saving') : $t('admin.actions.confirm') }}
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
      :title="$t('admin.assignCommittee.title')"
    >
      <template #body-wrapper>
          <div v-if="selectedProposal" class="committee-modal-body" style="padding: 20px 24px 8px; max-height: calc(100vh - 220px); overflow-y: auto;">
          <div class="committee-modal-proposal">
            <div class="committee-modal-meta"><strong>{{ $t('admin.assignCommittee.proposalCode') }}</strong> {{ selectedProposal.proposalCode || '-' }}</div>
            <div class="committee-modal-meta"><strong>{{ $t('admin.assignCommittee.projectTitle') }}</strong> {{ selectedProposal.projectTitleTh || '-' }}</div>
          </div>

          <div class="committee-selection-panel">
            <div class="mb-2"><strong>{{ $t('admin.assignCommittee.selectedCount', { n: selectedCommitteeIds.length }) }}</strong></div>
            <small class="text-muted d-block mb-2">{{ $t('admin.assignCommittee.minRequired', { n: requiredCommitteeCount }) }}</small>
            <div class="committee-selection-summary">
            <span v-if="selectedCommitteeProfiles.length === 0" class="text-muted">{{ $t('admin.assignCommittee.noneSelected') }}</span>
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
                <CIcon name="cil-chevron-right" class="mr-1" /> ×
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
                <CIcon name="cil-chevron-right" class="mr-1" /> {{ $t('admin.assignCommittee.filter.recommended') }}
              </CButton>
              <CButton
                size="sm"
                :color="committeeFilterMode === 'all' ? 'info' : 'secondary'"
                :variant="committeeFilterMode === 'all' ? undefined : 'outline'"
                @click="setCommitteeFilterMode('all')"
              >
                <CIcon name="cil-chevron-right" class="mr-1" /> {{ $t('admin.assignCommittee.filter.all') }}
              </CButton>
              <CButton
                size="sm"
                :color="committeeFilterMode === 'department' ? 'info' : 'secondary'"
                :variant="committeeFilterMode === 'department' ? undefined : 'outline'"
                @click="setCommitteeFilterMode('department')"
              >
                <CIcon name="cil-chevron-right" class="mr-1" /> {{ $t('admin.assignCommittee.filter.department') }}
              </CButton>
            </div>
            <div class="mt-2">
              <CSelect
                :label="$t('admin.assignCommittee.filterByDepartment')"
                :value="selectedCommitteeDepartment"
                :options="committeeDepartmentOptions"
                @change="onCommitteeDepartmentChange"
              />
            </div>
          </div>

          <CInput
            class="committee-search-field"
            :label="$t('admin.assignCommittee.searchLabel')"
            v-model="committeeSearch"
            :placeholder="$t('admin.assignCommittee.searchPlaceholder')"
          />

          <div v-if="committeeUsersLoading" class="text-center py-2">
            <CSpinner size="sm" color="primary" />
            <small class="text-muted ml-2">{{ $t('admin.assignCommittee.loadingUsers') }}</small>
          </div>
          <CAlert v-else-if="committeeUsersError" color="warning" show>
            {{ $t('admin.assignCommittee.loadError') }}: {{ committeeUsersError }}
          </CAlert>
          <div v-else class="committee-user-list">
            <div v-if="filteredCommitteeUsers.length === 0" class="text-muted py-2">{{ $t('admin.assignCommittee.noUsers') }}</div>
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
                @change="toggleCommitteeSelection(u)"
              />
              <div class="committee-user-details">
                <div class="font-weight-bold">{{ u.fullName || '-' }}</div>
                <div class="small text-muted">{{ u.email || '-' }}</div>
                <div class="small text-muted">{{ u.department || '-' }}</div>
                <div v-if="u.isRecommended" class="small text-info font-weight-bold">{{ $t('admin.assignCommittee.recommendedBadge') }}</div>
              </div>
            </label>
          </div>
          <small class="committee-modal-note text-muted">{{ $t('admin.assignCommittee.note') }}</small>
        </div>
      </template>

      <template #footer-wrapper>
        <div class="committee-modal-footer d-flex justify-content-end w-100" style="padding: 12px 24px 20px;">
          <CButton color="secondary" class="mr-2" @click="closeCommitteeModal"><CIcon name="cil-x" class="mr-1" /> {{ $t('admin.actions.cancel') }}</CButton>
          <CButton color="success" :disabled="submittingCommittee || selectedCommitteeIds.length < requiredCommitteeCount" @click="confirmAssignCommittee">
            <CIcon name="cil-check-circle" class="mr-1" /> {{ submittingCommittee ? $t('admin.actions.saving') : $t('admin.actions.confirm') }}
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
  PROPOSAL_STATUS_COLORS_COREUI_ADMIN as STATUS_COLORS,
  PROPOSAL_STATUS_KEYS as STATUS_KEYS,
  PROPOSAL_STATUS_LABELS_TH_ADMIN as STATUS_LABELS,
  deriveProposalRoundNo,
  getProposalStatusLabel,
  normalizeProposalStatus
} from '@/ResearchFormRS/constants/proposalWorkflow'
import { loadResearchFormRuntimeConfigs } from '@/ResearchFormRS/utils/researchConfigRuntime'
import {
  createDefaultRolePageAccessConfig,
  isRoleAllowedForPath
} from '@/ResearchFormRS/utils/rolePageAccessConfig'
import {
  loadRolePageAccessRuntimeConfig,
  mapRoleForResearchAccess
} from '@/ResearchFormRS/utils/rolePageAccessRuntime'

const SUMMARY_ALL_EXCLUDED_STATUSES = ['draft', 'pending_confirm']
const DEFAULT_SUMMARY_FILTER_KEY = 'all'

const isVisibleInAllFilter = (status) => !SUMMARY_ALL_EXCLUDED_STATUSES.includes(String(status || '').trim())

const getSummaryAllStatuses = () => STATUS_KEYS.filter(status => (
  isVisibleInAllFilter(status)
))

const getSummaryInProgressStatuses = () => getSummaryAllStatuses().filter(status => (
  !['approved', 'rejected', 'announced'].includes(status)
))

const SUMMARY_FILTER_CARDS = [
  {
    key: 'all',
    label: 'ทั้งหมด',
    toneClass: 'summary-tone-submitted',
    statuses: getSummaryAllStatuses()
  },
  {
    key: 'in_progress',
    label: 'กำลังดำเนินการ',
    toneClass: 'summary-tone-checking',
    statuses: getSummaryInProgressStatuses()
  },
  {
    key: 'approved',
    label: 'อนุมัติ',
    toneClass: 'summary-tone-approved',
    statuses: ['approved']
  },
  {
    key: 'rejected',
    label: 'ไม่อนุมัติ',
    toneClass: 'summary-tone-rejected',
    statuses: ['rejected']
  }
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
      selectedStatus: '',
      selectedSummaryFilter: DEFAULT_SUMMARY_FILTER_KEY,
      selectedYear: '',
      sorterValue: { column: 'updatedAt', asc: false },
      limit: 10,
      perPageOptions: [5, 10, 20, 50],
      nowTs: Date.now(),
      elapsedTickerId: null,

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
      workflowApprovalPolicy: {
        minScore: 60,
        minCommittee: 3,
        maxRounds: 2,
        allowRevisionAfterMeeting: true
      },
      rolePageAccessConfig: createDefaultRolePageAccessConfig(),

      // tableFields moved to computed to allow $t() usage
    }
  },
  computed: {
    currentResearchRole () {
      const storeRole = this.$store && this.$store.getters
        ? this.$store.getters['Authentication/userRole']
        : ''
      if (storeRole) return mapRoleForResearchAccess(storeRole)

      try {
        const raw = localStorage.getItem('auth_user')
        if (!raw) return ''
        const parsed = JSON.parse(raw)
        return mapRoleForResearchAccess(parsed && parsed.role ? parsed.role : '')
      } catch (e) {
        return ''
      }
    },
    canAccessResearchForm () {
      return isRoleAllowedForPath(
        this.rolePageAccessConfig,
        '/research-form',
        this.currentResearchRole,
        { defaultAllow: true }
      )
    },
    tableFields () {
      return [
        { key: 'proposalCode', label: this.$t('admin.table.proposalCode') },
        { key: 'projectTitleTh', label: this.$t('admin.table.projectTitleTh') },
        { key: 'currentStatus', label: this.$t('admin.table.currentStatus'), _style: 'width:360px; text-align:center;' },
        { key: 'currentRound', label: this.$t('admin.table.currentRound') },
        { key: 'updatedAt', label: this.$t('admin.table.updatedAt') },
        { key: 'actions', label: this.$t('admin.table.actions'), _classes: 'text-center text-nowrap', sorter: false }
      ]
    },
    summaryCards () {
      return SUMMARY_FILTER_CARDS.map(card => {
        const isAllCard = card.key === 'all'
        return {
          ...card,
          count: isAllCard ? this.getSummaryAllCount() : this.getSummaryCountByStatuses(card.statuses)
        }
      })
    },
    statusFilterOptions () {
      return [
        { value: '', label: 'ทั้งหมด' },
        ...STATUS_KEYS
          .filter(status => isVisibleInAllFilter(status))
          .map(status => ({ value: status, label: this.getStatusLabel(status) }))
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
      return this.proposals
    },
    nextStatusOptions () {
      const statuses = this.selectedProposal ? this.getNextStatuses(this.selectedProposal.currentStatus) : []
      if (!statuses.length) return [{ value: '', label: 'ไม่มีสถานะถัดไปที่อนุญาต' }]
      return [{
        value: '',
        label: 'เลือกสถานะ'
      }, ...statuses.map(s => ({
        value: s,
        label: s === 'second_round_review'
          ? 'ส่งให้คณะกรรมการพิจารณา'
          : this.getStatusLabel(s, this.selectedProposal, { nextRoundForSecondRoundReview: true })
      }))]
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
    },
    requiredCommitteeCount () {
      const n = Number(this.workflowApprovalPolicy && this.workflowApprovalPolicy.minCommittee)
      if (!Number.isFinite(n) || n < 1) return 1
      return Math.floor(n)
    }
  },
  async mounted () {
    this.startElapsedTicker()
    await Promise.all([
      loadResearchFormRuntimeConfigs(),
      this.fetchRolePageAccessConfig(),
      this.fetchWorkflowApprovalPolicy()
    ])
    this.$forceUpdate()
    this.fetchSummary()
    this.fetchProposals()
  },
  beforeDestroy () {
    this.stopElapsedTicker()
  },
  beforeUnmount () {
    this.stopElapsedTicker()
  },
  methods: {
    async fetchRolePageAccessConfig () {
      try {
        const config = await loadRolePageAccessRuntimeConfig()
        if (Array.isArray(config) && config.length > 0) {
          this.rolePageAccessConfig = config
        }
      } catch (error) {
        void error
      }
    },
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
    async fetchWorkflowApprovalPolicy () {
      try {
        const response = await axios.get('/api/v1/setting/workflow-policy')
        const payload = response && response.data && response.data.data ? response.data.data : {}
        this.workflowApprovalPolicy = {
          ...this.workflowApprovalPolicy,
          minScore: Number.isFinite(Number(payload.minScore)) ? Number(payload.minScore) : this.workflowApprovalPolicy.minScore,
          minCommittee: Number.isFinite(Number(payload.minCommittee)) ? Number(payload.minCommittee) : this.workflowApprovalPolicy.minCommittee,
          maxRounds: Number.isFinite(Number(payload.maxRounds)) ? Number(payload.maxRounds) : this.workflowApprovalPolicy.maxRounds,
          allowRevisionAfterMeeting: payload.allowRevisionAfterMeeting !== undefined
            ? Boolean(payload.allowRevisionAfterMeeting)
            : this.workflowApprovalPolicy.allowRevisionAfterMeeting
        }
      } catch (_) { /* ignore */ }
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
    getSummaryCountByStatuses (statuses) {
      return (statuses || []).reduce((sum, status) => sum + (Number(this.summary[status]) || 0), 0)
    },
    getSummaryAllCount () {
      const summary = this.summary || {}
      return Object.keys(summary).reduce((sum, status) => {
        if (!isVisibleInAllFilter(status)) return sum
        return sum + (Number(summary[status]) || 0)
      }, 0)
    },
    resolveActiveStatuses () {
      if (this.selectedStatus) return [this.selectedStatus]
      if (this.selectedSummaryFilter === DEFAULT_SUMMARY_FILTER_KEY) {
        const dynamicStatuses = Object.keys(this.summary || {}).filter(status => isVisibleInAllFilter(status))
        if (dynamicStatuses.length > 0) {
          return dynamicStatuses
        }
        const defaultCard = SUMMARY_FILTER_CARDS.find(item => item.key === DEFAULT_SUMMARY_FILTER_KEY)
        if (defaultCard && Array.isArray(defaultCard.statuses) && defaultCard.statuses.length > 0) {
          return defaultCard.statuses.filter(status => isVisibleInAllFilter(status))
        }
        return getSummaryAllStatuses()
      }
      const card = SUMMARY_FILTER_CARDS.find(item => item.key === this.selectedSummaryFilter)
      return card && Array.isArray(card.statuses) ? card.statuses : []
    },
    getStatusLabel (status, roundSource = null, options = {}) {
      const key = normalizeProposalStatus(status)
      const useDynamicReviewLabel = key === 'under_review' || key === 'second_round_review'
      if (!useDynamicReviewLabel) {
        try {
          const i18nKey = `status.${key}`
          const translated = this.$t(i18nKey)
          if (translated && translated !== i18nKey) return translated
        } catch (e) {
          // Fallback to static label map when i18n lookup fails.
        }
      }
      return getProposalStatusLabel(key, STATUS_LABELS, roundSource, options)
    },
    getStatusBadgeColor (status) {
      return STATUS_COLORS[normalizeProposalStatus(status)] || 'secondary'
    },
    getProgressLabel (itemOrStatus) {
      const item = itemOrStatus && typeof itemOrStatus === 'object' ? itemOrStatus : null
      const key = normalizeProposalStatus(item ? item.currentStatus : itemOrStatus)
      const roundNo = deriveProposalRoundNo(item, key)
      const researcherName = item && item.projectLeaderName ? String(item.projectLeaderName).trim() : ''
      const ownerName = researcherName || 'นักวิจัย'
      const statusOwnerMap = {
        draft: `${ownerName} : กำลังกรอกข้อมูล`,
        pending_confirm: 'คณะวิจัย : รอการยินยอมจากผู้ร่วมโครงการ/ที่ปรึกษาโครงการ',
        submitted: 'ส่วนบริหารโครงการ : กำลังพิจารณา',
        faculty_review_pending: 'ประธานคณะ : กำลังพิจารณา',
        faculty_approved: 'ส่วนบริหารโครงการ : รอรับเรื่อง',
        office_received: 'ส่วนบริหารโครงการ : รับเรื่องแล้ว กำลังดำเนินการ',
        document_checking: 'ส่วนบริหารโครงการ : กำลังตรวจสอบเอกสาร',
        assigned_to_committee: 'ส่วนบริหารโครงการ : กำลังมอบหมายคณะผู้ทรงคุณวุฒิ',
        under_review: `คณะผู้ทรงคุณวุฒิ : กำลังทำการพิจารณารอบที่ ${roundNo}`,
        committee_valuated: 'ส่วนบริหารโครงการ : รอสรุปผลการพิจารณา',
        revision_requested: `${ownerName} : รอแก้ไขเอกสารตามข้อเสนอแนะ`,
        resubmitted: 'ส่วนบริหารโครงการ : ได้รับเอกสารแก้ไข กำลังส่งพิจารณาต่อ',
        second_round_review: `คณะผู้ทรงคุณวุฒิ : กำลังทำการพิจารณารอบที่ ${roundNo}`,
        approved: 'ส่วนบริหารโครงการ : อนุมัติโครงการแล้ว',
        rejected: 'ส่วนบริหารโครงการ : ไม่อนุมัติโครงการ',
        announced: 'ส่วนบริหารโครงการ : ประกาศผลแล้ว'
      }
      return statusOwnerMap[key] || 'ส่วนบริหารโครงการ : อยู่ระหว่างดำเนินการ'
    },
    getNextStatuses (currentStatus) {
      return ALLOWED_TRANSITIONS[normalizeProposalStatus(currentStatus)] || []
    },
    getSelectValue (val) {
      return val && val.target ? val.target.value : val
    },
    startElapsedTicker () {
      this.stopElapsedTicker()
      this.nowTs = Date.now()
      this.elapsedTickerId = setInterval(() => {
        this.nowTs = Date.now()
      }, 60000)
    },
    stopElapsedTicker () {
      if (this.elapsedTickerId) {
        clearInterval(this.elapsedTickerId)
        this.elapsedTickerId = null
      }
    },
    toTimestamp (value) {
      if (!value) return 0
      if (value instanceof Date) return Number(value.getTime()) || 0
      const d = new Date(value)
      const ts = d.getTime()
      return Number.isFinite(ts) ? ts : 0
    },
    getLastActionAt (proposal) {
      if (!proposal || typeof proposal !== 'object') return null

      const statusLogs = Array.isArray(proposal.statusLogs) ? proposal.statusLogs : []
      const logTimestamp = statusLogs.reduce((latest, log) => {
        const ts = Math.max(
          this.toTimestamp(log && log.changedAt),
          this.toTimestamp(log && log.updatedAt),
          this.toTimestamp(log && log.createdAt),
          this.toTimestamp(log && log.dateTime)
        )
        return ts > latest ? ts : latest
      }, 0)

      const directTimestamp = Math.max(
        this.toTimestamp(proposal.lastActionAt),
        this.toTimestamp(proposal.statusUpdatedAt),
        this.toTimestamp(proposal.currentStatusUpdatedAt),
        this.toTimestamp(proposal.updatedAt),
        this.toTimestamp(proposal.createdAt)
      )

      const finalTimestamp = Math.max(logTimestamp, directTimestamp)
      if (!finalTimestamp) return null
      return new Date(finalTimestamp)
    },
    formatAbsoluteDate (value) {
      if (!value) return ''
      const d = value instanceof Date ? value : new Date(value)
      if (Number.isNaN(d.getTime())) return ''
      return d.toLocaleString('th-TH')
    },
    formatElapsedFromLastAction (proposal) {
      const lastActionDate = this.getLastActionAt(proposal)
      if (!lastActionDate) return '-'

      const diffMs = Math.max(0, this.nowTs - lastActionDate.getTime())
      const diffMinutes = Math.floor(diffMs / 60000)

      if (diffMinutes < 1) return 'เมื่อสักครู่'
      if (diffMinutes < 60) return `${diffMinutes} นาทีที่แล้ว`

      const diffHours = Math.floor(diffMinutes / 60)
      if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`

      const diffDays = Math.floor(diffHours / 24)
      if (diffDays < 30) return `${diffDays} วันที่แล้ว`

      const diffMonths = Math.floor(diffDays / 30)
      if (diffMonths < 12) return `${diffMonths} เดือนที่แล้ว`

      const diffYears = Math.floor(diffDays / 365)
      return `${diffYears} ปีที่แล้ว`
    },
    getLastActionElapsedLabel (proposal) {
      const elapsed = this.formatElapsedFromLastAction(proposal)
      if (!elapsed || elapsed === '-') return 'เวลาล่าสุด: ไม่พบข้อมูลเวลา'
      return `เวลาล่าสุด: ${elapsed}`
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
        const activeStatuses = this.resolveActiveStatuses()
        if (activeStatuses.length === 1) {
          params.status = activeStatuses[0]
        } else if (activeStatuses.length > 1) {
          params.status = activeStatuses.join(',')
        }
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
    onCardClick (filterKey) {
      this.selectedSummaryFilter = filterKey
      this.selectedStatus = ''
      this.page = 1
      this.fetchProposals()
      this.$nextTick(() => {
        if (this.$refs.tableSection && this.$refs.tableSection.scrollIntoView) {
          this.$refs.tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    },
    onStatusChange (val) {
      this.selectedStatus = this.getSelectValue(val)
      this.selectedSummaryFilter = this.selectedStatus ? '' : DEFAULT_SUMMARY_FILTER_KEY
      this.page = 1
      this.fetchProposals()
    },
    onYearChange (val) {
      this.selectedYear = this.getSelectValue(val)
      this.page = 1
      this.fetchProposals()
    },
    onLimitChange () {
      this.page = 1
      this.fetchProposals()
    },
    onPageChange (p) {
      if (p < 1 || p > this.totalPages) return
      this.page = p
      this.fetchProposals()
    },
    viewDetail (proposal) {
      if (!this.canAccessResearchForm) return
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
    async openCommitteeModal (proposal) {
      this.selectedProposal = proposal
      await this.fetchWorkflowApprovalPolicy()
      this.committeeSearch = ''
      this.committeeFilterMode = 'all'
      this.selectedCommitteeDepartment = ''
      this.committeeDepartments = []
      this.proposalDepartmentHint = ''
      const ids = Array.isArray(proposal && proposal.committeeIds) ? proposal.committeeIds : []
      this.selectedCommitteeIds = ids.map(String)
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

      const minRequired = this.requiredCommitteeCount
      if (this.selectedCommitteeIds.length < minRequired) {
        await Swal.fire('กรุณาเลือกคณะกรรมการ', `ต้องเลือกอย่างน้อย ${minRequired} คนตามนโยบายระบบ`, 'warning')
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
.admin-dashboard-page {
  width: 100%;
}

.summary-card {
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  padding: 14px 16px;
  min-height: 108px;
  cursor: pointer;
  transform: scale(1);
  transition: box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
  isolation: isolate;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.2);
}

.summary-card.active {
  transform: scale(1.02);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.85), 0 10px 24px rgba(15, 23, 42, 0.24);
}

.summary-card-small {
  min-height: 98px;
}

.summary-card-bg {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  overflow: hidden;
  z-index: 1;
  background: linear-gradient(135deg, var(--summary-start, #4f46e5), var(--summary-end, #3730a3));
}

.summary-card-bg::before {
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

.summary-card-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 60%);
  pointer-events: none;
}

.summary-card-content {
  position: relative;
  z-index: 2;
}

.summary-label {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  font-size: 0.8rem;
}

.summary-number {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.1;
  color: #ffffff;
  margin-top: 6px;
}

.summary-tone-draft {
  --summary-start: #4f46e5;
  --summary-end: #3730a3;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect x='26' y='18' width='68' height='84' rx='10' fill='white' fill-opacity='0.9'/%3E%3Crect x='38' y='38' width='44' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3Crect x='38' y='52' width='40' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3Crect x='38' y='66' width='33' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3Cpath d='M84 18v20h20' fill='white' fill-opacity='0.72'/%3E%3C/svg%3E");
}

.summary-tone-submitted {
  --summary-start: #0ea5e9;
  --summary-end: #0369a1;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='36' cy='36' r='11' fill='white' fill-opacity='0.9'/%3E%3Ccircle cx='84' cy='60' r='11' fill='white' fill-opacity='0.9'/%3E%3Ccircle cx='44' cy='88' r='11' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M44 36h28M75 41l8-5-8-5M75 84l8 5-8 5M54 83l23-16' stroke='%23000000' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.22' fill='none'/%3E%3C/svg%3E");
}

.summary-tone-meeting {
  --summary-start: #f59e0b;
  --summary-end: #d97706;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect x='20' y='24' width='80' height='72' rx='12' fill='white' fill-opacity='0.9'/%3E%3Crect x='20' y='36' width='80' height='14' fill='%23000000' fill-opacity='0.13'/%3E%3Ccircle cx='38' cy='64' r='7' fill='%23000000' fill-opacity='0.18'/%3E%3Ccircle cx='60' cy='64' r='7' fill='%23000000' fill-opacity='0.18'/%3E%3Ccircle cx='82' cy='64' r='7' fill='%23000000' fill-opacity='0.18'/%3E%3C/svg%3E");
}

.summary-tone-checking {
  --summary-start: #0f766e;
  --summary-end: #115e59;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect x='24' y='20' width='70' height='84' rx='12' fill='white' fill-opacity='0.9'/%3E%3Crect x='36' y='40' width='38' height='5' rx='2.5' fill='%23000000' fill-opacity='0.18'/%3E%3Crect x='36' y='54' width='30' height='5' rx='2.5' fill='%23000000' fill-opacity='0.18'/%3E%3Ccircle cx='79' cy='74' r='12' fill='white' fill-opacity='0.85'/%3E%3Cpath d='M88 84l10 10' stroke='%23000000' stroke-width='4' stroke-linecap='round' stroke-opacity='0.22'/%3E%3C/svg%3E");
}

.summary-tone-assigned {
  --summary-start: #0284c7;
  --summary-end: #1d4ed8;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='38' cy='46' r='12' fill='white' fill-opacity='0.9'/%3E%3Ccircle cx='62' cy='40' r='10' fill='white' fill-opacity='0.86'/%3E%3Ccircle cx='83' cy='48' r='11' fill='white' fill-opacity='0.82'/%3E%3Crect x='28' y='64' width='62' height='26' rx='13' fill='white' fill-opacity='0.72'/%3E%3C/svg%3E");
}

.summary-tone-review {
  --summary-start: #f97316;
  --summary-end: #ea580c;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M60 42v18l14 10' stroke='%23000000' stroke-width='7' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.22' fill='none'/%3E%3C/svg%3E");
}

.summary-tone-revision {
  --summary-start: #ef4444;
  --summary-end: #dc2626;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect x='24' y='20' width='72' height='80' rx='12' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M42 74l10 10 24-24' stroke='%23000000' stroke-width='6' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.22' fill='none'/%3E%3Cpath d='M72 34l12 12M61 45l23-23 12 12-23 23H61z' fill='%23000000' fill-opacity='0.2'/%3E%3C/svg%3E");
}

.summary-tone-approved {
  --summary-start: #16a34a;
  --summary-end: #15803d;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M46 61l9 9 20-20' stroke='%23000000' stroke-width='8' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.24' fill='none'/%3E%3Ccircle cx='60' cy='60' r='44' stroke='white' stroke-opacity='0.42' stroke-width='5' fill='none'/%3E%3C/svg%3E");
}

.summary-tone-rejected {
  --summary-start: #dc2626;
  --summary-end: #b91c1c;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M46 46l28 28M74 46L46 74' stroke='%23000000' stroke-width='8' stroke-linecap='round' stroke-opacity='0.24' fill='none'/%3E%3C/svg%3E");
}

.summary-tone-announced {
  --summary-start: #6366f1;
  --summary-end: #4f46e5;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Cpath d='M24 70h56l20 18V32L80 50H24z' fill='white' fill-opacity='0.88'/%3E%3Ccircle cx='36' cy='86' r='6' fill='white' fill-opacity='0.7'/%3E%3Ccircle cx='56' cy='86' r='6' fill='white' fill-opacity='0.58'/%3E%3C/svg%3E");
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

/* Admin proposals table: match UserDashboard table styling (no search box) */
.mfu-dashboard-table-card {
  border-radius: 12px;
  overflow: hidden;
  background: transparent;
  border: 0;
}

.mfu-card-body-tight {
  padding: 1rem;
  background: #f7f1ea;
}

.mfu-dashboard-card-header {
  background: linear-gradient(90deg, rgba(140, 21, 21, 0.1), rgba(254, 194, 96, 0.22));
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 0 1.25rem;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.mfu-dashboard-card-header__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  min-height: 56px;
}

.mfu-dashboard-card-title {
  color: #6b0f0f;
  font-weight: 800;
  font-size: 1.15rem;
  line-height: 1.2;
}

.mfu-header-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.mfu-header-tools /deep/ .form-group,
.mfu-header-tools >>> .form-group,
.mfu-header-tools::v-deep .form-group {
  margin: 0 !important;
}

.mfu-header-select {
  min-width: 170px;
}

.mfu-header-tools /deep/ .custom-select,
.mfu-header-tools >>> .custom-select,
.mfu-header-tools::v-deep .custom-select,
.mfu-header-tools /deep/ .form-control,
.mfu-header-tools >>> .form-control,
.mfu-header-tools::v-deep .form-control {
  height: 34px;
  min-height: 34px;
  border-radius: 10px;
  border-color: rgba(181, 133, 34, 0.35);
}

.mfu-header-tools /deep/ .custom-select:focus,
.mfu-header-tools >>> .custom-select:focus,
.mfu-header-tools::v-deep .custom-select:focus,
.mfu-header-tools /deep/ .form-control:focus,
.mfu-header-tools >>> .form-control:focus,
.mfu-header-tools::v-deep .form-control:focus {
  border-color: rgba(181, 133, 34, 0.7);
  box-shadow: 0 0 0 3px rgba(181, 133, 34, 0.16);
}

.mfu-count-badge {
  background: rgba(140, 21, 21, 0.1);
  color: #6b0f0f;
  border: 1px solid rgba(140, 21, 21, 0.18);
  border-radius: 9999px;
  font-weight: 700;
  font-size: 12px;
}

.mfu-table-surface {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(140, 21, 21, 0.14);
  overflow: hidden;
}

.mfu-table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0.75rem 1rem;
  border-top: 1px solid rgba(140, 21, 21, 0.12);
  background: linear-gradient(90deg, rgba(140, 21, 21, 0.06), rgba(254, 194, 96, 0.14));
}

.mfu-table-footer__left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #374151;
  font-size: 0.875rem;
}

.mfu-per-page-select {
  width: 84px;
  height: 34px;
  border-radius: 8px;
  border-color: rgba(140, 21, 21, 0.18);
}

.mfu-table-footer__right {
  display: flex;
  justify-content: flex-end;
  margin-left: auto;
}

.mfu-table-footer__right /deep/ .pagination,
.mfu-table-footer__right >>> .pagination,
.mfu-table-footer__right::v-deep .pagination {
  margin: 0;
  justify-content: flex-end;
}

.mfu-table-footer__right /deep/ .page-link,
.mfu-table-footer__right >>> .page-link,
.mfu-table-footer__right::v-deep .page-link {
  color: #6b0f0f;
  border-color: rgba(140, 21, 21, 0.18);
}

.mfu-table-footer__right /deep/ .page-item.active .page-link,
.mfu-table-footer__right >>> .page-item.active .page-link,
.mfu-table-footer__right::v-deep .page-item.active .page-link {
  background: #8c1515;
  border-color: #8c1515;
  color: #ffffff;
}

.mfu-no-table-divider /deep/ .table,
.mfu-no-table-divider >>> .table,
.mfu-no-table-divider::v-deep .table,
.mfu-no-table-divider /deep/ .table thead th,
.mfu-no-table-divider >>> .table thead th,
.mfu-no-table-divider::v-deep .table thead th,
.mfu-no-table-divider /deep/ .table thead tr,
.mfu-no-table-divider >>> .table thead tr,
.mfu-no-table-divider::v-deep .table thead tr,
.mfu-no-table-divider /deep/ .table thead,
.mfu-no-table-divider >>> .table thead,
.mfu-no-table-divider::v-deep .table thead,
.mfu-no-table-divider /deep/ .table-responsive,
.mfu-no-table-divider >>> .table-responsive,
.mfu-no-table-divider::v-deep .table-responsive {
  border-top: 0 !important;
}

.mfu-no-table-divider /deep/ .table-responsive,
.mfu-no-table-divider >>> .table-responsive,
.mfu-no-table-divider::v-deep .table-responsive {
  box-shadow: none !important;
}

.mfu-table-surface /deep/ .table,
.mfu-table-surface >>> .table,
.mfu-table-surface::v-deep .table {
  margin-bottom: 0;
}

.mfu-table-surface /deep/ .table thead th,
.mfu-table-surface >>> .table thead th,
.mfu-table-surface::v-deep .table thead th {
  background: linear-gradient(90deg, #8c1515, rgba(107, 15, 15, 0.98)) !important;
  color: #ffffff !important;
  font-weight: 800 !important;
  text-align: center !important;
  border-bottom: 0 !important;
  border-right: 1px solid rgba(254, 194, 96, 0.5) !important;
}

.mfu-table-surface /deep/ .table thead th:last-child,
.mfu-table-surface >>> .table thead th:last-child,
.mfu-table-surface::v-deep .table thead th:last-child {
  border-right: 0;
}

.mfu-table-surface /deep/ .table tbody td,
.mfu-table-surface >>> .table tbody td,
.mfu-table-surface::v-deep .table tbody td {
  border-bottom: 1px solid rgba(140, 21, 21, 0.12) !important;
  border-right: 1px solid rgba(140, 21, 21, 0.12) !important;
  vertical-align: middle !important;
  text-align: center !important;
}

.mfu-table-surface /deep/ .table tbody td:last-child,
.mfu-table-surface >>> .table tbody td:last-child,
.mfu-table-surface::v-deep .table tbody td:last-child {
  border-right: 0;
}

.current-status-cell {
  text-align: center;
  vertical-align: middle;
  min-width: 360px;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

.status-badge {
  border: 1px solid transparent;
  font-weight: 600;
}

.status-progress-label {
  font-size: 11px;
  color: #888;
  text-align: center;
}

.status-last-action-time {
  margin-top: 2px;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-align: center;
}

.mfu-table-surface /deep/ .table tbody tr:hover,
.mfu-table-surface >>> .table tbody tr:hover,
.mfu-table-surface::v-deep .table tbody tr:hover {
  background: rgba(254, 194, 96, 0.22) !important;
}

.mfu-table-surface /deep/ .table-striped tbody tr:nth-of-type(odd),
.mfu-table-surface >>> .table-striped tbody tr:nth-of-type(odd),
.mfu-table-surface::v-deep .table-striped tbody tr:nth-of-type(odd) {
  background-color: #ffffff;
}

.mfu-table-surface /deep/ .btn-outline-primary,
.mfu-table-surface >>> .btn-outline-primary,
.mfu-table-surface::v-deep .btn-outline-primary {
  color: #8c1515;
  border-color: #8c1515;
}

.mfu-table-surface /deep/ .btn-outline-primary:hover,
.mfu-table-surface >>> .btn-outline-primary:hover,
.mfu-table-surface::v-deep .btn-outline-primary:hover {
  color: #ffffff;
  background: #8c1515;
  border-color: #8c1515;
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

[data-coreui-theme='dark'] .admin-dashboard-page,
body.c-dark-theme .admin-dashboard-page {
  color: #e5e7eb;
}

[data-coreui-theme='dark'] .admin-dashboard-page h2,
body.c-dark-theme .admin-dashboard-page h2 {
  color: #f8fafc;
}

[data-coreui-theme='dark'] .admin-dashboard-page .text-muted,
body.c-dark-theme .admin-dashboard-page .text-muted {
  color: #9ca3af !important;
}

[data-coreui-theme='dark'] .mfu-dashboard-table-card,
body.c-dark-theme .mfu-dashboard-table-card {
  background: transparent;
}

[data-coreui-theme='dark'] .mfu-dashboard-card-header,
body.c-dark-theme .mfu-dashboard-card-header {
  background: linear-gradient(90deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.95));
  border-bottom-color: rgba(148, 163, 184, 0.3);
}

[data-coreui-theme='dark'] .mfu-dashboard-card-title,
body.c-dark-theme .mfu-dashboard-card-title {
  color: #f8fafc;
}

[data-coreui-theme='dark'] .mfu-count-badge,
body.c-dark-theme .mfu-count-badge {
  background: rgba(56, 189, 248, 0.14);
  color: #bae6fd;
  border-color: rgba(56, 189, 248, 0.36);
}

[data-coreui-theme='dark'] .mfu-card-body-tight,
body.c-dark-theme .mfu-card-body-tight {
  background: #0f172a;
}

[data-coreui-theme='dark'] .mfu-table-surface,
body.c-dark-theme .mfu-table-surface {
  background: #111827;
  border-color: rgba(148, 163, 184, 0.35);
}

[data-coreui-theme='dark'] .mfu-table-surface::v-deep .table thead th,
body.c-dark-theme .mfu-table-surface::v-deep .table thead th {
  background: linear-gradient(90deg, #1f2937, #111827) !important;
  color: #f9fafb !important;
  border-right-color: rgba(148, 163, 184, 0.35) !important;
}

[data-coreui-theme='dark'] .mfu-table-surface::v-deep .table tbody td,
body.c-dark-theme .mfu-table-surface::v-deep .table tbody td {
  background: #111827;
  color: #e5e7eb;
  border-right-color: rgba(148, 163, 184, 0.24) !important;
  border-bottom-color: rgba(148, 163, 184, 0.24) !important;
}

[data-coreui-theme='dark'] .mfu-table-surface::v-deep .table-striped tbody tr:nth-of-type(odd),
body.c-dark-theme .mfu-table-surface::v-deep .table-striped tbody tr:nth-of-type(odd) {
  background-color: #0f172a;
}

[data-coreui-theme='dark'] .mfu-table-surface::v-deep .table tbody tr:hover,
body.c-dark-theme .mfu-table-surface::v-deep .table tbody tr:hover {
  background: rgba(51, 65, 85, 0.75) !important;
}

[data-coreui-theme='dark'] .mfu-table-surface::v-deep .small,
body.c-dark-theme .mfu-table-surface::v-deep .small {
  color: #cbd5e1 !important;
}

[data-coreui-theme='dark'] .mfu-table-surface::v-deep .btn-outline-primary,
body.c-dark-theme .mfu-table-surface::v-deep .btn-outline-primary {
  color: #fde68a;
  border-color: #f59e0b;
}

[data-coreui-theme='dark'] .mfu-table-surface::v-deep .btn-outline-primary:hover,
body.c-dark-theme .mfu-table-surface::v-deep .btn-outline-primary:hover {
  color: #111827;
  background: #fbbf24;
  border-color: #fbbf24;
}

[data-coreui-theme='dark'] .mfu-table-footer,
body.c-dark-theme .mfu-table-footer {
  background: linear-gradient(90deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
  border-top-color: rgba(148, 163, 184, 0.3);
}

[data-coreui-theme='dark'] .mfu-table-footer__left,
body.c-dark-theme .mfu-table-footer__left {
  color: #d1d5db;
}

[data-coreui-theme='dark'] .mfu-table-footer__right::v-deep .page-link,
body.c-dark-theme .mfu-table-footer__right::v-deep .page-link {
  background: #111827;
  color: #e5e7eb;
  border-color: rgba(148, 163, 184, 0.4);
}

[data-coreui-theme='dark'] .mfu-table-footer__right::v-deep .page-item.active .page-link,
body.c-dark-theme .mfu-table-footer__right::v-deep .page-item.active .page-link {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

[data-coreui-theme='dark'] .mfu-header-tools::v-deep .form-control,
body.c-dark-theme .mfu-header-tools::v-deep .form-control,
[data-coreui-theme='dark'] .mfu-header-tools::v-deep .custom-select,
body.c-dark-theme .mfu-header-tools::v-deep .custom-select,
[data-coreui-theme='dark'] .mfu-per-page-select,
body.c-dark-theme .mfu-per-page-select {
  background: #111827;
  border-color: rgba(148, 163, 184, 0.45);
  color: #e5e7eb;
}

[data-coreui-theme='dark'] .mfu-header-tools::v-deep .form-control:focus,
body.c-dark-theme .mfu-header-tools::v-deep .form-control:focus,
[data-coreui-theme='dark'] .mfu-header-tools::v-deep .custom-select:focus,
body.c-dark-theme .mfu-header-tools::v-deep .custom-select:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.22);
  border-color: rgba(59, 130, 246, 0.65);
}

[data-coreui-theme='dark'] .mfu-header-tools::v-deep select option,
body.c-dark-theme .mfu-header-tools::v-deep select option {
  background: #111827;
  color: #e5e7eb;
}

[data-coreui-theme='dark'] .committee-selection-summary,
body.c-dark-theme .committee-selection-summary {
  background: #0f172a;
  border-color: rgba(148, 163, 184, 0.35);
}

[data-coreui-theme='dark'] .committee-user-item,
body.c-dark-theme .committee-user-item {
  border-color: rgba(148, 163, 184, 0.32) !important;
  background: #111827;
}

[data-coreui-theme='dark'] .committee-user-item:hover,
body.c-dark-theme .committee-user-item:hover {
  background: #1f2937;
  border-color: rgba(148, 163, 184, 0.5) !important;
}

[data-coreui-theme='dark'] .committee-user-item.is-selected,
body.c-dark-theme .committee-user-item.is-selected {
  background: rgba(30, 58, 138, 0.35);
  border-color: rgba(96, 165, 250, 0.5) !important;
}

[data-coreui-theme='dark'] .committee-modal-note,
body.c-dark-theme .committee-modal-note {
  color: #9ca3af !important;
}

[data-coreui-theme='dark'] .committee-search-field::v-deep .form-control,
body.c-dark-theme .committee-search-field::v-deep .form-control {
  background: #0f172a;
  border-color: rgba(148, 163, 184, 0.45);
  color: #e5e7eb;
}

[data-coreui-theme='dark'] .committee-search-field::v-deep .form-control::placeholder,
body.c-dark-theme .committee-search-field::v-deep .form-control::placeholder {
  color: #94a3b8;
}

[data-coreui-theme='dark'] .admin-dashboard-page::v-deep .modal-content,
body.c-dark-theme .admin-dashboard-page::v-deep .modal-content {
  background: #0f172a;
  border: 1px solid rgba(148, 163, 184, 0.35);
  color: #e5e7eb;
}

[data-coreui-theme='dark'] .admin-dashboard-page::v-deep .modal-header,
body.c-dark-theme .admin-dashboard-page::v-deep .modal-header,
[data-coreui-theme='dark'] .admin-dashboard-page::v-deep .modal-footer,
body.c-dark-theme .admin-dashboard-page::v-deep .modal-footer {
  border-color: rgba(148, 163, 184, 0.25);
}

[data-coreui-theme='dark'] .admin-dashboard-page::v-deep .modal-title,
body.c-dark-theme .admin-dashboard-page::v-deep .modal-title {
  color: #f8fafc;
}

[data-coreui-theme='dark'] .admin-dashboard-page::v-deep .form-control,
body.c-dark-theme .admin-dashboard-page::v-deep .form-control,
[data-coreui-theme='dark'] .admin-dashboard-page::v-deep .custom-select,
body.c-dark-theme .admin-dashboard-page::v-deep .custom-select {
  background: #111827;
  border-color: rgba(148, 163, 184, 0.45);
  color: #e5e7eb;
}

[data-coreui-theme='dark'] .admin-dashboard-page::v-deep .form-control::placeholder,
body.c-dark-theme .admin-dashboard-page::v-deep .form-control::placeholder {
  color: #94a3b8;
}

[data-coreui-theme='dark'] .admin-dashboard-page::v-deep textarea.form-control,
body.c-dark-theme .admin-dashboard-page::v-deep textarea.form-control {
  background: #111827;
  color: #e5e7eb;
}

[data-coreui-theme='dark'] .admin-dashboard-page::v-deep .custom-select option,
body.c-dark-theme .admin-dashboard-page::v-deep .custom-select option,
[data-coreui-theme='dark'] .admin-dashboard-page::v-deep select option,
body.c-dark-theme .admin-dashboard-page::v-deep select option {
  background: #111827;
  color: #e5e7eb;
}

[data-coreui-theme='dark'] .admin-dashboard-page::v-deep .table td.c-datatable-empty,
body.c-dark-theme .admin-dashboard-page::v-deep .table td.c-datatable-empty {
  color: #9ca3af;
}

@media (max-width: 991.98px) {
  .summary-card {
    min-height: 102px;
  }

  .summary-card-bg::before {
    background-size: 108px 108px;
    background-position: calc(100% + 4px) -8px;
    opacity: 0.2;
  }
}
</style>
