<template>
  <div class="admin-funding-budget-settings">
    <CCard class="mt-3">
      <CCardHeader>
        <div class="funding-budget-toolbar">
          <div>
            <div class="font-weight-bold">ตั้งค่าประเภททุนและงบประมาณ</div>
            <small class="text-muted">
              เพิ่ม/แก้ไขประเภททุน ทุนย่อย และเพดานงบประมาณต่อทุนได้จากหน้านี้
            </small>
          </div>
          <div class="funding-budget-summary">
            <CBadge color="info">ประเภททุน {{ fundingBudgetConfig.length }}</CBadge>
            <CBadge color="secondary">ทุนย่อย {{ totalSubOptionCount }}</CBadge>
          </div>
        </div>
      </CCardHeader>

      <CCardBody>
        <div v-if="loading" class="text-center py-4">
          <CSpinner color="primary" />
          <div class="mt-2 text-muted">กำลังโหลดการตั้งค่าทุน...</div>
        </div>

        <template v-else>
          <div v-if="fundingBudgetConfig.length === 0" class="funding-budget-empty">
            <div class="font-weight-bold mb-2">ยังไม่มีประเภททุน</div>
            <small class="text-muted d-block mb-3">กดปุ่ม "เพิ่มประเภททุน" เพื่อเริ่มตั้งค่า</small>
            <CButton color="primary" @click="addFundingType">
              <CIcon name="cil-plus" class="mr-1" /> เพิ่มประเภททุน
            </CButton>
          </div>

          <CCard
            v-for="(type, typeIndex) in fundingBudgetConfig"
            :key="`${type.key || 'funding-type'}-${typeIndex}`"
            class="funding-type-card mb-3"
          >
            <CCardHeader class="funding-type-card__header">
              <div class="font-weight-bold">ประเภททุนที่ {{ typeIndex + 1 }}</div>
              <CButton color="danger" variant="outline" size="sm" @click="removeFundingType(typeIndex)">
                <CIcon name="cil-trash" class="mr-1" /> ลบประเภททุน
              </CButton>
            </CCardHeader>

            <CCardBody>
              <CRow>
                <CCol md="4">
                  <CInput
                    label="รหัสประเภททุน (key)"
                    placeholder="เช่น new-researcher"
                    v-model.trim="type.key"
                    @blur="applyFundingTypeKey(typeIndex)"
                  />
                </CCol>
                <CCol md="4">
                  <CInput
                    label="ชื่อประเภททุน"
                    placeholder="เช่น ทุนนักวิจัยรุ่นใหม่"
                    v-model.trim="type.label"
                  />
                </CCol>
                <CCol md="4">
                  <CInput
                    type="number"
                    min="0"
                    step="1000"
                    label="เพดานงบประมาณ (บาท)"
                    v-model.number="type.budgetLimit"
                  />
                </CCol>
              </CRow>

              <div class="funding-suboptions-title">ตัวเลือกทุนย่อย</div>
              <div class="table-responsive funding-suboptions-table">
                <table class="table table-bordered table-striped mb-0">
                  <thead>
                    <tr>
                      <th style="width: 22%;">รหัสทุนย่อย</th>
                      <th>ชื่อทุนย่อย</th>
                      <th style="width: 120px;">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(subOption, subIndex) in type.subOptions"
                      :key="`${subOption.key || 'sub'}-${typeIndex}-${subIndex}`"
                    >
                      <td>
                        <input
                          class="form-control"
                          :value="subOption.key"
                          placeholder="เช่น economic-development"
                          @input="updateSubOptionKey(typeIndex, subIndex, $event.target.value)"
                          @blur="applySubOptionKey(typeIndex, subIndex)"
                        />
                      </td>
                      <td>
                        <input
                          class="form-control"
                          :value="subOption.label"
                          placeholder="เช่น เศรษฐกิจสร้างสรรค์"
                          @input="updateSubOptionLabel(typeIndex, subIndex, $event.target.value)"
                        />
                      </td>
                      <td class="text-center">
                        <CButton
                          color="danger"
                          variant="outline"
                          size="sm"
                          @click="removeFundingSubOption(typeIndex, subIndex)"
                        >
                          <CIcon name="cil-x" class="mr-1" /> ลบ
                        </CButton>
                      </td>
                    </tr>
                    <tr v-if="!type.subOptions || type.subOptions.length === 0">
                      <td colspan="3" class="text-center text-muted">ยังไม่มีทุนย่อยสำหรับประเภททุนนี้</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="mt-3">
                <CButton color="secondary" variant="outline" size="sm" @click="addFundingSubOption(typeIndex)">
                  <CIcon name="cil-plus" class="mr-1" /> เพิ่มทุนย่อย
                </CButton>
              </div>
            </CCardBody>
          </CCard>

          <div class="funding-budget-actions">
            <CButton color="secondary" variant="outline" @click="addFundingType">
              <CIcon name="cil-plus" class="mr-1" /> เพิ่มประเภททุน
            </CButton>
            <CButton color="warning" variant="outline" @click="resetToDefault">
              <CIcon name="cil-reload" class="mr-1" /> รีเซ็ตค่าเริ่มต้น
            </CButton>
            <CButton color="primary" :disabled="saving" @click="saveFundingBudgetConfig">
              <CIcon name="cil-save" class="mr-1" /> {{ saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทุน' }}
            </CButton>
          </div>
        </template>
      </CCardBody>
    </CCard>

    <CCard class="mt-3">
      <CCardHeader>
        <div class="funding-budget-toolbar">
          <div>
            <div class="font-weight-bold">ตั้งค่ารูปแบบตัวคูณงบประมาณ</div>
            <small class="text-muted">
              เพิ่ม/ลด/ปรับชื่อ ค่าเริ่มต้น และค่าสูงสุดของตัวคูณในแต่ละหมวด เพื่อใช้ในหน้า BudgetSectionDemo
            </small>
          </div>
          <div class="funding-budget-summary">
            <CBadge color="info">หมวดงบ {{ budgetMultiplierConfig.length }}</CBadge>
            <CBadge color="secondary">ตัวคูณทั้งหมด {{ totalMultiplierCount }}</CBadge>
          </div>
        </div>
      </CCardHeader>

      <CCardBody>
        <div v-if="loading" class="text-center py-4">
          <CSpinner color="primary" />
          <div class="mt-2 text-muted">กำลังโหลดรูปแบบตัวคูณ...</div>
        </div>

        <template v-else>
          <CCard
            v-for="(category, categoryIndex) in budgetMultiplierConfig"
            :key="`budget-multiplier-${category.categoryKey}-${categoryIndex}`"
            class="funding-type-card mb-3"
          >
            <CCardHeader class="funding-type-card__header">
              <div class="font-weight-bold">
                {{ category.categoryLabel || category.categoryKey }}
                <small class="text-muted ml-1">({{ category.categoryKey }})</small>
              </div>
              <CButton color="secondary" variant="outline" size="sm" @click="addBudgetMultiplier(categoryIndex)">
                <CIcon name="cil-plus" class="mr-1" /> เพิ่มตัวคูณ
              </CButton>
            </CCardHeader>
            <CCardBody>
              <div class="table-responsive funding-suboptions-table">
                <table class="table table-bordered table-striped mb-0">
                  <thead>
                    <tr>
                      <th style="width: 38%;">ชื่อตัวคูณ</th>
                      <th style="width: 20%;">ค่าเริ่มต้น</th>
                      <th style="width: 22%;">ค่าสูงสุดที่กรอกได้</th>
                      <th style="width: 20%;">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(multiplier, multiplierIndex) in category.multipliers"
                      :key="`${category.categoryKey}-multiplier-${multiplierIndex}`"
                    >
                      <td>
                        <input
                          class="form-control"
                          :value="multiplier.label"
                          placeholder="เช่น จำนวน (คน)"
                          @input="updateBudgetMultiplierLabel(categoryIndex, multiplierIndex, $event.target.value)"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          class="form-control"
                          :value="multiplier.value"
                          placeholder="0"
                          @input="updateBudgetMultiplierValue(categoryIndex, multiplierIndex, $event.target.value)"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          class="form-control"
                          :value="multiplier.maxValue"
                          placeholder="ไม่จำกัด"
                          @input="updateBudgetMultiplierMaxValue(categoryIndex, multiplierIndex, $event.target.value)"
                        />
                      </td>
                      <td class="text-center">
                        <CButton
                          color="danger"
                          variant="outline"
                          size="sm"
                          :disabled="category.multipliers.length <= 1"
                          @click="removeBudgetMultiplier(categoryIndex, multiplierIndex)"
                        >
                          <CIcon name="cil-x" class="mr-1" /> ลบ
                        </CButton>
                      </td>
                    </tr>
                    <tr v-if="!category.multipliers || category.multipliers.length === 0">
                      <td colspan="4" class="text-center text-muted">ยังไม่มีตัวคูณในหมวดนี้</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="funding-suboptions-title mt-3">รายการเฉพาะในหมวด (Override)</div>
              <small class="text-muted d-block mb-2">
                ระบบจะใช้รูปแบบตัวคูณนี้เมื่อชื่อรายการมีคำที่ระบุ เช่น ผู้ให้ข้อมูล
              </small>

              <div
                v-for="(itemOverride, overrideIndex) in category.itemOverrides"
                :key="`${category.categoryKey}-override-${overrideIndex}`"
                class="budget-item-override-card"
              >
                <div class="d-flex justify-content-between align-items-center flex-wrap mb-2" style="gap: 8px;">
                  <strong>รายการเฉพาะ {{ overrideIndex + 1 }}</strong>
                  <CButton
                    color="danger"
                    variant="outline"
                    size="sm"
                    @click="removeBudgetItemOverride(categoryIndex, overrideIndex)"
                  >
                    <CIcon name="cil-x" class="mr-1" /> ลบรายการเฉพาะ
                  </CButton>
                </div>

                <div class="mb-2">
                  <label class="mb-1 font-weight-bold">คำที่ใช้จับคู่ในชื่อรายการ</label>
                  <input
                    class="form-control"
                    :value="itemOverride.matchText"
                    placeholder="เช่น ผู้ให้ข้อมูล"
                    @input="updateBudgetItemOverrideMatchText(categoryIndex, overrideIndex, $event.target.value)"
                  />
                </div>

                <div class="table-responsive funding-suboptions-table">
                  <table class="table table-bordered table-striped mb-0">
                    <thead>
                      <tr>
                        <th style="width: 38%;">ชื่อตัวคูณ</th>
                        <th style="width: 20%;">ค่าเริ่มต้น</th>
                        <th style="width: 22%;">ค่าสูงสุดที่กรอกได้</th>
                        <th style="width: 20%;">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(overrideMultiplier, overrideMultiplierIndex) in itemOverride.multipliers"
                        :key="`${category.categoryKey}-override-${overrideIndex}-multiplier-${overrideMultiplierIndex}`"
                      >
                        <td>
                          <input
                            class="form-control"
                            :value="overrideMultiplier.label"
                            placeholder="เช่น จำนวน (คน)"
                            @input="updateBudgetItemOverrideMultiplierLabel(categoryIndex, overrideIndex, overrideMultiplierIndex, $event.target.value)"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            class="form-control"
                            :value="overrideMultiplier.value"
                            placeholder="0"
                            @input="updateBudgetItemOverrideMultiplierValue(categoryIndex, overrideIndex, overrideMultiplierIndex, $event.target.value)"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            class="form-control"
                            :value="overrideMultiplier.maxValue"
                            placeholder="ไม่จำกัด"
                            @input="updateBudgetItemOverrideMultiplierMaxValue(categoryIndex, overrideIndex, overrideMultiplierIndex, $event.target.value)"
                          />
                        </td>
                        <td class="text-center">
                          <CButton
                            color="danger"
                            variant="outline"
                            size="sm"
                            :disabled="itemOverride.multipliers.length <= 1"
                            @click="removeBudgetItemOverrideMultiplier(categoryIndex, overrideIndex, overrideMultiplierIndex)"
                          >
                            <CIcon name="cil-x" class="mr-1" /> ลบ
                          </CButton>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="mt-2">
                  <CButton
                    color="secondary"
                    variant="outline"
                    size="sm"
                    @click="addBudgetItemOverrideMultiplier(categoryIndex, overrideIndex)"
                  >
                    <CIcon name="cil-plus" class="mr-1" /> เพิ่มตัวคูณของรายการนี้
                  </CButton>
                </div>
              </div>

              <div class="mt-2">
                <CButton color="secondary" variant="outline" size="sm" @click="addBudgetItemOverride(categoryIndex)">
                  <CIcon name="cil-plus" class="mr-1" /> เพิ่มรายการเฉพาะในหมวดนี้
                </CButton>
              </div>
            </CCardBody>
          </CCard>

          <div class="funding-budget-actions">
            <CButton color="warning" variant="outline" @click="resetBudgetMultipliersToDefault">
              <CIcon name="cil-reload" class="mr-1" /> รีเซ็ตค่าเริ่มต้น
            </CButton>
            <CButton color="primary" :disabled="savingMultiplier" @click="saveBudgetMultiplierConfig">
              <CIcon name="cil-save" class="mr-1" /> {{ savingMultiplier ? 'กำลังบันทึก...' : 'บันทึกรูปแบบตัวคูณ' }}
            </CButton>
          </div>
        </template>
      </CCardBody>
    </CCard>
  </div>
</template>

<script>
import { instance as axios } from '@/service/api'
import Swal from 'sweetalert2'
import {
  FUNDING_BUDGET_SETTING_KEY,
  FUNDING_BUDGET_LOCAL_FALLBACK_KEY,
  createDefaultFundingBudgetConfig,
  parseFundingBudgetSettingValue,
  normalizeFundingBudgetConfig as normalizeFundingBudgetConfigUtil,
  normalizeFundingBudgetKey,
  sanitizeFundingBudgetConfigForSave as sanitizeFundingBudgetConfigForSaveUtil,
  toBudgetLimitNumber as toBudgetLimitNumberUtil
} from '@/ResearchFormRS/utils/fundingBudgetConfig'
import {
  BUDGET_MULTIPLIER_SETTING_KEY,
  BUDGET_MULTIPLIER_LOCAL_FALLBACK_KEY,
  createDefaultBudgetMultiplierConfig,
  parseBudgetMultiplierSettingValue,
  normalizeBudgetMultiplierConfig as normalizeBudgetMultiplierConfigUtil,
  sanitizeBudgetMultiplierConfigForSave as sanitizeBudgetMultiplierConfigForSaveUtil,
  toMultiplierNumber as toMultiplierNumberUtil,
  toMultiplierMaxNumber as toMultiplierMaxNumberUtil
} from '@/ResearchFormRS/utils/budgetMultiplierConfig'

const createFundingTypeTemplate = () => ({ key: '', label: '', budgetLimit: 0, subOptions: [] })
const createFundingSubOptionTemplate = () => ({ key: '', label: '' })
const createBudgetMultiplierTemplate = () => ({ label: '', value: 1, maxValue: null, isAdmin: false })
const createBudgetItemOverrideTemplate = () => ({
  matchText: '',
  multipliers: [createBudgetMultiplierTemplate()]
})

export default {
  name: 'AdminFundingBudgetSettings',
  data () {
    return {
      loading: false,
      saving: false,
      savingMultiplier: false,
      settingsCache: [],
      fundingBudgetConfig: createDefaultFundingBudgetConfig(),
      budgetMultiplierConfig: createDefaultBudgetMultiplierConfig()
    }
  },
  computed: {
    totalSubOptionCount () {
      return this.fundingBudgetConfig.reduce((sum, type) => (
        sum + ((type && Array.isArray(type.subOptions)) ? type.subOptions.length : 0)
      ), 0)
    },
    totalMultiplierCount () {
      return this.budgetMultiplierConfig.reduce((sum, category) => (
        sum + ((category && Array.isArray(category.multipliers)) ? category.multipliers.length : 0)
      ), 0)
    }
  },
  async mounted () {
    this.loading = true
    try {
      await Promise.all([
        this.fetchFundingBudgetConfig(),
        this.fetchBudgetMultiplierConfig()
      ])
    } finally {
      this.loading = false
    }
  },
  methods: {
    parseSettingsPayload (response) {
      const payload = response && response.data && response.data.data
      if (Array.isArray(payload)) return payload
      if (payload && Array.isArray(payload.settings)) return payload.settings
      if (Array.isArray(response && response.data)) return response.data
      return []
    },
    normalizeFundingKey (value) {
      return normalizeFundingBudgetKey(value)
    },
    toBudgetLimitNumber (value, fallback = 0) {
      return toBudgetLimitNumberUtil(value, fallback)
    },
    normalizeFundingBudgetConfig (rawConfig) {
      return normalizeFundingBudgetConfigUtil(rawConfig, { fallbackToDefault: true })
    },
    sanitizeFundingBudgetConfigForSave (config = this.fundingBudgetConfig) {
      return sanitizeFundingBudgetConfigForSaveUtil(config)
    },
    toMultiplierNumber (value, fallback = 0) {
      return toMultiplierNumberUtil(value, fallback)
    },
    toMultiplierMaxNumber (value, fallback = null) {
      return toMultiplierMaxNumberUtil(value, fallback)
    },
    normalizeBudgetMultiplierConfig (rawConfig) {
      return normalizeBudgetMultiplierConfigUtil(rawConfig, { fallbackToDefault: true })
    },
    sanitizeBudgetMultiplierConfigForSave (config = this.budgetMultiplierConfig) {
      return sanitizeBudgetMultiplierConfigForSaveUtil(config)
    },
    validateFundingBudgetPayload (payload) {
      if (!Array.isArray(payload) || payload.length === 0) {
        return 'กรุณาเพิ่มประเภททุนอย่างน้อย 1 รายการ'
      }

      const typeKeySet = new Set()
      for (let typeIndex = 0; typeIndex < payload.length; typeIndex += 1) {
        const type = payload[typeIndex]
        const typeNo = typeIndex + 1
        if (!type.key) return `ประเภททุนลำดับที่ ${typeNo}: กรุณากรอกรหัสประเภททุน`
        if (!/^[a-z0-9-]+$/.test(type.key)) {
          return `ประเภททุนลำดับที่ ${typeNo}: รหัสใช้ได้เฉพาะ a-z, 0-9 และ -`
        }
        if (typeKeySet.has(type.key)) return `พบรหัสประเภททุนซ้ำ: ${type.key}`
        typeKeySet.add(type.key)

        if (!type.label) return `ประเภททุนลำดับที่ ${typeNo}: กรุณากรอกชื่อประเภททุน`
        if (!Number.isFinite(type.budgetLimit) || type.budgetLimit < 0) {
          return `ประเภททุนลำดับที่ ${typeNo}: งบประมาณไม่ถูกต้อง`
        }

        const subKeySet = new Set()
        for (let subIndex = 0; subIndex < type.subOptions.length; subIndex += 1) {
          const subOption = type.subOptions[subIndex]
          const subNo = subIndex + 1
          if (!subOption.key) return `ทุนย่อยลำดับที่ ${subNo} ของ "${type.label}": กรุณากรอกรหัส`
          if (!/^[a-z0-9-]+$/.test(subOption.key)) {
            return `ทุนย่อยลำดับที่ ${subNo} ของ "${type.label}": รหัสใช้ได้เฉพาะ a-z, 0-9 และ -`
          }
          if (subKeySet.has(subOption.key)) return `พบรหัสทุนย่อยซ้ำใน "${type.label}": ${subOption.key}`
          subKeySet.add(subOption.key)

          if (!subOption.label) return `ทุนย่อยลำดับที่ ${subNo} ของ "${type.label}": กรุณากรอกชื่อ`
        }
      }

      return ''
    },
    validateBudgetMultiplierPayload (payload) {
      if (!Array.isArray(payload) || payload.length === 0) {
        return 'ไม่พบข้อมูลรูปแบบตัวคูณ'
      }

      for (let categoryIndex = 0; categoryIndex < payload.length; categoryIndex += 1) {
        const category = payload[categoryIndex]
        const categoryLabel = category && (category.categoryLabel || category.categoryKey || `หมวดที่ ${categoryIndex + 1}`)
        const multipliers = Array.isArray(category && category.multipliers) ? category.multipliers : []
        if (!multipliers.length) return `${categoryLabel}: ต้องมีอย่างน้อย 1 ตัวคูณ`

        for (let multiplierIndex = 0; multiplierIndex < multipliers.length; multiplierIndex += 1) {
          const multiplier = multipliers[multiplierIndex]
          const no = multiplierIndex + 1
          if (!String(multiplier && multiplier.label || '').trim()) {
            return `${categoryLabel}: ตัวคูณลำดับที่ ${no} ต้องระบุชื่อ`
          }
          const numeric = Number(multiplier && multiplier.value)
          if (!Number.isFinite(numeric) || numeric < 0) {
            return `${categoryLabel}: ตัวคูณลำดับที่ ${no} มีค่าเริ่มต้นไม่ถูกต้อง`
          }
          const maxValue = this.toMultiplierMaxNumber(multiplier && multiplier.maxValue, null)
          if (maxValue !== null && numeric > maxValue) {
            return `${categoryLabel}: ตัวคูณลำดับที่ ${no} ต้องมีค่าสูงสุดมากกว่าหรือเท่ากับค่าเริ่มต้น`
          }
        }

        const itemOverrides = Array.isArray(category && category.itemOverrides) ? category.itemOverrides : []
        for (let overrideIndex = 0; overrideIndex < itemOverrides.length; overrideIndex += 1) {
          const itemOverride = itemOverrides[overrideIndex]
          const overrideNo = overrideIndex + 1
          const matchText = String(itemOverride && itemOverride.matchText || '').trim()
          if (!matchText) {
            return `${categoryLabel}: รายการเฉพาะลำดับที่ ${overrideNo} ต้องระบุคำจับคู่`
          }

          const overrideMultipliers = Array.isArray(itemOverride && itemOverride.multipliers) ? itemOverride.multipliers : []
          if (!overrideMultipliers.length) {
            return `${categoryLabel}: รายการเฉพาะลำดับที่ ${overrideNo} ต้องมีอย่างน้อย 1 ตัวคูณ`
          }

          for (let overrideMultiplierIndex = 0; overrideMultiplierIndex < overrideMultipliers.length; overrideMultiplierIndex += 1) {
            const overrideMultiplier = overrideMultipliers[overrideMultiplierIndex]
            const overrideMultiplierNo = overrideMultiplierIndex + 1
            if (!String(overrideMultiplier && overrideMultiplier.label || '').trim()) {
              return `${categoryLabel}: รายการเฉพาะลำดับที่ ${overrideNo} ตัวคูณลำดับที่ ${overrideMultiplierNo} ต้องระบุชื่อ`
            }
            const overrideNumeric = Number(overrideMultiplier && overrideMultiplier.value)
            if (!Number.isFinite(overrideNumeric) || overrideNumeric < 0) {
              return `${categoryLabel}: รายการเฉพาะลำดับที่ ${overrideNo} ตัวคูณลำดับที่ ${overrideMultiplierNo} มีค่าเริ่มต้นไม่ถูกต้อง`
            }
            const overrideMaxValue = this.toMultiplierMaxNumber(overrideMultiplier && overrideMultiplier.maxValue, null)
            if (overrideMaxValue !== null && overrideNumeric > overrideMaxValue) {
              return `${categoryLabel}: รายการเฉพาะลำดับที่ ${overrideNo} ตัวคูณลำดับที่ ${overrideMultiplierNo} ต้องมีค่าสูงสุดมากกว่าหรือเท่ากับค่าเริ่มต้น`
            }
          }
        }
      }

      return ''
    },
    saveFallback () {
      const payload = {
        fundingBudgetConfig: this.sanitizeFundingBudgetConfigForSave(),
        savedAt: new Date().toISOString()
      }
      localStorage.setItem(FUNDING_BUDGET_LOCAL_FALLBACK_KEY, JSON.stringify(payload))
    },
    loadFallback () {
      try {
        const raw = localStorage.getItem(FUNDING_BUDGET_LOCAL_FALLBACK_KEY)
        if (!raw) return false
        const parsed = JSON.parse(raw)
        if (!parsed || !Array.isArray(parsed.fundingBudgetConfig)) return false
        this.fundingBudgetConfig = this.normalizeFundingBudgetConfig(parsed.fundingBudgetConfig)
        return true
      } catch (error) {
        console.error('[AdminFundingBudgetSettings] load fallback error:', error)
        return false
      }
    },
    saveBudgetMultiplierFallback () {
      const payload = {
        budgetMultiplierConfig: this.sanitizeBudgetMultiplierConfigForSave(),
        savedAt: new Date().toISOString()
      }
      localStorage.setItem(BUDGET_MULTIPLIER_LOCAL_FALLBACK_KEY, JSON.stringify(payload))
    },
    loadBudgetMultiplierFallback () {
      try {
        const raw = localStorage.getItem(BUDGET_MULTIPLIER_LOCAL_FALLBACK_KEY)
        if (!raw) return false
        const parsed = JSON.parse(raw)
        if (!parsed || !Array.isArray(parsed.budgetMultiplierConfig)) return false
        this.budgetMultiplierConfig = this.normalizeBudgetMultiplierConfig(parsed.budgetMultiplierConfig)
        return true
      } catch (error) {
        console.error('[AdminFundingBudgetSettings] load multiplier fallback error:', error)
        return false
      }
    },
    async fetchSettingCache () {
      const response = await axios.get('/api/v1/setting')
      this.settingsCache = this.parseSettingsPayload(response)
      return this.settingsCache
    },
    findSettingByKey (key) {
      return (Array.isArray(this.settingsCache) ? this.settingsCache : []).find(item => item && item.key === key)
    },
    async upsertSettingByKey (key, value, description, group) {
      if (!Array.isArray(this.settingsCache) || this.settingsCache.length === 0) await this.fetchSettingCache()
      let existed = this.findSettingByKey(key)
      if (!existed) {
        await this.fetchSettingCache()
        existed = this.findSettingByKey(key)
      }

      if (existed && existed._id) {
        await axios.put(`/api/v1/setting/${existed._id}`, { value, description })
      } else {
        await axios.post('/api/v1/setting', { key, value, description, group })
      }
    },
    async fetchFundingBudgetConfig () {
      try {
        const settings = await this.fetchSettingCache()
        const setting = settings.find(item => item && item.key === FUNDING_BUDGET_SETTING_KEY)
        const rawValue = setting ? setting.value : null
        this.fundingBudgetConfig = parseFundingBudgetSettingValue(rawValue, { fallbackToDefault: true })
        this.saveFallback()
      } catch (error) {
        console.error('[AdminFundingBudgetSettings] fetch config error:', error)
        if (!this.loadFallback()) this.fundingBudgetConfig = createDefaultFundingBudgetConfig()
      }
    },
    async fetchBudgetMultiplierConfig () {
      try {
        const settings = await this.fetchSettingCache()
        const setting = settings.find(item => item && item.key === BUDGET_MULTIPLIER_SETTING_KEY)
        const rawValue = setting ? setting.value : null
        this.budgetMultiplierConfig = parseBudgetMultiplierSettingValue(rawValue, { fallbackToDefault: true })
        this.saveBudgetMultiplierFallback()
      } catch (error) {
        console.error('[AdminFundingBudgetSettings] fetch multiplier config error:', error)
        if (!this.loadBudgetMultiplierFallback()) this.budgetMultiplierConfig = createDefaultBudgetMultiplierConfig()
      }
    },
    addFundingType () {
      this.fundingBudgetConfig.push(createFundingTypeTemplate())
    },
    async removeFundingType (typeIndex) {
      const target = this.fundingBudgetConfig[typeIndex]
      if (!target) return
      const result = await Swal.fire({
        icon: 'warning',
        title: `ลบประเภททุน "${target.label || target.key || `ลำดับที่ ${typeIndex + 1}`}" ?`,
        text: 'รายการทุนย่อยภายใต้ประเภททุนนี้จะถูกลบด้วย',
        showCancelButton: true,
        confirmButtonText: 'ลบรายการ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#e55353'
      })
      if (!result.isConfirmed) return
      this.fundingBudgetConfig.splice(typeIndex, 1)
    },
    addFundingSubOption (typeIndex) {
      if (!this.fundingBudgetConfig[typeIndex]) return
      if (!Array.isArray(this.fundingBudgetConfig[typeIndex].subOptions)) {
        this.$set(this.fundingBudgetConfig[typeIndex], 'subOptions', [])
      }
      this.fundingBudgetConfig[typeIndex].subOptions.push(createFundingSubOptionTemplate())
    },
    removeFundingSubOption (typeIndex, subIndex) {
      if (!this.fundingBudgetConfig[typeIndex] || !Array.isArray(this.fundingBudgetConfig[typeIndex].subOptions)) return
      this.fundingBudgetConfig[typeIndex].subOptions.splice(subIndex, 1)
    },
    applyFundingTypeKey (typeIndex) {
      if (!this.fundingBudgetConfig[typeIndex]) return
      this.$set(this.fundingBudgetConfig[typeIndex], 'key', this.normalizeFundingKey(this.fundingBudgetConfig[typeIndex].key))
    },
    applySubOptionKey (typeIndex, subIndex) {
      const subOption = this.fundingBudgetConfig[typeIndex] && this.fundingBudgetConfig[typeIndex].subOptions
        ? this.fundingBudgetConfig[typeIndex].subOptions[subIndex]
        : null
      if (!subOption) return
      this.$set(subOption, 'key', this.normalizeFundingKey(subOption.key))
    },
    updateSubOptionKey (typeIndex, subIndex, value) {
      const subOption = this.fundingBudgetConfig[typeIndex] && this.fundingBudgetConfig[typeIndex].subOptions
        ? this.fundingBudgetConfig[typeIndex].subOptions[subIndex]
        : null
      if (!subOption) return
      this.$set(subOption, 'key', value)
    },
    updateSubOptionLabel (typeIndex, subIndex, value) {
      const subOption = this.fundingBudgetConfig[typeIndex] && this.fundingBudgetConfig[typeIndex].subOptions
        ? this.fundingBudgetConfig[typeIndex].subOptions[subIndex]
        : null
      if (!subOption) return
      this.$set(subOption, 'label', value)
    },
    addBudgetMultiplier (categoryIndex) {
      const category = this.budgetMultiplierConfig[categoryIndex]
      if (!category) return
      if (!Array.isArray(category.multipliers)) {
        this.$set(category, 'multipliers', [])
      }
      category.multipliers.push({ ...createBudgetMultiplierTemplate(), label: 'ตัวคูณใหม่' })
    },
    removeBudgetMultiplier (categoryIndex, multiplierIndex) {
      const category = this.budgetMultiplierConfig[categoryIndex]
      if (!category || !Array.isArray(category.multipliers) || category.multipliers.length <= 1) return
      category.multipliers.splice(multiplierIndex, 1)
    },
    updateBudgetMultiplierLabel (categoryIndex, multiplierIndex, value) {
      const category = this.budgetMultiplierConfig[categoryIndex]
      const multiplier = category && Array.isArray(category.multipliers)
        ? category.multipliers[multiplierIndex]
        : null
      if (!multiplier) return
      this.$set(multiplier, 'label', value)
    },
    updateBudgetMultiplierValue (categoryIndex, multiplierIndex, value) {
      const category = this.budgetMultiplierConfig[categoryIndex]
      const multiplier = category && Array.isArray(category.multipliers)
        ? category.multipliers[multiplierIndex]
        : null
      if (!multiplier) return
      this.$set(multiplier, 'value', this.toMultiplierNumber(value, 0))
    },
    updateBudgetMultiplierMaxValue (categoryIndex, multiplierIndex, value) {
      const category = this.budgetMultiplierConfig[categoryIndex]
      const multiplier = category && Array.isArray(category.multipliers)
        ? category.multipliers[multiplierIndex]
        : null
      if (!multiplier) return
      this.$set(multiplier, 'maxValue', this.toMultiplierMaxNumber(value, null))
    },
    addBudgetItemOverride (categoryIndex) {
      const category = this.budgetMultiplierConfig[categoryIndex]
      if (!category) return
      if (!Array.isArray(category.itemOverrides)) {
        this.$set(category, 'itemOverrides', [])
      }
      category.itemOverrides.push(createBudgetItemOverrideTemplate())
    },
    removeBudgetItemOverride (categoryIndex, overrideIndex) {
      const category = this.budgetMultiplierConfig[categoryIndex]
      if (!category || !Array.isArray(category.itemOverrides)) return
      category.itemOverrides.splice(overrideIndex, 1)
    },
    updateBudgetItemOverrideMatchText (categoryIndex, overrideIndex, value) {
      const category = this.budgetMultiplierConfig[categoryIndex]
      const itemOverride = category && Array.isArray(category.itemOverrides)
        ? category.itemOverrides[overrideIndex]
        : null
      if (!itemOverride) return
      this.$set(itemOverride, 'matchText', value)
    },
    addBudgetItemOverrideMultiplier (categoryIndex, overrideIndex) {
      const category = this.budgetMultiplierConfig[categoryIndex]
      const itemOverride = category && Array.isArray(category.itemOverrides)
        ? category.itemOverrides[overrideIndex]
        : null
      if (!itemOverride) return
      if (!Array.isArray(itemOverride.multipliers)) {
        this.$set(itemOverride, 'multipliers', [])
      }
      itemOverride.multipliers.push(createBudgetMultiplierTemplate())
    },
    removeBudgetItemOverrideMultiplier (categoryIndex, overrideIndex, overrideMultiplierIndex) {
      const category = this.budgetMultiplierConfig[categoryIndex]
      const itemOverride = category && Array.isArray(category.itemOverrides)
        ? category.itemOverrides[overrideIndex]
        : null
      if (!itemOverride || !Array.isArray(itemOverride.multipliers) || itemOverride.multipliers.length <= 1) return
      itemOverride.multipliers.splice(overrideMultiplierIndex, 1)
    },
    updateBudgetItemOverrideMultiplierLabel (categoryIndex, overrideIndex, overrideMultiplierIndex, value) {
      const category = this.budgetMultiplierConfig[categoryIndex]
      const itemOverride = category && Array.isArray(category.itemOverrides)
        ? category.itemOverrides[overrideIndex]
        : null
      const multiplier = itemOverride && Array.isArray(itemOverride.multipliers)
        ? itemOverride.multipliers[overrideMultiplierIndex]
        : null
      if (!multiplier) return
      this.$set(multiplier, 'label', value)
    },
    updateBudgetItemOverrideMultiplierValue (categoryIndex, overrideIndex, overrideMultiplierIndex, value) {
      const category = this.budgetMultiplierConfig[categoryIndex]
      const itemOverride = category && Array.isArray(category.itemOverrides)
        ? category.itemOverrides[overrideIndex]
        : null
      const multiplier = itemOverride && Array.isArray(itemOverride.multipliers)
        ? itemOverride.multipliers[overrideMultiplierIndex]
        : null
      if (!multiplier) return
      this.$set(multiplier, 'value', this.toMultiplierNumber(value, 0))
    },
    updateBudgetItemOverrideMultiplierMaxValue (categoryIndex, overrideIndex, overrideMultiplierIndex, value) {
      const category = this.budgetMultiplierConfig[categoryIndex]
      const itemOverride = category && Array.isArray(category.itemOverrides)
        ? category.itemOverrides[overrideIndex]
        : null
      const multiplier = itemOverride && Array.isArray(itemOverride.multipliers)
        ? itemOverride.multipliers[overrideMultiplierIndex]
        : null
      if (!multiplier) return
      this.$set(multiplier, 'maxValue', this.toMultiplierMaxNumber(value, null))
    },
    async resetBudgetMultipliersToDefault () {
      const result = await Swal.fire({
        icon: 'warning',
        title: 'รีเซ็ตรูปแบบตัวคูณเป็นค่าเริ่มต้น?',
        text: 'การแก้ไขรูปแบบตัวคูณในหน้าจอจะถูกแทนที่ด้วยค่ามาตรฐาน',
        showCancelButton: true,
        confirmButtonText: 'รีเซ็ต',
        cancelButtonText: 'ยกเลิก'
      })
      if (!result.isConfirmed) return
      this.budgetMultiplierConfig = createDefaultBudgetMultiplierConfig()
    },
    async resetToDefault () {
      const result = await Swal.fire({
        icon: 'warning',
        title: 'รีเซ็ตเป็นค่าเริ่มต้น?',
        text: 'ข้อมูลที่แก้ไขอยู่ในหน้าจอจะถูกแทนที่ด้วยค่าเริ่มต้น',
        showCancelButton: true,
        confirmButtonText: 'รีเซ็ต',
        cancelButtonText: 'ยกเลิก'
      })
      if (!result.isConfirmed) return
      this.fundingBudgetConfig = createDefaultFundingBudgetConfig()
    },
    async saveBudgetMultiplierConfig () {
      const payload = this.sanitizeBudgetMultiplierConfigForSave()
      const validationError = this.validateBudgetMultiplierPayload(payload)
      if (validationError) {
        await Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: validationError })
        return
      }

      this.savingMultiplier = true
      try {
        await this.upsertSettingByKey(
          BUDGET_MULTIPLIER_SETTING_KEY,
          JSON.stringify(payload),
          'รูปแบบตัวคูณเริ่มต้นของแต่ละหมวดงบประมาณ',
          'general'
        )
        this.budgetMultiplierConfig = this.normalizeBudgetMultiplierConfig(payload)
        this.saveBudgetMultiplierFallback()
        await this.fetchBudgetMultiplierConfig()
        await Swal.fire({
          icon: 'success',
          title: 'บันทึกรูปแบบตัวคูณสำเร็จ',
          timer: 1300,
          showConfirmButton: false
        })
      } catch (error) {
        console.error('[AdminFundingBudgetSettings] save multiplier fallback:', error)
        this.saveBudgetMultiplierFallback()
        await Swal.fire({
          icon: 'info',
          title: 'บันทึกในเครื่องแล้ว',
          text: 'API ยังไม่พร้อม จึงบันทึกรูปแบบตัวคูณแบบ local fallback'
        })
      } finally {
        this.savingMultiplier = false
      }
    },
    async saveFundingBudgetConfig () {
      const payload = this.sanitizeFundingBudgetConfigForSave()
      const validationError = this.validateFundingBudgetPayload(payload)
      if (validationError) {
        await Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: validationError })
        return
      }

      this.saving = true
      try {
        await this.upsertSettingByKey(
          FUNDING_BUDGET_SETTING_KEY,
          JSON.stringify(payload),
          'โครงสร้างประเภททุน ทุนย่อย และเพดานงบประมาณ',
          'general'
        )
        this.fundingBudgetConfig = this.normalizeFundingBudgetConfig(payload)
        this.saveFallback()
        await this.fetchFundingBudgetConfig()
        await Swal.fire({
          icon: 'success',
          title: 'บันทึกการตั้งค่าทุนสำเร็จ',
          timer: 1300,
          showConfirmButton: false
        })
      } catch (error) {
        console.error('[AdminFundingBudgetSettings] save fallback:', error)
        this.saveFallback()
        await Swal.fire({
          icon: 'info',
          title: 'บันทึกในเครื่องแล้ว',
          text: 'API ยังไม่พร้อม จึงบันทึกแบบ local fallback'
        })
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.admin-funding-budget-settings {
  width: 100%;
}

.funding-budget-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.funding-budget-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.funding-budget-empty {
  background: #ffffff;
  border: 1px dashed rgba(140, 21, 21, 0.32);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.funding-type-card {
  border: 1px solid rgba(140, 21, 21, 0.16);
}

.funding-type-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.funding-suboptions-title {
  margin-top: 6px;
  margin-bottom: 8px;
  color: #6b0f0f;
  font-weight: 700;
}

.funding-suboptions-table {
  border-radius: 10px;
}

.budget-item-override-card {
  margin-top: 10px;
  padding: 12px;
  border: 1px solid rgba(140, 21, 21, 0.14);
  border-radius: 10px;
  background: #ffffff;
}

.funding-budget-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

[data-coreui-theme='dark'] .funding-budget-empty,
body.c-dark-theme .funding-budget-empty {
  background: #1b2735;
  border-color: rgba(126, 164, 207, 0.45);
}

[data-coreui-theme='dark'] .funding-suboptions-title,
body.c-dark-theme .funding-suboptions-title {
  color: #dbe8f6;
}

[data-coreui-theme='dark'] .budget-item-override-card,
body.c-dark-theme .budget-item-override-card {
  background: #1b2735;
  border-color: rgba(126, 164, 207, 0.35);
}

@media (max-width: 768px) {
  .funding-budget-actions {
    justify-content: flex-start;
  }
}
</style>
