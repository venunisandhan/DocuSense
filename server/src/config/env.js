const { z } = require('zod');

require('dotenv').config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().min(1, 'S3_BUCKET is required'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_EMBEDDING_MODEL: z.string().default('gemini-embedding-2'),
  GEMINI_GENERATION_MODEL: z.string().default('gemini-3.1-flash-lite'),
  VECTOR_SIMILARITY_THRESHOLD: z.coerce.number().default(0.5),
  CHUNK_SIZE_CHARS: z.coerce.number().default(2000),
  CHUNK_OVERLAP_CHARS: z.coerce.number().default(200),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(20),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  GOOGLE_REDIRECT_URI: z.string().url(),
  PENDING_ROLE_TOKEN_SECRET: z.string().min(16, 'PENDING_ROLE_TOKEN_SECRET must be at least 16 characters'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

module.exports = parsed.data;