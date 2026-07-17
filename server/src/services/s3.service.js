const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const { randomUUID } = require('crypto');

const { s3Client } = require('../config/s3');

const env = require('../config/env');

function buildS3Key(documentId, originalFilename) {
  const safeFilename = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `documents/${documentId}/${safeFilename}`;
}

async function uploadBuffer(buffer, s3Key, mimeType) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: s3Key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
}

async function getPresignedDownloadUrl(s3Key, downloadFilename) {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: s3Key,
    ResponseContentDisposition: `attachment; filename="${downloadFilename}"`,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

async function getPresignedViewUrl(s3Key) {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: s3Key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

module.exports = { buildS3Key, uploadBuffer, getPresignedDownloadUrl, getPresignedViewUrl, generateDocumentId: randomUUID };