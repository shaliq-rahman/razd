import { z } from 'zod'

export const credentialsSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const accountSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50),
  type: z.enum(['bank', 'cash', 'card', 'wallet', 'investment']),
  opening_balance: z.coerce.number('Enter a valid amount').finite('Enter a valid amount'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Pick a colour'),
})

export const transactionSchema = z.object({
  account_id: z.uuid('Choose an account'),
  // An unselected category arrives as an empty string; treat that as "no category"
  // rather than as a validation failure.
  category_id: z
    .union([z.uuid(), z.literal('')])
    .optional()
    .transform((v) => (v ? v : undefined)),
  amount: z.coerce.number('Enter an amount').positive('Enter an amount greater than zero'),
  kind: z.enum(['income', 'expense']),
  note: z.string().trim().max(120).optional(),
  occurred_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date'),
})

export const profileSchema = z.object({
  display_name: z.string().trim().min(1, 'Name is required').max(50),
})
