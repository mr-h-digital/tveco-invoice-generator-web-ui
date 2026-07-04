import { z } from 'zod';

export const clientFormSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string(),
  address: z.string(),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;
