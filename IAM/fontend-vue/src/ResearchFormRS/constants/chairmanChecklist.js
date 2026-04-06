const DEFAULT_CHAIRMAN_CHECKLIST_CONFIG = Object.freeze({
  templateVersion: 1,
  reviewerRole: 'chairman',
  reviewerLabel: 'ประธานสำนัก',
  importStatus: 'partial',
  note: 'Imported checklist for new-researcher. Other funding types are still pending import.',
  fundingTemplates: [
    {
      fundingTypeKey: 'new-researcher',
      fundingTypeLabel: 'ทุนนักวิจัยรุ่นใหม่',
      sections: [
        {
          sectionKey: 'applicant_eligibility',
          sectionLabel: '1. คุณสมบัติของผู้ขอรับทุน',
          description: 'ตรวจสอบคุณสมบัติของหัวหน้าโครงการตามเกณฑ์ของทุนนักวิจัยใหม่',
          items: [
            {
              itemKey: 'academic_staff_position',
              label: 'เป็นพนักงานสายวิชาการ ตำแหน่งอาจารย์ หรือนักวิจัยของมหาวิทยาลัยแม่ฟ้าหลวง'
            },
            {
              itemKey: 'qualification_alignment',
              label: 'มีคุณวุฒิสอดคล้องกับเนื้อหาของโครงการวิจัยที่เสนอ'
            },
            {
              itemKey: 'capability_and_time',
              label: 'มีศักยภาพและเวลาในการดำเนินโครงการวิจัยให้สำเร็จลุล่วงอย่างมีคุณภาพ และสามารถเผยแพร่ผลงานวิจัยได้ตามเกณฑ์ที่กำหนด'
            },
            {
              itemKey: 'single_new_researcher_project',
              label: 'เสนอขอรับทุนนักวิจัยใหม่ในตำแหน่งหัวหน้าโครงการวิจัย ไม่เกิน 1 โครงการ'
            },
            {
              itemKey: 'no_previous_new_researcher_grant',
              label: 'ไม่เคยได้รับทุนสนับสนุนการวิจัยประเภททุนนักวิจัยใหม่จากเงินรายได้มหาวิทยาลัยแม่ฟ้าหลวงมาก่อน ในตำแหน่งหัวหน้าโครงการ',
              description: 'ข้อยกเว้น: คณาจารย์หรือนักวิจัยด้านสังคมศาสตร์และมนุษยศาสตร์ สามารถขอเพิ่มได้ตามกรอบงบประมาณที่เหลือจากโครงการเดิม รวมแล้วไม่เกิน 100,000 บาท'
            },
            {
              itemKey: 'not_on_study_leave',
              label: 'ไม่อยู่ระหว่างการลาศึกษาต่อ หรือมีแผนลาศึกษาต่อในระหว่างการรับทุน'
            },
            {
              itemKey: 'no_previous_other_grants',
              label: 'ไม่เคยได้รับทุนพัฒนานักวิจัย ทุนสอดคล้องยุทธศาสตร์การวิจัยและนวัตกรรม หรือทุนต่อยอดสู่ภาคอุตสาหกรรมมาก่อน นับตั้งแต่ปีงบประมาณ 2560'
            },
            {
              itemKey: 'research_training_completed',
              label: 'หัวหน้าโครงการต้องผ่านการอบรมมาตรฐานการวิจัย หรือจริยธรรมการวิจัยในมนุษย์ที่เกี่ยวข้อง พร้อมแสดงหลักฐาน'
            }
          ]
        },
        {
          sectionKey: 'supported_project_characteristics',
          sectionLabel: '2. ลักษณะโครงการวิจัยที่ให้การสนับสนุน',
          description: 'ตรวจสอบลักษณะของโครงการวิจัยและเงื่อนไขการสนับสนุนของทุนนักวิจัยใหม่',
          items: [
            {
              itemKey: 'has_project_advisor',
              label: 'ควรมีที่ปรึกษาโครงการวิจัยอย่างน้อย 1 คน ซึ่งเป็นผู้เชี่ยวชาญในสาขาที่เกี่ยวข้อง'
            },
            {
              itemKey: 'duration_within_one_year',
              label: 'ระยะเวลาดำเนินการไม่เกิน 1 ปี'
            },
            {
              itemKey: 'budget_within_limit',
              label: 'งบประมาณที่เสนอขอไม่เกิน 100,000 บาท และเป็นไปตามระเบียบที่มหาวิทยาลัยกำหนด'
            },
            {
              itemKey: 'clear_non_duplicate_problem',
              label: 'มีโจทย์วิจัยที่ชัดเจนและไม่ซ้ำซ้อนกับงานที่เคยมีผู้ทำมาก่อน'
            },
            {
              itemKey: 'feasible_objectives',
              label: 'มีวัตถุประสงค์การวิจัยที่ดำเนินการได้จริงและประเมินได้'
            },
            {
              itemKey: 'not_part_of_thesis',
              label: 'ต้องไม่เป็นส่วนหนึ่งของวิทยานิพนธ์ของผู้ขอรับทุนเพื่อสำเร็จการศึกษา'
            },
            {
              itemKey: 'publication_potential',
              label: 'มีศักยภาพสามารถตีพิมพ์ผลงานวิจัยตามเกณฑ์ที่มหาวิทยาลัยกำหนด'
            }
          ]
        }
      ]
    },
    {
      fundingTypeKey: 'researcher-development',
      fundingTypeLabel: 'ทุนพัฒนานักวิจัย',
      sections: [
        {
          sectionKey: 'import_placeholder',
          sectionLabel: 'Checklist Template',
          description: 'พื้นที่สำหรับ import checklist ภายหลัง',
          items: []
        }
      ]
    },
    {
      fundingTypeKey: 'strategic-research',
      fundingTypeLabel: 'ทุนวิจัยที่สอดคล้องกับยุทธศาสตร์',
      sections: [
        {
          sectionKey: 'import_placeholder',
          sectionLabel: 'Checklist Template',
          description: 'พื้นที่สำหรับ import checklist ภายหลัง',
          items: []
        }
      ]
    },
    {
      fundingTypeKey: 'industry-extension',
      fundingTypeLabel: 'ทุนต่อยอดสู่ภาคอุตสาหกรรม',
      sections: [
        {
          sectionKey: 'import_placeholder',
          sectionLabel: 'Checklist Template',
          description: 'พื้นที่สำหรับ import checklist ภายหลัง',
          items: []
        }
      ]
    }
  ]
})

const normalizeKey = (value) => String(value || '').trim().toLowerCase()

const normalizeItem = (item = {}, index = 0) => ({
  itemKey: String(item.itemKey || item.key || `item_${index + 1}`).trim() || `item_${index + 1}`,
  label: String(item.label || item.title || `รายการที่ ${index + 1}`).trim() || `รายการที่ ${index + 1}`,
  description: String(item.description || '').trim(),
  required: Boolean(item.required)
})

const normalizeSection = (section = {}, index = 0) => ({
  sectionKey: String(section.sectionKey || section.key || `section_${index + 1}`).trim() || `section_${index + 1}`,
  sectionLabel: String(section.sectionLabel || section.label || `หัวข้อ ${index + 1}`).trim() || `หัวข้อ ${index + 1}`,
  description: String(section.description || '').trim(),
  items: (Array.isArray(section.items) ? section.items : []).map(normalizeItem)
})

const normalizeFundingTemplate = (template = {}, index = 0) => ({
  fundingTypeKey: normalizeKey(template.fundingTypeKey || template.key || template.fundingKey || `funding_${index + 1}`),
  fundingTypeLabel: String(template.fundingTypeLabel || template.label || template.name || `ทุนที่ ${index + 1}`).trim() || `ทุนที่ ${index + 1}`,
  sections: (Array.isArray(template.sections) ? template.sections : []).map(normalizeSection)
})

function buildNormalizedChairmanChecklistConfig(rawConfig = {}) {
  const source = rawConfig && typeof rawConfig === 'object' ? rawConfig : {}
  const fundingTemplates = (Array.isArray(source.fundingTemplates) ? source.fundingTemplates : DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.fundingTemplates)
    .map(normalizeFundingTemplate)
    .filter((template) => template.fundingTypeKey)

  return {
    templateVersion: Number(source.templateVersion) || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.templateVersion,
    reviewerRole: String(source.reviewerRole || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.reviewerRole).trim() || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.reviewerRole,
    reviewerLabel: String(source.reviewerLabel || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.reviewerLabel).trim() || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.reviewerLabel,
    importStatus: String(source.importStatus || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.importStatus).trim() || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.importStatus,
    note: String(source.note || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.note).trim() || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.note,
    fundingTemplates: fundingTemplates.length > 0 ? fundingTemplates : DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.fundingTemplates.map(normalizeFundingTemplate)
  }
}

let CHAIRMAN_CHECKLIST_CONFIG = buildNormalizedChairmanChecklistConfig(DEFAULT_CHAIRMAN_CHECKLIST_CONFIG)

export function setChairmanChecklistRuntimeConfig(rawConfig) {
  CHAIRMAN_CHECKLIST_CONFIG = buildNormalizedChairmanChecklistConfig(rawConfig)
}

export function getChairmanChecklistConfig() {
  return CHAIRMAN_CHECKLIST_CONFIG
}

export function getChairmanChecklistTemplate(fundingTypeKey) {
  const normalizedFundingTypeKey = normalizeKey(fundingTypeKey)
  const templates = CHAIRMAN_CHECKLIST_CONFIG.fundingTemplates || []
  return templates.find((template) => template.fundingTypeKey === normalizedFundingTypeKey) || templates[0] || null
}
