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
  TextInput,
  ScrollView,
  Alert,
  Platform,
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
import { getThemeColor, SPACING, RADIUS, FONT } from '../utils/themeColors';

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

  const accent = getThemeColor(theme, 'blue9') || '#0a7ea4';
  const color = getThemeColor(theme, 'color') || '#333';
  const colorMuted = getThemeColor(theme, 'color11') || getThemeColor(theme, 'gray11') || '#666';
  const borderColor = getThemeColor(theme, 'borderColor') || '#ddd';
  const bgHover = getThemeColor(theme, 'backgroundHover') || '#f9f9f9';
  /** AppShell과 동일한 방식으로 배경색 해석 (네이티브 스택 기본 배경 회피) */
  const rawBg = (theme as { background?: { val?: string } | string }).background;
  const screenBg =
    (typeof rawBg === 'object' && rawBg?.val) || (typeof rawBg === 'string' ? rawBg : '') || '#fff';
  const placeholderColor = getThemeColor(theme, 'placeholderColor') || '#999';
  const borderLight = getThemeColor(theme, 'gray4') || '#eee';
  const red = getThemeColor(theme, 'red9') || getThemeColor(theme, 'red10') || '#c00';

  const themeStyles = useMemo(
    () => ({
      backButtonText: { color: accent },
      name: { color },
      phone: { color: accent },
      phoneHint: { color: colorMuted },
      phoneEmpty: { color: colorMuted },
      errorText: { color: colorMuted },
      addButton: { backgroundColor: accent },
      addButtonText: { color: '#fff' },
      emptyEvents: { color: colorMuted },
      eventRow: { borderBottomColor: borderLight },
      editEventButtonText: { color: accent },
      deleteEventButtonText: { color: red },
      eventDate: { color: colorMuted },
      eventMemo: { color: colorMuted },
      eventAmount: { color: accent },
    }),
    [accent, color, colorMuted, borderColor, bgHover, borderLight, red],
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
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backButtonText, themeStyles.backButtonText]}>← 뒤로</Text>
        </Pressable>
        <Text style={[styles.errorText, themeStyles.errorText]}>연락처를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screenRoot, { backgroundColor: screenBg }]}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={[styles.backButtonText, themeStyles.backButtonText]}>← 뒤로</Text>
      </Pressable>

      <View style={[styles.headerCard, { backgroundColor: bgHover, borderColor: borderLight }]}>
        <Text style={[styles.name, themeStyles.name]}>{contact.displayName || '이름 없음'}</Text>
        {contact.phoneNumber ? (
          <Pressable style={styles.phoneRow} onPress={handleCall}>
            <Text style={[styles.phone, themeStyles.phone]}>{contact.phoneNumber}</Text>
            <Text style={[styles.phoneHint, themeStyles.phoneHint]}>탭하여 전화걸기</Text>
          </Pressable>
        ) : (
          <Text style={[styles.phoneEmpty, themeStyles.phoneEmpty]}>전화번호 없음</Text>
        )}
      </View>

      <View style={styles.eventsSection}>
        <View style={styles.eventsSectionHeader}>
          <Text style={[styles.eventsSectionTitle, themeStyles.name]}>기념일</Text>
          <Pressable style={[styles.addButton, themeStyles.addButton]} onPress={handleAddEvent}>
            <Text style={[styles.addButtonText, themeStyles.addButtonText]}>기념일 추가</Text>
          </Pressable>
        </View>
        {(() => {
          const totalExpense = events.reduce(
            (sum, e) => sum + (e.expenseAmount ?? 0),
            0,
          );
          return totalExpense > 0 ? (
            <Text style={[styles.totalExpense, themeStyles.eventAmount]}>
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
          renderItem={({ item }) => (
            <View style={[styles.eventRow, themeStyles.eventRow]}>
              <Pressable
                style={styles.eventRowContent}
                onLongPress={() => handleDeleteEvent(item.id)}
              >
                <Text style={[styles.eventType, themeStyles.name]}>
                  {getEventDisplayText(item.type)}
                </Text>
                <Text style={[styles.eventDate, themeStyles.eventDate]}>{item.date}</Text>
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
          )}
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
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const pickerDate = useMemo(() => parseDateString(date), [date]);

  const modalAccent = getThemeColor(modalTheme, 'blue9') || '#0a7ea4';
  const modalBg = getThemeColor(modalTheme, 'background') || '#fff';
  const modalColor = getThemeColor(modalTheme, 'color') || '#333';
  const modalBorder = getThemeColor(modalTheme, 'borderColor') || '#ddd';
  const modalBgHover = getThemeColor(modalTheme, 'backgroundHover') || '#f9f9f9';
  const modalColorMuted = getThemeColor(modalTheme, 'color11') || getThemeColor(modalTheme, 'gray11') || '#666';
  const modalPlaceholder = getThemeColor(modalTheme, 'placeholderColor') || '#999';

  const modalThemeStyles = useMemo(
    () => ({
      box: { backgroundColor: modalBg },
      title: { color: modalColor },
      label: { color: modalColor },
      input: { borderColor: modalBorder },
      dateButton: { borderColor: modalBorder, backgroundColor: modalBgHover },
      dateButtonText: { color: modalColor },
      typeButton: { borderColor: modalBorder },
      typeButtonActive: { backgroundColor: modalAccent, borderColor: modalAccent },
      typeButtonText: { color: modalColor },
      typeButtonTextActive: { color: '#fff' },
      cancelButtonText: { color: modalColorMuted },
      closeButton: { backgroundColor: modalAccent },
      closeButtonText: { color: '#fff' },
    }),
    [modalBg, modalColor, modalBorder, modalBgHover, modalColorMuted, modalAccent],
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
      });
      if (initialEvent != null) {
        await cancelEventNotification(initialEvent.id);
      }
      const typeLabel = getEventLabel(type);
      const title = `${displayName} ${typeLabel}`;
      const body = trimmedDate + (memo.trim() ? ` · ${memo.trim()}` : '');
      await scheduleEventNotification(eventId, trimmedDate, title, body);
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
            <Text style={[modalStyles.label, modalThemeStyles.label]}>메모 (선택)</Text>
            <TextInput
              style={[modalStyles.input, modalStyles.inputMultiline, modalThemeStyles.input]}
              value={memo}
              onChangeText={setMemo}
              placeholder="메모"
              placeholderTextColor={modalPlaceholder}
              multiline
            />
            <Text style={[modalStyles.label, modalThemeStyles.label]}>N주년 (선택, 숫자만)</Text>
            <TextInput
              style={[modalStyles.input, modalThemeStyles.input]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={modalPlaceholder}
              keyboardType="number-pad"
            />
            <Text style={[modalStyles.label, modalThemeStyles.label]}>경조사비 (원)</Text>
            <TextInput
              style={[modalStyles.input, modalThemeStyles.input]}
              value={expenseAmount}
              onChangeText={setExpenseAmount}
              placeholder="0"
              placeholderTextColor={modalPlaceholder}
              keyboardType="number-pad"
            />
          </ScrollView>
          <View style={modalStyles.actions}>
            <Pressable
              style={[modalStyles.closeButton, modalStyles.cancelButton]}
              onPress={onClose}
            >
              <Text style={[modalStyles.cancelButtonText, modalThemeStyles.cancelButtonText]}>취소</Text>
            </Pressable>
            <Pressable
              style={[modalStyles.closeButton, modalThemeStyles.closeButton]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={[modalStyles.closeButtonText, modalThemeStyles.closeButtonText]}>
                {saving ? '저장 중…' : '저장'}
              </Text>
            </Pressable>
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
    borderRadius: RADIUS.lg,
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
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: FONT.body,
    marginBottom: SPACING.rowGap,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: SPACING.rowGap,
  },
  dateButtonText: {
    fontSize: FONT.body,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
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
    borderRadius: RADIUS.md,
    borderWidth: 1,
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
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonText: {},
  closeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: FONT.body,
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  screenRoot: {
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
  backButtonText: {
    fontSize: FONT.body,
  },
  headerCard: {
    padding: SPACING.rowGap,
    borderRadius: RADIUS.md,
    borderWidth: 1,
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
