<template>
  <transition name="budget-floating-fade">
    <aside
      v-if="visible"
      class="budget-floating-summary"
      :class="{ 'is-collapsed': !isExpanded, 'is-dark': isDark }"
      :style="overlayStyle"
    >
      <transition :name="toggleTransitionName" mode="out-in">
        <CCard
          v-if="isExpanded"
          key="budget-expanded-card"
          class="border-0 shadow-sm budget-floating-summary-card"
          style="background-color: #f8f9fa;"
        >
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
              <CIcon :name="isMobileViewport ? 'cil-chevron-bottom' : 'cil-x'" />
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
          <div v-if="normalizedSummary.checklistItems.length" class="budget-summary-checklist">
            <div class="budget-summary-checklist-header">
              <div class="budget-summary-checklist-title">Checklist ข้อมูลที่ต้องกรอก</div>
              <button
                type="button"
                class="budget-summary-checklist-toggle"
                :title="isChecklistExpanded ? 'ยุบ Checklist' : 'กาง Checklist'"
                :aria-label="isChecklistExpanded ? 'ยุบ Checklist' : 'กาง Checklist'"
                @click="toggleChecklistExpanded"
              >
                <CIcon :name="isChecklistExpanded ? 'cil-chevron-top' : 'cil-chevron-bottom'" />
              </button>
            </div>
            <ul v-show="isChecklistExpanded" class="budget-summary-checklist-list">
              <li
                v-for="item in normalizedSummary.checklistItems"
                :key="item.key"
                class="budget-summary-checklist-item"
              >
                <span class="budget-summary-checklist-label">{{ item.label }}</span>
                <CIcon
                  :name="item.ok ? 'cil-check-circle' : 'cil-x-circle'"
                  :class="item.ok ? 'text-success' : 'text-danger'"
                />
              </li>
            </ul>
          </div>
        </CCardBody>
      </CCard>
      <div
        v-else
        key="budget-collapsed-compact"
        class="budget-floating-summary-compact"
      >
        <div class="budget-floating-summary-compact-content">
          <span class="budget-floating-summary-compact-item">
            ใช้ไป {{ formatNumber(normalizedSummary.grandTotal) }}
          </span>
          <span class="budget-floating-summary-compact-sep">|</span>
          <span class="budget-floating-summary-compact-item">
            เหลือ {{ formatNumber(Math.abs(normalizedSummary.summaryRemainingAmount)) }}
          </span>
          <span class="budget-floating-summary-compact-sep">|</span>
          <span class="budget-floating-summary-compact-item">
            งบรวม {{ formatNumber(normalizedSummary.summaryTotalBudget) }}
          </span>
          <span class="budget-floating-summary-compact-sep">|</span>
          <span
            class="budget-floating-summary-compact-status"
            :class="normalizedSummary.statusClass"
          >
            {{ compactStatusEmoji }} {{ compactStatusText }}
          </span>
        </div>
        <button
          type="button"
          class="budget-floating-summary-compact-toggle"
          title="Expand budget summary"
          aria-label="Expand budget summary"
          @click="expandFromIcon"
        >
          <span class="budget-floating-summary-compact-caret">^</span>
        </button>
      </div>
      </transition>
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
      isExpanded: true,
      isChecklistExpanded: true,
      isMobileViewport: false,
      viewportHeight: 0,
      viewportWidth: 0,
      footerFixedHeight: 0
    }
  },
  mounted() {
    this.syncViewportMode()
    this.$nextTick(() => {
      this.refreshFooterHeight()
    })
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('resize', this.syncViewportMode, { passive: true })
      window.addEventListener('orientationchange', this.syncViewportMode, { passive: true })
    }
  },
  beforeDestroy() {
    if (typeof window !== 'undefined' && window.removeEventListener) {
      window.removeEventListener('resize', this.syncViewportMode)
      window.removeEventListener('orientationchange', this.syncViewportMode)
    }
  },
  computed: {
    overlayStyle() {
      const defaultDesktopTop = Number(this.top || 82)
      const viewportHeight = Number(this.viewportHeight || 0)
      const viewportWidth = Number(this.viewportWidth || 0)
      const isSmallMobile = viewportWidth > 0 && viewportWidth <= 575.98
      const mobileBaseOffset = isSmallMobile ? 70 : 74
      const measuredFooterOffset = this.footerFixedHeight > 0 ? this.footerFixedHeight + 10 : 0
      const mobileBottomOffset = Math.max(mobileBaseOffset, measuredFooterOffset)

      if (this.isMobileViewport) {
        const mobileMaxHeight = viewportHeight > 0
          ? Math.max(0, viewportHeight - mobileBottomOffset - 10)
          : 520
        const mobileBodyMaxHeight = viewportHeight > 0
          ? Math.max(0, mobileMaxHeight - 108)
          : 412
        return {
          bottom: `calc(${mobileBottomOffset}px + env(safe-area-inset-bottom, 0px))`,
          '--budget-overlay-max-height': `${mobileMaxHeight}px`,
          '--budget-overlay-body-max-height': `${mobileBodyMaxHeight}px`
        }
      }

      const desktopBottomBaseOffset = 24
      const desktopExtraBottomMargin = viewportHeight > 0 && viewportHeight <= 620 ? 18 : 10
      const desktopBottomOffset = Math.max(
        desktopBottomBaseOffset,
        measuredFooterOffset > 0 ? measuredFooterOffset + desktopExtraBottomMargin : 0
      )
      const desktopMaxHeight = viewportHeight > 0
        ? Math.max(0, viewportHeight - defaultDesktopTop - desktopBottomOffset)
        : 640
      const desktopBodyMaxHeight = viewportHeight > 0
        ? Math.max(0, desktopMaxHeight - 112)
        : 528
      return {
        top: `${defaultDesktopTop}px`,
        '--budget-overlay-max-height': `${desktopMaxHeight}px`,
        '--budget-overlay-body-max-height': `${desktopBodyMaxHeight}px`
      }
    },
    toggleTransitionName() {
      return this.isMobileViewport ? 'budget-mobile-toggle-slide' : 'budget-panel-fade'
    },
    compactStatusText() {
      if (this.normalizedSummary.pillClass === 'is-empty') return 'ยังไม่มีข้อมูล'
      return this.normalizedSummary.pillClass === 'is-valid' ? 'ถูกต้อง' : 'ไม่ถูกต้อง'
    },
    compactStatusEmoji() {
      if (this.normalizedSummary.pillClass === 'is-empty') return '\u26AA'
      return this.normalizedSummary.pillClass === 'is-valid' ? '\uD83D\uDFE2' : '\uD83D\uDD34'
    },
    normalizedSummary() {
      const src = this.summary && typeof this.summary === 'object' ? this.summary : {}
      const details = Array.isArray(src.budgetSummaryFeedbackDetails) ? src.budgetSummaryFeedbackDetails : []
      const checklistItems = Array.isArray(src.checklistItems)
        ? src.checklistItems.map(item => ({
          key: String(item && item.key ? item.key : ''),
          label: String(item && item.label ? item.label : '-'),
          ok: Boolean(item && item.ok)
        }))
        : []
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
        feedbackDetails: details,
        checklistItems
      }
    }
  },
  methods: {
    syncViewportMode() {
      if (typeof window === 'undefined') return
      this.viewportHeight = window.innerHeight || 0
      this.viewportWidth = window.innerWidth || 0
      this.isMobileViewport = window.innerWidth <= 991.98
      this.refreshFooterHeight()
    },
    refreshFooterHeight() {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        this.footerFixedHeight = 0
        return
      }
      const footers = Array.from(document.querySelectorAll('.footer-fixed'))
      let maxHeight = 0
      footers.forEach((footerEl) => {
        const style = window.getComputedStyle(footerEl)
        if (style.display === 'none' || style.visibility === 'hidden') return
        const rect = footerEl.getBoundingClientRect()
        if (!rect || rect.height <= 0) return
        maxHeight = Math.max(maxHeight, Math.ceil(rect.height))
      })
      this.footerFixedHeight = maxHeight
    },
    collapseToIcon() {
      this.isExpanded = false
    },
    expandFromIcon() {
      this.isExpanded = true
    },
    toggleChecklistExpanded() {
      this.isChecklistExpanded = !this.isChecklistExpanded
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
  z-index: 1005;
  pointer-events: none;
  max-height: var(--budget-overlay-max-height, calc(100vh - 24px));
}

.budget-floating-summary.is-collapsed {
  width: min(620px, calc(100vw - 30px));
}

.budget-floating-summary-card {
  border: 2px solid #8b1212 !important;
  border-radius: 14px !important;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.2), 0 4px 12px rgba(139, 18, 18, 0.18);
  pointer-events: auto;
  max-height: var(--budget-overlay-max-height, calc(100vh - 24px));
}

.budget-floating-summary-card .card-body {
  overflow-y: auto;
  max-height: var(--budget-overlay-body-max-height, calc(100vh - 120px));
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

.budget-floating-summary-compact {
  width: 100%;
  border: 2px solid #8b1212;
  border-radius: 12px;
  background: #f8f9fa;
  color: #1f2937;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(139, 18, 18, 0.14);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  font-size: 0.82rem;
  font-weight: 700;
  pointer-events: auto;
}

.budget-floating-summary-compact-content {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1 1 auto;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.budget-floating-summary-compact-content::-webkit-scrollbar {
  height: 4px;
}

.budget-floating-summary-compact-item {
  color: #1f2937;
  flex: 0 0 auto;
}

.budget-floating-summary-compact-sep {
  color: #94a3b8;
  flex: 0 0 auto;
}

.budget-floating-summary-compact-status {
  flex: 0 0 auto;
}

.budget-floating-summary-compact-toggle {
  border: 1px solid #d9e2ec;
  border-radius: 999px;
  background: #ffffff;
  color: #334155;
  font-weight: 700;
  font-size: 0.72rem;
  line-height: 1;
  height: 30px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  flex: 0 0 auto;
}

.budget-floating-summary-compact-toggle .c-icon {
  width: 0.82rem;
  height: 0.82rem;
}

.budget-floating-summary-compact-caret {
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
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

.budget-summary-checklist {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #d7dee7;
}

.budget-summary-checklist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.budget-summary-checklist-title {
  font-size: 0.86rem;
  font-weight: 700;
  color: #475569;
}

.budget-summary-checklist-toggle {
  border: 1px solid #d9e2ec;
  background: #ffffff;
  color: #334155;
  border-radius: 6px;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.budget-summary-checklist-toggle .c-icon {
  width: 0.78rem;
  height: 0.78rem;
}

.budget-summary-checklist-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 210px;
  overflow-y: auto;
}

.budget-summary-checklist-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.82rem;
  line-height: 1.35;
  padding: 3px 0;
}

.budget-summary-checklist-label {
  color: #1f2937;
  padding-right: 8px;
}

.budget-summary-checklist-item .c-icon {
  flex: 0 0 auto;
}

.budget-panel-fade-enter-active,
.budget-panel-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.2s ease;
}

.budget-panel-fade-enter,
.budget-panel-fade-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.99);
}

.budget-mobile-toggle-slide-enter-active,
.budget-mobile-toggle-slide-leave-active {
  transition: opacity 0.22s ease, transform 0.26s cubic-bezier(0.22, 1, 0.36, 1);
}

.budget-mobile-toggle-slide-enter,
.budget-mobile-toggle-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
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

@media (max-width: 1199.98px) {
  .budget-floating-summary {
    right: 12px;
    width: min(380px, calc(100vw - 24px));
  }
}

@media (max-width: 991.98px) {
  .budget-floating-summary {
    top: auto !important;
    right: 10px;
    bottom: calc(74px + env(safe-area-inset-bottom, 0px));
    left: 10px;
    width: auto;
    z-index: 1005;
  }

  .budget-floating-summary.is-collapsed {
    left: 10px;
    right: 10px;
    width: auto;
  }

  .budget-floating-summary-card {
    border-radius: 12px !important;
  }

  .budget-floating-summary-compact {
    border-radius: 11px;
    padding: 9px 11px;
    font-size: 0.78rem;
    gap: 7px;
  }

  .budget-floating-summary-compact-content {
    gap: 7px;
  }

  .budget-floating-summary-compact-toggle {
    height: 28px;
    padding: 0 9px;
    font-size: 0.68rem;
  }

  .budget-summary-stat-grid {
    gap: 8px;
  }

  .budget-summary-stat-item {
    min-height: 0;
  }

  .budget-summary-stat-value {
    font-size: 1.3rem;
  }
}

@media (max-width: 575.98px) {
  .budget-floating-summary {
    right: 8px;
    bottom: calc(70px + env(safe-area-inset-bottom, 0px));
    left: 8px;
    width: auto;
  }

  .budget-floating-summary.is-collapsed {
    left: 8px;
    right: 8px;
    width: auto;
  }

  .budget-floating-summary-header {
    padding: 8px 10px;
  }

  .budget-floating-summary-title {
    font-size: 0.8rem;
  }

  .budget-floating-summary-status-pill {
    font-size: 0.66rem;
    padding: 1px 6px;
  }

  .budget-floating-summary-action {
    font-size: 0.72rem;
    line-height: 1.2;
    padding: 0.2rem 0.4rem !important;
  }

  .budget-floating-summary-compact {
    padding: 8px 10px;
    border-radius: 10px;
    font-size: 0.72rem;
    gap: 6px;
  }

  .budget-floating-summary-compact-content {
    gap: 6px;
  }

  .budget-floating-summary-compact-toggle {
    height: 26px;
    padding: 0 8px;
    font-size: 0.64rem;
    gap: 3px;
  }

  .budget-floating-summary-compact-toggle .c-icon {
    width: 0.72rem;
    height: 0.72rem;
  }

  .budget-floating-summary-card .budget-summary-stat-item {
    padding: 6px;
    border-radius: 8px;
  }

  .budget-summary-stat-label {
    font-size: 0.7rem;
    margin-bottom: 2px;
  }

  .budget-summary-stat-value {
    font-size: 1.08rem;
  }

  .budget-summary-stat-meta {
    font-size: 0.74rem;
  }

  .budget-summary-separator {
    margin: 10px 0;
  }

  .budget-summary-period-row {
    gap: 6px;
  }

  .budget-summary-period-label {
    min-width: 38px;
    font-size: 0.82rem;
  }

  .budget-summary-period-bar {
    height: 10px;
  }

  .budget-summary-period-amount {
    min-width: 64px;
    font-size: 0.9rem;
  }

  .budget-summary-status {
    margin-top: 8px;
    font-size: 0.84rem;
    gap: 6px;
  }

  .budget-summary-feedback-list {
    margin-top: 6px;
    padding-left: 16px;
    font-size: 0.78rem;
    line-height: 1.4;
  }

  .budget-summary-checklist {
    margin-top: 8px;
    padding-top: 8px;
  }

  .budget-summary-checklist-title {
    font-size: 0.78rem;
  }

  .budget-summary-checklist-list {
    max-height: 148px;
  }

  .budget-summary-checklist-item {
    font-size: 0.76rem;
    padding: 2px 0;
  }

  .budget-floating-summary-icon-only {
    width: 46px;
    height: 46px;
    border-radius: 12px;
  }
}

@media (max-width: 991.98px) and (max-height: 760px) {
  .budget-floating-summary-card .card-body {
    padding: 0.7rem !important;
  }

  .budget-summary-stat-grid {
    gap: 6px;
  }

  .budget-summary-stat-label {
    font-size: 0.68rem;
    margin-bottom: 1px;
  }

  .budget-summary-stat-value {
    font-size: 1rem;
    line-height: 1.1;
  }

  .budget-summary-stat-meta {
    font-size: 0.7rem;
  }

  .budget-summary-period-row {
    gap: 5px;
  }

  .budget-summary-period-label {
    min-width: 34px;
    font-size: 0.76rem;
  }

  .budget-summary-period-amount {
    min-width: 58px;
    font-size: 0.84rem;
  }

  .budget-summary-status {
    margin-top: 6px;
    font-size: 0.78rem;
    gap: 5px;
  }

  .budget-summary-checklist-list {
    max-height: 100px;
  }
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

.budget-floating-summary.is-dark .budget-floating-summary-compact {
  background: #223142;
  color: #d6e2f0;
  border-color: #33475c;
}

.budget-floating-summary.is-dark .budget-floating-summary-compact-item {
  color: #d6e2f0;
}

.budget-floating-summary.is-dark .budget-floating-summary-compact-sep {
  color: #8ba0b8;
}

.budget-floating-summary.is-dark .budget-floating-summary-compact-toggle {
  background: #223142;
  color: #d6e2f0;
  border-color: #3c4e63;
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

.budget-floating-summary.is-dark .budget-summary-checklist {
  border-top-color: #33475c;
}

.budget-floating-summary.is-dark .budget-summary-checklist-title,
.budget-floating-summary.is-dark .budget-summary-checklist-label {
  color: #d6e2f0;
}

.budget-floating-summary.is-dark .budget-summary-checklist-toggle {
  background: #223142;
  color: #d6e2f0;
  border-color: #3c4e63;
}

.budget-floating-summary.is-dark .budget-summary-separator {
  border-top-color: #33475c;
}
</style>
