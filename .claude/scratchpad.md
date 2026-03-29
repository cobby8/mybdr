# 작업 스크래치패드

## 현재 작업
- **요청**: 3x3 이벤트 시스템 구현
- **상태**: 구현 완료 (tsc 통과, 신규 파일 에러 0건)
- **현재 담당**: developer 완료

### 구현 기록

구현한 기능: 3x3 이벤트 시스템 (Prisma 4모델 + API 4라우트 + UI 컴포넌트 + 페이지 삽입)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| prisma/schema.prisma | court_events, court_event_teams, court_event_players, court_event_matches 4모델 + User/court_infos 관계 추가 | 수정 |
| src/app/api/web/courts/[id]/events/route.ts | GET 이벤트 목록 + POST 이벤트 생성 (인증필수) | 신규 |
| src/app/api/web/courts/[id]/events/[eventId]/route.ts | PATCH 이벤트 수정/상태변경 + DELETE 취소 (주최자만) | 신규 |
| src/app/api/web/courts/[id]/events/[eventId]/teams/route.ts | POST 팀 등록 (등록자=주장 자동배정) | 신규 |
| src/app/api/web/courts/[id]/events/[eventId]/bracket/route.ts | GET 대진표 조회 + POST 자동생성 + PATCH 결과입력 (부전승/다음라운드 자동진출) | 신규 |
| src/app/(web)/courts/[id]/_components/court-events.tsx | 이벤트 목록+생성폼+상세(팀목록/팀등록/대진표시각화/점수입력) 클라이언트 컴포넌트 | 신규 |
| src/app/(web)/courts/[id]/page.tsx | CourtEvents 컴포넌트 import + 삽입 (픽업게임 아래) | 수정 |

tester 참고:
- /courts/[id] → 픽업게임 아래에 "3x3 이벤트" 섹션 표시
- 로그인 후 "이벤트 만들기" → 제목/날짜/팀수(4/8/16)/팀인원(2~5)/형식 입력
- 이벤트 카드 클릭 → 상세 펼침 (팀 목록 + 팀 등록 + 대진표)
- 주최자: "대진표 생성" → 팀 셔플+시드배정+매치 자동생성+부전승 처리
- 주최자: "결과 입력" → 점수 입력 → 승리팀 다음 라운드 자동진출
- 결승 결과 입력 시 우승팀 결정 + 이벤트 자동 완료
- 대진표는 가로 스크롤로 라운드별 표시 (1라운드→4강→준결승→결승)

reviewer 참고:
- Prisma 4모델 관계: court_events→teams→players(Cascade), matches→teams(SetNull)
- 대진표 round 번호 규칙: 큰 숫자=1라운드, 1=결승 (nextPowerOf2로 슬롯 계산)
- KST 기준 날짜 계산 (픽업게임 패턴 재사용)
- DB migration은 아직 미실행 (prisma generate만 완료)

## 전체 프로젝트 진행 현황

### 코트 로드맵
| Phase | 내용 | 상태 |
|-------|------|------|
| 데이터 정리 | 스키마+UI nullable 처리 | 완료 |
| 데이터 정리 | cleanup + 카카오 재검증 | 완료 (1,045개) |
| 데이터 정리 | 유저 위키 시스템 | tester 통과 |
| Phase 5 | 픽업게임 모집 | tester 통과 |
| 장기 | 코트 앰배서더 | 구현 완료 |
| 장기 | 주간 운동 리포트 | 구현 완료 (tsc 통과) |
| 장기 | GPS 히트맵 | 구현 완료 (tsc 통과) |
| 장기 | 3x3 이벤트 | 구현 완료 (tsc 통과) |

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 03-30 | developer | 3x3 이벤트: Prisma 4모델+API 4라우트+UI컴포넌트 (7파일, 신규5+수정2) | tsc 통과 |
| 03-29 | developer | 주간 운동 리포트: API+Cron+UI+진입점 (6파일, 신규3+수정3) | tsc 통과 |
| 03-29 | developer | GPS 히트맵: API+Canvas오버레이+토글UI (4파일) | tsc 통과 |
| 03-29 | developer | 코트 앰배서더: 신청/조회/승인/직접수정 (10파일) | tsc 통과 |
| 03-29 | developer | 카카오 전국 농구장 수집+등록: 1,045개 | 완료 |
| 03-29 | planner-architect | 장기 로드맵 4건 기획설계 | 완료 |
| 03-29 | tester | Phase 5 픽업게임 코드 검증: 45항목 전통과 | 전통과 |
| 03-29 | developer | Phase 5 픽업게임 6단계 (9파일) | tsc 통과 |
| 03-29 | developer | 유저 위키 시스템 7단계 (9파일) | tsc 통과 |
| 03-29 | developer+tester+reviewer | 코트 데이터 대청소 (14항목 전통과) | 완료 |
