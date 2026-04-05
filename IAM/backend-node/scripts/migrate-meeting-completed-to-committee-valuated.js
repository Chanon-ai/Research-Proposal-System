'use strict';

const mongoose = require('mongoose');
const cfg = require('../config/config');

const Proposal = require('../server/Project/Proposal/models/Proposal');
const ProposalStatusLog = require('../server/Project/Proposal/models/ProposalStatusLog');
const Notification = require('../server/Project/Proposal/models/Notification');
const SystemSetting = require('../server/Project/settings/models/system-setting.model');
const EmailLog = require('../server/Project/settings/models/email-log.model');

const LEGACY_STATUS = 'meeting_completed';
const NEXT_STATUS = 'committee_valuated';
const WORKFLOW_SETTING_KEY = 'proposal_workflow_config_json';

function replaceLegacyStatusDeep(value) {
  if (Array.isArray(value)) {
    return value.map(replaceLegacyStatusDeep);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value).reduce((acc, key) => {
      const normalizedKey = key === LEGACY_STATUS ? NEXT_STATUS : key;
      acc[normalizedKey] = replaceLegacyStatusDeep(value[key]);
      return acc;
    }, {});
  }

  return value === LEGACY_STATUS ? NEXT_STATUS : value;
}

async function run() {
  await mongoose.connect(cfg.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

  const [proposalResult, statusLogToResult, statusLogFromResult, notificationEventResult, emailLogResult] = await Promise.all([
    Proposal.updateMany({ currentStatus: LEGACY_STATUS }, { $set: { currentStatus: NEXT_STATUS } }),
    ProposalStatusLog.updateMany({ toStatus: LEGACY_STATUS }, { $set: { toStatus: NEXT_STATUS } }),
    ProposalStatusLog.updateMany({ fromStatus: LEGACY_STATUS }, { $set: { fromStatus: NEXT_STATUS } }),
    Notification.updateMany({ eventKey: LEGACY_STATUS }, { $set: { eventKey: NEXT_STATUS } }),
    EmailLog.updateMany({ eventKey: LEGACY_STATUS }, { $set: { eventKey: NEXT_STATUS } })
  ]);

  const [notificationPayloadResult, workflowSetting] = await Promise.all([
    Notification.find({
      $or: [
        { 'payload.toStatus': LEGACY_STATUS },
        { 'payload.fromStatus': LEGACY_STATUS }
      ]
    }),
    SystemSetting.findOne({ key: WORKFLOW_SETTING_KEY, isDeleted: { $ne: true } })
  ]);

  let notificationPayloadModified = 0;
  for (const notification of notificationPayloadResult) {
    const nextPayload = replaceLegacyStatusDeep(notification.payload || {});
    if (JSON.stringify(nextPayload) === JSON.stringify(notification.payload || {})) continue;
    notification.payload = nextPayload;
    await notification.save();
    notificationPayloadModified += 1;
  }

  let workflowSettingUpdated = false;
  if (workflowSetting) {
    const nextValue = replaceLegacyStatusDeep(workflowSetting.value || {});
    if (JSON.stringify(nextValue) !== JSON.stringify(workflowSetting.value || {})) {
      workflowSetting.value = nextValue;
      await workflowSetting.save();
      workflowSettingUpdated = true;
    }
  }

  console.log(JSON.stringify({
    proposalResult: {
      matched: proposalResult.matchedCount,
      modified: proposalResult.modifiedCount
    },
    proposalStatusLogToResult: {
      matched: statusLogToResult.matchedCount,
      modified: statusLogToResult.modifiedCount
    },
    proposalStatusLogFromResult: {
      matched: statusLogFromResult.matchedCount,
      modified: statusLogFromResult.modifiedCount
    },
    notificationEventResult: {
      matched: notificationEventResult.matchedCount,
      modified: notificationEventResult.modifiedCount
    },
    notificationPayloadModified,
    emailLogResult: {
      matched: emailLogResult.matchedCount,
      modified: emailLogResult.modifiedCount
    },
    workflowSettingUpdated
  }, null, 2));

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch (disconnectError) {}
  process.exit(1);
});