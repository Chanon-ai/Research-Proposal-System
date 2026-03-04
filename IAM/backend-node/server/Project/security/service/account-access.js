'use strict';

const mongo = require('mongodb');
const SecurityAssignment = require('../models/assignment.model');
const SecurityGroup = require('../models/group.model');
const SecurityPermission = require('../controller/permission');

function toObjectId(id) {
  if (!id || !mongo.ObjectId.isValid(id)) return null;
  return new mongo.ObjectId(id);
}

function pickLangValue(items) {
  if (!Array.isArray(items)) return '';
  const found = items.find(function (item) {
    return item && item.value;
  });
  return found ? String(found.value) : '';
}

function getSecurityGroupLabel(group) {
  if (!group) return '-';
  return pickLangValue(group.title) || String(group.key || '') || '-';
}

function buildPermissionMatrix(permissions) {
  const map = {};
  for (let i = 0; i < permissions.length; i++) {
    const row = permissions[i] || {};
    const path = row.menu && row.menu.path ? row.menu.path : '';
    if (!path) continue;
    if (!map[path]) {
      map[path] = { all: false, view: false, edit: false, delete: false, action: false, logs: false };
    }
    map[path].all = map[path].all || !!row.all;
    map[path].view = map[path].view || !!row.view;
    map[path].edit = map[path].edit || !!row.edit;
    map[path].delete = map[path].delete || !!row.delete;
    map[path].action = map[path].action || !!row.action;
    map[path].logs = map[path].logs || !!row.logs;
  }
  return map;
}

async function loadAssignmentsByAccountIds(accountIds) {
  const ids = Array.isArray(accountIds) ? accountIds.filter(Boolean) : [];
  if (ids.length === 0) return {};

  const rows = await SecurityAssignment.find({
    account: { $in: ids.map(function (id) { return toObjectId(id); }).filter(Boolean) },
    active: true
  })
    .populate({ path: 'group', select: 'title description visibleType' })
    .lean();

  return rows.reduce(function (acc, row) {
    const accountId = row && row.account ? String(row.account) : '';
    if (!accountId) return acc;
    if (!acc[accountId]) acc[accountId] = [];
    if (row.group) acc[accountId].push(row);
    return acc;
  }, {});
}

async function syncAccountAssignments(accountId, groupIds) {
  const normalizedAccountId = toObjectId(accountId);
  if (!normalizedAccountId) return;

  const normalizedGroupIds = Array.isArray(groupIds)
    ? Array.from(new Set(groupIds.map(function (id) {
      const objectId = toObjectId(id);
      return objectId ? String(objectId) : '';
    }).filter(Boolean)))
    : [];

  const existingAssignments = await SecurityAssignment.find({ account: normalizedAccountId }).lean();
  const activeAssignmentMap = existingAssignments.reduce(function (acc, item) {
    const key = item && item.group ? String(item.group) : '';
    if (key) acc[key] = item;
    return acc;
  }, {});

  for (let i = 0; i < normalizedGroupIds.length; i++) {
    const groupId = normalizedGroupIds[i];
    const existing = activeAssignmentMap[groupId];
    if (existing) {
      if (existing.active === false) {
        await SecurityAssignment.updateOne({ _id: existing._id }, { $set: { active: true } });
      }
      delete activeAssignmentMap[groupId];
      continue;
    }

    await SecurityAssignment.create({
      account: normalizedAccountId,
      group: toObjectId(groupId),
      active: true,
      dataScope: 'self',
      scopeUnits: []
    });
  }

  const remainingIds = Object.keys(activeAssignmentMap);
  if (remainingIds.length > 0) {
    await SecurityAssignment.updateMany(
      {
        _id: {
          $in: remainingIds
            .map(function (id) { return toObjectId(activeAssignmentMap[id] && activeAssignmentMap[id]._id); })
            .filter(Boolean)
        }
      },
      { $set: { active: false } }
    );
  }
}

async function getGroupOptions() {
  const docs = await SecurityGroup.find({})
    .select('title description visibleType')
    .lean();

  return (docs || []).map(function (item) {
    return {
      _id: item && item._id ? item._id : null,
      label: getSecurityGroupLabel(item),
      raw: item
    };
  });
}

async function getEffectivePermissions(accountId) {
  const accountObjectId = toObjectId(accountId);
  if (!accountObjectId) {
    return {
      accountId: null,
      assignments: [],
      groups: [],
      permissions: [],
      matrix: {},
      effectivePermissions: []
    };
  }

  const assignments = await SecurityAssignment.find({ account: accountObjectId, active: true })
    .populate({ path: 'group', select: 'title description visibleType' })
    .lean();

  const groupIds = assignments
    .map(function (item) { return item.group && item.group._id ? item.group._id : item.group; })
    .filter(Boolean);

  let permissionRows = [];
  if (groupIds.length > 0) {
    permissionRows = await SecurityPermission.onQuerys({ group: { $in: groupIds } });
  }

  const matrix = buildPermissionMatrix(permissionRows);
  const effectivePermissions = Object.keys(matrix)
    .sort()
    .map(function (path) {
      return Object.assign({ path: path }, matrix[path] || {});
    });

  return {
    accountId: accountObjectId,
    assignments: assignments,
    groups: assignments.map(function (item) {
      return {
        assignmentId: item && item._id ? item._id : null,
        scope: item && item.dataScope ? item.dataScope : 'self',
        active: item ? item.active !== false : true,
        group: item && item.group ? item.group : null,
        label: getSecurityGroupLabel(item && item.group ? item.group : null)
      };
    }),
    permissions: permissionRows,
    matrix: matrix,
    effectivePermissions: effectivePermissions
  };
}

module.exports = {
  getGroupOptions,
  getEffectivePermissions,
  loadAssignmentsByAccountIds,
  syncAccountAssignments
};
