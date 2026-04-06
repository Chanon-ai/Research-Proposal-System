<template>
  <AdminMeetings
    :read-only="true"
    read-only-cta-tone="dark"
    :my-only="true"
    hero-eyebrow="Office Chairman Meetings"
    hero-title="กำหนดการประชุมประธานสำนัก"
    hero-subtitle="แสดงเฉพาะการประชุมที่มีชื่อของคุณ"
  />
</template>

<script>
import AdminMeetings from '@/ResearchFormRS/admin/AdminMeetings.vue'

export default {
  name: 'OfficeChairmanMeetings',
  components: { AdminMeetings }
}
</script>
