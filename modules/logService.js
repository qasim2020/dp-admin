const Log = require('../models/Logs');

const createLog = async ({ req, userId, action, entityType, entityId, message, metadata = {} }) => {
    try {
        const ip = req?.ip || req?.headers['x-forwarded-for'] || '';
        const userAgent = req?.headers?.['user-agent'] || '';

        await Log.create({
            user: userId || req?.session?.userId,
            action,
            entityType,
            entityId,
            message,
            metadata,
            ip,
            userAgent,
        });
    } catch (error) {
        console.error('Failed to create log:', error);
    }
};

module.exports = { createLog };
