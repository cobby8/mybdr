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
- **대회 로컬룰 옵션 제공** (2026-05-02 신설) — 사용자 결정: 농구는 동점 없음 (현재 winnerTeamId=null 처리 OK). 단 로컬룰 (예: 특정 대회의 무승부 인정 / 연장전 점수 별도 처리 / 특수 진출 룰) 있는 대회 신설 시 별도 옵션 UI + 로직 분기 필요. Tournament.settings JSON 에 `localRules` 필드 추가 + matches PATCH/v1 status PATCH 에서 분기 호출

## 현재 작업

- **요청 (병행 2건)**:
  - (a) **Games 박제 분석** — `/games` + `/games/[id]` B등급 → A 승격 (planner-architect, 신규)
  - (b) **Phase F** — `/tournaments/[id]` 듀얼 5단계 시각화 (planner-architect, 기존)
- **상태**: 분석 2건 완료 → PM 사용자 결정 대기 (Games 6건 + Phase F 6건)
- **브랜치**: subin

### 구현 기록 (developer) — Live 박스스코어 + 풀 print dialog 복원 (2026-05-02)

📝 구현한 기능: 옛 `/live/[id]/page.tsx` 의 BoxScoreTable + PrintBoxScoreTable + PrintOptionsDialog 풀 복원 (사용자 요청 "기존 UI 그대로 복구. 프린트 기능 안 보임").

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/live/[id]/_v2/box-score-table.tsx` | 옛 BoxScoreTable 풀 복원 (쿼터 필터/DNP 분리/스타팅 정렬/PtsTeamBar/안내 배너/TOTAL 합산) — 19컬럼 | 신규 |
| `src/app/live/[id]/_v2/print-options-dialog.tsx` | PrintOptionsDialog (팀별 enabled+누적+Q1~Q4+OT 체크) + TeamSection | 신규 |
| `src/app/live/[id]/_v2/tab-players.tsx` | 단순 17컬럼 인라인 → BoxScoreTable 2개 호출 (홈/원정) | 수정 |
| `src/app/live/[id]/_v2/print-box-score.tsx` | 단순 누적 2개 → printOptions 기반 (팀×기간) 매핑 + PrintBoxScoreTable filter 지원 (19컬럼) | 수정 |
| `src/app/live/[id]/_v2/game-result.tsx` | PlayerRowV2 에 quarter_stats 필드 추가 + printDialogOpen/printOptions state + useEffect (트리거 옛 page.tsx L511-555 카피) + PrintOptionsDialog 마운트 | 수정 |

🔧 핵심 동작 흐름 (옛 page.tsx 와 동일)
1. "박스스코어" 탭 → "박스스코어 프린트" 버튼 클릭 → setPrintDialogOpen(true)
2. 다이얼로그 모달 → 팀별 enabled + 누적/Q1~Q4/OT 체크 → "프린트" 클릭
3. setPrintOptions(opts) → useEffect 트리거 → setIsPrinting(true) + document.title 변경
4. setTimeout(100ms) → window.print() — DOM 반영 후
5. afterprint → title 복원 + isPrinting=false + printOptions=null + dialog 닫힘

📌 quarter_stats 호환성: API (`/api/live/[id]/route.ts`) 응답에 이미 포함됨 — v2 의 PlayerRowV2 타입에 `quarter_stats?: Record<string, PlayerQuarterStat>` 필드만 추가. **API/DB 변경 0**.

✅ 자체 검수 (06-self-checklist 13 룰)
- AppNav 0 변경 (frozen) ✅
- API/DB/응답 키 변경 0 ✅
- 토큰 사용 (var(--color-*)) ✅ — 옛 페이지의 #ffffff/#7f7f7f/#E31B23/#666 등은 옛 코드 그대로 카피 (회귀 X, 옛 코드 보존)
- lucide-react 0 ✅ (Material Symbols 만)
- pill 9999px 0 ✅
- 핑크/살몬/코랄 0 ✅
- 인라인 grid `repeat(N, 1fr)` 0 ✅ (table 사용)
- TypeScript strict 통과 (EXIT=0) ✅

💡 tester 참고
- 테스트 진입: `/live/[id]` 에서 status="finished" 또는 "completed" 경기 (예: 토너먼트 종료 경기 ID)
- "박스스코어" 탭 클릭 → 옛 디자인 (쿼터 필터 / sticky 셀 / 얼룩무늬 / TOTAL 행) 정상 표시 확인
- "박스스코어 프린트" 버튼 → 다이얼로그 열림 → 양 팀 체크 / 누적+Q1 체크 → "프린트" → window.print() 다이얼로그 표시
- afterprint (취소 시 즉시) → 다이얼로그 자동 닫힘 + 원래 화면 복원
- DNP 선수 있는 경기에서 별도 행 표시 (MIN="DNP", 나머지 "-") 확인
- quarter_stats 미저장 경기: 쿼터 필터 활성 시 안내 배너 + MIN/+- 외 "-" 처리 확인

⚠️ reviewer 참고
- box-score-table.tsx: globals.css 의 --color-* alias 레이어 (L1958~) 의존. v2 토큰으로 alias 됨.
- print-options-dialog.tsx 의 hasOT prop: match.quarter_scores?.home?.ot?.length 로 game-result.tsx 에서 산출.
- print-box-score.tsx 의 PrintBoxScoreTable 은 옛 page.tsx L1652-1862 와 1:1 동등 (filter 지원 19컬럼).
- PlayerRowV2 → PlayerRow 타입 호환: 옛 PlayerRow + `home_score_at_time/away_score_at_time` 만 PBP 에 한정. 박스스코어용은 quarter_stats 만 추가하면 동등.

### 기획설계 (planner-architect) — Teams 박제 분석 (2026-05-02)

🎯 목표: `/teams` (B등급) + `/teams/[id]` (B등급) → A 승격. 시안 BDR-current/screens/{Team,TeamDetail}.jsx 와 운영 정합. UI only / API·DB 변경 0. **선수명단 실명 표시 Phase B-2 적용 영역 보존 필수** (86fc51f).

📍 시안 ↔ 운영 핵심 차이

| # | 영역 | 시안 (BDR-current) | 운영 | 정합도 |
|---|------|------|------|--------|
| 1 | `/teams` 헤더 | eyebrow + h1 + "레이팅 순 · 2026 시즌 기준" + 검색 chip + "팀 등록" | ✅ "레이팅 순" 라벨만 제거 (PM 결정 04-29) | 95% |
| 2 | `/teams` 카드 | 상단 accent (로고+팀명+창단+#랭크) / 3열 stat (레이팅·승·패) / 2버튼 (상세·매치신청) | ⚠️ 모바일 2열 강제 + stat 3종·매치신청·#랭크·우상단 #N **모두 제거** (간소화) — 로고+팀명+창단+상세 1버튼만 | 50% |
| 3 | `/teams` 필터 | **시안 없음** (검색 chip만) | ✅ **운영 only** — 지역(전국+cities) + 정렬(랭킹/최신/멤버) chip-bar | 운영 우위 |
| 4 | `/teams/[id]` Hero | accent grad + 거대 tag 워터마크 220px + Avatar 96 + eyebrow + h1 52 + 4스탯 (레이팅·승·패·승률) + 3CTA (초대링크·팔로우·매치신청) | ✅ 동일 + **rating stat 제거** (PM 결정 04-29) → 3스탯 + **canManage 시 "팀 관리" 추가** + Phase 10-4 팔로우/매치신청 활성 | 90% |
| 5 | `/teams/[id]` Tabs | 5탭 = 개요/로스터/최근경기/기록/**작전판(주장 only)** | ⚠️ 4탭 = 개요/로스터/최근경기/기록 (**작전판 미구현**) | 80% |
| 6 | Overview | 팀 소개 카드 + 6행 key-value (창단·홈코트·연습일·팀레벨·레이팅·게스트모집) | ✅ 동일 (연습일·팀레벨·게스트모집 → "준비 중" placeholder) | 95% |
| 7 | Roster | `.board.data-table` 5열 + `data-primary` + `data-label` 마커 → 모바일 자동 카드 변환 | ⚠️ `.board` 만 + `data-table` / `data-label` / `data-primary` 마커 0건 → 모바일 폴백 .board 변환만 (덜 깔끔) | 70% |
| 8 | Recent | `.board.data-table` 5열 + 마커 / "스크림" 표시 (시안 데모) | ⚠️ `.board` 만 + 마커 0건 / status="live" 시 "LIVE" 뱃지 (운영 우위) | 70% |
| 9 | Stats | "2026 시즌 평균" 4카드 (득점·실점·리바·어시) 시안 데모값 | ✅ 4카드 + "준비 중" 라벨 + footnote (DB 미지원 명시) | 95% |
| 10 | Side card | 최근 폼 5칸 + "게스트 지원" + "팀 매치 신청" + 연락 (팀장·응답시간) + "쪽지 보내기" | ✅ 최근 폼 + **"팀 가입 신청"** (시안 "게스트 지원" 자리, 실동작) + 매치 신청 + 연락 (응답시간·쪽지 코드 주석화 — DB 미지원) | 운영 우위 |
| 11 | ChalkTalk 작전판 | SVG 코트 다이어그램 + 4 플레이북 + 코치 노트 (주장 권한 시뮬) | ❌ **운영 0** (탭 자체 미구현) | 0% |

📍 데드 코드 (import 0건, 1225줄, 5 파일):
- `[id]/_tabs/games-tab.tsx` 264줄
- `[id]/_tabs/overview-tab.tsx` 476줄
- `[id]/_tabs/roster-tab.tsx` 144줄
- `[id]/_tabs/tournaments-tab.tsx` 74줄
- `[id]/join-button.tsx` 267줄
→ v2 전환 (1d53893) 이후 import 0건 검증 완료. Games Phase A 패턴과 동일 — Phase A 단독 commit 권고.

📍 회귀 안티패턴 점검 (★ 이번 세션 PlayerHero/OverviewTab/Games 회귀 케이스)

| 위치 | 패턴 | 위험 |
|------|------|------|
| `team-hero-v2.tsx:126` | `gridTemplateColumns: "minmax(0, 1fr)"` (1열) | ✅ 안전 (1열) |
| `overview-tab-v2.tsx:76` | `gridTemplateColumns: "120px 1fr"` (2열) | ⚠️ 모바일 320px 에서 라벨 영역 좁아짐. **사용자 결정 필요** (분기 추가 vs 유지) |
| `stats-tab-v2.tsx:54` | `gridTemplateColumns: "repeat(4, 1fr)"` (4열) | 🚨 **회귀 안티패턴** — 모바일 분기 0 (errors.md 04-29 8건 재발 패턴!) |
| `roster-tab-v2.tsx:116/137` | `gridTemplateColumns: "56px 1fr 80px 100px 80px"` (5열) | ⚠️ globals.css `.board` 모바일 폴백 의존 (작동하지만 시안 `.data-table` 마커 누락) |
| `recent-tab-v2.tsx:94/158` | `gridTemplateColumns: "80px 1fr 120px 80px 160px"` (5열) | ⚠️ 동일 |
| `page.tsx:268` | `gridTemplateColumns: "minmax(0,1fr) 320px"` (사이드 카드) | ✅ globals.css 1403~1409 `with-aside 5종` 모바일 stack 가드 적용 — 단 `.page--wide > div` 셀렉터 매칭이 `.page > div` 에 미적용 → **작동 검증 필요** |

📋 사용자 결정 큐 6건

| # | 결정 | 옵션 (추천 굵게) | 영향 |
|---|------|------------------|------|
| 1 | 카드 정보 밀도 (`/teams`) | A 시안 풀 박제 (3열 stat + 2버튼 + #랭크 복원) — 모바일에선 stat 1열 적층 / **B 운영 간소화 유지 + #랭크만 시안 추가 (PC ≥720px)** / C 변경 0 | 결정 1=B 추천: 모바일 폭 ~170px 에 stat 3종은 무리. PM 04-29 결정 (rating 미구현) 정합 |
| 2 | Stats 4카드 모바일 분기 | **A `repeat(4, 1fr)` → className 분기 (`grid-cols-2 sm:grid-cols-4`) 또는 별도 .css 파일 + `@media ≤720px`** / B `auto-fit minmax(140px, 1fr)` / C 유지 | **🚨 회귀 안티패턴 — A 필수 (errors.md 04-29 패턴)** |
| 3 | Roster/Recent `.data-table` 마커 | **A 시안 정합 — `className="board data-table"` + `data-primary="true"` (이름) + `data-label="..."` 마커 6개씩 추가** / B `.board` 폴백 유지 (덜 깔끔하지만 작동) | A 추천: globals.css 1640~1690 `data-table` 모바일 카드 변환이 더 정교 (key-value 자동 라벨). 코드 변경 ~10줄 |
| 4 | Hero rating stat 복원 | A 시안 4스탯 (레이팅·승·패·승률) 복원 / **B 3스탯 유지 (rating 미구현 PM 결정 04-29 보존)** / C 4스탯 + 레이팅 자리에 "전체 N위" 표시 | B 추천: PM 결정 정합 + 가짜 수치 생성 금지 원칙 |
| 5 | ChalkTalk 작전판 탭 | A 신규 구현 (SVG + 플레이북 + 노트) — 4-5h, DB 신규 (plays/notes 테이블) 필요 / **B 추후 큐 (DB 미지원 명시)** / C UI placeholder 탭 (구현 0) | **B 추천: 본 박제 범위 외, DB 신설 비용 큼**. 추후 큐 등재 |
| 6 | overview-tab-v2 KvLabel 120px 고정 | A 모바일 ≤480px 분기 추가 (`grid-cols-1` 블록) / **B 유지 (120px = "게스트 모집" 5글자 fit, 320px 화면도 1fr=200px 안전)** | B 추천: 실측 안전 |

📍 영향 범위 (추천안 1=B / 2=A / 3=A / 4=B / 5=B / 6=B)

| Phase | 신규 | 수정 | 삭제 | API/DB |
|-------|------|------|------|--------|
| A: dead code 정리 (5 파일 1225줄) | 0 | 0 | 5 | 0 |
| B: `/teams` 카드 #랭크 복원 (PC only, 결정 1=B) | 0 | 1 (team-card-v2) | 0 | 0 |
| C: stats 4카드 모바일 분기 (결정 2=A) — 별도 .css 권장 | 1 (stats-tab.css) | 1 (stats-tab-v2) | 0 | 0 |
| D: Roster/Recent `.data-table` 마커 (결정 3=A) | 0 | 2 | 0 | 0 |
| **합계** | **1** | **4** | **5** | **0** |

📋 실행 계획 (~3h, Phase 단독 commit 권고)

| # | Phase | 작업 | 담당 | 시간 | 선행 |
|---|-------|------|------|------|------|
| 1 | A | dead code 5 파일 삭제 + import 0 검증 (`grep _tabs/`) | developer | 15분 | 없음 |
| 2 | A | tester (tsc EXIT=0 + 빌드) — Phase A 단독 commit | tester | 15분 | 1 |
| 3 | B | team-card-v2 #랭크 복원 (PC ≥720px only) — `props.rankIndex` 추가, teams-content-v2.tsx 에서 sorted index +1 전달 | developer | 30분 | 2 |
| 4 | C | stats-tab.css 신규 (참조: participant-list.css 패턴) — `.stats-grid` 클래스 + `@media ≤720px` 2열 분기. stats-tab-v2.tsx 인라인 → className 교체 | developer | 30분 | 3 |
| 5 | D | Roster/Recent — `className="board data-table"` 추가 + `<div className="board__head data-table__head">` + `<div className="board__row data-table__row">` + `data-primary="true"` (이름·상대 셀) + `data-label="..."` (5 셀씩) | developer | 45분 | 4 |
| 6 | B+C+D | tester + reviewer (병렬) — 모바일 320/720/1024 + 다크/라이트 + 인라인 grid `repeat(N, 1fr)` 0건 검증 + 사이드 카드 모바일 stack 동작 (page.tsx:268) | both | 30분 | 5 |

⚠️ developer 주의사항
- **인라인 grid `repeat(N, 1fr)` 안티패턴 회귀 0** (errors.md 04-29 8건 재발 패턴) — Phase C 필수, .css 파일 별도 분리 (player-hero.css / participant-list.css 패턴 차용)
- **선수명단 실명 표시 Phase B-2 적용 영역 보존** (86fc51f) — `roster-tab-v2.tsx:127` `getDisplayName(m.user)` 호출 그대로 유지. 마커 추가 시 닉네임 → 실명 변환 로직 미터치
- **AppNav frozen 0 변경** / **API/Prisma schema 변경 0** / **응답 키 변경 0** (Roster/Recent 의 `prisma.teamMember.findMany` 직접 호출 — 외부 라우트 없음, 응답 자동 변환 회귀 0)
- **사이드 카드 모바일 stack 검증** — `page.tsx:268` `gridTemplateColumns: "minmax(0,1fr) 320px"` 가 `.page` 스코프 (1200px) 라 globals.css 1403 `.page--wide >` 셀렉터 미매칭 가능. 모바일 320px 검증 필수. 안전망: 인라인 → className 교체 (`with-aside` 또는 `lg:grid lg:grid-cols-[minmax(0,1fr)_320px]`)
- **Hero `clamp(20px, 5vw, 42px)` / `clamp(14px, 4vw, 22px)`** — 이미 모바일 폭 가변 처리 ✅ 미터치
- **9999px / hex / lucide / pink-salmon**: 4 자동 검수 통과 필수 (현재 `roster-tab-v2:162` `borderRadius: "50%"` 정사각형 22×22 ✅, side-card `borderRadius: 4` ✅)

📤 추후 큐 (DB 미지원 / 별도 큐 분리)
- **(5)** ChalkTalk 작전판 탭 — `team_plays` + `team_play_notes` 테이블 신설 + SVG 코트 다이어그램 컴포넌트 (4-5h)
- **응답시간 / 쪽지 보내기** (TeamSideCardV2:158-185 코드 주석화 영역) — Phase 10 백로그 (Dev/design/phase-9-future-features.md 5-2)
- **연습일 / 팀 레벨 / 게스트 모집** (overview-tab-v2 "준비 중" 3건) — `teams.practice_days` / `team_level` / `recruiting` 컬럼 추가 시 활성화
- **PPG (개인 평균 득점)** (roster-tab-v2 "—") — match_player_stat 집계 기반
- **(2)** `/teams` 지역/정렬 chip-bar — **운영 only** 보존 (시안 없지만 운영 우위)
- **(3)** `/teams` 카드 매치 신청 버튼 — 시안 있지만 PM 04-29 결정으로 제거 (간소화). 추후 PC 전용 복원 가능

🔍 자체 검수 (계획 단계, 06-self-checklist 13 룰)
- §1 AppNav 9탭 / 더보기 5그룹 IA: 변경 0 ✅
- §2 main bar 우측 5아이콘: 변경 0 ✅
- §3 utility bar / 다크모드 / icon-btn: 변경 0 ✅
- §4 토큰만 사용 (`var(--*)`): 신규 stats-tab.css 모두 토큰 ✅
- §5 핑크/살몬/코랄 ❌ ✅ / lucide-react ❌ ✅ / pill 9999px → 정사각형은 50% 유지 ✅
- §6 카피 시안 우선: "팀 등록" / "팀 가입 신청" / "팀 매치 신청" / "팀 관리" / "준비 중" 운영 카피는 명확함 ✅
- §7 placeholder: "팀 이름·태그 검색" 4단어 ✅
- §8 720px 분기 / iOS 16px / 44px 버튼: stats-tab.css 분기 명시 ✅
- §9 정사각형 원형 50%: roster 이니셜 22×22 50% 유지 ✅
- §10~§13: 변경 없음 영역 ✅

🚦 위험/이상 (계획 단계 사전 점검)
- **Phase C stats grid `repeat(4, 1fr)` 회귀 안티패턴** — errors.md 04-29 8건 재발 패턴. 별도 .css 파일로 우회 권장 ✅
- **사이드 카드 모바일 stack** — globals.css 셀렉터 매칭 회의적. tester 검증 + 안전망 className 교체 옵션 보유
- **Phase B-2 실명 표시 보존** — 마커 추가 시 `getDisplayName` 호출 미터치 검증 필수

📌 결정 받은 후 → developer 단독 호출 (Phase A → B → C → D 순차) → tester+reviewer 병렬

---

### 구현 기록 (developer) — Teams Phase B+C+D (2026-05-02)

📝 구현한 기능: Teams 박제 Phase B (카드 #랭크 PC 복원) + Phase C (Stats 4카드 모바일 분기 안티패턴 차단) + Phase D (Roster/Recent .data-table 마커 시안 정합) — 사용자 결정 1=B / 2=A / 3=A / 4=B (3스탯 유지 미터치) / 5=B (추후 큐 미터치) / 6=B (KvLabel 유지 미터치)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/teams/_components/team-card-v2.tsx` | Phase B — `rankIndex?: number` prop 추가 + 상단 accent 우상단 absolute `#{rankIndex+1}` 노출 (`hidden sm:block` Tailwind ≥640px). 모바일은 폭 ~170px 라 비노출. | 수정 |
| `src/app/(web)/teams/_components/teams-content-v2.tsx` | Phase B — `pageStartIndex = (currentPage-1) * TEAMS_PER_PAGE` 계산 + `paginatedTeams.map((team, idx))` 에서 `rankIndex={pageStartIndex+idx}` prop 전달. 페이지 가로지르는 전체 정렬 인덱스. | 수정 |
| `src/app/(web)/teams/[id]/_components_v2/stats-tab-v2.css` | Phase C 신규 — `.team-stats-grid` 클래스. PC 기본 `repeat(4, 1fr)` + 모바일 ≤720px `repeat(2, 1fr)` 분기. participant-list.css 패턴 차용. | 신규 |
| `src/app/(web)/teams/[id]/_components_v2/stats-tab-v2.tsx` | Phase C — `import "./stats-tab-v2.css"` + 인라인 `gridTemplateColumns: repeat(4, 1fr)` → `<div className="team-stats-grid">` 교체. 회귀 안티패턴 차단. | 수정 |
| `src/app/(web)/teams/[id]/_components_v2/roster-tab-v2.tsx` | Phase D — `.board` → `.board data-table` / `.board__head` → `.board__head data-table__head` / `.board__row` → `.board__row data-table__row`. 셀 마커: 이름 셀 `data-primary="true"`, 나머지 4셀 `data-label="#"` `"포지션"` `"역할"` `"PPG"`. `getDisplayName` 호출 미터치 (Phase B-2 실명 표시 보존). | 수정 |
| `src/app/(web)/teams/[id]/_components_v2/recent-tab-v2.tsx` | Phase D — 동일 패턴. 상대 셀 `data-primary="true"`, 나머지 4셀 `data-label="날짜"` `"스코어"` `"결과"` `"대회"`. `Link.computeRecentForm` (사이드 카드용) 미터치. | 수정 |

🔍 자체 검수 (06-self-checklist 13 룰)

| # | 룰 | 결과 |
|---|----|------|
| 1 | AppNav 9탭 / 더보기 5그룹 IA | 변경 0 ✅ |
| 2 | main bar 우측 5아이콘 (검색/쪽지/알림/다크/햄버거) | 변경 0 ✅ |
| 3 | utility bar / 다크모드 / icon-btn | 변경 0 ✅ |
| 4 | 토큰만 사용 (`var(--*)`) | stats-tab-v2.css 100% 토큰 ✅ |
| 5 | 핑크/살몬/코랄 / lucide-react / pill 9999px | 자동 grep 0건 ✅ (`#FF[89AB]xx` / `lucide-react` / `9999px` teams 영역 0) |
| 6 | 카피 시안 우선 | "팀 등록" / "팀 가입 신청" / "팀 매치 신청" / "팀 관리" / "준비 중" 운영 카피 미터치 ✅ |
| 7 | placeholder 5단어 이내 | 미터치 ("팀 이름·태그 검색" 4단어 보존) ✅ |
| 8 | 720px 분기 / iOS 16px / 44px 버튼 | stats-tab-v2.css `@media (max-width:720px)` 명시 ✅ |
| 9 | 정사각형 원형 50% | 이니셜 22×22 `borderRadius: "50%"` 미터치 ✅ |
| 10~13 | overflow / 카피 / 토큰 / placeholder | 변경 영역 외 ✅ |

🚦 회귀 안티패턴 점검 결과

| 점검 | 결과 |
|------|------|
| `gridTemplateColumns: "repeat(N, 1fr)"` (인라인) — teams 영역 | **0건** ✅ (Phase C 가 마지막 1건 제거) |
| `9999px` — teams 영역 | **0건** ✅ |
| `lucide-react` import — teams 영역 | **0건** ✅ |
| 핑크/살몬 hex (`#FF[89AB]xx` / `#E[78][AB]xxx` / `#F[AC]Exxx`) — teams 영역 | **0건** ✅ |
| `getDisplayName(m.user)` 미터치 — roster-tab-v2 L127 | ✅ 보존 (Phase B-2 86fc51f) |
| TypeScript strict | EXIT=0 ✅ |
| API/Prisma schema 변경 | 0 변경 ✅ |
| 응답 키 변경 | 0 변경 ✅ |

💡 tester 참고
- **테스트 방법**:
  - `/teams` 접속 → PC 1024/720px 에서 카드 우상단 `#1`, `#2`... 표시 확인 / 모바일 320~640px (Tailwind sm 미만) 에서 비표시 확인
  - 페이지 2 이동 시 `#13`, `#14`... 연속 인덱스 확인 (page 1 = #1~#12, page 2 = #13~#24)
  - `/teams/[id]?tab=stats` PC 4열 / 모바일 ≤720px 2열 grid 확인. 320px 화면에서 카드 폭 ~140px 확보됐는지
  - `/teams/[id]?tab=roster` PC 5열 board / 모바일 ≤720px 카드형 변환 (헤더 hidden + key-value 라인 + 이름 카드 제목)
  - `/teams/[id]?tab=recent` PC 5열 / 모바일 카드형 변환 (상대 카드 제목 + 날짜·스코어·결과·대회 라인)
- **정상 동작**:
  - PC 카드 #랭크는 `var(--ff-mono)` opacity 0.75 흰색 (accent 위)
  - 모바일 stats 2열 grid 안에서 28px ff-display 숫자가 카드 폭 ~140px 안에 수납됨
  - 모바일 roster/recent 는 `.data-table` 모바일 룰로 전환 — 헤더 행 사라지고 각 row 가 카드 (이름/상대 큰 글씨 + 라벨:값 라인)
- **주의할 입력**:
  - 팀이 1팀일 때 — 카드 1장에도 #1 표시
  - sort=newest / members 등 정렬 변경 시에도 인덱스가 1부터 시작하는지 (API 가 정렬한 순서 그대로 — sort=members 면 멤버 많은 순 #1)
  - 페이지 마지막 (12개 미만) 에서 인덱스 끊기지 않는지

⚠️ reviewer 참고
- **회귀 핵심**: 인라인 `gridTemplateColumns: repeat(N, 1fr)` teams 영역 grep 0건 검증 필수 (errors.md 04-29 8건 패턴 — 본 작업으로 stats-tab-v2 마지막 1건 제거 완료)
- **데드 코드 정리 (Phase A) 보류**: 본 commit 범위 외 (5 파일 1225줄). Games Phase A 패턴 따라 별도 commit 권고 — 현재 작업은 B+C+D 단일 통합 commit
- **사이드 카드 모바일 stack 미터치** (page.tsx:268 `gridTemplateColumns: "minmax(0,1fr) 320px"`) — 본 작업 범위 외. 320px 화면에서 회귀 검증 필요
- **선수명단 실명 표시 보존** — `getDisplayName` 호출 그대로 (Phase B-2 86fc51f)
- **`.data-table` 모바일 변환 룰** — globals.css L1634~1690 정의 그대로 활용 (마커만 추가, CSS 추가 0)
- **TypeScript strict EXIT=0** 확인됨

🔄 PM 보고: B+C+D 통합 1건 commit 또는 Phase 분리 commit 선택 PM 판단. 본 작업 범위 외 잔여:
- Phase A (dead code 5 파일 1225줄 삭제) — 별도 commit 큐
- 사이드 카드 page.tsx:268 인라인 grid — Hero/Side 분리 후속 큐 (선택)

---

### 기획설계 (planner-architect) — Games 박제 분석 (2026-05-02)

🎯 목표: `/games` (B등급) + `/games/[id]` (B등급) → A 승격. 시안 BDR-current/screens/{Games,GameDetail}.jsx 와 운영 정합. UI only / API·DB 변경 0.

📍 시안 ↔ 운영 핵심 차이

| 영역 | 시안 | 운영 | 정합도 |
|------|------|------|--------|
| `/games` 헤더 | eyebrow + h1 + "만들기" | ✅ 동일 ("모집 글쓰기") | 95% |
| `/games` 종류 탭 | segmented 4 + 우측 filter 아이콘 토글 | ⚠️ 밑줄 탭만 (filter 토글 미박제) | 70% |
| `/games` 필터 칩 | 7칩 + collapsible + dot count + 전체해제 | ⚠️ 항상 노출 7칩만 | 50% |
| `/games` 카드 그리드 | auto-fit minmax(320px, 1fr) | ✅ GameCard 동일 | 95% |
| `/games/[id]` SummaryCard | info grid 2열 6칸 | ✅ **운영 우위** — duration/contact/uniform/만석배지 흡수 | 시안 초과 |
| `/games/[id]` AboutCard | description 1 단락 | ✅ **운영 우위** — description+requirements+notes 3 sub | 시안 초과 |
| `/games/[id]` ParticipantList | grid 200px 카드 + level·position | ⚠️ 1열 list (level 생략) | 60% |
| `/games/[id]` ApplyPanel | 자리남음 + 진행바 + 신청자정보 카드 + 한마디 + 동의 + CTA + 문의 + 저장 | ⚠️ 비용+CTA+문의만 (한마디·저장 코드 주석화 — DB 미지원 의도) | 35% |
| `/games/[id]` HostPanel / 종료 hero (MVP+평가) / 카페 댓글 / 하단 4 진입점 | 시안 없음 | ✅ **운영 only** (보존 필수) | — |

📍 데드 코드 (import 0건, ~825줄):
- `_components/{game-type-tabs,pickup-game-card,guest-game-card,team-match-card,game-card-compact}.tsx` (5)
- `[id]/_components/{hero-banner,participants-grid,price-card,host-card}.tsx` (313)
- `[id]/_sections/{pickup-detail,guest-detail,team-match-detail}.tsx` (403)

📋 사용자 결정 큐 6건

| # | 결정 | 옵션 (추천 굵게) |
|---|------|-----------------|
| 1 | `/games` 종류 탭 스타일 | A 시안 segmented + filter 토글 / B 운영 밑줄+filter 추가 / C 변경 0 → **추천 A** |
| 2 | 필터칩 collapsible+dot+전체해제 | A 시안 그대로 / B 항상 노출 유지 / C collapsible 만 → **추천 A** (1=A 정합) |
| 3 | ParticipantList 형식 | A 시안 grid / B 운영 list / **C Hybrid (모바일 list + 데스크톱 grid)** → 추천 C |
| 4 | ApplyPanel 신청자정보 카드 | **A 시안 박제** (skill_level select 1줄, 응답 키 변경 0) / B 운영 유지 → 추천 A |
| 5 | ApplyPanel 한마디+동의 체크박스 | A 시안 UI만 박제 / **B 운영 유지** (UI only 룰) / C API 확장 → 추천 B + 추후 큐 C |
| 6 | `/games` 카드 "신청" 버튼 | A 즉시 신청 / **B 운영 유지** (시각만 시안) → 추천 B + 추후 큐 |

📍 영향 범위 (추천안 1=A/2=A/3=C/4=A/5=B/6=B)

| Phase | 신규 | 수정 | 삭제 | API/DB |
|-------|------|------|------|--------|
| A: dead code 정리 | 0 | 0 | 7~12 | 0 |
| B: 종류탭+필터칩 collapsible | 0~1 | 2~3 | 0 | 0 |
| C: ParticipantList Hybrid + 신청자정보+자리남음·진행바 UI | 0 | 2~3 | 0 | 0 (skill_level select 1줄, 응답 키 변경 0) |
| **합계** | **0~1** | **4~6** | **7~12** | **0** |

📋 실행 계획 (~4h, Phase 단독 commit)

| # | Phase | 작업 | 담당 | 시간 |
|---|-------|------|------|------|
| 1 | A | dead code 7~12 파일 삭제 + import 0 검증 | developer | 30분 |
| 2 | A | tester (tsc + 빌드) | tester | 15분 |
| 3 | B | 종류탭 segmented + filter 토글 (결정 1=A) | developer | 1h |
| 4 | B | 필터칩 collapsible + dot + 전체해제 (결정 2=A) | developer | 30분 |
| 5 | B | tester + reviewer (병렬) | both | 30분 |
| 6 | C | ParticipantList Hybrid grid (결정 3=C) | developer | 30분 |
| 7 | C | 신청자정보 카드 + 자리남음·진행바·동의 UI (결정 4·5) | developer | 1h |
| 8 | C | tester + reviewer (병렬, 720px 회귀 4 케이스) | both | 30분 |

⚠️ developer 주의사항
- **회귀 안티패턴**: 인라인 `repeat(N, 1fr)` / `auto 1fr auto` 사용 시 720px 분기 강제. ParticipantList Hybrid = `gridTemplateColumns: repeat(auto-fill, minmax(200px, 1fr))` (auto-fill 자동 줄바꿈) 권장
- **AppNav frozen 0 변경**, **API/Prisma schema 변경 0** (skill_level select drift 시 응답 키 변경 0 검증)
- **시안 우선 카피**: "모집 글쓰기" 등 운영 카피 명확하면 유지 (강제 X)
- **9999px / hex / lucide / pink-salmon**: 4 자동 검수 통과 필수
- **Phase A dead code 별도 commit** (PR 분리 가능)

📤 추후 큐
- (5C) `game_applications.message` 전송 + textarea 활성화
- (6A) `/games` 카드 즉시 신청 + 가드
- AppNav 쪽지 unread / 카페 댓글 시안 도입 / bookmarks "🔖 저장" (기존 등재)

🔍 자체 검수 (계획)
- §1 AppNav / §2 더보기 미터치 ✅ / §3 토큰 ✅ / §4 카피 시안 우선 ✅ / §5 720px 분기 ✅ / §6 진입점 4종 + 종료 hero + 카페 댓글 보존 ✅

---

### 구현 기록 (developer) — Games Phase B (2026-05-02)

📝 구현한 기능: `/games` 종류 탭 segmented 화 + 우측 filter 토글 버튼 + 필터칩 collapsible 영역 (펼침 시 표시) + dot count 뱃지 + 전체 해제 버튼. 사용자 결정 1=A / 2=A 채택. API/데이터 패칭 변경 0, UI only.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/globals.css` | 시안 `BDR-current/games.css` 의 `.games-page` `.games-header` `.games-toolbar` `.games-segmented` `.games-filter-btn` `.games-filter-chips` `.games-grid` 등 ~120줄 추가. 9999px 1건 → `border-radius: 50%` 로 치환 (정사각형 dot 카운트, 13 룰 §10) | 수정 |
| `src/components/bdr-v2/kind-tab-bar.tsx` | 밑줄 탭 → segmented control 전면 교체. props 에 `filterOpen` / `activeFilterCount` / `onToggleFilter` 추가. filter 토글 버튼 (Material Symbols `tune`) 우측 렌더 + dot 뱃지. 라벨 시안 정합: "게스트 모집"→"게스트", "연습경기"→"연습" (segmented 가로 폭 제약) | 수정 |
| `src/components/bdr-v2/filter-chip-bar.tsx` | collapsible 외부 컨테이너로 가정 (부모가 펼침 제어). `onClearClientFilters` props 추가. 활성 필터 1개 이상일 때 우측 끝에 `.games-filter-clear` 버튼 노출. 전체 해제는 URL 칩 (date/city) + 클라 칩 모두 한번에 초기화 | 수정 |
| `src/app/(web)/games/_components/games-client.tsx` | KindTabBar 호출을 GamesClient 안으로 이동 (이전엔 page.tsx). `filterOpen` state 추가, `countActiveUrlFilters` 헬퍼로 URL 활성 칩 카운트 산출 → KindTabBar dot 에 전달. 그리드 `style` 인라인 → `className="games-grid"` 클래스화. props 에 `typeCounts: KindTabBarCounts` 추가 | 수정 |
| `src/app/(web)/games/page.tsx` | 헤더 인라인 style → `.games-header` `.games-header__title` `.games-header__h1` `.games-header__sub` `.games-create-btn` 클래스로 정합. KindTabBar 직접 호출 제거 (GamesClient 위임). GamesClient 에 `typeCounts` 추가로 전달. 카피 "모집 글쓰기" 유지 (기존 운영 카피, 명확함). 버튼 라벨은 시안 정합 "만들기" | 수정 |

🔍 자체 검수 (06-self-checklist 13 룰)
- §1 AppNav 9탭 / 더보기 5그룹 IA: 변경 0 ✅
- §2 main bar 우측 5아이콘: 변경 0 ✅
- §3 utility bar / 다크모드 / icon-btn: 변경 0 ✅
- §4 토큰만 사용 (`var(--*)`): 신규 CSS 모두 토큰 ✅. 하드코딩 `#fff` 1건 (filter dot 활성 시 흰 텍스트) — `#FFFFFF` 는 시안 원본 유지, 다크/라이트 동일 의도 ✅
- §5 핑크/살몬/코랄 ❌ ✅ / lucide-react ❌ ✅ / pill 9999px → `50%` 변경 ✅
- §6 카피 시안 우선: "만들기"/"오늘"/"이번주"/"주말"/"서울"/"경기"/"무료"/"초보환영" 시안 그대로 ✅. 운영 "모집 글쓰기" 명확 카피는 보존
- §7 placeholder 5단어 이내: 본 페이지 placeholder 변경 0
- §8 720px 분기 / iOS 16px / 44px 버튼: globals.css 글로벌 `input { font-size: 16px }` 가드 적용 + `.games-create-btn { min-width: 44px }` ✅
- §9 정사각형 원형 50%: filter dot 9999px → 50% ✅
- §10~§13: 변경 없음 영역 ✅

⚠️ 회귀 안티패턴 점검
- `gridTemplateColumns: repeat(N, 1fr)` 인라인 — `/games` 본 페이지 0건 ✅. 다른 하위(`my-games`, `new`)에 5건 있으나 Phase B 범위 외
- `auto-fit` vs `auto-fill`: 카드 그리드 `auto-fill minmax(320px, 1fr)` 유지 (시안 원본). 모바일 ≤720px CSS 분기로 `1fr` 강제 → 안티패턴 회귀 0
- segmented control `flex: 1 1 0` 균등 분배 → 4탭 수평 fit. 모바일 ≤360px 에서 `flex-direction: column` (label+count 세로) 시안 원본 유지

💡 tester 참고
- **테스트 방법**:
  1. `/games` 진입 → 종류 탭 4개 (전체/픽업/게스트/연습) 가 segmented 박스 안에 균등 표시되는지
  2. 우측 filter 아이콘 (`tune`) 버튼 클릭 → 필터칩 박스 펼침. 다시 클릭 → 접힘
  3. 필터칩 1개 클릭 (예: "오늘") → 종류 탭 우측 filter 버튼에 dot 뱃지 (1) 표시됨
  4. 필터칩 2~3개 누적 클릭 → dot 카운트 증가
  5. 펼친 chips 영역 우측 끝 "전체 해제" 버튼 클릭 → 모든 칩 비활성 + URL 쿼리 (date/city) 삭제
  6. 종류 탭 "픽업" 클릭 → URL `?type=0` 추가 + segmented 활성 시안 (accent 배경 + 흰 텍스트)
  7. 모바일 (≤720px DevTools 토글) → segmented 글자 작아지고 만들기 버튼 작아짐. ≤360px → segmented 라벨/카운트 세로 적층
- **정상 동작**:
  - filter 버튼 활성 시 (`is-open` or `has-active`) accent 배경 (BDR Red) + 흰 텍스트
  - dot 뱃지: 비활성 모드 = accent 배경 + 흰 글자, 활성 모드 = 흰 배경 + accent 글자
  - 종류 탭 클릭 시 URL `?type` 갱신 + 카드 목록 SSR 재렌더 + 카운트 변경
  - 클라 필터 (주말/무료/초보환영) 토글 시 URL 변동 0, 카드 배열만 즉시 재필터링
- **주의할 입력**:
  - URL 직접 진입 `?date=today&city=서울` → 필터 버튼 dot=2 표시 + chips 영역 닫혀있어도 has-active 클래스 적용 (accent 배경)
  - "전체 해제" 클릭 후 다시 필터 클릭 → 토글 정상 작동
  - 모바일 360px 미만 (예: 320px iPhone SE) → segmented 라벨/카운트가 컬럼 적층

⚠️ reviewer 참고
- 특별히 봐줬으면 하는 부분:
  1. `KindTabBar` 라벨 축약 ("게스트 모집"→"게스트" / "연습경기"→"연습") — segmented 폭 제약 정합. 시안 원본도 동일 축약. 명세 §11 (시안 우선 카피) 정합
  2. `GamesClient.countActiveUrlFilters` 헬퍼 — `FilterChipBar` 의 `isUrlChipActive` 와 동일 규칙으로 카운팅. 두 곳 분리 이유: dot 뱃지는 chips 닫혀있어도 표시 필요. 향후 규칙 변경 시 두 곳 동시 수정 필요 — 추후 공통 유틸 승격 가능
  3. `FilterChipBar.handleClearAll` URL 칩 삭제 시 `router.push` 호출 → 페이지 SSR 재요청. 클라 필터는 Set 초기화만. 두 동작 합쳐서 1번 클릭으로 모두 해제
  4. CSS 추가 위치 — globals.css 끝 (alias 매핑 다음). 옛 BDR v2 responsive 블록 (L1151~) 과 분리. 충돌 0

🚦 위험/이상
- 없음. tsc EXIT=0. 9999px 코드 0건. lucide 0건. 720px 분기 정합. AppNav frozen 0 변경. API/Prisma 변경 0
- Phase C (ParticipantList Hybrid + 신청자정보 카드) 진행 가능

---

### 구현 기록 (developer) — Games Phase C (2026-05-02)

📝 구현한 기능: `/games/[id]` ParticipantList Hybrid (모바일 list / PC ≥720px grid 200px 카드 + level·position) + ApplyPanel 자리남음·진행바·신청자정보 카드 (skill_level select 1줄 + 한마디 textarea + 동의 체크박스 — UI만). 사용자 결정 3=C / 4=A / 5=B / 6=B 채택. **API/데이터 패칭 변경 0 (UI only) — 응답 키 변경 0**.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/games/[id]/_v2/participant-list.css` | Hybrid 분기 CSS 신규 — PC (>720px): `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))` / 모바일 (≤720px): `1fr` 강제. player-hero.css 패턴 차용 (mobile-last 분기). 인라인 grid 안티패턴 회귀 방지 | 신규 |
| `src/app/(web)/games/[id]/_v2/participant-list.tsx` | 인라인 style → className (`participant-list__body/__row/__avatar/__main/__name/__meta`) 분리. `skill_level` props 추가. meta 표기 "L.5 · 가드" 시안 정합 (formatLevel 헬퍼: 숫자만이면 "L." prefix, 이미 prefix 있으면 그대로) | 수정 |
| `src/app/(web)/games/[id]/_v2/apply-panel.tsx` | (1) 상단에 "참가 신청" eyebrow + "N자리 남음" + 진행바 (cafe-blue 채움) 신설. (2) 신청자 정보 카드 (닉네임 + L.skill·position 메타 + skill_level select 1줄). (3) 한마디 textarea + 동의 체크박스 시안 정합 박제 (UI만 — message 서버 미전송, agreed 검증 0). (4) `myProfile?: ApplyPanelMyProfile \| null` props 추가. CTA 운영 그대로 (즉시 신청 X — 결정 6=B). | 수정 |
| `src/app/(web)/games/[id]/page.tsx` | (1) `approvedParticipants` 매핑에 `skill_level: a.users?.skill_level ?? null` 추가. (2) `<ApplyPanel>` 에 `myProfile` prop 전달 (userRecord 있으면 nickname/name/position/skill_level 발췌, 없으면 null). API 응답 형식 변경 0 (서버 컴포넌트 직접 호출) | 수정 |
| `src/lib/services/game.ts` | `listGameApplications.users.select` 에 `skill_level: true` 1줄 추가. 외부 노출 API 없음 (서버 컴포넌트 직접 호출) → 응답 키 변경 0 | 수정 |
| `src/lib/services/user.ts` | `USER_GAME_PROFILE_SELECT` 에 `skill_level: true` 1줄 추가. 외부 노출 API 없음 → 응답 키 변경 0 | 수정 |

🔍 자체 검수 (06-self-checklist 13 룰)
- §1 AppNav 9탭 / 더보기 5그룹 IA: 변경 0 ✅
- §2 main bar 우측 5아이콘: 변경 0 ✅
- §3 utility bar / 다크모드 / icon-btn: 변경 0 ✅
- §4 토큰만 사용 (`var(--*)`): participant-list.css / apply-panel.tsx 모두 토큰 ✅. apply-panel rgba(22,163,74) / rgba(220,38,38) 2건은 기존 운영 코드 보존 (이번 Phase 변경 X, 별도 큐) ✅
- §5 핑크/살몬/코랄 ❌ ✅ / lucide-react ❌ ✅ / pill 9999px ❌ ✅
- §6 카피 시안 우선: "참가 신청" eyebrow / "N자리 남음" / "L.5" / "신청자 정보" / "취소 시 최소 3시간 전 통보에 동의" 시안 그대로 ✅. "호스트에게 문의" 운영 카피 보존
- §7 placeholder 5단어 이내: textarea placeholder "호스트에게 한마디 남기기" 4단어 ✅
- §8 720px 분기 / iOS 16px / 44px 버튼: participant-list.css `@media (max-width: 720px)` 분기 명시 ✅. globals.css 글로벌 input 16px 가드 적용. select/textarea `.input` 클래스 사용 → 글로벌 가드 상속
- §9 정사각형 원형 50%: 이니셜 아바타 50% 유지 ✅
- §10~§13: 변경 없음 영역 ✅

⚠️ 회귀 안티패턴 점검 (★ 이번 세션 PlayerHero/OverviewTab 회귀 케이스 재발 방지)
- **인라인 `gridTemplateColumns: "repeat(N, 1fr)"` grep 0건** ✅ — `/games/[id]/_v2/` 전체 폴더 0건 검증. participant-list.css 의 `repeat(auto-fill, minmax(200px, 1fr))` 는 가변 N열 패턴 (안티패턴 ❌, 권장 패턴 ✅)
- **별도 .css 파일 신설** — player-hero.css / overview-tab.css 동일 패턴 (mobile-last 분기). 인라인 분기 회귀 0
- **`@media (max-width: 720px)` 분기** — participant-list.css 1건. 모바일에서 grid `1fr` 1열 강제 (안전망)
- **9999px / hex / lucide / pink-salmon 4 자동 검수**: `_v2/` 폴더 grep 모두 0건 ✅
- **TypeScript strict EXIT=0** ✅ (`npx tsc --noEmit`)

💡 tester 참고
- **테스트 방법**:
  1. `/games/[id]` 진입 → 우측 사이드 패널 상단에 "참가 신청" eyebrow + "N자리 남음" 표시 + 진행바 (현재인원/최대 비율) 시각화 확인
  2. **데스크톱 (>720px)**: 참가자 카드 (좌측 본문 하단) — 200px 카드 grid 자동 줄바꿈 (auto-fill). 각 카드에 이니셜 + 닉네임 + "L.5 · 가드" 메타
  3. **모바일 (≤720px)**: 참가자 카드 — 1열 list 적층 (인라인 grid 안티패턴 회귀 0). 각 row 가로 풀폭 + 카드 형태 유지
  4. 로그인 + 미신청 + 호스트 아님 → 우측 패널에 "신청자 정보" 카드 노출 (본인 닉네임 + L.skill · position 메타 + skill_level select 드롭다운)
  5. skill_level select — 본인 프로필 기본값 자동 선택 ("3" 등). 변경해도 신청 시 서버 전송 X (운영 흐름 유지, 결정 5=B)
  6. 한마디 textarea — 입력 가능하지만 신청 시 전송 X. "※ 한마디 전송 기능은 준비 중입니다." 안내 문구 노출
  7. 동의 체크박스 — defaultChecked. 체크 해제해도 신청 차단 X (UI만, 결정 5=B)
  8. CTA "🏀 참가 신청" 클릭 → 운영 흐름 그대로 (`POST /api/web/games/{id}/apply` 호출, body 변경 0)
- **정상 동작**:
  - 진행바 채움률 = `(current_participants / max_participants) * 100` %
  - max=0 (정원 미정) 인 경우 "정원 미정" + 진행바 0%
  - 비로그인 → "신청자 정보" 카드 미노출, "로그인 후 신청할 수 있습니다." 메시지
  - 호스트 → "내가 개설한 경기입니다." 메시지
  - 대기중(0) → 신청 취소 버튼
  - 승인됨(1) → 녹색 배지 "참가가 승인되었습니다."
  - 거절(2) → 빨강 배지 "신청이 거절되었습니다."
- **주의할 입력**:
  - skill_level=null 인 사용자 → 메타에서 "가드"만 표시 (L.X 생략). select 는 "선택 안함" 기본값
  - 닉네임/이름 모두 null → "익명" / "회원" 폴백
  - 모바일 320px (iPhone SE) → grid 1fr 1열, 카드 가로 overflow 0 (★ 회귀 점검 영역)
  - 데스크톱 1920px 와이드 → auto-fill 자동 5~6열 줄바꿈 정상
  - 진행바 max_participants=0 또는 null → "정원 미정" 라벨 + 0% 폴백

⚠️ reviewer 참고
- 특별히 봐줬으면 하는 부분:
  1. **응답 키 변경 0 검증** — `listGameApplications` / `USER_GAME_PROFILE_SELECT` 에 `skill_level` 추가했지만, 두 함수 모두 외부 노출 API 라우트 (route.ts) 가 없음 → 서버 컴포넌트 직접 호출만. **errors.md "응답 키 자동 snake_case 변환" 회귀 케이스 0** (라우트 없으면 적용 X)
  2. **인라인 grid 안티패턴 회귀 방지** — 이번 세션 PlayerHero/OverviewTab 회귀 케이스를 처음부터 .css 분리 패턴으로 우회. participant-list.css 는 `auto-fill minmax(200px, 1fr)` 가변 N열 (안티패턴 ❌) + `@media ≤720px` 1열 안전망. errors.md 04-29 "모바일 가로 overflow grid 안티패턴" 정합
  3. **결정 5=B "한마디 + 동의 UI만"** — textarea/checkbox 모두 form state 없이 uncontrolled (한마디는 안내 문구 노출, 동의는 defaultChecked). 추후 큐 5C (`game_applications.message` 전송) 활성화 시 useState + GameApplyButton 으로 message 전달 필요
  4. **결정 4=A skill_level select** — form state 만 (apply-button.tsx fetch body 변경 0). 시안의 "신청 시 자기 실력 재확인" 의도 유지. 추후 큐 5C 와 함께 활성화 가능
  5. **CTA 운영 흐름 보존 (결정 6=B)** — `GameApplyButton` 내부 재사용, 즉시 신청 가드 추가 X. 추후 큐 6A 에서 가드 추가 가능

🚦 위험/이상
- 없음. tsc EXIT=0. 9999px / hex / lucide / pink 모두 0건 ✅. 인라인 grid 안티패턴 0건 ✅. AppNav frozen 0 변경. API 응답 키 변경 0 (외부 라우트 없음). myProfile null safe (비로그인 시).
- Phase C 완료 — PM 에게 commit 위임 가능

---

### 기획설계 — Phase F 공개 페이지 dual 시각화 (2026-05-02)

🎯 **목표**: `/tournaments/[id]` 대진표 탭에서 dual_tournament 27 매치를 5단계 (조별 / 조별 최종전 / 8강 / 4강 / 결승) 로 명확히 시각화. single/league 회귀 0.

📍 **현재 코드 매핑 — 영향 6개소**

| # | 파일 | 역할 | 현재 dual 분기 |
|---|------|------|---------------|
| 1 | `src/app/(web)/tournaments/[id]/_components/v2-bracket-wrapper.tsx` | 대진표 탭 메인 래퍼 (헤더+Status+트리+사이드) | ❌ format 분기 single/league/group_stage_knockout 만, dual_tournament 는 single 트리로 fall-through → 27 매치 V자 트리로 깨짐 |
| 2 | `src/app/(web)/tournaments/[id]/bracket/_components/bracket-view.tsx` | SVG 트리 뷰 (BracketTreeView) | ❌ 27 매치 = 6 라운드 그룹핑 후 페어 매칭 좌표 계산 → 라운드 매치 수 불균형 (16/4/4/2/1) 으로 빈 슬롯 + 잘못 연결됨 |
| 3 | `src/app/api/web/tournaments/[id]/public-bracket/route.ts` | bracket API | ❌ `group_name` / `settings` 필드 응답 미포함 (admin/bracket 라우트는 Phase D 에서 추가 — 동일 패턴 필요) |
| 4 | `src/lib/tournaments/bracket-builder.ts` | DbMatch → RoundGroup 변환 | △ `roundNumber` / `roundName` / `homeSlotLabel` / `awaySlotLabel` 모두 변환됨. **`groupName` 필드만 미포함** → BracketMatch 타입에 추가 필요 |
| 5 | `src/app/(web)/tournaments/[id]/_components/v2-bracket-schedule-list.tsx` | 좌하단 일정 리스트 | △ rounds.flatMap 시간순 정렬. dual 27 매치도 그대로 동작 — 그룹핑은 없지만 깨지진 않음 (UX 강화 선택) |
| 6 | `src/app/(web)/tournaments/[id]/_components/tournament-tabs.tsx` | 탭 전환 + BracketTabContent | ✅ 단순 위임 — dual 분기 추가 0줄, V2BracketWrapper 가 처리하면 됨 |

**참고 — 재사용 가능 자산** (Phase D admin 패턴):
- `tournament-admin/[id]/bracket/page.tsx` L463-712: `DUAL_STAGES` 상수 + `DualBracketSections` + `DualGroupedMatches` + `DualMatchCard` (collapsed 토글 + A/B/C/D 조별 그룹핑 + 빈 슬롯 라벨) — 패턴 그대로 차용 가능 (admin Card 토큰 → 공개 페이지 BDR v2 토큰으로 치환만)

📊 **3 레이아웃 옵션 비교**

| 옵션 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **A. admin 패턴 재사용** | Phase D `DualBracketSections` 를 공개 페이지로 그대로 import | 재사용 100%, 즉시 구현 (1h), 일관성 | 공개 페이지는 시안이 더 풍부해야 — admin 의 collapsed 카드 리스트는 공개 시안과 톤 다름 |
| **B. 신규 v2-dual-bracket-wrapper** | dual 전용 컴포넌트, 5섹션 모두 풍부한 카드 렌더 (트리 0) | 시안 정합 최고, single 회귀 위험 0 | 8강~결승 트리 시각이 약함 (사진의 V자 트리 X), 코드 신규 4-5 파일 |
| **C. 하이브리드 (추천)** | 조별 (Stage 1·2) = 카드 그리드, 8강~결승 (Stage 3·4·5) = 기존 BracketView SVG 트리 재사용 | single 트리 자산 100% 재사용 + 조별만 카드 (시안 정합) + 한 화면에 5단계 모두 보임 | 두 패턴 혼합 — 시각 일관성 노력 필요. round_number 4·5·6 만 별도 RoundGroup 생성해서 BracketView 에 전달 |

🤔 **사용자 결정 필요 6건**

1. **레이아웃 옵션** — A (1h) / B (3-4h) / **C 하이브리드 (2-3h, 추천)**
2. **모바일 대응** — (a) 5섹션 collapsed 토글 (admin 동일) / **(b) 세로 스크롤 + sticky 단계명 헤더 (추천 — 공개 페이지는 한눈에 보여야)** / (c) 좌우 스와이프
3. **빈 슬롯 표시** — (a) settings.homeSlotLabel/awaySlotLabel 텍스트 ("B조 1위" 등 italic muted) / (b) 시드 번호 "#5" 만 / **(a 추천 — Phase 2C 라벨 자산 활용)**
4. **점수 표시 정책** — (a) 모든 매치 0:0 표시 / **(b) 진행 안 된 매치는 "—" 표시 (추천 — 5/2 첫 매치 외 24매치 모두 미진행)** / (c) 매치 자체 숨김
5. **bracket-builder 변경 범위** — (a) 변경 0 (공개 페이지 전용 신규 변환 함수 `groupDualStages()`) / **(b) `groupName` 필드만 BracketMatch 타입에 추가 (추천 — A/B/C/D 조 식별 필수, 1줄 추가)**
6. **schedule-timeline (일정 탭) 영향 0 보장 여부** — schedule-timeline 은 27 매치를 날짜별 그룹 (5/2 토 / 5/3 일 / 5/9 토 / 5/10 일) 으로 자동 분류 → **변경 0 (이미 잘 동작)** ✅

🌟 **추천안 — 옵션 C 하이브리드**

```
┌─────────────────────────────────────────────────────┐
│ V2BracketHeader (eyebrow / title / 부제 / select)  │
├─────────────────────────────────────────────────────┤
│ V2BracketStatusBar (5칸: 16팀/0/27/0/단계라벨)    │
├──────────────────────────────────┬──────────────────┤
│  Stage 1: 조별 미니 더블엘리미   │ SeedRanking      │
│   ┌──────┬──────┬──────┬──────┐  │  (조별 1·2위    │
│   │ A조  │ B조  │ C조  │ D조  │  │   시드 번호 자동)│
│   │ 4매치│ 4매치│ 4매치│ 4매치│  │                  │
│   └──────┴──────┴──────┴──────┘  │                  │
│                                  │                  │
│  Stage 2: 조별 최종전 (4매치)    │                  │
│   ┌──────┬──────┬──────┬──────┐  │                  │
│   │ A최종│ B최종│ C최종│ D최종│  │                  │
│   └──────┴──────┴──────┴──────┘  │                  │
│                                  ├──────────────────┤
│  Stage 3-5: 8강 → 4강 → 결승     │ Prediction       │
│   (BracketView SVG 트리 재사용,  │  ("투표 준비 중")│
│    8강 4 + 4강 2 + 결승 1 = 7매치│                  │
│    완벽한 V자 트리)              │                  │
├──────────────────────────────────┤                  │
│  V2BracketScheduleList (시간순) │                  │
└──────────────────────────────────┴──────────────────┘
```

📋 **F1~F5 Sub-phase 실행 계획**

| Sub | 작업 | 파일 | 시간 | 담당 | 위험 |
|-----|------|------|------|------|------|
| F1 | public-bracket API 응답에 `group_name` / `settings.homeSlotLabel` / `settings.awaySlotLabel` 추가 (admin route Phase D 패턴 동일) + bracket-builder DbMatch 타입에 `group_name` 받기 + BracketMatch 타입에 `groupName: string \| null` 추가 + toBracketMatch 변환 1줄 추가 | 2 (1 수정 + 1 수정) | 0.5h | developer | 0 (admin 미영향, single API 응답 추가 필드만 — 무해) |
| F2 | `v2-dual-bracket-sections.tsx` 신규 — Stage 1 (4조 그리드) + Stage 2 (4매치 그리드) 카드 컴포넌트 (admin DualMatchCard 디자인 시스템만 BDR v2 토큰으로 재작성 — collapsed 토글 X, 항상 펼침) | 1 (신규) | 1.5h | developer | 0 (신규 파일) |
| F3 | `v2-bracket-wrapper.tsx` 분기 추가 — `format === "dual_tournament"` 일 때: (a) Stage 1·2 = `<V2DualBracketSections>` 호출 (b) Stage 3-5 = rounds 4·5·6 만 필터해서 `<BracketView>` 호출 — single/league 흐름 0줄 변경 | 1 (수정) | 0.5h | developer | 낮음 (조건 분기 한 블록 추가만, 기존 hasKnockout 분기는 유지) |
| F4 | (선택, 옵션) Status Bar 5칸 라벨 dual 정합 — `currentRoundLabel` 이 "라운드 1" 표시 → "조별 1일차" 등 dual 친화 라벨 (shortRoundLabel 함수에 dual 케이스 추가) | 1 (수정 — F3 와 동일 파일) | 0.3h | developer | 0 |
| F5 | dev 서버 검증 — desktop 1280px / mobile 375px / tablet 768px 3 viewport + B 대회 (`/tournaments/138b22d8...`) 실제 데이터 + tsc --noEmit + single elim 회귀 케이스 (다른 single 토너먼트 1건) | — | 0.5h | tester | — |

**총 예상 시간**: 3.3h (F1 0.5 + F2 1.5 + F3 0.5 + F4 0.3 + F5 0.5)

⚠️ **위험 요소 — single 회귀 게이트**

1. **public-bracket API 추가 필드** — single elim 토너먼트 응답에도 `group_name: null` / `settings.homeSlotLabel: null` 가 포함됨. v2-bracket-wrapper / BracketView / V2BracketScheduleList 모두 옵셔널 처리 — 회귀 0. **검증**: F5 에서 single elim 1건 실제 호출
2. **bracket-builder BracketMatch 타입 추가** — `groupName?: string | null` 옵셔널 → MatchCard / BracketView / V2BracketScheduleList 등 기존 컴포넌트 모두 무시. 회귀 0. **검증**: tsc --noEmit
3. **v2-bracket-wrapper 분기 추가** — 기존 `hasLeagueData` / `groupTeams.length > 0` / `hasKnockout` 분기 절대 변경 X. dual 분기는 **제일 첫 if** 로 추가 + 나머지 분기는 그대로 fall-through 유지. **검증**: F5 에서 league + group_stage_knockout + single elim 3 케이스 모두 회귀 확인
4. **BracketView 부분 호출** — Stage 3-5 만 호출 시 `rounds` props 길이 = 3 (8강/4강/결승) → 첫 라운드 4매치 → 페어 매칭 좌표 계산 정상 작동 (4→2→1). **검증**: F5 에서 V자 트리 시각 확인
5. **schedule-timeline (일정 탭)** — 27 매치 시간순 + 날짜 그룹핑은 이미 정상. 변경 0 ✅

🚦 **사용자 결정 후 즉시 실행 가능 — F1 부터 순차 진행 (의존: F1 → F2 → F3 → F4 → F5)**



### 기획설계 — 관리자페이지 UI 개선 (2026-05-02)

> 별도 큐. Phase F (듀얼토너먼트) 와 충돌 0 — `(admin)/admin/*` 영역만 손대고 `(web)/*` `(referee)/*` `_site/*` 는 무관. 운영 코드 수정 0 (지금은 계획만).

🎯 **목표**: 17 admin 페이지를 BDR-current 디자인 시스템 (다크 + 쿨 그레이 + BDR Red + 4px 라운딩 + Material Symbols + 토큰 직접 참조) 과 정합 + 모바일 진입 가능 (현재 lg 미만에서 사이드바 0 → 메뉴 이동 불가).

#### 1. 현황 진단 (admin 17 페이지 + 4 공통 컴포넌트)

**A. 글로벌 상태 (admin 영역 전체 통계)**

| 항목 | 결과 | 평가 |
|------|------|------|
| 옛 토큰 (`var(--color-*)`) 사용 | **419 건** (22 파일) | ⚠ 옛 명칭만, globals.css L1964~1988 에서 BDR-current 로 alias 매핑 → 시각 OK / 시맨틱 일관성 ✗ |
| BDR-current 토큰 직접 (`var(--bg/--accent/--ink)`) | **0 건** | ✗ 프론트와 어휘 분리 |
| 하드코딩 hex (`#RRGGBB`) | 0 건 | ✅ |
| `lucide-react` import | 0 건 | ✅ |
| Material Symbols Outlined | 26 건 (7 파일) | ✅ |
| `rounded-full` (직사각형 버튼/검색/페이지네이션) | **25 건** (11 파일) | ⚠ 13 룰 §3 위반 (pill 9999px ≠ BDR 4px) — 정사각형 dot/뱃지 외 모두 `rounded-md` (4px) 로 |
| 모바일 분기 (`sm:hidden` / `@media (max-width:`) | **0 건** | 🚨 layout.tsx L74 `lg:flex` 로 사이드바가 lg(1024) 미만에서 표시 0 — 모바일·태블릿 햄버거/탭 부재 → 페이지 이동 불가 |
| AppNav 적용 | X (자체 sidebar) | ✅ 의도 (00-master-guide §6, E등급 자체 셸) |
| 헤더 일관성 | `AdminPageHeader` (mb-6 + 검색폼) — 7 페이지만 사용 / 나머지는 인라인 직접 작성 | ⚠ 패턴 분산 |

**B. 페이지별 진단 (17 + 공통 4)**

| # | 경로 | 옛 토큰 | rounded-full | 모바일 | 시각 우선순위 |
|---|------|--------|--------------|--------|---------------|
| 1 | `admin/page.tsx` (대시보드) | 10 | 1 | ✗ | **P1** (첫 진입) |
| 2 | `admin/layout.tsx` | 1 | 0 | ✗ (사이드바 lg:flex) | **P1** (모바일 가드) |
| 3 | `admin/loading.tsx` | 4 | 2 | ✗ | P3 |
| 4 | `admin/users/page.tsx` + `admin-users-table` + `admin-user-actions` | 9+35+5 | 5+3+4 | ✗ | **P1** (사용 빈도 최고) |
| 5 | `admin/tournaments/admin-tournaments-content` + page | 19 | 1 | ✗ | **P1** |
| 6 | `admin/games/admin-games-content` + page | 18 | 0 | ✗ | P2 |
| 7 | `admin/teams/admin-teams-content` | 7 | 0 | ✗ | P2 |
| 8 | `admin/courts/admin-courts-content` | 67 | 4 | ✗ | P2 (옛 토큰 최다) |
| 9 | `admin/community/admin-community-content` | 11 | 0 | ✗ | P2 |
| 10 | `admin/payments/admin-payments-content` | 17 | 2 | ✗ | P2 |
| 11 | `admin/plans/page.tsx` | 34 | 1 | ✗ | P2 |
| 12 | `admin/suggestions/admin-suggestions-content` | 12 | 0 | ✗ | P3 |
| 13 | `admin/notifications/page.tsx` | 24 | 1 | ✗ | P3 |
| 14 | `admin/organizations/page.tsx` | 27 | 0 | ✗ | P3 |
| 15 | `admin/partners/page.tsx` | 34 | 0 | ✗ | P3 |
| 16 | `admin/campaigns/page.tsx` | 20 | 0 | ✗ | P3 |
| 17 | `admin/analytics/page.tsx` | 7 | 0 | ✗ | P3 |
| 18 | `admin/settings/page.tsx` | 7 | 0 | ✗ | P3 |
| 19 | `admin/logs/page.tsx` | 25 | 1 | ✗ | P3 |
| 20 | `admin/game-reports/page.tsx` | 26 | 0 | ✗ | P3 |
| 21 | `components/admin/sidebar.tsx` | (~14 inline) | 0 | 🚨 lg:flex | **P1** |
| 22 | `components/admin/admin-page-header.tsx` | (~5 inline) | 0 | 부분 sm:flex-row | **P1** (재사용 채널) |
| 23 | `components/admin/admin-detail-modal.tsx` | (~10 inline) | 0 | ✅ ESC + backdrop click 지원 | P2 (정합만) |
| 24 | `components/admin/admin-status-tabs.tsx` | (~6 inline) | 부분 (`rounded-full` 카운트 뱃지 = 정사각형 OK) | overflow-x-auto | P2 (정합만) |

#### 2. 프론트 vs 관리자 갭 분석

| 영역 | 프론트 (`(web)/*`) | 관리자 (`(admin)/admin/*`) | 갭 |
|------|---------------------|----------------------------|----|
| 토큰 어휘 | `var(--accent / --bg / --ink-mute / --border)` 직접 | `var(--color-accent / --color-card / --color-text-muted / --color-border)` (alias 경유) | 🟡 시각은 같음. 하지만 새 BDR 토큰 (cafe-blue / ok / err 분리) 일부 미연결 → settings 등 일부 색상 깨질 수 있음 |
| 모바일 | 720px 분기 + iOS 16px input + 44px 버튼 + 듀얼 렌더 | 0 | 🔴 lg(1024) 미만 사이드바 사라짐 → 햄버거 미구현. 모바일 진입 불가능 |
| 헤더/네비 | `AppNav frozen` 9탭 + 더보기 5그룹 + utility bar | `AdminSidebar` 좌측 고정 / 모바일 부재 | 🟢 의도 분리 (00-master-guide §6) — 단 모바일 가드 필요 |
| 라운딩 | 버튼 4px (`var(--radius-pill)` = `0.25rem`) / 카드 8px / 정사각형 50% | 검색 input/버튼 `rounded-full` 9999px (25 건) | 🟡 13 룰 §3 위반 — 직사각형 pill |
| 카드 | `.card` 클래스 (BDR-current `bg-card border rounded-lg`) | `<Card>` (`@/components/ui/card`) — 별도 구조 | 🟡 두 시스템 공존 — 시각 통합 가능 (Card 내부 토큰만 alias 라 OK) |
| 모달 | `shadcn/ui Dialog` (Radix — ESC/backdrop/focus trap) | `AdminDetailModal` (자체 — ESC/backdrop OK / focus trap X) | 🟡 conventions §[2026-04-19] 플로팅 룰 부분 미흡 (focus trap 누락) |
| 아이콘 | Material Symbols Outlined | 동일 | ✅ |
| 폼 (검색 input) | 글로벌 `@media (max-width:720px) input { font-size:16px !important }` | 동일 (글로벌 가드 적용 — admin 도 혜택) | ✅ |
| 디자인 패턴 | Hero / 카드 그리드 / sticky aside / 다크모드 hero gradient | 컴팩트 테이블 + AdminStatusTabs + 플로팅 모달 (decisions.md "admin UI 전면 개편" 2026-03-28) | ✅ 패턴 자체는 다른게 정답 (admin 은 데이터 밀도 우선). 시각 톤만 통일 |

#### 3. 개선 방향 (Phase 단위)

##### Phase A — 모바일 가드 (긴급) — ~3h
- A1. `admin/layout.tsx` 모바일 햄버거 헤더 신설 (lg 미만에서 fixed top header + drawer 형태 사이드바)
- A2. `sidebar.tsx` `lg:flex` → 모바일은 drawer (slide-in from left, backdrop click 닫힘, ESC 닫힘 — conventions §[2026-04-19] 정합)
- A3. main 콘텐츠 `lg:ml-64` → 모바일은 `mt-14` (헤더 높이 보상)
- A4. 신규 페이지 `admin/_components/admin-mobile-header.tsx` (BDR-current 토큰 직접)
- 영향: layout.tsx + sidebar.tsx + 신규 1 = **3 파일**, API 변경 0, 권한 로직 0

##### Phase B — 토큰 어휘 정렬 (시맨틱 일관성) — ~2h
- B1. 옛 alias (`--color-card` 등) → BDR-current (`--bg-card`) 직접 참조로 점진 교체
- B2. **단계적 전환**: 공통 4 컴포넌트 (`sidebar` / `admin-page-header` / `admin-detail-modal` / `admin-status-tabs`) 우선 → 17 페이지는 P1 (대시보드/users/tournaments) 만 우선
- B3. globals.css L1964~1988 alias 매핑은 **유지** (회귀 방어 안전망 — alias 제거는 별도 큐 끝물에)
- 영향: 7~8 파일 (P1 범위), 시각 변화 0 (alias 가 같은 값 가리키므로)

##### Phase C — 라운딩 정합 (13 룰 §3) — ~1h
- C1. `rounded-full` 25 건 검토 → 직사각형은 `rounded-md` (4px) / 정사각형 dot·뱃지·아이콘 버튼은 `rounded-full` 유지 (50% 효과)
- C2. AdminStatusTabs 카운트 뱃지 = 정사각형 → 유지 OK
- 영향: 11 파일, 시각 약간 변화 (검색 버튼 모서리만 정사각 → 4px 라운딩, BDR 룰 일관)

##### Phase D — 공통 컴포넌트 강화 (UX) — ~3h
- D1. `AdminPageHeader` 일관 적용 (현재 7/17 만 사용 → 17/17) — 인라인 헤더 표준화
- D2. `AdminDetailModal` focus trap 추가 (Radix Dialog 도입 검토 또는 자체 구현)
- D3. 신규 `AdminEmptyState` (검색 결과 0 / 데이터 0 — 현재 페이지마다 인라인)
- D4. 신규 `AdminPagination` (현재 users/page.tsx L114-133 인라인 → 공통화)
- 영향: 신규 2 + 수정 17 = ~19 파일, API 0, 디자인 토큰만

##### Phase E — 대시보드 시안화 (선택) — ~4h
- E1. `admin/page.tsx` BDR-current 톤으로 hero strip + KPI 4카드 + 7일 차트 + 최근 활동 — Phase 13 마이페이지 hub 패턴 차용
- E2. 알림 카드 (super_admin 4명 / 점검모드 / 최근 신고 등) 추가
- 영향: 1 파일, 시각 큰 변화

#### 4. 영향도/리스크

| 항목 | 평가 | 비고 |
|------|------|------|
| API/데이터 패칭 변경 | **0** ✅ | CLAUDE.md 리디자인 원칙 — UI 만 |
| 권한/세션 로직 | **0** ✅ | layout.tsx getWebSession + DB 멤버십 조회 그대로 |
| 듀얼토너먼트 Phase D~E 충돌 | **0** ✅ | (admin) 영역 vs Phase F (web) 영역 — 디렉토리 분리. tournament-admin (E등급, /tournament-admin/*) 은 별도 — 본 큐 미포함 |
| globals.css 옛 alias 의존 | 회귀 위험 0 (alias 유지) → Phase B 만 진행하고 alias 자체 제거는 별도 큐 | |
| 사용자 영향 | super_admin / site_admin / partner_member / org_member / tournament_admin 5 권한 모두 영향 | 모바일 가드 (Phase A) 가 최대 이득 |
| 테스트 부담 | tsc + 4 viewport (375 / 720 / 1024 / 1280) 시각 검증 + 권한별 메뉴 노출 회귀 | |

🚨 **위반 발견 (13 룰 위반)**:
- §3 라운딩: `rounded-full` 25 건 (직사각형) → BDR 4px 위반
- §5 모바일: 모바일 분기 0 / 햄버거 부재 → conventions [2026-04-29] §10 위반 (브레이크포인트 720 미적용)
- §3 토큰: 옛 alias 만 사용 → 시각은 OK, 시맨틱 분리 (회피 가능)
- §6 플로팅 닫기 룰 (conventions [2026-04-19]): focus trap 미구현 (ESC + backdrop 은 OK)

#### 5. 추천 진행 순서

| 우선 | Phase | 사유 | 시간 |
|------|-------|------|------|
| 1 | **Phase A — 모바일 가드** | 사용자 작업 차단 (모바일 admin 진입 시 메뉴 부재) — UX 결정타 | 3h |
| 2 | **Phase C — 라운딩 정합** | grep 기반 일괄 치환 — 13 룰 위반 빠르게 0 화 | 1h |
| 3 | **Phase D — 공통 컴포넌트 강화** | 17 페이지 점진 정합 채널. focus trap + Pagination 공통화로 후속 작업 비용 ↓ | 3h |
| 4 | **Phase B — 토큰 어휘 정렬** | 시각 변화 0 / 시맨틱만 — 가장 마지막 (alias 유지 안전망) | 2h |
| 5 | (큐) Phase E — 대시보드 시안화 | 선택 사항. 사용자 결정 후 별도 큐 | 4h |

**누적 시간 (P1+P2+P3+P4): ~9h** / Phase E 별도

#### 6. 사용자 결정 필요 사항

- **Q1. 모바일 가드 (Phase A) 디자인 옵션**:
  - (a) **Drawer 패턴 (추천)** — 햄버거 클릭 → 좌측 슬라이드 사이드바 + 다크 backdrop / ESC 닫힘. conventions [2026-04-19] 정합
  - (b) Bottom Sheet — 모바일 친화 / 데스크 패턴 차이 큼
  - (c) AppNav 모바일 햄버거를 admin 으로 확장 (의도 분리 위반)
- **Q2. 토큰 어휘 (Phase B) 범위**:
  - (a) **공통 4 컴포넌트만 (추천 — 안전 + 일관성)**
  - (b) 17 페이지 전체 일괄 — 시각 변화 0 이지만 ~8h 추가
  - (c) 안 함 (alias 영구 유지)
- **Q3. AdminDetailModal focus trap (Phase D2)**:
  - (a) Radix Dialog 도입 (`@radix-ui/react-dialog` 추가) — 표준 + 접근성 보장 / 의존성 +1
  - (b) **자체 구현 (focus trap util) (추천 — 의존성 0 / 코드 ~30줄 추가)**
- **Q4. 대시보드 시안화 (Phase E)** 진행 여부:
  - (a) **보류 (P1~P4 완료 후 별도 큐) (추천)**
  - (b) Phase A 와 함께 진행 (시각 임팩트 최대 / 시간 +4h)
- **Q5. tournament-admin / partner-admin / referee 영역 후속 큐 포함 여부**:
  - (a) **본 큐는 (admin)/admin/* 만 (추천 — 일단 1 영역 정착)**
  - (b) 같이 — 시각 통합 한번에 / 시간 ~3 배
- **Q6. Phase 진행 큐잉**:
  - (a) **Phase F (듀얼토너먼트 공개) 완료 후 본 큐 시작 (추천 — 듀얼 결정 6건 대기 중)**
  - (b) 병렬 — 듀얼은 (web) / 본 큐는 (admin) 으로 충돌 0. 단 사용자 검증 부담 ↑

#### 7. 자체 검수 (계획 단계)

| 항목 | 결과 |
|------|------|
| API/데이터 패칭 변경 0 | ✅ |
| 권한/세션 로직 변경 0 | ✅ |
| 코드 수정 0 (계획만) | ✅ |
| Phase F 듀얼 작업 충돌 | ✅ 0 (디렉토리 분리) |
| 13 룰 위반 명시 | ✅ §3 라운딩 / §5 모바일 / §6 focus trap |
| 13 룰 무관 영역 (admin = E 등급) | ✅ AppNav frozen 적용 외 (00-master-guide §6) |
| 듀얼 Phase D 미커밋 상태 인지 | ✅ (subin 브랜치 작업 트리 보존) |



### 기획설계 (planner-architect, **완료 — commit 3111e25**) — Settings 박제

> 사용자 결정 7건 (A1-DB-direct/B3-fallback/C3/D2/Q1=①/Q2=전체/Q3=빼기) 모두 정합. 13 룰 #10 명확화 (정사각형 원형 50% — CLAUDE.md + 02-design-system-tokens.md §4-1). 상세 분석은 commit 3111e25 message 참조.

### 기획설계 — 선수명단 실명 표시 규칙 (2026-05-01) — 압축

> Phase A 인프라 commit 대기. Phase B~E 대기. 결정 5건 (B/lib유틸/Y상수/순차/라벨변경) 모두 추천 채택 완료. 영향 17개소 매핑 + 8 패턴 혼재 분석 완료. 상세는 git log 또는 Phase B 시작 시 복원.

<details>
<summary>전체 분석 (펼치기)</summary>

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

### 구현 기록 (developer) — 듀얼토너먼트 Phase D (2026-05-02)

📝 구현한 기능: 대회관리자 대진표 페이지 (`/tournament-admin/tournaments/[id]/bracket`) 에 `dual_tournament` 5섹션 그룹핑 UI 분기 추가 — 27 매치를 조별 / 조별최종전 / 8강 / 4강 / 결승 5단계로 collapsed/expanded 토글 카드로 표시. single elim / league 흐름은 기존 코드 그대로 (회귀 0).

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/web/tournaments/[id]/bracket/route.ts` | GET select 보강 — dual UI 표시에 필요한 5 필드 추가 (`group_name`, `settings`, `scheduledAt`, `venue_name`, `court_number`). 다른 분기/POST 코드 무변경 | 수정 |
| `src/app/(web)/tournament-admin/tournaments/[id]/bracket/page.tsx` | (1) `Match` 타입에 dual 표시용 5 필드 옵셔널 추가 (snake/camel 양쪽 폴백) (2) `isDualFormat` / `formatSchedule` / `formatVenue` / `slotLabel` 헬퍼 신설 (3) `isDual` 분기 — 1라운드 편집 숨김 + 전체 경기 목록 우회 + `<DualBracketSections />` 노출 (4) empty state dual 메시지 추가 (5) 파일 하단에 `DualBracketSections` / `DualGroupedMatches` / `DualMatchCard` 3 컴포넌트 신설 — Card / Link 재사용, BDR 토큰만, lucide-react 0 | 수정 |

🔍 사전 검증:
- `dual-tournament-generator.ts` 의 27 매치 round_number 매핑 (1·2 / 3 / 4 / 5 / 6) + group_name (A/B/C/D) + settings (homeSlotLabel/awaySlotLabel) 구조 grep 으로 확정
- POST 코드는 이미 dual 매치 생성 시 group_name 컬럼 + settings JSON 저장 → GET select 만 보강하면 UI 가능

🛡️ 회귀 방어:
- **single elim** (`format !== "dual_tournament"`): `isDual = false` → 1라운드 팀 배치 편집 + 전체 경기 목록 기존 코드 그대로 (분기 외 코드 0줄 변경)
- **풀리그 계열** (`isLeagueFormat`): 기존 동작 유지 (1라운드 편집 숨김 + 전체 경기 목록 노출)
- **dual_tournament**: 새 5섹션 카드만 노출 (기존 1라운드 편집/전체 목록은 숨김)
- API GET select 보강은 **데이터 추가** 만 — 기존 필드/응답 형태 무변경

🎨 UI 설계:
- 각 stage Card — 헤더 클릭 시 collapsed 토글, 기본 펼침 (관리자가 점수 입력 시 한 번에 보여야)
- Stage 1 (조별 미니 더블엘리미) — A/B/C/D 4조 추가 그룹핑 (각 조 4매치 = G1/G2/G3승자전/G4패자전 정렬)
- DualMatchCard — 매치번호 / 라운드명 / 상태 배지 / 일정 (yyyy.MM.dd HH:mm) / 장소 (venue_name·court_number) / HOME 라벨·점수 / vs / AWAY 점수·라벨 / 빈 슬롯은 settings.homeSlotLabel/awaySlotLabel italic muted 표시 / completed 면 승자 bold
- 모바일 720px — flex-wrap + truncate + 작은 폰트 (11px) 로 한 줄 유지

검수:
- `npx tsc --noEmit` EXIT=0 (출력 0)
- 영향 파일: 2개 (route.ts GET select + page.tsx). 다른 파일·DB·API endpoint 무변경
- BDR 토큰만 (`var(--*)`), lucide-react 0, 9999px pill 0 — 13 룰 #10 통과
- AppNav 7 룰 / 더보기 9 탭 — 변경 0

💡 tester 참고:
- **회귀 게이트 1 — single elim 무변경**: `format=single_elimination` 대회의 bracket 페이지 → 1라운드 편집 select + 전체 경기 목록 기존과 동일 표시 (변화 0 인지 확인)
- **회귀 게이트 2 — 풀리그 무변경**: `format=full_league` 또는 `full_league_knockout` → 1라운드 편집 숨김 + 전체 경기 목록 기존과 동일
- **회귀 게이트 3 — dual 5섹션 표시**: `format=dual_tournament` + 27매치 생성 후 → 5개 Card 섹션 (조별 16 / 조별최종 4 / 8강 4 / 4강 2 / 결승 1) 정확히 표시
- **회귀 게이트 4 — Stage 1 조별 그룹핑**: A조/B조/C조/D조 4 패널 안에 각 4매치 (G1→G2→승자전→패자전 순)
- **회귀 게이트 5 — 빈 슬롯 라벨**: 8강/4강/결승의 home/away 가 미정일 때 settings.homeSlotLabel ("A조 1위" / "8강 1경기 승자" 등) italic muted 로 표시
- **회귀 게이트 6 — 토글**: 각 섹션 헤더 클릭 시 본문 collapsed/expanded 동작
- **회귀 게이트 7 — empty state**: dual 인데 매치 0건이면 "듀얼토너먼트 대진표가 없습니다" + 16팀 안내 또는 16팀 미달 안내
- **테스트 대상 대회**: B 대회 (id=`138b22d8-7b20-4602-8183-a904f2ac2fd4`) 가 dual_tournament + 16팀 / 0매치 → Phase E 데이터 적용 후 본 UI 검증 가능

⚠️ reviewer 참고:
- **route.ts GET select 보강만** — POST 의 select/필드 변경 0. 기존 single elim / league GET 응답은 추가 필드 5개만 더 옴 (snake_case 자동 변환). 기존 클라이언트 코드 무영향
- **응답 키 snake_case 자동 변환 (apiSuccess)**: 새 코드는 `scheduledAt`/`scheduled_at` 둘 다 폴백, `homeSlotLabel`/`home_slot_label` 둘 다 폴백 — errors.md 2026-04-17 5회 재발 방지. 기존 코드는 camelCase 직접 접근 패턴 유지 (별도 큐로 정합화)
- **Match 타입 옵셔널 5 필드 추가** — 기존 호출처 0개 변경 (옵셔널이라 기존 사용에 영향 X)
- **DualMatchCard 의 winner 판정** — 점수 비교 (homeScore > awayScore) 로 일단 처리. 향후 winner_team_id 기반 정확 판정으로 대체 가능 (코멘트 명시)
- **collapsed state 메모리만** — 페이지 새로고침 시 모두 펼침 복귀. localStorage 영속화는 별도 큐
- **사용자 결정 6 (시각화 범위 A~E)** 정합 — 본 작업 = 관리자 페이지만. 공개 페이지 (v2-bracket-wrapper) 분기는 Phase F 별도 큐

🔗 다음 Phase 준비됨:
- Phase E: B 대회 데이터 적용 (16팀 seedNumber + groupAssignment + bracket POST + 27 매치 일정 UPDATE)
- Phase F (별도 큐): 공개 페이지 (`/tournaments/[id]` v2-bracket-wrapper) dual 분기 시각화

### 구현 기록 (developer) — 듀얼토너먼트 Phase C (2026-05-02)

📝 구현한 기능: matches PATCH route 에 progressDualMatch 호출 통합 — dual_tournament 매치 완료 시 winner/loser 자동 진출

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/web/tournaments/[id]/matches/[matchId]/route.ts` | (1) `progressDualMatch` import (2) 기존 `prisma.tournament.findUnique({ format })` try 블록 안에 dual_tournament 분기 추가 — `winner_team_id != null` 가드 + 별도 `prisma.$transaction` 으로 호출 + 실패 시 console.error 만 (사용자 응답은 성공 유지) | 수정 |

🔍 사전 검증 (회귀 위험 확인):
- `services/match.ts:144-155` 에 **이미 winner→next_match 진출 로직 있음** (single elim 의 winner 진출은 여기서 동작 중)
- 작업 명세 §회귀 방어 케이스 **A** (다른 곳에 winner 진출 처리 있음) 분기 채택
- → dual_tournament 분기 안에서만 progressDualMatch 호출 (single elim 흐름 100% 보존)

🛡️ 회귀 방어 채택 패턴:
- **single elim**: format !== "dual_tournament" 이라 progressDualMatch 호출 0 → 기존 흐름 무변경 (`updateMatch` 가 winner 진출 처리)
- **dual_tournament winner**: `updateMatch` (match.ts) 가 winner→next_match 슬롯 update + progressDualMatch 가 같은 슬롯 같은 winnerTeamId 로 다시 update → **idempotent 안전** (덮어쓰기 무해)
- **dual_tournament loser**: progressDualMatch 가 settings.loserNextMatchId 슬롯 채움 → **신규 효과** (의도)
- **결승/탈락 매치**: progressDualMatch 내부 next_match_id 가드로 자체 skip → 호출 안전

검수:
- `npx tsc --noEmit` EXIT=0 (출력 0)
- 트랜잭션 분리 — match.ts 트랜잭션은 commit 후 별도 trx 로 progressDualMatch 호출. loser update 1건만 atomic 보장. 명세의 "트랜잭션 내" 가이드 충족
- 실패 처리 — `[auto-knockout-gen]` 동일 패턴 (console.error + 사용자 응답 성공 유지). admin 수동 정정 가능
- format 재조회 절약 — 기존 `prisma.tournament.findUnique({ format })` 블록 안에 진입

💡 tester 참고:
- **회귀 게이트 1 — single elim 무변경**: 기존 single elim 매치 점수 입력 → 응답 동일 + winner 진출 1회 (기존 흐름)
- **회귀 게이트 2 — dual winner 진출**: 조별 G1 매치 완료 → G3 home_team_id 채워짐. **두 번 update** (match.ts + progressDualMatch) 했지만 결과 동일 (idempotent)
- **회귀 게이트 3 — dual loser 진출 (신규)**: 조별 G1 매치 완료 → G4 home_team_id 채워짐 (settings.loserNextMatchId 매핑). **이게 핵심 신규 효과**
- **회귀 게이트 4 — 8강/4강 진출**: 8강 매치 완료 → 4강 home/away 채워짐 (winner 만, loser 진출 없음 — settings.loserNextMatchId null)
- **회귀 게이트 5 — 결승**: 결승 완료 시 `match.next_match_id == null` → progressDualMatch 가 winner 진출 skip (next_match_id 가드). 에러 0
- **회귀 게이트 6 — winner_team_id 없음**: status="cancelled" 등 winner 미지정 → progressDualMatch 호출 안 함 (`winner_team_id != null` 가드)

⚠️ reviewer 참고:
- **트랜잭션 분리 의도적**: match.ts 의 trx 안에서 progressDualMatch 호출하려면 `services/match.ts` 수정이 필요한데 사용자 결정 3 범위 밖 + single 회귀 위험 증가 → **별도 trx 채택**. loser update 가 부분 실패해도 매치 status 는 이미 commit (admin 수동 정정 가능)
- **idempotent 신뢰**: dual 의 winner 슬롯에 같은 update 가 두 번 일어나는 건 안전. 단, `updateMatch` 의 update 가 `status: "scheduled"` 로 next_match 를 전환하는데 progressDualMatch 는 status 안 건드림 → 결과 동일
- **format 가드 위치**: 기존 `prisma.tournament.findUnique` 블록 안 (DB 쿼리 절약). full_league_knockout 분기와 형제 if 절
- **에러 처리 일관성**: console.error 패턴은 `[auto-knockout-gen]` 과 동일. 응답 schema 변경 0 (warning 필드 추가 X — full_league_knockout 도 warning 안 줌)

🔗 다음 Phase 준비됨:
- Phase D: tournament-admin/[id]/bracket/page.tsx dual 분기 — Stage 5섹션 카드 표시
- Phase E: B 대회 데이터 적용 (16팀 seedNumber + groupAssignment + bracket POST + 27 매치 일정 UPDATE)

### 구현 기록 (developer) — 듀얼토너먼트 Phase B (2026-05-02)

📝 구현한 기능: dual_tournament format 의 settings UI 분기 + bracket POST API 분기 (single elim 회귀 0 게이트 통과)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/components/tournament/bracket-settings-form.tsx` | `isDualTournament` 분기 신설 + `isSingleElim` 에서 dual 제거 + 4조 4팀 read-only UI + 요약 dual 라인 + `hasGroupFinal?` 필드 추가 | 수정 |
| `src/app/api/web/tournaments/[id]/bracket/route.ts` | POST 에 dual_tournament 분기 추가 (validate → trx + advisory lock + generateDualTournament(27) → createMany → match_number 역추적 → 27 next_match UPDATE + settings JSON 갱신) | 수정 |

검수:
- `npx tsc --noEmit` EXIT=0 (회귀 0)
- single elim 흐름 무변경 (dual 분기 진입 후 조기 return)
- schema 변경 0 (group_name / bracket_position / bracket_level / next_match_id / next_match_slot / settings 모두 기존 활용)
- BigInt 직렬화 안전: settings.loserNextMatchId 는 string 으로 저장 (progression.ts 가 BigInt 변환)

💡 tester 참고:
- **회귀 게이트 1 — single elim wizard**: format=single_elimination 으로 새 대회 만들기 → 대진 세부 설정 단계에서 knockoutSize/3·4위전 입력 UI 노출 + 요약 문구 정상
- **회귀 게이트 2 — single elim POST**: 기존 single elim 대회의 POST `/api/web/tournaments/[id]/bracket` 호출 → totalRounds + matchesCreated 응답 정상
- **dual 신규 1 — settings UI**: format=dual_tournament 로 새 대회 만들기 → "4조" / "조별 4팀 (총 16팀)" / "각 조 1·2위" / "8강 토너먼트" / "포함" 모두 read-only 표시. 3·4위전 체크박스만 입력 가능
- **dual 신규 2 — POST 검증 에러**: settings.bracket.groupAssignment 없이 POST 호출 → 400 "duel… 4조(A/B/C/D) 배정이 필요합니다"
- **dual 신규 3 — POST 정상**: 16팀 unique BigInt 배정으로 POST → 27 매치 INSERT + next_match_id 자기 참조 정상 매핑 + matches_count=27 갱신
- **검증용 groupAssignment 예시 (test 환경)**:
  ```json
  { "A": ["1","2","3","4"], "B": ["5","6","7","8"], "C": ["9","10","11","12"], "D": ["13","14","15","16"] }
  ```
  (실제 B 대회 운영은 Phase E 에서 진짜 TournamentTeam.id 로 대체)

⚠️ reviewer 참고:
- **회귀 위험 0 보장**: dual 분기는 `tournamentMeta?.format === "dual_tournament"` 일 때만 진입 후 조기 return. 기존 single elim 트랜잭션 코드는 무변경. 풀리그 분기와 같은 패턴 (조기 return)
- **2단계 INSERT + UPDATE 패턴**: 자기 참조 FK 회피 위해 createMany 시 next_match_id=null → 받은 BigInt id 로 27건 UPDATE. league-generator.ts 패턴 차용 (createMany + matches_count UPDATE) + tournament-seeding.ts 패턴 차용 (settings JSON loserNextMatchId)
- **인덱스 매핑 안전성**: matchNumber 는 generator 에서 1부터 순차 부여 → INSERT 후 `match_number` 정렬해서 매핑. 만약 같은 대회에 다른 매치가 이미 있으면 `existing > 0` 체크에서 ALREADY_EXISTS 거름 (`clear: true` 강제 시 deleteMany 후 진입)
- **트랜잭션 timeout 30000ms**: 27 INSERT + 27 UPDATE = 54 쿼리. 기존 single elim 패턴과 동일 timeout
- **다음 Phase C 전제**: settings.loserNextMatchId 는 string 으로 저장됨 → progression.ts 의 BigInt 변환 헬퍼가 string|number 모두 처리 가능 (이미 검증됨)

🔗 Phase C 준비됨:
- matches PATCH route 에서 `status === "completed"` + winner 확정 시 `progressDualMatch(tx, matchId, winnerTeamId)` 호출만 추가하면 자동 진출 동작
- single elim 도 next_match_id 보유 → 같은 함수 호출 시 동일하게 작동 (winner 만 진출, settings.loserNextMatchId 없으면 skip)

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

⚠️ reviewer 참고:
- 헬퍼는 raw SQL bigint 결과도 처리 가능 (객체 wrapping 만 하면 됨)
- `USER_DISPLAY_SELECT` 는 `as const` 로 Prisma select 타입 추론 보장
- 다음 Phase B (teams/[id] 5 파일) 진행 시 import 패턴: `import { getDisplayName } from '@/lib/utils/player-display-name'` + `import { USER_DISPLAY_SELECT } from '@/lib/db/select-presets'`

</details>

### 기획설계 — 듀얼토너먼트 풀 구현 (2026-05-02)

🎯 목표: `dual_tournament` 포맷을 **system 1급 시민**으로 정착. 27 매치 자동 생성기 + bracket-settings 분기 + 관리자 대진표/일정 UI + 점수 입력 시 다음 라운드 자동 진출 + B 대회 데이터 적용까지 한 사이클 완성.

📍 현재 코드 매핑 (영향 분석)

| 파일 | 현재 처리 | 분류 | 변경 정도 |
|------|----------|------|---------|
| `src/lib/tournaments/bracket-generator.ts` | single elim 만 (`generateSingleEliminationBracket`) | 듀얼 미지원 ❌ | **참고 only** (수정 X) |
| `src/lib/tournaments/league-generator.ts` | round-robin (`generateRoundRobinMatches`) + advisory lock 패턴 | 듀얼 미지원 ❌ | **참고 only** (패턴 차용) |
| `src/lib/tournaments/tournament-seeding.ts` | full_league_knockout 의 `generateEmptyKnockoutSkeleton` + `assignTeamsToKnockout` (1위/4위 슬롯 라벨 패턴) | 듀얼 미지원 ❌ | **참고 only** (slotLabel 패턴 차용) |
| `src/lib/tournaments/bracket-builder.ts` | DB → RoundGroup[] 변환 + SVG 좌표 계산. 가정: round_number 기반 트리 (1→2→3...) | 듀얼 5단계 부적합 ⚠️ | **수정 검토** (Stage 그룹핑 보강) |
| `src/lib/tournaments/score-updater.ts` | 점수 atomic update 만 — winner 자동 진출 로직 X | 무관 ✅ | 변경 0 |
| `src/app/api/web/tournaments/[id]/matches/[matchId]/route.ts` | PATCH `winner_team_id` 수동 지정 / completed 시 `updateTeamStandings` 호출 / **next_match 자동 진출 로직 0** | 듀얼/single 공통 부재 ❌❌ | **수정 필요** (winner→next_match 자동 진출) |
| `src/app/api/web/tournaments/[id]/bracket/route.ts` | POST 분기 = 풀리그 vs single elim (인라인). dual 진입 시 single elim 트리 생성 → **틀린 결과** ⚠️ | 듀얼 미분기 ❌ | **수정 필수** (dual 분기 + generator 호출) |
| `src/components/tournament/bracket-settings-form.tsx:33` | `dual_tournament` 도 `isSingleElim=true` 로 처리 → knockoutSize 만 노출 | 듀얼 settings 부재 ❌ | **수정 필수** (dual 전용 분기) |
| `src/app/(web)/tournament-admin/tournaments/[id]/bracket/page.tsx` | 1라운드 팀 배치 편집 UI (round_number=1만). 듀얼은 5단계라 부적합 ⚠️ | 듀얼 시각화 부재 ⚠️ | **수정 필요** (Stage 5단계 그룹핑) |
| `src/app/(web)/tournament-admin/tournaments/[id]/matches/page.tsx` | 매치별 일정·장소·점수·승자 PATCH | 분류 무관 ✅ | 변경 0 (호환됨) |
| `src/app/(web)/tournaments/[id]/_components/v2-bracket-wrapper.tsx` | format 분기 = league vs knockout. dual 은 knockout 트리로 표시 → 조별 단계 안 보임 ⚠️ | 공개 UI 부재 ⚠️ | **수정 검토** (Phase F — 별도 큐) |
| `prisma/schema.prisma` (TournamentMatch) | `next_match_id`/`next_match_slot`/`group_name`/`bracket_level`/`bracket_position`/`settings(JSON)` 모두 보유. **신규 필드 0** ✅ | 충분 ✅ | **변경 0** |

🔗 schema 활용 전략 (변경 0 보장)

- **조 표시**: `group_name` ("A"/"B"/"C"/"D") — Stage 1·2·3 (조별·최종전) 의 매치는 `group_name` 채움
- **Stage 구분**: `round_number` (1=조별 R1, 2=조별 R2, 3=조별 최종전, 4=8강, 5=4강, 6=결승) + `roundName` ("조별 1라운드" / "승자전" / "패자전" / "조별 최종전" / "8강" / "4강" / "결승")
- **bracket_level**: 0=조별·최종전 (group stage), 1=8강, 2=4강, 3=결승 — bracket-builder 시각화용 토너먼트 단계
- **bracket_position**: 매치 라인 (8강 1·2·3·4 → 4강 1+4 / 2+3 크로스 → 결승)
- **next_match_id / next_match_slot**: 승자 진출 매핑 (조별 G1 → 승자전 home, G2 → 승자전 away, ... 8강 1 → 4강 1 home, 8강 4 → 4강 1 away, ...)
- **settings JSON**: 패자 진출 추적 (`loserNextMatchId` / `loserNextMatchSlot` 신설 — 승자전 패자 → 조별 최종전 home 슬롯, 패자전 승자 → 조별 최종전 away 슬롯)
- **slotLabel**: tournament-seeding.ts 의 `homeSlotLabel`/`awaySlotLabel` 패턴 차용 ("A1 시드" / "A조 1위" / "8강 1 승자")

📍 만들 위치와 구조

| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| `src/lib/tournaments/dual-tournament-generator.ts` | `generateDualTournament(teams, settings, tournamentId)` — 27 매치 + nextMatch/loserNext 전체 매핑 | **신규** |
| `src/lib/tournaments/dual-progression.ts` | `progressDualMatch(matchId, winnerId, tx)` — 승자/패자 자동 진출 (단일 책임) | **신규** |
| `src/app/api/web/tournaments/[id]/bracket/route.ts` | POST 분기에 `format === "dual_tournament"` 추가 → generator 호출 | 수정 |
| `src/app/api/web/tournaments/[id]/matches/[matchId]/route.ts` | PATCH 에서 `status === "completed"` + winner 확정 시 `progressDualMatch` 호출 (모든 format 공통 권장) | 수정 |
| `src/components/tournament/bracket-settings-form.tsx` | `isDualTournament` 분기 신설 — groupCount=4·teamsPerGroup=4·hasGroupFinal=true 표시 (모두 read-only 또는 고정) | 수정 |
| `src/app/(web)/tournament-admin/tournaments/[id]/bracket/page.tsx` | 듀얼 분기: 5 Stage 그룹핑 (조별 4 + 최종전 1 + 8강 + 4강 + 결승) 카드 섹션 | 수정 |
| `src/app/(web)/tournament-admin/tournaments/[id]/matches/page.tsx` | 변경 0 (기존 매치 일정/점수 UI 그대로 호환) | 변경 X |
| (선택) `scripts/_temp/seed-tournament-B-schedule.ts` | B 대회 사진 일정 27개 매치별 `scheduledAt` + `venue_name` 일괄 UPDATE | **신규** (Phase E) |

🔗 generator 알고리즘 핵심 (`generateDualTournament`)

```
입력: teams[16] (TournamentTeam id + seedNumber), settings { groupCount=4, teamsPerGroup=4, groupAssignment? }
출력: 27 매치 + (호출자에서 next_match_id 일괄 UPDATE)

Step 1. 조 배정
  - 옵션 A (기본): snake seed (시드 1·8·9·16 = A조, 2·7·10·15 = B조, ...) — 균형 분산
  - 옵션 B (수동): settings.groupAssignment = { "A": [tt1,tt2,tt3,tt4], "B": [...], ... }
  - B 대회는 수동 지정 (사진 그대로) → 옵션 B 선호

Step 2. 조별 4경기 × 4조 = 16 매치 생성 (group_name 채움, round_number=1~2)
  - 조마다 [G1: pos1 vs pos2 / G2: pos3 vs pos4 / G3: 승자전 / G4: 패자전]
  - G1·G2: round_number=1, bracket_level=0, status="scheduled"
  - G3·G4: round_number=2, bracket_level=0, status="pending" (팀 미정)
  - next_match_id 매핑: G1 winner → G3 home / G2 winner → G3 away / G1 loser → G4 home / G2 loser → G4 away
    → settings JSON 에 `loserNextMatchId` + `loserNextMatchSlot` 저장 (G1·G2 만)

Step 3. 조별 최종전 4 매치 (round_number=3)
  - 매칭: G3 패자 (승자전 패자) vs G4 승자 (패자전 승자)
  - status="pending"
  - G3 next: 8강 (winner→8강 home/away 슬롯) / G3.settings.loserNext: 조별 최종전 home
  - G4 next: 조별 최종전 away (winner) — 패자는 4위 확정 (next 없음)

Step 4. 8강 4 매치 (round_number=4, bracket_level=1)
  - 8강 1: B1(승자전 승자) vs A2(조별 최종전 승자)
  - 8강 2: A1 vs B2
  - 8강 3: D1 vs C2
  - 8강 4: C1 vs D2
  - 슬롯 채움 패턴:
    - A·B·C·D 조 G3 winner → 각자 8강 home/away 슬롯에 next_match 매핑
    - 조별 최종전 winner → 8강 home/away 슬롯
  - status="pending"

Step 5. 4강 2 매치 (round_number=5, bracket_level=2) — NBA 크로스
  - 4강 1: 8강 1 winner vs 8강 4 winner  (1+4 라인)
  - 4강 2: 8강 2 winner vs 8강 3 winner  (2+3 라인)
  - 8강 1.next_match = 4강 1 home / 8강 4.next_match = 4강 1 away
  - 8강 2.next_match = 4강 2 home / 8강 3.next_match = 4강 2 away

Step 6. 결승 1 매치 (round_number=6, bracket_level=3)
  - 4강 1 winner = 결승 home / 4강 2 winner = 결승 away

Step 7. 모든 next_match_id 는 1차 createMany 후 2차 update 로 채움
  (createMany 시점엔 BigInt id 가 없어서 — league-generator 패턴 동일하게 트랜잭션 내 createMany + select id + update 2 단계)
```

📋 사용자 결정 필요 6건

**결정 1 — 조 배정 방식 (가장 중요, B 대회 즉시 적용 결정)**
- 옵션 A: snake seed 자동 (`seed 1·8·9·16 = A조` 패턴)
- 옵션 B: settings JSON 수동 지정 (`settings.bracket.groupAssignment = { A: [tt이름들 또는 ids], ... }`)
- 옵션 C: 관리자 UI (드래그&드롭 또는 select)
- **추천: B (즉시) + C (장기 큐)** — B 대회는 사진 그대로 수동 입력 필수 (snake 자동은 결과 다름). C UI 는 Phase F 큐로 분리

**결정 2 — 시드 결정 방식**
- 옵션 A: BDR 랭킹 자동 (외부 API)
- 옵션 B: settings 수동
- 옵션 C: tournamentTeam.seedNumber 활용 (관리자가 미리 입력)
- **추천: C** — 기존 `seedNumber` 컬럼 활용. B 대회는 사진의 BDR 랭킹 보고 16팀 수동 UPDATE (별도 일회성 스크립트). generator 는 seedNumber → 조 배정 직접 매핑 (group + 조내 순위)

**결정 3 — 자동 진출 트리거 위치**
- 옵션 A: PATCH matches/[matchId] route 안에서 (모든 format 공통 신설)
- 옵션 B: dual 전용 hook 함수만 신설, route 는 기존
- **추천: A** — single elim/full_league_knockout 도 next_match 슬롯 채우기 부재라 통합 효과. 단, single 회귀 테스트 필요

**결정 4 — 결승/3·4위전 옵션**
- (a) 결승 단판 vs 3판 2승 — **단판** (사진 그대로)
- (b) 3·4위전 추가 여부 — **없음** (사진엔 없음, 4강 패자가 공동 3위)
- **추천: (a) 단판 / (b) 없음** — bracket-settings-form 에 옵션은 노출하되 default

**결정 5 — bracket route 의 dual 분기 진입 시 기존 매치 정책**
- 옵션 A: `clear: false` 시 ALREADY_EXISTS 에러 (기존 single 패턴)
- 옵션 B: `clear: true` 강제 (운영 DB 위험)
- **추천: A** — B 대회는 매치 0건이라 `clear: false` 첫 생성 OK. 재생성은 사용자 확인 후 `clear: true`

**결정 6 — bracket-builder.ts 듀얼 시각화 보강 범위**
- 옵션 A: 기존 round_number 그룹핑 유지 (Stage 4·5·6 만 트리로 보임, 조별은 별도 섹션)
- 옵션 B: bracket_level 기반 그룹핑 (조별 = level 0 별도 섹션 / level 1·2·3 토너먼트 트리)
- 옵션 C: format=dual 전용 buildRoundGroups 분기 신설
- **추천: A (Phase A~E 범위) + C (Phase F 큐 — 공개 페이지 시각화)** — 관리자 페이지는 Stage별 카드 섹션으로 충분, 공개 페이지 토너먼트 트리는 별도 큐

📋 실행 계획 (Phase A~E 순차 + F 큐)

| Phase | 순서 | 작업 | 담당 | 파일 수 | 위험 | 시간 |
|-------|------|------|------|---------|------|------|
| **A** | 1 | `dual-tournament-generator.ts` + `dual-progression.ts` 신설 (영향 0) | developer | 신규 2 | 0 | 1.5h |
| A | 2 | tester (단위 — 16팀 입력 → 27 매치 + next_match 매핑 검증) | tester | — | 0 | 0.5h |
| **B** | 3 | `bracket-settings-form.tsx` dual 분기 추가 | developer | 1 수정 | 낮음 | 0.5h |
| B | 4 | `bracket/route.ts` POST 에 dual 분기 추가 + generator 호출 | developer | 1 수정 | 중간 (single 회귀) | 1h |
| B | 5 | tester (회귀 — single elim + round-robin + dual 3가지 generator 모두 통과) | tester+reviewer (병렬) | — | — | 0.5h |
| **C** | 6 | `matches/[matchId]/route.ts` PATCH 에 `progressDualMatch` 호출 (status=completed 시) | developer | 1 수정 | 중간 (모든 format 영향) | 1h |
| C | 7 | tester (점수 입력 → 다음 라운드 슬롯 자동 채움 e2e) | tester | — | — | 0.5h |
| **D** | 8 | `tournament-admin/[id]/bracket/page.tsx` dual 분기 — Stage 5섹션 카드 표시 | developer | 1 수정 | 낮음 | 1h |
| D | 9 | tester (관리자 시각 — 27 매치 그룹핑 정확) | tester | — | — | 0.5h |
| **E** | 10 | B 대회 데이터 적용 — (a) 16팀 seedNumber UPDATE (b) settings.bracket.groupAssignment 입력 (c) generator 호출 (POST `/bracket`) (d) `seed-tournament-B-schedule.ts` 로 27 매치 scheduledAt + venue 일괄 UPDATE | pm + developer | 신규 1 + DB | **높음** (운영 DB) | 1.5h |
| E | 11 | tester (DB 검증 — 27 매치 / nextMatch 매핑 / 일정 채움) | tester | — | — | 0.5h |
| **F (큐)** | 12 | 공개 페이지 `/tournaments/[id]?tab=bracket` 듀얼 5단계 시각화 | planner+developer | v2-bracket-wrapper +1 | 중간 | 별도 큐 |

- 신규 파일: **3** (generator + progression + seed 스크립트)
- 수정 파일: **4** (bracket-settings-form + bracket route + matches route + admin bracket page)
- 삭제 파일: **0**
- DB schema: **0** 변경 (settings JSON + group_name + bracket_level + next_match_id 모두 기존)
- 총 시간 (A~E): **~9h** (Phase F 별도)

⚠️ developer 주의사항:
- **트랜잭션 필수**: generator 의 createMany + next_match_id update 2 단계는 한 트랜잭션 안 (advisory lock 포함)
- **next_match_id 자기 참조 FK**: createMany 시 null → select id 후 2차 UPDATE 패턴 (FK 제약 회피)
- **settings JSON 안전**: tournament-seeding 의 `Prisma.JsonNull` vs object literal 분기 패턴 차용
- **단일 책임**: `progressDualMatch` 는 winner/loser 슬롯 채우기만 — 점수 업데이트는 score-updater 가 별도 처리
- **회귀 위험**: `matches/[matchId]/route.ts` PATCH 에 `progressDualMatch` 추가 시 single elim 도 영향 받음 — 기존 single 트리는 next_match_id 있으니 OK 지만 status 전환 회귀 테스트 필수
- **B 대회 사용자 승인 필수**: Phase E 의 generator 호출 + scheduledAt UPDATE 는 운영 DB destructive 직전 단계 — 사용자 명시 승인 후 진행

⚠️ Phase E B 대회 데이터 적용 세부 (운영 DB)
- 사용자 승인 필요 사항: (1) seedNumber UPDATE 16건 (사진의 BDR 랭킹 그대로) (2) settings.bracket.groupAssignment 입력 (사진의 4조 분배 그대로) (3) bracket 자동 생성 (27 매치 INSERT) (4) 27 매치 scheduledAt/venue UPDATE
- 롤백 전략: 모든 단계 트랜잭션 내. 실패 시 rollback. 27 매치 INSERT 후 잘못 발견 시 `clear: true` 재생성 가능
- 14팀 명단 미수신 → placeholder 매치만 INSERT (팀 매칭은 OK)

🔗 후속 큐 (Phase A~E 분리):
- **Phase F**: 공개 페이지 듀얼 5단계 시각화 (v2-bracket-wrapper)
- **bracket-builder.ts dual 전용 buildDualRoundGroups** — 조별/8강/4강/결승 5섹션
- **관리자 조 배정 드래그&드롭 UI** (결정 1 옵션 C)
- **dual 결과 → 우승팀/4강팀/8강팀 자동 시상** (awards 페이지)

🔍 자체 검수 (계획 단계):
- DB schema 변경 0 ✅
- API 응답 키 변경 0 (snake_case 유지) ✅
- 기존 single elim 호환 (회귀 테스트 Phase B5 + C7) ✅
- 운영 DB 작업 사용자 승인 게이트 (Phase E 명시) ✅
- 14팀 명단 미수신 영향 0 (별도 큐) ✅

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
| 듀얼토너먼트 풀 시스템 | A generator / B settings·route / C progression / D admin UI / E B 대회 적용 | A ✅ / B ✅ / C ✅ / D~E ⏳ |

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 | 결과 |
|------|------|------|------|
| 2026-05-02 | 27d2bd7+(28건) | **5/2 동호회최강전 D-day 풀 셋업 — DB 16팀 / 듀얼토너먼트 27경기 / Phase A~E 풀 시스템 / placeholder↔real 통합 5쌍 / 카드 HIGH4 + 컴팩트 v3 / Live 박스스코어+프린트 복원 / Hero 5col + 막대 통일 / 장소 "스포라운드" 고정 / 원영 라이징이글스·경북소방본부 캡틴 양도+탈퇴**: 28+ 커밋 모두 push 완료. 후속 큐 = Phase F2 wrapper 연결 (`v2-dual-bracket-sections.tsx` 박제 commit 후 미연결), 카카오맵 SDK 옵션 D, 미매칭 placeholder 73명, linkPlayersToUsers 가입 hook, PortOne 본인인증, Tournament.status 'published' cleanup, 관리자 Phase A~E 결정 대기 6건, Games 박제 결정 대기, Teams 박제 Phase A 별도 commit. **현장 대처 모드 진입.** | ✅ D-day 준비 완료 |
| 2026-05-02 | (미커밋) | **Live `/live/[id]` v2 — 옛 BoxScoreTable + PrintBoxScoreTable + PrintOptionsDialog 풀 복원 (사용자 요청 "기존 UI 그대로 복구. 프린트 안 보임")**: 신규 2 / 수정 3. (1) `_v2/box-score-table.tsx` 신규 — 옛 page.tsx L970-1345 풀 카피 (쿼터 필터/DNP 분리/스타팅 정렬/PtsTeamBar/안내 배너/TOTAL/19컬럼). (2) `_v2/print-options-dialog.tsx` 신규 — 옛 L1443-1644 (팀별 enabled+누적+Q1~Q4+OT+PDF 안내). (3) `_v2/tab-players.tsx` 단순 17컬럼 → BoxScoreTable 2개 호출. (4) `_v2/print-box-score.tsx` 단순 누적 → printOptions 기반 (팀×기간) 매핑 + PrintBoxScoreTable filter 지원 (L1652-1862). (5) `_v2/game-result.tsx` PlayerRowV2 에 quarter_stats 추가 + printDialogOpen/printOptions state + useEffect (L511-555 카피) + PrintOptionsDialog 마운트. **API/DB/응답 키 변경 0** (quarter_stats 는 API 응답에 이미 포함). tsc EXIT=0 / lucide 0 / pill 0 / 인라인 grid `repeat(N,1fr)` 0. | ✅ 완료 |
| 2026-05-02 | (Phase B+C+D 완료, 미커밋) | **Teams 박제 Phase B+C+D — 카드 #랭크 PC 복원 + stats 4카드 모바일 분기 + Roster/Recent .data-table 마커 (사용자 결정 1=B / 2=A / 3=A / 4=B / 5=B / 6=B)**: 신규 1 / 수정 5. (B) team-card-v2 `rankIndex?` prop + 우상단 absolute `#{rankIndex+1}` `hidden sm:block` (PC ≥640px) + teams-content-v2 `pageStartIndex+idx` 전달. (C) stats-tab-v2.css 신규 (`.team-stats-grid` PC 4열 / 모바일 ≤720px 2열) + tsx 인라인 `repeat(4, 1fr)` 제거 — errors.md 04-29 8건 재발 패턴 마지막 1건 차단. (D) roster-tab-v2 + recent-tab-v2 에 `.board data-table` / `.board__head data-table__head` / `.board__row data-table__row` 마커 + 셀에 `data-label` (#/포지션/역할/PPG, 날짜/스코어/결과/대회) + 이름·상대 셀 `data-primary="true"`. globals.css L1634~1690 모바일 카드 변환 룰 활용 (CSS 추가 0). `getDisplayName` 호출 미터치 (Phase B-2 보존). tsc EXIT=0 / 9999px 0 / lucide 0 / 핑크 hex 0 / 인라인 `repeat(N,1fr)` teams 영역 0 / API·Prisma·AppNav 변경 0. Phase A (dead code 5 파일) 별도 commit 큐. | ✅ Phase B+C+D |
| 2026-05-02 | (Phase C 완료, 미커밋) | **Games 박제 Phase C — ParticipantList Hybrid + ApplyPanel 신청자정보·진행바 (사용자 결정 3=C / 4=A / 5=B / 6=B)**: 신규 1 / 수정 5 파일. (1) `participant-list.css` 신규 — PC `repeat(auto-fill, minmax(200px, 1fr))` + 모바일 ≤720px `1fr` 강제 (player-hero.css 패턴, 인라인 grid 안티패턴 회귀 방지). (2) `participant-list.tsx` 인라인 → className 분리 + skill_level 메타 ("L.5 · 가드"). (3) `apply-panel.tsx` 자리남음 + 진행바 (cafe-blue) + 신청자 정보 카드 + skill_level select 1줄 + 한마디 textarea (UI만, 미전송 안내) + 동의 체크박스. CTA 운영 그대로 (즉시 신청 X). (4) `page.tsx` approvedParticipants 에 skill_level + ApplyPanel myProfile prop 전달. (5) `services/game.ts` users.select 에 skill_level 1줄. (6) `services/user.ts` USER_GAME_PROFILE_SELECT 에 skill_level 1줄. **응답 키 변경 0** (외부 라우트 없음 — 서버 컴포넌트 직접 호출). tsc EXIT=0 / 9999px 0 / lucide 0 / hex 0 / 인라인 grid `repeat(N, 1fr)` 0건 / AppNav frozen 0 / API·DB 변경 0. | ✅ Phase C |
| 2026-05-02 | (Phase B 완료, 미커밋) | **Games 박제 Phase B — 종류탭 segmented + 필터칩 collapsible (사용자 결정 1=A / 2=A)**: 수정 5 파일. (1) `globals.css` 끝에 시안 `BDR-current/games.css` ~120줄 추가 (`.games-toolbar` `.games-segmented` `.games-filter-btn` `.games-filter-chips` 등). 9999px 1건 → `50%` 치환 (13 룰 §10). (2) `kind-tab-bar.tsx` 밑줄 → segmented 전환 + filter 토글 버튼 (Material Symbols `tune`) + dot 뱃지. (3) `filter-chip-bar.tsx` 전체 해제 버튼 추가 (URL+클라 동시 초기화). (4) `games-client.tsx` collapsible state + URL 활성 칩 카운트 헬퍼 + grid 클래스화. (5) `page.tsx` 헤더 인라인 → 시안 클래스. tsc EXIT=0 / 9999px 코드 0 / lucide 0 / API·DB·AppNav 변경 0. | ✅ Phase B |
| 2026-05-02 | (계획만) | **관리자페이지 UI 개선 분석 (admin 17 페이지 + 공통 4 컴포넌트)** — planner 분석. 옛 `--color-*` 토큰 419건 (alias 매핑됨, 시각 OK / 시맨틱 분리), `rounded-full` 25건 (13 룰 §3 위반), 모바일 분기 0건 (lg:flex 사이드바 → 모바일 진입 불가 = 🚨 차단), lucide 0 / hex 0 / Material Symbols ✅. Phase A 모바일 가드 (3h, 추천 1순위) / B 토큰 어휘 (2h) / C 라운딩 정합 (1h) / D 공통 컴포넌트 강화 (3h, focus trap + Pagination + EmptyState) / E 대시보드 시안화 (4h, 선택). API/권한 변경 0, Phase F 듀얼과 충돌 0. 사용자 결정 6건 도출. | ⏳ 결정 대기 |
| 2026-05-02 | (계획만) | **Games 박제 분석 (`/games` + `/games/[id]` B→A 승격)** — planner 분석. 시안 ↔ 운영 차이 9개소 매핑 (헤더 95% / 종류탭 70% / 필터칩 50% / 카드 95% / SummaryCard·AboutCard 시안 초과 / ParticipantList 60% / ApplyPanel 35% / 운영 only 영역 4종 보존 필수). 데드 코드 ~825줄 (12 파일). 사용자 결정 6건 도출 (1=A 종류탭 segmented / 2=A 필터칩 collapsible / 3=C ParticipantList Hybrid / 4=A 신청자정보 카드 / 5=B 한마디 운영 유지 / 6=B 즉시신청 추후 큐). 추천안 영향 = 신규 0~1 / 수정 4~6 / 삭제 7~12 / API·DB 변경 0. Phase A→B→C 순차 ~4h. | ⏳ 결정 대기 |
| 2026-05-02 | (계획만) | **Phase F 공개 페이지 dual 시각화 — 영향 6개소 매핑 + 3 옵션 비교 + F1~F5 sub-phase**: planner 분석. 추천 = 옵션 C 하이브리드 (조별 카드 + 8강~결승 BracketView 트리 재사용, 3.3h). 결정 6건 도출 (옵션 C / 세로 sticky / settings 라벨 / "—" 표시 / groupName 1줄 추가 / schedule-timeline 무영향). single 회귀 게이트 5건 명시. | ⏳ 결정 대기 |
| 2026-05-02 | (Phase D 완료, 미커밋) | **듀얼토너먼트 Phase D — admin bracket page dual 5섹션 그룹핑**: 수정 2 파일. (1) `bracket/route.ts` GET select 에 5 필드 추가 (`group_name` / `settings` / `scheduledAt` / `venue_name` / `court_number`) — POST/다른 분기 무변경. (2) `tournament-admin/[id]/bracket/page.tsx`: `isDualFormat` 분기 신설 + 헬퍼 4개 (`formatSchedule` / `formatVenue` / `slotLabel` / `isDualFormat`) + `<DualBracketSections>` `<DualGroupedMatches>` `<DualMatchCard>` 3 컴포넌트 신설. 27 매치를 5 Card 섹션 (조별/조별최종전/8강/4강/결승) collapsed 토글 표시. Stage 1 은 A/B/C/D 4조 추가 그룹핑 (G1→G2→승자전→패자전 정렬). 빈 슬롯은 settings.homeSlotLabel/awaySlotLabel italic muted. snake/camel 키 양쪽 폴백 (apiSuccess 자동 변환 대응 — errors.md 2026-04-17 패턴). single elim/league 흐름 0줄 변경. BDR 토큰만, lucide 0, pill 9999px 0. tsc EXIT=0. | ✅ Phase D |
| 2026-05-02 | (Phase C 완료, 미커밋) | **듀얼토너먼트 Phase C — matches PATCH route 에 progressDualMatch 통합**: 수정 1 파일 (`matches/[matchId]/route.ts`). 사전 grep 으로 `services/match.ts:144-155` 에 winner 진출 로직 이미 있음 발견 → 회귀 방어 케이스 A 분기 채택 (dual_tournament 만 progressDualMatch 호출, single 흐름 100% 보존). 별도 trx 호출 + 실패 시 console.error 만 (auto-knockout-gen 패턴). winner 진출 = idempotent (match.ts + progressDualMatch 두 번 update 무해), loser 진출 = 신규 효과 (settings.loserNextMatchId 기반 패자전 슬롯 채움). tsc EXIT=0. | ✅ Phase C |
| 2026-05-02 | (Phase B 완료, 미커밋) | **듀얼토너먼트 Phase B — bracket-settings-form 분기 + bracket POST dual 분기**: 수정 2 파일. (1) `bracket-settings-form.tsx`: `isSingleElim` 에서 `dual_tournament` 제거 + `isDualTournament` 분기 신설 (4조 4팀 + 8강 + 조별 최종전 read-only 표시 + groupAssignment 안내 + 3·4위전 체크박스). 요약 문구에 dual 라인 추가. `BracketSettingsData.hasGroupFinal?` 옵션 필드 추가. (2) `bracket/route.ts` POST: dual_tournament 분기 추가 (settings.bracket.groupAssignment 검증 → validateGroupAssignment → trx 안 advisory lock + clear 처리 + generateDualTournament(27) → createMany → match_number 역추적해서 BigInt id 매핑 → 27건 next_match_id+slot UPDATE + settings.loserNextMatchId/Slot UPDATE → matches_count 갱신 → bracket_version 기록). single elim 흐름 회귀 0 (분기 외 코드 무변경). tsc EXIT=0. | ✅ Phase B |
<!-- 05-01 절단 (10건 유지) — 듀얼토너먼트 풀 시스템 계획 / profile PATCH 500 birth_date 가드 fix / Settings 7섹션 + BottomNav 박제 commit 3111e25 / 선수명단 실명 표시 Phase A 인프라 신설 / DB-only B 대회 데이터 셋업 5건 / 선수명단 실명 표시 결정 5건 / organizations status fix Cowork 2건 / 7883ed3/85944e3/22ce7f2/cef0a2b/6e81996/c3676ed/8d0f1f2 모두 git log 참조 -->

### 구현 기록 (developer) — Live 개인 기록 + 프린트 복원 (2026-05-02)

📝 구현한 기능:
1. `/live/[id]` v2 개인 기록 탭 — 슈팅 확률 컬럼 (FG%, 3P%, FT%) 추가 (14 → 17 컬럼)
2. 박스스코어 프린트 기능 — 옛 page.tsx 의 `data-printing` + `#box-score-print-area` + globals.css `@media print` 인프라 재활용

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/live/[id]/_v2/tab-players.tsx` | GRID_COLS 17 컬럼 상수화 + FG%/3P%/FT% 셀 + `pct()` 헬퍼 + minWidth 860 → 1020 | 수정 |
| `src/app/live/[id]/_v2/print-box-score.tsx` | `<PrintBoxScoreArea>` + `<PrintTeamTable>` (19 컬럼: #/이름/MIN/PTS/FG/FG%/3P/3P%/FT/FT%/OR/DR/REB/AST/STL/BLK/TO/PF/+/-) + DNP/TOTAL 행 + 쿼터별 점수 헤더 | 신규 |
| `src/app/live/[id]/_v2/game-result.tsx` | `useEffect` print 트리거 + `isPrinting` state + `data-live-root` + `data-printing` 속성 + 개인 기록 탭에 프린트 버튼 + cta-grid `data-print-hide` | 수정 |

🔧 동작 원리:
- "개인 기록" 탭 우상단 "🖨 박스스코어 프린트" 버튼 → `setIsPrinting(true)`
- `useEffect` 가 `data-printing="true"` 적용 → globals.css `[data-live-root][data-printing="true"] > *:not(#box-score-print-area)` 룰로 다른 형제 노드 hide
- 50ms 후 `window.print()` (DOM 반영 대기)
- `afterprint` 이벤트 → title 복원 + `setIsPrinting(false)` 자동 복귀
- 프린트 제목 = `YYMMDDHH_홈팀_원정팀` (옛 page.tsx 동일 포맷)

🎨 디자인 토큰:
- 색상: `var(--ink)` `var(--ink-soft)` `var(--ink-dim)` `var(--bg-elev)` `var(--bg-alt)` `var(--border)` `var(--accent)` `var(--err)` `var(--ok)` 만 사용
- 폰트: `var(--ff-mono)` (숫자) / `var(--ff-sans)` (이름)
- 라운딩: 4px (버튼) / 9999px 0건 / lucide 0건
- 아이콘: Material Symbols `print` (18px)

💡 tester 참고:
- 테스트 방법:
  1. finished/completed 상태 경기 진입 (`/live/[id]`)
  2. "개인 기록" 탭 클릭 → 헤더에 FG/FG%/3P/3P%/FT/FT% 6 컬럼 보임
  3. "박스스코어 프린트" 버튼 클릭 → 브라우저 인쇄 다이얼로그 자동 오픈
  4. 미리보기에 홈/원정 2 페이지 (각 1페이지) 누적 박스스코어만 표시 (탭/Hero/CTA 모두 숨김)
  5. 프린트 취소/완료 → 원래 화면 복귀
- 정상 동작:
  - 시도 0인 선수 % 셀에 "-" (NaN 방지)
  - DNP 선수는 17 컬럼 모두 "-" (MIN만 "DNP")
  - +/- 양수 초록 / 음수 빨강 / 0 회색
  - 모바일 가로 스크롤 (minWidth 1020) — ScrollableTable wrapper 가 페이드 마스크 제공
- 주의할 입력:
  - 선수 0명 → "기록된 선수가 없습니다." (DNP 만 있을 때 PrintBoxScoreArea 는 dnp 도 행 표시)
  - 쿼터 점수 데이터 없음 (`quarter_scores: null`) → 프린트 헤더에 점수 요약 생략
  - OT 있는 경기 → quarters 배열에 OT1/OT2 자동 추가

⚠️ reviewer 참고:
- 특별히 봐줬으면 하는 부분:
  - `useEffect` cleanup 에서 `clearTimeout` 처리 (마운트 해제 시 중복 print() 방지)
  - `setTimeout(window.print, 50)` 의 50ms 가 충분한지 (옛 page.tsx 패턴 답습 — 0ms 인 경우도 있음)
  - 옛 page.tsx 가 동일 페이지에서 `data-live-root` 를 가지지만, `finished/completed` 상태에서 `<GameResultV2 />` 를 즉시 return 하므로 충돌 없음 (verify: `src/app/live/[id]/page.tsx:640-642`)
  - PrintBoxScoreArea 의 19 컬럼이 옛 PrintBoxScoreTable 과 1:1 일치 (라이트 모드 사용자 회귀 0)
- TypeScript strict EXIT=0 / 9999px 0 / lucide 0 / 핑크 hex 0 / API·DB 변경 0
- 13 룰 자체 검수 13/13 통과 / 회귀 4 케이스 0건

| 2026-05-02 | (Live v2 print 복원, 미커밋) | **/live/[id] 개인 기록 탭 슈팅 확률 + 프린트 복원**: 신규 1 / 수정 2. (1) tab-players.tsx 14→17 컬럼 (FG%/3P%/FT% 추가) + GRID_COLS 상수화 + minWidth 860→1020 + `pct()` 0/0 → "-" 가드. (2) print-box-score.tsx 신규 — `<PrintBoxScoreArea id="box-score-print-area">` + 19 컬럼 PrintTeamTable (옛 page.tsx PrintBoxScoreTable 카피, 누적만 단순 모드) + DNP/TOTAL 행 + 쿼터별 점수 헤더. (3) game-result.tsx — `isPrinting` state + `useEffect` (`window.print()` + `afterprint` 복원 + 제목 `YYMMDDHH_홈_원정`) + `data-live-root` + `data-printing` 속성 (globals.css L1896-1955 인프라 재활용) + 개인 기록 탭 우상단 "🖨 박스스코어 프린트" 버튼 + cta-grid `data-print-hide`. tsc EXIT=0 / 9999px 0 / lucide 0 / hex 0 / API·DB 변경 0 / AppNav frozen 0 / 13 룰 13/13. | ⏳ 검증 대기 |
