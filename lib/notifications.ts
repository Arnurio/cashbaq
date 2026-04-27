import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getCards } from './storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const DEVICE_ID_KEY = 'cashbaq_device_id';

/** Stable per-install device id. Created on first call, persisted in AsyncStorage. */
async function getDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    // crypto.randomUUID is available on RN 0.81 + modern engines
    const id = (globalThis.crypto as Crypto | undefined)?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return `dev_fallback_${Date.now()}`;
  }
}

/**
 * Запрашивает разрешение, получает Expo Push Token, и регистрирует устройство в Supabase
 * с текущим набором bank_ids (по добавленным картам).
 *
 * Fire-and-forget — никогда не бросает, никогда не блокирует UI.
 * Возвращает токен для информации; можно проигнорировать.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const tokenRes = await Notifications.getExpoPushTokenAsync();
  const token = tokenRes.data;

  // Persist subscription in Supabase (upsert by device_id)
  try {
    const deviceId = await getDeviceId();
    const cards = await getCards();
    const bankIds = [...new Set(cards.map((c) => c.bankId))];

    await supabase
      .from('push_subscriptions')
      .upsert(
        {
          device_id: deviceId,
          push_token: token,
          bank_ids: bankIds,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'device_id' }
      );
  } catch {
    // Network/Supabase errors are non-fatal — token still works locally
  }

  return token;
}

/**
 * Синхронизирует список bank_ids в Supabase после изменения карт пользователя.
 * Вызывать после add-card / remove-card. Fire-and-forget.
 */
export async function syncSubscriptionBanks(): Promise<void> {
  if (!Device.isDevice) return;
  try {
    const deviceId = await getDeviceId();
    const cards = await getCards();
    const bankIds = [...new Set(cards.map((c) => c.bankId))];

    await supabase
      .from('push_subscriptions')
      .update({
        bank_ids: bankIds,
        updated_at: new Date().toISOString(),
      })
      .eq('device_id', deviceId);
  } catch {
    // ignore
  }
}

/**
 * Отправляет локальное уведомление (для тестирования).
 */
export async function sendLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}
