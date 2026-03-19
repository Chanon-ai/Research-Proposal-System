const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

function getJwtSecret() {
  return process.env.JWT_SECRET || 'mfu_research_secret_key_2025_change_in_production';
}

function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || '7d';
}

function toPublicUser(userDoc) {
  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.password;
  return user;
}

function signToken(user) {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    fullName: user.fullName
  };

  return jwt.sign(payload, getJwtSecret(), { expiresIn: getJwtExpiresIn() });
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

  // DEBUG — remove after confirming Atlas connection
  console.log('[Auth.login] mongoose.connection.name:', mongoose.connection && mongoose.connection.name);
  console.log('[Auth.login] mongoose.connection.host:', mongoose.connection && mongoose.connection.host);
  console.log('[Auth.login] User.collection.name:', User.collection && User.collection.name);
  console.log('[Auth.login] queried email:', normalizedEmail);
  // END DEBUG

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
  getUserById
};
