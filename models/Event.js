const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, trim: true },
        excerpt: { type: String, trim: true },
        content: { type: String },
        coverImageUrl: { type: String, trim: true },
        location: { type: String, trim: true },
        eventDate: { type: Date },
        eventEndDate: { type: Date },
        tags: { type: [String], default: [] },
        isFeatured: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Event', EventSchema);
