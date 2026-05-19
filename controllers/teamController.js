const TeamMember = require('../models/TeamMember');
const Log = require('../models/Logs');

exports.getTeam = async (req, res) => {
    try {
        const members = await TeamMember.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
        res.render('team', { title: 'Team', members, sidebarCollapsed: req.session.sidebarCollapsed || false });
    } catch (e) {
        res.render('error', { title: 'Error', message: e.message });
    }
};

exports.createMember = async (req, res) => {
    try {
        const { name, role, bio, imageUrl, email, sortOrder, isActive, twitter, linkedin, facebook } = req.body;
        const member = await TeamMember.create({
            name, role, bio, imageUrl, email,
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
        const { name, role, bio, imageUrl, email, sortOrder, isActive, twitter, linkedin, facebook } = req.body;
        const member = await TeamMember.findByIdAndUpdate(req.params.id, {
            name, role, bio, imageUrl, email,
            sortOrder: Number(sortOrder) || 0,
            isActive: isActive !== 'false',
            socialLinks: { twitter: twitter || '', linkedin: linkedin || '', facebook: facebook || '' },
        }, { new: true });
        await Log.create({ user: req.session.userId, action: 'update', entityType: 'TeamMember', entityId: member._id, message: `Updated team member: ${name}`, ip: req.ip });
        res.json({ success: true, member });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.deleteMember = async (req, res) => {
    try {
        await TeamMember.findByIdAndDelete(req.params.id);
        await Log.create({ user: req.session.userId, action: 'delete', entityType: 'TeamMember', entityId: req.params.id, message: `Deleted team member`, ip: req.ip });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
