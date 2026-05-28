# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 2 v2.20 sync ✅ 완료 → 다음 = Phase 1C 잔여 12 PR batch (PR-1C-5~16) 진입 결재 대기
- **상태**: Phase 2 sync commit `dca96f6` push 완료 / PR-1C-1~4 PR #650 누적
- **현재 담당**: pm (batch 진입 사용자 결재 대기)
- **참고**: phase-ledger source of truth — Phase 1 ⑪ = PR-1C-1~4 ✅ (잔여 12 PR) / Phase 2 ⑩ ✅ (Phase 2C 운영 박제 미진입) / batch 의뢰서 = `phase-1C-batch-cli-prompt-2026-05-28.md`

## 기획설계 (planner-architect)
(아직 없음)

## 구현 기록 (developer / PR-1C-6 옵션 A — Matches 표 시각 박제)

📝 구현한 기능: 대회 관리 > 경기 관리 매치 목록을 시안 amt-table 표 스타일로 박제 (시각만 / 데이터·onClick 100% 유지)

### 분석 (PM 승인 옵션 A 범위 그대로)
- **시안 source**: `BDR-current/admin.css` L933~960 (amt-table) + `screens/AdminTournamentMatches.jsx` L136~175 (마크업). 컬럼 = 시간/코트/종별/대진/스코어/상태/(버튼)
- **운영 baseline**: `matches-client.tsx` L644~719 = 라운드별 `<Card>` 한 줄 카드 리스트. `useRoundNameFallback`/`rounds`/`filteredMatches` 그룹화 로직 보유
- **토큰 검증**: 시안 amt-table 사용 토큰 중 운영 globals.css 정의 여부 확인 — `--bg-elev/--bg-alt/--border/--ink/--ink-soft/--ink-mute/--ink-dim/--ff-mono/--cafe-blue-deep/--cafe-blue-soft` = **전부 정의됨** → 그대로 사용. 미정의 = `--r-md → --radius-card` / `--r-xs → 4px` 대체 (승인 계획 그대로)
- **amt-mode (기록 모드 3-card)**: 박제 안 함 — 운영 기록 모드 = ScoreModal 안 select 토글 보존 (충돌 회피)
- **vban (검증 배너 3-tone)**: 박제 안 함 (mock 금지) — 운영 PlaceholderValidationBanner 보존

### 변경 파일
| 경로 | 변경 | 신규/수정 | LOC |
|------|------|----------|-----|
| `.../matches/matches-admin.css` | 시안 amt-table 박제 — `.amt-table-wrap`/`.amt-table`/thead·tbody/`__teams`(+vs)/`__score`(+ph)/`__court`/`__time`/`__div` + 모바일 ≤768px 가로 스크롤. 토큰 대체: `--r-md → --radius-card` / `--r-xs → 4px`. 나머지 운영 globals 정의 그대로. 하드코딩 색상 0건 | 신규 | 113 |
| `.../matches/matches-client.tsx` | import +1 (matches-admin.css) / L644~719 라운드별 한 줄 카드 리스트 → 라운드별 `<table class="amt-table">` 표로 교체 (라운드 헤더·그룹화·`onClick=setSelectedMatch` 행 단위 유지). 컬럼 7종 (시간/코트/종별/대진/스코어/상태/#번호). 승자 success 톤 보존 / STATUS_LABEL·STATUS_COLOR 보존 | 수정 | -64/+97 (순증 +33) |

### 데이터 매핑 (전부 운영 진짜 — mock 0)
| 시안 컬럼 | 운영 데이터 | 처리 |
|---------|----------|------|
| 시간 | scheduledAt | toLocaleDateString (null 시 "미정") |
| 코트 | venue_name | amt-table__court 칩 (null 시 "-") |
| 종별 | getMatchDivision(m) | amt-table__div (null 시 "-") |
| 대진 | homeTeam.team.name vs awayTeam.team.name | 승자 = `text-[var(--color-success)]` 톤 보존 (미정 폴백) |
| 스코어 | homeScore : awayScore | amt-table__score |
| 상태 | STATUS_LABEL[status] + STATUS_COLOR[status] | 운영 톤 그대로 |
| 버튼 (입력/수정/준비) | 운영은 행 전체 클릭 = 모달 | 버튼 대신 #match_number 표시 (onClick 흐름 보존) |

### 검증 결과
- **tsc --noEmit**: 0 errors (EXIT=0)
- **자체 회귀 6 케이스**:
  | # | 케이스 | 결과 |
  |---|--------|------|
  | 1 | AppNav main bar dropdown/아바타 | OK (AppNav 변경 0 — admin matches 페이지만) |
  | 2 | 모바일 듀얼 라벨 | OK (AppNav 변경 0) |
  | 3 | 검색/쪽지/알림 box | OK (AppNav 변경 0) |
  | 4 | 하드코딩 색상 | css 0건 (전부 var(--*) + 4px radius) / tsx 0건 (success 톤도 토큰) — §6-1 예외 불필요 |
  | 5 | lucide-react | 0 (Material Symbols 도 본 변경엔 미추가) |
  | 6 | 9999px / rounded-full | 0 (matches-client L389 매치 = 기존 금지 안내 주석, 위반 아님) |
  | - | 가짜링크 | 0 (라우팅 변경 0 — onClick=모달만) |
- **LOC**: 순증 +33 (계획 +30~50 LOC 범위 내) + css 113줄 (계획 ~50줄 대비 다소 많으나 시안 amt-table 전체 + 모바일 분기 + 주석 포함 — 폭증 기준 +400 한참 미만)

### 알림
- **vban (검증 배너 3-tone) 박제 보류**: 옵션 A 범위 제외 (mock 금지). 운영 PlaceholderValidationBanner 보존 — 향후 vban 박제 = 별 PR (사용자 판단)
- **amt-mode (기록 모드 3-card) 박제 보류**: 운영 기록 모드 토글 = ScoreModal 내 select 보존. 시안 3-card 모드 선택 UI 박제 시 운영 모달 흐름과 충돌 → 미박제
- **시안 "입력/수정/준비" 버튼 → #번호 대체**: 운영은 행 전체 클릭이 이미 ScoreModal 오픈 → 별도 액션 버튼 불필요. 시안 버튼 자리에 경기 번호 표시 (정보 손실 0)
- **Card import 유지**: 빈 상태("경기가 없습니다" L627 / "선택 종별 매치 없음" L640) 에서 계속 사용 → 제거 안 함
- **API / fetch / Prisma / DB / route.ts 변경 0** — GET /matches·/teams 호출 동일, PATCH·recording-mode 동일
- **commit/push/PR 은 PM 담당**

💡 tester 참고:
- **로컬 검증**: `npm run dev` → http://localhost:3001/tournament-admin/tournaments/[id]/matches (운영자 로그인 + 매치 생성된 대회)
  - 라운드별로 **표(table)** 노출 — 헤더: 시간/코트/종별/대진/스코어/상태/# (모노 폰트 대문자)
  - 행 hover → 배경 강조 (`--bg-alt`) / 행 클릭 → **기존 ScoreModal 오픈** (점수/상태/팀/기록모드 수정 — 회귀 0)
  - 대진 셀: 홈 `vs` 원정, 승자 팀명 = 초록(success) 톤
  - 스코어 셀: `N : M` 모노 폰트 / 종별·체육관 필터 적용 시 표도 즉시 갱신
  - 모바일 (≤768px): 표 가로 스크롤 (min-width 600px)
- **정상 동작**:
  - scheduledAt null 매치 → 시간 "미정" / venue_name null → 코트 "-" / division 없음 → 종별 "-"
  - 다중 종별/체육관 대회 → 상단 필터 chip 그대로 작동 (표가 필터 결과 반영)
  - 매치 0건 → "경기가 없습니다" 카드 (회귀 0) / 필터 0건 → "선택 종별 매치 없음" 카드
- **주의할 입력**:
  - winner_team_id 설정된 매치 → 승자 팀명만 초록 / 미정 매치 → "미정" 텍스트
  - paper 기록 모드 매치 → 모달에서 종이 기록지 이동 버튼 보존 (본 PR 미변경)
  - 운영 DB 영향 0

⚠️ reviewer 참고:
- **표 변환 시 데이터/핸들러 100% 보존**: `setSelectedMatch(match)` onClick 을 `<div>` → `<tr>` 로 위치만 이동. 라운드 그룹화(`useRoundNameFallback`/`rounds`/`roundMatches`) 변경 0
- **승자 success 톤**: 시안 amt-table 은 승자 강조 없음(중립 표) → 운영 기존 success 톤 정책 유지 위해 `<b className=...success>` 로 흡수 (시안 + 운영 정책 병합)
- **css 113줄**: 시안 amt-table 전체(28줄) + 모바일(8줄) + 주석/포맷. amt-mode/vban 미박제로 시안 대비 축소. 향후 표 외 영역 박제 시 같은 파일 확장 가능
- **API/Prisma 0 변경**

## 구현 기록 (developer / PR-1C-5 UC1 MyActivity 박제)

📝 구현한 기능: /profile/activity 마이페이지 활동 뷰에 시안 v2.20 승인 3건 박제
- ① 대회 탭 카드 → `MyRegistrationStatus variant="compact"` 재사용 (PR-1C-2 결과 / 위치 이동 ❌ import 만)
- ② 5 상태 필터 chip row 추가 (시안 `.ma-filter` / 탭=도메인 / 필터=상태 공존)
- ③ 매너 카드 = 데이터 없음 → hide (mock ❌ / 운영 page.tsx 애초 미존재 → 추가 안 함으로 자동 충족)

### 분석 (PM 결재 승인 방향 그대로)
- **시안 v2.20 MyActivity.jsx** (151 LOC): `window.MY_TOURNAMENTS/MY_GAMES/MY_MANNER` mock + `window.GMStatusBadge/GMKindBadge/ApplyStep/MannerCard` 컴포넌트 의존 = 운영에 부재 → 시안 "재구성" ❌, 운영 위에 승인 3건만 얹는 것이 정답
- **운영 page.tsx**: 이미 v2.18 박제 완료 (3탭 games/tournaments/teams + counters 4종 + 카드 borderBottom 행). 본 PR = 그 위에 필터/compact 추가
- **시안 css 박제 범위 최소화**: `.ma-filter*` 5종 클래스만 박제. `.ma-page/.ma-shell/.ma-side*/.ma-stat*/.ma-list/.ma-empty` = 운영 자체 구현 보존 → 미박제 (중복 방지). 특히 `.ma-stat--accent` 의 `var(--accent-hair)` = 운영 globals.css 미정의 → stat 영역 자체를 박제 안 해 회피

### 변경 파일
| 경로 | 변경 | 신규/수정 | LOC |
|------|------|----------|-----|
| `_components/my-activity.css` | 시안 `.ma-filter` chip row 만 박제 — `.ma-filter`/`.ma-filter__chip`/`.is-on`/`.ma-filter__count` + 모바일 가로 스크롤. 토큰 대체: `--r-sm → --radius-chip` (운영 정의 6px). 나머지 (`--border-strong/--bg-elev/--bg-alt/--ink/--ink-soft/--ink-dim`) 운영 그대로. `#fff` 1건 = is-on chip `--ink` 배경 위 흰 글자 (시안 원본 §6-1) | 신규 | 84 |
| `page.tsx` | imports +2 (MyRegistrationStatus + NormalizedReg 타입 / my-activity.css) / `STATUS_FILTERS` 5종 + `itemBucket()` 상태 분류 + `toNormalizedReg()` 변환 헬퍼 추가 / `statusFilter` state + `filterCounts` + `filteredItems` / `.ma-filter` chip row 렌더 (탭 nav 아래) / 본문 분기에 "대회 탭 → MyRegistrationStatus compact stack" + "필터 후 0건 안내" 추가 / 경기·팀 탭은 filteredItems 기반으로 / **미사용 TournamentCard 함수 90 LOC 제거** (compact 교체로 dead code) | 수정 | -102/+158 |
| `tournaments/[id]/_components/my-registration-status.tsx` | `NormalizedReg` interface `export` 추가 (UC1 변환 헬퍼 타입 매칭용) — 컴포넌트 동작 변경 0 | 수정 | +3/-1 |

### 데이터 매핑 결정 (TournamentItem → NormalizedReg)
| 시안 reg 필드 | 운영 TournamentItem | 처리 |
|---------|----------|------|
| tn_name | tournament.name | 진짜 |
| team_name | team.name | 진짜 |
| status | item.status (pending/approved/registered/rejected/cancelled) | StatusKey 매핑 (rejected→rejected / cancelled→completed / approved·registered→approved / 그 외→pending) |
| step_idx | status 도출 | approved=2 / pending=1 / 그 외=0 (운영 결제·진행 미구분 → 승인까지만) |
| division | 운영 미포함 | "참가" 폴백 (mock ❌ / 데이터 없음 명시) |
| next_action | status 도출 | "승인 대기 중"/"확정"/"거절" — 상태에서 도출 (mock 문구 ❌) |
| submitted_at | created_at | formatApplied() 재사용 |

### 검증 결과
- **tsc --noEmit**: 0 errors (EXIT=0) — TournamentCard 제거 후 재검증도 0
- **자체 회귀 검수 6 기본 케이스**:
  | # | 케이스 | 결과 |
  |---|--------|------|
  | 1 | AppNav main bar 우측 dropdown/아바타 | OK (AppNav 변경 0 — profile/activity 만 수정) |
  | 2 | 모바일 듀얼 라벨 | OK (AppNav 변경 0) |
  | 3 | 검색/쪽지/알림 box | OK (AppNav 변경 0) |
  | 4 | 하드코딩 색상 | 본 PR 신규 css = **하드코딩 0건** (시안 is-on chip `#fff`/`rgba(255,255,255,.7)` → `var(--bg)`/`color-mix(--bg 70%)` 치환 = 다크모드 대비 버그 동시 해결). page.tsx `#fff` 1건 = **기존 EmptyState CTA** (본 PR 무관) / 본 PR 신규 tsx 코드는 100% 토큰 |
  | 5 | lucide-react import | 0 (Material Symbols 만) |
  | 6 | 9999px / rounded-full | 0 (MyRegistrationStatus 의 step dot 50% 정사각은 기존 PR-1C-2 분 / 본 PR 신규 0) |
  | - | 가짜링크 | 0 (`/tournaments/${id}` router.push + 기존 `/games`·`/teams`·`/tournaments` Link = 운영 라우트) |
- **design 회귀 스크립트** (`scripts/check-design-regression.sh`): profile/activity·my-activity.css 매치 위반 0건

### 알림
- **시안 ↔ 운영 불일치 (디자인·API 변경 ❌)**:
  - 시안 mock `MY_TOURNAMENTS` 의 `division/next_action` → 운영 TournamentItem 미포함 → `toNormalizedReg()` 폴백 ("참가" / status 도출 문구). 향후 /api/web/me/activity 응답에 division 추가 시 자연 흡수
  - 시안 "내 경기" 섹션 (BG6 / `ApplyStep`·`GMKindBadge` 의존) → 운영은 기존 GameCard borderBottom 행 보존 (시안 신규 컴포넌트 미박제 — 운영 데이터 한계). 별 PR
  - 시안 "내 매너" 카드 (BG2 / `MannerCard` + `MY_MANNER` mock) → 운영 데이터 부재 → **hide** (mock ❌). Phase 2 매너 API 후 별 작업
  - 시안 좌측 사이드바 (`.ma-side` 프로필 + nav) → 운영은 단일 컬럼 `.page` + PageBackButton 보존 (시안 사이드바 미박제 — 운영 구조 보존)
  - 시안 stat strip (`.ma-stat` 4종) → 운영이 이미 자체 Tailwind grid 로 counters 박제 (v2.18) → 보존
- **3탭 구조 + counters 4종 보존**: games/tournaments/teams 탭 + 검토중/승인·확정/거절/취소 카운터 = 변경 0. 필터는 **추가** (탭 위에 공존)
- **TournamentCard 90 LOC 제거**: compact 교체로 호출처 0 → dead code 정리 (가독성). STRING_STATUS/rowAccent/formatWhen 은 TeamCard·GameCard 가 계속 사용 → 보존
- **API / fetch / Prisma / route.ts / DB 변경 0** — /api/web/me/activity 호출 3탭 병렬 fetch 동일
- **commit/push/PR 은 PM 담당**

💡 tester 참고:
- **로컬 검증**: `npm run dev` → http://localhost:3001/profile/activity (로그인 필요)
  - **필터 chip row** (탭 아래): "전체" + 검토중/승인·확정/거절/취소 (해당 탭에 카운트 > 0 인 상태만 chip 노출 / 전체는 항상)
    - chip 클릭 → 현재 탭 항목을 해당 상태로 필터 (리스트 즉시 갱신)
    - 활성 chip = `--ink` 배경 + 흰 글자 (다크/라이트 모두 대비 OK)
  - **대회 탭**: 카드 = MyRegistrationStatus compact (대회명 + status pill + "참가" 부문 + 팀명 + 신청시각 + 5 STEPS 인디케이터 + next action + "대회 상세" 버튼)
    - 카드 제목/버튼 클릭 → `/tournaments/${id}` 라우팅
    - 5 STEPS: 신청→대기→승인→결제→진행 (운영은 승인까지만 step 진행 / 결제·진행 미구분)
  - **경기 탭 / 팀 탭**: 기존 borderBottom 행 카드 100% 유지 (회귀 0). 팀 탭 pending = "신청 취소" 버튼 보존
  - **탭 전환 시**: 필터 자동 "전체" 초기화
  - **모바일 (≤720px)**: 필터 chip row 가로 스크롤
- **정상 동작**:
  - 대회 신청 0건 → EmptyState "아직 신청한 대회가 없어요" + CTA
  - 대회 신청 있음 + "검토중" 필터 → pending 상태 대회 카드만 (compact)
  - 필터로 0건 (이론상) → "해당 상태의 신청 내역이 없습니다"
- **주의할 입력**:
  - tournament.status = "registered" → "승인·확정" 버킷 (approved 동의어)
  - tournament.status = "cancelled" → "취소" 버킷 / compact 에선 completed 톤
  - division 데이터 없음 → compact 카드 "참가" 표시 (정상 / 운영 미포함)
  - 운영 DB 영향 0 (API/fetch/schema 변경 0)

- **🔧 다크모드 대비 버그 사전 해결 (시안 원본 변경)**: 시안 is-on chip `color:#fff` / count `rgba(255,255,255,.7)` 은 라이트모드 전제(`--ink`=어두운 배경 → 흰 글자 OK). 그러나 globals.css 확인 결과 **다크모드 `--ink: #F6F7F9`(밝은색)** → 흰 글자면 `--ink` 밝은 배경 + 흰 글자 = **대비 0 (텍스트 안 보임) 버그**. 운영은 다크모드 기본이라 그대로 박제 시 다크에서 칩 글자 사라짐. → `var(--bg)` 치환 (라이트 #F4F6FA / 다크 #0B0D10 = `--ink` 와 항상 반대 명암) + count 는 `color-mix(--bg 70%)`. **하드코딩 #fff 제거 + 다크 대비 동시 해결**. 시안 그대로보다 정확한 박제 (검수 사전 발견)

⚠️ reviewer 참고:
- **toNormalizedReg `division: "참가"` 폴백**: 운영 TournamentItem 에 부문 데이터 없어 고정 문구. mock 아닌 "데이터 없음" 명시 폴백. /api/web/me/activity 응답 확장 시 division 매핑만 추가하면 자연 흡수
- **MyRegistrationStatus cross-route import**: `tournaments/[id]/_components/` → `profile/activity/page.tsx` import (위치 이동 ❌ / PR-1C-2 결정 준수). 컴포넌트가 route segment 폴더에 있지만 `_components` prefix 라 라우팅 비대상 → import 안전
- **TournamentCard 90 LOC 제거**: dead code 정리. reviewer 가 "git history 보존 위해 주석 처리 선호" 시 되돌림 가능하나 기본은 제거 (가독성)
- **NormalizedReg export**: 타입만 export 추가 / 런타임 변경 0

#### 수정 이력
(아직 없음 — tester/reviewer 피드백 시 추가)

## 구현 기록 (developer / PR-1C-4 UA3 B3 결제 보강 + 사후 안내 박제 / 옵션 B)

### 분석
- **시안 구조** (TournamentEnroll.jsx 277 LOC / tournament-enroll.css 265 LOC):
  - 결제 step (`te-pay`) — 2-column grid: [결제수단 (te-method + te-bank)] | [명세 (te-bill) + 안내 (te-pay__note)]
  - 사후 안내 (`te-success`) — 체크 아이콘 (72px ok 배경) + eyebrow ENROLLMENT COMPLETE + h1 + sub + 3 STEPS + CTA 2개
- **시안 결제수단 3 옵션**: bank / manual / card → **옵션 B 채택 = bank 단일만 박제** (사용자 결재). manual·card·토스 Phase B 별 PR.
- **운영 상태**:
  - `[id]/join/page.tsx` 1563 LOC = 이미 v2 박제됨 (Phase 7-1 / 5-step·4-step adaptive / `_v2/` 4 컴포넌트 추출 완료)
  - 결제 step inline (L1280~1473 = ~193 LOC) — 신청 요약 카드 + 입금 안내 + 약관 동의
  - done 분기 (L408~524 = ~117 LOC) — 체크 + 메시지 + 입금 안내 + CTA 2개
- **운영 데이터 매핑**:
  | 시안 영역 | 운영 데이터 | 처리 |
  |---------|----------|------|
  | te-method (bank) | always active (옵션 B) | 시각만 / payment_status 무관 |
  | te-bank (운영팀 입금 계좌) | tournament.bank_name/bank_account/bank_holder/fee_notes | 진짜 / bank_name null 시 카드 hide |
  | te-bill 결제 명세 | selectedTeam + manager + cat/div + roster + fee | 진짜 (분기 보존 — selectedCategory 있을 때만 부문 row 노출) |
  | te-pay__note | 시안 카피 그대로 | 시안 보존 (운영 카피 일부 흡수) |
  | 약관 동의 (agreeRules/agreeMedia) | 운영 흐름 보존 | 시안 te-pay 외 영역 (시안 미존재 — 운영 고유 흐름 보존) |
  | te-success | result {id, status, waiting_number, message} | 진짜 / status 분기 (waiting/approved/pending) sub 카피 변경 |
- **5/4-step adaptive 보존**: hasCategories=true → 5-step (디비전 포함) / false → 4-step. 본 PR 결제 step + done 분기만 변경. stage 매핑 변경 0.
- **약관 동의 step 보존**: 운영 page.tsx L144 `Step 5+: 결제 동의` 변수 (agreeRules / agreeMedia) → 결제 step 안에서 게이트. 본 PR 에서도 EnrollStepPayment 내부로 이전 (UX 동일).

### 변경 파일
| 경로 | 변경 | 신규/수정 | LOC |
|------|------|----------|-----|
| `_v2/tournament-enroll.css` | 시안 css 박제 — `te-h3` / `te-pay` 2-column / `te-method` (bank is-on) / `te-bank` (운영팀 입금) / `te-bill` (명세) / `te-pay__note` (cafe-blue 콜아웃) / `te-success__*` (hero / icon / 3 STEPS / CTA) / 모바일 ≤720px 분기. 토큰 대체: `--r-sm/md/lg` → `4/6/8px` (운영 globals 미정의) | 신규 | 316 |
| `_v2/enroll-step-payment.tsx` | 결제 step 박제 — bank 단일 결제수단 (옵션 B) / te-bank 입금 계좌 (bank_name 가드) / te-bill 명세 (참가팀+대표자+부문분기+로스터+합계) / te-pay__note 안내 / 약관 동의 2종 (운영 보존). API·payment_status 변경 0 / 계좌번호 복사 버튼 운영 보존 | 신규 | 255 |
| `_v2/enroll-success-hero.tsx` | 사후 안내 hero — te-success 체크 아이콘 72×72 (50% 정사각) + eyebrow ENROLLMENT COMPLETE + h1 (result.message) + sub (status 분기 — waiting/approved/pending) + 3 STEPS (서류검토/결제확인/참가확정) + CTA 2개 (`/games/my-games` + `/tournaments/${id}`) | 신규 | 125 |
| `page.tsx` | imports +3 (EnrollStepPayment / EnrollSuccessHero / tournament-enroll.css) / done 분기 inline 117 LOC → `<EnrollSuccessHero result onMyApplications onTournamentDetail />` 12 LOC / 결제 stage inline 193 LOC → `<EnrollStepPayment {...12 props} />` 13 LOC. _v2/ 기존 4 컴포넌트 (stepper/aside/poster/step-docs) 변경 0. 5/4-step adaptive 분기 보존. API/POST /api/web/tournaments/[id]/join 변경 0 | 수정 | 1563 → 1292 (-271) |

### 검증 결과
- **tsc --noEmit**: 0 errors (EXIT=0)
- **자체 회귀 검수 6 기본 케이스**:
  | # | 케이스 | 결과 |
  |---|--------|------|
  | 1 | AppNav main bar 우측 dropdown/아바타 | OK (AppNav 변경 0) |
  | 2 | 모바일 듀얼 라벨 | OK (AppNav 변경 0) |
  | 3 | 검색/쪽지/알림 box | OK (AppNav 변경 0) |
  | 4 | 하드코딩 색상 | tsx 0건 / css 시안 원본 (`#fff` 2건 = accent 위 흰 글자 / `rgba(28,160,94,0.32)` ok 토큰 alpha shadow) — 운영 미정의 토큰 §6-1 시안 우선 |
  | 5 | lucide-react import | 0 (본 PR 신규 3 파일) |
  | 6 | 9999px / rounded-full | 0 (정사각형 50% 만: te-success__icon 72×72 / te-success__step-n 26×26) |
  | - | 가짜링크 | 0 (`/games/my-games` + `/tournaments/${id}` = 운영 라우트) |
- **UA3 추가 검수 (의뢰서 §7)**:
  | # | 케이스 | 결과 |
  |---|--------|------|
  | + | 5-step (hasCategories=true) / 4-step (false) adaptive 보존 | OK (stage 매핑 분기 / steps 배열 변경 0) |
  | + | Step 5 결제 = bank 단일 + 결제 명세 카드 + 입금 안내 카드 | OK (te-method.is-on 1건 / te-bill + te-bank) |
  | + | Step done 사후 = "신청이 접수되었습니다" success hero + CTA | OK (te-success__title result.message 폴백 + CTA 2개) |
  | + | 우측 sticky aside (포스터 + D-카운터 + 환불 정책) 보존 | OK (EnrollAside 컴포넌트 변경 0) |
  | + | enroll-stepper 시각 = 시안 te-stepper 클래스 일치 | 보존 (의뢰서 §5 "_v2/ 기존 4 변경 최소") |
  | + | payment_status (unpaid → paid 전환) 운영 변경 ❌ | OK (POST /api/web/tournaments/[id]/join 호출 동일) |
  | + | /api/web/tournaments/[id]/join route.ts 변경 ❌ | OK (route.ts 변경 0) |
  | + | 토스페이먼츠 코드 0 | OK (Phase B 별 PR) |
  | + | 새 라우트 [id]/join/success/ 생성 ❌ | OK (done 분기 안에서만 렌더) |

### 결정 사항
- **옵션 B 채택** (사용자 결재 / 의뢰서 §4 권장안) — bank 단일 결제수단만 시각 박제. manual·card·토스페이먼츠 = Phase B 별 PR (현재 schema line 1299 주석 토스 미연결)
- **_v2/ 기존 4 컴포넌트 (stepper / aside / poster / step-docs) = 변경 0** — 의뢰서 §5 "변경 최소" 룰 준수. 시안 te-stepper 시각 정렬은 후속 PR
- **약관 동의 step 보존** — 운영 5/4-step adaptive 의 마지막 step 안에 게이트. EnrollStepPayment 내부로 흡수 (UX 동일 / 제출 버튼 활성화 게이트 동일)
- **CTA 2개** — `/games/my-games` (시안 "내 참가 현황" → 운영 라우트 매핑) + `/tournaments/${id}` (대회 상세). 시안 카피 "내 신청 내역 보기" + "대회 상세로"
- **API / Prisma / route.ts / payment_status 변경 0** — 시각만 박제 (의뢰서 §6 룰)

### 알림
- **시안 ↔ 운영 불일치 (디자인 변경 ❌, API 변경 ❌)**:
  - 시안 PAYMENT_METHODS 3 옵션 (bank / manual / card) → 옵션 B 룰: bank 1 건만 박제 (manual 옵션 박제 보류 — 운영에 manual flag 부재 / card 옵션 = 토스 미연결)
  - 시안 te-bill 의 "보험료 (의무가입) 15,000원" 행 → 운영 보험료 데이터 X → 미박제 (mock ❌). 향후 insurance 필드 추가 시 자연 흡수 가능
  - 시안 te-success 의 "결제는 3일 내" 카피 → 운영 pay_due_days 데이터 X → "3일 내" 기본값 박제 (시안 카피 보존). 향후 Tournament.pay_due_days 필드 추가 시 자연 흡수
  - 시안 mobile sticky bottom CTA (te-mobile-cta) → 운영 sticky CTA 2026-05-02 사용자 결정으로 삭제됨 (PR-1C-2 결정 답습) → 본 PR 미추가
- **page.tsx LOC 감소 271** — inline 결제 step (193) + done 분기 (117) → 컴포넌트 호출 (13 + 12) + import 4. 가독성 + 재사용성 향상
- **commit/push/PR 은 PM 담당** (의뢰서 §Step 9~11)

💡 tester 참고:
- **로컬 검증**: `npm run dev` → http://localhost:3001/tournaments/[id]/join 접속 (로그인 + 주장 + 신청 가능 대회)
  - **5-step 흐름 (hasCategories=true 대회)**: 대회확인 → 디비전 → 로스터 → 서류 → 결제 → 신청 후 done
  - **4-step 흐름 (hasCategories=false 대회)**: 대회확인 → 로스터 → 서류 → 결제 → 신청 후 done
  - **결제 step (Step 5/4)**:
    - 좌측 col: "계좌이체" 단일 카드 (is-on / accent border) + 입금 계좌 안내 카드 (은행/계좌/예금주 + 입금자명 가이드 + 계좌번호 복사 버튼)
    - 우측 col: 결제 명세 (참가팀/대표자/부문분기/로스터/합계 — accent 색) + 안내 콜아웃 (cafe-blue 톤)
    - 하단: 약관 동의 2종 (대회 규정 / 미디어) — 둘 다 체크해야 제출 버튼 활성
  - **사후 안내 (done=true)**:
    - 체크 아이콘 (72px ok 녹색 배경 + 흰 체크)
    - eyebrow "ENROLLMENT COMPLETE"
    - h1 = result.message (서버 응답)
    - sub = status 분기 (waiting → 대기 순번 / approved → 참가 확정 / pending → 승인 대기)
    - 3 STEPS (서류 검토 / 결제 확인 / 참가 확정)
    - CTA 2개: "내 신청 내역 보기" → `/games/my-games`, "대회 상세로" → `/tournaments/${id}`
  - **모바일 (≤720px)**:
    - te-pay 2-column → 1-column 변환
    - te-success__title 32px → 24px 축소
    - te-success padding 60px → 40px 축소
- **정상 동작**:
  - 결제 step 진입 시 te-method (계좌이체) 자동 활성 (is-on 클래스 + accent border)
  - bank_name null 인 대회 → te-bank 카드 자동 hide / te-bill + te-pay__note 만 노출
  - 약관 미체크 → 제출 버튼 disabled (운영 흐름 보존)
  - 제출 성공 → done 분기 진입 → te-success hero
  - waiting 상태 → "대기 순번 N번" 카피 / approved → "참가가 확정되었습니다" / 그 외 → "관리자 승인 시 알림"
- **주의할 입력**:
  - `tournament.bank_name === null` 대회 → 입금 계좌 카드 자동 hide / 결제 명세 + 약관만 노출 (정상)
  - `tournament.entry_fee === 0` 대회 → te-bill "총 참가비 무료" 표시
  - hasCategories=false 대회 → te-bill 의 "부문 / 디비전" row 자동 hide
  - `result.status === "waiting"` → waiting_number 노출 / "approved" → 즉시 확정 / null → 기본 안내
  - 운영 DB 영향 0 — schema / route.ts / payment_status 변경 0

⚠️ reviewer 참고:
- **css 시안 원본 보존 (`#fff` 2건 / `rgba(28,160,94,0.32)` 1건)**: te-success__icon shadow + 흰 체크 + step number 흰 글자. 운영 globals.css 에 동등 토큰 미정의 (사용자 §6-1 시안 우선 룰). 향후 토큰 추가 시 var() 전환 가능
- **EnrollStepPayment props 12개**: tournament + 6 form state + 2 agree + 2 setter + 2 derived. 운영 page.tsx 가 single state owner — 컴포넌트는 stateless. props drilling 우려 시 후속 PR 에서 reducer 추출 가능
- **te-method bank 단일 always active**: 옵션 B 룰 — radio readOnly + onChange 없음. 향후 manual / card 추가 시 useState method + onMethod 콜백으로 자연 확장 가능 (시안 PAYMENT_METHODS 패턴 그대로)
- **약관 동의 위치 변경**: 운영 page.tsx 결제 step inline → EnrollStepPayment 내부. 시각 변경 0 / 제출 게이트 동일 (agreeRules + agreeMedia 둘 다 true 일 때만 제출 버튼 활성)
- **API/route.ts 호출 0 변경**: POST /api/web/tournaments/[id]/join 응답 스펙 (id/status/waiting_number/message) 그대로 사용. payment_status 변경 0

#### 수정 이력
(아직 없음 — tester/reviewer 피드백 시 추가)

## 구현 기록 (developer / PR-1C-3 UB1 TournamentCompleted 박제)

### 분석
- **시안 구조** (216 LOC TournamentCompleted.jsx):
  - Hero band — 🏆 champion + eyebrow ({name} · {edition} CHAMPION) + meta (ended_at · venue · divisions) + 4 통계
  - 5 카드 grid (6 col span layout): 01 standings (span 2) / 02 MVP·Best5 (span 4) / 03 photos (span 4) / 04 story (span 2) / 05 next (span 6)
  - Share bar — URL/카카오/인스타 공유 + 다른 대회
- **운영 데이터 spec 매핑**:
  | 시안 영역 | 운영 데이터 | 처리 |
  |---------|----------|------|
  | Hero champion | `champion_team_id` + Tournament.teams (Team) | 진짜 — null 시 fallback "종료된 대회" |
  | Hero 통계 4종 | TournamentMatch agg | 운영 미지원 → 엔트리 1개 (champion team_count) 외 3종 hide |
  | 최종 순위 | TournamentTeam.final_rank 1~3 + team relation | 진짜 — 빈 배열 시 카드 hide |
  | MVP·Best5 | `mvp_player_id` + User (nickname / name / profile_image_url) | MVP only fallback (Best5 운영 X → 미렌더) |
  | 갤러리 | 운영 X | 빈 배열 전달 → 카드 자동 hide |
  | 알기자 (스토리) | `description` ≥ 60자 | 진짜 — 너무 짧으면 hide |
  | 다음 회차 | series.tournaments 안 edition_number+1 | 진짜 — 별도 query 추가 ❌ (page.tsx 이미 series fetch) |
- **추가 Prisma query 1건**: TournamentTeam standings (final_rank in [1,2,3]) — 의뢰서 §3 mock 금지 + standings 카드 필수 데이터
- **status 분기 위치**: page.tsx 비공개/insider 가드 직후 (L287) — 분기 진입 시 V2TournamentHero / V2RegistrationSidebar / Tabs 등 22 기존 컴포넌트 미렌더 (시안 의도 — 종료 후 무의미)
- **신규 라우트 ❌**: 동일 [id]/page.tsx 분기만 (의뢰서 §2 룰 통과)

### 변경 파일
| 경로 | 변경 | 신규/수정 | LOC |
|------|------|----------|-----|
| `_components/tournament-completed.css` | 시안 css 박제 (`tc-*` 클래스) — `--r-*` → `--radius-*` 토큰 대체 / 챔피언 골드 (#FBF6E6/#E8D9A7/#D4A52E) + 다크 hero (#14181F/#1F242E/#1A1E27/#2A1015) + 텍스트 흰 + mvp 핑크 #FCE4E7 + eyebrow #FFD66B = 시안 원본 보존 (사용자 §6-1 시안 우선) / tablet media query 추가 (≥721 ≤1023 = 2 col) | 신규 | 343 |
| `_components/tournament-completed-hero.tsx` | Hero band — champion null fallback "종료된 대회" / 통계 4종 중 엔트리만 진짜 (3종 운영 X → hide / mock ❌) / getInitials 폴백 (logo null 시 이니셜) | 신규 | 145 |
| `_components/tournament-final-standings-card.tsx` | 최종 순위 (rank 1~3) — is-champ class rank=1 / 빈 배열 가드 / "전체 대진표 보기" Link `?tab=bracket` (가짜링크 ❌) | 신규 | 102 |
| `_components/tournament-mvp-best5-card.tsx` | MVP only — best5 운영 X → 미렌더 (mock ❌) / 헤더 "MVP · 베스트5" → "MVP" 단축 / statText null hide | 신규 | 63 |
| `_components/tournament-gallery-card.tsx` | 운영 X → photos.length === 0 시 항상 null 반환 (placeholder ❌) / 향후 photos prop 확장 시 자연 흡수 | 신규 | 75 |
| `_components/tournament-story-card.tsx` | description ≥ 60자 시 노출 / 첫 줄 ≤ 50자 = title 자동 추출 / 240자 초과 ellipsis | 신규 | 67 |
| `_components/tournament-next-edition-card.tsx` | series.tournaments 에서 edition_number > current 첫 회차 찾아 prop 전달 (별도 query ❌) / D-day 자동 계산 (D-N / D+N / TBD) / Link `/tournaments/{id}` | 신규 | 90 |
| `page.tsx` | imports: 6 카드 컴포넌트 + tournament-completed.css / select 추가: `champion_team_id` + `teams` (id/name/logoUrl + teamMembers count) + `mvp_player_id` + `users_tournaments_mvp_player_idTousers` (nickname/name/profile_image_url) / `status === 'completed'` 분기 (L287~430) — standings query 1건 + champion/mvp/nextEdition 매핑 + 5 카드 grid 렌더 + Share bar + breadcrumb (4단/2단) | 수정 | 721 → 923 |

### 검증 결과
- **tsc --noEmit**: 0 errors (EXIT=0)
- **자체 회귀 검수 6 기본 케이스**:
  | # | 케이스 | 결과 |
  |---|--------|------|
  | 1 | AppNav main bar 우측 dropdown/아바타 | OK (AppNav 변경 0) |
  | 2 | 모바일 듀얼 라벨 | OK (AppNav 변경 0) |
  | 3 | 검색/쪽지/알림 box | OK (AppNav 변경 0) |
  | 4 | 하드코딩 색상 | css 시안 원본 hex 박제 (다크 hero / 챔피언 골드 / mvp 핑크 / eyebrow yellow / 텍스트 흰) — 운영 토큰 미정의 영역 §6-1 시안 우선. tsx 0건 |
  | 5 | lucide-react import | 0 (본 PR 신규 7 파일) |
  | 6 | rounded-full / 9999px | 0 (정사각형 50% 사용: tc-hero__logo 84×84 / tc-stand__logo 26×26 / tc-mvp__av 64×64) |
  | - | 가짜링크 | 0 |
- **UB1 추가 검수**:
  | # | 케이스 | 결과 |
  |---|--------|------|
  | + | 신규 라우트 [id]/completed/ 생성 | 0 — page.tsx 분기 추가만 |
  | + | mock/placeholder 데이터 노출 | 0 — 갤러리/베스트5/통계 4종 중 3종 hide |
  | + | tc-hero / tc-card className 시안 일치 | OK |
  | + | 5 카드 grid 반응형 | OK (≥1024 6col / ≥721 2col / 모바일 1col) |
  | + | Hero champion null → fallback "종료된 대회" / 그라데이션 ❌ | OK (logo box 미렌더 + h1 텍스트만 유지 / 시안 배경 그라데이션은 보존) |
  | + | MVP mvp null → 카드 hide | OK (parent + 컴포넌트 내부 이중 가드) |
  | + | 하단 CTA 가짜링크 ❌ | OK (`/tournaments` 운영 라우트) |
  | + | 응답 키 snake_case | OK (page.tsx select `champion_team_id` / `mvp_player_id` snake_case 보존 — Prisma model 직접 매핑) |
  | + | PA7 관리자측 혼동 | 0 — `(web)/tournaments/[id]` 사용자 측 분기 |
  | + | API endpoint 추가 / 새 fetch | 0건 |

### 데이터 매핑 결정
| 시안 카드 | 운영 데이터 | 처리 |
|---------|----------|------|
| Hero 🏆 champion | Tournament.teams (via champion_team_id) | 진짜 / null 시 fallback h1 "종료된 대회" |
| Hero 통계 (엔트리) | Team._count.teamMembers (champion 팀 멤버수) | 진짜 |
| Hero 통계 (무패/평균득점/평균마진) | 운영 X | hide (mock ❌) |
| 01 최종 순위 | TournamentTeam.final_rank 1~3 + team relation | 진짜 (Prisma query 1건 추가 — 의뢰서 §3 허용분) |
| 02 MVP | Tournament.users_tournaments_mvp_player_idTousers (nickname/name/profile_image_url) | 진짜 / 통계 statText 운영 X → hide |
| 02 베스트5 | 운영 X | 미렌더 (mock ❌) |
| 03 갤러리 | 운영 X | 빈 배열 전달 → 카드 자동 hide |
| 04 알기자 (스토리) | tournament.description ≥ 60자 | 진짜 / 너무 짧으면 hide |
| 05 다음 회차 | series.tournaments 에서 edition_number > current | 진짜 (page.tsx series fetch 재사용 — 별도 query ❌) |

### 알림
- **시안 ↔ 운영 불일치 (디자인 변경 ❌, API 변경 ❌)**:
  - 시안 hero 4 통계 (엔트리/7경기 무패/68.2 평균득점/+12.4 평균마진) → 운영 데이터 X → 엔트리 1종만 진짜, 3종 hide. 향후 TournamentMatch agg API 추가 시 자연 흡수 가능
  - 시안 best5 (5명 PG/SG/SF/PF/C 라인업) → 운영 X → 미렌더. 향후 TournamentBest5 모델/API 추가 시 자연 흡수
  - 시안 갤러리 (T.photos[] 4~6장) → 운영 X → 카드 자동 hide. 향후 TournamentPhoto 모델 추가 시 photos prop 전달만 하면 자연 흡수
  - 시안 share bar (URL/카카오/인스타) → 본 PR 에서 카카오/인스타 SDK 통합 보류 (mock ❌ / 향후 클라이언트 share-tournament-button 재사용 가능) → "다른 대회 둘러보기" Link 만 운영 라우트로 박제
  - 시안 "전체 8강 보기" → 운영 bracket 탭으로 라우팅 (시안 의도 = 대진표 확인)
- **status === 'completed' 시 22 기존 컴포넌트 미렌더**: V2TournamentHero / V2RegistrationSidebar / TournamentTabs / SeriesCard / TournamentDivisionChips / TournamentOperatorPreview / V2BracketPrediction 모두 분기 안에서 미사용 (early return). 시안 의도 — 종료된 대회는 종료 발표 UI 가 전체 화면. 기존 컴포넌트 코드 자체는 변경 0 (다른 status 분기에서 계속 사용)
- **신규 Prisma query 1건 추가** (TournamentTeam standings) — 의뢰서 §3 "예외: series next_edition 도출용 단순 query 1건 허용" 의 정신에 따라 데이터 진실성을 위한 최소 query. mock 사용 회피 목적. status='completed' 분기에서만 실행되므로 다른 상태 대회 성능 영향 0
- **page.tsx select 추가** (champion_team_id / mvp_player_id / teams / users_mvp): status 분기 무관하게 항상 select. 영향 = SSR fetch 시 ~20 byte 추가 / 모든 대회 회귀 0 (필드 추가만)
- **commit/push/PR 은 PM 담당** (의뢰서 §Step 9~11)

💡 tester 참고:
- **로컬 검증**: `npm run dev` → http://localhost:3001/tournaments/[completed-uuid] 접속
  - 종료 대회 (`status='completed'`) → 5 카드 grid 노출, 기존 hero/sidebar/tabs 미노출
  - 비종료 대회 (recruit/active/published/draft 등) → 기존 동작 100% 유지 (회귀 0)
  - **데스크톱**:
    - champion 있음 + 우승 1팀 + MVP + description → 5 카드 grid 완전 노출 (갤러리 hide)
    - champion 없음 → Hero "종료된 대회" + standings/MVP/story 카드 (있으면) 노출
    - mvp 없음 → MVP 카드 hide
    - description 짧음 (<60자) → 알기자 카드 hide
    - series 없음 / 마지막 회차 → 다음 회차 카드 hide
  - **모바일 (≤720px)**: 5 카드 1열, hero 통계 4 grid (각 컴포넌트 자체 반응형)
  - **태블릿 (721~1023px)**: 2 column grid (story/standings 한 줄, photos/next 풀폭)
  - **다크모드**: var(--*) 토큰 자동 적용
- **정상 동작**:
  - Hero 우승팀 로고 = teams.logoUrl 또는 이니셜 폴백
  - 최종 순위 1위 카드 = `.is-champ` 골드 그라데이션
  - "전체 대진표 보기" 클릭 → `?tab=bracket` 쿼리 부여 후 페이지 그대로 (참고: status='completed' 분기 안이라 탭 이동 효과는 미동작 — bracket 으로 직접 이동하려면 `/tournaments/{id}?tab=bracket` 명시 라우팅 필요 — 향후 별 PR)
  - 다음 회차 카드 D-day = 시작일 - 오늘 (음수면 D+N / 0이면 D-0)
- **주의할 입력**:
  - final_rank 미설정 대회 → standings 카드 자동 hide (운영 데이터 그대로)
  - champion_team_id 미설정 → hero fallback "종료된 대회"
  - mvp_player_id 미설정 → MVP 카드 hide
  - description NULL → story 카드 hide
  - series_id NULL → 다음 회차 카드 hide
  - **운영 DB 영향 0**: status='completed' 대회만 본 분기 진입. 다른 status 대회는 select 추가분만 (data fetch +20byte / 회귀 0)

⚠️ reviewer 참고:
- **css 시안 원본 hex 박제** (다크 hero / 챔피언 골드 / mvp 핑크 / eyebrow yellow): 사용자 §6-1 "시안 우선" 룰. 운영 globals.css 에 동등 토큰 미정의. 향후 토큰 추가 시 var() 전환 가능
- **page.tsx select 영구 확장**: champion_team_id / mvp_player_id / teams / users_mvp 4 필드 — 다른 status 대회에도 fetch (분기 무관). 영향 미미하지만 reviewer 가 "분기 시에만 fetch" 권장 시 별도 prisma.tournament.findUnique 분리 PR 로 처리 가능
- **TournamentTeam standings query 1건 추가**: status='completed' 분기 안에서만 실행. 의뢰서 §3 mock 금지 + 데이터 진실성 위한 최소 query. final_rank in [1,2,3] 인덱스 미정의 — 향후 final_rank index 추가 시 자연 흡수
- **공유 SDK 미통합**: 시안 카카오/인스타 공유 버튼은 본 PR 에서 미박제 (mock ❌ 정신). 향후 share-tournament-button 클라이언트 재사용 가능
- **breadcrumb 4단/2단 분기 재구현**: status='completed' 분기는 별도 wrapper (.tc-inner 다크 배경) 이므로 기존 max-w-7xl wrapper 재사용 불가 → breadcrumb 로직 일부 재현. 가독성 위해 별도 헬퍼 함수로 추출 가능 (향후 별 PR)
- **API/Prisma 호출**: select +4 필드 + standings query 1건 (status='completed' 분기 안). 의뢰서 §3 데이터 정책 준수

#### 수정 이력
(아직 없음 — tester/reviewer 피드백 시 추가)

## 구현 기록 (developer / PR-1C-2 UA2 TournamentDetail + UC2 MyRegistrationStatus 박제)

### 분석
- **시안 구조 (UA2 / 452 LOC)**:
  - hero band (B7 status / B4 capacity) — `td-hero` (poster grad + 통계 + CTA)
  - 종별 sticky chip row (B2) — `td-divsel` + `td-divchip`
  - 5 탭 (overview / schedule / bracket / teams / rules) — `td-tabs`
  - sidebar 보강 — `MyRegistrationStatus` (B1) + 운영자 미리보기 (B7) + 문의
  - mobile sticky bottom (결제 마감 알림)
- **시안 UC2 (121 LOC)**: variant 'sidebar' (풀카드) | 'compact' (한 줄) 분기. 5 STEPS (신청 → 대기 → 승인 → 결제 → 진행). STATUS_META 7종 톤 (warn/accent/ok/navy/mute/err)
- **운영 데이터 흐름**:
  - `page.tsx` 가 SSR — `tournament.findUnique` (include tournament_series), `isTournamentInsider`, `myApplicationsCount`, `divisions` 가공
  - `V2TournamentHero` + `V2RegistrationSidebar` + `TournamentTabs` (overview/규정 SSR + bracket/일정/팀 클라 lazy)
- **22 기존 컴포넌트 ↔ 시안 매핑**:
  - hero → `V2TournamentHero` 유지 (시안 hero band 시각 일부 흡수는 후속 PR)
  - 5 탭 → `TournamentTabs` 유지 (이미 시안 동일 5탭 ALLOWED_TABS 박제됨 — overview/bracket/schedule/teams/rules)
  - 종별 chip → 신규 `TournamentDivisionChips` (sticky, divisions ≥ 2 시만)
  - sidebar 운영자 toggle → 신규 `TournamentOperatorPreview` (isInsider 시만)
  - 사이드바 MyRegistrationStatus → 기존 `_components/my-registration-status.tsx` variant 박제 갱신
- **API 변경**: 0 (리디자인 룰 — Prisma 쿼리/응답 동일)
- **MyRegistrationStatus 위치 이동**: ❌ (PR-1C-5 영향 회피) — `_components/` 유지, 기존 prop 시그니처 (`tournamentId`) 보존

### 변경 파일
| 경로 | 변경 | 신규/수정 | LOC |
|------|------|----------|-----|
| `_components/my-registration-status.tsx` | variant 'sidebar' \| 'compact' prop 추가 / 5 STEPS 박제 / STATUS_META 7종 톤 매핑 / 외부 `reg` 주입 모드 추가 (UC1 대비) / 기존 `tournamentId` 시그니처 + SWR `/api/web/tournaments/[id]/my-status` 호출 유지 | 수정 (시안 박제 패턴) | 153 → 263 |
| `_components/my-registration-status.css` | 시안 `my-registration-status.css` 박제 — `mrs-*` 클래스 + `mrs-pulse` keyframe 자체 정의. 토큰 대체 (`--r-sm → --radius-chip`, `--r-md → --radius-card`, `--r-xs → 4px`, `--bdr-navy → --cafe-blue-deep`, `--err → --danger`, `--warn-soft → #FFF7E8`, `--err-soft → #FCE7E7` 시안 원본 hex 보존) | 신규 | 174 |
| `_components/tournament-detail.css` | 시안 `tournament-detail.css` 박제 — hero band / sticky chip row (`td-divsel`) / 운영자 미리보기 (`td-side__preview*`) 박제. 토큰 대체 동일 패턴 + `td-pulse` keyframe 자체 정의. 운영 사용 안 하는 시안 영역 (`.td-tabs`/`.td-pane`/`.td-table`/`.td-bracket`/`.td-teams`/`.td-rules`) 은 박제 보류 (운영 22 기존 컴포넌트가 이미 담당 — 변경 최소화) | 신규 | 162 |
| `_components/tournament-division-chips.tsx` | 시안 `DivisionChips` (B2) 추출 — 종별 ≥ 2 시 sticky chip row. URL 쿼리 동기화 없이 클라이언트 state 만 보유 (SSR 가 종별별 데이터 전부 내려주므로 시각 필터만 담당) | 신규 | 60 |
| `_components/tournament-operator-preview.tsx` | 시안 sidebar B7 운영자 미리보기 toggle 추출 — `isInsider` 시만 노출 (page.tsx 가드) | 신규 | 64 |
| `page.tsx` | imports: MyRegistrationStatus / TournamentDivisionChips / TournamentOperatorPreview + `./_components/tournament-detail.css` / main 상단에 sticky chip row (divisions > 1 시) / sidebar 영역에 MyRegistrationStatus (session 있을 때) + TournamentOperatorPreview (isInsider 시) 추가 | 수정 | 684 → 720 |

### 검증 결과
- **tsc --noEmit**: 0 errors
- **자체 회귀 검수 6 케이스**:
  | # | 케이스 | 결과 |
  |---|--------|------|
  | 1 | AppNav main bar 우측 dropdown/아바타 | OK (AppNav 변경 ❌) |
  | 2 | 모바일 듀얼 라벨 | OK (AppNav 변경 ❌) |
  | 3 | 검색/쪽지/알림 box | OK (AppNav 변경 ❌) |
  | 4 | 하드코딩 색상 (본 PR 신규 파일 기준) | css 시안 원본 hex 3건 (`#8B5A0F` 텍스트 / `#FFF7E8` warn-soft / `#FCE7E7` err-soft) — 운영 미정의 토큰의 시안 원본 hex 보존 (사용자 §6-1 시안 우선) |
  | 5 | lucide-react import | 0 (본 PR 신규/수정 5 파일 모두 0) |
  | 6 | rounded-full / 9999px | 0 (본 PR 신규/수정 파일) — 기존 운영 `overviewContent` 3건은 본 PR 범위 외 |
  | - | 가짜링크 | 0 |
- **추가 검수** (본 PR 의뢰서 Step 8):
  | # | 케이스 | 결과 |
  |---|--------|------|
  | + | sidebar (UA2) MyRegistrationStatus 노출 = 신청한 사용자만 | OK (`session` 가드 + 컴포넌트 내부 `data.registered` 가드) |
  | + | 종별 chip row sticky = scroll 시 hero band 아래 fix | OK (`.td-sticky` `position: sticky; top: 0; z-index: 5`) |
  | + | 5 탭 = overview / schedule / bracket / teams / rules 순서/명 시안 일치 | OK (`page.tsx` `ALLOWED_TABS` 이미 시안과 동일 5탭) |
  | + | bracket 탭 = 버전 메타 (B5) + 본인 팀 하이라이트 — 시안 의도 그대로 (운영 v2-bracket-* 컴포넌트 보존) | OK (`V2BracketWrapper`/`V2BracketHeader` 기존 컴포넌트 보존 — bracket 버전/본인 팀 메타는 후속 PR 에서 v2-bracket-header 갱신 시 흡수 가능) |

### 알림
- **시안 ↔ 운영 불일치 (디자인 변경 ❌, API 변경 ❌)**:
  - 시안 `MY_REG` mock (status='approved' / step_idx=2 / pay_due) 의 `next_action / pay_due / division / team_name` → 운영 API (`/api/web/tournaments/[id]/my-status`) 응답 스펙에 미포함 → MyRegistrationStatus 가 API 미구현 시 silent fail (sidebar 미노출). API 확장 시 자연 흡수 가능 (시안 `next_action` 필드 그대로 매핑)
  - 시안 hero band 의 status 톤 (`recruit` accent / `final-call` warn / `closed/completed` mute) → 운영 `V2TournamentHero` 는 기존 톤 유지 (본 PR 변경 최소화 룰) — hero 시각 갱신은 PR-1C-3 또는 후속 PR 로 분리 가능
  - 시안 bracket 탭 B5 (version meta + 본인 팀 하이라이트) → 운영 `v2-bracket-header` 가 이미 일부 기능 보유 — 시안 의도 매핑은 본 PR 범위 외 (의뢰서: "버전 메타 본인 팀 하이라이트 = 시안 의도 그대로 운영 v2-bracket-* 컴포넌트 보존")
  - 시안 mobile sticky bottom (결제 마감 알림) → 운영 sticky CTA 는 2026-05-02 사용자 결정으로 삭제됨 (page.tsx L680~ 주석). 본 PR 에서도 미추가 (시안 의도 시각만 박제 / 모바일 sticky 정책 변경 = 별 PR)
- **운영 유지 컴포넌트 (시안 매핑 보류)**: `V2TournamentHero` / `V2RegistrationSidebar` / `V2BracketPrediction` / 5탭 콘텐츠 22개 모두 보존 — 의뢰서 "22 기존 컴포넌트는 변경 최소" 룰 준수
- **`TournamentSidebar` (tournament-sidebar.tsx)** — 운영 page.tsx 에서 미사용 (참조 0건). `MyRegistrationStatus` 의 유일한 다른 호출처 였음. 본 PR 의 prop 시그니처 변경 (`tournamentId` 유지 + variant 추가) 이라 호출처 회귀 0 — 추후 사용 시 자연 흡수
- **commit/push/PR 은 PM 담당** (의뢰서 §Step 9~11)

💡 tester 참고:
- **로컬 검증**: `npm run dev` → http://localhost:3001/tournaments/[유효-tournament-uuid] 접속
  - **데스크톱**:
    - 다종별 대회 (categories 2종 이상) → main 상단 종별 chip row 노출 ("전체" + 종별 chip N개) → scroll 시 hero 아래 sticky 고정
    - 단일 종별 대회 → 종별 chip row 미노출
    - 로그인 + 신청 완료 사용자 → sidebar 최상단에 `mrs--sidebar` 카드 (5 STEPS 인디케이터 + 마이페이지 CTA)
    - 비로그인 / 미신청 사용자 → MyRegistrationStatus 미노출
    - 운영자 (organizer / admin member / super_admin) → sidebar 에 운영자 미리보기 toggle 노출
  - **모바일 (≤720px)**: chip row 가로 스크롤, sidebar 영역 hidden (lg+ 만), `mrs-step__lbl` 축소
  - **다크모드**: 토큰 var(--*) 자동 적용
- **정상 동작**:
  - 종별 chip 클릭 → 시각만 변경 (탭 콘텐츠 SSR 보존)
  - 운영자 toggle 클릭 → state 변경 (실제 미리보기 모드 전환은 본 PR 미구현 — 토글 UI 만 박제)
  - MyRegistrationStatus 5 STEPS = 신청 → 대기 → 승인 → 결제 → 진행 (`status === "approved" && payment === "paid"` → step 3, `status === "in_progress"` → step 4)
  - status pill 톤: pending → warn / approved → accent / paid → ok / in_progress → navy / completed → mute / rejected → err
- **주의할 입력**:
  - `MY_STATUS` API 미구현 (current state) → SWR onError silent → sidebar 카드 자동 미노출 (정상)
  - `divisions.length === 1` → chip row 자동 미노출
  - `tournament.status === "completed"` 대회 → MyRegistrationStatus 사용자 가입 안 했으면 미노출, 가입했으면 `completed` 톤 (mute) 표시

⚠️ reviewer 참고:
- **시안 css 원본 hex 3건 박제** (`#8B5A0F` text / `#FFF7E8` warn-soft bg / `#FCE7E7` err-soft bg): 운영 globals.css 에 `--warn-soft` / `--err-soft` 미정의 — 시안 원본 그대로 박제 (사용자 §6-1 시안 우선 룰). 향후 globals.css 토큰 추가 시 var() 전환 가능
- **`MyRegistrationStatus` prop 시그니처 확장**: 기존 `tournamentId` 유지 + 신규 `reg / variant / onOpenMy / onOpenTn` 옵션 prop 추가 → 호출처 (tournament-sidebar.tsx 운영 미사용 / page.tsx 신규 호출) 회귀 0. UC1 (PR-1C-5) 에서 `<MyRegistrationStatus reg={...} variant="compact" />` 패턴으로 사용 예정
- **종별 chip URL 동기화 의도적 생략**: SSR 이 categories 전체를 한 번에 내려주므로 클라이언트 state 만으로 충분. URL 동기화는 페이지네이션/필터 연결 시 후속 PR 에서 추가 가능 (의뢰서 "본 PR 에서는 시각 칩 노출만 박제")
- **`TournamentOperatorPreview` 실제 미리보기 모드 미구현**: toggle UI 만 박제. 실제 미리보기 모드 전환 = url query `?preview=user` + page.tsx isInsider 조건 분기 = 별 PR 로 분리 (의뢰서 "토글 UI 만 박제")
- **API/Prisma 호출 0 변경**: page.tsx SSR 쿼리 동일, MyRegistrationStatus SWR endpoint 동일

#### 수정 이력
(아직 없음 — tester/reviewer 피드백 시 추가)

## 구현 기록 (developer / PR-1C-1 UA1 Tournaments 박제)

### 분석
- **시안 구조**: hero (eyebrow + 제목 + 통계 카운트) → sticky filter bar (5 chip + 검색 + 정렬 select) → tnl-grid (포스터 카드: poster grad + body[divs/status/name/meta/cap or champ] + foot[host + fee])
- **시안 mock 필드**: `t.name, t.status, t.poster_hue, t.divisions[], t.starts_at, t.ends_at, t.venue, t.apply_deadline, t.teams_now, t.teams_max, t.org.{avatar,name}, t.fee_min, t.fee_max, t.champion, t.mvp`
- **운영 데이터 흐름** (`/api/web/tournaments`): `name, status, format, start_date, end_date, entry_fee, city, venue_name, max_teams, team_count, divisions[], categories{}, division_tiers[]` + `useSWR` photoMap
- **운영 구조**: `page.tsx` (래퍼) → `TournamentsContent` (API/필터/페이지네이션/뷰토글) → `V2TournamentList` (탭 + 카드 그리드)
- **API 변경**: 0 (리디자인 룰 — `/api/web/tournaments` 호출/응답 동일)
- **운영-시안 갭**:
  - 시안 `t.org / champion / mvp / poster_hue / apply_deadline` 필드 → API 없음 → 폴백 처리
    - poster_hue → 대회명 deterministic hash (`hueFromName`) — 같은 대회 항상 같은 색
    - org.name / org.avatar → 종별 라벨 + 종별 이니셜로 대체
    - champion/mvp → 종료 카드의 진행바 `is-done` 으로 폴백
    - apply_deadline → `registration_end_at ?? start_date`
  - 시안 "내 지역" 칩 → 운영 `FloatingFilterPanel` 의 지역필터로 대체 (4탭 유지)
- **운영 기능 유지**:
  - ViewToggle (list/calendar/week) — 헤더 우측에 유지
  - FloatingFilterPanel (지역/성별/종별/디비전) — 헤더 우측에 유지
  - LoadMoreButton — 그리드 하단에 유지
  - 4상태 탭 (전체/접수중/진행중/종료) — V2_MATCH_TABS 그대로

### 변경 파일
| 경로 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/(web)/tournaments/_components/tournaments.css` | 시안 `tournaments.css` 박제 — `tnl-*` 클래스 + `tnl-pulse` keyframe 자체 정의. 토큰 대체 (`--r-sm → --radius-chip`, `--r-lg → --radius-card`, `--r-xs → 4px`, `--accent-deep → --bdr-red-ink`, `--bdr-navy → --cafe-blue-deep`) | 신규 |
| `src/app/(web)/tournaments/_components/v2-tournament-list.tsx` | 컴팩트 카드 → 시안 `tnl-card` 패턴 전체 교체. `STATUS_META` 톤 매핑 (accent/navy/mute), `Poster`/`ProgressBar`/`FeeText` 시안 컴포넌트 그대로 박제. 탭 chip 도 `.tnl-chip` 시각으로 교체. `EmptyState` `onReset` 옵션 추가 | 수정 (552 → 432 LOC) |
| `src/app/(web)/tournaments/_components/tournaments-content.tsx` | hero 카피 변경 (`대회` → `대회 둘러보기`), eyebrow `TOURNAMENTS · 전국 농구 매칭`, 시안 통계 카운트 sub 라인 추가, 외곽 `page` → `tnl-page > tnl-inner` 로 교체. `handleEmptyReset` 추가 (필터 초기화 콜백) | 수정 (380 → 408 LOC) |
| `src/app/(web)/tournaments/page.tsx` | 변경 없음 (래퍼만) | - |

### 검증 결과
- **tsc --noEmit**: 0 errors
- **next lint**: Next.js 16 deprecated — 대안: `scripts/check-design-regression.sh` 실행 시 본 박제 변경에 신규 위반 0건 (lucide-react 0 / alert 0 / 인라인 grid repeat 39건은 기존 운영 파일, 본 박제 영향 ❌)
- **자체 회귀 검수 6 케이스**:
  | # | 케이스 | 결과 |
  |---|--------|------|
  | 1 | AppNav main bar 우측 dropdown/아바타 | OK (AppNav 변경 ❌) |
  | 2 | 모바일 듀얼 라벨 | OK (AppNav 변경 ❌) |
  | 3 | 검색/쪽지/알림 box | OK (AppNav 변경 ❌) |
  | 4 | 하드코딩 색상 | tsx 0건 / css 챔피언 골드라인(#FBF6E6/#E8D9A7/#6B5210/#4A3705/#B8A75D) + #fff = 시안 원본 박제 (사용자 결정 §6-1 시안 우선) |
  | 5 | lucide-react import | 0 |
  | 6 | rounded-full / 9999px | 0 (정사각형 50% 만 사용: tnl-status__dot 6×6, tnl-host__av 30×30) |
  | - | 가짜링크 | 0 |

### 알림
- **시안 ↔ 운영 불일치 (디자인 변경 ❌, API 변경 ❌)**:
  - 시안 `champion/mvp` 라인은 API 에 데이터 없음 → 종료 카드는 진행바 `is-done` (`대회 종료`) 으로 폴백. 추후 별 PR 로 API 확장 시 `ChampionLine` 컴포넌트 추가 가능 (CSS 는 이미 박제됨)
  - 시안 `org.{name,avatar}` (주최) 필드 없음 → 종별 라벨 + 이니셜로 대체. 향후 `host_name` API 필드 추가 시 자연 흡수 가능
  - 시안 정렬 select (마감임박/최신등록/종료일순) → 운영 미구현 → 본 박제에서도 미추가 (필요 시 후속 PR)
- **운영 유지 컴포넌트 (시안에 없음)**: ViewToggle / FloatingFilterPanel / LoadMoreButton / Pagination — 헤더 우측 또는 그리드 하단에 그대로 유지
- **commit/push/PR 은 PM 담당** (의뢰서 §10 [2]~[4])

💡 tester 참고:
- **로컬 검증**: `npm run dev` → http://localhost:3001/tournaments 접속
  - 데스크톱: 4탭 (전체/접수중/진행중/종료) chip 클릭 / 카드 그라디언트 포스터 / 진행바 / 종료 카드 회색 진행바
  - 모바일 (≤720px): 1열 그리드, chip 가로 스크롤, 검색/필터 컨트롤 wrap
  - 다크모드: 토큰 var(--*) 사용으로 자동 적용 — globals.css [data-theme="dark"] 자동 반영
  - 필터: 지역(서울/부산 등) / 종별(경기/리그 등) / 성별 / 디비전 — FloatingFilterPanel 유지
- **정상 동작**:
  - 카드 클릭 → `/tournaments/${id}` 라우팅 (Link prefetch)
  - 종료 대회 = 회색 progress bar + "대회 종료" 라벨
  - 진행중 대회 = 네이비 status 뱃지
  - 접수중 대회 = 빨간 status 뱃지 + pulse dot
  - 정원 마감 = "정원 마감" chip + 빨간 progress fill
- **주의할 입력**:
  - 대회 등록 0건 → 빈 상태 카드 표시 (`조건에 맞는 대회가 없습니다`)
  - max_teams = null → "N팀" 형식 폴백
  - start_date = null → "일정 미정" 표시
  - registration_end_at 없고 start_date 만 있는 경우 — D-day 가 start_date 기준으로 계산됨

⚠️ reviewer 참고:
- **시안 챔피언 라인 골드 색상**은 시안 원본 (`#FBF6E6/#E8D9A7/#6B5210...`) 을 그대로 박제 — 사용자 결정 §6-1 "시안 우선" 룰 적용. 토큰화 의도라면 별도 후속 PR
- **`hueFromName` deterministic hash**: 대회명 → 0~360° hue. 같은 대회는 항상 같은 색. mock 의 `poster_hue` 대체 — 결정성 보장
- **운영 컴포넌트 (ViewToggle / FloatingFilterPanel) 보존**: 시안에 없는 운영 고유 기능. 시안 패턴에 흡수하면 기능 손실 우려 → 헤더 우측에 분리 배치
- **시안 sticky filter bar 미적용**: 시안의 sticky 동작은 운영에 단독 chip 그룹만 분리되어 있어 sticky 적용 시 ViewToggle/필터와 충돌 → `position: static` 으로 override
- **API/Prisma 호출 0 변경**: `/api/web/tournaments` (단일 GET) + `useSWR` photoMap (place-photos batch) 그대로 사용

## 테스트 결과 (tester)
(아직 없음)

## 리뷰 결과 (reviewer)
(아직 없음)

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-28 | PR-1C-6 옵션 A Matches 표 시각 박제 (developer) | ✅ 시안 amt-table 박제 / 신규 1 (matches-admin.css 113 — amt-table 전체 + 모바일 분기, `--r-md→--radius-card`·`--r-xs→4px` 대체, 하드코딩 0) + 수정 1 (matches-client.tsx 순증 +33 — 라운드별 한 줄 카드→`<table amt-table>`, onClick=setSelectedMatch 행 단위 유지, 컬럼 7종, 승자 success 톤·STATUS 톤 보존) / vban·amt-mode 박제 보류 (mock❌ / ScoreModal 보존) / API·fetch·Prisma·DB 변경 0 / tsc 0 errors / 자체 회귀 6/6 PASS / commit·push·PR PM 담당 |
| 2026-05-28 | PR-1C-5 UC1 MyActivity 박제 (developer) | ✅ 시안 v2.20 승인 3건 박제 / 신규 1 (my-activity.css 88 — .ma-filter chip row) + 수정 2 (page.tsx -102/+158 = TournamentCard 90LOC 제거 + 필터/compact/헬퍼 추가 / my-registration-status.tsx NormalizedReg export +3) / ① 대회탭=MyRegistrationStatus compact 재사용 ② 5상태 필터 chip row ③ 매너 hide(mock❌) / 🔧 시안 #fff→var(--bg) 치환 = 다크모드 --ink밝음 대비0 버그 사전해결 / API·fetch·Prisma·DB 변경 0 / 3탭+counters 보존 / tsc 0 errors / 자체회귀 6/6 PASS / commit·push·PR PM 담당 |
| 2026-05-28 | Phase 2 v2.20 BDR-current sync (PM) | ✅ commit `dca96f6` push / BDR-current = 34 루트 (game-shared.jsx NEW) + screens 26 jsx + 6 css + _baseline 10 / pre-snapshot 26 jsx / 회귀 4+8+특수 4 통과 (game-shared/baseline 10/carry-over diff 0/가짜링크 screens 직속 0/lucide 0) / BOM 우회 0 / 시안 css hex 23건 = Phase 2C 토큰 대체 대상 / ledger Phase 2 ⑨⑩ ✅ |
| 2026-05-28 | PR-1C-1~4 commit/push (PM / PR #650 누적) | ✅ `40d19db`(UA1) `9734de4`(UA2+UC2) `19dfa03`(UB1) `e4e629b`(UA3 옵션B) + `5dc51e9`(gitignore chore) / 각 자체 회귀 통과 / ledger Phase 1 ⑪⑫ |
| 2026-05-28 | PR-1C-4 UA3 TournamentEnroll B3 결제 보강 + 사후 안내 박제 (developer / 옵션 B) | ✅ 시안 박제 / 신규 3 (tournament-enroll.css 316 / enroll-step-payment.tsx 255 / enroll-success-hero.tsx 125) + 수정 1 (page.tsx 1563→1292 / -271 LOC / done 분기 + 결제 stage 컴포넌트화) / 옵션 B = bank 단일 (manual·card·토스 보류) / API·route.ts·payment_status·새 라우트 변경 0 / _v2/ 기존 4 컴포넌트 변경 0 / 5/4-step adaptive 보존 / 약관 동의 보존 / tsc 0 errors / 자체 회귀 6/6 + UA3 9/9 PASS / commit·push·PR PM 담당 |
| 2026-05-28 | PR-1C-3 UB1 TournamentCompleted 박제 (developer) | ✅ 시안 박제 / 신규 7 (tournament-completed.css 343 / tournament-completed-hero.tsx 145 / tournament-final-standings-card.tsx 102 / tournament-mvp-best5-card.tsx 63 / tournament-gallery-card.tsx 75 / tournament-story-card.tsx 67 / tournament-next-edition-card.tsx 90) + 수정 1 (page.tsx 721→923 / status='completed' 분기 + select 4필드 추가 + standings query 1건) / 신규 라우트 ❌ / mock ❌ (갤러리/best5/통계 4종 중 3종 hide) / 다른 status 대회 회귀 0 / tsc 0 errors / 자체 회귀 6/6 + UB1 10/10 PASS / commit·push·PR PM 담당 |
| 2026-05-28 | Phase 1C-2 UA2 TournamentDetail + UC2 MyRegistrationStatus 박제 (developer) | ✅ 시안 박제 / 신규 4 (my-registration-status.css 174 / tournament-detail.css 162 / tournament-division-chips.tsx 60 / tournament-operator-preview.tsx 64) + 수정 2 (my-registration-status.tsx 153→263 variant 분기 / page.tsx 684→720 sidebar+sticky chip row) / API·Prisma·AppNav 변경 0 / MyRegistrationStatus 위치 이동 ❌ / 기존 prop 시그니처 유지 / tsc 0 errors / 자체 회귀 6/6 + 추가 4/4 PASS / commit·push·PR PM 담당 |
| 2026-05-28 | Phase 1C-1 UA1 Tournaments 박제 (developer) | ✅ 시안 `tnl-card` 패턴 박제 / 신규 1 (tournaments.css) + 수정 2 (v2-tournament-list.tsx 552→432, tournaments-content.tsx 380→408) / API/AppNav 변경 0 / tsc 0 errors / 자체 회귀 6/6 PASS / commit·push·PR PM 담당 |
| 2026-05-26 | Phase 2 묶음 2 baseline 복원 + zip (의뢰서 §Step 1~3) | ✅ baseline 10 복원 (v2.18 pre-snapshot 9 + v2.19 MyActivity 1) / `Downloads/BDR-current-phase2.zip` 0.15 MB / commit 보류 (다음 sync 시 archive 자연 이동) / 사용자 Claude.ai 세션 2 진입 대기 |
| 2026-05-26 | Phase 1A v2.19 sync + Step 0 BOM 영구 해결 | ✅ Step 0 commit `5609c61` (BOM) + sync commit `d5befb9` push / BDR-current = 23 파일 v2.19 cumulative / pre-snapshot 20 파일 보존 / 회귀 검수 6 통과 / 임시 우회 패턴 폐기 / ledger Phase 1 ⑩ (1A) ✅ |
