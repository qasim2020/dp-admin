const Event = require('../models/Event');
const Log = require('../models/Logs');

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const toDate = (value) => {
    if (!value) return null;
    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeEvent = (event) => {
    const title = event.title || event.name || 'Untitled Event';
    const banner = event.coverImageUrl || event.bannerImg || '';
    const detail = event.content || event.detail || '';
    const location = event.location || event.place || '';
    const parsedEventDate = toDate(event.eventDate || event.date);
    const parsedEndDate = toDate(event.eventEndDate || event.endDate);
    const isFeatured = typeof event.isFeatured === 'boolean' ? event.isFeatured : event.featured === 'true';

    return {
        ...event,
        title,
        coverImageUrl: banner,
        content: detail,
        location,
        parsedEventDate,
        parsedEndDate,
        isFeatured,
    };
};

exports.getEvents = async (req, res) => {
    try {
        const eventsRaw = await Event.find().sort({ createdAt: -1 }).lean();
        const normalized = eventsRaw.map(normalizeEvent);
        const now = new Date();

        const upcomingEvents = normalized
            .filter((event) => event.parsedEventDate && event.parsedEventDate >= now)
            .sort((a, b) => a.parsedEventDate - b.parsedEventDate);

        const pastEvents = normalized
            .filter((event) => !event.parsedEventDate || event.parsedEventDate < now)
            .sort((a, b) => {
                const aTime = a.parsedEventDate ? a.parsedEventDate.getTime() : 0;
                const bTime = b.parsedEventDate ? b.parsedEventDate.getTime() : 0;
                return bTime - aTime;
            });

        res.render('events', {
            title: 'Events',
            upcomingEvents,
            pastEvents,
            activeMenu: 'events',
            userId: req.session.userId,
            userName: req.session.name,
            sidebarCollapsed: req.session.sidebarCollapsed || false,
        });
    } catch (e) {
        res.render('error', { title: 'Error', message: e.message });
    }
};

exports.getEvent = async (req, res) => {
    try {
        const eventRaw = await Event.findById(req.params.id).lean();
        const event = eventRaw ? normalizeEvent(eventRaw) : null;
        if (!event) return res.render('error', { title: 'Not Found', message: 'Event not found' });
        res.render('event-view', {
            title: event.title,
            event,
            activeMenu: 'events',
            userId: req.session.userId,
            userName: req.session.name,
            sidebarCollapsed: req.session.sidebarCollapsed || false,
        });
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

exports.toggleFeatured = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        event.isFeatured = !event.isFeatured;
        await event.save();

        await Log.create({
            user: req.session.userId,
            action: 'update',
            entityType: 'Event',
            entityId: event._id,
            message: `Toggled featured for event: ${event.title}`,
            ip: req.ip,
        });

        return res.json({ success: true, isFeatured: event.isFeatured });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
