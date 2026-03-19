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
              <button v-for="p in filters" :key="p.key" class="pill" :class="{ active: activeFilter===p.key }" @click="activeFilter = p.key">{{ p.label }}</button>
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
                <span class="history-badge" :class="proj.statusClass">{{ proj.status }}</span>
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
      return user && user._id ? String(user._id) : null
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
        const rows = Array.isArray(payload)
          ? payload
          : (payload && payload.data && Array.isArray(payload.data.items)
            ? payload.data.items
            : (payload && payload.data && Array.isArray(payload.data) ? payload.data : []))

        const mine = this.currentUserId
          ? rows.filter(r => String(r && r.applicantUserId) === this.currentUserId)
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

    toHistoryItem (item) {
      const status = String(item && item.currentStatus ? item.currentStatus : '').toLowerCase()
      return {
        _id: item && item._id,
        code: item && item.proposalCode ? item.proposalCode : '-',
        title: (item && (item.projectTitleTh || item.projectTitleEn)) || '(ไม่มีชื่อโครงการ)',
        date: this.formatDate(item && (item.submittedAt || item.updatedAt || item.createdAt)),
        status: this.statusLabel(status),
        statusClass: this.statusClass(status),
        currentStatus: status,
        currentRound: item && item.currentRound ? item.currentRound : 1,
      }
    },

    statusLabel (status) {
      if (status === 'approved') return 'อนุมัติ'
      if (status === 'rejected') return 'ไม่อนุมัติ'
      if (status === 'revision_requested') return 'รอแก้ไข'
      if (status === 'draft') return 'รอดำเนินการ'
      if (status === 'submitted') return 'รอดำเนินการ'
      return 'กำลังพิจารณา'
    },

    statusClass (status) {
      if (status === 'approved') return 's-approved'
      if (status === 'rejected') return 's-rejected'
      if (status === 'revision_requested') return 's-fix'
      if (status === 'draft' || status === 'submitted') return 's-waiting'
      return 's-reviewing'
    },

    isReadOnlyStatus (status) {
      return [
        'submitted', 'faculty_review_pending', 'faculty_approved',
        'office_received', 'document_checking', 'assigned_to_committee',
        'under_review', 'meeting_completed', 'approved', 'rejected', 'announced'
      ].includes(String(status || '').toLowerCase())
    },

    select (proj) {
      this.selected = proj.code
      if (!proj || !proj._id) return
      this.$router.push({
        name: 'ResearchForm',
        query: {
          id: proj._id,
          readOnly: this.isReadOnlyStatus(proj.currentStatus) ? 'true' : 'false',
          scrollFeedback: String(proj.currentStatus || '').toLowerCase() === 'revision_requested' ? '1' : '0'
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
.history-card { background: #fff; border-radius: 12px; padding: 18px; width: 100%; max-width: 100%; margin: 0 auto; box-shadow: 0 1px 0 rgba(16,24,40,0.04); }
.history-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:12px }
.history-header h2 { margin:0; font-size:20px; font-weight:800 }
.history-sub { margin:0; color:#6b7280; font-size:13px }
.history-controls { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px }
.pills { display:flex; gap:8px; flex-wrap:wrap }
.pill { padding:8px 12px; border-radius:999px; border:1px solid #e5e7eb; background:#fff; color:#374151; cursor:pointer; font-weight:600 }
.pill.active { background:#111827; color:#fff; border-color:#111827 }
.history-actions { color:#6b7280; font-size:13px }
.history-list { display:flex; flex-direction:column; gap:8px }
.history-item { display:flex; align-items:flex-start; justify-content:space-between; padding:14px; border-radius:10px; background:#fff; border:1px solid #f3f4f6; transition: background 0.12s }
.history-item:hover { background:#f8fafc }
.history-item.selected { background:#f3f3f5 }
.history-left { max-width:85% }
.history-title { color:#111827; font-weight:700 }
.small-code { font-weight:500; color:#6b7280; margin-left:8px; font-size:13px }
.history-date { color:#6b7280; font-size:13px; margin-top:6px }
.history-badge { padding:6px 12px; border-radius:18px; font-weight:700; font-size:13px }
.s-waiting { background:#fef3c7; color:#92400e }
.s-fix { background:#fff7ed; color:#92400e }
.s-approved { background:#dcfce7; color:#166534 }
.s-rejected { background:#fee2e2; color:#7f1d1d }
.s-reviewing { background:#e0f2fe; color:#0369a1 }

.page-wrapper { padding: 16px; width: 100%; max-width: 1240px; margin: 0 auto; box-sizing: border-box; }

.history-page {
  background: transparent;
}

.history-page.is-dark {
  background: transparent;
}

.history-page.is-dark .history-card {
  background: #1f2933;
  box-shadow: 0 1px 0 rgba(148, 163, 184, 0.1);
  border: 1px solid #334155;
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
  border-color: #334155;
  background: #253240;
  color: #dce7f3;
}

.history-page.is-dark .pill.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

.history-page.is-dark .history-item {
  background: #1f2933;
  border-color: #334155;
}

.history-page.is-dark .history-item:hover {
  background: #253240;
}

.history-page.is-dark .history-item.selected {
  background: #2a3645;
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
