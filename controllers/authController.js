const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const Settings = require('../models/Settings');

const { isValidEmail } = require('../modules/checkValidForm');
const { createLog } = require('../modules/logService');

exports.renderLoginPage = async (req, res) => {
    try {
        res.render('login', { layout: 'auth' });
    } catch (error) {
        res.status(500).json({
            error: 'An error occurred while rendering login page',
            details: error.message,
        });
    }
};

function generateMagicToken(email) {
    return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '60m' });
}

async function sendMagicLinkEmail(name, email, link) {
    const settings = await Settings.findOne({ key: 'main' }).lean();

    if (!settings || !settings.emailHost || !settings.emailPort || !settings.emailUser || !settings.emailPass) {
        throw new Error('Email settings are not configured. Please update settings first.');
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

    const templatePath = path.join(__dirname, '../views/emails/magicLink.hbs');
    const templateSource = await fs.readFile(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(templateSource);

    const html = compiledTemplate({
        name,
        magicLink: link,
    });

    await transporter.sendMail({
        from: `"${settings.emailFromName || 'iLearningHubb'}" <${settings.emailFromAddress || settings.emailUser}>`,
        to: email,
        subject: 'Login to Dashboard - Magic Link',
        html,
    });
}

exports.sendMagicLink = async (req, res) => {
    try {
        const { email: emailProvided } = req.body;

        const email = emailProvided.toLowerCase();

        if (!isValidEmail(email)) {
            res.status(400).send(`${email} is an invalid email.`);
            return false;
        }

        let user = await User.findOne({ email });

        if (!user) {
            res.status(404).send(`No account found for ${email}.`);
            return false;
        }

        const token = generateMagicToken(email);
        const baseUrl = req.protocol && req.get ? `${req.protocol}://${req.get('host')}` : process.env.DOMAIN_URL;
        const link = `${baseUrl}/auth-magic-link?token=${token}`;
        await sendMagicLinkEmail(user.name, user.email, link);
        res.json({ success: true });
        // res.json({ link });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: 'An error occurred while sending magic link',
            details: error.message,
        });
    }
};

exports.testMagicLink = async (req, res) => {
    try {
        const token = req.query.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        let user = await User.findOne({ email: decoded.email });
        if (!user) {
            res.status(404).send('User not found');
            return;
        };
        req.session.userId = user._id;
        req.session.email = user.email;
        req.session.name = user.name;
        
        req.session.save(() => {
            createLog({
                req,
                userId: user._id,
                action: 'login',
                entityType: 'user',
                entityId: user._id,
                message: 'User logged in via magic link',
                metadata: { email: user.email },
            });
            res.redirect('/dashboard');
        });
    } catch (e) {
        res.render('login', { 
            layout: 'auth', 
            note: 'Invalid / expired login link. Please create a new login link.' 
        });
    }
};

exports.logout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/login');
    } catch (error) {
        res.status(400).send('Error logging out, please try again.');
    }
}