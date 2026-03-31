import { z } from 'zod';

export const GeneralSettingsSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  logoFile: z
    .instanceof(File)
    .nullable()
    .optional()
    .refine(
      (file) => !file || file.size <= 1024 * 1024, // Check if file is not present or <= 1MB
      { message: 'Logo file must be smaller than 1MB' },
    ),
  logoAction: z.string().optional(),
  active: z.boolean(),
  address: z.string().nullable().optional(),
  websiteURL: z
    .string()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .optional(),
  supportEmail: z.string().email('Must be a valid email'),
  supportPhone: z.string().nullable().optional(),
  language: z.string(),
  timezone: z.string(),
  defaultDailyClosureTime: z
    .string()
    .regex(/^([01]?\d|2[0-3]):([0-5]\d)$/, 'Use HH:mm (24h), e.g. 18:00'),
  currency: z.string(),
  currencyFormat: z.string(),
});

export type GeneralSettingsSchemaType = z.infer<typeof GeneralSettingsSchema>;
