const service = require('../service/system-setting');
const EmailLog = require('../models/email-log.model');

function handleError(res, err, fallbackStatus = 400) {
  const message = err && err.message ? err.message : 'Unexpected error';
  const status = /not found/i.test(message) ? 404 : fallbackStatus;
  return res.status(status).json({ success: false, message });
}

exports.list = async (req, res) => {
  try {
    const result = await service.listSettings(req.query || {});
    return res.json({ success: true, data: result.settings });
  } catch (err) {
    return handleError(res, err, 500);
  }
};

exports.create = async (req, res) => {
  try {
    const row = await service.createSetting(req.body || {}, req.user);
    return res.status(201).json({ success: true, data: row });
  } catch (err) {
    return handleError(res, err, 400);
  }
};

exports.update = async (req, res) => {
  try {
    const row = await service.updateSetting(req.params.id, req.body || {}, req.user);
    return res.json({ success: true, data: row });
  } catch (err) {
    return handleError(res, err, 400);
  }
};

exports.bulkUpdate = async (req, res) => {
  try {
    const result = await service.bulkUpsertSettings(req.body || {}, req.user);
    const hasFailures = Array.isArray(result.failedKeys) && result.failedKeys.length > 0;

    return res.status(hasFailures ? 207 : 200).json({
      success: !hasFailures,
      data: result,
      message: hasFailures
        ? 'Some settings could not be saved'
        : 'Settings saved successfully'
    });
  } catch (err) {
    return handleError(res, err, 400);
  }
};

exports.remove = async (req, res) => {
  try {
    await service.deleteSetting(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return handleError(res, err, 400);
  }
};

exports.testEmail = async (req, res) => {
  try {
    const recipientEmail = String(
      (req && req.body && req.body.recipientEmail) ||
      (req && req.user && req.user.email) ||
      ''
    ).trim();
    if (!recipientEmail) {
      return res.status(400).json({ success: false, message: 'Current user email is required for test email' });
    }

    await service.testEmail({
      recipientEmail,
      smtp: (req.body && req.body.smtp) || {},
      templateKey: String((req.body && req.body.templateKey) || '').trim(),
      senderName: String((req.body && req.body.senderName) || '').trim(),
      subject: String((req.body && req.body.subject) || '').trim(),
      message: String((req.body && req.body.message) || '').trim()
    });
    return res.json({ success: true, message: 'Test email sent successfully', data: { recipientEmail } });
  } catch (err) {
    return handleError(res, err, 400);
  }
};

exports.clearCache = async (req, res) => {
  try {
    await service.clearCache();
    return res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (err) {
    return handleError(res, err, 500);
  }
};

exports.listEmailLogs = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status && ['sent', 'failed'].includes(req.query.status)) {
      filter.status = req.query.status;
    }
    if (req.query.eventKey) {
      filter.eventKey = String(req.query.eventKey).trim();
    }

    const [logs, total] = await Promise.all([
      EmailLog.find(filter).sort({ sentAt: -1 }).skip(skip).limit(limit).lean(),
      EmailLog.countDocuments(filter)
    ]);

    return res.json({ success: true, data: { logs, total, page, limit } });
  } catch (err) {
    return handleError(res, err, 500);
  }
};
