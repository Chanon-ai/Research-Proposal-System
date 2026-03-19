const nodemailer = require('nodemailer');
const User = require('../../Auth/models/User');
const Notification = require('../models/Notification');
const EmailLog = require('../../settings/models/email-log.model');
const systemSettingService = require('../../settings/service/system-setting');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_EMAIL_TEMPLATES = {
  revision_requested: {
    subject: 'แจ้งขอแก้ไขเอกสารโครงการวิจัย - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nโครงการ "{{projectTitle}}" ได้รับการพิจารณาและมีข้อเสนอแนะให้แก้ไข\n\nหมายเหตุ: {{remarks}}\n\nกรุณาเข้าสู่ระบบเพื่อดำเนินการแก้ไขภายในกำหนด\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  approved: {
    subject: 'แจ้งผลการอนุมัติโครงการวิจัย - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nยินดีด้วย! โครงการ "{{projectTitle}}" ได้รับการอนุมัติแล้ว\n\nกรุณาเข้าสู่ระบบเพื่อดูรายละเอียดเพิ่มเติม\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  rejected: {
    subject: 'แจ้งผลการพิจารณาโครงการวิจัย - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nโครงการ "{{projectTitle}}" ไม่ผ่านการพิจารณาในรอบนี้\n\nเหตุผล: {{remarks}}\n\nกรุณาเข้าสู่ระบบเพื่อดูรายละเอียด\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  meeting_scheduled: {
    subject: 'แจ้งกำหนดการประชุมพิจารณาโครงการวิจัย',
    body: 'เรียน {{recipientName}}\n\nขอแจ้งกำหนดการประชุมพิจารณาโครงการวิจัย\n\nหัวข้อการประชุม: {{meetingTitle}}\nวันที่: {{meetingDate}}\nเวลา: {{meetingTime}}\n\nรายละเอียดเพิ่มเติม: {{remarks}}\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  committee_assigned: {
    subject: 'แจ้งการมอบหมายพิจารณาโครงการวิจัย - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nท่านได้รับมอบหมายให้พิจารณาโครงการ "{{projectTitle}}"\n\nกรุณาเข้าสู่ระบบเพื่อดูเอกสารและดำเนินการพิจารณาภายในกำหนด\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  }
};

function asString(value, fallback = '') {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function toBool(value, fallback = true) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const text = String(value).trim().toLowerCase();
  if (!text) return fallback;
  if (['1', 'true', 'yes', 'y', 'on', 'enabled', 'enable'].includes(text)) return true;
  if (['0', 'false', 'no', 'n', 'off', 'disabled', 'disable'].includes(text)) return false;
  return fallback;
}

function isWorkflowEmailEnabled(settings = {}) {
  const explicit = settings.email_notifications_enabled;
  if (explicit !== undefined) return toBool(explicit, true);

  const legacy = settings.notification_email_enabled;
  if (legacy !== undefined) return toBool(legacy, true);

  return true;
}

function toDateInputValue(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toISOString().slice(0, 10);
}

function renderTemplate(template = '', vars = {}) {
  return String(template || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const value = vars[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

function parseEmailTemplates(rawTemplates) {
  if (!rawTemplates) return { ...DEFAULT_EMAIL_TEMPLATES };

  try {
    const parsed = typeof rawTemplates === 'string' ? JSON.parse(rawTemplates) : rawTemplates;
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_EMAIL_TEMPLATES };
    return {
      ...DEFAULT_EMAIL_TEMPLATES,
      ...parsed
    };
  } catch (err) {
    console.error('[WorkflowEmail] Failed to parse email templates setting:', err && err.message ? err.message : err);
    return { ...DEFAULT_EMAIL_TEMPLATES };
  }
}

function buildTransportConfig(settings = {}) {
  const host = asString(settings.smtp_host);
  const port = Number(settings.smtp_port || 587);
  const user = asString(settings.smtp_username);
  const pass = asString(settings.smtp_password);
  const requestedSecure = settings.smtp_use_ssl !== undefined
    ? Boolean(settings.smtp_use_ssl)
    : false;

  let secure = requestedSecure;
  if (port === 465) secure = true;
  if (port === 587) secure = false;

  return {
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined
  };
}

function validateTransportConfig({ config, settings }) {
  if (!config.host) return 'SMTP host is not configured';
  if (!Number.isFinite(config.port) || config.port < 1 || config.port > 65535) return 'SMTP port is invalid';

  const fromEmail = asString(settings.smtp_from_email || settings.smtp_username).toLowerCase();
  if (!EMAIL_REGEX.test(fromEmail)) return 'SMTP from email is invalid';

  if (config.auth && config.auth.user && !asString(config.auth.pass)) {
    return 'SMTP password is required for authenticated SMTP';
  }

  return '';
}

// Write a single EmailLog record. Best-effort — never throws.
async function writeEmailLog({ eventKey, recipientEmail, recipientUserId, proposalId, proposalRef, meetingId, status, errorMessage }) {
  try {
    await EmailLog.create({
      eventKey: eventKey || 'unknown',
      recipientEmail: String(recipientEmail || '').trim().toLowerCase(),
      recipientUserId: recipientUserId || null,
      proposalId: proposalId || null,
      proposalRef: proposalRef || null,
      meetingId: meetingId || null,
      status,
      errorMessage: errorMessage || null,
      sentAt: new Date()
    });
  } catch (err) {
    console.error('[WorkflowEmail] writeEmailLog error:', err && err.message ? err.message : err);
  }
}

// Notify all admin users in-app when workflow email delivery fails.
// Best-effort: errors here are swallowed so they never block the main workflow.
async function notifyAdminEmailFailure({ eventKey, proposalRef, failureCount, failures, skippedReason }) {
  try {
    const admins = await User.find({
      role: 'admin',
      isDeleted: { $ne: true },
      isActive: true
    }).select('_id').lean();

    if (!admins || admins.length === 0) return;

    const failedEmails = Array.isArray(failures)
      ? failures.map(f => f.email || '(ไม่ระบุ)').filter(Boolean).join(', ')
      : '';

    const reason = skippedReason
      ? `เหตุผล: ${skippedReason}`
      : (failedEmails ? `ผู้รับที่ล้มเหลว: ${failedEmails}` : 'ไม่ทราบสาเหตุ');

    const title = `ส่ง Email แจ้ง Workflow ล้มเหลว (${failureCount} ราย)`;
    const message = `Event: ${eventKey}${proposalRef ? ` | โครงการ: ${proposalRef}` : ''} | ${reason}`;

    const records = admins.map(admin => new Notification({
      userId: admin._id,
      proposalId: null,
      channel: 'in_app',
      eventKey: 'workflow_email_failure',
      title,
      message,
      payload: { eventKey, proposalRef: proposalRef || null, failureCount, failures: failures || [], skippedReason: skippedReason || null },
      isRead: false,
      sentAt: new Date()
    }));

    await Notification.insertMany(records, { ordered: false });
  } catch (err) {
    console.error('[WorkflowEmail] notifyAdminEmailFailure error:', err && err.message ? err.message : err);
  }
}

async function resolveRecipients(recipientIds = []) {
  const ids = Array.from(new Set((Array.isArray(recipientIds) ? recipientIds : [])
    .map((id) => String(id || '').trim())
    .filter(Boolean)));

  if (ids.length === 0) return [];

  const users = await User.find({
    _id: { $in: ids },
    isDeleted: { $ne: true },
    isActive: true
  }).select('_id fullName email').lean();

  return (users || []).filter((user) => EMAIL_REGEX.test(asString(user.email).toLowerCase()));
}

async function sendWorkflowEventEmails({
  eventKey,
  recipientIds = [],
  proposal = null,
  context = {}
}) {
  try {
    const recipients = await resolveRecipients(recipientIds);
    if (!recipients.length) {
      return { attempted: false, sent: 0, failed: 0, skippedReason: 'no-valid-recipient' };
    }

    const settings = await systemSettingService.getSettingMap();
    const templates = parseEmailTemplates(settings && settings.email_templates_json);
    const template = templates[eventKey] || {
      subject: 'แจ้งเตือนจากระบบบริหารงานวิจัย MFU',
      body: 'เรียน {{recipientName}}\n\n{{remarks}}\n\nขอแสดงความนับถือ\nระบบบริหารงานวิจัย MFU'
    };

    // --- Create in-app notifications for all resolved recipients (best-effort, independent of email delivery) ---
    try {
      const inAppRecords = recipients.map(recipient => {
        const vars = {
          recipientName: asString(recipient.fullName, asString(recipient.email, 'ผู้ใช้งาน')),
          proposalCode: asString(proposal && proposal.proposalCode, '-'),
          projectTitle: asString(proposal && proposal.projectTitleTh, '-'),
          remarks: asString(context.remarks, '-'),
          meetingTitle: asString(context.meetingTitle, '-'),
          meetingDate: asString(context.meetingDate, '-'),
          meetingTime: asString(context.meetingTime, '-')
        };
        const title = renderTemplate(template.subject, vars);
        const message = renderTemplate(template.body, vars);
        return new Notification({
          userId: recipient._id,
          proposalId: proposal && proposal._id ? proposal._id : null,
          channel: 'in_app',
          eventKey,
          title,
          message,
          isRead: false,
          sentAt: new Date()
        });
      });
      if (inAppRecords.length > 0) {
        await Notification.insertMany(inAppRecords, { ordered: false });
      }
    } catch (inAppErr) {
      console.error('[WorkflowEmail] in-app notification insertMany error:', inAppErr && inAppErr.message ? inAppErr.message : inAppErr);
    }

    // --- Send emails ---
    if (!isWorkflowEmailEnabled(settings || {})) {
      return { attempted: false, sent: 0, failed: 0, skippedReason: 'email-notifications-disabled' };
    }

    const config = buildTransportConfig(settings || {});
    const transportError = validateTransportConfig({ config, settings: settings || {} });
    if (transportError) {
      return { attempted: false, sent: 0, failed: recipients.length, skippedReason: transportError };
    }

    const transporter = nodemailer.createTransport(config);
    const fromAddress = asString(settings.smtp_from_email || settings.smtp_username);
    const fromName = asString(settings.smtp_from_name, 'MFU Research Platform');

    let sent = 0;
    let failed = 0;
    const failures = [];

    for (const recipient of recipients) {
      const vars = {
        recipientName: asString(recipient.fullName, asString(recipient.email, 'ผู้ใช้งาน')),
        proposalCode: asString(proposal && proposal.proposalCode, '-'),
        projectTitle: asString(proposal && proposal.projectTitleTh, '-'),
        remarks: asString(context.remarks, '-'),
        meetingTitle: asString(context.meetingTitle, '-'),
        meetingDate: asString(context.meetingDate, '-'),
        meetingTime: asString(context.meetingTime, '-')
      };

      const subject = renderTemplate(template.subject, vars);
      const text = renderTemplate(template.body, vars);

      try {
        await transporter.sendMail({
          from: fromName ? { name: fromName, address: fromAddress } : fromAddress,
          to: recipient.email,
          subject,
          text
        });
        sent += 1;
        await writeEmailLog({
          eventKey,
          recipientEmail: recipient.email,
          recipientUserId: recipient._id,
          proposalId: proposal && proposal._id || null,
          proposalRef: proposal && (proposal.proposalCode || String(proposal._id)) || null,
          meetingId: null,
          status: 'sent',
          errorMessage: null
        });
      } catch (err) {
        failed += 1;
        const errMsg = err && err.message ? err.message : 'Unknown error';
        failures.push({
          userId: String(recipient._id),
          email: recipient.email,
          error: errMsg
        });
        await writeEmailLog({
          eventKey,
          recipientEmail: recipient.email,
          recipientUserId: recipient._id,
          proposalId: proposal && proposal._id || null,
          proposalRef: proposal && (proposal.proposalCode || String(proposal._id)) || null,
          meetingId: null,
          status: 'failed',
          errorMessage: errMsg
        });
      }
    }

    if (failed > 0) {
      await notifyAdminEmailFailure({
        eventKey,
        proposalRef: proposal && (proposal.proposalCode || String(proposal._id)) || null,
        failureCount: failed,
        failures,
        skippedReason: null
      });
    }

    return {
      attempted: true,
      sent,
      failed,
      failures
    };
  } catch (err) {
    const failureCount = Array.isArray(recipientIds) ? recipientIds.length : 0;
    const outerFailures = [{ error: err && err.message ? err.message : 'Unexpected workflow email error' }];

    // Log outer failure without a specific recipient email
    await writeEmailLog({
      eventKey,
      recipientEmail: 'unknown',
      recipientUserId: null,
      proposalId: proposal && proposal._id || null,
      proposalRef: proposal && (proposal.proposalCode || String(proposal._id)) || null,
      meetingId: null,
      status: 'failed',
      errorMessage: err && err.message ? err.message : 'Unexpected workflow email error'
    });

    await notifyAdminEmailFailure({
      eventKey,
      proposalRef: proposal && (proposal.proposalCode || String(proposal._id)) || null,
      failureCount,
      failures: outerFailures,
      skippedReason: null
    });

    return {
      attempted: true,
      sent: 0,
      failed: failureCount,
      failures: outerFailures
    };
  }
}

module.exports = {
  sendWorkflowEventEmails
};
