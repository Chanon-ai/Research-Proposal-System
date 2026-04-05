const DEFAULT_COMMITTEE_FEEDBACK_CONFIG = Object.freeze({
  lowScoreThreshold: 1,
  criteriaMap: {
    '1': { criteriaKey: '1', sectionKey: 'problem_significance', sectionNo: 6, sectionLabel: 'หัวข้อ 6 ความสำคัญของปัญหาและแนวคิด', rubricLabel: 'ความสำคัญและความชัดเจนของโจทย์วิจัย/คำถามวิจัย', target: 'projectDetails' },
    '2': { criteriaKey: '2', sectionKey: 'objectives', sectionNo: 7, sectionLabel: 'หัวข้อ 7 วัตถุประสงค์', rubricLabel: 'วัตถุประสงค์ของโครงการ', target: 'projectDetails' },
    '3': { criteriaKey: '3', sectionKey: 'literature_review', sectionNo: 8, sectionLabel: 'หัวข้อ 8 ทบทวนวรรณกรรม', rubricLabel: 'การทบทวนวรรณกรรม', target: 'projectDetails' },
    '4': { criteriaKey: '4', sectionKey: 'research_methodology', sectionNo: 10, sectionLabel: 'หัวข้อ 10 วิธีดำเนินการวิจัย', rubricLabel: 'กระบวนการและวิธีการ', target: 'projectDetails' },
    '5': { criteriaKey: '5', sectionKey: 'work_plan', sectionNo: 12, sectionLabel: 'หัวข้อ 12 แผนการดำเนินงาน', rubricLabel: 'แผนการดำเนินงาน', target: 'projectDetails' },
    '6': { criteriaKey: '6', sectionKey: 'expected_outcomes', sectionNo: 14, sectionLabel: 'หัวข้อ 14 ผลลัพธ์ที่คาดว่าจะได้รับ', rubricLabel: 'ผลลัพธ์ของโครงการวิจัย', target: 'projectDetails' },
    '7': { criteriaKey: '7', sectionKey: 'integration', sectionNo: 15, sectionLabel: 'หัวข้อ 15 การบูรณาการงานวิจัย', rubricLabel: 'การบูรณาการงานวิจัย', target: 'projectDetails' },
    '8': { criteriaKey: '8', sectionKey: 'transfer_level', sectionNo: 16, sectionLabel: 'หัวข้อ 16 ระดับการถ่ายทอดสู่สังคม', rubricLabel: 'ระดับการถ่ายทอดสังคม', target: 'projectDetails' },
    '9': { criteriaKey: '9', sectionKey: 'budget', sectionNo: 17, sectionLabel: 'หัวข้อ 17 งบประมาณโครงการ', rubricLabel: 'งบประมาณ', target: 'projectDetails' },
    '10': { criteriaKey: '10', sectionKey: 'research_team', sectionNo: null, sectionLabel: 'คณะผู้วิจัย', rubricLabel: 'คุณสมบัติของคณะผู้วิจัย', target: 'researchTeam' },
    '11': { criteriaKey: '11', sectionKey: 'strategic_alignment', sectionNo: 2, sectionLabel: 'หัวข้อ 2 ประเภททุนและความสอดคล้องกับแผนงานที่มหาวิทยาลัยกำหนด', rubricLabel: 'ความสอดคล้องกับแผนงานที่มหาวิทยาลัยกำหนด', target: 'projectDetails' }
  },
  fallbackMessages: {
    general: 'โปรดตรวจสอบและปรับปรุงข้อมูลในหัวข้อนี้ตามข้อเสนอแนะจากคณะกรรมการ',
    sectionPrefix: 'โปรดปรับปรุง{sectionLabel}ตามข้อเสนอแนะของคณะกรรมการ'
  }
})

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function toObject(value, fallback) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : fallback
}

function buildNormalizedCommitteeFeedbackConfig(rawConfig = {}) {
  const defaults = clone(DEFAULT_COMMITTEE_FEEDBACK_CONFIG)
  const source = toObject(rawConfig, {})
  const fallbackMessages = toObject(source.fallbackMessages, defaults.fallbackMessages)

  return {
    lowScoreThreshold: Number.isFinite(Number(source.lowScoreThreshold)) ? Number(source.lowScoreThreshold) : defaults.lowScoreThreshold,
    criteriaMap: toObject(source.criteriaMap, defaults.criteriaMap),
    fallbackMessages: {
      general: String(fallbackMessages.general || defaults.fallbackMessages.general).trim() || defaults.fallbackMessages.general,
      sectionPrefix: String(fallbackMessages.sectionPrefix || defaults.fallbackMessages.sectionPrefix).trim() || defaults.fallbackMessages.sectionPrefix
    }
  }
}

export let LOW_SCORE_THRESHOLD = DEFAULT_COMMITTEE_FEEDBACK_CONFIG.lowScoreThreshold
export let COMMITTEE_SECTION_FEEDBACK_MAP = clone(DEFAULT_COMMITTEE_FEEDBACK_CONFIG.criteriaMap)
export let COMMITTEE_FEEDBACK_FALLBACK_MESSAGES = clone(DEFAULT_COMMITTEE_FEEDBACK_CONFIG.fallbackMessages)

export function setCommitteeFeedbackRuntimeConfig(rawConfig) {
  const config = buildNormalizedCommitteeFeedbackConfig(rawConfig)
  LOW_SCORE_THRESHOLD = config.lowScoreThreshold
  COMMITTEE_SECTION_FEEDBACK_MAP = config.criteriaMap
  COMMITTEE_FEEDBACK_FALLBACK_MESSAGES = config.fallbackMessages
  return config
}

export function getCommitteeFeedbackMeta(criteriaKey) {
  const key = String(criteriaKey || '')
  return COMMITTEE_SECTION_FEEDBACK_MAP[key] || null
}

export function buildCommitteeSectionComment(meta, customText) {
  const text = String(customText || '').trim()
  if (text) return text
  if (!meta) return COMMITTEE_FEEDBACK_FALLBACK_MESSAGES.general
  return COMMITTEE_FEEDBACK_FALLBACK_MESSAGES.sectionPrefix.replace('{sectionLabel}', meta.sectionLabel || '')
}
