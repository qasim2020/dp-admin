const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        token: { type: String, required: false },
        passwordSalt: { type: String, required: false },
        passwordHash: { type: String, required: false },
        passwordResetToken: { type: String, required: false },
        passwordResetExpiresAt: { type: Date, required: false },
        inviteToken: { type: String, required: false },
        inviteExpiresAt: { type: Date, required: false },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', UserSchema);
