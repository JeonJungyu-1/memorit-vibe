import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FONT } from '../../utils/themeColors';

export type ExpenditureHeroCardProps = {
  overline: string;
  amountLabel: string;
  trendLabel?: string | null;
  trendUp?: boolean;
};

export function ExpenditureHeroCard({
  overline,
  amountLabel,
  trendLabel,
  trendUp = true,
}: ExpenditureHeroCardProps) {
  return (
    <LinearGradient
      colors={['#176a21', '#025d16']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.glow} />
      <View style={styles.inner}>
        <Text style={[styles.overline, { fontFamily: FONT.fontFamilyBold }]}>{overline}</Text>
        <Text style={[styles.amount, { fontFamily: FONT.fontFamilyExtraBold }]} numberOfLines={1}>
          {amountLabel}
        </Text>
        {trendLabel ? (
          <View style={styles.trendRow}>
            <MaterialCommunityIcons
              name={trendUp ? 'trending-up' : 'trending-down'}
              size={16}
              color="rgba(209,255,200,0.95)"
            />
            <Text style={[styles.trendText, { fontFamily: FONT.fontFamilyMedium }]}>
              {trendLabel}
            </Text>
          </View>
        ) : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 16,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(209,255,200,0.12)',
  },
  inner: { position: 'relative', zIndex: 1 },
  overline: {
    color: 'rgba(209,255,200,0.85)',
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  amount: {
    color: '#d1ffc8',
    fontSize: 36,
    letterSpacing: -1,
    marginBottom: 10,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendText: {
    color: 'rgba(209,255,200,0.92)',
    fontSize: 13,
    flex: 1,
  },
});
