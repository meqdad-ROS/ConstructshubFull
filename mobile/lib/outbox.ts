// Offline outbox. Durable queue of pending mutations the user wants to make.
// Uses expo-sqlite so items survive app kills + reboots.
//
// Shape of a pending item:
//   { id, kind: "order.create" | "message.send" | ..., payload, attempts, createdAt }
//
// Drain policy:
//   - A single foreground drainer runs on `online` and on app foreground.
//   - FIFO, serial — never racing the server.
//   - 5 attempts max per item with exponential backoff capped at 30s.
//   - After 5 failures the item is marked `dead`; the UI surfaces it so the
//     user can retry or delete.

import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';
import { api, type ApiOptions } from './api';

export type OutboxKind =
  | 'order.create'
  | 'message.send'
  | 'bid.submit'
  | 'review.create'
  | 'trip.accept'
  | 'location.ping';

export type OutboxItem = {
  id: string;
  kind: OutboxKind;
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  body: unknown;
  attempts: number;
  createdAt: number;
  status: 'pending' | 'dead';
};

let dbInstance: SQLite.SQLiteDatabase | null = null;
async function db(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('constructhub-outbox.db');
    await dbInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS outbox (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        body TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending'
      );
      CREATE INDEX IF NOT EXISTS idx_outbox_status_created ON outbox(status, created_at);
    `);
  }
  return dbInstance;
}

function uid(): string {
  return `ob_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function enqueue(item: Omit<OutboxItem, 'id' | 'attempts' | 'createdAt' | 'status'>): Promise<string> {
  const row: OutboxItem = {
    id: uid(),
    attempts: 0,
    createdAt: Date.now(),
    status: 'pending',
    ...item,
  };
  const d = await db();
  await d.runAsync(
    'INSERT INTO outbox (id, kind, method, path, body, attempts, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    row.id,
    row.kind,
    row.method,
    row.path,
    JSON.stringify(row.body ?? null),
    row.attempts,
    row.createdAt,
    row.status
  );
  // Opportunistic drain. We don't await — mutation callers return immediately
  // and the drainer runs in the background.
  void drain();
  return row.id;
}

export async function pendingCount(): Promise<number> {
  const d = await db();
  const rows = (await d.getAllAsync<{ n: number }>(
    "SELECT COUNT(*) as n FROM outbox WHERE status = 'pending'"
  )) as unknown as Array<{ n: number }>;
  return rows[0]?.n ?? 0;
}

export async function list(): Promise<OutboxItem[]> {
  const d = await db();
  const rows = await d.getAllAsync<{
    id: string;
    kind: string;
    method: string;
    path: string;
    body: string;
    attempts: number;
    created_at: number;
    status: string;
  }>('SELECT * FROM outbox ORDER BY created_at ASC');
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind as OutboxKind,
    method: r.method as OutboxItem['method'],
    path: r.path,
    body: JSON.parse(r.body),
    attempts: r.attempts,
    createdAt: r.created_at,
    status: r.status as OutboxItem['status'],
  }));
}

export async function remove(id: string): Promise<void> {
  const d = await db();
  await d.runAsync('DELETE FROM outbox WHERE id = ?', id);
}

const MAX_ATTEMPTS = 5;
let draining = false;

export async function drain(): Promise<void> {
  if (draining) return;
  const net = await NetInfo.fetch();
  if (!net.isConnected) return;
  draining = true;
  try {
    while (true) {
      const d = await db();
      const [next] = await d.getAllAsync<{
        id: string;
        kind: string;
        method: string;
        path: string;
        body: string;
        attempts: number;
      }>(
        "SELECT * FROM outbox WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1"
      );
      if (!next) break;
      const body = JSON.parse(next.body);
      const init: ApiOptions = {
        method: next.method,
        body: body == null ? undefined : JSON.stringify(body),
      };
      try {
        await api(next.path, init);
        await d.runAsync('DELETE FROM outbox WHERE id = ?', next.id);
      } catch (err) {
        const nextAttempts = next.attempts + 1;
        if (nextAttempts >= MAX_ATTEMPTS) {
          await d.runAsync(
            "UPDATE outbox SET attempts = ?, status = 'dead' WHERE id = ?",
            nextAttempts,
            next.id
          );
          console.warn('[outbox.dead]', next.kind, err);
          continue;
        }
        await d.runAsync('UPDATE outbox SET attempts = ? WHERE id = ?', nextAttempts, next.id);
        const backoff = Math.min(1000 * 2 ** next.attempts, 30_000);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
  } finally {
    draining = false;
  }
}

/** Call from app bootstrap. Starts a network-change listener that drains on reconnect. */
export function startOutboxDrainer(): () => void {
  const unsub = NetInfo.addEventListener((state) => {
    if (state.isConnected) void drain();
  });
  // Opportunistic first drain
  void drain();
  return unsub;
}
