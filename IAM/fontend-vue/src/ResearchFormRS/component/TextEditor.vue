<template>
  <div class="text-editor-shell" :class="shellClasses" :data-editor-key="fieldKey || null">
    <small v-if="helperText" class="text-editor-helper">{{ helperText }}</small>
    <div v-if="isNonResearcherReadOnlyTheme" class="text-editor-readonly" :style="editorWrapperStyle">
      <div
        v-if="hasReadableContent"
        class="text-editor-readonly__content ql-editor"
        :aria-label="fieldLabel || fieldKey || 'text-editor-readonly'"
        v-html="readOnlyHtml"
      />
      <div
        v-else
        class="text-editor-readonly__placeholder"
        :aria-label="fieldLabel || fieldKey || 'text-editor-readonly-empty'"
      >
        -
      </div>
    </div>
    <div v-else class="quill-wrapper" :class="{ 'is-readonly': isReadOnly }" :style="editorWrapperStyle">
      <quill-editor
        v-model="localContent"
        :options="editorOptions"
        :disabled="isReadOnly"
        class="quill-editor"
        :aria-label="fieldLabel || fieldKey || 'text-editor'"
      />
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import VueQuillEditor from 'vue-quill-editor'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'

Vue.use(VueQuillEditor)

const TOOLBAR_PRESETS = {
  legacy: [
    ['bold', 'italic', 'underline'],
    [{ header: 1 }, { header: 2 }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ color: [] }, { background: [] }],
    [{ align: [] }]
  ],
  minimal: [
    ['bold', 'italic'],
    ['clean']
  ],
  list: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean']
  ],
  basic: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['clean']
  ],
  reference: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean']
  ],
  methodology: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['link'],
    ['clean']
  ]
}

export default {
  name: 'TextEditor',
  model: {
    prop: 'modelValue',
    event: 'update:modelValue'
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    isReadOnly: {
      type: Boolean,
      default: false
    },
    fieldKey: {
      type: String,
      default: ''
    },
    fieldLabel: {
      type: String,
      default: ''
    },
    helperText: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    minHeight: {
      type: [Number, String],
      default: 140
    },
    toolbarPreset: {
      type: [String, Array],
      default: 'legacy'
    },
    viewerRole: {
      type: String,
      default: ''
    },
    isDarkTheme: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      localContent: this.modelValue || ''
    }
  },
  computed: {
    shellClasses () {
      return {
        'is-dark': this.isDarkTheme,
        'is-readonly-viewer': this.isNonResearcherReadOnlyTheme
      }
    },
    resolvedViewerRole () {
      const fromProp = String(this.viewerRole || '').trim()
      if (fromProp) return fromProp

      const fromStore = this.$store && this.$store.getters
        ? this.$store.getters['Authentication/userRole']
        : ''
      const storeRole = String(fromStore || '').trim()
      if (storeRole) return storeRole

      try {
        const raw = localStorage.getItem('auth_user')
        if (!raw) return ''
        const parsed = JSON.parse(raw)
        return parsed && parsed.role ? String(parsed.role).trim() : ''
      } catch (_) {
        return ''
      }
    },
    isNonResearcherReadOnlyTheme () {
      const role = String(this.resolvedViewerRole || '').trim().toLowerCase()
      return this.isReadOnly && Boolean(role) && role !== 'researcher'
    },
    readOnlyHtml () {
      return String(this.localContent || this.modelValue || '').trim()
    },
    hasReadableContent () {
      const html = this.readOnlyHtml
      if (!html) return false
      const plain = html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      return plain.length > 0
    },
    normalizedMinHeight () {
      if (typeof this.minHeight === 'number' && Number.isFinite(this.minHeight)) {
        return `${Math.max(this.minHeight, 90)}px`
      }
      const raw = String(this.minHeight || '').trim()
      if (!raw) return '140px'
      if (/^\d+(\.\d+)?$/.test(raw)) return `${raw}px`
      return raw
    },
    editorWrapperStyle () {
      return {
        '--editor-min-height': this.normalizedMinHeight
      }
    },
    resolvedToolbar () {
      if (Array.isArray(this.toolbarPreset) && this.toolbarPreset.length) {
        return this.toolbarPreset
      }
      const presetKey = String(this.toolbarPreset || 'legacy').trim()
      return TOOLBAR_PRESETS[presetKey] || TOOLBAR_PRESETS.legacy
    },
    editorOptions () {
      return {
        theme: 'snow',
        placeholder: this.placeholder || '',
        modules: this.isReadOnly
          ? { toolbar: false }
          : {
              toolbar: this.resolvedToolbar
            }
      }
    }
  },
  watch: {
    modelValue (next) {
      const value = next || ''
      if (value === this.localContent) return
      this.localContent = value
    },
    localContent (next) {
      if (this.isReadOnly) return
      if (next === this.modelValue) return
      this.$emit('update:modelValue', next)
    }
  }
}
</script>

<style scoped>
.text-editor-shell {
  display: block;
}

.text-editor-helper {
  display: block;
  margin-bottom: 6px;
  font-size: 0.78rem;
  line-height: 1.45;
  color: #5b6b80;
}

.quill-wrapper {
  border: 1px solid #ced4da;
  border-radius: 4px;
  overflow: hidden;
  background: #ffffff;
}

.text-editor-readonly {
  min-height: var(--editor-min-height, 140px);
  border: 1px solid #d3c3a7;
  border-radius: 14px;
  background: #e2e8f0;
  padding: 10px 12px;
  overflow: hidden;
}

.text-editor-readonly__content {
  min-height: calc(var(--editor-min-height, 140px) - 20px);
  margin: 0;
  padding: 0;
  line-height: 1.6;
  color: #172033;
  background: transparent;
}

.text-editor-readonly__placeholder {
  min-height: calc(var(--editor-min-height, 140px) - 20px);
  color: #64748b;
  line-height: 1.6;
  display: flex;
  align-items: flex-start;
}

.quill-wrapper::v-deep .ql-toolbar {
  border: none;
  border-bottom: 1px solid #dee2e6;
  background: #f8f9fa;
}

.quill-wrapper::v-deep .ql-container {
  border: none;
  font-size: 14px;
}

.quill-wrapper::v-deep .ql-editor {
  min-height: var(--editor-min-height, 140px);
  line-height: 1.55;
}

/* Quill list marker fallback for this project setup (Vue2 + vue-quill-editor + Quill2). */
.quill-wrapper::v-deep .ql-editor ol,
.quill-wrapper::v-deep .ql-editor ul {
  padding-left: 1.5rem !important;
}

.quill-wrapper::v-deep .ql-editor li[data-list='ordered'],
.quill-wrapper::v-deep .ql-editor ol > li:not([data-list]) {
  list-style-type: decimal !important;
  list-style-position: outside !important;
  padding-left: 0 !important;
}

.quill-wrapper::v-deep .ql-editor li[data-list='bullet'],
.quill-wrapper::v-deep .ql-editor ul > li:not([data-list]) {
  list-style-type: disc !important;
  list-style-position: outside !important;
  padding-left: 0 !important;
}

.quill-wrapper::v-deep .ql-editor li[data-list='ordered'] > .ql-ui,
.quill-wrapper::v-deep .ql-editor li[data-list='bullet'] > .ql-ui {
  display: none !important;
}

.text-editor-readonly__content ol,
.text-editor-readonly__content ul {
  padding-left: 1.5rem !important;
}

.text-editor-readonly__content li[data-list='ordered'],
.text-editor-readonly__content ol > li:not([data-list]) {
  list-style-type: decimal !important;
  list-style-position: outside !important;
  padding-left: 0 !important;
}

.text-editor-readonly__content li[data-list='bullet'],
.text-editor-readonly__content ul > li:not([data-list]) {
  list-style-type: disc !important;
  list-style-position: outside !important;
  padding-left: 0 !important;
}

.text-editor-readonly__content li[data-list='ordered'] > .ql-ui,
.text-editor-readonly__content li[data-list='bullet'] > .ql-ui {
  display: none !important;
}

.is-readonly {
  background: #f3f4f6;
}

.is-readonly::v-deep .ql-container {
  background: transparent;
}

.text-editor-shell.is-dark .text-editor-helper {
  color: #aab9ca;
}

.text-editor-shell.is-dark .quill-wrapper {
  background: #223142;
  border-color: #3b4d62;
}

.text-editor-shell.is-dark .quill-wrapper::v-deep .ql-toolbar {
  background: #1a2432;
  border-bottom-color: #324458;
}

.text-editor-shell.is-dark .quill-wrapper::v-deep .ql-container,
.text-editor-shell.is-dark .quill-wrapper::v-deep .ql-editor {
  color: #edf4fc;
}

.text-editor-shell.is-dark .quill-wrapper::v-deep .ql-editor.ql-blank::before {
  color: #9caec2;
}

.text-editor-shell.is-dark .text-editor-readonly {
  background: #223142;
  border-color: #3c4e63;
}

.text-editor-shell.is-dark .text-editor-readonly__content {
  color: #e6edf7;
}

.text-editor-shell.is-dark .text-editor-readonly__placeholder {
  color: #9caec2;
}
</style>
