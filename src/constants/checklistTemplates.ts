/**
 * 경조사 도우미: 유형별 체크리스트 템플릿.
 * 결혼식/장례 등 유형별 할 일 목록(준비물, 방문 일정 등) 참고용.
 */

export type ChecklistEventType = 'wedding' | 'funeral' | 'graduation' | 'other';

export interface ChecklistItem {
  id: string;
  text: string;
  category?: 'preparation' | 'visit' | 'etiquette' | 'other';
}

export interface ChecklistTemplate {
  eventType: ChecklistEventType;
  title: string;
  description?: string;
  items: ChecklistItem[];
}

/** 결혼식 체크리스트 템플릿 */
export const WEDDING_CHECKLIST: ChecklistTemplate = {
  eventType: 'wedding',
  title: '결혼식',
  description: '결혼식 참석 시 참고할 준비사항입니다.',
  items: [
    { id: 'w1', text: '축의금 봉투 준비 (백색 봉투, 한지 또는 백봉투)', category: 'preparation' },
    { id: 'w2', text: '봉투 겉면에 "축의금" 또는 "祝 結婚" 등 정해진 문구 작성', category: 'preparation' },
    { id: 'w3', text: '금액은 홀수·짝수 구분 없이 관계에 맞는 액수 준비', category: 'preparation' },
    { id: 'w4', text: '복장: 남성 정장/넥타이, 여성 한복·드레스·정장 등 (청첩장 안내 확인)', category: 'preparation' },
    { id: 'w5', text: '식장 도착 시간 확인 (청첩장 또는 하객 안내)', category: 'visit' },
    { id: 'w6', text: '접대실에서 방명록·축의금 제출', category: 'visit' },
    { id: 'w7', text: '식 전 인사 및 식 후 축하 인사', category: 'etiquette' },
  ],
};

/** 장례식 체크리스트 템플릿 */
export const FUNERAL_CHECKLIST: ChecklistTemplate = {
  eventType: 'funeral',
  title: '장례식',
  description: '장례식·조문 시 참고할 준비사항입니다.',
  items: [
    { id: 'f1', text: '조의금 봉투 준비 (흰 봉투, "부의금" 문구)', category: 'preparation' },
    { id: 'f2', text: '금액은 만원 단위, 홀수(1·3·5만원 등) 사용', category: 'preparation' },
    { id: 'f3', text: '복장: 검정·회색·남색 등 어두운 단정한 옷', category: 'preparation' },
    { id: 'f4', text: '장례식장 위치·영안실·조문 시간 확인', category: 'visit' },
    { id: 'f5', text: '방명록 작성 후 조의금 제출', category: 'visit' },
    { id: 'f6', text: '영정 앞에 절 또는 묵념', category: 'etiquette' },
    { id: 'f7', text: '유가족에게 조의 인사', category: 'etiquette' },
  ],
};

/** 졸업 체크리스트 템플릿 */
export const GRADUATION_CHECKLIST: ChecklistTemplate = {
  eventType: 'graduation',
  title: '졸업',
  description: '졸업식 참석·축하 시 참고할 준비사항입니다.',
  items: [
    { id: 'g1', text: '축하 선물 또는 축하금 준비 (관계에 맞는 액수)', category: 'preparation' },
    { id: 'g2', text: '졸업식 일시·장소 확인', category: 'visit' },
    { id: 'g3', text: '식장 도착 시간 여유 있게 (좌석·주차 확인)', category: 'visit' },
    { id: 'g4', text: '복장: 단정한 격식복 또는 캐주얼 정장', category: 'preparation' },
    { id: 'g5', text: '졸업생에게 축하 인사 및 기념 촬영', category: 'etiquette' },
  ],
};

/** 기타 경조사 체크리스트 템플릿 */
export const OTHER_EVENT_CHECKLIST: ChecklistTemplate = {
  eventType: 'other',
  title: '기타 경조사',
  description: '돌잔치, 개업 등 기타 경조사 참석 시 참고사항입니다.',
  items: [
    { id: 'o1', text: '경조사 유형에 맞는 축의금·선물 준비', category: 'preparation' },
    { id: 'o2', text: '일시·장소·드레스코드(있을 경우) 확인', category: 'visit' },
    { id: 'o3', text: '단정한 복장으로 참석', category: 'preparation' },
    { id: 'o4', text: '주최측 안내에 따라 방명록·축의금 제출', category: 'visit' },
  ],
};

const CHECKLIST_MAP: Record<ChecklistEventType, ChecklistTemplate> = {
  wedding: WEDDING_CHECKLIST,
  funeral: FUNERAL_CHECKLIST,
  graduation: GRADUATION_CHECKLIST,
  other: OTHER_EVENT_CHECKLIST,
};

export function getChecklistTemplate(eventType: string): ChecklistTemplate {
  const key = (eventType === 'wedding' || eventType === 'funeral' || eventType === 'graduation'
    ? eventType
    : 'other') as ChecklistEventType;
  return CHECKLIST_MAP[key] ?? OTHER_EVENT_CHECKLIST;
}

/** 체크리스트가 정의된 이벤트 유형 목록 (화면에서 선택용) */
export const CHECKLIST_EVENT_TYPES: { value: ChecklistEventType; label: string }[] = [
  { value: 'wedding', label: '결혼식' },
  { value: 'funeral', label: '장례식' },
  { value: 'graduation', label: '졸업' },
  { value: 'other', label: '기타' },
];
