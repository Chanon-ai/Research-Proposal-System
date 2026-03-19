<template>
  <div class="app-layout">

      <!-- ───────────── PROFILE PAGE ───────────── -->
      <div class="page-wrapper">
        <div class="profile-container">

          <!-- ── Left card: Avatar + name ── -->
          <div class="profile-left-card">
            <div class="avatar-ring">
              <div class="avatar-circle">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
                  stroke="#4a7c59" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            </div>

            <h2 class="profile-name">{{ profileName }}</h2>
            <p class="profile-role">{{ profileRole }}</p>
            <p class="profile-dept">{{ profileDepartment }}</p>

            <div class="profile-stats">
              <div class="stat-item">
                <span class="stat-num">{{ profileStats.total }}</span>
                <span class="stat-label">โครงการ</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-num">{{ profileStats.approved }}</span>
                <span class="stat-label">อนุมัติ</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-num">{{ profileStats.pending }}</span>
                <span class="stat-label">รอพิจารณา</span>
              </div>
            </div>

            <button class="btn-edit-avatar">เปลี่ยนรูปโปรไฟล์</button>
          </div>

          <!-- ── Right: Info + Edit form ── -->
          <div class="profile-right">

            <!-- Tabs -->
            <div class="profile-tabs-wrap">
              <div class="profile-tabs">
                <button
                  v-for="tab in tabs" :key="tab.key"
                  class="tab-btn"
                  :class="{ active: activeTab === tab.key }"
                  @click="activeTab = tab.key"
                >{{ tab.label }}</button>
              </div>
              
            </div>

            <!-- Tab: ข้อมูลส่วนตัว -->
            <div v-if="activeTab === 'info'" class="tab-content">
              <div class="section-title">ข้อมูลส่วนตัว</div>

              <div class="form-grid">
                <div class="form-group">
                  <label>คำนำหน้า</label>
                  <input v-model="form.prefix" class="form-input" :disabled="!editing" />
                </div>
                <div class="form-group">
                  <label>ชื่อ - นามสกุล</label>
                  <input v-model="form.name" class="form-input" :disabled="!editing" />
                </div>
                <div class="form-group">
                  <label>อีเมล</label>
                  <input v-model="form.email" type="email" class="form-input" :disabled="!editing" />
                </div>
                <div class="form-group">
                  <label>เบอร์โทรศัพท์</label>
                  <input v-model="form.phone" class="form-input" :disabled="!editing" />
                </div>
                <div class="form-group">
                  <label>ตำแหน่ง</label>
                  <input v-model="form.position" class="form-input" :disabled="!editing" />
                </div>
                <div class="form-group">
                  <label>สังกัด / คณะ</label>
                  <input v-model="form.department" class="form-input" :disabled="!editing" />
                </div>
                <div class="form-group full-width">
                  <label>ที่อยู่</label>
                  <textarea v-model="form.address" class="form-input form-textarea" :disabled="!editing" rows="3" />
                </div>
              </div>

              
            </div>

            

            <!-- history moved to drawer component -->

          </div>
        </div>
      </div>

      <!-- Toast -->
      <Transition name="toast">
        <div v-if="toast.show" class="toast-msg" :class="toast.type">
          <svg v-if="toast.type === 'success'" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {{ toast.msg }}
        </div>
      </Transition>
  
  </div>
</template>

<script>
import Service from '@/service/api'

export default {
  name: 'ProfilePage',

  data() {
    return {
      // Layout
      sidebarExpanded: false,
      lang: 'TH',
      currentRoute: '/profile',
      navItems: [
        { icon: 'grid', label: 'โครงการของฉัน',  route: '/projects' },
        { icon: 'bell', label: 'การแจ้งเตือน',    route: '/notifications' },
        { icon: 'file', label: 'รายงาน',           route: '/reports' },
        { icon: 'user', label: 'โปรไฟล์',          route: '/profile' },
      ],

      // Tabs
      activeTab: 'info',
      tabs: [
          { key: 'info',     label: 'ข้อมูลส่วนตัว' },
      ],

      // Profile form
      editing: false,
      profileStats: {
        total: 0,
        approved: 0,
        pending: 0
      },
      form: {
        prefix:     '',
        name:       '',
        email:      '',
        phone:      '',
        position:   '',
        department: '',
        address:    '',
      },
      formBackup: null,

      

      // Toast
      toast: { show: false, msg: '', type: 'success' },

      
    }
  },

  async mounted () {
    await this.fetchProfile()
    await this.fetchProfileStats()
  },

  computed: {
    profileName () {
      return this.form.name || '-'
    },
    profileRole () {
      return this.form.position || '-'
    },
    profileDepartment () {
      return this.form.department || '-'
    }
  },

  methods: {
    async fetchProfile () {
      try {
        const res = await Service.auth.me()
        const user = res && res.data && res.data.data ? res.data.data : null
        if (!user) return

        const fullName = user.fullName || ''
        const roleMap = {
          admin: 'ผู้ดูแลระบบ',
          researcher: 'นักวิจัย',
          committee: 'คณะกรรมการ',
          chairman: 'ประธาน'
        }

        this.form = {
          ...this.form,
          name: fullName,
          email: user.email || '',
          phone: user.phone || '',
          position: roleMap[user.role] || (user.role || '-'),
          department: user.department || user.faculty || '-',
          address: user.address || ''
        }
      } catch (err) {
        // keep page usable even when profile API is temporarily unavailable
      }
    },

    async fetchProfileStats () {
      try {
        const meRes = await Service.auth.me()
        const user = meRes && meRes.data && meRes.data.data ? meRes.data.data : null
        const myId = user && user._id ? String(user._id) : ''

        const proposalRes = await Service.proposal.list()
        const payload = proposalRes && proposalRes.data ? proposalRes.data : null
        const rows = Array.isArray(payload)
          ? payload
          : (payload && payload.data && Array.isArray(payload.data.items)
            ? payload.data.items
            : (payload && payload.data && Array.isArray(payload.data) ? payload.data : []))

        const mine = myId ? rows.filter(r => String(r && r.applicantUserId) === myId) : rows
        const approved = mine.filter(r => String(r && r.currentStatus).toLowerCase() === 'approved').length
        const pending = mine.filter(r => !['approved', 'rejected', 'announced'].includes(String(r && r.currentStatus).toLowerCase())).length

        this.profileStats = {
          total: mine.length,
          approved,
          pending
        }
      } catch (err) {
        this.profileStats = { total: 0, approved: 0, pending: 0 }
      }
    },

    cancelEdit() {
      if (this.formBackup) this.form = { ...this.formBackup }
      this.editing = false
    },



    showToast(msg, type = 'success') {
      this.toast = { show: true, msg, type }
      setTimeout(() => { this.toast.show = false }, 3000)
    },
  },
}
</script>

<style scoped>
/* ══════════════════════════════════
   Variables
══════════════════════════════════ */
:root {
  --sidebar-width: 72px;
  --topbar-height: 60px;
}

/* ══════════════════════════════════
   Layout
══════════════════════════════════ */
.app-layout { display: flex; min-height: 100vh; }

.app-body {
  margin-left: 72px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.app-body.sidebar-open { margin-left: 240px; }

/* ══════════════════════════════════
   Sidebar
══════════════════════════════════ */
.sidebar {
  width: 72px;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  position: fixed;
  top: 0; left: 0;
  height: 100vh;
  z-index: 200;
  border-right: 1px solid #2a2a2a;
  overflow: hidden;
  transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar.expanded { width: 240px; }

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  background: #111;
  border-bottom: 1px solid #2a2a2a;
  flex-shrink: 0;
}

.sidebar-logo {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.2s;
}
.sidebar.expanded .sidebar-logo { opacity: 1; }

.logo-text {
  font-weight: 700;
  font-size: 15px;
  color: #c8e6c9;
  letter-spacing: 2px;
  white-space: nowrap;
}

.hamburger-btn {
  flex-shrink: 0;
  width: 72px;
  height: 60px;
  background: none;
  border: none;
  color: #aaa;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.2s;
}
.hamburger-btn:hover { color: #c8e6c9; }

.sidebar-subtitle {
  height: 44px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  overflow: hidden;
  flex-shrink: 0;
  border-bottom: 1px solid #242424;
}
.sidebar-subtitle span {
  font-size: 11.5px;
  color: #6a8c6b;
  white-space: nowrap;
  font-weight: 500;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 10px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  height: 46px;
  border-radius: 10px;
  padding: 0 12px;
  color: #888;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  transition: background 0.2s, color 0.2s;
}
.nav-item:hover,
.nav-item.active { background: #2a2a2a; color: #c8e6c9; }

.nav-icon-wrap {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
}

.nav-label { font-size: 14px; font-weight: 500; color: inherit; }

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 199;
}

.fade-text-enter-active { transition: opacity 0.2s ease 0.1s, transform 0.2s ease 0.1s; }
.fade-text-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.fade-text-enter-from,
.fade-text-leave-to     { opacity: 0; transform: translateX(-8px); }

.overlay-fade-enter-active,
.overlay-fade-leave-active { transition: opacity 0.28s ease; }
.overlay-fade-enter-from,
.overlay-fade-leave-to     { opacity: 0; }

/* ══════════════════════════════════
   Page Wrapper
══════════════════════════════════ */
.page-wrapper {
  background: transparent;
  padding: 24px 28px;
  min-height: 100%;
  box-sizing: border-box;
  width: 100%;
}

.profile-container {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 24px;
  width: 100%;
  box-sizing: border-box;
}

.profile-right {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ── Left Card ── */
.profile-left-card {
  background: #fff;
  border-radius: 20px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  height: fit-content;
}

.avatar-circle {
  width: 78px; height: 78px;
  border-radius: 50%;
  background: #e8f5e9;
  display: flex; align-items: center; justify-content: center;
}

.profile-name {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin-bottom: 4px;
}

.profile-role {
  font-size: 13px;
  color: #4a7c59;
  font-weight: 600;
  margin-bottom: 2px;
}

.profile-dept {
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
  margin-bottom: 24px;
}

.profile-stats {
  display: flex;
  gap: 16px;
  align-items: center;
  background: #f9fafb;
  border-radius: 14px;
  padding: 12px 16px;
  width: 100%;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-num {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.stat-label {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}

.stat-divider {
  width: 1px;
  height: 36px;
  background: #e5e7eb;
}

.btn-edit-avatar {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: 1.5px dashed #d1d5db;
  background: none;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Sarabun', sans-serif;
}
.btn-edit-avatar:hover {
  border-color: #4a7c59;
  color: #4a7c59;
  background: #f0faf3;
}

/* ── Right Panel ── */
.profile-right {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Tabs */
.profile-tabs {
  display: flex;
  border-bottom: 2px solid #f3f4f6;
  padding: 0 24px;
}

.tab-btn {
  padding: 18px 20px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: #9ca3af;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.2s, border-color 0.2s;
  font-family: 'Sarabun', sans-serif;
}
.tab-btn:hover  { color: #4a7c59; }
.tab-btn.active { color: #4a7c59; border-bottom-color: #4a7c59; font-weight: 600; }

/* Tab content */
.tab-content { padding: 20px 24px 24px; }

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

/* Form */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 20px;
}

.form-group { display: flex; flex-direction: column; gap: 7px; }
.form-group.full-width { grid-column: 1 / -1; }

.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.form-input {
  padding: 11px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: #111827;
  background: #fff;
  font-family: 'Sarabun', sans-serif;
  transition: border-color 0.2s;
  outline: none;
}
.form-input:focus:not(:disabled) { border-color: #4a7c59; }
.form-input:disabled { background: #f9fafb; color: #6b7280; cursor: not-allowed; }
.form-input.input-error { border-color: #ef5350; }

.form-textarea { resize: vertical; min-height: 80px; }

/* Input with eye button */
.input-wrap { position: relative; }
.input-wrap .form-input { width: 100%; padding-right: 44px; }
.eye-btn {
  position: absolute;
  right: 12px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none;
  color: #9ca3af; cursor: pointer;
  display: flex; align-items: center;
  padding: 0;
  transition: color 0.2s;
}
.eye-btn:hover { color: #4a7c59; }

/* Password strength */
.strength-bar {
  height: 4px;
  background: #f3f4f6;
  border-radius: 99px;
  margin-top: 8px;
  overflow: hidden;
}
.strength-fill { height: 100%; border-radius: 99px; transition: width 0.4s ease, background 0.4s; }
.strength-label { font-size: 12px; font-weight: 600; margin-top: 4px; display: block; }

.error-msg { font-size: 12px; color: #ef5350; margin-top: 4px; }

/* Form actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-primary {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 22px;
  background: #4a7c59; color: #fff;
  border: none; border-radius: 10px;
  font-size: 14px; font-weight: 500;
  cursor: pointer; transition: opacity 0.2s;
  font-family: 'Sarabun', sans-serif;
}
.btn-primary:hover:not(:disabled) { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-cancel {
  padding: 10px 22px;
  background: #f3f4f6; color: #6b7280;
  border: none; border-radius: 10px;
  font-size: 14px; font-weight: 500;
  cursor: pointer; transition: background 0.2s;
  font-family: 'Sarabun', sans-serif;
}
.btn-cancel:hover { background: #e5e7eb; }

/* ── History ── */
.history-list { display: flex; flex-direction: column; gap: 12px; }

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1.5px solid #f3f4f6;
  transition: border-color 0.2s, background 0.2s;
}
.history-item:hover { border-color: #d1fae5; background: #f0faf3; }

.history-code  { font-size: 12px; color: #9ca3af; margin-bottom: 3px; }
.history-title { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 3px; }
.history-date  { font-size: 12px; color: #9ca3af; }

.history-badge {
  padding: 5px 14px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.s-waiting   { background: #f3f4f6; color: #374151; }
.s-fix       { background: #fff7e6; color: #d97706; }
.s-reviewing { background: #e0f2fe; color: #0369a1; }
.s-approved  { background: #d1fae5; color: #065f46; }
.s-rejected  { background: #fee2e2; color: #991b1b; }

/* ── Toast ── */
.toast-msg {
  position: fixed;
  bottom: 32px; left: 50%;
  transform: translateX(-50%);
  padding: 13px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  z-index: 999;
}
.toast-msg.success { background: #4a7c59; color: #fff; }
.toast-msg.error   { background: #ef5350; color: #fff; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 16px); }

/* ══ Notification Dropdown ══ */
.notif-dropdown-wrap { position: relative; }

.bell-btn {
  background: none; border: none;
  color: #c8e6c9; position: relative;
  display: flex; align-items: center;
  cursor: pointer; padding: 4px;
  border-radius: 8px;
  transition: background 0.2s;
}
.bell-btn:hover { background: rgba(255,255,255,0.1); }

.bell-badge {
  position: absolute; top: 2px; right: 2px;
  width: 9px; height: 9px;
  background: #ef5350; border-radius: 50%;
  border: 1.5px solid #2d3a2e;
}

.dp-backdrop {
  position: fixed; inset: 0; z-index: 149;
}

.dropdown-panel {
  position: absolute;
  top: calc(100% + 14px);
  right: 0;
  width: 360px;
  background: #1e1e1e;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.45);
  z-index: 150;
  overflow: hidden;
  border: 1px solid #2a2a2a;
}

.dropdown-panel::before {
  content: '';
  position: absolute;
  top: -8px; right: 18px;
  width: 16px; height: 16px;
  background: #1e1e1e;
  border-left: 1px solid #2a2a2a;
  border-top: 1px solid #2a2a2a;
  transform: rotate(45deg);
  border-radius: 2px;
}

.dp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid #2a2a2a;
}
.dp-title { font-size: 16px; font-weight: 700; color: #e0e0e0; }
.dp-unread {
  font-size: 12px; font-weight: 600; color: #fff;
  background: #ef5350; padding: 2px 10px; border-radius: 99px;
}

.dp-list {
  max-height: 320px; overflow-y: auto;
  scrollbar-width: thin; scrollbar-color: #333 transparent;
}
.dp-list::-webkit-scrollbar { width: 4px; }
.dp-list::-webkit-scrollbar-thumb { background: #333; border-radius: 99px; }

.dp-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #2a2a2a;
  cursor: pointer; transition: background 0.15s;
  position: relative;
}
.dp-item:last-child { border-bottom: none; }
.dp-item:hover { background: #252525; }
.dp-item.unread { background: #1a2820; }
.dp-item.unread:hover { background: #1e3025; }

.dp-icon {
  flex-shrink: 0; width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  margin-top: 2px;
}
.icon-blue   { background: #1e3a5f; color: #60a5fa; }
.icon-orange { background: #3d2408; color: #fb923c; }
.icon-green  { background: #14301e; color: #4ade80; }
.icon-gray   { background: #2a2a2a; color: #9ca3af; }

.dp-content { flex: 1; min-width: 0; }
.dp-item-title {
  font-size: 13px; font-weight: 600; color: #e0e0e0;
  line-height: 1.4; margin-bottom: 3px;
  display: -webkit-box;   line-clamp: 1; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}
.dp-item-desc {
  font-size: 12px; color: #777; line-height: 1.4; margin-bottom: 5px;
  display: -webkit-box;   line-clamp: 1;-webkit-line-clamp: 1;
  -webkit-box-orient: vertical; overflow: hidden;
}
.dp-item-time { font-size: 11px; color: #555; }

.dp-dot {
  flex-shrink: 0; width: 8px; height: 8px;
  border-radius: 50%; background: #ef5350; margin-top: 6px;
}

.dp-footer {
  padding: 12px 20px;
  border-top: 1px solid #2a2a2a;
}
.dp-view-all {
  width: 100%; padding: 10px;
  background: #2a2a2a; border: none; border-radius: 10px;
  color: #c8e6c9; font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: 'Sarabun', sans-serif;
  transition: background 0.2s;
}
.dp-view-all:hover { background: #333; }

.dropdown-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.dropdown-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.dropdown-enter-from,
.dropdown-leave-to { opacity: 0; transform: translateY(-8px) scale(0.97); }
</style>
