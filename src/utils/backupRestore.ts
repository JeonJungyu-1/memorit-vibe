import RNBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import {
  pickSingle,
  isCancel,
  types as docPickerTypes,
} from 'react-native-document-picker';
import type { BackupData } from '../db/Database';
import {
  getDBConnection,
  exportBackupData,
  restoreBackupData,
  closeDBConnection,
} from '../db/Database';

const BACKUP_FILENAME_PREFIX = 'memorit-backup';
const BACKUP_EXT = '.json';

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
  const result = await pickSingle({
    type: [docPickerTypes.json, docPickerTypes.plainText],
    copyTo: 'cachesDirectory',
  });

  const pathToRead = result.fileCopyUri ?? result.uri;
  if (!pathToRead) {
    throw new Error('선택한 파일을 읽을 수 없습니다.');
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

/** document picker 사용자 취소 여부 */
export function isDocumentPickerCancel(err: unknown): boolean {
  return isCancel(err);
}
