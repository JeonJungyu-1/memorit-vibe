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

export const getSavedContacts = async (db: any) => {
  const [results] = await db.executeSql(
    'SELECT contactId, displayName, phoneNumber FROM contacts;',
  );
  const rows = [] as any[];
  for (let i = 0; i < results.rows.length; i++) {
    rows.push(results.rows.item(i));
  }
  return rows;
};

export const getContactsCount = async (db: any) => {
  const [results] = await db.executeSql(
    'SELECT COUNT(*) as count FROM contacts;',
  );
  if (results.rows.length > 0) return results.rows.item(0).count as number;
  return 0;
};

export const saveContacts = async (
  db: any,
  contacts: { contactId: string; displayName: string; phoneNumber: string }[],
) => {
  if (!contacts || contacts.length === 0) return;
  const insertQuery = `INSERT OR REPLACE INTO contacts (contactId, displayName, phoneNumber) VALUES (?, ?, ?);`;
  try {
    await db.transaction(async (tx: any) => {
      for (const c of contacts) {
        await tx.executeSql(insertQuery, [
          c.contactId,
          c.displayName,
          c.phoneNumber ?? '',
        ]);
      }
    });
  } catch (e) {
    console.error('Error saving contacts', e);
    throw e;
  }
};
