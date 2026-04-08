<template>
  <div
    class="research-form"
    :class="{
      'research-form--has-admin-actions': showAdminFooterBar,
      'research-form--draft': isDraftStatus && !isAdminView,
      'research-form--dark': isDarkTheme
    }"
  >
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <h2 class="mb-4">{{ pageText.pageTitle }}</h2>
          <div v-if="isAdminView" class="admin-view-banner"
            style="background:#e8f4ff;border-left:4px solid #1a73e8;padding:10px 16px;margin-bottom:16px;border-radius:4px;font-size:14px;color:#1a73e8">
            {{ pageText.adminViewBanner }}
          </div>
        </div>
      </div>
 
      <!-- Research Team Form Component -->
      <ResearchTeamForm
        ref="researchTeamForm"
        @team-changed="syncResearchTeamData"
        :is-read-only="mainFormReadOnly"
        :current-status="currentStatus"
        :allow-auto-prefill="true"
        :revision-highlight-sections="adminRevisionResearchTeamSectionKeys"
      />

      <!-- Project Details Form Component -->
      <ProjectDetailsForm
        ref="projectDetailsForm"
        :is-read-only="mainFormReadOnly"
        :current-status="currentStatus"
        :proposal-id="viewProposalId"
        :disable-project-title-section="shouldDisableProjectTitleSection"
        :revision-highlight-sections="adminRevisionProjectSectionKeys"
        :funding-budget-config="fundingBudgetConfig"
        :budget-multiplier-config="budgetMultiplierConfig"
        @form-changed="syncProjectDetailsData"
        @budget-changed="handleBudgetAutoSave"
        @budget-sticky-summary-update="handleBudgetStickySummaryUpdate"
        @budget-attachment-upload="handleBudgetAttachmentUpload"
        @budget-attachment-open="handleBudgetAttachmentOpen"
        @budget-attachment-meta-change="handleBudgetAttachmentMetaChange"
        @budget-attachment-remove="handleBudgetAttachmentRemove"
        @research-standard-upload="handleResearchStandardUpload"
        @research-standard-open="handleResearchStandardOpen"
        @research-standard-remove="handleResearchStandardRemove"
      />

      <BudgetStickyOverlay
        :visible="shouldEnableBudgetStickyOverlay && stickyOverlaySummaryModel.visible"
        :summary="stickyOverlaySummaryModel"
        :is-dark="isDarkTheme"
        @jump-to-error="jumpToBudgetStickyIssue"
      />

      <!-- File Management Component -->
      <FileManagement
        ref="fileManagement"
        :files="files"
        :is-read-only="mainFormReadOnly"
        @upload="handleUpload"
        @open="openFile"
        @update:files="handleFilesUpdate"
        @remove="removeFile"
      />

      <!-- Signature Card Component -->
      <SignatureCard
        ref="signatureCard"
        v-model="signatureData"
        :project-leader="researchTeamData.projectLeader"
        :co-researchers="researchTeamData.coResearchers"
        :advisors="researchTeamData.advisors"
        :is-read-only="mainFormReadOnly"
      />

      <div v-if="revisionDiffSummaryForDisplay && revisionDiffSummaryForDisplay.sections && revisionDiffSummaryForDisplay.sections.length" class="card mt-3 mb-3 revision-diff-summary-card">
        <div class="card-header d-flex justify-content-between align-items-center flex-wrap" style="gap:8px;">
          <strong>สรุปความต่างก่อน/หลังการแก้ไข</strong>
          <span class="text-muted small">
            รอบ {{ revisionDiffSummaryForDisplay.roundNo || '-' }}
            <span v-if="revisionDiffSummaryForDisplay.generatedAt"> • {{ formatReviewDateTime(revisionDiffSummaryForDisplay.generatedAt) }}</span>
          </span>
        </div>
        <div class="card-body">
          <div
            v-for="section in revisionDiffSummaryForDisplay.sections"
            :key="`revision-diff-${section.sectionKey}`"
            class="revision-diff-item"
          >
            <div class="revision-diff-item__header">
              <button
                type="button"
                class="btn btn-link p-0 align-baseline revision-diff-item__link"
                @click="goToFeedbackSection({ sectionKey: section.sectionKey })"
              >
                <CIcon name="cil-chevron-right" class="mr-1" /> {{ revisionDiffSectionLabel(section.sectionKey, section.sectionLabel) }}
              </button>
            </div>
            <div class="row">
              <div class="col-md-6 mb-2">
                <div class="revision-diff-box revision-diff-box--before">
                  <div class="revision-diff-box__title">ก่อนแก้ไข</div>
                  <div class="revision-diff-box__body">{{ section.beforeSummary || '-' }}</div>
                </div>
              </div>
              <div class="col-md-6 mb-2">
                <div class="revision-diff-box revision-diff-box--after">
                  <div class="revision-diff-box__title">หลังแก้ไข</div>
                  <div class="revision-diff-box__body">{{ section.afterSummary || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showReadonlyChairmanChecklistCard" class="card mt-3 mb-3 review-summary-card chairman-checklist-readonly">
        <div class="card-header">
          <strong>สรุป Checklist จากประธาน (Read Only)</strong>
        </div>
        <div class="card-body">
          <div v-if="readonlyChairmanChecklistLoading" class="text-center py-3">
            <CSpinner size="sm" color="primary" />
            <span class="text-muted ml-2">กำลังโหลดผลการประเมินจากประธาน...</span>
          </div>

          <CAlert v-else-if="readonlyChairmanChecklistError" color="warning" show>
            ไม่สามารถโหลดผลการประเมินได้: {{ readonlyChairmanChecklistError }}
          </CAlert>

          <div v-else>
            <div
              v-for="card in chairmanReviewCards"
              :key="'readonly-chairman-' + card.reviewId"
              class="card mb-2 chairman-review-card"
            >
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6 mb-1"><strong>ผู้ประเมิน:</strong> {{ reviewerName(card.review) }}</div>
                  <div class="col-md-6 mb-1"><strong>วันที่ส่ง:</strong> {{ formatReviewDateTime(card.review.submittedAt || card.review.updatedAt) }}</div>
                  <div class="col-md-6 mb-1"><strong>ผลการพิจารณา:</strong> {{ decisionLabel(card.review.decision) }}</div>
                  <div class="col-md-6 mb-1"><strong>Checklist ที่เลือก:</strong> {{ card.checkedCount }}/{{ card.totalItems }} ข้อ</div>
                  <div class="col-md-6 mb-1">
                    <strong>สถานะผลประเมิน:</strong>
                    <CBadge :color="reviewModerationColor(card.review)" class="ml-1">{{ reviewModerationLabel(card.review) }}</CBadge>
                  </div>
                  <div class="col-md-12 mb-2"><strong>ประเภททุนอ้างอิง:</strong> {{ card.fundingTypeLabel }}</div>
                  <div class="col-12 mb-2"><strong>สรุปข้อเสนอแนะ:</strong> {{ card.review.summaryComment || '-' }}</div>
                </div>

                <div v-if="card.sections.length" class="chairman-review-card__sections">
                  <div
                    v-for="section in card.sections"
                    :key="'readonly-chairman-' + card.reviewId + '-' + section.sectionKey"
                    class="chairman-review-card__section"
                  >
                    <div class="d-flex justify-content-between align-items-start flex-wrap" style="gap: 8px;">
                      <div class="font-weight-bold">{{ section.sectionLabel }}</div>
                      <CBadge color="warning" class="chairman-review-card__badge">{{ section.checkedCount }}/{{ section.totalItems }} ข้อ</CBadge>
                    </div>
                    <div v-if="section.items.length" class="mt-2">
                      <div class="chairman-review-card__table">
                        <div class="chairman-review-card__table-head">
                          <div class="chairman-review-card__th-no">#</div>
                          <div class="chairman-review-card__th-label">{{ $t('chairman.proposalDetail.checklistItemLabel') }}</div>
                          <div class="chairman-review-card__th-result">{{ $t('chairman.proposalDetail.checklistAnswer') }}</div>
                        </div>
                        <div
                          v-for="(item, itemIndex) in section.items"
                          :key="'readonly-chairman-' + card.reviewId + '-' + section.sectionKey + '-' + item.itemKey"
                          class="chairman-review-card__row"
                        >
                          <div class="chairman-review-card__cell-no">{{ itemIndex + 1 }}</div>
                          <div class="chairman-review-card__cell-label">{{ item.label }}</div>
                          <div class="chairman-review-card__cell-result">
                            <span class="chairman-review-card__result" :class="item.checked ? 'is-pass' : 'is-fail'">
                              <CIcon :name="item.checked ? 'cil-check-circle' : 'cil-x-circle'" class="chairman-review-card__result-icon" />
                              <span class="chairman-review-card__result-text">{{ item.checked ? $t('chairman.proposalDetail.checklistPass') : $t('chairman.proposalDetail.checklistFail') }}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-else class="text-muted small mt-2">
                      ไม่มีรายการ checklist ในหัวข้อนี้
                    </div>
                  </div>
                </div>
                <div v-else class="text-muted small">
                  ไม่พบ payload checklist จากผลประเมินของประธาน
                </div>

                <div
                  v-if="isAdminView && isReviewPendingAdminAcceptance(card.review)"
                  class="d-flex justify-content-end flex-wrap mt-3"
                  style="gap: 8px;"
                >
                  <CButton
                    size="sm"
                    color="success"
                    :disabled="isReviewModerationBusy(card.review)"
                    @click="acceptProposalReview(card.review)"
                  >
                    <CIcon name="cil-check-circle" class="mr-1" /> {{ isReviewModerationBusy(card.review) ? 'กำลังบันทึก...' : 'รับผลประเมิน' }}
                  </CButton>
                  <CButton
                    size="sm"
                    color="danger"
                    variant="outline"
                    :disabled="isReviewModerationBusy(card.review)"
                    @click="rejectProposalReview(card.review)"
                  >
                    <CIcon name="cil-x-circle" class="mr-1" /> ไม่รับผลประเมิน
                  </CButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isAdminView" ref="committeeReviewsSection" class="card mt-3 mb-5">
        <div class="card-header">
          <strong>ผลการประเมินจากคณะกรรมการ</strong>
        </div>
        <div class="card-body">
          <div v-if="reviewsLoading" class="text-center py-3">
            <CSpinner size="sm" color="primary" />
            <span class="text-muted ml-2">กำลังโหลดผลการประเมิน...</span>
          </div>

          <CAlert v-else-if="reviewsError" color="warning" show>
            ไม่สามารถโหลดผลการประเมินได้: {{ reviewsError }}
          </CAlert>

          <div v-else>
            <div class="card mb-3 review-summary-card" style="background: #f8fafc;">
              <div class="card-body">
                <h6 class="mb-3">Admin Review Summary</h6>
                <div class="row">
                  <div class="col-md-4 mb-1"><strong>จำนวนกรรมการทั้งหมด:</strong> {{ assignedCommitteeCount }}</div>
                  <div class="col-md-4 mb-1"><strong>รับผลประเมินแล้ว:</strong> {{ submittedReviewCount }}</div>
                  <div class="col-md-4 mb-1"><strong>รอแอดมินรับผล:</strong> {{ pendingAdminCommitteeReviewCount }}</div>
                  <div class="col-md-4 mb-1"><strong>รอการประเมิน:</strong> {{ pendingReviewCount }}</div>
                  <div class="col-md-4 mb-1"><strong>ค่าเฉลี่ยคะแนนรวม:</strong> {{ averageSubmittedScore }}</div>
                  <div class="col-md-4 mb-1"><strong>อนุมัติ:</strong> {{ approveCount }}</div>
                  <div class="col-md-4 mb-1"><strong>ขอแก้ไข:</strong> {{ reviseCount }}</div>
                  <div class="col-md-4 mb-1"><strong>ไม่อนุมัติ:</strong> {{ rejectCount }}</div>
                </div>

                <CAlert v-if="hasMixedOutcomes" color="warning" show class="mt-2 mb-0">
                  ผลประเมินจากคณะกรรมการมีความเห็นไม่สอดคล้องกัน (Mixed outcomes)
                </CAlert>
                <CAlert v-if="pendingReviewCount > 0" color="info" show class="mt-2 mb-0">
                  ยังมีกรรมการที่ยังไม่ได้ส่งผลประเมิน {{ pendingReviewCount }} คน
                </CAlert>
              </div>
            </div>

            <CAlert
              v-if="isAdminRevisionSubmissionView && adminRevisionHighlightSections.length"
              color="danger"
              show
              class="mt-2"
            >
              <div class="font-weight-bold mb-1">นักวิจัยส่งเอกสารแก้ไขกลับมาแล้ว</div>
              <div class="mb-1">หัวข้อต่อไปนี้ถูกไฮไลต์พื้นหลังสีแดงในแบบฟอร์ม:</div>
              <ul class="mb-0 pl-3">
                <li
                  v-for="section in adminRevisionHighlightSections"
                  :key="`admin-revision-highlight-${section.sectionKey}`"
                >
                  <button
                    type="button"
                    class="btn btn-link p-0 align-baseline admin-revision-link"
                    @click="goToFeedbackSection({ sectionKey: section.sectionKey })"
                  >
                    <CIcon name="cil-chevron-right" class="mr-1" /> {{ (section.meta && section.meta.sectionLabel) || section.sectionKey }}
                  </button>
                </li>
              </ul>
            </CAlert>

            <div v-if="!isAnnouncedStatus" class="card mb-3">
              <div class="card-body">
                <h6 class="mb-3">Admin Final Decision</h6>
                <CSelect
                  :value="adminFinalDecision"
                  :options="adminDecisionOptions"
                  @change="onAdminFinalDecisionChange"
                />
                <CTextarea
                  class="mt-2"
                  label="หมายเหตุจากแอดมิน"
                  rows="3"
                  :value.sync="adminFinalNote"
                  placeholder="ระบุเหตุผลหรือข้อสรุปสำหรับการตัดสินใจ"
                />
                <div class="d-flex justify-content-end mt-2">
                  <CButton
                    v-if="isAdminView && isRejectedStatus"
                    color="warning"
                    class="mr-2"
                    :disabled="reopeningRejected"
                    @click="reopenRejectedForRevision"
                  >
                    <CIcon name="cil-pencil" class="mr-1" /> {{ reopeningRejected ? 'กำลังเปิดให้แก้ไข...' : 'เปิดให้แก้ไขอีกครั้ง' }}
                  </CButton>
                  <CButton
                    color="primary"
                    :disabled="savingAdminDecision || !adminFinalDecision"
                    @click="saveAdminFinalDecision"
                  >
                    <CIcon name="cil-save" class="mr-1" /> {{ savingAdminDecision ? 'กำลังบันทึก...' : 'บันทึกผลการตัดสินใจ' }}
                  </CButton>
                </div>
              </div>
            </div>

            <div v-if="!groupedReviews.length" class="text-muted">
              ยังไม่มีผลการประเมินจากคณะกรรมการ
            </div>

            <div v-else>
              <div v-for="group in groupedReviews" :key="`review-round-${group.roundNo}`" class="mb-3">
                <h6 class="mb-2">รอบที่ {{ group.roundNo }}</h6>
                <div v-for="review in group.reviews" :key="review._id" class="card mb-2">
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-6 mb-1"><strong>ผู้ประเมิน:</strong> {{ reviewerName(review) }}</div>
                      <div class="col-md-6 mb-1"><strong>คะแนนรวม:</strong> {{ review.totalScore !== null && review.totalScore !== undefined ? review.totalScore : '-' }}</div>
                      <div class="col-md-6 mb-1"><strong>ผลการพิจารณา:</strong> {{ decisionLabel(review.decision) }}</div>
                      <div class="col-md-6 mb-1"><strong>วันที่ส่ง:</strong> {{ formatReviewDateTime(review.submittedAt || review.updatedAt) }}</div>
                      <div class="col-md-6 mb-1">
                        <strong>สถานะผลประเมิน:</strong>
                        <CBadge :color="reviewModerationColor(review)" class="ml-1">{{ reviewModerationLabel(review) }}</CBadge>
                      </div>
                      <div class="col-12 mb-1"><strong>สรุปข้อเสนอแนะ:</strong> {{ review.summaryComment || '-' }}</div>
                    </div>
                    <div
                      v-if="isReviewPendingAdminAcceptance(review)"
                      class="d-flex justify-content-end flex-wrap mt-2"
                      style="gap: 8px;"
                    >
                      <CButton
                        size="sm"
                        color="success"
                        :disabled="isReviewModerationBusy(review)"
                        @click="acceptProposalReview(review)"
                      >
                        <CIcon name="cil-check-circle" class="mr-1" /> {{ isReviewModerationBusy(review) ? 'กำลังบันทึก...' : 'รับผลประเมิน' }}
                      </CButton>
                      <CButton
                        size="sm"
                        color="danger"
                        variant="outline"
                        :disabled="isReviewModerationBusy(review)"
                        @click="rejectProposalReview(review)"
                      >
                        <CIcon name="cil-x-circle" class="mr-1" /> ไม่รับผลประเมิน
                      </CButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FeedbackSection
        v-if="!isAdminView && viewProposalId && isRevisionRequested"
        ref="userFeedbackSection"
        v-bind="feedbackSectionBindings"
      />

      <div v-if="!isAdminView && viewProposalId" class="card mt-3 mb-5">
        <div class="card-body">
          <CAlert v-if="isRevisionRequested" color="warning" show class="mb-3">
            {{ pageText.revisionRequestedAlert }}
          </CAlert>
          <CAlert v-else-if="isRejectedStatus" color="danger" show class="mb-3">
            {{ pageText.rejectedAlert }}
          </CAlert>
          <CAlert v-else-if="isApprovedStatus" color="success" show class="mb-3">
            {{ pageText.approvedAlert }}
          </CAlert>

          <div v-if="isRevisionRequested && pendingFeedbackSectionsForResubmit.length" class="alert alert-info mb-3">
            {{ pageText.pendingRevisionSectionsAlert }}
            <ul class="mb-0 mt-2 pl-3">
              <li
                v-for="section in pendingFeedbackSectionsForResubmit"
                :key="`pending-feedback-${section.sectionKey}`"
              >
                {{ (section.meta && section.meta.sectionLabel) || section.sectionKey }}
              </li>
            </ul>
          </div>

          <div v-if="isRevisionRequested" class="d-flex justify-content-end revision-actions">
            <CButton
              class="revision-action-btn revision-action-btn--save"
              color="secondary"
              :disabled="savingRevision"
              @click="saveRevisionChanges"
            >
              <CIcon name="cil-pencil" class="mr-1" /> {{ savingRevision ? pageText.savingLabel : pageText.saveRevisionButton }}
            </CButton>
            <CButton
              class="revision-action-btn revision-action-btn--submit"
              color="primary"
              :disabled="submittingRevision || !canResubmitRevision"
              @click="resubmitRevision"
            >
              <CIcon name="cil-paper-plane" class="mr-1" /> {{ submittingRevision ? pageText.submittingLabel : pageText.resubmitButton }}
            </CButton>
          </div>
        </div>
      </div>
      <!-- Footer with action buttons -->
      <div v-if="showFooterBar" class="footer-fixed" :style="{ left: isSidebarOpen ? '256px' : '0px' }">
        <div class="d-flex justify-content-between align-items-center w-100 px-2">

          <div class="d-flex align-items-center" style="gap: 12px;">
            <span class="me-2 fw-bold text-muted">{{ pageText.statusLabel }}</span>
            <StatusBadge :status="currentStatus" role="researcher" :round-source="loadedProposal" />
            <span
              v-if="isAutoSaving || isDraftSaving"
              class="save-indicator save-indicator--saving"
              title="Saving"
              aria-label="Saving"
            >
              <CIcon :content="$options.icons.cilHistory" class="save-indicator-icon save-indicator-icon--spin" />
            </span>
            <span
              v-else-if="isDraftSaved"
              class="save-indicator save-indicator--saved"
              title="Saved"
              aria-label="Saved"
            >
              <CIcon :content="$options.icons.cilCheck" class="save-indicator-icon" />
            </span>
            <span
              v-if="isAutoSaving || isDraftSaving"
              class="save-hint"
              :title="pageText.autoSaveTitle"
            >
              {{ pageText.savingHint }}
            </span>
          </div>

          <div class="d-flex justify-content-end" style="gap: 12px;">
            <div v-if="showSubmitButton" class="px-3 py-2 rounded text-success fw-bold d-flex align-items-center"
              style="background-color: #d1e7dd; border: 1px solid #badbcc;">
              <i class="cil-check-circle me-2"></i>
              {{ currentStatus === 'pending_confirm' ? pageText.pendingConfirmSubmitted : pageText.submittedBadge }}
            </div>

            <button
              v-if="showDeleteDraftButton"
              type="button"
              class="btn btn-lg text-white"
              style="background-color: #dc2626; border-color: #dc2626;"
              @click="deleteDraftProposal"
            >
              <CIcon :content="$options.icons.cilTrash" class="me-2" />
              {{ pageText.deleteProjectButton }}
            </button>

            <button v-if="showDraftActions" type="button" class="btn btn-lg text-white"
              style="background-color: #8b1212; border-color: #8b1212;" @click="submitProject">
              <CIcon :content="$options.icons.cilPaperPlane" class="me-2" />
              {{ pageText.submitProjectButton }}
            </button>

            <button
              v-if="false"
              type="button"
              class="btn btn-lg text-white"
              style="background-color: #dc2626; border-color: #dc2626;"
              @click="deleteDraftProposal"
            >
              <CIcon :content="$options.icons.cilTrash" class="me-2" />
              ลบโครงการ
            </button>

            <button v-if="showExportPdfButton" type="button" class="btn btn-lg text-white"
              style="background-color: #b58522; border-color: #b58522;" :disabled="isExportingPdf" @click="exportProposalPdf">
              <i v-if="isExportingPdf" class="cil-loop export-pdf-icon--spin" aria-hidden="true"></i>
              <i v-else class="cil-cloud-download" aria-hidden="true"></i>
              {{ isExportingPdf ? pageText.exportingPdf : pageText.exportPdf }}
            </button>
          </div>

        </div>
      </div>

      <!-- Admin footer actions (Detail view) -->
      <div v-if="showAdminFooterBar" class="footer-fixed admin-footer-fixed" :style="{ left: isSidebarOpen ? '256px' : '0px' }">
        <div class="d-flex justify-content-between align-items-center w-100 px-2 flex-wrap" style="gap: 12px;">
          <div class="d-flex align-items-center" style="gap: 12px;">
            <span class="fw-bold text-muted">{{ $t('researchFormAdminFooter.actionLabel') }}</span>
            <StatusBadge :status="currentStatus" role="admin" :round-source="loadedProposal" />
          </div>

          <div class="d-flex justify-content-end flex-wrap" style="gap: 10px;">
            <template v-if="!isAnnouncedStatus">
              <CButton color="warning" size="sm" @click="openAdminStatusModal"><CIcon name="cil-loop-circular" class="mr-1" /> {{ $t('researchFormAdminFooter.buttons.changeStatus') }}</CButton>
              <CButton color="success" size="sm" @click="openAdminCommitteeModal">
                <CIcon name="cil-user-follow" class="mr-1" /> {{ adminHasAssignedCommittee ? $t('researchFormAdminFooter.buttons.reassignCommittee') : $t('researchFormAdminFooter.buttons.assignCommittee') }}
              </CButton>
              <CButton v-if="adminCanShowChairmanAction" color="warning" variant="outline" size="sm" @click="openAdminChairmanModal">
                <CIcon name="cil-user-follow" class="mr-1" /> {{ $t('researchFormAdminFooter.buttons.sendToChairman') }}
              </CButton>
              <CButton v-if="adminCanShowFinanceAction" color="info" variant="outline" size="sm" @click="openAdminFinanceModal">
                <CIcon name="cil-dollar" class="mr-1" /> {{ adminFinanceActionLabel }}
              </CButton>
              <CButton size="sm" class="mfu-hero-action-btn" @click="openAdminMeetingManage"><CIcon name="cil-group" :content="$options.icons.cilPeople" class="mr-1" /> {{ $t('researchFormAdminFooter.buttons.manageMeeting') }}</CButton>
            </template>
            <button
              v-else
              type="button"
              class="btn btn-sm text-white"
              style="background-color: #b58522; border-color: #b58522;"
              :disabled="isExportingPdf"
              @click="exportProposalPdf"
            >
              <i v-if="isExportingPdf" class="cil-loop export-pdf-icon--spin mr-1" aria-hidden="true"></i>
              <i v-else class="cil-cloud-download mr-1" aria-hidden="true"></i>
              {{ isExportingPdf ? 'กำลังสร้าง PDF...' : 'Export PDF' }}
            </button>
          </div>
        </div>
      </div>

      <CModal
        :show.sync="adminShowStatusModal"
        :close-on-backdrop="false"
        centered
        size="lg"
        scrollable
        :title="$t('researchFormAdminFooter.changeStatus.title')"
      >
        <template #body-wrapper>
          <div v-if="loadedProposal" class="status-modal-body" style="padding: 20px 24px 8px; max-height: calc(100vh - 220px); overflow-y: auto;">
            <div class="status-modal-proposal">
              <div class="status-modal-meta"><strong>{{ $t('researchFormAdminFooter.common.proposalCode') }}</strong> {{ loadedProposal.proposalCode || '-' }}</div>
              <div class="status-modal-meta"><strong>{{ $t('researchFormAdminFooter.common.projectTitle') }}</strong> {{ loadedProposal.projectTitleTh || loadedProposal.projectTitleEn || '-' }}</div>
            </div>
            <div class="status-modal-current">
              <strong>{{ $t('researchFormAdminFooter.changeStatus.currentStatus') }}</strong>
              <CBadge :color="adminGetStatusBadgeColor(currentStatus)" class="ml-1">
                {{ adminGetStatusLabel(currentStatus) }}
              </CBadge>
            </div>

            <CSelect
              class="status-modal-select"
              :label="$t('researchFormAdminFooter.changeStatus.toStatus')"
              :value="adminNewStatus"
              :options="adminNextStatusOptions"
              @change="onAdminNewStatusChange"
            />

            <label class="status-modal-remark-label">{{ $t('researchFormAdminFooter.changeStatus.remarkLabel') }}</label>
            <textarea
              v-model="adminStatusRemark"
              class="form-control"
              rows="3"
              :placeholder="$t('researchFormAdminFooter.changeStatus.remarkPlaceholder')"
            />
          </div>
        </template>

        <template #footer-wrapper>
          <div class="status-modal-footer d-flex justify-content-end w-100" style="padding: 12px 24px 20px;">
            <CButton color="secondary" class="mr-2" @click="closeAdminStatusModal"><CIcon name="cil-x" class="mr-1" /> {{ $t('researchFormAdminFooter.common.cancel') }}</CButton>
            <CButton color="primary" :disabled="!adminNewStatus || adminSubmittingStatus" @click="confirmAdminChangeStatus">
              <CIcon name="cil-save" class="mr-1" /> {{ adminSubmittingStatus ? $t('researchFormAdminFooter.common.saving') : $t('researchFormAdminFooter.common.confirm') }}
            </CButton>
          </div>
        </template>
      </CModal>

      <CModal
        :show.sync="adminShowChairmanModal"
        :close-on-backdrop="false"
        centered
        :title="$t('researchFormAdminFooter.assignChairman.title')"
      >
        <template #body-wrapper>
          <div v-if="loadedProposal" class="status-modal-body" style="padding: 20px 24px 8px;">
            <div class="status-modal-proposal">
              <div class="status-modal-meta"><strong>{{ $t('researchFormAdminFooter.common.proposalCode') }}</strong> {{ loadedProposal.proposalCode || '-' }}</div>
              <div class="status-modal-meta"><strong>{{ $t('researchFormAdminFooter.common.projectTitle') }}</strong> {{ loadedProposal.projectTitleTh || loadedProposal.projectTitleEn || '-' }}</div>
            </div>

            <div v-if="adminChairmanUsersLoading" class="text-center py-3">
              <CSpinner size="sm" color="primary" />
              <span class="text-muted ml-2">{{ $t('researchFormAdminFooter.assignChairman.loading') }}</span>
            </div>
            <CAlert v-else-if="adminChairmanUsersError" color="warning" show>
              {{ $t('researchFormAdminFooter.assignChairman.loadError') }}: {{ adminChairmanUsersError }}
            </CAlert>
            <CSelect
              v-else
              :label="$t('researchFormAdminFooter.assignChairman.selectLabel')"
              :value="adminSelectedChairmanId"
              :options="adminChairmanOptions"
              @change="onAdminChairmanChange"
            />
          </div>
        </template>

        <template #footer-wrapper>
          <div class="status-modal-footer d-flex justify-content-end w-100" style="padding: 12px 24px 20px;">
            <CButton color="secondary" class="mr-2" @click="closeAdminChairmanModal"><CIcon name="cil-x" class="mr-1" /> {{ $t('researchFormAdminFooter.common.cancel') }}</CButton>
            <CButton color="warning" :disabled="!adminSelectedChairmanId || adminSubmittingChairman" @click="confirmAdminAssignChairman">
              <CIcon name="cil-save" class="mr-1" /> {{ adminSubmittingChairman ? $t('researchFormAdminFooter.common.saving') : $t('researchFormAdminFooter.common.confirm') }}
            </CButton>
          </div>
        </template>
      </CModal>

      <CModal
        :show.sync="adminShowCommitteeModal"
        :close-on-backdrop="false"
        centered
        size="lg"
        scrollable
        :title="$t('researchFormAdminFooter.assignCommittee.title')"
      >
        <template #body-wrapper>
          <div v-if="loadedProposal" class="committee-modal-body" style="padding: 20px 24px 8px; max-height: calc(100vh - 220px); overflow-y: auto;">
            <div class="committee-modal-proposal">
              <div class="committee-modal-meta"><strong>{{ $t('researchFormAdminFooter.common.proposalCode') }}</strong> {{ loadedProposal.proposalCode || '-' }}</div>
              <div class="committee-modal-meta"><strong>{{ $t('researchFormAdminFooter.common.projectTitle') }}</strong> {{ loadedProposal.projectTitleTh || loadedProposal.projectTitleEn || '-' }}</div>
            </div>

            <div class="committee-selection-panel">
              <div class="mb-2"><strong>{{ $t('researchFormAdminFooter.assignCommittee.selectedCount', { count: adminSelectedCommitteeIds.length }) }}</strong></div>
              <small class="text-muted d-block mb-2">{{ $t('researchFormAdminFooter.assignCommittee.minRequired', { count: adminRequiredCommitteeCount }) }}</small>
              <div class="committee-selection-summary">
                <span v-if="adminSelectedCommitteeProfiles.length === 0" class="text-muted">{{ $t('researchFormAdminFooter.assignCommittee.noneSelected') }}</span>
                <span
                  v-for="u in adminSelectedCommitteeProfiles"
                  :key="`sel-${u._id}`"
                  class="badge badge-info mr-2 mb-2 p-2"
                  style="font-weight: 500;"
                >
                  {{ u.fullName || '-' }}
                  <button
                    type="button"
                    class="btn btn-sm btn-link text-white p-0 ml-2"
                    style="text-decoration: none;"
                    @click="removeAdminSelectedCommittee(u._id)"
                  >
                    <CIcon name="cil-chevron-right" class="mr-1" /> ✕
                  </button>
                </span>
              </div>
            </div>

            <div class="committee-tools row align-items-end">
              <div class="col-md-12 mb-2">
                <label class="mb-1"><strong>{{ $t('researchFormAdminFooter.assignCommittee.searchLabel') }}</strong></label>
                <input v-model="adminCommitteeSearch" type="text" class="form-control" :placeholder="$t('researchFormAdminFooter.assignCommittee.searchPlaceholder')" />
              </div>
            </div>

            <div v-if="adminCommitteeUsersLoading" class="text-center py-3">
              <CSpinner size="sm" color="primary" />
              <span class="text-muted ml-2">{{ $t('researchFormAdminFooter.assignCommittee.loading') }}</span>
            </div>
            <CAlert v-else-if="adminCommitteeUsersError" color="warning" show>
              {{ $t('researchFormAdminFooter.assignCommittee.loadError') }}: {{ adminCommitteeUsersError }}
            </CAlert>
            <div v-else class="committee-user-list mt-2">
              <div v-if="adminFilteredCommitteeUsers.length === 0" class="text-muted py-2">{{ $t('researchFormAdminFooter.assignCommittee.noUsers') }}</div>
              <div
                v-for="u in adminFilteredCommitteeUsers"
                :key="u._id"
                class="committee-user-row"
                :class="{ 'is-selected': isAdminSelectedCommittee(u._id) }"
              >
                <label class="d-flex align-items-start mb-0" style="gap: 10px; cursor: pointer;">
                  <input
                    type="checkbox"
                    :checked="isAdminSelectedCommittee(u._id)"
                    @change="toggleAdminCommitteeSelection(u)"
                  />
                  <div>
                    <div class="font-weight-bold">{{ u.fullName || '-' }}</div>
                    <div class="text-muted" style="font-size: 0.85rem;">
                      <span v-if="u.email">{{ u.email }}</span>
                      <span v-if="u.department"> • {{ u.department }}</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </template>

        <template #footer-wrapper>
          <div class="committee-modal-footer d-flex justify-content-end w-100" style="padding: 12px 24px 20px;">
            <CButton color="secondary" class="mr-2" @click="closeAdminCommitteeModal"><CIcon name="cil-x" class="mr-1" /> {{ $t('researchFormAdminFooter.common.cancel') }}</CButton>
            <CButton color="success" :disabled="adminSubmittingCommittee || adminSelectedCommitteeIds.length < adminRequiredCommitteeCount" @click="confirmAdminAssignCommittee">
              <CIcon name="cil-save" class="mr-1" /> {{ adminSubmittingCommittee ? $t('researchFormAdminFooter.common.saving') : $t('researchFormAdminFooter.common.confirm') }}
            </CButton>
          </div>
        </template>
      </CModal>

      <CModal
        :show.sync="adminShowFinanceModal"
        :close-on-backdrop="false"
        centered
        :title="adminIsSendToFinanceAction ? $t('researchFormAdminFooter.assignFinance.titleSend') : $t('researchFormAdminFooter.assignFinance.titleAssign')"
      >
        <template #body-wrapper>
          <div v-if="loadedProposal" class="status-modal-body" style="padding: 20px 24px 8px;">
            <div class="status-modal-proposal">
              <div class="status-modal-meta"><strong>{{ $t('researchFormAdminFooter.common.proposalCode') }}</strong> {{ loadedProposal.proposalCode || '-' }}</div>
              <div class="status-modal-meta"><strong>{{ $t('researchFormAdminFooter.common.projectTitle') }}</strong> {{ loadedProposal.projectTitleTh || loadedProposal.projectTitleEn || '-' }}</div>
            </div>

            <div v-if="adminFinanceUsersLoading" class="text-center py-3">
              <CSpinner size="sm" color="primary" />
              <span class="text-muted ml-2">{{ $t('researchFormAdminFooter.assignFinance.loading') }}</span>
            </div>
            <CAlert v-else-if="adminFinanceUsersError" color="warning" show>
              {{ $t('researchFormAdminFooter.assignFinance.loadError') }}: {{ adminFinanceUsersError }}
            </CAlert>
            <CSelect
              v-else
              :label="$t('researchFormAdminFooter.assignFinance.selectLabel')"
              :value="adminSelectedFinanceOfficerId"
              :options="adminFinanceOptions"
              @change="onAdminFinanceOfficerChange"
            />
          </div>
        </template>

        <template #footer-wrapper>
          <div class="status-modal-footer d-flex justify-content-end w-100" style="padding: 12px 24px 20px;">
            <CButton color="secondary" class="mr-2" @click="closeAdminFinanceModal"><CIcon name="cil-x" class="mr-1" /> {{ $t('researchFormAdminFooter.common.cancel') }}</CButton>
            <CButton color="info" :disabled="!adminSelectedFinanceOfficerId || adminSubmittingFinance" @click="confirmAdminAssignFinanceOfficer">
              <CIcon name="cil-save" class="mr-1" /> {{ adminSubmittingFinance ? $t('researchFormAdminFooter.common.saving') : (adminIsSendToFinanceAction ? $t('researchFormAdminFooter.assignFinance.confirmSend') : $t('researchFormAdminFooter.assignFinance.confirmAssign')) }}
            </CButton>
          </div>
        </template>
      </CModal>

      <CModal
        :show.sync="adminShowMeetingPopup"
        :close-on-backdrop="false"
        centered
        size="lg"
        scrollable
        class="meeting-modal"
      >
        <template #header-wrapper>
          <div class="modal-header">
            <h5 class="modal-title">สร้างการประชุมใหม่</h5>
            <div class="meeting-modal__header-actions">
              <button type="button" class="close" aria-label="Close" @click="closeAdminMeetingPopup">
                <CIcon name="cil-x" />
              </button>
            </div>
          </div>
        </template>
        <template #body-wrapper>
          <div class="meeting-form">
            <div class="field full-field">
              <label class="form-label mt-3">โครงการที่เกี่ยวข้อง <span class="required">*</span></label>
              <CInput
                class="full"
                :value="(loadedProposal && (loadedProposal.projectTitleTh || loadedProposal.projectTitleEn || loadedProposal.projectTitle)) || '-'"
                disabled
              />
              <small class="text-muted d-block mt-1">ระบบเลือกโครงการจากหน้าตรวจแบบฟอร์มให้อัตโนมัติ</small>
            </div>

            <div class="field full-field">
              <label class="form-label">ผู้เข้าร่วมเพิ่มเติม (ไม่บังคับ)</label>
              <multiselect
                class="full"
                v-model="adminSelectedParticipantOptions"
                :options="adminParticipantOptions"
                :searchable="true"
                :multiple="true"
                :close-on-select="false"
                :clear-on-select="false"
                :preserve-search="true"
                :allow-empty="true"
                :loading="adminParticipantOptionsLoading"
                label="searchText"
                track-by="_id"
                placeholder="พิมพ์เพื่อค้นหาผู้ใช้..."
                :custom-label="formatAdminParticipantLabel"
              >
                <template slot="option" slot-scope="{ option }">
                  <div>
                    <div class="font-weight-bold">{{ option.fullName || '-' }}</div>
                    <small class="text-muted">{{ option.email || '' }}</small>
                  </div>
                </template>
              </multiselect>
              <small v-if="adminParticipantOptionsError" class="text-warning d-block mt-1">โหลดรายชื่อผู้ใช้ไม่สำเร็จ: {{
                adminParticipantOptionsError }}</small>
            </div>

            <div class="field full-field">
              <label class="form-label">ชื่อการประชุม <span class="required">*</span></label>
              <CInput class="full" v-model="adminMeetingForm.title" placeholder="กรอกชื่อการประชุม" />
            </div>

            <div class="small-row">
              <div class="field small-field">
                <label class="form-label">วันที่ประชุม <span class="required">*</span></label>
                <v-date-picker v-model="adminMeetingDatePickerValue" :min-date="minMeetingDateObj"
                  :popover="{ visibility: 'focus', placement: 'bottom-start' }">
                  <template #default="{ inputEvents }">
                    <div class="input-icon__wrap" data-tone="primary">
                      <input ref="adminMeetingDateInput" class="form-control input-icon__control"
                        :value="adminMeetingDatePickerValue ? formatThaiDateExampleShort(adminMeetingDatePickerValue) : ''"
                        v-on="inputEvents" readonly placeholder="เลือกวันที่">
                      <button type="button" class="input-icon__suffix" @mousedown.prevent
                        @click="focusPicker('adminMeetingDateInput')">
                        <CIcon name="cil-calendar" width="16" class="input-icon__ic" aria-hidden="true" />
                      </button>
                    </div>
                  </template>
                </v-date-picker>
                <small v-if="adminMeetingDatePickerValue" class="text-muted d-block mt-1">{{
                  formatThaiDateBelow(adminMeetingDatePickerValue)
                }}</small>
              </div>
              <div class="field small-field">
                <label class="form-label">เวลาเริ่ม <span class="required">*</span></label>
                <div class="input-icon__wrap" data-tone="info">
                  <input ref="startTimeTrigger" class="form-control input-icon__control time-trigger" type="text"
                    :value="adminMeetingForm.startTime ? formatTime12h(adminMeetingForm.startTime) : ''"
                    placeholder="เลือกเวลาเริ่ม" readonly @click="toggleTimeDropdown('start')" />
                  <button type="button" class="input-icon__suffix" @mousedown.prevent @click="toggleTimeDropdown('start')">
                    <CIcon name="cil-clock" width="16" class="input-icon__ic" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div class="field small-field">
                <label class="form-label">เวลาสิ้นสุด</label>
                <div class="input-icon__wrap" data-tone="info">
                  <input ref="endTimeTrigger" class="form-control input-icon__control time-trigger" type="text"
                    :value="adminMeetingForm.endTime ? formatTime12h(adminMeetingForm.endTime) : ''"
                    :placeholder="adminMeetingForm.startTime ? '-' : 'เลือกเวลาสิ้นสุด'" readonly
                    :disabled="!adminMeetingForm.startTime" @click="toggleTimeDropdown('end')" />
                  <button type="button" class="input-icon__suffix" @mousedown.prevent :disabled="!adminMeetingForm.startTime"
                    @click="toggleTimeDropdown('end')">
                    <CIcon name="cil-clock" width="16" class="input-icon__ic" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <div class="field full-field">
              <label class="form-label">ประเภทการประชุม</label>
              <div class="meeting-type-toggle" role="radiogroup" aria-label="ประเภทการประชุม">
                <input
                  id="admin-meeting-type-online"
                  class="meeting-type-toggle__input"
                  type="radio"
                  value="online"
                  v-model="adminMeetingForm.meetingType"
                >
                <label class="meeting-type-toggle__label" for="admin-meeting-type-online">ออนไลน์</label>
                <input
                  id="admin-meeting-type-onsite"
                  class="meeting-type-toggle__input"
                  type="radio"
                  value="onsite"
                  v-model="adminMeetingForm.meetingType"
                >
                <label class="meeting-type-toggle__label" for="admin-meeting-type-onsite">ออนไซต์</label>
              </div>
            </div>

            <div class="field full-field">
              <label class="form-label">สถานที่ <span v-if="adminMeetingForm.meetingType === 'onsite'" class="required">*</span></label>
              <CInput
                class="full"
                v-model="adminMeetingForm.location"
                :disabled="adminMeetingForm.meetingType === 'online'"
                :placeholder="adminMeetingForm.meetingType === 'online' ? 'ออนไลน์: ไม่ต้องกรอกสถานที่' : 'เช่น C1 101'"
              />
            </div>

            <div class="field full-field">
              <label class="form-label">ลิงก์วิดีโอประชุม <span v-if="adminMeetingForm.meetingType === 'online'" class="required">*</span></label>
              <CInput class="full" type="url" v-model="adminMeetingForm.videoLink" placeholder="เช่น https://meet.google.com/..." />
            </div>

            <div class="field full-field">
              <label class="form-label">วาระการประชุม</label>
              <textarea v-model="adminMeetingForm.agenda" class="form-control full" rows="4" placeholder="ใส่หัวข้อย่อยหรือประเด็นหลักที่ต้องหารือ (ถ้ามี)" />
            </div>
          </div>
        </template>

        <template #footer-wrapper>
          <div class="modal-footer">
            <div class="d-flex justify-content-end w-100 modal-actions-wrapper">
              <CButton color="secondary" class="btn-cancel floating-action mr-2" @click="closeAdminMeetingPopup"><CIcon name="cil-x" class="mr-1" /> ยกเลิก</CButton>
              <CButton
                color="primary"
                class="btn-save floating-action"
                :disabled="adminMeetingSubmitting || !adminMeetingForm.title || !adminMeetingForm.meetingDate || !adminMeetingForm.startTime || (adminMeetingForm.meetingType === 'online' && !adminMeetingForm.videoLink) || (adminMeetingForm.meetingType === 'onsite' && !adminMeetingForm.location)"
                @click="submitAdminMeeting"
              >
                <CIcon name="cil-save" class="mr-1" /> {{ adminMeetingSubmitting ? 'กำลังบันทึก...' : 'บันทึก' }}
              </CButton>
            </div>
          </div>
        </template>
      </CModal>

      <div v-if="adminShowMeetingPopup && timeDropdown.openFor" class="time-dropdown__backdrop" @mousedown="closeTimeDropdown"></div>
      <div v-if="adminShowMeetingPopup && timeDropdown.openFor" class="time-dropdown" ref="timeDropdownPanel" :style="{
        top: timeDropdown.top + 'px',
        left: timeDropdown.left + 'px',
        width: timeDropdown.width + 'px',
        maxHeight: timeDropdown.maxHeight + 'px'
      }" @mousedown.stop>
        <button v-for="opt in (timeDropdown.openFor === 'start' ? startTimeOptions : endTimeOptions)"
          :key="(timeDropdown.openFor || '') + '-' + (opt.value || 'empty')" type="button" class="time-dropdown__item"
          :class="{ 'is-selected': isTimeSelected(timeDropdown.openFor, opt.value) }"
          @click="selectTimeOption(timeDropdown.openFor, opt.value)">
          <CIcon name="cil-clock" class="mr-1" /> {{ opt.label }}
        </button>
      </div>

      <div class="report-export-host" aria-hidden="true">
        <ReportView
          v-if="reportExportForm"
          ref="reportView"
          :form="reportExportForm"
        />
      </div>
    </div>
  </div>
</template>

<script>
import ResearchTeamForm from '@/ResearchFormRS/component/ResearchTeamForm.vue'
import ProjectDetailsForm from '@/ResearchFormRS/component/ProjectDetailsForm.vue'
import FileManagement from '@/ResearchFormRS/component/FileManagement.vue'
import SignatureCard from '@/ResearchFormRS/component/SignatureCard.vue'
import StatusBadge from '@/ResearchFormRS/component/StatusBadge.vue'
import FeedbackSection from '@/ResearchFormRS/component/FeedbackSection.vue'
import BudgetStickyOverlay from '@/ResearchFormRS/component/BudgetStickyOverlay.vue'
import ReportView from './Report.vue'
import Multiselect from 'vue-multiselect'
import { DatePicker } from 'v-calendar'
import { COMMITTEE_SECTION_FEEDBACK_MAP, getCommitteeFeedbackMeta } from '@/ResearchFormRS/constants/committeeFeedback'
import {
  FUNDING_BUDGET_SETTING_KEY,
  createDefaultFundingBudgetConfig,
  parseFundingBudgetSettingValue,
  readFundingBudgetConfigFromFallbackStorage,
  shouldRequireFundingSubType,
  getFundingTypeBudgetLimit,
  getFundingTypeLabel,
  writeFundingBudgetConfigToFallbackStorage
} from '@/ResearchFormRS/utils/fundingBudgetConfig'
import {
  BUDGET_MULTIPLIER_SETTING_KEY,
  createDefaultBudgetMultiplierConfig,
  parseBudgetMultiplierSettingValue,
  mergeBudgetMultiplierMaxValues,
  readBudgetMultiplierConfigFromFallbackStorage,
  writeBudgetMultiplierConfigToFallbackStorage
} from '@/ResearchFormRS/utils/budgetMultiplierConfig'
import Swal from 'sweetalert2'
import Service, { instance as axios } from '@/service/api'
import {
  PROPOSAL_ALLOWED_TRANSITIONS as ADMIN_ALLOWED_TRANSITIONS,
  PROPOSAL_STATUS_COLORS_COREUI_RESEARCH_FORM as ADMIN_STATUS_COLORS,
  PROPOSAL_STATUS_LABELS_TH_RESEARCHER as ADMIN_STATUS_LABELS,
  normalizeProposalStatus
} from '@/ResearchFormRS/constants/proposalWorkflow'
import { RESEARCH_STANDARD_TEXT } from '@/ResearchFormRS/constants/researchStandard'
import { loadResearchFormRuntimeConfigs } from '@/ResearchFormRS/utils/researchConfigRuntime'
import { cilHistory, cilCheck, cilTrash, cilPaperPlane, cilPeople } from '@coreui/icons'

const ACTIVE_DRAFT_STORAGE_KEY = 'research_form_active_draft_id'
const FEEDBACK_SECTION_PROGRESS_STORAGE_PREFIX = 'research_form_feedback_section_progress'
const FEEDBACK_SECTION_BASELINE_STORAGE_PREFIX = 'research_form_feedback_section_baseline'
const SUBMIT_SUCCESS_PENDING_STORAGE_PREFIX = 'research_form_submit_success_pending'
const BASE_MEETING_START_TIME = '06:00'
const CHAIRMAN_CHECKLIST_FIELD_KEY = 'checklist_payload'
const ADMIN_BLOCKED_MANUAL_STATUSES = Object.freeze(['approved', 'rejected'])

export default {
  name: 'ResearchForm',
  icons: {
    cilHistory,
    cilCheck,
    cilTrash,
    cilPaperPlane,
    cilPeople
  },
  props: {
    prefill: {
      type: Object,
      default: null
    },
    proposalId: {
      type: String,
      default: ''
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    hideFooterBar: {
      type: Boolean,
      default: false
    }
  },
  components: {
    ResearchTeamForm,
    ProjectDetailsForm,
    FileManagement,
    SignatureCard,
    StatusBadge,
    FeedbackSection,
    BudgetStickyOverlay,
    ReportView,
    Multiselect,
    'v-date-picker': DatePicker
  },
  data() {
      return {
        // Used to determine "responsive" sidebar behavior across all viewport sizes.
        windowWidth: (typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : 1200,
        isReadOnly: false,
        viewProposalId: null,
        isAdminView: false,
      adminShowStatusModal: false,
      adminNewStatus: '',
      adminStatusRemark: '',
      adminSubmittingStatus: false,

      adminShowCommitteeModal: false,
      adminSubmittingCommittee: false,
      adminCommitteeUsersLoading: false,
      adminCommitteeUsersError: null,
      adminCommitteeUsers: [],
      adminCommitteeSearch: '',
      adminSelectedCommitteeIds: [],
      adminShowChairmanModal: false,
      adminSubmittingChairman: false,
      adminChairmanUsersLoading: false,
      adminChairmanUsersError: null,
      adminChairmanUsers: [],
      adminSelectedChairmanId: '',
      adminShowFinanceModal: false,
      adminSubmittingFinance: false,
      adminFinanceUsersLoading: false,
      adminFinanceUsersError: null,
      adminFinanceUsers: [],
      adminSelectedFinanceOfficerId: '',
      workflowApprovalPolicy: {
        minScore: 60,
        minCommittee: 3,
        maxRounds: 2,
        allowRevisionAfterMeeting: true
      },
      fundingBudgetConfig: createDefaultFundingBudgetConfig(),
      budgetMultiplierConfig: createDefaultBudgetMultiplierConfig(),

      adminShowMeetingPopup: false,
      adminMeetingSubmitting: false,
      adminParticipantOptions: [],
      adminParticipantOptionsLoading: false,
      adminParticipantOptionsError: null,
      adminSelectedParticipantOptions: [],
      timeDropdown: {
        openFor: null,
        top: 0,
        left: 0,
        width: 0,
        maxHeight: 320
      },
      adminMeetingForm: {
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
      isDraftSaved: false,
      isDraftSaving: false,
      currentStatus: 'draft',
      showSubmitButton: false,
      reviewsLoading: false,
      reviewsError: null,
      proposalReviews: [],
      reviewModerationBusyMap: {},
      feedbackLoading: false,
      feedbackError: null,
      userFeedback: null,
      loadedProposal: null,
      adminFinalDecision: '',
      adminFinalNote: '',
      savingAdminDecision: false,
      reopeningRejected: false,
      suppressAutoSave: true,
      autoSaveTimerId: null,
      budgetAutoSaveTimerId: null,
      isAutoSaving: false,
      isExportingPdf: false,
      submittingProject: false,
      deletingDraftProposal: false,
      autoSavePending: false,
      lastAutoSavedAt: null,
      lastSavedDraftFingerprint: null,
      autoSaveDebounceMs: 120,
      savingRevision: false,
      submittingRevision: false,
      files: [],
      pendingFormFiles: [],
      signatureData: null,
      reportExportForm: null,
      feedbackSectionCardStates: {},
      feedbackSectionDrafts: {},
      feedbackSectionBaselines: {},
      budgetStickySummary: null,
      projectDetailsData: {
        problemSignificance: '',
        objectives: '',
        literatureReview: '',
        researchMethodology: '',
        workPlan: [],
        budget: {},
        integration: '',
        transferLevel: ''
      },
      researchTeamData: {
        projectLeader: {
          name: '',
          affiliation: '',
          phone: '',
          email: '',
          proportion: ''
        },
        coResearchers: [],
        advisors: []
      }
    }
  },
  created () {
    const query = this.$route && this.$route.query ? this.$route.query : {}
    const isNewDraftRequested = query.new === '1'
    const storedDraftId = isNewDraftRequested ? '' : this.getStoredDraftId()
    const id = query.id || this.proposalId || storedDraftId

    if (id) {
      this.viewProposalId = id
    }
    if (query.readOnly === 'true') {
      this.isReadOnly = true
    }
    // Reviewer roles can view research form only (force read-only regardless of URL flags).
    if (['committee', 'chairman'].includes(String(this.currentUserRole || '').trim().toLowerCase())) {
      this.isReadOnly = true
    }
    if (query.mode === 'admin-view') {
      this.isAdminView = true
    }
  },
  async mounted() {
    // Keep windowWidth reactive so computed sidebar behavior updates on resize.
    if (typeof window !== 'undefined' && window.addEventListener) {
      this._rfResizeHandler = () => {
        this.windowWidth = window.innerWidth || this.windowWidth
      }
      this._rfResizeHandler()
      try {
        window.addEventListener('resize', this._rfResizeHandler, { passive: true })
      } catch (_) {
        window.addEventListener('resize', this._rfResizeHandler)
      }
    }

    await Promise.all([
      loadResearchFormRuntimeConfigs(),
      this.fetchFundingBudgetConfig(),
      this.fetchBudgetMultiplierConfig()
    ])
    this.$forceUpdate()

    // Sync research team data when component is mounted
    this.syncResearchTeamData();

    const query = this.$route && this.$route.query ? this.$route.query : {}
    const isNewDraftRequested = query.new === '1'
    const storedDraftId = isNewDraftRequested ? '' : this.getStoredDraftId()
    const id = this.viewProposalId || query.id || this.proposalId || storedDraftId

    if (id && !query.id && !this.proposalId && !isNewDraftRequested) {
      this.syncRouteProposalId(id)
    }

    if (id) {
      await this.loadProposalById(id)

      if (this.isAdminView) {
        if (!this.isDraftStatus) {
          await this.fetchProposalReviews(id)
          if (this.isAdminRevisionSubmissionView) {
            await this.fetchUserFeedback(id)
          }
          await this.scrollToReviewsIfRequested()
        }
      } else {
        if (!this.isDraftStatus) {
          await this.fetchProposalReviews(id)
        }
        if (this.isRevisionRequested) {
          await this.scrollToFeedbackIfNeeded({ behavior: 'auto' })
          await this.fetchUserFeedback(id)
          await this.scrollToFeedbackIfNeeded()
        }
      }
    }

    this.$nextTick(() => {
      this.updateDraftBaseline()
      if (this.viewProposalId) {
        this.isDraftSaved = true
      }
      this.suppressAutoSave = false
    })
  },
  async beforeRouteLeave (to, from, next) {
    try {
      await this.flushAutoSaveBeforeLeave()
    } catch (_) { void _ }
    next()
  },
  beforeDestroy () {
    this.clearAutoSaveTimer()
    this.clearBudgetAutoSaveTimer()
    this.setCenterLoading(false)
    if (typeof window !== 'undefined' && window.removeEventListener && this._rfResizeHandler) {
      window.removeEventListener('resize', this._rfResizeHandler)
      this._rfResizeHandler = null
    }
  },
  computed: {
    isDarkTheme () {
      return Boolean(this.$store && this.$store.state && this.$store.state.darkMode)
    },
    isEnglishLocale () {
      const locale = String((this.$i18n && this.$i18n.locale) || '').trim().toLowerCase()
      return locale === 'en'
    },
    pageText () {
      if (this.isEnglishLocale) {
        return {
          pageTitle: 'Research Information Form',
          adminViewBanner: 'View-only mode (Admin View) - editing is disabled',
          revisionRequestedAlert: 'This proposal requires revision. You can edit, save, and resubmit it.',
          rejectedAlert: 'This proposal was rejected and cannot be resubmitted in the current workflow.',
          approvedAlert: 'This proposal has already been approved.',
          pendingRevisionSectionsAlert: 'Please submit all required section revisions before resubmitting the proposal.',
          savingLabel: 'Saving...',
          saveRevisionButton: 'Save Revision',
          submittingLabel: 'Submitting...',
          resubmitButton: 'Resubmit Revision',
          statusLabel: 'Status:',
          autoSaveTitle: 'Auto save',
          savingHint: 'Saving',
          pendingConfirmSubmitted: 'Consent request sent',
          submittedBadge: 'Proposal submitted',
          deleteProjectButton: 'Delete Project',
          submitProjectButton: 'Submit Proposal',
          exportingPdf: 'Generating PDF...',
          exportPdf: 'Export PDF'
        }
      }
      return {
        pageTitle: 'แบบฟอร์มข้อมูลการวิจัย',
        adminViewBanner: 'โหมดดูอย่างเดียว (Admin View) - การแก้ไขถูกปิดใช้งาน',
        revisionRequestedAlert: 'ข้อเสนอโครงการนี้ต้องการการแก้ไข คุณสามารถแก้ไข บันทึก และส่งใหม่ได้',
        rejectedAlert: 'ข้อเสนอโครงการนี้ถูกปฏิเสธ และไม่สามารถส่งใหม่ได้ใน workflow ปัจจุบัน',
        approvedAlert: 'ข้อเสนอโครงการนี้ได้รับการอนุมัติแล้ว',
        pendingRevisionSectionsAlert: 'กรุณาส่งการแก้ไขในทุกส่วนที่จำเป็นก่อนส่งข้อเสนอโครงการใหม่',
        savingLabel: 'กำลังบันทึก...',
        saveRevisionButton: 'บันทึกการแก้ไข',
        submittingLabel: 'กำลังส่ง...',
        resubmitButton: 'ส่งการแก้ไขใหม่',
        statusLabel: 'สถานะ:',
        autoSaveTitle: 'บันทึกอัตโนมัติ',
        savingHint: 'กำลังบันทึก',
        pendingConfirmSubmitted: 'ส่งคำขอความยินยอมแล้ว',
        submittedBadge: 'ส่งข้อเสนอโครงการแล้ว',
        deleteProjectButton: 'ลบโครงการ',
        submitProjectButton: 'ส่งข้อเสนอโครงการ',
        exportingPdf: 'กำลังสร้าง PDF...',
        exportPdf: 'Export PDF'
      }
    },
    stickyOverlayChecklistItems () {
      const detailsForm = this.$refs && this.$refs.projectDetailsForm
      const formFromRef = detailsForm && typeof detailsForm.getFormData === 'function'
        ? detailsForm.getFormData()
        : null
      const form = formFromRef && typeof formFromRef === 'object'
        ? formFromRef
        : (this.projectDetailsData || {})
      const hasText = (value) => String(value || '').trim() !== ''
      const fundingType = String(form.fundingType || '').trim()
      const requiresFundingSubType = this.requiresFundingSubType(fundingType)
      const requiresExpectedOutcome = this.isExpectedOutcomeSelectionRequired(fundingType)
      const teamValidation = this.$refs && this.$refs.researchTeamForm && typeof this.$refs.researchTeamForm.getValidationResult === 'function'
        ? this.$refs.researchTeamForm.getValidationResult()
        : null
      const teamOk = teamValidation ? Boolean(teamValidation.ok) : this.validateForm(this.researchTeamData)

      const budgetCompleteness = this.getBudgetCompletenessValidationResult()
      const budgetValidation = this.getBudgetValidationResult()

      return [
        { key: 'research-team', label: this.$t('budgetStickyOverlay.checklistItems.researchTeam'), ok: teamOk },
        { key: 'section-1', label: this.$t('budgetStickyOverlay.checklistItems.section1'), ok: hasText(form.projectNameThai) && hasText(form.projectNameEnglish) },
        { key: 'section-2', label: this.$t('budgetStickyOverlay.checklistItems.section2'), ok: Boolean(fundingType) && (!requiresFundingSubType || hasText(form.fundingSubType)) },
        { key: 'section-4', label: this.$t('budgetStickyOverlay.checklistItems.section4'), ok: hasText(form.researchType) },
        { key: 'section-5', label: this.$t('budgetStickyOverlay.checklistItems.section5'), ok: hasText(form.keywords) },
        { key: 'section-6', label: this.$t('budgetStickyOverlay.checklistItems.section6'), ok: hasText(form.problemSignificance) },
        { key: 'section-7', label: this.$t('budgetStickyOverlay.checklistItems.section7'), ok: hasText(form.objectives) },
        { key: 'section-8', label: this.$t('budgetStickyOverlay.checklistItems.section8'), ok: hasText(form.literatureReview) },
        { key: 'section-9', label: this.$t('budgetStickyOverlay.checklistItems.section9'), ok: hasText(form.references) },
        { key: 'section-10', label: this.$t('budgetStickyOverlay.checklistItems.section10'), ok: hasText(form.researchMethodology) },
        { key: 'section-11', label: this.$t('budgetStickyOverlay.checklistItems.section11'), ok: hasText(form.researchScope) },
        { key: 'section-12', label: this.$t('budgetStickyOverlay.checklistItems.section12'), ok: this.hasWorkPlanData(form.workPlan) },
        { key: 'section-13', label: this.$t('budgetStickyOverlay.checklistItems.section13'), ok: hasText(form.milestones) },
        { key: 'section-14', label: this.$t('budgetStickyOverlay.checklistItems.section14'), ok: !requiresExpectedOutcome || hasText(form.selectedOutcome) },
        { key: 'section-15', label: this.$t('budgetStickyOverlay.checklistItems.section15'), ok: hasText(form.integration) },
        { key: 'section-16', label: this.$t('budgetStickyOverlay.checklistItems.section16'), ok: hasText(form.transferLevel) },
        { key: 'section-17', label: this.$t('budgetStickyOverlay.checklistItems.section17'), ok: Boolean(budgetCompleteness && budgetCompleteness.ok) && Boolean(budgetValidation && budgetValidation.ok) }
      ]
    },
    stickyOverlaySummaryModel () {
      const base = this.budgetStickySummary && typeof this.budgetStickySummary === 'object'
        ? this.budgetStickySummary
        : {}
      return {
        ...base,
        visible: this.shouldEnableBudgetStickyOverlay && Boolean(base.visible),
        checklistItems: this.stickyOverlayChecklistItems
      }
    },
    isBudgetReportMode () {
      const path = String((this.$route && this.$route.path) || '').trim().toLowerCase()
      const isCommitteeRoute = path.indexOf('/committee/') !== -1 || path.indexOf('/chairman/') !== -1 || path.indexOf('/review/proposals') !== -1
      const status = String(this.currentStatus || '').trim().toLowerCase()
      return isCommitteeRoute && this.mainFormReadOnly && status !== '' && status !== 'draft'
    },
    shouldEnableBudgetStickyOverlay () {
      return this.isDraftStatus && !this.isBudgetReportMode
    },
    currentUserRole () {
      const storeRole = this.$store && this.$store.getters ? this.$store.getters['Authentication/userRole'] : null
      if (storeRole) return String(storeRole)
      try {
        const raw = localStorage.getItem('auth_user')
        if (!raw) return null
        const parsed = JSON.parse(raw)
        return parsed && parsed.role ? String(parsed.role) : null
      } catch (e) {
        return null
      }
    },

    effectiveReadOnly () {
      return Boolean(this.readOnly || this.isReadOnly)
    },
    mainFormReadOnly () {
      if (this.effectiveReadOnly) return true
      return String(this.currentStatus || '').trim().toLowerCase() !== 'draft'
    },
    showAdminFooterBar () {
      return Boolean(this.isAdminView && this.viewProposalId)
    },
    isAdminRevisionSubmissionView () {
      if (!this.isAdminView) return false
      return String(this.currentStatus || '').trim().toLowerCase() === 'resubmitted'
    },
    adminCanShowChairmanAction () {
      return this.isAdminView && String(normalizeProposalStatus(this.currentStatus)).trim().toLowerCase() === 'submitted'
    },
    adminCanShowFinanceAction () {
      if (!this.isAdminView || !this.viewProposalId) return false
      const currentStatus = String(normalizeProposalStatus(this.currentStatus)).trim().toLowerCase()
      return currentStatus === 'office_received' || currentStatus === 'finance_budget_checking'
    },
    adminIsSendToFinanceAction () {
      return String(normalizeProposalStatus(this.currentStatus)).trim().toLowerCase() === 'office_received'
    },
    adminFinanceActionLabel () {
      if (this.adminIsSendToFinanceAction) return this.$t('researchFormAdminFooter.buttons.sendToFinance')
      return this.$t('researchFormAdminFooter.buttons.reassignFinance')
    },
    adminHasAssignedCommittee () {
      return Array.isArray(this.loadedProposal && this.loadedProposal.committeeIds) && this.loadedProposal.committeeIds.length > 0
    },
    adminNextStatusOptions () {
      const current = String(this.currentStatus || '').trim()
      const statuses = (ADMIN_ALLOWED_TRANSITIONS[current] || []).filter(status => !this.isAdminManualStatusBlocked(status))
      if (!statuses.length) return [{ value: '', label: this.$t('researchFormAdminFooter.changeStatus.nextStatusNone') }]
      return [{
        value: '',
        label: this.$t('researchFormAdminFooter.changeStatus.nextStatusSelect')
      }, ...statuses.map(s => ({
        value: s,
        label: s === 'second_round_review' ? this.$t('researchFormAdminFooter.changeStatus.nextStatusSecondRound') : this.adminGetStatusLabel(s)
      }))]
    },
    adminFilteredCommitteeUsers () {
      const scopedUsers = this.adminCommitteeUsers || []
      const q = String(this.adminCommitteeSearch || '').trim().toLowerCase()
      if (!q) return scopedUsers
      return scopedUsers.filter(u => {
        const text = [u.fullName, u.email, u.department].filter(Boolean).join(' ').toLowerCase()
        return text.includes(q)
      })
    },
    adminSelectedCommitteeProfiles () {
      const byId = new Map((this.adminCommitteeUsers || []).map(u => [String(u._id), u]))
      return (this.adminSelectedCommitteeIds || [])
        .map(id => byId.get(String(id)))
        .filter(Boolean)
    },
    adminRequiredCommitteeCount () {
      const n = Number(this.workflowApprovalPolicy && this.workflowApprovalPolicy.minCommittee)
      if (!Number.isFinite(n) || n < 1) return 1
      return Math.floor(n)
    },
    adminChairmanOptions () {
      return [
        { value: '', label: this.$t('researchFormAdminFooter.assignChairman.selectPlaceholder') },
        ...(this.adminChairmanUsers || []).map(user => ({
          value: user && user._id ? String(user._id) : '',
          label: user && user.fullName ? `${user.fullName}${user.department ? ` (${user.department})` : ''}` : '-'
        }))
      ]
    },
    adminFinanceOptions () {
      return [
        { value: '', label: this.$t('researchFormAdminFooter.assignFinance.selectPlaceholder') },
        ...(this.adminFinanceUsers || []).map(user => ({
          value: user && user._id ? String(user._id) : '',
          label: user && user.fullName ? `${user.fullName}${user.department ? ` (${user.department})` : ''}` : '-'
        }))
      ]
    },
    shouldDisableProjectTitleSection () {
      return String(this.currentStatus || '').toLowerCase() !== 'draft'
    },
    groupedReviews () {
      const groups = {}
      ;(this.committeeSubmittedReviews || []).forEach(r => {
        const key = r && r.roundNo ? r.roundNo : 1
        if (!groups[key]) groups[key] = []
        groups[key].push(r)
      })
      return Object.keys(groups)
        .map(k => ({ roundNo: Number(k), reviews: groups[k] }))
        .sort((a, b) => a.roundNo - b.roundNo)
    },
    chairmanReviewedById () {
      const reviewedBy = this.loadedProposal
        && this.loadedProposal.chairmanAssignment
        && this.loadedProposal.chairmanAssignment.reviewedBy
      return reviewedBy ? String(reviewedBy) : ''
    },
    chairmanSubmittedReviews () {
      return (this.proposalReviews || []).filter(review => this.isChairmanReview(review) && this.isReviewSubmitted(review))
    },
    committeeSubmittedReviews () {
      return (this.proposalReviews || []).filter(review => !this.isChairmanReview(review) && this.isReviewSubmitted(review))
    },
    acceptedCommitteeReviews () {
      return this.committeeSubmittedReviews.filter(review => this.isReviewAccepted(review))
    },
    pendingCommitteeReviews () {
      return this.committeeSubmittedReviews.filter(review => this.isReviewPendingAdminAcceptance(review))
    },
    chairmanReviewCards () {
      return this.chairmanSubmittedReviews.map((review) => {
        const parsed = this.parseChairmanChecklistReview(review)
        const sections = Array.isArray(parsed.sections) ? parsed.sections : []

        const normalizedSections = sections.map((section) => {
          const items = Array.isArray(section && section.items) ? section.items : []
          const normalizedItems = items.map((item) => ({
            itemKey: String(item && item.itemKey ? item.itemKey : item && item.key ? item.key : 'item'),
            label: String(item && item.label ? item.label : 'รายการ checklist'),
            checked: Boolean(item && item.checked)
          }))
          return {
            sectionKey: String(section && section.sectionKey ? section.sectionKey : 'section'),
            sectionLabel: String(section && section.sectionLabel ? section.sectionLabel : 'หัวข้อประเมิน'),
            totalItems: items.length,
            checkedCount: normalizedItems.filter(item => item.checked).length,
            items: normalizedItems
          }
        })

        return {
          reviewId: String(review && review._id ? review._id : `${review && review.roundNo ? review.roundNo : 1}`),
          review,
          fundingTypeLabel: String(parsed.fundingTypeLabel || '-'),
          checkedCount: normalizedSections.reduce((sum, section) => sum + section.checkedCount, 0),
          totalItems: normalizedSections.reduce((sum, section) => sum + section.totalItems, 0),
          sections: normalizedSections
        }
      })
    },
    readonlyChairmanChecklistLoading () {
      return !this.isAdminView && this.reviewsLoading
    },
    readonlyChairmanChecklistError () {
      if (this.isAdminView) return ''
      return this.reviewsError || ''
    },
    showReadonlyChairmanChecklistCard () {
      if (!this.viewProposalId) return false
      if (this.chairmanReviewCards.length > 0) return true
      return Boolean(this.readonlyChairmanChecklistLoading || this.readonlyChairmanChecklistError)
    },
    submittedReviews () {
      return this.acceptedCommitteeReviews
    },
    assignedCommitteeCount () {
      const ids = this.loadedProposal && Array.isArray(this.loadedProposal.committeeIds)
        ? this.loadedProposal.committeeIds
        : []
      return ids.length
    },
    submittedReviewCount () {
      return this.submittedReviews.length
    },
    pendingReviewCount () {
      return Math.max(this.assignedCommitteeCount - this.committeeSubmittedReviews.length, 0)
    },
    pendingAdminCommitteeReviewCount () {
      return this.pendingCommitteeReviews.length
    },
    averageSubmittedScore () {
      const nums = this.submittedReviews
        .map(r => Number(r && r.totalScore))
        .filter(n => Number.isFinite(n))
      if (!nums.length) return '-'
      const avg = nums.reduce((s, n) => s + n, 0) / nums.length
      return avg.toFixed(2)
    },
    approveCount () {
      return this.submittedReviews.filter(r => r && r.decision === 'approve').length
    },
    reviseCount () {
      return this.submittedReviews.filter(r => r && r.decision === 'revise').length
    },
    rejectCount () {
      return this.submittedReviews.filter(r => r && r.decision === 'reject').length
    },
    hasMixedOutcomes () {
      const nonZeroBuckets = [this.approveCount, this.reviseCount, this.rejectCount].filter(c => c > 0)
      return nonZeroBuckets.length > 1
    },
    feedbackReviews () {
      const rows = this.userFeedback && Array.isArray(this.userFeedback.committeeReviews)
        ? this.userFeedback.committeeReviews
        : []
      return rows.filter(r => this.isReviewAccepted(r))
    },
    feedbackReviewGroups () {
      const groups = {}
      ;(this.feedbackReviews || []).forEach(r => {
        const key = r && r.roundNo ? r.roundNo : 1
        if (!groups[key]) groups[key] = []
        groups[key].push(r)
      })
      return Object.keys(groups)
        .map(k => ({ roundNo: Number(k), reviews: groups[k] }))
        .sort((a, b) => a.roundNo - b.roundNo)
    },
    feedbackEditableSections () {
      const grouped = {}

      ;(this.feedbackReviews || []).forEach(review => {
        this.reviewActionItems(review).forEach(item => {
          const meta = this.feedbackMetaForItem(item)
          if (!meta) return

          if (!grouped[meta.sectionKey]) {
            grouped[meta.sectionKey] = {
              sectionKey: meta.sectionKey,
              meta,
              notes: []
            }
          }

          grouped[meta.sectionKey].notes.push({
            id: `${review._id || 'review'}-${item.fieldKey || item.sectionKey}-${grouped[meta.sectionKey].notes.length}`,
            reviewerName: this.reviewerName(review),
            score: this.feedbackItemScore(review, item),
            submittedAt: review.submittedAt || review.updatedAt || null,
            commentText: item.commentText || '',
            decision: review.decision || ''
          })
        })
      })

      return Object.values(grouped)
        .sort((left, right) => {
          const leftOrder = Number.isFinite(Number(left.meta && left.meta.sectionNo)) ? Number(left.meta.sectionNo) : Number.MAX_SAFE_INTEGER
          const rightOrder = Number.isFinite(Number(right.meta && right.meta.sectionNo)) ? Number(right.meta.sectionNo) : Number.MAX_SAFE_INTEGER
          return leftOrder - rightOrder
        })
    },
    adminRevisionHighlightSections () {
      if (!this.isAdminRevisionSubmissionView) return []
      const dedup = new Set()
      return (this.feedbackEditableSections || [])
        .filter(section => section && section.sectionKey)
        .filter(section => {
          const key = String(section.sectionKey)
          if (dedup.has(key)) return false
          dedup.add(key)
          return true
        })
    },
    adminRevisionSectionKeys () {
      return this.adminRevisionHighlightSections
        .map(section => String(section && section.sectionKey ? section.sectionKey : ''))
        .filter(Boolean)
    },
    adminRevisionProjectSectionKeys () {
      return this.adminRevisionSectionKeys.filter(sectionKey => sectionKey !== 'research_team')
    },
    adminRevisionResearchTeamSectionKeys () {
      return this.adminRevisionSectionKeys.includes('research_team') ? ['research_team'] : []
    },
    storedRevisionDiffSummary () {
      const raw = this.loadedProposal &&
        this.loadedProposal.formSnapshotJson &&
        this.loadedProposal.formSnapshotJson.revisionDiffSummary
      if (!raw || typeof raw !== 'object') return null

      const sections = Array.isArray(raw.sections)
        ? raw.sections
          .filter(section => section && section.sectionKey)
          .map(section => ({
            sectionKey: String(section.sectionKey),
            sectionLabel: section.sectionLabel || '',
            beforeSummary: section.beforeSummary || '',
            afterSummary: section.afterSummary || ''
          }))
        : []

      if (!sections.length) return null
      return {
        roundNo: raw.roundNo || null,
        generatedAt: raw.generatedAt || null,
        sections
      }
    },
    revisionDiffSummaryForDisplay () {
      if (!this.storedRevisionDiffSummary) return null
      // Show summary only after researcher has sent the revision back (status no longer revision_requested).
      if (this.isRevisionRequested) return null
      return this.storedRevisionDiffSummary
    },
    latestDecisionStatus () {
      return this.userFeedback && this.userFeedback.latestDecision
        ? this.userFeedback.latestDecision.toStatus
        : ''
    },
    latestDecisionRemark () {
      return this.userFeedback && this.userFeedback.latestDecision
        ? this.userFeedback.latestDecision.remark
        : ''
    },
    latestDecisionRound () {
      return this.userFeedback && this.userFeedback.latestDecision
        ? this.userFeedback.latestDecision.roundNo
        : null
    },
    feedbackSectionBindings () {
      return {
        feedbackLoading: this.feedbackLoading,
        feedbackError: this.feedbackError,
        latestDecisionStatus: this.latestDecisionStatus,
        latestDecisionRound: this.latestDecisionRound,
        userFeedback: this.userFeedback,
        latestDecisionRemark: this.latestDecisionRemark,
        feedbackEditableSections: this.feedbackEditableSections,
        feedbackReviews: this.feedbackReviews,
        feedbackReviewGroups: this.feedbackReviewGroups,
        effectiveReadOnly: this.effectiveReadOnly,
        decisionStatusLabel: this.decisionStatusLabel,
        isFeedbackSectionSubmitted: this.isFeedbackSectionSubmitted,
        feedbackSectionSubmittedAt: this.feedbackSectionSubmittedAt,
        formatReviewDateTime: this.formatReviewDateTime,
        toggleFeedbackSectionCard: this.toggleFeedbackSectionCard,
        isFeedbackSectionCollapsed: this.isFeedbackSectionCollapsed,
        feedbackSectionDraft: this.feedbackSectionDraft,
        setFeedbackSectionDraft: this.setFeedbackSectionDraft,
        feedbackSectionSnapshot: this.feedbackSectionSnapshot,
        feedbackStrategicFundingType: this.feedbackStrategicFundingType,
        feedbackStrategicFundingSubType: this.feedbackStrategicFundingSubType,
        setFeedbackStrategicFundingType: this.setFeedbackStrategicFundingType,
        setFeedbackStrategicFundingSubType: this.setFeedbackStrategicFundingSubType,
        feedbackExpectedOutcomesFundingType: this.feedbackExpectedOutcomesFundingType,
        feedbackExpectedOutcomesSelection: this.feedbackExpectedOutcomesSelection,
        setFeedbackExpectedOutcomesSelection: this.setFeedbackExpectedOutcomesSelection,
        transferLevelPreview: this.transferLevelPreview,
        updateFeedbackSectionDraftField: this.updateFeedbackSectionDraftField,
        isSubmittingFeedbackSection: this.isSubmittingFeedbackSection,
        submitFeedbackSection: this.submitFeedbackSection,
        reopenFeedbackSection: this.reopenFeedbackSection,
        reviewerName: this.reviewerName,
        decisionLabel: this.decisionLabel
      }
    },
    pendingFeedbackSectionsForResubmit () {
      if (!this.isRevisionRequested) return []
      return (this.feedbackEditableSections || [])
        .filter(section => section && section.sectionKey && !this.isFeedbackSectionSubmitted(section.sectionKey))
    },
    canResubmitRevision () {
      if (!this.isRevisionRequested) return false
      if (this.feedbackLoading || this.feedbackError || !this.userFeedback) return false
      if (this.pendingFeedbackSectionsForResubmit.length > 0) return false
      return true
    },
    pendingFeedbackSectionLabels () {
      return this.pendingFeedbackSectionsForResubmit
        .map(section => (section && section.meta && section.meta.sectionLabel) || (section && section.sectionKey) || '-')
    },
    isRevisionRequested () {
      return String(this.currentStatus || '').trim().toLowerCase() === 'revision_requested'
    },
    isRejectedStatus () {
      return String(this.currentStatus || '').toLowerCase() === 'rejected'
    },
    isApprovedStatus () {
      return String(this.currentStatus || '').toLowerCase() === 'approved'
    },
    isAnnouncedStatus () {
      return String(this.currentStatus || '').toLowerCase() === 'announced'
    },
    isDraftStatus () {
      return String(this.currentStatus || '').toLowerCase() === 'draft'
    },
    showDraftActions () {
      return !this.isAdminView && !this.showSubmitButton && this.isDraftStatus
    },
    showExportPdfButton () {
      return !this.isAdminView && Boolean(this.viewProposalId) && !this.isDraftStatus
    },
    showFooterBar () {
      if (this.hideFooterBar) return false
      return !this.isAdminView && (!this.effectiveReadOnly || this.showExportPdfButton)
    },
    showDeleteDraftButton () {
      return this.showDraftActions && Boolean(this.viewProposalId)
    },
    adminDecisionOptions () {
      const current = String(this.currentStatus || '').trim()
      const statuses = (ADMIN_ALLOWED_TRANSITIONS[current] || []).filter(status => !this.isAdminManualStatusBlocked(status))
      if (!statuses.length) return [{ value: '', label: 'ไม่มีผลการตัดสินใจที่อนุญาต' }]
      return [
        { value: '', label: 'เลือกผลการตัดสินใจ' },
        ...statuses.map(status => ({
          value: status,
          label: status === 'second_round_review' ? 'ส่งให้คณะกรรมการพิจารณา' : this.adminGetStatusLabel(status)
        }))
      ]
    },
    isSidebarOpen() {
      // ดึงสถานะเปิด/ปิด Sidebar มาจากตัวแปรส่วนกลาง
      const show = this.$store.state.sidebarShow;
      // CoreUI มักจะเก็บค่าเป็น boolean (true/false) หรือสตริง 'responsive'
      if (show === true) return true
      if (show === false) return false
      // 'responsive' means: show on desktop, overlay/hidden on smaller screens.
      return show === 'responsive' && Number(this.windowWidth) >= 992
    },
    adminMeetingDatePickerValue: {
      get() {
        return this.parseLocalYmd(this.adminMeetingForm && this.adminMeetingForm.meetingDate ? this.adminMeetingForm.meetingDate : '')
      },
      set(val) {
        this.adminMeetingForm.meetingDate = val ? this.formatYmd(val) : ''
      }
    },
    minMeetingDateObj() {
      const now = new Date()
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    },
    minStartTime() {
      const selected = this.parseLocalYmd(this.adminMeetingForm && this.adminMeetingForm.meetingDate ? this.adminMeetingForm.meetingDate : '')
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
      const start = this.adminMeetingForm && this.adminMeetingForm.startTime ? String(this.adminMeetingForm.startTime) : ''
      if (start) return start
      return this.minStartTime || BASE_MEETING_START_TIME
    },
    startTimeOptions() {
      return this.buildTimeOptions({
        min: this.minStartTime || BASE_MEETING_START_TIME,
        step: 15,
        includeEmpty: false,
        formatLabel: (value) => this.formatTime12h(value)
      })
    },
    isButtonActionLoading () {
      return Boolean(
        this.submittingProject ||
        this.deletingDraftProposal ||
        this.isDraftSaving ||
        this.isExportingPdf ||
        this.adminSubmittingStatus ||
        this.adminSubmittingChairman ||
        this.adminSubmittingCommittee ||
        this.adminMeetingSubmitting ||
        this.adminCommitteeUsersLoading ||
        this.adminChairmanUsersLoading ||
        this.adminParticipantOptionsLoading ||
        this.reviewsLoading ||
        this.feedbackLoading ||
        this.savingAdminDecision ||
        this.reopeningRejected ||
        this.savingRevision ||
        this.submittingRevision
      )
    },
    endTimeOptions() {
      const start = this.adminMeetingForm && this.adminMeetingForm.startTime ? String(this.adminMeetingForm.startTime) : ''
      return this.buildTimeOptions({
        min: this.minEndTime || (this.minStartTime || BASE_MEETING_START_TIME),
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
    }
  },
  watch: {
    isButtonActionLoading: {
      immediate: true,
      handler (next) {
        this.setCenterLoading(next)
      }
    },
    'adminMeetingForm.meetingType'(next) {
      if (!this.adminMeetingForm) return
      if (next === 'online') {
        this.adminMeetingForm.location = ''
      } else if (next === 'onsite') {
        this.adminMeetingForm.videoLink = ''
      }
    },
    feedbackEditableSections: {
      immediate: true,
      handler (sections) {
        const normalizedSections = Array.isArray(sections) ? sections : []
        if (normalizedSections.length) {
          this.restoreFeedbackSectionCardStates()
        }
        this.syncFeedbackSectionCardStates(normalizedSections)

        if (!this.isAdminView && this.isRevisionRequested && normalizedSections.length) {
          this.syncFeedbackSectionBaselines(normalizedSections)
        }
      }
    },
    signatureData: {
      deep: true,
      handler () {
        this.markAsEdited()
      }
    },
    prefill: {
      immediate: true,
      deep: true,
      handler () {
        this.applyPrefill()
      }
    },
    proposalId: {
      immediate: false,
      async handler (newId) {
        if (newId && newId !== this.viewProposalId) {
          this.viewProposalId = newId
          await this.loadProposalById(newId)

          if (this.isAdminView) {
            if (!this.isDraftStatus) {
              await this.fetchProposalReviews(newId)
              if (this.isAdminRevisionSubmissionView) {
                await this.fetchUserFeedback(newId)
              }
              await this.scrollToReviewsIfRequested()
            }
          } else {
            if (!this.isDraftStatus) {
              await this.fetchProposalReviews(newId)
            }
            if (this.isRevisionRequested) {
              await this.scrollToFeedbackIfNeeded({ behavior: 'auto' })
              await this.fetchUserFeedback(newId)
              await this.scrollToFeedbackIfNeeded()
            }
          }
        }
      }
    },
    currentStatus () {
      if (!this.shouldEnableBudgetStickyOverlay) {
        this.budgetStickySummary = null
      }
    }
  },
  methods: {
    setCenterLoading (enabled) {
      if (!this.$store || typeof this.$store.commit !== 'function') return
      this.$store.commit('dialog/loading', Boolean(enabled))
    },
    getStoredDraftId () {
      if (typeof window === 'undefined' || !window.sessionStorage) return ''
      try {
        return window.sessionStorage.getItem(ACTIVE_DRAFT_STORAGE_KEY) || ''
      } catch (_) {
        return ''
      }
    },
    setStoredDraftId (proposalId) {
      if (typeof window === 'undefined' || !window.sessionStorage) return
      try {
        if (proposalId) {
          window.sessionStorage.setItem(ACTIVE_DRAFT_STORAGE_KEY, String(proposalId))
        } else {
          window.sessionStorage.removeItem(ACTIVE_DRAFT_STORAGE_KEY)
        }
      } catch (_) { void _ }
    },
    submitSuccessPendingStorageKey (proposalId = this.viewProposalId) {
      const normalizedProposalId = String(proposalId || '').trim()
      if (!normalizedProposalId) return ''
      return `${SUBMIT_SUCCESS_PENDING_STORAGE_PREFIX}:${normalizedProposalId}`
    },
    setSubmitSuccessPendingFlag (proposalId, enabled = true) {
      if (typeof window === 'undefined' || !window.localStorage) return
      const storageKey = this.submitSuccessPendingStorageKey(proposalId)
      if (!storageKey) return
      try {
        if (enabled) {
          window.localStorage.setItem(storageKey, '1')
        } else {
          window.localStorage.removeItem(storageKey)
        }
      } catch (_) { void _ }
    },
    consumeSubmitSuccessPendingFlag (proposalId) {
      if (typeof window === 'undefined' || !window.localStorage) return false
      const storageKey = this.submitSuccessPendingStorageKey(proposalId)
      if (!storageKey) return false
      try {
        const raw = window.localStorage.getItem(storageKey)
        if (raw === '1') {
          window.localStorage.removeItem(storageKey)
          return true
        }
      } catch (_) { void _ }
      return false
    },
    async maybeShowSubmittedSuccessAlert (proposalId, currentStatus) {
      if (this.isAdminView) return
      if (String(currentStatus || '').trim().toLowerCase() !== 'submitted') return
      if (!this.consumeSubmitSuccessPendingFlag(proposalId)) return

      await this.showAlert({
        title: 'สำเร็จ!',
        text: 'ยื่นโครงการเรียบร้อยแล้ว',
        icon: 'success',
        confirmButtonText: 'ตกลง'
      })
    },
    parseSettingsPayload (response) {
      const payload = response && response.data && response.data.data
      if (Array.isArray(payload)) return payload
      if (payload && Array.isArray(payload.settings)) return payload.settings
      if (Array.isArray(response && response.data)) return response.data
      return []
    },
    async fetchFundingBudgetConfig () {
      try {
        const response = await axios.get('/api/v1/setting')
        const settings = this.parseSettingsPayload(response)
        const setting = settings.find(item => item && item.key === FUNDING_BUDGET_SETTING_KEY)
        const rawValue = setting ? setting.value : null
        this.fundingBudgetConfig = parseFundingBudgetSettingValue(rawValue, { fallbackToDefault: true })
        writeFundingBudgetConfigToFallbackStorage(this.fundingBudgetConfig)
      } catch (error) {
        const fallbackConfig = readFundingBudgetConfigFromFallbackStorage()
        this.fundingBudgetConfig = (Array.isArray(fallbackConfig) && fallbackConfig.length > 0)
          ? fallbackConfig
          : createDefaultFundingBudgetConfig()
      }
    },
    async fetchBudgetMultiplierConfig () {
      try {
        const response = await axios.get('/api/v1/setting')
        const settings = this.parseSettingsPayload(response)
        const setting = settings.find(item => item && item.key === BUDGET_MULTIPLIER_SETTING_KEY)
        const rawValue = setting ? setting.value : null
        const parsedConfig = parseBudgetMultiplierSettingValue(rawValue, { fallbackToDefault: true })
        const fallbackConfig = readBudgetMultiplierConfigFromFallbackStorage()
        this.budgetMultiplierConfig = mergeBudgetMultiplierMaxValues(parsedConfig, fallbackConfig)
        writeBudgetMultiplierConfigToFallbackStorage(this.budgetMultiplierConfig)
      } catch (error) {
        const fallbackConfig = readBudgetMultiplierConfigFromFallbackStorage()
        this.budgetMultiplierConfig = (Array.isArray(fallbackConfig) && fallbackConfig.length > 0)
          ? fallbackConfig
          : createDefaultBudgetMultiplierConfig()
      }
    },
    requiresFundingSubType (fundingType) {
      return shouldRequireFundingSubType(this.fundingBudgetConfig, fundingType)
    },
    isExpectedOutcomeSelectionRequired (fundingType) {
      return [
        'new-researcher',
        'researcher-development',
        'strategic-research',
        'industry-extension'
      ].includes(String(fundingType || '').trim())
    },
    resolveFundingBudgetLimitContext (fundingType) {
      const fundingTypeLabel = getFundingTypeLabel(
        this.fundingBudgetConfig,
        fundingType,
        fundingType || 'ประเภททุนที่เลือก'
      )
      return {
        budgetLimit: getFundingTypeBudgetLimit(this.fundingBudgetConfig, fundingType),
        label: fundingTypeLabel
      }
    },
    feedbackSectionProgressStorageKey (proposalId = this.viewProposalId) {
      const normalizedProposalId = String(proposalId || '').trim()
      if (!normalizedProposalId) return ''
      return `${FEEDBACK_SECTION_PROGRESS_STORAGE_PREFIX}:${normalizedProposalId}`
    },
    persistFeedbackSectionCardStates (proposalId = this.viewProposalId) {
      if (typeof window === 'undefined' || !window.sessionStorage) return
      const storageKey = this.feedbackSectionProgressStorageKey(proposalId)
      if (!storageKey) return

      const sectionKeys = (Array.isArray(this.feedbackEditableSections) ? this.feedbackEditableSections : [])
        .map(section => (section && section.sectionKey ? section.sectionKey : ''))
        .filter(Boolean)

      if (!sectionKeys.length) {
        if (!this.userFeedback) return
        try {
          window.sessionStorage.removeItem(storageKey)
        } catch (_) { void _ }
        return
      }

      const states = {}
      sectionKeys.forEach(sectionKey => {
        const state = this.feedbackSectionCardStates[sectionKey]
        if (!state || typeof state !== 'object') return

        const isSubmitted = Boolean(state.submitted)
        const hasSubmittedAt = Boolean(state.submittedAt)
        const hasSnapshot = Object.prototype.hasOwnProperty.call(state, 'snapshot') && state.snapshot !== null && state.snapshot !== undefined
        if (!isSubmitted && !hasSubmittedAt && !hasSnapshot) return

        states[sectionKey] = {
          collapsed: Boolean(state.collapsed),
          submitted: isSubmitted,
          submittedAt: state.submittedAt || null,
          snapshot: hasSnapshot ? this.cloneSerializable(state.snapshot) : null
        }
      })

      if (!Object.keys(states).length) {
        try {
          window.sessionStorage.removeItem(storageKey)
        } catch (_) { void _ }
        return
      }

      const currentRound = Number(this.latestDecisionRound || (this.userFeedback && this.userFeedback.currentRound) || 0)
      const payload = {
        roundNo: Number.isFinite(currentRound) ? currentRound : 0,
        states
      }

      try {
        window.sessionStorage.setItem(storageKey, JSON.stringify(payload))
      } catch (_) { void _ }
    },
    restoreFeedbackSectionCardStates (proposalId = this.viewProposalId) {
      if (typeof window === 'undefined' || !window.sessionStorage) return
      const storageKey = this.feedbackSectionProgressStorageKey(proposalId)
      if (!storageKey) return

      try {
        const raw = window.sessionStorage.getItem(storageKey)
        if (!raw) return

        const parsed = JSON.parse(raw)
        const savedStates = parsed && parsed.states && typeof parsed.states === 'object'
          ? parsed.states
          : {}

        const savedRoundNo = Number(parsed && parsed.roundNo)
        const currentRoundNo = Number(this.latestDecisionRound || (this.userFeedback && this.userFeedback.currentRound) || 0)
        if (Number.isFinite(savedRoundNo) && savedRoundNo > 0 && Number.isFinite(currentRoundNo) && currentRoundNo > 0 && savedRoundNo !== currentRoundNo) {
          window.sessionStorage.removeItem(storageKey)
          return
        }

        const restored = {}
        Object.keys(savedStates).forEach(sectionKey => {
          const state = savedStates[sectionKey]
          if (!state || typeof state !== 'object') return
          restored[sectionKey] = {
            collapsed: Boolean(state.collapsed),
            submitted: Boolean(state.submitted),
            submittedAt: state.submittedAt || null,
            snapshot: Object.prototype.hasOwnProperty.call(state, 'snapshot') ? state.snapshot : null,
            saving: false
          }
        })

        if (!Object.keys(restored).length) return

        this.feedbackSectionCardStates = {
          ...restored,
          ...(this.feedbackSectionCardStates || {})
        }
      } catch (_) { void _ }
    },
    clearFeedbackSectionCardStatesStorage (proposalId = this.viewProposalId) {
      if (typeof window === 'undefined' || !window.sessionStorage) return
      const storageKey = this.feedbackSectionProgressStorageKey(proposalId)
      if (!storageKey) return
      try {
        window.sessionStorage.removeItem(storageKey)
      } catch (_) { void _ }
    },
    currentFeedbackRoundNo () {
      const roundNo = Number(
        this.latestDecisionRound ||
        (this.userFeedback && this.userFeedback.currentRound) ||
        (this.loadedProposal && this.loadedProposal.currentRound) ||
        0
      )
      return Number.isFinite(roundNo) && roundNo > 0 ? roundNo : 0
    },
    feedbackSectionBaselineStorageKey (proposalId = this.viewProposalId) {
      const normalizedProposalId = String(proposalId || '').trim()
      if (!normalizedProposalId) return ''
      return `${FEEDBACK_SECTION_BASELINE_STORAGE_PREFIX}:${normalizedProposalId}`
    },
    persistFeedbackSectionBaselines (proposalId = this.viewProposalId) {
      if (typeof window === 'undefined' || !window.sessionStorage) return
      const storageKey = this.feedbackSectionBaselineStorageKey(proposalId)
      if (!storageKey) return

      const baselines = this.cloneSerializable(this.feedbackSectionBaselines || {})
      if (!baselines || !Object.keys(baselines).length) {
        try {
          window.sessionStorage.removeItem(storageKey)
        } catch (_) { void _ }
        return
      }

      const payload = {
        roundNo: this.currentFeedbackRoundNo(),
        baselines
      }

      try {
        window.sessionStorage.setItem(storageKey, JSON.stringify(payload))
      } catch (_) { void _ }
    },
    restoreFeedbackSectionBaselines (proposalId = this.viewProposalId) {
      if (typeof window === 'undefined' || !window.sessionStorage) return false
      const storageKey = this.feedbackSectionBaselineStorageKey(proposalId)
      if (!storageKey) return false

      try {
        const raw = window.sessionStorage.getItem(storageKey)
        if (!raw) return false
        const parsed = JSON.parse(raw)
        const savedRoundNo = Number(parsed && parsed.roundNo)
        const currentRoundNo = this.currentFeedbackRoundNo()
        if (
          Number.isFinite(savedRoundNo) &&
          savedRoundNo > 0 &&
          Number.isFinite(currentRoundNo) &&
          currentRoundNo > 0 &&
          savedRoundNo !== currentRoundNo
        ) {
          window.sessionStorage.removeItem(storageKey)
          return false
        }

        const baselines = parsed && parsed.baselines && typeof parsed.baselines === 'object'
          ? parsed.baselines
          : {}
        if (!Object.keys(baselines).length) return false
        this.feedbackSectionBaselines = {
          ...(this.feedbackSectionBaselines || {}),
          ...this.cloneSerializable(baselines)
        }
        return true
      } catch (_) {
        return false
      }
    },
    clearFeedbackSectionBaselinesStorage (proposalId = this.viewProposalId) {
      if (typeof window === 'undefined' || !window.sessionStorage) return
      const storageKey = this.feedbackSectionBaselineStorageKey(proposalId)
      if (!storageKey) return
      try {
        window.sessionStorage.removeItem(storageKey)
      } catch (_) { void _ }
    },
    syncFeedbackSectionBaselines (sections) {
      if (!this.viewProposalId || this.isAdminView || !this.isRevisionRequested) return
      const normalizedSections = Array.isArray(sections) ? sections : []
      if (!normalizedSections.length) return

      this.restoreFeedbackSectionBaselines(this.viewProposalId)

      const baselinePool = {
        ...(this.feedbackSectionBaselines || {})
      }
      let hasChanged = false

      normalizedSections.forEach(section => {
        const sectionKey = section && section.sectionKey ? String(section.sectionKey) : ''
        if (!sectionKey) return
        if (Object.prototype.hasOwnProperty.call(baselinePool, sectionKey)) return
        baselinePool[sectionKey] = this.cloneSerializable(this.currentFeedbackSectionValue(sectionKey))
        hasChanged = true
      })

      const activeSectionKeys = normalizedSections
        .map(section => (section && section.sectionKey ? String(section.sectionKey) : ''))
        .filter(Boolean)
      Object.keys(baselinePool).forEach(sectionKey => {
        if (activeSectionKeys.includes(sectionKey)) return
        delete baselinePool[sectionKey]
        hasChanged = true
      })

      if (hasChanged) {
        this.feedbackSectionBaselines = baselinePool
        this.persistFeedbackSectionBaselines(this.viewProposalId)
      }
    },
    sanitizeDiffText (value) {
      return String(value || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    },
    truncateDiffText (value, maxLength = 220) {
      const text = this.sanitizeDiffText(value)
      if (!text) return '-'
      if (text.length <= maxLength) return text
      return `${text.slice(0, maxLength)}...`
    },
    normalizeBudgetForDiff (budgetValue) {
      const budget = budgetValue && typeof budgetValue === 'object' ? budgetValue : {}
      const categories = Array.isArray(budget.categories) ? budget.categories : []

      const normalizedCategories = categories.map((category) => {
        const items = Array.isArray(category && category.items) ? category.items : []
        const total = this.normalizeBudgetNumber(
          items.reduce((sum, item) => sum + (Number(item && item.total) || 0), 0)
        )
        const periodTotals = [0, 1, 2].map((periodIndex) => this.normalizeBudgetNumber(
          items.reduce((sum, item) => {
            const periods = item && Array.isArray(item.periods) ? item.periods : []
            return sum + (Number(periods[periodIndex]) || 0)
          }, 0)
        ))
        const attachmentCount = items.reduce((sum, item) => {
          const hasAttachment = Boolean(item && item.attachment && (item.attachment.fileId || item.attachment.name || item.attachment.fileName))
          return sum + (hasAttachment ? 1 : 0)
        }, 0)
        return {
          name: String((category && category.name) || ''),
          itemCount: items.length,
          total,
          periodTotals,
          attachmentCount
        }
      }).filter(category => category.itemCount > 0 || category.total > 0)

      const computedGrandTotal = this.normalizeBudgetNumber(
        normalizedCategories.reduce((sum, category) => sum + (Number(category.total) || 0), 0)
      )
      const declaredGrandTotal = this.normalizeBudgetNumber(budget.grandTotal)
      const periodTotals = [0, 1, 2].map((periodIndex) => this.normalizeBudgetNumber(
        normalizedCategories.reduce((sum, category) => {
          const row = Array.isArray(category.periodTotals) ? category.periodTotals : []
          return sum + (Number(row[periodIndex]) || 0)
        }, 0)
      ))

      return {
        grandTotal: declaredGrandTotal > 0 ? declaredGrandTotal : computedGrandTotal,
        itemCount: normalizedCategories.reduce((sum, category) => sum + (Number(category.itemCount) || 0), 0),
        categoryTotals: normalizedCategories,
        periodTotals,
        attachmentCount: normalizedCategories.reduce((sum, category) => sum + (Number(category.attachmentCount) || 0), 0)
      }
    },
    normalizeFeedbackValueForDiff (sectionKey, value) {
      if (sectionKey === 'budget') return this.normalizeBudgetForDiff(value)
      if (sectionKey === 'strategic_alignment') return this.normalizeStrategicAlignmentValue(value)
      if (sectionKey === 'expected_outcomes') return this.normalizeExpectedOutcomesValue(value)
      if (sectionKey === 'research_team') {
        const source = value && typeof value === 'object' ? value : {}
        return {
          name: String(source.name || ''),
          affiliation: String(source.affiliation || ''),
          phone: String(source.phone || ''),
          email: String(source.email || ''),
          proportion: String(source.proportion || '')
        }
      }
      if (sectionKey === 'work_plan') {
        const rows = Array.isArray(value) ? value : []
        return {
          rowCount: rows.length,
          rows: this.cloneSerializable(rows)
        }
      }
      if (typeof value === 'string') return this.sanitizeDiffText(value)
      return this.cloneSerializable(value)
    },
    feedbackDiffSummaryText (sectionKey, value) {
      if (value === null || value === undefined || value === '') return '-'

      if (sectionKey === 'budget') {
        const normalized = value && typeof value === 'object' ? value : {}
        const grandTotal = this.normalizeBudgetNumber(normalized.grandTotal)
        const itemCount = Number(normalized.itemCount) || 0
        const attachmentCount = Number(normalized.attachmentCount) || 0
        const periodTotals = Array.isArray(normalized.periodTotals) ? normalized.periodTotals : [0, 0, 0]
        const periodSummary = `งวด 1/2/3: ${this.normalizeBudgetNumber(periodTotals[0]).toLocaleString('th-TH')}/${this.normalizeBudgetNumber(periodTotals[1]).toLocaleString('th-TH')}/${this.normalizeBudgetNumber(periodTotals[2]).toLocaleString('th-TH')} บาท`
        const categories = Array.isArray(normalized.categoryTotals) ? normalized.categoryTotals : []
        const topCategories = categories
          .slice()
          .sort((left, right) => (Number(right.total) || 0) - (Number(left.total) || 0))
          .slice(0, 3)
          .map(category => `${category.name || '-'}: ${this.normalizeBudgetNumber(category.total).toLocaleString('th-TH')} บาท`)
          .join(' | ')

        const main = `งบรวม ${grandTotal.toLocaleString('th-TH')} บาท, ${itemCount} รายการ, เอกสารแนบ ${attachmentCount} ไฟล์`
        const detail = `${main} | ${periodSummary}`
        return topCategories ? `${detail} | ${topCategories}` : detail
      }

      if (sectionKey === 'strategic_alignment') {
        return `ประเภททุน: ${(value && value.fundingType) || '-'} | ประเภทย่อย: ${(value && value.fundingSubType) || '-'}`
      }

      if (sectionKey === 'expected_outcomes') {
        return `ประเภททุน: ${(value && value.fundingType) || '-'} | ผลลัพธ์: ${(value && value.selectedOutcome) || '-'}`
      }

      if (sectionKey === 'research_team') {
        const source = value && typeof value === 'object' ? value : {}
        return [
          source.name ? `ชื่อ: ${source.name}` : '',
          source.affiliation ? `สังกัด: ${source.affiliation}` : '',
          source.email ? `อีเมล: ${source.email}` : '',
          source.phone ? `โทร: ${source.phone}` : ''
        ].filter(Boolean).join(' | ') || '-'
      }

      if (sectionKey === 'work_plan' && value && typeof value === 'object') {
        const rowCount = Number(value.rowCount) || 0
        return `จำนวนแผนงาน: ${rowCount}`
      }

      if (typeof value === 'string') return this.truncateDiffText(value)
      return this.truncateDiffText(JSON.stringify(value))
    },
    revisionDiffSectionLabel (sectionKey, fallbackLabel = '') {
      if (fallbackLabel) return fallbackLabel
      const key = String(sectionKey || '').trim()
      if (!key) return '-'

      const fromEditableSections = (this.feedbackEditableSections || [])
        .find(section => String(section && section.sectionKey ? section.sectionKey : '') === key)
      if (fromEditableSections && fromEditableSections.meta && fromEditableSections.meta.sectionLabel) {
        return fromEditableSections.meta.sectionLabel
      }

      const fromMap = Object.values(COMMITTEE_SECTION_FEEDBACK_MAP || {})
        .find(entry => String(entry && entry.sectionKey ? entry.sectionKey : '') === key)
      if (fromMap && fromMap.sectionLabel) return fromMap.sectionLabel

      return key
    },
    revisionDiffCurrentSectionValue (sectionKey) {
      const key = String(sectionKey || '').trim()
      if (!key) return null

      if (!this.isAdminView && this.isRevisionRequested) {
        const state = this.feedbackSectionState(key)
        if (
          state &&
          state.submitted &&
          Object.prototype.hasOwnProperty.call(state, 'snapshot') &&
          state.snapshot !== null &&
          state.snapshot !== undefined
        ) {
          return this.cloneSerializable(state.snapshot)
        }

        if (Object.prototype.hasOwnProperty.call(this.feedbackSectionDrafts || {}, key)) {
          return this.cloneSerializable(this.feedbackSectionDrafts[key])
        }
      }

      return this.cloneSerializable(this.currentFeedbackSectionValue(key))
    },
    buildCurrentRevisionDiffSummary () {
      const sections = Array.isArray(this.feedbackEditableSections) ? this.feedbackEditableSections : []
      if (!sections.length) return { roundNo: this.currentFeedbackRoundNo(), generatedAt: new Date().toISOString(), sections: [] }

      const result = []
      sections.forEach(section => {
        const sectionKey = section && section.sectionKey ? String(section.sectionKey) : ''
        if (!sectionKey) return

        const beforeValue = Object.prototype.hasOwnProperty.call(this.feedbackSectionBaselines || {}, sectionKey)
          ? this.feedbackSectionBaselines[sectionKey]
          : null
        const afterValue = this.revisionDiffCurrentSectionValue(sectionKey)

        const beforeNormalized = this.normalizeFeedbackValueForDiff(sectionKey, beforeValue)
        const afterNormalized = this.normalizeFeedbackValueForDiff(sectionKey, afterValue)

        let changed = true
        try {
          changed = JSON.stringify(beforeNormalized) !== JSON.stringify(afterNormalized)
        } catch (_) {
          changed = true
        }
        if (!changed) return

        result.push({
          sectionKey,
          sectionLabel: this.revisionDiffSectionLabel(sectionKey, section && section.meta && section.meta.sectionLabel),
          beforeSummary: this.feedbackDiffSummaryText(sectionKey, beforeNormalized),
          afterSummary: this.feedbackDiffSummaryText(sectionKey, afterNormalized)
        })
      })

      return {
        roundNo: this.currentFeedbackRoundNo(),
        generatedAt: new Date().toISOString(),
        sections: result
      }
    },
    syncRouteProposalId (proposalId) {
      if (!proposalId || !this.$router || !this.$route) return
      const nextQuery = {
        ...(this.$route.query || {}),
        id: proposalId
      }
      delete nextQuery.new
      this.$router.replace({
        name: this.$route.name || 'ResearchForm',
        query: nextQuery
      }).catch(() => {})
    },
    adminGetStatusLabel (status) {
      return ADMIN_STATUS_LABELS[status] || status || '-'
    },
    adminGetStatusBadgeColor (status) {
      return ADMIN_STATUS_COLORS[normalizeProposalStatus(status)] || 'secondary'
    },
    adminGetSelectValue (val) {
      return val && val.target ? val.target.value : val
    },
    openAdminStatusModal () {
      if (!this.isAdminView || !this.viewProposalId) return
      this.adminNewStatus = ''
      this.adminStatusRemark = ''
      this.adminShowStatusModal = true
    },
    closeAdminStatusModal () {
      this.adminShowStatusModal = false
      this.adminNewStatus = ''
      this.adminStatusRemark = ''
    },
    onAdminNewStatusChange (val) {
      this.adminNewStatus = this.adminGetSelectValue(val)
    },
    async confirmAdminChangeStatus () {
      if (!this.isAdminView || !this.viewProposalId || !this.adminNewStatus) return
      if (this.isAdminManualStatusBlocked(this.adminNewStatus)) {
        await Swal.fire(this.$t('researchFormAdminFooter.changeStatus.errorTitle'), this.$t('researchFormAdminFooter.changeStatus.blockedText'), 'error')
        return
      }
      this.adminSubmittingStatus = true
      try {
        await Service.proposal.changeStatus(this.viewProposalId, {
          toStatus: this.adminNewStatus,
          remark: this.adminStatusRemark || ''
        })
        await this.loadProposalById(this.viewProposalId)
        this.adminShowStatusModal = false
        await Swal.fire({ icon: 'success', title: this.$t('researchFormAdminFooter.changeStatus.successTitle'), timer: 1500, showConfirmButton: false })
      } catch (err) {
        await Swal.fire(this.$t('researchFormAdminFooter.changeStatus.errorTitle'), (err && err.response && err.response.data && err.response.data.message) || this.$t('researchFormAdminFooter.common.retry'), 'error')
      } finally {
        this.adminSubmittingStatus = false
      }
    },
    async openAdminCommitteeModal () {
      if (!this.isAdminView || !this.viewProposalId) return
      await this.fetchWorkflowApprovalPolicy()
      const ids = (this.loadedProposal && Array.isArray(this.loadedProposal.committeeIds)) ? this.loadedProposal.committeeIds : []
      this.adminSelectedCommitteeIds = ids.map(String)
      this.adminCommitteeSearch = ''
      this.adminShowCommitteeModal = true
      this.fetchAdminCommitteeUsers()
    },
    closeAdminCommitteeModal () {
      this.adminShowCommitteeModal = false
      this.adminCommitteeSearch = ''
      this.adminSelectedCommitteeIds = []
    },
    async openAdminChairmanModal () {
      if (!this.isAdminView || !this.viewProposalId || !this.adminCanShowChairmanAction) return
      this.adminSelectedChairmanId = ''
      this.adminShowChairmanModal = true
      await this.fetchAdminChairmanUsers()
    },
    async openAdminFinanceModal () {
      if (!this.adminCanShowFinanceAction) return
      this.adminSelectedFinanceOfficerId = ''
      this.adminShowFinanceModal = true
      await this.fetchAdminFinanceUsers()
    },
    closeAdminChairmanModal () {
      this.adminShowChairmanModal = false
      this.adminSelectedChairmanId = ''
    },
    closeAdminFinanceModal () {
      this.adminShowFinanceModal = false
      this.adminSelectedFinanceOfficerId = ''
    },
    onAdminChairmanChange (val) {
      this.adminSelectedChairmanId = this.adminGetSelectValue(val)
    },
    onAdminFinanceOfficerChange (val) {
      this.adminSelectedFinanceOfficerId = this.adminGetSelectValue(val)
    },
    isAdminSelectedCommittee (id) {
      const key = String(id)
      return (this.adminSelectedCommitteeIds || []).map(String).includes(key)
    },
    toggleAdminCommitteeSelection (user) {
      const key = String(user && user._id ? user._id : '')
      if (!key) return
      const current = (this.adminSelectedCommitteeIds || []).map(String)
      const idx = current.indexOf(key)
      if (idx >= 0) {
        current.splice(idx, 1)
      } else {
        current.push(key)
      }
      this.adminSelectedCommitteeIds = current
    },
    removeAdminSelectedCommittee (id) {
      const key = String(id)
      this.adminSelectedCommitteeIds = (this.adminSelectedCommitteeIds || []).map(String).filter(x => x !== key)
    },
    async fetchWorkflowApprovalPolicy () {
      try {
        const response = await axios.get('/api/v1/setting/workflow-policy')
        const payload = response && response.data && response.data.data ? response.data.data : {}
        this.workflowApprovalPolicy = {
          ...this.workflowApprovalPolicy,
          minScore: Number.isFinite(Number(payload.minScore)) ? Number(payload.minScore) : this.workflowApprovalPolicy.minScore,
          minCommittee: Number.isFinite(Number(payload.minCommittee)) ? Number(payload.minCommittee) : this.workflowApprovalPolicy.minCommittee,
          maxRounds: Number.isFinite(Number(payload.maxRounds)) ? Number(payload.maxRounds) : this.workflowApprovalPolicy.maxRounds,
          allowRevisionAfterMeeting: payload.allowRevisionAfterMeeting !== undefined
            ? Boolean(payload.allowRevisionAfterMeeting)
            : this.workflowApprovalPolicy.allowRevisionAfterMeeting
        }
      } catch (_) { /* ignore */ }
    },
    async fetchAdminCommitteeUsers () {
      this.adminCommitteeUsersLoading = true
      this.adminCommitteeUsersError = null
      try {
        const proposalId = String(this.viewProposalId || '')
        const res = await Service.proposal.getCommitteeUsers({ limit: 200, proposalId })
        const payload = res && res.data ? res.data : null
        if (Array.isArray(payload)) this.adminCommitteeUsers = payload
        else if (payload && Array.isArray(payload.data)) this.adminCommitteeUsers = payload.data
        else this.adminCommitteeUsers = []

        if (payload && payload.data && !Array.isArray(payload.data)) {
          const wrapped = payload.data
          this.adminCommitteeUsers = Array.isArray(wrapped.items) ? wrapped.items : []
        }

        const allowedCommitteeIds = new Set((this.adminCommitteeUsers || []).map(u => String(u && u._id ? u._id : '')).filter(Boolean))
        this.adminSelectedCommitteeIds = (this.adminSelectedCommitteeIds || []).map(String).filter(id => allowedCommitteeIds.has(id))
      } catch (err) {
        this.adminCommitteeUsers = []
        this.adminCommitteeUsersError = (err && err.response && err.response.data && err.response.data.message)
          || err.message
          || 'Unknown error'
      } finally {
        this.adminCommitteeUsersLoading = false
      }
    },
    async fetchAdminChairmanUsers () {
      this.adminChairmanUsersLoading = true
      this.adminChairmanUsersError = null
      try {
        const proposalId = String(this.viewProposalId || '')
        const res = await Service.proposal.getCommitteeUsers({ role: 'chairman', limit: 100, proposalId })
        const payload = res && res.data ? res.data : null
        if (payload && payload.data && !Array.isArray(payload.data)) {
          const wrapped = payload.data
          this.adminChairmanUsers = Array.isArray(wrapped.items) ? wrapped.items : []
        } else if (payload && Array.isArray(payload.data)) {
          this.adminChairmanUsers = payload.data
        } else {
          this.adminChairmanUsers = []
        }
      } catch (err) {
        this.adminChairmanUsers = []
        this.adminChairmanUsersError = (err && err.response && err.response.data && err.response.data.message)
          || err.message
          || 'Unknown error'
      } finally {
        this.adminChairmanUsersLoading = false
      }
    },
    async fetchAdminFinanceUsers () {
      this.adminFinanceUsersLoading = true
      this.adminFinanceUsersError = null
      try {
        const proposalId = String(this.viewProposalId || '')
        const res = await Service.proposal.getCommitteeUsers({ role: 'finance_officer', limit: 100, proposalId })
        const payload = res && res.data ? res.data : null
        if (payload && payload.data && !Array.isArray(payload.data)) {
          const wrapped = payload.data
          this.adminFinanceUsers = Array.isArray(wrapped.items) ? wrapped.items : []
        } else if (payload && Array.isArray(payload.data)) {
          this.adminFinanceUsers = payload.data
        } else {
          this.adminFinanceUsers = []
        }
      } catch (err) {
        this.adminFinanceUsers = []
        this.adminFinanceUsersError = (err && err.response && err.response.data && err.response.data.message)
          || err.message
          || 'Unknown error'
      } finally {
        this.adminFinanceUsersLoading = false
      }
    },
    async confirmAdminAssignChairman () {
      if (!this.isAdminView || !this.viewProposalId || !this.adminSelectedChairmanId) return
      this.adminSubmittingChairman = true
      try {
        await Service.proposal.assignChairman(this.viewProposalId, { chairmanIds: [this.adminSelectedChairmanId] })
        await this.loadProposalById(this.viewProposalId)
        this.adminShowChairmanModal = false
        await Swal.fire({ icon: 'success', title: this.$t('researchFormAdminFooter.assignChairman.successTitle'), timer: 1500, showConfirmButton: false })
      } catch (err) {
        await Swal.fire(this.$t('researchFormAdminFooter.assignChairman.errorTitle'), (err && err.response && err.response.data && err.response.data.message) || this.$t('researchFormAdminFooter.common.retry'), 'error')
      } finally {
        this.adminSubmittingChairman = false
      }
    },
    async confirmAdminAssignFinanceOfficer () {
      if (!this.isAdminView || !this.viewProposalId || !this.adminSelectedFinanceOfficerId) return
      this.adminSubmittingFinance = true
      const isSendToFinanceAction = this.adminIsSendToFinanceAction
      try {
        await Service.proposal.assignFinanceOfficer(this.viewProposalId, { financeOfficerIds: [this.adminSelectedFinanceOfficerId] })
        await this.loadProposalById(this.viewProposalId)
        this.adminShowFinanceModal = false
        await Swal.fire({
          icon: 'success',
          title: isSendToFinanceAction ? this.$t('researchFormAdminFooter.assignFinance.successTitleSend') : this.$t('researchFormAdminFooter.assignFinance.successTitleAssign'),
          timer: 1500,
          showConfirmButton: false
        })
      } catch (err) {
        await Swal.fire(
          isSendToFinanceAction ? this.$t('researchFormAdminFooter.assignFinance.errorTitleSend') : this.$t('researchFormAdminFooter.assignFinance.errorTitleAssign'),
          (err && err.response && err.response.data && err.response.data.message) || this.$t('researchFormAdminFooter.common.retry'),
          'error'
        )
      } finally {
        this.adminSubmittingFinance = false
      }
    },
    async confirmAdminAssignCommittee () {
      if (!this.isAdminView || !this.viewProposalId) return
      const minRequired = this.adminRequiredCommitteeCount
      if (this.adminSelectedCommitteeIds.length < minRequired) {
        await Swal.fire(this.$t('researchFormAdminFooter.assignCommittee.warningTitle'), this.$t('researchFormAdminFooter.assignCommittee.warningText', { count: minRequired }), 'warning')
        return
      }
      this.adminSubmittingCommittee = true
      try {
        const committeeIds = (this.adminSelectedCommitteeIds || []).map(String)
        await Service.proposal.assignCommittee(this.viewProposalId, { committeeIds })
        await this.loadProposalById(this.viewProposalId)
        this.adminShowCommitteeModal = false
        await Swal.fire({ icon: 'success', title: this.$t('researchFormAdminFooter.assignCommittee.successTitle'), timer: 1500, showConfirmButton: false })
      } catch (err) {
        await Swal.fire(this.$t('researchFormAdminFooter.assignCommittee.errorTitle'), (err && err.response && err.response.data && err.response.data.message) || this.$t('researchFormAdminFooter.common.retry'), 'error')
      } finally {
        this.adminSubmittingCommittee = false
      }
    },
    formatAdminParticipantLabel (u) {
      if (!u) return '-'
      return u.fullName || u.email || '-'
    },
    async fetchAdminParticipantOptions () {
      this.adminParticipantOptionsLoading = true
      this.adminParticipantOptionsError = null
      try {
        const response = await axios.get('/api/v1/users', { params: { page: 1, limit: 200 } })
        const payload = (response && response.data && response.data.data) || {}
        const list = Array.isArray(payload.users) ? payload.users : []
        this.adminParticipantOptions = list.map(u => {
          const name = (u && u.fullName) ? String(u.fullName) : ''
          const email = (u && u.email) ? String(u.email) : ''
          return { ...u, searchText: `${name} ${email}`.trim() }
        })
      } catch (err) {
        console.error('[ResearchForm] Error fetching users for participant select:', err)
        this.adminParticipantOptions = []
        this.adminParticipantOptionsError = (err && err.message) || 'โหลดข้อมูลไม่สำเร็จ'
      } finally {
        this.adminParticipantOptionsLoading = false
      }
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
        } catch (err) { void err }
      })
    },
    pad2(n) {
      const x = parseInt(n, 10)
      if (!Number.isFinite(x)) return '00'
      return x < 10 ? `0${x}` : String(x)
    },
    formatYmd(d) {
      const date = d instanceof Date ? d : new Date(d)
      if (Number.isNaN(date.getTime())) return ''
      return `${date.getFullYear()}-${this.pad2(date.getMonth() + 1)}-${this.pad2(date.getDate())}`
    },
    parseLocalYmd(ymd) {
      const raw = String(ymd || '').trim()
      if (!raw) return null
      const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (!m) return null
      const y = parseInt(m[1], 10)
      const mo = parseInt(m[2], 10) - 1
      const da = parseInt(m[3], 10)
      const d = new Date(y, mo, da)
      return Number.isNaN(d.getTime()) ? null : d
    },
    timeToMinutes(value) {
      const v = String(value || '').trim()
      if (!v) return NaN
      const m = v.match(/^(\d{1,2}):(\d{2})$/)
      if (!m) return NaN
      const h = parseInt(m[1], 10)
      const min = parseInt(m[2], 10)
      if (!Number.isFinite(h) || !Number.isFinite(min)) return NaN
      return (h * 60) + min
    },
    minutesToTime(minutes) {
      const m = parseInt(minutes, 10)
      if (!Number.isFinite(m) || m < 0) return ''
      const h = Math.floor(m / 60)
      const mi = m % 60
      return `${this.pad2(h)}:${this.pad2(mi)}`
    },
    ceilMinutesToStep(minutes, step = 15) {
      const m = parseInt(minutes, 10)
      const s = parseInt(step, 10)
      if (!Number.isFinite(m) || !Number.isFinite(s) || s <= 0) return m
      return Math.ceil(m / s) * s
    },
    formatDuration(totalMinutes) {
      const mins = parseInt(totalMinutes, 10)
      if (!Number.isFinite(mins) || mins <= 0) return ''
      const h = Math.floor(mins / 60)
      const m = mins % 60
      if (h > 0 && m > 0) return `${h} ชม. ${m} นาที`
      if (h > 0) return `${h} ชม.`
      return `${m} นาที`
    },
    formatTime12h(value) {
      const v = String(value || '').trim()
      if (!v) return ''
      const m = v.match(/^(\d{1,2}):(\d{2})$/)
      if (!m) return v
      const hh = parseInt(m[1], 10)
      const mm = m[2]
      if (!Number.isFinite(hh)) return v
      return `${this.pad2(hh)}:${mm}น.`
    },
    buildTimeOptions({ min = BASE_MEETING_START_TIME, max = '23:45', step = 15, includeEmpty = false, formatLabel } = {}) {
      const minMinutes = this.timeToMinutes(min)
      const maxMinutes = this.timeToMinutes(max)
      const s = parseInt(step, 10)
      const out = []
      if (includeEmpty) out.push({ value: '', label: (typeof formatLabel === 'function') ? formatLabel('') : '-' })
      if (!Number.isFinite(minMinutes) || !Number.isFinite(maxMinutes) || !Number.isFinite(s) || s <= 0) return out
      for (let t = minMinutes; t <= maxMinutes; t += s) {
        const value = this.minutesToTime(t)
        const label = (typeof formatLabel === 'function') ? formatLabel(value) : value
        out.push({ value, label })
      }
      return out
    },
    isTimeSelected(kind, value) {
      if (!kind) return false
      const v = String(value || '')
      if (kind === 'start') return String(this.adminMeetingForm.startTime || '') === v
      if (kind === 'end') return String(this.adminMeetingForm.endTime || '') === v
      return false
    },
    selectTimeOption(kind, value) {
      if (kind === 'start') {
        this.adminMeetingForm.startTime = String(value || '')
        const end = this.adminMeetingForm && this.adminMeetingForm.endTime ? String(this.adminMeetingForm.endTime) : ''
        if (end && this.timeToMinutes(end) < this.timeToMinutes(this.adminMeetingForm.startTime)) {
          this.adminMeetingForm.endTime = ''
        }
      } else if (kind === 'end') {
        const nextValue = String(value || '')
        const start = this.adminMeetingForm && this.adminMeetingForm.startTime ? String(this.adminMeetingForm.startTime) : ''
        if (nextValue && start && this.timeToMinutes(nextValue) < this.timeToMinutes(start)) return
        this.adminMeetingForm.endTime = nextValue
      }
      this.closeTimeDropdown()
    },
    toggleTimeDropdown(kind) {
      if (kind === 'end' && !(this.adminMeetingForm && this.adminMeetingForm.startTime)) return
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
    openAdminMeetingManage () {
      if (!this.isAdminView || !this.viewProposalId) return
      const p = this.loadedProposal || {}
      const projectTitle = p.projectTitleTh || p.projectTitleEn || p.projectTitle || ''
      const title = projectTitle ? `ประชุมพิจารณาโครงการ: ${projectTitle}` : 'ประชุมพิจารณาโครงการ'
      this.adminMeetingForm = {
        title,
        meetingDate: '',
        startTime: '',
        endTime: '',
        meetingType: 'online',
        location: '',
        videoLink: '',
        agenda: projectTitle ? `โครงการ: ${projectTitle}` : '',
        status: 'scheduled'
      }
      this.adminSelectedParticipantOptions = []
      if (!this.adminParticipantOptionsLoading && (!this.adminParticipantOptions || !this.adminParticipantOptions.length)) {
        this.fetchAdminParticipantOptions()
      }
      this.adminShowMeetingPopup = true
    },
    closeAdminMeetingPopup () {
      this.adminShowMeetingPopup = false
      this.closeTimeDropdown()
    },
    async submitAdminMeeting () {
      if (!this.isAdminView || !this.viewProposalId) return
      if (!this.adminMeetingForm.title || !this.adminMeetingForm.meetingDate || !this.adminMeetingForm.startTime) return

      const meetingType = this.adminMeetingForm && this.adminMeetingForm.meetingType
        ? String(this.adminMeetingForm.meetingType)
        : 'online'
      const location = this.adminMeetingForm && this.adminMeetingForm.location ? String(this.adminMeetingForm.location).trim() : ''
      const videoLink = this.adminMeetingForm && this.adminMeetingForm.videoLink ? String(this.adminMeetingForm.videoLink).trim() : ''

      if (meetingType === 'onsite' && !location) {
        await Swal.fire({ icon: 'warning', title: 'กรอกข้อมูลไม่ครบ', text: 'การประชุมแบบออนไซต์ต้องระบุสถานที่' })
        return
      }

      if (meetingType === 'online' && !videoLink) {
        await Swal.fire({ icon: 'warning', title: 'กรอกข้อมูลไม่ครบ', text: 'การประชุมแบบออนไลน์ต้องระบุลิงก์วิดีโอประชุม' })
        return
      }

      this.adminMeetingSubmitting = true
      try {
        const participantIds = Array.isArray(this.adminSelectedParticipantOptions)
          ? this.adminSelectedParticipantOptions.map(u => String(u && u._id)).filter(Boolean)
          : []
        const body = {
          title: String(this.adminMeetingForm.title || '').trim(),
          meetingDate: this.adminMeetingForm.meetingDate,
          startTime: this.adminMeetingForm.startTime,
          endTime: this.adminMeetingForm.endTime || '',
          meetingType,
          location: meetingType === 'online' ? '' : location,
          videoLink,
          participantIds,
          agenda: this.adminMeetingForm.agenda || '',
          status: this.adminMeetingForm.status || 'scheduled',
          proposalIds: [String(this.viewProposalId)]
        }
        await axios.post('/api/v1/meetings', body)
        this.adminShowMeetingPopup = false
        await Swal.fire({ icon: 'success', title: 'บันทึกการประชุมสำเร็จ', timer: 1500, showConfirmButton: false })
      } catch (err) {
        await Swal.fire('บันทึกไม่สำเร็จ', (err && err.response && err.response.data && err.response.data.message) || 'ลองใหม่อีกครั้ง', 'error')
      } finally {
        this.adminMeetingSubmitting = false
      }
    },
    decisionStatusLabel (status) {
      if (status === 'pending_confirm') return 'รอยืนยันผู้ร่วมโครงการ'
      if (status === 'revision_requested') return 'ขอแก้ไขเพิ่มเติม'
      if (status === 'approved') return 'อนุมัติ'
      if (status === 'rejected') return 'ไม่อนุมัติ'
      if (status === 'submitted') return 'ยื่นแล้ว'
      return status || '-'
    },
    isAdminManualStatusBlocked (status) {
      const normalizedStatus = String(normalizeProposalStatus(status) || status || '').trim().toLowerCase()
      return ADMIN_BLOCKED_MANUAL_STATUSES.includes(normalizedStatus)
    },
    onAdminFinalDecisionChange (val) {
      this.adminFinalDecision = val && val.target ? val.target.value : val
    },
    async saveAdminFinalDecision () {
      if (!this.isAdminView || !this.viewProposalId || !this.adminFinalDecision) return
      if (this.isAdminManualStatusBlocked(this.adminFinalDecision)) {
        await this.showAlert({
          icon: 'error',
          title: 'บันทึกผลการตัดสินใจไม่สำเร็จ',
          text: 'แอดมินไม่สามารถเปลี่ยนสถานะเป็นอนุมัติหรือไม่อนุมัติได้'
        })
        return
      }

      this.savingAdminDecision = true
      try {
        await Service.proposal.changeStatus(this.viewProposalId, {
          toStatus: this.adminFinalDecision,
          remark: this.adminFinalNote || ''
        })

        await this.loadProposalById(this.viewProposalId)
        await this.showAlert({
          icon: 'success',
          title: 'บันทึกผลการตัดสินใจสำเร็จ',
          text: 'ระบบได้อัปเดตสถานะโครงการเรียบร้อยแล้ว'
        })
      } catch (err) {
        await this.showAlert({
          icon: 'error',
          title: 'บันทึกผลการตัดสินใจไม่สำเร็จ',
          text: (err && err.response && err.response.data && err.response.data.message) || 'กรุณาลองใหม่อีกครั้ง'
        })
      } finally {
        this.savingAdminDecision = false
      }
    },
    async reopenRejectedForRevision () {
      if (!this.isAdminView || !this.viewProposalId || !this.isRejectedStatus) return

      const result = await this.showAlert({
        icon: 'warning',
        title: 'ยืนยันการเปิดให้แก้ไขอีกครั้ง',
        text: 'ต้องการเปลี่ยนสถานะจากไม่อนุมัติเป็นขอแก้ไขเพิ่มเติมใช่หรือไม่?',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
      })
      if (!result || !result.isConfirmed) return

      this.reopeningRejected = true
      try {
        await Service.proposal.changeStatus(this.viewProposalId, {
          toStatus: 'revision_requested',
          remark: this.adminFinalNote || 'Admin reopened proposal for revision'
        })

        await this.loadProposalById(this.viewProposalId)
        await this.fetchProposalReviews(this.viewProposalId)
        await this.showAlert({
          icon: 'success',
          title: 'เปิดให้แก้ไขสำเร็จ',
          text: 'ระบบได้เปลี่ยนสถานะเป็นขอแก้ไขเพิ่มเติมเรียบร้อยแล้ว'
        })
      } catch (err) {
        await this.showAlert({
          icon: 'error',
          title: 'ไม่สามารถเปิดให้แก้ไขได้',
          text: (err && err.response && err.response.data && err.response.data.message) || 'กรุณาลองใหม่อีกครั้ง'
        })
      } finally {
        this.reopeningRejected = false
      }
    },
    async saveRevisionChanges () {
      if (!this.viewProposalId || !this.isRevisionRequested) return

      this.clearAutoSaveTimer()
      this.savingRevision = true
      try {
        await this.$nextTick()
        await this.$nextTick()
        const payload = this.normalizeApiPayload()
        await Service.proposal.updateDraft(this.viewProposalId, payload)
        await this.loadProposalById(this.viewProposalId)
        await this.showAlert({
          icon: 'success',
          title: 'บันทึกการแก้ไขสำเร็จ',
          text: 'ระบบได้บันทึกการแก้ไขล่าสุดเรียบร้อยแล้ว'
        })
      } catch (err) {
        await this.showAlert({
          icon: 'error',
          title: 'บันทึกการแก้ไขไม่สำเร็จ',
          text: (err && err.response && err.response.data && err.response.data.message) || 'กรุณาลองใหม่อีกครั้ง'
        })
      } finally {
        this.savingRevision = false
      }
    },
    async resubmitRevision () {
      if (!this.viewProposalId || !this.isRevisionRequested) return
      if (this.feedbackLoading || this.feedbackError || !this.userFeedback) {
        await this.showAlert({
          icon: 'warning',
          title: 'ยังไม่พร้อมส่งเอกสารแก้ไข',
          text: 'กรุณารอให้ระบบโหลดข้อมูลข้อเสนอแนะให้ครบก่อน'
        })
        return
      }
      if (this.pendingFeedbackSectionsForResubmit.length > 0) {
        const missingSectionLabels = this.pendingFeedbackSectionLabels
        const missingSectionText = missingSectionLabels.length
          ? `กรุณาส่งแก้ไขหัวข้อต่อไปนี้ก่อน:\n- ${missingSectionLabels.join('\n- ')}`
          : 'กรุณาส่งแก้ไขรายหัวข้อให้ครบก่อนส่งเอกสารแก้ไขอีกครั้ง'
        await this.showAlert({
          icon: 'warning',
          title: 'ส่งแก้ไขรายหัวข้อยังไม่ครบ',
          text: missingSectionText
        })
        return
      }
      const completenessValidation = this.validateBeforeSubmit({ focusOnError: true })
      if (!completenessValidation.ok) {
        await this.showAlert({
          icon: 'warning',
          title: 'ข้อมูลยังไม่ครบถ้วน',
          text: completenessValidation.message || 'กรุณาตรวจสอบข้อมูลให้ครบถ้วนก่อนส่งแก้ไขอีกครั้ง'
        })
        return
      }

      this.clearAutoSaveTimer()
      this.submittingRevision = true
      try {
        await this.$nextTick()
        await this.$nextTick()
        const payload = this.normalizeApiPayload()
        await Service.proposal.updateDraft(this.viewProposalId, payload)
        await Service.proposal.resubmit(this.viewProposalId)
        this.clearFeedbackSectionCardStatesStorage(this.viewProposalId)
        this.clearFeedbackSectionBaselinesStorage(this.viewProposalId)
        this.feedbackSectionCardStates = {}
        this.feedbackSectionDrafts = {}
        this.feedbackSectionBaselines = {}
        await this.loadProposalById(this.viewProposalId)
        await this.fetchUserFeedback(this.viewProposalId)
        await this.showAlert({
          icon: 'success',
          title: 'ส่งแก้ไขอีกครั้งสำเร็จ',
          text: 'ข้อเสนอของคุณถูกส่งกลับเข้าสู่กระบวนการพิจารณาแล้ว'
        })
      } catch (err) {
        await this.showAlert({
          icon: 'error',
          title: 'ส่งแก้ไขอีกครั้งไม่สำเร็จ',
          text: (err && err.response && err.response.data && err.response.data.message) || 'กรุณาลองใหม่อีกครั้ง'
        })
      } finally {
        this.submittingRevision = false
      }
    },
    async fetchProposalReviews (proposalId) {
      this.reviewsLoading = true
      this.reviewsError = null
      this.proposalReviews = []
      try {
        let res
        try {
          res = await Service.proposal.getReviewsByProposal(encodeURIComponent(proposalId))
        } catch (err) {
          const status = err && err.response ? err.response.status : null
          if (status !== 404) throw err
          res = await Service.proposal.getReviewsByProposalAlt(encodeURIComponent(proposalId))
        }

        const payload = res && res.data ? res.data : null
        if (Array.isArray(payload)) this.proposalReviews = payload
        else if (payload && Array.isArray(payload.data)) this.proposalReviews = payload.data
        else this.proposalReviews = []
      } catch (err) {
        const status = err && err.response ? err.response.status : null
        this.proposalReviews = []
        if (status !== 404) {
          this.reviewsError = (err && err.response && err.response.data && err.response.data.message)
            || err.message
            || 'Unknown error'
        }
      } finally {
        this.reviewsLoading = false
      }
    },
    async fetchUserFeedback (proposalId) {
      this.feedbackLoading = true
      this.feedbackError = null
      this.userFeedback = null
      this.feedbackSectionCardStates = {}
      this.feedbackSectionDrafts = {}
      this.feedbackSectionBaselines = {}
      try {
        const res = await Service.proposal.getFeedback(encodeURIComponent(proposalId))
        const payload = res && res.data ? res.data : null
        this.userFeedback = payload && payload.data ? payload.data : payload
      } catch (err) {
        this.userFeedback = null
        this.feedbackError = (err && err.response && err.response.data && err.response.data.message)
          || err.message
          || 'Unknown error'
      } finally {
        this.feedbackLoading = false
      }
    },
    async scrollToReviewsIfRequested () {
      const query = this.$route && this.$route.query ? this.$route.query : {}
      if (query.scrollReviews !== '1') return
      if (!this.groupedReviews.length) return

      await this.$nextTick()
      const target = this.$refs.committeeReviewsSection
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    },
    async scrollToFeedbackIfNeeded (options = {}) {
      const query = this.$route && this.$route.query ? this.$route.query : {}
      const isRevisionStatus = String(this.currentStatus || '').trim().toLowerCase() === 'revision_requested'
      const requestedByQuery = query.scrollFeedback === '1' || query.scrollReviews === '1'
      if (!isRevisionStatus && !requestedByQuery) return false

      const behavior = typeof options.behavior === 'string' ? options.behavior : 'smooth'
      const maxRetries = Number.isFinite(options.maxRetries) ? Math.max(0, Number(options.maxRetries)) : 6
      const retryDelayMs = Number.isFinite(options.retryDelayMs) ? Math.max(0, Number(options.retryDelayMs)) : 120

      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        await this.$nextTick()
        const sectionRef = this.$refs.userFeedbackSection
        const target = sectionRef && sectionRef.$el ? sectionRef.$el : sectionRef
        if (target && typeof target.scrollIntoView === 'function') {
          target.scrollIntoView({ behavior, block: 'start' })
          return true
        }
        if (attempt < maxRetries && retryDelayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelayMs))
        }
      }

      return false
    },
    reviewerName (review) {
      const u = review && review.reviewerUserId ? review.reviewerUserId : null
      if (u && typeof u === 'object') return u.fullName || u.email || '-'
      return String(u || '-')
    },
    normalizeReviewStatus (review) {
      return String(review && review.reviewStatus ? review.reviewStatus : '').trim().toLowerCase()
    },
    isReviewSubmitted (review) {
      const status = this.normalizeReviewStatus(review)
      return status === 'submitted' || status === 'certified'
    },
    isReviewAccepted (review) {
      return this.normalizeReviewStatus(review) === 'certified'
    },
    isReviewPendingAdminAcceptance (review) {
      return this.normalizeReviewStatus(review) === 'submitted'
    },
    reviewModerationLabel (review) {
      if (this.isReviewAccepted(review)) return 'รับผลประเมินแล้ว'
      if (this.isReviewPendingAdminAcceptance(review)) return 'รอแอดมินรับผล'
      return 'ฉบับร่าง'
    },
    reviewModerationColor (review) {
      if (this.isReviewAccepted(review)) return 'success'
      if (this.isReviewPendingAdminAcceptance(review)) return 'warning'
      return 'secondary'
    },
    reviewModerationBusyKey (review) {
      return String(review && review._id ? review._id : '')
    },
    isReviewModerationBusy (review) {
      const key = this.reviewModerationBusyKey(review)
      return Boolean(key && this.reviewModerationBusyMap[key])
    },
    setReviewModerationBusy (review, value) {
      const key = this.reviewModerationBusyKey(review)
      if (!key) return
      this.$set(this.reviewModerationBusyMap, key, Boolean(value))
    },
    async acceptProposalReview (review) {
      if (!this.isAdminView || !this.viewProposalId || !review || !review._id) return

      this.setReviewModerationBusy(review, true)
      try {
        await Service.proposal.acceptReview(encodeURIComponent(this.viewProposalId), encodeURIComponent(review._id))
        await this.loadProposalById(this.viewProposalId)
        await this.fetchProposalReviews(this.viewProposalId)
        await this.showAlert({
          icon: 'success',
          title: 'รับผลประเมินสำเร็จ',
          text: 'ระบบได้บันทึกผลการประเมินเข้าระบบเรียบร้อยแล้ว'
        })
      } catch (err) {
        await this.showAlert({
          icon: 'error',
          title: 'รับผลประเมินไม่สำเร็จ',
          text: (err && err.response && err.response.data && err.response.data.message) || 'กรุณาลองใหม่อีกครั้ง'
        })
      } finally {
        this.setReviewModerationBusy(review, false)
      }
    },
    async rejectProposalReview (review) {
      if (!this.isAdminView || !this.viewProposalId || !review || !review._id) return

      const result = await this.showAlert({
        icon: 'warning',
        title: 'ยืนยันไม่รับผลประเมิน',
        text: 'เมื่อไม่รับผลประเมิน ระบบจะลบผลประเมินนี้ออก และผู้ประเมินต้องทำใหม่อีกครั้ง',
        showCancelButton: true,
        confirmButtonText: 'ไม่รับผลประเมิน',
        cancelButtonText: 'ยกเลิก'
      })
      if (!result || !result.isConfirmed) return

      this.setReviewModerationBusy(review, true)
      try {
        await Service.proposal.rejectReview(encodeURIComponent(this.viewProposalId), encodeURIComponent(review._id))
        await this.loadProposalById(this.viewProposalId)
        await this.fetchProposalReviews(this.viewProposalId)
        await this.showAlert({
          icon: 'success',
          title: 'ตีกลับผลประเมินสำเร็จ',
          text: 'ระบบได้ลบผลประเมินนี้ออกแล้ว และผู้ประเมินต้องส่งใหม่อีกครั้ง'
        })
      } catch (err) {
        await this.showAlert({
          icon: 'error',
          title: 'ไม่สามารถตีกลับผลประเมินได้',
          text: (err && err.response && err.response.data && err.response.data.message) || 'กรุณาลองใหม่อีกครั้ง'
        })
      } finally {
        this.setReviewModerationBusy(review, false)
      }
    },
    normalizeReviewerRole (review) {
      const reviewer = review && review.reviewerUserId
      if (reviewer && typeof reviewer === 'object' && reviewer.role) {
        return String(reviewer.role).trim().toLowerCase()
      }
      return ''
    },
    isChairmanReview (review) {
      const reviewerRole = this.normalizeReviewerRole(review)
      if (reviewerRole === 'chairman') return true
      if (reviewerRole === 'committee') return false

      const reviewerId = review && review.reviewerUserId
        ? String(review.reviewerUserId && review.reviewerUserId._id ? review.reviewerUserId._id : review.reviewerUserId)
        : ''
      return Boolean(reviewerId && this.chairmanReviewedById && reviewerId === this.chairmanReviewedById)
    },
    parseChairmanChecklistReview (review) {
      const items = Array.isArray(review && review.commentItems) ? review.commentItems : []
      const payloadItem = items.find((item) => item && item.fieldKey === CHAIRMAN_CHECKLIST_FIELD_KEY)
      if (!payloadItem || !payloadItem.commentText) {
        return {
          fundingTypeLabel: '-',
          sections: []
        }
      }

      try {
        const parsed = JSON.parse(payloadItem.commentText)
        return {
          fundingTypeLabel: String(parsed && parsed.fundingTypeLabel ? parsed.fundingTypeLabel : '-'),
          sections: Array.isArray(parsed && parsed.sections) ? parsed.sections : []
        }
      } catch (_) {
        return {
          fundingTypeLabel: '-',
          sections: []
        }
      }
    },
    decisionLabel (decision) {
      if (decision === 'approve') return 'อนุมัติ'
      if (decision === 'revise') return 'ขอแก้ไข'
      if (decision === 'reject') return 'ไม่อนุมัติ'
      return 'ยังไม่ระบุ'
    },
    formatReviewDateTime (dateStr) {
      if (!dateStr) return '-'
      const d = new Date(dateStr)
      if (Number.isNaN(d.getTime())) return '-'
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      const hour = String(d.getHours()).padStart(2, '0')
      const minute = String(d.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} ${hour}:${minute}`
    },
    syncFeedbackSectionCardStates (sections) {
      const next = {}
      ;(Array.isArray(sections) ? sections : []).forEach(section => {
        const key = section && section.sectionKey ? section.sectionKey : null
        if (!key) return

        const existing = this.feedbackSectionCardStates[key] || {}
        next[key] = {
          collapsed: Boolean(existing.collapsed),
          submitted: Boolean(existing.submitted),
          submittedAt: existing.submittedAt || null,
          snapshot: Object.prototype.hasOwnProperty.call(existing, 'snapshot') ? existing.snapshot : null,
          saving: Boolean(existing.saving)
        }
      })
      this.feedbackSectionCardStates = next
      this.persistFeedbackSectionCardStates()
    },
    cloneSerializable (value) {
      if (value === null || value === undefined) return value
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
      try {
        return JSON.parse(JSON.stringify(value))
      } catch (err) {
        return value
      }
    },
    feedbackSectionState (sectionKey) {
      return this.feedbackSectionCardStates[sectionKey] || {
        collapsed: false,
        submitted: false,
        submittedAt: null,
        snapshot: null,
        saving: false
      }
    },
    isFeedbackSectionSubmitted (sectionKey) {
      return Boolean(this.feedbackSectionState(sectionKey).submitted)
    },
    isFeedbackSectionCollapsed (sectionKey) {
      return Boolean(this.feedbackSectionState(sectionKey).collapsed)
    },
    isSubmittingFeedbackSection (sectionKey) {
      return Boolean(this.feedbackSectionState(sectionKey).saving)
    },
    feedbackSectionSubmittedAt (sectionKey) {
      return this.feedbackSectionState(sectionKey).submittedAt || null
    },
    currentWindowScrollTop () {
      if (typeof window === 'undefined') return 0
      return window.pageYOffset
        || window.scrollY
        || (document && document.documentElement ? document.documentElement.scrollTop : 0)
        || 0
    },
    async restoreWindowScrollTop (scrollTop) {
      if (typeof window === 'undefined') return
      const targetTop = Math.max(0, Number(scrollTop) || 0)
      await this.$nextTick()
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: targetTop, behavior: 'auto' })
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: targetTop, behavior: 'auto' })
        })
      })
    },
    setFeedbackSectionCardState (sectionKey, patch = {}) {
      const current = this.feedbackSectionState(sectionKey)
      this.$set(this.feedbackSectionCardStates, sectionKey, {
        ...current,
        ...patch
      })
      this.persistFeedbackSectionCardStates()
    },
    toggleFeedbackSectionCard (sectionKey) {
      const current = this.feedbackSectionState(sectionKey)
      this.setFeedbackSectionCardState(sectionKey, { collapsed: !current.collapsed })
    },
    currentFeedbackSectionValue (sectionKey) {
      if (sectionKey === 'problem_significance') return this.projectDetailsData.problemSignificance || ''
      if (sectionKey === 'objectives') return this.projectDetailsData.objectives || ''
      if (sectionKey === 'literature_review') return this.projectDetailsData.literatureReview || ''
      if (sectionKey === 'research_methodology') return this.projectDetailsData.researchMethodology || ''
      if (sectionKey === 'work_plan') return this.projectDetailsData.workPlan || []
      if (sectionKey === 'budget') return this.projectDetailsData.budget || {}
      if (sectionKey === 'integration') return this.projectDetailsData.integration || ''
      if (sectionKey === 'strategic_alignment') {
        return this.normalizeStrategicAlignmentValue({
          fundingType: this.projectDetailsData.fundingType,
          fundingSubType: this.projectDetailsData.fundingSubType
        })
      }
      if (sectionKey === 'expected_outcomes') {
        return this.normalizeExpectedOutcomesValue({
          fundingType: this.projectDetailsData.fundingType,
          selectedOutcome: this.projectDetailsData.selectedOutcome
        })
      }
      if (sectionKey === 'transfer_level') return this.projectDetailsData.transferLevel || ''
      if (sectionKey === 'research_team') return this.researchTeamData.projectLeader || {}
      return null
    },
    feedbackSectionDraft (sectionKey) {
      if (!Object.prototype.hasOwnProperty.call(this.feedbackSectionDrafts, sectionKey)) {
        this.$set(this.feedbackSectionDrafts, sectionKey, this.cloneSerializable(this.currentFeedbackSectionValue(sectionKey)))
      }
      return this.feedbackSectionDrafts[sectionKey]
    },
    setFeedbackSectionDraft (sectionKey, value) {
      this.$set(this.feedbackSectionDrafts, sectionKey, this.cloneSerializable(value))
    },
    updateFeedbackSectionDraftField (sectionKey, field, value) {
      const current = this.cloneSerializable(this.feedbackSectionDraft(sectionKey)) || {}
      current[field] = value
      this.$set(this.feedbackSectionDrafts, sectionKey, current)
    },
    async applyFeedbackSectionDraftToForm (sectionKey) {
      const draft = this.cloneSerializable(this.feedbackSectionDraft(sectionKey))

      if (sectionKey === 'problem_significance' && this.$refs.projectDetailsForm && this.$refs.projectDetailsForm.form) {
        this.$refs.projectDetailsForm.form.problemSignificance = draft || ''
      } else if (sectionKey === 'objectives' && this.$refs.projectDetailsForm && this.$refs.projectDetailsForm.form) {
        this.$refs.projectDetailsForm.form.objectives = draft || ''
      } else if (sectionKey === 'literature_review' && this.$refs.projectDetailsForm && this.$refs.projectDetailsForm.form) {
        this.$refs.projectDetailsForm.form.literatureReview = draft || ''
      } else if (sectionKey === 'research_methodology' && this.$refs.projectDetailsForm && this.$refs.projectDetailsForm.form) {
        this.$refs.projectDetailsForm.form.researchMethodology = draft || ''
      } else if (sectionKey === 'work_plan' && this.$refs.projectDetailsForm && this.$refs.projectDetailsForm.form) {
        this.$refs.projectDetailsForm.form.workPlan = Array.isArray(draft) || typeof draft === 'object' ? draft : []
      } else if (sectionKey === 'budget' && this.$refs.projectDetailsForm && this.$refs.projectDetailsForm.form) {
        this.$refs.projectDetailsForm.form.budget = (draft && typeof draft === 'object')
          ? this.cloneSerializable(draft)
          : {}
      } else if (sectionKey === 'integration' && this.$refs.projectDetailsForm && this.$refs.projectDetailsForm.form) {
        this.$refs.projectDetailsForm.form.integration = draft || ''
      } else if (sectionKey === 'strategic_alignment' && this.$refs.projectDetailsForm && this.$refs.projectDetailsForm.form) {
        const strategicDraft = this.normalizeStrategicAlignmentValue(draft)
        this.$refs.projectDetailsForm.form.fundingType = strategicDraft.fundingType
        this.$refs.projectDetailsForm.form.fundingSubType = strategicDraft.fundingSubType
      } else if (sectionKey === 'expected_outcomes' && this.$refs.projectDetailsForm && this.$refs.projectDetailsForm.form) {
        const outcomesDraft = this.normalizeExpectedOutcomesValue(
          draft,
          this.$refs.projectDetailsForm.form.fundingType || this.projectDetailsData.fundingType
        )
        this.$refs.projectDetailsForm.form.selectedOutcome = outcomesDraft.selectedOutcome
      } else if (sectionKey === 'transfer_level' && this.$refs.projectDetailsForm && this.$refs.projectDetailsForm.form) {
        this.$refs.projectDetailsForm.form.transferLevel = draft || ''
      } else if (sectionKey === 'research_team' && this.$refs.researchTeamForm && this.$refs.researchTeamForm.projectLeader) {
        Object.assign(this.$refs.researchTeamForm.projectLeader, draft || {})
      }

      if (sectionKey === 'budget') {
        await this.$nextTick()
        await this.$nextTick()
      }

      this.syncProjectDetailsData()
      this.syncResearchTeamData()
    },
    cloneFeedbackSectionValue (sectionKey) {
      return this.cloneSerializable(this.currentFeedbackSectionValue(sectionKey))
    },
    feedbackSectionSnapshot (sectionKey) {
      const state = this.feedbackSectionState(sectionKey)
      if (state && state.snapshot !== null && state.snapshot !== undefined) {
        return state.snapshot
      }
      const current = this.currentFeedbackSectionValue(sectionKey)
      if (sectionKey === 'strategic_alignment') {
        return this.normalizeStrategicAlignmentValue(current)
      }
      if (sectionKey === 'expected_outcomes') {
        return this.normalizeExpectedOutcomesValue(current, this.projectDetailsData.fundingType)
      }
      if (sectionKey === 'research_team') {
        return current || { name: '', affiliation: '', phone: '', email: '' }
      }
      return current
    },
    normalizeStrategicAlignmentValue (value) {
      const source = value && typeof value === 'object' ? value : {}
      return {
        fundingType: String(source.fundingType || ''),
        fundingSubType: String(source.fundingSubType || '')
      }
    },
    normalizeExpectedOutcomesValue (value, fallbackFundingType = '') {
      const source = value && typeof value === 'object' ? value : {}
      return {
        fundingType: String(source.fundingType || fallbackFundingType || ''),
        selectedOutcome: String(source.selectedOutcome || '')
      }
    },
    feedbackStrategicAlignmentState (sectionKey) {
      const source = this.isFeedbackSectionSubmitted(sectionKey)
        ? this.feedbackSectionSnapshot(sectionKey)
        : this.feedbackSectionDraft(sectionKey)
      return this.normalizeStrategicAlignmentValue(source)
    },
    feedbackStrategicFundingType (sectionKey) {
      return this.feedbackStrategicAlignmentState(sectionKey).fundingType
    },
    feedbackStrategicFundingSubType (sectionKey) {
      return this.feedbackStrategicAlignmentState(sectionKey).fundingSubType
    },
    setFeedbackStrategicFundingType (sectionKey, fundingType) {
      if (this.effectiveReadOnly || this.isFeedbackSectionSubmitted(sectionKey)) return
      const next = this.normalizeStrategicAlignmentValue(this.feedbackSectionDraft(sectionKey))
      const previousFundingType = next.fundingType
      if (next.fundingType !== String(fundingType || '')) {
        next.fundingSubType = ''
      }
      next.fundingType = String(fundingType || '')
      this.$set(this.feedbackSectionDrafts, sectionKey, next)
      if (sectionKey === 'strategic_alignment' && previousFundingType !== next.fundingType) {
        this.syncExpectedOutcomesDraftFromFundingType(next.fundingType)
      }
    },
    setFeedbackStrategicFundingSubType (sectionKey, fundingSubType) {
      if (this.effectiveReadOnly || this.isFeedbackSectionSubmitted(sectionKey)) return
      const next = this.normalizeStrategicAlignmentValue(this.feedbackSectionDraft(sectionKey))
      next.fundingSubType = String(fundingSubType || '')
      this.$set(this.feedbackSectionDrafts, sectionKey, next)
    },
    syncExpectedOutcomesDraftFromFundingType (fundingType) {
      const sectionKey = 'expected_outcomes'
      const hasExpectedOutcomesSection = Array.isArray(this.feedbackEditableSections)
        && this.feedbackEditableSections.some(section => section && section.sectionKey === sectionKey)
      if (!hasExpectedOutcomesSection) return

      if (this.isFeedbackSectionSubmitted(sectionKey)) {
        this.reopenFeedbackSection(sectionKey)
      }

      const normalizedFundingType = String(fundingType || '')
      const next = this.normalizeExpectedOutcomesValue(this.feedbackSectionDraft(sectionKey), normalizedFundingType)
      if (next.fundingType !== normalizedFundingType) {
        next.selectedOutcome = ''
      }
      next.fundingType = normalizedFundingType
      this.$set(this.feedbackSectionDrafts, sectionKey, next)
    },
    feedbackExpectedOutcomesState (sectionKey) {
      const source = this.isFeedbackSectionSubmitted(sectionKey)
        ? this.feedbackSectionSnapshot(sectionKey)
        : this.feedbackSectionDraft(sectionKey)
      const strategicFundingType = String(this.feedbackStrategicFundingType('strategic_alignment') || '')
      const fallbackFundingType = String(
        strategicFundingType
        || ((this.$refs.projectDetailsForm && this.$refs.projectDetailsForm.form && this.$refs.projectDetailsForm.form.fundingType) || this.projectDetailsData.fundingType || '')
      )
      const next = this.normalizeExpectedOutcomesValue(source, fallbackFundingType)
      if (!this.isFeedbackSectionSubmitted(sectionKey)) {
        next.fundingType = fallbackFundingType || next.fundingType
      }
      return next
    },
    feedbackExpectedOutcomesFundingType (sectionKey) {
      return this.feedbackExpectedOutcomesState(sectionKey).fundingType
    },
    feedbackExpectedOutcomesSelection (sectionKey) {
      return this.feedbackExpectedOutcomesState(sectionKey).selectedOutcome
    },
    setFeedbackExpectedOutcomesSelection (sectionKey, selectedOutcome) {
      if (this.effectiveReadOnly || this.isFeedbackSectionSubmitted(sectionKey)) return
      const strategicFundingType = String(this.feedbackStrategicFundingType('strategic_alignment') || '')
      const fallbackFundingType = String(
        strategicFundingType
        || ((this.$refs.projectDetailsForm && this.$refs.projectDetailsForm.form && this.$refs.projectDetailsForm.form.fundingType) || this.projectDetailsData.fundingType || '')
      )
      const next = this.normalizeExpectedOutcomesValue(this.feedbackSectionDraft(sectionKey), fallbackFundingType)
      next.fundingType = fallbackFundingType || next.fundingType
      next.selectedOutcome = String(selectedOutcome || '')
      this.$set(this.feedbackSectionDrafts, sectionKey, next)
    },
    researchTypeLabel (value) {
      const thaiMap = {
        'science-technology': 'ด้านวิทยาศาสตร์และเทคโนโลยี',
        'health-science': 'ด้านวิทยาศาสตร์สุขภาพ',
        'social-humanities': 'ด้านสังคมศาสตร์และมนุษยศาสตร์'
      }
      const englishMap = {
        'science-technology': 'Science and Technology',
        'health-science': 'Health Sciences',
        'social-humanities': 'Social Sciences and Humanities'
      }
      const normalized = String(value || '').trim()
      if (!normalized) return '-'
      const map = this.isEnglishLocale ? englishMap : thaiMap
      return map[normalized] || normalized
    },
    transferLevelPreview (value) {
      if (value === 'national-international') return this.isEnglishLocale ? 'Regional/National/International Level' : 'ระดับภูมิภาค/ประเทศ/นานาชาติ'
      if (value === 'community-provincial') return this.isEnglishLocale ? 'Professional Group/Community/Provincial Level' : 'ระดับกลุ่มอาชีพ/ชุมชน/จังหวัด'
      if (value === 'none') return this.isEnglishLocale ? 'No social transfer yet' : 'ไม่มีการถ่ายทอดสู่สังคม'
      return '-'
    },
    hasWorkPlanDraftContent (value) {
      const hasText = (cell) => String(cell || '').trim().length > 0
      const ignoredKeys = new Set(['id', '_id', 'duration', 'activities', 'selectedMonths', 'activityName', 'responsible'])
      const hasRowContent = (row) => {
        if (row === null || row === undefined) return false
        if (typeof row !== 'object') return hasText(row)

        const hasKnownSection12Fields = hasText(row.activityName) ||
          hasText(row.responsible) ||
          (Array.isArray(row.selectedMonths) && row.selectedMonths.some(month => hasText(month) || Number(month) > 0))
        if (hasKnownSection12Fields) return true

        return Object.keys(row).some((key) => {
          if (ignoredKeys.has(key)) return false
          const cell = row[key]
          if (Array.isArray(cell)) return cell.some(entry => hasRowContent(entry))
          if (cell && typeof cell === 'object') return hasRowContent(cell)
          return hasText(cell)
        })
      }

      if (Array.isArray(value)) {
        return value.some(row => hasRowContent(row))
      }

      if (value && typeof value === 'object') {
        const activityRows = Array.isArray(value.activities) ? value.activities : []
        if (activityRows.some(row => hasRowContent(row))) return true
        return hasRowContent(value)
      }

      return false
    },
    validateFeedbackSectionBeforeSubmit (section, options = {}) {
      const focusOnError = options.focusOnError !== false
      const sectionKey = section && section.sectionKey ? String(section.sectionKey) : ''
      if (!sectionKey) return { ok: false, message: 'ไม่พบหัวข้อที่ต้องการส่งแก้ไข' }

      const sectionLabel = this.revisionDiffSectionLabel(
        sectionKey,
        section && section.meta && section.meta.sectionLabel ? section.meta.sectionLabel : ''
      )
      const fail = (message, onFocus = null) => {
        if (focusOnError && typeof onFocus === 'function') {
          try {
            onFocus()
          } catch (_) { void _ }
        }
        return { ok: false, message }
      }

      if (sectionKey === 'budget') {
        const budgetValidation = this.getBudgetValidationResult()
        if (!budgetValidation.ok) {
          return fail(
            `กรุณาแก้ไขหัวข้อ ${sectionLabel} ให้ถูกต้องก่อนส่งแก้ไข\n- ${budgetValidation.errors.join('\n- ')}`,
            () => this.focusBudgetSection()
          )
        }
        return { ok: true, message: '' }
      }

      if (sectionKey === 'research_team') {
        const teamValidation = this.$refs.researchTeamForm && typeof this.$refs.researchTeamForm.getValidationResult === 'function'
          ? this.$refs.researchTeamForm.getValidationResult()
          : null
        if (teamValidation && !teamValidation.ok) {
          return fail(
            teamValidation.message || `กรุณาตรวจสอบข้อมูลหัวข้อ ${sectionLabel} ให้ครบถ้วน`,
            () => {
              if (this.$refs.researchTeamForm && typeof this.$refs.researchTeamForm.scrollToSection === 'function') {
                this.$refs.researchTeamForm.scrollToSection('research_team')
              }
            }
          )
        }
      }

      if (sectionKey === 'strategic_alignment') {
        const strategicDraft = this.normalizeStrategicAlignmentValue(this.feedbackSectionDraft(sectionKey))
        if (!strategicDraft.fundingType) {
          return fail(`กรุณาเลือกประเภททุนในหัวข้อ ${sectionLabel}`)
        }
        const requiresSubType = this.requiresFundingSubType(strategicDraft.fundingType)
        if (requiresSubType && !strategicDraft.fundingSubType) {
          return fail(`กรุณาเลือกประเภทย่อยในหัวข้อ ${sectionLabel}`)
        }
        return { ok: true, message: '' }
      }

      if (sectionKey === 'expected_outcomes') {
        const strategicFundingType = String(this.feedbackStrategicFundingType('strategic_alignment') || '')
        const fallbackFundingType = String(
          strategicFundingType ||
          ((this.$refs.projectDetailsForm && this.$refs.projectDetailsForm.form && this.$refs.projectDetailsForm.form.fundingType) || this.projectDetailsData.fundingType || '')
        )
        const outcomesDraft = this.normalizeExpectedOutcomesValue(this.feedbackSectionDraft(sectionKey), fallbackFundingType)
        const requiresExpectedOutcome = this.isExpectedOutcomeSelectionRequired(outcomesDraft.fundingType || fallbackFundingType)
        if (requiresExpectedOutcome && !outcomesDraft.selectedOutcome) {
          return fail(`กรุณาเลือกผลลัพธ์ในหัวข้อ ${sectionLabel}`)
        }
        return { ok: true, message: '' }
      }

      if (sectionKey === 'transfer_level') {
        const transferDraft = String(this.feedbackSectionDraft(sectionKey) || '').trim()
        if (!transferDraft) {
          return fail(`กรุณาเลือกข้อมูลในหัวข้อ ${sectionLabel}`)
        }
        return { ok: true, message: '' }
      }

      if (sectionKey === 'work_plan') {
        const workPlanDraft = this.feedbackSectionDraft(sectionKey)
        if (!this.hasWorkPlanDraftContent(workPlanDraft)) {
          return fail(`กรุณากรอกข้อมูลในหัวข้อ ${sectionLabel} ให้ครบถ้วน`)
        }
        return { ok: true, message: '' }
      }

      if (['problem_significance', 'objectives', 'literature_review', 'research_methodology', 'integration'].includes(sectionKey)) {
        const textDraft = this.sanitizeDiffText(this.feedbackSectionDraft(sectionKey))
        if (!textDraft) {
          return fail(`กรุณากรอกข้อมูลในหัวข้อ ${sectionLabel} ให้ครบถ้วน`)
        }
      }

      return { ok: true, message: '' }
    },
    async submitFeedbackSection (section) {
      const sectionKey = section && section.sectionKey ? section.sectionKey : ''
      if (!sectionKey || this.effectiveReadOnly) return

      const preservedScrollTop = this.currentWindowScrollTop()
      this.setFeedbackSectionCardState(sectionKey, { saving: true })
      try {
        await this.applyFeedbackSectionDraftToForm(sectionKey)
        const validationResult = this.validateFeedbackSectionBeforeSubmit(section, { focusOnError: true })
        if (!validationResult.ok) {
          this.setFeedbackSectionCardState(sectionKey, { saving: false })
          await this.restoreWindowScrollTop(preservedScrollTop)
          await this.showAlert({
            icon: 'warning',
            title: 'ข้อมูลยังไม่ครบถ้วน',
            text: validationResult.message || 'กรุณาตรวจสอบข้อมูลก่อนส่งแก้ไข'
          })
          return
        }

        if (this.viewProposalId) {
          const payload = this.normalizeApiPayload()
          await Service.proposal.updateDraft(this.viewProposalId, payload)
        }

        this.setFeedbackSectionCardState(sectionKey, {
          saving: false,
          submitted: true,
          collapsed: true,
          submittedAt: new Date().toISOString(),
          snapshot: this.cloneFeedbackSectionValue(sectionKey)
        })
        await this.restoreWindowScrollTop(preservedScrollTop)
      } catch (err) {
        this.setFeedbackSectionCardState(sectionKey, { saving: false })
        await this.restoreWindowScrollTop(preservedScrollTop)
        await this.showAlert({
          icon: 'error',
          title: 'ส่งแก้ไขไม่สำเร็จ',
          text: (err && err.response && err.response.data && err.response.data.message) || 'กรุณาลองใหม่อีกครั้ง'
        })
      }
    },
    reopenFeedbackSection (sectionKey) {
      this.$set(this.feedbackSectionDrafts, sectionKey, this.cloneSerializable(this.feedbackSectionSnapshot(sectionKey)))
      this.setFeedbackSectionCardState(sectionKey, {
        submitted: false,
        collapsed: false
      })
    },
    reviewActionItems (review) {
      const explicitItems = Array.isArray(review && review.commentItems) ? review.commentItems.slice() : []
      const filteredExplicitItems = explicitItems
        .filter(item => item && item.sectionKey && item.sectionKey !== 'summary' && item.visibility === 'researcher_visible')

      if (filteredExplicitItems.length) {
        return filteredExplicitItems.sort((left, right) => this.feedbackItemSortOrder(left) - this.feedbackItemSortOrder(right))
      }

      const scoreItems = Array.isArray(review && review.scoreItems) ? review.scoreItems : []
      return scoreItems
        .filter(scoreItem => Number(scoreItem && scoreItem.score) <= 1)
        .map(scoreItem => {
          const meta = getCommitteeFeedbackMeta(scoreItem && scoreItem.criteriaKey)
          if (!meta) return null
          return {
            sectionKey: meta.sectionKey,
            fieldKey: `criteria_${scoreItem.criteriaKey}`,
            commentType: 'required_fix',
            commentText: this.buildFallbackFeedbackComment(meta, review && review.summaryComment),
            visibility: 'researcher_visible'
          }
        })
        .filter(Boolean)
        .sort((left, right) => this.feedbackItemSortOrder(left) - this.feedbackItemSortOrder(right))
    },
    feedbackMetaForItem (item) {
      const fieldKey = String(item && item.fieldKey ? item.fieldKey : '')
      const matched = fieldKey.match(/^criteria_(\d+)$/)
      if (matched) {
        return getCommitteeFeedbackMeta(matched[1])
      }

      const all = Object.values(COMMITTEE_SECTION_FEEDBACK_MAP)
      return all.find(entry => entry.sectionKey === (item && item.sectionKey)) || null
    },
    feedbackItemSortOrder (item) {
      const meta = this.feedbackMetaForItem(item)
      if (!meta) return Number.MAX_SAFE_INTEGER
      return Number.isFinite(Number(meta.sectionNo)) ? Number(meta.sectionNo) : Number.MAX_SAFE_INTEGER - 1
    },
    feedbackItemSectionLabel (item) {
      const meta = this.feedbackMetaForItem(item)
      return meta ? meta.sectionLabel : 'หัวข้อที่ต้องแก้ไข'
    },
    feedbackItemRubricLabel (item) {
      const meta = this.feedbackMetaForItem(item)
      return meta ? meta.rubricLabel : 'ข้อเสนอแนะจากคณะกรรมการ'
    },
    feedbackItemScore (review, item) {
      const fieldKey = String(item && item.fieldKey ? item.fieldKey : '')
      const matched = fieldKey.match(/^criteria_(\d+)$/)
      if (!matched) return null

      const scoreItems = Array.isArray(review && review.scoreItems) ? review.scoreItems : []
      const found = scoreItems.find(scoreItem => String(scoreItem && scoreItem.criteriaKey) === matched[1])
      if (!found) return null

      const score = Number(found.score)
      return Number.isFinite(score) ? score : null
    },
    buildFallbackFeedbackComment (meta, summaryComment) {
      const summary = String(summaryComment || '').trim()
      if (summary) {
        return `${summary}\nโปรดตรวจสอบ${meta.sectionLabel}`
      }
      return `โปรดตรวจสอบและปรับปรุง${meta.sectionLabel}ตามความเห็นของคณะกรรมการ`
    },
    async goToFeedbackSection (item) {
      const meta = this.feedbackMetaForItem(item)
      if (!meta) return

      await this.$nextTick()
      const targetComponent = meta.target === 'researchTeam'
        ? this.$refs.researchTeamForm
        : this.$refs.projectDetailsForm

      if (targetComponent && typeof targetComponent.scrollToSection === 'function') {
        targetComponent.scrollToSection(meta.sectionKey)
        return
      }

      const target = targetComponent && targetComponent.$el ? targetComponent.$el : targetComponent
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    },
    applyPrefill () {
      const data = this.prefill
      if (!data) return
      if (this.viewProposalId || this.loadedProposal) return

      this.$nextTick(() => {
        const projectDetailsForm = this.$refs.projectDetailsForm
        if (projectDetailsForm && projectDetailsForm.form) {
          if (!projectDetailsForm.form.projectNameEnglish && data.projectNameEnglish) {
            projectDetailsForm.form.projectNameEnglish = data.projectNameEnglish
          }
          if (!projectDetailsForm.form.projectNameThai && data.projectNameThai) {
            projectDetailsForm.form.projectNameThai = data.projectNameThai
          }
        }

        const researchTeamForm = this.$refs.researchTeamForm
        if (researchTeamForm && researchTeamForm.projectLeader) {
          if (!researchTeamForm.projectLeader.name && data.projectLeaderName) {
            researchTeamForm.projectLeader.name = data.projectLeaderName
          }
          if (!researchTeamForm.projectLeader.affiliation && data.projectLeaderAffiliation) {
            researchTeamForm.projectLeader.affiliation = data.projectLeaderAffiliation
          }
        }
      })
    },

    showAlert(options) {
      if (this.$swal && typeof this.$swal.fire === 'function') {
        return this.$swal.fire(options)
      }
      return Swal.fire(options)
    },
    normalizeFileId (value) {
      if (!value) return ''
      if (typeof value === 'string' || typeof value === 'number') return String(value).trim()
      if (typeof value === 'object') {
        if (typeof value.toHexString === 'function') return String(value.toHexString()).trim()
        if (value.$oid) return String(value.$oid).trim()
        if (value._id) return this.normalizeFileId(value._id)
        if (value.id) return this.normalizeFileId(value.id)
        if (value.fileId) return this.normalizeFileId(value.fileId)
      }
      try {
        return String(value).trim()
      } catch (_) {
        return ''
      }
    },
    sanitizeSnapshotFileForPayload (file, options = {}) {
      if (!file || typeof file !== 'object') return null
      const includeBudgetFields = Boolean(options && options.includeBudgetFields)
      const fileId = this.normalizeFileId(file.fileId || file.id || file._id || '')
      const name = file.name || file.originalName || file.fileName || ''
      const originalName = file.originalName || name || ''
      const numericSize = Number(file.size || file.fileSize || 0)
      const uploadedAt = file.uploadedAt || file.uploadDate || null
      const base = {
        fileId: fileId ? String(fileId) : '',
        name,
        originalName,
        mimeType: file.mimeType || file.contentType || '',
        size: Number.isFinite(numericSize) && numericSize > 0 ? numericSize : 0,
        uploadedAt,
        datetime: file.datetime || '',
        type: file.type || file.docType || '',
        note: file.note || ''
      }
      if (!includeBudgetFields) return base
      return {
        ...base,
        fileName: file.fileName || base.name,
        docType: file.docType || base.type || '',
        uploading: Boolean(file.uploading && !base.fileId)
      }
    },
    sanitizeResearchStandardForPayload (value) {
      const standard = value && typeof value === 'object'
        ? (this.cloneSerializable(value) || value)
        : {}
      const attachments = standard && standard.attachments && typeof standard.attachments === 'object'
        ? standard.attachments
        : {}

      const nextAttachments = {}
      Object.keys(attachments).forEach((key) => {
        const entry = attachments[key]
        if (!entry) {
          nextAttachments[key] = null
          return
        }
        const sanitized = this.sanitizeSnapshotFileForPayload(entry)
        nextAttachments[key] = sanitized || null
      })

      return {
        ...standard,
        attachments: nextAttachments
      }
    },
    sanitizeBudgetForPayload (value) {
      const budget = value && typeof value === 'object'
        ? (this.cloneSerializable(value) || value)
        : {}
      const categories = Array.isArray(budget.categories) ? budget.categories : []
      const nextCategories = categories.map((category) => {
        const items = Array.isArray(category && category.items) ? category.items : []
        const nextItems = items.map((item) => {
          if (!item || typeof item !== 'object') return item
          const attachment = item.attachment
          if (!attachment || typeof attachment !== 'object') return item
          const sanitized = this.sanitizeSnapshotFileForPayload(attachment, { includeBudgetFields: true })
          return {
            ...item,
            attachment: sanitized
          }
        })
        return {
          ...(category || {}),
          items: nextItems
        }
      })
      return {
        ...budget,
        categories: nextCategories
      }
    },

    normalizeApiPayload() {
      const teamData = this.$refs.researchTeamForm && typeof this.$refs.researchTeamForm.getFormData === 'function'
        ? this.$refs.researchTeamForm.getFormData()
        : {}
      const formData = this.$refs.projectDetailsForm && typeof this.$refs.projectDetailsForm.getFormData === 'function'
        ? this.$refs.projectDetailsForm.getFormData()
        : {}
      const form = formData && formData.form ? formData.form : (formData || {})
      const existingSnapshot = this.loadedProposal && this.loadedProposal.formSnapshotJson
        ? this.loadedProposal.formSnapshotJson
        : {}
      const rawBudget = form && form.budget && typeof form.budget === 'object' && Object.keys(form.budget).length
        ? form.budget
        : (existingSnapshot.budget || {})
      const rawResearchStandard = form && form.researchStandard && typeof form.researchStandard === 'object' && Object.keys(form.researchStandard).length
        ? form.researchStandard
        : (existingSnapshot.researchStandard || {})
      const normalizedBudget = this.sanitizeBudgetForPayload(rawBudget)
      const normalizedResearchStandard = this.sanitizeResearchStandardForPayload(rawResearchStandard)

      const rawKeywords = String(form.keywords || '')
        .replace(/<[^>]+>/g, '')
        .trim()
      const keywordList = rawKeywords
        ? rawKeywords.split(/[,\n]+/).map(k => k.trim()).filter(Boolean)
        : []
      const fallbackDraftTitle = 'ร่างโครงการวิจัย'
      const projectTitleTh = (form.projectNameThai || form.projectTitleTh || '').trim() || fallbackDraftTitle

      const budgetTotal = (normalizedBudget && normalizedBudget.grandTotal)
        || form.budgetTotal
        || 0
      const collaborationAgency = String(form.collaborationAgency || '').trim()
      const collaboration = collaborationAgency ? 'yes' : 'none'

      const projectLeader = teamData && teamData.projectLeader ? teamData.projectLeader : {}
      const projectLeaderName = projectLeader.name || form.projectLeaderName || ''

      const signatures = this.signatureData
        || (this.$refs.signatureCard && typeof this.$refs.signatureCard.getAllSignatures === 'function'
          ? this.$refs.signatureCard.getAllSignatures()
          : null)

      const persistedFiles = Array.isArray(this.files)
        ? this.files
          .filter(f => f && !f._pending)
          .map(f => this.sanitizeSnapshotFileForPayload(f))
          .filter(f => f && (f.fileId || f.name))
        : []

      const existingRawRevisionDiffSummary = this.loadedProposal &&
        this.loadedProposal.formSnapshotJson &&
        this.loadedProposal.formSnapshotJson.revisionDiffSummary
      const existingRevisionDiffSummary = existingRawRevisionDiffSummary &&
        typeof existingRawRevisionDiffSummary === 'object' &&
        Array.isArray(existingRawRevisionDiffSummary.sections) &&
        existingRawRevisionDiffSummary.sections.length
        ? this.cloneSerializable(existingRawRevisionDiffSummary)
        : null

      const generatedRevisionDiffSummary = (!this.isAdminView && this.isRevisionRequested)
        ? this.buildCurrentRevisionDiffSummary()
        : null
      const hasGeneratedSections = Boolean(
        generatedRevisionDiffSummary &&
        Array.isArray(generatedRevisionDiffSummary.sections) &&
        generatedRevisionDiffSummary.sections.length
      )

      const currentRoundNo = this.currentFeedbackRoundNo()
      const existingRoundNo = Number(existingRevisionDiffSummary && existingRevisionDiffSummary.roundNo)
      const isExistingSummarySameRound = Number.isFinite(existingRoundNo) &&
        existingRoundNo > 0 &&
        Number.isFinite(currentRoundNo) &&
        currentRoundNo > 0
        ? existingRoundNo === currentRoundNo
        : false

      let revisionDiffSummary = null
      if (hasGeneratedSections) {
        revisionDiffSummary = generatedRevisionDiffSummary
      } else if (this.isRevisionRequested) {
        if (existingRevisionDiffSummary && (!currentRoundNo || isExistingSummarySameRound)) {
          revisionDiffSummary = existingRevisionDiffSummary
        }
      } else if (existingRevisionDiffSummary) {
        revisionDiffSummary = existingRevisionDiffSummary
      }

      return {
        projectTitleTh,
        projectTitleEn: form.projectNameEnglish || form.projectTitleEn || '',
        fiscalYear: form.fiscalYear || new Date().getFullYear(),
        fundingType: form.fundingType || null,
        researchType: form.researchType || null,
        budgetTotal,
        keywordList,
        abstractText: form.problemSignificance || '',
        projectLeaderName,
        projectLeaderAffiliation: projectLeader.affiliation || '',
        projectLeaderPhone: projectLeader.phone || '',
        projectLeaderEmail: projectLeader.email || '',
        projectLeaderProportion: projectLeader.proportion || '',
        formSnapshotJson: {
          projectNameThai: form.projectNameThai || '',
          projectNameEnglish: form.projectNameEnglish || '',
          fiscalYear: form.fiscalYear || new Date().getFullYear(),
          fundingType: form.fundingType || null,
          researchType: form.researchType || null,
          keywords: form.keywords || '',
          fundingSubType: form.fundingSubType,
          collaboration,
          collaborationAgency,
          problemSignificance: form.problemSignificance,
          objectives: form.objectives,
          literatureReview: form.literatureReview,
          references: form.references,
          researchMethodology: form.researchMethodology,
          researchScope: form.researchScope,
          workPlan: form.workPlan || [],
          milestones: form.milestones,
          selectedOutcome: form.selectedOutcome,
          integration: form.integration,
          transferLevel: form.transferLevel,
          researchStandard: normalizedResearchStandard,
          budget: normalizedBudget,
          signatures: signatures || {},
          researchTeam: teamData,
          files: persistedFiles,
          ...(revisionDiffSummary ? { revisionDiffSummary } : {})
        }
      }
    },

    buildDraftFingerprint (payload = null) {
      const draftPayload = payload || this.normalizeApiPayload()
      try {
        return JSON.stringify(draftPayload)
      } catch (err) {
        return ''
      }
    },
    hasPendingFileQueue () {
      return Array.isArray(this.pendingFormFiles) && this.pendingFormFiles.length > 0
    },
    hasDraftChangedFromBaseline (payload = null) {
      if (this.hasPendingFileQueue()) return true
      const currentFingerprint = this.buildDraftFingerprint(payload)
      if (!currentFingerprint) return true
      if (!this.lastSavedDraftFingerprint) return true
      return currentFingerprint !== this.lastSavedDraftFingerprint
    },
    updateDraftBaseline (payload = null) {
      const currentFingerprint = this.buildDraftFingerprint(payload)
      if (!currentFingerprint) return
      this.lastSavedDraftFingerprint = currentFingerprint
    },
    markAsEdited() {
      if (this.suppressAutoSave) return
      this.scheduleAutoSave()
      if (this.isDraftSaved) {
        this.isDraftSaved = false; // ปลดล็อคปุ่มให้กลับมากดได้
      }
    },
    async handleUpload(event) {
      if (this.mainFormReadOnly) return
      const input = event && event.target ? event.target : null
      const selected = input && input.files ? Array.from(input.files) : []
      if (!selected.length) return

      // Reset the input so selecting the same file again will fire change.
      if (input) input.value = ''

      // If proposal is not created yet, queue the binary until after saveDraft creates an id.
      if (!this.viewProposalId) {
        this.pendingFormFiles = [...this.pendingFormFiles, ...selected]
        const placeholders = selected.map((file) => ({
          name: file.name,
          datetime: new Date().toLocaleString(),
          type: '',
          note: '',
          _pending: true
        }))
        this.files = [...(this.files || []), ...placeholders]
        this.markAsEdited()
        return
      }

      await this.uploadFormFiles(selected)
      this.markAsEdited()
    },
    handleFilesUpdate (updatedFiles) {
      if (this.mainFormReadOnly) return
      this.files = Array.isArray(updatedFiles) ? updatedFiles : []
      this.markAsEdited()
    },
    async ensureProposalDraftExistsForAttachments () {
      if (this.viewProposalId) return this.viewProposalId

      await this.persistDraft({ silent: true })
      return this.viewProposalId
    },
    currentResearchStandardValue () {
      const projectDetailsForm = this.$refs.projectDetailsForm
      if (!projectDetailsForm || !projectDetailsForm.form) return null
      const standard = projectDetailsForm.form.researchStandard || {}
      return {
        ...standard,
        attachments: {
          plantApproved: null,
          plantPending: null,
          humanApproved: null,
          humanPending: null,
          animalApproved: null,
          animalPending: null,
          ...(standard.attachments || {})
        }
      }
    },
    currentBudgetValue () {
      const projectDetailsForm = this.$refs.projectDetailsForm
      if (!projectDetailsForm || !projectDetailsForm.form) return null
      return projectDetailsForm.form.budget || null
    },
    setBudgetValue (nextValue) {
      const projectDetailsForm = this.$refs.projectDetailsForm
      if (!projectDetailsForm || !projectDetailsForm.form) return
      projectDetailsForm.form.budget = nextValue || {}
      this.syncProjectDetailsData(projectDetailsForm.getFormData())
    },
    updateBudgetItemAttachment (itemId, updater) {
      const current = this.currentBudgetValue()
      if (!current || !Array.isArray(current.categories)) return

      const nextBudget = {
        ...current,
        categories: current.categories.map((category) => ({
          ...category,
          items: Array.isArray(category.items)
            ? category.items.map((item) => {
              if (!item || String(item.id) !== String(itemId)) return item
              return updater(item)
            })
            : []
        }))
      }

      this.setBudgetValue(nextBudget)
    },
    detachBudgetAttachmentByFileId (fileId) {
      const normalizedFileId = this.normalizeFileId(fileId)
      if (!normalizedFileId) return false

      const current = this.currentBudgetValue()
      if (!current || !Array.isArray(current.categories)) return false

      let changed = false
      const nextBudget = {
        ...current,
        categories: current.categories.map((category) => {
          const items = Array.isArray(category && category.items) ? category.items : []
          const nextItems = items.filter((item) => {
            if (!item || !item.attachment) return true
            const attachmentId = this.normalizeFileId(
              item.attachment.fileId || item.attachment.id || item.attachment._id
            )
            const shouldRemove = attachmentId && String(attachmentId) === String(normalizedFileId)
            if (shouldRemove) changed = true
            return !shouldRemove
          })
          return {
            ...(category || {}),
            items: nextItems
          }
        })
      }

      if (!changed) return false
      this.setBudgetValue(nextBudget)
      return true
    },
    detachResearchStandardAttachmentByFileId (fileId) {
      const normalizedFileId = this.normalizeFileId(fileId)
      if (!normalizedFileId) return false

      const current = this.currentResearchStandardValue()
      if (!current || !current.attachments || typeof current.attachments !== 'object') return false

      let changed = false
      const nextAttachments = { ...(current.attachments || {}) }
      Object.keys(nextAttachments).forEach((key) => {
        const entry = nextAttachments[key]
        const attachmentId = this.normalizeFileId(entry && (entry.fileId || entry.id || entry._id))
        if (!attachmentId || String(attachmentId) !== String(normalizedFileId)) return
        nextAttachments[key] = null
        changed = true
      })

      if (!changed) return false
      this.setResearchStandardValue({
        ...(current || {}),
        attachments: nextAttachments
      })
      return true
    },
    setResearchStandardValue (nextValue) {
      const projectDetailsForm = this.$refs.projectDetailsForm
      if (!projectDetailsForm || !projectDetailsForm.form) return
      projectDetailsForm.form.researchStandard = nextValue
      this.syncProjectDetailsData(projectDetailsForm.getFormData())
    },
    upsertFormFileRow (row) {
      if (!row || !row.fileId) return
      const next = Array.isArray(this.files) ? this.files.filter(item => String(item && item.fileId) !== String(row.fileId)) : []
      this.files = [...next, row]
    },
    removeFormFileRow (fileId) {
      const normalizedFileId = this.normalizeFileId(fileId)
      this.files = Array.isArray(this.files)
        ? this.files.filter(item => String(this.normalizeFileId(item && (item.fileId || item.id || item._id))) !== String(normalizedFileId))
        : []
    },
    async handleBudgetAttachmentUpload ({ categoryName, itemId, file }) {
      if (this.mainFormReadOnly || !itemId || !file) return

      try {
        const proposalId = await this.ensureProposalDraftExistsForAttachments()
        if (!proposalId) throw new Error('ยังไม่สามารถสร้างแบบร่างเพื่อแนบเอกสารได้')

        const note = `เอกสารแนบในหมวด ${categoryName || 'งบประมาณ'}`
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'อื่น ๆ')
        formData.append('note', note)

        const res = await Service.proposal.uploadFormFile(proposalId, formData)
        const row = res && res.data && res.data.data ? res.data.data : null
        if (!row) throw new Error('อัปโหลดเอกสารงบประมาณไม่สำเร็จ')

        const budgetRow = {
          ...row,
          fileName: row.name || row.originalName || file.name,
          docType: ''
        }

        this.updateBudgetItemAttachment(itemId, (item) => ({
          ...item,
          attachment: budgetRow
        }))
        this.upsertFormFileRow(row)
        await this.persistDraft({ silent: true })
      } catch (err) {
        this.updateBudgetItemAttachment(itemId, (item) => ({
          ...item,
          attachment: null
        }))
        await this.showAlert({
          icon: 'error',
          title: 'แนบเอกสารงบประมาณไม่สำเร็จ',
          text: (err && err.response && err.response.data && err.response.data.message) || err.message || 'กรุณาลองใหม่อีกครั้ง'
        })
      }
    },
    resolveBudgetAttachmentFile (file, itemId = '') {
      const fallback = file && typeof file === 'object' ? { ...file } : null
      const directFileId = this.normalizeFileId(file && (file.fileId || file.id || file._id))
      if (fallback && directFileId) {
        return {
          ...fallback,
          fileId: directFileId
        }
      }

      let attachmentFromBudget = null
      if (itemId) {
        const budget = this.currentBudgetValue()
        const categories = Array.isArray(budget && budget.categories) ? budget.categories : []
        for (let catIndex = 0; catIndex < categories.length; catIndex += 1) {
          const category = categories[catIndex] || {}
          const items = Array.isArray(category.items) ? category.items : []
          const matchedItem = items.find(item => item && String(item.id) === String(itemId))
          if (matchedItem && matchedItem.attachment) {
            attachmentFromBudget = matchedItem.attachment
            break
          }
        }
      }

      const fromBudgetId = this.normalizeFileId(
        attachmentFromBudget && (attachmentFromBudget.fileId || attachmentFromBudget.id || attachmentFromBudget._id)
      )
      if (attachmentFromBudget && fromBudgetId) {
        return {
          ...attachmentFromBudget,
          fileId: fromBudgetId
        }
      }

      const targetName = String(
        (file && (file.fileName || file.name || file.originalName)) ||
        (attachmentFromBudget && (attachmentFromBudget.fileName || attachmentFromBudget.name || attachmentFromBudget.originalName)) ||
        ''
      ).trim().toLowerCase()
      if (!targetName) return fallback

      const pool = Array.isArray(this.files) ? this.files : []
      const matchedRow = pool.find((entry) => {
        const candidateName = String(entry && (entry.fileName || entry.name || entry.originalName || '')).trim().toLowerCase()
        return candidateName && candidateName === targetName
      })
      if (!matchedRow) return fallback

      const matchedId = this.normalizeFileId(matchedRow.fileId || matchedRow.id || matchedRow._id)
      if (!matchedId) return fallback

      return {
        ...(matchedRow || {}),
        ...(fallback || {}),
        fileId: matchedId
      }
    },
    async handleBudgetAttachmentOpen ({ file, itemId }) {
      const resolvedFile = this.resolveBudgetAttachmentFile(file, itemId)
      if (!resolvedFile) return
      await this.openFile(resolvedFile)
    },
    async handleBudgetAttachmentRemove ({ attachment }) {
      if (this.mainFormReadOnly || !attachment) return

      const normalizedFileId = this.normalizeFileId(
        attachment.fileId || attachment.id || attachment._id
      )
      if (!normalizedFileId) return

      if (this.viewProposalId) {
        try {
          await Service.proposal.deleteFormFile(this.viewProposalId, normalizedFileId)
        } catch (_) {
          // Keep UI in sync even when server cleanup fails.
        }
      }

      this.removeFormFileRow(normalizedFileId)
      this.markAsEdited()
      if (this.viewProposalId) {
        try {
          await this.persistDraft({ silent: true })
        } catch (_) {
          // Skip blocking UI when silent draft save fails.
        }
      }
    },
    handleBudgetAttachmentMetaChange ({ itemId, attachment }) {
      if (!itemId || !attachment) return

      this.updateBudgetItemAttachment(itemId, (item) => ({
        ...item,
        attachment: {
          ...(item && item.attachment ? item.attachment : {}),
          ...attachment
        }
      }))

      if (attachment.fileId) {
        this.files = Array.isArray(this.files)
          ? this.files.map((item) => {
            if (String(item && item.fileId) !== String(attachment.fileId)) return item
            return {
              ...item,
              type: attachment.docType || item.type || '',
              note: item.note || 'เอกสารแนบในหมวดงบประมาณ'
            }
          })
          : []
      }
    },
    async handleResearchStandardUpload ({ slotKey, file }) {
      if (this.mainFormReadOnly || !slotKey || !file) return

      try {
        const proposalId = await this.ensureProposalDraftExistsForAttachments()
        if (!proposalId) throw new Error('ยังไม่สามารถสร้างแบบร่างเพื่อแนบเอกสารได้')

        const previous = this.currentResearchStandardValue()
        const previousFile = previous && previous.attachments ? previous.attachments[slotKey] : null

        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'research_standard_attachment')
        formData.append('note', slotKey)
        const res = await Service.proposal.uploadFormFile(proposalId, formData)
        const row = res && res.data && res.data.data ? res.data.data : null
        if (!row) throw new Error('อัปโหลดเอกสารไม่สำเร็จ')

        const nextResearchStandard = {
          ...(previous || {}),
          attachments: {
            ...(previous && previous.attachments ? previous.attachments : {}),
            [slotKey]: row
          }
        }
        this.setResearchStandardValue(nextResearchStandard)
        this.upsertFormFileRow(row)

        if (previousFile && previousFile.fileId && String(previousFile.fileId) !== String(row.fileId)) {
          try {
            await Service.proposal.deleteFormFile(proposalId, previousFile.fileId)
          } catch (err) {
            void err
          }
          this.removeFormFileRow(previousFile.fileId)
        }

        await this.persistDraft({ silent: true })
      } catch (err) {
        await this.showAlert({
          icon: 'error',
          title: 'แนบเอกสารไม่สำเร็จ',
          text: (err && err.response && err.response.data && err.response.data.message) || err.message || 'กรุณาลองใหม่อีกครั้ง'
        })
      }
    },
    async handleResearchStandardOpen ({ file }) {
      if (!file) return
      await this.openFile(file)
    },
    async handleResearchStandardRemove ({ slotKey, file }) {
      if (this.mainFormReadOnly || !slotKey || !file || !this.viewProposalId) return

      try {
        if (file.fileId) {
          await Service.proposal.deleteFormFile(this.viewProposalId, file.fileId)
          this.removeFormFileRow(file.fileId)
        }

        const previous = this.currentResearchStandardValue()
        const nextResearchStandard = {
          ...(previous || {}),
          attachments: {
            ...(previous && previous.attachments ? previous.attachments : {}),
            [slotKey]: null
          }
        }
        this.setResearchStandardValue(nextResearchStandard)
        await this.persistDraft({ silent: true })
      } catch (err) {
        await this.showAlert({
          icon: 'error',
          title: 'ลบเอกสารไม่สำเร็จ',
          text: (err && err.response && err.response.data && err.response.data.message) || 'กรุณาลองใหม่อีกครั้ง'
        })
      }
    },

    async uploadFormFiles(files) {
      if (!this.viewProposalId) return
      const list = Array.isArray(files) ? files : []
      for (const file of list) {
        const formData = new FormData()
        formData.append('file', file)
        try {
          const res = await Service.proposal.uploadFormFile(this.viewProposalId, formData)
          const ok = res && res.data && res.data.success
          if (ok && res.data.data) {
            this.files = (this.files || []).filter(f => f && !f._pending)
            this.files = [...this.files, res.data.data]
          }
        } catch (e) {
          // Keep a placeholder so the user can retry by re-uploading.
          this.files = [...(this.files || []), {
            name: file && file.name ? file.name : 'file',
            datetime: new Date().toLocaleString(),
            type: '',
            note: 'อัปโหลดไม่สำเร็จ กรุณาลองใหม่',
            _pending: true
          }]
        }
      }
    },

    async flushPendingFormFiles() {
      if (!this.viewProposalId) return
      if (!Array.isArray(this.pendingFormFiles) || !this.pendingFormFiles.length) return
      const batch = [...this.pendingFormFiles]
      this.pendingFormFiles = []
      // Remove placeholders before uploading, then re-add uploaded entries.
      this.files = (this.files || []).filter(f => f && !f._pending)
      await this.uploadFormFiles(batch)
    },

    async removeFile(indexOrPayload) {
      if (this.mainFormReadOnly) return

      let index = -1
      let item = null

      if (typeof indexOrPayload === 'number') {
        index = indexOrPayload
      } else if (indexOrPayload && typeof indexOrPayload === 'object') {
        if (typeof indexOrPayload.index === 'number') index = indexOrPayload.index
        if (indexOrPayload.item && typeof indexOrPayload.item === 'object') item = indexOrPayload.item
      }

      if (!item && Array.isArray(this.files) && index >= 0) {
        item = this.files[index]
      }

      if (!item && Array.isArray(this.files) && indexOrPayload && typeof indexOrPayload === 'object') {
        const payloadFileId = this.normalizeFileId(
          indexOrPayload.fileId ||
          (indexOrPayload.item && (indexOrPayload.item.fileId || indexOrPayload.item.id || indexOrPayload.item._id))
        )
        if (payloadFileId) {
          index = this.files.findIndex((entry) => {
            const entryId = this.normalizeFileId(entry && (entry.fileId || entry.id || entry._id))
            return entryId && String(entryId) === String(payloadFileId)
          })
          if (index >= 0) item = this.files[index]
        }
      }

      if (!item) return
      const normalizedFileId = this.normalizeFileId(item.fileId || item.id || item._id)

      // Remove placeholders only from UI
      if (item._pending) {
        if (index >= 0) this.files.splice(index, 1)
        this.markAsEdited()
        return
      }

      if (this.viewProposalId && normalizedFileId) {
        try {
          await Service.proposal.deleteFormFile(this.viewProposalId, normalizedFileId)
        } catch (e) {
          // ignore and still remove from UI
        }
      }

      if (normalizedFileId) {
        this.removeFormFileRow(normalizedFileId)
        this.detachBudgetAttachmentByFileId(normalizedFileId)
        this.detachResearchStandardAttachmentByFileId(normalizedFileId)
      } else {
        if (index >= 0) this.files.splice(index, 1)
      }
      this.markAsEdited()
    },

    async openFile(item) {
      const fileId = this.normalizeFileId(item && (item.fileId || item.id || item._id))
      const proposalId = this.viewProposalId ||
        this.normalizeFileId(this.loadedProposal && (this.loadedProposal._id || this.loadedProposal.id)) ||
        this.normalizeFileId(this.proposalId)

      if (!item || !fileId) {
        await this.showAlert({
          icon: 'warning',
          title: 'ไม่สามารถเปิดไฟล์ได้',
          text: 'ไม่พบรหัสไฟล์แนบ กรุณาอัปโหลดเอกสารใหม่อีกครั้ง',
          confirmButtonText: 'ตกลง'
        })
        return
      }

      if (!proposalId) {
        await this.showAlert({
          icon: 'warning',
          title: 'ไม่สามารถเปิดไฟล์ได้',
          text: 'ไม่พบรหัสโครงการสำหรับดึงไฟล์แนบ กรุณาบันทึกแบบร่างแล้วลองใหม่',
          confirmButtonText: 'ตกลง'
        })
        return
      }

      // Open a blank tab immediately to avoid popup blockers (async opens are often blocked).
      const popup = window.open('', '_blank')
      try {
        if (popup && popup.document && popup.document.body) {
          popup.document.title = 'กำลังเปิดไฟล์...'
          popup.document.body.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'
          popup.document.body.innerHTML = '<div style="padding:16px;color:#334155">กำลังดาวน์โหลดไฟล์...</div>'
        }
      } catch (_) { void _ }
      try {
        const res = await Service.proposal.downloadFormFile(proposalId, fileId)
        const blob = res && res.data ? res.data : null
        const headers = res && res.headers ? res.headers : {}
        const contentType = headers['content-type'] || headers['Content-Type'] || (blob && blob.type) || ''

        if (!blob || (typeof blob.size === 'number' && blob.size === 0)) {
          if (popup && !popup.closed) popup.close()
          return
        }

        // If server returned JSON error, show a friendly message.
        if (String(contentType).toLowerCase().includes('application/json')) {
          try {
            const text = await blob.text()
            const json = JSON.parse(text)
            const msg = (json && (json.message || json.error)) ? (json.message || json.error) : 'ไม่สามารถเปิดไฟล์ได้'
            if (popup && !popup.closed) popup.close()
            await this.showAlert({
              icon: 'error',
              title: 'ไม่สามารถเปิดไฟล์ได้',
              text: msg,
              confirmButtonText: 'ตกลง'
            })
            return
          } catch (_) {
            // fall through and try to render
          }
        }

        // Ensure blob has a useful MIME type for in-browser rendering.
        const fixedBlob = contentType && blob && blob.type !== contentType
          ? new Blob([blob], { type: contentType })
          : blob

        const url = window.URL.createObjectURL(fixedBlob)

        const lower = String(contentType || '').toLowerCase()
        const canInline = lower.includes('pdf') || lower.startsWith('image/')

        if (popup && !popup.closed && popup.document) {
          // Render inline (PDF/images) or show download UI for other types.
          const safeName = String(item.name || item.originalName || 'file').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          if (canInline) {
            popup.document.open()
            popup.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${safeName}</title>
    <style>html,body{height:100%;margin:0} .wrap{height:100%} embed,img{width:100%;height:100%;object-fit:contain}</style>
  </head>
  <body>
    <div class="wrap">
      <embed src="${url}" type="${lower || 'application/octet-stream'}" />
    </div>
  </body>
</html>`)
            popup.document.close()
          } else {
            popup.document.open()
            popup.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${safeName}</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:24px;color:#0f172a}
      a.btn{display:inline-block;background:#2563eb;color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none}
      .meta{margin-top:10px;color:#475569;font-size:13px}
    </style>
  </head>
  <body>
    <div style="font-weight:700;font-size:16px;margin-bottom:12px;">ไฟล์: ${safeName}</div>
    <a class="btn" href="${url}" download="${safeName}">ดาวน์โหลดไฟล์</a>
    <div class="meta">ชนิดไฟล์: ${lower || '-'}</div>
  </body>
</html>`)
            popup.document.close()
          }
        } else {
          window.open(url, '_blank')
        }

        setTimeout(() => window.URL.revokeObjectURL(url), 5 * 60 * 1000)
      } catch (e) {
        try {
          if (popup && !popup.closed) popup.close()
        } catch (_) { void _ }

        const status = e && e.response ? e.response.status : null
        const message =
          status === 404
            ? 'ไม่พบไฟล์ในฐานข้อมูล เอกสารนี้อาจถูกแนบไว้ก่อนระบบอัปโหลดแบบใหม่ กรุณาอัปโหลดเอกสารอีกครั้ง'
            : status === 403
              ? 'คุณไม่มีสิทธิ์เข้าถึงไฟล์นี้'
              : 'กรุณาลองใหม่อีกครั้ง'

        await this.showAlert({
          icon: 'error',
          title: 'ไม่สามารถเปิดไฟล์ได้',
          text: message,
          confirmButtonText: 'ตกลง'
        })
      }
    },

    async deleteDraftProposal () {
      if (!this.viewProposalId || !this.isDraftStatus) return
      if (this.deletingDraftProposal) return

      const result = await this.showAlert({
        icon: 'warning',
        title: 'ยืนยันการลบโครงการ',
        text: 'หากลบแล้วจะไม่สามารถกู้คืนข้อมูลได้',
        showCancelButton: true,
        confirmButtonText: 'ลบโครงการ',
        cancelButtonText: 'ยกเลิก'
      })
      if (!result || !result.isConfirmed) return

      this.deletingDraftProposal = true
      try {
        await Service.proposal.deleteDraft(this.viewProposalId)
        this.setStoredDraftId('')
        await this.showAlert({
          icon: 'success',
          title: 'ลบโครงการสำเร็จ',
          confirmButtonText: 'ตกลง'
        })
        this.$router.push({ name: 'UserHistory' })
      } catch (err) {
        await this.showAlert({
          icon: 'error',
          title: 'ลบโครงการไม่สำเร็จ',
          text: (err && err.response && err.response.data && err.response.data.message) || 'กรุณาลองใหม่อีกครั้ง',
          confirmButtonText: 'ตกลง'
        })
      } finally {
        this.deletingDraftProposal = false
      }
    },
    syncResearchTeamData(data) {
      if (data && typeof data === 'object') {
        this.researchTeamData = this.cloneSerializable(data) || data
        this.markAsEdited()
        return
      }

      // Get research team data and pass to components
      if (!this.$refs.researchTeamForm || typeof this.$refs.researchTeamForm.getFormData !== 'function') {
        return;
      }
      const teamData = this.$refs.researchTeamForm.getFormData();
      this.researchTeamData = this.cloneSerializable(teamData) || teamData;
      this.markAsEdited();
    },
    syncProjectDetailsData(data) {
      if (data && typeof data === 'object') {
        this.projectDetailsData = this.cloneSerializable(data) || data
        this.markAsEdited()
        return
      }

      if (!this.$refs.projectDetailsForm || typeof this.$refs.projectDetailsForm.getFormData !== 'function') {
        return
      }

      this.projectDetailsData = this.cloneSerializable(this.$refs.projectDetailsForm.getFormData()) || this.$refs.projectDetailsForm.getFormData()
      this.markAsEdited()
    },

    async loadProposalById(proposalId) {
      this.suppressAutoSave = true
      try {
        const res = await Service.proposal.getById(proposalId)
        const isSuccess = res && res.data && res.data.success
        if (!isSuccess) {
          return
        }

        const proposal = res.data.data || {}
        this.loadedProposal = proposal
        const snapshot = proposal.formSnapshotJson || {}
        this.currentStatus = proposal.currentStatus || 'draft'
        this.signatureData = snapshot.signatures || null

        await this.$nextTick()

        if (this.$refs.projectDetailsForm) {
          const formData = {
            projectNameThai: snapshot.projectNameThai || proposal.projectTitleTh || '',
            projectNameEnglish: snapshot.projectNameEnglish || proposal.projectTitleEn || '',
            fiscalYear: snapshot.fiscalYear || proposal.fiscalYear,
            fundingType: proposal.fundingType || snapshot.fundingType || '',
            fundingSubType: snapshot.fundingSubType || '',
            researchType: proposal.researchType || snapshot.researchType || '',
            collaboration: snapshot.collaboration || 'none',
            collaborationAgency: snapshot.collaborationAgency || '',
            keywords: snapshot.keywords || (Array.isArray(proposal.keywordList) ? proposal.keywordList.join(', ') : ''),
            problemSignificance: snapshot.problemSignificance || proposal.abstractText || '',
            objectives: snapshot.objectives || '',
            literatureReview: snapshot.literatureReview || '',
            references: snapshot.references || '',
            researchMethodology: snapshot.researchMethodology || '',
            researchScope: snapshot.researchScope || '',
            workPlan: snapshot.workPlan || [],
            milestones: snapshot.milestones || '',
            selectedOutcome: snapshot.selectedOutcome || '',
            integration: snapshot.integration || '',
            transferLevel: snapshot.transferLevel || '',
            researchStandard: snapshot.researchStandard || {},
            budget: snapshot.budget || {}
          }

          if (typeof this.$refs.projectDetailsForm.setFormData === 'function') {
            const hydratedFormData = await this.$refs.projectDetailsForm.setFormData(formData)
            this.syncProjectDetailsData(hydratedFormData || formData)
          } else if (this.$refs.projectDetailsForm.form && typeof this.$refs.projectDetailsForm.form === 'object') {
            Object.assign(this.$refs.projectDetailsForm.form, formData)
            this.syncProjectDetailsData(formData)
          }
        }

        if (this.$refs.researchTeamForm) {
          const team = snapshot.researchTeam || {}
          if (typeof this.$refs.researchTeamForm.setTeamData === 'function') {
            const hydratedTeamData = await this.$refs.researchTeamForm.setTeamData(team)
            this.syncResearchTeamData(hydratedTeamData || team)
          } else {
            if (team.projectLeader && this.$refs.researchTeamForm.projectLeader) {
              Object.assign(this.$refs.researchTeamForm.projectLeader, team.projectLeader)
            }
            if (Array.isArray(team.coResearchers)) {
              this.$refs.researchTeamForm.coResearchers = [].concat(team.coResearchers)
            }
            if (Array.isArray(team.advisors)) {
              this.$refs.researchTeamForm.advisors = [].concat(team.advisors)
            }
            this.syncResearchTeamData(team)
          }
        }

        this.files = Array.isArray(snapshot.files) ? snapshot.files : []

        // If binary is stored in DB, enrich snapshot metadata without losing editable fields (type/note).
        try {
          const fileRes = await Service.proposal.listFormFiles(proposalId)
          const ok = fileRes && fileRes.data && fileRes.data.success
          const rows = ok && Array.isArray(fileRes.data.data) ? fileRes.data.data : []

          if (!this.files.length && rows.length) {
            this.files = rows
          } else if (this.files.length && rows.length) {
            const map = new Map(rows.map(r => [String(r && r.fileId), r]))
            this.files = this.files.map((f) => {
              const fid = f && f.fileId ? String(f.fileId) : ''
              if (!fid || !map.has(fid)) return f
              const fresh = map.get(fid)
              return {
                ...fresh,
                // keep user-edited fields from snapshot
                type: f.type || fresh.type,
                note: f.note || fresh.note
              }
            })
          }
        } catch (e) {
          // ignore
        }

        if (proposal.currentStatus) {
          this.currentStatus = proposal.currentStatus
        }

        if (String(proposal.currentStatus || '').toLowerCase() === 'draft') {
          this.setStoredDraftId(proposal._id || proposalId)
        } else {
          this.setStoredDraftId('')
        }

        await this.maybeShowSubmittedSuccessAlert(proposal._id || proposalId, proposal.currentStatus)

        const nonEditableStatuses = [
          'pending_confirm', 'submitted', 'faculty_review_pending', 'faculty_approved', 'faculty_rejected',
          'office_received', 'document_checking', 'assigned_to_committee',
          'under_review', 'committee_valuated', 'resubmitted', 'second_round_review',
          'approved', 'rejected', 'announced'
        ]

        if (nonEditableStatuses.indexOf(proposal.currentStatus) !== -1) {
          this.isReadOnly = true
        }
      } catch (err) {
        console.error('loadProposalById error:', err)
      } finally {
        this.$nextTick(() => {
          this.updateDraftBaseline()
          this.isDraftSaved = true
          this.suppressAutoSave = false
        })
      }
    },

    clearAutoSaveTimer () {
      if (!this.autoSaveTimerId) return
      clearTimeout(this.autoSaveTimerId)
      this.autoSaveTimerId = null
    },
    clearBudgetAutoSaveTimer () {
      if (!this.budgetAutoSaveTimerId) return
      clearTimeout(this.budgetAutoSaveTimerId)
      this.budgetAutoSaveTimerId = null
    },
    async flushAutoSaveBeforeLeave () {
      const hasUnsavedChanges = this.hasDraftChangedFromBaseline()
      const hasPendingDraftSave = Boolean(
        this.autoSaveTimerId ||
        this.budgetAutoSaveTimerId ||
        this.autoSavePending ||
        (Array.isArray(this.pendingFormFiles) && this.pendingFormFiles.length) ||
        hasUnsavedChanges
      )

      if (!hasPendingDraftSave || !this.canAutoSave()) return

      this.clearAutoSaveTimer()
      this.clearBudgetAutoSaveTimer()

      if (this.isAutoSaving) {
        this.autoSavePending = true
        return
      }

      await this.persistDraft({ silent: true })
    },
    handleBudgetAutoSave (budget) {
      const nextBudget = this.cloneSerializable(budget) || {}
      this.projectDetailsData = {
        ...(this.projectDetailsData || {}),
        budget: nextBudget
      }

      this.markAsEdited()
    },
    handleBudgetStickySummaryUpdate (summary) {
      if (!this.shouldEnableBudgetStickyOverlay) {
        this.budgetStickySummary = null
        return
      }
      this.budgetStickySummary = (summary && typeof summary === 'object')
        ? (this.cloneSerializable(summary) || summary)
        : null
    },
    jumpToBudgetStickyIssue () {
      const projectDetailsForm = this.$refs && this.$refs.projectDetailsForm
      const budgetSection = projectDetailsForm && projectDetailsForm.$refs
        ? projectDetailsForm.$refs.budgetSection
        : null

      if (budgetSection && typeof budgetSection.jumpToFirstBudgetIssue === 'function') {
        budgetSection.jumpToFirstBudgetIssue()
        return
      }

      this.focusBudgetSection()
    },
    canAutoSave () {
      if (this.suppressAutoSave) return false
      if (this.isAdminView) return false
      if (this.mainFormReadOnly) return false
      const status = String(this.currentStatus || 'draft').toLowerCase()
      return status === 'draft' || status === 'revision_requested'
    },
    scheduleAutoSave () {
      if (!this.canAutoSave()) return
      this.clearAutoSaveTimer()
      this.autoSaveTimerId = setTimeout(() => {
        this.autoSaveTimerId = null
        this.autoSaveDraft()
      }, this.autoSaveDebounceMs)
    },
    async persistDraft ({ silent = false, payload = null } = {}) {
      const payloadToSave = payload || this.normalizeApiPayload()
      payloadToSave.status = 'draft'

      try {
        if (this.viewProposalId) {
          await Service.proposal.updateDraft(this.viewProposalId, payloadToSave)
          this.setStoredDraftId(this.viewProposalId)
          await this.flushPendingFormFiles()
        } else {
          const createRes = await Service.proposal.create(payloadToSave)
          const created = createRes && createRes.data && createRes.data.data ? createRes.data.data : null
          const proposalId = created && (created._id || created.id)
          if (proposalId) {
            this.viewProposalId = proposalId
            this.setStoredDraftId(proposalId)
            this.syncRouteProposalId(proposalId)
            await this.flushPendingFormFiles()
          }
        }

        this.updateDraftBaseline()
        this.isDraftSaved = true
        this.lastAutoSavedAt = new Date().toISOString()

        if (!silent) {
          await this.showAlert({
            title: 'สำเร็จ!',
            text: 'บันทึกแบบร่างเรียบร้อยแล้ว',
            icon: 'success',
            confirmButtonText: 'ตกลง'
          })
        }
      } catch (err) {
        this.isDraftSaved = false

        const message = err && err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : 'ไม่สามารถบันทึกแบบร่างได้ในขณะนี้'

        if (!silent) {
          await this.showAlert({
            title: 'บันทึกแบบร่างไม่สำเร็จ',
            text: message,
            icon: 'error',
            confirmButtonText: 'ตกลง'
          })
        } else {
          console.error('Auto save draft failed:', message)
        }

        throw err
      }
    },
    async autoSaveDraft () {
      this.clearAutoSaveTimer()
      this.clearBudgetAutoSaveTimer()
      if (!this.canAutoSave()) return

      const payload = this.normalizeApiPayload()
      if (!this.hasDraftChangedFromBaseline(payload)) {
        if (this.viewProposalId || this.lastAutoSavedAt) {
          this.isDraftSaved = true
        }
        return
      }

      if (this.isAutoSaving) {
        this.autoSavePending = true
        return
      }

      this.isAutoSaving = true
      try {
        await this.persistDraft({ silent: true, payload })
      } catch (err) {
        void err
      } finally {
        this.isAutoSaving = false
        if (this.autoSavePending) {
          this.autoSavePending = false
          this.scheduleAutoSave()
        }
      }
    },
    async saveDraft() {
      this.clearAutoSaveTimer()
      this.clearBudgetAutoSaveTimer()
      try {
        this.isDraftSaving = true
        await this.persistDraft({ silent: false })
      } catch (err) {
        void err
      } finally {
        this.isDraftSaving = false
      }
    },
    getSubmitParticipantSummary () {
      const teamData = this.$refs.researchTeamForm && typeof this.$refs.researchTeamForm.getFormData === 'function'
        ? this.$refs.researchTeamForm.getFormData()
        : (this.researchTeamData || {})

      const coResearchers = Array.isArray(teamData && teamData.coResearchers)
        ? teamData.coResearchers
        : []
      const advisors = Array.isArray(teamData && teamData.advisors)
        ? teamData.advisors
        : []

      const coResearcherCount = coResearchers.length
      const advisorCount = advisors.length

      return {
        coResearcherCount,
        advisorCount,
        requiresCollaborationConfirmation: (coResearcherCount + advisorCount) > 0
      }
    },

    async submitProject() {
      if (this.submittingProject) return
      this.clearAutoSaveTimer()
      this.clearBudgetAutoSaveTimer()

      const previousShowSubmit = this.showSubmitButton
      const previousStatus = this.currentStatus
      const previousReadOnly = this.isReadOnly

      const validation = this.validateBeforeSubmit()
      if (!validation.ok) {
        await this.showAlert({
          icon: 'warning',
          title: 'ไม่สามารถยื่นโครงการได้',
          text: validation.message || 'กรุณากรอกข้อมูลให้ครบถ้วนก่อนยื่นโครงการ',
          confirmButtonText: 'ตกลง'
        })
        return
      }

      const participantSummary = this.getSubmitParticipantSummary()
      const requiresCollaborationConfirmation = Boolean(participantSummary.requiresCollaborationConfirmation)
      const optimisticStatus = requiresCollaborationConfirmation ? 'pending_confirm' : 'submitted'

      this.submittingProject = true
      this.showSubmitButton = true
      this.currentStatus = optimisticStatus
      this.isReadOnly = true
      try {
        const payload = this.normalizeApiPayload()
        let submitRes = null
        // Avoid creating a duplicate project: if draft already exists, update + submit the same record.
        if (this.viewProposalId) {
          await Service.proposal.updateDraft(this.viewProposalId, payload)
          await this.flushPendingFormFiles()
          submitRes = await Service.proposal.submit(this.viewProposalId)
        } else {
          const createRes = await Service.proposal.create(payload)
          const created = createRes && createRes.data && createRes.data.data ? createRes.data.data : null
          const proposalId = created && (created._id || created.id)

          if (proposalId) {
            this.viewProposalId = proposalId
            this.syncRouteProposalId(proposalId)
            await this.flushPendingFormFiles()
            submitRes = await Service.proposal.submit(proposalId)
          }
        }

        const submitted = submitRes && submitRes.data && submitRes.data.data ? submitRes.data.data : null
        const fallbackStatus = requiresCollaborationConfirmation ? 'pending_confirm' : 'submitted'
        const submittedStatus = submitted && submitted.currentStatus
          ? String(submitted.currentStatus)
          : ''
        let nextStatus = submittedStatus || fallbackStatus

        if (!requiresCollaborationConfirmation && String(nextStatus || '').trim().toLowerCase() === 'pending_confirm') {
          nextStatus = 'submitted'
        }

        this.currentStatus = nextStatus
        this.isReadOnly = nextStatus !== 'draft'
        this.showSubmitButton = nextStatus === 'pending_confirm' || nextStatus === 'submitted'
        const submittedProposalId = (submitted && (submitted._id || submitted.id)) || this.viewProposalId
        if (submittedProposalId && ['pending_confirm', 'submitted'].includes(String(nextStatus || '').toLowerCase())) {
          this.setSubmitSuccessPendingFlag(submittedProposalId, true)
        }

        this.setStoredDraftId('')
        await this.showAlert({
          title: requiresCollaborationConfirmation ? 'ส่งคำขอเรียบร้อย' : 'ยื่นสำเร็จ',
          text: requiresCollaborationConfirmation
            ? 'รอการยืนยันจากผู้ร่วมโครงการ/ที่ปรึกษาโครงการ'
            : 'กำลังส่งให้ประธานสำนักพิจารณา',
          icon: 'success',
          confirmButtonText: 'ตกลง'
        })
      } catch (err) {
        this.showSubmitButton = previousShowSubmit
        this.currentStatus = previousStatus
        this.isReadOnly = previousReadOnly

        const message = err && err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : 'ไม่สามารถยื่นโครงการได้ในขณะนี้'

        await this.showAlert({
          title: 'ยื่นโครงการไม่สำเร็จ',
          text: message,
          icon: 'error',
          confirmButtonText: 'ตกลง'
        })
      } finally {
        this.submittingProject = false
      }
    },

    normalizeBudgetNumber (value) {
      const normalizedValue = typeof value === 'string'
        ? value.replace(/,/g, '').trim()
        : value
      const parsed = Number(normalizedValue)
      if (!Number.isFinite(parsed)) return 0
      return Math.round(parsed * 100) / 100
    },

    budgetNumbersMatch (left, right) {
      return Math.abs(this.normalizeBudgetNumber(left) - this.normalizeBudgetNumber(right)) < 0.01
    },

    sumBudgetCategoryItems (category) {
      if (!category || !Array.isArray(category.items)) return 0
      return this.normalizeBudgetNumber(
        category.items.reduce((sum, item) => sum + (Number(item && item.total) || 0), 0)
      )
    },

    sumBudgetPeriods (items, index) {
      if (!Array.isArray(items)) return 0
      return this.normalizeBudgetNumber(
        items.reduce((sum, item) => {
          const periods = item && Array.isArray(item.periods) ? item.periods : []
          return sum + (Number(periods[index]) || 0)
        }, 0)
      )
    },

    findBudgetCategory (categories, expectedName, fallbackIndex) {
      if (!Array.isArray(categories)) return null

      const byName = categories.find((category) => category && category.name === expectedName)
      if (byName) return byName

      if (typeof fallbackIndex === 'number' && fallbackIndex >= 0) {
        return categories[fallbackIndex] || null
      }

      return null
    },

    focusBudgetSection () {
      try {
        if (
          this.$refs.projectDetailsForm &&
          typeof this.$refs.projectDetailsForm.scrollToSection === 'function'
        ) {
          this.$refs.projectDetailsForm.scrollToSection('budget')
        }
      } catch (_) { void _ }
    },

    getBudgetValidationResult () {
      if (
        this.$refs.projectDetailsForm &&
        typeof this.$refs.projectDetailsForm.getBudgetValidationResult === 'function'
      ) {
        return this.$refs.projectDetailsForm.getBudgetValidationResult()
      }

      const form = this.$refs.projectDetailsForm && typeof this.$refs.projectDetailsForm.getFormData === 'function'
        ? this.$refs.projectDetailsForm.getFormData()
        : null
      const budget = form && form.budget ? form.budget : null
      const categories = budget && Array.isArray(budget.categories) ? budget.categories : []
      const items = categories.reduce((list, category) => {
        const categoryItems = category && Array.isArray(category.items) ? category.items : []
        return list.concat(categoryItems)
      }, [])

      const computedGrandTotal = this.normalizeBudgetNumber(
        items.reduce((sum, item) => sum + (Number(item && item.total) || 0), 0)
      )
      const grandTotal = this.normalizeBudgetNumber(
        (budget && budget.grandTotal) || computedGrandTotal
      )
      const fundingType = String((form && form.fundingType) || '').trim()
      const budgetLimitContext = this.resolveFundingBudgetLimitContext(fundingType)
      const budgetLimit = this.normalizeBudgetNumber(budgetLimitContext.budgetLimit)

      const travelCategory = this.findBudgetCategory(categories, 'หมวดค่าเดินทาง', 2)
      const travelTotal = this.sumBudgetCategoryItems(travelCategory)
      const travelLimit = this.normalizeBudgetNumber(grandTotal * 0.25)

      const totalPeriod1 = this.sumBudgetPeriods(items, 0)
      const totalPeriod2 = this.sumBudgetPeriods(items, 1)
      const totalPeriod3 = this.sumBudgetPeriods(items, 2)
      const expectedPeriod1 = this.normalizeBudgetNumber(grandTotal * 0.5)
      const expectedPeriod2 = this.normalizeBudgetNumber(grandTotal * 0.4)
      const expectedPeriod3 = this.normalizeBudgetNumber(grandTotal * 0.1)
      const invalidPeriodRow = false

      const errors = []

      if (grandTotal > 0 && travelTotal > travelLimit) {
        errors.push(
          `หมวดค่าเดินทางเกิน 25% ของงบทั้งหมด (ขอ ${travelTotal.toLocaleString('th-TH')} บาท จากเพดาน ${travelLimit.toLocaleString('th-TH')} บาท)`
        )
      }

      if (budgetLimit > 0 && grandTotal > budgetLimit) {
        const fundingLabel = budgetLimitContext.label || fundingType || 'ประเภททุนที่เลือก'
        errors.push(
          `งบประมาณรวมเกินเพดานของ${fundingLabel} (เพดาน ${budgetLimit.toLocaleString('th-TH')} บาท, กรอก ${grandTotal.toLocaleString('th-TH')} บาท)`
        )
      }

      // Installment validation uses the sum of every item across every budget category in the proposal.
      if (!this.budgetNumbersMatch(totalPeriod1, expectedPeriod1)) {
        errors.push(
          `งวด 1 ต้องเท่ากับ 50% ของงบทั้งหมด (${expectedPeriod1.toLocaleString('th-TH')} บาท)`
        )
      }

      if (!this.budgetNumbersMatch(totalPeriod2, expectedPeriod2)) {
        errors.push(
          `งวด 2 ต้องเท่ากับ 40% ของงบทั้งหมด (${expectedPeriod2.toLocaleString('th-TH')} บาท)`
        )
      }

      if (!this.budgetNumbersMatch(totalPeriod3, expectedPeriod3)) {
        errors.push(
          `งวด 3 ต้องเท่ากับ 10% ของงบทั้งหมด (${expectedPeriod3.toLocaleString('th-TH')} บาท)`
        )
      }

      if (invalidPeriodRow) {
        errors.push('พบรายการงบประมาณที่ยอดงวด 1-3 รวมกันเกินงบของรายการนั้น')
      }

      return {
        ok: errors.length === 0,
        errors
      }
    },
    hasWorkPlanData (workPlan) {
      if (Array.isArray(workPlan)) return workPlan.length > 0
      if (!workPlan || typeof workPlan !== 'object') return false
      const duration = Number(workPlan.duration || 0)
      const activities = Array.isArray(workPlan.activities) ? workPlan.activities : []
      return duration > 0 && activities.length > 0
    },
    getProjectDetailsValidationResult () {
      const form = this.$refs.projectDetailsForm && typeof this.$refs.projectDetailsForm.getFormData === 'function'
        ? this.$refs.projectDetailsForm.getFormData()
        : null

      if (!form || typeof form !== 'object') {
        return { ok: false, message: 'กรุณากรอกข้อมูลหัวข้อรายละเอียดโครงการให้ครบถ้วน' }
      }

      const hasText = (value) => String(value || '').trim() !== ''
      const fundingType = String(form.fundingType || '').trim()
      const requiresFundingSubType = this.requiresFundingSubType(fundingType)
      const requiresExpectedOutcome = this.isExpectedOutcomeSelectionRequired(fundingType)
      const missingSections = []

      if (!hasText(form.projectNameThai) || !hasText(form.projectNameEnglish)) missingSections.push('1. ชื่อโครงการ')
      if (!fundingType || (requiresFundingSubType && !hasText(form.fundingSubType))) missingSections.push('2. ประเภททุน')
      if (!hasText(form.researchType)) missingSections.push(this.$t('budgetStickyOverlay.checklistItems.section4'))
      if (!hasText(form.keywords)) missingSections.push('5. คำสำคัญ (Keywords)')
      if (!hasText(form.problemSignificance)) missingSections.push('6. ความสำคัญของปัญหาและแนวคิด')
      if (!hasText(form.objectives)) missingSections.push('7. วัตถุประสงค์')
      if (!hasText(form.literatureReview)) missingSections.push('8. ทบทวนวรรณกรรม')
      if (!hasText(form.references)) missingSections.push('9. เอกสารอ้างอิง')
      if (!hasText(form.researchMethodology)) missingSections.push('10. วิธีดำเนินการวิจัย')
      if (!hasText(form.researchScope)) missingSections.push('11. ขอบเขตการวิจัย')
      if (!this.hasWorkPlanData(form.workPlan)) missingSections.push('12. แผนการดำเนินงาน')
      if (!hasText(form.milestones)) missingSections.push('13. ผลงานตามระยะเวลาการรายงาน')
      if (requiresExpectedOutcome && !hasText(form.selectedOutcome)) missingSections.push('14. ผลลัพธ์ที่คาดว่าจะได้รับ')
      if (!hasText(form.integration)) missingSections.push('15. การบูรณาการงานวิจัย')
      if (!hasText(form.transferLevel)) missingSections.push(this.$t('budgetStickyOverlay.checklistItems.section16'))

      if (missingSections.length > 0) {
        return {
          ok: false,
          message: `กรุณากรอกข้อมูลให้ครบถ้วนก่อนยื่นโครงการ\n- ${missingSections.join('\n- ')}`
        }
      }
      return { ok: true }
    },
    getResearchStandardValidationResult () {
      const section18AlertMessage = RESEARCH_STANDARD_TEXT.attachmentRequiredMessage
      const form = this.$refs.projectDetailsForm && typeof this.$refs.projectDetailsForm.getFormData === 'function'
        ? this.$refs.projectDetailsForm.getFormData()
        : null

      const std = form && form.researchStandard && typeof form.researchStandard === 'object'
        ? form.researchStandard
        : null

      if (!std) {
        return { ok: false, message: section18AlertMessage }
      }

      const mainType = String(std.mainType || '').trim()
      if (!mainType) {
        return { ok: false, message: section18AlertMessage }
      }

      const hasPlant = Boolean(std.isPlant)
      const hasHuman = Boolean(std.isHuman)
      const hasAnimal = Boolean(std.isAnimal)
      const plantSubType = String(std.plantSubType || '').trim()
      const humanSubType = String(std.humanSubType || '').trim()
      const animalSubType = String(std.animalSubType || '').trim()
      const missingSections = []

      if (mainType === 'none') {
        if (hasPlant && !plantSubType) {
          missingSections.push('18. Research standard (plant collection details)')
        }
      }

      if (mainType === 'human_animal') {
        if (!hasHuman && !hasAnimal) {
          missingSections.push('18. Research standard (select at least one: human research or animal use)')
        }

        if (hasHuman && !humanSubType) {
          missingSections.push('18. Research standard (human research subtype)')
        }

        if (hasAnimal && !animalSubType) {
          missingSections.push('18. Research standard (animal use subtype)')
        }
      }

      if (missingSections.length > 0) {
        return {
          ok: false,
          message: section18AlertMessage
        }
      }

      return { ok: true }
    },
    getBudgetCompletenessValidationResult () {
      const form = this.$refs.projectDetailsForm && typeof this.$refs.projectDetailsForm.getFormData === 'function'
        ? this.$refs.projectDetailsForm.getFormData()
        : null
      const budget = form && form.budget ? form.budget : null
      const categories = budget && Array.isArray(budget.categories) ? budget.categories : []
      const items = categories.reduce((list, category) => {
        const categoryItems = category && Array.isArray(category.items) ? category.items : []
        return list.concat(categoryItems)
      }, [])
      const computedGrandTotal = this.normalizeBudgetNumber(
        items.reduce((sum, item) => sum + (Number(item && item.total) || 0), 0)
      )
      const grandTotal = this.normalizeBudgetNumber(
        (budget && budget.grandTotal) || computedGrandTotal
      )

      if (grandTotal <= 0) {
        return {
          ok: false,
          message: 'กรุณากรอกข้อมูลให้ครบถ้วนก่อนยื่นโครงการ\n- 17. งบประมาณโครงการ (ยอดรวมงบประมาณต้องมากกว่า 0)'
        }
      }

      return { ok: true }
    },

    validateBeforeSubmit (options = {}) {
      const focusOnError = options.focusOnError !== false
      // 1) Validate research team required fields
      const teamValidation = this.$refs.researchTeamForm && typeof this.$refs.researchTeamForm.getValidationResult === 'function'
        ? this.$refs.researchTeamForm.getValidationResult()
        : null
      const teamData = this.$refs.researchTeamForm && typeof this.$refs.researchTeamForm.getFormData === 'function'
        ? this.$refs.researchTeamForm.getFormData()
        : null
      const isTeamValid = teamValidation ? teamValidation.ok : this.validateForm(teamData)
      if (!teamData || !isTeamValid) {
        if (focusOnError) {
          try {
            if (this.$refs.researchTeamForm && typeof this.$refs.researchTeamForm.scrollToSection === 'function') {
              this.$refs.researchTeamForm.scrollToSection('research_team')
            }
          } catch (_) { void _ }
        }
        if (teamValidation && teamValidation.message) {
          return { ok: false, message: teamValidation.message }
        }
        return { ok: false, message: 'กรุณากรอกข้อมูลคณะผู้วิจัยให้ครบถ้วน' }
      }

      // 2) Validate HTML required inputs across the page (project details includes many required fields)
      const missing = this.findFirstMissingRequiredInput()
      if (missing) {
        if (focusOnError) {
          try {
            if (typeof missing.scrollIntoView === 'function') {
              missing.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
            if (typeof missing.focus === 'function') missing.focus()
          } catch (_) { void _ }
        }
        return { ok: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วนก่อนยื่นโครงการ' }
      }

      // 3) Validate project details completeness by section (only on submit).
      const detailsValidation = this.getProjectDetailsValidationResult()
      if (!detailsValidation.ok) {
        return detailsValidation
      }

      // 4) Validate research standard completeness (section 18 with *)
      const researchStandardValidation = this.getResearchStandardValidationResult()
      if (!researchStandardValidation.ok) {
        return researchStandardValidation
      }

      // 5) Validate budget completeness (section 17 with *)
      const budgetCompletenessValidation = this.getBudgetCompletenessValidationResult()
      if (!budgetCompletenessValidation.ok) {
        if (focusOnError) this.focusBudgetSection()
        return budgetCompletenessValidation
      }

      // 6) Special rule: section 17 budget must satisfy submission criteria
      const budgetValidation = this.getBudgetValidationResult()
      if (!budgetValidation.ok) {
        if (focusOnError) this.focusBudgetSection()
        return {
          ok: false,
          message: `กรุณาแก้ไขหัวข้อ 17 งบประมาณให้ถูกต้องก่อนยื่นโครงการ\n- ${budgetValidation.errors.join('\n- ')}`
        }
      }

      return { ok: true }
    },

    findFirstMissingRequiredInput () {
      const root = this.$el
      if (!root || typeof root.querySelectorAll !== 'function') return null
      const nodes = root.querySelectorAll('input[required], select[required], textarea[required]')
      for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i]
        if (!el || el.disabled) continue

        const tag = (el.tagName || '').toLowerCase()
        const type = (el.type || '').toLowerCase()

        if (type === 'checkbox' || type === 'radio') {
          if (!el.checked) return el
          continue
        }

        const value = (tag === 'select')
          ? String(el.value || '')
          : String(el.value || '')

        if (!value.trim()) return el
      }
      return null
    },

    exportPDF() {
      console.log('Exporting PDF...');

      // Add PDF export logic here
      this.showAlert({
        title: 'กำลังสร้าง PDF...',
        text: 'PDF กำลังถูกสร้างขึ้น',
        icon: 'info',
        timer: 2000,
        showConfirmButton: false
      });
    },
    reportBudgetType (fundingType) {
      const map = {
        'new-researcher': 'new',
        'researcher-development': 'dev',
        'strategic-research': 'strategic',
        'industry-extension': 'industrial'
      }
      return map[fundingType] || ''
    },
    reportStrategy (fundingType, fundingSubType) {
      if (fundingType === 'new-researcher') return '2_1'
      if (fundingType === 'industry-extension') return '2_3_1'
      if (fundingType === 'researcher-development') {
        const map = {
          'economic-development': '2_2_1',
          'social-environment': '2_2_2',
          'science-technology': '2_2_3',
          'human-resources': '2_2_4'
        }
        return map[fundingSubType] || ''
      }
      return ''
    },
    reportResearchTypeLabel (researchType) {
      return this.researchTypeLabel(researchType)
    },
    reportSelectedOutcomes (fundingType, selectedOutcome) {
      const map = {
        'new-researcher:internationalConference': ['14_1_fullpaper'],
        'new-researcher:scopusJournal': ['14_1_international'],
        'new-researcher:tciJournal': ['14_1_tci'],
        'new-researcher:patent': ['14_1_patent'],
        'researcher-development:scopusJournal': ['14_2_international'],
        'researcher-development:tciJournal': ['14_2_tci1'],
        'researcher-development:patent': ['14_2_patent'],
        'strategic-research:scopusJournal': ['14_3_international'],
        'strategic-research:tciJournal': ['14_3_tci1'],
        'strategic-research:patent': ['14_3_patent'],
        'industry-extension:ipRegistration': ['14_4_ip']
      }
      return map[`${fundingType}:${selectedOutcome}`] || []
    },
    reportSocialTransfer (transferLevel) {
      const map = {
        'national-international': '16_1',
        'community-provincial': '16_2',
        none: '16_3'
      }
      return map[transferLevel] || ''
    },
    reportActivities (workPlan) {
      if (!workPlan) return []
      const duration = Number(workPlan.duration) || 0
      const rows = Array.isArray(workPlan.activities) ? workPlan.activities : (Array.isArray(workPlan) ? workPlan : [])
      return rows.map((activity) => {
        const selectedMonths = Array.isArray(activity && activity.selectedMonths) ? activity.selectedMonths : []
        const totalMonths = duration || Math.max(...selectedMonths, 0)
        return {
          name: (activity && activity.activityName) || '',
          months: Array.from({ length: totalMonths }, (_, index) => selectedMonths.includes(index + 1)),
          owner: (activity && activity.responsible) || ''
        }
      })
    },
    reportBudgetData (budget) {
      const hasEnteredValue = (value) => (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ''
      )
      const hasFilledMultiplier = (multiplier) => (
        hasEnteredValue(
          multiplier && (
            multiplier.value !== undefined
              ? multiplier.value
              : multiplier.val
          )
        )
      )
      const isFilledBudgetRow = (row) => {
        const periods = row && Array.isArray(row.periods) ? row.periods : []
        return Boolean((row && row.name ? String(row.name).trim() : '')) ||
          hasEnteredValue(row && row.total) ||
          hasEnteredValue(row && (row.p1 !== undefined ? row.p1 : periods[0])) ||
          hasEnteredValue(row && (row.p2 !== undefined ? row.p2 : periods[1])) ||
          hasEnteredValue(row && (row.p3 !== undefined ? row.p3 : periods[2])) ||
          (Array.isArray(row && row.multipliers) && row.multipliers.some(hasFilledMultiplier))
      }
      const categories = Array.isArray(budget && budget.categories) ? budget.categories : []
      const normalizedCategories = categories.map((category) => {
        const rows = Array.isArray(category && category.rows)
          ? category.rows
          : (Array.isArray(category && category.items) ? category.items : [])
        const normalizedRows = rows
          .filter(isFilledBudgetRow)
          .map((row) => ({
            name: (row && row.name) || '-',
            multipliers: Array.isArray(row && row.multipliers)
              ? row.multipliers
                .filter(hasFilledMultiplier)
                .map((multiplier) => ({
                  label: (multiplier && multiplier.label) || '',
                  value: this.normalizeBudgetNumber(
                    (multiplier && (
                      multiplier.value !== undefined
                        ? multiplier.value
                        : multiplier.val
                    )) || 0
                  )
                }))
              : [],
            total: this.normalizeBudgetNumber((row && row.total) || 0),
            p1: this.normalizeBudgetNumber(
              (row && (
                row.p1 !== undefined
                  ? row.p1
                  : (row.periods && row.periods[0])
              )) || 0
            ),
            p2: this.normalizeBudgetNumber(
              (row && (
                row.p2 !== undefined
                  ? row.p2
                  : (row.periods && row.periods[1])
              )) || 0
            ),
            p3: this.normalizeBudgetNumber(
              (row && (
                row.p3 !== undefined
                  ? row.p3
                  : (row.periods && row.periods[2])
              )) || 0
            )
          }))
        return {
          title: (category && (category.title || category.name)) || '-',
          rows: normalizedRows
        }
      }).filter((category) => category.rows.length)

      const computedGrandTotal = normalizedCategories.reduce((sum, category) => (
        sum + category.rows.reduce((rowSum, row) => rowSum + this.normalizeBudgetNumber(row.total || 0), 0)
      ), 0)
      const budgetGrandTotal = this.normalizeBudgetNumber(budget && budget.grandTotal)
      const grandTotal = hasEnteredValue(budget && budget.grandTotal) &&
        this.budgetNumbersMatch(budgetGrandTotal, computedGrandTotal)
        ? budgetGrandTotal
        : computedGrandTotal

      return {
        categories: normalizedCategories,
        grandTotal
      }
    },
    reportResearchStandardData (researchStandard) {
      const standard = researchStandard || {}
      const selected = []

      if (standard.mainType === 'none') selected.push('none')
      if (standard.isHuman) selected.push('human')
      if (standard.isAnimal) selected.push('animal')
      if (standard.isPlant) selected.push('plant')
      if (!selected.length) selected.push('none')

      const createDetail = (subType) => ({
        hasCert: subType === 'approved',
        isPending: subType === 'pending',
        applyDate: '-'
      })

      return {
        researchStandard: selected,
        humanDetail: createDetail(standard.humanSubType),
        animalDetail: createDetail(standard.animalSubType),
        plantDetail: createDetail(standard.plantSubType)
      }
    },
    reportSignatureDate (value) {
      return value && value.timestamp ? value.timestamp : ''
    },
    reportResearcherRow (person, signature) {
      const data = person || {}
      const sign = signature || {}
      return {
        name: data.name || '',
        affiliation: data.affiliation || '',
        phone: data.phone || '',
        email: data.email || '',
        code: data.proportion || '',
        signature: sign.data || '',
        signatureDate: this.reportSignatureDate(sign)
      }
    },
    buildReportExportForm () {
      const projectDetails = this.$refs.projectDetailsForm && typeof this.$refs.projectDetailsForm.getFormData === 'function'
        ? (this.cloneSerializable(this.$refs.projectDetailsForm.getFormData()) || {})
        : (this.cloneSerializable(this.projectDetailsData) || {})
      const researchTeam = this.$refs.researchTeamForm && typeof this.$refs.researchTeamForm.getFormData === 'function'
        ? (this.cloneSerializable(this.$refs.researchTeamForm.getFormData()) || {})
        : (this.cloneSerializable(this.researchTeamData) || {})
      const signatures = this.$refs.signatureCard && typeof this.$refs.signatureCard.getAllSignatures === 'function'
        ? (this.cloneSerializable(this.$refs.signatureCard.getAllSignatures()) || {})
        : (this.cloneSerializable(this.signatureData) || {})
      const budgetData = this.reportBudgetData(projectDetails.budget)
      const researchStandardData = this.reportResearchStandardData(projectDetails.researchStandard)
      const leader = this.reportResearcherRow(researchTeam.projectLeader, signatures.projectLeader)
      const coResearchers = Array.isArray(researchTeam.coResearchers)
        ? researchTeam.coResearchers.map((person, index) => this.reportResearcherRow(person, signatures[`coResearcher-${index}`]))
        : []
      const advisors = Array.isArray(researchTeam.advisors)
        ? researchTeam.advisors.map((person, index) => this.reportResearcherRow(person, signatures[`advisor-${index}`]))
        : []

      return {
        budgetType: this.reportBudgetType(projectDetails.fundingType),
        titleTH: projectDetails.projectNameThai || '',
        titleEN: projectDetails.projectNameEnglish || '',
        selectedStrategy: this.reportStrategy(projectDetails.fundingType, projectDetails.fundingSubType),
        researchers: {
          mainResearcher: leader,
          coResearchers,
          advisors
        },
        cooperation: String(projectDetails.collaborationAgency || '').trim()
          ? 'มี'
          : (projectDetails.collaboration === 'yes' ? 'มี' : 'ไม่มี'),
        cooperationDetail: projectDetails.collaborationAgency || '',
        researchType: this.reportResearchTypeLabel(projectDetails.researchType),
        keywords: projectDetails.keywords || '',
        importance: projectDetails.problemSignificance || '',
        objective: projectDetails.objectives || '',
        literature: projectDetails.literatureReview || '',
        reference: projectDetails.references || '',
        methodology: projectDetails.researchMethodology || '',
        scope: projectDetails.researchScope || '',
        activities: this.reportActivities(projectDetails.workPlan),
        progressReport: projectDetails.milestones || '',
        selectedOutcomes: this.reportSelectedOutcomes(projectDetails.fundingType, projectDetails.selectedOutcome),
        integration: projectDetails.integration || '',
        socialTransfer: this.reportSocialTransfer(projectDetails.transferLevel),
        budgetData,
        researchStandard: researchStandardData.researchStandard,
        humanDetail: researchStandardData.humanDetail,
        animalDetail: researchStandardData.animalDetail,
        plantDetail: researchStandardData.plantDetail,
        remark: ''
      }
    },
    async exportProposalPdf() {
      if (this.isExportingPdf) return

      this.isExportingPdf = true

      try {
        this.reportExportForm = this.buildReportExportForm()
        await this.$nextTick()

        const reportView = this.$refs.reportView
        if (!reportView || typeof reportView.generatePDF !== 'function') {
          throw new Error('Report view is not ready')
        }

        await reportView.generatePDF()
      } catch (err) {
        await this.showAlert({
          icon: 'error',
          title: 'ไม่สามารถส่งออก PDF ได้',
          text: (err && err.message) || 'กรุณาลองใหม่อีกครั้ง'
        })
      } finally {
        this.isExportingPdf = false
        this.reportExportForm = null
      }
    },

    onSubmit() {
      const formData = this.$refs.researchTeamForm.getFormData();
      console.log('Form Data:', formData);

      // Validate form
      if (!this.validateForm(formData)) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }

      // Simulate save
      alert('บันทึกข้อมูลสำเร็จ!');
      console.log('Saved data:', formData);
    },

    onReset() {
      if (confirm('คุณต้องการรีเซ็ตฟอร์มใช่หรือไม่?')) {
        this.$refs.researchTeamForm.projectLeader = {
          name: '',
          affiliation: '',
          phone: '',
          email: '',
          proportion: ''
        };
        this.$refs.researchTeamForm.coResearchers = [];
        this.$refs.researchTeamForm.advisors = [];
      }
    },

    onPreview() {
      const formData = this.$refs.researchTeamForm.getFormData();
      console.log('Preview Data:', formData);

      // Create preview content
      let preview = '=== ตัวอย่างข้อมูลการวิจัย ===\n\n';
      preview += '1.1 หัวหน้าโครงการวิจัย\n';
      preview += `ชื่อ-สกุล: ${formData.projectLeader.name}\n`;
      preview += `สังกัดหน่วยงาน: ${formData.projectLeader.affiliation}\n`;
      preview += `เบอร์โทรศัพท์: ${formData.projectLeader.phone}\n`;
      preview += `E-mail: ${formData.projectLeader.email}\n`;
      preview += `สัดส่วนการวิจัย: ${formData.projectLeader.proportion}%\n\n`;

      if (formData.coResearchers.length > 0) {
        preview += '1.2 ผู้ร่วมโครงการวิจัย\n';
        formData.coResearchers.forEach((researcher, index) => {
          preview += `ผู้ร่วมที่ ${index + 1}:\n`;
          preview += `  ชื่อ-สกุล: ${researcher.name}\n`;
          preview += `  สังกัดหน่วยงาน: ${researcher.affiliation}\n`;
          preview += `  เบอร์โทรศัพท์: ${researcher.phone}\n`;
          preview += `  E-mail: ${researcher.email}\n`;
          preview += `  สัดส่วนการวิจัย: ${researcher.proportion}%\n\n`;
        });
      }

      if (formData.advisors.length > 0) {
        preview += 'ที่ปรึกษาโครงการวิจัย\n';
        formData.advisors.forEach((advisor, index) => {
          preview += `ที่ปรึกษาที่ ${index + 1}:\n`;
          preview += `  ชื่อ-สกุล: ${advisor.name}\n`;
          preview += `  สังกัดหน่วยงาน: ${advisor.affiliation}\n`;
          preview += `  เบอร์โทรศัพท์: ${advisor.phone}\n`;
          preview += `  E-mail: ${advisor.email}\n`;
          preview += `  สัดส่วนการวิจัย: ${advisor.proportion}%\n\n`;
        });
      }

      alert(preview);
    },

    validateForm(data) {
      if (!data || !data.projectLeader) {
        return false;
      }

      const hasText = (value) => String(value || '').trim() !== '';
      const hasValidNumber = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0;
      };

      // Validate project leader
      if (!hasText(data.projectLeader.name) || !hasText(data.projectLeader.affiliation) ||
        !hasText(data.projectLeader.phone) || !hasText(data.projectLeader.email) ||
        !hasValidNumber(data.projectLeader.proportion)) {
        return false;
      }

      // Validate co-researchers
      for (let researcher of data.coResearchers) {
        if (!hasText(researcher.name) || !hasText(researcher.affiliation) ||
          !hasText(researcher.phone) || !hasText(researcher.email) ||
          !hasValidNumber(researcher.proportion)) {
          return false;
        }
      }

      // Validate advisors
      for (let advisor of data.advisors) {
        if (!hasText(advisor.name) || !hasText(advisor.affiliation) ||
          !hasText(advisor.phone) || !hasText(advisor.email)) {
          return false;
        }
      }

      if (data.isProportionValid === false) {
        return false;
      }

      return true;
    }
  }
}
</script>

<style scoped>
.research-form {
  padding: 28px;
  background-color: #ffffff;
  min-height: 100vh;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
}

.research-form--has-admin-actions {
  padding-bottom: 110px;
}

.export-pdf-icon--spin {
  display: inline-block;
  animation: exportPdfSpin 0.75s linear infinite;
}

@keyframes exportPdfSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Draft: hide the bottom "note" block in SignatureCard (shown just above the status footer) */
.research-form--draft ::v-deep .signature-card .alert.alert-info {
  display: none;
}

.research-form h2 {
  color: white;
  font-weight: 800;
  text-align: center;
  padding: 18px 0;
  background: linear-gradient(135deg, #8b1212 0%, #c59b3a 115%);
  margin: 0 0 20px 0;
  width: 100%;
  box-sizing: border-box;
  border-radius: 5px;
}

.card {
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 0px;
}

.btn {
  border-radius: 6px;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.mfu-hero-action-btn {
  min-width: 130px;
  border-radius: 6px !important;
  padding: 0.55rem 1.05rem !important;
  background:  rgba(139, 18, 18, 0.98) !important;
  border: 1px solid rgba(255, 255, 255, 0.22) !important;
  color: #ffffff !important;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.18) !important;
}

.mfu-hero-action-btn:hover {
  transform: none !important;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.18) !important;
  filter: brightness(1.03);
}

.mfu-hero-action-btn:focus,
.mfu-hero-action-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(197, 155, 58, 0.25), 0 12px 24px rgba(15, 23, 42, 0.18) !important;
}

.mfu-hero-action-btn:disabled,
.mfu-hero-action-btn.disabled {
  opacity: 0.65 !important;
  cursor: not-allowed;
}

/* Meeting modal: align look with AdminMeetings create modal */
.meeting-modal ::v-deep .modal-header {
  background: linear-gradient(135deg, #8b1212 0%, #c59b3a 115%);
  color: #ffffff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.18) !important;
}

.meeting-modal ::v-deep .modal-content {
  border-radius: 16px !important;
  overflow: hidden;
}

.meeting-modal ::v-deep .modal-title {
  color: #ffffff !important;
  font-weight: 900;
}

.meeting-modal ::v-deep .close {
  color: #ffffff !important;
  opacity: 0.92 !important;
  text-shadow: none !important;
}

.meeting-modal ::v-deep .close:hover {
  opacity: 1 !important;
}

.meeting-modal .meeting-form {
  padding: 20px 24px 8px;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
}

.meeting-modal .meeting-form .field {
  margin-bottom: 14px;
}

.meeting-modal .meeting-form .small-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.meeting-modal .meeting-form .small-row .field {
  min-width: 0;
}

.meeting-modal .form-label {
  font-weight: 800;
  color: #111827;
}

.meeting-modal .required {
  color: #ef4444;
  font-weight: 900;
}

.meeting-modal .full {
  width: 100%;
}

.input-icon__wrap {
  display: flex;
  align-items: stretch;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(197, 155, 58, 0.65);
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
  border-left: 1px solid rgba(197, 155, 58, 0.65);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0;
  cursor: pointer;
}

.input-icon__wrap[data-tone="primary"] .input-icon__suffix {
  background: linear-gradient(135deg, #8b1212 0%, #c59b3a 115%);
}

.input-icon__wrap[data-tone="info"] .input-icon__suffix {
  background: linear-gradient(135deg, #c59b3a 0%, #8b1212 115%);
}

.input-icon__suffix:hover {
  filter: brightness(1.03);
}

.input-icon__suffix:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(197, 155, 58, 0.22);
}

.input-icon__ic {
  opacity: 0.88;
}

.time-trigger {
  cursor: pointer;
}

.time-trigger:disabled {
  cursor: not-allowed;
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
  color: #8b1212;
  font-weight: 800;
}

.meeting-type-toggle {
  position: relative;
  display: flex;
  gap: 6px;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.10);
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
  color: rgba(15, 23, 42, 0.55);
  transition: background 160ms ease, color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.meeting-type-toggle__input:checked + .meeting-type-toggle__label {
  color: #ffffff;
  background: linear-gradient(135deg, #8b1212 0%, #c59b3a 115%);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.16);
}

.meeting-type-toggle__label:active {
  transform: translateY(1px);
}

.meeting-modal ::v-deep .vc-popover-content {
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(2, 6, 23, 0.18);
  border: 1px solid rgba(197, 155, 58, 0.22);
}

.meeting-modal ::v-deep .vc-title {
  color: #8b1212;
  font-weight: 900;
}

.meeting-modal ::v-deep .vc-day-content.vc-highlight-content {
  color: #ffffff !important;
}

.meeting-modal ::v-deep .vc-highlight {
  background: linear-gradient(135deg, #8b1212 0%, #c59b3a 115%) !important;
}

.meeting-modal ::v-deep .modal-footer {
  background: #ffffff;
  border-top: 1px solid rgba(140, 21, 21, 0.12);
}

.meeting-modal .modal-actions-wrapper {
  padding: 12px 24px 18px;
}

.meeting-modal .btn-save {
  background: linear-gradient(135deg, #8b1212 0%, #c59b3a 115%) !important;
  border-color: rgba(255, 255, 255, 0.18) !important;
  color: #ffffff !important;
  border-radius: 10px !important;
  font-weight: 900 !important;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.18);
  margin-right: 12px;
}

.meeting-modal .btn-cancel {
  background: rgba(197, 155, 58, 0.18) !important;
  border: 1px solid rgba(197, 155, 58, 0.78) !important;
  color: #8b1212 !important;
  border-radius: 10px !important;
  font-weight: 900 !important;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.btn-secondary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border: none;
  color: white;
}

.btn-info {
  background: 4facfe;
  border: none;
} 

.revision-actions {
  gap: 12px;
  flex-wrap: wrap;
}

.revision-action-btn {
  min-width: 170px;
  font-weight: 700;
  border-width: 1px;
}

.research-form ::v-deep .revision-action-btn--save,
.revision-action-btn--save {
  background-color: var(--rf-gold) !important;
  border-color: var(--rf-gold) !important;
  color: #ffffff !important;
}

.research-form ::v-deep .revision-action-btn--save:hover:not(:disabled),
.research-form ::v-deep .revision-action-btn--save:focus:not(:disabled),
.revision-action-btn--save:hover:not(:disabled),
.revision-action-btn--save:focus:not(:disabled) {
  background-color: #b58522 !important;
  border-color: #b58522 !important;
}

.research-form ::v-deep .revision-action-btn--submit,
.revision-action-btn--submit {
  background-color: var(--rf-accent) !important;
  border-color: var(--rf-accent) !important;
  color: #ffffff !important;
}

.research-form ::v-deep .revision-action-btn--submit:hover:not(:disabled),
.research-form ::v-deep .revision-action-btn--submit:focus:not(:disabled),
.revision-action-btn--submit:hover:not(:disabled),
.revision-action-btn--submit:focus:not(:disabled) {
  background-color: #6f0e0e !important;
  border-color: #6f0e0e !important;
}

.research-form ::v-deep .revision-action-btn:disabled,
.revision-action-btn:disabled {
  opacity: 0.65;
}

.feedback-workspace {
  border: 1px solid #dbeafe;
  background: #ffffff;
}

.feedback-workspace-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #fcfdff;
}

.feedback-workspace-card:last-child {
  margin-bottom: 0;
}

.feedback-workspace-card__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 0.85rem;
  flex-wrap: wrap;
}

.feedback-workspace-card__header > div:first-child {
  flex: 1 1 320px;
  min-width: 0;
}

.feedback-workspace-card__title {
  font-weight: 800;
  color: #0f172a;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.feedback-workspace-card__subtitle {
  margin-top: 0.2rem;
  color: #64748b;
  font-size: 0.9rem;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.feedback-workspace-card__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.feedback-workspace-card__status {
  color: #047857;
  font-size: 0.82rem;
  font-weight: 700;
  white-space: normal;
  overflow-wrap: anywhere;
}

.feedback-workspace-notes {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.feedback-workspace-note {
  /* Keep the blue left bar for main headings only. Notes should look like formal sub-cards. */
  border-left: none;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.75rem 0.9rem;
  border-radius: 8px;
}

.feedback-workspace-note__meta {
  color: #334155;
  font-size: 0.85rem;
  margin-bottom: 0.35rem;
}

.feedback-workspace-note__body {
  color: #0f172a;
  white-space: pre-line;
}

.feedback-workspace-editor {
  border-top: 1px dashed #cbd5e1;
  padding-top: 1rem;
}

.feedback-workspace-editor__actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.feedback-workspace-editor label {
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.4rem;
}

.feedback-workspace-preview-text {
  border: 1px solid #dbeafe;
  background: #f8fbff;
  border-radius: 10px;
  padding: 0.85rem 1rem;
  color: #0f172a;
}

.feedback-inline-radio-group {
  display: grid;
  gap: 0.75rem;
}

.feedback-inline-radio {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid #dbeafe;
  border-radius: 10px;
  background: #f8fbff;
}

.feedback-fix-list__title {
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.75rem;
}

.feedback-fix-card {
  border: 1px solid #dbeafe;
  background: #f8fbff;
  border-radius: 10px;
  padding: 0.9rem 1rem;
  margin-bottom: 0.75rem;
}

.feedback-fix-card:last-child {
  margin-bottom: 0;
}

.feedback-fix-card__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.feedback-fix-card__section {
  font-weight: 700;
  color: #0f172a;
}

.feedback-fix-card__meta {
  color: #64748b;
  font-size: 0.85rem;
  margin-top: 0.15rem;
}

.feedback-fix-card__body {
  margin-top: 0.75rem;
  color: #334155;
  white-space: pre-line;
}

.revision-diff-summary-card {
  border-color: #dbe4ef;
}

.revision-diff-item + .revision-diff-item {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed #dbe4ef;
}

.revision-diff-item__header {
  margin-bottom: 0.65rem;
}

.revision-diff-item__link {
  color: var(--rf-accent);
  font-weight: 700;
  text-decoration: underline;
}

.revision-diff-item__link:hover,
.revision-diff-item__link:focus {
  color: #6f0e0e;
  text-decoration: underline;
}

.revision-diff-box {
  border: 1px solid #dbe4ef;
  border-radius: 10px;
  background: #fbfdff;
  padding: 0.7rem 0.85rem;
  height: 100%;
}

.revision-diff-box--before {
  border-color: #f1c7c7;
  background: #fff5f5;
}

.revision-diff-box--after {
  border-color: #bfdcc7;
  background: #f0fdf4;
}

.revision-diff-box__title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 0.35rem;
}

.revision-diff-box__body {
  color: #0f172a;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.45;
}

.admin-revision-link {
  color: #b91c1c;
  font-weight: 700;
  text-decoration: underline;
}

.admin-revision-link:hover,
.admin-revision-link:focus {
  color: #7f1d1d;
  text-decoration: underline;
}

.footer-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  /* Footer button rhythm (desktop defaults) */
  --rf-footer-btn-gap: 0.55rem;
  --rf-footer-btn-px: 16px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid #dee2e6;
  padding: 15px 20px;
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease-in-out;
  box-sizing: border-box;
}

.footer-fixed .btn {
  white-space: nowrap;
}

.footer-fixed .btn.btn-lg {
  /* Make label vertically centered and keep top/bottom padding visually equal */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--rf-footer-btn-gap);
  line-height: 1.05;
  padding-top: 10px;
  padding-bottom: 10px;
  padding-left: var(--rf-footer-btn-px);
  padding-right: var(--rf-footer-btn-px);
}

.footer-fixed .btn.btn-lg i {
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  align-self: center;
  vertical-align: middle;
}

.footer-fixed .btn.btn-lg .me-2 {
  /* Use flex gap for spacing; neutralize bootstrap margin so left/right feels balanced */
  margin-right: 0 !important;
}

.footer-fixed .btn.btn-lg svg,
.footer-fixed .btn.btn-lg .c-icon {
  height: 1em;
  width: 1em;
  flex: 0 0 auto;
  align-self: center;
  vertical-align: middle;
}

.footer-fixed .save-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(139, 18, 18, 0.22);
  color: #8b1212;
}

.footer-fixed .save-indicator .save-indicator-icon {
  width: 14px;
  height: 14px;
}

.footer-fixed .save-indicator .save-indicator-icon--spin {
  animation: exportPdfSpin 0.9s linear infinite;
}

.footer-fixed .save-indicator--saved {
  background: rgba(197, 155, 58, 0.14);
  border-color: rgba(197, 155, 58, 0.42);
  color: #8b1212;
}

.footer-fixed .save-hint {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-left: -4px;
  white-space: nowrap;
}

@media (max-width: 520px) {
  .footer-fixed .save-hint {
    display: none;
  }
}

.admin-footer-fixed {
  padding-bottom: calc(15px + env(safe-area-inset-bottom));
}

.committee-user-row {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
  background: #ffffff;
}

.committee-user-row.is-selected {
  border-color: #a7f3d0;
  background: #ecfdf5;
}

.footer-fixed .card {
  border: none;
  border-radius: 8px;
}

.report-export-host {
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  z-index: -1;
  pointer-events: none;
}

@media (max-width: 768px) {
  .research-form {
    padding: 10px;
    /* Prevent horizontal scroll caused by fixed bars shifted by sidebar offsets */
    overflow-x: hidden;
  }

  /* Give modals a bit more outer left/right breathing room on small screens */
  .research-form ::v-deep .modal-dialog {
    margin-left: 14px;
    margin-right: 14px;
    max-width: calc(100% - 28px);
  }

  .btn {
    display: block;
    width: 100%;
    margin-bottom: 10px;
  }

  /* On small screens the sidebar becomes overlay; keep footer bar full-width. */
  .footer-fixed {
    left: 0 !important;
    right: 0 !important;
    max-width: 100vw;
  }

  .footer-fixed {
    padding: 10px 12px;
    --rf-footer-btn-gap: 0.44rem;
    --rf-footer-btn-px: 10px;
  }

  /* Status badge: scale down on small screens to match the compact buttons */
  .footer-fixed ::v-deep .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.78rem;
    line-height: 1.05;
    padding: 6px 8px;
    border-radius: 10px;
    white-space: nowrap;
  }

  .footer-fixed .btn {
    display: inline-flex;
    width: auto;
    margin-bottom: 0;
    justify-content: center;
    text-align: center;
  }

  .footer-fixed .btn.btn-lg {
    padding: 7px 10px;
    font-size: 0.9rem;
    border-radius: 10px;
    line-height: 1.05;
    padding-top: 7px;
    padding-bottom: 7px;
  }

  .footer-fixed .d-flex {
    flex-wrap: wrap;
  }

  /* Tighten spacing between action buttons on mobile */
  .footer-fixed .d-flex.justify-content-end {
    gap: 8px !important;
  }

  /* Reduce icon gap a bit (bootstrap .me-2) */
  .footer-fixed .btn.btn-lg .me-2 {
    margin-right: 0 !important;
  }

  .feedback-fix-card__head {
    flex-direction: column;
  }

  .feedback-workspace-card__header {
    flex-direction: column;
  }

  .feedback-workspace-card__actions {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 520px) {
  .footer-fixed .btn.btn-lg {
    padding: 6px 8px;
    font-size: 0.84rem;
    border-radius: 9px;
    line-height: 1.05;
    padding-top: 6px;
    padding-bottom: 6px;
  }

  .footer-fixed .btn.btn-lg .me-2 {
    margin-right: 0 !important;
  }

  .footer-fixed {
    --rf-footer-btn-gap: 0.38rem;
    --rf-footer-btn-px: 8px;
  }

  .footer-fixed ::v-deep .badge {
    font-size: 0.74rem;
    padding: 5px 7px;
    border-radius: 9px;
  }
}

/* =========================================================
   Research Form Theme (CSS only)
   - Do not change template/script structure or any functions
   ========================================================= */
.research-form {
  /* MFU-inspired red/gold theme */
  --rf-bg: #f7f2ea;
  --rf-surface: #ffffff;
  --rf-border: #eadfce;
  --rf-text: #1f2937;
  --rf-muted: #6b7280;
  --rf-accent: #8b1212; /* deep red */
  --rf-gold: #c59b3a;
  --rf-accent-ring: rgba(139, 18, 18, 0.18);

  background:
    radial-gradient(1100px 460px at 12% -10%, rgba(139, 18, 18, 0.14), transparent 62%),
    radial-gradient(980px 420px at 92% 4%, rgba(197, 155, 58, 0.14), transparent 58%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.00) 58%),
    repeating-linear-gradient(0deg, rgba(31, 41, 55, 0.014) 0, rgba(31, 41, 55, 0.014) 1px, transparent 1px, transparent 22px);
  color: var(--rf-text);
}

.research-form ::v-deep .card {
  background: var(--rf-surface);
  border: 1px solid var(--rf-border);
  border-radius: 14px;
  box-shadow: 0 14px 34px rgba(2, 6, 23, 0.08);
}

.research-form ::v-deep .card-header {
  background: transparent !important;
  border-bottom: 1px solid var(--rf-border);
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
}

.research-form ::v-deep .card-header:not(.text-white) h5,
.research-form ::v-deep .card-header:not(.text-white) h6,
.research-form ::v-deep .card-header:not(.text-white) strong {
  color: var(--rf-text);
  letter-spacing: 0.2px;
}

/* Main headings */
.research-form ::v-deep .section-title {
  background: transparent !important;
  border-left-color: var(--rf-accent) !important;
  color: var(--rf-text);
  border-radius: 10px;
}

/* Sub-headings and nested option blocks (formal, easy-to-scan) */
.research-form ::v-deep .sub-section-title {
  font-weight: 800;
  color: var(--rf-text);
  background: transparent !important;
  border: 1px solid var(--rf-border);
  border-radius: 12px;
  padding: 10px 12px;
  letter-spacing: 0.15px;
}

.research-form ::v-deep .sub-options {
  margin-left: 1.5rem;
  margin-top: 10px;
  background: var(--rf-surface);
  border: 1px solid var(--rf-border);
  border-left: none !important; /* no left color bar in sub blocks */
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 10px 22px rgba(2, 6, 23, 0.06);
}

/* Gold accents for small UI elements (not a left bar) */
.research-form ::v-deep .badge,
.research-form ::v-deep .cbadge,
.research-form ::v-deep .c-badge {
  border-radius: 999px;
}

.research-form ::v-deep .sub-options .form-check {
  margin-bottom: 12px;
  padding-left: 1.5rem;
}

.research-form ::v-deep .sub-options .form-check:last-child {
  margin-bottom: 0;
}

.research-form ::v-deep .text-muted {
  color: var(--rf-muted) !important;
}

.research-form ::v-deep label,
.research-form ::v-deep .form-check-label {
  color: var(--rf-text);
}

.research-form ::v-deep .form-control,
.research-form ::v-deep textarea.form-control,
.research-form ::v-deep select.form-control,
.research-form ::v-deep .custom-select {
  border: 1px solid var(--rf-border);
  border-radius: 12px;
  background: var(--rf-surface);
  color: var(--rf-text);
  transition: box-shadow 160ms ease, border-color 160ms ease;
}

.research-form ::v-deep .form-control:disabled,
.research-form ::v-deep textarea.form-control:disabled,
.research-form ::v-deep select.form-control:disabled,
.research-form ::v-deep .custom-select:disabled,
.research-form ::v-deep .form-control[readonly],
.research-form ::v-deep textarea.form-control[readonly],
.research-form ::v-deep input[readonly].form-control,
.research-form ::v-deep select[readonly].form-control {
  background: #eef2f7 !important;
  border-color: rgba(234, 223, 206, 0.95) !important;
  color: rgba(15, 23, 42, 0.78) !important;
  cursor: not-allowed;
  box-shadow: none !important;
}

.research-form .meeting-modal ::v-deep .input-icon__control[readonly],
.research-form .meeting-modal ::v-deep input.time-trigger[readonly].form-control {
  cursor: pointer !important;
}

.research-form .meeting-modal ::v-deep .input-icon__suffix {
  cursor: pointer;
}

.research-form ::v-deep .form-control:disabled::placeholder,
.research-form ::v-deep .form-control[readonly]::placeholder {
  color: rgba(100, 116, 139, 0.75);
}

.research-form ::v-deep .bg-light {
  background: #eef2f7 !important;
}

.research-form ::v-deep input:disabled,
.research-form ::v-deep textarea:disabled,
.research-form ::v-deep select:disabled {
  cursor: not-allowed;
}

.research-form ::v-deep .form-control:focus,
.research-form ::v-deep .custom-select:focus {
  border-color: rgba(139, 18, 18, 0.55);
  box-shadow: 0 0 0 4px var(--rf-accent-ring);
}

.research-form ::v-deep .form-control::placeholder {
  color: rgba(100, 116, 139, 0.88);
}

.research-form ::v-deep .table {
  background: var(--rf-surface);
  border-radius: 12px;
  overflow: hidden;
}

.research-form ::v-deep .table thead th {
  border-bottom: 1px solid var(--rf-border);
  font-weight: 800;
  letter-spacing: 0.25px;
}

.research-form ::v-deep .table thead:not(.bg-primary):not(.text-white) th {
  background: rgba(15, 23, 42, 0.035);
  color: var(--rf-text);
}

.research-form ::v-deep .table thead.bg-primary th,
.research-form ::v-deep .table thead.text-white th {
  color: #ffffff !important;
}

/* Keep complex tables readable */
.research-form ::v-deep .table td,
.research-form ::v-deep .table th {
  vertical-align: middle;
}

.research-form ::v-deep .table td.text-left,
.research-form ::v-deep .table th.text-left {
  text-align: left !important;
}

.research-form ::v-deep .table td,
.research-form ::v-deep .table th {
  border-top: 1px solid var(--rf-border);
}

.research-form ::v-deep .table tbody tr:hover {
  background: rgba(197, 155, 58, 0.10);
}

.research-form ::v-deep .alert {
  border-radius: 12px;
  border: 1px solid var(--rf-border);
}

/* TextEditor / Quill */
.research-form ::v-deep .ql-toolbar,
.research-form ::v-deep .ql-container {
  border-color: var(--rf-border) !important;
}

.research-form ::v-deep .ql-toolbar {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  background: rgba(15, 23, 42, 0.02);
}

.research-form ::v-deep .ql-container {
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  background: var(--rf-surface);
}

.research-form ::v-deep .ql-editor {
  color: var(--rf-text);
}

/* Remove any remaining "blue/primary" look inside Research Form */
.research-form ::v-deep a {
  color: var(--rf-accent);
}

.research-form ::v-deep a:hover {
  color: var(--rf-gold);
}

.research-form ::v-deep .text-primary {
  color: var(--rf-accent) !important;
}

.research-form ::v-deep .text-white {
  color: #ffffff !important;
}

.research-form ::v-deep .bg-primary {
  background-color: var(--rf-accent) !important;
}

.research-form ::v-deep .border-primary,
.research-form ::v-deep .border-info {
  border-color: var(--rf-accent) !important;
}

.research-form ::v-deep .border-left,
.research-form ::v-deep .border-right,
.research-form ::v-deep .border-top,
.research-form ::v-deep .border-bottom {
  border-color: var(--rf-border) !important;
}

.research-form ::v-deep .btn-primary,
.research-form ::v-deep .btn-info {
  background-color: var(--rf-accent) !important;
  border-color: var(--rf-accent) !important;
}

.research-form ::v-deep .btn-outline-primary,
.research-form ::v-deep .btn-outline-info {
  color: var(--rf-accent) !important;
  border-color: var(--rf-accent) !important;
}

.research-form ::v-deep .btn-outline-primary:hover,
.research-form ::v-deep .btn-outline-info:hover {
  background-color: var(--rf-accent) !important;
  border-color: var(--rf-accent) !important;
  color: #ffffff !important;
  box-shadow: 0 10px 18px rgba(2, 6, 23, 0.14) !important;
}

.research-form ::v-deep .spinner-border,
.research-form ::v-deep .c-spinner {
  color: var(--rf-accent) !important;
}

.research-form ::v-deep .c-callout-primary {
  border-left-color: var(--rf-accent) !important;
}

.chairman-checklist-readonly {
  border-color: rgba(197, 155, 58, 0.35) !important;
}

.chairman-review-card__badge {
  border-radius: 999px !important;
  padding: 4px 8px !important;
  font-weight: 600 !important;
  background: rgba(197, 155, 58, 0.14) !important;
  color: #7a4f00 !important;
  border: 1px solid rgba(197, 155, 58, 0.35) !important;
  font-size: 0.74rem !important;
}

.chairman-review-card__sections {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.chairman-review-card__section + .chairman-review-card__section {
  padding-top: 12px;
  border-top: 1px solid var(--rf-border);
}

.chairman-review-card__table {
  border: 1px solid var(--rf-border);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.6);
}

.chairman-review-card__table-head {
  display: grid;
  grid-template-columns: 40px 1fr 96px;
  gap: 12px;
  align-items: center;
  padding: 7px 9px;
  background: rgba(197, 155, 58, 0.10);
  border-bottom: 1px solid var(--rf-border);
  color: var(--rf-muted);
  font-size: 0.76rem;
  letter-spacing: 0.01em;
}

.chairman-review-card__th-no,
.chairman-review-card__th-result {
  text-align: center;
  font-weight: 600;
}

.chairman-review-card__row {
  display: grid;
  grid-template-columns: 40px 1fr 96px;
  gap: 12px;
  align-items: start;
  padding: 8px 9px;
  border-bottom: 1px solid var(--rf-border);
}

.chairman-review-card__row:last-child {
  border-bottom: 0;
}

.chairman-review-card__cell-no {
  text-align: center;
  font-weight: 700;
  color: rgba(31, 41, 55, 0.64);
}

.chairman-review-card__cell-label {
  line-height: 1.55;
  color: var(--rf-text);
  font-size: 0.88rem;
}

.chairman-review-card__cell-result {
  display: flex;
  justify-content: center;
  padding-top: 2px;
  align-items: center;
}

.chairman-review-card__result {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-weight: 600;
  font-size: 0.76rem;
  white-space: nowrap;
  letter-spacing: 0.01em;
  min-width: 76px;
  height: 28px;
}

.chairman-review-card__result-icon {
  font-size: 0.95rem;
}

.chairman-review-card__result.is-pass {
  background: rgba(25, 135, 84, 0.10);
  border-color: rgba(25, 135, 84, 0.25);
  color: #0f5132;
}

.chairman-review-card__result.is-fail {
  background: rgba(220, 53, 69, 0.10);
  border-color: rgba(220, 53, 69, 0.25);
  color: #842029;
}

@media (max-width: 720px) {
  .chairman-review-card__table-head,
  .chairman-review-card__row {
    grid-template-columns: 34px 1fr 84px;
    gap: 10px;
  }

  .chairman-review-card__cell-label {
    font-size: 0.86rem;
  }
}

/* Ensure child scoped styles cannot re-introduce blue focus rings */
.research-form ::v-deep .form-control:focus,
.research-form ::v-deep textarea.form-control:focus,
.research-form ::v-deep select.form-control:focus,
.research-form ::v-deep .custom-select:focus {
  border-color: rgba(139, 18, 18, 0.55) !important;
  box-shadow: 0 0 0 4px var(--rf-accent-ring) !important;
}

.research-form ::v-deep .multiselect__tags:focus-within {
  border-color: var(--rf-accent) !important;
  box-shadow: 0 0 0 3px var(--rf-accent-ring) !important;
}

.research-form ::v-deep .signature-canvas-container {
  border-color: var(--rf-gold) !important;
}

.research-form--dark {
  --rf-bg: #0f1724;
  --rf-surface: #1a2432;
  --rf-border: #2f3f52;
  --rf-text: #e8eef7;
  --rf-muted: #aab9ca;
  --rf-accent-ring: rgba(197, 155, 58, 0.22);

  background:
    radial-gradient(1100px 460px at 12% -10%, rgba(139, 18, 18, 0.16), transparent 62%),
    radial-gradient(980px 420px at 92% 4%, rgba(197, 155, 58, 0.12), transparent 58%),
    linear-gradient(180deg, rgba(10, 15, 24, 0.52), rgba(10, 15, 24, 0) 58%),
    repeating-linear-gradient(0deg, rgba(148, 163, 184, 0.03) 0, rgba(148, 163, 184, 0.03) 1px, transparent 1px, transparent 22px);
  box-shadow: 0 8px 30px rgba(2, 6, 23, 0.45);
}

.research-form--dark .admin-view-banner {
  background: rgba(30, 64, 104, 0.32) !important;
  border-left-color: #60a5fa !important;
  color: #b9d6fb !important;
}

.research-form--dark ::v-deep .review-summary-card {
  background: #202c3a !important;
  border-color: #334458 !important;
}

.research-form--dark .chairman-checklist-readonly {
  border-color: rgba(197, 155, 58, 0.22) !important;
}

.research-form--dark .chairman-review-card__badge {
  background: rgba(197, 155, 58, 0.16) !important;
  color: #f7d488 !important;
  border-color: rgba(197, 155, 58, 0.28) !important;
}

.research-form--dark .chairman-review-card__table {
  background: rgba(15, 23, 36, 0.35);
  border-color: #2f3f52;
}

.research-form--dark .chairman-review-card__table-head {
  background: rgba(197, 155, 58, 0.10);
  border-bottom-color: #2f3f52;
  color: #aab9ca;
}

.research-form--dark .chairman-review-card__row {
  border-bottom-color: #2f3f52;
}

.research-form--dark .chairman-review-card__section + .chairman-review-card__section {
  border-top-color: #2f3f52;
}

.research-form--dark .chairman-review-card__cell-no {
  color: rgba(226, 232, 240, 0.62);
}

.research-form--dark .chairman-review-card__cell-label {
  color: #e8eef7;
}

.research-form--dark .chairman-review-card__result.is-pass {
  background: rgba(34, 197, 94, 0.14);
  border-color: rgba(34, 197, 94, 0.28);
  color: #a4f2c3;
}

.research-form--dark .chairman-review-card__result.is-fail {
  background: rgba(248, 113, 113, 0.14);
  border-color: rgba(248, 113, 113, 0.28);
  color: #fecaca;
}

.research-form--dark .footer-fixed {
  background: rgba(16, 24, 36, 0.94);
  border-top-color: #2f3f52;
  box-shadow: 0 -8px 22px rgba(2, 6, 23, 0.5);
}

.research-form--dark .footer-fixed .save-indicator {
  background: #1f2d3c;
  border-color: #3c4d61;
  color: #d7e2ef;
}

.research-form--dark .footer-fixed .save-hint,
.research-form--dark .footer-fixed .text-muted,
.research-form--dark .footer-fixed .fw-bold.text-muted {
  color: #b2c1d1 !important;
}

.research-form--dark .footer-fixed .text-success.fw-bold {
  background-color: rgba(34, 197, 94, 0.2) !important;
  border: 1px solid rgba(74, 222, 128, 0.34) !important;
  color: #8be2ad !important;
}

.research-form--dark ::v-deep .card,
.research-form--dark ::v-deep .feedback-workspace,
.research-form--dark ::v-deep .feedback-workspace-card,
.research-form--dark ::v-deep .feedback-workspace-note,
.research-form--dark ::v-deep .feedback-inline-radio,
.research-form--dark ::v-deep .feedback-fix-card,
.research-form--dark ::v-deep .committee-selection-panel,
.research-form--dark .committee-user-row {
  background: #1a2432 !important;
  border-color: #2f3f52 !important;
}

.research-form--dark .committee-user-row.is-selected {
  background: #213145 !important;
  border-color: #3f5a75 !important;
}

.research-form--dark ::v-deep .card-header,
.research-form--dark ::v-deep .section-title,
.research-form--dark ::v-deep .sub-section-title {
  background: transparent !important;
  border-color: #2f3f52 !important;
}

.research-form--dark ::v-deep .card-header:not(.text-white) h5,
.research-form--dark ::v-deep .card-header:not(.text-white) h6,
.research-form--dark ::v-deep .card-header:not(.text-white) strong,
.research-form--dark ::v-deep .feedback-workspace-card__title,
.research-form--dark ::v-deep .feedback-workspace-note__body,
.research-form--dark ::v-deep .feedback-fix-card__section,
.research-form--dark ::v-deep label,
.research-form--dark ::v-deep .form-check-label,
.research-form--dark ::v-deep .font-weight-bold,
.research-form--dark ::v-deep h6 {
  color: #ecf3fb !important;
}

.research-form--dark ::v-deep .feedback-workspace-card__subtitle,
.research-form--dark ::v-deep .feedback-workspace-note__meta,
.research-form--dark ::v-deep .feedback-fix-card__meta,
.research-form--dark ::v-deep .feedback-fix-card__body,
.research-form--dark ::v-deep .feedback-workspace-card__status,
.research-form--dark ::v-deep .text-muted,
.research-form--dark ::v-deep .small,
.research-form--dark ::v-deep .form-label {
  color: #aab9ca !important;
}

.research-form--dark .admin-revision-link,
.research-form--dark ::v-deep .admin-revision-link {
  color: #fecaca !important;
}

.research-form--dark .admin-revision-link:hover,
.research-form--dark .admin-revision-link:focus,
.research-form--dark ::v-deep .admin-revision-link:hover,
.research-form--dark ::v-deep .admin-revision-link:focus {
  color: #fca5a5 !important;
}

.research-form--dark .revision-diff-summary-card,
.research-form--dark ::v-deep .revision-diff-summary-card {
  border-color: #3d4f64 !important;
}

.research-form--dark .revision-diff-item + .revision-diff-item,
.research-form--dark ::v-deep .revision-diff-item + .revision-diff-item {
  border-top-color: #3d4f64 !important;
}

.research-form--dark .revision-diff-item__link,
.research-form--dark ::v-deep .revision-diff-item__link {
  color: #fecaca !important;
}

.research-form--dark .revision-diff-item__link:hover,
.research-form--dark .revision-diff-item__link:focus,
.research-form--dark ::v-deep .revision-diff-item__link:hover,
.research-form--dark ::v-deep .revision-diff-item__link:focus {
  color: #fca5a5 !important;
}

.research-form--dark .revision-diff-box,
.research-form--dark ::v-deep .revision-diff-box {
  border-color: #3d4f64 !important;
  background: #223142 !important;
}

.research-form--dark .revision-diff-box--before,
.research-form--dark ::v-deep .revision-diff-box--before {
  border-color: #6b2f3a !important;
  background: rgba(127, 29, 29, 0.22) !important;
}

.research-form--dark .revision-diff-box--after,
.research-form--dark ::v-deep .revision-diff-box--after {
  border-color: #3f6b54 !important;
  background: rgba(6, 95, 70, 0.20) !important;
}

.research-form--dark .revision-diff-box__title,
.research-form--dark .revision-diff-box__body,
.research-form--dark ::v-deep .revision-diff-box__title,
.research-form--dark ::v-deep .revision-diff-box__body {
  color: #ecf3fb !important;
}

.research-form--dark ::v-deep .form-control,
.research-form--dark ::v-deep textarea.form-control,
.research-form--dark ::v-deep select.form-control,
.research-form--dark ::v-deep .custom-select,
.research-form--dark ::v-deep .multiselect__tags,
.research-form--dark ::v-deep .multiselect__content-wrapper {
  background: #223142 !important;
  color: #ecf3fb !important;
  border-color: #3d4f64 !important;
}

.research-form--dark ::v-deep .form-control::placeholder,
.research-form--dark ::v-deep textarea.form-control::placeholder,
.research-form--dark ::v-deep input::placeholder {
  color: #9caec2 !important;
}

.research-form--dark ::v-deep .form-control:disabled,
.research-form--dark ::v-deep textarea.form-control:disabled,
.research-form--dark ::v-deep select.form-control:disabled,
.research-form--dark ::v-deep .custom-select:disabled,
.research-form--dark ::v-deep .form-control[readonly],
.research-form--dark ::v-deep textarea.form-control[readonly] {
  background: #182433 !important;
  color: #aebfd1 !important;
  border-color: #2f3f52 !important;
}

.research-form--dark ::v-deep .form-control:focus,
.research-form--dark ::v-deep textarea.form-control:focus,
.research-form--dark ::v-deep select.form-control:focus,
.research-form--dark ::v-deep .custom-select:focus,
.research-form--dark ::v-deep .multiselect__tags:focus-within {
  border-color: rgba(197, 155, 58, 0.78) !important;
  box-shadow: 0 0 0 3px rgba(197, 155, 58, 0.22) !important;
}

.research-form--dark ::v-deep .table,
.research-form--dark ::v-deep .table tbody tr,
.research-form--dark ::v-deep .table td,
.research-form--dark ::v-deep .table th {
  background: #1a2432;
  color: #deebf8;
  border-color: #2f3f52 !important;
}

.research-form--dark ::v-deep .table thead:not(.bg-primary):not(.text-white) th {
  background: #223142;
  color: #eef4fc;
}

.research-form--dark ::v-deep .table tbody tr:hover {
  background: #263749;
}

.research-form--dark ::v-deep .alert {
  border-color: #3a4d63;
}

.research-form--dark ::v-deep .alert-warning {
  background: rgba(245, 158, 11, 0.18);
  color: #f9d48a;
}

.research-form--dark ::v-deep .alert-danger {
  background: rgba(239, 68, 68, 0.18);
  color: #fca5a5;
}

.research-form--dark ::v-deep .alert-success {
  background: rgba(34, 197, 94, 0.16);
  color: #9ae6b4;
}

.research-form--dark ::v-deep .ql-toolbar,
.research-form--dark ::v-deep .ql-container,
.research-form--dark ::v-deep .ql-editor,
.research-form--dark ::v-deep .ql-snow .ql-picker-options {
  background: #1d2a39 !important;
  border-color: #324357 !important;
  color: #e8eef7 !important;
}

.research-form--dark ::v-deep .ql-snow .ql-stroke {
  stroke: #c7d4e2 !important;
}

.research-form--dark ::v-deep .ql-snow .ql-fill {
  fill: #c7d4e2 !important;
}
</style>
