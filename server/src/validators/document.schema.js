const { z } = require('zod');

const mongoose = require('mongoose');

const objectIdSchema = z.string().refine(
  (val) => mongoose.isValidObjectId(val),
  { message: 'Invalid ID format' }
);

const uploadDocumentSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200),
  }),
});

const documentIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid Document ID format' }),
  }),
});

const updateGuidelinesSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid Document ID format' }),
  }),
  body: z.object({
    guidelines: z.string().max(5000, 'Guidelines cannot exceed 5000 characters'),
  }),
});

module.exports = { uploadDocumentSchema, documentIdParamSchema, updateGuidelinesSchema };
