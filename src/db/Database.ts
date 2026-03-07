import { Platform } from 'react-native';
import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

const database_name = 'Memorit.db';

let cachedDb: any = null;

/**
 * Android 11+에서 location 'default' 사용 시 code 11 등 오류가 날 수 있어
 * Android에서는 'Documents'를 사용합니다.
 */
const getDbLocation = (): string => {
  if (Platform.OS === 'android') {
    return 'Documents';
  }
  return 'default';
};

export const getDBConnection = async () => {
  if (cachedDb) {
    return cachedDb;
  }
  try {
    const db = await SQLite.openDatabase({
      name: database_name,
      location: getDbLocation(),
    });
    cachedDb = db;
    return db;
  } catch (e) {
    console.error('Failed to open database', e);
    cachedDb = null;
    throw e;
  }
};

export const closeDBConnection = async (): Promise<void> => {
  if (cachedDb) {
    try {
      await cachedDb.close();
    } catch (e) {
      console.warn('Error closing database', e);
    }
    cachedDb = null;
  }
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

export type Event = {
  id: number;
  contactId: string;
  type: string;
  amount: number;
  date: string;
  memo: string;
};

export const getEventsByContactId = async (
  db: any,
  contactId: string,
): Promise<Event[]> => {
  const [results] = await db.executeSql(
    'SELECT id, contactId, type, amount, date, memo FROM events WHERE contactId = ? ORDER BY date ASC;',
    [contactId],
  );
  const rows: Event[] = [];
  const rowCount = results?.rows?.length ?? 0;
  for (let i = 0; i < rowCount; i++) {
    rows.push(results.rows.item(i) as Event);
  }
  return rows;
};

/**
 * 이벤트 저장. 수정 시 기존 id, 신규 추가 시 새 id 반환.
 */
export const saveEvent = async (
  db: any,
  event: {
    id?: number;
    contactId: string;
    type: string;
    amount: number;
    date: string;
    memo: string;
  },
): Promise<number> => {
  if (event.id != null) {
    await db.executeSql(
      'UPDATE events SET type = ?, amount = ?, date = ?, memo = ? WHERE id = ?;',
      [event.type, event.amount, event.date, event.memo ?? '', event.id],
    );
    return event.id;
  }
  await db.executeSql(
    'INSERT INTO events (contactId, type, amount, date, memo) VALUES (?, ?, ?, ?, ?);',
    [
      event.contactId,
      event.type,
      event.amount,
      event.date,
      event.memo ?? '',
    ],
  );
  const [result] = await db.executeSql('SELECT last_insert_rowid() as id');
  const id = result?.rows?.length > 0 ? result.rows.item(0).id : 0;
  return typeof id === 'number' ? id : parseInt(String(id), 10);
};

export const deleteEvent = async (db: any, id: number) => {
  await db.executeSql('DELETE FROM events WHERE id = ?;', [id]);
};

export const getUpcomingEvents = async (
  db: any,
  limit: number,
): Promise<(Event & { displayName?: string })[]> => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [results] = await db.executeSql(
      `SELECT e.id, e.contactId, e.type, e.amount, e.date, e.memo, c.displayName
       FROM events e
       LEFT JOIN contacts c ON c.contactId = e.contactId
       WHERE e.date >= ?
       ORDER BY e.date ASC
       LIMIT ?;`,
      [today, limit],
    );
    const rows: (Event & { displayName?: string })[] = [];
    const rowCount = results?.rows?.length ?? 0;
    for (let i = 0; i < rowCount; i++) {
      rows.push(results.rows.item(i) as Event & { displayName?: string });
    }
    return rows;
  } catch (e) {
    console.warn('getUpcomingEvents failed', e);
    return [];
  }
};

export const getSavedContacts = async (db: any) => {
  const [results] = await db.executeSql(
    'SELECT contactId, displayName, phoneNumber FROM contacts;',
  );
  const rows = [] as any[];
  const rowCount = results?.rows?.length ?? 0;
  for (let i = 0; i < rowCount; i++) {
    rows.push(results.rows.item(i));
  }
  return rows;
};

export const getContactsCount = async (db: any) => {
  const [results] = await db.executeSql(
    'SELECT COUNT(*) as count FROM contacts;',
  );
  const rowCount = results?.rows?.length ?? 0;
  if (rowCount > 0) return results.rows.item(0).count as number;
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

/**
 * 저장된 연락처 한 명과 해당 연락처의 모든 기념일을 삭제합니다.
 */
export const removeContact = async (
  db: any,
  contactId: string,
): Promise<void> => {
  try {
    await db.transaction(async (tx: any) => {
      await tx.executeSql('DELETE FROM events WHERE contactId = ?;', [
        contactId,
      ]);
      await tx.executeSql('DELETE FROM contacts WHERE contactId = ?;', [
        contactId,
      ]);
    });
  } catch (e) {
    console.error('Error removing contact', e);
    throw e;
  }
};

/** 백업용 연락처 행 타입 */
export type BackupContact = {
  contactId: string;
  displayName: string;
  phoneNumber: string;
};

/** 백업용 이벤트 행 타입 (id 제외, 복원 시 재부여) */
export type BackupEvent = {
  contactId: string;
  type: string;
  amount: number;
  date: string;
  memo: string;
};

/** 백업 파일 포맷 */
export type BackupData = {
  version: number;
  exportedAt: string;
  app: string;
  contacts: BackupContact[];
  events: BackupEvent[];
};

const BACKUP_VERSION = 1;
const BACKUP_APP_ID = 'memorit';

/**
 * 전체 연락처와 이벤트를 백업용 객체로 내보냅니다.
 */
export const exportBackupData = async (db: any): Promise<BackupData> => {
  const [contactsResults] = await db.executeSql(
    'SELECT contactId, displayName, phoneNumber FROM contacts ORDER BY id ASC;',
  );
  const contacts: BackupContact[] = [];
  const contactCount = contactsResults?.rows?.length ?? 0;
  for (let i = 0; i < contactCount; i++) {
    const row = contactsResults.rows.item(i);
    contacts.push({
      contactId: row.contactId,
      displayName: row.displayName ?? '',
      phoneNumber: row.phoneNumber ?? '',
    });
  }

  const [eventsResults] = await db.executeSql(
    'SELECT contactId, type, amount, date, memo FROM events ORDER BY id ASC;',
  );
  const events: BackupEvent[] = [];
  const eventCount = eventsResults?.rows?.length ?? 0;
  for (let i = 0; i < eventCount; i++) {
    const row = eventsResults.rows.item(i);
    events.push({
      contactId: row.contactId,
      type: row.type,
      amount: row.amount ?? 0,
      date: row.date,
      memo: row.memo ?? '',
    });
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: BACKUP_APP_ID,
    contacts,
    events,
  };
};

/**
 * 백업 데이터를 DB에 복원합니다. 기존 데이터는 모두 삭제 후 덮어씁니다.
 */
export const restoreBackupData = async (
  db: any,
  data: BackupData,
): Promise<void> => {
  if (!data || data.app !== BACKUP_APP_ID || data.version !== BACKUP_VERSION) {
    throw new Error('올바른 Memorit 백업 파일이 아닙니다.');
  }
  const contacts = Array.isArray(data.contacts) ? data.contacts : [];
  const events = Array.isArray(data.events) ? data.events : [];

  await db.transaction(async (tx: any) => {
    await tx.executeSql('DELETE FROM events;');
    await tx.executeSql('DELETE FROM contacts;');

    const insertContact =
      'INSERT INTO contacts (contactId, displayName, phoneNumber) VALUES (?, ?, ?);';
    for (const c of contacts) {
      if (c && c.contactId != null) {
        await tx.executeSql(insertContact, [
          String(c.contactId),
          String(c.displayName ?? ''),
          String(c.phoneNumber ?? ''),
        ]);
      }
    }

    const insertEvent =
      'INSERT INTO events (contactId, type, amount, date, memo) VALUES (?, ?, ?, ?, ?);';
    for (const e of events) {
      if (e && e.contactId != null && e.date != null) {
        await tx.executeSql(insertEvent, [
          String(e.contactId),
          String(e.type ?? ''),
          Number(e.amount) || 0,
          String(e.date),
          String(e.memo ?? ''),
        ]);
      }
    }
  });
};

