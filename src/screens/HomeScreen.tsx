import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { YStack, styled } from 'tamagui';
import type { HomeScreenProps } from '../navigation/types';
import {
  getDBConnection,
  createTables,
  getSavedContacts,
  getEventsByContactId,
  getUpcomingEvents,
  removeContact,
} from '../db/Database';
import { cancelEventNotification } from '../services/notificationService';

const UPCOMING_EVENTS_LIMIT = 10;

type UpcomingEventItem = {
  id: number;
  contactId: string;
  type: string;
  date: string;
  memo: string;
  displayName?: string;
};

export type SavedContact = {
  contactId: string;
  displayName: string;
  phoneNumber: string;
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  birthday: '생일',
  anniversary: '기념일',
  other: '기타',
};

/** 검색어 정규화: 소문자·공백 제거 후 includes 매칭용 */
function normalizeSearchQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, '');
}

function matchContact(contact: SavedContact, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  const name = normalizeSearchQuery(contact.displayName ?? '');
  const phone = normalizeSearchQuery(contact.phoneNumber ?? '');
  return name.includes(normalizedQuery) || phone.includes(normalizedQuery);
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEventItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = useMemo(() => {
    const q = normalizeSearchQuery(searchQuery);
    return q ? contacts.filter(c => matchContact(c, q)) : contacts;
  }, [contacts, searchQuery]);

  const loadContacts = useCallback(async () => {
    try {
      const db = await getDBConnection();
      await createTables(db);
      const saved = await getSavedContacts(db);
      setContacts((saved as SavedContact[]) ?? []);
      const upcoming = await getUpcomingEvents(db, UPCOMING_EVENTS_LIMIT);
      setUpcomingEvents(upcoming as UpcomingEventItem[]);
    } catch (e) {
      console.error('Failed to load contacts on home', e);
      setContacts([]);
      setUpcomingEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadContacts);
    return unsubscribe;
  }, [navigation, loadContacts]);

  const handleReselectContacts = () => {
    navigation.navigate('ContactSelect');
  };

  const handleOpenSettings = () => {
    navigation.navigate('Settings');
  };

  const handleRemoveContact = useCallback(
    (contact: SavedContact) => {
      Alert.alert(
        '저장 목록에서 제거',
        `"${contact.displayName || '이름 없음'}"을(를) 저장 목록에서 제거할까요? 관련 기념일도 함께 삭제됩니다.`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '제거',
            style: 'destructive',
            onPress: async () => {
              try {
                const db = await getDBConnection();
                const events = await getEventsByContactId(db, contact.contactId);
                for (const event of events) {
                  await cancelEventNotification(event.id);
                }
                await removeContact(db, contact.contactId);
                await loadContacts();
                Toast.show({
                  type: 'success',
                  text1: '제거 완료',
                  text2: '저장 목록에서 연락처가 제거되었습니다.',
                });
              } catch (e) {
                console.error('Failed to remove contact', e);
                Toast.show({
                  type: 'error',
                  text1: '제거 실패',
                  text2: '연락처를 제거하는 중 오류가 발생했습니다. 다시 시도해주세요.',
                });
              }
            },
          },
        ],
      );
    },
    [loadContacts],
  );

  if (loading) {
    return (
      <Container flex={1} alignItems="center" justifyContent="center">
        <ActivityIndicator size="large" color="#0000ff" />
      </Container>
    );
  }

  const renderListHeader = () =>
    upcomingEvents.length > 0 ? (
      <View style={styles.upcomingSection}>
        <Text style={styles.upcomingSectionTitle}>다가오는 기념일</Text>
        {upcomingEvents.map(item => (
          <Pressable
            key={`${item.id}-${item.contactId}`}
            style={styles.upcomingRow}
            onPress={() =>
              navigation.navigate('ContactDetail', {
                contactId: item.contactId,
              })
            }
          >
            <Text style={styles.upcomingDate}>{item.date}</Text>
            <Text style={styles.upcomingLabel}>
              {EVENT_TYPE_LABEL[item.type] ?? item.type}
              {item.displayName ? ` · ${item.displayName}` : ''}
            </Text>
            {item.memo ? (
              <Text style={styles.upcomingMemo} numberOfLines={1}>
                {item.memo}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </View>
    ) : null;

  return (
    <Container flex={1} padding="$4" backgroundColor="$background">
      <View style={styles.headerRow}>
        <Text style={styles.header}>Memorit</Text>
        <Pressable style={styles.settingsButton} onPress={handleOpenSettings}>
          <Text style={styles.settingsButtonText}>설정</Text>
        </Pressable>
      </View>
      <Text style={styles.summary}>{contacts.length}명의 연락처</Text>

      <Pressable style={styles.reselectButton} onPress={handleReselectContacts}>
        <Text style={styles.reselectButtonText}>연락처 다시 선택</Text>
      </Pressable>

      <TextInput
        style={styles.searchInput}
        placeholder="이름 또는 번호로 검색"
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredContacts}
        keyExtractor={item => item.contactId}
        ListHeaderComponent={renderListHeader}
        renderItem={({ item }) => (
          <Pressable
            style={styles.contactRow}
            onPress={() =>
              navigation.navigate('ContactDetail', { contactId: item.contactId })
            }
            onLongPress={() => handleRemoveContact(item)}
          >
            <Text style={styles.contactName}>
              {item.displayName || '이름 없음'}
            </Text>
            {item.phoneNumber ? (
              <Text style={styles.phone}>{item.phoneNumber}</Text>
            ) : null}
          </Pressable>
        )}
        style={styles.list}
      />
    </Container>
  );
};

const Container = styled(YStack, {});

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  settingsButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  settingsButtonText: {
    fontSize: 15,
    color: '#0a7ea4',
  },
  summary: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  reselectButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  reselectButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  upcomingSection: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  upcomingSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  upcomingRow: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  upcomingDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0a7ea4',
  },
  upcomingLabel: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  upcomingMemo: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  contactRow: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
});

export default HomeScreen;
