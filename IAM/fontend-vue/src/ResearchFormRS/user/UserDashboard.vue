<template>
  <div class="page-content">

    <div class="summary-strip mb-4">
      <div v-for="s in stageSummary" :key="s.key" class="strip-card"
        :class="[`strip-${s.key}`, { 'strip-active': activeFilter === s.key } ]" @click="toggleFilter(s.key)">
        <div class="strip-left">
          <span class="strip-icon-wrap">
            <CIcon :name="s.icon" class="strip-icon"/>
          </span>
          <span class="strip-label">{{ s.label }}</span>
        </div>
        <div class="strip-right">
          <span class="strip-count">{{ s.count }}</span>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="panels-row">

      <!-- Main Table Card -->
      <div class="panel-table">
        <div v-if="false" class="table-card-header">
          <div class="d-flex align-items-center gap-2">
            <span class="header-grid-icon">⊞</span>
            <span class="table-card-title">Advanced <em>CDataTable</em> application</span>
          </div>
          <div class="d-flex gap-2">
            <button class="btn-quick btn-success" @click="continueDraft">
              <CIcon name="cil-file" class="btn-ic"/>
              ร่างล่าสุด
            </button>
       
          </div>
        </div>

        <!-- Filter bar (Image 1 style) -->
        <div class="filter-bar">
          <div class="filter-right">
            <label class="filter-label">Items per page:</label>
            <select v-model="perPage" class="f-input f-perpage">
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="25">25</option>
            </select>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-box">
          <div class="spinner"></div>
          <div class="state-text">กำลังโหลดข้อมูล…</div>
        </div>

        <!-- Fetch error -->
        <div v-else-if="fetchError" class="state-box">
          <div class="state-text">เกิดข้อผิดพลาดในการโหลดข้อมูล: {{ fetchError }}</div>
          <div style="margin-top:10px;"><button class="btn-quick btn-success" @click="retryFetch">ลองอีกครั้ง</button></div>
        </div>

        <!-- Empty -->
        <div v-else-if="filteredItems.length === 0" class="state-box">
          <CIcon name="cil-envelope-closed" class="empty-ic"/>
          <div class="state-text">ไม่พบโครงการวิจัย</div>
        </div>

        <!-- Table -->
        <div v-else class="table-wrapper">
          <table class="data-table">
            <thead>
              <!-- Sortable headers -->
              <tr class="thead-row">
                <th class="th-sort" @click="sortBy('projectName')">
                  ชื่อโครงการวิจัย / หัวหน้าโครงการ
                  <span class="sort-ic">{{ sortIcon('projectName') }}</span>
                </th>
                <th class="th-sort" @click="sortBy('submitDate')">
                  วันที่ยื่น
                  <span class="sort-ic">{{ sortIcon('submitDate') }}</span>
                </th>
                <th class="th-sort" @click="sortBy('stageLabel')">
                  สถานะ
                  <span class="sort-ic">{{ sortIcon('stageLabel') }}</span>
                </th>
                <th>ขั้นตอนถัดไป</th>
                <th class="th-sort" @click="sortBy('activityMeta')">
                  Activity
                  <span class="sort-ic">{{ sortIcon('activityMeta') }}</span>
                </th>
                <th class="th-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in paginatedItems" :key="item.id || i" class="tbody-row">
                <td>
                  <div class="td-title">{{ item.projectName }}</div>
                  <div class="td-sub">{{ item.projectLeader }}</div>
                </td>
                <td><span class="td-date">{{ item.submitDate }}</span></td>
                <td>
                  <span class="badge" :class="`badge-${item.stageBadgeColor}`">
                    {{ item.stageLabel }}
                  </span>
                </td>
                <td><span class="td-next">{{ item.nextAction }}</span></td>
                <td>
                  <div class="td-act-msg">{{ item.activityMessage }}</div>
                  <div class="td-act-meta">{{ item.activityMeta }}</div>
                </td>
                <td class="td-right">
                  <button class="btn-show" @click.stop="goToDetail(item.id)">Show</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagi-bar">
          <button class="pg-btn" :disabled="currentPage === 1" @click="currentPage = 1">«</button>
          <button class="pg-btn" :disabled="currentPage === 1" @click="currentPage--">‹</button>
          <button v-for="p in visiblePages" :key="p" class="pg-btn" :class="{ 'pg-active': p === currentPage }"
            @click="currentPage = p">{{ p }}</button>
          <button class="pg-btn" :disabled="currentPage === totalPages" @click="currentPage++">›</button>
          <button class="pg-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages">»</button>
        </div>
      </div>
    </div>
    <button class="fab" title="สร้างโครงการใหม่" @click="onAdd">＋</button>
  </div>
</template>

<script>
import Service from '@/service/api'

export default {
  name: "UserDashboard",
  data() {
    return {
      allProjects: [],
      loading: true,
      fetchError: null,
      stageFilter: "",
      activeFilter: "",
      perPage: 10,
      currentPage: 1,
      sortKey: "",
      sortDir: 1,
    };
  },

  async mounted() {
    await this.fetchResearch();
  },

  watch: {
    stageFilter() { this.currentPage = 1; },
    activeFilter() { this.currentPage = 1; },
    perPage() { this.currentPage = 1; },
    totalPages(newVal) {
      if (this.currentPage > newVal) {
        this.currentPage = newVal;
      }
    }
  },

  computed: {
    currentUserId() {
      const user = this.$store && this.$store.getters
        ? this.$store.getters['Authentication/currentUser']
        : null;
      return user && user._id ? String(user._id) : null;
    },

    stageSummary() {
      return [
        { key: "DRAFT", label: "ร่าง", icon: "cil-file" },
        { key: "SUBMITTED", label: "ยื่นแล้ว", icon: "cil-cloud-upload" },
        { key: "NEED_REVISION", label: "ต้องแก้ไข", icon: "cil-warning" },
        { key: "IN_REVIEW", label: "กำลังพิจารณา", icon: "cil-magnifying-glass" },
        { key: "APPROVED", label: "อนุมัติ", icon: "cil-check" },
      ].map(s => ({
        ...s,
        count: this.allProjects.filter(p => p.stage === s.key).length,
      }));
    },

    nextActionItems() {
      return this.allProjects.filter(p => p.stage === "NEED_REVISION" || p.stage === "DRAFT");
    },

    filteredItems() {
      let list = [...this.allProjects];
      if (this.activeFilter) list = list.filter(p => p.stage === this.activeFilter);
      if (this.stageFilter) list = list.filter(p => p.stage === this.stageFilter);
      if (this.sortKey) {
        if (this.sortKey === "submitDate") {
          list.sort((a, b) =>
            (new Date(a.submitDateRaw) - new Date(b.submitDateRaw)) * this.sortDir
          );
        } else {
          list.sort((a, b) =>
            (a[this.sortKey] || "").toString()
              .localeCompare((b[this.sortKey] || "").toString(), "th") * this.sortDir
          );
        }
      }
      return list;
    },

    totalPages() {
      return Math.ceil(this.filteredItems.length / this.perPage) || 1;
    },

    paginatedItems() {
      const s = (this.currentPage - 1) * this.perPage;
      return this.filteredItems.slice(s, s + this.perPage);
    },

    visiblePages() {
      const range = [];
      const s = Math.max(1, this.currentPage - 2);
      const e = Math.min(this.totalPages, this.currentPage + 2);
      for (let i = s; i <= e; i++) range.push(i);
      return range;
    },
  },

  methods: {
    async fetchResearch() {
      this.loading = true;
      this.fetchError = null;
      try {
        const response = await Service.research.list();
        const payload = response && response.data ? response.data : null;
        const data = Array.isArray(payload)
          ? payload
          : (payload && payload.data && Array.isArray(payload.data.items)
            ? payload.data.items
            : (payload && payload.data && Array.isArray(payload.data)
              ? payload.data
              : []));

        const mine = this.currentUserId
          ? data.filter(item => String(item && item.applicantUserId) === this.currentUserId)
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

    mapItem(item) {
      const stage = this.inferStage(item);
      const nextAction = this.inferNextAction(stage);
      const { message, meta } = this.getLastActivityText(item);
      return {
        id: item._id,
        projectName: item.projectTitleTh || item.projectTitleEn || "(ไม่มีชื่อ)",
        projectLeader: item.projectLeaderName || "-",
        submitDate: this.formatDate(item.submittedAt || item.updatedAt || item.createdAt),
        submitDateRaw: item.submittedAt || item.updatedAt || item.createdAt,
        stage,
        stageLabel: this.stageLabel(stage),
        stageBadgeColor: this.stageBadgeColor(stage),
        nextAction,
        activityMessage: message,
        activityMeta: meta,
        currentStatus: item.currentStatus,
      };
    },

    inferStage(item) {
      const status = String(item && item.currentStatus ? item.currentStatus : '').toLowerCase();
      if (status === 'draft') return 'DRAFT';
      if (status === 'revision_requested') return 'NEED_REVISION';
      if (status === 'approved') return 'APPROVED';
      if (status === 'rejected') return 'REJECTED';
      if (status === 'submitted') return 'SUBMITTED';
      if (status === 'announced') return 'APPROVED';
      return 'IN_REVIEW';
    },

    inferNextAction(stage) {
      return {
        DRAFT: "กรอกข้อมูลให้ครบและบันทึก",
        SUBMITTED: "รอเจ้าหน้าที่ตรวจสอบ",
        NEED_REVISION: "แก้ไขตามข้อเสนอแนะและส่งใหม่",
        IN_REVIEW: "รอผลการพิจารณา",
        APPROVED: "ผ่านการพิจารณาแล้ว",
        REJECTED: "สิ้นสุดการพิจารณา",
      }[stage] || "-";
    },

    stageLabel(stage) {
      return {
        DRAFT: "ร่าง",
        SUBMITTED: "ยื่นแล้ว",
        NEED_REVISION: "ต้องแก้ไข",
        IN_REVIEW: "กำลังพิจารณา",
        APPROVED: "อนุมัติ",
        REJECTED: "ไม่อนุมัติ",
      }[stage] || stage;
    },

    stageBadgeColor(stage) {
      return {
        DRAFT: "secondary",
        SUBMITTED: "info",
        NEED_REVISION: "warning",
        IN_REVIEW: "primary",
        APPROVED: "success",
        REJECTED: "danger",
      }[stage] || "dark";
    },

    getLastActivityText(item) {
      const la = item.lastActivity;
      if (la?.message) {
        return {
          message: la.message,
          meta: `${la.by || ""} • ${this.formatTimeAgo(la.at || item.updatedAt)}`,
        };
      }
      return { message: "บันทึกล่าสุด", meta: this.formatTimeAgo(item.updatedAt) };
    },

    formatDate(date) {
      if (!date) return "-";
      return new Date(date).toLocaleDateString("th-TH", {
        year: "numeric", month: "short", day: "numeric",
      });
    },

    formatTimeAgo(date) {
      if (!date) return "-";
      const diff = Date.now() - new Date(date);
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      if (minutes < 1) return "เมื่อสักครู่";
      if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
      if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
      return `${days} วันที่แล้ว`;
    },

    sortBy(key) {
      if (this.sortKey === key) this.sortDir *= -1;
      else { this.sortKey = key; this.sortDir = 1; }
    },

    sortIcon(key) {
      if (this.sortKey !== key) return "↕";
      return this.sortDir === 1 ? "↑" : "↓";
    },

    toggleFilter(key) {
      this.activeFilter = this.activeFilter === key ? "" : key;
      this.stageFilter = "";
    },

    isReadOnlyStatus(status) {
      const s = String(status || '').toLowerCase();
      return [
        'submitted', 'faculty_review_pending', 'faculty_approved',
        'office_received', 'document_checking', 'assigned_to_committee',
        'under_review', 'meeting_completed', 'approved', 'rejected', 'announced'
      ].includes(s);
    },

    openProposal(id, status) {
      const s = String(status || '').toLowerCase();
      this.$router.push({
        name: 'ResearchForm',
        query: {
          id,
          readOnly: this.isReadOnlyStatus(status) ? 'true' : 'false',
          scrollFeedback: s === 'revision_requested' ? '1' : '0'
        }
      });
    },

    goToDetail(id) {
      const item = this.allProjects.find(p => p.id === id);
      this.openProposal(id, item && item.currentStatus);
    },
    goToEdit(id) {
      const item = this.allProjects.find(p => p.id === id);
      this.openProposal(id, item && item.currentStatus);
    },
    onAdd() { this.$router.push({ name: 'ResearchForm', query: { new: '1' } }); },

    continueDraft() {
      const draft = this.allProjects.find(p => p.stage === "DRAFT");

      if (draft) {
        this.openProposal(draft.id, draft.currentStatus);
      } else {
        this.$router.push({ name: 'ResearchForm', query: { new: '1' } });
      }
    },

    exportPDF() { this.$router.push("/report"); },

    onLogout() {
      this.$router.push({ name: "Login" });
    },
  },
};
</script>

<style scoped>
/* ═══════════════════════════════════════
   CSS Variables
═══════════════════════════════════════ */
:root {
  --sb-bg: #7b0d0d;
  --sb-bg2: #5a0a0a;
  --sb-text: #f5cece;
  --sb-active: rgba(255, 255, 255, 0.18);
  --sb-hover: rgba(255, 255, 255, 0.10);
  --sb-width: 210px;
  --sb-mini: 58px;
  --blue: #1d4ed8;
  --blue-light: #eff6ff;
  --yellow: #f59e0b;
}

.page-content {
  padding: 24px 28px;
  flex: 1;
}

.summary-strip {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.strip-card {
  flex: 1;
  min-width: 170px;
  background: #fff;
  border-radius: 12px;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(29, 78, 216, 0.07);
  padding: 14px 16px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  transition: all 0.18s ease;
  user-select: none;
}

.strip-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(29, 78, 216, 0.13);
  border-color: #1d4ed8;
}

.strip-card.strip-active {
  border-color: #1d4ed8;
  background: #eff6ff;
}

.strip-card.strip-NEED_REVISION.strip-active {
  background: #eff6ff;
  border-color: #1d4ed8;
}

.strip-icon {
  font-size: 1.9rem;
  display: inline-block;
  line-height: 1;
}

.strip-count {
  font-size: 2.6rem;
  font-weight: 900;
  color: #0f172a;
  line-height: 1;
  display: inline-block;
  text-align: right;
}

.strip-label {
  font-size: 0.82rem;
  color: #334155;
  font-weight: 700;
}

.strip-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.strip-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
}

.strip-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  box-shadow: 0 4px 12px rgba(16,24,40,0.06);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.strip-icon-wrap .strip-icon svg {
  width: 26px;
  height: 26px;
}

.strip-card:hover .strip-icon-wrap {
  transform: translateY(-3px);
  box-shadow: 0 10px 26px rgba(16,24,40,0.12);
}

/* Colors per status */
.strip-card.strip-DRAFT .strip-icon-wrap { background: #64748b; color: #fff; }
.strip-card.strip-SUBMITTED .strip-icon-wrap { background: #0ea5e9; color: #fff; }
.strip-card.strip-NEED_REVISION .strip-icon-wrap { background: #ffae00; color: #fff; }
.strip-card.strip-IN_REVIEW .strip-icon-wrap { background: #2563eb; color: #fff; }
.strip-card.strip-APPROVED .strip-icon-wrap { background: #16a34a; color: #fff; }

@media (max-width: 720px) {
  .strip-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .strip-left {
    align-items: center;
  }
  .strip-right {
    align-items: center;
  }
}

/* ═══════════════════════════════════════
   PANELS ROW (equal height)
═══════════════════════════════════════ */
.panels-row {
  display: flex;
  gap: 18px;
  align-items: stretch;
  /* ← KEY for equal height */
}

/* ── Table Panel ─────────────────────── */
.panel-table {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(29, 78, 216, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Quick buttons */
.btn-quick {
  border: none;
  border-radius: 7px;
  font-size: 0.76rem;
  padding: 4px 11px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.15s;
}

/* extra spacing between quick action buttons in header */
.table-card-header .btn-quick + .btn-quick {
  margin-left: 12px;
}

.btn-quick:hover {
  opacity: 0.85;
}

.btn-success {
  background: #16a34a;
  color: #fff;
}

.btn-gray {
  background: #64748b;
  color: #fff;
}

.btn-ic {
  display: inline-flex;
  align-items: center;
  margin-right: 8px;
}

.btn-ic svg {
  width: 16px;
  height: 16px;
}

.btn-ic { color: inherit; }

/* ── Filter Bar ──────────────────────── */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  gap: 10px;
  flex-wrap: wrap;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
}

.filter-left,
.filter-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 0.8rem;
  color: #374151;
  white-space: nowrap;
}

.f-input {
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  padding: 4px 8px;
  font-size: 0.8rem;
  outline: none;
  background: #fff;
  transition: border-color 0.15s;
}

.f-input:focus {
  border-color: #3b82f6;
}

.f-text {
  width: 170px;
}

.f-select {
  width: 130px;
}

.f-perpage {
  width: 62px;
}

/* ── State boxes ─────────────────────── */
.state-box {
  text-align: center;
  padding: 48px 20px;
}

.state-box .empty-ic {
  color: #94a3b8;
  width: 56px;
  height: 56px;
  display: inline-block;
  margin-bottom: 8px;
}
.state-box .empty-ic svg {
  width: 56px;
  height: 56px;
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
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Table ───────────────────────────── */
.table-wrapper {
  overflow-x: auto;
  flex: 1;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.845rem;
}

.thead-row th {
  background: #fff;
  color: #374151;
  font-weight: 600;
  padding: 10px 13px;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
  text-align: left;
}

.th-sort {
  cursor: pointer;
}

.th-sort:hover {
  background: #eff6ff;
  color: #1d4ed8;
}

.sort-ic {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-left: 3px;
}

.thead-sub th {
  background: #f8fafc;
  padding: 5px 13px 6px;
  border-bottom: 1px solid #e2e8f0;
}

.col-fi {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 2px 7px;
  font-size: 0.77rem;
  height: 24px;
  background: #fff;
  outline: none;
}

.col-fi:focus {
  border-color: #3b82f6;
}

.tbody-row td {
  padding: 10px 13px;
  border-bottom: 1px solid #f1f5f9;
  background: #fff;
  vertical-align: middle;
}

.tbody-row:hover td {
  background: #f0f7ff;
}

.td-title {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.86rem;
  line-height: 1.3;
}

.td-sub {
  font-size: 0.74rem;
  color: #64748b;
  margin-top: 2px;
}

.td-date {
  font-size: 0.8rem;
  color: #475569;
  white-space: nowrap;
}

.td-next {
  font-size: 0.77rem;
  color: #475569;
}

.td-act-msg {
  font-size: 0.79rem;
  font-weight: 500;
  color: #1e293b;
}

.td-act-meta {
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 2px;
}

.td-right {
  text-align: right;
}

/* Badge */
.badge {
  display: inline-block;
  font-size: 0.73rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  color: #fff;
}

.badge-secondary {
  background: #64748b;
}

.badge-info {
  background: #0ea5e9;
}

.badge-warning {
  background: #f59e0b;
  color: #1a1a2e;
}

.badge-primary {
  background: #2563eb;
}

.badge-success {
  background: #16a34a;
}

.badge-dark {
  background: #1e293b;
}

/* Show button */
.btn-show {
  border: 1px solid #3b82f6;
  background: transparent;
  color: #3b82f6;
  border-radius: 5px;
  font-size: 0.76rem;
  padding: 3px 12px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn-show:hover {
  background: #3b82f6;
  color: #fff;
}

/* ── Pagination ──────────────────────── */
.pagi-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  border-top: 1px solid #f1f5f9;
  flex-shrink: 0;
}

.pg-btn {
  min-width: 30px;
  height: 30px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #3b82f6;
  border-radius: 5px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.14s;
  padding: 0 6px;
}

.pg-btn:hover:not(:disabled) {
  background: #eff6ff;
  border-color: #3b82f6;
}

.pg-btn:disabled {
  color: #cbd5e1;
  cursor: default;
}

.pg-active {
  background: #1d4ed8 !important;
  border-color: #1d4ed8 !important;
  color: #fff !important;
  font-weight: 700;
}

/* ── FAB ─────────────────────────────── */
.fab {
  position: fixed;
  bottom: 28px;
  right: 28px;
  width: 52px;
  height: 52px;
  background: #1d4ed8;
  color: #fff;
  border: none;
  border-radius: 16px;
  font-size: 1.7rem;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(29, 78, 216, 0.38);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.fab:hover {
  transform: translateY(-3px) scale(1.06);
  box-shadow: 0 12px 28px rgba(29, 78, 216, 0.48);
}
</style>
