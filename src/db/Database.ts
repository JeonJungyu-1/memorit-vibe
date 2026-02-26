import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

const database_name = 'Memorit.db';

export const getDBConnection = async () => {
  return SQLite.openDatabase({ name: database_name, location: 'default' });
};

export const createTables = async (db: any) => {
  const query = `CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contactId TEXT UNIQUE,
        displayName TEXT,
        phoneNumber TEXT
    );`;

  await db.executeSql(query);

  const eventQuery = `CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contactId TEXT,
        type TEXT,
        amount INTEGER,
        date TEXT,
        memo TEXT,
        FOREIGN KEY (contactId) REFERENCES contacts(contactId)
    );`;

  await db.executeSql(eventQuery);
};
