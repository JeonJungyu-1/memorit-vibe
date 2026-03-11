/**
 * 경조사 도우미: 유형·관계별 축의금/봉투 참고 금액.
 * 참고용 일반적인 범위이며, 지역·관계에 따라 달라질 수 있음.
 */

export type RelationshipCategory =
  | 'family'
  | 'relative'
  | 'friend'
  | 'coworker'
  | 'acquaintance'
  | 'other';

export type EventTypeForGuide =
  | 'wedding'
  | 'funeral'
  | 'graduation'
  | 'other';

export interface AmountRange {
  minWon: number;
  maxWon: number;
  note?: string;
}

export interface CondolenceGuideItem {
  relationship: RelationshipCategory;
  label: string;
  range: AmountRange;
}

/** 관계 라벨 (한국어) */
export const RELATIONSHIP_LABELS: Record<RelationshipCategory, string> = {
  family: '가족',
  relative: '친척',
  friend: '친구',
  coworker: '직장 동료',
  acquaintance: '지인',
  other: '기타',
};

/** 결혼식 축의금 참고 (2020년대 일반적인 참고 범위) */
export const WEDDING_GUIDE: CondolenceGuideItem[] = [
  { relationship: 'family', label: '가족', range: { minWon: 100_000, maxWon: 500_000, note: '형제·자매 50만원 내외' } },
  { relationship: 'relative', label: '친척', range: { minWon: 50_000, maxWon: 100_000 } },
  { relationship: 'friend', label: '친구', range: { minWon: 50_000, maxWon: 100_000 } },
  { relationship: 'coworker', label: '직장 동료', range: { minWon: 30_000, maxWon: 50_000 } },
  { relationship: 'acquaintance', label: '지인', range: { minWon: 30_000, maxWon: 50_000 } },
  { relationship: 'other', label: '기타', range: { minWon: 30_000, maxWon: 50_000 } },
];

/** 장례식 조의금 참고 */
export const FUNERAL_GUIDE: CondolenceGuideItem[] = [
  { relationship: 'family', label: '가족', range: { minWon: 50_000, maxWon: 100_000 } },
  { relationship: 'relative', label: '친척', range: { minWon: 30_000, maxWon: 50_000 } },
  { relationship: 'friend', label: '친구', range: { minWon: 10_000, maxWon: 30_000 } },
  { relationship: 'coworker', label: '직장 동료', range: { minWon: 30_000, maxWon: 50_000 } },
  { relationship: 'acquaintance', label: '지인', range: { minWon: 10_000, maxWon: 30_000 } },
  { relationship: 'other', label: '기타', range: { minWon: 10_000, maxWon: 30_000 } },
];

/** 졸업 축하금/선물 참고 */
export const GRADUATION_GUIDE: CondolenceGuideItem[] = [
  { relationship: 'family', label: '가족', range: { minWon: 100_000, maxWon: 300_000, note: '선물 또는 현금' } },
  { relationship: 'relative', label: '친척', range: { minWon: 30_000, maxWon: 100_000 } },
  { relationship: 'friend', label: '친구', range: { minWon: 30_000, maxWon: 50_000 } },
  { relationship: 'coworker', label: '직장 동료', range: { minWon: 20_000, maxWon: 50_000 } },
  { relationship: 'acquaintance', label: '지인', range: { minWon: 20_000, maxWon: 30_000 } },
  { relationship: 'other', label: '기타', range: { minWon: 20_000, maxWon: 50_000 } },
];

/** 기타 경조사(돌잔치, 개업 등) 참고 */
export const OTHER_EVENT_GUIDE: CondolenceGuideItem[] = [
  { relationship: 'family', label: '가족', range: { minWon: 50_000, maxWon: 200_000 } },
  { relationship: 'relative', label: '친척', range: { minWon: 30_000, maxWon: 100_000 } },
  { relationship: 'friend', label: '친구', range: { minWon: 30_000, maxWon: 50_000 } },
  { relationship: 'coworker', label: '직장 동료', range: { minWon: 20_000, maxWon: 50_000 } },
  { relationship: 'acquaintance', label: '지인', range: { minWon: 20_000, maxWon: 30_000 } },
  { relationship: 'other', label: '기타', range: { minWon: 20_000, maxWon: 50_000 } },
];

const GUIDE_MAP: Record<EventTypeForGuide, CondolenceGuideItem[]> = {
  wedding: WEDDING_GUIDE,
  funeral: FUNERAL_GUIDE,
  graduation: GRADUATION_GUIDE,
  other: OTHER_EVENT_GUIDE,
};

export function getCondolenceGuide(eventType: string): CondolenceGuideItem[] {
  const key = (eventType === 'wedding' || eventType === 'funeral' || eventType === 'graduation'
    ? eventType
    : 'other') as EventTypeForGuide;
  return GUIDE_MAP[key] ?? OTHER_EVENT_GUIDE;
}

/** 금액을 "3만원 ~ 5만원" 형식으로 포맷 */
export function formatAmountRange(range: AmountRange): string {
  const min = (range.minWon / 10_000).toFixed(0);
  const max = (range.maxWon / 10_000).toFixed(0);
  if (range.minWon === range.maxWon) return `${min}만원`;
  return `${min}만원 ~ ${max}만원`;
}
