const User = require('../models/User');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const Settings = require('../models/Settings');

const { isValidEmail, isStrongPassword } = require('../modules/checkValidForm');
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

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return { salt, hash };
}

function verifyPassword(password, salt, hash) {
    const currentHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const currentBuffer = Buffer.from(currentHash, 'hex');
    const storedBuffer = Buffer.from(hash, 'hex');
    if (currentBuffer.length !== storedBuffer.length) {
        return false;
    }
    return crypto.timingSafeEqual(currentBuffer, storedBuffer);
}

async function sendPasswordResetEmail(name, email, link) {
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

    const templatePath = path.join(__dirname, '../views/emails/passwordReset.hbs');
    const templateSource = await fs.readFile(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(templateSource);

    const html = compiledTemplate({
        name,
        resetLink: link,
    });

    await transporter.sendMail({
        from: `"${settings.emailFromName || 'iLearningHubb'}" <${settings.emailFromAddress || settings.emailUser}>`,
        to: email,
        subject: 'Reset your dashboard password',
        html,
    });
}

exports.login = async (req, res) => {
    try {
        const { email: emailProvided, password } = req.body;
        const email = normalizeEmail(emailProvided);

        if (!isValidEmail(email) || !password) {
            return res.status(400).json({ error: 'Please provide a valid email and password.' });
        }

        const user = await User.findOne({ email });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        if (!user.passwordHash || !user.passwordSalt) {
            return res.status(401).json({ error: 'No password is set for this account. Use Forgot password to set one.' });
        }

        if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        req.session.userId = user._id;
        req.session.email = user.email;
        req.session.name = user.name;
        req.session.user = { id: user._id, email: user.email, name: user.name };

        req.session.save(() => {
            createLog({
                req,
                userId: user._id,
                action: 'login',
                entityType: 'user',
                entityId: user._id,
                message: 'User logged in with email and password',
                metadata: { email: user.email },
            });
            res.json({ success: true });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'An error occurred while logging in',
            details: error.message,
        });
    }
};

exports.renderForgotPasswordPage = async (req, res) => {
    try {
        res.render('forgot-password', { layout: 'auth' });
    } catch (error) {
        res.status(500).json({
            error: 'An error occurred while rendering forgot password page',
            details: error.message,
        });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Please provide a valid email address.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = resetToken;
        user.passwordResetExpiresAt = new Date(Date.now() + 1000 * 60 * 60);
        await user.save();

        const baseUrl = req.protocol && req.get ? `${req.protocol}://${req.get('host')}` : process.env.DOMAIN_URL;
        const link = `${baseUrl}/reset-password?token=${resetToken}`;
        await sendPasswordResetEmail(user.name, user.email, link);

        createLog({
            req,
            userId: user._id,
            action: 'password_reset_requested',
            entityType: 'user',
            entityId: user._id,
            message: 'Password reset requested',
            metadata: { email: user.email },
        });

        return res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'An error occurred while processing forgot password',
            details: error.message,
        });
    }
};

exports.renderResetPasswordPage = async (req, res) => {
    try {
        const token = String(req.query.token || '');
        if (!token) {
            return res.render('reset-password', {
                layout: 'auth',
                invalidToken: true,
                note: 'Reset link is invalid or expired.',
            });
        }

        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpiresAt: { $gt: new Date() },
        }).lean();

        if (!user) {
            return res.render('reset-password', {
                layout: 'auth',
                invalidToken: true,
                note: 'Reset link is invalid or expired.',
            });
        }

        return res.render('reset-password', { layout: 'auth', token });
    } catch (error) {
        return res.status(500).json({
            error: 'An error occurred while rendering reset password page',
            details: error.message,
        });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const token = String(req.body.token || '');
        const password = String(req.body.password || '');
        const confirmPassword = String(req.body.confirmPassword || '');

        if (!token) {
            return res.status(400).json({ error: 'Reset token is required.' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match.' });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
            });
        }

        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpiresAt: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ error: 'Reset link is invalid or expired.' });
        }

        const { salt, hash } = hashPassword(password);
        user.passwordSalt = salt;
        user.passwordHash = hash;
        user.passwordResetToken = null;
        user.passwordResetExpiresAt = null;
        await user.save();

        req.session.userId = user._id;
        req.session.email = user.email;
        req.session.name = user.name;
        req.session.user = { id: user._id, email: user.email, name: user.name };

        req.session.save(() => {
            createLog({
                req,
                userId: user._id,
                action: 'password_reset',
                entityType: 'user',
                entityId: user._id,
                message: 'User password reset completed',
                metadata: { email: user.email },
            });
            res.json({ success: true });
        });
    } catch (error) {
        return res.status(500).json({
            error: 'An error occurred while resetting password',
            details: error.message,
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
