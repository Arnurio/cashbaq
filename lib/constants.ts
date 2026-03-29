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
