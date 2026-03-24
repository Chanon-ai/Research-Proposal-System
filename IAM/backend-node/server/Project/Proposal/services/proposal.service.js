// proposal.service.js
// Business logic for proposal workflow
// Uses existing Mongoose models and constants

const mongoose = require('mongoose');
const Proposal = require('../models/Proposal');
const ProposalStatusLog = require('../models/ProposalStatusLog');
const ProposalReview = require('../models/ProposalReview');
const Notification = require('../models/Notification');
const User = require('../../Auth/models/User');
const STATUS = require('../constants/proposal-status');
const { sendWorkflowEventEmails } = require('./workflow-notification.service');

// allowed status transitions map
const ALLOWED_TRANSITIONS = {
  [STATUS.DRAFT]: [STATUS.SUBMITTED],
  [STATUS.SUBMITTED]: [STATUS.FACULTY_REVIEW_PENDING],
  [STATUS.FACULTY_REVIEW_PENDING]: [STATUS.FACULTY_APPROVED, STATUS.REVISION_REQUESTED],
  [STATUS.FACULTY_APPROVED]: [STATUS.OFFICE_RECEIVED],
  [STATUS.OFFICE_RECEIVED]: [STATUS.DOCUMENT_CHECKING],
  [STATUS.DOCUMENT_CHECKING]: [STATUS.ASSIGNED_TO_COMMITTEE, STATUS.REVISION_REQUESTED],
  [STATUS.ASSIGNED_TO_COMMITTEE]: [
    STATUS.UNDER_REVIEW,
    STATUS.REVISION_REQUESTED,
    STATUS.APPROVED,
    STATUS.REJECTED
  ],
  [STATUS.UNDER_REVIEW]: [STATUS.MEETING_COMPLETED],
  [STATUS.MEETING_COMPLETED]: [STATUS.REVISION_REQUESTED, STATUS.APPROVED, STATUS.REJECTED],
  [STATUS.REVISION_REQUESTED]: [STATUS.RESUBMITTED],
  [STATUS.RESUBMITTED]: [STATUS.SECOND_ROUND_REVIEW],
  [STATUS.SECOND_ROUND_REVIEW]: [STATUS.APPROVED, STATUS.REJECTED, STATUS.REVISION_REQUESTED],
  [STATUS.APPROVED]: [STATUS.ANNOUNCED],
  [STATUS.REJECTED]: [STATUS.ANNOUNCED, STATUS.REVISION_REQUESTED]
};

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
  if (query.currentStatus) filter.currentStatus = query.currentStatus;
  if (query.status) filter.currentStatus = query.status;
  if (query.fiscalYear) filter.fiscalYear = query.fiscalYear;
  if (query.keyword) {
    const kw = query.keyword;
    filter.$or = [
      { projectTitleTh: new RegExp(kw, 'i') },
      { projectTitleEn: new RegExp(kw, 'i') },
      { proposalCode: new RegExp(kw, 'i') }
    ];
  }

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Proposal.find(filter)
      .populate('applicantUserId', 'fullName email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Proposal.countDocuments(filter)
  ]);

  return {
    proposals: data,
    data,
    items: data,
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
  return proposal;
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
  const isAdmin = role === 'admin' || role === 'chairman';
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

  const fromStatus = proposal.currentStatus;
  proposal.currentStatus = STATUS.RESUBMITTED;
  proposal.requiresRevision = false;
  proposal.updatedBy = user._id;
  await proposal.save();

  await createStatusLog({
    proposalId: proposal._id,
    fromStatus,
    toStatus: STATUS.RESUBMITTED,
    actionKey: 'resubmit',
    remark: null,
    roundNo: proposal.currentRound || 1,
    changedBy: user._id
  });

  return proposal;
}

async function submitProposal(id, user) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new Error('Proposal not found');
  if (proposal.currentStatus !== STATUS.DRAFT) {
    throw new Error('Only drafts can be submitted');
  }
  const fromStatus = proposal.currentStatus;
  proposal.currentStatus = STATUS.SUBMITTED;
  proposal.submittedAt = new Date();
  await proposal.save();

  // notify all active admins when a researcher submits a proposal
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
  if (admins.length > 0) {
    await Notification.insertMany(
      admins.map(admin => ({
        userId: admin._id,
        eventKey: 'status_changed',
        channel: 'in_app',
        title: 'มีข้อเสนอโครงการใหม่',
        message: `โครงการ "${proposal.projectTitleTh}" ได้รับการยื่นเข้าระบบแล้ว รหัส: ${proposal.proposalCode}`,
        proposalId: proposal._id,
        isRead: false,
        sentAt: new Date(),
        payload: {}
      }))
    );
  }

  await createStatusLog({
    proposalId: proposal._id,
    fromStatus,
    toStatus: STATUS.SUBMITTED,
    actionKey: 'submit',
    remark: null,
    roundNo: null,
    changedBy: user._id
  });
  // notify faculty chair TODO: implement proper user selection
  await createNotification({
    userId: user._id,
    proposalId: proposal._id,
    channel: 'in_app',
    eventKey: 'proposal.submitted',
    title: 'New proposal submitted',
    message: `Proposal ${proposal.proposalCode || proposal._id} was submitted`,
    payload: {}
  });
  return proposal;
}

async function changeProposalStatus(id, toStatus, remark, user) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new Error('Proposal not found');
  const fromStatus = proposal.currentStatus;
  let allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
  const submittedReviewCount = await ProposalReview.countDocuments({
    proposalId: proposal._id,
    reviewStatus: 'submitted'
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

  // Only update status-related fields; avoid overwriting unrelated fields (e.g. committeeIds)
  const updates = {
    currentStatus: toStatus,
    updatedBy: user._id
  };
  const now = new Date();
  // Terminal states (approved, rejected, announced) should generally not move backward unless explicitly allowed by business rules
  switch (toStatus) {
    case STATUS.FACULTY_APPROVED:
      updates.facultyApprovedAt = now;
      break;
    case STATUS.OFFICE_RECEIVED:
      updates.officeReceivedAt = now;
      break;
    case STATUS.REVISION_REQUESTED:
      updates.requiresRevision = true;
      break;
    case STATUS.RESUBMITTED:
      updates.requiresRevision = false;
      break;
    case STATUS.SECOND_ROUND_REVIEW:
      updates.currentRound = 2;
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

  await createStatusLog({
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
    [STATUS.ASSIGNED_TO_COMMITTEE, STATUS.UNDER_REVIEW, STATUS.MEETING_COMPLETED].includes(toStatus) &&
    Array.isArray(updatedProposal.committeeIds)
  ) {
    updatedProposal.committeeIds.forEach((committeeId) => recipientIds.add(String(committeeId)));
  }

  const notificationTitleMap = {
    [STATUS.REVISION_REQUESTED]: 'มีคำขอแก้ไขโครงการ',
    [STATUS.APPROVED]: 'โครงการได้รับการอนุมัติ',
    [STATUS.REJECTED]: 'โครงการไม่ผ่านการพิจารณา',
    [STATUS.ANNOUNCED]: 'มีการประกาศผลโครงการ',
    [STATUS.ASSIGNED_TO_COMMITTEE]: 'มีการมอบหมายคณะกรรมการ',
    [STATUS.UNDER_REVIEW]: 'โครงการเข้าสู่ขั้นตอนการพิจารณา',
    [STATUS.MEETING_COMPLETED]: 'การประชุมพิจารณาเสร็จสิ้น'
  };

  const notificationTitle = notificationTitleMap[toStatus] || 'สถานะโครงการมีการเปลี่ยนแปลง';
  const notificationMessage = `โครงการ ${updatedProposal.proposalCode || updatedProposal._id} เปลี่ยนสถานะเป็น ${toStatus}${remark ? ` (${remark})` : ''}`;

  if (recipientIds.size > 0) {
    try {
      await Notification.insertMany(
        Array.from(recipientIds).map((userId) => ({
          userId,
          proposalId: updatedProposal._id,
          channel: 'in_app',
          eventKey: toStatus === STATUS.REVISION_REQUESTED
            ? 'revision_requested'
            : (toStatus === STATUS.APPROVED ? 'approved' : (toStatus === STATUS.REJECTED ? 'rejected' : 'status_changed')),
          title: notificationTitle,
          message: notificationMessage,
          payload: {
            toStatus,
            fromStatus,
            remark: remark || ''
          },
          isRead: false,
          sentAt: new Date()
        }))
      );
    } catch (err) {
      throw new Error(`Failed to create notification records: ${err && err.message ? err.message : err}`);
    }

    const workflowEventKey =
      toStatus === STATUS.REVISION_REQUESTED
        ? 'revision_requested'
        : (toStatus === STATUS.APPROVED ? 'approved' : (toStatus === STATUS.REJECTED ? 'rejected' : null));

    if (workflowEventKey) {
      const emailResult = await sendWorkflowEventEmails({
        eventKey: workflowEventKey,
        recipientIds: Array.from(recipientIds),
        proposal: updatedProposal,
        context: {
          remarks: remark || ''
        }
      });

      if (emailResult && (emailResult.failed > 0 || emailResult.skippedReason)) {
        console.warn('[Proposal.changeStatus] Workflow email delivery issue:', {
          proposalId: String(updatedProposal._id),
          eventKey: workflowEventKey,
          skippedReason: emailResult.skippedReason || '',
          failed: emailResult.failed || 0,
          failures: emailResult.failures || []
        });
      }
    }
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
  // Prevent committee assignment to finalized proposals
  const terminalStates = [STATUS.APPROVED, STATUS.REJECTED, STATUS.ANNOUNCED];
  if (terminalStates.includes(proposal.currentStatus)) {
    throw new Error('Cannot assign committee to a finalized proposal');
  }
  // Note: Empty array allowed; policy on minimum committee size may be enforced in future
  const fromStatus = proposal.currentStatus;
  proposal.committeeIds = committeeIds;
  proposal.updatedBy = user._id;
  let statusChanged = false;
  if (![STATUS.ASSIGNED_TO_COMMITTEE, STATUS.UNDER_REVIEW].includes(proposal.currentStatus)) {
    proposal.currentStatus = STATUS.ASSIGNED_TO_COMMITTEE;
    statusChanged = true;
  }
  await proposal.save();

  // log status change or assignment action
  if (statusChanged) {
    await createStatusLog({
      proposalId: proposal._id,
      fromStatus,
      toStatus: STATUS.ASSIGNED_TO_COMMITTEE,
      actionKey: 'status_change',
      remark: null,
      roundNo: null,
      changedBy: user._id
    });
  } else {
    await createStatusLog({
      proposalId: proposal._id,
      fromStatus,
      toStatus: fromStatus,
      actionKey: 'assign_committee',
      remark: null,
      roundNo: null,
      changedBy: user._id
    });
  }

  // notify each committee member
  for (const reviewerId of committeeIds) {
    await createNotification({
      userId: reviewerId,
      proposalId: proposal._id,
      channel: 'in_app',
      eventKey: 'committee_assigned',
      title: 'ได้รับมอบหมายให้พิจารณาโครงการ',
      message: `กรุณาตรวจสอบโครงการ ${proposal.proposalCode || proposal._id}`,
      payload: {}
    });
  }

  if (committeeIds.length > 0) {
    const emailResult = await sendWorkflowEventEmails({
      eventKey: 'committee_assigned',
      recipientIds: committeeIds,
      proposal
    });

    if (emailResult && (emailResult.failed > 0 || emailResult.skippedReason)) {
      console.warn('[Proposal.assignCommittee] Workflow email delivery issue:', {
        proposalId: String(proposal._id),
        eventKey: 'committee_assigned',
        skippedReason: emailResult.skippedReason || '',
        failed: emailResult.failed || 0,
        failures: emailResult.failures || []
      });
    }
  }

  return proposal;
}

async function saveReview(proposalId, payload, user) {
  const {
    roundNo = 1,
    commentItems,
    scoreItems,
    decision,
    summaryComment,
    totalScore,
    isSubmit
  } = payload;
  if (!user || !user._id) throw new Error('Unauthorized');

  const round = parseInt(roundNo, 10) || 1;
  const filter = { proposalId, reviewerUserId: user._id, roundNo: round };

  // Access control: committee can only review proposals they are assigned to.
  if (user.role === 'committee') {
    const proposal = await Proposal.findById(proposalId).select('_id committeeIds').lean();
    if (!proposal) throw new Error('Proposal not found');
    const committeeIds = Array.isArray(proposal.committeeIds) ? proposal.committeeIds.map(String) : [];
    if (!committeeIds.includes(String(user._id))) {
      throw new Error('Forbidden');
    }
  }

  const existing = await ProposalReview.findOne(filter).select('_id reviewStatus submittedAt').lean();
  if (existing && existing.reviewStatus === 'submitted') {
    // One submission per reviewer per proposal/round (no resubmission).
    throw new Error('REVIEW_ALREADY_SUBMITTED');
  }

  const nextStatus = isSubmit === true
    ? 'submitted'
    : (existing && existing.reviewStatus ? existing.reviewStatus : 'in_progress');

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

  if (nextStatus === 'submitted') {
    update.submittedAt = new Date();
  }

  const review = await ProposalReview.findOneAndUpdate(filter, update, { upsert: true, new: true });
  return review;
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

async function getProposalReviews(proposalId, query = {}) {
  const filter = { proposalId };
  const round = parseInt(query.roundNo, 10);
  if (!Number.isNaN(round) && round > 0) filter.roundNo = round;

  return ProposalReview.find(filter)
    .populate('reviewerUserId', 'fullName email role')
    .sort({ roundNo: 1, submittedAt: -1, updatedAt: -1 });
}

async function getProposalFeedback(proposalId, user) {
  const proposal = await Proposal.findById(proposalId)
    .select('_id applicantUserId currentStatus currentRound');
  if (!proposal) throw new Error('Proposal not found');

  if (user && user.role === 'researcher' && String(proposal.applicantUserId) !== String(user._id)) {
    throw new Error('Forbidden');
  }

  const activeRoundNo = Number(proposal.currentRound) === 2 ? 2 : 1;

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
      reviewStatus: 'submitted'
    })
      .populate('reviewerUserId', 'fullName email role')
      .sort({ submittedAt: -1, updatedAt: -1 })
  ]);

  return {
    proposalId: proposal._id,
    currentStatus: proposal.currentStatus,
    currentRound: activeRoundNo,
    latestDecision: latestDecisionLog ? {
      toStatus: latestDecisionLog.toStatus,
      remark: latestDecisionLog.remark || '',
      roundNo: latestDecisionLog.roundNo || null,
      changedAt: latestDecisionLog.createdAt,
      changedBy: latestDecisionLog.changedBy || null
    } : null,
    committeeReviews: (reviews || []).map(r => ({
      _id: r._id,
      roundNo: r.roundNo || 1,
      reviewerUserId: r.reviewerUserId || null,
      decision: r.decision || null,
      summaryComment: r.summaryComment || '',
      commentItems: Array.isArray(r.commentItems) ? r.commentItems : [],
      scoreItems: Array.isArray(r.scoreItems) ? r.scoreItems : [],
      totalScore: r.totalScore,
      submittedAt: r.submittedAt || r.updatedAt || null,
      updatedAt: r.updatedAt || null,
      reviewStatus: r.reviewStatus || ''
    }))
  };
}

async function getCommitteeUsers(query = {}) {
  try {
    const filter = {
      role: 'committee',
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
  saveReview,
  getMyReview,
  getMyReviews,
  getProposalReviews,
  getProposalFeedback,
  getCommitteeUsers,
  getDashboardSummary,
  createStatusLog,
  createNotification
};
