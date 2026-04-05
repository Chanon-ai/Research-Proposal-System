const DEFAULT_RESEARCH_STANDARD_CONFIG = Object.freeze({
  statuses: {
    approved: 'approved',
    pending: 'pending'
  },
  text: {
    sectionTitle: '18. มาตรฐานการวิจัย',
    hint: 'เลือกเฉพาะกรณีที่เกี่ยวข้อง หากไม่เลือกข้อใด ระบบจะถือว่าไม่มี',
    noneMessage: 'ไม่มีการวิจัยในมนุษย์ / ไม่มีการใช้สัตว์ทดลอง / ไม่เกี่ยวข้องกับพันธุ์พืช',
    submittedDateLabel: 'วันที่ยื่นโครงการ',
    attachmentRequiredMessage: 'โปรดแนบเอกสารมาตรฐานการวิจัย',
    minimumSelectionMessage: 'กรุณาระบุข้อมูลมาตรฐานการวิจัยให้ครบถ้วน (ต้องเลือก มนุษย์ หรือ สัตว์ทดลอง อย่างน้อย 1 อย่าง)',
    resetGroup: 'ล้างข้อมูลหัวข้อนี้',
    attachDocument: 'แนบเอกสาร',
    exampleDocument: 'ตัวอย่างเอกสาร',
    selectStatusNote: 'โปรดเลือกสถานะก่อนแนบเอกสาร',
    openAttachment: 'เปิดดู',
    removeAttachment: 'ลบ',
    attachmentFallbackName: 'เอกสารแนบ',
    validationStatus: 'โปรดเลือกสถานะของหัวข้อนี้',
    validationSubmittedDate: 'โปรดระบุวันที่ยื่นโครงการ'
  },
  groups: {
    human: {
      key: 'human',
      title: 'มีการทำวิจัยในมนุษย์',
      pendingNeedsDate: false,
      exampleDocKey: 'humanEthicsCertificate',
      options: [
        { value: 'approved', label: 'มีหนังสือรับรองจริยธรรมการวิจัยในมนุษย์ (แนบสำเนา 1 ชุด)' },
        { value: 'pending', label: 'ไม่มีหนังสือรับรองจริยธรรมการวิจัยในมนุษย์ อยู่ระหว่างเสนอคณะกรรมการวิจัยจริยธรรมการวิจัยในมนุษย์พิจารณา' }
      ],
      legacy: { enabledKey: 'isHuman', statusKey: 'humanSubType', submittedDateKey: 'humanSubmittedDate' },
      slots: { approved: 'humanApproved', pending: 'humanPending' }
    },
    animal: {
      key: 'animal',
      title: 'มีการใช้สัตว์ทดลอง',
      pendingNeedsDate: false,
      exampleDocKey: 'animalEthicsCertificate',
      options: [
        { value: 'approved', label: 'มีหนังสือรับรองจรรยาบรรณสัตว์เพื่องานทางวิทยาศาสตร์ (แนบสำเนา 1 ชุด)' },
        { value: 'pending', label: 'ไม่มีหนังสือรับรองจรรยาบรรณสัตว์เพื่องานทางวิทยาศาสตร์ อยู่ระหว่างเสนอคณะกรรมการจรรยาบรรณสัตว์เพื่องานทางวิทยาศาสตร์' }
      ],
      legacy: { enabledKey: 'isAnimal', statusKey: 'animalSubType', submittedDateKey: 'animalSubmittedDate' },
      slots: { approved: 'animalApproved', pending: 'animalPending' }
    },
    plant: {
      key: 'plant',
      title: 'มีการเก็บ จัดหา หรือรวบรวมพันธุ์พืชพื้นเมืองทั่วไปและพันธุ์พืชป่าหรือส่วนหนึ่งส่วนใดของพันธุ์พืช เพื่อการศึกษา ทดลอง หรือวิจัย ตามมาตรา 53 แห่งพระราชบัญญัติคุ้มครองพันธุ์พืช พ.ศ. 2542',
      pendingNeedsDate: false,
      exampleDocKey: 'section53Notification',
      options: [
        { value: 'approved', label: 'มีหนังสือแจ้งการเก็บ จัดหา หรือรวบรวมพันธุ์พืชฯ ตามมาตรา 53 แห่งพระราชบัญญัติคุ้มครองพันธุ์พืช พ.ศ. 2542 (แนบสำเนา 1 ชุด)' },
        { value: 'pending', label: 'ไม่มีหนังสือแจ้งการเก็บ จัดหา หรือรวบรวมพันธุ์พืชฯ อยู่ระหว่างดำเนินการ' }
      ],
      legacy: { enabledKey: 'isPlant', statusKey: 'plantSubType', submittedDateKey: 'plantSubmittedDate' },
      slots: { approved: 'plantApproved', pending: 'plantPending' }
    }
  },
  urls: {
    section53Notification: 'https://research.mfu.ac.th/rs-variousresearch/rs-plant-species.html',
    section53FormsPage: 'https://www.doa.go.th/pvp/?page_id=13853',
    humanEthicsCertificate: 'https://ec.mfu.ac.th/ec-index.html',
    animalEthicsCertificate: 'https://research.mfu.ac.th/rs-variousresearch/rs-manual-animal.html'
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

function normalizeTextMap(text, fallback) {
  const source = toObject(text, fallback)
  return Object.keys(fallback).reduce((acc, key) => {
    acc[key] = String(source[key] !== undefined ? source[key] : fallback[key]).trim() || fallback[key]
    return acc
  }, {})
}

function normalizeUrlMap(urls, fallback) {
  const source = toObject(urls, fallback)
  return Object.keys(fallback).reduce((acc, key) => {
    acc[key] = String(source[key] !== undefined ? source[key] : fallback[key]).trim() || fallback[key]
    return acc
  }, {})
}

function normalizeStatusMap(statuses, fallback) {
  const source = toObject(statuses, fallback)
  return {
    approved: String(source.approved !== undefined ? source.approved : fallback.approved).trim() || fallback.approved,
    pending: String(source.pending !== undefined ? source.pending : fallback.pending).trim() || fallback.pending
  }
}

function normalizeGroup(group, fallback) {
  const source = toObject(group, fallback)
  const fallbackOptions = Array.isArray(fallback.options) ? fallback.options : []
  const options = Array.isArray(source.options) ? source.options : fallbackOptions

  return {
    key: String(source.key !== undefined ? source.key : fallback.key).trim() || fallback.key,
    title: String(source.title !== undefined ? source.title : fallback.title).trim() || fallback.title,
    pendingNeedsDate: Boolean(source.pendingNeedsDate),
    exampleDocKey: String(source.exampleDocKey !== undefined ? source.exampleDocKey : fallback.exampleDocKey).trim() || fallback.exampleDocKey,
    options: options.map((option, index) => {
      const fallbackOption = fallbackOptions[index] || fallbackOptions[0] || { value: '', label: '' }
      return {
        value: String(option && option.value !== undefined ? option.value : fallbackOption.value).trim() || fallbackOption.value,
        label: String(option && option.label !== undefined ? option.label : fallbackOption.label).trim() || fallbackOption.label
      }
    }).filter(option => option.value && option.label),
    legacy: clone(toObject(source.legacy, fallback.legacy)),
    slots: clone(toObject(source.slots, fallback.slots))
  }
}

function buildNormalizedResearchStandardConfig(rawConfig = {}) {
  const defaults = clone(DEFAULT_RESEARCH_STANDARD_CONFIG)
  const source = toObject(rawConfig, {})
  const groups = toObject(source.groups, defaults.groups)

  return {
    statuses: normalizeStatusMap(source.statuses, defaults.statuses),
    text: normalizeTextMap(source.text, defaults.text),
    urls: normalizeUrlMap(source.urls, defaults.urls),
    groups: Object.keys(defaults.groups).reduce((acc, key) => {
      acc[key] = normalizeGroup(groups[key], defaults.groups[key])
      return acc
    }, {})
  }
}

function applyResearchStandardConfig(config) {
  RESEARCH_STANDARD_STATUSES = config.statuses
  RESEARCH_STANDARD_TEXT = config.text
  RESEARCH_STANDARD_GROUPS = config.groups
  RESEARCH_STANDARD_GROUP_KEYS = Object.keys(config.groups)
  RESEARCH_STANDARD_URLS = config.urls
}

export let RESEARCH_STANDARD_STATUSES = clone(DEFAULT_RESEARCH_STANDARD_CONFIG.statuses)
export let RESEARCH_STANDARD_TEXT = clone(DEFAULT_RESEARCH_STANDARD_CONFIG.text)
export let RESEARCH_STANDARD_GROUPS = clone(DEFAULT_RESEARCH_STANDARD_CONFIG.groups)
export let RESEARCH_STANDARD_GROUP_KEYS = Object.keys(RESEARCH_STANDARD_GROUPS)
export let RESEARCH_STANDARD_URLS = clone(DEFAULT_RESEARCH_STANDARD_CONFIG.urls)

export function setResearchStandardRuntimeConfig(rawConfig) {
  const config = buildNormalizedResearchStandardConfig(rawConfig)
  applyResearchStandardConfig(config)
  return config
}

export function getResearchStandardGroupMeta(groupKey) {
  const key = String(groupKey || '').trim()
  return RESEARCH_STANDARD_GROUPS[key] || null
}

export function getResearchStandardGroupList() {
  return RESEARCH_STANDARD_GROUP_KEYS.map(key => RESEARCH_STANDARD_GROUPS[key]).filter(Boolean)
}

export function getResearchStandardExampleDocUrl(docKey) {
  const key = String(docKey || '').trim()
  return RESEARCH_STANDARD_URLS[key] || ''
}

export function normalizeResearchStandardStatus(status) {
  const value = String(status || '').trim()
  const allowed = Object.values(RESEARCH_STANDARD_STATUSES)
  return allowed.includes(value) ? value : ''
}