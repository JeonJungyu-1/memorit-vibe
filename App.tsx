import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  LogBox,
  ActivityIndicator,
  View,
  AppState,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import * as SplashScreen from 'expo-splash-screen';
import type { RootStackParamList } from './src/navigation/types';
import ContactList from './src/components/ContactList';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import ContactDetailScreen from './src/screens/ContactDetailScreen';
import HelperScreen from './src/screens/HelperScreen';
import {
  getDBConnection,
  createTables,
  getContactsCount,
  getRecurringEventsForReschedule,
} from './src/db/Database';
import { rescheduleRecurringEventsIfNeeded } from './src/services/notificationService';
import { runLocalAutoBackupIfNeeded } from './src/utils/backupRestore';
import { useTheme } from 'tamagui';
import config from './tamagui.config';
import { ThemeProvider, useThemeMode } from './src/contexts/ThemeContext';
import { getThemeColor, FLUID_LIGHT } from './src/utils/themeColors';

SplashScreen.preventAutoHideAsync().catch(() => {});

LogBox.ignoreLogs([/SQLite/]);

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const { resolvedTheme } = useThemeMode();
  const backgroundColor =
    getThemeColor(theme, 'background') || FLUID_LIGHT.background;
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
  const [fontsLoaded, fontsError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const [dbReady, setDbReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<
    keyof RootStackParamList | null
  >(null);
  const loadingColor =
    getThemeColor(theme, 'red9') || FLUID_LIGHT.accent;
  const screenBackgroundColor =
    getThemeColor(theme, 'background') || FLUID_LIGHT.background;

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontsError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  useEffect(() => {
    async function init() {
      try {
        const db = await getDBConnection();
        await createTables(db);
        setDbReady(true);
        const count = await getContactsCount(db);
        setInitialRoute(count > 0 ? 'MainTabs' : 'ContactSelect');
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

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        (async () => {
          try {
            const db = await getDBConnection();
            const recurringEvents = await getRecurringEventsForReschedule(db);
            await rescheduleRecurringEventsIfNeeded(recurringEvents);
          } catch (e) {
            console.warn('Recurring notification reschedule failed', e);
          }
          try {
            await runLocalAutoBackupIfNeeded();
          } catch (e) {
            console.warn('Auto backup failed', e);
          }
        })();
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (fontsError) {
      console.warn('Manrope 폰트 로드 실패, 시스템 폰트 사용:', fontsError);
    }
  }, [fontsError]);

  const isReady = dbReady && initialRoute !== null && (fontsLoaded || fontsError);
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
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: screenBackgroundColor },
            }}
          >
            <Stack.Screen name="ContactSelect" component={ContactList} />
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="ContactDetail" component={ContactDetailScreen} />
            <Stack.Screen name="Helper" component={HelperScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        <Toast />
      </View>
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
