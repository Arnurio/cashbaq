import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowUp, Trash2, Settings, ExternalLink, Clock, Flag } from 'lucide-react-native';
import { getCards, saveCards } from '../lib/storage';
import { useData } from '../lib/useData';
import { BRAND_COLOR, BG_COLOR, MARKET_COLOR } from '../lib/constants';
import { getCardRate, getMarketBestRate } from '../lib/cashback';
import { UserCard, Bank } from '../lib/types';
import ReportInaccuracyModal from '../components/ReportInaccuracyModal';

function formatRelative(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 1) return 'сегодня';
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн. назад`;
  if (days < 30) return `${Math.floor(days / 7)} нед. назад`;
  if (days < 365) return `${Math.floor(days / 30)} мес. назад`;
  return `${Math.floor(days / 365)} г. назад`;
}

export default function CardDetailScreen() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const router = useRouter();
  const { banks, categories, loading } = useData();
  const [cards, setCards] = useState<UserCard[]>([]);
  const [reportTarget, setReportTarget] = useState<{
    categoryId: string;
    categoryName: string;
    currentRate: number;
  } | null>(null);
  const [reportThanks, setReportThanks] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getCards().then(setCards);
    }, [])
  );

  const card = cards.find((c) => c.id === cardId);
  const bankMap = new Map(banks.map((b) => [b.id, b]));
  const bank = card ? bankMap.get(card.bankId) : null;

  if (cards.length > 0 && (!card || !bank)) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Карта не найдена</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!card || !bank) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  const rates = categories.map((cat) => {
    const rate = getCardRate(card, bank, cat.id);
    const market = getMarketBestRate(banks, cat.id);
    const isBestInCategory = cards.every((otherCard) => {
      if (otherCard.id === card.id) return true;
      const otherBank = bankMap.get(otherCard.bankId);
      if (!otherBank) return true;
      return getCardRate(otherCard, otherBank, cat.id) <= rate;
    });
    const meta = bank.rateMeta?.[cat.id];

    return {
      category: cat,
      rate,
      marketRate: market?.rate ?? 0,
      marketBank: market?.bank.card ?? '',
      isBest: isBestInCategory && rate > 0,
      canImprove: market ? market.rate > rate : false,
      sourceUrl: meta?.sourceUrl,
      updatedAt: meta?.updatedAt,
      verifiedBy: meta?.verifiedBy ?? 'ai_estimate',
    };
  }).sort((a, b) => b.rate - a.rate);

  // Самая свежая дата обновления среди всех ставок этого банка
  const freshestUpdate = bank.rateMeta
    ? Object.values(bank.rateMeta)
        .map((m) => m.updatedAt)
        .filter(Boolean)
        .sort()
        .reverse()[0]
    : undefined;

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
      <View style={styles.tableHeader}>
        <Text style={styles.tableTitle}>Кэшбэк по категориям</Text>
        {freshestUpdate && (
          <View style={styles.freshness}>
            <Clock size={11} color="#9CA3AF" />
            <Text style={styles.freshnessText}>
              Обновлено: {formatRelative(freshestUpdate)}
            </Text>
          </View>
        )}
      </View>

      {rates.map(({ category, rate, marketRate, marketBank, isBest, canImprove, sourceUrl, verifiedBy }) => (
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
              {(verifiedBy === 'user' || verifiedBy === 'bank_site') ? (
                <TouchableOpacity
                  onPress={sourceUrl ? () => Linking.openURL(sourceUrl).catch(() => {}) : undefined}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.verifiedBadge}
                >
                  <Text style={styles.verifiedBadgeText}>✓</Text>
                  {sourceUrl && <ExternalLink size={10} color="#16A34A" />}
                </TouchableOpacity>
              ) : (
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>AI</Text>
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
            <TouchableOpacity
              onPress={() =>
                setReportTarget({
                  categoryId: category.id,
                  categoryName: category.name,
                  currentRate: rate,
                })
              }
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={styles.reportLinkRow}
            >
              <Flag size={10} color="#9CA3AF" />
              <Text style={styles.reportLinkText}>Сообщить о неточности</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.rowRate, rate === 0 && styles.rowRateZero]}>
            {rate > 0 ? `${rate}%` : '—'}
          </Text>
        </View>
      ))}

      {reportTarget && (
        <ReportInaccuracyModal
          visible={!!reportTarget}
          bankId={bank.id}
          bankName={bank.name}
          categoryId={reportTarget.categoryId}
          categoryName={reportTarget.categoryName}
          currentRate={reportTarget.currentRate}
          onClose={(submitted) => {
            setReportTarget(null);
            if (submitted) setReportThanks(true);
          }}
        />
      )}

      {reportThanks && (
        <View style={styles.thanksToast}>
          <Text style={styles.thanksText}>Спасибо! Мы проверим ставку.</Text>
          <TouchableOpacity onPress={() => setReportThanks(false)}>
            <Text style={styles.thanksClose}>×</Text>
          </TouchableOpacity>
        </View>
      )}

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
    gap: 16,
  },
  loadingText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 16,
    color: '#6B7280',
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtnText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: BRAND_COLOR,
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
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tableTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    color: '#111827',
  },
  freshness: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  freshnessText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: '#9CA3AF',
  },
  reportLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  reportLinkText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'underline',
  },
  thanksToast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thanksText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  thanksClose: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    paddingHorizontal: 8,
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
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#DCFCE7',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  verifiedBadgeText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    color: '#16A34A',
  },
  aiBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  aiBadgeText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 9,
    color: '#B45309',
  },
});
