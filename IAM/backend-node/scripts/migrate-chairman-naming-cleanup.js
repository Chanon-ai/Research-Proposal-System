'use strict';

const mongoose = require('mongoose');
const cfg = require('../config/config');

const User = require('../server/Project/Auth/models/User');
const SystemSetting = require('../server/Project/settings/models/system-setting.model');
const ProposalReview = require('../server/Project/Proposal/models/ProposalReview');

const LEGACY_CHAIRMAN_ROLE = 'office_chairman';
const CHAIRMAN_ROLE = 'chairman';
const LEGACY_CHAIRMAN_CHECKLIST_KEY = 'office_chairman_checklist_config_json';
const CHAIRMAN_CHECKLIST_KEY = 'chairman_checklist_config_json';
const ROLE_PAGE_ACCESS_KEY = 'research_role_page_access_config_json';
const LEGACY_CHAIRMAN_CHECKLIST_SECTION_KEY = 'office_chairman_checklist';
const CHAIRMAN_CHECKLIST_SECTION_KEY = 'chairman_checklist';

function parseJsonish(value) {
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (_) {
      return null;
    }
  }
  if (value && typeof value === 'object') return value;
  return null;
}

function serializeLikeOriginal(originalValue, normalizedValue) {
  return typeof originalValue === 'string' ? JSON.stringify(normalizedValue) : normalizedValue;
}

function normalizeRoleToken(role) {
  return String(role || '').trim().toLowerCase() === LEGACY_CHAIRMAN_ROLE
    ? CHAIRMAN_ROLE
    : String(role || '').trim().toLowerCase();
}

function normalizeRoleList(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const roles = [];
  value.forEach((role) => {
    const normalized = normalizeRoleToken(role);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    roles.push(normalized);
  });
  return roles;
}

function normalizeRolePageAccessValue(rawValue) {
  const parsed = parseJsonish(rawValue);
  if (!Array.isArray(parsed)) {
    return { changed: false, value: rawValue };
  }

  let changed = false;
  const normalized = parsed.map((row) => {
    const pageKey = String(row && row.pageKey !== undefined ? row.pageKey : '').trim();
    const path = String(row && row.path !== undefined ? row.path : '').trim();
    const roles = normalizeRoleList(row && row.roles);
    const requiredRoles = normalizeRoleList(row && row.requiredRoles);

    const nextPageKey = pageKey.replace(/^office-chairman-/, 'chairman-');
    const nextPath = path.replace(/^\/office-chairman\//, '/chairman/');

    if (nextPageKey !== pageKey || nextPath !== path) changed = true;
    if (JSON.stringify(roles) !== JSON.stringify(Array.isArray(row && row.roles) ? row.roles : [])) changed = true;
    if (JSON.stringify(requiredRoles) !== JSON.stringify(Array.isArray(row && row.requiredRoles) ? row.requiredRoles : [])) changed = true;

    return {
      ...row,
      pageKey: nextPageKey,
      path: nextPath,
      roles,
      requiredRoles
    };
  });

  return {
    changed,
    value: changed ? serializeLikeOriginal(rawValue, normalized) : rawValue
  };
}

function normalizeChairmanChecklistValue(rawValue) {
  const parsed = parseJsonish(rawValue);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { changed: false, value: rawValue };
  }

  const reviewerRole = String(parsed.reviewerRole || '').trim().toLowerCase();
  if (reviewerRole !== LEGACY_CHAIRMAN_ROLE) {
    return { changed: false, value: rawValue };
  }

  return {
    changed: true,
    value: serializeLikeOriginal(rawValue, {
      ...parsed,
      reviewerRole: CHAIRMAN_ROLE
    })
  };
}

async function migrateUsers() {
  const result = await User.updateMany(
    { role: LEGACY_CHAIRMAN_ROLE },
    { $set: { role: CHAIRMAN_ROLE } }
  );

  return {
    matched: Number(result && result.matchedCount ? result.matchedCount : 0),
    modified: Number(result && result.modifiedCount ? result.modifiedCount : 0)
  };
}

async function migrateChairmanChecklistSetting() {
  const legacy = await SystemSetting.findOne({ key: LEGACY_CHAIRMAN_CHECKLIST_KEY, isDeleted: { $ne: true } });
  const canonical = await SystemSetting.findOne({ key: CHAIRMAN_CHECKLIST_KEY, isDeleted: { $ne: true } });

  let renamed = false;
  let deletedLegacy = false;
  let updatedCanonical = false;
  let source = 'none';

  if (legacy && canonical) {
    const useLegacy = Boolean(legacy.updatedAt && canonical.updatedAt && legacy.updatedAt > canonical.updatedAt);
    const chosen = useLegacy ? legacy : canonical;
    const normalized = normalizeChairmanChecklistValue(chosen.value);
    const nextValue = normalized.changed ? normalized.value : chosen.value;

    if (useLegacy) {
      canonical.value = nextValue;
      canonical.description = legacy.description || canonical.description;
      canonical.group = legacy.group || canonical.group;
      canonical.updatedBy = legacy.updatedBy || canonical.updatedBy;
      updatedCanonical = true;
      source = 'legacy';
    } else if (normalized.changed) {
      canonical.value = nextValue;
      updatedCanonical = true;
      source = 'canonical';
    } else {
      source = 'canonical';
    }

    if (updatedCanonical) await canonical.save();
    await SystemSetting.deleteOne({ _id: legacy._id });
    deletedLegacy = true;
  } else if (legacy) {
    legacy.key = CHAIRMAN_CHECKLIST_KEY;
    const normalized = normalizeChairmanChecklistValue(legacy.value);
    if (normalized.changed) legacy.value = normalized.value;
    await legacy.save();
    renamed = true;
    source = 'legacy';
  } else if (canonical) {
    const normalized = normalizeChairmanChecklistValue(canonical.value);
    if (normalized.changed) {
      canonical.value = normalized.value;
      await canonical.save();
      updatedCanonical = true;
    }
    source = 'canonical';
  }

  return {
    source,
    renamed,
    updatedCanonical,
    deletedLegacy
  };
}

async function migrateRolePageAccessSetting() {
  const setting = await SystemSetting.findOne({ key: ROLE_PAGE_ACCESS_KEY, isDeleted: { $ne: true } });
  if (!setting) {
    return { found: false, updated: false };
  }

  const normalized = normalizeRolePageAccessValue(setting.value);
  if (!normalized.changed) {
    return { found: true, updated: false };
  }

  setting.value = normalized.value;
  await setting.save();
  return { found: true, updated: true };
}

async function migrateProposalReviews() {
  const reviews = await ProposalReview.find({ 'commentItems.sectionKey': LEGACY_CHAIRMAN_CHECKLIST_SECTION_KEY })
    .select('_id commentItems');

  let updated = 0;
  for (const review of reviews) {
    let changed = false;
    review.commentItems = (Array.isArray(review.commentItems) ? review.commentItems : []).map((item) => {
      if (!item || item.sectionKey !== LEGACY_CHAIRMAN_CHECKLIST_SECTION_KEY) return item;
      changed = true;
      return {
        ...item.toObject(),
        sectionKey: CHAIRMAN_CHECKLIST_SECTION_KEY
      };
    });

    if (!changed) continue;
    await review.save();
    updated += 1;
  }

  return {
    matched: reviews.length,
    updated
  };
}

async function run() {
  await mongoose.connect(cfg.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

  const users = await migrateUsers();
  const chairmanChecklistSetting = await migrateChairmanChecklistSetting();
  const rolePageAccessSetting = await migrateRolePageAccessSetting();
  const proposalReviews = await migrateProposalReviews();

  console.log(JSON.stringify({
    users,
    chairmanChecklistSetting,
    rolePageAccessSetting,
    proposalReviews
  }));

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});