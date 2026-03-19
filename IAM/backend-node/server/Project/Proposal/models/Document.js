const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      required: true,
      index: true
    },
    documentType: {
      type: String,
      required: true,
      index: true
    },
    versionGroup: {
      type: String,
      required: true,
      index: true
    },
    version: {
      type: Number,
      default: 1
    },
    isLatest: {
      type: Boolean,
      default: true,
      index: true
    },
    fileName: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      default: ''
    },
    fileSize: {
      type: Number,
      default: 0
    },
    filePath: {
      type: String,
      required: true
    },
    storagePath: {
      type: String,
      required: true
    },
    note: {
      type: String,
      default: ''
    },
    uploadedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

documentSchema.index({ proposalId: 1, documentType: 1, isLatest: 1 });
documentSchema.index({ versionGroup: 1, version: -1 });

module.exports = mongoose.model('ProposalDocument', documentSchema);
