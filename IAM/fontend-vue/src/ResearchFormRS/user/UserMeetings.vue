<template>
  <AdminMeetings
    :read-only="true"
    read-only-cta-tone="dark"
    :my-only="true"
    hero-eyebrow="Meetings"
    hero-title="กำหนดการประชุม"
    hero-subtitle="แสดงเฉพาะการประชุมที่มีชื่อของคุณ"
  />
</template>

<script>
import AdminMeetings from '@/ResearchFormRS/admin/AdminMeetings.vue'

export default {
  name: 'UserMeetings',
  components: { AdminMeetings }
}
</script>

