<template>
  <li :class="dropdownClasses">
    <a
      class="c-sidebar-nav-dropdown-toggle"
      href="#"
      role="button"
      @click="handleClick"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
    >
      <CIcon v-if="icon" v-bind="computedIcon" />
      <i v-if="fontIcon" :class="['c-sidebar-nav-icon', fontIcon]"></i>
      {{ name }}
    </a>

    <ul class="c-sidebar-nav-dropdown-items" @click="itemClicked">
      <template v-for="(item, idx) in items">
        <CSidebarNavTitle
          v-if="item && item._name === 'CSidebarNavTitle'"
          :key="`t-${idx}`"
          :class="item._class"
        >
          {{ titleText(item) }}
        </CSidebarNavTitle>

        <CSidebarNavDivider
          v-else-if="item && item._name === 'CSidebarNavDivider'"
          :key="`d-${idx}`"
          :class="item._class"
        />

        <CSidebarNavDropdown
          v-else-if="item && item._name === 'CSidebarNavDropdown'"
          :key="`dd-${idx}`"
          v-bind="dropdownProps(item)"
        />

        <CSidebarNavItem
          v-else
          :key="`i-${idx}`"
          v-bind="itemProps(item)"
        />
      </template>
    </ul>
  </li>
</template>

<script>
import CIcon from '@coreui/icons-vue/src/CIconRaw.vue'
import CSidebarNavItem from '@coreui/vue-pro/src/components/template/CSidebarNavItem'
import CSidebarNavDropdown from '@coreui/vue-pro/src/components/template/CSidebarNavDropdown'
import CSidebarNavTitle from '@coreui/vue-pro/src/components/template/CSidebarNavTitle'
import CSidebarNavDivider from '@coreui/vue-pro/src/components/template/CSidebarNavDivider'

export default {
  name: 'CSidebarNavDropdownTemplate',
  components: {
    CIcon,
    CSidebarNavItem,
    CSidebarNavDropdown,
    CSidebarNavTitle,
    CSidebarNavDivider
  },
  props: {
    name: String,
    route: {
      type: String,
      validator: (val) => !!val && val.length > 0
    },
    icon: [String, Object],
    fontIcon: String,
    show: Boolean,
    items: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      open: this.show
    }
  },
  inject: {
    dropdownMode: {
      default: 'openActive'
    }
  },
  watch: {
    show(val) {
      this.open = val
    },
    $route: {
      immediate: true,
      handler(route) {
        const mode = this.dropdownMode
        if (mode === 'close') {
          this.open = false
        } else if (mode === 'closeInactive' && this.route) {
          this.open = route.fullPath.includes(this.route)
        } else if (mode === 'openActive' && !this.open && this.route) {
          this.open = route.fullPath.includes(this.route)
        }
      }
    }
  },
  computed: {
    dropdownClasses() {
      return ['c-sidebar-nav-dropdown', { 'c-show': this.open }]
    },
    computedIcon() {
      if (typeof this.icon === 'object') {
        const key = this.icon.size ? 'class' : 'customClasses'
        return {
          ...this.icon,
          [`${key}`]: this.icon.customClasses || ['c-sidebar-nav-icon', this.icon.className]
        }
      }
      return { customClasses: 'c-sidebar-nav-icon', name: this.icon }
    }
  },
  methods: {
    titleText(item) {
      if (!item) return ''
      if (Array.isArray(item._children) && item._children.length) return item._children.join(' ')
      return item.name || ''
    },
    dropdownProps(item) {
      if (!item) return {}
      const { name, route, icon, fontIcon, show, items } = item
      return { name, route, icon, fontIcon, show, items }
    },
    itemProps(item) {
      if (!item) return {}
      // Allow passing plain CoreUI nav item objects too.
      const cleaned = { ...item }
      Object.keys(cleaned).forEach((k) => {
        if (k && k.startsWith('_')) delete cleaned[k]
      })
      return cleaned
    },
    toggle() {
      this.open = !this.open
      this.$emit('update:show', this.open)
    },
    handleClick(e) {
      e.preventDefault()
      this.toggle()
    },
    itemClicked(e) {
      this.$emit('item-clicked', e)
    }
  }
}
</script>
