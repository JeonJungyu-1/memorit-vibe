import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, StatusBar, LogBox } from 'react-native';
import ContactList from './src/components/ContactList';
import { getDBConnection, createTables } from './src/db/Database';

// react-native-sqlite-storage has some logs that are not critical.
LogBox.ignoreLogs([/SQLite/]);

const App = () => {
  useEffect(() => {
    async function initializeDb() {
      try {
        const db = await getDBConnection();
        await createTables(db);
        console.log('Database and tables created successfully');
      } catch (error) {
        console.error('Failed to initialize database', error);
      }
    }

    initializeDb();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={'dark-content'} />
      <ContactList />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App;
