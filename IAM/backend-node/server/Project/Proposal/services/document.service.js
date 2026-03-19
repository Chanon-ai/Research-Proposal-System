const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Proposal = require('../models/Proposal');
const Document = require('../models/Document');

const DOCUMENT_PUBLIC_DIR = path.resolve(__dirname, '../../../../public/uploads/documents');

function ensureDocumentDir() {
  fs.mkdirSync(DOCUMENT_PUBLIC_DIR, { recursive: true });
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toDocumentDto(doc) {
  const row = doc && doc.toObject ? doc.toObject() : { ...(doc || {}) };
  const proposal = row && row.proposalId && typeof row.proposalId === 'object' ? row.proposalId : null;
  const uploader = row && row.uploadedByUserId && typeof row.uploadedByUserId === 'object' ? row.uploadedByUserId : null;

  return {
    _id: row._id,
    proposalId: proposal && proposal._id ? proposal._id : row.proposalId,
    proposalCode: proposal && proposal.proposalCode ? proposal.proposalCode : '',
    projectTitleTh: proposal && proposal.projectTitleTh ? proposal.projectTitleTh : '',
    documentType: row.documentType || '',
    version: row.version || 1,
    fileName: row.fileName || row.originalName || '',
    originalName: row.originalName || '',
    mimeType: row.mimeType || '',
    fileSize: row.fileSize || 0,
    filePath: row.filePath || '',
    note: row.note || '',
    uploadedBy: uploader ? (uploader.fullName || uploader.email || '-') : '-',
    uploadedAt: row.uploadedAt || row.createdAt || null
  };
}

async function buildDocumentFilter(query = {}) {
  const filter = {
    isDeleted: { $ne: true },
    isLatest: true
  };

  if (query.documentType) {
    filter.documentType = String(query.documentType).trim();
  }

  const keyword = String(query.keyword || '').trim();
  if (keyword) {
    const regex = new RegExp(escapeRegex(keyword), 'i');
    const proposalIds = await Proposal.find({
      isDeleted: { $ne: true },
      $or: [
        { proposalCode: regex },
        { projectTitleTh: regex },
        { projectTitleEn: regex }
      ]
    }).distinct('_id');

    filter.$or = [
      { fileName: regex },
      { originalName: regex },
      { note: regex }
    ];

    if (proposalIds.length > 0) {
      filter.$or.push({ proposalId: { $in: proposalIds } });
    }
  }

  return filter;
}

function normalizePagination(query = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 200);
  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
}

async function listDocuments(query = {}) {
  const filter = await buildDocumentFilter(query);
  const { page, limit, skip } = normalizePagination(query);

  const [documents, total] = await Promise.all([
    Document.find(filter)
      .populate('proposalId', 'proposalCode projectTitleTh')
      .populate('uploadedByUserId', 'fullName email')
      .sort({ uploadedAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit),
    Document.countDocuments(filter)
  ]);

  const items = (documents || []).map(toDocumentDto);

  return {
    documents: items,
    items,
    data: items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}

async function uploadDocument({ proposalId, documentType, note, file, user }) {
  ensureDocumentDir();

  const proposal = await Proposal.findOne({ _id: proposalId, isDeleted: { $ne: true } });
  if (!proposal) throw new Error('Proposal not found');
  if (!file) throw new Error('Document file is required');

  const latest = await Document.findOne({
    proposalId,
    documentType,
    isDeleted: { $ne: true }
  }).sort({ version: -1, _id: -1 });

  if (latest && latest.isLatest) {
    latest.isLatest = false;
    await latest.save();
  }

  const versionGroup = latest && latest.versionGroup
    ? latest.versionGroup
    : new mongoose.Types.ObjectId().toHexString();
  const version = latest && latest.version ? latest.version + 1 : 1;

  const row = new Document({
    proposalId,
    documentType,
    versionGroup,
    version,
    isLatest: true,
    fileName: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype || '',
    fileSize: file.size || 0,
    filePath: `/uploads/documents/${file.filename}`,
    storagePath: file.path,
    note: note || '',
    uploadedByUserId: user && user._id ? user._id : null,
    uploadedAt: new Date()
  });

  const saved = await row.save();
  const populated = await Document.findById(saved._id)
    .populate('proposalId', 'proposalCode projectTitleTh')
    .populate('uploadedByUserId', 'fullName email');

  return toDocumentDto(populated);
}

async function updateDocument(id, payload = {}) {
  const row = await Document.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!row) throw new Error('Document not found');

  if (payload.documentType !== undefined) row.documentType = payload.documentType;
  if (payload.note !== undefined) row.note = payload.note;

  await row.save();

  const populated = await Document.findById(row._id)
    .populate('proposalId', 'proposalCode projectTitleTh')
    .populate('uploadedByUserId', 'fullName email');

  return toDocumentDto(populated);
}

async function deleteDocument(id) {
  const row = await Document.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!row) throw new Error('Document not found');

  row.isDeleted = true;
  row.isLatest = false;
  row.deletedAt = new Date();
  await row.save();

  const previous = await Document.findOne({
    versionGroup: row.versionGroup,
    isDeleted: { $ne: true },
    _id: { $ne: row._id }
  }).sort({ version: -1, _id: -1 });

  if (previous) {
    previous.isLatest = true;
    await previous.save();
  }

  return true;
}

async function getDocumentVersions(id) {
  const row = await Document.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!row) throw new Error('Document not found');

  const rows = await Document.find({
    versionGroup: row.versionGroup,
    isDeleted: { $ne: true }
  })
    .populate('proposalId', 'proposalCode projectTitleTh')
    .populate('uploadedByUserId', 'fullName email')
    .sort({ version: -1, _id: -1 });

  return (rows || []).map(toDocumentDto);
}

module.exports = {
  DOCUMENT_PUBLIC_DIR,
  ensureDocumentDir,
  listDocuments,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getDocumentVersions
};
