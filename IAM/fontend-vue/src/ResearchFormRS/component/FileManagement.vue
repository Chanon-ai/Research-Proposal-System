<template>
  <div class="container-fluid p-0 mt-4">
    <div class="card shadow-sm border-0">
      <div class="card-body p-4 bg-white">

        <div class="file-header d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 class="mb-1 font-weight-bold text-dark">
              อัปโหลดเอกสารประกอบ
            </h5>
            <div v-if="!isReadOnly" class="small text-muted">
              เลือกประเภทเอกสารก่อน แล้วอัปโหลดไฟล์ หรือกด Browse
            </div>
          </div>

          <button
            v-if="!isReadOnly"
            type="button"
            class="btn btn-outline-dark font-weight-bold"
            @click="$refs.fileInput.click()"
          >
            <CIcon name="cil-paperclip" class="me-1"/>
             อัปโหลดไฟล์
          </button>

          <input
            type="file"
            ref="fileInput"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            style="display: none"
            @change="$emit('upload', $event)"
          />
        </div>

        <div class="table-responsive">
          <table class="table table-bordered align-middle mb-0">
            <thead class="thead-custom" >
              <tr>
                <th style="width:25%">ประเภทเอกสาร</th>
                <th style="width:25%">ชื่อไฟล์</th>
                <th style="width:15%">วัน-เวลาที่อัปโหลด</th>
                <th style="width:20%">หมายเหตุ</th>
                <th v-if="!isReadOnly" style="width:15%" class="text-center">จัดการ</th>
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
                      -- เลือกประเภท --
                    </option>
                    <option>หลักฐานการผ่านการอบรมมาตรฐานการวิจัยในมนุษย์</option>
                    <option>หลักฐานการผ่านการอบรมมาตรฐานความปลอดภัยทางชีวภาพ</option>
                    <option>หลักฐานการผ่านการอบรมมาตรฐานความปลอดภัยห้องปฏิบัติการ</option>
                    <option>หลักฐานการผ่านการอบรมมาตรฐานความปลอดภัยการดำเนินการต่อสัตว์ฯ</option>
                    <option>อื่น ๆ</option>
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
                    placeholder="พิมพ์หมายเหตุ..."
                    :disabled="isReadOnly"
                  />
                </td>

                <td v-if="!isReadOnly" class="d-flex justify-content-center" style="gap: 12px;">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-info me-2"
                    @click="$emit('replace', index)"
                  >
                    <CIcon name="cil-settings" class="me-1"/>
                    แก้ไขไฟล์
                  </button>

                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    @click="$emit('remove', index)"
                  >
                    <CIcon name="cil-trash" class="me-1"/>
                    ลบ
                  </button>
                </td>
              </tr>

              <tr v-if="files.length === 0">
                <td :colspan="isReadOnly ? 4 : 5" class="text-center py-5 text-muted italic">
                  -- ยังไม่มีการอัปโหลดเอกสารประกอบ --
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
export default {
  name: "FileManagement",

  props: {
    files: {
      type: Array,
      default: () => []
    },
    // รับค่า isReadOnly จาก ResearchForm.vue
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

  methods: {
    updateFile(index, key, value) {
      if (this.isReadOnly) return; // ป้องกันการอัปเดตไฟล์เมื่อเป็น Read-only
      
      const updatedFiles = [...this.files];
      updatedFiles[index] = {
        ...updatedFiles[index],
        [key]: value
      };

      this.$emit('update:files', updatedFiles);
    }
  }
};
</script>

<style scoped>
.card {
  border: 1px solid rgba(234, 223, 206, 0.95);
  border-radius: 14px;
  overflow: hidden; /* ensure inner white background clips to rounded corners */
  background: #ffffff;
}

.card-body {
  background: transparent;
}

.container-fluid.p-0.mt-4 {
  /* Override Bootstrap .mt-4 (uses !important) so section spacing is consistent */
  margin-top: 12px !important;
}

.file-header {
  gap: 12px;
  flex-wrap: wrap;
  /* Override Bootstrap .mb-3 (uses !important) */
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

/* Action cell: this <td> currently uses Bootstrap .d-flex which breaks table-cell centering */
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
  /* Fix corner artifacts: clip table header/background to rounded container */
  border-radius: 14px;
  overflow-x: auto;
  overflow-y: hidden;
  border: 1.5px solid rgba(139, 18, 18, 0.30);
  background: #fff;
  -webkit-overflow-scrolling: touch;
}

.table.table-bordered {
  /* Outer border is handled by .table-responsive for clean rounded corners */
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

/* Light red header (force override against page-level table styles) */
.thead-custom th,
.table thead th {
  background: rgba(139, 18, 18, 0.10) !important;
  color: #111827 !important;
  white-space: nowrap;
  /* Match gridline color/weight with table body */
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
  /* Many phones/tablets are wider than 576px in landscape; still keep spacing tight */
  .container-fluid.p-0.mt-4 {
    margin-top: 12px !important;
  }

  .file-header.mb-3 {
    margin-bottom: 10px !important;
  }
}

@media (max-width: 576px) {
  /* Keep left/right spacing visually balanced on narrow screens */
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
  /* Force horizontal scroll instead of squeezing columns on small screens */
  .table.table-bordered {
    min-width: 720px;
  }
}

@media (max-width: 576px) {
  /* On phones: stack icon + label (2 lines) for better readability */
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
    margin-right: 0 !important; /* neutralize .me-1 */
  }
}

.italic {
  font-style: italic;
}
</style>
