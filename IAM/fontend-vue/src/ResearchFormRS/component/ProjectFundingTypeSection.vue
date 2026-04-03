<template>
  <div class="funding-type-section" :class="{ 'is-dark': isDarkTheme }">
    <div class="funding-options funding-selector">
      <div class="funding-selector__step">
        <div class="funding-selector__step-title">ขั้นที่ 1: เลือกประเภททุนหลัก</div>
        <div class="funding-selector__step-description">เลือกประเภททุนที่สอดคล้องกับโครงการ ก่อนเลือกตัวเลือกย่อย (ถ้ามี)</div>
        <div class="funding-selector__type-grid">
          <article
            v-for="typeOption in fundingTypeOptions"
            :key="typeOption.value"
            class="funding-type-card"
            :class="{ 'is-active': fundingType === typeOption.value, 'is-read-only': isReadOnly }"
            @click="$emit('funding-type-card-click', typeOption.value, $event)"
          >
            <div class="funding-type-card__header">
              <div class="funding-type-card__radio-wrap">
                <input
                  :id="`funding-type-${typeOption.value}`"
                  type="radio"
                  class="form-check-input funding-type-card__radio"
                  :checked="fundingType === typeOption.value"
                  :disabled="isReadOnly"
                  @change="$emit('funding-type-card-click', typeOption.value, $event)"
                >
                <label class="funding-type-card__title" :for="`funding-type-${typeOption.value}`">
                  {{ typeOption.shortName }}
                </label>
              </div>
              <span v-if="typeOption.subOptions.length" class="funding-type-card__badge">มีตัวเลือกย่อย</span>
            </div>

            <p class="funding-type-card__description mb-0">{{ typeOption.shortDescription }}</p>

            <details class="funding-detail-disclosure">
              <summary class="funding-detail-toggle">
                <span class="funding-detail-toggle__collapsed">+ รายละเอียดเพิ่มเติม</span>
                <span class="funding-detail-toggle__expanded">- ซ่อนรายละเอียด</span>
              </summary>
              <p class="mb-0">{{ typeOption.officialText }}</p>
            </details>
          </article>
        </div>
      </div>

      <transition name="funding-step-reveal">
        <div
          v-if="selectedFundingTypeOption && selectedFundingTypeOption.subOptions.length"
          ref="fundingSubStep"
          class="funding-selector__step funding-selector__step--child"
          tabindex="-1"
        >
          <div class="funding-selector__step-heading">
            <div class="funding-selector__step-title">{{ selectedFundingTypeOption.subSectionTitle }}</div>
            <div class="funding-selector__step-meta">
              <span class="funding-selector__step-required">จำเป็นต้องเลือก 1 รายการ</span>
              <span class="funding-selector__step-status" :class="fundingSubSelectionStatusClass">
                <span class="funding-selector__step-status-icon" aria-hidden="true">{{ fundingSubSelectionStatusIcon }}</span>
                {{ fundingSubSelectionStatusText }}
              </span>
            </div>
          </div>
          <div class="funding-selector__step-context">กรอบการวิจัยของ: {{ selectedFundingTypeLabel }}</div>
          <div class="funding-selector__step-description">ขั้นตอนนี้เป็นข้อมูลที่จำเป็นสำหรับการยืนยันประเภททุนที่เลือก</div>

          <div class="funding-selector__sub-grid">
            <article
              v-for="subOption in selectedFundingTypeOption.subOptions"
              :key="`${selectedFundingTypeOption.value}-${subOption.value}`"
              class="funding-subtype-card"
              :class="{ 'is-active': fundingSubType === subOption.value, 'is-read-only': isReadOnly }"
              @click="$emit('funding-subtype-card-click', subOption.value, $event)"
            >
              <div class="funding-subtype-card__header">
                <div class="funding-subtype-card__radio-wrap">
                  <input
                    :id="`funding-subtype-${selectedFundingTypeOption.value}-${subOption.value}`"
                    type="radio"
                    class="form-check-input funding-subtype-card__radio"
                    :checked="fundingSubType === subOption.value"
                    :disabled="isReadOnly"
                    @change="$emit('funding-subtype-card-click', subOption.value, $event)"
                  >
                  <label class="funding-subtype-card__title" :for="`funding-subtype-${selectedFundingTypeOption.value}-${subOption.value}`">
                    {{ subOption.shortName }}
                  </label>
                </div>
                <span class="funding-subtype-card__marker" :class="{ 'is-active': fundingSubType === subOption.value }" aria-hidden="true">✓</span>
              </div>

              <p class="funding-subtype-card__description mb-0">{{ subOption.shortDescription }}</p>

              <details class="funding-detail-disclosure">
                <summary class="funding-detail-toggle">
                  <span class="funding-detail-toggle__collapsed">+ รายละเอียดเพิ่มเติม</span>
                  <span class="funding-detail-toggle__expanded">- ซ่อนรายละเอียด</span>
                </summary>
                <p class="mb-0">{{ subOption.officialText }}</p>
              </details>
            </article>
          </div>
        </div>
      </transition>

      <div v-if="fundingType" class="funding-selection-summary" :class="{ 'is-pulse': isFundingSummaryPulsing }">
        <div class="funding-selection-summary__label">สรุปการเลือก</div>
        <div
          class="funding-selection-summary__status"
          :class="{ 'is-incomplete': !isFundingSubSelectionComplete, 'is-complete': isFundingSubSelectionComplete }"
          role="status"
          aria-live="polite"
        >
          <span class="funding-selection-summary__status-icon" aria-hidden="true">{{ fundingSubSelectionStatusIcon }}</span>
          <span v-if="!isFundingSubSelectionComplete">⚠ ยังไม่ได้เลือกกรอบการวิจัย</span>
          <span v-else>✓ เลือกครบแล้ว</span>
        </div>
        <div class="funding-selection-summary__path">
          {{ selectedFundingTypeLabel }}
          <template v-if="selectedFundingTypeOption && selectedFundingTypeOption.subOptions.length">
            <span v-if="selectedFundingSubTypeLabel"> → {{ selectedFundingSubTypeLabel }}</span>
            <span v-else> → (ยังไม่ได้เลือก)</span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProjectFundingTypeSection',
  props: {
    fundingTypeOptions: {
      type: Array,
      default: () => []
    },
    selectedFundingTypeOption: {
      type: Object,
      default: null
    },
    selectedFundingTypeLabel: {
      type: String,
      default: '-'
    },
    selectedFundingSubTypeLabel: {
      type: String,
      default: ''
    },
    fundingType: {
      type: String,
      default: ''
    },
    fundingSubType: {
      type: String,
      default: ''
    },
    fundingSubSelectionStatusClass: {
      type: String,
      default: 'is-incomplete'
    },
    fundingSubSelectionStatusIcon: {
      type: String,
      default: '!'
    },
    fundingSubSelectionStatusText: {
      type: String,
      default: 'ยังไม่ครบ'
    },
    isFundingSubSelectionComplete: {
      type: Boolean,
      default: false
    },
    isFundingSummaryPulsing: {
      type: Boolean,
      default: false
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
  methods: {
    focusSubStepIfNeeded(fundingType) {
      const option = (Array.isArray(this.fundingTypeOptions) ? this.fundingTypeOptions : [])
        .find((item) => item && item.value === fundingType)
      if (!option || !Array.isArray(option.subOptions) || option.subOptions.length === 0) return

      this.$nextTick(() => {
        const el = this.$refs.fundingSubStep
        if (!el || typeof el.scrollIntoView !== 'function') return
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        if (typeof el.focus === 'function') {
          try {
            el.focus({ preventScroll: true })
          } catch (_) {
            el.focus()
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.funding-type-section.is-dark {
  color: #e6edf7;
}

.funding-options {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.funding-selector {
  background: #ffffff;
  border: 1px solid #d8e2ef;
  border-radius: 12px;
  padding: 16px;
}

.funding-selector__step + .funding-selector__step {
  margin-top: 14px;
}

.funding-selector__step--child {
  margin-left: 12px;
  margin-top: 16px;
  border: 1px solid #d7e3f4;
  border-left: 1px solid #d7e3f4;
  border-radius: 10px;
  background: #f8fbff;
  padding: 14px 14px 12px;
  scroll-margin-top: 92px;
}

.funding-selector__step--child:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.16);
}

.funding-step-reveal-enter-active,
.funding-step-reveal-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.funding-step-reveal-enter,
.funding-step-reveal-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.funding-selector__step-title {
  font-size: 0.96rem;
  font-weight: 700;
  color: #1f2937;
}

.funding-selector__step-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.funding-selector__step-meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.funding-selector__step-context {
  margin-top: 6px;
  font-size: 0.84rem;
  color: #334155;
  font-weight: 600;
}

.funding-selector__step-required {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 0.72rem;
  font-weight: 700;
  background: #fef3c7;
  color: #92400e;
}

.funding-selector__step-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}

.funding-selector__step-status-icon {
  font-size: 0.78rem;
  line-height: 1;
}

.funding-selector__step-status.is-complete {
  background: #dcfce7;
  color: #166534;
}

.funding-selector__step-status.is-incomplete {
  background: #fef3c7;
  color: #92400e;
}

.funding-selector__step-description {
  margin-top: 5px;
  margin-bottom: 12px;
  font-size: 0.82rem;
  color: #64748b;
}

.funding-selector__type-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.funding-selector__sub-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.funding-type-card,
.funding-subtype-card {
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  background: #fcfdff;
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.funding-type-card:hover,
.funding-subtype-card:hover {
  border-color: #9eb4ce;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.funding-subtype-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 10px 12px;
  background: #ffffff;
}

.funding-type-card.is-active,
.funding-subtype-card.is-active {
  border-color: #60a5fa;
  background: #eff6ff;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.14), 0 6px 14px rgba(30, 64, 175, 0.08);
  transform: translateY(-1px);
}

.funding-type-card.is-read-only,
.funding-subtype-card.is-read-only {
  opacity: 0.92;
}

.funding-type-card__header,
.funding-subtype-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.funding-type-card__radio-wrap,
.funding-subtype-card__radio-wrap {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.funding-type-card__radio,
.funding-subtype-card__radio {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  margin: 0;
  pointer-events: none;
}

.funding-type-card__title,
.funding-subtype-card__title {
  margin: 0;
  font-weight: 700;
  color: #1f2937;
  cursor: pointer;
  line-height: 1.35;
}

.funding-type-card__description,
.funding-subtype-card__description {
  margin-top: 6px;
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.45;
}

.funding-subtype-card__description {
  margin-top: 6px;
  margin-left: 0;
}

.funding-subtype-card__marker {
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

.funding-subtype-card__marker.is-active {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
}

.funding-type-card__badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #8b1212;
  background: #ffe8e8;
  flex-shrink: 0;
}

.funding-detail-disclosure {
  margin-top: 7px;
  font-size: 0.82rem;
}

.funding-subtype-card .funding-detail-disclosure {
  margin-top: 6px;
  margin-left: 0;
  padding-top: 0;
}

.funding-detail-disclosure summary {
  cursor: pointer;
  list-style: none;
  outline: none;
}

.funding-detail-disclosure summary::-webkit-details-marker {
  display: none;
}

.funding-detail-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #8b1212;
  font-weight: 700;
}

.funding-detail-toggle__expanded {
  display: none;
}

.funding-detail-disclosure[open] .funding-detail-toggle__collapsed {
  display: none;
}

.funding-detail-disclosure[open] .funding-detail-toggle__expanded {
  display: inline;
}

.funding-detail-disclosure p {
  margin-top: 6px;
  color: #475569;
  line-height: 1.5;
}

.funding-selection-summary {
  margin-top: 14px;
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  background: #f8fafc;
  padding: 11px 12px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.funding-selection-summary.is-pulse {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.16);
}

.funding-selection-summary__label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 3px;
}

.funding-selection-summary__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 3px 10px;
  font-size: 0.82rem;
  font-weight: 700;
}

.funding-selection-summary__status.is-complete {
  background: #dcfce7;
  border-color: #86efac;
  color: #166534;
}

.funding-selection-summary__status.is-incomplete {
  background: #fef3c7;
  border-color: #fcd34d;
  color: #92400e;
}

.funding-selection-summary__status-icon {
  font-size: 0.84rem;
  line-height: 1;
}

.funding-selection-summary__path {
  margin-top: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.45;
}

.funding-type-section.is-dark .funding-options {
  background: #1a2432;
  border: 1px solid #2f3f52;
}

.funding-type-section.is-dark .funding-selector {
  background: #1a2432;
  border-color: #324458;
}

.funding-type-section.is-dark .funding-selector__step--child {
  background: rgba(32, 44, 58, 0.6);
  border-color: #324458;
  border-left-color: #324458;
}

.funding-type-section.is-dark .funding-type-card,
.funding-type-section.is-dark .funding-subtype-card {
  background: #202c3a;
  border-color: #35506a;
}

.funding-type-section.is-dark .funding-subtype-card:hover {
  border-color: #557a9d;
  background: #243243;
}

.funding-type-section.is-dark .funding-type-card.is-active,
.funding-type-section.is-dark .funding-subtype-card.is-active {
  border-color: #6aa7ff;
  box-shadow: 0 0 0 3px rgba(106, 167, 255, 0.22);
  background: rgba(29, 78, 216, 0.26);
}

.funding-type-section.is-dark .funding-selector__step-title,
.funding-type-section.is-dark .funding-selector__step-context,
.funding-type-section.is-dark .funding-type-card__title,
.funding-type-section.is-dark .funding-subtype-card__title,
.funding-type-section.is-dark .funding-selection-summary__label,
.funding-type-section.is-dark .funding-selection-summary__path,
.funding-type-section.is-dark .funding-selection-summary__status {
  color: #e6edf7;
}

.funding-type-section.is-dark .funding-selector__step-description,
.funding-type-section.is-dark .funding-type-card__description,
.funding-type-section.is-dark .funding-subtype-card__description,
.funding-type-section.is-dark .funding-detail-disclosure p,
.funding-type-section.is-dark .funding-detail-toggle {
  color: #aab9ca;
}

.funding-type-section.is-dark .funding-selection-summary {
  background: rgba(32, 44, 58, 0.9);
  border-color: #35506a;
}

.funding-type-section.is-dark .funding-selector__step-status.is-complete {
  background: rgba(34, 197, 94, 0.22);
  color: #bbf7d0;
}

.funding-type-section.is-dark .funding-selector__step-status.is-incomplete {
  background: rgba(245, 158, 11, 0.2);
  color: #fde68a;
}

.funding-type-section.is-dark .funding-selector__step-required {
  background: rgba(197, 155, 58, 0.2);
  color: #fde68a;
}

.funding-type-section.is-dark .funding-subtype-card__marker {
  border-color: #496786;
  color: #90b2d4;
  background: #223142;
}

.funding-type-section.is-dark .funding-subtype-card__marker.is-active {
  border-color: #7fb6ff;
  color: #ffffff;
  background: #4f86db;
}

.funding-type-section.is-dark .funding-selection-summary__status.is-complete {
  background: rgba(34, 197, 94, 0.18);
  border-color: rgba(74, 222, 128, 0.4);
  color: #bbf7d0;
}

.funding-type-section.is-dark .funding-selection-summary__status.is-incomplete {
  background: rgba(245, 158, 11, 0.18);
  border-color: rgba(251, 191, 36, 0.42);
  color: #fde68a;
}

@media (max-width: 768px) {
  .funding-selector {
    padding: 12px;
  }
  .funding-selector__type-grid {
    grid-template-columns: 1fr;
  }
  .funding-selector__sub-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .funding-selector__step--child {
    margin-left: 0;
    padding: 12px 10px;
  }
  .funding-subtype-card {
    min-height: auto;
  }
  .funding-subtype-card__description,
  .funding-subtype-card .funding-detail-disclosure {
    margin-left: 0;
  }
  .funding-selector__step-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .funding-selector__step-meta {
    width: 100%;
    justify-content: flex-start;
  }
  .funding-selection-summary__status {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
