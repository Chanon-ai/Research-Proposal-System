<template>
  <div class="page-content">

    <CRow class="mb-4">
      <CCol sm="6" lg="3">
        <div
          @click="setFilter('draft')"
          :style="{
            cursor: 'pointer',
            transform: activeFilter === 'draft' ? 'scale(1.03)' : 'scale(1)',
            transition: 'transform 0.2s',
            opacity: activeFilter && activeFilter !== 'draft' ? '0.6' : '1',
            outline: activeFilter === 'draft' ? '3px solid #fff' : 'none',
            borderRadius: '8px',
          }"
        >
          <CWidgetDropdown color="gradient-primary" :header="String(stats.draft || 0)" text="แบบร่าง">
            <template #default>
              <CDropdown color="transparent p-0" placement="bottom-end">
                <template #toggler-content>
                  <CIcon name="cil-settings"/>
                </template>
              </CDropdown>
            </template>
            <template #footer>
              <div style="height:70px">
                <CChartLine :datasets="[{ data: chartData.draft, backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.55)' }]" :options="chartOptions"/>
              </div>
            </template>
          </CWidgetDropdown>
        </div>
      </CCol>

      <CCol sm="6" lg="3">
        <div
          @click="setFilter('submitted')"
          :style="{
            cursor: 'pointer',
            transform: activeFilter === 'submitted' ? 'scale(1.03)' : 'scale(1)',
            transition: 'transform 0.2s',
            opacity: activeFilter && activeFilter !== 'submitted' ? '0.6' : '1',
            outline: activeFilter === 'submitted' ? '3px solid #fff' : 'none',
            borderRadius: '8px',
          }"
        >
          <CWidgetDropdown color="gradient-info" :header="String(stats.submitted || 0)" text="กำลังดำเนินการ">
            <template #footer>
              <div style="height:70px">
                <CChartLine :datasets="[{ data: chartData.submitted, backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.55)' }]" :options="chartOptions"/>
              </div>
            </template>
          </CWidgetDropdown>
        </div>
      </CCol>

      <CCol sm="6" lg="3">
        <div
          @click="setFilter('revision')"
          :style="{
            cursor: 'pointer',
            transform: activeFilter === 'revision' ? 'scale(1.03)' : 'scale(1)',
            transition: 'transform 0.2s',
            opacity: activeFilter && activeFilter !== 'revision' ? '0.6' : '1',
            outline: activeFilter === 'revision' ? '3px solid #fff' : 'none',
            borderRadius: '8px',
          }"
        >
          <CWidgetDropdown color="gradient-warning" :header="String(stats.revision || 0)" text="ขอแก้ไข">
            <template #footer>
              <div style="height:70px">
                <CChartLine :datasets="[{ data: chartData.revision, backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.55)' }]" :options="chartOptions"/>
              </div>
            </template>
          </CWidgetDropdown>
        </div>
      </CCol>

      <CCol sm="6" lg="3">
        <div
          @click="setFilter('approved')"
          :style="{
            cursor: 'pointer',
            transform: activeFilter === 'approved' ? 'scale(1.03)' : 'scale(1)',
            transition: 'transform 0.2s',
            opacity: activeFilter && activeFilter !== 'approved' ? '0.6' : '1',
            outline: activeFilter === 'approved' ? '3px solid #fff' : 'none',
            borderRadius: '8px',
          }"
        >
          <CWidgetDropdown color="gradient-success" :header="String(stats.approved || 0)" text="อนุมัติแล้ว">
            <template #footer>
              <div style="height:70px">
                <CChartBar :datasets="[{ data: chartData.approved, backgroundColor: 'rgba(255,255,255,0.3)', borderColor: 'transparent' }]" :options="chartOptions"/>
              </div>
            </template>
          </CWidgetDropdown>
        </div>
      </CCol>
    </CRow>

    <div class="d-flex justify-content-between align-items-center mb-3">
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
          {{ filteredProposals.length }} รายการ
        </CBadge>
      </div>

      <CButton
        v-if="activeFilter"
        color="secondary"
        size="sm"
        @click="clearFilter"
      >
        × ล้างตัวกรอง
      </CButton>
    </div>

    <CCard>
      <CCardBody>
        <div v-if="loading" class="state-box">
          <div class="spinner"></div>
          <div class="state-text">กำลังโหลดข้อมูล…</div>
        </div>

        <div v-else-if="fetchError" class="state-box">
          <div class="state-text">เกิดข้อผิดพลาดในการโหลดข้อมูล: {{ fetchError }}</div>
          <div style="margin-top:10px;"><button class="btn-quick btn-success" @click="retryFetch">ลองอีกครั้ง</button></div>
        </div>

        <div v-else>
          <CDataTable
            :items="filteredProposals"
            :fields="tableFields"
            :items-per-page="5"
            :items-per-page-select="{ label: 'Items per page:' }"
            sorter
            column-filter
            table-filter
            :table-filter-value.sync="tableFilter"
            pagination
            hover
            striped
            border
          >
            <template #projectTitleTh="{ item }">
              <td>
                <div style="font-weight:500">{{ item.projectTitleTh || item.projectTitleEn || '(ไม่มีชื่อ)' }}</div>
                <div style="font-size:12px;color:#888">{{ item.proposalCode }}</div>
                <div style="font-size:12px;color:#aaa">{{ item.projectLeaderName || '-' }}</div>
              </td>
            </template>

            <template #updatedAt="{ item }">
              <td style="text-align:center; vertical-align:middle">
                {{ item.updatedAt
                  ? new Date(item.updatedAt).toLocaleDateString('th-TH', { year:'numeric', month:'short', day:'numeric' })
                  : '-' }}
              </td>
            </template>

            <template #currentStatus="{ item }">
              <td style="text-align:center; vertical-align:middle; min-width:220px">
                <CBadge :color="getProgressColor(item.currentStatus)" class="mb-2" style="font-size:11px">
                  {{ getStatusLabel(item.currentStatus) }}
                </CBadge>
                <CProgress
                  :value="getProgressPercent(item.currentStatus)"
                  :color="getProgressColor(item.currentStatus)"
                  :animated="['submitted', 'faculty_review_pending', 'under_review', 'document_checking', 'assigned_to_committee'].includes(item.currentStatus)"
                  :striped="item.currentStatus === 'revision_requested'"
                  style="height:16px; font-size:11px"
                  class="mb-1"
                />
                <div style="font-size:11px; color:#888">
                  {{ getProgressLabel(item.currentStatus) }}
                </div>
              </td>
            </template>

            <template #show_details="{ item }">
              <td style="text-align:center; vertical-align:middle">
                <CButton
                  size="sm"
                  color="info"
                  @click="$router.push('/research-form/' + item._id)"
                >
                  Show
                </CButton>
              </td>
            </template>
          </CDataTable>
        </div>
      </CCardBody>
    </CCard>

    <button class="fab" title="สร้างโครงการใหม่" @click="onAdd">＋</button>
  </div>
</template>

<script>
import Service from '@/service/api'
import { CChartLine, CChartBar } from '@coreui/vue-chartjs'

export default {
  name: "UserDashboard",
  components: {
    CChartLine,
    CChartBar,
  },
  data() {
    return {
      allProjects: [],
      loading: true,
      fetchError: null,
      tableFields: [
        {
          key: 'projectTitleTh',
          label: 'ชื่อโครงการวิจัย / หัวหน้าโครงการ',
          _style: 'min-width:250px; text-align:center;'
        },
        {
          key: 'currentStatus',
          label: 'สถานะ',
          _style: 'width:220px; text-align:center;'
        },
        {
          key: 'updatedAt',
          label: 'วันที่ยื่น',
          _style: 'width:140px; text-align:center;'
        },
        {
          key: 'show_details',
          label: 'Action',
          _style: 'width:80px; text-align:center;',
          filter: false,
          sorter: false
        }
      ],
      tableFilter: '',
      activeFilter: null,
      filterGroups: {
        draft: ['draft'],
        submitted: [
          'submitted',
          'faculty_review_pending',
          'faculty_approved',
          'office_received',
          'document_checking',
          'assigned_to_committee',
          'under_review',
          'meeting_completed',
          'second_round_review',
          'resubmitted',
        ],
        revision: ['revision_requested'],
        approved: ['approved', 'announced'],
        rejected: ['rejected'],
      },
      workflowSteps: [
        { key: 'draft', label: 'แบบร่าง', step: 1 },
        { key: 'submitted', label: 'ยื่นโครงการแล้ว', step: 2 },
        { key: 'faculty_review_pending', label: 'รอประธานพิจารณา', step: 3 },
        { key: 'faculty_approved', label: 'ประธานอนุมัติ', step: 4 },
        { key: 'office_received', label: 'ส่วนบริหารรับแล้ว', step: 5 },
        { key: 'document_checking', label: 'ตรวจสอบเอกสาร', step: 6 },
        { key: 'assigned_to_committee', label: 'มอบหมายกรรมการ', step: 7 },
        { key: 'under_review', label: 'กำลังพิจารณา', step: 8 },
        { key: 'meeting_completed', label: 'ประชุมเสร็จแล้ว', step: 9 },
        { key: 'revision_requested', label: 'ขอแก้ไข', step: 5 },
        { key: 'resubmitted', label: 'ส่งแก้ไขแล้ว', step: 6 },
        { key: 'second_round_review', label: 'พิจารณารอบ 2', step: 8 },
        { key: 'approved', label: 'อนุมัติ', step: 10 },
        { key: 'rejected', label: 'ปฏิเสธ', step: 10 },
        { key: 'announced', label: 'ประกาศผลแล้ว', step: 10 },
      ],
      chartData: {
        draft: [65, 59, 84, 84, 51, 55, 40],
        submitted: [35, 49, 60, 71, 80, 90, 75],
        revision: [20, 30, 15, 25, 10, 35, 20],
        approved: [10, 20, 30, 25, 35, 45, 40],
      },
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        legend: { display: false },
        scales: {
          xAxes: [{ display: false }],
          yAxes: [{ display: false }]
        },
        elements: {
          line: { borderWidth: 2, tension: 0.4 },
          point: { radius: 0 }
        }
      }
    };
  },

  async mounted() {
    await this.fetchResearch();
  },

  computed: {
    currentUserId() {
      const user = this.$store && this.$store.getters
        ? this.$store.getters['Authentication/currentUser']
        : null;
      return user && user._id ? String(user._id) : null;
    },

    proposals() {
      return this.allProjects;
    },

    stats() {
      const all = this.proposals;
      return {
        draft: all.filter(p => p.currentStatus === 'draft').length,
        submitted: all.filter(p => [
          'submitted',
          'faculty_review_pending',
          'faculty_approved',
          'office_received',
          'document_checking',
          'assigned_to_committee',
          'under_review',
          'meeting_completed',
          'resubmitted',
          'second_round_review'
        ].includes(p.currentStatus)).length,
        revision: all.filter(p => p.currentStatus === 'revision_requested').length,
        approved: all.filter(p => ['approved', 'announced'].includes(p.currentStatus)).length,
        rejected: all.filter(p => p.currentStatus === 'rejected').length,
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
        draft: 'แบบร่าง',
        submitted: 'กำลังดำเนินการ',
        revision: 'ขอแก้ไข',
        approved: 'อนุมัติแล้ว',
        rejected: 'ปฏิเสธ',
      };
      return this.activeFilter
        ? `กรองตาม: ${labels[this.activeFilter]}`
        : 'โครงการทั้งหมด';
    },
  },

  methods: {
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
      return {
        _id: item._id,
        proposalCode: item.proposalCode || '-',
        projectTitleTh: item.projectTitleTh || '',
        projectTitleEn: item.projectTitleEn || '',
        projectLeaderName: item.projectLeaderName || '-',
        submittedAt: item.submittedAt,
        updatedAt: item.updatedAt,
        createdAt: item.createdAt,
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

    getStatusLabel(status) {
      const key = String(status || '').toLowerCase();
      const labels = {
        draft: 'ร่าง',
        submitted: 'ยื่นแล้ว',
        faculty_review_pending: 'รอประธานพิจารณา',
        faculty_approved: 'ประธานอนุมัติ',
        office_received: 'ส่วนบริหารรับแล้ว',
        document_checking: 'ตรวจสอบเอกสาร',
        assigned_to_committee: 'มอบหมายกรรมการ',
        under_review: 'กำลังพิจารณา',
        meeting_completed: 'ประชุมเสร็จแล้ว',
        revision_requested: 'ขอแก้ไข',
        resubmitted: 'ส่งแก้ไขแล้ว',
        second_round_review: 'พิจารณารอบ 2',
        approved: 'อนุมัติ',
        rejected: 'ไม่อนุมัติ',
        announced: 'ประกาศผลแล้ว',
      };
      return labels[key] || 'กำลังดำเนินการ';
    },

    getStatusColor(status) {
      const stage = this.inferStage({ currentStatus: status });
      return {
        DRAFT: 'secondary',
        SUBMITTED: 'info',
        NEED_REVISION: 'warning',
        IN_REVIEW: 'primary',
        APPROVED: 'success',
        REJECTED: 'danger',
      }[stage] || 'dark';
    },

    getProgressPercent(status) {
      const key = String(status || '').toLowerCase();
      const stepMap = {
        draft: 10,
        submitted: 20,
        faculty_review_pending: 30,
        faculty_approved: 40,
        office_received: 45,
        document_checking: 50,
        assigned_to_committee: 60,
        under_review: 70,
        meeting_completed: 80,
        revision_requested: 50,
        resubmitted: 55,
        second_round_review: 70,
        approved: 100,
        rejected: 100,
        announced: 100,
      };
      return stepMap[key] || 0;
    },

    getProgressColor(status) {
      const key = String(status || '').toLowerCase();
      if (key === 'approved' || key === 'announced') return 'success';
      if (key === 'rejected') return 'danger';
      if (key === 'revision_requested') return 'warning';
      if (key === 'draft') return 'secondary';
      return 'primary';
    },

    isAnimatedStatus(status) {
      const key = String(status || '').toLowerCase();
      return [
        'submitted',
        'faculty_review_pending',
        'under_review',
        'document_checking',
        'assigned_to_committee'
      ].includes(key);
    },

    getProgressLabel(status) {
      const key = String(status || '').toLowerCase();
      const labels = {
        draft: 'ขั้นที่ 1/10 — กำลังร่าง',
        submitted: 'ขั้นที่ 2/10 — ยื่นโครงการแล้ว',
        faculty_review_pending: 'ขั้นที่ 3/10 — รอประธานพิจารณา',
        faculty_approved: 'ขั้นที่ 4/10 — ประธานอนุมัติ',
        office_received: 'ขั้นที่ 5/10 — ส่วนบริหารรับแล้ว',
        document_checking: 'ขั้นที่ 5/10 — ตรวจสอบเอกสาร',
        assigned_to_committee: 'ขั้นที่ 6/10 — มอบหมายกรรมการแล้ว',
        under_review: 'ขั้นที่ 7/10 — กำลังพิจารณา',
        meeting_completed: 'ขั้นที่ 8/10 — ประชุมเสร็จแล้ว',
        revision_requested: 'ขอแก้ไข — กรุณาแก้ไขเอกสาร',
        resubmitted: 'ส่งแก้ไขแล้ว — รอพิจารณารอบ 2',
        second_round_review: 'ขั้นที่ 7/10 — พิจารณารอบ 2',
        approved: 'ขั้นที่ 10/10 — อนุมัติแล้ว ✓',
        rejected: 'ขั้นที่ 10/10 — ไม่ผ่านการพิจารณา',
        announced: 'ขั้นที่ 10/10 — ประกาศผลแล้ว ✓',
      };
      return labels[key] || 'กำลังดำเนินการ';
    },

    getProgressText(status) {
      const key = String(status || '').toLowerCase();
      const pct = this.getProgressPercent(key);
      if (key === 'approved' || key === 'announced') return 'อนุมัติแล้ว';
      if (key === 'rejected') return 'ไม่ผ่าน';
      if (key === 'revision_requested') return 'รอแก้ไข';
      return `${pct}%`;
    },

    getSegmentWidth(segmentStatus, currentStatus) {
      const order = [
        'draft',
        'submitted',
        'faculty_review_pending',
        'office_received',
        'document_checking',
        'assigned_to_committee',
        'under_review',
        'meeting_completed',
        'approved'
      ];
      const currentIdx = order.indexOf(String(currentStatus || '').toLowerCase());
      const segmentIdx = order.indexOf(String(segmentStatus || '').toLowerCase());
      if (segmentIdx < 0 || currentIdx < 0) return 0;
      if (segmentIdx < currentIdx) return 11;
      if (segmentIdx === currentIdx) return 11;
      return 0;
    },

    formatDate(date) {
      if (!date) return "-";
      return new Date(date).toLocaleDateString("th-TH", {
        year: "numeric", month: "short", day: "numeric",
      });
    },

    goToDetail(id) {
      this.$router.push(`/research-form/${id}`);
    },

    onAdd() { this.$router.push({ name: 'ResearchForm', query: { new: '1' } }); },
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
