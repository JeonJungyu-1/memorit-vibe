import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Button,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

const ContactList: React.FC = () => {
  const navigation = useNavigation<ContactListNavigationProp>();
  const { contacts, loading } = useContacts();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<'select' | 'imported'>('select');
  const [importedContacts, setImportedContacts] = useState<any[]>([]);

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
      navigation.replace('Home');
    } catch (e) {
      console.error('Failed to save selected contacts', e);
    }
  };

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

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
        <ActivityIndicator size="large" color="#0000ff" />
      </YStack>
    );
  }

  const listToShow = mode === 'select' ? contacts : importedContacts;

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

      <FlatList
        data={listToShow}
        keyExtractor={item => item.recordID ?? item.contactId}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              mode === 'select' ? toggleSelect(item.recordID) : null
            }
            style={styles.contactRow}
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
                <Text style={styles.phone}>
                  {item.phoneNumbers[0].number || '번호 없음'}
                </Text>
              ) : item.phoneNumber ? (
                <Text style={styles.phone}>{item.phoneNumber}</Text>
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
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    color: '#666',
  },
});

export default ContactList;
