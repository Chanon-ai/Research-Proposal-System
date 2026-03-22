<template>
  <div class="admin-settings-page">
    <div class="mb-4">
      <h2 class="mb-0">ตั้งค่าระบบ (Admin)</h2>
    </div>

    <div v-if="loadingSettings" class="text-center py-4">
      <CSpinner color="primary" />
      <div class="mt-2 text-muted">กำลังโหลดการตั้งค่า...</div>
    </div>

    <CTabs :active-tab.sync="activeTab" tabs class="nav-underline nav-underline-primary">
      <CTab>
        <template slot="title">ทั่วไป</template>

        <CCard class="mt-3">
          <CCardHeader>ข้อมูลระบบ</CCardHeader>
          <CCardBody>
            <CRow>
              <CCol md="6"><CInput label="ชื่อระบบ" v-model="generalForm.systemName" /></CCol>
              <CCol md="6"><CInput label="ชื่อมหาวิทยาลัย" v-model="generalForm.universityName" /></CCol>
              <CCol md="4"><CInput type="number" label="ปีงบประมาณปัจจุบัน" v-model.number="generalForm.fiscalYear" /></CCol>
              <CCol md="4"><CInput type="date" label="วันสิ้นสุดรับโครงการ" v-model="generalForm.submissionDeadline" /></CCol>
              <CCol md="4"><CInput type="number" label="จำนวนโครงการสูงสุดต่อนักวิจัย" v-model.number="generalForm.maxProposalsPerResearcher" /></CCol>
            </CRow>
            <CButton color="primary" @click="saveGeneralSettings">บันทึกการตั้งค่า</CButton>
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader>การแสดงผล</CCardHeader>
          <CCardBody>
            <CRow>
              <CCol md="3">
                <CSelect
                  label="ภาษาเริ่มต้น"
                  :value="generalForm.language"
                  :options="[
                    { value: 'th', label: 'ไทย' },
                    { value: 'en', label: 'English' }
                  ]"
                  @change="generalForm.language = getSelectValue($event)"
                />
              </CCol>
              <CCol md="3">
                <CSelect
                  label="Timezone"
                  :value="generalForm.timezone"
                  :options="[
                    { value: 'Asia/Bangkok', label: 'Asia/Bangkok' },
                    { value: 'UTC', label: 'UTC' }
                  ]"
                  @change="generalForm.timezone = getSelectValue($event)"
                />
              </CCol>
              <CCol md="3">
                <CSelect
                  label="รูปแบบวันที่"
                  :value="generalForm.dateFormat"
                  :options="[
                    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
                  ]"
                  @change="generalForm.dateFormat = getSelectValue($event)"
                />
              </CCol>
              <CCol md="3"><CInput type="number" label="จำนวนรายการต่อหน้า" v-model.number="generalForm.itemsPerPage" /></CCol>
            </CRow>
            <CButton color="primary" @click="saveGeneralSettings">บันทึก</CButton>
          </CCardBody>
        </CCard>
      </CTab>

      <CTab>
        <template slot="title">Workflow</template>

        <CCard class="mt-3">
          <CCardHeader>กำหนดระยะเวลา (Deadline per Step)</CCardHeader>
          <CCardBody>
            <div class="table-responsive">
              <table class="table table-bordered table-striped mb-0">
                <thead>
                  <tr>
                    <th>ขั้นตอน</th>
                    <th>คำอธิบาย</th>
                    <th style="width: 180px;">ระยะเวลา (วัน)</th>
                    <th style="width: 100px;">แก้ไข</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="step in workflowSteps" :key="step.key">
                    <td>{{ step.title }}</td>
                    <td>{{ step.description }}</td>
                    <td><CInput type="number" v-model.number="workflowForm.stepDeadlines[step.key]" /></td>
                    <td><CButton size="sm" color="primary" @click="saveWorkflowSettings">บันทึก</CButton></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader>การอนุมัติ</CCardHeader>
          <CCardBody>
            <CRow>
              <CCol md="3"><CInput type="number" label="ต้องมีคะแนนขั้นต่ำ (%)" v-model.number="workflowForm.minScore" /></CCol>
              <CCol md="3"><CInput type="number" label="จำนวนกรรมการขั้นต่ำต่อโครงการ" v-model.number="workflowForm.minCommittee" /></CCol>
              <CCol md="3"><CInput type="number" label="รอบการพิจารณาสูงสุด" v-model.number="workflowForm.maxRounds" /></CCol>
              <CCol md="3">
                <label class="d-block mb-1">เปิดให้แก้ไขหลังประชุม</label>
                <CSwitch color="success" :checked.sync="workflowForm.allowRevisionAfterMeeting" />
              </CCol>
            </CRow>
            <CButton color="primary" @click="saveWorkflowSettings">บันทึกการตั้งค่า Workflow</CButton>
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader>สถานะที่อนุญาต (Read-only)</CCardHeader>
          <CCardBody>
            <div class="transition-row" v-for="(toStatuses, fromStatus) in allowedTransitions" :key="fromStatus">
              <CBadge color="secondary" class="mr-2 mb-2">{{ getStatusLabel(fromStatus) }}</CBadge>
              <span class="mr-2">→</span>
              <CBadge class="mr-2 mb-2" color="primary" v-for="to in toStatuses" :key="`${fromStatus}-${to}`">{{ getStatusLabel(to) }}</CBadge>
            </div>
          </CCardBody>
        </CCard>
      </CTab>

      <CTab>
        <template slot="title">อีเมล</template>

        <CCard class="mt-3">
          <CCardHeader>Email Templates</CCardHeader>
          <CCardBody>
            <CCallout color="warning" class="mb-3">
              <strong>หมายเหตุ:</strong>
              การกด “บันทึก Templates ทั้งหมด” จะบันทึก <strong>ทุก Template พร้อมกัน</strong>ในครั้งเดียว ไม่ใช่เฉพาะ Template ที่เปิดอยู่ กรุณาแก้ไขให้ครบถ้วนก่อนกดบันทึก
            </CCallout>
            <details class="mb-3" v-for="(tpl, key) in emailTemplates" :key="key">
              <summary class="font-weight-bold mb-2">{{ getTemplateLabel(key) }}</summary>
              <div class="mt-2">
                <CInput label="หัวเรื่อง" v-model="emailTemplates[key].subject" />
                <label>เนื้อหา</label>
                <textarea class="form-control mb-2" rows="6" v-model="emailTemplates[key].body" />
                <small class="text-muted d-block mb-2">ตัวแปรที่ใช้ได้: {{recipientName}} {{proposalCode}} {{projectTitle}} {{remarks}} {{meetingTitle}} {{meetingDate}} {{meetingTime}}</small>
                <div class="d-flex" style="gap: 8px;">
                  <CButton size="sm" color="primary" @click="saveTemplate(key)">บันทึก Templates ทั้งหมด</CButton>
                  <CButton size="sm" color="secondary" variant="outline" @click="resetTemplate(key)">รีเซ็ตค่าเริ่มต้น</CButton>
                </div>
              </div>
            </details>
          </CCardBody>
        </CCard>

        <CCard class="mt-3">
          <CCardHeader class="d-flex justify-content-between align-items-center flex-wrap" style="gap:8px;">
            <span>Email Log (ล่าสุด)</span>
            <div class="d-flex align-items-center" style="gap:8px;">
              <CSelect
                style="width:130px;margin-bottom:0;"
                :value="emailLogFilter"
                :options="[
                  { value: '', label: 'ทุกสถานะ' },
                  { value: 'sent', label: 'สำเร็จ' },
                  { value: 'failed', label: 'ล้มเหลว' }
                ]"
                @change="onEmailLogFilterChange"
              />
              <CButton size="sm" color="secondary" variant="outline" @click="fetchEmailLogs" :disabled="emailLogLoading">
                {{ emailLogLoading ? 'โหลด...' : 'รีเฟรช' }}
              </CButton>
            </div>
          </CCardHeader>
          <CCardBody>
            <div v-if="emailLogLoading && emailLogs.length === 0" class="text-center py-3">
              <CSpinner color="primary" size="sm" /> กำลังโหลด...
            </div>
            <div v-else-if="emailLogs.length === 0" class="text-muted text-center py-3">
              ยังไม่มีบันทึกการส่งอีเมล
            </div>
            <div v-else class="table-responsive">
              <table class="table table-bordered table-striped table-sm mb-0">
                <thead>
                  <tr>
                    <th style="min-width:140px;">เวลา</th>
                    <th>Event</th>
                    <th>อีเมลผู้รับ</th>
                    <th>โครงการ</th>
                    <th style="width:90px;">สถานะ</th>
                    <th>ข้อผิดพลาด</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="log in emailLogs" :key="log._id">
                    <td><small>{{ formatLogDate(log.sentAt) }}</small></td>
                    <td><code>{{ log.eventKey }}</code></td>
                    <td><small>{{ log.recipientEmail }}</small></td>
                    <td><small>{{ log.proposalRef || '-' }}</small></td>
                    <td>
                      <CBadge :color="log.status === 'sent' ? 'success' : 'danger'">
                        {{ log.status === 'sent' ? 'สำเร็จ' : 'ล้มเหลว' }}
                      </CBadge>
                    </td>
                    <td><small class="text-danger">{{ log.errorMessage || '' }}</small></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="emailLogTotal > emailLogs.length" class="text-center mt-2">
              <CButton size="sm" color="secondary" variant="outline" @click="loadMoreEmailLogs" :disabled="emailLogLoading">
                โหลดเพิ่มเติม ({{ emailLogs.length }}/{{ emailLogTotal }})
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      </CTab>

      <CTab>
        <template slot="title">ผู้ดูแลระบบ</template>

        <CCard class="mt-3">
          <CCardHeader>ข้อมูลระบบ (Read-only)</CCardHeader>
          <CCardBody>
            <div><strong>เวอร์ชันระบบ:</strong> 1.0.0</div>
            <div><strong>Backend:</strong> Node.js + Express</div>
            <div><strong>Database:</strong> MongoDB</div>
            <div><strong>สถานะระบบ:</strong> <span class="text-success">ปกติ</span></div>
            <div><strong>เชื่อมต่อ Database:</strong> <span :class="settings.length > 0 || apiConnected ? 'text-success' : 'text-warning'">{{ settings.length > 0 || apiConnected ? 'เชื่อมต่อได้' : 'ยังไม่ยืนยัน' }}</span></div>
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader class="d-flex justify-content-between align-items-center flex-wrap" style="gap:8px;">
            <span>จัดการ Settings (Raw)</span>
            <CButton size="sm" color="primary" @click="showAddSettingModal = true">+ เพิ่ม Setting ใหม่</CButton>
          </CCardHeader>
          <CCardBody>
            <div class="table-responsive">
              <table class="table table-bordered table-striped mb-0">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Value</th>
                    <th>Group</th>
                    <th>คำอธิบาย</th>
                    <th style="width:120px;">แก้ไข</th>
                    <th style="width:80px;">ลบ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="s in settings" :key="s._id || s.key">
                    <td><code>{{ s.key }}</code></td>
                    <td>
                      <CInput
                        v-if="editingSettingId === (s._id || s.key)"
                        v-model="editingSettingValue"
                        :type="editingSettingIsSecret ? 'password' : 'text'"
                        :placeholder="editingSettingIsSecret ? 'มีการตั้งค่าไว้แล้ว (กรอกใหม่เพื่อเปลี่ยน)' : ''"
                        :name="editingSettingIsSecret ? 'setting_secret_value' : 'setting_value'"
                        :autocomplete="editingSettingIsSecret ? 'new-password' : 'off'"
                      />
                      <span v-else>{{ renderSettingValue(s) }}</span>
                    </td>
                    <td>{{ s.group || '-' }}</td>
                    <td>
                      <CInput v-if="editingSettingId === (s._id || s.key)" v-model="editingSettingDescription" />
                      <span v-else>{{ s.description || '-' }}</span>
                    </td>
                    <td>
                      <div v-if="editingSettingId === (s._id || s.key)" class="d-flex" style="gap:6px;">
                        <CButton size="sm" color="primary" @click="editSetting(s)">บันทึก</CButton>
                        <CButton size="sm" color="secondary" variant="outline" @click="cancelEditSetting">ยกเลิก</CButton>
                      </div>
                      <CButton v-else size="sm" color="warning" @click="startEditSetting(s)">แก้ไข</CButton>
                    </td>
                    <td><CButton size="sm" color="danger" @click="deleteSetting(s)">ลบ</CButton></td>
                  </tr>
                  <tr v-if="settings.length === 0">
                    <td colspan="6" class="text-center text-muted">ยังไม่มีข้อมูล setting</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CCardBody>
        </CCard>

        <CCard class="danger-zone mt-3">
          <CCardHeader>Danger Zone</CCardHeader>
          <CCardBody>
            <div class="d-flex flex-wrap" style="gap:8px;">
              <CButton color="warning" @click="clearCache">ล้างข้อมูล Cache</CButton>
              <CButton color="secondary" @click="exportSettings">Export การตั้งค่าทั้งหมด</CButton>
            </div>
          </CCardBody>
        </CCard>
      </CTab>

      <CTab>
        <template slot="title">ผู้ใช้งาน</template>
        <div class="mt-3">
          <AdminUsersManagement />
        </div>
      </CTab>
    </CTabs>

    <button
      type="button"
      class="admin-email-widget__fab"
      :class="{ 'is-open': isEmailWidgetOpen }"
      aria-label="เปิดฟอร์มส่งอีเมล"
      @click="toggleEmailWidget"
    >
      <CIcon :name="isEmailWidgetOpen ? 'cil-x' : 'cil-envelope-open'" size="lg" />
    </button>

    <div
      v-if="isEmailWidgetOpen"
      class="admin-email-widget__backdrop"
      @click="closeEmailWidget"
    >
      <CCard
        class="admin-email-widget__panel"
        @click.stop
      >
        <CCardHeader class="admin-email-widget__header d-flex justify-content-between align-items-start">
          <div>
            <div class="admin-email-widget__eyebrow">ADMIN EMAIL</div>
            <h5 class="mb-1">Send a message</h5>
            <small class="text-muted">ส่งอีเมลทดสอบผ่านระบบ SMTP ที่ตั้งค่าไว้</small>
          </div>
          <CButton color="secondary" variant="ghost" size="sm" class="admin-email-widget__close-btn" @click="closeEmailWidget">ปิด</CButton>
        </CCardHeader>

        <CCardBody class="admin-email-widget__body">
          <CAlert
            v-if="emailWidgetFeedback.message"
            :color="emailWidgetFeedback.type === 'success' ? 'success' : 'danger'"
            show
            class="mb-3"
          >
            {{ emailWidgetFeedback.message }}
          </CAlert>

          <CInput
            label="Name / ชื่อผู้ส่ง"
            v-model="emailWidgetForm.senderName"
            placeholder="เช่น ผู้ดูแลระบบ"
          />

          <CInput
            label="Subject / หัวข้อ"
            v-model="emailWidgetForm.subject"
            placeholder="เช่น ทดสอบระบบแจ้งเตือน"
          />

          <CInput
            label="Email address / อีเมลผู้รับ"
            type="email"
            v-model="emailWidgetForm.recipientEmail"
            placeholder="ต้องเป็นอีเมลผู้ใช้จริงในระบบ"
          />

          <label class="d-block mb-1">Template (ถ้าต้องการ)</label>
          <CSelect
            class="mb-3"
            :value="emailWidgetForm.templateKey"
            :options="[
              { value: '', label: '(ใช้หัวข้อ/ข้อความที่กรอกเอง)' },
              ...Object.keys(emailTemplates).map(key => ({ value: key, label: getTemplateLabel(key) }))
            ]"
            @change="onWidgetTemplateChange"
          />

          <label class="d-block mb-1">Message / รายละเอียดข้อความ</label>
          <textarea
            v-model="emailWidgetForm.message"
            rows="6"
            class="form-control admin-email-widget__textarea"
            placeholder="พิมพ์ข้อความที่ต้องการส่ง"
          />
        </CCardBody>

        <CCardFooter class="admin-email-widget__footer">
          <CButton
            color="primary"
            class="admin-email-widget__send-btn"
            block
            :disabled="emailWidgetSending"
            @click="sendEmailFromWidget"
          >
            {{ emailWidgetSending ? 'กำลังส่ง...' : 'ส่งอีเมล' }}
          </CButton>
        </CCardFooter>
      </CCard>
    </div>

    <CModal class="send-modal" :show.sync="showAddSettingModal" centered title="เพิ่ม Setting ใหม่" :close-on-backdrop="false">
      <template #body-wrapper>
        <div class="send-modal-inner" style="padding-left:36px;padding-right:36px;box-sizing:border-box;">
          <CInput label="Key *" v-model="newSetting.key" placeholder="use_snake_case" />
          <CInput label="Value *" v-model="newSetting.value" />
          <CSelect
            label="Group"
            :value="newSetting.group"
            :options="[
              { value: 'general', label: 'general' },
              { value: 'workflow', label: 'workflow' },
              { value: 'email', label: 'email' },
              { value: 'system', label: 'system' }
            ]"
            @change="newSetting.group = getSelectValue($event)"
          />
          <CInput label="คำอธิบาย" v-model="newSetting.description" />
        </div>
      </template>
      <template #footer-wrapper>
        <div class="d-flex justify-content-end w-100" style="max-width:880px;margin:0 auto;padding-right:36px;box-sizing:border-box;gap:12px;">
          <CButton color="secondary" class="modal-btn modal-btn--secondary" @click="showAddSettingModal = false">ยกเลิก</CButton>
          <CButton color="primary" class="modal-btn modal-btn--primary" @click="addSetting">เพิ่ม</CButton>
        </div>
      </template>
    </CModal>
  </div>
</template>

<script>
import { instance as axios } from '@/service/api'
import AdminUsersManagement from '@/components/admin/AdminUsersManagement.vue'
import Swal from 'sweetalert2'

const LOCAL_FALLBACK_KEY = 'admin_settings_local_fallback_v1'
const SECRET_MASK = '••••••••'
const SECRET_KEY_PATTERNS = [
  /smtp[_-]?password/i,
  /api[_-]?key/i,
  /access[_-]?token/i,
  /secret/i,
  /private[_-]?key/i
]

const EMAIL_TEMPLATE_LABELS = {
  revision_requested: 'ขอแก้ไขเอกสาร',
  approved: 'อนุมัติโครงการ',
  rejected: 'ไม่อนุมัติโครงการ',
  meeting_scheduled: 'นัดประชุม',
  committee_assigned: 'มอบหมายกรรมการ'
}

const DEFAULT_TEMPLATES = {
  revision_requested: {
    subject: 'แจ้งขอแก้ไขเอกสารโครงการวิจัย - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nโครงการ "{{projectTitle}}" ได้รับการพิจารณาและมีข้อเสนอแนะให้แก้ไข\n\nหมายเหตุ: {{remarks}}\n\nกรุณาเข้าสู่ระบบเพื่อดำเนินการแก้ไขภายในกำหนด\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  approved: {
    subject: 'แจ้งผลการอนุมัติโครงการวิจัย - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nยินดีด้วย! โครงการ "{{projectTitle}}" ได้รับการอนุมัติแล้ว\n\nกรุณาเข้าสู่ระบบเพื่อดูรายละเอียดเพิ่มเติม\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  rejected: {
    subject: 'แจ้งผลการพิจารณาโครงการวิจัย - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nโครงการ "{{projectTitle}}" ไม่ผ่านการพิจารณาในรอบนี้\n\nเหตุผล: {{remarks}}\n\nกรุณาเข้าสู่ระบบเพื่อดูรายละเอียด\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  meeting_scheduled: {
    subject: 'แจ้งกำหนดการประชุมพิจารณาโครงการวิจัย',
    body: 'เรียน {{recipientName}}\n\nขอแจ้งกำหนดการประชุมพิจารณาโครงการวิจัย\n\nรายละเอียด: {{remarks}}\n\nกรุณาเตรียมเอกสารให้พร้อมและเข้าร่วมการประชุมตามกำหนด\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  committee_assigned: {
    subject: 'แจ้งการมอบหมายพิจารณาโครงการวิจัย - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nท่านได้รับมอบหมายให้พิจารณาโครงการ "{{projectTitle}}"\n\nกรุณาเข้าสู่ระบบเพื่อดูเอกสารและดำเนินการพิจารณาภายในกำหนด\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  }
}

const STATUS_LABELS = {
  submitted: 'ยื่นแล้ว',
  faculty_review_pending: 'รอประธานพิจารณา',
  faculty_approved: 'ประธานอนุมัติ',
  office_received: 'ส่วนบริหารรับแล้ว',
  document_checking: 'ตรวจสอบเอกสาร',
  assigned_to_committee: 'มอบหมายกรรมการแล้ว',
  under_review: 'กำลังพิจารณา',
  meeting_completed: 'ประชุมเสร็จแล้ว',
  revision_requested: 'ขอแก้ไข',
  resubmitted: 'ส่งแก้ไขแล้ว',
  second_round_review: 'พิจารณารอบ 2',
  approved: 'อนุมัติ',
  rejected: 'ปฏิเสธ',
  announced: 'ประกาศผลแล้ว'
}

const ALLOWED_TRANSITIONS = {
  submitted: ['faculty_review_pending'],
  faculty_approved: ['office_received'],
  office_received: ['document_checking'],
  document_checking: ['assigned_to_committee', 'revision_requested'],
  under_review: ['meeting_completed'],
  meeting_completed: ['approved', 'rejected', 'revision_requested'],
  revision_requested: ['resubmitted'],
  resubmitted: ['second_round_review'],
  second_round_review: ['approved', 'rejected', 'revision_requested'],
  approved: ['announced'],
  rejected: ['announced']
}

const SETTINGS_TAB_INDEX = {
  general: 0,
  workflow: 1,
  email: 2,
  admin: 3,
  users: 4
}

const SETTINGS_TAB_KEY_BY_INDEX = ['general', 'workflow', 'email', 'admin', 'users']

export default {
  name: 'AdminSettings',
  components: {
    AdminUsersManagement
  },
  data () {
    return {
      activeTab: 0,
      settings: [],
      loadingSettings: false,
      apiConnected: false,

      generalForm: {
        systemName: 'ระบบบริหารจัดการข้อเสนอโครงการวิจัย MFU',
        universityName: 'มหาวิทยาลัยแม่ฟ้าหลวง',
        fiscalYear: 2025,
        submissionDeadline: '',
        maxProposalsPerResearcher: 3,
        language: 'th',
        timezone: 'Asia/Bangkok',
        dateFormat: 'DD/MM/YYYY',
        itemsPerPage: 10
      },

      workflowForm: {
        minScore: 60,
        minCommittee: 3,
        maxRounds: 2,
        allowRevisionAfterMeeting: true,
        stepDeadlines: {
          step1: 7,
          step2: 5,
          step3: 14,
          step4: 7,
          step5: 7
        }
      },

      smtpForm: {
        smtp_host: '',
        smtp_port: 587,
        smtp_username: '',
        smtp_password: '',
        smtp_from_name: 'ระบบวิจัย MFU',
        smtp_from_email: '',
        smtp_use_ssl: true
      },
      smtpPasswordConfigured: false,
      showPassword: false,
      emailNotificationsEnabled: true,
      emailTemplates: JSON.parse(JSON.stringify(DEFAULT_TEMPLATES)),
      testRecipientEmail: '',
      testTemplateKey: '',

      emailLogs: [],
      emailLogTotal: 0,
      emailLogLoading: false,
      emailLogFilter: '',
      emailLogPage: 1,

      isEmailWidgetOpen: false,
      emailWidgetSending: false,
      emailWidgetFeedback: {
        type: '',
        message: ''
      },
      emailWidgetForm: {
        senderName: '',
        subject: '',
        recipientEmail: '',
        message: '',
        templateKey: ''
      },

      showAddSettingModal: false,
      newSetting: { key: '', value: '', group: 'general', description: '' },

      editingSettingId: null,
      editingSettingValue: '',
      editingSettingDescription: '',
      editingSettingIsSecret: false,

      allowedTransitions: ALLOWED_TRANSITIONS,
      workflowSteps: [
        { key: 'step1', title: '1. ยื่นโครงการ', description: 'รับโดยส่วนบริหาร' },
        { key: 'step2', title: '2. ตรวจสอบเอกสาร', description: 'มอบหมายกรรมการ' },
        { key: 'step3', title: '3. กรรมการพิจารณา', description: 'ประชุม' },
        { key: 'step4', title: '4. ขอแก้ไข', description: 'นักวิจัยส่งกลับ' },
        { key: 'step5', title: '5. ส่งแก้ไข', description: 'พิจารณารอบ 2' }
      ]
    }
  },
  mounted () {
    this.applyTabFromRoute()
    this.fetchSettings()
    this.fetchEmailLogs()
    document.addEventListener('keydown', this.onEmailWidgetKeydown)
  },
  beforeDestroy () {
    document.removeEventListener('keydown', this.onEmailWidgetKeydown)
  },
  watch: {
    '$route.query.tab' () {
      this.applyTabFromRoute()
    },
    activeTab () {
      this.syncRouteTabQuery()
    }
  },
  methods: {
    getTabIndexFromQuery (tabKey) {
      if (!tabKey) return null
      const key = String(tabKey).trim().toLowerCase()
      return Object.prototype.hasOwnProperty.call(SETTINGS_TAB_INDEX, key)
        ? SETTINGS_TAB_INDEX[key]
        : null
    },
    applyTabFromRoute () {
      const nextTab = this.getTabIndexFromQuery(this.$route.query.tab)
      if (nextTab === null || this.activeTab === nextTab) return
      this.activeTab = nextTab
    },
    syncRouteTabQuery () {
      const tabKey = SETTINGS_TAB_KEY_BY_INDEX[this.activeTab]
      if (!tabKey) return
      const currentTab = String(this.$route.query.tab || '').trim().toLowerCase()
      if (currentTab === tabKey) return

      this.$router.replace({
        path: this.$route.path,
        query: {
          ...this.$route.query,
          tab: tabKey
        }
      }).catch(() => {})
    },
    toBool (val, fallback = false) {
      if (val === true || val === false) return val
      if (val === undefined || val === null) return fallback
      if (typeof val === 'number') return val !== 0
      if (typeof val === 'string') {
        const s = val.trim().toLowerCase()
        if (s === '' || s === '0' || s === 'false' || s === 'no' || s === 'n') return false
        if (s === '1' || s === 'true' || s === 'yes' || s === 'y') return true
      }
      return Boolean(val)
    },
    toNum (val, fallback) {
      if (val === undefined || val === null || val === '') return fallback
      const n = Number(val)
      return Number.isNaN(n) ? fallback : n
    },
    toStr (val, fallback = '') {
      if (val === undefined || val === null) return fallback
      const s = String(val)
      return s === '' ? fallback : s
    },
    isValidEmail (email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return re.test(String(email || '').trim().toLowerCase())
    },
    normalizeEmail (email) {
      return String(email || '').trim().toLowerCase()
    },
    isPlaceholderEmail (email) {
      const normalized = this.normalizeEmail(email)
      if (!normalized) return true
      if (['admin01@gmail.com', 'test@example.com'].includes(normalized)) return true
      const patterns = [
        /^admin0\d+@gmail\.com$/i,
        /^test[\w.+-]*@/i,
        /^fake[\w.+-]*@/i,
        /^dummy[\w.+-]*@/i,
        /^seed[\w.+-]*@/i,
        /@example\.(com|org|net)$/i
      ]
      return patterns.some(pattern => pattern.test(normalized))
    },
    validateSMTPConfig ({ requirePassword = false } = {}) {
      const host = String(this.smtpForm.smtp_host || '').trim()
      const port = Number(this.smtpForm.smtp_port)
      const fromEmail = String(this.smtpForm.smtp_from_email || '').trim()
      const username = String(this.smtpForm.smtp_username || '').trim()
      const password = String(this.smtpForm.smtp_password || '').trim()

      if (!host) return 'กรุณากรอก SMTP Host'
      if (!Number.isFinite(port) || port < 1 || port > 65535) return 'SMTP Port ไม่ถูกต้อง'
      if (!fromEmail || !this.isValidEmail(fromEmail)) return 'กรุณากรอก From Email ให้ถูกต้อง'

      if (username && !requirePassword && !password && !this.smtpPasswordConfigured) {
        return 'กรุณากรอก SMTP Password'
      }
      if (requirePassword && username && !password && !this.smtpPasswordConfigured) {
        return 'กรุณากรอก SMTP Password สำหรับทดสอบการส่งอีเมล'
      }

      return ''
    },
    getSmtpDebugSnapshot () {
      return {
        smtp_host: String(this.smtpForm.smtp_host || '').trim(),
        smtp_port: Number(this.smtpForm.smtp_port),
        smtp_username: String(this.smtpForm.smtp_username || '').trim(),
        smtp_from_email: String(this.smtpForm.smtp_from_email || '').trim()
      }
    },
    normalizeSmtpForm (raw = {}, fallback = null) {
      const base = fallback || this.smtpForm
      return {
        smtp_host: this.toStr(raw.smtp_host !== undefined ? raw.smtp_host : raw.host, base.smtp_host),
        smtp_port: this.toNum(raw.smtp_port !== undefined ? raw.smtp_port : raw.port, base.smtp_port),
        smtp_username: this.toStr(raw.smtp_username !== undefined ? raw.smtp_username : raw.username, base.smtp_username),
        smtp_password: this.toStr(raw.smtp_password !== undefined ? raw.smtp_password : raw.password, base.smtp_password),
        smtp_from_name: this.toStr(raw.smtp_from_name !== undefined ? raw.smtp_from_name : raw.fromName, base.smtp_from_name),
        smtp_from_email: this.toStr(raw.smtp_from_email !== undefined ? raw.smtp_from_email : raw.fromEmail, base.smtp_from_email),
        smtp_use_ssl: raw.smtp_use_ssl !== undefined
          ? this.toBool(raw.smtp_use_ssl, base.smtp_use_ssl)
          : (raw.useSSL !== undefined ? this.toBool(raw.useSSL, base.smtp_use_ssl) : base.smtp_use_ssl)
      }
    },
    shouldKeepExistingSecret (value) {
      if (value === undefined || value === null) return true
      const text = String(value).trim()
      if (!text) return true
      return ['********', SECRET_MASK, 'มีการตั้งค่าไว้แล้ว'].includes(text)
    },
    buildSmtpPayloadForApi ({ includePasswordIfProvided = true } = {}) {
      const payload = {
        smtp_host: String(this.smtpForm.smtp_host || '').trim(),
        smtp_port: Number(this.smtpForm.smtp_port),
        smtp_username: String(this.smtpForm.smtp_username || '').trim(),
        smtp_from_name: String(this.smtpForm.smtp_from_name || '').trim(),
        smtp_from_email: String(this.smtpForm.smtp_from_email || '').trim(),
        smtp_use_ssl: Boolean(this.smtpForm.smtp_use_ssl)
      }

      const password = String(this.smtpForm.smtp_password || '').trim()
      if (includePasswordIfProvided && !this.shouldKeepExistingSecret(password)) {
        payload.smtp_password = password
      }

      return payload
    },
    getSelectValue (val) {
      return val && val.target ? val.target.value : val
    },
    getStatusLabel (status) {
      return STATUS_LABELS[status] || status
    },
    isSecretKey (key) {
      const normalizedKey = String(key || '').trim()
      if (!normalizedKey) return false
      return SECRET_KEY_PATTERNS.some(pattern => pattern.test(normalizedKey))
    },
    parseSettingsPayload (response) {
      const payload = response && response.data && response.data.data
      if (Array.isArray(payload)) return payload
      if (payload && Array.isArray(payload.settings)) return payload.settings
      if (Array.isArray(response && response.data)) return response.data
      return []
    },
    renderSettingValue (setting) {
      const value = setting && Object.prototype.hasOwnProperty.call(setting, 'value')
        ? setting.value
        : setting
      const key = setting && setting.key ? setting.key : ''
      const isSecret = Boolean(setting && setting.isSecret) || this.isSecretKey(key)
      if (isSecret) {
        const isConfigured = Boolean(setting && setting.isConfigured) || (value !== undefined && value !== null && String(value).trim() !== '')
        return isConfigured ? SECRET_MASK : '-'
      }
      if (typeof value === 'object') return JSON.stringify(value)
      return String(value)
    },
    saveFallback () {
      const bundle = {
        generalForm: this.generalForm,
        workflowForm: this.workflowForm,
        smtpForm: this.smtpForm,
        emailTemplates: this.emailTemplates,
        settings: this.settings
      }
      localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(bundle))
    },
    loadFallback () {
      try {
        const raw = localStorage.getItem(LOCAL_FALLBACK_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw)
        if (parsed.generalForm) this.generalForm = { ...this.generalForm, ...parsed.generalForm }
        if (parsed.workflowForm) {
          this.workflowForm = {
            ...this.workflowForm,
            ...parsed.workflowForm,
            stepDeadlines: {
              ...this.workflowForm.stepDeadlines,
              ...(parsed.workflowForm.stepDeadlines || {})
            }
          }
        }
        if (parsed.smtpForm) this.smtpForm = this.normalizeSmtpForm(parsed.smtpForm)
        if (parsed.emailTemplates) this.emailTemplates = parsed.emailTemplates
        if (Array.isArray(parsed.settings)) this.settings = parsed.settings
      } catch (e) {
        console.error('[AdminSettings] loadFallback error:', e)
      }
    },
    async fetchSettings () {
      this.loadingSettings = true
      try {
        const response = await axios.get('/api/v1/setting')
        this.settings = this.parseSettingsPayload(response)
        this.apiConnected = true
        this.applySettingsToForms()
      } catch (error) {
        console.error('[AdminSettings] Error fetching settings:', error)
        this.apiConnected = false
        this.loadFallback()
      } finally {
        this.loadingSettings = false
      }
    },
    applySettingsToForms () {
      const map = {}
      this.settings.forEach(item => {
        if (item && item.key) map[item.key] = item.value
      })

      this.generalForm = {
        ...this.generalForm,
        systemName: this.toStr(map.system_name, this.generalForm.systemName),
        universityName: this.toStr(map.university_name, this.generalForm.universityName),
        fiscalYear: this.toNum(map.current_fiscal_year, this.generalForm.fiscalYear),
        submissionDeadline: this.toStr(map.submission_deadline, this.generalForm.submissionDeadline),
        maxProposalsPerResearcher: this.toNum(map.max_proposals_per_researcher, this.generalForm.maxProposalsPerResearcher),
        language: this.toStr(map.default_language, this.generalForm.language),
        timezone: this.toStr(map.timezone, this.generalForm.timezone),
        dateFormat: this.toStr(map.date_format, this.generalForm.dateFormat),
        itemsPerPage: this.toNum(map.items_per_page, this.generalForm.itemsPerPage)
      }

      this.workflowForm = {
        ...this.workflowForm,
        minScore: this.toNum(map.workflow_min_score, this.workflowForm.minScore),
        minCommittee: this.toNum(map.workflow_min_committee, this.workflowForm.minCommittee),
        maxRounds: this.toNum(map.workflow_max_rounds, this.workflowForm.maxRounds),
        allowRevisionAfterMeeting: map.workflow_allow_revision_after_meeting !== undefined
          ? this.toBool(map.workflow_allow_revision_after_meeting, this.workflowForm.allowRevisionAfterMeeting)
          : this.workflowForm.allowRevisionAfterMeeting,
        stepDeadlines: {
          step1: this.toNum(map.workflow_step1_days, this.workflowForm.stepDeadlines.step1),
          step2: this.toNum(map.workflow_step2_days, this.workflowForm.stepDeadlines.step2),
          step3: this.toNum(map.workflow_step3_days, this.workflowForm.stepDeadlines.step3),
          step4: this.toNum(map.workflow_step4_days, this.workflowForm.stepDeadlines.step4),
          step5: this.toNum(map.workflow_step5_days, this.workflowForm.stepDeadlines.step5)
        }
      }

      this.smtpForm = this.normalizeSmtpForm({
        smtp_host: map.smtp_host,
        smtp_port: map.smtp_port,
        smtp_username: map.smtp_username,
        smtp_password: '',
        smtp_from_name: map.smtp_from_name,
        smtp_from_email: map.smtp_from_email,
        smtp_use_ssl: map.smtp_use_ssl
      })

      if (map.email_notifications_enabled !== undefined) {
        this.emailNotificationsEnabled = this.toBool(map.email_notifications_enabled, true)
      }

      const smtpPasswordSetting = this.settings.find(s => s && s.key === 'smtp_password')
      this.smtpPasswordConfigured = Boolean(
        smtpPasswordSetting && (
          smtpPasswordSetting.isConfigured ||
          (smtpPasswordSetting.value !== undefined && smtpPasswordSetting.value !== null && String(smtpPasswordSetting.value).trim() !== '')
        )
      )

      if (map.email_templates_json) {
        try {
          const parsed = typeof map.email_templates_json === 'string'
            ? JSON.parse(map.email_templates_json)
            : map.email_templates_json
          this.emailTemplates = { ...this.emailTemplates, ...parsed }
        } catch (e) {
          console.error('[AdminSettings] parse templates error:', e)
        }
      }
    },
    async upsertSettingByKey (key, value, description, group) {
      const existed = this.settings.find(s => s.key === key)
      if (existed && existed._id) {
        return axios.put(`/api/v1/setting/${existed._id}`, { value, description })
      }
      return axios.post('/api/v1/setting', { key, value, description, group })
    },
    async saveGeneralSettings () {
      try {
        const jobs = [
          this.upsertSettingByKey('system_name', this.generalForm.systemName, 'ชื่อระบบ', 'general'),
          this.upsertSettingByKey('university_name', this.generalForm.universityName, 'ชื่อมหาวิทยาลัย', 'general'),
          this.upsertSettingByKey('current_fiscal_year', this.generalForm.fiscalYear, 'ปีงบประมาณปัจจุบัน', 'general'),
          this.upsertSettingByKey('submission_deadline', this.generalForm.submissionDeadline, 'วันสิ้นสุดรับโครงการ', 'general'),
          this.upsertSettingByKey('max_proposals_per_researcher', this.generalForm.maxProposalsPerResearcher, 'จำนวนโครงการสูงสุดต่อนักวิจัย', 'general'),
          this.upsertSettingByKey('default_language', this.generalForm.language, 'ภาษาเริ่มต้น', 'general'),
          this.upsertSettingByKey('timezone', this.generalForm.timezone, 'เขตเวลา', 'general'),
          this.upsertSettingByKey('date_format', this.generalForm.dateFormat, 'รูปแบบวันที่', 'general'),
          this.upsertSettingByKey('items_per_page', this.generalForm.itemsPerPage, 'จำนวนรายการต่อหน้า', 'general')
        ]
        await Promise.all(jobs)
        await this.fetchSettings()
        await Swal.fire({ icon: 'success', title: 'บันทึกการตั้งค่าทั่วไปสำเร็จ', timer: 1400, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminSettings] saveGeneralSettings fallback:', error)
        this.saveFallback()
        await Swal.fire({ icon: 'info', title: 'บันทึกในเครื่องแล้ว', text: 'API ยังไม่พร้อม จึงบันทึกแบบ local fallback' })
      }
    },
    async saveWorkflowSettings () {
      try {
        const d = this.workflowForm.stepDeadlines
        const jobs = [
          this.upsertSettingByKey('workflow_min_score', this.workflowForm.minScore, 'คะแนนขั้นต่ำ', 'workflow'),
          this.upsertSettingByKey('workflow_min_committee', this.workflowForm.minCommittee, 'จำนวนกรรมการขั้นต่ำ', 'workflow'),
          this.upsertSettingByKey('workflow_max_rounds', this.workflowForm.maxRounds, 'รอบพิจารณาสูงสุด', 'workflow'),
          this.upsertSettingByKey('workflow_allow_revision_after_meeting', this.workflowForm.allowRevisionAfterMeeting, 'เปิดให้แก้ไขหลังประชุม', 'workflow'),
          this.upsertSettingByKey('workflow_step1_days', d.step1, 'ยื่นโครงการ → รับโดยส่วนบริหาร', 'workflow'),
          this.upsertSettingByKey('workflow_step2_days', d.step2, 'ตรวจสอบเอกสาร → มอบหมายกรรมการ', 'workflow'),
          this.upsertSettingByKey('workflow_step3_days', d.step3, 'กรรมการพิจารณา → ประชุม', 'workflow'),
          this.upsertSettingByKey('workflow_step4_days', d.step4, 'ขอแก้ไข → นักวิจัยส่งกลับ', 'workflow'),
          this.upsertSettingByKey('workflow_step5_days', d.step5, 'ส่งแก้ไข → พิจารณารอบ 2', 'workflow')
        ]
        await Promise.all(jobs)
        await this.fetchSettings()
        await Swal.fire({ icon: 'success', title: 'บันทึก Workflow สำเร็จ', timer: 1400, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminSettings] saveWorkflowSettings fallback:', error)
        this.saveFallback()
        await Swal.fire({ icon: 'info', title: 'บันทึกในเครื่องแล้ว', text: 'API ยังไม่พร้อม จึงบันทึกแบบ local fallback' })
      }
    },
    async saveSMTPSettings () {
      console.debug('[AdminSettings][SMTP] save before validate', this.getSmtpDebugSnapshot())
      const smtpValidationError = this.validateSMTPConfig()
      if (smtpValidationError) {
        await Swal.fire({ icon: 'warning', title: 'ข้อมูล SMTP ไม่ครบถ้วน', text: smtpValidationError })
        return
      }

      try {
        const jobs = [
          this.upsertSettingByKey('smtp_host', this.smtpForm.smtp_host, 'SMTP Host', 'email'),
          this.upsertSettingByKey('smtp_port', this.smtpForm.smtp_port, 'SMTP Port', 'email'),
          this.upsertSettingByKey('smtp_username', this.smtpForm.smtp_username, 'SMTP Username', 'email'),
          this.upsertSettingByKey('smtp_from_name', this.smtpForm.smtp_from_name, 'From Name', 'email'),
          this.upsertSettingByKey('smtp_from_email', this.smtpForm.smtp_from_email, 'From Email', 'email'),
          this.upsertSettingByKey('smtp_use_ssl', this.smtpForm.smtp_use_ssl, 'ใช้ SSL/TLS', 'email'),
          this.upsertSettingByKey('email_notifications_enabled', this.emailNotificationsEnabled, 'เปิด/ปิด Workflow Email', 'email')
        ]
        if (String(this.smtpForm.smtp_password || '').trim() !== '' || !this.smtpPasswordConfigured) {
          jobs.push(this.upsertSettingByKey('smtp_password', this.smtpForm.smtp_password, 'SMTP Password', 'email'))
        }
        await Promise.all(jobs)
        await this.fetchSettings()
        await Swal.fire({ icon: 'success', title: 'บันทึก SMTP สำเร็จ', timer: 1400, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminSettings] saveSMTPSettings fallback:', error)
        this.saveFallback()
        await Swal.fire({ icon: 'info', title: 'บันทึกในเครื่องแล้ว', text: 'API ยังไม่พร้อม จึงบันทึกแบบ local fallback' })
      }
    },
    async saveTemplate (type) {
      const subject = String(this.emailTemplates[type] && this.emailTemplates[type].subject ? this.emailTemplates[type].subject : '').trim()
      if (!subject) {
        await Swal.fire({ icon: 'warning', title: 'หัวเรื่องว่าง', text: `กรุณากรอกหัวเรื่องสำหรับ template ${type}` })
        return
      }

      try {
        await this.upsertSettingByKey('email_templates_json', JSON.stringify(this.emailTemplates), 'Email templates JSON', 'email')
        await this.fetchSettings()
        await Swal.fire({ icon: 'success', title: `บันทึก Template ${type} สำเร็จ`, timer: 1200, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminSettings] saveTemplate fallback:', error)
        this.saveFallback()
        await Swal.fire({ icon: 'info', title: 'บันทึก Template ในเครื่องแล้ว', text: 'API ยังไม่พร้อม จึงใช้ local fallback' })
      }
    },
    resetTemplate (type) {
      this.$set(this.emailTemplates, type, JSON.parse(JSON.stringify(DEFAULT_TEMPLATES[type])))
    },
    getCurrentUserEmail () {
      const fromStore = this.$store && this.$store.getters
        ? this.$store.getters['Authentication/currentUser']
        : null
      if (fromStore && fromStore.email) return String(fromStore.email).trim()

      try {
        const raw = localStorage.getItem('auth_user')
        if (!raw) return ''
        const parsed = JSON.parse(raw)
        return parsed && parsed.email ? String(parsed.email).trim() : ''
      } catch (e) {
        return ''
      }
    },
    getPreferredTestRecipientEmail () {
      const fromInput = String(this.testRecipientEmail || '').trim()
      if (fromInput) return fromInput
      const currentUserEmail = this.getCurrentUserEmail()
      if (this.isPlaceholderEmail(currentUserEmail)) return ''
      return currentUserEmail
    },
    async sendTestSMTP () {
      const currentUserEmail = this.getCurrentUserEmail()
      const recipientEmail = this.getPreferredTestRecipientEmail()

      if (!recipientEmail) {
        await Swal.fire({
          icon: 'warning',
          title: 'กรุณาระบุอีเมลผู้รับทดสอบ',
          text: 'อีเมลผู้ดูแลปัจจุบันเป็นข้อมูลทดสอบหรือไม่พร้อมใช้งาน กรุณากรอกอีเมลผู้ใช้จริงในระบบ'
        })
        return
      }
      if (!this.isValidEmail(recipientEmail)) {
        await Swal.fire({ icon: 'warning', title: 'อีเมลผู้รับทดสอบไม่ถูกต้อง' })
        return
      }
      if (this.isPlaceholderEmail(recipientEmail)) {
        await Swal.fire({
          icon: 'warning',
          title: 'อีเมลผู้รับดูเหมือนเป็นข้อมูลทดสอบ',
          text: 'กรุณาใช้อีเมลผู้ใช้จริงในระบบเพื่อยืนยันการส่งจริง'
        })
        return
      }

      console.debug('[AdminSettings][SMTP] test before validate', this.getSmtpDebugSnapshot())
      const smtpValidationError = this.validateSMTPConfig({ requirePassword: true })
      if (smtpValidationError) {
        await Swal.fire({ icon: 'warning', title: 'ข้อมูล SMTP ไม่ครบถ้วน', text: smtpValidationError })
        return
      }

      const confirmResult = await Swal.fire({
        icon: 'question',
        title: 'ยืนยันการส่งอีเมลทดสอบ',
        html: `ระบบจะส่งอีเมลทดสอบไปยัง <strong>${recipientEmail}</strong><br>ดำเนินการต่อหรือไม่?`,
        showCancelButton: true,
        confirmButtonText: 'ส่งเลย',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#e8a000'
      })
      if (!confirmResult.isConfirmed) return

      try {
        console.debug('[AdminSettings][SMTP] test before API', this.getSmtpDebugSnapshot())
        const smtpPayload = this.buildSmtpPayloadForApi({ includePasswordIfProvided: true })
        await axios.post('/api/v1/setting/test-email', {
          recipientEmail: this.normalizeEmail(recipientEmail),
          smtp: smtpPayload,
          templateKey: this.testTemplateKey || ''
        })
        await Swal.fire({
          icon: 'success',
          title: 'ส่งอีเมลทดสอบสำเร็จ',
          text: `ระบบส่งไปที่ ${recipientEmail} (ผู้ใช้งานปัจจุบัน: ${currentUserEmail || '-'})`
        })
      } catch (error) {
        console.error('[AdminSettings] test smtp error:', error)
        await Swal.fire({
          icon: 'error',
          title: 'ส่งอีเมลทดสอบไม่สำเร็จ',
          text: (error && error.response && error.response.data && error.response.data.message) || 'กรุณาตรวจสอบการตั้งค่า SMTP แล้วลองใหม่'
        })
      }
    },
    async addSetting () {
      const key = (this.newSetting.key || '').trim()
      const value = this.newSetting.value
      if (!key || value === undefined || value === null || value === '') {
        await Swal.fire({ icon: 'warning', title: 'กรอกข้อมูลไม่ครบ', text: 'ต้องกรอก key และ value' })
        return
      }
      if (/\s/.test(key)) {
        await Swal.fire({ icon: 'warning', title: 'Key ไม่ถูกต้อง', text: 'Key ต้องไม่มีช่องว่าง และควรเป็น snake_case' })
        return
      }

      try {
        await axios.post('/api/v1/setting', {
          key,
          value,
          description: this.newSetting.description,
          group: this.newSetting.group
        })
        this.showAddSettingModal = false
        this.newSetting = { key: '', value: '', group: 'general', description: '' }
        await this.fetchSettings()
        await Swal.fire({ icon: 'success', title: 'เพิ่ม Setting สำเร็จ', timer: 1200, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminSettings] addSetting fallback:', error)
        const localId = `local-${Date.now()}`
        this.settings.push({
          _id: localId,
          key,
          value: this.newSetting.value,
          description: this.newSetting.description,
          group: this.newSetting.group
        })
        this.saveFallback()
        this.showAddSettingModal = false
        this.newSetting = { key: '', value: '', group: 'general', description: '' }
        await Swal.fire({ icon: 'info', title: 'เพิ่มในเครื่องแล้ว', text: 'API ยังไม่พร้อม จึงบันทึกแบบ local fallback' })
      }
    },
    startEditSetting (s) {
      this.editingSettingId = s._id || s.key
      this.editingSettingIsSecret = Boolean(s && s.isSecret) || this.isSecretKey(s && s.key)
      this.editingSettingValue = this.editingSettingIsSecret ? '' : this.renderSettingValue(s)
      this.editingSettingDescription = s.description || ''
    },
    cancelEditSetting () {
      this.editingSettingId = null
      this.editingSettingValue = ''
      this.editingSettingDescription = ''
      this.editingSettingIsSecret = false
    },
    async editSetting (s) {
      try {
        if (s._id && String(s._id).startsWith('local-')) {
          throw new Error('local fallback row')
        }
        const payload = {
          description: this.editingSettingDescription
        }
        if (!this.editingSettingIsSecret || String(this.editingSettingValue || '').trim() !== '') {
          payload.value = this.editingSettingValue
        }
        await axios.put(`/api/v1/setting/${s._id}`, payload)
        this.cancelEditSetting()
        await this.fetchSettings()
        await Swal.fire({ icon: 'success', title: 'แก้ไขสำเร็จ', timer: 1200, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminSettings] editSetting fallback:', error)
        const idx = this.settings.findIndex(x => (x._id || x.key) === (s._id || s.key))
        if (idx >= 0) {
          const nextValue = (this.editingSettingIsSecret && String(this.editingSettingValue || '').trim() === '')
            ? this.settings[idx].value
            : this.editingSettingValue
          this.$set(this.settings, idx, {
            ...this.settings[idx],
            value: nextValue,
            description: this.editingSettingDescription
          })
          this.saveFallback()
        }
        this.cancelEditSetting()
        await Swal.fire({ icon: 'info', title: 'แก้ไขในเครื่องแล้ว', text: 'API ยังไม่พร้อม จึงบันทึกแบบ local fallback' })
      }
    },
    async deleteSetting (s) {
      const result = await Swal.fire({
        icon: 'warning',
        title: `ยืนยันการลบ setting ${s.key}?`,
        showCancelButton: true,
        confirmButtonText: 'ยืนยันการลบ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#e55353'
      })
      if (!result.isConfirmed) return

      try {
        if (s._id && String(s._id).startsWith('local-')) {
          throw new Error('local fallback row')
        }
        await axios.delete(`/api/v1/setting/${s._id}`)
        await this.fetchSettings()
        await Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1200, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminSettings] deleteSetting fallback:', error)
        this.settings = this.settings.filter(x => (x._id || x.key) !== (s._id || s.key))
        this.saveFallback()
        await Swal.fire({ icon: 'info', title: 'ลบในเครื่องแล้ว', text: 'API ยังไม่พร้อม จึงบันทึกแบบ local fallback' })
      }
    },
    async clearCache () {
      const result = await Swal.fire({
        icon: 'warning',
        title: 'ยืนยันการล้างข้อมูล Cache?',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
      })
      if (!result.isConfirmed) return

      try {
        await axios.post('/api/v1/setting/clear-cache', {})
        await Swal.fire({ icon: 'success', title: 'ล้าง Cache สำเร็จ' })
      } catch (error) {
        console.error('[AdminSettings] clear-cache stub:', error)
        await Swal.fire({ icon: 'info', title: 'กำลังพัฒนา', text: 'ฟีเจอร์ล้าง Cache อยู่ระหว่างพัฒนา' })
      }
    },
    exportSettings () {
      const blob = new Blob([JSON.stringify(this.settings, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'settings-export.json'
      a.click()
      window.URL.revokeObjectURL(url)
    },
    formatLogDate (dateStr) {
      if (!dateStr) return '-'
      try {
        const d = new Date(dateStr)
        return d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      } catch (e) {
        return String(dateStr)
      }
    },
    onEmailLogFilterChange (val) {
      this.emailLogFilter = val && val.target ? val.target.value : val
      this.emailLogPage = 1
      this.emailLogs = []
      this.fetchEmailLogs()
    },
    async fetchEmailLogs () {
      this.emailLogLoading = true
      this.emailLogPage = 1
      try {
        const params = { limit: 50, page: 1 }
        if (this.emailLogFilter) params.status = this.emailLogFilter
        const response = await axios.get('/api/v1/setting/email-logs', { params })
        const data = response && response.data && response.data.data
        this.emailLogs = (data && Array.isArray(data.logs)) ? data.logs : []
        this.emailLogTotal = (data && data.total) ? Number(data.total) : 0
      } catch (e) {
        console.error('[AdminSettings] fetchEmailLogs error:', e)
        this.emailLogs = []
        this.emailLogTotal = 0
      } finally {
        this.emailLogLoading = false
      }
    },
    async loadMoreEmailLogs () {
      this.emailLogLoading = true
      this.emailLogPage += 1
      try {
        const params = { limit: 50, page: this.emailLogPage }
        if (this.emailLogFilter) params.status = this.emailLogFilter
        const response = await axios.get('/api/v1/setting/email-logs', { params })
        const data = response && response.data && response.data.data
        const more = (data && Array.isArray(data.logs)) ? data.logs : []
        this.emailLogs = [...this.emailLogs, ...more]
        this.emailLogTotal = (data && data.total) ? Number(data.total) : this.emailLogTotal
      } catch (e) {
        console.error('[AdminSettings] loadMoreEmailLogs error:', e)
        this.emailLogPage -= 1
      } finally {
        this.emailLogLoading = false
      }
    },
    async saveEmailNotificationToggle () {
      try {
        await this.upsertSettingByKey('email_notifications_enabled', this.emailNotificationsEnabled, 'เปิด/ปิด Workflow Email', 'email')
        await this.fetchSettings()
        await Swal.fire({ icon: 'success', title: 'บันทึกการตั้งค่าสำเร็จ', timer: 1200, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminSettings] saveEmailNotificationToggle fallback:', error)
        this.saveFallback()
        await Swal.fire({ icon: 'info', title: 'บันทึกในเครื่องแล้ว', text: 'API ยังไม่พร้อม จึงบันทึกแบบ local fallback' })
      }
    },
    getTemplateLabel (key) {
      return EMAIL_TEMPLATE_LABELS[key] || key
    },
    toggleShowPassword () {
      this.showPassword = !this.showPassword
    },
    onEmailWidgetKeydown (event) {
      if (!this.isEmailWidgetOpen) return
      if (event && event.key === 'Escape') {
        this.closeEmailWidget()
      }
    },
    toggleEmailWidget () {
      if (this.isEmailWidgetOpen) {
        this.closeEmailWidget()
        return
      }

      this.emailWidgetFeedback = { type: '', message: '' }
      this.emailWidgetForm = {
        ...this.emailWidgetForm,
        senderName: this.emailWidgetForm.senderName || 'ผู้ดูแลระบบ',
        recipientEmail: this.emailWidgetForm.recipientEmail || this.getPreferredTestRecipientEmail(),
        templateKey: this.emailWidgetForm.templateKey || this.testTemplateKey || ''
      }
      this.isEmailWidgetOpen = true
    },
    closeEmailWidget () {
      this.isEmailWidgetOpen = false
    },
    onWidgetTemplateChange (val) {
      const key = val && val.target ? val.target.value : val
      this.emailWidgetForm.templateKey = key
      if (!key || !this.emailTemplates[key]) return

      const template = this.emailTemplates[key]
      if (!String(this.emailWidgetForm.subject || '').trim()) {
        this.emailWidgetForm.subject = String(template.subject || '').trim()
      }
      if (!String(this.emailWidgetForm.message || '').trim()) {
        this.emailWidgetForm.message = String(template.body || '').trim()
      }
    },
    validateWidgetEmailForm () {
      if (!String(this.emailWidgetForm.senderName || '').trim()) {
        return 'กรุณากรอกชื่อผู้ส่ง'
      }
      if (!String(this.emailWidgetForm.subject || '').trim()) {
        return 'กรุณากรอกหัวข้ออีเมล'
      }
      if (!String(this.emailWidgetForm.message || '').trim()) {
        return 'กรุณากรอกข้อความอีเมล'
      }

      const recipientEmail = String(this.emailWidgetForm.recipientEmail || '').trim()
      if (!recipientEmail) {
        return 'กรุณากรอกอีเมลผู้รับ'
      }
      if (!this.isValidEmail(recipientEmail)) {
        return 'รูปแบบอีเมลผู้รับไม่ถูกต้อง'
      }
      if (this.isPlaceholderEmail(recipientEmail)) {
        return 'อีเมลผู้รับดูเหมือนเป็นข้อมูลทดสอบ กรุณาใช้อีเมลผู้ใช้จริงในระบบ'
      }

      const smtpValidationError = this.validateSMTPConfig({ requirePassword: true })
      if (smtpValidationError) return smtpValidationError
      return ''
    },
    async sendEmailFromWidget () {
      this.emailWidgetFeedback = { type: '', message: '' }

      const validationError = this.validateWidgetEmailForm()
      if (validationError) {
        this.emailWidgetFeedback = { type: 'error', message: validationError }
        return
      }

      this.emailWidgetSending = true
      try {
        const smtpPayload = this.buildSmtpPayloadForApi({ includePasswordIfProvided: true })
        const payload = {
          recipientEmail: this.normalizeEmail(this.emailWidgetForm.recipientEmail),
          smtp: smtpPayload,
          templateKey: this.emailWidgetForm.templateKey || '',
          senderName: String(this.emailWidgetForm.senderName || '').trim(),
          subject: String(this.emailWidgetForm.subject || '').trim(),
          message: String(this.emailWidgetForm.message || '').trim()
        }

        await axios.post('/api/v1/setting/test-email', payload)
        this.emailWidgetFeedback = {
          type: 'success',
          message: `ส่งอีเมลเรียบร้อยไปยัง ${payload.recipientEmail}`
        }
      } catch (error) {
        this.emailWidgetFeedback = {
          type: 'error',
          message: (error && error.response && error.response.data && error.response.data.message) || 'ส่งอีเมลไม่สำเร็จ กรุณาตรวจสอบ SMTP แล้วลองใหม่'
        }
      } finally {
        this.emailWidgetSending = false
      }
    }
  }
}
</script>

<style scoped>
.admin-settings-page {
  width: 100%;
}

.transition-row {
  margin-bottom: 8px;
}

.danger-zone {
  border: 1px solid #e55353;
}

.admin-email-widget__fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 56px;
  height: 56px;
  border: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2f6de1 0%, #1748a3 100%);
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(20, 46, 101, 0.35);
  z-index: 1100;
  cursor: pointer;
}

.admin-email-widget__fab.is-open {
  background: linear-gradient(135deg, #4a5f84 0%, #2b3d5e 100%);
}

.admin-email-widget__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.12);
  z-index: 1090;
}

.admin-email-widget__panel {
  position: fixed;
  right: 24px;
  bottom: 92px;
  width: min(420px, calc(100vw - 24px));
  max-height: min(72vh, 700px);
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 46px rgba(0, 0, 0, 0.24);
  border: 1px solid rgba(44, 62, 100, 0.12);
}

.admin-email-widget__header {
  background: #f4f7ff;
  border-bottom: 1px solid #d9e2f6;
}

.admin-email-widget__eyebrow {
  font-size: 11px;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: #3f65b6;
  margin-bottom: 2px;
}

.admin-email-widget__body {
  overflow: auto;
  background: #ffffff;
}

.admin-email-widget__body label {
  color: #24314e;
}

.admin-email-widget__footer {
  background: #f8fbff;
  border-top: 1px solid #d9e2f6;
}

.admin-email-widget__textarea {
  resize: vertical;
  min-height: 124px;
}

@media (max-width: 768px) {
  .admin-email-widget__fab {
    right: 16px;
    bottom: 16px;
  }

  .admin-email-widget__panel {
    right: 12px;
    left: 12px;
    bottom: 84px;
    width: auto;
    max-height: 76vh;
  }
}
</style>
