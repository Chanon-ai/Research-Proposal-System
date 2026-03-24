// EmailLog Model — persistent record of every workflow email send attempt
const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
  {
    // Workflow event that triggered this email (e.g. 'approved', 'revision_requested')
    eventKey: {
      type: String,
      required: true,
      index: true
    },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    // Related entities
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      default: null,
      index: true
    },
    proposalRef: {
      type: String,   // proposalCode or proposalId string, for quick display
      default: null
    },
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      default: null,
      index: true
    },
    // Result
    status: {
      type: String,
      enum: ['sent', 'failed', 'skipped'],
      required: true,
      index: true
    },
    errorMessage: {
      type: String,
      default: null
    },
    sentAt: {
      type: Date,
      default: () => new Date(),
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

emailLogSchema.index({ sentAt: -1 });
emailLogSchema.index({ eventKey: 1, sentAt: -1 });
emailLogSchema.index({ status: 1, sentAt: -1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
