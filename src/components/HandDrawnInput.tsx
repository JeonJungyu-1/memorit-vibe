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
  RADIUS_MD,
  FONT,
  SPACING,
} from '../utils/themeColors';

export type HandDrawnInputProps = Omit<
  TextInputProps,
  'style'
> & {
  style?: ViewStyle;
  inputStyle?: TextInputProps['style'];
};

/**
 * Fluid Ledger 입력 — 배경 톤·포커스 시 세컨더리 링.
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

  const placeholderColorFromTheme =
    getThemeColor(theme, 'placeholderColor') || getThemeColor(theme, 'color11') || '#595c5d';
  const secondaryAccent = getThemeColor(theme, 'blue9') || getThemeColor(theme, 'blue10') || '#4052b6';
  const foreground = getThemeColor(theme, 'color') || '#2c2f30';
  const surfaceHi = getThemeColor(theme, 'gray3') || '#dadddf';

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

  return (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: surfaceHi,
          borderColor: isFocused ? secondaryAccent : 'transparent',
          color: foreground,
          borderWidth: isFocused ? 2 : 0,
        },
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
    ...RADIUS_MD,
    paddingVertical: SPACING.itemGap,
    paddingHorizontal: 14,
    fontSize: FONT.body,
    fontFamily: FONT.fontFamilyMedium,
    minHeight: SPACING.touchTargetMin,
  },
});
