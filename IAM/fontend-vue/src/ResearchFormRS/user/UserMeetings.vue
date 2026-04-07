<template>
  <AdminMeetings
    :read-only="true"
    read-only-cta-tone="dark"
    :my-only="true"
    :hero-eyebrow="$t('userMeetings.hero.eyebrow')"
    :hero-title="$t('userMeetings.hero.title')"
    :hero-subtitle="$t('userMeetings.hero.subtitle')"
  />
</template>

<script>
import AdminMeetings from '@/ResearchFormRS/admin/AdminMeetings.vue'

export default {
  name: 'UserMeetings',
  components: { AdminMeetings }
}
</script>

