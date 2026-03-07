import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { YStack, styled } from 'tamagui';
import type { HomeScreenProps } from '../navigation/types';
import {
  getDBConnection,
  createTables,
  getSavedContacts,
} from '../db/Database';

export type SavedContact = {
  contactId: string;
  displayName: string;
  phoneNumber: string;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContacts = useCallback(async () => {
    try {
      const db = await getDBConnection();
      await createTables(db);
      const saved = await getSavedContacts(db);
      setContacts((saved as SavedContact[]) ?? []);
    } catch (e) {
      console.error('Failed to load contacts on home', e);
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

  if (loading) {
    return (
      <Container flex={1} alignItems="center" justifyContent="center">
        <ActivityIndicator size="large" color="#0000ff" />
      </Container>
    );
  }

  return (
    <Container flex={1} padding="$4" backgroundColor="$background">
      <Text style={styles.header}>Memorit</Text>
      <Text style={styles.summary}>{contacts.length}명의 연락처</Text>

      <Pressable style={styles.reselectButton} onPress={handleReselectContacts}>
        <Text style={styles.reselectButtonText}>연락처 다시 선택</Text>
      </Pressable>

      <FlatList
        data={contacts}
        keyExtractor={item => item.contactId}
        renderItem={({ item }) => (
          <View style={styles.contactRow}>
            <Text style={styles.contactName}>
              {item.displayName || '이름 없음'}
            </Text>
            {item.phoneNumber ? (
              <Text style={styles.phone}>{item.phoneNumber}</Text>
            ) : null}
          </View>
        )}
        style={styles.list}
      />
    </Container>
  );
};

const Container = styled(YStack, {});

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summary: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
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
