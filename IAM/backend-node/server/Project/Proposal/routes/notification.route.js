const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../../../middleware/authMiddleware');
const Notification = require('../models/Notification');
const Proposal = require('../models/Proposal');
const User = require('../../Auth/models/User');
const { sendAdminNotificationEmails } = require('../services/workflow-notification.service');

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

    console.log('[Notification.send] route hit', {
      actorId: req && req.user && req.user._id ? String(req.user._id) : null,
      recipientType,
      recipientCount: Array.isArray(recipientIds) ? recipientIds.length : 0,
      type,
      proposalId: proposalId || null
    });

    let targetUserIds = [];

    if (recipientType === 'specific') {
      const users = await User.find({
        _id: { $in: Array.isArray(recipientIds) ? recipientIds : [] },
        isActive: true,
        isDeleted: { $ne: true }
      }).select('_id');
      targetUserIds = users.map(u => u._id);
    } else if (recipientType === 'all_researchers') {
      const users = await User.find({ role: 'researcher', isActive: true, isDeleted: { $ne: true } }).select('_id');
      targetUserIds = users.map(u => u._id);
    } else if (recipientType === 'all_committee') {
      const users = await User.find({ role: { $in: ['committee', 'chairman', 'office_chairman'] }, isActive: true, isDeleted: { $ne: true } }).select('_id');
      targetUserIds = users.map(u => u._id);
    } else if (recipientType === 'all_users') {
      const users = await User.find({ isActive: true, isDeleted: { $ne: true } }).select('_id');
      targetUserIds = users.map(u => u._id);
    }

    if (!targetUserIds.length) {
      return res.status(400).json({ success: false, message: 'ไม่พบผู้รับแจ้งเตือน' });
    }

    const uniqueTargetUserIds = Array.from(new Set(targetUserIds.map((id) => String(id))));
    console.log('[Notification.send] recipients resolved', { resolvedCount: uniqueTargetUserIds.length });

    const notifications = await Notification.insertMany(
      uniqueTargetUserIds.map(userId => ({
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

    let proposal = null;
    if (proposalId) {
      proposal = await Proposal.findOne({ _id: proposalId, isDeleted: { $ne: true } })
        .select('_id proposalCode projectTitleTh')
        .lean();
    }

    const emailResult = await sendAdminNotificationEmails({
      eventKey: type || 'announcement',
      recipientIds: uniqueTargetUserIds,
      proposal,
      title,
      message,
      context: {
        remarks: message
      }
    });

    console.log('[Notification.send] email service completed', {
      attempted: Boolean(emailResult && emailResult.attempted),
      sent: Number(emailResult && emailResult.sent ? emailResult.sent : 0),
      failed: Number(emailResult && emailResult.failed ? emailResult.failed : 0),
      skipped: Number(emailResult && emailResult.skipped ? emailResult.skipped : 0),
      skippedReason: emailResult && emailResult.skippedReason ? emailResult.skippedReason : null
    });

    const resultSummary = emailResult && emailResult.summary ? emailResult.summary : {};
    const diagnostics = emailResult && emailResult.diagnostics ? emailResult.diagnostics : {};

    const sentCount = Number(resultSummary.emailSentCount !== undefined ? resultSummary.emailSentCount : (emailResult && emailResult.sent ? emailResult.sent : 0));
    const failedCount = Number(resultSummary.emailFailedCount !== undefined ? resultSummary.emailFailedCount : (emailResult && emailResult.failed ? emailResult.failed : 0));
    const skippedCount = Number(resultSummary.emailSkippedCount !== undefined ? resultSummary.emailSkippedCount : (emailResult && emailResult.skipped ? emailResult.skipped : 0));
    const failures = Array.isArray(diagnostics.failedRecipients)
      ? diagnostics.failedRecipients
      : (Array.isArray(emailResult && emailResult.failures) ? emailResult.failures : []);
    const skippedRecipients = Array.isArray(diagnostics.skippedRecipients)
      ? diagnostics.skippedRecipients
      : (Array.isArray(emailResult && emailResult.skippedRecipients) ? emailResult.skippedRecipients : []);
    const skippedReason = diagnostics.skippedReason || (emailResult && emailResult.skippedReason ? emailResult.skippedReason : null);
    const reasons = Array.isArray(diagnostics.reasons) ? diagnostics.reasons : [];

    const summary = {
      inAppCount: notifications.length,
      emailSentCount: sentCount,
      emailFailedCount: failedCount,
      emailSkippedCount: skippedCount
    };

    let responseMessage = `ส่งแจ้งเตือนในระบบสำเร็จ ${notifications.length} คน`;
    if (failedCount > 0 || skippedCount > 0) {
      responseMessage += ` | อีเมลสำเร็จ ${sentCount}`;
      if (failedCount > 0) responseMessage += ` | ล้มเหลว ${failedCount}`;
      if (skippedCount > 0) responseMessage += ` | ข้าม ${skippedCount}`;
      if (skippedReason) responseMessage += ` (เหตุผลหลัก: ${skippedReason})`;
    } else {
      responseMessage += ` | อีเมลส่งสำเร็จ ${sentCount}`;
    }

    return res.json({
      success: true,
      message: responseMessage,
      summary,
      diagnostics: {
        failedRecipients: failures,
        skippedRecipients,
        skippedReason,
        reasons
      },
      data: {
        notifications,
        emailLogs: Array.isArray(emailResult && emailResult.emailLogs) ? emailResult.emailLogs : [],
        inAppCreated: true,
        inAppCount: notifications.length,
        inAppNotificationIds: notifications.map((item) => item && item._id ? String(item._id) : null).filter(Boolean),
        emailAttempted: Boolean(emailResult && emailResult.attempted),
        emailSentCount: sentCount,
        emailFailedCount: failedCount,
        emailSkippedCount: skippedCount,
        failedRecipients: failures,
        skippedRecipients,
        skippedReason
      },
      items: notifications.map((item) => item && item._id ? String(item._id) : null).filter(Boolean)
    });
  } catch (err) {
    console.error('[Notification.send] unexpected error', err && err.message ? err.message : err);
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
