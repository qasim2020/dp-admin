const express = require('express');
const router = express.Router();
const requireLogin = require('../modules/authenticate');
const causeController = require('../controllers/causeController');

router.get('/causes', requireLogin, causeController.getCauses);
router.get('/causes/:id', requireLogin, causeController.getCause);
router.post('/causes', requireLogin, causeController.createCause);
router.put('/causes/:id', requireLogin, causeController.updateCause);
router.delete('/causes/:id', requireLogin, causeController.deleteCause);

module.exports = router;
