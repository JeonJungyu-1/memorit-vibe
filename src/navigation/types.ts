import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  ContactSelect: undefined;
  Home: undefined;
};

export type ContactSelectScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ContactSelect'
>;
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
