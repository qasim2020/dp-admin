const express = require('express');
const router = express.Router();
const requireLogin = require('../modules/authenticate');
const galleryController = require('../controllers/galleryController');

router.get('/gallery', requireLogin, galleryController.getGallery);
router.post('/gallery', requireLogin, galleryController.createItem);
router.put('/gallery/:id', requireLogin, galleryController.updateItem);
router.delete('/gallery/:id', requireLogin, galleryController.deleteItem);

module.exports = router;
