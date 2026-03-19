// Proposal Permission Constants

module.exports = {
  // Proposal Management
  PROPOSAL_CREATE: 'proposal.create',
  PROPOSAL_READ_OWN: 'proposal.read.own',
  PROPOSAL_READ_ALL: 'proposal.read.all',
  PROPOSAL_UPDATE_OWN_DRAFT: 'proposal.update.own_draft',
  PROPOSAL_SUBMIT: 'proposal.submit',
  
  // Faculty Review
  PROPOSAL_FACULTY_APPROVE: 'proposal.faculty_approve',
  PROPOSAL_FACULTY_FEEDBACK: 'proposal.faculty_feedback',
  
  // Office Operations
  PROPOSAL_OFFICE_RECEIVE: 'proposal.office_receive',
  PROPOSAL_DOCUMENT_CHECK: 'proposal.document_check',
  PROPOSAL_ASSIGN_COMMITTEE: 'proposal.assign_committee',
  
  // Committee Review
  PROPOSAL_REVIEW_SCORE: 'proposal.review.score',
  PROPOSAL_REVIEW_COMMENT: 'proposal.review.comment',
  
  // Workflow Decisions
  PROPOSAL_REQUEST_REVISION: 'proposal.request_revision',
  PROPOSAL_RESUBMIT: 'proposal.resubmit',
  PROPOSAL_APPROVE_FINAL: 'proposal.approve_final',
  PROPOSAL_REJECT_FINAL: 'proposal.reject_final',
  PROPOSAL_ANNOUNCE: 'proposal.announce',
  
  // Admin & Reporting
  DASHBOARD_VIEW: 'dashboard.view',
  USER_MANAGE: 'user.manage',
  ROLE_MANAGE: 'role.manage',
  REPORT_VIEW: 'report.view',
  AUDIT_VIEW: 'audit.view'
};
