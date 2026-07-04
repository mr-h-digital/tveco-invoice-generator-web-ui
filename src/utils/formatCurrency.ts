export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace('ZAR', 'R');
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_000_000) return `R ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `R ${(amount / 1_000).toFixed(1)}k`;
  return formatCurrency(amount);
}
