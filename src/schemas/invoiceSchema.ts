import { z } from 'zod';

const optionalDiscountTypeSchema = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.enum(['AMOUNT', 'PERCENT']).nullable()
);

export const lineItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Description is required'),
  description: z.string(),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unitPrice: z.number().min(0, 'Unit price must be 0 or more'),
  amount: z.number(),
  sortOrder: z.number().default(0),
});

export const clientSnapshotSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string(),
  email: z.union([z.string().email('Invalid email'), z.literal('')]),
  phone: z.string(),
  address: z.string(),
});

export const paymentDetailsSchema = z.object({
  bank: z.string(),
  accountName: z.string(),
  accountNumber: z.string(),
  accountType: z.string(),
  branchCode: z.string(),
  reference: z.string(),
});

export const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  clientId: z.string().nullable(),
  exportJobId: z.string().nullable(),
  clientSnapshot: clientSnapshotSchema,
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  discountType: optionalDiscountTypeSchema,
  discountValue: z.number().min(0),
  vatEnabled: z.boolean(),
  vatRate: z.number(),
  notes: z.string(),
  paymentDetails: paymentDetailsSchema,
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
