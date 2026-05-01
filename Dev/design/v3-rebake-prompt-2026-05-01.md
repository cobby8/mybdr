# BDR v3 박제 재시작 프롬프트 (2026-05-01)

> **목적**: Dev/design/BDR-current/ (Phase 13 마이페이지 hub + Phase 19 BottomNavEditor) 시안을 mybdr 운영 코드에 박제.
> **범위**: P0 (마이페이지 hub + Phase 19 헤더) → P1 (/profile/* 깊은 페이지 8건) → P2 (신규 시안 7건)
> **보존**: 운영 헤더 Phase 19 / API / data fetch / snake_case 직렬화 / withAuth+withValidation
> **상태**: 활성 — 박제 진행 시 이 문서를 v3-rebake-prompt-2026-05-01-DONE.md 로 rename 후 _archive/prompts/ 이동

---

## 0. 시작 전 확인 (필수)

### 0-1. 환경 점검 (오늘 작업 시작하자 체크리스트)

```powershell
# 브랜치 + 원격 + 미커밋 확인
git remote -v                          # origin = github.com/bdr-tech/mybdr
git fetch origin --prune
git branch --show-current              # subin 이어야 함
git status --short
git log --oneline -5

# 환경 (.env / .env.local) 검증
Test-Path .env                         # True
Select-String -Path .env -Pattern "DATABASE_URL"   # 개발 DB 인지 (값 노출 ❌)
Test-Path .env.local                   # True (localhost:3001 오버라이드)
```

✅ 모두 통과 → "이대로 박제 시작해도 될까요?" 승인 받기.

### 0-2. 박제 룰 인지

```powershell
cat "Dev/design/claude-project-knowledge/00-master-guide.md"
cat "Dev/design/claude-project-knowledge/03-appnav-frozen-component.md"
cat "Dev/design/claude-project-knowledge/06-self-checklist.md"
```

### 0-3. 시안 source 확인

```powershell
ls "Dev/design/BDR-current/screens" | Measure-Object   # 87 파일
cat "Dev/design/BDR-current/README.md"                 # Phase 13 마이페이지 hub
```

---

## 1. P0 — 마이페이지 hub + Phase 19 헤더 (긴급 박제)

### P0-1. AppNav frozen Phase 19 검증 + 누락 시 패치 (예상 0~30분)

**목적**: main bar 우측 = [다크, 검색, 쪽지, 알림, 햄버거] 5개 순서 / `app-nav__icon-btn` 클래스 / 모바일 단일 다크 아이콘.

```bash
# 운영 헤더 컴포넌트 찾기
grep -rn "app-nav" src/components --include="*.tsx" | head
grep -rn "app-nav__icon-btn" src/ --include="*.tsx"

# 다음 4 회귀 자동 검수
# ❌ "더보기 ▼" dropdown — main bar 에서 제거
# ❌ 모바일 듀얼 라벨 "☀ 라이트 ☾ 다크" — 단일 아이콘으로
# ❌ 검색/쪽지/알림 .btn .btn--sm 박스 — app-nav__icon-btn 으로
# ❌ 우측 아이콘 순서 [다크, 검색, 쪽지, 알림, 햄버거] 외
```

**박제 source**: `Dev/design/BDR-current/components.jsx` AppNav 구간 그대로 카피 (재구성 ❌).

**검증**: `pnpm dev` (포트 3001) → http://localhost:3001 접속 → DevTools 모바일 768px 토글 → 4 위반 ❌ 확인.

---

### P0-2. /profile = MyPage hub 박제 (예상 2~3h)

**목적**: `src/app/(web)/profile/page.tsx` 본문을 MyPage hub (3-tier 카드) 로 재구성.

**시안 source**:
- `Dev/design/BDR-current/screens/MyPage.jsx` (전체)
- `Dev/design/BDR-current/mypage.css` (스타일)

**3-tier 구조**:

| Tier | 카드 | 진입 라우트 |
|------|------|-------------|
| 1 (큰) | 🏀 프로필 (편집/본인인증 ✓) | `/profile/edit` |
| 1 (큰) | 🏀 내 농구 (시즌 스탯 4-stat) | `/profile/basketball` (또는 stats) |
| 1 (큰) | 📈 내 성장 (12주 sparkline) | `/profile/growth` |
| 1 (큰) | ⚡ 내 활동 (12주 막대) | `/profile/activity` |
| 2 (중간) | 📅 예약 이력 | `/profile/bookings` |
| 2 (중간) | 📰 주간 리포트 NEW | `/profile/weekly-report` |
| 2 (중간) | 🔔 알림 N건 | `/notifications` |
| 2 (중간) | 🏆 배지·업적 | `/profile/achievements` |
| 3 (작은) | ⚙ 설정 | `/profile/settings` |
| 3 (작은) | 💳 결제·멤버십 | `/profile/billing` |

**보조 정보 (사이드 / 모바일 stack)**: D-N 다음 경기 / 소속 팀 / 최근 활동 5건 / 도움말.

**모바일 (≤720px)**:
- 헤로 edge-to-edge 풀블리드 / suffix(" 의 농구") 숨김 / 아바타 56px
- Tier 1 = 2x2 그리드 / 통계 그리드도 자동 2x2
- Tier 2/3 = 1열 row 리스트 (56px 터치 타겟)
- 사이드 = 본문 아래 stack
- ≤380px = 아바타 50px / sub-text 숨김

**진입점 3중 보장**:
1. 헤더 utility — 닉네임 + "마이페이지" 링크
2. 더보기 "계정·도움" 그룹 첫 항목 🏠 마이페이지
3. /profile 직접 (URL 직진입)

**Phase 12 본인인증 fallback**:
```jsx
name_verified: (apiData.name_verified ?? false)
// true → ✓ + badge--ok "본인인증" / false → "미인증" + badge--warn
```

**보존**:
- `/api/web/me` + `/api/web/profile` 응답 형식 (snake_case 직렬화)
- `getWebSession` + `Promise.all` 7쿼리 병렬
- /users/[id] (타인 프로필) 와 분리: 본인 = hub / 타인 = 단순

**검증**:
1. /profile 접속 → 3-tier 카드 ✅
2. 모바일 768/720/380px 분기 ✅
3. 모든 카드 클릭 → 정확한 라우트 ✅
4. self-checklist 06 §1~§6 모두 ✅

---

### P0-3. 더보기 메뉴 — "계정·도움" 첫 항목 🏠 마이페이지 (예상 30분)

**목적**: 더보기 5그룹 IA 의 "계정·도움" 그룹 첫 항목으로 마이페이지 추가.

**시안 source**: `Dev/design/BDR-current/components.jsx` More 컴포넌트 구간.

**룰 보존**:
- 가짜링크 4건 영구 제거: `gameResult / gameReport / guestApps / referee` ❌
- `refereeInfo` (둘러보기 그룹) + `mypage` (계정·도움 첫 항목) ✅

**검증**: 더보기 drawer 열기 → "계정·도움" 그룹 → 첫 항목 🏠 마이페이지 → /profile 라우트.

---

## 2. P1 — /profile/* 깊은 페이지 8건 박제 (예상 5~7h)

각 페이지 박제 시 P0-2 와 동일 절차: 시안 카피 + 모바일 분기 + API 보존 + self-checklist.

| 라우트 | 시안 파일 | 신규/변경 | 핵심 |
|--------|-----------|-----------|------|
| `/profile/edit` | `EditProfile.jsx` | 변경 (공개 범위 §5 흡수) | 닉네임/실명/포지션/신장/주력손/소개/공개 범위 |
| `/profile/settings` | `Settings.jsx` | 변경 (Phase 19 신규) | **5섹션** + 표시·접근성에 BottomNavEditor (모바일 하단 자주가기 5슬롯) |
| `/profile/billing` | `Billing.jsx` | 변경 | 결제·멤버십 |
| `/profile/activity` | `MyActivity.jsx` | 변경 | 12주 활동 막대 |
| `/profile/bookings` | `ProfileBookings.jsx` ⭐ NEW | 신규 | 예약 이력 |
| `/profile/complete` | `ProfileComplete.jsx` ⭐ NEW | 신규 | 가입 위저드 — 단계별 완료 |
| `/profile/preferences` | `ProfileCompletePreferences.jsx` ⭐ NEW | 신규 | 가입 위저드 — 선호 설정 |
| `/profile/growth` | `ProfileGrowth.jsx` ⭐ NEW | 신규 | 12주 sparkline 시즌 스탯 |
| `/profile/weekly-report` | `ProfileWeeklyReport.jsx` ⭐ NEW | 신규 | 주간 리포트 NEW |

### P1-2 Settings.jsx Phase 19 BottomNavEditor 디테일

**BottomNavEditor 컴포넌트** (Settings 안 "표시·접근성" 섹션):
- 5 슬롯 cap (최대 5개 / 최소 1개)
- ← → 화살표로 순서 변경 / × 로 제거
- "전체 메뉴" 카탈로그 — 탭으로 추가/제거 (선택 시 위치 번호 노출)
- "기본값으로 복원" 버튼

**전역 의존**:
- `window.getBottomNavSlots() / setBottomNavSlots()` — localStorage 영속화
- `window.BOTTOM_NAV_DEFAULT` — 기본 슬롯 배열
- `window.BOTTOM_NAV_CATALOG` — 전체 메뉴 (id, label, icon)

**박제 시 운영 환경**:
- localStorage 영속 → 사용자 단말 단위
- 카탈로그 = 운영 메뉴 9 메인 탭 + 마이페이지 + 알림 + 검색 등 (시안 카탈로그 그대로 카피)
- React Server Component 호환 — `'use client'` 필요

**검증**:
1. Settings 페이지 → "표시·접근성" 섹션 → BottomNavEditor 렌더 ✅
2. 5 슬롯 추가/제거/순서 변경 ✅
3. 페이지 새로고침 후 슬롯 영속 ✅
4. 모바일 하단 nav 즉시 반영 ✅
5. "기본값 복원" → 초기값 ✅

---

## 3. P2 — 신규 시안 7건 박제 (예상 4~6h)

마이페이지 외 신규 시안. 기존 페이지 통합 / 신규 라우트.

| 시안 파일 | 위치 | 변경 |
|-----------|------|------|
| `ContextReviews.jsx` ⭐ NEW | /reviews/[type]/[id] | 컨텍스트 리뷰 (코트/팀/플레이어) |
| `GameEdit.jsx` ⭐ NEW | /games/[id]/edit | GameDetail 통합 (현재 inline edit) |
| `HelpGlossary.jsx` ⭐ NEW | /help (Help 안 섹션) | 용어집 — Help 페이지에 흡수 |
| `LiveResult.jsx` ⭐ NEW | /live/[id] (Live 안 결과 화면) | Live 끝나면 LiveResult 로 전환 |
| `PostEdit.jsx` ⭐ NEW | /community/[id]/edit | PostDetail 통합 (현재 inline edit) |
| `RefereeInfo.jsx` ⭐ NEW | /referee-info | 둘러보기 그룹 신규 라우트 |
| `VenueDetail.jsx` ⭐ NEW | /courts/[id] (CourtDetail 흡수) | venue → court 통합 |

**박제 룰**:
- 통합 (GameEdit / PostEdit / HelpGlossary / LiveResult / VenueDetail) → 기존 페이지에 inline 흡수, 별도 라우트 추가 ❌
- 신규 라우트 (ContextReviews / RefereeInfo) → DB 미지원 컬럼 있으면 "준비 중" 표시 + scratchpad.md 후속 큐
- 모두 self-checklist 06 §1~§6 통과

---

## 4. 후속 큐 (P3 이상 — 별도 prompt)

- 변경된 기존 시안 60+ 건 미세 동기화 (평균 3~5%) — 1~2주 작업
- Refund.jsx /refund 신설 (KG이니시스 가맹점 심사 요건)
- 알림 카드 N건 실시간 sync (현재 더미 3)
- 주간 리포트 NEW 뱃지 자동 만료 로직
- /profile/basketball 신설 (현재 stats 라우팅)

---

## 5. 박제 완료 체크리스트 (P0~P2 모두)

```
□ 사용자 결정 §1~§8 보존 (헤더 / 더보기 / 카피 / 모바일)
□ AppNav frozen — components.jsx 카피 사용 (재구성 ❌)
□ self-checklist 06 §1~§6 모든 항목 ✅
□ 회귀 자동 4 케이스 통과 (더보기 ▼ / 듀얼 라벨 / 박스 / 순서)
□ 13 룰 모두 ✅ (토큰 / 핑크-살몬-코랄 ❌ / lucide-react ❌ / pill 9999px ❌)
□ 모바일 ≤720px / iOS input 16px / 버튼 44px
□ API 응답 snake_case (camelCase 사일런트 undefined ❌)
□ withAuth + withValidation (비공개 API)
□ DB 미지원 → "준비 중" + scratchpad.md
□ 운영 헤더 Phase 19 보존 (마이페이지 박제 시 헤더 변경 ❌)
□ getWebSession + Promise.all 병렬 보존
□ /api/web/me + /api/web/profile 응답 형식 0 변경
```

---

## 6. 박제 후 인계

1. `Dev/design/v3-rebake-prompt-2026-05-01.md` → `Dev/design/_archive/prompts/v3-rebake-prompt-2026-05-01-DONE.md` 이동
2. `Dev/design/README.md` "현재 활성 작업" 섹션 갱신
3. `.claude/scratchpad.md` 작업 로그 1줄 추가
4. `.claude/knowledge/architecture.md` 마이페이지 hub 구조 1줄 추가
5. commit `feat: BDR-current Phase 13 마이페이지 hub + Phase 19 BottomNav 박제`

---

## 7. 위반 시 즉시 중단 → PM 보고

다음 발견 시 본 프롬프트 작업 중단 + PM 결정 받기:
- 사용자 결정 §1~§8 위반 (헤더 / 더보기 / 카피 / 모바일)
- 신규 메인 탭 추가 (메인 탭 9개 변경)
- DB 미지원 기능을 시안에 (라우트 존재 / 데이터 출처 불명)
- BDR-current/ 외 다른 시안 폴더 (BDR v2.X/) 직접 참조 ← 단일 폴더 룰 위반
