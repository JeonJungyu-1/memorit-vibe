import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getEventLabel } from '../../constants/eventTypes';
import { FONT } from '../../utils/themeColors';
import { fluidLedgerLight, fluidLedgerDark } from '../../theme/fluidLedgerTokens';
import { useThemeMode } from '../../contexts/ThemeContext';

const GRID_TYPES = ['wedding', 'birthday', 'funeral'] as const;

export type CategorySummaryGridProps = {
  /** type -> total expense */
  totalsByType: Record<string, number>;
  totalEventCount: number;
};

function formatCompactKrw(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}k`;
  }
  return `${amount}`;
}

export function CategorySummaryGrid({
  totalsByType,
  totalEventCount,
}: CategorySummaryGridProps) {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const p = isDark ? fluidLedgerDark : fluidLedgerLight;

  return (
    <View style={styles.grid}>
      {GRID_TYPES.map(type => {
        const total = totalsByType[type] ?? 0;
        const label = getEventLabel(type);
        return (
          <View
            key={type}
            style={[styles.cell, { backgroundColor: p.surfaceContainerLow }]}
          >
            <Text style={[styles.cellLabel, { color: p.onSurfaceVariant, fontFamily: FONT.fontFamilyMedium }]}>
              {label}
            </Text>
            <Text style={[styles.cellValue, { color: p.onSurface, fontFamily: FONT.fontFamilyBold }]}>
              {formatCompactKrw(total)}원
            </Text>
          </View>
        );
      })}
      <View style={[styles.cell, styles.cellAccent, { backgroundColor: p.primaryContainer }]}>
        <Text style={[styles.cellLabel, { color: p.onPrimaryContainer, fontFamily: FONT.fontFamilyMedium }]}>
          전체 건수
        </Text>
        <Text style={[styles.cellCount, { color: p.onPrimaryContainer, fontFamily: FONT.fontFamilyExtraBold }]}>
          {totalEventCount}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  cell: {
    width: '48%',
    flexGrow: 1,
    minWidth: '45%',
    borderRadius: 14,
    padding: 16,
    minHeight: 88,
    justifyContent: 'center',
  },
  cellAccent: {},
  cellLabel: { fontSize: 12, marginBottom: 6 },
  cellValue: { fontSize: 16 },
  cellCount: { fontSize: 28 },
});
