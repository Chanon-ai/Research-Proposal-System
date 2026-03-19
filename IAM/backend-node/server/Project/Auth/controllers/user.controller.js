const userService = require('../services/user.service');

function errorResponse(res, err, fallbackStatus = 400) {
  const message = err && err.message ? err.message : 'Unexpected error';
  const status = /not found/i.test(message) ? 404 : fallbackStatus;
  return res.status(status).json({ success: false, message });
}

exports.list = async (req, res) => {
  try {
    const result = await userService.listUsers(req.query || {});
    return res.json({ success: true, data: result });
  } catch (err) {
    return errorResponse(res, err, 500);
  }
};

exports.getById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return res.json({ success: true, data: user });
  } catch (err) {
    return errorResponse(res, err, 400);
  }
};

exports.create = async (req, res) => {
  try {
    const { fullName, email, password } = req.body || {};
    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อ อีเมล และรหัสผ่านให้ครบ' });
    }

    const user = await userService.createUser(req.body || {});
    return res.status(201).json({ success: true, data: user });
  } catch (err) {
    return errorResponse(res, err, 400);
  }
};

exports.update = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body || {});
    return res.json({ success: true, data: user });
  } catch (err) {
    return errorResponse(res, err, 400);
  }
};

exports.toggleActive = async (req, res) => {
  try {
    const user = await userService.toggleUserActive(req.params.id);
    return res.json({ success: true, data: user });
  } catch (err) {
    return errorResponse(res, err, 400);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const user = await userService.updateUserStatus(req.params.id, req.body || {});
    return res.json({ success: true, data: user });
  } catch (err) {
    return errorResponse(res, err, 400);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const result = await userService.resetUserPassword(req.params.id, req.body || {});
    return res.json({ success: true, data: result });
  } catch (err) {
    return errorResponse(res, err, 400);
  }
};

exports.remove = async (req, res) => {
  try {
    const user = await userService.deleteUser(req.params.id);
    return res.json({ success: true, data: user });
  } catch (err) {
    return errorResponse(res, err, 400);
  }
};
