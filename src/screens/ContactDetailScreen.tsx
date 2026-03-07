import React, { useState, useCallback, useEffect } from 'react';
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
} from 'react-native';
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

type SavedContact = {
  contactId: string;
  displayName: string;
  phoneNumber: string;
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  birthday: '생일',
  anniversary: '기념일',
  other: '기타',
};

const ContactDetailScreen: React.FC<ContactDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { contactId } = route.params;
  const [contact, setContact] = useState<SavedContact | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEvent, setShowAddEvent] = useState(false);

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
              const db = await getDBConnection();
              await deleteEvent(db, eventId);
              loadData();
            } catch (e) {
              console.error('Failed to delete event', e);
            }
          },
        },
      ],
    );
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

  if (!contact) {
    return (
      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </Pressable>
        <Text style={styles.errorText}>연락처를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← 뒤로</Text>
      </Pressable>

      <Text style={styles.name}>{contact.displayName || '이름 없음'}</Text>
      {contact.phoneNumber ? (
        <Pressable style={styles.phoneRow} onPress={handleCall}>
          <Text style={styles.phone}>{contact.phoneNumber}</Text>
          <Text style={styles.phoneHint}>탭하여 전화걸기</Text>
        </Pressable>
      ) : (
        <Text style={styles.phoneEmpty}>전화번호 없음</Text>
      )}

      <View style={styles.eventsSection}>
        <View style={styles.eventsSectionHeader}>
          <Text style={styles.eventsSectionTitle}>기념일</Text>
          <Pressable style={styles.addButton} onPress={handleAddEvent}>
            <Text style={styles.addButtonText}>기념일 추가</Text>
          </Pressable>
        </View>
        <FlatList
          data={events}
          keyExtractor={item => String(item.id)}
          style={styles.eventsList}
          ListEmptyComponent={
            <Text style={styles.emptyEvents}>등록된 기념일이 없습니다.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.eventRow}>
              <Pressable
                style={styles.eventRowContent}
                onLongPress={() => handleDeleteEvent(item.id)}
              >
                <Text style={styles.eventType}>
                  {EVENT_TYPE_LABEL[item.type] ?? item.type}
                </Text>
                <Text style={styles.eventDate}>{item.date}</Text>
                {item.memo ? (
                  <Text style={styles.eventMemo}>{item.memo}</Text>
                ) : null}
                {item.amount > 0 ? (
                  <Text style={styles.eventAmount}>{item.amount}주년</Text>
                ) : null}
              </Pressable>
              <Pressable
                style={styles.deleteEventButton}
                onPress={() => handleDeleteEvent(item.id)}
              >
                <Text style={styles.deleteEventButtonText}>삭제</Text>
              </Pressable>
            </View>
          )}
        />
      </View>

      {showAddEvent && (
        <AddEventModal
          contactId={contactId}
          onClose={() => {
            setShowAddEvent(false);
            loadData();
          }}
        />
      )}
    </View>
  );
};

type AddEventModalProps = {
  contactId: string;
  onClose: () => void;
};

const EVENT_TYPES = [
  { value: 'birthday', label: '생일' },
  { value: 'anniversary', label: '기념일' },
  { value: 'other', label: '기타' },
] as const;

const AddEventModal: React.FC<AddEventModalProps> = ({
  contactId,
  onClose,
}) => {
  const [type, setType] = useState<string>('birthday');
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [memo, setMemo] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmedDate = date.trim();
    if (!trimmedDate) {
      Alert.alert('알림', '날짜를 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const db = await getDBConnection();
      await saveEvent(db, {
        contactId,
        type,
        amount: parseInt(amount, 10) || 0,
        date: trimmedDate,
        memo: memo.trim(),
      });
      onClose();
    } catch (e) {
      console.error('Failed to save event', e);
      Alert.alert('오류', '저장에 실패했습니다.');
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
        <Pressable style={modalStyles.box} onPress={e => e.stopPropagation()}>
          <Text style={modalStyles.title}>기념일 추가</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={modalStyles.label}>유형</Text>
            <View style={modalStyles.typeRow}>
              {EVENT_TYPES.map(({ value, label }) => (
                <Pressable
                  key={value}
                  style={[
                    modalStyles.typeButton,
                    type === value && modalStyles.typeButtonActive,
                  ]}
                  onPress={() => setType(value)}
                >
                  <Text
                    style={[
                      modalStyles.typeButtonText,
                      type === value && modalStyles.typeButtonTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={modalStyles.label}>날짜 (YYYY-MM-DD)</Text>
            <TextInput
              style={modalStyles.input}
              value={date}
              onChangeText={setDate}
              placeholder="2025-01-15"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
            <Text style={modalStyles.label}>메모 (선택)</Text>
            <TextInput
              style={[modalStyles.input, modalStyles.inputMultiline]}
              value={memo}
              onChangeText={setMemo}
              placeholder="메모"
              placeholderTextColor="#999"
              multiline
            />
            <Text style={modalStyles.label}>N주년 (선택, 숫자만)</Text>
            <TextInput
              style={modalStyles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />
          </ScrollView>
          <View style={modalStyles.actions}>
            <Pressable
              style={[modalStyles.closeButton, modalStyles.cancelButton]}
              onPress={onClose}
            >
              <Text style={modalStyles.cancelButtonText}>취소</Text>
            </Pressable>
            <Pressable
              style={modalStyles.closeButton}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={modalStyles.closeButtonText}>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    minWidth: 280,
    maxWidth: 360,
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  typeButtonActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: '#666',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 15,
  },
});

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
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  phoneRow: {
    marginBottom: 24,
  },
  phone: {
    fontSize: 16,
    color: '#0a7ea4',
  },
  phoneHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  phoneEmpty: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  eventsSection: {
    flex: 1,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  eventsList: {
    flex: 1,
  },
  emptyEvents: {
    fontSize: 14,
    color: '#888',
    paddingVertical: 24,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  eventRowContent: {
    flex: 1,
  },
  deleteEventButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteEventButtonText: {
    fontSize: 13,
    color: '#c00',
  },
  eventType: {
    fontSize: 16,
    fontWeight: '500',
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  eventMemo: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  eventAmount: {
    fontSize: 12,
    color: '#0a7ea4',
    marginTop: 4,
  },
});

export default ContactDetailScreen;
