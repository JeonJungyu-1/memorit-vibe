# 홈 화면 위젯 구현 참고

iOS/Android 홈 화면 위젯은 React Native에서 네이티브 코드가 필요합니다.

## 옵션

- **Voltra**: JSX/React로 위젯 작성 후 SwiftUI( iOS ), Glance( Android )로 변환. 실시간 푸시·Live Activities 지원.
- **네이티브 브릿지**: Android `SharedStorage` + Kotlin 위젯, iOS `App Groups` + Swift 위젯. 앱에서 공유 저장소에 다가오는 경조사 N건을 쓰고, 위젯이 해당 데이터를 읽어 표시.

## 데이터

다가오는 경조사 목록은 `getUpcomingEvents(db, limit)` ( `src/db/Database.ts` )로 조회 가능. 위젯 연동 시 이 데이터를 네이티브 쪽 공유 저장소에 주기적으로 동기화하는 방식 검토.
