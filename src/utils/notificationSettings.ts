import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_NOTIFICATIONS_ENABLED = '@memorit/notifications_enabled';
const KEY_NOTIFICATION_DAYS_BEFORE = '@memorit/notification_days_before';
const KEY_NOTIFICATION_TIME = '@memorit/notification_time';

const DEFAULT_ENABLED = true;
const DEFAULT_DAYS_BEFORE = 0;
/** 기본 알림 시간: 오전 9시 */
const DEFAULT_HOUR = 9;
const DEFAULT_MINUTE = 0;

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

export type NotificationTime = { hour: number; minute: number };

/**
 * 알림 시간 반환 (기본값: 오전 9시)
 */
export async function getNotificationTime(): Promise<NotificationTime> {
  try {
    const value = await AsyncStorage.getItem(KEY_NOTIFICATION_TIME);
    if (value == null) return { hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE };
    const [h, m] = value.split(':').map(Number);
    const hour = Number.isNaN(h) ? DEFAULT_HOUR : Math.max(0, Math.min(23, Math.floor(h)));
    const minute = Number.isNaN(m) ? DEFAULT_MINUTE : Math.max(0, Math.min(59, Math.floor(m)));
    return { hour, minute };
  } catch {
    return { hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE };
  }
}

/**
 * 알림 시간 저장 (hour: 0–23, minute: 0–59)
 */
export async function setNotificationTime(hour: number, minute: number): Promise<void> {
  const h = Math.max(0, Math.min(23, Math.floor(hour)));
  const m = Math.max(0, Math.min(59, Math.floor(minute)));
  await AsyncStorage.setItem(KEY_NOTIFICATION_TIME, `${h}:${m}`);
}

/**
 * (eventDate - daysBefore) 날짜의 hour:minute 시각을 Date로 계산. 알림 예정/보냄 표시용 동기 함수.
 */
export function computeTriggerDate(
  dateStr: string,
  daysBefore: number,
  hour: number,
  minute: number,
): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dObj = new Date(y, (m ?? 1) - 1, d ?? 1);
  dObj.setHours(hour, minute, 0, 0);
  dObj.setDate(dObj.getDate() - daysBefore);
  return dObj;
}
