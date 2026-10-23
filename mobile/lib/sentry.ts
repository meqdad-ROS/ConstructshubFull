// Sentry error tracking — env-gated via SENTRY_DSN.
// If no DSN is provided, this module exports no-ops.
// For React Native + Expo Router, we use @sentry/react-native.

import * as Sentry from '@sentry/react-native';

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  
  const dsn = process.env.SENTRY_DSN ?? process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    // No DSN — export no-ops below
    return;
  }

  try {
    Sentry.init({
      dsn,
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30_000,
      // Environment is set via NODE_ENV or SENTRY_ENVIRONMENT
      environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
      // Release tracking — uses expo-updates runtime version
      release: process.env.EXPO_PUBLIC_APP_VERSION ?? '0.1.0',
      // Don't send PII by default
      sendDefaultPii: false,
      // Attach stacktraces for better debugging
      attachStacktrace: true,
      // Sample rate for performance monitoring
      tracesSampleRate: 0.1,
      // BeforeSend hook to scrub sensitive data
      beforeSend(event) {
        // Remove sensitive fields from error context
        if (event.request) {
          const headers = event.request.headers ?? {};
          delete headers['authorization'];
          delete headers['cookie'];
          delete headers['x-request-id'];
        }
        // Remove user PII if present
        if (event.user) {
          const { email, ip_address, ...rest } = event.user as Record<string, unknown>;
          event.user = rest;
        }
        return event;
      },
      // Integrations
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

// No-op functions for when Sentry is not configured
function noop() {}

export const captureException = initialized ? Sentry.captureException : noop;
export const captureMessage = initialized ? Sentry.captureMessage : noop;
export const addBreadcrumb = initialized ? Sentry.addBreadcrumb : noop;
export const setUser = initialized ? Sentry.setUser : noop;
export const setTag = initialized ? Sentry.setTag : noop;
export const setContext = initialized ? Sentry.setContext : noop;
export const setExtra = initialized ? Sentry.setExtra : noop;

// Wrapper for async functions to capture errors
export function withSentry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: string
): T {
  if (!initialized) return fn;
  
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