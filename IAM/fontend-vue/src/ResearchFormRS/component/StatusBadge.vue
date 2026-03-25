<template>
  <span :class="badgeClass">
    {{ statusLabel }}
  </span>
</template>

<script>
const STATUS_ALIASES = {
  admin_review: 'document_checking',
  committee_review: 'under_review',
  revision_required: 'revision_requested'
}

const STATUS_LABELS_TH = {
  draft: 'แบบร่าง',
  pending_confirm: 'รอการยืนยัน',
  submitted: 'ยื่นแล้ว',
  faculty_review_pending: 'รอคณะพิจารณา (คณะ)',
  faculty_approved: 'ผ่านการพิจารณา (คณะ)',
  office_received: 'สำนักงานรับเรื่องแล้ว',
  document_checking: 'ตรวจเอกสาร',
  assigned_to_committee: 'มอบหมายกรรมการแล้ว',
  under_review: 'อยู่ระหว่างการพิจารณา',
  meeting_completed: 'ประชุมเสร็จสิ้น',
  revision_requested: 'ขอแก้ไขเพิ่มเติม',
  resubmitted: 'ส่งใหม่',
  second_round_review: 'รอบพิจารณาครั้งที่ 2',
  approved: 'อนุมัติ',
  rejected: 'ไม่อนุมัติ',
  announced: 'ประกาศผลแล้ว'
}

const STATUS_COLORS = {
  draft: 'secondary',
  pending_confirm: 'secondary',
  submitted: 'info',
  faculty_review_pending: 'warning',
  faculty_approved: 'primary',
  office_received: 'primary',
  document_checking: 'warning',
  assigned_to_committee: 'info',
  under_review: 'warning',
  meeting_completed: 'primary',
  revision_requested: 'danger',
  resubmitted: 'info',
  second_round_review: 'warning',
  approved: 'success',
  rejected: 'danger',
  announced: 'success'
}

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
      const raw = String(this.status || '').trim().toLowerCase()
      return STATUS_ALIASES[raw] || raw
    },

    statusLabel() {
      // Currently all roles share the same human-friendly labels.
      // Keep `role` prop for compatibility with existing callers.
      return STATUS_LABELS_TH[this.normalizedStatus] || this.normalizedStatus || '-'
    },

    badgeClass() {
      const color = STATUS_COLORS[this.normalizedStatus] || "secondary"
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
