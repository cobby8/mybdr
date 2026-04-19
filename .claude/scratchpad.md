# 작업 스크래치패드

## 현재 작업
- **요청**: W3 옵션 C — M6 알림 분류 + 일괄 읽음 (`/notifications`, ~5h)
- **상태**: 🏗️ planner-architect 설계 중
- **현재 담당**: planner-architect
- **순서 결정**: M6 → M3 → M5 (카페 sync DB 쓰기와 알림 시너지 고려)
- **PR**: #46 OPEN에 누적 (옵션 B 합의대로)
- **참고 문서**: `Dev/ux-implementation-plan-2026-04-19.md` L602~629 (Day 14~15)

## 진행 현황표
| 영역 | 상태 |
|------|------|
| 브랜치 | subin (origin/subin = 동기화) |
| 미푸시 커밋 | 0 |
| dev 미반영 | **5건 (PR #46에 포함)** |
| PR #46 | 🟢 OPEN · MERGEABLE · CLEAN · Vercel SUCCESS · 커밋 51개 |
| dev → main | 2건 미반영 (원영) |
| 작업 트리 | M cafe-sync 2건 + ?? extract-fallbacks.ts (다른 터미널 진행 중) |
| .auth/cafe-state.json | 04-19 19:35 생성 (gitignored) |

## 남은 과제 (대기열)
- **다음카페 Phase 2b** — upsert + --execute 활성화 (다른 터미널 진행 중)
- **다음카페 Phase 3** — Vercel Cron + GH Actions(Playwright) + admin UI + 알림
- **운영 DB 동기화** — 백필/병합/endDate/권한/파서 운영 반영 (원영 협의)
- **원영 영역 공식 기록 가드** — public-bracket API, _site/*.tsx
- **저성공 필드 보강** — upsert.ts fallback 정규식 (venue 50% / 나머지 0%)

## 기획설계 (planner-architect)
(아직 없음)

## 구현 기록 (developer)
(아직 없음)

## 테스트 결과 (tester)
(아직 없음)

## 리뷰 결과 (reviewer)
(아직 없음)

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## 운영 팁
- **gh 인증 풀림**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...`
- **gh pr edit 스코프 부족**: `gh api -X PATCH repos/OWNER/REPO/pulls/N -f title=...`
- **tsx 환경변수**: `npx tsx --env-file=.env.local scripts/xxx.ts` (Node 22)
- **카페 쿠키 세션 갱신**: `npx tsx scripts/cafe-login.ts` (브라우저 headed → 로그인 → Enter)
- **포트 죽이기**: `netstat -ano | findstr :<포트>` → `taskkill //f //pid <PID>` (node.exe 통째 금지)
- **공식 기록 쿼리**: `officialMatchWhere()` 유틸 필수
- **신규 API 필드**: 추가 전 curl 1회로 raw 응답 확인 (snake_case 변환 사일런트 버그 5회 재발)

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-19 | dev+review | M2 데스크톱 sticky 신청 카드 도입 (서버 컴포넌트, 6상태 분기, --color-* 100%) | ✅ 3405727 |
| 04-19 | developer | Phase 2b Step 1 — upsert.ts + sync-cafe --execute 통합 (코드 준비, 미실행) | ✅ 6d2617d |
| 04-19 | developer | M1 Day 8 설정/결제 탭 통합 허브 2개 + 기존 4페이지 redirect | ✅ 546a5c3 |
| 04-19 | developer | `/games` 경기 유형 탭 건수 뱃지 (route.ts groupBy 1회) | ✅ 1e7b642 |
| 04-19 | developer | `/games` 경기 유형 탭 추가 (전체/픽업/게스트/연습경기, URL `?type`) | ✅ 1082124 |
| 04-19 | developer | M1 Day 7 /profile 통합 대시보드 (히어로 + 4그룹 카드) + apiSuccess 가드 승격 | ✅ e259d56 |
| 04-19 | pm | UX 세션: 플래닝 3커밋 + W1 12/12 + dev merge-back 7충돌 해결 → PR #45 MERGEABLE | ✅ 610dcf2 |
| 04-19 | pm+developer | Phase 2a 완료: Playwright cafe-login + storageState → 본문 200×2/2 + 마스킹 OK | ✅ 55d78c3 |
| 04-19 | pm | PR #39/#45 dev 머지 완료 (squash) | ✅ |
| 04-19 | pm | 다음카페 Phase 1 POC — 3게시판 30건 실제 수집 | ✅ |
