<template>
  <div class="expected-outcomes-section" :class="{ 'is-dark': isDarkTheme }">
    <div class="funding-options expected-outcome-selector">
      <div v-if="!hasFundingType" class="alert alert-warning mb-0">
        <i class="cil-info me-2"></i> กรุณาเลือก "ประเภททุน" ในหัวข้อที่ 2 เพื่อเลือกผลลัพธ์
      </div>

      <template v-else>
        <div class="expected-outcome-selector__heading">
          <div class="expected-outcome-selector__title">{{ currentFundingSectionLabel }}</div>
          <div class="expected-outcome-selector__intro">เลือก 1 ผลลัพธ์ที่คาดว่าจะได้รับให้สอดคล้องกับประเภททุนที่เลือก</div>
        </div>

        <div class="expected-outcome-selector__grid">
          <article
            v-for="option in outcomeOptions"
            :key="`${fundingType}-${option.value}`"
            class="expected-outcome-card"
            :class="{ 'is-active': selectedOutcome === option.value, 'is-read-only': isReadOnly }"
            @click="onOutcomeCardClick(option.value, $event)"
          >
            <div class="expected-outcome-card__header">
              <div class="expected-outcome-card__radio-wrap">
                <input
                  :id="`expected-outcome-${fundingType}-${option.value}`"
                  type="radio"
                  class="form-check-input expected-outcome-card__radio"
                  name="selectedOutcome"
                  :checked="selectedOutcome === option.value"
                  :disabled="isReadOnly"
                  @change="onOutcomeCardClick(option.value, $event)"
                >
                <label class="expected-outcome-card__title" :for="`expected-outcome-${fundingType}-${option.value}`">
                  {{ option.label }}
                </label>
              </div>
              <span
                class="expected-outcome-card__marker"
                :class="{ 'is-active': selectedOutcome === option.value }"
                aria-hidden="true"
              >✓</span>
            </div>

            <p class="expected-outcome-card__description mb-0">{{ option.description }}</p>
          </article>
        </div>

        <div
          class="expected-outcome-summary"
          :class="{ 'is-complete': isOutcomeSelected, 'is-incomplete': !isOutcomeSelected }"
          role="status"
          aria-live="polite"
        >
          <span class="expected-outcome-summary__icon" aria-hidden="true">{{ isOutcomeSelected ? '✓' : 'i' }}</span>
          <span v-if="isOutcomeSelected">เลือกแล้ว: {{ selectedOutcomeLabel }}</span>
          <span v-else>กรุณาเลือก 1 ผลลัพธ์ที่คาดว่าจะได้รับ</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
const FUNDING_SECTION_LABELS = {
  'new-researcher': '14.1 ทุนนักวิจัยรุ่นใหม่',
  'researcher-development': '14.2 ทุนพัฒนานักวิจัย',
  'strategic-research': '14.3 ทุนวิจัยที่สอดคล้องกับยุทธศาสตร์',
  'industry-extension': '14.4 ทุนต่อยอดสู่ภาคอุตสาหกรรม'
}

const OUTCOME_OPTIONS_BY_FUNDING = {
  'new-researcher': [
    {
      value: 'internationalConference',
      label: 'นำเสนอในการประชุมวิชาการระดับนานาชาติ (Proceedings)',
      description: 'เผยแพร่ผลงานในการประชุมวิชาการระดับนานาชาติ'
    },
    {
      value: 'scopusJournal',
      label: 'ตีพิมพ์วารสารนานาชาติฐานข้อมูล ก.พ.อ.',
      description: 'ตีพิมพ์บทความวิจัยในวารสารนานาชาติที่ได้รับการยอมรับ'
    },
    {
      value: 'tciJournal',
      label: 'ตีพิมพ์วารสาร TCI กลุ่ม 1 เท่านั้น',
      description: 'ตีพิมพ์บทความในวารสาร TCI กลุ่ม 1 ตามเกณฑ์ที่กำหนด'
    },
    {
      value: 'patent',
      label: 'อนุสิทธิบัตร/สิทธิบัตร',
      description: 'พัฒนาองค์ความรู้สู่การคุ้มครองทรัพย์สินทางปัญญา'
    }
  ],
  'researcher-development': [
    {
      value: 'scopusJournal',
      label: 'ตีพิมพ์วารสารนานาชาติฐานข้อมูล ก.พ.อ.',
      description: 'ตีพิมพ์บทความวิจัยในวารสารนานาชาติที่ได้รับการยอมรับ'
    },
    {
      value: 'tciJournal',
      label: 'ตีพิมพ์วารสาร TCI กลุ่ม 1 เท่านั้น',
      description: 'ตีพิมพ์บทความในวารสาร TCI กลุ่ม 1 ตามเกณฑ์ที่กำหนด'
    },
    {
      value: 'patent',
      label: 'อนุสิทธิบัตร/สิทธิบัตร',
      description: 'พัฒนาองค์ความรู้สู่การคุ้มครองทรัพย์สินทางปัญญา'
    }
  ],
  'strategic-research': [
    {
      value: 'scopusJournal',
      label: 'ตีพิมพ์วารสารนานาชาติฐานข้อมูล ก.พ.อ.',
      description: 'ตีพิมพ์บทความวิจัยในวารสารนานาชาติที่ได้รับการยอมรับ'
    },
    {
      value: 'tciJournal',
      label: 'ตีพิมพ์วารสาร TCI กลุ่ม 1 เท่านั้น',
      description: 'ตีพิมพ์บทความในวารสาร TCI กลุ่ม 1 ตามเกณฑ์ที่กำหนด'
    },
    {
      value: 'patent',
      label: 'อนุสิทธิบัตร/สิทธิบัตร',
      description: 'พัฒนาองค์ความรู้สู่การคุ้มครองทรัพย์สินทางปัญญา'
    }
  ],
  'industry-extension': [
    {
      value: 'ipRegistration',
      label: 'การยื่นขอจดทะเบียนทรัพย์สินทางปัญญา (มีเลขคำขอฯ)',
      description: 'ยื่นคำขอจดทะเบียนทรัพย์สินทางปัญญาเพื่อเตรียมการใช้ประโยชน์'
    }
  ]
}

export default {
  name: 'ProjectExpectedOutcomesSection',
  props: {
    fundingType: {
      type: String,
      default: ''
    },
    selectedOutcome: {
      type: String,
      default: ''
    },
    isReadOnly: {
      type: Boolean,
      default: false
    },
    isDarkTheme: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    hasFundingType() {
      return Boolean(this.outcomeOptions.length)
    },
    currentFundingSectionLabel() {
      return FUNDING_SECTION_LABELS[this.fundingType] || ''
    },
    outcomeOptions() {
      return OUTCOME_OPTIONS_BY_FUNDING[this.fundingType] || []
    },
    selectedOutcomeOption() {
      return this.outcomeOptions.find((item) => item.value === this.selectedOutcome) || null
    },
    selectedOutcomeLabel() {
      return this.selectedOutcomeOption ? this.selectedOutcomeOption.label : ''
    },
    isOutcomeSelected() {
      return Boolean(this.selectedOutcomeOption)
    }
  },
  methods: {
    onOutcomeCardClick(outcomeValue, event) {
      if (this.isReadOnly) return
      const target = event && event.target
      if (target && typeof target.closest === 'function') {
        if (target.closest('a, button, details, summary')) return
      }
      this.$emit('outcome-card-click', outcomeValue, event)
    }
  }
}
</script>

<style scoped>
.funding-options {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.expected-outcome-selector {
  background: #ffffff;
  border: 1px solid #d8e2ef;
  border-radius: 12px;
  padding: 16px;
}

.expected-outcome-selector__heading {
  margin-bottom: 10px;
}

.expected-outcome-selector__title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1f2937;
}

.expected-outcome-selector__intro {
  margin-top: 4px;
  font-size: 0.82rem;
  color: #64748b;
}

.expected-outcome-selector__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.expected-outcome-card {
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  background: #fcfdff;
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.expected-outcome-card:hover {
  border-color: #9eb4ce;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.expected-outcome-card.is-active {
  border-color: #60a5fa;
  background: #eff6ff;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.14), 0 6px 14px rgba(30, 64, 175, 0.08);
  transform: translateY(-1px);
}

.expected-outcome-card.is-read-only {
  opacity: 0.92;
}

.expected-outcome-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.expected-outcome-card__radio-wrap {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.expected-outcome-card__radio {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  margin: 0;
  pointer-events: none;
}

.expected-outcome-card__title {
  margin: 0;
  font-weight: 700;
  color: #1f2937;
  cursor: pointer;
  line-height: 1.35;
}

.expected-outcome-card__description {
  margin-top: 6px;
  font-size: 0.84rem;
  color: #475569;
  line-height: 1.45;
}

.expected-outcome-card__marker {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 1px solid #b4c4d8;
  background: #ffffff;
  color: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  flex: 0 0 20px;
  margin-top: 2px;
}

.expected-outcome-card__marker.is-active {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
}

.expected-outcome-summary {
  margin-top: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  padding: 9px 11px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
}

.expected-outcome-summary.is-complete {
  background: #ecfdf3;
  border-color: #86efac;
  color: #166534;
}

.expected-outcome-summary__icon {
  font-size: 0.84rem;
  line-height: 1;
}

.expected-outcomes-section.is-dark .funding-options {
  background: #1a2432;
  border: 1px solid #2f3f52;
}

.expected-outcomes-section.is-dark .expected-outcome-selector {
  background: #1a2432;
  border-color: #324458;
}

.expected-outcomes-section.is-dark .expected-outcome-selector__title {
  color: #e6edf7;
}

.expected-outcomes-section.is-dark .expected-outcome-selector__intro,
.expected-outcomes-section.is-dark .expected-outcome-card__description {
  color: #aab9ca;
}

.expected-outcomes-section.is-dark .expected-outcome-card {
  background: #202c3a;
  border-color: #35506a;
}

.expected-outcomes-section.is-dark .expected-outcome-card:hover {
  border-color: #557a9d;
  background: #243243;
}

.expected-outcomes-section.is-dark .expected-outcome-card.is-active {
  border-color: #6aa7ff;
  box-shadow: 0 0 0 3px rgba(106, 167, 255, 0.22);
  background: rgba(29, 78, 216, 0.26);
}

.expected-outcomes-section.is-dark .expected-outcome-card__title {
  color: #e6edf7;
}

.expected-outcomes-section.is-dark .expected-outcome-card__marker {
  border-color: #496786;
  background: #223142;
}

.expected-outcomes-section.is-dark .expected-outcome-card__marker.is-active {
  border-color: #7fb6ff;
  background: #4f86db;
}

.expected-outcomes-section.is-dark .expected-outcome-summary.is-complete {
  background: rgba(34, 197, 94, 0.18);
  border-color: rgba(74, 222, 128, 0.4);
  color: #bbf7d0;
}

.expected-outcomes-section.is-dark .expected-outcome-summary.is-incomplete {
  background: rgba(30, 41, 59, 0.72);
  border-color: #3b5168;
  color: #cbd5e1;
}

.expected-outcomes-section.is-dark .alert.alert-warning {
  background: rgba(245, 158, 11, 0.18);
  border-color: rgba(245, 158, 11, 0.35);
  color: #f8d48a;
}

@media (max-width: 768px) {
  .expected-outcome-selector {
    padding: 12px;
  }
  .expected-outcome-selector__grid {
    grid-template-columns: 1fr;
  }
  .expected-outcome-summary {
    width: 100%;
  }
}
</style>
