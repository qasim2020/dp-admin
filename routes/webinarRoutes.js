const express = require('express');
const router = express.Router();
const requireLogin = require('../modules/authenticate');
const webinarController = require('../controllers/webinarController');

router.get('/webinars', requireLogin, webinarController.getWebinars);
router.post('/webinars', requireLogin, webinarController.createWebinar);
router.put('/webinars/:id', requireLogin, webinarController.updateWebinar);
router.delete('/webinars/:id', requireLogin, webinarController.deleteWebinar);
router.put('/webinars/reorder', requireLogin, webinarController.reorderWebinars);

router.post('/webinars/attachments/upload-url', requireLogin, webinarController.createAttachmentUploadUrl);
router.post('/webinars/attachments/delete-url', requireLogin, webinarController.createAttachmentDeleteUrl);
router.post('/webinars/stream/direct-upload-url', requireLogin, webinarController.createStreamDirectUploadUrl);

module.exports = router;
