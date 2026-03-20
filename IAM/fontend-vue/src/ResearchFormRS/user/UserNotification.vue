<template>
  <div class="user-notification-wrapper">
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
.user-notification-wrapper {
  width: 100%;
}

:deep([data-coreui-theme='dark']) .user-notification-wrapper,
:deep(.c-dark-theme) .user-notification-wrapper {
  background: transparent;
}
</style>
