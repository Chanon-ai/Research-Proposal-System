<template>
  <div class="project-details-form" :class="{ 'is-dark': isDarkTheme }">
    <div class="card">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0">{{ formText.cardTitle }}</h5>
      </div>
      <div class="card-body">

        <div class="section mb-4">
          <h6 class="section-title">{{ formText.section1Title }} <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <div class="form-group">
            <label class="sub-label">{{ formText.projectNameThaiLabel }}</label>
            <input
              v-model="form.projectNameThai"
              type="text"
              class="form-control"
              :disabled="isProjectTitleDisabled"
              :placeholder="formText.projectNameThaiPlaceholder"
              @input="filterThaiInput"
              required
            >
            <small class="form-text text-muted lang-hint">{{ formText.projectNameThaiHint }}</small>
          </div>
          <div class="form-group">
            <label class="sub-label">{{ formText.projectNameEnglishLabel }}</label>
            <input
              v-model="form.projectNameEnglish"
              type="text"
              class="form-control"
              :disabled="isProjectTitleDisabled"
              placeholder="Project Title in English"
              @input="filterEnglishInput"
              required
            >
            <small class="form-text text-muted lang-hint">{{ formText.projectNameEnglishHint }}</small>
          </div>
        </div>

        <div ref="strategic_alignment" :class="sectionClass('strategic_alignment')">
          <h6 class="section-title">{{ formText.section2Title }} <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <ProjectFundingTypeSection
            ref="fundingTypeSection"
            :funding-type-options="fundingTypeOptions"
            :selected-funding-type-option="selectedFundingTypeOption"
            :selected-funding-type-label="selectedFundingTypeLabel"
            :selected-funding-sub-type-label="selectedFundingSubTypeLabel"
            :funding-type="form.fundingType"
            :funding-sub-type="form.fundingSubType"
            :funding-sub-selection-status-class="fundingSubSelectionStatusClass"
            :funding-sub-selection-status-icon="fundingSubSelectionStatusIcon"
            :funding-sub-selection-status-text="fundingSubSelectionStatusText"
            :is-funding-sub-selection-complete="isFundingSubSelectionComplete"
            :is-funding-summary-pulsing="isFundingSummaryPulsing"
            :is-read-only="isReadOnly"
            :is-dark-theme="isDarkTheme"
            @funding-type-card-click="onFundingTypeCardClick"
            @funding-subtype-card-click="onFundingSubTypeCardClick"
          />
        </div>

        <div class="section mb-4">
          <h6 class="section-title">{{ formText.section3Title }}</h6>
          <ProjectCollaborationSection
            :records="collaborationRecords"
            :validation-count="collaborationValidationCount"
            :record-has-errors="collaborationRecordHasErrors"
            :field-has-error="collaborationFieldHasError"
            :is-read-only="isReadOnly"
            :is-dark-theme="isDarkTheme"
            @add-record="addCollaborationRecord"
            @remove-record="removeCollaborationRecord"
            @field-input="onCollaborationFieldInput"
            @field-blur="onCollaborationFieldBlur"
          />
        </div>

        <div class="section mb-4">
          <h6 class="section-title">{{ formText.section4Title }} <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <ProjectResearchTypeSection
            :research-type-options="researchTypeOptions"
            :research-type="form.researchType"
            :selected-research-type-label="selectedResearchTypeLabel"
            :is-research-type-selected="isResearchTypeSelected"
            :is-read-only="isReadOnly"
            :is-dark-theme="isDarkTheme"
            @research-type-card-click="onResearchTypeCardClick"
          />
        </div>

        <div class="section mb-4">
          <h6 class="section-title">{{ formText.section5Title }} <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor
            v-model="form.keywords"
            :is-read-only="isReadOnly"
            :is-dark-theme="isDarkTheme"
            :field-key="textEditorFieldConfig.keywords.key"
            :field-label="textEditorFieldConfig.keywords.label"
            :helper-text="textEditorFieldConfig.keywords.helperText"
            :placeholder="textEditorFieldConfig.keywords.placeholder"
            :min-height="textEditorFieldConfig.keywords.minHeight"
            :toolbar-preset="textEditorFieldConfig.keywords.toolbarPreset"
          />
        </div>

        <div ref="problem_significance" :class="sectionClass('problem_significance')">
          <h6 class="section-title">{{ formText.section6Title }} <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor
            v-model="form.problemSignificance"
            :is-read-only="isReadOnly"
            :is-dark-theme="isDarkTheme"
            :field-key="textEditorFieldConfig.problemSignificance.key"
            :field-label="textEditorFieldConfig.problemSignificance.label"
            :helper-text="textEditorFieldConfig.problemSignificance.helperText"
            :placeholder="textEditorFieldConfig.problemSignificance.placeholder"
            :min-height="textEditorFieldConfig.problemSignificance.minHeight"
            :toolbar-preset="textEditorFieldConfig.problemSignificance.toolbarPreset"
          />
        </div>

        <div ref="objectives" :class="sectionClass('objectives')">
          <h6 class="section-title">{{ formText.section7Title }} <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor
            v-model="form.objectives"
            :is-read-only="isReadOnly"
            :is-dark-theme="isDarkTheme"
            :field-key="textEditorFieldConfig.objectives.key"
            :field-label="textEditorFieldConfig.objectives.label"
            :helper-text="textEditorFieldConfig.objectives.helperText"
            :placeholder="textEditorFieldConfig.objectives.placeholder"
            :min-height="textEditorFieldConfig.objectives.minHeight"
            :toolbar-preset="textEditorFieldConfig.objectives.toolbarPreset"
          />
        </div>

        <div ref="literature_review" :class="sectionClass('literature_review')">
          <h6 class="section-title">{{ formText.section8Title }} <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor
            v-model="form.literatureReview"
            :is-read-only="isReadOnly"
            :is-dark-theme="isDarkTheme"
            :field-key="textEditorFieldConfig.literatureReview.key"
            :field-label="textEditorFieldConfig.literatureReview.label"
            :helper-text="textEditorFieldConfig.literatureReview.helperText"
            :placeholder="textEditorFieldConfig.literatureReview.placeholder"
            :min-height="textEditorFieldConfig.literatureReview.minHeight"
            :toolbar-preset="textEditorFieldConfig.literatureReview.toolbarPreset"
          />
        </div>

        <div class="section mb-4">
          <h6 class="section-title">{{ formText.section9Title }} <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor
            v-model="form.references"
            :is-read-only="isReadOnly"
            :is-dark-theme="isDarkTheme"
            :field-key="textEditorFieldConfig.references.key"
            :field-label="textEditorFieldConfig.references.label"
            :helper-text="textEditorFieldConfig.references.helperText"
            :placeholder="textEditorFieldConfig.references.placeholder"
            :min-height="textEditorFieldConfig.references.minHeight"
            :toolbar-preset="textEditorFieldConfig.references.toolbarPreset"
          />
        </div>

        <div ref="research_methodology" :class="sectionClass('research_methodology')">
          <h6 class="section-title">{{ formText.section10Title }} <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor
            v-model="form.researchMethodology"
            :is-read-only="isReadOnly"
            :is-dark-theme="isDarkTheme"
            :field-key="textEditorFieldConfig.researchMethodology.key"
            :field-label="textEditorFieldConfig.researchMethodology.label"
            :helper-text="textEditorFieldConfig.researchMethodology.helperText"
            :placeholder="textEditorFieldConfig.researchMethodology.placeholder"
            :min-height="textEditorFieldConfig.researchMethodology.minHeight"
            :toolbar-preset="textEditorFieldConfig.researchMethodology.toolbarPreset"
          />
        </div>

        <div class="section mb-4">
          <h6 class="section-title">{{ formText.section11Title }} <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor
            v-model="form.researchScope"
            :is-read-only="isReadOnly"
            :is-dark-theme="isDarkTheme"
            :field-key="textEditorFieldConfig.researchScope.key"
            :field-label="textEditorFieldConfig.researchScope.label"
            :helper-text="textEditorFieldConfig.researchScope.helperText"
            :placeholder="textEditorFieldConfig.researchScope.placeholder"
            :min-height="textEditorFieldConfig.researchScope.minHeight"
            :toolbar-preset="textEditorFieldConfig.researchScope.toolbarPreset"
          />
        </div>

        <div ref="work_plan" :class="sectionClass('work_plan')">
          <h6 class="section-title">{{ formText.section12Title }} <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <Section12 v-model="form.workPlan" :is-read-only="isReadOnly" />
        </div>

        <div class="section mb-4">
          <h6 class="section-title">{{ formText.section13Title }} <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor
            v-model="form.milestones"
            :is-read-only="isReadOnly"
            :is-dark-theme="isDarkTheme"
            :field-key="textEditorFieldConfig.milestones.key"
            :field-label="textEditorFieldConfig.milestones.label"
            :helper-text="textEditorFieldConfig.milestones.helperText"
            :placeholder="textEditorFieldConfig.milestones.placeholder"
            :min-height="textEditorFieldConfig.milestones.minHeight"
            :toolbar-preset="textEditorFieldConfig.milestones.toolbarPreset"
          />
        </div>

        <div ref="expected_outcomes" :class="sectionClass('expected_outcomes')">
          <h6 class="section-title">{{ formText.section14Title }} <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <ProjectExpectedOutcomesSection
            :funding-type="form.fundingType"
            :selected-outcome="form.selectedOutcome"
            :is-read-only="isReadOnly"
            :is-dark-theme="isDarkTheme"
            @outcome-card-click="onExpectedOutcomeCardClick"
          />
        </div>

        <div ref="integration" :class="sectionClass('integration')">
          <h6 class="section-title">{{ formText.section15Title }} <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor
            v-model="form.integration"
            :is-read-only="isReadOnly"
            :is-dark-theme="isDarkTheme"
            :field-key="textEditorFieldConfig.integration.key"
            :field-label="textEditorFieldConfig.integration.label"
            :helper-text="textEditorFieldConfig.integration.helperText"
            :placeholder="textEditorFieldConfig.integration.placeholder"
            :min-height="textEditorFieldConfig.integration.minHeight"
            :toolbar-preset="textEditorFieldConfig.integration.toolbarPreset"
          />
        </div>

        <div ref="transfer_level" :class="sectionClass('transfer_level')">
          <h6 class="section-title">{{ formText.section16Title }} <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <ProjectTransferLevelSection
            :transfer-level-options="transferLevelOptions"
            :transfer-level="form.transferLevel"
            :selected-transfer-level-label="selectedTransferLevelLabel"
            :is-transfer-level-selected="isTransferLevelSelected"
            :is-read-only="isReadOnly"
            :is-dark-theme="isDarkTheme"
            @transfer-level-card-click="onTransferLevelCardClick"
          />
        </div>

        <div ref="budget" :class="sectionClass('budget')">
          <h6 class="section-title">{{ formText.section17Title }} <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <BudgetReport
            v-if="shouldUseBudgetReport"
            :model-value="form.budget"
            :is-read-only="isReadOnly"
            :current-status="currentStatus"
          />
          <BudgetSectionDemo
            v-else
            ref="budgetSection"
            v-model="form.budget"
            :is-read-only="isReadOnly"
            :proposal-id="proposalId"
            :funding-type="form.fundingType"
            :funding-budget-config="fundingBudgetConfig"
            :budget-multiplier-config="budgetMultiplierConfig"
            :reset-token="budgetFundingResetToken"
            @update:modelValue="handleBudgetUpdate"
            @sticky-overlay-update="$emit('budget-sticky-summary-update', $event)"
            @upload-attachment="$emit('budget-attachment-upload', $event)"
            @open-attachment="$emit('budget-attachment-open', $event)"
            @attachment-meta-change="$emit('budget-attachment-meta-change', $event)"
            @remove-attachment="$emit('budget-attachment-remove', $event)"
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
import BudgetReport from './BudgetReport.vue'
import BudgetSectionDemo from './BudgetSectionDemo.vue'
import ResearchStandardSection from './ResearchStandardSection.vue'
import ProjectFundingTypeSection from './ProjectFundingTypeSection.vue'
import ProjectCollaborationSection from './ProjectCollaborationSection.vue'
import ProjectResearchTypeSection from './ProjectResearchTypeSection.vue'
import ProjectExpectedOutcomesSection from './ProjectExpectedOutcomesSection.vue'
import ProjectTransferLevelSection from './ProjectTransferLevelSection.vue'
import {
  normalizeFundingBudgetConfig,
  normalizeFundingBudgetKey
} from '@/ResearchFormRS/utils/fundingBudgetConfig'
import { RESEARCH_STANDARD_TEXT } from '@/ResearchFormRS/constants/researchStandard'

// Structured funding definitions reserved for future cross-section constraints
// (e.g. budget-cap rules) without changing template wiring.
const FUNDING_TYPE_OPTIONS = [
  {
    value: 'new-researcher',
    shortName: 'ทุนนักวิจัยใหม่',
    shortDescription: 'สำหรับนักวิจัยที่ยื่นโครงการสอดคล้องกับคุณวุฒิ สาขาวิชา หรือภาระงาน',
    officialText: 'โครงการสอดคล้องกับคุณวุฒิ สาขาวิชา หรือภาระงาน',
    subSectionTitle: 'เงื่อนไขโครงการ (เลือก 1)',
    constraintKey: 'funding.newResearcher',
    subOptions: [
      {
        value: 'qualification-alignment',
        shortName: 'สอดคล้องกับคุณวุฒิ/สาขาวิชา/ภาระงาน',
        shortDescription: 'ยืนยันว่าโครงการอยู่ในขอบเขตคุณวุฒิ สาขาวิชา หรือภาระงานของผู้วิจัย',
        officialText: 'โครงการสอดคล้องกับคุณวุฒิ สาขาวิชา หรือภาระงาน',
        constraintKey: 'funding.newResearcher.alignment'
      }
    ]
  },
  {
    value: 'researcher-development',
    shortName: 'ทุนพัฒนานักวิจัย',
    shortDescription: 'ทุนพัฒนานักวิจัยที่สอดคล้องกับยุทธศาสตร์การวิจัยและนวัตกรรม',
    officialText: 'ทุนพัฒนานักวิจัย / ทุนที่สอดคล้องกับยุทธศาสตร์การวิจัยและนวัตกรรม',
    subSectionTitle: 'กรอบการวิจัย (เลือก 1)',
    constraintKey: 'funding.researcherDevelopment',
    subOptions: [
      {
        value: 'economic-development',
        shortName: 'เศรษฐกิจสร้างสรรค์และการแข่งขัน',
        shortDescription: 'มุ่งสร้างเศรษฐกิจสร้างคุณค่า เพิ่มความสามารถการแข่งขัน และพึ่งพาตนเองอย่างยั่งยืน',
        officialText: 'การพัฒนาเศรษฐกิจไทยด้วยเศรษฐกิจสร้างคุณค่าและเศรษฐกิจสร้างสรรค์ ให้มีความสามารถในการแข่งขันและพึ่งพาตนเองได้อย่างยั่งยืน',
        constraintKey: 'funding.researcherDevelopment.economic'
      },
      {
        value: 'social-environment',
        shortName: 'สังคมและสิ่งแวดล้อม',
        shortDescription: 'ยกระดับสังคมและสิ่งแวดล้อมให้พัฒนาอย่างยั่งยืน และรับมือการเปลี่ยนแปลงของโลก',
        officialText: 'การยกระดับสังคมและสิ่งแวดล้อม ให้มีการพัฒนาอย่างยั่งยืน สามารถแก้ไขปัญหาท้าทายและปรับตัวให้ทันต่อพลวัตการเปลี่ยนแปลงของโลก',
        constraintKey: 'funding.researcherDevelopment.social'
      },
      {
        value: 'science-technology',
        shortName: 'วิทยาศาสตร์ เทคโนโลยี และนวัตกรรมขั้นสูง',
        shortDescription: 'พัฒนางานวิจัยและนวัตกรรมแนวหน้า เพื่อสร้างโอกาสใหม่และความพร้อมของประเทศ',
        officialText: 'การพัฒนาวิทยาศาสตร์ เทคโนโลยี การวิจัยและนวัตกรรม ระดับขั้นแนวหน้าที่ก้าวหน้าล้ำยุค เพื่อสร้างโอกาสใหม่และความพร้อม ของประเทศในอนาคต',
        constraintKey: 'funding.researcherDevelopment.science'
      },
      {
        value: 'human-resources',
        shortName: 'กำลังคนและสถาบันวิจัย',
        shortDescription: 'เสริมกำลังคนและสถาบันด้านวิจัยและนวัตกรรม ให้เป็นฐานขับเคลื่อนเศรษฐกิจและสังคม',
        officialText: 'การพัฒนากำลังคนและสถาบัน ด้านวิทยาศาสตร์ วิจัยและนวัตกรรม ให้เป็นฐานการขับเคลื่อนการพัฒนาเศรษฐกิจและสังคมของประเทศ',
        constraintKey: 'funding.researcherDevelopment.humanCapital'
      }
    ]
  },
  {
    value: 'strategic-research',
    shortName: 'ทุนวิจัยที่สอดคล้องกับยุทธศาสตร์',
    shortDescription: 'โครงการวิจัยที่สอดคล้องกับทิศทางยุทธศาสตร์ที่กำหนด',
    officialText: 'ทุนวิจัยที่สอดคล้องกับยุทธศาสตร์',
    subSectionTitle: '',
    constraintKey: 'funding.strategicResearch',
    subOptions: []
  },
  {
    value: 'industry-extension',
    shortName: 'ทุนต่อยอดสู่ภาคอุตสาหกรรม',
    shortDescription: 'มุ่งต่อยอดงานวิจัยและนวัตกรรมไปสู่การใช้ประโยชน์เชิงอุตสาหกรรม',
    officialText: 'ทุนต่อยอดสู่ภาคอุตสาหกรรม',
    subSectionTitle: 'กรอบการวิจัย (เลือก 1)',
    constraintKey: 'funding.industryExtension',
    subOptions: [
      {
        value: 'competitiveness',
        shortName: 'การวิจัยและนวัตกรรมเพื่อเพิ่มขีดความสามารถการแข่งขัน',
        shortDescription: 'ต่อยอดผลวิจัยและนวัตกรรมเพื่อเพิ่มขีดความสามารถในการแข่งขันของภาคอุตสาหกรรม',
        officialText: 'การวิจัยและนวัตกรรมเพื่อเพิ่มขีดความสามารถการแข่งขัน',
        constraintKey: 'funding.industryExtension.competitiveness'
      }
    ]
  }
]

const RESEARCH_TYPE_OPTIONS = [
  {
    value: 'science-technology',
    label: 'ด้านวิทยาศาสตร์และเทคโนโลยี',
    description: 'เน้นองค์ความรู้ เทคโนโลยี หรือนวัตกรรมเชิงวิทยาศาสตร์'
  },
  {
    value: 'health-science',
    label: 'ด้านวิทยาศาสตร์สุขภาพ',
    description: 'เน้นการวิจัยด้านสุขภาพ การแพทย์ หรือคุณภาพชีวิต'
  },
  {
    value: 'social-humanities',
    label: 'ด้านสังคมศาสตร์และมนุษยศาสตร์',
    description: 'เน้นประเด็นสังคม วัฒนธรรม นโยบาย หรือมนุษยศาสตร์'
  }
]

const TRANSFER_LEVEL_OPTIONS = [
  {
    value: 'national-international',
    label: 'ระดับภูมิภาค/ประเทศ/นานาชาติ',
    description: 'สามารถนำไปถ่ายทอดเป็นต้นแบบและแนวทางได้ในระดับภูมิภาค ประเทศ หรือ นานาชาติ'
  },
  {
    value: 'community-provincial',
    label: 'ระดับกลุ่มอาชีพ/ชุมชน/จังหวัด',
    description: 'สามารถนำไปถ่ายทอดเป็นต้นแบบและแนวทางได้เฉพาะกลุ่มอาชีพ ชุมชน หรือจังหวัด'
  },
  {
    value: 'none',
    label: 'ยังไม่มีการถ่ายทอดสู่สังคม',
    description: 'ผลลัพธ์โครงการยังไม่มีการนำไปถ่ายทอดสู่สังคมในระยะนี้'
  }
]

const TEXT_EDITOR_FIELD_CONFIG = {
  keywords: {
    key: 'keywords',
    label: '5. คำสำคัญ (Keywords)',
    helperText: 'ระบุคำสำคัญทั้งภาษาไทยและภาษาอังกฤษ และควรคั่นคำด้วยเครื่องหมายจุลภาค (,)',
    placeholder: 'ตัวอย่าง: การจัดการน้ำชุมชน, เกษตรอัจฉริยะ, Community Water Management, Smart Agriculture',
    minHeight: 100,
    toolbarPreset: 'minimal'
  },
  problemSignificance: {
    key: 'problemSignificance',
    label: '6. ความสำคัญที่มาของปัญหาที่ทำการวิจัย และกรอบแนวความคิด',
    helperText: 'อธิบายที่มาและความสำคัญของปัญหา สถานการณ์ปัจจุบัน ช่องว่างองค์ความรู้ และกรอบแนวความคิดของงานวิจัย',
    placeholder: 'ควรอธิบายสถานการณ์ปัจจุบันของปัญหา ผลกระทบที่เกิดขึ้น ช่องว่างของความรู้จากงานเดิม และแนวคิดที่ใช้พัฒนาโครงการวิจัยนี้',
    minHeight: 280,
    toolbarPreset: 'basic'
  },
  objectives: {
    key: 'objectives',
    label: '7. วัตถุประสงค์ของโครงการวิจัย',
    helperText: 'เขียนวัตถุประสงค์เป็นข้อ ๆ ให้ชัดเจน วัดผลได้ และสอดคล้องกับชื่อโครงการ',
    placeholder: '1) เพื่อศึกษา...\n2) เพื่อพัฒนา...\n3) เพื่อประเมิน...',
    minHeight: 180,
    toolbarPreset: 'list'
  },
  literatureReview: {
    key: 'literatureReview',
    label: '8. การทบทวนวรรณกรรม ผลงานวิจัยต่างๆ ที่เกี่ยวข้อง',
    helperText: 'สรุปทฤษฎีและงานวิจัยที่เกี่ยวข้อง พร้อมระบุช่องว่างของงานวิจัยที่โครงการนี้จะเติมเต็ม',
    placeholder: 'สรุปว่าใครศึกษาอะไร ใช้วิธีใด พบผลอย่างไร และยังขาดประเด็นใดที่โครงการนี้จะต่อยอด',
    minHeight: 280,
    toolbarPreset: 'methodology'
  },
  references: {
    key: 'references',
    label: '9. เอกสารอ้างอิงของโครงการวิจัย',
    helperText: 'จัดรูปแบบเอกสารอ้างอิงตามระบบสากลที่ใช้ในสาขา (เช่น APA, IEEE หรือ Vancouver) ให้สม่ำเสมอทั้งเอกสาร',
    placeholder: 'ตัวอย่าง: สมชาย ใจดี. (2568). ชื่อบทความ. ชื่อวารสาร, 12(3), 45-60.\nSmith, J. (2025). Article title. Journal Name, 12(3), 45-60.',
    minHeight: 220,
    toolbarPreset: 'reference'
  },
  researchMethodology: {
    key: 'researchMethodology',
    label: '10. กระบวนการและวิธีการดำเนินโครงการวิจัย สถานที่ทำการทดลองและเก็บข้อมูล',
    helperText: 'ระบุให้ครบ: วิธีวิจัย, พื้นที่ศึกษา, ประชากร/กลุ่มตัวอย่าง, วิธีสุ่มตัวอย่าง, เครื่องมือเก็บข้อมูล, วิธีวิเคราะห์ข้อมูล และหากใช้แบบสอบถาม ควรแนบตัวอย่างแบบสอบถาม',
    placeholder: 'โครงลำดับที่แนะนำ:\n1) รูปแบบการวิจัย\n2) พื้นที่ศึกษาและช่วงเวลา\n3) ประชากร/กลุ่มตัวอย่างและวิธีสุ่มตัวอย่าง\n4) เครื่องมือและวิธีเก็บข้อมูล\n5) วิธีวิเคราะห์ข้อมูล',
    minHeight: 360,
    toolbarPreset: 'methodology'
  },
  researchScope: {
    key: 'researchScope',
    label: '11. ขอบเขตของโครงการวิจัย',
    helperText: 'กำหนดขอบเขตให้เชื่อมโยงกับชื่อโครงการและวัตถุประสงค์ โดยครอบคลุมด้านเนื้อหา พื้นที่ ประชากร/กลุ่มตัวอย่าง และเวลา',
    placeholder: 'ตัวอย่าง:\n- ขอบเขตด้านเนื้อหา: ...\n- ขอบเขตด้านพื้นที่: ...\n- ขอบเขตด้านประชากร/กลุ่มตัวอย่าง: ...\n- ขอบเขตด้านเวลา: ...',
    minHeight: 190,
    toolbarPreset: 'list'
  },
  milestones: {
    key: 'milestones',
    label: '13. ผลงานตามระยะเวลาการรายงานความก้าวหน้างานวิจัย',
    helperText: 'ระบุผลงานหรือผลลัพธ์ที่คาดว่าจะได้รับเมื่อดำเนินงานได้ประมาณ 50% ของแผน ไม่ใช่ระบุเฉพาะกิจกรรมที่ดำเนินการ',
    placeholder: 'ตัวอย่างผลลัพธ์: ได้ข้อมูลภาคสนามครบ 50%, ได้ต้นแบบฉบับที่ 1, ได้ผลวิเคราะห์เบื้องต้นพร้อมข้อค้นพบสำคัญ',
    minHeight: 180,
    toolbarPreset: 'list'
  },
  integration: {
    key: 'integration',
    label: '15. การบูรณาการงานวิจัย',
    helperText: 'อธิบายได้ทั้งกรณีมีการบูรณาการข้ามศาสตร์/หน่วยงาน และกรณีไม่มีการบูรณาการ โดยระบุเหตุผลอย่างชัดเจน',
    placeholder: 'กรณีมี: โครงการบูรณาการระหว่าง... โดยแต่ละสาขารับผิดชอบ...\nกรณีไม่มี: โครงการนี้เป็นงานเฉพาะสาขา... จึงยังไม่จำเป็นต้องบูรณาการ',
    minHeight: 180,
    toolbarPreset: 'basic'
  }
}


const FUNDING_TYPE_OPTIONS_EN = [
  {
    value: 'new-researcher',
    shortName: 'New Researcher Grant',
    shortDescription: 'For researchers submitting projects aligned with their qualifications, discipline, or workload.',
    officialText: 'Project aligned with qualifications, discipline, or workload',
    subSectionTitle: 'Project condition (select 1)',
    constraintKey: 'funding.newResearcher',
    subOptions: [
      {
        value: 'qualification-alignment',
        shortName: 'Aligned with qualifications/discipline/workload',
        shortDescription: 'Confirms that the project is within the researcher\'s qualifications, discipline, or workload.',
        officialText: 'Project aligned with qualifications, discipline, or workload',
        constraintKey: 'funding.newResearcher.alignment'
      }
    ]
  },
  {
    value: 'researcher-development',
    shortName: 'Researcher Development Grant',
    shortDescription: 'Supports projects aligned with research and innovation strategy.',
    officialText: 'Researcher development grant / grant aligned with research and innovation strategy',
    subSectionTitle: 'Research framework (select 1)',
    constraintKey: 'funding.researcherDevelopment',
    subOptions: [
      {
        value: 'economic-development',
        shortName: 'Creative economy and competitiveness',
        shortDescription: 'Builds a value-based economy, competitiveness, and sustainable self-reliance.',
        officialText: 'Development of the Thai economy through a value-based and creative economy with competitiveness and sustainable self-reliance',
        constraintKey: 'funding.researcherDevelopment.economic'
      },
      {
        value: 'social-environment',
        shortName: 'Society and environment',
        shortDescription: 'Advances sustainable social and environmental development and adaptation to global change.',
        officialText: 'Advancing society and the environment toward sustainable development and resilience to global change',
        constraintKey: 'funding.researcherDevelopment.social'
      },
      {
        value: 'science-technology',
        shortName: 'Advanced science, technology, and innovation',
        shortDescription: 'Develops frontier research and innovation to create new opportunities and future readiness.',
        officialText: 'Advancement of science, technology, research, and innovation at the frontier to create future opportunities and readiness',
        constraintKey: 'funding.researcherDevelopment.science'
      },
      {
        value: 'human-resources',
        shortName: 'Human capital and research institutions',
        shortDescription: 'Strengthens research talent and institutions as a foundation for economic and social development.',
        officialText: 'Development of human capital and institutions in science, research, and innovation as a foundation for national economic and social development',
        constraintKey: 'funding.researcherDevelopment.humanCapital'
      }
    ]
  },
  {
    value: 'strategic-research',
    shortName: 'Strategic Research Grant',
    shortDescription: 'Research projects aligned with defined strategic directions.',
    officialText: 'Strategic research grant',
    subSectionTitle: '',
    constraintKey: 'funding.strategicResearch',
    subOptions: []
  },
  {
    value: 'industry-extension',
    shortName: 'Industry Extension Grant',
    shortDescription: 'Extends research and innovation toward industrial application.',
    officialText: 'Industry extension grant',
    subSectionTitle: 'Research framework (select 1)',
    constraintKey: 'funding.industryExtension',
    subOptions: [
      {
        value: 'competitiveness',
        shortName: 'Research and innovation for competitiveness',
        shortDescription: 'Builds on research outcomes and innovation to improve industrial competitiveness.',
        officialText: 'Research and innovation for improved competitiveness',
        constraintKey: 'funding.industryExtension.competitiveness'
      }
    ]
  }
]

const RESEARCH_TYPE_OPTIONS_EN = [
  {
    value: 'science-technology',
    label: 'Science and Technology',
    description: 'Focuses on scientific knowledge, technology, or science-based innovation.'
  },
  {
    value: 'health-science',
    label: 'Health Sciences',
    description: 'Focuses on health, medicine, or quality-of-life research.'
  },
  {
    value: 'social-humanities',
    label: 'Social Sciences and Humanities',
    description: 'Focuses on social, cultural, policy, or humanities issues.'
  }
]

const TRANSFER_LEVEL_OPTIONS_EN = [
  {
    value: 'national-international',
    label: 'Regional / National / International',
    description: 'Can be transferred as a model or guideline at the regional, national, or international level.'
  },
  {
    value: 'community-provincial',
    label: 'Occupational Group / Community / Provincial',
    description: 'Can be transferred as a model or guideline for occupational groups, communities, or provinces.'
  },
  {
    value: 'none',
    label: 'No social transfer yet',
    description: 'The project outcomes have not yet been transferred to society at this stage.'
  }
]

const TEXT_EDITOR_FIELD_CONFIG_EN = {
  keywords: {
    key: 'keywords',
    label: '5. Keywords',
    helperText: 'Provide keywords in both Thai and English, separated by commas (,).',
    placeholder: 'Example: Community Water Management, Smart Agriculture',
    minHeight: 100,
    toolbarPreset: 'minimal'
  },
  problemSignificance: {
    key: 'problemSignificance',
    label: '6. Problem significance and conceptual framework',
    helperText: 'Explain the background, significance, current situation, knowledge gap, and conceptual framework of the study.',
    placeholder: 'Describe the current situation, impacts, knowledge gap from prior work, and the concept used to develop this project.',
    minHeight: 220,
    toolbarPreset: 'basic'
  },
  objectives: {
    key: 'objectives',
    label: '7. Research objectives',
    helperText: 'Write clear, measurable objectives that align with the project title.',
    placeholder: '1) To study...\n2) To develop...\n3) To evaluate...',
    minHeight: 160,
    toolbarPreset: 'basic'
  },
  literatureReview: {
    key: 'literatureReview',
    label: '8. Literature review and related research',
    helperText: 'Summarize theories and related studies, and identify the gap this project addresses.',
    placeholder: 'Summarize who studied what, using which methods, the findings, and the gap this project extends.',
    minHeight: 220,
    toolbarPreset: 'basic'
  },
  references: {
    key: 'references',
    label: '9. References',
    helperText: 'Format references consistently using an accepted standard in the discipline, such as APA, IEEE, or Vancouver.',
    placeholder: 'Example: Smith, J. (2025). Article title. Journal Name, 12(3), 45-60.',
    minHeight: 180,
    toolbarPreset: 'basic'
  },
  researchMethodology: {
    key: 'researchMethodology',
    label: '10. Research process and methodology, study site, and data collection',
    helperText: 'Specify research design, study area, population/sample, sampling method, instruments, analysis method, and attach a sample questionnaire if used.',
    placeholder: 'Suggested structure:\n1) Research design\n2) Study area and period\n3) Population/sample and sampling method\n4) Instruments and data collection\n5) Data analysis',
    minHeight: 260,
    toolbarPreset: 'basic'
  },
  researchScope: {
    key: 'researchScope',
    label: '11. Research scope',
    helperText: 'Define the scope in line with the project title and objectives, including content, area, population/sample, and time.',
    placeholder: 'Example:\n- Content scope: ...\n- Area scope: ...\n- Population/sample scope: ...\n- Time scope: ...',
    minHeight: 180,
    toolbarPreset: 'basic'
  },
  milestones: {
    key: 'milestones',
    label: '13. Outputs by the progress-reporting period',
    helperText: 'Describe expected outputs or results when the project reaches around 50% of the plan, not only completed activities.',
    placeholder: 'Example outcomes: 50% of field data completed, prototype version 1 completed, preliminary analysis with key findings ready.',
    minHeight: 160,
    toolbarPreset: 'basic'
  },
  integration: {
    key: 'integration',
    label: '15. Research integration',
    helperText: 'Explain either interdisciplinary/organizational integration or why integration is not required, with clear reasons.',
    placeholder: 'If yes: The project integrates ... with each discipline responsible for ...\nIf no: This project is discipline-specific, so integration is not yet necessary.',
    minHeight: 180,
    toolbarPreset: 'basic'
  }
}

export default {
  name: 'ProjectDetailsForm',
  components: {
    TextEditor,
    Section12,
    BudgetReport,
    BudgetSectionDemo,
    ResearchStandardSection,
    ProjectFundingTypeSection,
    ProjectCollaborationSection,
    ProjectResearchTypeSection,
    ProjectExpectedOutcomesSection,
    ProjectTransferLevelSection
  },
  // รับค่า isReadOnly มาจากไฟล์แม่ (ResearchForm.vue)
  props: {
    isReadOnly: {
      type: Boolean,
      default: false
    },
    currentStatus: {
      type: String,
      default: ''
    },
    proposalId: {
      type: [String, Number],
      default: ''
    },
    disableProjectTitleSection: {
      type: Boolean,
      default: false
    },
    revisionHighlightSections: {
      type: Array,
      default: () => []
    },
    fundingBudgetConfig: {
      type: Array,
      default: () => []
    },
    budgetMultiplierConfig: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    isDarkTheme() {
      return Boolean(this.$store && this.$store.state && this.$store.state.darkMode)
    },
    normalizedCurrentStatus() {
      return String(this.currentStatus || '').trim().toLowerCase()
    },
    isEnglishLocale() {
      const locale = String((this.$i18n && this.$i18n.locale) || '').trim().toLowerCase()
      return locale === 'en'
    },
    formText() {
      if (this.isEnglishLocale) {
        return {
          cardTitle: '1-19 Project Details',
          section1Title: '1. Project Title',
          section2Title: '2. Funding Type',
          section3Title: '3. Collaborating Organization',
          section4Title: '4. Research Type',
          section5Title: '5. Keywords',
          section6Title: '6. Problem Significance and Concept',
          section7Title: '7. Objectives',
          section8Title: '8. Literature Review',
          section9Title: '9. References',
          section10Title: '10. Research Methodology',
          section11Title: '11. Research Scope',
          section12Title: '12. Work Plan',
          section13Title: '13. Progress-Reporting Outputs',
          section14Title: '14. Expected Outcomes',
          section15Title: '15. Research Integration',
          section16Title: '16. Level of Social Transfer',
          section17Title: '17. Project Budget',
          projectNameThaiLabel: 'Project title (Thai)',
          projectNameThaiPlaceholder: 'Enter the project title in Thai',
          projectNameThaiHint: 'Please enter the project title in Thai. Numbers and symbols are allowed. *',
          projectNameEnglishLabel: 'Project title (English)',
          projectNameEnglishHint: 'Please enter English only. *'
        }
      }
      return {
        cardTitle: '1-19 ?????????????????',
        section1Title: '1. ???????????',
        section2Title: '2. ?????????',
        section3Title: '3. ??????????????????',
        section4Title: '4. ??????????????',
        section5Title: '5. ??????? (Keywords)',
        section6Title: '6. ??????????????????????????',
        section7Title: '7. ????????????',
        section8Title: '8. ?????????????',
        section9Title: '9. ?????????????',
        section10Title: '10. ??????????????????',
        section11Title: '11. ??????????????',
        section12Title: '12. ???????????????',
        section13Title: '13. ?????????????????????????',
        section14Title: '14. ????????????????????????',
        section15Title: '15. ???????????????????',
        section16Title: '16. ???????????????????????',
        section17Title: '17. ???????????????',
        projectNameThaiLabel: '??????????? (???????)',
        projectNameThaiPlaceholder: '???????????????????????????',
        projectNameThaiHint: '??????????????????????????? (??????????????????????????????) *',
        projectNameEnglishLabel: '??????????? (??????????)',
        projectNameEnglishHint: '??????????????????????????????? *'
      }
    },
    isCommitteeReviewRoute() {
      const path = String((this.$route && this.$route.path) || '').trim().toLowerCase()
      return path.indexOf('/committee/') !== -1 || path.indexOf('/chairman/') !== -1 || path.indexOf('/review/proposals') !== -1
    },
    shouldUseBudgetReport() {
      return (
        this.isCommitteeReviewRoute &&
        this.isReadOnly &&
        this.normalizedCurrentStatus !== '' &&
        this.normalizedCurrentStatus !== 'draft'
      )
    },

    isProjectTitleDisabled() {
      return this.isReadOnly || this.disableProjectTitleSection
    },

    normalizedFundingBudgetConfig() {
      return normalizeFundingBudgetConfig(this.fundingBudgetConfig, { fallbackToDefault: false })
    },

    fundingTypeOptions() {
      return this.buildFundingTypeOptions(this.normalizedFundingBudgetConfig)
    },

    selectedFundingTypeOption() {
      const fundingTypeKey = normalizeFundingBudgetKey(this.form.fundingType)
      return this.fundingTypeOptions.find((item) => item.value === fundingTypeKey) || null
    },

    selectedFundingSubTypeOption() {
      const parent = this.selectedFundingTypeOption
      if (!parent || !Array.isArray(parent.subOptions)) return null
      const fundingSubTypeKey = normalizeFundingBudgetKey(this.form.fundingSubType)
      return parent.subOptions.find((item) => item.value === fundingSubTypeKey) || null
    },

    selectedFundingTypeLabel() {
      const parent = this.selectedFundingTypeOption
      return parent ? parent.shortName : '-'
    },

    selectedFundingSubTypeLabel() {
      const child = this.selectedFundingSubTypeOption
      return child ? child.shortName : ''
    },

    isFundingSubSelectionComplete() {
      if (!this.selectedFundingTypeOption || !this.selectedFundingTypeOption.subOptions.length) return true
      return Boolean(this.selectedFundingSubTypeLabel)
    },

    fundingSubSelectionStatusText() {
      return this.isFundingSubSelectionComplete ? (this.isEnglishLocale ? 'Complete' : '????????????') : (this.isEnglishLocale ? 'Incomplete' : '?????????')
    },

    fundingSubSelectionStatusIcon() {
      return this.isFundingSubSelectionComplete ? '✓' : '!'
    },

    fundingSubSelectionStatusClass() {
      return this.isFundingSubSelectionComplete ? 'is-complete' : 'is-incomplete'
    },

    fundingSelectionContext() {
      const parent = this.selectedFundingTypeOption
      const child = this.selectedFundingSubTypeOption
      return {
        fundingType: this.form.fundingType || '',
        fundingSubType: this.form.fundingSubType || '',
        fundingTypeRuleKey: parent ? parent.constraintKey : '',
        fundingSubTypeRuleKey: child ? child.constraintKey : ''
      }
    },

    researchTypeOptions() {
      return this.isEnglishLocale ? RESEARCH_TYPE_OPTIONS_EN : RESEARCH_TYPE_OPTIONS
    },

    selectedResearchTypeOption() {
      return this.researchTypeOptions.find((item) => item.value === this.form.researchType) || null
    },

    selectedResearchTypeLabel() {
      return this.selectedResearchTypeOption ? this.selectedResearchTypeOption.label : ''
    },

    isResearchTypeSelected() {
      return Boolean(this.selectedResearchTypeOption)
    },

    transferLevelOptions() {
      return this.isEnglishLocale ? TRANSFER_LEVEL_OPTIONS_EN : TRANSFER_LEVEL_OPTIONS
    },

    selectedTransferLevelOption() {
      return this.transferLevelOptions.find((item) => item.value === this.form.transferLevel) || null
    },

    selectedTransferLevelLabel() {
      return this.selectedTransferLevelOption ? this.selectedTransferLevelOption.label : ''
    },

    isTransferLevelSelected() {
      return Boolean(this.selectedTransferLevelOption)
    },

    textEditorFieldConfig() {
      return this.isEnglishLocale ? TEXT_EDITOR_FIELD_CONFIG_EN : TEXT_EDITOR_FIELD_CONFIG
    },

    collaborationValidationCount() {
      return this.collaborationRecords.filter((record) => this.collaborationRecordHasErrors(record)).length
    }
  },
  data() {
    return {
      isHydrating: false,
      suppressFundingWatcher: false,
      budgetFundingResetToken: 0,
      highlightedSectionKey: '',
      highlightTimerId: null,
      isFundingSummaryPulsing: false,
      fundingSummaryPulseTimerId: null,
      nextCollaborationUid: 1,
      collaborationRecords: [],
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
          categories: [],
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
        this.form.budget = {
          categories: [],
          grandTotal: 0
        };
        this.budgetFundingResetToken += 1;
        this.focusFundingSubStepIfNeeded(newVal)
      }
    },
    'form.fundingSubType'(newVal, oldVal) {
      if (this.isHydrating) return
      if (newVal !== oldVal) {
        this.pulseFundingSummary()
      }
    },
    fundingBudgetConfig: {
      deep: true,
      handler() {
        if (this.isHydrating) return
        const normalizedFundingSubType = this.normalizeFundingSubTypeForType(this.form.fundingType, this.form.fundingSubType)
        if (normalizedFundingSubType !== this.form.fundingSubType) {
          this.form.fundingSubType = normalizedFundingSubType
        }
      }
    }
  },
  mounted() {
    this.hydrateCollaborationRecordsFromForm()
  },
  beforeDestroy() {
    if (this.highlightTimerId) {
      clearTimeout(this.highlightTimerId)
      this.highlightTimerId = null
    }
    if (this.fundingSummaryPulseTimerId) {
      clearTimeout(this.fundingSummaryPulseTimerId)
      this.fundingSummaryPulseTimerId = null
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
    buildFundingSubOptions(typeKey, configSubOptions, fallbackSubOptions = []) {
      const fallbackMap = new Map(
        (Array.isArray(fallbackSubOptions) ? fallbackSubOptions : []).map(item => [
          normalizeFundingBudgetKey(item && item.value),
          item
        ])
      )
      const source = Array.isArray(configSubOptions) ? configSubOptions : []

      return source.map((subOption, subIndex) => {
        const subTypeKey = normalizeFundingBudgetKey(subOption && subOption.key)
        const fallbackOption = fallbackMap.get(subTypeKey) || {}
        const fallbackValue = normalizeFundingBudgetKey(fallbackOption && fallbackOption.value)
        const value = subTypeKey || fallbackValue || `${typeKey || 'funding'}-sub-${subIndex + 1}`
        const shortName = String(
          (this.isEnglishLocale ? '' : (subOption && subOption.label)) ||
          fallbackOption.shortName ||
          fallbackOption.label ||
          ''
        ).trim() || (this.isEnglishLocale ? `Sub grant ${subIndex + 1}` : `??????? ${subIndex + 1}`)
        const officialText = String(
          fallbackOption.officialText ||
          shortName
        ).trim()
        const shortDescription = String(fallbackOption.shortDescription || '').trim()
        const constraintKey = fallbackOption.constraintKey || `funding.${typeKey || 'custom'}.${value}`

        return {
          ...fallbackOption,
          value,
          shortName,
          officialText,
          shortDescription,
          constraintKey
        }
      }).filter(option => Boolean(option && option.value))
    },
    buildFundingTypeOptions(config) {
      const normalizedConfig = Array.isArray(config) ? config : []
      if (!normalizedConfig.length) return this.isEnglishLocale ? FUNDING_TYPE_OPTIONS_EN : FUNDING_TYPE_OPTIONS

      const fallbackMap = new Map(
        (this.isEnglishLocale ? FUNDING_TYPE_OPTIONS_EN : FUNDING_TYPE_OPTIONS).map(item => [normalizeFundingBudgetKey(item && item.value), item])
      )

      return normalizedConfig.map((fundingType, typeIndex) => {
        const typeKey = normalizeFundingBudgetKey(fundingType && fundingType.key)
        const fallbackType = fallbackMap.get(typeKey) || {}
        const fallbackValue = normalizeFundingBudgetKey(fallbackType && fallbackType.value)
        const value = typeKey || fallbackValue || `funding-type-${typeIndex + 1}`
        const budgetLimit = Number(fundingType && fundingType.budgetLimit)
        const shortName = String(
          (this.isEnglishLocale ? '' : (fundingType && fundingType.label)) ||
          fallbackType.shortName ||
          fallbackType.label ||
          ''
        ).trim() || (this.isEnglishLocale ? `Funding type ${typeIndex + 1}` : `????????? ${typeIndex + 1}`)
        const shortDescription = String(fallbackType.shortDescription || '').trim()
        const officialText = String(
          fallbackType.officialText ||
          shortName
        ).trim()
        const fallbackSubOptions = Array.isArray(fallbackType.subOptions) ? fallbackType.subOptions : []
        const mappedSubOptions = this.buildFundingSubOptions(
          value,
          fundingType && fundingType.subOptions,
          fallbackSubOptions
        )
        const fallbackSubSectionTitle = String(fallbackType.subSectionTitle || '').trim()
        const subSectionTitle = fallbackSubSectionTitle || (mappedSubOptions.length ? (this.isEnglishLocale ? 'Research framework (select 1)' : '???????????? (????? 1)') : '')
        const constraintKey = fallbackType.constraintKey || `funding.${value}`

        return {
          ...fallbackType,
          value,
          budgetLimit: Number.isFinite(budgetLimit) && budgetLimit > 0 ? budgetLimit : 0,
          shortName,
          shortDescription,
          officialText,
          subSectionTitle,
          constraintKey,
          subOptions: mappedSubOptions
        }
      }).filter(option => Boolean(option && option.value))
    },
    getFundingTypeOptionByValue(fundingType) {
      const key = normalizeFundingBudgetKey(fundingType)
      return this.fundingTypeOptions.find((item) => item.value === key) || null
    },
    normalizeFundingSubTypeForType(fundingType, fundingSubType) {
      const typeKey = normalizeFundingBudgetKey(fundingType)
      const subTypeKey = normalizeFundingBudgetKey(fundingSubType)
      if (!typeKey) return ''
      const parent = this.getFundingTypeOptionByValue(typeKey)
      if (!parent || !Array.isArray(parent.subOptions) || parent.subOptions.length === 0) return ''
      const allowedValues = parent.subOptions.map((item) => item.value)
      if (allowedValues.includes(subTypeKey)) return subTypeKey

      const legacyAliasMap = {
        'new-researcher': {
          preferred: 'qualification-alignment',
          aliases: ['qualification-alignment', 'basic-research', 'applied-research', 'interdisciplinary']
        },
        'industry-extension': {
          preferred: 'competitiveness',
          aliases: ['competitiveness', 'product-development', 'process-innovation', 'technology-transfer']
        }
      }
      const legacyConfig = legacyAliasMap[typeKey]
      if (!legacyConfig || !subTypeKey) return ''
      if (!legacyConfig.aliases.includes(subTypeKey)) return ''

      if (allowedValues.includes(legacyConfig.preferred)) return legacyConfig.preferred
      const compatibleAlias = allowedValues.find((value) => legacyConfig.aliases.includes(value))
      return compatibleAlias || ''
    },
    onFundingSubTypeCardClick(subTypeValue, event) {
      if (this.isReadOnly) return
      const target = event && event.target
      if (target && typeof target.closest === 'function') {
        if (target.closest('a, button, details, summary')) return
      }
      this.form.fundingSubType = subTypeValue
    },
    onFundingTypeCardClick(typeValue, event) {
      if (this.isReadOnly) return
      const target = event && event.target
      if (target && typeof target.closest === 'function') {
        if (target.closest('a, button, details, summary')) return
      }
      this.form.fundingType = typeValue
    },
    onResearchTypeCardClick(typeValue, event) {
      if (this.isReadOnly) return
      const target = event && event.target
      if (target && typeof target.closest === 'function') {
        if (target.closest('a, button, details, summary')) return
      }
      this.form.researchType = typeValue
    },
    onTransferLevelCardClick(transferLevelValue, event) {
      if (this.isReadOnly) return
      const target = event && event.target
      if (target && typeof target.closest === 'function') {
        if (target.closest('a, button, details, summary')) return
      }
      this.form.transferLevel = transferLevelValue
    },
    onExpectedOutcomeCardClick(outcomeValue, event) {
      if (this.isReadOnly) return
      const target = event && event.target
      if (target && typeof target.closest === 'function') {
        if (target.closest('a, button, details, summary')) return
      }
      this.form.selectedOutcome = outcomeValue
    },
    createCollaborationRecord(seed = {}) {
      const touchedSeed = seed && typeof seed.touched === 'object' ? seed.touched : {}
      const uid = Number(seed.uid)
      const nextUid = Number.isFinite(uid) && uid > 0 ? uid : this.nextCollaborationUid++
      if (nextUid >= this.nextCollaborationUid) {
        this.nextCollaborationUid = nextUid + 1
      }
      return {
        uid: nextUid,
        personName: String(seed.personName || '').trim(),
        organizationName: String(seed.organizationName || '').trim(),
        address: String(seed.address || '').trim(),
        collaborationNature: String(seed.collaborationNature || '').trim(),
        touched: {
          personName: Boolean(touchedSeed.personName),
          organizationName: Boolean(touchedSeed.organizationName),
          address: Boolean(touchedSeed.address),
          collaborationNature: Boolean(touchedSeed.collaborationNature)
        }
      }
    },
    normalizeCollaborationRecord(record = {}) {
      return {
        personName: String(record.personName || '').trim(),
        organizationName: String(record.organizationName || '').trim(),
        address: String(record.address || '').trim(),
        collaborationNature: String(record.collaborationNature || '').trim()
      }
    },
    collaborationRecordHasAnyValue(record = {}) {
      const normalized = this.normalizeCollaborationRecord(record)
      return Object.keys(normalized).some((key) => Boolean(normalized[key]))
    },
    collaborationFieldHasError(record = {}, fieldName = '') {
      const normalized = this.normalizeCollaborationRecord(record)
      const hasAnyValue = Object.keys(normalized).some((key) => Boolean(normalized[key]))
      const isFieldTouched = Boolean(record && record.touched && record.touched[fieldName])
      if (!hasAnyValue && !isFieldTouched) return false
      return !normalized[fieldName]
    },
    collaborationRecordHasErrors(record = {}) {
      return ['personName', 'organizationName', 'address', 'collaborationNature']
        .some((field) => this.collaborationFieldHasError(record, field))
    },
    markCollaborationFieldTouched(record = {}, fieldName = '') {
      if (!record || !record.touched || !Object.prototype.hasOwnProperty.call(record.touched, fieldName)) return
      this.$set(record.touched, fieldName, true)
    },
    onCollaborationFieldBlur(record, fieldName) {
      this.markCollaborationFieldTouched(record, fieldName)
      this.syncCollaborationAgencyFromRecords()
    },
    onCollaborationRecordInput() {
      this.syncCollaborationAgencyFromRecords()
    },
    onCollaborationFieldInput(record, fieldName, value) {
      if (!record || !fieldName) return
      this.$set(record, fieldName, String(value || ''))
      this.onCollaborationRecordInput()
    },
    addCollaborationRecord(seed = null) {
      if (this.isReadOnly) return
      const next = this.createCollaborationRecord(seed || {})
      this.collaborationRecords.push(next)
      this.syncCollaborationAgencyFromRecords()
    },
    removeCollaborationRecord(index) {
      if (this.isReadOnly) return
      if (index < 0 || index >= this.collaborationRecords.length) return
      this.collaborationRecords.splice(index, 1)
      this.syncCollaborationAgencyFromRecords()
    },
    stripCollaborationFieldValue(value) {
      return String(value || '').replace(/\s+/g, ' ').trim()
    },
    serializeCollaborationRecords(records = []) {
      const normalized = (Array.isArray(records) ? records : [])
        .map((item) => this.normalizeCollaborationRecord(item))
        .filter((item) => Object.keys(item).some((key) => Boolean(item[key])))

      if (!normalized.length) return ''

      return normalized.map((item, index) => ([
        `รายการความร่วมมือที่ ${index + 1}`,
        `ชื่อบุคคล: ${this.stripCollaborationFieldValue(item.personName)}`,
        `ชื่อหน่วยงาน: ${this.stripCollaborationFieldValue(item.organizationName)}`,
        `ที่อยู่: ${this.stripCollaborationFieldValue(item.address)}`,
        `ลักษณะความร่วมมือทางวิจัย: ${this.stripCollaborationFieldValue(item.collaborationNature)}`
      ].join('\n'))).join('\n\n')
    },
    parseCollaborationStructuredBlock(block = '') {
      const source = String(block || '')
      if (!source.trim()) return null
      const extract = (label) => {
        const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const match = source.match(new RegExp(`${escaped}\\s*:\\s*(.*)`, 'i'))
        return match ? String(match[1] || '').trim() : ''
      }
      const personName = extract('ชื่อบุคคล')
      const organizationName = extract('ชื่อหน่วยงาน')
      const address = extract('ที่อยู่')
      const collaborationNature = extract('ลักษณะความร่วมมือทางวิจัย')
      if (!personName && !organizationName && !address && !collaborationNature) return null
      return { personName, organizationName, address, collaborationNature }
    },
    parseCollaborationAgency(value) {
      const source = String(value || '').trim()
      if (!source) return []

      try {
        const parsedJson = JSON.parse(source)
        if (Array.isArray(parsedJson)) {
          const fromJson = parsedJson
            .map((item) => this.normalizeCollaborationRecord({
              personName: item && (item.personName || item.person || item.name) || '',
              organizationName: item && (item.organizationName || item.organization || item.agency) || '',
              address: item && (item.address || item.location) || '',
              collaborationNature: item && (item.collaborationNature || item.collaborationType || item.description || item.detail) || ''
            }))
            .filter((item) => Object.keys(item).some((key) => Boolean(item[key])))
          if (fromJson.length) return fromJson
        }
      } catch (_) {
        // ignore parse errors and continue with text parsing
      }

      const blockList = source.split(/\n{2,}/)
      const structured = blockList
        .map((block) => this.parseCollaborationStructuredBlock(block))
        .filter(Boolean)
      if (structured.length) return structured

      return source
        .split(/[\n;|]+/)
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .map((organizationName) => ({
          personName: '',
          organizationName,
          address: '',
          collaborationNature: ''
        }))
    },
    hydrateCollaborationRecordsFromForm() {
      const parsed = this.parseCollaborationAgency(this.form.collaborationAgency)
      this.collaborationRecords = parsed.map((item) => this.createCollaborationRecord(item))
    },
    syncCollaborationAgencyFromRecords() {
      this.form.collaborationAgency = this.serializeCollaborationRecords(this.collaborationRecords)
    },
    pulseFundingSummary() {
      if (!this.form.fundingType) return
      if (this.fundingSummaryPulseTimerId) {
        clearTimeout(this.fundingSummaryPulseTimerId)
        this.fundingSummaryPulseTimerId = null
      }
      this.isFundingSummaryPulsing = false
      this.$nextTick(() => {
        this.isFundingSummaryPulsing = true
        this.fundingSummaryPulseTimerId = setTimeout(() => {
          this.isFundingSummaryPulsing = false
          this.fundingSummaryPulseTimerId = null
        }, 680)
      })
    },
    focusFundingSubStepIfNeeded(fundingType) {
      const option = this.getFundingTypeOptionByValue(fundingType)
      if (!option || !Array.isArray(option.subOptions) || option.subOptions.length === 0) return
      this.$nextTick(() => {
        const section = this.$refs.fundingTypeSection
        if (section && typeof section.focusSubStepIfNeeded === 'function') {
          section.focusSubStepIfNeeded(fundingType)
        }
      })
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
        {
          'section-highlight': this.highlightedSectionKey === sectionKey,
          'section-revision-highlight': this.isRevisionHighlighted(sectionKey)
        }
      ]
    },
    isRevisionHighlighted (sectionKey) {
      const targetKey = String(sectionKey || '').trim()
      if (!targetKey) return false
      return (Array.isArray(this.revisionHighlightSections) ? this.revisionHighlightSections : [])
        .map(key => String(key || '').trim())
        .includes(targetKey)
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
      nextForm.fundingType = normalizeFundingBudgetKey(nextForm.fundingType)
      nextForm.fundingSubType = this.normalizeFundingSubTypeForType(nextForm.fundingType, nextForm.fundingSubType)
      Object.keys(nextForm).forEach((key) => {
        this.$set(this.form, key, nextForm[key])
      })
      this.nextCollaborationUid = 1
      this.hydrateCollaborationRecordsFromForm()

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
        alert(RESEARCH_STANDARD_TEXT.minimumSelectionMessage);
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

.project-details-form.is-dark .funding-selector {
  background: #1a2432;
  border-color: #324458;
}

.project-details-form.is-dark .funding-selector__step--child {
  background: rgba(32, 44, 58, 0.6);
  border-color: #324458;
  border-left-color: #324458;
}

.project-details-form.is-dark .funding-type-card,
.project-details-form.is-dark .funding-subtype-card {
  background: #202c3a;
  border-color: #35506a;
}

.project-details-form.is-dark .funding-subtype-card:hover {
  border-color: #557a9d;
  background: #243243;
}

.project-details-form.is-dark .funding-type-card.is-active,
.project-details-form.is-dark .funding-subtype-card.is-active {
  border-color: #c59b3a;
  box-shadow: 0 0 0 3px rgba(197, 155, 58, 0.18);
  background: #29384a;
}

.project-details-form.is-dark .funding-selector__step-title,
.project-details-form.is-dark .funding-selector__step-context,
.project-details-form.is-dark .funding-type-card__title,
.project-details-form.is-dark .funding-subtype-card__title,
.project-details-form.is-dark .funding-selection-summary__label,
.project-details-form.is-dark .funding-selection-summary__path,
.project-details-form.is-dark .funding-selection-summary__status {
  color: #e6edf7;
}

.project-details-form.is-dark .funding-selector__step-description,
.project-details-form.is-dark .funding-type-card__description,
.project-details-form.is-dark .funding-subtype-card__description,
.project-details-form.is-dark .funding-detail-disclosure p,
.project-details-form.is-dark .funding-detail-toggle {
  color: #aab9ca;
}

.project-details-form.is-dark .funding-selection-summary {
  background: rgba(32, 44, 58, 0.9);
  border-color: #35506a;
}

.project-details-form.is-dark .funding-selector__step-status.is-complete {
  background: rgba(34, 197, 94, 0.22);
  color: #bbf7d0;
}

.project-details-form.is-dark .funding-selector__step-status.is-incomplete {
  background: rgba(245, 158, 11, 0.2);
  color: #fde68a;
}

.project-details-form.is-dark .funding-selector__step-required {
  background: rgba(197, 155, 58, 0.2);
  color: #fde68a;
}

.project-details-form.is-dark .funding-subtype-card__marker {
  border-color: #496786;
  color: #90b2d4;
  background: #223142;
}

.project-details-form.is-dark .funding-subtype-card__marker.is-active {
  border-color: #c59b3a;
  color: #fef3c7;
  background: rgba(197, 155, 58, 0.24);
}

.project-details-form.is-dark .funding-selection-summary__status.is-complete {
  background: rgba(34, 197, 94, 0.18);
  border-color: rgba(74, 222, 128, 0.4);
  color: #bbf7d0;
}

.project-details-form.is-dark .funding-selection-summary__status.is-incomplete {
  background: rgba(245, 158, 11, 0.18);
  border-color: rgba(251, 191, 36, 0.42);
  color: #fde68a;
}

.project-details-form.is-dark .collaboration-selector__hint,
.project-details-form.is-dark .collaboration-selector__helper,
.project-details-form.is-dark .collaboration-selector__empty-subtitle,
.project-details-form.is-dark .collaboration-selector__validation-note,
.project-details-form.is-dark .research-type-selector__intro,
.project-details-form.is-dark .research-type-card__description {
  color: #aab9ca;
}

.project-details-form.is-dark .collaboration-selector__empty-state,
.project-details-form.is-dark .collaboration-record-card,
.project-details-form.is-dark .research-type-selector {
  background: #1a2432;
  border-color: #324458;
}

.project-details-form.is-dark .collaboration-selector__empty-title,
.project-details-form.is-dark .collaboration-record-card__title,
.project-details-form.is-dark .collaboration-record-card__label {
  color: #e6edf7;
}

.project-details-form.is-dark .collaboration-record-card.has-error {
  border-color: #d97706;
  box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.18);
}

.project-details-form.is-dark .collaboration-record-card__remove-btn {
  background: rgba(127, 29, 29, 0.24);
  border-color: #f87171;
  color: #fecaca;
}

.project-details-form.is-dark .collaboration-record-card__remove-btn:hover {
  background: rgba(127, 29, 29, 0.38);
  border-color: #fca5a5;
  color: #fee2e2;
}

.project-details-form.is-dark .research-type-card {
  background: #202c3a;
  border-color: #35506a;
}

.project-details-form.is-dark .research-type-card:hover {
  border-color: #557a9d;
  background: #243243;
}

.project-details-form.is-dark .research-type-card.is-active {
  border-color: #6aa7ff;
  box-shadow: 0 0 0 3px rgba(106, 167, 255, 0.22);
  background: rgba(29, 78, 216, 0.26);
}

.project-details-form.is-dark .research-type-card__title {
  color: #e6edf7;
}

.project-details-form.is-dark .research-type-card__marker {
  border-color: #496786;
  background: #223142;
}

.project-details-form.is-dark .research-type-card__marker.is-active {
  border-color: #7fb6ff;
  background: #4f86db;
}

.project-details-form.is-dark .research-type-summary.is-complete {
  background: rgba(34, 197, 94, 0.18);
  border-color: rgba(74, 222, 128, 0.4);
  color: #bbf7d0;
}

.project-details-form.is-dark .research-type-summary.is-incomplete {
  background: rgba(30, 41, 59, 0.72);
  border-color: #3b5168;
  color: #cbd5e1;
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

.section-revision-highlight {
  background: #fff2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 12px;
}

.section-revision-highlight .section-title {
  background: #ffe2e2;
  border-left-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.14);
}

.project-details-form.is-dark .section-revision-highlight {
  background: rgba(127, 29, 29, 0.22);
  border-color: rgba(248, 113, 113, 0.5);
}

.project-details-form.is-dark .section-revision-highlight .section-title {
  background: rgba(127, 29, 29, 0.35);
  border-left-color: #f87171;
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.24);
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

.funding-selector {
  background: #ffffff;
  border: 1px solid #d8e2ef;
  border-radius: 12px;
  padding: 16px;
}

.funding-selector__step + .funding-selector__step {
  margin-top: 14px;
}

.funding-selector__step--child {
  margin-left: 12px;
  margin-top: 16px;
  border: 1px solid #d7e3f4;
  border-left: 1px solid #d7e3f4;
  border-radius: 10px;
  background: #f8fbff;
  padding: 14px 14px 12px;
  scroll-margin-top: 92px;
}

.funding-selector__step--child:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.16);
}

.funding-step-reveal-enter-active,
.funding-step-reveal-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.funding-step-reveal-enter,
.funding-step-reveal-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.funding-selector__step-title {
  font-size: 0.96rem;
  font-weight: 700;
  color: #1f2937;
}

.funding-selector__step-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.funding-selector__step-meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.funding-selector__step-context {
  margin-top: 6px;
  font-size: 0.84rem;
  color: #334155;
  font-weight: 600;
}

.funding-selector__step-required {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 0.72rem;
  font-weight: 700;
  background: #fef3c7;
  color: #92400e;
}

.funding-selector__step-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}

.funding-selector__step-status-icon {
  font-size: 0.78rem;
  line-height: 1;
}

.funding-selector__step-status.is-complete {
  background: #dcfce7;
  color: #166534;
}

.funding-selector__step-status.is-incomplete {
  background: #fef3c7;
  color: #92400e;
}

.funding-selector__step-description {
  margin-top: 5px;
  margin-bottom: 12px;
  font-size: 0.82rem;
  color: #64748b;
}

.funding-selector__type-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.funding-selector__sub-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.funding-type-card,
.funding-subtype-card {
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  background: #fcfdff;
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.funding-type-card:hover,
.funding-subtype-card:hover {
  border-color: #9eb4ce;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.funding-subtype-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 10px 12px;
  background: #ffffff;
}

.funding-type-card.is-active,
.funding-subtype-card.is-active {
  border-color: #8b1212;
  background: #fff7f7;
  box-shadow: 0 0 0 2px rgba(139, 18, 18, 0.16), 0 6px 14px rgba(127, 29, 29, 0.08);
  transform: translateY(-1px);
}

.funding-type-card.is-read-only,
.funding-subtype-card.is-read-only {
  opacity: 0.92;
}

.funding-type-card__header,
.funding-subtype-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.funding-type-card__radio-wrap,
.funding-subtype-card__radio-wrap {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.funding-type-card__radio,
.funding-subtype-card__radio {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  margin: 0;
  pointer-events: none;
}

.funding-type-card__title,
.funding-subtype-card__title {
  margin: 0;
  font-weight: 700;
  color: #1f2937;
  cursor: pointer;
  line-height: 1.35;
}

.funding-type-card__description,
.funding-subtype-card__description {
  margin-top: 6px;
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.45;
}

.funding-subtype-card__description {
  margin-top: 6px;
  margin-left: 0;
}

.funding-subtype-card__marker {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 1px solid #b4c4d8;
  background: #ffffff;
  color: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  flex: 0 0 20px;
  margin-top: 2px;
}

.funding-subtype-card__marker.is-active {
  border-color: #8b1212;
  background: #8b1212;
  color: #ffffff;
}

.funding-type-card__badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #8b1212;
  background: #ffe8e8;
  flex-shrink: 0;
}

.funding-detail-disclosure {
  margin-top: 7px;
  font-size: 0.82rem;
}

.funding-subtype-card .funding-detail-disclosure {
  margin-top: 6px;
  margin-left: 0;
  padding-top: 0;
}

.funding-detail-disclosure summary {
  cursor: pointer;
  list-style: none;
  outline: none;
}

.funding-detail-disclosure summary::-webkit-details-marker {
  display: none;
}

.funding-detail-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #8b1212;
  font-weight: 700;
}

.funding-detail-toggle__expanded {
  display: none;
}

.funding-detail-disclosure[open] .funding-detail-toggle__collapsed {
  display: none;
}

.funding-detail-disclosure[open] .funding-detail-toggle__expanded {
  display: inline;
}

.funding-detail-disclosure p {
  margin-top: 6px;
  color: #475569;
  line-height: 1.5;
}

.funding-selection-summary {
  margin-top: 14px;
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  background: #f8fafc;
  padding: 11px 12px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.funding-selection-summary.is-pulse {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.16);
}

.funding-selection-summary__label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 3px;
}

.funding-selection-summary__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 3px 10px;
  font-size: 0.82rem;
  font-weight: 700;
}

.funding-selection-summary__status.is-complete {
  background: #dcfce7;
  border-color: #86efac;
  color: #166534;
}

.funding-selection-summary__status.is-incomplete {
  background: #fef3c7;
  border-color: #fcd34d;
  color: #92400e;
}

.funding-selection-summary__status-icon {
  font-size: 0.84rem;
  line-height: 1;
}

.funding-selection-summary__path {
  margin-top: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.45;
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

.research-type-selector {
  background: #ffffff;
  border: 1px solid #d8e2ef;
  border-radius: 12px;
  padding: 16px;
}

.research-type-selector__intro {
  margin-bottom: 10px;
  font-size: 0.82rem;
  color: #64748b;
}

.research-type-selector__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.research-type-card {
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  background: #fcfdff;
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.research-type-card:hover {
  border-color: #9eb4ce;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.research-type-card.is-active {
  border-color: #60a5fa;
  background: #eff6ff;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.14), 0 6px 14px rgba(30, 64, 175, 0.08);
  transform: translateY(-1px);
}

.research-type-card.is-read-only {
  opacity: 0.92;
}

.research-type-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.research-type-card__radio-wrap {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.research-type-card__radio {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  margin: 0;
  pointer-events: none;
}

.research-type-card__title {
  margin: 0;
  font-weight: 700;
  color: #1f2937;
  cursor: pointer;
  line-height: 1.35;
}

.research-type-card__description {
  margin-top: 6px;
  font-size: 0.84rem;
  color: #475569;
  line-height: 1.45;
}

.research-type-card__marker {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 1px solid #b4c4d8;
  background: #ffffff;
  color: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  flex: 0 0 20px;
  margin-top: 2px;
}

.research-type-card__marker.is-active {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
}

.research-type-summary {
  margin-top: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  padding: 9px 11px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
}

.research-type-summary.is-complete {
  background: #ecfdf3;
  border-color: #86efac;
  color: #166534;
}

.research-type-summary__icon {
  font-size: 0.84rem;
  line-height: 1;
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
  .funding-selector {
    padding: 12px;
  }
  .funding-selector__type-grid {
    grid-template-columns: 1fr;
  }
  .funding-selector__sub-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .funding-selector__step--child {
    margin-left: 0;
    padding: 12px 10px;
  }
  .funding-subtype-card {
    min-height: auto;
  }
  .funding-subtype-card__description,
  .funding-subtype-card .funding-detail-disclosure {
    margin-left: 0;
  }
  .funding-selector__step-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .funding-selector__step-meta {
    width: 100%;
    justify-content: flex-start;
  }
  .funding-selection-summary__status {
    width: 100%;
    justify-content: flex-start;
  }
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
  .research-type-selector {
    padding: 12px;
  }
  .research-type-selector__grid {
    grid-template-columns: 1fr;
  }
  .research-type-summary {
    width: 100%;
  }
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

