const mongoose = require('mongoose');

const actionItemSchema = new mongoose.Schema(
  {
    task: { type: String, default: '' },
    assignee: { type: String, default: '' },
    deadline: { type: String, default: '' }
  },
  { _id: false }
);

const proposalStatusSnapshotSchema = new mongoose.Schema(
  {
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      required: true
    },
    previousStatus: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    meetingDate: {
      type: Date,
      required: true,
      index: true
    },
    startTime: {
      type: String,
      required: true,
      default: ''
    },
    endTime: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: ''
    },
    videoLink: {
      type: String,
      default: ''
    },
    meetingType: {
      type: String,
      enum: ['online', 'onsite'],
      default: 'online',
      index: true
    },
    agenda: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true
    },
    proposalIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Proposal',
      default: []
    },
    proposalStatusSnapshots: {
      type: [proposalStatusSnapshotSchema],
      default: []
    },
    participantIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: []
    },
    minutes: {
      type: String,
      default: ''
    },
    decisions: {
      type: String,
      default: ''
    },
    actionItems: {
      type: [actionItemSchema],
      default: []
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

meetingSchema.index({ status: 1, meetingDate: -1 });

module.exports = mongoose.model('ProposalMeeting', meetingSchema);
