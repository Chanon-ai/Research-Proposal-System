<template>
  <div class="expected-outcomes-section" :class="{ 'is-dark': isDarkTheme }">
    <div class="funding-options expected-outcome-selector">
      <div v-if="!hasFundingType" class="alert alert-warning mb-0">
        <i class="cil-info me-2"></i> {{ chooseFundingFirstText }}
      </div>

      <template v-else>
        <div class="expected-outcome-selector__heading">
          <div class="expected-outcome-selector__title">{{ currentFundingSectionLabel }}</div>
          <div class="expected-outcome-selector__intro">{{ introText }}</div>
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
              >?</span>
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
          <span class="expected-outcome-summary__icon" aria-hidden="true">{{ isOutcomeSelected ? '?' : 'i' }}</span>
          <span v-if="isOutcomeSelected">{{ selectedOutcomeText }}</span>
          <span v-else>{{ promptText }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
const OUTCOME_OPTION_KEYS_BY_FUNDING = {
  'new-researcher': ['internationalConference', 'scopusJournal', 'tciJournal', 'patent'],
  'researcher-development': ['scopusJournal', 'tciJournal', 'patent'],
  'strategic-research': ['scopusJournal', 'tciJournal', 'patent'],
  'industry-extension': ['ipRegistration']
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
    isEnglishLocale() {
      const locale = String((this.$i18n && this.$i18n.locale) || '')
      return locale.toLowerCase().startsWith('en')
    },
    sectionLabels() {
      return this.isEnglishLocale
        ? {
            'new-researcher': '14.1 New Researcher Grant',
            'researcher-development': '14.2 Researcher Development Grant',
            'strategic-research': '14.3 Strategic Research Grant',
            'industry-extension': '14.4 Industry Extension Grant'
          }
        : {
            'new-researcher': '14.1 ???????????????????',
            'researcher-development': '14.2 ????????????????',
            'strategic-research': '14.3 ????????????????????????????????',
            'industry-extension': '14.4 ?????????????????????????'
          }
    },
    outcomeOptionDictionary() {
      return this.isEnglishLocale
        ? {
            internationalConference: {
              value: 'internationalConference',
              label: 'International academic conference presentation (Proceedings)',
              description: 'Disseminate research at an international academic conference.'
            },
            scopusJournal: {
              value: 'scopusJournal',
              label: 'International journal publication in an approved index',
              description: 'Publish a research article in an internationally recognized journal.'
            },
            tciJournal: {
              value: 'tciJournal',
              label: 'TCI Group 1 journal publication only',
              description: 'Publish an article in a TCI Group 1 journal according to the criteria.'
            },
            patent: {
              value: 'patent',
              label: 'Petty patent / Patent',
              description: 'Develop knowledge toward intellectual property protection.'
            },
            ipRegistration: {
              value: 'ipRegistration',
              label: 'Intellectual property registration application (with application number)',
              description: 'File an intellectual property registration application for future utilization.'
            }
          }
        : {
            internationalConference: {
              value: 'internationalConference',
              label: '????????????????????????????????????? (Proceedings)',
              description: '???????????????????????????????????????????'
            },
            scopusJournal: {
              value: 'scopusJournal',
              label: '?????????????????????????????? ?.?.?.',
              description: '????????????????????????????????????????????????????'
            },
            tciJournal: {
              value: 'tciJournal',
              label: '????????????? TCI ????? 1 ????????',
              description: '????????????????????? TCI ????? 1 ????????????????'
            },
            patent: {
              value: 'patent',
              label: '????????????/?????????',
              description: '???????????????????????????????????????????????'
            },
            ipRegistration: {
              value: 'ipRegistration',
              label: '??????????????????????????????????? (??????????)',
              description: '???????????????????????????????????????????????????????????'
            }
          }
    },
    chooseFundingFirstText() {
      return this.isEnglishLocale
        ? 'Please select the funding type in section 2 before choosing an outcome.'
        : '?????????? "?????????" ??????????? 2 ?????????????????'
    },
    introText() {
      return this.isEnglishLocale
        ? 'Select 1 expected outcome that matches the selected funding type.'
        : '????? 1 ???????????????????????????????????????????????????????'
    },
    promptText() {
      return this.isEnglishLocale
        ? 'Please select 1 expected outcome'
        : '?????????? 1 ????????????????????????'
    },
    hasFundingType() {
      return Boolean(this.outcomeOptions.length)
    },
    currentFundingSectionLabel() {
      return this.sectionLabels[this.fundingType] || ''
    },
    outcomeOptions() {
      const keys = OUTCOME_OPTION_KEYS_BY_FUNDING[this.fundingType] || []
      return keys.map((key) => this.outcomeOptionDictionary[key]).filter(Boolean)
    },
    selectedOutcomeOption() {
      return this.outcomeOptions.find((item) => item.value === this.selectedOutcome) || null
    },
    selectedOutcomeLabel() {
      return this.selectedOutcomeOption ? this.selectedOutcomeOption.label : ''
    },
    selectedOutcomeText() {
      return this.isEnglishLocale
        ? `Selected: ${this.selectedOutcomeLabel}`
        : `?????????: ${this.selectedOutcomeLabel}`
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
  font-size: 0.74rem;
  flex: 0 0 auto;
}

.expected-outcome-card__marker.is-active {
  border-color: #1d4ed8;
  background: #1d4ed8;
  color: #ffffff;
}

.expected-outcome-summary {
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
}

.expected-outcome-summary.is-complete {
  background: #ecfdf3;
  color: #15803d;
}

.expected-outcome-summary.is-incomplete {
  background: #fff7ed;
  color: #b45309;
}

.expected-outcome-summary__icon {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
}

@media (max-width: 768px) {
  .expected-outcome-selector__grid {
    grid-template-columns: 1fr;
  }
}
</style>
