const mongoose = require('mongoose');

const GiftPromotionSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        imageUrl: { type: String, default: '', trim: true },
        url: { type: String, required: true, trim: true },
        isActive: { type: Boolean, default: true },
        sortOrder: { type: Number, default: 0 },
    },
    {
        timestamps: true,
        collection: 'gift_promotions',
    }
);

module.exports = mongoose.model('GiftPromotion', GiftPromotionSchema);
