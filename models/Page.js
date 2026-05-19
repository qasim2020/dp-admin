const mongoose = require('mongoose');

const PageSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['page', 'legal'],
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

PageSchema.index({ key: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Page', PageSchema);
