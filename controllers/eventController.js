const Event = require('../models/Event');
const Log = require('../models/Logs');

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ eventDate: -1 }).lean();
        res.render('events', { title: 'Events', events, sidebarCollapsed: req.session.sidebarCollapsed || false });
    } catch (e) {
        res.render('error', { title: 'Error', message: e.message });
    }
};

exports.getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).lean();
        if (!event) return res.render('error', { title: 'Not Found', message: 'Event not found' });
        res.render('event-view', { title: event.title, event, sidebarCollapsed: req.session.sidebarCollapsed || false });
    } catch (e) {
        res.render('error', { title: 'Error', message: e.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const { title, excerpt, content, coverImageUrl, location, eventDate, eventEndDate, tags, isFeatured, isActive } = req.body;
        const slug = slugify(title) + '-' + Date.now();
        const event = await Event.create({
            title, slug, excerpt, content, coverImageUrl, location,
            eventDate: eventDate ? new Date(eventDate) : null,
            eventEndDate: eventEndDate ? new Date(eventEndDate) : null,
            tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            isFeatured: isFeatured === 'true',
            isActive: isActive !== 'false',
        });
        await Log.create({ user: req.session.userId, action: 'create', entityType: 'Event', entityId: event._id, message: `Created event: ${title}`, ip: req.ip });
        res.json({ success: true, event });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const { title, excerpt, content, coverImageUrl, location, eventDate, eventEndDate, tags, isFeatured, isActive } = req.body;
        const event = await Event.findByIdAndUpdate(req.params.id, {
            title, excerpt, content, coverImageUrl, location,
            eventDate: eventDate ? new Date(eventDate) : null,
            eventEndDate: eventEndDate ? new Date(eventEndDate) : null,
            tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            isFeatured: isFeatured === 'true',
            isActive: isActive !== 'false',
        }, { new: true });
        await Log.create({ user: req.session.userId, action: 'update', entityType: 'Event', entityId: event._id, message: `Updated event: ${title}`, ip: req.ip });
        res.json({ success: true, event });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        await Log.create({ user: req.session.userId, action: 'delete', entityType: 'Event', entityId: req.params.id, message: `Deleted event: ${event?.title}`, ip: req.ip });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
