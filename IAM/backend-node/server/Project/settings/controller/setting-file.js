'use strict';

const mongoose = require('mongoose');
const settingFileService = require('../service/setting-file');

function handleError(res, err, fallbackStatus = 400) {
  const message = err && err.message ? err.message : 'Unexpected error';
  const status = /not found/i.test(message) ? 404 : fallbackStatus;
  return res.status(status).json({ success: false, message });
}

exports.uploadBudgetAttachmentExampleFile = async (req, res) => {
  try {
    const row = await settingFileService.uploadBudgetAttachmentExampleFile({
      file: req.file,
      user: req.user || null
    });
    return res.status(201).json({ success: true, data: row });
  } catch (err) {
    return handleError(res, err, 400);
  }
};

exports.downloadFile = async (req, res, next) => {
  try {
    const fileDoc = await settingFileService.getSettingFileDoc({ fileId: req.params.fileId });

    if (!mongoose.mongo || !mongoose.mongo.GridFSBucket) {
      throw new Error('GridFSBucket is unavailable from mongoose driver');
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: settingFileService.BUCKET_NAME
    });

    const metadata = (fileDoc && fileDoc.metadata) || {};
    const originalName = metadata.originalName || fileDoc.filename || 'file';
    const contentType = fileDoc.contentType || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);

    return bucket.openDownloadStream(fileDoc._id).pipe(res);
  } catch (err) {
    if (err && err.message === 'File not found') {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    return next(err);
  }
};

exports.deleteFile = async (req, res) => {
  try {
    await settingFileService.deleteSettingFile({ fileId: req.params.fileId });
    return res.json({ success: true });
  } catch (err) {
    return handleError(res, err, 400);
  }
};