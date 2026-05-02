# 작업 스크래치패드

## ⚠️ 세션 분리 원칙 (2026-04-22)
- **일반 모드**: mybdr 본 프로젝트 작업 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 쇼핑몰 작업 (`scratchpad-cafe-sync.md` 별도)

---

## 🚀 다음 세션 진입점 (2026-05-02 종료 시점 기준)

### 🟡 HOLD — 자율 QA 봇 시스템 (사용자 요청 2026-05-02)
- 계획 완료 (Phase 1~5 / 9d / Q1~Q8 결정 대기)
- **사용자 명시**: "이건 일단 홀드하고 나중에 내가 얘기 안 꺼내면 얘기해줘"
- → PM 이 적당한 시점에 환기 필요 (D-day 종료 후 또는 1주일 후)
- 박제: scratchpad 기획설계 섹션 또는 `Dev/bot-qa-system-plan-2026-05-02.md` 분리 예정

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

**6) BDR 기자봇 시스템 v2** (다양한 기사 6종 + 일 300매치 + 저비용 LLM) — v2 계획서 박제 ✅
- v1: `Dev/bdr-reporter-bot-plan-2026-05-02.md` (매치 단신 1종 / Sonnet 4.5)
- **v2: `Dev/bdr-reporter-bot-plan-v2-2026-05-02.md` (15 섹션)** — 사용자 비전 확장 후속
- **기사 6종**: 매치 요약 / 매치 풀 리포트 / 일자별 종합 / 대회 프리뷰 / 리뷰 / 중간 상황
- **LLM**: Gemini 2.0 Flash (무료 tier 1500 RPD = 일 300매치 흡수, paid 시 월 $5~17)
- **DB**: articles + article_versions + article_feedback 신규 3 테이블 (무중단 ADD)
- **Phase 0~7 / 합 ~38h** — Phase 1 시작 시점 추천 = 5/10 대회 종료 후 (D-day 영향 0 + dataset 12건 확보)
- **사용자 결정 Q1~Q10 (10건)**: LLM/tier/이름/톤/시작시점/few-shot/자동발행/피드백/UI위치/A·B
- 결정 받기 전 코드 / DB / LLM 호출 0

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

> **Phase 1+2 완료 (commit f8fe8f0, 미푸시)** — alias 9개 + thead `--bg-head`. 1 파일 / 23 라인 / web 영향 0 / admin 405건 자동 정합. 운영 배포 후 라이트·다크 양쪽 시각 검증 큐. Phase 3~7 (인라인 → 글로벌 클래스 / 라운드 정리) 별도 큐.

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

## 기획설계 — 자율 QA 봇 시스템 도입 계획 (2026-05-02 v1)

**작업 일시**: 2026-05-02 / **요청**: PM (사용자 큰 비전 — 코드 0, 계획만)
**상태**: 계획 수립 단계. 구현은 사용자 결정 + Phase 1 승인 후 별도 큐.

### 🎯 목표

봇 user 6종이 사이트 전체 흐름(가입→활동→탈퇴)을 자동 점검하고, 발견한 이상을 위험도별로 분류해 사용자/PM에 보고. 위험도 0 만 자동 수정 PR 생성. 운영 데이터 오염 0 + (web) 사용자 영향 0.

### 1. 봇 페르소나 6종

| 봇 유형 | 식별 (User 컬럼) | 권한 | 주요 행동 | 데이터 의존 |
|---------|----------------|------|----------|------------|
| 슈퍼관리자봇 | `email LIKE 'bot-superadmin%@mybdr.test'` + `admin_role='super_admin'` | /admin 전체 | 대시보드 / 페이지네이션 / 통계 / 위험 영역 (DELETE 시도 X) | admin_users / admin_tournaments |
| 대회관리자봇 | `bot-tournadmin%` + `admin_role='tournament_admin'` (또는 organization 소속) | 대회 CRUD | 대회 생성 → 시드 → 대진표 → 매치 진행(가짜) → 정산 | organizations / tournaments / matches |
| 팀장봇 | `bot-captain%` + `team_members.role='captain'` | 팀 captain | 팀 생성 → 멤버 초대 → 가입 신청 승인 → 매치 신청 | teams / team_members / tournament_teams |
| 팀원봇 | `bot-member%` + `team_members.role='member'` | 일반 user + 팀 멤버 | 팀 가입 신청 → 활동 → 매치 참여 → 출석 | team_members / matches |
| 일반유저봇 | `bot-user%` (default) | 일반 user | 코트 검색 / 게임 보기 / 게시글 작성 / 댓글 / 좋아요 / 팔로우 | courts / games / community |
| 심판봇 | `bot-referee%` + `Referee` 모델 row | referee | 심판 등록 → 자격증 점검 → 배정 조회 → 정산 조회 | referees / assignments |

**격리 컬럼 신설 추천**: `User.is_bot Boolean @default(false)` (별 alias 보다 명시적). UI 모든 list (랭킹/검색/리뷰) 에서 `where: { is_bot: false }` 자동 필터.

### 2. 시나리오 list (Phase 1 우선 5개 + 확장 큐 5개)

| 우선 | 시나리오 | 봇 조합 | 점검 포인트 | 시간 |
|-----|--------|--------|-----------|------|
| P1 | **가입 → 프로필 작성 → 로그아웃** | 일반유저봇 | signupAction / profile PATCH / 세션 cookie | 5분 |
| P1 | **로그인 → 마이페이지 6 카드 로드** | 일반유저봇 | /profile hub / SWR / 8 쿼리 prefetch | 3분 |
| P1 | **팀 생성 → 멤버 초대 → 가입 승인** | 팀장봇 + 팀원봇 | /teams/new / team_members CRUD | 8분 |
| P1 | **대회 신청 → 시드 → 매치 조회** | 팀장봇 + 대회관리자봇 | /tournaments/[id]/register / admin/tournaments PATCH | 10분 |
| P1 | **코트 검색 → 상세 → 리뷰 작성** | 일반유저봇 | /courts / ContextReviews POST | 4분 |
| P2 | 게시글 작성 → 댓글 → 좋아요 | 일반유저봇 ×2 | /community / likes ServerAction | 5분 |
| P2 | 라이브 매치 조회 → 박스스코어 | 일반유저봇 | /live/[id] / api/live | 3분 |
| P2 | 심판 등록 → 자격증 입력 | 심판봇 | /referee/register | 7분 |
| P3 | 회원 탈퇴 → 데이터 처리 | 일반유저봇 | /profile/edit/withdraw / cascade | 5분 |
| P3 | 단체 생성 → 시리즈 → 대회 3계층 | 대회관리자봇 | organizations / series / tournaments | 12분 |

### 3. 인프라 옵션 비교 + 추천

| 옵션 | 장점 | 단점 | 추천 |
|------|------|------|------|
| A. 직접 prisma 호출 | 가장 빠름 / 격리 쉬움 | 진짜 user flow 미검증 (signupAction 우회) | 보조 |
| B. fetch + cookie 시뮬 | server action 호출 어려움 | next-action header 핸들링 복잡 | ❌ |
| C. Playwright 브라우저 자동화 | 진짜 흐름 100% 검증 / 스크린샷 / 시각 회귀 | 무거움 (CI 8~15분) | ⭐ P1 |
| D. API route 호출 | 빠름 / 90% flow 커버 | server action (signup 등) 미커버 | ⭐ P1 보조 |

**추천 조합**: **C (Playwright) 메인 + D (API) 보조**.
- Playwright = signup / login / 페이지 시각 검증
- API = 대량 데이터 시드 / 매치 진행 시뮬레이션 (브라우저 불필요)

**인프라 위치**:
```
scripts/bots/
├── personas/                # 봇 페르소나 6종 정의 (TS)
├── scenarios/               # 시나리오 10개 (Playwright + API mix)
├── findings/                # 봇 발견 결과 (JSON) → DB 동기화
├── runner.ts                # 봇 실행 entry point
└── README.md
```

### 4. 피드백 수집 데이터 구조

**옵션 A (DB 테이블 신설)** ⭐ 추천:
```prisma
model BotFinding {
  id          String   @id @default(cuid())
  bot_type    String   // 'superadmin'|'captain'|...
  scenario    String   // 'signup-flow'|'team-create'
  step        String   // '/teams/new POST'
  severity    String   // 'low'|'medium'|'high'|'critical'
  category    String   // 'ui'|'logic'|'security'|'performance'|'data'
  title       String
  description String   @db.Text
  evidence    Json?    // screenshot path / DOM snippet / API response
  status      String   @default("open") // 'open'|'auto-fixed'|'reviewed'|'dismissed'
  created_at  DateTime @default(now())
  resolved_at DateTime?
  resolved_by String?
  @@index([severity, status])
  @@index([scenario, status])
  @@map("bot_findings")
}
```

**옵션 B (파일)**: `.claude/bot-feedback/{date}.json` — 가벼우나 통계 어려움.

**채택**: **A (DB 테이블)**. 통계 / 중복 차단 / admin 페이지 통합 가능.

### 5. 위험도 분류 룰

| 위험도 | 자동 수정 | 예시 |
|-------|---------|------|
| **low** (자동 수정 OK) | ⭐ PR 자동 생성 → 사용자 review only | 오타 / 한글 누락 / placeholder 영문 / `var(--*)` 미사용 1건 / 라운드 px 인라인 |
| **medium** (사용자 결정) | ❌ scratchpad 보고 | API 로직 / 신규 핸들러 / form validation 추가 |
| **high** (즉시 보고) | ❌ PM 호출 | 보안 (IDOR / withAuth 누락) / 데이터 손실 위험 / N+1 쿼리 |
| **critical** (즉시 중단) | ❌ 사용자 SMS/카톡 알림 | 운영 중단 / DB 파괴 / 인증 우회 |

**자동 수정 가드**:
- 변경 파일 ≤ 2개 + 변경 라인 ≤ 20줄
- 테스트 통과 (tsc + 시나리오 재실행)
- API/DB schema 변경 0
- 새 파일 생성 0
- 위 모두 만족해도 사용자 review 단계는 항상 유지 (auto-merge ❌)

### 6. Phase 1~5 산출물 표

| Phase | 작업 | 산출물 | 시간 | 검증 기준 |
|-------|-----|------|------|----------|
| **Phase 1** | 봇 페르소나 + 시나리오 정의 (문서) | `scripts/bots/personas/*.ts` 6 파일 + `scenarios/*.md` 5 파일 + `User.is_bot` schema 추가 | 1d | 문서 review |
| **Phase 2** | 봇 실행 인프라 (수동) | `runner.ts` + Playwright 설치 + 시나리오 P1 5개 구현 | 2d | 5 시나리오 수동 실행 PASS |
| **Phase 3** | 피드백 수집 (수동 분류) | `BotFinding` 테이블 + `/admin/bot-findings` 페이지 + 봇이 자동 INSERT | 1d | 시나리오 1회 실행 → DB row 생성 |
| **Phase 4** | 자동 분류 (위험도 평가) | 룰 엔진 (`scripts/bots/severity-classifier.ts`) — 키워드 / 응답코드 / DOM 분석 | 2d | 100건 샘플 → 분류 정확도 80%+ |
| **Phase 5** | 자동 수정 (위험도 0 만) | `scripts/bots/auto-fix-bot.ts` (Claude API 호출 → PR 생성) + 가드 | 3d | low 5건 → PR 5건 (검토 후 머지) |

**총 예상**: 9일 (단계별 사용자 승인 후 진행, 한꺼번에 X).

### 7. 봇 격리 / 운영 데이터 보호 룰 (필수)

| # | 룰 | 구현 |
|---|-----|------|
| 1 | 봇 user 식별 컬럼 | `User.is_bot Boolean @default(false)` schema 추가 (NULL 허용 ADD COLUMN, 운영 영향 0) |
| 2 | 모든 공개 list 에서 봇 자동 제외 | 랭킹 / 검색 / 리뷰 / 팀 멤버 카운트 — 공통 prisma where helper (`excludeBots()`) |
| 3 | 봇 활동 격리 — 별도 namespace | 봇이 만든 team/tournament 는 prefix `bot-{date}-` 강제 + status `bot-only` |
| 4 | 봇 매치는 공식 기록에서 제외 | `officialMatchWhere()` 에 `team.is_bot=false` 추가 |
| 5 | 봇 발견 무한 루프 방지 | 같은 (scenario+step+title) 24h 내 재발견 → 무시 (`findings @@unique` partial) |
| 6 | 봇 commit 분리 | 자동 PR 브랜치 = `bot/auto-fix-{YYYY-MM-DD}-{slug}` / 사용자 PR 와 충돌 방지 |
| 7 | 봇 활동 로그 보존 | `bot_runs` 테이블 (run_id / started_at / scenarios / findings_count) — 사후 추적 |
| 8 | 봇 실행 환경 제한 | 운영 배포에서는 실행 ❌ (preview 또는 로컬만). cron 도 dev 환경만 |
| 9 | UI 봇 user 숨김 | 마이페이지 / 프로필 / 팔로우 / 검색 결과 모두 `is_bot=false` 필터 |
| 10 | 봇 활동 비용 cap | LLM 호출 일일 한도 (예: 1000 call/day) + 비용 알림 |

### 8. 사용자 결정 필요 사항 (Q1~Q8)

| Q | 질문 | 옵션 |
|---|-----|------|
| Q1 | **봇 user DB 격리** = `is_bot` 컬럼 신설 vs `email LIKE 'bot%@mybdr.test'` 패턴만 | A. 컬럼 신설 (운영 영향 0 ADD COLUMN) ⭐ / B. 이메일 패턴만 |
| Q2 | **운영 DB vs 별도 dev DB** — 봇 데이터를 어디에 둘까? | A. 운영 DB + 격리 (cost 0, 가드 9개) / B. 별도 dev DB (cost ↑, 정책 변경) |
| Q3 | **봇 실행 빈도** | A. 수동 실행만 (사용자 트리거) / B. 일 1회 cron / C. PR 마다 CI |
| Q4 | **자동 수정 — 위험도 0만** PR 생성 허용? | A. 허용 (auto-merge ❌, review 필수) / B. 비허용 (모두 수동) |
| Q5 | **인프라 도입 — Playwright** (의존성 +1, ~80MB) | A. 도입 / B. API + prisma 만 (시각 검증 포기) |
| Q6 | **봇 발견 보고 채널** | A. /admin/bot-findings 페이지만 / B. + 카톡 알림 (high/critical) / C. + 슬랙 |
| Q7 | **Phase 1 산출물 review 시점** | A. 문서 작성 직후 즉시 / B. Phase 2 (실행 인프라) 와 함께 |
| Q8 | **봇 LLM 비용 한도** | A. 일 1000 call (~$5) / B. 일 100 call (~$0.5) / C. 0 (deterministic 룰만) |

### 9. 위험 / 한계

| # | 위험 | 완화 |
|---|-----|------|
| 1 | 운영 DB 봇 user 통계 왜곡 | §7 룰 1·2·9 (모든 list 자동 필터) |
| 2 | 봇 활동이 실제 매치/게시글로 들어가 운영 데이터 오염 | §7 룰 3·4 (namespace + 공식 기록 제외) |
| 3 | 자동 수정 코드 품질 저하 | §5 가드 (≤2 파일 / ≤20 줄 / tsc PASS / review 필수) |
| 4 | LLM agent 비용 폭증 | §7 룰 10 (일 cap + 알림) / Q8 결정 |
| 5 | 봇 무한 루프 (같은 발견 N회) | §7 룰 5 (24h 중복 차단) |
| 6 | Playwright CI 시간 증가 | §3 옵션 D 보조 (대량 데이터는 API 로) |
| 7 | 봇 실행 중 운영 사용자와 race condition | §7 룰 8 (운영 환경 차단) |

### 10. 추천 진행 순서

| 우선 | 작업 | 시간 | 사유 |
|-----|------|------|------|
| ⭐⭐⭐ | **Q1~Q8 사용자 결정** (특히 Q1·Q2·Q5) | 30분 | Phase 1 문서 분기점 |
| ⭐⭐ | Phase 1 — 봇 페르소나 + 시나리오 5개 + `is_bot` schema | 1d | 코드 변경 0 (문서 + schema 1줄) |
| ⭐ | Phase 2 — Playwright 설치 + P1 5 시나리오 구현 | 2d | 사용자 review 후 진행 |
| 잔여 | Phase 3·4·5 점진 | 6d | Phase 2 검증 후 |

### 11. 자체 검수 체크리스트 (계획 산출물)

| # | 항목 | 상태 |
|---|------|------|
| 1 | API/데이터 변경 0 (계획만) | ✅ |
| 2 | (web) 페이지 영향 0 | ✅ (봇 격리 룰 9가 보호) |
| 3 | 운영 DB 영향 0 (계획만) | ✅ (Phase 1 schema는 ADD COLUMN nullable — 운영 무중단) |
| 4 | 13 룰 정합 (디자인) | N/A (봇은 데이터 / 흐름 점검) |
| 5 | 사용자 결정 항목 명시 | ✅ Q1~Q8 8건 |
| 6 | Phase 1~5 산출물 표 | ✅ |
| 7 | 위험 / 한계 표 | ✅ 7건 |
| 8 | 봇 격리 / 운영 데이터 보호 룰 | ✅ 10건 |
| 9 | 시나리오 우선순위 | ✅ P1 5 + P2 3 + P3 2 |
| 10 | 추천 진행 순서 + 시간 | ✅ |
| 11 | 코드 / DB 수정 0 (계획만) | ✅ |
| 12 | 봇 1명 (uid=3316) 추가 생성 0 | ✅ |

### 12. developer 주의사항 (Phase 1 진행 시)

1. **schema 변경**: `User.is_bot Boolean @default(false)` 만 추가 — `prisma db push` 가능 (NULL 허용 ADD COLUMN, 운영 즉시 적용 OK). 그 외 schema 변경 0.
2. **현재 봇 user (uid=3316) 갱신**: `is_bot=true` UPDATE 1줄 (단 1 row).
3. **BotFinding / bot_runs 테이블은 Phase 3 에서**: Phase 1 에서는 schema 추가 ❌ (계획 문서만).
4. **Playwright 설치는 Phase 2 에서**: Phase 1 = 문서 + 시나리오 markdown 만.
5. **봇 ID prefix 룰**: `bot-{role}-{uid}@mybdr.test` (예: `bot-captain-3317@mybdr.test`) — 식별 + grep 용이.
6. **운영 사용자 영향 검증** (Phase 1 후): `is_bot` 컬럼 추가 후 모든 공개 list (랭킹·검색·팀멤버) where 절에 `is_bot: false` 자동 추가 안 되어 있으면 봇이 운영 화면 노출.

---

## 작업 로그 (최근 10건, 오래된 것부터 압축)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-02 | (STL Phase 2) | **api/live sub 기반 출전시간 재계산 — MAX(sub, qsJson, dbMin, pbpSim) 전략** — `src/app/api/live/[id]/route.ts` `calculateSubBasedMinutes` 신규 함수 + `parseSubAction` 추가. 양 분기 (진행중/종료) 동일 적용. **검증 4매치**: #132 280m(100%) / #133 279.20m(99.7%, +0.53m 회복) / #134 275.55m(98.4%, **+11.38m 회복**) / #135 280m(100%). 전략 변경: 옵션A 덮어쓰기 → MAX 채택 (정상 매치 qsJson 만점값 보존, last_clock 절단 매치만 sub 회복). DB/Flutter 변경 0. tsc PASS. errors.md 박제 큐 | ✅ |
| 2026-05-02 | (정밀 추적 SELECT only) | **#134 -4.45m / #133 -0.80m 미달 출처 100% 식별 — Flutter sub PBP 자체 누락 (가설 C/E)** — 4 매치 lineup 시계열 + 4 출처 출전합 비교. **출처별 양팀합** (기대 280m): #132 dbMin 227 / qsJson 280 / sub 264.63 / MAX **280** ✅ 만점출처=qsJson | #133 dbMin 234.53 / qsJson 278.67 / sub 255.05 / MAX 279.65 (-1.33m, qsJson Q3 -80s 누락) | #134 dbMin 218.18 / qsJson **264.17** / sub 273.95 / MAX 275.55 (-4.45m, **모든 출처 미달**) | #135 dbMin 251.05 / qsJson 280 / sub 267.70 / MAX **280** ✅. **결론**: 사용자 가설 A·B·C 모두 부분맞음 — 알고리즘이 lineup 5명 미만 시간 흡수해 sub-based -10~-25m 미달 (회수 가능 X — Flutter app 자체가 그 시간의 sub PBP 미생성). #132/#135 만점은 qsJson 이 코트 인원 5명 가정 하에 산출되므로 sub 누락 영향 받지 않음. **#134 미달 -4.45m 의 진짜 원인** = Flutter app 의 quarterStatsJson 자체에 -16m 손실 (운영자가 쿼터 진행중 timer pause/resume 누락 또는 마지막 1~2분 사이드라인 액션 미입력). **fix 옵션**: F1) **DB 수동 보정 — qsJson 의 Q4 min 값 직접 UPDATE** (예: #134 Q4 home/away 의 min 합 = +570s 보충 → 280m 정확) — 사용자 결정 필요 (운영 DB UPDATE 1~3건만, 가드 충분) F2) Flutter quarter timer 버그 fix — 비현실 (사용자 진술) F3) 알고리즘 측 추가 회수 불가 — 정보 부재. **권고**: D-day 잔여시간 짧음 → 표시값 그대로 (오차 의미 작음). 대회 종료 후 Flutter 측 timer 정확도 개선 큐 | ✅ |
| 2026-05-02 | (STL Phase 2 강화 F3+F2) | **api/live calculateSubBasedMinutes 강화 — 4매치 모두 280m 만점 회복** — F3 (starter 추정 정확화: Q2~Q4 starter = 직전 쿼터 종료 lineup chain) + F2 (쿼터별 합 미달 보정: deficit < qLen 가드, 출전 시간 가중 분배). 데이터 구조 = quarterPlayerSec 쿼터별 분리 → 최종 합산. **검증**: #132 264.63→280.02m / #133 255.05→280.00m / #134 273.95→280.00m / #135 267.70→280.00m. tsc PASS. DB/Flutter 변경 0. errors.md F3+F2 박제. 검증 스크립트 즉시 삭제 | ✅ |
| 2026-05-02 | (DB 보정만) | **5팀(MZ/블랙라벨/MSA/우아한/슬로우) 명단+배번 보정** — MZ id=233 정정(234=동명이인). 1차 매칭 32명 + [유사] User 15명(무소속+최근가입 검증) team_members 추가 INSERT. 결과: MZ 11/11 ✅ / 우아한 9/9 ✅ / 블랙라벨 10/21 (11명 User 미가입) / MSA 12/17 (5명 미가입) / 슬로우 5/8 (3명 미가입). 잔여 19명 (User DB 미존재) = 옵션 A 처리(userId=null player_name) 결정 대기. 임시 스크립트 7개 즉시 정리 | ✅ |
| 2026-05-02 | (DB UPDATE) | **B조 승자전 Match #7 양쪽 아울스 — awayTeamId NULL 정정** — Match #5(아울스 winner) 종료 직후 1초 만에 Match #7.away 가 잘못 250 set. progressDualMatch / updateMatch / updateMatchStatus / Flutter v1 모두 단일 슬롯 정상. 의심 경로=admin web matches PATCH (homeTeamId/awayTeamId 직접 set 가능). 즉시 fix=awayTeamId NULL UPDATE. Match #6 종료 시 자동 덮어쓰기 진행. errors.md 박제 + 회귀 방지 큐 (progressDualMatch 가드 / admin PATCH 슬롯 직접 set 차단 / audit log / cron 검출). 피벗 케이스도 동일 패턴 | ✅ |
| 2026-05-02 | (DB 통합 트랜잭션) | **김영훈 placeholder ↔ real user 통합 (#94 셋업)** — uid 2954(placeholder, PBP 34건+Stat 2건) → uid 2853(실제 카카오 4/8 가입) 7단계 트랜잭션. ttp 2708.userId UPDATE 1줄로 PBP/Stat 자동 귀속. 빈 껍데기 ttp 2717 + 0점 stat 정리. tm captain 2853 jersey 94 보정. user 2954 status='deleted' + 추적 표식. 매치 #133 매칭률 80→96% / #135 9점 매핑. 16팀 점검 동시 진행: 명단 0팀=MI/SKD, 배번누락=다이나믹 6명 + 셋업 김영훈(완료). lessons.md 통합 패턴 박제 | ✅ |
| 2026-05-02 | (G1 DNP 가드) | **api/live calculateSubBasedMinutes 에 DNP 가드 추가** — `route.ts` `calculateSubBasedMinutes` 에 everSeen Set (PBP 액션 + sub_in/out 등장 ttpId) 사전 계산. starter / playersInQuarter / F2 가중분배 3단계 모두에서 DNP 선수 (everSeen 미포함) 제외. return 객체화 (`{perPlayer, dnpSet}`) + 호출부 2곳 (149/376) 가드 적용 + `getSecondsPlayed` 에 hasRealRecord 검사 추가 (qsJson/dbMin/PBP-sim/통계누적/isStarter 모두 0 → subSec=0). **검증**: #132 283.3m→283.3m / #133 280→280 / #134 280→280 / #135 284.9→284.9 (DNP 영향 0) / #136 **329.8m→285.8m (-44m)** = 전효민 22.3m + 이상현 21.8m 가짜 시간 제거. 5.8m 잔여는 F2 over-distribution (G3 후속 큐). DB/Flutter 변경 0. tsc PASS | ✅ |
| 2026-05-02 | (planner v2 박제) | **BDR 기자봇 v2 계획 박제** — 사용자 비전 확장 (기사 6종 + 일 300매치 + 저비용 LLM). v1 (Sonnet 4.5) → v2 (Gemini 2.0 Flash). 6종 기사 (단신/풀리포트/일자별종합/대회프리뷰/리뷰/중간상황) + DB 3 테이블 (articles + versions + feedback) + Vercel Cron + DB queue. 비용 = 무료 tier 1500 RPD 흡수 가능 (paid 시 월 $5~17). Phase 0~7 / ~38h. 사용자 결정 Q1~Q10 (10건). 산출물: `Dev/bdr-reporter-bot-plan-v2-2026-05-02.md` (15 섹션). 코드/DB/LLM 호출 0. 우선순위 1 큐 항목 6 v2 갱신 | ✅ |
| 2026-05-02 | (G3 신뢰도 분리 + cap) | **api/live 신뢰도 기반 출전시간 + 풀타임 보호 + 팀 cap** — `PlayerTimeBreakdown {trustedSec, mediumSec, distributedSec}` 도입. `calculateSubBasedMinutes` segment 단위 신뢰도 분류 (sub_in→sub_out=trusted / starter 풀쿼터=trusted / starter→sub_out=medium / sub_in→끝=medium / F2 가중분배=distributed). `getSecondsPlayed` 5순위 (풀타임>qsJson 근접>sub 채택>외부 fallback>DNP). `applyTeamCap` 팀별 cap=5×qLen×4 — distributed 우선 축소, trusted 절대 보호, mediumTotal>remaining 시 medium 도 축소. PlayerRow 임시 `_minBreakdown` 첨부 후 응답 직전 strip. **검증**: cap unit test 4/4 PASS (cap 미초과 / distributed 축소 / medium 축소 / 데이터 이상). 5매치 sub-based raw 측정 = cap 미발동 (sub_total<cap, 라이브 API의 STL R3 보충 후 280m 근접). #134 풀타임 조현철·강동진 trustedSec=28.00m 정확 보존. tsc PASS. DB/Flutter 변경 0. errors.md G3 박제 | ✅ |
| 2026-05-02 | f8fe8f0 | **admin Phase 1+2 — Admin-Web 시각 통합 alias 9개 + thead 톤** — `globals.css` L2321/L2349 라이트·다크 alias 블록에 9 변수 추가 (`--color-accent`/`-hover`/`-light`, `--color-error`/`-warning`/`-success`, `--color-border-subtle`, `--color-text-dim`, `--shadow-card`) + L1988 `.admin-table thead` background → `var(--bg-head)` 회청색 톤. 1 파일 / 22 insertions / 1 deletion. (web) 영향 0 (alias 추가만 — web은 원본 토큰 직접 사용) / admin 코드 변경 0 (405건 자동 정합) / Phase A~E 회귀 0 / 다크모드 강제 ❌. tsc PASS. 미푸시 1건. Phase 3~7 (인라인 → 글로벌 클래스) 별도 큐 | ✅ |
| 2026-05-02 | (Phase 0 단신 형식) | **/live/[id] 요약 탭 — 단신 기사 5섹션 형식 도입** — `tab-summary.tsx` 단일 파일. 5섹션 구조 (Header 메타라인 / Headline 표제 / Lead flow별 1~2문장 / Body MVP+양팀 최다득점 / Stats 4카드 점수차·쿼터승·총득점·리드체인지). 헬퍼 5개 module-level: `josa()` 한글 받침→조사 / `buildScoreSeries()` PBP points_scored 누적 (score_at_time 부재 회피) / `countLeadChanges()` 부호 변화 카운트 / `findMaxLead()` 최대점수차+leader / `classifyFlow()` 8 flow 분류 (overtime/lastminute/comeback/seesaw/blowout/dominant/narrow/default) + `hasLastMinuteLeadChange()` 마지막 60s + `generateLead()` flow별 템플릿. LLM 호출 0 / API·DB 변경 0 / 13룰 정합 (var(--*), lucide ❌, pill 9999 ❌) / 모바일 분기 (1열 + Stats 4→2). tsc PASS. 5/2 D-day 라이브 매치 즉시 효과. Phase 1 (Gemini 2.0 Flash) 의 fallback 으로 자연 활용. | ✅ |
| 2026-05-02 | (계획만) | **BDR 기자봇 시스템 기획 — LLM 기반 매치 단신 기사 생성 (옵션 A→B 확장)** — `Dev/bdr-reporter-bot-plan-2026-05-02.md` 박제 (16 섹션 / 페르소나·LLM비교·prompt초안·few-shot 2건·검증룰 7·캐시·Phase 0~6·비용·UI·학습사이클·확장콘텐츠 7·위험 10·Q1~Q7). 추천: Sonnet 4.5 + prompt caching → 매치당 $0.012, 월 $2.4 (200매치). Phase 0 (옵션 A 템플릿 30분) D-day 즉시 + Phase 1+ (LLM) D-day 종료 후 사용자 결정 Q1~Q7. 코드/DB/LLM 호출 0 | ✅ |
