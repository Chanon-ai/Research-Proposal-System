<template>
  <span :class="badgeClass">
    {{ statusLabel }}
  </span>
</template>

<script>
import {
  PROPOSAL_STATUS_ALIASES,
  PROPOSAL_STATUS_COLORS_COREUI_BADGE,
  PROPOSAL_STATUS_LABELS_TH_BADGE,
  normalizeProposalStatus
} from '@/ResearchFormRS/constants/proposalWorkflow'

export default {
  name: "StatusBadge",

  props: {
    status: {
      type: String,
      required: true
    },
    role: {
      type: String,
      default: "researcher"
    }
  },

  computed: {
    normalizedStatus() {
      const raw = normalizeProposalStatus(this.status)
      return PROPOSAL_STATUS_ALIASES[raw] || raw
    },

    statusLabel() {
      // Currently all roles share the same human-friendly labels.
      // Keep `role` prop for compatibility with existing callers.
      return PROPOSAL_STATUS_LABELS_TH_BADGE[this.normalizedStatus] || this.normalizedStatus || '-'
    },

    badgeClass() {
      const color = PROPOSAL_STATUS_COLORS_COREUI_BADGE[this.normalizedStatus] || "secondary"
      return `badge badge-${color}`
    }
  }
}
</script>

<style scoped>
.badge {
  font-size: 0.85rem;
  padding: 6px 10px;
}
</style>
