const { z } = require('zod');
const mongoose = require('mongoose');

const objectIdSchema = z.string().refine(
  (val) => mongoose.isValidObjectId(val),
  { message: 'Invalid ID format' }
);

const ragParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const chatSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    question: z.string().min(1).max(500),
  }),
});

const globalChatSchema = z.object({
  body: z.object({
    question: z.string().min(1).max(500),
  }),
});

module.exports = { ragParamSchema, chatSchema, globalChatSchema };
