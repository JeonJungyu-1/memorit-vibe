import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONT } from '../../utils/themeColors';
import { fluidLedgerLight, fluidLedgerDark } from '../../theme/fluidLedgerTokens';
import { useThemeMode } from '../../contexts/ThemeContext';

export type ActiveBudgetCardProps = {
  /** 0~1, 목표 미설정 시에도 시각용으로 사용 가능 */
  progress: number;
  remainingLabel: string;
  overline?: string;
};

export function ActiveBudgetCard({
  progress,
  remainingLabel,
  overline = '활성 예산',
}: ActiveBudgetCardProps) {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const p = isDark ? fluidLedgerDark : fluidLedgerLight;
  const tint = p.budgetCardTint;
  const onTint = p.budgetOnTint;
  const bar = Math.min(1, Math.max(0, progress));

  return (
    <View style={[styles.card, { backgroundColor: tint }]}>
      <Text style={[styles.overline, { color: onTint, fontFamily: FONT.fontFamilyBold }]}>
        {overline.toUpperCase()}
      </Text>
      <Text style={[styles.remaining, { color: onTint, fontFamily: FONT.fontFamilyExtraBold }]}>
        {remainingLabel}
      </Text>
      <View style={[styles.track, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(51,70,169,0.2)' }]}>
        <View style={[styles.fill, { width: `${bar * 100}%`, backgroundColor: onTint }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 18,
  },
  overline: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 6,
    opacity: 0.9,
  },
  remaining: {
    fontSize: 20,
    marginBottom: 14,
  },
  track: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
