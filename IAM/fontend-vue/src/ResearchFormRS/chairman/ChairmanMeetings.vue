<template>
  <AdminMeetings
    :read-only="true"
    read-only-cta-tone="dark"
    :my-only="true"
    :hero-eyebrow="$t('chairman.meetings.hero.eyebrow')"
    :hero-title="$t('chairman.meetings.hero.title')"
    :hero-subtitle="$t('chairman.meetings.hero.subtitle')"
  />
</template>

<script>
import AdminMeetings from '@/ResearchFormRS/admin/AdminMeetings.vue'

export default {
  name: 'ChairmanMeetings',
  components: { AdminMeetings }
}
</script>
