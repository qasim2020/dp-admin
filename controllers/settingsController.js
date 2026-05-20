const Settings = require('../models/Settings');
const { createLog } = require('../modules/logService');
const { deleteImageByUrl } = require('../modules/cloudinaryService');

const normalizeHexColor = (value, fallback = '#0f6ad8') => {
    const raw = String(value || '').trim();
    if (!raw) return fallback;
    const normalized = raw.startsWith('#') ? raw : `#${raw}`;
    return /^#([0-9a-fA-F]{6})$/.test(normalized) ? normalized.toLowerCase() : fallback;
};

const getOrCreateSettings = async () => {
    const existing = await Settings.findOne({ key: 'main' }).lean();
    if (existing) return existing;

    const created = await Settings.create({ key: 'main' });
    return created.toObject();
};

exports.getSettings = async (req, res) => {
    const settings = await getOrCreateSettings();

    res.render('settings', {
        settings,
        activeMenu: 'settings',
        userId: req.session.userId,
        userName: req.session.name,
        sidebarCollapsed: req.session.sidebarCollapsed ? req.session.sidebarCollapsed : false,
    });
};

exports.updateSettings = async (req, res) => {
    try {
        const current = await getOrCreateSettings();
        const {
            brandName,
            logoUrl,
            primaryColor,
            emailHost,
            emailPort,
            emailUser,
            emailPass,
            emailSecure,
            emailFromName,
            emailFromAddress,
            socialFacebook,
            socialInstagram,
            socialTwitter,
            socialLinkedIn,
            socialYouTube,
            socialTikTok,
            ticketEmails,
        } = req.body;


        const normalizedTicketEmails = Array.isArray(ticketEmails)
            ? ticketEmails.map((email) => String(email).trim()).filter(Boolean)
            : (ticketEmails || '')
                .split(/[,\n]/)
                .map((email) => email.trim())
                .filter(Boolean);


        const updated = await Settings.findOneAndUpdate(
            { key: 'main' },
            {
                brandName: brandName?.trim() || current.brandName,
                logoUrl: logoUrl || current.logoUrl,
                primaryColor: normalizeHexColor(primaryColor, current.primaryColor || '#0f6ad8'),
                emailHost: emailHost?.trim() || '',
                emailPort: Number(emailPort) || 587,
                emailUser: emailUser?.trim() || '',
                emailPass: emailPass?.trim() || '',
                emailSecure: String(emailSecure) === 'true',
                emailFromName: emailFromName?.trim() || '',
                emailFromAddress: emailFromAddress?.trim() || '',
                socialFacebook: socialFacebook?.trim() || '',
                socialInstagram: socialInstagram?.trim() || '',
                socialTwitter: socialTwitter?.trim() || '',
                socialLinkedIn: socialLinkedIn?.trim() || '',
                socialYouTube: socialYouTube?.trim() || '',
                socialTikTok: socialTikTok?.trim() || '',
                ticketEmails: normalizedTicketEmails,
            },
            { new: true }
        ).lean();

        if (current.logoUrl && logoUrl && current.logoUrl !== logoUrl) {
            try {
                await deleteImageByUrl(current.logoUrl);
            } catch (deleteError) {
                console.error('Failed to delete previous logo:', deleteError);
            }
        }

        createLog({
            req,
            action: 'update',
            entityType: 'settings',
            entityId: updated?._id,
            message: `Settings updated by ${req.session?.name || 'system'}`,
        });

        return res.json({ message: 'Settings saved successfully' });
    } catch (error) {
        console.error('Error updating settings:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
