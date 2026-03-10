import { createTamagui } from 'tamagui';
import { config as defaultConfig } from '@tamagui/config/v3';
import {
  HAND_DRAWN_LIGHT,
  HAND_DRAWN_DARK,
} from './src/utils/themeColors';

/**
 * Hand-Drawn 라이트 테마 오버라이드.
 * getThemeColor(theme, key) 패턴을 유지하며 기존 키에 Hand-Drawn 팔레트 매핑.
 */
const handDrawnLightOverrides = {
  color: HAND_DRAWN_LIGHT.foreground,
  background: HAND_DRAWN_LIGHT.background,
  borderColor: HAND_DRAWN_LIGHT.border,
  backgroundHover: '#f5f3ef',
  placeholderColor: HAND_DRAWN_LIGHT.mutedText,
  blue9: HAND_DRAWN_LIGHT.secondaryAccent,
  blue10: HAND_DRAWN_LIGHT.secondaryAccent,
  gray3: '#ebe7e0',
  gray4: HAND_DRAWN_LIGHT.muted,
  gray11: HAND_DRAWN_LIGHT.mutedText,
  color11: HAND_DRAWN_LIGHT.mutedText,
  red9: HAND_DRAWN_LIGHT.accent,
  red10: HAND_DRAWN_LIGHT.accent,
};

/**
 * Hand-Drawn 다크 테마 오버라이드.
 */
const handDrawnDarkOverrides = {
  color: HAND_DRAWN_DARK.foreground,
  background: HAND_DRAWN_DARK.background,
  borderColor: HAND_DRAWN_DARK.border,
  backgroundHover: HAND_DRAWN_DARK.cardBg,
  placeholderColor: HAND_DRAWN_DARK.mutedText,
  blue9: HAND_DRAWN_DARK.secondaryAccent,
  blue10: HAND_DRAWN_DARK.secondaryAccent,
  gray3: '#36332e',
  gray4: HAND_DRAWN_DARK.muted,
  gray11: HAND_DRAWN_DARK.mutedText,
  color11: HAND_DRAWN_DARK.mutedText,
  red9: HAND_DRAWN_DARK.accent,
  red10: HAND_DRAWN_DARK.accent,
};

const lightTheme =
  defaultConfig.themes?.light != null
    ? { ...defaultConfig.themes.light, ...handDrawnLightOverrides }
    : handDrawnLightOverrides;

const darkTheme =
  defaultConfig.themes?.dark != null
    ? { ...defaultConfig.themes.dark, ...handDrawnDarkOverrides }
    : handDrawnDarkOverrides;

const config = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    light: lightTheme,
    dark: darkTheme,
  },
});

export default config;
