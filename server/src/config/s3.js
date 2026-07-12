
const { S3Client, HeadBucketCommand, CreateBucketCommand } = require('@aws-sdk/client-s3');

const env = require('./env');

const logger = require('../utils/logger');

const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});

async function ensureBucketExists() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }));
    logger.info(`S3 bucket "${env.S3_BUCKET}" already exists`);
  } catch (err) {
    logger.info(`S3 bucket "${env.S3_BUCKET}" not found — creating it`);
    await s3Client.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }));
    logger.info(`S3 bucket "${env.S3_BUCKET}" created`);
  }
}

module.exports = { s3Client, ensureBucketExists };