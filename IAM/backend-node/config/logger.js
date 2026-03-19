const winston = require('winston');
require('winston-mongodb');  // ต้อง require winston-mongodb
const mongoose = require('mongoose');

const mongoUrl = process.env.MONGODB || 'mongodb://localhost:27017/logs';

// สร้าง Logger สำหรับบันทึก log ลง MongoDB
const mongoTransport = new winston.transports.MongoDB({
    db: mongoUrl,
    collection: 'logs',
    level: 'info',
    storeHost: true,
    tryReconnect: true,
});

// Prevent unhandled 'error' event from crashing the process
mongoTransport.on('error', function (err) {
    console.error('[winston-mongodb] transport error:', err.message || err);
});

const logger = winston.createLogger({
    level: 'info',  // กำหนดระดับความรุนแรงของ log
    format: winston.format.combine(
        winston.format.timestamp(),  // เก็บเวลาของ log
        winston.format.json()  // บันทึก log ในรูปแบบ JSON
    ),
    transports: [mongoTransport]
});

// Prevent unhandled 'error' on logger itself
logger.on('error', function (err) {
    console.error('[winston] logger error:', err.message || err);
});

// Truncate large data to prevent BSON overflow
function safeForLog(data) {
    try {
        var str = JSON.stringify(data);
        if (str && str.length > 10000) {
            return { _truncated: true, length: str.length };
        }
        return JSON.parse(str);
    } catch (e) {
        return { _error: 'could not serialize' };
    }
}

// ฟังก์ชันสำหรับบันทึกข้อมูลที่เกี่ยวข้องกับ success
function logSuccessData(req, res, body) {
    const logData = {
        level: 'info',
        method: req.method,
        url: req.originalUrl,
        body: safeForLog(req.body),
        query: req.query,
        ip: req.ip,
        status: 'success',
        response: safeForLog(body),
        statusCode: res.statusCode,
        timestamp: new Date()
    };

    try { logger.info(`Request Success: ${req.url}`, logData); } catch (e) { console.error('[logger] info error:', e.message); }
}

// ฟังก์ชันสำหรับบันทึกข้อมูลที่เกี่ยวข้องกับ error
function logErrorData(req, res, body) {
    const logData = {
        level: 'error',
        method: req.method,
        url: req.originalUrl,
        body: safeForLog(req.body),
        query: req.query,
        ip: req.ip,
        status: 'error',
        response: safeForLog(body),
        statusCode: res.statusCode,
        timestamp: new Date()
    };

    try { logger.error(`Request Error: ${req.url}`, logData); } catch (e) { console.error('[logger] error error:', e.message); }
}

// ฟังก์ชันสำหรับลบ log เก่ากว่า 120 วัน (background)
async function deleteOldLogs() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 120);  // ลบ log ที่เก่ากว่า 120 วัน

    try {
        // ลบ log ที่มีอายุมากกว่า 120 วัน
        await mongoose.connection.db.collection('logs').deleteMany({
            timestamp: { $lt: cutoffDate }
        });
        console.log('Old logs deleted successfully.');
    } catch (error) {
        console.error('Error deleting old logs:', error);
    }
}

// สร้าง middleware เพื่อดักจับข้อมูล response
function loggerMiddleware (req, res, next){
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);

    // ดักจับการส่ง json ปกติ (res.json())
    res.json = function (body) {
        res.locals.responseData = body;
        if (res.statusCode >= 200 && res.statusCode < 400) {
            logSuccessData(req, res, body);
        } else {
            logErrorData(req, res, body);
        }
        return originalJson(body);
    };

    // ดักจับ res.status() เพื่อให้ chained .json() ก็ log ด้วย
    res.status = function (code) {
        var result = originalStatus(code);
        result.json = res.json; // ให้ chained .json() ใช้ตัวที่ถูก override
        return result;
    };

    next();
}

module.exports = loggerMiddleware ;
