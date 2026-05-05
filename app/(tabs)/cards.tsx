import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, CreditCard } from 'lucide-react-native';
import { getCards } from '../../lib/storage';
import { useData } from '../../lib/useData';
import { BRAND_COLOR, BG_COLOR } from '../../lib/constants';
import { UserCard } from '../../lib/types';
import { useStaggerAnim, fadeStyle, PressableScale, CARD_SHADOW } from '../../lib/animations';

export default function CardsScreen() {
  const [cards, setCards] = useState<UserCard[]>([]);
  const { banks, categories, loading } = useData();
  const router = useRouter();
  const anims = useStaggerAnim(20);

  useFocusEffect(
    useCallback(() => {
      getCards().then(setCards);
    }, [])
  );

  const bankMap = new Map(banks.map((b) => [b.id, b]));

  const getLevelLabel = (level?: string) => {
    if (!level) return null;
    const labels: Record<string, string> = {
      standard: 'Standard',
      silver: 'Silver',
      gold: 'Gold',
      platinum: 'Platinum',
    };
    return labels[level] ?? level;
  };

  const getTierLabel = (tier?: string) => {
    if (!tier) return null;
    const labels: Record<string, string> = {
      zero: '0%',
      basic: '1%',
      medium: '3%',
      high: '5%',
      max: '7%',
    };
    return labels[tier] ?? tier;
  };

  if (loading && banks.length === 0) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View style={fadeStyle(anims[0])}>
        <Text style={styles.header}>Мои карты</Text>
      </Animated.View>

      {cards.length === 0 && (
        <Animated.View style={fadeStyle(anims[1])}>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <CreditCard size={28} color={BRAND_COLOR} />
            </View>
            <Text style={styles.emptyTitle}>Карт пока нет</Text>
            <Text style={styles.emptySub}>
              Добавьте карты ваших банков — мы посчитаем максимальный кэшбэк по каждой покупке
            </Text>
          </View>
        </Animated.View>
      )}

      {cards.map((card, index) => {
        const bank = bankMap.get(card.bankId);
        if (!bank) return null;

        const selectedCatNames = card.selectedCategories
          .map((id) => categories.find((c) => c.id === id))
          .filter(Boolean)
          .map((c) => c!.emoji + ' ' + c!.name);

        return (
          <Animated.View
            key={card.id}
            style={fadeStyle(anims[Math.min(index + 1, anims.length - 1)])}
          >
            <PressableScale
              onPress={() =>
                router.push({
                  pathname: '/card-detail',
                  params: { cardId: card.id },
                })
              }
            >
              <View style={[styles.cardOuter, CARD_SHADOW]}>
                <LinearGradient
                  colors={bank.gradient as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardTop}
                >
                  <Text style={styles.cardBankName}>{bank.name}</Text>
                  <Text style={styles.cardCardName}>{card.name}</Text>

                  <View style={styles.badgeRow}>
                    {card.level && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {getLevelLabel(card.level)}
                        </Text>
                      </View>
                    )}
                    {card.tier && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {getTierLabel(card.tier)}
                        </Text>
                      </View>
                    )}
                    {card.useNfc && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>NFC</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>

                <View style={styles.cardBottom}>
                  {selectedCatNames.length > 0 && (
                    <View style={styles.catBadges}>
                      {selectedCatNames.map((name, i) => (
                        <View key={i} style={styles.catBadge}>
                          <Text style={styles.catBadgeText}>{name}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.featureRow}>
                    {bank.lounge && (
                      <View style={styles.feature}>
                        <Text style={styles.featureIcon}>✈️</Text>
                        <Text style={styles.featureText}>Лаунж</Text>
                      </View>
                    )}
                    {bank.insurance && (
                      <View style={styles.feature}>
                        <Text style={styles.featureIcon}>🛡</Text>
                        <Text style={styles.featureText}>Страховка</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.bankDesc}>{bank.desc}</Text>
                </View>
              </View>
            </PressableScale>
          </Animated.View>
        );
      })}

      <Animated.View
        style={fadeStyle(anims[Math.min(cards.length + 1, anims.length - 1)])}
      >
        <PressableScale
          style={styles.addBtn}
          onPress={() => router.push('/add-card')}
        >
          <Plus size={20} color={BRAND_COLOR} />
          <Text style={styles.addBtnText}>Добавить карту</Text>
        </PressableScale>
      </Animated.View>
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
    paddingTop: 60,
    paddingBottom: 32,
  },
  header: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 28,
    color: '#111827',
    marginBottom: 20,
  },
  cardOuter: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  cardTop: {
    padding: 20,
    paddingBottom: 18,
  },
  cardBankName: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  cardCardName: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  cardBottom: {
    padding: 16,
  },
  catBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  catBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  catBadgeText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: '#374151',
  },
  featureRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureIcon: {
    fontSize: 16,
  },
  featureText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: BRAND_COLOR,
  },
  bankDesc: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 6,
  },
  emptySub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: BRAND_COLOR,
    borderStyle: 'dashed',
  },
  addBtnText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    color: BRAND_COLOR,
  },
});
