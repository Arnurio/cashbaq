import { Bank, Promo, Tip } from './types';

// ВНИМАНИЕ: статический fallback. Используется только когда Supabase недоступен.
// Активные банки = Kaspi, Halyk, Freedom (личные счета владельца, ставки проверены).
// Forte, BCC, Bereke, Alatau City — деактивированы (см. STRATEGY.md, ревизия мая 2026).
// До появления A/B/C-источников эти банки не показываются в приложении.

export const BANKS: Bank[] = [
  {
    id: 'kaspi',
    name: 'Kaspi',
    card: 'Kaspi Gold',
    color: '#E53935',
    bg: '#FFEBEE',
    gradient: ['#E53935', '#C62828'],
    type: 'promo',
    desc: 'Кэшбэк только через промо-акции партнёров',
    note: 'Бонусы только в акциях Kaspi',
    url: 'https://kaspi.kz',
    lounge: false,
    insurance: false,
    limits: { monthly: 0 },
    config: {},
    baseRates: {},
  },
  {
    id: 'halyk',
    name: 'Halyk',
    card: 'Halyk Bonus',
    color: '#1B5E20',
    bg: '#E8F5E9',
    gradient: ['#2E7D32', '#1B5E20'],
    type: 'fixed',
    desc: 'Фиксированный кэшбэк, travel до 7%',
    note: 'Лучшая карта для путешествий',
    url: 'https://halykbank.kz',
    lounge: false,
    insurance: false,
    limits: { monthly: 50000 },
    config: {},
    baseRates: {
      grocery: 1,
      restaurants: 1,
      transport: 1,
      clothing: 1,
      entertainment: 1,
      fuel: 1,
      travel: 5,
      pharmacy: 1,
      online: 1,
      telecom: 1,
    },
  },
  {
    id: 'freedom',
    name: 'Freedom',
    card: 'Freedom Card',
    color: '#6A1B9A',
    bg: '#F3E5F5',
    gradient: ['#7B1FA2', '#6A1B9A'],
    type: 'leveled',
    desc: 'От 1% до 4% + бонус NFC до +2%',
    note: '4 уровня: чем больше тратишь, тем больше кэшбэк',
    url: 'https://freedomfinance.kz',
    lounge: true,
    insurance: true,
    limits: { monthly: 50000 },
    config: {
      levels: {
        standard: { base: 1, nfc: 0.5 },
        silver: { base: 2, nfc: 1 },
        gold: { base: 3, nfc: 1.5 },
        platinum: { base: 4, nfc: 2 },
      },
    },
    baseRates: {},
  },
];

export const PROMOS: Promo[] = [
  {
    bankId: 'halyk',
    title: 'Halyk × Sinooil',
    desc: '4% кэшбэк на АЗС Sinooil',
    category: 'fuel',
    rate: 4,
    emoji: '⛽',
    endDate: '2026-05-15',
    isNew: false,
  },
  {
    bankId: 'freedom',
    title: 'Freedom × Arbuz',
    desc: '26% кэшбэк в Arbuz',
    category: 'grocery',
    rate: 26,
    emoji: '🍉',
    endDate: '2026-05-31',
    isNew: true,
  },
];

export const TIPS: Tip[] = [
  {
    id: 'bonus-vs-cash',
    title: 'Бонусы vs деньги',
    emoji: '💡',
    items: [
      { text: 'Kaspi, Halyk — кэшбэк начисляется бонусами', emoji: '⭐' },
      { text: 'Freedom — реальные деньги на счёт', emoji: '💵' },
      { text: 'Бонусы могут сгореть, деньги — нет', emoji: '🔥' },
    ],
  },
  {
    id: 'cash-withdrawal',
    title: 'Снятие наличных',
    emoji: '🏧',
    items: [
      { text: 'Kaspi Gold — бесплатно в своих банкоматах', emoji: '✅' },
      { text: 'Freedom — бесплатно до 500 000 ₸/мес', emoji: '✅' },
    ],
  },
  {
    id: 'nfc',
    title: 'NFC-бонус',
    emoji: '📱',
    items: [
      { text: 'Freedom даёт +0.5–2% при оплате через NFC', emoji: '📶' },
      { text: 'Добавь карту в Apple/Google Pay', emoji: '💳' },
      { text: 'Бонус зависит от уровня: Standard +0.5%, Platinum +2%', emoji: '📊' },
    ],
  },
];
