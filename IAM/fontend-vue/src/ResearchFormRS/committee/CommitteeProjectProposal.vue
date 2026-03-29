<template>
  <div class="committee-dashboard-page">
    <div class="summary-strip mb-4">
      <div
        v-for="s in summaryTiles"
        :key="s.key"
        class="strip-card"
        :class="[`strip-${s.key}`, { 'strip-active': filterStatus === s.filter } ]"
        role="button"
        tabindex="0"
        @click="setFilter(s.filter)"
        @keydown.enter.prevent="setFilter(s.filter)"
        @keydown.space.prevent="setFilter(s.filter)"
      >
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

    <CRow>
      <CCol col="12" lg="12">
        <CCard class="no-table-divider reviewer-dashboard-card">
          <CCardHeader class="dashboard-card-header">
            <div class="dashboard-card-header__row">
              <div class="dashboard-card-title">ข้อเสนอโครงการที่ได้รับมอบหมาย</div>
              <div class="header-tools">
                <CInput
                  class="search-input"
                  placeholder="ค้นหา..."
                  aria-label="ค้นหาในตาราง"
                  :value.sync="searchQuery"
                />
                <CButton
                  class="collapse-toggle"
                  color="secondary"
                  variant="ghost"
                  size="sm"
                  :aria-label="showTable ? 'พับตาราง' : 'ขยายตาราง'"
                  @click="showTable = !showTable"
                >
                  <CIcon :name="showTable ? 'cil-chevron-top' : 'cil-chevron-bottom'" />
                </CButton>
              </div>
            </div>
          </CCardHeader>
          <CCollapse :show="showTable" :duration="220">
            <CCardBody class="card-body-tight">
              <div v-if="loading" class="text-center py-4">
                <CSpinner color="primary" size="sm" />
                <span class="text-muted ml-2">กำลังโหลดข้อมูลโครงการ...</span>
              </div>
              <div v-else-if="fetchError" class="text-center py-4">
                <div class="text-danger mb-2">โหลดข้อมูลโครงการไม่สำเร็จ</div>
                <small class="text-muted">{{ fetchError }}</small>
              </div>
              <div class="table-surface">
                <CDataTable
                  hover
                  striped
                  :items="displayItems"
                  :fields="fields"
                  :items-per-page="perPage"
                  :active-page="activePage"
                  sorter
                >
                <template #submissionDate="{ item }">
                  <td>
                    {{ formatThaiDateTime(item.submissionDate) }}
                  </td>
                </template>
                <template #statusDisplay="{item}">
                  <td>
                    <div class="status-block">
                      <div class="status-line status-line--status">
                        <span class="status-dot" :class="statusLabelClass(item.committeeProgress || item.status)" aria-hidden="true"></span>
                        <span class="status-text">
                          {{ item.statusDisplay }}<template v-if="item.committeeProgress === 'review_submitted' && item.decisionDisplay && item.decisionDisplay !== 'ไม่ระบุ'">({{ item.decisionDisplay }})</template>
                        </span>
                      </div>
                      <div class="status-line">
                        <span class="reviewer-label">โดย:</span>
                        <span class="reviewer-value">{{ item.reviewer || '-' }}</span>
                      </div>
                        <div class="status-line">
                          <span class="time-label">เวลาล่าสุด:</span>
                          <span class="time-value">{{ formatLatest(item.lastUpdatedAt) }}</span>
                        </div>
                      </div>
                    </td>
                  </template>
                  <template #action="{item}">
                    <td>
                      <CButton size="sm" color="primary" variant="outline" @click="view(item)">
                        <CIcon name="cil-folder-open" class="mr-1" /> ดูรายละเอียด
                      </CButton>
                    </td>
                  </template>
                </CDataTable>
                <div v-if="displayItems.length === 0" class="text-muted text-center py-4">
                  ไม่พบข้อมูลที่ค้นหา
                </div>
                <div class="table-footer">
                  <div class="table-footer__left">
                    <span class="table-footer__label">แสดงต่อหน้า</span>
                    <select v-model.number="perPage" class="form-control form-control-sm per-page-select" aria-label="แสดงต่อหน้า">
                      <option v-for="n in perPageOptions" :key="n" :value="n">{{ n }}</option>
                    </select>
                    <span class="table-footer__suffix">รายการ</span>
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
          </CCollapse>
        </CCard>
      </CCol>
    </CRow>

    <div class="committee-dashboard-row mb-4">
      <div class="committee-block committee-block-meetings">
        <div class="block-head">
          <div class="block-head-left">
            <span class="block-icon block-icon--meetings" aria-hidden="true">
              <CIcon name="cil-calendar" />
            </span>
            <div>
              <div class="block-title">การประชุมที่ใกล้ถึงกำหนด</div>
              <div class="block-sub">แสดงรายการการประชุมที่กำหนดไว้ในระยะใกล้</div>
            </div>
          </div>
          <CButton class="block-action" size="sm" color="primary" variant="outline" @click="goToMeetings"><CIcon name="cil-folder-open" class="mr-1" /> ดูทั้งหมด</CButton>
        </div>
        <div v-if="nextMeetings.length === 0" class="block-empty">ไม่พบรายการการประชุมที่ใกล้ถึงกำหนด</div>
        <div v-else class="block-list">
          <div v-for="meeting in nextMeetings" :key="meeting.id" class="block-item">
            <span class="item-bullet" aria-hidden="true" />
            <div class="item-body">
              <div class="item-title">{{ meeting.title }}</div>
              <div class="item-meta">
                วันที่ {{ meeting.date }} เวลา {{ meeting.time }} น.
                <span class="ml-1">| รูปแบบ: {{ meeting.typeLabel }}</span>
                <span v-if="meeting.type === 'onsite' && meeting.location" class="ml-1">| สถานที่: {{ meeting.location }}</span>
                <span v-else-if="meeting.type === 'online' && meeting.videoLink" class="ml-1">| ลิงก์: {{ meeting.videoLink }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="committee-block committee-block-notifs">
        <div class="block-head">
          <div class="block-head-left">
            <span class="block-icon block-icon--notifs" aria-hidden="true">
              <CIcon name="cil-bell" />
            </span>
            <div>
              <div class="block-title">การแจ้งเตือนที่สำคัญ</div>
              <div class="block-sub">แสดงเหตุการณ์สำคัญล่าสุดเพื่อการติดตาม</div>
            </div>
          </div>
          <CButton class="block-action" size="sm" color="primary" variant="outline" @click="goToNotifications"><CIcon name="cil-folder-open" class="mr-1" /> ดูทั้งหมด</CButton>
        </div>
        <div v-if="latestNotifs.length === 0" class="block-empty">ไม่พบรายการแจ้งเตือนล่าสุด</div>
        <div v-else class="block-list">
          <div v-for="note in latestNotifs" :key="note.id" class="block-item">
            <span class="item-bullet" aria-hidden="true" />
            <div class="item-body">
              <div class="item-title">{{ note.title }}</div>
              <div class="item-meta">{{ note.time }}</div>
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
  name: 'CommitteeProjectProposal',
  data () {
    return {
      loading: false,
      fetchError: null,
      proposalsRaw: [],
      myReviewsRaw: [],
      filterStatus: 'all',
      searchQuery: '',
      activePage: 1,
      perPage: 5,
      perPageOptions: [5, 10, 20, 50],
      showTable: true,
      nextMeetings: [],
      latestNotifs: [],
      fields: [
        { key: 'id', label: 'รหัสโครงการ', _classes: 'font-weight-bold' },
        { key: 'title', label: 'ชื่อโครงการ' },
        { key: 'researcherName', label: 'หัวหน้าโครงการ' },
        { key: 'faculty', label: 'สังกัด' },
        { key: 'submissionDate', label: 'วันที่ส่ง' },
        { key: 'statusDisplay', label: 'สถานะ' },
        { key: 'action', label: '', sorter: false, filter: false }
      ]
    }
  },
  mounted () {
    this.loadLatestNotifsCache()
    this.fetchAssignedProposals()
    this.fetchSidePanels()
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
    mappedProposals () {
      const reviewerName = (this.currentUser && this.currentUser.fullName) || '-'
      const resolveStatus = (currentStatus) => currentStatus || 'draft'

      const resolveAffiliation = (proposal, snapshot) => {
        const top = proposal && (proposal.projectLeaderAffiliation || proposal.departmentName || proposal.facultyName)
        if (top) return top

        const team = snapshot && snapshot.researchTeam ? snapshot.researchTeam : {}
        const leader = team && team.projectLeader ? team.projectLeader : {}
        return leader.affiliation || snapshot.department || snapshot.faculty || '-'
      }

      return (this.proposalsRaw || []).map(p => {
        const snapshot = p && p.formSnapshotJson ? p.formSnapshotJson : {}
        const team = snapshot && snapshot.researchTeam ? snapshot.researchTeam : {}
        const leader = team && team.projectLeader ? team.projectLeader : {}
        const files = Array.isArray(snapshot.files) ? snapshot.files : []
        const currentStatus = resolveStatus(p.currentStatus)
        const proposalId = p._id ? String(p._id) : null
        const review = proposalId ? this.reviewMap[proposalId] : null
        const isReviewed = review && review.reviewStatus === 'submitted'
        const decisionCode = review && review.decision ? String(review.decision).toLowerCase() : ''
        const decisionTone = isReviewed
          ? (decisionCode === 'approve' || decisionCode === 'revise' || decisionCode === 'reject' ? decisionCode : 'unknown')
          : 'none'
        const decisionDisplay = this.decisionLabel(decisionCode, isReviewed)
        const committeeProgress = isReviewed ? 'review_submitted' : 'waiting_for_review'
        const committeeProgressDisplay = isReviewed ? 'ประเมินแล้ว' : 'รอการประเมิน'
        const latestTs = this.getLatestUpdatedAt(proposalId || p.proposalCode || p._id || '-', review && (review.updatedAt || review.submittedAt || p.updatedAt || p.createdAt))

        return {
          id: p.proposalCode || p._id || '-',
          proposalId,
          title: p.projectTitleTh || p.projectTitleEn || '(ไม่มีชื่อโครงการ)',
          researcherName: p.projectLeaderName || leader.name || '-',
          faculty: resolveAffiliation(p, snapshot),
          submissionDate: p.submittedAt || p.createdAt,
          status: currentStatus,
          committeeProgress,
          committeeProgressDisplay,
          reviewStatus: review && review.reviewStatus ? review.reviewStatus : null,
          reviewDecision: review && review.decision ? review.decision : null,
          decisionTone,
          decisionDisplay,
          reviewUpdatedAt: review && (review.updatedAt || review.submittedAt) ? (review.updatedAt || review.submittedAt) : null,
          reviewer: reviewerName,
          lastUpdatedAt: latestTs,
          budget: p.budgetTotal || 0,
          attachments: files.map(f => ({
            name: f.name,
            mime: f.mime || 'application/octet-stream',
            content: f.content || ''
          })),
          statusDisplay: committeeProgressDisplay
        }
      })
    },
    assignedProposals () {
      const role = this.currentUser && this.currentUser.role
      if (role !== 'committee' || !this.currentUserId) {
        return this.mappedProposals
      }

      return this.mappedProposals.filter(p => {
        const src = (this.proposalsRaw || []).find(r => String(r._id || r.proposalCode) === String(p.proposalId || p.id))
        const ids = Array.isArray(src && src.committeeIds) ? src.committeeIds.map(x => String(x)) : []
        return ids.includes(this.currentUserId)
      })
    },
    summaryTiles () {
      const bucketStatus = (item) => {
        if (item.committeeProgress === 'review_submitted') return 'Reviewed'
        if (item.status === 'revision_requested') return 'Revision Requested'
        return 'Pending Review'
      }
      const base = this.assignedProposals.map(p => ({
        ...p,
        lastUpdatedAt: p.lastUpdatedAt,
        bucketStatus: bucketStatus(p)
      }))
      const countBy = status => base.filter(p => p.bucketStatus === status).length
      return [
        { key: 'ALL', label: 'ทั้งหมด', icon: 'cil-list', filter: 'all', count: base.length },
        { key: 'PENDING', label: 'รอการประเมิน', icon: 'cil-clock', filter: 'Pending Review', count: countBy('Pending Review') },
        { key: 'REVISION', label: 'ขอแก้ไขเพิ่มเติม', icon: 'cil-loop', filter: 'Revision Requested', count: countBy('Revision Requested') },
        { key: 'REVIEWED', label: 'ประเมินแล้ว', icon: 'cil-check-circle', filter: 'Reviewed', count: countBy('Reviewed') }
      ]
    },
    tableItems () {
      const items = this.assignedProposals.map(p => ({
        ...p,
        lastUpdatedAt: p.lastUpdatedAt,
        statusDisplay: p.committeeProgressDisplay || this.statusLabel(p.status),
        bucketStatus: (p.committeeProgress === 'review_submitted')
          ? 'Reviewed'
          : (p.status === 'revision_requested')
          ? 'Revision Requested'
          : 'Pending Review'
      }))
      if (this.filterStatus === 'all') return items
      return items.filter(p => p.bucketStatus === this.filterStatus)
    },
    displayItems () {
      const q = String(this.searchQuery || '').trim().toLowerCase()
      if (!q) return this.tableItems
      return this.tableItems.filter(item => {
        const haystack = [
          item.id,
          item.proposalId,
          item.title,
          item.researcherName,
          item.faculty,
          item.statusDisplay,
          item.decisionDisplay,
          item.reviewer
        ].filter(Boolean).join(' ').toLowerCase()
        return haystack.includes(q)
      })
    },
    pageCount () {
      const total = this.displayItems.length
      const per = Number(this.perPage) || 1
      return Math.max(1, Math.ceil(total / Math.max(1, per)))
    }
  },
  watch: {
    perPage () {
      this.activePage = 1
    },
    displayItems () {
      if (this.activePage > this.pageCount) this.activePage = 1
    }
  },
  methods: {
    decisionLabel (decision, isReviewed) {
      if (!isReviewed) return 'ยังไม่ส่งผล'
      const key = String(decision || '').toLowerCase()
      if (key === 'approve') return 'อนุมัติ'
      if (key === 'revise') return 'ขอแก้ไข'
      if (key === 'reject') return 'ไม่อนุมัติ'
      return 'ไม่ระบุ'
    },
    timeAgo (value) {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return String(value)

      const diffMs = Date.now() - date.getTime()
      const isFuture = diffMs < 0
      const absMs = Math.abs(diffMs)

      const sec = Math.floor(absMs / 1000)
      if (sec < 45) return isFuture ? 'อีกไม่นาน' : 'เมื่อสักครู่'

      const min = Math.floor(sec / 60)
      if (min < 60) return isFuture ? `อีก ${min} นาที` : `${min} นาทีที่แล้ว`

      const hr = Math.floor(min / 60)
      if (hr < 24) return isFuture ? `อีก ${hr} ชั่วโมง` : `${hr} ชั่วโมงที่แล้ว`

      const day = Math.floor(hr / 24)
      if (day < 30) return isFuture ? `อีก ${day} วัน` : `${day} วันที่แล้ว`

      const month = Math.floor(day / 30)
      if (month < 12) return isFuture ? `อีก ${month} เดือน` : `${month} เดือนที่แล้ว`

      const year = Math.floor(month / 12)
      return isFuture ? `อีก ${year} ปี` : `${year} ปีที่แล้ว`
    },
    loadLatestNotifsCache () {
      try {
        const raw = localStorage.getItem('committee_latest_notifs_cache')
        if (!raw) return
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) {
          this.latestNotifs = parsed.slice(0, 3)
        }
      } catch (e) {
        // ignore cache parsing error
      }
    },
    saveLatestNotifsCache (items) {
      try {
        if (!Array.isArray(items) || !items.length) return
        localStorage.setItem('committee_latest_notifs_cache', JSON.stringify(items.slice(0, 3)))
      } catch (e) {
        // ignore localStorage error
      }
    },
    getMockLatestNotifs () {
      const now = Date.now()
      return [
        { id: 'mock-1', title: 'มีโครงการส่งเข้าประเมิน', time: this.timeAgo(new Date(now - 2 * 60 * 1000).toISOString()), timestamp: new Date(now - 2 * 60 * 1000).toISOString() },
        { id: 'mock-2', title: 'มีคำขอแก้ไขเอกสาร', time: this.timeAgo(new Date(now - 25 * 60 * 1000).toISOString()), timestamp: new Date(now - 25 * 60 * 1000).toISOString() },
        { id: 'mock-3', title: 'กำหนดการประชุมถูกอัปเดต', time: this.timeAgo(new Date(now - 2 * 60 * 60 * 1000).toISOString()), timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString() }
      ]
    },
    async fetchSidePanels () {
      await Promise.allSettled([
        this.fetchNextMeetings(),
        this.fetchLatestNotifications()
      ])
    },
    formatThaiDate (dateStr) {
      if (!dateStr) return '-'
      const d = new Date(dateStr)
      if (Number.isNaN(d.getTime())) return '-'
      return d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
    },
    formatThaiDateTime (dateStr) {
      if (!dateStr) return '-'
      const d = new Date(dateStr)
      if (Number.isNaN(d.getTime())) return '-'
      const date = new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
      const time = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
      return `${date} ${time} น.`
    },
    async fetchNextMeetings () {
      try {
        const res = await Service.meeting.list({ page: 1, limit: 5, upcoming: 1 })
        const payload = res && res.data && res.data.data ? res.data.data : {}
        const rows = payload.items || payload.meetings || payload.data || []

        this.nextMeetings = (rows || []).map((m) => {
          const location = (m && m.location) ? String(m.location) : ''
          const videoLink = (m && m.videoLink) ? String(m.videoLink) : ''
          const type = videoLink ? 'online' : 'onsite'
          return {
            id: m && (m._id || m.id) ? String(m._id || m.id) : '',
            title: (m && m.title) || '-',
            date: this.formatThaiDate(m && m.meetingDate),
            time: `${(m && m.startTime) || '-'}${(m && m.endTime) ? ` - ${m.endTime}` : ''}`,
            type,
            typeLabel: type === 'online' ? 'ออนไลน์' : 'ออนไซต์',
            location,
            videoLink
          }
        })
      } catch (e) {
        this.nextMeetings = []
      }
    },
    async fetchLatestNotifications () {
      try {
        const res = await Service.notification.list({ page: 1, limit: 20 })
        const payload = res && res.data && res.data.data ? res.data.data : {}
        const rows = Array.isArray(payload.notifications)
          ? payload.notifications
          : (Array.isArray(payload.items) ? payload.items : (Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : [])))

        const sorted = (rows || [])
          .slice()
          .sort((a, b) => {
            const at = new Date((a && (a.createdAt || a.sentAt || a.updatedAt)) || 0).getTime()
            const bt = new Date((b && (b.createdAt || b.sentAt || b.updatedAt)) || 0).getTime()
            return bt - at
          })
          .slice(0, 3)

        const mapped = sorted.map((n) => {
          const ts = n && (n.createdAt || n.sentAt || n.updatedAt) ? (n.createdAt || n.sentAt || n.updatedAt) : null
          return {
          id: n && n._id ? String(n._id) : '',
          title: n && n.title ? n.title : '-',
          time: this.timeAgo(ts),
          timestamp: ts
          }
        })

        if (mapped.length) {
          this.latestNotifs = mapped
          this.saveLatestNotifsCache(mapped)
          return
        }

        if (!this.latestNotifs || this.latestNotifs.length === 0) {
          const fallback = this.getMockLatestNotifs()
          this.latestNotifs = fallback
          this.saveLatestNotifsCache(fallback)
        }
      } catch (e) {
        if (this.latestNotifs && this.latestNotifs.length) return
        try {
          const raw = localStorage.getItem('committee_latest_notifs_cache')
          const parsed = raw ? JSON.parse(raw) : null
          if (Array.isArray(parsed) && parsed.length) {
            this.latestNotifs = parsed.slice(0, 3)
            return
          }
        } catch (_) { void _ }
        const fallback = this.getMockLatestNotifs()
        this.latestNotifs = fallback
        this.saveLatestNotifsCache(fallback)
      }
    },
    async fetchAssignedProposals () {
      this.loading = true
      this.fetchError = null
      this.myReviewsRaw = []
      try {
        const proposalRes = await Service.proposal.list({ page: 1, limit: 200 })

        const proposalPayload = proposalRes && proposalRes.data ? proposalRes.data : null
        let proposals = []
        if (Array.isArray(proposalPayload)) proposals = proposalPayload
        else if (proposalPayload && proposalPayload.data && Array.isArray(proposalPayload.data.items)) proposals = proposalPayload.data.items
        else if (proposalPayload && proposalPayload.data && Array.isArray(proposalPayload.data.data)) proposals = proposalPayload.data.data
        else if (proposalPayload && proposalPayload.data && Array.isArray(proposalPayload.data)) proposals = proposalPayload.data

        this.proposalsRaw = proposals

        // Optional enrichment via existing endpoint: /api/v1/proposals/:id/reviews/me
        const assignedIds = (proposals || [])
          .filter(p => {
            if (!(this.currentUser && this.currentUser.role === 'committee' && this.currentUserId)) return true
            const ids = Array.isArray(p && p.committeeIds) ? p.committeeIds.map(x => String(x)) : []
            return ids.includes(this.currentUserId)
          })
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
              return
            }

            const err = result.reason
            const status = err && err.response ? err.response.status : null
            if (status !== 404) {
              console.warn('Optional review enrichment failed:', err)
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
    setFilter (status) {
      this.filterStatus = status
      this.activePage = 1
    },
    getLatestUpdatedAt (id, fallback) {
      const times = []
      if (fallback) times.push(fallback)
      try {
        const draftRaw = localStorage.getItem(`reviewDraft:${id}`)
        if (draftRaw) {
          const draft = JSON.parse(draftRaw)
          if (draft && typeof draft === 'object' && draft.savedAt) times.push(draft.savedAt)
        }
      } catch (e) { void e }
      try {
        const subRaw = localStorage.getItem(`reviewSubmission:${id}`)
        if (subRaw) {
          const sub = JSON.parse(subRaw)
          if (sub && typeof sub === 'object' && sub.submittedAt) times.push(sub.submittedAt)
        }
      } catch (e) { void e }

      let newest = ''
      times.forEach(t => {
        const d = new Date(t)
        if (Number.isNaN(d.getTime())) return
        if (!newest) newest = t
        else if (d.getTime() > new Date(newest).getTime()) newest = t
      })
      return newest || fallback || ''
    },
    statusLabelClass (status) {
      switch (status) {
        case 'review_submitted': return 'status-label--success'
        case 'waiting_for_review': return 'status-label--warning'
        case 'submitted': return 'status-label--warning'
        case 'under_review': return 'status-label--warning'
        case 'revision_requested': return 'status-label--info'
        case 'approved': return 'status-label--success'
        case 'announced': return 'status-label--success'
        case 'rejected': return 'status-label--secondary'
        default: return 'status-label--secondary'
      }
    },
    statusLabel (status) {
      switch (status) {
        case 'draft': return 'ร่าง'
        case 'submitted': return 'ยื่นแล้ว'
        case 'faculty_review_pending': return 'รอการพิจารณาคณะ'
        case 'faculty_approved': return 'คณะอนุมัติ'
        case 'office_received': return 'สำนักงานรับแล้ว'
        case 'document_checking': return 'ตรวจสอบเอกสาร'
        case 'assigned_to_committee': return 'มอบหมายกรรมการแล้ว'
        case 'under_review': return 'กำลังพิจารณา'
        case 'meeting_completed': return 'ประชุมเสร็จแล้ว'
        case 'revision_requested': return 'ขอแก้ไขเพิ่มเติม'
        case 'resubmitted': return 'ส่งใหม่แล้ว'
        case 'second_round_review': return 'พิจารณารอบ 2'
        case 'approved': return 'อนุมัติ'
        case 'rejected': return 'ไม่ผ่าน'
        case 'announced': return 'ประกาศผลแล้ว'
        default: return status
      }
    },
    statusColor (status) {
      switch (status) {
        case 'Pending Review': return 'warning'
        case 'Reviewed': return 'success'
        case 'Revision Requested': return 'info'
        default: return 'secondary'
      }
    },
    formatLatest (value) {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return String(value)
      const diffMs = Date.now() - date.getTime()

      if (diffMs < 0) {
        const sec = Math.max(0, Math.floor((-diffMs) / 1000))
        const min = Math.floor(sec / 60)
        const hr = Math.floor(min / 60)
        const day = Math.floor(hr / 24)
        if (sec < 45) return 'อีกสักครู่'
        if (min < 60) return `อีก ${min} นาที`
        if (hr < 24) return `อีก ${hr} ชั่วโมง`
        return `อีก ${day} วัน`
      }

      const sec = Math.floor(diffMs / 1000)
      if (sec < 45) return 'เมื่อสักครู่'
      const min = Math.floor(sec / 60)
      if (min < 60) return `${min} นาทีที่แล้ว`
      const hr = Math.floor(min / 60)
      if (hr < 24) return `${hr} ชั่วโมงที่แล้ว`
      const day = Math.floor(hr / 24)
      if (day < 30) return `${day} วันที่แล้ว`
      const month = Math.floor(day / 30)
      if (month < 12) return `${month} เดือนที่แล้ว`
      const year = Math.floor(month / 12)
      return `${year} ปีที่แล้ว`
    },
    view (item) {
      this.$router.push({ name: 'committeeProposalDetail', params: { id: item.proposalId || item.id } })
    },
    goToMeetings () {
      this.$router.push('/committee/meetings')
    },
    goToNotifications () {
      this.$router.push('/committee/notifications')
    }
  }
}
</script>

<style scoped>
.committee-dashboard-page {
  --committee-red: #8c1515;
  --committee-red-soft: rgba(140, 21, 21, 0.12);
  --committee-gold: #fec260;
  --committee-gold-soft: rgba(254, 194, 96, 0.22);
  --kpi-accent-soft: var(--committee-gold-soft);
  max-width: 1240px;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
}

.summary-strip {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.strip-card {
  flex: 1;
  min-width: 170px;
  border-radius: 0.5rem;
  border: 0;
  box-shadow: none;
  padding: 14px 16px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  position: relative;
  overflow: hidden;
  isolation: isolate;
  cursor: pointer;
  transform: scale(1);
  transition: box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
  user-select: none;
  background: linear-gradient(135deg, var(--summary-start, #8c1515), var(--summary-end, #6b0f0f));
}

.strip-card::before {
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
  z-index: 1;
}

.strip-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 60%);
  pointer-events: none;
  z-index: 1;
}

.strip-card.strip-ALL {
  --summary-start: #8c1515;
  --summary-end: #6b0f0f;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect x='24' y='22' width='72' height='76' rx='12' fill='white' fill-opacity='0.9'/%3E%3Crect x='38' y='40' width='44' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3Crect x='38' y='54' width='40' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3Crect x='38' y='68' width='33' height='6' rx='3' fill='%23000000' fill-opacity='0.16'/%3E%3C/svg%3E");
}

.strip-card.strip-PENDING {
  --summary-start: #f59e0b;
  --summary-end: #d97706;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M60 42v18l14 10' stroke='%23000000' stroke-width='7' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.22' fill='none'/%3E%3C/svg%3E");
}

.strip-card.strip-REVISION {
  --summary-start: #ef4444;
  --summary-end: #dc2626;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect x='24' y='20' width='72' height='80' rx='12' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M72 34l12 12M61 45l23-23 12 12-23 23H61z' fill='%23000000' fill-opacity='0.2'/%3E%3Cpath d='M40 82h40' stroke='%23000000' stroke-width='6' stroke-linecap='round' stroke-opacity='0.18'/%3E%3C/svg%3E");
}

.strip-card.strip-REVIEWED {
  --summary-start: #16a34a;
  --summary-end: #15803d;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M46 61l9 9 20-20' stroke='%23000000' stroke-width='8' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.24' fill='none'/%3E%3Ccircle cx='60' cy='60' r='44' stroke='white' stroke-opacity='0.42' stroke-width='5' fill='none'/%3E%3C/svg%3E");
}

.strip-card > * {
  position: relative;
  z-index: 2;
}

.strip-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.2);
}

.strip-card.strip-active {
  transform: scale(1.02);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.24);
}

.committee-dashboard-row {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0,1fr));
  margin-bottom: 16px;
}
.committee-block {
  border-radius: 16px;
  background: #fff;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 5px rgba(0,0,0,0.04);
  position: relative;
  overflow: hidden;
}
.committee-block-meetings,
.committee-block-notifs {
  background: #fff;
  border-color: #e2e8f0;
}
.block-head {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin: -14px -16px 12px;
  padding: 12px 16px 10px;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
}
.block-head-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
.block-icon {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex: 0 0 auto;
  border: 1px solid rgba(15,23,42,0.06);
}
.block-icon--meetings { background: #ecfdf5; color: #047857; }
.block-icon--notifs { background: var(--committee-gold-soft); color: var(--committee-red); }
.block-title { font-weight: 900; font-size: 1.02rem; margin-bottom: 2px; color: #0f172a; letter-spacing: 0.2px; }
.block-sub { font-size: 0.8rem; color: #4b5563; }
.block-action { white-space: nowrap; }
.block-empty {
  padding: 14px 12px;
  color: #64748b;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
}
.block-list { display: grid; gap: 0; }
.block-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid #e5e7eb;
}
.block-item:first-child { border-top: none; padding-top: 0; }
.item-bullet {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-top: 6px;
  flex: 0 0 auto;
}
.item-body { min-width: 0; }
.item-title { font-weight: 700; color: #0f172a; font-size: 0.92rem; }
.item-meta { font-size: 0.82rem; color: #475569; margin-top: 3px; }
.block-item:hover .item-title { text-decoration: underline; }
.committee-block-meetings { border-left: 4px solid #10b981; }
.committee-block-notifs { border-left: 4px solid var(--committee-red); }
.committee-block-meetings .item-bullet { background: #10b981; }
.committee-block-notifs .item-bullet { background: var(--committee-gold); }

.committee-block-meetings .block-head {
  background:
    radial-gradient(circle at 18% 20%, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0) 46%),
    linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(16, 185, 129, 0.08) 38%, rgba(255, 255, 255, 0.96) 100%);
  border-bottom-color: rgba(16, 185, 129, 0.18);
}

.committee-block-notifs .block-head {
  background:
    radial-gradient(circle at 18% 20%, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0) 46%),
    linear-gradient(135deg, rgba(254, 194, 96, 0.22) 0%, rgba(140, 21, 21, 0.06) 42%, rgba(255, 255, 255, 0.96) 100%);
  border-bottom-color: rgba(254, 194, 96, 0.28);
}

@media (max-width: 900px) {
  .committee-dashboard-row { grid-template-columns: 1fr; }
}

.strip-icon {
  font-size: 1.9rem;
  display: inline-block;
  line-height: 1;
}

.strip-count {
  font-size: 2.2rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.98);
  line-height: 1;
  display: inline-block;
  text-align: right;
}

.strip-label {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
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
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.32);
  box-shadow: 0 4px 12px rgba(16, 24, 40, 0.12);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.strip-icon-wrap .strip-icon svg {
  width: 26px;
  height: 26px;
}

.strip-card:hover .strip-icon-wrap {
  transform: translateY(-3px);
  box-shadow: 0 10px 26px rgba(16, 24, 40, 0.18);
}

.strip-icon-wrap {
  color: rgba(255, 255, 255, 0.98);
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

.header-tools {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.collapse-toggle {
  padding: 0.25rem 0.5rem;
  border-radius: 10px;
  color: #6b7280;
}

.collapse-toggle:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #374151;
}

.collapse-toggle /deep/ svg,
.collapse-toggle >>> svg,
.collapse-toggle::v-deep svg {
  width: 18px;
  height: 18px;
}

.header-tools /deep/ .form-group,
.header-tools >>> .form-group,
.header-tools::v-deep .form-group {
  margin: 0 !important;
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

.search-input {
  min-width: 220px;
}

.search-input /deep/ input,
.search-input >>> input,
.search-input::v-deep input {
  height: 34px;
  border-radius: 8px;
  border-color: rgba(0, 0, 0, 0.14);
}

.no-table-divider /deep/ .table,
.no-table-divider >>> .table,
.no-table-divider::v-deep .table {
  border-top: 0 !important;
}

.no-table-divider /deep/ .table thead th,
.no-table-divider >>> .table thead th,
.no-table-divider::v-deep .table thead th {
  border-top: 0 !important;
}

.no-table-divider /deep/ .table thead tr,
.no-table-divider >>> .table thead tr,
.no-table-divider::v-deep .table thead tr {
  border-top: 0 !important;
}

.no-table-divider /deep/ .table thead,
.no-table-divider >>> .table thead,
.no-table-divider::v-deep .table thead {
  border-top: 0 !important;
}

.no-table-divider /deep/ .table-responsive,
.no-table-divider >>> .table-responsive,
.no-table-divider::v-deep .table-responsive {
  border-top: 0 !important;
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

.no-table-divider /deep/ .table thead th,
.no-table-divider >>> .table thead th,
.no-table-divider::v-deep .table thead th {
  background: linear-gradient(90deg, var(--committee-red, #8c1515), rgba(107, 15, 15, 0.98));
  color: #ffffff;
  font-weight: 800;
  text-align: center;
  border-bottom: 0 !important;
  border-top: 0 !important;
  border-right: 1px solid rgba(254, 194, 96, 0.5);
}

.no-table-divider /deep/ .table thead th:last-child,
.no-table-divider >>> .table thead th:last-child,
.no-table-divider::v-deep .table thead th:last-child {
  border-right: 0;
}

.table-surface /deep/ .table,
.table-surface >>> .table,
.table-surface::v-deep .table {
  margin-bottom: 0;
}

.table-surface /deep/ .table tbody td,
.table-surface >>> .table tbody td,
.table-surface::v-deep .table tbody td {
  border-bottom: 1px solid rgba(140, 21, 21, 0.12);
  border-right: 1px solid rgba(140, 21, 21, 0.12);
  text-align: center;
}

.table-surface /deep/ .table tbody td:last-child,
.table-surface >>> .table tbody td:last-child,
.table-surface::v-deep .table tbody td:last-child {
  border-right: 0;
}

.no-table-divider /deep/ .table td,
.no-table-divider >>> .table td,
.no-table-divider::v-deep .table td {
  vertical-align: middle;
}

.no-table-divider /deep/ .table tbody tr:hover,
.no-table-divider >>> .table tbody tr:hover,
.no-table-divider::v-deep .table tbody tr:hover {
  background: var(--committee-gold-soft, rgba(254, 194, 96, 0.22));
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
  opacity: 0.45 !important; /* show arrow even before sorting */
  visibility: visible !important;
}

.table-surface /deep/ .arrow-position.rotate-icon,
.table-surface >>> .arrow-position.rotate-icon,
.table-surface::v-deep .arrow-position.rotate-icon {
  opacity: 0.95 !important;
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

.status-block {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: none;
  line-height: 1.35;
  font-size: 0.875rem;
}

.status-line {
  text-decoration: none;
  white-space: nowrap;
}

.status-line--status {
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  display: inline-block;
  margin-right: 5px;
  margin-top: 3px;
  flex: 0 0 auto;
}

.committee-dashboard-page /deep/ .btn-outline-primary,
.committee-dashboard-page >>> .btn-outline-primary,
.committee-dashboard-page::v-deep .btn-outline-primary {
  border-color: var(--committee-red, #8c1515);
  color: var(--committee-red, #8c1515);
  background: transparent;
  font-weight: 700;
}

.committee-dashboard-page /deep/ .btn-outline-primary:hover,
.committee-dashboard-page >>> .btn-outline-primary:hover,
.committee-dashboard-page::v-deep .btn-outline-primary:hover {
  border-color: var(--committee-gold, #fec260);
  background: var(--committee-gold, #fec260);
  color: #6b0f0f;
}

.status-text {
  color: #212529;
  font-weight: 400;
}

.status-dot.status-label--warning { background: #e67e22; }

.status-dot.status-label--success { background: #2ecc71; }

.status-dot.status-label--info { background: #3498db; }

.status-dot.status-label--secondary { background: #6c757d; }

.status-value,
.time-value {
  color: #212529;
}

.reviewer-label {
  color: #6c757d;
  margin-right: 6px;
}

.reviewer-value {
  color: #212529;
}

.time-label {
  color: #6c757d;
  margin-right: 6px;
}
</style>
