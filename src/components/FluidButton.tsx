import React from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { useTheme } from 'tamagui';
import {
  getThemeColor,
  RADIUS_MD,
  SPACING,
  FONT,
} from '../utils/themeColors';
import { fluidLedgerLight, fluidLedgerDark } from '../theme/fluidLedgerTokens';
import { useThemeMode } from '../contexts/ThemeContext';

export type FluidButtonVariant = 'primary' | 'secondary';

export type FluidButtonProps = {
  variant?: FluidButtonVariant;
  onPress?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
};

/**
 * Fluid Ledger 스타일 버튼 (라운드·Manrope).
 */
export function FluidButton({
  variant = 'primary',
  onPress,
  children,
  disabled = false,
  style,
}: FluidButtonProps): React.ReactElement {
  const theme = useTheme();
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const p = isDark ? fluidLedgerDark : fluidLedgerLight;
  const primary = getThemeColor(theme, 'red9') || p.primary;
  const onPrimary = p.onPrimary;
  const surfaceHi = getThemeColor(theme, 'gray4') || p.surfaceContainer;
  const secondary = getThemeColor(theme, 'blue9') || p.secondary;

  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => {
        const base: ViewStyle = {
          ...RADIUS_MD,
          borderWidth: 0,
          minHeight: SPACING.touchTargetMin,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 18,
          opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
        };
        if (isPrimary) {
          return [
            base,
            { backgroundColor: primary },
            style,
          ];
        }
        return [
          base,
          {
            backgroundColor: surfaceHi,
          },
          style,
        ];
      }}
    >
      <Text
        style={[
          styles.label,
          {
            color: isPrimary ? onPrimary : secondary,
            fontFamily: FONT.fontFamilySemiBold,
          },
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: FONT.bodySmall,
    fontWeight: '600',
  },
});
