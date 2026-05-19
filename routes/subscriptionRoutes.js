const express = require('express');
const router = express.Router();
const requireLogin = require('../modules/authenticate');
const subscriptionController = require('../controllers/subscriptionController');

router.get('/subscriptions', requireLogin, subscriptionController.subscriptions);
router.get('/subscriptions/download', requireLogin, subscriptionController.download);

module.exports = router;
