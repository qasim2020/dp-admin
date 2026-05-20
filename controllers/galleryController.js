const GalleryItem = require('../models/GalleryItem');
const Log = require('../models/Logs');
const { deleteImageByPublicId, deleteImageByUrl } = require('../modules/cloudinaryService');

exports.getGallery = async (req, res) => {
    try {
        const itemsRaw = await GalleryItem.find().sort({ sortOrder: -1, createdAt: -1, _id: -1 }).lean();
        const items = itemsRaw.map((item, index) => ({
            ...item,
            displayIndex: index + 1,
        }));
        res.render('gallery', {
            title: 'Gallery',
            items,
            activeMenu: 'gallery',
            userId: req.session.userId,
            userName: req.session.name,
            sidebarCollapsed: req.session.sidebarCollapsed || false,
        });
    } catch (e) {
        res.render('error', { title: 'Error', message: e.message });
    }
};

exports.createItem = async (req, res) => {
    try {
        const { url, caption, type, category, isFeatured, publicId } = req.body;
        const last = await GalleryItem.findOne().sort({ sortOrder: -1 }).select('sortOrder').lean();
        const nextSortOrder = typeof last?.sortOrder === 'number' ? last.sortOrder + 1 : 1;

        const item = await GalleryItem.create({
            url,
            cloudinaryPublicId: publicId || '',
            caption,
            type: type || 'image',
            category,
            isFeatured: isFeatured === 'true',
            sortOrder: nextSortOrder,
        });
        await Log.create({ user: req.session.userId, action: 'create', entityType: 'GalleryItem', entityId: item._id, message: `Added gallery item`, ip: req.ip });
        res.json({ success: true, item });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.reorderItems = async (req, res) => {
    try {
        const orderedIds = Array.isArray(req.body.orderedIds) ? req.body.orderedIds : [];
        if (!orderedIds.length) {
            return res.status(400).json({ error: 'orderedIds is required' });
        }

        const total = orderedIds.length;
        const updates = orderedIds.map((id, index) =>
            GalleryItem.updateOne({ _id: id }, { $set: { sortOrder: total - index } })
        );

        await Promise.all(updates);
        await Log.create({ user: req.session.userId, action: 'reorder', entityType: 'GalleryItem', message: 'Reordered gallery items', ip: req.ip });

        return res.json({ success: true });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const item = await GalleryItem.findById(req.params.id).lean();
        if (!item) {
            return res.status(404).json({ error: 'Gallery item not found' });
        }

        if (item.cloudinaryPublicId) {
            await deleteImageByPublicId(item.cloudinaryPublicId);
        } else if (item.url) {
            await deleteImageByUrl(item.url);
        }

        await GalleryItem.findByIdAndDelete(req.params.id);
        await Log.create({ user: req.session.userId, action: 'delete', entityType: 'GalleryItem', entityId: req.params.id, message: `Deleted gallery item`, ip: req.ip });
        return res.json({ success: true });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
