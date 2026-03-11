import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  ContactSelect: undefined;
  Home: undefined;
  ContactDetail: { contactId: string };
  Settings: undefined;
  Statistics: undefined;
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
export type SettingsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Settings'
>;
export type StatisticsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Statistics'
>;
