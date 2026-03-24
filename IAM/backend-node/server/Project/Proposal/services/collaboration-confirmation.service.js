const crypto = require('crypto');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const Proposal = require('../models/Proposal');
const Notification = require('../models/Notification');
const CollaborationConfirmation = require('../models/CollaborationConfirmation');
const systemSettingService = require('../../settings/service/system-setting');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_TOKEN_TTL_HOURS = 24 * 7;

function asString(value, fallback = '') {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeEmail(email) {
  return asString(email).toLowerCase();
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

function normalizeObjectId(value) {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  const text = asString(value);
  if (!text || !mongoose.Types.ObjectId.isValid(text)) return null;
  return new mongoose.Types.ObjectId(text);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getTokenExpiryDate() {
  const envHours = Number(process.env.COLLAB_CONFIRM_TOKEN_TTL_HOURS || process.env.CONFIRM_TOKEN_TTL_HOURS || DEFAULT_TOKEN_TTL_HOURS);
  const ttlHours = Number.isFinite(envHours) && envHours > 0 ? envHours : DEFAULT_TOKEN_TTL_HOURS;
  const now = Date.now();
  return new Date(now + (ttlHours * 60 * 60 * 1000));
}

function stripHtml(raw) {
  return String(raw || '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  if (config.auth && config.auth.user && !asString(config.auth.pass)) return 'SMTP password is required';
  return '';
}

function isWorkflowEmailEnabled(settings = {}) {
  const explicit = settings.email_notifications_enabled;
  if (explicit !== undefined) return toBool(explicit, true);
  const legacy = settings.notification_email_enabled;
  if (legacy !== undefined) return toBool(legacy, true);
  return true;
}

function toDateText(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toISOString().replace('T', ' ').slice(0, 16);
}

function truncateText(value, max = 350) {
  const text = stripHtml(value || '');
  if (!text) return '-';
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

function extractParticipants(snapshot = {}) {
  const team = snapshot && snapshot.researchTeam && typeof snapshot.researchTeam === 'object'
    ? snapshot.researchTeam
    : {};
  const coResearchers = Array.isArray(team.coResearchers) ? team.coResearchers : [];
  const advisors = Array.isArray(team.advisors) ? team.advisors : [];

  const participants = [];

  coResearchers.forEach((row, index) => {
    const person = row && typeof row === 'object' ? row : {};
    participants.push({
      participantType: 'co_researcher',
      participantIndex: index,
      participantName: asString(person.name),
      participantEmail: normalizeEmail(person.email),
      sourceUserId: normalizeObjectId(person.sourceUserId)
    });
  });

  advisors.forEach((row, index) => {
    const person = row && typeof row === 'object' ? row : {};
    participants.push({
      participantType: 'advisor',
      participantIndex: index,
      participantName: asString(person.name),
      participantEmail: normalizeEmail(person.email),
      sourceUserId: null
    });
  });

  return participants;
}

function buildConsentUrl({ token, requestOrigin = '' }) {
  const configuredBase = asString(process.env.COLLAB_CONFIRM_BASE_URL || process.env.CONSENT_BASE_URL || process.env.APP_BASE_URL || '');
  const base = asString(configuredBase || requestOrigin || '');
  const query = `token=${encodeURIComponent(token)}`;

  if (!base) {
    return `/api/v1/proposals/collaboration-consent/view?${query}`;
  }

  return `${base.replace(/\/+$/, '')}/api/v1/proposals/collaboration-consent/view?${query}`;
}

async function syncProposalConfirmationSummary(proposalId) {
  if (!proposalId) return;
  const proposal = await Proposal.findById(proposalId);
  if (!proposal) return;

  const rows = await CollaborationConfirmation.find({ proposalId })
    .sort({ participantType: 1, participantIndex: 1, createdAt: 1 })
    .lean();

  const summary = (rows || []).map((row) => ({
    confirmationId: row && row._id ? String(row._id) : '',
    participantType: row.participantType || '',
    participantIndex: Number(row.participantIndex || 0),
    participantName: asString(row.participantName),
    participantEmail: asString(row.participantEmail),
    status: row.status || 'pending',
    invitationSentAt: row.invitationSentAt || null,
    respondedAt: row.respondedAt || null,
    deliveryStatus: row.deliveryStatus || 'not_applicable',
    deliveryError: asString(row.deliveryError)
  }));

  proposal.formSnapshotJson = {
    ...(proposal.formSnapshotJson || {}),
    collaborationConfirmations: summary
  };
  proposal.markModified('formSnapshotJson');
  await proposal.save();
}

function buildProposalPreview(proposal) {
  const snapshot = proposal && proposal.formSnapshotJson && typeof proposal.formSnapshotJson === 'object'
    ? proposal.formSnapshotJson
    : {};

  return {
    proposalId: proposal && proposal._id ? String(proposal._id) : '',
    proposalCode: asString(proposal && proposal.proposalCode, '-'),
    projectTitle: asString(proposal && proposal.projectTitleTh, asString(snapshot.projectNameThai, '-')),
    projectTitleEn: asString(proposal && proposal.projectTitleEn, asString(snapshot.projectNameEnglish, '')),
    projectLeaderName: asString(snapshot.projectLeaderName || (snapshot.researchTeam && snapshot.researchTeam.projectLeader && snapshot.researchTeam.projectLeader.name) || '-'),
    fundingType: asString(snapshot.fundingType, '-'),
    researchType: asString(snapshot.researchType, '-'),
    submittedAt: proposal && proposal.submittedAt ? proposal.submittedAt : null,
    abstractPreview: truncateText(snapshot.problemSignificance || proposal && proposal.abstractText || ''),
    objectivePreview: truncateText(snapshot.objectives || '')
  };
}

async function sendConsentRequestEmail({ recipient, proposalPreview, viewUrl, acceptUrl, rejectUrl }) {
  const settings = await systemSettingService.getSettingMap();
  if (!isWorkflowEmailEnabled(settings || {})) {
    return { ok: false, skippedReason: 'email-notifications-disabled' };
  }

  const config = buildTransportConfig(settings || {});
  const configError = validateTransportConfig({ config, settings: settings || {} });
  if (configError) {
    return { ok: false, skippedReason: configError };
  }

  const transporter = nodemailer.createTransport(config);
  const fromAddress = asString(settings.smtp_from_email || settings.smtp_username);
  const fromName = asString(settings.smtp_from_name, 'ส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง');
  const recipientName = asString(recipient.participantName, recipient.participantEmail);
  const detailText = `โครงการ ${asString(proposalPreview.projectTitle, '-')} (รหัส ${asString(proposalPreview.proposalCode, '-')})`;

  const subject = `ขอแจ้งพิจารณาเข้าร่วมโครงการวิจัย - ${asString(proposalPreview.proposalCode, '-')}`;
  const text = [
    `เรียน ${recipientName}`,
    '',
    'ขอแจ้งพิจารณาเข้าร่วมโครงการวิจัย',
    '',
    `รายละเอียด: ${detailText}`,
    '',
    `ดูเอกสาร: ${viewUrl}`,
    `ยินยอม: ${acceptUrl}`,
    `ไม่ยินยอม: ${rejectUrl}`,
    '',
    'ขอแสดงความนับถือ',
    'ส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง'
  ].join('\n');

  const html = `
<div style="font-family:Tahoma,Arial,sans-serif;font-size:15px;line-height:1.7;color:#1f2937">
  <p>เรียน ${escapeHtml(recipientName)}</p>
  <p>ขอแจ้งพิจารณาเข้าร่วมโครงการวิจัย</p>
  <p>รายละเอียด: ${escapeHtml(detailText)}</p>
  <p>
    <a href="${escapeHtml(viewUrl)}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:8px 14px;border-radius:8px;margin-right:6px">ดูเอกสาร</a>
    <a href="${escapeHtml(acceptUrl)}" style="display:inline-block;background:#047857;color:#fff;text-decoration:none;padding:8px 14px;border-radius:8px;margin-right:6px">ยินยอม</a>
    <a href="${escapeHtml(rejectUrl)}" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:8px 14px;border-radius:8px">ไม่ยินยอม</a>
  </p>
  <p>ขอแสดงความนับถือ<br/>ส่วนบริหารงานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง</p>
</div>`;

  await transporter.sendMail({
    from: fromName ? { name: fromName, address: fromAddress } : fromAddress,
    to: recipient.participantEmail,
    subject,
    text,
    html,
    textEncoding: 'base64',
    headers: {
      'Content-Language': 'th',
      'X-Content-Type-Options': 'nosniff'
    }
  });

  return { ok: true };
}

async function issueCollaborationConfirmations({ proposalId, invitedByUserId = null, requestOrigin = '' }) {
  const proposal = await Proposal.findById(proposalId);
  if (!proposal) throw new Error('Proposal not found');

  const snapshot = proposal.formSnapshotJson && typeof proposal.formSnapshotJson === 'object'
    ? proposal.formSnapshotJson
    : {};
  const participants = extractParticipants(snapshot);

  await CollaborationConfirmation.deleteMany({
    proposalId: proposal._id,
    status: 'pending'
  });

  const proposalPreview = buildProposalPreview(proposal);
  const createdRows = [];
  const sendResults = [];

  for (const participant of participants) {
    const hasEmail = EMAIL_REGEX.test(participant.participantEmail);
    const token = hasEmail ? generateToken() : '';
    const tokenHash = hasEmail ? hashToken(token) : hashToken(generateToken());
    const decisionTokenHash = tokenHash;
    const tokenExpiresAt = hasEmail ? getTokenExpiryDate() : null;

    const doc = await CollaborationConfirmation.create({
      proposalId: proposal._id,
      proposalCode: asString(proposal.proposalCode),
      invitedByUserId: invitedByUserId || null,
      participantType: participant.participantType,
      participantIndex: participant.participantIndex,
      participantName: participant.participantName,
      participantEmail: participant.participantEmail,
      sourceUserId: participant.sourceUserId || null,
      status: hasEmail ? 'pending' : 'email_missing',
      invitationTokenHash: hasEmail ? tokenHash : undefined,
      decisionTokenHash,
      tokenExpiresAt,
      deliveryStatus: hasEmail ? 'failed' : 'not_applicable'
    });

    createdRows.push(doc);

    if (!hasEmail) {
      sendResults.push({
        participantEmail: participant.participantEmail || '',
        status: 'email_missing',
        reason: 'missing-or-invalid-email'
      });
      continue;
    }

    const viewUrl = buildConsentUrl({ token, requestOrigin });
    const acceptUrl = `${viewUrl}&intent=accept`;
    const rejectUrl = `${viewUrl}&intent=reject`;

    try {
      const emailResult = await sendConsentRequestEmail({
        recipient: participant,
        proposalPreview,
        viewUrl,
        acceptUrl,
        rejectUrl
      });

      if (!emailResult || !emailResult.ok) {
        throw new Error(asString(emailResult && emailResult.skippedReason, 'failed-to-send-email'));
      }

      doc.deliveryStatus = 'sent';
      doc.deliveryError = '';
      doc.invitationSentAt = new Date();
      await doc.save();

      sendResults.push({
        participantEmail: participant.participantEmail,
        status: 'sent',
        reason: ''
      });
    } catch (err) {
      const message = err && err.message ? err.message : 'failed-to-send-email';
      doc.deliveryStatus = 'failed';
      doc.deliveryError = message;
      await doc.save();

      sendResults.push({
        participantEmail: participant.participantEmail,
        status: 'failed',
        reason: message
      });
    }
  }

  await syncProposalConfirmationSummary(proposal._id);

  return {
    total: createdRows.length,
    sent: sendResults.filter((item) => item.status === 'sent').length,
    failed: sendResults.filter((item) => item.status === 'failed').length,
    emailMissing: sendResults.filter((item) => item.status === 'email_missing').length,
    details: sendResults
  };
}

function validateTokenInput(token) {
  const text = asString(token);
  if (!text) throw new Error('Token is required');
  if (text.length < 16) throw new Error('Token is invalid');
  return text;
}

async function getConfirmationByToken(token) {
  const safeToken = validateTokenInput(token);
  const tokenHash = hashToken(safeToken);
  const confirmation = await CollaborationConfirmation.findOne({
    $or: [
      { invitationTokenHash: tokenHash },
      { decisionTokenHash: tokenHash }
    ]
  });
  if (!confirmation) throw new Error('Confirmation not found');
  return confirmation;
}

async function expireIfNeeded(confirmation) {
  if (!confirmation) return confirmation;
  if (confirmation.status !== 'pending') return confirmation;
  if (!confirmation.tokenExpiresAt) return confirmation;
  if (new Date(confirmation.tokenExpiresAt).getTime() >= Date.now()) return confirmation;

  confirmation.status = 'expired';
  confirmation.respondedAt = new Date();
  await confirmation.save();
  await syncProposalConfirmationSummary(confirmation.proposalId);
  return confirmation;
}

function toParticipantRoleText(participantType) {
  if (participantType === 'advisor') return 'Advisor';
  return 'Co-researcher';
}

async function getConsentContextByToken(token) {
  const confirmation = await getConfirmationByToken(token);
  await expireIfNeeded(confirmation);

  const proposal = await Proposal.findById(confirmation.proposalId).lean();
  if (!proposal) throw new Error('Proposal not found');

  const preview = buildProposalPreview(proposal);
  const currentStatus = confirmation.status || 'pending';
  const canRespond = currentStatus === 'pending';

  return {
    confirmationId: String(confirmation._id),
    status: currentStatus,
    canRespond,
    participantName: asString(confirmation.participantName, '-'),
    participantEmail: asString(confirmation.participantEmail, '-'),
    participantRole: toParticipantRoleText(confirmation.participantType),
    participantType: confirmation.participantType,
    respondedAt: confirmation.respondedAt || null,
    decisionNote: asString(confirmation.decisionNote),
    signatureData: asString(confirmation.signatureData),
    expiresAt: confirmation.tokenExpiresAt || null,
    proposal: {
      ...preview,
      submittedAtText: toDateText(preview.submittedAt)
    }
  };
}

function normalizeDecision(decision) {
  const text = asString(decision).toLowerCase();
  if (['accept', 'accepted', 'approve', 'approved', 'confirm'].includes(text)) return 'accepted';
  if (['reject', 'rejected', 'decline', 'declined'].includes(text)) return 'rejected';
  throw new Error('Decision is invalid');
}

function validateSignatureData(signatureData) {
  const raw = asString(signatureData);
  if (!raw) throw new Error('Signature is required');
  if (!raw.startsWith('data:image/')) throw new Error('Signature format is invalid');
  if (raw.length > 8 * 1024 * 1024) throw new Error('Signature payload is too large');
  return raw;
}

function mapSignatureKey(confirmation = {}) {
  const index = Number(confirmation.participantIndex || 0);
  if (!Number.isFinite(index) || index < 0) return '';
  if (confirmation.participantType === 'co_researcher') {
    return `coResearcher-${Math.floor(index)}`;
  }
  if (confirmation.participantType === 'advisor') {
    return `advisor-${Math.floor(index)}`;
  }
  return '';
}

function formatSignatureTimestamp(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().replace('T', ' ').slice(0, 16);
}

function applyConsentMetaToTeam(snapshot = {}, confirmation = {}, nextStatus = '') {
  const nextSnapshot = snapshot && typeof snapshot === 'object' ? { ...snapshot } : {};
  const team = nextSnapshot.researchTeam && typeof nextSnapshot.researchTeam === 'object'
    ? { ...nextSnapshot.researchTeam }
    : null;
  if (!team) return nextSnapshot;

  const key = confirmation.participantType === 'co_researcher' ? 'coResearchers' : (
    confirmation.participantType === 'advisor' ? 'advisors' : ''
  );
  if (!key) return nextSnapshot;

  const list = Array.isArray(team[key]) ? [...team[key]] : [];
  const index = Number(confirmation.participantIndex || 0);
  if (!Number.isFinite(index) || index < 0 || index >= list.length) return nextSnapshot;

  const row = list[index] && typeof list[index] === 'object' ? { ...list[index] } : {};
  row.consentStatus = asString(nextStatus || 'pending', 'pending');
  row.consentRespondedAt = confirmation.respondedAt || null;
  row.consentSignatureUpdatedAt = confirmation.respondedAt || null;
  list[index] = row;
  team[key] = list;
  nextSnapshot.researchTeam = team;
  return nextSnapshot;
}

async function applySignatureToProposalDocument({
  proposalId,
  confirmation,
  nextStatus,
  signatureData
}) {
  if (!proposalId) return;
  if (!confirmation || typeof confirmation !== 'object') return;

  const proposal = await Proposal.findById(proposalId);
  if (!proposal) return;

  const snapshot = proposal.formSnapshotJson && typeof proposal.formSnapshotJson === 'object'
    ? { ...proposal.formSnapshotJson }
    : {};

  const signatures = snapshot.signatures && typeof snapshot.signatures === 'object'
    ? { ...snapshot.signatures }
    : {};

  const signatureKey = mapSignatureKey(confirmation);
  if (signatureKey && nextStatus === 'accepted' && asString(signatureData)) {
    const current = signatures[signatureKey] && typeof signatures[signatureKey] === 'object'
      ? { ...signatures[signatureKey] }
      : {};

    signatures[signatureKey] = {
      ...current,
      data: signatureData,
      completed: true,
      mode: 'upload',
      timestamp: formatSignatureTimestamp(confirmation.respondedAt)
    };
  }

  snapshot.signatures = signatures;
  proposal.formSnapshotJson = applyConsentMetaToTeam(snapshot, confirmation, nextStatus);
  proposal.markModified('formSnapshotJson');
  await proposal.save();
}

async function notifyProposalOwnerOnDecision({ proposal, confirmation, status }) {
  const ownerId = proposal && proposal.applicantUserId ? proposal.applicantUserId : null;
  if (!ownerId) return;

  const actorName = asString(confirmation.participantName, confirmation.participantEmail || 'Participant');
  const actionLabel = status === 'accepted' ? 'accepted' : 'rejected';
  const title = `Collaboration confirmation ${actionLabel}`;
  const message = `${actorName} has ${actionLabel} participation for proposal ${asString(proposal.proposalCode, '-')}.`;

  await Notification.create({
    userId: ownerId,
    proposalId: proposal._id,
    channel: 'in_app',
    eventKey: 'collaboration_confirmation',
    title,
    message,
    payload: {
      confirmationId: String(confirmation._id),
      participantType: confirmation.participantType,
      participantName: actorName,
      status
    },
    isRead: false,
    sentAt: new Date()
  });
}

async function respondCollaborationConfirmation({
  token,
  decision,
  signatureData,
  note = '',
  ipAddress = '',
  userAgent = ''
}) {
  const confirmation = await getConfirmationByToken(token);
  await expireIfNeeded(confirmation);

  if (confirmation.status !== 'pending') {
    throw new Error(`Confirmation already ${confirmation.status}`);
  }

  const normalizedDecision = normalizeDecision(decision);
  const nextStatus = normalizedDecision === 'accepted' ? 'accepted' : 'rejected';
  const savedSignature = nextStatus === 'accepted'
    ? validateSignatureData(signatureData)
    : '';

  confirmation.status = nextStatus;
  confirmation.signatureData = savedSignature;
  confirmation.decisionNote = asString(note);
  confirmation.respondedAt = new Date();
  confirmation.responderIp = asString(ipAddress);
  confirmation.responderUserAgent = asString(userAgent);
  await confirmation.save();

  await applySignatureToProposalDocument({
    proposalId: confirmation.proposalId,
    confirmation,
    nextStatus,
    signatureData: savedSignature
  });

  await syncProposalConfirmationSummary(confirmation.proposalId);

  const proposal = await Proposal.findById(confirmation.proposalId);
  if (proposal) {
    await notifyProposalOwnerOnDecision({
      proposal,
      confirmation,
      status: nextStatus
    });
  }

  return {
    confirmationId: String(confirmation._id),
    status: nextStatus,
    respondedAt: confirmation.respondedAt
  };
}

async function listCollaborationConfirmationsByProposal({ proposalId, user }) {
  const proposal = await Proposal.findById(proposalId).select('_id applicantUserId proposalCode');
  if (!proposal) throw new Error('Proposal not found');

  const role = user && user.role ? String(user.role) : '';
  const isAdmin = role === 'admin' || role === 'chairman';
  const isOwner = user && user._id && String(proposal.applicantUserId) === String(user._id);

  if (!isAdmin && !isOwner) {
    throw new Error('Forbidden');
  }

  const rows = await CollaborationConfirmation.find({ proposalId: proposal._id })
    .sort({ participantType: 1, participantIndex: 1, createdAt: 1 })
    .lean();

  return {
    proposalId: String(proposal._id),
    proposalCode: asString(proposal.proposalCode),
    items: (rows || []).map((row) => ({
      confirmationId: String(row._id),
      participantType: row.participantType,
      participantIndex: Number(row.participantIndex || 0),
      participantName: asString(row.participantName),
      participantEmail: asString(row.participantEmail),
      status: row.status || 'pending',
      invitationSentAt: row.invitationSentAt || null,
      respondedAt: row.respondedAt || null,
      deliveryStatus: row.deliveryStatus || 'not_applicable',
      deliveryError: asString(row.deliveryError)
    }))
  };
}

module.exports = {
  issueCollaborationConfirmations,
  getConsentContextByToken,
  respondCollaborationConfirmation,
  listCollaborationConfirmationsByProposal
};
