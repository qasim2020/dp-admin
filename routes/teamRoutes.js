const express = require('express');
const router = express.Router();
const requireLogin = require('../modules/authenticate');
const teamController = require('../controllers/teamController');

router.get('/team', requireLogin, teamController.getTeam);
router.post('/team', requireLogin, teamController.createMember);
router.put('/team/:id', requireLogin, teamController.updateMember);
router.delete('/team/:id', requireLogin, teamController.deleteMember);

module.exports = router;
