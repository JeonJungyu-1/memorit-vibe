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
        expense_amount INTEGER DEFAULT 0,
        date TEXT,
        memo TEXT,
        FOREIGN KEY (contactId) REFERENCES contacts(contactId)
    );`;

  await db.executeSql(eventQuery);
  await migrateAddExpenseAmount(db);
  await migrateAddRecurring(db);
  await migrateContactsProfile(db);
};

/**
 * 연락처 테이블에 그룹·프로필 확장 컬럼 추가 (group, address, relationship, memo)
 */
async function migrateContactsProfile(db: any): Promise<void> {
  const columns = ['group', 'address', 'relationship', 'memo'];
  try {
    const [result] = await db.executeSql('PRAGMA table_info(contacts);');
    const rows = result?.rows ?? { length: 0 };
    const existing = new Set<string>();
    for (let i = 0; i < rows.length; i++) {
      const col = rows.item(i);
      if (col?.name) existing.add(col.name);
    }
    for (const col of columns) {
      if (!existing.has(col)) {
        const quoted = col === 'group' ? '"group"' : col;
        await db.executeSql(
          `ALTER TABLE contacts ADD COLUMN ${quoted} TEXT DEFAULT '';`,
        );
      }
    }
  } catch (e) {
    console.warn('migrateContactsProfile failed', e);
  }
}

/**
 * 기존 DB에 expense_amount 컬럼이 없으면 추가합니다.
 */
async function migrateAddExpenseAmount(db: any): Promise<void> {
  try {
    const [result] = await db.executeSql('PRAGMA table_info(events);');
    const rows = result?.rows ?? { length: 0 };
    let hasExpenseAmount = false;
    for (let i = 0; i < rows.length; i++) {
      const col = rows.item(i);
      if (col?.name === 'expense_amount') {
        hasExpenseAmount = true;
        break;
      }
    }
    if (!hasExpenseAmount) {
      await db.executeSql(
        'ALTER TABLE events ADD COLUMN expense_amount INTEGER DEFAULT 0;',
      );
    }
  } catch (e) {
    console.warn('migrateAddExpenseAmount failed', e);
  }
}

/**
 * 기존 DB에 recurring 컬럼이 없으면 추가합니다. (1 = 매년 알림, 0 = 1회만)
 */
async function migrateAddRecurring(db: any): Promise<void> {
  try {
    const [result] = await db.executeSql('PRAGMA table_info(events);');
    const rows = result?.rows ?? { length: 0 };
    let hasRecurring = false;
    for (let i = 0; i < rows.length; i++) {
      const col = rows.item(i);
      if (col?.name === 'recurring') {
        hasRecurring = true;
        break;
      }
    }
    if (!hasRecurring) {
      await db.executeSql(
        'ALTER TABLE events ADD COLUMN recurring INTEGER DEFAULT 1;',
      );
    }
  } catch (e) {
    console.warn('migrateAddRecurring failed', e);
  }
}

export type Event = {
  id: number;
  contactId: string;
  type: string;
  amount: number;
  expenseAmount?: number;
  date: string;
  memo: string;
  /** 매년 같은 날 알림 여부 (기본 true) */
  recurring?: boolean;
};

export const getEventsByContactId = async (
  db: any,
  contactId: string,
): Promise<Event[]> => {
  const [results] = await db.executeSql(
    'SELECT id, contactId, type, amount, expense_amount as expenseAmount, date, memo, COALESCE(recurring, 1) as recurring FROM events WHERE contactId = ? ORDER BY date ASC;',
    [contactId],
  );
  const rows: Event[] = [];
  const rowCount = results?.rows?.length ?? 0;
  for (let i = 0; i < rowCount; i++) {
    const item = results.rows.item(i);
    rows.push({
      ...item,
      expenseAmount: item.expenseAmount ?? 0,
      recurring: item.recurring !== 0,
    } as Event);
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
    expenseAmount?: number;
    date: string;
    memo: string;
    recurring?: boolean;
  },
): Promise<number> => {
  const expenseAmount = event.expenseAmount ?? 0;
  const recurring = event.recurring !== false ? 1 : 0;
  if (event.id != null) {
    await db.executeSql(
      'UPDATE events SET type = ?, amount = ?, expense_amount = ?, date = ?, memo = ?, recurring = ? WHERE id = ?;',
      [
        event.type,
        event.amount,
        expenseAmount,
        event.date,
        event.memo ?? '',
        recurring,
        event.id,
      ],
    );
    return event.id;
  }
  await db.executeSql(
    'INSERT INTO events (contactId, type, amount, expense_amount, date, memo, recurring) VALUES (?, ?, ?, ?, ?, ?, ?);',
    [
      event.contactId,
      event.type,
      event.amount,
      expenseAmount,
      event.date,
      event.memo ?? '',
      recurring,
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
      `SELECT e.id, e.contactId, e.type, e.amount, e.expense_amount as expenseAmount, e.date, e.memo, COALESCE(e.recurring, 1) as recurring, c.displayName
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
      const item = results.rows.item(i);
      rows.push({
        ...item,
        expenseAmount: item.expenseAmount ?? 0,
        recurring: item.recurring !== 0,
      } as Event & { displayName?: string });
    }
    return rows;
  } catch (e) {
    console.warn('getUpcomingEvents failed', e);
    return [];
  }
};

/** 캘린더용: 특정 기간(시작·끝 날짜) 내 이벤트 조회 (displayName 포함) */
export type EventWithDisplayName = Event & { displayName?: string };

/** 반복 알림 재스케줄용: recurring=1인 모든 이벤트 (displayName 포함) */
export type RecurringEventForReschedule = Event & { displayName?: string };

export const getRecurringEventsForReschedule = async (
  db: any,
): Promise<RecurringEventForReschedule[]> => {
  try {
    const [results] = await db.executeSql(
      `SELECT e.id, e.contactId, e.type, e.amount, e.expense_amount as expenseAmount, e.date, e.memo, COALESCE(e.recurring, 1) as recurring, c.displayName
       FROM events e
       LEFT JOIN contacts c ON c.contactId = e.contactId
       WHERE COALESCE(e.recurring, 1) = 1;`,
    );
    const rows: RecurringEventForReschedule[] = [];
    const rowCount = results?.rows?.length ?? 0;
    for (let i = 0; i < rowCount; i++) {
      const item = results.rows.item(i);
      rows.push({
        ...item,
        expenseAmount: item.expenseAmount ?? 0,
        recurring: true,
      } as RecurringEventForReschedule);
    }
    return rows;
  } catch (e) {
    console.warn('getRecurringEventsForReschedule failed', e);
    return [];
  }
};

export const getEventsByDateRange = async (
  db: any,
  startDate: string,
  endDate: string,
): Promise<EventWithDisplayName[]> => {
  try {
    const [results] = await db.executeSql(
      `SELECT e.id, e.contactId, e.type, e.amount, e.expense_amount as expenseAmount, e.date, e.memo, COALESCE(e.recurring, 1) as recurring, c.displayName
       FROM events e
       LEFT JOIN contacts c ON c.contactId = e.contactId
       WHERE e.date >= ? AND e.date <= ?
       ORDER BY e.date ASC;`,
      [startDate, endDate],
    );
    const rows: EventWithDisplayName[] = [];
    const rowCount = results?.rows?.length ?? 0;
    for (let i = 0; i < rowCount; i++) {
      const item = results.rows.item(i);
      rows.push({
        ...item,
        expenseAmount: item.expenseAmount ?? 0,
        recurring: item.recurring !== 0,
      } as EventWithDisplayName);
    }
    return rows;
  } catch (e) {
    console.warn('getEventsByDateRange failed', e);
    return [];
  }
};

/** 연도·월별 지출 요약 (expense_amount 기준, 과거 데이터) */
export type YearMonthSummary = {
  year: string;
  month: string;
  totalExpense: number;
  count: number;
};

export const getExpenseSummaryByYearMonth = async (
  db: any,
): Promise<YearMonthSummary[]> => {
  try {
    const [results] = await db.executeSql(
      `SELECT strftime('%Y', date) as year, strftime('%m', date) as month,
              SUM(COALESCE(expense_amount, 0)) as totalExpense, COUNT(*) as count
       FROM events
       WHERE date IS NOT NULL AND date != ''
       GROUP BY year, month
       ORDER BY year DESC, month DESC
       LIMIT 24;`,
    );
    const rows: YearMonthSummary[] = [];
    const rowCount = results?.rows?.length ?? 0;
    for (let i = 0; i < rowCount; i++) {
      const item = results.rows.item(i);
      rows.push({
        year: String(item.year ?? ''),
        month: String(item.month ?? ''),
        totalExpense: Number(item.totalExpense) || 0,
        count: Number(item.count) || 0,
      });
    }
    return rows;
  } catch (e) {
    console.warn('getExpenseSummaryByYearMonth failed', e);
    return [];
  }
};

/** 유형별 지출 통계 (건수·총액) */
export type TypeSummary = {
  type: string;
  totalExpense: number;
  count: number;
};

export const getExpenseSummaryByType = async (
  db: any,
): Promise<TypeSummary[]> => {
  try {
    const [results] = await db.executeSql(
      `SELECT type, SUM(COALESCE(expense_amount, 0)) as totalExpense, COUNT(*) as count
       FROM events
       GROUP BY type
       ORDER BY totalExpense DESC;`,
    );
    const rows: TypeSummary[] = [];
    const rowCount = results?.rows?.length ?? 0;
    for (let i = 0; i < rowCount; i++) {
      const item = results.rows.item(i);
      rows.push({
        type: String(item.type ?? 'other'),
        totalExpense: Number(item.totalExpense) || 0,
        count: Number(item.count) || 0,
      });
    }
    return rows;
  } catch (e) {
    console.warn('getExpenseSummaryByType failed', e);
    return [];
  }
};

/** N개월 내 예정 이벤트의 지출 합계 (다가오는 지출 예측) */
export const getUpcomingExpenseForecast = async (
  db: any,
  monthsAhead: number,
): Promise<number> => {
  try {
    const today = new Date();
    const end = new Date(today);
    end.setMonth(end.getMonth() + monthsAhead);
    const todayStr = today.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    const [results] = await db.executeSql(
      `SELECT COALESCE(SUM(expense_amount), 0) as total
       FROM events
       WHERE date >= ? AND date <= ?;`,
      [todayStr, endStr],
    );
    if (results?.rows?.length > 0) {
      const total = results.rows.item(0).total;
      return Number(total) || 0;
    }
    return 0;
  } catch (e) {
    console.warn('getUpcomingExpenseForecast failed', e);
    return 0;
  }
};

export type SavedContactRow = {
  contactId: string;
  displayName: string;
  phoneNumber: string;
  group?: string;
  address?: string;
  relationship?: string;
  memo?: string;
};

export const getSavedContacts = async (db: any): Promise<SavedContactRow[]> => {
  const [results] = await db.executeSql(
    `SELECT contactId, displayName, phoneNumber,
            COALESCE("group", '') as "group",
            COALESCE(address, '') as address,
            COALESCE(relationship, '') as relationship,
            COALESCE(memo, '') as memo
     FROM contacts;`,
  );
  const rows: SavedContactRow[] = [];
  const rowCount = results?.rows?.length ?? 0;
  for (let i = 0; i < rowCount; i++) {
    rows.push(results.rows.item(i) as SavedContactRow);
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

export type SaveContactInput = {
  contactId: string;
  displayName: string;
  phoneNumber: string;
  group?: string;
  address?: string;
  relationship?: string;
  memo?: string;
};

export const saveContacts = async (
  db: any,
  contacts: SaveContactInput[],
) => {
  if (!contacts || contacts.length === 0) return;
  const insertQuery = `INSERT OR REPLACE INTO contacts (contactId, displayName, phoneNumber, "group", address, relationship, memo) VALUES (?, ?, ?, ?, ?, ?, ?);`;
  return new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx: any) => {
        let index = 0;
        const runNext = () => {
          if (index >= contacts.length) return;
          const c = contacts[index++];
          tx.executeSql(
            insertQuery,
            [
              c.contactId,
              c.displayName,
              c.phoneNumber ?? '',
              c.group ?? '',
              c.address ?? '',
              c.relationship ?? '',
              c.memo ?? '',
            ],
            () => runNext(),
            (_tx: any, err: any) => {
              reject(err);
              return false;
            },
          );
        };
        runNext();
      },
      (err: any) => {
        console.error('Error saving contacts', err);
        reject(err);
      },
      () => resolve(),
    );
  });
};

/**
 * 연락처 한 명의 프로필(그룹·주소·관계·메모 등)을 갱신합니다.
 */
export const updateContact = async (
  db: any,
  contactId: string,
  fields: Partial<{
    displayName: string;
    phoneNumber: string;
    group: string;
    address: string;
    relationship: string;
    memo: string;
  }>,
): Promise<void> => {
  const updates: string[] = [];
  const values: any[] = [];
  if (fields.displayName !== undefined) {
    updates.push('displayName = ?');
    values.push(fields.displayName);
  }
  if (fields.phoneNumber !== undefined) {
    updates.push('phoneNumber = ?');
    values.push(fields.phoneNumber);
  }
  if (fields.group !== undefined) {
    updates.push('"group" = ?');
    values.push(fields.group);
  }
  if (fields.address !== undefined) {
    updates.push('address = ?');
    values.push(fields.address);
  }
  if (fields.relationship !== undefined) {
    updates.push('relationship = ?');
    values.push(fields.relationship);
  }
  if (fields.memo !== undefined) {
    updates.push('memo = ?');
    values.push(fields.memo);
  }
  if (updates.length === 0) return;
  values.push(contactId);
  await db.executeSql(
    `UPDATE contacts SET ${updates.join(', ')} WHERE contactId = ?;`,
    values,
  );
};

/**
 * 저장된 연락처 한 명과 해당 연락처의 모든 기념일을 삭제합니다.
 */
export const removeContact = async (
  db: any,
  contactId: string,
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx: any) => {
        tx.executeSql(
          'DELETE FROM events WHERE contactId = ?;',
          [contactId],
          () => {
            tx.executeSql(
              'DELETE FROM contacts WHERE contactId = ?;',
              [contactId],
              () => {},
              (_tx: any, err: any) => {
                reject(err);
                return false;
              },
            );
          },
          (_tx: any, err: any) => {
            reject(err);
            return false;
          },
        );
      },
      (err: any) => {
        console.error('Error removing contact', err);
        reject(err);
      },
      () => resolve(),
    );
  });
};

/** 백업용 연락처 행 타입 */
export type BackupContact = {
  contactId: string;
  displayName: string;
  phoneNumber: string;
  group?: string;
  address?: string;
  relationship?: string;
  memo?: string;
};

/** 백업용 이벤트 행 타입 (id 제외, 복원 시 재부여) */
export type BackupEvent = {
  contactId: string;
  type: string;
  amount: number;
  expenseAmount?: number;
  date: string;
  memo: string;
  recurring?: boolean;
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
    `SELECT contactId, displayName, phoneNumber,
            COALESCE("group", '') as "group",
            COALESCE(address, '') as address,
            COALESCE(relationship, '') as relationship,
            COALESCE(memo, '') as memo
     FROM contacts ORDER BY id ASC;`,
  );
  const contacts: BackupContact[] = [];
  const contactCount = contactsResults?.rows?.length ?? 0;
  for (let i = 0; i < contactCount; i++) {
    const row = contactsResults.rows.item(i);
    contacts.push({
      contactId: row.contactId,
      displayName: row.displayName ?? '',
      phoneNumber: row.phoneNumber ?? '',
      group: row.group ?? '',
      address: row.address ?? '',
      relationship: row.relationship ?? '',
      memo: row.memo ?? '',
    });
  }

  const [eventsResults] = await db.executeSql(
    'SELECT contactId, type, amount, expense_amount as expenseAmount, date, memo, COALESCE(recurring, 1) as recurring FROM events ORDER BY id ASC;',
  );
  const events: BackupEvent[] = [];
  const eventCount = eventsResults?.rows?.length ?? 0;
  for (let i = 0; i < eventCount; i++) {
    const row = eventsResults.rows.item(i);
    events.push({
      contactId: row.contactId,
      type: row.type,
      amount: row.amount ?? 0,
      expenseAmount: row.expenseAmount ?? 0,
      date: row.date,
      memo: row.memo ?? '',
      recurring: row.recurring !== 0,
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

  return new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx: any) => {
        const insertContact =
          'INSERT INTO contacts (contactId, displayName, phoneNumber, "group", address, relationship, memo) VALUES (?, ?, ?, ?, ?, ?, ?);';
        const insertEvent =
          'INSERT INTO events (contactId, type, amount, expense_amount, date, memo, recurring) VALUES (?, ?, ?, ?, ?, ?, ?);';

        tx.executeSql('DELETE FROM events;', [], () => {
          tx.executeSql('DELETE FROM contacts;', [], () => {
            let cIndex = 0;
            const runNextContact = () => {
              if (cIndex >= contacts.length) {
                let eIndex = 0;
                const runNextEvent = () => {
                  if (eIndex >= events.length) return;
                  const e = events[eIndex++];
                  if (e && e.contactId != null && e.date != null) {
                    tx.executeSql(
                      insertEvent,
                      [
                        String(e.contactId),
                        String(e.type ?? ''),
                        Number(e.amount) || 0,
                        Number(e?.expenseAmount) || 0,
                        String(e.date),
                        String(e.memo ?? ''),
                        e?.recurring !== false ? 1 : 0,
                      ],
                      () => runNextEvent(),
                      (_tx: any, err: any) => {
                        reject(err);
                        return false;
                      },
                    );
                  } else {
                    runNextEvent();
                  }
                };
                runNextEvent();
                return;
              }
              const c = contacts[cIndex++];
              if (c && c.contactId != null) {
                tx.executeSql(
                  insertContact,
                  [
                    String(c.contactId),
                    String(c.displayName ?? ''),
                    String(c.phoneNumber ?? ''),
                    String(c.group ?? ''),
                    String(c.address ?? ''),
                    String(c.relationship ?? ''),
                    String(c.memo ?? ''),
                  ],
                  () => runNextContact(),
                  (_tx: any, err: any) => {
                    reject(err);
                    return false;
                  },
                );
              } else {
                runNextContact();
              }
            };
            runNextContact();
          }, (_tx: any, err: any) => {
            reject(err);
            return false;
          });
        }, (_tx: any, err: any) => {
          reject(err);
          return false;
        });
      },
      (err: any) => reject(err),
      () => resolve(),
    );
  });
};

