
const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['HR', 'EMPLOYEE'], { errorMap: () => ({ message: 'Role must be HR or EMPLOYEE' }) }),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
  }),
});
 
const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});
 
const completeGoogleSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    role: z.enum(['HR', 'EMPLOYEE'], {
      errorMap: () => ({ message: 'Role must be HR or EMPLOYEE' }),
    }),
  }),
});


module.exports = { registerSchema, loginSchema,forgotPasswordSchema,resetPasswordSchema,completeGoogleSchema };