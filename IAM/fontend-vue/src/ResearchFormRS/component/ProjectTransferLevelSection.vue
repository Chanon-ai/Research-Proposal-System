<template>
  <div class="transfer-level-section" :class="{ 'is-dark': isDarkTheme }">
    <div class="funding-options transfer-level-selector">
      <div class="transfer-level-selector__intro">เลือก 1 ระดับการถ่ายทอดสู่สังคมที่สอดคล้องกับผลลัพธ์โครงการ</div>

      <div class="transfer-level-selector__grid">
        <article
          v-for="option in transferLevelOptions"
          :key="option.value"
          class="transfer-level-card"
          :class="{ 'is-active': transferLevel === option.value, 'is-read-only': isReadOnly }"
          @click="$emit('transfer-level-card-click', option.value, $event)"
        >
          <div class="transfer-level-card__header">
            <div class="transfer-level-card__radio-wrap">
              <input
                :id="`transfer-level-${option.value}`"
                type="radio"
                class="form-check-input transfer-level-card__radio"
                name="transferLevel"
                :checked="transferLevel === option.value"
                :disabled="isReadOnly"
                @change="$emit('transfer-level-card-click', option.value, $event)"
              >
              <label class="transfer-level-card__title" :for="`transfer-level-${option.value}`">
                {{ option.label }}
              </label>
            </div>
            <span
              class="transfer-level-card__marker"
              :class="{ 'is-active': transferLevel === option.value }"
              aria-hidden="true"
            >✓</span>
          </div>
          <p class="transfer-level-card__description mb-0">{{ option.description }}</p>
        </article>
      </div>

      <div
        class="transfer-level-summary"
        :class="{ 'is-complete': isTransferLevelSelected, 'is-incomplete': !isTransferLevelSelected }"
        role="status"
        aria-live="polite"
      >
        <span class="transfer-level-summary__icon" aria-hidden="true">{{ isTransferLevelSelected ? '✓' : 'i' }}</span>
        <span v-if="isTransferLevelSelected">เลือกแล้ว: {{ selectedTransferLevelLabel }}</span>
        <span v-else>กรุณาเลือก 1 ระดับการถ่ายทอดสู่สังคม</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProjectTransferLevelSection',
  props: {
    transferLevelOptions: {
      type: Array,
      default: () => []
    },
    transferLevel: {
      type: String,
      default: ''
    },
    selectedTransferLevelLabel: {
      type: String,
      default: ''
    },
    isTransferLevelSelected: {
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
  }
}
</script>

<style scoped>
.funding-options {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.transfer-level-selector {
  background: #ffffff;
  border: 1px solid #d8e2ef;
  border-radius: 12px;
  padding: 16px;
}

.transfer-level-selector__intro {
  margin-bottom: 10px;
  font-size: 0.82rem;
  color: #64748b;
}

.transfer-level-selector__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.transfer-level-card {
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  background: #fcfdff;
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.transfer-level-card:hover {
  border-color: #9eb4ce;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.transfer-level-card.is-active {
  border-color: #60a5fa;
  background: #eff6ff;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.14), 0 6px 14px rgba(30, 64, 175, 0.08);
  transform: translateY(-1px);
}

.transfer-level-card.is-read-only {
  opacity: 0.92;
}

.transfer-level-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.transfer-level-card__radio-wrap {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.transfer-level-card__radio {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  margin: 0;
  pointer-events: none;
}

.transfer-level-card__title {
  margin: 0;
  font-weight: 700;
  color: #1f2937;
  cursor: pointer;
  line-height: 1.35;
}

.transfer-level-card__description {
  margin-top: 6px;
  font-size: 0.84rem;
  color: #475569;
  line-height: 1.45;
}

.transfer-level-card__marker {
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

.transfer-level-card__marker.is-active {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
}

.transfer-level-summary {
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

.transfer-level-summary.is-complete {
  background: #ecfdf3;
  border-color: #86efac;
  color: #166534;
}

.transfer-level-summary__icon {
  font-size: 0.84rem;
  line-height: 1;
}

.transfer-level-section.is-dark .funding-options {
  background: #1a2432;
  border: 1px solid #2f3f52;
}

.transfer-level-section.is-dark .transfer-level-selector {
  background: #1a2432;
  border-color: #324458;
}

.transfer-level-section.is-dark .transfer-level-selector__intro,
.transfer-level-section.is-dark .transfer-level-card__description {
  color: #aab9ca;
}

.transfer-level-section.is-dark .transfer-level-card {
  background: #202c3a;
  border-color: #35506a;
}

.transfer-level-section.is-dark .transfer-level-card:hover {
  border-color: #557a9d;
  background: #243243;
}

.transfer-level-section.is-dark .transfer-level-card.is-active {
  border-color: #6aa7ff;
  box-shadow: 0 0 0 3px rgba(106, 167, 255, 0.22);
  background: rgba(29, 78, 216, 0.26);
}

.transfer-level-section.is-dark .transfer-level-card__title {
  color: #e6edf7;
}

.transfer-level-section.is-dark .transfer-level-card__marker {
  border-color: #496786;
  background: #223142;
}

.transfer-level-section.is-dark .transfer-level-card__marker.is-active {
  border-color: #7fb6ff;
  background: #4f86db;
}

.transfer-level-section.is-dark .transfer-level-summary.is-complete {
  background: rgba(34, 197, 94, 0.18);
  border-color: rgba(74, 222, 128, 0.4);
  color: #bbf7d0;
}

.transfer-level-section.is-dark .transfer-level-summary.is-incomplete {
  background: rgba(30, 41, 59, 0.72);
  border-color: #3b5168;
  color: #cbd5e1;
}

@media (max-width: 768px) {
  .transfer-level-selector {
    padding: 12px;
  }
  .transfer-level-summary {
    width: 100%;
  }
}
</style>
