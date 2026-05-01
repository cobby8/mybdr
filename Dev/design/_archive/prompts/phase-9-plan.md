# Phase 9 계획서 (BDR v2 업그레이드)

> **상태**: active
> **갱신 주기**: Phase 단위 (종료 시 `archive/phase-9/` 로 이동)
> **상위 문서**: [README.md](./README.md)
> **함께 보는 문서**: [phase-9-prompts.md](./phase-9-prompts.md) (CLI 실행) · [phase-9-audit.md](./phase-9-audit.md) (UI 진입점 감사)
> **마지막 검증**: 2026-04-28
> **시안 위치**: `Dev/design/BDR v2/` (단일 폴더로 통합 완료)
> **적용 브랜치**: `design_v2` (Phase 8 종료 직후)

---

## 0. 한 줄 요약

신규 시안은 **(a) 신규 화면 23개 추가** + **(b) 모바일 반응형 전면 강화 (responsive.css 231 → 756줄, 3.3배)** + **(c) 글로벌 More 메뉴를 5그룹 카테고리로 재편** + **(d) 모바일 감사 인프라(`_mobile_audit.html`, `_mobile_audit_report.html`) 동봉**. 토큰/색상 체계는 무변경.

---

## 1. 차이점 분석

### 1-1. 변경 없음 (안심)

| 항목 | 상태 |
|------|------|
| `tokens.css` (디자인 토큰 / 색상 / 타이포) | **무변경** ✅ |
| `data.jsx` (더미 데이터 baseline) | **무변경** ✅ |
| `community-data.jsx` | **무변경** ✅ |
| `assets/`, `ref/` 폴더 | **무변경** ✅ |
| BDR Red / Navy / Cool Gray 팔레트 | 그대로 유지 ✅ |
| 다크모드 기본, border-radius 4px 룰 | 그대로 ✅ |

→ **`DESIGN.md` 디자인 시스템 문서 재작성 불필요**. 기존 룰 그대로 적용.

### 1-2. 신규 화면 23개

| 그룹 | 화면 | 신규 라우트 필요? | 기존 라우트 |
|------|------|----------------------|----------|
| 법적/소개 | `About.jsx` | 디자인 갱신 | `/about` |
| 법적/소개 | `Terms.jsx` | 디자인 갱신 | `/terms` |
| 법적/소개 | `Privacy.jsx` | 디자인 갱신 | `/privacy` |
| 결제 | `Billing.jsx` | 디자인 갱신 | `/profile/billing` |
| 결제 | `PricingSuccess.jsx` | 디자인 갱신 | `/pricing/success` |
| 결제 | `PricingFail.jsx` | 디자인 갱신 + 토스 errorCode 매핑 | `/pricing/fail` |
| 인증/온보딩 | `Verify.jsx` (전화번호 인증) | 디자인 갱신 | `/verify` |
| 인증/온보딩 | `PasswordReset.jsx` (4단계) | 디자인 갱신 | `/reset-password` |
| 인증/온보딩 | `OnboardingV2.jsx` (6+1 단계) | **🆕 NEW** | `/onboarding/setup` 신설 |
| 프로필 | `EditProfile.jsx` (5탭) | 디자인 갱신 | `/profile/edit` |
| 프로필 | `MyActivity.jsx` (대회·경기·팀 신청 통합) | 디자인 갱신 | `/profile/activity` |
| 프로필 | `NotificationSettings.jsx` (push/email/sms + quiet hours) | 디자인 갱신 | `/profile/notification-settings` |
| 팀 | `TeamManage.jsx` (4탭: 로스터/신청/초대/설정) | 디자인 갱신 | `/teams/[id]/manage` |
| 팀 | `Invite.jsx` (수신자 화면) | 디자인 갱신 | `/invite` |
| 시리즈 | `Series.jsx` (시리즈 허브) | 디자인 갱신 | `/series` |
| 시리즈 | `SeriesDetail.jsx` (4탭: 회차/명예/통계/소개) | 디자인 갱신 | `/series/[slug]` |
| 시리즈 | `SeriesCreate.jsx` | **🆕 NEW** | `/series/new` 신설 |
| 코트 | `CourtAdd.jsx` (사용자 코트 제보, 다단계) | **🆕 NEW** | `/courts/submit` 신설 |
| 경기 | `GameReport.jsx` (경기 후 평가/신고/MVP) | **🆕 NEW** | `/games/[id]/report` 신설 |
| 경기 | `GuestApply.jsx` (게스트 지원 폼) | **🆕 NEW** | `/games/[id]/guest-apply` 신설 |
| 심판 | `RefereeRequest.jsx` (심판 배정 요청) | **🆕 NEW** | `/tournaments/[id]/referee-request` 신설 |
| 검색 | `SearchResults.jsx` (필터/정렬 + 7탭) | 디자인 갱신 | `/search` |
| 에러 | `NotFound.jsx` | Next.js `not-found.tsx` 적용 | 글로벌 |

→ **신규 라우트 7개 + 디자인 갱신 16개**.

### 1-3. 모바일 반응형 강화 (responsive.css)

| 영역 | 신규 패치 |
|------|-----------|
| 보드 테이블 | 단일 게시판은 카드 리스트로 자동 변환 (`board:not(.data-table)`) |
| 그리드 일반화 | `grid-template-columns` 인라인 스타일을 모바일에서 1열로 강제 (`1fr) 340px / 320px / 300px / 280px / 360px` 등) |
| 메시지 3열 | `[data-mobile-view="list"|"thread"]` 속성 기반으로 목록↔채팅 push 흐름 |
| 포스터 그리드 | `repeat(3, 1fr)` → 모바일에서 `repeat(2, 1fr)` |
| sticky 해제 | aside/nav `position: sticky` → 모바일에서 `static` |
| iOS 줌 방지 | input/select 16px 강제 |
| 탭 영역 | min 44px tap target |
| Tweaks 패널 | 풀폭 bottom sheet |
| 스코어보드 | 96 → 56px 축소 |

### 1-4. More 메뉴 (네비) 재편

기존: 30개 항목 단일 리스트 (스크롤만 길고 분류 없음).
신규: **5그룹 카테고리** + 2-col 그리드 + 680px 너비 + 70vh max-height 스크롤.

```
내 활동 (7)        경기·대회 (7)      등록·예약 (5)
둘러보기 (7)        계정·도움 (8)
```

→ **사용자 멘탈 모델이 명확**. 시안 충실히 박제하면 IA 개선 효과.

### 1-5. 라우터 (MyBDR.html) 변화

- `?route=xxx` URL 쿼리스트링으로 직접 진입 (모바일 감사 하네스용)
- onboarding 모달 `?route=` 진입 시 스킵
- 푸터에 **시리즈/내 활동/결제** 직접 링크 추가

→ 실 Next.js에선 일반 라우트로 처리되므로 무관. 하지만 **딥링크 진입 시 온보딩 모달 차단 로직**은 참고.

### 1-6. 모바일 감사 인프라 신규 동봉

- `_mobile_audit.html`: 375×667 iframe 그리드로 화면별 미리보기 하네스
- `_mobile_audit_report.html`: 72화면 감사 결과 (88% 패치 적용 / High 3 / Med·Low 11)
- `audit/*.png`: bracket mobile 스크린샷 (이미 검증됨)
- `uploads/*.png`: 7장 모바일 검증 스크린샷

→ **이대로 자동 검증 시스템의 baseline으로 활용 가능**.

---

## 2. 모바일 감사 결과 — 즉시 처리 대상

신규 시안에 **`_mobile_audit_report.html` 동봉**됨. 시안 작성자가 이미 자체 감사 완료. 결과:

### 2-1. High (3건, 즉시 수정)

| Route | 문제 | 처리 방향 |
|-------|------|-----------|
| `gameResult` | 선수 통계 15열 테이블 (~740px) 가로 스크롤만 가능, 스와이프 힌트 없음 | 우측 페이드 그라디언트 + "← 스와이프" 마이크로카피 |
| `messages` | 모바일 3열에서 채팅 본문 진입 불가 | `data-mobile-view` 속성 기반 목록 ↔ 채팅 push 흐름 |
| `bracket` | 라운드 헤더(QF/SF/F)가 본체와 함께 스크롤되어 위치 파악 불가 | 라운드 헤더 sticky-top OR 모바일 vertical 모드 |

### 2-2. Medium (8건)

다중 컬럼 board 테이블 라벨 손실 (`teamManage`, `billing`, `scrim`, `match teams`), 라이브 스코어버그 aspect-ratio 누락, `gallery` 라이트박스 모달이 `.page` 외부 렌더링, `calendar` 셀당 9px 폰트 한계, `postWrite` 툴바 9버튼 1줄, `profile` 320px sidebar의 위계 무너짐, `stats` 슈팅 차트 절대좌표.

→ **`<ResponsiveTable />` 컴포넌트화**가 핵심 권고. Once-and-done 패턴.

### 2-3. Low (6건)

이미 패치 적용됨 — 검증만 필요.

---

## 3. 현재 프로젝트 진행 상황 (2026-04-28 기준)

### 3-1. 브랜치/Phase 위치

- **활성 브랜치**: `design_v2`
- **최근 커밋**: `b49eaa1` (Vercel cron 보류)
- **마지막 박제**: Phase 8 — Match (`3dab354`) 직후, 기타 폴리시
- **Phase 8 박제 완료**: Match / MyGames meta / TeamInvite / PostDetail / Coaches / Live / Messages / Gallery / Notifications / Settings / Search

### 3-2. 박제(시안 충실 구현) 현황 요약

| Phase | 범위 | 상태 |
|-------|------|------|
| 1 | GameDetail / Profile / Games | ✅ |
| 2 | MyGames / GameResult | ✅ |
| 3 | Teams / TeamCreate / Court / Bracket | ✅ |
| 5 | Achievements / Awards / Saved / Reviews / NotFound + About | ✅ |
| 6 | Login / Help / Pricing / Signup / Safety / Checkout | ✅ |
| 7 | TournamentEnroll / Stats / Calendar / GuestApps / Scrim / Shop | ✅ |
| 8 | Notifications / Settings / Search / Coaches / Live / Messages / Gallery / PostDetail / TeamInvite / BoardList / MyGames meta / Match | ✅ |

### 3-3. 미박제 / 신규 추가분 (== 본 문서가 다룰 영역)

신규 시안 23개 화면 중 **이미 박제된 화면이 16개**, **신규 박제 필요 화면이 7개**.
별도로 **모바일 폴리시 패치(High 3건 + Med 8건)** 가 추가됨.

→ **새로 들어갈 작업 = "Phase 9 모바일/폴리시 + 신규 7화면 박제"**.

---

## 4. Phase 9 작업 계획서

### 4-1. 우선순위 (P0 → P3)

| 우선순위 | 묶음 | 산출물 | 예상 시간 |
|--------|------|--------|----------|
| **P0** | 모바일 감사 High 3건 (gameResult/messages/bracket) | 3 PR | 4–6h |
| **P0** | 모바일 감사 Med의 board 테이블 라벨 손실 (`<ResponsiveTable />` 컴포넌트화) | 1 PR + 4건 적용 | 4–5h |
| **P1** | 신규 라우트 7종 박제 | 7 PR | 14–18h |
| **P1** | 디자인 갱신 16종 (이미 박제된 라우트의 시안 비교 → 필요 시 미세 조정) | 16 PR (일부 묶기) | 8–12h |
| **P2** | More 메뉴 5그룹 IA 적용 | 1 PR | 1–2h |
| **P2** | 모바일 감사 Med 잔여 (gallery 모달 / postWrite 툴바 / profile hero / calendar 모달 / live aspect-ratio) | 5 PR | 4–5h |
| **P3** | 자동 검증 시스템 (`_mobile_audit.html` Next.js로 이식 → 사내 admin 페이지) | 1 PR | 6–8h |
| **P3** | NotFound 시안 충실 박제 (`/not-found.tsx`) | 1 PR | 0.5h |

**총 예상**: 약 41–56h. 1주 풀타임 또는 2주 절반 페이스.

### 4-2. 신규 라우트 7종 명세

| 신규 라우트 | 시안 | 핵심 컴포넌트 | DB 의존도 |
|---------|------|------------|----------|
| `/onboarding/setup` | `OnboardingV2.jsx` (6+1 단계 위저드) | StepIndicator, MultiSelectChips, NumericStepper, Toggle | users 컬럼 일부 부족 (Phase 1 추후 구현 항목과 합산) |
| `/courts/submit` | `CourtAdd.jsx` | StepWizard, FacilityChips, FeeRadio, PhotoUploader | `courts.submitted_by`, `courts.submission_status` 신규 (또는 `court_submissions` 테이블) |
| `/games/[id]/report` | `GameReport.jsx` | StarRating, ReportFlagChips, MVPSelector | `game_reports`, `game_player_ratings` 신규 |
| `/games/[id]/guest-apply` | `GuestApply.jsx` | PositionPicker, AcceptCheckbox, MessageInput | `guest_applications` (이미 있을 수도, 확인 필요) |
| `/tournaments/[id]/referee-request` | `RefereeRequest.jsx` | RefereeCard, SelectedRefereeBar, FeeStepper | Referee v2 시스템 위에 빌드 (이미 있음) |
| `/series/new` | `SeriesCreate.jsx` | StepWizard | `series` 테이블 운영자 권한 |
| `/onboarding/setup` 와 별도로 `not-found.tsx` 글로벌 | `NotFound.jsx` | — | 0 |

→ **DB 미지원 부분은 04-25 원칙 그대로**: UI 배치 + "준비 중" 표시 + 빈 상태로 두고 추후 구현 (`scratchpad.md`의 추후 구현 목록에 추가).

### 4-3. 컴포넌트화 권고

| 컴포넌트 | 용도 | 사용 위치 |
|---------|------|----------|
| `<ResponsiveTable />` | 모바일에서 `data-label` + `::before` 패턴으로 라벨 자동 표기 | teamManage, billing, scrim, match teams, scrim 기록 등 다수 |
| `<MobileScrollHint />` | 가로 스크롤 가능 영역 우측 페이드 + 첫 진입 시 0.5s 미리 스크롤 | gameResult 통계 테이블, 쿼터별 스코어, bracket |
| `<MobileMessageShell />` | `data-mobile-view` 속성 기반 목록 ↔ 채팅 push | messages |
| `<RoundLabelStickyHeader />` | bracket 라운드 라벨 sticky-top | bracket |
| `<StepWizard />` | 다단계 위저드 표준화 | OnboardingV2, PasswordReset, CourtAdd, RefereeRequest, SeriesCreate, TeamCreate, GameReport |

→ **`<StepWizard />`가 가장 ROI 높음.** 6+화면이 동일 구조.

### 4-4. 자동 검증 시스템 설계 (P3)

**목표**: 시안 박제 후 회귀 방지.

**구성**:
1. **Playwright 스크립트** (`scripts/mobile-audit.ts`)
   - 72개 라우트를 375×667에서 스크린샷
   - 가로 스크롤 발생 라우트 자동 검출 (`document.body.scrollWidth > 375`)
   - 결과를 `Dev/design/audit-results/<date>.html` 로 출력 (시안 형식 그대로)
2. **CI 통합** (선택)
   - GitHub Actions에서 PR마다 모바일 감사 자동 실행
   - 실패 시 PR에 코멘트로 "이 PR로 인해 N개 라우트가 가로 스크롤 발생"
3. **시안과의 픽셀 비교** (선택)
   - 시안 `BDR v2/screens/<name>.jsx` 를 같은 라우트 페이지에 마운트 → diff
   - 너무 빡빡하면 운영 부담. 우선은 **가로 스크롤 + 컬러 토큰 위반**만 검증

→ **단계적**: P3-A (수동 실행 스크린샷), P3-B (CI 통합), P3-C (픽셀 비교).

---

## 5. CLI 프롬프트 (클로드 CLI에 그대로 붙여넣기)

> 각 프롬프트는 독립적이며 한 번에 하나씩 실행. 시작 전에 반드시 `git status` + `git branch` 확인. 모두 `subin` 브랜치에서 작업하는 것을 가정.

프롬프트 묶음은 별도 파일 `phase-9-prompts.md` 로 분리.

---

## 6. 수빈 작업 흐름 가이드

> 바이브 코딩 기준 — CLI 한 번에 하나씩 +  중간 검증 끼워넣기

### 6-1. 권장 실행 순서

```
[1주차]
1일차: 프롬프트 P0-1 (gameResult 가로 스크롤 hint)
2일차: 프롬프트 P0-2 (messages 모바일 push 흐름)
3일차: 프롬프트 P0-3 (bracket 라운드 sticky)
4일차: 프롬프트 P0-4 (<ResponsiveTable /> 컴포넌트화) — 가장 큼
5일차: 프롬프트 P0-4 적용 (4건)

[2주차]
1일차: 프롬프트 P1-1 (NotFound + Onboarding setup) — 가벼운 것부터
2일차: 프롬프트 P1-2 (CourtAdd / GuestApply)
3일차: 프롬프트 P1-3 (GameReport / RefereeRequest)
4일차: 프롬프트 P1-4 (SeriesCreate)
5일차: 프롬프트 P2-1 (More 메뉴 5그룹) + P2-2 (모바일 폴리시 잔여)

[3주차 - 선택]
프롬프트 P3-1 (Playwright 모바일 감사 스크립트)
프롬프트 P3-2 (CI 통합)
```

### 6-2. 각 프롬프트 사이 검증 명령

```bash
# 1. 빌드 통과 확인
npm run build

# 2. 모바일 시뮬 (수동) — 간단
npm run dev
# → 크롬 DevTools → iPhone SE (375x667) → 해당 라우트 확인

# 3. 시안 비교 (자동)
# Dev/design/BDR v2/MyBDR.html?route=<screen> 을 별도 탭에서 열고
# Next.js 라우트와 시각 비교
```

### 6-3. PR / 커밋 규칙

```bash
git add <files>
git commit -m "feat(design-v2): Phase 9 <영역> — 시안 박제"
git push origin subin
# GitHub에서 subin → dev PR
```

PR 본문 템플릿:
```markdown
## 변경 요약
- [ ] 시안: BDR v2/<file>
- [ ] 라우트: <path>
- [ ] DB 변경: 없음 / <내용>

## 모바일 검증
- [ ] 375px 가로 스크롤 없음
- [ ] tap target 44px+
- [ ] 다크모드 색 토큰 사용

## 시안 충실도
- 박제 일치율 ~%
```

---

## 7. 미푸시 사항 / 체크포인트

작업 시작 전 점검:

```bash
git remote -v   # github.com/bdr-tech/mybdr 확인
git fetch origin --prune
git checkout subin
git pull origin subin --rebase
git merge dev   # 최신 dev 받기
cat .env | grep DATABASE_URL   # 개발 DB인지 확인
```

작업 완료 후 점검 (`PM 작업 완료 체크리스트` 따라):
- [ ] `scratchpad.md` 작업 로그 1줄 추가
- [ ] 신규 라우트 → `architecture.md` 갱신
- [ ] DB 미지원 항목 → `scratchpad.md` 추후 구현 목록 추가
- [ ] `.claude/knowledge/index.md` 갱신
- [ ] 미푸시 커밋 알림

---

## 8. 결론

신규 시안의 **3가지 핵심 가치**:

1. **신규 화면 23개 중 16개는 이미 박제 완료** → 디자인 회귀 방지를 위한 **시안 비교 패스**만 필요.
2. **신규 박제 7개**는 모두 단계 위저드 패턴 → `<StepWizard />` 공통 컴포넌트화로 ROI 극대화.
3. **모바일 감사 인프라 동봉**은 자동 검증 시스템의 출발점 → Playwright로 이식 시 회귀 방지 자동화 가능.

**가장 큰 리스크**: 모바일 감사 High 3건 (`gameResult`/`messages`/`bracket`) 은 실 사용자에게 즉시 영향. 우선 처리.

**가장 큰 ROI**: `<ResponsiveTable />` 컴포넌트 한 번 만들면 4+ 화면 한 번에 해결.
