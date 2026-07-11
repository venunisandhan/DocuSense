
const User = require('../models/User');

const Group = require('../models/Group');

const DocumentAccess = require('../models/DocumentAccess'); // will exist once you build documents; stub-safe to import now

const ApiError = require('../utils/ApiError');

async function searchDirectory(query, excludeUserId) {
  const users = await User.find({
    _id: { $ne: excludeUserId },
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
    ],
  })
    .select('name email role')
    .limit(20);

  return users;
}

async function createGroup({ name, memberIds, createdBy }) {
  const validMembers = await User.find({
    _id: { $in: memberIds },
    role: 'EMPLOYEE',
    isActive: true,
  }).select('_id');

  if (validMembers.length !== memberIds.length) {
    throw new ApiError(400, 'One or more selected members are invalid or not employees', 'INVALID_MEMBERS');
  }

  const group = await Group.create({ name, createdBy, members: memberIds });
  return group;
}

async function listGroups(createdBy) {
  return Group.find({ createdBy }).populate('members', 'name email').sort({ createdAt: -1 });
}

async function getGroupById(groupId, requestingUserId) {
  const group = await Group.findOne({ _id: groupId, createdBy: requestingUserId }).populate('members', 'name email');
  if (!group) {
    throw new ApiError(404, 'Group not found', 'GROUP_NOT_FOUND');
  }
  return group;
}

async function updateGroup(groupId, requestingUserId, updates) {
  const group = await Group.findOne({ _id: groupId, createdBy: requestingUserId });
  if (!group) {
    throw new ApiError(404, 'Group not found', 'GROUP_NOT_FOUND');
  }

  if (updates.memberIds) {
    const validMembers = await User.find({
      _id: { $in: updates.memberIds },
      role: 'EMPLOYEE',
      isActive: true,
    }).select('_id');

    if (validMembers.length !== updates.memberIds.length) {
      throw new ApiError(400, 'One or more selected members are invalid or not employees', 'INVALID_MEMBERS');
    }
    group.members = updates.memberIds;
  }

  if (updates.name) {
    group.name = updates.name;
  }

  await group.save();
  return group;
}

async function deleteGroup(groupId, requestingUserId) {
  const group = await Group.findOne({ _id: groupId, createdBy: requestingUserId });
  if (!group) {
    throw new ApiError(404, 'Group not found', 'GROUP_NOT_FOUND');
  }

  await DocumentAccess.updateMany(
    { grantedToGroup: groupId },
    { $set: { isRevoked: true } }
  );

  await group.deleteOne();
}

module.exports = { searchDirectory, createGroup, listGroups, getGroupById, updateGroup, deleteGroup };