'use strict';

const crypto = require('crypto');
const path = require('path');
const mongoose = require('mongoose');

const Proposal = require('../models/Proposal');

const BUCKET_NAME = 'proposal_form_files';

function getBucket() {
  const db = mongoose.connection && mongoose.connection.db;
  if (!db) throw new Error('MongoDB not connected');
  if (!mongoose.mongo || !mongoose.mongo.GridFSBucket) {
    throw new Error('GridFSBucket is unavailable from mongoose driver');
  }
  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });
}

function asObjectId(id) {
  try {
    return new mongoose.Types.ObjectId(String(id));
  } catch (e) {
    return null;
  }
}

function isChairmanRole(role) {
  return String(role || '').trim().toLowerCase() === 'chairman';
}

function hasChairmanProposalAccess(proposal = {}, userId = null) {
  const normalizedUserId = userId ? String(userId) : '';
  if (!normalizedUserId) return false;

  const assignment = proposal && proposal.chairmanAssignment && typeof proposal.chairmanAssignment === 'object'
    ? proposal.chairmanAssignment
    : {};
  const assignedChairmanIds = Array.isArray(assignment.assignedChairmanIds)
    ? assignment.assignedChairmanIds.map(String)
    : [];
  if (assignedChairmanIds.includes(normalizedUserId)) return true;

  const reviewedBy = assignment && assignment.reviewedBy ? String(assignment.reviewedBy) : '';
  return reviewedBy === normalizedUserId;
}

function hasFinanceProposalAccess(proposal = {}, userId = null) {
  const normalizedUserId = userId ? String(userId) : '';
  if (!normalizedUserId) return false;

  const assignment = proposal && proposal.financeAssignment && typeof proposal.financeAssignment === 'object'
    ? proposal.financeAssignment
    : {};
  const assignedFinanceOfficerIds = Array.isArray(assignment.assignedFinanceOfficerIds)
    ? assignment.assignedFinanceOfficerIds.map(String)
    : [];
  if (assignedFinanceOfficerIds.includes(normalizedUserId)) return true;

  const submittedBy = assignment && assignment.submittedBy ? String(assignment.submittedBy) : '';
  return submittedBy === normalizedUserId;
}

async function requireProposalAccess(proposalId, user) {
  if (!user || !user._id) throw new Error('Unauthorized');

  // Support both Mongo `_id` and human `proposalCode` in URL params.
  const asOid = asObjectId(proposalId);
  const filter = { isDeleted: { $ne: true } };
  if (asOid) {
    filter._id = asOid;
  } else {
    filter.proposalCode = String(proposalId || '');
  }

  const proposal = await Proposal.findOne(filter);
  if (!proposal) throw new Error('Proposal not found');

  const role = user.role;
  const uid = String(user._id);
  const isAdmin = role === 'admin';
  const isOwner = proposal.applicantUserId && String(proposal.applicantUserId) === uid;
  const isCommittee =
    Array.isArray(proposal.committeeIds) && proposal.committeeIds.map(String).includes(uid);
  const isChairman = isChairmanRole(role) && hasChairmanProposalAccess(proposal, uid);
  const isFinanceOfficer = role === 'finance_officer' && hasFinanceProposalAccess(proposal, uid);

  if (!isAdmin && !isOwner && !isCommittee && !isChairman && !isFinanceOfficer) throw new Error('Forbidden');
  return proposal;
}

function buildStoredName(originalName) {
  const ext = path.extname(originalName || '') || '';
  const token = crypto.randomBytes(16).toString('hex');
  return `${Date.now()}_${token}${ext}`;
}

function toSnapshotEntry(fileDoc) {
  const md = (fileDoc && fileDoc.metadata) || {};
  const uploadedAt = fileDoc.uploadDate || md.uploadedAt || null;
  return {
    fileId: String(fileDoc._id),
    name: md.originalName || fileDoc.filename || 'file',
    originalName: md.originalName || fileDoc.filename || 'file',
    mimeType: fileDoc.contentType || md.mimeType || '',
    size: fileDoc.length || md.size || 0,
    uploadedAt,
    // For existing UI compatibility (FileManagement.vue shows `datetime` column)
    datetime: uploadedAt ? new Date(uploadedAt).toLocaleString('th-TH') : '',
    type: md.type || '',
    note: md.note || ''
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

function collectSnapshotFileIds(snapshot = {}) {
  const ids = new Set();

  const add = (value) => {
    const id = normalizeFileId(value);
    if (id) ids.add(id);
  };

  const files = Array.isArray(snapshot && snapshot.files) ? snapshot.files : [];
  files.forEach((entry) => add(entry && (entry.fileId || entry.id || entry._id)));

  const rs = snapshot && snapshot.researchStandard && snapshot.researchStandard.attachments
    ? snapshot.researchStandard.attachments
    : {};
  Object.keys(rs || {}).forEach((key) => {
    const entry = rs[key];
    add(entry && (entry.fileId || entry.id || entry._id));
  });

  const budgetCategories = Array.isArray(snapshot && snapshot.budget && snapshot.budget.categories)
    ? snapshot.budget.categories
    : [];
  budgetCategories.forEach((category) => {
    const items = Array.isArray(category && category.items) ? category.items : [];
    items.forEach((item) => {
      const attachment = item && item.attachment ? item.attachment : null;
      add(attachment && (attachment.fileId || attachment.id || attachment._id));
    });
  });

  return ids;
}

async function uploadFormFile({ proposalId, file, type, note, user }) {
  const proposal = await requireProposalAccess(proposalId, user);
  if (!file || !file.buffer) throw new Error('File is required');

  const bucket = getBucket();
  const storedName = buildStoredName(file.originalname);
  const metadata = {
    // Always bind to the real Mongo `_id` even when URL used proposalCode
    proposalId: asObjectId(proposal && proposal._id),
    uploadedByUserId: asObjectId(user._id),
    originalName: file.originalname || storedName,
    mimeType: file.mimetype || '',
    size: file.size || (file.buffer ? file.buffer.length : 0),
    uploadedAt: new Date(),
    type: type || '',
    note: note || ''
  };

  const uploadStream = bucket.openUploadStream(storedName, {
    contentType: file.mimetype || 'application/octet-stream',
    metadata
  });

  const finished = new Promise((resolve, reject) => {
    uploadStream.on('finish', resolve);
    uploadStream.on('error', reject);
  });

  uploadStream.end(file.buffer);
  await finished;

  const filesCol = mongoose.connection.db.collection(`${BUCKET_NAME}.files`);
  const fileDoc = await filesCol.findOne({ _id: uploadStream.id });
  if (!fileDoc) throw new Error('Upload failed');

  const entry = toSnapshotEntry(fileDoc);
  proposal.formSnapshotJson = proposal.formSnapshotJson || {};
  const existing = Array.isArray(proposal.formSnapshotJson.files) ? proposal.formSnapshotJson.files : [];
  proposal.formSnapshotJson.files = [...existing, entry];
  proposal.updatedBy = user._id;
  await proposal.save();

  return entry;
}

async function listFormFiles({ proposalId, user }) {
  const proposal = await requireProposalAccess(proposalId, user);
  const filesCol = mongoose.connection.db.collection(`${BUCKET_NAME}.files`);
  const pid = asObjectId(proposal && proposal._id);
  const rows = await filesCol
    .find({ 'metadata.proposalId': pid })
    .sort({ uploadDate: -1, _id: -1 })
    .toArray();
  return rows.map(toSnapshotEntry);
}

async function getFormFileDoc({ proposalId, fileId, user }) {
  const proposal = await requireProposalAccess(proposalId, user);
  const filesCol = mongoose.connection.db.collection(`${BUCKET_NAME}.files`);
  const normalizedFileId = normalizeFileId(fileId);
  const fid = asObjectId(normalizedFileId);
  if (!fid) throw new Error('Invalid file id');
  const row = await filesCol.findOne({ _id: fid });
  if (!row) throw new Error('File not found');

  const pid = asObjectId(proposal && proposal._id);
  const metaPid = row.metadata && row.metadata.proposalId ? row.metadata.proposalId : null;
  if (!metaPid) {
    // Backward compatibility: early uploads might miss metadata.proposalId.
    // Allow if the proposal snapshot references this file id in any known attachment location.
    const snap = proposal && proposal.formSnapshotJson ? proposal.formSnapshotJson : {};
    const knownIds = collectSnapshotFileIds(snap);
    const inSnapshot = knownIds.has(normalizedFileId);
    if (!inSnapshot) throw new Error('Forbidden');
  } else if (String(metaPid) !== String(pid)) {
    throw new Error('Forbidden');
  }
  return row;
}

async function deleteFormFile({ proposalId, fileId, user }) {
  const proposal = await requireProposalAccess(proposalId, user);
  const fid = asObjectId(fileId);
  if (!fid) throw new Error('Invalid file id');

  // Ensure the file belongs to this proposal before deleting
  await getFormFileDoc({ proposalId, fileId, user });

  const bucket = getBucket();
  await bucket.delete(fid);

  // Keep snapshot metadata in sync (best-effort).
  try {
    proposal.formSnapshotJson = proposal.formSnapshotJson || {};
    const existing = Array.isArray(proposal.formSnapshotJson.files) ? proposal.formSnapshotJson.files : [];
    proposal.formSnapshotJson.files = existing.filter((x) => String(x && x.fileId) !== String(fileId));
    proposal.updatedBy = user._id;
    await proposal.save();
  } catch (e) {
    // ignore
  }

  return { deleted: true };
}

module.exports = {
  uploadFormFile,
  listFormFiles,
  getFormFileDoc,
  deleteFormFile,
  BUCKET_NAME
};
