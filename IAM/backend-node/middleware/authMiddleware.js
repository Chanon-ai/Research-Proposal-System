const jwt = require('jsonwebtoken');
const User = require('../server/Project/Auth/models/User');
const { getJwtSecret } = require('../helpers/jwtSecret');

function normalizeRole(role) {
  const normalizedRole = String(role || '').trim().toLowerCase().replace(/-/g, '_');
  if (normalizedRole === 'finance_office') return 'finance_officer';
  return normalizedRole;
}

exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findOne({ _id: decoded.userId, isDeleted: { $ne: true } }).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Token ไม่ถูกต้องหรือบัญชีถูกปิด' });
    }

    user.role = normalizeRole(user.role);
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token หมดอายุหรือไม่ถูกต้อง' });
  }
};

exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'ไม่ได้รับอนุญาต' });
  }

  const currentRole = normalizeRole(req.user.role);
  const allowedRoles = roles.map(normalizeRole);

  if (!allowedRoles.includes(currentRole)) {
    return res.status(403).json({
      success: false,
      message: `ต้องการสิทธิ์: ${allowedRoles.join('/')} แต่บัญชีของคุณเป็น: ${currentRole}`
    });
  }

  next();
};
