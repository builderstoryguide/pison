import { z } from 'zod';

export const getSigninSchema = () => {
  return z.object({
    identifier: z
      .string()
      .optional(),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters long.' })
      .min(1, { message: 'Password is required.' }),
    email: z.string().optional(),
    rememberMe: z
      .preprocess((val) => {
        if (typeof val === 'string') return val === 'true';
        return val;
      }, z.boolean())
      .optional(),
  });
};

export type SigninSchemaType = z.infer<ReturnType<typeof getSigninSchema>>;
