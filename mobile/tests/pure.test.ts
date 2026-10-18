// Pure-logic tests. Run from the mobile/ directory with:
//   node --import tsx --test tests/*.test.ts
// (no Expo bootstrap required — these only touch lib/pure.ts)

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeTotals,
  lineTotal,
  relativeTime,
  VAT_RATE,
  PLATFORM_FEE_RATE,
} from '../lib/pure';

test('lineTotal multiplies by quantity for purchase lines', () => {
  assert.equal(lineTotal({ kind: 'purchase', quantity: 3, unitPrice: 10 }), 30);
});

test('lineTotal falls back to 1 day/hireDay when missing', () => {
  assert.equal(lineTotal({ kind: 'rental', quantity: 1, unitPrice: 50 }), 50);
  assert.equal(lineTotal({ kind: 'hiring', quantity: 1, unitPrice: 100 }), 100);
});

test('computeTotals applies KSA VAT and platform fee', () => {
  const t = computeTotals([{ kind: 'purchase', quantity: 2, unitPrice: 100 }]);
  // subtotal 200 → vat 30 → platform 4 → total 234
  assert.equal(t.subtotal, 200);
  assert.equal(t.vat, 30);
  assert.equal(t.platformFee, 4);
  assert.equal(t.total, 234);
});

test('computeTotals aggregates mixed line kinds', () => {
  const t = computeTotals([
    { kind: 'purchase', quantity: 2, unitPrice: 100 },
    { kind: 'rental', quantity: 1, days: 3, unitPrice: 50 },
  ]);
  // 200 + 150 = 350; VAT 52.5; platform 7; total 409.5
  assert.equal(t.subtotal, 350);
  assert.equal(t.vat, 52.5);
  assert.equal(t.platformFee, 7);
  assert.equal(t.total, 409.5);
});

test('VAT and platform constants match SRS', () => {
  assert.equal(VAT_RATE, 0.15);
  assert.equal(PLATFORM_FEE_RATE, 0.02);
});

test('relativeTime formats seconds/minutes/hours/days/absolute', () => {
  const now = Date.parse('2026-10-10T12:00:00Z');
  assert.equal(relativeTime(now - 30_000, now), 'now');
  assert.equal(relativeTime(now - 5 * 60_000, now), '5m');
  assert.equal(relativeTime(now - 3 * 3600_000, now), '3h');
  assert.equal(relativeTime(now - 2 * 86_400_000, now), '2d');
  assert.equal(relativeTime(Date.parse('2024-01-01T00:00:00Z'), now), '2024-01-01');
});
