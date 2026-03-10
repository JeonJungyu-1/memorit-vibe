import React from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { useTheme } from 'tamagui';
import {
  getThemeColor,
  WOBBLY_MD,
  HARD_SHADOW,
  SPACING,
  FONT,
} from '../utils/themeColors';

export type HandDrawnButtonVariant = 'primary' | 'secondary';

export type HandDrawnButtonProps = {
  variant?: HandDrawnButtonVariant;
  onPress?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
};

/**
 * Hand-Drawn 스타일 버튼.
 * - wobbly border radius, hard shadow, pressed 시 그림자 제거 + translate 효과.
 * - primary: 기본 흰 배경 + 검정 테두리/글자, 누르면 accent(빨강) + 그림자 축소.
 * - secondary: muted 배경 + 파란 테두리/강조, 누르면 secondaryAccent 강조.
 */
export function HandDrawnButton({
  variant = 'primary',
  onPress,
  children,
  disabled = false,
  style,
}: HandDrawnButtonProps): React.ReactElement {
  const theme = useTheme();
  const foreground = getThemeColor(theme, 'color') || '#2d2d2d';
  const borderColor = getThemeColor(theme, 'borderColor') || '#2d2d2d';
  const accent = getThemeColor(theme, 'red9') || getThemeColor(theme, 'red10') || '#ff4d4d';
  const secondaryAccent = getThemeColor(theme, 'blue9') || getThemeColor(theme, 'blue10') || '#2d5da1';
  const muted = getThemeColor(theme, 'gray4') || getThemeColor(theme, 'color11') || '#e5e0d8';
  const cardBg = getThemeColor(theme, 'backgroundHover') ?? '#ffffff';

  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => {
        const base: ViewStyle = {
          ...WOBBLY_MD,
          borderWidth: 2,
          minHeight: SPACING.touchTargetMin,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 10,
          paddingHorizontal: 16,
        };
        if (pressed || disabled) {
          return [
            base,
            {
              backgroundColor: isPrimary ? accent : cardBg,
              borderColor: isPrimary ? accent : secondaryAccent,
              shadowColor: 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 0,
              shadowOpacity: 0,
              elevation: 0,
              transform: [{ translateX: pressed && !disabled ? 2 : 0 }, { translateY: pressed && !disabled ? 2 : 0 }],
            },
            style,
          ];
        }
        return [
          base,
          {
            backgroundColor: isPrimary ? cardBg : muted,
            borderColor: isPrimary ? borderColor : secondaryAccent,
            shadowColor: borderColor,
            ...HARD_SHADOW,
            shadowOpacity: 1,
          },
          style,
        ];
      }}
    >
      {({ pressed }) => {
        const isPressedOrDisabled = pressed || disabled;
        const textColor = isPrimary
          ? isPressedOrDisabled
            ? '#fff'
            : foreground
          : isPressedOrDisabled
            ? secondaryAccent
            : secondaryAccent;
        return (
          <Text
            style={[
              styles.label,
              {
                color: textColor,
                fontFamily: FONT.fontFamilyBody,
                opacity: disabled ? 0.6 : 1,
              },
            ]}
          >
            {children}
          </Text>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: FONT.bodySmall,
    fontWeight: '600',
  },
});
