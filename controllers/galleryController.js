const GalleryItem = require('../models/GalleryItem');
const Log = require('../models/Logs');

exports.getGallery = async (req, res) => {
    try {
        const items = await GalleryItem.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
        res.render('gallery', { title: 'Gallery', items, sidebarCollapsed: req.session.sidebarCollapsed || false });
    } catch (e) {
        res.render('error', { title: 'Error', message: e.message });
    }
};

exports.createItem = async (req, res) => {
    try {
        const { url, caption, type, category, isActive, isFeatured, sortOrder } = req.body;
        const item = await GalleryItem.create({
            url, caption, type: type || 'image', category,
            isActive: isActive !== 'false',
            isFeatured: isFeatured === 'true',
            sortOrder: Number(sortOrder) || 0,
        });
        await Log.create({ user: req.session.userId, action: 'create', entityType: 'GalleryItem', entityId: item._id, message: `Added gallery item`, ip: req.ip });
        res.json({ success: true, item });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const { url, caption, type, category, isActive, isFeatured, sortOrder } = req.body;
        const item = await GalleryItem.findByIdAndUpdate(req.params.id, {
            url, caption, type, category,
            isActive: isActive !== 'false',
            isFeatured: isFeatured === 'true',
            sortOrder: Number(sortOrder) || 0,
        }, { new: true });
        await Log.create({ user: req.session.userId, action: 'update', entityType: 'GalleryItem', entityId: item._id, message: `Updated gallery item`, ip: req.ip });
        res.json({ success: true, item });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        await GalleryItem.findByIdAndDelete(req.params.id);
        await Log.create({ user: req.session.userId, action: 'delete', entityType: 'GalleryItem', entityId: req.params.id, message: `Deleted gallery item`, ip: req.ip });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
