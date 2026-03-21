import { createTamagui } from 'tamagui';
import { config as defaultConfig } from '@tamagui/config/v3';
import { fluidLedgerLight, fluidLedgerDark } from './src/theme/fluidLedgerTokens';

/**
 * Fluid Ledger 라이트 테마 — Tamagui 토큰 매핑.
 */
const fluidLightOverrides = {
  color: fluidLedgerLight.onSurface,
  background: fluidLedgerLight.surface,
  borderColor: fluidLedgerLight.outlineVariant,
  backgroundHover: fluidLedgerLight.surfaceContainerLowest,
  placeholderColor: fluidLedgerLight.onSurfaceVariant,
  blue9: fluidLedgerLight.secondary,
  blue10: fluidLedgerLight.secondaryDim,
  gray3: fluidLedgerLight.surfaceContainerLow,
  gray4: fluidLedgerLight.surfaceContainer,
  gray11: fluidLedgerLight.onSurfaceVariant,
  color11: fluidLedgerLight.onSurfaceVariant,
  red9: fluidLedgerLight.primary,
  red10: fluidLedgerLight.primaryDim,
};

const fluidDarkOverrides = {
  color: fluidLedgerDark.onSurface,
  background: fluidLedgerDark.surface,
  borderColor: fluidLedgerDark.outlineVariant,
  backgroundHover: fluidLedgerDark.surfaceContainerLowest,
  placeholderColor: fluidLedgerDark.onSurfaceVariant,
  blue9: fluidLedgerDark.secondary,
  blue10: fluidLedgerDark.secondary,
  gray3: fluidLedgerDark.surfaceContainerLow,
  gray4: fluidLedgerDark.surfaceContainer,
  gray11: fluidLedgerDark.onSurfaceVariant,
  color11: fluidLedgerDark.onSurfaceVariant,
  red9: fluidLedgerDark.primary,
  red10: fluidLedgerDark.primaryDim,
};

const lightTheme =
  defaultConfig.themes?.light != null
    ? { ...defaultConfig.themes.light, ...fluidLightOverrides }
    : fluidLightOverrides;

const darkTheme =
  defaultConfig.themes?.dark != null
    ? { ...defaultConfig.themes.dark, ...fluidDarkOverrides }
    : fluidDarkOverrides;

const config = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    light: lightTheme,
    dark: darkTheme,
  },
});

export default config;
