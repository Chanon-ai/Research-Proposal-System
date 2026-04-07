<template>
  <AdminMeetings
    :read-only="true"
    read-only-cta-tone="dark"
    :my-only="true"
    :hero-eyebrow="$t('committee.meetings.hero.eyebrow')"
    :hero-title="$t('committee.meetings.hero.title')"
    :hero-subtitle="$t('committee.meetings.hero.subtitle')"
  />
</template>

<script>
import AdminMeetings from '@/ResearchFormRS/admin/AdminMeetings.vue'

export default {
  name: 'CommitteeMeetings',
  components: { AdminMeetings }
}
</script>
