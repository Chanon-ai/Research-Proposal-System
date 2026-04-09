const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const Proposal = require('../models/Proposal');
const STATUS_LABELS = require('../constants/proposal-status-labels');
const systemSettingService = require('../../settings/service/system-setting');

const EXPORT_PUBLIC_DIR = path.resolve(__dirname, '../../../../public/exports');
const REPORT_EXPORT_TYPES = Object.freeze({
  pdf: 'pdf',
  excel: 'excel'
});

function normalizeExportType(value) {
  const type = String(value || '').trim().toLowerCase();
  return type === REPORT_EXPORT_TYPES.excel ? REPORT_EXPORT_TYPES.excel : REPORT_EXPORT_TYPES.pdf;
}

function toBool(value) {
  if (value === true || value === false) return value;
  if (value === undefined || value === null) return false;
  if (typeof value === 'number') return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'on'].includes(normalized);
}

function normalizeExportPayload(payload = {}) {
  return {
    type: normalizeExportType(payload.type),
    fiscalYear: payload.fiscalYear ? Number(payload.fiscalYear) : null,
    status: payload.status ? String(payload.status).trim() : '',
    includeCharts: toBool(payload.includeCharts),
    sendEmail: toBool(payload.sendEmail),
    emailAddress: payload.emailAddress ? String(payload.emailAddress).trim() : ''
  };
}

function sanitizeExportFileName(fileName) {
  return path.basename(String(fileName || '').trim());
}

function getExportContentType(fileName) {
  const ext = String(path.extname(fileName || '')).trim().toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.csv') return 'text/csv; charset=utf-8';
  return 'application/octet-stream';
}

function ensureExportDir() {
  fs.mkdirSync(EXPORT_PUBLIC_DIR, { recursive: true });
}

function getExportFilePath(fileName) {
  ensureExportDir();
  const safeFileName = sanitizeExportFileName(fileName);
  if (!safeFileName || safeFileName.includes('..')) throw new Error('Invalid file name');
  return path.join(EXPORT_PUBLIC_DIR, safeFileName);
}

function buildProposalFilter(payload = {}) {
  const filter = {
    isDeleted: { $ne: true }
  };

  if (payload.fiscalYear) {
    filter.fiscalYear = Number(payload.fiscalYear);
  }

  if (payload.status) {
    filter.currentStatus = String(payload.status).trim();
  }

  return filter;
}

function buildSummary(proposals = []) {
  return (proposals || []).reduce((acc, proposal) => {
    const key = proposal.currentStatus || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function csvEscape(value) {
  const text = value === undefined || value === null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function makeCsv(proposals = []) {
  const header = [
    'Proposal Code',
    'Title TH',
    'Fiscal Year',
    'Funding Type',
    'Current Status',
    'Submitted At',
    'Approved At'
  ];

  const rows = proposals.map((proposal) => ([
    proposal.proposalCode || '',
    proposal.projectTitleTh || '',
    proposal.fiscalYear || '',
    proposal.fundingType || '',
    STATUS_LABELS[proposal.currentStatus] || proposal.currentStatus || '',
    proposal.submittedAt ? new Date(proposal.submittedAt).toISOString() : '',
    proposal.approvedAt ? new Date(proposal.approvedAt).toISOString() : ''
  ].map(csvEscape).join(',')));

  return ['\uFEFF' + header.map(csvEscape).join(','), ...rows].join('\n');
}

function escapePdfText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function generateSimplePdf(lines = []) {
  const textLines = Array.isArray(lines) && lines.length > 0 ? lines : ['MFU Research Report'];
  const textStream = [
    'BT',
    '/F1 12 Tf',
    '50 780 Td'
  ];

  textLines.forEach((line, index) => {
    if (index === 0) {
      textStream.push(`(${escapePdfText(line)}) Tj`);
    } else {
      textStream.push('0 -18 Td');
      textStream.push(`(${escapePdfText(line)}) Tj`);
    }
  });
  textStream.push('ET');

  const stream = textStream.join('\n');
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n',
    `4 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += object;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

function buildPdfLines({ proposals = [], summary = {}, filters = {} }) {
  const statusFilterKey = filters.status ? String(filters.status).trim() : '';
  const statusFilterLabel = statusFilterKey ? (STATUS_LABELS[statusFilterKey] || statusFilterKey) : 'all';
  const lines = [
    'MFU Research Report',
    `Generated at: ${new Date().toISOString()}`,
    `Fiscal year filter: ${filters.fiscalYear || 'all'}`,
    `Status filter: ${statusFilterLabel}`,
    `Total proposals: ${proposals.length}`
  ];

  Object.keys(summary).sort().forEach((key) => {
    const label = STATUS_LABELS[key] || key;
    lines.push(`Status ${label}: ${summary[key]}`);
  });

  lines.push('Recent proposals:');
  (proposals || []).slice(0, 20).forEach((proposal) => {
    const statusLabel = STATUS_LABELS[proposal.currentStatus] || proposal.currentStatus || '-';
    lines.push(`${proposal.proposalCode || '-'} | ${statusLabel} | FY ${proposal.fiscalYear || '-'}`);
  });

  return lines;
}

function buildSmtpConfig(settings = {}) {
  const host = settings.smtp_host || '';
  const port = Number(settings.smtp_port || 587);
  const secure = Boolean(settings.smtp_use_ssl);
  const user = settings.smtp_username || '';
  const pass = settings.smtp_password || '';

  return {
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined
  };
}

async function sendExportEmailIfNeeded({ sendEmail, emailAddress, filePath, fileName }) {
  if (!sendEmail || !emailAddress) return false;

  const settings = await systemSettingService.getSettingMap();
  const config = buildSmtpConfig(settings);
  if (!config.host) return false;

  const transporter = nodemailer.createTransport(config);
  await transporter.sendMail({
    from: settings.smtp_from_email || settings.smtp_username,
    to: emailAddress,
    subject: 'MFU Research Report Export',
    text: 'The requested report export is attached to this email.',
    attachments: [
      {
        filename: fileName,
        path: filePath
      }
    ]
  });

  return true;
}

async function exportReport(payload = {}) {
  ensureExportDir();

  const normalizedPayload = normalizeExportPayload(payload);

  const filter = buildProposalFilter(normalizedPayload);
  const proposals = await Proposal.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .lean();

  const summary = buildSummary(proposals);
  const type = normalizedPayload.type;
  const timestamp = Date.now();
  const fileName = type === 'excel'
    ? `research-report-${timestamp}.csv`
    : `research-report-${timestamp}.pdf`;
  const filePath = getExportFilePath(fileName);

  if (type === 'excel') {
    fs.writeFileSync(filePath, makeCsv(proposals), 'utf8');
  } else {
    const pdfBuffer = generateSimplePdf(buildPdfLines({
      proposals,
      summary,
      filters: normalizedPayload
    }));
    fs.writeFileSync(filePath, pdfBuffer);
  }

  const emailed = await sendExportEmailIfNeeded({
    sendEmail: normalizedPayload.sendEmail,
    emailAddress: normalizedPayload.emailAddress,
    filePath,
    fileName
  }).catch((err) => {
    console.error('[Report.export] send email failed:', err && err.message ? err.message : err);
    return false;
  });

  return {
    downloadUrl: `/api/v1/reports/download/${encodeURIComponent(fileName)}`,
    fileName,
    emailed,
    totalProjects: proposals.length,
    summary
  };
}

async function getExportDownload(fileName) {
  const safeFileName = sanitizeExportFileName(fileName);
  const filePath = getExportFilePath(safeFileName);
  if (!fs.existsSync(filePath)) throw new Error('File not found');

  return {
    fileName: safeFileName,
    filePath,
    contentType: getExportContentType(safeFileName)
  };
}

module.exports = {
  EXPORT_PUBLIC_DIR,
  ensureExportDir,
  exportReport,
  getExportDownload
};
