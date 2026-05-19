const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        token: { type: String, required: false },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', UserSchema);
