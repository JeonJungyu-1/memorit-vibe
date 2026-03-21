import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type MainTabsParamList = {
  LedgerHome: undefined;
  Contacts: undefined;
  Reports: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  ContactSelect: undefined;
  MainTabs: NavigatorScreenParams<MainTabsParamList> | undefined;
  ContactDetail: { contactId: string };
  Helper: undefined;
};

export type ContactSelectScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ContactSelect'
>;

export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Contacts'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type ContactDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ContactDetail'
>;

export type SettingsScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Settings'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type StatisticsScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Reports'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type HelperScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Helper'
>;

export type LedgerHomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'LedgerHome'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type MainTabNavigatorProps = NativeStackScreenProps<
  RootStackParamList,
  'MainTabs'
>;
