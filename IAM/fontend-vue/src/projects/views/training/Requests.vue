<template>
  <div class="training-page">
    <AppSectionHero
      title="Training Requests"
      subtitle="Create and manage training workflow from draft to completion."
      :stats="heroStats"
      :meta-label="'Last updated'"
      :meta-value="lastUpdatedLabel"
      @refresh="loadData"
    />

    <CCard class="training-create-card bg-style2 mb-4">
      <CCardBody>
        <h5 class="mb-3 d-flex align-items-center">
          <CIcon name="cil-plus" class="mr-2" />
          Create Request
        </h5>
        <CRow>
          <CCol md="4" sm="12">
            <CSelect
              v-model="draft.courseId"
              :options="courseOptions"
              label="Course"
              placeholder="Select course"
            />
          </CCol>
          <CCol md="4" sm="12">
            <CInput
              v-model="draft.approverId"
              label="Approver ID"
              placeholder="Mongo ID of approver"
            />
          </CCol>
          <CCol md="4" sm="12">
            <CInput
              v-model="draft.title"
              label="Title"
              placeholder="Training request title"
            />
          </CCol>
        </CRow>
        <CRow>
          <CCol md="4" sm="12">
            <CInput
              v-model="draft.trainingStart"
              label="Start Date"
              type="date"
            />
          </CCol>
          <CCol md="4" sm="12">
            <CInput
              v-model="draft.trainingEnd"
              label="End Date"
              type="date"
            />
          </CCol>
          <CCol md="4" sm="12">
            <CInput
              v-model="draft.reason"
              label="Reason"
              placeholder="Reason for attending"
            />
          </CCol>
        </CRow>
        <div class="d-flex justify-content-end">
          <CButton color="success" variant="outline" @click="createRequest">
            <CIcon name="cil-save" class="mr-2" />
            Create Request
          </CButton>
        </div>
      </CCardBody>
    </CCard>

    <CCard class="bg-style2 mb-4">
      <CCardBody>
        <h5 class="mb-3 d-flex align-items-center">
          <CIcon name="cil-list" class="mr-2" />
          Request Queue
        </h5>
        <CDataTable
          hover
          striped
          table-filter
          sorter
          pagination
          :items="requests"
          :fields="requestFields"
          :items-per-page="10"
        >
          <template #statusLabel="{ item }">
            <td>
              <CBadge :color="statusColor(item.statusKey)">{{ item.statusLabel }}</CBadge>
            </td>
          </template>
          <template #actions="{ item }">
            <td class="text-center">
              <CButton size="sm" color="dark" variant="outline" class="mr-1" @click="viewActions(item)">
                <CIcon name="cil-notes" />
              </CButton>
              <CButton v-if="canSubmit(item)" size="sm" color="info" variant="outline" class="mr-1" @click="submitRequest(item)">
                <CIcon name="cil-share-boxed" />
              </CButton>
              <CButton v-if="canApprove(item)" size="sm" color="success" variant="outline" class="mr-1" @click="approveRequest(item)">
                <CIcon name="cil-check-circle" />
              </CButton>
              <CButton v-if="canApprove(item)" size="sm" color="danger" variant="outline" class="mr-1" @click="rejectRequest(item)">
                <CIcon name="cil-x-circle" />
              </CButton>
              <CButton v-if="canComplete(item)" size="sm" color="warning" variant="outline" @click="completeRequest(item)">
                <CIcon name="cil-flag-alt" />
              </CButton>
            </td>
          </template>
        </CDataTable>
      </CCardBody>
    </CCard>

    <CCard class="bg-style2">
      <CCardBody>
        <h5 class="mb-3 d-flex align-items-center">
          <CIcon name="cil-history" class="mr-2" />
          Action Timeline
          <small class="ml-2 text-muted">{{ selectedRequestId ? `Request: ${selectedRequestId}` : '' }}</small>
        </h5>
        <CDataTable
          hover
          striped
          :items="actions"
          :fields="actionFields"
          :items-per-page="8"
          pagination
        />
      </CCardBody>
    </CCard>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import AppSectionHero from '@/projects/components/layout/AppSectionHero'
import { notifyError, notifyInfo, notifySuccess, notifyWarning } from '@/projects/utils/notify'

function createDraft() {
  return {
    courseId: '',
    approverId: '',
    title: '',
    reason: '',
    trainingStart: '',
    trainingEnd: ''
  }
}

export default {
  name: 'TrainingRequests',
  components: { AppSectionHero },
  data() {
    return {
      draft: createDraft(),
      requestFields: [
        { key: 'requestNo', label: 'Request No.' },
        { key: 'titleText', label: 'Title' },
        { key: 'courseLabel', label: 'Course' },
        { key: 'requesterLabel', label: 'Requester' },
        { key: 'periodLabel', label: 'Period' },
        { key: 'statusLabel', label: 'Status' },
        { key: 'updatedAtLabel', label: 'Updated At' },
        { key: 'actions', label: '#', _style: 'width: 240px; text-align:center;' }
      ],
      actionFields: [
        { key: 'action', label: 'Action' },
        { key: 'actorLabel', label: 'Actor' },
        { key: 'note', label: 'Note' },
        { key: 'createdAtLabel', label: 'Date Time' }
      ]
    }
  },
  computed: {
    ...mapGetters({
      requests: 'training/requests',
      actions: 'training/actions',
      courses: 'training/courses',
      summary: 'training/summary',
      selectedRequestId: 'training/selectedRequestId',
      lastUpdatedLabel: 'training/lastUpdatedLabel'
    }),
    courseOptions() {
      const options = [{ value: '', label: 'Select course' }]
      this.courses.forEach(item => {
        options.push({
          value: item._id,
          label: `${item.titleText}${item.code ? ` (${item.code})` : ''}`
        })
      })
      return options
    },
    heroStats() {
      return [
        { label: 'Total Requests', value: this.summary.total, hint: 'All requests in current scope', icon: 'cil-list-rich', iconClass: 'app-section-stat__icon--total' },
        { label: 'Submitted', value: this.summary.submitted, hint: 'Waiting for decision', icon: 'cil-share-boxed', iconClass: 'app-section-stat__icon--attention' },
        { label: 'Completed', value: this.summary.completed, hint: 'Workflow finished', icon: 'cil-check-circle', iconClass: 'app-section-stat__icon--active' }
      ]
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    statusColor(statusKey) {
      const key = String(statusKey || '').toLowerCase()
      if (key.includes('complete')) return 'success'
      if (key.includes('approve')) return 'info'
      if (key.includes('reject')) return 'danger'
      if (key.includes('submit') || key.includes('pending')) return 'warning'
      return 'secondary'
    },
    canSubmit(item) {
      const key = String(item && item.statusKey ? item.statusKey : '').toLowerCase()
      return !key || key.includes('draft') || key.includes('create')
    },
    canApprove(item) {
      const key = String(item && item.statusKey ? item.statusKey : '').toLowerCase()
      return key.includes('submit') || key.includes('pending')
    },
    canComplete(item) {
      const key = String(item && item.statusKey ? item.statusKey : '').toLowerCase()
      return key.includes('approve')
    },
    async loadData() {
      try {
        await this.$store.dispatch('training/explorer')
      } catch (error) {
        notifyError(this.$store, 'Failed to load training requests.')
      }
    },
    async createRequest() {
      if (!this.draft.courseId || !this.draft.title || !this.draft.trainingStart || !this.draft.trainingEnd) {
        notifyWarning(this.$store, 'Please fill course, title, and date range before creating request.')
        return
      }
      try {
        await this.$store.dispatch('training/createRequest', this.draft)
        this.draft = createDraft()
        notifySuccess(this.$store, 'Training request created.')
      } catch (error) {
        notifyError(this.$store, 'Cannot create training request.')
      }
    },
    async viewActions(item) {
      if (!(item && item._id)) return
      try {
        await this.$store.dispatch('training/fetchActions', item._id)
      } catch (error) {
        notifyError(this.$store, 'Cannot load request actions.')
      }
    },
    async submitRequest(item) {
      if (!(item && item._id)) return
      try {
        await this.$store.dispatch('training/submitRequest', { _id: item._id })
        notifyInfo(this.$store, 'Request submitted.')
      } catch (error) {
        notifyError(this.$store, 'Cannot submit request.')
      }
    },
    async approveRequest(item) {
      if (!(item && item._id)) return
      try {
        await this.$store.dispatch('training/approveRequest', { _id: item._id })
        notifySuccess(this.$store, 'Request approved.')
      } catch (error) {
        notifyError(this.$store, 'Cannot approve request.')
      }
    },
    rejectRequest(item) {
      if (!(item && item._id)) return
      return this.$store.dispatch('dialog/openConfirm', {
        title: 'Reject Request',
        message: 'Are you sure you want to reject this request?',
        confirmText: 'Reject',
        cancelText: 'Cancel',
        confirmIcon: 'cil-x-circle'
      }).then(async (confirmed) => {
        if (!confirmed) return
        try {
          await this.$store.dispatch('training/rejectRequest', { _id: item._id })
          notifyInfo(this.$store, 'Request rejected.')
        } catch (error) {
          notifyError(this.$store, 'Cannot reject request.')
        }
      })
    },
    async completeRequest(item) {
      if (!(item && item._id)) return
      try {
        await this.$store.dispatch('training/completeRequest', { _id: item._id, score: 100 })
        notifySuccess(this.$store, 'Request marked as completed.')
      } catch (error) {
        notifyError(this.$store, 'Cannot complete request.')
      }
    }
  }
}
</script>

<style scoped lang="scss">
.training-create-card {
  border: 1px solid rgba(223, 230, 238, 0.78);
  border-radius: 1.3rem;
}
</style>
