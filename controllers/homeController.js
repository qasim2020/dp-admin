const User = require('../models/User');
const Cause = require('../models/Cause');
const Event = require('../models/Event');
const GalleryItem = require('../models/GalleryItem');
const TeamMember = require('../models/TeamMember');
const Log = require('../models/Logs');
const Blog = require('../models/Blog');
const Page = require('../models/Page');
const Ticket = require('../models/Ticket');
const Subscription = require('../models/Subscription');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

const { isValidEmail } = require('../modules/checkValidForm');

exports.toggleSideBar = async (req, res) => {
    req.session.sidebarCollapsed = req.body.sidebarCollapsed;
    res.json({ message: 'Sidebar toggled', sidebar: req.body.sidebarCollapsed });
};

exports.getDashboard = async (req, res) => {
    try {
        const [
            causeCount,
            activeCauseCount,
            eventCount,
            upcomingEventCount,
            galleryCount,
            teamCount,
            blogCount,
            subscriptionCount,
            userCount,
            recentLogs,
            recentTickets,
            recentSubscriptions,
        ] = await Promise.all([
            Cause.countDocuments(),
            Cause.countDocuments({ isActive: true }),
            Event.countDocuments(),
            Event.countDocuments({ eventDate: { $gte: new Date() }, isActive: true }),
            GalleryItem.countDocuments(),
            TeamMember.countDocuments(),
            Blog.countDocuments(),
            Subscription.countDocuments(),
            User.countDocuments(),
            Log.find().sort({ createdAt: -1 }).limit(8).populate('user', 'name email').lean(),
            Ticket.find().sort({ createdAt: -1 }).limit(5).lean(),
            Subscription.find().sort({ createdAt: -1 }).limit(5).lean(),
        ]);

        res.render('home', {
            title: 'Dashboard',
            activeMenu: 'dashboard',
            causeCount,
            activeCauseCount,
            eventCount,
            upcomingEventCount,
            galleryCount,
            teamCount,
            blogCount,
            subscriptionCount,
            userCount,
            recentLogs,
            recentTickets,
            recentSubscriptions,
            userId: req.session.userId,
            userName: req.session.name,
            sidebarCollapsed: req.session.sidebarCollapsed || false,
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.render('error', { title: 'Error', message: error.message });
    }
};

exports.sendLoginEmail = async (req, res) => {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'Valid email required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'No user found with this email' });

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    await User.findByIdAndUpdate(user._id, { token });

    const loginUrl = `${process.env.DOMAIN_URL}/auth/verify?token=${token}`;

    const templatePath = path.join(__dirname, '../views/emails/login.hbs');
    const templateSrc = await fs.readFile(templatePath, 'utf8');
    const template = handlebars.compile(templateSrc);
    const html = template({ name: user.name, loginUrl, brandName: 'Dedicated Parents' });

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_SSL === 'true',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Dedicated Parents Admin Login Link',
        html,
    });

    res.json({ success: true, message: 'Login link sent' });
};
