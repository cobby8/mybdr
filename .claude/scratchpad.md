# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[5/10 사전 라인업 PR3 reviewer ✅ + tester ✅]** 팀장 UI `/lineup-confirm/[matchId]` 신규 페이지 구현 완료. PR1+PR2 commit `6ebeb94` 위 UI 레이어. 사용자 결정 2건 반영: (1) 전체 출전 단일 토글 버튼 (라벨 자동 변경) (2) 상대팀 영역 제거. 신규 3 파일 +954L (page 328 / form 472 / row 154) / tsc 0 / API/DB/Flutter v1 영향 0.

📋 검증대기 미푸시 commit 4건 (6ebeb94 lineup PR1+2 / 02f7d0e live PR4+5 / ad88292 displayname / 0633e44 live PR1~3) + PR3 미커밋 — push 보류.

### 리뷰 결과 (reviewer / 5/10 PR3)

📊 종합 평가: ⭐⭐⭐⭐ (사소한 개선 후 머지 — 즉시 머지 직전 1건 권고)

✅ 잘된 점:
1. **권한 가드 흐름이 PR2 헬퍼와 정확히 정합** — `getMatchWithTeams` (IDOR: tournamentId 일치) → `getLineupCanEdit` (admin/captain/manager 3종) 호출 순서가 PR2 GET 라우트와 동일. server component 에서 `redirect("/")` 로 권한 0 차단 + UI 노출 0 — 매우 안전.
2. **snake_case 응답 키 정확** — `apiSuccess()` 자동 변환 룰 준수 (errors.md 5회 재발 함정 회피). `tournament_team_id / team_id / match_id / team_side / starters / substitutes / confirmed_by_id` 등 PR2 GET 응답 키 그대로 재사용. camelCase 잔재 0건.
3. **단일 토글 라벨/동작 자동 (사용자 결정 1번)** — `allEligibleActive` 파생 state 가 깔끔 (eligible 0건 false 반환 → 빈 팀 edge case 방어). 전원 active 시 "해제" / 일부 또는 전원 비active 시 "선택" 라벨 자동.
4. **도메인 룰 일관 — 주전 ⊆ 출전 자동 보존** — 출전 해제 시 주전 자동 해제 (`toggleActive` 내 setStarterIds), 토글 버튼 해제 시 starters 도 비우고, 토글 선택 시 eligible 외 starter 만 제거 (도메인 정합).
5. **디자인 13 룰 100% 준수** — `var(--color-*)` 토큰만 / lucide-react 0 (Material Symbols star/info/schedule/arrow_back) / 44px `minHeight: 44` + `min-h-11 min-w-11` 명시 / pill 9999px 0 / Tailwind arbitrary 값 0.
6. **컴포넌트 분리 합리적** — page (server, 권한+prefetch) / form (client, state+POST) / ttp-row (presentational, prop drill) 3 단계가 명확. ttp-row 154L 는 정확한 책임 단위.

🟡 권장 수정 (필수 X — 다음 PR 또는 후속 큐):
1. **page.tsx 167~190L `select` 절 PR2 GET 라우트와 박제 위험** — `serializeTtp` 가 PR2 GET 라우트 (`/api/web/tournaments/[id]/matches/[matchId]/lineup/route.ts` line 188~205) 와 거의 동일 + page.tsx 가 직접 prisma 호출. 향후 PR2 라우트 select 변경 시 페이지가 silent 갭 발생 위험 (예: `profile_image_url` 필드 추가 케이스). 후속 권장: `getLineupBundle(matchId, tournamentId, mySide)` 헬퍼 (`src/lib/lineup/bundle.ts`) 추출 → PR2 GET + page.tsx 동시 사용. 본 PR 에서는 무방하지만 PR4 (Cron 푸시) / PR5 (roster API 확장) 진입 전 정리 권장.
   - **후속 큐 등록**: scratchpad 5순위 또는 conventions.md `[2026-05-10] 라인업 prefetch 헬퍼 통합 룰` 박제.

2. **page.tsx 254L `match.status ?? "scheduled"` fallback — PR2 라우트와 일관성 ✅이지만 명시 주석 굿** — null status 를 scheduled 취급. PR2 가드와 동일. 코드 주석에 룰 명시되어 있어 OK.

3. **form.tsx 254L `confirm()` 브라우저 다이얼로그 사용** — DELETE (라인업 해제) 시 `confirm("라인업을 해제하시겠습니까?")` — 브라우저 native dialog. 디자인 시스템 외. 후속 PR 에서 ForceActionModal 패턴 (5/8 mock 모달과 동일) 으로 마이그 권장. 본 PR 머지에는 영향 0 (P2 큐).

4. **form.tsx 287~290L `await res.json()` — DELETE 응답 파싱 시 200/204 분기 0** — 현재 PR2 DELETE 가 `apiSuccess({ released: true })` 200 반환이라 정상 동작. 미래 204 No Content 변경 시 res.json() throw — 방어적으로 `try { json = await res.json() } catch {}` 보강 가능 (선택).

5. **form.tsx 197~256L `handleConfirm` API 응답 status 별 사용자 안내 단순화** — 현재 `json?.error ?? "라인업 저장에 실패했습니다."` 만. PR2 라우트 응답 코드 (401/403/404/409/422) 별 한국어 메시지 차별 0 (서버 메시지 그대로 표시). PR2 메시지가 충분히 한국어 친화 → OK 판정. 다만 422 VALIDATION_ERROR + 409 IMPLICIT 분기 시 "재시도 차단" 등 UX 하이라이트 추후 가능.

🔵 admin away 측 입력 후속 (사용자 결정 2번 = 상대팀 미노출 / mySide=home 통일):
- **사용자 결정과 일치 ✅** — admin 이 away 입력 필요 시 → 별도 페이지 또는 admin/tournaments/[id]/matches 운영자 화면에서 처리. 본 페이지는 "팀장 UI" 단일 책임 / admin 도 home 통일 = 단순화 합리.
- **확장 여지**: 후속 PR 에서 `?side=away` query 또는 admin 전용 토글 배치 가능 — 본 PR 영향 0.

🔵 후속 PR 영향 0 확인:
- **PR4 (Cron 푸시)** — 페이지 URL `/lineup-confirm/[matchId]` 변경 X / API 키 변경 X. 본 페이지 영향 0.
- **PR5 (roster API `/api/v1/...` 확장)** — Flutter only / 본 페이지 import 0. 영향 0.
- **매치 페이지 진입 링크 추가 PR** — 본 페이지 props 단순 (`{ matchId: string }`) → 어디서든 `<Link href={'/lineup-confirm/' + matchId}>` 호환.

🔵 Edge case 검증 (사용자 결정 1번 강건성):
1. **eligible 0명** (전원 role=staff/coach/manager) → `allEligibleActive=false` + 토글 버튼 `disabled` (form.tsx 334L `disabled={... || eligibleIds.length === 0}`) → 안전.
2. **일부 active + 일부 비active** → `allEligibleActive=false` → 라벨 "전체 출전 선택" → 클릭 시 eligible 모두 active 재설정 (이미 active 인 것은 set 동작상 변동 0) + starters 는 eligible 안 든 건만 제거. 직관적.
3. **starters 5명 + 일부 active 해제** → `toggleActive` 가 자동 starter 해제 (form.tsx 138~144L) → confirm 버튼 자동 disabled (starterCount !== 5) → 사용자 다시 채우도록 유도. 안전.

🔵 보안 / IDOR:
- page.tsx 권한 가드 — PR2 헬퍼 `getMatchWithTeams(matchBigInt, tournamentId)` 호출 시 IDOR 방어 (helper line 198~199 `match.tournamentId !== tournamentId → null`). PR2 라우트 가드와 동일 패턴.
- form.tsx fetch URL — `/api/web/tournaments/${tournamentId}/matches/${matchId}/lineup` 정확. tournamentId 는 server prefetch (matchBasic.tournamentId) 로 도출되어 클라 위조 불가 (page.tsx prop 으로만 전달).
- 클라이언트 상태 권한 노출 — `canEdit` 객체 자체는 form 에 미전달 / `mySide` 만 prop. 운영자 권한 노출 표시도 page.tsx 헤더에 (canEdit.isAdmin 시 "운영자 권한" 라벨) 만. 안전.

🔵 접근성:
- 체크박스 키보드 토글 가능 (native `<input type="checkbox">`) ✅
- 주전 버튼 `aria-label` + `aria-pressed` 정확 (ttp-row 109L)
- 출전 체크박스 `aria-label` 동적 (`${displayName} 출전`) ✅
- 버튼 disabled 상태 색상 대비 — `var(--color-text-muted)` 사용 + `cursor: not-allowed` ✅

🔵 새로 발견된 conventions.md / lessons.md 박제 추천:
1. **conventions.md 후속 박제 후보** — `[2026-05-10] server prefetch + API 라우트 select 절 박제 위험 — 헬퍼 추출 룰` (page 직접 prisma + 같은 도메인 API 라우트 동시 존재 시 select 헬퍼 단일화). errors.md 2026-04-17 (snake_case 응답 키) 와 같은 결합도 함정의 다른 표현. 다음 같은 케이스 1회 더 발견 시 박제 권장 (현재 1회 — 임계값 미도달).
2. **lessons.md 후속 박제 후보** — 본 PR 에서 발견된 패턴 0건 (이미 conventions.md 다수 룰 준수).

🔴 필수 수정: **0건** (즉시 머지 가능).

📌 머지 의견: PR2 권한/응답 키 정합 100% / 디자인 13 룰 100% / 사용자 결정 2건 정확 반영 / Flutter v1 영향 0. 권장 수정 5건 모두 후속 PR 또는 P2 큐 안건. 본 PR 단독 머지에 영향 0.

### 테스트 결과 (tester / 5/10 PR3)

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| `npx tsc --noEmit` | ✅ 통과 | exit=0, 미사용 import 0 |
| 권한 — 미로그인 → `/login?next=/lineup-confirm/{id}` redirect | ✅ 통과 | page L56-58 |
| 권한 — matchId 파싱 실패 → notFound | ✅ 통과 | parseBigIntParam null 분기 |
| 권한 — 매치 0건 (matchBasic + getMatchWithTeams) → notFound | ✅ 통과 | L73-82 이중 가드 |
| 권한 — 권한 0 user → `/` redirect (UI 노출 0) | ✅ 통과 | canEdit 3종 모두 false 분기 |
| mySide — captain home/away 본인 측 정확 | ✅ 통과 | canEdit.home/away 단일 true |
| mySide — admin 3종 (super_admin/organizer/adminMember) → home 통일 | ✅ 통과 | isAdmin true → "home" |
| 매칭 미정 (homeTeamId NULL + admin) → 안내 화면 (redirect 대신) | ✅ 통과 | targetTtpId null 분기 L100-122 |
| 사용자 결정 1번 — 단일 토글 라벨 자동 변경 | ✅ 통과 | allEligibleActive useMemo + 라벨 분기 L344 |
| 사용자 결정 1번 — 해제 시 starters 동시 비움 | ✅ 통과 | handleAllToggle L179-180 |
| 사용자 결정 1번 — 선택 시 eligible 만 active (코치/매니저 제외) | ✅ 통과 | eligibleIds = role player|captain L111-114 |
| 사용자 결정 2번 — 상대팀 영역 미노출 (away 컴포넌트 0) | ✅ 통과 | opposite-team-status* / away* 파일 0 / form 에 awayTeam prop 없음 |
| 출전 ☑ 토글 — 해제 시 starters 동시 제거 (도메인 룰) | ✅ 통과 | toggleActive L138-144 |
| 주전 ★ 토글 — 출전 미체크 거부 (방어 + TtpRow disabled 이중) | ✅ 통과 | toggleStarter L164 + canToggleStarter |
| 주전 ★ 토글 — 5명 도달 + 본인 미주전 = 차단 | ✅ 통과 | starterFull + starterDisabled prop |
| 라인업 확정 POST → router.refresh | ✅ 통과 | route.ts zod 스키마 정합 (teamSide/starters/substitutes) |
| 주전 5명 미달 → 확정 버튼 disabled + 안내 문구 | ✅ 통과 | `starterCount !== 5` 분기 + 가이드 텍스트 |
| 라인업 해제 DELETE — 기존 lineup 있을 때만 노출 | ✅ 통과 | `homeTeam.lineup && !isLocked` 조건 L442 |
| 매치 status ∉ [scheduled,ready] → isLocked 모든 입력 잠금 | ✅ 통과 | 배너 + 모든 버튼 disabled |
| 응답 키 sanity — apiSuccess 자동 snake_case 와 PR3 직렬화 정합 | ✅ 통과 | tournament_team_id/team_id/players/lineup/team_side/starters/substitutes/confirmed_by_id/jersey_number/match_id 일치 (errors.md 2026-04-17 룰 준수) |
| BigInt → string 변환 (route.ts serializeTtp + page.tsx serialize) | ✅ 통과 | id/matchId/confirmedById/team.id 모두 .toString() |
| 디자인 — `var(--color-*)` 토큰만 / 하드코딩 색상 0 | ✅ 통과 | grep #hex/pink/salmon/coral 0건 |
| 디자인 — Material Symbols Outlined 4회 / lucide-react 0 | ✅ 통과 | schedule/info/arrow_back/star |
| 디자인 — 44px 터치 영역 (체크박스 / 버튼) | ✅ 통과 | min-h-11 min-w-11 + minHeight:44 |
| 디자인 — pill 9999px / rounded-full 0 | ✅ 통과 | rounded-md 통일 |
| 디자인 — Tailwind arbitrary `[..]` 0 | ✅ 통과 | regex 0 hit |
| 토큰 존재 검증 — globals.css 정의 7종 | ✅ 통과 | accent/accent-light/on-accent/error/success/warning/info L2675-2680 |
| 회귀 — API/DB schema/Flutter v1 영향 0 | ✅ 통과 | PR1+PR2 그대로 사용 |
| 회귀 — 외부 import 영향 0 | ✅ 통과 | grep 자기 디렉토리 + PR2 라우트/헬퍼 주석만 |

📊 종합: 29개 중 29개 통과 / 0개 실패

🟢 추가 발견 (errors.md 박제 가치): **0건** — 기존 2026-04-17 snake_case 룰 그대로 적용. 신규 함정 발견 X.

🟢 회귀 영향 확인: **0건** — API 응답 / DB schema / Flutter v1 / 외부 import 모두 변경 0.

📌 머지 가능 (필수 수정 0).

---

## 🎯 다음 세션 진입점

### 🚨 0순위 — PortOne 본인인증 운영 활성화 (사용자 외부 작업)
- **PortOne 콘솔**: 본인인증 채널 발급 (PASS / SMS / KCP)
- **Vercel 환경변수**: `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY=channel-key-xxx` 추가 → 재배포
- **활성화 직후 자동 전환**: PR3 가드 활성 / mock 폴백 503 자동 / SDK 모드 전환 (코드 변경 0)
- **롤백 1초**: 환경변수 제거

### 🚀 1순위 — PortOne 활성화 후 검증
- 미인증 계정 → /games/[id] /teams/[id] /tournaments/[id]/join 진입 → /onboarding/identity?returnTo redirect
- mock 통과자 (identity_method='mock' 1건 — id=2999) 권유 안내 (강제 invalidate X)

### 🚀 2순위 — PlayerMatchCard 글로벌 재사용 확장
- /teams/[id] "최근 경기" 탭에 PlayerMatchCard 적용 (E-1 효과 확장)
- 다른 사용처 inventory 후 점진 적용

### 🚀 3순위 — Phase 3 (cron 활성화 시)
- Stats Per Season (UserSeasonStat cron) — 시즌별 평균 자동 집계
- Splits (홈/원정/승/패/월별)
- Shot Chart (ShotZoneStat cron)

### 🚀 4순위 — manage 탭 그룹화 (P2-6 보류) / game.game_type / 매치 코드 v4 Phase 6 (보류)

---

## 기획설계 (planner-architect / 5/9 라이브 YouTube)

🎯 목표: `/live/[id]` 라이브 페이지에 YouTube 영상 임베딩 (수동 URL + 자동 검색)

📍 만들 위치와 구조:
| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| `prisma/schema.prisma` `TournamentMatch` | ADD COLUMN `youtube_video_id` + `youtube_status` + `youtube_verified_at` (NULL 허용 무중단) | 수정 |
| `src/lib/auth/match-stream.ts` | `canManageMatchStream(userId, matchId)` 권한 헬퍼 | 신규 |
| `src/app/api/web/tournaments/[id]/matches/[matchId]/youtube-stream/route.ts` | POST 등록/PATCH 갱신/DELETE 제거 (zod + IDOR 가드) | 신규 |
| `src/app/api/web/tournaments/[id]/matches/[matchId]/youtube-stream/search/route.ts` | GET BDR 채널 자동 검색 (Redis cache + 신뢰도 점수) | 신규 |
| `src/app/live/[id]/_v2/youtube-embed.tsx` | iframe 컴포넌트 (16:9 + 라이브/VOD 분기 + 모바일 4 분기점) | 신규 |
| `src/app/live/[id]/_v2/match-youtube-modal.tsx` | 운영자 모달 (수동 URL + 자동 검색 결과 N건) — `MatchJerseyOverrideModal` 패턴 재사용 | 신규 |
| `src/app/live/[id]/page.tsx` | hero 아래 임베드 영역 + 운영자 버튼 분기 | 수정 |

🔗 기존 코드 연결:
- `/api/web/youtube/recommend/route.ts` — `fetchEnrichedVideos()` / `fetchVideoDetails()` 재사용 (uploads playlist 150건 / Redis cache)
- `next.config.ts` CSP — 이미 `frame-src https://www.youtube.com https://www.youtube-nocookie.com` 등록 → 변경 0
- `tournament-auth.ts` — 권한 검증 (organizer / tournamentAdminMember / super_admin)
- `MatchJerseyOverrideModal` (5/5 PR4) — 운영자 모달 패턴 재사용

📋 실행 계획 (5 PR):
| 순서 | 작업 | 담당 | 선행 | 추정 |
|------|------|------|------|------|
| PR1 | DB schema ADD COLUMN + 권한 헬퍼 + Prisma generate | developer | 결재 (Q1~Q9) | 30분 |
| PR2 | 등록/제거 API + zod + IDOR 가드 | developer | PR1 | 1.5h |
| PR3 | 라이브 페이지 임베딩 (iframe + 모바일 가드) | developer | PR1 | 2h |
| PR4 | 운영자 모달 (수동 URL 입력) | developer | PR2+PR3 | 2h |
| PR5 | 자동 검색 API + 신뢰도 점수 + 모달 통합 | developer | PR4 | 3h |
| 검증 | tester (Flutter v1 회귀 + quota + iframe) + reviewer 병렬 | tester+reviewer | PR 별 | 30분 |

⚠️ developer 주의사항:
- **DB 단일 정책**: ADD COLUMN NULL 허용 → `prisma db push` 무중단. destructive 작업 0
- **Flutter v1 영향 0**: `/api/v1/...` schema query 비포함 컬럼만 추가
- **YouTube quota**: search API 미사용 (uploads playlist 재사용 + cache hit 99%)
- **video_id 검증**: 정규식 11자 + `/videos` API 실존 검증 (악의적 입력 차단)
- **iframe**: `youtube-nocookie.com` 우선 / `referrerPolicy="strict-origin-when-cross-origin"` / `autoplay=1&mute=1` (Chrome 정책)
- **시안 동기화**: PR3 후 BDR-current/screens/Live.jsx 영상 영역 후속 큐 등록 (운영 → 시안 역박제 룰)
- **권한**: super_admin / organizer / tournamentAdminMember.is_active=true 3종 (recorder 제외 — Q7 결재 따름)
- **5/10 D-day 후 진입** (Q9 권장): 본 D-day 기간 운영 영향 0

📄 보고서: `Dev/live-youtube-embed-2026-05-09.md` (15 섹션 / Q1~Q11 결재)

---

## 기획설계 (5/8~5/9 main 배포 완료 작업)

- **PR3 layout 가드 + mock 모드** ✅ main `f39afae` (5/8)
- **본인인증 mock 자체 입력 폴백** ✅ main `93670c5` (5/8)
- **사이트 전역 PhoneInput / BirthDateInput** ✅ main `118c9f1` 박제 + 5/9 마이그 100% (13 input)
- **운영 → 시안 역박제 갭 fix** ✅ main `71d4087` `afcbd65` (10 페이지)
- **공개프로필 NBA 스타일 Phase 1** ✅ main `7d68cce` (Dev/public-profile-nba-style-2026-05-09.md)
- **공개프로필 Phase 2** ✅ main `fff4c54` (Dev/public-profile-activity-stats-2026-05-09.md)
- **내농구 강화 super-set** ✅ main `76bf5f3` (Dev/profile-basketball-private-2026-05-09.md)

---

## 🟡 HOLD / 우선순위 2~3 (압축)
- **HOLD**: 자율 QA 봇 (1~5 / 9d) / BDR 기자봇 v2 (Phase 2~7)
- **5/2 잔여**: placeholder User 86건 LOW (auto merge) / ttp 부족팀 5팀 사용자 액션
- **결정 대기**: 관리자 UI 6건 / Games·Teams Phase A dead code / Phase F2 mount
- **인프라 영구**: 카카오맵 / 대회 로컬룰 / 슛존 / 스카우팅 / 시즌통계 / VS비교 / 답글 / waitlist / QR 티켓 / AppNav 쪽지 / D-6·D-3 후속 / Q1 토큰 마이그

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| 5/2 동호회최강전 D-day | ✅ DB 16팀 + 27경기 + 회귀 5종 |
| dual_tournament 회귀 방지 | ✅ A~E 5종 |
| Live `/live/[id]` v2 | ✅ STL + minutes-engine v3 + 5/4 sticky+팀비교 |
| 마이페이지 D-1~D-8 | ✅ 8/8 |
| Reviews 통합 (Q1) / 듀얼토너먼트 풀 시스템 | ✅ |
| 디자인 시안 박제 | ✅ ~95% (시안 갭 0건) |
| 도메인 sub-agent (옵션 A) | ✅ P1+P2+P3 (C 채택) |
| 매치 코드 v4 | ✅ Phase 1+2+3+4+5+7 |
| **PR3 layout 가드 mock 모드** | ✅ main 배포 (PortOne env 추가 시 자동 활성) |
| **mock 자체 입력 폴백** | ✅ main 배포 (PortOne 활성화 시 자동 SDK 전환) |
| **사이트 전역 input 룰** | ✅ 13 input 100% 마이그 |
| **운영 → 시안 역박제 갭 fix** | ✅ 10 페이지 (시안 갭 0) |
| **공개프로필 NBA 스타일 Phase 1+2** | ✅ main 배포 (8열 + PlayerMatchCard + 활동 로그 + 더보기 모달) |
| **내농구 강화 super-set** | ✅ main 배포 (10 영역 / CareerStatsGrid 글로벌 / 14 쿼리 server) |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-09 | (developer) 라이브 YouTube 영상 sticky / 미커밋 | **라이브 YouTube 영상 sticky (≥721px) + 모바일 분기 (≤720px) + hero 위 이동** — youtube-embed.tsx 인라인 style sticky CSS (top: var(--app-nav-h, 92px) / z-30 / 모바일 720px 미만 relative 해제) + page.tsx 영상 위치 hero(스코어카드) 위 + 페이지 헤더 sticky 아래로 이동 (방안 A: 영상 z-30 / 페이지 헤더 z-20 / AppNav z-50 stack) / 영상 등록 매치만 sticky / CTA(미등록+운영자) 일반 위치 / FINAL 다시보기 game-result 영향 0 / Tailwind arbitrary 0 (errors.md 5/9 룰 — `[var(--TOKEN)]` 표기 placeholder) / tsc 0 / Flutter v1 영향 0 / 시안 박제 후속 큐 (BDR-current/screens/Live.jsx 운영→시안 역박제) | 검증대기 |
| 2026-05-09 | (developer) YouTube batch v2 5요소 + 정확도 측정 / 미커밋 | **YouTube batch v2 5요소 알고리즘 + 정확도 100%** — scripts/_temp/youtube-batch-match.ts: (1) **점수 배분 100점**: home(25) + away(25) + tour(20) + date(20) + time(10). 임계값 60→**80점**. (2) **5요소 검증** — 대회명: 풀네임 substring=20 / 토큰 2개=20 / 1개=10. 날짜: 같은날=20 / 1~7일=15 / 8~30일=10. 시간: ±6h=10 / ±24h=5. (3) **`--include-existing`** 옵션 — 이전 채택 매치도 재채점 (UPDATE 자동 제외 가드). (4) breakdown 키 5요소로 변경. **dry-run (신규)**: 자동 채택 0건 / 후보 4건 (50점 양 팀만 매칭 — 다른 영상에 도용된 video_id 가 best 후보로 선택돼 강등됨, 정상 동작) / 실패 29건. **정확도 100% (12/12)** — 이전 12 매치 모두 동일 영상으로 95~100점 자동 채택 ✅ (146/143/142/141/140/139/138/137/134/132 = 95점, 145/136 = 100점). tsc 0 / DB 변경 0 / Flutter v1 영향 0 | 검증대기 |
| 2026-05-10 | (developer) 사전 라인업 PR3 / 미커밋 | **사전 라인업 PR3 — 팀장 UI `/lineup-confirm/[matchId]` 신규 페이지** — page.tsx 328L (server / 권한 가드 getMatchWithTeams+getLineupCanEdit / matchId 단일 라우트로 tournamentId DB 1회 / 매칭미정 안내 / admin=home 통일) + lineup-confirm-form.tsx 472L (client / Set state / 단일 토글 라벨 자동 / 출전→주전 5명 룰 / POST+DELETE+router.refresh) + ttp-row.tsx 154L (presentational / 출전 ☑ + 주전 ★ + #등번호 + 이름) / 사용자 결정 2건 반영 (단일 토글 + 상대팀 미노출) / snake_case 응답 키 직접 사용 / 13 디자인 룰 준수 (color-* 토큰 / Material Symbols / 44px 터치) / tsc 0 / Flutter v1 영향 0 / API/DB 변경 0 (PR2 그대로 사용) | 검증대기 |
| 2026-05-09 | (developer) YouTube batch 알고리즘 fix + 재 dry-run / 미커밋 | **YouTube batch 매칭 알고리즘 fix** — scripts/_temp/youtube-batch-match.ts: (1) **양 팀 정확 매칭** — extractTeamsFromTitle ("vs"/"VS"/"대" 분리) + normalizeTeamName (특수문자/공백 제거) → 매치 양 팀 정확 일치 (swap 검증 포함) 시만 home=30+away=30. 한 팀만 일치 = 0점 (오매칭 차단). (2) **영상-매치 1:1 매핑** — claimsByVideo Map / 점수 동률 시 시간차 작은 매치 우선. 박탈 매치 → 후보 검토 강등 + [1:1 충돌 박탈] 태그. (3) **임계값 60점 조정** (VOD 업로드 time 0~10 정상 / 양 팀 정확 매칭 60점 = 자동 채택 시그널). 재 dry-run: 자동 채택 12건 (전부 양 팀 정확 일치 / 이전 오매칭 #146 #137 본인 영상에 정확 매핑) / 후보 검토 1건 (#121 1:1 충돌 박탈 정상) / 실패 32건. tsc 0 / DB 변경 0 / Flutter v1 영향 0 | 검증대기 |
| 2026-05-09 | (developer) YouTube 일괄 자동 매칭 batch / 미커밋 | **YouTube 일괄 자동 매칭 batch 스크립트** — scripts/_temp/youtube-batch-match.ts (~370L) / dry-run 기본 / 80점 임계값 / Redis cache 재사용 quota 1~2 / fetchEnrichedVideos dynamic import (--playlist-id 오버라이드 hook) / scoreMatch search/route.ts 동일 알고리즘 inline / --apply 시 80점+ UPDATE + admin_logs INSERT (super_admin admin_id 자동 결정 / --admin-id=N 오버라이드) / dry-run 결과: 종료 매치 45건 확보 (BDR_YOUTUBE_UPLOADS_PLAYLIST_ID 로컬 미설정 → 영상 0건 → 운영 배포 또는 환경변수 추가 후 재실행 필요) / tsc 0 / Flutter v1 영향 0 | 검증대기 |
| 2026-05-09 | (developer) 사전 라인업 PR1+PR2 / 미커밋 | **사전 라인업 PR1+PR2 — DB CREATE TABLE match_lineup_confirmed + API 3 + 권한 헬퍼** — schema.prisma 신규 모델 1 (UNIQUE(matchId,teamSide) + index 2) + User/TournamentMatch 역참조 / prisma db push 무중단 (CREATE TABLE 1 / 운영 영향 0) / match-lineup.ts 권한 헬퍼 200L (resolveLineupAuth + getLineupCanEdit / admin 양쪽 / captain·manager 본인측만) / lineup/route.ts 462L (GET 매치+양팀ttp+lineup+canEdit / POST upsert + Q6=A 5명강제 + 중복0 + ttp 무결성 / DELETE 해제) / tsc 0 / Flutter v1 영향 0 / PR3~PR8 후속 큐 | 검증대기 |
| 2026-05-09 | (developer) PR4+PR5 통합 / 미커밋 | **라이브 YouTube PR4+PR5 통합** — match-youtube-modal.tsx 신규 (727L, 탭 2개: 수동 URL 입력 + BDR 자동 검색 / 백드롭+ESC+iOS 16px input / 80점 임계 강조 + dim / 후보 0건 fallback / 삭제 confirm) + page.tsx 통합 (import + streamModalOpen state + 영상 미등록 운영자 등록 CTA + onManageClick 연결 + 모달 마운트 onSave→fetchMatch refetch) / tsc 0 / Tailwind arbitrary 0 (errors.md 룰 통과) / 시안 박제 후속 큐 / Flutter v1 영향 0 | 검증대기 |
| 2026-05-09 | (developer) PR1+PR2+PR3 통합 / 미커밋 | **라이브 YouTube PR1~3 통합** — DB ADD COLUMN 3 + match-stream.ts (164L) + enriched-videos.ts (355L) + POST/PATCH/DELETE 라우트 (288L) + GET search 신뢰도 80 (270L) + YouTubeEmbed (189L) + page.tsx 마운트 + game-result.tsx + /api/live/[id] 3 필드 / tsc 0 / quota 0~2 / Flutter v1 영향 0 | 검증대기 |
| 2026-05-09 | (구현) P0 6 파일 헬퍼 마이그 | **displayName P0 6 파일 헬퍼 마이그** — getDisplayName 통일 (games/[id] MVP / public-bracket recentMvp / jersey-override admin_log POST+DELETE / officer-permissions 응답 displayName 추가 / home.ts prefetchRecentMvp / build-linkify-entries) / 응답 키 변경 0 (officer-permissions 만 displayName 추가, 나머지 표시 문자열만 변경) / tsc 0 / Flutter v1 영향 0 / 라이브 YouTube PR2 youtube-stream API 계열은 현재 미존재 (PR1 결재 대기 중) — 충돌 0 | 검증대기 |
| 2026-05-09 | (기획) `Dev/live-youtube-embed-2026-05-09.md` | **라이브 페이지 YouTube 임베딩 기획** — 옵션 A 단일컬럼 (ADD COLUMN 3건 무중단) / 5 PR 분할 (~9h) / 신규 컴포넌트 2 + API 3 / 자동 검색 신뢰도 80 임계값 / search API 미사용 (uploads 재사용 quota 0~2) / CSP 변경 0 (이미 등록) / Flutter v1 영향 0 / Q1~Q11 결재 대기 / 5/10 D-day 후 진입 권장 | ✅ 결재 |
| 2026-05-09 | PR #228~#243 16건 → main 8회 (`702d00e` → `b96f58c` → `71d4087` → `afcbd65` → `d833569` → `7d68cce` → `fff4c54` → `76bf5f3`) | **5/9 단일 일 main 8회 신기록** — (1) PhoneInput 1순위 4 input. (2) 잔여 6 input + verify 하이픈 정규화. (3) 시안 역박제 1순위 News+MatchNews+Scoreboard. (4) 시안 역박제 2~3순위 7건 → 시안 갭 0 달성. (5) PhoneInput 4순위 admin+referee 3 input → 마이그 100% + onboarding 검증 tester 5/5 통과. (6) 공개프로필 NBA Phase 1 (PlayerMatchCard 380L + 8열 + Hero jersey + officialMatchNestedFilter). (7) Phase 2 활동 로그 5종 + 더보기 모달 3탭 + 경기참가 0 버그 fix. (8) 내농구 super-set 10 영역 (server 전환 + 14 쿼리 + CareerStatsGrid 글로벌 + MyPendingRequestsCard + NextTournamentMatchCard). tester 38건+ / reviewer ⭐⭐⭐⭐⭐ 4회. | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 / 5/5 ae4ffd7~5d62f7f 팀 멤버 라이프사이클+Jersey 재설계 5 Phase 16 PR main `8bbce95` / 듀얼 P3~P7 / 매치 코드 v4 Phase 1~7 / 인증 흐름 재설계 → main `3f016c9` / 5/6 UI fix 13 + apiError → main `4253e68` / 5/7 envelope 8회 — 5/7 main 21회 baseline (`2cc9df3` ~ `168be48`) / 5/8 main 7회 (`c6a6848` `f39afae` `8846f6d` `13a962e` `93670c5` `118c9f1`) / 5/9 main 8회 신기록) — 복원: git log -- .claude/scratchpad.md -->
