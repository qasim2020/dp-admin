const TeamMember = require('../models/TeamMember');
const mongoose = require('mongoose');
const Log = require('../models/Logs');
const { deleteImageByPublicId, deleteImageByUrl } = require('../modules/cloudinaryService');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || 'miscellaneous';

const toTeamPhotoUrl = (member) => {
    const direct = member.imageUrl || '';
    if (direct) {
        return direct;
    }

    const legacyImage = member.image || '';
    if (!legacyImage) {
        return '';
    }

    if (legacyImage.startsWith('http://') || legacyImage.startsWith('https://')) {
        return legacyImage;
    }

    return `https://res.cloudinary.com/${cloudName}/image/upload/dedicatedparents/team-photos/${legacyImage}`;
};

const normalizeTeamMember = (member) => {
    const socialLinks = member.socialLinks || {};
    return {
        ...member,
        socialLinks,
        displaySocialLinks: {
            twitter: socialLinks.twitter || member.twitter || '',
            linkedin: socialLinks.linkedin || member.linkedin || '',
            facebook: socialLinks.facebook || member.facebook || '',
        },
        displayName: member.name || member.title || 'Unnamed',
        displayRole: member.role || '',
        displayEmail: member.email || member.contactEmail || member.mail || '',
        displayBio: member.bio || member.detail || member.description || member.content || '',
        imageUrl: toTeamPhotoUrl(member),
    };
};

exports.getTeam = async (req, res) => {
    try {
        const membersRaw = await TeamMember.find().sort({ sortOrder: -1, createdAt: -1, _id: -1 }).lean();
        const members = membersRaw.map(normalizeTeamMember).map((member, index) => ({
            ...member,
            displayIndex: index + 1,
        }));
        res.render('team', {
            title: 'Team',
            members,
            activeMenu: 'team',
            userId: req.session.userId,
            userName: req.session.name,
            sidebarCollapsed: req.session.sidebarCollapsed || false,
        });
    } catch (e) {
        res.render('error', { title: 'Error', message: e.message });
    }
};

exports.getMember = async (req, res) => {
    try {
        const memberRaw = await TeamMember.findById(req.params.id).lean();
        if (!memberRaw) {
            return res.status(404).render('error', { title: 'Not Found', message: 'Team member not found' });
        }

        const member = normalizeTeamMember(memberRaw);
        return res.render('team-view', {
            title: 'Team Member Details',
            member,
            activeMenu: 'team',
            userId: req.session.userId,
            userName: req.session.name,
            sidebarCollapsed: req.session.sidebarCollapsed || false,
        });
    } catch (e) {
        return res.render('error', { title: 'Error', message: e.message });
    }
};

exports.createMember = async (req, res) => {
    try {
        const { name, role, bio, imageUrl, imagePublicId, email, sortOrder, twitter, linkedin, facebook } = req.body;
        const last = await TeamMember.findOne().sort({ sortOrder: -1 }).select('sortOrder').lean();
        const nextSortOrder = typeof last?.sortOrder === 'number' ? last.sortOrder + 1 : 1;

        const member = await TeamMember.create({
            name, role, bio, imageUrl, email,
            imagePublicId: imagePublicId || '',
            sortOrder: Number(sortOrder) || nextSortOrder,
            socialLinks: { twitter: twitter || '', linkedin: linkedin || '', facebook: facebook || '' },
        });
        await Log.create({ user: req.session.userId, action: 'create', entityType: 'TeamMember', entityId: member._id, message: `Created team member: ${name}`, ip: req.ip });
        res.json({ success: true, member });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.reorderMembers = async (req, res) => {
    try {
        const orderedIds = Array.isArray(req.body.orderedIds) ? req.body.orderedIds : [];
        if (!orderedIds.length) {
            return res.status(400).json({ error: 'orderedIds is required' });
        }

        const uniqueValidIds = [...new Set(orderedIds)]
            .filter((id) => mongoose.Types.ObjectId.isValid(id));

        if (!uniqueValidIds.length) {
            return res.status(400).json({ error: 'No valid team ids provided for reorder' });
        }

        const total = uniqueValidIds.length;
        const operations = uniqueValidIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id },
                update: { $set: { sortOrder: total - index } },
            },
        }));

        await TeamMember.bulkWrite(operations);
        await Log.create({ user: req.session.userId, action: 'reorder', entityType: 'TeamMember', message: 'Reordered team members', ip: req.ip });

        return res.json({ success: true });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

exports.updateMember = async (req, res) => {
    try {
        const existing = await TeamMember.findById(req.params.id).lean();
        if (!existing) {
            return res.status(404).json({ error: 'Team member not found' });
        }

        const { name, role, bio, imageUrl, imagePublicId, email, sortOrder, twitter, linkedin, facebook } = req.body;
        const member = await TeamMember.findByIdAndUpdate(req.params.id, {
            name, role, bio, imageUrl, email,
            imagePublicId: imagePublicId || '',
            sortOrder: Number(sortOrder) || 0,
            socialLinks: { twitter: twitter || '', linkedin: linkedin || '', facebook: facebook || '' },
        }, { new: true });

        if (existing.imageUrl && existing.imageUrl !== imageUrl) {
            if (existing.imagePublicId) {
                await deleteImageByPublicId(existing.imagePublicId);
            } else {
                await deleteImageByUrl(existing.imageUrl);
            }
        }

        await Log.create({ user: req.session.userId, action: 'update', entityType: 'TeamMember', entityId: member._id, message: `Updated team member: ${name}`, ip: req.ip });
        res.json({ success: true, member });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.deleteMember = async (req, res) => {
    try {
        const member = await TeamMember.findById(req.params.id).lean();
        if (!member) {
            return res.status(404).json({ error: 'Team member not found' });
        }

        if (member.imagePublicId) {
            await deleteImageByPublicId(member.imagePublicId);
        } else if (member.imageUrl) {
            await deleteImageByUrl(member.imageUrl);
        }

        await TeamMember.findByIdAndDelete(req.params.id);
        await Log.create({ user: req.session.userId, action: 'delete', entityType: 'TeamMember', entityId: req.params.id, message: `Deleted team member`, ip: req.ip });
        return res.json({ success: true });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
