<template>
  <div class="committee-summary-page">
    <div class="page-hero mb-4">
      <div class="hero-title">
        <span class="hero-icon" aria-hidden="true">
          <CIcon name="cil-speedometer" width="34" height="34" />
        </span>
        <div>
          <h2>แดชบอร์ดสรุปผล</h2>
          <div class="subtext">สรุปภาพรวมงานที่ได้รับมอบหมาย สถานะการประเมิน และภาพรวมการประชุม</div>
        </div>
      </div>
      <div class="hero-actions mt-1">
        <div class="filter-bar">
          <div class="filter-bar__selects">
            <vSelect
              class="filter-select"
              :options="roundFilterOptions"
              label="label"
              :reduce="o => o.value"
              :clearable="false"
              :searchable="false"
              :value="filterRound"
              @input="onRoundChange"
            />
            <vSelect
              class="filter-select"
              :options="fundTypeFilterOptions"
              label="label"
              :reduce="o => o.value"
              :clearable="false"
              :searchable="false"
              :value="filterFundType"
              @input="onFundTypeChange"
            />
            <vSelect
              class="filter-select"
              :options="decisionFilterOptions"
              label="label"
              :reduce="o => o.value"
              :clearable="false"
              :searchable="false"
              :value="filterDecision"
              @input="onDecisionChange"
            />
          </div>

          <div class="filter-bar__actions">
            <CButton
              size="sm"
              color="secondary"
              variant="outline"
              class="filter-btn"
              :disabled="loading || filteredAssignedProposals.length === 0"
              @click="exportOverviewCsv"
            >
              <CIcon name="cil-cloud-download" class="mr-1" />
              Export CSV
            </CButton>
          </div>
        </div>
      </div>
    </div>

    <CRow class="mb-3">
      <CCol sm="6" lg="3" class="mb-2">
        <div class="kpi-card kpi-card--all">
          <small class="kpi-label">ทั้งหมด</small>
          <div class="kpi-number">{{ proposalKpis.total }}</div>
          <div class="kpi-note">โครงการที่ได้รับมอบหมาย</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3" class="mb-2">
        <div class="kpi-card kpi-card--pending">
          <small class="kpi-label">รอการประเมิน</small>
          <div class="kpi-number">{{ proposalKpis.pending }}</div>
          <div class="kpi-note">ยังไม่ได้ส่งผลประเมิน</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3" class="mb-2">
        <div class="kpi-card kpi-card--revision">
          <small class="kpi-label">ขอแก้ไขเพิ่มเติม</small>
          <div class="kpi-number">{{ proposalKpis.revision }}</div>
          <div class="kpi-note">สถานะต้องแก้ไข</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3" class="mb-2">
        <div class="kpi-card kpi-card--reviewed">
          <small class="kpi-label">ประเมินแล้ว</small>
          <div class="kpi-number">{{ proposalKpis.reviewed }}</div>
          <div class="kpi-note">ส่งผลประเมินแล้ว</div>
        </div>
      </CCol>
    </CRow>

    <CRow class="mb-3">
      <CCol lg="6" class="mb-2">
        <CCard>
          <CCardHeader class="font-weight-bold">สรุปผลการพิจารณา (เฉพาะที่ส่งผลแล้ว)</CCardHeader>
          <CCardBody>
            <div class="decision-layout">
              <div class="decision-left">
                <div class="decision-grid">
                  <div class="decision-item decision-item--approve">
                    <div class="decision-item__label">อนุมัติ</div>
                    <div class="decision-item__value">{{ decisionStats.approve }}</div>
                    <CProgress class="progress-xs" color="success" :value="decisionStats.approvePct" />
                  </div>
                  <div class="decision-item decision-item--revise">
                    <div class="decision-item__label">ขอแก้ไข</div>
                    <div class="decision-item__value">{{ decisionStats.revise }}</div>
                    <CProgress class="progress-xs" color="info" :value="decisionStats.revisePct" />
                  </div>
                  <div class="decision-item decision-item--reject">
                    <div class="decision-item__label">ไม่อนุมัติ</div>
                    <div class="decision-item__value">{{ decisionStats.reject }}</div>
                    <CProgress class="progress-xs" color="danger" :value="decisionStats.rejectPct" />
                  </div>
                </div>
                <div class="text-muted small mt-2">รวม {{ decisionStats.total }} รายการ</div>
              </div>

              <div class="decision-right">
                <div class="chart-title chart-title--tight">กราฟสรุปผลการพิจารณา</div>
                <div v-if="decisionStats.total === 0" class="text-muted small text-center py-3">
                  ยังไม่มีข้อมูลผลการพิจารณา
                </div>
                <div v-else class="chart-wrap chart-wrap--doughnut">
                  <CChartDoughnut
                    :datasets="decisionDoughnut.datasets"
                    :labels="decisionDoughnut.labels"
                    :options="doughnutOptions"
                  />
                </div>
              </div>
            </div>
          </CCardBody>
        </CCard>

        <CCard class="mt-1">
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
              <div class="chart-wrap chart-wrap--doughnut">
                <CChartDoughnut
                  :datasets="proposalDoughnut.datasets"
                  :labels="proposalDoughnut.labels"
                  :options="doughnutOptions"
                />
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol lg="6" class="mb-2">
        <CCard>
          <CCardHeader class="font-weight-bold">คะแนนและงานค้าง</CCardHeader>
          <CCardBody>
            <div class="score-row">
              <div class="score-box">
                <div class="score-box__label">คะแนนเฉลี่ย (% ของคะแนนเต็ม)</div>
                <div class="score-box__value">{{ scoreStats.avgPercentDisplay }}</div>
                <CProgress class="mt-1" color="warning" :value="scoreStats.avgPercent" />
              </div>
              <div class="stale-box">
                <div class="stale-box__label">งานที่ยังไม่ส่งผล</div>
                <div class="stale-box__value">{{ staleStats.pending }}</div>
                <div class="stale-box__sub">
                  ค้างเกิน 7 วัน: <strong>{{ staleStats.over7Days }}</strong> |
                  เกิน 14 วัน: <strong>{{ staleStats.over14Days }}</strong>
                </div>
              </div>
            </div>
          </CCardBody>
        </CCard>

        <CCard class="mt-1">
          <CCardHeader class="font-weight-bold">ภาพรวมการประชุม</CCardHeader>
          <CCardBody>
            <div v-if="meetingSummaryLoading" class="text-center py-4">
              <CSpinner color="primary" size="sm" />
              <span class="text-muted ml-2">กำลังโหลดสรุปการประชุม...</span>
            </div>
            <div v-else>
              <CRow class="mb-2">
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
              <CRow class="mb-2">
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

              <div class="chart-wrap chart-wrap--bar">
                <CChartBar :datasets="meetingBar.datasets" :labels="meetingBar.labels" :options="meetingBar.options" />
              </div>

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
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'

export default {
  name: 'CommitteeDashboardSummary',
  components: { CChartBar, CChartDoughnut, vSelect },
  data() {
    return {
      loading: false,
      fetchError: null,
      proposalsRaw: [],
      myReviewsRaw: [],
      filterRound: 'all',
      filterFundType: 'all',
      filterDecision: 'all',
      meetingSummaryLoading: false,
      meetingSummary: {
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        total: 0
      }
    }
  },
  mounted() {
    this.fetchAssignedProposals()
    this.fetchMeetingSummary()
  },
  computed: {
    currentUser() {
      try {
        const raw = localStorage.getItem('auth_user')
        return raw ? JSON.parse(raw) : null
      } catch (e) {
        return null
      }
    },
    currentUserId() {
      const user = this.currentUser
      return user && user._id ? String(user._id) : ''
    },
    assignedProposalsRaw() {
      if (!(this.currentUser && this.currentUser.role === 'committee' && this.currentUserId)) {
        return this.proposalsRaw || []
      }

      return (this.proposalsRaw || []).filter(p => {
        const ids = Array.isArray(p && p.committeeIds) ? p.committeeIds.map(x => String(x)) : []
        return ids.includes(this.currentUserId)
      })
    },
    reviewMap() {
      const map = {}
        ; (this.myReviewsRaw || []).forEach(r => {
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
    filteredAssignedProposals() {
      const rows = this.assignedProposalsRaw || []
      return rows.filter(p => {
        const roundNo = this.deriveRoundNo(p)
        const fundTypeLabel = this.fundTypeLabel(p)
        const proposalId = p && p._id ? String(p._id) : ''
        const review = proposalId ? this.reviewMap[proposalId] : null
        const isReviewed = Boolean(review && review.reviewStatus === 'submitted')

        if (this.filterRound !== 'all') {
          const target = Number(this.filterRound)
          if (Number(roundNo) !== target) return false
        }

        if (this.filterFundType !== 'all') {
          if (String(fundTypeLabel || '-') !== String(this.filterFundType)) return false
        }

        if (this.filterDecision !== 'all') {
          if (this.filterDecision === 'none') return !isReviewed
          if (!isReviewed) return false
          const decision = String(review && review.decision ? review.decision : '')
          return decision === String(this.filterDecision)
        }

        return true
      })
    },
    bucketCounts() {
      const counts = { pending: 0, reviewed: 0, revision: 0, total: 0 }
      const rows = this.filteredAssignedProposals || []
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
    proposalKpis() {
      return {
        total: this.bucketCounts.total,
        pending: this.bucketCounts.pending,
        revision: this.bucketCounts.revision,
        reviewed: this.bucketCounts.reviewed
      }
    },
    proposalDoughnut() {
      return {
        labels: ['รอการประเมิน', 'ขอแก้ไขเพิ่มเติม', 'ประเมินแล้ว'],
        datasets: [
          {
            backgroundColor: ['rgba(197, 155, 58, 0.5)', 'rgba(139, 26, 26, 0.45)', 'rgba(22, 163, 74, 0.45)'],
            borderColor: ['rgba(197, 155, 58, 1)', 'rgba(139, 26, 26, 1)', 'rgba(22, 163, 74, 1)'],
            borderWidth: 1,
            data: [this.proposalKpis.pending, this.proposalKpis.revision, this.proposalKpis.reviewed]
          }
        ]
      }
    },
    decisionDoughnut() {
      return {
        labels: ['อนุมัติ', 'ขอแก้ไข', 'ไม่อนุมัติ'],
        datasets: [
          {
            backgroundColor: ['rgba(197, 155, 58, 0.5)', 'rgba(139, 26, 26, 0.45)', 'rgba(55, 65, 81, 0.4)'],
            borderColor: ['rgba(197, 155, 58, 1)', 'rgba(139, 26, 26, 1)', 'rgba(55, 65, 81, 1)'],
            borderWidth: 1,
            data: [this.decisionStats.approve, this.decisionStats.revise, this.decisionStats.reject]
          }
        ]
      }
    },
    doughnutOptions() {
      return {
        maintainAspectRatio: false,
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 10,
            fontSize: 12
          }
        },
        tooltips: {
          callbacks: {
            label: function (tooltipItem, data) {
              const label = (data && data.labels && data.labels[tooltipItem.index]) ? data.labels[tooltipItem.index] : ''
              const v = (data && data.datasets && data.datasets[0] && Array.isArray(data.datasets[0].data))
                ? data.datasets[0].data[tooltipItem.index]
                : ''
              return `${label}: ${v}`
            }
          }
        }
      }
    },
    roundFilterOptions() {
      const rows = this.assignedProposalsRaw || []
      const hasRound2 = rows.some(p => Number(this.deriveRoundNo(p)) === 2)
      const base = [
        { value: 'all', label: 'ทุกรอบ' },
        { value: 1, label: 'รอบ 1' }
      ]
      if (hasRound2) base.push({ value: 2, label: 'รอบ 2' })
      return base
    },
    fundTypeFilterOptions() {
      const rows = this.assignedProposalsRaw || []
      const labels = rows.map(p => String(this.fundTypeLabel(p) || '-'))
      const unique = Array.from(new Set(labels.filter(Boolean)))

      const ordered = [
        'ทุนนักวิจัยรุ่นใหม่',
        'ทุนพัฒนานักวิจัย',
        'ทุนวิจัยที่สอดคล้องกับยุทธศาสตร์',
        'ทุนต่อยอดสู่ภาคอุตสาหกรรม'
      ]

      // Always show all 4 types (even if current data has none for some types).
      const options = ordered.map(label => ({ value: label, label }))

      // Keep unknown/missing types (and '-' if any) at the end.
      const rest = unique
        .filter(label => !ordered.includes(label))
        .sort((a, b) => a.localeCompare(b, 'th'))
        .map(v => ({ value: v, label: v === '-' ? 'ไม่ระบุ' : v }))

      return [{ value: 'all', label: 'ทุกประเภททุน' }].concat(options, rest)
    },
    decisionFilterOptions() {
      return [
        { value: 'all', label: 'ทุกผลการพิจารณา' },
        { value: 'approve', label: 'อนุมัติ' },
        { value: 'revise', label: 'ขอแก้ไข' },
        { value: 'reject', label: 'ไม่อนุมัติ' },
        { value: 'none', label: 'ยังไม่ส่งผล' }
      ]
    },
    decisionStats() {
      const reviewed = (this.filteredAssignedProposals || []).filter(p => {
        const pid = p && p._id ? String(p._id) : ''
        const review = pid ? this.reviewMap[pid] : null
        return Boolean(review && review.reviewStatus === 'submitted')
      })
      const total = reviewed.length
      const countBy = (key) => reviewed.filter(p => {
        const pid = p && p._id ? String(p._id) : ''
        const review = pid ? this.reviewMap[pid] : null
        return String(review && review.decision ? review.decision : '') === key
      }).length
      const approve = countBy('approve')
      const revise = countBy('revise')
      const reject = countBy('reject')
      const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0
      return {
        total,
        approve,
        revise,
        reject,
        approvePct: pct(approve),
        revisePct: pct(revise),
        rejectPct: pct(reject)
      }
    },
    scoreStats() {
      const reviewed = (this.filteredAssignedProposals || []).map(p => {
        const pid = p && p._id ? String(p._id) : ''
        const review = pid ? this.reviewMap[pid] : null
        return review && review.reviewStatus === 'submitted' ? review : null
      }).filter(Boolean)
      const percents = reviewed
        .map(r => {
          const totalScore = (typeof r.totalScore === 'number') ? Number(r.totalScore) : null
          const maxScore = (typeof r.maxScore === 'number') ? Number(r.maxScore) : null
          if (totalScore === null || !maxScore) return null
          return (totalScore / maxScore) * 100
        })
        .filter(v => typeof v === 'number' && Number.isFinite(v))
      if (!percents.length) {
        return { avgPercent: 0, avgPercentDisplay: '-' }
      }
      const avg = percents.reduce((a, b) => a + b, 0) / percents.length
      const rounded = Math.round(avg * 10) / 10
      return {
        avgPercent: Math.max(0, Math.min(100, rounded)),
        avgPercentDisplay: `${rounded}%`
      }
    },
    staleStats() {
      const rows = this.filteredAssignedProposals || []
      const pending = rows.filter(p => {
        const pid = p && p._id ? String(p._id) : ''
        const review = pid ? this.reviewMap[pid] : null
        return !(review && review.reviewStatus === 'submitted')
      })
      const daysSince = (dateStr) => {
        const d = new Date(dateStr || 0)
        if (Number.isNaN(d.getTime())) return null
        const diff = Date.now() - d.getTime()
        return Math.floor(diff / (1000 * 60 * 60 * 24))
      }
      let over7Days = 0
      let over14Days = 0
      pending.forEach(p => {
        const baseDate = p && (p.submittedAt || p.createdAt) ? (p.submittedAt || p.createdAt) : null
        const days = daysSince(baseDate)
        if (days === null) return
        if (days > 7) over7Days += 1
        if (days > 14) over14Days += 1
      })
      return { pending: pending.length, over7Days, over14Days }
    },
    meetingBar() {
      return {
        labels: ['กำหนดการแล้ว', 'เสร็จสิ้น', 'ยกเลิก'],
        datasets: [
          {
            label: 'จำนวนการประชุม',
            backgroundColor: ['rgba(181, 133, 34, 0.45)', 'rgba(22, 163, 74, 0.45)', 'rgba(185, 28, 28, 0.45)'],
            borderColor: ['rgba(181, 133, 34, 1)', 'rgba(22, 163, 74, 1)', 'rgba(185, 28, 28, 1)'],
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
    normalizeSelectValue(value) {
      return value && value.target ? value.target.value : value
    },
    onRoundChange(value) {
      this.filterRound = this.normalizeSelectValue(value)
    },
    onFundTypeChange(value) {
      this.filterFundType = this.normalizeSelectValue(value)
    },
    onDecisionChange(value) {
      this.filterDecision = this.normalizeSelectValue(value)
    },
    resetFilters() {
      this.filterRound = 'all'
      this.filterFundType = 'all'
      this.filterDecision = 'all'
    },
    deriveRoundNo(proposal) {
      const status = String(proposal && proposal.currentStatus ? proposal.currentStatus : '').toLowerCase()
      if (status === 'second_round_review' || status.includes('second_round')) return 2
      const round = Number(proposal && proposal.currentRound ? proposal.currentRound : 0)
      return round === 2 ? 2 : 1
    },
    fundTypeLabel(proposal) {
      const ft = proposal && proposal.fundingType ? String(proposal.fundingType) : ''
      const k = ft.toLowerCase()
      if (!k) return '-'
      if (k === 'new-researcher' || k.includes('new')) return 'ทุนนักวิจัยรุ่นใหม่'
      if (k === 'researcher-development' || k.includes('develop')) return 'ทุนพัฒนานักวิจัย'
      if (k.includes('strategic') || k.includes('strategy')) return 'ทุนวิจัยที่สอดคล้องกับยุทธศาสตร์'
      if (k === 'industry-extension' || k.includes('extension') || k.includes('industry')) return 'ทุนต่อยอดสู่ภาคอุตสาหกรรม'
      return ft
    },
    async fetchAssignedProposals() {
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

        const assignedTargets = (this.assignedProposalsRaw || [])
          .map(p => ({
            id: p && p._id ? String(p._id) : '',
            roundNo: this.deriveRoundNo(p)
          }))
          .filter(x => x && x.id)

        if (assignedTargets.length > 0) {
          const settled = await Promise.allSettled(
            assignedTargets.map(t => Service.proposal.getMyReview(encodeURIComponent(t.id), { roundNo: t.roundNo }))
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
    exportOverviewCsv() {
      const items = this.filteredAssignedProposals || []
      const escapeCell = (val) => {
        const s = String(val === null || val === undefined ? '' : val)
        if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
        return s
      }
      const decisionLabel = (key) => {
        if (key === 'approve') return 'อนุมัติ'
        if (key === 'reject') return 'ไม่อนุมัติ'
        if (key === 'revise') return 'ขอแก้ไข'
        return ''
      }
      const statusLabel = (p) => {
        const pid = p && p._id ? String(p._id) : ''
        const review = pid ? this.reviewMap[pid] : null
        if (review && review.reviewStatus === 'submitted') return 'ส่งผลประเมินแล้ว'
        if (p && p.currentStatus === 'revision_requested') return 'ขอแก้ไขเพิ่มเติม'
        return 'รอการประเมิน'
      }
      const rowFor = (p) => {
        const pid = p && p._id ? String(p._id) : ''
        const review = pid ? this.reviewMap[pid] : null
        const roundNo = this.deriveRoundNo(p)
        const fund = this.fundTypeLabel(p)
        const totalScore = review && typeof review.totalScore === 'number' ? review.totalScore : ''
        const maxScore = review && typeof review.maxScore === 'number' ? review.maxScore : ''
        const percent = (typeof totalScore === 'number' && typeof maxScore === 'number' && maxScore)
          ? Math.round((totalScore / maxScore) * 1000) / 10
          : ''
        return [
          p.proposalCode || p._id || '-',
          p.projectTitleTh || p.projectTitleEn || '(ไม่มีชื่อโครงการ)',
          p.projectLeaderName || '-',
          p.projectLeaderAffiliation || p.departmentName || p.facultyName || '-',
          roundNo,
          fund,
          statusLabel(p),
          decisionLabel(String(review && review.decision ? review.decision : '')),
          totalScore,
          maxScore,
          percent,
          p.submittedAt || p.createdAt || '',
          (review && (review.updatedAt || review.submittedAt)) || p.updatedAt || ''
        ]
      }
      const header = [
        'รหัสโครงการ',
        'ชื่อโครงการ',
        'หัวหน้าโครงการ',
        'สังกัด',
        'รอบ',
        'ประเภททุน',
        'สถานะ',
        'ผลการพิจารณา',
        'คะแนนรวม',
        'คะแนนเต็ม',
        'คิดเป็น %',
        'วันที่ส่ง',
        'อัปเดตล่าสุด'
      ]
      const rows = items.map(rowFor)
      const csv = '\ufeff' + [header, ...rows].map(r => r.map(escapeCell).join(',')).join('\r\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const yyyyMmDd = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `committee-overview-${yyyyMmDd}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    },
    async fetchMeetingSummary() {
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
  --theme-red: #8b1a1a;
  --theme-red-dark: #6f1111;
  --theme-gold: #c59b3a;
  --theme-gold-soft: rgba(181, 133, 34, 0.25);
  --theme-ivory: #fffaf0;
  --card-radius: 12px;

  max-width: 1240px;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
}

.page-hero {
  padding: 12px 12px 10px;
  border-radius: var(--card-radius);
  border: 1px solid var(--theme-gold-soft);
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.28), transparent 30%),
    linear-gradient(135deg, var(--theme-red) 0%, var(--theme-gold) 115%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.hero-title {
  display: flex;
  gap: 10px;
  align-items: center;
}

.hero-icon {
  width: 60px;
  height: 60px;
  margin: 15px 12px 10px 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.22);
  flex: 0 0 auto;
}

.page-hero h2 {
  margin: 0;
  font-size: 1.65rem;
  font-weight: 800;
  color: #ffffff;
  text-align: start;
}

.subtext {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.84);
  font-size: 0.95rem;
  text-align: center;
}

.hero-actions {
  display: flex;
  align-items: flex-start;
}

.filter-bar {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  justify-content: flex-end;
}

.filter-bar__selects {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.filter-bar__actions {
  display: flex;
  justify-content: flex-end;
}

.filter-select {
  min-width: 140px;
}

.filter-select::v-deep .vs__dropdown-toggle {
  min-height: 34px;
  border-radius: 12px;
  border: 2px solid rgba(181, 133, 34, 0.55);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
  padding: 1px 8px;
  margin-bottom: 15px;
}

.filter-select::v-deep .vs__selected,
.filter-select::v-deep .vs__search {
  font-weight: 800;
  color: #1f2937;
  margin: 0;
}

.filter-select::v-deep .vs__search::placeholder {
  color: rgba(31, 41, 55, 0.62);
  font-weight: 700;
}

.filter-select::v-deep .vs__actions {
  padding: 0 2px 0 6px;
}

.filter-select::v-deep .vs__open-indicator {
  fill: rgba(111, 17, 17, 0.92);
}

.filter-select.vs--open::v-deep .vs__dropdown-toggle,
.filter-select.vs--focused::v-deep .vs__dropdown-toggle {
  border-color: rgba(181, 133, 34, 0.92);
  box-shadow: 0 0 0 3px rgba(181, 133, 34, 0.18), 0 12px 22px rgba(15, 23, 42, 0.09);
}

.filter-select::v-deep .vs__dropdown-menu {
  margin-top: 6px;
  border-radius: 14px;
  border: 1px solid rgba(181, 133, 34, 0.55) !important;
  background: #fffaf2 !important;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
  padding: 6px;
  max-height: 260px;
}

.filter-select::v-deep .vs__dropdown-option {
  border-radius: 10px;
  padding: 10px 12px;
  font-weight: 800;
  color: #1f2937 !important;
  background: transparent !important;
}

.filter-select::v-deep .vs__dropdown-option--highlight {
  background: linear-gradient(135deg, rgba(139, 18, 18, 0.92), rgba(197, 155, 58, 0.92)) !important;
  color: #ffffff !important;
}

.filter-select::v-deep .vs__dropdown-option--selected {
  background: rgba(197, 155, 58, 0.18) !important;
  color: #6f1111 !important;
}

.filter-btn {
  white-space: nowrap;
  border-radius: 10px;
  border-color:  rgba(139, 26, 26, 0.98);
  padding: 0.45rem 0.85rem;
  font-weight: 800;
  letter-spacing: 0.2px;
}

.filter-btn::v-deep svg {
  width: 16px;
  height: 16px;
}

.filter-btn::v-deep.btn-outline-warning {
  background: rgba(139, 26, 26, 0.98);
  border-color: rgba(181, 133, 34, 0.95);
  color: #ffffff;
  box-shadow: 0 10px 18px rgba(111, 17, 17, 0.18);
}

.filter-btn::v-deep.btn-outline-warning:hover:not(:disabled) {
  background: rgba(111, 17, 17, 1);
  border-color: rgba(181, 133, 34, 1);
}

.filter-btn::v-deep.btn-outline-secondary {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.35);
  color: #ffffff;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.14);
}

.filter-btn::v-deep.btn-outline-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.55);
}

.filter-btn::v-deep.btn:disabled {
  opacity: 0.55;
  box-shadow: none;
}

.committee-summary-page ::v-deep .card {
  border-radius: var(--card-radius);
  border: 1px solid rgba(181, 133, 34, 0.22);
  box-shadow: 0 10px 24px rgba(111, 17, 17, 0.06);
}

.committee-summary-page ::v-deep .card-header {
  border-top-left-radius: var(--card-radius);
  border-top-right-radius: var(--card-radius);
  background: linear-gradient(90deg, var(--theme-red-dark), var(--theme-red));
  color: #ffffff;
  border-bottom: 2px solid rgba(181, 133, 34, 0.85);
}

.committee-summary-page ::v-deep .card-header.font-weight-bold {
  font-weight: 800;
}

.committee-summary-page ::v-deep .card-body {
  background: #ffffff;
}

.decision-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.decision-item {
  border: 1px solid rgba(181, 133, 34, 0.22);
  border-radius: var(--card-radius);
  padding: 12px 12px 10px;
  background: #ffffff;
}

.decision-item__label {
  color: #6b7280;
  font-size: 0.88rem;
  font-weight: 700;
}

.decision-item__value {
  margin-top: 6px;
  font-size: 1.55rem;
  font-weight: 900;
  color: #111827;
  line-height: 1;
}

.chart-title {
  font-weight: 900;
  color: #111827;
  font-size: 0.95rem;
  margin-bottom: 6px;
}

.chart-title--tight {
  margin-bottom: 4px;
}

.decision-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 12px;
  align-items: start;
}

.decision-right {
  border-left: 1px dashed rgba(181, 133, 34, 0.35);
  padding-left: 12px;
}

.chart-wrap {
  width: 100%;
  position: relative;
}

.chart-wrap--doughnut {
  height: 170px;
}

.chart-wrap--bar {
  height: 180px;
}

.score-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.score-box,
.stale-box {
  border: 1px solid rgba(181, 133, 34, 0.22);
  border-radius: var(--card-radius);
  padding: 12px;
  background: #ffffff;
}

.score-box__label,
.stale-box__label {
  color: #6b7280;
  font-size: 0.88rem;
  font-weight: 700;
}

.score-box__value,
.stale-box__value {
  margin-top: 6px;
  font-size: 1.55rem;
  font-weight: 900;
  color: #111827;
  line-height: 1;
}

.stale-box__sub {
  margin-top: 6px;
  font-size: 0.88rem;
  color: #374151;
}

@media (max-width: 900px) {
  .filter-select {
    min-width: 160px;
  }

  .decision-grid {
    grid-template-columns: 1fr;
  }

  .decision-layout {
    grid-template-columns: 1fr;
  }

  .decision-right {
    border-left: 0;
    padding-left: 0;
    padding-top: 8px;
    border-top: 1px dashed rgba(181, 133, 34, 0.35);
  }

  .score-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .filter-bar {
    justify-content: flex-start;
  }
}

.kpi-card {
  border: 1px solid rgba(181, 133, 34, 0.22);
  border-radius: var(--card-radius);
  background: #ffffff;
  padding: 12px 14px;
  box-shadow: 0 10px 22px rgba(111, 17, 17, 0.06);
  height: 100%;
  position: relative;
  overflow: hidden;
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

.kpi-card::before {
  content: '';
  position: absolute;
  right: -42px;
  top: -42px;
  width: 140px;
  height: 140px;
  border-radius: 9999px;
  background: var(--kpi-accent-soft, rgba(181, 133, 34, 0.12));
  pointer-events: none;
}

.kpi-card--all {
  /* Match Committee Meetings page background vibe (#fffaf2) */
  --kpi-accent: #eadfce;
  --kpi-accent-soft: rgba(234, 223, 206, 0.7);
  border-top: 5px solid var(--kpi-accent);
  background: #fffaf2;
}

.kpi-card--pending {
  --kpi-accent: #f59e0b;
  --kpi-accent-soft: rgba(245, 158, 11, 0.14);
  border-top: 5px solid var(--kpi-accent);
}

.kpi-card--revision {
  --kpi-accent: var(--theme-red);
  --kpi-accent-soft: rgba(139, 26, 26, 0.12);
  border-top: 5px solid var(--kpi-accent);
}

.kpi-card--reviewed {
  --kpi-accent: #16a34a;
  --kpi-accent-soft: rgba(22, 163, 74, 0.12);
  border-top: 5px solid var(--kpi-accent);
}

.meeting-kpi {
  border: 1px solid rgba(181, 133, 34, 0.22);
  border-radius: var(--card-radius);
  background: #fff;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.meeting-kpi__label {
  color: #6b7280;
  font-size: 0.92rem;
}

.meeting-kpi__value {
  font-weight: 900;
  font-size: 1.35rem;
  color: #111827;
}

.meeting-kpi--scheduled {
  border-left: 4px solid rgba(181, 133, 34, 0.95);
}

.meeting-kpi--completed {
  border-left: 4px solid rgba(22, 163, 74, 0.95);
}

.meeting-kpi--cancelled {
  border-left: 4px solid rgba(185, 28, 28, 0.95);
}

.meeting-kpi--total {
  border-left: 4px solid rgba(107, 114, 128, 0.85);
}
</style>
