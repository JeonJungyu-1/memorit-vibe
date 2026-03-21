import React from 'react';
import {
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from 'tamagui';
import { useThemeMode } from '../contexts/ThemeContext';
import {
  getThemeColor,
  RADIUS_MD,
  SOFT_FLOAT_SHADOW,
  FLUID_LIGHT,
  FLUID_DARK,
} from '../utils/themeColors';

export type FluidCardDecoration = 'tape' | 'tack' | 'none';

export type FluidCardProps = ViewProps & {
  children: React.ReactNode;
  decoration?: FluidCardDecoration;
  postIt?: boolean;
  style?: ViewStyle;
};

/**
 * Fluid Ledger 카드 — 톤 분리·은은한 그림자 (테이프/압정 데코는 비활성 권장).
 */
export function FluidCard({
  children,
  decoration = 'none',
  postIt = false,
  style,
  ...rest
}: FluidCardProps): React.ReactElement {
  const theme = useTheme();
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const palette = isDark ? FLUID_DARK : FLUID_LIGHT;

  const cardBg = postIt
    ? palette.postIt
    : (getThemeColor(theme, 'backgroundHover') || palette.cardBg);
  const muted = getThemeColor(theme, 'gray4') || palette.muted;
  const accent = getThemeColor(theme, 'red9') || palette.accent;
  const borderColor = getThemeColor(theme, 'borderColor') || palette.border;

  const cardStyle: ViewStyle = {
    backgroundColor: cardBg,
    borderWidth: 0,
    ...RADIUS_MD,
    ...SOFT_FLOAT_SHADOW,
  };

  return (
    <View style={[styles.wrapper]} {...rest}>
      {decoration === 'tape' && (
        <View
          style={[
            styles.tape,
            {
              backgroundColor: muted,
            },
          ]}
        />
      )}
      {decoration === 'tack' && (
        <View
          style={[
            styles.tack,
            {
              backgroundColor: accent,
              borderColor,
            },
          ]}
        />
      )}
      <View style={[styles.card, cardStyle, style]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  card: {
    overflow: 'hidden',
    padding: 16,
  },
  tape: {
    position: 'absolute',
    top: -6,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 14,
    borderRadius: 4,
    zIndex: 1,
  },
  tack: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 0,
    zIndex: 1,
  },
});
