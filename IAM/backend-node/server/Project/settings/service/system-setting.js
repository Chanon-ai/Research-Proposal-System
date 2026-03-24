const nodemailer = require('nodemailer');
const SystemSetting = require('../models/system-setting.model');
const User = require('../../Auth/models/User');
const Notification = require('../../Proposal/models/Notification');
const redisClient = require('../../../../helpers/redis');

const SECRET_MASK = '••••••••';
const SECRET_KEY_PATTERNS = [
  /smtp[_-]?password/i,
  /api[_-]?key/i,
  /access[_-]?token/i,
  /secret/i,
  /private[_-]?key/i
];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLACEHOLDER_EMAIL_EXACT = new Set([
  'admin01@gmail.com',
  'test@example.com'
]);
const PLACEHOLDER_EMAIL_REGEX = [
  /^admin0\d+@gmail\.com$/i,
  /^test[\w.+-]*@/i,
  /^fake[\w.+-]*@/i,
  /^dummy[\w.+-]*@/i,
  /^seed[\w.+-]*@/i,
  /@example\.(com|org|net)$/i
];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
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

function resolveManualAdminEmailPolicy(settings = {}) {
  const workflowOnly = settings.workflow_only_email_enabled;
  if (workflowOnly !== undefined && toBool(workflowOnly, false)) {
    return {
      enabled: false,
      source: 'workflow_only_email_enabled',
      reasonCode: 'workflow-only-mode-enabled',
      reasonMessage: 'Workflow-only mode enabled'
    };
  }

  if (settings.manual_admin_notification_email_enabled !== undefined) {
    const enabled = toBool(settings.manual_admin_notification_email_enabled, true);
    return {
      enabled,
      source: 'manual_admin_notification_email_enabled',
      reasonCode: enabled ? '' : 'manual-admin-email-disabled',
      reasonMessage: enabled ? '' : 'Manual admin notification email disabled by toggle'
    };
  }

  if (settings.admin_notification_email_enabled !== undefined) {
    const enabled = toBool(settings.admin_notification_email_enabled, true);
    return {
      enabled,
      source: 'admin_notification_email_enabled',
      reasonCode: enabled ? '' : 'admin-notification-email-disabled',
      reasonMessage: enabled ? '' : 'Admin notification email disabled by toggle'
    };
  }

  if (settings.email_notifications_enabled !== undefined) {
    const enabled = toBool(settings.email_notifications_enabled, true);
    return {
      enabled,
      source: 'email_notifications_enabled',
      reasonCode: enabled ? '' : 'email-notifications-disabled',
      reasonMessage: enabled ? '' : 'Email notifications disabled by toggle'
    };
  }

  if (settings.notification_email_enabled !== undefined) {
    const enabled = toBool(settings.notification_email_enabled, true);
    return {
      enabled,
      source: 'notification_email_enabled',
      reasonCode: enabled ? '' : 'legacy-notification-email-disabled',
      reasonMessage: enabled ? '' : 'Legacy notification email disabled by toggle'
    };
  }

  return {
    enabled: true,
    source: 'default',
    reasonCode: '',
    reasonMessage: ''
  };
}

function isPlaceholderEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return true;
  if (PLACEHOLDER_EMAIL_EXACT.has(normalized)) return true;
  return PLACEHOLDER_EMAIL_REGEX.some((pattern) => pattern.test(normalized));
}

async function resolveTestRecipientEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error('Recipient email is required');
  if (!EMAIL_REGEX.test(normalized)) throw new Error('Recipient email is invalid');
  if (isPlaceholderEmail(normalized)) {
    throw new Error('Recipient email appears to be test/seed data. Please use a real user email in the system.');
  }

  const user = await User.findOne({
    email: normalized,
    isDeleted: { $ne: true },
    isActive: true
  }).select('_id email').lean();

  if (!user) {
    throw new Error('Test recipient must be an active user in the system');
  }

  return { email: normalized, userId: user._id };
}

function isSecretKey(key) {
  const normalizedKey = String(key || '').trim();
  if (!normalizedKey) return false;
  return SECRET_KEY_PATTERNS.some(pattern => pattern.test(normalizedKey));
}

function isConfiguredSecretValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return String(value).trim() !== '';
  return true;
}

function shouldKeepExistingSecret(payloadValue) {
  if (payloadValue === undefined || payloadValue === null) return true;
  if (typeof payloadValue !== 'string') return false;

  const text = payloadValue.trim();
  if (!text) return true;
  return ['********', '••••••••', 'มีการตั้งค่าไว้แล้ว'].includes(text);
}

function normalizeSmtpInputForTest(input = {}) {
  const smtp = input || {};
  const normalized = {
    smtp_host: smtp.smtp_host !== undefined ? smtp.smtp_host : smtp.host,
    smtp_port: smtp.smtp_port !== undefined ? smtp.smtp_port : smtp.port,
    smtp_username: smtp.smtp_username !== undefined ? smtp.smtp_username : smtp.username,
    smtp_from_name: smtp.smtp_from_name !== undefined ? smtp.smtp_from_name : smtp.fromName,
    smtp_from_email: smtp.smtp_from_email !== undefined ? smtp.smtp_from_email : smtp.fromEmail,
    smtp_use_ssl: smtp.smtp_use_ssl !== undefined ? smtp.smtp_use_ssl : smtp.useSSL
  };

  const incomingPassword = smtp.smtp_password !== undefined ? smtp.smtp_password : smtp.password;
  if (!shouldKeepExistingSecret(incomingPassword)) {
    normalized.smtp_password = incomingPassword;
  }

  return normalized;
}

function toSettingDto(doc) {
  const row = doc && doc.toObject ? doc.toObject() : { ...(doc || {}) };
  const isSecret = isSecretKey(row.key);
  const isConfigured = isSecret ? isConfiguredSecretValue(row.value) : false;

  return {
    _id: row._id,
    key: row.key || '',
    value: isSecret ? (isConfigured ? SECRET_MASK : '') : row.value,
    isSecret,
    isConfigured,
    description: row.description || '',
    group: row.group || 'general',
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null
  };
}

async function listSettings(query = {}) {
  const filter = { isDeleted: { $ne: true } };
  if (query.group) filter.group = String(query.group).trim();

  const rows = await SystemSetting.find(filter).sort({ group: 1, key: 1, _id: 1 });
  const settings = (rows || []).map(toSettingDto);

  return {
    settings,
    data: settings
  };
}

async function createSetting(payload = {}, user = null) {
  const key = String(payload.key || '').trim();
  if (!key) throw new Error('Setting key is required');

  const exists = await SystemSetting.findOne({ key, isDeleted: { $ne: true } });
  if (exists) {
    throw new Error('Setting key already exists');
  }

  const deleted = await SystemSetting.findOne({ key, isDeleted: true });
  if (deleted) {
    deleted.value = payload.value;
    deleted.description = payload.description || '';
    deleted.group = payload.group || 'general';
    deleted.isDeleted = false;
    deleted.updatedBy = user && user._id ? user._id : null;
    await deleted.save();
    return toSettingDto(deleted);
  }

  const row = new SystemSetting({
    key,
    value: payload.value,
    description: payload.description || '',
    group: payload.group || 'general',
    createdBy: user && user._id ? user._id : null,
    updatedBy: user && user._id ? user._id : null
  });

  const saved = await row.save();
  return toSettingDto(saved);
}

async function updateSetting(id, payload = {}, user = null) {
  const row = await SystemSetting.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!row) throw new Error('Setting not found');

  const isSecret = isSecretKey(row.key);

  if (payload.value !== undefined) {
    if (isSecret) {
      if (!shouldKeepExistingSecret(payload.value)) {
        row.value = payload.value;
      }
    } else {
      row.value = payload.value;
    }
  }
  if (payload.description !== undefined) row.description = payload.description;
  if (payload.group !== undefined) row.group = payload.group;
  row.updatedBy = user && user._id ? user._id : row.updatedBy;

  await row.save();
  return toSettingDto(row);
}

async function deleteSetting(id) {
  const row = await SystemSetting.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!row) throw new Error('Setting not found');

  row.key = `${row.key}__deleted_${Date.now()}`;
  row.isDeleted = true;
  await row.save();
  return true;
}

async function getSettingMap() {
  const rows = await SystemSetting.find({ isDeleted: { $ne: true } }).sort({ group: 1, key: 1 });
  return (rows || []).reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

function normalizeBulkSettingItem(item = {}) {
  const key = String(item.key || '').trim();
  const valueType = String(item.valueType || '').trim();
  const description = item.description !== undefined
    ? String(item.description)
    : String(item.label || '');

  return {
    key,
    value: item.value,
    valueType,
    description
  };
}

function normalizeBulkPayload(payload = {}) {
  const group = String(payload.group || '').trim() || 'general';
  const settings = Array.isArray(payload.settings)
    ? payload.settings.map(normalizeBulkSettingItem)
    : [];

  if (!settings.length) {
    throw new Error('settings array is required');
  }

  const invalidItems = settings.filter((item) => !item.key);
  if (invalidItems.length > 0) {
    throw new Error('every setting item must include key');
  }

  const duplicateKeyMap = settings.reduce((acc, item) => {
    acc[item.key] = (acc[item.key] || 0) + 1;
    return acc;
  }, {});
  const duplicateKeys = Object.keys(duplicateKeyMap).filter((key) => duplicateKeyMap[key] > 1);
  if (duplicateKeys.length > 0) {
    throw new Error(`duplicate keys in payload: ${duplicateKeys.join(', ')}`);
  }

  return { group, settings };
}

function isUnsupportedTransactionError(err) {
  const message = String((err && err.message) || '').toLowerCase();
  return message.includes('transaction numbers are only allowed on a replica set member or mongos') ||
    message.includes('replica set') ||
    message.includes('does not support retryable writes') ||
    message.includes('transaction');
}

function buildBulkOperations({ settings, group, user }) {
  const userId = user && user._id ? user._id : null;
  return settings.map((item) => ({
    updateOne: {
      filter: {
        key: item.key,
        isDeleted: { $ne: true }
      },
      update: {
        $set: {
          key: item.key,
          value: item.value,
          description: item.description || '',
          group,
          isDeleted: false,
          updatedBy: userId,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdBy: userId,
          createdAt: new Date()
        }
      },
      upsert: true
    }
  }));
}

async function bulkUpsertSettings(payload = {}, user = null) {
  const { group, settings } = normalizeBulkPayload(payload);
  const savedKeys = settings.map((item) => item.key);
  const operations = buildBulkOperations({ settings, group, user });

  let session = null;
  try {
    session = await SystemSetting.startSession();
    await session.withTransaction(async () => {
      await SystemSetting.bulkWrite(operations, {
        ordered: true,
        session
      });
    });

    return {
      success: true,
      group,
      savedCount: savedKeys.length,
      savedKeys,
      failedKeys: [],
      source: 'database',
      writeMode: 'transaction'
    };
  } catch (err) {
    if (!isUnsupportedTransactionError(err)) {
      throw err;
    }

    const failedKeySet = new Set();
    try {
      await SystemSetting.bulkWrite(operations, {
        ordered: false
      });
    } catch (bulkErr) {
      const writeErrors = (bulkErr && bulkErr.writeErrors) || [];
      writeErrors.forEach((writeError) => {
        const op = writeError && writeError.err && writeError.err.op
          ? writeError.err.op
          : (writeError && writeError.op ? writeError.op : null);
        const failedKey = op && op.q && op.q.key ? op.q.key : null;
        if (failedKey) failedKeySet.add(failedKey);
      });

      if (failedKeySet.size === savedKeys.length) {
        throw bulkErr;
      }
    }

    const failedKeys = Array.from(failedKeySet);
    const savedAfterFallback = savedKeys.filter((key) => !failedKeySet.has(key));
    return {
      success: failedKeys.length === 0,
      group,
      savedCount: savedAfterFallback.length,
      savedKeys: savedAfterFallback,
      failedKeys,
      source: 'database',
      writeMode: 'bulkWrite'
    };
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

// Template rendering helpers (mirrors workflow-notification.service.js)
const DEFAULT_EMAIL_TEMPLATES = {
  revision_requested: {
    subject: 'แจ้งขอแก้ไขเอกสารโครงการวิจัย - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nโครงการ "{{projectTitle}}" ได้รับการพิจารณาและมีข้อเสนอแนะให้แก้ไข\n\nหมายเหตุ: {{remarks}}\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  approved: {
    subject: 'แจ้งผลการอนุมัติโครงการวิจัย - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nยินดีด้วย! โครงการ "{{projectTitle}}" ได้รับการอนุมัติแล้ว\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  rejected: {
    subject: 'แจ้งผลการพิจารณาโครงการวิจัย - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nโครงการ "{{projectTitle}}" ไม่ผ่านการพิจารณาในรอบนี้\n\nเหตุผล: {{remarks}}\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  meeting_scheduled: {
    subject: 'แจ้งกำหนดการประชุมพิจารณาโครงการวิจัย',
    body: 'เรียน {{recipientName}}\n\nหัวข้อ: {{meetingTitle}}\nวันที่: {{meetingDate}}\nเวลา: {{meetingTime}}\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  },
  committee_assigned: {
    subject: 'แจ้งการมอบหมายพิจารณาโครงการวิจัย - {{proposalCode}}',
    body: 'เรียน {{recipientName}}\n\nท่านได้รับมอบหมายให้พิจารณาโครงการ "{{projectTitle}}"\n\nขอแสดงความนับถือ\nส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  }
};

function renderTemplate(template, vars) {
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
    return { ...DEFAULT_EMAIL_TEMPLATES, ...parsed };
  } catch (err) {
    return { ...DEFAULT_EMAIL_TEMPLATES };
  }
}

function buildTransportConfig(raw = {}) {
  const host = raw.host || raw.smtp_host || '';
  const port = Number(raw.port || raw.smtp_port || 587);
  const user = raw.username || raw.smtp_username || '';
  const pass = raw.password || raw.smtp_password || '';
  const requestedSecure = raw.useSSL !== undefined
    ? Boolean(raw.useSSL)
    : Boolean(raw.smtp_use_ssl);

  // SMTP transport safety rule:
  // - Port 465 must use secure=true (implicit TLS)
  // - Port 587 must use secure=false (STARTTLS-compatible)
  // - Other ports can follow the explicit SSL flag
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

function validateSmtpConfig({ config, smtp = {} }) {
  const host = String(config && config.host ? config.host : '').trim();
  const port = Number(config && config.port ? config.port : 0);
  const fromEmail = String(smtp.fromEmail || smtp.smtp_from_email || '').trim();

  if (!host) {
    throw new Error('SMTP host is required');
  }
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new Error('SMTP port is invalid');
  }
  if (!fromEmail || !EMAIL_REGEX.test(fromEmail.toLowerCase())) {
    throw new Error('SMTP from email is invalid');
  }
  if (config && config.auth && config.auth.user && !String(config.auth.pass || '').trim()) {
    throw new Error('SMTP password is required for authenticated SMTP');
  }
}

async function testEmail({ recipientEmail, smtp = {}, templateKey = '', senderName = '', subject = '', message = '' }) {
  const { email, userId } = await resolveTestRecipientEmail(recipientEmail);

  const saved = await getSettingMap();
  const safeIncomingSmtp = normalizeSmtpInputForTest(smtp);
  const mergedSmtp = {
    smtp_host: saved.smtp_host,
    smtp_port: saved.smtp_port,
    smtp_username: saved.smtp_username,
    smtp_password: saved.smtp_password,
    smtp_from_name: saved.smtp_from_name,
    smtp_from_email: saved.smtp_from_email,
    smtp_use_ssl: saved.smtp_use_ssl,
    ...safeIncomingSmtp
  };

  const config = buildTransportConfig(mergedSmtp);
  validateSmtpConfig({ config, smtp: mergedSmtp });
  const fromAddress = String(mergedSmtp.fromEmail || mergedSmtp.smtp_from_email || '').trim();
  const fromName = String(mergedSmtp.fromName || mergedSmtp.smtp_from_name || '').trim();

  // Render template if templateKey provided, otherwise use default test text
  const templates = parseEmailTemplates(saved.email_templates_json);
  const chosenKey = String(templateKey || '').trim();
  let resolvedSubject = 'MFU Research System: SMTP Test';
  let text = 'This is a test email from the MFU Research System admin settings page.';

  if (chosenKey && templates[chosenKey]) {
    const tpl = templates[chosenKey];
    const dummyVars = {
      recipientName: 'ผู้ทดสอบระบบ',
      proposalCode: 'TEST-001',
      projectTitle: 'โครงการทดสอบ (Test Project)',
      remarks: '(ข้อความทดสอบ - Test Remarks)',
      meetingTitle: 'การประชุมทดสอบ',
      meetingDate: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
      meetingTime: '09:00 น.'
    };
    resolvedSubject = renderTemplate(tpl.subject, dummyVars) || resolvedSubject;
    text = renderTemplate(tpl.body, dummyVars) || text;
  }

  const customSubject = String(subject || '').trim();
  const customMessage = String(message || '').trim();
  const customSenderName = String(senderName || '').trim();
  if (customSubject) {
    resolvedSubject = customSubject;
  }
  if (customMessage) {
    text = customMessage;
  }
  if (customSenderName) {
    text = `จาก: ${customSenderName}\n\n${text}`;
  }

  const transporter = nodemailer.createTransport(config);
  await transporter.sendMail({
    from: fromName ? { name: fromName, address: fromAddress } : fromAddress,
    to: email,
    subject: resolvedSubject,
    text
  });

  // Create in-app notification for the matched user (best-effort, does not affect email result)
  if (userId) {
    try {
      const now = new Date();
      const notifPayload = {
        userId,
        proposalId: null,
        channel: 'in_app',
        eventKey: 'test_email',
        title: 'ทดสอบการส่งอีเมลจากระบบ',
        message: `ระบบได้ส่งอีเมลทดสอบไปยัง ${email} สำเร็จ`,
        payload: { recipientEmail: email },
        isRead: false,
        sentAt: now,
        readAt: null
      };
      console.log('[testEmail] Creating in-app notification for userId:', String(userId), 'payload:', JSON.stringify(notifPayload));
      const notifDoc = await Notification.create(notifPayload);
      console.log('[testEmail] Notification inserted successfully, _id:', notifDoc && notifDoc._id ? String(notifDoc._id) : 'unknown');
    } catch (notifErr) {
      console.error('[testEmail] Failed to create in-app notification:', notifErr && notifErr.message ? notifErr.message : notifErr);
      if (notifErr && notifErr.errors) {
        console.error('[testEmail] Validation errors:', JSON.stringify(notifErr.errors));
      }
    }
  } else {
    console.warn('[testEmail] No userId resolved — skipping in-app notification. email:', email);
  }

  return true;
}

async function clearCache() {
  try {
    if (redisClient && redisClient.client && redisClient.client.isOpen) {
      await redisClient.client.flushAll();
    }
  } catch (err) {
    console.error('[SystemSetting.clearCache] Redis flush failed:', err && err.message ? err.message : err);
  }

  return true;
}

module.exports = {
  listSettings,
  createSetting,
  updateSetting,
  deleteSetting,
  bulkUpsertSettings,
  getSettingMap,
  resolveManualAdminEmailPolicy,
  testEmail,
  clearCache
};
