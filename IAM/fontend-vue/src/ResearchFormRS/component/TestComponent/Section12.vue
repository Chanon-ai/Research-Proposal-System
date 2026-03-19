<template>
  <CCard>
    <CCardBody>
      <CButtonGroup v-if="!isReadOnly" class="mb-3 d-flex w-100 duration-selector">
        <CButton
          :color="selectedDuration === 6 ? 'primary' : 'secondary'"
          :variant="selectedDuration === 6 ? '' : 'outline'"
          class="flex-fill rounded-0"
          @click="setDuration(6)"
        >
          6 เดือน
        </CButton>
        <CButton
          :color="selectedDuration === 12 ? 'primary' : 'secondary'"
          :variant="selectedDuration === 12 ? '' : 'outline'"
          class="flex-fill rounded-0"
          @click="setDuration(12)"
        >
          1 ปี (12 เดือน)
        </CButton>
        <CButton
          :color="selectedDuration === 24 ? 'primary' : 'secondary'"
          :variant="selectedDuration === 24 ? '' : 'outline'"
          class="flex-fill rounded-0"
          @click="setDuration(24)"
        >
          2 ปี (24 เดือน)
        </CButton>
      </CButtonGroup>

      <div v-else class="mb-3 fw-bold text-primary">
        แผนการดำเนินงานระยะเวลา: {{ selectedDuration }} เดือน
      </div>

      <div class="table-wrapper">
        <table class="table table-bordered mb-0 plan-table" :class="`table-months-${selectedDuration}`">
          <thead>
            <tr class="bg-primary text-white text-center">
              <th class="sticky-left head-col text-left">กิจกรรม</th>
              
              <th v-for="m in selectedDuration" :key="m" class="month-col">
                {{ m }}
              </th>
              
              <th 
                class="sticky-right head-col text-left" 
                :class="{ 'has-action-col': !isReadOnly && activities.length > 1 }"
              >
                ผู้รับผิดชอบ
              </th>
              
              <th class="sticky-action action-col" v-if="!isReadOnly && activities.length > 1"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in activities" :key="row.id">
              <td class="p-1 sticky-left align-top bg-white sticky-border-right">
                <textarea
                  v-model="row.activityName"
                  @input="autoGrow"
                  class="form-control custom-textarea"
                  placeholder="ระบุกิจกรรม..."
                  rows="1"
                  :disabled="isReadOnly"
                ></textarea>
              </td>
              
              <td
                v-for="m in selectedDuration"
                :key="m"
                class="p-0 month-cell"
                :class="{ 
                  'bg-success': row.selectedMonths.includes(m),
                  'read-only-cell': isReadOnly 
                }"
                @click="!isReadOnly && toggleMonth(row, m)"
              ></td>
              
              <td 
                class="p-1 sticky-right align-top bg-white sticky-border-left"
                :class="{ 'has-action-col': !isReadOnly && activities.length > 1 }"
              >
                <textarea
                  v-model="row.responsible"
                  @input="autoGrow"
                  class="form-control custom-textarea"
                  placeholder="ผู้รับผิดชอบ"
                  rows="1"
                  :disabled="isReadOnly"
                ></textarea>
              </td>

              <td class="p-1 sticky-action text-center align-middle bg-white" v-if="!isReadOnly && activities.length > 1">
                <CButton 
                  color="danger" 
                  size="sm" 
                  class="my-1"
                  @click="removeActivity(index)" 
                  title="ลบกิจกรรม"
                >
                  ลบ
                </CButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="d-flex justify-content-end mt-3" v-if="!isReadOnly">
        <CButton color="primary" variant="outline" @click="addActivity">
          + เพิ่มกิจกรรมใหม่
        </CButton>
      </div>
    </CCardBody>
  </CCard>
</template>

<script>
export default {
  name: 'ActionPlanTable',
  model: {
    prop: 'modelValue',
    event: 'update:modelValue'
  },
  props: {
    modelValue: {
      type: [Object, Array],
      default: null
    },
    isReadOnly: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      suppressEmit: false,
      selectedDuration: 6,
      activities: [
        {
          id: Date.now(),
          activityName: '',
          selectedMonths: [],
          responsible: ''
        }
      ]
    }
  },
  watch: {
    modelValue: {
      immediate: true,
      deep: true,
      handler (val) {
        this.hydrateFromModelValue(val)
      }
    },
    selectedDuration () {
      this.emitChange()
    },
    activities: {
      deep: true,
      handler () {
        this.emitChange()
      }
    }
  },
  methods: {
    hydrateFromModelValue (val) {
      if (!val) return

      this.suppressEmit = true

      if (Array.isArray(val)) {
        this.selectedDuration = 6
        const nextRows = val.map((row, idx) => ({
          id: row && row.id ? row.id : `${Date.now()}_${idx}`,
          activityName: (row && row.activityName) ? String(row.activityName) : '',
          selectedMonths: Array.isArray(row && row.selectedMonths) ? row.selectedMonths.slice() : [],
          responsible: (row && row.responsible) ? String(row.responsible) : ''
        }))
        this.activities = nextRows.length
          ? nextRows
          : [
              {
                id: Date.now(),
                activityName: '',
                selectedMonths: [],
                responsible: ''
              }
            ]
      } else if (typeof val === 'object') {
        const duration = Number(val.duration) || 6
        const rows = Array.isArray(val.activities) ? val.activities : []
        this.selectedDuration = [6, 12, 24].includes(duration) ? duration : 6
        this.activities = rows.length
          ? rows.map((row, idx) => ({
              id: row && row.id ? row.id : `${Date.now()}_${idx}`,
              activityName: (row && row.activityName) ? String(row.activityName) : '',
              selectedMonths: Array.isArray(row && row.selectedMonths) ? row.selectedMonths.slice() : [],
              responsible: (row && row.responsible) ? String(row.responsible) : ''
            }))
          : [
              {
                id: Date.now(),
                activityName: '',
                selectedMonths: [],
                responsible: ''
              }
            ]
      }

      this.$nextTick(() => {
        this.suppressEmit = false
      })
    },
    emitChange () {
      if (this.suppressEmit) return
      if (this.isReadOnly) return
      this.$emit('update:modelValue', {
        duration: this.selectedDuration,
        activities: (this.activities || []).map(r => ({
          id: r.id,
          activityName: r.activityName || '',
          selectedMonths: Array.isArray(r.selectedMonths) ? r.selectedMonths.slice() : [],
          responsible: r.responsible || ''
        }))
      })
    },
    setDuration (months) {
      this.selectedDuration = months
      this.activities.forEach(activity => {
        activity.selectedMonths = activity.selectedMonths.filter(m => m <= months)
      })
    },
    addActivity () {
      this.activities.push({
        id: Date.now(),
        activityName: '',
        selectedMonths: [],
        responsible: ''
      })
    },
    removeActivity (index) {
      if (this.activities.length > 1) {
        this.activities.splice(index, 1)
      }
    },
    toggleMonth (row, month) {
      const index = row.selectedMonths.indexOf(month)
      if (index > -1) {
        row.selectedMonths.splice(index, 1)
      } else {
        row.selectedMonths.push(month)
      }
    },
    autoGrow (event) {
      const element = event.target
      element.style.height = 'auto'
      element.style.height = element.scrollHeight + 'px'
    }
  }
}
</script>

<style scoped>
/* =========================================
   Custom Styles
   ========================================= */
.duration-selector .btn:focus {
  box-shadow: none;
}

.table-wrapper {
  border: 1px solid #d8dbe0;
  position: relative;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
}

.plan-table {
  width: 100%;
  table-layout: fixed;
}

.table-months-6 { min-width: 600px; }
.table-months-12 { min-width: 800px; }
.table-months-24 { min-width: 1200px; }

.head-col {
  width: 250px;
  min-width: 250px;
  transition: all 0.3s ease;
}
.action-col {
  width: 60px;
  min-width: 60px;
}
.month-col {
  width: 50px;
  min-width: 40px;
}

@media (max-width: 991.98px) {
  .head-col { width: 180px; min-width: 180px; }
}
@media (max-width: 767.98px) {
  .head-col { width: 120px; min-width: 120px; }
  .custom-textarea { font-size: 0.85rem; }
}

/* =========================================
   Sticky Columns & Backgrounds (แก้ปัญหาพื้นหลังโปร่งใส)
   ========================================= */
/* ตรึงคอลัมน์ซ้าย (กิจกรรม) */
.sticky-left {
  position: sticky;
  left: 0;
  z-index: 2;
  background-color: #ffffff !important; /* บังคับพื้นหลังสีขาว */
}
.sticky-border-right {
  border-right: 2px solid #d8dbe0 !important; 
}

/* ตรึงคอลัมน์ขวาสุด (ปุ่มลบ) */
.sticky-action {
  position: sticky;
  right: 0;
  z-index: 2;
  background-color: #ffffff !important; /* บังคับพื้นหลังสีขาว */
  border-left: 1px solid #d8dbe0;
}

/* ตรึงคอลัมน์ขวา (ผู้รับผิดชอบ) */
.sticky-right {
  position: sticky;
  right: 0;
  z-index: 2;
  background-color: #ffffff !important; /* บังคับพื้นหลังสีขาว */
  transition: right 0.2s ease;
}
.sticky-border-left {
  border-left: 2px solid #d8dbe0 !important;
}

/* กรณีที่มีปุ่มลบ ให้ขยับคอลัมน์ผู้รับผิดชอบมาทางซ้าย 60px */
.sticky-right.has-action-col {
  right: 60px;
}

/* บังคับสีพื้นหลังของหัวตาราง (Thead) ไม่ให้ข้อความทะลุเวลา Scroll */
thead .sticky-left,
thead .sticky-right,
thead .sticky-action {
  z-index: 3;
  background-color: #321fdb !important; /* สีน้ำเงิน Primary ของ CoreUI */
  color: #ffffff;
}

/* =========================================
   Interactions (Hover/Click/Inputs)
   ========================================= */
.month-cell {
  cursor: pointer;
  transition: background-color 0.1s;
}
.month-cell:hover {
  background-color: #ebedef;
}
.month-cell.bg-success {
  background-color: #2eb85c !important;
}

.custom-textarea {
  resize: none;
  overflow: hidden;
  min-height: 45px;
  width: 100%;
  background-color: #ffffff; /* บังคับให้ช่องพิมพ์มีสีขาวทึบ */
}

.month-cell.read-only-cell {
  cursor: not-allowed;
}
.month-cell.read-only-cell:hover {
  background-color: transparent; /* เอา hover effect ออก */
}
.month-cell.bg-success.read-only-cell:hover {
  background-color: #2eb85c !important; /* คงสีเขียวไว้ถ้าถูกเลือกอยู่แล้ว */
}
</style>
