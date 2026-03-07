import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from 'react-native';
import type { SettingsScreenProps } from '../navigation/types';
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
  getNotificationDaysBefore,
  setNotificationDaysBefore,
} from '../utils/notificationSettings';

const DAYS_OPTIONS = [
  { value: 0, label: '당일' },
  { value: 1, label: '1일 전' },
  { value: 2, label: '2일 전' },
  { value: 3, label: '3일 전' },
  { value: 7, label: '7일 전' },
];

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [daysBefore, setDaysBeforeState] = useState(0);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← 뒤로</Text>
      </Pressable>

      <Text style={styles.title}>설정</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>기념일 알림</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>알림 사용</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#ccc', true: '#0a7ea4' }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.daysRow}>
          <Text style={styles.rowLabel}>알림 시점</Text>
          <View style={styles.daysOptions}>
            {DAYS_OPTIONS.map(({ value, label }) => (
              <Pressable
                key={value}
                style={[
                  styles.dayChip,
                  daysBefore === value && styles.dayChipActive,
                ]}
                onPress={() => handleSelectDaysBefore(value)}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    daysBefore === value && styles.dayChipTextActive,
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
    backgroundColor: '#fff',
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
  backButtonText: {
    fontSize: 16,
    color: '#0a7ea4',
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
    color: '#333',
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
    color: '#333',
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
  dayChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  dayChipActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  dayChipText: {
    fontSize: 14,
    color: '#333',
  },
  dayChipTextActive: {
    color: '#fff',
  },
});

export default SettingsScreen;
