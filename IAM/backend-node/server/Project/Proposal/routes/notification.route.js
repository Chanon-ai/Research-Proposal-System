const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../../../middleware/authMiddleware');
const Notification = require('../models/Notification');
const User = require('../../Auth/models/User');

function isAdminScope(user) {
  return !!(user && (user.role === 'admin' || user.role === 'chairman'));
}

function toNotificationDto(notification) {
  const row = notification && notification.toObject ? notification.toObject() : { ...(notification || {}) };
  const user = row && row.userId && typeof row.userId === 'object' ? row.userId : null;
  const proposal = row && row.proposalId && typeof row.proposalId === 'object' ? row.proposalId : null;

  return {
    ...row,
    type: row.eventKey,
    recipientName: user ? (user.fullName || user.email || '-') : '',
    recipientEmail: user ? (user.email || '') : '',
    proposalCode: proposal ? (proposal.proposalCode || '') : '',
    proposalTitle: proposal ? (proposal.projectTitleTh || '') : ''
  };
}

// GET /api/v1/notifications
// Query: { page=1, limit=15, isRead, type }
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const { isRead, type } = req.query;

    const adminScope = isAdminScope(req.user);
    const query = adminScope ? {} : { userId: req.user._id };
    if (isRead !== undefined) query.isRead = String(isRead) === 'true';
    if (type) query.eventKey = type;

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .populate('userId', 'fullName email role')
      .populate('proposalId', 'proposalCode projectTitleTh')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      data: {
        notifications: (notifications || []).map(toNotificationDto),
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/notifications/send (admin only)
router.post('/send', authenticate, requireRole('admin', 'chairman'), async (req, res) => {
  try {
    const {
      recipientType,
      recipientIds = [],
      type,
      title,
      message,
      proposalId
    } = req.body || {};

    let targetUserIds = [];

    if (recipientType === 'specific') {
      targetUserIds = recipientIds;
    } else if (recipientType === 'all_researchers') {
      const users = await User.find({ role: 'researcher', isActive: true, isDeleted: { $ne: true } }).select('_id');
      targetUserIds = users.map(u => u._id);
    } else if (recipientType === 'all_committee') {
      const users = await User.find({ role: 'committee', isActive: true, isDeleted: { $ne: true } }).select('_id');
      targetUserIds = users.map(u => u._id);
    } else if (recipientType === 'all_users') {
      const users = await User.find({ isActive: true, isDeleted: { $ne: true } }).select('_id');
      targetUserIds = users.map(u => u._id);
    }

    if (!targetUserIds.length) {
      return res.status(400).json({ success: false, message: 'ไม่พบผู้รับแจ้งเตือน' });
    }

    const notifications = await Notification.insertMany(
      targetUserIds.map(userId => ({
        userId,
        eventKey: type || 'announcement',
        channel: 'in_app',
        title,
        message,
        proposalId: proposalId || null,
        isRead: false,
        sentAt: new Date(),
        payload: {}
      }))
    );

    return res.json({
      success: true,
      message: `ส่งแจ้งเตือน ${notifications.length} คน`,
      data: notifications
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const filter = isAdminScope(req.user)
      ? { _id: req.params.id }
      : { _id: req.params.id, userId: req.user._id };
    await Notification.findOneAndUpdate(
      filter,
      { isRead: true, readAt: new Date() }
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/notifications/mark-all-read
router.patch('/mark-all-read', authenticate, async (req, res) => {
  try {
    const filter = isAdminScope(req.user)
      ? { isRead: false }
      : { userId: req.user._id, isRead: false };
    await Notification.updateMany(
      filter,
      { isRead: true, readAt: new Date() }
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/v1/notifications/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const filter = isAdminScope(req.user)
      ? { _id: req.params.id }
      : { _id: req.params.id, userId: req.user._id };
    await Notification.findOneAndDelete(filter);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
