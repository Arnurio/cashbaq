export type BankType = 'fixed' | 'selectable' | 'leveled' | 'subscription' | 'promo';

export type FreedomLevel = 'standard' | 'silver' | 'gold' | 'platinum';
export type BerekeTier = 'zero' | 'basic' | 'medium' | 'high' | 'max';

export interface BankConfig {
  /** selectable: сколько категорий можно выбрать */
  maxCategories?: number;
  /** leveled: ставки по уровням */
  levels?: Record<FreedomLevel, { base: number; nfc: number }>;
  /** subscription: ставки по тарифам */
  tiers?: Record<BerekeTier, number>;
}

export type VerifiedBy = 'user' | 'community' | 'bank_site' | 'ai_estimate';

export interface RateMeta {
  /** ISO timestamp когда ставка была верифицирована */
  updatedAt: string;
  /** Ссылка на источник (страница банка) */
  sourceUrl?: string;
  /** Кто верифицировал ставку */
  verifiedBy: VerifiedBy;
  /** Дата верификации */
  verifiedAt?: string;
}

export interface Bank {
  id: string;
  name: string;
  card: string;
  color: string;
  bg: string;
  gradient: [string, string];
  type: BankType;
  desc: string;
  note: string;
  url: string;
  lounge: boolean;
  insurance: boolean;
  limits: {
    monthly: number;
    daily?: number;
  };
  config: BankConfig;
  /** Фиксированные ставки по категориям */
  baseRates: Record<string, number>;
  /** Метаданные по каждой ставке (когда обновлена + источник). Может отсутствовать в статическом fallback. */
  rateMeta?: Record<string, RateMeta>;
}

export interface UserCard {
  id: string;
  bankId: string;
  name: string;
  /** Freedom level */
  level?: FreedomLevel;
  /** NFC-оплата */
  useNfc: boolean;
  /** Bereke tier */
  tier?: BerekeTier;
  /** Выбранные категории (Forte, BCC) */
  selectedCategories: string[];
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  icon: string;
  color: string;
  places: string[];
}

export interface Promo {
  bankId: string;
  title: string;
  desc: string;
  category: string;
  rate: number;
  emoji: string;
  endDate: string;
  isNew: boolean;
}

export interface TipItem {
  text: string;
  emoji: string;
  bankId?: string;
}

export interface Tip {
  id: string;
  title: string;
  emoji: string;
  items: TipItem[];
}
