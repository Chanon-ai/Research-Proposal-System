const reportService = require('../services/report.service');

exports.export = async (req, res) => {
  try {
    const result = await reportService.exportReport(req.body || {}, req.user || null);
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err && err.message ? err.message : 'Export failed'
    });
  }
};

exports.download = async (req, res) => {
  try {
    const fileName = req.params && req.params.fileName ? req.params.fileName : '';
    const download = await reportService.getExportDownload(fileName);
    res.setHeader('Content-Type', download.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(download.fileName)}"`);
    return res.sendFile(download.filePath);
  } catch (err) {
    const message = err && err.message ? err.message : 'Download failed';
    const statusCode = message === 'File not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message
    });
  }
};
