import { format, parseISO, isValid } from 'date-fns';

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return format(date, 'd MMMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return format(date, 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDaysISO(dateStr: string, days: number): string {
  try {
    const date = parseISO(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}
