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

/** Hand-Drawn 라이트 팔레트 */
export const HAND_DRAWN_LIGHT = {
  background: '#fdfbf7',
  foreground: '#2d2d2d',
  muted: '#e5e0d8',
  /** 플레이스홀더·보조 텍스트용 (가독성 확보) */
  mutedText: '#6b6560',
  accent: '#ff4d4d',
  border: '#2d2d2d',
  secondaryAccent: '#2d5da1',
  postIt: '#fff9c4',
  cardBg: '#ffffff',
} as const;

/**
 * Hand-Drawn 다크 팔레트 (어두운 종이/스케치북 느낌).
 * foreground/mutedText는 배경 대비를 유지해 다크 모드 가독성을 확보함.
 */
export const HAND_DRAWN_DARK = {
  background: '#1a1916',
  foreground: '#e8e4dc',
  muted: '#2d2a26',
  /** 플레이스홀더·보조 텍스트용 (다크 배경에서 가독성 확보) */
  mutedText: '#a8a29e',
  accent: '#ff6b6b',
  border: '#4a4742',
  secondaryAccent: '#5b8fd4',
  postIt: '#3d3a30',
  cardBg: '#252320',
} as const;

/** 테마 모드에 따른 Hand-Drawn 색상 맵 */
export const HAND_DRAWN_COLORS = {
  light: HAND_DRAWN_LIGHT,
  dark: HAND_DRAWN_DARK,
} as const;

/**
 * Wobbly border radius (덜 둥근 손그림 느낌).
 * RN은 border-radius 퍼센트 미지원이므로 픽셀 값으로 비율 유지.
 */
export const WOBBLY_SM = {
  borderTopLeftRadius: 12,
  borderTopRightRadius: 8,
  borderBottomRightRadius: 14,
  borderBottomLeftRadius: 6,
} as const;

export const WOBBLY_MD = {
  borderTopLeftRadius: 18,
  borderTopRightRadius: 10,
  borderBottomRightRadius: 20,
  borderBottomLeftRadius: 8,
} as const;

export const WOBBLY_LG = {
  borderTopLeftRadius: 24,
  borderTopRightRadius: 14,
  borderBottomRightRadius: 28,
  borderBottomLeftRadius: 12,
} as const;

/**
 * Hard shadow (잘린 그림자). shadowColor는 테마에서 주입.
 * 기본: 4px 4px, 강조용: 8px 8px
 */
export const HARD_SHADOW = {
  shadowOffset: { width: 4, height: 4 },
  shadowRadius: 0,
  elevation: 4,
} as const;

/** Hover 시 들어 보이는 효과 (2px 2px) */
export const HARD_SHADOW_HOVER = {
  shadowOffset: { width: 2, height: 2 },
  shadowRadius: 0,
  elevation: 2,
} as const;

export const HARD_SHADOW_STRONG = {
  shadowOffset: { width: 8, height: 8 },
  shadowRadius: 0,
  elevation: 8,
} as const;

/** 카드용 은은한 하드 오프셋 그림자 (Design: 3px 3px 0 rgba(45,45,45,0.1)) */
export const CARD_SHADOW = {
  shadowOffset: { width: 3, height: 3 },
  shadowRadius: 0,
  shadowOpacity: 0.1,
  elevation: 3,
} as const;

/** 화면/카드 패딩 등 일관된 간격 (Design: touch min 48px, gap-8 등) */
export const SPACING = {
  screenPadding: 20,
  sectionGap: 24,
  sectionGapLarge: 32,
  rowGap: 12,
  itemGap: 8,
  touchTargetMin: 48,
} as const;

/** 버튼 테두리 두께 (Design: border-[3px] 최소) */
export const BUTTON_BORDER_WIDTH = 3;

/** 기본 라운드 값 (버튼, 카드, 입력창) — Hand-Drawn에서는 WOBBLY_* 사용 권장 */
export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
} as const;

/**
 * 폰트 크기 및 Hand-Drawn 폰트 패밀리.
 * fontFamily 값은 expo-font로 로드한 폰트 이름과 동일해야 함 (Kalam_700Bold, PatrickHand_400Regular).
 */
export const FONT = {
  title: 22,
  sectionTitle: 17,
  body: 16,
  bodySmall: 14,
  caption: 12,
  fontFamilyHeading: 'Kalam_700Bold',
  fontFamilyBody: 'PatrickHand_400Regular',
} as const;
