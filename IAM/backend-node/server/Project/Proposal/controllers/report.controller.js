const reportService = require('../services/report.service');

exports.export = async (req, res) => {
  try {
    const result = await reportService.exportReport(req.body || {});
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err && err.message ? err.message : 'Export failed'
    });
  }
};
