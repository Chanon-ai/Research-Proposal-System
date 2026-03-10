<template>
  <div class="training-page">
    <AppSectionHero
      title="Training Records"
      subtitle="Track completed requests and training outcomes."
      :stats="heroStats"
      :meta-label="'Last updated'"
      :meta-value="lastUpdatedLabel"
      @refresh="loadData"
    />

    <CCard class="bg-style2">
      <CCardBody>
        <h5 class="mb-3 d-flex align-items-center">
          <CIcon name="cil-description" class="mr-2" />
          Completion Records
        </h5>
        <CDataTable
          hover
          striped
          table-filter
          sorter
          pagination
          :items="records"
          :fields="fields"
          :items-per-page="10"
        >
          <template #status="{ item }">
            <td>
              <CBadge :color="item.status === 'completed' ? 'success' : 'secondary'">
                {{ item.status }}
              </CBadge>
            </td>
          </template>
        </CDataTable>
      </CCardBody>
    </CCard>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import AppSectionHero from '@/projects/components/layout/AppSectionHero'
import { notifyError } from '@/projects/utils/notify'

export default {
  name: 'TrainingRecords',
  components: { AppSectionHero },
  data() {
    return {
      fields: [
        { key: 'requestTitle', label: 'Request Title' },
        { key: 'courseLabel', label: 'Course' },
        { key: 'status', label: 'Status' },
        { key: 'score', label: 'Score' },
        { key: 'resultNote', label: 'Result Note' },
        { key: 'createdAtLabel', label: 'Created At' }
      ]
    }
  },
  computed: {
    ...mapGetters({
      records: 'training/records',
      lastUpdatedLabel: 'training/lastUpdatedLabel'
    }),
    completedCount() {
      return this.records.filter(item => String(item && item.status || '').toLowerCase() === 'completed').length
    },
    averageScore() {
      const scores = this.records
        .map(item => (item && item.score != null ? Number(item.score) : null))
        .filter(item => Number.isFinite(item))
      if (!scores.length) return '-'
      const total = scores.reduce((sum, current) => sum + current, 0)
      return (total / scores.length).toFixed(1)
    },
    heroStats() {
      return [
        { label: 'Total Records', value: this.records.length, hint: 'All training records in current scope', icon: 'cil-file', iconClass: 'app-section-stat__icon--total' },
        { label: 'Completed', value: this.completedCount, hint: 'Requests completed successfully', icon: 'cil-check-circle', iconClass: 'app-section-stat__icon--active' },
        { label: 'Average Score', value: this.averageScore, hint: 'Mean score from completed records', icon: 'cil-chart-line', iconClass: 'app-section-stat__icon--attention' }
      ]
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    async loadData() {
      try {
        await this.$store.dispatch('training/explorer')
      } catch (error) {
        notifyError(this.$store, 'Failed to load training records.')
      }
    }
  }
}
</script>

