const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../../../../middleware/authMiddleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
