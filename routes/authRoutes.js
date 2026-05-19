const express = require('express');
const router = express.Router();
const userController = require('../controllers/authController');

const authRateLimitStore = new Map();
const STORE_CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanupAt = Date.now();

function authRateLimit(options = {}) {
    const windowMs = options.windowMs || 15 * 60 * 1000;
    const max = options.max || 20;
    return (req, res, next) => {
        const now = Date.now();
        const key = `${req.ip}:${req.path}`;
        const attempts = authRateLimitStore.get(key) || [];
        const recentAttempts = attempts.filter((time) => now - time < windowMs);
        recentAttempts.push(now);
        authRateLimitStore.set(key, recentAttempts);

        if (now - lastCleanupAt >= STORE_CLEANUP_INTERVAL) {
            for (const [storedKey, timestamps] of authRateLimitStore.entries()) {
                const freshTimestamps = timestamps.filter((time) => now - time < windowMs);
                if (freshTimestamps.length === 0) {
                    authRateLimitStore.delete(storedKey);
                } else {
                    authRateLimitStore.set(storedKey, freshTimestamps);
                }
            }
            lastCleanupAt = now;
        }

        if (recentAttempts.length > max) {
            return res.status(429).json({ error: 'Too many requests. Please try again later.' });
        }
        return next();
    };
}

router.get('/login', userController.renderLoginPage);
router.post('/login', authRateLimit({ windowMs: 15 * 60 * 1000, max: 15 }), userController.login);
router.get('/forgot-password', userController.renderForgotPasswordPage);
router.post('/forgot-password', authRateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), userController.forgotPassword);
router.get('/reset-password', userController.renderResetPasswordPage);
router.post('/reset-password', authRateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), userController.resetPassword);
router.get('/logout', userController.logout);

module.exports = router;
