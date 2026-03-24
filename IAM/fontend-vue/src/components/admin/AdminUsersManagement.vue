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
          @click="onQuickFilterCardClick('all')"
          @keyup.enter="onQuickFilterCardClick('all')"
          @keyup.space="onQuickFilterCardClick('all')"
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
          @click="onQuickFilterCardClick('committee')"
          @keyup.enter="onQuickFilterCardClick('committee')"
          @keyup.space="onQuickFilterCardClick('committee')"
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
          @click="onQuickFilterCardClick('admin')"
          @keyup.enter="onQuickFilterCardClick('admin')"
          @keyup.space="onQuickFilterCardClick('admin')"
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
          @click="onQuickFilterCardClick('active')"
          @keyup.enter="onQuickFilterCardClick('active')"
          @keyup.space="onQuickFilterCardClick('active')"
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
        this.quickFilter
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
      const keyword = String(this.filters.keyword || '').trim()
      const department = String(this.filters.department || '').trim()

      if (!keyword && !department && !role && !status) {
        this.quickFilter = 'all'
        return
      }
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

      this.quickFilter = ''
    },
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
      }

      this.syncQuickFilterFromDropdowns()
      this.page = 1
      this.fetchUsers()
    },
    async fetchUsers () {
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
        this.loading = false
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
  cursor: pointer;
  border: 1px solid rgba(223, 230, 238, 0.9);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(249, 250, 252, 0.98));
  box-shadow: 0 14px 30px rgba(44, 52, 71, 0.06);
  transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
  border-radius: 1.35rem;
  padding: 16px 18px;
  min-height: 86px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.summary-widget small {
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.11em;
  font-weight: 800;
}

.summary-widget strong.h5 {
  font-size: 1.72rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.summary-widget:hover {
  transform: translateY(-1px);
  border-color: rgba(197, 155, 58, 0.55);
  background: linear-gradient(180deg, rgba(255, 250, 242, 1), rgba(249, 250, 252, 0.98));
  box-shadow: 0 18px 36px rgba(44, 52, 71, 0.1);
}

.summary-widget:focus-visible {
  outline: none;
  box-shadow: 0 18px 36px rgba(44, 52, 71, 0.12), 0 0 0 0.2rem rgba(140, 21, 21, 0.12);
}

.summary-widget.is-active {
  border-color: rgba(140, 21, 21, 0.75);
  background: linear-gradient(180deg, rgba(254, 194, 96, 0.16), rgba(249, 250, 252, 0.98));
  box-shadow: 0 18px 36px rgba(44, 52, 71, 0.12), 0 0 0 0.2rem rgba(140, 21, 21, 0.12);
}
</style>
