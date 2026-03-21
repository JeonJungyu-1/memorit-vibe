import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FONT } from '../../utils/themeColors';
import { fluidLedgerLight, fluidLedgerDark } from '../../theme/fluidLedgerTokens';
import { useThemeMode } from '../../contexts/ThemeContext';

export type FluidAppBarProps = {
  title?: string;
  onPressProfile?: () => void;
  onPressNotifications?: () => void;
};

export function FluidAppBar({
  title = 'Memorit',
  onPressProfile,
  onPressNotifications,
}: FluidAppBarProps) {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const p = isDark ? fluidLedgerDark : fluidLedgerLight;
  const titleColor = p.primary;
  const iconColor = p.primaryDim;

  return (
    <View style={[styles.row, { backgroundColor: p.surfaceBright }]}>
      <Pressable
        onPress={onPressProfile}
        accessibilityRole="button"
        hitSlop={12}
        style={styles.avatarWrap}
      >
        <View style={[styles.avatar, { backgroundColor: p.surfaceContainer }]}>
          <MaterialCommunityIcons name="account" size={22} color={p.onSurfaceVariant} />
        </View>
      </Pressable>
      <Text style={[styles.title, { color: titleColor, fontFamily: FONT.fontFamilyExtraBold }]}>
        {title}
      </Text>
      <Pressable
        onPress={onPressNotifications}
        accessibilityRole="button"
        hitSlop={12}
        style={[styles.iconBtn, { backgroundColor: p.surfaceContainerLow }]}
      >
        <MaterialCommunityIcons name="bell-outline" size={22} color={iconColor} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  avatarWrap: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
