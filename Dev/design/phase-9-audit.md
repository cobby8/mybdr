# Phase 9 UI 진입점 단절 감사 보고서

> **상태**: active (P0 처리 후 회귀 검증 시 재실행)
> **갱신 주기**: Phase 단위 (종료 시 `archive/phase-9/` 로 이동)
> **상위 문서**: [README.md](./README.md)
> **함께 보는 문서**: [phase-9-plan.md](./phase-9-plan.md) (계획) · [phase-9-prompts.md](./phase-9-prompts.md) (실행)
> **작성일**: 2026-04-28 (1차 Agent 자동 감사 + 2차 PM 정밀 검증)
> **마지막 갱신**: 2026-04-29 (More 가짜링크 4건 제거 진행 상태 반영 — commit `aa61003`)
> **대상**: subin 브랜치 최종 상태
> **조사 범위**: `src/app/(web)/` 하위 모든 페이지 라우트

---

## KPI (핵심 지표) — 2차 정밀 검증 반영

| 지표 | 수치 | 비고 |
|------|------|------|
| 총 라우트 수 | 115 | page.tsx 기준 |
| 글로벌 네비 + More 메뉴 노출 | 40개 | 메인 8탭 + 유틸리티 + More 5그룹 |
| 동적/후속 라우트 | 43개 | [id]/manage, [id]/edit 등 부모에서 접근 |
| 진입점 완전 단절 | **6개** | ⚠️ 즉시 조치 필요 |
| 진입점 부분 단절 | **8개** | ⚠️ 자연스러운 진입점 누락 |
| **🚨 신규 박제 라우트 진입점 0건** | **4개** | 🔥 **report / guest-apply / referee-request / match** |
| **🚨 More 메뉴 가짜링크** | **7개** | More 항목이 실제 기능 라우트가 아닌 부모로만 점프 |
| **⚠️ 조건부 진입점 (`isCaptain` 등)** | **1+개** | `/teams/[id]/manage` 팀장만 노출 |
| **⚠️ 박제 회귀 점검 대상** | **5건** | 옛 기능 진입점 보존 여부 의심 — 섹션 2-C 참고 |
| 정상 연결 | 58개+ | 1개 이상 진입점 보유 |

> **2차 검증 (2026-04-28 PM)**: 1차 Agent 분석에서 "정상"으로 분류된 케이스 중 신규 박제 7개 라우트와 `/teams/[id]/manage` 등은 실제로는 진입점이 0개이거나 조건부였음. 아래 새 섹션 1-A 와 2-A 참고.

---

## 섹션 1: 완전 단절 케이스 (Critical) — 6건

사용자가 **어떤 경로에서도 진입할 수 없는** 라우트.

| 라우트 | 파일 | 기능 | 현재 상태 | 권장 진입점 | 우선도 |
|--------|------|------|----------|-----------|--------|
| `/match` | `/match/page.tsx` | BDR v2 시안 Match (목록+상세 토글, 더미 데이터) | 0개 링크 | *(1) More 메뉴 "경기·대회" 섹션에 추가 또는 (2) /tournaments 내부 탭으로 통합* | **P1** |
| `/profile/activity` | `/profile/activity/page.tsx` | 프로필 활동 로그 | 0개 링크 | /profile 사이드바 또는 /profile?tab=activity 동적 라우트 | **P1** |
| `/profile/complete` | `/profile/complete/page.tsx` | 프로필 완성도 | 0개 링크 | /profile 상단 진행 상황 카드 또는 사이드바 | **P1** |
| `/profile/billing` | `/profile/billing/page.tsx` | 결제/빌링 정보 | 0개 링크 | /profile 사이드바 "결제 정보" 항목 추가 | **P1** |
| `/pricing/fail` | `/pricing/fail/page.tsx` | 결제 실패 화면 | 0개 직접 링크 | (프로그래매틱) /pricing/checkout 결제 실패 콜백 | **정상*** |
| `/pricing/success` | `/pricing/success/page.tsx` | 결제 성공 화면 | 0개 직접 링크 | (프로그래매틱) /pricing/checkout 결제 성공 콜백 | **정상*** |

> **\* 주석**: `/pricing/fail`, `/pricing/success`는 결제 흐름 내 프로그래매틱 리다이렉트로 사용되므로 Direct Link가 필요 없습니다. UI 진입점을 요구하지 않지만 문제 없음.

---

## 섹션 1-A 🔥 (2차 검증 / 2026-04-29 일부 처리) — Phase 9 신규 박제 라우트 진입점 점검

`subin` 브랜치의 BDR v2 신규 시안 박제 7개 라우트 중, **실제 진입점을 갖지 못한** 라우트.

| 라우트 | 시안 출처 | 진입점 후보 수 | 직접 링크 위치 | 결론 | 진행 상태 |
|--------|----------|-------------|---------------|------|----------|
| `/games/[id]/report` | GameReport.jsx | **0** | 어디에도 없음 | 🔥 단절 | ⏳ More 메뉴 가짜링크 제거 (`aa61003`) — 진입점 CTA 추가 후속 |
| `/games/[id]/guest-apply` | GuestApply.jsx | **0** | 어디에도 없음 | 🔥 단절 | ⏳ More 메뉴 가짜링크 제거 (`aa61003`) — 진입점 CTA 추가 후속 |
| `/tournaments/[id]/referee-request` | RefereeRequest.jsx | **0** | 어디에도 없음 | 🔥 단절 | ⏳ More 메뉴 가짜링크 제거 (`aa61003`) — 진입점 CTA 추가 후속 |
| `/match` | Match.jsx | **0** | 어디에도 없음 | 🔥 단절 | ❌ 정책 결정 미진행 |
| `/courts/submit` | CourtAdd.jsx | 1 (More 메뉴만) | `more-groups.ts:69` | ⚠️ More 1점 의존 | — |
| `/onboarding/setup` | OnboardingV2.jsx | 1 (More 메뉴만) | `more-groups.ts:100` "가입 설정" | ⚠️ More 1점 의존 + 회원가입 직후 자동 진입 누락 | ❌ 자동 redirect 미진행 |
| `/series/new` | SeriesCreate.jsx | **0** (사용자 페이지) | `/tournament-admin/series/new` 가 별도로 존재(admin) — 사용자용 진입점 없음 | 🔥 단절 | ❌ 정책 결정 미진행 |

→ **신규 박제 7개 중 4개가 0건, 3개가 1건 미만**. 2026-04-29 More 메뉴 가짜링크 정리(`aa61003`)로 일부 처리 — 다만 가짜링크는 메뉴에서 제거됐을 뿐 자연스러운 진입점 CTA 추가 작업은 후속.

### 권장 진입점 (실 동작 가능한 자연스러운 위치)

| 라우트 | 권장 진입점 |
|--------|-----------|
| `/games/[id]/report` | 게임 상세(`/games/[id]`)의 종료된 경기 카드에 "경기 평가" 버튼 + 알림(경기 후 N시간 평가 요청) |
| `/games/[id]/guest-apply` | 게임 상세의 "게스트 모집중" 배지 + "게스트 지원" CTA 버튼 (호스트가 모집 활성화한 경기만) |
| `/tournaments/[id]/referee-request` | 토너먼트 상세(`/tournaments/[id]`)의 "운영" 탭 (운영자/주최자만) |
| `/match` | 정책 결정 필요: (a) 시안 박제 보존만이면 admin/preview 영역으로 이동, (b) 실제 라우트면 More 메뉴 추가 |
| `/courts/submit` | `/courts` 코트 목록 페이지 상단 "코트 제보" CTA 추가 (More 외 1차 진입점 추가) |
| `/onboarding/setup` | **회원가입 직후 자동 redirect** (현재는 More 메뉴 "가입 설정"만 — 신규 회원이 발견하기 어려움) |
| `/series/new` | 사용자 권한이라면 `/series` 시리즈 허브 상단 "+ 시리즈 만들기" CTA. 만약 admin 전용이면 사용자 라우트 폐기 + admin 라우트만 유지 결정 |

---

## 섹션 1-B 🔥 (2차 검증 / 2026-04-29 일부 처리) — More 메뉴 가짜 링크

`src/components/bdr-v2/more-groups.ts` 의 항목 중, **레이블은 구체 기능을 가리키지만 href 는 부모 허브로만 점프**하는 케이스. 사용자가 항목을 누르면 "왜 다른 페이지로 가지?" 혼란 발생.

| More 메뉴 라벨 | 시안 의도 | 현재 href | 실제 기능 라우트 | 갭 | 진행 상태 |
|--------------|----------|----------|---------------|-----|----------|
| 대진표 | bracket | `/tournaments` | `/tournaments/[id]/bracket` | 토너먼트 선택 단계 거쳐야 함 | 유지 |
| 경기 결과 | gameResult | `/games/my-games` | `/games/[id]/result` (또는 동등) | 종료된 게임 직접 진입 X | 유지 |
| 경기 신고·평가 | gameReport | `/games/my-games` | `/games/[id]/report` | 신규 박제 라우트 미연결 | ✅ More 제거 (`aa61003`) |
| 게스트 지원 신청 | guestApply | `/games` | `/games/[id]/guest-apply` | 신규 박제 라우트 미연결 | ✅ More 제거 (`aa61003`) |
| 대회 접수 | tournamentEnroll | `/tournaments` | `/tournaments/[id]/join` (등) | 토너먼트 선택 단계 | 유지 |
| 팀 관리 | teamManage | `/teams` | `/teams/[id]/manage` | 본인 팀 찾기 단계 | 유지 |
| 심판 배정 요청 | refereeRequest | `/tournaments` | `/tournaments/[id]/referee-request` | 신규 박제 라우트 미연결 | ✅ More 제거 (`aa61003`) |
| (참고) 심판 센터 | referee | `/referee` (라우트 없음) | — | F등급 라우트 누락 | ✅ More 제거 (`aa61003`) |

→ **2026-04-29 진행 상태**: 의미 불일치가 가장 심한 4건(gameReport / guestApply / refereeRequest / referee) 제거 완료(`aa61003`). 나머지 3건(bracket / gameResult / tournamentEnroll / teamManage)은 부모 허브로 보내도 자연스러운 fallback으로 유지.

### 권장 처리

1. **A안 (수정)**: `gameReport`/`guestApply`/`refereeRequest` 처럼 신규 박제 라우트는 직접 그 라우트로 보내되, 진입 시 "어떤 경기/대회의 평가/지원/심판요청인가요?" 선택 화면을 거치도록 만든다 (또는 my-games/내 토너먼트 목록에서 골라서 진입).
2. **B안 (정리)**: More 메뉴에서 해당 항목들을 **빼고**, 각 부모 페이지(`/games/[id]`, `/tournaments/[id]`)의 액션 버튼으로만 진입하도록 한다. 시안과 갭이 생기지만 의미 일치율은 높음.
3. **혼합**: 자주 쓰는(`gameReport`)는 A안, 드물게 쓰는(`refereeRequest`)는 B안.

---

## 섹션 2: 부분 단절 케이스 (Warning) — 8건

일부 진입점은 있지만, **자연스러운/예상되는 진입점이 누락**된 경우.

### A. More 메뉴에 미노출되어야 할 항목

| 라우트 | 기능 | 현재 진입점 | 결핍 진입점 | 문제 | 우선도 |
|--------|------|-----------|-----------|------|--------|
| `/games/new` | 경기 등록 | /games, /games/my-games | More 메뉴 "경기·대회" | 주요 액션이지만 More에 없음 | **P0** |
| `/community/new` | 게시글 작성 | /community (4개) | More 메뉴 "내 활동" | 글쓰기는 핵심 기능이지만 More에 없음 | **P0** |
| `/series/new` | 시리즈 등록 | 없음 (동적) | More 메뉴 또는 /series 상단 | 진입 경로 불명확 | **P1** |
| `/organizations/apply` | 단체 가입 신청 | /organizations | More 메뉴 추가 검토 | 부분적만 노출 | **P1** |

### A-2. 조건부 진입점 (사용자 체감 단절)

| 라우트 | 진입점 위치 | 노출 조건 | 문제 |
|--------|-----------|----------|------|
| `/teams/[id]/manage` | 팀 상세 hero v2 의 "팀 관리" 버튼 (`team-hero-v2.tsx:190`) | **`isCaptain === true`** 인 사용자만 | 부팀장(vice)/매니저는 진입 불가. 또한 More 메뉴 "팀 관리" 항목은 `/teams` 로만 점프해 본인 팀 찾는 추가 단계 필요. → **사용자 사례에서 발견된 "팀관리 진입점이 사라진" 케이스의 정체** |
| `/teams/[id]/manage?tab=requests` | 팀 가입 신청 알림 actionUrl (`api/web/teams/[id]/join/route.ts:90`) | 알림 수신자 == 팀장 | 알림 외 진입점 없음. 알림 놓치면 신청 적체 |

→ **권장**: (1) `/teams/[id]/manage` 에 부팀장 권한 추가 또는 별도 (`vice` 전용 화면) 분리. (2) "팀 관리" More 메뉴 항목 클릭 시, 본인이 운영하는 팀 1개면 직접 그 manage로, 여러 팀이면 선택 화면. (3) 팀 상세 hero CTA를 더 눈에 띄게.

### B. 프로필 사이드바 미연결

| 라우트 | 기능 | 현재 진입점 | 결핍 진입점 | 우선도 |
|--------|------|-----------|-----------|--------|
| `/profile/basketball` | 농구 능력 정보 | 프로필 특정 card에서만 (1) | /profile 사이드바 | **P2** |
| `/profile/bookings` | 코트 예약 이력 | 결제 실패 페이지에서만 (1) | /profile 사이드바 "예약" | **P2** |
| `/profile/weekly-report` | 주간 리포트 | 농구 능력 페이지에서만 (1) | /profile 사이드바 | **P2** |
| `/profile/growth` | 성장도 | 0개 링크 | /profile 사이드바 | **P2** |

---

## 섹션 2-C 🚨 (NEW) — 박제 작업으로 인한 기능 숨김 패턴

> **PM 핵심 우려**: 박제 작업이 시안 충실에 집중하다 보니 **기존에 구현된 기능 진입점이 새 UI 안에 보존되지 않는 케이스**가 반복 발생. 시안에는 더 단순한 IA가 있고 기존 페이지엔 더 많은 기능 카드/탭이 있을 때 박제 후 일부가 사라짐.

### 발견된 패턴 (체계화)

| 패턴 | 사례 | 원인 | 영향 |
|------|------|------|------|
| **A. 메뉴 단순화** | More 메뉴 5그룹 IA — 옛 30개 단일 리스트가 5그룹으로 재편되면서 일부 항목이 가짜 링크로 변환 (섹션 1-B) | 시안의 더 단순한 IA 충실 박제 | 기능은 존재하지만 부모로만 점프 → 사용자 추가 단계 |
| **B. 탭/사이드바 흡수** | TeamDetail 박제 시 hero CTA만 남고 옛 사이드바의 "팀 관리" 옵션 항목 누락 (섹션 2 A-2) | 시안에 사이드바가 없어서 옛 사이드바 통째 제거 | `isCaptain` 조건부 1점 진입점만 남음 |
| **C. 카드 위젯 누락** | Profile 박제 시 옛 페이지의 슛존/스카우팅/시즌 히스토리 탭 등이 v2 hero+게이미피케이션으로 단순화되며 일부 사라짐 (`scratchpad.md` Phase 1 Profile 추후 구현 목록) | 시안 더미 데이터 기준 박제 → DB 미지원 카드 제거 | 구현된 데이터 표시 누락 |
| **D. 라우트 권한 변경** | 박제 시 `isCaptain` 같은 신규 권한 조건이 들어가면서 옛 페이지에서 누구나 접근 가능했던 영역이 좁아짐 | 시안에 권한 분기 명시 | 부팀장/매니저 진입 불가 |
| **E. 푸터·약관 링크 단순화** | 박제 시안의 깔끔한 푸터로 단순화되며 일부 중요 링크 사라짐 | 시안 IA 충실 | 약관/개인정보 등 진입 어려움 |

### 박제 시 "기존 기능 보존" 체크리스트 (신규 룰)

박제 작업 진행 시 **시안 충실 ≠ 옛 기능 제거** 임을 명시. 다음 체크리스트 통과 후 박제 커밋:

```
□ 옛 페이지(git log HEAD~~ 또는 dev branch)와 다이어그램 비교 — 어느 카드/탭/CTA가 사라졌는가?
□ 사라진 진입점 각각에 대해 결정:
  ① 다른 페이지에 같은 진입점 있음 → 안전
  ② 같은 페이지 다른 위치(사이드바/푸터/메뉴)에 보존 가능 → 보존
  ③ 옛 페이지에만 있고 시안엔 없음 → DB 지원 여부 확인
     → DB 미지원: scratchpad 추후 구현 목록 추가 + UI 숨김 처리
     → DB 지원: 시안에 없어도 보존 (또는 새 위치 결정)
□ 권한 분기(isCaptain 등) 새로 들어간 경우 — 옛 권한 그대로 유지인지 PM 결정
□ 박제 후 phase-9-audit.md "박제 회귀 점검" 섹션에 1줄 추가 (어느 진입점이 어디로 옮겨졌는지)
```

### 후속 작업 — 박제 회귀 점검 매트릭스 (Phase 9 P0 일부)

다음 라우트들은 박제 작업 시 옛 기능 진입점이 사라진 흔적이 의심됨. 코드 diff 점검 필요:

| 라우트 | 박제 커밋 | 점검 포인트 |
|--------|---------|-----------|
| `/live/[id]` (finished 분기) | `5920ff7` Phase 2 GameResult | **→ 별도 작업: 회귀 조정 (시안 색/폰트 유지 + 옛 레이아웃·기능 복원)** |
| `/profile` | `28be75f` Phase 1 Profile | 슛존/스카우팅/시즌히스토리/VS 나 탭 누락 (scratchpad 명시) |
| `/teams/[id]` | Phase 3 Teams 박제 | 부팀장 진입 가능 여부 (manage 진입점) |
| `/community/[id]` | Phase 8 PostDetail | 옛 댓글 액션/북마크 등 진입점 보존 여부 |
| `/notifications` | Phase 8 Notifications | 알림별 actionUrl 복귀 동작 보존 |

→ Phase 10 시작 전 위 5건 회귀 점검 1차 패스 권장.

---

## 섹션 3: More 메뉴 현황 vs 시안

### 시안의 More Groups (5그룹 30항목)

**출처**: `Dev/design/BDR v2/components.jsx` L117-161 `moreGroups`

#### 시안 moreGroups 5그룹:

```
내 활동 (7):
  - 내 신청 내역 ✓ /games/my-games
  - 게스트 지원 ✓ /guest-apps
  - 내 일정 ✓ /calendar
  - 보관함 ✓ /saved
  - 쪽지 ✓ /messages
  - 업적·배지 ✓ /profile/achievements
  - 스탯 분석 ✓ /stats

경기·대회 (7):
  - 라이브 중계 ✓ /live
  - 대진표 ✓ /tournaments (메인 탭)
  - 경기 결과 ⚠️ /games/my-games (direct route 없음)
  - 경기 신고·평가 ⚠️ /games/my-games (direct route 없음)
  - 스크림 매칭 ✓ /scrim
  - 대회 접수 ✓ /tournaments (메인 탭)
  - 게스트 지원 신청 ⚠️ /games (구체 라우트 없음)

등록·예약 (5):
  - 코트 예약 ✓ /courts (메인 탭)
  - 코트 제보 ✓ /courts/submit
  - 팀 등록 ✓ /teams/new
  - 팀 관리 ✓ /teams (메인 탭)
  - 심판 배정 요청 ⚠️ /tournaments (구체 라우트 없음)

둘러보기 (7):
  - 검색 결과 ✓ /search
  - 심판 센터 ⚠️ /referee (라우트 없음)
  - 코치·트레이너 ✓ /coaches
  - 리뷰 ✓ /reviews
  - 수상 아카이브 ✓ /awards
  - 갤러리 ✓ /gallery
  - 샵 ✓ /shop

계정·도움 (8):
  - 프로필 편집 ✓ /profile/edit
  - 알림 설정 ✓ /profile/notification-settings
  - 안전·차단 ✓ /safety
  - 비밀번호 찾기 ✓ /forgot-password
  - 가입 설정 ✓ /onboarding/setup
  - 소개 ✓ /about
  - 요금제 ✓ /pricing
  - 도움말 ✓ /help
```

### 실제 구현 vs 시안 갭

| 항목 | 시안 | 구현 상태 | 노트 |
|------|------|----------|------|
| 라이브 중계 | ✓ | ✓ /live | 정상 |
| 게스트 지원 신청 | ✓ | ⚠️ /games만 | More 항목이 부모로만 점프 |
| 경기 신고·평가 | ✓ | ⚠️ /games/my-games | More 항목이 부모로만 점프 |
| 심판 센터 | ✓ | ❌ /referee 라우트 없음 | **스코프 누락** |
| **경기 등록** | ❌ | ⚠️ /games/new 존재 | More 미추가 |
| **게시글 작성** | ❌ | ⚠️ /community/new 존재 | More 미추가 |

---

## 섹션 4: 정상 연결 케이스 (샘플)

### 메인 탭 (8개) — 글로벌 네비 직접 접근

```
✓ / · /games · /tournaments · /organizations · /teams · /courts · /rankings · /community
```

### 동적 라우트 (부모에서 정상 진입)

```
✓ /games/[id]              ← /games 카드 클릭
✓ /teams/[id]              ← /teams 카드 클릭
✓ /tournaments/[id]        ← /tournaments 카드 클릭
✓ /community/[id]          ← /community 글 클릭
✓ /courts/[id]             ← /courts 카드 클릭
✓ /profile/edit            ← More > 계정·도움 > 프로필 편집
```

---

## 섹션 5: 우선순위 권고 (2차 검증 반영)

### 🔥 P0 (즉시 — 이번 주 내) — 신규 박제 라우트 진입점 연결

**0-A. 신규 박제 4건 — 진입점 0건 단절 해소**

| 작업 | 파일 | 변경 내용 | 상태 |
|------|------|---------|------|
| `/games/[id]/report` 진입점 | 게임 상세 v2 컴포넌트 | 종료된 경기에 "경기 평가" CTA | ❌ 미진행 |
| `/games/[id]/guest-apply` 진입점 | 게임 상세 v2 컴포넌트 | "게스트 모집중" 배지 + CTA | ❌ 미진행 |
| `/tournaments/[id]/referee-request` 진입점 | 토너먼트 운영 영역 | 운영자/주최자만 보이는 CTA | ❌ 미진행 |
| `/match` 정책 결정 | `src/app/(web)/match/page.tsx` | (a) admin/preview 이동 / (b) More 추가 / (c) 폐기 — PM 결정 | ❌ 미진행 |

**0-B. More 메뉴 가짜 링크 정리** (섹션 1-B)
- ✅ **2026-04-29 (`aa61003`)**: 4건 제거 — gameReport / guestApply / refereeRequest / referee (B안 — More에서 제거)
- 나머지 3건(bracket / gameResult / tournamentEnroll / teamManage)은 부모 허브 fallback으로 유지

**0-C. 핵심 액션 More 추가** — ❌ 미진행
1. `/games/new` → More "경기·대회" 에 "경기 등록"
2. `/community/new` → More "내 활동" 에 "글 작성"

### P1 (이번 주 내) — 조건부/부분 단절 해소

3. **`/teams/[id]/manage` 조건부 노출 개선** — 부팀장(vice) 권한 검토 + More "팀 관리" 클릭 시 본인 운영팀 직접 진입
4. **`/onboarding/setup` 회원가입 자동 redirect** — signup 성공 콜백에서 `router.push('/onboarding/setup')`
5. **프로필 사이드바 통합** — `/profile/activity`, `/profile/complete`, `/profile/billing`, `/profile/growth`, `/profile/payments` 한 곳에 정리
6. **`/series/new` 사용자 라우트 정책** — 사용자 권한이라면 `/series` 허브 상단 CTA / admin 전용이면 사용자 라우트 폐기

### P2 (여유 시 — 다음 주)

7. 푸터 약관/개인정보 링크 확대
8. `/profile/basketball`, `/profile/weekly-report` 통합 사이드바
9. `/courts/submit` 진입점 다양화 (`/courts` 페이지 상단 CTA)

---

## 부록: 라우트 인벤토리

```
관리자 라우트   /partner-admin/* (5) + /tournament-admin/* (14)  ← 일반 사용자 진입 무관
인증/가입       /login · /signup · /forgot-password · /reset-password · /verify · /invite · /team-invite  ← 정상
특수            /~offline (오프라인) · /pricing/success · /pricing/fail (결제 콜백 — 프로그래매틱)
```

---

## 결론

### 발견 사항 (정량 요약)

- **완전 단절 (실질)**: 4건 — `/match`, `/profile/activity`, `/profile/complete`, `/profile/billing`
- **🚨 신규 박제 라우트 단절**: 4건 — `/games/[id]/report`, `/games/[id]/guest-apply`, `/tournaments/[id]/referee-request`, `/series/new`
- **More 메뉴 가짜 링크**: 7건 — 레이블 ↔ href 의미 불일치
- **조건부 진입점**: 1건 — `/teams/[id]/manage` (사용자 발견 케이스)
- **부분 단절**: 4건 (프로필 섹션)
- **핵심 기능 More 누락**: 2건 (`/games/new`, `/community/new`)

### 차기 작업 예상 시간

| 작업 | 영향도 | 예상 |
|------|--------|------|
| 신규 박제 4 라우트 진입점 추가 (P0-A) | 🔥 High | 2-3h |
| More 메뉴 가짜 링크 정리 (P0-B) | High | 1-2h |
| 핵심 액션 More 추가 (P0-C) | High | 0.5h |
| `/teams/[id]/manage` 조건부 개선 (P1-3) | Medium | 1-2h |
| 회원가입 → onboarding 자동 진입 (P1-4) | Medium | 0.5h |
| 프로필 사이드바 통합 (P1-5) | Medium | 3-4h |
| `/match` 정책 결정 (P0-A 일부) | Medium | PM 결정 |

**총 예상**: 8-13h. P0 만 처리해도 사용자 체감 단절 케이스 대부분 해소.

---

**문서 작성**: 1차 Agent 자동 감사 + 2차 PM 정밀 검증 (2026-04-28)
**다음 갱신**: P0 처리 후 회귀 검증 시
