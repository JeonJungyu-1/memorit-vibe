import { Platform } from 'react-native';
import type { useTheme } from 'tamagui';
import {
  fluidLedgerLight,
  fluidLedgerDark,
} from '../theme/fluidLedgerTokens';

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

/** Fluid 라이트 — 폴백·레거시 키 호환용 */
export const FLUID_LIGHT = {
  background: fluidLedgerLight.background,
  foreground: fluidLedgerLight.onSurface,
  muted: fluidLedgerLight.surfaceContainer,
  mutedText: fluidLedgerLight.onSurfaceVariant,
  accent: fluidLedgerLight.primary,
  border: fluidLedgerLight.outline,
  secondaryAccent: fluidLedgerLight.secondary,
  postIt: fluidLedgerLight.primaryContainer,
  cardBg: fluidLedgerLight.surfaceContainerLowest,
} as const;

/** Fluid 다크 */
export const FLUID_DARK = {
  background: fluidLedgerDark.background,
  foreground: fluidLedgerDark.onSurface,
  muted: fluidLedgerDark.surfaceContainer,
  mutedText: fluidLedgerDark.onSurfaceVariant,
  accent: fluidLedgerDark.primary,
  border: fluidLedgerDark.outline,
  secondaryAccent: fluidLedgerDark.secondary,
  postIt: fluidLedgerDark.primaryContainer,
  cardBg: fluidLedgerDark.surfaceContainerLowest,
} as const;

export const FLUID_COLORS = {
  light: FLUID_LIGHT,
  dark: FLUID_DARK,
} as const;

/** DESIGN.md xl 카드 라운드 (~12px) */
export const RADIUS_XL = 12;

export const RADIUS_SM = {
  borderRadius: RADIUS_XL,
} as const;

export const RADIUS_MD = {
  borderRadius: RADIUS_XL,
} as const;

export const RADIUS_LG = {
  borderRadius: RADIUS_XL,
} as const;

/** 톤 기반 은은한 플로팅 그림자 (blur 24, on_surface ~5% opacity) */
export const SOFT_FLOAT_SHADOW = {
  ...Platform.select({
    ios: {
      shadowColor: '#2c2f30',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
    },
    android: { elevation: 3 },
    default: {},
  }),
} as const;

/** @deprecated SOFT_FLOAT_SHADOW 사용 */
export const HARD_SHADOW = {
  shadowOffset: { width: 0, height: 4 },
  shadowRadius: 12,
  shadowOpacity: 0.08,
  shadowColor: '#2c2f30',
  elevation: 2,
} as const;

/** @deprecated HARD_SHADOW 사용 */
export const HARD_SHADOW_HOVER = HARD_SHADOW;

/** @deprecated HARD_SHADOW 사용 */
export const HARD_SHADOW_STRONG = {
  shadowOffset: { width: 0, height: 6 },
  shadowRadius: 16,
  shadowOpacity: 0.1,
  shadowColor: '#2c2f30',
  elevation: 4,
} as const;

export const CARD_SHADOW = {
  ...SOFT_FLOAT_SHADOW,
} as const;

export const SPACING = {
  screenPadding: 20,
  sectionGap: 24,
  sectionGapLarge: 32,
  rowGap: 12,
  itemGap: 8,
  touchTargetMin: 48,
} as const;

export const BUTTON_BORDER_WIDTH = 0;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

/**
 * Manrope — expo-font 로드 이름과 일치.
 */
export const FONT = {
  title: 22,
  sectionTitle: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  fontFamilyHeading: 'Manrope_700Bold',
  fontFamilyBody: 'Manrope_500Medium',
  fontFamilyMedium: 'Manrope_500Medium',
  fontFamilySemiBold: 'Manrope_600SemiBold',
  fontFamilyBold: 'Manrope_700Bold',
  fontFamilyExtraBold: 'Manrope_800ExtraBold',
} as const;
