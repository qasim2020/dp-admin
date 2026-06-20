const mongoose = require('mongoose');

const WebinarAttachmentSchema = new mongoose.Schema(
    {
        label: { type: String, required: true, trim: true },
        storageKey: { type: String, required: true, trim: true },
        mimeType: { type: String, default: '', trim: true },
        size: { type: Number, default: 0 },
        sortOrder: { type: Number, default: 0 },
    },
    { _id: true }
);

const WebinarSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, trim: true },
        summary: { type: String, default: '', trim: true },
        content: { type: String, default: '' },
        thumbnailUrl: { type: String, default: '', trim: true },
        streamProvider: { type: String, enum: ['cloudflare_stream'], default: 'cloudflare_stream' },
        streamPlaybackId: { type: String, default: '', trim: true },
        duration: { type: Number, default: 0 },
        published: { type: Boolean, default: false },
        publishedAt: { type: Date, default: null },
        sortOrder: { type: Number, default: 0 },
        attachments: { type: [WebinarAttachmentSchema], default: [] },
    },
    {
        timestamps: true,
        collection: 'webinars',
    }
);

module.exports = mongoose.model('Webinar', WebinarSchema);
