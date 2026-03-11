import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { useTheme } from 'tamagui';
import type { ContactDetailScreenProps } from '../navigation/types';
import {
  getDBConnection,
  createTables,
  getSavedContacts,
  getEventsByContactId,
  saveEvent,
  deleteEvent,
  type Event,
} from '../db/Database';
import {
  scheduleEventNotification,
  cancelEventNotification,
} from '../services/notificationService';
import {
  EVENT_TYPE_OPTIONS,
  getEventLabel,
  getEventDisplayText,
} from '../constants/eventTypes';
import { formatCurrency } from '../utils/format';
import {
  getNotificationDaysBefore,
  getNotificationTime,
  computeTriggerDate,
} from '../utils/notificationSettings';
import {
  getThemeColor,
  SPACING,
  RADIUS,
  FONT,
  WOBBLY_SM,
  WOBBLY_LG,
  HARD_SHADOW,
} from '../utils/themeColors';
import { HandDrawnButton } from '../components/HandDrawnButton';
import { HandDrawnCard } from '../components/HandDrawnCard';
import { HandDrawnInput } from '../components/HandDrawnInput';

type SavedContact = {
  contactId: string;
  displayName: string;
  phoneNumber: string;
};

const ContactDetailScreen: React.FC<ContactDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const theme = useTheme();
  const { contactId } = route.params;
  const [contact, setContact] = useState<SavedContact | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [notificationDisplay, setNotificationDisplay] = useState<{
    daysBefore: number;
    hour: number;
    minute: number;
  } | null>(null);

  const accent = getThemeColor(theme, 'blue9') || '#0a7ea4';
  const color = getThemeColor(theme, 'color') || '#333';
  const colorMuted = getThemeColor(theme, 'color11') || getThemeColor(theme, 'gray11') || '#666';
  const rawBg = (theme as { background?: { val?: string } | string }).background;
  const screenBg =
    (typeof rawBg === 'object' && rawBg?.val) || (typeof rawBg === 'string' ? rawBg : '') || '#fff';
  const borderLight = getThemeColor(theme, 'gray4') || '#eee';
  const red = getThemeColor(theme, 'red9') || getThemeColor(theme, 'red10') || '#c00';

  const themeStyles = useMemo(
    () => ({
      backButtonText: { color: accent, fontFamily: FONT.fontFamilyBody },
      name: { color, fontFamily: FONT.fontFamilyHeading },
      phone: { color: accent, fontFamily: FONT.fontFamilyBody },
      phoneHint: { color: colorMuted, fontFamily: FONT.fontFamilyBody },
      phoneEmpty: { color: colorMuted, fontFamily: FONT.fontFamilyBody },
      errorText: { color: colorMuted, fontFamily: FONT.fontFamilyBody },
      emptyEvents: { color: colorMuted, fontFamily: FONT.fontFamilyBody },
      eventRow: { borderBottomColor: borderLight },
      editEventButtonText: { color: accent, fontFamily: FONT.fontFamilyBody },
      deleteEventButtonText: { color: red, fontFamily: FONT.fontFamilyBody },
      eventDate: { color: colorMuted, fontFamily: FONT.fontFamilyBody },
      eventMemo: { color: colorMuted, fontFamily: FONT.fontFamilyBody },
      eventAmount: { color: accent, fontFamily: FONT.fontFamilyBody },
      eventType: { fontFamily: FONT.fontFamilyBody },
      sectionTitle: { color, fontFamily: FONT.fontFamilyHeading },
      totalExpense: { color: accent, fontFamily: FONT.fontFamilyBody },
    }),
    [accent, color, colorMuted, borderLight, red],
  );

  const loadData = useCallback(async () => {
    try {
      const db = await getDBConnection();
      await createTables(db);
      const saved = (await getSavedContacts(db)) as SavedContact[];
      const found = saved.find(c => c.contactId === contactId) ?? null;
      setContact(found);
      const eventList = await getEventsByContactId(db, contactId);
      setEvents(eventList);
      const [daysBefore, time] = await Promise.all([
        getNotificationDaysBefore(),
        getNotificationTime(),
      ]);
      setNotificationDisplay({
        daysBefore,
        hour: time.hour,
        minute: time.minute,
      });
    } catch (e) {
      console.error('Failed to load contact detail', e);
      setContact(null);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const handleCall = () => {
    if (contact?.phoneNumber) {
      Linking.openURL(`tel:${contact.phoneNumber}`);
    }
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setShowAddEvent(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowAddEvent(true);
  };

  const handleDeleteEvent = (eventId: number) => {
    Alert.alert(
      '기념일 삭제',
      '이 기념일을 삭제할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelEventNotification(eventId);
              const db = await getDBConnection();
              await deleteEvent(db, eventId);
              loadData();
              Toast.show({
                type: 'success',
                text1: '삭제 완료',
                text2: '기념일이 삭제되었습니다.',
              });
            } catch (e) {
              console.error('Failed to delete event', e);
              Toast.show({
                type: 'error',
                text1: '삭제 실패',
                text2: '기념일 삭제에 실패했습니다. 다시 시도해주세요.',
              });
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.screenRoot, { backgroundColor: screenBg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      </View>
    );
  }

  if (!contact) {
    return (
      <View style={[styles.screenRoot, { backgroundColor: screenBg }]}>
        <View style={styles.backButtonWrap}>
          <HandDrawnButton variant="secondary" onPress={() => navigation.goBack()}>
            ← 뒤로
          </HandDrawnButton>
        </View>
        <Text style={[styles.errorText, themeStyles.errorText]}>연락처를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screenRoot, { backgroundColor: screenBg }]}>
      <View style={styles.backButtonWrap}>
        <HandDrawnButton variant="secondary" onPress={() => navigation.goBack()}>
          ← 뒤로
        </HandDrawnButton>
      </View>

      <HandDrawnCard style={styles.headerCard}>
        <Text style={[styles.name, themeStyles.name]}>{contact.displayName || '이름 없음'}</Text>
        {contact.phoneNumber ? (
          <Pressable style={styles.phoneRow} onPress={handleCall}>
            <Text style={[styles.phone, themeStyles.phone]}>{contact.phoneNumber}</Text>
            <Text style={[styles.phoneHint, themeStyles.phoneHint]}>탭하여 전화걸기</Text>
          </Pressable>
        ) : (
          <Text style={[styles.phoneEmpty, themeStyles.phoneEmpty]}>전화번호 없음</Text>
        )}
      </HandDrawnCard>

      <View style={styles.eventsSection}>
        <View style={styles.eventsSectionHeader}>
          <Text style={[styles.eventsSectionTitle, themeStyles.sectionTitle]}>기념일</Text>
          <HandDrawnButton variant="primary" onPress={handleAddEvent}>
            기념일 추가
          </HandDrawnButton>
        </View>
        {(() => {
          const totalExpense = events.reduce(
            (sum, e) => sum + (e.expenseAmount ?? 0),
            0,
          );
          return totalExpense > 0 ? (
            <Text style={[styles.totalExpense, themeStyles.totalExpense]}>
              총 경조사비: {formatCurrency(totalExpense)}
            </Text>
          ) : null;
        })()}
        <FlatList
          data={events}
          keyExtractor={item => String(item.id)}
          style={styles.eventsList}
          ListEmptyComponent={
            <Text style={[styles.emptyEvents, themeStyles.emptyEvents]}>등록된 기념일이 없습니다.</Text>
          }
          renderItem={({ item }) => {
            const triggerInfo =
              notificationDisplay &&
              (() => {
                const trigger = computeTriggerDate(
                  item.date,
                  notificationDisplay.daysBefore,
                  notificationDisplay.hour,
                  notificationDisplay.minute,
                );
                const now = Date.now();
                const isPast = trigger.getTime() <= now;
                const m = trigger.getMonth() + 1;
                const d = trigger.getDate();
                const h = trigger.getHours();
                const min = trigger.getMinutes();
                return {
                  label: isPast
                    ? '알림 보냄'
                    : `알림 예정 ${m}/${d} ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
                  isPast,
                };
              })();
            return (
            <View style={[styles.eventRow, themeStyles.eventRow]}>
              <Pressable
                style={styles.eventRowContent}
                onLongPress={() => handleDeleteEvent(item.id)}
              >
                <Text style={[styles.eventType, themeStyles.eventType]}>
                  {getEventDisplayText(item.type)}
                </Text>
                <Text style={[styles.eventDate, themeStyles.eventDate]}>{item.date}</Text>
                {triggerInfo ? (
                  <Text style={[styles.eventMemo, themeStyles.eventMemo]}>
                    {triggerInfo.label}
                  </Text>
                ) : null}
                {item.memo ? (
                  <Text style={[styles.eventMemo, themeStyles.eventMemo]}>{item.memo}</Text>
                ) : null}
                {item.amount > 0 ? (
                  <Text style={[styles.eventAmount, themeStyles.eventAmount]}>{item.amount}주년</Text>
                ) : null}
                {(item.expenseAmount ?? 0) > 0 ? (
                  <Text style={[styles.eventAmount, themeStyles.eventAmount]}>
                    {formatCurrency(item.expenseAmount ?? 0)}
                  </Text>
                ) : null}
              </Pressable>
              <Pressable
                style={styles.editEventButton}
                onPress={() => handleEditEvent(item)}
              >
                <Text style={[styles.editEventButtonText, themeStyles.editEventButtonText]}>수정</Text>
              </Pressable>
              <Pressable
                style={styles.deleteEventButton}
                onPress={() => handleDeleteEvent(item.id)}
              >
                <Text style={[styles.deleteEventButtonText, themeStyles.deleteEventButtonText]}>삭제</Text>
              </Pressable>
            </View>
            );
          }}
        />
      </View>

      {showAddEvent && (
        <AddEventModal
          key={editingEvent?.id ?? 'add'}
          contactId={contactId}
          displayName={contact.displayName ?? '이름 없음'}
          initialEvent={editingEvent}
          onClose={() => {
            setShowAddEvent(false);
            setEditingEvent(null);
            loadData();
          }}
        />
      )}
    </View>
  );
};

type AddEventModalProps = {
  contactId: string;
  displayName: string;
  initialEvent?: Event | null;
  onClose: () => void;
};

/** YYYY-MM-DD 문자열을 로컬 Date로 변환 */
function parseDateString(dateStr: string): Date {
  const trimmed = dateStr.trim();
  if (!trimmed) return new Date();
  const [y, m, d] = trimmed.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  const parsed = new Date(y, m - 1, d);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/** 두 자리 패딩 (ES2015 호환) */
function pad2(n: number): string {
  const s = String(n);
  return s.length >= 2 ? s : '0' + s;
}

/** Date를 YYYY-MM-DD 문자열로 변환 (로컬 기준) */
function formatDateToYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

const AddEventModal: React.FC<AddEventModalProps> = ({
  contactId,
  displayName,
  initialEvent = null,
  onClose,
}) => {
  const modalTheme = useTheme();
  const isEditMode = initialEvent != null;
  const [type, setType] = useState<string>(
    () => initialEvent?.type ?? 'birthday',
  );
  const [date, setDate] = useState(() =>
    initialEvent?.date ?? formatDateToYYYYMMDD(new Date()),
  );
  const [memo, setMemo] = useState(() => initialEvent?.memo ?? '');
  const [amount, setAmount] = useState(() =>
    initialEvent && initialEvent.amount > 0
      ? String(initialEvent.amount)
      : '',
  );
  const [expenseAmount, setExpenseAmount] = useState(() =>
    initialEvent && (initialEvent.expenseAmount ?? 0) > 0
      ? String(initialEvent.expenseAmount)
      : '',
  );
  const [recurring, setRecurring] = useState(() => {
    if (initialEvent?.recurring !== undefined) return initialEvent.recurring;
    const t = initialEvent?.type ?? type;
    return t === 'birthday' || t === 'anniversary';
  });
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const pickerDate = useMemo(() => parseDateString(date), [date]);

  const modalAccent = getThemeColor(modalTheme, 'blue9') || '#0a7ea4';
  const modalBg = getThemeColor(modalTheme, 'background') || '#fff';
  const modalColor = getThemeColor(modalTheme, 'color') || '#333';
  const modalBorder = getThemeColor(modalTheme, 'borderColor') || '#ddd';
  const modalBgHover = getThemeColor(modalTheme, 'backgroundHover') || '#f9f9f9';

  const modalThemeStyles = useMemo(
    () => ({
      box: {
        backgroundColor: modalBg,
        borderColor: modalBorder,
        shadowColor: modalBorder,
        ...WOBBLY_LG,
        ...HARD_SHADOW,
        borderWidth: 2,
        shadowOpacity: 1,
      },
      title: { color: modalColor, fontFamily: FONT.fontFamilyHeading },
      label: { color: modalColor, fontFamily: FONT.fontFamilyBody },
      dateButton: {
        borderColor: modalBorder,
        backgroundColor: modalBgHover,
        ...WOBBLY_SM,
        borderWidth: 2,
      },
      dateButtonText: { color: modalColor, fontFamily: FONT.fontFamilyBody },
      typeButton: { borderColor: modalBorder, ...WOBBLY_SM, borderWidth: 2 },
      typeButtonActive: { backgroundColor: modalAccent, borderColor: modalAccent },
      typeButtonText: { color: modalColor, fontFamily: FONT.fontFamilyBody },
      typeButtonTextActive: { color: '#fff', fontFamily: FONT.fontFamilyBody },
    }),
    [modalBg, modalColor, modalBorder, modalBgHover, modalAccent],
  );

  const handleDateChange = useCallback(
    (event: { type: string }, selectedDate: Date | undefined) => {
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }
      if (Platform.OS === 'android' && (event.type === 'dismissed' || event.type === 'cancel')) {
        return;
      }
      if (selectedDate) {
        setDate(formatDateToYYYYMMDD(selectedDate));
      }
    },
    [],
  );

  const handleSave = async () => {
    const trimmedDate = date.trim();
    if (!trimmedDate) {
      Alert.alert('알림', '날짜를 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const db = await getDBConnection();
      const eventId = await saveEvent(db, {
        ...(initialEvent != null && { id: initialEvent.id }),
        contactId,
        type,
        amount: parseInt(amount, 10) || 0,
        expenseAmount: parseInt(expenseAmount, 10) || 0,
        date: trimmedDate,
        memo: memo.trim(),
        recurring,
      });
      if (initialEvent != null) {
        await cancelEventNotification(initialEvent.id);
      }
      const typeLabel = getEventLabel(type);
      const title = `${displayName} ${typeLabel}`;
      const body = trimmedDate + (memo.trim() ? ` · ${memo.trim()}` : '');
      await scheduleEventNotification(eventId, trimmedDate, title, body, recurring);
      Toast.show({
        type: 'success',
        text1: isEditMode ? '수정 완료' : '저장 완료',
        text2: isEditMode ? '기념일이 수정되었습니다.' : '기념일이 저장되었습니다.',
      });
      onClose();
    } catch (e) {
      console.error('Failed to save event', e);
      Toast.show({
        type: 'error',
        text1: '저장 실패',
        text2: '기념일 저장에 실패했습니다. 다시 시도해주세요.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        <Pressable style={[modalStyles.box, modalThemeStyles.box]} onPress={e => e.stopPropagation()}>
          <Text style={[modalStyles.title, modalThemeStyles.title]}>
            {isEditMode ? '기념일 수정' : '기념일 추가'}
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={[modalStyles.label, modalThemeStyles.label]}>유형</Text>
            <View style={modalStyles.typeRow}>
              {EVENT_TYPE_OPTIONS.map(({ value, label, emoji }) => (
                <Pressable
                  key={value}
                  style={[
                    modalStyles.typeButton,
                    modalThemeStyles.typeButton,
                    type === value && modalThemeStyles.typeButtonActive,
                  ]}
                  onPress={() => setType(value)}
                >
                  <Text
                    style={[
                      modalStyles.typeButtonText,
                      modalThemeStyles.typeButtonText,
                      type === value && modalThemeStyles.typeButtonTextActive,
                    ]}
                  >
                    {emoji} {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={[modalStyles.label, modalThemeStyles.label]}>날짜</Text>
            <Pressable
              style={[modalStyles.dateButton, modalThemeStyles.dateButton]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[modalStyles.dateButtonText, modalThemeStyles.dateButtonText]}>{date || '날짜 선택'}</Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
              />
            )}
            <View style={modalStyles.recurringRow}>
              <Text style={[modalStyles.label, modalThemeStyles.label]}>매년 알림</Text>
              <Switch
                value={recurring}
                onValueChange={setRecurring}
                trackColor={{ false: modalBorder, true: modalAccent }}
                thumbColor="#fff"
              />
            </View>
            <Text style={[modalStyles.label, modalThemeStyles.label]}>메모 (선택)</Text>
            <HandDrawnInput
              value={memo}
              onChangeText={setMemo}
              placeholder="메모"
              multiline
              inputStyle={modalStyles.inputMultiline}
              style={modalStyles.inputSpacer}
            />
            <Text style={[modalStyles.label, modalThemeStyles.label]}>N주년 (선택, 숫자만)</Text>
            <HandDrawnInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="number-pad"
              style={modalStyles.inputSpacer}
            />
            <Text style={[modalStyles.label, modalThemeStyles.label]}>경조사비 (원)</Text>
            <HandDrawnInput
              value={expenseAmount}
              onChangeText={setExpenseAmount}
              placeholder="0"
              keyboardType="number-pad"
              style={modalStyles.inputSpacer}
            />
          </ScrollView>
          <View style={modalStyles.actions}>
            <HandDrawnButton variant="secondary" onPress={onClose}>
              취소
            </HandDrawnButton>
            <HandDrawnButton variant="primary" onPress={handleSave} disabled={saving}>
              {saving ? '저장 중…' : '저장'}
            </HandDrawnButton>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.screenPadding,
  },
  box: {
    padding: SPACING.sectionGap,
    minWidth: 280,
    maxWidth: 360,
    maxHeight: '82%',
  },
  title: {
    fontSize: FONT.sectionTitle,
    fontWeight: '600',
    marginBottom: SPACING.rowGap,
  },
  label: {
    fontSize: FONT.bodySmall,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputSpacer: {
    marginBottom: SPACING.rowGap,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  dateButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: SPACING.rowGap,
  },
  recurringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.rowGap,
  },
  dateButtonText: {
    fontSize: FONT.body,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.itemGap,
    marginBottom: SPACING.rowGap,
  },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 40,
    justifyContent: 'center',
  },
  typeButtonText: {
    fontSize: FONT.bodySmall,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.rowGap,
    marginTop: SPACING.rowGap,
    paddingTop: SPACING.rowGap,
  },
});

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    padding: SPACING.screenPadding,
    paddingTop: SPACING.screenPadding + 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonWrap: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.rowGap,
  },
  headerCard: {
    marginBottom: SPACING.sectionGap,
  },
  name: {
    fontSize: FONT.title,
    fontWeight: '700',
    marginBottom: SPACING.itemGap,
  },
  phoneRow: {
    marginBottom: 0,
  },
  phone: {
    fontSize: FONT.body,
  },
  phoneHint: {
    fontSize: FONT.caption,
    marginTop: 4,
  },
  phoneEmpty: {
    fontSize: FONT.bodySmall,
    marginBottom: 0,
  },
  errorText: {
    fontSize: FONT.body,
  },
  eventsSection: {
    flex: 1,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.rowGap,
  },
  eventsSectionTitle: {
    fontSize: FONT.sectionTitle,
    fontWeight: '600',
  },
  totalExpense: {
    fontSize: FONT.bodySmall,
    marginBottom: SPACING.itemGap,
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    minHeight: SPACING.touchTargetMin,
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: FONT.bodySmall,
    fontWeight: '600',
  },
  eventsList: {
    flex: 1,
  },
  emptyEvents: {
    fontSize: FONT.bodySmall,
    paddingVertical: SPACING.sectionGap,
    textAlign: 'center',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.rowGap,
    paddingHorizontal: SPACING.itemGap,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  eventRowContent: {
    flex: 1,
  },
  editEventButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 36,
    justifyContent: 'center',
  },
  editEventButtonText: {
    fontSize: FONT.bodySmall,
    fontWeight: '500',
  },
  deleteEventButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 36,
    justifyContent: 'center',
  },
  deleteEventButtonText: {
    fontSize: FONT.bodySmall,
    fontWeight: '500',
  },
  eventType: {
    fontSize: FONT.body,
    fontWeight: '600',
  },
  eventDate: {
    fontSize: FONT.bodySmall,
    marginTop: 4,
  },
  eventMemo: {
    fontSize: FONT.bodySmall,
    marginTop: 4,
  },
  eventAmount: {
    fontSize: FONT.caption,
    marginTop: 4,
  },
});

export default ContactDetailScreen;
