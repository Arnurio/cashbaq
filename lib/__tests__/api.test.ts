import { fetchBanks, fetchPromos, fetchTips } from '../api';

// ─── Мок Supabase клиента ────────────────────────────────
type MockResponse = { data: any; error: any };

const tableData: Record<string, MockResponse> = {};

jest.mock('../supabase', () => ({
  supabase: {
    from: (table: string) => {
      const baseResp = (): MockResponse => tableData[table] ?? { data: [], error: null };
      const builder: any = {
        select: () => builder,
        eq: () => builder,
        order: () => builder,
        in: () => builder,
        then: (resolve: (v: MockResponse) => void) => Promise.resolve(baseResp()).then(resolve),
      };
      return builder;
    },
  },
}));

// ─── Мок AsyncStorage (cache) ────────────────────────────
const cacheStore: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(async (k: string, v: string) => {
      cacheStore[k] = v;
    }),
    getItem: jest.fn(async (k: string) => cacheStore[k] ?? null),
  },
}));

beforeEach(() => {
  for (const k of Object.keys(tableData)) delete tableData[k];
  for (const k of Object.keys(cacheStore)) delete cacheStore[k];
});

// ─── fetchBanks: rateMeta parsing ───────────────────────

describe('fetchBanks rateMeta', () => {
  const baseBank = {
    id: 'kaspi',
    name: 'Kaspi',
    card_name: 'Kaspi Gold',
    color: '#E53935',
    bg_color: '#FFEBEE',
    gradient_start: '#E53935',
    gradient_end: '#C62828',
    type: 'fixed',
    description: 'desc',
    note: 'note',
    url: 'https://kaspi.kz',
    has_lounge: false,
    has_insurance: false,
    monthly_limit: 30000,
    daily_limit: null,
    config: {},
  };

  it('парсит updated_at и source_url в rateMeta', async () => {
    tableData.banks = { data: [baseBank], error: null };
    tableData.bank_rates = {
      data: [
        {
          bank_id: 'kaspi',
          category_id: 'grocery',
          rate: 1,
          updated_at: '2026-04-25T10:00:00.000Z',
          source_url: 'https://kaspi.kz/source',
        },
      ],
      error: null,
    };

    const banks = await fetchBanks();
    expect(banks).toHaveLength(1);
    expect(banks[0].rateMeta).toEqual({
      grocery: {
        updatedAt: '2026-04-25T10:00:00.000Z',
        sourceUrl: 'https://kaspi.kz/source',
        verifiedBy: 'ai_estimate',
        verifiedAt: undefined,
      },
    });
  });

  it('source_url=null преобразуется в undefined', async () => {
    tableData.banks = { data: [baseBank], error: null };
    tableData.bank_rates = {
      data: [
        {
          bank_id: 'kaspi',
          category_id: 'grocery',
          rate: 1,
          updated_at: '2026-04-25T10:00:00.000Z',
          source_url: null,
        },
      ],
      error: null,
    };

    const banks = await fetchBanks();
    expect(banks[0].rateMeta?.grocery.sourceUrl).toBeUndefined();
  });

  it('updated_at=null падает на текущую дату (не падает)', async () => {
    tableData.banks = { data: [baseBank], error: null };
    tableData.bank_rates = {
      data: [
        {
          bank_id: 'kaspi',
          category_id: 'grocery',
          rate: 1,
          updated_at: null,
          source_url: null,
        },
      ],
      error: null,
    };

    const banks = await fetchBanks();
    const updatedAt = banks[0].rateMeta?.grocery.updatedAt;
    expect(updatedAt).toBeDefined();
    // ISO 8601 формат
    expect(() => new Date(updatedAt!)).not.toThrow();
    expect(new Date(updatedAt!).toISOString()).toBe(updatedAt);
  });

  it('группирует rateMeta по bank_id и category_id', async () => {
    const halyk = { ...baseBank, id: 'halyk', name: 'Halyk', card_name: 'Halyk Bonus' };
    tableData.banks = { data: [baseBank, halyk], error: null };
    tableData.bank_rates = {
      data: [
        { bank_id: 'kaspi', category_id: 'grocery', rate: 1, updated_at: '2026-01-01T00:00:00Z', source_url: 'a' },
        { bank_id: 'kaspi', category_id: 'fuel', rate: 1, updated_at: '2026-02-01T00:00:00Z', source_url: 'b' },
        { bank_id: 'halyk', category_id: 'travel', rate: 7, updated_at: '2026-03-01T00:00:00Z', source_url: 'c' },
      ],
      error: null,
    };

    const banks = await fetchBanks();
    const kaspi = banks.find((b) => b.id === 'kaspi')!;
    const halykBank = banks.find((b) => b.id === 'halyk')!;

    expect(Object.keys(kaspi.rateMeta ?? {}).sort()).toEqual(['fuel', 'grocery']);
    expect(kaspi.rateMeta?.grocery.sourceUrl).toBe('a');
    expect(kaspi.rateMeta?.fuel.sourceUrl).toBe('b');
    expect(halykBank.rateMeta?.travel.sourceUrl).toBe('c');
    expect(halykBank.rateMeta?.grocery).toBeUndefined();
  });

  it('rateMeta пустой объект если у банка нет ставок', async () => {
    tableData.banks = { data: [baseBank], error: null };
    tableData.bank_rates = { data: [], error: null };

    const banks = await fetchBanks();
    expect(banks[0].rateMeta).toEqual({});
    expect(banks[0].baseRates).toEqual({});
  });

  it('бросает ошибку если Supabase вернул error по banks', async () => {
    tableData.banks = { data: null, error: new Error('connection lost') };
    tableData.bank_rates = { data: [], error: null };

    await expect(fetchBanks()).rejects.toBeTruthy();
  });

  it('бросает ошибку если Supabase вернул error по bank_rates', async () => {
    tableData.banks = { data: [baseBank], error: null };
    tableData.bank_rates = { data: null, error: new Error('rates table missing') };

    await expect(fetchBanks()).rejects.toBeTruthy();
  });

  it('пишет результат в AsyncStorage cache', async () => {
    tableData.banks = { data: [baseBank], error: null };
    tableData.bank_rates = {
      data: [{ bank_id: 'kaspi', category_id: 'grocery', rate: 1, updated_at: '2026-04-25T10:00:00Z', source_url: null }],
      error: null,
    };

    await fetchBanks();
    expect(cacheStore['cashbaq_cache_banks']).toBeDefined();
    const cached = JSON.parse(cacheStore['cashbaq_cache_banks']);
    expect(cached).toHaveLength(1);
    expect(cached[0].rateMeta.grocery.updatedAt).toBe('2026-04-25T10:00:00Z');
  });
});

// ─── fetchPromos ────────────────────────────────────────

describe('fetchPromos', () => {
  it('маппит promo строки и конвертирует rate в Number', async () => {
    tableData.promos = {
      data: [
        {
          bank_id: 'kaspi',
          title: 'Скидка',
          description: 'Описание',
          category_id: 'grocery',
          rate: '5.5',
          emoji: '🎉',
          end_date: '2026-12-31',
          is_new: true,
        },
      ],
      error: null,
    };

    const promos = await fetchPromos();
    expect(promos).toHaveLength(1);
    expect(promos[0]).toMatchObject({
      bankId: 'kaspi',
      title: 'Скидка',
      desc: 'Описание',
      category: 'grocery',
      rate: 5.5,
      emoji: '🎉',
      endDate: '2026-12-31',
      isNew: true,
    });
  });

  it('подставляет дефолты для null полей', async () => {
    tableData.promos = {
      data: [
        {
          bank_id: 'halyk',
          title: 'Промо',
          description: null,
          category_id: null,
          rate: 3,
          emoji: null,
          end_date: null,
          is_new: false,
        },
      ],
      error: null,
    };

    const promos = await fetchPromos();
    expect(promos[0]).toMatchObject({
      desc: '',
      category: '',
      emoji: '',
      endDate: '',
    });
  });
});

// ─── fetchTips ───────────────────────────────────────────

describe('fetchTips', () => {
  it('группирует tip_items по tip_id с правильным emoji fallback', async () => {
    tableData.tips = {
      data: [
        { id: 'tip1', icon: '💡', title: 'Совет 1' },
        { id: 'tip2', icon: '🎯', title: 'Совет 2' },
      ],
      error: null,
    };
    tableData.banks = {
      data: [
        { id: 'kaspi', is_active: true },
        { id: 'halyk', is_active: true },
      ],
      error: null,
    };
    tableData.tip_items = {
      data: [
        { tip_id: 'tip1', bank_id: 'kaspi', card_name: 'Kaspi Gold', description: 'Item A' },
        { tip_id: 'tip1', bank_id: null, card_name: null, description: 'Item B' },
        { tip_id: 'tip2', bank_id: 'halyk', card_name: 'Halyk Bonus', description: 'Item C' },
      ],
      error: null,
    };

    const tips = await fetchTips();
    expect(tips).toHaveLength(2);

    const tip1 = tips.find((t) => t.id === 'tip1')!;
    expect(tip1.title).toBe('Совет 1');
    expect(tip1.emoji).toBe('💡');
    expect(tip1.items).toHaveLength(2);
    expect(tip1.items[0].emoji).toBe('🏦'); // потому что card_name есть
    expect(tip1.items[1].emoji).toBe('💡'); // потому что card_name=null

    const tip2 = tips.find((t) => t.id === 'tip2')!;
    expect(tip2.items).toHaveLength(1);
    expect(tip2.items[0].bankId).toBe('halyk');
  });

  it('tip без items получает пустой массив', async () => {
    tableData.tips = {
      data: [{ id: 'tipX', icon: '🔥', title: 'Без items' }],
      error: null,
    };
    tableData.tip_items = { data: [], error: null };

    const tips = await fetchTips();
    expect(tips[0].items).toEqual([]);
  });
});
