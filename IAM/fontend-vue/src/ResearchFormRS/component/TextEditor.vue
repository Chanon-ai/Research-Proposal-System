<template>
  <div class="quill-wrapper" :class="{ 'is-readonly': isReadOnly }">
    <quill-editor
      v-model="localContent"
      :options="editorOptions"
      :disabled="isReadOnly"
      class="quill-editor"
    />
  </div>
</template>

<script>
import Vue from 'vue'
import VueQuillEditor from 'vue-quill-editor'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'

Vue.use(VueQuillEditor)

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
    }
  },
  data () {
    return {
      localContent: this.modelValue || ''
    }
  },
  computed: {
    editorOptions () {
      return {
        theme: 'snow',
        modules: this.isReadOnly
          ? { toolbar: false }
          : {
              toolbar: [
                ['bold', 'italic', 'underline'],
                [{ header: 1 }, { header: 2 }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                [{ script: 'sub' }, { script: 'super' }],
                [{ color: [] }, { background: [] }],
                [{ align: [] }]
              ]
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
.quill-wrapper {
  border: 1px solid #ced4da;
  border-radius: 4px;
  overflow: hidden;
  background: #ffffff;
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
  min-height: 140px;
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

.is-readonly {
  background: #f3f4f6;
}

.is-readonly::v-deep .ql-container {
  background: transparent;
}
</style>
