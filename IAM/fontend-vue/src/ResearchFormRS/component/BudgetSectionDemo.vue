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
                <textarea 
                  class="form-control mb-2 auto-grow-textarea" 
                  v-model="item.name" 
                  placeholder="ระบุชื่อรายการ..."
                  rows="1"
                  @input="resizeTextarea($event); checkKeyword(catIndex, item)"
                  :readonly="isReadOnly" 
                ></textarea>
                
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
                <div class="d-flex justify-content-center align-items-center flex-wrap" style="gap: 8px; padding-top: 8px;">
                  
                  <div v-for="(mult, mIndex) in item.multipliers" :key="mIndex" class="position-relative multiplier-box">
                    
                    <template v-if="category.isOther">
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
                    </template>

                    <template v-else>
                      <div class="floating-outline-wrap">
                        <input type="text" inputmode="numeric" 
                               class="input-floating-outline text-center" 
                               placeholder=" "
                               v-model="mult.value" 
                               :readonly="mult.isAdmin || isReadOnly" 
                               @keypress="isNumber"
                               @input="cleanNumber(mult, 'value'); calculateItemTotal(item)">
                        <label class="label-floating-outline">{{ mult.label }}</label>
                      </div>
                    </template>
                  </div>
                  
                  <CButton v-if="category.isOther && !isReadOnly" color="primary" size="sm" class="mt-4" title="เพิ่มตัวคูณ" @click="addMultiplier(item)" style="height: 38px;">
                    <CIcon name="cil-plus" class="m-1"/>
                  </CButton>
                </div>
              </td>

              <td class="align-middle bg-white">
                <h6 class="font-weight-bold text-primary mb-0">{{ formatNumber(item.total) }}</h6>
              </td>

              <td class="align-middle bg-white">
                <div class="floating-outline-wrap mt-2">
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
                <div class="floating-outline-wrap mt-2">
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
                <div class="floating-outline-wrap mt-2">
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
          name: 'หมวดค่าตอบแทน', isOther: false, items: [],
          defaultMultipliers: [
            { label: 'จำนวน (คน)', value: 1, isAdmin: false },
            { label: 'จำนวน (ครั้ง/ด.)', value: 1, isAdmin: false },
            { label: 'อัตรา (บาท)', value: 5000, isAdmin: true }
          ]
        },
        { 
          name: 'หมวดค่าใช้สอย', isOther: false, items: [],
          defaultMultipliers: [
            { label: 'จำนวน (คน/ชิ้น)', value: 1, isAdmin: false },
            { label: 'จำนวน (วัน/ครั้ง)', value: 1, isAdmin: false },
            { label: 'อัตรา (บาท)', value: 5000, isAdmin: true }
          ]
        },
        { 
          name: 'หมวดค่าเดินทาง', isOther: false, items: [],
          defaultMultipliers: [
            { label: 'จำนวน (คน)', value: 1, isAdmin: false },
            { label: 'จำนวน (วัน/เที่ยว)', value: 1, isAdmin: false },
            { label: 'อัตรา (บาท)', value: 5000, isAdmin: true }
          ]
        },
        { 
          name: 'หมวดค่าวัสดุ', isOther: false, items: [],
          defaultMultipliers: [
            { label: 'จำนวน', value: 1, isAdmin: false },
            { label: 'ตัวคูณ (ถ้ามี)', value: 1, isAdmin: false },
            { label: 'ราคา/หน่วย', value: 5000, isAdmin: true }
          ]
        },
        { 
          name: 'หมวดค่าสาธารณูปโภค', isOther: false, items: [],
          defaultMultipliers: [
            { label: 'จำนวน (เดือน)', value: 1, isAdmin: false },
            { label: 'จำนวน (หน่วย)', value: 1, isAdmin: false },
            { label: 'อัตรา (บาท)', value: 5000, isAdmin: true }
          ]
        },
        { 
          name: 'หมวดครุภัณฑ์', isOther: false, items: [],
          defaultMultipliers: [
            { label: 'จำนวน (รายการ)', value: 1, isAdmin: false },
            { label: 'ตัวคูณ (ถ้ามี)', value: 1, isAdmin: false },
            { label: 'ราคา/ชุด', value: 5000, isAdmin: true }
          ]
        },
        { 
          name: 'หมวดอื่นๆ', isOther: true, items: [],
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
      const travelCat = this.categories.find(c => c.name === 'หมวดค่าเดินทาง');
      return travelCat ? travelCat.items.reduce((sum, item) => sum + item.total, 0) : 0;
    },
    // 2. คำนวณยอดรวมเฉพาะหมวดครุภัณฑ์
    equipmentTotal() {
      const equipCat = this.categories.find(c => c.name === 'หมวดครุภัณฑ์');
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
      if (name === 'หมวดค่าเดินทาง' || name === 'หมวดครุภัณฑ์') {
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
          this.formatItemNumericInputs(item)
        })
      })
    },
    formatItemNumericInputs(item) {
      if (!item || typeof item !== 'object') return

      if (Array.isArray(item.multipliers)) {
        item.multipliers.forEach((multiplier) => {
          if (!multiplier || typeof multiplier !== 'object') return
          multiplier.value = this.formatNumberInputValue(multiplier.value)
        })
      }

      if (Array.isArray(item.periods)) {
        item.periods = item.periods.map(period => this.formatNumberInputValue(period))
      }
    },
    getSanitizedCategories() {
      const categories = JSON.parse(JSON.stringify(this.categories || []))
      categories.forEach((category) => {
        if (!category || !Array.isArray(category.items)) return
        category.items.forEach((item) => {
          if (!item || typeof item !== 'object') return
          if (Array.isArray(item.multipliers)) {
            item.multipliers.forEach((multiplier) => {
              if (!multiplier || typeof multiplier !== 'object') return
              multiplier.value = this.toRawNumberString(multiplier.value)
            })
          }
          if (Array.isArray(item.periods)) {
            item.periods = item.periods.map(period => this.toRawNumberString(period))
          }
        })
      })
      return categories
    },
    checkKeyword(catIndex, item) {
      const cat = this.categories[catIndex];
      const text = item.name || '';
      
      // ตั้งค่าเริ่มต้น (หากไม่เจอ Keyword ใดๆ จะกลับมาใช้ค่า Default ของหมวดนั้น)
      let targetTemplate = 'default';
      let newMultipliers = JSON.parse(JSON.stringify(cat.defaultMultipliers));

      // 1. หมวดค่าตอบแทน
      if (cat.name === 'หมวดค่าตอบแทน') {
        if (text.includes('นักศึกษาช่วยงาน')) {
          targetTemplate = 'student';
          newMultipliers = [
            { label: 'ชั่วโมง', value: 1, isAdmin: false },
            { label: 'คน', value: 1, isAdmin: false },
            { label: 'เดือน', value: 1, isAdmin: false },
            { label: 'อัตรา (บาท)', value: 0, isAdmin: true }
          ];
        } else if (text.includes('อาสาสมัคร') || text.includes('ผู้ให้ข้อมูล')) {
          targetTemplate = 'volunteer';
          newMultipliers = [
            { label: 'คน', value: 1, isAdmin: false },
            { label: 'ครั้ง', value: 1, isAdmin: false },
            { label: 'อัตรา (บาท)', value: 0, isAdmin: true }
          ];
        } else if (text.includes('พิจารณาเครื่องมือ')) {
          targetTemplate = 'expert_tool';
          newMultipliers = [
            { label: 'คน', value: 1, isAdmin: false },
            { label: 'อัตรา (บาท)', value: 0, isAdmin: true }
          ];
        }
      } 
      
      // 2. หมวดค่าใช้สอย
      else if (cat.name === 'หมวดค่าใช้สอย') {
        if (text.includes('อาหาร')) {
          targetTemplate = 'food';
          newMultipliers = [
            { label: 'คน', value: 1, isAdmin: false },
            { label: 'มื้อ', value: 1, isAdmin: false },
            { label: 'อัตรา (บาท)', value: 0, isAdmin: true } // อ้างอิง: กลางวัน 120, ว่าง 50 [cite: 88]
          ];
        } else if (text.includes('เช่ารถ') || text.includes('เช่ายานพาหนะ')) {
          targetTemplate = 'car_rent';
          newMultipliers = [
            { label: 'คัน', value: 1, isAdmin: false },
            { label: 'วัน', value: 1, isAdmin: false },
            { label: 'อัตรา (บาท)', value: 0, isAdmin: true }
          ];
        } else if (text.includes('ถ่ายเอกสาร') || text.includes('รูปเล่ม')) {
          targetTemplate = 'copy';
          newMultipliers = [
            { label: 'จำนวน (ชุด/เล่ม)', value: 1, isAdmin: false },
            { label: 'อัตราเหมา (บาท)', value: 0, isAdmin: true }
          ];
        }
      }

      // 3. หมวดค่าเดินทาง
      else if (cat.name === 'หมวดค่าเดินทาง') {
        if (text.includes('เบี้ยเลี้ยง')) {
          targetTemplate = 'allowance';
          newMultipliers = [
            { label: 'คน', value: 1, isAdmin: false },
            { label: 'วัน', value: 1, isAdmin: false },
            { label: 'อัตรา (บาท)', value: 0, isAdmin: true } // อ้างอิง: 350 บาท/วัน [cite: 88]
          ];
        } else if (text.includes('ที่พัก')) {
          targetTemplate = 'accommodation';
          newMultipliers = [
            { label: 'คน', value: 1, isAdmin: false },
            { label: 'คืน', value: 1, isAdmin: false },
            { label: 'อัตรา (บาท)', value: 0, isAdmin: true } // อ้างอิง: เหมา 800 หรือ ตามจริงไม่เกิน 1800 [cite: 88]
          ];
        } else if (text.includes('เครื่องบิน')) {
          targetTemplate = 'flight';
          newMultipliers = [
            { label: 'คน', value: 1, isAdmin: false },
            { label: 'เที่ยว(ไป-กลับ)', value: 1, isAdmin: false },
            { label: 'อัตรา (บาท)', value: 0, isAdmin: true } // อ้างอิง: ไม่เกิน 5,500 บาท 
          ];
        } else if (text.includes('แท็กซี่') || text.toUpperCase().includes('TAXI')) {
          targetTemplate = 'taxi';
          newMultipliers = [
            { label: 'คน', value: 1, isAdmin: false },
            { label: 'เที่ยว', value: 1, isAdmin: false },
            { label: 'อัตราเหมา (บาท)', value: 0, isAdmin: true } // อ้างอิง: ไม่เกิน 700 บาท/คน 
          ];
        } else if (text.includes('รถยนต์ส่วนตัว')) {
          targetTemplate = 'personal_car';
          newMultipliers = [
            { label: 'ระยะทาง (กม.)', value: 1, isAdmin: false },
            { label: 'รอบ (ไป-กลับ)', value: 2, isAdmin: false },
            { label: 'อัตรา (บาท/กม.)', value: 4, isAdmin: true } // อ้างอิง: 4 บาท/กม. 
          ];
        }
      }

      // 4. หมวดค่าวัสดุ
      else if (cat.name === 'หมวดค่าวัสดุ') {
        if (text.includes('น้ำมันเชื้อเพลิง') || text.includes('ค่าน้ำมัน')) {
          targetTemplate = 'fuel';
          newMultipliers = [
            { label: 'คัน', value: 1, isAdmin: false },
            { label: 'วัน', value: 1, isAdmin: false },
            { label: 'อัตรา (บาท)', value: 0, isAdmin: true } // อ้างอิง: 1,500 หรือ 2,000 บาท [cite: 91, 95]
          ];
        }
      }

      // สลับ Template เฉพาะเมื่อมีการเปลี่ยนแปลงรูปแบบ ป้องกันการเคลียร์ค่าที่กรอกแล้วระหว่างพิมพ์
      if (item.currentTemplate !== targetTemplate) {
        // หากเปลี่ยนจาก Template เฉพาะกลับเป็น Default หรือเปลี่ยนข้ามประเภท ให้โหลดตัวคูณใหม่
        item.multipliers = JSON.parse(JSON.stringify(newMultipliers));
        item.currentTemplate = targetTemplate;
        this.calculateItemTotal(item);
      }
    },
    resizeTextarea(event) {
      const el = event.target;
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
    createItem(category, attachment = null) {
      const multipliers = JSON.parse(JSON.stringify(category.defaultMultipliers));
      const item = {
        id: Date.now() + Math.random(),
        name: '',
        multipliers: multipliers,
        total: 0,
        periods: [0, 0, 0],
        attachment: attachment,
        periodError: false // เพิ่มสถานะเช็คการเกินงบ
      };
      this.formatItemNumericInputs(item);
      return item;
    },
    addItem(catIndex) {
      const cat = this.categories[catIndex];
      const newItem = this.createItem(cat);
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
      if (item.multipliers.length === 0) {
        item.total = 0;
      } else {
        item.total = item.multipliers.reduce((acc, curr) => {
          const val = this.toNumber(curr.value);
          return acc * val;
        }, 1);
      }
      this.enforceAllPeriodLimits(item);
      this.validatePeriods(item);
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
        const newItem = this.createItem(cat, attachment);
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
  width: 105px; 
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

