<template>
  <transition name="budget-floating-fade">
    <aside
      v-if="visible"
      class="budget-floating-summary"
      :class="{ 'is-collapsed': !isExpanded, 'is-dark': isDark }"
      :style="{ top: `${top}px` }"
    >
      <CCard v-if="isExpanded" class="border-0 shadow-sm budget-floating-summary-card" style="background-color: #f8f9fa;">
        <CCardHeader class="budget-floating-summary-header d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center">
            <span class="budget-floating-summary-title">สรุปงบประมาณ</span>
            <span class="budget-floating-summary-status-pill ml-2" :class="normalizedSummary.pillClass">
              {{ normalizedSummary.pillLabel }}
            </span>
          </div>
          <div class="d-flex align-items-center" style="gap: 6px;">
            <CButton
              v-if="normalizedSummary.canJumpToError"
              size="sm"
              color="light"
              class="budget-floating-summary-action"
              @click="$emit('jump-to-error')"
            >
              ไปจุดผิด
            </CButton>
            <CButton
              size="sm"
              color="light"
              class="budget-floating-summary-action"
              title="ย่อสรุปงบ"
              @click="collapseToIcon"
            >
              <CIcon name="cil-x" />
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody class="p-3">
          <div class="budget-summary-stat-grid">
            <div class="budget-summary-stat-item is-used">
              <div class="budget-summary-stat-label">[ ใช้ไปแล้ว ]</div>
              <div class="budget-summary-stat-value text-danger">{{ formatNumber(normalizedSummary.grandTotal) }}</div>
              <div class="budget-summary-stat-meta" :class="normalizedSummary.hasBudgetLimit ? 'text-muted' : 'text-transparent'">
                ({{ normalizedSummary.budgetUsedPercent }}%)
              </div>
            </div>
            <div class="budget-summary-stat-item is-remaining">
              <div class="budget-summary-stat-label">[ คงเหลือ ]</div>
              <div
                class="budget-summary-stat-value"
                :class="normalizedSummary.summaryRemainingAmount >= 0 ? 'text-success' : 'text-danger'"
              >
                {{ formatNumber(Math.abs(normalizedSummary.summaryRemainingAmount)) }}
              </div>
              <div class="budget-summary-stat-meta" :class="normalizedSummary.hasBudgetLimit ? 'text-muted' : 'text-transparent'">
                ({{ normalizedSummary.budgetRemainingPercent }}%)
              </div>
            </div>
            <div class="budget-summary-stat-item is-total">
              <div class="budget-summary-stat-label">[ งบรวม ]</div>
              <div class="budget-summary-stat-value text-dark">{{ formatNumber(normalizedSummary.summaryTotalBudget) }}</div>
              <div class="budget-summary-stat-meta text-transparent">(0%)</div>
            </div>
          </div>

          <div class="budget-summary-separator"></div>

          <div class="budget-summary-period-list">
            <div class="budget-summary-period-row">
              <span class="budget-summary-period-label">งวด 1</span>
              <div class="budget-summary-period-bar">
                <span
                  class="budget-summary-period-fill"
                  :class="normalizedSummary.isPeriod1Valid ? 'is-valid' : 'is-invalid'"
                  :style="{ width: `${normalizedSummary.period1BarWidth}%` }"
                ></span>
              </div>
              <strong class="budget-summary-period-amount">{{ formatNumber(normalizedSummary.totalPeriod1) }}</strong>
              <span class="budget-summary-period-mark">
                <CIcon
                  :name="normalizedSummary.isPeriod1Valid ? 'cil-check-circle' : 'cil-x-circle'"
                  :class="normalizedSummary.isPeriod1Valid ? 'text-success' : 'text-danger'"
                />
              </span>
            </div>
            <div class="budget-summary-period-row">
              <span class="budget-summary-period-label">งวด 2</span>
              <div class="budget-summary-period-bar">
                <span
                  class="budget-summary-period-fill"
                  :class="normalizedSummary.isPeriod2Valid ? 'is-valid' : 'is-invalid'"
                  :style="{ width: `${normalizedSummary.period2BarWidth}%` }"
                ></span>
              </div>
              <strong class="budget-summary-period-amount">{{ formatNumber(normalizedSummary.totalPeriod2) }}</strong>
              <span class="budget-summary-period-mark">
                <CIcon
                  :name="normalizedSummary.isPeriod2Valid ? 'cil-check-circle' : 'cil-x-circle'"
                  :class="normalizedSummary.isPeriod2Valid ? 'text-success' : 'text-danger'"
                />
              </span>
            </div>
            <div class="budget-summary-period-row">
              <span class="budget-summary-period-label">งวด 3</span>
              <div class="budget-summary-period-bar">
                <span
                  class="budget-summary-period-fill"
                  :class="normalizedSummary.isPeriod3Valid ? 'is-valid' : 'is-invalid'"
                  :style="{ width: `${normalizedSummary.period3BarWidth}%` }"
                ></span>
              </div>
              <strong class="budget-summary-period-amount">{{ formatNumber(normalizedSummary.totalPeriod3) }}</strong>
              <span class="budget-summary-period-mark">
                <CIcon
                  :name="normalizedSummary.isPeriod3Valid ? 'cil-check-circle' : 'cil-x-circle'"
                  :class="normalizedSummary.isPeriod3Valid ? 'text-success' : 'text-danger'"
                />
              </span>
            </div>
          </div>

          <div class="budget-summary-status" :class="normalizedSummary.statusClass">
            <span class="budget-summary-status-dot" aria-hidden="true"></span>
            <span>{{ normalizedSummary.statusText }}</span>
          </div>
          <ul v-if="normalizedSummary.feedbackDetails.length" class="budget-summary-feedback-list">
            <li v-for="(detail, detailIndex) in normalizedSummary.feedbackDetails" :key="`budget-overlay-feedback-${detailIndex}`">
              {{ detail }}
            </li>
          </ul>
        </CCardBody>
      </CCard>

      <button
        v-else
        type="button"
        class="budget-floating-summary-icon-only"
        title="แสดงสรุปงบประมาณ"
        aria-label="แสดงสรุปงบประมาณ"
        @click="expandFromIcon"
      >
        <CIcon name="cil-notes" />
      </button>
    </aside>
  </transition>
</template>

<script>
export default {
  name: 'BudgetStickyOverlay',
  props: {
    visible: {
      type: Boolean,
      default: true
    },
    top: {
      type: Number,
      default: 82
    },
    isDark: {
      type: Boolean,
      default: false
    },
    summary: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      isExpanded: true
    }
  },
  computed: {
    normalizedSummary() {
      const src = this.summary && typeof this.summary === 'object' ? this.summary : {}
      const details = Array.isArray(src.budgetSummaryFeedbackDetails) ? src.budgetSummaryFeedbackDetails : []
      return {
        grandTotal: Number(src.grandTotal || 0),
        summaryRemainingAmount: Number(src.summaryRemainingAmount || 0),
        summaryTotalBudget: Number(src.summaryTotalBudget || 0),
        hasBudgetLimit: Boolean(src.hasBudgetLimit),
        budgetUsedPercent: Number(src.budgetUsedPercent || 0),
        budgetRemainingPercent: Number(src.budgetRemainingPercent || 0),
        period1BarWidth: Number(src.period1BarWidth || 0),
        period2BarWidth: Number(src.period2BarWidth || 0),
        period3BarWidth: Number(src.period3BarWidth || 0),
        totalPeriod1: Number(src.totalPeriod1 || 0),
        totalPeriod2: Number(src.totalPeriod2 || 0),
        totalPeriod3: Number(src.totalPeriod3 || 0),
        isPeriod1Valid: Boolean(src.isPeriod1Valid),
        isPeriod2Valid: Boolean(src.isPeriod2Valid),
        isPeriod3Valid: Boolean(src.isPeriod3Valid),
        canJumpToError: Boolean(src.canJumpToError),
        pillClass: String(src.budgetSummaryStatePillClass || 'is-empty'),
        pillLabel: String(src.budgetSummaryPillLabel || 'ยังไม่มีข้อมูล'),
        statusClass: String(src.budgetSummaryStatusClass || 'text-muted'),
        statusText: String(src.budgetSummaryStatusText || 'ยังไม่มีข้อมูล'),
        feedbackDetails: details
      }
    }
  },
  methods: {
    collapseToIcon() {
      this.isExpanded = false
    },
    expandFromIcon() {
      this.isExpanded = true
    },
    formatNumber(num) {
      return Number(num || 0).toLocaleString('th-TH')
    }
  }
}
</script>

<style scoped>
.budget-floating-summary {
  position: fixed;
  right: 18px;
  width: min(420px, calc(100vw - 30px));
  z-index: 220;
  pointer-events: none;
}

.budget-floating-summary.is-collapsed {
  width: 54px;
}

.budget-floating-summary-card {
  border: 2px solid #8b1212 !important;
  border-radius: 14px !important;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.2), 0 4px 12px rgba(139, 18, 18, 0.18);
  pointer-events: auto;
}

.budget-floating-summary-header {
  border-bottom: 1px solid #e4e8ef;
  background: #f8fafc;
  padding: 10px 12px;
}

.budget-floating-summary-title {
  font-size: 0.88rem;
  font-weight: 800;
  color: #111827;
}

.budget-floating-summary-status-pill {
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 2px 7px;
}

.budget-floating-summary-status-pill.is-valid {
  color: #166534;
  background: #dcfce7;
}

.budget-floating-summary-status-pill.is-invalid {
  color: #991b1b;
  background: #fee2e2;
}

.budget-floating-summary-status-pill.is-empty {
  color: #475569;
  background: #e2e8f0;
}

.budget-floating-summary-action {
  border: 1px solid #d9e2ec !important;
  color: #334155 !important;
  font-weight: 700;
}

.budget-floating-summary-icon-only {
  width: 54px;
  height: 54px;
  border: 2px solid #8b1212;
  border-radius: 14px;
  background: #f8f9fa;
  color: #8b1212;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.2), 0 4px 12px rgba(139, 18, 18, 0.18);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.2s ease;
}

.budget-floating-summary-icon-only:hover {
  transform: translateY(-1px);
}

.budget-floating-summary-icon-only .c-icon {
  width: 1.12rem;
  height: 1.12rem;
}

.budget-floating-summary-card .budget-summary-stat-item {
  padding: 8px 10px;
  min-height: 92px;
}

.budget-summary-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.budget-summary-stat-item {
  background-color: #ffffff;
  border: 1px solid #d7dee7;
  border-radius: 10px;
}

.budget-summary-stat-label {
  font-size: 0.84rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 4px;
}

.budget-summary-stat-value {
  font-size: 1.62rem;
  line-height: 1.15;
  font-weight: 800;
  color: #1f2937;
  white-space: nowrap;
  word-break: keep-all;
  overflow-wrap: normal;
}

.budget-summary-stat-meta {
  font-size: 0.86rem;
  line-height: 1.2;
  font-weight: 600;
  color: #64748b;
  margin-top: 2px;
}

.text-transparent {
  color: transparent !important;
}

.budget-summary-separator {
  border-top: 1px solid #d7dee7;
  margin: 14px 0;
}

.budget-summary-period-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.budget-summary-period-row {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 9px;
}

.budget-summary-period-label {
  min-width: 48px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #334155;
}

.budget-summary-period-bar {
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
  background: #e2e8f0;
}

.budget-summary-period-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition: width 0.2s ease;
}

.budget-summary-period-fill.is-valid {
  background: #16a34a;
}

.budget-summary-period-fill.is-invalid {
  background: #dc2626;
}

.budget-summary-period-amount {
  min-width: 78px;
  text-align: right;
  font-size: 1.04rem;
  line-height: 1.2;
}

.budget-summary-period-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.budget-summary-period-mark .c-icon {
  width: 1.06rem;
  height: 1.06rem;
}

.budget-summary-status {
  margin-top: 10px;
  font-size: 0.98rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.budget-summary-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: currentColor;
  flex: 0 0 10px;
}

.budget-summary-feedback-list {
  margin: 8px 0 0;
  padding-left: 20px;
  color: #b91c1c;
  font-size: 0.88rem;
  line-height: 1.5;
}

.budget-floating-fade-enter-active,
.budget-floating-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.22s ease;
}

.budget-floating-fade-enter,
.budget-floating-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

.budget-floating-summary.is-dark .budget-floating-summary-card {
  border-color: #33475c !important;
}

.budget-floating-summary.is-dark .budget-floating-summary-header {
  background: #243548;
  border-bottom-color: #33475c;
}

.budget-floating-summary.is-dark .budget-floating-summary-title {
  color: #d6e2f0;
}

.budget-floating-summary.is-dark .budget-floating-summary-action {
  background: #223142 !important;
  color: #d6e2f0 !important;
  border-color: #3c4e63 !important;
}

.budget-floating-summary.is-dark .budget-floating-summary-status-pill.is-empty {
  color: #d6e2f0;
  background: #33475c;
}

.budget-floating-summary.is-dark .budget-floating-summary-icon-only {
  background: #223142;
  color: #d6e2f0;
  border-color: #33475c;
}

.budget-floating-summary.is-dark .budget-summary-stat-item {
  background: #223142;
  border-color: #3c4e63;
}

.budget-floating-summary.is-dark .budget-summary-stat-label {
  color: #d6e2f0;
}

.budget-floating-summary.is-dark .budget-summary-stat-value {
  color: #edf4fc;
}

.budget-floating-summary.is-dark .budget-summary-stat-meta {
  color: #9fb1c6;
}

.budget-floating-summary.is-dark .budget-summary-period-label,
.budget-floating-summary.is-dark .budget-summary-period-amount {
  color: #d6e2f0;
}

.budget-floating-summary.is-dark .budget-summary-period-bar {
  background: #33475c;
}

.budget-floating-summary.is-dark .budget-summary-feedback-list {
  color: #fecaca;
}

.budget-floating-summary.is-dark .budget-summary-separator {
  border-top-color: #33475c;
}
</style>
