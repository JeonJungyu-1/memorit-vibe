import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getEventLabel } from '../../constants/eventTypes';
import { getFluidCategoryStyle } from '../../theme/fluidLedgerTokens';
import { FONT, SOFT_FLOAT_SHADOW } from '../../utils/themeColors';
import { fluidLedgerLight, fluidLedgerDark } from '../../theme/fluidLedgerTokens';
import { useThemeMode } from '../../contexts/ThemeContext';
import { formatCurrency } from '../../utils/format';

export type EventLedgerCardProps = {
  type: string;
  dateLabel: string;
  title: string;
  description: string;
  expenseAmount: number;
  onPress: () => void;
};

export function EventLedgerCard({
  type,
  dateLabel,
  title,
  description,
  expenseAmount,
  onPress,
}: EventLedgerCardProps) {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const p = isDark ? fluidLedgerDark : fluidLedgerLight;
  const cat = getFluidCategoryStyle(type);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: p.surfaceContainerLowest,
          ...SOFT_FLOAT_SHADOW,
        },
      ]}
    >
      <LinearGradient
        colors={cat.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.thumb}
      />
      <View style={styles.metaRow}>
        <View style={[styles.chip, { backgroundColor: cat.chipBg }]}>
          <Text style={[styles.chipText, { color: cat.chipText, fontFamily: FONT.fontFamilyBold }]}>
            {getEventLabel(type).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.date, { color: p.onSurfaceVariant, fontFamily: FONT.fontFamilyMedium }]}>
          {dateLabel}
        </Text>
      </View>
      <Text style={[styles.cardTitle, { color: p.onSurface, fontFamily: FONT.fontFamilyBold }]} numberOfLines={2}>
        {title}
      </Text>
      <Text
        style={[styles.desc, { color: p.onSurfaceVariant, fontFamily: FONT.fontFamilyMedium }]}
        numberOfLines={2}
      >
        {description}
      </Text>
      <View style={styles.footer}>
        <Text style={[styles.amount, { color: p.primary, fontFamily: FONT.fontFamilyExtraBold }]}>
          {formatCurrency(expenseAmount)}
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={22} color={p.onSurfaceVariant} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  thumb: {
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: { fontSize: 10, letterSpacing: 0.5 },
  date: { fontSize: 12 },
  cardTitle: { fontSize: 17, marginBottom: 4 },
  desc: { fontSize: 13, marginBottom: 12, lineHeight: 18 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amount: { fontSize: 18 },
});
