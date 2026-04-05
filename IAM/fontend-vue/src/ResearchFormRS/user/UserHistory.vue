<template>
  <div class="app-layout">
    <div class="page-wrapper">
      <div class="history-page" :class="{ 'is-dark': isDarkTheme }">
        <div class="history-card">
          <div class="history-header">
            <h2>ประวัติโครงการ</h2>
            <p class="history-sub">รายการโครงการย้อนหลังของผู้ใช้</p>
          </div>

          <div class="history-controls">
            <div class="pills">
              <button v-for="p in filters" :key="p.key" class="pill" :class="{ active: activeFilter===p.key }" @click="activeFilter = p.key"><CIcon name="cil-chevron-right" class="mr-1" /> {{ p.label }}</button>
            </div>
            <!-- right action removed as requested -->
          </div>

          <div v-if="loading" class="history-list">
            <div class="history-item">กำลังโหลดข้อมูล...</div>
          </div>

          <div v-else-if="errorText" class="history-list">
            <div class="history-item">{{ errorText }}</div>
          </div>

          <div v-else class="history-list">
            <div v-for="proj in filteredProjects" :key="proj._id || proj.code" class="history-item" :class="{ selected: proj.code===selected }" @click="select(proj)">
              <div class="history-left">
                <div class="history-title">{{ proj.title }} <span class="small-code">{{ proj.code }}</span></div>
                <div class="history-date">ยื่น/อัปเดต {{ proj.date }} • รอบที่ {{ proj.currentRound }}</div>
              </div>
              <div class="history-right">
                <CBadge class="history-badge" :color="getStatusColor(proj.currentStatus)">{{ proj.status }}</CBadge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Service from '@/service/api'
import {
  PROPOSAL_STATUS_COLORS_COREUI_BADGE as STATUS_COLORS,
  isProposalReadOnlyStatus,
  normalizeProposalStatus
} from '@/ResearchFormRS/constants/proposalWorkflow'
import { loadResearchFormRuntimeConfigs } from '@/ResearchFormRS/utils/researchConfigRuntime'

export default {
  name: 'UserHistoryPage',
  data() {
    return {
      // Filters
      activeFilter: 'all',
      filters: [
        { key: 'all', label: 'ทั้งหมด' },
        { key: 'waiting', label: 'รอดำเนินการ' },
        { key: 'reviewing', label: 'กำลังพิจารณา' },
        { key: 'approved', label: 'อนุมัติ' },
        { key: 'rejected', label: 'ไม่อนุมัติ' },
        { key: 'fix', label: 'รอแก้ไข' },
      ],
      selected: null,
      loading: false,
      errorText: '',
      projectHistory: [],
    }
  },
  async mounted () {
    await loadResearchFormRuntimeConfigs()
    await this.fetchHistory()
  },
  computed: {
    isDarkTheme () {
      return Boolean(this.$store && this.$store.state && this.$store.state.darkMode)
    },

    currentUserId () {
      const user = this.$store && this.$store.getters
        ? this.$store.getters['Authentication/currentUser']
        : null
      const userId = user && (user._id || user.id)
      return userId ? String(userId) : null
    },
    filteredProjects() {
      if (this.activeFilter === 'all') return this.projectHistory
      const map = {
        waiting: 'รอดำเนินการ',
        reviewing: 'กำลังพิจารณา',
        approved: 'อนุมัติ',
        rejected: 'ไม่อนุมัติ',
        fix: 'รอแก้ไข',
      }
      return this.projectHistory.filter(p => p.status === map[this.activeFilter])
    }
  },
  methods: {
    async fetchHistory () {
      this.loading = true
      this.errorText = ''
      try {
        const res = await Service.proposal.list()
        const payload = res && res.data ? res.data : null
        let rows = []
        if (Array.isArray(payload)) {
          rows = payload
        } else if (payload && payload.data) {
          const wrapped = payload.data
          if (Array.isArray(wrapped.items)) {
            rows = wrapped.items
          } else if (Array.isArray(wrapped.proposals)) {
            rows = wrapped.proposals
          } else if (Array.isArray(wrapped.data)) {
            rows = wrapped.data
          } else if (Array.isArray(wrapped)) {
            rows = wrapped
          }
        }

        const mine = this.currentUserId
          ? rows.filter(r => this.extractApplicantUserId(r) === this.currentUserId)
          : rows

        const deduped = Array.from(
          new Map((mine || []).map(item => [String(item && item._id ? item._id : ''), item]))
            .values()
        ).filter(item => item && item._id)

        this.projectHistory = deduped.map(this.toHistoryItem)
      } catch (err) {
        this.projectHistory = []
        this.errorText = (err && err.message) || 'ไม่สามารถโหลดประวัติโครงการได้'
      } finally {
        this.loading = false
      }
    },

    extractApplicantUserId (item) {
      const applicant = item && item.applicantUserId ? item.applicantUserId : null
      if (!applicant) return ''
      if (typeof applicant === 'string' || typeof applicant === 'number') {
        return String(applicant)
      }
      if (typeof applicant === 'object') {
        if (applicant._id) return String(applicant._id)
        if (applicant.id) return String(applicant.id)
      }
      return ''
    },

    toHistoryItem (item) {
      const status = normalizeProposalStatus(item && item.currentStatus)
      return {
        _id: item && item._id,
        code: item && item.proposalCode ? item.proposalCode : '-',
        title: (item && (item.projectTitleTh || item.projectTitleEn)) || '(ไม่มีชื่อโครงการ)',
        date: this.formatDate(item && (item.submittedAt || item.updatedAt || item.createdAt)),
        status: this.statusLabel(status),
        currentStatus: status,
        currentRound: item && item.currentRound ? item.currentRound : 1,
      }
    },

    statusLabel (status) {
      if (status === 'approved') return 'อนุมัติ'
      if (status === 'rejected') return 'ไม่อนุมัติ'
      if (status === 'revision_requested') return 'รอแก้ไข'
      if (status === 'draft') return this.$t ? this.$t('status.draft') : 'Draft'
      if (status === 'pending_confirm') return 'Pending confirmation'
      if (status === 'submitted') return 'รอดำเนินการ'
      return 'กำลังพิจารณา'
    },

    getStatusColor (status) {
      return STATUS_COLORS[normalizeProposalStatus(status)] || 'secondary'
    },

    isReadOnlyStatus (status) {
      return isProposalReadOnlyStatus(status)
    },

    select (proj) {
      this.selected = proj.code
      if (!proj || !proj._id) return
      this.$router.push({
        name: 'ResearchForm',
        query: {
          id: proj._id,
          readOnly: this.isReadOnlyStatus(proj.currentStatus) ? 'true' : 'false',
          scrollFeedback: normalizeProposalStatus(proj.currentStatus) === 'revision_requested' ? '1' : '0'
        }
      })
    },

    formatDate (dateStr) {
      if (!dateStr) return '-'
      const d = new Date(dateStr)
      if (Number.isNaN(d.getTime())) return '-'
      return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
    }
  }
}
</script>

<style scoped>
.history-card { background: #fff; border-radius: 16px; border: 1px solid rgba(140, 21, 21, 0.14); width: 100%; max-width: 100%; margin: 0 auto; box-shadow: none; overflow: hidden; }
.history-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin:0; padding: 14px 18px; background: linear-gradient(90deg, #8c1515, rgba(107, 15, 15, 0.98)); border-bottom: 1px solid rgba(254, 194, 96, 0.5); }
.history-header h2 { margin:0; font-size:20px; font-weight:800; color:#fff }
.history-sub { margin:0; color:rgba(255,255,255,0.86); font-size:13px }
.history-controls { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:0; padding: 12px 16px; background: linear-gradient(90deg, rgba(140, 21, 21, 0.06), rgba(254, 194, 96, 0.12)); border-bottom: 1px solid rgba(140, 21, 21, 0.12); }
.pills { display:flex; gap:8px; flex-wrap:wrap }
.pill { padding:8px 12px; border-radius:999px; border:1px solid rgba(140, 21, 21, 0.28); background:#fff; color:#6b0f0f; cursor:pointer; font-weight:600 }
.pill.active { background:#8c1515; color:#fff; border-color:#8c1515 }
.history-actions { color:#6b7280; font-size:13px }
.history-list { display:flex; flex-direction:column; gap:0 }
.history-item { display:flex; align-items:flex-start; justify-content:space-between; padding:14px 16px; border-radius:0; background:#fff; border:0; border-bottom:1px solid rgba(140, 21, 21, 0.12); transition: background 0.12s }
.history-item:hover { background:rgba(254, 194, 96, 0.22) }
.history-item.selected { background:rgba(254, 194, 96, 0.3) }
.history-left { max-width:85% }
.history-title { color:#1f2937; font-weight:700 }
.small-code { font-weight:500; color:#6b7280; margin-left:8px; font-size:13px }
.history-date { color:#6b7280; font-size:13px; margin-top:6px }
.history-badge { padding:6px 12px; border-radius:18px; font-weight:700; font-size:13px }

.page-wrapper { padding: 16px; width: 100%; max-width: 1240px; margin: 0 auto; box-sizing: border-box; }

.history-page {
  background: transparent;
}

.history-page.is-dark {
  background: transparent;
}

.history-page.is-dark .history-card {
  background: #111827;
  box-shadow: none;
  border: 1px solid rgba(148, 163, 184, 0.34);
}

.history-page.is-dark .history-header {
  background: linear-gradient(90deg, #1f2937, #111827);
  border-bottom-color: rgba(148, 163, 184, 0.32);
}

.history-page.is-dark .history-controls {
  background: linear-gradient(90deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
  border-bottom-color: rgba(148, 163, 184, 0.24);
}

.history-page.is-dark .history-header h2,
.history-page.is-dark .history-title {
  color: #e5edf5;
}

.history-page.is-dark .history-sub,
.history-page.is-dark .small-code,
.history-page.is-dark .history-date {
  color: #9fb0c3;
}

.history-page.is-dark .pill {
  border-color: rgba(148, 163, 184, 0.38);

  color: #e5e7eb;
}

.history-page.is-dark .pill.active {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.48);
  color: #ffffff;
}

.history-page.is-dark .history-item {
  background: #111827;
  border-bottom-color: rgba(148, 163, 184, 0.22);
}

.history-page.is-dark .history-item:hover {
  background: rgba(51, 65, 85, 0.76);
}

.history-page.is-dark .history-item.selected {
  background: rgba(51, 65, 85, 0.9);
}

.history-page.is-dark .history-list {
  background: transparent;
}

/* Responsive: mobile adjustments */
@media (max-width: 768px) {
  .page-wrapper { padding: 12px 14px; }
  .history-card { padding: 12px; margin: 8px; }
  .history-header { gap:8px }
  .history-header h2 { font-size:18px }
  .pills { gap:6px }
  .pill { padding:6px 10px; font-size:13px }
  .history-item { padding:12px; border-radius:10px }
  .history-title { font-size:15px }
  .small-code { display:block; margin-top:6px; color:#6b7280 }
  .history-right { align-self:flex-end; margin-top:8px }
  .history-badge { padding:6px 10px; font-size:12px }
}

@media (max-width: 480px) {
  .profile-container { grid-template-columns: 1fr; }
  .history-card { padding:10px; border-radius:12px }
  .history-header h2 { font-size:16px }
  .pill { padding:6px 8px; font-size:12px }
  .history-item { flex-direction:column; gap:8px }
  .history-left { width:100% }
  .history-right { width:100%; display:flex; justify-content:flex-end }
  .history-date { margin-top:6px }
}

</style>

