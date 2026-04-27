import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
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

const EAS_PROJECT_ID = '32cc8607-6968-472c-a1b0-208c0276db2e';

/**
 * Ensures the client has an anonymous Supabase Auth session and returns its uid.
 * The uid doubles as the device_id — RLS policies allow each device to mutate ONLY
 * its own push_subscriptions row.
 */
async function ensureAnonSession(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) return session.user.id;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user?.id) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

/**
 * Запрашивает разрешение, получает Expo Push Token, и регистрирует устройство в Supabase.
 * Использует анонимную сессию Supabase Auth — каждое устройство может править только свою запись.
 *
 * Fire-and-forget — никогда не бросает, никогда не блокирует UI.
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

  let token: string;
  try {
    const tokenRes = await Notifications.getExpoPushTokenAsync({
      projectId: EAS_PROJECT_ID,
    });
    token = tokenRes.data;
  } catch {
    return null;
  }

  // Anonymous auth + upsert in one go
  try {
    const deviceId = await ensureAnonSession();
    if (!deviceId) return token; // can't register in DB but local token still works

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
        },
        { onConflict: 'device_id' }
      );
  } catch {
    // Network/RLS errors are non-fatal
  }

  return token;
}

/**
 * Синхронизирует список bank_ids после изменения карт пользователя.
 * Использует upsert — если строки ещё нет (юзер не дал permission), создаст её
 * с пустым токеном-плейсхолдером? Нет — без токена пушей не пошлёт никто, поэтому
 * UPDATE-only на существующую запись. Если её нет — registerForPushNotifications
 * подхватит свежие bank_ids когда юзер даст разрешение.
 */
export async function syncSubscriptionBanks(): Promise<void> {
  if (!Device.isDevice) return;
  try {
    const deviceId = await ensureAnonSession();
    if (!deviceId) return;

    const cards = await getCards();
    const bankIds = [...new Set(cards.map((c) => c.bankId))];

    await supabase
      .from('push_subscriptions')
      .update({ bank_ids: bankIds })
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
