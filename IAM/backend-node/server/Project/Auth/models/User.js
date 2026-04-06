const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const USER_ROLES = ['admin', 'chairman', 'committee', 'researcher'];

function normalizeStoredRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  if (normalized === 'office_chairman') return 'chairman';
  return normalized;
}

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: USER_ROLES,
    default: 'researcher'
  },
  department: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  isMFUStaff: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  versionKey: false
});

userSchema.pre('save', async function preSave(next) {
  try {
    this.email = String(this.email || '').toLowerCase().trim();
    this.role = normalizeStoredRole(this.role);

    if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, 12);
    }

    this.isMFUStaff = this.email.endsWith('@mfu.ac.th');

    if (!this.role || !USER_ROLES.includes(this.role)) {
      this.role = 'researcher';
    }

    this.updatedAt = Date.now();
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
