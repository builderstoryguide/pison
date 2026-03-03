import { z } from 'zod';

export const getSigninSchema = () => {
  return z.object({
    identifier: z
      .string()
      .min(1, { message: 'Username or email is required.' }),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters long.' })
      .min(1, { message: 'Password is required.' }),
    rememberMe: z.boolean().optional(),
  });
};

export type SigninSchemaType = z.infer<ReturnType<typeof getSigninSchema>>;
