<template>
  <AdminMeetings
    :read-only="true"
    read-only-cta-tone="dark"
    :my-only="true"
    hero-eyebrow="Committee Meetings"
    hero-title="ตารางการประชุมคณะกรรมการ"
    hero-subtitle="แสดงเฉพาะการประชุมที่มีชื่อของคุณ"
  />
</template>

<script>
import AdminMeetings from '@/ResearchFormRS/admin/AdminMeetings.vue'

export default {
  name: 'CommitteeMeetings',
  components: { AdminMeetings }
}
</script>
