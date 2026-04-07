const DEFAULT_COMMITTEE_RUBRIC_CONFIG = Object.freeze({
  templateVersion: 1,
  reviewerRole: 'committee',
  reviewerLabel: 'คณะกรรมการ',
  scoreOptions: [0, 1, 2],
  fundTypeOptions: [
    { value: 'new', label: 'ทุนวิจัยใหม่' },
    { value: 'develop', label: 'ทุนพัฒนา' },
    { value: 'extension', label: 'ทุนต่อยอด/ทุนอุตสาหกรรม' }
  ],
  rubricRows: [
    { no: 1, title: 'ความสำคัญและความชัดเจนของโจทย์วิจัย/คำถามวิจัย', desc: '0–2', weights: { new: 15, develop: 10, extension: 10 } },
    { no: 2, title: 'วัตถุประสงค์ของโครงการ', desc: '0–2', weights: { new: 15, develop: 5, extension: 5 } },
    { no: 3, title: 'การทบทวนวรรณกรรม', desc: '0–2', weights: { new: 15, develop: 5, extension: 5 } },
    { no: 4, title: 'กระบวนการและวิธีการ', desc: '0–2', weights: { new: 15, develop: 15, extension: 10 } },
    { no: 5, title: 'แผนการดำเนินงาน', desc: '0–2', weights: { new: 10, develop: 10, extension: 5 } },
    { no: 6, title: 'ผลลัพธ์ของโครงการวิจัย', desc: '0–2', weights: { new: 10, develop: 15, extension: 15 } },
    { no: 7, title: 'การบูรณาการงานวิจัย', desc: '0–2', weights: { new: 5, develop: 10, extension: 15 } },
    { no: 8, title: 'ระดับการถ่ายทอดสังคม', desc: '0–2', weights: { new: null, develop: 10, extension: 15 } },
    { no: 9, title: 'งบประมาณ', desc: '0–2', weights: { new: 5, develop: 5, extension: 5 } },
    { no: 10, title: 'คุณสมบัติของคณะผู้วิจัย', desc: '0–2', weights: { new: 5, develop: 5, extension: 5 } },
    { no: 11, title: 'ความสอดคล้องกับแผนงานที่มหาวิทยาลัยกำหนด', desc: '0–2', weights: { new: 5, develop: 10, extension: 10 } }
  ]
})

const normalizeOption = (option = {}, index = 0) => {
  const value = String(option.value || option.key || `fund_${index + 1}`).trim() || `fund_${index + 1}`
  return {
    value,
    label: String(option.label || option.name || value).trim() || value
  }
}

const normalizeWeights = (weights = {}, allowedKeys = []) => {
  const source = weights && typeof weights === 'object' ? weights : {}
  return allowedKeys.reduce((result, key) => {
    const value = source[key]
    const numeric = value === null || value === undefined || value === '' ? null : Number(value)
    result[key] = Number.isFinite(numeric) ? numeric : null
    return result
  }, {})
}

const normalizeRubricRow = (row = {}, index = 0, allowedFundTypeKeys = []) => ({
  no: Number(row.no || row.criteriaKey || row.key || (index + 1)) || (index + 1),
  title: String(row.title || row.label || `หัวข้อ ${index + 1}`).trim() || `หัวข้อ ${index + 1}`,
  desc: String(row.desc || row.description || '0–2').trim() || '0–2',
  weights: normalizeWeights(row.weights, allowedFundTypeKeys)
})

function buildNormalizedCommitteeRubricConfig(rawConfig = {}) {
  const source = rawConfig && typeof rawConfig === 'object' ? rawConfig : {}
  const fundTypeOptions = (Array.isArray(source.fundTypeOptions) ? source.fundTypeOptions : DEFAULT_COMMITTEE_RUBRIC_CONFIG.fundTypeOptions)
    .map(normalizeOption)
    .filter((option) => option.value)
  const allowedFundTypeKeys = fundTypeOptions.map((option) => option.value)

  const rubricRows = (Array.isArray(source.rubricRows) ? source.rubricRows : DEFAULT_COMMITTEE_RUBRIC_CONFIG.rubricRows)
    .map((row, index) => normalizeRubricRow(row, index, allowedFundTypeKeys))
    .filter((row) => row.no && row.title)

  const scoreOptions = (Array.isArray(source.scoreOptions) ? source.scoreOptions : DEFAULT_COMMITTEE_RUBRIC_CONFIG.scoreOptions)
    .map((value) => Number(value))
    .filter((value, index, array) => Number.isFinite(value) && array.indexOf(value) === index)

  return {
    templateVersion: Number(source.templateVersion) || DEFAULT_COMMITTEE_RUBRIC_CONFIG.templateVersion,
    reviewerRole: String(source.reviewerRole || DEFAULT_COMMITTEE_RUBRIC_CONFIG.reviewerRole).trim() || DEFAULT_COMMITTEE_RUBRIC_CONFIG.reviewerRole,
    reviewerLabel: String(source.reviewerLabel || DEFAULT_COMMITTEE_RUBRIC_CONFIG.reviewerLabel).trim() || DEFAULT_COMMITTEE_RUBRIC_CONFIG.reviewerLabel,
    scoreOptions: scoreOptions.length > 0 ? scoreOptions : [...DEFAULT_COMMITTEE_RUBRIC_CONFIG.scoreOptions],
    fundTypeOptions: fundTypeOptions.length > 0 ? fundTypeOptions : DEFAULT_COMMITTEE_RUBRIC_CONFIG.fundTypeOptions.map(normalizeOption),
    rubricRows: rubricRows.length > 0
      ? rubricRows
      : DEFAULT_COMMITTEE_RUBRIC_CONFIG.rubricRows.map((row, index) => normalizeRubricRow(row, index, DEFAULT_COMMITTEE_RUBRIC_CONFIG.fundTypeOptions.map((option) => option.value)))
  }
}

let COMMITTEE_RUBRIC_CONFIG = buildNormalizedCommitteeRubricConfig(DEFAULT_COMMITTEE_RUBRIC_CONFIG)

export const COMMITTEE_RUBRIC_SETTING_KEY = 'committee_rubric_config_json'

export function normalizeCommitteeRubricConfig(rawConfig) {
  return buildNormalizedCommitteeRubricConfig(rawConfig)
}

export function getDefaultCommitteeRubricConfig() {
  return buildNormalizedCommitteeRubricConfig(DEFAULT_COMMITTEE_RUBRIC_CONFIG)
}

export function setCommitteeRubricRuntimeConfig(rawConfig) {
  COMMITTEE_RUBRIC_CONFIG = buildNormalizedCommitteeRubricConfig(rawConfig)
}

export function getCommitteeRubricConfig() {
  return COMMITTEE_RUBRIC_CONFIG
}