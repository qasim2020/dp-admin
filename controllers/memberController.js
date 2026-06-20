const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const Member = require('../models/Member');
const Log = require('../models/Logs');
const Settings = require('../models/Settings');
const {
    normalizeEmail,
    createToken,
    hashToken,
    tokenExpiry,
} = require('../services/memberAuthService');

function statusBadge(status) {
    if (status === 'active') return 'bg-green-lt text-green';
    if (status === 'disabled') return 'bg-red-lt text-red';
    if (status === 'invited') return 'bg-azure-lt text-azure';
    return 'bg-yellow-lt text-yellow';
}

function normalizeHexColor(value, fallback = '#0f6ad8') {
    const raw = String(value || '').trim();
    if (!raw) return fallback;
    const normalized = raw.startsWith('#') ? raw : `#${raw}`;
    return /^#([0-9a-fA-F]{6})$/.test(normalized) ? normalized.toLowerCase() : fallback;
}

function hexToRgb(hex) {
    const normalized = normalizeHexColor(hex).replace('#', '');
    return {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16),
    };
}

function rgba(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function toInitials(value) {
    const words = String(value || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return 'DP';
    return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('');
}

function toNameCase(value, fallback = '') {
    const text = String(value || '').trim();
    if (!text) return fallback;
    return text
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}

async function getTransporter() {
    const settings = await Settings.findOne({ key: 'main' }).lean();
    if (!settings || !settings.emailHost || !settings.emailPort || !settings.emailUser || !settings.emailPass) {
        throw new Error('Email settings are not configured');
    }

    const port = Number(settings.emailPort);
    const useSecure = port === 465 ? true : Boolean(settings.emailSecure);

    return {
        transporter: nodemailer.createTransport({
            host: settings.emailHost,
            port,
            secure: useSecure,
            requireTLS: !useSecure,
            tls: { rejectUnauthorized: false },
            auth: {
                user: settings.emailUser,
                pass: settings.emailPass,
            },
        }),
        settings,
    };
}

async function sendMemberInviteEmail({ member, token, req }) {
    const { transporter, settings } = await getTransporter();
    const configuredWebsiteUrl = process.env.MEMBER_URL
        || process.env.member_url
        || process.env.DEDICATED_PARENTS_URL
        || process.env.DOMAIN_URL;
    let websiteUrl = configuredWebsiteUrl ? configuredWebsiteUrl.replace(/\/$/, '') : '';

    if (!websiteUrl && req?.protocol && req?.get) {
        const reqHost = String(req.get('host') || '');
        const siteHost = reqHost.replace(/^admin\./i, '');
        websiteUrl = `${req.protocol}://${siteHost || reqHost}`;
    }

    const registrationUrl = `${websiteUrl}/members/signup?token=${encodeURIComponent(token)}`;
    const templatePath = path.join(__dirname, '../views/emails/inviteUser.hbs');
    const templateSource = await fs.readFile(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(templateSource);
    const html = compiledTemplate({
        name: toNameCase(member.name, 'Member'),
        invitedBy: toNameCase(req.session?.name, 'Dedicated Parents Team'),
        registrationUrl,
        isRegistrationInvite: true,
        portalLabel: `${settings.brandName || 'Dedicated Parents'} Members`,
        heading: 'You are invited',
        introLine: 'You were invited to access Dedicated Parents member webinars.',
        registrationLine: 'Use the button below to complete your member registration with your name and password.',
        registrationButtonText: 'Complete Member Registration',
        registrationHint: 'This registration link expires in 72 hours for your security.',
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
        to: member.email,
        subject: `Complete your ${settings.brandName || 'Dedicated Parents'} member registration`,
        html,
    });
}

exports.getMembers = async (req, res) => {
    try {
        const members = await Member.find().sort({ createdAt: -1 }).lean();
        const rows = members.map((member) => ({
            ...member,
            statusBadge: statusBadge(member.status),
        }));

        res.render('members', {
            title: 'Members',
            members: rows,
            activeMenu: 'members',
            userId: req.session.userId,
            userName: req.session.name,
            sidebarCollapsed: req.session.sidebarCollapsed || false,
        });
    } catch (error) {
        res.render('error', { title: 'Error', message: error.message });
    }
};

exports.createMember = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const name = String(req.body.name || '').trim();

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const verifyTokenRaw = createToken(32);
        const member = await Member.create({
            name,
            email,
            status: 'invited',
            emailVerified: false,
            verificationToken: hashToken(verifyTokenRaw),
            verificationTokenExpiresAt: tokenExpiry(72),
            invitedBy: req.session.userId,
        });

        let inviteSent = false;
        let inviteError = null;
        try {
            await sendMemberInviteEmail({ member, token: verifyTokenRaw, req });
            inviteSent = true;
        } catch (error) {
            inviteError = error.message;
        }

        await Log.create({
            user: req.session.userId,
            action: 'create',
            entityType: 'Member',
            entityId: member._id,
            message: `Created member ${member.email}`,
            ip: req.ip,
        });

        return res.status(201).json({ success: true, inviteSent, inviteError, member });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: error.message });
    }
};

exports.updateMember = async (req, res) => {
    try {
        const updates = {};
        if (typeof req.body.name === 'string') {
            updates.name = req.body.name.trim();
        }
        if (typeof req.body.status === 'string') {
            updates.status = req.body.status;
        }

        const member = await Member.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        await Log.create({
            user: req.session.userId,
            action: 'update',
            entityType: 'Member',
            entityId: member._id,
            message: `Updated member ${member.email}`,
            ip: req.ip,
        });

        return res.json({ success: true, member });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.toggleMemberStatus = async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);
        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        member.status = member.status === 'disabled' ? 'active' : 'disabled';
        await member.save();

        await Log.create({
            user: req.session.userId,
            action: 'update',
            entityType: 'Member',
            entityId: member._id,
            message: `Toggled member status ${member.email} -> ${member.status}`,
            ip: req.ip,
        });

        return res.json({ success: true, member });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.resendInvite = async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);
        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        const verifyTokenRaw = createToken(32);
        member.verificationToken = hashToken(verifyTokenRaw);
        member.verificationTokenExpiresAt = tokenExpiry(72);
        member.status = member.status === 'disabled' ? 'disabled' : 'invited';
        await member.save();

        await sendMemberInviteEmail({ member, token: verifyTokenRaw, req });

        await Log.create({
            user: req.session.userId,
            action: 'invite',
            entityType: 'Member',
            entityId: member._id,
            message: `Resent invite to ${member.email}`,
            ip: req.ip,
        });

        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
