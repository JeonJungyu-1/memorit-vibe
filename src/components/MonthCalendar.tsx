import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  getWeekdayLabels,
  getMonthGrid,
  toDateString,
  type CalendarCell,
} from '../utils/calendarUtils';
import { SPACING, FONT } from '../utils/themeColors';

export type MonthCalendarProps = {
  /** 표시할 연도·월 (1-based) */
  year: number;
  month: number;
  /** 이벤트가 있는 날짜 집합 (YYYY-MM-DD) */
  markedDates: Set<string>;
  /** 선택된 날짜 (YYYY-MM-DD) */
  selectedDate: string | null;
  /** 날짜 선택 시 */
  onDayPress: (dateString: string) => void;
  /** 이전/다음 월 이동 */
  onPrevMonth: () => void;
  onNextMonth: () => void;
  /** 테마 색상 */
  themeColors: {
    text: string;
    textMuted: string;
    accent: string;
    border: string;
    markedBg: string;
    selectedBg: string;
    todayBorder: string;
  };
};

/**
 * 월간 캘린더 그리드.
 * 이벤트 있는 날 표시, 날짜 터치 시 선택 및 콜백.
 */
export function MonthCalendar({
  year,
  month,
  markedDates,
  selectedDate,
  onDayPress,
  onPrevMonth,
  onNextMonth,
  themeColors,
}: MonthCalendarProps): React.ReactElement {
  const labels = getWeekdayLabels();
  const grid = getMonthGrid(year, month);
  const today = toDateString(new Date());

  const renderCell = (cell: CalendarCell, index: number) => {
    if (cell.type === 'empty') {
      return <View key={`empty-${index}`} style={styles.cell} />;
    }
    const { dateString, day } = cell;
    const hasEvent = markedDates.has(dateString);
    const isSelected = selectedDate === dateString;
    const isToday = dateString === today;

    return (
      <Pressable
        key={dateString}
        style={[
          styles.cell,
          styles.cellDay,
          hasEvent && { backgroundColor: themeColors.markedBg },
          isSelected && { backgroundColor: themeColors.selectedBg },
          isToday && {
            borderWidth: 2,
            borderColor: themeColors.todayBorder,
          },
        ]}
        onPress={() => onDayPress(dateString)}
      >
        <Text
          style={[
            styles.cellDayText,
            { color: themeColors.text },
            isSelected && { color: themeColors.accent, fontWeight: '700' },
          ]}
        >
          {day}
        </Text>
      </Pressable>
    );
  };

  const monthTitle = `${year}년 ${month}월`;

  const rows: CalendarCell[][] = [];
  for (let i = 0; i < grid.length; i += 7) {
    rows.push(grid.slice(i, i + 7));
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Pressable onPress={onPrevMonth} style={styles.arrow} hitSlop={12}>
          <Text style={[styles.arrowText, { color: themeColors.text }]}>{'‹'}</Text>
        </Pressable>
        <Text style={[styles.monthTitle, { color: themeColors.text }]}>
          {monthTitle}
        </Text>
        <Pressable onPress={onNextMonth} style={styles.arrow} hitSlop={12}>
          <Text style={[styles.arrowText, { color: themeColors.text }]}>{'›'}</Text>
        </Pressable>
      </View>
      <View style={styles.weekdayRow}>
        {labels.map((label) => (
          <View key={label} style={styles.cell}>
            <Text style={[styles.weekdayText, { color: themeColors.textMuted }]}>
              {label}
            </Text>
          </View>
        ))}
      </View>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.gridRow}>
          {row.map((cell, colIndex) =>
            renderCell(cell, rowIndex * 7 + colIndex),
          )}
        </View>
      ))}
    </View>
  );
}

const CELL_SIZE = 40;
const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.itemGap,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: SPACING.itemGap,
    borderBottomWidth: 1,
  },
  arrow: {
    padding: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 28,
    fontFamily: FONT.fontFamilyBody,
  },
  monthTitle: {
    fontSize: FONT.sectionTitle,
    fontWeight: '600',
    fontFamily: FONT.fontFamilyHeading,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginTop: SPACING.itemGap,
  },
  gridRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellDay: {
    borderRadius: 8,
  },
  cellDayText: {
    fontSize: FONT.bodySmall,
    fontFamily: FONT.fontFamilyBody,
  },
  weekdayText: {
    fontSize: FONT.caption,
    fontFamily: FONT.fontFamilyBody,
  },
});
