const express = require('express');
const router = express.Router();
const requireLogin = require('../modules/authenticate');
const memberController = require('../controllers/memberController');

router.get('/members', requireLogin, memberController.getMembers);
router.post('/members', requireLogin, memberController.createMember);
router.put('/members/:id', requireLogin, memberController.updateMember);
router.post('/members/:id/toggle-status', requireLogin, memberController.toggleMemberStatus);
router.post('/members/:id/resend-invite', requireLogin, memberController.resendInvite);

module.exports = router;
