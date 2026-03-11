import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  TextInput,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from 'tamagui';
import {
  getThemeColor,
  WOBBLY_SM,
  FONT,
  SPACING,
} from '../utils/themeColors';

export type HandDrawnInputProps = Omit<
  TextInputProps,
  'style'
> & {
  /** 컨테이너/입력창에 적용할 스타일 */
  style?: ViewStyle;
  /** 입력창 내부 텍스트/플레이스홀더 스타일 (fontFamily 등은 기본 적용) */
  inputStyle?: TextInputProps['style'];
};

/**
 * Hand-Drawn 스타일 입력 필드.
 * - wobbly border radius, 2px 테두리, Patrick Hand 폰트.
 * - placeholder 색: muted, focus 시 테두리/링을 secondaryAccent(파란 볼펜)로 강조.
 */
export function HandDrawnInput({
  style,
  inputStyle,
  placeholderTextColor,
  onFocus,
  onBlur,
  ...rest
}: HandDrawnInputProps): React.ReactElement {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = getThemeColor(theme, 'borderColor') || '#2d2d2d';
  const muted = getThemeColor(theme, 'gray4') || getThemeColor(theme, 'color11') || '#e5e0d8';
  const placeholderColorFromTheme =
    getThemeColor(theme, 'placeholderColor') || getThemeColor(theme, 'color11') || '#6b6560';
  const secondaryAccent = getThemeColor(theme, 'blue9') || getThemeColor(theme, 'blue10') || '#2d5da1';
  const foreground = getThemeColor(theme, 'color') || '#2d2d2d';
  const cardBg = getThemeColor(theme, 'backgroundHover') ?? '#ffffff';

  const handleFocus = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      setIsFocused(true);
      onFocus?.(e);
    },
    [onFocus],
  );

  const handleBlur = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      setIsFocused(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  const focusRingColor = isFocused ? secondaryAccent : borderColor;
  const focusRingStyle: ViewStyle = isFocused
    ? { borderWidth: 2, borderColor: secondaryAccent }
    : {};

  return (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: cardBg,
          borderColor: focusRingColor,
          color: foreground,
        },
        focusRingStyle,
        inputStyle,
        style,
      ]}
      placeholderTextColor={placeholderTextColor ?? placeholderColorFromTheme}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    ...WOBBLY_SM,
    borderWidth: 2,
    paddingVertical: SPACING.itemGap,
    paddingHorizontal: 12,
    fontSize: FONT.body,
    fontFamily: FONT.fontFamilyBody,
    minHeight: SPACING.touchTargetMin,
  },
});
