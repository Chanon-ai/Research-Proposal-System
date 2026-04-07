<template>
  <div class="collaboration-section" :class="{ 'is-dark': isDarkTheme }">
    <div class="funding-options collaboration-selector">
      <p class="collaboration-selector__hint mb-1">{{ text.hintPrimary }}</p>
      <p class="collaboration-selector__hint mb-2">{{ text.hintSecondary }}</p>

      <div v-if="!records.length" class="collaboration-selector__empty-state">
        <div class="collaboration-selector__empty-title">{{ text.emptyTitle }}</div>
        <div class="collaboration-selector__empty-subtitle">{{ text.emptySubtitle }}</div>
        <button
          v-if="!isReadOnly"
          type="button"
          class="btn btn-outline-primary collaboration-selector__add-btn"
          @click="$emit('add-record')"
        >
          {{ text.addRecord }}
        </button>
      </div>

      <div v-else class="collaboration-selector__records">
        <article
          v-for="(record, index) in records"
          :key="record.uid"
          class="collaboration-record-card"
          :class="{ 'has-error': !isReadOnly && recordHasErrors(record), 'is-read-only': isReadOnly }"
        >
          <div class="collaboration-record-card__header">
            <div class="collaboration-record-card__title">{{ text.recordTitle(index + 1) }}</div>
            <button
              v-if="!isReadOnly"
              type="button"
              class="collaboration-record-card__remove-btn"
              :aria-label="text.removeRecordAria"
              @click="$emit('remove-record', index)"
            >
              <i class="cil-trash collaboration-record-card__remove-icon" aria-hidden="true" />
              <span>{{ text.remove }}</span>
            </button>
          </div>

          <div class="collaboration-record-card__grid">
            <div class="form-group collaboration-record-card__field">
              <label class="collaboration-record-card__label" :for="`collab-person-${record.uid}`">{{ text.personNameLabel }}</label>
              <input
                :id="`collab-person-${record.uid}`"
                :value="record.personName"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': !isReadOnly && fieldHasError(record, 'personName') }"
                :placeholder="text.personNamePlaceholder"
                :disabled="isReadOnly"
                @input="$emit('field-input', record, 'personName', $event.target.value)"
                @blur="$emit('field-blur', record, 'personName')"
              >
              <small v-if="!isReadOnly && fieldHasError(record, 'personName')" class="text-danger">{{ text.personNameRequired }}</small>
            </div>

            <div class="form-group collaboration-record-card__field">
              <label class="collaboration-record-card__label" :for="`collab-org-${record.uid}`">{{ text.organizationNameLabel }}</label>
              <input
                :id="`collab-org-${record.uid}`"
                :value="record.organizationName"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': !isReadOnly && fieldHasError(record, 'organizationName') }"
                :placeholder="text.organizationNamePlaceholder"
                :disabled="isReadOnly"
                @input="$emit('field-input', record, 'organizationName', $event.target.value)"
                @blur="$emit('field-blur', record, 'organizationName')"
              >
              <small v-if="!isReadOnly && fieldHasError(record, 'organizationName')" class="text-danger">{{ text.organizationNameRequired }}</small>
            </div>

            <div class="form-group collaboration-record-card__field collaboration-record-card__field--full">
              <label class="collaboration-record-card__label" :for="`collab-address-${record.uid}`">{{ text.addressLabel }}</label>
              <textarea
                :id="`collab-address-${record.uid}`"
                :value="record.address"
                class="form-control"
                :class="{ 'is-invalid': !isReadOnly && fieldHasError(record, 'address') }"
                rows="2"
                :placeholder="text.addressPlaceholder"
                :disabled="isReadOnly"
                @input="$emit('field-input', record, 'address', $event.target.value)"
                @blur="$emit('field-blur', record, 'address')"
              />
              <small v-if="!isReadOnly && fieldHasError(record, 'address')" class="text-danger">{{ text.addressRequired }}</small>
            </div>

            <div class="form-group collaboration-record-card__field collaboration-record-card__field--full mb-0">
              <label class="collaboration-record-card__label" :for="`collab-nature-${record.uid}`">{{ text.collaborationNatureLabel }}</label>
              <textarea
                :id="`collab-nature-${record.uid}`"
                :value="record.collaborationNature"
                class="form-control"
                :class="{ 'is-invalid': !isReadOnly && fieldHasError(record, 'collaborationNature') }"
                rows="3"
                :placeholder="text.collaborationNaturePlaceholder"
                :disabled="isReadOnly"
                @input="$emit('field-input', record, 'collaborationNature', $event.target.value)"
                @blur="$emit('field-blur', record, 'collaborationNature')"
              />
              <small v-if="!isReadOnly && fieldHasError(record, 'collaborationNature')" class="text-danger">{{ text.collaborationNatureRequired }}</small>
            </div>
          </div>
        </article>

        <div v-if="!isReadOnly && validationCount" class="collaboration-selector__validation-note">
          {{ text.validationNote(validationCount) }}
        </div>
      </div>

      <button
        v-if="!isReadOnly && records.length"
        type="button"
        class="btn btn-outline-primary collaboration-selector__add-btn mt-2"
        @click="$emit('add-record')"
      >
        {{ text.addRecord }}
      </button>

      <small class="collaboration-selector__helper d-block">{{ text.helper }}</small>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProjectCollaborationSection',
  props: {
    records: {
      type: Array,
      default: () => []
    },
    validationCount: {
      type: Number,
      default: 0
    },
    recordHasErrors: {
      type: Function,
      default: () => false
    },
    fieldHasError: {
      type: Function,
      default: () => false
    },
    isReadOnly: {
      type: Boolean,
      default: false
    },
    isDarkTheme: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    isEnglishLocale () {
      const locale = this.$i18n && this.$i18n.locale ? String(this.$i18n.locale) : 'th'
      return locale.toLowerCase().startsWith('en')
    },
    text () {
      if (this.isEnglishLocale) {
        return {
          hintPrimary: 'Provide contact details for individuals or organizations involved in the research collaboration, if any.',
          hintSecondary: 'This section is optional, but if provided, each field should be completed for clarity.',
          emptyTitle: 'No collaboration records yet',
          emptySubtitle: 'You can add more than one item, such as a university, government agency, or private organization.',
          addRecord: 'Add Collaboration',
          recordTitle: (index) => `Collaboration Record ${index}`,
          removeRecordAria: 'Remove collaboration record',
          remove: 'Remove',
          personNameLabel: 'Person name',
          personNamePlaceholder: 'For example: Dr. John Doe',
          personNameRequired: 'Please enter the person name',
          organizationNameLabel: 'Organization name',
          organizationNamePlaceholder: 'For example: Mae Fah Luang University',
          organizationNameRequired: 'Please enter the organization name',
          addressLabel: 'Address',
          addressPlaceholder: 'Enter the address or a short contact location description',
          addressRequired: 'Please enter the address',
          collaborationNatureLabel: 'Nature of research collaboration',
          collaborationNaturePlaceholder: 'Briefly describe the role or scope of the collaboration',
          collaborationNatureRequired: 'Please enter the nature of the research collaboration',
          validationNote: (count) => `${count} collaboration record(s) are still incomplete`,
          helper: 'Note: If you add a record, please complete every field so the document remains accurate.'
        }
      }

      return {
        hintPrimary: 'ระบุข้อมูลผู้ประสานงานหรือหน่วยงานที่เกี่ยวข้องกับความร่วมมือทางวิจัย (ถ้ามี)',
        hintSecondary: 'ข้อมูลส่วนนี้ไม่บังคับ แต่หากระบุแล้วควรกรอกให้ครบถ้วนเพื่อความชัดเจน',
        emptyTitle: 'ยังไม่มีรายการความร่วมมือ',
        emptySubtitle: 'สามารถเพิ่มได้มากกว่า 1 รายการ เช่น มหาวิทยาลัย หน่วยงานรัฐ หรือภาคเอกชน',
        addRecord: 'เพิ่มรายการความร่วมมือ',
        recordTitle: (index) => `รายการความร่วมมือที่ ${index}`,
        removeRecordAria: 'ลบรายการความร่วมมือ',
        remove: 'ลบ',
        personNameLabel: 'ชื่อบุคคล',
        personNamePlaceholder: 'เช่น ดร.สมชาย ใจดี',
        personNameRequired: 'กรุณาระบุชื่อบุคคล',
        organizationNameLabel: 'ชื่อหน่วยงาน',
        organizationNamePlaceholder: 'เช่น มหาวิทยาลัย...',
        organizationNameRequired: 'กรุณาระบุชื่อหน่วยงาน',
        addressLabel: 'ที่อยู่',
        addressPlaceholder: 'ระบุที่อยู่หรือข้อมูลสถานที่ติดต่อโดยสรุป',
        addressRequired: 'กรุณาระบุที่อยู่',
        collaborationNatureLabel: 'ลักษณะความร่วมมือทางวิจัย',
        collaborationNaturePlaceholder: 'อธิบายบทบาทหรือขอบเขตความร่วมมือโดยย่อ',
        collaborationNatureRequired: 'กรุณาระบุลักษณะความร่วมมือทางวิจัย',
        validationNote: (count) => `มี ${count} รายการที่ข้อมูลยังไม่ครบถ้วน`,
        helper: 'หมายเหตุ: หากเพิ่มรายการ กรุณากรอกข้อมูลแต่ละช่องให้ครบเพื่อความถูกต้องของเอกสาร'
      }
    }
  }
}
</script>

<style scoped>
.funding-options {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.collaboration-selector__hint {
  font-size: 0.82rem;
  color: #5b6b80;
  line-height: 1.45;
}

.collaboration-selector__add-btn {
  min-width: 180px;
  font-weight: 600;
}

.collaboration-selector__helper {
  margin-top: 8px;
  font-size: 0.76rem;
  color: #6b7280;
}

.collaboration-selector__empty-state {
  margin-top: 8px;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  background: #ffffff;
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.collaboration-selector__empty-title {
  font-weight: 700;
  color: #1f2937;
}

.collaboration-selector__empty-subtitle {
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.45;
}

.collaboration-selector__records {
  margin-top: 8px;
  display: grid;
  gap: 10px;
}

.collaboration-record-card {
  border: 1px solid #d8e2ef;
  border-radius: 10px;
  background: #ffffff;
  padding: 12px;
}

.collaboration-record-card.has-error {
  border-color: #fbbf24;
  box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.16);
}

.collaboration-record-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.collaboration-record-card__title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1f2937;
}

.collaboration-record-card__remove-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-width: 110px;
  padding: 7px 16px;
  border: 1px solid #b91c1c;
  border-radius: 12px;
  background: #ffffff;
  color: #b91c1c;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
}

.collaboration-record-card__remove-btn:hover {
  background: #fef2f2;
  border-color: #991b1b;
  color: #991b1b;
}

.collaboration-record-card__remove-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
}

.collaboration-record-card__remove-icon {
  font-size: 0.9rem;
  line-height: 1;
}

.collaboration-record-card__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.collaboration-record-card__field {
  margin-bottom: 0;
}

.collaboration-record-card__field--full {
  grid-column: 1 / -1;
}

.collaboration-record-card__label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
}

.collaboration-selector__validation-note {
  border-radius: 8px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  padding: 6px 9px;
  font-size: 0.78rem;
  font-weight: 600;
}

.collaboration-section.is-dark .funding-options {
  background: #1a2432;
  border: 1px solid #2f3f52;
}

.collaboration-section.is-dark .collaboration-selector__hint,
.collaboration-section.is-dark .collaboration-selector__helper,
.collaboration-section.is-dark .collaboration-selector__empty-subtitle,
.collaboration-section.is-dark .collaboration-selector__validation-note {
  color: #aab9ca;
}

.collaboration-section.is-dark .collaboration-selector__empty-state,
.collaboration-section.is-dark .collaboration-record-card {
  background: #1a2432;
  border-color: #324458;
}

.collaboration-section.is-dark .collaboration-selector__empty-title,
.collaboration-section.is-dark .collaboration-record-card__title,
.collaboration-section.is-dark .collaboration-record-card__label {
  color: #e6edf7;
}

.collaboration-section.is-dark .collaboration-record-card.has-error {
  border-color: #d97706;
  box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.18);
}

.collaboration-section.is-dark .collaboration-record-card__remove-btn {
  background: rgba(127, 29, 29, 0.24);
  border-color: #f87171;
  color: #fecaca;
}

.collaboration-section.is-dark .collaboration-record-card__remove-btn:hover {
  background: rgba(127, 29, 29, 0.38);
  border-color: #fca5a5;
  color: #fee2e2;
}

@media (max-width: 768px) {
  .collaboration-selector__add-btn {
    width: 100%;
  }

  .collaboration-selector__empty-state {
    padding: 12px;
  }

  .collaboration-record-card {
    padding: 10px;
  }

  .collaboration-record-card__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .collaboration-record-card__grid {
    grid-template-columns: 1fr;
  }
}
</style>
