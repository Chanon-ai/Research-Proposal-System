/**
 * Created by sherlock on 01/02/2017.
 */

var os = require("os");
require('dotenv').config();

function firstEnv(keys) {
    for (var i = 0; i < keys.length; i += 1) {
        var raw = process.env[keys[i]];
        if (typeof raw === 'string' && raw.trim()) {
            return raw.trim();
        }
    }
    return '';
}

function buildMongoUriFromParts() {
    var host = firstEnv(['DB_HOST', 'MONGO_HOST']);
    var dbName = firstEnv(['DB_NAME', 'MONGO_NAME', 'MONGO_DB']);
    if (!host || !dbName) {
        return '';
    }

    if (host.indexOf('mongodb://') === 0 || host.indexOf('mongodb+srv://') === 0) {
        return host;
    }

    var port = firstEnv(['DB_PORT', 'MONGO_PORT']) || '27017';
    var user = firstEnv(['DB_USER', 'MONGO_USER']);
    var pass = firstEnv(['DB_PASS', 'MONGO_PASS']);
    var authSource = firstEnv(['DB_AUTH_SOURCE', 'MONGO_AUTH_SOURCE']);
    var replicaSet = firstEnv(['DB_REPLICA_SET', 'MONGO_REPLICA_SET']);
    var retryWrites = firstEnv(['DB_RETRY_WRITES', 'MONGO_RETRY_WRITES']);
    var ssl = firstEnv(['DB_SSL', 'MONGO_SSL']);
    var tls = firstEnv(['DB_TLS', 'MONGO_TLS']);

    var hostWithPort = host;
    if (!/[,:]/.test(hostWithPort) && port) {
        hostWithPort = hostWithPort + ':' + port;
    }

    var credentials = '';
    if (user) {
        credentials = encodeURIComponent(user);
        if (pass) {
            credentials += ':' + encodeURIComponent(pass);
        }
        credentials += '@';
    }

    var params = new URLSearchParams();
    if (authSource) params.set('authSource', authSource);
    if (replicaSet) params.set('replicaSet', replicaSet);
    if (retryWrites) params.set('retryWrites', retryWrites);
    if (ssl) params.set('ssl', ssl);
    if (tls) params.set('tls', tls);

    var query = params.toString();
    return 'mongodb://' + credentials + hostWithPort + '/' + dbName + (query ? ('?' + query) : '');
}

function resolveMongoUri() {
    var direct = firstEnv(['MONGODB', 'MONGO_URI', 'MONGODB_URI', 'DATABASE_URL', 'DB_URI']);
    if (direct) {
        return direct;
    }
    return buildMongoUriFromParts();
}

var resolvedMongoURI = resolveMongoUri();
if (!resolvedMongoURI) {
    console.warn('[config] MongoDB connection string is empty. Set MONGODB, MONGO_URI, MONGODB_URI, DATABASE_URL, or DB_HOST/DB_NAME.');
}

module.exports = {
    debug: true,
    key:process.env.KEY,
    mongoURI: resolvedMongoURI,
    // mongoURI: 'mongodb+srv://'+process.env.MONGO_USER+':'+process.env.MONGO_PASS+'@'+process.env.MONGO_HOST+'/'+process.env.MONGO_NAME+'?authSource=admin',
    timeout: process.env.TIMEOUT,
    tokenLength: process.env.TOKENLANGTH,
    tokenExpired: (86400000 * process.env.TOKENEXPIRED),
    transactionExpired: (60000 *process.env.TRANSACTIONEXPIRED),
    host: {
        name: os.hostname(),
        url:process.env.BASE_SERVER_URL,
        port: process.env.PORT
    },

    images_part : {
        profile : "profile/",
        ranks : "ranks/"
    }



};
