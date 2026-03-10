/**
 * 금액을 천 단위 구분으로 포맷 (예: 50000 → "50,000원")
 */
export function formatCurrency(amount: number): string {
  if (amount === 0) return '0원';
  return `${amount.toLocaleString('ko-KR')}원`;
}
