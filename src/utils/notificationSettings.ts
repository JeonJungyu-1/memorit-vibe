import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_NOTIFICATIONS_ENABLED = '@memorit/notifications_enabled';
const KEY_NOTIFICATION_DAYS_BEFORE = '@memorit/notification_days_before';

const DEFAULT_ENABLED = true;
const DEFAULT_DAYS_BEFORE = 0;

/**
 * 알림 켜기/끄기 여부 반환 (기본값: true)
 */
export async function getNotificationsEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(KEY_NOTIFICATIONS_ENABLED);
    if (value == null) return DEFAULT_ENABLED;
    return value === 'true';
  } catch {
    return DEFAULT_ENABLED;
  }
}

/**
 * 알림 켜기/끄기 저장
 */
export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY_NOTIFICATIONS_ENABLED, String(enabled));
}

/**
 * N일 전 알림 설정 반환 (0 = 당일, 1 = 1일 전, …)
 */
export async function getNotificationDaysBefore(): Promise<number> {
  try {
    const value = await AsyncStorage.getItem(KEY_NOTIFICATION_DAYS_BEFORE);
    if (value == null) return DEFAULT_DAYS_BEFORE;
    const num = parseInt(value, 10);
    return Number.isNaN(num) || num < 0 ? DEFAULT_DAYS_BEFORE : num;
  } catch {
    return DEFAULT_DAYS_BEFORE;
  }
}

/**
 * N일 전 알림 설정 저장
 */
export async function setNotificationDaysBefore(days: number): Promise<void> {
  const safe = Math.max(0, Math.floor(days));
  await AsyncStorage.setItem(KEY_NOTIFICATION_DAYS_BEFORE, String(safe));
}
