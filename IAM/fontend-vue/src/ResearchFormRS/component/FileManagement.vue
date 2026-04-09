<template>
  <div class="container-fluid p-0 mt-4 file-management-section" :class="{ 'file-management-section--dark': isDarkTheme }">
    <div class="card shadow-sm border-0">
      <div class="card-body p-4 bg-white">
        <div class="file-header d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 class="mb-1 font-weight-bold text-dark">
              {{ text.title }}
            </h5>
            <div v-if="!isReadOnly" class="small text-muted">
              {{ text.subtitle }}
            </div>
          </div>

          <button
            v-if="!isReadOnly"
            type="button"
            class="btn btn-outline-dark font-weight-bold"
            @click="$refs.fileInput.click()"
          >
            <CIcon name="cil-library-add" class="me-1"/>
            {{ text.uploadButton }}
          </button>

          <input
            type="file"
            ref="fileInput"
            multiple
            accept=".pdf,application/pdf"
            style="display: none"
            @change="$emit('upload', $event)"
          />
        </div>

        <div class="table-responsive">
          <table class="table table-bordered align-middle mb-0">
            <thead class="thead-custom" >
              <tr>
                <th style="width:25%">{{ text.documentType }}</th>
                <th style="width:25%">{{ text.fileName }}</th>
                <th style="width:15%">{{ text.uploadedAt }}</th>
                <th style="width:20%">{{ text.note }}</th>
                <th v-if="!isReadOnly" style="width:15%" class="text-center">{{ text.manage }}</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(item, index) in files"
                :key="item.fileId || item.id || (String(item.name || 'file') + '-' + index)"
              >
                <td>
                  <select
                    :value="item.type"
                    @change="updateFile(index, 'type', $event.target.value)"
                    class="form-control form-control-sm"
                    :disabled="isReadOnly"
                  >
                    <option disabled value="">
                      {{ text.selectType }}
                    </option>
                    <option v-for="option in documentTypeOptions" :key="option.th" :value="resolveOptionValue(option, item.type)">
                      {{ optionLabel(option, item.type) }}
                    </option>
                  </select>
                </td>

                <td class="align-middle">
                  <a
                    href="#"
                    @click.prevent="$emit('open', item)"
                    class="text-primary font-weight-bold"
                    style="cursor:pointer; display:inline-flex; align-items:center; justify-content:center;"
                  >
                    <CIcon name="cil-file" class="me-1"/>
                    {{ item.name }}
                  </a>
                </td>

                <td class="text-muted small align-middle">
                  {{ item.datetime }}
                </td>

                <td>
                  <input
                    type="text"
                    :value="item.note"
                    @input="updateFile(index, 'note', $event.target.value)"
                    class="form-control form-control-sm"
                    :placeholder="text.notePlaceholder"
                    :disabled="isReadOnly"
                  />
                </td>

                <td v-if="!isReadOnly" class="d-flex justify-content-center" style="gap: 12px;">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    @click="$emit('remove', { index, item })"
                  >
                    <CIcon name="cil-trash" class="me-1"/>
                    {{ text.remove }}
                  </button>
                </td>
              </tr>

              <tr v-if="files.length === 0">
                <td :colspan="isReadOnly ? 4 : 5" class="text-center py-5 text-muted italic">
                  {{ text.empty }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const DOCUMENT_TYPE_OPTIONS = [
  {
    th: 'หลักฐานการผ่านการอบรมมาตรฐานการวิจัยในมนุษย์',
    en: 'Proof of Human Research Ethics Training'
  },
  {
    th: 'หลักฐานการผ่านการอบรมมาตรฐานความปลอดภัยทางชีวภาพ',
    en: 'Proof of Biosafety Training'
  },
  {
    th: 'หลักฐานการผ่านการอบรมมาตรฐานความปลอดภัยห้องปฏิบัติการ',
    en: 'Proof of Laboratory Safety Training'
  },
  {
    th: 'หลักฐานการผ่านการอบรมมาตรฐานความปลอดภัยการดำเนินการต่อสัตว์ฯ',
    en: 'Proof of Animal Research Safety Training'
  },
  {
    th: 'อื่น ๆ',
    en: 'Other'
  },
  {
    th: 'TOR',
    en: 'TOR'
  },
  {
    th: 'ใบเสนอราคา',
    en: 'Quotation'
  },
  {
    th: 'Specification',
    en: 'Specification'
  },
  {
    th: 'CV',
    en: 'CV'
  },
  {
    th: 'อัตราค่าบริการ',
    en: 'Service Rates'
  },
  {
    th: 'หนังสือรับรองจริยธรรมการวิจัยในมนุษย์',
    en: 'Human Research Ethics Approval Certificate'
  },
  {
    th: 'เอกสารการยื่นขอจริยธรรมการวิจัยในมนุษย์',
    en: 'Human Research Ethics Submission Document'
  },
  {
    th: 'หนังสือรับรองจรรยาบรรณสัตว์เพื่องานทางวิทยาศาสตร์',
    en: 'Animal Ethics Approval Certificate for Scientific Use'
  },
  {
    th: 'เอกสารการยื่นขอจรรยาบรรณสัตว์เพื่องานทางวิทยาศาสตร์',
    en: 'Animal Ethics Submission Document for Scientific Use'
  },
  {
    th: 'หนังสือแจ้งการเก็บ จัดหา หรือรวบรวมพันธุ์พืชฯ ตามมาตรา 53',
    en: 'Section 53 Plant Variety Notification Document'
  },
  {
    th: 'เอกสารการยื่นขอหนังสือแจ้งการเก็บ จัดหา หรือรวบรวมพันธุ์พืชฯ',
    en: 'Section 53 Plant Variety Submission Document'
  }
]

export default {
  name: 'FileManagement',
  props: {
    files: {
      type: Array,
      default: () => []
    },
    isReadOnly: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'upload',
    'open',
    'replace',
    'remove',
    'update:files'
  ],
  computed: {
    isDarkTheme () {
      return Boolean(this.$store && this.$store.state && this.$store.state.darkMode)
    },
    isEnglishLocale () {
      const locale = this.$i18n && this.$i18n.locale ? String(this.$i18n.locale) : 'th'
      return locale.toLowerCase().startsWith('en')
    },
    text () {
      if (this.isEnglishLocale) {
        return {
          title: 'Supporting Documents Upload',
          subtitle: 'Upload PDF files only.',
          uploadButton: 'Upload File',
          documentType: 'Document Type',
          fileName: 'File Name',
          uploadedAt: 'Uploaded At',
          note: 'Note',
          manage: 'Manage',
          selectType: '-- Select type --',
          notePlaceholder: 'Enter a note...',
          remove: 'Delete',
          empty: '-- No supporting documents uploaded yet --'
        }
      }

      return {
        title: 'อัปโหลดเอกสารประกอบ',
        subtitle: 'อัปโหลดได้เฉพาะไฟล์ PDF',
        uploadButton: 'อัปโหลดไฟล์',
        documentType: 'ประเภทเอกสาร',
        fileName: 'ชื่อไฟล์',
        uploadedAt: 'วัน-เวลาที่อัปโหลด',
        note: 'หมายเหตุ',
        manage: 'จัดการ',
        selectType: '-- เลือกประเภท --',
        notePlaceholder: 'พิมพ์หมายเหตุ...',
        remove: 'ลบ',
        empty: '-- ยังไม่มีการอัปโหลดเอกสารประกอบ --'
      }
    },
    documentTypeOptions () {
      const optionMap = new Map()
      DOCUMENT_TYPE_OPTIONS.forEach((option) => {
        if (!option || (!option.th && !option.en)) return
        optionMap.set(`${option.th}|${option.en}`, option)
      })

      ;(Array.isArray(this.files) ? this.files : []).forEach((item) => {
        const rawType = String((item && item.type) || '').trim()
        if (!rawType) return
        const exists = Array.from(optionMap.values()).some(option => option.th === rawType || option.en === rawType)
        if (exists) return
        optionMap.set(`${rawType}|${rawType}`, { th: rawType, en: rawType })
      })

      return Array.from(optionMap.values())
    }
  },
  methods: {
    optionLabel (option, currentValue) {
      if (!option) return currentValue || ''
      const isThaiValue = currentValue === option.th
      const isEnglishValue = currentValue === option.en
      if (this.isEnglishLocale) return isThaiValue || isEnglishValue ? option.en : option.en
      return isThaiValue || isEnglishValue ? option.th : option.th
    },
    resolveOptionValue (option, currentValue) {
      if (!option) return currentValue || ''
      if (currentValue === option.en) return option.en
      return option.th
    },
    updateFile (index, key, value) {
      if (this.isReadOnly) return

      const updatedFiles = [...this.files]
      updatedFiles[index] = {
        ...updatedFiles[index],
        [key]: value
      }

      this.$emit('update:files', updatedFiles)
    }
  }
}
</script>

<style scoped>
.card {
  border: 1px solid rgba(234, 223, 206, 0.95);
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
}

.card-body {
  background: transparent;
}

.container-fluid.p-0.mt-4 {
  margin-top: 12px !important;
}

.file-header {
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px !important;
}

.btn-outline-dark {
  border-color: rgba(139, 18, 18, 0.40);
  color: #8b1212;
  background: rgba(255, 255, 255, 0.90);
}

.file-header .btn-outline-dark {
  white-space: nowrap;
}

.btn-outline-dark:hover {
  background: rgba(139, 18, 18, 0.08);
}

.table th {
  font-weight: 600;
  font-size: 14px;
}

.table th,
.table td {
  text-align: center;
  vertical-align: middle;
}

.table td.d-flex.justify-content-center {
  display: table-cell !important;
  vertical-align: middle !important;
  white-space: nowrap;
}

.table td.d-flex.justify-content-center > .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 6px;
}

.table-bordered th,
.table-bordered td {
  border-color: rgba(139, 18, 18, 0.30) !important;
  border-width: 1.5px !important;
}

.table-bordered {
  border-color: rgba(139, 18, 18, 0.30) !important;
}

.table-responsive {
  border-radius: 14px;
  overflow-x: auto;
  overflow-y: hidden;
  border: 1.5px solid rgba(139, 18, 18, 0.30);
  background: #fff;
  -webkit-overflow-scrolling: touch;
}

.table.table-bordered {
  border: 0 !important;
}

.table tbody tr:not(:last-child) td {
  border-bottom-color: rgba(139, 18, 18, 0.30) !important;
}

.table td .form-control {
  text-align: center;
}

.btn-outline-info,
.btn-outline-danger {
  padding: 2px 8px;
  white-space: nowrap;
}

.thead-custom th,
.table thead th {
  background: rgba(139, 18, 18, 0.10) !important;
  color: #111827 !important;
  white-space: nowrap;
  border-color: rgba(139, 18, 18, 0.30) !important;
  border-width: 1.5px !important;
  border-bottom: 1.5px solid rgba(139, 18, 18, 0.30) !important;
}

.table tbody tr:hover {
  background: rgba(197, 155, 58, 0.08);
}

.text-primary {
  color: #8b1212 !important;
}

@media (max-width: 992px) {
  .container-fluid.p-0.mt-4 {
    margin-top: 12px !important;
  }

  .file-header.mb-3 {
    margin-bottom: 10px !important;
  }
}

@media (max-width: 576px) {
  .container-fluid.p-0.mt-4 {
    margin-top: 12px !important;
  }

  .card-body {
    padding: 16px !important;
  }

  .file-header {
    align-items: flex-start !important;
  }

  .file-header > button.btn {
    align-self: flex-end;
  }
}

@media (max-width: 768px) {
  .table.table-bordered {
    min-width: 720px;
  }
}

@media (max-width: 576px) {
  td .btn.btn-sm.btn-outline-info,
  td .btn.btn-sm.btn-outline-danger {
    min-width: 64px;
    padding: 6px 8px;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    line-height: 1.1;
    gap: 4px;
  }

  td .btn.btn-sm.btn-outline-info .c-icon,
  td .btn.btn-sm.btn-outline-danger .c-icon {
    width: 18px;
    height: 18px;
    margin-right: 0 !important;
  }
}

.italic {
  font-style: italic;
}

.file-management-section--dark .card {
  border-color: #2d3b4e;
  background: #182334;
  box-shadow: 0 10px 28px rgba(5, 12, 22, 0.38);
}

.file-management-section--dark .card-body,
.file-management-section--dark .bg-white {
  background: #182334 !important;
}

.file-management-section--dark .text-dark,
.file-management-section--dark h5,
.file-management-section--dark .small,
.file-management-section--dark .text-muted,
.file-management-section--dark td,
.file-management-section--dark th {
  color: #d8e4f2 !important;
}

.file-management-section--dark .btn-outline-dark {
  border-color: #5f83ad;
  color: #e8f2ff;
  background: #102035;
}

.file-management-section--dark .btn-outline-dark:hover {
  background: #1f3a5a;
  border-color: #76a8dd;
  color: #f6fbff;
}

.file-management-section--dark .table-responsive {
  border-color: #344a62;
  background: #111d2c;
}

.file-management-section--dark .table,
.file-management-section--dark .table.table-bordered,
.file-management-section--dark .table tbody tr,
.file-management-section--dark .table tbody td {
  background: #111d2c !important;
  color: #dbe6f4 !important;
}

.file-management-section--dark .table-bordered,
.file-management-section--dark .table-bordered th,
.file-management-section--dark .table-bordered td,
.file-management-section--dark .table tbody tr:not(:last-child) td {
  border-color: #32475f !important;
}

.file-management-section--dark .thead-custom th,
.file-management-section--dark .table thead th {
  background: #1b2a3c !important;
  color: #eef5ff !important;
  border-color: #3a516a !important;
}

.file-management-section--dark .table tbody tr:hover {
  background: #1a2a3e !important;
}

.file-management-section--dark .table tbody tr:hover td {
  background: #1a2a3e !important;
}

.file-management-section--dark .table .form-control,
.file-management-section--dark .table select,
.file-management-section--dark .table input,
.file-management-section--dark .form-control,
.file-management-section--dark .form-select {
  background: #0f1b2a;
  color: #e8eef8;
  border-color: #33475f;
}

.file-management-section--dark .table .form-control::placeholder,
.file-management-section--dark .table input::placeholder {
  color: #95a9be;
}

.file-management-section--dark .table .form-control:focus,
.file-management-section--dark .table select:focus,
.file-management-section--dark .table input:focus,
.file-management-section--dark .form-control:focus,
.file-management-section--dark .form-select:focus {
  background: #102033;
  color: #f4f8ff;
  border-color: #72b4ff;
  box-shadow: 0 0 0 0.16rem rgba(114, 180, 255, 0.2);
}

.file-management-section--dark .table .form-control:disabled,
.file-management-section--dark .table select:disabled,
.file-management-section--dark .table input:disabled {
  background: #162636;
  color: #b9c8d8;
  border-color: #2d4057;
}

.file-management-section--dark a.text-primary {
  color: #9ec5ff !important;
}

.file-management-section--dark .btn-outline-info {
  color: #80d4ff;
  border-color: #2c8fb5;
  background: rgba(27, 88, 114, 0.12);
}

.file-management-section--dark .btn-outline-info:hover {
  color: #dff6ff;
  border-color: #48b8e4;
  background: rgba(42, 139, 177, 0.24);
}

.file-management-section--dark .btn-outline-danger {
  color: #ffb4b4;
  border-color: #b35f5f;
  background: rgba(128, 33, 33, 0.12);
}

.file-management-section--dark .btn-outline-danger:hover {
  color: #ffe8e8;
  border-color: #d98282;
  background: rgba(159, 52, 52, 0.28);
}

.file-management-section--dark .italic,
.file-management-section--dark .table .italic {
  color: #a9bbce !important;
}
</style>
