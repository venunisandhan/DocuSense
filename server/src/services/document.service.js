const Document = require('../models/Document');
const DocumentAccess = require('../models/DocumentAccess');
const ApiError = require('../utils/ApiError');
const s3Service = require('./s3.service');
const accessService = require('./access.service');
const ragQueue = require('../queues/rag.queue');

async function uploadDocument({ title, file, uploadedBy, accessLevel, tags }) {
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
    accessLevel,
    tags,
  });

 
  await ragQueue.add('process-document', { documentId: document._id.toString() });

  return document;
}

async function listMyShared(employeeId) {
  const Group = require('../models/Group');
  const DocumentAccess = require('../models/DocumentAccess');
  
  const myGroupIds = await Group.find({ members: employeeId }).distinct('_id');
  const grants = await DocumentAccess.find({
    isRevoked: false,
    $or: [{ grantedTo: employeeId }, { grantedToGroup: { $in: myGroupIds } }],
  });

  const activeGrants = grants.filter(access => {
    if (access.isRevoked) return false;
    if (access.accessType === 'LIFETIME') return true;
    return access.expiresAt && access.expiresAt > new Date();
  });

  const docAccessMap = new Map();
  for (const g of activeGrants) {
    const docId = g.document.toString();
    const existing = docAccessMap.get(docId);
    if (!existing) {
       docAccessMap.set(docId, g);
    } else {
       if (g.accessType === 'LIFETIME' || existing.accessType === 'LIFETIME') {
           existing.accessType = 'LIFETIME';
           existing.expiresAt = null;
       } else if (g.expiresAt && existing.expiresAt && g.expiresAt > existing.expiresAt) {
           existing.expiresAt = g.expiresAt;
       }
    }
  }

  const docIds = Array.from(docAccessMap.keys());
  const grantedDocs = await Document.find({ _id: { $in: docIds }, isDeleted: false }).sort({ createdAt: -1 }).lean();

  const publicDocs = await Document.find({
    accessLevel: 'Public',
    isDeleted: false,
    _id: { $nin: docIds },
  }).sort({ createdAt: -1 }).lean();

  const grantedResults = grantedDocs.map(doc => {
    const access = docAccessMap.get(doc._id.toString());
    return {
      ...doc,
      expiresAt: access && access.accessType === 'EXPIRING' ? access.expiresAt : null
    };
  });

  const publicResults = publicDocs.map(doc => ({ ...doc, expiresAt: null }));

  return [...grantedResults, ...publicResults].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
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
    { returnDocument: 'after' }
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

  const document = await Document.findOne({ _id: documentId, isDeleted: false }).lean();
  if (!document) {
    throw new ApiError(404, 'Document not found', 'DOCUMENT_NOT_FOUND');
  }

  const Group = require('../models/Group');
  const DocumentAccess = require('../models/DocumentAccess');
  const myGroupIds = await Group.find({ members: user.id }).distinct('_id');
  const grants = await DocumentAccess.find({
    document: documentId,
    isRevoked: false,
    $or: [{ grantedTo: user.id }, { grantedToGroup: { $in: myGroupIds } }],
  });

  let expiresAt = null;
  let isLifetime = false;
  for (const g of grants) {
    if (g.isRevoked) continue;
    if (g.accessType === 'LIFETIME') {
      isLifetime = true;
      break;
    }
    if (g.expiresAt && (!expiresAt || g.expiresAt > expiresAt)) {
      expiresAt = g.expiresAt;
    }
  }

  return {
    ...document,
    expiresAt: isLifetime ? null : expiresAt
  };
}

async function getViewUrlForUser(documentId, user) {
  if (user.role === 'HR') {
    const document = await Document.findOne({ _id: documentId, uploadedBy: user.id, isDeleted: false }).select('+s3Key');
    if (!document) throw new ApiError(404, 'Document not found', 'DOCUMENT_NOT_FOUND');
    return s3Service.getPresignedViewUrl(document.s3Key);
  }
  const allowed = await accessService.hasAccess(user.id, documentId);
  if (!allowed) throw new ApiError(404, 'Document not found', 'DOCUMENT_NOT_FOUND');
  const document = await Document.findOne({ _id: documentId, isDeleted: false }).select('+s3Key');
  if (!document) throw new ApiError(404, 'Document not found', 'DOCUMENT_NOT_FOUND');
  return s3Service.getPresignedViewUrl(document.s3Key);
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
    { returnDocument: 'after' }
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
  getViewUrlForUser,
  updateGuidelines,
  getDocumentForUser,
  getDownloadUrlForUser,
  deleteDocument
};