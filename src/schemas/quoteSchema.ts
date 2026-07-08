import { z } from 'zod';

const optionalDiscountTypeSchema = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.enum(['AMOUNT', 'PERCENT']).nullable()
);

export const quoteLineItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Description is required'),
  description: z.string(),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unitPrice: z.number().min(0, 'Unit price must be 0 or more'),
  amount: z.number(),
  sortOrder: z.number().default(0),
});

export const quoteClientSnapshotSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string(),
  email: z.union([z.string().email('Invalid email'), z.literal('')]),
  phone: z.string(),
  address: z.string(),
});

export const quoteFormSchema = z.object({
  quoteNumber: z.string().min(1, 'Quote number is required'),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']),
  issueDate: z.string().min(1, 'Issue date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  clientId: z.string().nullable(),
  clientSnapshot: quoteClientSnapshotSchema,
  lineItems: z.array(quoteLineItemSchema).min(1, 'At least one line item is required'),
  discountType: optionalDiscountTypeSchema,
  discountValue: z.number().min(0),
  vatEnabled: z.boolean(),
  vatRate: z.number(),
  notes: z.string(),
});

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;
