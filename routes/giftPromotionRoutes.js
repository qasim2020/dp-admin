const express = require('express');
const router = express.Router();
const requireLogin = require('../modules/authenticate');
const giftPromotionController = require('../controllers/giftPromotionController');

router.get('/gift-promotions', requireLogin, giftPromotionController.getGiftPromotions);
router.post('/gift-promotions', requireLogin, giftPromotionController.createGiftPromotion);
router.put('/gift-promotions/:id', requireLogin, giftPromotionController.updateGiftPromotion);
router.delete('/gift-promotions/:id', requireLogin, giftPromotionController.deleteGiftPromotion);

module.exports = router;
