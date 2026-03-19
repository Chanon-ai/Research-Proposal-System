const express = require('express');
const controller = require('../controllers/user.controller');
const { authenticate, requireRole } = require('../../../../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.get('/', requireRole('admin', 'chairman'), controller.list);
router.post('/', requireRole('admin', 'chairman'), controller.create);
router.get('/:id', requireRole('admin', 'chairman'), controller.getById);
router.put('/:id', requireRole('admin', 'chairman'), controller.update);
router.patch('/:id/toggle-active', requireRole('admin', 'chairman'), controller.toggleActive);
router.patch('/:id/status', requireRole('admin', 'chairman'), controller.updateStatus);
router.patch('/:id/reset-password', requireRole('admin', 'chairman'), controller.resetPassword);
router.delete('/:id', requireRole('admin', 'chairman'), controller.remove);

module.exports = router;
