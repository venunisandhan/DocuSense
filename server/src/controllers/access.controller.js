
const accessService = require('../services/access.service');

async function grantAccess(req, res) {
  const access = await accessService.grantAccess({
    documentId: req.params.id,
    grantedBy: req.user.id,
    ...req.body,
  });

  res.status(201).json({ success: true, data: { access } });
}

async function listAccess(req, res) {
  const access = await accessService.listAccessForDocument(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: { access } });
}

async function revokeAccess(req, res) {
  await accessService.revokeAccess(req.params.id, req.params.accessId, req.user.id);
  res.status(204).send();
}

module.exports = { grantAccess, listAccess, revokeAccess };