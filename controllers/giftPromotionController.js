const GiftPromotion = require('../models/GiftPromotion');
const Log = require('../models/Logs');

function parsePayload(req) {
    const name = String(req.body.name || '').trim();
    const description = String(req.body.description || '').trim();
    const imageUrl = String(req.body.imageUrl || '').trim();
    const url = String(req.body.url || '').trim();
    const isActive = String(req.body.isActive) === 'true' || req.body.isActive === true;

    return { name, description, imageUrl, url, isActive };
}

exports.getGiftPromotions = async (req, res) => {
    try {
        const giftPromotions = await GiftPromotion.find().sort({ sortOrder: -1, createdAt: -1 }).lean();
        return res.render('gift-promotions', {
            title: 'Gifts & Promotions',
            giftPromotions,
            activeMenu: 'gift-promotions',
            userId: req.session.userId,
            userName: req.session.name,
            sidebarCollapsed: req.session.sidebarCollapsed || false,
        });
    } catch (error) {
        return res.render('error', { title: 'Error', message: error.message });
    }
};

exports.createGiftPromotion = async (req, res) => {
    try {
        const payload = parsePayload(req);
        if (!payload.name || !payload.url) {
            return res.status(400).json({ error: 'Name and URL are required' });
        }

        const last = await GiftPromotion.findOne().sort({ sortOrder: -1 }).select('sortOrder').lean();
        const giftPromotion = await GiftPromotion.create({
            ...payload,
            sortOrder: typeof last?.sortOrder === 'number' ? last.sortOrder + 1 : 1,
        });

        await Log.create({
            user: req.session.userId,
            action: 'create',
            entityType: 'GiftPromotion',
            entityId: giftPromotion._id,
            message: `Created gift/promotion: ${giftPromotion.name}`,
            ip: req.ip,
        });

        return res.status(201).json({ success: true, giftPromotion });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.updateGiftPromotion = async (req, res) => {
    try {
        const payload = parsePayload(req);
        if (!payload.name || !payload.url) {
            return res.status(400).json({ error: 'Name and URL are required' });
        }

        const giftPromotion = await GiftPromotion.findByIdAndUpdate(req.params.id, payload, { new: true });
        if (!giftPromotion) {
            return res.status(404).json({ error: 'Gift/Promotion not found' });
        }

        await Log.create({
            user: req.session.userId,
            action: 'update',
            entityType: 'GiftPromotion',
            entityId: giftPromotion._id,
            message: `Updated gift/promotion: ${giftPromotion.name}`,
            ip: req.ip,
        });

        return res.json({ success: true, giftPromotion });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.deleteGiftPromotion = async (req, res) => {
    try {
        const giftPromotion = await GiftPromotion.findByIdAndDelete(req.params.id);
        if (!giftPromotion) {
            return res.status(404).json({ error: 'Gift/Promotion not found' });
        }

        await Log.create({
            user: req.session.userId,
            action: 'delete',
            entityType: 'GiftPromotion',
            entityId: req.params.id,
            message: `Deleted gift/promotion: ${giftPromotion.name}`,
            ip: req.ip,
        });

        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
