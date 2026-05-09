import { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Animated,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCard, Bell, Clock, Plus } from 'lucide-react-native';

import { getCards } from '../../lib/storage';
import { useData } from '../../lib/useData';
import { CATEGORIES } from '../../lib/constants';
import { getCardRate, getBestCard } from '../../lib/cashback';
import { UserCard } from '../../lib/types';
import { useStaggerAnim, fadeStyle, PressableScale } from '../../lib/animations';
import { colors, spacing, radii, shadows, typography } from '../../lib/theme';

import {
  Screen,
  Text,
  Card,
  Section,
  Hero,
  StatTiles,
  EmptyState,
} from '../../components/ui';

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

  const bankMap = new Map(banks.map((b) => [b.id, b]));

  const maxRate = cards.reduce((max, card) => {
    const bank = bankMap.get(card.bankId);
    if (!bank) return max;
    for (const cat of CATEGORIES) {
      const rate = getCardRate(card, bank, cat.id);
      if (rate > max) max = rate;
    }
    return max;
  }, 0);

  const totalLimit = cards.reduce((sum, card) => {
    const bank = bankMap.get(card.bankId);
    return sum + (bank?.limits.monthly ?? 0);
  }, 0);

  // Top 3 category rates for hero badges
  const topCatRates = CATEGORIES.map((cat) => {
    const best = getBestCard(cards, banks, cat.id);
    return { emoji: cat.emoji, rate: best?.rate ?? 0 };
  })
    .filter((c) => c.rate > 0)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3);

  const selectableBanks = cards.filter((c) => {
    const bank = bankMap.get(c.bankId);
    return bank?.type === 'selectable' && c.selectedCategories.length === 0;
  });

  if (loading && banks.length === 0) {
    return (
      <Screen>
        <Text variant="body" color={colors.textSecondary} align="center">
          Загрузка...
        </Text>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Hero — главный CTA */}
      <Animated.View style={fadeStyle(anims[0])}>
        <Hero
          title="Чем платить?"
          subtitle="Подскажу карту с лучшим кэшбэком за 2 тапа"
          onPress={() => router.push('/find')}
          badges={topCatRates.map((c) => ({
            emoji: c.emoji,
            label: `${c.rate}%`,
          }))}
        />
      </Animated.View>

      {/* Карты — empty state или контент */}
      {cards.length === 0 ? (
        <Animated.View style={fadeStyle(anims[1])}>
          <EmptyState
            icon={CreditCard}
            title="Добавь первую карту"
            subtitle="Cashbaq покажет лучшую карту для каждой покупки"
            ctaLabel="+ Добавить карту"
            onPress={() => router.push('/add-card')}
          />
        </Animated.View>
      ) : (
        <Animated.View style={[fadeStyle(anims[1]), styles.cardsBlock]}>
          {/* Метрики */}
          <StatTiles
            stats={[
              { value: cards.length, label: 'Карт' },
              { value: `${maxRate}%`, label: 'Макс ставка' },
              {
                value:
                  totalLimit >= 1000
                    ? `${Math.round(totalLimit / 1000)}K`
                    : totalLimit,
                label: 'Лимит/мес',
              },
            ]}
          />

          {/* Section: Карты */}
          <Section
            title="Твои карты"
            action={
              <PressableScale
                onPress={() => router.push('/add-card')}
                style={styles.actionPill}
              >
                <Plus size={14} color={colors.brand} strokeWidth={2.5} />
                <Text variant="buttonSm" color={colors.brand}>
                  Карту
                </Text>
              </PressableScale>
            }
          >
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={cards}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.hList}
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
                      style={styles.bankCard}
                    >
                      <View>
                        <Text
                          variant="bodySm"
                          color="rgba(255,255,255,0.7)"
                        >
                          {bank.name}
                        </Text>
                        <Text variant="h3" color={colors.textInverse}>
                          {item.name}
                        </Text>
                      </View>
                      <View style={styles.bankCardBottom}>
                        <Text
                          variant="h2"
                          color={colors.textInverse}
                          style={styles.bankRate}
                        >
                          до {bestRate}%
                        </Text>
                        {item.level && (
                          <View style={styles.levelBadge}>
                            <Text
                              variant="buttonSm"
                              color={colors.textInverse}
                            >
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
          </Section>
        </Animated.View>
      )}

      {/* Promos */}
      {promos.length > 0 && cards.length > 0 && (
        <Animated.View style={fadeStyle(anims[3])}>
          <Section title="Промо-акции" subtitle="Лови повышенный кэшбэк">
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={promos}
              keyExtractor={(item) => item.title}
              contentContainerStyle={styles.hList}
              renderItem={({ item }) => {
                const bank = bankMap.get(item.bankId);
                const bankColor = bank?.color ?? colors.brand;
                return (
                  <View style={styles.promoCardWrap}>
                    <Card
                      variant="elevated"
                      accentColor={bankColor}
                      padding="lg"
                      style={styles.promoCard}
                    >
                      {item.isNew && (
                        <View style={styles.newBadge}>
                          <Text
                            variant="buttonSm"
                            color={colors.textInverse}
                            style={styles.newBadgeText}
                          >
                            NEW
                          </Text>
                        </View>
                      )}
                      <Text style={styles.promoEmoji}>{item.emoji}</Text>
                      <Text variant="h3" color={colors.textPrimary}>
                        {item.title}
                      </Text>
                      <Text
                        variant="displayLg"
                        color={colors.brand}
                        style={styles.promoRate}
                      >
                        {item.rate}%
                      </Text>
                      <Text
                        variant="bodySm"
                        color={colors.textSecondary}
                        style={styles.promoDesc}
                        numberOfLines={2}
                      >
                        {item.desc}
                      </Text>
                      <View style={styles.promoDateRow}>
                        <Clock size={12} color={colors.textMuted} />
                        <Text variant="caption">
                          до{' '}
                          {new Date(item.endDate).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </Text>
                      </View>
                    </Card>
                  </View>
                );
              }}
            />
          </Section>
        </Animated.View>
      )}

      {/* Reminder для selectable банков */}
      {selectableBanks.length > 0 && (
        <Animated.View style={fadeStyle(anims[4])}>
          <View style={styles.reminder}>
            <Bell size={20} color={colors.warning} strokeWidth={2.2} />
            <Text
              variant="body"
              color={colors.warningText}
              style={styles.reminderText}
            >
              Не забудь выбрать категории для{' '}
              {selectableBanks.map((c) => c.name).join(', ')}
            </Text>
          </View>
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardsBlock: {
    gap: spacing.xl,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.brandSoft,
    borderRadius: radii.pill,
  },
  hList: {
    gap: spacing.md,
    paddingVertical: 4,
    paddingRight: spacing.lg,
  },
  bankCard: {
    width: 175,
    borderRadius: radii.lg,
    padding: spacing.lg,
    height: 120,
    justifyContent: 'space-between',
    ...(shadows.md as object),
  },
  bankCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankRate: {
    letterSpacing: -0.4,
  },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  promoCardWrap: {
    width: 200,
  },
  promoCard: {
    minHeight: 180,
  },
  newBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.danger,
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 1,
  },
  newBadgeText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  promoEmoji: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  promoRate: {
    marginVertical: 2,
    fontSize: 28,
    lineHeight: 32,
  },
  promoDesc: {
    marginBottom: spacing.sm,
  },
  promoDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 'auto',
  },
  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.warningBg,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  reminderText: {
    flex: 1,
  },
});
