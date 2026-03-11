/**
 * 연락처 그룹/태그 단일 소스.
 * 연락처 목록 필터·정렬, 프로필 수정에서 공통 사용.
 */

export const CONTACT_GROUP_OPTIONS = [
  { value: '', label: '미지정', emoji: '' },
  { value: 'family', label: '가족', emoji: '👨‍👩‍👧‍👦' },
  { value: 'work', label: '직장', emoji: '💼' },
  { value: 'friend', label: '친구', emoji: '👋' },
  { value: 'other', label: '기타', emoji: '📌' },
] as const;

export type ContactGroupValue = (typeof CONTACT_GROUP_OPTIONS)[number]['value'];

const LABEL_MAP: Record<string, string> = Object.fromEntries(
  CONTACT_GROUP_OPTIONS.filter(opt => opt.value).map(opt => [opt.value, opt.label]),
);

const EMOJI_MAP: Record<string, string> = Object.fromEntries(
  CONTACT_GROUP_OPTIONS.filter(opt => opt.value).map(opt => [opt.value, opt.emoji]),
);

/** 그룹 코드로 표시 라벨 반환 */
export function getContactGroupLabel(group: string | null | undefined): string {
  if (!group) return '미지정';
  return LABEL_MAP[group] ?? group;
}

/** 그룹 코드로 이모티콘 반환 (미지정이면 빈 문자열) */
export function getContactGroupEmoji(group: string | null | undefined): string {
  if (!group) return '';
  return EMOJI_MAP[group] ?? '';
}

/** 필터용 그룹 목록 (미지정 제외) */
export const CONTACT_GROUP_FILTER_OPTIONS = CONTACT_GROUP_OPTIONS.filter(
  opt => opt.value !== '',
);
