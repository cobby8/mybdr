# 작업 스크래치패드

## 현재 작업
- **요청**: 코트 유저 위키 시스템 — 사용자가 코트 정보를 수정 제안하는 기능
- **상태**: tester 검증 완료 (전항목 통과)
- **현재 담당**: tester → pm (커밋 대기)

## 구현 기록 (developer)

### 유저 위키 시스템 (7단계 전체 구현)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| prisma/schema.prisma | court_edit_suggestions 모델 + User 관계 2개 추가 | 수정 |
| src/lib/constants/court.ts | EDITABLE_FIELDS 14개 필드 상수 추가 | 수정 |
| src/lib/constants/gamification.ts | XP_REWARDS에 wiki_edit: 10 추가 | 수정 |
| src/app/api/web/courts/[id]/suggestions/route.ts | GET 목록 + POST 제안 생성 API | 신규 |
| src/app/api/web/courts/[id]/suggestions/[sugId]/route.ts | PATCH 승인/거절 API (admin) | 신규 |
| src/app/(web)/courts/[id]/_components/court-edit-suggest.tsx | 수정제안 폼+이력 컴포넌트 | 신규 |
| src/app/(web)/courts/[id]/page.tsx | CourtEditSuggest 컴포넌트 삽입 | 수정 |
| src/app/(admin)/admin/courts/page.tsx | pendingSuggestions 데이터 패칭 추가 | 수정 |
| src/app/(admin)/admin/courts/admin-courts-content.tsx | 탭 UI + SuggestionsTab 추가 | 수정 |

tester 참고:
- 테스트: 코트 상세 페이지 → 하단 "정보 수정 제안" 섹션
- 정상: 로그인 후 필드 선택 → 값 입력 → 사유 작성 → 제안 등록 → 목록 표시
- 중복 방지: 같은 유저의 pending 제안이 있으면 409 에러
- 관리자: /admin/courts → "수정 제안" 탭에서 승인/거절
- 승인 시: court_infos 필드 업데이트 + 제안자 10 XP
- tsc --noEmit 통과 완료

reviewer 참고:
- 승인 트랜잭션: court_infos 업데이트 + 상태변경 + XP 지급 한번에 처리
- changes JSON: { field: { old, new } } 형태로 diff 추적 가능
- DB 마이그레이션은 별도 필요 (prisma generate만 실행)

## 테스트 결과 (tester)

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| tsc --noEmit | 통과 | 에러 0건 |
| Prisma: 필드 타입 (BigInt/Json/String/DateTime) | 통과 | |
| Prisma: FK 관계 3개 (court_infos, User x2) | 통과 | onDelete NoAction |
| Prisma: 인덱스 3개 (복합+단독) | 통과 | |
| POST: 인증 체크 (401) | 통과 | |
| POST: 코트 존재 확인 (404) | 통과 | |
| POST: 중복 pending 차단 (409) | 통과 | |
| POST: 빈 changes 거부 (400) | 통과 | |
| POST: 필드 타입 검증 (boolean/number/string) | 통과 | |
| POST: select 옵션 검증 | 통과 | |
| POST: number min/max 범위 체크 | 통과 | |
| POST: reason 필수 + 길이 (2~200) | 통과 | |
| POST: 허용되지 않은 필드 거부 | 통과 | EDITABLE_FIELD_KEYS |
| POST: old값 자동 추출 | 통과 | DB 현재값 조회 |
| PATCH: super_admin 권한 체크 (403) | 통과 | |
| PATCH: 이미 처리된 제안 재처리 방지 | 통과 | status="pending"만 조회 |
| PATCH: action 값 검증 (approve/reject) | 통과 | |
| PATCH: 승인 트랜잭션 (court_infos+상태+XP) | 통과 | $transaction 사용 |
| PATCH: 승인 시 EDITABLE_FIELD_KEYS 이중 검증 | 통과 | |
| PATCH: 거절 시 XP 없음 + review_note 저장 | 통과 | |
| UI: 로그인 체크 (비로그인 시 버튼 숨김) | 통과 | currentUserId 조건 |
| UI: EDITABLE_FIELDS 기반 동적 폼 14개 필드 | 통과 | |
| UI: 6가지 입력 타입 (select/toggle/number/text/textarea/time) | 통과 | |
| UI: 빈 상태 메시지 | 통과 | |
| UI: apiSuccess snake_case 변환 키 일치 | 통과 | 클라이언트 인터페이스 일치 |
| UI: CSS 변수 사용 (하드코딩 색상 없음) | 통과 | var(--color-*) |
| UI: Material Symbols 아이콘 | 통과 | lucide 미사용 |
| 관리자: pending 필터 + 승인/거절 버튼 | 통과 | |
| 관리자: 거절 사유 입력 | 통과 | |
| 관리자: pending 수 뱃지 표시 | 통과 | |
| 관리자: 빈 상태 UI | 통과 | |
| page.tsx: CourtEditSuggest 삽입 + props 전달 | 통과 | courtId + currentUserId |

종합: 32개 중 32개 통과 / 0개 실패

참고사항 (수정 불필요):
- number 입력에서 `Number(value) || ""` 사용 — 값이 0일 때 빈 칸 표시. fee(min:0)에 해당되나 is_free 토글로 분리되어 실질 영향 없음.

## 전체 프로젝트 진행 현황

### 코트 로드맵
| Phase | 내용 | 상태 |
|-------|------|------|
| 데이터 정리 | 스키마+UI nullable 처리 | 완료 |
| 데이터 정리 | cleanup 스크립트 실행 + 카카오 재검증 | 대기 |
| 데이터 정리 | 유저 위키 시스템 | 구현 완료 → tester 대기 |
| Phase 5 | 픽업게임 모집 | 기획설계 완료 → 구현 대기 |

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 03-29 | developer | 유저 위키 시스템 7단계 구현: DB모델+상수+API2개+컴포넌트+관리자탭 (9파일) | tsc 통과 |
| 03-29 | architect | Phase 5 픽업게임 모집 기획설계: 2테이블+8API+1컴포넌트+pill필터 | 완료 |
| 03-29 | developer+tester+reviewer | 코트 데이터 대청소: nullable 5필드+cleanup+UI 5파일 (14항목 전통과) | 완료 |
| 03-29 | debugger | 코트 체크인 UI 버튼 미표시 버그 수정 | 완료 |
| 03-29 | developer+tester+reviewer | Phase 4 게이미피케이션 (28항목 전통과) | 완료 |
| 03-29 | developer+tester | Phase 3 리뷰+제보 (62항목 전통과) | 완료 |
| 03-29 | developer | 체크인 GPS 100m + 위치기반 5단계 UI + 원격 체크아웃 | 완료 |
| 03-29 | developer | 거리순 정렬 + 20km 반경 + 근접 감지 슬라이드업 | 완료 |
| 03-29 | developer | 카카오맵 SDK + 지도+목록 분할 뷰 | 완료 |
| 03-29 | developer | 코트 체크인/체크아웃 + 혼잡도 (Phase 2) | 완료 |
