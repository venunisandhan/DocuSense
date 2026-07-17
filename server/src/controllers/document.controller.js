
const documentService = require('../services/document.service');

const ApiError = require('../utils/ApiError');

async function upload(req, res) {
  if (!req.file) {
    throw new ApiError(400, 'A file is required', 'FILE_REQUIRED');
  }

  const buffer = req.file.buffer;
  let isValidContent = false;
  
  if (req.file.mimetype === 'application/pdf') {
    isValidContent = buffer.length > 4 && buffer.toString('utf8', 0, 5) === '%PDF-';
  } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    isValidContent = buffer.length > 4 && buffer.toString('hex', 0, 4) === '504b0304';
  } else if (req.file.mimetype === 'text/plain') {
    isValidContent = true;
  }

  if (!isValidContent) {
    throw new ApiError(400, 'Invalid file content. Spoofed or corrupted file detected.', 'FILE_TYPE_MISMATCH');
  }

  const tagsStr = req.body.tags || '';
  const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
  const accessLevel = req.body.accessLevel || 'Public';

  const document = await documentService.uploadDocument({
    title: req.body.title,
    file: req.file,
    uploadedBy: req.user.id,
    accessLevel,
    tags,
  });

  res.status(201).json({ success: true, data: { document } });
}

async function listMyUploads(req, res) {
  const documents = await documentService.listMyUploads(req.user.id);
  res.status(200).json({ success: true, data: { documents } });
}

async function listMyShared(req, res) {
  const documents = await documentService.listMyShared(req.user.id);
  res.status(200).json({ success: true, data: { documents } });
}

async function getDocument(req, res) {
  const document = await documentService.getDocumentForUser(req.params.id, req.user);
  res.status(200).json({ success: true, data: { document } });
}

async function getDownloadUrl(req, res) {
  const url = await documentService.getDownloadUrlForUser(req.params.id, req.user);
  res.status(200).json({ success: true, data: { url, expiresInSeconds: 300 } });
}

async function updateGuidelines(req, res) {
  const document = await documentService.updateGuidelines(req.params.id, req.user.id, req.body.guidelines);
  res.status(200).json({ success: true, data: { document } });
}

async function deleteDocument(req, res) {
  const document = await documentService.deleteDocument(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: { document } });
}

module.exports = {
  upload,
  listMyUploads,
  listMyShared,
  getDocument,
  getDownloadUrl,
  updateGuidelines,
  deleteDocument
};