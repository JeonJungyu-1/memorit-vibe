import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Button,
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

function getThemeColor(theme: ReturnType<typeof useTheme>, key: string): string {
  const v = (theme as Record<string, unknown>)[key];
  if (typeof v === 'object' && v !== null && 'val' in v) return (v as { val: string }).val;
  return typeof v === 'string' ? v : '';
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

  const themeStyles = useMemo(
    () => ({
      searchInput: { borderColor, backgroundColor: bgHover },
      contactRow: { borderBottomColor: borderLight },
      phone: { color: colorMuted },
    }),
    [borderColor, bgHover, borderLight, colorMuted],
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
      <Text style={styles.title}>연락처 리스트</Text>

      {mode === 'select' ? (
        <View style={styles.selectBar}>
          <Button title="전체선택" onPress={selectAll} />
          <Button title="선택해제" onPress={clearSelection} />
          <Button
            title={`가져오기 (${selectedCount})`}
            onPress={importSelected}
            disabled={selectedCount === 0}
          />
        </View>
      ) : (
        <View style={styles.selectBar}>
          <Button title="다시 선택" onPress={() => setMode('select')} />
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
              <Text style={styles.contactName}>
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
  padding: '$4',
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  selectBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
  },
  checkMark: {
    fontSize: 14,
  },
  phone: {
    fontSize: 14,
  },
});

export default ContactList;
