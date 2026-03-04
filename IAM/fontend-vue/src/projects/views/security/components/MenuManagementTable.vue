<template>
  <SecurityManagementTableBase
    title="Menus"
    icon="cil-list"
    add-label="Add Menu"
    empty-message="No menus found"
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
  name: 'MenuManagementTable',
  components: { SecurityManagementTableBase },
  props: {
    items: { type: Array, default: () => [] },
    fields: { type: Array, default: () => [] }
  }
}
</script>
