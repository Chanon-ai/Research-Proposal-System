<template>
  <div class="signature-card">
    <div class="card">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0">ลงลายเซ็นต์</h5>
      </div>
      <div class="card-body">
        
        <div class="row mb-5">
          <div class="col-12">
            <h6 class="section-title">หัวหน้าโครงการวิจัย</h6>
          </div>
          <div class="col-md-4">
            <div class="signature-box">
              <p class="text-center mb-2">ลงชื่อ</p>
              
              <div class="signature-area mb-3">
                <div v-if="!signatures.projectLeader.completed">
                  
                  <div v-if="isReadOnly" class="upload-container text-center p-3 border rounded bg-light text-muted d-flex align-items-center justify-content-center" style="min-height: 150px;">
                    - ไม่มีลายเซ็น -
                  </div>

                  <div v-else>
                    <div class="btn-group w-100 mb-2" role="group">
                      <button type="button" class="btn btn-sm" :class="signatures.projectLeader.mode === 'draw' ? 'btn-primary' : 'btn-outline-primary'" @click="setSignatureMode('projectLeader', 'draw')">วาดลายเซ็น</button>
                      <button type="button" class="btn btn-sm" :class="signatures.projectLeader.mode === 'upload' ? 'btn-primary' : 'btn-outline-primary'" @click="setSignatureMode('projectLeader', 'upload')">แนบรูปภาพ</button>
                    </div>

                    <div v-if="signatures.projectLeader.mode === 'draw'">
                      <div class="signature-canvas-container">
                        <canvas 
                          ref="canvas-leader" 
                          class="signature-canvas"
                          @mousedown="startDrawing('projectLeader', $event)"
                          @mousemove="draw('projectLeader', $event)"
                          @mouseup="stopDrawing('projectLeader')"
                          @mouseleave="stopDrawing('projectLeader')"
                          @touchstart.prevent="startDrawing('projectLeader', $event)"
                          @touchmove.prevent="draw('projectLeader', $event)"
                          @touchend.prevent="stopDrawing('projectLeader')"
                        ></canvas>
                      </div>
                    </div>

                    <div v-if="signatures.projectLeader.mode === 'upload'" class="upload-container text-center p-3 border rounded bg-white">
                      <input type="file" accept="image/*" class="form-control form-control-sm mb-2" @change="handleFileUpload('projectLeader', $event)">
                      <small class="text-muted">รองรับไฟล์ภาพ (PNG, JPG)</small>
                    </div>
                  </div>
                </div>

                <div v-else class="signature-completed text-center">
                  <img :src="signatures.projectLeader.data" class="signature-image" alt="Signature">
                </div>
              </div>

              <p class="text-center mb-1">( {{ projectLeader.name || '....................................................' }} )</p>
              <p class="text-center mb-1">หัวหน้าโครงการวิจัย</p>
              <p class="text-center text-muted small mb-3">วันที่ {{ signatures.projectLeader.timestamp || '....................................' }}</p>

              <div class="d-flex justify-content-center mt-auto" style="gap: 7px;" v-if="!isReadOnly">
                <template v-if="!signatures.projectLeader.completed">
                  <button type="button" class="btn btn-sm btn-outline-secondary me-2" @click="clearSignature('projectLeader')" v-if="signatures.projectLeader.mode === 'draw'">ลบ</button>
                  <button type="button" class="btn btn-sm btn-success text-white" @click="saveSignature('projectLeader')" v-if="signatures.projectLeader.mode === 'draw'">บันทึก</button>
                </template>
                <template v-else>
                  <button @click="editSignature('projectLeader')" class="btn btn-sm btn-outline-primary"><i class="cil-pencil"></i> แก้ไข</button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="row mb-5" v-if="coResearchers && coResearchers.length > 0">
          <div class="col-12">
            <h6 class="section-title">ผู้ร่วมโครงการวิจัย</h6>
          </div>
          <div class="col-md-4 mb-4" v-for="(researcher, index) in coResearchers" :key="'co-' + index">
            <div class="signature-box" v-if="signatures['coResearcher-' + index]">
              <p class="text-center mb-2">ลงชื่อ</p>
              
              <div class="signature-area mb-3">
                <div v-if="!signatures['coResearcher-' + index].completed">
                  
                  <div v-if="isReadOnly" class="upload-container text-center p-3 border rounded bg-light text-muted d-flex align-items-center justify-content-center" style="min-height: 150px;">
                    - ไม่มีลายเซ็น -
                  </div>

                  <div v-else>
                    <div class="btn-group w-100 mb-2" role="group">
                      <button type="button" class="btn btn-sm" :class="signatures['coResearcher-' + index].mode === 'draw' ? 'btn-primary' : 'btn-outline-primary'" @click="setSignatureMode('coResearcher-' + index, 'draw')">วาด</button>
                      <button type="button" class="btn btn-sm" :class="signatures['coResearcher-' + index].mode === 'upload' ? 'btn-primary' : 'btn-outline-primary'" @click="setSignatureMode('coResearcher-' + index, 'upload')">แนบรูป</button>
                    </div>

                    <div v-if="signatures['coResearcher-' + index].mode === 'draw'">
                      <div class="signature-canvas-container">
                        <canvas 
                          :ref="'canvas-co-' + index" 
                          class="signature-canvas"
                          @mousedown="startDrawing('coResearcher-' + index, $event)"
                          @mousemove="draw('coResearcher-' + index, $event)"
                          @mouseup="stopDrawing('coResearcher-' + index)"
                          @mouseleave="stopDrawing('coResearcher-' + index)"
                          @touchstart.prevent="startDrawing('coResearcher-' + index, $event)"
                          @touchmove.prevent="draw('coResearcher-' + index, $event)"
                          @touchend.prevent="stopDrawing('coResearcher-' + index)"
                        ></canvas>
                      </div>
                    </div>

                    <div v-if="signatures['coResearcher-' + index].mode === 'upload'" class="upload-container text-center p-3 border rounded bg-white">
                      <input type="file" accept="image/*" class="form-control form-control-sm mb-2" @change="handleFileUpload('coResearcher-' + index, $event)">
                    </div>
                  </div>
                </div>

                <div v-else class="signature-completed text-center">
                  <img :src="signatures['coResearcher-' + index].data" class="signature-image" alt="Signature">
                </div>
              </div>

              <p class="text-center mb-1">( {{ researcher.name || '....................................................' }} )</p>
              <p class="text-center mb-1">ผู้ร่วมโครงการวิจัย</p>
              <p class="text-center text-muted small mb-3">วันที่ {{ signatures['coResearcher-' + index].timestamp || '....................................' }}</p>

              <div class="d-flex justify-content-center mt-auto" style="gap: 7px;" v-if="!isReadOnly">
                <template v-if="!signatures['coResearcher-' + index].completed">
                  <button type="button" class="btn btn-sm btn-outline-secondary me-2" @click="clearSignature('coResearcher-' + index)" v-if="signatures['coResearcher-' + index].mode === 'draw'">ลบ</button>
                  <button type="button" class="btn btn-sm btn-success text-white" @click="saveSignature('coResearcher-' + index)" v-if="signatures['coResearcher-' + index].mode === 'draw'">บันทึก</button>
                </template>
                <template v-else>
                  <button @click="editSignature('coResearcher-' + index)" class="btn btn-sm btn-outline-primary"><i class="cil-pencil"></i> แก้ไข</button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="row mb-4" v-if="advisors && advisors.length > 0">
          <div class="col-12">
            <h6 class="section-title">ที่ปรึกษาโครงการวิจัย</h6>
          </div>
          <div class="col-md-4 mb-4" v-for="(advisor, index) in advisors" :key="'advisor-' + index">
            <div class="signature-box" v-if="signatures['advisor-' + index]">
              <p class="text-center mb-2">ลงชื่อ</p>
              
              <div class="signature-area mb-3">
                <div v-if="!signatures['advisor-' + index].completed">
                  
                  <div v-if="isReadOnly" class="upload-container text-center p-3 border rounded bg-light text-muted d-flex align-items-center justify-content-center" style="min-height: 150px;">
                    - ไม่มีลายเซ็น -
                  </div>

                  <div v-else>
                    <div class="btn-group w-100 mb-2" role="group">
                      <button type="button" class="btn btn-sm" :class="signatures['advisor-' + index].mode === 'draw' ? 'btn-primary' : 'btn-outline-primary'" @click="setSignatureMode('advisor-' + index, 'draw')">วาด</button>
                      <button type="button" class="btn btn-sm" :class="signatures['advisor-' + index].mode === 'upload' ? 'btn-primary' : 'btn-outline-primary'" @click="setSignatureMode('advisor-' + index, 'upload')">แนบรูป</button>
                    </div>

                    <div v-if="signatures['advisor-' + index].mode === 'draw'">
                      <div class="signature-canvas-container">
                        <canvas 
                          :ref="'canvas-advisor-' + index" 
                          class="signature-canvas"
                          @mousedown="startDrawing('advisor-' + index, $event)"
                          @mousemove="draw('advisor-' + index, $event)"
                          @mouseup="stopDrawing('advisor-' + index)"
                          @mouseleave="stopDrawing('advisor-' + index)"
                          @touchstart.prevent="startDrawing('advisor-' + index, $event)"
                          @touchmove.prevent="draw('advisor-' + index, $event)"
                          @touchend.prevent="stopDrawing('advisor-' + index)"
                        ></canvas>
                      </div>
                    </div>

                    <div v-if="signatures['advisor-' + index].mode === 'upload'" class="upload-container text-center p-3 border rounded bg-white">
                      <input type="file" accept="image/*" class="form-control form-control-sm mb-2" @change="handleFileUpload('advisor-' + index, $event)">
                    </div>
                  </div>
                </div>

                <div v-else class="signature-completed text-center">
                  <img :src="signatures['advisor-' + index].data" class="signature-image" alt="Signature">
                </div>
              </div>

              <p class="text-center mb-1">( {{ advisor.name || '....................................................' }} )</p>
              <p class="text-center mb-1">ที่ปรึกษาโครงการวิจัย</p>
              <p class="text-center text-muted small mb-3">วันที่ {{ signatures['advisor-' + index].timestamp || '....................................' }}</p>

              <div class="d-flex justify-content-center mt-auto" style="gap: 7px;" v-if="!isReadOnly">
                <template v-if="!signatures['advisor-' + index].completed">
                  <button type="button" class="btn btn-sm btn-outline-secondary me-2" @click="clearSignature('advisor-' + index)" v-if="signatures['advisor-' + index].mode === 'draw'">ลบ</button>
                  <button type="button" class="btn btn-sm btn-success text-white" @click="saveSignature('advisor-' + index)" v-if="signatures['advisor-' + index].mode === 'draw'">บันทึก</button>
                </template>
                <template v-else>
                  <button @click="editSignature('advisor-' + index)" class="btn btn-sm btn-outline-primary"><i class="cil-pencil"></i> แก้ไข</button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="row mt-3">
          <div class="col-12">
            <div class="alert alert-info mb-0">
              <small>
                <i class="cil-info-circle me-2"></i>
                หมายเหตุ: ให้ผู้วิจัยทุกคนลงนามในช่องที่กำหนดเพื่อยืนยันการเข้าร่วมโครงการวิจัย
              </small>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SignatureCard',
  model: {
    prop: 'modelValue',
    event: 'update:modelValue'
  },
  props: {
    modelValue: {
      type: Object,
      default: null
    },
    projectLeader: {
      type: Object,
      default: () => ({ name: '', affiliation: '' })
    },
    coResearchers: {
      type: Array,
      default: () => []
    },
    advisors: {
      type: Array,
      default: () => []
    },
    // เพิ่ม props isReadOnly 
    isReadOnly: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      suppressEmit: false,
      signatures: {
        projectLeader: { data: null, completed: false, timestamp: null, mode: 'draw' }
      },
      isDrawing: {},
    }
  },
  mounted() {
    this.initializeSignatures();
    this.applyModelValue(this.modelValue)
    this.$nextTick(() => {
      this.setupCanvases();
    });
  },
  watch: {
    modelValue: {
      immediate: false,
      deep: true,
      handler(val) {
        this.applyModelValue(val)
      }
    },
    coResearchers: {
      handler() {
        this.initializeSignatures();
        this.applyModelValue(this.modelValue)
        this.$nextTick(() => this.setupCanvases());
      },
      deep: true
    },
    advisors: {
      handler() {
        this.initializeSignatures();
        this.applyModelValue(this.modelValue)
        this.$nextTick(() => this.setupCanvases());
      },
      deep: true
    }
  },
  methods: {
    cloneSignatures(payload) {
      // Break shared references between parent (v-model) and internal state.
      // Safe here because signatures only contain plain objects + base64 strings.
      try {
        return JSON.parse(JSON.stringify(payload || {}))
      } catch (e) {
        return payload ? { ...payload } : {}
      }
    },
    applyModelValue(val) {
      if (!val || typeof val !== 'object') return
      this.suppressEmit = true

      // Ensure required keys exist before merging.
      this.initializeSignatures()

      const incomingAll = this.cloneSignatures(val)

      Object.keys(this.signatures || {}).forEach((key) => {
        const incoming = incomingAll && incomingAll[key] ? incomingAll[key] : null
        if (!incoming) return
        this.$set(this.signatures, key, { ...this.signatures[key], ...incoming })
      })

      this.$nextTick(() => {
        this.suppressEmit = false
      })
    },
    emitModelValue() {
      if (this.suppressEmit) return
      if (this.isReadOnly) return
      this.$emit('update:modelValue', this.cloneSignatures(this.signatures))
    },
    initializeSignatures() {
      if (!this.signatures.projectLeader) {
        this.$set(this.signatures, 'projectLeader', { data: null, completed: false, timestamp: null, mode: 'draw' });
      }
      
      this.coResearchers.forEach((_, index) => {
        const key = 'coResearcher-' + index;
        if (!this.signatures[key]) {
          this.$set(this.signatures, key, { data: null, completed: false, timestamp: null, mode: 'draw' });
        }
      });
      
      this.advisors.forEach((_, index) => {
        const key = 'advisor-' + index;
        if (!this.signatures[key]) {
          this.$set(this.signatures, key, { data: null, completed: false, timestamp: null, mode: 'draw' });
        }
      });
    },
    
    setSignatureMode(signatureId, mode) {
      this.signatures[signatureId].mode = mode;
      if (mode === 'draw') {
        this.$nextTick(() => {
          this.setupCanvas(signatureId);
        });
      }
    },

    handleFileUpload(signatureId, event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.signatures[signatureId].data = e.target.result;
        this.signatures[signatureId].completed = true;
        this.signatures[signatureId].timestamp = this.getThaiTimestamp();
        this.emitModelValue();
      };
      reader.readAsDataURL(file);
    },

    getThaiTimestamp() {
      const now = new Date();
      return now.toLocaleDateString('th-TH', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    },

    getCanvasElement(signatureId) {
      let refName = '';
      if (signatureId === 'projectLeader') {
        refName = 'canvas-leader';
      } else if (signatureId.startsWith('coResearcher-')) {
        refName = 'canvas-co-' + signatureId.split('-')[1];
      } else if (signatureId.startsWith('advisor-')) {
        refName = 'canvas-advisor-' + signatureId.split('-')[1];
      }
      
      const ref = this.$refs[refName];
      if (!ref) return null;
      return Array.isArray(ref) ? ref[0] : ref;
    },

    setupCanvases() {
      if (this.isReadOnly) return; // ไม่จำเป็นต้องเซ็ตอัป canvas ถ้าเป็นโหมด Read-only
      if (!this.signatures.projectLeader.completed && this.signatures.projectLeader.mode === 'draw') this.setupCanvas('projectLeader');
      
      this.coResearchers.forEach((_, index) => {
        if (!this.signatures['coResearcher-' + index].completed && this.signatures['coResearcher-' + index].mode === 'draw') this.setupCanvas('coResearcher-' + index);
      });
      
      this.advisors.forEach((_, index) => {
        if (!this.signatures['advisor-' + index].completed && this.signatures['advisor-' + index].mode === 'draw') this.setupCanvas('advisor-' + index);
      });
    },
    
    setupCanvas(signatureId) {
      const canvas = this.getCanvasElement(signatureId);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.parentElement.offsetWidth - 20; 
        canvas.height = 150;
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    },
    
    getCoordinates(canvas, event) {
      const rect = canvas.getBoundingClientRect();
      const clientX = event.clientX || (event.touches && event.touches[0].clientX);
      const clientY = event.clientY || (event.touches && event.touches[0].clientY);
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    },

    startDrawing(signatureId, event) {
      this.$set(this.isDrawing, signatureId, true);
      const canvas = event.target;
      const ctx = canvas.getContext('2d');
      const pos = this.getCoordinates(canvas, event);
      
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    },
    
    draw(signatureId, event) {
      if (!this.isDrawing[signatureId]) return;
      const canvas = event.target;
      const ctx = canvas.getContext('2d');
      const pos = this.getCoordinates(canvas, event);
      
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    },
    
    stopDrawing(signatureId) {
      this.$set(this.isDrawing, signatureId, false);
    },
    
    clearSignature(signatureId) {
      const canvas = this.getCanvasElement(signatureId);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    },
    
    saveSignature(signatureId) {
      const canvas = this.getCanvasElement(signatureId);
      if (canvas) {
        const dataURL = canvas.toDataURL('image/png');
        this.signatures[signatureId].data = dataURL;
        this.signatures[signatureId].completed = true;
        this.signatures[signatureId].timestamp = this.getThaiTimestamp();
        this.emitModelValue();
      }
    },
    
    editSignature(signatureId) {
      this.signatures[signatureId].completed = false;
      this.signatures[signatureId].data = null;
      this.signatures[signatureId].timestamp = null;
      this.emitModelValue();
      
      if (this.signatures[signatureId].mode === 'draw') {
        this.$nextTick(() => {
          this.setupCanvas(signatureId);
        });
      }
    },

    getAllSignatures() {
      return this.signatures;
    }
  }
}
</script>

<style scoped>
.signature-card {
  margin-bottom: 80px;
}

.section-title {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 15px;
  padding: 10px 15px;
  background: #f8f9fa;
  border-left: 4px solid #007bff;
  border-radius: 4px;
}

.signature-box {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  background: #f8f9fa;
  min-height: 380px;
  display: flex;
  flex-direction: column;
}

.signature-area {
  min-height: 180px;
}

.signature-canvas-container {
  border: 1px dashed #007bff;
  border-radius: 4px;
  background: white;
  padding: 10px;
}

.signature-canvas {
  width: 100%;
  height: 150px;
  cursor: crosshair;
  background: white;
  touch-action: none;
}

.signature-canvas:hover {
  background-color: #fcfcfc;
}

.upload-container {
  border: 1px dashed #ced4da;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.signature-completed {
  text-align: center;
  min-height: 170px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.signature-image {
  max-width: 100%;
  height: 120px;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 10px;
  background: transparent;
  object-fit: contain;
}

@media (max-width: 768px) {
  .signature-box {
    padding: 15px;
    min-height: 350px;
  }
}
</style>
