// Pure helpers (no Expo / React-Native imports). Safe to unit-test in any
// JS runtime. Used from screens via the richer modules in lib/money.ts and
// lib/cart.ts.

export const VAT_RATE = 0.15;
export const PLATFORM_FEE_RATE = 0.02;

export type LineInput = {
  kind: 'purchase' | 'rental' | 'hiring';
  quantity: number;
  days?: number;
  hireDays?: number;
  unitPrice: number;
};

export function lineTotal(line: LineInput): number {
  if (line.kind === 'rental') return line.unitPrice * (line.days ?? 1);
  if (line.kind === 'hiring') return line.unitPrice * (line.hireDays ?? 1);
  return line.unitPrice * line.quantity;
}

export function computeTotals(lines: LineInput[]) {
  const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0);
  const vat = +(subtotal * VAT_RATE).toFixed(2);
  const platformFee = +(subtotal * PLATFORM_FEE_RATE).toFixed(2);
  const total = +(subtotal + vat + platformFee).toFixed(2);
  return { subtotal: +subtotal.toFixed(2), vat, platformFee, total };
}

/** "now" / "5m" / "3h" / "2d" / "2026-01-01" */
export function relativeTime(when: number, now: number = Date.now()): string {
  const diff = (now - when) / 1000;
  if (!Number.isFinite(diff)) return '';
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604_800) return `${Math.floor(diff / 86_400)}d`;
  return new Date(when).toISOString().slice(0, 10);
}
