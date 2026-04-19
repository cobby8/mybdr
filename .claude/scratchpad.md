# 작업 스크래치패드

## 현재 작업
- **요청**: W3 옵션 C — M3(완료, 커밋 대기) + M5(설계완료, PM 결정 1건 대기)
- **상태**: M3 ✅ tester+reviewer 통과 (블록 0) / M5 🟡 phone 가드 결정 대기
- **현재 담당**: pm
- **PR**: #46 OPEN에 누적

## 진행 현황표
| 영역 | 상태 |
|------|------|
| 브랜치 | subin |
| 미푸시 커밋 | M3 1건 예정 |
| origin/subin vs HEAD | fast-forward 가능 |
| PR #46 | 🟢 OPEN · MERGEABLE · CLEAN |
| 작업 트리 (다른 터미널) | M cafe-sync 2건 + ?? _tmp-mptt 2건 (건드리지 않음) |

## 남은 과제
- **M5 온보딩 압축** — PM 결정 1건 후 developer 호출 (~2h)
- **W4 M4/M7/L1** — 5/10~ 분량
- **다음카페 Phase 2b/3** — 다른 터미널 진행 중
- **운영 DB 동기화** — 원영 협의
- **referee 알림 사일런트 버그** — `notification-bell.tsx` L86 (errors.md 6회차)

## 기획설계 (planner-architect) — M5 (보존: 다음 단계 사용)

### M5 핵심 발견
- OAuth 가입자(≈90%)는 이미 verify → 홈 직진 (verify/page.tsx L79)
- 강제 `/profile/complete`는 **이메일 가입자 한정** (actions/auth.ts L175)
- `/preferences` 강제 redirect는 **딱 1줄** (profile/complete/page.tsx L170)

### M5 변경 파일 (3건, 신규 0)
| 파일 | 변경 |
|------|------|
| `src/app/(web)/profile/complete/page.tsx` | 전면 재작성: 7필드 → 3필드(닉네임/포지션/지역) + "지금 채우기"/"나중에" 옵션 카드. 저장 후 router.push("/") |
| `src/app/actions/auth.ts` L175 | `redirect("/profile/complete")` → `redirect("/")` 또는 `redirect("/verify?missing=phone")` (PM 결정 대기) |
| `src/app/(referee-public)/referee/signup/page.tsx` L5 | 주석 1줄 갱신 |

### M5 PM 결정 대기 1건
**이메일 가입 → phone 미인증 상태 처리**
- A. `redirect("/")` — 계획서대로, 게임 신청 시 모달이 잡음
- B. `redirect("/verify?missing=phone")` — phone 강제 인증 (PM 추천: OAuth와 흐름 통일, SMS/픽업 핵심기능 사일런트 실패 방지)

### M5 위험/주의
- DB 변경 0, Flutter API `/api/v1/*` 0 영향
- `/profile/complete` URL 동일 → 북마크 호환 OK
- profile_completed 판정 미변경 → 게임 신청 가드 유지
- 미들웨어 부재 → 무한 redirect 걱정 없음
- 카페 sync / M3 영역 충돌 0

### M5 추정 공수: ~2h (계획서 5h 대비 절감)

## 구현 기록 (developer)
(직전 작업: M3 — 작업 로그 압축됨)

## 테스트 결과 (tester)
(직전 작업: M3 — 블록 0/권장 2, 작업 로그 압축됨)

## 리뷰 결과 (reviewer)
(직전 작업: M3 — 블록 0/권장 2, 작업 로그 압축됨)

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## 운영 팁
- **gh 인증 풀림**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...`
- **tsx 환경변수**: `npx tsx --env-file=.env.local scripts/xxx.ts` (Node 22)
- **포트 죽이기**: `netstat -ano | findstr :<포트>` → `taskkill //f //pid <PID>` (node.exe 통째 금지)
- **신규 API 필드**: 추가 전 curl 1회로 raw 응답 확인 (snake_case 6회 재발)
- **공식 기록 쿼리**: `officialMatchWhere()` 유틸 필수

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-20 | pm+team | **M3 코트 지도 폴리시** — localStorage viewMode + 인포 ★평점/상세보기 + appkey env 외부화 + 빈 상태 필터초기화 (5파일, DB 0변경, 80% 기구현 발견 → ~2h) | ✅ 커밋 대기 |
| 04-20 | pm+team | **M6 알림 분류** 6카테고리 + 카테고리별 mark-all-read + 더 보기 + layout 헤더 뱃지 사일런트 버그 동시 정정 | ✅ 5e56d0f push |
| 04-19 | dev+review | M2 데스크톱 sticky 신청 카드 도입 | ✅ 3405727 |
| 04-19 | developer | Phase 2b Step 1 — upsert.ts + sync-cafe --execute 통합 | ✅ 6d2617d |
| 04-19 | developer | M1 Day 8 설정/결제 탭 통합 허브 2개 + 기존 4페이지 redirect | ✅ 546a5c3 |
| 04-19 | developer | `/games` 경기 유형 탭 건수 뱃지 (route.ts groupBy 1회) | ✅ 1e7b642 |
| 04-19 | developer | `/games` 경기 유형 탭 추가 (전체/픽업/게스트/연습경기) | ✅ 1082124 |
| 04-19 | developer | M1 Day 7 /profile 통합 대시보드 + apiSuccess 가드 승격 | ✅ e259d56 |
| 04-19 | pm | UX 세션: W1 12/12 + dev merge-back 7충돌 해결 → PR #45 MERGEABLE | ✅ 610dcf2 |
| 04-19 | pm+developer | Phase 2a 완료: Playwright cafe-login + storageState | ✅ 55d78c3 |
