<template>
  <div class="budget-test">
    <h3>🧪 Budget Test Component</h3>
    <p>ModelValue: {{ JSON.stringify(modelValue) }}</p>
    <p>Categories length: {{ categories.length }}</p>
    <div v-for="(cat, index) in categories" :key="index" class="mb-3 p-3 border">
      <h4>{{ cat.title }}</h4>
      <p>Options: {{ cat.options ? cat.options.length : 0 }}</p>
      <p>Rows: {{ cat.rows ? cat.rows.length : 0 }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "BudgetTest",
  props: {
    modelValue: {
      type: Object,
      default: () => ({ categories: [], grandTotal: 0 })
    }
  },
  emits: ['update:modelValue'],
  computed: {
    categories() {
      return this.modelValue?.categories || []
    }
  },
  mounted() {
    console.log('BudgetTest mounted with:', this.modelValue);
  }
}
</script>

<style scoped>
.budget-test {
  background: #f0f8ff;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
}
</style>
