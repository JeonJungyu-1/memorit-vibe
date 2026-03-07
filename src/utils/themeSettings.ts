import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_THEME_MODE = '@memorit/theme_mode';

export type ThemeMode = 'light' | 'dark' | 'system';

const DEFAULT_THEME_MODE: ThemeMode = 'system';

/**
 * 저장된 테마 모드 반환 (light | dark | system, 기본값: system)
 */
export async function getThemeMode(): Promise<ThemeMode> {
  try {
    const value = await AsyncStorage.getItem(KEY_THEME_MODE);
    if (value === 'light' || value === 'dark' || value === 'system') {
      return value;
    }
    return DEFAULT_THEME_MODE;
  } catch {
    return DEFAULT_THEME_MODE;
  }
}

/**
 * 테마 모드 저장
 */
export async function setThemeMode(mode: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(KEY_THEME_MODE, mode);
}
