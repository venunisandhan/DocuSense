
const { z } = require('zod');

const mongoose = require('mongoose');

const objectIdSchema = z.string().refine(
  (val) => mongoose.isValidObjectId(val),
  { message: 'Invalid ID format' }
);

const documentIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid Document ID format' }),
  }),
});

const grantAccessSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid Document ID format' }),
  }),
  body: z
    .object({
      targetType: z.enum(['USER', 'GROUP'], {
        errorMap: () => ({ message: 'targetType must be USER or GROUP' }),
      }),
      targetId: objectIdSchema,
      accessType: z.enum(['LIFETIME', 'EXPIRING']),
      expiresAt: z.string().datetime().optional(),
    })
    .refine(
      (data) => data.accessType === 'LIFETIME' || !!data.expiresAt,
      { message: 'expiresAt is required when accessType is EXPIRING', path: ['expiresAt'] }
    ),
});

const revokeAccessParamSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid Document ID format' }),
    accessId: objectIdSchema,
  }),
});

module.exports = { documentIdParamSchema, grantAccessSchema, revokeAccessParamSchema };