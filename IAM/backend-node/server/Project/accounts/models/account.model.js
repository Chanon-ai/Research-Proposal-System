'use strict';
const mongoose = require('mongoose');
var Schema      = mongoose.Schema;
const validateEmail = function(value) {
    const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return regex.test(value);
};

const validateStrongPassword = function(value) {
    const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*"'()+,-./:;<=>?[\]^_`{|}~]).{8,20}$/;
    return regex.test(value);
};

const validateMobile = function(value) {
    const regex =/^(\([0-9]{3}\) |[0-9]{3}-)[0-9]{3}-[0-9]{4}/;
    return regex.test(value);
};

const validateAssertThaiId = function(value) {
    const regex =/^[0-9]{13}/;
    return regex.test(value);
};


var objsSchema  = new Schema({

    dateTime                : {type: Date, default: null},

    group                   : {type: Schema.ObjectId, ref: 'Setting_Account_Group'},
    code                    : {type: String, default: null},
    email                   : {type: String, default: null},
    authen                  : [{
        type                    : {type: Schema.ObjectId, ref: 'Setting_Authen_Type'},
        username                : {type: String, default: null},
        password                : {type: String, default: null},
        email                   : {type: String, default: null},
        // password                : {type: String, default: null, validate: [validateStrongPassword, "Please enter a valid Password"]},
        // email                   : {type: String, default: null, validate: [validateEmail, "Please enter a valid E-Mail"]},
        oAtuhToken              : {type: String, default: null}
    }],

    userinfo                : {
        prefix              : [{
            key                     : {type: String, default: null},
            value                   : {type: String, default: null},
        }],
        firstName           : [{
            key                     : {type: String, default: null},
            value                   : {type: String, default: null},
        }],
        lastName            : [{
            key                     : {type: String, default: null},
            value                   : {type: String, default: null},
        }],
        image               : {type: String, default: null},
        cardId              : {type: String, default: null},//citizen card id
        birthday            : {type: Date, default: null},
        msisdn              : {type: String, default: null} ,//phone number
        religion            : {type: String, default: null},
    },

    address                 : [{
        type                    : {type: Schema.ObjectId, ref: 'Setting_AddressType'},
        address                 : {type: String, default: null},
        province                : {type: Schema.ObjectId, ref: 'Setting_Province'},
        district                : {type: Schema.ObjectId, ref: 'Setting_District'},
        subDistrict             : {type: Schema.ObjectId, ref: 'Setting_SubDistrict'},
        zipcode                 : {type: String, default: null},
        gps                     : {
            latitude                : {type: Number, default: null},
            longitude               : {type: Number, default: null},
        }

    }],
    verification            : [{
        type                    : {type: Schema.ObjectId, ref: 'Setting_Verification'},
        dateTime                : {type: Date, default: null},
        expired                 : {type: Date, default: null},
        code                    : {type: String, default: null},
        src                     : {type: String, default: null},
        status                  : {type: Schema.ObjectId, ref: 'Setting_Status', default: new Object("63fb5ffb9c438d82661190bc")},
    }],


    control                 : {
        sso                     : {type: Boolean, default: false}, // singleSignOn
        limit                   : {type: Number, default: 4}, // 0 = on 1 = off
        trustedDevices          : [{
            deviceId                : {type: String, default: null},
            fingerprint             : {type: String, default: null},
            networkKey              : {type: String, default: null},
            userAgent               : {type: String, default: null},
            lastIp                  : {type: String, default: null},
            trustedAt               : {type: Date, default: Date.now},
            expiresAt               : {type: Date, default: null}
        }],
        device                  : [{
            version                 : {type: String, default: null},
            ip                      : {type: String, default: null},
            device                  : {type: String, default: null},
            dateTime                : {type: Date, default: Date.now},
            xAccessToken            : {type: String, default: null}, //user token
            expired_key             : {type: Number, default: 0}, //user expired token defualt 24 h
            deviceId                : {type: String, default: null},
            fingerprint             : {type: String, default: null},
            networkKey              : {type: String, default: null},
            rememberDeviceRequested : {type: Boolean, default: false},
            twoFactorRequired       : {type: Boolean, default: false},
            twoFactorVerified       : {type: Boolean, default: false},
            twoFactorVerifiedAt     : {type: Date, default: null}
        }]
    },
    status                  : {type: Schema.ObjectId, ref: 'Setting_Status', default: null},

});


var Information_Accounts = mongoose.model('Information_Accounts', objsSchema, 'Information_Accounts');
module.exports = Information_Accounts;
