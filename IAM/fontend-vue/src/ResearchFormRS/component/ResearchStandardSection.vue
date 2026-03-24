<template>
  <div class="section mb-4 research-standard-section" :class="{ 'is-dark': isDarkTheme }">
    <h6 class="section-title">18. มาตรฐานการวิจัย <span v-if="!isReadOnly" class="text-danger">*</span></h6>
    <div class="funding-options">
      <input
        ref="fileInput"
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        class="d-none"
        @change="handleFileSelected"
      >

      <div class="form-check mb-3">
        <input v-model="mainType" type="radio" class="form-check-input" id="std1" value="none" :disabled="isReadOnly">
        <label class="form-check-label" for="std1" :class="{ 'text-muted': isReadOnly && mainType !== 'none' }">
          <strong>ไม่มีการทำวิจัยในมนุษย์ / ไม่มีการใช้สัตว์ทดลอง / การวิจัยที่เกี่ยวข้องกับงานด้านเทคโนโลยีชีวภาพสมัยใหม่</strong>
        </label>

        <div v-if="mainType === 'none'" class="sub-options mt-2">
          <div class="form-check mb-3">
            <input v-model="isPlant" type="checkbox" class="form-check-input" id="chk-plant" :disabled="isReadOnly">
            <label class="form-check-label" for="chk-plant" :class="{ 'text-muted': isReadOnly && !isPlant }">
              <strong>มีการเก็บ จัดหา หรือรวบรวมพันธุ์พืชพื้นเมืองทั่วไปและพันธุ์พืชป่าหรือส่วนใดของพันธุ์พืช เห็ด รา เพื่อการศึกษา ทดลอง หรือวิจัย ตามมาตรา 53 แห่งพระราชบัญญัติคุ้มครองพันธุ์พืช พ.ศ. 2542</strong>
            </label>

            <div v-if="isPlant" class="sub-options mt-2">
              <div class="form-check mb-3">
                <input v-model="plantSubType" type="radio" class="form-check-input" id="plant-appr" value="approved" :disabled="isReadOnly">
                <label class="form-check-label" for="plant-appr" :class="{ 'text-muted': isReadOnly && plantSubType !== 'approved' }">มีหนังสือแจ้งการเก็บ จัดหา หรือรวบรวมพันธุ์พืชฯ ตามมาตรา 53 แห่งพระราชบัญญัติคุ้มครองพันธุ์พืช พ.ศ. 2542 (แนบสำเนา 1 ชุด)</label>
                <div v-if="plantSubType === 'approved'" class="mt-2">
                  <div v-if="!isReadOnly" class="d-inline-block mr-2">
                    <CButton color="primary" size="sm" class="mr-2" @click="triggerAttach('plantApproved')">แนบเอกสาร</CButton>
                  </div>
                  <CButton color="info" variant="outline" size="sm" @click="openExampleDoc('section53Notification')">ตัวอย่างเอกสาร</CButton>
                  <div class="mt-2">
                    <AttachmentCard
                      :file="attachmentFor('plantApproved')"
                      :is-read-only="isReadOnly"
                      @open="openAttachment('plantApproved')"
                      @remove="removeAttachment('plantApproved')"
                    />
                  </div>
                </div>
              </div>

              <div class="form-check mb-2">
                <input v-model="plantSubType" type="radio" class="form-check-input" id="plant-pend" value="pending" :disabled="isReadOnly">
                <label class="form-check-label" for="plant-pend" :class="{ 'text-muted': isReadOnly && plantSubType !== 'pending' }">ไม่มีหนังสือแจ้งการเก็บ จัดหา หรือรวบรวมพันธุ์พืชฯ อยู่ระหว่างการดำเนินการ</label>
                <div v-if="plantSubType === 'pending'" class="mt-2">
                  <div v-if="!isReadOnly" class="d-inline-block mr-2">
                    <CButton color="primary" size="sm" class="mr-2" @click="triggerAttach('plantPending')">แนบเอกสารหลักฐาน</CButton>
                  </div>
                  <CButton color="info" variant="outline" size="sm" @click="openExampleDoc('section53Notification')">ตัวอย่างเอกสาร</CButton>
                  <div class="mt-2">
                    <AttachmentCard
                      :file="attachmentFor('plantPending')"
                      :is-read-only="isReadOnly"
                      @open="openAttachment('plantPending')"
                      @remove="removeAttachment('plantPending')"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-check mb-3">
        <input v-model="mainType" type="radio" class="form-check-input" id="std2" value="human_animal" :disabled="isReadOnly">
        <label class="form-check-label" for="std2" :class="{ 'text-muted': isReadOnly && mainType !== 'human_animal' }">
          <strong>มีการทำวิจัยในมนุษย์ / มีการใช้สัตว์ทดลอง</strong>
        </label>

        <div v-if="mainType === 'human_animal'" class="sub-options mt-2">
          <div v-if="!isHuman && !isAnimal && !isReadOnly" class="text-danger mb-3 helper-text">
            * กรุณาเลือกอย่างน้อย 1 อย่าง (มนุษย์ หรือ สัตว์ทดลอง)
          </div>

          <div class="form-check mb-3">
            <input v-model="isHuman" type="checkbox" class="form-check-input" id="chk-human" :disabled="isReadOnly">
            <label class="form-check-label" for="chk-human" :class="{ 'text-muted': isReadOnly && !isHuman }"><strong>มีการทำวิจัยในมนุษย์</strong></label>

            <div v-if="isHuman" class="sub-options mt-2">
              <div class="form-check mb-3">
                <input v-model="humanSubType" type="radio" class="form-check-input" id="human-appr" value="approved" :disabled="isReadOnly">
                <label class="form-check-label" for="human-appr" :class="{ 'text-muted': isReadOnly && humanSubType !== 'approved' }">มีหนังสือรับรองจริยธรรมการวิจัยในมนุษย์ (แนบสำเนา 1 ชุด)</label>
                <div v-if="humanSubType === 'approved'" class="mt-2">
                  <div v-if="!isReadOnly" class="d-inline-block mr-2">
                    <CButton color="primary" size="sm" class="mr-2" @click="triggerAttach('humanApproved')">แนบเอกสาร</CButton>
                  </div>
                  <CButton color="info" variant="outline" size="sm" @click="openExampleDoc('humanEthicsCertificate')">ตัวอย่างเอกสาร</CButton>
                  <div class="mt-2">
                    <AttachmentCard
                      :file="attachmentFor('humanApproved')"
                      :is-read-only="isReadOnly"
                      @open="openAttachment('humanApproved')"
                      @remove="removeAttachment('humanApproved')"
                    />
                  </div>
                </div>
              </div>

              <div class="form-check mb-2">
                <input v-model="humanSubType" type="radio" class="form-check-input" id="human-pend" value="pending" :disabled="isReadOnly">
                <label class="form-check-label" for="human-pend" :class="{ 'text-muted': isReadOnly && humanSubType !== 'pending' }">ไม่มีหนังสือรับรองจริยธรรมการวิจัยในมนุษย์ อยู่ระหว่างเสนอคณะกรรมการจริยธรรมการวิจัยในมนุษย์พิจารณา</label>
                <div v-if="humanSubType === 'pending'" class="mt-2">
                  <div v-if="!isReadOnly" class="d-inline-block mr-2">
                    <CButton color="primary" size="sm" class="mr-2" @click="triggerAttach('humanPending')">แนบเอกสารหลักฐาน</CButton>
                  </div>
                  <CButton color="info" variant="outline" size="sm" @click="openExampleDoc('humanEthicsCertificate')">ตัวอย่างเอกสาร</CButton>
                  <div class="mt-2">
                    <AttachmentCard
                      :file="attachmentFor('humanPending')"
                      :is-read-only="isReadOnly"
                      @open="openAttachment('humanPending')"
                      @remove="removeAttachment('humanPending')"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-check mb-3">
            <input v-model="isAnimal" type="checkbox" class="form-check-input" id="chk-animal" :disabled="isReadOnly">
            <label class="form-check-label" for="chk-animal" :class="{ 'text-muted': isReadOnly && !isAnimal }"><strong>มีการใช้สัตว์ทดลอง</strong></label>

            <div v-if="isAnimal" class="sub-options mt-2">
              <div class="form-check mb-3">
                <input v-model="animalSubType" type="radio" class="form-check-input" id="animal-appr" value="approved" :disabled="isReadOnly">
                <label class="form-check-label" for="animal-appr" :class="{ 'text-muted': isReadOnly && animalSubType !== 'approved' }">มีหนังสือรับรองจรรยาบรรณสัตว์เพื่องานทางวิทยาศาสตร์ (แนบสำเนา 1 ชุด)</label>
                <div v-if="animalSubType === 'approved'" class="mt-2">
                  <div v-if="!isReadOnly" class="d-inline-block mr-2">
                    <CButton color="primary" size="sm" class="mr-2" @click="triggerAttach('animalApproved')">แนบเอกสาร</CButton>
                  </div>
                  <CButton color="info" variant="outline" size="sm" @click="openExampleDoc('animalEthicsCertificate')">ตัวอย่างเอกสาร</CButton>
                  <div class="mt-2">
                    <AttachmentCard
                      :file="attachmentFor('animalApproved')"
                      :is-read-only="isReadOnly"
                      @open="openAttachment('animalApproved')"
                      @remove="removeAttachment('animalApproved')"
                    />
                  </div>
                </div>
              </div>

              <div class="form-check mb-2">
                <input v-model="animalSubType" type="radio" class="form-check-input" id="animal-pend" value="pending" :disabled="isReadOnly">
                <label class="form-check-label" for="animal-pend" :class="{ 'text-muted': isReadOnly && animalSubType !== 'pending' }">ไม่มีหนังสือรับรองจรรยาบรรณสัตว์เพื่องานทางวิทยาศาสตร์ อยู่ระหว่างเสนอคณะกรรมการจรรยาบรรณสัตว์เพื่องานทางวิทยาศาสตร์</label>
                <div v-if="animalSubType === 'pending'" class="mt-2">
                  <div v-if="!isReadOnly" class="d-inline-block mr-2">
                    <CButton color="primary" size="sm" class="mr-2" @click="triggerAttach('animalPending')">แนบเอกสารหลักฐาน</CButton>
                  </div>
                  <CButton color="info" variant="outline" size="sm" @click="openExampleDoc('animalEthicsCertificate')">ตัวอย่างเอกสาร</CButton>
                  <div class="mt-2">
                    <AttachmentCard
                      :file="attachmentFor('animalPending')"
                      :is-read-only="isReadOnly"
                      @open="openAttachment('animalPending')"
                      @remove="removeAttachment('animalPending')"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const DEFAULT_ATTACHMENTS = {
  plantApproved: null,
  plantPending: null,
  humanApproved: null,
  humanPending: null,
  animalApproved: null,
  animalPending: null
}

const SAMPLE_DOC_URLS = {
  // Official form for Section 53 notification (Plant Varieties Protection Act B.E. 2542)
  section53Notification: 'https://www.doa.go.th/pvp/wp-content/uploads/2024/11/m53.pdf',
  section53FormsPage: 'https://www.doa.go.th/pvp/?page_id=13853',
  // Human research ethics (official university ethics portal with forms/details)
  humanEthicsCertificate: 'https://sites.google.com/ku.th/kurec/%E0%B9%81%E0%B8%9A%E0%B8%9A%E0%B8%9F%E0%B8%AD%E0%B8%A3%E0%B8%A1%E0%B8%82%E0%B8%AD%E0%B8%A3%E0%B8%9A%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%A3%E0%B8%9A%E0%B8%A3%E0%B8%AD%E0%B8%87%E0%B8%88%E0%B8%A3%E0%B8%A2%E0%B8%98%E0%B8%A3%E0%B8%A3%E0%B8%A1%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%A7%E0%B8%88%E0%B8%A2%E0%B9%83%E0%B8%99%E0%B8%A1%E0%B8%99%E0%B8%A9%E0%B8%A2%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%A7%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A5%E0%B8%A2%E0%B9%80%E0%B8%81%E0%B8%A9%E0%B8%95%E0%B8%A3%E0%B8%A8%E0%B8%B2%E0%B8%AA%E0%B8%95%E0%B8%A3',
  // Animal use ethics/certificate resources (official IACUC page)
  animalEthicsCertificate: 'https://researchvetku.com/iacuc/'
}
const EXAMPLE_DOC_WINDOW_NAME = 'research-standard-example-doc'

const AttachmentCard = {
  name: 'ResearchStandardAttachmentCard',
  props: {
    file: {
      type: Object,
      default: null
    },
    isReadOnly: {
      type: Boolean,
      default: false
    }
  },
  template: `
    <div v-if="file" class="attachment-card">
      <div class="attachment-card__name">{{ file.name || file.originalName || 'เอกสารแนบ' }}</div>
      <div class="attachment-card__actions">
        <CButton color="info" size="sm" variant="outline" class="mr-2" @click="$emit('open')">เปิดดู</CButton>
        <CButton v-if="!isReadOnly" color="danger" size="sm" variant="outline" @click="$emit('remove')">ลบ</CButton>
      </div>
    </div>
  `
}

export default {
  name: 'ResearchStandardSection',
  components: {
    AttachmentCard
  },
  props: {
    value: {
      type: Object,
      required: true,
      default: () => ({
        mainType: '',
        isPlant: false,
        plantSubType: '',
        isHuman: false,
        humanSubType: '',
        isAnimal: false,
        animalSubType: '',
        attachments: { ...DEFAULT_ATTACHMENTS }
      })
    },
    isReadOnly: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      activeAttachmentKey: '',
      exampleDocPopup: null,
      lastExampleDocOpenAt: 0
    }
  },
  computed: {
    isDarkTheme () {
      return Boolean(this.$store && this.$store.state && this.$store.state.darkMode)
    },

    mainType: {
      get () { return this.value.mainType },
      set (val) { this.updateValue('mainType', val) }
    },
    isPlant: {
      get () { return this.value.isPlant },
      set (val) { this.updateValue('isPlant', val) }
    },
    plantSubType: {
      get () { return this.value.plantSubType },
      set (val) { this.updateValue('plantSubType', val) }
    },
    isHuman: {
      get () { return this.value.isHuman },
      set (val) { this.updateValue('isHuman', val) }
    },
    humanSubType: {
      get () { return this.value.humanSubType },
      set (val) { this.updateValue('humanSubType', val) }
    },
    isAnimal: {
      get () { return this.value.isAnimal },
      set (val) { this.updateValue('isAnimal', val) }
    },
    animalSubType: {
      get () { return this.value.animalSubType },
      set (val) { this.updateValue('animalSubType', val) }
    },
    attachments () {
      return {
        ...DEFAULT_ATTACHMENTS,
        ...(this.value && this.value.attachments ? this.value.attachments : {})
      }
    }
  },
  methods: {
    attachmentFor (key) {
      return this.attachments[key] || null
    },
    withAttachments (data) {
      return {
        ...data,
        attachments: {
          ...DEFAULT_ATTACHMENTS,
          ...(data && data.attachments ? data.attachments : {})
        }
      }
    },
    updateAttachment (key, file) {
      const next = this.withAttachments(this.value || {})
      next.attachments = {
        ...this.attachments,
        [key]: file || null
      }
      this.$emit('input', next)
    },
    updateValue (key, val) {
      const newData = this.withAttachments({ ...this.value, [key]: val })

      if (key === 'mainType') {
        if (val === 'none') {
          newData.isHuman = false
          newData.humanSubType = ''
          newData.isAnimal = false
          newData.animalSubType = ''
          newData.attachments.humanApproved = null
          newData.attachments.humanPending = null
          newData.attachments.animalApproved = null
          newData.attachments.animalPending = null
        } else if (val === 'human_animal') {
          newData.isPlant = false
          newData.plantSubType = ''
          newData.attachments.plantApproved = null
          newData.attachments.plantPending = null
        }
      }

      if (key === 'isPlant' && !val) {
        newData.plantSubType = ''
        newData.attachments.plantApproved = null
        newData.attachments.plantPending = null
      }
      if (key === 'isHuman' && !val) {
        newData.humanSubType = ''
        newData.attachments.humanApproved = null
        newData.attachments.humanPending = null
      }
      if (key === 'isAnimal' && !val) {
        newData.animalSubType = ''
        newData.attachments.animalApproved = null
        newData.attachments.animalPending = null
      }

      if (key === 'plantSubType') {
        if (val === 'approved') newData.attachments.plantPending = null
        if (val === 'pending') newData.attachments.plantApproved = null
      }
      if (key === 'humanSubType') {
        if (val === 'approved') newData.attachments.humanPending = null
        if (val === 'pending') newData.attachments.humanApproved = null
      }
      if (key === 'animalSubType') {
        if (val === 'approved') newData.attachments.animalPending = null
        if (val === 'pending') newData.attachments.animalApproved = null
      }

      this.$emit('input', newData)
    },
    triggerAttach (key) {
      if (this.isReadOnly) return
      this.activeAttachmentKey = key
      if (this.$refs.fileInput) this.$refs.fileInput.click()
    },
    handleFileSelected (event) {
      const file = event && event.target && event.target.files ? event.target.files[0] : null
      if (!file || !this.activeAttachmentKey) return
      this.$emit('upload-attachment', { slotKey: this.activeAttachmentKey, file })
      event.target.value = ''
      this.activeAttachmentKey = ''
    },
    openAttachment (key) {
      const file = this.attachmentFor(key)
      if (!file) return
      this.$emit('open-attachment', { slotKey: key, file })
    },
    openExampleDoc (docKey = 'section53Notification') {
      const url = SAMPLE_DOC_URLS[docKey] || SAMPLE_DOC_URLS.section53Notification
      if (!url || typeof window === 'undefined') return
      const now = Date.now()
      if (now - this.lastExampleDocOpenAt < 500) return
      this.lastExampleDocOpenAt = now
      if (this.exampleDocPopup && !this.exampleDocPopup.closed) {
        try {
          this.exampleDocPopup.location.href = url
          this.exampleDocPopup.focus()
          return
        } catch (_) {
          this.exampleDocPopup = null
        }
      }
      const popup = window.open(url, EXAMPLE_DOC_WINDOW_NAME)
      if (popup && typeof popup.focus === 'function') {
        this.exampleDocPopup = popup
        popup.focus()
      }
    },
    removeAttachment (key) {
      const file = this.attachmentFor(key)
      if (!file) return
      this.$emit('remove-attachment', { slotKey: key, file })
    }
  }
}
</script>

<style scoped>
.section-title {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 15px;
  padding: 10px 15px;
  background: #f8f9fa;
  border-left: 4px solid #007bff;
  border-radius: 4px;
}

.funding-options {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.sub-options {
  margin-left: 1.5rem;
  margin-top: 10px;
  padding-left: 15px;
  background: transparent;
  border-radius: 0 8px 8px 0;
  padding: 15px;
}

.sub-options .form-check {
  margin-bottom: 12px;
  padding-left: 1.5rem;
}

.sub-options .form-check-input {
  margin-left: -1.5rem;
  margin-top: 0.2rem;
}

.sub-options .form-check-label {
  font-size: 0.9rem;
  color: #495057;
  line-height: 1.5;
  cursor: pointer;
}

.form-check {
  padding-left: 1.5rem;
  margin-bottom: 15px;
}

.form-check-input {
  margin-left: -1.5rem;
  margin-top: 0.3rem;
}

.form-check-label {
  cursor: pointer;
  display: block;
  color: #495057;
  line-height: 1.5;
}

.helper-text {
  font-size: 0.85rem;
}

.attachment-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid #dbeafe;
  border-radius: 10px;
  background: #f8fbff;
}

.attachment-card__name {
  font-weight: 600;
  color: #0f172a;
  word-break: break-word;
}

.attachment-card__actions {
  flex-shrink: 0;
}

.research-standard-section.is-dark .section-title {
  color: #eaf2fb;
  background: #1f2b39;
  border-left-color: #c59b3a;
}

.research-standard-section.is-dark .funding-options {
  background: #1a2432;
  border: 1px solid #2f3f52;
}

.research-standard-section.is-dark .sub-options {
  background: #223142;
  border: 1px solid #35475c;
}

.research-standard-section.is-dark .form-check-label,
.research-standard-section.is-dark .form-check-label strong {
  color: #e7eef7;
}

.research-standard-section.is-dark .text-muted,
.research-standard-section.is-dark .helper-text {
  color: #aab9ca !important;
}

.research-standard-section.is-dark .form-check-input {
  filter: brightness(1.08);
}

.research-standard-section.is-dark .attachment-card {
  border-color: #36506a;
  background: #1f2e3d;
}

.research-standard-section.is-dark .attachment-card__name {
  color: #e7eef7;
}
</style>

