<template>
  <div class="app-layout">

    <!-- ───────────── PROFILE PAGE ───────────── -->
    <div class="page-wrapper" :class="{ 'is-dark': isDarkTheme }">
      <div class="profile-container">

        <!-- ── Right: Info + Edit form (now full width) ── -->
        <div class="profile-right">

          <!-- Tabs -->
          <div class="profile-tabs-wrap">
            <div class="profile-tabs" ref="tabsWrap">
              <button
                v-for="tab in tabs" :key="tab.key"
                ref="tabBtn"
                class="tab-btn"
                :class="{ active: activeTab === tab.key }"
                @click="activeTab = tab.key"
              >{{ tab.label }}</button>

              <div class="tab-slider" :style="sliderStyle"></div>
            </div>
          </div>

          <!-- Tab: ข้อมูลส่วนตัว -->
          <div v-if="activeTab === 'info'" class="tab-content tab-info">
            <div class="section-title">ข้อมูลส่วนตัว</div>
            <div class="form-grid">
              <div class="form-group full-width">
                <label>ชื่อผู้ใช้ (USERNAME)</label>
                <input v-model="form.username" class="form-input" disabled />
              </div>
              <div class="form-group">
                <label>คำนำหน้า</label>
                <input v-model="form.prefix" class="form-input" :disabled="!editing" />
              </div>
              <div class="form-group">
                <label>ชื่อ - นามสกุล</label>
                <input v-model="form.name" class="form-input" :disabled="!editing" placeholder="ชื่อจริง" />
              </div>
              <div class="form-group">
                <label>อีเมล</label>
                <input v-model="form.email" type="email" class="form-input" :disabled="!editing" />
              </div>
              <div class="form-group">
                <label>เบอร์โทรศัพท์</label>
                <input v-model="form.phone" class="form-input" :disabled="!editing" placeholder="088-xxx-xxxx" />
              </div>
              <div class="form-group">
                <label>วันเกิด</label>
                <input v-model="form.birthdate" type="date" class="form-input" :disabled="!editing" />
              </div>
              <div class="form-group">
                <label>ตำแหน่ง</label>
                <input v-model="form.position" class="form-input" :disabled="!editing" />
              </div>
              <div class="form-group">
                <label>สังกัด / คณะ</label>
                <input v-model="form.department" class="form-input" :disabled="!editing" />
              </div>
              <div class="form-group">
                <label>เพศ</label>
                <input v-model="form.gender" class="form-input" :disabled="!editing" />
              </div>
              <div class="form-group full-width address-field">
                <textarea v-model="form.address" class="form-input form-textarea address-text" :disabled="!editing" rows="3" />
              </div>
            </div>
          </div>

          <!-- Tab: ที่อยู่ — tab-address ลด padding ด้านล่าง -->
          <div v-if="activeTab === 'address'" class="tab-content tab-address">
            <div class="section-title">ที่อยู่</div>
            <div class="form-grid">
              <div class="form-group full-width">
                <label>ที่อยู่</label>
                <div class="input-wrap icon-left full">
                  <span class="input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b1212" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 1 1 18 0z"/>
                      <circle cx="12" cy="10" r="2"/>
                    </svg>
                  </span>
                  <input v-model="form.addrLine" class="form-input" :disabled="true" placeholder="ระบุที่อยู่" />
                </div>
              </div>

              <div class="form-group">
                <label>ตำบล / แขวง</label>
                <div class="input-wrap icon-left full">
                  <span class="input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b1212" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 1 1 18 0z"/>
                      <circle cx="12" cy="10" r="2"/>
                    </svg>
                  </span>
                  <input v-model="form.addrSubdistrict" class="form-input" :disabled="true" placeholder="ตำบล / แขวง" />
                </div>
              </div>
              <div class="form-group">
                <label>อำเภอ / เขต</label>
                <div class="input-wrap icon-left full">
                  <span class="input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b1212" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 1 1 18 0z"/>
                      <circle cx="12" cy="10" r="2"/>
                    </svg>
                  </span>
                  <input v-model="form.addrDistrict" class="form-input" :disabled="true" placeholder="อำเภอ / เขต" />
                </div>
              </div>

              <div class="form-group">
                <label>จังหวัด</label>
                <input v-model="form.addrProvince" class="form-input" :disabled="true" placeholder="จังหวัด" />
              </div>
              <div class="form-group">
                <label>รหัสไปรษณีย์</label>
                <input v-model="form.addrPostal" class="form-input" :disabled="true" placeholder="xxxxx" />
              </div>
            </div>
          </div>

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

  data () {
    return {
      activeTab: 'info',
      tabs: [
        { key: 'info',    label: 'ข้อมูลส่วนตัว' },
        { key: 'address', label: 'ที่อยู่' }
      ],
      editing: false,
      form: {
        username: '', prefix: '', name: '', email: '', phone: '',
        position: '', department: '', address: '',
        addrLine: '', addrSubdistrict: '', addrDistrict: '',
        addrProvince: '', addrPostal: '', birthdate: '', gender: ''
      },
      formBackup: null,
      toast: { show: false, msg: '', type: 'success' },
      sliderStyle: { left: '0px', width: '0px' }
    }
  },

  async mounted () {
    await this.fetchProfile()
    this.$nextTick(() => {
      this.updateSlider()
      window.addEventListener('resize', this.updateSlider)
    })
  },

  beforeDestroy () { window.removeEventListener('resize', this.updateSlider) },
  beforeUnmount () { window.removeEventListener('resize', this.updateSlider) },

  computed: {
    isDarkTheme () {
      return Boolean(this.$store && this.$store.state && this.$store.state.darkMode)
    }
  },

  methods: {
    updateSlider () {
      try {
        const wrap = this.$refs.tabsWrap
        const btns = this.$refs.tabBtn || []
        if (!wrap || !btns || !btns.length) return
        const activeIndex = this.tabs.findIndex(t => t.key === this.activeTab)
        const activeEl = Array.isArray(btns) ? btns[activeIndex] : btns
        if (!activeEl) return
        const wrapRect = wrap.getBoundingClientRect()
        const btnRect = activeEl.getBoundingClientRect()
        this.sliderStyle = {
          left: Math.max(0, btnRect.left - wrapRect.left) + 'px',
          width: Math.max(24, btnRect.width) + 'px'
        }
      } catch (e) {}
    },

    async fetchProfile () {
      try {
        const res = await Service.auth.me()
        const user = res && res.data && res.data.data ? res.data.data : null
        if (!user) return
        const roleMap = { admin: 'ผู้ดูแลระบบ', researcher: 'นักวิจัย', committee: 'คณะกรรมการ', chairman: 'ประธาน' }
        const addr = user.address && Array.isArray(user.address) && user.address[0]
        this.form = {
          ...this.form,
          username:        user.username || user.email || '',
          name:            user.fullName || '',
          email:           user.email || '',
          phone:           user.phone || '',
          position:        roleMap[user.role] || user.role || '-',
          department:      user.department || user.faculty || '-',
          address:         user.address || '',
          addrLine:        addr ? addr.address     : (user.address || ''),
          addrSubdistrict: addr ? addr.subDistrict : '',
          addrDistrict:    addr ? addr.district    : '',
          addrProvince:    addr ? addr.province    : '',
          addrPostal:      addr ? addr.zipcode     : '',
          birthdate:       user.birthdate || '',
          gender:          user.gender || ''
        }
      } catch (err) {}
    },

    startEdit ()  { this.formBackup = { ...this.form }; this.editing = true },
    cancelEdit () { if (this.formBackup) this.form = { ...this.formBackup }; this.editing = false },

    async saveProfile () {
      try {
        const payload = { ...this.form }
        if (Service.auth && typeof Service.auth.update === 'function') {
          await Service.auth.update(payload)
        } else if (Service.auth && typeof Service.auth.updateProfile === 'function') {
          await Service.auth.updateProfile(payload)
        } else {
          await new Promise(r => setTimeout(r, 500))
        }
        this.editing = false
        this.formBackup = null
        this.showToast('บันทึกข้อมูลสำเร็จ', 'success')
        await this.fetchProfile()
      } catch (err) {
        this.showToast('บันทึกข้อมูลไม่สำเร็จ', 'error')
      }
    },

    showToast (msg, type = 'success') {
      this.toast = { show: true, msg, type }
      setTimeout(() => { this.toast.show = false }, 3000)
    }
  },

  watch: {
    activeTab () { this.$nextTick(() => this.updateSlider()) }
  }
}
</script>

<style scoped>
.app-layout { display: flex; min-height: 100vh; }

.page-wrapper {
  background: transparent;
  padding: 24px 28px;
  box-sizing: border-box;
  width: 100%;
}

.profile-container { display: block; width: 100%; box-sizing: border-box; }

.profile-right {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
}

/* ── Tabs ── */
.profile-tabs {
  display: flex;
  position: relative;
  border-bottom: 1px solid #f3f4f6;
  padding: 0 24px;
}

.tab-btn {
  padding: 18px 20px;
  border: none; background: none;
  font-size: 14px; font-weight: 500;
  color: #9ca3af; cursor: pointer;
  transition: color 0.18s ease;
  font-family: 'Sarabun', sans-serif;
}
.tab-btn:hover  { color: #8b1212; }
.tab-btn.active { color: #8b1212; font-weight: 600; }
.tab-btn:focus, .tab-btn:active, .tab-btn:focus-visible { outline: none; box-shadow: none; }
.tab-btn::-moz-focus-inner { border: 0; }

.tab-slider {
  position: absolute; bottom: 0;
  height: 3px; background: #8b1212; border-radius: 3px;
  transition: left 0.28s cubic-bezier(0.4,0,0.2,1), width 0.28s cubic-bezier(0.4,0,0.2,1);
}

/* ── Tab content ── */
.tab-content { padding: 20px 24px 24px; }

/* ✅ แก้พื้นที่ว่างด้านล่าง tab ที่อยู่ โดยไม่กระทบ tab อื่น */
.tab-content.tab-address { padding-bottom: 8px; }
.tab-content.tab-address .form-grid { margin-bottom: 0; }

.section-title {
  font-size: 16px; font-weight: 700;
  color: #111827; margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}
/* ใน App.vue หรือ layout wrapper */
.c-main, .c-wrapper, .c-body {
  height: auto !important;
  min-height: unset !important;
}

/* ── Form ── */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 20px;
}

.form-group { display: flex; flex-direction: column; gap: 7px; }
.form-group.full-width { grid-column: 1 / -1; }

.form-group label {
  font-size: 12px; font-weight: 600;
  color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px;
}

.form-input {
  padding: 11px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px; color: #111827;
  background: #fff;
  font-family: 'Sarabun', sans-serif;
  transition: border-color 0.2s; outline: none;
}
.form-input:focus:not(:disabled) { border-color: #8b1212; }
.form-input:disabled { background: #f9fafb; color: #6b7280; cursor: not-allowed; }

.form-textarea { resize: vertical; min-height: 80px; }

.tab-info .address-field .form-input.address-text {
  border: none; background: transparent; border-radius: 0; padding: 0; min-height: 36px;
}
.tab-info .address-field .form-input.address-text:disabled {
  background: transparent; color: #111827; cursor: default;
}

/* Input icon-left */
.input-wrap { position: relative; }
.input-wrap.full { display: block; width: 100%; }
.input-wrap.icon-left .form-input { padding-left: 42px; padding-right: 14px; width: 100%; }
.input-icon {
  position: absolute; left: 12px; top: 50%;
  transform: translateY(-50%);
  display: inline-flex; align-items: center; justify-content: center;
  color: #8b1212; width: 18px; height: 18px;
  pointer-events: none;
}

/* ── Form actions ── */
.form-actions { display: flex; justify-content: flex-end; gap: 12px; }

.btn-primary {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 22px; background: #8b1212; color: #fff;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 500;
  cursor: pointer; transition: opacity 0.2s; font-family: 'Sarabun', sans-serif;
}
.btn-primary:hover:not(:disabled) { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-cancel {
  padding: 10px 22px; background: #f3f4f6; color: #6b7280;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 500;
  cursor: pointer; transition: background 0.2s; font-family: 'Sarabun', sans-serif;
}
.btn-cancel:hover { background: #e5e7eb; }

/* ── Toast ── */
.toast-msg {
  position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
  padding: 13px 24px; border-radius: 12px; font-size: 14px; font-weight: 500;
  display: flex; align-items: center; gap: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15); z-index: 999;
}
.toast-msg.success { background: #8b1212; color: #fff; }
.toast-msg.error   { background: #ef5350; color: #fff; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 16px); }

/* ── Dark mode ── */
.page-wrapper.is-dark .profile-right {
  background: #1f2933; border: 1px solid #334155;
  box-shadow: 0 1px 0 rgba(148,163,184,0.08);
}
.page-wrapper.is-dark .section-title { color: #e5edf5; border-color: #334155; }
.page-wrapper.is-dark .tab-btn { color: #9fb0c3; }
.page-wrapper.is-dark .tab-btn:hover,
.page-wrapper.is-dark .tab-btn.active { color: #dce7f3; }
.page-wrapper.is-dark .profile-tabs { border-color: #334155; }
.page-wrapper.is-dark .form-group label { color: #9fb0c3; }
.page-wrapper.is-dark .form-input { background: #253240; border-color: #3c4d61; color: #ecf3fb; }
.page-wrapper.is-dark .form-input::placeholder { color: #8fa3b8; }
.page-wrapper.is-dark .form-input:focus:not(:disabled) { border-color: #6d8bad; }
.page-wrapper.is-dark .form-input:disabled { background: #1b2633; border-color: #334155; color: #9fb0c3; }
.page-wrapper.is-dark .btn-cancel { background: #2a3949; color: #d0deed; }
.page-wrapper.is-dark .btn-cancel:hover { background: #334659; }
</style>