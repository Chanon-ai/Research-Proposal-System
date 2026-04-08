const Meeting = require('../models/Meeting');
const Proposal = require('../models/Proposal');
const ProposalStatusLog = require('../models/ProposalStatusLog');
const Notification = require('../models/Notification');
const User = require('../../Auth/models/User');
const STATUS = require('../constants/proposal-status');
const { sendWorkflowEventEmails } = require('./workflow-notification.service');

const MEETING_SOURCE_PROPOSAL_STATUSES = new Set([
  STATUS.OFFICE_RECEIVED,
  STATUS.MEETING_COMPLETED
]);

function normalizeProposalStatusValue(status) {
  return STATUS.normalizeStatus(status);
}

function buildProposalStatusSnapshotMap(meeting = {}) {
  return new Map(
    (Array.isArray(meeting.proposalStatusSnapshots) ? meeting.proposalStatusSnapshots : [])
      .map((row) => {
        const proposalId = String(row && row.proposalId ? row.proposalId : '').trim();
        const previousStatus = normalizeProposalStatusValue(row && row.previousStatus ? row.previousStatus : '');
        return proposalId && previousStatus ? [proposalId, previousStatus] : null;
      })
      .filter(Boolean)
  );
}

async function applyMeetingManagedProposalStatuses(meeting, user, proposalIds, existingSnapshots = new Map()) {
  const normalizedProposalIds = normalizeIds(proposalIds);
  if (normalizedProposalIds.length === 0) return [];

  const proposals = await Proposal.find({
    _id: { $in: normalizedProposalIds },
    isDeleted: { $ne: true }
  });

  if (proposals.length !== normalizedProposalIds.length) {
    throw new Error('ไม่พบโครงการบางรายการที่เลือกสำหรับการประชุม');
  }

  const proposalById = new Map(proposals.map((proposal) => [String(proposal._id), proposal]));
  const snapshots = [];

  for (const proposalId of normalizedProposalIds) {
    const proposal = proposalById.get(String(proposalId));
    if (!proposal) continue;

    const currentStatus = normalizeProposalStatusValue(proposal.currentStatus);
    const existingPreviousStatus = existingSnapshots.get(String(proposal._id)) || '';
    const previousStatus = existingPreviousStatus || currentStatus;

    if (!existingPreviousStatus && !MEETING_SOURCE_PROPOSAL_STATUSES.has(currentStatus)) {
      throw new Error('เลือกได้เฉพาะโครงการที่มีสถานะส่วนบริหารรับแล้ว หรือ ส่วนบริหารกำลังจัดเตรียมผล');
    }

    if (currentStatus !== STATUS.MEETING_IN_PROGRESS) {
      proposal.currentStatus = STATUS.MEETING_IN_PROGRESS;
      proposal.updatedBy = user._id;
      await proposal.save();

      await new ProposalStatusLog({
        proposalId: proposal._id,
        fromStatus: currentStatus,
        toStatus: STATUS.MEETING_IN_PROGRESS,
        actionKey: 'meeting_in_progress',
        remark: `Meeting: ${meeting.title}`,
        roundNo: proposal.currentRound || 1,
        changedBy: user._id
      }).save();
    }

    snapshots.push({
      proposalId: proposal._id,
      previousStatus
    });
  }

  return snapshots;
}

async function restoreManagedProposalStatuses(meeting, user, targetProposalIds = []) {
  const snapshotMap = buildProposalStatusSnapshotMap(meeting);
  const normalizedTargetIds = normalizeIds(targetProposalIds);
  const proposalIdsToRestore = normalizedTargetIds.length > 0
    ? normalizedTargetIds.filter((proposalId) => snapshotMap.has(String(proposalId)))
    : Array.from(snapshotMap.keys());

  if (proposalIdsToRestore.length === 0) {
    return Array.from(snapshotMap.entries()).map(([proposalId, previousStatus]) => ({ proposalId, previousStatus }));
  }

  const proposals = await Proposal.find({
    _id: { $in: proposalIdsToRestore },
    isDeleted: { $ne: true }
  });
  const proposalById = new Map(proposals.map((proposal) => [String(proposal._id), proposal]));

  for (const proposalId of proposalIdsToRestore) {
    const previousStatus = snapshotMap.get(String(proposalId));
    const proposal = proposalById.get(String(proposalId));
    if (!proposal || !previousStatus) continue;

    const currentStatus = normalizeProposalStatusValue(proposal.currentStatus);
    if (currentStatus !== STATUS.MEETING_IN_PROGRESS) continue;

    proposal.currentStatus = previousStatus;
    proposal.updatedBy = user._id;
    await proposal.save();

    await new ProposalStatusLog({
      proposalId: proposal._id,
      fromStatus: STATUS.MEETING_IN_PROGRESS,
      toStatus: previousStatus,
      actionKey: 'meeting_status_restored',
      remark: `Meeting: ${meeting.title}`,
      roundNo: proposal.currentRound || 1,
      changedBy: user._id
    }).save();
  }

  return Array.from(snapshotMap.entries())
    .filter(([proposalId]) => !proposalIdsToRestore.includes(String(proposalId)))
    .map(([proposalId, previousStatus]) => ({ proposalId, previousStatus }));
}

function normalizePagination(query = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 9, 1), 200);
  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
}

function toDateInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function normalizeIds(values = []) {
  return (Array.isArray(values) ? values : [])
    .map(item => String(item || '').trim())
    .filter(Boolean);
}

async function resolveMeetingParticipants(proposalIds = [], participantIds = []) {
  const merged = new Set(normalizeIds(participantIds));
  let proposals = [];

  const normalizedProposalIds = normalizeIds(proposalIds);
  if (normalizedProposalIds.length > 0) {
    proposals = await Proposal.find({
      _id: { $in: normalizedProposalIds },
      isDeleted: { $ne: true }
    }).select('_id applicantUserId committeeIds');

    proposals.forEach((proposal) => {
      if (proposal && proposal.applicantUserId) {
        merged.add(String(proposal.applicantUserId));
      }
      (proposal && Array.isArray(proposal.committeeIds) ? proposal.committeeIds : []).forEach((userId) => {
        merged.add(String(userId));
      });
    });
  }

  return {
    participantIds: Array.from(merged),
    proposals
  };
}

function mapMeeting(row) {
  const meeting = row && row.toObject ? row.toObject() : { ...(row || {}) };
  const normalizedVideoLink = meeting.videoLink ? String(meeting.videoLink).trim() : '';
  const normalizedLocation = meeting.location ? String(meeting.location).trim() : '';
  const locationLooksOnline = /online|zoom|teams|meet|webex/i.test(normalizedLocation) || /^https?:\/\//i.test(normalizedLocation);
  const inferredType = (normalizedVideoLink || locationLooksOnline) ? 'online' : 'onsite';
  return {
    _id: meeting._id,
    title: meeting.title || '',
    meetingDate: toDateInputValue(meeting.meetingDate),
    startTime: meeting.startTime || '',
    endTime: meeting.endTime || '',
    location: meeting.location || '',
    videoLink: meeting.videoLink || '',
    meetingType: meeting.meetingType || inferredType,
    agenda: meeting.agenda || '',
    status: meeting.status || 'scheduled',
    proposalIds: Array.isArray(meeting.proposalIds) ? meeting.proposalIds.map(item => String(item)) : [],
    participantIds: Array.isArray(meeting.participantIds) ? meeting.participantIds.map(item => String(item)) : [],
    minutes: meeting.minutes || '',
    decisions: meeting.decisions || '',
    actionItems: Array.isArray(meeting.actionItems) ? meeting.actionItems : [],
    createdAt: meeting.createdAt || null,
    updatedAt: meeting.updatedAt || null
  };
}

function normalizeMeetingType(value, meeting) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'online' || raw === 'onsite') return raw;
  const videoLink = meeting && meeting.videoLink ? String(meeting.videoLink).trim() : '';
  const location = meeting && meeting.location ? String(meeting.location).trim() : '';
  const locationLooksOnline = /online|zoom|teams|meet|webex/i.test(location) || /^https?:\/\//i.test(location);
  return (videoLink || locationLooksOnline) ? 'online' : 'onsite';
}

function validateMeetingTypeRequirements({ meetingType, location, videoLink }) {
  const type = String(meetingType || '').trim().toLowerCase();
  const loc = location ? String(location).trim() : '';
  const link = videoLink ? String(videoLink).trim() : '';
  if (type === 'onsite' && !loc) {
    throw new Error('การประชุมแบบออนไซต์ต้องระบุสถานที่');
  }
  if (type === 'online' && !link) {
    throw new Error('การประชุมแบบออนไลน์ต้องระบุลิงก์วิดีโอประชุม');
  }
}

async function listMeetings(query = {}, user) {
  const filter = {
    isDeleted: { $ne: true }
  };

  const truthy = (v) => String(v || '').toLowerCase() === '1' || String(v || '').toLowerCase() === 'true';
  const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parseYmd = (s) => {
    if (!s) return null;
    const d = new Date(String(s));
    if (Number.isNaN(d.getTime())) return null;
    // Normalize to local start-of-day to make range filters stable.
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  if (query.status) {
    filter.status = String(query.status).trim();
  }

  // Optional date range filtering: fromDate/toDate (YYYY-MM-DD) or upcoming=1 (from today, scheduled only).
  const fromDate = parseYmd(query.fromDate);
  const toDateRaw = parseYmd(query.toDate);
  const isUpcoming = truthy(query.upcoming);

  if (isUpcoming && !query.status) {
    filter.status = 'scheduled';
  }

  if (fromDate || toDateRaw || isUpcoming) {
    const range = {};
    const start = fromDate || (isUpcoming ? new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) : null);
    if (start) range.$gte = start;

    if (toDateRaw) {
      // inclusive end-of-day
      const end = new Date(toDateRaw.getFullYear(), toDateRaw.getMonth(), toDateRaw.getDate(), 23, 59, 59, 999);
      range.$lte = end;
    } else if (isUpcoming) {
      // default upcoming window: next 30 days
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30, 23, 59, 59, 999);
      range.$lte = end;
    }

    filter.meetingDate = range;
  }

  // Access control: committee/researcher see only meetings related to them.
  // Related means: explicitly listed in participantIds OR attached to proposals where user is applicant/committee.
  if (user && user._id && user.role && !['admin', 'chairman'].includes(user.role)) {
    const orFilters = [{ participantIds: user._id }];

    const proposalOr = [];
    if (user.role === 'researcher') {
      proposalOr.push({ applicantUserId: user._id });
    } else {
      proposalOr.push({ applicantUserId: user._id });
      proposalOr.push({ committeeIds: user._id });
    }

    if (proposalOr.length) {
      const relatedProposals = await Proposal.find({
        isDeleted: { $ne: true },
        $or: proposalOr
      }).select('_id');
      const proposalIds = (relatedProposals || []).map(p => p._id);
      if (proposalIds.length) {
        orFilters.push({ proposalIds: { $in: proposalIds } });
      }
    }

    filter.$or = orFilters;
  }

  const keyword = (query.keyword || query.search || query.q || '').toString().trim();
  if (keyword) {
    const safe = escapeRegExp(keyword);
    const re = new RegExp(safe, 'i');
    const orFilters = [
      { title: re },
      { agenda: re },
      { location: re },
      { videoLink: re }
    ];

    const keywordDate = parseYmd(keyword);
    if (keywordDate) {
      const end = new Date(keywordDate.getFullYear(), keywordDate.getMonth(), keywordDate.getDate(), 23, 59, 59, 999);
      orFilters.push({ meetingDate: { $gte: keywordDate, $lte: end } });
    }

    filter.$and = filter.$and || [];
    filter.$and.push({ $or: orFilters });
  }

  const { page, limit, skip } = normalizePagination(query);

  const sort = isUpcoming
    ? { meetingDate: 1, startTime: 1, _id: 1 }
    : { meetingDate: -1, startTime: 1, _id: -1 };

  const [rows, total] = await Promise.all([
    Meeting.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Meeting.countDocuments(filter)
  ]);

  const items = (rows || []).map(mapMeeting);

  return {
    meetings: items,
    items,
    data: items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}

async function getMeetingsSummary(query = {}, user) {
  const filter = {
    isDeleted: { $ne: true }
  };

  const truthy = (v) => String(v || '').toLowerCase() === '1' || String(v || '').toLowerCase() === 'true';
  const parseYmd = (s) => {
    if (!s) return null;
    const d = new Date(String(s));
    if (Number.isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  // Intentionally ignore query.status for summary counts so tiles remain stable while filtering.
  const fromDate = parseYmd(query.fromDate);
  const toDateRaw = parseYmd(query.toDate);
  const isUpcoming = truthy(query.upcoming);

  if (fromDate || toDateRaw || isUpcoming) {
    const range = {};
    const start = fromDate || (isUpcoming ? new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) : null);
    if (start) range.$gte = start;

    if (toDateRaw) {
      const end = new Date(toDateRaw.getFullYear(), toDateRaw.getMonth(), toDateRaw.getDate(), 23, 59, 59, 999);
      range.$lte = end;
    } else if (isUpcoming) {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30, 23, 59, 59, 999);
      range.$lte = end;
    }

    filter.meetingDate = range;
  }

  if (user && user._id && user.role && !['admin', 'chairman'].includes(user.role)) {
    const orFilters = [{ participantIds: user._id }];

    const proposalOr = [];
    if (user.role === 'researcher') {
      proposalOr.push({ applicantUserId: user._id });
    } else {
      proposalOr.push({ applicantUserId: user._id });
      proposalOr.push({ committeeIds: user._id });
    }

    if (proposalOr.length) {
      const relatedProposals = await Proposal.find({
        isDeleted: { $ne: true },
        $or: proposalOr
      }).select('_id');
      const proposalIds = (relatedProposals || []).map(p => p._id);
      if (proposalIds.length) {
        orFilters.push({ proposalIds: { $in: proposalIds } });
      }
    }

    filter.$or = orFilters;
  }

  const grouped = await Meeting.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const counts = {
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    total: 0
  };

  (grouped || []).forEach((row) => {
    const key = row && row._id ? String(row._id) : '';
    const count = Number(row && row.count) || 0;
    counts.total += count;
    if (key === 'scheduled') counts.scheduled += count;
    else if (key === 'completed') counts.completed += count;
    else if (key === 'cancelled') counts.cancelled += count;
  });

  return counts;
}

async function resolveMeetingRecipients(proposalIds = [], participantIds = []) {
  const recipientIds = new Set(normalizeIds(participantIds));
  let proposals = [];

  if (proposalIds.length > 0) {
    proposals = await Proposal.find({
      _id: { $in: proposalIds },
      isDeleted: { $ne: true }
    }).select('_id proposalCode projectTitleTh applicantUserId committeeIds');

    proposals.forEach((proposal) => {
      if (proposal && proposal.applicantUserId) {
        recipientIds.add(String(proposal.applicantUserId));
      }
      (proposal && Array.isArray(proposal.committeeIds) ? proposal.committeeIds : []).forEach((userId) => {
        recipientIds.add(String(userId));
      });
    });
  }

  if (recipientIds.size === 0) {
    const committeeUsers = await User.find({
      role: 'committee',
      isActive: true,
      isDeleted: { $ne: true }
    }).select('_id');
    committeeUsers.forEach((user) => recipientIds.add(String(user._id)));
  }

  return {
    recipientIds: Array.from(recipientIds),
    proposals
  };
}

async function createMeetingNotifications({ recipientIds, title, message, proposalIds = [], eventKey }) {
  if (!recipientIds.length) return [];

  const firstProposalId = proposalIds.length > 0 ? proposalIds[0] : null;
  const docs = recipientIds.map((userId) => ({
    userId,
    proposalId: firstProposalId,
    channel: 'in_app',
    eventKey,
    title,
    message,
    payload: {
      proposalIds
    },
    isRead: false,
    sentAt: new Date()
  }));

  try {
    return await Notification.insertMany(docs);
  } catch (err) {
    throw new Error(`Failed to create notification records: ${err && err.message ? err.message : err}`);
  }
}

async function createMeeting(payload = {}, user) {
  const proposalIds = normalizeIds(payload.proposalIds);
  const providedParticipantIds = normalizeIds(payload.participantIds);
  const { participantIds } = await resolveMeetingParticipants(proposalIds, providedParticipantIds);
  const meetingType = normalizeMeetingType(payload.meetingType, payload);
  validateMeetingTypeRequirements({ meetingType, location: payload.location, videoLink: payload.videoLink });

  const meeting = new Meeting({
    title: payload.title,
    meetingDate: payload.meetingDate,
    startTime: payload.startTime,
    endTime: payload.endTime || '',
    location: payload.location || '',
    videoLink: payload.videoLink || '',
    meetingType,
    agenda: payload.agenda || '',
    status: payload.status || 'scheduled',
    proposalIds,
    participantIds,
    createdBy: user._id,
    updatedBy: user._id
  });

  const saved = await meeting.save();

  if (saved.status === 'scheduled') {
    saved.proposalStatusSnapshots = await applyMeetingManagedProposalStatuses(saved, user, saved.proposalIds);
    await saved.save();
  }

  if (saved.status === 'scheduled') {
    const { recipientIds, proposals } = await resolveMeetingRecipients(saved.proposalIds, saved.participantIds);
    const proposalLabel = proposals.length > 0 ? ` สำหรับ ${proposals.length} โครงการ` : '';
    await createMeetingNotifications({
      recipientIds,
      proposalIds: saved.proposalIds,
      eventKey: 'meeting_scheduled',
      title: 'มีการนัดหมายการประชุม',
      message: `หัวข้อ ${saved.title}${proposalLabel} วันที่ ${toDateInputValue(saved.meetingDate)} เวลา ${saved.startTime || '-'}`
    });

    const emailResult = await sendWorkflowEventEmails({
      eventKey: 'meeting_scheduled',
      recipientIds,
      proposal: proposals && proposals.length > 0 ? proposals[0] : null,
      context: {
        meetingTitle: saved.title,
        meetingDate: toDateInputValue(saved.meetingDate),
        meetingTime: saved.startTime || '-',
        remarks: proposalLabel ? `เกี่ยวข้องกับ ${proposals.length} โครงการ` : ''
      }
    });

    if (emailResult && (emailResult.failed > 0 || emailResult.skippedReason)) {
      console.warn('[Meeting.create] Workflow email delivery issue:', {
        meetingId: String(saved._id),
        eventKey: 'meeting_scheduled',
        skippedReason: emailResult.skippedReason || '',
        failed: emailResult.failed || 0,
        failures: emailResult.failures || []
      });
    }
  }

  return mapMeeting(saved);
}

async function updateMeeting(id, payload = {}, user) {
  const meeting = await Meeting.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!meeting) throw new Error('Meeting not found');

  const previousStatus = String(meeting.status || '').trim().toLowerCase();
  const previousProposalIds = normalizeIds(meeting.proposalIds);
  const previousSnapshotMap = buildProposalStatusSnapshotMap(meeting);

  meeting.title = payload.title !== undefined ? payload.title : meeting.title;
  meeting.meetingDate = payload.meetingDate !== undefined ? payload.meetingDate : meeting.meetingDate;
  meeting.startTime = payload.startTime !== undefined ? payload.startTime : meeting.startTime;
  meeting.endTime = payload.endTime !== undefined ? payload.endTime : meeting.endTime;
  meeting.location = payload.location !== undefined ? payload.location : meeting.location;
  meeting.videoLink = payload.videoLink !== undefined ? payload.videoLink : meeting.videoLink;
  meeting.meetingType = payload.meetingType !== undefined ? normalizeMeetingType(payload.meetingType, payload) : normalizeMeetingType(meeting.meetingType, meeting);
  validateMeetingTypeRequirements({ meetingType: meeting.meetingType, location: meeting.location, videoLink: meeting.videoLink });
  meeting.agenda = payload.agenda !== undefined ? payload.agenda : meeting.agenda;
  meeting.status = payload.status !== undefined ? payload.status : meeting.status;

  const nextProposalIds = payload.proposalIds !== undefined
    ? normalizeIds(payload.proposalIds)
    : normalizeIds(meeting.proposalIds);
  const nextProvidedParticipantIds = payload.participantIds !== undefined
    ? normalizeIds(payload.participantIds)
    : normalizeIds(meeting.participantIds);
  const { participantIds: nextParticipantIds } = await resolveMeetingParticipants(nextProposalIds, nextProvidedParticipantIds);

  meeting.proposalIds = nextProposalIds;
  meeting.participantIds = nextParticipantIds;
  meeting.updatedBy = user._id;

  const nextStatus = String(meeting.status || '').trim().toLowerCase();
  if (nextStatus === 'scheduled') {
    const removedProposalIds = previousProposalIds.filter((proposalId) => !nextProposalIds.includes(proposalId));
    if (removedProposalIds.length > 0) {
      await restoreManagedProposalStatuses(meeting, user, removedProposalIds);
    }

    const keptSnapshotMap = new Map(
      Array.from(previousSnapshotMap.entries()).filter(([proposalId]) => nextProposalIds.includes(proposalId))
    );
    meeting.proposalStatusSnapshots = await applyMeetingManagedProposalStatuses(meeting, user, nextProposalIds, keptSnapshotMap);
  } else if (previousStatus === 'scheduled') {
    await restoreManagedProposalStatuses(meeting, user);
    meeting.proposalStatusSnapshots = [];
  }

  await meeting.save();

  if (meeting.status === 'scheduled') {
    const { recipientIds, proposals } = await resolveMeetingRecipients(meeting.proposalIds, meeting.participantIds);
    const proposalLabel = proposals.length > 0 ? ` สำหรับ ${proposals.length} โครงการ` : '';
    await createMeetingNotifications({
      recipientIds,
      proposalIds: meeting.proposalIds,
      eventKey: 'meeting_scheduled',
      title: 'มีการอัปเดตการประชุม',
      message: `หัวข้อ ${meeting.title}${proposalLabel} วันที่ ${toDateInputValue(meeting.meetingDate)} เวลา ${meeting.startTime || '-'}`
    });

    const emailResult = await sendWorkflowEventEmails({
      eventKey: 'meeting_scheduled',
      recipientIds,
      proposal: proposals && proposals.length > 0 ? proposals[0] : null,
      context: {
        meetingTitle: meeting.title,
        meetingDate: toDateInputValue(meeting.meetingDate),
        meetingTime: meeting.startTime || '-',
        remarks: proposalLabel ? `เกี่ยวข้องกับ ${proposals.length} โครงการ` : ''
      }
    });

    if (emailResult && (emailResult.failed > 0 || emailResult.skippedReason)) {
      console.warn('[Meeting.update] Workflow email delivery issue:', {
        meetingId: String(meeting._id),
        eventKey: 'meeting_scheduled',
        skippedReason: emailResult.skippedReason || '',
        failed: emailResult.failed || 0,
        failures: emailResult.failures || []
      });
    }
  }

  if (meeting.status === 'cancelled') {
    const { recipientIds } = await resolveMeetingRecipients(meeting.proposalIds, meeting.participantIds);
    await createMeetingNotifications({
      recipientIds,
      proposalIds: meeting.proposalIds,
      eventKey: 'meeting_cancelled',
      title: 'การประชุมถูกยกเลิก',
      message: `หัวข้อ ${meeting.title} ถูกยกเลิกแล้ว`
    });
  }

  return mapMeeting(meeting);
}

async function deleteMeeting(id) {
  const meeting = await Meeting.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!meeting) throw new Error('Meeting not found');

  if (String(meeting.status || '').trim().toLowerCase() === 'scheduled') {
    const systemUser = meeting.updatedBy || meeting.createdBy;
    await restoreManagedProposalStatuses(meeting, { _id: systemUser || null });
    meeting.proposalStatusSnapshots = [];
  }

  meeting.isDeleted = true;
  await meeting.save();

  return true;
}

async function updateMeetingMinutes(id, payload = {}, user) {
  const meeting = await Meeting.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!meeting) throw new Error('Meeting not found');

  meeting.minutes = payload.minutes !== undefined ? payload.minutes : meeting.minutes;
  meeting.decisions = payload.decisions !== undefined ? payload.decisions : meeting.decisions;
  meeting.actionItems = Array.isArray(payload.actionItems) ? payload.actionItems : meeting.actionItems;
  meeting.updatedBy = user._id;
  await meeting.save();

  return mapMeeting(meeting);
}

async function updateMeetingStatus(id, status, user) {
  const meeting = await Meeting.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!meeting) throw new Error('Meeting not found');

  const nextStatus = String(status || '').trim().toLowerCase();
  const previousStatus = String(meeting.status || '').trim().toLowerCase();

  if (previousStatus === 'scheduled' && nextStatus !== 'scheduled') {
    await restoreManagedProposalStatuses(meeting, user);
    meeting.proposalStatusSnapshots = [];
  } else if (previousStatus !== 'scheduled' && nextStatus === 'scheduled') {
    meeting.proposalStatusSnapshots = await applyMeetingManagedProposalStatuses(meeting, user, meeting.proposalIds, buildProposalStatusSnapshotMap(meeting));
  }

  meeting.status = nextStatus;
  meeting.updatedBy = user._id;
  await meeting.save();

  const { recipientIds } = await resolveMeetingRecipients(meeting.proposalIds, meeting.participantIds);

  if (nextStatus === 'completed') {
    await createMeetingNotifications({
      recipientIds,
      proposalIds: meeting.proposalIds,
      eventKey: 'meeting_completed',
      title: 'การประชุมเสร็จสิ้น',
      message: `การประชุม ${meeting.title} บันทึกผลเรียบร้อยแล้ว`
    });
  }

  if (nextStatus === 'cancelled') {
    await createMeetingNotifications({
      recipientIds,
      proposalIds: meeting.proposalIds,
      eventKey: 'meeting_cancelled',
      title: 'การประชุมถูกยกเลิก',
      message: `การประชุม ${meeting.title} ถูกยกเลิกแล้ว`
    });
  }

  return mapMeeting(meeting);
}

module.exports = {
  listMeetings,
  getMeetingsSummary,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  updateMeetingMinutes,
  updateMeetingStatus
};
