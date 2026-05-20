const Cause = require('../models/Cause');
const Log = require('../models/Logs');

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const normalizeCause = (cause) => {
    const title = cause.title || cause.name || 'Untitled Cause';
    const coverImageUrl = cause.coverImageUrl || cause.bannerImg || '';
    const excerpt = cause.excerpt || cause.subtitle || '';
    const content = cause.content || cause.detail || '';

    return {
        ...cause,
        title,
        coverImageUrl,
        excerpt,
        content,
        displayTitle: title,
        displayImage: coverImageUrl,
    };
};

exports.getCauses = async (req, res) => {
    try {
        const causesRaw = await Cause.find().sort({ createdAt: -1 }).lean();
        const causes = causesRaw.map(normalizeCause);
        res.render('causes', {
            title: 'Causes',
            causes,
            activeMenu: 'causes',
            userId: req.session.userId,
            userName: req.session.name,
            sidebarCollapsed: req.session.sidebarCollapsed || false,
        });
    } catch (e) {
        res.render('error', { title: 'Error', message: e.message });
    }
};

exports.getCause = async (req, res) => {
    try {
        const causeRaw = await Cause.findById(req.params.id).lean();
        const cause = causeRaw ? normalizeCause(causeRaw) : null;
        if (!cause) return res.render('error', { title: 'Not Found', message: 'Cause not found' });
        res.render('cause-view', {
            title: cause.title,
            cause,
            activeMenu: 'causes',
            userId: req.session.userId,
            userName: req.session.name,
            sidebarCollapsed: req.session.sidebarCollapsed || false,
        });
    } catch (e) {
        res.render('error', { title: 'Error', message: e.message });
    }
};

exports.createCause = async (req, res) => {
    try {
        const { title, excerpt, content, coverImageUrl, goalAmount, tags, isFeatured, isActive } = req.body;
        const slug = slugify(title) + '-' + Date.now();
        const cause = await Cause.create({
            title, slug, excerpt, content, coverImageUrl,
            goalAmount: Number(goalAmount) || 0,
            tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            isFeatured: isFeatured === 'true',
            isActive: isActive !== 'false',
        });
        await Log.create({ user: req.session.userId, action: 'create', entityType: 'Cause', entityId: cause._id, message: `Created cause: ${title}`, ip: req.ip });
        res.json({ success: true, cause });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.updateCause = async (req, res) => {
    try {
        const { title, excerpt, content, coverImageUrl, goalAmount, raisedAmount, tags, isFeatured, isActive } = req.body;
        const cause = await Cause.findByIdAndUpdate(req.params.id, {
            title, excerpt, content, coverImageUrl,
            goalAmount: Number(goalAmount) || 0,
            raisedAmount: Number(raisedAmount) || 0,
            tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            isFeatured: isFeatured === 'true',
            isActive: isActive !== 'false',
        }, { new: true });
        await Log.create({ user: req.session.userId, action: 'update', entityType: 'Cause', entityId: cause._id, message: `Updated cause: ${title}`, ip: req.ip });
        res.json({ success: true, cause });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.deleteCause = async (req, res) => {
    try {
        const cause = await Cause.findByIdAndDelete(req.params.id);
        await Log.create({ user: req.session.userId, action: 'delete', entityType: 'Cause', entityId: req.params.id, message: `Deleted cause: ${cause?.title}`, ip: req.ip });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
