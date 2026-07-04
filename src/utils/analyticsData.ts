import { format, parseISO, startOfMonth, isValid, subMonths, startOfYear, subYears } from 'date-fns';
import type { Invoice } from '../types/invoice';

/* ── Date range helpers ───────────────────────────────────────────────── */
export interface DateRange {
  from: string;   // ISO date yyyy-MM-dd
  to:   string;   // ISO date yyyy-MM-dd
  label: string;  // display label
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/** Filter invoices to those issued within [from, to] inclusive */
export function filterByDateRange(invoices: Invoice[], range: DateRange): Invoice[] {
  const from = parseISO(range.from);
  const to   = parseISO(range.to);
  return invoices.filter((inv) => {
    try {
      const d = parseISO(inv.issueDate);
      return isValid(d) && d >= from && d <= to;
    } catch { return false; }
  });
}

/** Pre-built quick-select presets */
export function buildPresets(): DateRange[] {
  const today = new Date();
  const y = today.getFullYear();
  const todayStr = today.toISOString().split('T')[0];

  return [
    {
      label: 'This Month',
      from:  format(startOfMonth(today), 'yyyy-MM-dd'),
      to:    todayStr,
    },
    {
      label: 'Last 3 Months',
      from:  format(subMonths(today, 3), 'yyyy-MM-dd'),
      to:    todayStr,
    },
    {
      label: 'Last 6 Months',
      from:  format(subMonths(today, 6), 'yyyy-MM-dd'),
      to:    todayStr,
    },
    {
      label: 'Last 12 Months',
      from:  format(subMonths(today, 12), 'yyyy-MM-dd'),
      to:    todayStr,
    },
    {
      label: `This Year (${y})`,
      from:  format(startOfYear(today), 'yyyy-MM-dd'),
      to:    todayStr,
    },
    {
      label: `Last Year (${y - 1})`,
      from:  format(startOfYear(subYears(today, 1)), 'yyyy-MM-dd'),
      to:    format(new Date(y - 1, 11, 31), 'yyyy-MM-dd'),
    },
    {
      label: 'All Time',
      from:  '2020-01-01',
      to:    todayStr,
    },
  ];
}

/* ── Revenue by month ─────────────────────────────────────────────────── */
export interface MonthRevenue {
  month: string;       // e.g. "Jan 26"
  invoiced: number;
  paid: number;
  outstanding: number;
  overdue: number;
}

export function buildMonthlyRevenue(invoices: Invoice[], range?: DateRange): MonthRevenue[] {
  const map = new Map<string, MonthRevenue>();

  // Seed every month between from→to so empty months still appear
  const fromDate = range ? parseISO(range.from) : subMonths(new Date(), 6);
  const toDate   = range ? parseISO(range.to)   : new Date();

  const cursor = new Date(startOfMonth(fromDate));
  while (cursor <= toDate) {
    const key = format(cursor, 'MMM yy');
    if (!map.has(key)) {
      map.set(key, { month: key, invoiced: 0, paid: 0, outstanding: 0, overdue: 0 });
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  invoices.forEach((inv) => {
    try {
      const d = parseISO(inv.issueDate);
      if (!isValid(d)) return;
      const key = format(startOfMonth(d), 'MMM yy');
      if (!map.has(key)) return;
      const row = map.get(key)!;
      row.invoiced += inv.total;
      if (inv.status === 'PAID')    row.paid        += inv.total;
      if (inv.status === 'SENT')    row.outstanding += inv.total;
      if (inv.status === 'OVERDUE') row.overdue     += inv.total;
    } catch { /* skip */ }
  });

  return Array.from(map.values());
}

/* ── Status breakdown ─────────────────────────────────────────────────── */
export interface StatusSlice {
  name: string;
  value: number;
  count: number;
  color: string;
}

export function buildStatusBreakdown(invoices: Invoice[]): StatusSlice[] {
  const map: Record<string, { value: number; count: number; color: string }> = {
    PAID:    { value: 0, count: 0, color: '#22C55E' },
    SENT:    { value: 0, count: 0, color: '#60A5FA' },
    OVERDUE: { value: 0, count: 0, color: '#EF4444' },
    DRAFT:   { value: 0, count: 0, color: '#5A6A7A' },
  };
  invoices.forEach((inv) => {
    if (map[inv.status]) {
      map[inv.status].value += inv.total;
      map[inv.status].count += 1;
    }
  });
  return Object.entries(map)
    .map(([name, d]) => ({ name, ...d }))
    .filter((s) => s.count > 0);
}

/* ── Top clients by revenue ────────────────────────────────────────────── */
export interface ClientRevenue {
  name: string;
  total: number;
  paid: number;
  invoices: number;
}

export function buildTopClients(invoices: Invoice[], limit = 6): ClientRevenue[] {
  const map = new Map<string, ClientRevenue>();
  invoices.forEach((inv) => {
    const key = inv.clientSnapshot.companyName || 'Unknown';
    if (!map.has(key)) map.set(key, { name: key, total: 0, paid: 0, invoices: 0 });
    const row = map.get(key)!;
    row.total    += inv.total;
    row.invoices += 1;
    if (inv.status === 'PAID') row.paid += inv.total;
  });
  return Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/* ── Top services by revenue ───────────────────────────────────────────── */
export interface ServiceRevenue {
  name: string;
  total: number;
  count: number;
}

export function buildTopServices(invoices: Invoice[], limit = 6): ServiceRevenue[] {
  const map = new Map<string, ServiceRevenue>();
  invoices.forEach((inv) => {
    inv.lineItems.forEach((li) => {
      const key = li.name || 'Unnamed';
      if (!map.has(key)) map.set(key, { name: key, total: 0, count: 0 });
      const row = map.get(key)!;
      row.total += li.amount;
      row.count += 1;
    });
  });
  return Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/* ── Collection rate ───────────────────────────────────────────────────── */
export function collectionRate(invoices: Invoice[]): number {
  const sent = invoices.filter((i) => i.status !== 'DRAFT');
  if (!sent.length) return 0;
  const paid = sent.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.total, 0);
  const total = sent.reduce((s, i) => s + i.total, 0);
  return total > 0 ? Math.round((paid / total) * 100) : 0;
}

/* ── Average invoice value ─────────────────────────────────────────────── */
export function avgInvoiceValue(invoices: Invoice[]): number {
  if (!invoices.length) return 0;
  return invoices.reduce((s, i) => s + i.total, 0) / invoices.length;
}
