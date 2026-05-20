const mongoose = require('mongoose');

const CauseSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, trim: true },
        excerpt: { type: String, trim: true },
        content: { type: String },
        coverImageUrl: { type: String, trim: true },
        goalAmount: { type: Number, default: 0 },
        raisedAmount: { type: Number, default: 0 },
        tags: { type: [String], default: [] },
        isFeatured: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Cause', CauseSchema);
