import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const banks = [
  {
    id: 'kaspi',
    name: 'Kaspi Bank',
    card_name: 'Kaspi Gold',
    color: '#AA0000',
    gradient_start: '#E53935',
    gradient_end: '#B71C1C',
    bg_color: '#FFEBEE',
    type: 'fixed',
    description: 'Бонусы начисляются во время персональных акций, Kaspi Жума и при оплате QR у партнеров.',
    note: 'Кэшбэк в виде бонусов, 1 бонус = 1 тенге.',
    url: 'https://kaspi.kz',
    has_lounge: false,
    has_insurance: false,
    monthly_limit: 30000,
    daily_limit: null,
    config: { defaultCategories: [] }
  },
  {
    id: 'halyk',
    name: 'Halyk Bank',
    card_name: 'Halyk Card',
    color: '#006B4D',
    gradient_start: '#00845F',
    gradient_end: '#004C36',
    bg_color: '#E8F5E9',
    type: 'fixed',
    description: '1% бонусов сканированием Halyk QR и частые повышенные акции в приложении.',
    note: '1 бонус = 1 тенге.',
    url: 'https://halykbank.kz',
    has_lounge: false,
    has_insurance: false,
    monthly_limit: 50000,
    daily_limit: null,
    config: { defaultCategories: [{ id: 'all', rate: 1 }] }
  },
  {
    id: 'forte',
    name: 'Forte Bank',
    card_name: 'ForteBlack',
    color: '#1C1C1E',
    gradient_start: '#424242',
    gradient_end: '#212121',
    bg_color: '#F5F5F5',
    type: 'selectable',
    description: 'Выбор до 3-х любимых категорий каждый месяц с повышенным кэшбэком до 15%.',
    note: 'Кэшбэк настоящими деньгами.',
    url: 'https://forte.kz',
    has_lounge: false,
    has_insurance: false,
    monthly_limit: 50000,
    daily_limit: null,
    config: { selectableCount: 3, allCategories: ['supermarkets', 'restaurants', 'gas', 'pharmacy', 'clothes'] }
  },
  {
    id: 'bcc',
    name: 'Bank CenterCredit',
    card_name: '#картакарта',
    color: '#1E3A8A',
    gradient_start: '#1D4ED8',
    gradient_end: '#1E3A8A',
    bg_color: '#DBEAFE',
    type: 'selectable',
    description: 'Кэшбэк до 30% у партнеров и до 10% на любимые категории.',
    note: 'Выбор до 3-х категорий в приложении каждый месяц.',
    url: 'https://bcc.kz',
    has_lounge: false,
    has_insurance: false,
    monthly_limit: 40000,
    daily_limit: null,
    config: { selectableCount: 3, allCategories: ['supermarkets', 'restaurants', 'gas', 'pharmacy', 'clothes', 'health'] }
  },
  {
    id: 'freedom',
    name: 'Freedom Bank',
    card_name: 'Freedom Card',
    color: '#000000',
    gradient_start: '#1DCF9D',
    gradient_end: '#0B8A68',
    bg_color: '#E0F8F1',
    type: 'leveled',
    description: 'От 1% до 4% кэшбэка на всё. Дополнительно +2% за оплату через Apple Pay/Google Pay.',
    note: 'Процент зависит от уровня карты (стандарт, золото, премиум) и остатков.',
    url: 'https://bankffin.kz',
    has_lounge: false,
    has_insurance: false,
    monthly_limit: null,
    daily_limit: null,
    config: { defaultCategories: [{ id: 'all', rate: 1 }] }
  },
  {
    id: 'bereke',
    name: 'Bereke Bank',
    card_name: 'B-Card',
    color: '#04A05D',
    gradient_start: '#05C070',
    gradient_end: '#03804A',
    bg_color: '#E8F5E9',
    type: 'fixed',
    description: 'Гарантированный кэшбэк до 7% в зависимости от суммы депозита.',
    note: 'Кэшбэк переводится в тенге.',
    url: 'https://berekebank.kz',
    has_lounge: false,
    has_insurance: false,
    monthly_limit: 50000,
    daily_limit: null,
    config: {}
  },
  {
    id: 'jusan',
    name: 'Jusan Bank',
    card_name: 'Jusan Card',
    color: '#FF6200',
    gradient_start: '#FF8A33',
    gradient_end: '#CC4E00',
    bg_color: '#FFF3E0',
    type: 'fixed',
    description: 'Кэшбэк до 15%. Постоянные бонусы бонус: 3% продукты, 3% кафе, 2% АЗС.',
    note: 'Для получения макс уровня нужны покупки на определенную сумму.',
    url: 'https://jusan.kz',
    has_lounge: false,
    has_insurance: false,
    monthly_limit: 35000,
    daily_limit: null,
    config: { defaultCategories: [{ id: 'supermarkets', rate: 3 }, { id: 'restaurants', rate: 3 }, { id: 'gas', rate: 2 }, {id: 'pharmacy', rate: 3}] }
  }
];

const bankRates = [
  { bank_id: 'jusan', category_id: 'supermarkets', rate: 3.00 },
  { bank_id: 'jusan', category_id: 'restaurants', rate: 3.00 },
  { bank_id: 'jusan', category_id: 'gas', rate: 2.00 },
  { bank_id: 'jusan', category_id: 'pharmacy', rate: 3.00 },
  { bank_id: 'halyk', category_id: 'all', rate: 1.00 },
  { bank_id: 'freedom', category_id: 'all', rate: 1.00 },
  { bank_id: 'bereke', category_id: 'all', rate: 1.50 }
];

async function seed() {
  console.log('Clearing existing banks...');
  await supabase.from('bank_rates').delete().neq('bank_id', 'none');
  await supabase.from('banks').delete().neq('id', 'none');

  console.log('Inserting banks...');
  const { error: banksError } = await supabase.from('banks').insert(banks);
  if (banksError) {
    console.error('Error inserting banks:', banksError);
    return;
  }
  
  console.log('Inserting bank rates...');
  const { error: ratesError } = await supabase.from('bank_rates').insert(bankRates);
  if (ratesError) {
    console.error('Error inserting rates:', ratesError);
  } else {
    console.log('Database seeded successfully with Kazakhstan banks');
  }
}

seed();
