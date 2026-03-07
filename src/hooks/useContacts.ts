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
  onFetchError?: (error: unknown) => void;
};

export const useContacts = (options?: UseContactsOptions) => {
  const { onPermissionDenied, onFetchError } = options ?? {};
  const [contacts, setContacts] = useState<ContactType[]>([]);
  const [loading, setLoading] = useState(false);

  const requestPermission = async (): Promise<boolean> => {
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
    try {
      let hasPermission = false;
      try {
        hasPermission = await requestPermission();
      } catch (e) {
        console.warn('Permission request failed', e);
        onPermissionDenied?.();
      }

      if (!hasPermission) {
        return;
      }

      if (Contacts == null || typeof Contacts.getAll !== 'function') {
        console.error('Contacts native module is not available');
        setContacts([]);
        onFetchError?.(new Error('연락처 모듈을 사용할 수 없습니다.'));
        return;
      }

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
        setContacts([]);
        onFetchError?.(e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts().catch(e => {
      console.error('Unhandled error in loadContacts', e);
    });
  }, []);

  return { contacts, loading, loadContacts };
};
