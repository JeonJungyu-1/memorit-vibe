import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from 'tamagui';
import type { SettingsScreenProps } from '../navigation/types';
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
  getNotificationDaysBefore,
  setNotificationDaysBefore,
} from '../utils/notificationSettings';
import { useThemeMode } from '../contexts/ThemeContext';
import type { ThemeMode } from '../utils/themeSettings';

const DAYS_OPTIONS = [
  { value: 0, label: '당일' },
  { value: 1, label: '1일 전' },
  { value: 2, label: '2일 전' },
  { value: 3, label: '3일 전' },
  { value: 7, label: '7일 전' },
];

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: '시스템' },
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
];

type ThemeColors = {
  background: string;
  color: string;
  colorMuted: string;
  borderColor: string;
  backgroundHover: string;
  accent: string;
  accentForeground: string;
};

function createThemeStyles(t: ThemeColors) {
  return {
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: t.background,
    },
    backButtonText: { fontSize: 16, color: t.accent },
    title: { color: t.color },
    sectionTitle: { fontSize: 18, fontWeight: '600' as const, marginBottom: 12, color: t.color },
    rowLabel: { fontSize: 16, color: t.color },
    dayChip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.borderColor,
      backgroundColor: t.backgroundHover,
    },
    dayChipActive: { backgroundColor: t.accent, borderColor: t.accent },
    dayChipText: { fontSize: 14, color: t.color },
    dayChipTextActive: { color: t.accentForeground },
  };
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { themeMode, setThemeMode } = useThemeMode();
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [daysBefore, setDaysBeforeState] = useState(0);
  const [loading, setLoading] = useState(true);

  const themeStyles = useMemo(
    () =>
      createThemeStyles({
        background: theme.background?.val ?? theme.background ?? '#fff',
        color: theme.color?.val ?? theme.color ?? '#333',
        colorMuted: theme.color11?.val ?? theme.color11 ?? '#666',
        borderColor: theme.borderColor?.val ?? theme.borderColor ?? '#ddd',
        backgroundHover: theme.backgroundHover?.val ?? theme.backgroundHover ?? '#f9f9f9',
        accent: theme.blue9?.val ?? theme.blue9 ?? '#0a7ea4',
        accentForeground: theme.blue9?.val ? '#fff' : '#fff',
      }),
    [theme],
  );

  const loadSettings = useCallback(async () => {
    try {
      const [enabled, days] = await Promise.all([
        getNotificationsEnabled(),
        getNotificationDaysBefore(),
      ]);
      setNotificationsEnabledState(enabled);
      setDaysBeforeState(days);
    } catch (e) {
      console.error('Failed to load notification settings', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadSettings);
    return unsubscribe;
  }, [navigation, loadSettings]);

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabledState(value);
    await setNotificationsEnabled(value);
  };

  const handleSelectDaysBefore = async (value: number) => {
    setDaysBeforeState(value);
    await setNotificationDaysBefore(value);
  };

  const accent = theme.blue9?.val ?? theme.blue9 ?? '#0a7ea4';

  if (loading) {
    return (
      <View style={[styles.container, themeStyles.container]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, themeStyles.container]}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={themeStyles.backButtonText}>← 뒤로</Text>
      </Pressable>

      <Text style={[styles.title, themeStyles.title]}>설정</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>테마</Text>
        <View style={styles.themeChips}>
          {THEME_OPTIONS.map(({ value, label }) => (
            <Pressable
              key={value}
              style={[
                themeStyles.dayChip,
                themeMode === value && themeStyles.dayChipActive,
              ]}
              onPress={() => setThemeMode(value)}
            >
              <Text
                style={[
                  themeStyles.dayChipText,
                  themeMode === value && themeStyles.dayChipTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>기념일 알림</Text>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, themeStyles.rowLabel]}>알림 사용</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: (theme.gray8?.val ?? theme.gray8 ?? '#ccc'), true: accent }}
            thumbColor={themeStyles.dayChipTextActive.color}
          />
        </View>
        <View style={styles.daysRow}>
          <Text style={[styles.rowLabel, themeStyles.rowLabel]}>알림 시점</Text>
          <View style={styles.daysOptions}>
            {DAYS_OPTIONS.map(({ value, label }) => (
              <Pressable
                key={value}
                style={[
                  themeStyles.dayChip,
                  daysBefore === value && themeStyles.dayChipActive,
                ]}
                onPress={() => handleSelectDaysBefore(value)}
              >
                <Text
                  style={[
                    themeStyles.dayChipText,
                    daysBefore === value && themeStyles.dayChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  themeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  rowLabel: {
    fontSize: 16,
  },
  daysRow: {
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  daysOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
});

export default SettingsScreen;
