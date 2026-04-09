'use strict';

const crypto = require('crypto');
const path = require('path');
const mongoose = require('mongoose');

const BUCKET_NAME = 'setting_files';
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]);

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
  } catch (_) {
    return null;
  }
}

function buildStoredName(originalName) {
  const ext = path.extname(originalName || '') || '';
  const token = crypto.randomBytes(16).toString('hex');
  return `${Date.now()}_${token}${ext}`;
}

function isAllowedExampleFile(file) {
  if (!file) return false;
  const ext = String(path.extname(file.originalname || '') || '').trim().toLowerCase();
  const mimeType = String(file.mimetype || '').trim().toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext) || ALLOWED_MIME_TYPES.has(mimeType);
}

function toSettingFileDto(fileDoc) {
  const metadata = (fileDoc && fileDoc.metadata) || {};
  const originalName = metadata.originalName || fileDoc.filename || 'file';
  return {
    fileId: String(fileDoc._id),
    originalName,
    fileName: originalName,
    mimeType: fileDoc.contentType || metadata.mimeType || '',
    size: fileDoc.length || metadata.size || 0,
    uploadedAt: fileDoc.uploadDate || metadata.uploadedAt || null
  };
}

async function uploadBudgetAttachmentExampleFile({ file, user }) {
  if (!file || !file.buffer) throw new Error('File is required');
  if (!isAllowedExampleFile(file)) {
    throw new Error('รองรับเฉพาะไฟล์ PDF, Word, Excel หรือ PowerPoint');
  }

  const bucket = getBucket();
  const storedName = buildStoredName(file.originalname);
  const metadata = {
    usage: 'budget_attachment_example',
    uploadedByUserId: asObjectId(user && user._id),
    originalName: file.originalname || storedName,
    mimeType: file.mimetype || '',
    size: file.size || (file.buffer ? file.buffer.length : 0),
    uploadedAt: new Date()
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

  return toSettingFileDto(fileDoc);
}

async function getSettingFileDoc({ fileId }) {
  const normalizedId = asObjectId(fileId);
  if (!normalizedId) throw new Error('Invalid file id');
  const filesCol = mongoose.connection.db.collection(`${BUCKET_NAME}.files`);
  const fileDoc = await filesCol.findOne({ _id: normalizedId });
  if (!fileDoc) throw new Error('File not found');
  return fileDoc;
}

async function deleteSettingFile({ fileId }) {
  const normalizedId = asObjectId(fileId);
  if (!normalizedId) throw new Error('Invalid file id');
  await getSettingFileDoc({ fileId: normalizedId });
  const bucket = getBucket();
  await bucket.delete(normalizedId);
  return true;
}

module.exports = {
  BUCKET_NAME,
  uploadBudgetAttachmentExampleFile,
  getSettingFileDoc,
  deleteSettingFile,
  isAllowedExampleFile,
  toSettingFileDto
};