import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  LogBox,
  ActivityIndicator,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import type { RootStackParamList } from './src/navigation/types';
import ContactList from './src/components/ContactList';
import HomeScreen from './src/screens/HomeScreen';
import ContactDetailScreen from './src/screens/ContactDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';
import { getDBConnection, createTables, getContactsCount } from './src/db/Database';
import { useTheme } from 'tamagui';
import config from './tamagui.config';
import { ThemeProvider, useThemeMode } from './src/contexts/ThemeContext';
import {
  getThemeColor,
  HAND_DRAWN_LIGHT,
} from './src/utils/themeColors';

LogBox.ignoreLogs([/SQLite/]);

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const { resolvedTheme } = useThemeMode();
  const backgroundColor =
    getThemeColor(theme, 'background') || HAND_DRAWN_LIGHT.background;
  const isDark = resolvedTheme === 'dark';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

function AppContent() {
  const theme = useTheme();
  const [dbReady, setDbReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<
    keyof RootStackParamList | null
  >(null);
  const loadingColor =
    getThemeColor(theme, 'red9') || HAND_DRAWN_LIGHT.accent;
  const screenBackgroundColor =
    getThemeColor(theme, 'background') || HAND_DRAWN_LIGHT.background;

  useEffect(() => {
    async function init() {
      try {
        const db = await getDBConnection();
        await createTables(db);
        setDbReady(true);
        const count = await getContactsCount(db);
        setInitialRoute(count > 0 ? 'Home' : 'ContactSelect');
      } catch (error) {
        console.error('Failed to initialize database', error);
        setDbReady(true);
        setInitialRoute('ContactSelect');
        Toast.show({
          type: 'error',
          text1: '초기화 실패',
          text2: '데이터베이스 초기화에 실패했습니다.',
        });
      }
    }
    init();
  }, []);

  const isReady = dbReady && initialRoute !== null;
  if (!isReady) {
    return (
      <AppShell>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={loadingColor} />
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <>
        <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: screenBackgroundColor },
          }}
        >
          <Stack.Screen name="ContactSelect" component={ContactList} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="ContactDetail" component={ContactDetailScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Statistics" component={StatisticsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
      </>
    </AppShell>
  );
}

const App = () => (
  <ThemeProvider tamaguiConfig={config}>
    <AppShell>
      <AppContent />
    </AppShell>
  </ThemeProvider>
);

export default App;
