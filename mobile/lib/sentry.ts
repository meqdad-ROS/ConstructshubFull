// Sentry error tracking — env-gated via SENTRY_DSN.
// If no DSN is provided, this module exports no-ops.
// For React Native + Expo Router, we use @sentry/react-native.

import * as Sentry from '@sentry/react-native';

let initialized = false;

export function scrubSentryEvent<
  T extends {
    request?: { headers?: Record<string, string> };
    user?: Record<string, unknown>;
  }
>(event: T): T {
  if (event.request?.headers) {
    const headers = { ...event.request.headers };
    delete headers['authorization'];
    delete headers['cookie'];
    delete headers['x-request-id'];
    event.request = { ...event.request, headers };
  }
  if (event.user) {
    const { email, ip_address, phone, iban, token, ...rest } = event.user;
    void email;
    void ip_address;
    void phone;
    void iban;
    void token;
    event.user = rest;
  }
  return event;
}

export function isSentryInitialized(): boolean {
  return initialized;
}

export function initSentry(): void {
  if (initialized) return;

  const dsn = process.env.SENTRY_DSN ?? process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  try {
    Sentry.init({
      dsn,
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30_000,
      environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
      release: process.env.EXPO_PUBLIC_APP_VERSION ?? '0.1.0',
      sendDefaultPii: false,
      attachStacktrace: true,
      tracesSampleRate: 0.1,
      beforeSend(event) {
        return scrubSentryEvent(event);
      },
      integrations: [
        Sentry.expoRouterIntegration(),
        Sentry.reactNativeTracingIntegration(),
      ],
    });
    initialized = true;
    console.log('[sentry] initialized');
  } catch (err) {
    console.warn('[sentry] init failed:', err);
  }
}

export function captureException(
  ...args: Parameters<typeof Sentry.captureException>
): string | undefined {
  if (!initialized) return undefined;
  return Sentry.captureException(...args);
}

export function captureMessage(
  ...args: Parameters<typeof Sentry.captureMessage>
): string | undefined {
  if (!initialized) return undefined;
  return Sentry.captureMessage(...args);
}

export function addBreadcrumb(
  ...args: Parameters<typeof Sentry.addBreadcrumb>
): void {
  if (!initialized) return;
  Sentry.addBreadcrumb(...args);
}

export function setUser(...args: Parameters<typeof Sentry.setUser>): void {
  if (!initialized) return;
  Sentry.setUser(...args);
}

export function setTag(...args: Parameters<typeof Sentry.setTag>): void {
  if (!initialized) return;
  Sentry.setTag(...args);
}

export function setContext(...args: Parameters<typeof Sentry.setContext>): void {
  if (!initialized) return;
  Sentry.setContext(...args);
}

export function setExtra(...args: Parameters<typeof Sentry.setExtra>): void {
  if (!initialized) return;
  Sentry.setExtra(...args);
}

// Wrapper for async functions to capture errors
export function withSentry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: string
): T {
  return (async (...args: unknown[]) => {
    try {
      return await fn(...args);
    } catch (err) {
      captureException(err, { extra: { context } });
      throw err;
    }
  }) as T;
}

// Hook for React components to capture errors
export function useSentry() {
  return {
    captureException,
    captureMessage,
    addBreadcrumb,
    setUser,
    setTag,
    setContext,
  };
}