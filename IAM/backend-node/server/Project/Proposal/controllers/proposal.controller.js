// proposal.controller.js
// Handles HTTP requests and delegates to service layer

const mongoose = require('mongoose');
const service = require('../services/proposal.service');
const formFileService = require('../services/proposalFormFile.service');
const collaborationConfirmationService = require('../services/collaboration-confirmation.service');

function jsonResponse(res, { success = true, message = '', data = null, meta = null }) {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  if (meta !== null) payload.meta = meta;
  return res.json(payload);
}

function getUserFromReq(req) {
  if (req.user) return req.user;
  // Dev-shortcut fallback user so endpoints work without JWT/auth.
  return { _id: new mongoose.Types.ObjectId('000000000000000000000001'), role: 'admin' };
}

function resolveRequestOrigin(req) {
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'http')
    .split(',')[0]
    .trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '')
    .split(',')[0]
    .trim();
  if (!host) return '';
  return `${proto}://${host}`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildCollaborationConsentHtml(context = {}, token = '') {
  const proposal = context.proposal || {};
  const status = String(context.status || 'pending');
  const canRespond = Boolean(context.canRespond);
  const signatureData = escapeHtml(context.signatureData || '');
  const tokenSafe = escapeHtml(token || '');
  const statusLabelMap = {
    pending: 'Pending response',
    accepted: 'Accepted',
    rejected: 'Rejected',
    expired: 'Expired',
    email_missing: 'Email missing'
  };
  const statusLabel = statusLabelMap[status] || status;
  const roleLabel = escapeHtml(context.participantRole || '-');
  const participantName = escapeHtml(context.participantName || '-');
  const participantEmail = escapeHtml(context.participantEmail || '-');
  const respondedAt = escapeHtml(context.respondedAt ? new Date(context.respondedAt).toISOString().replace('T', ' ').slice(0, 16) : '-');
  const decisionNote = escapeHtml(context.decisionNote || '-');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Collaboration Consent</title>
    <style>
      :root { --bg: #f5f7fb; --card: #ffffff; --text: #1f2937; --muted: #6b7280; --accent: #1d4ed8; --danger: #b91c1c; --ok: #047857; }
      body { margin: 0; font-family: "Segoe UI", Tahoma, Arial, sans-serif; background: var(--bg); color: var(--text); }
      .wrap { max-width: 980px; margin: 24px auto; padding: 0 14px; }
      .card { background: var(--card); border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; margin-bottom: 14px; box-shadow: 0 3px 14px rgba(0,0,0,0.04); }
      .title { margin: 0 0 10px; font-size: 24px; }
      .muted { color: var(--muted); }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; }
      .kv { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; }
      .kv b { display: block; margin-bottom: 4px; color: #111827; }
      .preview { white-space: pre-wrap; line-height: 1.55; background: #fbfdff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; margin-top: 8px; }
      .status { display: inline-block; padding: 6px 10px; border-radius: 999px; font-size: 13px; font-weight: 600; border: 1px solid #d1d5db; }
      .status.pending { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
      .status.accepted { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
      .status.rejected, .status.expired { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
      .action-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
      button { border: 0; border-radius: 8px; padding: 10px 14px; cursor: pointer; font-weight: 600; }
      .btn-primary { background: var(--accent); color: #fff; }
      .btn-danger { background: var(--danger); color: #fff; }
      .btn-ghost { background: #eef2ff; color: #1d4ed8; }
      .canvas-wrap { border: 1px dashed #9ca3af; border-radius: 10px; background: #fff; width: 100%; max-width: 540px; }
      canvas { width: 100%; height: 180px; display: block; touch-action: none; }
      .note { font-size: 13px; color: var(--muted); margin-top: 8px; }
      .alert { margin-top: 12px; border-radius: 8px; padding: 10px 12px; border: 1px solid #d1d5db; background: #f8fafc; }
      .alert.ok { border-color: #a7f3d0; background: #ecfdf5; color: #065f46; }
      .alert.error { border-color: #fecaca; background: #fef2f2; color: #991b1b; }
      .sig-preview { max-height: 140px; border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 8px; background: #fff; }
      input[type="file"] { margin-top: 8px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <h1 class="title">Research Collaboration Consent</h1>
        <p class="muted">Please review proposal details before signing.</p>
        <div class="grid">
          <div class="kv"><b>Status</b><span class="status ${escapeHtml(status)}">${escapeHtml(statusLabel)}</span></div>
          <div class="kv"><b>Your role</b>${roleLabel}</div>
          <div class="kv"><b>Your name</b>${participantName}</div>
          <div class="kv"><b>Your email</b>${participantEmail}</div>
        </div>
      </div>

      <div class="card">
        <h2 class="title" style="font-size:20px">Proposal Summary</h2>
        <div class="grid">
          <div class="kv"><b>Proposal code</b>${escapeHtml(proposal.proposalCode || '-')}</div>
          <div class="kv"><b>Submitted at</b>${escapeHtml(proposal.submittedAtText || '-')}</div>
          <div class="kv"><b>Project leader</b>${escapeHtml(proposal.projectLeaderName || '-')}</div>
          <div class="kv"><b>Funding type</b>${escapeHtml(proposal.fundingType || '-')}</div>
        </div>
        <div class="kv" style="margin-top:10px"><b>Project title</b>${escapeHtml(proposal.projectTitle || '-')}</div>
        <div class="kv" style="margin-top:10px"><b>Abstract / Problem significance</b><div class="preview">${escapeHtml(proposal.abstractPreview || '-')}</div></div>
        <div class="kv" style="margin-top:10px"><b>Objectives</b><div class="preview">${escapeHtml(proposal.objectivePreview || '-')}</div></div>
      </div>

      <div class="card">
        <h2 class="title" style="font-size:20px">Your Decision</h2>
        ${canRespond ? `
          <div class="canvas-wrap"><canvas id="signatureCanvas"></canvas></div>
          <div class="action-row">
            <button type="button" class="btn-ghost" id="clearBtn">Clear signature</button>
          </div>
          <div class="note">You can draw signature above, or upload image instead.</div>
          <input id="signatureUpload" type="file" accept="image/*" />
          <img id="uploadPreview" class="sig-preview" style="display:none" alt="Uploaded signature preview" />
          <div class="action-row">
            <button type="button" class="btn-primary" id="acceptBtn">Accept and Sign</button>
            <button type="button" class="btn-danger" id="rejectBtn">Reject</button>
          </div>
          <div id="feedback" class="alert" style="display:none"></div>
        ` : `
          <div class="alert ${status === 'accepted' ? 'ok' : status === 'rejected' ? 'error' : ''}">
            This request is already finalized with status: <b>${escapeHtml(statusLabel)}</b><br/>
            Responded at: <b>${respondedAt}</b><br/>
            Note: <b>${decisionNote}</b>
          </div>
          ${signatureData ? `<img class="sig-preview" src="${signatureData}" alt="Signature image" />` : ''}
        `}
      </div>
    </div>

    ${canRespond ? `
    <script>
      (function () {
        const token = "${tokenSafe}";
        const canvas = document.getElementById('signatureCanvas');
        const ctx = canvas.getContext('2d');
        const clearBtn = document.getElementById('clearBtn');
        const acceptBtn = document.getElementById('acceptBtn');
        const rejectBtn = document.getElementById('rejectBtn');
        const feedback = document.getElementById('feedback');
        const uploadInput = document.getElementById('signatureUpload');
        const uploadPreview = document.getElementById('uploadPreview');
        let drawing = false;
        let drawn = false;
        let uploadedSignature = '';

        function resizeCanvas() {
          const ratio = window.devicePixelRatio || 1;
          const width = canvas.clientWidth || 540;
          const height = 180;
          canvas.width = Math.floor(width * ratio);
          canvas.height = Math.floor(height * ratio);
          ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.strokeStyle = '#111827';
        }

        function pointFromEvent(event) {
          const rect = canvas.getBoundingClientRect();
          const source = event.touches && event.touches[0] ? event.touches[0] : event;
          return {
            x: source.clientX - rect.left,
            y: source.clientY - rect.top
          };
        }

        function start(event) {
          drawing = true;
          const p = pointFromEvent(event);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          event.preventDefault();
        }

        function move(event) {
          if (!drawing) return;
          const p = pointFromEvent(event);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          drawn = true;
          event.preventDefault();
        }

        function end(event) {
          drawing = false;
          event.preventDefault();
        }

        function setFeedback(type, text) {
          feedback.style.display = 'block';
          feedback.className = 'alert ' + (type === 'ok' ? 'ok' : 'error');
          feedback.textContent = text;
        }

        async function submitDecision(decision) {
          let signatureData = '';
          if (decision === 'accept') {
            if (uploadedSignature) {
              signatureData = uploadedSignature;
            } else if (drawn) {
              signatureData = canvas.toDataURL('image/png');
            } else {
              setFeedback('error', 'Please provide your signature before accepting.');
              return;
            }
          }

          acceptBtn.disabled = true;
          rejectBtn.disabled = true;
          clearBtn.disabled = true;

          try {
            const response = await fetch('/api/v1/proposals/collaboration-consent/respond', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: token,
                decision: decision,
                signatureData: signatureData
              })
            });
            const payload = await response.json();
            if (!response.ok || !payload || payload.success === false) {
              throw new Error((payload && payload.message) || 'Cannot submit decision');
            }
            const finalStatus = payload && payload.data && payload.data.status ? payload.data.status : (decision === 'accept' ? 'accepted' : 'rejected');
            setFeedback('ok', 'Saved successfully. Status: ' + finalStatus + '. You can close this page.');
          } catch (error) {
            setFeedback('error', error && error.message ? error.message : 'Failed to submit decision');
            acceptBtn.disabled = false;
            rejectBtn.disabled = false;
            clearBtn.disabled = false;
          }
        }

        uploadInput.addEventListener('change', function (event) {
          const file = event.target && event.target.files ? event.target.files[0] : null;
          if (!file) return;
          const reader = new FileReader();
          reader.onload = function (e) {
            uploadedSignature = String(e.target && e.target.result ? e.target.result : '');
            if (uploadedSignature) {
              uploadPreview.src = uploadedSignature;
              uploadPreview.style.display = 'block';
            }
          };
          reader.readAsDataURL(file);
        });

        clearBtn.addEventListener('click', function () {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawn = false;
          uploadedSignature = '';
          uploadInput.value = '';
          uploadPreview.style.display = 'none';
          uploadPreview.src = '';
        });

        acceptBtn.addEventListener('click', function () { submitDecision('accept'); });
        rejectBtn.addEventListener('click', function () { submitDecision('reject'); });

        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mousemove', move);
        canvas.addEventListener('mouseup', end);
        canvas.addEventListener('mouseleave', end);
        canvas.addEventListener('touchstart', start, { passive: false });
        canvas.addEventListener('touchmove', move, { passive: false });
        canvas.addEventListener('touchend', end, { passive: false });
        canvas.addEventListener('touchcancel', end, { passive: false });
        window.addEventListener('resize', resizeCanvas);

        resizeCanvas();
      })();
    </script>
    ` : ''}
  </body>
</html>`;
}

exports.create = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const proposal = await service.createProposal(req.body, user);
    return jsonResponse(res, { success: true, message: 'Proposal created', data: proposal });
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const result = await service.getProposalList(req.query, user);
    return jsonResponse(res, { success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const proposal = await service.getProposalById(req.params.id, user);
    if (!proposal) return res.status(404).json({ success: false, message: 'Not found' });
    return jsonResponse(res, { success: true, data: proposal });
  } catch (err) {
    next(err);
  }
};

exports.updateDraft = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const proposal = await service.updateDraftProposal(req.params.id, req.body, user);
    return jsonResponse(res, { success: true, message: 'Draft updated', data: proposal });
  } catch (err) {
    next(err);
  }
};

exports.deleteDraft = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const proposal = await service.deleteDraftProposal(req.params.id, user);
    return jsonResponse(res, { success: true, message: 'Draft deleted', data: proposal });
  } catch (err) {
    if (err && err.message === 'Forbidden') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next(err);
  }
};

exports.submit = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const proposal = await service.submitProposal(req.params.id, user, {
      requestOrigin: resolveRequestOrigin(req)
    });
    return jsonResponse(res, { success: true, message: 'Proposal submitted', data: proposal });
  } catch (err) {
    next(err);
  }
};

exports.resubmit = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const proposal = await service.resubmitProposal(req.params.id, user);
    return jsonResponse(res, { success: true, message: 'Proposal resubmitted', data: proposal });
  } catch (err) {
    if (err && err.message === 'Forbidden') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next(err);
  }
};

exports.changeStatus = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    console.log('[Proposal.changeStatus] method:', req.method);
    console.log('[Proposal.changeStatus] url:', req.originalUrl);
    console.log('[Proposal.changeStatus] proposalId:', req.params.id);
    console.log('[Proposal.changeStatus] body:', req.body);
    console.log('[Proposal.changeStatus] role:', user && user.role);
    console.log('[Proposal.changeStatus] email:', user && user.email);

    const { toStatus, remark } = req.body;
    const proposal = await service.changeProposalStatus(req.params.id, toStatus, remark, user);
    return jsonResponse(res, { success: true, message: 'Status changed', data: proposal });
  } catch (err) {
    next(err);
  }
};

exports.assignCommittee = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const { committeeIds } = req.body;
    const proposal = await service.assignCommittee(req.params.id, committeeIds, user);
    return jsonResponse(res, { success: true, message: 'Committee assigned', data: proposal });
  } catch (err) {
    next(err);
  }
};

exports.saveReview = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const review = await service.saveReview(req.params.id, req.body, user);
    return jsonResponse(res, { success: true, message: 'Review saved', data: review });
  } catch (err) {
    if (err && err.message === 'REVIEW_ALREADY_SUBMITTED') {
      return res.status(409).json({ success: false, message: 'Review already submitted' });
    }
    if (err && err.message === 'Forbidden') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (err && err.message === 'Unauthorized') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    next(err);
  }
};

exports.myReview = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const roundNo = req.query && req.query.roundNo ? req.query.roundNo : 1;
    const review = await service.getMyReview(req.params.id, roundNo, user);
    return jsonResponse(res, { success: true, data: review });
  } catch (err) {
    next(err);
  }
};

exports.myReviews = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const result = await service.getMyReviews(req.query || {}, user);
    return jsonResponse(res, { success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.listProposalReviews = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const reviews = await service.getProposalReviews(req.params.id, req.query || {});
    return jsonResponse(res, { success: true, data: reviews });
  } catch (err) {
    next(err);
  }
};

exports.proposalFeedback = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const feedback = await service.getProposalFeedback(req.params.id, user);
    return jsonResponse(res, { success: true, data: feedback });
  } catch (err) {
    if (err && err.message === 'Forbidden') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next(err);
  }
};

exports.listResearcherUsers = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const rows = await service.getResearcherUsers(req.query || {}, user);
    return jsonResponse(res, { success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.listCommitteeUsers = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const rows = await service.getCommitteeUsers(req.query || {});
    return jsonResponse(res, { success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.dashboardSummary = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const summary = await service.getDashboardSummary(user);
    return jsonResponse(res, { success: true, data: summary });
  } catch (err) {
    next(err);
  }
};

// ResearchForm attachments: store binary in MongoDB (GridFS) and keep metadata in formSnapshotJson.files
exports.uploadFormFile = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const row = await formFileService.uploadFormFile({
      proposalId: req.params.id,
      file: req.file,
      type: req.body && req.body.type,
      note: req.body && req.body.note,
      user
    });
    return jsonResponse(res, { success: true, message: 'File uploaded', data: row });
  } catch (err) {
    if (err && err.message === 'Forbidden') return res.status(403).json({ success: false, message: 'Forbidden' });
    if (err && err.message === 'Unauthorized') return res.status(401).json({ success: false, message: 'Unauthorized' });
    next(err);
  }
};

exports.listFormFiles = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const rows = await formFileService.listFormFiles({ proposalId: req.params.id, user });
    return jsonResponse(res, { success: true, data: rows });
  } catch (err) {
    if (err && err.message === 'Forbidden') return res.status(403).json({ success: false, message: 'Forbidden' });
    if (err && err.message === 'Unauthorized') return res.status(401).json({ success: false, message: 'Unauthorized' });
    next(err);
  }
};

exports.downloadFormFile = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const fileDoc = await formFileService.getFormFileDoc({
      proposalId: req.params.id,
      fileId: req.params.fileId,
      user
    });

    if (!mongoose.mongo || !mongoose.mongo.GridFSBucket) {
      throw new Error('GridFSBucket is unavailable from mongoose driver');
    }
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: formFileService.BUCKET_NAME
    });

    const md = (fileDoc && fileDoc.metadata) || {};
    const originalName = md.originalName || fileDoc.filename || 'file';
    const contentType = fileDoc.contentType || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);

    return bucket.openDownloadStream(fileDoc._id).pipe(res);
  } catch (err) {
    if (err && err.message === 'Forbidden') return res.status(403).json({ success: false, message: 'Forbidden' });
    if (err && err.message === 'Unauthorized') return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (err && err.message === 'File not found') return res.status(404).json({ success: false, message: 'Not found' });
    next(err);
  }
};

exports.deleteFormFile = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    const result = await formFileService.deleteFormFile({
      proposalId: req.params.id,
      fileId: req.params.fileId,
      user
    });
    return jsonResponse(res, { success: true, message: 'File deleted', data: result });
  } catch (err) {
    if (err && err.message === 'Forbidden') return res.status(403).json({ success: false, message: 'Forbidden' });
    if (err && err.message === 'Unauthorized') return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (err && err.message === 'File not found') return res.status(404).json({ success: false, message: 'Not found' });
    next(err);
  }
};

exports.listCollaborationConfirmations = async (req, res, next) => {
  try {
    const user = getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const data = await collaborationConfirmationService.listCollaborationConfirmationsByProposal({
      proposalId: req.params.id,
      user
    });

    return jsonResponse(res, { success: true, data });
  } catch (err) {
    if (err && err.message === 'Forbidden') return res.status(403).json({ success: false, message: 'Forbidden' });
    if (err && err.message === 'Proposal not found') return res.status(404).json({ success: false, message: 'Not found' });
    next(err);
  }
};

exports.renderCollaborationConsentPage = async (req, res, next) => {
  try {
    const token = req.query && req.query.token ? req.query.token : '';
    const context = await collaborationConfirmationService.getConsentContextByToken(token);
    const html = buildCollaborationConsentHtml(context, token);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    const message = err && err.message ? err.message : 'Unable to open consent page';
    const safeMessage = escapeHtml(message);
    return res.status(400).send(`<!doctype html><html><body style="font-family:Arial,sans-serif;padding:20px"><h2>Cannot open consent page</h2><p>${safeMessage}</p></body></html>`);
  }
};

exports.respondCollaborationConsent = async (req, res, next) => {
  try {
    const result = await collaborationConfirmationService.respondCollaborationConfirmation({
      token: req.body && req.body.token ? req.body.token : '',
      decision: req.body && req.body.decision ? req.body.decision : '',
      signatureData: req.body && req.body.signatureData ? req.body.signatureData : '',
      note: req.body && req.body.note ? req.body.note : '',
      ipAddress: req.ip || '',
      userAgent: req.headers && req.headers['user-agent'] ? req.headers['user-agent'] : ''
    });

    return jsonResponse(res, {
      success: true,
      message: 'Collaboration confirmation response saved',
      data: result
    });
  } catch (err) {
    const message = err && err.message ? err.message : 'Unable to save response';
    if (message === 'Confirmation not found') return res.status(404).json({ success: false, message });
    if (message === 'Token is required' || message === 'Token is invalid' || message === 'Decision is invalid') {
      return res.status(400).json({ success: false, message });
    }
    if (message === 'Signature is required' || message === 'Signature format is invalid' || message === 'Signature payload is too large') {
      return res.status(400).json({ success: false, message });
    }
    if (message.startsWith('Confirmation already')) {
      return res.status(409).json({ success: false, message });
    }
    next(err);
  }
};
