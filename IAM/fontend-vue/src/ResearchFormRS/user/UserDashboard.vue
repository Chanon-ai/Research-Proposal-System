<template>
  <div class="page-content">

    <CRow class="mb-4">
      <CCol sm="6" lg="3">
        <div
          class="widget-click-area widget-draft"
          @click="setFilter('draft')"
          :class="{
            'is-active': activeFilter === 'draft',
            'is-dimmed': activeFilter && activeFilter !== 'draft'
          }"
        >
          <CWidgetDropdown class="user-widget-card" color="gradient-primary" :header="String(stats.draft || 0)" :text="$t('status.draft')">
            <template #footer>
              <div class="widget-footer-chart">
                <CChartLine :datasets="[{ data: chartData.draft, backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.55)' }]" :options="chartOptions"/>
              </div>
            </template>
          </CWidgetDropdown>
        </div>
      </CCol>

      <CCol sm="6" lg="3">
        <div
          class="widget-click-area widget-submitted"
          @click="setFilter('submitted')"
          :class="{
            'is-active': activeFilter === 'submitted',
            'is-dimmed': activeFilter && activeFilter !== 'submitted'
          }"
        >
          <CWidgetDropdown class="user-widget-card" color="gradient-info" :header="String(stats.submitted || 0)" :text="$t('status.inProgress')">
            <template #footer>
              <div class="widget-footer-chart">
                <CChartLine :datasets="[{ data: chartData.submitted, backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.55)' }]" :options="chartOptions"/>
              </div>
            </template>
          </CWidgetDropdown>
        </div>
      </CCol>

      <CCol sm="6" lg="3">
        <div
          class="widget-click-area widget-revision"
          @click="setFilter('revision')"
          :class="{
            'is-active': activeFilter === 'revision',
            'is-dimmed': activeFilter && activeFilter !== 'revision'
          }"
        >
          <CWidgetDropdown class="user-widget-card" color="gradient-warning" :header="String(stats.revision || 0)" :text="$t('status.revision')">
            <template #footer>
              <div class="widget-footer-chart">
                <CChartLine :datasets="[{ data: chartData.revision, backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.55)' }]" :options="chartOptions"/>
              </div>
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
          <CWidgetDropdown class="user-widget-card" color="gradient-success" :header="String(stats.approved || 0)" :text="$t('status.approved')">
            <template #footer>
              <div class="widget-footer-chart">
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
          {{ $t('status.itemsCount', { count: filteredProposals.length }) }}
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
                <div class="status-progress-wrap">
                  <CProgress
                    :value="getProgressPercent(item.currentStatus)"
                    :color="getProgressColor(item.currentStatus)"
                    :animated="['submitted', 'faculty_review_pending', 'under_review', 'document_checking', 'assigned_to_committee'].includes(item.currentStatus)"
                    :striped="item.currentStatus === 'revision_requested'"
                    show-percentage
                    :precision="0"
                    height="16px"
                    class="status-progress-bar mb-1"
                  />
                </div>
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
                  {{ $t('common.show') }}
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
      const userId = user && (user._id || user.id);
      return userId ? String(userId) : null;
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
        draft: this.$t('status.draft'),
        submitted: this.$t('status.inProgress'),
        revision: this.$t('status.revision'),
        approved: this.$t('status.approved'),
        rejected: this.$t('status.rejected'),
      };
      return this.activeFilter
        ? this.$t('status.filteredBy', { label: labels[this.activeFilter] })
        : this.$t('status.allProjects');
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
        draft: this.$t('status.draft'),
        submitted: this.$t('status.inProgress'),
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
        approved: this.$t('status.approved'),
        rejected: this.$t('status.rejected'),
        announced: 'ประกาศผลแล้ว',
      };
      return labels[key] || this.$t('status.inProgress');
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
      const stepInfo = this.workflowSteps.find(step => step.key === key);
      if (!stepInfo) return 0;
      const totalSteps = 10;
      const currentStep = Number(stepInfo.step) || 0;
      const percent = (currentStep / totalSteps) * 100;
      return Math.max(0, Math.min(100, Math.round(percent)));
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
.page-content {
  padding: 24px 28px;
  flex: 1;
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

.widget-click-area .user-widget-card ::v-deep(.card-footer) {
  border-radius: 0 0 0.5rem 0.5rem;
  overflow: hidden;
}

.widget-draft .user-widget-card::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect x='26' y='18' width='68' height='84' rx='10' fill='white' fill-opacity='0.9'/%3E%3Crect x='38' y='38' width='44' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3Crect x='38' y='52' width='40' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3Crect x='38' y='66' width='33' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3Cpath d='M84 18v20h20' fill='white' fill-opacity='0.72'/%3E%3C/svg%3E");
}

.widget-submitted .user-widget-card::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='36' cy='36' r='11' fill='white' fill-opacity='0.9'/%3E%3Ccircle cx='84' cy='60' r='11' fill='white' fill-opacity='0.9'/%3E%3Ccircle cx='44' cy='88' r='11' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M44 36h28M75 41l8-5-8-5M75 84l8 5-8 5M54 83l23-16' stroke='%23000000' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.22' fill='none'/%3E%3C/svg%3E");
}

.widget-revision .user-widget-card::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect x='24' y='20' width='72' height='80' rx='12' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M42 74l10 10 24-24' stroke='%23000000' stroke-width='6' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.22' fill='none'/%3E%3Cpath d='M72 34l12 12M61 45l23-23 12 12-23 23H61z' fill='%23000000' fill-opacity='0.2'/%3E%3C/svg%3E");
}

.widget-approved .user-widget-card::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M46 61l9 9 20-20' stroke='%23000000' stroke-width='8' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.24' fill='none'/%3E%3Ccircle cx='60' cy='60' r='44' stroke='white' stroke-opacity='0.42' stroke-width='5' fill='none'/%3E%3C/svg%3E");
}

.widget-footer-chart {
  position: relative;
  z-index: 2;
  height: 70px;
  width: 100%;
  max-width: 100%;
  padding-right: 8px;
  overflow: hidden;
  border-radius: inherit;
}

.widget-footer-chart ::v-deep(canvas),
.widget-footer-chart ::v-deep(svg) {
  display: block;
  width: 100% !important;
  max-width: 100%;
  overflow: hidden;
}

@media (max-width: 991.98px) {
  .widget-click-area {
    margin-bottom: 0.25rem;
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
}

.state-box {
  text-align: center;
  padding: 48px 20px;
}

.status-progress-wrap {
  width: 100%;
  max-width: 220px;
  margin: 0 auto;
}

.status-progress-bar {
  font-size: 10px;
  line-height: 16px;
}

.status-progress-bar ::v-deep(.progress) {
  margin-bottom: 0;
}

.status-progress-bar ::v-deep(.progress-bar) {
  white-space: nowrap;
  text-align: center;
  font-weight: 600;
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
