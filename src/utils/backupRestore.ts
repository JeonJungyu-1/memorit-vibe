import RNBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import {
  pick,
  keepLocalCopy,
  types as docPickerTypes,
  errorCodes,
  isErrorWithCode,
} from '@react-native-documents/picker';
import type { BackupData, BackupContact, BackupEvent } from '../db/Database';
import {
  getDBConnection,
  exportBackupData,
  restoreBackupData,
  closeDBConnection,
} from '../db/Database';
import { getEventLabel } from '../constants/eventTypes';
import { setAutoBackupLastAt, shouldRunAutoBackup } from './autoBackupSettings';

const BACKUP_FILENAME_PREFIX = 'memorit-backup';
const BACKUP_EXT = '.json';
const AUTO_BACKUP_FILENAME = 'memorit-auto-backup.json';
const CSV_FILENAME_PREFIX = 'memorit-events';
const CSV_EXT = '.csv';

/**
 * 현재 DB 데이터를 JSON으로 내보낸 뒤 공유 시트를 엽니다.
 * @returns 성공 시 공유 결과, 실패 시 에러 throw
 */
export async function exportAndShareBackup(): Promise<void> {
  const db = await getDBConnection();
  const data = await exportBackupData(db);
  const json = JSON.stringify(data, null, 2);
  const filename = `${BACKUP_FILENAME_PREFIX}-${new Date().toISOString().slice(0, 10)}${BACKUP_EXT}`;
  const path = `${RNBlobUtil.fs.dirs.CacheDir}/${filename}`;

  await RNBlobUtil.fs.writeFile(path, json, 'utf8');

  const fileUrl = path.startsWith('/') ? `file://${path}` : path;

  await Share.open({
    url: fileUrl,
    type: 'application/json',
    filename,
    title: 'Memorit 백업 공유',
    message: 'Memorit 데이터 백업 파일입니다.',
  });

  try {
    await RNBlobUtil.fs.unlink(path);
  } catch {
    // 캐시 정리 실패는 무시
  }
}

/**
 * 사용자가 선택한 백업 파일을 읽어 복원합니다.
 * 복원 후 DB 캐시를 닫아 다음 접근 시 새 연결을 사용하도록 합니다.
 * @returns 복원된 연락처 수
 */
export async function pickAndRestoreBackup(): Promise<{
  contactsCount: number;
}> {
  const [pickedFile] = await pick({
    type: [docPickerTypes.json, docPickerTypes.plainText],
    allowMultiSelection: false,
  });

  const [copyResult] = await keepLocalCopy({
    files: [
      {
        uri: pickedFile.uri,
        fileName: pickedFile.name ?? 'backup.json',
      },
    ],
    destination: 'cachesDirectory',
  });

  const pathToRead =
    copyResult.status === 'success' ? copyResult.localUri : null;
  if (!pathToRead) {
    const message =
      copyResult.status === 'error' ? copyResult.copyError : '선택한 파일을 읽을 수 없습니다.';
    throw new Error(message);
  }

  const normalizedPath = pathToRead.replace(/^file:\/\//, '');
  const raw = await RNBlobUtil.fs.readFile(normalizedPath, 'utf8');
  const data = JSON.parse(raw) as BackupData;

  const db = await getDBConnection();
  await restoreBackupData(db, data);
  const contactsCount = data.contacts?.length ?? 0;
  await closeDBConnection();

  return { contactsCount };
}

/**
 * CSV 필드 이스케이프 (쉼표·줄바꿈·따옴표 포함 시 셀을 따옴표로 감싸고 내부 따옴표는 두 번)
 */
function escapeCsvCell(value: string): string {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * 백업 데이터를 회계/통계용 이벤트 CSV 문자열로 변환 (UTF-8 BOM 포함, Excel 호환)
 */
export function backupDataToEventsCsv(data: BackupData): string {
  const contactMap = new Map<string, string>();
  for (const c of data.contacts ?? []) {
    contactMap.set(c.contactId, c.displayName ?? '');
  }
  const header = ['연락처명', '유형', '날짜', '금액', '경조비', '메모', '반복'].map(escapeCsvCell).join(',');
  const rows = (data.events ?? []).map((e: BackupEvent) => {
    const displayName = contactMap.get(e.contactId) ?? e.contactId ?? '';
    const typeLabel = getEventLabel(e.type);
    return [
      displayName,
      typeLabel,
      e.date ?? '',
      String(e.amount ?? 0),
      String(e.expenseAmount ?? 0),
      e.memo ?? '',
      e.recurring ? 'Y' : '',
    ]
      .map(escapeCsvCell)
      .join(',');
  });
  const BOM = '\uFEFF';
  return BOM + [header, ...rows].join('\r\n');
}

/**
 * 백업 데이터를 연락처 CSV 문자열로 변환 (UTF-8 BOM 포함)
 */
export function backupDataToContactsCsv(data: BackupData): string {
  const header = ['이름', '전화번호', '그룹', '주소', '관계', '메모'].map(escapeCsvCell).join(',');
  const rows = (data.contacts ?? []).map((c: BackupContact) =>
    [c.displayName ?? '', c.phoneNumber ?? '', c.group ?? '', c.address ?? '', c.relationship ?? '', c.memo ?? '']
      .map(escapeCsvCell)
      .join(','),
  );
  const BOM = '\uFEFF';
  return BOM + [header, ...rows].join('\r\n');
}

/**
 * 현재 DB 데이터를 이벤트 CSV로 내보낸 뒤 공유 시트를 엽니다. (회계·통계용)
 */
export async function exportAndShareCsv(): Promise<void> {
  const db = await getDBConnection();
  const data = await exportBackupData(db);
  const csv = backupDataToEventsCsv(data);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `${CSV_FILENAME_PREFIX}-${dateStr}${CSV_EXT}`;
  const path = `${RNBlobUtil.fs.dirs.CacheDir}/${filename}`;
  await RNBlobUtil.fs.writeFile(path, csv, 'utf8');
  const fileUrl = path.startsWith('/') ? `file://${path}` : path;
  await Share.open({
    url: fileUrl,
    type: 'text/csv',
    filename,
    title: 'Memorit 경조사 CSV 공유',
    message: '경조사 이벤트 목록(회계·통계용)입니다.',
  });
  try {
    await RNBlobUtil.fs.unlink(path);
  } catch {
    // 캐시 정리 실패 무시
  }
}

/**
 * 자동 백업이 필요한 경우에만 로컬에 JSON 백업 파일을 저장하고 마지막 백업 시각을 갱신합니다.
 * 앱 포그라운드 시 호출용입니다.
 */
export async function runLocalAutoBackupIfNeeded(): Promise<boolean> {
  const ok = await shouldRunAutoBackup();
  if (!ok) return false;
  const db = await getDBConnection();
  const data = await exportBackupData(db);
  const json = JSON.stringify(data, null, 2);
  const dir = RNBlobUtil.fs.dirs.DocumentDir;
  const path = `${dir}/${AUTO_BACKUP_FILENAME}`;
  await RNBlobUtil.fs.writeFile(path, json, 'utf8');
  await setAutoBackupLastAt(new Date().toISOString());
  return true;
}

/** document picker 사용자 취소 여부 */
export function isDocumentPickerCancel(err: unknown): boolean {
  return isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED;
}
