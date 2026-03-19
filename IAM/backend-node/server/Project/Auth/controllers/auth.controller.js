const authService = require('../services/auth.service');
const User = require('../models/User');

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email || '').trim());
}

exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password, department, phone } = req.body || {};

    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อ-นามสกุล' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    }

    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    const result = await authService.register({ fullName, email, password, department, phone });
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'สมัครสมาชิกไม่สำเร็จ' });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกรหัสผ่าน' });
    }

    const result = await authService.login(email, password);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(401).json({ success: false, message: err.message || 'เข้าสู่ระบบไม่สำเร็จ' });
  }
};

exports.me = async (req, res) => {
  return res.status(200).json({ success: true, data: req.user });
};

exports.logout = async (req, res) => {
  return res.status(200).json({ success: true, message: 'ออกจากระบบสำเร็จ' });
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบบัญชีผู้ใช้' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }

    user.password = newPassword;
    user.updatedAt = new Date();
    await user.save();

    return res.status(200).json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ' });
  }
};
