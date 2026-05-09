/**
 * Cashbaq Design System
 *
 * Единый источник стилей для всего приложения.
 * Используй tokens отсюда вместо hardcoded значений.
 */

import { Platform } from 'react-native';

// ============================================================
// COLORS
// ============================================================

export const colors = {
  // Brand
  brand: '#0D7C5F',
  brandSoft: '#E8F5F0',
  brandDark: '#085440',

  // Accent (для AI-фич, виральных моментов)
  accent: '#7C3AED', // фиолетовый — Cleo-feel для AI-инсайтов
  accentSoft: '#F3EEFF',

  // Backgrounds
  bg: '#FBFBFD',           // основной фон (мягче чем F6F8FA)
  bgElevated: '#FFFFFF',   // карточки
  bgSubtle: '#F4F5F7',     // input backgrounds, dividers fill

  // Text
  textPrimary: '#0F172A',  // почти чёрный
  textSecondary: '#64748B', // серо-синий
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',
  warningText: '#92400E',
  danger: '#EF4444',
  info: '#3B82F6',

  // Lines
  border: '#E5E7EB',
  borderSoft: '#F1F5F9',
  divider: '#EEF1F5',
} as const;

// ============================================================
// GRADIENTS (используются с expo-linear-gradient)
// ============================================================

export const gradients = {
  brand: ['#0D7C5F', '#10B981'] as [string, string],
  brandDeep: ['#0D7C5F', '#085440'] as [string, string],
  accent: ['#7C3AED', '#A855F7'] as [string, string],
  hero: ['#0F8268', '#1AAB7C'] as [string, string],
  sunset: ['#F97316', '#EAB308'] as [string, string],
} as const;

// ============================================================
// SPACING (4-pt grid)
// ============================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
} as const;

// ============================================================
// RADII
// ============================================================

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  pill: 999,
} as const;

// ============================================================
// TYPOGRAPHY
// ============================================================

export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
} as const;

export const typography = {
  // Display — для hero, шок-цифр
  displayXl: { fontFamily: fonts.extrabold, fontSize: 40, lineHeight: 44, letterSpacing: -1 },
  displayLg: { fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },

  // Headings
  h1: { fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 32, letterSpacing: -0.4 },
  h2: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  h3: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22 },

  // Body
  bodyLg: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  bodySm: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },

  // UI
  label: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 16, letterSpacing: 0.2 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.textMuted },
  button: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
  buttonSm: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 16 },
} as const;

// ============================================================
// SHADOWS
// ============================================================

export const shadows = {
  none: {},
  sm: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    android: { elevation: 1 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
    },
    android: { elevation: 3 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
    },
    android: { elevation: 6 },
    default: {},
  }),
  brand: Platform.select({
    ios: {
      shadowColor: '#0D7C5F',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
    },
    android: { elevation: 6 },
    default: {},
  }),
} as const;

// ============================================================
// LAYOUT
// ============================================================

export const layout = {
  screenPadding: spacing.lg,        // 16
  screenPaddingTop: spacing['3xl'], // 32 — добавляется к safe area inset
  sectionGap: spacing['2xl'],       // 24 между секциями
  cardGap: spacing.md,              // 12 между карточками в ряду
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
} as const;

// ============================================================
// EXPORT default object для удобства
// ============================================================

export const theme = {
  colors,
  gradients,
  spacing,
  radii,
  fonts,
  typography,
  shadows,
  layout,
} as const;

export default theme;
