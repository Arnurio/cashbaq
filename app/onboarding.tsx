import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { saveCards, saveOnboarded } from '../lib/storage';
import { UserCard } from '../lib/types';

const SLIDES = [
  {
    emoji: '💳',
    title: 'Знайте, чем платить',
    desc: 'Подскажем лучшую карту для оплаты в каждой категории — продукты, рестораны, АЗС и другие',
  },
  {
    emoji: '🏦',
    title: 'Все банки Казахстана',
    desc: 'Kaspi, Halyk, Forte, BCC, Freedom, Bereke, Jusan — реальные условия кэшбэков',
  },
  {
    emoji: '💰',
    title: 'Находите скрытую выгоду',
    desc: 'Промо-акции, NFC-бонусы, лаунжи — не упускайте то, что вам полагается',
  },
];

const DEMO_CARDS: UserCard[] = [
  {
    id: 'demo_kaspi',
    bankId: 'kaspi',
    name: 'Kaspi Gold',
    useNfc: false,
    selectedCategories: [],
  },
  {
    id: 'demo_forte',
    bankId: 'forte',
    name: 'ForteBlack',
    useNfc: false,
    selectedCategories: ['restaurants', 'clothing', 'entertainment'],
  },
  {
    id: 'demo_freedom',
    bankId: 'freedom',
    name: 'Freedom Gold',
    level: 'gold',
    useNfc: true,
    selectedCategories: [],
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  const animateToStep = (nextStep: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleNext = () => {
    if (step < SLIDES.length - 1) {
      animateToStep(step + 1);
    }
  };

  const handleAddCards = async () => {
    await saveOnboarded(true);
    router.replace('/(tabs)');
  };

  const handleDemo = async () => {
    await saveCards(DEMO_CARDS);
    await saveOnboarded(true);
    router.replace('/(tabs)');
  };

  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>Cashbaq</Text>
      </View>

      <Animated.View style={[styles.slide, { opacity: fadeAnim }]}>
        <Text style={styles.slideEmoji}>{slide.emoji}</Text>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideDesc}>{slide.desc}</Text>
      </Animated.View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === step && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.buttons}>
        {isLast ? (
          <>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleAddCards}>
              <Text style={styles.primaryBtnText}>Добавить мои карты</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleDemo}>
              <Text style={styles.secondaryBtnText}>Посмотреть демо</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
            <Text style={styles.primaryBtnText}>Далее</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
    paddingTop: 80,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 32,
    color: '#0D7C5F',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  slideEmoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  slideTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 26,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  slideDesc: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    backgroundColor: '#0D7C5F',
    width: 24,
  },
  buttons: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#0D7C5F',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0D7C5F',
  },
  secondaryBtnText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 17,
    color: '#0D7C5F',
  },
});
