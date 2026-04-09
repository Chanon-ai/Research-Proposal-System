// proposal.service.js
// Business logic for proposal workflow
// Uses existing Mongoose models and constants

const mongoose = require('mongoose');
const Proposal = require('../models/Proposal');
const ProposalStatusLog = require('../models/ProposalStatusLog');
const ProposalReview = require('../models/ProposalReview');
const Notification = require('../models/Notification');
const User = require('../../Auth/models/User');
const systemSettingService = require('../../settings/service/system-setting');
const STATUS = require('../constants/proposal-status');
const { dispatchProposalWorkflowNotification } = require('./workflow-notification.service');
const collaborationConfirmationService = require('./collaboration-confirmation.service');

// allowed status transitions map
const ALLOWED_TRANSITIONS = {
  [STATUS.DRAFT]: [STATUS.PENDING_CONFIRM],
  [STATUS.PENDING_CONFIRM]: [STATUS.SUBMITTED],
  [STATUS.SUBMITTED]: [STATUS.FACULTY_REVIEW_PENDING],
  [STATUS.FACULTY_REVIEW_PENDING]: [STATUS.FACULTY_APPROVED, STATUS.REVISION_REQUESTED, STATUS.REJECTED],
  [STATUS.FACULTY_APPROVED]: [STATUS.OFFICE_RECEIVED],
  [STATUS.FACULTY_REJECTED]: [STATUS.REJECTED],
  [STATUS.OFFICE_RECEIVED]: [STATUS.FINANCE_BUDGET_CHECKING, STATUS.DOCUMENT_CHECKING],
  [STATUS.FINANCE_BUDGET_CHECKING]: [STATUS.DOCUMENT_CHECKING, STATUS.REVISION_REQUESTED],
  [STATUS.DOCUMENT_CHECKING]: [STATUS.ASSIGNED_TO_COMMITTEE],
  [STATUS.ASSIGNED_TO_COMMITTEE]: [STATUS.UNDER_REVIEW],
  [STATUS.UNDER_REVIEW]: [STATUS.COMMITTEE_VALUATED],
  [STATUS.COMMITTEE_VALUATED]: [STATUS.MEETING_COMPLETED],
  [STATUS.MEETING_COMPLETED]: [STATUS.ANNOUNCED],
  [STATUS.REVISION_REQUESTED]: [STATUS.RESUBMITTED],
  [STATUS.RESUBMITTED]: [STATUS.SECOND_ROUND_REVIEW],
  [STATUS.SECOND_ROUND_REVIEW]: [STATUS.COMMITTEE_VALUATED],
  [STATUS.APPROVED]: [STATUS.ANNOUNCED],
  [STATUS.REJECTED]: [STATUS.ANNOUNCED]
};

const ADMIN_BLOCKED_MANUAL_STATUSES = new Set([STATUS.APPROVED, STATUS.REJECTED]);

const FUNDING_BUDGET_LIMITS = Object.freeze({
  'new-researcher': 100000,
  'researcher-development': 200000,
  'strategic-research': 300000,
  'industry-extension': 300000
});

const FUNDING_LABELS = Object.freeze({
  'new-researcher': 'ทุนนักวิจัยรุ่นใหม่',
  'researcher-development': 'ทุนพัฒนานักวิจัย',
  'strategic-research': 'ทุนวิจัยที่สอดคล้องกับยุทธศาสตร์',
  'industry-extension': 'ทุนต่อยอดสู่ภาคอุตสาหกรรม'
});

const REVIEWER_ROLE_SET = new Set(['committee', 'chairman']);

const REVIEW_STATUS = Object.freeze({
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  CERTIFIED: 'certified'
});

const CHAIRMAN_REVIEW_STATUS = Object.freeze({
  IDLE: 'idle',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVISION_REQUESTED: 'revision_requested'
});

const FINANCE_REVIEW_STATUS = Object.freeze({
  IDLE: 'idle',
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  REVISION_REQUESTED: 'revision_requested'
});

const CHAIRMAN_CHECKLIST_FIELD_KEY = 'checklist_payload';
const CHAIRMAN_CHECKLIST_SECTION_KEY = 'chairman_checklist';

function isReviewerRole(role) {
  return REVIEWER_ROLE_SET.has(String(role || '').trim().toLowerCase());
}

function isChairmanRole(role) {
  return String(role || '').trim().toLowerCase() === 'chairman';
}

function normalizeReviewStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  return Object.values(REVIEW_STATUS).includes(normalized) ? normalized : '';
}

function isReviewAccepted(status) {
  return normalizeReviewStatus(status) === REVIEW_STATUS.CERTIFIED;
}

function isReviewAwaitingAdminDecision(status) {
  return normalizeReviewStatus(status) === REVIEW_STATUS.SUBMITTED;
}

function isReviewLockedStatus(status) {
  const normalized = normalizeReviewStatus(status);
  return normalized === REVIEW_STATUS.SUBMITTED || normalized === REVIEW_STATUS.CERTIFIED;
}

function asString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateReviewSignatureData(signatureData, { required = false } = {}) {
  const raw = asString(signatureData);
  if (!raw) {
    if (required) throw new Error('Signature is required');
    return '';
  }
  if (!raw.startsWith('data:image/')) throw new Error('Signature format is invalid');
  if (raw.length > 8 * 1024 * 1024) throw new Error('Signature payload is too large');
  return raw;
}

function getAssignedChairmanIdsFromProposal(proposal = {}) {
  const assignment = proposal && proposal.chairmanAssignment && typeof proposal.chairmanAssignment === 'object'
    ? proposal.chairmanAssignment
    : (proposal && typeof proposal === 'object' ? proposal : {});
  return dedupeCommitteeIds(Array.isArray(assignment.assignedChairmanIds) ? assignment.assignedChairmanIds : []);
}

function hasChairmanProposalAccess(proposal = {}, userId = null) {
  const normalizedUserId = userId ? String(userId) : '';
  if (!normalizedUserId) return false;

  const assignedChairmanIds = getAssignedChairmanIdsFromProposal(proposal).map(String);
  if (assignedChairmanIds.includes(normalizedUserId)) return true;

  const reviewedBy = proposal && proposal.chairmanAssignment && proposal.chairmanAssignment.reviewedBy
    ? String(proposal.chairmanAssignment.reviewedBy)
    : '';
  return reviewedBy === normalizedUserId;
}

function getAssignedFinanceOfficerIdsFromProposal(proposal = {}) {
  const assignment = proposal && proposal.financeAssignment && typeof proposal.financeAssignment === 'object'
    ? proposal.financeAssignment
    : (proposal && typeof proposal === 'object' ? proposal : {});
  return dedupeCommitteeIds(Array.isArray(assignment.assignedFinanceOfficerIds) ? assignment.assignedFinanceOfficerIds : []);
}

function hasFinanceProposalAccess(proposal = {}, userId = null) {
  const normalizedUserId = userId ? String(userId) : '';
  if (!normalizedUserId) return false;

  const assignedIds = getAssignedFinanceOfficerIdsFromProposal(proposal).map(String);
  if (assignedIds.includes(normalizedUserId)) return true;

  const submittedBy = proposal && proposal.financeAssignment && proposal.financeAssignment.submittedBy
    ? String(proposal.financeAssignment.submittedBy)
    : '';
  return submittedBy === normalizedUserId;
}

function buildChairmanAssignmentUpdate({
  assignedChairmanIds = [],
  status = CHAIRMAN_REVIEW_STATUS.IDLE,
  assignedAt = null,
  assignedBy = null,
  reviewedAt = null,
  reviewedBy = null,
  summaryComment = ''
} = {}) {
  return {
    chairmanAssignment: {
      assignedChairmanIds,
      status,
      assignedAt,
      assignedBy,
      reviewedAt,
      reviewedBy,
      summaryComment: String(summaryComment || '')
    }
  };
}

function buildFinanceAssignmentUpdate({
  assignedFinanceOfficerIds = [],
  status = FINANCE_REVIEW_STATUS.IDLE,
  assignedAt = null,
  assignedBy = null,
  submittedAt = null,
  submittedBy = null,
  summaryComment = ''
} = {}) {
  return {
    financeAssignment: {
      assignedFinanceOfficerIds,
      status,
      assignedAt,
      assignedBy,
      submittedAt,
      submittedBy,
      summaryComment: String(summaryComment || '')
    }
  };
}

function parseBudgetNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const normalized = String(value).replace(/,/g, '').replace(/[^\d.-]/g, '').trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function computeBudgetFromCategories(categories = []) {
  if (!Array.isArray(categories)) return 0;
  return categories.reduce((sum, category) => {
    const items = Array.isArray(category && category.items) ? category.items : [];
    const itemTotal = items.reduce((itemSum, item) => itemSum + parseBudgetNumber(item && item.total), 0);
    return sum + itemTotal;
  }, 0);
}

function readSnapshotBudgetTotal(snapshot = {}) {
  const budget = snapshot && typeof snapshot === 'object' && snapshot.budget && typeof snapshot.budget === 'object'
    ? snapshot.budget
    : null;
  if (!budget) return null;
  if (Object.prototype.hasOwnProperty.call(budget, 'grandTotal')) {
    return parseBudgetNumber(budget.grandTotal);
  }
  return computeBudgetFromCategories(Array.isArray(budget.categories) ? budget.categories : []);
}

function resolveFundingType(payload = {}, fallback = {}) {
  const payloadFundingType = String(payload && payload.fundingType ? payload.fundingType : '').trim();
  if (payloadFundingType) return payloadFundingType;

  const payloadSnapshot = payload && payload.formSnapshotJson && typeof payload.formSnapshotJson === 'object'
    ? payload.formSnapshotJson
    : {};
  const payloadSnapshotFundingType = String(payloadSnapshot && payloadSnapshot.fundingType ? payloadSnapshot.fundingType : '').trim();
  if (payloadSnapshotFundingType) return payloadSnapshotFundingType;

  const fallbackFundingType = String(fallback && fallback.fundingType ? fallback.fundingType : '').trim();
  if (fallbackFundingType) return fallbackFundingType;

  const fallbackSnapshot = fallback && fallback.formSnapshotJson && typeof fallback.formSnapshotJson === 'object'
    ? fallback.formSnapshotJson
    : {};
  return String(fallbackSnapshot && fallbackSnapshot.fundingType ? fallbackSnapshot.fundingType : '').trim();
}

function resolveBudgetTotal(payload = {}, fallback = {}) {
  const payloadSnapshot = payload && payload.formSnapshotJson && typeof payload.formSnapshotJson === 'object'
    ? payload.formSnapshotJson
    : null;
  const payloadSnapshotBudgetTotal = payloadSnapshot ? readSnapshotBudgetTotal(payloadSnapshot) : null;

  if (payload && Object.prototype.hasOwnProperty.call(payload, 'budgetTotal')) {
    const payloadBudgetTotal = parseBudgetNumber(payload.budgetTotal);
    if (payloadBudgetTotal > 0) return payloadBudgetTotal;
    if (payloadSnapshotBudgetTotal !== null) return payloadSnapshotBudgetTotal;
    return payloadBudgetTotal;
  }

  if (payloadSnapshotBudgetTotal !== null) return payloadSnapshotBudgetTotal;

  const fallbackSnapshot = fallback && fallback.formSnapshotJson && typeof fallback.formSnapshotJson === 'object'
    ? fallback.formSnapshotJson
    : null;
  const fallbackSnapshotBudgetTotal = fallbackSnapshot ? readSnapshotBudgetTotal(fallbackSnapshot) : null;

  if (fallback && Object.prototype.hasOwnProperty.call(fallback, 'budgetTotal')) {
    const fallbackBudgetTotal = parseBudgetNumber(fallback.budgetTotal);
    if (fallbackBudgetTotal > 0) return fallbackBudgetTotal;
    if (fallbackSnapshotBudgetTotal !== null) return fallbackSnapshotBudgetTotal;
    return fallbackBudgetTotal;
  }

  if (fallbackSnapshotBudgetTotal !== null) return fallbackSnapshotBudgetTotal;

  return 0;
}

function formatBudgetForMessage(value) {
  return parseBudgetNumber(value).toLocaleString('th-TH');
}

function assertFundingBudgetLimit(payload = {}, fallback = {}) {
  const fundingType = resolveFundingType(payload, fallback);
  const budgetLimit = FUNDING_BUDGET_LIMITS[fundingType];
  if (!Number.isFinite(budgetLimit) || budgetLimit <= 0) return;

  const grandTotal = resolveBudgetTotal(payload, fallback);
  if (grandTotal <= budgetLimit) return;

  const fundingLabel = FUNDING_LABELS[fundingType] || fundingType;
  const err = new Error(
    `งบประมาณรวมเกินเพดานของ${fundingLabel} (เพดาน ${formatBudgetForMessage(budgetLimit)} บาท, กรอก ${formatBudgetForMessage(grandTotal)} บาท)`
  );
  err.statusCode = 400;
  err.code = 'BUDGET_LIMIT_EXCEEDED';
  err.meta = {
    fundingType,
    fundingLabel,
    budgetLimit,
    grandTotal
  };
  throw err;
}

// helper to log status change
async function createStatusLog({ proposalId, fromStatus, toStatus, actionKey, remark, roundNo, changedBy }) {
  const log = new ProposalStatusLog({ proposalId, fromStatus, toStatus, actionKey, remark, roundNo, changedBy });
  await log.save();
  return log;
}

// helper to create notification
async function createNotification({ userId, proposalId, channel, eventKey, title, message, payload }) {
  try {
    const notif = new Notification({ userId, proposalId, channel, eventKey, title, message, payload });
    await notif.save();
    return notif;
  } catch (err) {
    throw new Error(`Failed to create notification record: ${err && err.message ? err.message : err}`);
  }
}

async function getLatestRevisionRequestLog(proposalId) {
  if (!proposalId) return null;
  return ProposalStatusLog.findOne({
    proposalId,
    toStatus: STATUS.REVISION_REQUESTED
  })
    .sort({ createdAt: -1, updatedAt: -1 })
    .select('fromStatus toStatus actionKey remark createdAt updatedAt');
}

async function resolveRevisionResubmissionTarget(proposalId) {
  const latestRevisionLog = await getLatestRevisionRequestLog(proposalId);
  const fromStatus = STATUS.normalizeStatus(latestRevisionLog && latestRevisionLog.fromStatus);

  if (fromStatus === STATUS.FACULTY_REVIEW_PENDING) {
    return STATUS.FACULTY_REVIEW_PENDING;
  }

  if (fromStatus === STATUS.FINANCE_BUDGET_CHECKING) {
    return STATUS.FINANCE_BUDGET_CHECKING;
  }

  return STATUS.RESUBMITTED;
}

async function getActiveAdminIds() {
  const rows = await User.find({
    role: 'admin',
    isActive: true,
    isDeleted: { $ne: true }
  })
    .select('_id')
    .lean();

  return Array.from(new Set((rows || []).map((row) => String(row && row._id ? row._id : '')).filter(Boolean)));
}

async function notifyUsersWithWorkflowEmail({ recipientIds = [], proposalId = null, eventKey, title, message, payload = {}, proposal = null, context = {}, proposalStatusLogId = null }) {
  const uniqueRecipientIds = Array.from(new Set((Array.isArray(recipientIds) ? recipientIds : []).map((id) => String(id || '').trim()).filter(Boolean)));
  if (uniqueRecipientIds.length === 0) return;

  const emailResult = await dispatchProposalWorkflowNotification({
    eventKey,
    recipientIds: uniqueRecipientIds,
    proposal,
    context,
    inApp: {
      title,
      message,
      payload
    },
    proposalStatusLogId
  });

  if (emailResult && emailResult.email && (emailResult.email.failed > 0 || emailResult.email.skippedReason)) {
    console.warn('[Proposal.notifyUsersWithWorkflowEmail] Workflow email delivery issue:', {
      proposalId: proposal && proposal._id ? String(proposal._id) : String(proposalId || ''),
      eventKey,
      skippedReason: emailResult.email.skippedReason || '',
      failed: emailResult.email.failed || 0,
      failures: emailResult.email.failures || []
    });
  }
}

async function notifyAdminsOfProposalSubmission(proposal, { eventKey, title, message, remarks = '', proposalStatusLogId = null } = {}) {
  const adminIds = await getActiveAdminIds();
  if (adminIds.length === 0) return;

  await notifyUsersWithWorkflowEmail({
    recipientIds: adminIds,
    proposalId: proposal && proposal._id ? proposal._id : null,
    eventKey,
    title,
    message,
    payload: {
      proposalStatus: proposal && proposal.currentStatus ? String(proposal.currentStatus) : '',
      source: 'proposal_workflow'
    },
    proposal,
    context: {
      remarks
    },
    proposalStatusLogId
  });
}

function getProposalStakeholderIds(proposal = {}, { includeApplicant = true, includeCommittee = true, extraRecipientIds = [] } = {}) {
  const recipientIds = new Set();

  if (includeApplicant && proposal && proposal.applicantUserId) {
    recipientIds.add(String(proposal.applicantUserId));
  }

  if (includeCommittee && Array.isArray(proposal && proposal.committeeIds)) {
    proposal.committeeIds.forEach((committeeId) => {
      const normalizedId = String(committeeId || '').trim();
      if (normalizedId) recipientIds.add(normalizedId);
    });
  }

  getAssignedChairmanIdsFromProposal(proposal).forEach((chairmanId) => {
    const normalizedId = String(chairmanId || '').trim();
    if (normalizedId) recipientIds.add(normalizedId);
  });

  getAssignedFinanceOfficerIdsFromProposal(proposal).forEach((financeOfficerId) => {
    const normalizedId = String(financeOfficerId || '').trim();
    if (normalizedId) recipientIds.add(normalizedId);
  });

  (Array.isArray(extraRecipientIds) ? extraRecipientIds : []).forEach((recipientId) => {
    const normalizedId = String(recipientId || '').trim();
    if (normalizedId) recipientIds.add(normalizedId);
  });

  return Array.from(recipientIds);
}

async function notifyProposalStakeholders(proposal, { eventKey, title, message, payload = {}, remarks = '', includeApplicant = true, includeCommittee = true, extraRecipientIds = [], proposalStatusLogId = null } = {}) {
  const recipientIds = getProposalStakeholderIds(proposal, { includeApplicant, includeCommittee, extraRecipientIds });
  if (recipientIds.length === 0) return;

  await notifyUsersWithWorkflowEmail({
    recipientIds,
    proposalId: proposal && proposal._id ? proposal._id : null,
    eventKey,
    title,
    message,
    payload,
    proposal,
    context: {
      remarks
    },
    proposalStatusLogId
  });
}

function normalizeDraftCoreFields(target, fallback = {}) {
  const doc = target || {};
  const base = fallback || {};
  const snapshot = doc.formSnapshotJson && typeof doc.formSnapshotJson === 'object'
    ? doc.formSnapshotJson
    : {};
  const fallbackSnapshot = base.formSnapshotJson && typeof base.formSnapshotJson === 'object'
    ? base.formSnapshotJson
    : {};

  if (!doc.fiscalYear) {
    doc.fiscalYear = base.fiscalYear || new Date().getFullYear();
  }

  const resolvedProjectTitleTh = String(
    doc.projectTitleTh ||
    doc.projectNameThai ||
    snapshot.projectNameThai ||
    base.projectTitleTh ||
    base.projectNameThai ||
    fallbackSnapshot.projectNameThai ||
    doc.projectTitleEn ||
    doc.projectNameEnglish ||
    snapshot.projectNameEnglish ||
    base.projectTitleEn ||
    base.projectNameEnglish ||
    fallbackSnapshot.projectNameEnglish ||
    'ร่างโครงการวิจัย'
  ).trim();

  doc.projectTitleTh = resolvedProjectTitleTh || 'ร่างโครงการวิจัย';
  return doc;
}

function getCollaborationParticipantSummary(snapshot = {}) {
  const team = snapshot && typeof snapshot.researchTeam === 'object' && snapshot.researchTeam
    ? snapshot.researchTeam
    : {};

  const coResearchers = Array.isArray(team.coResearchers) ? team.coResearchers : [];
  const advisors = Array.isArray(team.advisors) ? team.advisors : [];

  const coResearcherCount = coResearchers.length;
  const advisorCount = advisors.length;

  return {
    coResearcherCount,
    advisorCount,
    total: coResearcherCount + advisorCount
  };
}

function sanitizeSnapshotFileEntry(file = {}) {
  if (!file || typeof file !== 'object') return null;
  const fileId = normalizeFileId(file.fileId || file.id || file._id || '');
  const name = file.name || file.originalName || file.fileName || '';
  const originalName = file.originalName || name || '';
  const mimeType = file.mimeType || file.contentType || '';
  const size = Number(file.size || file.fileSize || 0);
  return {
    fileId: fileId ? String(fileId) : '',
    name,
    originalName,
    mimeType,
    size: Number.isFinite(size) && size > 0 ? size : 0,
    uploadedAt: file.uploadedAt || file.uploadDate || null,
    datetime: file.datetime || '',
    type: file.type || file.docType || '',
    note: file.note || ''
  };
}

function normalizeFileId(value) {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (value && typeof value.toHexString === 'function') return String(value.toHexString()).trim();
  if (value && typeof value === 'object') {
    if (value.$oid) return String(value.$oid).trim();
    if (value._id) return normalizeFileId(value._id);
    if (value.id) return normalizeFileId(value.id);
    if (value.fileId) return normalizeFileId(value.fileId);
  }
  try {
    return String(value).trim();
  } catch (_) {
    return '';
  }
}

function sanitizeSnapshotFiles(snapshot = {}) {
  if (!snapshot || typeof snapshot !== 'object') return snapshot;
  if (!Array.isArray(snapshot.files)) return snapshot;
  return {
    ...snapshot,
    files: snapshot.files
      .map((entry) => sanitizeSnapshotFileEntry(entry))
      .filter((entry) => entry && (entry.fileId || entry.name))
  };
}

function applyDraftPayload(target, payload = {}, fallback = {}) {
  const doc = target || {};
  const incoming = payload || {};
  const base = fallback || {};

  Object.keys(incoming).forEach((key) => {
    if (key === 'formSnapshotJson') return;
    const value = incoming[key];
    if (value !== undefined) {
      doc[key] = value;
    }
  });

  if (Object.prototype.hasOwnProperty.call(incoming, 'formSnapshotJson')) {
    doc.formSnapshotJson = {
      ...((base && base.formSnapshotJson) || {}),
      ...((incoming && incoming.formSnapshotJson) || {})
    };
    doc.formSnapshotJson = sanitizeSnapshotFiles(doc.formSnapshotJson);
    if (typeof doc.markModified === 'function') {
      doc.markModified('formSnapshotJson');
    }
  }

  if (Object.prototype.hasOwnProperty.call(incoming, 'keywordList') && typeof doc.markModified === 'function') {
    doc.markModified('keywordList');
  }

  normalizeDraftCoreFields(doc, base);
  return doc;
}

function normalizeRoundNo(value, fallback = 1) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
}

function normalizeFeedbackDecision(decision) {
  const normalized = String(decision || '').trim().toLowerCase();
  if (!normalized) return null;
  if (['revision', 'request_revision', 'revision_requested'].includes(normalized)) return 'revision';
  return normalized;
}

function isChairmanReviewRecord(review = {}) {
  const role = String(review && review.reviewerUserId && review.reviewerUserId.role ? review.reviewerUserId.role : '').trim().toLowerCase();
  return role === 'chairman';
}

function parseChairmanChecklistPayload(commentItems = []) {
  const items = Array.isArray(commentItems) ? commentItems : [];
  const payloadItem = items.find((item) => item && item.fieldKey === CHAIRMAN_CHECKLIST_FIELD_KEY && item.commentText)
    || items.find((item) => item && item.sectionKey === CHAIRMAN_CHECKLIST_SECTION_KEY && item.commentText)
    || items.find((item) => item && typeof item.commentText === 'string' && item.commentText.trim().startsWith('{'));

  if (!payloadItem || !payloadItem.commentText) return null;

  const parseJson = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') return value;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    try {
      const first = JSON.parse(trimmed);
      if (typeof first === 'string') {
        const nested = first.trim();
        if (nested && (nested.startsWith('{') || nested.startsWith('['))) {
          try {
            return JSON.parse(nested);
          } catch (_) {
            return null;
          }
        }
      }
      return first;
    } catch (_) {
      return null;
    }
  };

  const parsed = parseJson(payloadItem.commentText);
  if (!parsed || typeof parsed !== 'object') return null;
  if (parsed.payload && typeof parsed.payload === 'object') return parsed.payload;
  if (parsed.data && typeof parsed.data === 'object') return parsed.data;
  return parsed;
}

function normalizeChairmanChecklistAnswer(value, fallbackChecked = null) {
  if (value === true || fallbackChecked === true) return 'yes';
  if (value === false || fallbackChecked === false) return 'no';

  const normalized = String(value === undefined || value === null ? '' : value).trim().toLowerCase();
  if (!normalized) return '';

  if (['yes', 'y', 'true', '1', 'pass', 'ผ่าน', 'มี'].includes(normalized)) return 'yes';
  if (['no', 'n', 'false', '0', 'fail', 'ไม่ผ่าน', 'ไม่มี'].includes(normalized)) return 'no';
  return '';
}

function buildChairmanFeedbackItems(review = {}) {
  const parsed = parseChairmanChecklistPayload(review.commentItems);
  const sections = Array.isArray(parsed && parsed.sections) ? parsed.sections : [];
  const feedbackItems = [];

  sections.forEach((section, sectionIndex) => {
    const rawSectionKey = String(section && section.sectionKey ? section.sectionKey : `section_${sectionIndex + 1}`).trim();
    const sectionKey = rawSectionKey || `section_${sectionIndex + 1}`;
    const sectionLabel = String(section && section.sectionLabel ? section.sectionLabel : 'ข้อเสนอแนะจากประธาน').trim() || 'ข้อเสนอแนะจากประธาน';
    const rows = Array.isArray(section && section.items) ? section.items : [];

    rows.forEach((row, rowIndex) => {
      const answer = normalizeChairmanChecklistAnswer(row && row.answer, row && Object.prototype.hasOwnProperty.call(row, 'checked') ? row.checked : null);
      if (answer !== 'no') return;

      const itemKey = String(row && row.itemKey ? row.itemKey : `item_${rowIndex + 1}`).trim() || `item_${rowIndex + 1}`;
      const label = String(row && (row.label || row.description) ? (row.label || row.description) : `รายการตรวจสอบ ${rowIndex + 1}`).trim();
      const syntheticSectionKey = `chairman_checklist:${sectionKey}`;

      feedbackItems.push({
        sectionKey: syntheticSectionKey,
        fieldKey: `chairman_checklist:${sectionKey}:${itemKey}`,
        commentType: 'required_fix',
        commentText: label || `รายการตรวจสอบ ${rowIndex + 1}`,
        visibility: 'researcher_visible',
        meta: {
          sectionKey: syntheticSectionKey,
          sectionLabel,
          rubricLabel: 'รายการที่ประธานขอให้ตรวจทาน',
          sectionNo: 1000 + sectionIndex,
          editable: false,
          source: 'chairman_checklist'
        }
      });
    });
  });

  if (feedbackItems.length === 0) {
    const summaryComment = String(review && review.summaryComment ? review.summaryComment : '').trim();
    if (summaryComment) {
      feedbackItems.push({
        sectionKey: 'chairman_summary',
        fieldKey: 'chairman_summary',
        commentType: 'suggestion',
        commentText: summaryComment,
        visibility: 'researcher_visible',
        meta: {
          sectionKey: 'chairman_summary',
          sectionLabel: 'ข้อเสนอแนะจากประธาน',
          rubricLabel: 'สรุปความเห็น',
          sectionNo: 1999,
          editable: false,
          source: 'chairman_checklist'
        }
      });
    }
  }

  return feedbackItems;
}

function serializeFeedbackReview(review = {}, options = {}) {
  const isChairman = Boolean(options.isChairman);
  const normalizedDecision = normalizeFeedbackDecision(review.decision);
  const base = {
    _id: review._id,
    roundNo: review.roundNo || 1,
    reviewerUserId: review.reviewerUserId || null,
    decision: normalizedDecision,
    summaryComment: review.summaryComment || '',
    totalScore: review.totalScore,
    submittedAt: review.submittedAt || review.updatedAt || null,
    updatedAt: review.updatedAt || null,
    reviewStatus: review.reviewStatus || '',
    feedbackSource: isChairman ? 'chairman' : 'committee'
  };

  if (isChairman) {
    return {
      ...base,
      commentItems: buildChairmanFeedbackItems(review),
      rawCommentItems: Array.isArray(review.commentItems) ? review.commentItems : [],
      scoreItems: Array.isArray(review.scoreItems) ? review.scoreItems : []
    };
  }

  return {
    ...base,
    commentItems: Array.isArray(review.commentItems) ? review.commentItems : [],
    scoreItems: Array.isArray(review.scoreItems) ? review.scoreItems : []
  };
}

function buildFinanceFeedbackReview(latestDecisionLog = null) {
  if (!latestDecisionLog || latestDecisionLog.actionKey !== 'finance_revision_requested') return null;

  const summaryComment = String(latestDecisionLog.remark || '').trim();

  return {
    _id: `finance-feedback-${String(latestDecisionLog._id || 'latest')}`,
    roundNo: latestDecisionLog.roundNo || 1,
    reviewerUserId: latestDecisionLog.changedBy || null,
    decision: 'revision',
    summaryComment,
    commentItems: [
      {
        sectionKey: 'budget',
        fieldKey: 'finance_budget_revision',
        commentType: 'required_fix',
        commentText: summaryComment || 'กรุณาปรับปรุงข้อมูลงบประมาณตามข้อเสนอแนะของฝ่ายการเงิน',
        visibility: 'researcher_visible',
        meta: {
          sectionKey: 'budget',
          sectionLabel: 'งบประมาณ',
          rubricLabel: 'ข้อเสนอแนะจากฝ่ายการเงิน',
          sectionNo: 7,
          editable: true,
          source: 'finance_review'
        }
      }
    ],
    scoreItems: [],
    totalScore: null,
    submittedAt: latestDecisionLog.createdAt || null,
    updatedAt: latestDecisionLog.createdAt || null,
    reviewStatus: REVIEW_STATUS.CERTIFIED,
    feedbackSource: 'finance'
  };
}

function dedupeCommitteeIds(committeeIds = []) {
  const seen = new Set();
  const result = [];
  for (const id of committeeIds) {
    const key = String(id || '').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(key);
  }
  return result;
}

async function getAcceptedReviewsForRound(proposalId, roundNo) {
  const targetRound = normalizeRoundNo(roundNo, 1);
  return ProposalReview.find({
    proposalId,
    roundNo: targetRound,
    reviewStatus: REVIEW_STATUS.CERTIFIED
  })
    .select('totalScore reviewerUserId roundNo reviewStatus')
    .lean();
}

async function getWorkflowSubmittedReviewsForRound(proposalId, roundNo) {
  const targetRound = normalizeRoundNo(roundNo, 1);
  return ProposalReview.find({
    proposalId,
    roundNo: targetRound,
    reviewStatus: { $in: [REVIEW_STATUS.SUBMITTED, REVIEW_STATUS.CERTIFIED] }
  })
    .select('totalScore reviewerUserId roundNo reviewStatus')
    .lean();
}

function getRequiredCommitteeReviewCount(workflowPolicy = {}, committeeIds = []) {
  const minCommittee = Math.max(1, Math.floor(Number(workflowPolicy && workflowPolicy.minCommittee) || 1));
  const assignedCount = Array.isArray(committeeIds) ? committeeIds.length : 0;
  if (assignedCount <= 0) return minCommittee;
  return Math.max(1, Math.min(minCommittee, assignedCount));
}

async function syncProposalStatusWithSubmittedReviews(proposalId, roundNo, user) {
  if (!proposalId || !user || !user._id) return null;

  const proposal = await Proposal.findById(proposalId).select('_id proposalCode projectTitleTh projectTitleEn applicantUserId committeeIds currentStatus currentRound');
  if (!proposal) return null;

  const fromStatusRaw = String(proposal.currentStatus || '').trim();
  const fromStatus = STATUS.normalizeStatus(fromStatusRaw);
  const activeRound = normalizeRoundNo(roundNo, normalizeRoundNo(proposal.currentRound, 1));
  const reviewStatuses = [STATUS.ASSIGNED_TO_COMMITTEE, STATUS.UNDER_REVIEW, STATUS.COMMITTEE_VALUATED, STATUS.SECOND_ROUND_REVIEW];
  if (!reviewStatuses.includes(fromStatus)) return proposal;

  const workflowSubmittedReviews = await getWorkflowSubmittedReviewsForRound(proposal._id, activeRound);
  const submittedCount = workflowSubmittedReviews.length;
  if (submittedCount <= 0) return proposal;

  const workflowPolicy = await systemSettingService.getWorkflowApprovalPolicy();
  const requiredCount = getRequiredCommitteeReviewCount(workflowPolicy, proposal.committeeIds);

  let toStatus = null;
  if (submittedCount >= requiredCount) {
    toStatus = STATUS.COMMITTEE_VALUATED;
  } else if (fromStatus === STATUS.ASSIGNED_TO_COMMITTEE) {
    toStatus = STATUS.UNDER_REVIEW;
  }

  if (!toStatus || toStatus === fromStatus) return proposal;

  const updatedProposal = await Proposal.findOneAndUpdate(
    { _id: proposal._id, currentStatus: fromStatusRaw },
    { $set: { currentStatus: toStatus, updatedBy: user._id } },
    { new: true }
  );

  if (!updatedProposal) {
    return Proposal.findById(proposal._id);
  }

  const statusLog = await createStatusLog({
    proposalId: updatedProposal._id,
    fromStatus,
    toStatus,
    actionKey: 'status_change',
    remark: null,
    roundNo: activeRound,
    changedBy: user._id
  });

  const recipientIds = new Set();
  if (updatedProposal.applicantUserId) {
    recipientIds.add(String(updatedProposal.applicantUserId));
  }
  if (
    [STATUS.ASSIGNED_TO_COMMITTEE, STATUS.UNDER_REVIEW, STATUS.COMMITTEE_VALUATED, STATUS.MEETING_COMPLETED].includes(toStatus) &&
    Array.isArray(updatedProposal.committeeIds)
  ) {
    updatedProposal.committeeIds.forEach((committeeId) => recipientIds.add(String(committeeId)));
  }

  if (recipientIds.size > 0) {
    const notificationTitleMap = {
      [STATUS.UNDER_REVIEW]: 'โครงการเข้าสู่ขั้นตอนการพิจารณา',
      [STATUS.COMMITTEE_VALUATED]: 'กรรมการได้ให้ความเห็นแล้ว',
      [STATUS.MEETING_COMPLETED]: 'ส่วนบริหารกำลังจัดเตรียมผล'
    };
    const notificationTitle = notificationTitleMap[toStatus] || 'สถานะโครงการมีการเปลี่ยนแปลง';
    const notificationMessage = `โครงการ ${updatedProposal.proposalCode || updatedProposal._id} เปลี่ยนสถานะเป็น ${toStatus}`;

    try {
      await notifyUsersWithWorkflowEmail({
        recipientIds: Array.from(recipientIds),
        proposalId: updatedProposal._id,
        eventKey: toStatus === STATUS.COMMITTEE_VALUATED
          ? 'committee_valuated'
          : (toStatus === STATUS.MEETING_COMPLETED ? 'meeting_completed' : 'status_changed'),
        title: notificationTitle,
        message: notificationMessage,
        payload: {
          toStatus,
          fromStatus,
          roundNo: activeRound
        },
        proposal: updatedProposal,
        context: {
          remarks: `รอบการพิจารณา ${activeRound}`
        },
        proposalStatusLogId: statusLog && statusLog._id ? statusLog._id : null
      });
    } catch (err) {
      console.warn('[Proposal.saveReview] Failed to create status-sync notifications:', {
        proposalId: String(updatedProposal._id),
        toStatus,
        error: err && err.message ? err.message : err
      });
    }
  }

  return updatedProposal;
}

async function syncProposalStatusWithAcceptedCommitteeReviews(proposalId, roundNo, user) {
  if (!proposalId || !user || !user._id) return null;

  const proposal = await Proposal.findById(proposalId).select('_id proposalCode applicantUserId committeeIds currentStatus currentRound');
  if (!proposal) return null;

  const fromStatusRaw = String(proposal.currentStatus || '').trim();
  const fromStatus = STATUS.normalizeStatus(fromStatusRaw);
  const activeRound = normalizeRoundNo(roundNo, normalizeRoundNo(proposal.currentRound, 1));
  const reviewStatuses = [STATUS.ASSIGNED_TO_COMMITTEE, STATUS.UNDER_REVIEW, STATUS.SECOND_ROUND_REVIEW];
  if (!reviewStatuses.includes(fromStatus)) return proposal;

  const acceptedReviews = await getAcceptedReviewsForRound(proposal._id, activeRound);
  const acceptedCount = acceptedReviews.length;
  if (acceptedCount <= 0) return proposal;

  const workflowPolicy = await systemSettingService.getWorkflowApprovalPolicy();
  const requiredCount = getRequiredCommitteeReviewCount(workflowPolicy, proposal.committeeIds);
  if (acceptedCount < requiredCount) return proposal;

  const toStatus = STATUS.MEETING_COMPLETED;
  if (toStatus === fromStatus) return proposal;

  const updatedProposal = await Proposal.findOneAndUpdate(
    { _id: proposal._id, currentStatus: fromStatusRaw },
    { $set: { currentStatus: toStatus, updatedBy: user._id } },
    { new: true }
  );

  if (!updatedProposal) {
    return Proposal.findById(proposal._id);
  }

  const statusLog = await createStatusLog({
    proposalId: updatedProposal._id,
    fromStatus,
    toStatus,
    actionKey: 'status_change',
    remark: null,
    roundNo: activeRound,
    changedBy: user._id
  });

  const recipientIds = new Set();
  if (updatedProposal.applicantUserId) {
    recipientIds.add(String(updatedProposal.applicantUserId));
  }
  if (Array.isArray(updatedProposal.committeeIds)) {
    updatedProposal.committeeIds.forEach((committeeId) => recipientIds.add(String(committeeId)));
  }

  if (recipientIds.size > 0) {
    const notificationMessage = `โครงการ ${updatedProposal.proposalCode || updatedProposal._id} เปลี่ยนสถานะเป็น ${toStatus}`;

    try {
      await notifyProposalStakeholders(updatedProposal, {
        eventKey: 'meeting_completed',
        title: 'ส่วนบริหารกำลังจัดเตรียมผล',
        message: notificationMessage,
        payload: {
          toStatus,
          fromStatus,
          roundNo: activeRound
        },
        remarks: 'แอดมินรับผลการประเมินครบตามเงื่อนไขแล้ว',
        proposalStatusLogId: statusLog && statusLog._id ? statusLog._id : null
      });
    } catch (err) {
      console.warn('[Proposal.acceptProposalReview] Failed to create status-sync notifications:', {
        proposalId: String(updatedProposal._id),
        toStatus,
        error: err && err.message ? err.message : err
      });
    }
  }

  return updatedProposal;
}

async function generateProposalCode() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePrefix = `${yy}${mm}${dd}`;

  const latestToday = await Proposal.findOne(
    { proposalCode: { $regex: `^${datePrefix}` } },
    { proposalCode: 1 },
    { sort: { proposalCode: -1 } }
  );

  let nextSeq = 1;
  if (latestToday && latestToday.proposalCode) {
    const lastSeq = parseInt(String(latestToday.proposalCode).slice(-4), 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  const seq = String(nextSeq).padStart(4, '0');
  return `${datePrefix}${seq}`;
}

async function createProposal(payload, user) {
  const doc = payload || {};
  assertFundingBudgetLimit(doc, {});
  if (!doc.applicantUserId) doc.applicantUserId = user._id;
  if (!doc.createdBy) doc.createdBy = user._id;
  doc.currentStatus = STATUS.DRAFT;
  normalizeDraftCoreFields(doc);

  if (!doc.proposalCode) {
    doc.proposalCode = await generateProposalCode();
  }

  console.log('[Proposal.create] mongoose.connection.name:', mongoose.connection && mongoose.connection.name);
  console.log('[Proposal.create] Proposal.collection.name:', Proposal.collection && Proposal.collection.name);
  const proposal = new Proposal(doc);
  return await proposal.save();
}

async function getProposalList(query = {}, user) {
  console.log('[Proposal.list] mongoose.connection.name:', mongoose.connection && mongoose.connection.name);
  console.log('[Proposal.list] Proposal.collection.name:', Proposal.collection && Proposal.collection.name);

  const filter = { isDeleted: { $ne: true } };
  if (user && user.role === 'researcher' && user._id) {
    filter.applicantUserId = user._id;
  }
  if (user && user.role === 'committee' && user._id) {
    filter.committeeIds = user._id;
  }
  if (user && isChairmanRole(user.role) && user._id) {
    filter.$or = [
      { 'chairmanAssignment.assignedChairmanIds': user._id },
      { 'chairmanAssignment.reviewedBy': user._id }
    ];
  }
  if (user && user.role === 'finance_officer' && user._id) {
    filter.$or = [
      { 'financeAssignment.assignedFinanceOfficerIds': user._id },
      { 'financeAssignment.submittedBy': user._id }
    ];
  }
  const statusTokens = [];
  const pushStatusTokens = (raw) => {
    if (!raw) return;
    if (Array.isArray(raw)) {
      raw.forEach(pushStatusTokens);
      return;
    }
    const text = String(raw).trim();
    if (!text) return;
    text
      .split(',')
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .forEach((item) => statusTokens.push(item));
  };
  pushStatusTokens(query.currentStatus);
  pushStatusTokens(query.status);
  const uniqueStatusTokens = Array.from(new Set(statusTokens));
  if (uniqueStatusTokens.length === 1) {
    filter.currentStatus = uniqueStatusTokens[0];
  } else if (uniqueStatusTokens.length > 1) {
    filter.currentStatus = { $in: uniqueStatusTokens };
  }
  if (query.fiscalYear) filter.fiscalYear = query.fiscalYear;
  if (query.keyword) {
    const kw = query.keyword;
    const keywordFilter = [
      { projectTitleTh: new RegExp(kw, 'i') },
      { projectTitleEn: new RegExp(kw, 'i') },
      { proposalCode: new RegExp(kw, 'i') }
    ];
    if (filter.$or) {
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: keywordFilter });
    } else {
      filter.$or = keywordFilter;
    }
  }

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const sortBy = String(query.sortBy || '').trim();
  const sortOrder = String(query.sortOrder || query.order || '').trim().toLowerCase() === 'asc' ? 'asc' : 'desc';
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  const buildActivityTimestamp = (proposal) => {
    const values = [
      proposal && proposal.lastStatusActionAt,
      proposal && proposal.currentStatusUpdatedAt,
      proposal && proposal.statusUpdatedAt,
      proposal && proposal.updatedAt,
      proposal && proposal.createdAt
    ];
    return values.reduce((latest, value) => {
      const ts = value ? new Date(value).getTime() : 0;
      return Number.isFinite(ts) && ts > latest ? ts : latest;
    }, 0);
  };

  const shouldSortByLatestStatus = sortBy === 'latestStatusUpdatedAt';

  const [data, total] = await Promise.all([
    (() => {
      const proposalQuery = Proposal.find(filter)
        .populate('applicantUserId', 'fullName email')
        .sort({ createdAt: -1 });

      if (!shouldSortByLatestStatus) {
        proposalQuery.skip(skip).limit(limit);
      }

      return proposalQuery;
    })(),
    Proposal.countDocuments(filter)
  ]);

  const proposalIds = data
    .map((proposal) => (proposal && proposal._id ? proposal._id : null))
    .filter(Boolean);

  let latestStatusActionAtByProposalId = new Map();
  if (proposalIds.length > 0) {
    const latestStatusRows = await ProposalStatusLog.aggregate([
      {
        $match: {
          proposalId: { $in: proposalIds }
        }
      },
      {
        $sort: {
          updatedAt: -1,
          createdAt: -1
        }
      },
      {
        $group: {
          _id: '$proposalId',
          updatedAt: { $first: '$updatedAt' },
          createdAt: { $first: '$createdAt' }
        }
      }
    ]);

    latestStatusActionAtByProposalId = new Map(
      latestStatusRows.map((row) => {
        const proposalId = String(row && row._id ? row._id : '');
        const updatedAtTs = row && row.updatedAt ? new Date(row.updatedAt).getTime() : 0;
        const createdAtTs = row && row.createdAt ? new Date(row.createdAt).getTime() : 0;
        const latestTs = Math.max(updatedAtTs || 0, createdAtTs || 0);
        return [proposalId, latestTs ? new Date(latestTs) : null];
      })
    );
  }

  const enrichedData = data.map((proposal) => {
    const plain = proposal && typeof proposal.toObject === 'function'
      ? proposal.toObject()
      : { ...proposal };
    plain.lastStatusActionAt = latestStatusActionAtByProposalId.get(String(plain && plain._id ? plain._id : '')) || null;
    return plain;
  });

  const finalData = shouldSortByLatestStatus
    ? enrichedData
      .slice()
      .sort((left, right) => {
        const leftTs = buildActivityTimestamp(left);
        const rightTs = buildActivityTimestamp(right);
        if (leftTs === rightTs) {
          return String(left && left.proposalCode ? left.proposalCode : '').localeCompare(String(right && right.proposalCode ? right.proposalCode : ''));
        }
        return (leftTs - rightTs) * sortDirection;
      })
      .slice(skip, skip + limit)
    : enrichedData;

  return {
    proposals: finalData,
    data: finalData,
    items: finalData,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}

async function getProposalById(id, user) {
  // TODO: re-enable populate('applicantUserId') when User model is registered/integrated
  const proposal = await Proposal.findById(id);
  // .populate('applicantUserId')
  // .populate('committeeIds');
  if (!proposal) return proposal;

  const role = user && user.role ? String(user.role).trim().toLowerCase() : '';
  const uid = user && user._id ? String(user._id) : '';
  const isAdmin = role === 'admin';
  const isOwner = uid && proposal.applicantUserId && String(proposal.applicantUserId) === uid;
  const isCommittee = uid && Array.isArray(proposal.committeeIds) && proposal.committeeIds.map(String).includes(uid);
  const isChairman = isChairmanRole(role) && hasChairmanProposalAccess(proposal, uid);
  const isFinanceOfficer = role === 'finance_officer' && hasFinanceProposalAccess(proposal, uid);

  if (user && !isAdmin && !isOwner && !isCommittee && !isChairman && !isFinanceOfficer) {
    throw new Error('Forbidden');
  }

  const latestStatusLog = await ProposalStatusLog.findOne({ proposalId: proposal._id })
    .sort({ updatedAt: -1, createdAt: -1 })
    .select('updatedAt createdAt');

  const plain = typeof proposal.toObject === 'function'
    ? proposal.toObject()
    : { ...proposal };

  if (latestStatusLog) {
    const updatedAtTs = latestStatusLog.updatedAt ? new Date(latestStatusLog.updatedAt).getTime() : 0;
    const createdAtTs = latestStatusLog.createdAt ? new Date(latestStatusLog.createdAt).getTime() : 0;
    const latestTs = Math.max(updatedAtTs || 0, createdAtTs || 0);
    plain.lastStatusActionAt = latestTs ? new Date(latestTs) : null;
  } else {
    plain.lastStatusActionAt = null;
  }

  return plain;
}

async function updateDraftProposal(id, payload, user) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new Error('Proposal not found');
  if (![STATUS.DRAFT, STATUS.REVISION_REQUESTED].includes(proposal.currentStatus)) {
    throw new Error('Can only update draft or revision requested proposals');
  }
  if (user && user.role === 'researcher' && String(proposal.applicantUserId) !== String(user._id)) {
    throw new Error('Forbidden');
  }
  const originalProposal = proposal.toObject ? proposal.toObject() : { ...proposal };
  applyDraftPayload(proposal, payload, originalProposal);
  assertFundingBudgetLimit(proposal, originalProposal);
  proposal.updatedBy = user._id;
  return await proposal.save();
}

async function deleteDraftProposal(id, user) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new Error('Proposal not found');
  if (proposal.isDeleted) return proposal;

  // UI requirement: only draft status can be deleted by owner/admin.
  if (proposal.currentStatus !== STATUS.DRAFT) {
    throw new Error('Can only delete draft proposals');
  }

  const role = user && user.role;
  const uid = user && user._id ? String(user._id) : null;
  const isAdmin = role === 'admin';
  const isOwner = uid && proposal.applicantUserId && String(proposal.applicantUserId) === uid;

  if (!isAdmin && !isOwner) {
    throw new Error('Forbidden');
  }

  proposal.isDeleted = true;
  proposal.updatedBy = user && user._id ? user._id : null;
  return await proposal.save();
}

async function resubmitProposal(id, user) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new Error('Proposal not found');

  if (proposal.currentStatus !== STATUS.REVISION_REQUESTED) {
    throw new Error('Only revision requested proposals can be resubmitted');
  }

  if (user && user.role === 'researcher' && String(proposal.applicantUserId) !== String(user._id)) {
    throw new Error('Forbidden');
  }
  assertFundingBudgetLimit(proposal, proposal);

  const fromStatus = proposal.currentStatus;
  const resubmissionTarget = await resolveRevisionResubmissionTarget(proposal._id);
  proposal.currentStatus = resubmissionTarget;
  proposal.requiresRevision = false;
  proposal.updatedBy = user._id;

  if (resubmissionTarget === STATUS.FACULTY_REVIEW_PENDING) {
    const chairmanAssignment = proposal && proposal.chairmanAssignment && typeof proposal.chairmanAssignment === 'object'
      ? proposal.chairmanAssignment
      : {};
    proposal.set(buildChairmanAssignmentUpdate({
      assignedChairmanIds: getAssignedChairmanIdsFromProposal(chairmanAssignment),
      status: CHAIRMAN_REVIEW_STATUS.PENDING,
      assignedAt: chairmanAssignment.assignedAt || null,
      assignedBy: chairmanAssignment.assignedBy || null,
      reviewedAt: null,
      reviewedBy: null,
      summaryComment: chairmanAssignment.summaryComment || ''
    }));
  }

  if (resubmissionTarget === STATUS.FINANCE_BUDGET_CHECKING) {
    const financeAssignment = proposal && proposal.financeAssignment && typeof proposal.financeAssignment === 'object'
      ? proposal.financeAssignment
      : {};
    proposal.set(buildFinanceAssignmentUpdate({
      assignedFinanceOfficerIds: getAssignedFinanceOfficerIdsFromProposal(financeAssignment),
      status: FINANCE_REVIEW_STATUS.PENDING,
      assignedAt: financeAssignment.assignedAt || null,
      assignedBy: financeAssignment.assignedBy || null,
      submittedAt: null,
      submittedBy: null,
      summaryComment: financeAssignment.summaryComment || ''
    }));
  }

  await proposal.save();

  const resubmitStatusLog = await createStatusLog({
    proposalId: proposal._id,
    fromStatus,
    toStatus: resubmissionTarget,
    actionKey: 'resubmit',
    remark: null,
    roundNo: proposal.currentRound || 1,
    changedBy: user._id
  });

  await createNotification({
    userId: user._id,
    proposalId: proposal._id,
    channel: 'in_app',
    eventKey: 'proposal_resubmitted',
    title: 'ส่งโครงการฉบับแก้ไขแล้ว',
    message: `โครงการ ${proposal.proposalCode || proposal._id} ถูกส่งฉบับแก้ไขกลับเข้าระบบแล้ว`,
    payload: {
      toStatus: resubmissionTarget,
      fromStatus
    }
  });

  if (resubmissionTarget === STATUS.FACULTY_REVIEW_PENDING || resubmissionTarget === STATUS.FINANCE_BUDGET_CHECKING) {
    const recipientIds = new Set();
    if (resubmissionTarget === STATUS.FACULTY_REVIEW_PENDING) {
      const chairmanAssignment = proposal && proposal.chairmanAssignment && typeof proposal.chairmanAssignment === 'object'
        ? proposal.chairmanAssignment
        : {};
      getAssignedChairmanIdsFromProposal(chairmanAssignment).forEach((chairmanId) => recipientIds.add(String(chairmanId)));
      if (chairmanAssignment.assignedBy) recipientIds.add(String(chairmanAssignment.assignedBy));
    }

    if (resubmissionTarget === STATUS.FINANCE_BUDGET_CHECKING) {
      const financeAssignment = proposal && proposal.financeAssignment && typeof proposal.financeAssignment === 'object'
        ? proposal.financeAssignment
        : {};
      getAssignedFinanceOfficerIdsFromProposal(financeAssignment).forEach((financeOfficerId) => recipientIds.add(String(financeOfficerId)));
      if (financeAssignment.assignedBy) recipientIds.add(String(financeAssignment.assignedBy));
    }

    if (recipientIds.size > 0) {
      await notifyUsersWithWorkflowEmail({
        recipientIds: Array.from(recipientIds),
        proposalId: proposal._id,
        eventKey: 'proposal_resubmitted',
        title: resubmissionTarget === STATUS.FACULTY_REVIEW_PENDING
          ? 'มีโครงการฉบับแก้ไขส่งกลับให้ประธานพิจารณาอีกครั้ง'
          : 'มีโครงการฉบับแก้ไขส่งกลับให้ฝ่ายการเงินตรวจสอบอีกครั้ง',
        message: resubmissionTarget === STATUS.FACULTY_REVIEW_PENDING
          ? `โครงการ ${proposal.proposalCode || proposal._id} ถูกส่งฉบับแก้ไขกลับมาและอยู่ในสถานะรอประธานพิจารณาอีกครั้ง`
          : `โครงการ ${proposal.proposalCode || proposal._id} ถูกส่งฉบับแก้ไขกลับมาและอยู่ในสถานะรอฝ่ายการเงินตรวจสอบอีกครั้ง`,
        payload: {
          fromStatus,
          toStatus: resubmissionTarget
        },
        proposal,
        context: {
          remarks: ''
        },
        proposalStatusLogId: resubmitStatusLog && resubmitStatusLog._id ? resubmitStatusLog._id : null
      });
    }
  }

  await notifyAdminsOfProposalSubmission(proposal, {
    eventKey: 'proposal_resubmitted',
    title: 'มีโครงการฉบับแก้ไขส่งกลับมา',
    message: `โครงการ ${proposal.proposalCode || proposal._id} ถูกส่งฉบับแก้ไขกลับเข้าระบบแล้ว`,
    remarks: 'โครงการถูกส่งกลับเข้ากระบวนการหลังได้รับคำขอแก้ไข',
    proposalStatusLogId: resubmitStatusLog && resubmitStatusLog._id ? resubmitStatusLog._id : null
  });

  return proposal;
}

async function submitProposal(id, user, options = {}) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new Error('Proposal not found');
  if (proposal.currentStatus !== STATUS.DRAFT) {
    throw new Error('Only drafts can be submitted');
  }
  assertFundingBudgetLimit(proposal, proposal);
  const fromStatus = proposal.currentStatus;
  const snapshot = proposal.formSnapshotJson && typeof proposal.formSnapshotJson === 'object'
    ? { ...proposal.formSnapshotJson }
    : {};
  const participantSummary = getCollaborationParticipantSummary(snapshot);
  const requiresCollaborationConfirmation = participantSummary.total > 0;
  const toStatus = requiresCollaborationConfirmation ? STATUS.PENDING_CONFIRM : STATUS.SUBMITTED;
  const now = new Date();

  proposal.currentStatus = toStatus;
  proposal.updatedBy = user && user._id ? user._id : proposal.updatedBy;
  if (!requiresCollaborationConfirmation) {
    proposal.submittedAt = proposal.submittedAt || now;
  }
  snapshot.collaborationNeedsResubmission = false;
  proposal.formSnapshotJson = snapshot;
  proposal.markModified('formSnapshotJson');
  await proposal.save();

  const submitStatusLog = await createStatusLog({
    proposalId: proposal._id,
    fromStatus,
    toStatus,
    actionKey: 'submit',
    remark: null,
    roundNo: null,
    changedBy: user._id
  });

  const submitNotificationTitle = requiresCollaborationConfirmation
    ? 'รอการยืนยันจากผู้ร่วมโครงการ/ที่ปรึกษาโครงการ'
    : 'ยื่นโครงการเรียบร้อย';
  const submitNotificationMessage = requiresCollaborationConfirmation
    ? ("โครงการ " + (proposal.proposalCode || proposal._id) + " รอการยืนยันจากผู้ร่วมโครงการ/ที่ปรึกษาโครงการ")
    : ("โครงการ " + (proposal.proposalCode || proposal._id) + " ยื่นสำเร็จแล้ว");
  await createNotification({
    userId: user._id,
    proposalId: proposal._id,
    channel: 'in_app',
    eventKey: requiresCollaborationConfirmation ? 'proposal.pending_confirm' : 'proposal.submitted',
    title: submitNotificationTitle,
    message: submitNotificationMessage,
    payload: {}
  });

  if (!requiresCollaborationConfirmation && toStatus === STATUS.SUBMITTED) {
    await notifyAdminsOfProposalSubmission(proposal, {
      eventKey: 'proposal_submitted',
      title: 'มีข้อเสนอโครงการใหม่',
      message: `โครงการ ${proposal.projectTitleTh || proposal.projectTitleEn || proposal.proposalCode || proposal._id} ถูกยื่นเข้าระบบแล้ว`,
      remarks: 'ข้อเสนอโครงการใหม่พร้อมให้ตรวจสอบในขั้นตอนถัดไป',
      proposalStatusLogId: submitStatusLog && submitStatusLog._id ? submitStatusLog._id : null
    });
  }

  if (requiresCollaborationConfirmation) {
    try {
      await collaborationConfirmationService.issueCollaborationConfirmations({
        proposalId: proposal._id,
        invitedByUserId: user && user._id ? user._id : null,
        requestOrigin: options && options.requestOrigin ? options.requestOrigin : ''
      });
    } catch (err) {
      console.error('[Proposal.submit] Collaboration confirmation dispatch failed:', err && err.message ? err.message : err);
    }
  }

  return await Proposal.findById(proposal._id);
}
async function changeProposalStatus(id, toStatus, remark, user) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new Error('Proposal not found');

  const workflowPolicy = await systemSettingService.getWorkflowApprovalPolicy();
  const currentRound = normalizeRoundNo(proposal.currentRound, 1);
  const fromStatus = STATUS.normalizeStatus(proposal.currentStatus);
  toStatus = STATUS.normalizeStatus(toStatus);

  if (String((user && user.role) || '').trim().toLowerCase() === 'admin' && ADMIN_BLOCKED_MANUAL_STATUSES.has(toStatus)) {
    const err = new Error('Admin cannot manually change status to approved or rejected');
    err.code = 'ADMIN_MANUAL_FINAL_STATUS_DISABLED';
    err.statusCode = 400;
    throw err;
  }

  let allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
  const submittedReviewCount = await ProposalReview.countDocuments({
    proposalId: proposal._id,
    reviewStatus: REVIEW_STATUS.CERTIFIED
  });

  console.log('[Proposal.changeStatus] transition check', {
    fromStatus,
    toStatus,
    allowed,
    submittedReviewCount
  });

  if (!allowed.includes(toStatus)) {
    throw new Error(`Cannot transition from ${fromStatus} to ${toStatus}`);
  }

  if (
    fromStatus === STATUS.MEETING_COMPLETED &&
    toStatus === STATUS.REVISION_REQUESTED &&
    !workflowPolicy.allowRevisionAfterMeeting
  ) {
    throw new Error('Revision after meeting is disabled by workflow policy');
  }

  // Allow review/revision loop to continue until admin finalizes with approved/rejected/announced.
  // Do not hard-stop by maxRounds here.

  if (toStatus === STATUS.APPROVED) {
    const submittedRoundReviews = await getAcceptedReviewsForRound(proposal._id, currentRound);
    const submittedCountForCurrentRound = submittedRoundReviews.length;

    if (submittedCountForCurrentRound < workflowPolicy.minCommittee) {
      throw new Error(`Cannot approve: requires at least ${workflowPolicy.minCommittee} submitted committee reviews`);
    }

    const scores = submittedRoundReviews
      .map((row) => Number(row && row.totalScore))
      .filter((value) => Number.isFinite(value));

    if (!scores.length) {
      throw new Error('Cannot approve: no valid committee score submitted for current round');
    }

    const averageScore = scores.reduce((sum, value) => sum + value, 0) / scores.length;
    if (averageScore < workflowPolicy.minScore) {
      throw new Error(`Cannot approve: average score ${averageScore.toFixed(2)} is below minimum threshold ${workflowPolicy.minScore}`);
    }
  }

  // Only update status-related fields; avoid overwriting unrelated fields (e.g. committeeIds)
  const updates = {
    currentStatus: toStatus,
    updatedBy: user._id
  };
  const now = new Date();
  // Terminal states (approved, rejected, announced) should generally not move backward unless explicitly allowed by business rules
  switch (toStatus) {
    case STATUS.SUBMITTED:
      updates.submittedAt = proposal.submittedAt || now;
      break;
    case STATUS.FACULTY_APPROVED:
      updates.facultyApprovedAt = now;
      break;
    case STATUS.FACULTY_REJECTED:
      updates.rejectedAt = null;
      break;
    case STATUS.OFFICE_RECEIVED:
      updates.officeReceivedAt = now;
      break;
    case STATUS.FINANCE_BUDGET_CHECKING:
      updates.officeReceivedAt = proposal.officeReceivedAt || now;
      break;
    case STATUS.REVISION_REQUESTED:
      updates.requiresRevision = true;
      break;
    case STATUS.RESUBMITTED:
      updates.requiresRevision = false;
      break;
    case STATUS.SECOND_ROUND_REVIEW:
      updates.currentRound = Math.max(currentRound + 1, 2);
      break;
    case STATUS.APPROVED:
      updates.approvedAt = now;
      break;
    case STATUS.REJECTED:
      updates.rejectedAt = now;
      break;
    case STATUS.ANNOUNCED:
      updates.announcedAt = now;
      break;
  }

  const updatedProposal = await Proposal.findByIdAndUpdate(id, { $set: updates }, { new: true });

  const manualStatusLog = await createStatusLog({
    proposalId: updatedProposal._id,
    fromStatus,
    toStatus,
    actionKey: 'status_change',
    remark,
    roundNo: null,
    changedBy: user._id
  });

  const recipientIds = new Set();
  if (updatedProposal && updatedProposal.applicantUserId) {
    recipientIds.add(String(updatedProposal.applicantUserId));
  }

  if (
    [STATUS.ASSIGNED_TO_COMMITTEE, STATUS.UNDER_REVIEW, STATUS.COMMITTEE_VALUATED, STATUS.MEETING_COMPLETED].includes(toStatus) &&
    Array.isArray(updatedProposal.committeeIds)
  ) {
    updatedProposal.committeeIds.forEach((committeeId) => recipientIds.add(String(committeeId)));
  }

  const notificationTitleMap = {
    [STATUS.REVISION_REQUESTED]: 'มีคำขอแก้ไขโครงการ',
    [STATUS.FACULTY_APPROVED]: 'ประธานอนุมัติข้อเสนอโครงการ',
    [STATUS.FACULTY_REJECTED]: 'ประธานไม่อนุมัติข้อเสนอโครงการ',
    [STATUS.APPROVED]: 'โครงการได้รับการอนุมัติ',
    [STATUS.REJECTED]: 'โครงการไม่ผ่านการพิจารณา',
    [STATUS.ANNOUNCED]: 'มีการประกาศผลโครงการ',
    [STATUS.FINANCE_BUDGET_CHECKING]: 'เจ้าหน้าที่การเงินกำลังตรวจสอบงบประมาณ',
    [STATUS.ASSIGNED_TO_COMMITTEE]: 'มีการมอบหมายคณะกรรมการ',
    [STATUS.UNDER_REVIEW]: 'โครงการเข้าสู่ขั้นตอนการพิจารณา',
    [STATUS.COMMITTEE_VALUATED]: 'กรรมการได้ให้ความเห็นแล้ว',
    [STATUS.MEETING_COMPLETED]: 'ส่วนบริหารกำลังจัดเตรียมผล'
  };

  const notificationTitle = notificationTitleMap[toStatus] || 'สถานะโครงการมีการเปลี่ยนแปลง';
  const notificationMessage = `โครงการ ${updatedProposal.proposalCode || updatedProposal._id} เปลี่ยนสถานะเป็น ${toStatus}${remark ? ` (${remark})` : ''}`;

  if (recipientIds.size > 0) {
    const workflowEventKey =
      toStatus === STATUS.REVISION_REQUESTED
        ? 'revision_requested'
        : (toStatus === STATUS.FACULTY_APPROVED
          ? 'chairman_approved'
          : (toStatus === STATUS.FACULTY_REJECTED
            ? 'chairman_rejected'
            : (toStatus === STATUS.FINANCE_BUDGET_CHECKING
              ? 'status_changed'
            : (toStatus === STATUS.APPROVED
                ? 'approved'
                : (toStatus === STATUS.REJECTED
                  ? 'rejected'
                  : (toStatus === STATUS.COMMITTEE_VALUATED
                    ? 'committee_valuated'
                    : (toStatus === STATUS.MEETING_COMPLETED ? 'meeting_completed' : 'status_changed')))))));

    await notifyUsersWithWorkflowEmail({
      recipientIds: Array.from(recipientIds),
      proposalId: updatedProposal._id,
      eventKey: workflowEventKey,
      title: notificationTitle,
      message: notificationMessage,
      payload: {
        toStatus,
        fromStatus,
        remark: remark || ''
      },
      proposal: updatedProposal,
      context: {
        remarks: remark || ''
      },
      proposalStatusLogId: manualStatusLog && manualStatusLog._id ? manualStatusLog._id : null
    });
  }

  return updatedProposal;
}

async function assignCommittee(id, committeeIds = [], user) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new Error('Proposal not found');

  // Validate committeeIds is an array
  if (!Array.isArray(committeeIds)) {
    throw new Error('committeeIds must be an array');
  }

  const workflowPolicy = await systemSettingService.getWorkflowApprovalPolicy();
  const normalizedCommitteeIds = dedupeCommitteeIds(committeeIds);

  const assignedCommitteeUsers = await User.find({
    _id: { $in: normalizedCommitteeIds },
    role: 'committee',
    isActive: true,
    isDeleted: { $ne: true }
  })
    .select('_id')
    .lean();

  if (assignedCommitteeUsers.length !== normalizedCommitteeIds.length) {
    throw new Error('All assigned users must be active committee members');
  }

  // Prevent committee assignment to finalized proposals
  const terminalStates = [STATUS.APPROVED, STATUS.REJECTED, STATUS.ANNOUNCED];
  if (terminalStates.includes(proposal.currentStatus)) {
    throw new Error('Cannot assign committee to a finalized proposal');
  }

  if (normalizedCommitteeIds.length < workflowPolicy.minCommittee) {
    throw new Error(`At least ${workflowPolicy.minCommittee} committee members are required by workflow policy`);
  }

  const fromStatus = proposal.currentStatus;
  proposal.committeeIds = normalizedCommitteeIds;
  proposal.updatedBy = user._id;
  let statusChanged = false;
  let assignCommitteeLog = null;
  if (![STATUS.ASSIGNED_TO_COMMITTEE, STATUS.UNDER_REVIEW].includes(proposal.currentStatus)) {
    proposal.currentStatus = STATUS.ASSIGNED_TO_COMMITTEE;
    statusChanged = true;
  }
  await proposal.save();

  // log status change or assignment action
  if (statusChanged) {
    assignCommitteeLog = await createStatusLog({
      proposalId: proposal._id,
      fromStatus,
      toStatus: STATUS.ASSIGNED_TO_COMMITTEE,
      actionKey: 'status_change',
      remark: null,
      roundNo: null,
      changedBy: user._id
    });
  } else {
    assignCommitteeLog = await createStatusLog({
      proposalId: proposal._id,
      fromStatus,
      toStatus: fromStatus,
      actionKey: 'assign_committee',
      remark: null,
      roundNo: null,
      changedBy: user._id
    });
  }

  if (normalizedCommitteeIds.length > 0) {
    const emailResult = await dispatchProposalWorkflowNotification({
      eventKey: 'committee_assigned',
      recipientIds: normalizedCommitteeIds,
      proposal,
      inApp: {
        title: 'ได้รับมอบหมายให้พิจารณาโครงการ',
        message: `กรุณาตรวจสอบโครงการ ${proposal.proposalCode || proposal._id}`,
        payload: {}
      },
      proposalStatusLogId: assignCommitteeLog && assignCommitteeLog._id ? assignCommitteeLog._id : null
    });

    if (emailResult && emailResult.email && (emailResult.email.failed > 0 || emailResult.email.skippedReason)) {
      console.warn('[Proposal.assignCommittee] Workflow email delivery issue:', {
        proposalId: String(proposal._id),
        eventKey: 'committee_assigned',
        skippedReason: emailResult.email.skippedReason || '',
        failed: emailResult.email.failed || 0,
        failures: emailResult.email.failures || []
      });
    }
  }

  return proposal;
}

async function assignChairman(id, chairmanIds = [], user) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new Error('Proposal not found');

  if (!Array.isArray(chairmanIds) || chairmanIds.length === 0) {
    throw new Error('chairmanIds must be a non-empty array');
  }

  const fromStatus = STATUS.normalizeStatus(proposal.currentStatus);
  if (![STATUS.SUBMITTED, STATUS.FACULTY_REVIEW_PENDING].includes(fromStatus)) {
    throw new Error(`Cannot assign chairman from ${fromStatus}`);
  }

  const selectedChairmanIds = dedupeCommitteeIds(chairmanIds);
  const chairmanUsers = await User.find({
    _id: { $in: selectedChairmanIds },
    role: 'chairman',
    isActive: true,
    isDeleted: { $ne: true }
  })
    .select('_id')
    .lean();

  const validChairmanIds = dedupeCommitteeIds(chairmanUsers.map((row) => row && row._id));
  if (validChairmanIds.length !== selectedChairmanIds.length) {
    throw new Error('Some selected chairman users are invalid or inactive');
  }

  proposal.currentStatus = STATUS.FACULTY_REVIEW_PENDING;
  proposal.updatedBy = user._id;

  const now = new Date();
  const assignmentState = buildChairmanAssignmentUpdate({
    assignedChairmanIds: validChairmanIds,
    status: CHAIRMAN_REVIEW_STATUS.PENDING,
    assignedAt: now,
    assignedBy: user._id,
    reviewedAt: null,
    reviewedBy: null,
    summaryComment: ''
  });
  proposal.set(assignmentState);
  await proposal.save();

  const assignChairmanLog = await createStatusLog({
    proposalId: proposal._id,
    fromStatus,
    toStatus: STATUS.FACULTY_REVIEW_PENDING,
    actionKey: 'assign_chairman',
    remark: null,
    roundNo: null,
    changedBy: user._id
  });

  if (validChairmanIds.length > 0) {
    const emailResult = await dispatchProposalWorkflowNotification({
      eventKey: 'chairman_assigned',
      recipientIds: validChairmanIds,
      proposal,
      inApp: {
        title: 'มีเอกสารถูกส่งให้ประธานพิจารณา',
        message: `กรุณาตรวจสอบโครงการ ${proposal.proposalCode || proposal._id}`,
        payload: {
          toStatus: STATUS.FACULTY_REVIEW_PENDING
        }
      },
      proposalStatusLogId: assignChairmanLog && assignChairmanLog._id ? assignChairmanLog._id : null
    });

    if (emailResult && emailResult.email && (emailResult.email.failed > 0 || emailResult.email.skippedReason)) {
      console.warn('[Proposal.assignChairman] Workflow email delivery issue:', {
        proposalId: String(proposal._id),
        eventKey: 'chairman_assigned',
        skippedReason: emailResult.email.skippedReason || '',
        failed: emailResult.email.failed || 0,
        failures: emailResult.email.failures || []
      });
    }
  }

  return proposal;
}

async function assignFinanceOfficer(id, financeOfficerIds = [], user) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new Error('Proposal not found');

  if (!Array.isArray(financeOfficerIds) || financeOfficerIds.length === 0) {
    throw new Error('financeOfficerIds must be a non-empty array');
  }

  const fromStatus = STATUS.normalizeStatus(proposal.currentStatus);
  if (![STATUS.OFFICE_RECEIVED, STATUS.FINANCE_BUDGET_CHECKING].includes(fromStatus)) {
    throw new Error(`Cannot assign finance officer from ${fromStatus}`);
  }

  const selectedIds = dedupeCommitteeIds(financeOfficerIds);
  const financeOfficerUsers = await User.find({
    _id: { $in: selectedIds },
    role: 'finance_officer',
    isActive: true,
    isDeleted: { $ne: true }
  })
    .select('_id')
    .lean();

  const validIds = dedupeCommitteeIds(financeOfficerUsers.map((row) => row && row._id));
  if (validIds.length !== selectedIds.length) {
    throw new Error('Some selected finance officers are invalid or inactive');
  }

  const now = new Date();
  proposal.currentStatus = STATUS.FINANCE_BUDGET_CHECKING;
  proposal.updatedBy = user._id;
  proposal.set(buildFinanceAssignmentUpdate({
    assignedFinanceOfficerIds: validIds,
    status: FINANCE_REVIEW_STATUS.PENDING,
    assignedAt: now,
    assignedBy: user._id,
    submittedAt: null,
    submittedBy: null,
    summaryComment: ''
  }));
  await proposal.save();

  const assignFinanceLog = await createStatusLog({
    proposalId: proposal._id,
    fromStatus,
    toStatus: STATUS.FINANCE_BUDGET_CHECKING,
    actionKey: 'assign_finance_officer',
    remark: null,
    roundNo: null,
    changedBy: user._id
  });

  if (validIds.length > 0) {
    const emailResult = await dispatchProposalWorkflowNotification({
      eventKey: 'finance_officer_assigned',
      recipientIds: validIds,
      proposal,
      inApp: {
        title: 'ได้รับมอบหมายให้ตรวจสอบงบประมาณ',
        message: `กรุณาตรวจสอบงบประมาณของโครงการ ${proposal.proposalCode || proposal._id}`,
        payload: {
          toStatus: STATUS.FINANCE_BUDGET_CHECKING
        }
      },
      proposalStatusLogId: assignFinanceLog && assignFinanceLog._id ? assignFinanceLog._id : null
    });

    if (emailResult && emailResult.email && (emailResult.email.failed > 0 || emailResult.email.skippedReason)) {
      console.warn('[Proposal.assignFinanceOfficer] Workflow email delivery issue:', {
        proposalId: String(proposal._id),
        eventKey: 'finance_officer_assigned',
        skippedReason: emailResult.email.skippedReason || '',
        failed: emailResult.email.failed || 0,
        failures: emailResult.email.failures || []
      });
    }
  }

  return proposal;
}

async function applyChairmanReviewOutcome(proposalId, review, payload = {}, user) {
  const proposal = await Proposal.findById(proposalId);
  if (!proposal) throw new Error('Proposal not found');

  const currentStatus = STATUS.normalizeStatus(proposal.currentStatus);
  if (currentStatus !== STATUS.FACULTY_REVIEW_PENDING) {
    return review;
  }

  const decision = String(payload && payload.decision ? payload.decision : '').trim().toLowerCase();
  const now = new Date();
  const reviewerId = review && review.reviewerUserId
    ? String(review.reviewerUserId && review.reviewerUserId._id ? review.reviewerUserId._id : review.reviewerUserId)
    : '';

  const chairmanAssignment = proposal && proposal.chairmanAssignment && typeof proposal.chairmanAssignment === 'object'
    ? proposal.chairmanAssignment
    : {};
  const assignedChairmanIds = getAssignedChairmanIdsFromProposal(chairmanAssignment);

  let nextStatus = currentStatus;
  let assignmentStatus = CHAIRMAN_REVIEW_STATUS.PENDING;
  let facultyApprovedAt = proposal.facultyApprovedAt || null;
  let officeReceivedAt = proposal.officeReceivedAt || null;
  let rejectedAt = proposal.rejectedAt || null;
  let requiresRevision = proposal.requiresRevision === true;

  if (decision === 'approve') {
    nextStatus = STATUS.FACULTY_APPROVED;
    assignmentStatus = CHAIRMAN_REVIEW_STATUS.APPROVED;
    facultyApprovedAt = now;
    requiresRevision = false;
  } else if (decision === 'reject') {
    nextStatus = STATUS.REJECTED;
    assignmentStatus = CHAIRMAN_REVIEW_STATUS.REJECTED;
    officeReceivedAt = null;
    rejectedAt = now;
    requiresRevision = false;
  } else if (decision === 'revision' || decision === 'request_revision' || decision === 'revision_requested') {
    nextStatus = STATUS.REVISION_REQUESTED;
    assignmentStatus = CHAIRMAN_REVIEW_STATUS.REVISION_REQUESTED;
    facultyApprovedAt = null;
    rejectedAt = null;
    requiresRevision = true;
  } else {
    return review;
  }

  proposal.currentStatus = nextStatus;
  proposal.requiresRevision = requiresRevision;
  proposal.updatedBy = user._id;
  proposal.facultyApprovedAt = facultyApprovedAt;
  proposal.officeReceivedAt = officeReceivedAt;
  proposal.rejectedAt = rejectedAt;
  proposal.set(buildChairmanAssignmentUpdate({
    assignedChairmanIds,
    status: assignmentStatus,
    assignedAt: chairmanAssignment.assignedAt || null,
    assignedBy: chairmanAssignment.assignedBy || null,
    reviewedAt: now,
    reviewedBy: reviewerId || user._id,
    summaryComment: payload && payload.summaryComment ? payload.summaryComment : ''
  }));
  await proposal.save();

  const chairmanDecisionLog = await createStatusLog({
    proposalId: proposal._id,
    fromStatus: currentStatus,
    toStatus: nextStatus,
    actionKey: decision === 'approve'
      ? 'chairman_approved'
      : (decision === 'reject' ? 'chairman_rejected' : 'chairman_revision_requested'),
    remark: payload && payload.summaryComment ? payload.summaryComment : null,
    roundNo: null,
    changedBy: user._id
  });

  const recipientIds = new Set();
  if (proposal.applicantUserId) recipientIds.add(String(proposal.applicantUserId));
  if (chairmanAssignment && chairmanAssignment.assignedBy) recipientIds.add(String(chairmanAssignment.assignedBy));

  if (recipientIds.size > 0) {
    const eventKey = decision === 'approve'
      ? 'chairman_approved'
      : (decision === 'reject' ? 'chairman_rejected' : 'revision_requested');
    const title = decision === 'approve'
      ? 'ประธานอนุมัติข้อเสนอโครงการ'
      : (decision === 'reject' ? 'ประธานไม่อนุมัติข้อเสนอโครงการ' : 'ประธานขอให้แก้ไขข้อเสนอโครงการ');
    const message = decision === 'approve'
      ? `โครงการ ${proposal.proposalCode || proposal._id} ผ่านการพิจารณาจากประธานแล้ว และอยู่ในสถานะประธานอนุมัติ`
      : (decision === 'reject'
        ? `โครงการ ${proposal.proposalCode || proposal._id} ไม่ผ่านการพิจารณาจากประธาน และอยู่ในสถานะปฏิเสธ`
        : `โครงการ ${proposal.proposalCode || proposal._id} ถูกส่งกลับเพื่อแก้ไขเพิ่มเติมตามข้อเสนอแนะของประธาน`);

    await notifyProposalStakeholders(proposal, {
      eventKey,
      title,
      message,
      payload: {
        decision,
        toStatus: nextStatus
      },
      remarks: payload && payload.summaryComment ? payload.summaryComment : '',
      includeCommittee: false,
      extraRecipientIds: Array.from(recipientIds),
      proposalStatusLogId: chairmanDecisionLog && chairmanDecisionLog._id ? chairmanDecisionLog._id : null
    });
  }

  return review;
}

async function saveReview(proposalId, payload, user) {
  const {
    roundNo = 1,
    commentItems,
    scoreItems,
    decision,
    summaryComment,
    totalScore,
    isSubmit,
    signatureData
  } = payload;
  if (!user || !user._id) throw new Error('Unauthorized');

  const round = parseInt(roundNo, 10) || 1;
  const filter = { proposalId, reviewerUserId: user._id, roundNo: round };
  let reviewAccessProposal = null;

  // Access control: committee can only review proposals they are assigned to.
  const reviewerRole = String(user && user.role ? user.role : '').trim().toLowerCase();
  if (isReviewerRole(reviewerRole)) {
    reviewAccessProposal = await Proposal.findById(proposalId).select('_id committeeIds chairmanAssignment currentStatus').lean();
    if (!reviewAccessProposal) throw new Error('Proposal not found');
    if (reviewerRole === 'chairman') {
      if (!hasChairmanProposalAccess(reviewAccessProposal, user._id)) {
        throw new Error('Forbidden');
      }
      if (STATUS.normalizeStatus(reviewAccessProposal.currentStatus) !== STATUS.FACULTY_REVIEW_PENDING) {
        throw new Error('Forbidden');
      }
    } else {
      const committeeIds = Array.isArray(reviewAccessProposal.committeeIds) ? reviewAccessProposal.committeeIds.map(String) : [];
      if (!committeeIds.includes(String(user._id))) {
        throw new Error('Forbidden');
      }
    }
  }

  const existing = await ProposalReview.findOne(filter).select('_id reviewStatus submittedAt').lean();
  const allowChairmanResubmission = isChairmanRole(reviewerRole)
    && STATUS.normalizeStatus(reviewAccessProposal && reviewAccessProposal.currentStatus) === STATUS.FACULTY_REVIEW_PENDING;
  if (existing && isReviewLockedStatus(existing.reviewStatus) && !allowChairmanResubmission) {
    // One submission per reviewer per proposal/round (no resubmission).
    throw new Error('REVIEW_ALREADY_SUBMITTED');
  }

  const nextStatus = isSubmit === true
    ? REVIEW_STATUS.SUBMITTED
    : (existing && existing.reviewStatus ? existing.reviewStatus : REVIEW_STATUS.IN_PROGRESS);

  const isChairmanReviewer = isChairmanRole(reviewerRole);
  const savedSignature = isChairmanReviewer
    ? validateReviewSignatureData(signatureData, { required: nextStatus === REVIEW_STATUS.SUBMITTED })
    : '';

  const update = {
    proposalId,
    reviewerUserId: user._id,
    roundNo: round,
    commentItems,
    scoreItems,
    decision,
    summaryComment,
    totalScore,
    reviewStatus: nextStatus
  };

  if (isChairmanReviewer) {
    update.signatureData = savedSignature;
    update.signatureUpdatedAt = savedSignature ? new Date() : null;
  }

  if (nextStatus === REVIEW_STATUS.SUBMITTED) {
    update.submittedAt = new Date();
  }

  const review = await ProposalReview.findOneAndUpdate(filter, update, { upsert: true, new: true });

  if (nextStatus === REVIEW_STATUS.SUBMITTED && !isChairmanRole(reviewerRole)) {
    try {
      await syncProposalStatusWithSubmittedReviews(proposalId, round, user);
    } catch (err) {
      console.warn('[Proposal.saveReview] Failed to sync proposal.currentStatus after review submission:', {
        proposalId: String(proposalId),
        roundNo: round,
        error: err && err.message ? err.message : err
      });
    }
  }

  if (nextStatus === REVIEW_STATUS.SUBMITTED && isChairmanRole(reviewerRole)) {
    await applyChairmanReviewOutcome(proposalId, review, payload, user);
  }

  return review;
}

async function saveFinanceReview(proposalId, payload = {}, user) {
  if (!user || !user._id) throw new Error('Unauthorized');
  if (String(user.role || '').trim().toLowerCase() !== 'finance_officer') throw new Error('Forbidden');

  const proposal = await Proposal.findById(proposalId);
  if (!proposal) throw new Error('Proposal not found');
  if (!hasFinanceProposalAccess(proposal, user._id)) throw new Error('Forbidden');

  const currentStatus = STATUS.normalizeStatus(proposal.currentStatus);
  if (currentStatus !== STATUS.FINANCE_BUDGET_CHECKING) {
    throw new Error('Forbidden');
  }

  const financeAssignment = proposal && proposal.financeAssignment && typeof proposal.financeAssignment === 'object'
    ? proposal.financeAssignment
    : {};
  const assignedFinanceOfficerIds = getAssignedFinanceOfficerIdsFromProposal(financeAssignment);
  const summaryComment = String(payload && payload.summaryComment ? payload.summaryComment : '').trim();
  const isSubmit = payload && payload.isSubmit === true;
  const decision = String(payload && payload.decision ? payload.decision : '').trim().toLowerCase();
  const isRevisionRequest = isSubmit && ['revision', 'request_revision', 'revision_requested'].includes(decision);
  const now = new Date();

  proposal.updatedBy = user._id;
  proposal.set(buildFinanceAssignmentUpdate({
    assignedFinanceOfficerIds,
    status: isSubmit
      ? (isRevisionRequest ? FINANCE_REVIEW_STATUS.REVISION_REQUESTED : FINANCE_REVIEW_STATUS.SUBMITTED)
      : FINANCE_REVIEW_STATUS.PENDING,
    assignedAt: financeAssignment.assignedAt || null,
    assignedBy: financeAssignment.assignedBy || null,
    submittedAt: isSubmit ? now : (financeAssignment.submittedAt || null),
    submittedBy: isSubmit ? user._id : (financeAssignment.submittedBy || null),
    summaryComment
  }));

  let financeSubmissionLog = null;
  if (isSubmit) {
    proposal.currentStatus = isRevisionRequest ? STATUS.REVISION_REQUESTED : STATUS.DOCUMENT_CHECKING;
    proposal.requiresRevision = isRevisionRequest;
  }

  await proposal.save();

  if (isSubmit) {
    financeSubmissionLog = await createStatusLog({
      proposalId: proposal._id,
      fromStatus: currentStatus,
      toStatus: isRevisionRequest ? STATUS.REVISION_REQUESTED : STATUS.DOCUMENT_CHECKING,
      actionKey: isRevisionRequest ? 'finance_revision_requested' : 'finance_review_submitted',
      remark: summaryComment || null,
      roundNo: null,
      changedBy: user._id
    });
  }

  if (isSubmit) {
    const adminIds = await getActiveAdminIds();
    const baseRecipientIds = isRevisionRequest && proposal.applicantUserId
      ? [String(proposal.applicantUserId)]
      : [];
    const recipientIds = Array.from(new Set(baseRecipientIds.concat(adminIds).concat(financeAssignment.assignedBy ? [String(financeAssignment.assignedBy)] : [])));
    if (recipientIds.length > 0) {
      await notifyUsersWithWorkflowEmail({
        recipientIds,
        proposalId: proposal._id,
        eventKey: isRevisionRequest ? 'revision_requested' : 'finance_review_submitted',
        title: isRevisionRequest ? 'ฝ่ายการเงินขอให้แก้ไขข้อเสนอโครงการ' : 'ได้รับผลการตรวจสอบงบประมาณแล้ว',
        message: isRevisionRequest
          ? `เจ้าหน้าที่การเงินส่งโครงการ ${proposal.proposalCode || proposal._id} กลับเพื่อแก้ไขเพิ่มเติม`
          : `เจ้าหน้าที่การเงินส่งผลการตรวจสอบงบประมาณของโครงการ ${proposal.proposalCode || proposal._id} แล้ว`,
        payload: {
          toStatus: isRevisionRequest ? STATUS.REVISION_REQUESTED : STATUS.DOCUMENT_CHECKING,
          summaryComment
        },
        proposal,
        context: {
          remarks: summaryComment
        },
        proposalStatusLogId: financeSubmissionLog && financeSubmissionLog._id ? financeSubmissionLog._id : null
      });
    }
  }

  return proposal;
}

async function acceptProposalReview(proposalId, reviewId, user) {
  if (!user || !user._id) throw new Error('Unauthorized');

  const proposalForNotification = await Proposal.findById(proposalId)
    .select('_id proposalCode projectTitleTh projectTitleEn')
    .lean();

  const review = await ProposalReview.findOne({ _id: reviewId, proposalId })
    .populate('reviewerUserId', 'fullName email role');
  if (!review) throw new Error('REVIEW_NOT_FOUND');
  if (!isReviewAwaitingAdminDecision(review.reviewStatus)) {
    throw new Error('REVIEW_NOT_PENDING_ADMIN');
  }

  review.reviewStatus = REVIEW_STATUS.CERTIFIED;
  review.certifiedAt = new Date();
  await review.save();

  const reviewer = review.reviewerUserId || null;

  if (reviewer && reviewer._id) {
    try {
      await notifyUsersWithWorkflowEmail({
        recipientIds: [String(reviewer._id)],
        proposalId,
        eventKey: 'review_certified',
        title: 'แอดมินรับผลการประเมินแล้ว',
        message: 'ผลการประเมินของคุณถูกแอดมินรับเข้าระบบเรียบร้อยแล้ว',
        payload: {
          reviewId: review._id,
          roundNo: review.roundNo || 1,
          reviewStatus: review.reviewStatus
        },
        proposal: proposalForNotification,
        context: {
          remarks: 'แอดมินรับผลการประเมินเข้าระบบแล้ว'
        }
      });
    } catch (err) {
      console.warn('[Proposal.acceptProposalReview] Failed to create review acceptance notification:', {
        proposalId: String(proposalId),
        reviewId: String(reviewId),
        error: err && err.message ? err.message : err
      });
    }
  }

  const reviewerRole = reviewer && reviewer.role ? String(reviewer.role).trim().toLowerCase() : '';
  if (!isChairmanRole(reviewerRole)) {
    try {
      await syncProposalStatusWithAcceptedCommitteeReviews(proposalId, review.roundNo, user);
    } catch (err) {
      console.warn('[Proposal.acceptProposalReview] Failed to sync proposal.currentStatus after accepting all committee reviews:', {
        proposalId: String(proposalId),
        reviewId: String(reviewId),
        roundNo: review.roundNo,
        error: err && err.message ? err.message : err
      });
    }
  }

  return review;
}

async function rollbackProposalStatusAfterRejectedReview(proposalId, review, user) {
  const proposal = await Proposal.findById(proposalId);
  if (!proposal) throw new Error('Proposal not found');

  const reviewer = review && review.reviewerUserId ? review.reviewerUserId : null;
  const reviewerRole = reviewer && reviewer.role ? String(reviewer.role).trim().toLowerCase() : '';
  const now = new Date();
  const fromStatus = STATUS.normalizeStatus(proposal.currentStatus);

  if (isChairmanRole(reviewerRole)) {
    const chairmanAssignment = proposal && proposal.chairmanAssignment && typeof proposal.chairmanAssignment === 'object'
      ? proposal.chairmanAssignment
      : {};
    const assignedChairmanIds = getAssignedChairmanIdsFromProposal(chairmanAssignment);
    const toStatus = STATUS.FACULTY_REVIEW_PENDING;

    if (fromStatus !== toStatus) {
      proposal.currentStatus = toStatus;
      proposal.updatedBy = user._id;
      proposal.set(buildChairmanAssignmentUpdate({
        assignedChairmanIds,
        status: CHAIRMAN_REVIEW_STATUS.PENDING,
        assignedAt: chairmanAssignment.assignedAt || null,
        assignedBy: chairmanAssignment.assignedBy || null,
        reviewedAt: null,
        reviewedBy: null,
        summaryComment: ''
      }));
      await proposal.save();

      const chairmanRollbackLog = await createStatusLog({
        proposalId: proposal._id,
        fromStatus,
        toStatus,
        actionKey: 'review_rejected_by_admin',
        remark: 'Admin rejected chairman review submission',
        roundNo: null,
        changedBy: user._id
      });

      const assignmentById = chairmanAssignment && chairmanAssignment.assignedBy ? String(chairmanAssignment.assignedBy) : '';
      await notifyProposalStakeholders(proposal, {
        eventKey: 'review_rejected_by_admin',
        title: 'ผลการพิจารณาจากประธานถูกตีกลับโดยแอดมิน',
        message: `โครงการ ${proposal.proposalCode || proposal._id} ถูกปรับกลับไปยังสถานะรอประธานพิจารณา`,
        payload: {
          fromStatus,
          toStatus,
          reviewId: review && review._id ? review._id : null,
          roundNo: review && review.roundNo ? review.roundNo : null
        },
        remarks: 'แอดมินตีกลับผลการพิจารณาของประธาน',
        includeCommittee: false,
        extraRecipientIds: assignedChairmanIds.concat(assignmentById ? [assignmentById] : []),
        proposalStatusLogId: chairmanRollbackLog && chairmanRollbackLog._id ? chairmanRollbackLog._id : null
      });
    }

    return proposal;
  }

  const toStatus = STATUS.ASSIGNED_TO_COMMITTEE;
  if (fromStatus === toStatus) return proposal;

  proposal.currentStatus = toStatus;
  proposal.updatedBy = user._id;
  await proposal.save();

  const committeeRollbackLog = await createStatusLog({
    proposalId: proposal._id,
    fromStatus,
    toStatus,
    actionKey: 'review_rejected_by_admin',
    remark: 'Admin rejected committee review submission',
    roundNo: review && review.roundNo ? review.roundNo : null,
    changedBy: user._id
  });

  await notifyProposalStakeholders(proposal, {
    eventKey: 'review_rejected_by_admin',
    title: 'ผลการประเมินถูกตีกลับโดยแอดมิน',
    message: `โครงการ ${proposal.proposalCode || proposal._id} ถูกปรับกลับไปยังสถานะมอบหมายกรรมการ`,
    payload: {
      fromStatus,
      toStatus,
      reviewId: review && review._id ? review._id : null,
      roundNo: review && review.roundNo ? review.roundNo : null
    },
    remarks: 'แอดมินตีกลับผลการประเมินของกรรมการ',
    proposalStatusLogId: committeeRollbackLog && committeeRollbackLog._id ? committeeRollbackLog._id : null
  });

  return proposal;
}

async function rejectProposalReview(proposalId, reviewId, user) {
  if (!user || !user._id) throw new Error('Unauthorized');

  const proposalForNotification = await Proposal.findById(proposalId)
    .select('_id proposalCode projectTitleTh projectTitleEn')
    .lean();

  const review = await ProposalReview.findOne({ _id: reviewId, proposalId })
    .populate('reviewerUserId', 'fullName email role');
  if (!review) throw new Error('REVIEW_NOT_FOUND');
  if (!isReviewAwaitingAdminDecision(review.reviewStatus)) {
    throw new Error('REVIEW_NOT_PENDING_ADMIN');
  }

  const reviewer = review.reviewerUserId || null;
  const response = {
    _id: review._id,
    proposalId,
    reviewerUserId: reviewer,
    roundNo: review.roundNo || 1,
    deleted: true
  };

  await rollbackProposalStatusAfterRejectedReview(proposalId, review, user);

  await ProposalReview.deleteOne({ _id: review._id });

  if (reviewer && reviewer._id) {
    try {
      await notifyUsersWithWorkflowEmail({
        recipientIds: [String(reviewer._id)],
        proposalId,
        eventKey: 'review_rejected_by_admin',
        title: 'แอดมินไม่รับผลการประเมิน',
        message: 'ผลการประเมินของคุณถูกตีกลับ กรุณาประเมินใหม่อีกครั้ง',
        payload: {
          reviewId: review._id,
          roundNo: review.roundNo || 1
        },
        proposal: proposalForNotification,
        context: {
          remarks: 'แอดมินไม่รับผลการประเมินและต้องการให้ประเมินใหม่'
        }
      });
    } catch (err) {
      console.warn('[Proposal.rejectProposalReview] Failed to create review rejection notification:', {
        proposalId: String(proposalId),
        reviewId: String(reviewId),
        error: err && err.message ? err.message : err
      });
    }
  }

  return response;
}

async function getMyReview(proposalId, roundNo = 1, user) {
  const round = parseInt(roundNo, 10) || 1;
  return ProposalReview.findOne({
    proposalId,
    reviewerUserId: user._id,
    roundNo: round
  });
}

async function getMyReviews(query = {}, user) {
  const filter = { reviewerUserId: user._id };
  const round = parseInt(query.roundNo, 10);
  if (!Number.isNaN(round) && round > 0) filter.roundNo = round;

  if (query.reviewStatus) {
    const statuses = String(query.reviewStatus)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (statuses.length > 0) filter.reviewStatus = { $in: statuses };
  }

  if (query.proposalIds) {
    const ids = String(query.proposalIds)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (ids.length > 0) {
      const objectIds = ids
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
      if (objectIds.length > 0) {
        filter.proposalId = { $in: objectIds };
      } else {
        return [];
      }
    }
  }

  return ProposalReview.find(filter).sort({ updatedAt: -1 });
}

async function getProposalReviews(proposalId, query = {}, user = null) {
  const proposal = await Proposal.findById(proposalId)
    .select('_id applicantUserId committeeIds chairmanAssignment');
  if (!proposal) throw new Error('Proposal not found');

  if (user) {
    const role = user && user.role ? String(user.role).trim().toLowerCase() : '';
    const uid = user && user._id ? String(user._id) : '';
    const isAdmin = role === 'admin';
    const isOwner = uid && proposal.applicantUserId && String(proposal.applicantUserId) === uid;
    const isCommittee = uid && Array.isArray(proposal.committeeIds) && proposal.committeeIds.map(String).includes(uid);
    const isChairman = isChairmanRole(role) && hasChairmanProposalAccess(proposal, uid);

    if (!isAdmin && !isOwner && !isCommittee && !isChairman) {
      throw new Error('Forbidden');
    }
  }

  const filter = { proposalId };
  const round = parseInt(query.roundNo, 10);
  if (!Number.isNaN(round) && round > 0) filter.roundNo = round;

  return ProposalReview.find(filter)
    .populate('reviewerUserId', 'fullName email role')
    .sort({ roundNo: 1, submittedAt: -1, updatedAt: -1 });
}

async function getProposalFeedback(proposalId, user) {
  const proposal = await Proposal.findById(proposalId)
    .select('_id applicantUserId committeeIds chairmanAssignment currentStatus currentRound');
  if (!proposal) throw new Error('Proposal not found');

  if (user && user.role === 'researcher' && String(proposal.applicantUserId) !== String(user._id)) {
    throw new Error('Forbidden');
  }
  if (user && isChairmanRole(user.role) && !hasChairmanProposalAccess(proposal, user._id)) {
    throw new Error('Forbidden');
  }

  const activeRoundNo = normalizeRoundNo(proposal.currentRound, 1);

  const [latestDecisionLog, reviews] = await Promise.all([
    ProposalStatusLog.findOne({
      proposalId,
      toStatus: { $in: [STATUS.REVISION_REQUESTED, STATUS.APPROVED, STATUS.REJECTED] }
    })
      .sort({ createdAt: -1 })
      .populate('changedBy', 'fullName email role'),
    ProposalReview.find({
      proposalId,
      roundNo: activeRoundNo,
      reviewStatus: REVIEW_STATUS.CERTIFIED
    })
      .populate('reviewerUserId', 'fullName email role')
      .sort({ submittedAt: -1, updatedAt: -1 })
  ]);

  const serializedReviews = (reviews || []).map((review) => serializeFeedbackReview(review, {
    isChairman: isChairmanReviewRecord(review)
  }));
  const financeFeedbackReview = buildFinanceFeedbackReview(latestDecisionLog);
  if (financeFeedbackReview) {
    serializedReviews.push(financeFeedbackReview);
  }
  const chairmanReviews = serializedReviews.filter((review) => review.feedbackSource === 'chairman');
  const financeReviews = serializedReviews.filter((review) => review.feedbackSource === 'finance');
  const committeeReviews = serializedReviews.filter((review) => review.feedbackSource === 'committee');

  return {
    proposalId: proposal._id,
    currentStatus: proposal.currentStatus,
    currentRound: activeRoundNo,
    latestDecision: latestDecisionLog ? {
      toStatus: latestDecisionLog.toStatus,
      remark: latestDecisionLog.remark || '',
      actionKey: latestDecisionLog.actionKey || '',
      roundNo: latestDecisionLog.roundNo || null,
      changedAt: latestDecisionLog.createdAt,
      changedBy: latestDecisionLog.changedBy || null
    } : null,
    feedbackReviews: serializedReviews,
    committeeReviews,
    chairmanReviews,
    financeReviews
  };
}

async function getResearcherUsers(query = {}, currentUser = null) {
  try {
    const filter = {
      role: 'researcher',
      isActive: true,
      isDeleted: { $ne: true }
    };

    const requesterId = currentUser && currentUser._id ? String(currentUser._id).trim() : '';
    if (requesterId && mongoose.Types.ObjectId.isValid(requesterId)) {
      filter._id = { $ne: new mongoose.Types.ObjectId(requesterId) };
    }

    if (query.keyword) {
      const raw = String(query.keyword || '').trim();
      if (raw) {
        const safe = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = [
          { fullName: new RegExp(safe, 'i') },
          { email: new RegExp(safe, 'i') },
          { department: new RegExp(safe, 'i') }
        ];
      }
    }

    const limit = Math.min(parseInt(query.limit, 10) || 300, 1000);
    const rows = await User.find(filter)
      .select('_id fullName email department phone role')
      .sort({ fullName: 1 })
      .limit(limit)
      .lean();

    const items = (rows || []).map(u => ({
      _id: u && u._id ? u._id : null,
      fullName: u && u.fullName ? String(u.fullName) : '',
      email: u && u.email ? String(u.email) : '',
      department: u && u.department ? String(u.department) : '',
      affiliation: u && u.department ? String(u.department) : '',
      phone: u && u.phone ? String(u.phone) : '',
      role: u && u.role ? String(u.role) : 'researcher'
    }));

    return {
      items,
      total: items.length
    };
  } catch (err) {
    console.error('[Proposal.getResearcherUsers] failed:', err && err.message ? err.message : err);
    return {
      items: [],
      total: 0
    };
  }
}

async function getCommitteeUsers(query = {}) {
  try {
    const roleFilter = String(query.role || '').trim().toLowerCase();
    const allowedRoles = roleFilter === 'chairman'
      ? ['chairman']
      : (roleFilter === 'finance_officer'
        ? ['finance_officer']
        : ['committee']);
    const filter = {
      role: { $in: allowedRoles },
      isActive: true,
      isDeleted: { $ne: true }
    };

    if (query.keyword) {
      const raw = String(query.keyword || '').trim();
      if (raw) {
        const safe = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = [
          { fullName: new RegExp(safe, 'i') },
          { email: new RegExp(safe, 'i') },
          { department: new RegExp(safe, 'i') }
        ];
      }
    }

    const normalized = (value) => String(value || '').trim().toLowerCase();
    const extractDepartmentFromSnapshot = (snapshot) => {
      if (!snapshot || typeof snapshot !== 'object') return '';

      const directCandidates = [
        snapshot.department,
        snapshot.departmentName,
        snapshot.affiliation,
        snapshot.faculty,
        snapshot.orgDepartment,
        snapshot.organization
      ];

      const directHit = directCandidates.find(v => typeof v === 'string' && v.trim());
      if (directHit) return String(directHit).trim();

      const nestedPaths = [
        snapshot.projectInfo && snapshot.projectInfo.department,
        snapshot.projectInformation && snapshot.projectInformation.department,
        snapshot.researchProject && snapshot.researchProject.department,
        snapshot.researcher && snapshot.researcher.department,
        snapshot.applicant && snapshot.applicant.department,
        snapshot.proposer && snapshot.proposer.department,
        snapshot.organizationInfo && snapshot.organizationInfo.department
      ];

      const nestedHit = nestedPaths.find(v => typeof v === 'string' && v.trim());
      return nestedHit ? String(nestedHit).trim() : '';
    };

    let proposalDepartment = '';
    const proposalId = String(query.proposalId || '').trim();
    if (proposalId && mongoose.Types.ObjectId.isValid(proposalId)) {
      const proposal = await Proposal.findById(proposalId)
        .select('applicantUserId formSnapshotJson')
        .lean();

      if (proposal) {
        proposalDepartment = extractDepartmentFromSnapshot(proposal.formSnapshotJson);
        if (!proposalDepartment && proposal.applicantUserId) {
          const applicant = await User.findById(proposal.applicantUserId).select('department').lean();
          proposalDepartment = applicant && applicant.department ? String(applicant.department).trim() : '';
        }
      }
    }

    const normalizedProposalDepartment = normalized(proposalDepartment);
    const limit = Math.min(parseInt(query.limit, 10) || 100, 300);
    const rows = await User.find(filter)
      .select('_id fullName email department')
      .sort({ fullName: 1 })
      .limit(limit)
      .lean();

    const mapped = (rows || []).map(u => {
      const department = u && u.department ? String(u.department).trim() : '';
      const isRecommended = Boolean(normalizedProposalDepartment) && normalized(department) === normalizedProposalDepartment;
      return {
      _id: u && u._id ? u._id : null,
      fullName: u && u.fullName ? u.fullName : '',
      email: u && u.email ? u.email : '',
      department,
      role: u && u.role ? String(u.role) : '',
      isRecommended,
      matchReason: isRecommended ? 'department_match' : ''
      };
    });

    mapped.sort((a, b) => {
      if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1;
      return String(a.fullName || '').localeCompare(String(b.fullName || ''), 'th');
    });

    const departments = Array.from(
      new Set(
        mapped
          .map(u => String(u.department || '').trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'th'));

    return {
      items: mapped,
      departments,
      proposalDepartment,
      hasRecommendation: mapped.some(u => u.isRecommended)
    };
  } catch (err) {
    console.error('[Proposal.getCommitteeUsers] failed:', err && err.message ? err.message : err);
    return {
      items: [],
      departments: [],
      proposalDepartment: '',
      hasRecommendation: false
    };
  }
}

async function getDashboardSummary(user) {
  const pipeline = [
    { $match: { isDeleted: { $ne: true } } },
    {
      $group: {
        _id: '$currentStatus',
        count: { $sum: 1 }
      }
    }
  ];
  const rows = await Proposal.aggregate(pipeline);
  const summary = {};
  for (const r of rows) {
    summary[r._id] = r.count;
  }
  return summary;
}

module.exports = {
  createProposal,
  getProposalList,
  getProposalById,
  updateDraftProposal,
  deleteDraftProposal,
  resubmitProposal,
  submitProposal,
  changeProposalStatus,
  assignCommittee,
  assignChairman,
  assignFinanceOfficer,
  saveReview,
  saveFinanceReview,
  acceptProposalReview,
  rejectProposalReview,
  getMyReview,
  getMyReviews,
  getProposalReviews,
  getProposalFeedback,
  getResearcherUsers,
  getCommitteeUsers,
  getDashboardSummary,
  createStatusLog,
  createNotification
};


