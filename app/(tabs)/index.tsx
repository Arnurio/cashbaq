import { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Animated,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, CreditCard, Bell, Clock } from 'lucide-react-native';
import { getCards } from '../../lib/storage';
import { useData } from '../../lib/useData';
import { CATEGORIES, BRAND_COLOR, BG_COLOR } from '../../lib/constants';
import { getCardRate, getBestCard } from '../../lib/cashback';
import { UserCard } from '../../lib/types';
import { useStaggerAnim, fadeStyle, PressableScale, CARD_SHADOW } from '../../lib/animations';

export default function HomeScreen() {
  const [cards, setCards] = useState<UserCard[]>([]);
  const { banks, promos, loading } = useData();
  const router = useRouter();
  const anims = useStaggerAnim(5);

  useFocusEffect(
    useCallback(() => {
      getCards().then(setCards);
    }, [])
  );

  const bankMap = useMemo(() => new Map(banks.map((b) => [b.id, b])), [banks]);

  const maxRate = useMemo(() => cards.reduce((max, card) => {
    const bank = bankMap.get(card.bankId);
    if (!bank) return max;
    for (const cat of CATEGORIES) {
      const rate = getCardRate(card, bank, cat.id);
      if (rate > max) max = rate;
    }
    return max;
  }, 0), [cards, bankMap]);

  const totalLimit = useMemo(() => cards.reduce((sum, card) => {
    const bank = bankMap.get(card.bankId);
    return sum + (bank?.limits.monthly ?? 0);
  }, 0), [cards, bankMap]);

  const topCatRates = useMemo(() => CATEGORIES.map((cat) => {
    const best = getBestCard(cards, banks, cat.id);
    return { emoji: cat.emoji, rate: best?.rate ?? 0 };
  })
    .filter((c) => c.rate > 0)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3), [cards, banks]);

  const selectableBanks = useMemo(() => cards.filter((c) => {
    const bank = bankMap.get(c.bankId);
    return bank?.type === 'selectable' && c.selectedCategories.length === 0;
  }), [cards, bankMap]);

  if (loading && banks.length === 0) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <Animated.View style={fadeStyle(anims[0])}>
        <PressableScale onPress={() => router.push('/find')}>
          <LinearGradient
            colors={['#0D7C5F', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBtn}
          >
            <View style={styles.heroRow}>
              <View style={styles.heroLeft}>
                <Text style={styles.heroTitle}>Чем платить?</Text>
                <Text style={styles.heroSub}>
                  Найдите лучшую карту для любой покупки
                </Text>
              </View>
              <View style={styles.heroIconWrap}>
                <Search size={22} color="#FFFFFF" />
              </View>
            </View>
            {topCatRates.length > 0 && (
              <View style={styles.heroBadges}>
                {topCatRates.map((c, i) => (
                  <View key={i} style={styles.heroBadge}>
                    <Text style={styles.heroBadgeText}>
                      {c.emoji} {c.rate}%
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </LinearGradient>
        </PressableScale>
      </Animated.View>

      {/* Section Header */}
      <Animated.View style={[styles.sectionHeader, fadeStyle(anims[1])]}>
        <View style={styles.sectionLine} />
        <Text style={styles.sectionTitle}>🏦 Ваши карты</Text>
      </Animated.View>

      {cards.length === 0 ? (
        <Animated.View style={fadeStyle(anims[2])}>
          <PressableScale
            style={styles.emptyCard}
            onPress={() => router.push('/add-card')}
          >
            <CreditCard size={32} color="#9CA3AF" />
            <Text style={styles.emptyText}>Добавьте первую карту</Text>
          </PressableScale>
        </Animated.View>
      ) : (
        <>
          {/* Metrics */}
          <Animated.View style={[styles.metrics, fadeStyle(anims[2])]}>
            <View style={[styles.metricCard, CARD_SHADOW]}>
              <Text style={styles.metricValue}>{cards.length}</Text>
              <Text style={styles.metricLabel}>Карт</Text>
            </View>
            <View style={[styles.metricCard, CARD_SHADOW]}>
              <Text style={styles.metricValue}>{maxRate}%</Text>
              <Text style={styles.metricLabel}>Макс ставка</Text>
            </View>
            <View style={[styles.metricCard, CARD_SHADOW]}>
              <Text style={styles.metricValue}>
                {totalLimit >= 1000
                  ? `${Math.round(totalLimit / 1000)}K`
                  : totalLimit}
              </Text>
              <Text style={styles.metricLabel}>Лимит/мес</Text>
            </View>
          </Animated.View>

          {/* Bank Cards Scroll */}
          <Animated.View style={fadeStyle(anims[3])}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={cards}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.cardList}
              renderItem={({ item }) => {
                const bank = bankMap.get(item.bankId);
                if (!bank) return null;
                const bestRate = CATEGORIES.reduce((max, cat) => {
                  const r = getCardRate(item, bank, cat.id);
                  return r > max ? r : max;
                }, 0);
                return (
                  <PressableScale
                    onPress={() =>
                      router.push({
                        pathname: '/card-detail',
                        params: { cardId: item.id },
                      })
                    }
                  >
                    <LinearGradient
                      colors={bank.gradient as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardItem}
                    >
                      <View>
                        <Text style={styles.cardBank}>{bank.name}</Text>
                        <Text style={styles.cardName}>{item.name}</Text>
                      </View>
                      <View style={styles.cardBottom}>
                        <Text style={styles.cardMaxRate}>
                          до {bestRate}%
                        </Text>
                        {item.level && (
                          <View style={styles.levelBadge}>
                            <Text style={styles.levelText}>
                              {item.level.charAt(0).toUpperCase() +
                                item.level.slice(1)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  </PressableScale>
                );
              }}
            />

            <PressableScale
              style={styles.addMoreBtn}
              onPress={() => router.push('/add-card')}
            >
              <Text style={styles.addMoreText}>+ Добавить карту</Text>
            </PressableScale>
          </Animated.View>

          {/* Promos */}
          {promos.length > 0 && (
            <Animated.View style={fadeStyle(anims[4])}>
              <Text style={styles.promoSectionTitle}>Промо-акции</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={promos}
                keyExtractor={(item) => item.title}
                contentContainerStyle={styles.promoList}
                renderItem={({ item }) => {
                  const bank = bankMap.get(item.bankId);
                  const bankColor = bank?.color ?? BRAND_COLOR;
                  return (
                    <View
                      style={[
                        styles.promoCard,
                        CARD_SHADOW,
                        { borderLeftWidth: 3, borderLeftColor: bankColor },
                      ]}
                    >
                      {item.isNew && (
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>NEW</Text>
                        </View>
                      )}
                      <Text style={styles.promoEmoji}>{item.emoji}</Text>
                      <Text style={styles.promoTitle}>{item.title}</Text>
                      <Text style={styles.promoRate}>{item.rate}%</Text>
                      <Text style={styles.promoDesc}>{item.desc}</Text>
                      <View style={styles.promoDateRow}>
                        <Clock size={11} color="#9CA3AF" />
                        <Text style={styles.promoDate}>
                          до{' '}
                          {new Date(item.endDate).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </Text>
                      </View>
                    </View>
                  );
                }}
              />
            </Animated.View>
          )}
        </>
      )}

      {/* Category Reminder */}
      {selectableBanks.length > 0 && (
        <View style={styles.reminderBlock}>
          <Bell size={18} color="#F59E0B" />
          <Text style={styles.reminderText}>
            Не забудьте выбрать категории для{' '}
            {selectableBanks.map((c) => c.name).join(', ')}
          </Text>
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
    paddingTop: 60,
    paddingBottom: 32,
  },
  // Hero
  heroBtn: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroLeft: {
    flex: 1,
    marginRight: 12,
  },
  heroTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 14,
  },
  heroIconWrap: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroBadgeText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: 'Manrope_600SemiBold',
  },
  // Section
  sectionHeader: {
    marginBottom: 14,
  },
  sectionLine: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
    color: '#111827',
  },
  // Empty
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    color: '#9CA3AF',
  },
  // Metrics
  metrics: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  metricValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 22,
    color: BRAND_COLOR,
  },
  metricLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
  },
  // Cards
  cardList: {
    gap: 12,
    paddingVertical: 4,
  },
  cardItem: {
    width: 165,
    borderRadius: 16,
    padding: 16,
    height: 110,
    justifyContent: 'space-between',
  },
  cardBank: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  cardName: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
    marginTop: 2,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMaxRate: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  addMoreBtn: {
    marginTop: 14,
    alignItems: 'center',
  },
  addMoreText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: BRAND_COLOR,
  },
  // Promos
  promoSectionTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: '#111827',
    marginTop: 20,
    marginBottom: 10,
  },
  promoList: {
    gap: 12,
    paddingVertical: 4,
  },
  promoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: 185,
  },
  newBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  newBadgeText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  promoEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  promoTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: '#111827',
    marginBottom: 2,
  },
  promoRate: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 24,
    color: BRAND_COLOR,
    marginBottom: 4,
  },
  promoDesc: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  promoDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  promoDate: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: '#9CA3AF',
  },
  // Reminder
  reminderBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  reminderText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: '#92400E',
    flex: 1,
  },
});
