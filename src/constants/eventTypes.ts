/**
 * 기념일 유형 단일 소스.
 * 추가 모달, 연락처 상세 목록, 홈 다가오는 기념일에서 공통 사용.
 */

export const EVENT_TYPE_OPTIONS = [
  { value: 'birthday', label: '생일', emoji: '🎂' },
  { value: 'anniversary', label: '기념일', emoji: '💕' },
  { value: 'wedding', label: '결혼식', emoji: '💒' },
  { value: 'funeral', label: '장례식', emoji: '🕯️' },
  { value: 'graduation', label: '졸업', emoji: '🎓' },
  { value: 'other', label: '기타', emoji: '📌' },
] as const;

const LABEL_MAP: Record<string, string> = Object.fromEntries(
  EVENT_TYPE_OPTIONS.map(opt => [opt.value, opt.label]),
);

const EMOJI_MAP: Record<string, string> = Object.fromEntries(
  EVENT_TYPE_OPTIONS.map(opt => [opt.value, opt.emoji]),
);

const DEFAULT_EMOJI = '📌';

/** 유형 코드로 표시 라벨 반환. 미정의 시 type 문자열 그대로 반환 */
export function getEventLabel(type: string): string {
  return LABEL_MAP[type] ?? type;
}

/** 유형 코드로 이모티콘 반환. 미정의 시 기본 이모티콘 반환 */
export function getEventEmoji(type: string): string {
  return EMOJI_MAP[type] ?? DEFAULT_EMOJI;
}

/** 이모티콘 + 공백 + 라벨 조합 (목록/모달 표시용) */
export function getEventDisplayText(type: string): string {
  return `${getEventEmoji(type)} ${getEventLabel(type)}`;
}
