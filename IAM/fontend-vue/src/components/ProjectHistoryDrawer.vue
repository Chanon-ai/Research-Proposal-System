<template>
  <div>
    <div class="phd-overlay" @click="close" />
    <div class="phd-drawer">
      <div class="phd-header">
        <h3>ประวัติโครงการ</h3>
        <button class="phd-close" @click="close">✕</button>
      </div>

      <div class="phd-body">
        <div v-for="proj in projectHistory" :key="proj.code" class="phd-item">
          <div class="phd-left">
            <div class="phd-code">{{ proj.code }}</div>
            <div class="phd-title">{{ proj.title }}</div>
            <div class="phd-date">ยื่น {{ proj.date }}</div>
          </div>
          <div class="phd-right">
            <span class="phd-badge" :class="proj.statusClass">{{ proj.status }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProjectHistoryDrawer',
  data() {
    return {
      projectHistory: [
        { code: 'RS-2568-000123', title: 'การพัฒนา AI เพื่อการเกษตร',   date: '15 ก.พ. 69', status: 'รอดำเนินการ',  statusClass: 's-waiting' },
        { code: 'RS-2568-000122', title: 'ระบบจัดการขยะอัจฉริยะ',        date: '10 ก.พ. 69', status: 'รอแก้ไข',       statusClass: 's-fix' },
        { code: 'RS-2568-000120', title: 'ระบบจัดการขยะอัจฉริยะ v2',     date: '7 ก.พ. 69',  status: 'อนุมัติ',       statusClass: 's-approved' },
        { code: 'RS-2568-000116', title: 'ระบบจัดการขยะอัจฉริยะ v1',     date: '27 ม.ค. 69', status: 'ไม่อนุมัติ',    statusClass: 's-rejected' },
        { code: 'RS-2568-000113', title: 'นวัตกรรมพลังงานสะอาด',          date: '20 ม.ค. 69', status: 'อนุมัติ',       statusClass: 's-approved' },
        { code: 'RS-2568-000110', title: 'การศึกษาระบบนิเวศป่าไม้',       date: '10 ม.ค. 69', status: 'กำลังพิจารณา', statusClass: 's-reviewing' },
      ],
    }
  },
  methods: {
    close() {
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.phd-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 1200;
}
.phd-drawer {
  position: fixed; top: 0; right: 0; height: 100vh; width: 420px;
  background: #fff; z-index: 1201; box-shadow: -20px 0 40px rgba(0,0,0,0.08);
  display: flex; flex-direction: column;
}
.phd-header { display:flex; align-items:center; justify-content:space-between; padding:18px 20px; border-bottom:1px solid #eee; }
.phd-header h3 { margin:0; font-size:18px }
.phd-close { background:none; border:none; font-size:18px; cursor:pointer }
.phd-body { padding:16px; overflow:auto }
.phd-item { display:flex; align-items:flex-start; justify-content:space-between; padding:12px 8px; border-bottom:1px solid #f3f4f6 }
.phd-code { font-weight:700; color:#0f172a }
.phd-title { color:#111827; margin-top:6px }
.phd-date { color:#6b7280; font-size:13px; margin-top:6px }
.phd-badge { padding:6px 10px; border-radius:18px; font-weight:600 }
.s-waiting { background:#fef3c7; color:#92400e }
.s-fix { background:#fff7ed; color:#92400e }
.s-approved { background:#dcfce7; color:#166534 }
.s-rejected { background:#fee2e2; color:#7f1d1d }
.s-reviewing { background:#e0f2fe; color:#0369a1 }
</style>
