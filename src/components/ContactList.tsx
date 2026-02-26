import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useContacts } from '../hooks/useContacts';

const ContactList: React.FC = () => {
  const { contacts, loading } = useContacts();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>연락처 리스트</Text>
      <FlatList
        data={contacts}
        keyExtractor={item => item.recordID}
        renderItem={({ item }) => (
          <View style={styles.contactItem}>
            <Text style={styles.name}>{item.displayName || '이름 없음'}</Text>
            {Array.isArray(item.phoneNumbers) &&
              item.phoneNumbers.length > 0 && (
                <Text style={styles.phone}>
                  {item.phoneNumbers[0].number || '번호 없음'}
                </Text>
              )}
          </View>
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
});

export default ContactList;
