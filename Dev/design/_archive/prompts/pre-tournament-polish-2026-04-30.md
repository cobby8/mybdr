# 대회 직전 사이트 완성도 보강 — 2026-04-30

> **상태**: active (긴급)
> **갱신 주기**: 1회성 (대회 직전 폴리시)
> **상위 문서**: [README.md](./README.md)
> **작성 사유**: 사용자 요청 — "이번 주말부터 중요한 대회, 실 사용자 가입 중. v2.2 박제 외에 사이트 완성도 + 사용성 + UI/UX 통일성 + 자연스러운 흐름 + 입력란 불필요한 예시·설명 제거"
> **시급성**: 🔴 주말 전 처리 권장

---

## 0. 핵심 메시지

### v2.2 박제 vs 대회 직전 폴리시 — 작업 분리 권장

| 영역 | 작업 시점 | 사용자 영향 |
|------|---------|----------|
| **v2.2 박제 11 페이지 (CLI 진행 중)** | 주말 후 (1-3일) | 신규 페이지 추가 — 주말 대회 흐름엔 안 쓰임 |
| **이 보고서의 P0 대회 직전 작업** | **주말 전 (4-6시간)** | **모든 가입자/대회 참가자 즉시 영향** |

**권장**: v2.2 박제 작업이 길어지더라도 P0 대회 직전 작업을 **먼저** 완료. 대회 후 v2.2 박제 마무리.

### 발견 항목 요약

| 카테고리 | 건수 | 시급도 | 견적 |
|----------|------|-------|------|
| A. 가입 첫 동선 자연스러움 | 2 | 🔴 P0 | 1h |
| B. 폼 입력란 placeholder/helper 정리 | 13 | 🔴 P0 (사용자 요청) | 2h |
| C. 대회 참가 흐름 검수 | 4 | 🔴 P0 | 1h |
| D. 빈 상태 / 로딩 / 에러 일관성 | 5 | 🟠 P1 | 2h |
| E. 모바일 첫인상 (홈 ~ 가입) | 3 | 🟠 P1 | 1h |
| F. UI/UX 미세 통일성 | 다수 | 🟢 P2 | 후속 |
| **G. 백버튼 부재** (사용자 보고) | **47 페이지 중 32 누락** | 🔴 P0 | 1.5h |
| **H. 커뮤니티 모바일 탭 회귀** (사용자 보고) | **4 페이지** | 🔴 P0 | 1h |

**총 P0 견적**: 약 **6.5시간** / 1-2 작업일.

---

## 1. 🔴 A. 가입자 첫 동선 — 자연스러움 점검 (1h)

### 1-1. 현재 흐름 (코드 검증 결과)

```
signup → verify → /onboarding/setup (자동 redirect, verify/page.tsx:103)
                ↓
            [More 메뉴에서만 진입] /profile/complete (verify:102 코멘트 명시)
```

### 1-2. 발견된 비자연스러움

#### A-1. 🚨 v2.2 P0-4 와 현재 흐름 충돌 (PM 결정 필요)

- **v2.2 의뢰**: verify → /profile/complete 자동 redirect 추가
- **현재 사이트**: verify → /onboarding/setup 자동 redirect (이미 있음, 이유 코멘트 명시: "신규 회원이 onboarding 위저드를 More 메뉴에서만 발견 가능 → 자동 redirect로 노출 보장")
- **충돌**: v2.2 박제 시 verify 자동 redirect 가 변경됨 → 기존 흐름 회귀
- **해결 옵션**:
  - **A**: 그대로 유지 (verify → /onboarding/setup) + /profile/complete 는 /profile 의 "프로필 60% 완성하기" 배너로만 진입
  - **B**: verify → /profile/complete (압축형 4스텝) → /onboarding/setup (전체 6스텝, 선택적) 2 단계 흐름
  - **C**: 둘 중 하나 폐기 (PM 결정)

→ 박제 작업 §3-4 진행 전 PM 결정 필수.

#### A-2. ⚠️ /profile/complete 진입점 부재

- 현재 코드: More 메뉴에 항목 없고, /profile 의 미완성 배너만 진입점
- 비로그인 가입자가 "프로필 60% 완성" 배너를 보려면 /profile 진입 필수
- **권장**: 가입 직후 (verify) "프로필 작성하기" 카드 1회 노출 (옵션 A 채택 시)

### 1-3. 권장 조치 (P0 작업)

```
[이번 주말 전]
1. PM 이 옵션 A/B/C 중 결정
2. 옵션 A 선택 시:
   - verify 자동 redirect 그대로 유지 (변경 0)
   - /onboarding/setup 의 마지막 단계에 "프로필 추가 완성하기 →" CTA 추가
3. 옵션 B 선택 시:
   - v2.2 P0-4 박제 진행
   - verify → /profile/complete (4 step) 자동 redirect
   - /profile/complete 의 "더 자세히 →" CTA 가 /onboarding/setup 으로
```

---

## 2. 🔴 B. 폼 입력란 placeholder / helper 정리 (2h)

> 사용자 직접 요청: "프로필 페이지 등 입력란에 불필요한 예시와 설명은 제거하는게 UI 구성상 좋다"

### 2-1. 13 건 발견 — 우선 처리 권장 8 건

| # | 위치 | 현재 | 권장 |
|---|------|-----|-----|
| **B-1** | `profile/edit/page.tsx:465` 닉네임 | label="닉네임 *" + sub="커뮤니티에 표시되는 이름" + placeholder="표시될 이름" | label="닉네임" + placeholder="2~20자" + sub 제거 |
| **B-2** | `profile/edit/page.tsx:475` 이름(실명) | label="이름 (실명)" + sub="비공개 · 대회 등록 시 확인용" + placeholder="홍길동" | label="이름" + sub 제거 + 비공개 안내는 [공개·계정] 탭으로 일괄 |
| **B-3** | `profile/edit/page.tsx:501` 휴대폰 | label="휴대폰" + sub="대회 연락용" + placeholder="01012345678" | label + placeholder 만, sub 제거 |
| **B-4** | `profile/edit/page.tsx:572` 신장 | label="신장 (cm)" + placeholder="**예: 180**" | placeholder="180" ("예: " 제거) |
| **B-5** | `profile/edit/page.tsx:585` 체중 | label="체중 (kg)" + sub="비공개" + placeholder="**예: 75**" | label="체중" + placeholder="75" + privacy 탭에서 일괄 |
| **B-6** | `teams/new/_v2/step-basic.tsx:65` 팀 이름 | placeholder="**예: REDEEM, 3POINT, 몽키즈**" + helper="한글·영문 2~20자" | placeholder="REDEEM" + helper="2~20자" |
| **B-7** | `community/new/page.tsx:148` 게시글 제목 | placeholder="**제목을 입력하세요 (최대 80자)**" | placeholder="제목" (maxLength 속성으로 강제) |
| **B-8** | `profile/complete/page.tsx:337` 닉네임 | placeholder="**닉네임 (2~20자)**" + minLength + maxLength | placeholder="닉네임" (HTML 제약 유지) |

### 2-2. 처리 정책 (B 카테고리 일관 룰)

```
✅ DO
- placeholder = 짧은 한 단어 또는 한 줄 형식 (5단어 이내)
- 형식 제약은 HTML 속성 (minLength, maxLength, pattern, type) 으로 강제
- 라벨은 필드명만 (필수 표시 * 만 추가)
- sub/helper 는 페이지 섹션 헤더에 1회만

❌ DON'T
- placeholder 안에 "예: " 또는 "ex)" 시작
- placeholder + sub + helper 3줄 동시 사용
- 같은 형식 안내를 여러 곳에 중복
- 자명한 정보 반복 ("닉네임 (다른 사용자에게 표시됩니다)")
```

### 2-3. 예외 (제거 금지)

- 약관 동의 / 비밀번호 보안 경고 (법적 / 보안)
- 첫 사용자 onboarding 안내 (의도된 도움말)
- 동적 글자수 카운터 ("122/255")

---

## 3. 🔴 C. 대회 참가 흐름 검수 (1h)

### 3-1. 핵심 흐름 (코드 검증 완료)

```
/tournaments → /tournaments/[id] → /tournaments/[id]/join (4스텝) →
→ /pricing/checkout → 성공 → /games/my-games (대회 탭)
```

각 단계 라우팅 정상.

### 3-2. 발견된 미세 끊김

#### C-1. /tournaments/[id]/join 의 결제 후 복귀 경로

- `tournaments/[id]/join/page.tsx:485` — 마지막 단계 후 `/tournaments/${id}` 복귀
- 정상이지만 **결제 성공 후 "내 대회 보기" CTA** 가 약함
- **권장**: success 화면에 "내 신청 내역 보기" → `/games/my-games?tab=tournament` Link 추가

#### C-2. /pricing/checkout 의 me 미리 fetch 401 처리

- `pricing/checkout/page.tsx:117` — `if (!meRes.ok) router.push("/login")`
- 정상. 단 로그인 후 checkout 으로 자동 복귀 안 됨
- **권장**: `router.push("/login?redirect=" + encodeURIComponent(currentUrl))` 로 변경

#### C-3. /games/my-games 의 대회 탭 진입 시 신청 표시

- `games/my-games/_components/reg-row.tsx` — paid 여부 + 결제 라우팅 정상
- 대회 신청 후 도달 OK
- **검수만**: 실 사용자 1명에게 흐름 1회 동작 확인

#### C-4. 토너먼트 상세에 "참가팀 / 대진표 / 일정" 탭 진입

- `tournaments/[id]` → 탭 (overview/schedule/bracket/teams/rules)
- B-1 픽스로 TeamCardV2 적용 완료 ([커밋 6b2e0d0](computer://C:\0. Programing\mybdr))
- **검수만**: 실 대회로 한 번 시각 확인

### 3-3. 권장 조치 (P0)

C-1 + C-2 만 즉시 픽스 (각 5분).

```typescript
// C-1: tournaments/[id]/join success 화면
<Link href="/games/my-games?tab=tournament" className="btn btn--primary">
  내 신청 내역 →
</Link>

// C-2: pricing/checkout 로그인 redirect
const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
if (!meRes.ok) {
  router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
  return;
}
```

---

## 4. 🟠 D. 빈 상태 / 로딩 / 에러 일관성 (2h)

### 4-1. 현황

| 영역 | 현재 |
|------|-----|
| `loading.tsx` 페이지 | 20개 (커뮤니티/코트/게임/프로필/대회 등 — 대다수) |
| 자체 빈 상태 구현 | 15+ 파일 (시안 `EmptyState` 컴포넌트 없이 inline) |
| 404 (`not-found.tsx`) | 1 (루트) — `(web)` 영역 별도 없음 |
| 에러 (`error.tsx`) | 2 (루트 + (web)) |

### 4-2. 발견된 일관성 문제

#### D-1. 빈 상태 (Empty State) 톤 다양 (15+ 파일)

각 파일마다 다른 빈 상태 표현:
- `community/comment-list.tsx`: "아직 댓글이 없어요" + 일러스트 X
- `courts/[id]/court-ambassador.tsx`: "코트 대사 없음" + 카드만
- `games/[id]/host-applications.tsx`: "신청자 없음"
- 등 ...

**시안 표준 (BDR v2.1/2.2)**: `EmptyState` 컴포넌트
- 일러스트 또는 큰 Material Symbols 아이콘 + 제목 + 설명 + 1차 CTA

**권장**: `src/components/ui/empty-state.tsx` 신규 + 점진 적용 (대회 직전엔 P1)

#### D-2. 로딩 스켈레톤 톤 다양 (20개 loading.tsx)

각 페이지마다 다른 스켈레톤 (카드 모양, 색상, 애니메이션 다름)

**권장**: `src/components/ui/skeleton.tsx` 표준 컴포넌트 + 대표 페이지 점진 적용 (P1)

#### D-3. 404 페이지 — `(web)` 그룹 전용 없음

- 루트 `not-found.tsx` 1개만
- 모바일 친화 + BDR 농구 일러스트 + "홈으로" CTA 권장

#### D-4. 에러 페이지 — `(web)/error.tsx` 존재

- 검수만 (실 에러 1회 발생 시 화면 확인)

### 4-3. 대회 직전 P0 vs P1 분리

```
P0 (대회 직전):
- D-3 404 페이지 (web 영역) — 가입자가 잘못된 URL 진입 시 첫 화면

P1 (대회 후):
- D-1 EmptyState 표준화 (15+ 파일)
- D-2 Skeleton 표준화 (20+ loading.tsx)
- D-4 에러 페이지 검수
```

---

## 5. 🟠 E. 모바일 첫인상 — 홈/가입/로그인 (1h)

대회 가입자가 모바일로 처음 접속해서 가입 ~ 첫 액션까지의 시각 검증.

### 5-1. 검증 대상 (모바일 390x844 Chrome DevTools)

| # | 라우트 | 체크 |
|---|------|-----|
| 1 | `/` (홈, 비로그인) | Hero 카로셀 정상 / 메인 탭 9개 / 더보기 5그룹 |
| 2 | `/signup` | 3 step 폼 모바일 1열 / step 진행바 |
| 3 | `/verify` | 인증 입력 / 자동 redirect 정상 |
| 4 | `/onboarding/setup` | 6 step 폼 모바일 / skip 가능 |
| 5 | `/` (로그인 후) | personal hero 정상 / quick-menu / hot posts |
| 6 | `/tournaments` | 대회 목록 카드 그리드 |
| 7 | `/tournaments/[id]` | 5 탭 (overview/schedule/bracket/teams/rules) |
| 8 | `/tournaments/[id]/join` | 4 step 폼 |
| 9 | `/pricing/checkout` | 결제 폼 |
| 10 | `/games/my-games` | 대회 탭 |

### 5-2. 검증 체크포인트

```
✅ 가로 스크롤 0 (모든 페이지)
✅ 글자 단위 줄바꿈 0
✅ 카드 / 그리드 깨짐 0
✅ 헤더 정상 (utility bar 우측 표시 / 검색·알림 박스 X / 다크 토글 단일 아이콘)
✅ 더보기 패널 풀스크린 시트
✅ 폼 input 16px (iOS 자동 줌 X)
✅ 버튼 44px 터치 타겟
✅ 진입·복귀 동선 자연스러움
```

### 5-3. 결과 보고

각 라우트 1줄: "✅ OK" 또는 "🚨 깨짐 + 발견 위치"

---

## 6. 🟢 F. UI/UX 미세 통일성 (P2 — 대회 후)

이미 대부분 BDR v2 / v2.1 / v2.2 박제로 처리 중. 잔여:

- 페이지 셸 클래스 (`.page` 일관 사용 — `(web)` 영역 100%)
- 카드 라운딩 (8px / 12px 혼용 → 8px 통일)
- 버튼 라운딩 (4px 표준 위반 — `personal-hero.tsx`, `quick-menu.tsx` rounded-full 5곳)
- 하드코딩 hex 25건 (이전 보고서 ui-consistency §5)
- lucide-react 1 import (`personal-hero.tsx:5`)

→ 대회 후 P1-1 작업 ([ui-consistency-audit-2026-04-29.md §7-2](./ui-consistency-audit-2026-04-29.md)).

---

## 7. 🔴 G. 전체 사이트 백버튼 부재 — 광범위 회귀 (1.5h, 사용자 보고)

> 사용자 보고: "지금 프로필 영역도 진입하고 뒤로 나가는 버튼이 없고..."

### 7-1. 전수 조사 결과

**47 페이지 중 32 페이지 (68%) 에 백버튼 없음** — 사용자 모바일 막힘.

| 영역 | 전체 | 백버튼 있음 | 부재 |
|------|------|---------|----|
| `/profile/*` | 16 | 4 (25%) | **12** ⚠️ |
| `/tournaments/*` | 7 | 5 (71%) | 2 |
| `/games/*` | 7 | 3 (43%) | 4 |
| `/courts/*` | 7 | 2 (29%) | 5 |
| `/teams/*` | 5 | 1 (20%) | 4 |
| `/organizations/*` | 4 | 0 (0%) | **4** ⚠️ |
| `/users/[id]` | 1 | 0 | 1 |
| **총** | **47** | **15 (32%)** | **32** |

### 7-2. 가장 심각한 영역

#### G-1. /profile/* — 12 페이지 백버튼 없음 (사용자 직접 보고)

백버튼 부재 페이지:
```
/profile, /profile/achievements, /profile/activity, /profile/billing,
/profile/bookings, /profile/complete, /profile/complete/preferences,
/profile/edit, /profile/growth, /profile/notification-settings,
/profile/payments, /profile/preferences, /profile/subscription
```

**모바일 사용자 시나리오**: 더보기 → "내 활동" → "보관함" 진입 → **돌아갈 길 없음** (햄버거 다시 열어야 함)

#### G-2. /organizations/* — 4 페이지 모두 백버튼 없음

```
/organizations, /organizations/[slug], /organizations/[slug]/series/[seriesSlug], /organizations/apply
```

#### G-3. /courts/* — 5 페이지 백버튼 없음

```
/courts, /courts/[id]/booking, /courts/[id]/booking/payment-fail,
/courts/[id]/checkin, /courts/[id]/manage
```

코트 예약 흐름 중 결제 실패 → 백버튼 없음 → 사용자 갇힘.

### 7-3. 표준 백버튼 패턴 (제안)

```tsx
// src/components/shared/page-back-button.tsx (신규)
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface PageBackButtonProps {
  /** 모바일에서만 노출. 데스크톱은 breadcrumb 또는 사이드바 nav 가 대체 */
  fallbackHref?: string;  // router.back() 안 되면 Link 로 fallback
  label?: string;          // 기본 "뒤로"
}

export function PageBackButton({ fallbackHref = "/", label = "뒤로" }: PageBackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else window.location.href = fallbackHref;
      }}
      className="lg:hidden flex items-center gap-1 text-sm text-[var(--ink-mute)] mb-3 -ml-1 px-2 py-2 rounded hover:bg-[var(--bg-alt)]"
      aria-label={label}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
      <span>{label}</span>
    </button>
  );
}
```

**적용 패턴**:
```tsx
// 각 페이지 상단 (page.tsx 또는 client wrapper)
<div className="page">
  <PageBackButton fallbackHref="/profile" />
  <h1>설정</h1>
  ...
</div>
```

### 7-4. 일괄 적용 우선순위

```
P0 (대회 직전, 1.5h):
1. PageBackButton 컴포넌트 신규 (15분)
2. /profile/* 12 페이지 일괄 적용 (45분)
3. /organizations/* 4 페이지 일괄 적용 (15분)
4. /courts/* 5 페이지 일괄 적용 (15분)

P1 (대회 후):
5. /games/* 4 페이지
6. /teams/* 4 페이지
7. /tournaments/* 2 페이지
8. /users/[id] 1 페이지
```

대회 직전엔 G-1, G-2, G-3 만 처리 (총 21 페이지 + 컴포넌트 1개 = 1.5h).

---

## 8. 🔴 H. 커뮤니티 모바일 탭 회귀 (1h, 사용자 보고)

> 사용자 보고: "커뮤니티의 경우 디자인 시스템 적용 이전에는 모바일에서 탭으로 표시하던 부분이 사라졌다"

### 8-1. 회귀 정체

**현재 구조 (v2 박제 후)**:
```
/community 페이지
├── (lg+ 데스크톱) .with-aside 2-col grid
│   ├── 좌: <CommunityAside> 8 카테고리 그룹 트리 (메인/플레이/이야기)
│   └── 우: <CommunityContent> board 테이블
└── (모바일 ≤900px) globals.css:474, 1211 룰
    └── .with-aside { grid-template-columns: 1fr } → 1열 stack
        └── 결과: <CommunityAside> 8 카테고리가 본문 위로 세로 stack
            → 사용자가 본문 도달까지 8 카테고리 + 2 구분선 + 3 그룹 헤더 스크롤
```

**사용자 의도 (v2 박제 이전 옛 디자인)**:
```
모바일에서 카테고리를 가로 스크롤 탭으로 표시 (board-tabs 같은 패턴)
→ 본문 즉시 노출
```

### 8-2. 영향 범위

| 페이지 | 회귀 영향 |
|--------|---------|
| `/community` | 🔴 본문 도달까지 8 카테고리 세로 stack |
| `/community/[id]` | 🔴 동일 (사이드바 우선 노출) |
| `/community/[id]/edit` | 🔴 동일 |
| `/community/new` | 🔴 동일 |

### 8-3. 해결 옵션

#### 옵션 A — 모바일 가로 스크롤 탭 (권장)

`CommunityAside` 자체에 모바일 분기:
```tsx
// CommunityAside.tsx (수정)
return (
  <>
    {/* 모바일: 가로 스크롤 탭 */}
    <div className="aside-mobile-tabs lg:hidden">
      {BOARDS.map(b => (
        <button
          key={b.id ?? "all"}
          onClick={() => onSelect(b.id)}
          className={`aside-mobile-tab ${activeCategory === b.id ? "active" : ""}`}
        >
          {b.name}
        </button>
      ))}
    </div>

    {/* 데스크톱: 기존 사이드바 */}
    <aside className="aside hidden lg:block">
      ...기존 코드 유지...
    </aside>
  </>
);
```

`globals.css` 추가:
```css
.aside-mobile-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px var(--gutter);
  margin: 0 calc(-1 * var(--gutter)) 12px;
  border-bottom: 1px solid var(--border);
  scrollbar-width: none;
}
.aside-mobile-tabs::-webkit-scrollbar { display: none; }
.aside-mobile-tab {
  flex: 0 0 auto;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--ink-mute);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.aside-mobile-tab.active {
  background: var(--accent);
  color: var(--on-accent, #fff);
  border-color: var(--accent);
}
.aside-mobile-tab:hover { background: var(--bg-alt); }
.aside-mobile-tab.active:hover { background: var(--accent-hover, var(--accent)); }
```

⚠️ **사용자 결정 §2-3 룰 준수**: pill 9999px 금지가 버튼/입력 표준이지만, **카테고리 칩** 은 예외 (시안 v2 의 chip 패턴). 단 PM 확인 후 4px 적용도 가능.

#### 옵션 B — 사이드바 collapse + 햄버거

모바일에서 사이드바를 hidden + 헤더에 "📂 카테고리" 햄버거 버튼 → 클릭 시 drawer 오픈.

→ 옵션 A 가 더 자연스러움 (탭은 1-tap, drawer 는 2-tap).

#### 옵션 C — `with-aside` 룰 변경 안 하고 그대로

→ 사용자 회귀 보고와 충돌. 기각.

### 8-4. 권장: 옵션 A (가로 스크롤 탭)

작업 시간: 30분 (CommunityAside 수정) + 30분 (globals.css 룰 추가) = 1h.

---

## 9. 우선순위 + CLI 프롬프트 (대회 직전)

### 🔴 P0 — 주말 전 6.5h (사용자 보고 추가 반영)

총 5 프롬프트 (프롬프트 4, 5 신규 추가):

| # | 작업 | 시간 |
|---|------|------|
| 프롬프트 1 | A 가입 흐름 + C 대회 참가 흐름 | 1.5h |
| 프롬프트 2 | B 폼 placeholder 정리 8건 | 2h |
| 프롬프트 3 | D-3 (web) 404 + E 모바일 검증 | 30분 |
| **프롬프트 4 (신규)** | **G 백버튼 컴포넌트 + 21 페이지 일괄** | **1.5h** |
| **프롬프트 5 (신규)** | **H 커뮤니티 모바일 탭 회귀 픽스** | **1h** |

**프롬프트 1 — A 가입 흐름 + C 대회 참가 흐름 (1.5h)**

```text
"오늘 작업 시작하자" 체크리스트 통과 후 다음 작업 시작.

# 목표
대회 직전 가입 흐름 + 대회 참가 흐름 미세 끊김 픽스.

# 근거
Dev/design/pre-tournament-polish-2026-04-30.md §1, §3

# 작업

[A-1] PM 결정 — verify 자동 redirect 정책
- 옵션 A: 현재 /onboarding/setup 유지 + /profile/complete 는 /profile 배너만 진입
- 옵션 B: verify → /profile/complete (압축 4스텝) → /onboarding/setup 2 단계
- 옵션 A 선택 시 변경 0건. 옵션 B 선택 시 v2.2 P0-4 박제 시 적용.

[A-2] /onboarding/setup 마지막 단계 CTA 추가 (옵션 A 시)
- src/app/(web)/onboarding/setup/_components/setup-form.tsx
- 마지막 step 완료 후 "프로필 추가 완성하기 →" /profile/complete CTA 1줄 추가

[C-1] /tournaments/[id]/join success 화면 CTA 추가
- src/app/(web)/tournaments/[id]/join/page.tsx
- success 분기에 <Link href="/games/my-games?tab=tournament">내 신청 내역 →</Link> 1줄 추가

[C-2] /pricing/checkout 401 redirect 보존
- src/app/(web)/pricing/checkout/page.tsx:117
- AS-IS: router.push("/login")
- TO-BE: 
  const currentUrl = window.location.pathname + window.location.search;
  router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);

# 검증
- 가입 흐름 1회 시각 확인 (signup → verify → onboarding → / )
- 대회 참가 흐름 1회 시각 확인 (tournaments → join → checkout → my-games)

# 커밋 (3개)
- fix(onboarding): 마지막 단계에 프로필 완성 CTA 추가 (대회 직전)
- fix(tournaments): join success 후 내 신청 내역 CTA
- fix(checkout): 401 시 현재 경로로 복귀 redirect 보존
```

**프롬프트 2 — B 폼 입력란 정리 8건 (2h)**

```text
"오늘 작업 시작하자" 체크리스트 통과 후 다음 작업 시작.

# 목표
사용자 직접 요청 — 프로필/가입/팀생성/글쓰기의 placeholder + helper text 13건 중 핵심 8건 정리. 모바일 시각 밀도 향상.

# 근거
Dev/design/pre-tournament-polish-2026-04-30.md §2

# 처리 룰

✅ DO
- placeholder = 5단어 이내, "예: " 제거
- 형식 제약은 HTML 속성 (minLength/maxLength/pattern/type) 으로
- 라벨은 필드명만 (* 필수 표시 OK)
- sub/helper 는 페이지 섹션 헤더에 1회만

❌ DON'T
- placeholder + sub + helper 3줄 동시
- 같은 형식 중복
- 자명한 설명 반복

# 작업 8건 일괄

각 변경 단위 커밋 X — 8건 묶어서 1 커밋 ("fix(forms): placeholder/helper 정리 8건 (대회 직전)")

[B-1] profile/edit/page.tsx:465 닉네임
- label="닉네임 *" → "닉네임 *" 유지
- sub="커뮤니티에 표시되는 이름" → 제거
- placeholder="표시될 이름" → "2~20자"

[B-2] profile/edit/page.tsx:475 이름(실명)
- label="이름 (실명)" → "이름 *"
- sub="비공개 · 대회 등록 시 확인용" → 제거 (privacy 탭에서 일괄)
- placeholder="홍길동" 유지

[B-3] profile/edit/page.tsx:501 휴대폰
- sub="대회 연락용" → 제거
- placeholder="01012345678" 유지

[B-4] profile/edit/page.tsx:572 신장
- placeholder="예: 180" → "180"

[B-5] profile/edit/page.tsx:585 체중
- label="체중 (kg)" → "체중"
- sub="비공개" → 제거
- placeholder="예: 75" → "75"

[B-6] teams/new/_v2/step-basic.tsx:65 팀 이름
- placeholder="예: REDEEM, 3POINT, 몽키즈" → "REDEEM"
- helper="한글·영문 2~20자" → "2~20자"

[B-7] community/new/page.tsx:148 제목
- placeholder="제목을 입력하세요 (최대 80자)" → "제목"
- maxLength={80} 속성 보존

[B-8] profile/complete/page.tsx:337 닉네임
- placeholder="닉네임 (2~20자)" → "닉네임"
- minLength/maxLength 보존

# 검증
- tsc --noEmit 통과
- 모바일 390x844 시각 — 각 폼 1회 확인
- 입력 필드 라벨 / placeholder / 글자수 카운터 정상

# 커밋
- fix(forms): placeholder/helper 정리 8건 (대회 직전 사용성)

근거: Dev/design/pre-tournament-polish-2026-04-30.md §2
```

**프롬프트 3 — D-3 (web) 404 페이지 + E 모바일 첫인상 검증 (30분)**

```text
"오늘 작업 시작하자" 체크리스트 통과 후 다음 작업 시작.

# 목표
(1) (web) 영역 전용 not-found.tsx 신규 (모바일 친화 + 농구 톤)
(2) 모바일 첫인상 10 라우트 시각 검증

# 근거
Dev/design/pre-tournament-polish-2026-04-30.md §4 D-3, §5

# 작업 (1) — (web)/not-found.tsx 신규

src/app/(web)/not-found.tsx 작성:
- BDR Red Material Symbol 큰 아이콘 (sports_basketball)
- h1 "페이지를 찾을 수 없어요"
- p "URL 이 바뀌었거나 삭제됐을 수 있어요."
- <Link href="/">홈으로</Link> + <button onClick={router.back}>뒤로 가기</button>
- 모바일 친화 (page 셸 + max-w-screen-md + center)

# 작업 (2) — 모바일 첫인상 10 라우트 검증

Chrome DevTools 모바일 390x844 (또는 iPhone SE 320x568) 으로:
1. / (비로그인 + 로그인)
2. /signup
3. /verify
4. /onboarding/setup
5. /tournaments
6. /tournaments/[id] (테스트 대회 1개)
7. /tournaments/[id]/join
8. /pricing/checkout
9. /games/my-games
10. /존재안하는라우트 (404 화면 검증)

각 라우트 체크포인트:
- ✅ 가로 스크롤 0
- ✅ 글자 단위 줄바꿈 0
- ✅ 헤더 정상 (utility/main/tabs)
- ✅ 폼 input 16px (iOS 자동 줌 X)
- ✅ 버튼 44px 터치 타겟

발견 위치 1줄 보고: "🚨 /signup step 2 — 라벨이 입력란을 가림 (line N)"

# 커밋
- feat(404): (web) 영역 전용 not-found 페이지 + 농구 톤
- (검증 결과는 문서로 보고, 별도 커밋 X)
```

**프롬프트 4 — G 백버튼 컴포넌트 + 21 페이지 일괄 (1.5h, 사용자 보고)**

```text
"오늘 작업 시작하자" 체크리스트 통과 후 다음 작업 시작.

# 목표
사용자 보고 — "프로필 영역 등에서 진입 후 뒤로 나가는 버튼이 없음".
PageBackButton 컴포넌트 신규 + 우선 P0 대상 21 페이지에 일괄 적용 (모바일에서만 노출).

# 근거
Dev/design/pre-tournament-polish-2026-04-30.md §7 (G)

# 작업 1 — PageBackButton 컴포넌트 신규 (15분)

src/components/shared/page-back-button.tsx 작성:

```tsx
"use client";
import { useRouter } from "next/navigation";

interface Props {
  fallbackHref?: string;
  label?: string;
}

export function PageBackButton({ fallbackHref = "/", label = "뒤로" }: Props) {
  const router = useRouter();
  const handleClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      window.location.href = fallbackHref;
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="lg:hidden flex items-center gap-1 text-sm text-[var(--ink-mute)] mb-3 -ml-1 px-2 py-2 rounded hover:bg-[var(--bg-alt)] transition-colors"
      aria-label={label}
      style={{ minHeight: 44 }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
      <span>{label}</span>
    </button>
  );
}
```

# 작업 2 — /profile/* 12 페이지 일괄 적용 (45분)

대상 페이지 (모두 page.tsx 또는 client wrapper 의 .page 셸 안 첫 줄에 추가):

[fallbackHref="/profile" 권장 — /profile 의 본인 프로필이 자연스러운 상위]
- src/app/(web)/profile/page.tsx          (fallbackHref="/")
- src/app/(web)/profile/achievements/page.tsx
- src/app/(web)/profile/activity/page.tsx
- src/app/(web)/profile/billing/page.tsx
- src/app/(web)/profile/bookings/page.tsx
- src/app/(web)/profile/complete/page.tsx (fallbackHref="/")
- src/app/(web)/profile/complete/preferences/page.tsx (fallbackHref="/profile/complete")
- src/app/(web)/profile/edit/page.tsx
- src/app/(web)/profile/growth/page.tsx
- src/app/(web)/profile/notification-settings/page.tsx (이미 있으면 검수만)
- src/app/(web)/profile/payments/page.tsx
- src/app/(web)/profile/preferences/page.tsx
- src/app/(web)/profile/subscription/page.tsx

각 페이지의 .page 셸 안 첫 줄에:
```tsx
import { PageBackButton } from "@/components/shared/page-back-button";

<div className="page">
  <PageBackButton fallbackHref="/profile" />
  ...
</div>
```

# 작업 3 — /organizations/* 4 페이지 + /courts/* 5 페이지 (30분)

[/organizations/*]
- src/app/(web)/organizations/page.tsx (fallbackHref="/")
- src/app/(web)/organizations/[slug]/page.tsx (fallbackHref="/organizations")
- src/app/(web)/organizations/[slug]/series/[seriesSlug]/page.tsx (fallbackHref="/organizations/[slug]")
- src/app/(web)/organizations/apply/page.tsx (fallbackHref="/organizations")

[/courts/* — 백버튼 부재 5건]
- src/app/(web)/courts/page.tsx (fallbackHref="/")
- src/app/(web)/courts/[id]/booking/page.tsx (fallbackHref="/courts/[id]")
- src/app/(web)/courts/[id]/booking/payment-fail/page.tsx (fallbackHref="/courts/[id]/booking")
- src/app/(web)/courts/[id]/checkin/page.tsx (fallbackHref="/courts/[id]")
- src/app/(web)/courts/[id]/manage/page.tsx (fallbackHref="/courts/[id]")

# 검증
- npm run typecheck (0 에러)
- 모바일 390x844: 21 페이지 각각 좌상단에 "← 뒤로" 노출 확인
- 데스크톱 1024px+: 모든 페이지에 백버튼 hidden (lg:hidden 룰)
- 클릭 동작: 직진 진입 (history.length === 1) → fallbackHref / 정상 → router.back()

# 커밋 (4 단위 분리)
1. feat(shared): PageBackButton 컴포넌트 신규 (모바일 백버튼 표준)
2. fix(profile): 12 페이지 PageBackButton 일괄 적용 (G-1)
3. fix(organizations): 4 페이지 PageBackButton 일괄 적용 (G-2)
4. fix(courts): 5 페이지 PageBackButton 일괄 적용 (G-3)

근거: Dev/design/pre-tournament-polish-2026-04-30.md §7

# 주의
- 데스크톱은 사이드바/breadcrumb 가 대체 → lg:hidden 으로 모바일에만 노출
- min-height: 44px 터치 타겟 (사용자 결정 §2-7)
- arrow_back Material Symbols (lucide-react 금지)
- 기존 페이지의 router.back() 사용처는 그대로 유지 (PageBackButton 추가만)
```

**프롬프트 5 — H 커뮤니티 모바일 탭 회귀 픽스 (1h, 사용자 보고)**

```text
"오늘 작업 시작하자" 체크리스트 통과 후 다음 작업 시작.

# 목표
사용자 보고 — "디자인 시스템 적용 이전에는 모바일에서 탭으로 표시하던 부분이 사라졌다".
모바일 커뮤니티 카테고리를 가로 스크롤 탭으로 복원 + 데스크톱 사이드바 보존.

# 근거
Dev/design/pre-tournament-polish-2026-04-30.md §8 (H)

# 작업 1 — CommunityAside.tsx 모바일 분기 추가 (30분)

파일: src/app/(web)/community/_components/community-aside.tsx

기존 구조:
- <aside className="aside"> 안에 BOARDS 8개 그룹별 표시

수정:
```tsx
return (
  <>
    {/* 모바일: 가로 스크롤 탭 (lg 미만) — 사용자 보고 회귀 픽스 */}
    <div className="aside-mobile-tabs lg:hidden">
      {BOARDS.map(b => (
        <button
          key={b.id ?? "all"}
          type="button"
          onClick={() => onSelect(b.id)}
          className={`aside-mobile-tab ${activeCategory === b.id ? "active" : ""}`}
        >
          {b.name}
        </button>
      ))}
    </div>

    {/* 데스크톱: 기존 사이드바 — lg+ 만 노출 */}
    <aside className="aside hidden lg:block">
      {/* 기존 코드 그대로 유지 */}
    </aside>
  </>
);
```

# 작업 2 — globals.css 룰 추가 (15분)

src/app/globals.css 의 적절한 위치 (모바일 미디어쿼리 또는 base 룰):

```css
/* 커뮤니티 모바일 카테고리 탭 — 사용자 회귀 픽스 (BDR v2.x → v2.x.1) */
.aside-mobile-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px var(--gutter);
  margin: 0 calc(-1 * var(--gutter)) 12px;
  border-bottom: 1px solid var(--border);
  scrollbar-width: none;
}
.aside-mobile-tabs::-webkit-scrollbar { display: none; }

.aside-mobile-tab {
  flex: 0 0 auto;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--ink-mute);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  min-height: 36px;
}
.aside-mobile-tab.active {
  background: var(--accent);
  color: var(--on-accent, #fff);
  border-color: var(--accent);
}
.aside-mobile-tab:hover { background: var(--bg-alt); }
.aside-mobile-tab.active:hover { background: var(--accent-hover, var(--accent)); }
```

⚠️ 사용자 결정 §2-3 준수: border-radius 4px (pill 9999px 금지).

# 검증
- 모바일 390x844: /community 진입 시 본문 위에 가로 스크롤 탭 8개 노출
- 가로 스크롤로 모든 카테고리 탐색 가능
- 활성 카테고리는 BDR Red 배경 + 흰 글씨
- 데스크톱 1024px+: 좌측 사이드바 그대로
- /community/[id], /community/new, /community/[id]/edit 도 동일 동작

# 커밋
1. fix(community): 모바일 카테고리 가로 탭 회귀 픽스 (사용자 보고)

근거: Dev/design/pre-tournament-polish-2026-04-30.md §8

# 주의
- 데스크톱 사이드바 코드 0 변경 (그대로 유지)
- 모바일에서 사이드바의 "글쓰기" 버튼은 헤더 더보기 메뉴의 "글 작성" 으로 대체 (이미 등록됨, more-groups.ts 검증)
- 카테고리 탭은 4px border-radius (사용자 결정 §2-3 pill 금지)
```

### 🟠 P1 — 대회 후 (4-5시간)

- D-1 EmptyState 표준 컴포넌트 + 15+ 파일 점진 적용
- D-2 Skeleton 표준 컴포넌트 + 20+ loading.tsx 점진 적용
- E 모바일 검증 결과 픽스 (있을 경우)
- F UI 미세 통일성 (rounded-full 5곳, 하드코딩 hex 25건)

### 🟢 P2 — 백로그 (대회 + v2.2 박제 후)

- v2.2 박제 잔여 페이지 (D등급 11개 → 박제 진행 중)
- DataTableV2 적용 확장 (rankings/safety/pricing)
- 시안 외 자체 영역 (admin/referee/tournament-admin) 토큰 일치 검수

---

## 8. 대회 직전 일정 권장 (v2.2 박제 완료 후 이어서)

> 사용자 결정: 현재 진행 중인 v2.2 박제 작업 마치고 이어서 P0 진행.

```
[지금 ~ 목요일]
└─ v2.2 박제 11 페이지 (CLI 진행 중)

[금요일 (오늘 이후 1-2일)]
└─ P0 작업 6.5시간 (사용자 보고 G+H 추가):
   ├─ 프롬프트 1 (A+C 1.5h): PM 결정 + 가입/대회 흐름
   ├─ 프롬프트 2 (B 2h): 폼 정리 8건
   ├─ 프롬프트 3 (D-3+E 30분): 404 + 모바일 검증
   ├─ 프롬프트 4 (G 1.5h): 백버튼 컴포넌트 + 21 페이지 일괄  ← 사용자 보고
   └─ 프롬프트 5 (H 1h): 커뮤니티 모바일 탭 회귀 픽스        ← 사용자 보고

[금요일 저녁]
└─ subin → dev → main 머지 + Vercel 배포 + 실 사용자 테스트

[토요일 (대회 시작)]
└─ 모바일 모니터링 + 에러 트래킹 + 즉시 핫픽스 대기

[월요일 이후]
└─ P1 작업 (D, E, F + 백버튼 잔여 11 페이지)
```

---

## 9. 대회 직전 위험 점검 체크리스트

대회 시작 전 1회 확인:

```
□ 가입 흐름 1회 끝까지 동작 (signup → verify → onboarding → 첫 액션)
□ 카카오 OAuth 로그인 정상
□ 토너먼트 신청 + 결제 1회 성공
□ /games/my-games 의 대회 탭 노출
□ 모바일 가로 스크롤 0 (10 라우트)
□ 모든 폼 input 16px (iOS 자동 줌 X)
□ 헤더 utility bar 우측 (계정/설정/로그아웃) 표시
□ 다크모드 토글 동작
□ Vercel 배포 성공 (개발 → 운영)
□ Sentry / 에러 모니터링 활성
□ 운영 DB Phase 10 SQL 적용 완료 (이미 완료)
□ Vercel cron 5개 활성 (이미 완료)
```

---

## 10. KPI (대회 직전 작업 후)

| 지표 | 현재 | 목표 |
|------|------|------|
| 폼 placeholder 5단어 초과 | 13 | 5 이하 (B 8건 처리) |
| 모바일 가로 스크롤 위반 | 알 수 없음 | 0 (E 검증) |
| (web) 404 페이지 모바일 친화 | ❌ | ✅ |
| 가입 흐름 자연스러움 | 검증 안 됨 | ✅ |
| 대회 참가 흐름 자연스러움 | 검증 안 됨 | ✅ |
| **백버튼 있는 페이지** | 15 / 47 (32%) | **36 / 47 (77%)** — 21 페이지 추가 |
| **커뮤니티 모바일 탭 회귀** | ❌ 사이드바가 본문 위 stack | **✅ 가로 스크롤 탭** |

---

## 부록 A — 검증된 사실

| 주장 | 근거 |
|------|------|
| verify → /onboarding/setup 자동 redirect | `src/app/(web)/verify/page.tsx:101-103` |
| /profile/complete 는 More 메뉴 / 마이페이지에서 진입 | `verify/page.tsx:102` 코멘트 |
| 폼 placeholder/helper 13건 발견 | Explore agent 분석 결과 |
| loading.tsx 20개 / 빈 상태 자체 구현 15+ | `find loading.tsx` + `grep "EmptyState\|empty"` |
| (web) 404 페이지 부재 | `find not-found.tsx` 1개 (루트만) |
| /tournaments/[id]/join → /pricing/checkout 라우팅 | `tournaments/[id]/join/page.tsx:485` 등 |
| /pricing/checkout 401 처리 | `pricing/checkout/page.tsx:117` |
| **G — /profile/* 16 페이지 중 4 만 백버튼** | grep "router\.back\|arrow_back\|chevron_left" — 4 매칭 |
| **G — 47 페이지 중 32 백버튼 부재 (68%)** | profile 12 + organizations 4 + courts 5 + games 4 + teams 4 + tournaments 2 + users 1 |
| **H — CommunityAside 가 lg:block 모바일 분기 없음** | `community-aside.tsx` 의 `<aside className="aside">` 단일 — 모바일에서 with-aside 1열 stack 으로 본문 위에 노출 |
| **H — globals.css `.with-aside` 모바일 1열** | `globals.css:474, 1211` — grid-template-columns: 1fr |

## 부록 B — 외부 참조

- v2.2 박제 (CLI 진행 중): [v2.2-cli-batch-prompt-2026-04-30.md](./v2.2-cli-batch-prompt-2026-04-30.md)
- 사용자 결정 영구 보존: [user-design-decisions-2026-04-30.md](./user-design-decisions-2026-04-30.md)
- 이전 UI 일관성 감사: [ui-consistency-audit-2026-04-29.md](./ui-consistency-audit-2026-04-29.md)
- 유령 기능 분석: [ghost-features-and-breakage-2026-04-29.md](./ghost-features-and-breakage-2026-04-29.md)
