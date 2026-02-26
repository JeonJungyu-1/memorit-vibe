import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Button,
} from 'react-native';
import { useContacts } from '../hooks/useContacts';

const ContactList: React.FC = () => {
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

  const importSelected = () => {
    const picked = contacts.filter((c: any) => selectedIds.has(c.recordID));
    setImportedContacts(picked);
    setMode('imported');
  };

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const listToShow = mode === 'select' ? contacts : importedContacts;

  return (
    <View style={styles.container}>
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
        keyExtractor={item => item.recordID}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              mode === 'select' ? toggleSelect(item.recordID) : null
            }
            style={styles.contactItem}
          >
            {mode === 'select' && (
              <View style={styles.checkbox}>
                <Text style={styles.checkboxText}>
                  {selectedIds.has(item.recordID) ? '✓' : ''}
                </Text>
              </View>
            )}
            <View style={styles.contactText}>
              <Text style={styles.name}>{item.displayName || '이름 없음'}</Text>
              {Array.isArray(item.phoneNumbers) &&
                item.phoneNumbers.length > 0 && (
                  <Text style={styles.phone}>
                    {item.phoneNumbers[0].number || '번호 없음'}
                  </Text>
                )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  phone: {
    fontSize: 14,
    color: '#666',
  },
  selectBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxText: {
    fontSize: 16,
  },
  contactText: {
    flex: 1,
  },
});

export default ContactList;
