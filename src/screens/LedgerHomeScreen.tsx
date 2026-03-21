import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import type { LedgerHomeScreenProps } from '../navigation/types';
import {
  getDBConnection,
  createTables,
  getRecentLedgerEvents,
  getTotalExpenseInDateRange,
  getExpenseSummaryByType,
  getTotalEventCount,
  type LedgerEventRow,
} from '../db/Database';
import { formatCurrency } from '../utils/format';
import { getEventLabel } from '../constants/eventTypes';
import { getMonthlyBudgetGoalKrw } from '../utils/budgetSettings';
import { FluidAppBar } from '../components/ledger/FluidAppBar';
import { ExpenditureHeroCard } from '../components/ledger/ExpenditureHeroCard';
import { RecentActivityBento } from '../components/ledger/RecentActivityBento';
import { ActiveBudgetCard } from '../components/ledger/ActiveBudgetCard';
import { EventLedgerCard } from '../components/ledger/EventLedgerCard';
import { CategorySummaryGrid } from '../components/ledger/CategorySummaryGrid';
import { SPACING, getThemeColor } from '../utils/themeColors';
import { useTheme } from 'tamagui';
import { fluidLedgerLight, fluidLedgerDark } from '../theme/fluidLedgerTokens';
import { useThemeMode } from '../contexts/ThemeContext';

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function quarterBounds(d: Date): { start: string; end: string } {
  const month = d.getMonth();
  const qStartMonth = Math.floor(month / 3) * 3;
  const start = new Date(d.getFullYear(), qStartMonth, 1);
  const end = new Date(d.getFullYear(), qStartMonth + 3, 0);
  return { start: toYmd(start), end: toYmd(end) };
}

function previousQuarterBounds(d: Date): { start: string; end: string } {
  const { start } = quarterBounds(d);
  const dayBefore = new Date(`${start}T12:00:00`);
  dayBefore.setDate(dayBefore.getDate() - 1);
  return quarterBounds(dayBefore);
}

function monthBounds(d: Date): { start: string; end: string } {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start: toYmd(start), end: toYmd(end) };
}

function formatLedgerDate(iso: string): string {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${y}. ${m}. ${d}.`;
}

const LedgerHomeScreen: React.FC<LedgerHomeScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const p = isDark ? fluidLedgerDark : fluidLedgerLight;
  const accent = getThemeColor(theme, 'red9') || p.primary;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<LedgerEventRow[]>([]);
  const [quarterTotal, setQuarterTotal] = useState(0);
  const [trendLabel, setTrendLabel] = useState<string | null>(null);
  const [trendUp, setTrendUp] = useState(true);
  const [categoryCount, setCategoryCount] = useState(0);
  const [totalsByType, setTotalsByType] = useState<Record<string, number>>({});
  const [totalEventCount, setTotalEventCount] = useState(0);
  const [budgetGoal, setBudgetGoal] = useState(0);
  const [monthSpent, setMonthSpent] = useState(0);

  const load = useCallback(async () => {
    try {
      const db = await getDBConnection();
      await createTables(db);
      const now = new Date();
      const q = quarterBounds(now);
      const pq = previousQuarterBounds(now);
      const m = monthBounds(now);

      const [list, curQ, prevQ, byType, evtCount, spentMonth, goal] =
        await Promise.all([
          getRecentLedgerEvents(db, 50),
          getTotalExpenseInDateRange(db, q.start, q.end),
          getTotalExpenseInDateRange(db, pq.start, pq.end),
          getExpenseSummaryByType(db),
          getTotalEventCount(db),
          getTotalExpenseInDateRange(db, m.start, m.end),
          getMonthlyBudgetGoalKrw(),
        ]);

      setEvents(list);
      setQuarterTotal(curQ);
      setCategoryCount(byType.filter(t => t.count > 0).length);
      const map: Record<string, number> = {};
      for (const row of byType) {
        map[row.type] = row.totalExpense;
      }
      setTotalsByType(map);
      setTotalEventCount(evtCount);
      setMonthSpent(spentMonth);
      setBudgetGoal(goal);

      let label: string | null = null;
      let up = true;
      if (prevQ > 0) {
        const pct = Math.round(((curQ - prevQ) / prevQ) * 100);
        label = `전분기 대비 ${Math.abs(pct)}% ${pct >= 0 ? '증가' : '감소'}`;
        up = pct >= 0;
      } else if (curQ > 0) {
        label = '전분기 지출 없음 — 이번 분기 기준';
        up = true;
      }
      setTrendLabel(label);
      setTrendUp(up);
    } catch (e) {
      console.warn('LedgerHome load failed', e);
      Toast.show({
        type: 'error',
        text1: '불러오기 실패',
        text2: '데이터를 다시 시도해주세요.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const openHelper = useCallback(() => {
    navigation.getParent()?.navigate('Helper');
  }, [navigation]);

  const openSettings = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  const budgetProgress =
    budgetGoal > 0 ? Math.min(1, monthSpent / budgetGoal) : 0;
  const remainingLabel =
    budgetGoal > 0
      ? `${formatCurrency(Math.max(0, budgetGoal - monthSpent))} 남음`
      : '예산 목표를 설정에서 지정할 수 있어요';

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: p.surface }]}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: p.surface }]}>
      <FluidAppBar
        title="Memorit"
        onPressProfile={openSettings}
        onPressNotifications={openHelper}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
        }
        showsVerticalScrollIndicator={false}
      >
        <ExpenditureHeroCard
          overline="이번 분기 총 이벤트 지출"
          amountLabel={formatCurrency(quarterTotal)}
          trendLabel={trendLabel}
          trendUp={trendUp}
        />

        <View style={{ height: SPACING.sectionGap }} />

        <RecentActivityBento
          title="최근 활동"
          subtitle={`${categoryCount || 0}개 이벤트 유형 관리 중`}
          onExportPdf={() =>
            Toast.show({ type: 'info', text1: '준비 중', text2: 'PDF보내기는 곧 제공됩니다.' })
          }
          onAddEvent={() => {
            navigation.navigate('Contacts');
            Toast.show({
              type: 'info',
              text1: '이벤트 추가',
              text2: '목록 탭에서 연락처를 선택해 주세요.',
            });
          }}
        />

        <View style={{ height: SPACING.rowGap }} />

        <ActiveBudgetCard progress={budgetProgress} remainingLabel={remainingLabel} />

        <View style={{ height: SPACING.sectionGap }} />

        <Text style={[styles.sectionTitle, { color: p.onSurface }]}>이벤트</Text>

        {events.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: p.surfaceContainerLow }]}>
            <Text style={{ color: p.onSurfaceVariant, textAlign: 'center' }}>
              아직 기록된 이벤트가 없습니다.{'\n'}목록 탭에서 연락처와 기념일을 추가해 보세요.
            </Text>
          </View>
        ) : (
          events.map(ev => (
            <EventLedgerCard
              key={ev.id}
              type={ev.type}
              dateLabel={formatLedgerDate(ev.date)}
              title={ev.displayName || '이름 없음'}
              description={ev.memo || getEventLabel(ev.type)}
              expenseAmount={ev.expenseAmount}
              onPress={() =>
                navigation.navigate('ContactDetail', { contactId: ev.contactId })
              }
            />
          ))
        )}

        <View style={{ height: SPACING.sectionGap }} />

        <CategorySummaryGrid totalsByType={totalsByType} totalEventCount={totalEventCount} />

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: SPACING.screenPadding, paddingBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  empty: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 8,
  },
});

export default LedgerHomeScreen;
