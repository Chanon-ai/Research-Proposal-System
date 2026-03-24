<template>
  <div class="admin-meetings-page">
    <section class="meetings-hero">
      <div class="meetings-hero__content">
        <div class="meetings-hero__eyebrow">{{ heroEyebrow }}</div>
        <h2 class="meetings-hero__title">{{ heroTitle }}</h2>
        <p class="meetings-hero__subtitle mb-0">
          {{ heroSubtitle }}
        </p>
      </div>
      <div v-if="canCreate" class="meetings-hero__action">
        <CButton color="primary" size="lg" class="hero-action-btn" @click="openCreateModal">+ สร้างการประชุมใหม่
        </CButton>
      </div>
    </section>

    <CRow class="summary-row summary-row--filters">
      <CCol sm="6" lg="4">
        <div class="summary-card summary-card--info"
          :class="{ 'summary-card--active': isSummaryFilterActive('scheduled') }" role="button" tabindex="0"
          :aria-pressed="isSummaryFilterActive('scheduled') ? 'true' : 'false'"
          @click="toggleSummaryFilter('scheduled')" @keydown.enter.prevent="toggleSummaryFilter('scheduled')"
          @keydown.space.prevent="toggleSummaryFilter('scheduled')">
          <div class="summary-label">กำหนดการแล้ว</div>
          <div class="summary-number">{{ getSummaryCount('scheduled') }}</div>
          <div class="summary-caption">รายการที่กำลังรอวันประชุมหรือยังไม่ปิดผล</div>
        </div>
      </CCol>
      <CCol sm="6" lg="4">
        <div class="summary-card summary-card--success"
          :class="{ 'summary-card--active': isSummaryFilterActive('completed') }" role="button" tabindex="0"
          :aria-pressed="isSummaryFilterActive('completed') ? 'true' : 'false'"
          @click="toggleSummaryFilter('completed')" @keydown.enter.prevent="toggleSummaryFilter('completed')"
          @keydown.space.prevent="toggleSummaryFilter('completed')">
          <div class="summary-label">เสร็จสิ้น</div>
          <div class="summary-number">{{ getSummaryCount('completed') }}</div>
          <div class="summary-caption">ประชุมที่บันทึกผลเรียบร้อยแล้ว</div>
        </div>
      </CCol>
      <CCol sm="6" lg="4">
        <div class="summary-card summary-card--danger"
          :class="{ 'summary-card--active': isSummaryFilterActive('cancelled') }" role="button" tabindex="0"
          :aria-pressed="isSummaryFilterActive('cancelled') ? 'true' : 'false'"
          @click="toggleSummaryFilter('cancelled')" @keydown.enter.prevent="toggleSummaryFilter('cancelled')"
          @keydown.space.prevent="toggleSummaryFilter('cancelled')">
          <div class="summary-label">ยกเลิก</div>
          <div class="summary-number">{{ getSummaryCount('cancelled') }}</div>
          <div class="summary-caption">ใช้ติดตามรายการที่ต้องนัดหมายใหม่</div>
        </div>
      </CCol>
    </CRow>

    <CCard class="filter-card">
      <CCardBody>
        <div class="filter-card__header">
          <div>
            <div class="filter-card__title">ค้นหาการประชุม</div>
            <div class="filter-card__subtitle">
              พิมพ์คำค้นหาเพื่อค้นหาจาก
              <span>ชื่อการประชุม สถานที่ ลิงก์ วาระการประชุม</span>
            </div>
          </div>
        </div>
        <CRow class="align-items-end">
          <CCol md="8" class="mb-2 mb-md-0">
            <CInput v-model="searchKeyword" label="ค้นหา" placeholder="เช่น ชื่อการประชุม, สถานที่, ลิงก์..."
              @input="onSearchKeywordInput" />
          </CCol>
          <CCol md="4" class="mb-2 mb-md-0">
            <div class="filter-card__search-actions">
              <template v-if="canEditDelete">
                <CButton size="sm" :color="selectionMode ? 'secondary' : 'primary'" class="filter-card__select-toggle"
                  @click="toggleSelectionMode">
                  {{ selectionMode ? 'ยกเลิกเลือก' : 'เลือก' }}
                </CButton>
                <small class="text-muted filter-card__search-hint">
                  {{ selectionMode
                    ? (selectedMeetingForActions ? 'เลือกการประชุมแล้ว — ใช้ปุ่มแก้ไข/ลบที่การ์ด' :
                      'คลิกการ์ดการประชุมด้านล่างเพื่อแสดงปุ่มแก้ไข/ลบ')
                    : 'กดปุ่มเลือกเพื่อเลือกการประชุมสำหรับแก้ไข/ลบ'
                  }}
                </small>
              </template>
            </div>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <div v-if="loading" class="text-center py-5">
      <CSpinner color="primary" />
      <div class="mt-2 text-muted">กำลังโหลดรายการประชุม...</div>
    </div>

    <div v-else>
      <div v-if="meetings.length === 0" class="empty-state">
        <div class="empty-state__icon">🗓️</div>
        <div class="empty-state__title">ยังไม่มีรายการประชุม</div>
        <div class="empty-state__text">
          {{ canCreate
            ? 'เริ่มต้นด้วยการสร้างการประชุมใหม่เพื่อจัดการรอบประชุมและบันทึกผลภายหลัง'
            : 'ยังไม่มีรายการประชุมในระบบ'
          }}
        </div>
      </div>

      <div v-else class="meeting-grid">
        <div v-for="meeting in meetings" :key="meeting._id" class="meeting-card"
          :class="[
            getMeetingCardClass(meeting),
            isSelectedMeeting(meeting) ? 'meeting-card--selected' : '',
            (selectionMode && !isMeetingActionable(meeting)) ? 'meeting-card--locked' : ''
          ]"
          @click="selectionMode && selectMeetingForActions(meeting)"
          @keydown.enter.prevent="selectionMode && selectMeetingForActions(meeting)"
          @keydown.space.prevent="selectionMode && selectMeetingForActions(meeting)" role="button" tabindex="0"
          :aria-disabled="(selectionMode && isMeetingActionable(meeting)) ? 'false' : 'true'">
          <div class="meeting-card__left-bar" aria-hidden="true"></div>
          <div class="meeting-card__surface ">
            <div v-if="canEditDelete && selectionMode && isSelectedMeeting(meeting)" class="meeting-card__selected-overlay" @click.stop>
              <button type="button" class="meeting-card__overlay-close" aria-label="ปิดเมนูแก้ไข/ลบ"
                @click.stop="clearSelectedMeeting">
                <CIcon name="cil-x" width="18" aria-hidden="true" />
              </button>
              <div class="meeting-card__selected-actions">
                <CButton size="sm" color="warning" class="meeting-card__overlay-btn meeting-card__overlay-btn--edit"
                  @click.stop="openEditModal(meeting)">
                  <CIcon name="cil-pencil" width="16" class="meeting-card__overlay-ic" aria-hidden="true" />
                  แก้ไข
                </CButton>
                <CButton size="sm" color="danger" class="meeting-card__overlay-btn meeting-card__overlay-btn--delete"
                  @click.stop="deleteMeeting(meeting)">
                  <CIcon name="cil-trash" width="16" class="meeting-card__overlay-ic" aria-hidden="true" />
                  ลบ
                </CButton>
              </div>
            </div>
            <div class="meeting-card__top mt-1">
              <CBadge class="meeting-card__badge" :color="getStatusMeta(meeting.status).color">{{
                getStatusMeta(meeting.status).label }}</CBadge>
              <span class="meeting-card__participant-pill">
                <CIcon name="cil-people" width="16" class="meeting-card__participant-ic" aria-hidden="true" />
                <span class="meeting-card__participant-text">
                  {{ Array.isArray(meeting.participantIds) ? meeting.participantIds.length : 0 }} ผู้เข้าร่วม
                </span>
              </span>
            </div>

            <div class="meeting-card__content">
              <div class="meeting-card__body">
                <div class="meeting-card__title-wrap">
                  <div class="meeting-card__title-row">
                    <button v-if="getMeetingProposalId(meeting)" type="button" class="meeting-card__proposal-link"
                      :aria-label="`เปิดแบบฟอร์มโครงการ`" @click.stop="goToProposalForm(meeting)">
                      <CIcon name="cil-description" width="18" aria-hidden="true" />
                    </button>
                    <h5 class="meeting-card__title" :aria-label="meeting.title || '-'" tabindex="0"
                      @mouseenter="maybeOpenTitleTooltip($event, meeting)" @mouseleave="closeTitleTooltip()"
                      @focus="maybeOpenTitleTooltip($event, meeting)" @blur="closeTitleTooltip()"
                      @click.stop="toggleTitleTooltip($event, meeting)">
                      {{ meeting.title || '-' }}
                    </h5>
                  </div>
                  <div v-if="isTitleTooltipOpen(meeting)" class="meeting-card__title-tooltip" role="tooltip">
                    {{ meeting.title || '-' }}
                  </div>
                </div>
                <div class="meeting-card__meta ">
                  <div class="meeting-card__meta-item" tabindex="0"
                    @mouseenter="maybeOpenMetaTooltip($event, `${meeting._id}-date`, formatDate(meeting.meetingDate))"
                    @mouseleave="closeMetaTooltip()"
                    @focus="maybeOpenMetaTooltip($event, `${meeting._id}-date`, formatDate(meeting.meetingDate))"
                    @blur="closeMetaTooltip()"
                    @click.stop="toggleMetaTooltip($event, `${meeting._id}-date`, formatDate(meeting.meetingDate))">
                    <CWidgetIcon class="meeting-card__meta-widget" :header="formatDate(meeting.meetingDate)"
                      text="วันที่" color="gradient-primary" :icon-padding="false">
                      <CIcon name="cil-calendar" width="24" />
                    </CWidgetIcon>
                    <div v-if="isMetaTooltipOpen(`${meeting._id}-date`)" class="meeting-card__meta-tooltip"
                      role="tooltip">
                      {{ metaTooltip.text }}
                    </div>
                  </div>

                  <div class="meeting-card__meta-item" tabindex="0"
                    @mouseenter="maybeOpenMetaTooltip($event, `${meeting._id}-time`, `${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}`)"
                    @mouseleave="closeMetaTooltip()"
                    @focus="maybeOpenMetaTooltip($event, `${meeting._id}-time`, `${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}`)"
                    @blur="closeMetaTooltip()"
                    @click.stop="toggleMetaTooltip($event, `${meeting._id}-time`, `${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}`)">
                    <CWidgetIcon class="meeting-card__meta-widget"
                      :header="`${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}`" text="เวลา"
                      color="gradient-info" :icon-padding="false">
                      <CIcon name="cil-clock" width="24" />
                    </CWidgetIcon>
                    <div v-if="isMetaTooltipOpen(`${meeting._id}-time`)" class="meeting-card__meta-tooltip"
                      role="tooltip">
                      {{ metaTooltip.text }}
                    </div>
                  </div>
                </div>

                <div class="meeting-card__detail-list">
                  <div class="meeting-card__detail">
                    <span class="meeting-card__detail-key">รูปแบบ</span>
                    <span
                      :class="[
                        'meeting-card__detail-value',
                        (meeting && (meeting.videoLink || (meeting.meetingType && String(meeting.meetingType).trim().toLowerCase() === 'online')))
                          ? 'meeting-mode meeting-mode--online'
                          : (meeting && meeting.meetingType && String(meeting.meetingType).trim().toLowerCase() === 'onsite')
                            ? 'meeting-mode meeting-mode--onsite'
                            : ''
                      ]"
                    >
                      {{ getMeetingModeLabel(meeting) }}
                    </span>
                  </div>
                  <div class="meeting-card__detail">
                    <span class="meeting-card__detail-key">สถานที่</span>
                    <span class="meeting-card__detail-value">{{ meeting.location || '-' }}</span>
                  </div>
                  <div class="meeting-card__detail">
                    <span class="meeting-card__detail-key">ลิงก์ประชุม</span>
                    <span class="meeting-card__detail-value is-link">
                      <a v-if="meeting.videoLink" class="meeting-card__link-btn" :href="meeting.videoLink"
                        target="_blank" rel="noopener noreferrer" :aria-label="`เปิดลิงก์ประชุม: ${meeting.videoLink}`"
                        @click.stop>
                        <CIcon name="cil-link" width="18" aria-hidden="true" />
                      </a>
                      <button v-else type="button" class="meeting-card__link-btn is-disabled" disabled
                        aria-disabled="true" @click.stop.prevent>
                        <CIcon name="cil-link-broken" width="16" aria-hidden="true" />
                      </button>
                    </span>
                  </div>
                </div>

                <div class="meeting-card__agenda">
                  <div class="meeting-card__agenda-label">วาระการประชุม</div>
                  <div class="meeting-card__agenda-body">
                    {{ (meeting && typeof meeting.agenda === 'string' && meeting.agenda.trim()) ? meeting.agenda : '-'
                    }}
                  </div>
                </div>
              </div>

              <div class="meeting-card__footer">
                <CButton size="sm" block
                  :color="(isReadOnly(meeting) && readOnlyCtaTone === 'dark') ? 'primary' : (isReadOnly(meeting) ? 'secondary' : (meeting.status === 'completed' ? 'secondary' : 'primary'))"
                  :class="[
                    'meeting-card__cta',
                    (meeting.status === 'completed' && !isReadOnly(meeting)) ? 'is-completed' : '',
                    (isReadOnly(meeting) && readOnlyCtaTone === 'soft') ? 'meeting-card__cta--soft' : ''
                  ]"
                  @click.stop="openMinutesModal(meeting)">
                  {{ isReadOnly(meeting) ? 'ดูรายละเอียด' : (meeting.status === 'completed' ? 'ดูผลประชุม' : 'บันทึกผลประชุม') }}
                </CButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center mt-3 flex-wrap" style="gap: 8px;">
        <small class="text-muted">หน้าที่ {{ page }} / {{ totalPages }} | ทั้งหมด {{ total }} รายการ</small>
        <div>
          <CButton size="sm" color="secondary" variant="outline" class="mr-2" :disabled="page <= 1 || loading"
            @click="onPageChange(page - 1)">
            ก่อนหน้า
          </CButton>
          <CButton size="sm" color="secondary" variant="outline" :disabled="page >= totalPages || loading"
            @click="onPageChange(page + 1)">
            ถัดไป
          </CButton>
        </div>
      </div>
    </div>

    <CModal v-if="canCreate" :show.sync="showMeetingModal" :close-on-backdrop="false" centered size="lg" class="meeting-modal">
      <template #header-wrapper>
        <div class="modal-header">
          <h5 class="modal-title">{{ isEditMode ? 'แก้ไขการประชุม' : 'สร้างการประชุมใหม่' }}</h5>
          <div class="meeting-modal__header-actions">
            <CButton
              v-if="isEditMode && selectedMeeting && meetingForm && meetingForm.status === 'scheduled'"
              size="sm"
              color="danger"
              variant="outline"
              class="meeting-modal__cancel-meeting"
              @click="cancelMeeting"
            >
              <CIcon name="cil-ban" width="16" class="mr-1  icon-bold" aria-hidden="true" />
              ยกเลิกการประชุม
            </CButton>
            <button type="button" class="close" aria-label="Close" @click="closeMeetingModal">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>
      </template>
      <template #body-wrapper>
        <div class="meeting-form">
          <div class="field full-field">
            <label class="form-label mt-3">โครงการที่เกี่ยวข้อง <span class="required">*</span></label>
            <multiselect v-model="selectedProposalOption" :options="proposalOptions" :searchable="true"
              :clear-on-select="false" :close-on-select="true" :preserve-search="true" :allow-empty="true"
              :loading="proposalOptionsLoading" label="searchText" track-by="_id"
              placeholder="พิมพ์เพื่อค้นหาโครงการ..." :custom-label="formatProposalTitle" @input="onProposalSelected">
              <template slot="singleLabel" slot-scope="{ option }">
                <span>{{ formatProposalTitle(option) }}</span>
              </template>
              <template slot="option" slot-scope="{ option }">
                <div>
                  <div class="font-weight-bold">{{ option.projectTitleTh || option.projectTitleEn || '-' }}</div>
                  <div v-if="getProposalLeaderName(option)" class="text-muted small">
                    หัวหน้าโครงการ: {{ getProposalLeaderName(option) }}
                  </div>
                </div>
              </template>
            </multiselect>
            <small class="text-muted d-block mt-1">ระบบจะแสดงโครงการที่เลือกจากหน้าจัดการโครงการโดยอัตโนมัติ</small>
            <small v-if="proposalOptionsError" class="text-warning d-block mt-1">โหลดรายชื่อโครงการไม่สำเร็จ: {{
              proposalOptionsError }}</small>
          </div>
          <div class="field full-field">
            <label class="form-label">ผู้เข้าร่วมเพิ่มเติม (ไม่บังคับ)</label>
            <multiselect v-model="selectedParticipantOptions" :options="participantOptions" :searchable="true"
              :multiple="true" :close-on-select="false" :clear-on-select="false" :preserve-search="true"
              :allow-empty="true" :loading="participantOptionsLoading" label="searchText" track-by="_id"
              placeholder="พิมพ์เพื่อค้นหาผู้ใช้..." :custom-label="formatParticipantLabel">
              <template slot="option" slot-scope="{ option }">
                <div>
                  <div class="font-weight-bold">{{ option.fullName || '-' }}</div>
                  <small class="text-muted">{{ option.email || '' }}</small>
                </div>
              </template>
            </multiselect>
            <small v-if="participantOptionsError" class="text-warning d-block mt-1">โหลดรายชื่อผู้ใช้ไม่สำเร็จ: {{
              participantOptionsError }}</small>
          </div>
          <div class="field full-field">
            <label class="form-label">ชื่อการประชุม <span class="required">*</span></label>
            <CInput class="full" placeholder="กรอกชื่อการประชุม" v-model="meetingForm.title" />
          </div>

          <div class="small-row">
            <div class="field small-field">
              <label class="form-label">วันที่ประชุม <span class="required">*</span></label>
              <v-date-picker v-model="meetingDatePickerValue" :min-date="enforceMinDateTime ? minMeetingDateObj : null"
                :popover="{ visibility: 'focus', placement: 'bottom-start' }">
                <template #default="{ inputValue, inputEvents }">
                  <div class="input-icon__wrap" data-tone="primary">
                    <input ref="meetingDateInput" class="form-control input-icon__control"
                      :value="meetingDatePickerValue ? formatThaiDateExampleShort(meetingDatePickerValue) : ''"
                      v-on="inputEvents" readonly placeholder="เลือกวันที่">
                    <button type="button" class="input-icon__suffix" @mousedown.prevent
                      @click="focusPicker('meetingDateInput')">
                      <CIcon name="cil-calendar" width="16" class="input-icon__ic" aria-hidden="true" />
                    </button>
                  </div>
                </template>
              </v-date-picker>
              <small v-if="meetingDatePickerValue" class="text-muted d-block mt-1">{{
                formatThaiDateBelow(meetingDatePickerValue)
              }}</small>
            </div>
            <div class="field small-field">
              <label class="form-label">เวลาเริ่ม <span class="required">*</span></label>
              <div class="input-icon__wrap" data-tone="info">
                <input ref="startTimeTrigger" class="form-control input-icon__control time-trigger" type="text"
                  :value="meetingForm.startTime ? formatTime12h(meetingForm.startTime) : ''"
                  placeholder="เลือกเวลาเริ่ม" readonly @click="toggleTimeDropdown('start')" />
                <button type="button" class="input-icon__suffix" @mousedown.prevent
                  @click="toggleTimeDropdown('start')">
                  <CIcon name="cil-clock" width="16" class="input-icon__ic" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div class="field small-field">
              <label class="form-label">เวลาสิ้นสุด</label>
              <div class="input-icon__wrap" data-tone="info">
                <input ref="endTimeTrigger" class="form-control input-icon__control time-trigger" type="text"
                  :value="meetingForm.endTime ? formatTime12h(meetingForm.endTime) : ''"
                  :placeholder="meetingForm.startTime ? '-' : 'เลือกเวลาสิ้นสุด'" readonly
                  :disabled="!meetingForm.startTime" @click="toggleTimeDropdown('end')" />
                <button type="button" class="input-icon__suffix" @mousedown.prevent :disabled="!meetingForm.startTime"
                  @click="toggleTimeDropdown('end')">
                  <CIcon name="cil-clock" width="16" class="input-icon__ic" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div class="field full-field">
            <label class="form-label">ประเภทการประชุม</label>
            <div class="meeting-type-toggle" role="radiogroup" aria-label="ประเภทการประชุม">
              <input id="meeting-type-online" class="meeting-type-toggle__input" type="radio" value="online"
                v-model="meetingForm.meetingType">
              <label class="meeting-type-toggle__label" for="meeting-type-online">ออนไลน์</label>
              <input id="meeting-type-onsite" class="meeting-type-toggle__input" type="radio" value="onsite"
                v-model="meetingForm.meetingType">
              <label class="meeting-type-toggle__label" for="meeting-type-onsite">ออนไซต์</label>
            </div>
          </div>

          <div class="field full-field">
            <label class="form-label">สถานที่ <span v-if="meetingForm.meetingType === 'onsite'"
                class="required">*</span></label>
            <input type="text" class="form-control full" v-model="meetingForm.location"
              :disabled="meetingForm.meetingType === 'online'"
              :placeholder="meetingForm.meetingType === 'online' ? 'ออนไลน์: ไม่ต้องกรอกสถานที่' : 'เช่น C1 101'" />
          </div>

          <div class="field full-field">
            <label class="form-label">ลิงก์วิดีโอประชุม <span v-if="meetingForm.meetingType === 'online'"
                class="required">*</span></label>
            <CInput class="full" type="url" placeholder="เช่น https://meet.google.com/..."
              v-model="meetingForm.videoLink" />
          </div>

          <div class="field full-field">
            <label class="form-label">วาระการประชุม</label>
            <CTextarea class="full" rows="4" placeholder="ใส่หัวข้อย่อยหรือประเด็นหลักที่ต้องหารือ (ถ้ามี)"
              v-model="meetingForm.agenda" />
          </div>

        </div>
      </template>

      <template #footer-wrapper>
        <div class="d-flex justify-content-end w-100 modal-actions-wrapper">
          <CButton color="secondary" class="mr-3 floating-action btn-cancel" @click="closeMeetingModal">ยกเลิก</CButton>
          <CButton color="primary" class="floating-action btn-save" :disabled="savingMeeting" @click="saveMeeting">
            {{ savingMeeting ? 'กำลังบันทึก...' : 'บันทึก' }}
          </CButton>
        </div>
      </template>
    </CModal>

    <div v-if="canCreate && timeDropdown.openFor" class="time-dropdown__backdrop" @mousedown="closeTimeDropdown"></div>
    <div v-if="canCreate && timeDropdown.openFor" class="time-dropdown" ref="timeDropdownPanel" :style="{
      top: timeDropdown.top + 'px',
      left: timeDropdown.left + 'px',
      width: timeDropdown.width + 'px',
      maxHeight: timeDropdown.maxHeight + 'px'
    }" @mousedown.stop>
      <button v-for="opt in (timeDropdown.openFor === 'start' ? startTimeOptions : endTimeOptions)"
        :key="(timeDropdown.openFor || '') + '-' + (opt.value || 'empty')" type="button" class="time-dropdown__item"
        :class="{ 'is-selected': isTimeSelected(timeDropdown.openFor, opt.value) }"
        @click="selectTimeOption(timeDropdown.openFor, opt.value)">
        {{ opt.label }}
      </button>
    </div>

    <CModal :show.sync="showMinutesModal" :close-on-backdrop="false" centered size="xl" class="minutes-modal"
      :title="`${readOnly ? 'รายละเอียดการประชุม' : 'บันทึกผลการประชุม'} — ${minutesMeeting ? (minutesMeeting.title || '-') : '-'}`">
      <template #body-wrapper>
        <div class="minutes-form">
          <div v-if="minutesMeeting" class="minutes-meta full">
            <div class="minutes-meta__item">
              <CIcon name="cil-calendar" width="16" class="minutes-meta__ic" aria-hidden="true" />
              <span>{{ formatDate(minutesMeeting.meetingDate) }}</span>
            </div>
            <div class="minutes-meta__divider" aria-hidden="true"></div>
            <div class="minutes-meta__item">
              <CIcon name="cil-location-pin" width="16" class="minutes-meta__ic" aria-hidden="true" />
              <span>{{ getMinutesLocationLabel(minutesMeeting) }}</span>
            </div>
          </div>

          <div class="minutes-panel">
            <div class="minutes-panel__title">บันทึกการประชุม</div>
            <CTextarea rows="6" placeholder="บันทึกสิ่งที่เกิดขึ้นในการประชุม..." v-model="minutesForm.minutes"
              :disabled="isReadOnly(minutesMeeting)" />
          </div>

          <div class="minutes-panel">
            <div class="minutes-panel__title">มติที่ประชุม</div>
            <CTextarea rows="6" placeholder="มติหรือข้อสรุปสำคัญจากที่ประชุม..." v-model="minutesForm.decisions"
              :disabled="isReadOnly(minutesMeeting)" />
          </div>

          <div class="minutes-action full">
            <div class="minutes-action__header">
              <div class="minutes-action__title">Action Items</div>
            </div>

            <div class="table-responsive minutes-action__table">
              <table class="table table-bordered table-sm mb-0">
              <thead>
                <tr>
                  <th>งานที่ต้องทำ</th>
                  <th>ผู้รับผิดชอบ</th>
                  <th>กำหนดเสร็จ</th>
                  <th style="width: 60px;">#</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in minutesForm.actionItems" :key="index">
                  <td>
                    <CInput v-model="item.task" :disabled="isReadOnly(minutesMeeting)" />
                  </td>
                  <td>
                    <CInput v-model="item.assignee" :disabled="isReadOnly(minutesMeeting)" />
                  </td>
                  <td>
                    <CInput type="date" v-model="item.deadline" :disabled="isReadOnly(minutesMeeting)" />
                  </td>
                  <td>
                    <CButton size="sm" color="danger" :disabled="isReadOnly(minutesMeeting)" class="minutes-action__remove"
                      @click="removeActionItem(index)" aria-label="ลบ Action Item">
                      <CIcon name="cil-trash" width="14" aria-hidden="true" />
                    </CButton>
                  </td>
                </tr>
                <tr v-if="minutesForm.actionItems.length === 0">
                  <td colspan="4" class="text-center text-muted">ยังไม่มี Action Items</td>
                </tr>
                <tr v-if="!isReadOnly(minutesMeeting)" class="minutes-action__add-row">
                  <td colspan="4">
                    <button type="button" class="minutes-action__add-btn" @click="addActionItem">
                      <CIcon name="cil-plus" width="16" class="minutes-action__add-ic" aria-hidden="true" />
                      เพิ่ม Action Item
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </div>
        </div>
      </template>

      <template #footer-wrapper>
        <div class="d-flex justify-content-end w-100 modal-actions-wrapper">
          <CButton color="secondary" class="mr-2 floating-action btn-cancel" @click="closeMinutesModal">ยกเลิก</CButton>
          <CButton v-if="!isReadOnly(minutesMeeting)" color="primary" class="floating-action btn-save"
            :disabled="savingMinutes" @click="saveMinutes">
            {{ savingMinutes ? 'กำลังบันทึก...' : 'บันทึกผลประชุม' }}
          </CButton>
        </div>
      </template>
    </CModal>
  </div>
</template>

<script>
import { instance as axios } from '@/service/api'
import Swal from 'sweetalert2'
import Multiselect from 'vue-multiselect'
import { DatePicker } from 'v-calendar'
import 'vue-multiselect/dist/vue-multiselect.min.css'

const MEETING_STATUS = {
  scheduled: { label: 'กำหนดการแล้ว', color: 'info' },
  completed: { label: 'เสร็จสิ้น', color: 'success' },
  cancelled: { label: 'ยกเลิก', color: 'danger' }
}

const BASE_MEETING_START_TIME = '06:00'

export default {
  name: 'AdminMeetings',
  props: {
    readOnly: {
      type: Boolean,
      default: false
    },
    readOnlyCtaTone: {
      type: String,
      default: 'dark',
      validator: (value) => ['soft', 'dark'].includes(value)
    },
    myOnly: {
      type: Boolean,
      default: false
    },
    heroEyebrow: {
      type: String,
      default: 'Meeting Management'
    },
    heroTitle: {
      type: String,
      default: 'จัดการการประชุม พร้อมติดตามผลได้ทันที'
    },
    heroSubtitle: {
      type: String,
      default: 'รวมกำหนดการ ผู้เข้าร่วม สถานะ และบันทึกผลไว้ในหน้าเดียว'
    }
  },
  components: { Multiselect, 'v-date-picker': DatePicker },
  data() {
    return {
      meetings: [],
      total: 0,
      page: 1,
      totalPages: 1,
      limit: 9,
      loading: false,
      filterStatus: '',
      searchKeyword: '',
      searchDebounceTimer: null,
      summaryCounts: {
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        total: 0
      },
      summaryCountsLoading: false,

      showMeetingModal: false,
      isEditMode: false,
      selectedMeeting: null,
      selectedMeetingForActions: null,
      selectionMode: false,
      pendingProposalIds: [],
      pendingProjectTitle: '',
      proposalOptions: [],
      proposalOptionsLoading: false,
      proposalOptionsError: null,
      selectedProposalOption: null,
      autoProjectTitle: '',
      participantOptions: [],
      participantOptionsLoading: false,
      participantOptionsError: null,
      pendingParticipantIds: [],
      selectedParticipantOptions: [],
      savingMeeting: false,
      meetingForm: {
        title: '',
        meetingDate: '',
        startTime: '',
        endTime: '',
        meetingType: 'online',
        location: '',
        videoLink: '',
        agenda: '',
        status: 'scheduled'
      },

      showMinutesModal: false,
      minutesMeeting: null,
      savingMinutes: false,
      minutesForm: {
        minutes: '',
        decisions: '',
        actionItems: []
      },

      timeDropdown: {
        openFor: null,
        top: 0,
        left: 0,
        width: 0,
        maxHeight: 320
      },

      titleTooltip: {
        openForId: null,
        closeTimer: null
      },

      metaTooltip: {
        openKey: null,
        text: '',
        closeTimer: null
      }
    }
  },
  computed: {
    currentUser() {
      try {
        const raw = localStorage.getItem('auth_user')
        return raw ? JSON.parse(raw) : null
      } catch (e) {
        return null
      }
    },
    currentUserId() {
      const user = this.currentUser
      return user && user._id ? String(user._id) : ''
    },
    currentUserName() {
      const user = this.currentUser || {}
      return String(user.fullName || user.name || user.displayName || user.username || '').trim()
    },
    currentUserEmail() {
      const user = this.currentUser || {}
      return String(user.email || '').trim()
    },
    applyMyOnlyFilter() {
      const role = this.currentUser && this.currentUser.role ? String(this.currentUser.role) : ''
      return Boolean(this.myOnly && role === 'committee' && (this.currentUserId || this.currentUserName || this.currentUserEmail))
    },
    canCreate() {
      return !this.readOnly
    },
    canEditDelete() {
      return !this.readOnly
    },
    meetingDatePickerValue: {
      get() {
        return this.parseLocalYmd(this.meetingForm && this.meetingForm.meetingDate ? this.meetingForm.meetingDate : '')
      },
      set(val) {
        this.meetingForm.meetingDate = val ? this.formatYmd(val) : ''
      }
    },
    enforceMinDateTime() {
      return this.meetingForm && this.meetingForm.status === 'scheduled'
    },
    minMeetingDateObj() {
      const now = new Date()
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    },
    minStartTime() {
      const selected = this.parseLocalYmd(this.meetingForm && this.meetingForm.meetingDate ? this.meetingForm.meetingDate : '')
      const baseMinutes = this.timeToMinutes(BASE_MEETING_START_TIME)
      if (!selected) return BASE_MEETING_START_TIME
      const today = new Date()
      const sameDay = selected.getFullYear() === today.getFullYear()
        && selected.getMonth() === today.getMonth()
        && selected.getDate() === today.getDate()
      if (!sameDay) return BASE_MEETING_START_TIME
      const minutes = (today.getHours() * 60) + today.getMinutes()
      const nowCeil = this.ceilMinutesToStep(minutes, 15)
      const minMinutes = Number.isFinite(baseMinutes) ? Math.max(baseMinutes, nowCeil) : nowCeil
      return this.minutesToTime(minMinutes)
    },
    minEndTime() {
      const start = this.meetingForm && this.meetingForm.startTime ? String(this.meetingForm.startTime) : ''
      if (start) return start
      return this.enforceMinDateTime ? this.minStartTime : BASE_MEETING_START_TIME
    },
    startTimeOptions() {
      return this.buildTimeOptions({
        min: this.enforceMinDateTime ? this.minStartTime : BASE_MEETING_START_TIME,
        step: 15,
        includeEmpty: false,
        formatLabel: (value) => this.formatTime12h(value)
      })
    },
    endTimeOptions() {
      const start = this.meetingForm && this.meetingForm.startTime ? String(this.meetingForm.startTime) : ''
      return this.buildTimeOptions({
        min: this.minEndTime,
        step: 15,
        includeEmpty: true,
        formatLabel: (value) => {
          if (!value) return '-'
          const label = this.formatTime12h(value)
          if (!start) return label
          const duration = this.timeToMinutes(value) - this.timeToMinutes(start)
          if (!Number.isFinite(duration) || duration <= 0) return label
          return `${label} (${this.formatDuration(duration)})`
        }
      })
    },
    statusFilterOptions() {
      return [
        { value: '', label: 'ทั้งหมด' },
        { value: 'scheduled', label: MEETING_STATUS.scheduled.label },
        { value: 'completed', label: MEETING_STATUS.completed.label },
        { value: 'cancelled', label: MEETING_STATUS.cancelled.label }
      ]
    },
    statusSelectOptions() {
      return [
        { value: 'scheduled', label: MEETING_STATUS.scheduled.label },
        { value: 'completed', label: MEETING_STATUS.completed.label },
        { value: 'cancelled', label: MEETING_STATUS.cancelled.label }
      ]
    }
  },
  mounted() {
    this.fetchMeetings()
    this.fetchMeetingSummary()
    if (!this.readOnly) {
      this.fetchProposalOptions()
      this.fetchParticipantOptions()
      this.consumeProposalContext()
    }
  },
  watch: {
    '$route.query'() {
      if (!this.readOnly) this.consumeProposalContext()
    },
    'meetingForm.meetingType'(next) {
      if (next === 'online') {
        this.meetingForm.location = ''
      }
    },
    'meetingForm.meetingDate'() {
      if (!this.enforceMinDateTime) return
      if (this.meetingForm && this.meetingForm.startTime && this.meetingForm.startTime < this.minStartTime) {
        this.meetingForm.startTime = ''
      }
      if (this.meetingForm && this.meetingForm.endTime && this.meetingForm.endTime < this.minEndTime) {
        this.meetingForm.endTime = ''
      }
    },
    'meetingForm.startTime'(next) {
      if (!next) return
      if (this.enforceMinDateTime && next < this.minStartTime) {
        this.meetingForm.startTime = ''
        return
      }
      if (this.meetingForm && this.meetingForm.endTime && this.meetingForm.endTime < next) {
        this.meetingForm.endTime = ''
      }
    }
  },
  methods: {
    normalizeText(value) {
      return String(value || '').trim().toLowerCase()
    },
    meetingHasCurrentUser(meeting) {
      if (!meeting) return false

      const userId = this.currentUserId
      const userName = this.normalizeText(this.currentUserName)
      const userEmail = this.normalizeText(this.currentUserEmail)

      const ids = Array.isArray(meeting.participantIds) ? meeting.participantIds.map(x => String(x)) : []
      if (userId && ids.includes(userId)) return true
      if ((userName || userEmail) && ids.length) {
        const joinedIds = this.normalizeText(ids.join(' '))
        if (userEmail && joinedIds.includes(userEmail)) return true
        if (userName && joinedIds.includes(userName)) return true
      }

      const maybeParticipants =
        meeting.participants ||
        meeting.participantUsers ||
        meeting.participantDetails ||
        meeting.participantList ||
        meeting.participantNames ||
        []

      const hay = []

      if (Array.isArray(maybeParticipants)) {
        maybeParticipants.forEach(p => {
          if (!p) return
          if (typeof p === 'string') {
            hay.push(p)
            return
          }
          if (typeof p === 'object') {
            hay.push(
              p.fullName,
              p.name,
              p.displayName,
              p.username,
              p.email
            )
          }
        })
      } else if (typeof maybeParticipants === 'string') {
        hay.push(maybeParticipants)
      }

      const joined = this.normalizeText(hay.filter(Boolean).join(' '))
      if (!joined) return false

      if (userEmail && joined.includes(userEmail)) return true
      if (userName && joined.includes(userName)) return true

      return false
    },
    formatThaiDateBelow(date) {
      const d = date instanceof Date ? date : new Date(date)
      if (Number.isNaN(d.getTime())) return ''
      try {
        return d.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      } catch (err) {
        return this.formatThaiDateExampleShort(d)
      }
    },
    formatThaiDateExampleShort(date) {
      const d = date instanceof Date ? date : new Date(date)
      if (Number.isNaN(d.getTime())) return ''
      try {
        const parts = new Intl.DateTimeFormat('th-TH', { weekday: 'short', month: 'short', day: 'numeric' }).formatToParts(d)
        const weekday = (parts.find(p => p.type === 'weekday') || {}).value || ''
        const day = (parts.find(p => p.type === 'day') || {}).value || ''
        const month = (parts.find(p => p.type === 'month') || {}).value || ''
        const w = weekday ? `${weekday.replace(/\s+/g, '')},` : ''
        return `${w} ${day} ${month}`.trim()
      } catch (err) {
        const thaiWeekdays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']
        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
        const weekday = thaiWeekdays[d.getDay()] || ''
        const day = String(d.getDate())
        const month = thaiMonths[d.getMonth()] || ''
        return `${weekday}, ${day} ${month}`.trim()
      }
    },
    focusPicker(refName) {
      this.$nextTick(() => {
        const el = this.$refs && this.$refs[refName] ? this.$refs[refName] : null
        if (!el) return
        try {
          el.focus && el.focus()
          el.click && el.click()
        } catch (err) {
          // ignore
        }
      })
    },
    isTimeSelected(kind, value) {
      if (!kind) return false
      const v = String(value || '')
      if (kind === 'start') return String(this.meetingForm.startTime || '') === v
      if (kind === 'end') return String(this.meetingForm.endTime || '') === v
      return false
    },
    selectTimeOption(kind, value) {
      if (kind === 'start') {
        this.meetingForm.startTime = String(value || '')
      } else if (kind === 'end') {
        const nextValue = String(value || '')
        const start = this.meetingForm && this.meetingForm.startTime ? String(this.meetingForm.startTime) : ''
        if (nextValue && start && this.timeToMinutes(nextValue) < this.timeToMinutes(start)) return
        this.meetingForm.endTime = nextValue
      }
      this.closeTimeDropdown()
    },
    toggleTimeDropdown(kind) {
      if (kind === 'end' && !(this.meetingForm && this.meetingForm.startTime)) return
      if (this.timeDropdown.openFor === kind) {
        this.closeTimeDropdown()
        return
      }
      this.openTimeDropdown(kind)
    },
    openTimeDropdown(kind) {
      const refName = kind === 'start' ? 'startTimeTrigger' : 'endTimeTrigger'
      this.$nextTick(() => {
        const el = this.$refs && this.$refs[refName] ? this.$refs[refName] : null
        if (!el || !el.getBoundingClientRect) return
        const rect = el.getBoundingClientRect()
        const desiredLeft = rect.left
        const desiredTop = rect.bottom + 6
        const width = rect.width
        const padding = 12
        const left = Math.max(padding, Math.min(desiredLeft, window.innerWidth - width - padding))
        const maxHeight = Math.max(160, Math.min(320, window.innerHeight - desiredTop - padding))

        this.timeDropdown = {
          openFor: kind,
          top: desiredTop,
          left,
          width,
          maxHeight
        }

        window.addEventListener('resize', this.closeTimeDropdown, { once: true })
        document.addEventListener('keydown', this.onTimeDropdownKeydown)
        document.addEventListener('scroll', this.onTimeDropdownScroll, true)
      })
    },
    onTimeDropdownKeydown(e) {
      if (e && e.key === 'Escape') this.closeTimeDropdown()
    },
    onTimeDropdownScroll(e) {
      const panel = this.$refs && this.$refs.timeDropdownPanel ? this.$refs.timeDropdownPanel : null
      const target = e && e.target ? e.target : null
      if (panel && target && (target === panel || panel.contains(target))) return
      this.closeTimeDropdown()
    },
    closeTimeDropdown() {
      if (!this.timeDropdown.openFor) return
      this.timeDropdown.openFor = null
      document.removeEventListener('keydown', this.onTimeDropdownKeydown)
      document.removeEventListener('scroll', this.onTimeDropdownScroll, true)
    },
    isTitleTooltipOpen(meeting) {
      const id = meeting && meeting._id ? String(meeting._id) : ''
      return !!id && this.titleTooltip && String(this.titleTooltip.openForId || '') === id
    },
    isTitleTruncated(el) {
      if (!el) return false
      try {
        return (el.scrollWidth || 0) > ((el.clientWidth || 0) + 1)
      } catch (e) {
        return false
      }
    },
    maybeOpenTitleTooltip(event, meeting) {
      const el = event && event.currentTarget ? event.currentTarget : null
      if (!this.isTitleTruncated(el)) {
        this.closeTitleTooltip()
        return
      }
      this.openTitleTooltip(meeting)
    },
    openTitleTooltip(meeting, { autoCloseMs = 0, attachOutsideClick = false } = {}) {
      const id = meeting && meeting._id ? String(meeting._id) : ''
      if (!id || !this.titleTooltip) return

      if (this.titleTooltip.closeTimer) {
        clearTimeout(this.titleTooltip.closeTimer)
      }

      this.titleTooltip.openForId = id
      this.titleTooltip.closeTimer = null

      if (attachOutsideClick) {
        this.$nextTick(() => {
          setTimeout(() => {
            document.addEventListener('click', this.closeTitleTooltip, { once: true })
          }, 0)
        })
      }

      const ms = parseInt(autoCloseMs, 10)
      if (Number.isFinite(ms) && ms > 0) {
        this.titleTooltip.closeTimer = setTimeout(() => {
          this.closeTitleTooltip()
        }, ms)
      }
    },
    closeTitleTooltip() {
      if (!this.titleTooltip) return
      if (this.titleTooltip.closeTimer) {
        clearTimeout(this.titleTooltip.closeTimer)
      }
      this.titleTooltip.openForId = null
      this.titleTooltip.closeTimer = null
    },
    toggleTitleTooltip(event, meeting) {
      const el = event && event.currentTarget ? event.currentTarget : null
      if (!this.isTitleTruncated(el)) return

      const id = meeting && meeting._id ? String(meeting._id) : ''
      if (!id) return

      if (this.titleTooltip && String(this.titleTooltip.openForId || '') === id) {
        this.closeTitleTooltip()
        return
      }

      this.closeTitleTooltip()
      this.openTitleTooltip(meeting, { autoCloseMs: 2600, attachOutsideClick: true })
    },
    isMetaTruncated(rootEl) {
      if (!rootEl || !rootEl.querySelectorAll) return false
      const nodes = rootEl.querySelectorAll('.text-value, .small')
      if (!nodes || !nodes.length) return false
      try {
        return Array.from(nodes).some(el => (el.scrollWidth || 0) > ((el.clientWidth || 0) + 1))
      } catch (e) {
        return false
      }
    },
    isMetaTooltipOpen(key) {
      const k = String(key || '')
      return !!k && this.metaTooltip && String(this.metaTooltip.openKey || '') === k
    },
    closeMetaTooltip() {
      if (!this.metaTooltip) return
      if (this.metaTooltip.closeTimer) {
        clearTimeout(this.metaTooltip.closeTimer)
      }
      this.metaTooltip.openKey = null
      this.metaTooltip.text = ''
      this.metaTooltip.closeTimer = null
    },
    openMetaTooltip(key, text, { autoCloseMs = 0, attachOutsideClick = false } = {}) {
      const k = String(key || '')
      if (!k || !this.metaTooltip) return

      if (this.metaTooltip.closeTimer) {
        clearTimeout(this.metaTooltip.closeTimer)
      }

      this.metaTooltip.openKey = k
      this.metaTooltip.text = String(text || '')
      this.metaTooltip.closeTimer = null

      window.addEventListener('resize', this.closeMetaTooltip, { once: true })

      if (attachOutsideClick) {
        this.$nextTick(() => {
          setTimeout(() => {
            document.addEventListener('click', this.closeMetaTooltip, { once: true })
          }, 0)
        })
      }

      const ms = parseInt(autoCloseMs, 10)
      if (Number.isFinite(ms) && ms > 0) {
        this.metaTooltip.closeTimer = setTimeout(() => {
          this.closeMetaTooltip()
        }, ms)
      }
    },
    maybeOpenMetaTooltip(event, key, text) {
      const rootEl = event && event.currentTarget ? event.currentTarget : null
      if (!this.isMetaTruncated(rootEl)) {
        this.closeMetaTooltip()
        return
      }
      this.openMetaTooltip(key, text)
    },
    toggleMetaTooltip(event, key, text) {
      const rootEl = event && event.currentTarget ? event.currentTarget : null
      if (!this.isMetaTruncated(rootEl)) return

      if (this.isMetaTooltipOpen(key)) {
        this.closeMetaTooltip()
        return
      }
      this.closeMetaTooltip()
      this.openMetaTooltip(key, text, { autoCloseMs: 2600, attachOutsideClick: true })
    },
    openNativePicker(event) {
      const el = event && event.target ? event.target : null
      if (el && typeof el.showPicker === 'function') {
        try {
          el.showPicker()
        } catch (err) {
          // ignore; focus will still open pickers on most browsers
        }
      }
    },
    formatYmd(d) {
      const date = d instanceof Date ? d : new Date(d)
      if (Number.isNaN(date.getTime())) return ''
      const y = String(date.getFullYear()).padStart(4, '0')
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    },
    formatHm(d) {
      const date = d instanceof Date ? d : new Date(d)
      if (Number.isNaN(date.getTime())) return '00:00'
      const hh = String(date.getHours()).padStart(2, '0')
      const mm = String(date.getMinutes()).padStart(2, '0')
      return `${hh}:${mm}`
    },
    timeToMinutes(hhmm) {
      const str = String(hhmm || '').trim()
      const [hhRaw, mmRaw] = str.split(':')
      const hh = parseInt(hhRaw, 10)
      const mm = parseInt(mmRaw, 10)
      if (Number.isNaN(hh) || Number.isNaN(mm)) return NaN
      return (hh * 60) + mm
    },
    minutesToTime(minutes) {
      const mins = Math.max(0, Math.min(23 * 60 + 59, parseInt(minutes, 10) || 0))
      const hh = String(Math.floor(mins / 60)).padStart(2, '0')
      const mm = String(mins % 60).padStart(2, '0')
      return `${hh}:${mm}`
    },
    ceilMinutesToStep(minutes, step) {
      const m = parseInt(minutes, 10)
      const s = Math.max(parseInt(step, 10) || 1, 1)
      if (Number.isNaN(m)) return 0
      return Math.min(23 * 60 + 59, Math.ceil(m / s) * s)
    },
    buildTimeOptions({ min = '00:00', step = 5, includeEmpty = false, formatLabel = null } = {}) {
      const minMinutes = this.timeToMinutes(min)
      const start = Number.isFinite(minMinutes) ? this.ceilMinutesToStep(minMinutes, step) : 0
      const options = []
      if (includeEmpty) options.push({ value: '', label: '-' })
      for (let m = start; m <= (23 * 60 + 59); m += step) {
        const value = this.minutesToTime(m)
        const label = typeof formatLabel === 'function' ? formatLabel(value) : value
        options.push({ value, label })
      }
      return options
    },
    formatTime12h(hhmm) {
      const minutes = this.timeToMinutes(hhmm)
      if (!Number.isFinite(minutes)) return String(hhmm || '')
      const hours = String(Math.floor(minutes / 60)).padStart(2, '0')
      const mins = String(minutes % 60).padStart(2, '0')
      return `${hours}:${mins}น.`
    },
    formatDuration(minutes) {
      const mins = parseInt(minutes, 10)
      if (!Number.isFinite(mins) || mins <= 0) return ''
      if (mins < 60) return `${mins} นาที`
      const hrs = Math.floor(mins / 60)
      const rem = mins % 60
      if (rem === 0) return `${hrs} ชม.`
      return `${hrs} ชม. ${rem} นาที`
    },
    parseLocalYmd(ymd) {
      if (!ymd) return null
      const parts = String(ymd).split('-').map(v => parseInt(v, 10))
      if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) return null
      const [year, month, day] = parts
      return new Date(year, month - 1, day)
    },
    getMeetingStartTimestamp(meeting) {
      const base = this.parseLocalYmd(meeting && meeting.meetingDate ? meeting.meetingDate : '')
      if (!base) return NaN
      const timeStr = meeting && meeting.startTime ? String(meeting.startTime) : ''
      const [hhRaw, mmRaw] = timeStr.split(':')
      const hours = parseInt(hhRaw, 10)
      const minutes = parseInt(mmRaw, 10)
      base.setHours(Number.isNaN(hours) ? 0 : hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0)
      return base.getTime()
    },
    sortMeetingsForDisplay(meetings) {
      const list = Array.isArray(meetings) ? meetings.slice() : []
      const statusRank = (status) => {
        if (status === 'scheduled') return 0
        if (status === 'completed') return 1
        if (status === 'cancelled') return 2
        return 3
      }
      const nowTs = Date.now()

      return list.sort((a, b) => {
        const rankDiff = statusRank(a && a.status) - statusRank(b && b.status)
        if (rankDiff !== 0) return rankDiff

        const aRank = statusRank(a && a.status)
        const aTime = this.getMeetingStartTimestamp(a)
        const bTime = this.getMeetingStartTimestamp(b)

        if (aRank === 0) {
          const ta = Number.isFinite(aTime) ? aTime : Number.POSITIVE_INFINITY
          const tb = Number.isFinite(bTime) ? bTime : Number.POSITIVE_INFINITY
          const aFuture = ta >= nowTs
          const bFuture = tb >= nowTs
          if (aFuture !== bFuture) return aFuture ? -1 : 1
          if (ta !== tb) return aFuture ? (ta - tb) : (tb - ta)
        } else {
          const ta = Number.isFinite(aTime) ? aTime : Number.NEGATIVE_INFINITY
          const tb = Number.isFinite(bTime) ? bTime : Number.NEGATIVE_INFINITY
          if (ta !== tb) return tb - ta
        }

        const aId = a && a._id ? String(a._id) : ''
        const bId = b && b._id ? String(b._id) : ''
        return aId.localeCompare(bId)
      })
    },
    formatProposalTitle(p) {
      if (!p) return '-'
      const title = p.projectTitleTh || p.projectTitleEn || p.projectTitle || '-'
      const leaderName = this.getProposalLeaderName(p)
      return leaderName ? `${title} (หัวหน้า: ${leaderName})` : title
    },
    getProposalLeaderName(p) {
      if (!p) return ''
      const direct = (p.projectLeaderName || (p.projectLeader && (p.projectLeader.fullName || p.projectLeader.name)) || p.leaderName || '').toString().trim()
      if (direct) return direct

      const snapshot = (p.formSnapshotJson || p.formSnapshot || {})
      const team = snapshot && snapshot.researchTeam ? snapshot.researchTeam : {}
      const leader = team && team.projectLeader ? team.projectLeader : {}
      const nested = ((leader && (leader.name || leader.fullName)) || '').toString().trim()
      return nested
    },
    formatParticipantLabel(u) {
      if (!u) return '-'
      return u.fullName || u.email || '-'
    },
    async fetchProposalOptions() {
      this.proposalOptionsLoading = true
      this.proposalOptionsError = null
      try {
        const response = await axios.get('/api/v1/proposals', { params: { page: 1, limit: 300 } })
        const payload = (response && response.data && response.data.data) || {}
        const list = Array.isArray(payload.proposals)
          ? payload.proposals
          : (Array.isArray(payload.data) ? payload.data : [])
        this.proposalOptions = list.map(p => {
          const th = (p && p.projectTitleTh) ? String(p.projectTitleTh) : ''
          const en = (p && p.projectTitleEn) ? String(p.projectTitleEn) : ''
          const code = (p && p.proposalCode) ? String(p.proposalCode) : ''
          const leaderName = this.getProposalLeaderName(p)
          const searchText = [th, en, code, leaderName].filter(Boolean).join(' ')
          return { ...p, searchText, leaderName }
        })
        this.resolveSelectedProposalOption()
      } catch (err) {
        console.error('[AdminMeetings] Error fetching proposals for select:', err)
        this.proposalOptions = []
        this.proposalOptionsError = (err && err.message) || 'โหลดข้อมูลไม่สำเร็จ'
      } finally {
        this.proposalOptionsLoading = false
      }
    },
    async fetchParticipantOptions() {
      this.participantOptionsLoading = true
      this.participantOptionsError = null
      try {
        const response = await axios.get('/api/v1/users', { params: { page: 1, limit: 200 } })
        const payload = (response && response.data && response.data.data) || {}
        const list = Array.isArray(payload.users) ? payload.users : []
        this.participantOptions = list.map(u => {
          const name = (u && u.fullName) ? String(u.fullName) : ''
          const email = (u && u.email) ? String(u.email) : ''
          return {
            ...u,
            searchText: `${name} ${email}`.trim()
          }
        })
        this.resolveSelectedParticipantOptions()
      } catch (err) {
        console.error('[AdminMeetings] Error fetching users for participant select:', err)
        this.participantOptions = []
        this.participantOptionsError = (err && err.message) || 'โหลดข้อมูลไม่สำเร็จ'
      } finally {
        this.participantOptionsLoading = false
      }
    },
    resolveSelectedParticipantOptions() {
      const ids = (Array.isArray(this.pendingParticipantIds) && this.pendingParticipantIds.length)
        ? this.pendingParticipantIds
        : (this.isEditMode && this.selectedMeeting && Array.isArray(this.selectedMeeting.participantIds) ? this.selectedMeeting.participantIds.map(String) : [])
      if (!ids.length || !Array.isArray(this.participantOptions) || !this.participantOptions.length) return
      this.selectedParticipantOptions = this.participantOptions.filter(u => ids.includes(String(u && u._id)))
    },
    resolveSelectedProposalOption() {
      const id = (this.pendingProposalIds && this.pendingProposalIds[0])
        || (this.selectedMeeting && Array.isArray(this.selectedMeeting.proposalIds) && this.selectedMeeting.proposalIds[0])
        || ''
      if (!id || !Array.isArray(this.proposalOptions) || !this.proposalOptions.length) return
      const match = this.proposalOptions.find(p => String(p && p._id) === String(id))
      if (match) {
        this.selectedProposalOption = match
        const title = match.projectTitleTh || match.projectTitleEn || match.projectTitle || ''
        if (title) this.applyProjectToForm(title)
      }
    },
    applyProjectToForm(projectTitle) {
      const title = String(projectTitle || '').trim()
      if (!title) return

      const nextAutoTitle = `ประชุมพิจารณาโครงการ: ${title}`

      if (!this.meetingForm.title || (this.autoProjectTitle && this.meetingForm.title === `ประชุมพิจารณาโครงการ: ${this.autoProjectTitle}`)) {
        this.meetingForm.title = nextAutoTitle
      }

      this.autoProjectTitle = title
    },
    onProposalSelected(opt) {
      if (!opt) {
        this.selectedProposalOption = null
        this.pendingProposalIds = []
        this.pendingProjectTitle = ''
        this.autoProjectTitle = ''
        return
      }
      this.selectedProposalOption = opt
      this.pendingProposalIds = [String(opt._id)]
      const title = opt.projectTitleTh || opt.projectTitleEn || opt.projectTitle || ''
      this.pendingProjectTitle = title
      if (title) this.applyProjectToForm(title)
    },
    consumeProposalContext() {
      const q = (this.$route && this.$route.query) ? this.$route.query : {}
      const proposalId = q.fromProposalId || q.proposalId || ''
      const projectTitle = q.fromProjectTitle || q.projectTitle || ''

      if (!proposalId && !projectTitle) return

      this.openCreateModal()

      this.pendingProposalIds = proposalId ? [String(proposalId)] : []
      this.pendingProjectTitle = projectTitle ? String(projectTitle) : ''
      this.selectedProposalOption = null
      this.autoProjectTitle = ''

      if (this.pendingProjectTitle) {
        this.applyProjectToForm(this.pendingProjectTitle)
      }

      if (!this.proposalOptionsLoading && (!this.proposalOptions || !this.proposalOptions.length)) {
        this.fetchProposalOptions()
      } else {
        this.resolveSelectedProposalOption()
      }

      const nextQuery = { ...q }
      delete nextQuery.fromProposalId
      delete nextQuery.proposalId
      delete nextQuery.fromProjectTitle
      delete nextQuery.projectTitle
      this.$router.replace({ path: this.$route.path, query: nextQuery })
    },
    getSelectValue(val) {
      return val && val.target ? val.target.value : val
    },
    getStatusMeta(status) {
      return MEETING_STATUS[status] || { label: status || '-', color: 'secondary' }
    },
    getMeetingCardClass(meeting) {
      return {
        scheduled: meeting.status === 'scheduled',
        completed: meeting.status === 'completed',
        cancelled: meeting.status === 'cancelled'
      }
    },
    isMeetingActionable(meeting) {
      return !!(meeting && meeting.status === 'scheduled')
    },
    toggleSelectionMode() {
      if (!this.canEditDelete) return
      this.selectionMode = !this.selectionMode
      this.selectedMeetingForActions = null
    },
    clearSelectedMeeting() {
      this.selectedMeetingForActions = null
    },
    selectMeetingForActions(meeting) {
      if (!this.isMeetingActionable(meeting)) return
      this.selectedMeetingForActions = meeting || null
    },
    isSelectedMeeting(meeting) {
      if (!this.selectionMode || !meeting || !this.selectedMeetingForActions) return false
      return String(meeting._id) === String(this.selectedMeetingForActions._id)
    },
    getMeetingModeLabel(meeting) {
      if (!meeting) return '-'
      const type = meeting.meetingType ? String(meeting.meetingType).trim().toLowerCase() : ''
      if (type === 'online') return 'ออนไลน์'
      if (type === 'onsite') return 'ออนไซต์'
      const videoLink = meeting.videoLink ? String(meeting.videoLink).trim() : ''
      const location = meeting.location ? String(meeting.location).trim() : ''
      const locationLooksOnline = /online|zoom|teams|meet|webex/i.test(location) || /^https?:\/\//i.test(location)
      return (videoLink || locationLooksOnline) ? 'ออนไลน์' : 'ออนไซต์'
    },
    getMinutesLocationLabel(meeting) {
      if (!meeting) return '-'
      const mode = this.getMeetingModeLabel(meeting)
      if (mode === 'ออนไลน์') return 'ออนไลน์'
      return meeting.location || '-'
    },
    async fetchMeetings() {
      this.loading = true
      try {
        const params = this.applyMyOnlyFilter
          ? { page: 1, limit: 500 }
          : { page: this.page, limit: this.limit }
        if (this.filterStatus) params.status = this.filterStatus
        if (this.searchKeyword && String(this.searchKeyword).trim()) params.keyword = String(this.searchKeyword).trim()

        const response = await axios.get('/api/v1/meetings', { params })
        const payload = (response && response.data && response.data.data) || {}
        const list = Array.isArray(payload.meetings)
          ? payload.meetings
          : (Array.isArray(payload.data) ? payload.data : [])

        const sorted = this.sortMeetingsForDisplay(list)

        if (this.applyMyOnlyFilter) {
          const mine = sorted.filter(m => this.meetingHasCurrentUser(m))
          this.total = mine.length
          this.totalPages = Math.max(1, Math.ceil(this.total / Math.max(1, this.limit)))
          if (this.page > this.totalPages) this.page = 1
          const start = (Math.max(1, this.page) - 1) * this.limit
          this.meetings = mine.slice(start, start + this.limit)
        } else {
          this.meetings = sorted
          this.total = Number(payload.total) || list.length
          this.page = Number(payload.page) || this.page
          this.totalPages = Number(payload.totalPages) || Math.max(1, Math.ceil(this.total / this.limit))
        }

        if (this.selectedMeetingForActions) {
          const stillExists = this.meetings.find(m => String(m._id) === String(this.selectedMeetingForActions._id))
          this.selectedMeetingForActions = (stillExists && this.isMeetingActionable(stillExists)) ? stillExists : null
        } else {
          this.selectedMeetingForActions = null
        }

        if (!this.selectionMode) this.selectedMeetingForActions = null
      } catch (error) {
        console.error('[AdminMeetings] Error fetching meetings:', error)
        this.meetings = []
        this.total = 0
        this.totalPages = 1
        this.selectedMeetingForActions = null
      } finally {
        this.loading = false
      }
    },
    async fetchMeetingSummary() {
      this.summaryCountsLoading = true
      try {
        const response = await axios.get('/api/v1/meetings/summary')
        const payload = (response && response.data && response.data.data) || {}
        this.summaryCounts = {
          scheduled: Number(payload.scheduled) || 0,
          completed: Number(payload.completed) || 0,
          cancelled: Number(payload.cancelled) || 0,
          total: Number(payload.total) || 0
        }
      } catch (error) {
        console.error('[AdminMeetings] Error fetching meeting summary:', error)
        try {
          const [scheduledRes, completedRes, cancelledRes] = await Promise.all([
            axios.get('/api/v1/meetings', { params: { page: 1, limit: 1, status: 'scheduled' } }),
            axios.get('/api/v1/meetings', { params: { page: 1, limit: 1, status: 'completed' } }),
            axios.get('/api/v1/meetings', { params: { page: 1, limit: 1, status: 'cancelled' } })
          ])

          const scheduledPayload = (scheduledRes && scheduledRes.data && scheduledRes.data.data) || {}
          const completedPayload = (completedRes && completedRes.data && completedRes.data.data) || {}
          const cancelledPayload = (cancelledRes && cancelledRes.data && cancelledRes.data.data) || {}

          const scheduled = Number(scheduledPayload.total) || 0
          const completed = Number(completedPayload.total) || 0
          const cancelled = Number(cancelledPayload.total) || 0

          this.summaryCounts = {
            scheduled,
            completed,
            cancelled,
            total: scheduled + completed + cancelled
          }
        } catch (fallbackErr) {
          console.error('[AdminMeetings] Summary fallback failed:', fallbackErr)
          // Keep last known values instead of forcing zeros.
        }
      } finally {
        this.summaryCountsLoading = false
      }
    },
    onFilterStatusChange(val) {
      this.filterStatus = this.getSelectValue(val)
      this.page = 1
      this.fetchMeetings()
    },
    onSearchKeywordInput() {
      if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer)
      this.searchDebounceTimer = setTimeout(() => {
        this.page = 1
        this.fetchMeetings()
      }, 350)
    },
    clearSearch() {
      this.searchKeyword = ''
      this.page = 1
      this.fetchMeetings()
    },
    toggleSummaryFilter(status) {
      const next = this.filterStatus === status ? '' : status
      this.filterStatus = next
      this.page = 1
      this.fetchMeetings()
    },
    isSummaryFilterActive(status) {
      return this.filterStatus === status
    },
    onReset() {
      this.filterStatus = ''
      this.searchKeyword = ''
      this.page = 1
      this.fetchMeetings()
    },
    onPageChange(nextPage) {
      if (nextPage < 1 || nextPage > this.totalPages) return
      this.page = nextPage
      this.fetchMeetings()
    },
    openCreateModal() {
      if (!this.canCreate) return
      this.isEditMode = false
      this.selectedMeeting = null
      this.pendingProposalIds = []
      this.pendingProjectTitle = ''
      this.selectedProposalOption = null
      this.autoProjectTitle = ''
      this.pendingParticipantIds = []
      this.selectedParticipantOptions = []
      this.meetingForm = {
        title: '',
        meetingDate: '',
        startTime: '',
        endTime: '',
        meetingType: 'online',
        location: '',
        videoLink: '',
        agenda: '',
        status: 'scheduled'
      }
      this.showMeetingModal = true
      if (!this.participantOptionsLoading && (!this.participantOptions || !this.participantOptions.length)) {
        this.fetchParticipantOptions()
      }
    },
    openEditModal(meeting) {
      if (!this.canEditDelete) return
      this.isEditMode = true
      this.selectedMeeting = meeting
      this.pendingProposalIds = []
      this.pendingProjectTitle = ''
      this.selectedProposalOption = null
      this.autoProjectTitle = ''
      this.pendingParticipantIds = Array.isArray(meeting && meeting.participantIds) ? meeting.participantIds.map(String) : []
      this.selectedParticipantOptions = []
      const inferredType = meeting && meeting.meetingType
        ? String(meeting.meetingType)
        : (this.getMeetingModeLabel(meeting) === 'ออนไลน์' ? 'online' : 'onsite')
      this.meetingForm = {
        title: meeting.title || '',
        meetingDate: meeting.meetingDate || '',
        startTime: meeting.startTime || '',
        endTime: meeting.endTime || '',
        meetingType: inferredType,
        location: meeting.location || '',
        videoLink: meeting.videoLink || '',
        agenda: meeting.agenda || '',
        status: meeting.status || 'scheduled'
      }
      this.showMeetingModal = true
      this.$nextTick(() => {
        this.resolveSelectedProposalOption()
        this.resolveSelectedParticipantOptions()
      })
      if (!this.participantOptionsLoading && (!this.participantOptions || !this.participantOptions.length)) {
        this.fetchParticipantOptions()
      }
    },
    closeMeetingModal() {
      this.showMeetingModal = false
      this.savingMeeting = false
      this.closeTimeDropdown()
    },
    async cancelMeeting() {
      if (this.readOnly) return
      if (!this.selectedMeeting || !this.selectedMeeting._id) return
      if (!this.meetingForm || this.meetingForm.status !== 'scheduled') return

      const result = await Swal.fire({
        icon: 'warning',
        title: 'ยืนยันการยกเลิกการประชุม',
        text: `ยกเลิกการประชุม '${this.selectedMeeting.title || ''}'?`,
        showCancelButton: true,
        confirmButtonText: 'ยกเลิกการประชุม',
        cancelButtonText: 'กลับ',
        confirmButtonColor: '#e55353'
      })
      if (!result.isConfirmed) return

      this.savingMeeting = true
      try {
        await axios.patch(`/api/v1/meetings/${this.selectedMeeting._id}/status`, { status: 'cancelled' })
        this.closeMeetingModal()
        await this.fetchMeetings()
        await this.fetchMeetingSummary()
        await Swal.fire({ icon: 'success', title: 'ยกเลิกการประชุมสำเร็จ', timer: 1300, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminMeetings] Error cancelling meeting:', error)
        await Swal.fire({ icon: 'error', title: 'ยกเลิกไม่สำเร็จ', text: 'API การประชุมยังไม่พร้อมใช้งาน' })
      } finally {
        this.savingMeeting = false
      }
    },
    async saveMeeting() {
      if (this.readOnly) return
      if (!this.meetingForm.title || !this.meetingForm.meetingDate || !this.meetingForm.startTime) {
        await Swal.fire({ icon: 'warning', title: 'กรอกข้อมูลไม่ครบ', text: 'ชื่อการประชุม วันที่ประชุม และเวลาเริ่ม เป็นข้อมูลบังคับ' })
        return
      }

      const meetingType = this.meetingForm && this.meetingForm.meetingType ? String(this.meetingForm.meetingType) : 'online'
      const location = this.meetingForm && this.meetingForm.location ? String(this.meetingForm.location).trim() : ''
      const videoLink = this.meetingForm && this.meetingForm.videoLink ? String(this.meetingForm.videoLink).trim() : ''

      if (meetingType === 'onsite' && !location) {
        await Swal.fire({ icon: 'warning', title: 'กรอกข้อมูลไม่ครบ', text: 'การประชุมแบบออนไซต์ต้องระบุสถานที่' })
        return
      }

      if (meetingType === 'online' && !videoLink) {
        await Swal.fire({ icon: 'warning', title: 'กรอกข้อมูลไม่ครบ', text: 'การประชุมแบบออนไลน์ต้องระบุลิงก์วิดีโอประชุม' })
        return
      }

      if (this.enforceMinDateTime) {
        const startTs = this.getMeetingStartTimestamp({
          meetingDate: this.meetingForm.meetingDate,
          startTime: this.meetingForm.startTime
        })
        if (Number.isFinite(startTs) && startTs < Date.now()) {
          await Swal.fire({ icon: 'warning', title: 'วัน/เวลาไม่ถูกต้อง', text: 'ไม่สามารถเลือกวันหรือเวลาที่ต่ำกว่าปัจจุบันได้' })
          return
        }
      }

      this.savingMeeting = true
      try {
        const proposalIds = this.selectedProposalOption && this.selectedProposalOption._id
          ? [String(this.selectedProposalOption._id)]
          : ((this.isEditMode && this.selectedMeeting && this.selectedMeeting.proposalIds) ? this.selectedMeeting.proposalIds : [])

        let participantIds = Array.isArray(this.selectedParticipantOptions)
          ? this.selectedParticipantOptions.map(u => String(u && u._id)).filter(Boolean)
          : []

        // If options failed to load during edit, preserve existing participants instead of wiping.
        if (this.isEditMode && (!participantIds || participantIds.length === 0) && this.selectedMeeting && Array.isArray(this.selectedMeeting.participantIds)) {
          participantIds = this.selectedMeeting.participantIds
        }

        const body = {
          title: this.meetingForm.title,
          meetingDate: this.meetingForm.meetingDate,
          startTime: this.meetingForm.startTime,
          endTime: this.meetingForm.endTime,
          meetingType: this.meetingForm.meetingType,
          location: meetingType === 'online' ? '' : location,
          videoLink: videoLink,
          proposalIds,
          participantIds,
          agenda: this.meetingForm.agenda,
          status: this.meetingForm.status
        }

        if (this.isEditMode && this.selectedMeeting && this.selectedMeeting._id) {
          await axios.put(`/api/v1/meetings/${this.selectedMeeting._id}`, body)
        } else {
          await axios.post('/api/v1/meetings', body)
        }

        this.closeMeetingModal()
        await this.fetchMeetings()
        await this.fetchMeetingSummary()
        await Swal.fire({ icon: 'success', title: 'บันทึกข้อมูลการประชุมสำเร็จ', timer: 1400, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminMeetings] Error saving meeting:', error)
        await Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: 'API การประชุมยังไม่พร้อมใช้งาน' })
      } finally {
        this.savingMeeting = false
      }
    },
    async deleteMeeting(meeting) {
      if (this.readOnly) return
      if (!meeting || !meeting._id) return
      const result = await Swal.fire({
        icon: 'warning',
        title: 'ยืนยันการลบ',
        text: `ลบการประชุม '${meeting.title || ''}'? ไม่สามารถกู้คืนได้`,
        showCancelButton: true,
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#e55353'
      })
      if (!result.isConfirmed) return

      try {
        await axios.delete(`/api/v1/meetings/${meeting._id}`)
        await this.fetchMeetings()
        await this.fetchMeetingSummary()
        await Swal.fire({ icon: 'success', title: 'ลบการประชุมสำเร็จ', timer: 1300, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminMeetings] Error deleting meeting:', error)
        await Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ', text: 'API การประชุมยังไม่พร้อมใช้งาน' })
      }
    },
    openMinutesModal(meeting) {
      this.minutesMeeting = meeting
      this.minutesForm = {
        minutes: meeting.minutes || '',
        decisions: meeting.decisions || '',
        actionItems: Array.isArray(meeting.actionItems) ? meeting.actionItems.map(item => ({ ...item })) : []
      }
      if (!Array.isArray(this.minutesForm.actionItems)) {
        this.minutesForm.actionItems = []
      }
      this.showMinutesModal = true
    },
    closeMinutesModal() {
      this.showMinutesModal = false
      this.minutesMeeting = null
      this.savingMinutes = false
      this.minutesForm = {
        minutes: '',
        decisions: '',
        actionItems: []
      }
    },
    addActionItem() {
      this.minutesForm.actionItems.push({ task: '', assignee: '', deadline: '' })
    },
    removeActionItem(index) {
      this.minutesForm.actionItems.splice(index, 1)
    },
    async saveMinutes() {
      if (this.readOnly) return
      if (!this.minutesMeeting || !this.minutesMeeting._id) return

      this.savingMinutes = true
      try {
        await axios.put(`/api/v1/meetings/${this.minutesMeeting._id}/minutes`, {
          minutes: this.minutesForm.minutes,
          decisions: this.minutesForm.decisions,
          actionItems: this.minutesForm.actionItems
        })

        await axios.patch(`/api/v1/meetings/${this.minutesMeeting._id}/status`, {
          status: 'completed'
        })

        this.closeMinutesModal()
        await this.fetchMeetings()
        await this.fetchMeetingSummary()
        await Swal.fire({ icon: 'success', title: 'บันทึกผลการประชุมสำเร็จ', timer: 1400, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminMeetings] Error saving minutes:', error)
        await Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: 'API การประชุมยังไม่พร้อมใช้งาน' })
      } finally {
        this.savingMinutes = false
      }
    },
    getSummaryCount(status) {
      const counts = this.summaryCounts || {}
      return Number(counts[status]) || 0
    },
    formatDate(dateStr) {
      if (!dateStr) return '-'
      const d = new Date(dateStr)
      if (Number.isNaN(d.getTime())) return '-'
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const yearBE = d.getFullYear() + 543
      return `${day}/${month}/${yearBE}`
    },
    formatTime(time) {
      return time ? this.formatTime12h(time) : '-'
    },
    getMeetingProposalId(meeting) {
      const ids = meeting && Array.isArray(meeting.proposalIds) ? meeting.proposalIds : []
      const first = ids && ids.length ? String(ids[0] || '').trim() : ''
      return first
    },
    goToProposalForm(meeting) {
      const proposalId = this.getMeetingProposalId(meeting)
      if (!proposalId) return
      this.$router.push({ name: 'ResearchForm', params: { id: proposalId } })
    },
    isReadOnly(meeting) {
      return this.readOnly || (meeting && meeting.status === 'completed')
    }
  }
}
</script>

<style scoped>
.icon-bold {
  transform: scale(1.2);
  filter: contrast(1.3);
}

.admin-meetings-page {
  /* Theme tokens (match Research Form vibe, but keep readable vs sidebar) */
  --am-bg: #fffaf2;
  --am-surface: #ffffff;
  --am-border: #eadfce;
  --am-text: #1f2937;
  --am-muted: #6b7280;
  --am-accent: #8b1212;
  /* deep red */
  --am-gold: #c59b3a;
  --am-gold-rgb: 197, 155, 58;
  --am-accent-ring: rgba(139, 18, 18, 0.18);
  --am-section-gap: 24px;

  width: 100%;
  padding: 22px 22px 28px;

}

.meetings-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 28px;
  margin-bottom: var(--am-section-gap);
  border-radius: 22px;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.28), transparent 30%),
    linear-gradient(135deg, var(--am-accent) 0%, var(--am-gold) 115%);
  color: #ffffff;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.16);
}

.meetings-hero__content {
  max-width: 720px;
}

.meetings-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  margin-bottom: 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.meetings-hero__title {
  margin-bottom: 10px;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.3;
}

.meetings-hero__subtitle {
  max-width: 620px;
  color: rgba(255, 255, 255, 0.84);
  font-size: 0.98rem;
  line-height: 1.7;
}

.hero-action-btn {
  min-width: 210px;
  border-radius: 14px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.18);
  background: linear-gradient(135deg, rgba(197, 155, 58, 0.98), rgba(139, 18, 18, 0.98)) !important;
  border-color: rgba(255, 255, 255, 0.22) !important;
  color: #ffffff !important;
}

.hero-action-btn:hover {
  filter: brightness(1.03);
}

.summary-row {
  margin-bottom: 0;
  row-gap: 18px;
}

.summary-row--filters {
  margin-bottom: var(--am-section-gap);
}

.summary-row--filters .summary-card {
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  outline: none;
}

.summary-row--filters .summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.09);
}

.summary-row--filters .summary-card:focus-visible {
  box-shadow: 0 0 0 3px var(--am-accent-ring), 0 18px 48px rgba(15, 23, 42, 0.09);
}

.summary-card--active {
  border-color: rgba(139, 18, 18, 0.42) !important;
  box-shadow: 0 0 0 3px var(--am-accent-ring), 0 18px 48px rgba(15, 23, 42, 0.09) !important;
}

/* vue-multiselect: remove default green highlight/selected background */
::v-deep .multiselect__option--highlight {
  background: rgba(197, 155, 58, 0.14);
  color: var(--am-text);
}

::v-deep .multiselect__option--highlight::after {
  content: '';
  display: none;
}

::v-deep .multiselect__option--selected {
  background: rgba(139, 18, 18, 0.08);
  color: var(--am-text);
  font-weight: 600;
}

::v-deep .multiselect__option--selected::after {
  content: '';
  display: none;
}

.summary-card {
  height: 100%;
  padding: 20px;
  border: 1px solid var(--am-border);
  border-radius: 20px;
  background: var(--am-surface);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.summary-card--info {
  border-top: 4px solid var(--am-gold);
}

.summary-card--success {
  border-top: 4px solid #22c55e;
}

.summary-card--danger {
  border-top: 4px solid #ef4444;
}

.summary-label {
  color: var(--am-muted);
  font-size: 0.9rem;
  font-weight: 600;
}

.summary-number {
  margin: 10px 0 8px;
  color: var(--am-text);
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.summary-caption {
  color: var(--am-muted);
  font-size: 0.88rem;
  line-height: 1.5;
}

/* Filters card */
.filter-card {
  border-radius: 20px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
  border: 1px solid var(--am-border);
  background: var(--am-surface);
  margin-bottom: var(--am-section-gap);
}

.filter-card__title {
  font-weight: 900;
  color: var(--am-text);
  font-size: 1.05rem;
  letter-spacing: 0.2px;
}

.filter-card__subtitle {
  margin-top: 2px;
  color: var(--am-muted);
  font-size: 0.9rem;
  line-height: 1.55;
}

.filter-card__search-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 6px;
  width: 100%;
}

.filter-card__search-hint {
  line-height: 1.25;
  text-align: right;
  max-width: 340px;
  font-size: 0.82rem;
  opacity: 0.92;
}

.filter-card__select-toggle {
  border-radius: 14px !important;
  padding: 6px 14px !important;
  min-height: 34px !important;
  box-shadow: 0 12px 22px rgba(15, 23, 42, 0.12);
  font-weight: 800 !important;
}

/* Meeting type segmented control */
.meeting-type-toggle {
  position: relative;
  display: flex;
  gap: 6px;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid var(--am-border);
  background: linear-gradient(180deg, rgba(197, 155, 58, 0.10), rgba(15, 23, 42, 0.00));
  min-height: 44px;
  align-items: center;
}

.meeting-type-toggle__input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.meeting-type-toggle__label {
  flex: 1;
  margin: 0;
  padding: 8px 10px;
  border-radius: 10px;
  text-align: center;
  cursor: pointer;
  user-select: none;
  font-weight: 800;
  font-size: 0.92rem;
  color: var(--am-muted);
  transition: background 160ms ease, color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.meeting-type-toggle__input:checked+.meeting-type-toggle__label {
  color: #ffffff;
  background: linear-gradient(135deg, var(--am-accent), var(--am-gold));
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.16);
}

.meeting-type-toggle__label:active {
  transform: translateY(1px);
}

.meeting-grid {
  --meeting-grid-gap: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: var(--meeting-grid-gap);
}

.meeting-grid .meeting-card {
  flex: 1 1 calc((100% - (2 * var(--meeting-grid-gap))) / 3);
  max-width: calc((100% - (2 * var(--meeting-grid-gap))) / 3);
}

@media (max-width: 1199px) {
  .meeting-grid {
    --meeting-grid-gap: 16px;
  }

  .meeting-grid .meeting-card {
    flex-basis: calc((100% - var(--meeting-grid-gap)) / 2);
    max-width: calc((100% - var(--meeting-grid-gap)) / 2);
  }
}

@media (max-width: 767px) {
  .meeting-grid .meeting-card {
    flex-basis: 100%;
    max-width: 100%;
  }
}

.meeting-card {
  --status-rgb: 59, 130, 246;
  --accent-offset: 8px;
  --accent-width: 30px;
  --meeting-card-accent-height: 37%;
  position: relative;
  isolation: isolate;
  display: block;
  height: 540px;
  border: 0;
  border-radius: 22px;
  padding: 0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: visible;
  outline: none;
}

.meeting-card__left-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(var(--accent-offset) * -1);
  width: calc(var(--accent-width) + var(--accent-offset));
  background: transparent;
  border-radius: inherit;
  z-index: 0;
  pointer-events: none;
}

.meeting-card__surface {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: inherit;
  background: linear-gradient(
    180deg,
    #ffffff 0%,
    #ffffff var(--meeting-card-accent-height),
    #ffffff var(--meeting-card-accent-height),
    #f3e9e9 100%
  );
  overflow: hidden;
  border: 1px solid rgba(var(--am-gold-rgb), 0.55);
  border-top-color: rgba(var(--status-rgb), 0.22);
  box-shadow:
    inset 0 0 0 1px rgba(var(--am-gold-rgb), 0.18),
    0 14px 30px rgba(15, 23, 42, 0.08);
}

.meeting-card__surface::before {
  content: '';
  position: absolute;
  inset: 0;
  height: var(--meeting-card-accent-height);
  background:
    radial-gradient(circle at 16% 22%, rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0) 48%),
    radial-gradient(circle at 86% 0%, rgba(var(--status-rgb), 0.26), rgba(var(--status-rgb), 0) 55%),
    linear-gradient(135deg, rgba(var(--status-rgb), 0.42) 0%, rgba(var(--status-rgb), 0.22) 58%, rgba(255, 255, 255, 0) 100%);
  border-bottom: 1px solid rgba(var(--status-rgb), 0.20);
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
  z-index: 0;
  pointer-events: none;
}

.meeting-card__surface::after {
  content: '';
  position: absolute;
  inset: 0;
  height: var(--meeting-card-accent-height);
  background:
    repeating-linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.12) 0px,
      rgba(255, 255, 255, 0.12) 9px,
      rgba(255, 255, 255, 0) 9px,
      rgba(255, 255, 255, 0) 22px
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0));
  opacity: 0.36;
  z-index: 0;
  pointer-events: none;
}

.meeting-card--selected {
  box-shadow: none;
}

.meeting-card--selected .meeting-card__surface {
  box-shadow: 0 0 0 3px var(--am-accent-ring), 0 14px 30px rgba(15, 23, 42, 0.08);
}

.meeting-card--locked {
  cursor: not-allowed;
}

.meeting-card--locked .meeting-card__surface {
  opacity: 0.86;
  filter: grayscale(0.12);
}

.meeting-card--locked .meeting-card__left-bar {
  opacity: 0.55;
}

.meeting-card:focus,
.meeting-card:focus-visible {
  box-shadow: none;
}

.meeting-card:focus .meeting-card__surface,
.meeting-card:focus-visible .meeting-card__surface {
  box-shadow: 0 0 0 3px var(--am-accent-ring), 0 14px 30px rgba(15, 23, 42, 0.08);
}

.meeting-card:hover {
  transform: translateY(-3px);
}

.meeting-card:hover .meeting-card__surface {
  box-shadow: 0 20px 42px rgba(15, 23, 42, 0.1);
}

.meeting-card__top {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  gap: 12px;
  min-height: 42px;
  padding: 14px 18px 8px;
  background: transparent;
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
}

.meeting-card__top::before {
  content: none;
}

.meeting-card__top::after {
  content: none;
}

.meeting-card__top>* {
  position: relative;
  z-index: 2;
}

.meeting-card__content {
  flex: 1;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  background: transparent;
  border-radius: 0;
  margin-top: 0;
  padding: 18px;
  box-shadow: 0 -1px 0 rgba(255, 255, 255, 0.35);
}

.meeting-card__actions {
  display: flex;
  align-items: center;
}

.meeting-card__badge {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(var(--status-rgb), 0.12) !important;
  border: 1px solid rgba(var(--status-rgb), 0.24) !important;
  color: rgb(var(--status-rgb)) !important;
  font-weight: 800;
  min-width: 0;
  max-width: 44%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meeting-card__top-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.meeting-card__participant-pill {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(var(--status-rgb), 0.22);
  color: #0f172a;
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 56%;
  overflow: hidden;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.meeting-card__participant-ic {
  color: rgb(var(--status-rgb));
}

.meeting-card__participant-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meeting-card__select-btn {
  border-radius: 999px !important;
  padding: 6px 12px !important;
  font-weight: 800 !important;
  line-height: 1 !important;
  border-color: rgba(197, 155, 58, 0.42) !important;
  color: var(--am-accent) !important;
  background: rgba(197, 155, 58, 0.1) !important;
}

.meeting-card__select-btn:hover {
  background: rgba(197, 155, 58, 0.16) !important;
}

.meeting-card.scheduled {
  --status-rgb: 241, 165, 0;
}

.meeting-card.completed {
  --status-rgb: 34, 197, 94;
}

.meeting-card.cancelled {
  --status-rgb: 239, 68, 68;
}

.meeting-card__body {
  flex: 1;
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.meeting-card__title {
  margin: 0 0 4px;
  color: #111827;
  font-size: 1.18rem;
  font-weight: 800;
  line-height: 1.45;
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meeting-card__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.meeting-card__proposal-link {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid rgba(var(--am-gold-rgb), 0.55);
  background: rgba(var(--am-gold-rgb), 0.12);
  color: var(--am-accent);
  cursor: pointer;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
  transition: transform 0.12s ease, box-shadow 0.12s ease, background-color 0.12s ease, border-color 0.12s ease;
  padding: 0;
  line-height: 0;
}

.meeting-card__proposal-link:hover {
  background: rgba(var(--am-gold-rgb), 0.18);
  border-color: rgba(var(--am-gold-rgb), 0.75);
  box-shadow: 0 12px 22px rgba(15, 23, 42, 0.1);
  transform: translateY(-1px);
}

.meeting-card__proposal-link:active {
  transform: translateY(0);
}

.meeting-card__proposal-link:focus {
  outline: none;
}

.meeting-card__proposal-link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--am-accent-ring), 0 12px 22px rgba(15, 23, 42, 0.1);
}

.meeting-card__title-wrap {
  position: relative;
  display: block;
}

.meeting-card__title:focus {
  outline: none;
}

.meeting-card__title:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--am-accent-ring);
  border-radius: 10px;
}

.meeting-card__title-tooltip {
  position: absolute;
  top: calc(100% - 6px);
  left: 0;
  max-width: 420px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(148, 163, 184, 0.36);
  border-radius: 12px;
  box-shadow: 0 14px 34px rgba(2, 6, 23, 0.14);
  color: #0f172a;
  font-size: 0.92rem;
  line-height: 1.4;
  z-index: 10;
  pointer-events: none;
  white-space: normal;
  overflow-wrap: anywhere;
}

.meeting-card__title-tooltip::before {
  content: "";
  position: absolute;
  top: -7px;
  left: 18px;
  width: 12px;
  height: 12px;
  background: rgba(255, 255, 255, 0.98);
  border-left: 1px solid rgba(148, 163, 184, 0.36);
  border-top: 1px solid rgba(148, 163, 184, 0.36);
  transform: rotate(45deg);
}

.meeting-card__meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 12px;
  margin-bottom: 16px;
  align-items: stretch;
}

.meeting-card__meta-item {
  position: relative;
  width: 100%;
  min-width: 0;
  outline: none;
}

.meeting-card__meta-item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--am-accent-ring);
  border-radius: 10px;
}

.meeting-card__meta-tooltip {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  max-width: 440px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(148, 163, 184, 0.34);
  border-radius: 12px;
  box-shadow: 0 14px 34px rgba(2, 6, 23, 0.14);
  color: #0f172a;
  font-size: 0.88rem;
  line-height: 1.35;
  z-index: 12;
  pointer-events: none;
  white-space: normal;
  overflow-wrap: anywhere;
}

.meeting-card__meta-widget {
  margin-bottom: 0;
  width: 100%;
}

.meeting-card__meta-widget::v-deep.card {
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid rgba(var(--am-gold-rgb), 0.5);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 8px 14px rgba(15, 23, 42, 0.05);
  width: 100%;
  height: 64px;
}

.meeting-card__meta-widget::v-deep .card-body {
  padding: 0 !important;
  align-items: stretch !important;
  height: 100%;
}

.meeting-card__meta-widget::v-deep .card-body>.mr-3 {
  margin: 0 !important;
  padding: 0 !important;
  width: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.meeting-card__meta-widget::v-deep .card-body>div:not(.mr-3) {
  padding: 7px 9px !important;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.meeting-card__meta-widget::v-deep .text-value {
  line-height: 1.1;
  margin-bottom: 2px;
  font-size: 0.92rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meeting-card__meta-widget::v-deep .small {
  line-height: 1.1;
  font-size: 0.78rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meeting-card__meta-item:nth-child(1) .meeting-card__meta-widget::v-deep .text-value {
  color: #1e1b4b;
}

.meeting-card__meta-item:nth-child(1) .meeting-card__meta-widget::v-deep .small {
  color: rgba(30, 27, 75, 0.82);
}

.meeting-card__meta-item:nth-child(2) .meeting-card__meta-widget::v-deep .text-value {
  color: #0f172a;
}

.meeting-card__meta-item:nth-child(2) .meeting-card__meta-widget::v-deep .small {
  color: rgba(15, 23, 42, 0.88);
}

.meeting-card__meta-item:nth-child(1) .meeting-card__meta-widget::v-deep.card {
  border-color: rgba(var(--am-gold-rgb), 0.84);
}

.meeting-card__meta-item:nth-child(2) .meeting-card__meta-widget::v-deep.card {
  border-color: rgba(var(--am-gold-rgb), 0.84);
}

.meeting-card__detail-list {
  padding: 14px 0;
  border-top: 1px solid rgba(148, 163, 184, 0.22);
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
}

.meeting-card__detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.22);
}

.meeting-card__detail:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.meeting-card__detail-key {
  min-width: 82px;
  color: #6b7280;
  font-size: 0.86rem;
  flex: 0 0 auto;
  line-height: 1.2;
  white-space: nowrap;
}

.meeting-card__detail-value {
  color: #111827;
  font-size: 0.9rem;
  text-align: center;
  margin-left: auto;
  flex: 0 1 clamp(140px, 48%, 220px);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.meeting-card__detail-value.meeting-mode {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.meeting-card__detail-value.meeting-mode::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 999px;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.55), 0 8px 14px rgba(15, 23, 42, 0.10);
}

.meeting-card__detail-value.meeting-mode--online::before {
  background: #38bdf8;
}

.meeting-card__detail-value.meeting-mode--onsite::before {
  background: #fb923c;
}

.meeting-card__detail-value.is-link {
  display: flex;
  margin-left: auto;
  justify-content: center;
  align-items: center;
  min-width: 0;
  overflow: visible;
  text-overflow: unset;
  white-space: nowrap;
}

.meeting-card__detail-value a {
  color: var(--am-accent);
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meeting-card__detail-value a.meeting-card__link-btn {
  display: inline-flex;
  max-width: none;
  overflow: visible;
  white-space: normal;
  text-overflow: unset;
}


.meeting-card__link-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 32px;
  padding: 0;
  border-radius: 10px;
  border: 1px solid rgba(var(--am-gold-rgb), 0.45);
  background: rgba(var(--am-gold-rgb), 0.12);
  color: #334155;
  text-decoration: none;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.06);
  transition: transform 0.12s ease, box-shadow 0.12s ease, background-color 0.12s ease, border-color 0.12s ease;
  max-width: none;
  overflow: visible;
  cursor: pointer;
  line-height: 0;
  vertical-align: middle;
}

.meeting-card__link-btn .c-icon {
  display: block;
}

.meeting-card__link-btn:hover {
  background: rgba(var(--am-gold-rgb), 0.18);
  border-color: rgba(var(--am-gold-rgb), 0.7);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.meeting-card__link-btn:active {
  transform: translateY(0);
}

.meeting-card__link-btn.is-disabled {
  background: #e5e7eb;
  border-color: #e5e7eb;
  color: #6b7280;
  box-shadow: none;
  cursor: not-allowed;
}

.meeting-card__link-btn.is-disabled:hover {
  transform: none;
  box-shadow: none;
}

.meeting-card__link-btn:focus {
  outline: none;
}

.meeting-card__link-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--am-accent-ring), 0 10px 20px rgba(15, 23, 42, 0.08);
}

.meeting-card__agenda {
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin-top: 4px;
}

.meeting-card__agenda-label {
  font-size: 0.86rem;
  color: #6b7280;
  margin-bottom: 6px;
  font-weight: 700;
}

.meeting-card__agenda-body {
  flex: 0 0 auto;
  height: 96px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(248, 250, 252, 0.9);
  color: #111827;
  font-size: 0.9rem;
  line-height: 1.35;
  overflow-y: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.meeting-card__footer {
  margin-top: 18px;
}

.meeting-card__selected-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  border-radius: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.meeting-card__overlay-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: rgba(255, 255, 255, 0.78);
  color: #0f172a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 22px rgba(15, 23, 42, 0.16);
  transition: transform 0.12s ease, filter 0.12s ease, box-shadow 0.12s ease;
  cursor: pointer;
}

.meeting-card__overlay-close:hover {
  filter: brightness(1.02);
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(15, 23, 42, 0.18);
}

.meeting-card__overlay-close:active {
  transform: translateY(0);
}

.meeting-card__overlay-close:focus {
  outline: none;
}

.meeting-card__overlay-close:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--am-accent-ring), 0 14px 26px rgba(15, 23, 42, 0.18);
}

.meeting-card--selected .meeting-card__surface> :not(.meeting-card__selected-overlay) {
  filter: blur(2.5px);
}

.meeting-card__selected-actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.meeting-card__overlay-btn {
  width: 108px !important;
  height: 40px !important;
  padding: 0 14px !important;
  border-radius: 14px !important;
  font-weight: 900 !important;
  letter-spacing: 0.01em;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  border: 0 !important;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.18) !important;
  transition: transform 0.12s ease, filter 0.12s ease, box-shadow 0.12s ease !important;
}

.meeting-card__overlay-btn:hover {
  filter: brightness(1.03);
  transform: translateY(-1px);
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.22) !important;
}

.meeting-card__overlay-btn:active {
  transform: translateY(0);
}

.meeting-card__overlay-btn:focus {
  outline: none !important;
}

.meeting-card__overlay-btn:focus-visible {
  outline: none !important;
  box-shadow: 0 0 0 3px var(--am-accent-ring), 0 16px 32px rgba(15, 23, 42, 0.22) !important;
}

.meeting-card__overlay-btn--edit {
  background: linear-gradient(135deg, rgba(197, 155, 58, 0.98), rgba(241, 165, 0, 0.98)) !important;
  color: #ffffff !important;
}

.meeting-card__overlay-btn--delete {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.98), rgba(139, 18, 18, 0.98)) !important;
  color: #ffffff !important;
}

.meeting-card__overlay-ic {
  opacity: 0.95;
}

.meeting-card__cta {
  border-radius: 14px !important;
  padding: 10px 12px !important;
  font-weight: 900 !important;
  letter-spacing: 0.01em;
  background: linear-gradient(135deg, rgba(197, 155, 58, 0.98), rgba(139, 18, 18, 0.98)) !important;
  border: 1px solid rgba(139, 18, 18, 0.22) !important;
  color: #ffffff !important;
  box-shadow: 0 12px 22px rgba(15, 23, 42, 0.14);
  transition: transform 0.12s ease, filter 0.12s ease, box-shadow 0.12s ease;
}

.meeting-card__cta:hover {
  filter: brightness(1.03);
  box-shadow: 0 14px 26px rgba(15, 23, 42, 0.18);
  transform: translateY(-1px);
}

.meeting-card__cta:active {
  transform: translateY(0);
}

.meeting-card__cta:focus {
  outline: none !important;
}

.meeting-card__cta:focus-visible {
  outline: none !important;
  box-shadow: 0 0 0 3px var(--am-accent-ring), 0 14px 26px rgba(15, 23, 42, 0.18);
}

.meeting-card__cta.meeting-card__cta--soft {
  background: #fff7e6 !important;
  border-color: rgba(var(--am-gold-rgb), 0.65) !important;
  color: var(--am-accent) !important;
  box-shadow: 0 12px 22px rgba(15, 23, 42, 0.10);
  filter: none !important;
}

.meeting-card__cta.meeting-card__cta--soft:hover {
  background: rgba(var(--am-gold-rgb), 0.18) !important;
  border-color: rgba(var(--am-gold-rgb), 0.8) !important;
  color: var(--am-accent) !important;
  box-shadow: 0 14px 26px rgba(15, 23, 42, 0.12);
}

.meeting-card__cta.meeting-card__cta--soft:focus-visible {
  box-shadow: 0 0 0 3px var(--am-accent-ring), 0 14px 26px rgba(15, 23, 42, 0.12) !important;
}

.meeting-card__cta.is-completed {
  background: rgba(var(--am-gold-rgb), 0.12) !important;
  border-color: rgba(var(--am-gold-rgb), 0.6) !important;
  color: var(--am-accent) !important;
  box-shadow: none;
}

.meeting-card__cta.is-completed:hover {
  background: rgba(var(--am-gold-rgb), 0.16) !important;
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.1);
}

.meeting-card.completed {
  border-color: rgba(34, 197, 94, 0.35);
}

.meeting-card.cancelled {
  border-color: rgba(239, 68, 68, 0.3);
  opacity: 0.88;
}

.empty-state {
  padding: 40px 24px;
  border: 1px dashed #cbd5e1;
  border-radius: 20px;
  background: #ffffff;
  text-align: center;
  color: #64748b;
}

.empty-state__icon {
  margin-bottom: 12px;
  font-size: 2.25rem;
}

.empty-state__title {
  margin-bottom: 6px;
  color: #0f172a;
  font-size: 1.05rem;
  font-weight: 700;
}

.empty-state__text {
  max-width: 520px;
  margin: 0 auto;
  line-height: 1.6;
}

@media (max-width: 991px) {
  .meetings-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .meetings-hero__action {
    width: 100%;
  }

  .hero-action-btn {
    width: 100%;
  }
}

@media (max-width: 767px) {
  .meetings-hero {
    padding: 22px 18px;
    border-radius: 18px;
  }

  .meetings-hero__title {
    font-size: 1.5rem;
  }
}

/* Modal form improvements */
.meeting-modal .meeting-form,
.minutes-modal .minutes-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  padding: 6px 0 2px;
  align-items: start;
}

.meeting-modal .meeting-form .full,
.minutes-modal .minutes-form .full {
  grid-column: 1 / -1;
}

.meeting-modal .meeting-form .small-row {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.minutes-modal .minutes-meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(248, 250, 252, 0.92);
  color: #0f172a;
  font-weight: 700;
}

.minutes-modal .minutes-meta__item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.minutes-modal .minutes-meta__divider {
  width: 1px;
  height: 18px;
  background: rgba(148, 163, 184, 0.55);
}

.minutes-modal .minutes-meta__ic {
  color: var(--am-accent);
  opacity: 0.9;
}

.minutes-modal .minutes-panel {
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
  padding: 12px 12px 10px;
}

.minutes-modal .minutes-panel__title {
  font-weight: 900;
  color: #0f172a;
  margin-bottom: 8px;
}

.minutes-modal .minutes-panel textarea.form-control {
  margin-top: 0 !important;
}

.minutes-modal .minutes-action {
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
  padding: 12px;
}

.minutes-modal .minutes-action__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.minutes-modal .minutes-action__title {
  font-weight: 900;
  color: #0f172a;
}

.minutes-modal .minutes-action__add {
  border-radius: 14px !important;
  font-weight: 900 !important;
  box-shadow: 0 12px 22px rgba(15, 23, 42, 0.12);
}

.minutes-modal .minutes-action__add-row td {
  background: rgba(248, 250, 252, 0.8);
  padding: 10px !important;
}

.minutes-modal .minutes-action__add-btn {
  width: 100%;
  height: 40px;
  border-radius: 14px;
  border: 1px dashed rgba(197, 155, 58, 0.6);
  background: rgba(197, 155, 58, 0.08);
  color: var(--am-accent);
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.12s ease, filter 0.12s ease, box-shadow 0.12s ease;
}

.minutes-modal .minutes-action__add-btn:hover {
  filter: brightness(1.02);
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(15, 23, 42, 0.12);
}

.minutes-modal .minutes-action__add-btn:active {
  transform: translateY(0);
}

.minutes-modal .minutes-action__add-btn:focus {
  outline: none;
}

.minutes-modal .minutes-action__add-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--am-accent-ring), 0 14px 26px rgba(15, 23, 42, 0.12);
}

.minutes-modal .minutes-action__add-ic {
  opacity: 0.9;
}

.minutes-modal .minutes-action__table {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.22);
}

.minutes-modal .minutes-action__table .table thead th {
  background: rgba(197, 155, 58, 0.08);
  color: #0f172a;
  font-weight: 900;
}

.minutes-modal .minutes-action__remove {
  width: 34px;
  height: 34px;
  padding: 0 !important;
  border-radius: 12px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

@media (max-width: 991px) {
  .minutes-modal .minutes-form {
    grid-template-columns: 1fr;
  }
}

.input-icon__wrap {
  display: flex;
  align-items: stretch;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(var(--am-gold-rgb), 0.55);
  background: #ffffff;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.06);
}

.input-icon__control {
  flex: 1;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  font-size: 1rem;
  background: transparent !important;
}

.input-icon__control[readonly] {
  cursor: pointer;
}

.input-icon__suffix {
  width: 52px;
  border: 0;
  border-left: 1px solid rgba(var(--am-gold-rgb), 0.55);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0;
  cursor: pointer;
}

.input-icon__wrap[data-tone="primary"] .input-icon__suffix {
  background: linear-gradient(135deg, var(--am-accent), var(--am-gold));
}

.input-icon__wrap[data-tone="info"] .input-icon__suffix {
  background: linear-gradient(135deg, var(--am-gold), var(--am-accent));
}

.input-icon__wrap[data-tone="primary"] {
  border-color: rgba(var(--am-gold-rgb), 0.65);
}

.input-icon__wrap[data-tone="info"] {
  border-color: rgba(var(--am-gold-rgb), 0.65);
}

.input-icon__suffix:hover {
  filter: brightness(1.03);
}

.input-icon__suffix:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--am-accent-ring);
}

.input-icon__ic {
  opacity: 0.88;
}

.meeting-modal input,
.meeting-modal textarea,
.meeting-modal select,
.minutes-modal input,
.minutes-modal textarea,
.minutes-modal select {
  min-height: var(--am-control-height);
  padding: var(--am-control-pad-y) var(--am-control-pad-x);
  border-radius: var(--am-radius);
}

.time-trigger {
  cursor: pointer;
}

.time-trigger:disabled {
  cursor: not-allowed;
}

.time-trigger[readonly] {
  cursor: pointer;
}

.time-dropdown__backdrop {
  position: fixed;
  inset: 0;
  z-index: 20000;
}

.time-dropdown {
  position: fixed;
  z-index: 20001;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 14px;
  box-shadow: 0 24px 60px rgba(2, 6, 23, 0.2);
  padding: 6px;
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.time-dropdown__item {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 1rem;
  line-height: 1.25;
  color: #0f172a;
  cursor: pointer;
}

.time-dropdown__item:hover {
  background: rgba(15, 23, 42, 0.06);
}

.time-dropdown__item.is-selected {
  background: linear-gradient(135deg, rgba(139, 18, 18, 0.14), rgba(197, 155, 58, 0.14));
  color: var(--am-accent);
  font-weight: 800;
}

.meeting-modal input,
.meeting-modal textarea,
.meeting-modal select,
.minutes-modal input,
.minutes-modal textarea,
.minutes-modal select {
  width: 100%;
  box-sizing: border-box;
}

.meeting-modal .modal-body,
.minutes-modal .modal-body {
  padding: 10px 16px !important;
}

.meeting-modal .modal-content,
.minutes-modal .modal-content {
  background: #ffffff;
  overflow: hidden;
}

.meeting-modal .modal-dialog {
  max-width: 1400px;
}

.meeting-modal .meeting-form,
.minutes-modal .minutes-form {
  max-width: 100%;
  margin: 0;
  width: 100%;
  padding-left: 12px;
  padding-right: 12px;
  box-sizing: border-box;
}

.meeting-modal .modal-body {
  padding: 18px 22px !important;
}

.meeting-modal .meeting-form {
  padding-left: 20px;
  padding-right: 20px;
}

.meeting-modal .form-label,
.minutes-modal .form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  text-align: left;
}

.meeting-modal .required,
.minutes-modal .required {
  color: #e11d48;
  margin-left: 0;
}

.meeting-modal .full-field,
.minutes-modal .full-field {
  grid-column: 1 / -1;
}

.meeting-modal .form-text,
.minutes-modal .form-text {
  display: block;
  color: #6b7280;
  margin-top: 6px;
  font-size: 0.92rem;
}

.meeting-modal .meeting-form .form-text,
.minutes-modal .minutes-form .form-text {
  color: #6b7280;
}

.btn-save {
  min-width: 140px;
  border-radius: 10px !important;
}

@media (max-width: 767px) {

  .meeting-modal .meeting-form,
  .minutes-modal .minutes-form {
    gap: 10px;
  }

  .meeting-modal .meeting-form .small-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Footer buttons: make both floating buttons equal and aligned with documents modal */
.meeting-modal .modal-actions-wrapper {
  padding-right: 48px !important;
  justify-content: flex-end !important;
}

.meeting-modal .modal-actions-wrapper>.floating-action,
.meeting-modal .modal-actions-wrapper>.floating-action+.floating-action,
.meeting-modal .modal-footer .d-flex.justify-content-end>* {
  transform: translateY(-8px) scale(1) !important;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12) !important;
  position: relative !important;
  z-index: 11000 !important;
  padding: 8px 14px !important;
  font-size: 0.9rem !important;
  min-width: 110px !important;
  border-radius: 8px !important;
}

.meeting-modal .btn-save {
  min-width: 110px !important;
}

[data-coreui-theme='dark'] .admin-meetings-page,
body.c-dark-theme .admin-meetings-page {
  --am-bg: #0f1724;
  --am-surface: #162235;
  --am-border: #2f3e55;
  --am-text: #e8eef7;
  --am-muted: #b3c2dd;
  --am-accent-ring: rgba(118, 164, 255, 0.22);
  color: var(--am-text);
}

[data-coreui-theme='dark'] .summary-row--filters .summary-card:hover,
body.c-dark-theme .summary-row--filters .summary-card:hover,
[data-coreui-theme='dark'] .summary-row--filters .summary-card:focus-visible,
body.c-dark-theme .summary-row--filters .summary-card:focus-visible,
[data-coreui-theme='dark'] .summary-card--active,
body.c-dark-theme .summary-card--active {
  box-shadow: 0 18px 44px rgba(2, 6, 23, 0.48) !important;
}

[data-coreui-theme='dark'] .filter-card,
body.c-dark-theme .filter-card {
  box-shadow: 0 18px 42px rgba(2, 6, 23, 0.4);
}

[data-coreui-theme='dark'] .meeting-card__surface,
body.c-dark-theme .meeting-card__surface {
  background: linear-gradient(
    180deg,
    #1b2940 0%,
    #1b2940 var(--meeting-card-accent-height),
    #131f31 var(--meeting-card-accent-height),
    #0f1928 100%
  );
  border-color: rgba(59, 76, 101, 0.95);
  border-top-color: rgba(var(--status-rgb), 0.35);
  box-shadow:
    inset 0 0 0 1px rgba(var(--status-rgb), 0.12),
    0 16px 34px rgba(2, 6, 23, 0.45);
}

[data-coreui-theme='dark'] .meeting-card__surface::before,
body.c-dark-theme .meeting-card__surface::before {
  background:
    radial-gradient(circle at 16% 22%, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0) 52%),
    radial-gradient(circle at 86% 0%, rgba(var(--status-rgb), 0.3), rgba(var(--status-rgb), 0) 60%),
    linear-gradient(135deg, rgba(var(--status-rgb), 0.3) 0%, rgba(var(--status-rgb), 0.16) 58%, rgba(15, 23, 42, 0) 100%);
  border-bottom-color: rgba(var(--status-rgb), 0.26);
}

[data-coreui-theme='dark'] .meeting-card__surface::after,
body.c-dark-theme .meeting-card__surface::after {
  opacity: 0.22;
}

[data-coreui-theme='dark'] .meeting-card__content,
body.c-dark-theme .meeting-card__content {
  box-shadow: 0 -1px 0 rgba(148, 163, 184, 0.2);
}

[data-coreui-theme='dark'] .meeting-card__participant-pill,
body.c-dark-theme .meeting-card__participant-pill {
  background: rgba(15, 23, 42, 0.58);
  border-color: rgba(var(--status-rgb), 0.34);
  color: #dbe6f8;
  box-shadow: 0 10px 18px rgba(2, 6, 23, 0.28);
}

[data-coreui-theme='dark'] .meeting-card__title,
body.c-dark-theme .meeting-card__title,
[data-coreui-theme='dark'] .meeting-card__detail-value,
body.c-dark-theme .meeting-card__detail-value,
[data-coreui-theme='dark'] .meeting-card__agenda-body,
body.c-dark-theme .meeting-card__agenda-body {
  color: #e8eef7;
}

[data-coreui-theme='dark'] .meeting-card__detail-key,
body.c-dark-theme .meeting-card__detail-key,
[data-coreui-theme='dark'] .meeting-card__agenda-label,
body.c-dark-theme .meeting-card__agenda-label {
  color: #b3c2dd;
}

[data-coreui-theme='dark'] .meeting-card__agenda-body,
body.c-dark-theme .meeting-card__agenda-body {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(58, 75, 103, 0.65);
}

[data-coreui-theme='dark'] .meeting-card__meta-widget::v-deep.card,
body.c-dark-theme .meeting-card__meta-widget::v-deep.card {
  background: rgba(15, 23, 42, 0.56);
  border-color: rgba(var(--am-gold-rgb), 0.46);
  box-shadow: 0 8px 16px rgba(2, 6, 23, 0.25);
}

[data-coreui-theme='dark'] .meeting-card__meta-item:nth-child(1) .meeting-card__meta-widget::v-deep .text-value,
body.c-dark-theme .meeting-card__meta-item:nth-child(1) .meeting-card__meta-widget::v-deep .text-value,
[data-coreui-theme='dark'] .meeting-card__meta-item:nth-child(2) .meeting-card__meta-widget::v-deep .text-value,
body.c-dark-theme .meeting-card__meta-item:nth-child(2) .meeting-card__meta-widget::v-deep .text-value {
  color: #f2f7ff;
}

[data-coreui-theme='dark'] .meeting-card__meta-item:nth-child(1) .meeting-card__meta-widget::v-deep .small,
body.c-dark-theme .meeting-card__meta-item:nth-child(1) .meeting-card__meta-widget::v-deep .small,
[data-coreui-theme='dark'] .meeting-card__meta-item:nth-child(2) .meeting-card__meta-widget::v-deep .small,
body.c-dark-theme .meeting-card__meta-item:nth-child(2) .meeting-card__meta-widget::v-deep .small {
  color: #b9c9e1;
}

[data-coreui-theme='dark'] .meeting-card__title-tooltip,
body.c-dark-theme .meeting-card__title-tooltip,
[data-coreui-theme='dark'] .meeting-card__meta-tooltip,
body.c-dark-theme .meeting-card__meta-tooltip {
  background: rgba(18, 28, 42, 0.98);
  border-color: rgba(58, 75, 103, 0.86);
  color: #e8eef7;
  box-shadow: 0 14px 34px rgba(2, 6, 23, 0.4);
}

[data-coreui-theme='dark'] .meeting-card__title-tooltip::before,
body.c-dark-theme .meeting-card__title-tooltip::before {
  background: rgba(18, 28, 42, 0.98);
  border-left-color: rgba(58, 75, 103, 0.86);
  border-top-color: rgba(58, 75, 103, 0.86);
}

[data-coreui-theme='dark'] .meeting-card__selected-overlay,
body.c-dark-theme .meeting-card__selected-overlay {
  background: rgba(8, 14, 24, 0.5);
}

[data-coreui-theme='dark'] .meeting-card__overlay-close,
body.c-dark-theme .meeting-card__overlay-close {
  background: rgba(18, 28, 42, 0.86);
  border-color: rgba(58, 75, 103, 0.86);
  color: #e8eef7;
  box-shadow: 0 12px 22px rgba(2, 6, 23, 0.44);
}

[data-coreui-theme='dark'] .meeting-card__link-btn,
body.c-dark-theme .meeting-card__link-btn {
  color: #d8e3f7;
  background: rgba(var(--am-gold-rgb), 0.16);
  border-color: rgba(var(--am-gold-rgb), 0.5);
}

[data-coreui-theme='dark'] .meeting-card__link-btn.is-disabled,
body.c-dark-theme .meeting-card__link-btn.is-disabled {
  background: #243447;
  border-color: #354a62;
  color: #9fb0c6;
}

[data-coreui-theme='dark'] .empty-state,
body.c-dark-theme .empty-state {
  border-color: #3a4b67;
  background: #162235;
  color: #b9c7dd;
}

[data-coreui-theme='dark'] .empty-state__title,
body.c-dark-theme .empty-state__title {
  color: #edf3ff;
}

[data-coreui-theme='dark'] .minutes-modal .minutes-panel,
body.c-dark-theme .minutes-modal .minutes-panel,
[data-coreui-theme='dark'] .minutes-modal .minutes-action,
body.c-dark-theme .minutes-modal .minutes-action,
[data-coreui-theme='dark'] .meeting-modal .modal-content,
body.c-dark-theme .meeting-modal .modal-content,
[data-coreui-theme='dark'] .minutes-modal .modal-content,
body.c-dark-theme .minutes-modal .modal-content {
  background: #162235;
  border-color: #2f3e55;
}

[data-coreui-theme='dark'] .minutes-modal .minutes-meta,
body.c-dark-theme .minutes-modal .minutes-meta {
  background: rgba(18, 28, 42, 0.9);
  border-color: rgba(58, 75, 103, 0.75);
  color: #e8eef7;
}

[data-coreui-theme='dark'] .minutes-modal .minutes-action__table .table thead th,
body.c-dark-theme .minutes-modal .minutes-action__table .table thead th,
[data-coreui-theme='dark'] .minutes-modal .minutes-action__add-row td,
body.c-dark-theme .minutes-modal .minutes-action__add-row td {
  background: rgba(18, 28, 42, 0.88);
  color: #d8e3f7;
}

[data-coreui-theme='dark'] .input-icon__wrap,
body.c-dark-theme .input-icon__wrap,
[data-coreui-theme='dark'] .time-dropdown,
body.c-dark-theme .time-dropdown {
  background: #121c2a;
  border-color: #3a4b67;
}

[data-coreui-theme='dark'] .time-dropdown__item,
body.c-dark-theme .time-dropdown__item {
  color: #e8eef7;
}

[data-coreui-theme='dark'] .time-dropdown__item:hover,
body.c-dark-theme .time-dropdown__item:hover {
  background: rgba(118, 164, 255, 0.16);
}
</style>

<style>
/* Global modal footer/button + required asterisk rules (apply to teleported modals) */
.meeting-modal,
.minutes-modal {
  --am-bg: #fffaf2;
  --am-surface: #ffffff;
  --am-border: #eadfce;
  --am-text: #1f2937;
  --am-muted: #6b7280;
  --am-accent: #8b1212;
  --am-gold: #c59b3a;
  --am-gold-rgb: 197, 155, 58;
  --am-accent-ring: rgba(139, 18, 18, 0.18);
  --am-control-font: 0.95rem;
  --am-control-line: 1.35;
  --am-control-weight: 500;
  --am-control-height: 42px;
  --am-control-pad-y: 9px;
  --am-control-pad-x: 12px;
  --am-icon-width: 50px;
  --am-radius: 11px;
  --am-placeholder: rgba(100, 116, 139, 0.92);
  --am-placeholder-font: 0.88rem;
  --am-placeholder-weight: 400;
}

.meeting-modal input.form-control,
.meeting-modal select.form-control,
.minutes-modal input.form-control,
.minutes-modal select.form-control {
  height: var(--am-control-height) !important;
  min-height: var(--am-control-height) !important;
  padding: var(--am-control-pad-y) var(--am-control-pad-x) !important;
  border-radius: var(--am-radius) !important;
  font-size: var(--am-control-font) !important;
  line-height: var(--am-control-line) !important;
  font-weight: var(--am-control-weight) !important;
  box-sizing: border-box !important;
}

.meeting-modal textarea.form-control,
.minutes-modal textarea.form-control {
  min-height: var(--am-control-height) !important;
  padding: var(--am-control-pad-y) var(--am-control-pad-x) !important;
  border-radius: var(--am-radius) !important;
  font-size: var(--am-control-font) !important;
  line-height: var(--am-control-line) !important;
  font-weight: var(--am-control-weight) !important;
  box-sizing: border-box !important;
}

.meeting-modal .modal-actions-wrapper,
.minutes-modal .modal-actions-wrapper {
  padding-right: 16px !important;
  margin-right: 0 !important;
  justify-content: flex-end !important;
}

.meeting-modal .modal-actions-wrapper>.floating-action,
.minutes-modal .modal-actions-wrapper>.floating-action,
.meeting-modal .modal-actions-wrapper>.floating-action+.floating-action,
.minutes-modal .modal-actions-wrapper>.floating-action+.floating-action,
.meeting-modal .modal-footer .d-flex.justify-content-end>*,
.minutes-modal .modal-footer .d-flex.justify-content-end>* {
  transform: translateY(-8px) !important;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12) !important;
  position: relative !important;
  z-index: 11000 !important;
  padding: 8px 14px !important;
  font-size: 0.9rem !important;
  min-width: 110px !important;
  border-radius: 8px !important;
}

.meeting-modal .btn-save,
.minutes-modal .btn-save {
  min-width: 110px !important;
}

.meeting-modal .btn-cancel,
.minutes-modal .btn-cancel {
  background: rgba(var(--am-gold-rgb), 0.18) !important;
  border: 1px solid rgba(var(--am-gold-rgb), 0.78) !important;
  color: var(--am-accent) !important;
  font-weight: 700 !important;
  opacity: 1 !important;
}

.meeting-modal .btn-cancel:hover,
.minutes-modal .btn-cancel:hover {
  background: rgba(var(--am-gold-rgb), 0.26) !important;
  filter: none !important;
}

.meeting-modal .modal-header,
.minutes-modal .modal-header {
  background: linear-gradient(135deg, var(--am-accent) 0%, var(--am-gold) 115%);
  color: #ffffff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.18) !important;
}

.meeting-modal .modal-content,
.minutes-modal .modal-content {
  border-radius: 16px !important;
  overflow: hidden;
}

.meeting-modal .modal-header .modal-title,
.minutes-modal .modal-header .modal-title {
  color: #ffffff !important;
  font-weight: 900;
}

.meeting-modal__header-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.meeting-modal__cancel-meeting {
  border-radius: 10px !important;
  font-weight: 900 !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  background: rgba(255, 255, 255, 0.12) !important;
  color: #ffffff !important;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.16);
}

.meeting-modal__cancel-meeting:hover {
  background: rgba(255, 255, 255, 0.18) !important;
  filter: none !important;
}

.meeting-modal .close,
.minutes-modal .close,
.meeting-modal .modal-header .close,
.minutes-modal .modal-header .close,
.meeting-modal .modal-header button.close,
.minutes-modal .modal-header button.close {
  color: #ffffff !important;
  opacity: 0.92 !important;
  text-shadow: none !important;
}

.meeting-modal .close:hover,
.minutes-modal .close:hover,
.meeting-modal .modal-header button.close:hover,
.minutes-modal .modal-header button.close:hover {
  opacity: 1 !important;
}

.meeting-modal .btn-save,
.minutes-modal .btn-save {
  background: linear-gradient(135deg, var(--am-accent) 0%, var(--am-gold) 115%) !important;
  border-color: rgba(255, 255, 255, 0.18) !important;
  color: #ffffff !important;
}

.meeting-modal .btn-save:hover,
.minutes-modal .btn-save:hover {
  filter: brightness(1.04);
}

.meeting-modal .floating-action:not(.btn-save),
.minutes-modal .floating-action:not(.btn-save) {
  border-color: rgba(139, 18, 18, 0.24) !important;
}

.meeting-modal .required,
.minutes-modal .required {
  color: #e11d48 !important;
  margin-left: 0;
}

.meeting-modal .input-icon__wrap,
.minutes-modal .input-icon__wrap {
  display: flex;
  align-items: stretch;
  min-height: var(--am-control-height);
  border-radius: var(--am-radius);
  overflow: hidden;
  border: 1px solid rgba(var(--am-gold-rgb), 0.55);
  background: #ffffff;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.06);
}

.meeting-modal .input-icon__control,
.minutes-modal .input-icon__control {
  flex: 1;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  font-size: 1rem;
  background: transparent !important;
}

.meeting-modal .input-icon__control[readonly],
.minutes-modal .input-icon__control[readonly] {
  cursor: pointer;
}

.meeting-modal .input-icon__suffix,
.minutes-modal .input-icon__suffix {
  width: var(--am-icon-width);
  border: 0;
  border-left: 1px solid rgba(var(--am-gold-rgb), 0.55);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0;
  cursor: pointer;
}

.meeting-modal .input-icon__wrap[data-tone="primary"] .input-icon__suffix,
.minutes-modal .input-icon__wrap[data-tone="primary"] .input-icon__suffix {
  background: linear-gradient(135deg, var(--am-accent), var(--am-gold));
}

.meeting-modal .input-icon__wrap[data-tone="info"] .input-icon__suffix,
.minutes-modal .input-icon__wrap[data-tone="info"] .input-icon__suffix {
  background: linear-gradient(135deg, var(--am-gold), var(--am-accent));
}

.meeting-modal .input-icon__wrap[data-tone="primary"],
.minutes-modal .input-icon__wrap[data-tone="primary"] {
  border-color: rgba(var(--am-gold-rgb), 0.65);
}

.meeting-modal .input-icon__wrap[data-tone="info"],
.minutes-modal .input-icon__wrap[data-tone="info"] {
  border-color: rgba(var(--am-gold-rgb), 0.65);
}

.meeting-modal .form-control,
.minutes-modal .form-control,
.meeting-modal input.form-control,
.minutes-modal input.form-control,
.meeting-modal textarea.form-control,
.minutes-modal textarea.form-control,
.meeting-modal select.form-control,
.minutes-modal select.form-control {
  border-color: rgba(var(--am-gold-rgb), 0.55) !important;
}

.meeting-modal .form-control:focus,
.minutes-modal .form-control:focus,
.meeting-modal input.form-control:focus,
.minutes-modal input.form-control:focus,
.meeting-modal textarea.form-control:focus,
.minutes-modal textarea.form-control:focus,
.meeting-modal select.form-control:focus,
.minutes-modal select.form-control:focus {
  border-color: rgba(var(--am-gold-rgb), 0.88) !important;
  box-shadow: 0 0 0 3px rgba(var(--am-gold-rgb), 0.18) !important;
}

.meeting-modal .form-control::placeholder,
.minutes-modal .form-control::placeholder,
.meeting-modal input.form-control::placeholder,
.minutes-modal input.form-control::placeholder,
.meeting-modal textarea.form-control::placeholder,
.minutes-modal textarea.form-control::placeholder,
.meeting-modal .input-icon__control::placeholder,
.minutes-modal .input-icon__control::placeholder {
  color: var(--am-placeholder) !important;
  opacity: 1 !important;
  font-size: var(--am-placeholder-font) !important;
  line-height: var(--am-control-line) !important;
  font-weight: var(--am-placeholder-weight) !important;
}

.meeting-modal .form-control::-webkit-input-placeholder,
.minutes-modal .form-control::-webkit-input-placeholder,
.meeting-modal .input-icon__control::-webkit-input-placeholder,
.minutes-modal .input-icon__control::-webkit-input-placeholder {
  color: var(--am-placeholder) !important;
  opacity: 1 !important;
  font-size: var(--am-placeholder-font) !important;
  line-height: var(--am-control-line) !important;
  font-weight: var(--am-placeholder-weight) !important;
}

.meeting-modal .form-control:-ms-input-placeholder,
.minutes-modal .form-control:-ms-input-placeholder,
.meeting-modal .input-icon__control:-ms-input-placeholder,
.minutes-modal .input-icon__control:-ms-input-placeholder {
  color: var(--am-placeholder) !important;
  opacity: 1 !important;
  font-size: var(--am-placeholder-font) !important;
  line-height: var(--am-control-line) !important;
  font-weight: var(--am-placeholder-weight) !important;
}

.meeting-modal .multiselect__placeholder,
.minutes-modal .multiselect__placeholder {
  color: var(--am-placeholder) !important;
  opacity: 1 !important;
  font-size: var(--am-placeholder-font) !important;
  line-height: var(--am-control-line) !important;
  font-weight: var(--am-placeholder-weight) !important;
}

.meeting-modal .multiselect__input::placeholder,
.minutes-modal .multiselect__input::placeholder {
  color: var(--am-placeholder) !important;
  opacity: 1 !important;
  font-size: var(--am-placeholder-font) !important;
  line-height: inherit !important;
  font-weight: var(--am-placeholder-weight) !important;
}

.meeting-modal .multiselect__tags,
.minutes-modal .multiselect__tags {
  min-height: var(--am-control-height) !important;
  padding: var(--am-control-pad-y) calc(var(--am-icon-width) + 2px) var(--am-control-pad-y) var(--am-control-pad-x) !important;
  border-color: rgba(var(--am-gold-rgb), 0.55) !important;
  border-radius: var(--am-radius) !important;
  color: var(--am-text) !important;
  background: #ffffff !important;
  background-image: none !important;
  box-sizing: border-box !important;
}

.meeting-modal .multiselect:not(.multiselect--multiple) .multiselect__tags,
.minutes-modal .multiselect:not(.multiselect--multiple) .multiselect__tags {
  height: var(--am-control-height) !important;
}

.meeting-modal .multiselect__input,
.minutes-modal .multiselect__input {
  height: auto !important;
  min-height: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  background-image: none !important;
}

.meeting-modal .multiselect__single,
.minutes-modal .multiselect__single {
  background-image: none !important;
}

.meeting-modal .multiselect,
.minutes-modal .multiselect {
  font-size: var(--am-control-font) !important;
  line-height: var(--am-control-line) !important;
  font-weight: var(--am-control-weight) !important;
}

.meeting-modal .multiselect__single,
.minutes-modal .multiselect__single,
.meeting-modal .multiselect__input,
.minutes-modal .multiselect__input {
  font-size: inherit !important;
  line-height: inherit !important;
  font-weight: inherit !important;
  color: var(--am-text) !important;
}

.meeting-modal .multiselect__select,
.minutes-modal .multiselect__select {
  width: var(--am-icon-width) !important;
  height: calc(100% - 2px) !important;
  top: 1px !important;
  right: 1px !important;
  border-left: 1px solid rgba(var(--am-gold-rgb), 0.55) !important;
  background: linear-gradient(135deg, var(--am-accent), var(--am-gold)) !important;
  border-radius: 0 calc(var(--am-radius) - 1px) calc(var(--am-radius) - 1px) 0 !important;
  box-sizing: border-box !important;
}

.meeting-modal .multiselect--active .multiselect__tags,
.minutes-modal .multiselect--active .multiselect__tags {
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

.meeting-modal .multiselect--active .multiselect__select,
.minutes-modal .multiselect--active .multiselect__select {
  border-bottom-right-radius: 0 !important;
}

.meeting-modal .multiselect__content-wrapper,
.minutes-modal .multiselect__content-wrapper {
  z-index: 12000 !important;
  max-height: 260px !important;
  overflow-y: auto !important;
  border: 1px solid rgba(var(--am-gold-rgb), 0.55) !important;
  border-top: 0 !important;
  border-radius: 0 0 var(--am-radius) var(--am-radius) !important;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14) !important;
}

.meeting-modal .multiselect__select::before,
.minutes-modal .multiselect__select::before {
  content: "" !important;
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 6px 6px 0;
  border-color: rgba(255, 255, 255, 0.92) transparent transparent !important;
  transition: transform 0.14s ease;
  transform: translate(-50%, -90%) rotate(0deg);
  pointer-events: none;
}

.meeting-modal .multiselect--active .multiselect__select::before,
.minutes-modal .multiselect--active .multiselect__select::before {
  transform: translate(-50%, -90%) rotate(180deg);
}

/* On press, preview the next state (prevents "rotate back the wrong way" feel) */
.meeting-modal .multiselect:not(.multiselect--active) .multiselect__select:active::before,
.minutes-modal .multiselect:not(.multiselect--active) .multiselect__select:active::before {
  transform: translate(-50%, -90%) rotate(180deg);
}

.meeting-modal .multiselect.multiselect--active .multiselect__select:active::before,
.minutes-modal .multiselect.multiselect--active .multiselect__select:active::before {
  transform: translate(-50%, -90%) rotate(0deg);
}

/* vue-multiselect default rotates the whole select button; keep gradient fixed and rotate only the arrow */
.meeting-modal .multiselect__select,
.minutes-modal .multiselect__select {
  transform: none !important;
}

.meeting-modal .multiselect--active .multiselect__tags,
.minutes-modal .multiselect--active .multiselect__tags {
  border-color: rgba(var(--am-gold-rgb), 0.88) !important;
  box-shadow: 0 0 0 3px rgba(var(--am-gold-rgb), 0.18) !important;
}

.meeting-modal .input-icon__suffix:hover,
.minutes-modal .input-icon__suffix:hover {
  filter: brightness(1.03);
}

.meeting-modal .input-icon__ic,
.minutes-modal .input-icon__ic {
  opacity: 0.88;
}

[data-coreui-theme='dark'] .meeting-modal .modal-content,
body.c-dark-theme .meeting-modal .modal-content,
[data-coreui-theme='dark'] .minutes-modal .modal-content,
body.c-dark-theme .minutes-modal .modal-content {
  background: #162235 !important;
  border-color: #2f3e55 !important;
}

[data-coreui-theme='dark'] .meeting-modal .modal-body,
body.c-dark-theme .meeting-modal .modal-body,
[data-coreui-theme='dark'] .minutes-modal .modal-body,
body.c-dark-theme .minutes-modal .modal-body,
[data-coreui-theme='dark'] .meeting-modal .modal-footer,
body.c-dark-theme .meeting-modal .modal-footer,
[data-coreui-theme='dark'] .minutes-modal .modal-footer,
body.c-dark-theme .minutes-modal .modal-footer {
  background: #1a2739 !important;
  color: #e7eeff !important;
  border-color: #2f3e55 !important;
}

[data-coreui-theme='dark'] .meeting-modal .form-label,
body.c-dark-theme .meeting-modal .form-label,
[data-coreui-theme='dark'] .minutes-modal .form-label,
body.c-dark-theme .minutes-modal .form-label,
[data-coreui-theme='dark'] .meeting-modal .form-text,
body.c-dark-theme .meeting-modal .form-text,
[data-coreui-theme='dark'] .minutes-modal .form-text,
body.c-dark-theme .minutes-modal .form-text,
[data-coreui-theme='dark'] .minutes-modal .minutes-panel__title,
body.c-dark-theme .minutes-modal .minutes-panel__title,
[data-coreui-theme='dark'] .minutes-modal .minutes-action__title,
body.c-dark-theme .minutes-modal .minutes-action__title {
  color: #dce7fb !important;
}

[data-coreui-theme='dark'] .meeting-modal .form-control,
body.c-dark-theme .meeting-modal .form-control,
[data-coreui-theme='dark'] .minutes-modal .form-control,
body.c-dark-theme .minutes-modal .form-control,
[data-coreui-theme='dark'] .meeting-modal input.form-control,
body.c-dark-theme .meeting-modal input.form-control,
[data-coreui-theme='dark'] .minutes-modal input.form-control,
body.c-dark-theme .minutes-modal input.form-control,
[data-coreui-theme='dark'] .meeting-modal textarea.form-control,
body.c-dark-theme .meeting-modal textarea.form-control,
[data-coreui-theme='dark'] .minutes-modal textarea.form-control,
body.c-dark-theme .minutes-modal textarea.form-control,
[data-coreui-theme='dark'] .meeting-modal select.form-control,
body.c-dark-theme .meeting-modal select.form-control,
[data-coreui-theme='dark'] .minutes-modal select.form-control,
body.c-dark-theme .minutes-modal select.form-control,
[data-coreui-theme='dark'] .meeting-modal .input-icon__wrap,
body.c-dark-theme .meeting-modal .input-icon__wrap,
[data-coreui-theme='dark'] .minutes-modal .input-icon__wrap,
body.c-dark-theme .minutes-modal .input-icon__wrap,
[data-coreui-theme='dark'] .meeting-modal .multiselect__tags,
body.c-dark-theme .meeting-modal .multiselect__tags,
[data-coreui-theme='dark'] .minutes-modal .multiselect__tags,
body.c-dark-theme .minutes-modal .multiselect__tags,
[data-coreui-theme='dark'] .meeting-modal .multiselect__content-wrapper,
body.c-dark-theme .meeting-modal .multiselect__content-wrapper,
[data-coreui-theme='dark'] .minutes-modal .multiselect__content-wrapper,
body.c-dark-theme .minutes-modal .multiselect__content-wrapper {
  background: #121c2a !important;
  border-color: #3a4b67 !important;
  color: #e7eeff !important;
}

[data-coreui-theme='dark'] .meeting-modal .multiselect__option,
body.c-dark-theme .meeting-modal .multiselect__option,
[data-coreui-theme='dark'] .minutes-modal .multiselect__option,
body.c-dark-theme .minutes-modal .multiselect__option,
[data-coreui-theme='dark'] .meeting-modal .multiselect__single,
body.c-dark-theme .meeting-modal .multiselect__single,
[data-coreui-theme='dark'] .minutes-modal .multiselect__single,
body.c-dark-theme .minutes-modal .multiselect__single,
[data-coreui-theme='dark'] .meeting-modal .multiselect__input,
body.c-dark-theme .meeting-modal .multiselect__input,
[data-coreui-theme='dark'] .minutes-modal .multiselect__input,
body.c-dark-theme .minutes-modal .multiselect__input {
  background: transparent !important;
  color: #e7eeff !important;
}
</style>
