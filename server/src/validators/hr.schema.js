
const { z } = require('zod');

const mongoose = require('mongoose');

const objectIdSchema = z.string().refine(
  (val) => mongoose.isValidObjectId(val),
  { message: 'Invalid ID format' }
);

const searchDirectorySchema = z.object({
  query: z.object({
    q: z.string().trim().optional(),
  }),
});

const createGroupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Group name must be at least 2 characters').max(100),
    memberIds: z.array(objectIdSchema).default([]),
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