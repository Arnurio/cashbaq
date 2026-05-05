import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
  Animated as RNAnimated,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ExternalLink, Lightbulb } from 'lucide-react-native';
import { getCards, clearAll } from '../../lib/storage';
import { useData } from '../../lib/useData';
import { BRAND_COLOR, BG_COLOR } from '../../lib/constants';
import { UserCard } from '../../lib/types';
import { useStaggerAnim, fadeStyle, PressableScale, CARD_SHADOW } from '../../lib/animations';

type Filter = 'all' | 'mine';

export default function TipsScreen() {
  const [cards, setCards] = useState<UserCard[]>([]);
  const { banks, tips, loading } = useData();
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const router = useRouter();
  const anims = useStaggerAnim(tips.length + 3);

  // Arrow rotation animations
  const rotations = useRef<Record<string, RNAnimated.Value>>({}).current;
  const getRotation = (id: string) => {
    if (!rotations[id]) rotations[id] = new RNAnimated.Value(0);
    return rotations[id];
  };

  useFocusEffect(
    useCallback(() => {
      getCards().then(setCards);
    }, [])
  );

  const userBankIds = new Set(cards.map((c) => c.bankId));
  const bankMap = new Map(banks.map((b) => [b.id, b]));

  const toggleExpand = (id: string) => {
    const isExpanding = !expanded.has(id);
    RNAnimated.timing(getRotation(id), {
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
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Filter */}
      <RNAnimated.View style={[styles.filterRow, fadeStyle(anims[0])]}>
        <PressableScale
          style={[styles.filterBtn, filter === 'all' && styles.filterActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.filterTextActive,
            ]}
          >
            Все карты
          </Text>
        </PressableScale>
        <PressableScale
          style={[styles.filterBtn, filter === 'mine' && styles.filterActive]}
          onPress={() => setFilter('mine')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'mine' && styles.filterTextActive,
            ]}
          >
            Только мои
          </Text>
        </PressableScale>
      </RNAnimated.View>

      {filteredTips.length === 0 && (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <Lightbulb size={28} color={BRAND_COLOR} />
          </View>
          <Text style={styles.emptyTitle}>
            {filter === 'mine' && cards.length === 0
              ? 'Сначала добавьте карты'
              : 'Советов пока нет'}
          </Text>
          <Text style={styles.emptySub}>
            {filter === 'mine' && cards.length === 0
              ? 'В этом фильтре будут советы по вашим картам'
              : 'Загляните позже — мы добавим новые подборки'}
          </Text>
        </View>
      )}

      {filteredTips.map((tip, index) => {
        const isExpanded = expanded.has(tip.id);
        const isUserRelevant = isRelevant(tip);
        const rotation = getRotation(tip.id);
        const arrowRotate = rotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        });

        return (
          <RNAnimated.View
            key={tip.id}
            style={fadeStyle(anims[Math.min(index + 1, anims.length - 1)])}
          >
            <View style={[styles.tipCard, CARD_SHADOW]}>
              <PressableScale
                style={styles.tipHeader}
                onPress={() => toggleExpand(tip.id)}
              >
                <View
                  style={[
                    styles.tipIconWrap,
                    { backgroundColor: (tip as any).color ? (tip as any).color + '18' : '#E6F7F1' },
                  ]}
                >
                  <Text style={styles.tipEmoji}>{tip.emoji}</Text>
                </View>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                {isUserRelevant && (
                  <View style={styles.youHaveBadge}>
                    <Text style={styles.youHaveText}>У ВАС</Text>
                  </View>
                )}
                <RNAnimated.Text
                  style={[
                    styles.arrowIcon,
                    { transform: [{ rotate: arrowRotate }] },
                  ]}
                >
                  ▼
                </RNAnimated.Text>
              </PressableScale>

              {isExpanded && (
                <View style={styles.tipBody}>
                  {tip.items.map((item, i) => (
                    <View key={i} style={styles.tipItem}>
                      <Text style={styles.tipItemEmoji}>{item.emoji}</Text>
                      <Text style={styles.tipItemText}>{item.text}</Text>
                    </View>
                  ))}

                  {tip.id === 'lounge' && (
                    <View style={styles.ctaRow}>
                      {banks
                        .filter((b) => b.lounge)
                        .map((bank) => (
                          <PressableScale
                            key={bank.id}
                            style={styles.ctaBtn}
                            onPress={() => Linking.openURL(bank.url)}
                          >
                            <Text style={styles.ctaBtnText}>{bank.name}</Text>
                            <ExternalLink size={12} color={BRAND_COLOR} />
                          </PressableScale>
                        ))}
                    </View>
                  )}
                  {tip.id === 'insurance' && (
                    <View style={styles.ctaRow}>
                      {banks
                        .filter((b) => b.insurance)
                        .map((bank) => (
                          <PressableScale
                            key={bank.id}
                            style={styles.ctaBtn}
                            onPress={() => Linking.openURL(bank.url)}
                          >
                            <Text style={styles.ctaBtnText}>{bank.name}</Text>
                            <ExternalLink size={12} color={BRAND_COLOR} />
                          </PressableScale>
                        ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          </RNAnimated.View>
        );
      })}

      <RNAnimated.View
        style={fadeStyle(
          anims[Math.min(filteredTips.length + 1, anims.length - 1)]
        )}
      >
        <PressableScale style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetText}>Сбросить данные</Text>
        </PressableScale>
      </RNAnimated.View>
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
    paddingTop: 16,
    paddingBottom: 32,
  },
  // Filters
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterActive: {
    backgroundColor: BRAND_COLOR,
    borderColor: BRAND_COLOR,
  },
  filterText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: '#374151',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  // Tip Cards
  tipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  tipIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipEmoji: {
    fontSize: 20,
  },
  tipTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: '#111827',
    flex: 1,
  },
  youHaveBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 8,
  },
  youHaveText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    color: BRAND_COLOR,
    letterSpacing: 0.5,
  },
  arrowIcon: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  // Tip Body
  tipBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  tipItem: {
    flexDirection: 'row',
    gap: 10,
  },
  tipItemEmoji: {
    fontSize: 16,
    marginTop: 1,
  },
  tipItemText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: BRAND_COLOR,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  ctaBtnText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: BRAND_COLOR,
  },
  // Empty
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
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
  // Reset
  resetBtn: {
    alignSelf: 'center',
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
  },
  resetText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: '#6B7280',
  },
});
