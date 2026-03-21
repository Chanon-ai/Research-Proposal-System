const express = require('express');
const controller = require('../controllers/meeting.controller');
const { authenticate, requireRole } = require('../../../../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.get('/summary', requireRole('admin', 'chairman', 'committee', 'researcher'), controller.summary);
router.get('/', requireRole('admin', 'chairman', 'committee', 'researcher'), controller.list);
router.post('/', requireRole('admin', 'chairman'), controller.create);
router.put('/:id/minutes', requireRole('admin', 'chairman'), controller.updateMinutes);
router.patch('/:id/status', requireRole('admin', 'chairman'), controller.updateStatus);
router.put('/:id', requireRole('admin', 'chairman'), controller.update);
router.delete('/:id', requireRole('admin', 'chairman'), controller.remove);

module.exports = router;
