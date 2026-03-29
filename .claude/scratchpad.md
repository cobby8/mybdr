# 작업 스크래치패드

## 현재 작업
- **요청**: QR 코드 체크인 시스템 구현
- **상태**: 구현 완료 (tsc 통과)
- **현재 담당**: developer → PM 검토 대기

### 구현 기록

구현한 기능: 코트 QR 코드 체크인 시스템 (QR 생성/다운로드/인쇄 + 자동 체크인 + GPS 스킵)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/courts/[id]/_components/court-qr-code.tsx | QR 모달 (Google Charts API, 다운로드/인쇄) | 신규 |
| src/app/(web)/courts/[id]/checkin/page.tsx | QR 스캔 후 자동 체크인 페이지 | 신규 |
| src/app/api/web/courts/[id]/checkin/route.ts | method:"qr" 시 GPS 검증 스킵 로직 추가 | 수정 |
| src/app/(web)/courts/[id]/page.tsx | CourtQrCode 컴포넌트 import + 버튼 배치 | 수정 |

tester 참고:
- 테스트 방법: /courts/{id} 페이지에서 "QR 체크인" 버튼 클릭 → 모달 확인 → 다운로드/인쇄 동작 확인
- QR 스캔 시뮬레이션: /courts/{id}/checkin 직접 접속 → 로그인 상태면 자동 체크인
- 미로그인 시 /login으로 리다이렉트 확인
- API: POST body에 method:"qr" 보내면 GPS 검증 스킵, method:"manual"은 기존대로 GPS 검증

reviewer 참고:
- Prisma 스키마 변경 없음 (checkin_method 필드 기존 활용)
- 외부 패키지 추가 없음 (Google Charts QR API = img src)

## 기획설계 (planner-architect)

### 1. 코트 앰배서더 시스템 (1주)

목표: 코트별 관리자(앰배서더)를 지정하여 위키 승인 없이 직접 수정 + 제보 처리 권한 부여

**DB 변경:**
| 테이블 | 필드 | 비고 |
|--------|------|------|
| court_ambassadors (신규) | id, user_id, court_info_id, status(pending/active/revoked), appointed_at, revoked_at | User + court_infos FK |
| XP_REWARDS 상수 추가 | ambassador_approve: 5 | 제보/위키 처리 시 XP |

**API (4개):**
| 메서드 | 경로 | 역할 |
|--------|------|------|
| POST | /api/web/courts/[id]/ambassador/apply | 앰배서더 신청 |
| GET | /api/web/courts/[id]/ambassador | 현재 앰배서더 조회 |
| PATCH | /api/web/admin/ambassadors/[id] | 관리자 승인/거절 |
| GET | /api/web/admin/ambassadors | 관리자용 신청 목록 |

**UI (3파일):**
| 파일 | 역할 | 신규/수정 |
|------|------|----------|
| courts/[id]/_components/court-ambassador.tsx | 앰배서더 뱃지 + 신청 버튼 | 신규 |
| courts/[id]/page.tsx | CourtAmbassador 컴포넌트 삽입 | 수정 |
| (admin)/admin/ambassadors/ | 승인/거절 관리 페이지 | 신규 |

**구현 순서:** DB모델 → API 4개 → 앰배서더 UI → 관리자 페이지 → 기존 위키/제보 API에 앰배서더 바이패스 추가
**예상 파일 수:** 8~10개

---

### 2. 주간 운동 리포트 (1주)

목표: 매주 월요일 지난주 운동 요약을 제공 (별도 DB 불필요, court_sessions 집계)

**DB 변경:** 없음 (court_sessions + User.xp + user_badges에서 모두 집계)

**API (2개):**
| 메서드 | 경로 | 역할 |
|--------|------|------|
| GET | /api/web/profile/weekly-report | 지난주 리포트 조회 (인증 필수) |
| POST | /api/web/cron/weekly-report | Vercel Cron → Web Push 발송 (매주 월 09:00 KST) |

집계 쿼리: court_sessions WHERE checked_in_at BETWEEN 지난월~일 GROUP BY court_id
- 총 운동 시간: SUM(duration_minutes)
- 방문 코트 수: COUNT(DISTINCT court_id)
- 연속 출석: User.streak_count
- XP 변화: SUM(xp_earned) from court_sessions
- 레벨 변화: getLevelInfo() 비교

**UI (2파일):**
| 파일 | 역할 | 신규/수정 |
|------|------|----------|
| profile/weekly-report/page.tsx | 주간 리포트 페이지 (카드형 요약) | 신규 |
| profile/page.tsx | "주간 리포트" 링크 추가 | 수정 |

**Push:** 기존 Serwist PWA 기반 → notifications API가 이미 존재하면 활용, 아니면 /api/web/cron/weekly-report에서 notifications 테이블에 INSERT
**구현 순서:** 집계 API → 리포트 페이지 UI → Vercel Cron 설정 → Push 알림 연동
**예상 파일 수:** 5~6개

---

### 3. 코트 3x3 이벤트 (2주)

목표: 야외 코트에서 간소화된 3x3 미니 대회 개최 (기존 tournament과 별도 시스템)

**DB 변경:**
| 테이블 | 필드 | 비고 |
|--------|------|------|
| court_events (신규) | id, court_info_id, host_id, title, description, event_date, start_time, max_teams(4~8), team_size(3~4), format(single_elimination/round_robin), status(recruiting/in_progress/completed/cancelled), entry_fee, created_at, updated_at | 간소화된 대회 |
| court_event_teams (신규) | id, event_id, team_name, captain_id, status(registered/confirmed/eliminated/winner) | 참가팀 |
| court_event_players (신규) | id, team_id, user_id, joined_at | 팀원 |
| court_event_matches (신규) | id, event_id, round, match_order, team1_id, team2_id, score1, score2, status(scheduled/live/completed), winner_id | 대진표 |

**tournament과의 관계:** 완전 분리. 이유: tournament은 UUID PK + 시리즈 + 서브도메인 사이트 + 복잡한 디비전 체계를 갖는 공식 대회 시스템. 3x3 이벤트는 코트에 종속된 가벼운 이벤트로, 대진표도 4~8팀 단순 토너먼트.

**API (6개):**
| 메서드 | 경로 | 역할 |
|--------|------|------|
| GET/POST | /api/web/courts/[id]/events | 코트별 이벤트 목록/생성 |
| GET/PATCH/DELETE | /api/web/events/[id] | 이벤트 상세/수정/취소 |
| POST/DELETE | /api/web/events/[id]/join | 팀 참가/탈퇴 |
| POST | /api/web/events/[id]/generate-bracket | 자동 대진표 생성 |
| PATCH | /api/web/events/[id]/matches/[matchId] | 경기 결과 기록 |
| GET | /api/web/events/[id]/bracket | 대진표 조회 |

**UI (4파일):**
| 파일 | 역할 | 신규/수정 |
|------|------|----------|
| courts/[id]/_components/court-events.tsx | 이벤트 목록 + 참가 UI | 신규 |
| events/[id]/page.tsx | 이벤트 상세 + 미니 대진표 | 신규 |
| events/[id]/_components/mini-bracket.tsx | 4~8팀용 간소 대진표 뷰 | 신규 |
| courts/[id]/page.tsx | CourtEvents 컴포넌트 삽입 | 수정 |

**구현 순서:** DB 4모델 → CRUD API → 이벤트 목록/생성 UI → 대진표 생성 로직 → 미니 대진표 UI → 결과 기록
**예상 파일 수:** 12~15개

---

### 4. GPS 밀집도 히트맵 (2주)

목표: 체크인 데이터 기반 지도 히트맵 (시간대별 밀집도 시각화)

**DB 변경:** 없음 (court_sessions + court_infos 기존 데이터 활용)

**API (1개):**
| 메서드 | 경로 | 역할 |
|--------|------|------|
| GET | /api/web/courts/heatmap?period=morning/afternoon/evening/all | 시간대별 코트 밀집도 데이터 |

쿼리: court_sessions GROUP BY court_id, 시간대 분류 (06~12 오전, 12~18 오후, 18~24 저녁)
→ 각 코트의 { lat, lng, weight(세션수) } 배열 반환
→ ISR 10분 캐시 (실시간까지는 불필요)

**카카오맵 히트맵 방식:** 카카오맵 API에는 공식 히트맵 레이어가 없음 → Canvas 오버레이 방식
- CustomOverlay + canvas 요소를 지도 위에 배치
- simpleheat.js (3KB 경량 라이브러리) 또는 직접 canvas 2D gradient 구현
- 지도 이동/줌 시 canvas 다시 그리기 (moveend/zoom_changed 이벤트)
- 대안: CustomOverlay로 코트 위치에 원형 오버레이 (반투명 원, 크기=세션수)

**UI (3파일):**
| 파일 | 역할 | 신규/수정 |
|------|------|----------|
| courts/_components/heatmap-overlay.tsx | Canvas 히트맵 레이어 컴포넌트 | 신규 |
| courts/_components/courts-content.tsx | 히트맵 토글 버튼 + 시간대 필터 추가 | 수정 |
| components/shared/kakao-map.tsx | CustomOverlay 지원 확장 (있으면 수정만) | 수정 |

**구현 순서:** 집계 API → simpleheat 또는 원형 오버레이 PoC → 카카오맵 연동 → 시간대 필터 UI → 성능 최적화
**예상 파일 수:** 5~7개

---

### 전체 의존 관계 및 추천 순서

```
1. 앰배서더 (1주) ── 독립, 위키 시스템 확장
2. 주간 리포트 (1주) ── 독립, court_sessions 집계만
   ↑ 1,2는 병렬 가능
3. 3x3 이벤트 (2주) ── 독립, 대진표 로직 개발
4. 히트맵 (2주) ── 독립, 카카오맵 확장
   ↑ 3,4는 병렬 가능 (단 3이 우선)
```

추천: 1→2(병렬) → 3→4(병렬). 총 약 4주.

## 전체 프로젝트 진행 현황

### 코트 로드맵
| Phase | 내용 | 상태 |
|-------|------|------|
| 데이터 정리 | 스키마+UI nullable 처리 | 완료 |
| 데이터 정리 | cleanup 스크립트 실행 + 카카오 재검증 | 대기 |
| 데이터 정리 | 유저 위키 시스템 | tester 통과 → 커밋 대기 |
| Phase 5 | 픽업게임 모집 | tester 통과 → 커밋 대기 |
| 장기 | 코트 앰배서더 | 기획설계 완료 |
| 장기 | 주간 운동 리포트 | 기획설계 완료 |
| 장기 | 3x3 이벤트 | 기획설계 완료 |
| 장기 | GPS 히트맵 | 기획설계 완료 |

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 03-29 | planner-architect | 장기 로드맵 4건 일괄 기획설계 (앰배서더/리포트/3x3/히트맵) | 완료 |
| 03-29 | tester | Phase 5 픽업게임 코드 검증: 45항목 전통과 (DB+API4개+UI+필터) | 전통과 |
| 03-29 | developer | Phase 5 픽업게임 6단계: 2모델+4API+1컴포넌트+pill필터 (9파일) | tsc 통과 |
| 03-29 | developer | 유저 위키 시스템 7단계 구현: DB모델+상수+API2개+컴포넌트+관리자탭 (9파일) | tsc 통과 |
| 03-29 | architect | Phase 5 픽업게임 모집 기획설계: 2테이블+8API+1컴포넌트+pill필터 | 완료 |
| 03-29 | developer+tester+reviewer | 코트 데이터 대청소: nullable 5필드+cleanup+UI 5파일 (14항목 전통과) | 완료 |
| 03-29 | debugger | 코트 체크인 UI 버튼 미표시 버그 수정 | 완료 |
| 03-29 | developer+tester+reviewer | Phase 4 게이미피케이션 (28항목 전통과) | 완료 |
| 03-29 | developer+tester | Phase 3 리뷰+제보 (62항목 전통과) | 완료 |
| 03-29 | developer | 체크인 GPS 100m + 위치기반 5단계 UI + 원격 체크아웃 | 완료 |
