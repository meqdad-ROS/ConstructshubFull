// Design tokens. Mirror of the web app's palette, per SRS §12.1 D-10 + D-14:
//   Primary brand = black + brown
//   Accents = CH-blue + CH-orange (yellow #f7b500)
//
// Everything in the mobile UI should read tokens from here. If you find a
// hard-coded hex code in a screen, pull it up to this file.

import { TextStyle } from 'react-native';

export const colors = {
  // Primary brand
  ink: '#0b1220',
  inkSoft: '#111827',
  paper: '#f7f7f7',
  paperDim: '#e2e8f0',

  // SRS §12.1 — brown
  brown: '#6B3F1D',
  brownSoft: '#8c5a35',

  // CH accents
  gold: '#f7b500',
  goldSoft: '#f4c843',
  blue: '#2563eb',
  blueSoft: '#60a5fa',

  // Semantic
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  dangerSoft: '#fecaca',
  muted: '#9aa3b2',
  mutedSoft: '#64748b',
  divider: '#1f2937',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 28, fontWeight: '700', color: colors.paper } satisfies TextStyle,
  title: { fontSize: 20, fontWeight: '700', color: colors.paper } satisfies TextStyle,
  subtitle: { fontSize: 16, fontWeight: '600', color: colors.paper } satisfies TextStyle,
  body: { fontSize: 15, fontWeight: '400', color: colors.paper } satisfies TextStyle,
  caption: { fontSize: 12, fontWeight: '400', color: colors.muted } satisfies TextStyle,
  label: { fontSize: 13, fontWeight: '600', color: colors.muted } satisfies TextStyle,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
} as const;

export type Palette = keyof typeof colors;
