<template>
  <span :class="badgeClass">
    {{ statusLabel }}
  </span>
</template>

<script>
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

  data() {
    return {
      STATUS_LABEL: {
        researcher: {
          draft: "ร่างเอกสาร",
          submitted: "ส่งเอกสารแล้ว",
          admin_review: "เจ้าหน้าที่กำลังตรวจสอบ",
          committee_review: "อยู่ระหว่างพิจารณา",
          revision_required: "ต้องแก้ไข",
          resubmitted: "ส่งเอกสารแก้ไขแล้ว",
          approved: "อนุมัติแล้ว"
        },

        reviewer: {
          committee_review: "รอพิจารณา",
          revision_required: "เสนอให้แก้ไข",
          resubmitted: "รอตรวจเอกสารแก้ไข",
          approved: "พิจารณาเสร็จสิ้น"
        },

        admin: {
          draft: "Draft",
          submitted: "Submitted",
          admin_review: "Admin reviewing",
          committee_review: "Committee reviewing",
          revision_required: "Need revision",
          resubmitted: "Resubmitted",
          approved: "Approved"
        }
      },

      STATUS_COLOR: {
        draft: "secondary",
        submitted: "primary",
        admin_review: "info",
        committee_review: "warning",
        revision_required: "danger",
        resubmitted: "primary",
        approved: "success"
      }
    }
  },

  computed: {
    statusLabel() {
      const roleMap = this.STATUS_LABEL[this.role] || {}
      return roleMap[this.status] || this.status
    },

    badgeClass() {
      const color = this.STATUS_COLOR[this.status] || "secondary"
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