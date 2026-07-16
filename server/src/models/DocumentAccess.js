const mongoose = require('mongoose');

const documentAccessSchema = new mongoose.Schema(
  {
    document: {
      type: String,
      ref: 'Document',
      required: true,
    },
    grantedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    grantedToGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accessType: {
      type: String,
      enum: ['LIFETIME', 'EXPIRING'],
      required: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

documentAccessSchema.pre('validate', function () {
  const hasUser = !!this.grantedTo;
  const hasGroup = !!this.grantedToGroup;

  if (hasUser === hasGroup) {
    throw new Error('DocumentAccess must have exactly one of grantedTo or grantedToGroup');
  }

  if (this.accessType === 'EXPIRING' && !this.expiresAt) {
    throw new Error('expiresAt is required when accessType is EXPIRING');
  }
});

documentAccessSchema.index({ document: 1, grantedTo: 1 });
documentAccessSchema.index({ document: 1, grantedToGroup: 1 });

module.exports = mongoose.model('DocumentAccess', documentAccessSchema);