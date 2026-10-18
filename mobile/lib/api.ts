// API client. Wraps fetch with:
//   - Base URL from app.json → extra.apiBaseUrl
//   - Bearer-token injection from SecureStore
//   - Correlation ID header per request
//   - Typed error shape with status + message
//   - Timeouts (default 30s)
//   - Opt-in retry for GETs with exponential backoff
//
// Mutations call this directly through TanStack Query mutations. GETs use
// `useApiQuery` in lib/queries.ts.

import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

type Extra = { apiBaseUrl?: string };
const extra = (Constants.expoConfig?.extra ?? {}) as Extra;
export const API_BASE_URL = extra.apiBaseUrl ?? 'http://localhost:3000';

const TOKEN_KEY = 'constructhub.session.token';
const DEFAULT_TIMEOUT_MS = 30_000;

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function newRequestId(): Promise<string> {
  try {
    return await Crypto.randomUUID();
  } catch {
    // Fallback for environments without the crypto module.
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export type ApiOptions = RequestInit & {
  timeoutMs?: number;
  retries?: number; // for GETs; 0 by default
};

export async function api<T>(path: string, init: ApiOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = 0, ...rest } = init;
  const method = (rest.method ?? 'GET').toUpperCase();
  const retryable = method === 'GET' && retries > 0;
  let attempt = 0;
  let lastErr: unknown = null;

  while (attempt <= (retryable ? retries : 0)) {
    try {
      return await requestOnce<T>(path, rest, timeoutMs);
    } catch (err) {
      lastErr = err;
      // 5xx + network errors retried; 4xx fail fast.
      const status = err instanceof ApiError ? err.status : 0;
      const transient = status === 0 || (status >= 500 && status < 600);
      if (!retryable || !transient) break;
      const backoff = Math.min(1000 * 2 ** attempt, 4000);
      await new Promise((r) => setTimeout(r, backoff));
      attempt++;
    }
  }
  throw lastErr instanceof Error ? lastErr : new ApiError(0, 'request failed');
}

async function requestOnce<T>(path: string, init: RequestInit, timeoutMs: number): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  headers.set('X-Request-Id', await newRequestId());

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, signal: controller.signal });
  } catch (err) {
    throw new ApiError(0, err instanceof Error ? err.message : 'network error');
  } finally {
    clearTimeout(timer);
  }

  const raw = await res.text();
  const body = raw ? safeJson(raw) : undefined;
  if (!res.ok) {
    const message =
      (body as { error?: string } | undefined)?.error ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, message, body);
  }
  return body as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Upload helper — multipart for /api/search/* (ifc, document, image, voice). */
export async function apiUpload<T>(
  path: string,
  file: { uri: string; name: string; mime: string },
  extra?: Record<string, string>,
  fieldName = 'file'
): Promise<T> {
  const form = new FormData();
  // React Native FormData accepts { uri, name, type } polymorphically.
  form.append(fieldName, {
    uri: file.uri,
    name: file.name,
    type: file.mime,
  } as unknown as Blob);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) form.append(k, v);
  }
  return api<T>(path, { method: 'POST', body: form, timeoutMs: 180_000 });
}
