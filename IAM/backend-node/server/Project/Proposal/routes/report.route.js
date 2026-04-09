const express = require('express');
const controller = require('../controllers/report.controller');
const { authenticate, requireRole } = require('../../../../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.post('/export', requireRole('admin', 'chairman'), controller.export);
router.get('/download/:fileName', requireRole('admin', 'chairman'), controller.download);

module.exports = router;
