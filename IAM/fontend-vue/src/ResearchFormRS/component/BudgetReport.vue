<template>
  <div class="budget-report" :class="{ 'is-dark': isDarkTheme }">
    <div v-if="!shouldShowReport" class="text-muted py-2">
      -
    </div>
    <div v-else-if="!reportCategories.length" class="text-muted py-2">
      ไม่พบข้อมูลงบประมาณที่กรอก
    </div>
    <div v-else class="table-responsive">
      <table class="table table-bordered mb-0 budget-report-table">
        <thead>
          <tr>
            <th class="text-center align-middle">รายการ</th>
            <th class="text-center align-middle">รายละเอียดตัวคูณ</th>
            <th class="text-center align-middle">งบรวม<br>(100%)</th>
            <th class="text-center align-middle">งวดที่ 1<br>(50%)</th>
            <th class="text-center align-middle">งวดที่ 2<br>(40%)</th>
            <th class="text-center align-middle">งวดที่ 3<br>(10%)</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="category in reportCategories">
            <tr :key="`category-${category.key}`" class="budget-report-category-row">
              <td colspan="6">
                {{ category.name }}
              </td>
            </tr>
            <tr
              v-for="item in category.items"
              :key="`item-${category.key}-${item.id}`"
              class="budget-report-item-row"
            >
              <td class="text-left align-middle">
                <div class="budget-report-item-name">
                  <span v-if="item.docTypeTag" class="budget-report-chip">{{ item.docTypeTag }}</span>
                  <span>-{{ item.displayName }}</span>
                </div>
              </td>
              <td class="text-center align-middle">{{ item.detailText }}</td>
              <td class="text-right align-middle">{{ formatAmount(item.total) }}</td>
              <td class="text-right align-middle">{{ formatAmount(item.period1) }}</td>
              <td class="text-right align-middle">{{ formatAmount(item.period2) }}</td>
              <td class="text-right align-middle">{{ formatAmount(item.period3) }}</td>
            </tr>
          </template>
          <tr class="budget-report-total-row">
            <td colspan="2" class="text-left align-middle">รวมสุทธิ</td>
            <td class="text-right align-middle">{{ formatAmount(grandTotal) }}</td>
            <td class="text-right align-middle">{{ formatAmount(totalPeriod1) }}</td>
            <td class="text-right align-middle">{{ formatAmount(totalPeriod2) }}</td>
            <td class="text-right align-middle">{{ formatAmount(totalPeriod3) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
const INPUT_FIELD_LABELS = Object.freeze({
  amount: 'ยอดเงิน',
  quantity: 'จำนวน',
  unitPrice: 'ราคา/หน่วย',
  usageAmount: 'จำนวนใช้',
  persons: 'คน',
  people: 'คน',
  times: 'ครั้ง',
  ratePerTime: 'บาท/ครั้ง',
  days: 'วัน',
  ratePerPerson: 'บาท/คน',
  months: 'เดือน',
  monthlyRate: 'บาท/เดือน',
  distanceKm: 'กม.',
  ratePerKm: 'บาท/กม.',
  trips: 'เที่ยว',
  rooms: 'ห้อง',
  nights: 'คืน',
  roomRate: 'บาท/ห้อง',
  ratePerTrip: 'บาท/เที่ยว',
  licenses: 'ไลเซนส์'
})

export default {
  name: 'BudgetReport',
  props: {
    modelValue: {
      type: Object,
      default: null
    },
    isReadOnly: {
      type: Boolean,
      default: false
    },
    currentStatus: {
      type: String,
      default: ''
    }
  },
  computed: {
    isDarkTheme() {
      return Boolean(this.$store && this.$store.state && this.$store.state.darkMode)
    },
    normalizedCurrentStatus() {
      return String(this.currentStatus || '').trim().toLowerCase()
    },
    shouldShowReport() {
      return this.isReadOnly && this.normalizedCurrentStatus !== '' && this.normalizedCurrentStatus !== 'draft'
    },
    sourceCategories() {
      const source = this.modelValue && typeof this.modelValue === 'object'
        ? this.modelValue
        : {}
      return Array.isArray(source.categories) ? source.categories : []
    },
    reportCategories() {
      return this.sourceCategories
        .map((category, catIndex) => {
          const items = Array.isArray(category && category.items) ? category.items : []
          const filteredItems = items
            .filter(item => this.hasDisplayableItemData(item))
            .map((item, itemIndex) => this.normalizeItem(item, itemIndex))

          if (!filteredItems.length) return null

          return {
            key: this.getCategoryKey(category, catIndex),
            name: this.getCategoryName(category, catIndex),
            items: filteredItems
          }
        })
        .filter(Boolean)
    },
    grandTotal() {
      return this.reportCategories.reduce((sum, category) => {
        return sum + category.items.reduce((itemSum, item) => itemSum + this.toNumber(item.total), 0)
      }, 0)
    },
    totalPeriod1() {
      return this.reportCategories.reduce((sum, category) => {
        return sum + category.items.reduce((itemSum, item) => itemSum + this.toNumber(item.period1), 0)
      }, 0)
    },
    totalPeriod2() {
      return this.reportCategories.reduce((sum, category) => {
        return sum + category.items.reduce((itemSum, item) => itemSum + this.toNumber(item.period2), 0)
      }, 0)
    },
    totalPeriod3() {
      return this.reportCategories.reduce((sum, category) => {
        return sum + category.items.reduce((itemSum, item) => itemSum + this.toNumber(item.period3), 0)
      }, 0)
    }
  },
  methods: {
    getCategoryKey(category, catIndex) {
      const key = String(category && category.key ? category.key : '').trim()
      return key || `category-${catIndex}`
    },
    getCategoryName(category, catIndex) {
      const name = String(category && category.name ? category.name : '').trim()
      return name || `หมวด ${catIndex + 1}`
    },
    normalizeItem(item, itemIndex) {
      const periods = Array.isArray(item && item.periods) ? item.periods : []
      const attachment = item && item.attachment && typeof item.attachment === 'object'
        ? item.attachment
        : null
      const name = String(item && item.name ? item.name : '').trim()

      return {
        id: item && Object.prototype.hasOwnProperty.call(item, 'id') ? item.id : itemIndex,
        displayName: name || 'ไม่ระบุรายการ',
        detailText: this.buildDetailText(item),
        total: this.toNumber(item && item.total),
        period1: this.toNumber(periods[0]),
        period2: this.toNumber(periods[1]),
        period3: this.toNumber(periods[2]),
        docTypeTag: this.getDocTypeTag(attachment)
      }
    },
    hasDisplayableItemData(item) {
      if (!item || typeof item !== 'object') return false

      const name = String(item.name || '').trim()
      const hasName = name !== '' && name !== '-'
      const hasTotal = this.toNumber(item.total) > 0
      const periods = Array.isArray(item.periods) ? item.periods : []
      const hasPeriodAmount = periods.some(period => this.toNumber(period) > 0)

      const attachment = item.attachment && typeof item.attachment === 'object' ? item.attachment : null
      const attachmentId = attachment
        ? String(attachment.fileId || attachment.id || attachment._id || '').trim()
        : ''
      const attachmentName = attachment
        ? String(attachment.fileName || attachment.name || attachment.originalName || '').trim()
        : ''
      const hasAttachment = Boolean(attachmentId || attachmentName)

      const hasDetailParts = this.getDetailParts(item).length > 0

      return hasName || hasTotal || hasPeriodAmount || hasAttachment || hasDetailParts
    },
    buildDetailText(item) {
      const parts = this.getDetailParts(item)
      if (!parts.length) return '-'
      return parts.join(' x ')
    },
    getDetailParts(item) {
      const parts = []
      const multipliers = Array.isArray(item && item.multipliers) ? item.multipliers : []

      multipliers.forEach((mult) => {
        if (!mult || typeof mult !== 'object') return
        const rawValue = String(mult.value === null || mult.value === undefined ? '' : mult.value).replace(/,/g, '').trim()
        const numValue = this.toNumber(rawValue)
        const hasValue = rawValue !== '' && rawValue !== '0' && numValue > 0
        if (!hasValue) return

        const label = String(mult.label || '').trim()
        const valueText = this.formatNumber(numValue)
        parts.push(label ? `${valueText} ${label}` : valueText)
      })

      if (parts.length) return parts

      const inputs = item && item.inputs && typeof item.inputs === 'object' ? item.inputs : null
      if (!inputs) return parts

      Object.keys(inputs).forEach((key) => {
        const rawValue = String(inputs[key] === null || inputs[key] === undefined ? '' : inputs[key]).replace(/,/g, '').trim()
        const numValue = this.toNumber(rawValue)
        const hasValue = rawValue !== '' && rawValue !== '0' && numValue > 0
        if (!hasValue) return
        const fieldLabel = INPUT_FIELD_LABELS[key] || key
        parts.push(`${this.formatNumber(numValue)} ${fieldLabel}`)
      })

      return parts
    },
    getDocTypeTag(attachment) {
      if (!attachment || typeof attachment !== 'object') return ''

      const rawDocType = String(attachment.docType || attachment.type || '').trim()
      if (!rawDocType) return ''

      const map = {
        tor: 'TOR',
        cv: 'CV',
        quotation: 'QUO',
        specification: 'SPEC',
        servicerates: 'RATE'
      }

      const key = rawDocType.toLowerCase()
      return map[key] || rawDocType.toUpperCase()
    },
    toNumber(value) {
      if (value === null || value === undefined || value === '') return 0
      const normalized = String(value).replace(/,/g, '').replace(/[^\d.-]/g, '')
      const parsed = Number(normalized)
      return Number.isFinite(parsed) ? parsed : 0
    },
    formatNumber(value) {
      return new Intl.NumberFormat('th-TH', {
        maximumFractionDigits: 0
      }).format(this.toNumber(value))
    },
    formatAmount(value) {
      return `${this.formatNumber(value)} บาท`
    }
  }
}
</script>

<style scoped>
.budget-report-table {
  background: #fff;
  border-color: #dce3ea;
  min-width: 980px;
}

.budget-report-table th,
.budget-report-table td {
  border-color: #dce3ea !important;
}

.budget-report-table thead th {
  background: #f6f8fb;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
}

.budget-report-category-row td {
  background: #f7f9fc;
  font-size: 1.15rem;
  font-weight: 700;
  color: #111827;
  border-top: 2px solid #d1d9e2 !important;
}

.budget-report-item-row td {
  background: #fff;
  color: #1f2937;
}

.budget-report-item-name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  line-height: 1.45;
}

.budget-report-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 1px 8px;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.2;
  color: #8b1212;
  background: #ffe4e9;
  border: 1px solid #f7b8c6;
}

.budget-report-total-row td {
  background: #f2f5f9;
  font-size: 1.05rem;
  font-weight: 700;
  color: #111827;
}

.budget-report.is-dark .budget-report-table {
  background: #1a2432;
  border-color: #324458;
}

.budget-report.is-dark .budget-report-table th,
.budget-report.is-dark .budget-report-table td {
  border-color: #324458 !important;
}

.budget-report.is-dark .budget-report-table thead th {
  background: #243548;
  color: #e6edf7;
}

.budget-report.is-dark .budget-report-category-row td {
  background: #1f2d3d;
  color: #e6edf7;
  border-top-color: #3b5168 !important;
}

.budget-report.is-dark .budget-report-item-row td {
  background: #1a2432;
  color: #dce7f5;
}

.budget-report.is-dark .budget-report-total-row td {
  background: #223142;
  color: #f3f7fd;
}

.budget-report.is-dark .budget-report-chip {
  color: #fecaca;
  background: rgba(127, 29, 29, 0.34);
  border-color: rgba(248, 113, 113, 0.42);
}
</style>
