import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import {
  getNotificationDaysBefore,
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
 * YYYY-MM-DD 문자열을 해당 날짜 오전 9시(로컬) Date로 변환
 */
function getTriggerDate(dateStr: string, daysBefore: number): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dObj = new Date(y, (m ?? 1) - 1, d ?? 1);
  dObj.setHours(9, 0, 0, 0);
  dObj.setDate(dObj.getDate() - daysBefore);
  return dObj;
}

/**
 * 기념일 알림 스케줄.
 * - 설정이 꺼져 있으면 스케줄하지 않음.
 * - N일 전 알림 설정에 따라 (eventDate - N일) 오전 9시에 알림.
 * - 해당 시각이 이미 지났으면 스케줄하지 않음.
 */
export async function scheduleEventNotification(
  eventId: number,
  dateStr: string,
  title: string,
  body: string,
): Promise<void> {
  const enabled = await getNotificationsEnabled();
  if (!enabled) return;

  const daysBefore = await getNotificationDaysBefore();
  const triggerDate = getTriggerDate(dateStr, daysBefore);
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
