/**
 * 월간 캘린더 그리드 계산 유틸.
 * 날짜는 YYYY-MM-DD 문자열로 통일.
 */

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function getWeekdayLabels(): string[] {
  return WEEKDAY_LABELS;
}

/** YYYY-MM-DD → Date (로컬) */
export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Date → YYYY-MM-DD */
export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 해당 월 1일의 요일 (0=일요일) */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

/** 해당 월 일수 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export type CalendarCell =
  | { type: 'empty' }
  | { type: 'day'; dateString: string; day: number };

/**
 * 한 달을 7열(일~토) 그리드로 펼침. 앞쪽 빈 칸 + 1~말일 + 뒤쪽 빈 칸.
 */
export function getMonthGrid(year: number, month: number): CalendarCell[] {
  const first = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const cells: CalendarCell[] = [];

  for (let i = 0; i < first; i++) {
    cells.push({ type: 'empty' });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ type: 'day', dateString: dateStr, day: d });
  }
  const total = first + daysInMonth;
  const remainder = total % 7;
  const trailingEmpty = remainder === 0 ? 0 : 7 - remainder;
  for (let i = 0; i < trailingEmpty; i++) {
    cells.push({ type: 'empty' });
  }
  return cells;
}

/** 오늘 YYYY-MM-DD */
export function getTodayString(): string {
  return toDateString(new Date());
}
