const mongoose = require('mongoose');

const collaborationConfirmationSchema = new mongoose.Schema(
  {
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      required: true,
      index: true
    },
    proposalCode: {
      type: String,
      default: '',
      index: true
    },
    invitedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    participantType: {
      type: String,
      enum: ['co_researcher', 'advisor'],
      required: true
    },
    participantIndex: {
      type: Number,
      required: true,
      min: 0
    },
    participantName: {
      type: String,
      default: ''
    },
    participantEmail: {
      type: String,
      default: '',
      index: true
    },
    sourceUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired', 'email_missing'],
      default: 'pending',
      index: true
    },
    decisionNote: {
      type: String,
      default: ''
    },
    signatureData: {
      type: String,
      default: ''
    },
    invitationTokenHash: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    tokenExpiresAt: {
      type: Date,
      default: null
    },
    invitationSentAt: {
      type: Date,
      default: null
    },
    deliveryStatus: {
      type: String,
      enum: ['not_applicable', 'sent', 'failed'],
      default: 'not_applicable'
    },
    deliveryError: {
      type: String,
      default: ''
    },
    respondedAt: {
      type: Date,
      default: null
    },
    responderIp: {
      type: String,
      default: ''
    },
    responderUserAgent: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

collaborationConfirmationSchema.index({ proposalId: 1, participantType: 1, participantIndex: 1 });
collaborationConfirmationSchema.index({ proposalId: 1, status: 1 });

module.exports = mongoose.model('CollaborationConfirmation', collaborationConfirmationSchema);
