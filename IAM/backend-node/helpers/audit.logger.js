'use strict';

async function writeAudit(payload = {}, request = null) {
    try {
        if (!payload.module || !payload.action) return null;
        const body = Object.assign({}, payload);
        if (request) {
            if (!body.ip) body.ip = request.ip || null;
            if (!body.userAgent && typeof request.get === 'function') {
                body.userAgent = request.get('User-Agent') || null;
            }
        }
        return body;
    } catch (err) {
        return null;
    }
}

module.exports = { writeAudit };
