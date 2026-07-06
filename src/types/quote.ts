export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type DiscountType = 'AMOUNT' | 'PERCENT';

export interface QuoteLineItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sortOrder: number;
}

export interface QuoteClientSnapshot {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  status: QuoteStatus;
  issueDate: string;
  expiryDate: string;
  clientId: string | null;
  clientSnapshot: QuoteClientSnapshot;
  lineItems: QuoteLineItem[];
  subtotal: number;
  discountType: DiscountType | null;
  discountValue: number;
  discountAmount: number;
  vatEnabled: boolean;
  vatRate: number;
  vatAmount: number;
  total: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
