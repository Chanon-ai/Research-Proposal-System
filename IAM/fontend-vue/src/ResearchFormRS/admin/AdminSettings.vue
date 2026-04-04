<template>
  <div class="admin-settings-page">
    <CCard class="settings-hero mb-4">
      <CCardBody class="settings-hero__body">
        <div class="settings-hero__row">
          <div class="settings-hero__left">
            <div class="settings-hero__pill">ADMIN SETTINGS</div>
            <h2 class="settings-hero__title">ตั้งค่าระบบ</h2>
            <p class="settings-hero__subtitle">กำหนดค่า Workflow, อีเมล และการแสดงผลของระบบ</p>
          </div>
        </div>
      </CCardBody>
    </CCard>

    <div v-if="loadingSettings" class="text-center py-4">
      <CSpinner color="primary" />
      <div class="mt-2 text-muted">กำลังโหลดการตั้งค่า...</div>
    </div>

    <CTabs :active-tab.sync="activeTab" tabs class="settings-tabs nav-underline nav-underline-primary">
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
            <CButton color="primary" @click="saveGeneralSettings"><CIcon name="cil-save" class="mr-1" /> บันทึกการตั้งค่า</CButton>
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
            <CButton color="primary" @click="saveGeneralSettings"><CIcon name="cil-save" class="mr-1" /> บันทึก</CButton>
          </CCardBody>
        </CCard>

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
      </CTab>

      <CTab>
        <template slot="title">ทุนและงบประมาณ</template>
        <AdminFundingBudgetSettings />
      </CTab>

      <CTab>
        <template slot="title">สิทธิ์การเข้าถึง</template>
        <AdminRolePageAccessSettings />
      </CTab>

      <CTab>
        <template slot="title">Workflow</template>

        <CAlert
          show
          class="mt-3 workflow-alert workflow-alert--source"
          :color="workflowDataSource === 'database' ? 'success' : (workflowDataSource === 'local_fallback' ? 'warning' : 'secondary')"
        >
          <strong>แหล่งข้อมูลที่กำลังใช้งาน:</strong>
          <span v-if="workflowDataSource === 'database'"> ฐานข้อมูล (Database)</span>
          <span v-else-if="workflowDataSource === 'local_fallback'"> local fallback ในเครื่อง</span>
          <span v-else> ยังไม่สามารถยืนยันแหล่งข้อมูลได้</span>
          <span v-if="workflowDataSource === 'local_fallback' && workflowFallbackSavedAt"> (อัปเดตล่าสุด {{ formatLogDate(workflowFallbackSavedAt) }})</span>
        </CAlert>

        <CAlert
          v-if="workflowSaveStatus !== 'idle' && workflowSaveMessage"
          show
          class="workflow-alert workflow-alert--save"
          :color="workflowSaveStatus === 'db_saved' ? 'success' : (workflowSaveStatus === 'local_fallback' ? 'warning' : 'danger')"
        >
          {{ workflowSaveMessage }}
        </CAlert>

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
                    <td><CButton size="sm" color="primary" @click="saveWorkflowSettings"><CIcon name="cil-save" class="mr-1" /> บันทึก</CButton></td>
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
            <CButton color="primary" @click="saveWorkflowSettings"><CIcon name="cil-save" class="mr-1" /> บันทึกการตั้งค่า Workflow</CButton>
          </CCardBody>
        </CCard>

        <!-- ✅ STATUS FLOW CARD (แทนที่ของเดิม) -->
        <CCard>
          <CCardHeader>สถานะที่อนุญาต (Read-only)</CCardHeader>
          <CCardBody>
            <div class="status-flow-list">
              <div
                v-for="(toStatuses, fromStatus, index) in allowedTransitions"
                :key="fromStatus"
              >
                <div v-if="index > 0" class="status-flow-divider" />
                <div class="status-flow-row">
                  <!-- FROM chip -->
                  <span class="status-chip status-chip--from">
                    <component :is="'svg'" v-bind="svgProps" v-html="getStatusIcon(fromStatus)" />
                    {{ getStatusLabel(fromStatus) }}
                  </span>
                  <span class="status-flow-arrow">→</span>
                  <!-- TO chips -->
                  <span
                    v-for="to in toStatuses"
                    :key="`${fromStatus}-${to}`"
                    class="status-chip"
                    :class="getStatusChipClass(to)"
                  >
                    <component :is="'svg'" v-bind="svgProps" v-html="getStatusIcon(to)" />
                    {{ getStatusLabel(to) }}
                  </span>
                </div>
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CTab>

      <CTab>
        <template slot="title">อีเมล</template>

        <CCard class="mt-3">
          <CCardHeader>การแจ้งเตือนทางอีเมล</CCardHeader>
          <CCardBody>
            <CRow>
              <CCol md="6" class="mb-2">
                <label class="d-block mb-1">ส่งอีเมลอัตโนมัติจากระบบ</label>
                <CSwitch color="success" :checked.sync="emailNotificationsEnabled" />
                <small class="text-muted d-block">ควบคุมการส่งอีเมลจากเหตุการณ์สำคัญของระบบ เช่น เปลี่ยนสถานะโครงการ ประกาศผล และคอมเมนต์สำคัญ</small>
              </CCol>
              <CCol md="6" class="mb-2">
                <label class="d-block mb-1">อนุญาตให้แอดมินส่งอีเมลจากหน้า Notifications</label>
                <CSwitch color="success" :checked.sync="manualAdminNotificationEmailEnabled" />
                <small class="text-muted d-block">เมื่อเปิดไว้ ผู้ดูแลระบบสามารถส่งแจ้งเตือนจากหน้า Notifications พร้อมส่งอีเมลถึงผู้รับได้</small>
              </CCol>
            </CRow>

            <small class="text-muted d-block mb-3">ระบบยังคงจัดการค่าขั้นสูงภายในให้อัตโนมัติ เพื่อคงความเข้ากันได้กับการตั้งค่าเดิม</small>

            <CButton color="primary" @click="saveEmailPolicySettings"><CIcon name="cil-save" class="mr-1" /> บันทึกการตั้งค่าอีเมล</CButton>
          </CCardBody>
        </CCard>

        <CCard class="mt-3">
          <CCardHeader>Email Templates</CCardHeader>
          <CCardBody>
            <CCallout color="warning" class="mb-3">
              <strong>หมายเหตุ:</strong>
              การกด "บันทึก Templates ทั้งหมด" จะบันทึก <strong>ทุก Template พร้อมกัน</strong>ในครั้งเดียว ไม่ใช่เฉพาะ Template ที่เปิดอยู่ กรุณาแก้ไขให้ครบถ้วนก่อนกดบันทึก
            </CCallout>
            <details class="mb-3" v-for="(tpl, key) in emailTemplates" :key="key">
              <summary class="font-weight-bold mb-2">{{ getTemplateLabel(key) }}</summary>
              <div class="mt-2">
                <CInput label="หัวเรื่อง" v-model="emailTemplates[key].subject" />
                <label>เนื้อหา</label>
                <textarea class="form-control mb-2" rows="6" v-model="emailTemplates[key].body" />
                <small v-pre class="text-muted d-block mb-2">ตัวแปรที่ใช้ได้: {{recipientName}} {{proposalCode}} {{projectTitle}} {{remarks}} {{meetingTitle}} {{meetingDate}} {{meetingTime}} {{participantRole}} {{consentViewUrl}} {{consentAcceptUrl}} {{consentRejectUrl}}</small>
                <div class="d-flex" style="gap: 8px;">
                  <CButton size="sm" color="primary" @click="saveTemplate(key)"><CIcon name="cil-save" class="mr-1" /> บันทึก Templates ทั้งหมด</CButton>
                  <CButton size="sm" color="secondary" variant="outline" @click="resetTemplate(key)"><CIcon name="cil-reload" class="mr-1" /> รีเซ็ตค่าเริ่มต้น</CButton>
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
                  { value: 'failed', label: 'ล้มเหลว' },
                  { value: 'skipped', label: 'ข้ามการส่ง' }
                ]"
                @change="onEmailLogFilterChange"
              />
              <CButton size="sm" color="secondary" variant="outline" @click="fetchEmailLogs" :disabled="emailLogLoading">
                <CIcon name="cil-reload" class="mr-1" /> {{ emailLogLoading ? 'โหลด...' : 'รีเฟรช' }}
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
                <CIcon name="cil-chevron-right" class="mr-1" /> โหลดเพิ่มเติม ({{ emailLogs.length }}/{{ emailLogTotal }})
              </CButton>
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

    <CModal class="send-modal" :show.sync="showAddSettingModal" centered title="เพิ่ม Setting ใหม่" :close-on-backdrop="false">
      <template #body-wrapper>
        <div class="send-modal-inner" style="padding-left:36px;padding-right:36px;box-sizing:border-box;">
          <div class="form-group">
            <label>Key <span class="text-required">*</span></label>
            <input class="form-control" v-model="newSetting.key" placeholder="use_snake_case" />
          </div>
          <div class="form-group">
            <label>Value <span class="text-required">*</span></label>
            <input class="form-control" v-model="newSetting.value" />
          </div>
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
        <div class="d-flex justify-content-end w-100" style="padding: 0.875rem 1.5rem 1rem; gap: 10px; border-top: 1px solid #e4e7ea; background: #f8f9fa;">
          <CButton color="secondary" variant="outline" class="modal-btn modal-btn--secondary" @click="showAddSettingModal = false"><CIcon name="cil-chevron-right" class="mr-1" /> ยกเลิก</CButton>
          <CButton color="primary" class="modal-btn modal-btn--primary" @click="addSetting"><CIcon name="cil-plus" class="mr-1" /> + เพิ่ม</CButton>
        </div>
      </template>
    </CModal>
  </div>
</template>

<script>
import { instance as axios } from '@/service/api'
import AdminUsersManagement from '@/components/admin/AdminUsersManagement.vue'
import AdminFundingBudgetSettings from '@/ResearchFormRS/admin/AdminFundingBudgetSettings.vue'
import AdminRolePageAccessSettings from '@/ResearchFormRS/admin/AdminRolePageAccessSettings.vue'
import Swal from 'sweetalert2'
import {
  PROPOSAL_STATUS_LABELS_TH_ADMIN as STATUS_LABELS
} from '@/ResearchFormRS/constants/proposalWorkflow'

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
  committee_assigned: 'มอบหมายกรรมการ',
  collaboration_confirmation: 'ขอความยินยอมเข้าร่วมโครงการ (ผู้ร่วมโครงการ/ที่ปรึกษา)'
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
  },
  collaboration_confirmation: {
    subject: 'ขอความยินยอมเข้าร่วมโครงการวิจัย - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nขอเรียนเชิญท่านพิจารณาการเข้าร่วมโครงการ "{{projectTitle}}"\nรหัสโครงการ: {{proposalCode}}\nบทบาทในโครงการ: {{participantRole}}\n\nรายละเอียดเพิ่มเติม: {{remarks}}\n\nดูรายละเอียด: {{consentViewUrl}}\nยินยอมเข้าร่วมโครงการ: {{consentAcceptUrl}}\nไม่ยินยอมเข้าร่วมโครงการ: {{consentRejectUrl}}\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  }
}

// flat SVG icon paths — keyed by status
const STATUS_FLOW_ALLOWED_TRANSITIONS = Object.freeze({
  draft: ['pending_confirm'],
  pending_confirm: ['submitted'],
  submitted: ['faculty_review_pending'],
  faculty_review_pending: ['faculty_approved'],
  faculty_approved: ['office_received'],
  office_received: ['document_checking'],
  document_checking: ['assigned_to_committee'],
  assigned_to_committee: ['under_review'],
  under_review: ['meeting_completed'],
  meeting_completed: ['revision_requested', 'approved', 'rejected'],
  revision_requested: ['resubmitted'],
  resubmitted: ['second_round_review'],
  second_round_review: ['meeting_completed'],
  approved: ['announced'],
  rejected: ['announced']
})

const STATUS_ICONS = {
  draft:                  '<path d="M11 3l2 2-7 7H4v-2L11 3z"/>',
  pending_confirm:        '<circle cx="8" cy="8" r="6"/><path d="M8 5v3.5l2 1.5"/>',
  submitted:              '<path d="M8 2v8M5 7l3 3 3-3"/><rect x="2" y="11" width="12" height="2" rx="1"/>',
  faculty_review_pending: '<circle cx="8" cy="8" r="6"/><path d="M8 5v3.5l2 1.5"/>',
  faculty_approved:       '<path d="M3 8l4 4 6-6"/>',
  office_received:        '<path d="M8 14V6M5 9l3-3 3 3"/><rect x="2" y="3" width="12" height="2" rx="1"/>',
  document_checking:      '<circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/>',
  assigned_to_committee:  '<rect x="2" y="2" width="12" height="12" rx="1"/><path d="M5 6h6M5 9h4"/>',
  under_review:           '<circle cx="8" cy="8" r="6"/><path d="M8 5v3h3"/>',
  meeting_completed:      '<rect x="2" y="3" width="12" height="11" rx="1"/><path d="M5 3V1M11 3V1M2 7h12"/>',
  revision_requested:     '<path d="M11 3l2 2-7 7H4v-2L11 3z"/>',
  resubmitted:            '<path d="M2 10l4-4 4 4"/><path d="M6 6v6"/><path d="M10 6h3a1 1 0 010 4h-3"/>',
  second_round_review:    '<path d="M13 8A5 5 0 103 8"/><path d="M13 8l-2-2M13 8l2-2"/>',
  approved:               '<path d="M3 8l4 4 6-6"/>',
  rejected:               '<path d="M4 4l8 8M12 4l-8 8"/>',
  announced:              '<path d="M2 12c0 0 2-3 6-3s6 3 6 3"/><circle cx="8" cy="6" r="2.5"/><path d="M13 7l2 1-2 1"/>'
}

const SETTINGS_TAB_INDEX = {
  general: 0,
  funding_budget: 1,
  role_access: 2,
  workflow: 3,
  email: 4,
  users: 5
}

const SETTINGS_TAB_KEY_BY_INDEX = ['general', 'funding_budget', 'role_access', 'workflow', 'email', 'users']

export default {
  name: 'AdminSettings',
  components: { AdminUsersManagement, AdminFundingBudgetSettings, AdminRolePageAccessSettings },
  data () {
    return {
      activeTab: 0,
      settings: [],
      loadingSettings: false,
      apiConnected: false,

      // shared SVG attrs for status icons
      svgProps: {
        width: '14',
        height: '14',
        viewBox: '0 0 16 16',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.5',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        style: 'flex-shrink:0;vertical-align:middle;'
      },

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
        stepDeadlines: { step1: 7, step2: 5, step3: 14, step4: 7, step5: 7 }
      },
      workflowSaveStatus: 'idle',
      workflowSaveMessage: '',
      workflowDataSource: 'unknown',
      workflowFallbackSavedAt: '',

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
      manualAdminNotificationEmailEnabled: true,
      adminNotificationEmailEnabled: true,
      workflowOnlyEmailEnabled: false,
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
      emailWidgetFeedback: { type: '', message: '' },
      emailWidgetForm: { senderName: '', subject: '', recipientEmail: '', message: '', templateKey: '' },

      showAddSettingModal: false,
      newSetting: { key: '', value: '', group: 'general', description: '' },
      editingSettingId: null,
      editingSettingValue: '',
      editingSettingDescription: '',
      editingSettingIsSecret: false,

      allowedTransitions: STATUS_FLOW_ALLOWED_TRANSITIONS,
      workflowSteps: [
        { key: 'step1', title: '1. ยื่นโครงการ', description: 'รับโดยส่วนบริหาร' },
        { key: 'step2', title: '2. ตรวจสอบเอกสาร', description: 'มอบหมายกรรมการ' },
        { key: 'step3', title: '3. กรรมการพิจารณา', description: 'ประชุม' },
        { key: 'step4', title: '4. ขอแก้ไข', description: 'นักวิจัยส่งกลับ' },
        { key: 'step5', title: '5. ส่งแก้ไข', description: 'พิจารณารอบ n+1' }
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
    '$route.query.tab' () { this.applyTabFromRoute() },
    activeTab () { this.syncRouteTabQuery() }
  },
  methods: {
    // ─── Status flow helpers ───────────────────────────────────────────────
    getStatusLabel (status) {
      return STATUS_LABELS[status] || status
    },
    getStatusIcon (status) {
      return STATUS_ICONS[status] || ''
    },
    getStatusChipClass (status) {
      if (['approved', 'faculty_approved'].includes(status)) return 'status-chip--approve'
      if (['rejected'].includes(status)) return 'status-chip--reject'
      if (['revision_requested'].includes(status)) return 'status-chip--alt'
      return 'status-chip--to'
    },

    // ─── Tab routing ──────────────────────────────────────────────────────
    resolveTabKey (tabKey) {
      if (!tabKey) return ''
      const key = String(tabKey).trim().toLowerCase()
      const legacyMap = {
        admin: 'general',
        admins: 'general',
        system_admin: 'general',
        'system-admin': 'general',
        budget: 'funding_budget',
        budgets: 'funding_budget',
        funding: 'funding_budget',
        'funding-budget': 'funding_budget',
        access: 'role_access',
        permission: 'role_access',
        permissions: 'role_access',
        role: 'role_access',
        roles: 'role_access',
        role_access: 'role_access',
        'role-access': 'role_access'
      }
      return legacyMap[key] || key
    },
    getTabIndexFromQuery (tabKey) {
      const key = this.resolveTabKey(tabKey)
      if (!key) return null
      return Object.prototype.hasOwnProperty.call(SETTINGS_TAB_INDEX, key)
        ? SETTINGS_TAB_INDEX[key]
        : null
    },
    applyTabFromRoute () {
      const resolvedTabKey = this.resolveTabKey(this.$route.query.tab)
      const nextTab = this.getTabIndexFromQuery(this.$route.query.tab)
      if (nextTab === null) return
      if (this.activeTab !== nextTab) this.activeTab = nextTab
      const currentTab = String(this.$route.query.tab || '').trim().toLowerCase()
      if (resolvedTabKey && currentTab !== resolvedTabKey) {
        this.$router.replace({ path: this.$route.path, query: { ...this.$route.query, tab: resolvedTabKey } }).catch(() => {})
      }
    },
    syncRouteTabQuery () {
      const tabKey = SETTINGS_TAB_KEY_BY_INDEX[this.activeTab]
      if (!tabKey) return
      const currentTab = String(this.$route.query.tab || '').trim().toLowerCase()
      if (currentTab === tabKey) return
      this.$router.replace({ path: this.$route.path, query: { ...this.$route.query, tab: tabKey } }).catch(() => {})
    },

    // ─── Utility ─────────────────────────────────────────────────────────
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
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim().toLowerCase())
    },
    normalizeEmail (email) {
      return String(email || '').trim().toLowerCase()
    },
    isPlaceholderEmail (email) {
      const normalized = this.normalizeEmail(email)
      if (!normalized) return true
      if (['admin01@gmail.com', 'test@example.com'].includes(normalized)) return true
      const patterns = [/^admin0\d+@gmail\.com$/i, /^test[\w.+-]*@/i, /^fake[\w.+-]*@/i, /^dummy[\w.+-]*@/i, /^seed[\w.+-]*@/i, /@example\.(com|org|net)$/i]
      return patterns.some(p => p.test(normalized))
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
      if (username && !requirePassword && !password && !this.smtpPasswordConfigured) return 'กรุณากรอก SMTP Password'
      if (requirePassword && username && !password && !this.smtpPasswordConfigured) return 'กรุณากรอก SMTP Password สำหรับทดสอบการส่งอีเมล'
      return ''
    },
    getSmtpDebugSnapshot () {
      return { smtp_host: String(this.smtpForm.smtp_host || '').trim(), smtp_port: Number(this.smtpForm.smtp_port), smtp_username: String(this.smtpForm.smtp_username || '').trim(), smtp_from_email: String(this.smtpForm.smtp_from_email || '').trim() }
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
        smtp_use_ssl: raw.smtp_use_ssl !== undefined ? this.toBool(raw.smtp_use_ssl, base.smtp_use_ssl) : (raw.useSSL !== undefined ? this.toBool(raw.useSSL, base.smtp_use_ssl) : base.smtp_use_ssl)
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
      if (includePasswordIfProvided && !this.shouldKeepExistingSecret(password)) payload.smtp_password = password
      return payload
    },
    getSelectValue (val) { return val && val.target ? val.target.value : val },
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
      const value = setting && Object.prototype.hasOwnProperty.call(setting, 'value') ? setting.value : setting
      const key = setting && setting.key ? setting.key : ''
      const isSecret = Boolean(setting && setting.isSecret) || this.isSecretKey(key)
      if (isSecret) {
        const isConfigured = Boolean(setting && setting.isConfigured) || (value !== undefined && value !== null && String(value).trim() !== '')
        return isConfigured ? SECRET_MASK : '-'
      }
      if (typeof value === 'object') return JSON.stringify(value)
      return String(value)
    },
    parseFallbackMeta () {
      try {
        const raw = localStorage.getItem(LOCAL_FALLBACK_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw)
        return (parsed && parsed.__meta && typeof parsed.__meta === 'object') ? parsed.__meta : {}
      } catch (e) { return {} }
    },
    saveFallback (meta = {}) {
      const currentMeta = this.parseFallbackMeta()
      localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify({
        generalForm: this.generalForm,
        workflowForm: this.workflowForm,
        smtpForm: this.smtpForm,
        emailTemplates: this.emailTemplates,
        settings: this.settings,
        __meta: { ...currentMeta, ...meta }
      }))
    },
    clearWorkflowFallbackMeta () {
      try {
        const raw = localStorage.getItem(LOCAL_FALLBACK_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object') return
        if (!parsed.__meta || typeof parsed.__meta !== 'object') return
        delete parsed.__meta.workflow
        localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(parsed))
      } catch (e) { console.error('[AdminSettings] clearWorkflowFallbackMeta error:', e) }
    },
    loadFallback () {
      try {
        const raw = localStorage.getItem(LOCAL_FALLBACK_KEY)
        if (!raw) return false
        const parsed = JSON.parse(raw)
        if (parsed.generalForm) this.generalForm = { ...this.generalForm, ...parsed.generalForm }
        if (parsed.workflowForm) this.workflowForm = { ...this.workflowForm, ...parsed.workflowForm, stepDeadlines: { ...this.workflowForm.stepDeadlines, ...(parsed.workflowForm.stepDeadlines || {}) } }
        if (parsed.smtpForm) this.smtpForm = this.normalizeSmtpForm(parsed.smtpForm)
        if (parsed.emailTemplates) this.emailTemplates = { ...this.emailTemplates, ...parsed.emailTemplates }
        if (Array.isArray(parsed.settings)) this.settings = parsed.settings
        const workflowMeta = parsed && parsed.__meta && parsed.__meta.workflow
        if (workflowMeta && workflowMeta.status === 'local_fallback') {
          this.workflowDataSource = 'local_fallback'
          this.workflowFallbackSavedAt = workflowMeta.savedAt || ''
        }
        return true
      } catch (e) { console.error('[AdminSettings] loadFallback error:', e); return false }
    },

    // ─── API ──────────────────────────────────────────────────────────────
    async fetchSettings () {
      this.loadingSettings = true
      try {
        const response = await axios.get('/api/v1/setting')
        this.settings = this.parseSettingsPayload(response)
        this.apiConnected = true
        this.workflowDataSource = 'database'
        this.workflowFallbackSavedAt = ''
        this.applySettingsToForms()
      } catch (error) {
        console.error('[AdminSettings] Error fetching settings:', error)
        this.apiConnected = false
        const hasFallback = this.loadFallback()
        this.workflowDataSource = hasFallback ? 'local_fallback' : 'unknown'
      } finally { this.loadingSettings = false }
    },
    applySettingsToForms () {
      const map = {}
      this.settings.forEach(item => { if (item && item.key) map[item.key] = item.value })
      this.generalForm = { ...this.generalForm, systemName: this.toStr(map.system_name, this.generalForm.systemName), universityName: this.toStr(map.university_name, this.generalForm.universityName), fiscalYear: this.toNum(map.current_fiscal_year, this.generalForm.fiscalYear), submissionDeadline: this.toStr(map.submission_deadline, this.generalForm.submissionDeadline), maxProposalsPerResearcher: this.toNum(map.max_proposals_per_researcher, this.generalForm.maxProposalsPerResearcher), language: this.toStr(map.default_language, this.generalForm.language), timezone: this.toStr(map.timezone, this.generalForm.timezone), dateFormat: this.toStr(map.date_format, this.generalForm.dateFormat), itemsPerPage: this.toNum(map.items_per_page, this.generalForm.itemsPerPage) }
      this.workflowForm = { ...this.workflowForm, minScore: this.toNum(map.workflow_min_score, this.workflowForm.minScore), minCommittee: this.toNum(map.workflow_min_committee, this.workflowForm.minCommittee), maxRounds: this.toNum(map.workflow_max_rounds, this.workflowForm.maxRounds), allowRevisionAfterMeeting: map.workflow_allow_revision_after_meeting !== undefined ? this.toBool(map.workflow_allow_revision_after_meeting, this.workflowForm.allowRevisionAfterMeeting) : this.workflowForm.allowRevisionAfterMeeting, stepDeadlines: { step1: this.toNum(map.workflow_step1_days, this.workflowForm.stepDeadlines.step1), step2: this.toNum(map.workflow_step2_days, this.workflowForm.stepDeadlines.step2), step3: this.toNum(map.workflow_step3_days, this.workflowForm.stepDeadlines.step3), step4: this.toNum(map.workflow_step4_days, this.workflowForm.stepDeadlines.step4), step5: this.toNum(map.workflow_step5_days, this.workflowForm.stepDeadlines.step5) } }
      this.smtpForm = this.normalizeSmtpForm({ smtp_host: map.smtp_host, smtp_port: map.smtp_port, smtp_username: map.smtp_username, smtp_password: '', smtp_from_name: map.smtp_from_name, smtp_from_email: map.smtp_from_email, smtp_use_ssl: map.smtp_use_ssl })
      if (map.email_notifications_enabled !== undefined) this.emailNotificationsEnabled = this.toBool(map.email_notifications_enabled, true)
      this.manualAdminNotificationEmailEnabled = map.manual_admin_notification_email_enabled !== undefined
        ? this.toBool(map.manual_admin_notification_email_enabled, true)
        : true
      this.adminNotificationEmailEnabled = map.admin_notification_email_enabled !== undefined
        ? this.toBool(map.admin_notification_email_enabled, true)
        : this.manualAdminNotificationEmailEnabled
      this.workflowOnlyEmailEnabled = map.workflow_only_email_enabled !== undefined
        ? this.toBool(map.workflow_only_email_enabled, false)
        : false
      const smtpPasswordSetting = this.settings.find(s => s && s.key === 'smtp_password')
      this.smtpPasswordConfigured = Boolean(smtpPasswordSetting && (smtpPasswordSetting.isConfigured || (smtpPasswordSetting.value !== undefined && smtpPasswordSetting.value !== null && String(smtpPasswordSetting.value).trim() !== '')))
      if (map.email_templates_json) {
        try {
          const parsed = typeof map.email_templates_json === 'string' ? JSON.parse(map.email_templates_json) : map.email_templates_json
          this.emailTemplates = { ...this.emailTemplates, ...parsed }
        } catch (e) { console.error('[AdminSettings] parse templates error:', e) }
      }
    },
    async upsertSettingByKey (key, value, description, group) {
      const existed = this.settings.find(s => s.key === key)
      if (existed && existed._id) return axios.put(`/api/v1/setting/${existed._id}`, { value, description })
      return axios.post('/api/v1/setting', { key, value, description, group })
    },
    buildWorkflowSettingsPayload () {
      const d = this.workflowForm.stepDeadlines
      return {
        group: 'workflow',
        settings: [
          { key: 'workflow_min_score', value: this.workflowForm.minScore, valueType: 'number', label: 'คะแนนขั้นต่ำ' },
          { key: 'workflow_min_committee', value: this.workflowForm.minCommittee, valueType: 'number', label: 'จำนวนกรรมการขั้นต่ำ' },
          { key: 'workflow_max_rounds', value: this.workflowForm.maxRounds, valueType: 'number', label: 'รอบพิจารณาสูงสุด' },
          { key: 'workflow_allow_revision_after_meeting', value: this.workflowForm.allowRevisionAfterMeeting, valueType: 'boolean', label: 'เปิดให้แก้ไขหลังประชุม' },
          { key: 'workflow_step1_days', value: d.step1, valueType: 'number', label: 'ยื่นโครงการ -> รับโดยส่วนบริหาร' },
          { key: 'workflow_step2_days', value: d.step2, valueType: 'number', label: 'ตรวจสอบเอกสาร -> มอบหมายกรรมการ' },
          { key: 'workflow_step3_days', value: d.step3, valueType: 'number', label: 'กรรมการพิจารณา -> ประชุม' },
          { key: 'workflow_step4_days', value: d.step4, valueType: 'number', label: 'ขอแก้ไข -> นักวิจัยส่งกลับ' },
          { key: 'workflow_step5_days', value: d.step5, valueType: 'number', label: 'ส่งแก้ไข -> พิจารณารอบ n+1' }
        ]
      }
    },
    buildEmailPolicySettingsPayload () {
      return {
        group: 'email',
        settings: [
          { key: 'email_notifications_enabled', value: Boolean(this.emailNotificationsEnabled), valueType: 'boolean', label: 'เปิดใช้งานอีเมลสำหรับ workflow อัตโนมัติ' },
          { key: 'manual_admin_notification_email_enabled', value: Boolean(this.manualAdminNotificationEmailEnabled), valueType: 'boolean', label: 'เปิดใช้งานอีเมลจากการส่งแจ้งเตือน manual โดย admin' },
          { key: 'admin_notification_email_enabled', value: Boolean(this.adminNotificationEmailEnabled), valueType: 'boolean', label: 'fallback toggle สำหรับระบบเดิม (admin notification email)' },
          { key: 'workflow_only_email_enabled', value: Boolean(this.workflowOnlyEmailEnabled), valueType: 'boolean', label: 'ส่งอีเมลเฉพาะ workflow อัตโนมัติ (ปิด manual admin email)' }
        ]
      }
    },
    async saveEmailPolicySettings () {
      try {
        const payload = this.buildEmailPolicySettingsPayload()
        const response = await axios.put('/api/v1/setting/bulk', payload)
        const result = response && response.data && response.data.data ? response.data.data : {}
        const failedKeys = Array.isArray(result.failedKeys) ? result.failedKeys : []
        if (!response || !response.data || response.data.success !== true || failedKeys.length > 0) {
          throw new Error('bulk email policy save returned failed keys')
        }
        await this.fetchSettings()
        await Swal.fire({ icon: 'success', title: 'บันทึกนโยบายการส่งอีเมลสำเร็จ', timer: 1400, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminSettings] saveEmailPolicySettings fallback:', error)
        this.saveFallback({
          emailPolicy: {
            status: 'local_fallback',
            savedAt: new Date().toISOString(),
            reason: (error && error.message) ? error.message : 'unknown_error'
          }
        })
        await Swal.fire({ icon: 'warning', title: 'บันทึกเฉพาะในเครื่องชั่วคราว', text: 'ไม่สามารถบันทึกนโยบายการส่งอีเมลลงฐานข้อมูลได้' })
      }
    },
    async saveGeneralSettings () {
      try {
        await Promise.all([
          this.upsertSettingByKey('system_name', this.generalForm.systemName, 'ชื่อระบบ', 'general'),
          this.upsertSettingByKey('university_name', this.generalForm.universityName, 'ชื่อมหาวิทยาลัย', 'general'),
          this.upsertSettingByKey('current_fiscal_year', this.generalForm.fiscalYear, 'ปีงบประมาณปัจจุบัน', 'general'),
          this.upsertSettingByKey('submission_deadline', this.generalForm.submissionDeadline, 'วันสิ้นสุดรับโครงการ', 'general'),
          this.upsertSettingByKey('max_proposals_per_researcher', this.generalForm.maxProposalsPerResearcher, 'จำนวนโครงการสูงสุดต่อนักวิจัย', 'general'),
          this.upsertSettingByKey('default_language', this.generalForm.language, 'ภาษาเริ่มต้น', 'general'),
          this.upsertSettingByKey('timezone', this.generalForm.timezone, 'เขตเวลา', 'general'),
          this.upsertSettingByKey('date_format', this.generalForm.dateFormat, 'รูปแบบวันที่', 'general'),
          this.upsertSettingByKey('items_per_page', this.generalForm.itemsPerPage, 'จำนวนรายการต่อหน้า', 'general')
        ])
        await this.fetchSettings()
        await Swal.fire({ icon: 'success', title: 'บันทึกการตั้งค่าทั่วไปสำเร็จ', timer: 1400, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminSettings] saveGeneralSettings fallback:', error)
        this.saveFallback()
        await Swal.fire({ icon: 'info', title: 'บันทึกในเครื่องแล้ว', text: 'API ยังไม่พร้อม จึงบันทึกแบบ local fallback' })
      }
    },
    async saveWorkflowSettings () {
      this.workflowSaveStatus = 'idle'
      this.workflowSaveMessage = ''
      try {
        const payload = this.buildWorkflowSettingsPayload()
        const response = await axios.put('/api/v1/setting/bulk', payload)
        const result = response && response.data && response.data.data ? response.data.data : {}
        const failedKeys = Array.isArray(result.failedKeys) ? result.failedKeys : []
        if (!response || !response.data || response.data.success !== true || failedKeys.length > 0) throw new Error('bulk workflow save returned failed keys')
        await this.fetchSettings()
        this.clearWorkflowFallbackMeta()
        this.workflowDataSource = 'database'
        this.workflowSaveStatus = 'db_saved'
        this.workflowSaveMessage = 'บันทึก Workflow Settings ลงฐานข้อมูลสำเร็จ'
        await Swal.fire({ icon: 'success', title: 'บันทึก Workflow Settings ลงฐานข้อมูลสำเร็จ', timer: 1400, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminSettings] saveWorkflowSettings fallback:', error)
        const savedAt = new Date().toISOString()
        try {
          this.saveFallback({ workflow: { status: 'local_fallback', savedAt, reason: (error && error.message) ? error.message : 'unknown_error' } })
          this.workflowDataSource = 'local_fallback'
          this.workflowFallbackSavedAt = savedAt
          this.workflowSaveStatus = 'local_fallback'
          this.workflowSaveMessage = 'ไม่สามารถบันทึกลงฐานข้อมูลได้ ข้อมูลถูกเก็บไว้เฉพาะในเครื่องชั่วคราว'
          await Swal.fire({ icon: 'warning', title: 'บันทึกเฉพาะในเครื่องชั่วคราว', text: 'ไม่สามารถบันทึกลงฐานข้อมูลได้ ข้อมูลถูกเก็บไว้เฉพาะในเครื่องชั่วคราว' })
        } catch (fallbackError) {
          console.error('[AdminSettings] workflow fallback save failed:', fallbackError)
          this.workflowSaveStatus = 'failed'
          this.workflowSaveMessage = 'ไม่สามารถบันทึกข้อมูลได้ ทั้งฐานข้อมูลและ local fallback'
          await Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: 'ไม่สามารถบันทึกได้ทั้งฐานข้อมูลและเครื่องนี้ กรุณาลองใหม่' })
        }
      }
    },
    async saveTemplate (type) {
      const subject = String(this.emailTemplates[type] && this.emailTemplates[type].subject ? this.emailTemplates[type].subject : '').trim()
      if (!subject) { await Swal.fire({ icon: 'warning', title: 'หัวเรื่องว่าง', text: `กรุณากรอกหัวเรื่องสำหรับ template ${type}` }); return }
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
    resetTemplate (type) { this.$set(this.emailTemplates, type, JSON.parse(JSON.stringify(DEFAULT_TEMPLATES[type]))) },
    getCurrentUserEmail () {
      const fromStore = this.$store && this.$store.getters ? this.$store.getters['Authentication/currentUser'] : null
      if (fromStore && fromStore.email) return String(fromStore.email).trim()
      try { const raw = localStorage.getItem('auth_user'); if (!raw) return ''; const parsed = JSON.parse(raw); return parsed && parsed.email ? String(parsed.email).trim() : '' } catch (e) { return '' }
    },
    getPreferredTestRecipientEmail () {
      const fromInput = String(this.testRecipientEmail || '').trim()
      if (fromInput) return fromInput
      const currentUserEmail = this.getCurrentUserEmail()
      if (this.isPlaceholderEmail(currentUserEmail)) return ''
      return currentUserEmail
    },
    async addSetting () {
      const key = (this.newSetting.key || '').trim()
      const value = this.newSetting.value
      if (!key || value === undefined || value === null || value === '') { await Swal.fire({ icon: 'warning', title: 'กรอกข้อมูลไม่ครบ', text: 'ต้องกรอก key และ value' }); return }
      if (/\s/.test(key)) { await Swal.fire({ icon: 'warning', title: 'Key ไม่ถูกต้อง', text: 'Key ต้องไม่มีช่องว่าง และควรเป็น snake_case' }); return }
      try {
        await axios.post('/api/v1/setting', { key, value, description: this.newSetting.description, group: this.newSetting.group })
        this.showAddSettingModal = false
        this.newSetting = { key: '', value: '', group: 'general', description: '' }
        await this.fetchSettings()
        await Swal.fire({ icon: 'success', title: 'เพิ่ม Setting สำเร็จ', timer: 1200, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminSettings] addSetting fallback:', error)
        this.settings.push({ _id: `local-${Date.now()}`, key, value: this.newSetting.value, description: this.newSetting.description, group: this.newSetting.group })
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
    cancelEditSetting () { this.editingSettingId = null; this.editingSettingValue = ''; this.editingSettingDescription = ''; this.editingSettingIsSecret = false },
    async editSetting (s) {
      try {
        if (s._id && String(s._id).startsWith('local-')) throw new Error('local fallback row')
        const payload = { description: this.editingSettingDescription }
        if (!this.editingSettingIsSecret || String(this.editingSettingValue || '').trim() !== '') payload.value = this.editingSettingValue
        await axios.put(`/api/v1/setting/${s._id}`, payload)
        this.cancelEditSetting()
        await this.fetchSettings()
        await Swal.fire({ icon: 'success', title: 'แก้ไขสำเร็จ', timer: 1200, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminSettings] editSetting fallback:', error)
        const idx = this.settings.findIndex(x => (x._id || x.key) === (s._id || s.key))
        if (idx >= 0) {
          const nextValue = (this.editingSettingIsSecret && String(this.editingSettingValue || '').trim() === '') ? this.settings[idx].value : this.editingSettingValue
          this.$set(this.settings, idx, { ...this.settings[idx], value: nextValue, description: this.editingSettingDescription })
          this.saveFallback()
        }
        this.cancelEditSetting()
        await Swal.fire({ icon: 'info', title: 'แก้ไขในเครื่องแล้ว', text: 'API ยังไม่พร้อม จึงบันทึกแบบ local fallback' })
      }
    },
    async deleteSetting (s) {
      const result = await Swal.fire({ icon: 'warning', title: `ยืนยันการลบ setting ${s.key}?`, showCancelButton: true, confirmButtonText: 'ยืนยันการลบ', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#e55353' })
      if (!result.isConfirmed) return
      try {
        if (s._id && String(s._id).startsWith('local-')) throw new Error('local fallback row')
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
      const result = await Swal.fire({ icon: 'warning', title: 'ยืนยันการล้างข้อมูล Cache?', showCancelButton: true, confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก' })
      if (!result.isConfirmed) return
      try { await axios.post('/api/v1/setting/clear-cache', {}); await Swal.fire({ icon: 'success', title: 'ล้าง Cache สำเร็จ' }) } catch (error) { await Swal.fire({ icon: 'info', title: 'กำลังพัฒนา', text: 'ฟีเจอร์ล้าง Cache อยู่ระหว่างพัฒนา' }) }
    },
    exportSettings () {
      const blob = new Blob([JSON.stringify(this.settings, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'settings-export.json'; a.click()
      window.URL.revokeObjectURL(url)
    },
    formatLogDate (dateStr) {
      if (!dateStr) return '-'
      try { return new Date(dateStr).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch (e) { return String(dateStr) }
    },
    onEmailLogFilterChange (val) {
      this.emailLogFilter = val && val.target ? val.target.value : val
      this.emailLogPage = 1; this.emailLogs = []; this.fetchEmailLogs()
    },
    async fetchEmailLogs () {
      this.emailLogLoading = true; this.emailLogPage = 1
      try {
        const params = { limit: 50, page: 1 }
        if (this.emailLogFilter) params.status = this.emailLogFilter
        const response = await axios.get('/api/v1/setting/email-logs', { params })
        const data = response && response.data && response.data.data
        this.emailLogs = (data && Array.isArray(data.logs)) ? data.logs : []
        this.emailLogTotal = (data && data.total) ? Number(data.total) : 0
      } catch (e) { console.error('[AdminSettings] fetchEmailLogs error:', e); this.emailLogs = []; this.emailLogTotal = 0 } finally { this.emailLogLoading = false }
    },
    async loadMoreEmailLogs () {
      this.emailLogLoading = true; this.emailLogPage += 1
      try {
        const params = { limit: 50, page: this.emailLogPage }
        if (this.emailLogFilter) params.status = this.emailLogFilter
        const response = await axios.get('/api/v1/setting/email-logs', { params })
        const data = response && response.data && response.data.data
        this.emailLogs = [...this.emailLogs, ...((data && Array.isArray(data.logs)) ? data.logs : [])]
        this.emailLogTotal = (data && data.total) ? Number(data.total) : this.emailLogTotal
      } catch (e) { console.error('[AdminSettings] loadMoreEmailLogs error:', e); this.emailLogPage -= 1 } finally { this.emailLogLoading = false }
    },
    getTemplateLabel (key) { return EMAIL_TEMPLATE_LABELS[key] || key },
    onEmailWidgetKeydown (event) { if (!this.isEmailWidgetOpen) return; if (event && event.key === 'Escape') this.closeEmailWidget() },
    toggleEmailWidget () {
      if (this.isEmailWidgetOpen) { this.closeEmailWidget(); return }
      this.emailWidgetFeedback = { type: '', message: '' }
      this.emailWidgetForm = { ...this.emailWidgetForm, senderName: this.emailWidgetForm.senderName || 'ผู้ดูแลระบบ', recipientEmail: this.emailWidgetForm.recipientEmail || this.getPreferredTestRecipientEmail(), templateKey: this.emailWidgetForm.templateKey || this.testTemplateKey || '' }
      this.isEmailWidgetOpen = true
    },
    closeEmailWidget () { this.isEmailWidgetOpen = false },
    onWidgetTemplateChange (val) {
      const key = val && val.target ? val.target.value : val
      this.emailWidgetForm.templateKey = key
      if (!key || !this.emailTemplates[key]) return
      const template = this.emailTemplates[key]
      if (!String(this.emailWidgetForm.subject || '').trim()) this.emailWidgetForm.subject = String(template.subject || '').trim()
      if (!String(this.emailWidgetForm.message || '').trim()) this.emailWidgetForm.message = String(template.body || '').trim()
    },
    validateWidgetEmailForm () {
      if (!String(this.emailWidgetForm.senderName || '').trim()) return 'กรุณากรอกชื่อผู้ส่ง'
      if (!String(this.emailWidgetForm.subject || '').trim()) return 'กรุณากรอกหัวข้ออีเมล'
      if (!String(this.emailWidgetForm.message || '').trim()) return 'กรุณากรอกข้อความอีเมล'
      const recipientEmail = String(this.emailWidgetForm.recipientEmail || '').trim()
      if (!recipientEmail) return 'กรุณากรอกอีเมลผู้รับ'
      if (!this.isValidEmail(recipientEmail)) return 'รูปแบบอีเมลผู้รับไม่ถูกต้อง'
      if (this.isPlaceholderEmail(recipientEmail)) return 'อีเมลผู้รับดูเหมือนเป็นข้อมูลทดสอบ กรุณาใช้อีเมลผู้ใช้จริงในระบบ'
      return this.validateSMTPConfig({ requirePassword: true })
    },
    async sendEmailFromWidget () {
      this.emailWidgetFeedback = { type: '', message: '' }
      const validationError = this.validateWidgetEmailForm()
      if (validationError) { this.emailWidgetFeedback = { type: 'error', message: validationError }; return }
      this.emailWidgetSending = true
      try {
        await axios.post('/api/v1/setting/test-email', { recipientEmail: this.normalizeEmail(this.emailWidgetForm.recipientEmail), smtp: this.buildSmtpPayloadForApi({ includePasswordIfProvided: true }), templateKey: this.emailWidgetForm.templateKey || '', senderName: String(this.emailWidgetForm.senderName || '').trim(), subject: String(this.emailWidgetForm.subject || '').trim(), message: String(this.emailWidgetForm.message || '').trim() })
        this.emailWidgetFeedback = { type: 'success', message: `ส่งอีเมลเรียบร้อยไปยัง ${this.normalizeEmail(this.emailWidgetForm.recipientEmail)}` }
      } catch (error) {
        this.emailWidgetFeedback = { type: 'error', message: (error && error.response && error.response.data && error.response.data.message) || 'ส่งอีเมลไม่สำเร็จ กรุณาตรวจสอบ SMTP แล้วลองใหม่' }
      } finally { this.emailWidgetSending = false }
    }
  }
}
</script>

<style scoped>
.admin-settings-page {
  width: 100%;
}

[data-coreui-theme='dark'] .admin-settings-page,
body.c-dark-theme .admin-settings-page {
  color: #e6edf6;
}

/* ── Theme (match committee) ───────────────────────────────────────────── */
.settings-hero {
  border: 0;
  border-radius: 16px;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.28), transparent 30%),
    linear-gradient(135deg, #8b1212 0%, #c59b3a 115%);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.14);
  color: #ffffff;
}

.settings-hero__body {
  padding: 22px 24px;
  background: transparent;
}

.settings-hero__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.settings-hero__pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.08em;
  background: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.92);
  width: fit-content;
  margin-bottom: 8px;
}

.settings-hero__title {
  color: #ffffff;
  margin: 0 0 4px 0;
  font-weight: 900;
  letter-spacing: -0.01em;
}

.settings-hero__subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.88);
  font-weight: 500;
}

.settings-tabs /deep/ .nav-link,
.settings-tabs >>> .nav-link,
.settings-tabs::v-deep .nav-link {
  color: #6b0f0f;
  font-weight: 700;
}

.settings-tabs /deep/ .nav-link.active,
.settings-tabs >>> .nav-link.active,
.settings-tabs::v-deep .nav-link.active {
  color: #8c1515;
}

.settings-tabs /deep/ .nav-underline .nav-link.active::after,
.settings-tabs >>> .nav-underline .nav-link.active::after,
.settings-tabs::v-deep .nav-underline .nav-link.active::after {
  background-color: #8c1515;
}

.admin-settings-page /deep/ .card,
.admin-settings-page >>> .card,
.admin-settings-page::v-deep .card {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(140, 21, 21, 0.14);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
}

.admin-settings-page /deep/ .settings-hero .card-body,
.admin-settings-page >>> .settings-hero .card-body,
.admin-settings-page::v-deep .settings-hero .card-body {
  background: transparent !important;
}

.admin-settings-page /deep/ .card-header,
.admin-settings-page >>> .card-header,
.admin-settings-page::v-deep .card-header {
  background: linear-gradient(90deg, rgba(140, 21, 21, 0.1), rgba(254, 194, 96, 0.22));
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  color: #6b0f0f;
  font-weight: 900;
}

.admin-settings-page /deep/ .card-body,
.admin-settings-page >>> .card-body,
.admin-settings-page::v-deep .card-body {
  background: #f7f1ea;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .card,
[data-coreui-theme='dark'] .admin-settings-page >>> .card,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .card,
body.c-dark-theme .admin-settings-page /deep/ .card,
body.c-dark-theme .admin-settings-page >>> .card,
body.c-dark-theme .admin-settings-page::v-deep .card {
  border-color: rgba(120, 142, 170, 0.35);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.32);
  background: #1f2a38;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .card-header,
[data-coreui-theme='dark'] .admin-settings-page >>> .card-header,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .card-header,
body.c-dark-theme .admin-settings-page /deep/ .card-header,
body.c-dark-theme .admin-settings-page >>> .card-header,
body.c-dark-theme .admin-settings-page::v-deep .card-header {
  background: linear-gradient(90deg, rgba(25, 37, 52, 0.96), rgba(34, 49, 67, 0.96));
  border-bottom-color: rgba(120, 142, 170, 0.35);
  color: #f2f7ff;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .card-body,
[data-coreui-theme='dark'] .admin-settings-page >>> .card-body,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .card-body,
[data-coreui-theme='dark'] .admin-settings-page /deep/ .card-footer,
[data-coreui-theme='dark'] .admin-settings-page >>> .card-footer,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .card-footer,
body.c-dark-theme .admin-settings-page /deep/ .card-body,
body.c-dark-theme .admin-settings-page >>> .card-body,
body.c-dark-theme .admin-settings-page::v-deep .card-body,
body.c-dark-theme .admin-settings-page /deep/ .card-footer,
body.c-dark-theme .admin-settings-page >>> .card-footer,
body.c-dark-theme .admin-settings-page::v-deep .card-footer {
  background: #243244;
  color: #e6edf6;
}

.admin-settings-page /deep/ .form-control,
.admin-settings-page >>> .form-control,
.admin-settings-page::v-deep .form-control,
.admin-settings-page /deep/ .custom-select,
.admin-settings-page >>> .custom-select,
.admin-settings-page::v-deep .custom-select {
  border-radius: 10px;
  border-color: rgba(181, 133, 34, 0.35);
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .form-control,
[data-coreui-theme='dark'] .admin-settings-page >>> .form-control,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .form-control,
[data-coreui-theme='dark'] .admin-settings-page /deep/ .custom-select,
[data-coreui-theme='dark'] .admin-settings-page >>> .custom-select,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .custom-select,
body.c-dark-theme .admin-settings-page /deep/ .form-control,
body.c-dark-theme .admin-settings-page >>> .form-control,
body.c-dark-theme .admin-settings-page::v-deep .form-control,
body.c-dark-theme .admin-settings-page /deep/ .custom-select,
body.c-dark-theme .admin-settings-page >>> .custom-select,
body.c-dark-theme .admin-settings-page::v-deep .custom-select {
  background: #1b2735;
  border-color: #48617d;
  color: #edf3fb;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .form-control::placeholder,
[data-coreui-theme='dark'] .admin-settings-page >>> .form-control::placeholder,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .form-control::placeholder,
body.c-dark-theme .admin-settings-page /deep/ .form-control::placeholder,
body.c-dark-theme .admin-settings-page >>> .form-control::placeholder,
body.c-dark-theme .admin-settings-page::v-deep .form-control::placeholder {
  color: #a7bbcf;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .custom-select option,
[data-coreui-theme='dark'] .admin-settings-page >>> .custom-select option,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .custom-select option,
body.c-dark-theme .admin-settings-page /deep/ .custom-select option,
body.c-dark-theme .admin-settings-page >>> .custom-select option,
body.c-dark-theme .admin-settings-page::v-deep .custom-select option {
  background: #182230;
  color: #edf3fb;
}

.admin-settings-page /deep/ .form-control:focus,
.admin-settings-page >>> .form-control:focus,
.admin-settings-page::v-deep .form-control:focus,
.admin-settings-page /deep/ .custom-select:focus,
.admin-settings-page >>> .custom-select:focus,
.admin-settings-page::v-deep .custom-select:focus {
  border-color: rgba(181, 133, 34, 0.7);
  box-shadow: 0 0 0 3px rgba(181, 133, 34, 0.16);
}

.admin-settings-page /deep/ .btn-primary,
.admin-settings-page >>> .btn-primary,
.admin-settings-page::v-deep .btn-primary {
  background: #8c1515;
  border-color: #8c1515;
}

.admin-settings-page /deep/ .btn-primary:hover,
.admin-settings-page >>> .btn-primary:hover,
.admin-settings-page::v-deep .btn-primary:hover {
  filter: brightness(1.02);
}

.admin-settings-page /deep/ .btn-outline-primary,
.admin-settings-page >>> .btn-outline-primary,
.admin-settings-page::v-deep .btn-outline-primary {
  color: #8c1515;
  border-color: #8c1515;
}

.admin-settings-page /deep/ .btn-outline-primary:hover,
.admin-settings-page >>> .btn-outline-primary:hover,
.admin-settings-page::v-deep .btn-outline-primary:hover {
  color: #ffffff;
  background: #8c1515;
  border-color: #8c1515;
}

.admin-settings-page /deep/ .table-responsive,
.admin-settings-page >>> .table-responsive,
.admin-settings-page::v-deep .table-responsive {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(140, 21, 21, 0.14);
  overflow: hidden;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .table-responsive,
[data-coreui-theme='dark'] .admin-settings-page >>> .table-responsive,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .table-responsive,
body.c-dark-theme .admin-settings-page /deep/ .table-responsive,
body.c-dark-theme .admin-settings-page >>> .table-responsive,
body.c-dark-theme .admin-settings-page::v-deep .table-responsive {
  background: #1b2735;
  border-color: #415974;
}

.admin-settings-page /deep/ .table,
.admin-settings-page >>> .table,
.admin-settings-page::v-deep .table {
  margin-bottom: 0;
}

.admin-settings-page /deep/ .table thead th,
.admin-settings-page >>> .table thead th,
.admin-settings-page::v-deep .table thead th {
  background: linear-gradient(90deg, #8c1515, rgba(107, 15, 15, 0.98)) !important;
  color: #ffffff !important;
  font-weight: 800 !important;
  text-align: center !important;
  border-bottom: 0 !important;
  border-right: 1px solid rgba(254, 194, 96, 0.5) !important;
}

.admin-settings-page /deep/ .table thead th:last-child,
.admin-settings-page >>> .table thead th:last-child,
.admin-settings-page::v-deep .table thead th:last-child {
  border-right: 0 !important;
}

.admin-settings-page /deep/ .table tbody td,
.admin-settings-page >>> .table tbody td,
.admin-settings-page::v-deep .table tbody td {
  border-bottom: 1px solid rgba(140, 21, 21, 0.12) !important;
  border-right: 1px solid rgba(140, 21, 21, 0.12) !important;
  vertical-align: middle !important;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .table,
[data-coreui-theme='dark'] .admin-settings-page >>> .table,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .table,
body.c-dark-theme .admin-settings-page /deep/ .table,
body.c-dark-theme .admin-settings-page >>> .table,
body.c-dark-theme .admin-settings-page::v-deep .table {
  color: #edf3fb;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .table thead th,
[data-coreui-theme='dark'] .admin-settings-page >>> .table thead th,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .table thead th,
body.c-dark-theme .admin-settings-page /deep/ .table thead th,
body.c-dark-theme .admin-settings-page >>> .table thead th,
body.c-dark-theme .admin-settings-page::v-deep .table thead th {
  background: linear-gradient(90deg, #162333, #22344a) !important;
  border-right-color: rgba(152, 176, 206, 0.35) !important;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .table tbody td,
[data-coreui-theme='dark'] .admin-settings-page >>> .table tbody td,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .table tbody td,
body.c-dark-theme .admin-settings-page /deep/ .table tbody td,
body.c-dark-theme .admin-settings-page >>> .table tbody td,
body.c-dark-theme .admin-settings-page::v-deep .table tbody td {
  background: #1d2a39 !important;
  border-bottom-color: rgba(135, 160, 188, 0.26) !important;
  border-right-color: rgba(135, 160, 188, 0.26) !important;
  color: #edf3fb !important;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .table-striped tbody tr:nth-of-type(odd),
[data-coreui-theme='dark'] .admin-settings-page >>> .table-striped tbody tr:nth-of-type(odd),
[data-coreui-theme='dark'] .admin-settings-page::v-deep .table-striped tbody tr:nth-of-type(odd),
body.c-dark-theme .admin-settings-page /deep/ .table-striped tbody tr:nth-of-type(odd),
body.c-dark-theme .admin-settings-page >>> .table-striped tbody tr:nth-of-type(odd),
body.c-dark-theme .admin-settings-page::v-deep .table-striped tbody tr:nth-of-type(odd) {
  background-color: #1a2634 !important;
}

.admin-settings-page /deep/ .table tbody td:last-child,
.admin-settings-page >>> .table tbody td:last-child,
.admin-settings-page::v-deep .table tbody td:last-child {
  border-right: 0 !important;
}

.admin-settings-page /deep/ .table tbody tr:hover,
.admin-settings-page >>> .table tbody tr:hover,
.admin-settings-page::v-deep .table tbody tr:hover {
  background: rgba(254, 194, 96, 0.22) !important;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .table tbody tr:hover,
[data-coreui-theme='dark'] .admin-settings-page >>> .table tbody tr:hover,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .table tbody tr:hover,
body.c-dark-theme .admin-settings-page /deep/ .table tbody tr:hover,
body.c-dark-theme .admin-settings-page >>> .table tbody tr:hover,
body.c-dark-theme .admin-settings-page::v-deep .table tbody tr:hover {
  background: rgba(90, 117, 146, 0.32) !important;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .text-muted,
[data-coreui-theme='dark'] .admin-settings-page >>> .text-muted,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .text-muted,
body.c-dark-theme .admin-settings-page /deep/ .text-muted,
body.c-dark-theme .admin-settings-page >>> .text-muted,
body.c-dark-theme .admin-settings-page::v-deep .text-muted {
  color: #a7bbcf !important;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .text-danger,
[data-coreui-theme='dark'] .admin-settings-page >>> .text-danger,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .text-danger,
body.c-dark-theme .admin-settings-page /deep/ .text-danger,
body.c-dark-theme .admin-settings-page >>> .text-danger,
body.c-dark-theme .admin-settings-page::v-deep .text-danger {
  color: #ff8e8e !important;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .alert,
[data-coreui-theme='dark'] .admin-settings-page >>> .alert,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .alert,
[data-coreui-theme='dark'] .admin-settings-page /deep/ .callout,
[data-coreui-theme='dark'] .admin-settings-page >>> .callout,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .callout,
body.c-dark-theme .admin-settings-page /deep/ .alert,
body.c-dark-theme .admin-settings-page >>> .alert,
body.c-dark-theme .admin-settings-page::v-deep .alert,
body.c-dark-theme .admin-settings-page /deep/ .callout,
body.c-dark-theme .admin-settings-page >>> .callout,
body.c-dark-theme .admin-settings-page::v-deep .callout {
  border-color: rgba(131, 156, 185, 0.45);
  color: #e7eff8;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .badge,
[data-coreui-theme='dark'] .admin-settings-page >>> .badge,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .badge,
body.c-dark-theme .admin-settings-page /deep/ .badge,
body.c-dark-theme .admin-settings-page >>> .badge,
body.c-dark-theme .admin-settings-page::v-deep .badge {
  color: #f7fbff;
}

[data-coreui-theme='dark'] .settings-tabs /deep/ .nav,
[data-coreui-theme='dark'] .settings-tabs >>> .nav,
[data-coreui-theme='dark'] .settings-tabs::v-deep .nav,
body.c-dark-theme .settings-tabs /deep/ .nav,
body.c-dark-theme .settings-tabs >>> .nav,
body.c-dark-theme .settings-tabs::v-deep .nav {
  border-bottom-color: rgba(130, 155, 184, 0.3);
}

[data-coreui-theme='dark'] .settings-tabs /deep/ .nav-link,
[data-coreui-theme='dark'] .settings-tabs >>> .nav-link,
[data-coreui-theme='dark'] .settings-tabs::v-deep .nav-link,
body.c-dark-theme .settings-tabs /deep/ .nav-link,
body.c-dark-theme .settings-tabs >>> .nav-link,
body.c-dark-theme .settings-tabs::v-deep .nav-link {
  color: #afc3d8;
}

[data-coreui-theme='dark'] .settings-tabs /deep/ .nav-link.active,
[data-coreui-theme='dark'] .settings-tabs >>> .nav-link.active,
[data-coreui-theme='dark'] .settings-tabs::v-deep .nav-link.active,
body.c-dark-theme .settings-tabs /deep/ .nav-link.active,
body.c-dark-theme .settings-tabs >>> .nav-link.active,
body.c-dark-theme .settings-tabs::v-deep .nav-link.active {
  color: #f1f7ff;
}

[data-coreui-theme='dark'] .settings-tabs /deep/ .nav-underline .nav-link.active::after,
[data-coreui-theme='dark'] .settings-tabs >>> .nav-underline .nav-link.active::after,
[data-coreui-theme='dark'] .settings-tabs::v-deep .nav-underline .nav-link.active::after,
body.c-dark-theme .settings-tabs /deep/ .nav-underline .nav-link.active::after,
body.c-dark-theme .settings-tabs >>> .nav-underline .nav-link.active::after,
body.c-dark-theme .settings-tabs::v-deep .nav-underline .nav-link.active::after {
  background-color: #7fa6d1;
}

/* ─── Status flow ─────────────────────────────────────── */
.status-flow-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-flow-divider {
  height: 1px;
  background-color: #e4e4e4;
  margin: 2px 0;
}

.status-flow-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.status-flow-arrow {
  color: #9b9b9b;
  font-size: 13px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  line-height: 1.4;
}

.status-chip--from {
  background: #f1efeb;
  color: #5f5e5a;
  border: 1px solid #d3d1c7;
}

.status-chip--to {
  background: #cecbf6;
  color: #26215c;
}

.status-chip--approve {
  background: #c0dd97;
  color: #173404;
}

.status-chip--reject {
  background: #f7c1c1;
  color: #501313;
}

.status-chip--alt {
  background: #f4c0d1;
  color: #4b1528;
}

[data-coreui-theme='dark'] .status-chip--from,
body.c-dark-theme .status-chip--from {
  background: #1b2938;
  color: #cfe0f2;
  border-color: #4b6480;
}

[data-coreui-theme='dark'] .status-chip--to,
body.c-dark-theme .status-chip--to {
  background: #2a3a56;
  color: #d9e7f7;
}

[data-coreui-theme='dark'] .status-chip--approve,
body.c-dark-theme .status-chip--approve {
  background: #285035;
  color: #d9f3e0;
}

[data-coreui-theme='dark'] .status-chip--reject,
body.c-dark-theme .status-chip--reject {
  background: #5e2b2b;
  color: #ffe3e3;
}

[data-coreui-theme='dark'] .status-chip--alt,
body.c-dark-theme .status-chip--alt {
  background: #4b3455;
  color: #f0dff8;
}
/* ──────────────────────────────────────────────────────── */

.transition-row {
  margin-bottom: 8px;
}

.text-required {
  color: #e55353;
}

[class*='c-dark-theme'] .status-flow-divider {
  background-color: rgba(255, 255, 255, 0.16);
}

.workflow-alert {
  border-radius: 10px;
}

[data-coreui-theme='dark'] .workflow-alert,
body.c-dark-theme .workflow-alert {
  border-width: 1px;
  border-style: solid;
}

[data-coreui-theme='dark'] .workflow-alert.alert-success,
body.c-dark-theme .workflow-alert.alert-success {
  background: rgba(44, 104, 77, 0.25);
  border-color: rgba(99, 184, 145, 0.55);
  color: #d7f3e7;
}

[data-coreui-theme='dark'] .workflow-alert.alert-warning,
body.c-dark-theme .workflow-alert.alert-warning {
  background: rgba(130, 95, 42, 0.28);
  border-color: rgba(239, 188, 101, 0.55);
  color: #fde8c2;
}

[data-coreui-theme='dark'] .workflow-alert.alert-secondary,
body.c-dark-theme .workflow-alert.alert-secondary {
  background: rgba(68, 86, 108, 0.35);
  border-color: rgba(150, 172, 198, 0.5);
  color: #dbe8f6;
}

[data-coreui-theme='dark'] .workflow-alert.alert-danger,
body.c-dark-theme .workflow-alert.alert-danger {
  background: rgba(116, 42, 47, 0.28);
  border-color: rgba(234, 122, 132, 0.55);
  color: #ffdce0;
}

[data-coreui-theme='dark'] .workflow-alert strong,
body.c-dark-theme .workflow-alert strong {
  color: #f4f9ff;
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

[data-coreui-theme='dark'] .admin-email-widget__backdrop,
body.c-dark-theme .admin-email-widget__backdrop {
  background: rgba(7, 13, 22, 0.58);
}

[data-coreui-theme='dark'] .admin-email-widget__panel,
body.c-dark-theme .admin-email-widget__panel {
  border-color: #476280;
  box-shadow: 0 22px 46px rgba(0, 0, 0, 0.55);
}

[data-coreui-theme='dark'] .admin-email-widget__header,
body.c-dark-theme .admin-email-widget__header {
  background: #1b2736;
  border-bottom-color: #48617d;
}

[data-coreui-theme='dark'] .admin-email-widget__header h5,
body.c-dark-theme .admin-email-widget__header h5 {
  color: #f0f6ff;
}

[data-coreui-theme='dark'] .admin-email-widget__eyebrow,
body.c-dark-theme .admin-email-widget__eyebrow {
  color: #8eb7e0;
}

[data-coreui-theme='dark'] .admin-email-widget__body,
body.c-dark-theme .admin-email-widget__body {
  background: #243244;
  color: #e6edf6;
}

[data-coreui-theme='dark'] .admin-email-widget__body label,
body.c-dark-theme .admin-email-widget__body label {
  color: #d5e5f6;
}

[data-coreui-theme='dark'] .admin-email-widget__footer,
body.c-dark-theme .admin-email-widget__footer {
  background: #1b2736;
  border-top-color: #48617d;
}

[data-coreui-theme='dark'] .admin-email-widget__close-btn,
body.c-dark-theme .admin-email-widget__close-btn {
  color: #d3e3f5;
}

[data-coreui-theme='dark'] .admin-email-widget__close-btn:hover,
body.c-dark-theme .admin-email-widget__close-btn:hover {
  color: #f5f9ff;
  background: rgba(143, 173, 206, 0.16);
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .send-modal .modal-content,
[data-coreui-theme='dark'] .admin-settings-page >>> .send-modal .modal-content,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .send-modal .modal-content,
body.c-dark-theme .admin-settings-page /deep/ .send-modal .modal-content,
body.c-dark-theme .admin-settings-page >>> .send-modal .modal-content,
body.c-dark-theme .admin-settings-page::v-deep .send-modal .modal-content {
  background: #1f2b3a;
  border-color: #4b6783;
  color: #ebf3fc;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .send-modal .modal-header,
[data-coreui-theme='dark'] .admin-settings-page >>> .send-modal .modal-header,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .send-modal .modal-header,
body.c-dark-theme .admin-settings-page /deep/ .send-modal .modal-header,
body.c-dark-theme .admin-settings-page >>> .send-modal .modal-header,
body.c-dark-theme .admin-settings-page::v-deep .send-modal .modal-header {
  background: #192534;
  border-bottom-color: #48617d;
  color: #f1f7ff;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .send-modal .modal-title,
[data-coreui-theme='dark'] .admin-settings-page >>> .send-modal .modal-title,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .send-modal .modal-title,
body.c-dark-theme .admin-settings-page /deep/ .send-modal .modal-title,
body.c-dark-theme .admin-settings-page >>> .send-modal .modal-title,
body.c-dark-theme .admin-settings-page::v-deep .send-modal .modal-title {
  color: #f1f7ff;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .send-modal .close,
[data-coreui-theme='dark'] .admin-settings-page >>> .send-modal .close,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .send-modal .close,
body.c-dark-theme .admin-settings-page /deep/ .send-modal .close,
body.c-dark-theme .admin-settings-page >>> .send-modal .close,
body.c-dark-theme .admin-settings-page::v-deep .send-modal .close {
  color: #f1f7ff;
  text-shadow: none;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .send-modal .send-modal-inner,
[data-coreui-theme='dark'] .admin-settings-page >>> .send-modal .send-modal-inner,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .send-modal .send-modal-inner,
body.c-dark-theme .admin-settings-page /deep/ .send-modal .send-modal-inner,
body.c-dark-theme .admin-settings-page >>> .send-modal .send-modal-inner,
body.c-dark-theme .admin-settings-page::v-deep .send-modal .send-modal-inner {
  background: #1f2b3a;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .send-modal label,
[data-coreui-theme='dark'] .admin-settings-page >>> .send-modal label,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .send-modal label,
body.c-dark-theme .admin-settings-page /deep/ .send-modal label,
body.c-dark-theme .admin-settings-page >>> .send-modal label,
body.c-dark-theme .admin-settings-page::v-deep .send-modal label {
  color: #d5e5f6;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .send-modal .form-control,
[data-coreui-theme='dark'] .admin-settings-page >>> .send-modal .form-control,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .send-modal .form-control,
[data-coreui-theme='dark'] .admin-settings-page /deep/ .send-modal .custom-select,
[data-coreui-theme='dark'] .admin-settings-page >>> .send-modal .custom-select,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .send-modal .custom-select,
body.c-dark-theme .admin-settings-page /deep/ .send-modal .form-control,
body.c-dark-theme .admin-settings-page >>> .send-modal .form-control,
body.c-dark-theme .admin-settings-page::v-deep .send-modal .form-control,
body.c-dark-theme .admin-settings-page /deep/ .send-modal .custom-select,
body.c-dark-theme .admin-settings-page >>> .send-modal .custom-select,
body.c-dark-theme .admin-settings-page::v-deep .send-modal .custom-select {
  background: #182230;
  border-color: #48617d;
  color: #edf3fb;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .send-modal .modal-footer,
[data-coreui-theme='dark'] .admin-settings-page >>> .send-modal .modal-footer,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .send-modal .modal-footer,
body.c-dark-theme .admin-settings-page /deep/ .send-modal .modal-footer,
body.c-dark-theme .admin-settings-page >>> .send-modal .modal-footer,
body.c-dark-theme .admin-settings-page::v-deep .send-modal .modal-footer {
  background: #192534 !important;
  border-top-color: #48617d !important;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .admin-users-page .summary-widget,
[data-coreui-theme='dark'] .admin-settings-page >>> .admin-users-page .summary-widget,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .admin-users-page .summary-widget,
body.c-dark-theme .admin-settings-page /deep/ .admin-users-page .summary-widget,
body.c-dark-theme .admin-settings-page >>> .admin-users-page .summary-widget,
body.c-dark-theme .admin-settings-page::v-deep .admin-users-page .summary-widget {
  background: #1d2a39;
  color: #edf3fb;
  border-color: rgba(117, 144, 173, 0.34);
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .admin-users-page .summary-widget:hover,
[data-coreui-theme='dark'] .admin-settings-page >>> .admin-users-page .summary-widget:hover,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .admin-users-page .summary-widget:hover,
body.c-dark-theme .admin-settings-page /deep/ .admin-users-page .summary-widget:hover,
body.c-dark-theme .admin-settings-page >>> .admin-users-page .summary-widget:hover,
body.c-dark-theme .admin-settings-page::v-deep .admin-users-page .summary-widget:hover {
  background: #243244;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .admin-users-page .summary-widget.is-active,
[data-coreui-theme='dark'] .admin-settings-page >>> .admin-users-page .summary-widget.is-active,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .admin-users-page .summary-widget.is-active,
body.c-dark-theme .admin-settings-page /deep/ .admin-users-page .summary-widget.is-active,
body.c-dark-theme .admin-settings-page >>> .admin-users-page .summary-widget.is-active,
body.c-dark-theme .admin-settings-page::v-deep .admin-users-page .summary-widget.is-active {
  background: rgba(77, 109, 143, 0.45);
  border-color: #7ea4cf;
  box-shadow: 0 0 0 2px rgba(126, 164, 207, 0.24);
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .admin-users-page .c-datatable,
[data-coreui-theme='dark'] .admin-settings-page >>> .admin-users-page .c-datatable,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .admin-users-page .c-datatable,
body.c-dark-theme .admin-settings-page /deep/ .admin-users-page .c-datatable,
body.c-dark-theme .admin-settings-page >>> .admin-users-page .c-datatable,
body.c-dark-theme .admin-settings-page::v-deep .admin-users-page .c-datatable {
  color: #edf3fb;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .admin-users-page .pagination .page-link,
[data-coreui-theme='dark'] .admin-settings-page >>> .admin-users-page .pagination .page-link,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .admin-users-page .pagination .page-link,
body.c-dark-theme .admin-settings-page /deep/ .admin-users-page .pagination .page-link,
body.c-dark-theme .admin-settings-page >>> .admin-users-page .pagination .page-link,
body.c-dark-theme .admin-settings-page::v-deep .admin-users-page .pagination .page-link {
  background: #1b2735;
  border-color: #48617d;
  color: #d7e7f8;
}

[data-coreui-theme='dark'] .admin-settings-page /deep/ .admin-users-page .pagination .page-item.active .page-link,
[data-coreui-theme='dark'] .admin-settings-page >>> .admin-users-page .pagination .page-item.active .page-link,
[data-coreui-theme='dark'] .admin-settings-page::v-deep .admin-users-page .pagination .page-item.active .page-link,
body.c-dark-theme .admin-settings-page /deep/ .admin-users-page .pagination .page-item.active .page-link,
body.c-dark-theme .admin-settings-page >>> .admin-users-page .pagination .page-item.active .page-link,
body.c-dark-theme .admin-settings-page::v-deep .admin-users-page .pagination .page-item.active .page-link {
  background: #2e4f72;
  border-color: #7ea4cf;
  color: #f5f9ff;
}

@media (max-width: 768px) {
  .admin-email-widget__fab { right: 16px; bottom: 16px; }
  .admin-email-widget__panel { right: 12px; left: 12px; bottom: 84px; width: auto; max-height: 76vh; }
}
</style>
