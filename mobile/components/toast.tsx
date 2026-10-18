// Minimal toast: single visible message at a time, auto-dismiss. Call
// `useToast().show('msg', { tone: 'danger' })` from any screen.

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../lib/theme';

type Tone = 'default' | 'success' | 'danger' | 'warning';
type Message = { text: string; tone: Tone };

type Ctx = { show: (text: string, opts?: { tone?: Tone; durationMs?: number }) => void };

const ToastCtx = createContext<Ctx>({ show: () => undefined });

export function useToast(): Ctx {
  return useContext(ToastCtx);
}

export function ToastHost({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<Message | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (text: string, opts: { tone?: Tone; durationMs?: number } = {}) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage({ text, tone: opts.tone ?? 'default' });
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
          setMessage(null);
        });
      }, opts.durationMs ?? 3500);
    },
    [opacity]
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      {message ? (
        <Animated.View pointerEvents="none" style={[styles.wrap, { opacity }]}>
          <View style={[styles.pill, palettes[message.tone]]}>
            <Text style={styles.text}>{message.text}</Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastCtx.Provider>
  );
}

const palettes: Record<Tone, { backgroundColor: string }> = {
  default: { backgroundColor: colors.inkSoft },
  success: { backgroundColor: '#064e3b' },
  danger: { backgroundColor: '#7f1d1d' },
  warning: { backgroundColor: '#78350f' },
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 72,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    maxWidth: '92%',
  },
  text: { color: colors.paper, fontSize: 14 },
});
