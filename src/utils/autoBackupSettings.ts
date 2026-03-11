import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_AUTO_BACKUP_ENABLED = '@memorit/auto_backup_enabled';
const KEY_AUTO_BACKUP_INTERVAL = '@memorit/auto_backup_interval';
const KEY_AUTO_BACKUP_LAST_AT = '@memorit/auto_backup_last_at';

const DEFAULT_ENABLED = false;
const DEFAULT_INTERVAL = 'weekly' as AutoBackupInterval;

export type AutoBackupInterval = 'daily' | 'weekly';

const INTERVAL_MS: Record<AutoBackupInterval, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

/**
 * 자동 백업 사용 여부 반환 (기본값: false)
 */
export async function getAutoBackupEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(KEY_AUTO_BACKUP_ENABLED);
    if (value == null) return DEFAULT_ENABLED;
    return value === 'true';
  } catch {
    return DEFAULT_ENABLED;
  }
}

/**
 * 자동 백업 사용 여부 저장
 */
export async function setAutoBackupEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY_AUTO_BACKUP_ENABLED, String(enabled));
}

/**
 * 자동 백업 주기 반환 (기본값: weekly)
 */
export async function getAutoBackupInterval(): Promise<AutoBackupInterval> {
  try {
    const value = await AsyncStorage.getItem(KEY_AUTO_BACKUP_INTERVAL);
    if (value === 'daily' || value === 'weekly') return value;
    return DEFAULT_INTERVAL;
  } catch {
    return DEFAULT_INTERVAL;
  }
}

/**
 * 자동 백업 주기 저장
 */
export async function setAutoBackupInterval(
  interval: AutoBackupInterval,
): Promise<void> {
  await AsyncStorage.setItem(KEY_AUTO_BACKUP_INTERVAL, interval);
}

/**
 * 마지막 자동 백업 시각(ISO 문자열) 반환. 없으면 null
 */
export async function getAutoBackupLastAt(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY_AUTO_BACKUP_LAST_AT);
  } catch {
    return null;
  }
}

/**
 * 마지막 자동 백업 시각 저장 (자동 백업 실행 후 호출)
 */
export async function setAutoBackupLastAt(isoDate: string): Promise<void> {
  await AsyncStorage.setItem(KEY_AUTO_BACKUP_LAST_AT, isoDate);
}

/**
 * 설정된 주기에 따라 자동 백업이 필요한지 판단
 */
export async function shouldRunAutoBackup(): Promise<boolean> {
  const [enabled, interval, lastAt] = await Promise.all([
    getAutoBackupEnabled(),
    getAutoBackupInterval(),
    getAutoBackupLastAt(),
  ]);
  if (!enabled) return false;
  const intervalMs = INTERVAL_MS[interval];
  const now = Date.now();
  if (!lastAt) return true;
  const last = new Date(lastAt).getTime();
  return now - last >= intervalMs;
}
