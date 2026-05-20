const User = require('../models/User');
const Log = require('../models/Logs');
const Settings = require('../models/Settings');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { createLog } = require('../modules/logService');

const INVITE_EXPIRY_HOURS = 72;

const normalizeHexColor = (value, fallback = '#0f6ad8') => {
    const raw = String(value || '').trim();
    if (!raw) return fallback;
    const normalized = raw.startsWith('#') ? raw : `#${raw}`;
    return /^#([0-9a-fA-F]{6})$/.test(normalized) ? normalized.toLowerCase() : fallback;
};

const hexToRgb = (hex) => {
    const normalized = normalizeHexColor(hex).replace('#', '');
    return {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16),
    };
};

const rgba = (hex, alpha) => {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const toInitials = (value) => {
    const words = String(value || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return 'BR';
    return words.slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
};

const toNameCase = (value, fallback = '') => {
    const text = String(value || '').trim();
    if (!text) return fallback;
    return text
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
};

exports.users = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 }).lean();
        res.render('users', {
            users,
            activeMenu: 'users',
            userId: req.session.userId,
            userName: req.session.name,
            sidebarCollapsed: req.session.sidebarCollapsed ? req.session.sidebarCollapsed : false,
        });
    } catch (error) {
        console.error('Error loading users:', error);
        res.status(500).render('error', {
            message: 'Failed to load users',
            activeMenu: 'users',
            userId: req.session.userId,
            userName: req.session.name,
            sidebarCollapsed: req.session.sidebarCollapsed ? req.session.sidebarCollapsed : false,
        });
    }
};

const sendInviteEmail = async (user, req) => {
    const settings = await Settings.findOne({ key: 'main' }).lean();
    if (!settings || !settings.emailHost || !settings.emailPort || !settings.emailUser || !settings.emailPass) {
        throw new Error('Email settings are not configured');
    }

    const port = Number(settings.emailPort);
    const useSecure = port === 465 ? true : Boolean(settings.emailSecure);

    const transporter = nodemailer.createTransport({
        host: settings.emailHost,
        port,
        secure: useSecure,
        requireTLS: !useSecure,
        ignoreTLS: false,
        tls: {
            rejectUnauthorized: false,
        },
        auth: {
            user: settings.emailUser,
            pass: settings.emailPass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
    });

    const templatePath = path.join(__dirname, '../views/emails/inviteUser.hbs');
    const templateSource = await fs.readFile(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(templateSource);

    const fallbackDomain = process.env.DOMAIN_URL || '';
    const baseUrl = req?.protocol && req?.get ? `${req.protocol}://${req.get('host')}` : fallbackDomain;
    const loginUrl = baseUrl ? `${baseUrl}/login` : '';
    const forgotPasswordUrl = baseUrl ? `${baseUrl}/forgot-password` : '';
    let registrationUrl = '';

    if (baseUrl) {
        const inviteTokenRaw = crypto.randomBytes(32).toString('hex');
        const inviteTokenHash = crypto.createHash('sha256').update(inviteTokenRaw).digest('hex');
        await User.findByIdAndUpdate(user._id, {
            inviteToken: inviteTokenHash,
            inviteExpiresAt: new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000),
        });
        registrationUrl = `${baseUrl}/register?token=${inviteTokenRaw}`;
    }

    const html = compiledTemplate({
        name: toNameCase(user.name, 'Friend'),
        invitedBy: toNameCase(req.session?.name, 'Team'),
        loginUrl,
        registrationUrl,
        isRegistrationInvite: true,
        forgotPasswordUrl,
        brandName: settings.brandName || 'Dedicated Parents',
        logoUrl: settings.logoUrl || '',
        logoFallbackText: toInitials(settings.brandName || 'Dedicated Parents'),
        brandPrimaryColor: normalizeHexColor(settings.primaryColor, '#0f6ad8'),
        brandPrimaryColorLight: rgba(settings.primaryColor || '#0f6ad8', 0.20),
        brandPrimaryColorLighter: rgba(settings.primaryColor || '#0f6ad8', 0.10),
        brandPrimaryColorSoftest: rgba(settings.primaryColor || '#0f6ad8', 0.03),
    });

    await transporter.sendMail({
        from: `"${settings.emailFromName || 'Dedicated Parents'}" <${settings.emailFromAddress || settings.emailUser}>`,
        to: user.email,
        subject: `Complete your access to ${settings.brandName || 'Dedicated Parents'} Admin`,
        html,
    });

    createLog({
        req,
        action: 'invite',
        entityType: 'user',
        entityId: user._id,
        message: `Invite email sent to ${user.email} by ${req.session?.name || 'system'}`,
        metadata: { email: user.email, invitedBy: req.session?.name || 'system' },
    });
};

exports.createUser = async (req, res) => {
    try {
        const { name, email } = req.body;

        const user = new User({
            name,
            email,
        });

        await user.save();
        createLog({
            req,
            action: 'create',
            entityType: 'user',
            entityId: user._id,
            message: `User ${user.name} created by ${req.session?.name || 'system'}`,
            metadata: { email: user.email, name: user.name, createdBy: req.session?.name || 'system' },
        });

        try {
            await sendInviteEmail(user, req);
            return res.status(201).json({ message: 'User created and invite sent', inviteSent: true });
        } catch (inviteError) {
            console.log(inviteError);
            return res.status(201).json({ message: 'User created but invite failed', inviteSent: false, error: inviteError.message });
        }
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const updated = await User.findByIdAndUpdate(
            id,
            {
                name,
            },
            { new: true }
        ).lean();

        if (!updated) {
            return res.status(404).json({ error: 'User not found' });
        }

        createLog({
            req,
            action: 'update',
            entityType: 'user',
            entityId: updated._id,
            message: `User ${updated.name} updated by ${req.session?.name || 'system'}`,
            metadata: { name: updated.name, updatedBy: req.session?.name || 'system' },
        });

        return res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.userView = async (req, res) => {
    try {
        const { id } = req.params;
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
        const skip = (page - 1) * limit;
        const user = await User.findById(id).lean();

        if (!user) {
            return res.status(404).render('error', {
                message: 'User not found',
                activeMenu: 'users',
                userId: req.session.userId,
                userName: req.session.name,
                sidebarCollapsed: req.session.sidebarCollapsed ? req.session.sidebarCollapsed : false,
            });
        }

        const [logs, totalLogs] = await Promise.all([
            Log.find({ user: id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Log.countDocuments({ user: id }),
        ]);

        const totalPages = Math.max(Math.ceil(totalLogs / limit), 1);
        const safePage = Math.min(page, totalPages);
        const pages = Array.from({ length: totalPages }, (_, idx) => ({
            number: idx + 1,
            isCurrent: idx + 1 === safePage,
        }));

        return res.render('user-view', {
            user,
            logs,
            pagination: {
                page: safePage,
                limit,
                total: totalLogs,
                totalPages,
                hasPrev: safePage > 1,
                hasNext: safePage < totalPages,
                prevPage: safePage - 1,
                nextPage: safePage + 1,
                pages,
            },
            activeMenu: 'users',
            userId: req.session.userId,
            userName: req.session.name,
            sidebarCollapsed: req.session.sidebarCollapsed ? req.session.sidebarCollapsed : false,
        });
    } catch (error) {
        console.error('Error loading user view:', error);
        return res.status(500).render('error', {
            message: 'Failed to load user',
            activeMenu: 'users',
            userId: req.session.userId,
            userName: req.session.name,
            sidebarCollapsed: req.session.sidebarCollapsed ? req.session.sidebarCollapsed : false,
        });
    }
};

exports.sendInvite = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).lean();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await sendInviteEmail(user, req);

        return res.json({ message: 'Invite sent successfully' });
    } catch (error) {
        console.error('Error sending invite:', error);
        return res.status(500).json({ error: 'Failed to send invite' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).lean();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const activityCount = await Log.countDocuments({ user: id });
        if (activityCount > 0) {
            return res.status(400).json({ error: 'User has activity and cannot be deleted' });
        }

        await User.deleteOne({ _id: id });
        createLog({
            req,
            action: 'delete',
            entityType: 'user',
            entityId: id,
            message: `User ${user.email} deleted by ${req.session?.name || 'system'}`,
            metadata: { email: user.email, deletedBy: req.session?.name || 'system' },
        });

        return res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
