import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from 'tamagui';
import Toast from 'react-native-toast-message';
import type { SettingsScreenProps } from '../navigation/types';
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
  getNotificationDaysBefore,
  setNotificationDaysBefore,
  getNotificationTime,
  setNotificationTime,
} from '../utils/notificationSettings';
import {
  exportAndShareBackup,
  exportAndShareCsv,
  pickAndRestoreBackup,
  isDocumentPickerCancel,
} from '../utils/backupRestore';
import {
  getAutoBackupEnabled,
  setAutoBackupEnabled,
  getAutoBackupInterval,
  setAutoBackupInterval,
  type AutoBackupInterval,
} from '../utils/autoBackupSettings';
import { useThemeMode } from '../contexts/ThemeContext';
import type { ThemeMode } from '../utils/themeSettings';
import {
  getThemeColor,
  SPACING,
  FONT,
  RADIUS_SM,
  SOFT_FLOAT_SHADOW,
  FLUID_LIGHT,
} from '../utils/themeColors';
import {
  getMonthlyBudgetGoalKrw,
  setMonthlyBudgetGoalKrw,
} from '../utils/budgetSettings';
import { FluidButton } from '../components/FluidButton';
import { FluidCard } from '../components/FluidCard';
import { FluidInput } from '../components/FluidInput';

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
      padding: SPACING.screenPadding,
      backgroundColor: t.background,
    },
    title: {
      color: t.color,
      fontFamily: FONT.fontFamilyHeading,
    },
    sectionTitle: {
      fontSize: FONT.sectionTitle,
      fontWeight: '600' as const,
      marginBottom: SPACING.rowGap,
      color: t.color,
      fontFamily: FONT.fontFamilyHeading,
    },
    rowLabel: {
      fontSize: FONT.body,
      color: t.color,
      fontFamily: FONT.fontFamilyBody,
    },
    chip: {
      ...RADIUS_SM,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderWidth: 0,
      backgroundColor: t.backgroundHover,
      minHeight: 40,
      justifyContent: 'center' as const,
      ...SOFT_FLOAT_SHADOW,
    },
    chipActive: { backgroundColor: t.accent, borderColor: t.accent },
    chipText: {
      fontSize: FONT.bodySmall,
      color: t.color,
      fontFamily: FONT.fontFamilyBody,
    },
    chipTextActive: { color: t.accentForeground },
  };
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { themeMode, setThemeMode } = useThemeMode();
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [daysBefore, setDaysBeforeState] = useState(0);
  const [notificationTime, setNotificationTimeState] = useState({ hour: 9, minute: 0 });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backupRestoreBusy, setBackupRestoreBusy] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabledState] = useState(false);
  const [autoBackupInterval, setAutoBackupIntervalState] = useState<AutoBackupInterval>('weekly');
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState('');

  const themeStyles = useMemo(
    () =>
      createThemeStyles({
        background: getThemeColor(theme, 'background') || FLUID_LIGHT.background,
        color: getThemeColor(theme, 'color') || FLUID_LIGHT.foreground,
        colorMuted: getThemeColor(theme, 'color11') || getThemeColor(theme, 'gray11') || FLUID_LIGHT.mutedText,
        borderColor: getThemeColor(theme, 'borderColor') || FLUID_LIGHT.border,
        backgroundHover: getThemeColor(theme, 'backgroundHover') ?? FLUID_LIGHT.cardBg,
        accent: getThemeColor(theme, 'blue9') || getThemeColor(theme, 'blue10') || FLUID_LIGHT.secondaryAccent,
        accentForeground: '#fff',
      }),
    [theme],
  );

  const loadSettings = useCallback(async () => {
    try {
      const [enabled, days, time, autoBackupOn, autoBackupInt, budgetGoal] =
        await Promise.all([
          getNotificationsEnabled(),
          getNotificationDaysBefore(),
          getNotificationTime(),
          getAutoBackupEnabled(),
          getAutoBackupInterval(),
          getMonthlyBudgetGoalKrw(),
        ]);
      setNotificationsEnabledState(enabled);
      setDaysBeforeState(days);
      setNotificationTimeState(time);
      setAutoBackupEnabledState(autoBackupOn);
      setAutoBackupIntervalState(autoBackupInt);
      setMonthlyBudgetInput(budgetGoal > 0 ? String(budgetGoal) : '');
    } catch (e) {
      console.error('Failed to load settings', e);
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

  const notificationTimeDate = useMemo(
    () =>
      new Date(2000, 0, 1, notificationTime.hour, notificationTime.minute, 0, 0),
    [notificationTime.hour, notificationTime.minute],
  );

  const handleTimeChange = useCallback(
    (_event: { type: string }, selectedDate?: Date) => {
      if (Platform.OS === 'android') setShowTimePicker(false);
      if (
        Platform.OS === 'android' &&
        (_event.type === 'dismissed' || _event.type === 'cancel')
      ) {
        return;
      }
      if (selectedDate) {
        const hour = selectedDate.getHours();
        const minute = selectedDate.getMinutes();
        setNotificationTimeState({ hour, minute });
        setNotificationTime(hour, minute);
      }
    },
    [],
  );

  const timeLabel = `${String(notificationTime.hour).padStart(2, '0')}:${String(notificationTime.minute).padStart(2, '0')}`;

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

  const handleToggleAutoBackup = async (value: boolean) => {
    setAutoBackupEnabledState(value);
    await setAutoBackupEnabled(value);
  };

  const handleSelectAutoBackupInterval = async (value: AutoBackupInterval) => {
    setAutoBackupIntervalState(value);
    await setAutoBackupInterval(value);
  };

  const handleExportCsv = useCallback(async () => {
    if (backupRestoreBusy) return;
    setBackupRestoreBusy(true);
    try {
      await exportAndShareCsv();
      Toast.show({
        type: 'success',
        text1: 'CSV 내보내기 완료',
        text2: '공유할 앱을 선택해 저장하세요.',
      });
    } catch (e: unknown) {
      const err = e as { message?: string };
      if (err?.message?.includes('User did not share') || err?.message === 'User did not share') {
        return;
      }
      console.error('CSV export failed', e);
      Toast.show({
        type: 'error',
        text1: 'CSV 내보내기 실패',
        text2: err?.message ?? 'CSV 파일을 만들 수 없습니다.',
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
              navigation.navigate('Contacts');
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

  const accent = getThemeColor(theme, 'blue9') || getThemeColor(theme, 'blue10') || FLUID_LIGHT.secondaryAccent;

  const containerBg = getThemeColor(theme, 'background') || FLUID_LIGHT.background;

  const handleSaveBudget = useCallback(async () => {
    const n = parseInt(monthlyBudgetInput.replace(/,/g, ''), 10);
    if (monthlyBudgetInput.trim() === '') {
      await setMonthlyBudgetGoalKrw(0);
      setMonthlyBudgetInput('');
      Toast.show({ type: 'success', text1: '저장됨', text2: '월간 예산 목표를 해제했습니다.' });
      return;
    }
    if (!Number.isFinite(n) || n < 0) {
      Toast.show({ type: 'error', text1: '입력 오류', text2: '0 이상의 숫자를 입력해주세요.' });
      return;
    }
    await setMonthlyBudgetGoalKrw(n);
    Toast.show({ type: 'success', text1: '저장됨', text2: '대시보드 예산 카드에 반영됩니다.' });
  }, [monthlyBudgetInput]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: containerBg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      </View>
    );
  }

  const accentFg = themeStyles.chipTextActive.color;

  return (
    <View style={[styles.container, themeStyles.container]}>
      <View style={styles.backButton}>
        <FluidButton variant="secondary" onPress={() => navigation.navigate('LedgerHome')}>
          ← 대시보드
        </FluidButton>
      </View>

      <Text style={[styles.title, themeStyles.title]}>설정</Text>

      <View style={styles.section}>
        <FluidCard>
          <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>테마</Text>
          <View style={styles.themeChips}>
            {THEME_OPTIONS.map(({ value, label }) => (
              <Pressable
                key={value}
                style={[
                  themeStyles.chip,
                  themeMode === value && themeStyles.chipActive,
                ]}
                onPress={() => setThemeMode(value)}
              >
                <Text
                  style={[
                    themeStyles.chipText,
                    themeMode === value && themeStyles.chipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </FluidCard>
      </View>

      <View style={styles.section}>
        <FluidCard>
          <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>월간 예산 (대시보드)</Text>
          <Text style={[styles.rowLabel, themeStyles.rowLabel, styles.budgetHint]}>
            이번 달 경조사비 목표(원). 비우고 저장하면 미사용.
          </Text>
          <FluidInput
            value={monthlyBudgetInput}
            onChangeText={setMonthlyBudgetInput}
            placeholder="예: 5000000"
            keyboardType="number-pad"
            style={styles.budgetInput}
          />
          <FluidButton variant="primary" onPress={handleSaveBudget}>
            예산 목표 저장
          </FluidButton>
        </FluidCard>
      </View>

      <View style={styles.section}>
        <FluidCard>
          <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>기념일 알림</Text>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, themeStyles.rowLabel]}>알림 사용</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: (theme.gray8?.val ?? theme.gray8 ?? '#ccc'), true: accent }}
              thumbColor={accentFg}
            />
          </View>
          <View style={styles.daysRow}>
            <Text style={[styles.rowLabel, themeStyles.rowLabel]}>알림 시점</Text>
            <View style={styles.daysOptions}>
              {DAYS_OPTIONS.map(({ value, label }) => (
                <Pressable
                  key={value}
                  style={[
                    themeStyles.chip,
                    daysBefore === value && themeStyles.chipActive,
                  ]}
                  onPress={() => handleSelectDaysBefore(value)}
                >
                  <Text
                    style={[
                      themeStyles.chipText,
                      daysBefore === value && themeStyles.chipTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, themeStyles.rowLabel]}>알림 시간</Text>
            <Pressable
              style={[themeStyles.chip, styles.timeChip]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={[themeStyles.chipText, themeStyles.chipText]}>
                {timeLabel}
              </Text>
            </Pressable>
          </View>
          {showTimePicker && (
            <DateTimePicker
              value={notificationTimeDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
              onTouchCancel={() => setShowTimePicker(false)}
            />
          )}
        </FluidCard>
      </View>

      <View style={styles.section}>
        <FluidCard>
          <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>
            오프라인 사용
          </Text>
          <Text style={[styles.rowLabel, themeStyles.rowLabel, styles.infoDescription]}>
            모든 연락처와 경조사 데이터는 기기에만 저장됩니다. 인터넷 연결 없이 앱을 사용할 수 있습니다.
          </Text>
        </FluidCard>
      </View>

      <View style={styles.section}>
        <FluidCard>
          <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>
            홈 화면 위젯
          </Text>
          <Text style={[styles.rowLabel, themeStyles.rowLabel, styles.infoDescription]}>
            iOS/Android 홈 화면 위젯은 현재 버전에서 지원하지 않습니다. 다가오는 경조사는 앱 홈의 「다가오는 기념일」 목록에서 확인하세요.
          </Text>
        </FluidCard>
      </View>

      <View style={styles.section}>
        <FluidCard>
          <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>
            자동 백업
          </Text>
          <Text style={[styles.rowLabel, themeStyles.rowLabel, styles.backupDescription]}>
            앱을 열 때마다 주기에 따라 기기 내에 백업 파일을 자동으로 저장합니다.
          </Text>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, themeStyles.rowLabel]}>자동 백업 사용</Text>
            <Switch
              value={autoBackupEnabled}
              onValueChange={handleToggleAutoBackup}
              trackColor={{ false: (theme.gray8?.val ?? theme.gray8 ?? '#ccc'), true: accent }}
              thumbColor={accentFg}
            />
          </View>
          {autoBackupEnabled && (
            <View style={styles.daysRow}>
              <Text style={[styles.rowLabel, themeStyles.rowLabel]}>백업 주기</Text>
              <View style={styles.daysOptions}>
                {[
                  { value: 'daily' as const, label: '매일' },
                  { value: 'weekly' as const, label: '매주' },
                ].map(({ value, label }) => (
                  <Pressable
                    key={value}
                    style={[
                      themeStyles.chip,
                      autoBackupInterval === value && themeStyles.chipActive,
                    ]}
                    onPress={() => handleSelectAutoBackupInterval(value)}
                  >
                    <Text
                      style={[
                        themeStyles.chipText,
                        autoBackupInterval === value && themeStyles.chipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </FluidCard>
      </View>

      <View style={styles.section}>
        <FluidCard>
          <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>
            데이터 백업/복원
          </Text>
          <Text style={[styles.rowLabel, themeStyles.rowLabel, styles.backupDescription]}>
            기기 변경 또는 앱 재설치 시 백업 파일로 데이터를 복원할 수 있습니다.
          </Text>
          <View style={styles.backupButtons}>
            <FluidButton
              variant="primary"
              onPress={handleExportBackup}
              disabled={backupRestoreBusy}
              style={styles.backupButton}
            >
              백업하여 공유
            </FluidButton>
            <FluidButton
              variant="secondary"
              onPress={handleExportCsv}
              disabled={backupRestoreBusy}
              style={styles.backupButton}
            >
              CSV로 내보내기
            </FluidButton>
            <FluidButton
              variant="secondary"
              onPress={handleRestoreBackup}
              disabled={backupRestoreBusy}
              style={styles.backupButton}
            >
              백업 파일에서 복원
            </FluidButton>
          </View>
        </FluidCard>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.screenPadding,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.itemGap,
    paddingHorizontal: 0,
    marginBottom: SPACING.rowGap,
    minHeight: SPACING.touchTargetMin,
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT.title,
    fontWeight: '700',
    marginBottom: SPACING.sectionGap,
  },
  section: {
    marginBottom: SPACING.sectionGap,
  },
  sectionTitle: {
    fontSize: FONT.sectionTitle,
    fontWeight: '600',
    marginBottom: SPACING.rowGap,
  },
  themeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.itemGap,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.rowGap,
    paddingHorizontal: 0,
    minHeight: SPACING.touchTargetMin,
  },
  rowLabel: {
    fontSize: FONT.body,
  },
  daysRow: {
    paddingVertical: SPACING.itemGap,
    paddingHorizontal: 0,
  },
  daysOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.itemGap,
    marginTop: SPACING.itemGap,
  },
  backupDescription: {
    marginBottom: SPACING.rowGap,
    fontSize: FONT.bodySmall,
  },
  infoDescription: {
    marginBottom: 0,
    fontSize: FONT.bodySmall,
  },
  backupButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.itemGap,
  },
  backupButton: {
    minWidth: 160,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  timeChip: {
    minWidth: 80,
  },
  budgetHint: {
    opacity: 0.85,
    marginBottom: SPACING.rowGap,
    fontSize: FONT.bodySmall,
  },
  budgetInput: {
    marginBottom: SPACING.rowGap,
  },
});

export default SettingsScreen;
