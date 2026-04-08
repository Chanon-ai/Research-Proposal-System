const nodemailer = require('nodemailer');
const User = require('../../Auth/models/User');
const Notification = require('../models/Notification');
const ProposalStatusLog = require('../models/ProposalStatusLog');
const EmailLog = require('../../settings/models/email-log.model');
const systemSettingService = require('../../settings/service/system-setting');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_EMAIL_TEMPLATES = {
  proposal_submitted: {
    subject: 'มีข้อเสนอโครงการใหม่เข้าสู่ระบบ - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nมีข้อเสนอโครงการใหม่เข้าสู่ระบบ\n\nโครงการ: {{projectTitle}}\nรหัสโครงการ: {{proposalCode}}\n\nกรุณาเข้าสู่ระบบเพื่อตรวจสอบรายละเอียดและดำเนินการในขั้นตอนถัดไป\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  proposal_resubmitted: {
    subject: 'มีการส่งโครงการฉบับแก้ไขกลับเข้าระบบ - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nโครงการ {{projectTitle}} ได้ถูกส่งฉบับแก้ไขกลับเข้าระบบแล้ว\n\nรหัสโครงการ: {{proposalCode}}\nหมายเหตุ: {{remarks}}\n\nกรุณาเข้าสู่ระบบเพื่อตรวจสอบและดำเนินการในขั้นตอนถัดไป\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  proposal_meeting_in_progress: {
    subject: 'สถานะโครงการเปลี่ยนเป็นกำลังจัดการประชุม - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nโครงการ {{projectTitle}} มีการเปลี่ยนสถานะเป็น "กำลังจัดการประชุม"\n\nรหัสโครงการ: {{proposalCode}}\nรายละเอียดเพิ่มเติม: {{remarks}}\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  proposal_status_restored: {
    subject: 'สถานะโครงการถูกปรับกลับหลังจบการประชุม - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nโครงการ {{projectTitle}} ถูกปรับสถานะกลับหลังจบหรือยกเลิกการประชุม\n\nรหัสโครงการ: {{proposalCode}}\nรายละเอียดเพิ่มเติม: {{remarks}}\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  meeting_completed: {
    subject: 'สถานะโครงการอยู่ในขั้นจัดเตรียมผล - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nโครงการ {{projectTitle}} อยู่ในสถานะ "ส่วนบริหารกำลังจัดเตรียมผล" แล้ว\n\nรหัสโครงการ: {{proposalCode}}\nรายละเอียดเพิ่มเติม: {{remarks}}\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  chairman_assigned: {
    subject: 'แจ้งมอบหมายให้ประธานพิจารณาโครงการ - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nท่านได้รับมอบหมายให้พิจารณาโครงการ {{projectTitle}}\n\nรหัสโครงการ: {{proposalCode}}\n\nกรุณาเข้าสู่ระบบเพื่อตรวจสอบและดำเนินการพิจารณา\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  chairman_approved: {
    subject: 'แจ้งผลการพิจารณาจากประธาน - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nโครงการ {{projectTitle}} ได้รับการอนุมัติจากประธานแล้ว\n\nรหัสโครงการ: {{proposalCode}}\nหมายเหตุ: {{remarks}}\n\nกรุณาเข้าสู่ระบบเพื่อตรวจสอบรายละเอียด\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  chairman_rejected: {
    subject: 'แจ้งผลการพิจารณาจากประธาน - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nโครงการ {{projectTitle}} ไม่ผ่านการพิจารณาจากประธาน\n\nรหัสโครงการ: {{proposalCode}}\nหมายเหตุ: {{remarks}}\n\nกรุณาเข้าสู่ระบบเพื่อตรวจสอบรายละเอียด\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  review_certified: {
    subject: 'แอดมินรับผลการประเมินแล้ว - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nผลการประเมินของท่านสำหรับโครงการ {{projectTitle}} ถูกแอดมินรับเข้าระบบเรียบร้อยแล้ว\n\nรหัสโครงการ: {{proposalCode}}\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  review_rejected_by_admin: {
    subject: 'แอดมินตีกลับผลการประเมิน - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nผลการประเมินสำหรับโครงการ {{projectTitle}} ถูกแอดมินตีกลับ\n\nรหัสโครงการ: {{proposalCode}}\nหมายเหตุ: {{remarks}}\n\nกรุณาเข้าสู่ระบบเพื่อตรวจสอบและดำเนินการอีกครั้ง\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
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
  },
  collaboration_confirmation: {
    subject: 'ขอความยินยอมเข้าร่วมโครงการวิจัย - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nขอเรียนเชิญท่านพิจารณาการเข้าร่วมโครงการ "{{projectTitle}}"\nรหัสโครงการ: {{proposalCode}}\nบทบาทในโครงการ: {{participantRole}}\n\nรายละเอียดเพิ่มเติม: {{remarks}}\n\nดูรายละเอียด: {{consentViewUrl}}\nยินยอมเข้าร่วมโครงการ: {{consentAcceptUrl}}\nไม่ยินยอมเข้าร่วมโครงการ: {{consentRejectUrl}}\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
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

function isManualAdminNotificationEmailEnabled(settings = {}) {
  const manualToggle = settings.manual_admin_notification_email_enabled;
  if (manualToggle !== undefined) return toBool(manualToggle, true);

  const altManualToggle = settings.admin_notification_email_enabled;
  if (altManualToggle !== undefined) return toBool(altManualToggle, true);

  const workflowOnlyToggle = settings.workflow_only_email_enabled;
  if (workflowOnlyToggle !== undefined && toBool(workflowOnlyToggle, false)) return false;

  return isWorkflowEmailEnabled(settings);
}

function normalizeReasonItem(reasonCode, message, recipients = []) {
  return {
    reasonCode: asString(reasonCode, 'unknown'),
    message: asString(message, 'Unknown reason'),
    count: Array.isArray(recipients) ? recipients.length : 0,
    recipients: Array.isArray(recipients) ? recipients : []
  };
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

async function resolveActiveRecipients(recipientIds = []) {
  const ids = Array.from(new Set((Array.isArray(recipientIds) ? recipientIds : [])
    .map((id) => String(id || '').trim())
    .filter(Boolean)));

  if (ids.length === 0) return [];

  return User.find({
    _id: { $in: ids },
    isDeleted: { $ne: true },
    isActive: true
  }).select('_id fullName email').lean();
}

async function markProposalStatusLogNotified(proposalStatusLogId, notifySent) {
  if (!proposalStatusLogId) return;
  try {
    await ProposalStatusLog.findByIdAndUpdate(proposalStatusLogId, {
      $set: {
        notifySent: Boolean(notifySent)
      }
    });
  } catch (err) {
    console.error('[WorkflowEmail] markProposalStatusLogNotified error:', err && err.message ? err.message : err);
  }
}

async function dispatchProposalWorkflowNotification({
  eventKey,
  recipientIds = [],
  proposal = null,
  context = {},
  inApp = {},
  proposalStatusLogId = null
} = {}) {
  const recipients = await resolveActiveRecipients(recipientIds);
  if (!recipients.length) {
    await markProposalStatusLogNotified(proposalStatusLogId, false);
    return {
      recipientsResolved: 0,
      inAppSent: 0,
      email: {
        attempted: false,
        sent: 0,
        failed: 0,
        skippedReason: 'no-active-recipient'
      },
      notifySent: false
    };
  }

  const settings = await systemSettingService.getSettingMap();
  const templates = parseEmailTemplates(settings && settings.email_templates_json);
  const template = templates[eventKey] || {
    subject: 'แจ้งเตือนจากระบบบริหารงานวิจัย MFU',
    body: 'เรียน {{recipientName}}\n\n{{remarks}}\n\nขอแสดงความนับถือ\nระบบบริหารงานวิจัย MFU'
  };

  let inAppSent = 0;
  try {
    const docs = recipients.map((recipient) => {
      const vars = {
        recipientName: asString(recipient.fullName, asString(recipient.email, 'ผู้ใช้งาน')),
        proposalCode: asString(proposal && proposal.proposalCode, '-'),
        projectTitle: asString((proposal && (proposal.projectTitleTh || proposal.projectTitleEn)) || '-', '-'),
        remarks: asString(context.remarks, '-'),
        meetingTitle: asString(context.meetingTitle, '-'),
        meetingDate: asString(context.meetingDate, '-'),
        meetingTime: asString(context.meetingTime, '-')
      };
      return new Notification({
        userId: recipient._id,
        proposalId: proposal && proposal._id ? proposal._id : null,
        channel: 'in_app',
        eventKey,
        title: asString(inApp.title, renderTemplate(template.subject, vars)),
        message: asString(inApp.message, renderTemplate(template.body, vars)),
        payload: inApp.payload && typeof inApp.payload === 'object' ? inApp.payload : {},
        isRead: false,
        sentAt: new Date()
      });
    });
    if (docs.length > 0) {
      await Notification.insertMany(docs, { ordered: false });
      inAppSent = docs.length;
    }
  } catch (err) {
    console.error('[WorkflowEmail] dispatchProposalWorkflowNotification in-app error:', err && err.message ? err.message : err);
  }

  const emailResult = await sendWorkflowEventEmails({
    eventKey,
    recipientIds: recipients.map((recipient) => String(recipient._id)),
    proposal,
    context,
    createInApp: false
  });

  const notifySent = Boolean(inAppSent > 0 || (emailResult && (emailResult.attempted || emailResult.skippedReason)));
  await markProposalStatusLogNotified(proposalStatusLogId, notifySent);

  return {
    recipientsResolved: recipients.length,
    inAppSent,
    email: emailResult,
    notifySent
  };
}

async function sendWorkflowEventEmails({
  eventKey,
  recipientIds = [],
  proposal = null,
  context = {},
  createInApp = true
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
    if (createInApp) {
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

async function sendAdminNotificationEmails({
  eventKey = 'announcement',
  recipientIds = [],
  proposal = null,
  title = '',
  message = '',
  context = {}
}) {
  try {
    const uniqueRecipientIds = Array.from(new Set((Array.isArray(recipientIds) ? recipientIds : [])
      .map((id) => String(id || '').trim())
      .filter(Boolean)));

    const summary = {
      inAppCount: uniqueRecipientIds.length,
      emailSentCount: 0,
      emailFailedCount: 0,
      emailSkippedCount: 0
    };

    const diagnostics = {
      failedRecipients: [],
      skippedRecipients: [],
      skippedReason: null,
      reasons: []
    };
    const emailLogs = [];

    async function writeLogTracked({ recipientEmail, recipientUserId, status, errorMessage }) {
      const logEntry = {
        eventKey,
        recipientEmail: asString(recipientEmail || 'unknown').toLowerCase(),
        recipientUserId: recipientUserId || null,
        proposalId: proposal && proposal._id ? proposal._id : null,
        proposalRef: proposal && (proposal.proposalCode || String(proposal._id)) || null,
        meetingId: null,
        status,
        errorMessage: errorMessage || null,
        sentAt: new Date()
      };
      emailLogs.push(logEntry);
      await writeEmailLog(logEntry);
    }

    if (uniqueRecipientIds.length === 0) {
      const reason = normalizeReasonItem('no-recipient', 'No recipient provided', []);
      diagnostics.skippedReason = reason.message;
      diagnostics.reasons.push(reason);
      return {
        attempted: false,
        sent: 0,
        failed: 0,
        skipped: 0,
        failures: [],
        skippedRecipients: [],
        skippedReason: reason.reasonCode,
        summary,
        diagnostics,
        emailLogs
      };
    }

    const recipients = await User.find({
      _id: { $in: uniqueRecipientIds }
    }).select('_id fullName email isActive isDeleted').lean();

    if (!recipients || recipients.length === 0) {
      const skippedRecipients = uniqueRecipientIds.map((id) => ({
        userId: String(id),
        email: '',
        reasonCode: 'recipient-not-found',
        reason: 'Recipient not found'
      }));
      diagnostics.skippedRecipients = skippedRecipients;
      diagnostics.reasons.push(normalizeReasonItem('recipient-not-found', 'Recipient not found', skippedRecipients));
      diagnostics.skippedReason = 'no-active-recipient';

      await Promise.all(skippedRecipients.map((item) => writeLogTracked({
        recipientEmail: item.email || 'unknown',
        recipientUserId: item.userId || null,
        status: 'skipped',
        errorMessage: item.reason
      })));

      summary.emailSkippedCount = skippedRecipients.length;
      return {
        attempted: false,
        sent: 0,
        failed: 0,
        skipped: skippedRecipients.length,
        failures: [],
        skippedRecipients,
        skippedReason: 'no-active-recipient',
        summary,
        diagnostics,
        emailLogs
      };
    }

    const settings = await systemSettingService.getSettingMap();
    const policy = systemSettingService.resolveManualAdminEmailPolicy
      ? systemSettingService.resolveManualAdminEmailPolicy(settings || {})
      : { enabled: isManualAdminNotificationEmailEnabled(settings || {}), source: 'fallback', reasonCode: 'manual-admin-email-disabled', reasonMessage: 'Manual admin notification email disabled by toggle' };

    const recipientMap = new Map((recipients || []).map((user) => [String(user._id), user]));
    const resolvedRecipients = [];
    for (const userId of uniqueRecipientIds) {
      const row = recipientMap.get(String(userId));
      if (!row) {
        diagnostics.skippedRecipients.push({
          userId: String(userId),
          email: '',
          reasonCode: 'recipient-not-found',
          reason: 'Recipient not found'
        });
        continue;
      }

      const email = asString(row.email).toLowerCase();
      if (row.isDeleted === true || row.isActive === false) {
        diagnostics.skippedRecipients.push({
          userId: String(row._id),
          email,
          reasonCode: 'recipient-inactive-or-deleted',
          reason: 'Recipient inactive or deleted'
        });
        continue;
      }

      if (!EMAIL_REGEX.test(email)) {
        diagnostics.skippedRecipients.push({
          userId: String(row._id),
          email,
          reasonCode: 'recipient-email-missing-or-invalid',
          reason: 'Recipient email is missing or invalid'
        });
        continue;
      }

      resolvedRecipients.push({
        ...row,
        email
      });
    }

    summary.emailSkippedCount = diagnostics.skippedRecipients.length;

    if (!policy.enabled) {
      const policySkipped = resolvedRecipients.map((recipient) => ({
        userId: String(recipient._id),
        email: recipient.email,
        reasonCode: policy.reasonCode || 'manual-admin-email-disabled',
        reason: policy.reasonMessage || 'Manual admin notification email disabled'
      }));
      diagnostics.skippedRecipients = [...diagnostics.skippedRecipients, ...policySkipped];
      summary.emailSkippedCount = diagnostics.skippedRecipients.length;

      const grouped = {};
      diagnostics.skippedRecipients.forEach((item) => {
        const key = item.reasonCode || 'unknown';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
      });
      diagnostics.reasons = Object.keys(grouped).map((key) => normalizeReasonItem(key, grouped[key][0].reason, grouped[key]));
      diagnostics.skippedReason = policy.reasonCode || 'manual-admin-email-disabled';

      await Promise.all(diagnostics.skippedRecipients.map((item) => writeLogTracked({
        recipientEmail: item.email || 'unknown',
        recipientUserId: item.userId || null,
        status: 'skipped',
        errorMessage: item.reason
      })));

      return {
        attempted: false,
        sent: 0,
        failed: 0,
        skipped: diagnostics.skippedRecipients.length,
        failures: [],
        skippedRecipients: diagnostics.skippedRecipients,
        skippedReason: diagnostics.skippedReason,
        summary,
        diagnostics,
        emailLogs
      };
    }

    if (resolvedRecipients.length === 0) {
      const grouped = {};
      diagnostics.skippedRecipients.forEach((item) => {
        const key = item.reasonCode || 'unknown';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
      });
      diagnostics.reasons = Object.keys(grouped).map((key) => normalizeReasonItem(key, grouped[key][0].reason, grouped[key]));
      diagnostics.skippedReason = 'no-valid-recipient-email';

      await Promise.all(diagnostics.skippedRecipients.map((item) => writeLogTracked({
        recipientEmail: item.email || 'unknown',
        recipientUserId: item.userId || null,
        status: 'skipped',
        errorMessage: item.reason
      })));

      return {
        attempted: false,
        sent: 0,
        failed: 0,
        skipped: diagnostics.skippedRecipients.length,
        failures: [],
        skippedRecipients: diagnostics.skippedRecipients,
        skippedReason: diagnostics.skippedReason,
        summary,
        diagnostics,
        emailLogs
      };
    }

    const templates = parseEmailTemplates(settings && settings.email_templates_json);
    const providedTitle = asString(title);
    const providedMessage = asString(message);

    let template = null;
    if (!providedTitle && !providedMessage) {
      if (!templates || !templates[eventKey]) {
        const templateSkipped = resolvedRecipients.map((recipient) => ({
          userId: String(recipient._id),
          email: recipient.email,
          reasonCode: 'template-not-found',
          reason: `No email template found for eventKey: ${eventKey}`
        }));
        diagnostics.skippedRecipients = [...diagnostics.skippedRecipients, ...templateSkipped];
        summary.emailSkippedCount = diagnostics.skippedRecipients.length;
        diagnostics.reasons.push(normalizeReasonItem('template-not-found', `No email template found for eventKey: ${eventKey}`, templateSkipped));
        diagnostics.skippedReason = 'template-not-found';

        await Promise.all(diagnostics.skippedRecipients.map((item) => writeLogTracked({
          recipientEmail: item.email || 'unknown',
          recipientUserId: item.userId || null,
          status: 'skipped',
          errorMessage: item.reason
        })));

        return {
          attempted: false,
          sent: 0,
          failed: 0,
          skipped: diagnostics.skippedRecipients.length,
          failures: [],
          skippedRecipients: diagnostics.skippedRecipients,
          skippedReason: diagnostics.skippedReason,
          summary,
          diagnostics,
          emailLogs
        };
      }

      template = templates[eventKey];
      if (!template || !asString(template.subject) || !asString(template.body)) {
        const templateInvalidSkipped = resolvedRecipients.map((recipient) => ({
          userId: String(recipient._id),
          email: recipient.email,
          reasonCode: 'template-invalid',
          reason: `Invalid email template for eventKey: ${eventKey}`
        }));
        diagnostics.skippedRecipients = [...diagnostics.skippedRecipients, ...templateInvalidSkipped];
        summary.emailSkippedCount = diagnostics.skippedRecipients.length;
        diagnostics.reasons.push(normalizeReasonItem('template-invalid', `Invalid email template for eventKey: ${eventKey}`, templateInvalidSkipped));
        diagnostics.skippedReason = 'template-invalid';

        await Promise.all(diagnostics.skippedRecipients.map((item) => writeLogTracked({
          recipientEmail: item.email || 'unknown',
          recipientUserId: item.userId || null,
          status: 'skipped',
          errorMessage: item.reason
        })));

        return {
          attempted: false,
          sent: 0,
          failed: 0,
          skipped: diagnostics.skippedRecipients.length,
          failures: [],
          skippedRecipients: diagnostics.skippedRecipients,
          skippedReason: diagnostics.skippedReason,
          summary,
          diagnostics,
          emailLogs
        };
      }
    }

    const config = buildTransportConfig(settings || {});
    const transportError = validateTransportConfig({ config, settings: settings || {} });
    if (transportError) {
      const transportSkipped = resolvedRecipients.map((recipient) => ({
        userId: String(recipient._id),
        email: recipient.email,
        reasonCode: 'smtp-not-configured',
        reason: transportError
      }));
      diagnostics.skippedRecipients = [...diagnostics.skippedRecipients, ...transportSkipped];
      summary.emailSkippedCount = diagnostics.skippedRecipients.length;
      diagnostics.reasons.push(normalizeReasonItem('smtp-not-configured', transportError, transportSkipped));
      diagnostics.skippedReason = 'smtp-not-configured';

      await Promise.all(diagnostics.skippedRecipients.map((item) => writeLogTracked({
        recipientEmail: item.email || 'unknown',
        recipientUserId: item.userId || null,
        status: 'skipped',
        errorMessage: item.reason
      })));

      return {
        attempted: false,
        sent: 0,
        failed: 0,
        skipped: diagnostics.skippedRecipients.length,
        failures: [],
        skippedRecipients: diagnostics.skippedRecipients,
        skippedReason: diagnostics.skippedReason,
        summary,
        diagnostics,
        emailLogs
      };
    }

    const transporter = nodemailer.createTransport(config);
    const fromAddress = asString(settings.smtp_from_email || settings.smtp_username);
    const fromName = asString(settings.smtp_from_name, 'MFU Research Platform');

    let sent = 0;
    let failed = 0;
    const failures = [];

    for (const recipient of resolvedRecipients) {
      const rawEmail = asString(recipient && recipient.email).toLowerCase();
      const vars = {
        recipientName: asString(recipient.fullName, rawEmail),
        proposalCode: asString(proposal && proposal.proposalCode, '-'),
        projectTitle: asString(proposal && proposal.projectTitleTh, '-'),
        remarks: asString(context.remarks, providedMessage || '-'),
        meetingTitle: asString(context.meetingTitle, '-'),
        meetingDate: asString(context.meetingDate, toDateInputValue(context.meetingDate)),
        meetingTime: asString(context.meetingTime, '-')
      };

      const subject = providedTitle || renderTemplate((template && template.subject) || '', vars);
      const text = providedMessage || renderTemplate((template && template.body) || '', vars);

      try {
        await transporter.sendMail({
          from: fromName ? { name: fromName, address: fromAddress } : fromAddress,
          to: rawEmail,
          subject,
          text
        });
        sent += 1;

        await writeLogTracked({
          recipientEmail: rawEmail,
          recipientUserId: recipient._id,
          status: 'sent',
          errorMessage: null
        });
      } catch (err) {
        failed += 1;
        const errMsg = err && err.message ? err.message : 'Unknown error';
        failures.push({
          userId: String(recipient._id),
          email: rawEmail,
          error: errMsg
        });

        await writeLogTracked({
          recipientEmail: rawEmail,
          recipientUserId: recipient._id,
          status: 'failed',
          errorMessage: errMsg
        });
      }
    }

    diagnostics.failedRecipients = failures;
    const grouped = {};
    diagnostics.skippedRecipients.forEach((item) => {
      const key = item.reasonCode || 'unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    diagnostics.reasons = [
      ...Object.keys(grouped).map((key) => normalizeReasonItem(key, grouped[key][0].reason, grouped[key])),
      ...(failures.length > 0 ? [normalizeReasonItem('smtp-send-failed', 'SMTP send failed for some recipients', failures)] : [])
    ];
    diagnostics.skippedReason = diagnostics.skippedRecipients.length > 0
      ? diagnostics.skippedRecipients[0].reasonCode
      : null;

    if (diagnostics.skippedRecipients.length > 0) {
      await Promise.all(diagnostics.skippedRecipients.map((item) => writeLogTracked({
        recipientEmail: item.email || 'unknown',
        recipientUserId: item.userId || null,
        status: 'skipped',
        errorMessage: item.reason
      })));
    }

    summary.emailSentCount = sent;
    summary.emailFailedCount = failed;
    summary.emailSkippedCount = diagnostics.skippedRecipients.length;

    return {
      attempted: true,
      sent,
      failed,
      skipped: diagnostics.skippedRecipients.length,
      failures,
      skippedRecipients: diagnostics.skippedRecipients,
      skippedReason: diagnostics.skippedReason,
      summary,
      diagnostics,
      emailLogs
    };
  } catch (err) {
    const fallbackSummary = {
      inAppCount: Array.isArray(recipientIds) ? recipientIds.length : 0,
      emailSentCount: 0,
      emailFailedCount: Array.isArray(recipientIds) ? recipientIds.length : 0,
      emailSkippedCount: 0
    };
    const fallbackFailures = [{ error: err && err.message ? err.message : 'Unexpected admin notification email error' }];
    return {
      attempted: true,
      sent: 0,
      failed: Array.isArray(recipientIds) ? recipientIds.length : 0,
      skipped: 0,
      failures: fallbackFailures,
      skippedRecipients: [],
      skippedReason: null,
      summary: fallbackSummary,
      diagnostics: {
        failedRecipients: fallbackFailures,
        skippedRecipients: [],
        skippedReason: null,
        reasons: [normalizeReasonItem('unexpected-error', fallbackFailures[0].error, fallbackFailures)]
      },
      emailLogs: fallbackFailures.map((item) => ({
        eventKey,
        recipientEmail: 'unknown',
        recipientUserId: null,
        proposalId: proposal && proposal._id ? proposal._id : null,
        proposalRef: proposal && (proposal.proposalCode || String(proposal._id)) || null,
        meetingId: null,
        status: 'failed',
        errorMessage: item.error,
        sentAt: new Date()
      }))
    };
  }
}

module.exports = {
  dispatchProposalWorkflowNotification,
  sendWorkflowEventEmails,
  sendAdminNotificationEmails
};
