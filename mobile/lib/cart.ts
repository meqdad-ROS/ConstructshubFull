// Persistent cart stored in expo-sqlite so lines survive app reload and work
// offline. Mirrors the shape expected by POST /api/orders on the server.

import * as SQLite from 'expo-sqlite';

export type CartLineKind = 'purchase' | 'rental' | 'hiring';

export type CartLine = {
  id: string;
  listingId: string;
  kind: CartLineKind;
  quantity: number;
  days?: number;
  hireDays?: number;
  title: string;
  unitPrice: number;
  unitLabel: string;
  vendorName: string;
};

const VAT_RATE = 0.15;
const PLATFORM_FEE_RATE = 0.02;

let dbInstance: SQLite.SQLiteDatabase | null = null;
async function db(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('constructhub-cart.db');
    await dbInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS cart (
        id TEXT PRIMARY KEY,
        listing_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        days INTEGER,
        hire_days INTEGER,
        title TEXT NOT NULL,
        unit_price REAL NOT NULL,
        unit_label TEXT NOT NULL,
        vendor_name TEXT NOT NULL
      );
    `);
  }
  return dbInstance;
}

function uid(): string {
  return `cl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function addToCart(input: Omit<CartLine, 'id'>): Promise<string> {
  const id = uid();
  const d = await db();
  await d.runAsync(
    'INSERT INTO cart (id, listing_id, kind, quantity, days, hire_days, title, unit_price, unit_label, vendor_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    id,
    input.listingId,
    input.kind,
    input.quantity,
    input.days ?? null,
    input.hireDays ?? null,
    input.title,
    input.unitPrice,
    input.unitLabel,
    input.vendorName
  );
  return id;
}

export async function removeFromCart(id: string): Promise<void> {
  const d = await db();
  await d.runAsync('DELETE FROM cart WHERE id = ?', id);
}

export async function clearCart(): Promise<void> {
  const d = await db();
  await d.runAsync('DELETE FROM cart');
}

export async function readCart(): Promise<CartLine[]> {
  const d = await db();
  const rows = await d.getAllAsync<{
    id: string;
    listing_id: string;
    kind: string;
    quantity: number;
    days: number | null;
    hire_days: number | null;
    title: string;
    unit_price: number;
    unit_label: string;
    vendor_name: string;
  }>('SELECT * FROM cart');
  return rows.map((r) => ({
    id: r.id,
    listingId: r.listing_id,
    kind: r.kind as CartLineKind,
    quantity: r.quantity,
    days: r.days ?? undefined,
    hireDays: r.hire_days ?? undefined,
    title: r.title,
    unitPrice: r.unit_price,
    unitLabel: r.unit_label,
    vendorName: r.vendor_name,
  }));
}

export function lineTotal(line: CartLine): number {
  if (line.kind === 'rental') return line.unitPrice * (line.days ?? 1);
  if (line.kind === 'hiring') return line.unitPrice * (line.hireDays ?? 1);
  return line.unitPrice * line.quantity;
}

export function computeTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0);
  const vat = +(subtotal * VAT_RATE).toFixed(2);
  const platformFee = +(subtotal * PLATFORM_FEE_RATE).toFixed(2);
  const total = +(subtotal + vat + platformFee).toFixed(2);
  return { subtotal: +subtotal.toFixed(2), vat, platformFee, total };
}
