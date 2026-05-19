const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            default: 'main',
            unique: true,
        },
        brandName: {
            type: String,
            default: 'iLearningHubb',
        },
        logoUrl: {
            type: String,
            default: '',
        },
        emailHost: {
            type: String,
            default: '',
        },
        emailPort: {
            type: Number,
            default: 587,
        },
        emailUser: {
            type: String,
            default: '',
        },
        emailPass: {
            type: String,
            default: '',
        },
        emailSecure: {
            type: Boolean,
            default: false,
        },
        emailFromName: {
            type: String,
            default: 'iLearningHubb',
        },
        emailFromAddress: {
            type: String,
            default: '',
        },
        socialFacebook: {
            type: String,
            default: '',
        },
        socialInstagram: {
            type: String,
            default: '',
        },
        socialTwitter: {
            type: String,
            default: '',
        },
        socialLinkedIn: {
            type: String,
            default: '',
        },
        socialYouTube: {
            type: String,
            default: '',
        },
        socialTikTok: {
            type: String,
            default: '',
        },
        ticketEmails: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Settings', SettingsSchema);
