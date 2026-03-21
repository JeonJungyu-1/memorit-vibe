import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT, SOFT_FLOAT_SHADOW } from '../../utils/themeColors';
import { fluidLedgerLight, fluidLedgerDark } from '../../theme/fluidLedgerTokens';
import { useThemeMode } from '../../contexts/ThemeContext';

export type RecentActivityBentoProps = {
  title: string;
  subtitle: string;
  onExportPdf: () => void;
  onAddEvent: () => void;
};

export function RecentActivityBento({
  title,
  subtitle,
  onExportPdf,
  onAddEvent,
}: RecentActivityBentoProps) {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const p = isDark ? fluidLedgerDark : fluidLedgerLight;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: p.surfaceContainerLowest,
          ...SOFT_FLOAT_SHADOW,
        },
      ]}
    >
      <Text style={[styles.title, { color: p.onSurface, fontFamily: FONT.fontFamilyBold }]}>
        {title}
      </Text>
      <Text style={[styles.sub, { color: p.onSurfaceVariant, fontFamily: FONT.fontFamilyMedium }]}>
        {subtitle}
      </Text>
      <View style={styles.row}>
        <Pressable
          onPress={onExportPdf}
          style={[styles.btnSecondary, { backgroundColor: p.surfaceContainer }]}
        >
          <Text style={[styles.btnSecondaryText, { color: p.onSurface, fontFamily: FONT.fontFamilySemiBold }]}>
            PDF보내기
          </Text>
        </Pressable>
        <Pressable
          onPress={onAddEvent}
          style={[styles.btnPrimary, { backgroundColor: p.primary }]}
        >
          <Text style={[styles.btnPrimaryText, { color: p.onPrimary, fontFamily: FONT.fontFamilySemiBold }]}>
            이벤트 추가
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 18,
  },
  title: { fontSize: 17, marginBottom: 4 },
  sub: { fontSize: 13, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 10 },
  btnSecondary: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  btnPrimary: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  btnSecondaryText: { fontSize: 14 },
  btnPrimaryText: { fontSize: 14 },
});
