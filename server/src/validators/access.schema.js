
const { z } = require('zod');

const mongoose = require('mongoose');

const objectIdSchema = z.string().refine(
  (val) => mongoose.isValidObjectId(val),
  { message: 'Invalid ID format' }
);

const documentIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

const grantAccessSchema = z.object({
  params: z.object({
    id: objectIdSchema,
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
    id: objectIdSchema,
    accessId: objectIdSchema,
  }),
});

module.exports = { documentIdParamSchema, grantAccessSchema, revokeAccessParamSchema };