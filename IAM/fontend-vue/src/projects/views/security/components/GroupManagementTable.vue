<template>
  <SecurityManagementTableBase
    title="Groups"
    icon="cil-people"
    add-label="Add Group"
    add-color="primary"
    empty-message="No groups found"
    pagination-align="center"
    :items="items"
    :fields="fields"
    @add="$emit('add')"
    @edit="$emit('edit', $event)"
    @remove="$emit('remove', $event)"
  />
</template>

<script>
import SecurityManagementTableBase from '@/projects/views/security/components/SecurityManagementTableBase'

export default {
  name: 'GroupManagementTable',
  components: { SecurityManagementTableBase },
  props: {
    items: { type: Array, default: () => [] },
    fields: { type: Array, default: () => [] }
  }
}
</script>
