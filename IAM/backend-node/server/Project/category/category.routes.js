'use strict';

const express = require('express');
const router = express.Router();

const category = require('./service/category');

router.get('/', category.onQuerys);
router.get('/one', category.onQuery);
router.post('/', category.onCreate);
router.put('/', category.onUpdate);
router.delete('/', category.onDelete);

module.exports = router;
