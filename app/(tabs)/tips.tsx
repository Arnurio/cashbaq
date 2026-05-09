import { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Linking, Alert, Animated } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ExternalLink, BookOpen, ChevronDown } from 'lucide-react-native';

import { getCards, clearAll } from '../../lib/storage';
import { useData } from '../../lib/useData';
import { UserCard } from '../../lib/types';
import { useStaggerAnim, fadeStyle, PressableScale } from '../../lib/animations';
import { colors, spacing, radii, shadows } from '../../lib/theme';

import { Screen, Text, Card, EmptyState } from '../../components/ui';

type Filter = 'all' | 'mine';

export default function TipsScreen() {
  const [cards, setCards] = useState<UserCard[]>([]);
  const { banks, tips, loading } = useData();
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const router = useRouter();
  const anims = useStaggerAnim(Math.max(tips.length + 3, 3));

  // Arrow rotation animations
  const rotations = useRef<Record<string, Animated.Value>>({}).current;
  const getRotation = (id: string) => {
    if (!rotations[id]) rotations[id] = new Animated.Value(0);
    return rotations[id];
  };

  useFocusEffect(
    useCallback(() => {
      getCards().then(setCards);
    }, [])
  );

  const userBankIds = new Set(cards.map((c) => c.bankId));

  const toggleExpand = (id: string) => {
    const isExpanding = !expanded.has(id);
    Animated.timing(getRotation(id), {
      toValue: isExpanding ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();

    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filterItemsForUser = (items: typeof tips[0]['items']) => {
    if (cards.length === 0) return [];
    return items.filter((item) => !item.bankId || userBankIds.has(item.bankId));
  };

  const filteredTips =
    filter === 'all'
      ? tips
      : tips
          .map((t) => ({ ...t, items: filterItemsForUser(t.items) }))
          .filter((t) => t.items.length > 0);

  const isRelevant = (tip: typeof tips[0]) =>
    cards.length > 0 &&
    tip.items.some((item) => !item.bankId || userBankIds.has(item.bankId));

  const handleReset = () => {
    Alert.alert('Сбросить данные?', 'Карты и настройки будут удалены.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Сбросить',
        style: 'destructive',
        onPress: async () => {
          await clearAll();
          Alert.alert('Данные сброшены');
          router.replace('/onboarding');
        },
      },
    ]);
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

  return (
    <Screen>
      <Animated.View style={fadeStyle(anims[0])}>
        <Text variant="h1" color={colors.textPrimary}>
          Советы
        </Text>
        <Text variant="bodySm" color={colors.textSecondary} style={{ marginTop: 4 }}>
          Лайфхаки чтобы выжимать максимум из каждой карты
        </Text>
      </Animated.View>

      {/* Filter pills */}
      <Animated.View style={[styles.filterRow, fadeStyle(anims[1])]}>
        <FilterPill
          label="Все"
          active={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        <FilterPill
          label="Только мои"
          active={filter === 'mine'}
          onPress={() => setFilter('mine')}
        />
      </Animated.View>

      {/* Empty state when filter='mine' and no relevant tips */}
      {filteredTips.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={filter === 'mine' ? 'Нет советов под твои карты' : 'Советов пока нет'}
          subtitle={
            filter === 'mine'
              ? 'Добавь карты или переключись на «Все»'
              : 'Загляни позже'
          }
          ctaLabel={filter === 'mine' ? 'Показать все' : undefined}
          onPress={filter === 'mine' ? () => setFilter('all') : undefined}
        />
      ) : (
        filteredTips.map((tip, index) => {
          const isExpanded = expanded.has(tip.id);
          const isUserRelevant = isRelevant(tip);
          const rotation = getRotation(tip.id);
          const arrowRotate = rotation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '180deg'],
          });

          return (
            <Animated.View
              key={tip.id}
              style={fadeStyle(anims[Math.min(index + 2, anims.length - 1)])}
            >
              <Card variant="elevated" padding="lg">
                <PressableScale onPress={() => toggleExpand(tip.id)}>
                  <View style={styles.tipHeader}>
                    <View
                      style={[
                        styles.tipIconWrap,
                        {
                          backgroundColor: (tip as any).color
                            ? (tip as any).color + '18'
                            : colors.brandSoft,
                        },
                      ]}
                    >
                      <Text style={styles.tipEmoji}>{tip.emoji}</Text>
                    </View>
                    <View style={styles.tipTitleWrap}>
                      <Text variant="h3" color={colors.textPrimary}>
                        {tip.title}
                      </Text>
                    </View>
                    {isUserRelevant && (
                      <View style={styles.youHaveBadge}>
                        <Text
                          variant="buttonSm"
                          color={colors.brand}
                          style={styles.youHaveText}
                        >
                          У ВАС
                        </Text>
                      </View>
                    )}
                    <Animated.View
                      style={{ transform: [{ rotate: arrowRotate }] }}
                    >
                      <ChevronDown
                        size={18}
                        color={colors.textMuted}
                        strokeWidth={2.2}
                      />
                    </Animated.View>
                  </View>
                </PressableScale>

                {isExpanded && (
                  <View style={styles.tipBody}>
                    {tip.items.map((item, i) => (
                      <View key={i} style={styles.tipItem}>
                        <Text style={styles.tipItemEmoji}>{item.emoji}</Text>
                        <Text
                          variant="body"
                          color={colors.textPrimary}
                          style={styles.tipItemText}
                        >
                          {item.text}
                        </Text>
                      </View>
                    ))}

                    {(tip.id === 'lounge' || tip.id === 'insurance') && (
                      <View style={styles.ctaRow}>
                        {banks
                          .filter((b) =>
                            tip.id === 'lounge' ? b.lounge : b.insurance
                          )
                          .map((bank) => (
                            <PressableScale
                              key={bank.id}
                              style={styles.ctaBtn}
                              onPress={() => Linking.openURL(bank.url)}
                            >
                              <Text variant="buttonSm" color={colors.brand}>
                                {bank.name}
                              </Text>
                              <ExternalLink size={12} color={colors.brand} />
                            </PressableScale>
                          ))}
                      </View>
                    )}
                  </View>
                )}
              </Card>
            </Animated.View>
          );
        })
      )}

      <Animated.View
        style={fadeStyle(
          anims[Math.min(filteredTips.length + 2, anims.length - 1)]
        )}
      >
        <PressableScale style={styles.resetBtn} onPress={handleReset}>
          <Text variant="buttonSm" color={colors.textSecondary}>
            Сбросить данные
          </Text>
        </PressableScale>
      </Animated.View>
    </Screen>
  );
}

function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      style={[styles.filterPill, active && styles.filterPillActive]}
    >
      <Text
        variant="buttonSm"
        color={active ? colors.textInverse : colors.textPrimary}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tipIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipEmoji: {
    fontSize: 20,
  },
  tipTitleWrap: {
    flex: 1,
  },
  youHaveBadge: {
    backgroundColor: colors.brandSoft,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  youHaveText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  tipBody: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tipItemEmoji: {
    fontSize: 16,
    marginTop: 1,
  },
  tipItemText: {
    flex: 1,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  resetBtn: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.bgSubtle,
  },
});
