const Webinar = require('../models/Webinar');
const Log = require('../models/Logs');
const {
    createUniqueWebinarSlug,
    normalizePlaybackId,
} = require('../services/webinarService');
const {
    createDirectUploadUrl,
} = require('../services/streamService');
const {
    buildAttachmentStorageKey,
    createSignedUploadUrl,
    createSignedDeleteUrl,
} = require('../services/attachmentStorageService');

function normalizeAttachments(input) {
    const list = Array.isArray(input) ? input : [];
    return list
        .map((item, index) => ({
            label: String(item?.label || '').trim(),
            storageKey: String(item?.storageKey || '').trim(),
            mimeType: String(item?.mimeType || '').trim(),
            size: Number(item?.size || 0),
            sortOrder: Number(item?.sortOrder ?? index + 1),
        }))
        .filter((item) => item.label && item.storageKey)
        .sort((a, b) => b.sortOrder - a.sortOrder);
}

function parsePayload(req) {
    const attachmentsRaw = req.body.attachments;
    let attachments = [];

    if (typeof attachmentsRaw === 'string') {
        try {
            attachments = JSON.parse(attachmentsRaw);
        } catch (error) {
            attachments = [];
        }
    } else if (Array.isArray(attachmentsRaw)) {
        attachments = attachmentsRaw;
    }

    const playbackId = normalizePlaybackId(req.body.streamPlaybackId);
    const published = String(req.body.published) === 'true' || req.body.published === true;

    return {
        title: String(req.body.title || '').trim(),
        summary: String(req.body.summary || '').trim(),
        content: String(req.body.content || ''),
        thumbnailUrl: String(req.body.thumbnailUrl || '').trim(),
        streamProvider: 'cloudflare_stream',
        streamPlaybackId: playbackId,
        duration: Number(req.body.duration || 0),
        published,
        publishedAt: published ? new Date(req.body.publishedAt || Date.now()) : null,
        attachments: normalizeAttachments(attachments),
    };
}

exports.getWebinars = async (req, res) => {
    try {
        const webinars = await Webinar.find().sort({ sortOrder: -1, createdAt: -1 }).lean();
        res.render('webinars', {
            title: 'Webinars',
            webinars,
            activeMenu: 'webinars',
            userId: req.session.userId,
            userName: req.session.name,
            sidebarCollapsed: req.session.sidebarCollapsed || false,
        });
    } catch (error) {
        res.render('error', { title: 'Error', message: error.message });
    }
};

exports.createWebinar = async (req, res) => {
    try {
        const payload = parsePayload(req);
        if (!payload.title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const last = await Webinar.findOne().sort({ sortOrder: -1 }).select('sortOrder').lean();
        const slug = await createUniqueWebinarSlug(Webinar, payload.title);

        const webinar = await Webinar.create({
            ...payload,
            slug,
            sortOrder: typeof last?.sortOrder === 'number' ? last.sortOrder + 1 : 1,
        });

        await Log.create({
            user: req.session.userId,
            action: 'create',
            entityType: 'Webinar',
            entityId: webinar._id,
            message: `Created webinar: ${webinar.title}`,
            ip: req.ip,
        });

        return res.json({ success: true, webinar });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.updateWebinar = async (req, res) => {
    try {
        const payload = parsePayload(req);
        if (!payload.title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const slug = await createUniqueWebinarSlug(Webinar, payload.title, req.params.id);
        const webinar = await Webinar.findByIdAndUpdate(
            req.params.id,
            {
                ...payload,
                slug,
            },
            { new: true }
        );

        if (!webinar) {
            return res.status(404).json({ error: 'Webinar not found' });
        }

        await Log.create({
            user: req.session.userId,
            action: 'update',
            entityType: 'Webinar',
            entityId: webinar._id,
            message: `Updated webinar: ${webinar.title}`,
            ip: req.ip,
        });

        return res.json({ success: true, webinar });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.deleteWebinar = async (req, res) => {
    try {
        const webinar = await Webinar.findByIdAndDelete(req.params.id);
        if (!webinar) {
            return res.status(404).json({ error: 'Webinar not found' });
        }

        await Log.create({
            user: req.session.userId,
            action: 'delete',
            entityType: 'Webinar',
            entityId: req.params.id,
            message: `Deleted webinar: ${webinar.title}`,
            ip: req.ip,
        });

        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.reorderWebinars = async (req, res) => {
    try {
        const orderedIds = Array.isArray(req.body.orderedIds) ? req.body.orderedIds : [];
        if (!orderedIds.length) {
            return res.status(400).json({ error: 'orderedIds is required' });
        }

        const total = orderedIds.length;
        await Promise.all(
            orderedIds.map((id, index) => Webinar.updateOne({ _id: id }, { $set: { sortOrder: total - index } }))
        );

        await Log.create({
            user: req.session.userId,
            action: 'reorder',
            entityType: 'Webinar',
            message: 'Reordered webinars',
            ip: req.ip,
        });

        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.createAttachmentUploadUrl = async (req, res) => {
    try {
        const fileName = String(req.body.fileName || '').trim();
        const mimeType = String(req.body.mimeType || 'application/octet-stream').trim();
        const webinarId = String(req.body.webinarId || 'new').trim();

        if (!fileName) {
            return res.status(400).json({ error: 'fileName is required' });
        }

        const storageKey = buildAttachmentStorageKey({ webinarId, fileName });
        const signed = createSignedUploadUrl(storageKey, mimeType, 300);

        return res.json({
            success: true,
            storageKey,
            signedUrl: signed.url,
            expiresAt: signed.expiresAt,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.createAttachmentDeleteUrl = async (req, res) => {
    try {
        const storageKey = String(req.body.storageKey || '').trim();
        if (!storageKey) {
            return res.status(400).json({ error: 'storageKey is required' });
        }

        const signed = createSignedDeleteUrl(storageKey, 120);
        return res.json({ success: true, signedUrl: signed.url, expiresAt: signed.expiresAt });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.createStreamDirectUploadUrl = async (req, res) => {
    try {
        const result = await createDirectUploadUrl({
            maxDurationSeconds: Number(req.body.maxDurationSeconds || 0) || undefined,
        });
        return res.json({ success: true, result });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
