
const mongoose = require('mongoose');

const chatLogSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    askedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    wasAnswerable: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

chatLogSchema.index({ document: 1, askedBy: 1, createdAt: -1 });

module.exports = mongoose.model('ChatLog', chatLogSchema);