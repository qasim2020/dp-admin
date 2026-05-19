const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        excerpt: {
            type: String,
            trim: true,
        },
        content: {
            type: String,
        },
        coverImageUrl: {
            type: String,
            trim: true,
        },
        tags: {
            type: [String],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        publishedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Blog', BlogSchema);
