/**
 * Prayas Prep — Design Tokens
 * Single source of truth for color, spacing, typography and elevation.
 * Import from here instead of hard-coding values in components so the
 * brand can be tuned in one place across JEE / NEET / EAMCET / Foundation.
 */
import '@/global.css';

import { Platform } from 'react-native';
export const colors = {
  // Backgrounds — deep navy / midnight
  background: '#0A0E1A',
  backgroundElevated: '#10162A',
  surface: '#141B2E',
  surfaceElevated: '#1B2440',
  surfaceHighlight: '#212B4D',

  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',

  // Text
  textPrimary: '#F7F9FC',
  textSecondary: '#A6AFC3',
  textTertiary: '#6B7488',
  textInverse: '#0A0E1A',

  // Brand
  primary: '#3B7CFF',        // primary action blue
  primaryDark: '#2C5FE0',
  primarySoft: 'rgba(59,124,255,0.14)',

  accent: '#7C6CFF',         // supporting indigo/purple
  accentSoft: 'rgba(124,108,255,0.14)',

  // Semantic
  success: '#2ECC8F',
  successSoft: 'rgba(46,204,143,0.14)',
  warning: '#F5A623',
  warningSoft: 'rgba(245,166,35,0.14)',
  danger: '#FF5C6C',
  dangerSoft: 'rgba(255,92,108,0.14)',

  // Gradients (used sparingly — hero header, streak badge, CTA)
  gradientPrimary: ['#3B7CFF', '#6C5CE7'] as const,
  gradientDark: ['#141B2E', '#0A0E1A'] as const,
  gradientGold: ['#F5A623', '#F0862B'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const typography = {
  display: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.4 },
  h1: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.2 },
  h2: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  micro: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.4 },
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
};
// ─────────────────────────────────────────────
// Backward compatibility with Expo starter code
// ─────────────────────────────────────────────

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#0B1020',
    backgroundElement: '#11182B',
    backgroundSelected: '#17213A',
    textSecondary: '#A8B2C5',
  },
} as const;

export type ThemeColor =
  keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset =
  Platform.select({ ios: 50, android: 80 }) ?? 0;

export const MaxContentWidth = 800;