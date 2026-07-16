
const mongoose = require('mongoose');

const logger = require('../utils/logger');

async function ensureVectorIndex() {
  const collection = mongoose.connection.db.collection('documentchunks');

  const existingIndexes = await collection.listSearchIndexes().toArray();
  const alreadyExists = existingIndexes.some((idx) => idx.name === 'chunk_vector_index');

  if (alreadyExists) {
    logger.info('Vector search index already exists');
    return;
  }

  await collection.createSearchIndex({
    name: 'chunk_vector_index',
    type: 'vectorSearch',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: 1024,
          similarity: 'cosine',
        },
        {
          type: 'filter',
          path: 'document',
        },
      ],
    },
  });

  logger.info('Vector search index created — it may take a moment to become queryable');
}

module.exports = ensureVectorIndex;