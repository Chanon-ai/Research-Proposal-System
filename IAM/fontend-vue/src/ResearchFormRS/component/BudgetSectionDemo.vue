<template>
  <div class="budget-section-container" :class="{ 'is-dark': isDarkTheme }">
      <CCard v-for="(category, catIndex) in categories" :key="catIndex" class="mb-4 shadow-sm border-0">
        
      <CCardHeader class="text-white d-flex justify-content-between align-items-center" :style="categoryHeaderStyle">
        <h5 class="mb-0 font-weight-bold">
          <i v-if="category.isOther" class="fa fa-money-bill-wave mr-2"></i> {{ getCategoryTitle(category) }}
        </h5>
        <div v-if="!isReadOnly"> <CButton color="light" size="sm" class="mr-2 text-primary font-weight-bold" @click="addItem(catIndex)">
            <CIcon name="cil-plus" class="mr-1" />  เพิ่มรายการเอง
          </CButton>
          <label class="btn btn-light btn-sm mb-0 text-primary font-weight-bold cursor-pointer">
            <CIcon name="cil-library-add" class="mr-1" /> แนบเอกสาร
            <input type="file" style="display: none;" @change="attachDocToCategory($event, catIndex)" multiple>
          </label>
        </div>
      </CCardHeader>

      <CCardBody class="p-0 table-responsive">
        <table class="table table-bordered mb-0 text-center align-middle" style="min-width: 1000px;">
          <thead class="bg-primary text-white" :style="tableHeadStyle">
            <tr>
              <th width="25%" class="align-middle">รายการ</th>
              <th width="35%" class="align-middle">รายละเอียดตัวคูณ</th>
              <th width="10%" class="align-middle">งบรวม (บาท)</th>
              <th width="8%" class="align-middle">งวด 1</th>
              <th width="8%" class="align-middle">งวด 2</th>
              <th width="8%" class="align-middle">งวด 3</th>
              <th width="6%" class="align-middle">#</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="category.items.length === 0">
              <td colspan="7" class="text-center py-4 text-muted">ยังไม่มีรายการในหมวดนี้</td>
            </tr>

            <tr v-for="(item, itemIndex) in category.items" :key="item.id" class="bg-light">
              
              <td class="text-left align-middle bg-white">
                <template v-if="category.isOther">
                  <textarea 
                    class="form-control auto-grow-textarea"
                    :class="{ 'budget-item-name-invalid': Boolean(item.forbiddenItemMessage) }"
                    v-model="item.name" 
                    placeholder="ระบุชื่อรายการ..."
                    rows="1"
                    @input="handleItemNameInput(catIndex, item, $event)"
                    @blur="handleItemNameBlur(catIndex, item)"
                    @change="handleItemNameBlur(catIndex, item)"
                    :readonly="isReadOnly" 
                  ></textarea>
                </template>
                <template v-else>
                  <div class="budget-item-search-wrap">
                    <input
                      type="search"
                      class="form-control budget-item-search"
                      :class="{ 'budget-item-name-invalid': Boolean(item.forbiddenItemMessage) }"
                      v-model="item.name"
                      :list="getItemSearchListId(catIndex)"
                      placeholder="ค้นหา/ระบุชื่อรายการ..."
                      @input="handleItemNameInput(catIndex, item, $event)"
                      @blur="handleItemNameBlur(catIndex, item)"
                      @change="handleItemNameBlur(catIndex, item)"
                      :readonly="isReadOnly"
                    >
                    <span
                      class="budget-item-search-icon"
                      :class="{ 'is-invalid': Boolean(item.forbiddenItemMessage) }"
                      aria-hidden="true"
                    ></span>
                  </div>
                  <datalist :id="getItemSearchListId(catIndex)">
                    <option
                      v-for="(option, optIndex) in getSearchOptionsByCategory(category, catIndex)"
                      :key="`${catIndex}-${optIndex}`"
                      :value="option"
                    />
                  </datalist>
                </template>
                <small v-if="item.forbiddenItemMessage" class="text-danger d-block mb-2 budget-item-forbidden-text">
                  <i class="fa fa-ban mr-1" aria-hidden="true"></i>{{ item.forbiddenItemMessage }}
                </small>
                 
                <div v-if="item.attachment" class="attachment-box border rounded p-2 mt-2 bg-light">
                  <div
                    v-if="getAttachmentDisplayUrl(item)"
                    class="form-control mb-2 bg-white budget-attachment-url-field"
                  >
                    <a
                      href="#"
                      class="budget-attachment-url"
                      :title="getAttachmentDisplayUrl(item)"
                      @click.prevent.stop="openAttachment(item)"
                    >
                      {{ getAttachmentDisplayName(item) }}
                    </a>
                  </div>
                  <div v-else class="form-control mb-2 bg-white text-muted">
                    {{ item.attachment.fileName || item.attachment.name || '-' }}
                  </div>
                  <div class="mb-2">
                    <small class="text-muted d-block mb-1">เลือกหมวดหมู่เอกสาร:</small>
                    <div class="d-flex align-items-center flex-wrap" style="gap: 6px;">
                      <select
                        class="form-control form-control-sm border-primary"
                        v-model="item.attachment.docType"
                        style="color: #8b1212; min-width: 240px;"
                        :disabled="isReadOnly"
                        @change="handleAttachmentDocTypeChange(item)"
                      >
                        <option value="">-- เลือกหมวดหมู่ --</option>
                        <option value="TOR">TOR (Term of References)</option>
                        <option value="Quotation">ใบเสนอราคา / Quotation</option>
                        <option value="Specification">Specification</option>
                        <option value="CV">CV</option>
                        <option value="ServiceRates">อัตราค่าบริการต่าง ๆ / Service Rates</option>
                      </select>
                      
                      <CButton
                        v-if="item.attachment.docType"
                        color="info"
                        variant="outline"
                        size="sm"
                        class="text-nowrap"
                        @click.stop="openAttachmentExample(item.attachment.docType)"
                      >
                        <CIcon name="cil-clipboard" class="mr-1" /> <i class="fa fa-file-alt mr-1"></i> ตัวอย่างเอกสาร
                      </CButton>
                      
                    </div>
                  </div>
                </div>
              </td>

              <td class="align-middle bg-white">
                <div class="d-flex justify-content-center align-items-center flex-wrap" style="gap: 8px;">
                  <template v-if="category.isOther">
                    <div v-for="(mult, mIndex) in item.multipliers" :key="mIndex" class="position-relative multiplier-box">
                      <CButton v-if="!isReadOnly && item.multipliers.length > 1" 
                               color="danger" 
                               size="sm"
                               @click="removeMultiplier(item, mIndex)" 
                               class="position-absolute remove-mult-btn" 
                               title="ลบตัวคูณ">
                        <CIcon name="cil-x" class="m-1"/>
                      </CButton>
                      
                      <input type="text" class="form-control form-control-sm text-center mb-1 text-muted bg-transparent border-1" 
                             v-model="mult.label" placeholder="ชื่อหน่วย" :readonly="isReadOnly">
                      <input type="text" inputmode="numeric" class="form-control text-center" 
                             v-model="mult.value" placeholder="ตัวเลข" 
                             @keypress="isNumber"
                             @input="cleanNumber(mult, 'value'); calculateItemTotal(item)"
                             :readonly="isReadOnly">
                    </div>
                    <CButton v-if="!isReadOnly" color="primary" size="sm" class="mt-4" title="เพิ่มตัวคูณ" @click="addMultiplier(item)" style="height: 38px;">
                      <CIcon name="cil-plus" class="m-1"/>
                    </CButton>
                  </template>

                  <template v-else>
                    <div
                      v-for="field in getFieldsForRow(item)"
                      :key="`${item.id}-${field.key}`"
                      class="position-relative multiplier-box"
                    >
                      <div class="floating-outline-wrap">
                        <input
                          type="text"
                          inputmode="numeric"
                          class="input-floating-outline text-center"
                          placeholder=" "
                          v-model="item.inputs[field.key]"
                          :readonly="isReadOnly"
                          @keypress="isNumber"
                          @input="handleCalcInputChange(catIndex, item, field.key)"
                        >
                        <label class="label-floating-outline">{{ field.label }}</label>
                      </div>
                    </div>
                  </template>
                </div>

                <div v-if="!category.isOther" class="formula-preview-box text-left">
                  <small v-if="item.detectedRuleKey" class="text-success d-block formula-indicator">
                    ตรวจพบสูตรอัตโนมัติ: {{ getFormulaLabel(item) }}
                  </small>
                  <small v-else class="text-muted d-block formula-indicator">
                    ใช้สูตรเริ่มต้นของหมวด: {{ getFormulaLabel(item) }}
                  </small>
                  <small class="text-primary d-block formula-live-preview">
                    {{ getFormulaPreview(item) }}
                  </small>
                </div>
              </td>

              <td class="align-middle bg-white">
                <h6 class="font-weight-bold text-primary mb-0">{{ formatNumber(item.total) }}</h6>
              </td>

              <td class="align-middle bg-white">
                <div class="floating-outline-wrap">
                  <input type="text" inputmode="numeric" 
                         class="input-floating-outline text-center" 
                         :class="{'border-danger text-danger error-shadow': item.periodError}"
                         placeholder=" "
                         v-model="item.periods[0]" 
                         @keypress="isNumber" 
                         @input="handlePeriodInput(item, 0)" :readonly="isReadOnly">
                  <label class="label-floating-outline" :class="{'text-danger': item.periodError}">
                    <i v-if="item.periodError" class="fa fa-exclamation-circle"></i> 
                    {{ item.periodError ? 'เกินงบ!' : 'งวด 1' }}
                  </label>
                </div>
              </td>

              <td class="align-middle bg-white">
                <div class="floating-outline-wrap">
                  <input type="text" inputmode="numeric" 
                         class="input-floating-outline text-center" 
                         :class="{'border-danger text-danger error-shadow': item.periodError}"
                         placeholder=" "
                         v-model="item.periods[1]" 
                         @keypress="isNumber" 
                         @input="handlePeriodInput(item, 1)" :readonly="isReadOnly">
                  <label class="label-floating-outline" :class="{'text-danger': item.periodError}">
                    <i v-if="item.periodError" class="fa fa-exclamation-circle"></i> 
                    {{ item.periodError ? 'เกินงบ!' : 'งวด 2' }}
                  </label>
                </div>
              </td>

              <td class="align-middle bg-white">
                <div class="floating-outline-wrap">
                  <input type="text" inputmode="numeric" 
                         class="input-floating-outline text-center" 
                         :class="{'border-danger text-danger error-shadow': item.periodError}"
                         placeholder=" "
                         v-model="item.periods[2]" 
                         @keypress="isNumber" 
                         @input="handlePeriodInput(item, 2)" :readonly="isReadOnly">
                  <label class="label-floating-outline" :class="{'text-danger': item.periodError}">
                    <i v-if="item.periodError" class="fa fa-exclamation-circle"></i> 
                    {{ item.periodError ? 'เกินงบ!' : 'งวด 3' }}
                  </label>
                </div>
              </td>

              <td class="align-middle bg-white" v-if="!isReadOnly">
                <CButton v-if="category.items.length > 0" color="danger" size="sm" variant="outline" @click="removeItem(catIndex, itemIndex)">
                  <CIcon name="cil-trash" class="mr-1" /> ลบ
                </CButton>
              </td>

            </tr>
          </tbody>
        </table>
      </CCardBody>
    </CCard>

    <div v-if="isTravelExceeded || isEquipmentExceeded" class="alert alert-danger shadow-sm mb-4 border-0" style="border-left: 5px solid #e55353 !important; border-radius: 8px;">
      <h6 class="alert-heading font-weight-bold mb-2 budget-warning-heading">
        <i class="fa fa-exclamation-triangle mr-1"></i> ข้อควรระวัง: สัดส่วนงบประมาณเกินเกณฑ์ที่มหาวิทยาลัยกำหนด
      </h6>
      <hr class="mt-2 mb-2" style="border-color: rgba(229, 83, 83, 0.2);">
      <ul class="mb-0 text-dark pl-3 budget-warning-details">
        <li v-if="isTravelExceeded" class="mb-1">
          <strong>หมวดค่าเดินทาง:</strong> เสนอขอ {{ formatNumber(travelTotal) }} บาท 
          <span class="text-danger">(คิดเป็น {{ ((travelTotal / grandTotal) * 100).toFixed(2) }}% ของงบรวม)</span> 
          *เกณฑ์กำหนดไม่เกิน 25% หรือ {{ formatNumber(limit25Percent) }} บาท
        </li>
        <li v-if="isEquipmentExceeded">
          <strong>หมวดครุภัณฑ์:</strong> เสนอขอ {{ formatNumber(equipmentTotal) }} บาท 
          <span class="text-danger">(คิดเป็น {{ ((equipmentTotal / grandTotal) * 100).toFixed(2) }}% ของงบรวม)</span> 
          *เกณฑ์กำหนดไม่เกิน 25% หรือ {{ formatNumber(limit25Percent) }} บาท
        </li>
      </ul>
    </div>

    <CCard class="mb-2 shadow-sm border-0 budget-summary-card" style="background-color: #f8f9fa;">
      <CCardBody class="p-3">
        <div class="row text-center align-items-center">
          
          <div class="col-md-3 text-right text-dark">
            <h5 class="mb-0 font-weight-bold budget-installment-summary-title">สรุปยอดรวมการเบิกจ่าย:</h5>
            <small class="text-muted budget-installment-criteria">เกณฑ์ 50% / 40% / 10%</small>
          </div>
          
          <div class="col-md-3 border-left">
            <div class="text-muted mb-1 budget-installment-period-label">รวมงวดที่ 1 (50%)</div>
            <h5 class="mb-0 font-weight-bold" :class="isPeriod1Valid ? 'text-success' : 'text-danger'">
              {{ formatNumber(totalPeriod1) }} <small>บาท</small>
            </h5>
            <div v-if="!isPeriod1Valid && grandTotal > 0" class="text-danger mt-1 budget-installment-status">
              <i class="fa fa-exclamation-triangle"></i> ยอดที่ถูกต้อง: {{ formatNumber(expectedPeriod1) }}
            </div>
            <div v-else-if="grandTotal > 0" class="text-success mt-1 budget-installment-status">
              <i class="fa fa-check-circle"></i> สัดส่วนถูกต้อง
            </div>
          </div>

          <div class="col-md-3 border-left">
            <div class="text-muted mb-1 budget-installment-period-label">รวมงวดที่ 2 (40%)</div>
            <h5 class="mb-0 font-weight-bold" :class="isPeriod2Valid ? 'text-success' : 'text-danger'">
              {{ formatNumber(totalPeriod2) }} <small>บาท</small>
            </h5>
            <div v-if="!isPeriod2Valid && grandTotal > 0" class="text-danger mt-1 budget-installment-status">
              <i class="fa fa-exclamation-triangle"></i> ยอดที่ถูกต้อง: {{ formatNumber(expectedPeriod2) }}
            </div>
            <div v-else-if="grandTotal > 0" class="text-success mt-1 budget-installment-status">
              <i class="fa fa-check-circle"></i> สัดส่วนถูกต้อง
            </div>
          </div>

          <div class="col-md-3 border-left">
            <div class="text-muted mb-1 budget-installment-period-label">รวมงวดที่ 3 (10%)</div>
            <h5 class="mb-0 font-weight-bold" :class="isPeriod3Valid ? 'text-success' : 'text-danger'">
              {{ formatNumber(totalPeriod3) }} <small>บาท</small>
            </h5>
            <div v-if="!isPeriod3Valid && grandTotal > 0" class="text-danger mt-1 budget-installment-status">
              <i class="fa fa-exclamation-triangle"></i> ยอดที่ถูกต้อง: {{ formatNumber(expectedPeriod3) }}
            </div>
            <div v-else-if="grandTotal > 0" class="text-success mt-1 budget-installment-status">
              <i class="fa fa-check-circle"></i> สัดส่วนถูกต้อง
            </div>
          </div>

        </div>
      </CCardBody>
    </CCard>
    
    <CCard class="border-primary mt-4 shadow-sm budget-grand-total-card" style="border-width: 2px !important;">
      <CCardBody class="d-flex justify-content-between align-items-center p-4">
        <div>
          <h4 class="mb-1 font-weight-bold text-dark budget-grand-total-title">สรุปงบประมาณรวมทั้งสิ้น (พ.ศ. 2569)</h4>
          <span class="text-muted budget-grand-total-note">คำนวณอัตโนมัติตามหลักเกณฑ์การตั้งงบประมาณมหาวิทยาลัยแม่ฟ้าหลวง</span>
          <div
            v-if="hasBudgetLimit"
            class="budget-grand-total-details mt-2"
            :class="isBudgetLimitExceeded ? 'text-danger' : 'text-primary'"
          >
            <div><strong>เพดานงบตามประเภททุน:</strong> {{ fundingTypeLabel }}</div>
            <div><strong>เพดานงบ:</strong> {{ formatNumber(budgetLimit) }} บาท</div>
            <div><strong>ยอดที่กรอก:</strong> {{ formatNumber(grandTotal) }} บาท</div>
          </div>
        </div>
        <div class="text-right">
          <h1 class="text-primary mb-0 font-weight-bold" style="color: #8b1212 !important;">
            จำนวนเงินที่ใช้: {{ formatNumber(grandTotal) }} <span class="h5 text-muted font-weight-normal">บาท</span>
          </h1>
          <div
            v-if="hasBudgetLimit"
            class="h1 mt-2 mb-0 font-weight-bold"
            :class="remainingBudget >= 0 ? 'text-success' : 'text-danger'"
          >
            {{ remainingBudget >= 0 ? 'วงเงินคงเหลือ' : 'เกินวงเงิน' }}: {{ formatNumber(Math.abs(remainingBudget)) }}
            <span class="h5 text-muted font-weight-normal">บาท</span>
          </div>
        </div>
      </CCardBody>
    </CCard>

  </div>
</template>

<script>
const FUNDING_TYPE_LIMITS = Object.freeze({
  'new-researcher': 100000,
  'researcher-development': 200000,
  'strategic-research': 300000,
  'industry-extension': 300000
})

const FUNDING_TYPE_LABELS = Object.freeze({
  'new-researcher': 'ทุนนักวิจัยรุ่นใหม่',
  'researcher-development': 'ทุนพัฒนานักวิจัย',
  'strategic-research': 'ทุนวิจัยที่สอดคล้องกับยุทธศาสตร์',
  'industry-extension': 'ทุนต่อยอดสู่ภาคอุตสาหกรรม'
})

const BUDGET_ATTACHMENT_EXAMPLE_WINDOW_NAME = 'budget-attachment-example-doc'

const BUDGET_ATTACHMENT_EXAMPLES = Object.freeze({
  TOR: {
    title: 'ตัวอย่างเอกสาร TOR (Term of References)',
    items: [
      'วัตถุประสงค์/ความเป็นมาของงาน',
      'ขอบเขตงาน (Scope of Work)',
      'คุณสมบัติผู้เสนอราคา',
      'ระยะเวลาดำเนินงานและการส่งมอบ',
      'งบประมาณและเงื่อนไขการชำระเงิน'
    ]
  },
  Quotation: {
    title: 'ตัวอย่างใบเสนอราคา (Quotation)',
    items: [
      'ชื่อผู้ขาย/ผู้ให้บริการ พร้อมที่อยู่และช่องทางติดต่อ',
      'รายละเอียดสินค้า/บริการ และจำนวน',
      'ราคาต่อหน่วย ราคาก่อนภาษี และราคารวม',
      'อายุใบเสนอราคา และเงื่อนไขการชำระเงิน',
      'ลายเซ็นหรือผู้มีอำนาจอนุมัติจากผู้ขาย'
    ]
  },
  Specification: {
    title: 'ตัวอย่างเอกสาร Specification',
    items: [
      'คุณลักษณะทางเทคนิคขั้นต่ำที่ต้องการ',
      'มาตรฐานอ้างอิงหรือรุ่นที่เทียบเท่า',
      'เงื่อนไขการรับประกัน/บริการหลังการขาย',
      'เงื่อนไขการทดสอบหรือการตรวจรับ',
      'เอกสารประกอบจากผู้ผลิตหรือผู้ให้บริการ'
    ]
  },
  CV: {
    title: 'ตัวอย่าง Curriculum Vitae (CV)',
    items: [
      'ข้อมูลประวัติส่วนตัวและการติดต่อ',
      'ประวัติการศึกษาและคุณวุฒิ',
      'ประสบการณ์ทำงาน/ผลงานที่เกี่ยวข้อง',
      'ความเชี่ยวชาญหรือทักษะเฉพาะด้าน',
      'ผลงานตีพิมพ์/การอบรม/ใบประกาศนียบัตร'
    ]
  },
  ServiceRates: {
    title: 'ตัวอย่างเอกสารอัตราค่าบริการ (Service Rates)',
    items: [
      'รายการบริการและหน่วยนับราคา',
      'อัตราค่าบริการต่อหน่วย',
      'เงื่อนไขค่าใช้จ่ายเพิ่มเติม (ถ้ามี)',
      'ช่วงเวลาที่อัตรานี้มีผลบังคับใช้',
      'ผู้รับผิดชอบและข้อมูลติดต่อหน่วยงาน'
    ]
  }
})

const BUDGET_CATEGORY_KEYS = Object.freeze({
  COMPENSATION: 'compensation',
  OPERATING: 'operating',
  TRAVEL: 'travel',
  MATERIAL: 'material',
  UTILITY: 'utility',
  EQUIPMENT: 'equipment',
  OTHER: 'other'
})

const DEFAULT_CALC_TYPE_BY_CATEGORY = Object.freeze({
  [BUDGET_CATEGORY_KEYS.COMPENSATION]: 'person_time_rate',
  [BUDGET_CATEGORY_KEYS.OPERATING]: 'fixed_amount',
  [BUDGET_CATEGORY_KEYS.TRAVEL]: 'trip_rate',
  [BUDGET_CATEGORY_KEYS.MATERIAL]: 'quantity_unit_price',
  [BUDGET_CATEGORY_KEYS.UTILITY]: 'month_rate',
  [BUDGET_CATEGORY_KEYS.EQUIPMENT]: 'quantity_unit_price',
  [BUDGET_CATEGORY_KEYS.OTHER]: 'fixed_amount'
})

const CALC_TYPE_SCHEMAS = Object.freeze({
  fixed_amount: {
    calcType: 'fixed_amount',
    label: 'ยอดเหมาจ่าย',
    formulaLabel: 'ยอดเงินรวม',
    fields: [
      { key: 'amount', label: 'ยอดเงิน (บาท)', defaultValue: 0, placeholder: '0' }
    ]
  },
  quantity_unit_price: {
    calcType: 'quantity_unit_price',
    label: 'จำนวน × ราคาต่อหน่วย',
    formulaLabel: 'จำนวน × ราคาต่อหน่วย',
    fields: [
      { key: 'quantity', label: 'จำนวน', defaultValue: 1, placeholder: '1' },
      { key: 'unitPrice', label: 'ราคาต่อหน่วย', defaultValue: 0, placeholder: '0' }
    ]
  },
  usage_unit_price: {
    calcType: 'usage_unit_price',
    label: 'ปริมาณใช้จริง × ราคาต่อหน่วย',
    formulaLabel: 'ปริมาณใช้จริง × ราคาต่อหน่วย',
    fields: [
      { key: 'usageAmount', label: 'ปริมาณใช้จริง', defaultValue: 1, placeholder: '1' },
      { key: 'unitPrice', label: 'ราคาต่อหน่วย', defaultValue: 0, placeholder: '0' }
    ]
  },
  person_time_rate: {
    calcType: 'person_time_rate',
    label: 'จำนวนคน × จำนวนครั้ง × อัตราต่อครั้ง',
    formulaLabel: 'จำนวนคน × จำนวนครั้ง × อัตราต่อครั้ง',
    fields: [
      { key: 'persons', label: 'จำนวนคน', defaultValue: 1, placeholder: '1' },
      { key: 'times', label: 'จำนวนครั้ง', defaultValue: 1, placeholder: '1' },
      { key: 'ratePerTime', label: 'อัตราต่อครั้ง', defaultValue: 0, placeholder: '0' }
    ]
  },
  person_day_rate: {
    calcType: 'person_day_rate',
    label: 'จำนวนคน × จำนวนวัน × อัตราต่อคน',
    formulaLabel: 'จำนวนคน × จำนวนวัน × อัตราต่อคน',
    fields: [
      { key: 'people', label: 'จำนวนคน', defaultValue: 1, placeholder: '1' },
      { key: 'days', label: 'จำนวนวัน', defaultValue: 1, placeholder: '1' },
      { key: 'ratePerPerson', label: 'อัตราต่อคน', defaultValue: 0, placeholder: '0' }
    ]
  },
  person_month_rate: {
    calcType: 'person_month_rate',
    label: 'จำนวนคน × จำนวนเดือน × อัตราต่อเดือน',
    formulaLabel: 'จำนวนคน × จำนวนเดือน × อัตราต่อเดือน',
    fields: [
      { key: 'persons', label: 'จำนวนคน', defaultValue: 1, placeholder: '1' },
      { key: 'months', label: 'จำนวนเดือน', defaultValue: 1, placeholder: '1' },
      { key: 'monthlyRate', label: 'อัตราต่อเดือน', defaultValue: 0, placeholder: '0' }
    ]
  },
  month_rate: {
    calcType: 'month_rate',
    label: 'จำนวนเดือน × อัตราต่อเดือน',
    formulaLabel: 'จำนวนเดือน × อัตราต่อเดือน',
    fields: [
      { key: 'months', label: 'จำนวนเดือน', defaultValue: 1, placeholder: '1' },
      { key: 'monthlyRate', label: 'อัตราต่อเดือน', defaultValue: 0, placeholder: '0' }
    ]
  },
  distance_rate: {
    calcType: 'distance_rate',
    label: 'ระยะทาง × อัตราต่อกม. × จำนวนเที่ยว',
    formulaLabel: 'ระยะทาง × อัตราต่อกม. × จำนวนเที่ยว',
    fields: [
      { key: 'distanceKm', label: 'ระยะทาง (กม.)', defaultValue: 1, placeholder: '1' },
      { key: 'ratePerKm', label: 'อัตราต่อกม.', defaultValue: 0, placeholder: '0' },
      { key: 'trips', label: 'จำนวนเที่ยว', defaultValue: 1, placeholder: '1' }
    ]
  },
  room_night_rate: {
    calcType: 'room_night_rate',
    label: 'จำนวนห้อง × จำนวนคืน × ราคาต่อห้อง',
    formulaLabel: 'จำนวนห้อง × จำนวนคืน × ราคาต่อห้อง',
    fields: [
      { key: 'rooms', label: 'จำนวนห้อง', defaultValue: 1, placeholder: '1' },
      { key: 'nights', label: 'จำนวนคืน', defaultValue: 1, placeholder: '1' },
      { key: 'roomRate', label: 'ราคาต่อห้อง', defaultValue: 0, placeholder: '0' }
    ]
  },
  trip_rate: {
    calcType: 'trip_rate',
    label: 'จำนวนหน่วย × จำนวนเที่ยว × อัตราต่อเที่ยว',
    formulaLabel: 'จำนวนหน่วย × จำนวนเที่ยว × อัตราต่อเที่ยว',
    fields: [
      { key: 'quantity', label: 'จำนวนหน่วย', defaultValue: 1, placeholder: '1' },
      { key: 'trips', label: 'จำนวนเที่ยว', defaultValue: 1, placeholder: '1' },
      { key: 'ratePerTrip', label: 'อัตราต่อเที่ยว', defaultValue: 0, placeholder: '0' }
    ]
  },
  license_subscription: {
    calcType: 'license_subscription',
    label: 'จำนวนสิทธิ์ × จำนวนเดือน × อัตราต่อเดือน',
    formulaLabel: 'จำนวนสิทธิ์ × จำนวนเดือน × อัตราต่อเดือน',
    fields: [
      { key: 'licenses', label: 'จำนวนสิทธิ์', defaultValue: 1, placeholder: '1' },
      { key: 'months', label: 'จำนวนเดือน', defaultValue: 1, placeholder: '1' },
      { key: 'monthlyRate', label: 'อัตราต่อเดือน', defaultValue: 0, placeholder: '0' }
    ]
  }
})

const LEGACY_ROW_FIELD_ALIASES = Object.freeze({
  amount: ['amount', 'total', 'budget'],
  quantity: ['quantity', 'qty', 'count'],
  unitPrice: ['unitPrice', 'unit_price', 'price', 'rate'],
  usageAmount: ['usageAmount', 'usage', 'usageQty'],
  persons: ['persons', 'people', 'personsCount'],
  times: ['times', 'time', 'round', 'rounds'],
  ratePerTime: ['ratePerTime', 'timeRate', 'rate'],
  people: ['people', 'persons', 'participants'],
  days: ['days', 'day'],
  ratePerPerson: ['ratePerPerson', 'personRate', 'rate'],
  months: ['months', 'month'],
  monthlyRate: ['monthlyRate', 'monthRate', 'rate'],
  distanceKm: ['distanceKm', 'distance', 'km'],
  ratePerKm: ['ratePerKm', 'kmRate', 'rate'],
  trips: ['trips', 'trip', 'times'],
  rooms: ['rooms', 'room'],
  nights: ['nights', 'night'],
  roomRate: ['roomRate', 'rate'],
  ratePerTrip: ['ratePerTrip', 'tripRate', 'rate'],
  licenses: ['licenses', 'license']
})

const BUDGET_KEYWORD_RULES = Object.freeze([
  {
    key: 'compensation_student_academic',
    category: BUDGET_CATEGORY_KEYS.COMPENSATION,
    keywords: ['นักศึกษาช่วยงานด้านวิชาการ'],
    aliases: ['นักศึกษาช่วยงานวิชาการ', 'นักศึกษาช่วยงาน'],
    calcType: 'person_month_rate',
    formulaLabel: 'จำนวนคน × จำนวนเดือน × อัตราต่อเดือน'
  },
  {
    key: 'compensation_student_general',
    category: BUDGET_CATEGORY_KEYS.COMPENSATION,
    keywords: ['นักศึกษาช่วยงานทั่วไป'],
    aliases: ['ผู้ช่วยงานทั่วไป'],
    calcType: 'person_month_rate',
    formulaLabel: 'จำนวนคน × จำนวนเดือน × อัตราต่อเดือน'
  },
  {
    key: 'compensation_informant',
    category: BUDGET_CATEGORY_KEYS.COMPENSATION,
    keywords: ['ผู้ให้ข้อมูล', 'ผู้ให้สัมภาษณ์', 'ผู้ตอบแบบสอบถาม', 'อาสาสมัคร'],
    aliases: ['informant', 'volunteer'],
    calcType: 'person_time_rate',
    formulaLabel: 'จำนวนคน × จำนวนครั้ง × อัตราต่อครั้ง'
  },
  {
    key: 'operating_lunch',
    category: BUDGET_CATEGORY_KEYS.OPERATING,
    keywords: ['อาหารกลางวัน'],
    aliases: ['อาหารเที่ยง'],
    calcType: 'person_day_rate',
    formulaLabel: 'จำนวนคน × จำนวนวัน × อัตราต่อคน'
  },
  {
    key: 'operating_snack',
    category: BUDGET_CATEGORY_KEYS.OPERATING,
    keywords: ['อาหารว่าง'],
    aliases: ['ของว่าง'],
    calcType: 'person_day_rate',
    formulaLabel: 'จำนวนคน × จำนวนวัน × อัตราต่อคน'
  },
  {
    key: 'operating_human_ethics',
    category: BUDGET_CATEGORY_KEYS.OPERATING,
    keywords: ['จริยธรรมการวิจัยในมนุษย์'],
    aliases: ['ค่าจริยธรรมการวิจัย'],
    calcType: 'fixed_amount',
    formulaLabel: 'ยอดเงินรวม'
  },
  {
    key: 'operating_scientific_analysis',
    category: BUDGET_CATEGORY_KEYS.OPERATING,
    keywords: ['วิเคราะห์ทดสอบทางวิทยาศาสตร์', 'วิเคราะห์ทางการแพทย์', 'ใช้ห้องปฏิบัติการ', 'เครื่องมือวิเคราะห์ทดสอบ'],
    aliases: ['ค่าตรวจวิเคราะห์', 'วิเคราะห์ตัวอย่าง'],
    calcType: 'quantity_unit_price',
    formulaLabel: 'จำนวน × ราคาต่อหน่วย'
  },
  {
    key: 'operating_field_assistant',
    category: BUDGET_CATEGORY_KEYS.OPERATING,
    keywords: ['ผู้ช่วยเก็บข้อมูลในพื้นที่'],
    aliases: ['ผู้ช่วยเก็บข้อมูล'],
    calcType: 'quantity_unit_price',
    formulaLabel: 'จำนวน × ราคาต่อหน่วย'
  },
  {
    key: 'operating_local_guide',
    category: BUDGET_CATEGORY_KEYS.OPERATING,
    keywords: ['ผู้นำทางในพื้นที่'],
    aliases: ['ผู้นำทาง'],
    calcType: 'trip_rate',
    formulaLabel: 'จำนวนหน่วย × จำนวนเที่ยว × อัตราต่อเที่ยว'
  },
  {
    key: 'operating_transcription',
    category: BUDGET_CATEGORY_KEYS.OPERATING,
    keywords: ['ถอดเทป'],
    aliases: ['ถอดเสียง'],
    calcType: 'usage_unit_price',
    formulaLabel: 'ปริมาณใช้จริง × ราคาต่อหน่วย'
  },
  {
    key: 'operating_contract',
    category: BUDGET_CATEGORY_KEYS.OPERATING,
    keywords: ['ค่าจ้างเหมาอื่นๆ', 'ค่าธรรมเนียมอื่น'],
    aliases: ['ค่าจ้างเหมา', 'ค่าธรรมเนียม'],
    calcType: 'fixed_amount',
    formulaLabel: 'ยอดเงินรวม'
  },
  {
    key: 'operating_copy',
    category: BUDGET_CATEGORY_KEYS.OPERATING,
    keywords: ['ถ่ายเอกสาร', 'จัดทำรูปเล่มรายงานวิจัย'],
    aliases: ['รูปเล่มรายงาน', 'พิมพ์รายงาน'],
    calcType: 'quantity_unit_price',
    formulaLabel: 'จำนวน × ราคาต่อหน่วย'
  },
  {
    key: 'operating_delivery',
    category: BUDGET_CATEGORY_KEYS.OPERATING,
    keywords: ['ไปรษณีย์และขนส่ง'],
    aliases: ['ไปรษณีย์', 'ขนส่ง'],
    calcType: 'quantity_unit_price',
    formulaLabel: 'จำนวน × ราคาต่อหน่วย'
  },
  {
    key: 'operating_phone',
    category: BUDGET_CATEGORY_KEYS.OPERATING,
    keywords: ['โทรศัพท์และโทรสารในประเทศ'],
    aliases: ['โทรศัพท์', 'โทรสาร'],
    calcType: 'month_rate',
    formulaLabel: 'จำนวนเดือน × อัตราต่อเดือน'
  },
  {
    key: 'operating_internet_service',
    category: BUDGET_CATEGORY_KEYS.OPERATING,
    keywords: ['บริการทางอินเตอร์เน็ต'],
    aliases: ['บริการทางอินเทอร์เน็ต', 'internet service'],
    calcType: 'month_rate',
    formulaLabel: 'จำนวนเดือน × อัตราต่อเดือน'
  },
  {
    key: 'travel_flight',
    category: BUDGET_CATEGORY_KEYS.TRAVEL,
    keywords: ['เครื่องบิน'],
    aliases: ['airfare', 'flight'],
    calcType: 'trip_rate',
    formulaLabel: 'จำนวนหน่วย × จำนวนเที่ยว × อัตราต่อเที่ยว'
  },
  {
    key: 'travel_personal_car',
    category: BUDGET_CATEGORY_KEYS.TRAVEL,
    keywords: ['รถยนต์ส่วนบุคคล'],
    aliases: ['รถส่วนตัว'],
    calcType: 'distance_rate',
    formulaLabel: 'ระยะทาง × อัตราต่อกม. × จำนวนเที่ยว'
  },
  {
    key: 'travel_van',
    category: BUDGET_CATEGORY_KEYS.TRAVEL,
    keywords: ['รถตู้'],
    aliases: ['van'],
    calcType: 'trip_rate',
    formulaLabel: 'จำนวนหน่วย × จำนวนเที่ยว × อัตราต่อเที่ยว'
  },
  {
    key: 'travel_taxi',
    category: BUDGET_CATEGORY_KEYS.TRAVEL,
    keywords: ['taxi', 'แท็กซี่'],
    aliases: ['แทกซี่'],
    calcType: 'trip_rate',
    formulaLabel: 'จำนวนหน่วย × จำนวนเที่ยว × อัตราต่อเที่ยว'
  },
  {
    key: 'travel_accommodation',
    category: BUDGET_CATEGORY_KEYS.TRAVEL,
    keywords: ['ที่พัก'],
    aliases: ['ค่าที่พัก'],
    calcType: 'room_night_rate',
    formulaLabel: 'จำนวนห้อง × จำนวนคืน × ราคาต่อห้อง'
  },
  {
    key: 'travel_allowance',
    category: BUDGET_CATEGORY_KEYS.TRAVEL,
    keywords: ['เบี้ยเลี้ยง'],
    aliases: ['ค่าเบี้ยเลี้ยง'],
    calcType: 'person_day_rate',
    formulaLabel: 'จำนวนคน × จำนวนวัน × อัตราต่อคน'
  },
  {
    key: 'material_program',
    category: BUDGET_CATEGORY_KEYS.MATERIAL,
    keywords: ['โปรแกรมคอมพิวเตอร์'],
    aliases: ['software'],
    calcType: 'quantity_unit_price',
    formulaLabel: 'จำนวน × ราคาต่อหน่วย'
  },
  {
    key: 'material_program_license',
    category: BUDGET_CATEGORY_KEYS.MATERIAL,
    keywords: ['ลิขสิทธิ์โปรแกรมคอมพิวเตอร์'],
    aliases: ['software license', 'subscription'],
    calcType: 'license_subscription',
    formulaLabel: 'จำนวนสิทธิ์ × จำนวนเดือน × อัตราต่อเดือน'
  },
  {
    key: 'material_general',
    category: BUDGET_CATEGORY_KEYS.MATERIAL,
    keywords: [
      'วัสดุสำนักงาน',
      'วัสดุคอมพิวเตอร์',
      'วัสดุวิทยาศาสตร์',
      'วัสดุไฟฟ้าและวิทยุ',
      'วัสดุงานบ้านงานครัว',
      'วัสดุก่อสร้างและประปา',
      'วัสดุเชื้อเพลิงและหล่อลื่น',
      'วัสดุการเกษตร',
      'วัสดุโฆษณาและเผยแพร่',
      'วัสดุเครื่องแต่งกาย',
      'วัสดุกีฬา',
      'วัสดุสื่อ/ตำรา/วารสาร',
      'เวชภัณฑ์ยา',
      'เวชภัณฑ์ที่มิใช่ยา',
      'บรรจุภัณฑ์',
      'วัสดุของที่ระลึก'
    ],
    aliases: ['วัสดุ', 'อุปกรณ์สิ้นเปลือง'],
    calcType: 'quantity_unit_price',
    formulaLabel: 'จำนวน × ราคาต่อหน่วย'
  },
  {
    key: 'utility_water',
    category: BUDGET_CATEGORY_KEYS.UTILITY,
    keywords: ['ค่าน้ำ'],
    aliases: ['ค่าน้ํา'],
    calcType: 'month_rate',
    formulaLabel: 'จำนวนเดือน × อัตราต่อเดือน'
  },
  {
    key: 'utility_electric',
    category: BUDGET_CATEGORY_KEYS.UTILITY,
    keywords: ['ค่าไฟ'],
    aliases: ['ค่าไฟฟ้า'],
    calcType: 'month_rate',
    formulaLabel: 'จำนวนเดือน × อัตราต่อเดือน'
  },
  {
    key: 'utility_internet',
    category: BUDGET_CATEGORY_KEYS.UTILITY,
    keywords: ['ค่าอินเทอร์เน็ต', 'ค่าอินเตอร์เน็ต'],
    aliases: ['internet'],
    calcType: 'month_rate',
    formulaLabel: 'จำนวนเดือน × อัตราต่อเดือน'
  },
  {
    key: 'utility_system_service',
    category: BUDGET_CATEGORY_KEYS.UTILITY,
    keywords: ['ค่าใช้บริการระบบ'],
    aliases: ['system service'],
    calcType: 'fixed_amount',
    formulaLabel: 'ยอดเงินรวม'
  }
])

const FORBIDDEN_BUDGET_ITEM_RULES = Object.freeze([
  {
    key: 'forbidden_compensation_research_team',
    label: 'ค่าตอบแทนคณะผู้วิจัย',
    keywords: ['ค่าตอบแทนคณะผู้วิจัย']
  },
  {
    key: 'forbidden_compensation_advisor',
    label: 'ค่าตอบแทนที่ปรึกษาโครงการวิจัย',
    keywords: ['ค่าตอบแทนที่ปรึกษาโครงการวิจัย1', 'ค่าตอบแทนที่ปรึกษาโครงการวิจัย 1', 'ค่าตอบแทนที่ปรึกษาโครงการวิจัย']
  },
  {
    key: 'forbidden_team_meeting_travel_training',
    label: 'ค่าใช้จ่ายการจัดการประชุม เดินทางเข้าร่วมประชุม สัมมนา ฝึกอบรม ของคณะผู้วิจัย',
    keywords: ['ค่าใช้จ่ายการจัดการประชุม เดินทางเข้าร่วมประชุม สัมมนา ฝึกอบรม ของคณะผู้วิจัย']
  },
  {
    key: 'forbidden_statistical_analysis',
    label: 'ค่าวิเคราะห์ข้อมูลทางสถิติ',
    keywords: ['ค่าวิเคราะห์ข้อมูลทางสถิติ', 'วิเคราะห์ข้อมูลทางสถิติ']
  },
  {
    key: 'forbidden_construction_cost',
    label: 'ค่าสิ่งก่อสร้าง หรือ วัสดุที่เกี่ยวกับการก่อสร้าง',
    keywords: ['ค่าสิ่งก่อสร้าง', 'วัสดุที่เกี่ยวกับการก่อสร้าง', 'วัสดุก่อสร้าง']
  },
  {
    key: 'forbidden_project_management',
    label: 'ค่าบริหารจัดการโครงการวิจัย',
    keywords: ['ค่าบริหารจัดการโครงการวิจัย', 'ค่าบริหารจัดการโครงการ']
  },
  {
    key: 'forbidden_overtime_staff',
    label: 'ค่าปฏิบัติงานล่วงเวลาของพนักงาน',
    keywords: ['ค่าปฏิบัติงานล่วงเวลาของพนักงาน', 'ค่าล่วงเวลาของพนักงาน', 'ค่าปฏิบัติงานล่วงเวลา']
  },
  {
    key: 'forbidden_page_charge',
    label: 'ค่าธรรมเนียมการตีพิมพ์บทความในวารสารวิชาการ (ค่า Page Charge)',
    keywords: ['ค่าธรรมเนียมการตีพิมพ์บทความในวารสารวิชาการ', 'ค่า page charge', 'page charge']
  },
  {
    key: 'forbidden_review_literature',
    label: 'ค่าตอบแทนผู้ทบทวนวรรณกรรม (Review Literature)',
    keywords: ['ค่าตอบแทนผู้ทบทวนวรรณกรรม', 'review literature']
  },
  {
    key: 'forbidden_translation_proofread_report',
    label: 'ค่าจ้างเหมาแปลภาษา พิสูจน์อักษร พิมพ์รายงาน',
    keywords: ['ค่าจ้างเหมาแปลภาษา พิสูจน์อักษร พิมพ์รายงาน', 'ค่าจ้างเหมาแปลภาษา', 'ค่าพิสูจน์อักษร', 'ค่าพิมพ์รายงาน']
  },
  {
    key: 'forbidden_equipment_committee_clause',
    label: 'ค่าครุภัณฑ์ ให้เป็นไปตามมติการพิจารณาของคณะกรรมการพิจารณาข้อเสนอโครงการ',
    keywords: ['ค่าครุภัณฑ์ ให้เป็นไปตามมติการพิจารณาของคณะกรรมการพิจารณาข้อเสนอโครงการ']
  }
])

export default {
  name: 'BudgetSection',
  model: {
    prop: 'modelValue',
    event: 'update:modelValue'
  },
  props: {
    modelValue: {
      type: Object,
      default: null
    },
    proposalId: {
      type: [String, Number],
      default: ''
    },
    fundingType: {
      type: String,
      default: ''
    },
    resetToken: {
      type: [Number, String],
      default: 0
    },
    isReadOnly: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      suppressEmit: false,
      emitScheduled: false,
      categories: [
        {
          key: BUDGET_CATEGORY_KEYS.COMPENSATION, name: 'หมวดค่าตอบแทน', isOther: false, items: [],
          defaultMultipliers: [
            { label: 'จำนวน (คน)', value: 1, isAdmin: false },
            { label: 'จำนวน (ครั้ง/ด.)', value: 1, isAdmin: false },
            { label: 'อัตรา (บาท)', value: 5000, isAdmin: true }
          ]
        },
        {
          key: BUDGET_CATEGORY_KEYS.OPERATING, name: 'หมวดค่าใช้สอย', isOther: false, items: [],
          defaultMultipliers: [
            { label: 'จำนวน (คน/ชิ้น)', value: 1, isAdmin: false },
            { label: 'จำนวน (วัน/ครั้ง)', value: 1, isAdmin: false },
            { label: 'อัตรา (บาท)', value: 5000, isAdmin: true }
          ]
        },
        {
          key: BUDGET_CATEGORY_KEYS.TRAVEL, name: 'หมวดค่าเดินทาง', isOther: false, items: [],
          defaultMultipliers: [
            { label: 'จำนวน (คน)', value: 1, isAdmin: false },
            { label: 'จำนวน (วัน/เที่ยว)', value: 1, isAdmin: false },
            { label: 'อัตรา (บาท)', value: 5000, isAdmin: true }
          ]
        },
        {
          key: BUDGET_CATEGORY_KEYS.MATERIAL, name: 'หมวดค่าวัสดุ', isOther: false, items: [],
          defaultMultipliers: [
            { label: 'จำนวน', value: 1, isAdmin: false },
            { label: 'ตัวคูณ (ถ้ามี)', value: 1, isAdmin: false },
            { label: 'ราคา/หน่วย', value: 5000, isAdmin: true }
          ]
        },
        {
          key: BUDGET_CATEGORY_KEYS.UTILITY, name: 'หมวดค่าสาธารณูปโภค', isOther: false, items: [],
          defaultMultipliers: [
            { label: 'จำนวน (เดือน)', value: 1, isAdmin: false },
            { label: 'จำนวน (หน่วย)', value: 1, isAdmin: false },
            { label: 'อัตรา (บาท)', value: 5000, isAdmin: true }
          ]
        },
        {
          key: BUDGET_CATEGORY_KEYS.EQUIPMENT, name: 'หมวดครุภัณฑ์', isOther: false, items: [],
          defaultMultipliers: [
            { label: 'จำนวน (รายการ)', value: 1, isAdmin: false },
            { label: 'ตัวคูณ (ถ้ามี)', value: 1, isAdmin: false },
            { label: 'ราคา/ชุด', value: 5000, isAdmin: true }
          ]
        },
        {
          key: BUDGET_CATEGORY_KEYS.OTHER, name: 'หมวดอื่นๆ', isOther: true, items: [],
          defaultMultipliers: [
            { label: 'จำนวน', value: 1, isAdmin: false },
            { label: 'หน่วย', value: 1, isAdmin: false },
            { label: 'ราคา/หน่วย', value: 0, isAdmin: false }
          ]
        },
      ]
    };
  },
  computed: {
    isDarkTheme() {
      return Boolean(this.$store && this.$store.state && this.$store.state.darkMode)
    },
    categoryHeaderStyle() {
      if (this.isDarkTheme) {
        return 'background: linear-gradient(135deg, #1a2330 0%, #233244 70%, #2e4056 120%) !important;'
      }
      return 'background: linear-gradient(135deg, #8b1212 0%, #c59b3a 120%) !important;'
    },
    tableHeadStyle() {
      if (this.isDarkTheme) {
        return 'background: linear-gradient(135deg, #17202c 0%, #1f2d3d 65%, #2c3f56 140%) !important; opacity: 0.98;'
      }
      return 'background: linear-gradient(135deg, #7a0f0f 0%, #8b1212 65%, #c59b3a 140%) !important; opacity: 0.98;'
    },
    grandTotal() {
      return this.categories.reduce((sum, cat) => {
        return sum + cat.items.reduce((itemSum, item) => itemSum + item.total, 0);
      }, 0);
    },
    totalPeriod1() {
      return this.categories.reduce((sum, cat) => {
        return sum + cat.items.reduce((itemSum, item) => itemSum + this.toNumber(item.periods[0]), 0);
      }, 0);
    },
    totalPeriod2() {
      return this.categories.reduce((sum, cat) => {
        return sum + cat.items.reduce((itemSum, item) => itemSum + this.toNumber(item.periods[1]), 0);
      }, 0);
    },
    totalPeriod3() {
      return this.categories.reduce((sum, cat) => {
        return sum + cat.items.reduce((itemSum, item) => itemSum + this.toNumber(item.periods[2]), 0);
      }, 0);
    },
    expectedPeriod1() {
      return Math.round(this.grandTotal * 0.5); // 50%
    },
    expectedPeriod2() {
      return Math.round(this.grandTotal * 0.4); // 40%
    },
    expectedPeriod3() {
      return this.grandTotal - this.expectedPeriod1 - this.expectedPeriod2; // 10% (remaining)
    },
    isPeriod1Valid() {
      return this.isCloseEnough(this.totalPeriod1, this.expectedPeriod1);
    },
    isPeriod2Valid() {
      return this.isCloseEnough(this.totalPeriod2, this.expectedPeriod2);
    },
    isPeriod3Valid() {
      return this.isCloseEnough(this.totalPeriod3, this.expectedPeriod3);
    },
    travelTotal() {
      const travelCat = this.categories.find(c =>
        this.getCategoryKey(c) === BUDGET_CATEGORY_KEYS.TRAVEL || c.name === 'หมวดค่าเดินทาง'
      );
      return travelCat ? travelCat.items.reduce((sum, item) => sum + item.total, 0) : 0;
    },
    // 2. คำนวณยอดรวมเฉพาะหมวดครุภัณฑ์
    equipmentTotal() {
      const equipCat = this.categories.find(c =>
        this.getCategoryKey(c) === BUDGET_CATEGORY_KEYS.EQUIPMENT || c.name === 'หมวดครุภัณฑ์'
      );
      return equipCat ? equipCat.items.reduce((sum, item) => sum + item.total, 0) : 0;
    },
    // 3. คำนวณเพดานสูงสุด (25% ของเพดานงบที่เลือก)
    limit25Percent() {
      return this.hasBudgetLimit ? this.budgetLimit * 0.25 : 0;
    },
    // 4. เช็คว่าหมวดค่าเดินทางเกิน 25% หรือไม่
    isTravelExceeded() {
      return this.hasBudgetLimit && this.travelTotal > this.limit25Percent;
    },
    // 5. เช็คว่าหมวดครุภัณฑ์เกิน 25% หรือไม่
    isEquipmentExceeded() {
      return this.hasBudgetLimit && this.equipmentTotal > this.limit25Percent;
    },
    budgetLimit() {
      const key = String(this.fundingType || '').trim()
      const limit = FUNDING_TYPE_LIMITS[key]
      return Number.isFinite(limit) ? limit : 0
    },
    hasBudgetLimit() {
      return this.budgetLimit > 0
    },
    fundingTypeLabel() {
      const key = String(this.fundingType || '').trim()
      return FUNDING_TYPE_LABELS[key] || 'ไม่ระบุประเภททุน'
    },
    remainingBudget() {
      if (!this.hasBudgetLimit) return 0
      return this.budgetLimit - this.grandTotal
    },
    isBudgetLimitExceeded() {
      return this.hasBudgetLimit && this.grandTotal > this.budgetLimit
    }
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(val) {
        this.applyModelValue(val)
      }
    },
    resetToken(newVal, oldVal) {
      if (newVal === oldVal) return
      this.resetBudgetData()
    },
    categories: {
      deep: true,
      handler() {
        this.queueEmitModelValue()
      }
    }
  },
  methods: {
    getCategoryTitle(category) {
      const name = category && category.name ? String(category.name) : ''
      const categoryKey = this.getCategoryKey(category)
      if (categoryKey === BUDGET_CATEGORY_KEYS.TRAVEL || categoryKey === BUDGET_CATEGORY_KEYS.EQUIPMENT) {
        const limitAmount = this.formatNumber(this.limit25Percent)
        return `${name} (ไม่เกิน ร้อยละ 25 ของงบประมาณ/ไม่เกิน ${limitAmount} บาท)`
      }
      return name
    },
    queueEmitModelValue() {
      if (this.suppressEmit) return
      if (this.isReadOnly) return
      if (this.emitScheduled) return

      this.emitScheduled = true
      this.$nextTick(() => {
        this.emitScheduled = false
        this.emitModelValue()
      })
    },
    resetBudgetData() {
      this.suppressEmit = true
      this.categories = (this.categories || []).map(category => ({
        ...category,
        items: []
      }))
      this.$nextTick(() => {
        this.suppressEmit = false
        this.emitModelValue()
      })
    },
    applyModelValue(val) {
      if (!val || !Array.isArray(val.categories)) return
      if (!this.shouldApplyIncomingModel(val.categories)) return

      this.suppressEmit = true
      const saved = val.categories

      // Merge saved categories into defaults by matching name to keep defaultMultipliers intact.
      this.categories = (this.categories || []).map((cat) => {
        const match = saved.find(s => s && s.name === cat.name)
        if (!match) return cat
        return {
          ...cat,
          ...match,
          defaultMultipliers: cat.defaultMultipliers || match.defaultMultipliers || []
        }
      })

      this.categories.forEach((category, catIndex) => {
        if (!category || !Array.isArray(category.items)) return
        category.key = this.getCategoryKey(category, catIndex)
        category.items.forEach((item) => {
          this.normalizeRowModel(item, category, catIndex)
          this.calculateRowTotal(item)
        })
      })

      this.formatAllNumericInputs()

      this.$nextTick(() => {
        this.suppressEmit = false
      })
    },
    shouldApplyIncomingModel(incomingCategories) {
      const incoming = Array.isArray(incomingCategories) ? incomingCategories : []
      const local = Array.isArray(this.categories) ? this.categories : []

      if (incoming.length !== local.length) return true

      for (let catIndex = 0; catIndex < incoming.length; catIndex += 1) {
        const incomingCategory = incoming[catIndex] || {}
        const localCategory = local[catIndex] || {}

        if (String(incomingCategory.name || '') !== String(localCategory.name || '')) return true

        const incomingItems = Array.isArray(incomingCategory.items) ? incomingCategory.items : []
        const localItems = Array.isArray(localCategory.items) ? localCategory.items : []
        if (incomingItems.length !== localItems.length) return true

        for (let itemIndex = 0; itemIndex < incomingItems.length; itemIndex += 1) {
          const incomingItem = incomingItems[itemIndex] || {}
          const localItem = localItems[itemIndex] || {}

          if (String(incomingItem.id || '') !== String(localItem.id || '')) return true

          const incomingTotal = this.toNumber(incomingItem.total)
          const localTotal = this.toNumber(localItem.total)
          if (incomingTotal !== localTotal) return true

          const incomingPeriods = Array.isArray(incomingItem.periods) ? incomingItem.periods : []
          const localPeriods = Array.isArray(localItem.periods) ? localItem.periods : []
          const periodLength = Math.max(incomingPeriods.length, localPeriods.length)
          for (let periodIndex = 0; periodIndex < periodLength; periodIndex += 1) {
            const incomingPeriod = this.toRawNumberString(incomingPeriods[periodIndex])
            const localPeriod = this.toRawNumberString(localPeriods[periodIndex])
            if (incomingPeriod !== localPeriod) return true
          }

          const incomingAttachmentSyncKey = this.getAttachmentSyncKey(incomingItem && incomingItem.attachment)
          const localAttachmentSyncKey = this.getAttachmentSyncKey(localItem && localItem.attachment)
          if (incomingAttachmentSyncKey !== localAttachmentSyncKey) return true
        }
      }

      return false
    },
    getAttachmentSyncKey(attachment) {
      if (!attachment || typeof attachment !== 'object') return ''
      const fileId = this.normalizeAttachmentFileId(attachment.fileId || attachment.id || attachment._id || '')
      const fileName = String(attachment.fileName || attachment.name || attachment.originalName || '').trim()
      const docType = String(attachment.docType || attachment.type || '').trim()
      const uploading = attachment.uploading ? '1' : '0'
      return `${fileId}|${fileName}|${docType}|${uploading}`
    },
    emitModelValue() {
      if (this.suppressEmit) return
      if (this.isReadOnly) return
      this.$emit('update:modelValue', {
        categories: this.getSanitizedCategories(),
        grandTotal: this.grandTotal
      })
    },
    getBudgetData() {
      return {
        categories: this.getSanitizedCategories(),
        grandTotal: this.grandTotal
      }
    },
    toNumber(value) {
      if (value === null || value === undefined || value === '') return 0
      const parsed = Number(this.toRawNumberString(value))
      return Number.isFinite(parsed) ? parsed : 0
    },
    isCloseEnough(actual, expected, tolerance = 1) {
      return Math.abs(this.toNumber(actual) - this.toNumber(expected)) <= tolerance
    },
    toRawNumberString(value) {
      let cleanVal = value === null || value === undefined
        ? ''
        : String(value).replace(/\D/g, '')
      if (cleanVal.length > 1 && cleanVal.startsWith('0')) {
        cleanVal = cleanVal.replace(/^0+/, '')
        if (cleanVal === '') cleanVal = '0'
      }
      return cleanVal
    },
    formatNumberInputValue(value) {
      const raw = this.toRawNumberString(value)
      if (!raw) return ''
      return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    },
    formatAllNumericInputs() {
      this.categories.forEach((category) => {
        if (!category || !Array.isArray(category.items)) return
        category.items.forEach((item) => {
          this.formatItemNumericInputs(item, category)
        })
      })
    },
    formatItemNumericInputs(item, category = null) {
      if (!item || typeof item !== 'object') return

      if (item.inputs && typeof item.inputs === 'object') {
        Object.keys(item.inputs).forEach((key) => {
          item.inputs[key] = this.formatNumberInputValue(item.inputs[key])
        })
      }

      if (Array.isArray(item.multipliers)) {
        item.multipliers.forEach((multiplier) => {
          if (!multiplier || typeof multiplier !== 'object') return
          multiplier.value = this.formatNumberInputValue(multiplier.value)
        })
      }

      if (Array.isArray(item.periods)) {
        item.periods = item.periods.map(period => this.formatNumberInputValue(period))
      }

      if (!item.isManualMultiplier) {
        this.syncRowMultipliersWithInputs(item, category)
      }
    },
    getSanitizedCategories() {
      const categories = JSON.parse(JSON.stringify(this.categories || []))
      categories.forEach((category) => {
        if (!category || !Array.isArray(category.items)) return
        category.items.forEach((item) => {
          if (!item || typeof item !== 'object') return
          item.categoryKey = this.getCategoryKey(category)
          if (Array.isArray(item.multipliers)) {
            item.multipliers.forEach((multiplier) => {
              if (!multiplier || typeof multiplier !== 'object') return
              multiplier.value = this.toRawNumberString(multiplier.value)
            })
          }
          if (item.inputs && typeof item.inputs === 'object') {
            Object.keys(item.inputs).forEach((key) => {
              item.inputs[key] = this.toRawNumberString(item.inputs[key])
            })
          }
          if (Array.isArray(item.periods)) {
            item.periods = item.periods.map(period => this.toRawNumberString(period))
          }
        })
      })
      return categories
    },
    setRowProp(row, key, value) {
      if (!row || typeof row !== 'object') return
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        row[key] = value
        return
      }
      this.$set(row, key, value)
    },
    getCategoryKey(category, index = -1) {
      const fromCategory = category && category.key ? String(category.key).trim() : ''
      if (fromCategory) return fromCategory

      const normalizedName = category && category.name ? String(category.name).trim() : ''
      if (normalizedName.includes('ค่าตอบแทน')) return BUDGET_CATEGORY_KEYS.COMPENSATION
      if (normalizedName.includes('ค่าใช้สอย')) return BUDGET_CATEGORY_KEYS.OPERATING
      if (normalizedName.includes('ค่าเดินทาง')) return BUDGET_CATEGORY_KEYS.TRAVEL
      if (normalizedName.includes('ค่าวัสดุ')) return BUDGET_CATEGORY_KEYS.MATERIAL
      if (normalizedName.includes('สาธารณูปโภค')) return BUDGET_CATEGORY_KEYS.UTILITY
      if (normalizedName.includes('ครุภัณฑ์')) return BUDGET_CATEGORY_KEYS.EQUIPMENT
      if (normalizedName.includes('อื่น')) return BUDGET_CATEGORY_KEYS.OTHER

      const fallbackByIndex = [
        BUDGET_CATEGORY_KEYS.COMPENSATION,
        BUDGET_CATEGORY_KEYS.OPERATING,
        BUDGET_CATEGORY_KEYS.TRAVEL,
        BUDGET_CATEGORY_KEYS.MATERIAL,
        BUDGET_CATEGORY_KEYS.UTILITY,
        BUDGET_CATEGORY_KEYS.EQUIPMENT,
        BUDGET_CATEGORY_KEYS.OTHER
      ]

      if (Number.isInteger(index) && index >= 0 && index < fallbackByIndex.length) {
        return fallbackByIndex[index]
      }
      return BUDGET_CATEGORY_KEYS.OTHER
    },
    getItemSearchListId(catIndex) {
      return `budget-item-search-list-${catIndex}`
    },
    getSearchOptionsByCategory(category, catIndex = -1) {
      const categoryKey = this.getCategoryKey(category, catIndex)
      const seen = new Set()
      const options = []

      BUDGET_KEYWORD_RULES.forEach((rule) => {
        if (!rule || rule.category !== categoryKey) return
        const words = []
          .concat(Array.isArray(rule.keywords) ? rule.keywords : [])
          .concat(Array.isArray(rule.aliases) ? rule.aliases : [])

        words.forEach((word) => {
          const normalizedWord = String(word || '').trim()
          if (!normalizedWord) return
          if (this.detectForbiddenBudgetItem(normalizedWord)) return
          const key = normalizedWord.toLowerCase()
          if (seen.has(key)) return
          seen.add(key)
          options.push(normalizedWord)
        })
      })

      return options
    },
    isKnownCalcType(calcType) {
      return Boolean(calcType && CALC_TYPE_SCHEMAS[calcType])
    },
    getDefaultCalcTypeByCategory(category) {
      const categoryKey = typeof category === 'string'
        ? this.getCategoryKey({ key: category, name: category })
        : this.getCategoryKey(category)
      return DEFAULT_CALC_TYPE_BY_CATEGORY[categoryKey] || 'fixed_amount'
    },
    getSchemaByCalcType(calcType) {
      if (this.isKnownCalcType(calcType)) return CALC_TYPE_SCHEMAS[calcType]
      return CALC_TYPE_SCHEMAS.fixed_amount
    },
    getFieldsForRow(row) {
      const schema = this.getSchemaByCalcType(row && row.calcType)
      return Array.isArray(schema.fields) ? schema.fields : []
    },
    getFormulaLabel(row) {
      if (!row || typeof row !== 'object') return ''
      if (row.formulaPreview) return row.formulaPreview
      return this.getSchemaByCalcType(row.calcType).formulaLabel
    },
    getFormulaPreview(row) {
      if (!row || typeof row !== 'object') return ''
      const schema = this.getSchemaByCalcType(row.calcType)
      const fields = Array.isArray(schema.fields) ? schema.fields : []
      if (fields.length === 0) return schema.formulaLabel

      const values = fields.map(field => this.toNumber(row.inputs && row.inputs[field.key]))
      const hasValue = values.some(value => value > 0)
      if (!hasValue) return schema.formulaLabel

      const total = this.getCalculatedTotalByCalcType(row.calcType, row.inputs)
      if (values.length === 1) {
        return `${this.formatNumber(values[0])} = ${this.formatNumber(total)}`
      }
      return `${values.map(value => this.formatNumber(value)).join(' × ')} = ${this.formatNumber(total)}`
    },
    normalizeKeywordText(text) {
      return String(text || '')
        .toLowerCase()
        .replace(/[()（）]/g, ' ')
        .replace(/[.,\-_/\\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    },
    detectForbiddenBudgetItem(itemName) {
      const normalizedName = this.normalizeKeywordText(itemName)
      if (!normalizedName) return null

      for (let index = 0; index < FORBIDDEN_BUDGET_ITEM_RULES.length; index += 1) {
        const rule = FORBIDDEN_BUDGET_ITEM_RULES[index]
        if (!rule || !Array.isArray(rule.keywords)) continue

        const isMatched = rule.keywords.some((keyword) => {
          const normalizedKeyword = this.normalizeKeywordText(keyword)
          return normalizedKeyword && normalizedName.includes(normalizedKeyword)
        })

        if (isMatched) return rule
      }

      return null
    },
    applyForbiddenItemState(item) {
      if (!item || typeof item !== 'object') return null

      const rule = this.detectForbiddenBudgetItem(item.name)
      if (!rule) {
        this.setRowProp(item, 'forbiddenRuleKey', '')
        this.setRowProp(item, 'forbiddenItemMessage', '')
        return null
      }

      this.setRowProp(item, 'forbiddenRuleKey', rule.key)
      this.setRowProp(item, 'forbiddenItemMessage', `มหาวิทยาลัยไม่สนับสนุนให้ตั้งงบประมาณรายการ: ${rule.label}`)
      return rule
    },
    hasUsableValue(value) {
      return !(value === null || value === undefined || value === '')
    },
    getLegacyValueForField(fieldKey, row, multipliers, index = 0) {
      const aliases = LEGACY_ROW_FIELD_ALIASES[fieldKey] || []
      for (let i = 0; i < aliases.length; i += 1) {
        const alias = aliases[i]
        if (row && this.hasUsableValue(row[alias])) return row[alias]
      }

      if (Array.isArray(multipliers) && multipliers[index] && this.hasUsableValue(multipliers[index].value)) {
        return multipliers[index].value
      }

      if (fieldKey === 'unitPrice' || fieldKey === 'monthlyRate' || fieldKey === 'ratePerTime' || fieldKey === 'ratePerPerson' || fieldKey === 'ratePerTrip' || fieldKey === 'ratePerKm' || fieldKey === 'roomRate') {
        const lastMultiplier = Array.isArray(multipliers) && multipliers.length > 0
          ? multipliers[multipliers.length - 1]
          : null
        if (lastMultiplier && this.hasUsableValue(lastMultiplier.value)) {
          return lastMultiplier.value
        }
      }

      if (fieldKey === 'amount' && row && this.hasUsableValue(row.total)) {
        return row.total
      }

      return ''
    },
    normalizeCalcInputs(calcType, existingInputs = {}, legacyMultipliers = [], row = null) {
      const schema = this.getSchemaByCalcType(calcType)
      const fields = Array.isArray(schema.fields) ? schema.fields : []
      const safeInputs = existingInputs && typeof existingInputs === 'object' ? existingInputs : {}
      const normalized = {}

      fields.forEach((field, index) => {
        let value = safeInputs[field.key]
        if (!this.hasUsableValue(value)) {
          value = this.getLegacyValueForField(field.key, row, legacyMultipliers, index)
        }
        if (!this.hasUsableValue(value)) {
          value = field.defaultValue
        }
        normalized[field.key] = this.formatNumberInputValue(value)
      })

      return normalized
    },
    detectRuleFromKeyword(itemName, category) {
      const text = String(itemName || '').toLowerCase().trim()
      if (!text) return null

      const categoryKey = this.getCategoryKey({ key: category, name: category })
      for (let ruleIndex = 0; ruleIndex < BUDGET_KEYWORD_RULES.length; ruleIndex += 1) {
        const rule = BUDGET_KEYWORD_RULES[ruleIndex]
        if (!rule || rule.category !== categoryKey) continue

        const candidates = []
          .concat(Array.isArray(rule.keywords) ? rule.keywords : [])
          .concat(Array.isArray(rule.aliases) ? rule.aliases : [])

        const matched = candidates.some(keyword => {
          const normalizedKeyword = String(keyword || '').toLowerCase().trim()
          return normalizedKeyword && text.includes(normalizedKeyword)
        })

        if (matched) return rule
      }

      return null
    },
    syncRowMultipliersWithInputs(row, category = null) {
      if (!row || typeof row !== 'object') return
      const isManual = Boolean(row.isManualMultiplier || (category && category.isOther))
      if (isManual) return

      const fields = this.getFieldsForRow(row)
      const multipliers = fields.map(field => ({
        label: field.label,
        value: this.formatNumberInputValue(row.inputs && row.inputs[field.key]),
        isAdmin: false,
        fieldKey: field.key
      }))
      this.setRowProp(row, 'multipliers', multipliers)
    },
    getCalculatedTotalByCalcType(calcType, inputs = {}) {
      const values = inputs && typeof inputs === 'object' ? inputs : {}
      switch (calcType) {
        case 'fixed_amount':
          return this.toNumber(values.amount)
        case 'quantity_unit_price':
          return this.toNumber(values.quantity) * this.toNumber(values.unitPrice)
        case 'usage_unit_price':
          return this.toNumber(values.usageAmount) * this.toNumber(values.unitPrice)
        case 'person_time_rate':
          return this.toNumber(values.persons) * this.toNumber(values.times) * this.toNumber(values.ratePerTime)
        case 'person_day_rate':
          return this.toNumber(values.people) * this.toNumber(values.days) * this.toNumber(values.ratePerPerson)
        case 'person_month_rate':
          return this.toNumber(values.persons) * this.toNumber(values.months) * this.toNumber(values.monthlyRate)
        case 'month_rate':
          return this.toNumber(values.months) * this.toNumber(values.monthlyRate)
        case 'distance_rate':
          return this.toNumber(values.distanceKm) * this.toNumber(values.ratePerKm) * this.toNumber(values.trips)
        case 'room_night_rate':
          return this.toNumber(values.rooms) * this.toNumber(values.nights) * this.toNumber(values.roomRate)
        case 'trip_rate':
          return this.toNumber(values.quantity) * this.toNumber(values.trips) * this.toNumber(values.ratePerTrip)
        case 'license_subscription':
          return this.toNumber(values.licenses) * this.toNumber(values.months) * this.toNumber(values.monthlyRate)
        default:
          return 0
      }
    },
    normalizeRowModel(item, category, catIndex = -1) {
      if (!item || typeof item !== 'object') return

      const categoryKey = this.getCategoryKey(category, catIndex)
      const isManualMultiplier = Boolean(category && category.isOther)
      this.setRowProp(item, 'categoryKey', categoryKey)
      this.setRowProp(item, 'isManualMultiplier', isManualMultiplier)
      this.setRowProp(item, 'name', String(item.name || ''))
      this.setRowProp(item, 'attachment', item.attachment || null)
      this.setRowProp(item, 'periodError', Boolean(item.periodError))
      this.setRowProp(item, 'forbiddenRuleKey', String(item.forbiddenRuleKey || ''))
      this.setRowProp(item, 'forbiddenItemMessage', String(item.forbiddenItemMessage || ''))

      const periods = Array.isArray(item.periods) ? item.periods.slice(0, 3) : []
      while (periods.length < 3) periods.push('')
      this.setRowProp(item, 'periods', periods.map(period => this.formatNumberInputValue(period)))

      if (!Array.isArray(item.multipliers)) {
        const defaults = category && Array.isArray(category.defaultMultipliers)
          ? JSON.parse(JSON.stringify(category.defaultMultipliers))
          : []
        this.setRowProp(item, 'multipliers', defaults)
      }

      let calcType = this.isKnownCalcType(item.calcType) ? item.calcType : ''
      const detectedRule = this.detectRuleFromKeyword(item.name, categoryKey)

      if (!calcType) {
        calcType = detectedRule && this.isKnownCalcType(detectedRule.calcType)
          ? detectedRule.calcType
          : this.getDefaultCalcTypeByCategory(categoryKey)
      }

      const normalizedInputs = this.normalizeCalcInputs(calcType, item.inputs, item.multipliers, item)
      const formulaLabel = detectedRule && detectedRule.calcType === calcType
        ? (detectedRule.formulaLabel || this.getSchemaByCalcType(calcType).formulaLabel)
        : this.getSchemaByCalcType(calcType).formulaLabel

      this.setRowProp(item, 'calcType', calcType)
      this.setRowProp(item, 'inputs', normalizedInputs)
      this.setRowProp(item, 'detectedRuleKey', detectedRule && detectedRule.calcType === calcType ? detectedRule.key : String(item.detectedRuleKey || ''))
      this.setRowProp(item, 'formulaPreview', formulaLabel)
      this.applyForbiddenItemState(item)

      if (!isManualMultiplier) {
        this.syncRowMultipliersWithInputs(item, category)
      }
    },
    applyRuleToRow(item, rule, category, catIndex = -1) {
      if (!item || typeof item !== 'object') return
      const categoryKey = this.getCategoryKey(category, catIndex)
      if (categoryKey === BUDGET_CATEGORY_KEYS.OTHER) return

      const targetCalcType = rule && this.isKnownCalcType(rule.calcType)
        ? rule.calcType
        : this.getDefaultCalcTypeByCategory(categoryKey)
      const calcTypeChanged = String(item.calcType || '') !== targetCalcType
      const baseInputs = calcTypeChanged ? {} : item.inputs
      const normalizedInputs = this.normalizeCalcInputs(targetCalcType, baseInputs, item.multipliers, item)

      this.setRowProp(item, 'calcType', targetCalcType)
      this.setRowProp(item, 'inputs', normalizedInputs)
      this.setRowProp(item, 'detectedRuleKey', rule ? rule.key : '')
      this.setRowProp(item, 'formulaPreview', rule && rule.formulaLabel ? rule.formulaLabel : this.getSchemaByCalcType(targetCalcType).formulaLabel)

      this.syncRowMultipliersWithInputs(item, category)
      this.calculateRowTotal(item)
    },
    applySmartDetection(catIndex, item) {
      const category = this.categories[catIndex]
      if (!category || !item) return

      this.normalizeRowModel(item, category, catIndex)
      const forbiddenRule = this.applyForbiddenItemState(item)
      if (forbiddenRule) {
        this.calculateRowTotal(item)
        return
      }
      if (category.isOther) return

      const categoryKey = this.getCategoryKey(category, catIndex)
      const detectedRule = this.detectRuleFromKeyword(item.name, categoryKey)
      this.applyRuleToRow(item, detectedRule, category, catIndex)
    },
    handleItemNameInput(catIndex, item, event) {
      this.resizeTextarea(event)
      this.applySmartDetection(catIndex, item)
    },
    handleItemNameBlur(catIndex, item) {
      this.applySmartDetection(catIndex, item)
    },
    checkKeyword(catIndex, item) {
      this.applySmartDetection(catIndex, item)
    },
    handleCalcInputChange(catIndex, item, fieldKey) {
      const category = this.categories[catIndex]
      if (!category || !item || category.isOther) return
      if (!item.inputs || typeof item.inputs !== 'object') {
        this.setRowProp(item, 'inputs', {})
      }

      this.cleanNumber(item.inputs, fieldKey)
      this.syncRowMultipliersWithInputs(item, category)
      this.calculateRowTotal(item)
    },
    resizeTextarea(event) {
      if (!event || !event.target) return
      const el = event.target;
      if (el.tagName !== 'TEXTAREA') return
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    },
    isNumber(event) {
      const charCode = event.which ? event.which : event.keyCode;
      if (charCode < 48 || charCode > 57) {
        event.preventDefault();
      }
    },
    cleanNumber(obj, key) {
      if (obj[key] !== null && obj[key] !== undefined) {
        obj[key] = this.formatNumberInputValue(obj[key]);
      }
    },
    cleanArrayNumber(arr, index) {
      if (arr[index] !== null && arr[index] !== undefined) {
        this.$set(arr, index, this.formatNumberInputValue(arr[index]));
      }
    },
    createItem(category, attachment = null, catIndex = -1) {
      const multipliers = JSON.parse(JSON.stringify(category.defaultMultipliers));
      const item = {
        id: Date.now() + Math.random(),
        name: '',
        multipliers: multipliers,
        total: 0,
        periods: [0, 0, 0],
        attachment: attachment,
        periodError: false,
        calcType: '',
        inputs: {},
        detectedRuleKey: '',
        formulaPreview: '',
        forbiddenRuleKey: '',
        forbiddenItemMessage: '',
        categoryKey: this.getCategoryKey(category, catIndex),
        isManualMultiplier: Boolean(category && category.isOther)
      };
      this.normalizeRowModel(item, category, catIndex);
      this.formatItemNumericInputs(item, category);
      this.calculateRowTotal(item);
      return item;
    },
    addItem(catIndex) {
      const cat = this.categories[catIndex];
      const newItem = this.createItem(cat, null, catIndex);
      cat.items.push(newItem);
      this.calculateItemTotal(newItem);
    },
    removeItem(catIndex, itemIndex) {
      const category = this.categories[catIndex];
      const item = category && Array.isArray(category.items) ? category.items[itemIndex] : null;
      const attachment = item && item.attachment
        ? { ...item.attachment }
        : null;

      if (category && Array.isArray(category.items)) {
        category.items.splice(itemIndex, 1);
      }

      if (attachment) {
        this.$emit('remove-attachment', {
          catIndex,
          itemId: item && item.id,
          attachment
        });
      }
    },
    addMultiplier(item) {
      item.multipliers.push({ label: 'ตัวคูณใหม่', value: 1, isAdmin: false });
      this.formatItemNumericInputs(item);
      this.calculateItemTotal(item);
    },
    removeMultiplier(item, mIndex) {
      item.multipliers.splice(mIndex, 1);
      this.calculateItemTotal(item);
    },
    calculateItemTotal(item) {
      this.calculateRowTotal(item);
    },
    calculateRowTotal(item) {
      if (!item || typeof item !== 'object') return 0;

      if (item.isManualMultiplier) {
        if (!Array.isArray(item.multipliers) || item.multipliers.length === 0) {
          item.total = 0;
        } else {
          item.total = item.multipliers.reduce((acc, curr) => {
            const val = this.toNumber(curr && curr.value);
            return acc * val;
          }, 1);
        }
      } else {
        item.total = this.getCalculatedTotalByCalcType(item.calcType, item.inputs);
      }

      this.enforceAllPeriodLimits(item);
      this.validatePeriods(item);
      return item.total;
    },
    getPeriodInputMax(item, activeIndex) {
      const totalBudget = Math.max(this.toNumber(item && item.total), 0);
      if (!item || !Array.isArray(item.periods)) return totalBudget;

      const usedByOtherPeriods = item.periods.reduce((sum, value, index) => {
        if (index === activeIndex) return sum;
        return sum + this.toNumber(value);
      }, 0);

      return Math.max(totalBudget - usedByOtherPeriods, 0);
    },
    handlePeriodInput(item, activeIndex) {
      if (!item || !Array.isArray(item.periods)) return;

      const rawValue = this.toRawNumberString(item.periods[activeIndex]);
      if (!rawValue) {
        this.$set(item.periods, activeIndex, '');
        this.validatePeriods(item);
        return;
      }

      const requestedValue = this.toNumber(rawValue);
      const maxAllowed = this.getPeriodInputMax(item, activeIndex);
      const boundedValue = Math.min(requestedValue, maxAllowed);

      this.$set(item.periods, activeIndex, this.formatNumberInputValue(boundedValue));
      this.validatePeriods(item);
    },
    enforceAllPeriodLimits(item) {
      if (!item || !Array.isArray(item.periods)) return;

      for (let periodIndex = 0; periodIndex < item.periods.length; periodIndex += 1) {
        const rawValue = this.toRawNumberString(item.periods[periodIndex]);
        if (!rawValue) {
          this.$set(item.periods, periodIndex, '');
          continue;
        }

        const currentValue = this.toNumber(rawValue);
        const maxAllowed = this.getPeriodInputMax(item, periodIndex);
        const boundedValue = Math.min(currentValue, maxAllowed);

        this.$set(item.periods, periodIndex, this.formatNumberInputValue(boundedValue));
      }
    },
    // อัปเดตฟังก์ชันเช็คยอดงวด
    validatePeriods(item) {
      const sumPeriods = this.toNumber(item.periods[0]) +
                         this.toNumber(item.periods[1]) +
                         this.toNumber(item.periods[2]);
      
      // ลบ Alert ออก และอัปเดตสถานะ periodError แทน
      item.periodError = sumPeriods > item.total;
    },
    attachDocToCategory(event, catIndex) {
      const files = event.target.files;
      if (!files.length) return;
      
      const cat = this.categories[catIndex];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const attachment = {
          fileName: file.name,
          name: file.name,
          docType: '',
          fileId: null,
          uploading: true
        };
        const newItem = this.createItem(cat, attachment, catIndex);
        cat.items.push(newItem);
        this.calculateItemTotal(newItem);
        this.$emit('upload-attachment', {
          categoryName: cat && cat.name ? cat.name : '',
          catIndex,
          itemId: newItem.id,
          file
        });
      }
      event.target.value = '';
    },
    normalizeAttachmentFileId(value) {
      if (value === null || value === undefined) return ''
      if (typeof value === 'string' || typeof value === 'number') return String(value).trim()
      if (typeof value === 'object') {
        if (value.$oid) return String(value.$oid).trim()
        if (value._id) return this.normalizeAttachmentFileId(value._id)
        if (value.id) return this.normalizeAttachmentFileId(value.id)
        if (value.fileId) return this.normalizeAttachmentFileId(value.fileId)
      }
      return ''
    },
    getAttachmentFileId(attachment) {
      const source = attachment && typeof attachment === 'object'
        ? (attachment.fileId || attachment.id || attachment._id || '')
        : ''
      return this.normalizeAttachmentFileId(source)
    },
    getAttachmentDisplayName(item) {
      const attachment = item && item.attachment ? item.attachment : null
      if (!attachment) return '-'
      const fileName = String(attachment.fileName || attachment.name || attachment.originalName || '').trim()
      if (fileName) return fileName
      return this.getAttachmentDisplayUrl(item) || '-'
    },
    getAttachmentDisplayUrl(item) {
      const attachment = item && item.attachment ? item.attachment : null
      const fileId = this.getAttachmentFileId(attachment)
      if (!fileId) return ''

      const normalizedProposalId = String(this.proposalId || '').trim()
      const path = normalizedProposalId
        ? `/api/v1/proposals/${encodeURIComponent(normalizedProposalId)}/form-files/${encodeURIComponent(fileId)}`
        : `/api/v1/proposals/[proposalId]/form-files/${encodeURIComponent(fileId)}`

      const baseUrl = String(process.env.VUE_APP_API_BASE_URL || process.env.VUE_APP_API_URL || '').trim().replace(/\/+$/, '')
      return baseUrl ? `${baseUrl}${path}` : path
    },
    openAttachment(item) {
      const attachment = item && item.attachment ? item.attachment : null
      const normalizedFileId = this.getAttachmentFileId(attachment)
      if (!attachment) return

      this.$emit('open-attachment', {
        itemId: item.id,
        file: {
          ...attachment,
          fileId: normalizedFileId
        }
      })
    },
    openAttachmentExample(docType = '') {
      const sample = BUDGET_ATTACHMENT_EXAMPLES[docType]
      if (!sample || typeof window === 'undefined') return

      const title = sample.title || 'ตัวอย่างเอกสาร'
      const listItems = (sample.items || []).map(text => `<li>${text}</li>`).join('')
      const html = `<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, sans-serif; margin: 24px; color: #1f2937; line-height: 1.6; }
      h2 { margin: 0 0 10px; color: #8b1212; }
      .meta { color: #475569; margin-bottom: 14px; font-size: 14px; }
      ul { margin: 0; padding-left: 20px; }
      li { margin-bottom: 8px; }
      .hint { margin-top: 16px; padding: 10px 12px; background: #f8fafc; border-left: 4px solid #0ea5e9; font-size: 14px; color: #334155; }
    </style>
  </head>
  <body>
    <h2>${title}</h2>
    <div class="meta">เอกสารตัวอย่างสำหรับใช้เป็นแนวทางในการเตรียมไฟล์แนบ</div>
    <ul>${listItems}</ul>
    <div class="hint">หมายเหตุ: รูปแบบเอกสารจริงอาจต่างกันตามระเบียบหรือเงื่อนไขของหน่วยงาน</div>
  </body>
</html>`

      const popup = window.open('', BUDGET_ATTACHMENT_EXAMPLE_WINDOW_NAME)
      if (!popup) return
      popup.document.open()
      popup.document.write(html)
      popup.document.close()
      if (typeof popup.focus === 'function') popup.focus()
    },
    handleAttachmentDocTypeChange(item) {
      if (!item || !item.attachment) return;
      this.$emit('attachment-meta-change', {
        itemId: item.id,
        attachment: item.attachment
      });
    },
    getSubmissionValidationResult() {
      const errors = [];

      this.categories.forEach((category) => {
        if (!category || !Array.isArray(category.items)) return
        category.items.forEach((item, itemIndex) => {
          const forbiddenRule = this.detectForbiddenBudgetItem(item && item.name)
          if (!forbiddenRule) return
          const categoryName = String(category.name || 'หมวดงบประมาณ')
          errors.push(`มหาวิทยาลัยไม่สนับสนุนให้ตั้งงบประมาณรายการ: "${forbiddenRule.label}" ใน${categoryName} (รายการที่ ${itemIndex + 1})`)
        })
      })

      if (this.grandTotal > 0 && !this.isPeriod1Valid) {
        errors.push(`สรุปยอดรวมการเบิกจ่ายงวด 1 ต้องเท่ากับ ${this.formatNumber(this.expectedPeriod1)} บาท`);
      }

      if (this.grandTotal > 0 && !this.isPeriod2Valid) {
        errors.push(`สรุปยอดรวมการเบิกจ่ายงวด 2 ต้องเท่ากับ ${this.formatNumber(this.expectedPeriod2)} บาท`);
      }

      if (this.grandTotal > 0 && !this.isPeriod3Valid) {
        errors.push(`สรุปยอดรวมการเบิกจ่ายงวด 3 ต้องเท่ากับ ${this.formatNumber(this.expectedPeriod3)} บาท`);
      }
      if (this.hasBudgetLimit && this.grandTotal > this.budgetLimit) {
        errors.push(`งบประมาณรวมเกินเพดานของ${this.fundingTypeLabel} (เพดาน ${this.formatNumber(this.budgetLimit)} บาท, กรอก ${this.formatNumber(this.grandTotal)} บาท)`);
      }

      return {
        ok: errors.length === 0,
        errors
      };
    },
    formatNumber(num) {
      return Number(num || 0).toLocaleString('th-TH');
    }
  }
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.budget-section-container.is-dark {
  color: #e6edf7;
}

.budget-section-container.is-dark ::v-deep .card,
.budget-section-container.is-dark ::v-deep .card-body,
.budget-section-container.is-dark ::v-deep .table-responsive {
  background: #1a2432;
  border-color: #2f3f52;
}

.budget-section-container.is-dark ::v-deep .table,
.budget-section-container.is-dark ::v-deep .table td,
.budget-section-container.is-dark ::v-deep .table th,
.budget-section-container.is-dark ::v-deep tbody tr,
.budget-section-container.is-dark ::v-deep tr.bg-light,
.budget-section-container.is-dark ::v-deep td.bg-white,
.budget-section-container.is-dark ::v-deep .bg-white,
.budget-section-container.is-dark ::v-deep .bg-light {
  background: #1a2432 !important;
  color: #e8eff8 !important;
  border-color: #324357 !important;
}

.budget-section-container.is-dark ::v-deep .table.table-bordered th,
.budget-section-container.is-dark ::v-deep .table.table-bordered td {
  border-color: #324357 !important;
}

.budget-section-container.is-dark ::v-deep tbody tr:hover {
  background: #223142 !important;
}

.budget-section-container.is-dark ::v-deep .text-muted {
  color: #aebdce !important;
}

.budget-section-container.is-dark ::v-deep .text-dark {
  color: #e6edf7 !important;
}

.budget-section-container.is-dark ::v-deep .form-control,
.budget-section-container.is-dark .input-floating-outline,
.budget-section-container.is-dark .auto-grow-textarea,
.budget-section-container.is-dark ::v-deep select.form-control {
  background: #223142 !important;
  color: #edf4fc !important;
  border-color: #3c4e63 !important;
}

.budget-section-container.is-dark .label-floating-outline {
  background-color: #1a2432;
  color: #afbfd0;
}

.budget-section-container.is-dark .input-floating-outline:focus {
  border-color: #c59b3a;
  box-shadow: 0 0 0 1px #c59b3a;
}

.budget-section-container.is-dark .input-floating-outline[readonly],
.budget-section-container.is-dark .input-floating-outline[readonly] ~ .label-floating-outline {
  background-color: #192331;
}

.budget-section-container.is-dark .attachment-box {
  background-color: #1f2c3b;
  border-color: #33485f !important;
}

.budget-section-container.is-dark ::v-deep .btn.btn-light,
.budget-section-container.is-dark ::v-deep label.btn.btn-light {
  background: #223142 !important;
  color: #d7e4f3 !important;
  border-color: #3c4e63 !important;
}

.budget-section-container.is-dark ::v-deep .btn-danger {
  background-color: #7f1d1d !important;
  border-color: #991b1b !important;
}

.budget-section-container.is-dark .budget-summary-card,
.budget-section-container.is-dark .budget-grand-total-card {
  background-color: #1f2b39 !important;
  border-color: #33475c !important;
}

.budget-section-container.is-dark .border-left {
  border-left-color: #324357 !important;
}

.budget-section-container.is-dark .alert.alert-danger {
  background: rgba(239, 68, 68, 0.18) !important;
  color: #f6b0b0;
  border-left-color: #ef5350 !important;
}

.budget-section-container.is-dark .alert.alert-danger .text-dark {
  color: #e8eff8 !important;
}

/* Make header and table feel like one piece (no gaps), and keep it readable */
.budget-section-container ::v-deep .card {
  overflow: hidden; /* clip the table header to the card's corners */
  border-radius: 12px;
}

.budget-section-container ::v-deep .budget-category-header {
  margin: 0 !important;
  width: 100%;
  padding: 12px 16px !important;
  border: 0 !important;
  border-bottom: 1px solid rgba(234, 223, 206, 0.95) !important;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 242, 234, 0.94)) !important;
}

.budget-section-container ::v-deep .budget-category-title {
  color: #111827 !important;
  letter-spacing: 0.15px;
}

.budget-section-container ::v-deep .budget-category-title i {
  color: var(--rf-gold, #c59b3a);
}

.budget-section-container ::v-deep .budget-category-header > div {
  display: flex;
  align-items: center;
  gap: 10px;
}

.budget-section-container ::v-deep .budget-category-header .btn,
.budget-section-container ::v-deep .budget-category-header label.btn {
  border-radius: 10px;
  font-weight: 800;
  border: 1px solid rgba(234, 223, 206, 0.98);
  box-shadow: 0 8px 14px rgba(2, 6, 23, 0.08);
}

.budget-section-container ::v-deep .budget-category-header .btn.btn-light,
.budget-section-container ::v-deep .budget-category-header label.btn.btn-light {
  background: rgba(255, 255, 255, 0.94) !important;
}

.budget-section-container ::v-deep .card-body.p-0 {
  padding-top: 0 !important;
}

/* No rounding from the table itself; the card handles corners */
.budget-section-container ::v-deep table,
.budget-section-container ::v-deep thead,
.budget-section-container ::v-deep thead th {
  border-radius: 0 !important;
}

.budget-section-container ::v-deep .table-responsive {
  margin-top: 0 !important;
}

.budget-section-container ::v-deep .table {
  margin-bottom: 0;
  border-top: 0 !important; /* remove the separator line below header */
}

.budget-section-container ::v-deep .table.table-bordered {
  border: 0 !important; /* avoid square outer border fighting rounded corners */
}

.budget-section-container ::v-deep .table.table-bordered th,
.budget-section-container ::v-deep .table.table-bordered td {
  border-color: rgba(234, 223, 206, 0.95) !important;
}

.budget-section-container ::v-deep .table thead th {
  border-top: 0 !important;
}

.budget-section-container ::v-deep thead.text-white th,
.budget-section-container ::v-deep thead.bg-primary th {
  color: #ffffff !important;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.18);
}

.budget-section-container ::v-deep thead.bg-primary tr {
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.22);
}
.multiplier-box {
  width: 118px;
}

.formula-preview-box {
  display: none;
}

.formula-indicator {
  font-size: 12px;
  line-height: 1.4;
}

.formula-live-preview {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.45;
}
.remove-mult-btn {
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  padding: 0;
  border-radius: 50%;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.attachment-box {
  background-color: #f8f9fa;
  border-color: #e4e7ea !important;
}

.budget-attachment-url {
  color: #8b1212;
  text-decoration: underline;
  word-break: break-all;
  font-weight: 600;
}

.budget-attachment-url:hover {
  color: #5b0b0b;
}

.budget-attachment-url-field {
  min-height: 38px;
  height: auto;
  display: flex;
  align-items: center;
  padding: 6px 10px;
}

.budget-grand-total-note {
  display: block;
  font-size: 0.98rem;
  line-height: 1.45;
}

.budget-grand-total-details {
  font-size: 1.05rem;
  line-height: 1.55;
  font-weight: 600;
}

.budget-grand-total-details strong {
  font-weight: 700;
}

.budget-warning-heading {
  font-size: 1.25rem;
  line-height: 1.4;
}

.budget-warning-details {
  font-size: 1.04rem;
  line-height: 1.65;
}

.budget-warning-details li {
  margin-bottom: 0.35rem;
}

.budget-installment-summary-title {
  font-size: 1.25rem;
  line-height: 1.4;
}

.budget-grand-total-title {
  font-size: 1.25rem;
  line-height: 1.4;
}

.budget-installment-criteria {
  font-size: 1.02rem;
  line-height: 1.45;
}

.budget-installment-period-label {
  font-size: 1rem;
  line-height: 1.4;
}

.budget-installment-status {
  font-size: 0.98rem;
  line-height: 1.45;
  font-weight: 600;
}
.auto-grow-textarea {
  resize: none;
  overflow: hidden;
  min-height: 38px;
}

.budget-item-search-wrap {
  position: relative;
}

.budget-item-search {
  min-height: 38px;
  padding-right: 34px;
  -webkit-appearance: none;
  appearance: none;
}

.budget-item-search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-40%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 7px solid #2f3b4a;
  z-index: 2;
  pointer-events: none;
}

.budget-item-search-icon.is-invalid {
  border-top-color: #e55353;
}

.budget-item-name-invalid {
  border-color: #e55353 !important;
}

.budget-item-name-invalid:focus {
  border-color: #e55353 !important;
  box-shadow: 0 0 0 1px #e55353 !important;
}

.budget-item-forbidden-text {
  font-weight: 600;
  line-height: 1.4;
}

.budget-item-search::-webkit-calendar-picker-indicator {
  opacity: 0;
  width: 0;
}

.budget-item-search::-webkit-search-cancel-button,
.budget-item-search::-webkit-search-decoration,
.budget-item-search::-webkit-search-results-button,
.budget-item-search::-webkit-search-results-decoration {
  -webkit-appearance: none;
  appearance: none;
  display: none;
}

.budget-section-container.is-dark .budget-item-search-icon {
  border-top-color: #d5e0ec;
}

/* =========================================================
   Responsive: Summary box (installments) on small screens
   - Align title/criteria/amounts to the left
   - Stack each period with a top divider instead of left divider
   ========================================================= */
@media (max-width: 768px) {
  .budget-section-container ::v-deep .row.text-center.align-items-center {
    text-align: left !important;
  }

  .budget-section-container ::v-deep .row.text-center.align-items-center .text-right {
    text-align: left !important;
  }

  .budget-section-container ::v-deep .row.text-center.align-items-center > [class*="col-"] {
    text-align: left !important;
  }

  .budget-section-container ::v-deep .row.text-center.align-items-center .border-left {
    border-left: 0 !important;
    border-top: 1px solid rgba(234, 223, 206, 0.95) !important;
    padding-top: 10px;
    margin-top: 10px;
  }

  /* First period column is the 2nd child in this row (after the title column). */
  .budget-section-container ::v-deep .row.text-center.align-items-center > div.border-left:nth-child(2) {
    border-top: 0 !important;
    padding-top: 0;
    margin-top: 0;
  }

  .budget-grand-total-note {
    font-size: 0.92rem;
  }

  .budget-grand-total-details {
    font-size: 0.98rem;
  }

  .budget-warning-heading {
    font-size: 1.125rem;
  }

  .budget-warning-details {
    font-size: 0.96rem;
  }

  .budget-installment-summary-title {
    font-size: 1.125rem;
  }

  .budget-grand-total-title {
    font-size: 1.125rem;
  }

  .budget-installment-criteria {
    font-size: 0.94rem;
  }

  .budget-installment-period-label {
    font-size: 0.94rem;
  }

  .budget-installment-status {
    font-size: 0.92rem;
  }
}

/* Category header actions: on small screens stack buttons (1 per line) aligned to the right */
@media (max-width: 576px) {
  .budget-section-container ::v-deep .card-header.text-white.d-flex.justify-content-between.align-items-center > div {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: 10px;
  }

  .budget-section-container ::v-deep .card-header.text-white.d-flex.justify-content-between.align-items-center > div .mr-2 {
    margin-right: 0 !important;
  }
}

/* Floating Label Outline CSS */
.floating-outline-wrap {
  position: relative;
  width: 100%;
}
.input-floating-outline {
  width: 100%;
  height: 42px;
  padding: 0 12px;
  font-size: 14px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background-color: transparent;
  color: #333;
  transition: all 0.2s ease;
  outline: none;
}
.input-floating-outline:focus {
  border-color: #8b1212;
  box-shadow: 0 0 0 1px #8b1212;
}

.label-floating-outline {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  background-color: #fff;
  padding: 0 4px;
  color: #6c757d;
  font-size: 14px;
  pointer-events: none;
  transition: all 0.2s ease-out;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 20px);
}

.input-floating-outline:focus ~ .label-floating-outline,
.input-floating-outline:not(:placeholder-shown) ~ .label-floating-outline {
  top: 0;
  font-size: 11px;
  font-weight: 600;
}

.input-floating-outline:focus ~ .label-floating-outline {
  color: #8b1212;
}

/* CSS สำหรับการแจ้งเตือน Error */
.input-floating-outline.border-danger {
  border-color: #e55353 !important;
}
.error-shadow:focus {
  box-shadow: 0 0 0 1px #e55353 !important;
}
.label-floating-outline.text-danger {
  color: #e55353 !important;
}

.input-floating-outline[readonly] {
  background-color: #f8f9fa;
  pointer-events: none;
}
.input-floating-outline[readonly] ~ .label-floating-outline {
  background-color: #f8f9fa;
}
</style>

