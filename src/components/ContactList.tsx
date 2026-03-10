import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { useTheme } from 'tamagui';
import { YStack, styled } from 'tamagui';
import type { RootStackParamList } from '../navigation/types';
import { useContacts } from '../hooks/useContacts';
import {
  getDBConnection,
  createTables,
  getContactsCount,
  saveContacts,
  getSavedContacts,
} from '../db/Database';
import { getThemeColor, SPACING, RADIUS, FONT } from '../utils/themeColors';

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
  const accent = getThemeColor(theme, 'blue9') || '#0a7ea4';
  const borderColor = getThemeColor(theme, 'borderColor') || '#ddd';
  const bgHover = getThemeColor(theme, 'backgroundHover') || '#fafafa';
  const colorMuted = getThemeColor(theme, 'color11') || getThemeColor(theme, 'gray11') || '#666';
  const placeholderColor = getThemeColor(theme, 'placeholderColor') || '#999';
  const borderLight = getThemeColor(theme, 'gray4') || '#eee';

  const color = getThemeColor(theme, 'color') || '#333';
  const themeStyles = useMemo(
    () => ({
      searchInput: { borderColor, backgroundColor: bgHover },
      contactRow: { borderBottomColor: borderLight },
      phone: { color: colorMuted },
      contactName: { color },
      primaryButton: { backgroundColor: accent },
      primaryButtonText: { color: '#fff' },
      secondaryButton: { borderColor, backgroundColor: bgHover },
      secondaryButtonText: { color },
    }),
    [borderColor, bgHover, borderLight, colorMuted, color, accent],
  );

  const onPermissionDenied = useCallback(() => {
    Toast.show({
      type: 'error',
      text1: '권한 거부',
      text2: '연락처를 불러오려면 접근 권한을 허용해주세요.',
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<'select' | 'imported'>('select');
  const [importedContacts, setImportedContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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
    const picked = contacts.filter((c: any) => selectedIds.has(c.recordID));
    setImportedContacts(picked);
    setMode('imported');
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
      }));
      await saveContacts(db, toSave);
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

  const listToShow = mode === 'select' ? contacts : importedContacts;

  const filteredList = useMemo(() => {
    const q = normalizeSearchQuery(searchQuery);
    if (!q) return listToShow;
    const normalizedQ = q;
    return listToShow.filter((item: any) => {
      const text = normalizeSearchQuery(getSearchableText(item));
      return text.includes(normalizedQ);
    });
  }, [listToShow, searchQuery]);

  useEffect(() => {
    (async () => {
      try {
        const db = await getDBConnection();
        await createTables(db);
        const count = await getContactsCount(db);
        if (count > 0) {
          const saved = await getSavedContacts(db);
          const normalized = (saved as any[]).map(s => ({
            recordID: s.contactId,
            displayName: s.displayName,
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
      <Text style={[styles.title, { color }]}>연락처 선택</Text>

      {mode === 'select' ? (
        <View style={styles.selectBar}>
          <Pressable
            style={[styles.secondaryButton, themeStyles.secondaryButton]}
            onPress={selectAll}
          >
            <Text style={[styles.secondaryButtonText, themeStyles.secondaryButtonText]}>
              전체선택
            </Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryButton, themeStyles.secondaryButton]}
            onPress={clearSelection}
          >
            <Text style={[styles.secondaryButtonText, themeStyles.secondaryButtonText]}>
              선택해제
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.primaryButton,
              themeStyles.primaryButton,
              selectedCount === 0 && styles.buttonDisabled,
            ]}
            onPress={importSelected}
            disabled={selectedCount === 0}
          >
            <Text style={[styles.primaryButtonText, themeStyles.primaryButtonText]}>
              가져오기 ({selectedCount})
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.selectBar}>
          <Pressable
            style={[styles.primaryButton, themeStyles.primaryButton]}
            onPress={() => setMode('select')}
          >
            <Text style={[styles.primaryButtonText, themeStyles.primaryButtonText]}>
              다시 선택
            </Text>
          </Pressable>
        </View>
      )}

      <TextInput
        style={[styles.searchInput, themeStyles.searchInput]}
        placeholder="이름 또는 번호로 검색"
        placeholderTextColor={placeholderColor}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredList}
        keyExtractor={item => item.recordID ?? item.contactId}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              mode === 'select' ? toggleSelect(item.recordID) : null
            }
            style={[styles.contactRow, themeStyles.contactRow]}
          >
            {mode === 'select' && (
              <Checkbox>
                <Text style={styles.checkMark}>
                  {selectedIds.has(item.recordID) ? '✓' : ''}
                </Text>
              </Checkbox>
            )}
            <YStack flex={1}>
              <Text style={[styles.contactName, themeStyles.contactName]}>
                {item.displayName || '이름 없음'}
              </Text>
              {Array.isArray(item.phoneNumbers) &&
              item.phoneNumbers.length > 0 ? (
                <Text style={[styles.phone, themeStyles.phone]}>
                  {item.phoneNumbers[0].number || '번호 없음'}
                </Text>
              ) : item.phoneNumber ? (
                <Text style={[styles.phone, themeStyles.phone]}>{item.phoneNumber}</Text>
              ) : null}
            </YStack>
          </Pressable>
        )}
      />
    </Container>
  );
};

const Container = styled(YStack, {
  flex: 1,
  padding: SPACING.screenPadding,
  backgroundColor: '$background',
});

const Checkbox = styled(YStack, {
  width: 28,
  height: 28,
  borderWidth: 1,
  borderColor: '$border',
  borderRadius: 4,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: '$2',
});

const styles = StyleSheet.create({
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
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    minHeight: SPACING.touchTargetMin,
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: FONT.bodySmall,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    minHeight: SPACING.touchTargetMin,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: FONT.bodySmall,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  searchInput: {
    height: SPACING.touchTargetMin,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    fontSize: FONT.body,
    marginBottom: SPACING.rowGap,
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
  },
  phone: {
    fontSize: FONT.bodySmall,
    marginTop: 4,
  },
});

export default ContactList;
