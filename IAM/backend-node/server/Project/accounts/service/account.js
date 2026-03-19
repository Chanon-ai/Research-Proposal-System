'use strict';

const mongo = require('mongodb');
const moment = require('moment');
const crypto = require('crypto');
const Utils = require("../../../../helpers/utils");
const Config = require("../../../../config/config");
const resMsg = require("../../settings/service/message");
const Account = require('../controller/account');
const accountAccess = require('../../security/service/account-access');
const Mailer = require('../../../../helpers/google/Mail');
const { writeAudit } = require('../../../../helpers/audit.logger');
const {
    canTransition,
    ensureAccountStatusMasterData,
    isSigninAllowed,
    resolveAccountStatus,
    resolveTargetStatusKey,
    toObjectId
} = require('./account-status');

const TRUST_DEVICE_DAYS = Number(process.env.TRUST_DEVICE_DAYS || 30);

function normalizeIp(request) {
    var raw = request && request.headers ? request.headers['x-forwarded-for'] : null;
    if (Array.isArray(raw)) {
        raw = raw.length > 0 ? raw[0] : null;
    }
    if (raw && typeof raw === 'string') {
        raw = raw.split(',')[0].trim();
    }
    var ip = raw || request.ip || '';
    if (String(ip).startsWith('::ffff:')) {
        ip = String(ip).replace('::ffff:', '');
    }
    return String(ip || '');
}

function normalizeNetworkKey(ip) {
    var cleanIp = String(ip || '').trim();
    var ipv4 = cleanIp.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/);
    if (ipv4) {
        return ipv4[1] + '.' + ipv4[2] + '.' + ipv4[3];
    }
    return cleanIp;
}

function normalizeDeviceId(deviceId) {
    if (!deviceId) return null;
    var value = String(deviceId).trim();
    if (!value) return null;
    if (value.length < 8 || value.length > 200) return null;
    if (!/^[a-zA-Z0-9._:-]+$/.test(value)) return null;
    return value;
}

function createFingerprint(deviceId, userAgent) {
    if (!deviceId) return null;
    var src = String(deviceId) + '|' + String(userAgent || '');
    return crypto.createHash('sha256').update(src).digest('hex');
}

function getTrustedExpiresAt() {
    return new Date(Date.now() + (TRUST_DEVICE_DAYS * 24 * 60 * 60 * 1000));
}

function findTrustedDevice(control, fingerprint, networkKey) {
    if (!control || !Array.isArray(control.trustedDevices) || !fingerprint || !networkKey) {
        return null;
    }
    var now = Date.now();
    return control.trustedDevices.find(function (item) {
        if (!item) return false;
        if (String(item.fingerprint || '') !== String(fingerprint)) return false;
        if (String(item.networkKey || '') !== String(networkKey)) return false;
        if (!item.expiresAt) return false;
        return new Date(item.expiresAt).getTime() >= now;
    }) || null;
}

async function upsertTrustedDevice(accountId, trustedDevice) {
    if (!accountId || !trustedDevice || !trustedDevice.fingerprint || !trustedDevice.networkKey) {
        return;
    }
    var query = { _id: new mongo.ObjectId(accountId) };
    await Account.onUpdate(query, {
        $pull: {
            'control.trustedDevices': {
                fingerprint: trustedDevice.fingerprint,
                networkKey: trustedDevice.networkKey
            }
        }
    });
    await Account.onUpdate(query, {
        $push: {
            'control.trustedDevices': trustedDevice
        }
    });
}

function pickLangValue(items) {
    if (!Array.isArray(items)) return '';
    var found = items.find(function (item) {
        return item && item.value;
    });
    return found ? String(found.value) : '';
}


exports.onCheckAuthorization = async function (request, response, next) {
    try {
        var querys = {};
        var headerToken = request.headers['x-access-token'] || '';
        console.log('[AUTH-CHECK] x-access-token:', headerToken ? headerToken.substring(0, 20) + '...' : '(empty)');
        console.log('[AUTH-CHECK] url:', request.originalUrl, 'method:', request.method);

        querys['control.device.xAccessToken'] = headerToken;
        // querys['control.device.expired_key'] = {$lte: new moment().unix()}

        const isDoc = await Account.onQuery(querys);
        console.log('[AUTH-CHECK] found account:', isDoc ? String(isDoc._id) : 'null');
        if(isDoc != null){
            if (!request.body || typeof request.body !== 'object') {
                request.body = {};
            }
            request.body.accounts = new mongo.ObjectId(isDoc._id)
            return next();
        }else{
            var resData = await resMsg.onMessage_Response(0,40100)
            response.status(401).json(resData);
        }

    } catch (err) {
        // console.log(err)
        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
    }
};
exports.verifyIdTokenGoogle = async function (request, response, next) {
    try {
        if (request.body && request.body.token) {
            const token = String(request.body.token).trim();
            if (!token) {
                var badToken = await resMsg.onMessage_Response(0,40100);
                return response.status(401).json(badToken);
            }

            const { OAuth2Client } = require('google-auth-library');
            const audience =
                process.env.GOOGLE_CLIENT_ID ||
                process.env.VUE_APP_CLIENTID ||
                '225788483142-8pkg8on8nh60ao83ve33ff3lflv2ccvo.apps.googleusercontent.com';
            const client = new OAuth2Client(audience || undefined);

            try {
                const ticket = await client.verifyIdToken({
                    idToken: token,
                    audience: audience
                });
                const payload = ticket.getPayload() || {};
                request.body.email = payload.email || null;
                request.body.googleSub = payload.sub || null;
                request.body.googleGivenName = payload.given_name || null;
                request.body.googleFamilyName = payload.family_name || null;
                request.body.googlePicture = payload.picture || null;
                return next();
            } catch (error) {
                var invalidToken = await resMsg.onMessage_Response(0,40100);
                return response.status(401).json(invalidToken);
            }
        } else {
            return next();
        }
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,50000)
        return response.status(500).json(resData);
    }
};
exports.SingIn = async function (request, response, next) {
    try {
        let query = {};
        let loginEmail = null;
        const masterStatus = await ensureAccountStatusMasterData();
        const activeStatus = masterStatus.statuses.ACTIVE;
        const userAgent = String(request.get('User-Agent') || '');
        const deviceId = normalizeDeviceId(request.body && request.body.deviceId);
        const clientIp = normalizeIp(request);
        const networkKey = normalizeNetworkKey(clientIp);
        const fingerprint = createFingerprint(deviceId, userAgent);

        if (request.body.email) {
            loginEmail = String(request.body.email).trim().toLowerCase();
            query.$or = [
                { email: loginEmail },
                { 'authen.email': loginEmail }
            ];
        } else if (request.body.username && request.body.password === "********") {
            var elemMatch = {};
            elemMatch.type = (request.body.type == null)? new mongo.ObjectId("66a06852660ccb1debade7c5"):new mongo.ObjectId(request.body.username)
            elemMatch.username = request.body.username;
            query.authen = { $elemMatch : elemMatch }
        } else {
            const resData = await resMsg.onMessage_Response(0, 40400);
            return response.status(404).json(resData);
        }

        // console.log(query)
        let isDoc = await Account.onQuery(query);

        if (!isDoc && loginEmail && request.body.googleSub) {
            const createPayload = {
                dateTime: new Date(),
                code: 'GOOG-' + Utils.randomString(10).toUpperCase(),
                email: loginEmail,
                authen: [
                    {
                        username: loginEmail,
                        password: null,
                        email: loginEmail,
                        oAtuhToken: request.body.googleSub
                    }
                ],
                userinfo: {
                    firstName: toLangArray(request.body.googleGivenName, 'en'),
                    lastName: toLangArray(request.body.googleFamilyName, 'en'),
                    image: request.body.googlePicture || null
                },
                control: {
                    sso: true,
                    limit: 4,
                    trustedDevices: [],
                    device: []
                },
                verification: [],
                status: activeStatus ? toObjectId(activeStatus._id) : null
            };
            isDoc = await Account.onCreate(createPayload);
        }

        if (!isDoc) {
            const resData = await resMsg.onMessage_Response(0, 40400);
            return response.status(404).json(resData);
        }
        const resolvedAccount = await resolveAccountStatus(Account, isDoc);
        isDoc = resolvedAccount.account || isDoc;
        if (!isSigninAllowed(resolvedAccount.status)) {
            const denied = await resMsg.onMessage_Response(0, 40100);
            denied.data = {
                status: resolvedAccount.status
            };
            return response.status(401).json(denied);
        }
        const trustedDevice = findTrustedDevice(isDoc.control, fingerprint, networkKey);
        const require2FA = !trustedDevice;

        const sessionQuery = { _id: new mongo.ObjectId(isDoc._id) };

        // Check verification
        // const isVerification = isDoc.verification.filter(
        //     item => item.status !== "6548516f7ab25be71bbeeed1"
        // );

        // Limit device
        if (isDoc.control && isDoc.control.limit <= isDoc.control.device.length) {
            await Account.onUpdate(sessionQuery, {
                $pull: { "control.device": isDoc.control.device[0] }
            });
        }

        // Create new device session
        const token = await Utils.createTokens();
        const devices = {
            version: "1",
            ip: clientIp,
            device: userAgent,
            xAccessToken: token,
            expired_key: new moment().unix() + Config.tokenExpired,
            accounts: isDoc._id,
            deviceId: deviceId,
            fingerprint: fingerprint,
            networkKey: networkKey,
            rememberDeviceRequested: false
        };

        await Account.onUpdate(sessionQuery, {
            $push: { "control.device": devices }
        });

        if (!require2FA && trustedDevice) {
            await upsertTrustedDevice(isDoc._id, {
                deviceId: deviceId || trustedDevice.deviceId || null,
                fingerprint: trustedDevice.fingerprint,
                networkKey: trustedDevice.networkKey,
                userAgent: userAgent,
                lastIp: clientIp,
                trustedAt: new Date(),
                expiresAt: getTrustedExpiresAt()
            });
        }

        // Clean sensitive data before response
        delete devices.ip;
        delete devices.device;

        const resData = await resMsg.onMessage_Response(0, 20000);
        devices.require2FA = require2FA;
        devices.trustedDeviceMatched = !require2FA;
        resData.data = devices;
        return response.status(200).json(resData);
    } catch (err) {
        console.error('SingIn error:', err);
        const resData = await resMsg.onMessage_Response(0, 50000);
        return response.status(500).json(resData);
    }
};

exports.onMe = async function (request, response, next) {
    try {
        var accountId = request.body && request.body.accounts ? request.body.accounts : null;
        if (!accountId || !mongo.ObjectId.isValid(accountId)) {
            var notFound = await resMsg.onMessage_Response(0,40400);
            return response.status(404).json(notFound);
        }

        var query = { _id: new mongo.ObjectId(accountId) };
        var doc = await Account.onQuery(query, [{ path: 'status', select: 'key title description group state' }]);
        if (!doc) {
            var emptyRes = await resMsg.onMessage_Response(0,40400);
            return response.status(404).json(emptyRes);
        }
        var resolved = await resolveAccountStatus(Account, doc);
        doc = resolved.account || doc;

        if (doc.control && Array.isArray(doc.control.device)) {
            doc.control.device = doc.control.device.map(function (item) {
                var cloned = Object.assign({}, item);
                delete cloned.ip;
                delete cloned.device;
                return cloned;
            });
        }

        var resData = await resMsg.onMessage_Response(0,20000);
        resData.data = doc;
        return response.status(200).json(resData);
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,50000);
        return response.status(500).json(resData);
    }
};

exports.onStatusOptions = async function (request, response, next) {
    try {
        const master = await ensureAccountStatusMasterData();
        const resData = await resMsg.onMessage_Response(0,20000);
        resData.data = {
            group: master.group,
            statuses: Object.values(master.statuses)
        };
        return response.status(200).json(resData);
    } catch (err) {
        const resData = await resMsg.onMessage_Response(0,50000);
        return response.status(500).json(resData);
    }
};

exports.onGroupOptions = async function (request, response, next) {
    try {
        const docs = await accountAccess.getGroupOptions();
        const resData = await resMsg.onMessage_Response(0,20000);
        resData.data = {
            groups: docs || []
        };
        return response.status(200).json(resData);
    } catch (err) {
        const resData = await resMsg.onMessage_Response(0,50000);
        return response.status(500).json(resData);
    }
};

exports.onEffectivePermissions = async function (request, response, next) {
    try {
        const accountId = request.params && request.params.id ? request.params.id : null;
        if (!accountId || !mongo.ObjectId.isValid(accountId)) {
            const bad = await resMsg.onMessage_Response(0,40400);
            return response.status(404).json(bad);
        }

        const data = await accountAccess.getEffectivePermissions(accountId);
        const resData = await resMsg.onMessage_Response(0,20000);
        resData.data = data;
        return response.status(200).json(resData);
    } catch (err) {
        const resData = await resMsg.onMessage_Response(0,50000);
        return response.status(500).json(resData);
    }
};

exports.onChangeStatus = async function (request, response, next) {
    try {
        const accountId = request.params && request.params.id ? request.params.id : null;
        if (!accountId || !mongo.ObjectId.isValid(accountId)) {
            const bad = await resMsg.onMessage_Response(0,40400);
            return response.status(404).json(bad);
        }

        const account = await Account.onQuery(
            { _id: new mongo.ObjectId(accountId) },
            [{ path: 'status', select: 'key title description group state' }]
        );
        if (!account) {
            const missing = await resMsg.onMessage_Response(0,40400);
            return response.status(404).json(missing);
        }

        const resolved = await resolveAccountStatus(Account, account);
        const currentStatus = resolved.status;
        const targetKey = resolveTargetStatusKey(
            request.body && request.body.action,
            request.body && request.body.toStatusKey
        );

        if (!targetKey) {
            const invalid = await resMsg.onMessage_Response(0,40400);
            return response.status(404).json(invalid);
        }

        const master = resolved.master || await ensureAccountStatusMasterData();
        const targetStatus = master.statuses[targetKey];
        if (!targetStatus) {
            const invalid = await resMsg.onMessage_Response(0,40400);
            return response.status(404).json(invalid);
        }

        if (!canTransition(currentStatus && currentStatus.key, targetKey)) {
            const denied = await resMsg.onMessage_Response(0,40100);
            denied.data = {
                currentStatus: currentStatus || null,
                targetStatus: targetStatus
            };
            return response.status(401).json(denied);
        }

        const updated = await Account.onUpdate(
            { _id: new mongo.ObjectId(accountId) },
            { status: toObjectId(targetStatus._id) },
            [{ path: 'status', select: 'key title description group state' }]
        );

        const resData = await resMsg.onMessage_Response(0,20000);
        resData.data = updated;
        return response.status(200).json(resData);
    } catch (err) {
        const resData = await resMsg.onMessage_Response(0,50000);
        return response.status(500).json(resData);
    }
};

exports.onList = async function (request, response, next) {
    try {
        const docs = await Account.onQuerys(
            {},
            [{ path: 'status', select: 'key title description group state' }]
        );
        const assignmentsByAccountId = await accountAccess.loadAssignmentsByAccountIds((docs || []).map(function (item) {
            return item && item._id ? item._id : null;
        }));

        const normalized = [];
        for (const item of docs || []) {
            const resolved = await resolveAccountStatus(Account, item);
            const account = resolved.account || item;
            if (account.control && Array.isArray(account.control.device)) {
                account.control.device = account.control.device.map(function (device) {
                    var cloned = Object.assign({}, device);
                    delete cloned.ip;
                    delete cloned.device;
                    return cloned;
                });
            }
            const assignmentRows = assignmentsByAccountId[String(account._id)] || [];
            account.securityAssignments = assignmentRows;
            account.securityGroups = assignmentRows.map(function (row) {
                return row && row.group ? row.group : null;
            }).filter(Boolean);
            normalized.push(account);
        }

        const resData = await resMsg.onMessage_Response(0,20000);
        resData.data = normalized;
        return response.status(200).json(resData);
    } catch (err) {
        const resData = await resMsg.onMessage_Response(0,50000);
        return response.status(500).json(resData);
    }
};

function createOtpCode(length = 6) {
    var min = Math.pow(10, length - 1);
    var max = Math.pow(10, length) - 1;
    return String(Math.floor(min + (Math.random() * (max - min + 1))));
}

function isMailConfigured() {
    return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function toLangArray(value, defaultKey) {
    var text = value ? String(value).trim() : '';
    if (!text) return [];
    return [{ key: defaultKey || 'en', value: text }];
}

function normalizeDateInput(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date;
}

exports.onUpdateAccount = async function (request, response, next) {
    try {
        const accountId = request.params && request.params.id ? request.params.id : null;
        if (!accountId || !mongo.ObjectId.isValid(accountId)) {
            const bad = await resMsg.onMessage_Response(0,40400);
            return response.status(404).json(bad);
        }

        const current = await Account.onQuery({ _id: new mongo.ObjectId(accountId) });
        if (!current) {
            const missing = await resMsg.onMessage_Response(0,40400);
            return response.status(404).json(missing);
        }

        const payload = request.body || {};
        const firstName = payload.firstName ? String(payload.firstName).trim() : '';
        const lastName = payload.lastName ? String(payload.lastName).trim() : '';
        const prefix = payload.prefix ? String(payload.prefix).trim() : '';
        const email = payload.email ? String(payload.email).trim().toLowerCase() : '';
        const code = payload.code ? String(payload.code).trim() : '';
        const cardId = payload.cardId ? String(payload.cardId).trim() : '';
        const msisdn = payload.msisdn ? String(payload.msisdn).trim() : '';
        const lineId = payload.lineId ? String(payload.lineId).trim() : '';
        const religion = payload.religion ? String(payload.religion).trim() : '';
        const image = payload.image ? String(payload.image).trim() : '';
        const birthday = normalizeDateInput(payload.birthday);
        const groupIds = Array.isArray(payload.groupIds)
            ? payload.groupIds
            : Array.isArray(payload.securityGroupIds)
                ? payload.securityGroupIds
                : [];

        const updatePayload = {
            code: code || null,
            email: email || null,
            userinfo: Object.assign({}, current.userinfo || {}, {
                prefix: prefix ? toLangArray(prefix, 'en') : [],
                firstName: firstName ? toLangArray(firstName, 'en') : [],
                lastName: lastName ? toLangArray(lastName, 'en') : []
                ,
                image: image || null,
                cardId: cardId || null,
                birthday: birthday,
                msisdn: msisdn || null,
                lineId: lineId || null,
                religion: religion || null
            })
        };

        if (Array.isArray(current.authen) && current.authen.length) {
            updatePayload.authen = current.authen.map(function (item, index) {
                const cloned = Object.assign({}, item);
                if (index === 0) {
                    cloned.username = email || cloned.username || null;
                    cloned.email = email || cloned.email || null;
                }
                return cloned;
            });
        }

        const updated = await Account.onUpdate(
            { _id: new mongo.ObjectId(accountId) },
            updatePayload,
            [{ path: 'status', select: 'key title description group state' }]
        );
        await accountAccess.syncAccountAssignments(accountId, groupIds);

        const resolved = await resolveAccountStatus(Account, updated);
        const accountDoc = resolved.account || updated;
        const assignmentsByAccountId = await accountAccess.loadAssignmentsByAccountIds([accountId]);
        accountDoc.securityAssignments = assignmentsByAccountId[String(accountId)] || [];
        accountDoc.securityGroups = accountDoc.securityAssignments.map(function (row) {
            return row && row.group ? row.group : null;
        }).filter(Boolean);
        const resData = await resMsg.onMessage_Response(0,20000);
        resData.data = accountDoc;
        return response.status(200).json(resData);
    } catch (err) {
        const resData = await resMsg.onMessage_Response(0,50000);
        return response.status(500).json(resData);
    }
};

exports.onTwoFaRequest = async function (request, response, next) {
    try {
        var accountId = request.body && request.body.accounts ? request.body.accounts : null;
        if (!accountId || !mongo.ObjectId.isValid(accountId)) {
            var bad = await resMsg.onMessage_Response(0,40400);
            return response.status(404).json(bad);
        }

        var query = { _id: new mongo.ObjectId(accountId) };
        var account = await Account.onQuery(query);
        if (!account) {
            var missingAccount = await resMsg.onMessage_Response(0,40400);
            return response.status(404).json(missingAccount);
        }

        var targetEmail = account.email || null;
        if (!targetEmail && Array.isArray(account.authen)) {
            var authenEmail = account.authen.find(function (item) {
                return item && item.email;
            });
            targetEmail = authenEmail ? authenEmail.email : null;
        }
        if (!targetEmail) {
            var noEmail = await resMsg.onMessage_Response(0,40400);
            return response.status(404).json(noEmail);
        }

        var now = new Date();
        var cooldownMs = 30 * 1000;
        var existed = Array.isArray(account.verification)
            ? account.verification.find(function (item) {
                if (!item) return false;
                if (String(item.src || '') !== 'signin-2fa') return false;
                if (!item.expired) return false;
                return new Date(item.expired) >= now;
            })
            : null;
        if (existed && existed.dateTime && ((new Date(existed.dateTime).getTime() + cooldownMs) > now.getTime())) {
            var cooldownRes = await resMsg.onMessage_Response(0,20000);
            cooldownRes.data = {
                channel: 'email',
                expiresAt: existed.expired,
                resent: false,
                cooldownSeconds: Math.ceil(((new Date(existed.dateTime).getTime() + cooldownMs) - now.getTime()) / 1000)
            };
            if (!isMailConfigured() && Config.debug) {
                cooldownRes.data.devCode = existed.code || null;
            }
            return response.status(200).json(cooldownRes);
        }

        var code = createOtpCode(6);
        var expiresAt = new Date(Date.now() + (5 * 60 * 1000));

        var mailSent = false;
        if (isMailConfigured()) {
            var mailSubject = 'Your verification code';
            var mailText = 'Your verification code is ' + code + '. This code expires in 5 minutes.';
            var mailHtml = '<p>Your verification code is <b>' + code + '</b>.</p><p>This code expires in 5 minutes.</p>';
            var mailResult = await Mailer.sendMail(targetEmail, mailSubject, mailText, mailHtml);
            if (!mailResult || !mailResult.success) {
                var mailErr = await resMsg.onMessage_Response(0,50000);
                return response.status(500).json(mailErr);
            }
            mailSent = true;
        }

        var updatePayload = {
            $pull: {
                verification: { src: 'signin-2fa' }
            }
        };
        await Account.onUpdate(query, updatePayload);
        var pushResult = await Account.onUpdate(query, {
            $push: {
                verification: {
                    src: 'signin-2fa',
                    code: code,
                    dateTime: new Date(),
                    expired: expiresAt
                }
            }
        });
        console.log('[2FA-REQUEST] code:', code, 'stored verification:', JSON.stringify(pushResult && pushResult.verification));

        await writeAudit({
            module: 'auth',
            action: '2fa-request',
            actorType: 'user',
            actorId: String(accountId),
            resourceType: 'Information_Accounts',
            resourceId: String(accountId),
            meta: {
                channel: 'email',
                email: targetEmail,
                expiresAt: expiresAt,
                mailSent: mailSent
            }
        }, request);

        var resData = await resMsg.onMessage_Response(0,20000);
        resData.data = {
            channel: 'email',
            expiresAt: expiresAt,
            resent: true
        };
        if (!mailSent && Config.debug) {
            resData.data.devCode = code;
        }
        return response.status(200).json(resData);
    } catch (err) {
        var fail = await resMsg.onMessage_Response(0,50000);
        return response.status(500).json(fail);
    }
};

exports.onTwoFaVerify = async function (request, response, next) {
    try {
        var accountId = request.body && request.body.accounts ? request.body.accounts : null;
        var code = request.body && request.body.code ? String(request.body.code).trim() : '';
        if (!accountId || !mongo.ObjectId.isValid(accountId) || !code) {
            var bad = await resMsg.onMessage_Response(0,40400);
            return response.status(404).json(bad);
        }

        var account = await Account.onQuery({ _id: new mongo.ObjectId(accountId) });
        if (!account || !Array.isArray(account.verification)) {
            var notFound = await resMsg.onMessage_Response(0,40400);
            return response.status(404).json(notFound);
        }

        var now = new Date();
        console.log('[2FA-VERIFY] accountId:', String(accountId));
        console.log('[2FA-VERIFY] code received:', JSON.stringify(code));
        console.log('[2FA-VERIFY] verification entries:', JSON.stringify(account.verification));
        var matched = account.verification.find(function (item) {
            if (!item) return false;
            if (String(item.src || '') !== 'signin-2fa') return false;
            if (String(item.code || '') !== code) return false;
            if (!item.expired) return false;
            return new Date(item.expired) >= now;
        });
        console.log('[2FA-VERIFY] matched:', matched ? 'YES' : 'NO');
        if (!matched) {
            var denied = await resMsg.onMessage_Response(0,40100);
            return response.status(401).json(denied);
        }

        const accountQuery = { _id: new mongo.ObjectId(accountId) };
        await Account.onUpdate(accountQuery, { $pull: { verification: { src: 'signin-2fa' } } });

        await writeAudit({
            module: 'auth',
            action: '2fa-verify',
            actorType: 'user',
            actorId: String(accountId),
            resourceType: 'Information_Accounts',
            resourceId: String(accountId),
            meta: {
                verified: true
            }
        }, request);

        var resData = await resMsg.onMessage_Response(0,20000);
        resData.data = { verified: true };
        return response.status(200).json(resData);
    } catch (err) {
        var fail = await resMsg.onMessage_Response(0,50000);
        return response.status(500).json(fail);
    }
};

exports.onTrustDevice = async function (request, response, next) {
    try {
        var accountId = request.body && request.body.accounts ? request.body.accounts : null;
        if (!accountId || !mongo.ObjectId.isValid(accountId)) {
            var bad = await resMsg.onMessage_Response(0,40400);
            return response.status(404).json(bad);
        }

        var accessToken = request.headers && request.headers['x-access-token']
            ? String(request.headers['x-access-token'])
            : '';
        if (!accessToken) {
            var denied = await resMsg.onMessage_Response(0,40100);
            return response.status(401).json(denied);
        }

        var account = await Account.onQuery({ _id: new mongo.ObjectId(accountId) });
        if (!account || !account.control || !Array.isArray(account.control.device)) {
            var missing = await resMsg.onMessage_Response(0,40400);
            return response.status(404).json(missing);
        }

        var activeSession = account.control.device.find(function (item) {
            return item && String(item.xAccessToken || '') === accessToken;
        });
        if (!activeSession || !activeSession.fingerprint || !activeSession.networkKey) {
            var invalid = await resMsg.onMessage_Response(0,40100);
            return response.status(401).json(invalid);
        }

        var trustedPayload = {
            deviceId: activeSession.deviceId || null,
            fingerprint: activeSession.fingerprint,
            networkKey: activeSession.networkKey,
            userAgent: activeSession.device || null,
            lastIp: activeSession.ip || null,
            trustedAt: new Date(),
            expiresAt: getTrustedExpiresAt()
        };
        await upsertTrustedDevice(accountId, trustedPayload);

        await writeAudit({
            module: 'auth',
            action: 'trust-device',
            actorType: 'user',
            actorId: String(accountId),
            resourceType: 'Information_Accounts',
            resourceId: String(accountId),
            meta: {
                trusted: true,
                expiresAt: trustedPayload.expiresAt
            }
        }, request);

        var resData = await resMsg.onMessage_Response(0,20000);
        resData.data = {
            trusted: true,
            expiresAt: trustedPayload.expiresAt
        };
        return response.status(200).json(resData);
    } catch (err) {
        var fail = await resMsg.onMessage_Response(0,50000);
        return response.status(500).json(fail);
    }
};
