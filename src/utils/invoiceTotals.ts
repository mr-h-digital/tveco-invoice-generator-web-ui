import type { LineItem } from '../types/invoice';

interface TotalsInput {
  lineItems: LineItem[];
  discountType: 'AMOUNT' | 'PERCENT' | null;
  discountValue: number;
  vatEnabled: boolean;
  vatRate: number;
}

interface TotalsResult {
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  total: number;
}

export function calculateTotals(input: TotalsInput): TotalsResult {
  const subtotal = input.lineItems.reduce((sum, item) => sum + item.amount, 0);

  let discountAmount = 0;
  if (input.discountType === 'AMOUNT') {
    discountAmount = Math.min(input.discountValue, subtotal);
  } else if (input.discountType === 'PERCENT') {
    discountAmount = (subtotal * input.discountValue) / 100;
  }

  const afterDiscount = subtotal - discountAmount;
  const vatAmount = input.vatEnabled ? afterDiscount * input.vatRate : 0;
  const total = afterDiscount + vatAmount;

  return { subtotal, discountAmount, vatAmount, total };
}
