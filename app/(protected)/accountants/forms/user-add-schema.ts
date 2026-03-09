import { z } from 'zod';

/**
 * Simplified schema for adding an accountant.
 * Only name, email, and roleId are required.
 * Username, password, and password confirmation are omitted
 * because the system auto-generates login credentials.
 */
export const AccountantAddSchema = z.object({
  name: z
    .string()
    .nonempty({ message: 'Name is required.' })
    .min(2, { message: 'Name must be at least 2 characters long.' })
    .max(50, { message: 'Name must not exceed 50 characters.' }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  roleId: z.string().nonempty({
    message: 'Role is required.',
  }),
});

export type AccountantAddSchemaType = z.infer<typeof AccountantAddSchema>;
