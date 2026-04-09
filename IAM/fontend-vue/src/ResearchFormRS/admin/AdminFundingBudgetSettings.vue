<template>
  <div class="admin-funding-budget-settings">
    <CCard class="mt-3">
      <CCardHeader>
        <div class="funding-budget-toolbar">
          <div>
            <div class="font-weight-bold">{{ $t('fundingBudget.title') }}</div>
            <small class="text-muted">
              {{ $t('fundingBudget.subtitle') }}
            </small>
          </div>
          <div class="funding-budget-summary">
            <CBadge color="info">{{ $t('fundingBudget.badgeFundingType') }} {{ fundingBudgetConfig.length }}</CBadge>
            <CBadge color="secondary">{{ $t('fundingBudget.badgeSubOption') }} {{ totalSubOptionCount }}</CBadge>
          </div>
        </div>
      </CCardHeader>

      <CCardBody>
        <div v-if="loading" class="text-center py-4">
          <CSpinner color="primary" />
          <div class="mt-2 text-muted">{{ $t('fundingBudget.loading') }}</div>
        </div>

        <template v-else>
          <div v-if="fundingBudgetConfig.length === 0" class="funding-budget-empty">
            <div class="font-weight-bold mb-2">{{ $t('fundingBudget.emptyTitle') }}</div>
            <small class="text-muted d-block mb-3">{{ $t('fundingBudget.emptyHint') }}</small>
            <CButton color="primary" @click="addFundingType">
              <CIcon name="cil-plus" class="mr-1" /> {{ $t('fundingBudget.addTypeBtn') }}
            </CButton>
          </div>

          <CCard
            v-for="(type, typeIndex) in fundingBudgetConfig"
            :key="`${type.key || 'funding-type'}-${typeIndex}`"
            class="funding-type-card mb-3"
          >
            <CCardHeader class="funding-type-card__header">
              <div class="font-weight-bold">{{ $t('fundingBudget.typeHeader', { n: typeIndex + 1 }) }}</div>
              <CButton color="danger" variant="outline" size="sm" @click="removeFundingType(typeIndex)">
                <CIcon name="cil-trash" class="mr-1" /> {{ $t('fundingBudget.removeTypeBtn') }}
              </CButton>
            </CCardHeader>

            <CCardBody>
              <CRow>
                <CCol md="4">
                  <CInput
                    :label="$t('fundingBudget.keyLabel')"
                    :placeholder="$t('fundingBudget.keyPlaceholder')"
                    v-model.trim="type.key"
                    @blur="applyFundingTypeKey(typeIndex)"
                  />
                </CCol>
                <CCol md="4">
                  <CInput
                    :label="$t('fundingBudget.nameLabel')"
                    :placeholder="$t('fundingBudget.namePlaceholder')"
                    v-model.trim="type.label"
                  />
                </CCol>
                <CCol md="4">
                  <CInput
                    type="number"
                    min="0"
                    step="1000"
                    :label="$t('fundingBudget.budgetLimitLabel')"
                    v-model.number="type.budgetLimit"
                  />
                </CCol>
              </CRow>

              <div class="funding-suboptions-title">{{ $t('fundingBudget.subOptionsTitle') }}</div>
              <div class="table-responsive funding-suboptions-table">
                <table class="table table-bordered table-striped mb-0">
                  <thead>
                    <tr>
                      <th style="width: 22%;">{{ $t('fundingBudget.subKeyCol') }}</th>
                      <th>{{ $t('fundingBudget.subNameCol') }}</th>
                      <th style="width: 120px;">{{ $t('fundingBudget.manageCol') }}</th>
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
                          :placeholder="$t('fundingBudget.subKeyPlaceholder')"
                          @input="updateSubOptionKey(typeIndex, subIndex, $event.target.value)"
                          @blur="applySubOptionKey(typeIndex, subIndex)"
                        />
                      </td>
                      <td>
                        <input
                          class="form-control"
                          :value="subOption.label"
                          :placeholder="$t('fundingBudget.subNamePlaceholder')"
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
                          <CIcon name="cil-x" class="mr-1" /> {{ $t('fundingBudget.deleteBtn') }}
                        </CButton>
                      </td>
                    </tr>
                    <tr v-if="!type.subOptions || type.subOptions.length === 0">
                      <td colspan="3" class="text-center text-muted">{{ $t('fundingBudget.subEmpty') }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="mt-3">
                <CButton color="secondary" variant="outline" size="sm" @click="addFundingSubOption(typeIndex)">
                  <CIcon name="cil-plus" class="mr-1" /> {{ $t('fundingBudget.addSubBtn') }}
                </CButton>
              </div>
            </CCardBody>
          </CCard>

          <div class="funding-budget-actions">
            <CButton color="secondary" variant="outline" @click="addFundingType">
              <CIcon name="cil-plus" class="mr-1" /> {{ $t('fundingBudget.addTypeBtn') }}
            </CButton>
            <CButton color="warning" variant="outline" @click="resetToDefault">
              <CIcon name="cil-reload" class="mr-1" /> {{ $t('fundingBudget.resetBtn') }}
            </CButton>
            <CButton color="primary" :disabled="saving" @click="saveFundingBudgetConfig">
              <CIcon name="cil-save" class="mr-1" /> {{ saving ? $t('fundingBudget.saving') : $t('fundingBudget.saveBtn') }}
            </CButton>
          </div>
        </template>
      </CCardBody>
    </CCard>

    <CCard class="mt-3">
      <CCardHeader>
        <div class="funding-budget-toolbar">
          <div>
            <div class="font-weight-bold">{{ $t('fundingBudget.multiplier.title') }}</div>
            <small class="text-muted">
              {{ $t('fundingBudget.multiplier.subtitle') }}
            </small>
          </div>
          <div class="funding-budget-summary">
            <CBadge color="info">{{ $t('fundingBudget.multiplier.badgeCategory') }} {{ budgetMultiplierConfig.length }}</CBadge>
            <CBadge color="secondary">{{ $t('fundingBudget.multiplier.badgeTotal') }} {{ totalMultiplierCount }}</CBadge>
          </div>
        </div>
      </CCardHeader>

      <CCardBody>
        <div v-if="loading" class="text-center py-4">
          <CSpinner color="primary" />
          <div class="mt-2 text-muted">{{ $t('fundingBudget.multiplier.loading') }}</div>
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
                <CIcon name="cil-plus" class="mr-1" /> {{ $t('fundingBudget.multiplier.addBtn') }}
              </CButton>
            </CCardHeader>
            <CCardBody>
              <div class="table-responsive funding-suboptions-table">
                <table class="table table-bordered table-striped mb-0">
                  <thead>
                    <tr>
                      <th style="width: 32%;">{{ $t('fundingBudget.multiplier.colName') }}</th>
                      <th style="width: 17%;">{{ $t('fundingBudget.multiplier.colDefault') }}</th>
                      <th style="width: 19%;">{{ $t('fundingBudget.multiplier.colMax') }}</th>
                      <th style="width: 16%;">{{ $t('fundingBudget.multiplier.colUserInput') }}</th>
                      <th style="width: 16%;">{{ $t('fundingBudget.manageCol') }}</th>
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
                          class="form-control"
                          :value="multiplier.maxValue"
                          placeholder="ไม่จำกัด, เช่น 5000 หรือ 10%"
                          @input="updateBudgetMultiplierMaxValue(categoryIndex, multiplierIndex, $event.target.value)"
                        />
                      </td>
                      <td class="text-center align-middle">
                        <div class="d-flex flex-column align-items-center">
                          <CSwitch
                            class="mx-1"
                            color="success"
                            :checked="!multiplier.isAdmin"
                            @update:checked="(checked) => updateBudgetMultiplierUserInputAllowed(categoryIndex, multiplierIndex, checked)"
                          />
                          <small :class="multiplier.isAdmin ? 'text-muted' : 'text-success'">
                            {{ multiplier.isAdmin ? $t('fundingBudget.multiplier.off') : $t('fundingBudget.multiplier.on') }}
                          </small>
                        </div>
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
                      <td colspan="5" class="text-center text-muted">{{ $t('fundingBudget.multiplier.empty') }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="funding-suboptions-title mt-3">{{ $t('fundingBudget.override.sectionTitle') }}</div>
              <small class="text-muted d-block mb-2">
                {{ $t('fundingBudget.override.sectionNote') }}
              </small>

              <div
                v-for="(itemOverride, overrideIndex) in category.itemOverrides"
                :key="`${category.categoryKey}-override-${overrideIndex}`"
                class="budget-item-override-card"
              >
                <div class="d-flex justify-content-between align-items-center flex-wrap mb-2" style="gap: 8px;">
                  <strong>{{ $t('fundingBudget.override.itemHeader', { n: overrideIndex + 1 }) }}</strong>
                  <CButton
                    color="danger"
                    variant="outline"
                    size="sm"
                    @click="removeBudgetItemOverride(categoryIndex, overrideIndex)"
                  >
                    <CIcon name="cil-x" class="mr-1" /> {{ $t('fundingBudget.override.removeBtn') }}
                  </CButton>
                </div>

                <div class="mb-2">
                  <label class="mb-1 font-weight-bold">{{ $t('fundingBudget.override.matchLabel') }}</label>
                  <input
                    class="form-control"
                    :value="itemOverride.matchText"
                    :placeholder="$t('fundingBudget.override.matchPlaceholder')"
                    @input="updateBudgetItemOverrideMatchText(categoryIndex, overrideIndex, $event.target.value)"
                  />
                </div>

                <div class="mb-3">
                  <label class="mb-1 font-weight-bold d-block">{{ $t('fundingBudget.override.applyToLabel') }}</label>
                  <div class="d-flex flex-wrap" style="gap: 12px;">
                    <label class="mb-0 d-inline-flex align-items-center" style="gap: 6px;">
                      <input
                        type="checkbox"
                        :checked="isOverrideAppliedToAllFundingTypes(itemOverride)"
                        @change="toggleBudgetItemOverrideApplyAllFundingTypes(categoryIndex, overrideIndex, $event.target.checked)"
                      >
                      <span>{{ $t('fundingBudget.override.applyAll') }}</span>
                    </label>
                    <label
                      v-for="option in fundingTypeSelectionOptions"
                      :key="`${category.categoryKey}-override-${overrideIndex}-funding-${option.key}`"
                      class="mb-0 d-inline-flex align-items-center"
                      style="gap: 6px;"
                    >
                      <input
                        type="checkbox"
                        :checked="isOverrideFundingTypeSelected(itemOverride, option.key)"
                        :disabled="isOverrideAppliedToAllFundingTypes(itemOverride)"
                        @change="toggleBudgetItemOverrideFundingType(categoryIndex, overrideIndex, option.key, $event.target.checked)"
                      >
                      <span :title="option.label">{{ option.shortLabel }}</span>
                    </label>
                  </div>
                  <small class="text-muted d-block mt-1">
                    {{ $t('fundingBudget.override.applyAllNote') }}
                  </small>
                </div>

                <div class="table-responsive funding-suboptions-table">
                  <table class="table table-bordered table-striped mb-0">
                    <thead>
                      <tr>
                        <th style="width: 32%;">{{ $t('fundingBudget.multiplier.colName') }}</th>
                        <th style="width: 17%;">{{ $t('fundingBudget.multiplier.colDefault') }}</th>
                        <th style="width: 19%;">{{ $t('fundingBudget.multiplier.colMax') }}</th>
                        <th style="width: 16%;">{{ $t('fundingBudget.multiplier.colUserInput') }}</th>
                        <th style="width: 16%;">{{ $t('fundingBudget.manageCol') }}</th>
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
                            class="form-control"
                            :value="overrideMultiplier.maxValue"
                            placeholder="ไม่จำกัด, เช่น 5000 หรือ 10%"
                            @input="updateBudgetItemOverrideMultiplierMaxValue(categoryIndex, overrideIndex, overrideMultiplierIndex, $event.target.value)"
                          />
                        </td>
                        <td class="text-center align-middle">
                          <div class="d-flex flex-column align-items-center">
                            <CSwitch
                              class="mx-1"
                              color="success"
                              :checked="!overrideMultiplier.isAdmin"
                              @update:checked="(checked) => updateBudgetItemOverrideMultiplierUserInputAllowed(categoryIndex, overrideIndex, overrideMultiplierIndex, checked)"
                            />
                            <small :class="overrideMultiplier.isAdmin ? 'text-muted' : 'text-success'">
                              {{ overrideMultiplier.isAdmin ? $t('fundingBudget.multiplier.off') : $t('fundingBudget.multiplier.on') }}
                            </small>
                          </div>
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
                    <CIcon name="cil-plus" class="mr-1" /> {{ $t('fundingBudget.override.addMultiplierBtn') }}
                  </CButton>
                </div>
              </div>

              <div class="mt-2">
                <CButton color="secondary" variant="outline" size="sm" @click="addBudgetItemOverride(categoryIndex)">
                  <CIcon name="cil-plus" class="mr-1" /> {{ $t('fundingBudget.override.addItemBtn') }}
                </CButton>
              </div>
            </CCardBody>
          </CCard>

          <div class="funding-budget-actions">
            <CButton color="warning" variant="outline" @click="resetBudgetMultipliersToDefault">
              <CIcon name="cil-reload" class="mr-1" /> {{ $t('fundingBudget.resetBtn') }}
            </CButton>
            <CButton color="primary" :disabled="savingMultiplier" @click="saveBudgetMultiplierConfig">
              <CIcon name="cil-save" class="mr-1" /> {{ savingMultiplier ? $t('fundingBudget.saving') : $t('fundingBudget.multiplier.saveBtn') }}
            </CButton>
          </div>
        </template>
      </CCardBody>
    </CCard>

    <CCard class="mt-3">
      <CCardHeader>
        <div class="funding-budget-toolbar">
          <div>
            <div class="font-weight-bold">เอกสารตัวอย่างแนบงบประมาณ</div>
            <small class="text-muted">
              กำหนดไฟล์ตัวอย่างสำหรับปุ่มเอกสารตัวอย่างใน TOR, Quotation, Specification, CV และ Service Rates
            </small>
          </div>
          <div class="funding-budget-summary">
            <CBadge color="info">ประเภทเอกสาร {{ budgetAttachmentExampleConfig.length }}</CBadge>
            <CBadge color="secondary">ไฟล์ตัวอย่าง {{ totalBudgetAttachmentExampleFileCount }}</CBadge>
          </div>
        </div>
      </CCardHeader>

      <CCardBody>
        <div v-if="loading" class="text-center py-4">
          <CSpinner color="primary" />
          <div class="mt-2 text-muted">กำลังโหลดการตั้งค่าเอกสารตัวอย่าง...</div>
        </div>

        <template v-else>
          <CCard
            v-for="(docType, docTypeIndex) in budgetAttachmentExampleConfig"
            :key="`budget-attachment-example-${docType.key}-${docTypeIndex}`"
            class="funding-type-card mb-3"
          >
            <CCardHeader class="funding-type-card__header">
              <div class="font-weight-bold">
                {{ docType.label || docType.key }}
                <small class="text-muted ml-1">({{ docType.key }})</small>
              </div>
              <CButton color="secondary" variant="outline" size="sm" @click="addBudgetAttachmentExampleFile(docTypeIndex)">
                <CIcon name="cil-plus" class="mr-1" /> เพิ่มไฟล์ตัวอย่าง
              </CButton>
            </CCardHeader>

            <CCardBody>
              <div class="table-responsive funding-suboptions-table">
                <table class="table table-bordered table-striped mb-0">
                  <thead>
                    <tr>
                      <th style="width: 38%;">ชื่อที่แสดง</th>
                      <th>ไฟล์ตัวอย่างจาก backend</th>
                      <th style="width: 160px;">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(file, fileIndex) in docType.files"
                      :key="`${docType.key}-file-${fileIndex}`"
                    >
                      <td>
                        <input
                          class="form-control"
                          :value="file.label"
                          placeholder="เช่น TOR กรณีการจ้างทั่วไป"
                          @input="updateBudgetAttachmentExampleFileLabel(docTypeIndex, fileIndex, $event.target.value)"
                        />
                      </td>
                      <td>
                        <div class="small font-weight-bold text-truncate">
                          {{ budgetAttachmentExampleDisplayName(file) || 'ยังไม่ได้เลือกไฟล์' }}
                        </div>
                        <div class="small text-muted mt-1">
                          <span v-if="file.uploading">กำลังอัปโหลดไฟล์...</span>
                          <span v-else-if="file.fileId">เก็บใน backend แล้ว</span>
                          <span v-else-if="file.fileName">รายการเดิมที่ยังอ้างชื่อไฟล์แบบเดิม</span>
                          <span v-else>ยังไม่ได้อัปโหลดไฟล์</span>
                        </div>
                        <div class="small text-muted" v-if="file.size">
                          {{ formatBudgetAttachmentExampleFileSize(file.size) }}
                        </div>
                        <input
                          :ref="budgetAttachmentExampleUploadRef(docTypeIndex, fileIndex)"
                          type="file"
                          class="d-none"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                          @change="onBudgetAttachmentExampleFileSelected(docTypeIndex, fileIndex, $event)"
                        />
                      </td>
                      <td class="text-center">
                        <div class="d-flex flex-column align-items-center" style="gap: 6px;">
                          <CButton color="secondary" variant="outline" size="sm" :disabled="file.uploading" @click="triggerBudgetAttachmentExampleUpload(docTypeIndex, fileIndex)">
                            <CIcon name="cil-cloud-upload" class="mr-1" /> {{ file.fileId || file.fileName ? 'เปลี่ยนไฟล์' : 'อัปโหลดไฟล์' }}
                          </CButton>
                          <CButton v-if="resolveBudgetAttachmentExampleFileUrl(file)" color="info" variant="outline" size="sm" @click="openBudgetAttachmentExampleFile(file)">
                            <CIcon name="cil-external-link" class="mr-1" /> เปิด
                          </CButton>
                          <CButton color="danger" variant="outline" size="sm" :disabled="file.uploading" @click="removeBudgetAttachmentExampleFile(docTypeIndex, fileIndex)">
                            <CIcon name="cil-x" class="mr-1" /> ลบ
                          </CButton>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="!docType.files || docType.files.length === 0">
                      <td colspan="3" class="text-center text-muted">ยังไม่มีไฟล์ตัวอย่างสำหรับประเภทนี้</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CCardBody>
          </CCard>

          <div class="text-muted small mb-3">
            หมายเหตุ: ไฟล์ใหม่จะถูกอัปโหลดเก็บใน backend และบันทึกด้วย fileId ส่วนรายการเดิมที่ยังเป็นชื่อไฟล์อย่างเดียวจะยังเปิดแบบ legacy ได้จนกว่าจะอัปโหลดแทนใหม่
          </div>

          <div class="funding-budget-actions">
            <CButton color="warning" variant="outline" @click="resetBudgetAttachmentExampleConfigToDefault">
              <CIcon name="cil-reload" class="mr-1" /> รีเซ็ตค่าเริ่มต้น
            </CButton>
            <CButton color="primary" :disabled="savingExampleDocs" @click="saveBudgetAttachmentExampleConfig">
              <CIcon name="cil-save" class="mr-1" /> {{ savingExampleDocs ? 'กำลังบันทึก...' : 'บันทึกเอกสารตัวอย่าง' }}
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
  mergeBudgetMultiplierMaxValues,
  toMultiplierNumber as toMultiplierNumberUtil,
  toMultiplierMaxNumber as toMultiplierMaxNumberUtil,
  resolveMultiplierMaxNumber as resolveMultiplierMaxNumberUtil
} from '@/ResearchFormRS/utils/budgetMultiplierConfig'
import {
  BUDGET_ATTACHMENT_EXAMPLE_SETTING_KEY,
  BUDGET_ATTACHMENT_EXAMPLE_LOCAL_FALLBACK_KEY,
  createDefaultBudgetAttachmentExampleConfig,
  parseBudgetAttachmentExampleSettingValue,
  normalizeBudgetAttachmentExampleConfig as normalizeBudgetAttachmentExampleConfigUtil,
  sanitizeBudgetAttachmentExampleConfigForSave as sanitizeBudgetAttachmentExampleConfigForSaveUtil,
  resolveBudgetAttachmentExampleFileUrl as resolveBudgetAttachmentExampleFileUrlUtil
} from '@/ResearchFormRS/utils/budgetAttachmentExampleConfig'
import centerLoadingMixin from '@/ResearchFormRS/utils/centerLoadingMixin'

const createFundingTypeTemplate = () => ({ key: '', label: '', budgetLimit: 0, subOptions: [] })
const createFundingSubOptionTemplate = () => ({ key: '', label: '' })
const createBudgetMultiplierTemplate = () => ({ label: '', value: 1, maxValue: null, isAdmin: false })
const createBudgetItemOverrideTemplate = () => ({
  matchText: '',
  applyToAllFundingTypes: true,
  fundingTypeKeys: [],
  multipliers: [createBudgetMultiplierTemplate()]
})
const createBudgetAttachmentExampleFileTemplate = () => ({
  label: '',
  fileId: '',
  fileName: '',
  originalName: '',
  mimeType: '',
  size: 0,
  uploadedAt: null,
  uploading: false
})

export default {
  name: 'AdminFundingBudgetSettings',
  mixins: [centerLoadingMixin],
  data () {
    return {
      loading: false,
      saving: false,
      savingMultiplier: false,
      savingExampleDocs: false,
      settingsCache: [],
      fundingBudgetConfig: createDefaultFundingBudgetConfig(),
      budgetMultiplierConfig: createDefaultBudgetMultiplierConfig(),
      budgetAttachmentExampleConfig: createDefaultBudgetAttachmentExampleConfig()
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
    },
    totalBudgetAttachmentExampleFileCount () {
      return this.budgetAttachmentExampleConfig.reduce((sum, docType) => (
        sum + ((docType && Array.isArray(docType.files)) ? docType.files.length : 0)
      ), 0)
    },
    centerLoadingActive () {
      return Boolean(this.loading || this.saving || this.savingMultiplier || this.savingExampleDocs)
    },
    fundingTypeSelectionOptions () {
      return this.fundingBudgetConfig.reduce((result, type, index) => {
        const key = this.normalizeFundingKey(type && type.key)
        if (!key) return result
        const label = String(type && type.label ? type.label : key).trim() || key
        result.push({
          key,
          index,
          shortLabel: `ทุนที่ ${index + 1}: ${label}`,
          label
        })
        return result
      }, [])
    }
  },
  async mounted () {
    this.loading = true
    try {
      await Promise.all([
        this.fetchFundingBudgetConfig(),
        this.fetchBudgetMultiplierConfig(),
        this.fetchBudgetAttachmentExampleConfig()
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
    resolveMultiplierMaxNumber (value, budgetLimit, fallback = null) {
      return resolveMultiplierMaxNumberUtil(value, budgetLimit, fallback)
    },
    normalizeBudgetMultiplierConfig (rawConfig) {
      return normalizeBudgetMultiplierConfigUtil(rawConfig, { fallbackToDefault: true })
    },
    sanitizeBudgetMultiplierConfigForSave (config = this.budgetMultiplierConfig) {
      return sanitizeBudgetMultiplierConfigForSaveUtil(config)
    },
    normalizeBudgetAttachmentExampleConfig (rawConfig) {
      return normalizeBudgetAttachmentExampleConfigUtil(rawConfig, { fallbackToDefault: true })
    },
    sanitizeBudgetAttachmentExampleConfigForSave (config = this.budgetAttachmentExampleConfig) {
      return sanitizeBudgetAttachmentExampleConfigForSaveUtil(config)
    },
    resolveBudgetAttachmentExampleFileUrl (file) {
      return resolveBudgetAttachmentExampleFileUrlUtil(file)
    },
    isMultiplierMaxValueValid (value) {
      if (value === '' || value === undefined || value === null) return true
      return this.toMultiplierMaxNumber(value, '__invalid__') !== '__invalid__'
    },
    getApplicableFundingBudgetLimits (fundingTypeKeys = []) {
      const normalizedFundingTypeKeys = Array.isArray(fundingTypeKeys) && fundingTypeKeys.length > 0
        ? fundingTypeKeys.map(key => this.normalizeFundingKey(key)).filter(Boolean)
        : this.fundingTypeSelectionOptions.map(option => option.key)

      return normalizedFundingTypeKeys.reduce((result, fundingTypeKey) => {
        const fundingType = this.fundingBudgetConfig.find(item => this.normalizeFundingKey(item && item.key) === fundingTypeKey)
        const budgetLimit = this.toBudgetLimitNumber(fundingType && fundingType.budgetLimit, 0)
        if (budgetLimit > 0) result.push(budgetLimit)
        return result
      }, [])
    },
    resolveAdminMultiplierMaxValue (maxValue, fundingTypeKeys = []) {
      const normalizedMaxValue = this.toMultiplierMaxNumber(maxValue, '__invalid__')
      if (normalizedMaxValue === '__invalid__') {
        return { isValid: false, effectiveMaxValue: null }
      }
      if (normalizedMaxValue === null) {
        return { isValid: true, effectiveMaxValue: null }
      }
      if (typeof normalizedMaxValue === 'string' && normalizedMaxValue.endsWith('%')) {
        const budgetLimits = this.getApplicableFundingBudgetLimits(fundingTypeKeys)
        if (!budgetLimits.length) {
          return { isValid: true, effectiveMaxValue: null }
        }

        const effectiveMaxValue = budgetLimits.reduce((minValue, budgetLimit) => {
          const resolvedMaxValue = this.resolveMultiplierMaxNumber(normalizedMaxValue, budgetLimit, null)
          if (resolvedMaxValue === null) return minValue
          return minValue === null ? resolvedMaxValue : Math.min(minValue, resolvedMaxValue)
        }, null)

        return { isValid: true, effectiveMaxValue }
      }

      return { isValid: true, effectiveMaxValue: normalizedMaxValue }
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
          if (!this.isMultiplierMaxValueValid(multiplier && multiplier.maxValue)) {
            return `${categoryLabel}: ตัวคูณลำดับที่ ${no} รูปแบบค่าสูงสุดไม่ถูกต้อง (เช่น 5000 หรือ 10%)`
          }
          const { effectiveMaxValue } = this.resolveAdminMultiplierMaxValue(multiplier && multiplier.maxValue)
          if (effectiveMaxValue !== null && numeric > effectiveMaxValue) {
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

          const applyToAllFundingTypes = itemOverride && itemOverride.applyToAllFundingTypes !== undefined
            ? Boolean(itemOverride.applyToAllFundingTypes)
            : true
          const fundingTypeKeys = Array.isArray(itemOverride && itemOverride.fundingTypeKeys)
            ? itemOverride.fundingTypeKeys.map(key => this.normalizeFundingKey(key)).filter(Boolean)
            : []
          if (!applyToAllFundingTypes && fundingTypeKeys.length === 0) {
            return `${categoryLabel}: รายการเฉพาะลำดับที่ ${overrideNo} ต้องเลือกอย่างน้อย 1 ประเภททุน หรือเลือก "ทั้งหมด"`
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
            if (!this.isMultiplierMaxValueValid(overrideMultiplier && overrideMultiplier.maxValue)) {
              return `${categoryLabel}: รายการเฉพาะลำดับที่ ${overrideNo} ตัวคูณลำดับที่ ${overrideMultiplierNo} รูปแบบค่าสูงสุดไม่ถูกต้อง (เช่น 5000 หรือ 10%)`
            }
            const { effectiveMaxValue } = this.resolveAdminMultiplierMaxValue(
              overrideMultiplier && overrideMultiplier.maxValue,
              applyToAllFundingTypes ? [] : fundingTypeKeys
            )
            if (effectiveMaxValue !== null && overrideNumeric > effectiveMaxValue) {
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
    saveBudgetAttachmentExampleFallback () {
      const payload = {
        budgetAttachmentExampleConfig: this.sanitizeBudgetAttachmentExampleConfigForSave(),
        savedAt: new Date().toISOString()
      }
      localStorage.setItem(BUDGET_ATTACHMENT_EXAMPLE_LOCAL_FALLBACK_KEY, JSON.stringify(payload))
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
    loadBudgetAttachmentExampleFallback () {
      try {
        const raw = localStorage.getItem(BUDGET_ATTACHMENT_EXAMPLE_LOCAL_FALLBACK_KEY)
        if (!raw) return false
        const parsed = JSON.parse(raw)
        if (!parsed || !Array.isArray(parsed.budgetAttachmentExampleConfig)) return false
        this.budgetAttachmentExampleConfig = this.normalizeBudgetAttachmentExampleConfig(parsed.budgetAttachmentExampleConfig)
        return true
      } catch (error) {
        console.error('[AdminFundingBudgetSettings] load example-doc fallback error:', error)
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
        const parsedConfig = parseBudgetMultiplierSettingValue(rawValue, { fallbackToDefault: true })
        const fallbackRaw = localStorage.getItem(BUDGET_MULTIPLIER_LOCAL_FALLBACK_KEY)
        const fallbackParsed = fallbackRaw ? JSON.parse(fallbackRaw) : null
        const fallbackConfig = fallbackParsed && Array.isArray(fallbackParsed.budgetMultiplierConfig)
          ? fallbackParsed.budgetMultiplierConfig
          : []
        this.budgetMultiplierConfig = mergeBudgetMultiplierMaxValues(parsedConfig, fallbackConfig)
        this.saveBudgetMultiplierFallback()
      } catch (error) {
        console.error('[AdminFundingBudgetSettings] fetch multiplier config error:', error)
        if (!this.loadBudgetMultiplierFallback()) this.budgetMultiplierConfig = createDefaultBudgetMultiplierConfig()
      }
    },
    async fetchBudgetAttachmentExampleConfig () {
      try {
        const settings = await this.fetchSettingCache()
        const setting = settings.find(item => item && item.key === BUDGET_ATTACHMENT_EXAMPLE_SETTING_KEY)
        const rawValue = setting ? setting.value : null
        this.budgetAttachmentExampleConfig = parseBudgetAttachmentExampleSettingValue(rawValue, { fallbackToDefault: true })
        this.saveBudgetAttachmentExampleFallback()
      } catch (error) {
        console.error('[AdminFundingBudgetSettings] fetch example-doc config error:', error)
        if (!this.loadBudgetAttachmentExampleFallback()) this.budgetAttachmentExampleConfig = createDefaultBudgetAttachmentExampleConfig()
      }
    },
    addBudgetAttachmentExampleFile (docTypeIndex) {
      const docType = this.budgetAttachmentExampleConfig[docTypeIndex]
      if (!docType) return
      if (!Array.isArray(docType.files)) {
        this.$set(docType, 'files', [])
      }
      docType.files.push(createBudgetAttachmentExampleFileTemplate())
    },
    budgetAttachmentExampleUploadRef (docTypeIndex, fileIndex) {
      return `budgetAttachmentExampleUpload_${docTypeIndex}_${fileIndex}`
    },
    budgetAttachmentExampleDisplayName (file) {
      return String(file && (file.originalName || file.fileName || file.label) ? (file.originalName || file.fileName || file.label) : '').trim()
    },
    formatBudgetAttachmentExampleFileSize (size) {
      const numeric = Number(size)
      if (!Number.isFinite(numeric) || numeric <= 0) return ''
      if (numeric >= 1024 * 1024) return `${(numeric / (1024 * 1024)).toFixed(2)} MB`
      if (numeric >= 1024) return `${(numeric / 1024).toFixed(1)} KB`
      return `${numeric} B`
    },
    triggerBudgetAttachmentExampleUpload (docTypeIndex, fileIndex) {
      const refName = this.budgetAttachmentExampleUploadRef(docTypeIndex, fileIndex)
      const input = this.$refs[refName]
      const target = Array.isArray(input) ? input[0] : input
      if (target && typeof target.click === 'function') target.click()
    },
    extractBudgetAttachmentExampleErrorMessage (error, fallback = 'อัปโหลดไฟล์ไม่สำเร็จ') {
      return (error && error.response && error.response.data && error.response.data.message) || fallback
    },
    async onBudgetAttachmentExampleFileSelected (docTypeIndex, fileIndex, event) {
      const input = event && event.target ? event.target : null
      const uploadFile = input && input.files ? input.files[0] : null
      if (!uploadFile) return

      const docType = this.budgetAttachmentExampleConfig[docTypeIndex]
      const file = docType && Array.isArray(docType.files) ? docType.files[fileIndex] : null
      if (!file) return

      this.$set(file, 'uploading', true)

      try {
        const formData = new FormData()
        formData.append('file', uploadFile)

        const response = await axios.post('/api/v1/setting/files/budget-attachment-example', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        const uploaded = response && response.data && response.data.data ? response.data.data : {}
        const resolvedName = String(uploaded.originalName || uploaded.fileName || uploadFile.name || '').trim()

        this.$set(file, 'fileId', String(uploaded.fileId || '').trim())
        this.$set(file, 'fileName', resolvedName)
        this.$set(file, 'originalName', resolvedName)
        this.$set(file, 'mimeType', String(uploaded.mimeType || uploadFile.type || '').trim())
        this.$set(file, 'size', Number(uploaded.size || uploadFile.size || 0))
        this.$set(file, 'uploadedAt', uploaded.uploadedAt || new Date().toISOString())
        if (!String(file.label || '').trim()) {
          this.$set(file, 'label', resolvedName)
        }
      } catch (error) {
        console.error('[AdminFundingBudgetSettings] upload example file error:', error)
        await Swal.fire({
          icon: 'error',
          title: 'อัปโหลดไฟล์ไม่สำเร็จ',
          text: this.extractBudgetAttachmentExampleErrorMessage(error)
        })
      } finally {
        this.$set(file, 'uploading', false)
        if (input) input.value = ''
      }
    },
    openBudgetAttachmentExampleFile (file) {
      const normalizedFileId = String(file && (file.fileId || file.id || file._id) ? (file.fileId || file.id || file._id) : '').trim()
      const url = this.resolveBudgetAttachmentExampleFileUrl(file)
      if (!url || typeof window === 'undefined') return

      if (!normalizedFileId) {
        const popup = window.open(url, '_blank')
        if (popup && typeof popup.focus === 'function') popup.focus()
        return
      }

      axios.get(`/api/v1/setting/files/${encodeURIComponent(normalizedFileId)}`, {
        responseType: 'blob'
      }).then((response) => {
        const responseBlob = response && response.data ? response.data : null
        const blob = responseBlob instanceof Blob
          ? responseBlob
          : new Blob([responseBlob], { type: (response && response.headers && response.headers['content-type']) || 'application/octet-stream' })
        const objectUrl = window.URL.createObjectURL(blob)
        const popup = window.open(objectUrl, '_blank')
        if (!popup) {
          const link = document.createElement('a')
          link.href = objectUrl
          link.download = this.budgetAttachmentExampleDisplayName(file) || 'attachment'
          document.body.appendChild(link)
          link.click()
          link.remove()
        } else if (typeof popup.focus === 'function') {
          popup.focus()
        }
        window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000)
      }).catch(async (error) => {
        console.error('[AdminFundingBudgetSettings] open example file error:', error)
        await Swal.fire({
          icon: 'error',
          title: 'เปิดไฟล์ไม่สำเร็จ',
          text: this.extractBudgetAttachmentExampleErrorMessage(error, 'ไม่สามารถเปิดไฟล์ตัวอย่างจาก backend ได้')
        })
      })
    },
    async removeBudgetAttachmentExampleFile (docTypeIndex, fileIndex) {
      const docType = this.budgetAttachmentExampleConfig[docTypeIndex]
      if (!docType || !Array.isArray(docType.files)) return
      docType.files.splice(fileIndex, 1)
    },
    updateBudgetAttachmentExampleFileLabel (docTypeIndex, fileIndex, value) {
      const file = this.budgetAttachmentExampleConfig[docTypeIndex] && Array.isArray(this.budgetAttachmentExampleConfig[docTypeIndex].files)
        ? this.budgetAttachmentExampleConfig[docTypeIndex].files[fileIndex]
        : null
      if (!file) return
      this.$set(file, 'label', value)
    },
    validateBudgetAttachmentExamplePayload (payload) {
      if (!Array.isArray(payload) || payload.length === 0) {
        return 'ไม่พบข้อมูลเอกสารตัวอย่าง'
      }

      for (let docTypeIndex = 0; docTypeIndex < payload.length; docTypeIndex += 1) {
        const docType = payload[docTypeIndex]
        const files = Array.isArray(docType && docType.files) ? docType.files : []
        for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
          const file = files[fileIndex]
          if (!String(file && file.label || '').trim()) {
            return `${docType.label || docType.key}: ไฟล์ลำดับที่ ${fileIndex + 1} ต้องระบุชื่อที่แสดง`
          }
          if (!String(file && (file.fileId || file.fileName || file.originalName) || '').trim()) {
            return `${docType.label || docType.key}: ไฟล์ลำดับที่ ${fileIndex + 1} ต้องอัปโหลดไฟล์`
          }
        }
      }

      return ''
    },
    async resetBudgetAttachmentExampleConfigToDefault () {
      const result = await Swal.fire({
        icon: 'warning',
        title: 'รีเซ็ตเอกสารตัวอย่างเป็นค่าเริ่มต้น?',
        text: 'รายการไฟล์ตัวอย่างที่แก้ไขในหน้าจอจะถูกแทนที่ด้วยค่าเริ่มต้น',
        showCancelButton: true,
        confirmButtonText: 'รีเซ็ต',
        cancelButtonText: 'ยกเลิก'
      })
      if (!result.isConfirmed) return
      this.budgetAttachmentExampleConfig = createDefaultBudgetAttachmentExampleConfig()
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
      this.$set(multiplier, 'maxValue', value)
    },
    updateBudgetMultiplierUserInputAllowed (categoryIndex, multiplierIndex, checked) {
      const category = this.budgetMultiplierConfig[categoryIndex]
      const multiplier = category && Array.isArray(category.multipliers)
        ? category.multipliers[multiplierIndex]
        : null
      if (!multiplier) return
      this.$set(multiplier, 'isAdmin', !checked)
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
    isOverrideAppliedToAllFundingTypes (itemOverride) {
      if (!itemOverride || typeof itemOverride !== 'object') return true
      return itemOverride.applyToAllFundingTypes !== false
    },
    isOverrideFundingTypeSelected (itemOverride, fundingTypeKey) {
      if (!itemOverride || typeof itemOverride !== 'object') return false
      const normalizedKey = this.normalizeFundingKey(fundingTypeKey)
      if (!normalizedKey) return false
      const current = Array.isArray(itemOverride.fundingTypeKeys)
        ? itemOverride.fundingTypeKeys.map(key => this.normalizeFundingKey(key)).filter(Boolean)
        : []
      return current.includes(normalizedKey)
    },
    toggleBudgetItemOverrideApplyAllFundingTypes (categoryIndex, overrideIndex, checked) {
      const category = this.budgetMultiplierConfig[categoryIndex]
      const itemOverride = category && Array.isArray(category.itemOverrides)
        ? category.itemOverrides[overrideIndex]
        : null
      if (!itemOverride) return
      this.$set(itemOverride, 'applyToAllFundingTypes', Boolean(checked))
      if (checked) {
        this.$set(itemOverride, 'fundingTypeKeys', [])
      }
    },
    toggleBudgetItemOverrideFundingType (categoryIndex, overrideIndex, fundingTypeKey, checked) {
      const category = this.budgetMultiplierConfig[categoryIndex]
      const itemOverride = category && Array.isArray(category.itemOverrides)
        ? category.itemOverrides[overrideIndex]
        : null
      if (!itemOverride) return

      const normalizedKey = this.normalizeFundingKey(fundingTypeKey)
      if (!normalizedKey) return

      const current = Array.isArray(itemOverride.fundingTypeKeys)
        ? itemOverride.fundingTypeKeys.map(key => this.normalizeFundingKey(key)).filter(Boolean)
        : []
      const next = checked
        ? Array.from(new Set(current.concat(normalizedKey)))
        : current.filter(key => key !== normalizedKey)

      this.$set(itemOverride, 'applyToAllFundingTypes', false)
      this.$set(itemOverride, 'fundingTypeKeys', next)
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
      this.$set(multiplier, 'maxValue', value)
    },
    updateBudgetItemOverrideMultiplierUserInputAllowed (categoryIndex, overrideIndex, overrideMultiplierIndex, checked) {
      const category = this.budgetMultiplierConfig[categoryIndex]
      const itemOverride = category && Array.isArray(category.itemOverrides)
        ? category.itemOverrides[overrideIndex]
        : null
      const multiplier = itemOverride && Array.isArray(itemOverride.multipliers)
        ? itemOverride.multipliers[overrideMultiplierIndex]
        : null
      if (!multiplier) return
      this.$set(multiplier, 'isAdmin', !checked)
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
      const validationError = this.validateBudgetMultiplierPayload(this.budgetMultiplierConfig)
      if (validationError) {
        await Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: validationError })
        return
      }

      const payload = this.sanitizeBudgetMultiplierConfigForSave()

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
    async saveBudgetAttachmentExampleConfig () {
      const payload = this.sanitizeBudgetAttachmentExampleConfigForSave()
      const validationError = this.validateBudgetAttachmentExamplePayload(payload)
      if (validationError) {
        await Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: validationError })
        return
      }

      this.savingExampleDocs = true
      try {
        await this.upsertSettingByKey(
          BUDGET_ATTACHMENT_EXAMPLE_SETTING_KEY,
          JSON.stringify(payload),
          'รายการไฟล์เอกสารตัวอย่างสำหรับแนบงบประมาณ',
          'general'
        )
        this.budgetAttachmentExampleConfig = this.normalizeBudgetAttachmentExampleConfig(payload)
        this.saveBudgetAttachmentExampleFallback()
        await this.fetchBudgetAttachmentExampleConfig()
        await Swal.fire({
          icon: 'success',
          title: 'บันทึกเอกสารตัวอย่างสำเร็จ',
          timer: 1300,
          showConfirmButton: false
        })
      } catch (error) {
        console.error('[AdminFundingBudgetSettings] save example-doc fallback:', error)
        this.saveBudgetAttachmentExampleFallback()
        await Swal.fire({
          icon: 'info',
          title: 'บันทึกในเครื่องแล้ว',
          text: 'API ยังไม่พร้อม จึงบันทึกการตั้งค่าเอกสารตัวอย่างแบบ local fallback'
        })
      } finally {
        this.savingExampleDocs = false
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

.table td .form-control {
  min-width: 160px;
}

@media (max-width: 768px) {
  .funding-budget-actions {
    justify-content: flex-start;
  }
}
</style>
