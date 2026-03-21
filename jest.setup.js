/* eslint-env jest */
jest.mock('@expo-google-fonts/manrope', () => ({
  useFonts: () => [true, null],
  Manrope_400Regular: 'Manrope_400Regular',
  Manrope_500Medium: 'Manrope_500Medium',
  Manrope_600SemiBold: 'Manrope_600SemiBold',
  Manrope_700Bold: 'Manrope_700Bold',
  Manrope_800ExtraBold: 'Manrope_800ExtraBold',
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    NavigationContainer: ({ children }) => React.createElement(View, null, children),
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
      getParent: jest.fn(() => ({
        navigate: jest.fn(),
      })),
    }),
    useFocusEffect: jest.fn(),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }) =>
        React.createElement(View, { testID: 'stack-nav' }, children),
      Screen: () => null,
    }),
  };
});

jest.mock('./src/db/Database', () => ({
  getDBConnection: jest.fn(() => Promise.resolve({})),
  createTables: jest.fn(() => Promise.resolve()),
  getContactsCount: jest.fn(() => Promise.resolve(0)),
  getRecurringEventsForReschedule: jest.fn(() => Promise.resolve([])),
}));

jest.mock('./src/utils/backupRestore', () => ({
  runLocalAutoBackupIfNeeded: jest.fn(() => Promise.resolve()),
}));

jest.mock('./src/services/notificationService', () => ({
  rescheduleRecurringEventsIfNeeded: jest.fn(() => Promise.resolve()),
}));

jest.mock('./src/hooks/useContacts', () => ({
  useContacts: jest.fn(() => ({ contacts: [], loading: false })),
}));

jest.mock('./src/navigation/MainTabNavigator', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: function MockMainTabs() {
      return React.createElement(View, { testID: 'mock-main-tabs' });
    },
  };
});
