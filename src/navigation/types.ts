import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  ContactSelect: undefined;
  Home: undefined;
  ContactDetail: { contactId: string };
};

export type ContactSelectScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ContactSelect'
>;
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type ContactDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ContactDetail'
>;
