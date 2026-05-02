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
