const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { getJwtSecret } = require('../../../../helpers/jwtSecret');

function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || '7d';
}

function toPublicUser(userDoc) {
  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.password;
  user.role = normalizeAuthRole(user.role);
  return user;
}

function signToken(user) {
  const payload = {
    userId: user._id,
    email: user.email,
    role: normalizeAuthRole(user.role),
    fullName: user.fullName
  };

  return jwt.sign(payload, getJwtSecret(), { expiresIn: getJwtExpiresIn() });
}

function buildRandomPassword() {
  return `Social-${crypto.randomBytes(20).toString('hex')}aA1!`;
}

function normalizeAuthRole(role) {
  const token = String(role || '').trim().toLowerCase().replace(/-/g, '_');
  if (token === 'finance_office') {
    return 'finance_officer';
  }
  if (
    token === 'admin' ||
    token === 'chairman' ||
    token === 'committee' ||
    token === 'finance_officer' ||
    token === 'researcher'
  ) {
    return token;
  }
  return 'researcher';
}

function normalizeAvatarUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw;
}

async function ensureUserByEmail(payload = {}) {
  const email = String(payload.email || '').toLowerCase().trim();
  if (!email) {
    throw new Error('email_required');
  }

  const requestedRole = normalizeAuthRole(payload.role || 'researcher');
  const requestedName = String(payload.fullName || '').trim();
  const requestedAvatarUrl = normalizeAvatarUrl(
    payload.avatarUrl || payload.picture || payload.photo || payload.image || ''
  );

  let user = await User.findOne({ email });
  if (!user) {
    user = new User({
      fullName: requestedName || email.split('@')[0],
      email,
      password: buildRandomPassword(),
      role: requestedRole,
      department: payload.department || '',
      phone: payload.phone || '',
      avatarUrl: requestedAvatarUrl || ''
    });
  } else {
    if (!user.fullName && requestedName) {
      user.fullName = requestedName;
    }
    user.role = normalizeAuthRole(user.role || requestedRole);
    if (!user.role) {
      user.role = requestedRole;
    }
    if (user.isDeleted) {
      user.isDeleted = false;
    }
    if (requestedAvatarUrl && String(user.avatarUrl || '').trim() !== requestedAvatarUrl) {
      user.avatarUrl = requestedAvatarUrl;
    }
  }

  user.lastLogin = new Date();
  await user.save();
  return user;
}

function issueToken(user) {
  return signToken(user);
}

async function register(payload) {
  const email = String(payload.email || '').toLowerCase().trim();
  const exists = await User.findOne({ email });
  if (exists) {
    throw new Error('อีเมลนี้มีในระบบแล้ว');
  }

  const user = new User({
    fullName: payload.fullName,
    email,
    password: payload.password,
    department: payload.department || '',
    phone: payload.phone || ''
  });

  const saved = await user.save();
  const token = signToken(saved);

  return {
    user: toPublicUser(saved),
    token
  };
}

async function login(email, password) {
  const normalizedEmail = String(email || '').toLowerCase().trim();


  const user = await User.findOne({ email: normalizedEmail, isDeleted: { $ne: true } });

  if (!user) {
    throw new Error('ไม่พบบัญชีผู้ใช้นี้ในระบบ');
  }

  if (!user.isActive) {
    throw new Error('บัญชีถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
  }

  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    throw new Error('รหัสผ่านไม่ถูกต้อง');
  }

  user.lastLogin = new Date();
  await user.save();

  const token = signToken(user);

  return {
    user: toPublicUser(user),
    token
  };
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

async function getUserById(userId) {
  return User.findById(userId).select('-password');
}

module.exports = {
  register,
  login,
  verifyToken,
  getUserById,
  ensureUserByEmail,
  issueToken,
  toPublicUser
};
