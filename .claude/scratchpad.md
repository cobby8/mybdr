# 작업 스크래치패드

## ⚠️ 세션 분리 원칙 (2026-04-22)
- **일반 모드**: mybdr 본 프로젝트 작업 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 쇼핑몰 작업 (`scratchpad-cafe-sync.md` 별도)

---

## 🚀 다음 세션 진입점 (2026-05-02 종료 시점 기준)

### 우선순위 1 — 5/2 동호회최강전 현장 피드백 대응
- D-day 셋업 완료 (DB 16팀 + 듀얼토너먼트 27경기 + Phase A~E 풀 시스템). 현장에서 발견되는 문제는 즉시 디버깅 프롬프트로 처리.
- 디버그 패턴: `Dev/cli-prompts/2026-05-01-profile-save-500-{debug|direct-diagnose|fix}.md` 3단계 카피.

### 🔴 대회 종료 후 즉시 처리 큐 (5/2 23:59 이후)

**1) 셋업팀 가입 대기 17명 정리** — ✅ 완료 (8 approved + 9 rejected, pending=0)

**2) 셋업팀 ttp user 매핑** — ✅ 6명 매핑 완료, 3명 잔여
- ✅ 매핑 완료: 곽규현(#1→3286) / 정세훈(#2→3032) / 임태웅(#12→3026) / 백주익(#15→2866 hifabric, name 매칭) / 백배흠(#17→2868 BB, name 매칭) / **김영훈(#94→2853 통합, 5/2 23:10)**
- ❌ 잔여 3명 (시스템 user 검색 0건):
  - #11 김병주 (userId null, 2점)
  - #7 이영기 (placeholder uid 2955, 0점)
  - #0 이준호 (placeholder uid 2957, 0점)
- 매치 #133 통계 매칭률: 39/49 = **80%** → **96%** (김영훈 통합 후)

**3) 셋업팀 placeholder user 5명 + team_members row 정리** (별건)
- 백주익(2953)/백배흠(2956): ttp 연결 끊김 → team_members row 잔존, 정리 대상
- 김영훈(2954)/이영기(2955)/이준호(2957): ttp 그대로 참조, 매핑 후 정리

**4) mergeTempMember 함수 강화** (별건) — name 매칭 추가
- 현재 nickname 만. 백주익(nick=hifabric, name=백주익) 케이스 자동 매칭 0건 발견
- name 도 매칭 후보로 추가 시 비슷한 케이스 자동 처리

**5) 16팀 중 잔여 8팀 `tournament_team_players` 0명 보정** (5/2 PM 큐)
- MZ / 블랙라벨 / 다이나믹 / MI / 슬로우 / 우아한스포츠 / MSA / SKD
- 셋업팀 패턴 (`scripts/_temp/sync-setup-tournament-players-2026-05-02.ts` git log 복원) 일괄 적용 가능 — placeholder/real user 정체 사전 점검 필수

### 우선순위 2 — 결정 대기 큐 (사용자 판단 받고 구현 진행)
| 영역 | 결정 건수 | 산출물 위치 |
|------|---------|------------|
| **관리자페이지 UI 개선** | 6건 (Phase A 모바일 가드 1순위) | `git log -- .claude/scratchpad.md` 에서 "관리자페이지 UI 개선 분석" 검색 |
| **Games 박제 잔여** | 결정 6건 중 1·2·3·4·5·6 모두 받음 → Phase B+C 완료. **Phase A (dead code 정리) 별도 commit 큐만 남음** | commit `f4b55c2` 직전 분석 |
| **Phase F2 wrapper 연결** | 박제만 된 `v2-dual-bracket-sections.tsx` 를 `v2-bracket-wrapper.tsx isDual` 분기에 mount + Stage 3·5 BracketView 분기 | commit `2dc9af8` |
| **Teams Phase A** | dead code 5 파일 삭제 별도 commit | commit `dfe5eb5` 직전 |

### 우선순위 3 — 인프라 잔여
- 카카오맵 SDK Places 통합 (선수카드 옵션 D)
- 미매칭 placeholder 73명 통합 (가입 hook + linkPlayersToUsers 이름 매칭)
- PortOne 본인인증 페이지 신설 (계약 완료 후)
- Tournament.status 'published' 잔재 cleanup
- 대회 로컬룰 옵션 (settings.localRules)

---

## 🚧 추후 구현 목록 (DB/API 확장 필요 — 영구 큐)
- 슛존 성공률 (heatmap) / 스카우팅 리포트 / 시즌 통계 / VS 비교
- 커뮤니티 댓글 답글·좋아요 / 게시글 북마크 / waitlist / no-show / QR 티켓
- AppNav 쪽지 unread count 뱃지 (messages unread API)
- D-6 EditProfile §2·§3·§4 (사용손/실력/공개 7항목 + instagram·youtube 컬럼 추가 시)
- D-3 §02 Highlight (MatchPlayerStat 평점) / §05 다음 주 추천 (추천 엔진)
- ComingSoonBadge 공통 컴포넌트 격상
- Q1 후속: `_components/` 11 파일 + `courts/[id]` 19건 옛 토큰 마이그 / ContextReviews series·player kind / `/reviews?courtId=` deep-link
- 대회 가입 hook 자동 매칭 (`linkPlayersToUsers` 호출) / `linkPlayersToUsers` placeholder 필터 (provider != "placeholder")
- 공개 페이지 placeholder 노출 점검 (랭킹/프로필/팀 멤버 카운트)
- 본인인증 활성화 시 실명·전화 자동입력 전환 + 필수 라벨 폐기
- organizations 단체 생성 → 목록 노출 e2e 스모크

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| Dev/design/ 단일 폴더 룰 | ✅ |
| 디자인 시안 박제 | ⏳ 38% (40+/117) |
| Phase 10·12 운영 DB | ✅ |
| 헤더 구조 정리 (Phase 19 쪽지) | ✅ |
| ProfileShell 폐기 | ✅ |
| 마이페이지 영역 (D-1~D-8) | ✅ 8/8 |
| Reviews 통합 (Q1) | ✅ |
| **듀얼토너먼트 풀 시스템** | ✅ A·B·C·D·E (Phase F 공개 시각화 ⏳ F2 박제만) |
| **5/2 동호회최강전 D-day 셋업** | ✅ DB 16팀 + 27경기 + Phase A~E + 통합 5쌍 |
| Live `/live/[id]` v2 박스스코어+프린트 | ✅ 풀 복원 |
| Teams 박제 Phase B+C+D | ✅ (Phase A dead code 잔여) |
| Games 박제 Phase B+C | ✅ (결정 6건 모두 처리, 잔여 큐 Phase A) |

---

## 기획설계 (planner-architect) — Phase F2 조별 미니 더블엘리미 시각화

**작업 일시**: 2026-05-02 D-day 현장
**대상**: 듀얼토너먼트 (id=`138b22d8…`) 대진표 페이지 — 16강 조별 영역 미시각화

### 현재 구조 (BracketView / Wrapper)

`v2-bracket-wrapper.tsx` 는 이미 `isDual` 분기를 보유 (line 206 / 335):
- `format === "dual_tournament"` 일 때 `<V2DualBracketView rounds={rounds} tournamentId={...} />` 렌더 (line 337).
- `V2DualBracketView` 는 현재 **2개 섹션만 표시**:
  1. `GroupCompositionCard` — 4조 × 4팀 명단 (조편성 — 경기 정보 X)
  2. 8강·4강·결승 SVG V자 트리 (`buildKnockoutRounds` + `BracketView` 재사용, NBA 크로스 정합)
- **빠진 영역**: 조별 G1/G2/G3 승자전/G4 패자전/최종전 (round 1·2·3 = 20경기) — 매치 단위 카드 시각화 없음. 사용자 결정으로 "조편성만" 보였으나, 현장에서 "조별 진행 상황 어디서 보냐" 피드백 유효.
- API (`public-bracket/route.ts`): `rounds` 가 round_number 1~6 모든 매치 포함 (`buildRoundGroups`) — 추가 fetch 0.

### 박제 컴포넌트 분석 (`v2-dual-bracket-sections.tsx`, 374줄)

- **현재 import 0건** — 어디서도 mount 안 됨 (commit 2dc9af8 박제만).
- **Props**: `{ matches: BracketMatch[] }` — 27 매치 모두 받고 자체 필터.
- **렌더**: 두 섹션 sticky 헤더 (Stage 1 / Stage 2)
  - `DualGroupedGrid` (Stage 1 — round 1·2): A/B/C/D 4조 × 4매치 카드 (G1·G2·승자전·패자전), 데스크톱 2열 / 모바일 1열
  - `DualFinalsGrid` (Stage 2 — round 3): 조별 최종전 4매치, lg 4열 / sm 2열 / 모바일 1열
  - `DualMatchCard`: 매치번호 + 라운드명 + 조뱃지(Stage2만) + LIVE 배지 + 일정 + HOME/AWAY 행 (팀명 link / 빈슬롯 italic / 점수)
- **시안 정합 OK**: var(--*) 토큰 / lucide-react 0 / 9999px 0 (LIVE 만 rounded-full — 정사각형 아님이지만 작은 배지로 허용 범위). italic muted 빈 슬롯 / "—" 미진행 점수.
- **단, `BracketMatch` 의 round_number 매핑 의존**: STAGE_1.rounds=[1,2] / STAGE_2.rounds=[3] — DB generator (`dual-tournament-generator.ts` line 48 주석) 와 1:1 일치. 안전.

### 연결 위치 결정 — V2DualBracketView 내부 끼워넣기

**옵션 비교** (3안):

| 옵션 | 장점 | 단점 |
|------|------|------|
| A. wrapper 분기 별도 mount | wrapper level 책임 명확 | dual-bracket-view 와 dual-bracket-sections 가 같은 page에 같은 데이터 두 번 렌더 (관심사 중복) |
| **B. V2DualBracketView 안에 끼워넣기** ⭐ | 단일 진입점 / 조편성→경기카드→트리 자연 흐름 / API 변경 0 | dual-bracket-view 파일 길이 +30~50줄 |
| C. BracketView 내부 분기 | 모든 곳에 자동 적용 | 회귀 위험 (single elim/풀리그 영향 가능) |

**채택**: **옵션 B**. `V2DualBracketView` 의 `groupComposition` 섹션 직후, knockoutTree 섹션 직전에 `<V2DualBracketSections matches={allMatches} />` 추가.

### 표시 순서 (사용자 흐름 우선)

```
┌────────────────────────────────────┐
│ 듀얼토너먼트 (27경기) 헤더          │
├────────────────────────────────────┤
│ 1) 조편성 (4조 × 4팀)               │  ← 기존 (참가자 빠른 조회)
├────────────────────────────────────┤
│ 2) Stage 1 — 조별 미니 더블엘리미   │  ← 신규 (조별 진행 카드)
│    A조 | B조  (md+ 2열)             │
│    C조 | D조                        │
├────────────────────────────────────┤
│ 3) Stage 2 — 조별 최종전 (2위)      │  ← 신규 (4매치 그리드)
│    A·B·C·D 4매치                    │
├────────────────────────────────────┤
│ 4) 8강·4강·결승 SVG V자 트리        │  ← 기존 (NBA 크로스)
└────────────────────────────────────┘
```

### 변경 파일 (1 파일만)

| 파일 | 변경 | 추정 라인 |
|------|------|---------|
| `src/app/(web)/tournaments/[id]/_components/v2-dual-bracket-view.tsx` | import + 섹션 1줄 추가 | +5줄 |

API 변경 0 / 신규 파일 0 / DB 변경 0.

### 구현 계획 (실행 단계)

| 순서 | 작업 | 담당 | 선행 조건 | 시간 |
|------|------|------|---------|------|
| 1 | wrapper view 에 `V2DualBracketSections` import + mount | developer | 사용자 승인 | 5분 |
| 2 | `npm run typecheck` (또는 `npx tsc --noEmit`) | tester | 1단계 | 1분 |
| 3 | 로컬 `/tournaments/[id]` 대진표 탭 — A/B/C/D 4조 카드 + 최종전 4매치 시각 검증 (현장 매치 #133 LIVE 표시 / 진행 매치 점수 노출 / 빈 슬롯 italic) | tester | 2단계 | 3분 |
| 4 | git commit `feat(tournaments/[id]): 듀얼 조별 16강 영역 시각화 활성화` | PM | 3단계 | 1분 |

**총 예상 시간**: ~10분 (소규모 — 박제 그대로 활용).

### 위험 / 주의 (회귀 영향 0)

- `isDual === false` 케이스 영향 0 — 변경 위치는 `V2DualBracketView` 내부, 다른 포맷은 분기에 진입조차 안 함.
- 현장 진행 중 매치 (#133/134/135 등): `match.status === "in_progress"` 카드 — LIVE 배지 + 빨간 테두리 + 점수 정상 표시 (박제 컴포넌트 line 215 / 264).
- "─" 미진행 점수 / italic 빈 슬롯 — 사용자 결정 #3·#4 그대로.
- **모바일 분기**: Stage 1 = 1열 (md+ 2열) / Stage 2 = 1열 (sm+ 2열, lg+ 4열). 720px 분기 정합. 가로 스크롤 0 (조별 카드 세로 stack).
- **13 룰 검증**:
  - var(--*) 토큰 ✅ / lucide-react ❌ ✅ / 9999px (rounded-full) — LIVE 배지 작은 텍스트 라벨 (예외 허용 범위, admin DualMatchCard 와 동일) / iOS input 16px (input 없음 — 무관) / placeholder 5단어 — text 만 (무관).
- **타입 호환 확인**: `V2DualBracketView` 의 `allMatches: BracketMatch[]` ↔ `V2DualBracketSections` 의 `matches: BracketMatch[]` — 동일 타입.

### developer 주의사항

1. import 위치: `v2-dual-bracket-view.tsx` 의 `BracketView` import 옆에 `V2DualBracketSections` 추가.
2. mount 위치: `{hasGroupComposition && <GroupCompositionCard ... />}` 직후, `{hasKnockoutTree && <Card ...>` 직전.
3. 조건부 렌더: `allMatches.length > 0` (조별 매치 존재) 가드는 박제 컴포넌트가 자체 처리 (빈 배열 → 빈 grid). 추가 가드 불필요.
4. **수정 금지 범위**: 박제 `v2-dual-bracket-sections.tsx` 의 코드 (사용자 결정 8 영역 보존 — italic muted / "—" / sticky header).
5. commit 메시지: `feat(tournaments/[id]): 듀얼 조별 16강 영역 시각화 활성화 (박제 컴포넌트 wrapper 연결)`

---

## 기획설계 — Admin-Web 시각 통합 (2026-05-02 v2)

**작업 일시**: 2026-05-02 (대회 후 큐). PM 의뢰 = "다크모드 강제 해제 + (web)와 라이트/다크 시각 일관성 100%" / 코드 수정 0, 계획만.

### 1. 통합 원칙 (사용자 요구 반영)

| # | 원칙 | 사유 |
|---|------|------|
| 1 | **다크모드 강제 ❌** — 사용자 토글 그대로 (`<html data-theme=...>` 그대로) | 사용자 명시 요구 |
| 2 | **라이트/다크 모두 (web) 토큰 직접 참조** (`var(--bg)/--bg-elev/--bg-card/--bg-alt/--bg-head/--ink/--ink-soft/--ink-mute/--ink-dim/--accent/--cafe-blue/--border/--border-strong/--ok/--warn/--danger/--info`) | (web) 글로벌 클래스가 같은 토큰 직접 사용 → 100% 일관 |
| 3 | **(web) 글로벌 클래스 우선** (`.btn .btn--primary .btn--accent .btn--ghost .btn--sm/.btn--lg / .input .textarea .select / .card / .badge .badge--red/--blue/--ok/--warn/--soft / .eyebrow / .board / .data-table`) | 인라인 스타일 → 글로벌 클래스 교체로 시각 통일 + 코드 행수 감소 |
| 4 | **API/데이터 변경 0** | CLAUDE.md 리디자인 원칙 |
| 5 | **(web) 페이지 영향 0** (admin 만 손댄다) | globals.css 보강은 alias 추가만 — 충돌 0 검증 후 |
| 6 | **13 룰 정합** (var(--*) 토큰만 / 핑크·살몬·코랄 ❌ / lucide ❌ / pill 9999px ❌ — 정사각형 원형 50% 만 허용 / iOS input 16px / 720px 분기) | 디자인 13 룰 (CLAUDE.md §🎨) |
| 7 | **라이트모드 BDR Red 강제 ❌** — 라이트 = `var(--accent)`(BDR Red) + `var(--cafe-blue)` 공존 (web 정책) | (web) 라이트 시안이 cafe-blue + accent 듀얼톤 — admin 만 BDR Red 단일톤 강제 시 web 과 갭 |

---

### 2. (web) vs (admin) 핵심 갭

#### 2-1. 토큰 어휘 — 가장 큰 차이 (origin)

| 영역 | (web) 사용 토큰 | (admin) 현재 사용 토큰 | 정의 상태 (globals.css) | 통합 방향 |
|------|---------------|---------------------|------------------------|---------|
| 배경 (page) | `var(--bg)` | `var(--color-background)` | ✅ alias 정의 (L2309/2327) | alias 유지 OK |
| 배경 (card/elev) | `var(--bg-elev)`, `var(--bg-card)` | `var(--color-surface)`, `var(--color-card)`, `var(--color-elevated)` | ✅ alias 정의 | alias 유지 OK |
| 배경 (alt/head) | `var(--bg-alt)`, `var(--bg-head)` | (admin 미사용) | — | admin 사이드바/탭 트레이에 도입 |
| 텍스트 | `var(--ink)`/`--ink-soft`/`--ink-mute`/`--ink-dim` | `var(--color-text-primary)`/`-secondary)`/`-muted)` | ✅ alias 정의 | alias 유지 OK (4번째 `--color-text-dim` 누락 — 추가 필요) |
| 보더 | `var(--border)`/`--border-strong`/`--border-hard` | `var(--color-border)`, `var(--color-border-subtle)` | `--color-border` ✅ / `--color-border-subtle` ❌ **미정의** | **alias 추가 필요** (`--color-border-subtle: var(--border)` 또는 `mix`) |
| 액센트 (BDR Red) | `var(--accent)` (= `var(--bdr-red)`) | `var(--color-accent)`, `var(--color-primary)` | `--color-primary` ✅ / `--color-accent` ❌ **미정의** | **alias 추가 필요** (`--color-accent: var(--accent)`) |
| 액센트 hover/light | (없음 — 직접 `var(--bdr-red-ink)` / `--bdr-red-hot`) | `var(--color-accent-hover)`, `var(--color-accent-light)` | ❌ **둘 다 미정의** | **alias 추가** (`--color-accent-hover: var(--bdr-red-ink)` / `--color-accent-light: var(--accent-soft)`) |
| 카페블루 | `var(--cafe-blue)`/`--cafe-blue-deep`/`--cafe-blue-soft` | (admin 미사용) | `--cafe-blue` ✅ | admin 페이지네이션/info 강조에 도입 가능 (옵션) |
| Status (성공) | `var(--ok)` | `var(--color-success)` | ❌ **미정의** | **alias 추가** (`--color-success: var(--ok)`) |
| Status (경고) | `var(--warn)` | `var(--color-warning)` | ❌ **미정의** | **alias 추가** (`--color-warning: var(--warn)`) |
| Status (위험) | `var(--danger)` | `var(--color-error)` | ❌ **미정의** | **alias 추가** (`--color-error: var(--danger)`) |
| Info | `var(--info)` | `var(--color-info)` | ✅ alias 정의 (L2318) | OK |
| 그림자 | `var(--sh-xs)`/`--sh-sm)`/`--sh-md)`/`--sh-lg)` | `var(--shadow-card)` | ❌ **미정의** | **alias 추가** (`--shadow-card: var(--sh-sm)`) |
| 라운드 (card) | `var(--radius-card)` (라이트 10px / 다크 0px) | `rounded-[10px]` `[12px]` `[14px]` `[8px]` 인라인 px | — | 인라인 px → `var(--radius-card)` 또는 `var(--radius-chip)` (6px / 다크 2px) |
| 라운드 (chip) | `var(--radius-chip)` (라이트 6px / 다크 2px) | `rounded-md` `rounded-lg` `rounded-sm` `rounded-full` 혼재 | — | `rounded-full` 22건 → 정사각형(W=H)만 50% 유지, 그 외 chip/4px |
| 폰트 (body/display) | `var(--ff-body)` / `var(--ff-display)` | (web) 동일 | ✅ | OK (헤더는 이미 적용됨 Phase E) |
| Type scale | `var(--fs-h1)`/`--fs-h2)`/`--fs-h3)`/`--fs-body)`/`--fs-small)`/`--fs-micro)` | 인라인 `text-[22px]` `text-sm` `text-xs` 등 | ✅ 정의 | 큰 차이는 없으나 admin 헤더 h1 = `var(--fs-h1)` 권장 (라이트 28 / 다크 36) |

**핵심 결론**: admin이 사용하는 `--color-accent` `--color-error` `--color-warning` `--color-success` `--color-on-text-primary` `--color-border-subtle` `--shadow-card` `--color-accent-hover` `--color-accent-light` 9개 변수가 globals.css 에 **alias 정의 누락**. 현재 admin은 이 변수들이 빈 값(invalid CSS)으로 그려져 색상 미적용 또는 부모 색상 상속 → (web) 와 시각 갭의 가장 큰 원인.

#### 2-2. 폰트 색상

| 용도 | (web) 변수 | (admin) 사용 | 갭 | 통합 |
|------|-----------|-------------|----|------|
| 본문 (제목/본문) | `var(--ink)` | `var(--color-text-primary)` (alias = ink) | 0 | alias 유지 |
| 부제 / soft | `var(--ink-soft)` | `var(--color-text-secondary)` (alias = ink-soft) | 0 | alias 유지 |
| 뮤트 (라벨) | `var(--ink-mute)` | `var(--color-text-muted)` (alias = ink-mute) | 0 | alias 유지 |
| dim (날짜/메타) | `var(--ink-dim)` | (admin은 muted 로 통일) | 약간의 디테일 부족 | alias 신설 권장 (`--color-text-dim: var(--ink-dim)`) |
| 링크 | `var(--link)` | (admin은 사용 0 — 직접 색상 0) | — | admin 링크 사용처 거의 없음 (Next Link 텍스트색 inherit) — 무영향 |

#### 2-3. 버튼

| 종류 | (web) 글로벌 정의 | (admin) 현재 사용 | 갭 | 통합 |
|------|-----------------|-----------------|----|------|
| 주요 액션 (라이트=cafe-blue / 다크=bdr-red) | `.btn.btn--primary` | (admin) `bg-[var(--color-accent)]` 직접 (다크/라이트 무관 BDR Red 강제) | 라이트모드 갭 — admin은 라이트도 빨강 강제 (사용자 보고 = 검색 버튼이 카페블루 = 의도된 web 패턴) | admin 의 `var(--color-accent)` 직접 사용 → `.btn.btn--primary` 글로벌 클래스 교체. 라이트모드는 자동 cafe-blue / 다크는 자동 BDR Red |
| 강조 액션 (BDR 강조 양쪽) | `.btn.btn--accent` | 동일 (admin 다수 — `bg-[var(--color-accent)]`) | 거의 동일 — admin BDR 강조 의도시 | 의미 분리: "create/save 등 메인 = primary" / "danger·강조 = accent" — Phase 2 결정 시 |
| 보조 (ghost) | `.btn.btn--ghost` | `border border-[var(--color-border)] text-[var(--color-text-muted)]` 인라인 | 시각 톤 비슷, 코드 길이 ↑ | 인라인 → `.btn.btn--ghost` |
| Small 변형 | `.btn--sm` (`6px 10px / 12px`) | `text-xs` + `px-2 py-1` 등 인라인 | 비슷 | `.btn--sm` |
| 상태 토글 (success/warning) | (web) 미정의 — `var(--ok)/--warn` 직접 | `bg-[var(--color-warning)]/10 text-[var(--color-warning)]` 등 | alias 누락 → 색 미적용 | alias 추가만으로 즉시 시각 정상화 (코드 변경 0 가능) |
| 위험 (delete) | (web) 사용 적음 — `var(--danger)` 직접 + `.badge--red` 일부 | `bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]` | alias 누락 + 톤 약간 다름 | alias 추가 + 향후 `.btn.btn--danger` 글로벌 신설 검토 |

#### 2-4. 테이블 / 리스트

| 패턴 | (web) | (admin) 현재 | 통합 방향 |
|------|------|-------------|---------|
| 데스크톱 표 | `.board.data-table` (grid 6열 + cafe-blue-soft 공지행 + ink-mute 라벨) | `<table class="admin-table">` (Phase B 박제 — 라이트는 ink-mute 라벨 + bg-elev 헤더) | 톤 일치 OK ✅ (이미 Phase D 정합 작업 완료 — globals.css L1974~) |
| 모바일 카드 변환 | `.data-table` 자동 (≤720px) | `.admin-table` 자동 (≤720px, [Admin Phase B]) | 둘 다 같은 패턴 ✅ — 이미 정합 |
| 로우 호버 | `.board__row:hover { background: var(--bg-alt) }` | `hover:bg-[var(--color-elevated)]` (=alias bg-alt) | 정합 ✅ |
| 보더 색 | `var(--border)` | `var(--color-border)` / `var(--color-border-subtle)` | border-subtle 정의 누락 — alias 추가 시 정합 |
| 헤더 톤 | 라이트 `--bg-head: #EEF2F7` (블루 톤) / 다크 `#1D232B` | admin은 `bg-[var(--color-surface)]` (= bg-elev = 흰색) | **갭**: web 라이트 헤더는 회청색 / admin 헤더는 흰색 → admin-table thead 도 `var(--bg-head)` 사용 필요 (Phase 1 보강) |

#### 2-5. 카드 / 모달 / 탭 / 입력폼

| 항목 | (web) | (admin) 현재 | 갭 | 통합 |
|-----|------|-------------|----|------|
| 카드 | `.card` (`var(--bg-card)` + `var(--border)` + `var(--radius-card)`) | `<Card>` 컴포넌트 (`var(--color-card)` + `var(--shadow-card)` + `rounded-[var(--radius-card)]`) | shadow-card 정의 누락 → 그림자 0 | alias 추가 (`--shadow-card: var(--sh-sm)`) |
| 카드 padding | (web) 카드별 다름 (대략 16~22px) | `<Card>` 기본 `p-4 sm:p-5` (16/20px) | 정합 ✅ | OK |
| 모달 | (web) 별도 글로벌 X — 페이지별 ad-hoc | `<AdminDetailModal>` 공통 (border-t-4 primary + 모바일 시트 + sm+ 가운데) | (web)에 표준 모달 없음 — admin이 더 세련 | (web) 모달 패턴 차후 admin 패턴으로 정합 (별도 큐) |
| 탭 (status) | (web) `.eyebrow` + 밑줄 패턴 | `<AdminStatusTabs>` (밑줄 + accent — 정합 시도됨) | accent alias 누락 → 활성 탭 색 안 보임 | alias 추가 시 즉시 시각 정상화 |
| 입력폼 | `.input.textarea.select` (`var(--bg-elev)` + `var(--border-strong)` + focus `var(--cafe-blue)` + `var(--cafe-blue-soft)` ring) | `rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)]` 인라인 | radius/focus 톤 다름 + 인라인 코드 행수 ↑ | 인라인 → `.input` 글로벌 (라이트=cafe-blue focus / 다크=BDR Red focus 자동) |
| 사이드바 | (web) AppNav 가로 (글로벌) | admin `<AdminSidebar>` 세로 fixed | 형태 다름 (의도된) | 사이드바 자체는 유지 — 색상 톤만 정합 (지금 `bg-[var(--color-surface)]`=bg-elev 흰색, web AppNav 라이트 utility = cafe-blue) |

---

### 3. 통합 Phase 계획 (코드 충돌 최소 + 단계 commit)

#### Phase 1: alias 보강 — 가장 큰 효과, 가장 적은 위험 ⭐

| 항목 | 변경 |
|------|------|
| 파일 | `src/app/globals.css` 단 1 파일 |
| 위치 | L2307~2341 의 `:root,[data-theme="light"]` + `[data-theme="dark"]` 블록 (이미 alias 레이어 존재) |
| 추가할 alias 9개 | `--color-accent: var(--accent)` / `--color-accent-hover: var(--bdr-red-ink)` / `--color-accent-light: var(--accent-soft)` / `--color-error: var(--danger)` / `--color-warning: var(--warn)` / `--color-success: var(--ok)` / `--color-border-subtle: var(--border)` / `--color-text-dim: var(--ink-dim)` / `--shadow-card: var(--sh-sm)` |
| (web) 영향 | 0 (web은 `var(--accent)` 등 원본 토큰 직접 사용 — alias 신설은 web 무영향) |
| (admin) 효과 | **즉시 시각 정상화** — 빨간 ★ / 위험 영역 위험색 / 검색 버튼 카페블루 정상 / 모달 액센트 보더 / 탭 활성색 / 카드 그림자 / 페이지네이션 활성 색 등 9개 변수 사용처 405건 자동 정합 |
| 위험 | 0 (alias 추가만 — 기존 변수 변경 0) |
| 시간 | 5분 (alias 9줄 × 2 블록 = 18줄 추가) |

**시각 변화 검증 포인트** (라이트·다크 양쪽):
- `/admin` 대시보드 — `<StatCard>` 아이콘 배경 (color-mix on accent) / `<Card>` 그림자
- `/admin/users` — ★ 빨간색 / 검색 버튼 카페블루 / 위험 영역 빨간 보더 / 정지·활성화 버튼 색
- `/admin/tournaments` — 페이지네이션 활성 페이지 액센트 / 공개 뱃지
- `/admin/courts` — 새 코트 등록 폼 입력 focus 색 / 삭제 버튼 빨간색
- `/admin/community/games/teams/payments/plans` — 동일 패턴

#### Phase 2: 헤더 thead 톤 정합

| 항목 | 변경 |
|------|------|
| 파일 | `src/app/globals.css` (admin-table 정의 보강) |
| 변경 | L1988 `background: var(--color-surface, var(--bg-elev))` → `var(--bg-head)` 로 톤 정합 (라이트 회청색 / 다크 #1D232B) |
| (web) 영향 | 0 |
| (admin) 효과 | admin 표 헤더가 web `.board__head` 와 시각 동일 (라이트 = `#EEF2F7` 회청색) |
| 위험 | 0 (단일 CSS 변경) |
| 시간 | 2분 |

#### Phase 3: 사이드바 색상 정합

| 항목 | 변경 |
|------|------|
| 파일 | `src/components/admin/sidebar.tsx` |
| 현재 | `bg-[var(--color-surface)]` (= bg-elev = 흰색 라이트 / #13171C 다크) — web AppNav 와 같은 톤 |
| 갭 | web AppNav 라이트 utility 바는 cafe-blue. main 바는 bg-elev 흰색 — admin 사이드바도 main 톤이라 정합 OK |
| 결정 | **변경 0** — 이미 정합 (논의 후 admin 사이드바 상단 BDR/Admin 배지 영역만 cafe-blue strip 추가 옵션 — 사용자 결정 항목) |
| 시간 | (옵션 시 5분) |

#### Phase 4: 인라인 px 라운드 → 토큰 교체 (옛 토큰 정리)

| 항목 | 변경 |
|------|------|
| 영향 파일 | admin courts(63건) / users(34건+17) / payments(17) / plans(34) / partners(34) 등 405건 색상 변수 + 102건 라운드 클래스 (Phase 1 완료 시 색상은 자동 정합 — 라운드는 별도) |
| 변경 | `rounded-[10px]` `rounded-[14px]` `rounded-[12px]` 인라인 → `rounded-md` (~6px) 또는 `rounded` (~4px) — 13 룰 §10 (4px 기본) |
| `rounded-full` 22건 점검 | (a) 정사각형 W=H 작은 dot/avatar = 50% 유지 OK / (b) 그 외 (페이지네이션 등) = `rounded-md` 로 교체 — 13 룰 §10 |
| (web) 영향 | 0 |
| (admin) 효과 | 시각 라운드 (web) 정합 (라이트 6~10px / 다크 0~2px) |
| 위험 | 매우 작음 (라운드 시각만 변화) |
| 시간 | 페이지당 5~10분 — 8 페이지 = 약 60분 |

#### Phase 5: 인라인 버튼/입력 → 글로벌 클래스 교체

| 항목 | 변경 |
|------|------|
| 대상 | admin courts/teams/games 등의 form 입력 필드 (`rounded-[10px] border ... bg-[var(--color-card)] px-3 py-2 text-sm`) |
| 변경 | `<input className="input">` / `<select className="select">` / `<button className="btn btn--primary">` 글로벌 클래스 사용 |
| (web) 영향 | 0 |
| (admin) 효과 | 라이트 cafe-blue focus ring / 다크 BDR Red focus / 버튼 hover 정합 / 코드 행수 -50% |
| 위험 | 매우 작음 (글로벌 클래스는 (web) 다수 페이지 사용 검증 끝) |
| 시간 | 페이지당 10~15분 — 8 페이지 = 약 90분 |

#### Phase 6: AdminSidebar / AdminMobileNav 활성 메뉴 톤 점검

| 항목 | 변경 |
|------|------|
| 현재 | 활성 메뉴 = `bg-[var(--color-primary)] text-white` (=BDR Red) — 라이트·다크 동일 |
| (web) 정합 | (web) AppNav 활성 탭 = `var(--accent)` 강조 — 동일 패턴 ✅ |
| 결정 | **변경 0** — 정합 |
| 옵션 | 사용자가 라이트모드 admin 사이드바 활성 메뉴를 cafe-blue로 변경 원하면 — `data-theme="light"` 분기에서만 `--color-primary`를 `var(--cafe-blue)` override 가능. 단 web 영향 검토 필수 (web 라이트는 primary=BDR Red 그대로) |
| 시간 | (변경 시 사용자 결정 필요) |

#### Phase 7: 17 페이지 점진 적용 우선순위

| 우선 | 페이지 | 시간 | 사유 |
|-----|------|------|------|
| P1 | `/admin/users` | 25분 | 사용자 보고 1순위 (스크린샷 기준) — 옛 토큰 51건 |
| P1 | `/admin/courts` | 35분 | 옛 토큰 87건 (admin 최다) — courts 등록폼 + 표 + 모달 |
| P1 | `/admin` 대시보드 | 15분 | 진입점 — Phase E 헤더 적용됨, 그 외 카드 톤 정합만 |
| P2 | `/admin/tournaments` | 20분 | 페이지네이션 활성 색 + 공개 뱃지 |
| P2 | `/admin/community` | 15분 | 댓글/게시글 표 |
| P2 | `/admin/teams` | 15분 | 팀 표 |
| P2 | `/admin/games` | 20분 | 경기 표 + 액션 |
| P3 | `/admin/payments` | 15분 | 결제 표 |
| P3 | `/admin/plans` | 30분 | 옛 토큰 50건 |
| P3 | `/admin/suggestions` `/admin/logs` `/admin/partners` `/admin/campaigns` `/admin/organizations` `/admin/notifications` `/admin/analytics` `/admin/game-reports` `/admin/settings` | 60분 | 잔여 9 페이지 |

**총 예상**: P1 = 75분 / P2 = 70분 / P3 = 105분 / 합 250분 (= 약 4시간) — 단 Phase 1 alias 보강만으로 405건 색상 자동 정합되므로 P1~P3 의 색상 작업 대부분 자동.

---

### 4. 영향도 / 리스크

| 항목 | 평가 | 근거 |
|-----|------|------|
| API/데이터 변경 | **0** | CLAUDE.md 리디자인 원칙 정합 |
| (web) 페이지 시각 영향 | **0** (Phase 1) | alias 추가만 — web 은 alias 미사용 |
| 라이트/다크 토글 영향 | **양쪽 정상화** | 9개 alias 가 라이트/다크 분기 모두 정의 (라이트 → ok/warn/danger / 다크 → 동일) |
| Phase A~E 회귀 | **0** | Phase A~E 가 도입한 `<AdminPageHeader>` `<AdminStatusTabs>` `<AdminDetailModal>` `<AdminMobileNav>` `.admin-table` 모두 영향 0 (오히려 alias 정상화로 의도대로 동작) |
| 13 룰 위반 | **0** | var(--*) 토큰만 / lucide ❌ / 9999px 정사각형만 / iOS 16px / 720px 분기 모두 유지 |
| 다크모드 강제 | **❌ (사용자 요구 정합)** | `[data-theme=...]` 토글 그대로 — 어느 단계도 강제 0 |
| 운영 DB 영향 | **0** | CSS만 변경 |
| 성능 | 무영향 (CSS 9줄 추가) | — |

**잠재 리스크**:
1. (web) 페이지가 미래에 `--color-accent` 같은 alias 를 사용하기 시작하면 alias 가 (web) 가독성 저해 → 작업 후 문서화 필수 (decisions.md)
2. `--shadow-card: var(--sh-sm)` 다크모드에서 `--sh-sm = 4px 4px 0 0 rgba(0,0,0,.6)` (브루탈 하드 그림자). admin 카드 다크모드 = 하드 오프셋 그림자 → web 카드 다크모드와 정합. 단 admin Card 컴포넌트가 라이트의 부드러운 그림자에 익숙한 사용자에게는 다크모드 카드가 "튀어나와 보임" 가능 — 사용자 결정 항목 (Q5)

---

### 5. 추천 진행 순서 + 시간

| 우선 | Phase | 시간 | 사유 |
|-----|------|------|------|
| ⭐⭐⭐ | **Phase 1: alias 9개 추가** | 5분 | 단 1 파일 변경 / 위험 0 / 405건 자동 정합 / 즉시 시각 효과 |
| ⭐⭐ | Phase 2: thead `--bg-head` 톤 정합 | 2분 | (web) 표 헤더 톤 일치 |
| ⭐ | Phase 4 (P1): 인라인 px 라운드 정리 (users/courts/dashboard) | 75분 | 시각 정합 추가 향상 |
| ⭐ | Phase 5 (P1): 인라인 → `.btn`/`.input` 글로벌 클래스 교체 (users/courts) | 60분 | 코드 행수 -50% + 라이트/다크 자동 분기 정합 |
| 잔여 | Phase 4·5 (P2/P3): 나머지 페이지 점진 | 215분 | Phase 1 후 대부분 자동 정합되므로 점진 가능 |

**이 회기 (오늘 작업 큐)**: Phase 1 + Phase 2 (총 7분) **단독** 추천. Phase 4·5 는 사용자 결정 후 별도 큐.

---

### 6. 사용자 결정 필요 사항

| Q | 질문 | 옵션 |
|---|------|------|
| Q1 | **Phase 1 alias 9개 추가 진행할까?** (web 영향 0, 즉시 시각 효과) | A. 진행 / B. 보류 |
| Q2 | **Phase 2 thead `--bg-head` 톤 정합 진행할까?** (admin 표 헤더 색만 변화) | A. 진행 / B. 현 흰색 유지 |
| Q3 | **라이트모드 admin 사이드바 활성 메뉴**를 cafe-blue 로 바꿀까? | A. BDR Red 유지 (현행, web 일관) / B. cafe-blue 로 변경 (web AppNav utility 와 일관) |
| Q4 | **Phase 4·5 (인라인 → 글로벌 클래스 교체)** 진행 시점 | A. Phase 1 직후 P1 3페이지만 / B. 별도 큐 (대회 후) / C. 페이지별 사용자 점검 |
| Q5 | **다크모드 admin 카드 그림자**를 web 정합(하드 오프셋) 으로 갈까 vs 부드러운 그림자 유지 | A. web 정합 (하드 — `var(--sh-sm)`) / B. 부드러운 유지 (`var(--sh-xs)` 또는 alias 별도) |
| Q6 | **Badge 컴포넌트** — 현재 `<Badge>` 가 `bg-color-*-light` Tailwind class 사용 중 (이게 Tailwind 4 신택스 미정합 → 색 안 보임) — `.badge.badge--ok` 로 교체할까? | A. 교체 (글로벌 클래스 활용) / B. 현 유지 (수정 없음) / C. Badge 컴포넌트 내부 구현만 갱신 |

---

### 7. 자체 검수 체크리스트 (계획 산출물)

| # | 항목 | 상태 |
|---|------|------|
| 1 | API/데이터 변경 0 | ✅ (CSS alias만) |
| 2 | (web) 페이지 영향 0 | ✅ (Phase 1 alias 추가 — web 토큰 변경 0) |
| 3 | 13 룰 정합 (var(--*) / 라운드 4px / iOS 16px / 720px) | ✅ |
| 4 | 라이트·다크 양쪽 검증 plan | ✅ (각 Phase 별 양쪽 검증 포인트 명시) |
| 5 | 다크모드 강제 ❌ | ✅ (alias 만 추가 — 토글 영향 0) |
| 6 | Phase A~E 회귀 0 | ✅ (admin-page-header / admin-status-tabs / admin-detail-modal / admin-table 무수정) |
| 7 | 운영 DB 영향 0 | ✅ (CSS만) |
| 8 | 사용자 결정 항목 명시 | ✅ (Q1~Q6 6건) |
| 9 | 추천 진행 순서 + 시간 명시 | ✅ |
| 10 | 영향도 / 리스크 표 | ✅ |
| 11 | 산출물 = 코드 변경 0 (계획만) | ✅ |
| 12 | 기존 §관리자페이지 UI 개선 섹션 (Phase A~E) 보존 | ✅ (별도 §F2 섹션 위에 새 섹션 추가만) |

---

### 8. developer 주의사항 (Phase 1 진행 시)

1. **변경 위치 한정**: `src/app/globals.css` L2307~2341 의 alias 블록 2개 (라이트 + 다크) 만 편집. 다른 라인 수정 ❌.
2. **alias 9개 모두 라이트/다크 양쪽에 정의** — 한쪽 빠뜨리면 토글 시 색 누락.
3. **변수명 검증**: admin 코드 405건 grep 결과 = `--color-accent / --color-accent-hover / --color-accent-light / --color-error / --color-warning / --color-success / --color-border-subtle / --color-text-dim / --shadow-card` 9개. 추가 변수 발견 시 추가.
4. **다크모드 `--shadow-card` 매핑 결정** — Q5 답변 받기 전엔 `var(--sh-sm)` (하드 오프셋, web 정합) 가 디폴트.
5. **commit 메시지**: `style(admin): alias 9개 추가 — admin 색상 변수 web 토큰 정합 (Phase 1)`
6. **검증** — 로컬 `/admin/users` 라이트·다크 양쪽 토글 → ★ 빨강 / 위험 영역 빨강 / 검색 버튼 카페블루(라이트) / 모달 보더 액센트 / 페이지네이션 활성색 모두 시각 확인.

---

## 작업 로그 (최근 10건, 오래된 것부터 압축)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-02 | (압축 16건) | LIVE/펄스 + 폴드5 hero fix + 단체 hero/grid + #132 PBP INSERT + Phase F2 박제+활성화 + #133 명단 INSERT + 셋업팀 풀패치(8건 commit) + 가입/매핑 17건 + W/L 칩 + minutesPlayed 진단 + 카드 30%↑ + #133/#134 last_clock 추적 + sub_in/out 가설검증 | ✅ |
| 2026-05-02 | (STL Phase 2) | **api/live sub 기반 출전시간 재계산 — MAX(sub, qsJson, dbMin, pbpSim) 전략** — `src/app/api/live/[id]/route.ts` `calculateSubBasedMinutes` 신규 함수 + `parseSubAction` 추가. 양 분기 (진행중/종료) 동일 적용. **검증 4매치**: #132 280m(100%) / #133 279.20m(99.7%, +0.53m 회복) / #134 275.55m(98.4%, **+11.38m 회복**) / #135 280m(100%). 전략 변경: 옵션A 덮어쓰기 → MAX 채택 (정상 매치 qsJson 만점값 보존, last_clock 절단 매치만 sub 회복). DB/Flutter 변경 0. tsc PASS. errors.md 박제 큐 | ✅ |
| 2026-05-02 | (정밀 추적 SELECT only) | **#134 -4.45m / #133 -0.80m 미달 출처 100% 식별 — Flutter sub PBP 자체 누락 (가설 C/E)** — 4 매치 lineup 시계열 + 4 출처 출전합 비교. **출처별 양팀합** (기대 280m): #132 dbMin 227 / qsJson 280 / sub 264.63 / MAX **280** ✅ 만점출처=qsJson | #133 dbMin 234.53 / qsJson 278.67 / sub 255.05 / MAX 279.65 (-1.33m, qsJson Q3 -80s 누락) | #134 dbMin 218.18 / qsJson **264.17** / sub 273.95 / MAX 275.55 (-4.45m, **모든 출처 미달**) | #135 dbMin 251.05 / qsJson 280 / sub 267.70 / MAX **280** ✅. **결론**: 사용자 가설 A·B·C 모두 부분맞음 — 알고리즘이 lineup 5명 미만 시간 흡수해 sub-based -10~-25m 미달 (회수 가능 X — Flutter app 자체가 그 시간의 sub PBP 미생성). #132/#135 만점은 qsJson 이 코트 인원 5명 가정 하에 산출되므로 sub 누락 영향 받지 않음. **#134 미달 -4.45m 의 진짜 원인** = Flutter app 의 quarterStatsJson 자체에 -16m 손실 (운영자가 쿼터 진행중 timer pause/resume 누락 또는 마지막 1~2분 사이드라인 액션 미입력). **fix 옵션**: F1) **DB 수동 보정 — qsJson 의 Q4 min 값 직접 UPDATE** (예: #134 Q4 home/away 의 min 합 = +570s 보충 → 280m 정확) — 사용자 결정 필요 (운영 DB UPDATE 1~3건만, 가드 충분) F2) Flutter quarter timer 버그 fix — 비현실 (사용자 진술) F3) 알고리즘 측 추가 회수 불가 — 정보 부재. **권고**: D-day 잔여시간 짧음 → 표시값 그대로 (오차 의미 작음). 대회 종료 후 Flutter 측 timer 정확도 개선 큐 | ✅ |
| 2026-05-02 | (STL Phase 2 강화 F3+F2) | **api/live calculateSubBasedMinutes 강화 — 4매치 모두 280m 만점 회복** — F3 (starter 추정 정확화: Q2~Q4 starter = 직전 쿼터 종료 lineup chain) + F2 (쿼터별 합 미달 보정: deficit < qLen 가드, 출전 시간 가중 분배). 데이터 구조 = quarterPlayerSec 쿼터별 분리 → 최종 합산. **검증**: #132 264.63→280.02m / #133 255.05→280.00m / #134 273.95→280.00m / #135 267.70→280.00m. tsc PASS. DB/Flutter 변경 0. errors.md F3+F2 박제. 검증 스크립트 즉시 삭제 | ✅ |
| 2026-05-02 | (DB 보정만) | **5팀(MZ/블랙라벨/MSA/우아한/슬로우) 명단+배번 보정** — MZ id=233 정정(234=동명이인). 1차 매칭 32명 + [유사] User 15명(무소속+최근가입 검증) team_members 추가 INSERT. 결과: MZ 11/11 ✅ / 우아한 9/9 ✅ / 블랙라벨 10/21 (11명 User 미가입) / MSA 12/17 (5명 미가입) / 슬로우 5/8 (3명 미가입). 잔여 19명 (User DB 미존재) = 옵션 A 처리(userId=null player_name) 결정 대기. 임시 스크립트 7개 즉시 정리 | ✅ |
| 2026-05-02 | (DB UPDATE) | **B조 승자전 Match #7 양쪽 아울스 — awayTeamId NULL 정정** — Match #5(아울스 winner) 종료 직후 1초 만에 Match #7.away 가 잘못 250 set. progressDualMatch / updateMatch / updateMatchStatus / Flutter v1 모두 단일 슬롯 정상. 의심 경로=admin web matches PATCH (homeTeamId/awayTeamId 직접 set 가능). 즉시 fix=awayTeamId NULL UPDATE. Match #6 종료 시 자동 덮어쓰기 진행. errors.md 박제 + 회귀 방지 큐 (progressDualMatch 가드 / admin PATCH 슬롯 직접 set 차단 / audit log / cron 검출). 피벗 케이스도 동일 패턴 | ✅ |
| 2026-05-02 | (DB 통합 트랜잭션) | **김영훈 placeholder ↔ real user 통합 (#94 셋업)** — uid 2954(placeholder, PBP 34건+Stat 2건) → uid 2853(실제 카카오 4/8 가입) 7단계 트랜잭션. ttp 2708.userId UPDATE 1줄로 PBP/Stat 자동 귀속. 빈 껍데기 ttp 2717 + 0점 stat 정리. tm captain 2853 jersey 94 보정. user 2954 status='deleted' + 추적 표식. 매치 #133 매칭률 80→96% / #135 9점 매핑. 16팀 점검 동시 진행: 명단 0팀=MI/SKD, 배번누락=다이나믹 6명 + 셋업 김영훈(완료). lessons.md 통합 패턴 박제 | ✅ |
| 2026-05-02 | (G1 DNP 가드) | **api/live calculateSubBasedMinutes 에 DNP 가드 추가** — `route.ts` `calculateSubBasedMinutes` 에 everSeen Set (PBP 액션 + sub_in/out 등장 ttpId) 사전 계산. starter / playersInQuarter / F2 가중분배 3단계 모두에서 DNP 선수 (everSeen 미포함) 제외. return 객체화 (`{perPlayer, dnpSet}`) + 호출부 2곳 (149/376) 가드 적용 + `getSecondsPlayed` 에 hasRealRecord 검사 추가 (qsJson/dbMin/PBP-sim/통계누적/isStarter 모두 0 → subSec=0). **검증**: #132 283.3m→283.3m / #133 280→280 / #134 280→280 / #135 284.9→284.9 (DNP 영향 0) / #136 **329.8m→285.8m (-44m)** = 전효민 22.3m + 이상현 21.8m 가짜 시간 제거. 5.8m 잔여는 F2 over-distribution (G3 후속 큐). DB/Flutter 변경 0. tsc PASS | ✅ |
| 2026-05-02 | (G3 신뢰도 분리 + cap) | **api/live 신뢰도 기반 출전시간 + 풀타임 보호 + 팀 cap** — `PlayerTimeBreakdown {trustedSec, mediumSec, distributedSec}` 도입. `calculateSubBasedMinutes` segment 단위 신뢰도 분류 (sub_in→sub_out=trusted / starter 풀쿼터=trusted / starter→sub_out=medium / sub_in→끝=medium / F2 가중분배=distributed). `getSecondsPlayed` 5순위 (풀타임>qsJson 근접>sub 채택>외부 fallback>DNP). `applyTeamCap` 팀별 cap=5×qLen×4 — distributed 우선 축소, trusted 절대 보호, mediumTotal>remaining 시 medium 도 축소. PlayerRow 임시 `_minBreakdown` 첨부 후 응답 직전 strip. **검증**: cap unit test 4/4 PASS (cap 미초과 / distributed 축소 / medium 축소 / 데이터 이상). 5매치 sub-based raw 측정 = cap 미발동 (sub_total<cap, 라이브 API의 STL R3 보충 후 280m 근접). #134 풀타임 조현철·강동진 trustedSec=28.00m 정확 보존. tsc PASS. DB/Flutter 변경 0. errors.md G3 박제 | ✅ |
