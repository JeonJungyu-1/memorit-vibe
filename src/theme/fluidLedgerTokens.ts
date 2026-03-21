/**
 * Fluid Ledger / code.html tailwind 색상 단일 소스.
 * @see DESIGN.md, Downloads/stitch/code.html
 */
export const fluidLedgerLight = {
  secondaryDim: '#3346a9',
  onSecondaryContainer: '#2a3da1',
  secondary: '#4052b6',
  outlineVariant: '#abadae',
  onPrimary: '#d1ffc8',
  onError: '#ffefec',
  secondaryContainer: '#c9cfff',
  inversePrimary: '#9df197',
  surface: '#f5f6f7',
  onSurfaceVariant: '#595c5d',
  onTertiaryFixedVariant: '#673573',
  tertiary: '#7b4886',
  tertiaryFixed: '#efb1f9',
  errorDim: '#b92902',
  onTertiaryContainer: '#5d2c69',
  surfaceContainer: '#e6e8ea',
  primaryFixed: '#9df197',
  surfaceBright: '#f5f6f7',
  onSecondary: '#f3f1ff',
  primary: '#176a21',
  onSurface: '#2c2f30',
  tertiaryContainer: '#efb1f9',
  inverseSurface: '#0c0f10',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHigh: '#e0e3e4',
  surfaceContainerLow: '#eff1f2',
  primaryContainer: '#9df197',
  onTertiary: '#ffeefd',
  error: '#b02500',
  surfaceContainerHighest: '#dadddf',
  onPrimaryFixedVariant: '#12661e',
  secondaryFixedDim: '#b7c0ff',
  onTertiaryFixed: '#471653',
  tertiaryFixedDim: '#e0a4ea',
  inverseOnSurface: '#9b9d9e',
  onPrimaryFixed: '#00460e',
  onBackground: '#2c2f30',
  onErrorContainer: '#520c00',
  onSecondaryFixedVariant: '#3447ab',
  onSecondaryFixed: '#10268d',
  errorContainer: '#f95630',
  outline: '#757778',
  background: '#f5f6f7',
  tertiaryDim: '#6e3c7a',
  surfaceVariant: '#dadddf',
  surfaceTint: '#176a21',
  primaryDim: '#025d16',
  onPrimaryContainer: '#005c15',
  secondaryFixed: '#c9cfff',
  surfaceDim: '#d1d5d7',
  primaryFixedDim: '#90e28a',
  /** 목업 활성 예산 카드 (라벤더 톤) */
  budgetCardTint: '#e8e4f5',
  budgetOnTint: '#3346a9',
} as const;

/**
 * Fluid 기반 다크 팔레트 (inverse·톤 레이어링).
 */
export const fluidLedgerDark = {
  ...fluidLedgerLight,
  background: '#0c0f10',
  surface: '#121518',
  surfaceBright: '#161a1d',
  surfaceContainerLowest: '#1a1e22',
  surfaceContainerLow: '#22262b',
  surfaceContainer: '#2a2f34',
  surfaceContainerHigh: '#32383e',
  surfaceContainerHighest: '#3d444b',
  onSurface: '#e8eaed',
  onBackground: '#e8eaed',
  onSurfaceVariant: '#b0b4b8',
  outline: '#8e9296',
  outlineVariant: '#5c6064',
  primary: '#9df197',
  primaryDim: '#6fce6a',
  onPrimary: '#00390c',
  primaryContainer: '#005c15',
  onPrimaryContainer: '#9df197',
  secondary: '#b7c0ff',
  secondaryContainer: '#3447ab',
  onSecondary: '#10268d',
  tertiary: '#e0a4ea',
  tertiaryContainer: '#5d2c69',
  onTertiaryContainer: '#efb1f9',
  inverseSurface: '#e8eaed',
  inverseOnSurface: '#2c2f30',
  budgetCardTint: '#2a2640',
  budgetOnTint: '#c9cfff',
} as const;

export type FluidLedgerPalette = typeof fluidLedgerLight;

/** 카테고리 칩·썸네일 그라데이션 (목업 톤) */
export const fluidCategoryPresentation: Record<
  string,
  { chipBg: string; chipText: string; gradient: [string, string] }
> = {
  wedding: {
    chipBg: '#fce4ec',
    chipText: '#880e4f',
    gradient: ['#f8bbd9', '#f48fb1'],
  },
  birthday: {
    chipBg: '#e3f2fd',
    chipText: '#1565c0',
    gradient: ['#90caf9', '#64b5f6'],
  },
  funeral: {
    chipBg: '#eceff1',
    chipText: '#455a64',
    gradient: ['#cfd8dc', '#b0bec5'],
  },
  anniversary: {
    chipBg: '#fce4ec',
    chipText: '#c2185b',
    gradient: ['#f48fb1', '#ec407a'],
  },
  graduation: {
    chipBg: '#e8f5e9',
    chipText: '#2e7d32',
    gradient: ['#a5d6a7', '#81c784'],
  },
  other: {
    chipBg: fluidLedgerLight.surfaceContainerLow,
    chipText: fluidLedgerLight.onSurfaceVariant,
    gradient: [fluidLedgerLight.surfaceContainerHigh, fluidLedgerLight.surfaceContainer],
  },
};

export function getFluidCategoryStyle(type: string) {
  return fluidCategoryPresentation[type] ?? fluidCategoryPresentation.other;
}
