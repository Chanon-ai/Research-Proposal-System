<template>
  <div class="research-type-section" :class="{ 'is-dark': isDarkTheme }">
    <div class="funding-options research-type-selector">
      <div class="research-type-selector__intro">{{ text.intro }}</div>

      <div class="research-type-selector__grid">
        <article
          v-for="option in researchTypeOptions"
          :key="option.value"
          class="research-type-card"
          :class="{ 'is-active': researchType === option.value, 'is-read-only': isReadOnly }"
          @click="$emit('research-type-card-click', option.value, $event)"
        >
          <div class="research-type-card__header">
            <div class="research-type-card__radio-wrap">
              <input
                :id="`research-type-${option.value}`"
                type="radio"
                class="form-check-input research-type-card__radio"
                name="researchType"
                :checked="researchType === option.value"
                :disabled="isReadOnly"
                @change="$emit('research-type-card-click', option.value, $event)"
              >
              <label class="research-type-card__title" :for="`research-type-${option.value}`">
                {{ option.label }}
              </label>
            </div>
            <span
              class="research-type-card__marker"
              :class="{ 'is-active': researchType === option.value }"
              aria-hidden="true"
            >✓</span>
          </div>
          <p class="research-type-card__description mb-0">{{ option.description }}</p>
        </article>
      </div>

      <div
        class="research-type-summary"
        :class="{ 'is-complete': isResearchTypeSelected, 'is-incomplete': !isResearchTypeSelected }"
        role="status"
        aria-live="polite"
      >
        <span class="research-type-summary__icon" aria-hidden="true">{{ isResearchTypeSelected ? '✓' : 'i' }}</span>
        <span v-if="isResearchTypeSelected">{{ text.selectedPrefix }} {{ selectedResearchTypeLabel }}</span>
        <span v-else>{{ text.emptySelection }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProjectResearchTypeSection',
  props: {
    researchTypeOptions: {
      type: Array,
      default: () => []
    },
    researchType: {
      type: String,
      default: ''
    },
    selectedResearchTypeLabel: {
      type: String,
      default: ''
    },
    isResearchTypeSelected: {
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
    text() {
      if (this.isEnglishLocale) {
        return {
          intro: 'Select 1 research type that matches the project.',
          selectedPrefix: 'Selected:',
          emptySelection: 'Please select 1 research type.'
        }
      }
      return {
        intro: 'เลือก 1 ประเภทงานวิจัยที่สอดคล้องกับโครงการ',
        selectedPrefix: 'เลือกแล้ว:',
        emptySelection: 'กรุณาเลือก 1 ประเภทงานวิจัย'
      }
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

.research-type-selector {
  background: #ffffff;
  border: 1px solid #d8e2ef;
  border-radius: 12px;
  padding: 16px;
}

.research-type-selector__intro {
  margin-bottom: 10px;
  font-size: 0.82rem;
  color: #64748b;
}

.research-type-selector__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.research-type-card {
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  background: #fcfdff;
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.research-type-card:hover {
  border-color: #9eb4ce;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.research-type-card.is-active {
  border-color: #60a5fa;
  background: #eff6ff;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.14), 0 6px 14px rgba(30, 64, 175, 0.08);
  transform: translateY(-1px);
}

.research-type-card.is-read-only {
  opacity: 0.92;
}

.research-type-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.research-type-card__radio-wrap {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.research-type-card__radio {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  margin: 0;
  pointer-events: none;
}

.research-type-card__title {
  margin: 0;
  font-weight: 700;
  color: #1f2937;
  cursor: pointer;
  line-height: 1.35;
}

.research-type-card__description {
  margin-top: 6px;
  font-size: 0.84rem;
  color: #475569;
  line-height: 1.45;
}

.research-type-card__marker {
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

.research-type-card__marker.is-active {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
}

.research-type-summary {
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

.research-type-summary.is-complete {
  background: #ecfdf3;
  border-color: #86efac;
  color: #166534;
}

.research-type-summary__icon {
  font-size: 0.84rem;
  line-height: 1;
}

.research-type-section.is-dark .funding-options {
  background: #1a2432;
  border: 1px solid #2f3f52;
}

.research-type-section.is-dark .research-type-selector {
  background: #1a2432;
  border-color: #324458;
}

.research-type-section.is-dark .research-type-selector__intro,
.research-type-section.is-dark .research-type-card__description {
  color: #aab9ca;
}

.research-type-section.is-dark .research-type-card {
  background: #202c3a;
  border-color: #35506a;
}

.research-type-section.is-dark .research-type-card:hover {
  border-color: #557a9d;
  background: #243243;
}

.research-type-section.is-dark .research-type-card.is-active {
  border-color: #6aa7ff;
  box-shadow: 0 0 0 3px rgba(106, 167, 255, 0.22);
  background: rgba(29, 78, 216, 0.26);
}

.research-type-section.is-dark .research-type-card__title {
  color: #e6edf7;
}

.research-type-section.is-dark .research-type-card__marker {
  border-color: #496786;
  background: #223142;
}

.research-type-section.is-dark .research-type-card__marker.is-active {
  border-color: #7fb6ff;
  background: #4f86db;
}

.research-type-section.is-dark .research-type-summary.is-complete {
  background: rgba(34, 197, 94, 0.18);
  border-color: rgba(74, 222, 128, 0.4);
  color: #bbf7d0;
}

.research-type-section.is-dark .research-type-summary.is-incomplete {
  background: rgba(30, 41, 59, 0.72);
  border-color: #3b5168;
  color: #cbd5e1;
}

@media (max-width: 768px) {
  .research-type-selector {
    padding: 12px;
  }
  .research-type-selector__grid {
    grid-template-columns: 1fr;
  }
  .research-type-summary {
    width: 100%;
  }
}
</style>
