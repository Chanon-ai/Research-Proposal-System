// Notification Model - User notifications for proposal workflow events

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      default: null,
      index: true
    },
    channel: {
      type: String,
      enum: ['in_app', 'email'],
      required: true
    },
    eventKey: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    // Store event-specific data for rendering
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    sentAt: {
      type: Date,
      default: null
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Compound indexes for common queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, proposalId: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
