import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from 'tamagui';
import Toast from 'react-native-toast-message';
import type { SettingsScreenProps } from '../navigation/types';
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
  getNotificationDaysBefore,
  setNotificationDaysBefore,
} from '../utils/notificationSettings';
import {
  exportAndShareBackup,
  pickAndRestoreBackup,
  isDocumentPickerCancel,
} from '../utils/backupRestore';
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
  const [backupRestoreBusy, setBackupRestoreBusy] = useState(false);

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

  const handleExportBackup = useCallback(async () => {
    if (backupRestoreBusy) return;
    setBackupRestoreBusy(true);
    try {
      await exportAndShareBackup();
      Toast.show({
        type: 'success',
        text1: '백업 준비 완료',
        text2: '공유할 앱을 선택해 저장하세요.',
      });
    } catch (e: unknown) {
      const err = e as { message?: string };
      if (err?.message?.includes('User did not share') || err?.message === 'User did not share') {
        return;
      }
      console.error('Backup export failed', e);
      Toast.show({
        type: 'error',
        text1: '백업 실패',
        text2: err?.message ?? '백업 파일을 만들 수 없습니다.',
      });
    } finally {
      setBackupRestoreBusy(false);
    }
  }, [backupRestoreBusy]);

  const handleRestoreBackup = useCallback(() => {
    if (backupRestoreBusy) return;
    Alert.alert(
      '데이터 복원',
      '기존 데이터가 모두 삭제되고 백업 내용으로 대체됩니다. 계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '복원',
          style: 'destructive',
          onPress: async () => {
            setBackupRestoreBusy(true);
            try {
              const { contactsCount } = await pickAndRestoreBackup();
              Toast.show({
                type: 'success',
                text1: '복원 완료',
                text2: `연락처 ${contactsCount}명이 복원되었습니다.`,
              });
              navigation.navigate('Home');
            } catch (e: unknown) {
              if (isDocumentPickerCancel(e)) return;
              const err = e as { message?: string };
              console.error('Restore failed', e);
              Toast.show({
                type: 'error',
                text1: '복원 실패',
                text2: err?.message ?? '백업 파일을 불러올 수 없습니다.',
              });
            } finally {
              setBackupRestoreBusy(false);
            }
          },
        },
      ],
    );
  }, [backupRestoreBusy, navigation]);

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

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>
          데이터 백업/복원
        </Text>
        <Text style={[styles.rowLabel, themeStyles.rowLabel, styles.backupDescription]}>
          기기 변경 또는 앱 재설치 시 백업 파일로 데이터를 복원할 수 있습니다.
        </Text>
        <View style={styles.backupButtons}>
          <Pressable
            style={[
              themeStyles.dayChip,
              styles.backupButton,
              backupRestoreBusy && styles.buttonDisabled,
            ]}
            onPress={handleExportBackup}
            disabled={backupRestoreBusy}
          >
            <Text style={[themeStyles.dayChipText]}>백업하여 공유</Text>
          </Pressable>
          <Pressable
            style={[
              themeStyles.dayChip,
              styles.backupButton,
              backupRestoreBusy && styles.buttonDisabled,
            ]}
            onPress={handleRestoreBackup}
            disabled={backupRestoreBusy}
          >
            <Text style={[themeStyles.dayChipText]}>백업 파일에서 복원</Text>
          </Pressable>
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
  backupDescription: {
    marginBottom: 12,
  },
  backupButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  backupButton: {
    minWidth: 140,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default SettingsScreen;
