const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        role: { type: String, trim: true },
        bio: { type: String },
        imageUrl: { type: String, trim: true },
        imagePublicId: { type: String, trim: true, default: '' },
        email: { type: String, trim: true },
        socialLinks: {
            twitter: { type: String, default: '' },
            linkedin: { type: String, default: '' },
            facebook: { type: String, default: '' },
        },
        sortOrder: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true, collection: 'team' }
);

module.exports = mongoose.model('TeamMember', TeamMemberSchema);
