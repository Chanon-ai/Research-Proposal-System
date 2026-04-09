import templates from './chairmanChecklistPdfTemplates.json'

const TEMPLATE_CACHE = new Map()

function normalizeKey (value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
}

function fixThaiPdfExtractSpacing (value) {
  const text = String(value || '')
  if (!text) return text

  // pdf-parse can drop THAI CHARACTER NIKHAHIT and leave a space before THAI CHARACTER SARA AA.
  // Example: "ประจ า" instead of "ประจำ", "ล าดับ" instead of "ลำดับ".
  // Convert: <Thai consonant + optional marks> + space(s) + SARA AA + <Thai letter/mark> => SARA AM.
  return text.replace(
    // eslint-disable-next-line no-misleading-character-class
    /([\u0E01-\u0E2E][\u0E31-\u0E4E]*)\s+\u0E32(?=[\u0E01-\u0E2E\u0E40-\u0E44\u0E31-\u0E4E])/g,
    '$1\u0E33'
  )
}

function cloneAndFixTemplate (node) {
  if (typeof node === 'string') return fixThaiPdfExtractSpacing(node)
  if (Array.isArray(node)) return node.map(cloneAndFixTemplate)
  if (!node || typeof node !== 'object') return node
  const out = {}
  Object.keys(node).forEach((k) => {
    out[k] = cloneAndFixTemplate(node[k])
  })
  return out
}

function mapThaiFundingTypeToKey (rawLabel) {
  const thai = String(rawLabel || '').replace(/\s+/g, '')
  if (!thai) return ''
  if (thai.includes('พัฒนานักวิจัย') || thai.includes('ทุนพัฒนา')) return 'researcher-development'
  if (thai.includes('สอดคล้อง') || thai.includes('ยุทธศาสตร์')) return 'strategic-research'
  if (thai.includes('ต่อยอด') || thai.includes('ภาคอุตสาหกรรม') || thai.includes('อุตสาหกรรม')) return 'industry-extension'
  if (thai.includes('นักวิจัยใหม่') || thai.includes('นักวิจัยรุ่นใหม่') || thai.includes('รุ่นใหม่')) return 'new-researcher'
  return ''
}

export function getChairmanChecklistPdfTemplate (fundingTypeKey) {
  const raw = String(fundingTypeKey || '').trim()
  const key = normalizeKey(raw)

  const resolveFromKey = (resolvedKey) => {
    if (!resolvedKey || !templates || !templates[resolvedKey]) return null
    if (TEMPLATE_CACHE.has(resolvedKey)) return TEMPLATE_CACHE.get(resolvedKey)
    const fixed = cloneAndFixTemplate(templates[resolvedKey])
    TEMPLATE_CACHE.set(resolvedKey, fixed)
    return fixed
  }

  return (
    resolveFromKey(key) ||
    resolveFromKey(mapThaiFundingTypeToKey(raw)) ||
    null
  )
}
