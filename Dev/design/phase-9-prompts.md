# Phase 9 CLI 프롬프트 모음 (BDR v2 업그레이드)

> **상태**: active
> **갱신 주기**: Phase 단위 (종료 시 `archive/phase-9/` 로 이동)
> **상위 문서**: [README.md](./README.md)
> **함께 보는 문서**: [phase-9-plan.md](./phase-9-plan.md) (계획) · [phase-9-audit.md](./phase-9-audit.md) (감사)
> **사용법**: 클로드 CLI(`claude`)에 한 번에 하나씩 그대로 붙여넣기.
> 모든 프롬프트는 `subin` 브랜치, `design_v2` 활성 상태에서 실행.
> **시안 위치**: `Dev/design/BDR v2/` (단일 폴더로 통합 완료)
> **모바일 감사 리포트**: `Dev/design/BDR v2/_mobile_audit_report.html`
> **마지막 갱신**: 2026-04-29 (진행 상태 표시 추가)

---

## 📊 진행 현황 표 (2026-04-29)

| 항목 | 상태 | 비고 |
|------|------|------|
| P0-1 gameResult 모바일 스크롤 힌트 | ❌ 미착수 | |
| P0-2 messages 모바일 push 흐름 | ❌ 미착수 | |
| P0-3 bracket 라운드 sticky 헤더 | ❌ 미착수 | |
| P0-4 ResponsiveTable 컴포넌트화 + 4화면 | ❌ 미착수 | 컴포넌트만 일부 (`responsive-table.tsx` 존재) |
| P0-5 `/live/[id]` 경기 기록 회귀 조정 | ❌ 미착수 | |
| P1-1 NotFound + OnboardingV2 | ✅ 완료 | Phase 9 P1 박제 |
| P1-2 CourtAdd + GuestApply | ✅ 완료 | A등급 박제. 진입점 CTA 후속 필요 |
| P1-3 GameReport + RefereeRequest | ✅ 완료 | A등급 박제. 진입점 CTA 후속 필요 |
| P1-4 SeriesCreate | ✅ 완료 | A등급 박제. 진입점 정책 결정 필요 |
| P1-5 디자인 갱신 16종 | ⏳ 부분 | 16개 중 다수 박제. 1대1 비교 검수 잔여 |
| P2-1 More 메뉴 5그룹 IA | ⏳ 부분 완료 | 5그룹 IA 완료 + 가짜 4건 제거 (`aa61003`). 핵심 액션 추가(/games/new, /community/new) 잔여 |
| P2-2 모바일 폴리시 Med 잔여 5건 | ⏳ 부분 | Phase 9-Mobile Refinement(`dc1e38a`) + grid 안티패턴(`4afb4f9`) + overflow 가드(`f972aaf`)로 일부 처리 |
| P3-1 Playwright 모바일 감사 스크립트 | ❌ 미착수 | |
| P3-2 CI 통합 | ❌ 미착수 | |

> **추가 완료 (Phase 9 외 추가 작업)**: Hero 카로셀(`79cc57e`) · 헤더 구조 정리(`aa61003`) · 팀 모바일 최적화(`61a170d` `87c59d4`) · AppNav 모바일 닉네임(`db69eea`) · 단체 신청 폼 사일런트 실패 픽스(`35e54b0`)

---

## 🔰 매 프롬프트 시작 시 공통 헤더

각 프롬프트의 첫 번째 줄로 자동 포함됨. 별도 입력 불필요.

---

## P0 · 모바일 감사 High 3건 + 보드 테이블 컴포넌트화

### P0-1 · gameResult 모바일 가로 스크롤 힌트 — ❌ 미착수

```
"오늘 작업 시작하자" 체크리스트 먼저 통과시킨 뒤 시작.

목표: 시안 BDR v2의 _mobile_audit_report.html High 1건 처리.

대상: src/app/(web)/games/[id]/result/ 하위 (또는 GameResult v2가 박제된 위치 — 커밋 5920ff7 전후 확인). 시안 파일은 Dev/design/BDR v2/screens/GameResult.jsx.

문제: 선수 통계 15열 테이블이 모바일(375px)에서 가로 스크롤만 되고, 사용자가 스와이프 가능 여부를 인지할 단서가 없음. 헤더가 viewport 안쪽에서 잘림.

작업:
1. 가로 스크롤 가능한 테이블 컨테이너의 우측에 페이드 그라디언트 마스크 추가 — 스크롤이 끝까지 가면 마스크 사라지는 동작.
2. 테이블 위에 작은 마이크로카피 ("← 좌우로 스와이프해 모든 통계 보기") 추가. 모바일에서만 보이도록.
3. 첫 진입 시 0.5초 살짝 미리 스크롤하는 onMount 인터랙션은 선택사항 — 우선은 페이드 + 카피만.
4. 같은 페이지의 쿼터별 스코어 테이블도 같은 패턴 적용.
5. 컴포넌트화: src/components/ui/ScrollableTable.tsx (또는 mobile-scroll-hint.tsx) 로 분리. 다른 화면(bracket)에서도 재사용 가능하게.

검증:
- npm run build 통과
- 크롬 DevTools 모바일 (iPhone SE 375x667) 에서 페이드 마스크 보임
- 시안 _mobile_audit_report.html 의 High 1건 체크리스트와 비교

DB 변경 금지. UI 전용. 커밋 메시지: "feat(design-v2): Phase 9 P0-1 gameResult 모바일 스크롤 힌트 (ScrollableTable)"
```

---

### P0-2 · messages 모바일 push 흐름 — ❌ 미착수

```
"오늘 작업 시작하자" 체크리스트 먼저 통과시킨 뒤 시작.

목표: _mobile_audit_report.html High 2건 처리.

대상: src/app/(web)/messages/ 하위. 시안 파일은 Dev/design/BDR v2/screens/Messages.jsx 와 responsive.css 의 .msg-shell 패치 (data-mobile-view 속성 기반).

문제: 데스크톱은 3열 (320px 1fr 280px). 모바일에서 첫 컬럼(목록)만 보이고 가운데 채팅 + 우측 정보는 display:none. 사용자가 채팅 본문에 진입할 방법이 없음.

작업:
1. <MessageShell> 또는 동등한 컴포넌트에 data-mobile-view 속성 도입. 'list' | 'thread' 두 상태.
2. 데스크톱(>=720px): 양쪽 모두 표시 (현재와 동일).
3. 모바일(<720px): list 상태에서는 목록만, thread 상태에서는 채팅만 표시 + 좌상단에 "← 목록으로" 백버튼.
4. 목록의 thread 항목 클릭 시 setMobileView('thread') + URL 쿼리 ?thread=<id> 동기화 (뒤로가기로 list 복귀 가능).
5. 우측 정보 패널은 모바일에서 영구 숨김.
6. 시안 responsive.css 의 .msg-shell[data-mobile-view="list|thread"] 셀렉터 그대로 활용 — Next.js에서 className/data-attr 만 맞추면 됨.

검증:
- 모바일 → 목록에서 thread 탭하면 채팅으로 전환
- 백버튼으로 목록 복귀
- 데스크톱은 변경 없음

DB 변경 금지. 커밋: "feat(design-v2): Phase 9 P0-2 messages 모바일 push 흐름"
```

---

### P0-3 · bracket 라운드 sticky 헤더 — ❌ 미착수

```
"오늘 작업 시작하자" 체크리스트 먼저 통과시킨 뒤 시작.

목표: _mobile_audit_report.html High 3건 처리.

대상: src/app/(web)/tournaments/[id]/_components/ 의 bracket 트리 (커밋 4e54a62 등 Bracket v2 박제 위치). 시안 Dev/design/BDR v2/screens/Bracket.jsx.

문제: 본체가 minWidth:1000으로 가로 스크롤. 라운드 라벨(QF/SF/F)이 본체와 함께 스크롤되어 위치 파악 불가.

옵션 A (권장): 라운드 헤더를 sticky-top + 본체와 함께 스크롤되도록 분리. 헤더만 sticky-left? 아니, top 고정.
옵션 B: 모바일에서만 라운드별 세로 스택 모드로 전환 (각 라운드를 아코디언 또는 탭으로 구분).

작업:
1. 우선 옵션 A 시도. 라운드 헤더를 별도 컨테이너로 빼고 position:sticky; top:<navbar 높이>.
2. 사용자 스크롤 위치 파악이 가능한지 모바일에서 확인.
3. 옵션 A 가 시각적으로 부족하면 옵션 B 추가 — 데스크톱은 그대로, 모바일은 탭형 라운드 스위처.
4. 시안 audit/bracket_mobile_tree*.png 을 참고로 어느 형태가 자연스러운지 비교.

검증:
- 모바일에서 좌우 스크롤 시 라운드 라벨 항상 보임
- npm run build 통과

DB 변경 금지. 커밋: "feat(design-v2): Phase 9 P0-3 bracket 라운드 sticky 헤더"
```

---

### P0-5 · 경기 기록 페이지(`/live/[id]` finished 분기) 회귀 조정 (PM 직접 지시 — 3-4h) — ❌ 미착수

```
"오늘 작업 시작하자" 체크리스트 먼저 통과시킨 뒤 시작.

목표: 경기 종료 후 보는 페이지(`/live/[id]` 의 `finished`/`completed` 분기)가 Phase 2 박제(커밋 5920ff7) 로 v2 시안 GameResult.jsx 형태로 전면 재구성됐는데, 결과적으로 기존 페이지의 구조와 기능이 무너짐. 이번 회귀 조정으로:

✅ 유지할 것 (v2 디자인 시스템):
- 색상 토큰 (var(--color-*) — 하드코딩 색상 0건)
- 폰트 (Pretendard / Space Grotesk / Material Symbols Outlined)
- 다크모드 / BDR Red / 쿨 그레이 팔레트
- 버튼 border-radius 4px, 카드 토큰

🔄 옛 모습으로 되돌릴 것:
- 전체 레이아웃 / 페이지 구조
- 기존에 있던 기능 (하이라이트 / 통계 테이블 / 스코어 흐름 / 쿼터별 점수 / 선수별 기록 / 팀 통계 / 경기 요약 등)
- 옛 페이지의 정보 밀도와 동선

대상 파일 (Phase 2 박제로 신설된 v2 컴포넌트):
- src/app/live/[id]/_v2/game-result.tsx
- src/app/live/[id]/_v2/hero-scoreboard.tsx
- src/app/live/[id]/_v2/mvp-banner.tsx
- src/app/live/[id]/_v2/tab-players.tsx
- src/app/live/[id]/_v2/tab-summary.tsx
- src/app/live/[id]/_v2/tab-team-stats.tsx
- src/app/live/[id]/_v2/tab-timeline.tsx
- src/app/live/[id]/page.tsx (finished 분기 라우팅)

작업:
1. 박제 전 옛 디자인 확인:
   - git log --all --source -- "src/app/live/[id]/page.tsx" 로 5920ff7 이전 커밋 찾기
   - git show <prev-sha>:src/app/live/[id]/page.tsx 로 옛 모습 확인
   - 또는 dev 브랜치에 옛 디자인이 남아있다면 그것을 baseline 으로
2. 옛 페이지 구조의 핵심을 식별:
   - 옛 페이지에 있던 섹션/탭/카드 list-up
   - 어떤 데이터(API 응답)를 어떤 위젯으로 표시했는지
3. 회귀 조정 작업:
   - _v2/ 폴더의 v2 GameResult 형태를 옛 구조로 재배치
   - 색상/폰트/토큰은 v2 시스템 그대로 (하드코딩 색상 금지)
   - 옛 기능 모두 복원 — 하이라이트 영상 자리, 통계 표 다열, 쿼터별 스코어, 선수별 기록 등
   - 시안 GameResult.jsx 의 일부 좋은 요소(예: hero scoreboard 톤)는 옵션으로 보존 가능 — PM 판단
4. 모바일 반응형:
   - 옛 디자인의 다열 테이블이 모바일에서 카드 리스트로 자동 변환되도록
   - phase-9-paste-completeness P0-4 의 ResponsiveTable 컴포넌트가 이미 있으면 재활용
5. 박제 회귀 점검 (phase-9-audit.md 섹션 2-C 룰):
   - 사라진 기능 진입점 모두 복원
   - 새로 들어간 권한 분기(있다면) 검토

검증:
- npm run build 통과
- /live/<id> 종료 모드 진입 — 옛 정보 밀도와 위젯 모두 복원
- 모바일 375px 가로 스크롤 없음
- 시안 hero/마이크로 카피 정도만 v2 톤이고 나머지는 옛 모습
- 하드코딩 색상 0건 (var(--color-*) 토큰만)
- PM 시각 검토 후 OK 시 커밋

커밋 분할 권장 (4 단위):
1. "refactor(live): GameResult finished 분기 — 옛 레이아웃으로 회귀 (skeleton)"
2. "refactor(live): GameResult finished — 통계 테이블 복원"
3. "refactor(live): GameResult finished — 쿼터별 스코어 + 하이라이트 복원"
4. "refactor(live): GameResult finished — 모바일 반응형 (ResponsiveTable 재활용)"

DB 변경 금지. UI 회귀 작업이므로 PM 검토 후 단계별 진행.
```

---

### P0-4 · ResponsiveTable 컴포넌트화 + 4개 화면 적용 (가장 큼, 4-5h) — ❌ 미착수 (컴포넌트 일부 존재)

```
"오늘 작업 시작하자" 체크리스트 먼저 통과시킨 뒤 시작.

목표: _mobile_audit_report.html Med 다중 컬럼 board 라벨 손실 4건 일괄 해결. 컴포넌트화 후 재사용.

배경: 시안의 .board__row 같은 다중 컬럼 테이블이 모바일 1-col 강제 후 컬럼 라벨이 사라져, 어떤 값이 어떤 메트릭인지 식별 불가. 시안 _mobile_audit_report.html P0 권고는 <ResponsiveTable /> 컴포넌트화.

작업:
1. src/components/ui/responsive-table.tsx 신규 생성. props:
   - columns: { key, label, width?, mobileLabel? }[]
   - rows: any[]
   - mobileMode?: 'card' | 'stack' (기본 'card')
   - mobileHide?: string[] (모바일에서 숨길 컬럼 키)
2. 데스크톱: 기존 board 테이블 형태 (CSS 변수 활용).
3. 모바일(<720px): 각 행을 카드로, 각 셀 앞에 data-label 표시 (라벨 손실 해결). data-label + ::before 패턴.
4. 다음 4화면에 적용:
   - teamManage 로스터 테이블 (8열) → src/app/(web)/teams/[id]/manage/
   - billing 결제 내역 테이블 (4열) → src/app/(web)/profile/billing/
   - scrim 대전 기록 (6열) → src/app/(web)/scrim/
   - match 참가팀 board (5열) → src/app/(web)/match/ 또는 tournaments/[id]/teams/
5. 각 화면의 시안 (BDR v2/screens/<Name>.jsx) 과 비교하면서 컬럼 정의 매핑.
6. 적용 후 responsive.css 의 .board:not(.data-table) 룰은 그대로 두되, ResponsiveTable 사용 영역은 그 룰을 안 받도록 className 조정.

검증:
- npm run build 통과
- 모바일에서 4개 화면 모두 라벨이 카드 안에 표시됨
- 데스크톱은 변경 없음

DB 변경 금지. 큰 작업이라 4 커밋으로 쪼개도 좋음:
1. "feat(ui): ResponsiveTable 컴포넌트 신규"
2. "feat(design-v2): Phase 9 P0-4 ResponsiveTable 적용 (teamManage)"
3. ... 같은 패턴 3건 더
```

---

## P1 · 신규 라우트 7종 박제

### P1-1 · NotFound + OnboardingV2 (가벼운 것 묶음) — ✅ 완료

```
"오늘 작업 시작하자" 체크리스트 먼저 통과시킨 뒤 시작.

목표: 신규 시안의 NotFound + OnboardingV2 박제.

대상 1 — NotFound:
- 시안: Dev/design/BDR v2/screens/NotFound.jsx
- 위치: src/app/not-found.tsx (Next.js 글로벌 404)
- 시안 핵심: 큰 404 + accent 컬러 + 홈/검색/도움말 3버튼

대상 2 — OnboardingV2:
- 시안: Dev/design/BDR v2/screens/OnboardingV2.jsx (6+1 단계 위저드)
- 신규 라우트: src/app/(web)/onboarding/setup/page.tsx
- 단계: pos / height / level / styles / areas / frequency / goals / notifications → 완료 화면
- 단계 구조가 다른 신규 화면(CourtAdd, RefereeRequest, GameReport, SeriesCreate)과 공통이라 컴포넌트화 검토:
  src/components/wizard/StepWizard.tsx 신규 생성 — props: steps, currentStep, onStepChange, children
  StepIndicator 별도 컴포넌트로 분리

작업:
1. src/components/wizard/step-wizard.tsx (또는 동등) 신규 — 위저드 공통 셸. 시안 OnboardingV2.jsx 의 progress bar / step number / next-prev 패턴 그대로.
2. src/app/not-found.tsx 시안 박제. 다크모드 + accent 컬러 토큰 사용.
3. src/app/(web)/onboarding/setup/page.tsx 신설 + 7단계 위저드 박제.
4. DB 미지원 부분 (users.styles, users.areas, users.goals 등 컬럼 없을 가능성) — 우선 클라이언트 state 만 + "준비 중" 토스트 + scratchpad.md 의 "추후 구현 목록"에 추가.
5. 마지막 단계(완료)에서 setRoute 대신 router.push('/profile') 또는 router.push('/games').

검증:
- /not-found 또는 의도적으로 잘못된 경로 → 404 시안 표시
- /onboarding/setup → 7단계 통과
- 모바일에서 단계 indicator 보임

커밋:
- "feat(ui): StepWizard 공통 컴포넌트"
- "feat(design-v2): Phase 9 P1-1a not-found.tsx 시안 박제"
- "feat(design-v2): Phase 9 P1-1b /onboarding/setup 신규 (UI only)"
```

---

### P1-2 · CourtAdd + GuestApply — ✅ 완료 (진입점 CTA 후속 필요)

```
"오늘 작업 시작하자" 체크리스트 먼저 통과시킨 뒤 시작.

목표: 코트 제보(CourtAdd) + 게스트 지원(GuestApply) 박제.

대상 1 — CourtAdd:
- 시안: Dev/design/BDR v2/screens/CourtAdd.jsx (다단계 위저드)
- 신규 라우트: src/app/(web)/courts/submit/page.tsx (또는 /courts/new — 기존 admin용 코트 추가가 있다면 충돌 확인)
- DB: courts 테이블에 submitted_by(유저 FK), submission_status(pending/approved/rejected) 신규 또는 별도 court_submissions 테이블. 본 작업은 UI only — DB 변경은 분리 PR.

대상 2 — GuestApply:
- 시안: Dev/design/BDR v2/screens/GuestApply.jsx
- 신규 라우트: src/app/(web)/games/[id]/guest-apply/page.tsx
- DB: 기존 game_applications 테이블 또는 guest_applications 신규 — 확인 후 결정. 본 작업은 UI only.
- GuestApply는 양식 폼 1화면이라 StepWizard 안 써도 됨.

작업:
1. P1-1 에서 만든 StepWizard 활용. CourtAdd 는 다단계.
2. 각 페이지 server wrapper (page.tsx) + client form 분리. server는 dummy props 또는 placeholder.
3. 시안의 submitted=true 상태를 useState 로 동작시키되, 실제 mutation은 alert("준비 중") + scratchpad.md 추후 구현 목록 추가.
4. 사진 업로더는 input[type=file] 자리만 두고 미동작.

검증:
- /courts/submit → 다단계 진행 OK
- /games/[id]/guest-apply → 폼 작성 후 submitted 화면

커밋:
- "feat(design-v2): Phase 9 P1-2a /courts/submit 신규 (UI only)"
- "feat(design-v2): Phase 9 P1-2b /games/[id]/guest-apply 신규 (UI only)"
```

---

### P1-3 · GameReport + RefereeRequest — ✅ 완료 (진입점 CTA 후속 필요)

```
"오늘 작업 시작하자" 체크리스트 먼저 통과시킨 뒤 시작.

목표: 경기 신고/평가(GameReport) + 심판 배정 요청(RefereeRequest) 박제.

대상 1 — GameReport:
- 시안: Dev/design/BDR v2/screens/GameReport.jsx
- 신규 라우트: src/app/(web)/games/[id]/report/page.tsx
- 핵심 UI: 선수별 평점(별 1-5) + 신고 플래그 (노쇼/지각/매너 등) + MVP 선택 + 전체 평가 + 코멘트
- DB: game_reports + game_player_ratings 신규 — 본 작업 UI only.

대상 2 — RefereeRequest:
- 시안: Dev/design/BDR v2/screens/RefereeRequest.jsx
- 신규 라우트: src/app/(web)/tournaments/[id]/referee-request/page.tsx
- 기존 Referee v2 시스템 위에 빌드 (커밋 5213131 이후 Referee 페이지 박제됨)
- 시안 단계: 대회 선택 → 심판 다중 선택 → 메시지·수수료 → 제출 완료
- DB: 기존 referee_requests / referee_assignments 활용 가능성 — 확인.

작업:
1. P1-1 의 StepWizard 활용 (둘 다 다단계).
2. GameReport 의 별점 컴포넌트 → src/components/ui/star-rating.tsx 신규 (재사용 가능).
3. RefereeRequest 의 심판 카드 그리드 → src/components/referee/referee-pick-card.tsx 신규.
4. 둘 다 mutation은 alert("준비 중") + 추후 구현 목록.
5. 시안의 노쇼/MVP/플래그 토글 패턴 그대로 박제.

검증:
- /games/[id]/report → 6선수 평점 + 신고 플래그 + MVP 선택 + 제출 완료 화면
- /tournaments/[id]/referee-request → 3단계 통과

커밋:
- "feat(ui): StarRating 컴포넌트"
- "feat(design-v2): Phase 9 P1-3a /games/[id]/report 신규 (UI only)"
- "feat(design-v2): Phase 9 P1-3b /tournaments/[id]/referee-request 신규 (UI only)"
```

---

### P1-4 · SeriesCreate — ✅ 완료 (진입점 정책 결정 필요)

```
"오늘 작업 시작하자" 체크리스트 먼저 통과시킨 뒤 시작.

목표: 시리즈 생성 위저드 박제.

대상:
- 시안: Dev/design/BDR v2/screens/SeriesCreate.jsx
- 신규 라우트: src/app/(web)/series/new/page.tsx
- DB: series 테이블 (이미 있음) + 운영자 권한 가드 필요

작업:
1. P1-1 의 StepWizard 활용.
2. 운영자 권한이 없으면 안내 페이지로 리다이렉트 (서버 wrapper 에서 처리).
3. 시안 4-5단계 그대로 박제 (이름/태그라인/포맷/주최자/색상 등).
4. Mutation은 alert("준비 중") + 추후 구현 목록.

검증:
- /series/new → 위저드 통과
- 권한 없으면 친절한 안내

커밋: "feat(design-v2): Phase 9 P1-4 /series/new 신규 (UI only)"
```

---

### P1-5 · 디자인 갱신 16종 (이미 박제된 라우트와 시안 비교) — ⏳ 부분 (1대1 비교 검수 잔여)

```
"오늘 작업 시작하자" 체크리스트 먼저 통과시킨 뒤 시작.

목표: 이미 박제된 16개 라우트가 신규 시안 BDR v2 와 일치하는지 1대1 비교 + 변경분 박제.

비교 대상:
1. /about — Dev/design/BDR v2/screens/About.jsx
2. /terms — Terms.jsx
3. /privacy — Privacy.jsx
4. /profile/billing — Billing.jsx
5. /pricing/success — PricingSuccess.jsx
6. /pricing/fail — PricingFail.jsx (errorCode 매핑 추가됐는지 확인)
7. /verify — Verify.jsx
8. /reset-password — PasswordReset.jsx (4단계 + 강도 미터)
9. /profile/edit — EditProfile.jsx (5탭)
10. /profile/activity — MyActivity.jsx
11. /profile/notification-settings — NotificationSettings.jsx
12. /teams/[id]/manage — TeamManage.jsx (4탭)
13. /invite — Invite.jsx
14. /series — Series.jsx
15. /series/[slug] — SeriesDetail.jsx (4탭)
16. /search — SearchResults.jsx

작업 흐름 (한 라우트씩):
1. 현재 Next.js 페이지를 브라우저에 띄움 (npm run dev → http://localhost:3001/<route>).
2. 같은 화면의 시안을 별도 탭에 띄움: `Dev/design/BDR v2/MyBDR.html?route=<screenName>`.
3. 두 화면을 좌우 비교 (1280px + 375px 모바일 모두) → 시각적 차이 식별.
4. 현재 Next.js 페이지의 데이터 패칭 / API 호출 로직은 100% 유지.
5. UI 마크업 / 인라인 스타일 / className 만 시안에 맞춰 수정.
6. 모바일 반응형(`Dev/design/BDR v2/responsive.css`) 패치 함께 반영.
7. 한 라우트 박제 후 npm run build 통과 + 시안 비교 OK 면 커밋.

(참고: 이전에는 `BDR v2/` ↔ `BDR v2 (1)/` 폴더 diff 로 신규 추가분을 식별했으나, 2026-04-28 폴더 통합 후로는 단일 시안 폴더만 존재. 시안 vs 현재 페이지 직접 비교가 1순위.)

특별 주의:
- PricingFail 의 errorCode 매핑(PAY_PROCESS_CANCELED 등) 은 신규로 추가됨 — 시안 PricingFail.jsx 25-35줄 매핑 객체 그대로 가져오기.
- PasswordReset 의 비밀번호 강도 미터(5단계) 는 신규.
- TeamManage 의 4탭 구조(로스터/신청/초대/설정) 는 신규.
- SearchResults 의 7탭 + 사이드 필터(area/level/dateRange/freeOnly/openOnly) 는 신규.

권장 묶기:
- 짧은 것 (about/terms/privacy/invite/pricing-success/pricing-fail) → 1 PR 6개
- 폼 (verify/reset-password) → 1 PR 2개
- 프로필 (billing/edit/activity/notification-settings) → 4 PR
- 팀 (teams-manage) → 1 PR
- 시리즈 (series/series-detail) → 1 PR 2개
- 검색 (search) → 1 PR

각 PR 커밋: "feat(design-v2): Phase 9 P1-5 <route> 시안 갱신"
```

---

## P2 · IA 개선 + 모바일 폴리시 잔여

### P2-1 · More 메뉴 5그룹 IA — ⏳ 부분 완료 (가짜 4건 제거 `aa61003` / 핵심 액션 추가 잔여)

```
"오늘 작업 시작하자" 체크리스트 먼저 통과시킨 뒤 시작.

목표: 글로벌 네비의 More 메뉴를 시안의 5그룹 카테고리 구조로 재편.

대상:
- 시안: Dev/design/BDR v2/components.jsx 의 moreGroups (117-161줄)
- Next.js 위치: src/components/nav/* 또는 layout.tsx 안의 글로벌 헤더

5그룹:
1. 내 활동 (mygames/guestApps/calendar/saved/messages/achievements/stats — 7개)
2. 경기·대회 (live/bracket/gameResult/gameReport/scrim/tournamentEnroll/guestApply — 7개)
3. 등록·예약 (courtBooking/courtAdd/teamCreate/teamManage/refereeRequest — 5개)
4. 둘러보기 (searchResults/referee/coaches/reviews/awards/gallery/shop — 7개)
5. 계정·도움 (editProfile/notificationSettings/safety/passwordReset/onboardingV2/about/pricing/help — 8개)

작업:
1. 현재 More 드롭다운 컴포넌트의 단일 리스트 → 5그룹 2-col 그리드로 변경.
2. 각 그룹에 작은 헤더 라벨 + 항목 7-8개씩.
3. 데스크톱: 680px 너비 + 70vh max-height + scroll.
4. 모바일: 풀폭 풀스크린 또는 bottom sheet (시안 responsive.css 의 .nav__more-panel 룰 참고).
5. 신규 라우트 (P1) 가 추가되면 자동으로 함께 노출되도록 구조 정리.

검증:
- 데스크톱: 드롭다운에 5그룹 보임
- 모바일: 풀폭 시트로 열림

커밋: "feat(design-v2): Phase 9 P2-1 More 메뉴 5그룹 IA"
```

---

### P2-2 · 모바일 폴리시 Med 잔여 5건 — ⏳ 부분 (Phase 9-Mobile Refinement `dc1e38a` + grid 안티패턴 `4afb4f9` + overflow 가드 `f972aaf`)

```
"오늘 작업 시작하자" 체크리스트 먼저 통과시킨 뒤 시작.

목표: _mobile_audit_report.html 의 Med 잔여 5건 처리.

처리 대상:
1. live: 비디오 컨테이너 aspect-ratio:16/9 명시 — src/app/(web)/live/
2. gallery: 라이트박스 모달이 .page 외부에 렌더링되어 모바일 stack 룰 미적용 — 모달 내부에 mobile className 추가 또는 셀렉터 추가
3. calendar: 월간 그리드 셀당 ~50px 9px 폰트 한계 — 셀 탭 시 일간 모달 추가 (모바일 전용 동작)
4. postWrite: 에디터 툴바 9버튼 1줄 → 모바일에서 그룹화 또는 가로 스크롤 (overflow-x:auto)
5. profile: 320px 카드 sidebar → 모바일 hero 섹션으로 변환 (avatar+name+level 압축)

작업: 한 건씩 처리 후 npm run build → 모바일 검증.

각 건 커밋: "fix(design-v2): Phase 9 P2-2 <route> 모바일 폴리시"
```

---

## P3 · 자동 검증 시스템

### P3-1 · Playwright 모바일 감사 스크립트 — ❌ 미착수

```
"오늘 작업 시작하자" 체크리스트 먼저 통과시킨 뒤 시작.

목표: 시안 _mobile_audit_report.html 와 동일한 형식의 자동 감사 스크립트 신설.

작업:
1. scripts/mobile-audit.ts 신규.
   - playwright 를 devDependency 로 추가 (이미 있다면 재사용)
   - 75개 라우트 리스트 (시안 _mobile_audit.html 의 GROUPS 객체 + Next.js 라우트 인벤토리)
   - 각 라우트를 375x667 viewport 로 방문 → 스크린샷 + body.scrollWidth > 375 검사 + 컬러 토큰 위반 검사 (하드코딩 색상 grep)
2. 결과를 Dev/design/audit-results/<YYYYMMDD>.html 로 출력 (시안 _mobile_audit_report.html 형식 그대로 — KPI/High/Med/Low 섹션).
3. npm run audit:mobile 스크립트로 등록 (package.json).
4. README 또는 Dev/design/AUDIT.md 에 사용법 문서화.

검증:
- npm run audit:mobile 실행 → audit-results/<오늘날짜>.html 생성
- 가로 스크롤 발생하는 라우트가 있다면 High 로 자동 분류

커밋:
- "chore: playwright devDep 추가"
- "feat(audit): scripts/mobile-audit.ts 자동 모바일 감사 스크립트"
```

---

### P3-2 · CI 통합 (선택) — ❌ 미착수

```
"오늘 작업 시작하자" 체크리스트 먼저 통과시킨 뒤 시작.

목표: PR마다 자동 모바일 감사 + 회귀 알림.

작업:
1. .github/workflows/mobile-audit.yml 신규.
2. PR 발생 시 npm run audit:mobile 실행.
3. 결과 HTML 을 PR artifact 로 업로드.
4. 가로 스크롤 발생 라우트가 있다면 PR에 봇 코멘트로 "이 PR로 N개 라우트 가로 스크롤" 알림.
5. baseline 과 비교 (이전 main의 결과를 캐싱) — 신규 회귀만 알림.

검증:
- PR 생성 → Actions 탭에서 mobile-audit job 실행 확인
- artifact 다운로드 가능

커밋: "chore(ci): mobile-audit workflow"
```

---

## 🎁 부록 · 즉시 쓸 수 있는 한 줄 점검 명령

```bash
# 시안 화면 목록 보기 (총 70+개)
ls "Dev/design/BDR v2/screens/"

# 시안의 라우터/More 메뉴/responsive 패턴 확인
cat "Dev/design/BDR v2/components.jsx" | grep -A 60 "moreGroups"
cat "Dev/design/BDR v2/responsive.css" | head -100

# 시안 모바일 감사 리포트 열기 (High 3 / Med 8 자체 분류 완료)
start "Dev/design/BDR v2/_mobile_audit_report.html"  # Windows
open  "Dev/design/BDR v2/_mobile_audit_report.html"  # macOS

# 시안 직접 미리보기 (375x667 iframe 그리드 — 75 라우트 한꺼번에)
# Dev/design/BDR v2/_mobile_audit.html 열기 — 그룹 버튼으로 화면 비교

# 특정 라우트만 시안에서 미리보기
# Dev/design/BDR v2/MyBDR.html?route=<screenName>
# 예: ?route=gameReport, ?route=onboardingV2, ?route=courtAdd

# Next.js 페이지 vs 시안 좌우 비교
# 탭1: http://localhost:3001/<route>
# 탭2: file:///<absolute>/Dev/design/BDR v2/MyBDR.html?route=<screenName>
```

---

## ⚠️ 작업 시 절대 지킬 룰 (CLAUDE.md 발췌)

1. `main` 직접 push 금지 — `subin → dev → main` 흐름
2. `.env`에 운영 DB URL 금지
3. 운영 DB에 prisma db push / migrate 금지
4. 하드코딩 색상 금지 — 무조건 `var(--color-*)` 토큰
5. lucide-react 금지 — Material Symbols Outlined 사용
6. 핑크/살몬/코랄 금지
7. 버튼 border-radius 4px
8. 신규 API 응답 키는 자동 snake_case 변환됨 — 프론트 인터페이스도 snake_case
9. `withAuth` + `withValidation` 비공개 API 필수
10. DB 미지원 기능 — 제거 금지, "준비 중" 표시 + scratchpad.md 추후 구현 목록 추가

---

작성 끝.
