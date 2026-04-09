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

function shouldHideEvaluationEditRequestForUser(user) {
  return !!(user && user.role === 'chairman');
}

function buildScopedNotificationQuery(user, type) {
  const adminScope = isAdminScope(user);
  const query = adminScope ? {} : { userId: user._id };
  const hiddenForUser = shouldHideEvaluationEditRequestForUser(user);
  const normalizedType = String(type || '').trim().toLowerCase();

  if (hiddenForUser) {
    if (normalizedType === 'evaluation_edit_request') {
      return null;
    }
    if (!normalizedType) {
      query.eventKey = { $ne: 'evaluation_edit_request' };
      return query;
    }
  }

  if (normalizedType) {
    query.eventKey = normalizedType;
  }

  return query;
}

function requesterRoleLabel(role) {
  const normalized = String(role || '').trim().toLowerCase();
  if (normalized === 'chairman') return 'ประธานสำนัก';
  if (normalized === 'finance_officer') return 'เจ้าหน้าที่การเงิน';
  if (normalized === 'committee') return 'กรรมการ';
  return normalized || 'ผู้ใช้งาน';
}

function toNotificationDto(notification) {
  const row = notification && notification.toObject ? notification.toObject() : { ...(notification || {}) };
  const user = row && row.userId && typeof row.userId === 'object' ? row.userId : null;
  const proposal = row && row.proposalId && typeof row.proposalId === 'object' ? row.proposalId : null;
  const proposalId = proposal && proposal._id
    ? String(proposal._id)
    : (row && row.proposalId ? String(row.proposalId) : null);

  return {
    ...row,
    userId: user && user._id ? String(user._id) : (row && row.userId ? String(row.userId) : null),
    proposalId,
    type: row.eventKey,
    recipientName: user ? (user.fullName || user.email || '-') : '',
    recipientEmail: user ? (user.email || '') : '',
    proposalCode: proposal ? (proposal.proposalCode || '') : '',
    proposalTitle: proposal ? (proposal.projectTitleTh || '') : '',
    proposal: proposalId
      ? {
          _id: proposalId,
          proposalCode: proposal ? (proposal.proposalCode || '') : '',
          projectTitleTh: proposal ? (proposal.projectTitleTh || '') : ''
        }
      : null
  };
}

// GET /api/v1/notifications
// Query: { page=1, limit=15, isRead, type }
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const { isRead, type } = req.query;

    const query = buildScopedNotificationQuery(req.user, type);
    if (!query) {
      return res.json({
        success: true,
        data: {
          notifications: [],
          total: 0,
          page,
          totalPages: 0
        }
      });
    }
    if (isRead !== undefined) query.isRead = String(isRead) === 'true';

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

// POST /api/v1/notifications/request-evaluation-edit
router.post('/request-evaluation-edit', authenticate, requireRole('committee', 'chairman', 'finance_officer'), async (req, res) => {
  try {
    const proposalId = String(req.body && req.body.proposalId ? req.body.proposalId : '').trim();
    if (!proposalId) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุโครงการที่ต้องการส่งคำขอ' });
    }

    const proposal = await Proposal.findOne({ _id: proposalId, isDeleted: { $ne: true } })
      .select('_id proposalCode projectTitleTh projectTitleEn currentStatus')
      .lean();

    if (!proposal) {
      return res.status(404).json({ success: false, message: 'ไม่พบโครงการที่ต้องการส่งคำขอ' });
    }

    const admins = await User.find({ role: 'admin', isActive: true, isDeleted: { $ne: true } })
      .select('_id')
      .lean();

    if (!Array.isArray(admins) || admins.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ดูแลระบบสำหรับรับคำขอ' });
    }

    const actorName = req.user && (req.user.fullName || req.user.email || req.user.username)
      ? String(req.user.fullName || req.user.email || req.user.username)
      : 'ผู้ใช้งาน';
    const actorRole = String(req.user && req.user.role ? req.user.role : '').trim().toLowerCase();
    const actorRoleLabel = requesterRoleLabel(actorRole);
    const proposalRef = String(proposal.proposalCode || proposal.projectTitleTh || proposal.projectTitleEn || proposalId).trim();
    const title = 'มีคำขอแก้ไขผลประเมิน';
    const message = `${actorRoleLabel} ${actorName} ส่งคำขอแก้ไขผลประเมินของโครงการ ${proposalRef}`;
    const sentAt = new Date();

    const notifications = await Notification.insertMany(
      admins.map((admin) => ({
        userId: admin._id,
        proposalId: proposal._id,
        eventKey: 'evaluation_edit_request',
        channel: 'in_app',
        title,
        message,
        isRead: false,
        sentAt,
        payload: {
          senderName: actorName,
          senderRole: actorRole,
          senderRoleLabel: actorRoleLabel,
          proposalCode: proposal.proposalCode || '',
          proposalTitle: proposal.projectTitleTh || proposal.projectTitleEn || '',
          requestType: 'evaluation_edit_request',
          requestedAt: sentAt.toISOString(),
          currentStatus: proposal.currentStatus || ''
        }
      }))
    );

    return res.json({
      success: true,
      message: 'ส่งคำขอแก้ไขผลประเมินไปยังผู้ดูแลระบบแล้ว',
      data: {
        count: notifications.length,
        notificationIds: notifications.map((item) => item && item._id ? String(item._id) : null).filter(Boolean)
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
      const users = await User.find({ role: { $in: ['committee', 'chairman'] }, isActive: true, isDeleted: { $ne: true } }).select('_id');
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
    if (shouldHideEvaluationEditRequestForUser(req.user)) {
      filter.eventKey = { $ne: 'evaluation_edit_request' };
    }
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
    if (shouldHideEvaluationEditRequestForUser(req.user)) {
      filter.eventKey = { $ne: 'evaluation_edit_request' };
    }
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
    if (shouldHideEvaluationEditRequestForUser(req.user)) {
      filter.eventKey = { $ne: 'evaluation_edit_request' };
    }
    await Notification.findOneAndDelete(filter);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
