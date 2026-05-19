const express = require('express');
const router = express.Router();
const userController = require('../controllers/authController');

router.get('/login', userController.renderLoginPage);
router.post('/send-magic-link', userController.sendMagicLink);
router.get('/auth-magic-link', userController.testMagicLink);
router.get('/logout', userController.logout);

module.exports = router;