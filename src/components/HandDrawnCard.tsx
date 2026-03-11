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
  WOBBLY_MD,
  WOBBLY_SM,
  CARD_SHADOW,
  HAND_DRAWN_LIGHT,
  HAND_DRAWN_DARK,
} from '../utils/themeColors';

export type HandDrawnCardDecoration = 'tape' | 'tack' | 'none';

export type HandDrawnCardProps = ViewProps & {
  /** 카드 내용 */
  children: React.ReactNode;
  /** 상단 데코: tape(회색 띠), tack(빨간 압정), none */
  decoration?: HandDrawnCardDecoration;
  /** 포스트잇 스타일 배경 (연한 노란/다크 시 어두운 톤) */
  postIt?: boolean;
  /** 카드 컨테이너에 적용할 추가 스타일 */
  style?: ViewStyle;
};

/**
 * Hand-Drawn 스타일 카드.
 * - wobbly border radius, hard shadow, 테두리.
 * - tape: 상단 중앙 회색 띠 + 약한 기울기
 * - tack: 상단 중앙 빨간 압정 원
 */
export function HandDrawnCard({
  children,
  decoration = 'none',
  postIt = false,
  style,
  ...rest
}: HandDrawnCardProps): React.ReactElement {
  const theme = useTheme();
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const palette = isDark ? HAND_DRAWN_DARK : HAND_DRAWN_LIGHT;

  const borderColor = getThemeColor(theme, 'borderColor') || palette.border;
  const cardBg = postIt
    ? palette.postIt
    : (getThemeColor(theme, 'backgroundHover') || palette.cardBg);
  const muted = getThemeColor(theme, 'gray4') || palette.muted;
  const accent = getThemeColor(theme, 'red9') || getThemeColor(theme, 'red10') || palette.accent;

  const cardStyle: ViewStyle = {
    backgroundColor: cardBg,
    borderWidth: 2,
    borderColor,
    ...WOBBLY_MD,
    shadowColor: palette.border,
    ...CARD_SHADOW,
  };

  return (
    <View style={[styles.wrapper]} {...rest}>
      {decoration === 'tape' && (
        <View
          style={[
            styles.tape,
            {
              backgroundColor: muted,
              borderColor: muted,
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
              borderColor: borderColor,
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
    borderWidth: 1,
    ...WOBBLY_SM,
    transform: [{ rotate: '-3deg' }],
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
    borderWidth: 2,
    zIndex: 1,
  },
});
