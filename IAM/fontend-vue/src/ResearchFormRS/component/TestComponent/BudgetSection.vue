<template>
  <div class="budget-form-container w-100">
    <input type="file" ref="fileInput" accept=".pdf,application/pdf" style="display: none"
      @change="onFilePicked" />
    <div v-for="(cat, ci) in categories" :key="cat.title" class="mb-5">
      <div class="card shadow-sm border-0 mb-3 w-100">
        <div class="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center flex-wrap">
          <h6 class="m-0 font-weight-bold">
            <CIcon name="cil-money" class="me-2" /> {{ cat.title }}
          </h6>
          <div class="d-flex align-items-center mt-2 mt-md-0" style="gap: 10px;">
            <button type="button" class="btn btn-light btn-sm border-white text-white" @click="addManualRow(ci)">
              <CIcon name="cil-plus" class="me-1" /> เพิ่มรายการเอง
            </button>
            <button type="button" class="btn btn-light btn-sm border-white text-white" @click="triggerFileUpload(ci)">
              <CIcon name="cil-paperclip" class="me-1" /> แนบเอกสาร
            </button>
          </div>
        </div>

        <div class="card-body p-3 bg-light">
          <div v-if="cat.options && cat.options.length > 0" class="mb-3">
            <select :options="['', ...cat.options]" v-model="cat.selected" @change="addRow(ci)"
              class="form-control shadow-sm border-primary">
              <option value="">-- เลือกรายการย่อยเพื่อเพิ่มในตาราง --</option>
              <option v-for="option in cat.options" :key="option" :value="option">{{ option }}</option>
            </select>
          </div>

          <div class="table-responsive bg-white rounded shadow-sm border overflow-hidden w-100">
            <table class="table table-sm table-bordered table-striped mb-0 align-middle">
              <thead class="bg-primary text-white text-center font-weight-bold">
                <tr>
                  <th style="width: 25%">รายการ</th>
                  <th style="width: 25%">รายละเอียดตัวคูณ (เกณฑ์ มฟล. 2569)</th>
                  <th style="width: 12%">งบรวม (บาท)</th>
                  <th style="width: 10%">งวด 1</th>
                  <th style="width: 10%">งวด 2</th>
                  <th style="width: 10%">งวด 3</th>
                  <th style="width: 40px">#</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!cat.rows || cat.rows.length === 0">
                  <td colspan="7" class="text-center py-4 text-muted">ยังไม่มีรายการในหมวดนี้</td>
                </tr>
                <tr v-for="(r, ri) in cat.rows || []" :key="r.id">

                  <td class="px-3 py-2">
                    <div class="d-flex align-items-center flex-wrap" style="gap: 5px;">
                      <span v-if="r.fileCategory"
                        :class="['badge text-white px-2 py-1', getCategoryColor(r.fileCategory)]"
                        style="font-size: 9px; border-radius: 4px;">
                        {{ r.fileCategory }}
                      </span>

                      <div v-if="!r.isManual && !r.fileUrl" class="font-weight-bold text-dark">{{ r.name }}</div>
                      <input v-else v-model="r.name" type="text" size="sm" class="form-control form-control-sm mb-0 flex-grow-1"
                        placeholder="ระบุชื่อรายการ..." />
                    </div>

                    <div v-if="r.fileUrl" class="mt-2 p-2 border rounded bg-white shadow-sm">
                      <div class="d-flex align-items-end" style="gap: 10px;">
                        <div class="flex-grow-1">
                          <label class="small font-weight-bold mb-1 d-block text-muted">เลือกหมวดหมู่เอกสาร:</label>
                          <select v-model="r.fileCategory" class="form-select form-select-sm mb-0 border-primary" style="font-size: 11px;">
                            <option value="">-- เลือกหมวดหมู่ --</option>
                            <option v-for="cat in fileCategories" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
                          </select>
                        </div>

                        <div class="pb-0">
                          <button type="button" class="btn btn-info btn-outline btn-sm py-1 px-3 d-flex align-items-center"
                            style="height: 31px; font-weight: 600;" @click="viewFile(r.fileUrl)">
                            <CIcon name="cil-folder" class="me-1" /> เปิดดู
                          </button>
                        </div>
                      </div>

                      <div class="small text-muted mt-2 text-truncate border-top pt-1"
                        style="max-width: 100%; font-size: 10px;">
                        <CIcon name="cil-paperclip" class="me-1" /> {{ r.fileName }}
                      </div>
                    </div>
                  </td>

                  <td style="min-width: 300px;">
                    <div class="d-flex flex-wrap align-items-center" style="gap: 12px;">
                      <div v-for="(m, mi) in (r.multipliers || [])" :key="mi"
                        class="multiplier-group position-relative">

                        <button v-if="r.isManual && r.multipliers && r.multipliers.length > 1" type="button"
                          class="btn btn-danger btn-sm p-0 position-absolute"
                          style="top: -8px; right: -8px; z-index: 10; background: white; border-radius: 50%;"
                          @click="removeMultiplier(r, mi)">
                          <CIcon name="cil-x-circle" />
                        </button>

                        <input type="text" v-model="m.label" class="form-control form-control-sm text-center mb-1"
                          style="width: 80px; font-size: 13px; background: #eee;" placeholder="หน่วย" />

                        <input type="number" v-model.number="m.val" class="form-control form-control-sm text-center"
                          style="width: 80px;" @input="calculateRowTotal(r)" @keypress="preventMinus" />
                      </div>

                      <button v-if="r.isManual" type="button" class="btn btn-info btn-outline btn-sm" @click="addMultiplier(r)"
                        title="เพิ่มตัวคูณ">
                        <CIcon name="cil-plus" />
                      </button>
                    </div>
                  </td>

                  <td class="py-2 align-middle">
                    <div class="text-right font-weight-bold text-primary py-1 px-2 border rounded bg-light shadow-none">
                      {{ Number(r.total || 0).toLocaleString() }}
                    </div>
                  </td>

                  <td v-for="p in ['p1', 'p2', 'p3']" :key="p" class="py-2 align-middle">
                    <input type="number" v-model.number="r[p]"
                      :class="['form-control form-control-sm mb-0 text-right', r.errors[p] ? 'is-invalid-bg text-danger border-danger' : '']"
                      @input="validateInstallments(r)" />
                    <label v-if="r.errors[p]" class="text-danger d-block mt-1 font-weight-bold text-center"
                      style="font-size: 13px;">{{ r.errors[p] }}</label>
                  </td>

                  <td class="text-center py-2 align-middle">
                    <button type="button" class="btn btn-danger btn-outline btn-sm px-2 py-2 font-weight-bold"
                      @click="removeRow(ci, ri)">
                      <CIcon name="cil-trash" class="me-1" />ลบรายการ
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div class="card mt-5 border-primary shadow bg-white w-100 overflow-hidden">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center flex-wrap" style="gap: 20px;">
          <div>
            <h4 class="m-0 font-weight-bold text-dark">สรุปงบประมาณรวมทั้งสิ้น (พ.ศ. 2569)</h4>
            <small class="text-muted">คำนวณอัตโนมัติตามหลักเกณฑ์การตั้งงบประมาณมหาวิทยาลัยแม่ฟ้าหลวง</small>
            <div class="h2 m-0 text-primary font-weight-bold mt-2">
              {{ grandTotal.toLocaleString() }} <small class="text-muted" style="font-size: 14px">บาท</small>
            </div>
          </div>
          <div class="d-flex" style="gap: 12px;">
            <button type="button" class="btn btn-danger btn-outline btn-sm px-4 py-2 font-weight-bold" @click="resetForm">
              <CIcon name="cil-trash" class="me-1" /> ล้างฟอร์มทั้งหมด
            </button>
            <button type="button" class="btn btn-primary btn-sm px-5 py-2 font-weight-bold shadow" @click="saveDraft">
              <CIcon name="cil-save" class="me-1" /> บันทึกแบบร่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Swal from "sweetalert2";

export default {
  name: "BudgetSection",
  props: {
    modelValue: {
      type: Object,
      default: () => ({
        categories: [],
        grandTotal: 0
      })
    }
  }
  ,
  emits: ['update:modelValue'],

  data() {
    return {
      activeCategoryIndex: null,
      fileCategories: [
        { label: "TOR (Term of References)", value: "TOR" },
        { label: "ใบเสนอราคา / Quotation", value: "Quotation" },
        { label: "Specification", value: "Specification" },
        { label: "CV", value: "CV" },
        { label: "อัตราค่าบริการต่าง ๆ / Service Rates", value: "Service Rates" }
      ]
    }
  },
  computed: {
    budgetData: {
      get() {
        return this.modelValue || {
          categories: [],
          grandTotal: 0
        }
      },
      set(val) {
        this.$emit("update:modelValue", val)
      }
    },

    categories: {
      get() {
        return Array.isArray(this.budgetData?.categories)
          ? this.budgetData.categories
          : []
      },
      set(val) {
        this.budgetData = {
          ...this.budgetData,
          categories: val
        }
      }
    },
    grandTotal() {
      if (!this.categories || !Array.isArray(this.categories)) return 0

      return this.categories.reduce((sum, c) =>
        sum + (c.rows || []).reduce((s, r) => s + Number(r.total || 0), 0)
        , 0)
    }
  },
  mounted() {
    console.log('BudgetSection mounted, modelValue:', this.modelValue);
    
    const defaultCats = [
      this.makeCat("หมวดค่าตอบแทน", ["ค่าตอบแทน – นักศึกษาช่วยงานด้านวิชาการ", "ค่าตอบแทน – นักศึกษาช่วยงานทั่วไป", "ค่าตอบแทน – อาสาสมัคร", "ค่าตอบแทน – ผู้ให้ข้อมูล"]),
      this.makeCat("หมวดค่าใช้สอย", ["ค่าอาหารกลางวัน (120.-)", "ค่าอาหารว่าง (50.-)", "จ้างเหมาวิเคราะห์ทดสอบ (TOR)"]),
      this.makeCat("หมวดค่าเดินทาง", ["ค่าเบี้ยเลี้ยง (350.-/วัน)", "ค่าที่พัก (เหมา 800.-)", "รถยนต์ส่วนบุคคล (4.-/กม.)"]),
      this.makeCat("หมวดค่าวัสดุ", ["ค่าวัสดุสำนักงาน", "ค่าวัสดุคอมพิวเตอร์", "น้ำมันเชื้อเพลิงพาหนะเช่า"]),
      this.makeCat("หมวดค่าสาธารณูปโภค", []),
      this.makeCat("หมวดครุภัณฑ์", [])
    ]
    const existing = this.modelValue?.categories || [];
    const map = new Map(existing.map(c => [c.title, c]));

    const finalCats = defaultCats.map(def => {
      const existingCat = map.get(def.title);

      if (existingCat) {
        return {
          ...def,
          ...existingCat,
          rows: existingCat.rows || []
        };
      }

      return def;
    });

    console.log('Final categories to emit:', finalCats);

    this.$emit("update:modelValue", {
      categories: finalCats,
      grandTotal: this.grandTotal
    });
  },
  watch: {
    categories: {
      deep: true,
      handler(newVal) {
        this.budgetData = {
          ...this.budgetData,
          categories: newVal
        };
      }
    }
  }
  ,
  methods: {
    makeCat(title, options = []) { return { title, options, selected: "", rows: [] }; },
    addRow(ci) {
      // ใช้ $nextTick เพื่อรอให้ v-model ของ Dropdown อัปเดตค่าล่าสุดก่อน
      this.$nextTick(() => {
        const cat = this.categories[ci];

        // ตรวจสอบว่ามีการเลือกรายการจริงหรือไม่
        if (!cat.selected) return;

        // สร้างข้อมูลแถวใหม่จากค่าที่เลือก
        const nr = this.newRow(cat.selected, false, null, cat.title);

        // เพิ่มแถวใหม่ลงในรายการของหมวดนั้น
        cat.rows.push(nr);

        // สั่งให้คำนวณยอดรวมของแถวที่เพิ่งเพิ่มทันที (เพื่อให้ยอดรวมไม่เป็น 0 ในจังหวะแรก)
        this.calculateRowTotal(nr);

        // ล้างค่าที่เลือกใน Dropdown เพื่อให้พร้อมสำหรับการเลือกครั้งต่อไป
        cat.selected = "";
      });
    },
    addManualRow(catIndex) {
      this.categories[catIndex].rows.push({
        id: Date.now() + Math.random(),
        name: "",
        isManual: true,
        multipliers: [
          { label: "จำนวน", val: 1 },
          { label: "หน่วย", val: 1 },
          { label: "ราคา/หน่วย", val: 0 }
        ],
        p1: 0, p2: 0, p3: 0, total: 0,
        errors: { p1: "", p2: "", p3: "" },
        fileUrl: null
      });
    },
    // ฟังก์ชันลบตัวคูณช่องที่ระบุ
    removeMultiplier(row, index) {
      if (row.multipliers && row.multipliers.length > 1) {
        // ลบสมาชิกออกจากตำแหน่งที่เลือก
        row.multipliers.splice(index, 1);

        // สำคัญ: ต้องสั่งคำนวณยอดรวมแถวใหม่ทันทีที่ลบช่องออก
        this.calculateRowTotal(row);
      }
    },
    // ฟังก์ชันเพิ่มตัวคูณ (ปรับปรุงให้ใช้ calculateRowTotal ที่รับ row)
    addMultiplier(row) {
      if (!row.multipliers) row.multipliers = [];
      row.multipliers.push({ label: "ตัวคูณใหม่", val: 1 });
      this.calculateRowTotal(row);
    },

    newRow(name, isManual, fileName = null, catTitle = "", fileUrl = null) {
      let multipliers = [];
      if (name.includes("วิชาการ")) multipliers = [{ label: "ชม.", val: 0 }, { label: "คน", val: 0 }, { label: "บาท", val: 60 }];
      else if (name.includes("ทั่วไป")) multipliers = [{ label: "ชม.", val: 0 }, { label: "คน", val: 0 }, { label: "บาท", val: 30 }];
      else if (name.includes("อาหารกลางวัน")) multipliers = [{ label: "มื้อ", val: 0 }, { label: "คน", val: 0 }, { label: "บาท", val: 120 }];
      else if (name.includes("อาหารว่าง")) multipliers = [{ label: "มื้อ", val: 0 }, { label: "คน", val: 0 }, { label: "บาท", val: 50 }];
      else if (name.includes("เบี้ยเลี้ยง")) multipliers = [{ label: "วัน", val: 0 }, { label: "คน", val: 0 }, { label: "บาท", val: 350 }];
      else if (name.includes("รถยนต์ส่วนบุคคล")) multipliers = [{ label: "กม.", val: 0 }, { label: "รอบ", val: 2 }, { label: "บาท", val: 4 }];
      else if (catTitle === "หมวดค่าวัสดุ" || name.includes("จ้างเหมา")) multipliers = [{ label: "หน่วย", val: 0 }, { label: "บาท", val: 0 }];

      return {
        id: Date.now() + Math.random(),
        name, detail: "", p1: 0, p2: 0, p3: 0, total: 0,
        fileCategory: "",
        isManual, fileName, fileUrl, multipliers,
        errors: { p1: "", p2: "", p3: "" }
      };
    },
    // เพิ่มใน methods
    getCategoryColor(cat) {
      switch (cat) {
        case 'TOR': return 'bg-purple'; // สีม่วง
        case 'Quotation': return 'bg-success'; // สีเขียว
        case 'Specification': return 'bg-info'; // สีฟ้า
        case 'CV': return 'bg-warning text-dark'; // สีเหลือง
        case 'Service Rates': return 'bg-primary'; // สีน้ำเงิน
        default: return 'bg-secondary';
      }
    },
    getFileExtension(filename) { return filename ? filename.split('.').pop() : ""; },
    getFileBadgeClass(filename) {
      const ext = this.getFileExtension(filename).toLowerCase();
      if (ext === 'pdf') return 'badge-danger';
      if (['xls', 'xlsx', 'csv'].includes(ext)) return 'badge-success';
      if (['doc', 'docx'].includes(ext)) return 'badge-primary';
      if (['jpg', 'jpeg', 'png'].includes(ext)) return 'badge-warning';
      return 'badge-secondary';
    },

    calculateManual(event, row) {
      const value = event.target.value;

      if (!value) {
        row.total = 0;
        return;
      }

      if (!/^[0-9+\-*/().\s]+$/.test(value)) return;


      try {
        const result = Function('"use strict";return (' + value + ')')();
        row.total = isFinite(result) ? result : 0;
      } catch {
        row.total = 0;
      }
    }
    ,
    calculateRowTotal(row) {
      if (row.multipliers && row.multipliers.length > 0) {
        row.total = row.multipliers.reduce((acc, m) => {
          const val = (m.val === "" || m.val === null) ? 0 : Number(m.val);
          return acc * val;
        }, 1);
      } else {
        row.total = 0;
      }

      this.validateInstallments(row);
    }
    ,
    validateInstallments(row) {
      const p1 = Number(row.p1 || 0);
      const p2 = Number(row.p2 || 0);
      const p3 = Number(row.p3 || 0);

      const sum = p1 + p2 + p3;

      if (sum > row.total) {
        row.errors.p1 = "ยอดรวมเกินงบประมาณ";
        row.errors.p2 = "ยอดรวมเกินงบประมาณ";
        row.errors.p3 = "ยอดรวมเกินงบประมาณ";
      } else {
        row.errors.p1 = "";
        row.errors.p2 = "";
        row.errors.p3 = "";
      }
    }
    ,
    triggerFileUpload(ci) { this.activeCategoryIndex = ci; this.$refs.fileInput.click(); },
    onFilePicked(event) {
      const file = event.target.files[0];
      if (file && this.activeCategoryIndex !== null) {
        const fileUrl = URL.createObjectURL(file);
        const cat = this.categories[this.activeCategoryIndex];

        // สร้าง Row ใหม่โดยระบุชื่อไฟล์เป็นชื่อรายการเบื้องต้น และตรวจสอบว่า multipliers ไม่เป็น null
        const rowData = this.newRow(file.name, true, file.name, cat.title, fileUrl);

        // ถ้า multipliers เป็น null ให้กำหนดค่าเริ่มต้นให้ทันที
        if (!rowData.multipliers) {
          rowData.multipliers = [
            { label: "จำนวน", val: 1 },
            { label: "บาท", val: 0 }
          ];
        }

        cat.rows.push(rowData);
      }
      event.target.value = "";
    },
    viewFile(url) { window.open(url, '_blank'); },
    removeRow(ci, ri) {
      const row = this.categories[ci].rows[ri];
      if (row.fileUrl) URL.revokeObjectURL(row.fileUrl);
      this.categories[ci].rows.splice(ri, 1);
    },
    resetForm() {
      Swal.fire({
        title: "ยืนยันการรีเซ็ต?",
        text: "ข้อมูลทั้งหมดในตารางจะถูกลบ และไม่สามารถกู้คืนได้",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "ใช่, รีเซ็ตเลย",
        cancelButtonText: "ยกเลิก"
      }).then((result) => {
        if (result.isConfirmed) {

          this.categories.forEach(c => {
            c.rows.forEach(r => {
              if (r.fileUrl) URL.revokeObjectURL(r.fileUrl);
            });
            c.rows = [];
          });

          this.activeCategoryIndex = null;

          this.$emit('update:modelValue', {
            categories: this.categories,
            grandTotal: this.grandTotal
          });
          Swal.fire({
            icon: "success",
            title: "รีเซ็ตเรียบร้อย",
            timer: 1500,
            showConfirmButton: false
          });
        }
      });
    }
    ,
    saveDraft() {
      const budgetData = {
        categories: this.categories,
        grandTotal: this.grandTotal
      };

      localStorage.setItem("budgetData", JSON.stringify(budgetData));

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "บันทึกเรียบร้อย",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });


    },
    preventMinus(event) {
      if (event.key === '-' || event.key === 'e' || event.key === 'E') {
        event.preventDefault();
      }
    }

  }
};
</script>

<style scoped>
/* ธีมขยายเต็มพื้นที่และเส้นคั่นสวยงาม */
.budget-form-container {
  max-width: 100%;
}

.table td .form-control {
  border: 1px solid #d8dbe0;
  border-radius: 4px;
}

.is-invalid-bg {
  background-color: #fff5f5 !important;
  transition: all 0.3s ease;
}

.bg-light {
  background-color: #f8f9fa !important;
}

.border-primary {
  border-color: #321fdb !important;
}

/* Badge สีมาตรฐาน Bootstrap */
.badge-danger {
  background-color: #e55353;
  color: white;
}

.badge-success {
  background-color: #2eb85c;
  color: white;
}

.badge-primary {
  background-color: #321fdb;
  color: white;
}

.badge-warning {
  background-color: #f9b115;
  color: white;
}

.badge-secondary {
  background-color: #ced4da;
  color: #4f5d73;
}

/* การตกแต่งตารางเพิ่มเติม */
.table thead th {
  vertical-align: middle;
  padding: 10px;
}

.table-sm td,
.table-sm th {
  padding: 0.5rem;
}

.bg-purple {
  background-color: #6f42c1 !important;
}

.bg-warning {
  background-color: #f9b115 !important;
}
</style>