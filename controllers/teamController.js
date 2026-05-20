const TeamMember = require('../models/TeamMember');
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

exports.getTeam = async (req, res) => {
    try {
        const membersRaw = await TeamMember.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
        const members = membersRaw.map((member) => ({
            ...member,
            displayName: member.name || member.title || 'Unnamed',
            displayRole: member.role || '',
            displayEmail: member.email || '',
            imageUrl: toTeamPhotoUrl(member),
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

exports.createMember = async (req, res) => {
    try {
        const { name, role, bio, imageUrl, imagePublicId, email, sortOrder, isActive, twitter, linkedin, facebook } = req.body;
        const member = await TeamMember.create({
            name, role, bio, imageUrl, email,
            imagePublicId: imagePublicId || '',
            sortOrder: Number(sortOrder) || 0,
            isActive: isActive !== 'false',
            socialLinks: { twitter: twitter || '', linkedin: linkedin || '', facebook: facebook || '' },
        });
        await Log.create({ user: req.session.userId, action: 'create', entityType: 'TeamMember', entityId: member._id, message: `Created team member: ${name}`, ip: req.ip });
        res.json({ success: true, member });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.updateMember = async (req, res) => {
    try {
        const existing = await TeamMember.findById(req.params.id).lean();
        if (!existing) {
            return res.status(404).json({ error: 'Team member not found' });
        }

        const { name, role, bio, imageUrl, imagePublicId, email, sortOrder, isActive, twitter, linkedin, facebook } = req.body;
        const member = await TeamMember.findByIdAndUpdate(req.params.id, {
            name, role, bio, imageUrl, email,
            imagePublicId: imagePublicId || '',
            sortOrder: Number(sortOrder) || 0,
            isActive: isActive !== 'false',
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
