import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from 'tamagui';
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
import { getEventDisplayText } from '../constants/eventTypes';
import { getThemeColor, SPACING, FONT } from '../utils/themeColors';
import { HandDrawnButton } from '../components/HandDrawnButton';
import { HandDrawnCard } from '../components/HandDrawnCard';
import { HandDrawnInput } from '../components/HandDrawnInput';

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
  const theme = useTheme();
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEventItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const accent = getThemeColor(theme, 'red9') || getThemeColor(theme, 'red10') || '#ff4d4d';
  const color = getThemeColor(theme, 'color') || '#2d2d2d';
  const colorMuted = getThemeColor(theme, 'color11') || getThemeColor(theme, 'gray11') || '#666';
  const borderLight = getThemeColor(theme, 'gray4') || '#eee';
  const borderLighter = getThemeColor(theme, 'gray3') || '#f0f0f0';

  const themeStyles = useMemo(
    () => ({
      summary: { color: colorMuted },
      upcomingRow: { borderBottomColor: borderLighter },
      upcomingSectionTitle: { color },
      upcomingDate: { color: accent },
      upcomingLabel: { color },
      upcomingMemo: { color: colorMuted },
      contactRow: { borderBottomColor: borderLight },
      contactName: { color },
      phone: { color: colorMuted },
    }),
    [accent, color, colorMuted, borderLight, borderLighter],
  );

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

  const handleOpenStatistics = () => {
    navigation.navigate('Statistics');
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
        <ActivityIndicator size="large" color={accent} />
      </Container>
    );
  }

  const renderListHeader = () =>
    upcomingEvents.length > 0 ? (
      <HandDrawnCard style={styles.upcomingCardWrap}>
        <Text style={[styles.upcomingSectionTitle, themeStyles.upcomingSectionTitle]}>
          다가오는 기념일
        </Text>
        {upcomingEvents.map(item => (
          <Pressable
            key={`${item.id}-${item.contactId}`}
            style={[styles.upcomingRow, themeStyles.upcomingRow]}
            onPress={() =>
              navigation.navigate('ContactDetail', {
                contactId: item.contactId,
              })
            }
          >
            <Text style={[styles.upcomingDate, themeStyles.upcomingDate]}>{item.date}</Text>
            <Text style={[styles.upcomingLabel, themeStyles.upcomingLabel]}>
              {getEventDisplayText(item.type)}
              {item.displayName ? ` · ${item.displayName}` : ''}
            </Text>
            {item.memo ? (
              <Text style={[styles.upcomingMemo, themeStyles.upcomingMemo]} numberOfLines={1}>
                {item.memo}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </HandDrawnCard>
    ) : null;

  return (
    <Container flex={1} padding={SPACING.screenPadding} backgroundColor="$background">
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color }]}>Memorit</Text>
        <View style={styles.headerButtons}>
          <HandDrawnButton variant="secondary" onPress={handleOpenStatistics}>
            통계
          </HandDrawnButton>
          <HandDrawnButton variant="secondary" onPress={handleOpenSettings}>
            설정
          </HandDrawnButton>
        </View>
      </View>
      <Text style={[styles.summary, themeStyles.summary]}>{contacts.length}명의 연락처</Text>

      <View style={styles.reselectButtonWrap}>
        <HandDrawnButton variant="primary" onPress={handleReselectContacts}>
          연락처 다시 선택
        </HandDrawnButton>
      </View>

      <HandDrawnInput
        placeholder="이름 또는 번호로 검색"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
      />

      <FlatList
        data={filteredContacts}
        keyExtractor={item => item.contactId}
        ListHeaderComponent={renderListHeader}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.contactRow, themeStyles.contactRow]}
            onPress={() =>
              navigation.navigate('ContactDetail', { contactId: item.contactId })
            }
            onLongPress={() => handleRemoveContact(item)}
          >
            <Text style={[styles.contactName, themeStyles.contactName]}>
              {item.displayName || '이름 없음'}
            </Text>
            {item.phoneNumber ? (
              <Text style={[styles.phone, themeStyles.phone]}>{item.phoneNumber}</Text>
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
    marginBottom: SPACING.itemGap,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: SPACING.itemGap,
  },
  header: {
    fontSize: FONT.title,
    fontWeight: '700',
    fontFamily: FONT.fontFamilyHeading,
  },
  summary: {
    fontSize: FONT.body,
    fontFamily: FONT.fontFamilyBody,
    marginBottom: SPACING.rowGap,
  },
  reselectButtonWrap: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.rowGap,
  },
  searchInput: {
    marginBottom: SPACING.rowGap,
  },
  upcomingCardWrap: {
    marginBottom: SPACING.rowGap,
  },
  upcomingSectionTitle: {
    fontSize: FONT.sectionTitle,
    fontWeight: '600',
    fontFamily: FONT.fontFamilyHeading,
    marginBottom: SPACING.itemGap,
  },
  upcomingRow: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.itemGap,
    borderBottomWidth: 1,
    minHeight: 52,
    justifyContent: 'center',
  },
  upcomingDate: {
    fontSize: FONT.bodySmall,
    fontWeight: '600',
    fontFamily: FONT.fontFamilyBody,
  },
  upcomingLabel: {
    fontSize: FONT.bodySmall,
    fontFamily: FONT.fontFamilyBody,
    marginTop: 4,
  },
  upcomingMemo: {
    fontSize: FONT.caption,
    fontFamily: FONT.fontFamilyBody,
    marginTop: 4,
  },
  contactRow: {
    paddingVertical: SPACING.rowGap,
    paddingHorizontal: SPACING.itemGap,
    borderBottomWidth: 1,
    minHeight: 56,
    justifyContent: 'center',
  },
  contactName: {
    fontSize: FONT.body,
    fontWeight: '600',
    fontFamily: FONT.fontFamilyBody,
  },
  phone: {
    fontSize: FONT.bodySmall,
    fontFamily: FONT.fontFamilyBody,
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
});

export default HomeScreen;
