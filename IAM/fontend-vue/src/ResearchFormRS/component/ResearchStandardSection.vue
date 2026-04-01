<template>
  <section class="section mb-4 research-standard-section research-standard" :class="{ 'is-dark': isDarkTheme }">
    <h6 class="section-title">18. มาตรฐานการวิจัย</h6>

    <div class="research-standard__card">
      <input
        ref="fileInput"
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        class="d-none"
        @change="handleFileSelected"
      >

      <p class="research-standard__hint">เลือกเฉพาะกรณีที่เกี่ยวข้อง หากไม่เลือกข้อใด ระบบจะถือว่าไม่มี</p>

      <div v-if="isNoneSelected" class="research-standard__none-message">
        ไม่มีการวิจัยในมนุษย์ / ไม่มีการใช้สัตว์ทดลอง / ไม่เกี่ยวข้องกับพันธุ์พืช
      </div>

      <article
        v-for="group in groupList"
        :key="group.key"
        class="standard-card"
        :class="{ 'is-active': isGroupEnabled(group.key), 'has-error': groupHasError(group.key) }"
      >
        <header class="standard-card__header">
          <label class="standard-card__toggle" :for="checkboxId(group.key)">
            <input
              :id="checkboxId(group.key)"
              class="standard-card__checkbox"
              type="checkbox"
              :checked="isGroupEnabled(group.key)"
              :disabled="isReadOnly"
              @change="toggleGroup(group.key, $event.target.checked)"
            >
            <span class="standard-card__title">{{ group.title }}</span>
          </label>

          <button
            v-if="isGroupEnabled(group.key) && !isReadOnly"
            type="button"
            class="standard-card__reset"
            @click="resetGroup(group.key)"
          >
            ล้างข้อมูลหัวข้อนี้
          </button>
        </header>

        <transition name="standard-expand">
          <div v-if="isGroupEnabled(group.key)" class="standard-subpanel">
            <div class="standard-subpanel__options">
              <label
                v-for="option in group.options"
                :key="`${group.key}-${option.value}`"
                class="standard-option"
                :class="{ 'is-selected': groupStatus(group.key) === option.value }"
                :for="radioId(group.key, option.value)"
              >
                <input
                  :id="radioId(group.key, option.value)"
                  type="radio"
                  class="standard-option__radio"
                  :name="`standard-status-${group.key}`"
                  :checked="groupStatus(group.key) === option.value"
                  :disabled="isReadOnly"
                  @change="updateGroupStatus(group.key, option.value)"
                >
                <span class="standard-option__label">{{ option.label }}</span>
              </label>
            </div>

            <div class="standard-subpanel__actions">
              <CButton
                size="sm"
                class="standard-action standard-action--primary"
                :disabled="isReadOnly || !groupStatus(group.key)"
                @click="triggerAttach(group.key, groupStatus(group.key))"
              >
                <CIcon name="cil-library-add" class="mr-1" />
                แนบเอกสาร
              </CButton>

              <CButton
                size="sm"
                class="standard-action standard-action--secondary"
                @click="openExampleDoc(group.exampleDocKey)"
              >
                <CIcon name="cil-clipboard" class="mr-1" />
                ตัวอย่างเอกสาร
              </CButton>
            </div>

            <p v-if="!groupStatus(group.key)" class="standard-subpanel__action-note">โปรดเลือกสถานะก่อนแนบเอกสาร</p>

            <div v-if="activeAttachmentForGroup(group.key)" class="standard-attachment">
              <div class="standard-attachment__name">{{ attachmentDisplayName(activeAttachmentForGroup(group.key)) }}</div>
              <div class="standard-attachment__actions">
                <CButton size="sm" class="standard-action standard-action--secondary mr-2" @click="openActiveAttachment(group.key)">
                  <CIcon name="cil-folder-open" class="mr-1" />
                  เปิดดู
                </CButton>
                <CButton v-if="!isReadOnly" size="sm" class="standard-action standard-action--danger" @click="removeActiveAttachment(group.key)">
                  <CIcon name="cil-trash" class="mr-1" />
                  ลบ
                </CButton>
              </div>
            </div>

            <ul v-if="groupValidationMessages(group.key).length" class="standard-errors">
              <li v-for="message in groupValidationMessages(group.key)" :key="`${group.key}-${message}`" class="standard-errors__item">
                {{ message }}
              </li>
            </ul>
          </div>
        </transition>
      </article>
    </div>
  </section>
</template>

<script>
const STATUS_APPROVED = 'approved'
const STATUS_PENDING = 'pending'
const VALID_STATUSES = [STATUS_APPROVED, STATUS_PENDING]

const DEFAULT_ATTACHMENTS = {
  plantApproved: null,
  plantPending: null,
  humanApproved: null,
  humanPending: null,
  animalApproved: null,
  animalPending: null
}

const GROUP_META = {
  human: {
    key: 'human',
    title: 'มีการทำวิจัยในมนุษย์',
    pendingNeedsDate: false,
    exampleDocKey: 'humanEthicsCertificate',
    options: [
      { value: STATUS_APPROVED, label: 'มีหนังสือรับรองจริยธรรมการวิจัยในมนุษย์ (แนบสำเนา 1 ชุด)' },
      { value: STATUS_PENDING, label: 'ไม่มีหนังสือรับรองจริยธรรมการวิจัยในมนุษย์ อยู่ระหว่างเสนอคณะกรรมการวิจัยจริยธรรมการวิจัยในมนุษย์พิจารณา' }
    ],
    legacy: { enabledKey: 'isHuman', statusKey: 'humanSubType', submittedDateKey: 'humanSubmittedDate' },
    slots: { approved: 'humanApproved', pending: 'humanPending' }
  },
  animal: {
    key: 'animal',
    title: 'มีการใช้สัตว์ทดลอง',
    pendingNeedsDate: false,
    exampleDocKey: 'animalEthicsCertificate',
    options: [
      { value: STATUS_APPROVED, label: 'มีหนังสือรับรองจรรยาบรรณสัตว์เพื่องานทางวิทยาศาสตร์ (แนบสำเนา 1 ชุด)' },
      { value: STATUS_PENDING, label: 'ไม่มีหนังสือรับรองจรรยาบรรณสัตว์เพื่องานทางวิทยาศาสตร์ อยู่ระหว่างเสนอคณะกรรมการจรรยาบรรณสัตว์เพื่องานทางวิทยาศาสตร์' }
    ],
    legacy: { enabledKey: 'isAnimal', statusKey: 'animalSubType', submittedDateKey: 'animalSubmittedDate' },
    slots: { approved: 'animalApproved', pending: 'animalPending' }
  },
  plant: {
    key: 'plant',
    title: 'มีการเก็บ จัดหา หรือรวบรวมพันธุ์พืชพื้นเมืองทั่วไปและพันธุ์พืชป่าหรือส่วนหนึ่งส่วนใดของพันธุ์พืช เพื่อการศึกษา ทดลอง หรือวิจัย ตามมาตรา 53 แห่งพระราชบัญญัติคุ้มครองพันธุ์พืช พ.ศ. 2542',
    pendingNeedsDate: false,
    exampleDocKey: 'section53Notification',
    options: [
      { value: STATUS_APPROVED, label: 'มีหนังสือแจ้งการเก็บ จัดหา หรือรวบรวมพันธุ์พืชฯ ตามมาตรา 53 แห่งพระราชบัญญัติคุ้มครองพันธุ์พืช พ.ศ. 2542 (แนบสำเนา 1 ชุด)' },
      { value: STATUS_PENDING, label: 'ไม่มีหนังสือแจ้งการเก็บ จัดหา หรือรวบรวมพันธุ์พืชฯ อยู่ระหว่างดำเนินการ' }
    ],
    legacy: { enabledKey: 'isPlant', statusKey: 'plantSubType', submittedDateKey: 'plantSubmittedDate' },
    slots: { approved: 'plantApproved', pending: 'plantPending' }
  }
}

const GROUP_KEYS = Object.keys(GROUP_META)

const SAMPLE_DOC_URLS = {
  section53Notification: 'https://research.mfu.ac.th/rs-variousresearch/rs-plant-species.html',
  section53FormsPage: 'https://www.doa.go.th/pvp/?page_id=13853',
  humanEthicsCertificate: 'https://ec.mfu.ac.th/ec-index.html',
  animalEthicsCertificate: 'https://research.mfu.ac.th/rs-variousresearch/rs-manual-animal.html'
}
const EXAMPLE_DOC_WINDOW_NAME = 'research-standard-example-doc'

const createEmptyGroupState = () => ({ enabled: false, status: '', submittedDate: '', attachments: [] })
const createDefaultSection18 = () => ({ human: createEmptyGroupState(), animal: createEmptyGroupState(), plant: createEmptyGroupState() })

export default {
  name: 'ResearchStandardSection',
  props: {
    value: {
      type: Object,
      default: () => ({
        mainType: '',
        isPlant: false,
        plantSubType: '',
        isHuman: false,
        humanSubType: '',
        isAnimal: false,
        animalSubType: '',
        attachments: { ...DEFAULT_ATTACHMENTS },
        section18: createDefaultSection18()
      })
    },
    isReadOnly: { type: Boolean, default: false }
  },
  data () {
    return {
      activeAttachmentKey: '',
      exampleDocPopup: null,
      lastExampleDocOpenAt: 0,
      isSyncingModel: false
    }
  },
  computed: {
    isDarkTheme () {
      return Boolean(this.$store && this.$store.state && this.$store.state.darkMode)
    },
    groupList () {
      return GROUP_KEYS.map((key) => GROUP_META[key])
    },
    normalizedValue () {
      return this.normalizeIncomingValue(this.value)
    },
    section18 () {
      return this.normalizedValue.section18
    },
    attachments () {
      return this.normalizedValue.attachments
    },
    isNoneSelected () {
      return !this.section18.human.enabled && !this.section18.animal.enabled && !this.section18.plant.enabled
    }
  },
  watch: {
    value: {
      immediate: true,
      handler (nextValue) {
        this.ensureCanonicalStructure(nextValue)
      }
    }
  },
  methods: {
    withDefaultAttachments (attachments) {
      return {
        ...DEFAULT_ATTACHMENTS,
        ...(attachments && typeof attachments === 'object' ? attachments : {})
      }
    },
    normalizeStatus (status) {
      const value = String(status || '').trim()
      return VALID_STATUSES.includes(value) ? value : ''
    },
    normalizeDate (value) {
      const raw = String(value || '').trim()
      if (!raw) return ''
      return raw.length >= 10 ? raw.slice(0, 10) : raw
    },
    cloneSection18 (section18Value) {
      const base = createDefaultSection18()
      GROUP_KEYS.forEach((type) => {
        const source = section18Value && section18Value[type] && typeof section18Value[type] === 'object'
          ? section18Value[type]
          : {}
        base[type] = {
          enabled: Boolean(source.enabled),
          status: this.normalizeStatus(source.status),
          submittedDate: this.normalizeDate(source.submittedDate),
          attachments: Array.isArray(source.attachments) ? source.attachments.filter(Boolean) : []
        }
      })
      return base
    },
    deriveMainType (section18State) {
      // Backward compatibility with existing parent validation/reporting fields.
      if (section18State && (section18State.human.enabled || section18State.animal.enabled)) return 'human_animal'
      return 'none'
    },
    composePayload (baseValue, section18State, attachmentsState, options = {}) {
      const source = baseValue && typeof baseValue === 'object' ? baseValue : {}
      const shouldCleanup = options.aggressiveCleanup !== false
      const nextAttachments = this.withDefaultAttachments(attachmentsState)
      const nextSection18 = this.cloneSection18(section18State)

      GROUP_KEYS.forEach((type) => {
        const group = GROUP_META[type]
        const approvedSlot = group.slots.approved
        const pendingSlot = group.slots.pending
        const current = nextSection18[type] || createEmptyGroupState()
        const enabled = Boolean(current.enabled)
        const status = enabled ? this.normalizeStatus(current.status) : ''
        const submittedDate = enabled && group.pendingNeedsDate ? this.normalizeDate(current.submittedDate) : ''

        if (shouldCleanup) {
          if (!enabled) {
            nextAttachments[approvedSlot] = null
            nextAttachments[pendingSlot] = null
          } else if (status === STATUS_APPROVED) {
            nextAttachments[pendingSlot] = null
          } else if (status === STATUS_PENDING) {
            nextAttachments[approvedSlot] = null
          }
        }

        const relatedAttachments = enabled
          ? [nextAttachments[approvedSlot], nextAttachments[pendingSlot]].filter(Boolean)
          : []

        nextSection18[type] = {
          enabled,
          status,
          submittedDate,
          attachments: relatedAttachments
        }
      })

      const hasHuman = Boolean(nextSection18.human.enabled)
      const hasAnimal = Boolean(nextSection18.animal.enabled)
      const hasPlant = Boolean(nextSection18.plant.enabled)

      return {
        ...source,
        mainType: this.deriveMainType(nextSection18),
        isHuman: hasHuman,
        humanSubType: hasHuman ? nextSection18.human.status : '',
        humanSubmittedDate: hasHuman ? nextSection18.human.submittedDate : '',
        isAnimal: hasAnimal,
        animalSubType: hasAnimal ? nextSection18.animal.status : '',
        animalSubmittedDate: hasAnimal ? nextSection18.animal.submittedDate : '',
        isPlant: hasPlant,
        plantSubType: hasPlant ? nextSection18.plant.status : '',
        plantSubmittedDate: hasPlant ? nextSection18.plant.submittedDate : '',
        attachments: nextAttachments,
        section18: nextSection18
      }
    },
    normalizeIncomingValue (rawValue) {
      const source = rawValue && typeof rawValue === 'object' ? rawValue : {}
      const sourceSection18 = source.section18 && typeof source.section18 === 'object'
        ? source.section18
        : {}
      const attachments = this.withDefaultAttachments(source.attachments)
      const nextSection18 = createDefaultSection18()

      GROUP_KEYS.forEach((type) => {
        const group = GROUP_META[type]
        const sectionValue = sourceSection18[type] && typeof sourceSection18[type] === 'object'
          ? sourceSection18[type]
          : {}
        const enabled = typeof sectionValue.enabled === 'boolean'
          ? sectionValue.enabled
          : Boolean(source[group.legacy.enabledKey])
        let status = this.normalizeStatus(sectionValue.status || source[group.legacy.statusKey])
        const submittedDate = this.normalizeDate(sectionValue.submittedDate || source[group.legacy.submittedDateKey])

        if (!status) {
          const hasApprovedAttachment = Boolean(attachments[group.slots.approved])
          const hasPendingAttachment = Boolean(attachments[group.slots.pending])
          if (hasApprovedAttachment && !hasPendingAttachment) status = STATUS_APPROVED
          if (hasPendingAttachment && !hasApprovedAttachment) status = STATUS_PENDING
        }

        nextSection18[type] = {
          enabled,
          status: enabled ? status : '',
          submittedDate: enabled && group.pendingNeedsDate ? submittedDate : '',
          attachments: Array.isArray(sectionValue.attachments)
            ? sectionValue.attachments.filter(Boolean)
            : [attachments[group.slots.approved], attachments[group.slots.pending]].filter(Boolean)
        }
      })

      return this.composePayload(source, nextSection18, attachments, { aggressiveCleanup: false })
    },
    ensureCanonicalStructure (rawValue) {
      if (this.isSyncingModel) return
      const source = rawValue && typeof rawValue === 'object' ? rawValue : {}
      const hasSection18 = source.section18 && typeof source.section18 === 'object'
      const hasMainType = String(source.mainType || '').trim() !== ''
      if (hasSection18 && hasMainType) return
      this.emitModel(this.normalizeIncomingValue(source))
    },
    emitModel (payload) {
      this.isSyncingModel = true
      this.$emit('input', payload)
      this.$emit('update', payload)
      this.$nextTick(() => {
        this.isSyncingModel = false
      })
    },
    emitAttachmentRemovals (keys = [], attachmentSource = {}) {
      if (!Array.isArray(keys) || !keys.length) return
      const uniqueKeys = Array.from(new Set(keys))
      uniqueKeys.forEach((key) => {
        const file = attachmentSource[key]
        if (!file) return
        this.$emit('remove-attachment', { slotKey: key, file })
      })
    },
    applyMutation (mutator) {
      if (this.isReadOnly || typeof mutator !== 'function') return
      const current = this.normalizeIncomingValue(this.value)
      const section18 = this.cloneSection18(current.section18)
      const attachments = this.withDefaultAttachments(current.attachments)
      const removalKeys = []

      mutator(section18, attachments, removalKeys, current)

      const next = this.composePayload(current, section18, attachments, { aggressiveCleanup: true })
      this.emitAttachmentRemovals(removalKeys, current.attachments)
      this.emitModel(next)
    },
    slotKeyFor (type, status) {
      const group = GROUP_META[type]
      if (!group) return ''
      const normalizedStatus = this.normalizeStatus(status)
      return normalizedStatus ? group.slots[normalizedStatus] : ''
    },
    attachmentForSlot (slotKey) {
      if (!slotKey) return null
      return this.attachments[slotKey] || null
    },
    attachmentDisplayName (file) {
      if (!file) return ''
      return file.name || file.originalName || file.fileName || 'เอกสารแนบ'
    },
    groupState (type) {
      return this.section18[type] || createEmptyGroupState()
    },
    isGroupEnabled (type) {
      return Boolean(this.groupState(type).enabled)
    },
    groupStatus (type) {
      return this.normalizeStatus(this.groupState(type).status)
    },
    groupSubmittedDate (type) {
      return this.normalizeDate(this.groupState(type).submittedDate)
    },
    groupNeedsPendingDate (type) {
      const group = GROUP_META[type]
      return Boolean(group && group.pendingNeedsDate)
    },
    shouldShowPendingDate (type) {
      return this.isGroupEnabled(type) && this.groupStatus(type) === STATUS_PENDING && this.groupNeedsPendingDate(type)
    },
    groupValidationMessages (type) {
      const messages = []
      if (!this.isGroupEnabled(type)) return messages
      if (!this.groupStatus(type)) messages.push('โปรดเลือกสถานะของหัวข้อนี้')
      if (this.shouldShowPendingDate(type) && !this.groupSubmittedDate(type)) messages.push('โปรดระบุวันที่ยื่นโครงการ')
      return messages
    },
    groupHasError (type) {
      return this.groupValidationMessages(type).length > 0
    },
    checkboxId (type) {
      return `standard-group-${type}`
    },
    radioId (type, status) {
      return `standard-${type}-${status}`
    },
    dateInputId (type) {
      return `standard-date-${type}`
    },
    clearAttachmentSlot (slotKey, attachments, removalKeys) {
      if (!slotKey) return
      if (attachments[slotKey]) removalKeys.push(slotKey)
      attachments[slotKey] = null
    },
    resetGroupState (type, section18, attachments, removalKeys) {
      const group = GROUP_META[type]
      if (!group) return
      section18[type] = createEmptyGroupState()
      this.clearAttachmentSlot(group.slots.approved, attachments, removalKeys)
      this.clearAttachmentSlot(group.slots.pending, attachments, removalKeys)
    },
    toggleGroup (type, forcedEnabled = null) {
      this.applyMutation((section18, attachments, removalKeys) => {
        if (!GROUP_META[type]) return
        const currentEnabled = Boolean(section18[type] && section18[type].enabled)
        const nextEnabled = typeof forcedEnabled === 'boolean' ? forcedEnabled : !currentEnabled
        if (nextEnabled) {
          section18[type].enabled = true
          return
        }
        this.resetGroupState(type, section18, attachments, removalKeys)
      })
    },
    resetGroup (type) {
      this.applyMutation((section18, attachments, removalKeys) => {
        this.resetGroupState(type, section18, attachments, removalKeys)
      })
    },
    updateGroupStatus (type, status) {
      this.applyMutation((section18, attachments, removalKeys) => {
        const group = GROUP_META[type]
        if (!group) return
        const normalizedStatus = this.normalizeStatus(status)
        section18[type].enabled = true
        section18[type].status = normalizedStatus

        if (normalizedStatus === STATUS_APPROVED) {
          this.clearAttachmentSlot(group.slots.pending, attachments, removalKeys)
          section18[type].submittedDate = ''
        } else if (normalizedStatus === STATUS_PENDING) {
          this.clearAttachmentSlot(group.slots.approved, attachments, removalKeys)
          if (!group.pendingNeedsDate) section18[type].submittedDate = ''
        } else {
          this.clearAttachmentSlot(group.slots.approved, attachments, removalKeys)
          this.clearAttachmentSlot(group.slots.pending, attachments, removalKeys)
          section18[type].submittedDate = ''
        }
      })
    },
    onSubmittedDateInput (type, value) {
      this.applyMutation((section18) => {
        if (!GROUP_META[type]) return
        section18[type].submittedDate = this.normalizeDate(value)
      })
    },
    activeAttachmentForGroup (type) {
      const slotKey = this.slotKeyFor(type, this.groupStatus(type))
      return this.attachmentForSlot(slotKey)
    },
    openActiveAttachment (type) {
      const slotKey = this.slotKeyFor(type, this.groupStatus(type))
      const file = this.attachmentForSlot(slotKey)
      if (!slotKey || !file) return
      this.$emit('open-attachment', { slotKey, file })
    },
    removeActiveAttachment (type) {
      const slotKey = this.slotKeyFor(type, this.groupStatus(type))
      const file = this.attachmentForSlot(slotKey)
      if (!slotKey || !file || this.isReadOnly) return
      this.$emit('remove-attachment', { slotKey, file })
    },
    triggerAttach (type, status) {
      if (this.isReadOnly) return
      const slotKey = this.slotKeyFor(type, status)
      if (!slotKey) return
      this.activeAttachmentKey = slotKey
      if (this.$refs.fileInput) this.$refs.fileInput.click()
    },
    handleFileSelected (event) {
      const input = event && event.target ? event.target : null
      const file = input && input.files ? input.files[0] : null
      if (!file || !this.activeAttachmentKey) return
      this.$emit('upload-attachment', { slotKey: this.activeAttachmentKey, file })
      input.value = ''
      this.activeAttachmentKey = ''
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
    }
  }
}
</script>

<style scoped lang="scss">
$accent-deep: #8b1d1d;
$accent-deep-hover: #731717;
$accent-outline: #b54a4a;
$surface-main: #fffdfb;
$surface-soft: #fdf7f1;
$surface-subtle: #f7f2ec;
$text-main: #1f2937;
$text-sub: #4b5563;
$text-muted: #6b7280;
$line-soft: #e5ded4;
$line-strong: #d5c8ba;
$success-bg: #eef8f1;
$success-line: #c9e7d2;
$error-bg: #fff5f5;

.research-standard {
  .section-title {
    font-weight: 700;
    color: #243244;
    margin-bottom: 12px;
    padding: 10px 14px;
    background: #f8f9fa;
    border-left: 4px solid $accent-deep;
    border-radius: 8px;
  }

  &__card {
    background: #fff;
    border: 1px solid $line-soft;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
  }

  &__hint {
    margin: 0 0 12px;
    color: $text-sub;
    font-size: 0.84rem;
    line-height: 1.45;
  }

  &__none-message {
    margin-bottom: 12px;
    border: 1px solid $success-line;
    border-radius: 12px;
    background: $success-bg;
    color: #2f6842;
    font-size: 0.84rem;
    font-weight: 600;
    line-height: 1.45;
    padding: 9px 12px;
  }
}

.standard-card {
  background: $surface-main;
  border: 1px solid $line-soft;
  border-radius: 14px;
  padding: 12px 12px 10px;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;

  & + & {
    margin-top: 10px;
  }

  &.is-active {
    background: $surface-soft;
    border-color: $line-strong;
    box-shadow: 0 4px 14px rgba(127, 29, 29, 0.08);
  }

  &.has-error {
    border-color: #e2a2a2;
    background: $error-bg;
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  &__toggle {
    display: inline-flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
    cursor: pointer;
    min-width: 0;
  }

  &__checkbox {
    margin-top: 2px;
    accent-color: $accent-deep;
  }

  &__title {
    color: $text-main;
    font-weight: 700;
    line-height: 1.45;
  }

  &__reset {
    border: 0;
    background: transparent;
    color: $accent-deep;
    font-size: 0.79rem;
    font-weight: 700;
    padding: 0;
    cursor: pointer;
    white-space: nowrap;
  }
}

.standard-subpanel {
  margin-top: 10px;
  border: 1px solid #e6dbcf;
  border-radius: 12px;
  background: $surface-subtle;
  padding: 11px 12px;

  &__options {
    display: grid;
    gap: 8px;
  }

  &__date-block {
    margin-top: 10px;
    max-width: 280px;
  }

  &__date-label {
    display: block;
    margin-bottom: 4px;
    color: $text-sub;
    font-size: 0.8rem;
    font-weight: 700;
  }

  &__actions {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  &__action-note {
    margin: 8px 0 0;
    color: $text-muted;
    font-size: 0.78rem;
    font-weight: 600;
  }
}

.standard-option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 7px 8px;
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease;

  &.is-selected {
    border-color: #d9b8b8;
    background: #fffaf8;
  }

  &__radio {
    margin-top: 3px;
    accent-color: $accent-deep;
  }

  &__label {
    color: $text-sub;
    font-size: 0.86rem;
    line-height: 1.5;
  }
}

.standard-action {
  &.btn {
    border-radius: 10px;
    font-weight: 700;
    line-height: 1.2;
    padding: 0.44rem 0.78rem;
  }

  &--primary.btn {
    border: 1px solid $accent-deep;
    background: $accent-deep;
    color: #fff;
  }

  &--primary.btn:hover,
  &--primary.btn:focus {
    border-color: $accent-deep-hover;
    background: $accent-deep-hover;
    color: #fff;
  }

  &--secondary.btn {
    border: 1px solid $accent-outline;
    background: #fff;
    color: $accent-deep;
  }

  &--secondary.btn:hover,
  &--secondary.btn:focus {
    border-color: $accent-deep;
    background: #fff7f7;
    color: $accent-deep;
  }

  &--danger.btn {
    border: 1px solid #c13a3a;
    background: #fff5f5;
    color: #8b1d1d;
  }
}

.standard-attachment {
  margin-top: 10px;
  border: 1px solid #dfd4c8;
  border-radius: 10px;
  background: #fff;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  &__name {
    color: $text-main;
    font-size: 0.83rem;
    font-weight: 600;
    line-height: 1.35;
    word-break: break-word;
  }

  &__actions {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.standard-errors {
  margin: 9px 0 0;
  padding: 0;
  list-style: none;

  &__item {
    color: #b91c1c;
    font-size: 0.79rem;
    font-weight: 700;
    line-height: 1.4;
  }
}

.standard-expand-enter-active,
.standard-expand-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.standard-expand-enter,
.standard-expand-leave-to {
  opacity: 0;
  transform: translateY(-3px);
}

.research-standard.is-dark {
  .section-title {
    color: #edf3fb;
    background: #1f2b39;
    border-left-color: #d6a24b;
  }

  .research-standard__card {
    background: #1a2432;
    border-color: #2f3f52;
    box-shadow: none;
  }

  .research-standard__hint {
    color: #adbbcc;
  }

  .research-standard__none-message {
    background: rgba(34, 197, 94, 0.16);
    border-color: rgba(74, 222, 128, 0.32);
    color: #c4f4d1;
  }

  .standard-card {
    background: #202c3a;
    border-color: #35485d;

    &.is-active {
      background: #243243;
      border-color: #48607b;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.35);
    }

    &.has-error {
      background: rgba(127, 29, 29, 0.22);
      border-color: rgba(248, 113, 113, 0.45);
    }

    &__title {
      color: #e7eef7;
    }
  }

  .standard-subpanel {
    background: #1f2e3d;
    border-color: #375069;

    &__date-label {
      color: #c3d0df;
    }
  }

  .standard-option {
    &.is-selected {
      border-color: #5f7894;
      background: #243648;
    }

    &__label {
      color: #d5e0ee;
    }
  }

  .standard-attachment {
    border-color: #415a74;
    background: #182433;

    &__name {
      color: #e4eef9;
    }
  }
}

@media (max-width: 768px) {
  .research-standard__card {
    padding: 12px;
  }

  .standard-card {
    padding: 10px 10px 9px;

    &__header {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  .standard-attachment {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
