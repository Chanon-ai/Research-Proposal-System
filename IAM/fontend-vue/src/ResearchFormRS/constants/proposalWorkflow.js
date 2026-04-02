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

export const STATUS_COLORS = Object.freeze({
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

export function normalizeProposalStatus(status) {
  return String(status || '').trim().toLowerCase()
}

export function isProposalReadOnlyStatus(status) {
  return READ_ONLY_PROPOSAL_STATUSES.includes(normalizeProposalStatus(status))
}
