const express = require('express');
const router = express.Router();
const requireLogin = require('../modules/authenticate');
const eventController = require('../controllers/eventController');

router.get('/events', requireLogin, eventController.getEvents);
router.get('/events/:id', requireLogin, eventController.getEvent);
router.post('/events', requireLogin, eventController.createEvent);
router.put('/events/:id', requireLogin, eventController.updateEvent);
router.delete('/events/:id', requireLogin, eventController.deleteEvent);

module.exports = router;
