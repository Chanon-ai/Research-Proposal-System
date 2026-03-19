<template>
  <li :class="dropdownClasses">
    <!--
      CoreUI's original dropdown toggler is an <a> without href.
      Some browsers/CSS setups treat it as a "placeholder link" and it can become hard to click.
      Using href + role keeps behavior the same (toggle only) but makes it reliably interactive.
    -->
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
      <slot>
        <template v-for="(item, key) in items">
          <CSidebarNavItem v-bind="item" :key="key" />
        </template>
      </slot>
    </ul>
  </li>
</template>

<script>
import CIcon from '@coreui/icons-vue/src/CIconRaw.vue'
import CSidebarNavItem from '@coreui/vue-pro/src/components/template/CSidebarNavItem'

export default {
  name: 'CSidebarNavDropdown',
  components: {
    CIcon,
    CSidebarNavItem
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
    items: Array
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

