<template>
  <div class="admin-users-page">
    <AdminUsersManagement />
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap" style="gap: 8px;">
      <h2 class="mb-0">จัดการผู้ใช้ (Admin)</h2>
      <CButton color="primary" @click="openAddModal">+ เพิ่มผู้ใช้ใหม่</CButton>
    </div>

    <CRow class="mb-3">
      <CCol sm="6" lg="3" class="mb-2 mb-lg-0">
        <CCallout color="primary" class="mb-0">
          <small class="text-muted">ผู้ใช้ทั้งหมด</small><br>
          <strong class="h5">{{ total }}</strong>
        </CCallout>
      </CCol>
      <CCol sm="6" lg="3" class="mb-2 mb-lg-0">
        <CCallout color="info" class="mb-0">
          <small class="text-muted">คณะกรรมการ (หน้านี้)</small><br>
          <strong class="h5">{{ committeeCount }}</strong>
        </CCallout>
      </CCol>
      <CCol sm="6" lg="3" class="mb-2 mb-sm-0">
        <CCallout color="success" class="mb-0">
          <small class="text-muted">นักวิจัย (หน้านี้)</small><br>
          <strong class="h5">{{ researcherCount }}</strong>
        </CCallout>
      </CCol>
      <CCol sm="6" lg="3">
        <CCallout color="warning" class="mb-0">
          <small class="text-muted">ใช้งานอยู่ (หน้านี้)</small><br>
          <strong class="h5">{{ activeCount }}</strong>
        </CCallout>
      </CCol>
    </CRow>

    <CCard class="mb-3">
      <CCardBody>
        <CRow>
          <CCol md="7" class="mb-2 mb-md-0">
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
          <CCol md="2">
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
          ยังไม่มีข้อมูล (API ยังไม่พร้อม)
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
            :no-items-view="{ noResults: 'ไม่พบผู้ใช้งาน', noItems: 'ไม่พบผู้ใช้งาน' }"
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
      class="users-modal"
      :show.sync="showAddModal"
      :close-on-backdrop="false"
      centered
      title="เพิ่มผู้ใช้ใหม่"
    >
      <template #body-wrapper>
        <form class="user-form">
          <div class="section">
            <div class="section-title">ข้อมูลบัญชี</div>

            <div class="form-group">
              <label class="form-label">ชื่อ-นามสกุล <span class="required">*</span></label>
              <CInput v-model="addForm.fullName" placeholder="ระบุชื่อ-นามสกุล" />
            </div>

            <div class="form-group">
              <label class="form-label">อีเมล <span class="required">*</span></label>
              <CInput type="email" v-model="addForm.email" placeholder="example@mfu.ac.th" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">รหัสผ่าน <span class="required">*</span></label>
                <CInput type="password" v-model="addForm.password" placeholder="อย่างน้อย 8 ตัวอักษร" />
              </div>
              <div class="form-group">
                <label class="form-label">ยืนยันรหัสผ่าน <span class="required">*</span></label>
                <CInput type="password" v-model="addForm.confirmPassword" placeholder="กรอกรหัสผ่านอีกครั้ง" />
              </div>
            </div>
          </div>

          <hr class="section-divider" />

          <div class="section">
            <div class="section-title">ข้อมูลเพิ่มเติม</div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">บทบาท <span class="required">*</span></label>
                <CSelect :value="addForm.role" :options="roleInputOptions" @change="onAddRoleChange" />
              </div>
              <div class="form-group">
                <label class="form-label">เบอร์โทรศัพท์</label>
                <CInput v-model="addForm.phone" placeholder="08x-xxx-xxxx" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">สังกัดหน่วยงาน</label>
              <CInput v-model="addForm.department" placeholder="เช่น สำนักวิจัย" />
            </div>
          </div>
        </form>
      </template>

      <template #footer-wrapper>
        <div class="d-flex justify-content-end w-100 modal-actions-wrapper">
          <CButton color="secondary" class="modal-btn modal-btn--secondary" @click="closeAddModal">ยกเลิก</CButton>
          <CButton color="primary" class="modal-btn modal-btn--primary" :disabled="submittingAdd" @click="submitAddUser">
            {{ submittingAdd ? 'กำลังบันทึก...' : 'บันทึก' }}
          </CButton>
        </div>
      </template>
    </CModal>

    <CModal
      class="users-modal"
      :show.sync="showEditModal"
      :close-on-backdrop="false"
      centered
      title="แก้ไขผู้ใช้งาน"
    >
      <template #body-wrapper>
        <div v-if="editForm._id">
          <form class="user-form">
            <div class="section">
              <div class="section-title">ข้อมูลบัญชี</div>

              <div class="form-group">
                <label class="form-label">ชื่อ-นามสกุล <span class="required">*</span></label>
                <CInput v-model="editForm.fullName" placeholder="ระบุชื่อ-นามสกุล" />
              </div>

              <div class="form-group">
                <label class="form-label">อีเมล</label>
                <CInput v-model="editForm.email" readonly />
              </div>
            </div>

            <hr class="section-divider" />

            <div class="section">
              <div class="section-title">ข้อมูลเพิ่มเติม</div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">บทบาท <span class="required">*</span></label>
                  <CSelect :value="editForm.role" :options="roleInputOptions" @change="onEditRoleChange" />
                </div>
                <div class="form-group">
                  <label class="form-label">เบอร์โทรศัพท์</label>
                  <CInput v-model="editForm.phone" placeholder="08x-xxx-xxxx" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">สังกัดหน่วยงาน</label>
                <CInput v-model="editForm.department" placeholder="เช่น สำนักวิจัย" />
              </div>

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
          </form>
        </div>
      </template>

      <template #footer-wrapper>
        <div class="d-flex justify-content-end w-100 modal-actions-wrapper">
          <CButton color="secondary" class="modal-btn modal-btn--secondary" @click="closeEditModal">ยกเลิก</CButton>
          <CButton color="primary" class="modal-btn modal-btn--primary" :disabled="submittingEdit" @click="submitEditUser">
            {{ submittingEdit ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข' }}
          </CButton>
        </div>
      </template>
    </CModal>
  </div>
</template>

<script>
import AdminUsersManagement from '@/components/admin/AdminUsersManagement.vue'

export default {
  name: 'AdminUsers',
  components: {
    AdminUsersManagement
  }
}
</script>

<style scoped>
.admin-users-page {
  width: 100%;
}

.user-form {
  padding: 16px 14px;
}
.user-form .section {
  padding: 12px 8px 18px 8px;
}
.user-form .section-title {
  font-size: 0.95rem;
  color: #6c757d;
  font-weight: 700;
  margin-bottom: 12px;
}
.section-divider {
  border: none;
  border-top: 1px solid #e9ecef;
  margin: 12px 0 18px 0;
}
.user-form .form-group {
  margin-bottom: 16px;
}
.user-form .form-row {
  display: flex;
  gap: 18px;
}
.user-form .form-row .form-group {
  flex: 1;
}
.user-form .form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
  color: #343a40;
  font-size: 1rem;
}
.user-form .required {
  color: #e55353;
  margin-left: 0;
  font-weight: 700;
  font-size: 0.98rem;
}
.user-form input,
.user-form select,
.user-form textarea {
  border-radius: 10px;
  padding: 10px 12px;
}
.users-modal .c-modal .modal-dialog { max-width: 680px; }
.users-modal .c-modal .modal-content { border-radius: 10px; overflow: visible !important; }
.users-modal .c-modal .modal-footer { background: #ffffff; border-top: 1px solid #eef2f7; padding: 12px 28px; position: sticky; bottom:0; z-index:4 }

/* Fallbacks: target modal markup that doesn't use .c-modal wrapper */
.users-modal .modal .modal-footer,
.users-modal .modal-footer {
  background: #ffffff;
  border-top: 1px solid #eef2f7;
  padding: 12px 28px !important;
}
/* Ensure action buttons are not flush to the right edge */
.users-modal .modal-footer .d-flex.justify-content-end,
.users-modal .modal .modal-footer .d-flex.justify-content-end {
  max-width: none;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
  padding-right: 20px !important;
  justify-content: flex-end;
}
.users-modal .modal-footer .d-flex.justify-content-end > * { margin-left: 12px; }
.c-button, .user-form .c-button { border-radius: 8px; }

/* Lift action buttons slightly above the white footer for a floating effect */
.users-modal .modal-footer .d-flex.justify-content-end > * {
  transform: translateY(-12px) !important;
  box-shadow: 0 8px 20px rgba(15,23,42,0.12) !important;
  border-radius: 10px !important;
  z-index: 6 !important;
}

</style>

<style>
/* Normalize modal action buttons to identical size and appearance */
.modal-actions-wrapper > *,
.users-modal .modal-footer .d-flex.justify-content-end > *,
.users-modal .d-flex.justify-content-end > * {
  min-width: 96px !important;
  padding: 8px 14px !important;
  font-size: 0.92rem !important;
  transform: translateY(-22px) !important;
  box-shadow: 0 12px 28px rgba(15,23,42,0.14) !important;
  border-radius: 10px !important;
  line-height: 1 !important;
}

/* Ensure first and last child have same scale and spacing */
.modal-actions-wrapper > *:first-child,
.modal-actions-wrapper > *:last-child {
  transform: translateY(-22px) !important;
}

/* Keep consistent gap between buttons */
.modal-actions-wrapper > * + * {
  margin-left: 12px !important;
}
</style>

<style>
/* Final overrides: make modal action buttons smaller and less lifted */
.users-modal .modal-footer .d-flex.justify-content-end > *,
.users-modal .modal .modal-footer .d-flex.justify-content-end > *,
.users-modal .d-flex.justify-content-end > * {
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

.users-modal .floating-action {
  transform: translateY(-18px) !important;
  box-shadow: 0 8px 20px rgba(15,23,42,0.12) !important;
  position: relative !important;
  z-index: 11000 !important;
  padding: 6px 12px !important;
  font-size: 0.85rem !important;
}

.users-modal .modal .modal-body,
.users-modal .c-modal .modal-body,
.users-modal .modal-body {
  padding-bottom: 96px !important;
}
</style>

<style>
/* Scoped global fallbacks for users modal (use .users-modal to avoid overriding other pages) */
.users-modal .c-modal .modal-footer,
.users-modal .modal .modal-footer,
.users-modal .modal-footer {
  background: #ffffff;
  border-top: 1px solid #eef2f7;
  padding: 12px 28px !important;
  position: sticky;
  bottom: 0;
  z-index: 4;
}

.users-modal .modal-dialog { max-width: 680px; }

.users-modal .modal-footer .d-flex.justify-content-end,
.users-modal .modal .modal-footer .d-flex.justify-content-end {
  max-width: none;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
  padding-right: 20px;
  justify-content: flex-end;
}

/* Keep margin, but allow transforms so buttons can float */
.users-modal .modal-footer .d-flex.justify-content-end > *,
.users-modal .modal .modal-footer .d-flex.justify-content-end > * {
  margin-left: 12px !important;
  position: relative !important;
  bottom: auto !important;
}

/* Ensure modal body has sufficient bottom padding so content doesn't hide behind sticky footer */
.users-modal .modal .modal-body,
.users-modal .c-modal .modal-body,
.users-modal .modal-body {
  padding-bottom: 96px !important;
}
</style>

<style>
/* Override: allow action buttons to float and adjust body padding */
.users-modal .modal-footer .d-flex.justify-content-end > * {
  transform: translateY(-36px) !important;
  box-shadow: 0 18px 40px rgba(15,23,42,0.18) !important;
  border-radius: 10px !important;
  z-index: 10000 !important;
}

/* Reduce bottom padding since buttons overlap the footer */
.users-modal .modal .modal-body,
.users-modal .c-modal .modal-body,
.users-modal .modal-body {
  padding-bottom: 120px !important;
}

/* Apply stronger global rules to cover other modal variants */
.c-modal .modal-footer .d-flex.justify-content-end > *,
.modal .modal-footer .d-flex.justify-content-end > * {
  transform: translateY(-36px) !important;
  box-shadow: 0 18px 40px rgba(15,23,42,0.18) !important;
  border-radius: 10px !important;
  z-index: 10000 !important;
}
.modal .modal-body,
.c-modal .modal-body {
  padding-bottom: 120px !important;
}

/* Generic wrapper rule so any modal using .modal-actions-wrapper gets spacing */
.modal-actions-wrapper {
  padding-right: 48px !important;
  justify-content: flex-end !important;
}

/* Make the primary (rightmost) action slightly larger and more prominent */
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

/* Ensure parent containers allow overflow so floating buttons are visible */
.users-modal .modal,
.users-modal .c-modal {
  overflow: visible !important;
}
.users-modal .modal-dialog {
  overflow: visible !important;
}

/* Stronger floating style for buttons */
.users-modal .modal-footer .d-flex.justify-content-end > * {
  transform: translateY(-22px) !important;
  box-shadow: 0 14px 34px rgba(15,23,42,0.18) !important;
  border-radius: 10px !important;
  z-index: 10000 !important;
}

/* Apply to any footer flex container inside the users modal (cover CModal custom structure) */
.users-modal .d-flex.justify-content-end {
  padding-right: 48px !important;
  justify-content: flex-end !important;
}
.users-modal .d-flex.justify-content-end > * {
  transform: translateY(-22px) !important;
  box-shadow: 0 14px 34px rgba(15,23,42,0.18) !important;
  border-radius: 10px !important;
  z-index: 10000 !important;
}

/* Stronger direct rule for buttons with floating-action class */
.users-modal .floating-action {
  transform: translateY(-26px) !important;
  box-shadow: 0 18px 40px rgba(15,23,42,0.2) !important;
  position: relative !important;
  z-index: 11000 !important;
}
.users-modal .modal-actions-wrapper { padding-right: 48px !important; justify-content: flex-end !important; }
</style>
