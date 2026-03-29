<template>
  <div class="research-team-form" :class="{ 'research-team-form--dark': isDarkTheme }">
    <div class="card">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0">คณะผู้วิจัย</h5>
      </div>
      <div class="card-body">
        
        <div ref="research_team" :class="[sectionClass('research_team'), 'project-leader-section']">
          <h6 class="section-title">หัวหน้าโครงการวิจัย</h6>
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label>ชื่อ-สกุล <span v-if="!isReadOnly" class="text-danger">*</span></label>
                <input v-model="projectLeader.name" type="text" class="form-control" required :readonly="shouldAutoFillProjectLeader" :disabled="isReadOnly">
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label>สังกัดหน่วยงาน <span v-if="!isReadOnly" class="text-danger">*</span></label>
                <input v-model="projectLeader.affiliation" type="text" class="form-control" required :readonly="shouldAutoFillProjectLeader" :disabled="isReadOnly">
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-md-4">
              <div class="form-group">
                <label>เบอร์โทรศัพท์ <span v-if="!isReadOnly" class="text-danger">*</span></label>
                <input v-model="projectLeader.phone" type="text" class="form-control" required :readonly="shouldAutoFillProjectLeader" :disabled="isReadOnly">
              </div>
            </div>
            <div class="col-md-4">
              <div class="form-group">
                <label>E-mail <span v-if="!isReadOnly" class="text-danger">*</span></label>
                <input v-model="projectLeader.email" type="email" class="form-control" required :readonly="shouldAutoFillProjectLeader" :disabled="isReadOnly">
              </div>
            </div>
            <div class="col-md-4">
              <div class="form-group">
                <label>สัดส่วนการวิจัย (%) <span v-if="!isReadOnly" class="text-danger">*</span></label>
                <input v-model="projectLeader.proportion" type="number" min="1" max="100" class="form-control bg-light" readonly required title="คำนวณอัตโนมัติจากสัดส่วนของผู้ร่วมโครงการ" :disabled="isReadOnly">
              </div>
            </div>
          </div>
        </div>

        <div class="section mb-4">
          <h6 class="section-title">ผู้ร่วมโครงการวิจัย (ถ้ามี)</h6>
          <div v-if="coResearchers.length === 0" class="text-muted text-center py-3">
            -- ยังไม่มีข้อมูลผู้ร่วมโครงการ --
          </div>
          <div v-for="(researcher, index) in coResearchers" :key="index" class="co-researcher-item mb-3">
            <div class="card">
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6">
                    <div class="form-group">
                      <label>ชื่อ-สกุล <span v-if="!isReadOnly" class="text-danger">*</span></label>
                      <input
                        v-model="researcher.name"
                        type="text"
                        class="form-control"
                        :class="{ 'co-researcher-readonly': isCoResearcherProfileLocked(researcher) }"
                        required
                        :readonly="isCoResearcherProfileLocked(researcher)"
                        :disabled="isReadOnly"
                      >
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-group">
                      <label>สังกัดหน่วยงาน <span v-if="!isReadOnly" class="text-danger">*</span></label>
                      <input
                        v-model="researcher.affiliation"
                        type="text"
                        class="form-control"
                        :class="{ 'co-researcher-readonly': isCoResearcherProfileLocked(researcher) }"
                        required
                        :readonly="isCoResearcherProfileLocked(researcher)"
                        :disabled="isReadOnly"
                      >
                    </div>
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-4">
                    <div class="form-group">
                      <label>เบอร์โทรศัพท์ <span v-if="!isReadOnly" class="text-danger">*</span></label>
                      <input
                        v-model="researcher.phone"
                        type="text"
                        class="form-control"
                        :class="{ 'co-researcher-readonly': isCoResearcherProfileLocked(researcher) }"
                        required
                        :readonly="isCoResearcherProfileLocked(researcher)"
                        :disabled="isReadOnly"
                      >
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="form-group">
                      <label>E-mail <span v-if="!isReadOnly" class="text-danger">*</span></label>
                      <input
                        v-model="researcher.email"
                        type="email"
                        class="form-control"
                        :class="{ 'co-researcher-readonly': isCoResearcherProfileLocked(researcher) }"
                        required
                        :readonly="isCoResearcherProfileLocked(researcher)"
                        :disabled="isReadOnly"
                      >
                    </div>
                  </div>
                  <div :class="isReadOnly ? 'col-md-4' : 'col-md-2'">
                    <div class="form-group">
                      <label>สัดส่วนการวิจัย (%) <span v-if="!isReadOnly" class="text-danger">*</span></label>
                      <input 
                        v-model="researcher.proportion" 
                        @input="validateProportion(index)"
                        @keypress="allowOnlyNumbers"
                        type="number" 
                        min="1" 
                        :max="getMaxProportion(index)"
                        class="form-control" 
                        required
                        :disabled="isReadOnly"
                      >
                    </div>
                  </div>
                  <div class="col-md-2" v-if="!isReadOnly">
                    <div class="form-group">
                      <label>&nbsp;</label>
                      <button type="button" @click="removeCoResearcher(index)" title="ลบผู้ร่วมโครงการวิจัย" class="btn btn-outline-danger form-control delete-action-btn">
                        <CIcon name="cil-trash" class="mr-1"/>
                        <span>ลบ</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <button v-if="!isReadOnly" @click="openCoResearcherPicker" class="btn btn-outline-primary w-100 mb-3">
            <CIcon name="cil-plus" class="mr-2" /> เพิ่มผู้ร่วม
          </button>

          <CModal
            :show.sync="showCoResearcherModal"
            centered
            :close-on-backdrop="false"
            class="co-researcher-modal"
            title="เพิ่มผู้ร่วมโครงการ"
          >
            <template #body-wrapper>
              <div class="co-researcher-picker">
                <label class="co-researcher-picker-label">ค้นหา / เลือกผู้ร่วมโครงการ (เลือกได้หลายคน)</label>
                <multiselect
                  v-model="selectedCoResearcherOptions"
                  :options="coResearcherOptions"
                  :searchable="true"
                  :multiple="true"
                  :close-on-select="false"
                  :clear-on-select="false"
                  :preserve-search="true"
                  :allow-empty="true"
                  :loading="coResearcherOptionsLoading"
                  label="searchText"
                  track-by="_optionKey"
                  placeholder="ค้นหาชื่อ อีเมล หรือหน่วยงาน"
                  :custom-label="formatCoResearcherOptionLabel"
                >
                  <template slot="option" slot-scope="{ option }">
                    <div class="co-researcher-option">
                      <div class="co-researcher-option__name">{{ option.fullName || option.email || '-' }}</div>
                      <small class="text-muted">{{ option.email || option.affiliation || '-' }}</small>
                    </div>
                  </template>
                </multiselect>
                <small v-if="coResearcherOptionsError" class="text-danger co-researcher-picker-error">
                  {{ coResearcherOptionsError }}
                </small>
              </div>
            </template>
            <template #footer-wrapper>
              <div class="d-flex justify-content-end w-100 co-researcher-modal-actions">
                <button type="button" class="btn btn-outline-danger co-researcher-action-btn" @click="closeCoResearcherPicker"><CIcon name="cil-chevron-right" class="mr-1" /> ยกเลิก</button>
                <button
                  type="button"
                  class="btn btn-primary co-researcher-action-btn"
                  :disabled="coResearcherOptionsLoading || selectedCoResearcherOptions.length === 0"
                  @click="confirmAddCoResearchers"
                >
                  <CIcon name="cil-chevron-right" class="mr-1" /> เพิ่มผู้ร่วม
                </button>
              </div>
            </template>
          </CModal>

          <div 
            class="alert mb-0" 
            :class="totalProportion === 100 ? 'alert-success' : 'alert-danger'"
            role="alert"
          >
            <strong>รวมสัดส่วนการวิจัยทั้งหมด: {{ totalProportion }}%</strong> 
            <span v-if="totalProportion !== 100 && !isReadOnly" class="ml-2">
               (สัดส่วนการวิจัยรวมกันต้องเท่ากับ 100% พอดี)
            </span>
            <span v-else-if="totalProportion === 100" class="ml-2"><i class="cil-check-circle"></i> สัดส่วนถูกต้อง</span>
          </div>
        </div>

        <div class="section">
          <h6 class="section-title">ที่ปรึกษาโครงการวิจัย (ถ้ามี)</h6>
          <div v-if="advisors.length === 0" class="text-muted text-center py-3">
            -- ยังไม่มีข้อมูลที่ปรึกษาโครงการ --
          </div>
          <div v-for="(advisor, index) in advisors" :key="index" class="advisor-item mb-3">
            <div class="card">
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6">
                    <div class="form-group">
                      <label>ชื่อ-สกุล <span v-if="!isReadOnly" class="text-danger">*</span></label>
                      <input v-model="advisor.name" type="text" class="form-control" required :disabled="isReadOnly">
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-group">
                      <label>สังกัดหน่วยงาน <span v-if="!isReadOnly" class="text-danger">*</span></label>
                      <input v-model="advisor.affiliation" type="text" class="form-control" required :disabled="isReadOnly">
                    </div>
                  </div>
                </div>
                <div class="row">
                  <div :class="isReadOnly ? 'col-md-6' : 'col-md-4'">
                    <div class="form-group">
                      <label>เบอร์โทรศัพท์ <span v-if="!isReadOnly" class="text-danger">*</span></label>
                      <input v-model="advisor.phone" type="text" class="form-control" required :disabled="isReadOnly">
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-group">
                      <label>E-mail <span v-if="!isReadOnly" class="text-danger">*</span></label>
                      <input v-model="advisor.email" type="email" class="form-control" required :disabled="isReadOnly">
                    </div>
                  </div>
                  <div class="col-md-2" v-if="!isReadOnly">
                    <div class="form-group">
                      <label>&nbsp;</label>
                      <button type="button" @click="removeAdvisor(index)" title="ลบที่ปรึกษาโครงการวิจัย" class="btn btn-outline-danger form-control delete-action-btn">
                        <CIcon name="cil-trash" class="mr-1" />
                        <span>ลบ</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button v-if="!isReadOnly" @click="addAdvisor" class="btn btn-outline-primary w-100">
            <CIcon name="cil-plus" class="mr-2" /> เพิ่มที่ปรึกษา
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import Service from '@/service/api'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'

export default {
  name: 'ResearchTeamForm',
  components: { Multiselect },
  props: {
    // รับค่ามาจาก ResearchForm.vue
    isReadOnly: {
      type: Boolean,
      default: false
    },
    currentStatus: {
      type: String,
      default: 'draft'
    },
    allowAutoPrefill: {
      type: Boolean,
      default: true
    },
    revisionHighlightSections: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      highlightedSectionKey: '',
      highlightTimerId: null,
      isHydrating: false,
      projectLeader: {
        name: '',
        affiliation: '',
        phone: '',
        email: '',
        proportion: 100
      },
      coResearchers: [],
      advisors: [],
      showCoResearcherModal: false,
      coResearcherOptions: [],
      coResearcherOptionsLoading: false,
      coResearcherOptionsError: '',
      selectedCoResearcherOptions: []
    }
  },
  computed: {
    isDarkTheme() {
      return Boolean(this.$store && this.$store.state && this.$store.state.darkMode)
    },
    currentUser() {
      const user = this.$store && this.$store.getters
        ? this.$store.getters['Authentication/currentUser']
        : null

      if (user && typeof user === 'object') {
        return user
      }

      try {
        const raw = localStorage.getItem('auth_user')
        return raw ? JSON.parse(raw) : null
      } catch (err) {
        return null
      }
    },
    currentUserId () {
      const user = this.currentUser
      if (!user || typeof user !== 'object') return ''
      const id = user._id || user.id || ''
      return id ? String(id) : ''
    },
    shouldAutoFillProjectLeader() {
      return !!(
        this.allowAutoPrefill &&
        this.currentUser &&
        this.currentUser.role === 'researcher' &&
        String(this.currentStatus || '').toLowerCase() === 'draft'
      )
    },
    totalProportion() {
      let total = Number(this.projectLeader.proportion) || 0;
      this.coResearchers.forEach(researcher => {
        total += Number(researcher.proportion) || 0;
      });
      return total;
    }
  },
  watch: {
    currentUser: {
      handler(user) {
        this.prefillProjectLeaderFromCurrentUser(user)
      },
      immediate: true
    },
    currentStatus: {
      handler() {
        this.prefillProjectLeaderFromCurrentUser(this.currentUser)
      },
      immediate: true
    },
    projectLeader: {
      handler() {
        if (this.isHydrating) return
        this.emitTeamChanged();
      },
      deep: true
    },
    coResearchers: {
      handler() {
        if (this.isReadOnly) return; // ป้องกันการคำนวณซ้ำซ้อนในโหมดอ่านอย่างเดียว
        
        if (this.isHydrating) return
        let coTotal = 0;
        this.coResearchers.forEach(r => {
          coTotal += Number(r.proportion) || 0;
        });

        // คำนวณสัดส่วนที่เหลือให้หัวหน้าโครงการ โดยบังคับว่าต้องไม่ต่ำกว่า 1
        this.projectLeader.proportion = Math.max(1, 100 - coTotal);

        this.emitTeamChanged();
      },
      deep: true
    },
    advisors: {
      handler() {
        if (this.isHydrating) return
        this.emitTeamChanged();
      },
      deep: true
    }
  },
  methods: {
    cloneSerializable(value) {
      if (value === undefined) return undefined
      try {
        return JSON.parse(JSON.stringify(value))
      } catch (_) {
        return value
      }
    },
    emitTeamChanged() {
      if (this.isHydrating || this.isReadOnly) return
      this.$emit('team-changed', this.getFormData())
    },
    sectionClass(sectionKey) {
      return [
        'section',
        'mb-4',
        {
          'section-highlight': this.highlightedSectionKey === sectionKey,
          'section-revision-highlight': this.isRevisionHighlighted(sectionKey)
        }
      ]
    },
    isRevisionHighlighted (sectionKey) {
      const targetKey = String(sectionKey || '').trim()
      if (!targetKey) return false
      return (Array.isArray(this.revisionHighlightSections) ? this.revisionHighlightSections : [])
        .map(key => String(key || '').trim())
        .includes(targetKey)
    },
    scrollToSection(sectionKey) {
      const target = this.$refs[sectionKey]
      const el = Array.isArray(target) ? target[0] : target
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else if (this.$el && typeof this.$el.scrollIntoView === 'function') {
        this.$el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      this.highlightSection(sectionKey)
    },
    highlightSection(sectionKey) {
      this.highlightedSectionKey = sectionKey
      if (this.highlightTimerId) {
        clearTimeout(this.highlightTimerId)
      }
      this.highlightTimerId = setTimeout(() => {
        this.highlightedSectionKey = ''
        this.highlightTimerId = null
      }, 2200)
    },
    prefillProjectLeaderFromCurrentUser(user) {
      if (!user || typeof user !== 'object') return
      if (!this.allowAutoPrefill) return
      if (this.isHydrating) return
      if (user.role !== 'researcher') return
      if (String(this.currentStatus || '').toLowerCase() !== 'draft') return

      if (!this.projectLeader.name && user.fullName) {
        this.projectLeader.name = user.fullName
      }

      if (!this.projectLeader.phone && user.phone) {
        this.projectLeader.phone = user.phone
      }

      if (!this.projectLeader.email && user.email) {
        this.projectLeader.email = user.email
      }

      if (!this.projectLeader.affiliation) {
        this.projectLeader.affiliation = user.department || user.faculty || ''
      }
    },
    // บล็อกการพิมพ์อักษร e, E, เครื่องหมายบวก, ลบ และจุดทศนิยม
    allowOnlyNumbers(event) {
      if (['e', 'E', '-', '+', '.'].includes(event.key)) {
        event.preventDefault();
      }
    },
    getMaxProportion(currentIndex) {
      let otherTotal = 0;
      this.coResearchers.forEach((r, idx) => {
        if (idx !== currentIndex) {
          otherTotal += Number(r.proportion) || 0;
        }
      });
      
      const max = 100 - otherTotal - 1; 
      return max < 1 ? 1 : max;
    },
    validateProportion(index) {
      if (this.isReadOnly) return;
      
      const maxAllowed = this.getMaxProportion(index);
      let val = this.coResearchers[index].proportion;
      
      if (val === '') return;

      val = Number(val);
      if (val > maxAllowed) {
        this.coResearchers[index].proportion = maxAllowed;
      } else if (val < 1) {
        this.coResearchers[index].proportion = 1;
      }
    },
    getAffiliationText(user) {
      if (!user || typeof user !== 'object') return ''
      const department = user.department && typeof user.department === 'object'
        ? (user.department.name || user.department.title || user.department.departmentName)
        : user.department
      const faculty = user.faculty && typeof user.faculty === 'object'
        ? (user.faculty.name || user.faculty.title || user.faculty.facultyName)
        : user.faculty
      const affiliation = user.affiliation || department || faculty || user.organization || user.unit || ''
      return String(affiliation || '').trim()
    },
    getUserDisplayName(user) {
      if (!user || typeof user !== 'object') return ''
      const fullName = user.fullName || user.name || user.displayName
      if (fullName) return String(fullName).trim()
      const firstName = user.firstName || user.firstname || user.first_name || ''
      const lastName = user.lastName || user.lastname || user.last_name || ''
      return `${firstName} ${lastName}`.trim()
    },
    getUserIdentity(user) {
      if (!user || typeof user !== 'object') return ''
      const userId = user._id || user.id || ''
      if (userId) return `id:${String(userId)}`
      const email = String(user.email || '').trim().toLowerCase()
      if (email) return `email:${email}`
      const name = this.getUserDisplayName(user).toLowerCase()
      const phone = String(user.phone || user.mobile || '').trim()
      return name || phone ? `fallback:${name}:${phone}` : ''
    },
    formatCoResearcherOptionLabel(user) {
      const name = this.getUserDisplayName(user)
      const email = String((user && user.email) || '').trim()
      if (name && email) return `${name} (${email})`
      return name || email || '-'
    },
    isCoResearcherProfileLocked(researcher) {
      if (!researcher || typeof researcher !== 'object') return false
      return Boolean(researcher.lockedProfile || researcher.sourceUserId)
    },
    createCoResearcherFromUser(user) {
      const name = this.getUserDisplayName(user)
      const affiliation = this.getAffiliationText(user)
      const phone = String((user && (user.phone || user.mobile)) || '').trim()
      const email = String((user && user.email) || '').trim()
      const sourceUserId = (user && (user._id || user.id)) ? String(user._id || user.id) : ''
      return {
        name,
        affiliation,
        phone,
        email,
        proportion: '',
        sourceUserId,
        lockedProfile: true
      }
    },
    async fetchCoResearcherOptions() {
      this.coResearcherOptionsLoading = true
      this.coResearcherOptionsError = ''
      try {
        const response = await Service.proposal.getResearcherUsers({ limit: 500 })
        const payload = (response && response.data && response.data.data) || {}
        const list = Array.isArray(payload.items)
          ? payload.items
          : (Array.isArray(payload.users) ? payload.users : [])

        const currentUserId = String(this.currentUserId || '').trim()
        this.coResearcherOptions = list
          .map(user => {
            const fullName = this.getUserDisplayName(user)
            const email = String((user && user.email) || '').trim()
            const affiliation = this.getAffiliationText(user)
            const searchText = [fullName, email, affiliation].filter(Boolean).join(' ')
            const optionKey = this.getUserIdentity(user) || `${fullName}-${email}-${affiliation}`
            return {
              ...user,
              fullName,
              affiliation,
              searchText,
              _optionKey: optionKey
            }
          })
          .filter(user => {
            const role = String((user && user.role) || '').trim().toLowerCase()
            if (role && role !== 'researcher') return false
            if (!currentUserId) return true
            const uid = String((user && (user._id || user.id)) || '').trim()
            return !uid || uid !== currentUserId
          })
      } catch (err) {
        console.error('[ResearchTeamForm] fetch co-researcher options failed:', err)
        this.coResearcherOptions = []
        this.coResearcherOptionsError = 'Unable to load researcher list'
      } finally {
        this.coResearcherOptionsLoading = false
      }
    },
    async openCoResearcherPicker() {
      if (this.isReadOnly) return
      this.selectedCoResearcherOptions = []
      this.showCoResearcherModal = true

      if (!this.coResearcherOptions.length && !this.coResearcherOptionsLoading) {
        await this.fetchCoResearcherOptions()
      }
    },
    closeCoResearcherPicker() {
      this.showCoResearcherModal = false
      this.selectedCoResearcherOptions = []
    },
    addCoResearcher() {
      this.openCoResearcherPicker()
    },
    confirmAddCoResearchers() {
      if (this.isReadOnly) return
      const selectedUsers = Array.isArray(this.selectedCoResearcherOptions)
        ? this.selectedCoResearcherOptions
        : []
      if (!selectedUsers.length) return

      const existingIdentity = new Set(
        this.coResearchers
          .map(researcher => this.getUserIdentity({
            _id: researcher.sourceUserId || '',
            email: researcher.email,
            fullName: researcher.name,
            phone: researcher.phone
          }))
          .filter(Boolean)
      )

      const newRows = []
      selectedUsers.forEach(user => {
        const identity = this.getUserIdentity(user)
        if (!identity || existingIdentity.has(identity)) return
        const row = this.createCoResearcherFromUser(user)
        newRows.push(row)
        existingIdentity.add(identity)
      })

      if (newRows.length > 0) {
        this.coResearchers.push(...newRows)
        this.emitTeamChanged()
      }

      this.closeCoResearcherPicker()
    },
    removeCoResearcher(index) {
      if (this.isReadOnly) return;
      this.coResearchers.splice(index, 1);
      this.emitTeamChanged();
    },
    addAdvisor() {
      if (this.isReadOnly) return;
      this.advisors.push({
        name: '',
        affiliation: '',
        phone: '',
        email: ''
      });
      this.emitTeamChanged();
    },
    removeAdvisor(index) {
      if (this.isReadOnly) return;
      this.advisors.splice(index, 1);
      this.emitTeamChanged();
    },
    setTeamData(team = {}) {
      this.isHydrating = true
      const source = team && typeof team === 'object' ? team : {}
      const projectLeader = source.projectLeader && typeof source.projectLeader === 'object'
        ? source.projectLeader
        : {}

      this.projectLeader = {
        name: projectLeader.name || '',
        affiliation: projectLeader.affiliation || '',
        phone: projectLeader.phone || '',
        email: projectLeader.email || '',
        proportion: projectLeader.proportion !== undefined && projectLeader.proportion !== null && projectLeader.proportion !== ''
          ? projectLeader.proportion
          : 100
      }
      this.coResearchers = Array.isArray(source.coResearchers)
        ? source.coResearchers.map(item => {
          const researcher = item && typeof item === 'object' ? item : {}
          return {
            ...researcher,
            sourceUserId: researcher.sourceUserId ? String(researcher.sourceUserId) : '',
            lockedProfile: Boolean(researcher.lockedProfile || researcher.sourceUserId)
          }
        })
        : []
      this.advisors = Array.isArray(source.advisors)
        ? source.advisors.map(item => ({ ...item }))
        : []

      return new Promise((resolve) => {
        this.$nextTick(() => {
          this.isHydrating = false
          this.prefillProjectLeaderFromCurrentUser(this.currentUser)
          resolve(this.getFormData())
        })
      })
    },
    getValidationResult() {
      const hasText = (value) => String(value || '').trim() !== ''
      const hasValidNumber = (value) => {
        const parsed = Number(value)
        return Number.isFinite(parsed) && parsed > 0
      }
      const validatePerson = (person, requiredFields = []) => {
        const source = person && typeof person === 'object' ? person : {}
        for (const field of requiredFields) {
          if (field === 'proportion') {
            if (!hasValidNumber(source[field])) return false
            continue
          }
          if (!hasText(source[field])) return false
        }
        return true
      }

      if (!validatePerson(this.projectLeader, ['name', 'affiliation', 'phone', 'email', 'proportion'])) {
        return {
          ok: false,
          message: 'กรุณากรอกข้อมูลหัวหน้าโครงการวิจัยให้ครบถ้วน'
        }
      }

      for (let index = 0; index < this.coResearchers.length; index += 1) {
        if (!validatePerson(this.coResearchers[index], ['name', 'affiliation', 'phone', 'email', 'proportion'])) {
          return {
            ok: false,
            message: `กรุณากรอกข้อมูลผู้ร่วมโครงการวิจัยคนที่ ${index + 1} ให้ครบถ้วน`
          }
        }
      }

      for (let index = 0; index < this.advisors.length; index += 1) {
        if (!validatePerson(this.advisors[index], ['name', 'affiliation', 'phone', 'email'])) {
          return {
            ok: false,
            message: `กรุณากรอกข้อมูลที่ปรึกษาโครงการวิจัยคนที่ ${index + 1} ให้ครบถ้วน`
          }
        }
      }

      if (this.totalProportion !== 100) {
        return {
          ok: false,
          message: 'สัดส่วนการวิจัยรวมของหัวหน้าโครงการและผู้ร่วมโครงการต้องเท่ากับ 100%'
        }
      }

      return { ok: true }
    },
    getFormData() {
      return {
        projectLeader: this.cloneSerializable(this.projectLeader) || { ...this.projectLeader },
        coResearchers: this.cloneSerializable(this.coResearchers) || this.coResearchers.map(item => ({ ...item })),
        advisors: this.cloneSerializable(this.advisors) || this.advisors.map(item => ({ ...item })),
        isProportionValid: this.totalProportion === 100
      };
    }
  }
}
</script>

<style scoped>
.research-team-form {
  margin-bottom: 20px;
}

.section-title {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 15px;
  padding: 10px 15px;
  background: #f8f9fa;
  border-left: 4px solid #007bff;
  border-radius: 4px;
}

.section-highlight .section-title {
  background: #fff8db;
  border-left-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.16);
}

.section-revision-highlight {
  background: #fff2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 12px;
}

.section-revision-highlight .section-title {
  background: #ffe2e2;
  border-left-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.14);
}

.co-researcher-item, .advisor-item {
  margin-bottom: 15px;
  border-radius: 8px;
  overflow: hidden;
}

.research-team-form--dark .project-leader-section {
  background: #1a2432;
  border: 1px solid #2d3b4e;
  border-radius: 10px;
  padding: 14px;
}

.research-team-form--dark .section-revision-highlight {
  background: rgba(127, 29, 29, 0.22);
  border-color: rgba(248, 113, 113, 0.5);
}

.research-team-form--dark .section-revision-highlight .section-title {
  background: rgba(127, 29, 29, 0.35);
  border-left-color: #f87171;
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.24);
  color: #fee2e2;
}

.research-team-form--dark .project-leader-section .section-title {
  background: #152132;
  color: #e8eef8;
  border-left-color: #5aa9ff;
}

.research-team-form--dark .project-leader-section.section-revision-highlight .section-title {
  background: rgba(127, 29, 29, 0.35);
  border-left-color: #f87171;
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.24);
  color: #fee2e2;
}

.research-team-form--dark .project-leader-section .form-group label {
  color: #d5e1ef;
}

.research-team-form--dark .project-leader-section .form-control,
.research-team-form--dark .project-leader-section .form-select,
.research-team-form--dark .project-leader-section textarea {
  background: #0f1b2a;
  border-color: #33475f;
  color: #f2f7ff !important;
  -webkit-text-fill-color: #f2f7ff;
  caret-color: #d7e9ff;
}

.research-team-form--dark .project-leader-section .form-control::placeholder,
.research-team-form--dark .project-leader-section textarea::placeholder {
  color: #adc0d5;
  opacity: 1;
}

.research-team-form--dark .project-leader-section .form-control:focus,
.research-team-form--dark .project-leader-section .form-select:focus,
.research-team-form--dark .project-leader-section textarea:focus {
  border-color: #6fb6ff;
  box-shadow: 0 0 0 0.18rem rgba(111, 182, 255, 0.2);
  background: #102033;
  color: #f8fbff !important;
  -webkit-text-fill-color: #f8fbff;
  caret-color: #e5f1ff;
}

.research-team-form--dark .project-leader-section .form-control[readonly],
.research-team-form--dark .project-leader-section .form-control:disabled {
  background: #162636 !important;
  color: #d6e3f1 !important;
  -webkit-text-fill-color: #d6e3f1;
  border-color: #2d3f55;
}

.card {
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 0px;
  overflow: hidden;
}

.card-header {
  border: none;
  font-weight: 600;
}

.card-body {
  padding: 25px;
}

.form-group label {
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-control {
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 10px 12px;
  font-size: 14px;
}

.bg-light {
  background-color: #e9ecef !important;
  cursor: not-allowed;
}

.form-control:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.co-researcher-readonly {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.co-researcher-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 16px 8px;
  background: #ffffff;
}

.co-researcher-picker-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0;
  font-size: 15px;
  line-height: 1.35;
}

.co-researcher-option__name {
  font-weight: 600;
  color: #1f2937;
}

.co-researcher-picker-error {
  display: block;
  margin-top: 2px;
  margin-bottom: 0;
}

.co-researcher-modal-actions {
  gap: 8px;
  padding: 8px 16px 16px;
  border-top: 1px solid #f0f2f5;
}

.co-researcher-action-btn {
  min-width: 104px;
  border-radius: 8px;
  font-weight: 600;
  padding: 8px 14px;
}

.co-researcher-picker ::v-deep .multiselect {
  margin-top: 2px;
}

.co-researcher-picker ::v-deep .multiselect__tags {
  min-height: 46px;
  border-radius: 10px;
  border: 1px solid #d8dee6;
  padding: 9px 40px 7px 12px;
  box-shadow: none;
}

.co-researcher-picker ::v-deep .multiselect__tags:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
}

.co-researcher-picker ::v-deep .multiselect__placeholder {
  margin-bottom: 0;
  color: #9aa3af;
}

.co-researcher-picker ::v-deep .multiselect__content-wrapper {
  border-radius: 10px;
  border: 1px solid #d8dee6;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.co-researcher-picker ::v-deep .multiselect__option {
  padding: 10px 12px;
}

.co-researcher-picker ::v-deep .multiselect__option--highlight {
  background: #f4f6fb;
  color: #1f2937;
}

.text-danger {
  color: #dc3545 !important;
  font-weight: bold;
}

.btn-outline-primary {
  border: 2px solid #007bff;
  color: #333333;
  font-weight: 600;
  padding: 12px 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: white;
}

.btn-outline-primary:hover {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.btn-danger {
  background-color: #dc3545;
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.btn-danger:hover {
  background-color: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.delete-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 38px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  border: 1px solid #8b1212 !important;
  background: #ffffff !important;
  color: #8b1212 !important;
  border-radius: 6px;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.delete-action-btn:hover,
.delete-action-btn:focus {
  background: rgba(139, 18, 18, 0.08) !important;
  border-color: #8b1212 !important;
  color: #8b1212 !important;
  transform: translateY(-1px);
}

.delete-action-btn .c-icon,
.delete-action-btn span {
  color: #8b1212 !important;
}

.btn-sm {
  padding: 8px 12px;
  font-size: 12px;
}

.text-muted {
  color: #6c757d !important;
  font-style: italic;
}

.text-center {
  text-align: center;
}

.py-3 {
  padding-top: 1rem !important;
  padding-bottom: 1rem !important;
}

.mb-3 {
  margin-bottom: 1rem !important;
}

.mb-4 {
  margin-bottom: 1.5rem !important;
}

.mr-2 {
  margin-right: 0.5rem !important;
}

.ml-2 {
  margin-left: 0.5rem !important;
}

.w-100 {
  width: 100% !important;
}

@media (max-width: 768px) {
  .card-body {
    padding: 15px;
  }
  
  .form-control {
    padding: 10px 12px;
    font-size: 16px;
  }
  
  .section-title {
    font-size: 16px;
    padding: 8px 12px;
  }
}
</style>
