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
import { getDBConnection, createTables, getContactsCount } from './src/db/Database';
import { TamaguiProvider } from 'tamagui';
import config from './tamagui.config';

LogBox.ignoreLogs([/SQLite/]);

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const [dbReady, setDbReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<
    keyof RootStackParamList | null
  >(null);

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

  if (!dbReady || initialRoute === null) {
    return (
      <TamaguiProvider config={config}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        </SafeAreaView>
      </TamaguiProvider>
    );
  }

  return (
    <TamaguiProvider config={config}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="ContactSelect" component={ContactList} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="ContactDetail" component={ContactDetailScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        <Toast />
      </SafeAreaView>
    </TamaguiProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
