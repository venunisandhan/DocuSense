
const mongoose = require('mongoose');

const documentChunkSchema = new mongoose.Schema(
  {
    document: {
      type: String,
      ref: 'Document',
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
  },
  { timestamps: true }
);

documentChunkSchema.index({ document: 1, chunkIndex: 1 });

module.exports = mongoose.model('DocumentChunk', documentChunkSchema);