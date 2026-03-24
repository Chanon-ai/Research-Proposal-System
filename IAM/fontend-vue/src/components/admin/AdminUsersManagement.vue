<template>
  <div class="admin-users-page">
    <div :class="headerClass" class="mb-4 flex-wrap" style="gap: 8px;">
      <h2 v-if="showPageHeader" class="mb-0">{{ headerTitle }}</h2>
      <CButton color="primary" @click="openAddModal">{{ addButtonLabel }}</CButton>
    </div>

    <CRow class="mb-3">
      <CCol sm="6" lg="3" class="mb-2 mb-lg-0">
        <CCallout
          color="primary"
          :class="['mb-0', 'summary-widget', { 'is-active': quickFilter === 'all' }]"
          role="button"
          tabindex="0"
          @click.native="onQuickFilterCardClick('all')"
          @keyup.enter.native="onQuickFilterCardClick('all')"
          @keyup.space.native="onQuickFilterCardClick('all')"
        >
          <small class="text-muted">ผู้ใช้ทั้งหมด</small><br>
          <strong class="h5">{{ summary.totalUsers }}</strong>
        </CCallout>
      </CCol>
      <CCol sm="6" lg="3" class="mb-2 mb-lg-0">
        <CCallout
          color="info"
          :class="['mb-0', 'summary-widget', { 'is-active': quickFilter === 'committee' }]"
          role="button"
          tabindex="0"
          @click.native="onQuickFilterCardClick('committee')"
          @keyup.enter.native="onQuickFilterCardClick('committee')"
          @keyup.space.native="onQuickFilterCardClick('committee')"
        >
          <small class="text-muted">คณะกรรมการทั้งหมด</small><br>
          <strong class="h5">{{ summary.totalCommittees }}</strong>
        </CCallout>
      </CCol>
      <CCol sm="6" lg="3" class="mb-2 mb-sm-0">
        <CCallout
          color="danger"
          :class="['mb-0', 'summary-widget', { 'is-active': quickFilter === 'admin' }]"
          role="button"
          tabindex="0"
          @click.native="onQuickFilterCardClick('admin')"
          @keyup.enter.native="onQuickFilterCardClick('admin')"
          @keyup.space.native="onQuickFilterCardClick('admin')"
        >
          <small class="text-muted">ผู้ดูแลระบบทั้งหมด</small><br>
          <strong class="h5">{{ summary.totalAdmins }}</strong>
        </CCallout>
      </CCol>
      <CCol sm="6" lg="3">
        <CCallout
          color="warning"
          :class="['mb-0', 'summary-widget', { 'is-active': quickFilter === 'active' }]"
          role="button"
          tabindex="0"
          @click.native="onQuickFilterCardClick('active')"
          @keyup.enter.native="onQuickFilterCardClick('active')"
          @keyup.space.native="onQuickFilterCardClick('active')"
        >
          <small class="text-muted">ใช้งานอยู่ทั้งหมด</small><br>
          <strong class="h5">{{ summary.totalActiveUsers }}</strong>
        </CCallout>
      </CCol>
    </CRow>

    <CCard class="mb-3">
      <CCardBody>
        <CRow>
          <CCol md="4" class="mb-2 mb-md-0">
            <CInput
              v-model="filters.keyword"
              placeholder="ค้นหาชื่อ หรือ อีเมล..."
            />
          </CCol>
          <CCol md="3" class="mb-2 mb-md-0">
            <CSelect
              :value="filters.role"
              :options="roleFilterOptions"
              @change="onRoleChange"
            />
          </CCol>
          <CCol md="3" class="mb-2 mb-md-0">
            <CSelect
              :value="filters.department"
              :options="departmentFilterOptions"
              @change="onDepartmentChange"
            />
          </CCol>
          <CCol md="2" class="mb-2 mb-md-0">
            <CSelect
              :value="filters.isActive"
              :options="statusFilterOptions"
              @change="onStatusChange"
            />
          </CCol>
          <CCol md="12">
            <CButton color="secondary" variant="outline" block @click="resetFilters">รีเซ็ต</CButton>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <CCard>
      <CCardHeader>
        <div class="d-flex justify-content-between align-items-center flex-wrap" style="gap: 8px;">
          <strong>รายการผู้ใช้งาน</strong>
          <small class="text-muted">แสดง {{ displayFrom }}-{{ displayTo }} จาก {{ total }} รายการ</small>
        </div>
      </CCardHeader>
      <CCardBody>
        <div v-if="apiNotReady" class="alert alert-warning">
          ไม่สามารถโหลดข้อมูลผู้ใช้งานได้ กรุณาลองใหม่อีกครั้ง
        </div>

        <div v-if="loading" class="text-center py-5">
          <CSpinner color="primary" />
          <div class="mt-2 text-muted">กำลังโหลดข้อมูล...</div>
        </div>

        <div v-else>
          <CDataTable
            :items="tableItems"
            :fields="fields"
            hover
            striped
            bordered
            small
            :items-per-page="limit"
            :no-items-view="noItemsView"
          >
            <template #index="{ item }">
              <td>{{ item.index }}</td>
            </template>

            <template #role="{ item }">
              <td>
                <CBadge :color="getRoleColor(item.role)">
                  {{ getRoleLabel(item.role) }}
                </CBadge>
              </td>
            </template>

            <template #isActive="{ item }">
              <td>
                <CBadge :color="item.isActive ? 'success' : 'secondary'">
                  {{ item.isActive ? 'ใช้งานอยู่' : 'ปิดใช้งาน' }}
                </CBadge>
              </td>
            </template>

            <template #lastLogin="{ item }">
              <td>{{ formatDate(item.lastLogin) }}</td>
            </template>

            <template #actions="{ item }">
              <td class="text-nowrap">
                <CButton size="sm" color="primary" class="mr-1" @click="openEditModal(item)">แก้ไข</CButton>
                <CButton
                  size="sm"
                  class="mr-1"
                  :color="item.isActive ? 'danger' : 'success'"
                  @click="toggleActive(item)"
                >
                  {{ item.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน' }}
                </CButton>
                <CButton size="sm" color="warning" class="mr-1" @click="resetPassword(item)">รีเซ็ตรหัสผ่าน</CButton>
                <CButton size="sm" color="danger" @click="deleteUser(item)">ลบ</CButton>
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
                @click="changePage(page - 1)"
              >
                ก่อนหน้า
              </CButton>
              <CButton
                size="sm"
                color="secondary"
                variant="outline"
                :disabled="page >= totalPages || loading"
                @click="changePage(page + 1)"
              >
                ถัดไป
              </CButton>
            </div>
          </div>
        </div>
      </CCardBody>
    </CCard>

    <CModal
      :show.sync="showAddModal"
      :close-on-backdrop="false"
      centered
      scrollable
      title="เพิ่มผู้ใช้ใหม่"
    >
      <template #body-wrapper>
        <div class="modal-body" style="padding: 20px 24px 8px; max-height: calc(100vh - 220px); overflow-y: auto;">
          <CInput label="ชื่อ-นามสกุล *" v-model="addForm.fullName" placeholder="ระบุชื่อ-นามสกุล" />
          <CInput label="อีเมล *" type="email" v-model="addForm.email" placeholder="example@mfu.ac.th" />
          <CInput label="รหัสผ่าน *" type="password" v-model="addForm.password" placeholder="อย่างน้อย 8 ตัวอักษร" />
          <CInput label="ยืนยันรหัสผ่าน *" type="password" v-model="addForm.confirmPassword" placeholder="กรอกรหัสผ่านอีกครั้ง" />
          <CSelect label="บทบาท *" :value="addForm.role" :options="roleInputOptions" @change="onAddRoleChange" />
          <CInput label="สังกัดหน่วยงาน" v-model="addForm.department" placeholder="เช่น สำนักวิจัย" />
          <CInput label="เบอร์โทรศัพท์" v-model="addForm.phone" placeholder="08x-xxx-xxxx" />
        </div>
      </template>

      <template #footer-wrapper>
        <div class="d-flex justify-content-end w-100" style="padding: 12px 24px 20px;">
          <CButton color="secondary" class="mr-2" @click="closeAddModal">ยกเลิก</CButton>
          <CButton color="primary" :disabled="submittingAdd" @click="submitAddUser">
            {{ submittingAdd ? 'กำลังบันทึก...' : 'บันทึก' }}
          </CButton>
        </div>
      </template>
    </CModal>

    <CModal
      :show.sync="showEditModal"
      :close-on-backdrop="false"
      centered
      scrollable
      title="แก้ไขผู้ใช้งาน"
    >
      <template #body-wrapper>
        <div class="modal-body" style="padding: 20px 24px 8px; max-height: calc(100vh - 220px); overflow-y: auto;">
          <div v-if="editForm._id">
            <CInput label="ชื่อ-นามสกุล *" v-model="editForm.fullName" placeholder="ระบุชื่อ-นามสกุล" />
            <CInput label="อีเมล" v-model="editForm.email" readonly />
            <CSelect label="บทบาท *" :value="editForm.role" :options="roleInputOptions" @change="onEditRoleChange" />
            <CInput label="สังกัดหน่วยงาน" v-model="editForm.department" placeholder="เช่น สำนักวิจัย" />
            <CInput label="เบอร์โทรศัพท์" v-model="editForm.phone" placeholder="08x-xxx-xxxx" />

            <div class="form-group mb-0 mt-2">
              <label>สถานะบัญชี</label>
              <div class="custom-control custom-switch mt-1">
                <input
                  :id="`edit-active-${editForm._id}`"
                  v-model="editForm.isActive"
                  type="checkbox"
                  class="custom-control-input"
                >
                <label class="custom-control-label" :for="`edit-active-${editForm._id}`">
                  {{ editForm.isActive ? 'ใช้งานอยู่' : 'ปิดใช้งาน' }}
                </label>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer-wrapper>
        <div class="d-flex justify-content-end w-100" style="padding: 12px 24px 20px;">
          <CButton color="secondary" class="mr-2" @click="closeEditModal">ยกเลิก</CButton>
          <CButton color="primary" :disabled="submittingEdit" @click="submitEditUser">
            {{ submittingEdit ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข' }}
          </CButton>
        </div>
      </template>
    </CModal>
  </div>
</template>

<script>
import { instance as axios } from '@/service/api'
import Swal from 'sweetalert2'

const ROLES = {
  admin: 'ผู้ดูแลระบบ',
  chairman: 'ประธานวิจัย',
  committee: 'คณะกรรมการ',
  researcher: 'นักวิจัย'
}

const ROLE_BADGE_COLORS = {
  admin: 'danger',
  chairman: 'warning',
  committee: 'info',
  researcher: 'success'
}

export default {
  name: 'AdminUsersManagement',
  props: {
    showPageHeader: {
      type: Boolean,
      default: true
    },
    headerTitle: {
      type: String,
      default: 'จัดการผู้ใช้ (Admin)'
    },
    addButtonLabel: {
      type: String,
      default: '+ เพิ่มผู้ใช้ใหม่'
    }
  },
  data () {
    return {
      fields: [
        { key: 'index', label: '#' },
        { key: 'fullName', label: 'ชื่อ-นามสกุล' },
        { key: 'email', label: 'อีเมล' },
        { key: 'department', label: 'หน่วยงาน' },
        { key: 'role', label: 'บทบาท' },
        { key: 'isActive', label: 'สถานะ' },
        { key: 'lastLogin', label: 'เข้าสู่ระบบล่าสุด' },
        { key: 'actions', label: 'Actions', _classes: 'text-center text-nowrap' }
      ],
      users: [],
      loading: false,
      apiNotReady: false,
      quickFilter: 'all',
<<<<<<< HEAD
      fetchSeq: 0,
=======
>>>>>>> 0d09fcb8f2291ce2cd745b42cf2afdab222dd2af
      summary: {
        totalUsers: 0,
        totalCommittees: 0,
        totalAdmins: 0,
        totalActiveUsers: 0
      },
      departments: [],

      page: 1,
      total: 0,
      totalPages: 1,
      limit: 10,

      filters: {
        keyword: '',
        role: '',
        department: '',
        isActive: ''
      },
      searchDebounceTimer: null,

      showAddModal: false,
      submittingAdd: false,
      addForm: {
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'researcher',
        department: '',
        phone: ''
      },

      showEditModal: false,
      submittingEdit: false,
      editForm: {
        _id: '',
        fullName: '',
        email: '',
        role: 'researcher',
        department: '',
        phone: '',
        isActive: true
      }
    }
  },
  computed: {
    headerClass () {
      return this.showPageHeader
        ? 'd-flex justify-content-between align-items-center'
        : 'd-flex justify-content-end align-items-center'
    },
    tableItems () {
      return (this.users || []).map((user, idx) => ({
        ...user,
        index: (this.page - 1) * this.limit + idx + 1
      }))
    },
    displayFrom () {
      if (this.total === 0) return 0
      return (this.page - 1) * this.limit + 1
    },
    displayTo () {
      if (this.total === 0) return 0
      return Math.min(this.page * this.limit, this.total)
    },
    roleFilterOptions () {
      return [
        { value: '', label: 'ทุก Role' },
        ...Object.keys(ROLES).map(role => ({ value: role, label: ROLES[role] }))
      ]
    },
    roleInputOptions () {
      return Object.keys(ROLES).map(role => ({ value: role, label: ROLES[role] }))
    },
    departmentFilterOptions () {
      return [
        { value: '', label: 'ทุกหน่วยงาน' },
        ...(this.departments || []).map(dep => ({ value: dep, label: dep }))
      ]
    },
    statusFilterOptions () {
      return [
        { value: '', label: 'ทุกสถานะบัญชี' },
        { value: 'true', label: 'ใช้งานอยู่' },
        { value: 'false', label: 'ปิดใช้งาน' }
      ]
    },
    hasAnyFilterApplied () {
      return Boolean(
        String(this.filters.keyword || '').trim() ||
        this.filters.role ||
        this.filters.department ||
        this.filters.isActive ||
        (this.quickFilter && this.quickFilter !== 'all')
      )
    },
    noItemsView () {
      if (this.hasAnyFilterApplied) {
        return {
          noResults: 'ไม่พบผู้ใช้งานตามตัวกรองที่เลือก',
          noItems: 'ไม่พบผู้ใช้งานตามตัวกรองที่เลือก'
        }
      }
      return {
        noResults: 'ไม่พบผู้ใช้งาน',
        noItems: 'ไม่พบผู้ใช้งาน'
      }
    }
  },
  watch: {
    'filters.keyword' () {
      if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer)
      this.searchDebounceTimer = setTimeout(() => {
        this.page = 1
        this.fetchUsers()
      }, 500)
    }
  },
  mounted () {
    this.fetchUsers()
  },
  beforeDestroy () {
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer)
  },
  methods: {
    syncQuickFilterFromDropdowns () {
      const role = String(this.filters.role || '').trim()
      const status = String(this.filters.isActive || '').trim()
      if (role === 'committee' && !status) {
        this.quickFilter = 'committee'
        return
      }
      if (role === 'admin' && !status) {
        this.quickFilter = 'admin'
        return
      }
      if (status === 'true' && !role) {
        this.quickFilter = 'active'
        return
      }
<<<<<<< HEAD
=======
      if (!role && !status) {
        this.quickFilter = 'all'
        return
      }
>>>>>>> 0d09fcb8f2291ce2cd745b42cf2afdab222dd2af

      this.quickFilter = (!role && !status) ? 'all' : ''
    },
<<<<<<< HEAD
    onQuickFilterCardClick (key) {
      if (key === 'all') {
        const isTogglingOff = this.quickFilter === 'all'
        this.filters.keyword = ''
        this.filters.role = ''
        this.filters.department = ''
        this.filters.isActive = ''
        this.quickFilter = isTogglingOff ? '' : 'all'
      } else {
        const isSameActive = this.quickFilter === key

        if (key === 'committee' || key === 'admin') {
          this.filters.role = isSameActive ? '' : key
          this.filters.isActive = ''
          this.quickFilter = isSameActive ? '' : key
        } else if (key === 'active') {
          this.filters.isActive = isSameActive ? '' : 'true'
          this.filters.role = ''
          this.quickFilter = isSameActive ? '' : 'active'
        }
=======
    applyQuickFilter (key) {
      if (key === 'committee') {
        this.filters.role = 'committee'
        this.filters.isActive = ''
        this.quickFilter = 'committee'
        return
      }
      if (key === 'admin') {
        this.filters.role = 'admin'
        this.filters.isActive = ''
        this.quickFilter = 'admin'
        return
      }
      if (key === 'active') {
        this.filters.role = ''
        this.filters.isActive = 'true'
        this.quickFilter = 'active'
        return
>>>>>>> 0d09fcb8f2291ce2cd745b42cf2afdab222dd2af
      }

      this.filters.role = ''
      this.filters.isActive = ''
      this.quickFilter = 'all'
    },
    onQuickFilterCardClick (key) {
      this.applyQuickFilter(key)
      this.page = 1
      this.fetchUsers()
    },
    async fetchUsers () {
      const seq = ++this.fetchSeq
      this.loading = true
      try {
        const params = {
          page: this.page,
          limit: this.limit
        }
        if (this.filters.keyword) params.keyword = this.filters.keyword
        if (this.filters.role) params.role = this.filters.role
        if (this.filters.department) params.department = this.filters.department
        if (this.filters.isActive !== '') params.isActive = this.filters.isActive

        const response = await axios.get('/api/v1/admin/users', { params })
        if (seq !== this.fetchSeq) return
        const payload = (response && response.data && response.data.data) || {}

        const list = Array.isArray(payload.users)
          ? payload.users
          : (Array.isArray(payload.data) ? payload.data : [])

        this.users = list
        this.total = Number(payload.total) || list.length
        this.page = Number(payload.page) || this.page
        this.totalPages = Number(payload.totalPages) || Math.max(1, Math.ceil(this.total / this.limit))
        this.summary = {
          totalUsers: Number(payload.summary && payload.summary.totalUsers) || 0,
          totalCommittees: Number(payload.summary && payload.summary.totalCommittees) || 0,
          totalAdmins: Number(payload.summary && payload.summary.totalAdmins) || 0,
          totalActiveUsers: Number(payload.summary && payload.summary.totalActiveUsers) || 0
        }
        this.departments = Array.isArray(payload.departments) ? payload.departments : []
        this.apiNotReady = false
      } catch (error) {
        if (seq !== this.fetchSeq) return
        console.error('[AdminUsers] Error fetching users:', error)
        this.users = []
        this.total = 0
        this.totalPages = 1
        this.summary = {
          totalUsers: 0,
          totalCommittees: 0,
          totalAdmins: 0,
          totalActiveUsers: 0
        }
        this.departments = []
        this.apiNotReady = true
      } finally {
        if (seq === this.fetchSeq) this.loading = false
      }
    },
    onRoleChange (val) {
      this.filters.role = val && val.target ? val.target.value : val
      this.syncQuickFilterFromDropdowns()
      this.page = 1
      this.fetchUsers()
    },
    onDepartmentChange (val) {
      this.filters.department = val && val.target ? val.target.value : val
      this.page = 1
      this.fetchUsers()
    },
    onStatusChange (val) {
      this.filters.isActive = val && val.target ? val.target.value : val
      this.syncQuickFilterFromDropdowns()
      this.page = 1
      this.fetchUsers()
    },
    resetFilters () {
      this.filters.keyword = ''
      this.filters.role = ''
      this.filters.department = ''
      this.filters.isActive = ''
      this.quickFilter = 'all'
      this.page = 1
      this.fetchUsers()
    },
    changePage (nextPage) {
      if (nextPage < 1 || nextPage > this.totalPages) return
      this.page = nextPage
      this.fetchUsers()
    },
    getRoleLabel (role) {
      return ROLES[role] || role || '-'
    },
    getRoleColor (role) {
      return ROLE_BADGE_COLORS[role] || 'secondary'
    },
    formatDate (value) {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '-'
      return date.toLocaleString('th-TH')
    },
    validateEmail (email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return re.test(String(email).toLowerCase())
    },
    openAddModal () {
      this.addForm = {
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'researcher',
        department: '',
        phone: ''
      }
      this.showAddModal = true
    },
    closeAddModal () {
      this.showAddModal = false
    },
    onAddRoleChange (val) {
      this.addForm.role = val && val.target ? val.target.value : val
    },
    async submitAddUser () {
      if (!this.addForm.fullName || !this.addForm.email || !this.addForm.password) {
        await Swal.fire({ icon: 'warning', title: 'กรอกข้อมูลไม่ครบ', text: 'กรุณากรอกชื่อ อีเมล และรหัสผ่าน' })
        return
      }
      if (!this.validateEmail(this.addForm.email)) {
        await Swal.fire({ icon: 'warning', title: 'อีเมลไม่ถูกต้อง', text: 'กรุณาตรวจสอบรูปแบบอีเมล' })
        return
      }
      if (this.addForm.password !== this.addForm.confirmPassword) {
        await Swal.fire({ icon: 'warning', title: 'รหัสผ่านไม่ตรงกัน', text: 'กรุณาตรวจสอบรหัสผ่านและยืนยันรหัสผ่าน' })
        return
      }

      this.submittingAdd = true
      try {
        await axios.post('/api/v1/admin/users', {
          fullName: this.addForm.fullName,
          email: this.addForm.email,
          password: this.addForm.password,
          role: this.addForm.role,
          department: this.addForm.department,
          phone: this.addForm.phone
        })

        this.closeAddModal()
        await this.fetchUsers()
        await Swal.fire({
          icon: 'success',
          title: 'เพิ่มผู้ใช้สำเร็จ',
          timer: 1500,
          showConfirmButton: false
        })
      } catch (error) {
        console.error('[AdminUsers] Error adding user:', error)
        await Swal.fire({
          icon: 'error',
          title: 'เพิ่มผู้ใช้ไม่สำเร็จ',
          text: (error && error.response && error.response.data && error.response.data.message) || 'ยังไม่มีข้อมูล (API ยังไม่พร้อม)'
        })
      } finally {
        this.submittingAdd = false
      }
    },
    openEditModal (user) {
      this.editForm = {
        _id: user._id,
        fullName: user.fullName || '',
        email: user.email || '',
        role: user.role || 'researcher',
        department: user.department || '',
        phone: user.phone || '',
        isActive: Boolean(user.isActive)
      }
      this.showEditModal = true
    },
    closeEditModal () {
      this.showEditModal = false
      this.editForm = {
        _id: '',
        fullName: '',
        email: '',
        role: 'researcher',
        department: '',
        phone: '',
        isActive: true
      }
    },
    onEditRoleChange (val) {
      this.editForm.role = val && val.target ? val.target.value : val
    },
    async submitEditUser () {
      if (!this.editForm._id) return
      if (!this.editForm.fullName) {
        await Swal.fire({ icon: 'warning', title: 'กรอกข้อมูลไม่ครบ', text: 'กรุณากรอกชื่อ-นามสกุล' })
        return
      }

      this.submittingEdit = true
      try {
        await axios.put(`/api/v1/admin/users/${this.editForm._id}`, {
          fullName: this.editForm.fullName,
          email: this.editForm.email,
          role: this.editForm.role,
          department: this.editForm.department,
          phone: this.editForm.phone,
          isActive: this.editForm.isActive
        })

        this.closeEditModal()
        await this.fetchUsers()
        await Swal.fire({
          icon: 'success',
          title: 'บันทึกการแก้ไขสำเร็จ',
          timer: 1500,
          showConfirmButton: false
        })
      } catch (error) {
        console.error('[AdminUsers] Error editing user:', error)
        await Swal.fire({
          icon: 'error',
          title: 'บันทึกการแก้ไขไม่สำเร็จ',
          text: (error && error.response && error.response.data && error.response.data.message) || 'ยังไม่มีข้อมูล (API ยังไม่พร้อม)'
        })
      } finally {
        this.submittingEdit = false
      }
    },
    async toggleActive (user) {
      const actionText = user.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'
      const result = await Swal.fire({
        icon: 'question',
        title: `ยืนยันการ${actionText}บัญชี ${user.fullName}?`,
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
      })
      if (!result.isConfirmed) return

      try {
        await axios.patch(`/api/v1/admin/users/${user._id}/status`, { isActive: !user.isActive })
        await this.fetchUsers()
        await Swal.fire({
          icon: 'success',
          title: `${actionText}สำเร็จ`,
          timer: 1400,
          showConfirmButton: false
        })
      } catch (error) {
        console.error('[AdminUsers] Error toggling active:', error)
        await Swal.fire({
          icon: 'error',
          title: `${actionText}ไม่สำเร็จ`,
          text: (error && error.response && error.response.data && error.response.data.message) || 'ยังไม่มีข้อมูล (API ยังไม่พร้อม)'
        })
      }
    },
    async resetPassword (user) {
      const { value: password } = await Swal.fire({
        icon: 'question',
        title: `รีเซ็ตรหัสผ่าน: ${user.fullName}`,
        input: 'password',
        inputLabel: 'รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)',
        inputPlaceholder: 'กรอกรหัสผ่านใหม่',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
      })

      if (!password) return
      if (String(password).length < 8) {
        await Swal.fire({ icon: 'warning', title: 'รหัสผ่านสั้นเกินไป', text: 'ต้องมีอย่างน้อย 8 ตัวอักษร' })
        return
      }

      try {
        await axios.patch(`/api/v1/admin/users/${user._id}/reset-password`, { newPassword: password })
        await Swal.fire({ icon: 'success', title: 'รีเซ็ตรหัสผ่านสำเร็จ', timer: 1400, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminUsers] Error resetting password:', error)
        await Swal.fire({
          icon: 'error',
          title: 'รีเซ็ตรหัสผ่านไม่สำเร็จ',
          text: (error && error.response && error.response.data && error.response.data.message) || 'กรุณาลองใหม่'
        })
      }
    },
    async deleteUser (user) {
      const result = await Swal.fire({
        icon: 'warning',
        title: `ยืนยันการลบบัญชี ${user.fullName}?`,
        text: 'ระบบจะลบแบบ Soft delete และปิดใช้งานบัญชี',
        showCancelButton: true,
        confirmButtonText: 'ยืนยันการลบ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#e55353'
      })
      if (!result.isConfirmed) return

      try {
        await axios.delete(`/api/v1/admin/users/${user._id}`)
        await this.fetchUsers()
        await Swal.fire({
          icon: 'success',
          title: 'ลบบัญชีสำเร็จ',
          timer: 1400,
          showConfirmButton: false
        })
      } catch (error) {
        console.error('[AdminUsers] Error deleting user:', error)
        await Swal.fire({
          icon: 'error',
          title: 'ลบบัญชีไม่สำเร็จ',
          text: (error && error.response && error.response.data && error.response.data.message) || 'ยังไม่มีข้อมูล (API ยังไม่พร้อม)'
        })
      }
    }
  }
}
</script>

<style scoped>
.admin-users-page {
  width: 100%;
}

.summary-widget {
  position: relative;
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  padding: 16px 18px;
  min-height: 86px;
  margin: 0 !important;
  border: 0 !important;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.14);
  background: linear-gradient(135deg, var(--summary-start, #8c1515), var(--summary-end, #6b0f0f));
  transform: translateY(0);
  transition: box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
  isolation: isolate;
}

.summary-widget::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image: var(--summary-graphic);
  background-repeat: no-repeat;
  background-size: 122px 122px;
  background-position: calc(100% + 10px) -12px;
  opacity: 0.22;
  pointer-events: none;
  z-index: 0;
}

.summary-widget::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.10) 0%, rgba(255, 255, 255, 0) 60%);
  pointer-events: none;
  z-index: 0;
}

.summary-widget > * {
  position: relative;
  z-index: 1;
}

.summary-widget small.text-muted {
  color: rgba(255, 255, 255, 0.92) !important;
  font-weight: 600;
  font-size: 0.86rem;
}

.summary-widget strong.h5 {
  color: #ffffff !important;
  font-size: 1.9rem;
  font-weight: 900;
  line-height: 1.1;
  margin-top: 6px;
}

.summary-widget:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px rgba(15, 23, 42, 0.18);
}

.summary-widget.is-active {
  transform: scale(1.02);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.85), 0 16px 28px rgba(15, 23, 42, 0.22);
}

.summary-widget:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.7), 0 0 0 0.2rem rgba(255, 255, 255, 0.18), 0 16px 28px rgba(15, 23, 42, 0.22);
}

/* Tones (match AdminDashboard summary-card style) */
.summary-widget.c-callout-primary {
  --summary-start: #8c1515;
  --summary-end: #6b0f0f;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Cpath d='M24 70h56l20 18V32L80 50H24z' fill='white' fill-opacity='0.88'/%3E%3Ccircle cx='36' cy='86' r='6' fill='white' fill-opacity='0.7'/%3E%3Ccircle cx='56' cy='86' r='6' fill='white' fill-opacity='0.58'/%3E%3C/svg%3E");
}

.summary-widget.c-callout-info {
  --summary-start: #0ea5e9;
  --summary-end: #0369a1;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='38' cy='46' r='12' fill='white' fill-opacity='0.9'/%3E%3Ccircle cx='62' cy='40' r='10' fill='white' fill-opacity='0.86'/%3E%3Ccircle cx='83' cy='48' r='11' fill='white' fill-opacity='0.82'/%3E%3Crect x='28' y='64' width='62' height='26' rx='13' fill='white' fill-opacity='0.72'/%3E%3C/svg%3E");
}

.summary-widget.c-callout-danger {
  --summary-start: #7c3aed;
  --summary-end: #4c1d95;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Cpath d='M60 16l34 14v25c0 26-14 41-34 49-20-8-34-23-34-49V30z' fill='white' fill-opacity='0.88'/%3E%3Cpath d='M60 38v18' stroke='%23000000' stroke-width='7' stroke-linecap='round' stroke-opacity='0.22'/%3E%3Ccircle cx='60' cy='70' r='5' fill='%23000000' fill-opacity='0.22'/%3E%3C/svg%3E");
}

.summary-widget.c-callout-warning {
  --summary-start: #16a34a;
  --summary-end: #15803d;
  --summary-graphic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M46 61l9 9 20-20' stroke='%23000000' stroke-width='8' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.24' fill='none'/%3E%3Ccircle cx='60' cy='60' r='44' stroke='white' stroke-opacity='0.42' stroke-width='5' fill='none'/%3E%3C/svg%3E");
}

[data-coreui-theme='dark'] .admin-users-page,
body.c-dark-theme .admin-users-page {
  color: #e6edf6;
}

[data-coreui-theme='dark'] .summary-widget,
body.c-dark-theme .summary-widget {
  background-color: #1d2a39;
  border-color: rgba(117, 144, 173, 0.34);
  color: #edf3fb;
}

[data-coreui-theme='dark'] .summary-widget:hover,
body.c-dark-theme .summary-widget:hover {
  background-color: #243244;
  border-color: rgba(134, 164, 196, 0.46);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.32);
}

[data-coreui-theme='dark'] .summary-widget.is-active,
body.c-dark-theme .summary-widget.is-active {
  border-color: #7ea4cf;
  background-color: rgba(77, 109, 143, 0.45);
  box-shadow: 0 0 0 2px rgba(126, 164, 207, 0.24);
}

[data-coreui-theme='dark'] .summary-widget small,
body.c-dark-theme .summary-widget small {
  color: #a8bdd2 !important;
}
</style>
