const fs = require('fs');
const documentService = require('../services/document.service');

function isPdfUpload(file) {
  if (!file) return false;
  const originalName = String(file.originalname || '').trim().toLowerCase();
  const mimeType = String(file.mimetype || '').trim().toLowerCase();
  return originalName.endsWith('.pdf') || mimeType === 'application/pdf';
}

function cleanupUploadedFile(file) {
  if (!file || !file.path) return;
  try {
    fs.unlinkSync(file.path);
  } catch (_) {
    // Ignore cleanup errors for invalid uploads.
  }
}

function handleError(res, err, fallbackStatus = 400) {
  const message = err && err.message ? err.message : 'Unexpected error';
  const status = /not found/i.test(message) ? 404 : fallbackStatus;
  return res.status(status).json({ success: false, message });
}

exports.list = async (req, res) => {
  try {
    const result = await documentService.listDocuments(req.query || {});
    return res.json({ success: true, data: result });
  } catch (err) {
    return handleError(res, err, 500);
  }
};

exports.upload = async (req, res) => {
  try {
    const { proposalId, documentType, note } = req.body || {};
    if (!proposalId || !documentType) {
      return res.status(400).json({ success: false, message: 'กรุณาเลือกโครงการและประเภทเอกสาร' });
    }
    if (!req.file || !isPdfUpload(req.file)) {
      cleanupUploadedFile(req.file);
      return res.status(400).json({ success: false, message: 'รองรับเฉพาะไฟล์ PDF' });
    }

    const row = await documentService.uploadDocument({
      proposalId,
      documentType,
      note,
      file: req.file,
      user: req.user
    });

    return res.status(201).json({ success: true, data: row });
  } catch (err) {
    return handleError(res, err, 400);
  }
};

exports.update = async (req, res) => {
  try {
    const row = await documentService.updateDocument(req.params.id, req.body || {});
    return res.json({ success: true, data: row });
  } catch (err) {
    return handleError(res, err, 400);
  }
};

exports.remove = async (req, res) => {
  try {
    await documentService.deleteDocument(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return handleError(res, err, 400);
  }
};

exports.versions = async (req, res) => {
  try {
    const rows = await documentService.getDocumentVersions(req.params.id);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return handleError(res, err, 400);
  }
};
