const fs = require('fs');
const path = require('path');

const Settings = require('../models/Settings');
const { createLog } = require('../modules/logService');

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

        if (current.logoUrl && logoUrl && current.logoUrl !== logoUrl && current.logoUrl.startsWith('/uploads/')) {
            const normalized = current.logoUrl.replace(/^\//, '');
            const filePath = path.join(__dirname, '..', normalized);
            fs.unlink(filePath, (err) => {
                if (err && err.code !== 'ENOENT') {
                    console.error('Failed to delete previous logo:', err);
                }
            });
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
