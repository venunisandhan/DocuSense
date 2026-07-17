
const DocumentAccess = require('../models/DocumentAccess');

const Document = require('../models/Document');

const Group = require('../models/Group');

const User = require('../models/User');

const ApiError = require('../utils/ApiError');

function isGrantActive(access) {
  if (access.isRevoked) return false;
  if (access.accessType === 'LIFETIME') return true;
  return access.expiresAt && access.expiresAt > new Date();
}

async function hasAccess(userId, documentId) {
  const directGrant = await DocumentAccess.findOne({ document: documentId, grantedTo: userId, isRevoked: false });
  if (directGrant && isGrantActive(directGrant)) return true;

  const myGroupIds = await Group.find({ members: userId }).distinct('_id');
  if (myGroupIds.length === 0) return false;

  const groupGrant = await DocumentAccess.findOne({
    document: documentId,
    grantedToGroup: { $in: myGroupIds },
    isRevoked: false,
  });

  return !!(groupGrant && isGrantActive(groupGrant));
}

async function listAccessibleDocumentIds(userId) {
  const myGroupIds = await Group.find({ members: userId }).distinct('_id');

  const grants = await DocumentAccess.find({
    isRevoked: false,
    $or: [{ grantedTo: userId }, { grantedToGroup: { $in: myGroupIds } }],
  });

  const activeDocIds = grants.filter(isGrantActive).map((g) => g.document.toString());
  return [...new Set(activeDocIds)];
}

async function grantAccess({ documentId, grantedBy, targetType, targetId, accessType, expiresAt }) {
  const document = await Document.findOne({ _id: documentId, uploadedBy: grantedBy, isDeleted: false });
  if (!document) {
    throw new ApiError(404, 'Document not found', 'DOCUMENT_NOT_FOUND');
  }

  if (targetType === 'USER') {
    const employee = await User.findOne({ _id: targetId, role: 'EMPLOYEE', isActive: true });
    if (!employee) {
      throw new ApiError(400, 'Target user is not a valid, active employee', 'INVALID_TARGET');
    }
  } else {
    const group = await Group.findOne({ _id: targetId, createdBy: grantedBy });
    if (!group) {
      throw new ApiError(404, 'Group not found', 'GROUP_NOT_FOUND');
    }
  }

  const access = await DocumentAccess.create({
    document: documentId,
    grantedTo: targetType === 'USER' ? targetId : null,
    grantedToGroup: targetType === 'GROUP' ? targetId : null,
    grantedBy,
    accessType,
    expiresAt: accessType === 'EXPIRING' ? new Date(expiresAt) : null,
  });

  return access;
}

async function listAccessForDocument(documentId, ownerId) {
  const document = await Document.findOne({ _id: documentId, uploadedBy: ownerId, isDeleted: false });
  if (!document) {
    throw new ApiError(404, 'Document not found', 'DOCUMENT_NOT_FOUND');
  }

  return DocumentAccess.find({ document: documentId, isRevoked: false })
    .populate('grantedTo', 'name email')
    .populate('grantedToGroup', 'name')
    .sort({ createdAt: -1 });
}

async function revokeAccess(documentId, accessId, ownerId) {
  const document = await Document.findOne({ _id: documentId, uploadedBy: ownerId, isDeleted: false });
  if (!document) {
    throw new ApiError(404, 'Document not found', 'DOCUMENT_NOT_FOUND');
  }

  const access = await DocumentAccess.findOneAndUpdate(
    { _id: accessId, document: documentId, isRevoked: false },
    { $set: { isRevoked: true } },
    { returnDocument: 'after' }
  );

  if (!access) {
    throw new ApiError(404, 'Access grant not found', 'ACCESS_NOT_FOUND');
  }

  return access;
}

module.exports = { hasAccess, listAccessibleDocumentIds, grantAccess, listAccessForDocument, revokeAccess };