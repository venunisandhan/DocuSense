const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      enum: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ],
    },
    s3Key: {
      type: String,
      required: true,
      select: false,
    },
    sizeBytes: {
      type: Number,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    guidelines: {
      type: String,
      default: '',
      maxlength: 5000,
    },
    accessLevel: {
      type: String,
      enum: ['Public', 'HR', 'Private'],
      default: 'Public',
    },
    tags: [{
      type: String,
      trim: true,
    }],
    ragStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'READY', 'FAILED'],
      default: 'PENDING',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

documentSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);