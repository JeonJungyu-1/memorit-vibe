import { useState, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Contacts from 'react-native-contacts';

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: '연락처 접근 권한',
            message: '앱에서 연락처를 불러오기 위해 권한이 필요합니다.',
            buttonNeutral: '나중에',
            buttonNegative: '거부',
            buttonPositive: '허용',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS is handled differently, but we are focusing on Android
  };

  const loadContacts = async () => {
    setLoading(true);
    const hasPermission = await requestPermission();
    if (hasPermission) {
      try {
        const allContacts = await Contacts.getAll();
        setContacts(allContacts);
      } catch (e) {
        console.error('Error fetching contacts', e);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadContacts();
  }, []);

  return { contacts, loading, loadContacts };
};
