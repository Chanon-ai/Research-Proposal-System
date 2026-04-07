<template>
  <div class="page-content">

    <CRow class="mb-4">
      <CCol sm="6" lg="3">
        <div
          class="widget-click-area widget-all"
          @click="clearFilter"
          :class="{
            'is-active': !activeFilter,
            'is-dimmed': Boolean(activeFilter)
          }"
        >
          <CWidgetDropdown class="user-widget-card" color="gradient-primary" :header="String(stats.all || 0)" :text="$t('userDashboard.cards.all')">
            <template #footer>
              <div class="widget-footer-spacer"></div>
            </template>
          </CWidgetDropdown>
        </div>
      </CCol>

      <CCol sm="6" lg="3">
        <div
          class="widget-click-area widget-in-progress"
          @click="setFilter('in_progress')"
          :class="{
            'is-active': activeFilter === 'in_progress',
            'is-dimmed': activeFilter && activeFilter !== 'in_progress'
          }"
        >
          <CWidgetDropdown class="user-widget-card" color="gradient-info" :header="String(stats.inProgress || 0)" :text="$t('userDashboard.cards.inProgress')">
            <template #footer>
              <div class="widget-footer-spacer"></div>
            </template>
          </CWidgetDropdown>
        </div>
      </CCol>

      <CCol sm="6" lg="3">
        <div
          class="widget-click-area widget-approved"
          @click="setFilter('approved')"
          :class="{
            'is-active': activeFilter === 'approved',
            'is-dimmed': activeFilter && activeFilter !== 'approved'
          }"
        >
          <CWidgetDropdown class="user-widget-card" color="gradient-success" :header="String(stats.approved || 0)" :text="$t('userDashboard.cards.approved')">
            <template #footer>
              <div class="widget-footer-spacer"></div>
            </template>
          </CWidgetDropdown>
        </div>
      </CCol>

      <CCol sm="6" lg="3">
        <div
          class="widget-click-area widget-rejected"
          @click="setFilter('rejected')"
          :class="{
            'is-active': activeFilter === 'rejected',
            'is-dimmed': activeFilter && activeFilter !== 'rejected'
          }"
        >
          <CWidgetDropdown class="user-widget-card" color="gradient-danger" :header="String(stats.rejected || 0)" :text="$t('userDashboard.cards.rejected')">
            <template #footer>
              <div class="widget-footer-spacer"></div>
            </template>
          </CWidgetDropdown>
        </div>
      </CCol>
    </CRow>

    <div v-if="false" class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <span style="font-size:15px;font-weight:500">
          {{ filterLabel }}
        </span>
        <CBadge
          v-if="activeFilter"
          color="primary"
          class="ml-2"
          style="font-size:12px"
        >
          {{ $t('status.itemsCount', { count: filteredProposals.length }) }}
        </CBadge>
      </div>

      <CButton
        v-if="activeFilter"
        color="secondary"
        size="sm"
        @click="clearFilter"
      >
        <CIcon name="cil-chevron-right" class="mr-1" /> {{ $t('userDashboard.actions.clearFilter') }}
      </CButton>
    </div>

    <CCard class="no-table-divider reviewer-dashboard-card user-dashboard-table-card">
      <CCardHeader class="dashboard-card-header">
        <div class="dashboard-card-header__row">
          <div class="dashboard-card-title">
            {{ filterLabel }}
            <CBadge v-if="activeFilter" class="ml-2 user-count-badge">
              {{ $t('status.itemsCount', { count: filteredProposals.length }) }}
            </CBadge>
          </div>
          <div class="header-tools">
            <CInput
              class="search-input"
              :placeholder="$t('userDashboard.search.placeholder')"
              :aria-label="$t('userDashboard.search.ariaLabel')"
              v-model="searchQuery"
            />
            <CButton
              v-if="activeFilter"
              color="secondary"
              size="sm"
              class="clear-filter-btn"
              @click="clearFilter"
            >
              <CIcon name="cil-chevron-right" class="mr-1" /> {{ $t('userDashboard.actions.clearFilter') }}
            </CButton>
          </div>
        </div>
      </CCardHeader>
      <CCardBody class="card-body-tight">
        <div v-if="loading" class="state-box">
          <div class="spinner"></div>
          <div class="state-text">{{ $t('userDashboard.states.loading') }}</div>
        </div>

        <div v-else-if="fetchError" class="state-box">
          <div class="state-text">{{ $t('userDashboard.states.loadError', { error: fetchError }) }}</div>
          <div style="margin-top:10px;"><button class="btn-quick btn-success" @click="retryFetch"><CIcon name="cil-chevron-right" class="mr-1" /> {{ $t('userDashboard.actions.retry') }}</button></div>
        </div>

        <div v-else class="table-surface">
          <CDataTable
            :items="displayItems"
            :fields="tableFields"
            :items-per-page="perPage"
            :active-page="activePage"
            :sorter="{ resetable: false }"
            :sorter-value.sync="sorterValue"
            hover
            striped
          >
            <template #proposalCode="{ item }">
              <td class="proposal-code-cell">
                {{ item.proposalCode || '-' }}
              </td>
            </template>

            <template #projectTitleTh="{ item }">
              <td class="project-info-cell">
                <div class="project-meta">
                  <div class="project-title">{{ item.projectTitleTh || item.projectTitleEn || $t('userDashboard.table.noTitle') }}</div>
                  <div class="project-owner">{{ item.projectLeaderName || '-' }}</div>
                  <div v-if="getFundingTypeDisplay(item)" class="project-funding-type">{{ getFundingTypeDisplay(item) }}</div>
                  <div class="project-budget-line">{{ $t('userDashboard.table.proposedBudget') }}: {{ formatBudgetAmount(item.budgetUsedAmount) }}</div>
                </div>
              </td>
            </template>

            <template #currentStatus="{ item }">
              <td class="current-status-cell">
                <CBadge class="mb-2 status-badge" :color="getStatusBadgeColor(item.currentStatus)">
                  {{ getStatusLabel(item) }}
                </CBadge>
                <div class="status-progress-label">
                  {{ getProgressLabel(item) }}
                </div>
                <div class="status-last-action-time">
                  {{ getLastActionElapsedLabel(item) }}
                </div>
              </td>
            </template>

            <template #action="{ item }">
              <td class="action-body-cell" @click.stop>
                <div class="action-cell">
                  <CButton
                    v-if="canAccessResearchForm"
                    size="sm"
                    color="primary"
                    class="mr-2 action-btn action-btn-view"
                    @click.stop="viewDocument(item)"
                  >
                    <CIcon name="cil-file" class="mr-1" />
                    {{ $t('userDashboard.actions.viewDocument') }}
                  </CButton>
                  <CButton
                    v-if="canDeleteDocument(item)"
                    size="sm"
                    color="danger"
                    variant="outline"
                    class="action-btn"
                    :disabled="isDeleting(item)"
                    @click.stop="deleteDocument(item)"
                  >
                    <CIcon name="cil-trash" class="mr-1" />
                    {{ isDeleting(item) ? $t('userDashboard.actions.deleting') : $t('userDashboard.actions.deleteDocument') }}
                  </CButton>
                </div>
              </td>
            </template>

          </CDataTable>
          <div v-if="displayItems.length === 0" class="text-muted text-center py-4">
            {{ $t('userDashboard.table.noResults') }}
          </div>
          <div class="table-footer">
            <div class="table-footer__left">
              <span class="table-footer__label">{{ $t('userDashboard.table.perPage') }}</span>
              <select v-model.number="perPage" class="form-control form-control-sm per-page-select" :aria-label="$t('userDashboard.table.perPage')">
                <option v-for="n in perPageOptions" :key="n" :value="n">{{ n }}</option>
              </select>
              <span class="table-footer__suffix">{{ $t('userDashboard.table.itemsSuffix') }}</span>
            </div>
            <div class="table-footer__right">
              <CPagination
                :pages="pageCount"
                :active-page.sync="activePage"
                align="end"
                :arrows="true"
                :double-arrows="true"
                size="sm"
              />
            </div>
          </div>
        </div>
      </CCardBody>
    </CCard>

    <button v-if="canAccessResearchForm" class="fab" :title="$t('userDashboard.actions.createProject')" @click="onAdd"><CIcon name="cil-plus" /></button>
  </div>
</template>

<script>
import Service from '@/service/api'
import Swal from 'sweetalert2'
import {
  APPROVED_PROPOSAL_STATUSES,
  FILTER_IN_PROGRESS_STATUSES,
  IN_PROGRESS_STATUSES,
  PROPOSAL_STATUSES,
  PROPOSAL_STATUS_COLORS_COREUI_BADGE as STATUS_BADGE_COLORS,
  PROPOSAL_STATUS_LABELS_TH_RESEARCHER as STATUS_LABEL_MAP,
  STATUS_STEP_MAP,
  normalizeProposalStatus
} from '@/ResearchFormRS/constants/proposalWorkflow'
import { loadResearchFormRuntimeConfigs } from '@/ResearchFormRS/utils/researchConfigRuntime'
import {
  createDefaultFundingBudgetConfig,
  findFundingSubTypeConfig,
  getFundingTypeLabel,
  readFundingBudgetConfigFromFallbackStorage
} from '@/ResearchFormRS/utils/fundingBudgetConfig'
import {
  createDefaultRolePageAccessConfig,
  isRoleAllowedForPath
} from '@/ResearchFormRS/utils/rolePageAccessConfig'
import {
  loadRolePageAccessRuntimeConfig,
  mapRoleForResearchAccess
} from '@/ResearchFormRS/utils/rolePageAccessRuntime'

export default {
  name: "UserDashboard",
  data() {
    return {
      allProjects: [],
      loading: true,
      fetchError: null,
      searchQuery: '',
      perPage: 5,
      perPageOptions: [5, 10, 20, 50],
      activePage: 1,
      sorterValue: { column: 'latestStatusUpdatedAt', asc: false },
      deletingProposalIds: {},
      activeFilter: null,
      filterGroups: {
        in_progress: [...FILTER_IN_PROGRESS_STATUSES],
        approved: [...APPROVED_PROPOSAL_STATUSES],
        rejected: ['rejected'],
      },
      workflowSteps: [],
      fundingBudgetConfig: createDefaultFundingBudgetConfig(),
      rolePageAccessConfig: createDefaultRolePageAccessConfig()
    };
  },

  async mounted() {
    await loadResearchFormRuntimeConfigs()
    this.loadFundingBudgetConfig()
    this.workflowSteps = this.buildWorkflowSteps()
    this.$forceUpdate()
    await Promise.all([
      this.fetchRolePageAccessConfig(),
      this.fetchResearch()
    ]);
  },

  computed: {
    currentResearchRole() {
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
    canAccessResearchForm() {
      return isRoleAllowedForPath(
        this.rolePageAccessConfig,
        '/research-form',
        this.currentResearchRole,
        { defaultAllow: true }
      )
    },
    currentUserId() {
      const user = this.$store && this.$store.getters
        ? this.$store.getters['Authentication/currentUser']
        : null;
      const userId = user && (user._id || user.id);
      return userId ? String(userId) : null;
    },

    proposals() {
      return this.allProjects;
    },

    tableFields() {
      return [
        {
          key: 'proposalCode',
          label: this.$t('userDashboard.table.proposalCode'),
          _style: 'width:170px; text-align:center;',
          _classes: 'proposal-code-column'
        },
        {
          key: 'projectTitleTh',
          label: this.$t('userDashboard.table.projectTitleAndOwner'),
          _style: 'min-width:260px;',
          _classes: 'project-info-column'
        },
        {
          key: 'currentStatus',
          label: this.$t('userDashboard.table.status'),
          _style: 'width:360px; text-align:center;'
        },
        {
          key: 'action',
          label: this.$t('userDashboard.table.action'),
          _style: 'width:220px; text-align:center;',
          _classes: 'action-column',
          sorter: false,
          filter: false
        }
      ];
    },

    stats() {
      const all = this.proposals;
      return {
        all: all.length,
        inProgress: all.filter(p => FILTER_IN_PROGRESS_STATUSES.includes(String(p.currentStatus || '').toLowerCase())).length,
        approved: all.filter(p => APPROVED_PROPOSAL_STATUSES.includes(String(p.currentStatus || '').toLowerCase())).length,
        rejected: all.filter(p => String(p.currentStatus || '').toLowerCase() === 'rejected').length,
      };
    },

    filteredProposals() {
      if (!this.activeFilter) {
        return this.proposals;
      }
      const statuses = this.filterGroups[this.activeFilter] || [];
      return this.proposals.filter(p => statuses.includes(p.currentStatus));
    },

    filterLabel() {
      const labels = {
        in_progress: this.$t('userDashboard.cards.inProgress'),
        approved: this.$t('userDashboard.cards.approved'),
        rejected: this.$t('userDashboard.cards.rejected'),
      };
      return this.activeFilter
        ? this.$t('userDashboard.filter.filteredBy', { label: labels[this.activeFilter] || '-' })
        : this.$t('userDashboard.filter.allProjects');
    },

    displayItems() {
      const q = String(this.searchQuery || '').trim().toLowerCase();
      const filteredItems = !q
        ? this.filteredProposals
        : this.filteredProposals.filter(item => {
        const haystack = [
          item.projectTitleTh,
          item.projectTitleEn,
          item.proposalCode,
          item.projectLeaderName,
          this.formatBudgetAmount(item.budgetUsedAmount),
          this.getStatusLabel(item),
          this.getProgressLabel(item.currentStatus),
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      });

      return this.sortItemsByLatestStatus(filteredItems);
    },

    pageCount() {
      const total = this.displayItems.length;
      const per = Number(this.perPage) || 1;
      return Math.max(1, Math.ceil(total / Math.max(1, per)));
    },
  },

  watch: {
    perPage() {
      this.activePage = 1;
    },
    searchQuery() {
      this.activePage = 1;
    },
    displayItems() {
      if (this.activePage > this.pageCount) this.activePage = 1;
    },
  },

  methods: {
    buildWorkflowSteps() {
      return PROPOSAL_STATUSES.map((key) => ({
        key,
        label: this.translateStatusLabel(key),
        step: STATUS_STEP_MAP[key] || 0
      }))
    },
    loadFundingBudgetConfig() {
      const fallbackConfig = readFundingBudgetConfigFromFallbackStorage()
      this.fundingBudgetConfig = Array.isArray(fallbackConfig) && fallbackConfig.length > 0
        ? fallbackConfig
        : createDefaultFundingBudgetConfig()
    },
    async fetchRolePageAccessConfig() {
      try {
        const config = await loadRolePageAccessRuntimeConfig()
        if (Array.isArray(config) && config.length > 0) {
          this.rolePageAccessConfig = config
        }
      } catch (error) {
        void error
      }
    },
    setFilter(filterKey) {
      if (this.activeFilter === filterKey) {
        this.activeFilter = null;
      } else {
        this.activeFilter = filterKey;
      }
    },

    clearFilter() {
      this.activeFilter = null;
    },

    async fetchResearch() {
      this.loading = true;
      this.fetchError = null;
      try {
        const response = await Service.research.list({
          page: 1,
          limit: 300,
          sortBy: 'latestStatusUpdatedAt',
          sortOrder: this.sorterValue && this.sorterValue.asc === false ? 'desc' : 'asc'
        });
        const payload = response && response.data ? response.data : null;
        let data = [];
        if (Array.isArray(payload)) {
          data = payload;
        } else if (payload && payload.data) {
          const wrapped = payload.data;
          if (Array.isArray(wrapped.items)) {
            data = wrapped.items;
          } else if (Array.isArray(wrapped.proposals)) {
            data = wrapped.proposals;
          } else if (Array.isArray(wrapped.data)) {
            data = wrapped.data;
          } else if (Array.isArray(wrapped)) {
            data = wrapped;
          }
        }

        const mine = this.currentUserId
          ? data.filter(item => this.extractApplicantUserId(item) === this.currentUserId)
          : data;

        const deduped = Array.from(
          new Map((mine || []).map(item => [String(item && item._id ? item._id : ''), item]))
            .values()
        ).filter(item => item && item._id);

        this.allProjects = deduped.map(item => this.mapItem(item));
      } catch (err) {
        console.error("fetchResearch error:", err);
        this.allProjects = [];
        this.fetchError = err.message || String(err);
      } finally {
        this.loading = false;
      }
    },

    retryFetch() {
      this.fetchResearch();
    },

    sortItemsByLatestStatus(items) {
      const rows = Array.isArray(items) ? [...items] : [];
      const sorter = this.sorterValue && typeof this.sorterValue === 'object' ? this.sorterValue : {};
      const column = sorter.column || 'latestStatusUpdatedAt';
      const ascending = sorter.asc === true;

      if (column !== 'latestStatusUpdatedAt') {
        return rows;
      }

      const getTimestamp = (item) => {
        const value = item && (item.lastStatusActionAt || item.latestStatusUpdatedAt || item.currentStatusUpdatedAt || item.statusUpdatedAt || item.updatedAt || item.createdAt);
        const ts = value ? new Date(value).getTime() : 0;
        return Number.isFinite(ts) ? ts : 0;
      };

      return rows.sort((left, right) => {
        const leftTs = getTimestamp(left);
        const rightTs = getTimestamp(right);
        if (leftTs === rightTs) {
          const leftCode = String(left && left.proposalCode ? left.proposalCode : '');
          const rightCode = String(right && right.proposalCode ? right.proposalCode : '');
          return leftCode.localeCompare(rightCode);
        }
        return ascending ? leftTs - rightTs : rightTs - leftTs;
      });
    },

    extractApplicantUserId(item) {
      const applicant = item && item.applicantUserId ? item.applicantUserId : null;
      if (!applicant) return '';
      if (typeof applicant === 'string' || typeof applicant === 'number') {
        return String(applicant);
      }
      if (typeof applicant === 'object') {
        if (applicant._id) return String(applicant._id);
        if (applicant.id) return String(applicant.id);
      }
      return '';
    },

    parseBudgetNumber(value) {
      if (value === null || value === undefined || value === '') return 0;
      if (typeof value === 'number') return Number.isFinite(value) ? Math.max(0, value) : 0;
      const normalized = String(value).replace(/,/g, '').replace(/[^\d.-]/g, '').trim();
      if (!normalized) return 0;
      const parsed = Number(normalized);
      if (!Number.isFinite(parsed)) return 0;
      return Math.max(0, parsed);
    },

    resolveSnapshotBudgetTotal(snapshot) {
      const budget = snapshot && typeof snapshot === 'object' && snapshot.budget && typeof snapshot.budget === 'object'
        ? snapshot.budget
        : null;
      if (!budget) return null;

      if (Object.prototype.hasOwnProperty.call(budget, 'grandTotal')) {
        return this.parseBudgetNumber(budget.grandTotal);
      }

      const categories = Array.isArray(budget.categories) ? budget.categories : [];
      const computed = categories.reduce((sum, category) => {
        const items = Array.isArray(category && category.items) ? category.items : [];
        const itemTotal = items.reduce((itemSum, row) => itemSum + this.parseBudgetNumber(row && row.total), 0);
        return sum + itemTotal;
      }, 0);
      return this.parseBudgetNumber(computed);
    },

    resolveBudgetUsedAmount(item) {
      const source = item && typeof item === 'object' ? item : {};
      const directKeys = ['budgetUsed', 'usedBudget', 'spentBudget', 'budgetSpent', 'actualCost', 'expenseTotal', 'budgetTotal'];
      for (let index = 0; index < directKeys.length; index += 1) {
        const key = directKeys[index];
        if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
        return this.parseBudgetNumber(source[key]);
      }

      const snapshotTotal = this.resolveSnapshotBudgetTotal(source.formSnapshotJson || {});
      if (snapshotTotal !== null) return this.parseBudgetNumber(snapshotTotal);
      return 0;
    },

    formatBudgetAmount(value) {
      const amount = this.parseBudgetNumber(value);
      const locale = this.$i18n && this.$i18n.locale === 'en' ? 'en-US' : 'th-TH';
      return amount.toLocaleString(locale, { maximumFractionDigits: 2 });
    },

    resolveFundingTypeValue(item) {
      const source = item && typeof item === 'object' ? item : {}
      const snapshot = source.formSnapshotJson && typeof source.formSnapshotJson === 'object'
        ? source.formSnapshotJson
        : {}
      return String(source.fundingType || snapshot.fundingType || '').trim()
    },

    resolveFundingSubTypeValue(item) {
      const source = item && typeof item === 'object' ? item : {}
      const snapshot = source.formSnapshotJson && typeof source.formSnapshotJson === 'object'
        ? source.formSnapshotJson
        : {}
      return String(source.fundingSubType || snapshot.fundingSubType || '').trim()
    },

    getFundingTypeDisplay(item) {
      const fundingType = this.resolveFundingTypeValue(item)
      if (!fundingType) return ''

      const fundingTypeLabel = getFundingTypeLabel(this.fundingBudgetConfig, fundingType, fundingType)
      const fundingSubType = this.resolveFundingSubTypeValue(item)
      if (!fundingSubType) return `${this.$t('userDashboard.table.fundingType')}: ${fundingTypeLabel}`

      const subType = findFundingSubTypeConfig(this.fundingBudgetConfig, fundingType, fundingSubType)
      const fundingSubTypeLabel = String(subType && subType.label ? subType.label : fundingSubType).trim()
      return `${this.$t('userDashboard.table.fundingType')}: ${fundingTypeLabel} / ${fundingSubTypeLabel}`
    },

    mapItem(item) {
      const applicant = item && item.applicantUserId && typeof item.applicantUserId === 'object'
        ? item.applicantUserId
        : null;
      return {
        _id: item._id,
        proposalCode: item.proposalCode || '-',
        projectTitleTh: item.projectTitleTh || '',
        projectTitleEn: item.projectTitleEn || '',
        projectLeaderName: item.projectLeaderName || (applicant && applicant.fullName ? applicant.fullName : '-'),
        fundingType: this.resolveFundingTypeValue(item),
        fundingSubType: this.resolveFundingSubTypeValue(item),
        budgetUsedAmount: this.resolveBudgetUsedAmount(item),
        lastStatusActionAt: item.lastStatusActionAt || null,
        latestStatusUpdatedAt: item.lastStatusActionAt || item.currentStatusUpdatedAt || item.statusUpdatedAt || item.updatedAt || item.createdAt || null,
        submittedAt: item.submittedAt,
        updatedAt: item.updatedAt,
        createdAt: item.createdAt,
        currentStatus: normalizeProposalStatus(item && item.currentStatus) || 'draft',
        roundNo: Number(item && (item.currentRound || item.roundNo || item.round) ? (item.currentRound || item.roundNo || item.round) : 0) || null
      };
    },

    inferStage(item) {
      const status = String(item && item.currentStatus ? item.currentStatus : '').toLowerCase();
      if (status === 'draft') return 'DRAFT';
      if (status === 'revision_requested') return 'NEED_REVISION';
      if (status === 'approved' || status === 'announced') return 'APPROVED';
      if (status === 'rejected') return 'REJECTED';
      if (IN_PROGRESS_STATUSES.includes(status)) return 'SUBMITTED';
      return 'IN_REVIEW';
    },

    deriveRoundNo(itemOrStatus) {
      const item = itemOrStatus && typeof itemOrStatus === 'object' ? itemOrStatus : null
      const status = String(item ? item.currentStatus : itemOrStatus || '').toLowerCase()
      const directRound = Number(item && (item.roundNo || item.currentRound || item.round)
        ? (item.roundNo || item.currentRound || item.round)
        : 0)
      if (Number.isFinite(directRound) && directRound > 0) return directRound
      if (status === 'second_round_review' || status.includes('second_round')) return 2
      return 1
    },

    getStatusLabel(itemOrStatus) {
      const item = itemOrStatus && typeof itemOrStatus === 'object' ? itemOrStatus : null
      const key = String(item ? item.currentStatus : itemOrStatus || '').toLowerCase()
      const roundNo = this.deriveRoundNo(itemOrStatus)

      if (key === 'under_review' || key === 'second_round_review') {
        return this.$t('userDashboard.status.roundReview', { round: roundNo })
      }
      return this.translateStatusLabel(key)
    },

    translateStatusLabel(key) {
      const normalizedKey = String(key || '').toLowerCase()
      const i18nKey = `status.${normalizedKey}`
      const translated = this.$t(i18nKey)
      if (translated && translated !== i18nKey) return translated
      return STATUS_LABEL_MAP[normalizedKey] || normalizedKey || this.$t('status.submitted')
    },

    getStatusBadgeColor(status) {
      const key = normalizeProposalStatus(status)
      return STATUS_BADGE_COLORS[key] || STATUS_BADGE_COLORS.submitted || 'primary'
    },

    getProgressPercent(status) {
      const key = String(status || '').toLowerCase();
      const currentStep = Number(STATUS_STEP_MAP[key] || 0);
      if (!currentStep) return 0;
      const totalSteps = 10;
      const percent = (currentStep / totalSteps) * 100;
      return Math.max(0, Math.min(100, Math.round(percent)));
    },

    isAnimatedStatus(status) {
      const key = String(status || '').toLowerCase();
      return IN_PROGRESS_STATUSES.includes(key) && key !== 'revision_requested';
    },
    getProgressLabel(itemOrStatus) {
      const item = itemOrStatus && typeof itemOrStatus === 'object' ? itemOrStatus : null;
      const key = String(item ? item.currentStatus : itemOrStatus || '').toLowerCase();
      const roundNo = this.deriveRoundNo(itemOrStatus)
      const researcherName = item && item.projectLeaderName ? String(item.projectLeaderName).trim() : '';
      const ownerName = researcherName || this.$t('userDashboard.progress.ownerFallback');
      const progressMap = {
        draft: this.$t('userDashboard.progress.draft', { name: ownerName }),
        pending_confirm: this.$t('userDashboard.progress.pendingConfirm'),
        submitted: this.$t('userDashboard.progress.submitted'),
        faculty_review_pending: this.$t('userDashboard.progress.facultyReviewPending'),
        faculty_approved: this.$t('userDashboard.progress.facultyApproved'),
        faculty_rejected: this.$t('userDashboard.progress.facultyRejected'),
        office_received: this.$t('userDashboard.progress.officeReceived'),
        document_checking: this.$t('userDashboard.progress.documentChecking'),
        assigned_to_committee: this.$t('userDashboard.progress.assignedToCommittee'),
        under_review: this.$t('userDashboard.progress.underReview', { round: roundNo }),
        committee_valuated: this.$t('userDashboard.progress.committeeValuated'),
        revision_requested: this.$t('userDashboard.progress.revisionRequested', { name: ownerName }),
        resubmitted: this.$t('userDashboard.progress.resubmitted'),
        second_round_review: this.$t('userDashboard.progress.secondRoundReview', { round: roundNo }),
        approved: this.$t('userDashboard.progress.approved'),
        rejected: this.$t('userDashboard.progress.rejected'),
        announced: this.$t('userDashboard.progress.announced')
      };
      return progressMap[key] || this.$t('userDashboard.progress.default');
    },
    getProgressText(status) {
      const key = String(status || '').toLowerCase();
      const pct = this.getProgressPercent(key);
      if (key === 'approved' || key === 'announced') return this.$t('userDashboard.progressText.approved');
      if (key === 'rejected') return this.$t('userDashboard.progressText.rejected');
      if (key === 'revision_requested') return this.$t('userDashboard.progressText.revisionRequested');
      return `${pct}%`;
    },

    getSegmentWidth(segmentStatus, currentStatus) {
      const order = PROPOSAL_STATUSES;
      const currentIdx = order.indexOf(String(currentStatus || '').toLowerCase());
      const segmentIdx = order.indexOf(String(segmentStatus || '').toLowerCase());
      if (segmentIdx < 0 || currentIdx < 0) return 0;
      if (segmentIdx <= currentIdx) return 11;
      return 0;
    },

    toValidDate(value) {
      if (!value) return null;
      const candidate = new Date(value);
      if (Number.isNaN(candidate.getTime())) return null;
      return candidate;
    },

    getLatestActionDate(item) {
      if (!item || typeof item !== 'object') return null;
      const candidates = [
        item.latestStatusUpdatedAt,
        item.lastStatusActionAt,
        item.currentStatusUpdatedAt,
        item.statusUpdatedAt,
        item.updatedAt,
        item.submittedAt,
        item.createdAt
      ];
      for (let index = 0; index < candidates.length; index += 1) {
        const parsed = this.toValidDate(candidates[index]);
        if (parsed) return parsed;
      }
      return null;
    },

    formatElapsedSince(dateValue) {
      const date = this.toValidDate(dateValue);
      if (!date) return this.$t('userDashboard.time.latestUnknown');

      const diffMs = Date.now() - date.getTime();
      if (diffMs < 60000) return this.$t('userDashboard.time.justNow');

      const minuteMs = 60 * 1000;
      const hourMs = 60 * minuteMs;
      const dayMs = 24 * hourMs;
      const weekMs = 7 * dayMs;
      const monthMs = 30 * dayMs;
      const yearMs = 365 * dayMs;
      const locale = this.$i18n && this.$i18n.locale === 'en' ? 'en' : 'th';
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

      if (diffMs < hourMs) return this.$t('userDashboard.time.latestPrefix', { value: rtf.format(-Math.floor(diffMs / minuteMs), 'minute') });
      if (diffMs < dayMs) return this.$t('userDashboard.time.latestPrefix', { value: rtf.format(-Math.floor(diffMs / hourMs), 'hour') });
      if (diffMs < weekMs) return this.$t('userDashboard.time.latestPrefix', { value: rtf.format(-Math.floor(diffMs / dayMs), 'day') });
      if (diffMs < monthMs) return this.$t('userDashboard.time.latestPrefix', { value: rtf.format(-Math.floor(diffMs / weekMs), 'week') });
      if (diffMs < yearMs) return this.$t('userDashboard.time.latestPrefix', { value: rtf.format(-Math.floor(diffMs / monthMs), 'month') });
      return this.$t('userDashboard.time.latestPrefix', { value: rtf.format(-Math.floor(diffMs / yearMs), 'year') });
    },

    getLastActionElapsedLabel(item) {
      return this.formatElapsedSince(this.getLatestActionDate(item));
    },

    viewDocument(item) {
      if (!item || !item._id) return;
      this.goToDetail(item._id);
    },

    canDeleteDocument(item) {
      const status = String(item && item.currentStatus ? item.currentStatus : '').toLowerCase();
      return status === 'draft';
    },

    isDeleting(item) {
      const id = item && item._id ? String(item._id) : '';
      return Boolean(id && this.deletingProposalIds[id]);
    },

    async deleteDocument(item) {
      const id = item && item._id ? String(item._id) : '';
      if (!id) return;

      if (!this.canDeleteDocument(item)) {
        await Swal.fire({
          icon: 'warning',
          title: this.$t('userDashboard.delete.notAllowedTitle') ,
          text: this.$t('userDashboard.delete.notAllowedText') ,
          confirmButtonText: this.$t('userDashboard.actions.ok')
        });
        return;
      }

      const code = item && item.proposalCode ? String(item.proposalCode) : '-';
      const confirmation = await Swal.fire({
        icon: 'warning',
        title: this.$t('userDashboard.delete.confirmTitle', { code }),
        text: this.$t('userDashboard.delete.confirmText'),
        showCancelButton: true,
        confirmButtonText: this.$t('userDashboard.actions.deleteDocument'),
        cancelButtonText: this.$t('userDashboard.actions.cancel'),
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        reverseButtons: true
      });
      if (!confirmation || !confirmation.isConfirmed) return;

      this.deletingProposalIds = {
        ...this.deletingProposalIds,
        [id]: true
      };

      try {
        await Service.proposal.deleteDraft(id);
        this.allProjects = this.allProjects.filter((row) => String(row && row._id ? row._id : '') !== id);
      } catch (err) {
        const apiMessage = err && err.response && err.response.data && err.response.data.message
          ? String(err.response.data.message)
          : '';
        await Swal.fire({
          icon: 'error',
          title: this.$t('userDashboard.delete.errorTitle'),
          text: apiMessage || this.$t('userDashboard.delete.errorText'),
          confirmButtonText: this.$t('userDashboard.actions.ok')
        });
      } finally {
        const nextMap = { ...this.deletingProposalIds };
        delete nextMap[id];
        this.deletingProposalIds = nextMap;
      }
    },

    goToDetail(id) {
      this.$router.push(`/research-form/${id}`);
    },

    onAdd() { this.$router.push({ name: 'ResearchForm', query: { new: '1' } }); },
  },
};
</script>

<style scoped>
.page-content {
  --mfu-red: #8c1515;
  --mfu-red-deep: #6b0f0f;
  --mfu-gold: #b58522;
  --mfu-ivory: #f7f1ea;
  --mfu-line: rgba(140, 21, 21, 0.14);
  --mfu-line-soft: rgba(140, 21, 21, 0.12);
  padding: 24px 28px;
  flex: 1;
  background: transparent;
  border-radius: 0;
}

/* Widget cards: keep CoreUI look and clip decorative background inside card */
.widget-click-area {
  position: relative;
  cursor: pointer;
  border-radius: 0.5rem;
  transform: scale(1);
  transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
}

.widget-click-area.is-active {
  transform: scale(1.03);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.85);
}

.widget-click-area.is-dimmed {
  opacity: 0.6;
}

.widget-click-area .user-widget-card {
  border: 0;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-bottom: 0;
  position: relative;
  isolation: isolate;
}

.widget-click-area .user-widget-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-repeat: no-repeat;
  background-size: 128px 128px;
  background-position: calc(100% + 8px) -10px;
  opacity: 0.23;
  z-index: 1;
  pointer-events: none;
}

.widget-click-area .user-widget-card ::v-deep(.card-body),
.widget-click-area .user-widget-card ::v-deep(.card-footer) {
  position: relative;
  z-index: 2;
}

.widget-click-area .user-widget-card ::v-deep(.card-body) {
  padding: 1.25rem 1.3rem 0;
}

.widget-click-area .user-widget-card ::v-deep(.text-value-lg) {
  font-size: clamp(2.5rem, 3.1vw, 3.5rem);
  line-height: 0.9;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 0.34rem;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.14);
}

.widget-click-area .user-widget-card ::v-deep(.text-value-lg + div) {
  font-size: clamp(1.1rem, 1.2vw, 1.24rem);
  line-height: 1.3;
  font-weight: 700;
  opacity: 0.96;
}

.widget-click-area .user-widget-card ::v-deep(.card-footer) {
  border-radius: 0 0 0.5rem 0.5rem;
  overflow: hidden;
}

.widget-all .user-widget-card::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect x='26' y='18' width='68' height='84' rx='10' fill='white' fill-opacity='0.9'/%3E%3Crect x='38' y='38' width='44' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3Crect x='38' y='52' width='40' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3Crect x='38' y='66' width='33' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3Cpath d='M84 18v20h20' fill='white' fill-opacity='0.72'/%3E%3C/svg%3E");
}

.widget-in-progress .user-widget-card::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='36' cy='36' r='11' fill='white' fill-opacity='0.9'/%3E%3Ccircle cx='84' cy='60' r='11' fill='white' fill-opacity='0.9'/%3E%3Ccircle cx='44' cy='88' r='11' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M44 36h28M75 41l8-5-8-5M75 84l8 5-8 5M54 83l23-16' stroke='%23000000' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.22' fill='none'/%3E%3C/svg%3E");
}

.widget-approved .user-widget-card::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M46 61l9 9 20-20' stroke='%23000000' stroke-width='8' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.24' fill='none'/%3E%3Ccircle cx='60' cy='60' r='44' stroke='white' stroke-opacity='0.42' stroke-width='5' fill='none'/%3E%3C/svg%3E");
}

.widget-rejected .user-widget-card::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='36' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M46 46l28 28M74 46L46 74' stroke='%23000000' stroke-width='7' stroke-linecap='round' stroke-opacity='0.24'/%3E%3Ccircle cx='60' cy='60' r='46' stroke='white' stroke-opacity='0.42' stroke-width='5' fill='none'/%3E%3C/svg%3E");
}

.widget-footer-spacer {
  position: relative;
  z-index: 2;
  height: 70px;
  width: 100%;
  border-radius: inherit;
}

@media (max-width: 991.98px) {
  .widget-click-area {
    margin-bottom: 0.25rem;
  }

  .widget-click-area .user-widget-card ::v-deep(.text-value-lg) {
    font-size: clamp(2.2rem, 5.6vw, 2.9rem);
  }

  .widget-click-area .user-widget-card ::v-deep(.text-value-lg + div) {
    font-size: 1.08rem;
  }

  .widget-click-area .user-widget-card::before {
    background-size: 104px 104px;
    background-position: calc(100% + 4px) -8px;
    opacity: 0.2;
  }
}

@media (max-width: 575.98px) {
  .page-content {
    padding: 18px 14px;
  }

  .widget-click-area.is-active {
    transform: scale(1.01);
  }

  .widget-click-area .user-widget-card ::v-deep(.text-value-lg) {
    font-size: 2.25rem;
  }

  .widget-click-area .user-widget-card ::v-deep(.text-value-lg + div) {
    font-size: 1.02rem;
  }
}

.state-box {
  text-align: center;
  padding: 48px 20px;
}

.status-progress-wrap {
  width: 100%;
  max-width: 340px;
  margin: 0;
}

.current-status-cell {
  text-align: center;
  vertical-align: middle;
  min-width: 360px;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
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

.status-progress-bar {
  --status-progress-color: #3b82f6;
  --status-progress-text-color: #ffffff;
  font-size: 10px;
  line-height: 16px;
}

.status-progress-bar ::v-deep(.progress) {
  margin-bottom: 0;
}

.status-progress-bar ::v-deep(.progress-bar) {
  background-color: var(--status-progress-color) !important;
  color: var(--status-progress-text-color) !important;
  white-space: nowrap;
  text-align: center;
  font-weight: 600;
}

.status-progress-bar /deep/ .progress,
.status-progress-bar >>> .progress,
.status-progress-bar::v-deep .progress {
  background: rgba(181, 133, 34, 0.12);
}

.status-badge {
  border: 1px solid transparent;
  font-weight: 600;
}

.user-dashboard-table-card {
  border-radius: 12px;
  overflow: hidden;
  background: transparent;
  border: 0;
}

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

.user-count-badge {
  background: rgba(140, 21, 21, 0.1);
  color: #6b0f0f;
  border: 1px solid rgba(140, 21, 21, 0.18);
  border-radius: 9999px;
  font-weight: 700;
  font-size: 12px;
}

.header-tools {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.header-tools /deep/ .form-group,
.header-tools >>> .form-group,
.header-tools::v-deep .form-group {
  margin: 0 !important;
}

.search-input {
  min-width: 220px;
}

.search-input /deep/ input,
.search-input >>> input,
.search-input::v-deep input {
  height: 34px;
  border-radius: 8px;
  border-color: rgba(181, 133, 34, 0.35);
}


.clear-filter-btn {
  background: rgba(181, 133, 34, 0.1);
  border-color: rgba(181, 133, 34, 0.22);
  color: #6b0f0f;
}

.clear-filter-btn:hover {
  background: rgba(181, 133, 34, 0.16);
  border-color: rgba(181, 133, 34, 0.3);
  color: #6b0f0f;
}

.table-surface {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(140, 21, 21, 0.14);
  overflow: hidden;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0.75rem 1rem;
  border-top: 1px solid rgba(140, 21, 21, 0.12);
  background: linear-gradient(90deg, rgba(140, 21, 21, 0.06), rgba(254, 194, 96, 0.14));
}

.table-footer__left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #374151;
  font-size: 0.875rem;
}

.per-page-select {
  width: 84px;
}

.table-footer__right {
  display: flex;
  justify-content: flex-end;
  margin-left: auto;
}

.table-footer__right /deep/ .pagination,
.table-footer__right >>> .pagination,
.table-footer__right::v-deep .pagination {
  margin: 0;
  justify-content: flex-end;
}

.table-footer__right /deep/ .page-link,
.table-footer__right >>> .page-link,
.table-footer__right::v-deep .page-link {
  color: #6b0f0f;
  border-color: rgba(140, 21, 21, 0.18);
}

.table-footer__right /deep/ .page-item.active .page-link,
.table-footer__right >>> .page-item.active .page-link,
.table-footer__right::v-deep .page-item.active .page-link {
  background: #8c1515;
  border-color: #8c1515;
  color: #ffffff;
}

.no-table-divider /deep/ .table,
.no-table-divider >>> .table,
.no-table-divider::v-deep .table,
.no-table-divider /deep/ .table thead th,
.no-table-divider >>> .table thead th,
.no-table-divider::v-deep .table thead th,
.no-table-divider /deep/ .table thead tr,
.no-table-divider >>> .table thead tr,
.no-table-divider::v-deep .table thead tr,
.no-table-divider /deep/ .table thead,
.no-table-divider >>> .table thead,
.no-table-divider::v-deep .table thead,
.no-table-divider /deep/ .table-responsive,
.no-table-divider >>> .table-responsive,
.no-table-divider::v-deep .table-responsive {
  border-top: 0 !important;
}

.no-table-divider /deep/ .table-responsive,
.no-table-divider >>> .table-responsive,
.no-table-divider::v-deep .table-responsive {
  box-shadow: none !important;
}

.no-table-divider /deep/ .table-responsive::before,
.no-table-divider >>> .table-responsive::before,
.no-table-divider::v-deep .table-responsive::before,
.no-table-divider /deep/ .table-responsive::after,
.no-table-divider >>> .table-responsive::after,
.no-table-divider::v-deep .table-responsive::after {
  content: none !important;
}

.table-surface /deep/ .table,
.table-surface >>> .table,
.table-surface::v-deep .table {
  margin-bottom: 0;
}

.table-surface /deep/ .table thead th,
.table-surface >>> .table thead th,
.table-surface::v-deep .table thead th {
  background: linear-gradient(90deg, var(--committee-red, #8c1515), rgba(107, 15, 15, 0.98)) !important;
  color: #ffffff !important;
  font-weight: 800 !important;
  text-align: center !important;
  border-bottom: 0 !important;
  border-right: 1px solid rgba(254, 194, 96, 0.5) !important;
}

.table-surface /deep/ .table thead th:last-child,
.table-surface >>> .table thead th:last-child,
.table-surface::v-deep .table thead th:last-child {
  border-right: 0;
}

.table-surface /deep/ .table thead th.action-column,
.table-surface >>> .table thead th.action-column,
.table-surface::v-deep .table thead th.action-column {
  text-align: center !important;
}

.table-surface /deep/ .table thead th.proposal-code-column,
.table-surface >>> .table thead th.proposal-code-column,
.table-surface::v-deep .table thead th.proposal-code-column {
  text-align: center !important;
}

.table-surface /deep/ .table tbody td,
.table-surface >>> .table tbody td,
.table-surface::v-deep .table tbody td {
  border-bottom: 1px solid rgba(140, 21, 21, 0.12) !important;
  border-right: 1px solid rgba(140, 21, 21, 0.12) !important;
  vertical-align: middle !important;
}

.table-surface /deep/ .table tbody td:last-child,
.table-surface >>> .table tbody td:last-child,
.table-surface::v-deep .table tbody td:last-child {
  border-right: 0;
}

.table-surface /deep/ .table tbody tr,
.table-surface >>> .table tbody tr,
.table-surface::v-deep .table tbody tr {
  cursor: pointer;
}

.table-surface /deep/ .table tbody td.project-info-column,
.table-surface >>> .table tbody td.project-info-column,
.table-surface::v-deep .table tbody td.project-info-column {
  text-align: left !important;
}

.table-surface /deep/ .table tbody td.proposal-code-column,
.table-surface >>> .table tbody td.proposal-code-column,
.table-surface::v-deep .table tbody td.proposal-code-column,
.table-surface /deep/ .table tbody td.submitted-date-column,
.table-surface >>> .table tbody td.submitted-date-column,
.table-surface::v-deep .table tbody td.submitted-date-column,
.table-surface /deep/ .table tbody td.action-column,
.table-surface >>> .table tbody td.action-column,
.table-surface::v-deep .table tbody td.action-column {
  text-align: center !important;
}

.proposal-code-cell {
  text-align: center !important;
  vertical-align: middle;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #374151;
  white-space: nowrap;
}

.project-info-cell {
  text-align: left;
  padding-left: 1rem;
  padding-right: 0.75rem;
}

.project-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  line-height: 1.35;
}

.project-title {
  font-weight: 500;
  color: #111827;
}

.project-funding-type {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
}

.project-owner {
  font-size: 12px;
}

.project-owner {
  color: #aaa;
}

.project-budget-line {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
}

.submitted-date-cell {
  text-align: center;
  vertical-align: middle;
}

.action-body-cell {
  vertical-align: middle;
}

.action-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.action-cell .btn {
  white-space: nowrap;
}

.action-btn-view {
  background-color: #2563eb !important;
  border-color: #2563eb !important;
  color: #ffffff !important;
}

.action-btn-view:hover,
.action-btn-view:focus {
  background-color: #1d4ed8 !important;
  border-color: #1d4ed8 !important;
  color: #ffffff !important;
}

.table-surface /deep/ .table tbody tr:hover,
.table-surface >>> .table tbody tr:hover,
.table-surface::v-deep .table tbody tr:hover {
  background: var(--committee-gold-soft, rgba(254, 194, 96, 0.22)) !important;
}

.table-surface /deep/ .table-striped tbody tr:nth-of-type(odd),
.table-surface >>> .table-striped tbody tr:nth-of-type(odd),
.table-surface::v-deep .table-striped tbody tr:nth-of-type(odd) {
  background-color: #ffffff;
}

/* Sorting arrow (CoreUI CDataTable) */
.table-surface /deep/ .arrow-position,
.table-surface >>> .arrow-position,
.table-surface::v-deep .arrow-position {
  color: rgba(254, 194, 96, 0.95);
}

.table-surface /deep/ .arrow-position.transparent,
.table-surface >>> .arrow-position.transparent,
.table-surface::v-deep .arrow-position.transparent {
  opacity: 0.45 !important;
  visibility: visible !important;
}

.table-surface /deep/ .arrow-position.rotate-icon,
.table-surface >>> .arrow-position.rotate-icon,
.table-surface::v-deep .arrow-position.rotate-icon {
  opacity: 0.95 !important;
}
.table-surface /deep/ .btn-outline-primary,
.table-surface >>> .btn-outline-primary,
.table-surface::v-deep .btn-outline-primary {
  color: #8c1515;
  border-color: #8c1515;
}

.table-surface /deep/ .btn-outline-primary:hover,
.table-surface >>> .btn-outline-primary:hover,
.table-surface::v-deep .btn-outline-primary:hover {
  color: #ffffff;
  background: #8c1515;
  border-color: #8c1515;
}

[data-coreui-theme='dark'] .page-content,
body.c-dark-theme .page-content {
  background: #0b1220;
  color: #e5e7eb;
}

[data-coreui-theme='dark'] .dashboard-card-header,
body.c-dark-theme .dashboard-card-header {
  background: linear-gradient(90deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.95));
  border-bottom-color: rgba(148, 163, 184, 0.28);
}

[data-coreui-theme='dark'] .dashboard-card-title,
body.c-dark-theme .dashboard-card-title {
  color: #f8fafc;
}

[data-coreui-theme='dark'] .user-count-badge,
body.c-dark-theme .user-count-badge {
  background: rgba(56, 189, 248, 0.14);
  color: #bae6fd;
  border-color: rgba(56, 189, 248, 0.36);
}

[data-coreui-theme='dark'] .card-body-tight,
body.c-dark-theme .card-body-tight {
  background: #0f172a;
}

[data-coreui-theme='dark'] .table-surface,
body.c-dark-theme .table-surface {
  background: #111827;
  border-color: rgba(148, 163, 184, 0.35);
}

[data-coreui-theme='dark'] .table-surface::v-deep .table thead th,
body.c-dark-theme .table-surface::v-deep .table thead th {
  background: linear-gradient(90deg, #1f2937, #111827) !important;
  color: #f9fafb !important;
  border-right-color: rgba(148, 163, 184, 0.32) !important;
}

[data-coreui-theme='dark'] .table-surface::v-deep .table tbody td,
body.c-dark-theme .table-surface::v-deep .table tbody td {
  background: #111827;
  color: #e5e7eb;
  border-right-color: rgba(148, 163, 184, 0.24) !important;
  border-bottom-color: rgba(148, 163, 184, 0.24) !important;
}

[data-coreui-theme='dark'] .table-surface::v-deep .table-striped tbody tr:nth-of-type(odd),
body.c-dark-theme .table-surface::v-deep .table-striped tbody tr:nth-of-type(odd) {
  background-color: #0f172a;
}

[data-coreui-theme='dark'] .table-surface::v-deep .table tbody tr:hover,
body.c-dark-theme .table-surface::v-deep .table tbody tr:hover {
  background: rgba(51, 65, 85, 0.76) !important;
}

[data-coreui-theme='dark'] .project-title,
body.c-dark-theme .project-title {
  color: #f3f4f6;
}

[data-coreui-theme='dark'] .project-funding-type,
body.c-dark-theme .project-funding-type,
[data-coreui-theme='dark'] .project-code,
body.c-dark-theme .project-code,
[data-coreui-theme='dark'] .proposal-code-cell,
body.c-dark-theme .proposal-code-cell,
[data-coreui-theme='dark'] .project-owner,
body.c-dark-theme .project-owner,
[data-coreui-theme='dark'] .project-budget-line,
body.c-dark-theme .project-budget-line,
[data-coreui-theme='dark'] .status-progress-label,
body.c-dark-theme .status-progress-label,
[data-coreui-theme='dark'] .status-last-action-time,
body.c-dark-theme .status-last-action-time {
  color: #9ca3af;
}

[data-coreui-theme='dark'] .table-footer,
body.c-dark-theme .table-footer {
  background: linear-gradient(90deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
  border-top-color: rgba(148, 163, 184, 0.28);
}

[data-coreui-theme='dark'] .table-footer__left,
body.c-dark-theme .table-footer__left {
  color: #d1d5db;
}

[data-coreui-theme='dark'] .per-page-select,
body.c-dark-theme .per-page-select,
[data-coreui-theme='dark'] .search-input::v-deep input,
body.c-dark-theme .search-input::v-deep input {
  background: #111827;
  border-color: rgba(148, 163, 184, 0.45);
  color: #e5e7eb;
}

[data-coreui-theme='dark'] .search-input::v-deep input::placeholder,
body.c-dark-theme .search-input::v-deep input::placeholder {
  color: #94a3b8;
}

[data-coreui-theme='dark'] .per-page-select option,
body.c-dark-theme .per-page-select option {
  background: #111827;
  color: #e5e7eb;
}

[data-coreui-theme='dark'] .table-footer__right::v-deep .page-link,
body.c-dark-theme .table-footer__right::v-deep .page-link {
  background: #111827;
  color: #e5e7eb;
  border-color: rgba(148, 163, 184, 0.4);
}

[data-coreui-theme='dark'] .table-footer__right::v-deep .page-item.active .page-link,
body.c-dark-theme .table-footer__right::v-deep .page-item.active .page-link {
  background: #2563eb;
  border-color: #2563eb;
}

[data-coreui-theme='dark'] .table-surface::v-deep .btn-outline-primary,
body.c-dark-theme .table-surface::v-deep .btn-outline-primary {
  color: #fde68a;
  border-color: #f59e0b;
}

[data-coreui-theme='dark'] .table-surface::v-deep .btn-outline-primary:hover,
body.c-dark-theme .table-surface::v-deep .btn-outline-primary:hover {
  color: #111827;
  background: #fbbf24;
  border-color: #fbbf24;
}

[data-coreui-theme='dark'] .table-surface::v-deep td.c-datatable-empty,
body.c-dark-theme .table-surface::v-deep td.c-datatable-empty,
[data-coreui-theme='dark'] .state-text,
body.c-dark-theme .state-text {
  color: #9ca3af;
}

[data-coreui-theme='dark'] .clear-filter-btn,
body.c-dark-theme .clear-filter-btn {
  background: rgba(71, 85, 105, 0.28);
  border-color: rgba(148, 163, 184, 0.45);
  color: #e5e7eb;
}

[data-coreui-theme='dark'] .clear-filter-btn:hover,
body.c-dark-theme .clear-filter-btn:hover {
  background: rgba(71, 85, 105, 0.44);
  color: #ffffff;
}

.state-text {
  font-size: 0.85rem;
  color: #94a3b8;
  margin-top: 8px;
}

.spinner {
  width: 34px;
  height: 34px;
  border: 3px solid #dbeafe;
  border-top-color: var(--mfu-gold);
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── FAB ─────────────────────────────── */
.fab {
  position: fixed;
  bottom: 28px;
  right: 28px;
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, var(--mfu-red), var(--mfu-red-deep));
  color: #fff;
  border: none;
  border-radius: 16px;
  font-size: 1.7rem;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 10px 26px rgba(140, 21, 21, 0.28);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.fab:hover {
  transform: translateY(-3px) scale(1.06);
  box-shadow: 0 14px 32px rgba(140, 21, 21, 0.36);
}

</style>
