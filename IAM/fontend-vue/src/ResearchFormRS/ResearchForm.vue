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
          <h2 class="mb-4">แบบฟอร์มข้อมูลการวิจัย</h2>
          <div v-if="isAdminView" class="admin-view-banner"
            style="background:#e8f4ff;border-left:4px solid #1a73e8;padding:10px 16px;margin-bottom:16px;border-radius:4px;font-size:14px;color:#1a73e8">
            โหมดดูข้อมูล (Admin View) - ไม่สามารถแก้ไขได้
          </div>
        </div>
      </div>

      <!-- Research Team Form Component -->
      <ResearchTeamForm
        ref="researchTeamForm"
        @team-changed="syncResearchTeamData"
        :is-read-only="effectiveReadOnly"
        :current-status="currentStatus"
        :allow-auto-prefill="true"
        :revision-highlight-sections="adminRevisionResearchTeamSectionKeys"
      />

      <!-- Project Details Form Component -->
      <ProjectDetailsForm
        ref="projectDetailsForm"
        :is-read-only="effectiveReadOnly"
        :disable-project-title-section="shouldDisableProjectTitleSection"
        :revision-highlight-sections="adminRevisionProjectSectionKeys"
        @form-changed="syncProjectDetailsData"
        @budget-changed="handleBudgetAutoSave"
        @budget-attachment-upload="handleBudgetAttachmentUpload"
        @budget-attachment-open="handleBudgetAttachmentOpen"
        @budget-attachment-meta-change="handleBudgetAttachmentMetaChange"
        @research-standard-upload="handleResearchStandardUpload"
        @research-standard-open="handleResearchStandardOpen"
        @research-standard-remove="handleResearchStandardRemove"
      />

      <!-- File Management Component -->
      <FileManagement
        ref="fileManagement"
        :files="files"
        :is-read-only="effectiveReadOnly"
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
        :is-read-only="effectiveReadOnly"
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
                {{ revisionDiffSectionLabel(section.sectionKey, section.sectionLabel) }}
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
                  <div class="col-md-4 mb-1"><strong>ส่งผลประเมินแล้ว:</strong> {{ submittedReviewCount }}</div>
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
                    {{ (section.meta && section.meta.sectionLabel) || section.sectionKey }}
                  </button>
                </li>
              </ul>
            </CAlert>

            <div class="card mb-3">
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
                    {{ reopeningRejected ? 'กำลังเปิดให้แก้ไข...' : 'เปิดให้แก้ไขอีกครั้ง' }}
                  </CButton>
                  <CButton
                    color="primary"
                    :disabled="savingAdminDecision || !adminFinalDecision"
                    @click="saveAdminFinalDecision"
                  >
                    {{ savingAdminDecision ? 'กำลังบันทึก...' : 'บันทึกผลการตัดสินใจ' }}
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
                      <div class="col-12 mb-1"><strong>สรุปข้อเสนอแนะ:</strong> {{ review.summaryComment || '-' }}</div>
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
            โครงการนี้อยู่ในสถานะขอแก้ไขเพิ่มเติม คุณสามารถแก้ไขข้อมูล บันทึก และส่งแก้ไขอีกครั้งได้
          </CAlert>
          <CAlert v-else-if="isRejectedStatus" color="danger" show class="mb-3">
            โครงการนี้ไม่อนุมัติ และไม่สามารถส่งแก้ไขอีกครั้งใน workflow เดิมได้
          </CAlert>
          <CAlert v-else-if="isApprovedStatus" color="success" show class="mb-3">
            โครงการนี้ได้รับการอนุมัติแล้ว
          </CAlert>

          <div v-if="isRevisionRequested && pendingFeedbackSectionsForResubmit.length" class="alert alert-info mb-3">
            กรุณาส่งแก้ไขรายหัวข้อให้ครบก่อนส่งเอกสารแก้ไขอีกครั้ง
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
              {{ savingRevision ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข' }}
            </CButton>
            <CButton
              class="revision-action-btn revision-action-btn--submit"
              color="primary"
              :disabled="submittingRevision || !canResubmitRevision"
              @click="resubmitRevision"
            >
              {{ submittingRevision ? 'กำลังส่ง...' : 'ส่งแก้ไขอีกครั้ง' }}
            </CButton>
          </div>
        </div>
      </div>
      <!-- Footer with action buttons -->
      <div v-if="showFooterBar" class="footer-fixed" :style="{ left: isSidebarOpen ? '256px' : '0px' }">
        <div class="d-flex justify-content-between align-items-center w-100 px-2">

          <div class="d-flex align-items-center" style="gap: 12px;">
            <span class="me-2 fw-bold text-muted">สถานะ:</span>
            <StatusBadge :status="currentStatus" role="researcher" />
            <span
              v-if="isAutoSaving || isDraftSaving"
              class="save-indicator save-indicator--saving"
              title="Saving"
              aria-label="Saving"
            >
              <CSpinner size="sm" />
            </span>
            <span
              v-else-if="isDraftSaved"
              class="save-indicator save-indicator--saved"
              title="Saved"
              aria-label="Saved"
            >
              <i class="cil-check-circle"></i>
            </span>
            <span
              v-if="isAutoSaving || isDraftSaving"
              class="save-hint"
              title="บันทึกอัตโนมัติ"
            >
              กำลังเซฟ
            </span>
          </div>

          <div class="d-flex justify-content-end" style="gap: 12px;">
            <div v-if="showSubmitButton" class="px-3 py-2 rounded text-success fw-bold d-flex align-items-center"
              style="background-color: #d1e7dd; border: 1px solid #badbcc;">
              <i class="cil-check-circle me-2"></i>
              ยื่นโครงการวิจัยแล้ว
            </div>

            <button
              v-if="showDeleteDraftButton"
              type="button"
              class="btn btn-lg text-white"
              style="background-color: #dc2626; border-color: #dc2626;"
              @click="deleteDraftProposal"
            >
              <i class="cil-trash me-2"></i>
              ลบโครงการ
            </button>

            <button v-if="showDraftActions" type="button" class="btn btn-lg text-white"
              style="background-color: #8b1212; border-color: #8b1212;" @click="submitProject">
              <i class="cil-send me-2"></i>
              ยื่นโครงการ
            </button>

            <button
              v-if="false"
              type="button"
              class="btn btn-lg text-white"
              style="background-color: #dc2626; border-color: #dc2626;"
              @click="deleteDraftProposal"
            >
              <i class="cil-trash me-2"></i>
              ลบโครงการ
            </button>

            <button v-if="showExportPdfButton" type="button" class="btn btn-lg text-white"
              style="background-color: #b58522; border-color: #b58522;" :disabled="isExportingPdf" @click="exportProposalPdf">
              <i class="cil-file-pdf me-2"></i>
              {{ isExportingPdf ? 'กำลังสร้าง PDF...' : 'Export PDF' }}
            </button>
          </div>

        </div>
      </div>

      <!-- Admin footer actions (Detail view) -->
      <div v-if="showAdminFooterBar" class="footer-fixed admin-footer-fixed" :style="{ left: isSidebarOpen ? '256px' : '0px' }">
        <div class="d-flex justify-content-between align-items-center w-100 px-2 flex-wrap" style="gap: 12px;">
          <div class="d-flex align-items-center" style="gap: 12px;">
            <span class="fw-bold text-muted">การดำเนินการ:</span>
            <StatusBadge :status="currentStatus" role="admin" />
          </div>

          <div class="d-flex justify-content-end flex-wrap" style="gap: 10px;">
            <CButton color="warning" size="sm" @click="openAdminStatusModal">เปลี่ยนสถานะ</CButton>
            <CButton color="success" size="sm" @click="openAdminCommitteeModal">
              {{ adminHasAssignedCommittee ? 'เปลี่ยนคณะกรรมการ' : 'มอบหมายคณะกรรมการ' }}
            </CButton>
            <CButton color="info" size="sm" @click="openAdminMeetingManage">จัดการประชุม</CButton>
          </div>
        </div>
      </div>

      <CModal
        :show.sync="adminShowStatusModal"
        :close-on-backdrop="false"
        centered
        size="lg"
        scrollable
        title="เปลี่ยนสถานะโครงการ"
      >
        <template #body-wrapper>
          <div v-if="loadedProposal" class="status-modal-body" style="padding: 20px 24px 8px; max-height: calc(100vh - 220px); overflow-y: auto;">
            <div class="status-modal-proposal">
              <div class="status-modal-meta"><strong>รหัสโครงการ:</strong> {{ loadedProposal.proposalCode || '-' }}</div>
              <div class="status-modal-meta"><strong>ชื่อโครงการ:</strong> {{ loadedProposal.projectTitleTh || loadedProposal.projectTitleEn || '-' }}</div>
            </div>
            <div class="status-modal-current">
              <strong>สถานะปัจจุบัน:</strong>
              <CBadge :color="adminGetStatusBadgeColor(currentStatus)" class="ml-1">
                {{ adminGetStatusLabel(currentStatus) }}
              </CBadge>
            </div>

            <CSelect
              class="status-modal-select"
              label="เปลี่ยนสถานะเป็น"
              :value="adminNewStatus"
              :options="adminNextStatusOptions"
              @change="onAdminNewStatusChange"
            />

            <label class="status-modal-remark-label">หมายเหตุ / เหตุผล</label>
            <textarea
              v-model="adminStatusRemark"
              class="form-control"
              rows="3"
              placeholder="ระบุหมายเหตุเพิ่มเติม (ไม่บังคับ)"
            />
          </div>
        </template>

        <template #footer-wrapper>
          <div class="status-modal-footer d-flex justify-content-end w-100" style="padding: 12px 24px 20px;">
            <CButton color="secondary" class="mr-2" @click="closeAdminStatusModal">ยกเลิก</CButton>
            <CButton color="primary" :disabled="!adminNewStatus || adminSubmittingStatus" @click="confirmAdminChangeStatus">
              {{ adminSubmittingStatus ? 'กำลังบันทึก...' : 'ยืนยัน' }}
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
        title="มอบหมายคณะกรรมการ"
      >
        <template #body-wrapper>
          <div v-if="loadedProposal" class="committee-modal-body" style="padding: 20px 24px 8px; max-height: calc(100vh - 220px); overflow-y: auto;">
            <div class="committee-modal-proposal">
              <div class="committee-modal-meta"><strong>รหัสโครงการ:</strong> {{ loadedProposal.proposalCode || '-' }}</div>
              <div class="committee-modal-meta"><strong>ชื่อโครงการ:</strong> {{ loadedProposal.projectTitleTh || loadedProposal.projectTitleEn || '-' }}</div>
            </div>

            <div class="committee-selection-panel">
              <div class="mb-2"><strong>คณะกรรมการที่เลือก ({{ adminSelectedCommitteeIds.length }}/3)</strong></div>
              <div class="committee-selection-summary">
                <span v-if="adminSelectedCommitteeProfiles.length === 0" class="text-muted">ยังไม่ได้เลือกคณะกรรมการ</span>
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
                    ✕
                  </button>
                </span>
              </div>
            </div>

            <div class="committee-tools row align-items-end">
              <div class="col-md-6 mb-2">
                <label class="mb-1"><strong>ค้นหา</strong></label>
                <input v-model="adminCommitteeSearch" type="text" class="form-control" placeholder="ชื่อ / อีเมล / หน่วยงาน" />
              </div>
              <div class="col-md-6 mb-2">
                <label class="mb-1"><strong>ตัวกรอง</strong></label>
                <div class="d-flex flex-wrap" style="gap: 8px;">
                  <CButton
                    size="sm"
                    color="primary"
                    variant="outline"
                    :disabled="!adminHasRecommendedCommitteeUsers"
                    @click="setAdminCommitteeFilterMode('recommended')"
                  >
                    แนะนำ
                  </CButton>
                  <CButton
                    size="sm"
                    color="primary"
                    variant="outline"
                    @click="setAdminCommitteeFilterMode('all')"
                  >
                    ทั้งหมด
                  </CButton>
                  <CButton
                    size="sm"
                    color="primary"
                    variant="outline"
                    @click="setAdminCommitteeFilterMode('department')"
                  >
                    หน่วยงาน
                  </CButton>
                </div>
              </div>
            </div>

            <div v-if="adminCommitteeFilterMode === 'department'" class="mt-2">
              <CSelect
                label="เลือกหน่วยงาน"
                :value="adminSelectedCommitteeDepartment"
                :options="adminCommitteeDepartmentOptions"
                @change="onAdminCommitteeDepartmentChange"
              />
            </div>

            <div v-if="adminCommitteeUsersLoading" class="text-center py-3">
              <CSpinner size="sm" color="primary" />
              <span class="text-muted ml-2">กำลังโหลดรายชื่อกรรมการ...</span>
            </div>
            <CAlert v-else-if="adminCommitteeUsersError" color="warning" show>
              ไม่สามารถโหลดรายชื่อกรรมการได้: {{ adminCommitteeUsersError }}
            </CAlert>
            <div v-else class="committee-user-list mt-2">
              <div v-if="adminFilteredCommitteeUsers.length === 0" class="text-muted py-2">ไม่พบรายชื่อกรรมการ</div>
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
                    :disabled="!isAdminSelectedCommittee(u._id) && adminSelectedCommitteeIds.length >= 3"
                    @change="toggleAdminCommitteeSelection(u)"
                  />
                  <div>
                    <div class="font-weight-bold">{{ u.fullName || '-' }}</div>
                    <div class="text-muted" style="font-size: 0.85rem;">
                      <span v-if="u.email">{{ u.email }}</span>
                      <span v-if="u.department"> • {{ u.department }}</span>
                      <span v-if="u.isRecommended" class="badge badge-success ml-2">แนะนำ</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </template>

        <template #footer-wrapper>
          <div class="committee-modal-footer d-flex justify-content-end w-100" style="padding: 12px 24px 20px;">
            <CButton color="secondary" class="mr-2" @click="closeAdminCommitteeModal">ยกเลิก</CButton>
            <CButton color="success" :disabled="adminSubmittingCommittee || adminSelectedCommitteeIds.length === 0" @click="confirmAdminAssignCommittee">
              {{ adminSubmittingCommittee ? 'กำลังบันทึก...' : 'ยืนยัน' }}
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
        title="จัดการการประชุม"
      >
        <template #body-wrapper>
          <div class="meeting-form" style="padding: 20px 24px 8px; max-height: calc(100vh - 220px); overflow-y: auto;">
            <div class="mb-3">
              <div class="text-muted">โครงการ</div>
              <div class="font-weight-bold">
                {{ (loadedProposal && (loadedProposal.projectTitleTh || loadedProposal.projectTitleEn || loadedProposal.projectTitle)) || '-' }}
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">ชื่อการประชุม <span class="text-danger">*</span></label>
              <CInput v-model="adminMeetingForm.title" />
            </div>

            <div class="row">
              <div class="col-md-4 mb-3">
                <label class="form-label">วันที่ประชุม <span class="text-danger">*</span></label>
                <CInput type="date" v-model="adminMeetingForm.meetingDate" />
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">เวลาเริ่ม <span class="text-danger">*</span></label>
                <CInput type="time" v-model="adminMeetingForm.startTime" />
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">เวลาสิ้นสุด</label>
                <CInput type="time" v-model="adminMeetingForm.endTime" />
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">สถานที่</label>
              <CInput v-model="adminMeetingForm.location" />
            </div>

            <div class="mb-3">
              <label class="form-label">ลิงก์ประชุมออนไลน์</label>
              <CInput v-model="adminMeetingForm.videoLink" />
            </div>

            <div class="mb-3">
              <label class="form-label">วาระการประชุม</label>
              <textarea v-model="adminMeetingForm.agenda" class="form-control" rows="4" />
            </div>
          </div>
        </template>

        <template #footer-wrapper>
          <div class="d-flex justify-content-end w-100" style="padding: 12px 24px 20px;">
            <CButton color="secondary" class="mr-2" @click="closeAdminMeetingPopup">ปิด</CButton>
            <CButton
              color="primary"
              :disabled="adminMeetingSubmitting || !adminMeetingForm.title || !adminMeetingForm.meetingDate || !adminMeetingForm.startTime"
              @click="submitAdminMeeting"
            >
              {{ adminMeetingSubmitting ? 'กำลังบันทึก...' : 'บันทึก' }}
            </CButton>
          </div>
        </template>
      </CModal>

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
import ReportView from './Report.vue'
import { COMMITTEE_SECTION_FEEDBACK_MAP, getCommitteeFeedbackMeta } from '@/ResearchFormRS/constants/committeeFeedback'
import Swal from 'sweetalert2'
import Service, { instance as axios } from '@/service/api'

const ACTIVE_DRAFT_STORAGE_KEY = 'research_form_active_draft_id'
const FEEDBACK_SECTION_PROGRESS_STORAGE_PREFIX = 'research_form_feedback_section_progress'
const FEEDBACK_SECTION_BASELINE_STORAGE_PREFIX = 'research_form_feedback_section_baseline'

const ADMIN_ALLOWED_TRANSITIONS = {
  submitted: ['faculty_review_pending'],
  faculty_approved: ['office_received'],
  office_received: ['document_checking'],
  document_checking: ['assigned_to_committee', 'revision_requested'],
  under_review: ['meeting_completed'],
  meeting_completed: ['approved', 'rejected', 'revision_requested'],
  revision_requested: ['resubmitted'],
  resubmitted: ['second_round_review'],
  second_round_review: ['approved', 'rejected', 'revision_requested'],
  approved: ['announced'],
  rejected: ['announced']
}

const ADMIN_STATUS_LABELS = {
  draft: 'แบบร่าง',
  submitted: 'ยื่นแล้ว',
  faculty_review_pending: 'รอประธานพิจารณา',
  faculty_approved: 'ประธานอนุมัติ',
  office_received: 'ส่วนบริหารรับแล้ว',
  document_checking: 'ตรวจสอบเอกสาร',
  assigned_to_committee: 'มอบหมายกรรมการแล้ว',
  under_review: 'กำลังพิจารณา',
  meeting_completed: 'ประชุมเสร็จแล้ว',
  revision_requested: 'ขอแก้ไข',
  resubmitted: 'ส่งแก้ไขแล้ว',
  second_round_review: 'พิจารณารอบ 2',
  approved: 'อนุมัติ',
  rejected: 'ปฏิเสธ',
  announced: 'ประกาศผลแล้ว'
}

const ADMIN_STATUS_COLORS = {
  draft: 'secondary',
  submitted: 'info',
  faculty_review_pending: 'warning',
  faculty_approved: 'primary',
  office_received: 'primary',
  document_checking: 'warning',
  assigned_to_committee: 'info',
  under_review: 'danger',
  meeting_completed: 'primary',
  revision_requested: 'danger',
  resubmitted: 'info',
  second_round_review: 'warning',
  approved: 'success',
  rejected: 'danger',
  announced: 'primary'
}

export default {
  name: 'ResearchForm',
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
    ReportView
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
      adminCommitteeFilterMode: 'all',
      adminSelectedCommitteeDepartment: '',
      adminCommitteeDepartments: [],
      adminProposalDepartmentHint: '',

      adminShowMeetingPopup: false,
      adminMeetingSubmitting: false,
      adminMeetingForm: {
        title: '',
        meetingDate: '',
        startTime: '',
        endTime: '',
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
    if (typeof window !== 'undefined' && window.removeEventListener && this._rfResizeHandler) {
      window.removeEventListener('resize', this._rfResizeHandler)
      this._rfResizeHandler = null
    }
  },
  computed: {
    isDarkTheme () {
      return Boolean(this.$store && this.$store.state && this.$store.state.darkMode)
    },

    effectiveReadOnly () {
      return Boolean(this.readOnly || this.isReadOnly)
    },
    showAdminFooterBar () {
      return Boolean(this.isAdminView && this.viewProposalId)
    },
    isAdminRevisionSubmissionView () {
      if (!this.isAdminView) return false
      return String(this.currentStatus || '').trim().toLowerCase() === 'resubmitted'
    },
    adminHasAssignedCommittee () {
      return Array.isArray(this.loadedProposal && this.loadedProposal.committeeIds) && this.loadedProposal.committeeIds.length > 0
    },
    adminNextStatusOptions () {
      const current = String(this.currentStatus || '').trim()
      const statuses = ADMIN_ALLOWED_TRANSITIONS[current] || []
      if (!statuses.length) return [{ value: '', label: 'ไม่มีสถานะถัดไปที่อนุญาต' }]
      return [{ value: '', label: 'เลือกสถานะ' }, ...statuses.map(s => ({ value: s, label: this.adminGetStatusLabel(s) }))]
    },
    adminFilteredCommitteeUsers () {
      let scopedUsers = this.adminCommitteeUsers || []

      if (this.adminCommitteeFilterMode === 'recommended') {
        scopedUsers = scopedUsers.filter(u => Boolean(u && u.isRecommended))
      } else if (this.adminCommitteeFilterMode === 'department') {
        const selected = String(this.adminSelectedCommitteeDepartment || '').trim().toLowerCase()
        if (selected) {
          scopedUsers = scopedUsers.filter(u => String(u && u.department ? u.department : '').trim().toLowerCase() === selected)
        }
      }

      const q = String(this.adminCommitteeSearch || '').trim().toLowerCase()
      if (!q) return scopedUsers
      return scopedUsers.filter(u => {
        const text = [u.fullName, u.email, u.department].filter(Boolean).join(' ').toLowerCase()
        return text.includes(q)
      })
    },
    adminCommitteeDepartmentOptions () {
      const options = [{ value: '', label: 'ทุกหน่วยงาน' }]
      ;(this.adminCommitteeDepartments || []).forEach(dep => {
        if (dep) options.push({ value: dep, label: dep })
      })
      return options
    },
    adminHasRecommendedCommitteeUsers () {
      return (this.adminCommitteeUsers || []).some(u => Boolean(u && u.isRecommended))
    },
    adminSelectedCommitteeProfiles () {
      const byId = new Map((this.adminCommitteeUsers || []).map(u => [String(u._id), u]))
      return (this.adminSelectedCommitteeIds || [])
        .map(id => byId.get(String(id)))
        .filter(Boolean)
    },
    shouldDisableProjectTitleSection () {
      return String(this.currentStatus || '').toLowerCase() !== 'draft'
    },
    groupedReviews () {
      const groups = {}
      ;(this.proposalReviews || []).forEach(r => {
        const key = r && r.roundNo ? r.roundNo : 1
        if (!groups[key]) groups[key] = []
        groups[key].push(r)
      })
      return Object.keys(groups)
        .map(k => ({ roundNo: Number(k), reviews: groups[k] }))
        .sort((a, b) => a.roundNo - b.roundNo)
    },
    submittedReviews () {
      return (this.proposalReviews || []).filter(r => r && r.reviewStatus === 'submitted')
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
      return Math.max(this.assignedCommitteeCount - this.submittedReviewCount, 0)
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
      return rows.filter(r => r && r.reviewStatus === 'submitted')
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
      return [
        { value: '', label: 'เลือกผลการตัดสินใจ' },
        { value: 'revision_requested', label: 'ขอแก้ไขเพิ่มเติม' },
        { value: 'approved', label: 'อนุมัติ' },
        { value: 'rejected', label: 'ไม่อนุมัติ' }
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
    }
  },
  watch: {
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
            if (this.isRevisionRequested) {
              await this.scrollToFeedbackIfNeeded({ behavior: 'auto' })
              await this.fetchUserFeedback(newId)
              await this.scrollToFeedbackIfNeeded()
            }
          }
        }
      }
    }
  },
  methods: {
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
      return ADMIN_STATUS_COLORS[status] || 'secondary'
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
      this.adminSubmittingStatus = true
      try {
        await Service.proposal.changeStatus(this.viewProposalId, {
          toStatus: this.adminNewStatus,
          remark: this.adminStatusRemark || ''
        })
        await this.loadProposalById(this.viewProposalId)
        this.adminShowStatusModal = false
        await Swal.fire({ icon: 'success', title: 'เปลี่ยนสถานะสำเร็จ', timer: 1500, showConfirmButton: false })
      } catch (err) {
        await Swal.fire('เปลี่ยนสถานะไม่สำเร็จ', (err && err.response && err.response.data && err.response.data.message) || 'ลองใหม่อีกครั้ง', 'error')
      } finally {
        this.adminSubmittingStatus = false
      }
    },
    openAdminCommitteeModal () {
      if (!this.isAdminView || !this.viewProposalId) return
      const ids = (this.loadedProposal && Array.isArray(this.loadedProposal.committeeIds)) ? this.loadedProposal.committeeIds : []
      this.adminSelectedCommitteeIds = ids.map(String).slice(0, 3)
      this.adminCommitteeSearch = ''
      this.adminSelectedCommitteeDepartment = ''
      this.adminShowCommitteeModal = true
      this.fetchAdminCommitteeUsers()
    },
    closeAdminCommitteeModal () {
      this.adminShowCommitteeModal = false
      this.adminCommitteeSearch = ''
      this.adminSelectedCommitteeDepartment = ''
      this.adminSelectedCommitteeIds = []
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
        if (current.length >= 3) return
        current.push(key)
      }
      this.adminSelectedCommitteeIds = current
    },
    removeAdminSelectedCommittee (id) {
      const key = String(id)
      this.adminSelectedCommitteeIds = (this.adminSelectedCommitteeIds || []).map(String).filter(x => x !== key)
    },
    setAdminCommitteeFilterMode (mode) {
      this.adminCommitteeFilterMode = mode
      if (mode === 'department' && !this.adminSelectedCommitteeDepartment) {
        this.adminSelectedCommitteeDepartment = this.adminProposalDepartmentHint || ''
      }
    },
    onAdminCommitteeDepartmentChange (val) {
      this.adminSelectedCommitteeDepartment = this.adminGetSelectValue(val)
      this.adminCommitteeFilterMode = this.adminSelectedCommitteeDepartment ? 'department' : 'all'
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

        this.adminCommitteeDepartments = []
        this.adminProposalDepartmentHint = ''

        if (payload && payload.data && !Array.isArray(payload.data)) {
          const wrapped = payload.data
          this.adminCommitteeUsers = Array.isArray(wrapped.items) ? wrapped.items : []
          this.adminCommitteeDepartments = Array.isArray(wrapped.departments) ? wrapped.departments : []
          this.adminProposalDepartmentHint = String(wrapped.proposalDepartment || '').trim()
        }

        if (!this.adminCommitteeDepartments.length) {
          const dedup = Array.from(new Set((this.adminCommitteeUsers || []).map(u => String(u && u.department ? u.department : '').trim()).filter(Boolean)))
          this.adminCommitteeDepartments = dedup.sort((a, b) => a.localeCompare(b, 'th'))
        }

        if (this.adminHasRecommendedCommitteeUsers) {
          this.adminCommitteeFilterMode = 'recommended'
        } else {
          this.adminCommitteeFilterMode = 'all'
        }
        this.adminSelectedCommitteeDepartment = this.adminProposalDepartmentHint || ''
      } catch (err) {
        this.adminCommitteeUsers = []
        this.adminCommitteeDepartments = []
        this.adminProposalDepartmentHint = ''
        this.adminCommitteeFilterMode = 'all'
        this.adminSelectedCommitteeDepartment = ''
        this.adminCommitteeUsersError = (err && err.response && err.response.data && err.response.data.message)
          || err.message
          || 'Unknown error'
      } finally {
        this.adminCommitteeUsersLoading = false
      }
    },
    async confirmAdminAssignCommittee () {
      if (!this.isAdminView || !this.viewProposalId) return
      if (!this.adminSelectedCommitteeIds.length) {
        await Swal.fire('กรุณาเลือกคณะกรรมการ', 'เลือกอย่างน้อย 1 คน (สูงสุด 3 คน)', 'warning')
        return
      }
      if (this.adminSelectedCommitteeIds.length > 3) {
        await Swal.fire('เลือกได้สูงสุด 3 คน', '', 'warning')
        return
      }
      this.adminSubmittingCommittee = true
      try {
        const committeeIds = (this.adminSelectedCommitteeIds || []).map(String)
        await Service.proposal.assignCommittee(this.viewProposalId, { committeeIds })
        await this.loadProposalById(this.viewProposalId)
        this.adminShowCommitteeModal = false
        await Swal.fire({ icon: 'success', title: 'มอบหมายคณะกรรมการสำเร็จ', timer: 1500, showConfirmButton: false })
      } catch (err) {
        await Swal.fire('ไม่สำเร็จ', (err && err.response && err.response.data && err.response.data.message) || 'ลองใหม่อีกครั้ง', 'error')
      } finally {
        this.adminSubmittingCommittee = false
      }
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
        location: '',
        videoLink: '',
        agenda: projectTitle ? `โครงการ: ${projectTitle}` : '',
        status: 'scheduled'
      }
      this.adminShowMeetingPopup = true
    },
    closeAdminMeetingPopup () {
      this.adminShowMeetingPopup = false
    },
    async submitAdminMeeting () {
      if (!this.isAdminView || !this.viewProposalId) return
      if (!this.adminMeetingForm.title || !this.adminMeetingForm.meetingDate || !this.adminMeetingForm.startTime) return
      this.adminMeetingSubmitting = true
      try {
        const body = {
          title: String(this.adminMeetingForm.title || '').trim(),
          meetingDate: this.adminMeetingForm.meetingDate,
          startTime: this.adminMeetingForm.startTime,
          endTime: this.adminMeetingForm.endTime || '',
          location: this.adminMeetingForm.location || '',
          videoLink: this.adminMeetingForm.videoLink || '',
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
      if (status === 'revision_requested') return 'ขอแก้ไขเพิ่มเติม'
      if (status === 'approved') return 'อนุมัติ'
      if (status === 'rejected') return 'ไม่อนุมัติ'
      if (status === 'submitted') return 'ยื่นแล้ว'
      return status || '-'
    },
    onAdminFinalDecisionChange (val) {
      this.adminFinalDecision = val && val.target ? val.target.value : val
    },
    async saveAdminFinalDecision () {
      if (!this.isAdminView || !this.viewProposalId || !this.adminFinalDecision) return

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
    transferLevelPreview (value) {
      if (value === 'national-international') return 'ระดับภูมิภาค/ประเทศ/นานาชาติ'
      if (value === 'community-provincial') return 'ระดับกลุ่มอาชีพ/ชุมชน/จังหวัด'
      if (value === 'none') return 'ไม่มีการถ่ายทอดสู่สังคม'
      return '-'
    },
    hasWorkPlanDraftContent (value) {
      const rows = Array.isArray(value) ? value : []
      if (!rows.length) return false
      return rows.some((row) => {
        if (row === null || row === undefined) return false
        if (typeof row !== 'object') return String(row).trim().length > 0
        return Object.values(row).some((cell) => {
          if (Array.isArray(cell)) {
            return cell.some(entry => String(entry || '').trim().length > 0)
          }
          if (cell && typeof cell === 'object') {
            return Object.values(cell).some(entry => String(entry || '').trim().length > 0)
          }
          return String(cell || '').trim().length > 0
        })
      })
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
        const requiresSubType = ['new-researcher', 'researcher-development', 'industry-extension'].includes(strategicDraft.fundingType)
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
        if (!outcomesDraft.selectedOutcome) {
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
      const normalizedBudget = form && form.budget && typeof form.budget === 'object' && Object.keys(form.budget).length
        ? form.budget
        : (existingSnapshot.budget || {})
      const normalizedResearchStandard = form && form.researchStandard && typeof form.researchStandard === 'object' && Object.keys(form.researchStandard).length
        ? form.researchStandard
        : (existingSnapshot.researchStandard || {})

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
        ? this.files.filter(f => f && !f._pending)
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
      if (this.effectiveReadOnly) return
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
      this.files = Array.isArray(this.files)
        ? this.files.filter(item => String(item && item.fileId) !== String(fileId))
        : []
    },
    async handleBudgetAttachmentUpload ({ categoryName, itemId, file }) {
      if (this.effectiveReadOnly || !itemId || !file) return

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
    async handleBudgetAttachmentOpen ({ file }) {
      if (!file) return
      await this.openFile(file)
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
      if (this.effectiveReadOnly || !slotKey || !file) return

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
      if (this.effectiveReadOnly || !slotKey || !file || !this.viewProposalId) return

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

    async removeFile(index) {
      const item = Array.isArray(this.files) ? this.files[index] : null
      if (!item) return

      // Remove placeholders only from UI
      if (item._pending) {
        this.files.splice(index, 1)
        this.markAsEdited()
        return
      }

      if (this.viewProposalId && item.fileId) {
        try {
          await Service.proposal.deleteFormFile(this.viewProposalId, item.fileId)
        } catch (e) {
          // ignore and still remove from UI
        }
      }

      this.files.splice(index, 1)
      this.markAsEdited()
    },

    async openFile(item) {
      if (!item || !this.viewProposalId || !item.fileId) return

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
        const res = await Service.proposal.downloadFormFile(this.viewProposalId, item.fileId)
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

      const result = await this.showAlert({
        icon: 'warning',
        title: 'ยืนยันการลบโครงการ',
        text: 'หากลบแล้วจะไม่สามารถกู้คืนข้อมูลได้',
        showCancelButton: true,
        confirmButtonText: 'ลบโครงการ',
        cancelButtonText: 'ยกเลิก'
      })
      if (!result || !result.isConfirmed) return

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

        const nonEditableStatuses = [
          'submitted', 'faculty_review_pending', 'faculty_approved',
          'office_received', 'document_checking', 'assigned_to_committee',
          'under_review', 'meeting_completed', 'resubmitted', 'second_round_review',
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
    canAutoSave () {
      if (this.suppressAutoSave) return false
      if (this.isAdminView) return false
      if (this.effectiveReadOnly) return false
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

    async submitProject() {
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

      this.showSubmitButton = true;
      this.currentStatus = 'submitted';
      this.isReadOnly = true;
      try {
        const payload = this.normalizeApiPayload()
        // Avoid creating a duplicate project: if draft already exists, update + submit the same record.
        if (this.viewProposalId) {
          await Service.proposal.updateDraft(this.viewProposalId, payload)
          await this.flushPendingFormFiles()
          await Service.proposal.submit(this.viewProposalId)
        } else {
          const createRes = await Service.proposal.create(payload)
          const created = createRes && createRes.data && createRes.data.data ? createRes.data.data : null
          const proposalId = created && (created._id || created.id)

          if (proposalId) {
            this.viewProposalId = proposalId
            this.syncRouteProposalId(proposalId)
            await this.flushPendingFormFiles()
            await Service.proposal.submit(proposalId)
          }
        }

        this.setStoredDraftId('')
        await this.showAlert({
          title: 'สำเร็จ!',
          text: 'ยื่นโครงการเรียบร้อยแล้ว',
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

      // 3) Extra rule: research standard selection (from ProjectDetailsForm.submitForm)
      const form = this.$refs.projectDetailsForm && typeof this.$refs.projectDetailsForm.getFormData === 'function'
        ? this.$refs.projectDetailsForm.getFormData()
        : null
      const std = form && form.researchStandard ? form.researchStandard : null
      if (std && std.mainType === 'human_animal' && !std.isHuman && !std.isAnimal) {
        return { ok: false, message: 'กรุณาระบุมาตรฐานการวิจัยให้ครบถ้วน (เลือก มนุษย์ หรือ สัตว์ทดลอง อย่างน้อย 1 รายการ)' }
      }

      // 4) Special rule: section 17 budget must satisfy submission criteria
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
      const map = {
        'science-technology': 'ด้านวิทยาศาสตร์และเทคโนโลยี',
        'health-science': 'ด้านวิทยาศาสตร์สุขภาพ',
        'social-humanities': 'ด้านสังคมศาสตร์และมนุษยศาสตร์'
      }
      return map[researchType] || researchType || '-'
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

.footer-fixed .save-indicator .spinner-border {
  width: 14px;
  height: 14px;
  border-width: 0.14em;
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
  right: -260mm;
  width: 210mm;
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
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.02), rgba(15, 23, 42, 0.00));
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

/* Blue bar only for main headings */
.research-form ::v-deep .section-title {
  background: linear-gradient(180deg, rgba(197, 155, 58, 0.10), rgba(15, 23, 42, 0.02));
  border-left-color: var(--rf-accent) !important;
  color: var(--rf-text);
  border-radius: 10px;
}

/* Sub-headings and nested option blocks (formal, easy-to-scan) */
.research-form ::v-deep .sub-section-title {
  font-weight: 800;
  color: var(--rf-text);
  background: rgba(15, 23, 42, 0.035);
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

.research-form ::v-deep .badge-primary {
  background-color: var(--rf-accent) !important;
}

.research-form ::v-deep .spinner-border,
.research-form ::v-deep .c-spinner {
  color: var(--rf-accent) !important;
}

.research-form ::v-deep .c-callout-primary {
  border-left-color: var(--rf-accent) !important;
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
  background: linear-gradient(180deg, rgba(148, 163, 184, 0.14), rgba(15, 23, 42, 0.06));
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


