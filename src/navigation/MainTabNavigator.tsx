import React, { useCallback, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from 'tamagui';
import type { MainTabsParamList } from './types';
import LedgerHomeScreen from '../screens/LedgerHomeScreen';
import HomeScreen from '../screens/HomeScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { getThemeColor } from '../utils/themeColors';
import { fluidLedgerLight, fluidLedgerDark } from '../theme/fluidLedgerTokens';
import { useThemeMode } from '../contexts/ThemeContext';

const Tab = createBottomTabNavigator<MainTabsParamList>();

function TabIcon({
  name,
  color,
  focused,
  activeBg,
}: {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  focused: boolean;
  activeBg: string;
}) {
  if (focused) {
    return (
      <View style={[styles.iconFocusedWrap, { backgroundColor: activeBg }]}>
        <MaterialCommunityIcons name={name} size={22} color={color} />
      </View>
    );
  }
  return <MaterialCommunityIcons name={name} size={24} color={color} />;
}

const MainTabNavigator: React.FC = () => {
  const theme = useTheme();
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const palette = isDark ? fluidLedgerDark : fluidLedgerLight;

  const tabBarActive = getThemeColor(theme, 'red9') || palette.primary;
  const tabBarInactive = getThemeColor(theme, 'gray11') || palette.onSurfaceVariant;
  const surface = getThemeColor(theme, 'background') || palette.surface;
  const activeBg =
    resolvedTheme === 'dark' ? palette.surfaceContainerLow : '#d8f5dc';

  const iconDashboard = useCallback(
    ({ color, focused }: { color: string; focused: boolean }) => (
      <TabIcon
        name={focused ? 'view-dashboard' : 'view-dashboard-outline'}
        color={color}
        focused={focused}
        activeBg={activeBg}
      />
    ),
    [activeBg],
  );

  const iconList = useCallback(
    ({ color, focused }: { color: string; focused: boolean }) => (
      <TabIcon
        name="format-list-bulleted"
        color={color}
        focused={focused}
        activeBg={activeBg}
      />
    ),
    [activeBg],
  );

  const iconReports = useCallback(
    ({ color, focused }: { color: string; focused: boolean }) => (
      <TabIcon
        name="chart-bar"
        color={color}
        focused={focused}
        activeBg={activeBg}
      />
    ),
    [activeBg],
  );

  const iconSettings = useCallback(
    ({ color, focused }: { color: string; focused: boolean }) => (
      <TabIcon
        name={focused ? 'cog' : 'cog-outline'}
        color={color}
        focused={focused}
        activeBg={activeBg}
      />
    ),
    [activeBg],
  );

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: tabBarActive,
      tabBarInactiveTintColor: tabBarInactive,
      tabBarStyle: {
        backgroundColor: surface,
        borderTopWidth: 0,
        ...Platform.select({
          ios: {
            shadowColor: palette.onSurface,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
          },
          android: { elevation: 8 },
          default: {},
        }),
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontFamily: 'Manrope_600SemiBold',
      },
      tabBarItemStyle: { paddingTop: 4 },
    }),
    [palette.onSurface, surface, tabBarActive, tabBarInactive],
  );

  return (
    <Tab.Navigator initialRouteName="LedgerHome" screenOptions={screenOptions}>
      <Tab.Screen
        name="LedgerHome"
        component={LedgerHomeScreen}
        options={{
          title: '대시보드',
          tabBarIcon: iconDashboard,
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={HomeScreen}
        options={{
          title: '목록',
          tabBarIcon: iconList,
        }}
      />
      <Tab.Screen
        name="Reports"
        component={StatisticsScreen}
        options={{
          title: '리포트',
          tabBarIcon: iconReports,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: '설정',
          tabBarIcon: iconSettings,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconFocusedWrap: {
    borderRadius: 999,
    padding: 8,
  },
});

export default MainTabNavigator;
