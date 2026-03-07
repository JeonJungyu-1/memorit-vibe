import { useState, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Contacts from 'react-native-contacts';

export type ContactType = {
  recordID: string;
  displayName: string;
  phoneNumbers: { number?: string }[];
};

export type UseContactsOptions = {
  onPermissionDenied?: () => void;
};

export const useContacts = (options?: UseContactsOptions) => {
  const { onPermissionDenied } = options ?? {};
  const [contacts, setContacts] = useState<ContactType[]>([]);
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
          },
        );
        const hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        if (!hasPermission) {
          onPermissionDenied?.();
        }
        return hasPermission;
      } catch (err) {
        console.warn(err);
        onPermissionDenied?.();
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
        const allContacts: any[] = await Contacts.getAll();
        const normalized = allContacts.map(c => ({
          recordID: c.recordID ?? String(Math.random()),
          displayName: c.displayName ?? '',
          phoneNumbers: Array.isArray(c.phoneNumbers)
            ? c.phoneNumbers.map((p: any) => ({ number: p.number }))
            : [],
        }));
        setContacts(normalized);
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
