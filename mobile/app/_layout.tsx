import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { ErrorBoundary } from '../components/error-boundary';
import { ToastHost } from '../components/toast';
import { QueryProvider } from '../lib/query';
import { SessionCtx, useProvideSession } from '../lib/session';
import { initLocale } from '../lib/i18n';
import { requireBiometric } from '../lib/biometric';
import { startOutboxDrainer } from '../lib/outbox';
import { colors } from '../lib/theme';

const RELOCK_MS = 5 * 60_000;

export default function RootLayout() {
  const session = useProvideSession();
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const lastBackground = useRef<number | null>(null);
  const router = useRouter();

  // Bootstrap: locale, outbox drainer, biometric gate.
  useEffect(() => {
    let unsubOutbox: (() => void) | null = null;
    (async () => {
      await initLocale();
      unsubOutbox = startOutboxDrainer();
      if (await requireBiometric('Unlock ConstructsHub')) {
        setLocked(false);
      } else {
        setLocked(true);
      }
      setReady(true);
    })();
    return () => {
      if (unsubOutbox) unsubOutbox();
    };
  }, []);

  // Deep links. `constructhub://orders/abc` → push /orders/abc etc.
  useEffect(() => {
    const sub = Linking.addEventListener('url', (ev) => {
      const parsed = Linking.parse(ev.url);
      if (parsed.path) router.push(`/${parsed.path}`);
    });
    return () => sub.remove();
  }, [router]);

  // Re-lock when the app has been in background for > RELOCK_MS.
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      if (state === 'background' || state === 'inactive') {
        lastBackground.current = Date.now();
      } else if (state === 'active') {
        const away = lastBackground.current ? Date.now() - lastBackground.current : 0;
        if (away > RELOCK_MS) {
          if (!(await requireBiometric('Resume ConstructsHub'))) setLocked(true);
        }
      }
    });
    return () => sub.remove();
  }, []);

  const content = useMemo(() => {
    if (!ready) return null;
    return (
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.ink },
          headerTintColor: colors.paper,
          contentStyle: { backgroundColor: colors.ink },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ presentation: 'modal', title: 'Sign in' }} />
        <Stack.Screen name="product/[slug]" options={{ title: 'Product' }} />
        <Stack.Screen name="orders/[id]" options={{ title: 'Order' }} />
        <Stack.Screen name="messages/[threadId]" options={{ title: 'Chat' }} />
        <Stack.Screen name="tenders/[id]" options={{ title: 'Tender' }} />
        <Stack.Screen name="estimator" options={{ title: 'AI Estimator', presentation: 'modal' }} />
      </Stack>
    );
  }, [ready]);

  return (
    <ErrorBoundary>
      <SessionCtx.Provider value={session}>
        <QueryProvider>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <ToastHost>{locked ? null : content}</ToastHost>
          </SafeAreaProvider>
        </QueryProvider>
      </SessionCtx.Provider>
    </ErrorBoundary>
  );
}
