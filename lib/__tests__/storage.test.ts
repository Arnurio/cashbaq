import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveCards, getCards, saveOnboarded, getOnboarded, clearAll } from '../storage';
import { UserCard } from '../types';

// jest-expo включает мок AsyncStorage автоматически,
// но мы подстрахуемся ручным моком
jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      setItem: jest.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
      getItem: jest.fn(async (key: string) => store[key] ?? null),
      multiRemove: jest.fn(async (keys: string[]) => {
        for (const key of keys) delete store[key];
      }),
      // Экспонируем store для очистки между тестами
      _store: store,
    },
  };
});

const getStore = () => (AsyncStorage as any)._store as Record<string, string>;

beforeEach(() => {
  jest.clearAllMocks();
  const store = getStore();
  for (const key of Object.keys(store)) delete store[key];
});

// ─── saveCards / getCards ───────────────────────────────────

describe('saveCards / getCards', () => {
  const testCards: UserCard[] = [
    {
      id: 'card1',
      bankId: 'kaspi',
      name: 'Kaspi Gold',
      useNfc: false,
      selectedCategories: [],
    },
    {
      id: 'card2',
      bankId: 'forte',
      name: 'ForteBlack',
      useNfc: false,
      selectedCategories: ['grocery', 'restaurants', 'fuel'],
    },
  ];

  it('сохраняет и загружает массив карт', async () => {
    await saveCards(testCards);
    const loaded = await getCards();
    expect(loaded).toEqual(testCards);
  });

  it('пустой массив сохраняется корректно', async () => {
    await saveCards([]);
    const loaded = await getCards();
    expect(loaded).toEqual([]);
  });

  it('getCards возвращает [] если ничего не сохранено', async () => {
    const loaded = await getCards();
    expect(loaded).toEqual([]);
  });

  it('перезаписывает предыдущие данные', async () => {
    await saveCards(testCards);
    const newCards: UserCard[] = [testCards[0]];
    await saveCards(newCards);
    const loaded = await getCards();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('card1');
  });
});

// ─── saveOnboarded / getOnboarded ──────────────────────────

describe('saveOnboarded / getOnboarded', () => {
  it('сохраняет true', async () => {
    await saveOnboarded(true);
    const result = await getOnboarded();
    expect(result).toBe(true);
  });

  it('сохраняет false', async () => {
    await saveOnboarded(false);
    const result = await getOnboarded();
    expect(result).toBe(false);
  });

  it('getOnboarded возвращает false если ничего не сохранено', async () => {
    const result = await getOnboarded();
    expect(result).toBe(false);
  });
});

// ─── clearAll ──────────────────────────────────────────────

describe('clearAll', () => {
  it('удаляет все данные', async () => {
    await saveCards([{
      id: 'c1',
      bankId: 'kaspi',
      name: 'Test',
      useNfc: false,
      selectedCategories: [],
    }]);
    await saveOnboarded(true);
    await clearAll();
    expect(await getCards()).toEqual([]);
    expect(await getOnboarded()).toBe(false);
  });
});

// ─── Обработка ошибок ──────────────────────────────────────

describe('обработка ошибок AsyncStorage', () => {
  it('getCards возвращает [] при ошибке', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    const result = await getCards();
    expect(result).toEqual([]);
  });

  it('getOnboarded возвращает false при ошибке', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    const result = await getOnboarded();
    expect(result).toBe(false);
  });

  it('saveCards не кидает ошибку при сбое', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    await expect(saveCards([])).resolves.toBeUndefined();
  });

  it('saveOnboarded не кидает ошибку при сбое', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    await expect(saveOnboarded(true)).resolves.toBeUndefined();
  });

  it('clearAll не кидает ошибку при сбое', async () => {
    (AsyncStorage.multiRemove as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    await expect(clearAll()).resolves.toBeUndefined();
  });
});
