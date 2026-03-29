<template>
  <div class="admin-documents-page">
    <div class="mb-4">
      <h2 class="mb-0">จัดการเอกสาร (Admin)</h2>
    </div>

    <CRow class="mb-3">
      <CCol sm="6" lg="3" class="mb-3 mb-lg-0">
        <div class="summary-card border-primary">
          <small class="text-muted">เอกสารทั้งหมด</small>
          <div class="summary-number">{{ total }}</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3" class="mb-3 mb-lg-0">
        <div class="summary-card border-success">
          <small class="text-muted">อัปโหลดวันนี้</small>
          <div class="summary-number">{{ uploadedTodayCount }}</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3" class="mb-3 mb-sm-0">
        <div class="summary-card border-warning">
          <small class="text-muted">รอตรวจสอบ</small>
          <div class="summary-number">{{ pendingReviewCount }}</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3">
        <div class="summary-card border-info">
          <small class="text-muted">ประเภทแบบเสนอ (RS1)</small>
          <div class="summary-number">{{ proposalFormCount }}</div>
        </div>
      </CCol>
    </CRow>

    <CCard class="mb-3">
      <CCardBody>
        <CRow>
          <CCol md="5" class="mb-2 mb-md-0">
            <CInput
              v-model="searchKeyword"
              placeholder="ค้นหาชื่อไฟล์ หรือชื่อโครงการ..."
              @input="onSearch"
            />
          </CCol>
          <CCol md="3" class="mb-2 mb-md-0">
            <CSelect
              :value="filterType"
              :options="documentTypeFilterOptions"
              @change="onTypeChange"
            />
          </CCol>
          <CCol md="2" class="mb-2 mb-md-0">
            <CButton color="secondary" variant="outline" block @click="onReset"><CIcon name="cil-reload" class="mr-1" /> Reset</CButton>
          </CCol>
          <CCol md="2">
            <CButton color="primary" block @click="openUploadModal"><CIcon name="cil-plus" class="mr-1" /> + อัปโหลดเอกสาร</CButton>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <CCard>
      <CCardHeader>
        <div class="d-flex justify-content-between align-items-center flex-wrap" style="gap: 8px;">
          <strong>รายการเอกสาร</strong>
          <small class="text-muted">หน้าที่ {{ page }} / {{ totalPages }}</small>
        </div>
      </CCardHeader>
      <CCardBody>
        <div v-if="apiNotReady" class="alert alert-warning">
          ยังไม่มีข้อมูล (API ยังไม่พร้อม)
        </div>

        <div v-if="loading" class="text-center py-5">
          <CSpinner color="primary" />
          <div class="mt-2 text-muted">กำลังโหลดข้อมูลเอกสาร...</div>
        </div>

        <div v-else>
          <CDataTable
            :items="tableItems"
            :fields="tableFields"
            hover
            striped
            bordered
            small
            :items-per-page="limit"
            :no-items-view="{ noItems: 'ไม่พบเอกสาร', noResults: 'ไม่พบเอกสาร' }"
          >
            <template #index="{ item }">
              <td>{{ item.index }}</td>
            </template>

            <template #fileName="{ item }">
              <td>
                <span :class="getFileIcon(item.mimeType).className" class="mr-1">{{ getFileIcon(item.mimeType).emoji }}</span>
                <span>{{ item.fileName || '-' }}</span>
              </td>
            </template>

            <template #projectTitleTh="{ item }">
              <td>
                <div class="font-weight-bold">{{ item.projectTitleTh || '-' }}</div>
                <small class="text-muted" v-if="item.proposalCode">{{ item.proposalCode }}</small>
              </td>
            </template>

            <template #documentType="{ item }">
              <td>
                <CBadge :color="getDocTypeBadgeColor(item.documentType)">
                  {{ getDocTypeLabel(item.documentType) }}
                </CBadge>
              </td>
            </template>

            <template #version="{ item }">
              <td>v{{ item.version || 1 }}</td>
            </template>

            <template #fileSize="{ item }">
              <td>{{ formatFileSize(item.fileSize) }}</td>
            </template>

            <template #uploadedAt="{ item }">
              <td>{{ formatDate(item.uploadedAt) }}</td>
            </template>

            <template #actions="{ item }">
              <td class="text-nowrap">
                <CButton
                  size="sm"
                  color="primary"
                  class="mr-1"
                  :disabled="!item.filePath"
                  @click="downloadFile(item)"
                >
                  <CIcon name="cil-chevron-right" class="mr-1" /> ดาวน์โหลด
                </CButton>
                <CButton size="sm" color="info" class="mr-1" @click="openVersionModal(item)"><CIcon name="cil-chevron-right" class="mr-1" /> ประวัติ</CButton>
                <CButton size="sm" color="warning" class="mr-1" @click="openEditModal(item)"><CIcon name="cil-chevron-right" class="mr-1" /> แก้ไข</CButton>
                <CButton size="sm" color="danger" @click="deleteDocument(item)"><CIcon name="cil-chevron-right" class="mr-1" /> ลบ</CButton>
              </td>
            </template>
          </CDataTable>

          <div class="d-flex justify-content-between align-items-center mt-3 flex-wrap" style="gap: 8px;">
            <small class="text-muted">หน้าที่ {{ page }} / {{ totalPages }}</small>
            <div>
              <CButton
                size="sm"
                color="secondary"
                variant="outline"
                class="mr-2"
                :disabled="page <= 1 || loading"
                @click="onPageChange(page - 1)"
              >
                <CIcon name="cil-chevron-right" class="mr-1" /> ก่อนหน้า
              </CButton>
              <CButton
                size="sm"
                color="secondary"
                variant="outline"
                :disabled="page >= totalPages || loading"
                @click="onPageChange(page + 1)"
              >
                <CIcon name="cil-chevron-right" class="mr-1" /> ถัดไป
              </CButton>
            </div>
          </div>
        </div>
      </CCardBody>
    </CCard>

    <CModal
      class="documents-modal"
      :show.sync="showUploadModal"
      :close-on-backdrop="false"
      centered
      scrollable
      title="อัปโหลดเอกสาร"
    >
      <template #body-wrapper>
        <form class="doc-form">
          <div class="section">
            <div class="section-title">ข้อมูลเอกสาร</div>

            <div class="form-group">
              <label class="form-label">โครงการที่เกี่ยวข้อง <span class="required">*</span></label>
              <CSelect
                :value="uploadForm.proposalId"
                :options="proposalOptions"
                @change="onUploadProposalChange"
              />
            </div>

            <div class="form-group">
              <label class="form-label">ประเภทเอกสาร <span class="required">*</span></label>
              <CSelect
                :value="uploadForm.documentType"
                :options="documentTypeSelectOptions"
                @change="onUploadDocTypeChange"
              />
            </div>

            <input
              ref="fileInput"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              class="d-none"
              @change="onFileSelect"
            >

            <div
              class="upload-dropzone"
              :class="{ 'drag-over': dragOver }"
              @click="triggerFileSelect"
              @dragover.prevent="dragOver = true"
              @dragleave.prevent="dragOver = false"
              @drop.prevent="onDrop"
            >
              <div class="font-weight-bold">คลิกหรือลากไฟล์มาวางที่นี่</div>
              <small class="text-muted d-block">รองรับ: PDF, Word, JPG, PNG (ขนาดสูงสุด 10MB)</small>
              <div class="mt-2" v-if="uploadForm.file">
                <CBadge color="primary">เลือกไฟล์แล้ว: {{ uploadForm.file.name }}</CBadge>
              </div>
            </div>
          </div>

          <hr class="section-divider" />

          <div class="section">
            <div class="section-title">หมายเหตุ</div>
            <div class="form-group">
              <textarea
                v-model="uploadForm.note"
                class="form-control"
                rows="3"
                placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
              />
            </div>

            <div v-if="uploadLoading" class="mt-3">
              <small class="text-muted">กำลังอัปโหลด... {{ uploadProgress }}%</small>
              <CProgress class="mt-1" :value="uploadProgress" color="primary" />
            </div>
          </div>
        </form>
      </template>

      <template #footer-wrapper>
        <div class="d-flex justify-content-end w-100 modal-actions-wrapper">
          <CButton
            color="secondary"
            class="mr-2 floating-action"
            @click="closeUploadModal"
            :style="{ transform: 'translateY(-26px)', boxShadow: '0 18px 40px rgba(15,23,42,0.2)', position: 'relative', zIndex: 11000 }"
          ><CIcon name="cil-chevron-right" class="mr-1" /> ยกเลิก</CButton>
          <CButton
            color="primary floating-action"
            :disabled="uploadLoading"
            @click="uploadDocument"
            :style="{ transform: 'translateY(-26px)', boxShadow: '0 18px 40px rgba(15,23,42,0.2)', position: 'relative', zIndex: 11000 }"
          >
            <CIcon name="cil-paperclip" class="mr-1" /> {{ uploadLoading ? 'กำลังอัปโหลด...' : 'อัปโหลด' }}
          </CButton>
        </div>
      </template>
    </CModal>

    <CModal
      class="documents-modal"
      :show.sync="showEditModal"
      :close-on-backdrop="false"
      centered
      title="แก้ไขข้อมูลเอกสาร"
    >
      <template #body-wrapper>
        <div v-if="selectedDoc">
          <div class="mb-2"><strong>ชื่อไฟล์:</strong> {{ selectedDoc.fileName || '-' }}</div>
          <CSelect
            label="ประเภทเอกสาร"
            :value="editForm.documentType"
            :options="documentTypeSelectOptions"
            @change="onEditDocTypeChange"
          />
          <label class="mt-2">หมายเหตุ</label>
          <textarea
            v-model="editForm.note"
            class="form-control"
            rows="2"
            placeholder="ระบุหมายเหตุ"
          />
        </div>
      </template>

      <template #footer-wrapper>
        <div class="d-flex justify-content-end w-100 modal-actions-wrapper">
          <CButton
            color="secondary"
            class="mr-2 floating-action"
            @click="closeEditModal"
            :style="{ transform: 'translateY(-26px)', boxShadow: '0 18px 40px rgba(15,23,42,0.2)', position: 'relative', zIndex: 11000 }"
          ><CIcon name="cil-chevron-right" class="mr-1" /> ยกเลิก</CButton>
          <CButton
            color="primary floating-action"
            :disabled="editLoading"
            @click="saveEdit"
            :style="{ transform: 'translateY(-26px)', boxShadow: '0 18px 40px rgba(15,23,42,0.2)', position: 'relative', zIndex: 11000 }"
          >
            <CIcon name="cil-pencil" class="mr-1" /> {{ editLoading ? 'กำลังบันทึก...' : 'บันทึก' }}
          </CButton>
        </div>
      </template>
    </CModal>

    <CModal
      class="documents-modal"
      :show.sync="showVersionModal"
      :close-on-backdrop="false"
      centered
      size="xl"
      :title="`ประวัติเวอร์ชัน — ${versionDoc ? (versionDoc.fileName || '-') : '-'}`"
    >
      <template #body-wrapper>
        <div v-if="versionLoading" class="text-center py-4">
          <CSpinner color="primary" />
          <div class="mt-2 text-muted">กำลังโหลดประวัติเวอร์ชัน...</div>
        </div>

        <div v-else>
          <CDataTable
            :items="versions"
            :fields="versionFields"
            hover
            striped
            bordered
            small
            :no-items-view="{ noItems: 'ไม่พบประวัติเวอร์ชัน', noResults: 'ไม่พบประวัติเวอร์ชัน' }"
          >
            <template #version="{ item }">
              <td>v{{ item.version || 1 }}</td>
            </template>
            <template #fileSize="{ item }">
              <td>{{ formatFileSize(item.fileSize) }}</td>
            </template>
            <template #uploadedAt="{ item }">
              <td>{{ formatDate(item.uploadedAt) }}</td>
            </template>
            <template #download="{ item }">
              <td>
                <CButton
                  size="sm"
                  color="primary"
                  :disabled="!item.filePath"
                  @click="downloadFile(item)"
                >
                  <CIcon name="cil-chevron-right" class="mr-1" /> ดาวน์โหลด
                </CButton>
              </td>
            </template>
          </CDataTable>
        </div>
      </template>

      <template #footer-wrapper>
        <div class="d-flex justify-content-end w-100 modal-actions-wrapper">
          <CButton
            color="secondary"
            @click="closeVersionModal"
            :style="{ transform: 'translateY(-26px)', boxShadow: '0 18px 40px rgba(15,23,42,0.2)', position: 'relative', zIndex: 11000 }"
          ><CIcon name="cil-chevron-right" class="mr-1" /> ปิด</CButton>
        </div>
      </template>
    </CModal>
  </div>
</template>

<script>
import { instance as axios } from '@/service/api'
import Swal from 'sweetalert2'

const DOCUMENT_TYPES = {
  proposal_form: 'แบบเสนอโครงการ RS1',
  ethics_certificate: 'หนังสือรับรองจริยธรรมวิจัย',
  animal_certificate: 'หนังสือรับรองสัตว์ทดลอง',
  plant_permit: 'หนังสือแจ้งการเก็บพันธุ์พืช',
  budget_document: 'เอกสารงบประมาณ',
  revision_document: 'เอกสารแก้ไข',
  other: 'อื่นๆ'
}

const DOC_TYPE_BADGE = {
  proposal_form: 'primary',
  ethics_certificate: 'warning',
  animal_certificate: 'info',
  plant_permit: 'success',
  budget_document: 'secondary',
  revision_document: 'danger',
  other: 'secondary'
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
]

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']
const MAX_FILE_SIZE = 10 * 1024 * 1024

export default {
  name: 'AdminDocuments',
  data () {
    return {
      documents: [],
      proposals: [],
      total: 0,
      page: 1,
      totalPages: 1,
      limit: 10,
      loading: false,
      apiNotReady: false,

      searchKeyword: '',
      filterType: '',
      searchTimer: null,

      showUploadModal: false,
      uploadForm: {
        proposalId: '',
        documentType: '',
        note: '',
        file: null
      },
      uploadLoading: false,
      uploadProgress: 0,
      dragOver: false,

      showEditModal: false,
      editForm: { documentType: '', note: '' },
      selectedDoc: null,
      editLoading: false,

      showVersionModal: false,
      versionDoc: null,
      versions: [],
      versionLoading: false,

      tableFields: [
        { key: 'index', label: '#' },
        { key: 'fileName', label: 'ชื่อไฟล์' },
        { key: 'projectTitleTh', label: 'โครงการ' },
        { key: 'documentType', label: 'ประเภท' },
        { key: 'version', label: 'เวอร์ชัน' },
        { key: 'fileSize', label: 'ขนาด' },
        { key: 'uploadedBy', label: 'อัปโหลดโดย' },
        { key: 'uploadedAt', label: 'วันที่' },
        { key: 'actions', label: 'Actions', _classes: 'text-center text-nowrap' }
      ],
      versionFields: [
        { key: 'version', label: 'เวอร์ชัน' },
        { key: 'fileName', label: 'ชื่อไฟล์' },
        { key: 'fileSize', label: 'ขนาด' },
        { key: 'uploadedBy', label: 'อัปโหลดโดย' },
        { key: 'uploadedAt', label: 'วันที่' },
        { key: 'download', label: 'ดาวน์โหลด' }
      ]
    }
  },
  computed: {
    tableItems () {
      return this.documents.map((doc, idx) => ({
        ...doc,
        index: (this.page - 1) * this.limit + idx + 1
      }))
    },
    uploadedTodayCount () {
      const today = new Date()
      return this.documents.filter(doc => {
        if (!doc.uploadedAt) return false
        const d = new Date(doc.uploadedAt)
        if (Number.isNaN(d.getTime())) return false
        return d.toDateString() === today.toDateString()
      }).length
    },
    pendingReviewCount () {
      return this.documents.filter(doc => !doc.note || !String(doc.note).trim()).length
    },
    proposalFormCount () {
      return this.documents.filter(doc => doc.documentType === 'proposal_form').length
    },
    documentTypeFilterOptions () {
      return [
        { value: '', label: 'ทั้งหมด' },
        ...Object.keys(DOCUMENT_TYPES).map(key => ({ value: key, label: DOCUMENT_TYPES[key] }))
      ]
    },
    documentTypeSelectOptions () {
      return [{ value: '', label: 'เลือกประเภทเอกสาร' }, ...Object.keys(DOCUMENT_TYPES).map(key => ({ value: key, label: DOCUMENT_TYPES[key] }))]
    },
    proposalOptions () {
      const options = [{ value: '', label: 'เลือกโครงการ' }]
      this.proposals.forEach(p => {
        options.push({
          value: p._id,
          label: `${p.proposalCode || '-'} - ${p.projectTitleTh || '-'}`
        })
      })
      return options
    }
  },
  mounted () {
    this.fetchDocuments()
    this.fetchProposals()
  },
  beforeDestroy () {
    if (this.searchTimer) clearTimeout(this.searchTimer)
  },
  methods: {
    toAbsoluteUrl (url) {
      if (!url) return ''
      if (/^https?:\/\//i.test(url)) return url
      const base = (axios && axios.defaults && axios.defaults.baseURL) || process.env.VUE_APP_API_URL || ''
      return `${String(base).replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`
    },
    getSelectValue (val) {
      return val && val.target ? val.target.value : val
    },
    formatDate (value) {
      if (!value) return '-'
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return '-'
      return d.toLocaleString('th-TH')
    },
    getDocTypeLabel (type) {
      return DOCUMENT_TYPES[type] || 'ไม่ระบุ'
    },
    getDocTypeBadgeColor (type) {
      return DOC_TYPE_BADGE[type] || 'secondary'
    },
    formatFileSize (bytes) {
      const size = Number(bytes) || 0
      if (size < 1024) return `${size} B`
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
      return `${(size / (1024 * 1024)).toFixed(2)} MB`
    },
    getFileIcon (mimeType = '') {
      const type = String(mimeType).toLowerCase()
      if (type.includes('pdf')) return { emoji: '📄', className: 'text-danger' }
      if (type.includes('image')) return { emoji: '🖼️', className: 'text-success' }
      if (type.includes('word') || type.includes('officedocument.wordprocessingml')) {
        return { emoji: '📝', className: 'text-primary' }
      }
      return { emoji: '📎', className: 'text-muted' }
    },
    async fetchDocuments () {
      this.loading = true
      try {
        const params = {
          page: this.page,
          limit: this.limit
        }
        if (this.searchKeyword) params.keyword = this.searchKeyword
        if (this.filterType) params.documentType = this.filterType

        const response = await axios.get('/api/v1/documents', { params })
        const payload = (response && response.data && response.data.data) || {}
        const list = Array.isArray(payload.documents)
          ? payload.documents
          : (Array.isArray(payload.data) ? payload.data : [])

        this.documents = list
        this.total = Number(payload.total) || list.length
        this.page = Number(payload.page) || this.page
        this.totalPages = Number(payload.totalPages) || Math.max(1, Math.ceil(this.total / this.limit))
        this.apiNotReady = false
      } catch (error) {
        console.error('[AdminDocuments] Error fetching documents:', error)
        this.documents = []
        this.total = 0
        this.totalPages = 1
        this.apiNotReady = true
      } finally {
        this.loading = false
      }
    },
    async fetchProposals () {
      try {
        const response = await axios.get('/api/v1/proposals', { params: { limit: 100 } })
        const payload = (response && response.data && response.data.data) || {}
        const list = Array.isArray(payload.proposals)
          ? payload.proposals
          : (Array.isArray(payload.data) ? payload.data : [])
        this.proposals = list
      } catch (error) {
        console.error('[AdminDocuments] Error fetching proposals:', error)
        this.proposals = []
      }
    },
    onSearch () {
      if (this.searchTimer) clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => {
        this.page = 1
        this.fetchDocuments()
      }, 500)
    },
    onTypeChange (val) {
      this.filterType = this.getSelectValue(val)
      this.page = 1
      this.fetchDocuments()
    },
    onReset () {
      this.searchKeyword = ''
      this.filterType = ''
      this.page = 1
      this.fetchDocuments()
    },
    onPageChange (nextPage) {
      if (nextPage < 1 || nextPage > this.totalPages) return
      this.page = nextPage
      this.fetchDocuments()
    },
    triggerFileSelect () {
      if (this.$refs.fileInput) this.$refs.fileInput.click()
    },
    validateFile (file) {
      if (!file) return { ok: false, message: 'กรุณาเลือกไฟล์' }
      if (file.size > MAX_FILE_SIZE) {
        return { ok: false, message: 'ขนาดไฟล์เกิน 10MB' }
      }

      const ext = (file.name.split('.').pop() || '').toLowerCase()
      const mimeOk = ALLOWED_MIME_TYPES.includes(file.type)
      const extOk = ALLOWED_EXTENSIONS.includes(ext)
      if (!mimeOk && !extOk) {
        return { ok: false, message: 'รองรับเฉพาะ PDF, Word, JPG, PNG' }
      }
      return { ok: true }
    },
    async onFileSelect (event) {
      const file = event && event.target && event.target.files ? event.target.files[0] : null
      const check = this.validateFile(file)
      if (!check.ok) {
        this.uploadForm.file = null
        await Swal.fire({ icon: 'warning', title: 'ไฟล์ไม่ถูกต้อง', text: check.message })
        return
      }
      this.uploadForm.file = file
    },
    async onDrop (event) {
      this.dragOver = false
      const file = event && event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files[0] : null
      const check = this.validateFile(file)
      if (!check.ok) {
        this.uploadForm.file = null
        await Swal.fire({ icon: 'warning', title: 'ไฟล์ไม่ถูกต้อง', text: check.message })
        return
      }
      this.uploadForm.file = file
    },
    openUploadModal () {
      this.uploadForm = {
        proposalId: '',
        documentType: '',
        note: '',
        file: null
      }
      this.uploadProgress = 0
      this.showUploadModal = true
    },
    closeUploadModal () {
      this.showUploadModal = false
      this.uploadLoading = false
      this.uploadProgress = 0
    },
    onUploadProposalChange (val) {
      this.uploadForm.proposalId = this.getSelectValue(val)
    },
    onUploadDocTypeChange (val) {
      this.uploadForm.documentType = this.getSelectValue(val)
    },
    async uploadDocument () {
      if (!this.uploadForm.proposalId || !this.uploadForm.documentType || !this.uploadForm.file) {
        await Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาเลือกโครงการ ประเภทเอกสาร และไฟล์' })
        return
      }

      this.uploadLoading = true
      try {
        const formData = new FormData()
        formData.append('file', this.uploadForm.file)
        formData.append('proposalId', this.uploadForm.proposalId)
        formData.append('documentType', this.uploadForm.documentType)
        formData.append('note', this.uploadForm.note || '')

        await axios.post('/api/v1/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) return
            this.uploadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          }
        })

        this.closeUploadModal()
        await this.fetchDocuments()
        await Swal.fire({ icon: 'success', title: 'อัปโหลดเอกสารสำเร็จ', timer: 1600, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminDocuments] Error uploading document:', error)
        await Swal.fire({
          icon: 'error',
          title: 'อัปโหลดเอกสารไม่สำเร็จ',
          text: (error && error.response && error.response.data && error.response.data.message) || 'ยังไม่มีข้อมูล (API ยังไม่พร้อม)'
        })
      } finally {
        this.uploadLoading = false
      }
    },
    openEditModal (doc) {
      this.selectedDoc = doc
      this.editForm = {
        documentType: doc.documentType || '',
        note: doc.note || ''
      }
      this.showEditModal = true
    },
    closeEditModal () {
      this.showEditModal = false
      this.selectedDoc = null
      this.editLoading = false
      this.editForm = { documentType: '', note: '' }
    },
    onEditDocTypeChange (val) {
      this.editForm.documentType = this.getSelectValue(val)
    },
    async saveEdit () {
      if (!this.selectedDoc) return
      this.editLoading = true
      try {
        await axios.put(`/api/v1/documents/${this.selectedDoc._id}`, {
          documentType: this.editForm.documentType,
          note: this.editForm.note
        })
        this.closeEditModal()
        await this.fetchDocuments()
        await Swal.fire({ icon: 'success', title: 'บันทึกการแก้ไขสำเร็จ', timer: 1500, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminDocuments] Error editing document:', error)
        await Swal.fire({
          icon: 'error',
          title: 'บันทึกการแก้ไขไม่สำเร็จ',
          text: (error && error.response && error.response.data && error.response.data.message) || 'ยังไม่มีข้อมูล (API ยังไม่พร้อม)'
        })
      } finally {
        this.editLoading = false
      }
    },
    async deleteDocument (doc) {
      const result = await Swal.fire({
        icon: 'warning',
        title: `ยืนยันการลบเอกสาร ${doc.fileName || ''}?`,
        text: 'ไม่สามารถกู้คืนได้',
        showCancelButton: true,
        confirmButtonText: 'ยืนยันการลบ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#e55353'
      })
      if (!result.isConfirmed) return

      try {
        await axios.delete(`/api/v1/documents/${doc._id}`)
        await this.fetchDocuments()
        await Swal.fire({ icon: 'success', title: 'ลบเอกสารสำเร็จ', timer: 1400, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminDocuments] Error deleting document:', error)
        await Swal.fire({
          icon: 'error',
          title: 'ลบเอกสารไม่สำเร็จ',
          text: (error && error.response && error.response.data && error.response.data.message) || 'ยังไม่มีข้อมูล (API ยังไม่พร้อม)'
        })
      }
    },
    async openVersionModal (doc) {
      this.versionDoc = doc
      this.versions = []
      this.showVersionModal = true
      this.versionLoading = true
      try {
        const response = await axios.get(`/api/v1/documents/${doc._id}/versions`)
        const payload = (response && response.data && response.data.data) || []
        this.versions = Array.isArray(payload) ? payload : []
      } catch (error) {
        console.error('[AdminDocuments] Error fetching versions:', error)
        this.versions = []
        await Swal.fire({
          icon: 'error',
          title: 'โหลดประวัติเวอร์ชันไม่สำเร็จ',
          text: 'ยังไม่มีข้อมูล (API ยังไม่พร้อม)'
        })
      } finally {
        this.versionLoading = false
      }
    },
    closeVersionModal () {
      this.showVersionModal = false
      this.versionDoc = null
      this.versions = []
      this.versionLoading = false
    },
    downloadFile (doc) {
      if (!doc || !doc.filePath) return
      window.open(this.toAbsoluteUrl(doc.filePath), '_blank')
    }
  }
}
</script>

<style scoped>
.admin-documents-page {
  width: 100%;
}

.summary-card {
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-left-width: 5px;
  border-radius: 8px;
  padding: 14px 16px;
}

.summary-number {
  font-size: 1.65rem;
  font-weight: 700;
  line-height: 1.1;
}

.upload-dropzone {
  border: 2px dashed #c8ced3;
  border-radius: 8px;
  padding: 18px;
  text-align: center;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-dropzone:hover,
.upload-dropzone.drag-over {
  border-color: #321fdb;
  background: #eef1ff;
}

.doc-form {
  padding: 12px 10px;
}
.doc-form .section {
  padding: 8px 6px 12px 6px;
}
.doc-form .section-title {
  font-size: 0.95rem;
  color: #6c757d;
  font-weight: 700;
  margin-bottom: 10px;
}
.doc-form .form-group { margin-bottom: 12px; }
.doc-form .form-label { display:block; margin-bottom:6px; font-weight:700; }
.doc-form .required { color: #e55353; margin-left:0; font-weight:700 }
.section-divider { border:none; border-top:1px solid #e9ecef; margin:12px 0 }

/* Ensure modal has extra bottom space so buttons aren't overlapping */
.documents-modal .c-modal .modal-body,
.documents-modal .modal .modal-body,
.documents-modal .modal-body { padding-bottom: 96px !important; }

/* Footer button spacing (scoped fallback) */
.documents-modal .modal-footer .d-flex.justify-content-end > * { margin-left:12px !important }
.documents-modal .modal-footer .d-flex.justify-content-end > *:last-child { margin-right:28px !important }

/* Ensure action wrapper has extra right padding and buttons float */
.documents-modal .modal-actions-wrapper { padding-right: 48px !important; justify-content: flex-end !important; }
.documents-modal .modal-footer .d-flex.justify-content-end > * {
  transform: translateY(-26px) !important;
  box-shadow: 0 14px 34px rgba(15,23,42,0.18) !important;
  z-index: 11000 !important;
}
.documents-modal .c-modal .modal-content { overflow: visible !important; }

/* Scale the upload/save button to be more prominent (rightmost) */
.modal-actions-wrapper > .floating-action:last-child {
  transform: translateY(-26px) scale(1.06) !important;
  padding: 10px 18px !important;
  font-size: 0.96rem !important;
  min-width: 110px !important;
}
.modal-actions-wrapper > .floating-action:first-child {
  transform: translateY(-26px) scale(1) !important;
  padding: 8px 14px !important;
  font-size: 0.92rem !important;
}
</style>

<style>
/* Final overrides: make modal action buttons smaller and less lifted (documents modals) */
.documents-modal .modal-footer .d-flex.justify-content-end > *,
.documents-modal .modal .modal-footer .d-flex.justify-content-end > *,
.documents-modal .d-flex.justify-content-end > * {
  transform: translateY(-18px) !important;
  box-shadow: 0 8px 20px rgba(15,23,42,0.12) !important;
  border-radius: 8px !important;
  z-index: 10000 !important;
  padding: 6px 12px !important;
  font-size: 0.85rem !important;
  min-width: 88px !important;
}

.modal-actions-wrapper > .floating-action:last-child {
  transform: translateY(-18px) scale(0.98) !important;
  padding: 8px 14px !important;
  font-size: 0.88rem !important;
  min-width: 96px !important;
}
.modal-actions-wrapper > .floating-action:first-child {
  transform: translateY(-18px) scale(0.95) !important;
  padding: 6px 10px !important;
  font-size: 0.82rem !important;
  min-width: 72px !important;
}

.documents-modal .floating-action {
  transform: translateY(-18px) !important;
  box-shadow: 0 8px 20px rgba(15,23,42,0.12) !important;
  position: relative !important;
  z-index: 11000 !important;
  padding: 6px 12px !important;
  font-size: 0.85rem !important;
}

.documents-modal .modal .modal-body,
.documents-modal .c-modal .modal-body,
.documents-modal .modal-body {
  padding-bottom: 96px !important;
}
</style>
