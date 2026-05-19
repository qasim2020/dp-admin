const express = require('express');
const router = express.Router();
const requireLogin = require('../modules/authenticate');
const userController = require('../controllers/userController');

router.get('/users', requireLogin, userController.users);
router.get('/users/:id/view', requireLogin, userController.userView);
router.post('/users', requireLogin, userController.createUser);
router.post('/users/:id', requireLogin, userController.updateUser);
router.post('/users/:id/invite', requireLogin, userController.sendInvite);
router.post('/users/:id/delete', requireLogin, userController.deleteUser);

module.exports = router;
