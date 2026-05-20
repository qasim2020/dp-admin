const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({}, { strict: false, timestamps: true, collection: 'comments' });

module.exports = mongoose.model('Comment', CommentSchema);