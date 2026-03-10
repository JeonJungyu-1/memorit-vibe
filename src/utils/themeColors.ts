import type { useTheme } from 'tamagui';

/** Tamagui theme에서 색상 문자열 추출 (object val 또는 string) */
export function getThemeColor(
  theme: ReturnType<typeof useTheme>,
  key: string,
): string {
  const v = (theme as Record<string, unknown>)[key];
  if (typeof v === 'object' && v !== null && 'val' in v) {
    return (v as { val: string }).val;
  }
  return typeof v === 'string' ? v : '';
}

/** 화면/카드 패딩 등 일관된 간격 */
export const SPACING = {
  screenPadding: 20,
  sectionGap: 24,
  rowGap: 12,
  itemGap: 8,
  touchTargetMin: 44,
} as const;

/** 기본 라운드 값 (버튼, 카드, 입력창) */
export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
} as const;

/** 폰트 크기 통일 */
export const FONT = {
  title: 22,
  sectionTitle: 17,
  body: 16,
  bodySmall: 14,
  caption: 12,
} as const;
