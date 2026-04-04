export const PROPOSAL_STATUSES = Object.freeze([
  'draft',
  'pending_confirm',
  'submitted',
  'faculty_review_pending',
  'faculty_approved',
  'office_received',
  'document_checking',
  'assigned_to_committee',
  'under_review',
  'meeting_completed',
  'revision_requested',
  'resubmitted',
  'second_round_review',
  'approved',
  'rejected',
  'announced'
])

export const PROPOSAL_STATUS_KEYS = PROPOSAL_STATUSES

export const PROPOSAL_STATUS_KEYS_REPORT = Object.freeze(
  PROPOSAL_STATUSES.filter(status => status !== 'pending_confirm')
)

export const IN_PROGRESS_STATUSES = Object.freeze([
  'pending_confirm',
  'submitted',
  'faculty_review_pending',
  'faculty_approved',
  'office_received',
  'document_checking',
  'assigned_to_committee',
  'under_review',
  'meeting_completed',
  'resubmitted',
  'second_round_review'
])

export const FILTER_IN_PROGRESS_STATUSES = Object.freeze([
  'submitted',
  'faculty_review_pending',
  'faculty_approved',
  'office_received',
  'document_checking',
  'assigned_to_committee',
  'under_review',
  'meeting_completed',
  'revision_requested',
  'resubmitted',
  'second_round_review'
])

export const APPROVED_PROPOSAL_STATUSES = Object.freeze(['approved', 'announced'])

export const READ_ONLY_PROPOSAL_STATUSES = Object.freeze([
  'pending_confirm',
  'submitted',
  'faculty_review_pending',
  'faculty_approved',
  'office_received',
  'document_checking',
  'assigned_to_committee',
  'under_review',
  'meeting_completed',
  'approved',
  'rejected',
  'announced'
])

export const PROPOSAL_ALLOWED_TRANSITIONS = Object.freeze({
  draft: ['pending_confirm'],
  pending_confirm: ['submitted'],
  submitted: ['faculty_review_pending'],
  faculty_review_pending: ['faculty_approved'],
  faculty_approved: ['office_received'],
  office_received: ['document_checking'],
  document_checking: ['assigned_to_committee'],
  assigned_to_committee: ['under_review'],
  under_review: ['meeting_completed'],
  meeting_completed: ['approved', 'rejected', 'revision_requested'],
  revision_requested: ['resubmitted'],
  resubmitted: ['second_round_review'],
  second_round_review: ['meeting_completed'],
  approved: ['announced'],
  rejected: ['announced']
})

export const STATUS_STEP_MAP = Object.freeze({
  draft: 1,
  pending_confirm: 2,
  submitted: 2,
  faculty_review_pending: 3,
  faculty_approved: 4,
  office_received: 5,
  document_checking: 6,
  assigned_to_committee: 7,
  under_review: 8,
  meeting_completed: 9,
  revision_requested: 5,
  resubmitted: 6,
  second_round_review: 8,
  approved: 10,
  rejected: 10,
  announced: 10
})

export const PROPOSAL_STATUS_LABELS_TH_ADMIN = Object.freeze({
  draft: 'แบบร่าง',
  pending_confirm: 'รอการยืนยัน',
  submitted: 'ยื่นแล้ว',
  faculty_review_pending: 'รอประธานพิจารณา',
  faculty_approved: 'ประธานอนุมัติ',
  office_received: 'ส่วนบริหารรับแล้ว',
  document_checking: 'ตรวจสอบเอกสาร',
  assigned_to_committee: 'มอบหมายกรรมการแล้ว',
  under_review: 'พิจารณารอบ 1',
  meeting_completed: 'กรรมการได้ให้ความเห็นแล้ว',
  revision_requested: 'ขอแก้ไข',
  resubmitted: 'ส่งแก้ไขแล้ว',
  second_round_review: 'พิจารณารอบ 2',
  approved: 'อนุมัติ',
  rejected: 'ปฏิเสธ',
  announced: 'ประกาศผล'
})

export const PROPOSAL_STATUS_LABELS_TH_RESEARCHER = Object.freeze({
  draft: 'แบบร่าง',
  pending_confirm: 'รอยืนยันผู้ร่วมโครงการ',
  submitted: 'ยื่นแล้ว',
  faculty_review_pending: 'รอประธานพิจารณา',
  faculty_approved: 'ประธานอนุมัติ',
  office_received: 'ส่วนบริหารรับแล้ว',
  document_checking: 'ตรวจสอบเอกสาร',
  assigned_to_committee: 'มอบหมายกรรมการแล้ว',
  under_review: 'พิจารณารอบ 1',
  meeting_completed: 'กรรมการได้ให้ความเห็นแล้ว',
  revision_requested: 'ขอแก้ไข',
  resubmitted: 'ส่งแก้ไขแล้ว',
  second_round_review: 'พิจารณารอบ 2',
  approved: 'อนุมัติ',
  rejected: 'ปฏิเสธ',
  announced: 'ประกาศผล'
})

export const PROPOSAL_STATUS_LABELS_TH_BADGE = Object.freeze({
  draft: 'ร่าง',
  pending_confirm: 'รอการยืนยัน',
  submitted: 'ยื่นแล้ว',
  faculty_review_pending: 'รอคณะพิจารณา (คณะ)',
  faculty_approved: 'ผ่านการพิจารณา (คณะ)',
  office_received: 'สำนักงานรับเรื่องแล้ว',
  document_checking: 'ตรวจเอกสาร',
  assigned_to_committee: 'มอบหมายกรรมการแล้ว',
  under_review: 'พิจารณารอบ 1',
  meeting_completed: 'กรรมการได้ให้ความเห็นแล้ว',
  revision_requested: 'ขอแก้ไข',
  resubmitted: 'ส่งแก้ไขแล้ว',
  second_round_review: 'พิจารณารอบ 2',
  approved: 'อนุมัติ',
  rejected: 'ไม่อนุมัติ',
  announced: 'ประกาศผล'
})

export const PROPOSAL_STATUS_COLORS_HEX = Object.freeze({
  draft: '#9CA3AF',
  pending_confirm: '#60A5FA',
  submitted: '#3B82F6',
  faculty_review_pending: '#3B82F6',
  faculty_approved: '#34D399',
  office_received: '#38BDF8',
  document_checking: '#FACC15',
  assigned_to_committee: '#A78BFA',
  under_review: '#6366F1',
  meeting_completed: '#10B981',
  revision_requested: '#FB923C',
  resubmitted: '#22D3EE',
  second_round_review: '#8B5CF6',
  approved: '#059669',
  rejected: '#EF4444',
  announced: '#14B8A6'
})

// Backward compatibility for existing imports.
export const STATUS_COLORS = PROPOSAL_STATUS_COLORS_HEX

export const PROPOSAL_STATUS_COLORS_HEX_REPORT = Object.freeze({
  draft: '#6c757d',
  submitted: '#17a2b8',
  faculty_review_pending: '#ffc107',
  faculty_approved: '#007bff',
  office_received: '#17a2b8',
  document_checking: '#fd7e14',
  assigned_to_committee: '#007bff',
  under_review: '#e83e8c',
  meeting_completed: '#6f42c1',
  revision_requested: '#dc3545',
  resubmitted: '#20c997',
  second_round_review: '#fd7e14',
  approved: '#28a745',
  rejected: '#dc3545',
  announced: '#007bff'
})

export const PROPOSAL_STATUS_COLORS_COREUI_ADMIN = Object.freeze({
  draft: 'secondary',
  pending_confirm: 'secondary',
  submitted: 'info',
  faculty_review_pending: 'warning',
  faculty_approved: 'primary',
  office_received: 'primary',
  document_checking: 'warning',
  assigned_to_committee: 'info',
  under_review: 'danger',
  meeting_completed: 'primary',
  revision_requested: 'danger',
  resubmitted: 'info',
  second_round_review: 'warning',
  approved: 'success',
  rejected: 'danger',
  announced: 'primary'
})

export const PROPOSAL_STATUS_COLORS_COREUI_BADGE = Object.freeze({
  draft: 'secondary',
  pending_confirm: 'secondary',
  submitted: 'info',
  faculty_review_pending: 'warning',
  faculty_approved: 'primary',
  office_received: 'primary',
  document_checking: 'warning',
  assigned_to_committee: 'info',
  under_review: 'warning',
  meeting_completed: 'primary',
  revision_requested: 'danger',
  resubmitted: 'info',
  second_round_review: 'warning',
  approved: 'success',
  rejected: 'danger',
  announced: 'success'
})

export const PROPOSAL_STATUS_COLORS_COREUI_RESEARCH_FORM = Object.freeze({
  draft: 'secondary',
  pending_confirm: 'warning',
  submitted: 'info',
  faculty_review_pending: 'warning',
  faculty_approved: 'primary',
  office_received: 'primary',
  document_checking: 'warning',
  assigned_to_committee: 'info',
  under_review: 'danger',
  meeting_completed: 'primary',
  revision_requested: 'danger',
  resubmitted: 'info',
  second_round_review: 'warning',
  approved: 'success',
  rejected: 'danger',
  announced: 'primary'
})

export const PROPOSAL_STATUS_ALIASES = Object.freeze({
  admin_review: 'document_checking',
  committee_review: 'under_review',
  revision_required: 'revision_requested'
})

export function normalizeProposalStatus(status) {
  return String(status || '').trim().toLowerCase()
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
