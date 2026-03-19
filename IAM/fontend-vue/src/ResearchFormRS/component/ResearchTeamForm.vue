<template>
  <div class="research-team-form">
    <div class="card">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0">คณะผู้วิจัย</h5>
      </div>
      <div class="card-body">
        
        <div ref="research_team" :class="sectionClass('research_team')">
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
                      <input v-model="researcher.name" type="text" class="form-control" required :disabled="isReadOnly">
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-group">
                      <label>สังกัดหน่วยงาน <span v-if="!isReadOnly" class="text-danger">*</span></label>
                      <input v-model="researcher.affiliation" type="text" class="form-control" required :disabled="isReadOnly">
                    </div>
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-4">
                    <div class="form-group">
                      <label>เบอร์โทรศัพท์ <span v-if="!isReadOnly" class="text-danger">*</span></label>
                      <input v-model="researcher.phone" type="text" class="form-control" required :disabled="isReadOnly">
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="form-group">
                      <label>E-mail <span v-if="!isReadOnly" class="text-danger">*</span></label>
                      <input v-model="researcher.email" type="email" class="form-control" required :disabled="isReadOnly">
                    </div>
                  </div>
                  <div :class="isReadOnly ? 'col-md-4' : 'col-md-3'">
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
                  <div class="col-md-1" v-if="!isReadOnly">
                    <div class="form-group">
                      <label>&nbsp;</label>
                      <button @click="removeCoResearcher(index)" title="ลบผู้ร่วมโครงการวิจัย" class="btn btn-danger btn-sm form-control">
                        <CIcon name="cil-trash"/>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <button v-if="!isReadOnly" @click="addCoResearcher" class="btn btn-outline-primary w-100 mb-3">
            <CIcon name="cil-plus" class="mr-2" /> เพิ่มผู้ร่วม
          </button>

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
                  <div :class="isReadOnly ? 'col-md-6' : 'col-md-5'">
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
                  <div class="col-md-1" v-if="!isReadOnly">
                    <div class="form-group">
                      <label>&nbsp;</label>
                      <button @click="removeAdvisor(index)" title="ลบที่ปรึกษาโครงการวิจัย" class="btn btn-danger btn-sm form-control">
                        <CIcon name="cil-trash" />
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
export default {
  name: 'ResearchTeamForm',
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
      advisors: []
    }
  },
  computed: {
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
        { 'section-highlight': this.highlightedSectionKey === sectionKey }
      ]
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
    addCoResearcher() {
      if (this.isReadOnly) return;
      this.coResearchers.push({
        name: '',
        affiliation: '',
        phone: '',
        email: '',
        proportion: ''
      });
      this.emitTeamChanged();
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
        ? source.coResearchers.map(item => ({ ...item }))
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

.co-researcher-item, .advisor-item {
  border-left: 4px solid #007bff;
  margin-bottom: 15px;
  border-radius: 8px;
  overflow: hidden;
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
