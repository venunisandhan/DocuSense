const Document = require('../models/Document');
const DocumentAccess = require('../models/DocumentAccess');
const ApiError = require('../utils/ApiError');
const s3Service = require('./s3.service');
const accessService = require('./access.service');
const ragQueue = require('../queues/rag.queue');

async function uploadDocument({ title, file, uploadedBy }) {
  const documentId = s3Service.generateDocumentId();
  const s3Key = s3Service.buildS3Key(documentId, file.originalname);

  await s3Service.uploadBuffer(file.buffer, s3Key, file.mimetype);

  const document = await Document.create({
    _id: documentId,
    title,
    originalFilename: file.originalname,
    mimeType: file.mimetype,
    s3Key,
    sizeBytes: file.size,
    uploadedBy,
  });

 
  await ragQueue.add('process-document', { documentId: document._id.toString() });

  return document;
}

async function listMyShared(employeeId) {
  const accessibleIds = await accessService.listAccessibleDocumentIds(employeeId);
  return Document.find({ _id: { $in: accessibleIds }, isDeleted: false }).sort({ createdAt: -1 });
}

async function listMyUploads(uploadedBy) {
  return Document.find({ uploadedBy, isDeleted: false }).sort({ createdAt: -1 });
}

async function getDocumentForOwner(documentId, ownerId) {
  const document = await Document.findOne({ _id: documentId, uploadedBy: ownerId, isDeleted: false });
  if (!document) {
    throw new ApiError(404, 'Document not found', 'DOCUMENT_NOT_FOUND');
  }
  return document;
}

async function getDownloadUrlForOwner(documentId, ownerId) {
  const document = await Document.findOne({ _id: documentId, uploadedBy: ownerId, isDeleted: false }).select('+s3Key');
  if (!document) {
    throw new ApiError(404, 'Document not found', 'DOCUMENT_NOT_FOUND');
  }
  const url = await s3Service.getPresignedDownloadUrl(document.s3Key, document.originalFilename);
  return url;
}

async function updateGuidelines(documentId, ownerId, guidelines) {
  const document = await Document.findOneAndUpdate(
    { _id: documentId, uploadedBy: ownerId, isDeleted: false },
    { $set: { guidelines } },
    { new: true }
  );
  if (!document) {
    throw new ApiError(404, 'Document not found', 'DOCUMENT_NOT_FOUND');
  }
  return document;
}

async function getDocumentForUser(documentId, user) {
  if (user.role === 'HR') {
    return getDocumentForOwner(documentId, user.id);
  }

  const allowed = await accessService.hasAccess(user.id, documentId);
  if (!allowed) {
    throw new ApiError(404, 'Document not found', 'DOCUMENT_NOT_FOUND');
  }

  const document = await Document.findOne({ _id: documentId, isDeleted: false });
  if (!document) {
    throw new ApiError(404, 'Document not found', 'DOCUMENT_NOT_FOUND');
  }
  return document;
}

async function getDownloadUrlForUser(documentId, user) {
  if (user.role === 'HR') {
    return getDownloadUrlForOwner(documentId, user.id);
  }
  const allowed = await accessService.hasAccess(user.id, documentId);
  if (!allowed) { throw new ApiError(404, 'Document not found', 'DOCUMENT_NOT_FOUND'); }
  const document = await Document.findOne({ _id: documentId, isDeleted: false }).select('+s3Key');
  if (!document) { throw new ApiError(404, 'Document not found', 'DOCUMENT_NOT_FOUND'); }
  return s3Service.getPresignedDownloadUrl(document.s3Key, document.originalFilename);
}

async function deleteDocument(documentId, ownerId) {
  const document = await Document.findOneAndUpdate(
    { _id: documentId, uploadedBy: ownerId, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );
  if (!document) {
    throw new ApiError(404, 'Document not found', 'DOCUMENT_NOT_FOUND');
  }

  await DocumentAccess.updateMany({ document: documentId }, { $set: { isRevoked: true } });

  return document;
}

module.exports = {
  uploadDocument,
  listMyShared,
  listMyUploads,
  getDocumentForOwner,
  getDownloadUrlForOwner,
  updateGuidelines,
  getDocumentForUser,
  getDownloadUrlForUser,
  deleteDocument
};