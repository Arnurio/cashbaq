import { Bank, UserCard } from './types';

/**
 * Возвращает ставку кэшбэка для конкретной карты в категории
 */
export function getCardRate(card: UserCard, bank: Bank, categoryId: string): number {
  switch (bank.type) {
    case 'fixed': {
      return bank.baseRates[categoryId] ?? 0;
    }

    case 'selectable': {
      const isSelected = card.selectedCategories.includes(categoryId);
      if (isSelected) {
        return bank.baseRates._selected ?? 0;
      }
      return bank.baseRates._default ?? 0;
    }

    case 'leveled': {
      const level = card.level ?? 'standard';
      const levelConfig = bank.config.levels?.[level];
      if (!levelConfig) return 0;
      const nfcBonus = card.useNfc ? levelConfig.nfc : 0;
      return levelConfig.base + nfcBonus;
    }

    case 'subscription': {
      const tier = card.tier ?? 'zero';
      return bank.config.tiers?.[tier] ?? 0;
    }

    default:
      return 0;
  }
}

export interface CardResult {
  card: UserCard;
  bank: Bank;
  rate: number;
}

/**
 * Находит лучшую карту пользователя для данной категории
 */
export function getBestCard(
  cards: UserCard[],
  banks: Bank[],
  categoryId: string
): CardResult | null {
  const bankMap = new Map(banks.map((b) => [b.id, b]));
  let best: CardResult | null = null;

  for (const card of cards) {
    const bank = bankMap.get(card.bankId);
    if (!bank) continue;

    const rate = getCardRate(card, bank, categoryId);
    if (!best || rate > best.rate) {
      best = { card, bank, rate };
    }
  }

  return best;
}

/**
 * Максимально возможный кэшбэк на рынке для категории
 * (без учёта карт пользователя — абсолютный максимум)
 */
export function getMarketBestRate(banks: Bank[], categoryId: string): CardResult | null {
  let best: CardResult | null = null;

  for (const bank of banks) {
    let rate = 0;

    switch (bank.type) {
      case 'fixed':
        rate = bank.baseRates[categoryId] ?? 0;
        break;

      case 'selectable':
        // Максимум если категория выбрана
        rate = bank.baseRates._selected ?? 0;
        break;

      case 'leveled': {
        // Максимальный уровень + NFC
        const platinum = bank.config.levels?.platinum;
        if (platinum) {
          rate = platinum.base + platinum.nfc;
        }
        break;
      }

      case 'subscription': {
        // Максимальный тариф
        const tiers = bank.config.tiers;
        if (tiers) {
          rate = Math.max(...Object.values(tiers));
        }
        break;
      }
    }

    if (rate > 0) {
      const dummyCard: UserCard = {
        id: `market_${bank.id}`,
        bankId: bank.id,
        name: bank.card,
        useNfc: true,
        selectedCategories: [categoryId],
        level: 'platinum',
        tier: 'max',
      };

      if (!best || rate > best.rate) {
        best = { card: dummyCard, bank, rate };
      }
    }
  }

  return best;
}
