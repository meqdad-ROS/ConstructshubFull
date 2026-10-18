// Shared UI primitives. Keep this file small — anything screen-specific lives
// in the screen itself.

import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '../lib/theme';

export function Screen({ children, padded = true }: { children: ReactNode; padded?: boolean }) {
  return (
    <View style={[{ flex: 1, backgroundColor: colors.ink }, padded && { padding: spacing.lg }]}>
      {children}
    </View>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={typography.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <Text style={[typography.subtitle, { marginTop: spacing.xs }]}>{children}</Text>;
}

export function Body({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <Text style={[typography.body, muted ? { color: colors.muted } : null]}>{children}</Text>
  );
}

export function Caption({ children }: { children: ReactNode }) {
  return <Text style={typography.caption}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}) {
  const palette = palettes[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: palette.bg, borderColor: palette.border },
        fullWidth && { alignSelf: 'stretch' },
        pressed && !inactive && { opacity: 0.85 },
        inactive && { opacity: 0.5 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon}
          <Text style={[typography.subtitle, { color: palette.fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label?: string; error?: string | null }) {
  const { label, error, style, ...rest } = props;
  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <Text style={typography.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.mutedSoft}
        style={[styles.input, error ? { borderColor: colors.danger } : null, style]}
        {...rest}
      />
      {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'gold';
export function StatusPill({ label, tone = 'default' }: { label: string; tone?: Tone }) {
  const map: Record<Tone, { bg: string; fg: string }> = {
    default: { bg: colors.inkSoft, fg: colors.muted },
    success: { bg: '#064e3b', fg: '#86efac' },
    warning: { bg: '#78350f', fg: '#fde68a' },
    danger: { bg: '#7f1d1d', fg: colors.dangerSoft },
    gold: { bg: colors.brown, fg: colors.gold },
  };
  const palette = map[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={{ color: palette.fg, fontSize: 11, fontWeight: '700', letterSpacing: 0.4 }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function Empty({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      {icon}
      <Text style={typography.subtitle}>{title}</Text>
      {hint ? (
        <Text style={[typography.caption, { textAlign: 'center' }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function Row({
  children,
  gap = spacing.sm,
  align = 'center',
}: {
  children: ReactNode;
  gap?: number;
  align?: 'center' | 'flex-start' | 'flex-end' | 'space-between';
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: align, gap }}>
      {children}
    </View>
  );
}

const palettes: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.gold, fg: colors.ink, border: colors.gold },
  secondary: { bg: colors.inkSoft, fg: colors.paper, border: colors.divider },
  ghost: { bg: 'transparent', fg: colors.paper, border: 'transparent' },
  danger: { bg: '#7f1d1d', fg: colors.dangerSoft, border: '#991b1b' },
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.inkSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
  },
  btn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.inkSoft,
    color: colors.paper,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
});
