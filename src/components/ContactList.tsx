import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { useTheme } from 'tamagui';
import { YStack, styled } from 'tamagui';
import type { RootStackParamList } from '../navigation/types';
import { useContacts, type ContactType } from '../hooks/useContacts';
import {
  getDBConnection,
  createTables,
  getContactsCount,
  saveContacts,
  getSavedContacts,
  type SavedContactRow,
} from '../db/Database';
import {
  CONTACT_GROUP_FILTER_OPTIONS,
  getContactGroupLabel,
  getContactGroupEmoji,
} from '../constants/contactGroups';
import { getThemeColor, SPACING, FONT, WOBBLY_SM, HAND_DRAWN_LIGHT } from '../utils/themeColors';
import { HandDrawnButton } from './HandDrawnButton';
import { HandDrawnInput } from './HandDrawnInput';

type ContactListNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ContactSelect'
>;

/** 검색어 정규화: 소문자·공백 제거 후 includes 매칭용 */
function normalizeSearchQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, '');
}

/** 연락처 항목에서 검색 대상 문자열 추출 (select/imported 모드 공통) */
function getSearchableText(item: {
  displayName?: string;
  phoneNumbers?: { number?: string }[];
  phoneNumber?: string;
}): string {
  const name = item.displayName ?? '';
  const phone =
    Array.isArray(item.phoneNumbers) && item.phoneNumbers.length > 0
      ? item.phoneNumbers[0].number ?? ''
      : item.phoneNumber ?? '';
  return `${name} ${phone}`;
}

const ContactList: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<ContactListNavigationProp>();
  const accent = getThemeColor(theme, 'red9') || getThemeColor(theme, 'red10') || HAND_DRAWN_LIGHT.accent;
  const colorMuted = getThemeColor(theme, 'color11') || getThemeColor(theme, 'gray11') || '#666';
  const placeholderColor = getThemeColor(theme, 'placeholderColor') || '#999';
  const borderLight = getThemeColor(theme, 'gray4') || '#eee';
  const color = getThemeColor(theme, 'color') || '#333';
  const borderColor = getThemeColor(theme, 'borderColor') || '#2d2d2d';
  const themeStyles = useMemo(
    () => ({
      title: { color, fontFamily: FONT.fontFamilyHeading },
      contactRow: { borderBottomColor: borderLight },
      phone: { color: colorMuted, fontFamily: FONT.fontFamilyBody },
      contactName: { color, fontFamily: FONT.fontFamilyBody },
      groupChipBorder: { borderColor: borderLight },
      groupChipText: { color, fontFamily: FONT.fontFamilyBody },
      checkboxBorder: { borderColor },
    }),
    [borderLight, colorMuted, color, borderColor],
  );

  const onPermissionDenied = useCallback(() => {
    Toast.show({
      type: 'error',
      text1: '권한 거부',
      text2: '연락처를 불러오기 위해 접근 권한을 허용해주세요.',
    });
  }, []);
  const onFetchError = useCallback(() => {
    Toast.show({
      type: 'error',
      text1: '연락처 불러오기 실패',
      text2: '연락처를 불러올 수 없습니다. 다시 시도해주세요.',
    });
  }, []);
  const { contacts, loading } = useContacts({ onPermissionDenied, onFetchError });

  type ImportedContactItem = SavedContactRow & {
    recordID?: string;
    phoneNumbers?: { number?: string }[];
  };

  type ListItem = ContactType | ImportedContactItem;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<'select' | 'imported'>('select');
  const [importedContacts, setImportedContacts] = useState<ImportedContactItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('');

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(contacts.map((c: any) => c.recordID)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const importSelected = async () => {
    const picked = contacts.filter((c: ContactType) => selectedIds.has(c.recordID));
    try {
      const db = await getDBConnection();
      await createTables(db);
      const toSave = picked.map(p => ({
        contactId: p.recordID,
        displayName: p.displayName ?? '',
        phoneNumber:
          Array.isArray(p.phoneNumbers) && p.phoneNumbers.length > 0
            ? p.phoneNumbers[0].number ?? ''
            : '',
        group: '',
        address: '',
        relationship: '',
        memo: '',
      }));
      await saveContacts(db, toSave);
      const asImported: ImportedContactItem[] = toSave.map(t => ({
        ...t,
        recordID: t.contactId,
        phoneNumbers: t.phoneNumber ? [{ number: t.phoneNumber }] : [],
      }));
      setImportedContacts(asImported);
      setMode('imported');
      Toast.show({
        type: 'success',
        text1: '저장 완료',
        text2: `${toSave.length}명의 연락처가 저장되었습니다.`,
      });
      navigation.replace('Home');
    } catch (e) {
      console.error('Failed to save selected contacts', e);
      Toast.show({
        type: 'error',
        text1: '저장 실패',
        text2: '연락처 저장에 실패했습니다. 다시 시도해주세요.',
      });
    }
  };

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

  const listToShow: ListItem[] = mode === 'select' ? contacts : importedContacts;

  const filteredList = useMemo((): ListItem[] => {
    const q = normalizeSearchQuery(searchQuery);
    let list: ListItem[] = listToShow;
    if (q) {
      const normalizedQ = q;
      list = list.filter((item: ListItem) => {
        const text = normalizeSearchQuery(getSearchableText(item));
        return text.includes(normalizedQ);
      });
    }
    if (mode === 'imported' && groupFilter) {
      list = list.filter(
        (item): item is ImportedContactItem =>
          'group' in item && (item.group ?? '') === groupFilter,
      );
    }
    if (mode === 'imported') {
      const order = ['family', 'work', 'friend', 'other', ''];
      list = [...list].sort((a, b) => {
        const ai = order.indexOf('group' in a ? (a.group ?? '') : '');
        const bi = order.indexOf('group' in b ? (b.group ?? '') : '');
        const idx = (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
        if (idx !== 0) return idx;
        return (a.displayName ?? '').localeCompare(b.displayName ?? '');
      });
    }
    return list;
  }, [listToShow, searchQuery, mode, groupFilter]);

  useEffect(() => {
    (async () => {
      try {
        const db = await getDBConnection();
        await createTables(db);
        const count = await getContactsCount(db);
        if (count > 0) {
          const saved = await getSavedContacts(db);
          const normalized: ImportedContactItem[] = saved.map(s => ({
            ...s,
            recordID: s.contactId,
            displayName: s.displayName ?? '',
            phoneNumber: s.phoneNumber ?? '',
            phoneNumbers: s.phoneNumber ? [{ number: s.phoneNumber }] : [],
          }));
          setImportedContacts(normalized);
          setMode('imported');
        }
      } catch (e) {
        console.error('DB init error', e);
      }
    })();
  }, []);

  if (loading) {
    return (
      <YStack alignItems="center" justifyContent="center">
        <ActivityIndicator size="large" color={accent} />
      </YStack>
    );
  }

  return (
    <Container>
      <Text style={[styles.title, themeStyles.title]}>연락처 선택</Text>

      {mode === 'select' ? (
        <View style={styles.selectBar}>
          <HandDrawnButton variant="secondary" onPress={selectAll}>
            전체 선택
          </HandDrawnButton>
          <HandDrawnButton variant="secondary" onPress={clearSelection}>
            선택 해제
          </HandDrawnButton>
          <HandDrawnButton
            variant="primary"
            onPress={importSelected}
            disabled={selectedCount === 0}
            style={selectedCount === 0 ? styles.buttonDisabled : undefined}
          >
            가져오기 ({selectedCount})
          </HandDrawnButton>
        </View>
      ) : (
        <View style={styles.selectBar}>
          <HandDrawnButton variant="primary" onPress={() => setMode('select')}>
            다시 선택
          </HandDrawnButton>
        </View>
      )}

      <HandDrawnInput
        placeholder="이름 또는 번호로 검색"
        placeholderTextColor={placeholderColor}
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInputWrap}
      />

      {mode === 'imported' && (
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
      )}

      <FlatList<ListItem>
        data={filteredList}
        keyExtractor={item =>
          'contactId' in item ? item.contactId : item.recordID ?? ''
        }
        renderItem={({ item }) => {
          const itemId =
            'contactId' in item ? item.contactId : item.recordID ?? '';
          return (
          <Pressable
            onPress={() =>
              mode === 'select' ? toggleSelect(itemId) : null
            }
            style={[styles.contactRow, themeStyles.contactRow]}
          >
            {mode === 'select' && (
              <Checkbox style={themeStyles.checkboxBorder}>
                <Text style={styles.checkMark}>
                  {selectedIds.has(itemId) ? '✓' : ''}
                </Text>
              </Checkbox>
            )}
            <YStack flex={1}>
              <View style={styles.contactNameRow}>
                <Text style={[styles.contactName, themeStyles.contactName]}>
                  {item.displayName || '이름 없음'}
                </Text>
                {mode === 'imported' && 'group' in item && (item as ImportedContactItem).group ? (
                  <Text style={[styles.groupChipSmall, themeStyles.phone]}>
                    {getContactGroupEmoji((item as ImportedContactItem).group ?? '')}{' '}
                    {getContactGroupLabel((item as ImportedContactItem).group ?? '')}
                  </Text>
                ) : null}
              </View>
              {Array.isArray(item.phoneNumbers) &&
              item.phoneNumbers.length > 0 ? (
                <Text style={[styles.phone, themeStyles.phone]}>
                  {item.phoneNumbers[0].number || '번호 없음'}
                </Text>
              ) : 'phoneNumber' in item && item.phoneNumber ? (
                <Text style={[styles.phone, themeStyles.phone]}>{item.phoneNumber}</Text>
              ) : null}
            </YStack>
          </Pressable>
          );
        }}
      />
    </Container>
  );
};

const Container = styled(YStack, {
  flex: 1,
  padding: SPACING.screenPadding,
  backgroundColor: '$background',
});

function Checkbox({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.checkboxWobbly, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  checkboxWobbly: {
    width: 28,
    height: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    ...WOBBLY_SM,
  },
  title: {
    fontSize: FONT.title,
    fontWeight: '700',
    marginBottom: SPACING.rowGap,
  },
  selectBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.itemGap,
    marginBottom: SPACING.rowGap,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  searchInputWrap: {
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
    ...WOBBLY_SM,
    borderWidth: 2,
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
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.rowGap,
    paddingHorizontal: SPACING.itemGap,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  contactName: {
    fontSize: FONT.body,
    fontWeight: '600',
  },
  checkMark: {
    fontSize: FONT.bodySmall,
    fontFamily: FONT.fontFamilyBody,
  },
  phone: {
    fontSize: FONT.bodySmall,
    marginTop: 4,
  },
});

export default ContactList;
