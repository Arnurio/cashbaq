import { useState, useCallback } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Plane, Shield, CreditCard } from 'lucide-react-native';

import { getCards } from '../../lib/storage';
import { useData } from '../../lib/useData';
import { CATEGORIES } from '../../lib/constants';
import { UserCard } from '../../lib/types';
import { useStaggerAnim, fadeStyle, PressableScale } from '../../lib/animations';
import { colors, spacing, radii, shadows } from '../../lib/theme';

import { Screen, Text, Section, EmptyState } from '../../components/ui';

export default function CardsScreen() {
  const [cards, setCards] = useState<UserCard[]>([]);
  const { banks, loading } = useData();
  const router = useRouter();
  const anims = useStaggerAnim(Math.max(cards.length + 2, 2));

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
      <Screen>
        <Text variant="body" color={colors.textSecondary} align="center">
          Загрузка...
        </Text>
      </Screen>
    );
  }

  if (cards.length === 0) {
    return (
      <Screen>
        <Animated.View style={fadeStyle(anims[0])}>
          <Text variant="h1" color={colors.textPrimary}>
            Мои карты
          </Text>
        </Animated.View>
        <Animated.View style={fadeStyle(anims[1])}>
          <EmptyState
            icon={CreditCard}
            title="Пока нет карт"
            subtitle="Добавь карты чтобы видеть лучшие ставки кэшбэка"
            ctaLabel="+ Добавить первую карту"
            onPress={() => router.push('/add-card')}
          />
        </Animated.View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Animated.View style={fadeStyle(anims[0])}>
        <Section
          title="Мои карты"
          subtitle={`${cards.length} ${cards.length === 1 ? 'карта' : 'карт'} в кошельке`}
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
          {cards.map((card, index) => {
            const bank = bankMap.get(card.bankId);
            if (!bank) return null;

            const selectedCatNames = card.selectedCategories
              .map((id) => CATEGORIES.find((c) => c.id === id))
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
                  <View style={[styles.cardOuter, shadows.md as object]}>
                    <LinearGradient
                      colors={bank.gradient as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardTop}
                    >
                      <Text
                        variant="bodySm"
                        color="rgba(255,255,255,0.7)"
                      >
                        {bank.name}
                      </Text>
                      <Text
                        variant="h2"
                        color={colors.textInverse}
                        style={styles.cardName}
                      >
                        {card.name}
                      </Text>
                      <View style={styles.badgeRow}>
                        {card.level && (
                          <View style={styles.badge}>
                            <Text variant="buttonSm" color={colors.textInverse}>
                              {getLevelLabel(card.level)}
                            </Text>
                          </View>
                        )}
                        {card.tier && (
                          <View style={styles.badge}>
                            <Text variant="buttonSm" color={colors.textInverse}>
                              {getTierLabel(card.tier)}
                            </Text>
                          </View>
                        )}
                        {card.useNfc && (
                          <View style={styles.badge}>
                            <Text variant="buttonSm" color={colors.textInverse}>
                              NFC
                            </Text>
                          </View>
                        )}
                      </View>
                    </LinearGradient>

                    <View style={styles.cardBottom}>
                      {selectedCatNames.length > 0 && (
                        <View style={styles.catBadges}>
                          {selectedCatNames.map((name, i) => (
                            <View key={i} style={styles.catBadge}>
                              <Text variant="buttonSm" color={colors.textPrimary}>
                                {name}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <View style={styles.featureRow}>
                        {bank.lounge && (
                          <View style={styles.feature}>
                            <Plane size={14} color={colors.brand} strokeWidth={2.2} />
                            <Text variant="buttonSm" color={colors.brand}>
                              Лаунж
                            </Text>
                          </View>
                        )}
                        {bank.insurance && (
                          <View style={styles.feature}>
                            <Shield size={14} color={colors.brand} strokeWidth={2.2} />
                            <Text variant="buttonSm" color={colors.brand}>
                              Страховка
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text variant="bodySm" color={colors.textSecondary}>
                        {bank.desc}
                      </Text>
                    </View>
                  </View>
                </PressableScale>
              </Animated.View>
            );
          })}
        </Section>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.brandSoft,
    borderRadius: radii.pill,
  },
  cardOuter: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
  },
  cardTop: {
    padding: spacing.xl,
  },
  cardName: {
    marginTop: 2,
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  cardBottom: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  catBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catBadge: {
    backgroundColor: colors.bgSubtle,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  featureRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
});
