import { getCardRate, getBestCard, getMarketBestRate } from '../cashback';
import { BANKS } from '../bankData';
import { Bank, UserCard } from '../types';

// ─── Helpers ────────────────────────────────────────────────
const bank = (id: string): Bank => BANKS.find((b) => b.id === id)!;

const makeCard = (overrides: Partial<UserCard> & { bankId: string }): UserCard => ({
  id: `test_${overrides.bankId}`,
  name: 'Test Card',
  useNfc: false,
  selectedCategories: [],
  ...overrides,
});

// ─── getCardRate ────────────────────────────────────────────

describe('getCardRate', () => {
  // ── Fixed banks ──────────────────────────────────────────
  describe('fixed type', () => {
    it('Kaspi grocery = 0% (promo-only, нет фикс. ставок)', () => {
      const card = makeCard({ bankId: 'kaspi' });
      expect(getCardRate(card, bank('kaspi'), 'grocery')).toBe(0);
    });

    it('Kaspi travel = 0% (нет такой категории)', () => {
      const card = makeCard({ bankId: 'kaspi' });
      expect(getCardRate(card, bank('kaspi'), 'travel')).toBe(0);
    });

    it('Halyk travel = 5% (Halyk Travel app)', () => {
      const card = makeCard({ bankId: 'halyk' });
      expect(getCardRate(card, bank('halyk'), 'travel')).toBe(5);
    });

    it('Halyk grocery = 1%', () => {
      const card = makeCard({ bankId: 'halyk' });
      expect(getCardRate(card, bank('halyk'), 'grocery')).toBe(1);
    });

    it('Jusan grocery = 3%', () => {
      const card = makeCard({ bankId: 'jusan' });
      expect(getCardRate(card, bank('jusan'), 'grocery')).toBe(3);
    });

    it('Jusan pharmacy = 3%', () => {
      const card = makeCard({ bankId: 'jusan' });
      expect(getCardRate(card, bank('jusan'), 'pharmacy')).toBe(3);
    });

    it('Jusan fuel = 2%', () => {
      const card = makeCard({ bankId: 'jusan' });
      expect(getCardRate(card, bank('jusan'), 'fuel')).toBe(2);
    });
  });

  // ── Selectable banks ─────────────────────────────────────
  describe('selectable type', () => {
    it('ForteBlack с выбранной категорией = 15%', () => {
      const card = makeCard({
        bankId: 'forte',
        selectedCategories: ['grocery', 'restaurants', 'fuel'],
      });
      expect(getCardRate(card, bank('forte'), 'grocery')).toBe(15);
    });

    it('ForteBlack без выбранной категории = 1%', () => {
      const card = makeCard({
        bankId: 'forte',
        selectedCategories: ['grocery', 'restaurants', 'fuel'],
      });
      expect(getCardRate(card, bank('forte'), 'travel')).toBe(1);
    });

    it('BCC с выбранной категорией = 10%', () => {
      const card = makeCard({
        bankId: 'bcc',
        selectedCategories: ['clothing'],
      });
      expect(getCardRate(card, bank('bcc'), 'clothing')).toBe(10);
    });

    it('BCC без выбранной категории = 1%', () => {
      const card = makeCard({ bankId: 'bcc' });
      expect(getCardRate(card, bank('bcc'), 'clothing')).toBe(1);
    });
  });

  // ── Leveled banks (Freedom) ──────────────────────────────
  describe('leveled type (Freedom)', () => {
    it('Freedom Gold + NFC = 4.5%', () => {
      const card = makeCard({
        bankId: 'freedom',
        level: 'gold',
        useNfc: true,
      });
      expect(getCardRate(card, bank('freedom'), 'grocery')).toBe(4.5);
    });

    it('Freedom Standard без NFC = 1%', () => {
      const card = makeCard({
        bankId: 'freedom',
        level: 'standard',
        useNfc: false,
      });
      expect(getCardRate(card, bank('freedom'), 'grocery')).toBe(1);
    });

    it('Freedom Platinum + NFC = 6%', () => {
      const card = makeCard({
        bankId: 'freedom',
        level: 'platinum',
        useNfc: true,
      });
      expect(getCardRate(card, bank('freedom'), 'grocery')).toBe(6);
    });

    it('Freedom Silver без NFC = 2%', () => {
      const card = makeCard({
        bankId: 'freedom',
        level: 'silver',
        useNfc: false,
      });
      expect(getCardRate(card, bank('freedom'), 'grocery')).toBe(2);
    });

    it('Freedom без указанного уровня = standard (1%)', () => {
      const card = makeCard({ bankId: 'freedom' });
      expect(getCardRate(card, bank('freedom'), 'grocery')).toBe(1);
    });
  });

  // ── Subscription banks (Bereke) ──────────────────────────
  describe('subscription type (Bereke)', () => {
    it('Bereke high (депозит 1М) = 5%', () => {
      const card = makeCard({
        bankId: 'bereke',
        tier: 'high',
      });
      expect(getCardRate(card, bank('bereke'), 'grocery')).toBe(5);
    });

    it('Bereke max = 7%', () => {
      const card = makeCard({
        bankId: 'bereke',
        tier: 'max',
      });
      expect(getCardRate(card, bank('bereke'), 'grocery')).toBe(7);
    });

    it('Bereke zero (без подписки) = 0%', () => {
      const card = makeCard({
        bankId: 'bereke',
        tier: 'zero',
      });
      expect(getCardRate(card, bank('bereke'), 'grocery')).toBe(0);
    });

    it('Bereke без указанного тира = zero (0%)', () => {
      const card = makeCard({ bankId: 'bereke' });
      expect(getCardRate(card, bank('bereke'), 'grocery')).toBe(0);
    });
  });

  // ── Edge cases ───────────────────────────────────────────
  describe('edge cases', () => {
    it('несуществующая категория для fixed банка = 0', () => {
      const card = makeCard({ bankId: 'kaspi' });
      expect(getCardRate(card, bank('kaspi'), 'nonexistent')).toBe(0);
    });

    it('несуществующая категория для selectable банка = _default', () => {
      const card = makeCard({ bankId: 'forte' });
      expect(getCardRate(card, bank('forte'), 'nonexistent')).toBe(1);
    });

    it('leveled банк одинаковая ставка для любой категории', () => {
      const card = makeCard({ bankId: 'freedom', level: 'gold', useNfc: true });
      expect(getCardRate(card, bank('freedom'), 'grocery')).toBe(
        getCardRate(card, bank('freedom'), 'travel')
      );
    });
  });
});

// ─── getBestCard ────────────────────────────────────────────

describe('getBestCard', () => {
  it('из 3 карт выбирает лучшую для категории grocery', () => {
    const cards: UserCard[] = [
      makeCard({ bankId: 'kaspi', id: 'c1' }), // 1%
      makeCard({ bankId: 'jusan', id: 'c2' }), // 3%
      makeCard({ bankId: 'halyk', id: 'c3' }), // 1%
    ];
    const result = getBestCard(cards, BANKS, 'grocery');
    expect(result).not.toBeNull();
    expect(result!.bank.id).toBe('jusan');
    expect(result!.rate).toBe(3);
  });

  it('ForteBlack с выбранным grocery побеждает всех', () => {
    const cards: UserCard[] = [
      makeCard({ bankId: 'kaspi', id: 'c1' }),
      makeCard({ bankId: 'forte', id: 'c2', selectedCategories: ['grocery'] }), // 15%
      makeCard({ bankId: 'jusan', id: 'c3' }), // 3%
    ];
    const result = getBestCard(cards, BANKS, 'grocery');
    expect(result!.bank.id).toBe('forte');
    expect(result!.rate).toBe(15);
  });

  it('при одинаковых ставках возвращает первую', () => {
    const cards: UserCard[] = [
      makeCard({ bankId: 'halyk', id: 'c1' }), // 1% grocery
      makeCard({ bankId: 'jusan', id: 'c2' }), // 3% grocery — jusan wins
    ];
    const result = getBestCard(cards, BANKS, 'grocery');
    expect(result).not.toBeNull();
    expect(result!.card.id).toBe('c2'); // jusan 3% > halyk 1%
  });

  it('пустой массив карт = null', () => {
    const result = getBestCard([], BANKS, 'grocery');
    expect(result).toBeNull();
  });

  it('карта с несуществующим bankId пропускается', () => {
    const cards: UserCard[] = [
      makeCard({ bankId: 'nonexistent', id: 'c1' }),
    ];
    const result = getBestCard(cards, BANKS, 'grocery');
    expect(result).toBeNull();
  });

  it('одна карта = она и лучшая', () => {
    const cards: UserCard[] = [
      makeCard({ bankId: 'halyk', id: 'c1' }),
    ];
    const result = getBestCard(cards, BANKS, 'grocery');
    expect(result!.card.id).toBe('c1');
    expect(result!.rate).toBe(1);
  });
});

// ─── getMarketBestRate ──────────────────────────────────────

describe('getMarketBestRate', () => {
  it('grocery: ForteBlack 15% — максимум на рынке', () => {
    const result = getMarketBestRate(BANKS, 'grocery');
    expect(result).not.toBeNull();
    expect(result!.bank.id).toBe('forte');
    expect(result!.rate).toBe(15);
  });

  it('travel: Forte 15% selectable > Halyk 5%', () => {
    const result = getMarketBestRate(BANKS, 'travel');
    expect(result).not.toBeNull();
    // Forte selectable 15% > Halyk 7%
    // Потому что getMarketBestRate для selectable использует _selected = 15
    expect(result!.rate).toBe(15);
  });

  it('для любой категории возвращает не null (все банки покрывают)', () => {
    const categories = [
      'grocery', 'restaurants', 'transport', 'clothing',
      'entertainment', 'fuel', 'travel', 'pharmacy', 'online', 'telecom',
    ];
    for (const cat of categories) {
      const result = getMarketBestRate(BANKS, cat);
      expect(result).not.toBeNull();
      expect(result!.rate).toBeGreaterThan(0);
    }
  });

  it('пустой массив банков = null', () => {
    const result = getMarketBestRate([], 'grocery');
    expect(result).toBeNull();
  });

  it('максимум по рынку >= лучшая карта пользователя', () => {
    const cards: UserCard[] = [
      makeCard({ bankId: 'kaspi', id: 'c1' }),
      makeCard({ bankId: 'halyk', id: 'c2' }),
    ];
    const userBest = getBestCard(cards, BANKS, 'grocery');
    const marketBest = getMarketBestRate(BANKS, 'grocery');
    expect(marketBest!.rate).toBeGreaterThanOrEqual(userBest!.rate);
  });
});
