import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getCards } from '../lib/storage';
import { useData } from '../lib/useData';
import { CATEGORIES, BRAND_COLOR, BG_COLOR } from '../lib/constants';
import { getBestCard, getCardRate } from '../lib/cashback';
import { UserCard } from '../lib/types';
import { useStaggerAnim, fadeStyle, PressableScale, CARD_SHADOW } from '../lib/animations';

export default function FindScreen() {
  const [cards, setCards] = useState<UserCard[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const { banks, promos, loading } = useData();
  const anims = useStaggerAnim(CATEGORIES.length + 2);

  useFocusEffect(
    useCallback(() => {
      getCards().then(setCards);
    }, [])
  );

  const bankMap = new Map(banks.map((b) => [b.id, b]));
  const selectedCategory = CATEGORIES.find((c) => c.id === selectedCat);
  const bestCard = selectedCat ? getBestCard(cards, banks, selectedCat) : null;
  const promo = selectedCat
    ? promos.find((p) => p.category === selectedCat)
    : null;

  const otherCards = selectedCat
    ? cards
        .map((card) => {
          const bank = bankMap.get(card.bankId);
          if (!bank) return null;
          const rate = getCardRate(card, bank, selectedCat);
          return { card, bank, rate };
        })
        .filter(
          (r): r is NonNullable<typeof r> =>
            r !== null && r.card.id !== bestCard?.card.id && r.rate > 0
        )
        .sort((a, b) => b.rate - a.rate)
    : [];

  if (loading && banks.length === 0) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Category List */}
      {CATEGORIES.map((cat, index) => {
        const userBest = getBestCard(cards, banks, cat.id);
        const isSelected = selectedCat === cat.id;
        const catColor = cat.color;

        return (
          <Animated.View
            key={cat.id}
            style={fadeStyle(anims[Math.min(index, anims.length - 1)])}
          >
            <PressableScale
              style={[
                styles.catRow,
                isSelected && styles.catRowActive,
              ]}
              onPress={() => setSelectedCat(isSelected ? null : cat.id)}
            >
              <View style={[styles.catIconWrap, { backgroundColor: catColor + '18' }]}>
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
              </View>
              <View style={styles.catInfo}>
                <Text style={styles.catName}>{cat.name}</Text>
                {userBest && (
                  <Text style={styles.catBankHint}>
                    {userBest.bank.name}
                  </Text>
                )}
              </View>
              <Text style={styles.catBestRate}>
                {userBest ? `${userBest.rate}%` : '—'}
              </Text>
            </PressableScale>
          </Animated.View>
        );
      })}

      {/* Selected Category Details */}
      {selectedCat && selectedCategory && (
        <View style={styles.details}>
          {/* Best User Card */}
          {bestCard && bestCard.rate > 0 ? (
            <LinearGradient
              colors={['#E6F7F1', '#D1F2E8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bestBlock}
            >
              <Text style={styles.bestLabel}>Ваша лучшая карта</Text>
              <View style={styles.bestPill}>
                <Text style={styles.bestPillText}>{bestCard.bank.card}</Text>
              </View>
              <Text style={styles.bestRate}>{bestCard.rate}%</Text>
              <Text style={styles.bestLimit}>
                Лимит: {bestCard.bank.limits.monthly.toLocaleString('ru-RU')} ₸/мес
              </Text>
            </LinearGradient>
          ) : (
            <View style={styles.noCardBlock}>
              <Text style={styles.noCardText}>
                У вас нет карты с кэшбэком в этой категории
              </Text>
            </View>
          )}

          {/* Promo */}
          {promo && (
            <View style={[styles.promoBlock, CARD_SHADOW]}>
              <Text style={styles.promoEmoji}>{promo.emoji}</Text>
              <View style={styles.promoInfo}>
                <Text style={styles.promoTitle}>{promo.title}</Text>
                <Text style={styles.promoDesc}>{promo.desc}</Text>
                <Text style={styles.promoDate}>
                  до{' '}
                  {new Date(promo.endDate).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                  })}
                </Text>
              </View>
              <Text style={styles.promoRate}>{promo.rate}%</Text>
            </View>
          )}

          {/* Other Cards */}
          {otherCards.length > 0 && (
            <View style={styles.otherSection}>
              <Text style={styles.otherTitle}>Другие ваши карты</Text>
              {otherCards.map(({ card, bank, rate }) => (
                <View key={card.id} style={[styles.otherRow, CARD_SHADOW]}>
                  <View
                    style={[styles.otherDot, { backgroundColor: bank.color }]}
                  />
                  <Text style={styles.otherName}>{bank.card}</Text>
                  <Text style={styles.otherRate}>{rate}%</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG_COLOR,
  },
  loadingText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 16,
    color: '#6B7280',
  },
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  // Category Rows
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#EDF2F7',
  },
  catRowActive: {
    borderColor: BRAND_COLOR,
    borderWidth: 2,
  },
  catIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  catEmoji: {
    fontSize: 22,
  },
  catInfo: {
    flex: 1,
  },
  catName: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: '#111827',
  },
  catBankHint: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  catBestRate: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 20,
    color: BRAND_COLOR,
  },
  // Details
  details: {
    marginTop: 8,
    gap: 12,
  },
  bestBlock: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  bestLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: '#065F46',
    marginBottom: 8,
  },
  bestPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 8,
  },
  bestPillText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: '#065F46',
  },
  bestRate: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 38,
    color: BRAND_COLOR,
  },
  bestLimit: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: '#065F46',
    marginTop: 6,
  },
  noCardBlock: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  noCardText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  // Promo
  promoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  promoEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  promoInfo: {
    flex: 1,
  },
  promoTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: '#111827',
  },
  promoDesc: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  promoDate: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  promoRate: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 24,
    color: BRAND_COLOR,
  },
  // Other Cards
  otherSection: {
    gap: 8,
  },
  otherTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: '#374151',
  },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
  },
  otherDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  otherName: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  otherRate: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: '#374151',
  },
});
