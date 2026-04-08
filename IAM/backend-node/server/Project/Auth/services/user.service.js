const User = require('../models/User');

const USER_ROLES = ['admin', 'chairman', 'committee', 'finance_officer', 'researcher'];

function normalizeChairmanRoleToken(role) {
  return String(role || '').trim().toLowerCase();
}

function normalizePagination(query = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 200);
  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
}

function buildListFilter(query = {}) {
  const filter = {
    isDeleted: { $ne: true }
  };

  if (query.role) {
    const normalizedRole = normalizeChairmanRoleToken(query.role);
    filter.role = normalizedRole;
  }

  const department = String(query.department || '').trim();
  if (department) {
    filter.department = department;
  }

  if (query.isActive !== undefined && query.isActive !== null && query.isActive !== '') {
    const activeVal = String(query.isActive).trim().toLowerCase();
    if (['true', '1', 'active'].includes(activeVal)) filter.isActive = true;
    if (['false', '0', 'inactive'].includes(activeVal)) filter.isActive = false;
  }

  const keyword = String(query.keyword || '').trim();
  if (keyword) {
    const safe = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { fullName: new RegExp(safe, 'i') },
      { email: new RegExp(safe, 'i') },
      { role: new RegExp(safe, 'i') },
      { department: new RegExp(safe, 'i') },
      { phone: new RegExp(safe, 'i') }
    ];
  }

  return filter;
}

function sanitizeUser(userDoc) {
  const user = userDoc && userDoc.toObject ? userDoc.toObject() : { ...(userDoc || {}) };
  delete user.password;
  user.role = normalizeChairmanRoleToken(user.role);
  return user;
}

function normalizeEmail(email) {
  return String(email || '').toLowerCase().trim();
}

function assertValidRole(role) {
  if (role === undefined || role === null || role === '') return;
  const normalizedRole = normalizeChairmanRoleToken(role);
  if (!USER_ROLES.includes(normalizedRole)) {
    throw new Error(`role must be one of: ${USER_ROLES.join(', ')}`);
  }
}

function assertValidPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
  }
}

async function ensureNotLastActiveAdmin(user, actionLabel) {
  if (!user || user.role !== 'admin' || !user.isActive || user.isDeleted) return;

  const activeAdminCount = await User.countDocuments({
    role: 'admin',
    isActive: true,
    isDeleted: { $ne: true }
  });

  if (activeAdminCount <= 1) {
    throw new Error(`ไม่สามารถ${actionLabel}ได้ เพราะจะทำให้ไม่เหลือผู้ดูแลระบบที่ใช้งานอยู่`);
  }
}

async function getSummary() {
  const [totalUsers, totalCommittees, totalAdmins, totalActiveUsers] = await Promise.all([
    User.countDocuments({ isDeleted: { $ne: true } }),
    User.countDocuments({ role: { $in: ['committee', 'chairman'] }, isDeleted: { $ne: true } }),
    User.countDocuments({ role: 'admin', isDeleted: { $ne: true } }),
    User.countDocuments({ isActive: true, isDeleted: { $ne: true } })
  ]);

  return {
    totalUsers,
    totalCommittees,
    totalAdmins,
    totalActiveUsers
  };
}

async function getDepartmentOptions() {
  const rows = await User.find({ isDeleted: { $ne: true } }).select('department').lean();
  return Array.from(
    new Set(
      (rows || [])
        .map(row => String(row && row.department ? row.department : '').trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, 'th'));
}

async function listUsers(query = {}) {
  const filter = buildListFilter(query);
  const { page, limit, skip } = normalizePagination(query);

  const [users, total, summary, departments] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
    getSummary(),
    getDepartmentOptions()
  ]);

  return {
    users: (users || []).map(sanitizeUser),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    summary,
    departments
  };
}

async function getUserById(userId) {
  const user = await User.findOne({ _id: userId, isDeleted: { $ne: true } }).select('-password');
  if (!user) throw new Error('User not found');
  return sanitizeUser(user);
}

async function createUser(payload = {}) {
  const email = normalizeEmail(payload.email);
  assertValidRole(payload.role);
  assertValidPassword(payload.password);

  const exists = await User.findOne({ email, isDeleted: { $ne: true } });
  if (exists) {
    throw new Error('อีเมลนี้มีอยู่ในระบบแล้ว');
  }

  const user = new User({
    fullName: payload.fullName,
    email,
    password: payload.password,
    role: normalizeChairmanRoleToken(payload.role || 'researcher'),
    department: payload.department || '',
    phone: payload.phone || '',
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true
  });

  const saved = await user.save();
  return sanitizeUser(saved);
}

async function updateUser(userId, payload = {}) {
  const user = await User.findOne({ _id: userId, isDeleted: { $ne: true } });
  if (!user) throw new Error('User not found');

  assertValidRole(payload.role);

  if (payload.email !== undefined) {
    const nextEmail = normalizeEmail(payload.email);
    if (!nextEmail) throw new Error('อีเมลไม่ถูกต้อง');
    if (nextEmail !== String(user.email || '').toLowerCase()) {
      const exists = await User.findOne({ _id: { $ne: user._id }, email: nextEmail, isDeleted: { $ne: true } });
      if (exists) throw new Error('อีเมลนี้มีอยู่ในระบบแล้ว');
      user.email = nextEmail;
    }
  }

  const nextRole = payload.role !== undefined ? normalizeChairmanRoleToken(payload.role) : normalizeChairmanRoleToken(user.role);
  const nextIsActive = payload.isActive !== undefined ? Boolean(payload.isActive) : user.isActive;

  const willLoseLastAdmin = user.role === 'admin' && user.isActive && (nextRole !== 'admin' || !nextIsActive);
  if (willLoseLastAdmin) {
    await ensureNotLastActiveAdmin(user, 'แก้ไขผู้ดูแลระบบคนสุดท้าย');
  }

  if (payload.fullName !== undefined) user.fullName = payload.fullName;
  if (payload.role !== undefined) user.role = nextRole;
  if (payload.department !== undefined) user.department = payload.department;
  if (payload.phone !== undefined) user.phone = payload.phone;
  if (payload.isActive !== undefined) user.isActive = nextIsActive;

  user.updatedAt = new Date();
  await user.save();

  return sanitizeUser(user);
}

async function toggleUserActive(userId) {
  const user = await User.findOne({ _id: userId, isDeleted: { $ne: true } });
  if (!user) throw new Error('User not found');

  if (user.isActive) {
    await ensureNotLastActiveAdmin(user, 'ปิดใช้งานผู้ดูแลระบบคนสุดท้าย');
  }

  user.isActive = !user.isActive;
  user.updatedAt = new Date();
  await user.save();

  return sanitizeUser(user);
}

async function updateUserStatus(userId, payload = {}) {
  if (payload.isActive === undefined) {
    throw new Error('isActive is required');
  }

  const user = await User.findOne({ _id: userId, isDeleted: { $ne: true } });
  if (!user) throw new Error('User not found');

  const nextIsActive = Boolean(payload.isActive);
  if (user.isActive && !nextIsActive) {
    await ensureNotLastActiveAdmin(user, 'ปิดใช้งานผู้ดูแลระบบคนสุดท้าย');
  }

  user.isActive = nextIsActive;
  user.updatedAt = new Date();
  await user.save();

  return sanitizeUser(user);
}

async function resetUserPassword(userId, payload = {}) {
  const user = await User.findOne({ _id: userId, isDeleted: { $ne: true } });
  if (!user) throw new Error('User not found');

  const newPassword = payload.newPassword || `Temp${Math.random().toString(36).slice(2, 10)}!`;
  assertValidPassword(String(newPassword));

  user.password = String(newPassword);
  user.updatedAt = new Date();
  await user.save();

  return {
    user: sanitizeUser(user),
    tempPassword: String(newPassword)
  };
}

async function deleteUser(userId) {
  const user = await User.findOne({ _id: userId, isDeleted: { $ne: true } });
  if (!user) throw new Error('User not found');

  await ensureNotLastActiveAdmin(user, 'ลบผู้ดูแลระบบคนสุดท้าย');

  const deletedEmail = `${user.email}__deleted_${Date.now()}`;
  user.email = deletedEmail;
  user.isActive = false;
  user.isDeleted = true;
  user.updatedAt = new Date();
  await user.save();

  return sanitizeUser(user);
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserActive,
  updateUserStatus,
  resetUserPassword,
  deleteUser
};
