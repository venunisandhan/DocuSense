
const {z} = require("zod");

require('dotenv').config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(5000),
    MONGODB_URI: z.string().min(1, 'MONGO_URI is required'),
    JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be atleast 16 characters'),
    JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET must be atleast 16 characters'),
});

const parsed = envSchema.safeParse(process.env);

if(!parsed.success){
    console.error('Invalid enviroment variables' , parsed.error.flatten().fieldErrors);
    process.exit(1); //shutting off process
}

module.exports = parsed.data;