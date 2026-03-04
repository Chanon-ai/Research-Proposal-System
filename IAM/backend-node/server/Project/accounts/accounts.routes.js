'use strict';

const express = require('express');
const router = express.Router();

const Account = require("./service/account");

const google = require("../../../helpers/google/oAuth2");

// router.get("/singup", Account.onQuerys);
router.post("/signin", Account.verifyIdTokenGoogle, Account.SingIn);
// router.post("/singin", Account.verifyIdTokenGoogle, Account.SingIn);
router.get("/auth/me", Account.onCheckAuthorization, Account.onMe);
router.post("/auth/2fa/request", Account.onCheckAuthorization, Account.onTwoFaRequest);
router.post("/auth/2fa/verify", Account.onCheckAuthorization, Account.onTwoFaVerify);
router.post("/auth/trust-device", Account.onCheckAuthorization, Account.onTrustDevice);
router.get("/accounts", Account.onCheckAuthorization, Account.onList);
router.put("/accounts/:id", Account.onCheckAuthorization, Account.onUpdateAccount);
router.get("/accounts/group/options", Account.onCheckAuthorization, Account.onGroupOptions);
router.get("/accounts/:id/effective-permissions", Account.onCheckAuthorization, Account.onEffectivePermissions);
router.get("/accounts/status/options", Account.onCheckAuthorization, Account.onStatusOptions);
router.put("/accounts/:id/status", Account.onCheckAuthorization, Account.onChangeStatus);



router.post( "/d", google.onDistance);
// app.post(path + "/singin", Infomation_Accounts.verifyIdTokenGoogle, Infomation_Accounts.SingIn);


module.exports = router;
