<template>
  <div class="committee-summary-page">
    <div class="page-hero mb-4">
      <div class="hero-title">
        <span class="hero-icon mt-2" aria-hidden="true">
          <CIcon name="cil-speedometer" />
        </span>
        <div>
          <h2>แดชบอร์ดสรุปผล</h2>
          <div class="subtext">สรุปภาพรวมงานที่ได้รับมอบหมาย สถานะการประเมิน และภาพรวมการประชุม</div>
        </div>
      </div>
      <div class="hero-actions">
      </div>
    </div>

    <CRow class="mb-4">
      <CCol sm="6" lg="3" class="mb-3">
        <div class="kpi-card kpi-card--all">
          <small class="kpi-label">ทั้งหมด</small>
          <div class="kpi-number">{{ proposalKpis.total }}</div>
          <div class="kpi-note">โครงการที่ได้รับมอบหมาย</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3" class="mb-3">
        <div class="kpi-card kpi-card--pending">
          <small class="kpi-label">รอการประเมิน</small>
          <div class="kpi-number">{{ proposalKpis.pending }}</div>
          <div class="kpi-note">ยังไม่ได้ส่งผลประเมิน</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3" class="mb-3">
        <div class="kpi-card kpi-card--revision">
          <small class="kpi-label">ขอแก้ไขเพิ่มเติม</small>
          <div class="kpi-number">{{ proposalKpis.revision }}</div>
          <div class="kpi-note">สถานะต้องแก้ไข</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3" class="mb-3">
        <div class="kpi-card kpi-card--reviewed">
          <small class="kpi-label">ประเมินแล้ว</small>
          <div class="kpi-number">{{ proposalKpis.reviewed }}</div>
          <div class="kpi-note">ส่งผลประเมินแล้ว</div>
        </div>
      </CCol>
    </CRow>

    <CRow class="mb-4">
      <CCol lg="6" class="mb-3">
        <CCard>
          <CCardHeader class="font-weight-bold">สัดส่วนสถานะงานที่ได้รับมอบหมาย</CCardHeader>
          <CCardBody>
            <div v-if="loading" class="text-center py-4">
              <CSpinner color="primary" size="sm" />
              <span class="text-muted ml-2">กำลังโหลดข้อมูล...</span>
            </div>
            <div v-else-if="fetchError" class="text-center py-4">
              <div class="text-danger mb-2">โหลดข้อมูลไม่สำเร็จ</div>
              <small class="text-muted">{{ fetchError }}</small>
            </div>
            <div v-else>
              <CChartDoughnut :datasets="proposalDoughnut.datasets" :labels="proposalDoughnut.labels" />
            </div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol lg="6" class="mb-3">
        <CCard>
          <CCardHeader class="font-weight-bold">ภาพรวมการประชุม</CCardHeader>
          <CCardBody>
            <div v-if="meetingSummaryLoading" class="text-center py-4">
              <CSpinner color="primary" size="sm" />
              <span class="text-muted ml-2">กำลังโหลดสรุปการประชุม...</span>
            </div>
            <div v-else>
              <CRow class="mb-3">
                <CCol sm="6" class="mb-2 mb-sm-0">
                  <div class="meeting-kpi meeting-kpi--scheduled">
                    <div class="meeting-kpi__label">กำหนดการแล้ว</div>
                    <div class="meeting-kpi__value">{{ meetingSummary.scheduled }}</div>
                  </div>
                </CCol>
                <CCol sm="6">
                  <div class="meeting-kpi meeting-kpi--completed">
                    <div class="meeting-kpi__label">เสร็จสิ้น</div>
                    <div class="meeting-kpi__value">{{ meetingSummary.completed }}</div>
                  </div>
                </CCol>
              </CRow>
              <CRow class="mb-3">
                <CCol sm="6" class="mb-2 mb-sm-0">
                  <div class="meeting-kpi meeting-kpi--cancelled">
                    <div class="meeting-kpi__label">ยกเลิก</div>
                    <div class="meeting-kpi__value">{{ meetingSummary.cancelled }}</div>
                  </div>
                </CCol>
                <CCol sm="6">
                  <div class="meeting-kpi meeting-kpi--total">
                    <div class="meeting-kpi__label">ทั้งหมด</div>
                    <div class="meeting-kpi__value">{{ meetingSummary.total }}</div>
                  </div>
                </CCol>
              </CRow>

              <CChartBar :datasets="meetingBar.datasets" :labels="meetingBar.labels" :options="meetingBar.options" />

              <div class="text-right mt-3">
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  </div>
</template>

<script>
import Service, { instance as axios } from '@/service/api'
import { CChartBar, CChartDoughnut } from '@coreui/vue-chartjs'

export default {
  name: 'CommitteeDashboardSummary',
  components: { CChartBar, CChartDoughnut },
  data () {
    return {
      loading: false,
      fetchError: null,
      proposalsRaw: [],
      myReviewsRaw: [],
      meetingSummaryLoading: false,
      meetingSummary: {
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        total: 0
      }
    }
  },
  mounted () {
    this.fetchAssignedProposals()
    this.fetchMeetingSummary()
  },
  computed: {
    currentUser () {
      try {
        const raw = localStorage.getItem('auth_user')
        return raw ? JSON.parse(raw) : null
      } catch (e) {
        return null
      }
    },
    currentUserId () {
      const user = this.currentUser
      return user && user._id ? String(user._id) : ''
    },
    assignedProposalsRaw () {
      if (!(this.currentUser && this.currentUser.role === 'committee' && this.currentUserId)) {
        return this.proposalsRaw || []
      }

      return (this.proposalsRaw || []).filter(p => {
        const ids = Array.isArray(p && p.committeeIds) ? p.committeeIds.map(x => String(x)) : []
        return ids.includes(this.currentUserId)
      })
    },
    reviewMap () {
      const map = {}
      ;(this.myReviewsRaw || []).forEach(r => {
        const pid = r && r.proposalId ? String(r.proposalId) : ''
        if (!pid) return
        const current = map[pid]
        if (!current) {
          map[pid] = r
          return
        }
        const currentTs = new Date(current.updatedAt || current.submittedAt || 0).getTime()
        const nextTs = new Date(r.updatedAt || r.submittedAt || 0).getTime()
        if (nextTs >= currentTs) map[pid] = r
      })
      return map
    },
    bucketCounts () {
      const counts = { pending: 0, reviewed: 0, revision: 0, total: 0 }
      const rows = this.assignedProposalsRaw || []
      counts.total = rows.length

      rows.forEach(p => {
        const proposalId = p && p._id ? String(p._id) : ''
        const review = proposalId ? this.reviewMap[proposalId] : null
        const isReviewed = Boolean(review && review.reviewStatus === 'submitted')
        if (isReviewed) {
          counts.reviewed += 1
          return
        }
        if (p && p.currentStatus === 'revision_requested') {
          counts.revision += 1
          return
        }
        counts.pending += 1
      })

      return counts
    },
    proposalKpis () {
      return {
        total: this.bucketCounts.total,
        pending: this.bucketCounts.pending,
        revision: this.bucketCounts.revision,
        reviewed: this.bucketCounts.reviewed
      }
    },
    proposalDoughnut () {
      return {
        labels: ['รอการประเมิน', 'ขอแก้ไขเพิ่มเติม', 'ประเมินแล้ว'],
        datasets: [
          {
            backgroundColor: ['#f59e0b', '#0ea5e9', '#22c55e'],
            data: [this.proposalKpis.pending, this.proposalKpis.revision, this.proposalKpis.reviewed]
          }
        ]
      }
    },
    meetingBar () {
      return {
        labels: ['กำหนดการแล้ว', 'เสร็จสิ้น', 'ยกเลิก'],
        datasets: [
          {
            label: 'จำนวนการประชุม',
            backgroundColor: ['rgba(59, 130, 246, 0.55)', 'rgba(34, 197, 94, 0.55)', 'rgba(239, 68, 68, 0.55)'],
            borderColor: ['rgba(59, 130, 246, 1)', 'rgba(34, 197, 94, 1)', 'rgba(239, 68, 68, 1)'],
            borderWidth: 1,
            data: [this.meetingSummary.scheduled, this.meetingSummary.completed, this.meetingSummary.cancelled]
          }
        ],
        options: {
          maintainAspectRatio: false,
          legend: { display: false },
          scales: {
            yAxes: [{ ticks: { beginAtZero: true, precision: 0 } }]
          }
        }
      }
    }
  },
  methods: {
    async fetchAssignedProposals () {
      this.loading = true
      this.fetchError = null
      this.myReviewsRaw = []
      try {
        const proposalRes = await Service.proposal.list({ page: 1, limit: 300 })
        const proposalPayload = proposalRes && proposalRes.data ? proposalRes.data : null
        let proposals = []
        if (Array.isArray(proposalPayload)) proposals = proposalPayload
        else if (proposalPayload && proposalPayload.data && Array.isArray(proposalPayload.data.items)) proposals = proposalPayload.data.items
        else if (proposalPayload && proposalPayload.data && Array.isArray(proposalPayload.data.data)) proposals = proposalPayload.data.data
        else if (proposalPayload && proposalPayload.data && Array.isArray(proposalPayload.data)) proposals = proposalPayload.data

        this.proposalsRaw = proposals

        const assignedIds = (this.assignedProposalsRaw || [])
          .map(p => p && p._id ? String(p._id) : '')
          .filter(Boolean)

        if (assignedIds.length > 0) {
          const settled = await Promise.allSettled(
            assignedIds.map(id => Service.proposal.getMyReview(encodeURIComponent(id), { roundNo: 1 }))
          )

          const reviews = []
          settled.forEach(result => {
            if (result.status === 'fulfilled') {
              const payload = result.value && result.value.data ? result.value.data : null
              const review = payload && payload.data ? payload.data : null
              if (review && review.proposalId) reviews.push(review)
            }
          })

          this.myReviewsRaw = reviews
        }
      } catch (err) {
        this.proposalsRaw = []
        this.myReviewsRaw = []
        this.fetchError = (err && err.response && err.response.data && err.response.data.message) || err.message || 'Unknown error'
      } finally {
        this.loading = false
      }
    },
    async fetchMeetingSummary () {
      this.meetingSummaryLoading = true
      try {
        const response = await axios.get('/api/v1/meetings/summary')
        const payload = (response && response.data && response.data.data) || {}
        this.meetingSummary = {
          scheduled: Number(payload.scheduled) || 0,
          completed: Number(payload.completed) || 0,
          cancelled: Number(payload.cancelled) || 0,
          total: Number(payload.total) || 0
        }
      } catch (error) {
        this.meetingSummary = { scheduled: 0, completed: 0, cancelled: 0, total: 0 }
      } finally {
        this.meetingSummaryLoading = false
      }
    }
  }
}
</script>

<style scoped>
.committee-summary-page {
  max-width: 1240px;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
}

.page-hero {
  padding: 14px 14px 12px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.hero-title {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.hero-icon {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #d7e1ff;
  color: #4338ca;
  flex: 0 0 auto;
}

.page-hero h2 {
  margin: 0;
  font-size: 1.65rem;
  font-weight: 800;
  color: #111827;
}

.subtext {
  margin-top: 4px;
  color: #6b7280;
  font-size: 0.95rem;
}

.hero-actions {
  display: flex;
  align-items: flex-start;
}

.kpi-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  background: #ffffff;
  padding: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  height: 100%;
}

.kpi-label {
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.kpi-number {
  font-size: 1.8rem;
  font-weight: 900;
  margin-top: 6px;
  color: #111827;
}

.kpi-note {
  font-size: 0.9rem;
  color: #6b7280;
  margin-top: 2px;
}

.kpi-card--all { border-left: 4px solid #4f46e5; }
.kpi-card--pending { border-left: 4px solid #f59e0b; }
.kpi-card--revision { border-left: 4px solid #0ea5e9; }
.kpi-card--reviewed { border-left: 4px solid #22c55e; }

.meeting-kpi {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  background: #fff;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.meeting-kpi__label { color: #6b7280; font-size: 0.92rem; }
.meeting-kpi__value { font-weight: 900; font-size: 1.35rem; color: #111827; }

.meeting-kpi--scheduled { border-left: 4px solid #3b82f6; }
.meeting-kpi--completed { border-left: 4px solid #22c55e; }
.meeting-kpi--cancelled { border-left: 4px solid #ef4444; }
.meeting-kpi--total { border-left: 4px solid #6b7280; }


</style>
