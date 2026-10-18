// Last-resort React error boundary. Wraps the whole app in app/_layout.tsx so
// a mounted screen crash shows a friendly message instead of a white screen.
//
// Errors are captured locally; wire a Sentry/Bugsnag reporter inside
// `report()` when you add one.

import { Component, ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../lib/theme';

type State = { error: Error | null };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    // Always surface in dev; forward to telemetry in prod.
    console.error('[app.crash]', error);
    report(error).catch(() => undefined);
  }

  reset = (): void => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <View style={styles.wrap}>
        <Text style={typography.title}>Something went wrong</Text>
        <Text style={[typography.body, { textAlign: 'center' }]}>
          A screen crashed. We've logged it so we can fix it.
        </Text>
        <Text style={[typography.caption, { textAlign: 'center' }]} numberOfLines={4}>
          {error.message}
        </Text>
        <Pressable style={styles.btn} onPress={this.reset}>
          <Text style={{ color: colors.ink, fontWeight: '700' }}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

async function report(_err: Error): Promise<void> {
  // Hook for Sentry / Bugsnag / your own API. Deliberately async + swallowed.
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.ink,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  btn: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
});
