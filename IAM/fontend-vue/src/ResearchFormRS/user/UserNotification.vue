<template>
  <!-- Simple wrapper that re-uses the notification component content -->
  <div>
    <!-- Content copied from original notification file -->
    <NotificationPage />
  </div>
</template>

<script>
import NotificationPage from './๊UserNotification.vue'

export default {
  name: 'UserNotificationWrapper',
  components: { NotificationPage }
}
</script>

<style scoped>
/* wrapper has no styles */
</style>
