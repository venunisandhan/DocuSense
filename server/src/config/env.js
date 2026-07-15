
const {z} = require("zod");

require('dotenv').config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),

  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().min(1, 'S3_BUCKET is required'),
  S3_ACCESS_KEY_ID: z.string().min(1, 'S3_ACCESS_KEY_ID is required'),
  S3_SECRET_ACCESS_KEY: z.string().min(1, 'S3_SECRET_ACCESS_KEY is required'),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),

  AWS_REGION: z.string().default('us-east-1'),
  BEDROCK_EMBEDDING_MODEL_ID: z.string().default('amazon.titan-embed-text-v2:0'),
  BEDROCK_GENERATION_MODEL_ID: z.string(),
  VECTOR_SIMILARITY_THRESHOLD: z.coerce.number().default(0.5),
  CHUNK_SIZE_CHARS: z.coerce.number().default(2000),
  CHUNK_OVERLAP_CHARS: z.coerce.number().default(200),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(20),

  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  GOOGLE_REDIRECT_URI: z.string().url(),
  PENDING_ROLE_TOKEN_SECRET: z.string().min(16, 'PENDING_ROLE_TOKEN_SECRET must be at least 16 characters'),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('DocuSense <no-reply@docusense.local>'),
});

const parsed = envSchema.safeParse(process.env);

if(!parsed.success){
    console.error('Invalid enviroment variables' , parsed.error.flatten().fieldErrors);
    process.exit(1); //shutting off process
}

module.exports = parsed.data;