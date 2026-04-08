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
      fundingTypeLabelEn: 'New Researcher Grant',
      sections: [
        {
          sectionKey: 'applicant_eligibility',
          sectionLabel: '1. คุณสมบัติของผู้ขอรับทุน',
          sectionLabelEn: '1. Applicant eligibility',
          description: 'ตรวจสอบคุณสมบัติของหัวหน้าโครงการตามเกณฑ์ของทุนนักวิจัยใหม่',
          descriptionEn: 'Verify that the project leader meets the eligibility criteria for the New Researcher Grant.',
          items: [
            {
              itemKey: 'academic_staff_position',
              label: 'เป็นพนักงานสายวิชาการ ตำแหน่งอาจารย์ หรือนักวิจัยของมหาวิทยาลัยแม่ฟ้าหลวง',
              labelEn: 'The applicant is an academic staff member (lecturer) or researcher at Mae Fah Luang University.'
            },
            {
              itemKey: 'qualification_alignment',
              label: 'มีคุณวุฒิสอดคล้องกับเนื้อหาของโครงการวิจัยที่เสนอ',
              labelEn: 'The applicant’s qualifications are aligned with the proposed research project.'
            },
            {
              itemKey: 'capability_and_time',
              label: 'มีศักยภาพและเวลาในการดำเนินโครงการวิจัยให้สำเร็จลุล่วงอย่างมีคุณภาพ และสามารถเผยแพร่ผลงานวิจัยได้ตามเกณฑ์ที่กำหนด',
              labelEn: 'The applicant has sufficient capability and time to complete the project with quality and publish the results per the required criteria.'
            },
            {
              itemKey: 'single_new_researcher_project',
              label: 'เสนอขอรับทุนนักวิจัยใหม่ในตำแหน่งหัวหน้าโครงการวิจัย ไม่เกิน 1 โครงการ',
              labelEn: 'The applicant submits no more than one New Researcher Grant proposal as the project leader.'
            },
            {
              itemKey: 'no_previous_new_researcher_grant',
              label: 'ไม่เคยได้รับทุนสนับสนุนการวิจัยประเภททุนนักวิจัยใหม่จากเงินรายได้มหาวิทยาลัยแม่ฟ้าหลวงมาก่อน ในตำแหน่งหัวหน้าโครงการ',
              labelEn: 'The applicant has not previously received the New Researcher Grant (MFU income) as the project leader.',
              description: 'ข้อยกเว้น: คณาจารย์หรือนักวิจัยด้านสังคมศาสตร์และมนุษยศาสตร์ สามารถขอเพิ่มได้ตามกรอบงบประมาณที่เหลือจากโครงการเดิม รวมแล้วไม่เกิน 100,000 บาท',
              descriptionEn: 'Exception: Social sciences and humanities staff/researchers may request additional support within the remaining budget of the previous project, with a total not exceeding 100,000 THB.'
            },
            {
              itemKey: 'not_on_study_leave',
              label: 'ไม่อยู่ระหว่างการลาศึกษาต่อ หรือมีแผนลาศึกษาต่อในระหว่างการรับทุน',
              labelEn: 'The applicant is not on study leave and has no study leave plan during the funding period.'
            },
            {
              itemKey: 'no_previous_other_grants',
              label: 'ไม่เคยได้รับทุนพัฒนานักวิจัย ทุนสอดคล้องยุทธศาสตร์การวิจัยและนวัตกรรม หรือทุนต่อยอดสู่ภาคอุตสาหกรรมมาก่อน นับตั้งแต่ปีงบประมาณ 2560',
              labelEn: 'The applicant has not previously received the Researcher Development Grant, Strategic Research & Innovation Alignment Grant, or Industry Extension Grant since fiscal year 2017.'
            },
            {
              itemKey: 'research_training_completed',
              label: 'หัวหน้าโครงการต้องผ่านการอบรมมาตรฐานการวิจัย หรือจริยธรรมการวิจัยในมนุษย์ที่เกี่ยวข้อง พร้อมแสดงหลักฐาน',
              labelEn: 'The project leader has completed research standards training and/or relevant human research ethics training and can provide supporting evidence.'
            }
          ]
        },
        {
          sectionKey: 'supported_project_characteristics',
          sectionLabel: '2. ลักษณะโครงการวิจัยที่ให้การสนับสนุน',
          sectionLabelEn: '2. Supported project characteristics',
          description: 'ตรวจสอบลักษณะของโครงการวิจัยและเงื่อนไขการสนับสนุนของทุนนักวิจัยใหม่',
          descriptionEn: 'Verify project characteristics and support conditions for the New Researcher Grant.',
          items: [
            {
              itemKey: 'has_project_advisor',
              label: 'ควรมีที่ปรึกษาโครงการวิจัยอย่างน้อย 1 คน ซึ่งเป็นผู้เชี่ยวชาญในสาขาที่เกี่ยวข้อง',
              labelEn: 'At least one project advisor is recommended, who is an expert in a relevant field.'
            },
            {
              itemKey: 'duration_within_one_year',
              label: 'ระยะเวลาดำเนินการไม่เกิน 1 ปี',
              labelEn: 'Project duration does not exceed 1 year.'
            },
            {
              itemKey: 'budget_within_limit',
              label: 'งบประมาณที่เสนอขอไม่เกิน 100,000 บาท และเป็นไปตามระเบียบที่มหาวิทยาลัยกำหนด',
              labelEn: 'Requested budget does not exceed 100,000 THB and complies with university regulations.'
            },
            {
              itemKey: 'clear_non_duplicate_problem',
              label: 'มีโจทย์วิจัยที่ชัดเจนและไม่ซ้ำซ้อนกับงานที่เคยมีผู้ทำมาก่อน',
              labelEn: 'The research problem is clear and not redundant with previously conducted work.'
            },
            {
              itemKey: 'feasible_objectives',
              label: 'มีวัตถุประสงค์การวิจัยที่ดำเนินการได้จริงและประเมินได้',
              labelEn: 'Research objectives are feasible and measurable.'
            },
            {
              itemKey: 'not_part_of_thesis',
              label: 'ต้องไม่เป็นส่วนหนึ่งของวิทยานิพนธ์ของผู้ขอรับทุนเพื่อสำเร็จการศึกษา',
              labelEn: 'The project must not be part of the applicant’s thesis for degree completion.'
            },
            {
              itemKey: 'publication_potential',
              label: 'มีศักยภาพสามารถตีพิมพ์ผลงานวิจัยตามเกณฑ์ที่มหาวิทยาลัยกำหนด',
              labelEn: 'The project has publication potential in accordance with university criteria.'
            }
          ]
        }
      ]
    },
    {
      fundingTypeKey: 'researcher-development',
      fundingTypeLabel: 'ทุนพัฒนานักวิจัย',
      fundingTypeLabelEn: 'Researcher Development Grant',
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
      fundingTypeLabelEn: 'Grant aligned with national strategy',
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
      fundingTypeLabelEn: 'Industry-oriented grant',
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

const pickLocalizedValue = (source = {}, baseKey = '', locale = 'th') => {
  const obj = source && typeof source === 'object' ? source : {}
  const normalizedLocale = String(locale || '').trim().toLowerCase() === 'en' ? 'en' : 'th'
  const suffix = normalizedLocale === 'en' ? 'En' : 'Th'
  const candidates = [
    `${baseKey}${suffix}`,
    `${baseKey}_${normalizedLocale}`,
    `${baseKey}_${normalizedLocale.toUpperCase()}`,
    `${baseKey}${normalizedLocale.toUpperCase()}`
  ]
  for (const key of candidates) {
    if (obj[key] !== undefined && obj[key] !== null) {
      const text = String(obj[key]).trim()
      if (text) return text
    }
  }
  return ''
}

const mergeMissingLocalization = (runtimeConfig, fallbackConfig) => {
  const runtime = runtimeConfig && typeof runtimeConfig === 'object' ? runtimeConfig : {}
  const fallback = fallbackConfig && typeof fallbackConfig === 'object' ? fallbackConfig : {}
  const fallbackTemplates = Array.isArray(fallback.fundingTemplates) ? fallback.fundingTemplates : []
  const runtimeTemplates = Array.isArray(runtime.fundingTemplates) ? runtime.fundingTemplates : []

  const mergedTemplates = runtimeTemplates.map((tpl) => {
    const fundingTypeKey = normalizeKey(tpl && tpl.fundingTypeKey)
    const fbTpl = fallbackTemplates.find((t) => normalizeKey(t && t.fundingTypeKey) === fundingTypeKey)

    const tplNext = { ...(tpl || {}) }
    if (fbTpl) {
      if (!tplNext.fundingTypeLabelEn) tplNext.fundingTypeLabelEn = fbTpl.fundingTypeLabelEn || pickLocalizedValue(fbTpl, 'fundingTypeLabel', 'en')
      if (!tplNext.fundingTypeLabelTh) tplNext.fundingTypeLabelTh = fbTpl.fundingTypeLabelTh || pickLocalizedValue(fbTpl, 'fundingTypeLabel', 'th')

      const fbSections = Array.isArray(fbTpl.sections) ? fbTpl.sections : []
      const sections = Array.isArray(tplNext.sections) ? tplNext.sections : []
      tplNext.sections = sections.map((sec) => {
        const sectionKey = String(sec && sec.sectionKey ? sec.sectionKey : '').trim()
        const fbSec = fbSections.find((s) => String(s && s.sectionKey ? s.sectionKey : '').trim() === sectionKey)
        if (!fbSec) return sec
        const secNext = { ...(sec || {}) }
        if (!secNext.sectionLabelEn) secNext.sectionLabelEn = fbSec.sectionLabelEn || pickLocalizedValue(fbSec, 'sectionLabel', 'en')
        if (!secNext.sectionLabelTh) secNext.sectionLabelTh = fbSec.sectionLabelTh || pickLocalizedValue(fbSec, 'sectionLabel', 'th')
        if (!secNext.descriptionEn) secNext.descriptionEn = fbSec.descriptionEn || pickLocalizedValue(fbSec, 'description', 'en')
        if (!secNext.descriptionTh) secNext.descriptionTh = fbSec.descriptionTh || pickLocalizedValue(fbSec, 'description', 'th')

        const fbItems = Array.isArray(fbSec.items) ? fbSec.items : []
        const items = Array.isArray(secNext.items) ? secNext.items : []
        secNext.items = items.map((it) => {
          const itemKey = String(it && it.itemKey ? it.itemKey : '').trim()
          const fbItem = fbItems.find((x) => String(x && x.itemKey ? x.itemKey : '').trim() === itemKey)
          if (!fbItem) return it
          const itNext = { ...(it || {}) }
          if (!itNext.labelEn) itNext.labelEn = fbItem.labelEn || pickLocalizedValue(fbItem, 'label', 'en')
          if (!itNext.labelTh) itNext.labelTh = fbItem.labelTh || pickLocalizedValue(fbItem, 'label', 'th')
          if (!itNext.descriptionEn) itNext.descriptionEn = fbItem.descriptionEn || pickLocalizedValue(fbItem, 'description', 'en')
          if (!itNext.descriptionTh) itNext.descriptionTh = fbItem.descriptionTh || pickLocalizedValue(fbItem, 'description', 'th')
          return itNext
        })
        return secNext
      })
    }
    return tplNext
  })

  return {
    ...runtime,
    fundingTemplates: mergedTemplates
  }
}

const normalizeItem = (item = {}, index = 0) => ({
  itemKey: String(item.itemKey || item.key || `item_${index + 1}`).trim() || `item_${index + 1}`,
  label: String(item.label || item.title || `รายการที่ ${index + 1}`).trim() || `รายการที่ ${index + 1}`,
  labelTh: pickLocalizedValue(item, 'label', 'th'),
  labelEn: pickLocalizedValue(item, 'label', 'en'),
  description: String(item.description || '').trim(),
  descriptionTh: pickLocalizedValue(item, 'description', 'th'),
  descriptionEn: pickLocalizedValue(item, 'description', 'en'),
  required: Boolean(item.required)
})

const normalizeSection = (section = {}, index = 0) => ({
  sectionKey: String(section.sectionKey || section.key || `section_${index + 1}`).trim() || `section_${index + 1}`,
  sectionLabel: String(section.sectionLabel || section.label || `หัวข้อ ${index + 1}`).trim() || `หัวข้อ ${index + 1}`,
  sectionLabelTh: pickLocalizedValue(section, 'sectionLabel', 'th'),
  sectionLabelEn: pickLocalizedValue(section, 'sectionLabel', 'en'),
  description: String(section.description || '').trim(),
  descriptionTh: pickLocalizedValue(section, 'description', 'th'),
  descriptionEn: pickLocalizedValue(section, 'description', 'en'),
  items: (Array.isArray(section.items) ? section.items : []).map(normalizeItem)
})

const normalizeFundingTemplate = (template = {}, index = 0) => ({
  fundingTypeKey: normalizeKey(template.fundingTypeKey || template.key || template.fundingKey || `funding_${index + 1}`),
  fundingTypeLabel: String(template.fundingTypeLabel || template.label || template.name || `ทุนที่ ${index + 1}`).trim() || `ทุนที่ ${index + 1}`,
  fundingTypeLabelTh: pickLocalizedValue(template, 'fundingTypeLabel', 'th'),
  fundingTypeLabelEn: pickLocalizedValue(template, 'fundingTypeLabel', 'en'),
  sections: (Array.isArray(template.sections) ? template.sections : []).map(normalizeSection)
})

function buildNormalizedChairmanChecklistConfigCore(rawConfig = {}) {
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

const DEFAULT_NORMALIZED_CHAIRMAN_CHECKLIST_CONFIG = buildNormalizedChairmanChecklistConfigCore(DEFAULT_CHAIRMAN_CHECKLIST_CONFIG)

function buildNormalizedChairmanChecklistConfig(rawConfig = {}) {
  const runtime = buildNormalizedChairmanChecklistConfigCore(rawConfig)
  return mergeMissingLocalization(runtime, DEFAULT_NORMALIZED_CHAIRMAN_CHECKLIST_CONFIG)
}

let CHAIRMAN_CHECKLIST_CONFIG = buildNormalizedChairmanChecklistConfig(DEFAULT_CHAIRMAN_CHECKLIST_CONFIG)

export const CHAIRMAN_CHECKLIST_SETTING_KEY = 'chairman_checklist_config_json'

export function normalizeChairmanChecklistConfig(rawConfig) {
  return buildNormalizedChairmanChecklistConfig(rawConfig)
}

export function getDefaultChairmanChecklistConfig() {
  return buildNormalizedChairmanChecklistConfig(DEFAULT_CHAIRMAN_CHECKLIST_CONFIG)
}

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
