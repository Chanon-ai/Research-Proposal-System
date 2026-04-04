<template>
  <div class="admin-proposal-detail-page">
    <div class="d-flex justify-content-between align-items-center flex-wrap mb-3" style="gap: 10px;">
      <div class="d-flex align-items-center" style="gap: 10px;">
        <CButton color="secondary" variant="outline" @click="$router.back()"><CIcon name="cil-chevron-right" class="mr-1" /> ← กลับ</CButton>
        <h3 class="mb-0">รายละเอียดโครงการ</h3>
      </div>

      <CButton
        v-if="proposal && nextStatuses.length"
        color="warning"
        @click="openStatusModal"
      >
        <CIcon name="cil-chevron-right" class="mr-1" /> เปลี่ยนสถานะ
      </CButton>
    </div>

    <div v-if="loading" class="text-center py-5">
      <CSpinner color="primary" />
    </div>

    <CCard v-else-if="error" class="mb-3">
      <CCardBody class="text-center py-4">
        <div class="text-danger mb-3">ไม่สามารถโหลดข้อมูลได้</div>
        <div class="text-muted mb-3">{{ error }}</div>
        <CButton color="primary" @click="fetchProposal"><CIcon name="cil-chevron-right" class="mr-1" /> ลองใหม่</CButton>
      </CCardBody>
    </CCard>

    <CCard v-else-if="!proposal" class="mb-3">
      <CCardBody class="text-center py-4">ไม่พบโครงการนี้</CCardBody>
    </CCard>

    <div v-else>
      <CCard class="mb-3">
        <CCardHeader><strong>ข้อมูลพื้นฐาน</strong></CCardHeader>
        <CCardBody>
          <CRow>
            <CCol md="6" class="mb-2"><strong>รหัสโครงการ:</strong> {{ proposal.proposalCode || '-' }}</CCol>
            <CCol md="6" class="mb-2">
              <strong>สถานะ:</strong>
              <CBadge :color="getBadgeColor(proposal.currentStatus)" class="ml-1">
                {{ getStatusLabel(proposal.currentStatus, proposal) }}
              </CBadge>
            </CCol>
            <CCol md="6" class="mb-2"><strong>ปีงบประมาณ:</strong> {{ proposal.fiscalYear || '-' }}</CCol>
            <CCol md="6" class="mb-2"><strong>รอบ:</strong> {{ proposal.currentRound || '-' }}</CCol>
            <CCol md="6" class="mb-2"><strong>ประเภททุน:</strong> {{ proposal.fundingType || '-' }}</CCol>
            <CCol md="6" class="mb-2"><strong>ประเภทงานวิจัย:</strong> {{ proposal.researchType || '-' }}</CCol>
            <CCol md="6" class="mb-2"><strong>งบประมาณรวม:</strong> {{ formatCurrency(proposal.budgetTotal) }}</CCol>
            <CCol md="6" class="mb-2"><strong>วันที่ยื่น:</strong> {{ formatDate(proposal.submittedAt) }}</CCol>
            <CCol md="6" class="mb-2"><strong>วันที่อัปเดต:</strong> {{ formatDate(proposal.updatedAt) }}</CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <CCard class="mb-3">
        <CCardHeader><strong>ชื่อโครงการ</strong></CCardHeader>
        <CCardBody>
          <div class="mb-2"><strong>ชื่อภาษาไทย:</strong> {{ proposal.projectTitleTh || '-' }}</div>
          <div class="mb-2"><strong>ชื่อภาษาอังกฤษ:</strong> {{ proposal.projectTitleEn || '-' }}</div>
          <div><strong>คำสำคัญ:</strong> {{ keywordText }}</div>
        </CCardBody>
      </CCard>

      <CCard class="mb-3">
        <CCardHeader><strong>ทีมวิจัย</strong></CCardHeader>
        <CCardBody>
          <h6>หัวหน้าโครงการ</h6>
          <CRow class="mb-3">
            <CCol md="6" class="mb-1"><strong>ชื่อ-สกุล:</strong> {{ teamLeader.name || proposal.projectLeaderName || '-' }}</CCol>
            <CCol md="6" class="mb-1"><strong>สังกัด:</strong> {{ teamLeader.affiliation || '-' }}</CCol>
            <CCol md="6" class="mb-1"><strong>อีเมล:</strong> {{ teamLeader.email || '-' }}</CCol>
            <CCol md="6" class="mb-1"><strong>โทร:</strong> {{ teamLeader.phone || '-' }}</CCol>
            <CCol md="6" class="mb-1"><strong>สัดส่วน:</strong> {{ teamLeader.proportion || '-' }}%</CCol>
          </CRow>

          <h6>ผู้ร่วมวิจัย</h6>
          <div v-if="coResearchers.length">
            <CCard v-for="(person, idx) in coResearchers" :key="`co-${idx}`" class="mb-2">
              <CCardBody>
                <div><strong>ชื่อ:</strong> {{ person.name || '-' }}</div>
                <div><strong>สังกัด:</strong> {{ person.affiliation || '-' }}</div>
                <div><strong>อีเมล:</strong> {{ person.email || '-' }}</div>
                <div><strong>สัดส่วน:</strong> {{ person.proportion || '-' }}%</div>
              </CCardBody>
            </CCard>
          </div>
          <div v-else class="text-muted mb-3">ไม่มีข้อมูลผู้ร่วมวิจัย</div>

          <h6>ที่ปรึกษา</h6>
          <div v-if="advisors.length">
            <CCard v-for="(person, idx) in advisors" :key="`advisor-${idx}`" class="mb-2">
              <CCardBody>
                <div><strong>ชื่อ:</strong> {{ person.name || '-' }}</div>
                <div><strong>สังกัด:</strong> {{ person.affiliation || '-' }}</div>
                <div><strong>อีเมล:</strong> {{ person.email || '-' }}</div>
              </CCardBody>
            </CCard>
          </div>
          <div v-else class="text-muted">ไม่มีข้อมูลที่ปรึกษา</div>
        </CCardBody>
      </CCard>

      <CCard class="mb-3">
        <CCardHeader><strong>รายละเอียดโครงการ</strong></CCardHeader>
        <CCardBody>
          <CTabs :active-tab="0" add-tab-classes="mt-2">
            <CTab title="ความสำคัญของปัญหา">
              <div class="content-html" v-html="snapshot.problemSignificance || '-'" />
            </CTab>
            <CTab title="วัตถุประสงค์">
              <div class="content-html" v-html="snapshot.objectives || '-'" />
            </CTab>
            <CTab title="ทบทวนวรรณกรรม">
              <div class="content-html" v-html="snapshot.literatureReview || '-'" />
            </CTab>
            <CTab title="วิธีดำเนินการวิจัย">
              <div class="content-html" v-html="snapshot.researchMethodology || '-'" />
            </CTab>
            <CTab title="ขอบเขต">
              <div class="content-html" v-html="snapshot.researchScope || '-'" />
            </CTab>
          </CTabs>
        </CCardBody>
      </CCard>

      <CCard class="mb-3">
        <CCardHeader><strong>งบประมาณ</strong></CCardHeader>
        <CCardBody>
          <div class="table-responsive">
            <table class="table table-bordered table-sm">
              <thead>
                <tr>
                  <th>หมวด</th>
                  <th>รายการ</th>
                  <th class="text-right">งวด 1</th>
                  <th class="text-right">งวด 2</th>
                  <th class="text-right">งวด 3</th>
                  <th class="text-right">รวม</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in budgetRows" :key="`budget-${idx}`">
                  <td>{{ row.category }}</td>
                  <td>{{ row.item }}</td>
                  <td class="text-right">{{ formatCurrency(row.period1) }}</td>
                  <td class="text-right">{{ formatCurrency(row.period2) }}</td>
                  <td class="text-right">{{ formatCurrency(row.period3) }}</td>
                  <td class="text-right">{{ formatCurrency(row.total) }}</td>
                </tr>
                <tr v-if="!budgetRows.length">
                  <td colspan="6" class="text-center text-muted">ไม่มีข้อมูลงบประมาณ</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th colspan="5" class="text-right">รวมทั้งหมด</th>
                  <th class="text-right">{{ formatCurrency(grandTotal) }}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        </CCardBody>
      </CCard>

      <CCard class="mb-3">
        <CCardHeader><strong>มาตรฐานการวิจัย</strong></CCardHeader>
        <CCardBody>
          <CRow>
            <CCol md="6" class="mb-2"><strong>ประเภทหลัก:</strong> {{ researchStandard.mainType || '-' }}</CCol>
            <CCol md="6" class="mb-2"><strong>การวิจัยในมนุษย์:</strong> {{ boolText(researchStandard.isHuman) }} {{ researchStandard.humanSubType || '' }}</CCol>
            <CCol md="6" class="mb-2"><strong>การใช้สัตว์ทดลอง:</strong> {{ boolText(researchStandard.isAnimal) }} {{ researchStandard.animalSubType || '' }}</CCol>
            <CCol md="6" class="mb-2"><strong>การเก็บพันธุ์พืช:</strong> {{ boolText(researchStandard.isPlant) }} {{ researchStandard.plantSubType || '' }}</CCol>
          </CRow>
          <div class="mt-3 pt-3 border-top">
            <ResearchStandardSection
              :value="researchStandard"
              :is-read-only="true"
              @open-attachment="openResearchStandardAttachment"
            />
          </div>
        </CCardBody>
      </CCard>

      <CCard class="mb-3">
        <CCardHeader><strong>เอกสารแนบ</strong></CCardHeader>
        <CCardBody>
          <div v-if="filesLoading" class="text-center py-3">
            <CSpinner size="sm" color="primary" />
            <span class="text-muted ml-2">กำลังโหลดรายการไฟล์...</span>
          </div>
          <CAlert v-else-if="filesError && !files.length" color="warning" show>
            ไม่สามารถโหลดรายการไฟล์ได้: {{ filesError }}
          </CAlert>
          <div v-else-if="files.length" class="table-responsive">
            <table class="table table-bordered table-sm mb-0">
              <thead>
                <tr>
                  <th>ชื่อไฟล์</th>
                  <th>ประเภท</th>
                  <th>วันที่</th>
                  <th>หมายเหตุ</th>
                  <th class="text-center">ดาวน์โหลด</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(file, idx) in files" :key="`file-${idx}`">
                  <td>{{ file.name || '-' }}</td>
                  <td>{{ file.type || '-' }}</td>
                  <td>{{ file.datetime || '-' }}</td>
                  <td>{{ file.note || '-' }}</td>
                  <td class="text-center">
                    <CButton
                      size="sm"
                      color="primary"
                      variant="outline"
                      :disabled="!file.fileId"
                      @click="downloadProposalFile(file)"
                    >
                      <CIcon name="cil-chevron-right" class="mr-1" /> ดาวน์โหลด
                    </CButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-muted">ไม่มีเอกสารแนบ</div>
        </CCardBody>
      </CCard>

      <CCard ref="committeeReviewsSection" class="mb-3">
        <CCardHeader><strong>ผลการประเมินจากคณะกรรมการ</strong></CCardHeader>
        <CCardBody>
          <div v-if="reviewsLoading" class="text-center py-3">
            <CSpinner size="sm" color="primary" />
            <span class="text-muted ml-2">กำลังโหลดผลการประเมิน...</span>
          </div>

          <CAlert v-else-if="reviewsError" color="warning" show>
            ไม่สามารถโหลดผลการประเมินได้: {{ reviewsError }}
          </CAlert>

          <div v-else-if="!groupedReviews.length" class="text-muted">
            ยังไม่มีผลการประเมินจากกรรมการ
          </div>

          <div v-else>
            <div v-for="group in groupedReviews" :key="`round-${group.roundNo}`" class="mb-3">
              <h6 class="mb-2">รอบที่ {{ group.roundNo }}</h6>
              <CCard v-for="review in group.reviews" :key="review._id" class="mb-2">
                <CCardBody>
                  <CRow>
                    <CCol md="6" class="mb-1">
                      <strong>ผู้ประเมิน:</strong> {{ reviewerName(review) }}
                    </CCol>
                    <CCol md="6" class="mb-1">
                      <strong>สถานะรีวิว:</strong>
                      <CBadge :color="reviewStatusColor(review.reviewStatus)" class="ml-1">
                        {{ reviewStatusLabel(review.reviewStatus) }}
                      </CBadge>
                    </CCol>
                    <CCol md="6" class="mb-1">
                      <strong>ผลการพิจารณา:</strong>
                      <CBadge :color="decisionColor(review.decision)" class="ml-1">
                        {{ decisionLabel(review.decision) }}
                      </CBadge>
                    </CCol>
                    <CCol md="6" class="mb-1">
                      <strong>คะแนนรวม:</strong> {{ review.totalScore !== null && review.totalScore !== undefined ? review.totalScore : '-' }}
                    </CCol>
                    <CCol md="6" class="mb-1">
                      <strong>ส่งเมื่อ:</strong> {{ formatDateTime(review.submittedAt || review.updatedAt) }}
                    </CCol>
                    <CCol md="12" class="mb-1">
                      <strong>สรุปข้อเสนอแนะ:</strong>
                      <div class="mt-1">{{ review.summaryComment || '-' }}</div>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>
            </div>
          </div>
        </CCardBody>
      </CCard>
    </div>

    <CModal
      :show.sync="showStatusModal"
      centered
      :close-on-backdrop="false"
      title="เปลี่ยนสถานะ"
    >
      <template #body-wrapper>
        <div v-if="proposal">
          <div class="mb-2"><strong>สถานะปัจจุบัน:</strong> {{ getStatusLabel(proposal.currentStatus, proposal) }}</div>

          <CSelect
            label="สถานะถัดไป"
            :value="newStatus"
            :options="statusOptions"
            @change="onStatusChange"
          />

          <label class="mt-2">หมายเหตุ</label>
          <textarea
            v-model="statusRemark"
            class="form-control"
            rows="3"
            placeholder="ระบุหมายเหตุเพิ่มเติม"
          />
        </div>
      </template>

      <template #footer-wrapper>
        <div class="d-flex justify-content-end w-100">
          <CButton color="secondary" class="mr-2" @click="closeStatusModal"><CIcon name="cil-chevron-right" class="mr-1" /> ยกเลิก</CButton>
          <CButton color="primary" :disabled="!newStatus || changingStatus" @click="confirmChangeStatus">
            <CIcon name="cil-chevron-right" class="mr-1" /> {{ changingStatus ? 'กำลังบันทึก...' : 'ยืนยัน' }}
          </CButton>
        </div>
      </template>
    </CModal>
  </div>
</template>

<script>
import Service from '@/service/api'
import Swal from 'sweetalert2'
import ResearchStandardSection from '@/ResearchFormRS/component/ResearchStandardSection.vue'
import {
  PROPOSAL_ALLOWED_TRANSITIONS as ALLOWED_TRANSITIONS,
  PROPOSAL_STATUS_COLORS_COREUI_ADMIN as STATUS_COLORS,
  PROPOSAL_STATUS_LABELS_TH_ADMIN as STATUS_LABELS,
  getProposalStatusLabel
} from '@/ResearchFormRS/constants/proposalWorkflow'

const RESEARCH_STANDARD_ATTACHMENT_KEYS = [
  'plantApproved',
  'plantPending',
  'humanApproved',
  'humanPending',
  'animalApproved',
  'animalPending'
]

export default {
  name: 'AdminProposalDetail',
  components: {
    ResearchStandardSection
  },
  data () {
    return {
      proposal: null,
      loading: true,
      error: null,
      reviews: [],
      reviewsLoading: false,
      reviewsError: null,
      proposalFiles: [],
      filesLoading: false,
      filesError: null,

      showStatusModal: false,
      newStatus: '',
      statusRemark: '',
      changingStatus: false
    }
  },
  computed: {
    snapshot () {
      return (this.proposal && this.proposal.formSnapshotJson) || {}
    },
    teamData () {
      return this.snapshot.researchTeam || {}
    },
    budget () {
      return this.snapshot.budget || {}
    },
    files () {
      const snapshotFiles = Array.isArray(this.snapshot.files) ? this.snapshot.files : []
      const liveFiles = Array.isArray(this.proposalFiles) ? this.proposalFiles : []
      const merged = [...snapshotFiles, ...liveFiles]
      const seen = new Set()

      return merged.filter((file) => {
        const key = String(file && (file.fileId || file._id || `${file.name || ''}-${file.datetime || ''}`))
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    },
    researchStandard () {
      const base = this.snapshot.researchStandard || {}
      const baseAttachments = (base && base.attachments) || {}
      const files = this.files || []
      const attachments = { ...baseAttachments }

      RESEARCH_STANDARD_ATTACHMENT_KEYS.forEach((key) => {
        const existing = attachments[key]
        if (existing && existing.fileId) return

        const matched = files.find((file) => (
          file &&
          file.fileId &&
          file.type === 'research_standard_attachment' &&
          file.note === key
        ))

        if (matched) {
          attachments[key] = matched
        }
      })

      return {
        ...base,
        attachments
      }
    },
    teamLeader () {
      return this.teamData.projectLeader || {}
    },
    coResearchers () {
      return Array.isArray(this.teamData.coResearchers) ? this.teamData.coResearchers : []
    },
    advisors () {
      return Array.isArray(this.teamData.advisors) ? this.teamData.advisors : []
    },
    keywordText () {
      if (!this.proposal || !Array.isArray(this.proposal.keywordList) || !this.proposal.keywordList.length) {
        return '-'
      }
      return this.proposal.keywordList.join(', ')
    },
    nextStatuses () {
      const currentStatus = this.proposal ? this.proposal.currentStatus : ''
      return this.getNextStatuses(currentStatus)
    },
    statusOptions () {
      if (!this.nextStatuses.length) {
        return [{ value: '', label: 'ไม่มีสถานะถัดไปที่อนุญาต' }]
      }
      return [{ value: '', label: 'เลือกสถานะ' }]
        .concat(this.nextStatuses.map(status => ({
          value: status,
          label: this.getStatusLabel(status, this.proposal, { nextRoundForSecondRoundReview: true })
        })))
    },
    budgetRows () {
      const rows = []
      const budget = this.budget

      if (Array.isArray(budget.categories)) {
        budget.categories.forEach(category => {
          const categoryName = category.name || category.category || '-'
          const list = Array.isArray(category.rows) ? category.rows : (Array.isArray(category.items) ? category.items : [])
          list.forEach(row => {
            rows.push(this.toBudgetRow(categoryName, row))
          })
        })
      } else {
        Object.keys(budget || {}).forEach(key => {
          if (key === 'grandTotal') return
          const value = budget[key]
          if (Array.isArray(value)) {
            value.forEach(row => rows.push(this.toBudgetRow(key, row)))
          } else if (value && typeof value === 'object') {
            const list = Array.isArray(value.rows) ? value.rows : (Array.isArray(value.items) ? value.items : [])
            list.forEach(row => rows.push(this.toBudgetRow(value.name || key, row)))
          }
        })
      }

      return rows
    },
    groupedReviews () {
      const groups = {}
      ;(this.reviews || []).forEach(r => {
        const key = r && r.roundNo ? r.roundNo : 1
        if (!groups[key]) groups[key] = []
        groups[key].push(r)
      })
      return Object.keys(groups)
        .map(k => ({ roundNo: Number(k), reviews: groups[k] }))
        .sort((a, b) => a.roundNo - b.roundNo)
    },
    grandTotal () {
      if (typeof this.budget.grandTotal === 'number') {
        return this.budget.grandTotal
      }
      return this.budgetRows.reduce((sum, row) => sum + this.toNumber(row.total), 0)
    }
  },
  mounted () {
    this.fetchProposal()
  },
  methods: {
    async fetchProposal () {
      this.loading = true
      this.error = null
      this.reviews = []
      this.reviewsError = null
      this.proposalFiles = []
      this.filesError = null
      try {
        const res = await Service.proposal.getById(this.$route.params.id)
        this.proposal = res && res.data ? res.data.data : null

        if (this.proposal && this.proposal._id) {
          await Promise.all([
            this.fetchReviews(this.proposal._id),
            this.fetchProposalFiles(this.proposal._id)
          ])
        }

        await this.scrollToReviewsIfRequested()
      } catch (err) {
        this.proposal = null
        this.error = (err && err.response && err.response.data && err.response.data.message)
          || err.message
          || 'Unknown error'
      } finally {
        this.loading = false
      }
    },
    async fetchProposalFiles (proposalId) {
      this.filesLoading = true
      this.filesError = null
      try {
        const res = await Service.proposal.listFormFiles(encodeURIComponent(proposalId))
        const payload = res && res.data ? res.data : null
        if (Array.isArray(payload)) this.proposalFiles = payload
        else if (payload && Array.isArray(payload.data)) this.proposalFiles = payload.data
        else this.proposalFiles = []
      } catch (err) {
        this.proposalFiles = []
        this.filesError = (err && err.response && err.response.data && err.response.data.message)
          || err.message
          || 'Unknown error'
      } finally {
        this.filesLoading = false
      }
    },
    async fetchReviews (proposalId) {
      this.reviewsLoading = true
      this.reviewsError = null
      try {
        const res = await Service.proposal.getReviewsByProposal(encodeURIComponent(proposalId))
        const payload = res && res.data ? res.data : null
        if (Array.isArray(payload)) this.reviews = payload
        else if (payload && Array.isArray(payload.data)) this.reviews = payload.data
        else this.reviews = []
      } catch (err) {
        this.reviews = []
        this.reviewsError = (err && err.response && err.response.data && err.response.data.message)
          || err.message
          || 'Unknown error'
      } finally {
        this.reviewsLoading = false
      }
    },
    async scrollToReviewsIfRequested () {
      const shouldScroll = this.$route && this.$route.query && this.$route.query.scrollReviews === '1'
      if (!shouldScroll) return
      if (!this.groupedReviews.length) return

      await this.$nextTick()
      const section = this.$refs.committeeReviewsSection
      if (section && typeof section.scrollIntoView === 'function') {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    },
    getNextStatuses (status) {
      return ALLOWED_TRANSITIONS[status] || []
    },
    getStatusLabel (status, roundSource = null, options = {}) {
      return getProposalStatusLabel(status, STATUS_LABELS, roundSource, options)
    },
    getBadgeColor (status) {
      return STATUS_COLORS[status] || 'secondary'
    },
    formatDate (dateStr) {
      if (!dateStr) return '-'
      const d = new Date(dateStr)
      if (Number.isNaN(d.getTime())) return '-'
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}/${month}/${year}`
    },
    formatDateTime (dateStr) {
      if (!dateStr) return '-'
      const d = new Date(dateStr)
      if (Number.isNaN(d.getTime())) return '-'
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      const hour = String(d.getHours()).padStart(2, '0')
      const minute = String(d.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} ${hour}:${minute}`
    },
    reviewerName (review) {
      const u = review && review.reviewerUserId ? review.reviewerUserId : null
      if (u && typeof u === 'object') return u.fullName || u.email || '-'
      return String(u || '-')
    },
    reviewStatusLabel (status) {
      if (status === 'submitted') return 'ส่งแล้ว'
      if (status === 'in_progress') return 'กำลังประเมิน'
      if (status === 'pending') return 'รอประเมิน'
      if (status === 'certified') return 'รับรองแล้ว'
      return status || '-'
    },
    reviewStatusColor (status) {
      if (status === 'submitted') return 'success'
      if (status === 'in_progress') return 'warning'
      if (status === 'pending') return 'secondary'
      if (status === 'certified') return 'primary'
      return 'secondary'
    },
    decisionLabel (decision) {
      if (decision === 'approve') return 'อนุมัติ'
      if (decision === 'revise') return 'ขอแก้ไข'
      if (decision === 'reject') return 'ไม่อนุมัติ'
      return 'ยังไม่ระบุ'
    },
    decisionColor (decision) {
      if (decision === 'approve') return 'success'
      if (decision === 'revise') return 'warning'
      if (decision === 'reject') return 'danger'
      return 'secondary'
    },
    formatCurrency (num) {
      const value = this.toNumber(num)
      return `${value.toLocaleString('th-TH')} บาท`
    },
    boolText (value) {
      return value ? 'ใช่' : 'ไม่ใช่'
    },
    toNumber (value) {
      if (typeof value === 'number') return value
      const num = Number(value)
      return Number.isFinite(num) ? num : 0
    },
    toBudgetRow (category, row) {
      const item = (row && (row.item || row.name || row.title)) || '-'
      const period1 = this.toNumber(row && (row.period1 || row.installment1 || row.phase1))
      const period2 = this.toNumber(row && (row.period2 || row.installment2 || row.phase2))
      const period3 = this.toNumber(row && (row.period3 || row.installment3 || row.phase3))
      const total = this.toNumber(row && row.total) || (period1 + period2 + period3)

      return {
        category,
        item,
        period1,
        period2,
        period3,
        total
      }
    },
    extractDownloadFileName (headers, fallbackName) {
      const disposition = headers && (headers['content-disposition'] || headers['Content-Disposition'])
      if (!disposition) return fallbackName || 'attachment'

      const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
      if (utf8Match && utf8Match[1]) {
        try {
          return decodeURIComponent(utf8Match[1])
        } catch (_) {
          return utf8Match[1]
        }
      }

      const plainMatch = disposition.match(/filename="?([^"]+)"?/i)
      return (plainMatch && plainMatch[1]) || fallbackName || 'attachment'
    },
    async openResearchStandardAttachment (payload) {
      const slotKey = payload && payload.slotKey ? payload.slotKey : ''
      const file = payload && payload.file ? payload.file : null
      const fallback = slotKey
        ? (this.files || []).find((item) => (
          item &&
          item.fileId &&
          item.type === 'research_standard_attachment' &&
          item.note === slotKey
        ))
        : null
      const targetFile = (file && file.fileId) ? file : fallback
      if (!targetFile) {
        await Swal.fire({
          icon: 'warning',
          title: 'ไม่พบไฟล์เอกสารประกอบ',
          text: 'ระบบไม่พบข้อมูลไฟล์สำหรับรายการนี้ กรุณาตรวจสอบว่ามีการอัปโหลดเอกสารไว้แล้ว'
        })
        return
      }
      await this.downloadProposalFile(targetFile)
    },
    async downloadProposalFile (file) {
      if (!this.proposal || !this.proposal._id || !file || !file.fileId) return

      try {
        const res = await Service.proposal.downloadFormFile(this.proposal._id, file.fileId)
        const blob = res && res.data ? res.data : null
        const headers = res && res.headers ? res.headers : {}
        const contentType = headers['content-type'] || headers['Content-Type'] || (blob && blob.type) || ''

        if (!blob || (typeof blob.size === 'number' && blob.size === 0)) {
          throw new Error('Empty file')
        }

        if (String(contentType).toLowerCase().includes('application/json')) {
          const text = await blob.text()
          const payload = JSON.parse(text)
          throw new Error((payload && (payload.message || payload.error)) || 'ไม่สามารถดาวน์โหลดไฟล์ได้')
        }

        const filename = this.extractDownloadFileName(headers, file.name || file.originalName || 'attachment')
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
      } catch (err) {
        await Swal.fire({
          icon: 'error',
          title: 'ดาวน์โหลดไฟล์ไม่สำเร็จ',
          text: (err && err.message)
            || (err && err.response && err.response.data && err.response.data.message)
            || 'ไม่สามารถดาวน์โหลดไฟล์แนบของโครงการนี้ได้'
        })
      }
    },
    openStatusModal () {
      this.newStatus = ''
      this.statusRemark = ''
      this.showStatusModal = true
    },
    closeStatusModal () {
      this.showStatusModal = false
      this.newStatus = ''
      this.statusRemark = ''
    },
    onStatusChange (val) {
      this.newStatus = val && val.target ? val.target.value : val
    },
    async confirmChangeStatus () {
      if (!this.proposal || !this.newStatus) return

      this.changingStatus = true
      try {
        await Service.proposal.changeStatus(this.proposal._id, {
          toStatus: this.newStatus,
          remark: this.statusRemark || ''
        })

        this.closeStatusModal()
        await this.fetchProposal()
        await Swal.fire({
          icon: 'success',
          title: 'เปลี่ยนสถานะสำเร็จ',
          timer: 1500,
          showConfirmButton: false
        })
      } catch (err) {
        await Swal.fire({
          icon: 'error',
          title: 'เปลี่ยนสถานะไม่สำเร็จ',
          text: (err && err.response && err.response.data && err.response.data.message)
            || 'ไม่สามารถเปลี่ยนสถานะได้'
        })
      } finally {
        this.changingStatus = false
      }
    }
  }
}
</script>

<style scoped>
.content-html {
  min-height: 120px;
  line-height: 1.7;
  white-space: normal;
}

.admin-proposal-detail-page {
  width: 100%;
}
</style>
