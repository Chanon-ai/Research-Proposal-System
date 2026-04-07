<template>
  <div class="funding-type-section" :class="{ 'is-dark': isDarkTheme }">
    <div class="funding-options funding-selector">
      <div class="funding-selector__step">
        <div class="funding-selector__step-title">{{ step1Title }}</div>
        <div class="funding-selector__step-description">{{ step1Description }}</div>
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
              <span v-if="typeOption.subOptions.length" class="funding-type-card__badge">{{ subOptionBadge }}</span>
            </div>

            <div v-if="hasBudgetLimit(typeOption.budgetLimit)" class="funding-type-card__budget">
              {{ budgetLimitText(typeOption.budgetLimit) }}
            </div>

            <p class="funding-type-card__description mb-0">{{ typeOption.shortDescription }}</p>

            <details class="funding-detail-disclosure">
              <summary class="funding-detail-toggle">
                <span class="funding-detail-toggle__collapsed">{{ moreDetailsText }}</span>
                <span class="funding-detail-toggle__expanded">{{ hideDetailsText }}</span>
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
              <span class="funding-selector__step-required">{{ requiredText }}</span>
              <span class="funding-selector__step-status" :class="fundingSubSelectionStatusClass">
                <span class="funding-selector__step-status-icon" aria-hidden="true">{{ fundingSubSelectionStatusIcon }}</span>
                {{ fundingSubSelectionStatusText }}
              </span>
            </div>
          </div>
          <div class="funding-selector__step-context">{{ stepContextText }}</div>
          <div class="funding-selector__step-description">{{ subStepDescription }}</div>

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
                <span class="funding-subtype-card__marker" :class="{ 'is-active': fundingSubType === subOption.value }" aria-hidden="true">?</span>
              </div>

              <p class="funding-subtype-card__description mb-0">{{ subOption.shortDescription }}</p>

              <details class="funding-detail-disclosure">
                <summary class="funding-detail-toggle">
                  <span class="funding-detail-toggle__collapsed">{{ moreDetailsText }}</span>
                  <span class="funding-detail-toggle__expanded">{{ hideDetailsText }}</span>
                </summary>
                <p class="mb-0">{{ subOption.officialText }}</p>
              </details>
            </article>
          </div>
        </div>
      </transition>

      <div v-if="fundingType" class="funding-selection-summary" :class="{ 'is-pulse': isFundingSummaryPulsing }">
        <div class="funding-selection-summary__label">{{ summaryLabel }}</div>
        <div
          class="funding-selection-summary__status"
          :class="{ 'is-incomplete': !isFundingSubSelectionComplete, 'is-complete': isFundingSubSelectionComplete }"
          role="status"
          aria-live="polite"
        >
          <span class="funding-selection-summary__status-icon" aria-hidden="true">{{ fundingSubSelectionStatusIcon }}</span>
          <span v-if="!isFundingSubSelectionComplete">{{ incompleteSummaryText }}</span>
          <span v-else>{{ completeSummaryText }}</span>
        </div>
        <div class="funding-selection-summary__path">
          {{ selectedFundingTypeLabel }}
          <template v-if="selectedFundingTypeOption && selectedFundingTypeOption.subOptions.length">
            <span v-if="selectedFundingSubTypeLabel"> ? {{ selectedFundingSubTypeLabel }}</span>
            <span v-else> ? {{ pendingSelectionText }}</span>
          </template>
        </div>
        <div v-if="selectedFundingTypeOption && hasBudgetLimit(selectedFundingTypeOption.budgetLimit)" class="funding-selection-summary__budget">
          {{ budgetLimitText(selectedFundingTypeOption.budgetLimit) }}
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
      default: ''
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
  computed: {
    isEnglishLocale() {
      const locale = String((this.$i18n && this.$i18n.locale) || '')
      return locale.toLowerCase().startsWith('en')
    },
    step1Title() {
      return this.isEnglishLocale ? 'Step 1: Select the main funding type' : '??????? 1: ??????????????????'
    },
    step1Description() {
      return this.isEnglishLocale
        ? 'Choose the funding type that matches the project before selecting any sub-option.'
        : '??????????????????????????????????? ????????????????????? (?????)'
    },
    subOptionBadge() {
      return this.isEnglishLocale ? 'Has sub-options' : '??????????????'
    },
    moreDetailsText() {
      return this.isEnglishLocale ? '+ More details' : '+ ???????????????????'
    },
    hideDetailsText() {
      return this.isEnglishLocale ? '- Hide details' : '- ??????????????'
    },
    requiredText() {
      return this.isEnglishLocale ? 'You must select 1 item' : '??????????????? 1 ??????'
    },
    stepContextText() {
      return this.isEnglishLocale
        ? `Research framework for: ${this.selectedFundingTypeLabel}`
        : `???????????????: ${this.selectedFundingTypeLabel}`
    },
    subStepDescription() {
      return this.isEnglishLocale
        ? 'This step is required to confirm the selected funding type.'
        : '?????????????????????????????????????????????????????????????'
    },
    summaryLabel() {
      return this.isEnglishLocale ? 'Selection Summary' : '????????????'
    },
    incompleteSummaryText() {
      return this.isEnglishLocale ? 'Research framework not selected yet' : '??????????????????????????'
    },
    completeSummaryText() {
      return this.isEnglishLocale ? 'Complete' : '????????????'
    },
    pendingSelectionText() {
      return this.isEnglishLocale ? '(not selected yet)' : '(??????????????)'
    }
  },
  methods: {
    hasBudgetLimit(value) {
      return Number.isFinite(Number(value)) && Number(value) > 0
    },
    budgetLimitText(value) {
      const amount = Number(value)
      if (!Number.isFinite(amount) || amount <= 0) return '-'
      if (this.isEnglishLocale) {
        return `Maximum budget ${amount.toLocaleString('en-US')} THB`
      }
      return `???????????? ${amount.toLocaleString('th-TH')} ???`
    },
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
  margin-top: 18px;
}

.funding-selector__step-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
}

.funding-selector__step-description,
.funding-selector__step-context {
  margin-top: 4px;
  font-size: 0.82rem;
  color: #64748b;
}

.funding-selector__type-grid,
.funding-selector__sub-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.funding-type-card,
.funding-subtype-card {
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #fcfdff;
  padding: 12px;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.funding-type-card:hover,
.funding-subtype-card:hover {
  border-color: #9eb4ce;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
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
.funding-subtype-card__header,
.funding-selector__step-heading {
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

.funding-type-card__badge {
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
  padding: 3px 8px;
  font-size: 0.72rem;
  font-weight: 700;
}

.funding-type-card__budget,
.funding-selection-summary__budget {
  margin-top: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #92400e;
}

.funding-type-card__description,
.funding-subtype-card__description {
  margin-top: 8px;
  font-size: 0.84rem;
  color: #475569;
  line-height: 1.45;
}

.funding-detail-disclosure {
  margin-top: 10px;
}

.funding-detail-toggle {
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  color: #2563eb;
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

.funding-selector__step-required {
  font-size: 0.75rem;
  font-weight: 700;
  color: #92400e;
}

.funding-selector__step-status,
.funding-selection-summary__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
}

.funding-selector__step-status.is-incomplete,
.funding-selection-summary__status.is-incomplete {
  color: #b45309;
}

.funding-selector__step-status.is-complete,
.funding-selection-summary__status.is-complete {
  color: #15803d;
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
  font-size: 0.74rem;
  flex: 0 0 auto;
}

.funding-subtype-card__marker.is-active {
  border-color: #1d4ed8;
  background: #1d4ed8;
  color: #ffffff;
}

.funding-selection-summary {
  margin-top: 16px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  padding: 12px;
  background: #f8fbff;
}

.funding-selection-summary__label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.funding-selection-summary__path {
  margin-top: 8px;
  font-weight: 700;
  color: #0f172a;
}

@media (max-width: 768px) {
  .funding-selector__type-grid,
  .funding-selector__sub-grid {
    grid-template-columns: 1fr;
  }
}
</style>
