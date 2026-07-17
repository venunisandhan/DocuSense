
const { Worker } = require('bullmq');

const redisConnection = require('../config/redis');

const env = require('../config/env');

const logger = require('../utils/logger');

const Document = require('../models/Document');

const DocumentChunk = require('../models/DocumentChunk');

const s3Service = require('../services/s3.service');

const extractText = require('../services/rag/textExtractor');

const chunkText = require('../services/rag/chunker');

const { embedText } = require('../services/rag/embeddings.service');

const { s3Client } = require('../config/s3');

const { GetObjectCommand } = require('@aws-sdk/client-s3');

async function fetchFileBuffer(s3Key) {
  const response = await s3Client.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: s3Key }));
  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function processDocument(job) {
  const { documentId } = job.data;

  const document = await Document.findOne({ _id: documentId }).select('+s3Key');
  if (!document) {
    logger.error(`RAG job: document ${documentId} not found`);
    return;
  }

  try {
    document.ragStatus = 'PROCESSING';
    await document.save();

    const buffer = await fetchFileBuffer(document.s3Key);
    const text = await extractText(buffer, document.mimeType);
    const rawChunks = chunkText(text, env.CHUNK_SIZE_CHARS, env.CHUNK_OVERLAP_CHARS);

    if (rawChunks.length === 0) {
      throw new Error('No extractable text found in document');
    }

    await DocumentChunk.deleteMany({ document: documentId });

    for (let i = 0; i < rawChunks.length; i++) {
      const embedding = await embedText(rawChunks[i]);
      await DocumentChunk.create({
        document: documentId,
        chunkIndex: i,
        text: rawChunks[i],
        embedding,
      });
    }

    document.ragStatus = 'READY';
    await document.save();
    logger.info(`RAG processing complete for document ${documentId}, ${rawChunks.length} chunks`);
  } catch (err) {
    document.ragStatus = 'FAILED';
    await document.save();
    logger.error(`RAG processing failed for document ${documentId}`, { error: err.message });
    throw err;
  }
}

const worker = new Worker('rag-processing', processDocument, {
  connection: redisConnection,
  concurrency: 2,
});

worker.on('failed', (job, err) => {
  logger.error(`RAG job ${job.id} failed after retries`, { error: err.message });
});

worker.on('error', err => {
  logger.error(`BullMQ Worker encountered an error`, { error: err.message });
});

module.exports = worker;