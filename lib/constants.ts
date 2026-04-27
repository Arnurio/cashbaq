import { Category } from './types';

export const CATEGORIES: Category[] = [
  {
    id: 'grocery',
    name: 'Продукты',
    emoji: '🛒',
    icon: 'ShoppingCart',
    color: '#16A34A',
    places: ['Magnum', 'Small', 'Arbuz', 'Galmart'],
  },
  {
    id: 'restaurants',
    name: 'Кафе и рестораны',
    emoji: '🍽',
    icon: 'UtensilsCrossed',
    color: '#EA580C',
    places: ['Starbucks', 'Hardees', 'Burger King', 'Del Papa'],
  },
  {
    id: 'transport',
    name: 'Транспорт',
    emoji: '🚕',
    icon: 'Car',
    color: '#EAB308',
    places: ['Яндекс Go', 'InDrive', 'Bolt'],
  },
  {
    id: 'clothing',
    name: 'Одежда',
    emoji: '👗',
    icon: 'Shirt',
    color: '#A855F7',
    places: ['Zara', 'H&M', 'LC Waikiki', 'Bershka'],
  },
  {
    id: 'entertainment',
    name: 'Развлечения',
    emoji: '🎬',
    icon: 'Film',
    color: '#EC4899',
    places: ['Kinopark', 'Chaplin', 'Kino.kz'],
  },
  {
    id: 'fuel',
    name: 'АЗС',
    emoji: '⛽',
    icon: 'Fuel',
    color: '#64748B',
    places: ['KazMunayGas', 'Sinooil', 'Helios', 'Shell'],
  },
  {
    id: 'travel',
    name: 'Путешествия',
    emoji: '✈️',
    icon: 'Plane',
    color: '#0EA5E9',
    places: ['Aviata', 'Chocotravel', 'Booking'],
  },
  {
    id: 'pharmacy',
    name: 'Аптеки',
    emoji: '💊',
    icon: 'Pill',
    color: '#EF4444',
    places: ['Europharma', 'Bio Pharm', 'Alma'],
  },
  {
    id: 'online',
    name: 'Онлайн-покупки',
    emoji: '🌐',
    icon: 'Globe',
    color: '#6366F1',
    places: ['Kaspi Shop', 'Wildberries', 'Ozon', 'Alibaba'],
  },
  {
    id: 'telecom',
    name: 'Связь',
    emoji: '📱',
    icon: 'Smartphone',
    color: '#14B8A6',
    places: ['Kcell', 'Beeline', 'Tele2', 'Altel'],
  },
];

export const BRAND_COLOR = '#0D7C5F';
export const BG_COLOR = '#F6F8FA';
export const MARKET_COLOR = '#EA580C';

/**
 * Design tokens — single source of truth for the mobile UI.
 * Prefer these over hex literals / arbitrary numbers in StyleSheet.create.
 */
export const COLORS = {
  // brand
  brand:        '#0D7C5F',
  brandTint:    '#E6F5F0',
  // surface
  bg:           '#F6F8FA',
  surface:      '#FFFFFF',
  border:       '#E5E7EB',
  borderSubtle: '#F3F4F6',
  // text
  textPrimary:   '#111827',
  textSecondary: '#6B7280',
  textTertiary:  '#9CA3AF',
  textOnBrand:   '#FFFFFF',
  // semantic
  success:    '#16A34A',
  successBg:  '#DCFCE7',
  warning:    '#F59E0B',
  warningBg:  '#FEF3C7',
  warningText:'#92400E',
  error:      '#EF4444',
  errorBg:    '#FEE2E2',
  errorText:  '#991B1B',
  market:     '#EA580C', // distinct from category orange — "best on market" badges
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/**
 * Pre-baked typography styles. Spread directly into a Text style:
 *   <Text style={[TYPE.h1, { color: COLORS.textPrimary }]}>...</Text>
 */
export const TYPE = {
  h1:         { fontFamily: 'Manrope_700Bold',     fontSize: 24, lineHeight: 32 },
  h2:         { fontFamily: 'Manrope_700Bold',     fontSize: 18, lineHeight: 24 },
  h3:         { fontFamily: 'Manrope_600SemiBold', fontSize: 16, lineHeight: 22 },
  body:       { fontFamily: 'Manrope_400Regular',  fontSize: 14, lineHeight: 20 },
  bodyMedium: { fontFamily: 'Manrope_500Medium',   fontSize: 14, lineHeight: 20 },
  bodyBold:   { fontFamily: 'Manrope_600SemiBold', fontSize: 14, lineHeight: 20 },
  label:      { fontFamily: 'Manrope_600SemiBold', fontSize: 13, lineHeight: 18 },
  caption:    { fontFamily: 'Manrope_400Regular',  fontSize: 12, lineHeight: 16 },
  numLarge:   { fontFamily: 'Manrope_800ExtraBold', fontSize: 32, lineHeight: 38 },
} as const;

export const SHADOW = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;
