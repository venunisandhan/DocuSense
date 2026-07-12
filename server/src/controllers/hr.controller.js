
const hrService = require('../services/hr.service');

async function searchDirectory(req, res) {
  const { q } = req.query;
  const users = await hrService.searchDirectory(q, req.user.id);

  res.status(200).json({ success: true, data: { users } });
}

async function createGroup(req, res) {
  const { name, memberIds } = req.body;
  const group = await hrService.createGroup({ name, memberIds, createdBy: req.user.id });

  res.status(201).json({ success: true, data: { group } });
}

async function listGroups(req, res) {
  const groups = await hrService.listGroups(req.user.id);
  res.status(200).json({ success: true, data: { groups } });
}

async function getGroup(req, res) {
  const group = await hrService.getGroupById(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: { group } });
}

async function updateGroup(req, res) {
  const group = await hrService.updateGroup(req.params.id, req.user.id, req.body);
  res.status(200).json({ success: true, data: { group } });
}

async function deleteGroup(req, res) {
  await hrService.deleteGroup(req.params.id, req.user.id);
  res.status(204).send();
}

module.exports = { searchDirectory, createGroup, listGroups, getGroup, updateGroup, deleteGroup };