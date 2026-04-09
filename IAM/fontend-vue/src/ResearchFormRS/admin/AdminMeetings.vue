<template>
  <div class="admin-meetings-page">
    <section class="meetings-hero">
      <div class="meetings-hero__content">
        <div class="meetings-hero__eyebrow">{{ resolvedHeroEyebrow }}</div>
        <h2 class="meetings-hero__title">{{ resolvedHeroTitle }}</h2>
        <p class="meetings-hero__subtitle mb-0">
          {{ resolvedHeroSubtitle }}
        </p>
      </div>
      <div v-if="canCreate" class="meetings-hero__action">
        <CButton color="primary" size="lg" class="hero-action-btn" @click="openCreateModal"><CIcon name="cil-plus" class="mr-1" /> {{ $t('userMeetings.adminActions.createMeeting') }}
        </CButton>
      </div>
    </section>

    <CRow class="summary-row summary-row--filters">
      <CCol sm="6" lg="3">
        <div class="summary-card summary-card--neutral"
          :class="{ 'summary-card--active': isSummaryFilterActive('') }" role="button" tabindex="0"
          :aria-pressed="isSummaryFilterActive('') ? 'true' : 'false'"
          @click="setAllFilter" @keydown.enter.prevent="setAllFilter"
          @keydown.space.prevent="setAllFilter">
          <div class="summary-label">{{ $t('userMeetings.summary.all.label') }}</div>
          <div class="summary-number">{{ summaryCountsLoading ? '...' : getSummaryCount('total') }}</div>
          <div class="summary-caption">{{ $t('userMeetings.summary.all.caption') }}</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3">
        <div class="summary-card summary-card--info"
          :class="{ 'summary-card--active': isSummaryFilterActive('scheduled') }" role="button" tabindex="0"
          :aria-pressed="isSummaryFilterActive('scheduled') ? 'true' : 'false'"
          @click="toggleSummaryFilter('scheduled')" @keydown.enter.prevent="toggleSummaryFilter('scheduled')"
          @keydown.space.prevent="toggleSummaryFilter('scheduled')">
          <div class="summary-label">{{ $t('userMeetings.summary.scheduled.label') }}</div>
          <div class="summary-number">{{ summaryCountsLoading ? '...' : getSummaryCount('scheduled') }}</div>
          <div class="summary-caption">{{ $t('userMeetings.summary.scheduled.caption') }}</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3">
        <div class="summary-card summary-card--success"
          :class="{ 'summary-card--active': isSummaryFilterActive('completed') }" role="button" tabindex="0"
          :aria-pressed="isSummaryFilterActive('completed') ? 'true' : 'false'"
          @click="toggleSummaryFilter('completed')" @keydown.enter.prevent="toggleSummaryFilter('completed')"
          @keydown.space.prevent="toggleSummaryFilter('completed')">
          <div class="summary-label">{{ $t('userMeetings.summary.completed.label') }}</div>
          <div class="summary-number">{{ summaryCountsLoading ? '...' : getSummaryCount('completed') }}</div>
          <div class="summary-caption">{{ $t('userMeetings.summary.completed.caption') }}</div>
        </div>
      </CCol>
      <CCol sm="6" lg="3">
        <div class="summary-card summary-card--danger"
          :class="{ 'summary-card--active': isSummaryFilterActive('cancelled') }" role="button" tabindex="0"
          :aria-pressed="isSummaryFilterActive('cancelled') ? 'true' : 'false'"
          @click="toggleSummaryFilter('cancelled')" @keydown.enter.prevent="toggleSummaryFilter('cancelled')"
          @keydown.space.prevent="toggleSummaryFilter('cancelled')">
          <div class="summary-label">{{ $t('userMeetings.summary.cancelled.label') }}</div>
          <div class="summary-number">{{ summaryCountsLoading ? '...' : getSummaryCount('cancelled') }}</div>
          <div class="summary-caption">{{ $t('userMeetings.summary.cancelled.caption') }}</div>
        </div>
      </CCol>
    </CRow>

    <CCard class="filter-card">
      <CCardBody>
        <div class="filter-card__header">
          <div>
            <div class="filter-card__title">{{ $t('userMeetings.search.title') }}</div>
            <div class="filter-card__subtitle">
              {{ $t('userMeetings.search.subtitlePrefix') }}
              <span>{{ $t('userMeetings.search.subtitleFields') }}</span>
            </div>
          </div>
        </div>
        <CRow class="align-items-end">
          <CCol md="12" class="mb-2 mb-md-0">
            <CInput v-model="searchKeyword" :label="$t('userMeetings.search.label')" :placeholder="$t('userMeetings.search.placeholder')"
              @input="onSearchKeywordInput" />
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <div v-if="loading" class="text-center py-5">
      <CSpinner color="primary" />
      <div class="mt-2 text-muted">{{ $t('userMeetings.states.loading') }}</div>
    </div>

    <div v-else>
      <div v-if="meetings.length === 0" class="empty-state">
        <div class="empty-state__icon"><CIcon name="cil-calendar" width="42" /></div>
        <div class="empty-state__title">{{ $t('userMeetings.states.emptyTitle') }}</div>
        <div class="empty-state__text">
          {{ canCreate
            ? $t('userMeetings.states.emptyCanCreate')
            : $t('userMeetings.states.emptyReadOnly')
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
          <div class="meeting-card__surface">
            <div class="meeting-card__top mt-1">
              <CBadge class="meeting-card__badge" :color="getStatusMeta(meeting.status).color">{{
                getStatusMeta(meeting.status).label }}</CBadge>
              <span class="meeting-card__participant-pill">
                <CIcon name="cil-people" width="16" class="meeting-card__participant-ic" aria-hidden="true" />
                <span class="meeting-card__participant-text">
                  {{ Array.isArray(meeting.participantIds) ? meeting.participantIds.length : 0 }} {{ $t('userMeetings.card.participantsSuffix') }}
                </span>
              </span>
            </div>

            <div class="meeting-card__content">
              <div class="meeting-card__body">
                <div class="meeting-card__title-wrap">
                  <div class="meeting-card__title-row">
                    <button v-if="getMeetingProposalId(meeting)" type="button" class="meeting-card__proposal-link"
                      :aria-label="$t('userMeetings.card.openProposalAria')" @click.stop="goToProposalForm(meeting)">
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
                <div class="meeting-card__meta">
                  <div class="meeting-card__meta-item meeting-card__meta-item--datetime" tabindex="0"
                    @mouseenter="maybeOpenMetaTooltip($event, `${meeting._id}-datetime`, `${formatDate(meeting.meetingDate)} | ${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}`)"
                    @mouseleave="closeMetaTooltip()"
                    @focus="maybeOpenMetaTooltip($event, `${meeting._id}-datetime`, `${formatDate(meeting.meetingDate)} | ${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}`)"
                    @blur="closeMetaTooltip()"
                    @click.stop="toggleMetaTooltip($event, `${meeting._id}-datetime`, `${formatDate(meeting.meetingDate)} | ${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}`)">
                    <div class="meeting-card__datetime-card">
                      <div class="meeting-card__datetime-cell meeting-card__datetime-cell--date">
                        <div class="meeting-card__datetime-icon-wrap">
                          <CIcon name="cil-calendar" width="22" />
                        </div>
                        <div class="meeting-card__datetime-text">
                          <div class="meeting-card__datetime-value">{{ formatDate(meeting.meetingDate) }}</div>
                          <div class="meeting-card__datetime-label">{{ $t('userMeetings.card.dateLabel') }}</div>
                        </div>
                      </div>
                      <div class="meeting-card__datetime-divider" aria-hidden="true"></div>
                      <div class="meeting-card__datetime-cell meeting-card__datetime-cell--time">
                        <div class="meeting-card__datetime-icon-wrap">
                          <CIcon name="cil-clock" width="22" />
                        </div>
                        <div class="meeting-card__datetime-text">
                          <div class="meeting-card__datetime-value">{{ `${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}` }}</div>
                          <div class="meeting-card__datetime-label">{{ $t('userMeetings.card.timeLabel') }}</div>
                        </div>
                      </div>
                    </div>
                    <div v-if="isMetaTooltipOpen(`${meeting._id}-datetime`)" class="meeting-card__meta-tooltip"
                      role="tooltip">
                      {{ metaTooltip.text }}
                    </div>
                  </div>
                </div>

                <div class="meeting-card__detail-list">
                  <div class="meeting-card__detail">
                    <span class="meeting-card__detail-key">{{ $t('userMeetings.card.modeLabel') }}</span>
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
                    <span class="meeting-card__detail-key">{{ $t('userMeetings.card.locationLabel') }}</span>
                    <span class="meeting-card__detail-value">{{ meeting.location || '-' }}</span>
                  </div>
                  <div class="meeting-card__detail">
                    <span class="meeting-card__detail-key">{{ $t('userMeetings.card.linkLabel') }}</span>
                    <span class="meeting-card__detail-value is-link">
                      <a v-if="meeting.videoLink" class="meeting-card__link-btn" :href="meeting.videoLink"
                        target="_blank" rel="noopener noreferrer" :aria-label="`${$t('userMeetings.card.openMeetingLinkAria')}: ${meeting.videoLink}`"
                        @click.stop>
                        <CIcon name="cil-external-link" width="18" aria-hidden="true" />
                      </a>
                      <button v-else type="button" class="meeting-card__link-btn is-disabled" disabled
                        aria-disabled="true" @click.stop.prevent>
                        <CIcon name="cil-external-link" width="16" aria-hidden="true" />
                      </button>
                    </span>
                  </div>
                </div>

                <div class="meeting-card__agenda">
                  <div class="meeting-card__agenda-label">{{ $t('userMeetings.card.agendaLabel') }}</div>
                  <div class="meeting-card__agenda-body">
                    {{ (meeting && typeof meeting.agenda === 'string' && meeting.agenda.trim()) ? meeting.agenda : '-' }}
                  </div>
                </div>
              </div>

              <div class="meeting-card__footer">
                <div class="meeting-card__footer-actions">
                  <CButton size="sm"
                    :color="(isReadOnly(meeting) && readOnlyCtaTone === 'dark') ? 'primary' : (isReadOnly(meeting) ? 'secondary' : (meeting.status === 'completed' ? 'secondary' : 'primary'))"
                    :class="[
                      'meeting-card__cta',
                      (meeting.status === 'completed' && !isReadOnly(meeting)) ? 'is-completed' : '',
                      (isReadOnly(meeting) && readOnlyCtaTone === 'soft') ? 'meeting-card__cta--soft' : ''
                    ]"
                    @click.stop="openMinutesModal(meeting)">
                    <CIcon name="cil-save" class="mr-1" /> {{ isReadOnly(meeting) ? $t('userMeetings.actions.viewDetail') : (meeting.status === 'completed' ? $t('userMeetings.actions.viewResult') : $t('userMeetings.actions.saveResult')) }}
                  </CButton>
                  <div v-if="canEditDelete && isMeetingActionable(meeting)" class="meeting-card__footer-side-actions">
                    <CButton size="sm" color="warning" class="meeting-card__side-btn meeting-card__side-btn--edit"
                      @click.stop="openEditModal(meeting)">
                      <CIcon name="cil-pencil" width="16" class="meeting-card__side-ic" aria-hidden="true" />
                      {{ $t('userMeetings.adminActions.edit') }}
                    </CButton>
                    <CButton size="sm" color="danger" class="meeting-card__side-btn meeting-card__side-btn--delete"
                      :disabled="deletingMeeting"
                      @click.stop="deleteMeeting(meeting)">
                      <CIcon name="cil-trash" width="16" class="meeting-card__side-ic" aria-hidden="true" />
                      {{ $t('userMeetings.adminActions.delete') }}
                    </CButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center mt-3 flex-wrap" style="gap: 8px;">
        <small class="text-muted">{{ $t('userMeetings.pagination.summary', { page, totalPages, total }) }}</small>
        <div>
          <CButton size="sm" color="secondary" variant="outline" class="mr-2" :disabled="page <= 1 || loading"
            @click="onPageChange(page - 1)">
            <CIcon name="cil-chevron-left" class="mr-1" /> {{ $t('userMeetings.pagination.previous') }}
          </CButton>
          <CButton size="sm" color="secondary" variant="outline" :disabled="page >= totalPages || loading"
            @click="onPageChange(page + 1)">
            <CIcon name="cil-chevron-right" class="mr-1" /> {{ $t('userMeetings.pagination.next') }}
          </CButton>
        </div>
      </div>
    </div>
    <CModal v-if="canCreate" :show.sync="showMeetingModal" :close-on-backdrop="false" centered size="lg" class="meeting-modal">
      <template #header-wrapper>
        <div class="modal-header">
          <h5 class="modal-title">{{ isEditMode ? $t('adminMeetings.modal.editTitle') : $t('adminMeetings.modal.createTitle') }}</h5>
          <div class="meeting-modal__header-actions">
            <CButton
              v-if="isEditMode && selectedMeeting && meetingForm && meetingForm.status === 'scheduled'"
              size="sm"
              color="danger"
              variant="outline"
              class="meeting-modal__cancel-meeting"
              @click="cancelMeeting"
            >
              <CIcon name="cil-ban" width="16" class="mr-1 icon-bold" aria-hidden="true" />
              {{ $t('adminMeetings.modal.cancelMeeting') }}
            </CButton>
            <button type="button" class="close" :aria-label="$t('adminMeetings.modal.close')" @click="closeMeetingModal">
              <CIcon name="cil-x" />
            </button>
          </div>
        </div>
      </template>
      <template #body-wrapper>
        <div class="meeting-form">
          <div class="field full-field">
            <label class="form-label mt-3">{{ $t('adminMeetings.modal.relatedProposal') }} <span class="required">*</span></label>
            <multiselect v-model="selectedProposalOption" :options="proposalOptions" :searchable="true"
              :clear-on-select="false" :close-on-select="true" :preserve-search="true" :allow-empty="true"
              :loading="proposalOptionsLoading" label="searchText" track-by="_id"
              :placeholder="$t('adminMeetings.modal.proposalPlaceholder')" :custom-label="formatProposalTitle" @input="onProposalSelected">
              <template slot="singleLabel" slot-scope="{ option }">
                <span>{{ formatProposalTitle(option) }}</span>
              </template>
              <template slot="option" slot-scope="{ option }">
                <div>
                  <div class="font-weight-bold">{{ getProposalDisplayTitle(option) || '-' }}</div>
                  <div v-if="getProposalLeaderName(option)" class="text-muted small">
                    {{ $t('adminMeetings.modal.projectLeader') }}: {{ getProposalLeaderName(option) }}
                  </div>
                </div>
              </template>
            </multiselect>
            <small class="text-muted d-block mt-1">{{ $t('adminMeetings.modal.proposalStatusHint') }}</small>
            <small v-if="proposalOptionsError" class="text-warning d-block mt-1">{{ $t('adminMeetings.modal.proposalLoadError', { error: proposalOptionsError }) }}</small>
          </div>
          <div class="field full-field">
            <label class="form-label">{{ $t('adminMeetings.modal.participants') }}</label>
            <multiselect v-model="selectedParticipantOptions" :options="participantOptions" :searchable="true"
              :multiple="true" :close-on-select="false" :clear-on-select="false" :preserve-search="true"
              :allow-empty="true" :loading="participantOptionsLoading" label="searchText" track-by="_id"
              :placeholder="$t('adminMeetings.modal.participantsPlaceholder')" :custom-label="formatParticipantLabel">
              <template slot="option" slot-scope="{ option }">
                <div>
                  <div class="font-weight-bold">{{ option.fullName || '-' }}</div>
                  <small class="text-muted">{{ option.email || '' }}</small>
                </div>
              </template>
            </multiselect>
            <small v-if="participantOptionsError" class="text-warning d-block mt-1">{{ $t('adminMeetings.modal.participantsLoadError', { error: participantOptionsError }) }}</small>
          </div>
          <div class="field full-field">
            <label class="form-label">{{ $t('adminMeetings.modal.meetingTitle') }} <span class="required">*</span></label>
            <CInput class="full" :placeholder="$t('adminMeetings.modal.meetingTitlePlaceholder')" v-model="meetingForm.title" />
          </div>

          <div class="small-row">
            <div class="field small-field">
              <label class="form-label">{{ $t('adminMeetings.modal.meetingDate') }} <span class="required">*</span></label>
              <v-date-picker v-model="meetingDatePickerValue" :min-date="enforceMinDateTime ? minMeetingDateObj : null"
                :popover="{ visibility: 'focus', placement: 'bottom-start' }">
                <template #default="{ inputValue, inputEvents }">
                  <div class="input-icon__wrap" data-tone="primary">
                    <input ref="meetingDateInput" class="form-control input-icon__control"
                      :value="meetingDatePickerValue ? formatDateExampleShort(meetingDatePickerValue) : ''"
                      v-on="inputEvents" readonly :placeholder="$t('adminMeetings.modal.meetingDatePlaceholder')">
                    <button type="button" class="input-icon__suffix" @mousedown.prevent
                      @click="focusPicker('meetingDateInput')">
                      <CIcon name="cil-calendar" width="16" class="input-icon__ic" aria-hidden="true" />
                    </button>
                  </div>
                </template>
              </v-date-picker>
              <small v-if="meetingDatePickerValue" class="text-muted d-block mt-1">{{
                formatLocaleDateBelow(meetingDatePickerValue)
              }}</small>
            </div>
            <div class="field small-field">
              <label class="form-label">{{ $t('adminMeetings.modal.startTime') }} <span class="required">*</span></label>
              <div class="input-icon__wrap" data-tone="primary">
                <input ref="startTimeTrigger" class="form-control input-icon__control time-trigger" type="text"
                  :value="meetingForm.startTime ? formatTimeDisplay(meetingForm.startTime) : ''"
                  :placeholder="$t('adminMeetings.modal.startTimePlaceholder')" readonly @click="toggleTimeDropdown('start')" />
                <button type="button" class="input-icon__suffix" @mousedown.prevent
                  @click="toggleTimeDropdown('start')">
                  <CIcon name="cil-clock" width="16" class="input-icon__ic" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div class="field small-field">
              <label class="form-label">{{ $t('adminMeetings.modal.endTime') }}</label>
              <div class="input-icon__wrap" data-tone="primary">
                <input ref="endTimeTrigger" class="form-control input-icon__control time-trigger" type="text"
                  :value="meetingForm.endTime ? formatTimeDisplay(meetingForm.endTime) : ''"
                  :placeholder="meetingForm.startTime ? '-' : $t('adminMeetings.modal.endTimePlaceholder')" readonly
                  :disabled="!meetingForm.startTime" @click="toggleTimeDropdown('end')" />
                <button type="button" class="input-icon__suffix" @mousedown.prevent :disabled="!meetingForm.startTime"
                  @click="toggleTimeDropdown('end')">
                  <CIcon name="cil-clock" width="16" class="input-icon__ic" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div class="field full-field">
            <label class="form-label">{{ $t('adminMeetings.modal.meetingType') }}</label>
            <div class="meeting-type-toggle" role="radiogroup" :aria-label="$t('adminMeetings.modal.meetingType')">
              <input id="meeting-type-online" class="meeting-type-toggle__input" type="radio" value="online"
                v-model="meetingForm.meetingType">
              <label class="meeting-type-toggle__label" for="meeting-type-online">{{ $t('userMeetings.card.modeOnline') }}</label>
              <input id="meeting-type-onsite" class="meeting-type-toggle__input" type="radio" value="onsite"
                v-model="meetingForm.meetingType">
              <label class="meeting-type-toggle__label" for="meeting-type-onsite">{{ $t('userMeetings.card.modeOnsite') }}</label>
            </div>
          </div>

          <div class="field full-field">
            <label class="form-label">{{ $t('adminMeetings.modal.location') }} <span v-if="meetingForm.meetingType === 'onsite'"
                class="required">*</span></label>
            <input type="text" class="form-control full" v-model="meetingForm.location"
              :disabled="meetingForm.meetingType === 'online'"
              :placeholder="meetingForm.meetingType === 'online' ? $t('adminMeetings.modal.locationOnlinePlaceholder') : $t('adminMeetings.modal.locationOnsitePlaceholder')" />
          </div>

          <div class="field full-field">
            <label class="form-label">{{ $t('adminMeetings.modal.videoLink') }} <span v-if="meetingForm.meetingType === 'online'"
                class="required">*</span></label>
            <CInput class="full" type="url" :placeholder="$t('adminMeetings.modal.videoLinkPlaceholder')"
              v-model="meetingForm.videoLink" />
          </div>

          <div class="field full-field">
            <label class="form-label">{{ $t('adminMeetings.modal.agenda') }}</label>
            <CTextarea class="full" rows="4" :placeholder="$t('adminMeetings.modal.agendaPlaceholder')"
              v-model="meetingForm.agenda" />
          </div>
        </div>
      </template>

      <template #footer-wrapper>
        <div class="d-flex justify-content-end w-100 modal-actions-wrapper">
          <CButton color="secondary" class="mr-3 floating-action btn-cancel" @click="closeMeetingModal"><CIcon name="cil-x" class="mr-1" /> {{ $t('adminMeetings.modal.cancel') }}</CButton>
          <CButton color="primary" class="floating-action btn-save" :disabled="savingMeeting" @click="saveMeeting">
            <CIcon name="cil-save" class="mr-1" /> {{ savingMeeting ? $t('adminMeetings.modal.saving') : $t('adminMeetings.modal.save') }}
          </CButton>
        </div>
      </template>
    </CModal>

    <div v-if="canCreate && timeDropdown.openFor" class="time-picker__backdrop" @mousedown="closeTimeDropdown"></div>
    <div v-if="canCreate && timeDropdown.openFor" class="time-picker" ref="timeDropdownPanel" role="dialog" aria-modal="true"
      :aria-label="timeDropdown.openFor === 'start' ? $t('adminMeetings.timePicker.selectStart') : $t('adminMeetings.timePicker.selectEnd')" :style="{
        top: timeDropdown.top + 'px',
        left: timeDropdown.left + 'px',
        width: timeDropdown.width + 'px'
      }" @mousedown.stop>
      <div class="time-picker__wheels">
        <div class="time-picker__wheel">
          <button type="button" class="time-picker__arrow" :aria-label="$t('adminMeetings.timePicker.incHour')" @click="stepTimePicker('hour', 1)">
            <CIcon name="cil-chevron-top" width="18" />
          </button>
          <div class="time-picker__digit-window">
            <transition :name="`digit-slide-${timeDropdown.hourAnim}`" mode="out-in">
              <span :key="`hour-${timeDropdown.hour}`" class="time-picker__digit">{{ displayTimePickerHour }}</span>
            </transition>
          </div>
          <button type="button" class="time-picker__arrow" :aria-label="$t('adminMeetings.timePicker.decHour')" @click="stepTimePicker('hour', -1)">
            <CIcon name="cil-chevron-bottom" width="18" />
          </button>
        </div>
        <div class="time-picker__separator" aria-hidden="true">:</div>
        <div class="time-picker__wheel">
          <button type="button" class="time-picker__arrow" :aria-label="$t('adminMeetings.timePicker.incMinute')" @click="stepTimePicker('minute', 1)">
            <CIcon name="cil-chevron-top" width="18" />
          </button>
          <div class="time-picker__digit-window">
            <transition :name="`digit-slide-${timeDropdown.minuteAnim}`" mode="out-in">
              <span :key="`minute-${timeDropdown.minute}`" class="time-picker__digit">{{ displayTimePickerMinute }}</span>
            </transition>
          </div>
          <button type="button" class="time-picker__arrow" :aria-label="$t('adminMeetings.timePicker.decMinute')" @click="stepTimePicker('minute', -1)">
            <CIcon name="cil-chevron-bottom" width="18" />
          </button>
        </div>
      </div>
      <div class="time-picker__period-row">
        <button type="button" class="time-picker__period-btn" :class="{ 'is-active': timeDropdown.period === 'AM' }"
          @click="setTimePickerPeriod('AM')">AM</button>
        <button type="button" class="time-picker__period-btn" :class="{ 'is-active': timeDropdown.period === 'PM' }"
          @click="setTimePickerPeriod('PM')">PM</button>
      </div>
    </div>

    <CModal :show.sync="showMinutesModal" :close-on-backdrop="false" centered size="xl" class="minutes-modal"
      :title="`${readOnly ? $t('adminMeetings.minutes.detailTitle') : $t('adminMeetings.minutes.saveTitle')} — ${minutesMeeting ? (minutesMeeting.title || '-') : '-'}`">
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
            <div class="minutes-panel__title">{{ $t('adminMeetings.minutes.minutes') }}</div>
            <CTextarea rows="6" :placeholder="$t('adminMeetings.minutes.minutesPlaceholder')" v-model="minutesForm.minutes"
              :disabled="isReadOnly(minutesMeeting)" />
          </div>

          <div class="minutes-panel">
            <div class="minutes-panel__title">{{ $t('adminMeetings.minutes.resolutions') }}</div>
            <CTextarea rows="6" :placeholder="$t('adminMeetings.minutes.resolutionsPlaceholder')" v-model="minutesForm.decisions"
              :disabled="isReadOnly(minutesMeeting)" />
          </div>

          <div class="minutes-action full">
            <div class="minutes-action__header">
              <div class="minutes-action__title">{{ $t('adminMeetings.minutes.actionItems') }}</div>
            </div>
            <div class="table-responsive minutes-action__table">
              <table class="table table-bordered table-sm mb-0">
                <thead>
                  <tr>
                    <th>{{ $t('adminMeetings.minutes.task') }}</th>
                    <th>{{ $t('adminMeetings.minutes.assignee') }}</th>
                    <th>{{ $t('adminMeetings.minutes.dueDate') }}</th>
                    <th style="width: 60px;">#</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in minutesForm.actionItems" :key="index">
                    <td><CInput v-model="item.task" :disabled="isReadOnly(minutesMeeting)" /></td>
                    <td><CInput v-model="item.assignee" :disabled="isReadOnly(minutesMeeting)" /></td>
                    <td><CInput type="date" v-model="item.deadline" :disabled="isReadOnly(minutesMeeting)" /></td>
                    <td>
                      <CButton size="sm" color="danger" :disabled="isReadOnly(minutesMeeting)" class="minutes-action__remove"
                        @click="removeActionItem(index)" :aria-label="$t('adminMeetings.minutes.remove')">
                        <CIcon name="cil-trash" width="14" aria-hidden="true" />
                      </CButton>
                    </td>
                  </tr>
                  <tr v-if="minutesForm.actionItems.length === 0">
                    <td colspan="4" class="text-center text-muted">{{ $t('adminMeetings.minutes.empty') }}</td>
                  </tr>
                  <tr v-if="!isReadOnly(minutesMeeting)" class="minutes-action__add-row">
                    <td colspan="4">
                      <button type="button" class="minutes-action__add-btn" @click="addActionItem">
                        <CIcon name="cil-plus" width="16" class="minutes-action__add-ic" aria-hidden="true" />
                        {{ $t('adminMeetings.minutes.add') }}
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
          <CButton color="secondary" class="mr-2 floating-action btn-cancel" @click="closeMinutesModal"><CIcon name="cil-x" class="mr-1" /> {{ $t('adminMeetings.modal.cancel') }}</CButton>
          <CButton v-if="!isReadOnly(minutesMeeting)" color="primary" class="floating-action btn-save"
            :disabled="savingMinutes" @click="saveMinutes">
            <CIcon name="cil-save" class="mr-1" /> {{ savingMinutes ? $t('adminMeetings.modal.saving') : $t('userMeetings.actions.saveResult') }}
          </CButton>
        </div>
      </template>
    </CModal>
    <div class="admin-meetings-loading-layer">
      <CenterLoading />
    </div>
  </div>
</template>

<script>
import { instance as axios } from '@/service/api'
import Swal from 'sweetalert2'
import Multiselect from 'vue-multiselect'
import { DatePicker } from 'v-calendar'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import CenterLoading from '@/projects/components/dialog/CenterLoading.vue'

const MEETING_STATUS = {
  scheduled: { label: 'กำหนดการแล้ว', color: 'info' },
  completed: { label: 'เสร็จสิ้น', color: 'success' },
  cancelled: { label: 'ยกเลิก', color: 'danger' }
}

const ALLOWED_MEETING_PROPOSAL_STATUSES = ['office_received', 'meeting_completed']
const MEETING_MANAGED_PROPOSAL_STATUS = 'meeting_in_progress'

const BASE_MEETING_START_TIME = '06:00'

export default {
  name: 'AdminMeetings',
  props: {
    readOnly: { type: Boolean, default: false },
    readOnlyCtaTone: { type: String, default: 'dark', validator: (value) => ['soft', 'dark'].includes(value) },
    myOnly: { type: Boolean, default: false },
    heroEyebrow: { type: String, default: '' },
    heroTitle: { type: String, default: '' },
    heroSubtitle: { type: String, default: '' }
  },
  components: { Multiselect, 'v-date-picker': DatePicker, CenterLoading },
  data() {
    return {
      meetings: [], total: 0, page: 1, totalPages: 1, limit: 9,
      loading: false, filterStatus: '', searchKeyword: '', searchDebounceTimer: null,
      summaryCounts: { scheduled: 0, completed: 0, cancelled: 0, total: 0 },
      summaryCountsLoading: false,
      showMeetingModal: false, isEditMode: false, selectedMeeting: null,
      selectedMeetingForActions: null, selectionMode: false,
      pendingProposalIds: [], pendingProjectTitle: '',
      proposalOptions: [], proposalOptionsLoading: false, proposalOptionsError: null,
      selectedProposalOption: null, autoProjectTitle: '',
      participantOptions: [], participantOptionsLoading: false, participantOptionsError: null,
      pendingParticipantIds: [], selectedParticipantOptions: [],
      savingMeeting: false,
      deletingMeeting: false,
      meetingForm: { title: '', meetingDate: '', startTime: '', endTime: '', meetingType: 'online', location: '', videoLink: '', agenda: '', status: 'scheduled' },
      showMinutesModal: false, minutesMeeting: null, savingMinutes: false,
      minutesForm: { minutes: '', decisions: '', actionItems: [] },
      timeDropdown: {
        openFor: null,
        top: 0,
        left: 0,
        width: 160,
        hour: '',
        minute: '00',
        period: 'AM',
        hourAnim: 'up',
        minuteAnim: 'up'
      },
      titleTooltip: { openForId: null, closeTimer: null },
      metaTooltip: { openKey: null, text: '', closeTimer: null }
    }
  },
  computed: {
    currentUser() {
      try { const raw = localStorage.getItem('auth_user'); return raw ? JSON.parse(raw) : null } catch (e) { return null }
    },
    currentUserId() { const user = this.currentUser; return user && user._id ? String(user._id) : '' },
    currentUserRole() { const user = this.currentUser || {}; return String(user.role || '').trim().toLowerCase() },
    currentUserName() { const user = this.currentUser || {}; return String(user.fullName || user.name || user.displayName || user.username || '').trim() },
    currentUserEmail() { const user = this.currentUser || {}; return String(user.email || '').trim() },
    applyMyOnlyFilter() {
      return Boolean(this.myOnly && this.currentUserRole === 'committee' && (this.currentUserId || this.currentUserName || this.currentUserEmail))
    },
    isEnglish() { return String((this.$i18n && this.$i18n.locale) || '').trim().toLowerCase() === 'en' },
    resolvedHeroEyebrow() { return (this.heroEyebrow && String(this.heroEyebrow).trim()) ? this.heroEyebrow : this.$t('adminMeetings.hero.eyebrow') },
    resolvedHeroTitle() { return (this.heroTitle && String(this.heroTitle).trim()) ? this.heroTitle : this.$t('adminMeetings.hero.title') },
    resolvedHeroSubtitle() { return (this.heroSubtitle && String(this.heroSubtitle).trim()) ? this.heroSubtitle : this.$t('adminMeetings.hero.subtitle') },
    canCreate() { return !this.readOnly },
    canEditDelete() { return !this.readOnly },
    meetingDatePickerValue: {
      get() { return this.parseLocalYmd(this.meetingForm && this.meetingForm.meetingDate ? this.meetingForm.meetingDate : '') },
      set(val) { this.meetingForm.meetingDate = val ? this.formatYmd(val) : '' }
    },
    enforceMinDateTime() { return this.meetingForm && this.meetingForm.status === 'scheduled' },
    minMeetingDateObj() { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
    minStartTime() {
      const selected = this.parseLocalYmd(this.meetingForm && this.meetingForm.meetingDate ? this.meetingForm.meetingDate : '')
      const baseMinutes = this.timeToMinutes(BASE_MEETING_START_TIME)
      if (!selected) return BASE_MEETING_START_TIME
      const today = new Date()
      const sameDay = selected.getFullYear() === today.getFullYear() && selected.getMonth() === today.getMonth() && selected.getDate() === today.getDate()
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
      return this.buildTimeOptions({ min: this.enforceMinDateTime ? this.minStartTime : BASE_MEETING_START_TIME, step: 15, includeEmpty: false, formatLabel: (value) => this.formatTime12h(value) })
    },
    endTimeOptions() {
      const start = this.meetingForm && this.meetingForm.startTime ? String(this.meetingForm.startTime) : ''
      return this.buildTimeOptions({
        min: this.minEndTime, step: 15, includeEmpty: true,
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
    },
    displayTimePickerHour() {
      const hour = parseInt(String(this.timeDropdown && this.timeDropdown.hour ? this.timeDropdown.hour : '').trim(), 10)
      return Number.isFinite(hour) ? String(hour) : '--'
    },
    displayTimePickerMinute() {
      const minute = parseInt(String(this.timeDropdown && this.timeDropdown.minute ? this.timeDropdown.minute : '0').trim(), 10)
      return Number.isFinite(minute) ? String(Math.max(0, Math.min(59, minute))).padStart(2, '0') : '00'
    },
    isButtonActionLoading() {
      return Boolean(
        this.savingMeeting ||
        this.savingMinutes ||
        this.deletingMeeting
      )
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
  beforeDestroy() {
    this.closeTimeDropdown()
    this.closeTitleTooltip()
    this.closeMetaTooltip()
    this.setCenterLoading(false)
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer)
  },
  watch: {
    isButtonActionLoading: {
      immediate: true,
      handler(next) {
        this.setCenterLoading(next)
      }
    },
    '$route.query'() { if (!this.readOnly) this.consumeProposalContext() },
    'meetingForm.meetingType'(next) { if (next === 'online') this.meetingForm.location = '' },
    'meetingForm.meetingDate'() {
      if (!this.enforceMinDateTime) return
      if (this.meetingForm && this.meetingForm.startTime && this.meetingForm.startTime < this.minStartTime) this.meetingForm.startTime = ''
      if (this.meetingForm && this.meetingForm.endTime && this.meetingForm.endTime < this.minEndTime) this.meetingForm.endTime = ''
    },
    'meetingForm.startTime'(next) {
      if (!next) return
      if (this.enforceMinDateTime && next < this.minStartTime) { this.meetingForm.startTime = ''; return }
      if (this.meetingForm && this.meetingForm.endTime && this.meetingForm.endTime < next) this.meetingForm.endTime = ''
    }
  },
  methods: {
    setCenterLoading(enabled) {
      if (!this.$store || typeof this.$store.commit !== 'function') return
      this.$store.commit('dialog/loading', Boolean(enabled))
    },
    normalizeText(value) { return String(value || '').trim().toLowerCase() },
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
      const maybeParticipants = meeting.participants || meeting.participantUsers || meeting.participantDetails || meeting.participantList || meeting.participantNames || []
      const hay = []
      if (Array.isArray(maybeParticipants)) {
        maybeParticipants.forEach(p => {
          if (!p) return
          if (typeof p === 'string') { hay.push(p); return }
          if (typeof p === 'object') hay.push(p.fullName, p.name, p.displayName, p.username, p.email)
        })
      } else if (typeof maybeParticipants === 'string') { hay.push(maybeParticipants) }
      const joined = this.normalizeText(hay.filter(Boolean).join(' '))
      if (!joined) return false
      if (userEmail && joined.includes(userEmail)) return true
      if (userName && joined.includes(userName)) return true
      return false
    },
    formatLocaleDateBelow(date) {
      const d = date instanceof Date ? date : new Date(date)
      if (Number.isNaN(d.getTime())) return ''
      const locale = this.isEnglish ? 'en-GB' : 'th-TH'
      try { return d.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) } catch (err) { return this.formatDateExampleShort(d) }
    },
    formatDateExampleShort(date) {
      const d = date instanceof Date ? date : new Date(date)
      if (Number.isNaN(d.getTime())) return ''
      try {
        const locale = this.isEnglish ? 'en-GB' : 'th-TH'
        const parts = new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' }).formatToParts(d)
        const weekday = (parts.find(p => p.type === 'weekday') || {}).value || ''
        const day = (parts.find(p => p.type === 'day') || {}).value || ''
        const month = (parts.find(p => p.type === 'month') || {}).value || ''
        const w = weekday ? `${weekday.replace(/\s+/g, '')},` : ''
        return `${w} ${day} ${month}`.trim()
      } catch (err) {
        if (this.isEnglish) return d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })
        const thaiWeekdays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']
        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
        return `${thaiWeekdays[d.getDay()] || ''}, ${String(d.getDate())} ${thaiMonths[d.getMonth()] || ''}`.trim()
      }
    },
    focusPicker(refName) {
      this.$nextTick(() => {
        const el = this.$refs && this.$refs[refName] ? this.$refs[refName] : null
        if (!el) return
        try { el.focus && el.focus(); el.click && el.click() } catch (err) { void err }
      })
    },
    timeToPickerParts(hhmm) {
      const mins = this.timeToMinutes(hhmm)
      if (!Number.isFinite(mins)) return { hour: '', minute: '00', period: 'AM' }
      const hour24 = Math.floor(mins / 60)
      const minute = mins % 60
      const period = hour24 >= 12 ? 'PM' : 'AM'
      let hour12 = hour24 % 12
      if (hour12 === 0) hour12 = 12
      return { hour: String(hour12).padStart(2, '0'), minute: String(minute).padStart(2, '0'), period }
    },
    pickerPartsToTime(hourValue, minuteValue, periodValue) {
      const hourRaw = String(hourValue || '').trim()
      const minuteRaw = String(minuteValue || '').trim()
      const period = String(periodValue || '').toUpperCase() === 'PM' ? 'PM' : 'AM'
      let hour = parseInt(hourRaw, 10)
      let minute = parseInt(minuteRaw, 10)
      if (!Number.isFinite(hour)) return ''
      if (!Number.isFinite(minute)) minute = 0
      hour = Math.max(1, Math.min(12, hour))
      minute = Math.max(0, Math.min(59, minute))
      const hour24 = (hour % 12) + (period === 'PM' ? 12 : 0)
      return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    },
    formatTimeDisplay(hhmm) { return this.formatTime12h(hhmm) },
    formatTimeMeridiemDisplay(hhmm) { return this.formatTimeDisplay(hhmm) },
    setTimePickerPeriod(period) {
      const nextPeriod = String(period || '').toUpperCase() === 'PM' ? 'PM' : 'AM'
      if (this.timeDropdown.period === nextPeriod) return
      this.timeDropdown.period = nextPeriod
      this.applyTimePickerValue()
    },
    normalizeTimePickerFields() {
      let hour = parseInt(String(this.timeDropdown.hour || '').trim(), 10)
      let minute = parseInt(String(this.timeDropdown.minute || '').trim(), 10)
      if (!Number.isFinite(hour)) hour = 12
      if (!Number.isFinite(minute)) minute = 0
      hour = Math.max(1, Math.min(12, hour))
      minute = Math.max(0, Math.min(59, minute))
      this.timeDropdown.hour = String(hour).padStart(2, '0')
      this.timeDropdown.minute = String(minute).padStart(2, '0')
    },
    stepTimePicker(unit, delta) {
      if (!this.timeDropdown.openFor) return
      const step = delta >= 0 ? 1 : -1
      if (unit === 'hour') {
        let hour = parseInt(String(this.timeDropdown.hour || '').trim(), 10)
        if (!Number.isFinite(hour)) hour = 12
        hour = ((hour - 1 + step + 12) % 12) + 1
        this.timeDropdown.hour = String(hour).padStart(2, '0')
        this.timeDropdown.hourAnim = step > 0 ? 'up' : 'down'
      } else if (unit === 'minute') {
        let minute = parseInt(String(this.timeDropdown.minute || '').trim(), 10)
        if (!Number.isFinite(minute)) minute = 0
        minute = (minute + step + 60) % 60
        this.timeDropdown.minute = String(minute).padStart(2, '0')
        this.timeDropdown.minuteAnim = step > 0 ? 'up' : 'down'
      }
      this.applyTimePickerValue()
    },
    applyTimePickerValue() {
      if (!this.timeDropdown.openFor) return
      this.normalizeTimePickerFields()
      let nextValue = this.pickerPartsToTime(this.timeDropdown.hour, this.timeDropdown.minute, this.timeDropdown.period)
      if (!nextValue) return
      if (this.timeDropdown.openFor === 'start') {
        const minStart = this.enforceMinDateTime ? this.minStartTime : BASE_MEETING_START_TIME
        if (Number.isFinite(this.timeToMinutes(minStart)) && this.timeToMinutes(nextValue) < this.timeToMinutes(minStart)) nextValue = minStart
        this.meetingForm.startTime = nextValue
        if (this.meetingForm && this.meetingForm.endTime && this.timeToMinutes(this.meetingForm.endTime) < this.timeToMinutes(nextValue)) this.meetingForm.endTime = ''
        const adjusted = this.timeToPickerParts(this.meetingForm.startTime)
        this.timeDropdown.hour = adjusted.hour
        this.timeDropdown.minute = adjusted.minute
        this.timeDropdown.period = adjusted.period
      } else if (this.timeDropdown.openFor === 'end') {
        const minEnd = this.minEndTime
        if (Number.isFinite(this.timeToMinutes(minEnd)) && this.timeToMinutes(nextValue) < this.timeToMinutes(minEnd)) nextValue = minEnd
        this.meetingForm.endTime = nextValue
        const adjusted = this.timeToPickerParts(this.meetingForm.endTime)
        this.timeDropdown.hour = adjusted.hour
        this.timeDropdown.minute = adjusted.minute
        this.timeDropdown.period = adjusted.period
      }
    },
    toggleTimeDropdown(kind) {
      if (kind === 'end' && !(this.meetingForm && this.meetingForm.startTime)) return
      if (this.timeDropdown.openFor === kind) { this.closeTimeDropdown(); return }
      this.openTimeDropdown(kind)
    },
    openTimeDropdown(kind) {
      const refName = kind === 'start' ? 'startTimeTrigger' : 'endTimeTrigger'
      const currentValue = kind === 'start'
        ? (this.meetingForm && this.meetingForm.startTime ? String(this.meetingForm.startTime) : '')
        : (this.meetingForm && this.meetingForm.endTime ? String(this.meetingForm.endTime) : '')
      const fallback = kind === 'start'
        ? (this.enforceMinDateTime ? this.minStartTime : BASE_MEETING_START_TIME)
        : this.minEndTime
      const seed = currentValue || fallback || BASE_MEETING_START_TIME
      const picker = this.timeToPickerParts(seed)
      this.$nextTick(() => {
        const el = this.$refs && this.$refs[refName] ? this.$refs[refName] : null
        if (!el) return
        const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null
        const width = 164
        const padding = 10
        const top = rect ? Math.max(8, Math.min(window.innerHeight - 220, rect.bottom + 6)) : 8
        const left = rect
          ? Math.max(padding, Math.min(rect.left, window.innerWidth - width - padding))
          : padding
        this.timeDropdown = {
          openFor: kind,
          top,
          left,
          width,
          hour: picker.hour,
          minute: picker.minute,
          period: picker.period,
          hourAnim: 'up',
          minuteAnim: 'up'
        }
        document.addEventListener('keydown', this.onTimeDropdownKeydown)
        document.addEventListener('scroll', this.onTimeDropdownScroll, true)
        window.addEventListener('resize', this.onTimeDropdownViewportChange, { once: true })
      })
    },
    onTimeDropdownKeydown(e) {
      if (!e) return
      if (e.key === 'Escape') this.closeTimeDropdown()
      if (e.key === 'ArrowUp') { e.preventDefault(); this.stepTimePicker('minute', 1) }
      if (e.key === 'ArrowDown') { e.preventDefault(); this.stepTimePicker('minute', -1) }
      if (e.key === 'PageUp') { e.preventDefault(); this.stepTimePicker('hour', 1) }
      if (e.key === 'PageDown') { e.preventDefault(); this.stepTimePicker('hour', -1) }
      if (e.key === 'Enter') this.closeTimeDropdown()
    },
    onTimeDropdownViewportChange() { this.closeTimeDropdown() },
    onTimeDropdownScroll(e) {
      const panel = this.$refs && this.$refs.timeDropdownPanel ? this.$refs.timeDropdownPanel : null
      const target = e && e.target ? e.target : null
      if (panel && target && (target === panel || panel.contains(target))) return
      this.closeTimeDropdown()
    },
    closeTimeDropdown() {
      if (!this.timeDropdown.openFor) return
      this.timeDropdown = {
        openFor: null,
        top: 0,
        left: 0,
        width: 160,
        hour: '',
        minute: '00',
        period: 'AM',
        hourAnim: 'up',
        minuteAnim: 'up'
      }
      document.removeEventListener('keydown', this.onTimeDropdownKeydown)
      document.removeEventListener('scroll', this.onTimeDropdownScroll, true)
      window.removeEventListener('resize', this.onTimeDropdownViewportChange)
    },
    isTitleTooltipOpen(meeting) {
      const id = meeting && meeting._id ? String(meeting._id) : ''
      return !!id && this.titleTooltip && String(this.titleTooltip.openForId || '') === id
    },
    isTitleTruncated(el) {
      if (!el) return false
      try { return (el.scrollWidth || 0) > ((el.clientWidth || 0) + 1) } catch (e) { return false }
    },
    maybeOpenTitleTooltip(event, meeting) {
      const el = event && event.currentTarget ? event.currentTarget : null
      if (!this.isTitleTruncated(el)) { this.closeTitleTooltip(); return }
      this.openTitleTooltip(meeting)
    },
    openTitleTooltip(meeting, { autoCloseMs = 0, attachOutsideClick = false } = {}) {
      const id = meeting && meeting._id ? String(meeting._id) : ''
      if (!id || !this.titleTooltip) return
      if (this.titleTooltip.closeTimer) clearTimeout(this.titleTooltip.closeTimer)
      this.titleTooltip.openForId = id; this.titleTooltip.closeTimer = null
      if (attachOutsideClick) { this.$nextTick(() => { setTimeout(() => { document.addEventListener('click', this.closeTitleTooltip, { once: true }) }, 0) }) }
      const ms = parseInt(autoCloseMs, 10)
      if (Number.isFinite(ms) && ms > 0) { this.titleTooltip.closeTimer = setTimeout(() => { this.closeTitleTooltip() }, ms) }
    },
    closeTitleTooltip() {
      if (!this.titleTooltip) return
      if (this.titleTooltip.closeTimer) clearTimeout(this.titleTooltip.closeTimer)
      this.titleTooltip.openForId = null; this.titleTooltip.closeTimer = null
    },
    toggleTitleTooltip(event, meeting) {
      const el = event && event.currentTarget ? event.currentTarget : null
      if (!this.isTitleTruncated(el)) return
      const id = meeting && meeting._id ? String(meeting._id) : ''
      if (!id) return
      if (this.titleTooltip && String(this.titleTooltip.openForId || '') === id) { this.closeTitleTooltip(); return }
      this.closeTitleTooltip(); this.openTitleTooltip(meeting, { autoCloseMs: 2600, attachOutsideClick: true })
    },
    isMetaTruncated(rootEl) {
      if (!rootEl || !rootEl.querySelectorAll) return false
      const nodes = rootEl.querySelectorAll('.text-value, .small, .meeting-card__datetime-value, .meeting-card__datetime-label')
      if (!nodes || !nodes.length) return false
      try { return Array.from(nodes).some(el => (el.scrollWidth || 0) > ((el.clientWidth || 0) + 1)) } catch (e) { return false }
    },
    isMetaTooltipOpen(key) { const k = String(key || ''); return !!k && this.metaTooltip && String(this.metaTooltip.openKey || '') === k },
    closeMetaTooltip() {
      if (!this.metaTooltip) return
      if (this.metaTooltip.closeTimer) clearTimeout(this.metaTooltip.closeTimer)
      this.metaTooltip.openKey = null; this.metaTooltip.text = ''; this.metaTooltip.closeTimer = null
    },
    openMetaTooltip(key, text, { autoCloseMs = 0, attachOutsideClick = false } = {}) {
      const k = String(key || '')
      if (!k || !this.metaTooltip) return
      if (this.metaTooltip.closeTimer) clearTimeout(this.metaTooltip.closeTimer)
      this.metaTooltip.openKey = k; this.metaTooltip.text = String(text || ''); this.metaTooltip.closeTimer = null
      window.addEventListener('resize', this.closeMetaTooltip, { once: true })
      if (attachOutsideClick) { this.$nextTick(() => { setTimeout(() => { document.addEventListener('click', this.closeMetaTooltip, { once: true }) }, 0) }) }
      const ms = parseInt(autoCloseMs, 10)
      if (Number.isFinite(ms) && ms > 0) { this.metaTooltip.closeTimer = setTimeout(() => { this.closeMetaTooltip() }, ms) }
    },
    maybeOpenMetaTooltip(event, key, text) {
      const rootEl = event && event.currentTarget ? event.currentTarget : null
      if (!this.isMetaTruncated(rootEl)) { this.closeMetaTooltip(); return }
      this.openMetaTooltip(key, text)
    },
    toggleMetaTooltip(event, key, text) {
      const rootEl = event && event.currentTarget ? event.currentTarget : null
      if (!this.isMetaTruncated(rootEl)) return
      if (this.isMetaTooltipOpen(key)) { this.closeMetaTooltip(); return }
      this.closeMetaTooltip(); this.openMetaTooltip(key, text, { autoCloseMs: 2600, attachOutsideClick: true })
    },
    formatYmd(d) {
      const date = d instanceof Date ? d : new Date(d)
      if (Number.isNaN(date.getTime())) return ''
      const y = String(date.getFullYear()).padStart(4, '0'); const m = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    },
    timeToMinutes(hhmm) {
      const str = String(hhmm || '').trim(); const [hhRaw, mmRaw] = str.split(':')
      const hh = parseInt(hhRaw, 10); const mm = parseInt(mmRaw, 10)
      if (Number.isNaN(hh) || Number.isNaN(mm)) return NaN
      return (hh * 60) + mm
    },
    minutesToTime(minutes) {
      const mins = Math.max(0, Math.min(23 * 60 + 59, parseInt(minutes, 10) || 0))
      return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
    },
    ceilMinutesToStep(minutes, step) {
      const m = parseInt(minutes, 10); const s = Math.max(parseInt(step, 10) || 1, 1)
      if (Number.isNaN(m)) return 0
      return Math.min(23 * 60 + 59, Math.ceil(m / s) * s)
    },
    buildTimeOptions({ min = '00:00', step = 5, includeEmpty = false, formatLabel = null } = {}) {
      const minMinutes = this.timeToMinutes(min); const start = Number.isFinite(minMinutes) ? this.ceilMinutesToStep(minMinutes, step) : 0
      const options = []
      if (includeEmpty) options.push({ value: '', label: '-' })
      for (let m = start; m <= (23 * 60 + 59); m += step) {
        const value = this.minutesToTime(m); const label = typeof formatLabel === 'function' ? formatLabel(value) : value
        options.push({ value, label })
      }
      return options
    },
    formatTime12h(hhmm) {
      const minutes = this.timeToMinutes(hhmm)
      if (!Number.isFinite(minutes)) return String(hhmm || '')
      const base = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
      return this.isEnglish ? base : `${base}น.`
    },
    formatDuration(minutes) {
      const mins = parseInt(minutes, 10)
      if (!Number.isFinite(mins) || mins <= 0) return ''
      if (mins < 60) return this.isEnglish ? `${mins} min` : `${mins} นาที`
      const hrs = Math.floor(mins / 60); const rem = mins % 60
      if (rem === 0) return this.isEnglish ? `${hrs} h` : `${hrs} ชม.`
      return this.isEnglish ? `${hrs} h ${rem} min` : `${hrs} ชม. ${rem} นาที`
    },
    parseLocalYmd(ymd) {
      if (!ymd) return null
      const parts = String(ymd).split('-').map(v => parseInt(v, 10))
      if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) return null
      const [year, month, day] = parts; return new Date(year, month - 1, day)
    },
    getMeetingStartTimestamp(meeting) {
      const base = this.parseLocalYmd(meeting && meeting.meetingDate ? meeting.meetingDate : '')
      if (!base) return NaN
      const timeStr = meeting && meeting.startTime ? String(meeting.startTime) : ''
      const [hhRaw, mmRaw] = timeStr.split(':'); const hours = parseInt(hhRaw, 10); const minutes = parseInt(mmRaw, 10)
      base.setHours(Number.isNaN(hours) ? 0 : hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0)
      return base.getTime()
    },
    sortMeetingsForDisplay(meetings) {
      const list = Array.isArray(meetings) ? meetings.slice() : []
      const statusRank = (status) => { if (status === 'scheduled') return 0; if (status === 'completed') return 1; if (status === 'cancelled') return 2; return 3 }
      const nowTs = Date.now()
      return list.sort((a, b) => {
        const rankDiff = statusRank(a && a.status) - statusRank(b && b.status)
        if (rankDiff !== 0) return rankDiff
        const aRank = statusRank(a && a.status); const aTime = this.getMeetingStartTimestamp(a); const bTime = this.getMeetingStartTimestamp(b)
        if (aRank === 0) {
          const ta = Number.isFinite(aTime) ? aTime : Number.POSITIVE_INFINITY; const tb = Number.isFinite(bTime) ? bTime : Number.POSITIVE_INFINITY
          const aFuture = ta >= nowTs; const bFuture = tb >= nowTs
          if (aFuture !== bFuture) return aFuture ? -1 : 1
          if (ta !== tb) return aFuture ? (ta - tb) : (tb - ta)
        } else {
          const ta = Number.isFinite(aTime) ? aTime : Number.NEGATIVE_INFINITY; const tb = Number.isFinite(bTime) ? bTime : Number.NEGATIVE_INFINITY
          if (ta !== tb) return tb - ta
        }
        const aId = a && a._id ? String(a._id) : ''; const bId = b && b._id ? String(b._id) : ''
        return aId.localeCompare(bId)
      })
    },
    getProposalDisplayTitle(p) {
      if (!p) return ''
      return this.isEnglish
        ? (p.projectTitleEn || p.projectTitleTh || p.projectTitle || '')
        : (p.projectTitleTh || p.projectTitleEn || p.projectTitle || '')
    },
    formatProposalTitle(p) {
      if (!p) return '-'
      const title = this.isEnglish
        ? (p.projectTitleEn || p.projectTitleTh || p.projectTitle || '-')
        : (p.projectTitleTh || p.projectTitleEn || p.projectTitle || '-')
      const leaderName = this.getProposalLeaderName(p)
      return leaderName ? `${title} (${this.$t('adminMeetings.modal.projectLeader')}: ${leaderName})` : title
    },
    getProposalLeaderName(p) {
      if (!p) return ''
      const direct = (p.projectLeaderName || (p.projectLeader && (p.projectLeader.fullName || p.projectLeader.name)) || p.leaderName || '').toString().trim()
      if (direct) return direct
      const snapshot = (p.formSnapshotJson || p.formSnapshot || {}); const team = snapshot && snapshot.researchTeam ? snapshot.researchTeam : {}
      const leader = team && team.projectLeader ? team.projectLeader : {}
      return ((leader && (leader.name || leader.fullName)) || '').toString().trim()
    },
    formatParticipantLabel(u) { if (!u) return '-'; return u.fullName || u.email || '-' },
    getProposalCurrentStatus(proposal) {
      return String((proposal && (proposal.currentStatus || proposal.status)) || '').trim()
    },
    getEditingMeetingProposalId() {
      return (this.selectedMeeting && Array.isArray(this.selectedMeeting.proposalIds) && this.selectedMeeting.proposalIds.length)
        ? String(this.selectedMeeting.proposalIds[0] || '').trim()
        : ''
    },
    shouldKeepMeetingProposalOption(proposal) {
      const proposalId = String((proposal && proposal._id) || '').trim()
      if (!proposalId) return false
      const editingProposalId = this.getEditingMeetingProposalId()
      return Boolean(this.isEditMode && editingProposalId && proposalId === editingProposalId)
    },
    canSelectProposalForMeeting(proposal) {
      const status = this.getProposalCurrentStatus(proposal)
      if (ALLOWED_MEETING_PROPOSAL_STATUSES.includes(status)) return true
      if (status === MEETING_MANAGED_PROPOSAL_STATUS && this.shouldKeepMeetingProposalOption(proposal)) return true
      return false
    },
    async fetchProposalOptions() {
      this.proposalOptionsLoading = true; this.proposalOptionsError = null
      try {
        const statuses = [...ALLOWED_MEETING_PROPOSAL_STATUSES]
        if (this.isEditMode && this.getEditingMeetingProposalId()) statuses.push(MEETING_MANAGED_PROPOSAL_STATUS)
        const response = await axios.get('/api/v1/proposals', {
          params: {
            page: 1,
            limit: 300,
            status: statuses.join(',')
          }
        })
        const payload = (response && response.data && response.data.data) || {}
        const list = Array.isArray(payload.proposals) ? payload.proposals : (Array.isArray(payload.data) ? payload.data : [])
        this.proposalOptions = list.filter((proposal) => this.canSelectProposalForMeeting(proposal)).map(p => {
          const th = (p && p.projectTitleTh) ? String(p.projectTitleTh) : ''; const en = (p && p.projectTitleEn) ? String(p.projectTitleEn) : ''
          const code = (p && p.proposalCode) ? String(p.proposalCode) : ''; const leaderName = this.getProposalLeaderName(p)
          const searchText = [th, en, code, leaderName].filter(Boolean).join(' '); return { ...p, searchText, leaderName }
        })
        this.resolveSelectedProposalOption()
      } catch (err) {
        console.error('[AdminMeetings] Error fetching proposals for select:', err)
        this.proposalOptions = []; this.proposalOptionsError = (err && err.message) || 'โหลดข้อมูลไม่สำเร็จ'
      } finally { this.proposalOptionsLoading = false }
    },
    async fetchParticipantOptions() {
      this.participantOptionsLoading = true; this.participantOptionsError = null
      try {
        const response = await axios.get('/api/v1/users', { params: { page: 1, limit: 200 } })
        const payload = (response && response.data && response.data.data) || {}
        const list = Array.isArray(payload.users) ? payload.users : []
        this.participantOptions = list.map(u => {
          const name = (u && u.fullName) ? String(u.fullName) : ''; const email = (u && u.email) ? String(u.email) : ''
          return { ...u, searchText: `${name} ${email}`.trim() }
        })
        this.resolveSelectedParticipantOptions()
      } catch (err) {
        console.error('[AdminMeetings] Error fetching users:', err)
        this.participantOptions = []; this.participantOptionsError = (err && err.message) || 'โหลดข้อมูลไม่สำเร็จ'
      } finally { this.participantOptionsLoading = false }
    },
    resolveSelectedParticipantOptions() {
      const ids = (Array.isArray(this.pendingParticipantIds) && this.pendingParticipantIds.length)
        ? this.pendingParticipantIds
        : (this.isEditMode && this.selectedMeeting && Array.isArray(this.selectedMeeting.participantIds) ? this.selectedMeeting.participantIds.map(String) : [])
      if (!ids.length || !Array.isArray(this.participantOptions) || !this.participantOptions.length) return
      this.selectedParticipantOptions = this.participantOptions.filter(u => ids.includes(String(u && u._id)))
    },
    resolveSelectedProposalOption() {
      const id = (this.pendingProposalIds && this.pendingProposalIds[0]) || (this.selectedMeeting && Array.isArray(this.selectedMeeting.proposalIds) && this.selectedMeeting.proposalIds[0]) || ''
      if (!id || !Array.isArray(this.proposalOptions) || !this.proposalOptions.length) return
      const match = this.proposalOptions.find(p => String(p && p._id) === String(id))
      if (match) { this.selectedProposalOption = match; const title = match.projectTitleTh || match.projectTitleEn || match.projectTitle || ''; if (title) this.applyProjectToForm(title) }
    },
    applyProjectToForm(projectTitle) {
      const title = String(projectTitle || '').trim(); if (!title) return
      const prefix = this.$t('adminMeetings.defaults.titlePrefix')
      const nextAutoTitle = `${prefix}: ${title}`
      if (!this.meetingForm.title || (this.autoProjectTitle && this.meetingForm.title === `${prefix}: ${this.autoProjectTitle}`)) this.meetingForm.title = nextAutoTitle
      this.autoProjectTitle = title
    },
    onProposalSelected(opt) {
      if (!opt) { this.selectedProposalOption = null; this.pendingProposalIds = []; this.pendingProjectTitle = ''; this.autoProjectTitle = ''; return }
      this.selectedProposalOption = opt; this.pendingProposalIds = [String(opt._id)]
      const title = opt.projectTitleTh || opt.projectTitleEn || opt.projectTitle || ''; this.pendingProjectTitle = title
      if (title) this.applyProjectToForm(title)
    },
    makeProposalOption(proposal) {
      if (!proposal) return null
      const p = proposal || {}
      const th = (p && p.projectTitleTh) ? String(p.projectTitleTh) : ''
      const en = (p && p.projectTitleEn) ? String(p.projectTitleEn) : ''
      const code = (p && p.proposalCode) ? String(p.proposalCode) : ''
      const leaderName = this.getProposalLeaderName(p)
      const searchText = [th, en, code, leaderName].filter(Boolean).join(' ')
      return { ...p, searchText, leaderName }
    },
    async fetchProposalOptionById(proposalId) {
      const id = String(proposalId || '').trim()
      if (!id) return null
      try {
        const response = await axios.get(`/api/v1/proposals/${encodeURIComponent(id)}`)
        const proposal = (response && response.data && response.data.data) || null
        return this.makeProposalOption(proposal)
      } catch (err) {
        console.error('[AdminMeetings] Error fetching proposal by id:', err)
        return null
      }
    },
    async consumeProposalContext() {
      const q = (this.$route && this.$route.query) ? this.$route.query : {}
      const proposalId = q.fromProposalId || q.proposalId || ''; const projectTitle = q.fromProjectTitle || q.projectTitle || ''
      if (!proposalId && !projectTitle) return
      this.openCreateModal()
      this.pendingProposalIds = proposalId ? [String(proposalId)] : []; this.pendingProjectTitle = projectTitle ? String(projectTitle) : ''
      this.selectedProposalOption = null; this.autoProjectTitle = ''

      const id = proposalId ? String(proposalId).trim() : ''
      let option = null
      if (id) {
        option = (Array.isArray(this.proposalOptions) && this.proposalOptions.length)
          ? (this.proposalOptions.find(p => String(p && p._id) === id) || null)
          : null

        if (!option) {
          option = await this.fetchProposalOptionById(id)
          if (!option && this.pendingProjectTitle) {
            option = this.makeProposalOption({ _id: id, projectTitleTh: this.pendingProjectTitle })
          }
          if (option) {
            const exists = Array.isArray(this.proposalOptions) && this.proposalOptions.some(p => String(p && p._id) === id)
            if (!exists) this.proposalOptions = [option, ...(Array.isArray(this.proposalOptions) ? this.proposalOptions : [])]
          }
        }
      }

      if (option) this.onProposalSelected(option)
      else if (this.pendingProjectTitle) this.applyProjectToForm(this.pendingProjectTitle)

      if (!this.proposalOptionsLoading && (!this.proposalOptions || !this.proposalOptions.length)) this.fetchProposalOptions()
      else this.resolveSelectedProposalOption()
      const nextQuery = { ...q }; delete nextQuery.fromProposalId; delete nextQuery.proposalId; delete nextQuery.fromProjectTitle; delete nextQuery.projectTitle
      this.$router.replace({ path: this.$route.path, query: nextQuery })
    },
    getSelectValue(val) { return val && val.target ? val.target.value : val },
    getStatusMeta(status) {
      const meta = MEETING_STATUS[status] || { color: 'secondary' }
      const labelMap = {
        scheduled: this.$t('userMeetings.summary.scheduled.label'),
        completed: this.$t('userMeetings.summary.completed.label'),
        cancelled: this.$t('userMeetings.summary.cancelled.label')
      }
      return { label: labelMap[status] || status || '-', color: meta.color || 'secondary' }
    },
    getMeetingCardClass(meeting) { return { scheduled: meeting.status === 'scheduled', completed: meeting.status === 'completed', cancelled: meeting.status === 'cancelled' } },
    isMeetingActionable(meeting) { return !!(meeting && meeting.status === 'scheduled') },
    toggleSelectionMode() { if (!this.canEditDelete) return; this.selectionMode = !this.selectionMode; this.selectedMeetingForActions = null },
    clearSelectedMeeting() { this.selectedMeetingForActions = null },
    selectMeetingForActions(meeting) {
      if (!this.isMeetingActionable(meeting)) return
      if (this.isSelectedMeeting(meeting)) { this.clearSelectedMeeting(); return }
      this.selectedMeetingForActions = meeting || null
    },
    isSelectedMeeting(meeting) {
      if (!this.selectionMode || !meeting || !this.selectedMeetingForActions) return false
      return String(meeting._id) === String(this.selectedMeetingForActions._id)
    },
    getMeetingModeLabel(meeting) {
      if (!meeting) return '-'; const type = meeting.meetingType ? String(meeting.meetingType).trim().toLowerCase() : ''
      if (type === 'online') return this.$t('userMeetings.card.modeOnline'); if (type === 'onsite') return this.$t('userMeetings.card.modeOnsite')
      const videoLink = meeting.videoLink ? String(meeting.videoLink).trim() : ''; const location = meeting.location ? String(meeting.location).trim() : ''
      const locationLooksOnline = /online|zoom|teams|meet|webex/i.test(location) || /^https?:\/\//i.test(location)
      return (videoLink || locationLooksOnline) ? this.$t('userMeetings.card.modeOnline') : this.$t('userMeetings.card.modeOnsite')
    },
    getMinutesLocationLabel(meeting) {
      if (!meeting) return '-'; const mode = this.getMeetingModeLabel(meeting)
      if (mode === this.$t('userMeetings.card.modeOnline')) return this.$t('userMeetings.card.modeOnline'); return meeting.location || '-'
    },
    async fetchMeetings() {
      this.loading = true
      try {
        const params = this.applyMyOnlyFilter ? { page: 1, limit: 500 } : { page: this.page, limit: this.limit }
        if (this.filterStatus) params.status = this.filterStatus
        if (this.searchKeyword && String(this.searchKeyword).trim()) params.keyword = String(this.searchKeyword).trim()
        const response = await axios.get('/api/v1/meetings', { params })
        const payload = (response && response.data && response.data.data) || {}
        const list = Array.isArray(payload.meetings) ? payload.meetings : (Array.isArray(payload.data) ? payload.data : [])
        const sorted = this.sortMeetingsForDisplay(list)
        if (this.applyMyOnlyFilter) {
          const mine = sorted.filter(m => this.meetingHasCurrentUser(m))
          this.total = mine.length; this.totalPages = Math.max(1, Math.ceil(this.total / Math.max(1, this.limit)))
          if (this.page > this.totalPages) this.page = 1
          const start = (Math.max(1, this.page) - 1) * this.limit; this.meetings = mine.slice(start, start + this.limit)
        } else {
          this.meetings = sorted; this.total = Number(payload.total) || list.length
          this.page = Number(payload.page) || this.page; this.totalPages = Number(payload.totalPages) || Math.max(1, Math.ceil(this.total / this.limit))
        }
        if (this.selectedMeetingForActions) {
          const stillExists = this.meetings.find(m => String(m._id) === String(this.selectedMeetingForActions._id))
          this.selectedMeetingForActions = (stillExists && this.isMeetingActionable(stillExists)) ? stillExists : null
        } else { this.selectedMeetingForActions = null }
        if (!this.selectionMode) this.selectedMeetingForActions = null
      } catch (error) {
        console.error('[AdminMeetings] Error fetching meetings:', error)
        this.meetings = []; this.total = 0; this.totalPages = 1; this.selectedMeetingForActions = null
      } finally { this.loading = false }
    },
    async fetchMeetingSummary() {
      this.summaryCountsLoading = true
      try {
        const response = await axios.get('/api/v1/meetings/summary')
        const payload = (response && response.data && response.data.data) || {}
        this.summaryCounts = { scheduled: Number(payload.scheduled) || 0, completed: Number(payload.completed) || 0, cancelled: Number(payload.cancelled) || 0, total: Number(payload.total) || 0 }
      } catch (error) {
        console.error('[AdminMeetings] Error fetching meeting summary:', error)
        try {
          const [scheduledRes, completedRes, cancelledRes] = await Promise.all([
            axios.get('/api/v1/meetings', { params: { page: 1, limit: 1, status: 'scheduled' } }),
            axios.get('/api/v1/meetings', { params: { page: 1, limit: 1, status: 'completed' } }),
            axios.get('/api/v1/meetings', { params: { page: 1, limit: 1, status: 'cancelled' } })
          ])
          const scheduled = Number(((scheduledRes.data && scheduledRes.data.data) || {}).total) || 0
          const completed = Number(((completedRes.data && completedRes.data.data) || {}).total) || 0
          const cancelled = Number(((cancelledRes.data && cancelledRes.data.data) || {}).total) || 0
          this.summaryCounts = { scheduled, completed, cancelled, total: scheduled + completed + cancelled }
        } catch (fallbackErr) { console.error('[AdminMeetings] Summary fallback failed:', fallbackErr) }
      } finally { this.summaryCountsLoading = false }
    },
    onSearchKeywordInput() {
      if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer)
      this.searchDebounceTimer = setTimeout(() => { this.page = 1; this.fetchMeetings() }, 350)
    },
    async handleSearchEditAction() {
      if (!this.canEditDelete) return
      if (this.selectedMeetingForActions && this.isMeetingActionable(this.selectedMeetingForActions)) {
        this.openEditModal(this.selectedMeetingForActions)
        return
      }
      if (!this.selectionMode) {
        this.selectionMode = true
      }
      await Swal.fire({
        icon: 'info',
        title: this.$t('adminMeetings.alerts.selectToEditTitle'),
        text: this.$t('adminMeetings.alerts.selectToEditText'),
        confirmButtonText: this.$t('adminMeetings.alerts.ok')
      })
    },
    toggleSummaryFilter(status) { const next = this.filterStatus === status ? '' : status; this.filterStatus = next; this.page = 1; this.fetchMeetings() },
    setAllFilter() { this.filterStatus = ''; this.page = 1; this.fetchMeetings() },
    isSummaryFilterActive(status) { return this.filterStatus === status },
    onPageChange(nextPage) { if (nextPage < 1 || nextPage > this.totalPages) return; this.page = nextPage; this.fetchMeetings() },
    openCreateModal() {
      if (!this.canCreate) return
      this.isEditMode = false; this.selectedMeeting = null; this.pendingProposalIds = []; this.pendingProjectTitle = ''
      this.selectedProposalOption = null; this.autoProjectTitle = ''; this.pendingParticipantIds = []; this.selectedParticipantOptions = []
      this.meetingForm = { title: '', meetingDate: '', startTime: '', endTime: '', meetingType: 'online', location: '', videoLink: '', agenda: '', status: 'scheduled' }
      this.showMeetingModal = true
      this.fetchProposalOptions()
      if (!this.participantOptionsLoading && (!this.participantOptions || !this.participantOptions.length)) this.fetchParticipantOptions()
    },
    openEditModal(meeting) {
      if (!this.canEditDelete) return
      this.isEditMode = true; this.selectedMeeting = meeting; this.pendingProposalIds = []; this.pendingProjectTitle = ''
      this.selectedProposalOption = null; this.autoProjectTitle = ''
      this.pendingParticipantIds = Array.isArray(meeting && meeting.participantIds) ? meeting.participantIds.map(String) : []
      this.selectedParticipantOptions = []
      const inferredType = meeting && meeting.meetingType ? String(meeting.meetingType) : (this.getMeetingModeLabel(meeting) === this.$t('userMeetings.card.modeOnline') ? 'online' : 'onsite')
      this.meetingForm = { title: meeting.title || '', meetingDate: meeting.meetingDate || '', startTime: meeting.startTime || '', endTime: meeting.endTime || '', meetingType: inferredType, location: meeting.location || '', videoLink: meeting.videoLink || '', agenda: meeting.agenda || '', status: meeting.status || 'scheduled' }
      this.showMeetingModal = true
      this.fetchProposalOptions()
      this.$nextTick(() => { this.resolveSelectedProposalOption(); this.resolveSelectedParticipantOptions() })
      if (!this.participantOptionsLoading && (!this.participantOptions || !this.participantOptions.length)) this.fetchParticipantOptions()
    },
    closeMeetingModal() { this.showMeetingModal = false; this.savingMeeting = false; this.closeTimeDropdown() },
    async cancelMeeting() {
      if (this.readOnly) return
      if (!this.selectedMeeting || !this.selectedMeeting._id) return
      if (!this.meetingForm || this.meetingForm.status !== 'scheduled') return
      const result = await Swal.fire({ icon: 'warning', title: this.$t('adminMeetings.alerts.confirmCancelTitle'), text: this.$t('adminMeetings.alerts.confirmCancelText', { title: this.selectedMeeting.title || '' }), showCancelButton: true, confirmButtonText: this.$t('adminMeetings.alerts.confirmCancelConfirm'), cancelButtonText: this.$t('adminMeetings.alerts.confirmCancelBack'), confirmButtonColor: '#e55353' })
      if (!result.isConfirmed) return
      this.savingMeeting = true
      try {
        await axios.patch(`/api/v1/meetings/${this.selectedMeeting._id}/status`, { status: 'cancelled' })
        this.closeMeetingModal(); await this.fetchMeetings(); await this.fetchMeetingSummary()
        await Swal.fire({ icon: 'success', title: this.$t('adminMeetings.alerts.cancelSuccess'), timer: 1300, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminMeetings] Error cancelling meeting:', error)
        await Swal.fire({ icon: 'error', title: this.$t('adminMeetings.alerts.cancelErrorTitle'), text: this.$t('adminMeetings.alerts.apiNotReady') })
      } finally { this.savingMeeting = false }
    },
    async saveMeeting() {
      if (this.readOnly) return
      if (!this.meetingForm.title || !this.meetingForm.meetingDate || !this.meetingForm.startTime) {
        await Swal.fire({ icon: 'warning', title: this.$t('adminMeetings.alerts.requiredTitle'), text: this.$t('adminMeetings.alerts.requiredText') }); return
      }
      const meetingType = this.meetingForm && this.meetingForm.meetingType ? String(this.meetingForm.meetingType) : 'online'
      const location = this.meetingForm && this.meetingForm.location ? String(this.meetingForm.location).trim() : ''
      const videoLink = this.meetingForm && this.meetingForm.videoLink ? String(this.meetingForm.videoLink).trim() : ''
      if (meetingType === 'onsite' && !location) { await Swal.fire({ icon: 'warning', title: this.$t('adminMeetings.alerts.requiredTitle'), text: this.$t('adminMeetings.alerts.onsiteNeedLocation') }); return }
      if (meetingType === 'online' && !videoLink) { await Swal.fire({ icon: 'warning', title: this.$t('adminMeetings.alerts.requiredTitle'), text: this.$t('adminMeetings.alerts.onlineNeedLink') }); return }
      if (this.enforceMinDateTime) {
        const startTs = this.getMeetingStartTimestamp({ meetingDate: this.meetingForm.meetingDate, startTime: this.meetingForm.startTime })
        if (Number.isFinite(startTs) && startTs < Date.now()) { await Swal.fire({ icon: 'warning', title: this.$t('adminMeetings.alerts.invalidDateTimeTitle'), text: this.$t('adminMeetings.alerts.invalidDateTimeText') }); return }
      }
      this.savingMeeting = true
      try {
        const proposalIds = this.selectedProposalOption && this.selectedProposalOption._id ? [String(this.selectedProposalOption._id)] : ((this.isEditMode && this.selectedMeeting && this.selectedMeeting.proposalIds) ? this.selectedMeeting.proposalIds : [])
        let participantIds = Array.isArray(this.selectedParticipantOptions) ? this.selectedParticipantOptions.map(u => String(u && u._id)).filter(Boolean) : []
        if (this.isEditMode && (!participantIds || participantIds.length === 0) && this.selectedMeeting && Array.isArray(this.selectedMeeting.participantIds)) participantIds = this.selectedMeeting.participantIds
        const body = { title: this.meetingForm.title, meetingDate: this.meetingForm.meetingDate, startTime: this.meetingForm.startTime, endTime: this.meetingForm.endTime, meetingType: this.meetingForm.meetingType, location: meetingType === 'online' ? '' : location, videoLink, proposalIds, participantIds, agenda: this.meetingForm.agenda, status: this.meetingForm.status }
        if (this.isEditMode && this.selectedMeeting && this.selectedMeeting._id) await axios.put(`/api/v1/meetings/${this.selectedMeeting._id}`, body)
        else await axios.post('/api/v1/meetings', body)
        this.closeMeetingModal(); await this.fetchMeetings(); await this.fetchMeetingSummary()
        await Swal.fire({ icon: 'success', title: this.$t('adminMeetings.alerts.saveSuccess'), timer: 1400, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminMeetings] Error saving meeting:', error)
        await Swal.fire({ icon: 'error', title: this.$t('adminMeetings.alerts.saveErrorTitle'), text: this.$t('adminMeetings.alerts.apiNotReady') })
      } finally { this.savingMeeting = false }
    },
    async deleteMeeting(meeting) {
      if (this.readOnly) return; if (!meeting || !meeting._id) return
      if (this.deletingMeeting) return
      const result = await Swal.fire({ icon: 'warning', title: this.$t('adminMeetings.alerts.deleteConfirmTitle'), text: this.$t('adminMeetings.alerts.deleteConfirmText', { title: meeting.title || '' }), showCancelButton: true, confirmButtonText: this.$t('adminMeetings.alerts.deleteConfirm'), cancelButtonText: this.$t('adminMeetings.alerts.deleteCancel'), confirmButtonColor: '#e55353' })
      if (!result.isConfirmed) return
      this.deletingMeeting = true
      try {
        await axios.delete(`/api/v1/meetings/${meeting._id}`); await this.fetchMeetings(); await this.fetchMeetingSummary()
        await Swal.fire({ icon: 'success', title: this.$t('adminMeetings.alerts.deleteSuccess'), timer: 1300, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminMeetings] Error deleting meeting:', error)
        await Swal.fire({ icon: 'error', title: this.$t('adminMeetings.alerts.deleteErrorTitle'), text: this.$t('adminMeetings.alerts.apiNotReady') })
      } finally {
        this.deletingMeeting = false
      }
    },
    openMinutesModal(meeting) {
      this.minutesMeeting = meeting
      this.minutesForm = { minutes: meeting.minutes || '', decisions: meeting.decisions || '', actionItems: Array.isArray(meeting.actionItems) ? meeting.actionItems.map(item => ({ ...item })) : [] }
      if (!Array.isArray(this.minutesForm.actionItems)) this.minutesForm.actionItems = []
      this.showMinutesModal = true
    },
    closeMinutesModal() { this.showMinutesModal = false; this.minutesMeeting = null; this.savingMinutes = false; this.minutesForm = { minutes: '', decisions: '', actionItems: [] } },
    addActionItem() { this.minutesForm.actionItems.push({ task: '', assignee: '', deadline: '' }) },
    removeActionItem(index) { this.minutesForm.actionItems.splice(index, 1) },
    async saveMinutes() {
      if (this.readOnly) return; if (!this.minutesMeeting || !this.minutesMeeting._id) return
      this.savingMinutes = true
      try {
        await axios.put(`/api/v1/meetings/${this.minutesMeeting._id}/minutes`, { minutes: this.minutesForm.minutes, decisions: this.minutesForm.decisions, actionItems: this.minutesForm.actionItems })
        await axios.patch(`/api/v1/meetings/${this.minutesMeeting._id}/status`, { status: 'completed' })
        this.closeMinutesModal(); await this.fetchMeetings(); await this.fetchMeetingSummary()
        await Swal.fire({ icon: 'success', title: this.$t('adminMeetings.alerts.minutesSuccess'), timer: 1400, showConfirmButton: false })
      } catch (error) {
        console.error('[AdminMeetings] Error saving minutes:', error)
        await Swal.fire({ icon: 'error', title: this.$t('adminMeetings.alerts.minutesErrorTitle'), text: this.$t('adminMeetings.alerts.apiNotReady') })
      } finally { this.savingMinutes = false }
    },
    getSummaryCount(status) { const counts = this.summaryCounts || {}; return Number(counts[status]) || 0 },
    formatDate(dateStr) {
      if (!dateStr) return '-'; const d = new Date(dateStr); if (Number.isNaN(d.getTime())) return '-'
      const locale = this.isEnglish ? 'en-GB' : 'th-TH'
      try { return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }) } catch (err) { return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear())}` }
    },
    formatTime(time) { return time ? this.formatTime12h(time) : '-' },
    getMeetingProposalId(meeting) {
      const ids = meeting && Array.isArray(meeting.proposalIds) ? meeting.proposalIds : []
      const first = ids && ids.length ? String(ids[0] || '').trim() : ''; return first
    },
    goToProposalForm(meeting) {
      const proposalId = this.getMeetingProposalId(meeting); if (!proposalId) return
      this.$router.push({ name: 'ResearchForm', params: { id: proposalId } })
    },
    isReadOnly(meeting) { return this.readOnly || (meeting && meeting.status === 'completed') }
  }
}
</script>

<style scoped>
.icon-bold { transform: scale(1.2); filter: contrast(1.3); }

.admin-meetings-page {
  --am-bg: #fffaf2;
  --am-surface: #ffffff;
  --am-border: #eadfce;
  --am-line: rgba(181, 133, 34, 0.35);
  --am-text: #1f2937;
  --am-muted: #6b7280;
  --am-accent: #8b1212;
  --am-gold: #c59b3a;
  --am-gold-rgb: 197, 155, 58;
  --am-accent-ring: rgba(139, 18, 18, 0.18);
  --am-section-gap: 24px;
  width: 100%;
  padding: 22px 22px 28px;
}

.admin-meetings-loading-layer ::v-deep .modal.overflow-auto.fade.show.d-block {
  z-index: 30002 !important;
}

.admin-meetings-loading-layer ::v-deep .modal-backdrop.fade.show {
  z-index: 30001 !important;
}

.meetings-hero {
  display: flex; justify-content: space-between; align-items: center; gap: 20px;
  padding: 28px; margin-bottom: var(--am-section-gap); border-radius: 22px;
  background: radial-gradient(circle at top right, rgba(255,255,255,0.28), transparent 30%), linear-gradient(135deg, var(--am-accent) 0%, var(--am-gold) 115%);
  color: #ffffff; box-shadow: 0 20px 45px rgba(15,23,42,0.16);
}
.meetings-hero__content { max-width: 720px; }
.meetings-hero__eyebrow { display: inline-flex; align-items: center; padding: 6px 12px; margin-bottom: 12px; border-radius: 999px; background: rgba(255,255,255,0.16); font-size: 0.8rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.meetings-hero__title { margin-bottom: 10px; font-size: 2rem; font-weight: 700; line-height: 1.3; }
.meetings-hero__subtitle { max-width: 620px; color: rgba(255,255,255,0.84); font-size: 0.98rem; line-height: 1.7; }

.hero-action-btn {
  min-width: 210px; border-radius: 14px;
  box-shadow: 0 4px 14px rgba(15,23,42,0.15);
  background: rgba(255,255,255,0.92) !important;
  border-color: rgba(255,255,255,0.6) !important;
  color: #7a1010 !important; font-weight: 700;
}
.hero-action-btn:hover { background: #ffffff !important; box-shadow: 0 6px 20px rgba(15,23,42,0.18); filter: none; }

.summary-row { margin-bottom: 0; row-gap: 18px; }
.summary-row--filters { margin-bottom: var(--am-section-gap); }
.summary-row--filters .summary-card { cursor: pointer; user-select: none; transition: transform 0.15s ease, box-shadow 0.15s ease; outline: none; }
.summary-row--filters .summary-card:hover { transform: translateY(-2px); box-shadow: 0 18px 48px rgba(15,23,42,0.09); }
.summary-row--filters .summary-card:focus-visible { box-shadow: 0 0 0 3px rgba(255,255,255,0.35), 0 18px 48px rgba(15,23,42,0.16); }
.summary-card--active { transform: scale(1.02); box-shadow: 0 18px 48px rgba(15,23,42,0.18) !important; }

::v-deep .multiselect__option--highlight { background: rgba(197,155,58,0.14); color: var(--am-text); }
::v-deep .multiselect__option--highlight::after { content: ''; display: none; }
::v-deep .multiselect__option--selected { background: rgba(139,18,18,0.08); color: var(--am-text); font-weight: 600; }
::v-deep .multiselect__option--selected::after { content: ''; display: none; }

.summary-card { height: 100%; padding: 20px; border: 0; border-radius: 0.5rem; background: linear-gradient(135deg, var(--summary-start, #8c1515), var(--summary-end, #6b0f0f)); box-shadow: 0 16px 40px rgba(15,23,42,0.12); position: relative; overflow: hidden; isolation: isolate; }
.summary-card--info { --summary-start: #f59e0b; --summary-end: #d97706; }
.summary-card--neutral { --summary-start: #64748b; --summary-end: #475569; }
.summary-card--success { --summary-start: #16a34a; --summary-end: #15803d; }
.summary-card--danger { --summary-start: #ef4444; --summary-end: #dc2626; }
.summary-card::after { content: ''; position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 60%); pointer-events: none; z-index: 1; }
.summary-card > * { position: relative; z-index: 2; }
.summary-label { color: rgba(255,255,255,0.9); font-size: 0.9rem; font-weight: 600; }
.summary-number { margin: 10px 0 8px; color: rgba(255,255,255,0.98); font-size: 2rem; font-weight: 700; line-height: 1; }
.summary-caption { color: rgba(255,255,255,0.9); font-size: 0.88rem; line-height: 1.5; }

.filter-card { border-radius: 20px; box-shadow: 0 16px 40px rgba(15,23,42,0.06); border: 1px solid var(--am-border); background: var(--am-surface); margin-bottom: var(--am-section-gap); }
.filter-card::v-deep .form-control { border-color: var(--am-line); }
.filter-card::v-deep .form-control:focus { border-color: rgba(var(--am-gold-rgb), 0.75); box-shadow: 0 0 0 3px rgba(var(--am-gold-rgb), 0.18); }
.filter-card__header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
.filter-card__title { font-weight: 900; color: var(--am-text); font-size: 1.05rem; letter-spacing: 0.2px; }
.filter-card__subtitle { margin-top: 2px; color: var(--am-muted); font-size: 0.9rem; line-height: 1.55; }
.filter-card__icon-action { display: flex; justify-content: flex-end; align-items: flex-end; height: 100%; }
.filter-card__edit-toggle { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border: 0; border-radius: 14px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; box-shadow: 0 12px 24px rgba(37,99,235,0.22); transition: transform 160ms ease, box-shadow 160ms ease; }
.filter-card__edit-toggle:hover { transform: translateY(-1px); box-shadow: 0 16px 28px rgba(37,99,235,0.28); }
.filter-card__edit-toggle:focus, .filter-card__edit-toggle:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(147,197,253,0.9), 0 16px 28px rgba(37,99,235,0.28); }
.filter-card__edit-toggle--active { background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 12px 24px rgba(217,119,6,0.22); }

.meeting-type-toggle { position: relative; display: flex; gap: 6px; padding: 4px; border-radius: 12px; border: 1px solid var(--am-border); background: linear-gradient(180deg, rgba(197,155,58,0.10), rgba(15,23,42,0.00)); min-height: 44px; align-items: center; }
.meeting-type-toggle__input { position: absolute; opacity: 0; pointer-events: none; }
.meeting-type-toggle__label { flex: 1; margin: 0; padding: 8px 10px; border-radius: 10px; text-align: center; cursor: pointer; user-select: none; font-weight: 800; font-size: 0.92rem; color: var(--am-muted); transition: background 160ms ease, color 160ms ease, box-shadow 160ms ease, transform 160ms ease; }
.meeting-type-toggle__input:checked+.meeting-type-toggle__label { color: #ffffff; background: linear-gradient(135deg, var(--am-accent), var(--am-gold)); box-shadow: 0 10px 18px rgba(15,23,42,0.16); }
.meeting-type-toggle__label:active { transform: translateY(1px); }

.meeting-grid { --meeting-grid-gap: 18px; display: flex; flex-wrap: wrap; gap: var(--meeting-grid-gap); }
.meeting-grid .meeting-card { flex: 1 1 calc((100% - (2 * var(--meeting-grid-gap))) / 3); max-width: calc((100% - (2 * var(--meeting-grid-gap))) / 3); }
@media (max-width: 1199px) { .meeting-grid { --meeting-grid-gap: 16px; } .meeting-grid .meeting-card { flex-basis: calc((100% - var(--meeting-grid-gap)) / 2); max-width: calc((100% - var(--meeting-grid-gap)) / 2); } }
@media (max-width: 767px) { .meeting-grid .meeting-card { flex-basis: 100%; max-width: 100%; } }

.meeting-card { --status-rgb: 59, 130, 246; --meeting-card-accent-height: 37%; position: relative; isolation: isolate; display: block; height: 540px; border: 0; border-radius: 22px; padding: 0; transition: transform 0.2s ease, box-shadow 0.2s ease; overflow: visible; outline: none; }
.meeting-card__left-bar { position: absolute; top: 0; bottom: 0; left: -8px; width: 38px; background: transparent; border-radius: inherit; z-index: 0; pointer-events: none; }
.meeting-card__surface { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; border-radius: inherit; background: linear-gradient(180deg, #ffffff 0%, #ffffff var(--meeting-card-accent-height), #ffffff var(--meeting-card-accent-height), #f3e9e9 100%); overflow: hidden; border: 1px solid rgba(var(--am-gold-rgb), 0.55); border-top-color: rgba(var(--status-rgb), 0.22); box-shadow: inset 0 0 0 1px rgba(var(--am-gold-rgb), 0.18), 0 14px 30px rgba(15,23,42,0.08); }
.meeting-card__surface::before { content: ''; position: absolute; inset: 0; height: var(--meeting-card-accent-height); background: radial-gradient(circle at 16% 22%, rgba(255,255,255,0.65), rgba(255,255,255,0) 48%), radial-gradient(circle at 86% 0%, rgba(var(--status-rgb), 0.26), rgba(var(--status-rgb), 0) 55%), linear-gradient(135deg, rgba(var(--status-rgb), 0.42) 0%, rgba(var(--status-rgb), 0.22) 58%, rgba(255,255,255,0) 100%); border-bottom: 1px solid rgba(var(--status-rgb), 0.20); border-top-left-radius: inherit; border-top-right-radius: inherit; z-index: 0; pointer-events: none; }
.meeting-card__surface::after { content: ''; position: absolute; inset: 0; height: var(--meeting-card-accent-height); background: repeating-linear-gradient(135deg, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 9px, rgba(255,255,255,0) 9px, rgba(255,255,255,0) 22px), linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0)); opacity: 0.36; z-index: 0; pointer-events: none; }
.meeting-card--selected { box-shadow: none; }
.meeting-card--selected .meeting-card__surface { box-shadow: 0 0 0 3px var(--am-accent-ring), 0 14px 30px rgba(15,23,42,0.08); }
.meeting-card--locked { cursor: not-allowed; }
.meeting-card--locked .meeting-card__surface { opacity: 0.86; filter: grayscale(0.12); }
.meeting-card:focus .meeting-card__surface, .meeting-card:focus-visible .meeting-card__surface { box-shadow: 0 0 0 3px var(--am-accent-ring), 0 14px 30px rgba(15,23,42,0.08); }
.meeting-card:hover { transform: translateY(-3px); }
.meeting-card:hover .meeting-card__surface { box-shadow: 0 20px 42px rgba(15,23,42,0.1); }

.meeting-card__top { position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: center; flex-wrap: nowrap; gap: 12px; min-height: 42px; padding: 14px 18px 8px; background: transparent; border-top-left-radius: inherit; border-top-right-radius: inherit; }
.meeting-card__top::before, .meeting-card__top::after { content: none; }
.meeting-card__top > * { position: relative; z-index: 2; }
.meeting-card__content { flex: 1; position: relative; z-index: 1; display: flex; flex-direction: column; background: transparent; margin-top: 0; padding: 18px; box-shadow: 0 -1px 0 rgba(255,255,255,0.35); }
.meeting-card__badge { padding: 6px 10px; border-radius: 999px; background: rgba(var(--status-rgb), 0.12) !important; border: 1px solid rgba(var(--status-rgb), 0.24) !important; color: rgb(var(--status-rgb)) !important; font-weight: 800; min-width: 0; max-width: 44%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meeting-card__participant-pill { padding: 6px 10px; border-radius: 999px; background: rgba(255,255,255,0.74); border: 1px solid rgba(var(--status-rgb), 0.22); color: #0f172a; font-size: 0.85rem; font-weight: 600; line-height: 1; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px; min-width: 0; max-width: 56%; overflow: hidden; box-shadow: 0 10px 18px rgba(15,23,42,0.06); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
.meeting-card__participant-ic { color: rgb(var(--status-rgb)); }
.meeting-card__participant-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.meeting-card.scheduled { --status-rgb: 241, 165, 0; }
.meeting-card.completed { --status-rgb: 34, 197, 94; }
.meeting-card.cancelled { --status-rgb: 239, 68, 68; }

.meeting-card__body { flex: 1; position: relative; z-index: 2; display: flex; flex-direction: column; min-height: 0; }
.meeting-card__title { margin: 0 0 4px; color: #111827; font-size: 1.18rem; font-weight: 800; line-height: 1.45; display: block; flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meeting-card__title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.meeting-card__proposal-link { flex: 0 0 auto; width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid rgba(var(--am-gold-rgb), 0.55); background: rgba(var(--am-gold-rgb), 0.12); color: var(--am-accent); cursor: pointer; box-shadow: 0 10px 18px rgba(15,23,42,0.08); transition: transform 0.12s ease, box-shadow 0.12s ease, background-color 0.12s ease, border-color 0.12s ease; padding: 0; line-height: 0; }
.meeting-card__proposal-link:hover { background: rgba(var(--am-gold-rgb), 0.18); border-color: rgba(var(--am-gold-rgb), 0.75); box-shadow: 0 12px 22px rgba(15,23,42,0.1); transform: translateY(-1px); }
.meeting-card__proposal-link:focus { outline: none; }
.meeting-card__proposal-link:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--am-accent-ring), 0 12px 22px rgba(15,23,42,0.1); }
.meeting-card__title-wrap { position: relative; display: block; }
.meeting-card__title:focus { outline: none; }
.meeting-card__title:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--am-accent-ring); border-radius: 10px; }
.meeting-card__title-tooltip { position: absolute; top: calc(100% - 6px); left: 0; max-width: 420px; padding: 10px 12px; background: rgba(255,255,255,0.98); border: 1px solid rgba(148,163,184,0.36); border-radius: 12px; box-shadow: 0 14px 34px rgba(2,6,23,0.14); color: #0f172a; font-size: 0.92rem; line-height: 1.4; z-index: 10; pointer-events: none; white-space: normal; overflow-wrap: anywhere; }
.meeting-card__title-tooltip::before { content: ""; position: absolute; top: -7px; left: 18px; width: 12px; height: 12px; background: rgba(255,255,255,0.98); border-left: 1px solid rgba(148,163,184,0.36); border-top: 1px solid rgba(148,163,184,0.36); transform: rotate(45deg); }
.meeting-card__meta { margin-bottom: 16px; }
.meeting-card__meta-item { position: relative; width: 100%; min-width: 0; outline: none; }
.meeting-card__meta-item:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--am-accent-ring); border-radius: 10px; }
.meeting-card__meta-tooltip { position: absolute; top: calc(100% + 6px); left: 0; max-width: 440px; padding: 8px 10px; background: rgba(255,255,255,0.98); border: 1px solid rgba(148,163,184,0.34); border-radius: 12px; box-shadow: 0 14px 34px rgba(2,6,23,0.14); color: #0f172a; font-size: 0.88rem; line-height: 1.35; z-index: 12; pointer-events: none; white-space: normal; overflow-wrap: anywhere; }
.meeting-card__meta-item--datetime { border-radius: 5px; }
.meeting-card__datetime-card { margin-bottom: 0; width: 100%; min-height: 64px; display: flex; align-items: stretch; gap: 12px; padding: 0; border-radius: 0; overflow: visible; border: 0; background: transparent; box-shadow: none; backdrop-filter: none; -webkit-backdrop-filter: none; }
.meeting-card__datetime-cell { flex: 1 1 0; min-width: 0; display: flex; align-items: stretch; overflow: hidden; border-radius: 4px; border: 1px solid rgba(var(--am-gold-rgb),0.84); background: rgba(255,255,255,0.72); box-shadow: 0 8px 14px rgba(15,23,42,0.05); }
.meeting-card__datetime-icon-wrap { margin: 0; padding: 0; width: 46px; flex: 0 0 46px; display: flex; align-items: center; justify-content: center; color: #ffffff; }
.meeting-card__datetime-cell--date .meeting-card__datetime-icon-wrap { background: linear-gradient(135deg, #312e81, #4338ca); }
.meeting-card__datetime-cell--time .meeting-card__datetime-icon-wrap { background: linear-gradient(135deg, #0ea5e9, #3b82f6); }
.meeting-card__datetime-text { padding: 7px 9px; display: flex; flex-direction: column; justify-content: center; min-width: 0; }
.meeting-card__datetime-value { line-height: 1.1; margin-bottom: 2px; font-size: 0.92rem; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.meeting-card__datetime-label { line-height: 1.1; font-size: 0.78rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.meeting-card__datetime-cell--date .meeting-card__datetime-value { color: #1e1b4b; }
.meeting-card__datetime-cell--date .meeting-card__datetime-label { color: rgba(30,27,75,0.82); }
.meeting-card__datetime-cell--time .meeting-card__datetime-value { color: #0f172a; }
.meeting-card__datetime-cell--time .meeting-card__datetime-label { color: rgba(15,23,42,0.88); }
.meeting-card__datetime-divider { display: none; }

.meeting-card__detail-list { padding: 14px 0; border-top: 1px solid var(--am-line); border-bottom: 1px solid var(--am-line); }
.meeting-card__detail { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed var(--am-line); }
.meeting-card__detail:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
.meeting-card__detail-key { min-width: 82px; color: #6b7280; font-size: 0.86rem; flex: 0 0 auto; line-height: 1.2; white-space: nowrap; }
.meeting-card__detail-value { color: #111827; font-size: 0.9rem; text-align: center; margin-left: auto; flex: 0 1 clamp(140px, 48%, 220px); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.2; }
.meeting-card__detail-value.meeting-mode { display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.meeting-card__detail-value.meeting-mode::before { content: ''; width: 7px; height: 7px; border-radius: 999px; box-shadow: 0 0 0 2px rgba(255,255,255,0.55), 0 8px 14px rgba(15,23,42,0.10); }
.meeting-card__detail-value.meeting-mode--online::before { background: #38bdf8; }
.meeting-card__detail-value.meeting-mode--onsite::before { background: #fb923c; }
.meeting-card__detail-value.is-link { display: flex; margin-left: auto; justify-content: center; align-items: center; min-width: 0; overflow: visible; text-overflow: unset; white-space: nowrap; }
.meeting-card__detail-value a { color: var(--am-accent); display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meeting-card__detail-value a.meeting-card__link-btn { display: inline-flex; max-width: none; overflow: visible; white-space: normal; text-overflow: unset; }
.meeting-card__link-btn { display: inline-flex; align-items: center; justify-content: center; width: 60px; height: 32px; padding: 0; border-radius: 10px; border: 1px solid rgba(var(--am-gold-rgb),0.45); background: rgba(var(--am-gold-rgb),0.12); color: #334155; text-decoration: none; box-shadow: 0 8px 16px rgba(15,23,42,0.06); transition: transform 0.12s ease, box-shadow 0.12s ease, background-color 0.12s ease, border-color 0.12s ease; max-width: none; overflow: visible; cursor: pointer; line-height: 0; vertical-align: middle; }
.meeting-card__link-btn .c-icon { display: block; }
.meeting-card__link-btn:hover { background: rgba(var(--am-gold-rgb),0.18); border-color: rgba(var(--am-gold-rgb),0.7); box-shadow: 0 10px 20px rgba(15,23,42,0.08); transform: translateY(-1px); }
.meeting-card__link-btn:active { transform: translateY(0); }
.meeting-card__link-btn.is-disabled { background: #e5e7eb; border-color: #e5e7eb; color: #6b7280; box-shadow: none; cursor: not-allowed; }
.meeting-card__link-btn:focus { outline: none; }
.meeting-card__link-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--am-accent-ring), 0 10px 20px rgba(15,23,42,0.08); }

.meeting-card__agenda { display: flex; flex-direction: column; min-height: 0; margin-top: 4px; }
.meeting-card__agenda-label { font-size: 0.86rem; color: #6b7280; margin-bottom: 6px; font-weight: 700; }
.meeting-card__agenda-body { flex: 0 0 auto; height: 96px; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--am-line); background: rgba(248,250,252,0.9); color: #111827; font-size: 0.9rem; line-height: 1.35; overflow-y: auto; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
.meeting-card__footer { margin-top: 18px; }
.meeting-card__footer-actions { display: flex; align-items: stretch; gap: 8px; width: 100%; }
.meeting-card__footer-side-actions { display: inline-flex; align-items: stretch; gap: 8px; flex: 0 0 auto; }
.meeting-card__side-btn { min-width: 90px !important; padding: 0 12px !important; border-radius: 14px !important; font-weight: 900 !important; letter-spacing: 0.01em; display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 8px !important; border: 0 !important; box-shadow: 0 12px 22px rgba(15,23,42,0.14) !important; transition: transform 0.12s ease, filter 0.12s ease, box-shadow 0.12s ease !important; }
.meeting-card__side-btn:hover { filter: brightness(1.03); transform: translateY(-1px); box-shadow: 0 14px 26px rgba(15,23,42,0.18) !important; }
.meeting-card__side-btn:focus { outline: none !important; }
.meeting-card__side-btn:focus-visible { outline: none !important; box-shadow: 0 0 0 3px var(--am-accent-ring), 0 14px 26px rgba(15,23,42,0.18) !important; }
.meeting-card__side-btn--edit { background: #d97706 !important; color: #ffffff !important; }
.meeting-card__side-btn--delete { background: #dc2626 !important; color: #ffffff !important; }
.meeting-card__side-ic { opacity: 0.95; }

.meeting-card__cta { flex: 1 1 auto; min-width: 0; border-radius: 14px !important; padding: 10px 12px !important; font-weight: 900 !important; letter-spacing: 0.01em; background: #b45309 !important; border: 1px solid rgba(139,18,18,0.22) !important; color: #ffffff !important; box-shadow: 0 12px 22px rgba(15,23,42,0.14); transition: transform 0.12s ease, filter 0.12s ease, box-shadow 0.12s ease; }
.meeting-card__cta:hover { filter: brightness(1.03); box-shadow: 0 14px 26px rgba(15,23,42,0.18); transform: translateY(-1px); }
.meeting-card__cta:focus { outline: none !important; }
.meeting-card__cta:focus-visible { outline: none !important; box-shadow: 0 0 0 3px var(--am-accent-ring), 0 14px 26px rgba(15,23,42,0.18); }
.meeting-card__cta.meeting-card__cta--soft { background: #fff7e6 !important; border-color: rgba(var(--am-gold-rgb),0.65) !important; color: var(--am-accent) !important; box-shadow: 0 12px 22px rgba(15,23,42,0.10); filter: none !important; }
.meeting-card__cta.meeting-card__cta--soft:hover { background: rgba(var(--am-gold-rgb),0.18) !important; border-color: rgba(var(--am-gold-rgb),0.8) !important; color: var(--am-accent) !important; box-shadow: 0 14px 26px rgba(15,23,42,0.12); }
.meeting-card__cta.is-completed { background: rgba(var(--am-gold-rgb),0.12) !important; border-color: rgba(var(--am-gold-rgb),0.6) !important; color: var(--am-accent) !important; box-shadow: none; }
.meeting-card__cta.is-completed:hover { background: rgba(var(--am-gold-rgb),0.16) !important; transform: translateY(-1px); box-shadow: 0 10px 22px rgba(15,23,42,0.1); }
.meeting-card.completed { border-color: rgba(34,197,94,0.35); }
.meeting-card.cancelled { border-color: rgba(239,68,68,0.3); opacity: 0.88; }

.empty-state { padding: 40px 24px; border: 1px dashed #cbd5e1; border-radius: 20px; background: #ffffff; text-align: center; color: #64748b; }
.empty-state__icon { margin-bottom: 12px; font-size: 2.25rem; }
.empty-state__title { margin-bottom: 6px; color: #0f172a; font-size: 1.05rem; font-weight: 700; }
.empty-state__text { max-width: 520px; margin: 0 auto; line-height: 1.6; }

@media (max-width: 991px) { .meetings-hero { flex-direction: column; align-items: flex-start; } .meetings-hero__action { width: 100%; } .hero-action-btn { width: 100%; } }
@media (max-width: 767px) { .meetings-hero { padding: 22px 18px; border-radius: 18px; } .meetings-hero__title { font-size: 1.5rem; } }
@media (max-width: 576px) {
  .meeting-card__footer-actions { flex-wrap: wrap; }
  .meeting-card__footer-side-actions { width: 100%; }
  .meeting-card__side-btn { flex: 1 1 0; min-width: 0 !important; }
}

.meeting-modal .meeting-form, .minutes-modal .minutes-form { display: grid; grid-template-columns: repeat(2,1fr); gap: 14px; padding: 6px 0 2px; align-items: start; }
.meeting-modal .meeting-form .full, .minutes-modal .minutes-form .full { grid-column: 1 / -1; }
.meeting-modal .meeting-form .small-row { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
.minutes-modal .minutes-meta { display: inline-flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px; border: 1px solid rgba(148,163,184,0.22); background: rgba(248,250,252,0.92); color: #0f172a; font-weight: 700; }
.minutes-modal .minutes-meta__item { display: inline-flex; align-items: center; gap: 8px; min-width: 0; }
.minutes-modal .minutes-meta__divider { width: 1px; height: 18px; background: rgba(148,163,184,0.55); }
.minutes-modal .minutes-meta__ic { color: var(--am-accent); opacity: 0.9; }
.minutes-modal .minutes-panel { border-radius: 18px; border: 1px solid rgba(148,163,184,0.22); background: #ffffff; box-shadow: 0 14px 30px rgba(15,23,42,0.06); padding: 12px 12px 10px; }
.minutes-modal .minutes-panel__title { font-weight: 900; color: #0f172a; margin-bottom: 8px; }
.minutes-modal .minutes-panel textarea.form-control { margin-top: 0 !important; }
.minutes-modal .minutes-action { border-radius: 18px; border: 1px solid rgba(148,163,184,0.22); background: #ffffff; box-shadow: 0 14px 30px rgba(15,23,42,0.06); padding: 12px; }
.minutes-modal .minutes-action__header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.minutes-modal .minutes-action__title { font-weight: 900; color: #0f172a; }
.minutes-modal .minutes-action__add-row td { background: rgba(248,250,252,0.8); padding: 10px !important; }
.minutes-modal .minutes-action__add-btn { width: 100%; height: 40px; border-radius: 14px; border: 1px dashed rgba(197,155,58,0.6); background: rgba(197,155,58,0.08); color: var(--am-accent); font-weight: 900; display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: transform 0.12s ease, filter 0.12s ease, box-shadow 0.12s ease; }
.minutes-modal .minutes-action__add-btn:hover { filter: brightness(1.02); transform: translateY(-1px); box-shadow: 0 14px 26px rgba(15,23,42,0.12); }
.minutes-modal .minutes-action__add-btn:focus { outline: none; }
.minutes-modal .minutes-action__add-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--am-accent-ring), 0 14px 26px rgba(15,23,42,0.12); }
.minutes-modal .minutes-action__add-ic { opacity: 0.9; }
.minutes-modal .minutes-action__table { border-radius: 14px; overflow: hidden; border: 1px solid rgba(148,163,184,0.22); }
.minutes-modal .minutes-action__table .table thead th { background: rgba(197,155,58,0.08); color: #0f172a; font-weight: 900; }
.minutes-modal .minutes-action__remove { width: 34px; height: 34px; padding: 0 !important; border-radius: 12px !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; }
@media (max-width: 991px) { .minutes-modal .minutes-form { grid-template-columns: 1fr; } }

.input-icon__wrap { display: flex; align-items: stretch; border-radius: 12px; overflow: hidden; border: 1px solid rgba(var(--am-gold-rgb),0.55); background: #ffffff; box-shadow: 0 10px 18px rgba(15,23,42,0.06); }
.input-icon__control { flex: 1; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; font-size: 1rem; background: transparent !important; }
.input-icon__control[readonly] { cursor: pointer; }
.input-icon__suffix { width: 52px; border: 0; border-left: 1px solid rgba(var(--am-gold-rgb),0.55); color: #ffffff; display: inline-flex; align-items: center; justify-content: center; padding: 0; cursor: pointer; }
.input-icon__wrap[data-tone="primary"] .input-icon__suffix { background: linear-gradient(135deg, var(--am-accent), var(--am-gold)); }
.input-icon__wrap[data-tone="info"] .input-icon__suffix { background: linear-gradient(135deg, var(--am-gold), var(--am-accent)); }
.input-icon__wrap[data-tone="primary"], .input-icon__wrap[data-tone="info"] { border-color: rgba(var(--am-gold-rgb),0.65); }
.input-icon__suffix:hover { filter: brightness(1.03); }
.input-icon__suffix:focus { outline: none; box-shadow: 0 0 0 3px var(--am-accent-ring); }
.input-icon__ic { opacity: 0.88; }
.meeting-modal .small-row .input-icon__wrap[data-tone="info"] { border-color: #1d4ed8; background: #f3f4f6; box-shadow: none; }
.meeting-modal .small-row .input-icon__wrap[data-tone="info"] .input-icon__control { color: #6b7280; font-size: 1.15rem; font-weight: 500; letter-spacing: 0.02em; }
.meeting-modal .small-row .input-icon__wrap[data-tone="info"] .input-icon__suffix { background: transparent; color: #2563eb; border-left: 1px solid rgba(148,163,184,0.45); }
.meeting-modal .small-row .input-icon__wrap[data-tone="info"] .input-icon__suffix:hover { background: rgba(37,99,235,0.08); filter: none; }

.time-trigger { cursor: pointer; }
.time-trigger:disabled { cursor: not-allowed; }
.time-trigger[readonly] { cursor: pointer; }
.time-picker__backdrop { position: fixed; inset: 0; z-index: 20000; background: transparent; }
.time-picker { position: fixed; z-index: 20001; background: #f3f4f6; border: 1px solid rgba(148,163,184,0.38); border-radius: 10px; box-shadow: 0 16px 34px rgba(2,6,23,0.16); padding: 10px 10px 8px; }
.time-picker__wheels { display: grid; grid-template-columns: minmax(0,1fr) 16px minmax(0,1fr); align-items: center; gap: 8px; }
.time-picker__wheel { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 0; }
.time-picker__arrow { width: 100%; height: 24px; border: 0; background: transparent; color: #334155; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 6px; transition: background-color 0.12s ease, color 0.12s ease; }
.time-picker__arrow:hover { background: rgba(148,163,184,0.18); color: #0f172a; }
.time-picker__arrow:focus { outline: none; }
.time-picker__arrow:focus-visible { box-shadow: 0 0 0 3px rgba(59,130,246,0.28); }
.time-picker__digit-window { width: 52px; height: 40px; overflow: hidden; display: inline-flex; align-items: center; justify-content: center; }
.time-picker__digit { display: inline-block; min-width: 34px; text-align: center; color: #111827; font-size: 2.15rem; line-height: 1; font-weight: 500; }
.time-picker__separator { text-align: center; color: #111827; font-size: 2.05rem; line-height: 1; font-weight: 700; transform: translateY(1px); }
.time-picker__period-row { margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr; border: 1px solid rgba(100,116,139,0.5); border-radius: 7px; overflow: hidden; background: #ffffff; }
.time-picker__period-btn { height: 28px; border: 0; background: #ffffff; color: #1e40af; font-size: 0.8rem; line-height: 1; font-weight: 700; cursor: pointer; transition: background-color 0.12s ease, color 0.12s ease; }
.time-picker__period-btn + .time-picker__period-btn { border-left: 1px solid rgba(100,116,139,0.38); }
.time-picker__period-btn.is-active { background: #dbeafe; color: #1e3a8a; }
.time-picker__period-btn:focus { outline: none; }
.time-picker__period-btn:focus-visible { box-shadow: inset 0 0 0 2px rgba(30,64,175,0.35); }

.digit-slide-up-enter-active, .digit-slide-up-leave-active, .digit-slide-down-enter-active, .digit-slide-down-leave-active { transition: transform 0.18s ease, opacity 0.18s ease; }
.digit-slide-up-enter, .digit-slide-down-leave-to { transform: translateY(18px); opacity: 0; }
.digit-slide-up-leave-to, .digit-slide-down-enter { transform: translateY(-18px); opacity: 0; }

.meeting-modal .meeting-form, .minutes-modal .minutes-form { max-width: 100%; margin: 0; width: 100%; padding-left: 12px; padding-right: 12px; box-sizing: border-box; }
.meeting-modal .modal-body { padding: 18px 22px !important; }
.meeting-modal .meeting-form { padding-left: 20px; padding-right: 20px; }
.meeting-modal .form-label, .minutes-modal .form-label { display: block; font-weight: 600; margin-bottom: 6px; text-align: left; cursor: default; user-select: none; -webkit-user-select: none; }
.meeting-modal .required, .minutes-modal .required { color: #e11d48; margin-left: 0; }
.meeting-modal .full-field, .minutes-modal .full-field { grid-column: 1 / -1; }
.btn-save { min-width: 140px; border-radius: 10px !important; }

.meeting-modal .modal-actions-wrapper { padding-right: 48px !important; justify-content: flex-end !important; }
.meeting-modal .modal-actions-wrapper > .floating-action, .meeting-modal .modal-actions-wrapper > .floating-action + .floating-action { transform: translateY(-8px) scale(1) !important; box-shadow: 0 8px 20px rgba(15,23,42,0.12) !important; position: relative !important; z-index: 11000 !important; padding: 8px 14px !important; font-size: 0.9rem !important; min-width: 110px !important; border-radius: 8px !important; }
.meeting-modal .btn-save { min-width: 110px !important; }

[data-coreui-theme='dark'] .admin-meetings-page, body.c-dark-theme .admin-meetings-page { --am-bg: #0f1724; --am-surface: #162235; --am-border: #2f3e55; --am-text: #e8eef7; --am-muted: #b3c2dd; --am-accent-ring: rgba(118,164,255,0.22); color: var(--am-text); }
[data-coreui-theme='dark'] .meeting-card__surface, body.c-dark-theme .meeting-card__surface { background: linear-gradient(180deg, #1b2940 0%, #1b2940 var(--meeting-card-accent-height), #131f31 var(--meeting-card-accent-height), #0f1928 100%); border-color: rgba(59,76,101,0.95); border-top-color: rgba(var(--status-rgb),0.35); box-shadow: inset 0 0 0 1px rgba(var(--status-rgb),0.12), 0 16px 34px rgba(2,6,23,0.45); }
[data-coreui-theme='dark'] .meeting-card__participant-pill, body.c-dark-theme .meeting-card__participant-pill { background: rgba(15,23,42,0.58); border-color: rgba(var(--status-rgb),0.34); color: #dbe6f8; }
[data-coreui-theme='dark'] .meeting-card__title, body.c-dark-theme .meeting-card__title, [data-coreui-theme='dark'] .meeting-card__detail-value, body.c-dark-theme .meeting-card__detail-value, [data-coreui-theme='dark'] .meeting-card__agenda-body, body.c-dark-theme .meeting-card__agenda-body { color: #e8eef7; }
[data-coreui-theme='dark'] .meeting-card__detail-key, body.c-dark-theme .meeting-card__detail-key, [data-coreui-theme='dark'] .meeting-card__agenda-label, body.c-dark-theme .meeting-card__agenda-label { color: #b3c2dd; }
[data-coreui-theme='dark'] .meeting-card__agenda-body, body.c-dark-theme .meeting-card__agenda-body { background: rgba(15,23,42,0.6); border-color: rgba(58,75,103,0.65); }
[data-coreui-theme='dark'] .empty-state, body.c-dark-theme .empty-state { border-color: #3a4b67; background: #162235; color: #b9c7dd; }
[data-coreui-theme='dark'] .empty-state__title, body.c-dark-theme .empty-state__title { color: #edf3ff; }
[data-coreui-theme='dark'] .input-icon__wrap, body.c-dark-theme .input-icon__wrap, [data-coreui-theme='dark'] .time-picker, body.c-dark-theme .time-picker { background: #111827; border-color: #334155; }
[data-coreui-theme='dark'] .meeting-modal .small-row .input-icon__wrap[data-tone="info"], body.c-dark-theme .meeting-modal .small-row .input-icon__wrap[data-tone="info"] { border-color: #3b82f6; background: #0f172a; }
[data-coreui-theme='dark'] .meeting-modal .small-row .input-icon__wrap[data-tone="info"] .input-icon__control, body.c-dark-theme .meeting-modal .small-row .input-icon__wrap[data-tone="info"] .input-icon__control { color: #cbd5e1; }
[data-coreui-theme='dark'] .meeting-modal .small-row .input-icon__wrap[data-tone="info"] .input-icon__suffix, body.c-dark-theme .meeting-modal .small-row .input-icon__wrap[data-tone="info"] .input-icon__suffix { color: #93c5fd; border-left-color: #334155; }
[data-coreui-theme='dark'] .meeting-modal .small-row .input-icon__wrap[data-tone="info"] .input-icon__suffix:hover, body.c-dark-theme .meeting-modal .small-row .input-icon__wrap[data-tone="info"] .input-icon__suffix:hover { background: rgba(59,130,246,0.16); }
[data-coreui-theme='dark'] .time-picker__arrow, body.c-dark-theme .time-picker__arrow { color: #cbd5e1; }
[data-coreui-theme='dark'] .time-picker__arrow:hover, body.c-dark-theme .time-picker__arrow:hover { background: rgba(148,163,184,0.22); color: #f1f5f9; }
[data-coreui-theme='dark'] .time-picker__digit, body.c-dark-theme .time-picker__digit, [data-coreui-theme='dark'] .time-picker__separator, body.c-dark-theme .time-picker__separator { color: #f1f5f9; }
[data-coreui-theme='dark'] .time-picker__period-row, body.c-dark-theme .time-picker__period-row { border-color: #475569; background: #0f172a; }
[data-coreui-theme='dark'] .time-picker__period-btn, body.c-dark-theme .time-picker__period-btn { background: #0f172a; color: #93c5fd; }
[data-coreui-theme='dark'] .time-picker__period-btn + .time-picker__period-btn, body.c-dark-theme .time-picker__period-btn + .time-picker__period-btn { border-left-color: #475569; }
[data-coreui-theme='dark'] .time-picker__period-btn.is-active, body.c-dark-theme .time-picker__period-btn.is-active { background: #1e3a8a; color: #dbeafe; }
</style>

<style>
.meeting-modal, .minutes-modal {
  --am-bg: #fffaf2; --am-surface: #ffffff; --am-border: #eadfce; --am-text: #1f2937; --am-muted: #6b7280;
  --am-accent: #8b1212; --am-gold: #c59b3a; --am-gold-rgb: 197, 155, 58; --am-accent-ring: rgba(139,18,18,0.18);
  --am-control-font: 0.95rem; --am-control-line: 1.35; --am-control-weight: 500; --am-control-height: 42px;
  --am-control-pad-y: 9px; --am-control-pad-x: 12px; --am-icon-width: 50px; --am-radius: 11px;
  --am-placeholder: rgba(100,116,139,0.92); --am-placeholder-font: 0.88rem; --am-placeholder-weight: 400;
}
.meeting-modal label, .minutes-modal label, .meeting-modal .form-label, .minutes-modal .form-label { cursor: default !important; user-select: none !important; -webkit-user-select: none !important; }
.meeting-modal input.form-control, .meeting-modal select.form-control, .minutes-modal input.form-control, .minutes-modal select.form-control { height: var(--am-control-height) !important; min-height: var(--am-control-height) !important; padding: var(--am-control-pad-y) var(--am-control-pad-x) !important; border-radius: var(--am-radius) !important; font-size: var(--am-control-font) !important; line-height: var(--am-control-line) !important; font-weight: var(--am-control-weight) !important; box-sizing: border-box !important; }
.meeting-modal textarea.form-control, .minutes-modal textarea.form-control { min-height: var(--am-control-height) !important; padding: var(--am-control-pad-y) var(--am-control-pad-x) !important; border-radius: var(--am-radius) !important; font-size: var(--am-control-font) !important; line-height: var(--am-control-line) !important; font-weight: var(--am-control-weight) !important; box-sizing: border-box !important; }
.meeting-modal .modal-actions-wrapper, .minutes-modal .modal-actions-wrapper { padding-right: 16px !important; margin-right: 0 !important; justify-content: flex-end !important; }
.meeting-modal .modal-actions-wrapper > .floating-action, .minutes-modal .modal-actions-wrapper > .floating-action, .meeting-modal .modal-actions-wrapper > .floating-action + .floating-action, .minutes-modal .modal-actions-wrapper > .floating-action + .floating-action { transform: translateY(-8px) !important; box-shadow: 0 8px 20px rgba(15,23,42,0.12) !important; position: relative !important; z-index: 11000 !important; padding: 8px 14px !important; font-size: 0.9rem !important; min-width: 110px !important; border-radius: 8px !important; }
.meeting-modal .btn-save, .minutes-modal .btn-save { min-width: 110px !important; }
.meeting-modal .btn-cancel, .minutes-modal .btn-cancel { background: rgba(var(--am-gold-rgb),0.18) !important; border: 1px solid rgba(var(--am-gold-rgb),0.78) !important; color: var(--am-accent) !important; font-weight: 700 !important; opacity: 1 !important; }
.meeting-modal .btn-cancel:hover, .minutes-modal .btn-cancel:hover { background: rgba(var(--am-gold-rgb),0.26) !important; filter: none !important; }
.meeting-modal .modal-header, .minutes-modal .modal-header { background: linear-gradient(135deg, var(--am-accent) 0%, var(--am-gold) 115%); color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.18) !important; }
.meeting-modal .modal-content, .minutes-modal .modal-content { border-radius: 16px !important; overflow: hidden; }
.meeting-modal .modal-header .modal-title, .minutes-modal .modal-header .modal-title { color: #ffffff !important; font-weight: 900; }
.meeting-modal__header-actions { display: inline-flex; align-items: center; gap: 10px; }
.meeting-modal__cancel-meeting { border-radius: 10px !important; font-weight: 900 !important; border-color: rgba(255,255,255,0.5) !important; background: rgba(255,255,255,0.12) !important; color: #ffffff !important; box-shadow: 0 10px 18px rgba(15,23,42,0.16); }
.meeting-modal__cancel-meeting:hover { background: rgba(255,255,255,0.18) !important; filter: none !important; }
.meeting-modal .close, .minutes-modal .close, .meeting-modal .modal-header button.close, .minutes-modal .modal-header button.close { color: #ffffff !important; opacity: 0.92 !important; text-shadow: none !important; }
.meeting-modal .close:hover, .minutes-modal .close:hover, .meeting-modal .modal-header button.close:hover, .minutes-modal .modal-header button.close:hover { opacity: 1 !important; }
.meeting-modal .btn-save, .minutes-modal .btn-save { background: linear-gradient(135deg, var(--am-accent) 0%, var(--am-gold) 115%) !important; border-color: rgba(255,255,255,0.18) !important; color: #ffffff !important; }
.meeting-modal .btn-save:hover, .minutes-modal .btn-save:hover { filter: brightness(1.04); }
.meeting-modal .required, .minutes-modal .required { color: #e11d48 !important; margin-left: 0; }
.meeting-modal .input-icon__wrap, .minutes-modal .input-icon__wrap { display: flex; align-items: stretch; min-height: var(--am-control-height); border-radius: var(--am-radius); overflow: hidden; border: 1px solid rgba(var(--am-gold-rgb),0.55); background: #ffffff; box-shadow: 0 10px 18px rgba(15,23,42,0.06); }
.meeting-modal .input-icon__control, .minutes-modal .input-icon__control { flex: 1; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; font-size: 1rem; background: transparent !important; }
.meeting-modal .input-icon__control[readonly], .minutes-modal .input-icon__control[readonly] { cursor: pointer; }
.meeting-modal .input-icon__suffix, .minutes-modal .input-icon__suffix { width: var(--am-icon-width); border: 0; border-left: 1px solid rgba(var(--am-gold-rgb),0.55); color: #ffffff; display: inline-flex; align-items: center; justify-content: center; padding: 0; cursor: pointer; }
.meeting-modal .input-icon__wrap[data-tone="primary"] .input-icon__suffix, .minutes-modal .input-icon__wrap[data-tone="primary"] .input-icon__suffix { background: linear-gradient(135deg, var(--am-accent), var(--am-gold)); }
.meeting-modal .input-icon__wrap[data-tone="info"] .input-icon__suffix, .minutes-modal .input-icon__wrap[data-tone="info"] .input-icon__suffix { background: linear-gradient(135deg, var(--am-gold), var(--am-accent)); }
.meeting-modal .input-icon__wrap[data-tone="primary"], .minutes-modal .input-icon__wrap[data-tone="primary"], .meeting-modal .input-icon__wrap[data-tone="info"], .minutes-modal .input-icon__wrap[data-tone="info"] { border-color: rgba(var(--am-gold-rgb),0.65); }
.meeting-modal .form-control, .minutes-modal .form-control, .meeting-modal input.form-control, .minutes-modal input.form-control, .meeting-modal textarea.form-control, .minutes-modal textarea.form-control, .meeting-modal select.form-control, .minutes-modal select.form-control { border-color: rgba(var(--am-gold-rgb),0.55) !important; }
.meeting-modal .form-control:focus, .minutes-modal .form-control:focus, .meeting-modal input.form-control:focus, .minutes-modal input.form-control:focus, .meeting-modal textarea.form-control:focus, .minutes-modal textarea.form-control:focus { border-color: rgba(var(--am-gold-rgb),0.88) !important; box-shadow: 0 0 0 3px rgba(var(--am-gold-rgb),0.18) !important; }
.meeting-modal .form-control::placeholder, .minutes-modal .form-control::placeholder, .meeting-modal .input-icon__control::placeholder, .minutes-modal .input-icon__control::placeholder { color: var(--am-placeholder) !important; opacity: 1 !important; font-size: var(--am-placeholder-font) !important; line-height: var(--am-control-line) !important; font-weight: var(--am-placeholder-weight) !important; }
.meeting-modal .multiselect__placeholder, .minutes-modal .multiselect__placeholder { color: var(--am-placeholder) !important; opacity: 1 !important; font-size: var(--am-placeholder-font) !important; }
.meeting-modal .multiselect__tags, .minutes-modal .multiselect__tags { min-height: var(--am-control-height) !important; padding: var(--am-control-pad-y) calc(var(--am-icon-width) + 2px) var(--am-control-pad-y) var(--am-control-pad-x) !important; border-color: rgba(var(--am-gold-rgb),0.55) !important; border-radius: var(--am-radius) !important; color: var(--am-text) !important; background: #ffffff !important; background-image: none !important; box-sizing: border-box !important; }
.meeting-modal .multiselect:not(.multiselect--multiple) .multiselect__tags, .minutes-modal .multiselect:not(.multiselect--multiple) .multiselect__tags { height: var(--am-control-height) !important; }
.meeting-modal .multiselect__input, .minutes-modal .multiselect__input { height: auto !important; min-height: 0 !important; padding: 0 !important; background: transparent !important; background-image: none !important; }
.meeting-modal .multiselect__single, .minutes-modal .multiselect__single { background-image: none !important; }
.meeting-modal .multiselect, .minutes-modal .multiselect { font-size: var(--am-control-font) !important; line-height: var(--am-control-line) !important; font-weight: var(--am-control-weight) !important; }
.meeting-modal .multiselect__single, .minutes-modal .multiselect__single, .meeting-modal .multiselect__input, .minutes-modal .multiselect__input { font-size: inherit !important; line-height: inherit !important; font-weight: inherit !important; color: var(--am-text) !important; }
.meeting-modal .multiselect__select, .minutes-modal .multiselect__select { width: var(--am-icon-width) !important; height: calc(100% - 2px) !important; top: 1px !important; right: 1px !important; border-left: 1px solid rgba(var(--am-gold-rgb),0.55) !important; background: linear-gradient(135deg, var(--am-accent), var(--am-gold)) !important; border-radius: 0 calc(var(--am-radius) - 1px) calc(var(--am-radius) - 1px) 0 !important; box-sizing: border-box !important; transform: none !important; }
.meeting-modal .multiselect--active .multiselect__tags, .minutes-modal .multiselect--active .multiselect__tags { border-bottom-left-radius: 0 !important; border-bottom-right-radius: 0 !important; border-color: rgba(var(--am-gold-rgb),0.88) !important; box-shadow: 0 0 0 3px rgba(var(--am-gold-rgb),0.18) !important; }
.meeting-modal .multiselect--active .multiselect__select, .minutes-modal .multiselect--active .multiselect__select { border-bottom-right-radius: 0 !important; }
.meeting-modal .multiselect__content-wrapper, .minutes-modal .multiselect__content-wrapper { z-index: 12000 !important; max-height: 260px !important; overflow-y: auto !important; border: 1px solid rgba(var(--am-gold-rgb),0.55) !important; border-top: 0 !important; border-radius: 0 0 var(--am-radius) var(--am-radius) !important; box-shadow: 0 18px 40px rgba(15,23,42,0.14) !important; }
.meeting-modal .multiselect__select::before, .minutes-modal .multiselect__select::before { content: "" !important; position: absolute; top: 50%; left: 50%; width: 0; height: 0; border-style: solid; border-width: 6px 6px 0; border-color: rgba(255,255,255,0.92) transparent transparent !important; transition: transform 0.14s ease; transform: translate(-50%, -90%) rotate(0deg); pointer-events: none; }
.meeting-modal .multiselect--active .multiselect__select::before, .minutes-modal .multiselect--active .multiselect__select::before { transform: translate(-50%, -90%) rotate(180deg); }
.meeting-modal .input-icon__suffix:hover, .minutes-modal .input-icon__suffix:hover { filter: brightness(1.03); }
.meeting-modal .input-icon__ic, .minutes-modal .input-icon__ic { opacity: 0.88; }
[data-coreui-theme='dark'] .meeting-modal .modal-content, body.c-dark-theme .meeting-modal .modal-content, [data-coreui-theme='dark'] .minutes-modal .modal-content, body.c-dark-theme .minutes-modal .modal-content { background: #162235 !important; border-color: #2f3e55 !important; }
[data-coreui-theme='dark'] .meeting-modal .modal-body, body.c-dark-theme .meeting-modal .modal-body, [data-coreui-theme='dark'] .minutes-modal .modal-body, body.c-dark-theme .minutes-modal .modal-body, [data-coreui-theme='dark'] .meeting-modal .modal-footer, body.c-dark-theme .meeting-modal .modal-footer, [data-coreui-theme='dark'] .minutes-modal .modal-footer, body.c-dark-theme .minutes-modal .modal-footer { background: #1a2739 !important; color: #e7eeff !important; border-color: #2f3e55 !important; }
[data-coreui-theme='dark'] .meeting-modal .form-label, body.c-dark-theme .meeting-modal .form-label, [data-coreui-theme='dark'] .minutes-modal .form-label, body.c-dark-theme .minutes-modal .form-label, [data-coreui-theme='dark'] .minutes-modal .minutes-panel__title, body.c-dark-theme .minutes-modal .minutes-panel__title, [data-coreui-theme='dark'] .minutes-modal .minutes-action__title, body.c-dark-theme .minutes-modal .minutes-action__title { color: #dce7fb !important; }
[data-coreui-theme='dark'] .meeting-modal .form-control, body.c-dark-theme .meeting-modal .form-control, [data-coreui-theme='dark'] .minutes-modal .form-control, body.c-dark-theme .minutes-modal .form-control, [data-coreui-theme='dark'] .meeting-modal .input-icon__wrap, body.c-dark-theme .meeting-modal .input-icon__wrap, [data-coreui-theme='dark'] .minutes-modal .input-icon__wrap, body.c-dark-theme .minutes-modal .input-icon__wrap, [data-coreui-theme='dark'] .meeting-modal .multiselect__tags, body.c-dark-theme .meeting-modal .multiselect__tags, [data-coreui-theme='dark'] .minutes-modal .multiselect__tags, body.c-dark-theme .minutes-modal .multiselect__tags, [data-coreui-theme='dark'] .meeting-modal .multiselect__content-wrapper, body.c-dark-theme .meeting-modal .multiselect__content-wrapper, [data-coreui-theme='dark'] .minutes-modal .multiselect__content-wrapper, body.c-dark-theme .minutes-modal .multiselect__content-wrapper { background: #121c2a !important; border-color: #3a4b67 !important; color: #e7eeff !important; }
[data-coreui-theme='dark'] .meeting-modal .multiselect__option, body.c-dark-theme .meeting-modal .multiselect__option, [data-coreui-theme='dark'] .minutes-modal .multiselect__option, body.c-dark-theme .minutes-modal .multiselect__option, [data-coreui-theme='dark'] .meeting-modal .multiselect__single, body.c-dark-theme .meeting-modal .multiselect__single, [data-coreui-theme='dark'] .minutes-modal .multiselect__single, body.c-dark-theme .minutes-modal .multiselect__single, [data-coreui-theme='dark'] .meeting-modal .multiselect__input, body.c-dark-theme .meeting-modal .multiselect__input, [data-coreui-theme='dark'] .minutes-modal .multiselect__input, body.c-dark-theme .minutes-modal .multiselect__input { background: transparent !important; color: #e7eeff !important; }
</style>
