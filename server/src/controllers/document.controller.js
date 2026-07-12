
const documentService = require('../services/document.service');

const ApiError = require('../utils/ApiError');

async function upload(req, res) {
  if (!req.file) {
    throw new ApiError(400, 'A file is required', 'FILE_REQUIRED');
  }

  const document = await documentService.uploadDocument({
    title: req.body.title,
    file: req.file,
    uploadedBy: req.user.id,
  });

  res.status(201).json({ success: true, data: { document } });
}

async function listMyUploads(req, res) {
  const documents = await documentService.listMyUploads(req.user.id);
  res.status(200).json({ success: true, data: { documents } });
}

async function getDocument(req, res) {
  const document = await documentService.getDocumentForOwner(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: { document } });
}

async function getDownloadUrl(req, res) {
  const url = await documentService.getDownloadUrlForOwner(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: { url, expiresInSeconds: 300 } });
}

async function updateGuidelines(req, res) {
  const document = await documentService.updateGuidelines(req.params.id, req.user.id, req.body.guidelines);
  res.status(200).json({ success: true, data: { document } });
}

module.exports = { upload, listMyUploads, getDocument, getDownloadUrl, updateGuidelines };