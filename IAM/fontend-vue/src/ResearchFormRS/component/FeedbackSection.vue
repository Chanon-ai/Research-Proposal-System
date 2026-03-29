<template>
  <div class="card mt-3 mb-5">
        <div class="card-header">
          <strong>ผลการพิจารณาและข้อเสนอแนะ</strong>
        </div>
        <div class="card-body">
          <div v-if="feedbackLoading" class="text-center py-3">
            <CSpinner size="sm" color="primary" />
            <span class="text-muted ml-2">กำลังโหลดข้อเสนอแนะ...</span>
          </div>

          <CAlert v-else-if="feedbackError" color="warning" show>
            ไม่สามารถโหลดข้อเสนอแนะได้: {{ feedbackError }}
          </CAlert>

          <div v-else>
            <div class="card mb-3 review-summary-card" style="background: #f8fafc;">
              <div class="card-body">
                <h6 class="mb-3">ข้อเสนอแนะสำหรับการแก้ไข</h6>
                <div class="row">
                  <div class="col-md-6 mb-1"><strong>ผลการตัดสินใจล่าสุด:</strong> {{ decisionStatusLabel(latestDecisionStatus) }}</div>
                  <div class="col-md-6 mb-1"><strong>รอบการพิจารณา:</strong> {{ latestDecisionRound || (userFeedback && userFeedback.currentRound) || '-' }}</div>
                  <div class="col-12 mb-1"><strong>หมายเหตุจากผู้พิจารณา:</strong> {{ latestDecisionRemark || '-' }}</div>
                </div>
              </div>
            </div>

            <div v-if="feedbackEditableSections.length" class="feedback-workspace card mb-3">
              <div class="card-body">
                <h6 class="mb-3">หัวข้อที่ต้องแก้ไข</h6>
                <div
                  v-for="section in feedbackEditableSections"
                  :key="section.sectionKey"
                  class="feedback-workspace-card"
                >
                  <div class="feedback-workspace-card__header">
                    <div>
                      <div class="feedback-workspace-card__title">{{ section.meta.sectionLabel }}</div>
                      <div class="feedback-workspace-card__subtitle">{{ section.meta.rubricLabel }}</div>
                    </div>
                    <div class="feedback-workspace-card__actions">
                      <span v-if="isFeedbackSectionSubmitted(section.sectionKey)" class="feedback-workspace-card__status">
                        ส่งแก้ไขแล้ว{{ feedbackSectionSubmittedAt(section.sectionKey) ? ` • ${formatReviewDateTime(feedbackSectionSubmittedAt(section.sectionKey))}` : '' }}
                      </span>
                      <CButton
                        v-if="isFeedbackSectionSubmitted(section.sectionKey)"
                        color="secondary"
                        size="sm"
                        variant="outline"
                        @click="toggleFeedbackSectionCard(section.sectionKey)"
                      >
                        <CIcon name="cil-chevron-left" class="mr-1" /> {{ isFeedbackSectionCollapsed(section.sectionKey) ? 'กางดู' : 'ยุบการ์ด' }}
                      </CButton>
                    </div>
                  </div>

                  <div v-if="!isFeedbackSectionCollapsed(section.sectionKey)" class="feedback-workspace-notes">
                    <div
                      v-for="note in section.notes"
                      :key="note.id"
                      class="feedback-workspace-note"
                    >
                      <div class="feedback-workspace-note__meta">
                        <strong>{{ note.reviewerName }}</strong>
                        <span v-if="note.score !== null"> | คะแนน {{ note.score }}/2</span>
                        <span v-if="note.submittedAt"> | {{ formatReviewDateTime(note.submittedAt) }}</span>
                      </div>
                      <div class="feedback-workspace-note__body">{{ note.commentText || '-' }}</div>
                    </div>
                  </div>

                  <div v-if="!isFeedbackSectionCollapsed(section.sectionKey)" class="feedback-workspace-editor">
                    <template v-if="section.sectionKey === 'problem_significance' && !isFeedbackSectionSubmitted(section.sectionKey)">
                      <TextEditor
                        :model-value="feedbackSectionDraft(section.sectionKey)"
                        :is-read-only="effectiveReadOnly"
                        @update:modelValue="setFeedbackSectionDraft(section.sectionKey, $event)"
                      />
                    </template>
                    <template v-else-if="section.sectionKey === 'problem_significance'">
                      <TextEditor :model-value="feedbackSectionSnapshot(section.sectionKey)" :is-read-only="true" />
                    </template>
                    <template v-else-if="section.sectionKey === 'objectives' && !isFeedbackSectionSubmitted(section.sectionKey)">
                      <TextEditor
                        :model-value="feedbackSectionDraft(section.sectionKey)"
                        :is-read-only="effectiveReadOnly"
                        @update:modelValue="setFeedbackSectionDraft(section.sectionKey, $event)"
                      />
                    </template>
                    <template v-else-if="section.sectionKey === 'objectives'">
                      <TextEditor :model-value="feedbackSectionSnapshot(section.sectionKey)" :is-read-only="true" />
                    </template>
                    <template v-else-if="section.sectionKey === 'literature_review' && !isFeedbackSectionSubmitted(section.sectionKey)">
                      <TextEditor
                        :model-value="feedbackSectionDraft(section.sectionKey)"
                        :is-read-only="effectiveReadOnly"
                        @update:modelValue="setFeedbackSectionDraft(section.sectionKey, $event)"
                      />
                    </template>
                    <template v-else-if="section.sectionKey === 'literature_review'">
                      <TextEditor :model-value="feedbackSectionSnapshot(section.sectionKey)" :is-read-only="true" />
                    </template>
                    <template v-else-if="section.sectionKey === 'research_methodology' && !isFeedbackSectionSubmitted(section.sectionKey)">
                      <TextEditor
                        :model-value="feedbackSectionDraft(section.sectionKey)"
                        :is-read-only="effectiveReadOnly"
                        @update:modelValue="setFeedbackSectionDraft(section.sectionKey, $event)"
                      />
                    </template>
                    <template v-else-if="section.sectionKey === 'research_methodology'">
                      <TextEditor :model-value="feedbackSectionSnapshot(section.sectionKey)" :is-read-only="true" />
                    </template>
                    <template v-else-if="section.sectionKey === 'work_plan' && !isFeedbackSectionSubmitted(section.sectionKey)">
                      <Section12
                        :model-value="feedbackSectionDraft(section.sectionKey)"
                        :is-read-only="effectiveReadOnly"
                        @update:modelValue="setFeedbackSectionDraft(section.sectionKey, $event)"
                      />
                    </template>
                    <template v-else-if="section.sectionKey === 'work_plan'">
                      <Section12 :model-value="feedbackSectionSnapshot(section.sectionKey)" :is-read-only="true" />
                    </template>
                    <template v-else-if="section.sectionKey === 'budget' && !isFeedbackSectionSubmitted(section.sectionKey)">
                      <BudgetSectionDemo
                        :model-value="feedbackSectionDraft(section.sectionKey)"
                        :is-read-only="effectiveReadOnly"
                        :funding-type="feedbackStrategicFundingType('strategic_alignment')"
                        :reset-token="feedbackStrategicFundingType('strategic_alignment')"
                        @update:modelValue="setFeedbackSectionDraft(section.sectionKey, $event)"
                      />
                    </template>
                    <template v-else-if="section.sectionKey === 'budget'">
                      <BudgetSectionDemo
                        :model-value="feedbackSectionSnapshot(section.sectionKey)"
                        :is-read-only="true"
                        :funding-type="feedbackStrategicFundingType('strategic_alignment')"
                      />
                    </template>
                    <template v-else-if="section.sectionKey === 'integration' && !isFeedbackSectionSubmitted(section.sectionKey)">
                      <TextEditor
                        :model-value="feedbackSectionDraft(section.sectionKey)"
                        :is-read-only="effectiveReadOnly"
                        @update:modelValue="setFeedbackSectionDraft(section.sectionKey, $event)"
                      />
                    </template>
                    <template v-else-if="section.sectionKey === 'integration'">
                      <TextEditor :model-value="feedbackSectionSnapshot(section.sectionKey)" :is-read-only="true" />
                    </template>
                    <template v-else-if="section.sectionKey === 'strategic_alignment'">
                      <div class="funding-options">
                        <div class="form-check mb-3">
                          <input
                            :id="`feedback-${section.sectionKey}-fund1`"
                            :checked="feedbackStrategicFundingType(section.sectionKey) === 'new-researcher'"
                            type="radio"
                            class="form-check-input"
                            value="new-researcher"
                            :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                            @change="setFeedbackStrategicFundingType(section.sectionKey, 'new-researcher')"
                          >
                          <label
                            class="form-check-label"
                            :for="`feedback-${section.sectionKey}-fund1`"
                            :class="{ 'text-muted': (effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)) && feedbackStrategicFundingType(section.sectionKey) !== 'new-researcher' }"
                          >
                            <strong>ทุนนักวิจัยรุ่นใหม่</strong>
                          </label>

                          <div v-if="feedbackStrategicFundingType(section.sectionKey) === 'new-researcher'" class="sub-options">
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-sub1-1`"
                                :checked="feedbackStrategicFundingSubType(section.sectionKey) === 'basic-research'"
                                type="radio"
                                class="form-check-input"
                                value="basic-research"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackStrategicFundingSubType(section.sectionKey, 'basic-research')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-sub1-1`">โครงการวิจัยพื้นฐาน (Basic Research) เพื่อสร้างองค์ความรู้ใหม่ในสาขาวิชาเฉพาะทาง</label>
                            </div>
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-sub1-2`"
                                :checked="feedbackStrategicFundingSubType(section.sectionKey) === 'applied-research'"
                                type="radio"
                                class="form-check-input"
                                value="applied-research"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackStrategicFundingSubType(section.sectionKey, 'applied-research')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-sub1-2`">โครงการวิจัยประยุกต์ (Applied Research) เพื่อพัฒนาเทคโนโลยีหรือนวัตกรรมใหม่</label>
                            </div>
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-sub1-3`"
                                :checked="feedbackStrategicFundingSubType(section.sectionKey) === 'interdisciplinary'"
                                type="radio"
                                class="form-check-input"
                                value="interdisciplinary"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackStrategicFundingSubType(section.sectionKey, 'interdisciplinary')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-sub1-3`">โครงการวิจัยข้ามสาขา (Interdisciplinary Research) เพื่อแก้ไขปัญหาซับซ้อนที่ต้องใช้ความรู้หลายสาขา</label>
                            </div>
                          </div>
                        </div>

                        <div class="form-check mb-3">
                          <input
                            :id="`feedback-${section.sectionKey}-fund2`"
                            :checked="feedbackStrategicFundingType(section.sectionKey) === 'researcher-development'"
                            type="radio"
                            class="form-check-input"
                            value="researcher-development"
                            :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                            @change="setFeedbackStrategicFundingType(section.sectionKey, 'researcher-development')"
                          >
                          <label
                            class="form-check-label"
                            :for="`feedback-${section.sectionKey}-fund2`"
                            :class="{ 'text-muted': (effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)) && feedbackStrategicFundingType(section.sectionKey) !== 'researcher-development' }"
                          >
                            <strong>ทุนพัฒนานักวิจัย</strong>
                          </label>

                          <div v-if="feedbackStrategicFundingType(section.sectionKey) === 'researcher-development'" class="sub-options">
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-sub2-1`"
                                :checked="feedbackStrategicFundingSubType(section.sectionKey) === 'economic-development'"
                                type="radio"
                                class="form-check-input"
                                value="economic-development"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackStrategicFundingSubType(section.sectionKey, 'economic-development')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-sub2-1`">การพัฒนาเศรษฐกิจไทยด้วยเศรษฐกิจสร้างคุณค่าและเศรษฐกิจสร้างสรรค์ ให้มีความสามารถในการแข่งขันและพึ่งพาตนเองได้อย่างยั่งยืน</label>
                            </div>
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-sub2-2`"
                                :checked="feedbackStrategicFundingSubType(section.sectionKey) === 'social-environment'"
                                type="radio"
                                class="form-check-input"
                                value="social-environment"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackStrategicFundingSubType(section.sectionKey, 'social-environment')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-sub2-2`">การยกระดับสังคมและสิ่งแวดล้อม ให้มีการพัฒนาอย่างยั่งยืน สามารถแก้ไข ปัญหาท้าทายและปรับตัวให้ทันต่อพลวัตการเปลี่ยนแปลงของโลก</label>
                            </div>
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-sub2-3`"
                                :checked="feedbackStrategicFundingSubType(section.sectionKey) === 'science-technology'"
                                type="radio"
                                class="form-check-input"
                                value="science-technology"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackStrategicFundingSubType(section.sectionKey, 'science-technology')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-sub2-3`">การพัฒนาวิทยาศาสตร์ เทคโนโลยี การวิจัยและนวัตกรรม ระดับขั้นแนวหน้าที่ก้าวหน้าล้ำยุค เพื่อสร้างโอกาสใหม่และความพร้อม ของประเทศในอนาคต</label>
                            </div>
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-sub2-4`"
                                :checked="feedbackStrategicFundingSubType(section.sectionKey) === 'human-resources'"
                                type="radio"
                                class="form-check-input"
                                value="human-resources"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackStrategicFundingSubType(section.sectionKey, 'human-resources')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-sub2-4`">การพัฒนากำลังคนและสถาบัน ด้านวิทยาศาสตร์ วิจัยและนวัตกรรม ให้เป็นฐานการขับเคลื่อนการพัฒนาเศรษฐกิจและสังคมของประเทศ</label>
                            </div>
                          </div>
                        </div>

                        <div class="form-check mb-3">
                          <input
                            :id="`feedback-${section.sectionKey}-fund3`"
                            :checked="feedbackStrategicFundingType(section.sectionKey) === 'strategic-research'"
                            type="radio"
                            class="form-check-input"
                            value="strategic-research"
                            :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                            @change="setFeedbackStrategicFundingType(section.sectionKey, 'strategic-research')"
                          >
                          <label
                            class="form-check-label"
                            :for="`feedback-${section.sectionKey}-fund3`"
                            :class="{ 'text-muted': (effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)) && feedbackStrategicFundingType(section.sectionKey) !== 'strategic-research' }"
                          >
                            <strong>ทุนวิจัยที่สอดคล้องกับยุทธศาสตร์</strong>
                          </label>
                        </div>

                        <div class="form-check mb-3">
                          <input
                            :id="`feedback-${section.sectionKey}-fund4`"
                            :checked="feedbackStrategicFundingType(section.sectionKey) === 'industry-extension'"
                            type="radio"
                            class="form-check-input"
                            value="industry-extension"
                            :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                            @change="setFeedbackStrategicFundingType(section.sectionKey, 'industry-extension')"
                          >
                          <label
                            class="form-check-label"
                            :for="`feedback-${section.sectionKey}-fund4`"
                            :class="{ 'text-muted': (effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)) && feedbackStrategicFundingType(section.sectionKey) !== 'industry-extension' }"
                          >
                            <strong>ทุนต่อยอดสู่ภาคอุตสาหกรรม</strong>
                          </label>

                          <div v-if="feedbackStrategicFundingType(section.sectionKey) === 'industry-extension'" class="sub-options">
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-sub3-1`"
                                :checked="feedbackStrategicFundingSubType(section.sectionKey) === 'product-development'"
                                type="radio"
                                class="form-check-input"
                                value="product-development"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackStrategicFundingSubType(section.sectionKey, 'product-development')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-sub3-1`">การวิจัยและพัฒนาผลิตภัณฑ์ใหม่ (Product R&D) เพื่อเพิ่มมูลค่าทางการตลาด</label>
                            </div>
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-sub3-2`"
                                :checked="feedbackStrategicFundingSubType(section.sectionKey) === 'process-innovation'"
                                type="radio"
                                class="form-check-input"
                                value="process-innovation"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackStrategicFundingSubType(section.sectionKey, 'process-innovation')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-sub3-2`">การพัฒนากระบวนการผลิต (Process Innovation) เพื่อเพิ่มประสิทธิภาพและลดต้นทุน</label>
                            </div>
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-sub3-3`"
                                :checked="feedbackStrategicFundingSubType(section.sectionKey) === 'technology-transfer'"
                                type="radio"
                                class="form-check-input"
                                value="technology-transfer"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackStrategicFundingSubType(section.sectionKey, 'technology-transfer')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-sub3-3`">การถ่ายทอดเทคโนโลยี (Technology Transfer) เพื่อสร้างนวัตกรรมทางอุตสาหกรรม</label>
                            </div>
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-sub3-4`"
                                :checked="feedbackStrategicFundingSubType(section.sectionKey) === 'competitiveness'"
                                type="radio"
                                class="form-check-input"
                                value="competitiveness"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackStrategicFundingSubType(section.sectionKey, 'competitiveness')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-sub3-4`">การวิจัยเพื่อเพิ่มขีดความสามารถการแข่งขัน (Competitiveness Enhancement)</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </template>
                    <template v-else-if="section.sectionKey === 'expected_outcomes'">
                      <div class="funding-options">
                        <div v-if="!feedbackExpectedOutcomesFundingType(section.sectionKey)" class="alert alert-warning">
                          <i class="cil-info mr-2"></i> กรุณาเลือก "ประเภททุน" ในหัวข้อที่ 2 เพื่อเลือกผลลัพธ์
                        </div>

                        <div v-if="feedbackExpectedOutcomesFundingType(section.sectionKey) === 'new-researcher'" class="mb-3">
                          <label class="form-check-label" :class="{ 'text-muted': (effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)) && feedbackExpectedOutcomesFundingType(section.sectionKey) !== 'new-researcher' }">
                            <strong>14.1 ทุนนักวิจัยรุ่นใหม่</strong>
                          </label>
                          <div class="sub-options">
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-outcome1-1`"
                                :checked="feedbackExpectedOutcomesSelection(section.sectionKey) === 'internationalConference'"
                                type="radio"
                                class="form-check-input"
                                value="internationalConference"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackExpectedOutcomesSelection(section.sectionKey, 'internationalConference')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-outcome1-1`">นำเสนอในการประชุมวิชาการระดับนานาชาติ (Proceedings)</label>
                            </div>
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-outcome1-2`"
                                :checked="feedbackExpectedOutcomesSelection(section.sectionKey) === 'scopusJournal'"
                                type="radio"
                                class="form-check-input"
                                value="scopusJournal"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackExpectedOutcomesSelection(section.sectionKey, 'scopusJournal')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-outcome1-2`">ตีพิมพ์วารสารนานาชาติฐานข้อมูล ก.พ.อ.</label>
                            </div>
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-outcome1-3`"
                                :checked="feedbackExpectedOutcomesSelection(section.sectionKey) === 'tciJournal'"
                                type="radio"
                                class="form-check-input"
                                value="tciJournal"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackExpectedOutcomesSelection(section.sectionKey, 'tciJournal')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-outcome1-3`">ตีพิมพ์วารสาร TCI กลุ่ม 1 เท่านั้น</label>
                            </div>
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-outcome1-4`"
                                :checked="feedbackExpectedOutcomesSelection(section.sectionKey) === 'patent'"
                                type="radio"
                                class="form-check-input"
                                value="patent"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackExpectedOutcomesSelection(section.sectionKey, 'patent')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-outcome1-4`">อนุสิทธิบัตร/สิทธิบัตร</label>
                            </div>
                          </div>
                        </div>

                        <div v-if="feedbackExpectedOutcomesFundingType(section.sectionKey) === 'researcher-development'" class="mb-3">
                          <label class="form-check-label" :class="{ 'text-muted': (effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)) && feedbackExpectedOutcomesFundingType(section.sectionKey) !== 'researcher-development' }">
                            <strong>14.2 ทุนพัฒนานักวิจัย</strong>
                          </label>
                          <div class="sub-options">
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-outcome2-1`"
                                :checked="feedbackExpectedOutcomesSelection(section.sectionKey) === 'scopusJournal'"
                                type="radio"
                                class="form-check-input"
                                value="scopusJournal"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackExpectedOutcomesSelection(section.sectionKey, 'scopusJournal')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-outcome2-1`">ตีพิมพ์วารสารนานาชาติฐานข้อมูล ก.พ.อ.</label>
                            </div>
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-outcome2-2`"
                                :checked="feedbackExpectedOutcomesSelection(section.sectionKey) === 'tciJournal'"
                                type="radio"
                                class="form-check-input"
                                value="tciJournal"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackExpectedOutcomesSelection(section.sectionKey, 'tciJournal')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-outcome2-2`">ตีพิมพ์วารสาร TCI กลุ่ม 1 เท่านั้น</label>
                            </div>
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-outcome2-3`"
                                :checked="feedbackExpectedOutcomesSelection(section.sectionKey) === 'patent'"
                                type="radio"
                                class="form-check-input"
                                value="patent"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackExpectedOutcomesSelection(section.sectionKey, 'patent')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-outcome2-3`">อนุสิทธิบัตร/สิทธิบัตร</label>
                            </div>
                          </div>
                        </div>

                        <div v-if="feedbackExpectedOutcomesFundingType(section.sectionKey) === 'strategic-research'" class="mb-3">
                          <label class="form-check-label" :class="{ 'text-muted': (effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)) && feedbackExpectedOutcomesFundingType(section.sectionKey) !== 'strategic-research' }">
                            <strong>14.3 ทุนวิจัยที่สอดคล้องกับยุทธศาสตร์</strong>
                          </label>
                          <div class="sub-options">
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-outcome3-1`"
                                :checked="feedbackExpectedOutcomesSelection(section.sectionKey) === 'scopusJournal'"
                                type="radio"
                                class="form-check-input"
                                value="scopusJournal"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackExpectedOutcomesSelection(section.sectionKey, 'scopusJournal')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-outcome3-1`">ตีพิมพ์วารสารนานาชาติฐานข้อมูล ก.พ.อ.</label>
                            </div>
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-outcome3-2`"
                                :checked="feedbackExpectedOutcomesSelection(section.sectionKey) === 'tciJournal'"
                                type="radio"
                                class="form-check-input"
                                value="tciJournal"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackExpectedOutcomesSelection(section.sectionKey, 'tciJournal')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-outcome3-2`">ตีพิมพ์วารสาร TCI กลุ่ม 1 เท่านั้น</label>
                            </div>
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-outcome3-3`"
                                :checked="feedbackExpectedOutcomesSelection(section.sectionKey) === 'patent'"
                                type="radio"
                                class="form-check-input"
                                value="patent"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackExpectedOutcomesSelection(section.sectionKey, 'patent')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-outcome3-3`">อนุสิทธิบัตร/สิทธิบัตร</label>
                            </div>
                          </div>
                        </div>

                        <div v-if="feedbackExpectedOutcomesFundingType(section.sectionKey) === 'industry-extension'" class="mb-3">
                          <label class="form-check-label" :class="{ 'text-muted': (effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)) && feedbackExpectedOutcomesFundingType(section.sectionKey) !== 'industry-extension' }">
                            <strong>14.4 ทุนต่อยอดสู่ภาคอุตสาหกรรม</strong>
                          </label>
                          <div class="sub-options">
                            <div class="form-check">
                              <input
                                :id="`feedback-${section.sectionKey}-outcome4-1`"
                                :checked="feedbackExpectedOutcomesSelection(section.sectionKey) === 'ipRegistration'"
                                type="radio"
                                class="form-check-input"
                                value="ipRegistration"
                                :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                                @change="setFeedbackExpectedOutcomesSelection(section.sectionKey, 'ipRegistration')"
                              >
                              <label class="form-check-label" :for="`feedback-${section.sectionKey}-outcome4-1`">การยื่นขอจดทะเบียนทรัพย์สินทางปัญญา (มีเลขคำขอฯ)</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </template>
                    <template v-else-if="section.sectionKey === 'transfer_level' && !isFeedbackSectionSubmitted(section.sectionKey)">
                      <div class="feedback-inline-radio-group">
                        <label class="feedback-inline-radio">
                          <input
                            :checked="feedbackSectionDraft(section.sectionKey) === 'national-international'"
                            type="radio"
                            value="national-international"
                            :disabled="effectiveReadOnly"
                            @change="setFeedbackSectionDraft(section.sectionKey, 'national-international')"
                          >
                          <span>ระดับภูมิภาค/ประเทศ/นานาชาติ</span>
                        </label>
                        <label class="feedback-inline-radio">
                          <input
                            :checked="feedbackSectionDraft(section.sectionKey) === 'community-provincial'"
                            type="radio"
                            value="community-provincial"
                            :disabled="effectiveReadOnly"
                            @change="setFeedbackSectionDraft(section.sectionKey, 'community-provincial')"
                          >
                          <span>ระดับกลุ่มอาชีพ/ชุมชน/จังหวัด</span>
                        </label>
                        <label class="feedback-inline-radio">
                          <input
                            :checked="feedbackSectionDraft(section.sectionKey) === 'none'"
                            type="radio"
                            value="none"
                            :disabled="effectiveReadOnly"
                            @change="setFeedbackSectionDraft(section.sectionKey, 'none')"
                          >
                          <span>ไม่มีการถ่ายทอดสู่สังคม</span>
                        </label>
                      </div>
                    </template>
                    <template v-else-if="section.sectionKey === 'transfer_level'">
                      <div class="feedback-workspace-preview-text">
                        {{ transferLevelPreview(feedbackSectionSnapshot(section.sectionKey)) }}
                      </div>
                    </template>
                    <template v-else-if="section.sectionKey === 'research_team'">
                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <label>ชื่อ-สกุลหัวหน้าโครงการ</label>
                          <input
                            :value="isFeedbackSectionSubmitted(section.sectionKey) ? feedbackSectionSnapshot(section.sectionKey).name : feedbackSectionDraft(section.sectionKey).name"
                            @input="updateFeedbackSectionDraftField(section.sectionKey, 'name', $event.target.value)"
                            type="text"
                            class="form-control"
                            :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                          >
                        </div>
                        <div class="col-md-6 mb-3">
                          <label>สังกัดหน่วยงาน</label>
                          <input
                            :value="isFeedbackSectionSubmitted(section.sectionKey) ? feedbackSectionSnapshot(section.sectionKey).affiliation : feedbackSectionDraft(section.sectionKey).affiliation"
                            @input="updateFeedbackSectionDraftField(section.sectionKey, 'affiliation', $event.target.value)"
                            type="text"
                            class="form-control"
                            :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                          >
                        </div>
                        <div class="col-md-6 mb-3">
                          <label>เบอร์โทรศัพท์</label>
                          <input
                            :value="isFeedbackSectionSubmitted(section.sectionKey) ? feedbackSectionSnapshot(section.sectionKey).phone : feedbackSectionDraft(section.sectionKey).phone"
                            @input="updateFeedbackSectionDraftField(section.sectionKey, 'phone', $event.target.value)"
                            type="text"
                            class="form-control"
                            :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                          >
                        </div>
                        <div class="col-md-6 mb-3">
                          <label>E-mail</label>
                          <input
                            :value="isFeedbackSectionSubmitted(section.sectionKey) ? feedbackSectionSnapshot(section.sectionKey).email : feedbackSectionDraft(section.sectionKey).email"
                            @input="updateFeedbackSectionDraftField(section.sectionKey, 'email', $event.target.value)"
                            type="email"
                            class="form-control"
                            :disabled="effectiveReadOnly || isFeedbackSectionSubmitted(section.sectionKey)"
                          >
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <div class="alert alert-warning mb-0">
                        หัวข้อนี้ยังไม่มี editor แบบฝังในส่วนแก้ไข ระบบจะบันทึกความเห็นไว้ให้และยังแก้ได้จากฟอร์มหลักด้านบน
                      </div>
                    </template>

                    <div v-if="!effectiveReadOnly" class="feedback-workspace-editor__actions">
                      <CButton
                        v-if="!isFeedbackSectionSubmitted(section.sectionKey)"
                        color="primary"
                        :disabled="isSubmittingFeedbackSection(section.sectionKey)"
                        @click="submitFeedbackSection(section)"
                      >
                        <CIcon name="cil-chevron-left" class="mr-1" /> {{ isSubmittingFeedbackSection(section.sectionKey) ? 'กำลังส่งแก้ไข...' : 'ส่งแก้ไข' }}
                      </CButton>
                      <CButton
                        v-else
                        color="secondary"
                        variant="outline"
                        @click="reopenFeedbackSection(section.sectionKey)"
                      >
                        <CIcon name="cil-chevron-right" class="mr-1" /> แก้ไขต่อ
                      </CButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="!feedbackReviews.length" class="text-muted">
              ยังไม่มีข้อเสนอแนะเพิ่มเติม
            </div>

            <div v-else>
              <div v-for="group in feedbackReviewGroups" :key="`feedback-round-${group.roundNo}`" class="mb-3">
                <h6 class="mb-2">ความเห็นคณะกรรมการ รอบที่ {{ group.roundNo }}</h6>
                <div v-for="review in group.reviews" :key="review._id" class="card mb-2">
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-6 mb-1"><strong>ผู้ประเมิน:</strong> {{ reviewerName(review) }}</div>
                      <div class="col-md-6 mb-1"><strong>คะแนนรวม:</strong> {{ review.totalScore !== null && review.totalScore !== undefined ? review.totalScore : '-' }}</div>
                      <div class="col-md-6 mb-1"><strong>ผลการพิจารณา:</strong> {{ decisionLabel(review.decision) }}</div>
                      <div class="col-md-6 mb-1"><strong>วันที่ส่ง:</strong> {{ formatReviewDateTime(review.submittedAt || review.updatedAt) }}</div>
                      <div class="col-12 mb-1"><strong>ข้อเสนอแนะ:</strong> {{ review.summaryComment || '-' }}</div>
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
import TextEditor from '@/ResearchFormRS/component/TextEditor.vue'
import Section12 from '@/ResearchFormRS/component/TestComponent/Section12.vue'
import BudgetSectionDemo from '@/ResearchFormRS/component/BudgetSectionDemo.vue'

export default {
  name: 'FeedbackSection',
  components: {
    TextEditor,
    Section12,
    BudgetSectionDemo
  },
  props: {
    feedbackLoading: {
      type: Boolean,
      default: false
    },
    feedbackError: {
      type: [String, Object],
      default: null
    },
    latestDecisionStatus: {
      type: String,
      default: ''
    },
    latestDecisionRound: {
      type: [String, Number],
      default: null
    },
    userFeedback: {
      type: Object,
      default: null
    },
    latestDecisionRemark: {
      type: String,
      default: ''
    },
    feedbackEditableSections: {
      type: Array,
      default: () => []
    },
    feedbackReviews: {
      type: Array,
      default: () => []
    },
    feedbackReviewGroups: {
      type: Array,
      default: () => []
    },
    effectiveReadOnly: {
      type: Boolean,
      default: false
    },
    decisionStatusLabel: {
      type: Function,
      required: true
    },
    isFeedbackSectionSubmitted: {
      type: Function,
      required: true
    },
    feedbackSectionSubmittedAt: {
      type: Function,
      required: true
    },
    formatReviewDateTime: {
      type: Function,
      required: true
    },
    toggleFeedbackSectionCard: {
      type: Function,
      required: true
    },
    isFeedbackSectionCollapsed: {
      type: Function,
      required: true
    },
    feedbackSectionDraft: {
      type: Function,
      required: true
    },
    setFeedbackSectionDraft: {
      type: Function,
      required: true
    },
    feedbackSectionSnapshot: {
      type: Function,
      required: true
    },
    feedbackStrategicFundingType: {
      type: Function,
      required: true
    },
    feedbackStrategicFundingSubType: {
      type: Function,
      required: true
    },
    setFeedbackStrategicFundingType: {
      type: Function,
      required: true
    },
    setFeedbackStrategicFundingSubType: {
      type: Function,
      required: true
    },
    feedbackExpectedOutcomesFundingType: {
      type: Function,
      required: true
    },
    feedbackExpectedOutcomesSelection: {
      type: Function,
      required: true
    },
    setFeedbackExpectedOutcomesSelection: {
      type: Function,
      required: true
    },
    transferLevelPreview: {
      type: Function,
      required: true
    },
    updateFeedbackSectionDraftField: {
      type: Function,
      required: true
    },
    isSubmittingFeedbackSection: {
      type: Function,
      required: true
    },
    submitFeedbackSection: {
      type: Function,
      required: true
    },
    reopenFeedbackSection: {
      type: Function,
      required: true
    },
    reviewerName: {
      type: Function,
      required: true
    },
    decisionLabel: {
      type: Function,
      required: true
    }
  }
}
</script>
<style scoped>
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

@media (max-width: 768px) {
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
</style>

