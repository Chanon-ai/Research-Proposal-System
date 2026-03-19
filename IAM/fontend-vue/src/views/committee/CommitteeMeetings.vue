<template>
  <div class="committee-meetings-page">
    <div class="page-hero">
      <div class="hero-title">
        <span class="hero-icon" aria-hidden="true">
          <CIcon name="cil-calendar" />
        </span>
        <div>
          <h2>หน้าสรุปการประชุมคณะกรรมการ</h2>
          <div class="subtext">แสดงรายการการประชุมที่มีกำหนดการและรอดำเนินการประชุม</div>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">รายการที่รอดำเนินการประชุม</div>
        <div class="stat-value">{{ scheduledCount }}</div>
        <div class="stat-note">เฉพาะรายการที่มีสถานะ “กำหนดการแล้ว”</div>
      </div>
    </div>

    <div class="meeting-controls">
      <div class="ctrl-left">
        <span class="ctrl-label">ค้นหา:</span>
        <input class="search-box" type="text" v-model="searchQuery" placeholder="ระบุหัวข้อการประชุม" />
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <CSpinner color="primary" />
      <div class="mt-2 text-muted">กำลังดำเนินการโหลดข้อมูลการประชุม...</div>
    </div>

    <div v-else>
      <div v-if="filteredMeetings.length === 0" class="empty-state">
        <div class="empty-state__icon" aria-hidden="true">
          <CIcon name="cil-calendar" />
        </div>
        <div class="empty-state__title">ไม่พบรายการการประชุมที่รอดำเนินการ</div>
        <div class="empty-state__sub">โปรดตรวจสอบคำค้นหาที่ระบุ</div>
      </div>

      <div v-else class="meeting-list">
        <div
          v-for="(meeting, idx) in filteredMeetings"
          :key="meeting._id || idx"
          class="meeting-card"
          :class="getMeetingCardClass(meeting)"
        >
          <div class="meeting-card-head">
            <div>
              <div class="meeting-title">{{ meeting.title || '-' }}</div>
              <div class="meeting-sub">วันที่ {{ formatDate(meeting.meetingDate) }} เวลา {{ formatTime(meeting.startTime) }} - {{ formatTime(meeting.endTime) }}</div>
            </div>
            <CBadge :color="getStatusMeta(meeting.status).color">{{ getStatusMeta(meeting.status).label }}</CBadge>
          </div>

          <div class="meeting-meta">
            <span class="meta-item">
              <CIcon name="cil-location-pin" class="meta-ic" aria-hidden="true" />
              {{ meeting.location || '-' }}
            </span>
            <span class="meta-item">
              <CIcon name="cil-people" class="meta-ic" aria-hidden="true" />
              {{ Array.isArray(meeting.participantIds) ? meeting.participantIds.length : 0 }} คน
            </span>
            <span class="meta-item">
              <CIcon name="cil-file" class="meta-ic" aria-hidden="true" />
              {{ Array.isArray(meeting.proposalIds) ? meeting.proposalIds.length : 0 }} โครงการ
            </span>
          </div>

          <div class="meeting-footer">
            <div class="meeting-time">{{ formatDate(meeting.meetingDate) }} | {{ formatTime(meeting.startTime) }} - {{ formatTime(meeting.endTime) }}</div>
            <div>
              <CButton v-if="meeting.videoLink" size="sm" color="primary" :href="meeting.videoLink" target="_blank">
                ลิ้งก์การประชุม
              </CButton> 
              <CButton v-else size="sm" color="secondary" variant="outline" disabled>
                ยังไม่มีลิงก์การประชุม
              </CButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { instance as axios } from '@/service/api'
import { committeeMeetings } from './committeeData'

export default {
  name: 'CommitteeMeetings',
  data () {
    return {
      loading: false,
      meetings: [],
      searchQuery: ''
    }
  },
  created () {
    this.fetchMeetings()
  },
  computed: {
    scheduledCount () {
      return this.meetings.filter(m => m.status === 'scheduled').length
    },
    filteredMeetings () {
      return this.meetings.filter(m => {
        const statusMatch = m.status === 'scheduled'
        const searchMatch = this.searchQuery.trim() === '' || (m.title || '').toLowerCase().includes(this.searchQuery.trim().toLowerCase())
        return statusMatch && searchMatch
      })
    }
  },
  methods: {
    async fetchMeetings () {
      this.loading = true
      try {
        const params = { status: 'scheduled' }
        const response = await axios.get('/api/v1/meetings', { params })
        const payload = response && response.data && response.data.data ? response.data.data : null
        const raw = (payload && Array.isArray(payload.meetings))
          ? payload.meetings
          : (payload && Array.isArray(payload.items))
            ? payload.items
            : (response && response.data && response.data.items ? response.data.items : response.data)
        this.meetings = Array.isArray(raw) ? raw : []
      } catch (e) {
        void e
        this.meetings = committeeMeetings.filter(m => m.status === 'scheduled')
      } finally {
        this.loading = false
      }
    },
    getStatusMeta (status) {
      const map = {
        scheduled: { label: 'กำหนดการแล้ว', color: 'info' },
        completed: { label: 'เสร็จสิ้น', color: 'success' },
        cancelled: { label: 'ยกเลิก', color: 'danger' }
      }
      return map[status] || { label: status || '-', color: 'secondary' }
    },
    getMeetingCardClass (meeting) {
      if (!meeting) return ''
      if (meeting.status === 'completed') return 'meeting-card--completed'
      if (meeting.status === 'cancelled') return 'meeting-card--cancelled'
      if (meeting.status === 'scheduled') return 'meeting-card--scheduled'
      return ''
    },
    formatDate (dateStr) {
      if (!dateStr) return '-'
      const d = new Date(dateStr)
      if (Number.isNaN(d.getTime())) return '-'
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const yearBE = d.getFullYear() + 543
      return `${day}/${month}/${yearBE}`
    },
    formatTime (time) {
      return time || '-'
    }
  }
}
</script>

<style scoped>
.committee-meetings-page {
  max-width: 1240px;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
}

.page-hero {
  margin-bottom: 14px;
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
  background: #eef2ff;
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}
.stat-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  padding: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.stat-label { font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: .3px; }
.stat-value {
  font-size: 1.55rem;
  font-weight: 800;
  margin-top: 8px;
  color: #111827;
}
.stat-note { font-size: 0.82rem; color: #6b7280; margin-top: 4px; }

.meeting-controls {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 10px 12px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.ctrl-left { display: flex; align-items: center; gap: 8px; }
.ctrl-label { font-size: 0.86rem; color: #374151; font-weight: 700; }
.search-box { border: 1px solid #d1d5db; border-radius: 8px; padding: 6px 10px; min-width: 220px; }

.meeting-list { display: grid; gap: 10px; margin-top: 8px; }
.meeting-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  padding: 14px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.04);
  position: relative;
  overflow: hidden;
}
.meeting-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #e5e7eb;
}
.meeting-card--scheduled::before { background: #0ea5e9; }
.meeting-card--completed::before { background: #22c55e; }
.meeting-card--cancelled::before { background: #ef4444; }

.meeting-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
.meeting-title { font-size: 1.05rem; font-weight: 800; color: #111827; margin-bottom: 4px; }
.meeting-sub { font-size: 0.86rem; color: #4b5563; }
.meeting-meta { display: flex; flex-wrap: wrap; gap: 10px; font-size: 0.85rem; color: #4b5563; margin-bottom: 10px; }
.meta-item { display: inline-flex; align-items: center; gap: 6px; }
.meta-ic { color: #64748b; }
.meeting-footer { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.meeting-time { font-size: 0.85rem; color: #4b5563; }

.empty-state {
  text-align: center;
  color: #64748b;
  padding: 24px 16px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
}
.empty-state__icon {
  width: 44px;
  height: 44px;
  margin: 0 auto 8px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
}
.empty-state__title { font-weight: 800; color: #0f172a; }
.empty-state__sub { font-size: 0.9rem; margin-top: 4px; }

@media (max-width: 950px) {
  .stats-grid { grid-template-columns: 1fr; }
  .meeting-controls { justify-content: flex-start; }
}

@media (max-width: 680px) {
  .stats-grid { grid-template-columns: 1fr; }
  .meeting-card-head { flex-direction: column; align-items: flex-start; }
  .meeting-footer { flex-direction: column; align-items: flex-start; }
}
</style>
