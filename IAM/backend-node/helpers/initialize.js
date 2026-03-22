'use strict';

var dns = require('dns');
var mongoose = require('mongoose');
var cfg = require('../config/config');
var resMsg = require('../config/message');
var mongodb = null;

function configureMongoSrvDns() {
    if (!cfg.mongoURI || cfg.mongoURI.indexOf('mongodb+srv://') !== 0) {
        return;
    }

    var dnsServers = (process.env.MONGO_DNS_SERVERS || '')
        .split(',')
        .map(function (item) { return item.trim(); })
        .filter(Boolean);

    if (!dnsServers.length) {
        return;
    }

    try {
        dns.setServers(dnsServers);
        console.log('[MongoDB] DNS override enabled: ' + dnsServers.join(', '));
    } catch (err) {
        console.log('[MongoDB] Failed to set DNS override: ' + (err && err.message ? err.message : err));
    }
}

exports.init = function (callback) {
    configureMongoSrvDns();
    mongoose.Promise = global.Promise;
    mongodb = mongoose.connect(cfg.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    var db = mongoose.connection;
    db.on('error', function (err) {
        console.log('----- Connect To MongoDB Error Status[' + JSON.stringify(err) + '] -----');
        return callback(true);
    });

    db.once('open', function () {
        // we're connected!
        global.mongodb = db;
        console.log('----- Connect To Mongodb Status[' + JSON.stringify(resMsg.getMsg(20000)) + '] -----');
        return callback(true);
    });

    db.on('connected',console.info.bind(console,"MongoDB connection is connected:"))
};
//db.createUser({user:"securitys",pwd:"Zk8K3BE3k8ASEr4A",roles:[{role:"readWrite",db:"securitys"}]})