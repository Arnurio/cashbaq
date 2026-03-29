import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useData } from '../lib/useData';
import { CATEGORIES, BRAND_COLOR, BG_COLOR } from '../lib/constants';
import { getCards, saveCards } from '../lib/storage';
import { getCardRate, getMarketBestRate } from '../lib/cashback';
import { UserCard, Bank, FreedomLevel, BerekeTier } from '../lib/types';
import WowModal from '../components/WowModal';

export default function AddCardScreen() {
  const router = useRouter();
  const { banks, loading } = useData();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [existingCards, setExistingCards] = useState<UserCard[]>([]);

  // Config state
  const [freedomLevel, setFreedomLevel] = useState<FreedomLevel>('standard');
  const [useNfc, setUseNfc] = useState(false);
  const [berekeTier, setBerekeTier] = useState<BerekeTier>('zero');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  // Wow modal
  const [showWow, setShowWow] = useState(false);
  const [wowData, setWowData] = useState({
    maxRate: 0,
    maxCategory: '',
    marketRate: 0,
    marketBank: '',
  });

  useFocusEffect(
    useCallback(() => {
      getCards().then(setExistingCards);
    }, [])
  );

  const handleSelectBank = (bank: Bank) => {
    setSelectedBank(bank);
    setStep(2);
    setSelectedCats([]);
    setFreedomLevel('standard');
    setUseNfc(false);
    setBerekeTier('zero');
  };

  const toggleCategory = (catId: string) => {
    const max = selectedBank?.config.maxCategories ?? 3;
    setSelectedCats((prev) => {
      if (prev.includes(catId)) {
        return prev.filter((id) => id !== catId);
      }
      if (prev.length >= max) return prev;
      return [...prev, catId];
    });
  };

  const handleSave = async () => {
    if (!selectedBank) return;

    const newCard: UserCard = {
      id: `${selectedBank.id}_${Date.now()}`,
      bankId: selectedBank.id,
      name: selectedBank.card,
      useNfc,
      selectedCategories: selectedCats,
      level: selectedBank.type === 'leveled' ? freedomLevel : undefined,
      tier: selectedBank.type === 'subscription' ? berekeTier : undefined,
    };

    const isFirstCard = existingCards.length === 0;
    const updatedCards = [...existingCards, newCard];
    await saveCards(updatedCards);

    if (isFirstCard) {
      // Calculate wow data
      let maxRate = 0;
      let maxCatName = '';
      for (const cat of CATEGORIES) {
        const rate = getCardRate(newCard, selectedBank, cat.id);
        if (rate > maxRate) {
          maxRate = rate;
          maxCatName = cat.emoji + ' ' + cat.name;
        }
      }

      let marketRate = 0;
      let marketBankName = '';
      for (const cat of CATEGORIES) {
        const market = getMarketBestRate(banks, cat.id);
        if (market && market.rate > marketRate) {
          marketRate = market.rate;
          marketBankName = market.bank.card;
        }
      }

      setWowData({ maxRate, maxCategory: maxCatName, marketRate, marketBank: marketBankName });
      setShowWow(true);
    } else {
      router.back();
    }
  };

  const FREEDOM_LEVELS: { key: FreedomLevel; label: string; desc: string }[] = [
    { key: 'standard', label: 'Standard', desc: '1% + 0.5% NFC' },
    { key: 'silver', label: 'Silver', desc: '2% + 1% NFC' },
    { key: 'gold', label: 'Gold', desc: '3% + 1.5% NFC' },
    { key: 'platinum', label: 'Platinum', desc: '4% + 2% NFC' },
  ];

  const BEREKE_TIERS: { key: BerekeTier; label: string; desc: string }[] = [
    { key: 'zero', label: 'Без депозита', desc: '0%' },
    { key: 'basic', label: 'Базовый', desc: '1%' },
    { key: 'medium', label: 'Средний', desc: '3%' },
    { key: 'high', label: 'Высокий', desc: '5%' },
    { key: 'max', label: 'Максимальный', desc: '7%' },
  ];

  // Step 1: Choose bank
  if (step === 1) {
    if (loading && banks.length === 0) {
      return (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.stepTitle}>Выберите банк</Text>

        {banks.map((bank) => {
          const alreadyAdded = existingCards.some((c) => c.bankId === bank.id);
          return (
            <TouchableOpacity
              key={bank.id}
              style={[styles.bankRow, alreadyAdded && styles.bankRowDisabled]}
              onPress={() => !alreadyAdded && handleSelectBank(bank)}
              disabled={alreadyAdded}
            >
              <View style={[styles.bankDot, { backgroundColor: bank.color }]} />
              <View style={styles.bankInfo}>
                <Text style={styles.bankName}>{bank.card}</Text>
                <Text style={styles.bankDesc}>{bank.desc}</Text>
              </View>
              {alreadyAdded && (
                <View style={styles.addedBadge}>
                  <Check size={14} color={BRAND_COLOR} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }

  // Step 2: Configure
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => setStep(1)}>
        <Text style={styles.backLink}>← Назад к списку</Text>
      </TouchableOpacity>

      <View style={[styles.configHeader, { backgroundColor: selectedBank!.gradient[0] }]}>
        <Text style={styles.configBankName}>{selectedBank!.card}</Text>
        <Text style={styles.configBankDesc}>{selectedBank!.desc}</Text>
      </View>

      {/* NFC toggle (for Freedom) */}
      {selectedBank?.type === 'leveled' && (
        <>
          <Text style={styles.configTitle}>Уровень карты</Text>
          {FREEDOM_LEVELS.map((lv) => (
            <TouchableOpacity
              key={lv.key}
              style={[
                styles.optionRow,
                freedomLevel === lv.key && styles.optionActive,
              ]}
              onPress={() => setFreedomLevel(lv.key)}
            >
              <View style={styles.optionRadio}>
                {freedomLevel === lv.key && <View style={styles.optionRadioInner} />}
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>{lv.label}</Text>
                <Text style={styles.optionDesc}>{lv.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.nfcRow}>
            <Text style={styles.nfcLabel}>Оплата через NFC</Text>
            <Switch
              value={useNfc}
              onValueChange={setUseNfc}
              trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
              thumbColor={useNfc ? BRAND_COLOR : '#F4F3F4'}
            />
          </View>
        </>
      )}

      {/* Selectable categories (Forte, BCC) */}
      {selectedBank?.type === 'selectable' && (
        <>
          <Text style={styles.configTitle}>
            Выберите {selectedBank.config.maxCategories} категории
          </Text>
          <Text style={styles.configSubtitle}>
            Выбрано: {selectedCats.length}/{selectedBank.config.maxCategories}
          </Text>

          {CATEGORIES.map((cat) => {
            const isSelected = selectedCats.includes(cat.id);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catOption, isSelected && styles.catOptionActive]}
                onPress={() => toggleCategory(cat.id)}
              >
                <Text style={styles.catOptionEmoji}>{cat.emoji}</Text>
                <Text style={styles.catOptionName}>{cat.name}</Text>
                {isSelected && <Check size={18} color={BRAND_COLOR} />}
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {/* Bereke tier */}
      {selectedBank?.type === 'subscription' && (
        <>
          <Text style={styles.configTitle}>Тариф депозита</Text>
          {BEREKE_TIERS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.optionRow,
                berekeTier === t.key && styles.optionActive,
              ]}
              onPress={() => setBerekeTier(t.key)}
            >
              <View style={styles.optionRadio}>
                {berekeTier === t.key && <View style={styles.optionRadioInner} />}
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>{t.label}</Text>
                <Text style={styles.optionDesc}>{t.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Fixed banks — just NFC toggle */}
      {selectedBank?.type === 'fixed' && (
        <View style={styles.fixedInfo}>
          <Text style={styles.fixedText}>
            {selectedBank.card} имеет фиксированные ставки кэшбэка. Дополнительная настройка не требуется.
          </Text>
        </View>
      )}

      {/* Save button */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Добавить карту</Text>
      </TouchableOpacity>

      <WowModal
        visible={showWow}
        maxRate={wowData.maxRate}
        maxCategory={wowData.maxCategory}
        marketRate={wowData.marketRate}
        marketBank={wowData.marketBank}
        onClose={() => {
          setShowWow(false);
          router.back();
        }}
      />
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
  stepTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 22,
    color: '#111827',
    marginBottom: 16,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  bankRowDisabled: {
    opacity: 0.5,
  },
  bankDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 14,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    color: '#111827',
  },
  bankDesc: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  addedBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLink: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: BRAND_COLOR,
    marginBottom: 16,
  },
  configHeader: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  configBankName: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
  },
  configBankDesc: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  configTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    color: '#111827',
    marginBottom: 8,
  },
  configSubtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  optionActive: {
    borderColor: BRAND_COLOR,
    backgroundColor: '#ECFDF5',
  },
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BRAND_COLOR,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: '#111827',
  },
  optionDesc: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  nfcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  nfcLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: '#111827',
  },
  catOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  catOptionActive: {
    borderColor: BRAND_COLOR,
    backgroundColor: '#ECFDF5',
  },
  catOptionEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  catOptionName: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    color: '#111827',
    flex: 1,
  },
  fixedInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 8,
  },
  fixedText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  saveBtn: {
    backgroundColor: BRAND_COLOR,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
  },
});
