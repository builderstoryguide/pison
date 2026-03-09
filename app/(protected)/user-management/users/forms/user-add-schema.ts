import { z } from 'zod';

export const UserAddSchema = z
  .object({
    name: z
      .string()
      .nonempty({ message: 'Name is required.' })
      .min(2, { message: 'Name must be at least 2 characters long.' })
      .max(50, { message: 'Name must not exceed 50 characters.' }),
    email: z.string().email({
      message: 'Please enter a valid email address.',
    }),
    username: z
      .string()
      .optional()
      .refine((v) => !v || /^[a-zA-Z0-9_]{3,30}$/.test(v), {
        message: 'Username must be 3-30 characters, letters, numbers, and underscores only.',
      })
      .transform((v) => (v?.trim() ? v.trim() : undefined)),
    password: z
      .string()
      .optional()
      .refine((v) => !v || v.length >= 8, {
        message: 'Password must be at least 8 characters long.',
      })
      .refine((v) => !v || /[A-Z]/.test(v), {
        message: 'Password must contain at least one uppercase letter.',
      })
      .refine((v) => !v || /[a-z]/.test(v), {
        message: 'Password must contain at least one lowercase letter.',
      })
      .refine((v) => !v || /[0-9]/.test(v), {
        message: 'Password must contain at least one number.',
      })
      .refine((v) => !v || /[^A-Za-z0-9]/.test(v), {
        message: 'Password must contain at least one special character.',
      }),
    passwordConfirmation: z.string().optional(),
    roleId: z.string().nonempty({
      message: 'Role is required.',
    }),
  })
  .refine(
    (data) => {
      // Only validate match when password is explicitly provided
      if (!data.password) return true;
      return data.password === data.passwordConfirmation;
    },
    {
      message: 'Passwords do not match.',
      path: ['passwordConfirmation'],
    },
  );

export type UserAddSchemaType = z.infer<typeof UserAddSchema>;
