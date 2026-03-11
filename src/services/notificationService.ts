import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import { getEventLabel } from '../constants/eventTypes';
import {
  getNotificationDaysBefore,
  getNotificationTime,
  getNotificationsEnabled,
} from '../utils/notificationSettings';

const ANDROID_CHANNEL_ID = 'anniversary-reminders';

/**
 * Android 알림 채널 생성 (idempotent)
 */
export async function ensureChannel(): Promise<void> {
  await notifee.createChannel({
    id: ANDROID_CHANNEL_ID,
    name: '기념일 알림',
    importance: AndroidImportance.DEFAULT,
    vibration: true,
  });
}

/**
 * iOS 알림 권한 요청. 이미 허용된 경우 아무 작업 없음.
 */
export async function requestPermissionIfNeeded(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return (
    settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}

/**
 * 이벤트용 알림 ID (스케줄 취소 시 사용)
 */
export function getEventNotificationId(eventId: number): string {
  return `event-${eventId}`;
}

/**
 * YYYY-MM-DD 문자열을 (날짜 - daysBefore)의 알림 시각(설정된 hour:minute) Date로 변환
 */
async function getTriggerDate(
  dateStr: string,
  daysBefore: number,
): Promise<Date> {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dObj = new Date(y, (m ?? 1) - 1, d ?? 1);
  const { hour, minute } = await getNotificationTime();
  dObj.setHours(hour, minute, 0, 0);
  dObj.setDate(dObj.getDate() - daysBefore);
  return dObj;
}

/**
 * 반복 이벤트용: 다음 알림 시점(올해 또는 내년) 반환. 이미 지났으면 내년 같은 날.
 */
async function getNextTriggerDateForRecurring(
  dateStr: string,
  daysBefore: number,
): Promise<Date> {
  const trigger = await getTriggerDate(dateStr, daysBefore);
  const now = Date.now();
  if (trigger.getTime() > now) return trigger;
  const [y, m, d] = dateStr.split('-').map(Number);
  const nextYear = new Date(y + 1, (m ?? 1) - 1, d ?? 1);
  const nextStr = `${nextYear.getFullYear()}-${String(nextYear.getMonth() + 1).padStart(2, '0')}-${String(nextYear.getDate()).padStart(2, '0')}`;
  return getTriggerDate(nextStr, daysBefore);
}

/**
 * 알림 예정 시각 계산 (히스토리/예정 표시용). 설정값을 사용해 (eventDate - N일)의 알림 시각 반환.
 */
export async function getTriggerDateForDisplay(
  dateStr: string,
  daysBefore: number,
): Promise<Date> {
  return getTriggerDate(dateStr, daysBefore);
}

/**
 * 기념일 알림 스케줄.
 * - 설정이 꺼져 있으면 스케줄하지 않음.
 * - N일 전 알림 설정 및 알림 시간 설정에 따라 (eventDate - N일) 해당 시각에 알림.
 * - 해당 시각이 이미 지났으면 스케줄하지 않음.
 * - recurring이 true면 다음 알림일(올해/내년) 기준으로 스케줄.
 */
export async function scheduleEventNotification(
  eventId: number,
  dateStr: string,
  title: string,
  body: string,
  recurring = false,
): Promise<void> {
  const enabled = await getNotificationsEnabled();
  if (!enabled) return;

  const daysBefore = await getNotificationDaysBefore();
  const triggerDate = recurring
    ? await getNextTriggerDateForRecurring(dateStr, daysBefore)
    : await getTriggerDate(dateStr, daysBefore);
  if (triggerDate.getTime() <= Date.now()) return;

  await ensureChannel();
  const granted = await requestPermissionIfNeeded();
  if (!granted) return;

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: triggerDate.getTime(),
  };

  await notifee.createTriggerNotification(
    {
      id: getEventNotificationId(eventId),
      title,
      body,
      android: {
        channelId: ANDROID_CHANNEL_ID,
        pressAction: { id: 'default' },
      },
    },
    trigger,
  );
}

/**
 * 기념일 알림 스케줄 취소
 */
export async function cancelEventNotification(eventId: number): Promise<void> {
  const id = getEventNotificationId(eventId);
  await notifee.cancelTriggerNotification(id);
}

/** 반복 알림 재스케줄용 이벤트 타입 (id, date, displayName, type, memo 필요) */
export type RecurringEventItem = {
  id: number;
  date: string;
  displayName?: string;
  type: string;
  memo: string;
};

/**
 * 반복 알림: 올해 알림 시각이 이미 지난 경우 내년 같은 날로 재스케줄.
 * 앱 포그라운드 시 호출하면, 지난 반복 이벤트에 대해 다음 해 알림을 등록한다.
 */
export async function rescheduleRecurringEventsIfNeeded(
  events: RecurringEventItem[],
): Promise<void> {
  const enabled = await getNotificationsEnabled();
  if (!enabled || events.length === 0) return;

  const daysBefore = await getNotificationDaysBefore();

  for (const event of events) {
    const triggerThisYear = await getTriggerDate(event.date, daysBefore);
    if (triggerThisYear.getTime() <= Date.now()) {
      await cancelEventNotification(event.id);
      const title = `${event.displayName ?? '연락처'} ${getEventLabel(event.type)}`;
      const body = event.date + (event.memo?.trim() ? ` · ${event.memo.trim()}` : '');
      await scheduleEventNotification(
        event.id,
        event.date,
        title,
        body,
        true,
      );
    }
  }
}
