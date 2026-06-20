const crypto = require('crypto');
const { promisify } = require('util');

const pbkdf2Async = promisify(crypto.pbkdf2);
const PASSWORD_ITERATIONS = 100000;
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_DIGEST = 'sha512';

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

async function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    const hashBuffer = await pbkdf2Async(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, PASSWORD_DIGEST);
    return {
        salt,
        hash: hashBuffer.toString('hex'),
    };
}

async function verifyPassword(password, salt, hash) {
    const currentHashBuffer = await pbkdf2Async(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, PASSWORD_DIGEST);
    const current = Buffer.from(currentHashBuffer.toString('hex'), 'hex');
    const stored = Buffer.from(String(hash || ''), 'hex');
    if (current.length !== stored.length) {
        return false;
    }
    return crypto.timingSafeEqual(current, stored);
}

function createToken(byteLength = 32) {
    return crypto.randomBytes(byteLength).toString('hex');
}

function hashToken(token) {
    return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function tokenExpiry(hours = 1) {
    return new Date(Date.now() + (Number(hours) || 1) * 60 * 60 * 1000);
}

function isStrongPassword(password) {
    const val = String(password || '');
    return val.length >= 8
        && /[A-Z]/.test(val)
        && /[a-z]/.test(val)
        && /\d/.test(val)
        && /[^A-Za-z0-9]/.test(val);
}

module.exports = {
    normalizeEmail,
    hashPassword,
    verifyPassword,
    createToken,
    hashToken,
    tokenExpiry,
    isStrongPassword,
};
