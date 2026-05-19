const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      default: 'footer-subscribe',
    },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('Subscription', SubscriptionSchema);