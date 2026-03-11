import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from 'tamagui';
import { YStack, styled } from 'tamagui';
import { Calendar } from 'react-native-calendars';
import { LocaleConfig } from 'react-native-calendars';
import type { HomeScreenProps } from '../navigation/types';
import {
  getDBConnection,
  createTables,
  getSavedContacts,
  getEventsByContactId,
  getUpcomingEvents,
  getEventsByDateRange,
  removeContact,
  type SavedContactRow,
} from '../db/Database';
import type { EventWithDisplayName } from '../db/Database';
import {
  CONTACT_GROUP_FILTER_OPTIONS,
  getContactGroupLabel,
  getContactGroupEmoji,
} from '../constants/contactGroups';
import { cancelEventNotification } from '../services/notificationService';
import { getEventDisplayText } from '../constants/eventTypes';
import { getThemeColor, SPACING, FONT } from '../utils/themeColors';
import { HandDrawnButton } from '../components/HandDrawnButton';
import { HandDrawnCard } from '../components/HandDrawnCard';
import { HandDrawnInput } from '../components/HandDrawnInput';

LocaleConfig.locales.ko = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'ko';

const UPCOMING_EVENTS_LIMIT = 10;

type UpcomingEventItem = {
  id: number;
  contactId: string;
  type: string;
  date: string;
  memo: string;
  displayName?: string;
};

export type SavedContact = SavedContactRow;

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

type ViewMode = 'list' | 'calendar';

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEventItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [groupFilter, setGroupFilter] = useState<string>('');
  const [calendarCurrent, setCalendarCurrent] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [monthEvents, setMonthEvents] = useState<EventWithDisplayName[]>([]);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

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
      groupChipBorder: { borderColor: borderLight },
      groupChipText: { color },
    }),
    [accent, color, colorMuted, borderLight, borderLighter],
  );

  const filteredContacts = useMemo(() => {
    const q = normalizeSearchQuery(searchQuery);
    let list = q ? contacts.filter(c => matchContact(c, q)) : contacts;
    if (groupFilter) {
      list = list.filter(c => (c.group ?? '') === groupFilter);
    }
    const order = ['family', 'work', 'friend', 'other', ''];
    return [...list].sort((a, b) => {
      const ai = order.indexOf(a.group ?? '');
      const bi = order.indexOf(b.group ?? '');
      const idx = (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
      if (idx !== 0) return idx;
      return (a.displayName ?? '').localeCompare(b.displayName ?? '');
    });
  }, [contacts, searchQuery, groupFilter]);

  const loadContacts = useCallback(async () => {
    try {
      const db = await getDBConnection();
      await createTables(db);
      const saved = await getSavedContacts(db);
      setContacts(saved ?? []);
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

  /** 캘린더 뷰: 해당 월 이벤트 조회 (YYYY-MM-01 형식 current 사용) */
  const loadMonthEvents = useCallback(async (current: string) => {
    const [y, m] = current.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    try {
      const db = await getDBConnection();
      const events = await getEventsByDateRange(db, startDate, endDate);
      setMonthEvents(events);
    } catch (e) {
      console.error('Failed to load month events', e);
      setMonthEvents([]);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadContacts);
    return unsubscribe;
  }, [navigation, loadContacts]);

  useEffect(() => {
    if (viewMode === 'calendar') {
      loadMonthEvents(calendarCurrent);
    }
  }, [viewMode, calendarCurrent, loadMonthEvents]);

  const markedDates = useMemo(() => {
    const marked: Record<string, { marked?: boolean; selected?: boolean; selectedColor?: string; selectedTextColor?: string }> = {};
    const accentColor = getThemeColor(theme, 'red9') || getThemeColor(theme, 'red10') || '#ff4d4d';
    monthEvents.forEach((e) => {
      if (!e.date) return;
      if (!marked[e.date]) marked[e.date] = { marked: true };
      if (selectedCalendarDate === e.date) {
        marked[e.date] = { ...marked[e.date], selected: true, selectedColor: accentColor, selectedTextColor: '#fff' };
      }
    });
    if (selectedCalendarDate && !marked[selectedCalendarDate]) {
      marked[selectedCalendarDate] = { selected: true, selectedColor: accentColor, selectedTextColor: '#fff' };
    }
    return marked;
  }, [monthEvents, selectedCalendarDate, theme]);

  const selectedDayEvents = useMemo(
    () => (selectedCalendarDate ? monthEvents.filter((e) => e.date === selectedCalendarDate) : []),
    [monthEvents, selectedCalendarDate],
  );

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: 'transparent',
      calendarBackground: 'transparent',
      textSectionTitleColor: colorMuted,
      selectedDayBackgroundColor: accent,
      selectedDayTextColor: '#fff',
      todayTextColor: accent,
      dayTextColor: color,
      textDisabledColor: borderLighter,
      dotColor: accent,
      selectedDotColor: '#fff',
      monthTextColor: color,
      arrowColor: color,
      textMonthFontFamily: FONT.fontFamilyHeading,
      textDayFontFamily: FONT.fontFamilyBody,
      textDayHeaderFontFamily: FONT.fontFamilyBody,
    }),
    [accent, color, colorMuted, borderLighter],
  );

  const handleReselectContacts = () => {
    navigation.navigate('ContactSelect');
  };

  const handleOpenSettings = () => {
    navigation.navigate('Settings');
  };

  const handleOpenStatistics = () => {
    navigation.navigate('Statistics');
  };

  const handleOpenHelper = () => {
    navigation.navigate('Helper');
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
          <HandDrawnButton variant="secondary" onPress={handleOpenHelper}>
            도우미
          </HandDrawnButton>
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

      <View style={styles.viewToggleRow}>
        <HandDrawnButton
          variant={viewMode === 'list' ? 'primary' : 'secondary'}
          onPress={() => setViewMode('list')}
          style={styles.viewToggleButton}
        >
          목록
        </HandDrawnButton>
        <HandDrawnButton
          variant={viewMode === 'calendar' ? 'primary' : 'secondary'}
          onPress={() => setViewMode('calendar')}
          style={styles.viewToggleButton}
        >
          캘린더
        </HandDrawnButton>
      </View>

      {viewMode === 'list' ? (
        <>
          <HandDrawnInput
            placeholder="이름 또는 번호로 검색"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />

          <View style={styles.groupFilterRow}>
            <Pressable
              style={[
                styles.groupChip,
                themeStyles.groupChipBorder,
                !groupFilter && { backgroundColor: accent, borderColor: accent },
              ]}
              onPress={() => setGroupFilter('')}
            >
              <Text
                style={[
                  styles.groupChipText,
                  themeStyles.groupChipText,
                  !groupFilter && styles.groupChipTextActive,
                ]}
              >
                전체
              </Text>
            </Pressable>
            {CONTACT_GROUP_FILTER_OPTIONS.map(({ value, label, emoji }) => (
              <Pressable
                key={value}
                style={[
                  styles.groupChip,
                  themeStyles.groupChipBorder,
                  groupFilter === value && {
                    backgroundColor: accent,
                    borderColor: accent,
                  },
                ]}
                onPress={() => setGroupFilter(value)}
              >
                <Text
                  style={[
                    styles.groupChipText,
                    themeStyles.groupChipText,
                    groupFilter === value && styles.groupChipTextActive,
                  ]}
                >
                  {emoji} {label}
                </Text>
              </Pressable>
            ))}
          </View>

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
            <View style={styles.contactNameRow}>
              <Text style={[styles.contactName, themeStyles.contactName]}>
                {item.displayName || '이름 없음'}
              </Text>
              {(item.group ?? '').trim() ? (
                <Text style={[styles.groupChipSmall, themeStyles.phone]}>
                  {getContactGroupEmoji(item.group)} {getContactGroupLabel(item.group)}
                </Text>
              ) : null}
            </View>
            {item.phoneNumber ? (
              <Text style={[styles.phone, themeStyles.phone]}>{item.phoneNumber}</Text>
            ) : null}
          </Pressable>
        )}
        style={styles.list}
          />
        </>
      ) : (
        <ScrollView style={styles.calendarScroll} showsVerticalScrollIndicator={false}>
          <HandDrawnCard style={styles.calendarCard}>
            <Calendar
              current={calendarCurrent}
              onDayPress={(day) => setSelectedCalendarDate(day.dateString)}
              onMonthChange={(month) => setCalendarCurrent(`${month.year}-${String(month.month).padStart(2, '0')}-01`)}
              markedDates={markedDates}
              markingType="dot"
              theme={calendarTheme}
              enableSwipeMonths
              hideExtraDays={false}
            />
          </HandDrawnCard>
          <HandDrawnCard style={styles.calendarDayCard}>
            <Text style={[styles.upcomingSectionTitle, themeStyles.upcomingSectionTitle]}>
              {selectedCalendarDate
                ? `${selectedCalendarDate} 일정`
                : '날짜를 선택하세요'}
            </Text>
            {selectedCalendarDate &&
              (selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((item) => (
                  <Pressable
                    key={`${item.id}-${item.contactId}`}
                    style={[styles.upcomingRow, themeStyles.upcomingRow]}
                    onPress={() =>
                      navigation.navigate('ContactDetail', {
                        contactId: item.contactId,
                      })
                    }
                  >
                    <Text style={[styles.upcomingDate, themeStyles.upcomingDate]}>
                      {getEventDisplayText(item.type)}
                    </Text>
                    <Text style={[styles.upcomingLabel, themeStyles.upcomingLabel]}>
                      {item.displayName ?? '이름 없음'}
                    </Text>
                    {item.memo ? (
                      <Text
                        style={[styles.upcomingMemo, themeStyles.upcomingMemo]}
                        numberOfLines={1}
                      >
                        {item.memo}
                      </Text>
                    ) : null}
                  </Pressable>
                ))
              ) : (
                <Text style={[styles.summary, themeStyles.summary]}>
                  해당 날짜에 일정이 없습니다.
                </Text>
              ))}
          </HandDrawnCard>
        </ScrollView>
      )}
    </Container>
  );
};

const Container = styled(YStack, {});

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sectionGap,
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
  viewToggleRow: {
    flexDirection: 'row',
    gap: SPACING.itemGap,
    marginBottom: SPACING.rowGap,
  },
  viewToggleButton: {
    minWidth: 80,
  },
  searchInput: {
    marginBottom: SPACING.rowGap,
  },
  groupFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.rowGap,
  },
  groupChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  groupChipText: {
    fontSize: FONT.bodySmall,
    fontFamily: FONT.fontFamilyBody,
  },
  groupChipTextActive: {
    color: '#fff',
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  groupChipSmall: {
    fontSize: FONT.caption,
    fontFamily: FONT.fontFamilyBody,
  },
  calendarScroll: {
    flex: 1,
  },
  calendarCard: {
    marginBottom: SPACING.rowGap,
  },
  calendarDayCard: {
    marginBottom: SPACING.sectionGap,
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
