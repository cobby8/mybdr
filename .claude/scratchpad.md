# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 6.1 Auto Chain — v2.24 sync + Phase 6.1C 박제 6 PR (프로필 본체)
- **상태**: ✅ **완료** — sync `29178b9` + 6.1C 6/6 박제 push + **PR #657**(subin→dev) / Vercel 빌드 pass. 수빈 머지 결재 대기
- **현재 담당**: pm (chain 종료)
- **의뢰서**: `Dev/design/prompts/phase-6.1-auto-chain-cli-prompt-2026-05-30.md`

### Phase 6.1C 완료 (6/6 ✅)
| PR | 시안 → 운영 | commit |
|----|------|------|
| 6.1C-1 | PU4 Achievements → /profile/achievements (BP3) | `cc78745` |
| 6.1C-2 | PU1 ProfileMain → /profile 보강 (BP6) | `77dacdd` |
| 6.1C-3 | PU2 ProfileEdit → /profile/edit 보강 (BP4) | `a7d4f13` |
| 6.1C-4 | PU3 ProfileBasketball → /profile/basketball (BP2 server조회4) | `39f6a0c` |
| 6.1C-5 | PA1 AdminUsers → /admin/users (BP5 자기정지가드) | `fd53cbe` |
| 6.1C-6 | PU5 UserPublicProfile → /users/[id] (BP1 publicView) | `f29a3ca` |
- sync `29178b9` / ledger `e6d2840` / **PR #657** / stop 발동 0 / Vercel 빌드 ✅

### Phase 5 (직전) — subin→dev #656 머지(`9619be8`) / dev→main 보류

### Phase 5C 진행 현황 (6/6 ✅)
| PR | 시안 → 운영 | commit |
|----|------|------|
| 5C-1+6 | CU4 Edit + CU3 New 공용 `community-wizard.tsx` (BC5) | `68fc5c3` |
| 5C-2 | CU1 CommunityList → /community (BC2) | `c058f6e` |
| 5C-3 | CU2 CommunityDetail → /community/[id] (BC4) | `70c6c6c` |
| 5C-4 | RU1 Rankings → /rankings (BC1/BC7) | `a2e01e0` |
| 5C-5 | CA1 AdminCommunity → /admin/community (OA1) | `3e3423f` |
- sync `7e2d0f1` / ledger `7ff69b6` / **PR #656** subin→dev / stop condition 발동 0

### Phase 5 lock (적용 결과)
- A1 댓글=운영 comments 실데이터 / A2 신고=hide / A4 cross-domain·MVP·핀 hide(mock 0)
- 데이터 패칭·서버액션·권한가드 0 변경 / 매 commit tsc0 / 회귀6 PASS / `/api/v1`·DB schema 0 / LOC<+2000
- globals.css cu1-/cu2-/ru1- prefix 충돌 0 / 시안 토큰→운영 토큰 치환

### 5C 핵심 hide 결정 (mock 0)
- 5C-1: news/notice 작성 제외(6종) / STEP4 cross-domain hide / type·images 미지원 안내
- 5C-2: team·is_official·image_count·tournament hide / 인기글 실데이터 파생 / mock 내활동 드롭
- 5C-3: 알기자 hero·mock 추천·신고 hide / 운영 댓글·좋아요·사이드바 컴포넌트 보존
- 5C-4: MVP Hero·매너·코트·titles hide / 팀 승수 리더=team모드 1위 실데이터
- 5C-5: 신고·핀·알림·복구 hide / deleted 탭 실데이터 / 동적 카테고리 / Hero stat 실측

## 🔜 다음 액션
- ⏸ **PR #656 머지 결재** (수빈 — subin→dev→main, #654/#655 답습)
- ⏸ Phase 6 영역 결재 (Cowork 별 의뢰)
- ☐ PR-1C-10 PA3 재설계 결정 (보류 중)
- ✅ **[멤버검수] 셋업팀 6번 하주호 placeholder 생성+연결 완료** — 대회 d83e8b83/ttId=232/teamId=196. ph User uid=**3516**(placeholder-196-6@bdr.placeholder, status=placeholder) + TeamMember id=2740(j6 active) + ttp 4556 userId=3516 연결 + team196 members_count→24. 4-write 트랜잭션, 사전·사후 검증 통과. 하주호 실가입+셋업팀 가입 시 mergeTempMember 자동승계 대기
- ☐ **[후속 점검 후보]** 셋업팀 0번 이준호(ttp→uid2957)·7번 이영기(ttp→uid2955)가 status=merged 잔재계정 가리킴 — 실팀원(2872/2867 kakao active)과 불일치. ttp 재연결 필요 여부 별도 검토

## 이전 Phase (완료 이력)
- ✅ Phase 1C 15/16 박제+머지 (#650~#653) / PA3 SKIP 보류
- ✅ Auto Chain 25 PR (v2.22 sync + 2C/3C/4C) 운영 반영 (#654/#655 / main `6f22c02`)
- ✅ Phase 1~4 ⑭ 종료 마킹

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|------|------|------|

## 구현 기록 (developer) — Phase 6.1C

### 6.1C-1 · PU4 ProfileAchievements → /profile/achievements

📝 구현: 운영 `_v2` 업적 페이지 상단 평면 card 헤더를 **PU4 v2.24 Hero 배너**로 교체 (시각 토큰/레이아웃 정합). 데이터 패칭 0 변경.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/(web)/profile/achievements/_v2/achievements-content.tsx` | 평면 헤더 → 다크 그라디언트 Hero(`pf-achv-hero` · military_tech 골드 원형 + 획득/전체 카운트칩 + 요약 meta 3종 + 안내 카피). 기존 계산값(earnedItems/allBadges/achievementPct)만 사용 | 수정 |
| `src/app/globals.css` | `pf-achv-` prefix Hero CSS +66 line (다크 그라디언트는 ru1-leader 답습 리터럴, 라운딩 4/8/10px, 720px 분기) | 수정 |

정합 결과:
- 데이터 0 변경: page.tsx·badge-catalog.ts 미수정 / 신규 쿼리 0 / mock 0
- cross-domain hide: 시안 champion 카드·MVP 누적 StatCard 미배치 (page.tsx 미페칭 — 쿼리 추가 금지 준수)
- 운영 보존: 필터 칩·4열 그리드·최근획득4·달성률·tier/lock 로직 전부 유지
- prefix 충돌 0 (`pf-achv-` 신규) / `--r-lg` 등 시안 전용 토큰 미사용 → 운영 리터럴 치환

💡 tester 참고:
- 테스트: `/profile/achievements` 로그인 후 진입
- 정상: 상단 다크 군청 Hero 배너 + 골드 military_tech 아이콘 + "획득 N / 전체 M" 칩 + meta 3줄(배지 N개/전체 M종/달성률 P%) / 하단 필터·그리드 기존대로
- 주의: 배지 0건 계정(neewbie) → Hero 카운트 0/16, meta 0개/16종/0%, 최근획득 섹션 숨김 정상 / 비로그인 → 기존 로그인 유도 화면

⚠️ reviewer 참고:
- Hero 다크 그라디언트 리터럴 hex(#1A1E27 등) = 시안 pm-hero + 운영 ru1-leader Hero 동일 패턴(다크 밴드 한정 허용). 토큰 위반 아님
- 데이터 0 변경 확인 포인트: page.tsx·badge-catalog.ts diff 없음

### 6.1C-2 · PU1 ProfileMain → /profile (보강 +119 LOC)

📝 구현: 운영 3-tier hub(831 line) **전부 보존**. 시안 PU1 정합 위해 시각 보강 2종만 추가 — (1) Hero meta 포지션·지역·매너, (2) BP6 카운트 strip(운영 실데이터 3종). **교체 ❌ / 데이터 패칭 0 변경**.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/(web)/profile/page.tsx` | Hero `mypage__id-meta`에 포지션(sports_basketball)·지역(location_on·city/district 둘 다 null이면 hide)·매너(favorite·evaluation_rating null이면 hide) meta 추가 + Hero 직후 `pu1-counts` strip(내 팀 teamMembers.length / 호스트 total_games_hosted / 매너 evaluation_rating). `counts` 객체 변환부 추가 | 수정 |
| `src/app/(web)/profile/mypage.css` | `pu1-meta`·`pu1-counts`/`pu1-count` prefix +70 line (운영 토큰 --bg-elev/--border/--ink-mute/--accent, 다크 각진 처리 답습, 720px 모바일 분기) | 수정 |

정합 결과:
- **데이터 패칭 0 변경**: Promise.all 8쿼리·getPlayerStats·서버액션 전부 미수정. counts 3종 전부 **이미 페칭된 데이터** 재사용(teamMembers.length / user.total_games_hosted / evaluationRating). 신규 쿼리 0 / mock 0
- **미페칭 hide**: 시안 5칸 카운트(대회/참가경기/팀/단체/매너) 중 대회·단체·참가경기 = page.tsx 미페칭 → 쿼리 추가 금지 위해 미배치(hide). 팀/호스트/매너 3종만
- **운영 보존**: 3-tier hub(Tier1 큰4/Tier2 중4/Tier3 작2)·aside(다음경기 D-N/이적진행/최근활동5/도움)·TeamsListCard·IA 색인·Spark·force-dynamic·휴면복구·활동추적 전부 미수정
- **null 가드**: 지역(city·district 둘 다 없으면 hide) / 매너(evaluation_rating null이면 hide) → 빈 데이터 계정 안전
- prefix 충돌 0: `pu1-` mypage.css·globals.css 둘 다 0건, `pf-achv-`(6.1C-1)·타 페이지와 충돌 0
- tsc --noEmit EXIT 0

💡 tester 참고:
- 테스트: `/profile` 로그인 후 진입
- 정상: Hero 닉네임 줄 아래 meta = [팀명 · 포지션 · 지역 · 매너 N.N] / Hero 아래 카운트 칩 3개(내 팀 N / 호스트 N / 매너 N.N — 매너 칸 빨강 강조) / 그 아래 기존 소속팀 카드·3-tier hub·aside 전부 그대로
- 주의: 지역 미입력 계정 → 지역 meta 숨김 정상 / evaluation_rating null 계정 → 매너 meta·카운트 "—" 정상 / 팀 0개 → 내 팀 카운트 0 / 모바일(≤720px) → 카운트 strip 좌우 16px 패딩 + 컴팩트
- 비로그인 → 기존 로그인 유도 화면(미변경)

⚠️ reviewer 참고:
- 특별 확인: Promise.all/getPlayerStats/page.tsx 쿼리 select 절 diff 0 (데이터 패칭 절대 미변경) — counts는 기존 변수 재사용만
- 다크모드 카운트 칸 각진 처리(border-radius 0 + border 2px)는 운영 `.mypage__hero`·`.mypage__avatar` 패턴 답습
- stop condition: 없음

### 6.1C-3 · PU2 ProfileEdit → /profile/edit (보강 +84 LOC)

📝 구현: 운영 거대 편집 페이지(1689 line) **데이터 패칭/PATCH/state/서버액션 0 변경**. 시안 PU2 정합 위해 (1) §4 공개설정 **오안내 정정**, (2) §4.5 결제·정산 **실 link out** 신규, (3) save bar 동기화 안내 보강 — **문구 + link out + 안내**만.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/(web)/profile/edit/page.tsx` | ①§4 priv-note "곧 제공/시각 박제" 오안내 → 실저장 정확 문구(privacy_settings가 PATCH로 실제 저장됨) ②파일헤더+PRIVACY_ROWS+§4 주석 "백엔드 미구현"→"실저장" 정정 ③§4.5 결제·정산 섹션 신규 — `/profile/billing` 실 Link out(mock 0, "준비 중" ❌) ④sticky save bar 기본 안내 → "마이페이지·공개 프로필에 바로 반영" 동기화 보강 | 수정 |
| `src/app/(web)/profile/edit/edit-profile.css` | `pu2-billing-` prefix +46 line (link out 카드 — 운영 토큰 --border/--bg-alt/--bg-elev/--accent/--ink/--ink-mute, 라운딩 4px, hover, 720px 분기) | 수정 |

정합 결과:
- **데이터 0 변경**: GET/PATCH /api/web/profile·privacy state(7×3)·PRIVACY_ROWS/OPTIONS·setPrivacy·handleSave payload·환불계좌·탈퇴모달 전부 미수정. diff 매칭된 fetch/PATCH/privacy_settings 라인 = **전부 주석/안내 텍스트뿐** (로직 0)
- **오안내 정정 핵심**: 운영 코드가 실제로 `payload.privacy_settings = privacy`(line 531)로 PATCH 저장 + GET 초기화(line 291)함에도 주석·priv-note만 "미구현/곧 제공/시각 박제"로 잘못 적혀 있던 것 → 실저장 정확 문구로 교체
- **운영 3옵션 chip 유지**: 전체/친구/비공개 chip·로직 무변경 (시안 on-off 토글로 교체 ❌ — 저장 schema 상이)
- **BP4 실 link out**: `/profile/billing`(구독+결제내역 탭 허브 — 이미 운영 중)으로 실제 연결. "준비 중/Phase 6.2" ❌ (실 페이지 존재 확인)
- 미리보기 링크: form state에 public_id 부재 → 본인 식별자 URL 무리하게 끌어오면 데이터 패칭 변경 위험 → 텍스트 안내만 ("공개 프로필에 반영")
- prefix 충돌 0: `pu2-billing` page.tsx·css 2곳만 / 타 페이지 0 / `--accent`(운영 토큰, `--primary` 미존재 확인 후 치환)
- tsc --noEmit EXIT 0

💡 tester 참고:
- 테스트: `/profile/edit` 로그인 후 진입 → §4 공개 설정 / §4-2 결제·정산 / 하단 save bar 확인
- 정상: §4 priv-note = "저장 시 즉시 적용되어 공개 프로필에 반영" (구 "곧 제공" 사라짐) / §4-2 결제 카드 클릭 → `/profile/billing` 이동 / save bar 기본 문구 = "저장하면 마이페이지·공개 프로필에 바로 반영됩니다."
- 실저장 확인: 공개 chip 변경 → 저장 → reload 후 chip 상태 유지되면 정상(PATCH 저장됨)
- 주의: 결제 카드 hover 시 테두리 빨강(--accent) / 모바일(≤720px) 카드 세로 스택 / 저장 시 1.5초 후 reload(기존 동작 유지)

⚠️ reviewer 참고:
- 특별 확인: handleSave payload(line 531 privacy_settings)·PATCH·setPrivacy·PRIVACY_ROWS diff 0 — 문구/주석/link out/CSS만 변경
- "곧 제공" 오안내가 실제로 오기였음 (코드는 실저장 중) — 정정이 정합 맞춤
- stop condition: 없음

### 6.1C-4 · PU3 ProfileBasketball → /profile/basketball (옵션 B server 조회 +439 LOC)

📝 구현: 운영 1068 line 페이지 **데이터 0 삭제(순수 추가)**. PM 정정 옵션 B 채택 — schema 실재 확인 후 **server 조회 4종 추가**로 BP2 cross-domain 시안 4요소를 **실데이터** 박제 (mock 0). DB schema·/api/v1 0.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/(web)/profile/basketball/page.tsx` | user select에 PU3 필드 12종 추가(dominant_hand/skill_level/strengths/manner_count/subscription_status/preferred_* 7종) + 서버쿼리 4종(15 UserSeasonStat / 16 games.final_mvp 30일 count / 17 Team.wins·losses / 18 Tournament.champion_team_id 우승) + 파생가공 + JSX 4요소(A 농구캐릭터 / B 시즌stat 5카드 / C 선호chip 7 / D 입상이력) | 수정 |
| `src/app/globals.css` | `pu3-` prefix +126 line (토큰만 var(--color-*), 라운딩 4/8px, 720px 분기) | 수정 |

추가한 서버 쿼리 목록 (전부 실재 모델/컬럼·본인 한정 IDOR 0):
- 15) `prisma.userSeasonStat.findUnique` (user_id+올해 season_year unique) — 시즌 참가경기/매너/MVP
- 16) `prisma.games.count` (final_mvp_user_id=본인 + created_at 30일) — BG4 이달의 MVP
- 17) `prisma.team.findUnique` (대표팀 wins/losses) — BT6 팀 전적 (2차 조회, user.teamMembers 확정 후)
- 18) `prisma.tournament.findMany` (champion_team_id ∈ 본인 active팀) — PA7 우승 이력 (2차 조회)

시안 요소별 실데이터/hide 판정:
- A 농구캐릭터: dominant_hand(운영 "L/R/B"→한글 매핑)·position·skill_level(한글 그대로)·strengths(Json) **실데이터**. 전부 미입력 시 카드 hide
- B 시즌 5카드: 참가경기(UserSeasonStat)·호스트(total_games_hosted)·MVP(games 30일)·매너(evaluation_rating+manner_count)·팀전적(Team wins/losses) **실데이터**. UserSeasonStat 0건이면 "—" 자연처리, 데이터 전무 시 카드 hide. **draws hide**(Team 무승부 컬럼 schema 없음)
- C 선호chip: preferred_* 7종 **실데이터** chip(읽기전용). **preferred_positions hide**(User 미존재) → 시안 8그룹 중 7그룹. 선택 0건 그룹 개별 hide
- D 입상이력: champion_team_id=본인팀 대회 **실데이터**. **준우승/3위 hide**(champion_team_id는 우승만 표현 — 순위 컬럼 schema 없음), placed='우승' 단일

정합 결과:
- **데이터 삭제 0**: git diff 삭제라인 0 = 운영 기존 14쿼리 select·career-stats·pending·next-match·픽업게임·소속팀 전부 보존. 신규는 select 확장 + 쿼리 4 append만
- **mock 0 / DB schema 0 / /api/v1 0 / LOC +439(<2000)**
- prefix 충돌 0: `pu3-` 운영 src/ = globals.css+basketball/page.tsx 2곳만 / `pf-achv-`(6.1C-1)·`pu1-`·`pu2-`와 충돌 0
- tsc --noEmit EXIT 0 (모델명 userSeasonStat/games/team/tournament·unique키 user_id_season_year 전부 검증)

💡 tester 참고:
- 테스트: `/profile/basketball` 로그인 후 진입
- 정상: ②Hero 아래 [농구캐릭터 카드] → [시즌 기록 5카드 grid + cross-domain 안내] → ③통산8열(운영) → [선호 정보 chip] → [입상 이력] 순. 이하 ④활동~⑩주간리포트 운영 그대로
- 주의 입력: ①UserSeasonStat 0건 계정 → 참가경기 "—", 카드는 다른 실데이터(매너/호스트) 있으면 노출 / ②선호 전부 미입력 → 선호 카드 hide / ③소속팀 없는 계정 → 팀전적·입상 둘 다 hide / ④우승 이력 없는 팀 → 입상 카드 hide / ⑤dominant_hand null → 손 meta 생략
- cross-domain 실측 확인: 본인이 final_mvp인 게임 최근30일 있으면 "이달의 MVP" 카운트 >0 / 소속팀 champion인 대회 있으면 입상 이력 노출

⚠️ reviewer 참고:
- 특별 확인: 기존 14쿼리 select 절 diff 0 (운영 데이터 패칭 무변경) — 신규 4쿼리는 전부 append/2차조회
- 17/18 2차 조회 분리 사유: champion/팀전적은 user.teamMembers(active팀 id) 의존 → 1차 Promise.all에서 불가 → user 확정 후 별도 Promise.all 2병렬 (over-fetch 회피)
- 16 MVP count는 final_mvp_user_id 캐시값 단순 count (recomputeFinalMvp 재계산 호출 ❌ — 집계비용 0)
- stop condition: 없음

### 6.1C-5 · PA1 AdminUsers → /admin/users (보강 +90 LOC + CSS 44)

📝 구현: 운영 고도화 페이지(역할탭/lazy detail/배번/프로필편집/모든 액션) **전부 보존**. 시안 PA1 정합 위해 (1) Hero 4-stat strip, (2) 본인 자기정지 가드(4 server action redirect + UI 가드 박스) 추가. **page → actions → table 순. 데이터 패칭 = status groupBy 1쿼리만 추가**.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/(admin)/admin/users/page.tsx` | getWebSession sub 주입(currentUserId) + status groupBy 1쿼리(activeCount/suspendedCount 실측) + AdminPageHeader 직후 `pa1-hero-stats` 4-stat strip(전체 totalCount/활성/정지/관리자 superAdminCount) + table에 currentUserId prop | 수정 |
| `src/app/actions/admin-users.ts` | requireSuperAdmin→session 반환 / 4액션(updateUserStatus·toggleUserAdmin·forceWithdraw·delete)에 `session.sub===userId` 시 `redirect(/admin/users?error=)` 본인 가드 (기존 isAdmin redirect 동일 패턴) | 수정 |
| `src/app/(admin)/admin/users/admin-users-table.tsx` | currentUserId prop + isMe 계산 + 모달 헤더 "나" 배지 + 관리탭 위험3블록(슈퍼관리자/상태/위험영역)을 isMe 시 가드 박스 1개로 대체(역할변경은 유지) | 수정 |
| `src/app/globals.css` | `pa1-hero-stat` prefix +44 line (운영 토큰 var(--color-*), 라운딩 8px, data-tone ok/err/warn, 720px 2열 분기) | 수정 |

추가 쿼리/가드:
- 신규 쿼리 1: `prisma.user.groupBy({by:['status'],_count})` — Hero 활성/정지 실측 (전체 기준, where 미적용)
- 신규 가드 4(redirect): updateUserStatus/toggleUserAdmin/forceWithdraw/delete 본인 차단 (자기정지/권한잠금/자기탈퇴/자기삭제 방지)

정합 결과:
- **데이터 패칭 거의 0**: 기존 findMany/count/loadMore/getUserDetail/모든 server action select·로직 전부 미수정. 신규 = groupBy 1쿼리 + session 읽기뿐
- **기존 보존**: 역할탭(전체/일반/호스트/관리자)·DataTableV2 6컬럼·lazy detail(팀/대회/활동/구독)·배번 인라인수정(TournamentRow)·프로필 긴급변경폼·더보기 무한스크롤 전부 미수정
- **titles(우승🏆) hide**: 시안 우승 컬럼 = 운영 user select 미페칭 → Hero stat·테이블 컬럼 미배치 (쿼리 추가 금지 준수, 4-stat만)
- **자기정지 가드**: server(redirect 4) + UI(가드박스) 이중. session.sub=string vs u.id=string 직접 비교
- prefix 충돌 0: `pa1-` 운영 src/ = globals.css+page.tsx 2곳만, `pf-achv-`/`pu1-`/`pu2-`/`pu3-`와 충돌 0
- tsc --noEmit EXIT 0 / mock 0 / DB schema 0 / /api/v1 0 / globals.css 공백무시 +44줄(순수 추가, 기존 손상 0)

💡 tester 참고:
- 테스트: `/admin/users` super_admin 로그인 후 진입
- 정상: AdminPageHeader 아래 Hero 4-stat(전체 N / 활성 N 초록 / 정지 N 빨강 / 관리자 N 노랑) → 기존 역할탭·테이블 그대로 / 행 클릭 모달 동일
- 본인 가드: 본인 행 클릭 → 모달 헤더 "나" 배지 / 관리 탭 = 역할변경만 노출, 슈퍼관리자/상태/위험영역 대신 "본인 계정은 변경 불가" 가드 박스
- server 가드 검증: (가드박스로 막혀 UI론 불가하지만) 만약 본인 user_id로 상태변경 호출 시 → `/admin/users?error=본인 계정은...` redirect → 상단 error 배너
- 주의: status=null/withdrawn 계정 → Hero 활성/정지 어디에도 미집계(활성·정지만 노출) / 검색(q) 중에도 Hero는 전체 통계(의도) / 모바일(≤720px) Hero 2열

⚠️ reviewer 참고:
- 특별 확인: 기존 server action select/로직 diff 0 (requireSuperAdmin은 return session 추가만, 호출부 무영향) / findMany·loadMore·getUserDetail select 무변경
- groupBy where 미적용 = 의도(superAdminCount/totalCount와 동일 전체 통계 컨텍스트). 검색 시 Hero가 전체 유지되는 게 자연스러움
- 본인 가드 server(redirect)+UI 이중 — redirect가 source of truth, UI는 헛클릭 방지
- stop condition: 없음

### 6.1C-6 · PU5 UserPublicProfile → /users/[id] (privacy 존중 +~80 LOC)

📝 구현: 운영 PU5 공개 프로필(769 line, 12쿼리) **데이터 패칭 0 변경(select에 privacy_settings 1줄 add만)**. 운영 PU2(profile/edit §4)에서 실저장되는 `privacy_settings` 7키를 공개 프로필에서 **존중**하도록 표시 분기 추가. 운영 _v2 컴포넌트(PlayerHero/OverviewTab/ActionButtons) **무변경 — 넘기는 props만 거름**.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/(web)/users/[id]/page.tsx` | ①user select에 `privacy_settings: true` 1줄 add ②`PRIVACY_DEFAULTS`(운영 PU2 default 동일)+`effectivePrivacy` 머지+`canShow(key)` 헬퍼 ③profile 비공개→비공개 안내 화면 early return(notFound 아님) ④record→seasonStats/recentGameRows/allStatsRows/activity카운트/activityEvents(match·mvp) 거름 ⑤review→evaluationRating ⑥area→city/district ⑦body→height/weight ⑧realName→name(null시 닉네임 fallback) ⑨generateMetadata도 profile/realName 존중 | 수정 |

privacy key → 표시필드 매핑 (운영 PU2 PRIVACY_ROWS 기준):
| key | 운영 default | PU5 제어 대상 | hide 처리 |
|-----|-----------|--------------|----------|
| profile | all | 페이지 자체 | 비공개 안내 화면 early return |
| realName | **none** | user.name (displayName/secondary/title) | name→null=닉네임만 |
| contact | friends | 휴대폰·이메일 | **PU5 미페칭=노출0**(작업 불필요·BP1 stop 미발동) |
| record | all | 스탯/통산/최근경기/활동(match·mvp)/경기·주최 카운트 | 빈값·빈배열·루프skip |
| review | all | evaluation_rating(★별점) | null→Hero showRating false |
| area | all | city/district(Hero meta 지역) | null→location 제외 |
| body | **friends** | height/weight(Hero physical) | null→"-" |

핵심 판단(friends): 운영에 **"친구(friend)" 개념 부재**(follows=단방향 팔로우뿐, grep lib friend 로직 0). fail-safe(PM 가드#2 모호하면 hide 우선) → 비본인 viewer에게 **friends=none 동일 hide**. 비본인 노출 = key가 정확히 "all"일 때만. 기본값이 friends인 contact(이미 미페칭)·body는 비본인에게 가려짐(운영 의도 = 친구만 공개인데 친구판정 불가 → 안전하게 hide).

정합 결과:
- **데이터 패칭 0 변경**: 12쿼리 전부 무변경 / select에 privacy_settings 1줄 add만 (가드#4 충족) / mock 0 / DB schema 0 / /api/v1 0
- **민감3종(이메일/연락처/결제) 노출 0**: PU5 애초에 미페칭 → BP1 stop 미발동 (검증: page.tsx user select에 email/phone/account_* 키 없음 — 위 매핑 contact 행)
- **본인 preview bypass**: `isOwner` true면 `canShow` 전부 통과 → 본인 미리보기(?preview=1)는 모든 영역 표시. 기존 redirect/preview 로직 무변경
- **FollowButton 보존**: ActionButtons(targetUserId/initialFollowed/isLoggedIn) prop·실기능 무변경
- **소속단체 hide**: PU5는 애초에 단체(org) 미배치 — 팀(team)만 노출, 단체 없음(확인 완료)
- 운영 _v2 컴포넌트 0 변경: PlayerHero/OverviewTab/ActivityLog/StatsDetailModal/CareerStatsGrid/ActionButtons 미수정 — 전부 props 레벨 거름
- prefix 충돌 0: 비공개 안내 화면 = 인라인 스타일만(globals.css 미추가) / `pu5-` 운영 src/ 0건(시안 파일만)
- tsc --noEmit EXIT 0

💡 tester 참고:
- 테스트: 타 계정으로 `/users/[다른유저id]` 진입
- 정상(기본값 계정): 프로필 노출 / 실명 hide(닉네임만, realName 기본 none) / 신장·체중 hide(body 기본 friends) / 경기기록·매너·지역 노출(전부 기본 all)
- 본인 검증: `/users/[본인id]?preview=1` → 모든 영역 표시(필터 bypass) / `/users/[본인id]`(preview 없음) → /profile redirect(기존)
- privacy 변경 검증: profile/edit §4에서 "경기 기록"=비공개 저장 → 타 계정으로 공개프로필 보면 시즌스탯 "-"·최근경기 빈·통산 더보기 버튼 사라짐 / "프로필 전체"=비공개 → "비공개 프로필입니다" 안내 화면
- 주의 입력: privacy_settings=null 계정(미설정) → 운영 PU2 default 동작 동일(실명·신장체중 hide / 기록·매너·지역 공개) / friends 설정 항목은 비본인에게 hide(친구판정 불가 fail-safe)

⚠️ reviewer 참고:
- 특별 확인: 12쿼리 select diff = privacy_settings 1줄 add만(나머지 0) / _v2 컴포넌트 파일 diff 0(props 레벨만 거름)
- friends=hide fail-safe 결정 — 운영에 친구 개념 부재로 friends 옵션이 비본인에게 정의 불가 → 노출보다 hide 선택(PM 가드#2). 추후 친구 기능 구현 시 friends 분기 재검토 포인트
- PRIVACY_DEFAULTS = 운영 PU2 L232~240 default 리터럴 복제 (source of truth = PU2) — PU2 default 변경 시 동기화 필요
- generateMetadata도 profile/realName 존중(별도 findUnique·본문 12쿼리 무관) — title에 비공개 실명 노출 방지
- stop condition: 없음 (publicView 분기 검증 = 민감3종 미페칭 확인 / 본인 preview bypass 정상 / friends fail-safe hide)

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-31 | **Phase 6.1C-6** PU5 UserPublicProfile (privacy 존중) | ✅ privacy_settings 7키 존중(select 1줄 add·12쿼리 무변경) / friends=hide fail-safe(운영 친구개념 부재) / 본인 preview bypass / 민감3종 미페칭=노출0 / page.tsx +~80 / tsc0 / _v2 컴포넌트 0변경(props 거름) / 커밋 대기 |
| 2026-05-30 | **멤버검수** 셋업팀 6번 하주호 placeholder 생성+연결 | ✅ 운영DB 4-write 트랜잭션 (ph User uid3516+TeamMember2740+ttp4556 연결+members_count24) / 사전·사후검증 통과 / conventions+1·index 갱신 / 임시스크립트 정리 / 실가입 시 자동승계 대기 |
| 2026-05-31 | **Phase 6.1C-5** PA1 AdminUsers (BP5 자기정지 가드) | ✅ Hero 4-stat(status groupBy 1쿼리 실측)+본인 가드(4 server action redirect + UI 가드박스) / page.tsx·actions·table·globals.css(`pa1-`) +90/+44 / tsc0 / titles hide / 기존 역할탭·lazy detail·배번·프로필편집 보존 / 커밋 대기 |
| 2026-05-31 | **Phase 6.1C-4** PU3 ProfileBasketball (옵션 B server조회 BP2) | ✅ 서버쿼리4종(UserSeasonStat/games.final_mvp 30일/Team전적/champion우승) 실데이터 박제 + 시안4요소(캐릭터/시즌5카드/선호chip/입상) / page.tsx+globals.css(`pu3-`) +439 / tsc0 / 데이터삭제0 / mock0·schema0·/api/v1 0 / 커밋 대기 |
| 2026-05-31 | **Phase 6.1C-3** PU2 ProfileEdit 보강 (BP4) | ✅ priv 오안내 정정+결제 link out(`/profile/billing`)+save bar 동기화 / page.tsx+edit-profile.css(`pu2-billing-`) +84 / tsc0 / 데이터0변경 / 커밋 대기 |
| 2026-05-31 | **Phase 6.1C-1** PU4 Achievements Hero 박제 | ✅ achievements-content.tsx Hero(`pf-achv-`)+globals.css +66 / tsc0 / 데이터0변경 / 커밋 대기 |
| 2026-05-31 | **Phase 5 chain 완료** (sync v2.23 + 5C 6 PR) | ✅ `7e2d0f1`·`68fc5c3`·`c058f6e`·`70c6c6c`·`a2e01e0`·`3e3423f`·`7ff69b6` push / PR #656 / ledger Phase5 ⑩⑪⑫ ✅ / stop 0 |
| 2026-05-30 | Phase 1~4 종료 마킹 + git 동기화 + Phase 5 대기 | ✅ dev→subin(`0c61175`) / ledger 2/3/4 ⑬⑭ ✅ |
| 2026-05-29 | Auto Chain 25 PR 운영 반영 (#654→#655) | ✅ main=`6f22c02` / Vercel 배포 |
| 2026-05-29 | Phase 4C 완료 8/8 | ✅ `8ec6a54`~`fa7b63b` / OrgHierarchyCrumbs 공용 / Q2·Q3·Q4 lock |
