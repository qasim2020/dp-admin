const mongoose = require('mongoose');

const GalleryItemSchema = new mongoose.Schema(
    {
        url: { type: String, required: true, trim: true },
        caption: { type: String, trim: true },
        type: {
            type: String,
            enum: ['image', 'video'],
            default: 'image',
        },
        category: { type: String, trim: true },
        isActive: { type: Boolean, default: true },
        isFeatured: { type: Boolean, default: false },
        sortOrder: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('GalleryItem', GalleryItemSchema);
