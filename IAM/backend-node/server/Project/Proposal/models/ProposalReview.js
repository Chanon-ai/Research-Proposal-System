// ProposalReview Model - Committee member review and scoring

const mongoose = require('mongoose');

const commentItemSchema = new mongoose.Schema(
  {
    sectionKey: {
      type: String,
      required: true
    },
    fieldKey: {
      type: String,
      default: ''
    },
    commentType: {
      type: String,
      enum: ['issue', 'suggestion', 'required_fix'],
      default: 'suggestion'
    },
    commentText: {
      type: String,
      required: true
    },
    visibility: {
      type: String,
      enum: ['internal', 'researcher_visible'],
      default: 'researcher_visible'
    }
  },
  { _id: false }
);

const scoreItemSchema = new mongoose.Schema(
  {
    criteriaKey: {
      type: String,
      required: true
    },
    criteriaLabel: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0
    },
    maxScore: {
      type: Number,
      required: true,
      min: 1
    },
    note: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const proposalReviewSchema = new mongoose.Schema(
  {
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      required: true,
      index: true
    },
    reviewerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    roundNo: {
      type: Number,
      min: 1,
      default: 1
    },
    reviewStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'submitted', 'certified'],
      default: 'pending'
    },
    decision: {
      type: String,
      enum: ['approve', 'reject', 'revise', 'revision', null],
      default: null
    },
    totalScore: {
      type: Number,
      default: null,
      min: 0
    },
    summaryComment: {
      type: String,
      default: ''
    },
    commentItems: {
      type: [commentItemSchema],
      default: []
    },
    scoreItems: {
      type: [scoreItemSchema],
      default: []
    },
    signatureData: {
      type: String,
      default: ''
    },
    signatureUpdatedAt: {
      type: Date,
      default: null
    },
    submittedAt: {
      type: Date,
      default: null
    },
    certifiedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Unique index: one reviewer per proposal per round
proposalReviewSchema.index(
  { proposalId: 1, reviewerUserId: 1, roundNo: 1 },
  { unique: true }
);
proposalReviewSchema.index({ reviewerUserId: 1, reviewStatus: 1 });

module.exports = mongoose.model('ProposalReview', proposalReviewSchema);
