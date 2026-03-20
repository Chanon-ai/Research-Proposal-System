<template>
  <div class="project-details-form" :class="{ 'is-dark': isDarkTheme }">
    <div class="card">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0">1-19 รายละเอียดโครงการ</h5>
      </div>
      <div class="card-body">

        <div class="section mb-4">
          <h6 class="section-title">1. ชื่อโครงการ <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <div class="form-group">
            <label class="sub-label">ชื่อโครงการ (ภาษาไทย)</label>
            <input
              v-model="form.projectNameThai"
              type="text"
              class="form-control"
              :disabled="isProjectTitleDisabled"
              placeholder="กรุณากรอกชื่อโครงการภาษาไทย"
              @input="filterThaiInput"
              required
            >
            <small class="form-text text-muted lang-hint">กรุณากรอกชื่อโครงการภาษาไทย (สามารถใช้ตัวเลขและสัญลักษณ์ได้) *</small>
          </div>
          <div class="form-group">
            <label class="sub-label">ชื่อโครงการ (ภาษาอังกฤษ)</label>
            <input
              v-model="form.projectNameEnglish"
              type="text"
              class="form-control"
              :disabled="isProjectTitleDisabled"
              placeholder="Project Title in English"
              @input="filterEnglishInput"
              required
            >
            <small class="form-text text-muted lang-hint">กรุณากรอกเป็นภาษาอังกฤษเท่านั้น *</small>
          </div>
        </div>

        <div ref="strategic_alignment" :class="sectionClass('strategic_alignment')">
          <h6 class="section-title">2. ประเภททุน <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <div class="funding-options">

            <div class="form-check mb-3">
              <input v-model="form.fundingType" type="radio" class="form-check-input" id="fund1" value="new-researcher" :disabled="isReadOnly">
              <label for="fund1" :class="{'text-muted': isReadOnly && form.fundingType !== 'new-researcher'}"><strong>ทุนนักวิจัยรุ่นใหม่</strong></label>
              
              <div v-if="form.fundingType === 'new-researcher'" class="sub-options">
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub1-1" value="basic-research" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub1-1">โครงการวิจัยพื้นฐาน (Basic Research) เพื่อสร้างองค์ความรู้ใหม่ในสาขาวิชาเฉพาะทาง</label>
                </div>
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub1-2" value="applied-research" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub1-2">โครงการวิจัยประยุกต์ (Applied Research) เพื่อพัฒนาเทคโนโลยีหรือนวัตกรรมใหม่</label>
                </div>
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub1-3" value="interdisciplinary" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub1-3">โครงการวิจัยข้ามสาขา (Interdisciplinary Research) เพื่อแก้ไขปัญหาซับซ้อนที่ต้องใช้ความรู้หลายสาขา</label>
                </div>
              </div>
            </div>

            <div class="form-check mb-3">
              <input v-model="form.fundingType" type="radio" class="form-check-input" id="fund2" value="researcher-development" :disabled="isReadOnly">
              <label for="fund2" :class="{'text-muted': isReadOnly && form.fundingType !== 'researcher-development'}"><strong>ทุนพัฒนานักวิจัย</strong></label>
              
              <div v-if="form.fundingType === 'researcher-development'" class="sub-options">
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub2-1" value="economic-development" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub2-1">การพัฒนาเศรษฐกิจไทยด้วยเศรษฐกิจสร้างคุณค่าและเศรษฐกิจสร้างสรรค์ ให้มีความสามารถในการแข่งขันและพึ่งพาตนเองได้อย่างยั่งยืน</label>
                </div>
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub2-2" value="social-environment" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub2-2">การยกระดับสังคมและสิ่งแวดล้อม ให้มีการพัฒนาอย่างยั่งยืน สามารถแก้ไข ปัญหาท้าทายและปรับตัวให้ทันต่อพลวัตการเปลี่ยนแปลงของโลก</label>
                </div>
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub2-3" value="science-technology" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub2-3">การพัฒนาวิทยาศาสตร์ เทคโนโลยี การวิจัยและนวัตกรรม ระดับขั้นแนวหน้าที่ก้าวหน้าล้ำยุค เพื่อสร้างโอกาสใหม่และความพร้อม ของประเทศในอนาคต</label>
                </div>
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub2-4" value="human-resources" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub2-4">การพัฒนากำลังคนและสถาบัน ด้านวิทยาศาสตร์ วิจัยและนวัตกรรม ให้เป็นฐานการขับเคลื่อนการพัฒนาเศรษฐกิจและสังคมของประเทศ</label>
                </div>
              </div>
            </div>

            <div class="form-check mb-3">
              <input v-model="form.fundingType" type="radio" class="form-check-input" id="fund3" value="strategic-research" :disabled="isReadOnly">
              <label for="fund3" :class="{'text-muted': isReadOnly && form.fundingType !== 'strategic-research'}"><strong>ทุนวิจัยที่สอดคล้องกับยุทธศาสตร์</strong></label>
            </div>

            <div class="form-check mb-3">
              <input v-model="form.fundingType" type="radio" class="form-check-input" id="fund4" value="industry-extension" :disabled="isReadOnly">
              <label for="fund4" :class="{'text-muted': isReadOnly && form.fundingType !== 'industry-extension'}"><strong>ทุนต่อยอดสู่ภาคอุตสาหกรรม</strong></label>
              
              <div v-if="form.fundingType === 'industry-extension'" class="sub-options">
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub3-1" value="product-development" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub3-1">การวิจัยและพัฒนาผลิตภัณฑ์ใหม่ (Product R&D) เพื่อเพิ่มมูลค่าทางการตลาด</label>
                </div>
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub3-2" value="process-innovation" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub3-2">การพัฒนากระบวนการผลิต (Process Innovation) เพื่อเพิ่มประสิทธิภาพและลดต้นทุน</label>
                </div>
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub3-3" value="technology-transfer" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub3-3">การถ่ายทอดเทคโนโลยี (Technology Transfer) เพื่อสร้างนวัตกรรมทางอุตสาหกรรม</label>
                </div>
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub3-4" value="competitiveness" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub3-4">การวิจัยเพื่อเพิ่มขีดความสามารถการแข่งขัน (Competitiveness Enhancement)</label>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div class="section mb-4">
          <h6 class="section-title">3. หน่วยงานที่ร่วมมือ</h6>
          <div class="form-group">
            <input
              v-model="form.collaborationAgency"
              type="text"
              class="form-control"
              placeholder="กรอกหน่วยงานที่ร่วมมือ (ไม่บังคับ)"
              :disabled="isReadOnly"
            >
          </div>
        </div>

        <div class="section mb-4">
          <h6 class="section-title">4. ประเภทงานวิจัย <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <div class="funding-options">
            <div class="form-check mb-3">
              <input
                id="research-type-science-technology"
                v-model="form.researchType"
                type="radio"
                class="form-check-input"
                name="researchType"
                value="science-technology"
                :disabled="isReadOnly"
              >
              <label for="research-type-science-technology" :class="{'text-muted': isReadOnly && form.researchType !== 'science-technology'}">
                <strong>ด้านวิทยาศาสตร์และเทคโนโลยี</strong>
              </label>
            </div>
            <div class="form-check mb-3">
              <input
                id="research-type-health-science"
                v-model="form.researchType"
                type="radio"
                class="form-check-input"
                name="researchType"
                value="health-science"
                :disabled="isReadOnly"
              >
              <label for="research-type-health-science" :class="{'text-muted': isReadOnly && form.researchType !== 'health-science'}">
                <strong>ด้านวิทยาศาสตร์สุขภาพ</strong>
              </label>
            </div>
            <div class="form-check mb-3">
              <input
                id="research-type-social-humanities"
                v-model="form.researchType"
                type="radio"
                class="form-check-input"
                name="researchType"
                value="social-humanities"
                :disabled="isReadOnly"
              >
              <label for="research-type-social-humanities" :class="{'text-muted': isReadOnly && form.researchType !== 'social-humanities'}">
                <strong>ด้านสังคมศาสตร์และมนุษย์ศาสตร์</strong>
              </label>
            </div>
          </div>
        </div>

        <div class="section mb-4">
          <h6 class="section-title">5. คำสำคัญ (Keywords) <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor v-model="form.keywords" :is-read-only="isReadOnly" />
        </div>

        <div ref="problem_significance" :class="sectionClass('problem_significance')">
          <h6 class="section-title">6. ความสำคัญของปัญหาและแนวคิด <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor v-model="form.problemSignificance" :is-read-only="isReadOnly" />
        </div>

        <div ref="objectives" :class="sectionClass('objectives')">
          <h6 class="section-title">7. วัตถุประสงค์ <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor v-model="form.objectives" :is-read-only="isReadOnly" />
        </div>

        <div ref="literature_review" :class="sectionClass('literature_review')">
          <h6 class="section-title">8. ทบทวนวรรณกรรม <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor v-model="form.literatureReview" :is-read-only="isReadOnly" />
        </div>

        <div class="section mb-4">
          <h6 class="section-title">9. เอกสารอ้างอิง <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor v-model="form.references" :is-read-only="isReadOnly" />
        </div>

        <div ref="research_methodology" :class="sectionClass('research_methodology')">
          <h6 class="section-title">10. วิธีดำเนินการวิจัย <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor v-model="form.researchMethodology" :is-read-only="isReadOnly" />
        </div>

        <div class="section mb-4">
          <h6 class="section-title">11. ขอบเขตการวิจัย <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor v-model="form.researchScope" :is-read-only="isReadOnly" />
        </div>

        <div ref="work_plan" :class="sectionClass('work_plan')">
          <h6 class="section-title">12. แผนการดำเนินงาน <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <Section12 v-model="form.workPlan" :is-read-only="isReadOnly" />
        </div>

        <div class="section mb-4">
          <h6 class="section-title">13. ผลงานตามระยะเวลาการรายงาน <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor v-model="form.milestones" :is-read-only="isReadOnly" />
        </div>

        <div ref="expected_outcomes" :class="sectionClass('expected_outcomes')">
          <h6 class="section-title">14. ผลลัพธ์ที่คาดว่าจะได้รับ <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <div class="funding-options">

          <div v-if="!form.fundingType" class="alert alert-warning">
            <i class="cil-info me-2"></i> กรุณาเลือก "ประเภททุน" ในหัวข้อที่ 2 เพื่อเลือกผลลัพธ์
          </div>

          <div v-if="form.fundingType === 'new-researcher'" class="mb-3">
            <label class="form-check-label" :class="{'text-muted': isReadOnly && form.fundingType !== 'new-researcher'}">
              <strong>14.1 ทุนนักวิจัยรุ่นใหม่</strong>
            </label>
            <div class="sub-options">
              <div class="form-check">
                <input v-model="form.selectedOutcome" type="radio" value="internationalConference" class="form-check-input" id="outcome1-1" :disabled="isReadOnly">
                <label class="form-check-label" for="outcome1-1">นำเสนอในการประชุมวิชาการระดับนานาชาติ (Proceedings)</label>
              </div>
              <div class="form-check">
                <input v-model="form.selectedOutcome" type="radio" value="scopusJournal" class="form-check-input" id="outcome1-2" :disabled="isReadOnly">
                <label class="form-check-label" for="outcome1-2">ตีพิมพ์วารสารนานาชาติฐานข้อมูล ก.พ.อ.</label>
              </div>
              <div class="form-check">
                <input v-model="form.selectedOutcome" type="radio" value="tciJournal" class="form-check-input" id="outcome1-3" :disabled="isReadOnly">
                <label class="form-check-label" for="outcome1-3">ตีพิมพ์วารสาร TCI กลุ่ม 1 เท่านั้น</label>
              </div>
              <div class="form-check">
                <input v-model="form.selectedOutcome" type="radio" value="patent" class="form-check-input" id="outcome1-4" :disabled="isReadOnly">
                <label class="form-check-label" for="outcome1-4">อนุสิทธิบัตร/สิทธิบัตร</label>
              </div>
            </div>
          </div>

          <div v-if="form.fundingType === 'researcher-development'" class="mb-3">
            <label class="form-check-label" :class="{'text-muted': isReadOnly && form.fundingType !== 'researcher-development'}">
              <strong>14.2 ทุนพัฒนานักวิจัย</strong>
            </label>
            <div class="sub-options">
              <div class="form-check">
                <input v-model="form.selectedOutcome" type="radio" value="scopusJournal" class="form-check-input" id="outcome2-1" :disabled="isReadOnly">
                <label class="form-check-label" for="outcome2-1">ตีพิมพ์วารสารนานาชาติฐานข้อมูล ก.พ.อ.</label>
              </div>
              <div class="form-check">
                <input v-model="form.selectedOutcome" type="radio" value="tciJournal" class="form-check-input" id="outcome2-2" :disabled="isReadOnly">
                <label class="form-check-label" for="outcome2-2">ตีพิมพ์วารสาร TCI กลุ่ม 1 เท่านั้น</label>
              </div>
              <div class="form-check">
                <input v-model="form.selectedOutcome" type="radio" value="patent" class="form-check-input" id="outcome2-3" :disabled="isReadOnly">
                <label class="form-check-label" for="outcome2-3">อนุสิทธิบัตร/สิทธิบัตร</label>
              </div>
            </div>
          </div>

          <div v-if="form.fundingType === 'strategic-research'" class="mb-3">
            <label class="form-check-label" :class="{'text-muted': isReadOnly && form.fundingType !== 'strategic-research'}">
              <strong>14.3 ทุนวิจัยที่สอดคล้องกับยุทธศาสตร์</strong>
            </label>
            <div class="sub-options">
              <div class="form-check">
                <input v-model="form.selectedOutcome" type="radio" value="scopusJournal" class="form-check-input" id="outcome3-1" :disabled="isReadOnly">
                <label class="form-check-label" for="outcome3-1">ตีพิมพ์วารสารนานาชาติฐานข้อมูล ก.พ.อ.</label>
              </div>
              <div class="form-check">
                <input v-model="form.selectedOutcome" type="radio" value="tciJournal" class="form-check-input" id="outcome3-2" :disabled="isReadOnly">
                <label class="form-check-label" for="outcome3-2">ตีพิมพ์วารสาร TCI กลุ่ม 1 เท่านั้น</label>
              </div>
              <div class="form-check">
                <input v-model="form.selectedOutcome" type="radio" value="patent" class="form-check-input" id="outcome3-3" :disabled="isReadOnly">
                <label class="form-check-label" for="outcome3-3">อนุสิทธิบัตร/สิทธิบัตร</label>
              </div>
            </div>
          </div>

          <div v-if="form.fundingType === 'industry-extension'" class="mb-3">
            <label class="form-check-label" :class="{'text-muted': isReadOnly && form.fundingType !== 'industry-extension'}">
              <strong>14.4 ทุนต่อยอดสู่ภาคอุตสาหกรรม</strong>
            </label>
            <div class="sub-options">
              <div class="form-check">
                <input v-model="form.selectedOutcome" type="radio" value="ipRegistration" class="form-check-input" id="outcome4-1" :disabled="isReadOnly">
                <label class="form-check-label" for="outcome4-1">การยื่นขอจดทะเบียนทรัพย์สินทางปัญญา (มีเลขคำขอฯ)</label>
              </div>
            </div>
          </div>
          </div>
        </div>

        <div ref="integration" :class="sectionClass('integration')">
          <h6 class="section-title">15. การบูรณาการงานวิจัย <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor v-model="form.integration" :is-read-only="isReadOnly" />
        </div>

        <div ref="transfer_level" :class="sectionClass('transfer_level')">
          <h6 class="section-title">16. ระดับการถ่ายทอดสู่สังคม <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <div class="funding-options">
            <div class="form-check mb-3">
              <input v-model="form.transferLevel" type="radio" class="form-check-input" id="transfer1" value="national-international" :disabled="isReadOnly">
              <label for="transfer1" :class="{'text-muted': isReadOnly && form.transferLevel !== 'national-international'}">
                <strong>สามารถนำไปถ่ายทอดเป็นต้นแบบและแนวทางได้ในระดับภูมิภาค ประเทศ หรือ นานาชาติ</strong>
              </label>
            </div>
            <div class="form-check mb-3">
              <input v-model="form.transferLevel" type="radio" class="form-check-input" id="transfer2" value="community-provincial" :disabled="isReadOnly">
              <label for="transfer2" :class="{'text-muted': isReadOnly && form.transferLevel !== 'community-provincial'}">
                <strong>สามารถนำไปถ่ายทอดเป็นต้นแบบและแนวทางได้เฉพาะกลุ่มอาชีพ ชุมชน หรือจังหวัด</strong>
              </label>
            </div>
            <div class="form-check mb-3">
              <input v-model="form.transferLevel" type="radio" class="form-check-input" id="transfer3" value="none" :disabled="isReadOnly">
              <label for="transfer3" :class="{'text-muted': isReadOnly && form.transferLevel !== 'none'}">
                <strong>ไม่มีการนำไปถ่ายทอดสู่สังคม</strong>
              </label>
            </div>
          </div>
        </div>

        <div ref="budget" :class="sectionClass('budget')">
          <h6 class="section-title">17. งบประมาณโครงการ <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <BudgetSectionDemo
            ref="budgetSection"
            v-model="form.budget"
            :is-read-only="isReadOnly"
            @update:modelValue="handleBudgetUpdate"
            @upload-attachment="$emit('budget-attachment-upload', $event)"
            @open-attachment="$emit('budget-attachment-open', $event)"
            @attachment-meta-change="$emit('budget-attachment-meta-change', $event)"
          />
        </div>

        <div class="section mb-4">
          <ResearchStandardSection
            v-model="form.researchStandard"
            :is-read-only="isReadOnly"
            @upload-attachment="$emit('research-standard-upload', $event)"
            @open-attachment="$emit('research-standard-open', $event)"
            @remove-attachment="$emit('research-standard-remove', $event)"
          />
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import TextEditor from './TextEditor.vue'
import Section12 from './TestComponent/Section12.vue'
import BudgetSectionDemo from './BudgetSectionDemo.vue'
import ResearchStandardSection from './ResearchStandardSection.vue'

export default {
  name: 'ProjectDetailsForm',
  components: {
    TextEditor,
    Section12,
    BudgetSectionDemo,
    ResearchStandardSection
  },
  // รับค่า isReadOnly มาจากไฟล์แม่ (ResearchForm.vue)
  props: {
    isReadOnly: {
      type: Boolean,
      default: false
    },
    disableProjectTitleSection: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    isDarkTheme() {
      return Boolean(this.$store && this.$store.state && this.$store.state.darkMode)
    },

    isProjectTitleDisabled() {
      return this.isReadOnly || this.disableProjectTitleSection
    }
  },
  data() {
    return {
      isHydrating: false,
      suppressFundingWatcher: false,
      highlightedSectionKey: '',
      highlightTimerId: null,
      form: {
        projectNameThai: '',
        projectNameEnglish: '',
        fundingType: '',
        fundingSubType: '',
        collaboration: 'none',
        collaborationAgency: '',
        researchType: '',
        keywords: '',
        problemSignificance: '',
        objectives: '',
        literatureReview: '',
        references: '',
        researchMethodology: '',
        researchScope: '',
        workPlan: [],
        milestones: '',
        // เปลี่ยนจาก Object ของ Checkbox เป็น String สำหรับเก็บค่า Radio Button
        selectedOutcome: '', 
        integration: '',
        transferLevel: '',
        researchStandard: {
          mainType: '',       // เก็บค่า 'none' หรือ 'human_animal'
          isPlant: false,     // เพิ่ม isPlant สำหรับติ๊กเรื่องพืช (มาตรา 53)
          plantSubType: '',   
          isHuman: false,
          humanSubType: '',
          isAnimal: false,
          animalSubType: '',
          attachments: {
            plantApproved: null,
            plantPending: null,
            humanApproved: null,
            humanPending: null,
            animalApproved: null,
            animalPending: null
          }
        },
        budget: {
          categories: [
            { title: "หมวดค่าตอบแทน", options: ["ค่าตอบแทน – นักศึกษาช่วยงานด้านวิชาการ", "ค่าตอบแทน – นักศึกษาช่วยงานทั่วไป", "ค่าตอบแทน – อาสาสมัคร", "ค่าตอบแทน – ผู้ให้ข้อมูล"], selected: "", rows: [] },
            { title: "หมวดค่าใช้สอย", options: ["ค่าอาหารกลางวัน (120.-)", "ค่าอาหารว่าง (50.-)", "จ้างเหมาวิเคราะห์ทดสอบ (TOR)"], selected: "", rows: [] },
            { title: "หมวดค่าเดินทาง", options: ["ค่าเบี้ยเลี้ยง (350.-/วัน)", "ค่าที่พัก (เหมา 800.-)", "รถยนต์ส่วนบุคคล (4.-/กม.)"], selected: "", rows: [] },
            { title: "หมวดค่าวัสดุ", options: ["ค่าวัสดุสำนักงาน", "ค่าวัสดุคอมพิวเตอร์", "น้ำมันเชื้อเพลิงพาหนะเช่า"], selected: "", rows: [] },
            { title: "หมวดค่าสาธารณูปโภค", options: [], selected: "", rows: [] },
            { title: "หมวดครุภัณฑ์", options: [], selected: "", rows: [] },
            { title: "อื่นๆ", options: [], selected: "", rows: [] }
          ],
          grandTotal: 0
        }
      }
    }
  },
  watch: {
    form: {
      deep: true,
      handler() {
        if (this.isHydrating) return
        this.$emit('form-changed', this.cloneSerializable(this.form))
      }
    },
    // ดักจับการเปลี่ยนแปลงของ "ประเภททุน" (หัวข้อ 2)
    'form.fundingType'(newVal, oldVal) {
      if (this.suppressFundingWatcher) return
      if (newVal !== oldVal) {
        // ล้างค่าทุนย่อยและผลลัพธ์ที่เคยเลือกไว้ เพื่อไม่ให้มีข้อมูลผิดประเภทหลงเหลืออยู่
        this.form.fundingSubType = '';
        this.form.selectedOutcome = '';
      }
    }
  },
  methods: {
    cloneSerializable(value) {
      if (value === undefined) return undefined
      try {
        return JSON.parse(JSON.stringify(value))
      } catch (_) {
        return value
      }
    },
    createDefaultForm() {
      return {
        projectNameThai: '',
        projectNameEnglish: '',
        fundingType: '',
        fundingSubType: '',
        collaboration: 'none',
        collaborationAgency: '',
        researchType: '',
        keywords: '',
        problemSignificance: '',
        objectives: '',
        literatureReview: '',
        references: '',
        researchMethodology: '',
        researchScope: '',
        workPlan: [],
        milestones: '',
        selectedOutcome: '',
        integration: '',
        transferLevel: '',
        researchStandard: {
          mainType: '',
          isPlant: false,
          plantSubType: '',
          isHuman: false,
          humanSubType: '',
          isAnimal: false,
          animalSubType: '',
          attachments: {
            plantApproved: null,
            plantPending: null,
            humanApproved: null,
            humanPending: null,
            animalApproved: null,
            animalPending: null
          }
        },
        budget: {
          categories: [],
          grandTotal: 0
        }
      }
    },
    filterThaiInput(event) {
      this.form.projectNameThai = this.sanitizeThaiProjectTitle(event.target.value)
    },
    filterEnglishInput(event) {
      this.form.projectNameEnglish = this.sanitizeEnglishProjectTitle(event.target.value)
    },
    isAllowedSymbol(char) {
      return /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(char)
    },
    sanitizeThaiProjectTitle(value) {
      const source = String(value || '')
      return Array.from(source).filter((char) => {
        if (/[0-9]/.test(char)) return true
        if (/\s/.test(char)) return true
        if (/[\u0E00-\u0E7F]/.test(char)) return true
        return this.isAllowedSymbol(char)
      }).join('')
    },
    sanitizeEnglishProjectTitle(value) {
      const source = String(value || '')
      return Array.from(source).filter((char) => {
        if (/[a-zA-Z0-9]/.test(char)) return true
        if (/\s/.test(char)) return true
        return this.isAllowedSymbol(char)
      }).join('')
    },
    handleBudgetUpdate(newBudget) {
      if (this.isHydrating) return
      const nextBudget = newBudget || { categories: [], grandTotal: 0 }

      // In normal flow v-model already updates form.budget, but keep a guard
      // in case the component is wired without v-model in the future.
      if (this.form.budget !== nextBudget) {
        this.form.budget = nextBudget
      }

      this.$emit('budget-changed', this.cloneSerializable(nextBudget))
    },
    sectionClass(sectionKey) {
      return [
        'section',
        'mb-4',
        { 'section-highlight': this.highlightedSectionKey === sectionKey }
      ]
    },
    scrollToSection(sectionKey) {
      const target = this.$refs[sectionKey]
      const el = Array.isArray(target) ? target[0] : target
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      this.highlightSection(sectionKey)
    },
    highlightSection(sectionKey) {
      this.highlightedSectionKey = sectionKey
      if (this.highlightTimerId) {
        clearTimeout(this.highlightTimerId)
      }
      this.highlightTimerId = setTimeout(() => {
        this.highlightedSectionKey = ''
        this.highlightTimerId = null
      }, 2200)
    },
    setFormData(data = {}) {
      // Prevent child sections from bubbling default values back to the parent while hydrating from DB.
      this.isHydrating = true
      this.suppressFundingWatcher = true

      const nextForm = Object.assign(this.createDefaultForm(), this.cloneSerializable(data) || {})
      Object.keys(nextForm).forEach((key) => {
        this.$set(this.form, key, nextForm[key])
      })

      return new Promise((resolve) => {
        this.$nextTick(() => {
          this.$nextTick(() => {
            this.suppressFundingWatcher = false
            this.isHydrating = false
            resolve(this.getFormData())
          })
        })
      })
    },
    getFormData() {
      const snapshot = this.cloneSerializable(this.form)
      const budgetSection = this.$refs.budgetSection
      const section = Array.isArray(budgetSection) ? budgetSection[0] : budgetSection
      if (!this.isHydrating && !this.isReadOnly && section && typeof section.getBudgetData === 'function') {
        snapshot.budget = section.getBudgetData()
      }
      return snapshot
    },
    getBudgetValidationResult() {
      const budgetSection = this.$refs.budgetSection
      const section = Array.isArray(budgetSection) ? budgetSection[0] : budgetSection
      if (section && typeof section.getSubmissionValidationResult === 'function') {
        return section.getSubmissionValidationResult()
      }
      return { ok: true, errors: [] }
    },
    submitForm() {
      // 1. ตรวจสอบ Validation (ตัวอย่างการเช็คหัวข้อ 18)
      const std = this.form.researchStandard;
      if (std.mainType === 'human_animal' && !std.isHuman && !std.isAnimal) {
        alert('กรุณาระบุข้อมูลมาตรฐานการวิจัยให้ครบถ้วน (ต้องเลือก มนุษย์ หรือ สัตว์ทดลอง อย่างน้อย 1 อย่าง)');
        return;
      }
    },
  }
}
</script>

<style scoped>
.project-details-form {
  margin-bottom: 20px;
}

.project-details-form.is-dark {
  color: #e6edf7;
}

.project-details-form.is-dark .section-title {
  color: #eaf2fb;
  background: #1f2b39;
  border-left-color: #c59b3a;
}

.project-details-form.is-dark .section-highlight .section-title {
  background: #2a3645;
  border-left-color: #f2b94d;
  box-shadow: 0 0 0 3px rgba(242, 185, 77, 0.16);
}

.project-details-form.is-dark .funding-options {
  background: #1a2432;
  border: 1px solid #2f3f52;
}

.project-details-form.is-dark .sub-options {
  background: #223142;
  border: 1px solid #35475c;
}

.project-details-form.is-dark .sub-section-title,
.project-details-form.is-dark .sub-label,
.project-details-form.is-dark .form-check-label,
.project-details-form.is-dark .form-check-label strong {
  color: #e6edf7;
}

.project-details-form.is-dark .sub-options .form-check-label,
.project-details-form.is-dark .description,
.project-details-form.is-dark .lang-hint,
.project-details-form.is-dark .text-muted {
  color: #aab9ca !important;
}

.project-details-form.is-dark .form-control {
  background: #223142;
  border-color: #3b4d62;
  color: #edf4fc;
}

.project-details-form.is-dark .form-control::placeholder {
  color: #9caec2;
}

.project-details-form.is-dark .form-control:focus {
  border-color: #c59b3a;
  box-shadow: 0 0 0 0.2rem rgba(197, 155, 58, 0.2);
}

.project-details-form.is-dark .form-check-input {
  filter: brightness(1.08);
}

.project-details-form.is-dark .alert.alert-warning {
  background: rgba(245, 158, 11, 0.18);
  border-color: rgba(245, 158, 11, 0.35);
  color: #f8d48a;
}

.section-title {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 15px;
  padding: 10px 15px;
  background: #f8f9fa;
  border-left: 4px solid #007bff;
  border-radius: 4px;
  line-height: 1.45;
  white-space: normal;
  overflow-wrap: break-word;
}

.section-highlight .section-title {
  background: #fff8db;
  border-left-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.16);
}

.sub-section-title {
  font-weight: 600;
  color: #000000;
  margin-bottom: 12px;
  font-size: 15px;
}

.sub-label {
  font-weight: 500;
  color: #495057;
  margin-bottom: 5px;
  display: block;
}

.form-group {
  margin-bottom: 20px;
}

.form-control {
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 10px 12px;
}

.form-control:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
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
}

.form-check-label strong {
  display: block;
  margin-bottom: 5px;
  color: #333333;
}

.description {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0;
  line-height: 1.5;
}

.text-danger {
  color: #dc3545 !important;
}

.card {
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.card-header {
  border: none;
  font-weight: 600;
}

.card-body {
  padding: 25px;
}

.form-text {
  font-size: 0.8rem;
  margin-top: 5px;
}

/* smaller language hint with trailing asterisk */
.lang-hint {
  font-size: 0.72rem;
  color: #6c757d;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .card-body {
    padding: 15px;
  }
  .section-title {
    font-size: 14px;
  }
  .footer-fixed {
    padding: 10px 15px;
  }
  .project-details-form {
    /* Footer spacing is handled by ResearchForm page; avoid large blank gap before next section */
    padding-bottom: 0 !important;
  }
  .footer-fixed .btn {
    font-size: 0.9rem;
    padding: 8px 16px;
  }
}

/* Make colored card headers adapt to small screens so they match the main white background */
@media (max-width: 768px) {
  .project-details-form .card-header.bg-primary {
    background: #ffffff !important;
    color: #333 !important;
  }
  .project-details-form .card-header.bg-primary h5 {
    color: #333 !important;
  }
}
</style>

