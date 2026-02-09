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
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long.' })
      .regex(/[A-Z]/, {
        message: 'Password must contain at least one uppercase letter.',
      })
      .regex(/[a-z]/, {
        message: 'Password must contain at least one lowercase letter.',
      })
      .regex(/[0-9]/, {
        message: 'Password must contain at least one number.',
      })
      .regex(/[^A-Za-z0-9]/, {
        message: 'Password must contain at least one special character.',
      }),
    passwordConfirmation: z.string().min(1, {
      message: 'Please confirm the password.',
    }),
    roleId: z.string().nonempty({
      message: 'Role is required.',
    }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Passwords do not match.',
    path: ['passwordConfirmation'],
  });

export type UserAddSchemaType = z.infer<typeof UserAddSchema>;
