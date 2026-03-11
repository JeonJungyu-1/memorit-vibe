import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from 'tamagui';
import type { StatisticsScreenProps } from '../navigation/types';
import {
  getDBConnection,
  getExpenseSummaryByYearMonth,
  getExpenseSummaryByType,
  getUpcomingExpenseForecast,
  type YearMonthSummary,
  type TypeSummary,
} from '../db/Database';
import { getEventDisplayText } from '../constants/eventTypes';
import { getThemeColor, SPACING, FONT, HAND_DRAWN_LIGHT } from '../utils/themeColors';
import { HandDrawnButton } from '../components/HandDrawnButton';
import { HandDrawnCard } from '../components/HandDrawnCard';

const UPCOMING_FORECAST_MONTHS = 6;

/** 금액을 원화 문자열로 포맷 (예: 50,000원) */
function formatCurrency(amount: number): string {
  if (amount === 0) return '0원';
  return `${amount.toLocaleString('ko-KR')}원`;
}

const StatisticsScreen: React.FC<StatisticsScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const [yearMonthList, setYearMonthList] = useState<YearMonthSummary[]>([]);
  const [typeList, setTypeList] = useState<TypeSummary[]>([]);
  const [upcomingTotal, setUpcomingTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const accent =
    getThemeColor(theme, 'red9') || getThemeColor(theme, 'red10') || '#ff4d4d';
  const color = getThemeColor(theme, 'color') || '#2d2d2d';
  const colorMuted =
    getThemeColor(theme, 'color11') || getThemeColor(theme, 'gray11') || '#666';
  const borderLight = getThemeColor(theme, 'gray4') || '#eee';
  const backgroundColor = getThemeColor(theme, 'background') || HAND_DRAWN_LIGHT.background;

  const loadStats = useCallback(async () => {
    try {
      const db = await getDBConnection();
      const [ym, byType, forecast] = await Promise.all([
        getExpenseSummaryByYearMonth(db),
        getExpenseSummaryByType(db),
        getUpcomingExpenseForecast(db, UPCOMING_FORECAST_MONTHS),
      ]);
      setYearMonthList(ym);
      setTypeList(byType);
      setUpcomingTotal(forecast);
    } catch (e) {
      console.error('Failed to load statistics', e);
      setYearMonthList([]);
      setTypeList([]);
      setUpcomingTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats();
  }, [loadStats]);

  const themeStyles = useMemo(
    () => ({
      sectionTitle: { color },
      rowLabel: { color: colorMuted },
      rowValue: { color },
      empty: { color: colorMuted },
      border: { borderBottomColor: borderLight },
    }),
    [color, colorMuted, borderLight],
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.headerRow}>
        <HandDrawnButton variant="secondary" onPress={() => navigation.goBack()}>
          ← 뒤로
        </HandDrawnButton>
        <Text style={[styles.title, { color }]}>통계 · 분석</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
        }
      >
        {/* 다가오는 지출 예측 */}
        <HandDrawnCard style={styles.card}>
          <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>
            다가오는 지출 예측
          </Text>
          <Text style={[styles.forecastValue, { color: accent }]}>
            {formatCurrency(upcomingTotal)}
          </Text>
          <Text style={[styles.caption, themeStyles.rowLabel]}>
            향후 {UPCOMING_FORECAST_MONTHS}개월 내 예정된 경조사 비용 합계
          </Text>
        </HandDrawnCard>

        {/* 연도·월별 지출 요약 */}
        <HandDrawnCard style={styles.card}>
          <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>
            연도·월별 지출 요약
          </Text>
          {yearMonthList.length === 0 ? (
            <Text style={[styles.emptyText, themeStyles.empty]}>
              지출 데이터가 없습니다.
            </Text>
          ) : (
            yearMonthList.map((item, index) => (
              <View
                key={`${item.year}-${item.month}-${index}`}
                style={[styles.summaryRow, themeStyles.border]}
              >
                <Text style={[styles.rowLabel, themeStyles.rowLabel]}>
                  {item.year}년 {item.month}월
                </Text>
                <View style={styles.rowRight}>
                  <Text style={[styles.rowValue, themeStyles.rowValue]}>
                    {formatCurrency(item.totalExpense)}
                  </Text>
                  <Text style={[styles.countBadge, themeStyles.rowLabel]}>
                    {item.count}건
                  </Text>
                </View>
              </View>
            ))
          )}
        </HandDrawnCard>

        {/* 유형별 통계 */}
        <HandDrawnCard style={styles.card}>
          <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>
            유형별 통계
          </Text>
          {typeList.length === 0 ? (
            <Text style={[styles.emptyText, themeStyles.empty]}>
              이벤트 데이터가 없습니다.
            </Text>
          ) : (
            typeList.map((item, index) => (
              <View
                key={`${item.type}-${index}`}
                style={[styles.summaryRow, themeStyles.border]}
              >
                <Text style={[styles.rowLabel, themeStyles.rowLabel]}>
                  {getEventDisplayText(item.type)}
                </Text>
                <View style={styles.rowRight}>
                  <Text style={[styles.rowValue, themeStyles.rowValue]}>
                    {formatCurrency(item.totalExpense)}
                  </Text>
                  <Text style={[styles.countBadge, themeStyles.rowLabel]}>
                    {item.count}건
                  </Text>
                </View>
              </View>
            ))
          )}
        </HandDrawnCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.screenPadding,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sectionGap,
  },
  headerSpacer: {
    width: 80,
  },
  title: {
    fontSize: FONT.title,
    fontWeight: '700',
    fontFamily: FONT.fontFamilyHeading,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.sectionGap * 2,
  },
  card: {
    marginBottom: SPACING.sectionGap,
  },
  sectionTitle: {
    fontSize: FONT.sectionTitle,
    fontWeight: '600',
    fontFamily: FONT.fontFamilyHeading,
    marginBottom: SPACING.rowGap,
  },
  forecastValue: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: FONT.fontFamilyHeading,
    marginBottom: SPACING.itemGap,
  },
  caption: {
    fontSize: FONT.caption,
    fontFamily: FONT.fontFamilyBody,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.rowGap,
    borderBottomWidth: 1,
  },
  rowLabel: {
    fontSize: FONT.body,
    fontFamily: FONT.fontFamilyBody,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.itemGap,
  },
  rowValue: {
    fontSize: FONT.body,
    fontWeight: '600',
    fontFamily: FONT.fontFamilyBody,
  },
  countBadge: {
    fontSize: FONT.caption,
    fontFamily: FONT.fontFamilyBody,
  },
  emptyText: {
    fontSize: FONT.body,
    fontFamily: FONT.fontFamilyBody,
    paddingVertical: SPACING.rowGap,
  },
});

export default StatisticsScreen;
