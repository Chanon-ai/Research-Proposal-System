const express = require('express');
const path = require('path');
const multer = require('multer');
const controller = require('../controllers/document.controller');
const { authenticate, requireRole } = require('../../../../middleware/authMiddleware');
const { DOCUMENT_PUBLIC_DIR, ensureDocumentDir } = require('../services/document.service');

const router = express.Router();

ensureDocumentDir();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, DOCUMENT_PUBLIC_DIR);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || '');
    const base = path.basename(file.originalname || 'document', ext)
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'document';
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.use(authenticate);
router.get('/', requireRole('admin', 'chairman'), controller.list);
router.post('/upload', requireRole('admin', 'chairman'), upload.single('file'), controller.upload);
router.get('/:id/versions', requireRole('admin', 'chairman'), controller.versions);
router.put('/:id', requireRole('admin', 'chairman'), controller.update);
router.delete('/:id', requireRole('admin', 'chairman'), controller.remove);

module.exports = router;
