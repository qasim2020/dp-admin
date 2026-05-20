const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({}, { strict: false, timestamps: true, collection: 'notifications' });

module.exports = mongoose.model('Notification', NotificationSchema);