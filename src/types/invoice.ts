export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
export type DiscountType   = 'AMOUNT' | 'PERCENT';

export interface LineItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sortOrder: number;
}

export interface ClientSnapshot {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
}

export interface PaymentDetails {
  bank: string;
  accountName: string;
  accountNumber: string;
  accountType: string;
  branchCode: string;
  reference: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  clientId: string | null;
  exportJobId: string | null;
  clientSnapshot: ClientSnapshot;
  lineItems: LineItem[];
  subtotal: number;
  discountType: DiscountType | null;
  discountValue: number;
  discountAmount: number;
  vatEnabled: boolean;
  vatRate: number;
  vatAmount: number;
  total: number;
  notes: string;
  paymentDetails: PaymentDetails;
  createdAt: string;
  updatedAt: string;
}
