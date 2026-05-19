const mongoose = require('mongoose');

const LogsSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        action: { type: String, required: true },
        entityType: { type: String, required: true },
        entityId: { type: mongoose.Schema.Types.ObjectId, required: false },
        message: { type: String, required: true },
        metadata: { type: Object, default: {} },
        ip: { type: String },
        userAgent: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Log', LogsSchema);
