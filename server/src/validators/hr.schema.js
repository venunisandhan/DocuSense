
const { z } = require('zod');

const mongoose = require('mongoose');

const objectIdSchema = z.string().refine(
  (val) => mongoose.isValidObjectId(val),
  { message: 'Invalid ID format' }
);

const searchDirectorySchema = z.object({
  query: z.object({
    q: z.string().trim().min(2, 'Search query must be at least 2 characters'),
  }),
});

const createGroupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Group name must be at least 2 characters').max(100),
    memberIds: z.array(objectIdSchema).min(1, 'A group must have at least one member'),
  }),
});

const updateGroupSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    memberIds: z.array(objectIdSchema).optional(),
  }),
});

module.exports = { searchDirectorySchema, createGroupSchema, updateGroupSchema };