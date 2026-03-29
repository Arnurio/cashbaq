import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserCard } from './types';

const KEYS = {
  CARDS: 'cashbaq_cards',
  ONBOARDED: 'cashbaq_onboarded',
} as const;

export async function saveCards(cards: UserCard[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.CARDS, JSON.stringify(cards));
  } catch {
    // ignore – native module may be unavailable (web / Expo Go)
  }
}

export async function getCards(): Promise<UserCard[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CARDS);
    if (!raw) return [];
    return JSON.parse(raw) as UserCard[];
  } catch {
    return [];
  }
}

export async function saveOnboarded(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ONBOARDED, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export async function getOnboarded(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ONBOARDED);
    if (!raw) return false;
    return JSON.parse(raw) as boolean;
  } catch {
    return false;
  }
}

export async function clearAll(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([KEYS.CARDS, KEYS.ONBOARDED]);
  } catch {
    // ignore
  }
}
