const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            default: '',
            trim: true,
        },
        message: {
            type: String,
            default: '',
            trim: true,
        },
        service: {
            type: String,
            default: '',
            trim: true,
        },
        country: {
            type: String,
            default: '',
            trim: true,
        },
        childName: {
            type: String,
            default: '',
            trim: true,
        },
        guardianName: {
            type: String,
            default: '',
            trim: true,
        },
        childAge: {
            type: String,
            default: '',
            trim: true,
        },
        medicalConditions: {
            type: String,
            default: '',
            trim: true,
        },
        source: {
            type: String,
            default: 'contact-form',
            trim: true,
        },
        status: {
            type: String,
            default: 'new',
            trim: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
            default: null,
        },
        formData: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Ticket', TicketSchema);
