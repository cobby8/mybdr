# 작업 스크래치패드

## ⚠️ 세션 분리 원칙 (2026-04-22 재정의)

> 일반 모드 / 카페 모드 분리 — 기존 룰 그대로

- **일반 모드**: mybdr 본 프로젝트 작업 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 쇼핑몰 작업 (`scratchpad-cafe-sync.md` 별도)

## 🚧 추후 구현 목록 (DB/API 확장 필요)

**미해결 ⏳**
- 슛존 성공률 (heatmap) / 스카우팅 리포트
- 프로필 시즌 통계 / VS 비교
- 커뮤니티 댓글 답글 / 좋아요 / 게시글 북마크
- waitlist / no-show / QR 티켓
- AppNav 쪽지 unread count 뱃지 (messages unread API 추가 시 prop 활성화)
- D-6 EditProfile §2 사용손/실력/강점 + §4 공개 7항목 → PATCH `/api/web/profile` 확장
- D-6 EditProfile §3 인스타·유튜브 (`instagram_url` / `youtube_url` 컬럼 추가 시 활성화)
- D-3 §02 Highlight (MatchPlayerStat 평점 시스템 연동) / §05 다음 주 추천 (추천 엔진 연동)
- ComingSoonBadge 공통 컴포넌트 격상 (다른 v3 페이지 재사용)
- Tournament.status 'published' 잔재 cleanup
- organizations 단체 생성 → 목록 노출 e2e 스모크 테스트 부재
- Q1 후속: `_components/` 11 파일 + `courts/[id]/page.tsx` 19건 옛 토큰 마이그
- Q1 후속: ContextReviews kind="series" /tournaments[id] + kind="player" /users[id] 도입
- Q1 후속: `/reviews?courtId=...` deep-link → onViewAll 활성화
- **대회 선수 가입 시 이름 기준 자동 매칭 hook 부재** — 현재 `matchPlayersByPhone` 만 가입 hook에서 자동 호출 추정. `linkPlayersToUsers` (이름 기준) 는 수동 호출만 → 명단 사전 등록 시 phone 없으면 추후 가입해도 자동 연결 X. 가입 hook 또는 cron 추가 필요
- **placeholder User 통합 스크립트** (2026-05-01 신설) — provider="placeholder" + status="placeholder" + email="placeholder-{teamId}-{jersey}@bdr.placeholder" 패턴 22명 (크로스오버 17 + 피벗 5) 생성. 추후 진짜 User 가입 시: (1) 이름·팀 일치 placeholder User 검색 (2) FK 일괄 UPDATE (TeamMember.userId, TournamentTeamPlayer.userId 등) (3) placeholder User status="merged" 또는 DELETE — 통합 함수 작성 필요
- **`linkPlayersToUsers` 에 placeholder 필터 추가** (긴급) — 현재 자동 매칭이 active TeamMember 전체 대상이라 placeholder User 도 매칭 후보가 됨. `where: { user: { provider: { not: "placeholder" } } }` 필터 추가 필요 — 진짜 가입자 vs placeholder 충돌 방지
- **공개 페이지 placeholder User 노출 점검** — 랭킹/프로필/팀 멤버 카운트 등에서 placeholder User 가 노출되는지 회귀 검증. `provider="placeholder"` 또는 `status="placeholder"` 필터 추가 필요한 곳 점검
- **본인인증 작동 시 실명·전화 필수 라벨 폐기 + 자동입력 전환** (선수명단 실명 표시 규칙 #5 추가 정책 2026-05-01) — Phase E 라벨 "실명 (필수)" / "전화 (필수)" 는 본인인증 미연동 임시 정책. 본인인증 시스템 활성화 시 → 입력 폼에서 실명·전화 자동 채워짐 + 사용자 직접 입력 필드 제거. 간편가입(소셜 OAuth) 개선 시에도 동일. 본인인증 진입점은 D-6 EditProfile §1 hero 에 이미 존재 (`name_verified` 플래그 활용)
- **PortOne 본인인증 페이지 신설** (계약 완료 후) — 사이트 진입 → 로그인 → 본인인증 미완료 계정 자동 redirect → 본인인증 완료 → 홈 진입 흐름. 현재 settings/account 섹션의 `IdentityVerifyButton` 진입점 → 새 본인인증 페이지로 변경. EditProfile §1 `✓본인인증` placeholder는 박제 시 삭제 완료 (2026-05-01)

## 현재 작업

- **요청**: **선수명단 실명(User.name) 표시 규칙 적용** — 경기 관련 모든 페이지 점검 + 계획 수립
- **상태**: 영향 범위 분석 완료 → 사용자 결정 5건 대기
- **현재 담당**: planner-architect (분석 완료) → 사용자 결정 → developer
- **브랜치**: subin
- **이전 큐**: Settings/BottomNav 큐 보류. 동호회최강전 데이터 작업 우선
- **주요 발견**: 운영 코드 8 패턴 혼재 — `nickname ?? name` (다수) vs `name ?? nickname` (소수) vs `nickname` 단독 (Flutter API 일부) vs `nickname || name || 'Player#id'` (랭킹/시상). **단일 헬퍼 부재**가 근본 원인

### 기획설계 (planner-architect, **완료 — commit 3111e25**) — Settings 박제

> 사용자 결정 7건 (A1-DB-direct/B3-fallback/C3/D2/Q1=①/Q2=전체/Q3=빼기) 모두 정합. 13 룰 #10 명확화 (정사각형 원형 50% — CLAUDE.md + 02-design-system-tokens.md §4-1). 상세 분석은 commit 3111e25 message 참조.

### 기획설계 — 선수명단 실명 표시 규칙 (2026-05-01)

🎯 목표: **경기 관련 모든 페이지에서 선수명단은 실명(User.name) 우선 표시**. 닉네임은 별도 표기(보조 라인) 또는 비노출. 운영 8 패턴 혼재 → 단일 헬퍼 + Phase 별 적용으로 통일.

📍 영향 범위 — 현재 노출 패턴 매핑 (주요 25개소)

| 영역 | 파일 | 라인 | 현재 패턴 | 분류 |
|------|------|------|----------|------|
| **팀 페이지 로스터** | `src/app/(web)/teams/[id]/_tabs/roster-tab.tsx` | 48,62 | `m.user?.nickname ?? m.user?.name` | nickname 우선 ❌ |
| 팀 페이지 로스터 v2 | `src/app/(web)/teams/[id]/_components_v2/roster-tab-v2.tsx` | 65,125 | `m.user?.nickname ?? m.user?.name` | nickname 우선 ❌ |
| 팀 상세 hero (주장명) | `src/app/(web)/teams/[id]/page.tsx` | 79,212 | `captainMember?.user?.nickname ?? captainMember?.user?.name` | nickname 우선 ❌ |
| **서브도메인 토너먼트 사이트 — 팀** | `src/app/_site/teams/page.tsx` | 23,84 | `users.nickname` **단독** (name select 누락) | nickname 단독 ❌❌ |
| **시상(Awards)** | `src/app/(web)/awards/page.tsx` | 230,301,349,397,473,543,545 | `nickname \|\| name \|\| Player#id` | nickname 우선 ❌ |
| **대회 관리 — 선수 등록 (관리자)** | `src/app/(web)/tournament-admin/tournaments/[id]/teams/page.tsx` | 425 | `p.player_name ?? "-"` | player_name 단독 ✅ (관리자 입력값) |
| **대회 신청 (사용자 측 팀 멤버 표시)** | `src/app/(web)/tournaments/[id]/join/page.tsx` | 186 | `m.user.name ?? m.user.nickname` | **name 우선** ✅ (이미 정합) |
| **라이브 점수 페이지 — PlayerRow** | `src/app/api/live/[id]/route.ts` | 200,207,382,591,595 | `p.users?.nickname ?? p.users?.name ?? p.player_name` | nickname 우선 ❌ |
| 라이브 페이지 표시 | `src/app/live/[id]/_v2/tab-timeline.tsx` | 130 | `e.player_name \|\| #jersey` | player_name 단독 ✅ |
| **스코어보드 (송출용)** | `src/app/scoreboard/[matchId]/page.tsx` | 411-413 | `evt.player_name` | player_name 단독 ✅ |
| **Flutter v1 — 대회 풀 데이터** | `src/app/api/v1/tournaments/[id]/full-data/route.ts` | 59 | `p.users?.nickname ?? p.player_name` | nickname 우선 ❌ |
| Flutter v1 — 팀 선수 목록 | `src/app/api/v1/tournaments/[id]/teams/[teamId]/players/route.ts` | 204 | `p.users?.name ?? p.player_name` | **name 우선** ✅ (이미 정합, 같은 라인 147은 `player_name` 단독 입력 응답) |
| Flutter v1 — 매치 통계 | `src/app/api/v1/matches/[id]/stats/route.ts` | 19 | `users.nickname` 단독 | nickname 단독 ❌❌ |
| Flutter v1 — 선수 통계 | `src/app/api/v1/players/[id]/stats/route.ts` | 16 | `users.nickname` 단독 | nickname 단독 ❌❌ |
| Flutter v1 — 대회 선수 통계 | `src/app/api/v1/tournaments/[id]/player-stats/route.ts` | 12 | `users.nickname` 단독 | nickname 단독 ❌❌ |
| Web API — 공개 팀 정보 | `src/app/api/web/tournaments/[id]/public-teams/route.ts` | 49,84 | `users.nickname` 단독 | nickname 단독 ❌❌ |
| Web API — 관리자 팀 선수 | `src/app/api/web/tournaments/[id]/teams/[teamId]/players/route.ts` | 42 | select에 `nickname` 만 (name 미포함) | nickname 단독 ❌❌ |

🔗 운영 데이터 현실 (knowledge + DB 작업 로그):
- **placeholder User 22명**: `nickname=null`, `name=실명` — `nickname ?? name` 패턴이면 실명 표시 OK, but `nickname` 단독 필드면 빈 값
- **자동 매칭된 9명** (성윤호 외 8): nickname 있음 (예: 성윤호) — `nickname` 우선이면 닉네임 표시. 실명은 User.name 별도 보유 추정
- **기존 짧은 닉네임 보유자**: "w", "MW", "ys", "ian", "종훈" 등 — `nickname` 우선 시 식별 어려움
- **TournamentTeamPlayer.player_name**: 대회 등록 시 입력한 이름 (대부분 실명). 일부는 운영자가 입력한 그대로
- **User.name** 의 신뢰도: 회원가입 시 입력값. nullable. 자동 매칭 + placeholder 가입자는 100% 보장. 일반 가입자는 부분적

📋 **사용자 결정 필요 5건** (decisions.md 갱신 대상)

**결정 1 — 표시 우선순위 (가장 중요)**
- **옵션 A** (사용자 요구 직역): `User.name → TournamentTeamPlayer.player_name → '#jersey' → '선수'`
  - 장점: 100% 실명 보장. 닉네임 일절 노출 X
  - 단점: User.name=null + player_name=null 인 옛 데이터에서 "#15" 같은 등번호만 표시되는 경우 발생 가능 (회귀)
- **옵션 B** (실명 우선 + 닉네임 fallback): `User.name → User.nickname → player_name → '#jersey'`
  - 장점: 회귀 0. 실명 없을 때만 닉네임. 점진 정비 가능
  - 단점: 닉네임이 우선 표시되는 케이스 일부 잔존 (실명 누락 사용자)
- **옵션 C** (Hybrid 표기): 메인 = User.name, 서브 = nickname (괄호) — 예: "홍길동 (gildong)"
  - 장점: 정보 손실 0. 시안 변경 필요
  - 단점: UI 폭 증가 (모바일 좁은 셀 깨질 수 있음)
- **추천: B** — 사용자 요구의 본의(실명 우선)는 만족 + DB drift 회귀 0 + 점진 정비 = User.name 백필 별도 큐

**결정 2 — 헬퍼 신설 위치**
- **옵션 1** (lib 유틸): `src/lib/utils/player-display-name.ts` 신설 — `getDisplayName(user, ttp?)` 순수 함수
  - 장점: SSR/CSR/API 모두 호환, 1줄로 통일, grep 쉬움
  - 단점: prop 변환 1단 추가
- **옵션 2** (React 컴포넌트): `<PlayerName user={...} player={...} />` 컴포넌트
  - 장점: JSX 한 줄, link/badge 등 부가 UI 통합 가능
  - 단점: API 응답 가공/Prisma raw SQL 결과는 적용 불가 → 두 방식 혼재
- **추천: 옵션 1** — Flutter API/raw SQL/JSX 모두 1개 함수로 처리. 결정 1 채택안의 fallback 체인 1곳에서 관리

**결정 3 — Prisma include/select 일괄 보강 범위**
- 배경: 현재 8개소가 `select: { nickname: true }` 만 — name 컬럼 select 누락 → name 우선 패턴이라도 SQL에서 안 받음
- **옵션 X** (헬퍼 + select 동시 보강): 헬퍼 적용 시 `select: { nickname: true, name: true }` 동시 추가 (필수)
- **옵션 Y** (Prisma include 표준 헬퍼): `userDisplaySelect = { id: true, nickname: true, name: true, profile_image: true }` 상수 신설 → import 통일
- **추천: 옵션 Y** — `src/lib/db/select-presets.ts` 신설. select 누락 회귀 방지. select drift 한 곳에서 관리

**결정 4 — Phase 분할 + 위험도**
- **Phase A** (인프라, 영향 0): 헬퍼 + select preset 신설만, 기존 호출처 0. **소요 30분**, 위험 0
- **Phase B** (핵심 경기/팀): 5 파일 — teams/[id] roster + roster-v2 + page (주장) + tournaments/[id]/join + _site/teams. **소요 1h**, 위험 낮음 (UI 텍스트만)
- **Phase C** (라이브/스코어보드/시상): 4 파일 — live API + awards + scoreboard PBP. **소요 1h**, 위험 중간 (시상 raw SQL 4 블록 — 주의)
- **Phase D** (Flutter v1 API): 5 파일 — full-data + matches/stats + players/stats + tournaments/player-stats + tournaments/teams/players. **소요 1h**, 위험 중간 (Flutter 앱 호환 — 응답 키 변경 X, 값만 변경이라 OK)
- **Phase E** (관리자/추가 점검): tournament-admin/teams + public-teams API + 잔여 grep. **소요 30분**, 위험 낮음
- **추천: A → B → C → D → E 순차** (각 Phase 단독 commit, tester pass 후 다음 진행)

**결정 5 — 선수 추가 입력 폼 (관리자) 의 player_name 라벨**
- 배경: `tournament-admin/tournaments/[id]/teams/page.tsx:425` "이름" 컬럼 = `player_name`. 관리자가 임의 입력 가능 (실명 권장 X)
- **옵션 가** (그대로): "이름" 라벨 유지 — 관리자가 입력한 값 그대로 표시 + 자동 매칭 시 User 실명으로 보강
- **옵션 나** (라벨 변경): "실명 (필수)" 로 변경 + placeholder "예: 홍길동" — 입력 가이드만 제공, 강제 X
- **추천: 나** — 입력 시 실명 권장 시그널. 강제는 운영 부담 (예: 외국인 영문명 등)

📋 실행 계획 (Phase A~E 순차)

| Phase | 순서 | 작업 | 담당 | 파일 수 | 선행 |
|-------|------|------|------|---------|------|
| **A** | 1 | `src/lib/utils/player-display-name.ts` 신설 (`getDisplayName(user, ttp?)`) | developer | 신규 1 | 결정 1·2 |
| A | 2 | `src/lib/db/select-presets.ts` 신설 (`USER_DISPLAY_SELECT` 상수) | developer | 신규 1 | 결정 3 |
| A | 3 | tester (단위 — null/nickname-only/name-only/both 조합) | tester | — | A1·A2 |
| **B** | 4 | teams/[id] 3 파일 + tournaments/[id]/join + _site/teams 헬퍼+select 적용 | developer | 5 수정 | A 통과 |
| B | 5 | tester (시각 — /teams/[id] 로스터 + 토너먼트 사이트) + reviewer (병렬) | tester+reviewer | — | B1 |
| **C** | 6 | live API + awards (raw SQL 4 블록) + scoreboard 헬퍼 적용 | developer | 4 수정 | B 통과 |
| C | 7 | tester (시각 — /live/[id] + /awards) | tester | — | C1 |
| **D** | 8 | Flutter v1 API 5 파일 헬퍼 적용 (응답 키 무변경, 값만 변경) | developer | 5 수정 | C 통과 |
| D | 9 | tester (curl — full-data + player-stats 응답 점검) | tester | — | D1 |
| **E** | 10 | tournament-admin players 라벨 변경 (결정 5) + public-teams + 잔여 grep | developer | 3 수정 | D 통과 |
| E | 11 | knowledge 갱신 (architecture +1 / decisions +1 / conventions 신규 패턴) | pm | — | E1 |

- 신규 파일: **2** (헬퍼 + select preset)
- 수정 파일: **17** (B 5 + C 4 + D 5 + E 3)
- 삭제 파일: **0**
- API/DB schema: **0** 변경 (User.name nullable 그대로, select만 보강)
- 위험: D Phase의 Flutter API 응답 값 변경 시 **앱 호환 사전 확인** (현재 nickname이 표시되던 게 name으로 바뀜 — 닉네임 의존 UI 있는지 앱 측 확인)

⚠️ developer 주의사항:
- 헬퍼는 `BigInt` 직렬화 의존 X (raw SQL bigint 결과도 처리 가능하게 `unknown` cast 허용)
- raw SQL (awards.tsx 4 블록) 의 `r.nickname || r.name` → 헬퍼 호출 시 `getDisplayName({ nickname: r.nickname, name: r.name })` 형태로 객체 wrapping 필요
- select preset 적용 시 기존 `select: { nickname: true }` 만 있던 곳에 `name` 추가하면 **Flutter API 응답 schema 무변경** (이미 user_name 으로 가공된 응답이라 raw user 객체 노출 X)
- placeholder User 패턴: `nickname=null, name=실명` → 결정 B 채택 시 자연스럽게 실명 표시
- 짧은 닉네임 사용자 (w/MW/ys 등): 결정 B 채택 시 본인 User.name 입력해야 실명 표시 → 백필 큐 분리

🔗 후속 큐 (사용자 결정 후 별도 처리):
- **User.name 백필 일괄 점검**: 자동 매칭 9명 + 활성 가입자 중 name=null 카운트 → 본인 입력 유도 또는 운영자 수동 보강
- **Flutter 앱 호환 사전 확인**: D Phase 진행 전 모바일팀에 "user_name 응답 값이 닉네임에서 실명으로 바뀝니다" 공지
- **TournamentTeamPlayer.player_name 자동 동기화**: User.name 변경 시 같은 user의 미래 대회 player_name 도 갱신할지 결정 (현재 분리 보존)

🔍 자체 검수 (06-self-checklist 사전):
- AppNav 7 룰 — 변경 0 ✅
- 더보기 9 탭 — 변경 0 ✅
- 토큰만 — 헬퍼는 텍스트만, CSS 0 ✅
- 시안 우선 카피 — UI 라벨 변경 1건 (결정 5 채택 시) ✅
- API/DB schema 0 변경 ✅ (응답 값만 변경)

### 구현 기록 (developer) — Phase A 선수명단 실명 표시 인프라 (2026-05-01)

📝 신규 2 파일 (영향 0, 기존 코드 미변경):

| 파일 | 줄 수 | 역할 |
|------|-------|------|
| `src/lib/utils/player-display-name.ts` | 50 | `getDisplayName(user, ttp?)` + `getSecondaryNickname(user)` |
| `src/lib/db/select-presets.ts` | 31 | `USER_DISPLAY_SELECT = { name: true, nickname: true }` 상수 |

검수:
- `npx tsc --noEmit` 통과 (출력 0)
- git status — 신규 2 파일만 `??` (다른 파일은 이전 세션 작업분 무관)
- 헬퍼 fallback 체인: `User.name → User.nickname → TTP.player_name → '#{jersey}' → '선수'` (빈 문자열 보장 X)
- `getSecondaryNickname` — name + nickname 모두 있고 다를 때만 반환 (Hybrid 표기 옵션 대비)

💡 tester 참고:
- 단위 테스트 (수동): null/nickname-only/name-only/both/jersey-only 5조합
- 정상 동작:
  - `getDisplayName({ name: '홍길동', nickname: 'hong' })` → '홍길동'
  - `getDisplayName({ name: null, nickname: 'hong' })` → 'hong'
  - `getDisplayName({ name: null, nickname: null }, { player_name: '김선수', jerseyNumber: 7 })` → '김선수'
  - `getDisplayName({ name: '  ', nickname: '  ' }, { player_name: null, jerseyNumber: 23 })` → '#23'
  - `getDisplayName(null, null)` → '선수'
  - `getSecondaryNickname({ name: '홍길동', nickname: 'hong' })` → 'hong'
  - `getSecondaryNickname({ name: '홍길동', nickname: '홍길동' })` → null (동일 시 비노출)

⚠️ reviewer 참고:
- 헬퍼는 raw SQL bigint 결과도 처리 가능 (객체 wrapping 만 하면 됨)
- `USER_DISPLAY_SELECT` 는 `as const` 로 Prisma select 타입 추론 보장
- 다음 Phase B (teams/[id] 5 파일) 진행 시 import 패턴: `import { getDisplayName } from '@/lib/utils/player-display-name'` + `import { USER_DISPLAY_SELECT } from '@/lib/db/select-presets'`

### D-1~D-8 + Q1~Q4 진행 결과

| 단계 | 결과 |
|------|------|
| **D-1~D-8** 마이페이지 8/8 | ✅ 완료 (D-1/D-3/D-6 박제 + 5건 변경 0) |
| **ProfileShell 폐기 + cleanup** | ✅ push (6e81996 + 8d0f1f2) |
| **organizations status fix** | ✅ push (08898cb + 5e21130 — Cowork 다른 세션) |
| **Q1** Reviews + ContextReviews | ✅ Hybrid 박제 (옵션 A/B/C 채택) — commit 대기 |
| **Q2** VenueDetail | ✅ 변경 0 (운영 우위) |
| **Q3** GameEdit | ✅ 변경 0 (운영 우위) |
| **Q4** PostEdit | ✅ 변경 0 (운영 우위) |

### 추후 큐 (사용자 결정 받은 것 / 보류)

- **다음 큐**: Settings + BottomNavEditor (큰 구조 변경, 결정 4건 필요) / LiveResult (/games/[id] 흡수 검토) / HelpGlossary (옵션 C 보류 유지 가능)

### 구현 기록 (developer) — Settings 7섹션 + BottomNav 박제 (commit 3111e25)

> 신규 6 / 수정 6 / 삭제 2 = 18 파일 (CLAUDE.md + 02-design-system-tokens.md + scratchpad 포함). Phase A 12 + Phase B 3. 자체 검수 13 룰 모두 통과. tsc EXIT=0. 9999px 코드 0건. 후속 큐 3건 (BottomNav 카탈로그 라우트 가드 / billing·danger #fff 토큰화 / bottom-nav.css rgba 그림자). 상세는 commit message 참조.

### 검증 결과 (tester + reviewer 병렬, 2026-05-01)

> 정적 10/10 PASS + 사용자 결정 7/7 정합 + 13 룰 모두 통과 + 코드 품질 11항목 PASS. 동작 검증은 dev 서버 미가동으로 SKIP. **commit 3111e25 진행 완료**. 후속 큐 3건은 위 §기획설계 요약에 포함.

## 진행 현황표

| 영역 | 작업 | 상태 |
|------|------|------|
| Dev/design/ 단일 폴더 룰 | _archive/ + BDR-current/ + 보존 3 파일 | ✅ |
| 디자인 시안 박제 | 38% (40+/117) — D-1~D-8 + Q1~Q4 | ⏳ |
| Phase 10 운영 DB | 4 테이블 적용 | ✅ |
| Phase 12 (시즌 통계 + Portone) | schema/SQL/API/UI 4단계 | ✅ |
| 헤더 구조 정리 | 더보기 가짜 4건 제거 + Phase 19 쪽지 | ✅ |
| ProfileShell 폐기 + cleanup | /profile/* sidebar 0 + 컴포넌트 삭제 | ✅ |
| 마이페이지 영역 박제 | D-1~D-8 8/8 | ✅ |
| Reviews 통합 | 4탭 → 1탭 + ContextReviews 신규 (Q1) | ✅ |

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 | 결과 |
|------|------|------|------|
| 2026-05-01 | (긴급, 커밋 예정) | **profile PATCH 500 'Internal error' 영구 해결 — birth_date Invalid Date 이중 가드**: 운영 mybdr.kr/profile/edit 저장 500. 진단 = 로컬 tsx (`scripts/_temp/diagnose-profile-save.ts`) 로 운영 DB 직접 호출 단계별 재현 → Test E (Invalid Date) 만 실패 → 원인 확정 (Vercel 로그 우회 1분). 수정 = (1) `route.ts:111-122` birth_date 파싱 분리 + isNaN 가드 → `apiError("생년월일 형식이 올바르지 않습니다.", 400)` (2) `profile/edit/page.tsx:370-374` payload 구성 시 동일 isNaN 체크 → null 송출 (UX). tsc EXIT=0. errors.md / lessons.md / index.md 박제. 회귀 방지 룰 신설 (`new Date(externalString)` 항상 isNaN 가드). 부수 발견 별건: 사용자 (id=2836) `position` 컬럼 `"PG,SG,SF"` multi vs 시안 단일 폼 — 데이터 손실 위험. | ✅ fix |
| 2026-05-01 | 3111e25 (미푸시) | **Settings 7섹션 + BottomNav 풀 도입 박제 (Phase A+B 통합 commit)**: 신규 6 / 수정 6 / 삭제 2 = 18 파일. 사용자 결정 7건 (A1-DB-direct/B3-fallback/C3/D2/Q1=①/Q2=전체/Q3=빼기) 정합. tester+reviewer 병렬 PASS. tsc EXIT=0 / 9999px 0 / API·DB 변경 0. | ✅ commit |
| 2026-05-01 | (Phase A 완료, 미커밋) | **선수명단 실명 표시 Phase A 인프라 신설**: 신규 2 파일 (`src/lib/utils/player-display-name.ts` 50줄 + `src/lib/db/select-presets.ts` 31줄). `getDisplayName(user, ttp?)` 헬퍼 + `getSecondaryNickname(user)` 보조 라인 + `USER_DISPLAY_SELECT` 상수. tsc 통과 + git status 신규 2만. 영향 0 (기존 코드 미변경). 다음: Phase B (teams/[id] 5 파일 헬퍼+select 적용) — 사용자 승인 후 진행. | ✅ Phase A |
| 2026-05-01 | (계획만) | **선수명단 실명 표시 규칙 — 결정 5건 확정**: planner 분석 (17개소 grep + 8 패턴 혼재) → 사용자 결정 5건 모두 추천 채택 (B/lib유틸/Y상수/순차/라벨변경). 추가 정책: 본인인증 작동 시 실명·전화 라벨 폐기 + 자동입력 전환. 신규 2 + 수정 17 + DB schema 0. | ⏳ Phase B~E |
| 2026-05-01 | (DB only) | **TeamMember.jerseyNumber 동기화 31명 (사용자 보고 대응)**: /teams/[id] 로스터에 백번이 "—" 표시 → 31명 (크로스오버 18 + 피벗 13) 의 TeamMember.jerseyNumber 를 TournamentTeamPlayer.jerseyNumber 로 일괄 UPDATE. 트랜잭션 패턴: 각 user 마다 (a) 같은 팀 같은 번호 다른 멤버 → null 양보 (b) 본인 jerseyNumber UPDATE. 충돌 양보 0건 (기존 활성 멤버 모두 jersey=null 이었음). 결과: 크로스오버 20명/jersey 18 (W/종훈 미등록 = null 유지) / 피벗 17명/jersey 13 (ian/찬식/MW/ys 미등록 = null 유지). | ✅ |
| 2026-05-01 | (DB only) | **placeholder User 22명 생성 + TeamMember + TTP userId 연결 (D 옵션 진행)**: 사용자 정책 명확화 — TournamentTeamPlayer = TeamMember 체크한 멤버, User 계정 필수. 패턴: email=`placeholder-{teamId}-{jersey}@bdr.placeholder` + provider="placeholder" + status="placeholder" + nickname=null (DB drift 회피) + name=원본. 트랜잭션: User × 22 + TeamMember × 22 + TTP.userId UPDATE × 22 + Team.members_count increment. 후속 큐 3건 추가. | ✅ |
| 2026-05-01 | (DB only) | **피벗 팀 선수 13명 등록 + B 대회 16팀 디비전/결제 일괄 처리**: (1) 피벗 (TT id=245, Team id=225) 13명 INSERT, 자동 매칭 **8/13** (강동진/김명석/전인규/천호현/김수성/고상모/김도연/박성진 → userId 연결, 피벗 Team 활성 12명 풍부). (2) B 대회 categories 단일 디비전 ("일반부": ["D3"]) 확인 → 16팀 모두 division="D3" UPDATE → /tournaments/[id] page.tsx groupBy 카운트 0→16. (3) 16팀 모두 payment_status="paid" + paid_at=now UPDATE. | ✅ |
| 2026-05-01 | (DB only) | **크로스오버 팀 선수 18명 일괄 등록 + 자동 매칭 (예시 진행)**: B 대회 TournamentTeam id=242 (크로스오버 Team id=228) 에 18명 INSERT. 운영 패턴 정합 (`POST /api/web/tournaments/[id]/teams/[teamId]/players`): player_name + jerseyNumber + role="player" + is_active=true. 자동 매칭 = `linkPlayersToUsers` 인라인 (같은 Team 활성 TeamMember 중 nickname/name === player_name 정확 일치 + 1명만 매칭, 동명이인 안전). 결과: **18 등록 / 1 자동 매칭** (성윤호 → userId=3110). 크로스오버 Team 활성 멤버 3명뿐 → 17명은 미가입/팀 미등록 → userId=null 보존. | ✅ |
| 2026-05-01 | (DB only) | **동호회최강전 B 참가팀 16팀 일괄 등록**: 사진 추출 16팀 모두 기존 Team 매칭 (id=233/232/231/230/229/228/227/226/225/224/223/222/221/220/218/196). false positive 4건 정리 (BDR✗→DR BASKET / DYNAMIC✗→MI / DASAN·MSA✗→SA / merged✗→196). 트랜잭션 INSERT 16건 + teams_count 0→16 (maxTeams 풀 채움). | ✅ |
| 2026-05-01 | 5e21130 (push) | **docs(knowledge) organizations status fix 기록 (Cowork 다른 세션)**: errors.md +1 / lessons.md / index.md 갱신 | ✅ |
| 2026-05-01 | 08898cb (push) | **fix(organizations) status 'active' → 'approved' (Cowork 다른 세션)**: page.tsx 1줄 fix. DB 동호회최강전 중복 2건 정리. | ✅ |
<!-- 05-01 일부 절단 (7883ed3 D-3/8 + 85944e3 D-1 + 22ce7f2 P0 hub + cef0a2b DEV 머지 + 6e81996 ProfileShell + c3676ed D-6 + 8d0f1f2 cleanup 절단 — Phase B BottomNav 신규 추가로 인한 정리) -->
