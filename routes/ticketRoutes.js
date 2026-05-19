const express = require('express');
const router = express.Router();
const requireLogin = require('../modules/authenticate');
const ticketController = require('../controllers/ticketController');

router.get('/tickets', requireLogin, ticketController.ticketsIndex);
router.get('/tickets/:id', requireLogin, ticketController.ticketView);
router.post('/tickets/:id/read', requireLogin, ticketController.markTicketRead);
router.post('/tickets/:id/unread', requireLogin, ticketController.markTicketUnread);

module.exports = router;
