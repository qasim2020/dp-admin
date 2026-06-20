const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        passwordSalt: { type: String, default: null },
        passwordHash: { type: String, default: null },
        status: { type: String, enum: ['invited', 'pending', 'active', 'disabled'], default: 'pending' },
        emailVerified: { type: Boolean, default: false },
        verificationToken: { type: String, default: null },
        verificationTokenExpiresAt: { type: Date, default: null },
        resetToken: { type: String, default: null },
        resetTokenExpiresAt: { type: Date, default: null },
        invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    {
        timestamps: true,
        collection: 'members',
    }
);

module.exports = mongoose.model('Member', MemberSchema);
