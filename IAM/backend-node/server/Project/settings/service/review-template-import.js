'use strict';

const path = require('path');
const { PDFParse } = require('pdf-parse');
const { MANAGED_SETTING_KEYS, RESEARCH_FORM_SETTING_GROUP } = require('./research-form-config');

const TEMPLATE_TARGETS = Object.freeze({
  chairman: {
    settingKey: MANAGED_SETTING_KEYS.CHAIRMAN_CHECKLIST,
    description: 'Chairman checklist templates for ResearchFormRS'
  },
  committee: {
    settingKey: MANAGED_SETTING_KEYS.COMMITTEE_RUBRIC,
    description: 'Committee rubric templates for ResearchFormRS'
  }
});

const DEFAULT_COMMITTEE_FUND_TYPES = Object.freeze([
  { value: 'new', label: 'ทุนวิจัยใหม่' },
  { value: 'develop', label: 'ทุนพัฒนา' },
  { value: 'extension', label: 'ทุนต่อยอด/ทุนอุตสาหกรรม' }
]);

function parseJsonish(value, fallbackValue) {
  if (value === undefined || value === null || value === '') return fallbackValue;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (err) {
      return fallbackValue;
    }
  }
  return value;
}

function normalizeTargetType(value) {
  return String(value || '').trim().toLowerCase();
}

function ensureSupportedTargetType(value) {
  const targetType = normalizeTargetType(value);
  if (!TEMPLATE_TARGETS[targetType]) {
    throw new Error('targetType must be chairman or committee');
  }
  return targetType;
}

function normalizeLine(value) {
  return String(value || '')
    .replace(/\t+/g, ' ')
    .replace(/[ \u00A0]{2,}/g, ' ')
    .replace(/[•●▪◦]/g, '•')
    .trim();
}

function shouldIgnoreLine(line) {
  if (!line) return true;
  if (/^page\s+\d+(\s+of\s+\d+)?$/i.test(line)) return true;
  if (/^\d+\s*\/\s*\d+$/.test(line)) return true;
  if (/^(แบบฟอร์ม|template|checklist|rubric)$/i.test(line)) return true;
  return false;
}

function buildMeaningfulLines(text) {
  const rawLines = String(text || '').split(/\r?\n/);
  const lines = [];
  for (let index = 0; index < rawLines.length; index += 1) {
    const line = normalizeLine(rawLines[index]);
    if (shouldIgnoreLine(line)) continue;
    if (lines.length > 0 && lines[lines.length - 1] === line) continue;
    lines.push(line);
  }
  return lines;
}

function toKey(text, prefix, index) {
  const normalized = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || `${prefix}_${index + 1}`;
}

function stripBulletPrefix(line) {
  return String(line || '')
    .replace(/^[•\-*]+\s*/, '')
    .replace(/^\(?\d+(?:\.\d+)?\)?[.)-]?\s+/, '')
    .trim();
}

function isLikelySectionHeading(line) {
  if (!line) return false;
  if (/^\d+[.)]\s+/.test(line)) return true;
  if (/^\d+\s+[ก-๙A-Za-z]/.test(line)) return true;
  return false;
}

function createFallbackSection() {
  return {
    sectionKey: 'imported_section_1',
    sectionLabel: 'Imported Checklist',
    description: '',
    items: []
  };
}

function createChairmanItem(label, index) {
  return {
    itemKey: toKey(label, 'item', index),
    label,
    description: ''
  };
}

function parseChairmanSections(lines) {
  const sections = [];
  let currentSection = null;
  let pendingDescription = [];

  const ensureSection = function ensureSection() {
    if (!currentSection) {
      currentSection = createFallbackSection();
      sections.push(currentSection);
    }
    return currentSection;
  };

  lines.forEach((line) => {
    if (isLikelySectionHeading(line)) {
      currentSection = {
        sectionKey: toKey(line, 'section', sections.length),
        sectionLabel: line,
        description: '',
        items: []
      };
      sections.push(currentSection);
      pendingDescription = [];
      return;
    }

    const itemLabel = stripBulletPrefix(line);
    if (!itemLabel || itemLabel.length < 3) return;

    const targetSection = ensureSection();
    if (!targetSection.items.length && itemLabel.length <= 120 && /[:;]$/.test(itemLabel)) {
      pendingDescription.push(itemLabel.replace(/[:;]+$/, ''));
      targetSection.description = pendingDescription.join(' ');
      return;
    }

    targetSection.items.push(createChairmanItem(itemLabel, targetSection.items.length));
  });

  return sections
    .map(function normalizeSection(section, index) {
      return {
        sectionKey: section.sectionKey || `section_${index + 1}`,
        sectionLabel: section.sectionLabel || `หัวข้อ ${index + 1}`,
        description: section.description || '',
        items: (section.items || []).filter(function keepItem(item) {
          return item && item.label;
        })
      };
    })
    .filter(function keepSection(section) {
      return section.items.length > 0;
    });
}

function parseCommitteeRow(line, fundTypeOptions) {
  const numberedMatch = String(line || '').match(/^(\d{1,2})[.)]?\s+(.+)$/);
  if (!numberedMatch) return null;

  const no = Number(numberedMatch[1]);
  if (!Number.isFinite(no)) return null;

  const tokens = numberedMatch[2].split(/\s+/).filter(Boolean);
  const weightTokens = [];
  while (tokens.length > 0 && /^-?\d+(?:\.\d+)?$/.test(tokens[tokens.length - 1])) {
    weightTokens.unshift(tokens.pop());
  }

  let title = tokens.join(' ').trim();
  let desc = '0–2';
  const descMatch = title.match(/(\d+\s*[-–]\s*\d+)\s*$/);
  if (descMatch) {
    desc = descMatch[1].replace(/\s+/g, '');
    title = title.slice(0, descMatch.index).trim();
  }

  if (!title) return null;

  const normalizedWeights = {};
  fundTypeOptions.forEach(function assignWeight(option, index) {
    const rawValue = weightTokens[index];
    normalizedWeights[option.value] = rawValue === undefined ? null : Number(rawValue);
    if (!Number.isFinite(normalizedWeights[option.value])) {
      normalizedWeights[option.value] = null;
    }
  });

  return {
    no,
    title,
    desc,
    weights: normalizedWeights
  };
}

function normalizeFundTypeOptions(rawOptions) {
  const source = Array.isArray(rawOptions) ? rawOptions : DEFAULT_COMMITTEE_FUND_TYPES;
  const seen = new Set();
  const normalized = source.map(function normalizeOption(option, index) {
    const rawValue = option && (option.value || option.key);
    const value = String(rawValue || `fund_${index + 1}`).trim() || `fund_${index + 1}`;
    if (seen.has(value)) return null;
    seen.add(value);
    return {
      value,
      label: String((option && (option.label || option.name)) || value).trim() || value
    };
  }).filter(Boolean);

  return normalized.length > 0 ? normalized : DEFAULT_COMMITTEE_FUND_TYPES.map(function cloneOption(option) {
    return { ...option };
  });
}

function parseCommitteeRubric(lines, options) {
  const fundTypeOptions = normalizeFundTypeOptions(options && options.fundTypeOptions);
  const rubricRows = lines
    .map(function mapRow(line) {
      return parseCommitteeRow(line, fundTypeOptions);
    })
    .filter(Boolean);

  return {
    templateVersion: Number(options && options.templateVersion) || 1,
    reviewerRole: 'committee',
    reviewerLabel: String((options && options.reviewerLabel) || 'คณะกรรมการ').trim() || 'คณะกรรมการ',
    scoreOptions: Array.isArray(options && options.scoreOptions) && options.scoreOptions.length
      ? options.scoreOptions.map(Number).filter(Number.isFinite)
      : [0, 1, 2],
    fundTypeOptions,
    rubricRows
  };
}

function parseChairmanChecklist(lines, options) {
  const fundingTypeKey = String((options && options.fundingTypeKey) || 'imported-funding').trim() || 'imported-funding';
  const fundingTypeLabel = String((options && options.fundingTypeLabel) || fundingTypeKey).trim() || fundingTypeKey;
  const sections = parseChairmanSections(lines);
  const currentConfig = parseJsonish(options && options.currentConfig, {}) || {};
  const currentTemplates = Array.isArray(currentConfig.fundingTemplates) ? currentConfig.fundingTemplates : [];
  const nextFundingTemplate = {
    fundingTypeKey,
    fundingTypeLabel,
    sections: sections.length > 0 ? sections : [createFallbackSection()]
  };

  const mergedFundingTemplates = [];
  let replaced = false;
  currentTemplates.forEach(function appendTemplate(template) {
    if (template && String(template.fundingTypeKey || '').trim() === fundingTypeKey) {
      mergedFundingTemplates.push(nextFundingTemplate);
      replaced = true;
      return;
    }
    mergedFundingTemplates.push(template);
  });
  if (!replaced) mergedFundingTemplates.push(nextFundingTemplate);

  return {
    templateVersion: Number(currentConfig.templateVersion) || 1,
    reviewerRole: String(currentConfig.reviewerRole || 'chairman').trim() || 'chairman',
    reviewerLabel: String(currentConfig.reviewerLabel || 'ประธานสำนัก').trim() || 'ประธานสำนัก',
    importStatus: sections.length > 0 ? 'imported' : 'partial',
    note: String(currentConfig.note || '').trim() || 'Imported from PDF template preview',
    fundingTemplates: mergedFundingTemplates
  };
}

function buildPreviewSummary(targetType, draftConfig, warnings) {
  if (targetType === 'chairman') {
    const fundingTemplates = Array.isArray(draftConfig.fundingTemplates) ? draftConfig.fundingTemplates : [];
    const latestTemplate = fundingTemplates[fundingTemplates.length - 1] || null;
    const sectionCount = latestTemplate && Array.isArray(latestTemplate.sections) ? latestTemplate.sections.length : 0;
    const itemCount = latestTemplate && Array.isArray(latestTemplate.sections)
      ? latestTemplate.sections.reduce(function countItems(total, section) {
        return total + ((section && Array.isArray(section.items)) ? section.items.length : 0);
      }, 0)
      : 0;

    return {
      sectionCount,
      itemCount,
      fundingTypeKey: latestTemplate ? latestTemplate.fundingTypeKey : '',
      fundingTypeLabel: latestTemplate ? latestTemplate.fundingTypeLabel : '',
      warningCount: warnings.length
    };
  }

  return {
    rubricRowCount: Array.isArray(draftConfig.rubricRows) ? draftConfig.rubricRows.length : 0,
    fundTypeCount: Array.isArray(draftConfig.fundTypeOptions) ? draftConfig.fundTypeOptions.length : 0,
    warningCount: warnings.length
  };
}

async function extractPdfText(file) {
  if (!file || !file.buffer || !file.originalname) {
    throw new Error('PDF file is required');
  }

  const ext = path.extname(String(file.originalname || '')).toLowerCase();
  const mime = String(file.mimetype || '').toLowerCase();
  if (ext !== '.pdf' && mime !== 'application/pdf') {
    throw new Error('Only PDF files are supported');
  }

  const parser = new PDFParse({ data: file.buffer });
  try {
    const parsed = await parser.getText();
    const text = String(
      (parsed && (parsed.text || parsed.content || parsed.rawText)) || ''
    ).trim();
    if (!text) {
      throw new Error('Unable to extract readable text from PDF');
    }

    return text;
  } finally {
    if (parser && typeof parser.destroy === 'function') {
      await parser.destroy();
    }
  }
}

async function previewImportedTemplate(options) {
  const targetType = ensureSupportedTargetType(options && options.targetType);
  const text = await extractPdfText(options && options.file);
  const lines = buildMeaningfulLines(text);
  const warnings = [];

  let draftConfig;
  if (targetType === 'chairman') {
    draftConfig = parseChairmanChecklist(lines, options || {});
    const importedTemplate = draftConfig.fundingTemplates[draftConfig.fundingTemplates.length - 1] || null;
    const itemCount = importedTemplate && importedTemplate.sections
      ? importedTemplate.sections.reduce(function countItems(total, section) {
        return total + ((section && section.items) ? section.items.length : 0);
      }, 0)
      : 0;
    if (!itemCount) warnings.push('ไม่พบ checklist item ชัดเจนจากข้อความ PDF จึงได้ draft แบบโครงว่างบางส่วน');
  } else {
    draftConfig = parseCommitteeRubric(lines, options || {});
    if (!Array.isArray(draftConfig.rubricRows) || !draftConfig.rubricRows.length) {
      warnings.push('ไม่พบ rubric row ที่ parse ได้จาก PDF จำเป็นต้องตรวจและแก้ไขก่อนบันทึก');
    }
  }

  return {
    targetType,
    settingKey: TEMPLATE_TARGETS[targetType].settingKey,
    description: TEMPLATE_TARGETS[targetType].description,
    fileName: options && options.file ? options.file.originalname : '',
    extractedTextPreview: lines.slice(0, 40).join('\n'),
    warnings,
    summary: buildPreviewSummary(targetType, draftConfig, warnings),
    draftConfig
  };
}

function buildApplyPayload(targetType, draftConfig) {
  const normalizedTargetType = ensureSupportedTargetType(targetType);
  const config = parseJsonish(draftConfig, null);
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('draftConfig must be an object');
  }

  return {
    group: RESEARCH_FORM_SETTING_GROUP,
    settings: [
      {
        key: TEMPLATE_TARGETS[normalizedTargetType].settingKey,
        value: config,
        description: TEMPLATE_TARGETS[normalizedTargetType].description
      }
    ]
  };
}

module.exports = {
  TEMPLATE_TARGETS,
  previewImportedTemplate,
  buildApplyPayload,
  normalizeFundTypeOptions
};