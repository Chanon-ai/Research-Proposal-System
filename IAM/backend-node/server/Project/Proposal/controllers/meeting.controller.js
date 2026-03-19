const meetingService = require('../services/meeting.service');

function handleError(res, err, fallbackStatus = 400) {
  const message = err && err.message ? err.message : 'Unexpected error';
  const status = /not found/i.test(message) ? 404 : fallbackStatus;
  return res.status(status).json({ success: false, message });
}

exports.list = async (req, res) => {
  try {
    const result = await meetingService.listMeetings(req.query || {}, req.user);
    return res.json({ success: true, data: result });
  } catch (err) {
    return handleError(res, err, 500);
  }
};

exports.create = async (req, res) => {
  try {
    const { title, meetingDate, startTime } = req.body || {};
    if (!title || !meetingDate || !startTime) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อการประชุม วันที่ประชุม และเวลาเริ่ม' });
    }

    const row = await meetingService.createMeeting(req.body || {}, req.user);
    return res.status(201).json({ success: true, data: row });
  } catch (err) {
    return handleError(res, err, 400);
  }
};

exports.update = async (req, res) => {
  try {
    const row = await meetingService.updateMeeting(req.params.id, req.body || {}, req.user);
    return res.json({ success: true, data: row });
  } catch (err) {
    return handleError(res, err, 400);
  }
};

exports.remove = async (req, res) => {
  try {
    await meetingService.deleteMeeting(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return handleError(res, err, 400);
  }
};

exports.updateMinutes = async (req, res) => {
  try {
    const row = await meetingService.updateMeetingMinutes(req.params.id, req.body || {}, req.user);
    return res.json({ success: true, data: row });
  } catch (err) {
    return handleError(res, err, 400);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const status = req.body && req.body.status ? req.body.status : '';
    if (!status) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุสถานะการประชุม' });
    }

    const row = await meetingService.updateMeetingStatus(req.params.id, status, req.user);
    return res.json({ success: true, data: row });
  } catch (err) {
    return handleError(res, err, 400);
  }
};
