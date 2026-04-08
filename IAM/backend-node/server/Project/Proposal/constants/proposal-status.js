// Proposal Status Constants

const STATUS = {
  DRAFT: 'draft',
  PENDING_CONFIRM: 'pending_confirm',
  SUBMITTED: 'submitted',
  FACULTY_REVIEW_PENDING: 'faculty_review_pending',
  FACULTY_APPROVED: 'faculty_approved',
  FACULTY_REJECTED: 'faculty_rejected',
  OFFICE_RECEIVED: 'office_received',
  MEETING_IN_PROGRESS: 'meeting_in_progress',
  DOCUMENT_CHECKING: 'document_checking',
  ASSIGNED_TO_COMMITTEE: 'assigned_to_committee',
  UNDER_REVIEW: 'under_review',
  COMMITTEE_VALUATED: 'committee_valuated',
  MEETING_COMPLETED: 'meeting_completed',
  LEGACY_MEETING_COMPLETED: 'meeting_completed',
  REVISION_REQUESTED: 'revision_requested',
  RESUBMITTED: 'resubmitted',
  SECOND_ROUND_REVIEW: 'second_round_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ANNOUNCED: 'announced'
};

const LEGACY_STATUS_ALIASES = Object.freeze({});

function normalizeStatus(status) {
  const key = String(status || '').trim().toLowerCase();
  return LEGACY_STATUS_ALIASES[key] || key;
}

module.exports = {
  ...STATUS,
  LEGACY_STATUS_ALIASES,
  WORKFLOW_STATUS_VALUES: Object.freeze([
    ...new Set(Object.values(STATUS).filter((value) => typeof value === 'string'))
  ]),
  normalizeStatus
};
