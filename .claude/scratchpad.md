# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 6.1 Auto Chain — v2.24 sync + Phase 6.1C 박제 6 PR (프로필 본체)
- **상태**: 🔵 진행 중 — sync v2.24 ✅ `29178b9` / 6.1C 6 PR 박제 진행
- **현재 담당**: pm → developer
- **의뢰서**: `Dev/design/prompts/phase-6.1-auto-chain-cli-prompt-2026-05-30.md`

### Phase 6.1C 진행 (6 PR / 운영 라우트 전부 존재 — _v2 고도화 상태)
| PR | 시안 → 운영 | 상태 |
|----|------|------|
| 6.1C-1 | PU4 Achievements → /profile/achievements | ✅ 박제(tsc0) — 커밋 대기 |
| 6.1C-2 | PU1 ProfileMain → /profile (보강) | ⏳ |
| 6.1C-3 | PU2 ProfileEdit → /profile/edit (보강) | ✅ 박제(tsc0) — 커밋 대기 |
| 6.1C-4 | PU3 ProfileBasketball → /profile/basketball | ⏳ |
| 6.1C-5 | PA1 AdminUsers → /admin/users | ⏳ |
| 6.1C-6 | PU5 UserPublicProfile → /users/[id] | ⏳ |
- lock: BP1 publicView() privacy(PU1본인=PU5공개 동일 User, 이메일/연락처/결제 hide) / BP2 cross-domain mock 0 / BP4 결제=Phase6.2 link out "준비 중" / BP5 OA1 답습 본인 자기정지 가드

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
- ⏸ **[멤버검수] 셋업팀 6번 하주호 계정연결 대기** — 대회 d83e8b83(열혈농구단 SEASON2 전국 최강전)/ttId=232/teamId=196. 6번 하주호 ttp(id=4556) 이미 존재·**userId=null**(셋업팀 유일 미연결). 하주호 mybdr 미가입(placeholder조차 없음). 연결경로: ①실가입+셋업팀 TeamMember active 가입(name/nick="하주호") → `/api/web/tournaments/[id]/link-players`(linkPlayersToUsers) 자동매칭 OR ②placeholder 계정 생성 후 ttp 연결 → 실가입 시 mergeTempMember 자동병합. 가입 완료 후 재요청 필요
- 📌 참고: placeholder↔실가입 연결기능 = `src/lib/teams/merge-placeholder-user.ts`(mergePlaceholderUser) + `merge-temp-member.ts`(팀가입시 자동). 시스템 placeholder User 78명. 셋업팀 0번 이준호(uid2957)·7번 이영기(uid2955) ttp가 status=merged 계정 가리킴(실팀원 2872/2867과 불일치 — 정합성 점검 후보)

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

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-31 | **Phase 6.1C-3** PU2 ProfileEdit 보강 (BP4) | ✅ priv 오안내 정정+결제 link out(`/profile/billing`)+save bar 동기화 / page.tsx+edit-profile.css(`pu2-billing-`) +84 / tsc0 / 데이터0변경 / 커밋 대기 |
| 2026-05-31 | **Phase 6.1C-1** PU4 Achievements Hero 박제 | ✅ achievements-content.tsx Hero(`pf-achv-`)+globals.css +66 / tsc0 / 데이터0변경 / 커밋 대기 |
| 2026-05-31 | **Phase 5 chain 완료** (sync v2.23 + 5C 6 PR) | ✅ `7e2d0f1`·`68fc5c3`·`c058f6e`·`70c6c6c`·`a2e01e0`·`3e3423f`·`7ff69b6` push / PR #656 / ledger Phase5 ⑩⑪⑫ ✅ / stop 0 |
| 2026-05-30 | Phase 1~4 종료 마킹 + git 동기화 + Phase 5 대기 | ✅ dev→subin(`0c61175`) / ledger 2/3/4 ⑬⑭ ✅ |
| 2026-05-29 | Auto Chain 25 PR 운영 반영 (#654→#655) | ✅ main=`6f22c02` / Vercel 배포 |
| 2026-05-29 | Phase 4C 완료 8/8 | ✅ `8ec6a54`~`fa7b63b` / OrgHierarchyCrumbs 공용 / Q2·Q3·Q4 lock |
| 2026-05-29 | Phase 3C 완료 6/6 | ✅ `50ee237`~`0b61922` / status·권한 BT1~6 / docs `b50b88e` |
| 2026-05-29 | Phase 2C 완료 10/10 | ✅ `13feb36`~`9292fe6` / game_applications.status Int / docs `283bcd3` |
| 2026-05-29 | Auto Chain 1단계 v2.22 sync (`dee2445`) | ✅ screens 33→46 / 회귀16 |
