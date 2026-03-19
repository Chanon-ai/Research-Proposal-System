// ProposalStatusLog Model - Audit trail for proposal status changes

const mongoose = require('mongoose');

const proposalStatusLogSchema = new mongoose.Schema(
  {
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      required: true,
      index: true
    },
    fromStatus: {
      type: String,
      default: null
    },
    toStatus: {
      type: String,
      required: true
    },
    actionKey: {
      type: String,
      required: true
    },
    remark: {
      type: String,
      default: ''
    },
    roundNo: {
      type: Number,
      default: 1
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notifySent: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

proposalStatusLogSchema.index({ proposalId: 1, createdAt: -1 });

module.exports = mongoose.model('ProposalStatusLog', proposalStatusLogSchema);
