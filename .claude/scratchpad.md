# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 1C-2 UA2 TournamentDetail + UC2 MyRegistrationStatus 박제 (developer 수행)
- **상태**: 박제 완료 — PM 검토/commit/push/PR 대기
- **현재 담당**: pm (developer 산출물 검토 → tester/reviewer 병렬 검증 또는 PM 직접 검증 → commit)
- **참고**: phase-ledger (`.claude/phase-ledger.md`) 가 Phase 1/2 상태 source of truth — PR-1C-1 (UA1) PR #650 ✅ 완료 (commit `40d19db`) / PR-1C-2 박제 완료 (commit 전) / UC1 (`profile/activity/page.tsx`) 박제 = PR-1C-5 까지 보류

## 기획설계 (planner-architect)
(아직 없음)

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
| 2026-05-28 | Phase 1C-2 UA2 TournamentDetail + UC2 MyRegistrationStatus 박제 (developer) | ✅ 시안 박제 / 신규 4 (my-registration-status.css 174 / tournament-detail.css 162 / tournament-division-chips.tsx 60 / tournament-operator-preview.tsx 64) + 수정 2 (my-registration-status.tsx 153→263 variant 분기 / page.tsx 684→720 sidebar+sticky chip row) / API·Prisma·AppNav 변경 0 / MyRegistrationStatus 위치 이동 ❌ / 기존 prop 시그니처 유지 / tsc 0 errors / 자체 회귀 6/6 + 추가 4/4 PASS / commit·push·PR PM 담당 |
| 2026-05-28 | Phase 1C-1 UA1 Tournaments 박제 (developer) | ✅ 시안 `tnl-card` 패턴 박제 / 신규 1 (tournaments.css) + 수정 2 (v2-tournament-list.tsx 552→432, tournaments-content.tsx 380→408) / API/AppNav 변경 0 / tsc 0 errors / 자체 회귀 6/6 PASS / commit·push·PR PM 담당 |
| 2026-05-26 | Phase 2 묶음 2 baseline 복원 + zip (의뢰서 §Step 1~3) | ✅ baseline 10 복원 (v2.18 pre-snapshot 9 + v2.19 MyActivity 1) / `Downloads/BDR-current-phase2.zip` 0.15 MB / commit 보류 (다음 sync 시 archive 자연 이동) / 사용자 Claude.ai 세션 2 진입 대기 |
| 2026-05-26 | Phase 1A v2.19 sync + Step 0 BOM 영구 해결 | ✅ Step 0 commit `5609c61` (BOM) + sync commit `d5befb9` push / BDR-current = 23 파일 v2.19 cumulative / pre-snapshot 20 파일 보존 / 회귀 검수 6 통과 / 임시 우회 패턴 폐기 / ledger Phase 1 ⑩ (1A) ✅ |
| 2026-05-26 | Phase 1B v2.18 BDR-current sync | ✅ commit `a71c9a3` + push / BDR-current = 15 파일 (jsx 9 UA1~UD3 + css 6) / pre-snapshot 149 파일 보존 / 회귀 검수 6 통과 / 인코딩 우회 = UTF-8 BOM 임시 파일 1회성 / ledger ⑩ ✅ |
| 2026-05-25 | Phase 1 시안 의뢰 패키지 박제 (planner-architect) | ✅ `Dev/design/prompts/tournament-admin-redesign-prompt-2026-05-25.md` 617 LOC / 10 시안 정의 (수정 7 + 신규 3) / 9 사각지대 + 3 갭 매핑 / 13 룰 + 사용자 결정 §1~§8 보존 명시 |
| 2026-05-25 | 대회 생성/관리 UX 점검 + 시안 설계 계획 (planner-architect) | ✅ 인벤토리 24 페이지 + 12 컴포넌트 / 9 사각지대 (S1~S9) / 갭 3건 / 4 Phase 계획 / 코드 변경 0 |
| 2026-05-25 | Sprint 4 F4-γ LEGACY QS 형식 일괄 정정 (34건) | ✅ 139 매치 audit → LEGACY 44건 → 안전 34건 일괄 UPDATE / 사후 검증 34/34 OK / F2 cron false positive 해결 |
| 2026-05-25 | Sprint 3 F4 옵션 A 안전 정정 — m257 quarterScores | ✅ 옵션 A 후보 1건 / Flutter legacy → nested 변환 / 사후 5/45 OK |
| 2026-05-24 | 제 2회 BDR W 대학동아리 농구대회 결승 대진 박제 (m260) | ✅ UPDATE 1건 / 가드 7 통과 / home=이화여대 에폭시 vs away=한체대 KANCE |
| 2026-05-23 | PR-6 backfill DRY-RUN | ✅ 후보 29건 / PBP_MATCHES_HEADER 4건 (m101/110/111/269) 안전 정정 대상 |
| 2026-05-23 | PR-5 (F1) quarterScores 자동 갱신 service layer | ✅ 4 파일 / vitest 78/78 PASS / paper skip 보장 |
