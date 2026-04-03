'use strict';

const express = require('express');
const router = express.Router();

const type = require('./service/type');
const menu = require('./service/menu');
const group = require('./service/group');
const permission = require('./service/permission');
const assignment = require('./service/assignment');
const account = require('../accounts/service/account');

router.use(account.onCheckAuthorization);

router.get('/type', type.onQuerys);
router.post('/type', type.onCreate);
router.put('/type', type.onUpdate);
router.delete('/type', type.onDelete);

router.get('/menu', menu.onQuerys);
router.post('/menu', menu.onCreate);
router.put('/menu', menu.onUpdate);
router.delete('/menu', menu.onDelete);

router.get('/group', group.onQuerys);
router.post('/group', group.onCreate);
router.put('/group', group.onUpdate);
router.delete('/group', group.onDelete);

router.get('/permission', permission.onQuerys);
router.post('/permission', permission.onCreate);
router.put('/permission', permission.onUpdate);
router.delete('/permission', permission.onDelete);
router.post('/permission/create/batch', permission.onCreateeBatch);
router.put('/permission/update/batch', permission.onUpdateBatch);
router.get('/permission/my', permission.onMyPermissions);

router.get('/assignment', assignment.onQuerys);
router.post('/assignment', assignment.onCreate);
router.put('/assignment', assignment.onUpdate);
router.delete('/assignment', assignment.onDelete);

module.exports = router;
