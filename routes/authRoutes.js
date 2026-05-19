const express = require('express');
const router = express.Router();
const userController = require('../controllers/authController');

router.get('/login', userController.renderLoginPage);
router.post('/login', userController.login);
router.get('/forgot-password', userController.renderForgotPasswordPage);
router.post('/forgot-password', userController.forgotPassword);
router.get('/reset-password', userController.renderResetPasswordPage);
router.post('/reset-password', userController.resetPassword);
router.get('/logout', userController.logout);

module.exports = router;
