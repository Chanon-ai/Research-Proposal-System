// proposal.controller.js
// Handles HTTP requests and delegates to service layer

const mongoose = require('mongoose');
const service = require('../services/proposal.service');
const formFileService = require('../services/proposalFormFile.service');

function jsonResponse(res, { success = true, message = '', data = null, meta = null }) {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  if (meta !== null) payload.meta = meta;
  return res.json(payload);
}

function getUserFromReq(req) {
  if (req.user) return req.user;
  // Dev-shortcut fallback user so endpoints work without JWT/auth.
  return { _id: new mongoose.Types.ObjectId('000000000000000000000001'), role: 'admin' };
}

exports.create = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const proposal = await service.createProposal(req.body, user);
    return jsonResponse(res, { success: true, message: 'Proposal created', data: proposal });
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const result = await service.getProposalList(req.query, user);
    return jsonResponse(res, { success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const proposal = await service.getProposalById(req.params.id, user);
    if (!proposal) return res.status(404).json({ success: false, message: 'Not found' });
    return jsonResponse(res, { success: true, data: proposal });
  } catch (err) {
    next(err);
  }
};

exports.updateDraft = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const proposal = await service.updateDraftProposal(req.params.id, req.body, user);
    return jsonResponse(res, { success: true, message: 'Draft updated', data: proposal });
  } catch (err) {
    next(err);
  }
};

exports.deleteDraft = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const proposal = await service.deleteDraftProposal(req.params.id, user);
    return jsonResponse(res, { success: true, message: 'Draft deleted', data: proposal });
  } catch (err) {
    if (err && err.message === 'Forbidden') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next(err);
  }
};

exports.submit = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const proposal = await service.submitProposal(req.params.id, user);
    return jsonResponse(res, { success: true, message: 'Proposal submitted', data: proposal });
  } catch (err) {
    next(err);
  }
};

exports.resubmit = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const proposal = await service.resubmitProposal(req.params.id, user);
    return jsonResponse(res, { success: true, message: 'Proposal resubmitted', data: proposal });
  } catch (err) {
    if (err && err.message === 'Forbidden') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next(err);
  }
};

exports.changeStatus = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    console.log('[Proposal.changeStatus] method:', req.method);
    console.log('[Proposal.changeStatus] url:', req.originalUrl);
    console.log('[Proposal.changeStatus] proposalId:', req.params.id);
    console.log('[Proposal.changeStatus] body:', req.body);
    console.log('[Proposal.changeStatus] role:', user && user.role);
    console.log('[Proposal.changeStatus] email:', user && user.email);

    const { toStatus, remark } = req.body;
    const proposal = await service.changeProposalStatus(req.params.id, toStatus, remark, user);
    return jsonResponse(res, { success: true, message: 'Status changed', data: proposal });
  } catch (err) {
    next(err);
  }
};

exports.assignCommittee = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const { committeeIds } = req.body;
    const proposal = await service.assignCommittee(req.params.id, committeeIds, user);
    return jsonResponse(res, { success: true, message: 'Committee assigned', data: proposal });
  } catch (err) {
    next(err);
  }
};

exports.saveReview = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const review = await service.saveReview(req.params.id, req.body, user);
    return jsonResponse(res, { success: true, message: 'Review saved', data: review });
  } catch (err) {
    next(err);
  }
};

exports.myReview = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const roundNo = req.query && req.query.roundNo ? req.query.roundNo : 1;
    const review = await service.getMyReview(req.params.id, roundNo, user);
    return jsonResponse(res, { success: true, data: review });
  } catch (err) {
    next(err);
  }
};

exports.myReviews = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const result = await service.getMyReviews(req.query || {}, user);
    return jsonResponse(res, { success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.listProposalReviews = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const reviews = await service.getProposalReviews(req.params.id, req.query || {});
    return jsonResponse(res, { success: true, data: reviews });
  } catch (err) {
    next(err);
  }
};

exports.proposalFeedback = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const feedback = await service.getProposalFeedback(req.params.id, user);
    return jsonResponse(res, { success: true, data: feedback });
  } catch (err) {
    if (err && err.message === 'Forbidden') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next(err);
  }
};

exports.listCommitteeUsers = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const rows = await service.getCommitteeUsers(req.query || {});
    return jsonResponse(res, { success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.dashboardSummary = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const summary = await service.getDashboardSummary(user);
    return jsonResponse(res, { success: true, data: summary });
  } catch (err) {
    next(err);
  }
};

// ResearchForm attachments: store binary in MongoDB (GridFS) and keep metadata in formSnapshotJson.files
exports.uploadFormFile = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const row = await formFileService.uploadFormFile({
      proposalId: req.params.id,
      file: req.file,
      type: req.body && req.body.type,
      note: req.body && req.body.note,
      user
    });
    return jsonResponse(res, { success: true, message: 'File uploaded', data: row });
  } catch (err) {
    if (err && err.message === 'Forbidden') return res.status(403).json({ success: false, message: 'Forbidden' });
    if (err && err.message === 'Unauthorized') return res.status(401).json({ success: false, message: 'Unauthorized' });
    next(err);
  }
};

exports.listFormFiles = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const rows = await formFileService.listFormFiles({ proposalId: req.params.id, user });
    return jsonResponse(res, { success: true, data: rows });
  } catch (err) {
    if (err && err.message === 'Forbidden') return res.status(403).json({ success: false, message: 'Forbidden' });
    if (err && err.message === 'Unauthorized') return res.status(401).json({ success: false, message: 'Unauthorized' });
    next(err);
  }
};

exports.downloadFormFile = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const fileDoc = await formFileService.getFormFileDoc({
      proposalId: req.params.id,
      fileId: req.params.fileId,
      user
    });

    const bucket = new (require('mongodb').GridFSBucket)(mongoose.connection.db, {
      bucketName: formFileService.BUCKET_NAME
    });

    const md = (fileDoc && fileDoc.metadata) || {};
    const originalName = md.originalName || fileDoc.filename || 'file';
    const contentType = fileDoc.contentType || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);

    return bucket.openDownloadStream(fileDoc._id).pipe(res);
  } catch (err) {
    if (err && err.message === 'Forbidden') return res.status(403).json({ success: false, message: 'Forbidden' });
    if (err && err.message === 'Unauthorized') return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (err && err.message === 'File not found') return res.status(404).json({ success: false, message: 'Not found' });
    next(err);
  }
};

exports.deleteFormFile = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const result = await formFileService.deleteFormFile({
      proposalId: req.params.id,
      fileId: req.params.fileId,
      user
    });
    return jsonResponse(res, { success: true, message: 'File deleted', data: result });
  } catch (err) {
    if (err && err.message === 'Forbidden') return res.status(403).json({ success: false, message: 'Forbidden' });
    if (err && err.message === 'Unauthorized') return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (err && err.message === 'File not found') return res.status(404).json({ success: false, message: 'Not found' });
    next(err);
  }
};
