<template>
  <div class="security-page">
    <AppSectionHero
      title="Permission Management"
      subtitle="Move through the setup flow in order to define menus, create groups, and control the final permission matrix."
      :stats="heroStats"
      :meta-label="'Last updated'"
      :meta-value="lastUpdatedLabel"
      @refresh="refreshPage"
    />

    <CRow class="mb-4">
      <CCol
        v-for="step in steps"
        :key="step.to"
        md="4"
        sm="6"
        col="12"
      >
        <CCard class="bg-style2 security-table-card permission-step-card">
          <CCardBody>
            <div class="permission-step-card__header">
              <div class="permission-step-card__icon-wrap">
                <div class="permission-step-card__icon" :class="step.iconClass">
                  <CIcon :name="step.icon" />
                </div>
                <div class="permission-step-card__eyebrow">{{ step.eyebrow }}</div>
              </div>
              <div class="permission-step-card__number">{{ step.step }}</div>
            </div>

            <div class="permission-step-card__title">{{ step.title }}</div>
            <div class="permission-step-card__text">{{ step.description }}</div>

            <router-link :to="step.to" class="btn btn-outline-primary rounded-pill permission-step-card__action">
              <CIcon name="cil-arrow-right" class="mr-2" />
              Open
            </router-link>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>

    <CCard class="bg-style2 security-table-card">
      <CCardBody class="permission-guide">
        <div class="security-table-card__title mb-3 d-flex align-items-center">
          <CIcon name="cil-lock-locked" class="mr-2 security-table-card__icon" />
          <span>Recommended Flow</span>
        </div>

        <div class="permission-guide__item">
          <div class="permission-guide__label">1. Create Menu</div>
          <div class="permission-guide__text">Register menu types and paths first so the permission matrix has a stable target list.</div>
        </div>

        <div class="permission-guide__item">
          <div class="permission-guide__label">2. Create Group</div>
          <div class="permission-guide__text">Define access groups and their visible type boundaries before assigning rules.</div>
        </div>

        <div class="permission-guide__item">
          <div class="permission-guide__label">3. Permission Matrix</div>
          <div class="permission-guide__text">Grant view, edit, delete, action, and logs access once menus and groups are ready.</div>
        </div>
      </CCardBody>
    </CCard>
  </div>
</template>

<script>
import AppSectionHero from '@/projects/components/layout/AppSectionHero'
import { formatDateTime24 } from '@/projects/utils/date-time'

export default {
  name: 'PermissionManagement',
  components: { AppSectionHero },
  data () {
    return {
      lastUpdatedAt: new Date()
    }
  },
  computed: {
    lastUpdatedLabel () {
      return formatDateTime24(this.lastUpdatedAt)
    },
    heroStats () {
      return [
        { label: 'Step 1', value: 'Menu', icon: 'cil-list', iconClass: 'security-stat__icon--primary' },
        { label: 'Step 2', value: 'Group', icon: 'cil-people', iconClass: 'security-stat__icon--success' },
        { label: 'Step 3', value: 'Matrix', icon: 'cil-shield-alt', iconClass: 'security-stat__icon--warning' }
      ]
    },
    steps () {
      return [
        {
          step: '01',
          eyebrow: 'Foundation',
          title: 'Create Menu',
          description: 'Register menu entries, map paths, and prepare the permission catalog.',
          icon: 'cil-list',
          iconClass: 'security-stat__icon--primary',
          to: '/security/permissions/menu'
        },
        {
          step: '02',
          eyebrow: 'Grouping',
          title: 'Create Group',
          description: 'Build access groups and define which menu types each group can see.',
          icon: 'cil-people',
          iconClass: 'security-stat__icon--success',
          to: '/security/permissions/group'
        },
        {
          step: '03',
          eyebrow: 'Control',
          title: 'Permission Matrix',
          description: 'Apply the final permission rules that determine what each group can do.',
          icon: 'cil-shield-alt',
          iconClass: 'security-stat__icon--warning',
          to: '/security/permissions/matrix'
        }
      ]
    }
  },
  methods: {
    refreshPage () {
      this.lastUpdatedAt = new Date()
      this.$router.go()
    }
  }
}
</script>

<style scoped lang="scss">
@import "./security-page.shared";

.permission-step-card {
  height: 100%;
}

.permission-step-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.permission-step-card__icon-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.permission-step-card__icon {
  width: 3.35rem;
  height: 3.35rem;
  border-radius: 1.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.28rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.permission-step-card__eyebrow {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #7d8696;
  font-weight: 700;
}

.permission-step-card__number {
  font-size: 0.85rem;
  font-weight: 700;
  color: #8c1515;
  letter-spacing: 0.14em;
}

.permission-step-card__title {
  color: #233247;
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.55rem;
}

.permission-step-card__text {
  color: #5f6f86;
  line-height: 1.6;
  min-height: 4.8rem;
}

.permission-step-card__action {
  margin-top: 1.2rem;
}

.permission-guide {
  padding: 1.35rem 1.45rem;
}

.permission-guide__item + .permission-guide__item {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e6ebf1;
}

.permission-guide__label {
  color: #233247;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.permission-guide__text {
  color: #5f6f86;
}
</style>
