import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowUp, Trash2, Settings } from 'lucide-react-native';
import { getCards, saveCards } from '../lib/storage';
import { useData } from '../lib/useData';
import { CATEGORIES, BRAND_COLOR, BG_COLOR, MARKET_COLOR } from '../lib/constants';
import { getCardRate, getMarketBestRate } from '../lib/cashback';
import { UserCard, Bank } from '../lib/types';

export default function CardDetailScreen() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const router = useRouter();
  const { banks, loading } = useData();
  const [cards, setCards] = useState<UserCard[]>([]);

  useFocusEffect(
    useCallback(() => {
      getCards().then(setCards);
    }, [])
  );

  const card = cards.find((c) => c.id === cardId);
  const bankMap = new Map(banks.map((b) => [b.id, b]));
  const bank = card ? bankMap.get(card.bankId) : null;

  if (!card || !bank) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  const rates = CATEGORIES.map((cat) => {
    const rate = getCardRate(card, bank, cat.id);
    const market = getMarketBestRate(banks, cat.id);
    const isBestInCategory = cards.every((otherCard) => {
      if (otherCard.id === card.id) return true;
      const otherBank = bankMap.get(otherCard.bankId);
      if (!otherBank) return true;
      return getCardRate(otherCard, otherBank, cat.id) <= rate;
    });

    return {
      category: cat,
      rate,
      marketRate: market?.rate ?? 0,
      marketBank: market?.bank.card ?? '',
      isBest: isBestInCategory && rate > 0,
      canImprove: market ? market.rate > rate : false,
    };
  }).sort((a, b) => b.rate - a.rate);

  const handleDelete = () => {
    Alert.alert(
      'Удалить карту?',
      `${bank.card} будет удалена из вашего списка`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            const updated = cards.filter((c) => c.id !== cardId);
            await saveCards(updated);
            router.back();
          },
        },
      ]
    );
  };

  const handleEditSettings = () => {
    // Navigate to add-card which serves as editor too
    // For simplicity, delete and re-add
    Alert.alert(
      'Изменить настройки',
      'Удалите текущую карту и добавьте заново с новыми настройками',
      [
        { text: 'Понятно', style: 'default' },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Mini Card */}
      <View style={[styles.miniCard, { backgroundColor: bank.gradient[0] }]}>
        <Text style={styles.miniBank}>{bank.name}</Text>
        <Text style={styles.miniName}>{card.name}</Text>
        <View style={styles.miniBadgeRow}>
          {card.level && (
            <Text style={styles.miniBadge}>
              {card.level.charAt(0).toUpperCase() + card.level.slice(1)}
            </Text>
          )}
          {card.useNfc && <Text style={styles.miniBadge}>NFC</Text>}
          {card.tier && <Text style={styles.miniBadge}>{card.tier}</Text>}
        </View>
      </View>

      {/* Edit Settings Button */}
      {(bank.type === 'selectable' || bank.type === 'leveled' || bank.type === 'subscription') && (
        <TouchableOpacity style={styles.editBtn} onPress={handleEditSettings}>
          <Settings size={18} color={BRAND_COLOR} />
          <Text style={styles.editBtnText}>Изменить настройки</Text>
        </TouchableOpacity>
      )}

      {/* Cashback Table */}
      <Text style={styles.tableTitle}>Кэшбэк по категориям</Text>

      {rates.map(({ category, rate, marketRate, marketBank, isBest, canImprove }) => (
        <View key={category.id} style={styles.tableRow}>
          <Text style={styles.rowEmoji}>{category.emoji}</Text>
          <View style={styles.rowInfo}>
            <View style={styles.rowNameRow}>
              <Text style={styles.rowName}>{category.name}</Text>
              {isBest && (
                <View style={styles.bestBadge}>
                  <Text style={styles.bestBadgeText}>ЛУЧШАЯ</Text>
                </View>
              )}
            </View>
            {canImprove && (
              <View style={styles.marketHint}>
                <ArrowUp size={12} color={MARKET_COLOR} />
                <Text style={styles.marketHintText}>
                  {marketBank} до {marketRate}%
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.rowRate, rate === 0 && styles.rowRateZero]}>
            {rate > 0 ? `${rate}%` : '—'}
          </Text>
        </View>
      ))}

      {/* Limits */}
      <View style={styles.limitsBlock}>
        <Text style={styles.limitsTitle}>Лимиты</Text>
        <View style={styles.limitRow}>
          <Text style={styles.limitLabel}>В месяц</Text>
          <Text style={styles.limitValue}>
            {bank.limits.monthly.toLocaleString('ru-RU')} ₸
          </Text>
        </View>
        {bank.limits.daily && (
          <View style={styles.limitRow}>
            <Text style={styles.limitLabel}>В день</Text>
            <Text style={styles.limitValue}>
              {bank.limits.daily.toLocaleString('ru-RU')} ₸
            </Text>
          </View>
        )}
      </View>

      {/* Delete */}
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Trash2 size={18} color="#EF4444" />
        <Text style={styles.deleteBtnText}>Удалить карту</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loading: {
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
  miniCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  miniBank: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  miniName: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 10,
  },
  miniBadgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  miniBadge: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BRAND_COLOR,
  },
  editBtnText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: BRAND_COLOR,
  },
  tableTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    color: '#111827',
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
  },
  rowEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  rowInfo: {
    flex: 1,
  },
  rowNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowName: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: '#111827',
  },
  bestBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  bestBadgeText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 9,
    color: BRAND_COLOR,
  },
  marketHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  marketHintText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    color: MARKET_COLOR,
  },
  rowRate: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    color: BRAND_COLOR,
  },
  rowRateZero: {
    color: '#D1D5DB',
  },
  limitsBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  limitsTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 10,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  limitLabel: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  limitValue: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: '#111827',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteBtnText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: '#EF4444',
  },
});
