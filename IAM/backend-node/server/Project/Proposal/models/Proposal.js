// Proposal Model - Main research proposal document

const mongoose = require('mongoose');
const ProposalStatus = require('../constants/proposal-status');

const proposalSchema = new mongoose.Schema(
  {
    proposalCode: {
      type: String,
      unique: true,
      sparse: true,
      required: true,
      index: true
    },
    fiscalYear: {
      type: Number,
      required: true,
      index: true
    },
    projectTitleTh: {
      type: String,
      required: true
    },
    projectTitleEn: {
      type: String,
      default: ''
    },
    applicantUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    researchType: {
      type: String,
      default: null
    },
    fundingType: {
      type: String,
      default: null
    },
    fundingSubType: {
      type: String,
      default: null
    },
    budgetTotal: {
      type: Number,
      default: 0,
      min: 0
    },
    currentStatus: {
      type: String,
      required: true,
      default: ProposalStatus.DRAFT,
      enum: ProposalStatus.WORKFLOW_STATUS_VALUES,
      set: ProposalStatus.normalizeStatus,
      index: true
    },
    currentRound: {
      type: Number,
      min: 1,
      default: 1
    },
    abstractText: {
      type: String,
      default: ''
    },
    keywordList: {
      type: [String],
      default: []
    },
    committeeIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: []
    },
    chairmanAssignment: {
      assignedChairmanIds: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
      },
      status: {
        type: String,
        enum: ['idle', 'pending', 'approved', 'rejected'],
        default: 'idle'
      },
      assignedAt: {
        type: Date,
        default: null
      },
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      reviewedAt: {
        type: Date,
        default: null
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      summaryComment: {
        type: String,
        default: ''
      }
    },
    financeAssignment: {
      assignedFinanceOfficerIds: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
      },
      status: {
        type: String,
        enum: ['idle', 'pending', 'submitted'],
        default: 'idle'
      },
      assignedAt: {
        type: Date,
        default: null
      },
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      submittedAt: {
        type: Date,
        default: null
      },
      submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      summaryComment: {
        type: String,
        default: ''
      }
    },
    requiresRevision: {
      type: Boolean,
      default: false
    },
    // Store form data snapshot for tracking changes
    formSnapshotJson: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    submittedAt: {
      type: Date,
      default: null
    },
    facultyApprovedAt: {
      type: Date,
      default: null
    },
    officeReceivedAt: {
      type: Date,
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    rejectedAt: {
      type: Date,
      default: null
    },
    announcedAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Compound indexes for common queries
proposalSchema.index({ applicantUserId: 1, currentStatus: 1 });
proposalSchema.index({ fiscalYear: 1, currentStatus: 1 });
proposalSchema.index({ currentStatus: 1, isDeleted: 1 });
proposalSchema.index({ committeeIds: 1 });
proposalSchema.index({ 'financeAssignment.assignedFinanceOfficerIds': 1 });

module.exports = mongoose.model('Proposal', proposalSchema);
