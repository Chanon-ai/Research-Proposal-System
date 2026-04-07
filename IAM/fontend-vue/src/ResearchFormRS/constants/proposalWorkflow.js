const DEFAULT_PROPOSAL_WORKFLOW = Object.freeze({
  statuses: [
    'draft',
    'pending_confirm',
    'submitted',
    'faculty_review_pending',
    'faculty_approved',
    'faculty_rejected',
    'office_received',
    'document_checking',
    'assigned_to_committee',
    'under_review',
    'committee_valuated',
    'meeting_completed',
    'revision_requested',
    'resubmitted',
    'second_round_review',
    'approved',
    'rejected',
    'announced'
  ],
  inProgressStatuses: [
    'pending_confirm',
    'submitted',
    'faculty_review_pending',
    'faculty_approved',
    'faculty_rejected',
    'office_received',
    'document_checking',
    'assigned_to_committee',
    'under_review',
    'committee_valuated',
    'meeting_completed',
    'resubmitted',
    'second_round_review'
  ],
  filterInProgressStatuses: [
    'submitted',
    'faculty_review_pending',
    'faculty_approved',
    'faculty_rejected',
    'office_received',
    'document_checking',
    'assigned_to_committee',
    'under_review',
    'committee_valuated',
    'meeting_completed',
    'revision_requested',
    'resubmitted',
    'second_round_review'
  ],
  approvedStatuses: ['approved', 'announced'],
  readOnlyStatuses: [
    'pending_confirm',
    'submitted',
    'faculty_review_pending',
    'faculty_approved',
    'faculty_rejected',
    'office_received',
    'document_checking',
    'assigned_to_committee',
    'under_review',
    'committee_valuated',
    'meeting_completed',
    'approved',
    'rejected',
    'announced'
  ],
  allowedTransitions: {
    draft: ['pending_confirm'],
    pending_confirm: ['submitted'],
    submitted: ['faculty_review_pending'],
    faculty_review_pending: ['faculty_approved', 'rejected'],
    faculty_approved: ['office_received'],
    faculty_rejected: ['rejected'],
    office_received: ['document_checking'],
    document_checking: ['assigned_to_committee'],
    assigned_to_committee: ['under_review'],
    under_review: ['committee_valuated'],
    committee_valuated: ['meeting_completed'],
    meeting_completed: ['approved', 'rejected', 'revision_requested'],
    revision_requested: ['resubmitted'],
    resubmitted: ['second_round_review'],
    second_round_review: ['committee_valuated'],
    approved: ['announced'],
    rejected: ['announced']
  },
  stepMap: {
    draft: 1,
    pending_confirm: 2,
    submitted: 2,
    faculty_review_pending: 3,
    faculty_approved: 4,
    faculty_rejected: 4,
    office_received: 5,
    document_checking: 6,
    assigned_to_committee: 7,
    under_review: 8,
    committee_valuated: 9,
    meeting_completed: 9,
    revision_requested: 5,
    resubmitted: 6,
    second_round_review: 8,
    approved: 10,
    rejected: 10,
    announced: 10
  },
  labels: {
    admin: {
      draft: 'แบบร่าง',
      pending_confirm: 'รอการยืนยัน',
      submitted: 'ยื่นแล้ว',
      faculty_review_pending: 'ประธานกำลังพิจารณา',
      faculty_approved: 'ประธานอนุมัติ',
      faculty_rejected: 'ประธานไม่อนุมัติ',
      office_received: 'ส่วนบริหารรับแล้ว',
      document_checking: 'ตรวจสอบเอกสาร',
      assigned_to_committee: 'มอบหมายกรรมการแล้ว',
      under_review: 'พิจารณารอบ 1',
      committee_valuated: 'กรรมการได้ให้ความเห็นแล้ว',
      meeting_completed: 'ส่วนบริหารกำลังจัดเตรียมผล',
      revision_requested: 'ขอแก้ไข',
      resubmitted: 'ส่งแก้ไขแล้ว',
      second_round_review: 'พิจารณารอบ 2',
      approved: 'อนุมัติ',
      rejected: 'ปฏิเสธ',
      announced: 'ประกาศผล'
    },
    researcher: {
      draft: 'แบบร่าง',
      pending_confirm: 'รอยืนยันผู้ร่วมโครงการ',
      submitted: 'ยื่นแล้ว',
      faculty_review_pending: 'ประธานกำลังพิจารณา',
      faculty_approved: 'ประธานอนุมัติ',
      faculty_rejected: 'ประธานไม่อนุมัติ',
      office_received: 'ส่วนบริหารรับแล้ว',
      document_checking: 'ตรวจสอบเอกสาร',
      assigned_to_committee: 'มอบหมายกรรมการแล้ว',
      under_review: 'พิจารณารอบ 1',
      committee_valuated: 'กรรมการได้ให้ความเห็นแล้ว',
      meeting_completed: 'ส่วนบริหารกำลังจัดเตรียมผล',
      revision_requested: 'ขอแก้ไข',
      resubmitted: 'ส่งแก้ไขแล้ว',
      second_round_review: 'พิจารณารอบ 2',
      approved: 'อนุมัติ',
      rejected: 'ปฏิเสธ',
      announced: 'ประกาศผล'
    },
    badge: {
      draft: 'ร่าง',
      pending_confirm: 'รอการยืนยัน',
      submitted: 'ยื่นแล้ว',
      faculty_review_pending: 'ประธานกำลังพิจารณา',
      faculty_approved: 'ประธานอนุมัติ',
      faculty_rejected: 'ประธานไม่อนุมัติ',
      office_received: 'สำนักงานรับเรื่องแล้ว',
      document_checking: 'ตรวจเอกสาร',
      assigned_to_committee: 'มอบหมายกรรมการแล้ว',
      under_review: 'พิจารณารอบ 1',
      committee_valuated: 'กรรมการได้ให้ความเห็นแล้ว',
      meeting_completed: 'ส่วนบริหารกำลังจัดเตรียมผล',
      revision_requested: 'ขอแก้ไข',
      resubmitted: 'ส่งแก้ไขแล้ว',
      second_round_review: 'พิจารณารอบ 2',
      approved: 'อนุมัติ',
      rejected: 'ไม่อนุมัติ',
      announced: 'ประกาศผล'
    }
  },
  colors: {
    hex: {
      draft: '#9CA3AF',
      pending_confirm: '#60A5FA',
      submitted: '#3B82F6',
      faculty_review_pending: '#3B82F6',
      faculty_approved: '#34D399',
      faculty_rejected: '#F87171',
      office_received: '#38BDF8',
      document_checking: '#FACC15',
      assigned_to_committee: '#A78BFA',
      under_review: '#6366F1',
      committee_valuated: '#EF4444',
      meeting_completed: '#FB7185',
      revision_requested: '#FB923C',
      resubmitted: '#22D3EE',
      second_round_review: '#8B5CF6',
      approved: '#059669',
      rejected: '#EF4444',
      announced: '#14B8A6'
    },
    reportHex: {
      draft: '#6c757d',
      submitted: '#17a2b8',
      faculty_review_pending: '#ffc107',
      faculty_approved: '#007bff',
      faculty_rejected: '#dc3545',
      office_received: '#17a2b8',
      document_checking: '#fd7e14',
      assigned_to_committee: '#007bff',
      under_review: '#e83e8c',
      committee_valuated: '#dc3545',
      meeting_completed: '#fd7e14',
      revision_requested: '#dc3545',
      resubmitted: '#20c997',
      second_round_review: '#fd7e14',
      approved: '#28a745',
      rejected: '#dc3545',
      announced: '#007bff'
    },
    coreui: {
      admin: {
        draft: 'secondary',
        pending_confirm: 'secondary',
        submitted: 'info',
        faculty_review_pending: 'warning',
        faculty_approved: 'primary',
        faculty_rejected: 'danger',
        office_received: 'primary',
        document_checking: 'warning',
        assigned_to_committee: 'info',
        under_review: 'danger',
        committee_valuated: 'danger',
        meeting_completed: 'warning',
        revision_requested: 'danger',
        resubmitted: 'info',
        second_round_review: 'warning',
        approved: 'success',
        rejected: 'danger',
        announced: 'primary'
      },
      badge: {
        draft: 'secondary',
        pending_confirm: 'secondary',
        submitted: 'info',
        faculty_review_pending: 'warning',
        faculty_approved: 'primary',
        faculty_rejected: 'danger',
        office_received: 'primary',
        document_checking: 'warning',
        assigned_to_committee: 'info',
        under_review: 'warning',
        committee_valuated: 'danger',
        meeting_completed: 'warning',
        revision_requested: 'danger',
        resubmitted: 'info',
        second_round_review: 'warning',
        approved: 'success',
        rejected: 'danger',
        announced: 'success'
      },
      researchForm: {
        draft: 'secondary',
        pending_confirm: 'warning',
        submitted: 'info',
        faculty_review_pending: 'warning',
        faculty_approved: 'primary',
        faculty_rejected: 'danger',
        office_received: 'primary',
        document_checking: 'warning',
        assigned_to_committee: 'info',
        under_review: 'danger',
        committee_valuated: 'danger',
        meeting_completed: 'warning',
        revision_requested: 'danger',
        resubmitted: 'info',
        second_round_review: 'warning',
        approved: 'success',
        rejected: 'danger',
        announced: 'primary'
      }
    }
  },
  committeeDashboard: {
    flowStatuses: [
      'assigned_to_committee',
      'under_review',
      'committee_valuated',
      'meeting_completed',
      'revision_requested',
      'resubmitted',
      'second_round_review',
      'announced'
    ],
    pendingStatuses: [
      'assigned_to_committee',
      'under_review',
      'second_round_review'
    ],
    reviewedStatuses: [
      'committee_valuated',
      'meeting_completed',
      'approved',
      'rejected'
    ],
    labels: {
      assigned_to_committee: 'รอการประเมิน',
      under_review: 'พิจารณารอบ {roundNo}',
      committee_valuated: 'ส่งผลการประเมินแล้ว',
      meeting_completed: 'ส่วนบริหารกำลังจัดเตรียมผล',
      revision_requested: 'ขอแก้ไข',
      resubmitted: 'ส่งแก้ไขแล้ว',
      second_round_review: 'พิจารณารอบ {roundNo}',
      announced: 'ประกาศผล'
    },
    colors: {
      background: {
        assigned_to_committee: 'rgba(59, 130, 246, 0.45)',
        under_review: 'rgba(124, 58, 237, 0.45)',
        committee_valuated: 'rgba(220, 53, 69, 0.45)',
        meeting_completed: 'rgba(249, 115, 22, 0.45)',
        revision_requested: 'rgba(249, 115, 22, 0.45)',
        resubmitted: 'rgba(6, 182, 212, 0.45)',
        second_round_review: 'rgba(168, 85, 247, 0.45)',
        announced: 'rgba(17, 24, 39, 0.38)'
      },
      border: {
        assigned_to_committee: 'rgba(59, 130, 246, 1)',
        under_review: 'rgba(124, 58, 237, 1)',
        committee_valuated: 'rgba(220, 53, 69, 1)',
        meeting_completed: 'rgba(249, 115, 22, 1)',
        revision_requested: 'rgba(249, 115, 22, 1)',
        resubmitted: 'rgba(6, 182, 212, 1)',
        second_round_review: 'rgba(168, 85, 247, 1)',
        announced: 'rgba(17, 24, 39, 1)'
      }
    }
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

function toStringList(value, fallback) {
  const list = Array.isArray(value) ? value : fallback
  return list.map(item => normalizeStatusKey(item)).filter(Boolean)
}

function mergeUniqueStatusList(source, fallback) {
  return Array.from(new Set([...toStringList(fallback, fallback), ...toStringList(source, fallback)]))
}

function normalizeStatusKeyedObject(value) {
  const source = toObject(value, {})
  return Object.keys(source).reduce((acc, key) => {
    acc[normalizeStatusKey(key)] = source[key]
    return acc
  }, {})
}

function normalizeLabels(labels, fallback) {
  const source = normalizeStatusKeyedObject(toObject(labels, fallback))
  return Object.keys(fallback).reduce((acc, key) => {
    const normalizedKey = normalizeStatusKey(key)
    acc[normalizedKey] = String(source[normalizedKey] !== undefined ? source[normalizedKey] : fallback[key]).trim() || fallback[key]
    return acc
  }, {})
}

function normalizeColorMap(colors, fallback) {
  const source = normalizeStatusKeyedObject(toObject(colors, fallback))
  return Object.keys(fallback).reduce((acc, key) => {
    const normalizedKey = normalizeStatusKey(key)
    acc[normalizedKey] = String(source[normalizedKey] !== undefined ? source[normalizedKey] : fallback[key]).trim() || fallback[key]
    return acc
  }, {})
}

function normalizeStepMap(stepMap, fallback) {
  const source = normalizeStatusKeyedObject(toObject(stepMap, fallback))
  return Object.keys(fallback).reduce((acc, key) => {
    const normalizedKey = normalizeStatusKey(key)
    acc[normalizedKey] = Number(source[normalizedKey] !== undefined ? source[normalizedKey] : fallback[key]) || fallback[key]
    return acc
  }, {})
}

function normalizeAllowedTransitions(transitions, fallback) {
  const source = normalizeStatusKeyedObject(toObject(transitions, fallback))
  return Object.keys(fallback).reduce((acc, key) => {
    const normalizedKey = normalizeStatusKey(key)
    const sourceValue = source[normalizedKey]
    acc[normalizedKey] = sourceValue !== undefined
      ? mergeUniqueStatusList(sourceValue, fallback[key])
      : toStringList(fallback[key], fallback[key])
    return acc
  }, {})
}

function buildNormalizedWorkflowConfig(rawConfig = {}) {
  const defaults = clone(DEFAULT_PROPOSAL_WORKFLOW)
  const source = toObject(rawConfig, {})
  const labels = toObject(source.labels, {})
  const colors = toObject(source.colors, {})
  const committeeDashboard = toObject(source.committeeDashboard, {})
  const committeeDashboardColors = toObject(committeeDashboard.colors, {})

  return {
    statuses: mergeUniqueStatusList(source.statuses, defaults.statuses),
    inProgressStatuses: mergeUniqueStatusList(source.inProgressStatuses, defaults.inProgressStatuses),
    filterInProgressStatuses: mergeUniqueStatusList(source.filterInProgressStatuses, defaults.filterInProgressStatuses),
    approvedStatuses: mergeUniqueStatusList(source.approvedStatuses, defaults.approvedStatuses),
    readOnlyStatuses: mergeUniqueStatusList(source.readOnlyStatuses, defaults.readOnlyStatuses),
    allowedTransitions: normalizeAllowedTransitions(source.allowedTransitions, defaults.allowedTransitions),
    stepMap: normalizeStepMap(source.stepMap, defaults.stepMap),
    labels: {
      admin: normalizeLabels(labels.admin, defaults.labels.admin),
      researcher: normalizeLabels(labels.researcher, defaults.labels.researcher),
      badge: normalizeLabels(labels.badge, defaults.labels.badge)
    },
    colors: {
      hex: normalizeColorMap(colors.hex, defaults.colors.hex),
      reportHex: normalizeColorMap(colors.reportHex, defaults.colors.reportHex),
      coreui: {
        admin: normalizeColorMap(colors.coreui && colors.coreui.admin, defaults.colors.coreui.admin),
        badge: normalizeColorMap(colors.coreui && colors.coreui.badge, defaults.colors.coreui.badge),
        researchForm: normalizeColorMap(colors.coreui && colors.coreui.researchForm, defaults.colors.coreui.researchForm)
      }
    },
    committeeDashboard: {
      flowStatuses: mergeUniqueStatusList(committeeDashboard.flowStatuses, defaults.committeeDashboard.flowStatuses),
      pendingStatuses: mergeUniqueStatusList(committeeDashboard.pendingStatuses, defaults.committeeDashboard.pendingStatuses),
      reviewedStatuses: mergeUniqueStatusList(committeeDashboard.reviewedStatuses, defaults.committeeDashboard.reviewedStatuses),
      labels: normalizeLabels(committeeDashboard.labels, defaults.committeeDashboard.labels),
      colors: {
        background: normalizeColorMap(committeeDashboardColors.background, defaults.committeeDashboard.colors.background),
        border: normalizeColorMap(committeeDashboardColors.border, defaults.committeeDashboard.colors.border)
      }
    }
  }
}

function applyWorkflowConfig(config) {
  PROPOSAL_STATUSES = config.statuses
  PROPOSAL_STATUS_KEYS = PROPOSAL_STATUSES
  PROPOSAL_STATUS_KEYS_REPORT = PROPOSAL_STATUSES.filter(status => status !== 'pending_confirm')
  IN_PROGRESS_STATUSES = config.inProgressStatuses
  FILTER_IN_PROGRESS_STATUSES = config.filterInProgressStatuses
  APPROVED_PROPOSAL_STATUSES = config.approvedStatuses
  READ_ONLY_PROPOSAL_STATUSES = config.readOnlyStatuses
  PROPOSAL_ALLOWED_TRANSITIONS = config.allowedTransitions
  STATUS_STEP_MAP = config.stepMap
  PROPOSAL_STATUS_LABELS_TH_ADMIN = config.labels.admin
  PROPOSAL_STATUS_LABELS_TH_RESEARCHER = config.labels.researcher
  PROPOSAL_STATUS_LABELS_TH_BADGE = config.labels.badge
  PROPOSAL_STATUS_COLORS_HEX = config.colors.hex
  STATUS_COLORS = PROPOSAL_STATUS_COLORS_HEX
  PROPOSAL_STATUS_COLORS_HEX_REPORT = config.colors.reportHex
  PROPOSAL_STATUS_COLORS_COREUI_ADMIN = config.colors.coreui.admin
  PROPOSAL_STATUS_COLORS_COREUI_BADGE = config.colors.coreui.badge
  PROPOSAL_STATUS_COLORS_COREUI_RESEARCH_FORM = config.colors.coreui.researchForm
  COMMITTEE_DASHBOARD_FLOW_STATUSES = config.committeeDashboard.flowStatuses
  COMMITTEE_PENDING_STATUSES = config.committeeDashboard.pendingStatuses
  COMMITTEE_REVIEWED_STATUSES = config.committeeDashboard.reviewedStatuses
  COMMITTEE_DASHBOARD_LABELS = config.committeeDashboard.labels
  COMMITTEE_DASHBOARD_BACKGROUND_COLORS = config.committeeDashboard.colors.background
  COMMITTEE_DASHBOARD_BORDER_COLORS = config.committeeDashboard.colors.border
}

export let PROPOSAL_STATUSES = clone(DEFAULT_PROPOSAL_WORKFLOW.statuses)
export let PROPOSAL_STATUS_KEYS = PROPOSAL_STATUSES
export let PROPOSAL_STATUS_KEYS_REPORT = PROPOSAL_STATUSES.filter(status => status !== 'pending_confirm')
export let IN_PROGRESS_STATUSES = clone(DEFAULT_PROPOSAL_WORKFLOW.inProgressStatuses)
export let FILTER_IN_PROGRESS_STATUSES = clone(DEFAULT_PROPOSAL_WORKFLOW.filterInProgressStatuses)
export let APPROVED_PROPOSAL_STATUSES = clone(DEFAULT_PROPOSAL_WORKFLOW.approvedStatuses)
export let READ_ONLY_PROPOSAL_STATUSES = clone(DEFAULT_PROPOSAL_WORKFLOW.readOnlyStatuses)
export let PROPOSAL_ALLOWED_TRANSITIONS = clone(DEFAULT_PROPOSAL_WORKFLOW.allowedTransitions)
export let STATUS_STEP_MAP = clone(DEFAULT_PROPOSAL_WORKFLOW.stepMap)
export let PROPOSAL_STATUS_LABELS_TH_ADMIN = clone(DEFAULT_PROPOSAL_WORKFLOW.labels.admin)
export let PROPOSAL_STATUS_LABELS_TH_RESEARCHER = clone(DEFAULT_PROPOSAL_WORKFLOW.labels.researcher)
export let PROPOSAL_STATUS_LABELS_TH_BADGE = clone(DEFAULT_PROPOSAL_WORKFLOW.labels.badge)
export let PROPOSAL_STATUS_COLORS_HEX = clone(DEFAULT_PROPOSAL_WORKFLOW.colors.hex)
export let STATUS_COLORS = PROPOSAL_STATUS_COLORS_HEX
export let PROPOSAL_STATUS_COLORS_HEX_REPORT = clone(DEFAULT_PROPOSAL_WORKFLOW.colors.reportHex)
export let PROPOSAL_STATUS_COLORS_COREUI_ADMIN = clone(DEFAULT_PROPOSAL_WORKFLOW.colors.coreui.admin)
export let PROPOSAL_STATUS_COLORS_COREUI_BADGE = clone(DEFAULT_PROPOSAL_WORKFLOW.colors.coreui.badge)
export let PROPOSAL_STATUS_COLORS_COREUI_RESEARCH_FORM = clone(DEFAULT_PROPOSAL_WORKFLOW.colors.coreui.researchForm)
export let COMMITTEE_DASHBOARD_FLOW_STATUSES = clone(DEFAULT_PROPOSAL_WORKFLOW.committeeDashboard.flowStatuses)
export let COMMITTEE_PENDING_STATUSES = clone(DEFAULT_PROPOSAL_WORKFLOW.committeeDashboard.pendingStatuses)
export let COMMITTEE_REVIEWED_STATUSES = clone(DEFAULT_PROPOSAL_WORKFLOW.committeeDashboard.reviewedStatuses)
export let COMMITTEE_DASHBOARD_LABELS = clone(DEFAULT_PROPOSAL_WORKFLOW.committeeDashboard.labels)
export let COMMITTEE_DASHBOARD_BACKGROUND_COLORS = clone(DEFAULT_PROPOSAL_WORKFLOW.committeeDashboard.colors.background)
export let COMMITTEE_DASHBOARD_BORDER_COLORS = clone(DEFAULT_PROPOSAL_WORKFLOW.committeeDashboard.colors.border)

export const COREUI_COLOR_HEX_MAP = Object.freeze({
  primary: '#321fdb',
  secondary: '#9da5b1',
  success: '#2eb85c',
  info: '#39f',
  warning: '#f9b115',
  danger: '#e55353',
  light: '#ebedef',
  dark: '#4f5d73'
})

export const PROPOSAL_STATUS_ALIASES = Object.freeze({
  admin_review: 'document_checking',
  committee_review: 'under_review',
  revision_required: 'revision_requested'
})

function normalizeStatusKey(status) {
  const key = String(status || '').trim().toLowerCase()
  return PROPOSAL_STATUS_ALIASES[key] || key
}

export function getProposalStatusSemanticColor(
  status,
  colorMap = PROPOSAL_STATUS_COLORS_COREUI_BADGE,
  fallbackColor = 'secondary'
) {
  const key = normalizeProposalStatus(status)
  return colorMap[key] || colorMap.submitted || fallbackColor
}

export function getCoreUiColorHex(colorName, alpha = null) {
  const hex = COREUI_COLOR_HEX_MAP[String(colorName || '').trim().toLowerCase()] || COREUI_COLOR_HEX_MAP.secondary
  if (alpha === null || alpha === undefined) return hex

  const normalizedAlpha = Math.max(0, Math.min(1, Number(alpha)))
  const raw = hex.replace('#', '')
  const full = raw.length === 3
    ? raw.split('').map((value) => value + value).join('')
    : raw

  if (full.length !== 6) return hex

  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)

  if ([r, g, b].some((value) => Number.isNaN(value))) return hex

  return `rgba(${r}, ${g}, ${b}, ${normalizedAlpha})`
}

export function setProposalWorkflowRuntimeConfig(rawConfig) {
  const config = buildNormalizedWorkflowConfig(rawConfig)
  applyWorkflowConfig(config)
  return config
}

export function normalizeProposalStatus(status) {
  return normalizeStatusKey(status)
}

export function isProposalReadOnlyStatus(status) {
  return READ_ONLY_PROPOSAL_STATUSES.includes(normalizeProposalStatus(status))
}

export function deriveProposalRoundNo(roundSource, status) {
  const key = normalizeProposalStatus(status)
  const candidate = roundSource && typeof roundSource === 'object'
    ? (roundSource.roundNo || roundSource.currentRound || roundSource.round)
    : roundSource
  const parsed = Number(candidate)
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed)
  if (key === 'second_round_review' || key.includes('second_round')) return 2
  return 1
}

export function getProposalStatusLabel(
  status,
  labelMap = PROPOSAL_STATUS_LABELS_TH_ADMIN,
  roundSource = null,
  options = {}
) {
  const key = normalizeProposalStatus(status)
  if (key === 'under_review' || key === 'second_round_review') {
    const baseRoundNo = deriveProposalRoundNo(roundSource, key)
    const shouldAdvanceRound = key === 'second_round_review' && Boolean(options && options.nextRoundForSecondRoundReview)
    const roundNo = shouldAdvanceRound ? Math.max(baseRoundNo + 1, 2) : baseRoundNo
    return `พิจารณารอบ ${roundNo}`
  }
  return labelMap[key] || key || '-'
}

export function getCommitteeDashboardStatusLabel(status, roundSource = null, options = {}) {
  const key = normalizeProposalStatus(status)
  const template = COMMITTEE_DASHBOARD_LABELS[key]
  if (key === 'under_review' || key === 'second_round_review') {
    const baseRoundNo = deriveProposalRoundNo(roundSource, key)
    const roundNo = key === 'second_round_review' && options && options.nextRoundForSecondRoundReview
      ? Math.max(baseRoundNo + 1, 2)
      : baseRoundNo
    return String(template || 'พิจารณารอบ {roundNo}').replace('{roundNo}', roundNo)
  }
  return template || getProposalStatusLabel(key, PROPOSAL_STATUS_LABELS_TH_ADMIN, roundSource, options)
}
