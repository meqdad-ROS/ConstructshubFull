// Formatting helpers.
import { getLocale } from './i18n';

export function fmtSar(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return '—';
  const n = new Intl.NumberFormat(getLocale() === 'ar' ? 'ar-SA' : 'en-US', {
    maximumFractionDigits: 2,
  }).format(amount);
  return getLocale() === 'ar' ? `${n} ر.س` : `SAR ${n}`;
}

export function fmtNumber(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(getLocale() === 'ar' ? 'ar-SA' : 'en-US').format(n);
}

export function fmtRelative(when: string | number | Date): string {
  const now = Date.now();
  const date = when instanceof Date ? when.getTime() : typeof when === 'number' ? when : Date.parse(when);
  const diff = (now - date) / 1000;
  if (!Number.isFinite(diff)) return '';
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604_800) return `${Math.floor(diff / 86400)}d`;
  return new Date(date).toISOString().slice(0, 10);
}
