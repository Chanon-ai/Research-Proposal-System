<template>
  <div class="auth-page d-flex align-items-center justify-content-center">
    <div class="auth-card card shadow border-0">
      <div class="card-body p-4 p-md-5">
        <div class="text-center mb-4">
          <h2 class="mb-1">researchproposal.mfu.ac.th</h2>
          <p class="text-muted mb-0">Research proposal management platform</p>
          <router-link to="/pages/login" class="small text-primary mt-2 d-inline-block">
            &larr; Back to Google Sign-In
          </router-link>
        </div>

        <div class="btn-group d-flex mb-4" role="group">
          <button
            type="button"
            class="btn"
            :class="activeTab === 'login' ? 'btn-primary' : 'btn-outline-primary'"
            @click="switchTab('login')"
          >
            Sign In
          </button>
          <button
            type="button"
            class="btn"
            :class="activeTab === 'register' ? 'btn-primary' : 'btn-outline-primary'"
            @click="switchTab('register')"
          >
            Register
          </button>
        </div>

        <form v-if="activeTab === 'login'" @submit.prevent="onLogin">
          <div class="form-group">
            <label>Email *</label>
            <input
              v-model.trim="loginForm.email"
              type="email"
              class="form-control"
              required
              placeholder="name@example.com"
            >
            <small class="text-muted">MFU staff can use `@mfu.ac.th`, external users can use any email.</small>
          </div>

          <div class="form-group">
            <label>Password *</label>
            <div class="input-group">
              <input
                v-model="loginForm.password"
                :type="showLoginPassword ? 'text' : 'password'"
                class="form-control"
                required
                placeholder="Enter your password"
              >
              <div class="input-group-append">
                <button class="btn btn-outline-secondary" type="button" @click="showLoginPassword = !showLoginPassword">
                  {{ showLoginPassword ? 'Hide' : 'Show' }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="errorMessage" class="alert alert-danger py-2">
            {{ errorMessage }}
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>

          <div class="d-flex justify-content-between mt-3 small">
            <span class="text-muted" style="cursor: pointer;" @click="forgotPassword">Forgot password?</span>
            <span>
              Need an account?
              <a href="#" @click.prevent="switchTab('register')">Register</a>
            </span>
          </div>
        </form>

        <form v-else @submit.prevent="onRegister">
          <div class="form-group">
            <label>Full Name *</label>
            <input
              v-model.trim="registerForm.fullName"
              type="text"
              class="form-control"
              required
              placeholder="Full name"
            >
          </div>

          <div class="form-group">
            <label>Email *</label>
            <input
              v-model.trim="registerForm.email"
              type="email"
              class="form-control"
              required
              placeholder="name@example.com"
            >
            <div class="mt-2">
              <span v-if="registerForm.email" class="badge" :class="isMFUEmail ? 'badge-success' : 'badge-secondary'">
                {{ isMFUEmail ? 'MFU Staff' : 'External User' }}
              </span>
            </div>
          </div>

          <div class="form-group">
            <label>Password *</label>
            <div class="input-group">
              <input
                v-model="registerForm.password"
                :type="showRegisterPassword ? 'text' : 'password'"
                class="form-control"
                minlength="6"
                required
                placeholder="At least 6 characters"
              >
              <div class="input-group-append">
                <button class="btn btn-outline-secondary" type="button" @click="showRegisterPassword = !showRegisterPassword">
                  {{ showRegisterPassword ? 'Hide' : 'Show' }}
                </button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Confirm Password *</label>
            <input
              v-model="registerForm.confirmPassword"
              :type="showRegisterPassword ? 'text' : 'password'"
              class="form-control"
              required
              placeholder="Confirm password"
            >
          </div>

          <div class="form-group">
            <label>Department</label>
            <input
              v-model.trim="registerForm.department"
              type="text"
              class="form-control"
              placeholder="Department or faculty"
            >
          </div>

          <div class="form-group">
            <label>Phone</label>
            <input
              v-model.trim="registerForm.phone"
              type="text"
              class="form-control"
              placeholder="08x-xxx-xxxx"
            >
          </div>

          <div v-if="errorMessage" class="alert alert-danger py-2">
            {{ errorMessage }}
          </div>

          <button type="submit" class="btn btn-success btn-block" :disabled="loading">
            {{ loading ? 'Registering...' : 'Register' }}
          </button>

          <div class="text-right mt-3 small">
            Already have an account?
            <a href="#" @click.prevent="switchTab('login')">Sign In</a>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResearchLogin',
  data() {
    return {
      activeTab: this.$route.query.tab === 'register' ? 'register' : 'login',
      loading: false,
      errorMessage: '',
      showLoginPassword: false,
      showRegisterPassword: false,
      loginForm: {
        email: '',
        password: ''
      },
      registerForm: {
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: '',
        phone: ''
      }
    }
  },
  computed: {
    isMFUEmail() {
      return String(this.registerForm.email || '').toLowerCase().endsWith('@mfu.ac.th')
    }
  },
  methods: {
    switchTab(tab) {
      this.activeTab = tab
      this.errorMessage = ''
    },
    forgotPassword() {
      this.errorMessage = 'Forgot password is not available yet.'
    },
    redirectByRole(role) {
      if (role === 'committee') {
        this.$router.push('/committee/assigned')
        return
      }
      if (role === 'chairman') {
        this.$router.push('/chairman/assigned')
        return
      }
      if (role === 'finance_officer') {
        this.$router.push('/finance-officer/assigned')
        return
      }
      if (role === 'admin') {
        this.$router.push('/admin/dashboard')
        return
      }
      this.$router.push('/userdashboard')
    },
    async onLogin() {
      this.errorMessage = ''
      this.loading = true
      try {
        const result = await this.$store.dispatch('Authentication/login', {
          email: this.loginForm.email,
          password: this.loginForm.password
        })
        this.redirectByRole(result.user && result.user.role)
      } catch (err) {
        this.errorMessage = (err && err.response && err.response.data && err.response.data.message) || 'Invalid email or password.'
      } finally {
        this.loading = false
      }
    },
    async onRegister() {
      this.errorMessage = ''

      if (String(this.registerForm.password || '').length < 6) {
        this.errorMessage = 'Password must be at least 6 characters.'
        return
      }

      if (this.registerForm.password !== this.registerForm.confirmPassword) {
        this.errorMessage = 'Passwords do not match.'
        return
      }

      this.loading = true
      try {
        const result = await this.$store.dispatch('Authentication/register', {
          fullName: this.registerForm.fullName,
          email: this.registerForm.email,
          password: this.registerForm.password,
          department: this.registerForm.department,
          phone: this.registerForm.phone
        })
        this.redirectByRole(result.user && result.user.role)
      } catch (err) {
        this.errorMessage = (err && err.response && err.response.data && err.response.data.message) || 'Registration failed.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f4f7fb 0%, #e6eef9 100%);
  padding: 24px;
}

.auth-card {
  width: 100%;
  max-width: 520px;
  border-radius: 16px;
}

.badge {
  font-size: 0.8rem;
}
</style>
