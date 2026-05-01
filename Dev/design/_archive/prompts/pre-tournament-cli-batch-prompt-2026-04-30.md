# 대회 직전 폴리시 CLI 일괄 위임 프롬프트 — 2026-04-30

> **사용법**: 아래 § "프롬프트 (복사 시작)" ~ § "프롬프트 (복사 끝)" 통째로 복사해서 클로드 CLI 새 세션에 붙여넣기.
> **사전 조건**: v2.2 박제 (16 커밋, HEAD `1df88a7`) + main 머지 + Vercel 배포 완료
> **총 작업량**: 5 단계 일괄 = **6.5시간 / 1 작업일**
> **주말 대회 시급**: 🔴 금요일 저녁 전 머지 + 배포 완료 권장

---

## 분할 실행 옵션

| 옵션 | 단계 | 견적 | 권장 플랜 |
|------|------|------|---------|
| **A — 한 세션 일괄 (권장)** | Step 1~6 전체 | 6.5h | Max Expanded 가능 |
| B — 사용자 보고 우선 | Step 4 (G) + Step 5 (H) 만 | 2.5h | 사용자 직접 보고 2건만 |
| C — 1 단계씩 5 세션 | 각 단계 별 | 30분~2h | Pro 플랜 가능 |

---

## 프롬프트 (복사 시작)

# BDR 대회 직전 폴리시 일괄 위임 — Phase 12

너는 BDR(MyBDR — 농구 매칭 플랫폼) 의 시니어 풀스택 엔지니어다. 이번 주말부터 시작하는 중요한 대회 + 실 사용자 가입 진행 중 → 대회 직전 사용성/UI 통일성/자연스러운 흐름 확보가 핵심. 5 단계 일괄 작업 진행.

---

## 0. 사전 준비 (필수)

### 0-1. "오늘 작업 시작하자" 체크리스트

```bash
cd "C:\0. Programing\mybdr"

git remote -v                    # github.com/bdr-tech/mybdr
git fetch origin --prune
git branch --show-current        # subin 인지 확인
git log --oneline -5             # HEAD 1df88a7 (v2.2 박제 완료) 가까이여야 함
git status --short              # .claude/* 외에 src/ modified 없는지

# 운영 DB 보호
grep "DATABASE_URL" .env | grep -i "dev\|local"  # 개발 DB여야 함
ls .env.local                    # localhost:3001 오버라이드
```

이 결과를 PM 에게 1줄 보고 후 진행 OK 받기. **승인 전 파일 수정 금지**.

### 0-2. 핵심 보호 룰 (이번 작업 전체 적용)

출처: `Dev/design/user-design-decisions-2026-04-30.md` + `Dev/design/pre-tournament-polish-2026-04-30.md`

**룰 1 — AppNav 유지**: 글로벌 헤더 단일화. 페이지 별도 nav 추가 금지. utility bar 우측(계정/설정/로그아웃) 모바일에서도 표시. 다크모드 하이브리드 토글 (PC 두 라벨 / 모바일 단일 아이콘).

**룰 2 — 더보기 5그룹 IA 보존**: 가짜링크 4건 (gameResult/gameReport/guestApps/referee) 추가 금지. refereeInfo (P3-1 신규) 그대로.

**룰 3 — 팀 페이지**: 팀 카드 목록에 레이팅/승/패/매치신청 노출 금지. 팀 상세 hero 레이팅 stat 노출 금지. 팀 생성 4스텝 + 홈/어웨이 색상 분리 + 자유 컬러피커 + 로고 업로드 기본.

**룰 4 — 프로필 settings 이모지 아이콘**: 👤🏀🔔🔒💳⚠️ 유지 (Material Symbols 로 되돌리지 말 것).

**룰 5 — 글로벌 카피**: "전국 농구 매칭 플랫폼" 슬로건. "서울 3x3 한정" 표현 금지.

**룰 6 — 모바일**: 720px 통일. iOS input 16px. 버튼 44px 터치 타겟. 인라인 grid `repeat(N, 1fr)` 추가 시 720px 분기 필수.

**룰 7 — DB 미지원**: UI 자리 + "준비 중" + scratchpad 추후 구현 큐. alert("준비 중") 추가 시 라우트 존재 검증 (있으면 Link 사용).

**룰 8 — 디자인 토큰**: 하드코딩 hex 금지 → `var(--color-*)`. lucide-react 금지 → Material Symbols. 버튼 4px (pill 9999px 금지). 핑크/살몬/코랄 금지.

**룰 9 — main 직접 push 금지** (이번 작업): subin 브랜치 진행 → dev PR → 원영(PM) 이 main 머지.

### 0-3. 5 단계 진행 순서

```
Step 1 (1.5h) — 가입 흐름 + 대회 참가 흐름 (사용자 임팩트 큼)
Step 2 (2h)   — 폼 placeholder 정리 8건 (사용자 직접 요청)
Step 3 (30m)  — (web) 404 + 모바일 검증
Step 4 (1.5h) — 백버튼 컴포넌트 + 21 페이지 일괄 (사용자 보고)
Step 5 (1h)   — 커뮤니티 모바일 탭 회귀 픽스 (사용자 보고)
Step 6 (30m)  — 통합 검증 + subin push + dev PR
```

각 Step 완료 시 PM 에게 1줄 보고 후 다음 Step 진행:
```
✅ Step N — <작업명> 완료. 커밋 X건 (예: <hash> <subject>). 다음 Step 진행 OK?
```

---

## 1. Step 1 — A 가입 흐름 + C 대회 참가 흐름 (1.5h)

### 1-1. A-1: PM 결정 (이미 완료 가능성 — 검증)

v2.2 박제 작업에서 verify → /profile/complete 자동 redirect 가 이미 추가됨 (커밋 `77b94e3` "feat(verify): 신규 가입자 /profile/complete 자동 redirect"). 즉 옵션 B 채택됨.

검증:
```bash
grep -n "profile/complete\|profile_completed\|onboarded_at" src/app/\(web\)/verify/page.tsx | head -10
# → "/profile/complete" router.push 라인이 있어야 함
```

확인되면 A-1 추가 작업 0. 없으면 v2.2 박제 시점 코드 검수.

### 1-2. A-2: /onboarding/setup 마지막 단계 CTA 강화

```bash
# 현재 위저드 마지막 step 동작 확인
grep -n "router\.push\|setRoute\|complete\|마지막\|완료" src/app/\(web\)/onboarding/setup/_components/setup-form.tsx | head -10
```

마지막 step 완료 후 다음 중 1택:
- **A**: "프로필 추가 완성하기 →" → `/profile/complete` (선택, 이미 건너뛰었으면 표시 안 함)
- **B**: 바로 "/" (홈) 으로 (현재 흐름 유지)

PM 결정 후 작업.

### 1-3. C-1: /tournaments/[id]/join success → "내 신청 내역" CTA

파일: `src/app/(web)/tournaments/[id]/join/page.tsx`

success 분기 (`submitted === true` 등) 에 다음 추가:
```tsx
<Link
  href="/games/my-games?tab=tournament"
  className="btn btn--primary"
  style={{ minWidth: 200 }}
>
  내 신청 내역 보기 →
</Link>
```

기존 "/" 또는 `/tournaments` 복귀 버튼은 유지 (보조 액션).

### 1-4. C-2: /pricing/checkout 401 redirect 보존

파일: `src/app/(web)/pricing/checkout/page.tsx:117`

AS-IS:
```tsx
if (!meRes.ok) { router.push("/login"); return; }
```

TO-BE:
```tsx
if (!meRes.ok) {
  const currentUrl = typeof window !== 'undefined'
    ? window.location.pathname + window.location.search
    : '/pricing/checkout';
  router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
  return;
}
```

`/login` 페이지가 `?redirect=` 쿼리를 받아서 로그인 후 자동 복귀하는지 확인. 미지원이면 phase-9-future-features 큐에 추가하고 단순 redirect 만 유지.

### 1-5. Step 1 검증 + 커밋

```bash
npm run typecheck 2>&1 | tail -5

# 커밋 (1-3 단위 분리)
git add src/app/\(web\)/onboarding/setup/_components/setup-form.tsx
git commit -m "feat(onboarding): 마지막 단계 프로필 완성 CTA 추가 (대회 직전 §A-2)"

git add src/app/\(web\)/tournaments/\[id\]/join/page.tsx
git commit -m "feat(tournaments): join success 후 내 신청 내역 CTA 추가 (§C-1)"

git add src/app/\(web\)/pricing/checkout/page.tsx
git commit -m "fix(checkout): 401 시 현재 경로로 복귀 redirect 보존 (§C-2)"
```

### 1-6. Step 1 보고

```
✅ Step 1 — 가입+대회 흐름 완료. 3 커밋 (onboarding/tournaments/checkout). Step 2 진행 OK?
```

---

## 2. Step 2 — B 폼 placeholder/helper 정리 8건 (2h)

### 2-1. 처리 룰

```
✅ DO
- placeholder = 5단어 이내, "예: " 제거
- 형식 제약은 HTML 속성 (minLength/maxLength/pattern/type)
- 라벨은 필드명만 (* 필수 OK)
- sub/helper 는 페이지 섹션 헤더에 1회만

❌ DON'T
- placeholder + sub + helper 3줄 동시
- 같은 형식 중복
- 자명한 설명 반복
```

### 2-2. 8 건 일괄 처리 (1 커밋으로 묶기)

#### B-1: profile/edit/page.tsx:465 닉네임
```diff
- <Field label="닉네임 *" sub="커뮤니티에 표시되는 이름">
-   <input placeholder="표시될 이름" ... />
+ <Field label="닉네임 *">
+   <input placeholder="2~20자" ... />
```

#### B-2: profile/edit/page.tsx:475 이름(실명)
```diff
- <Field label="이름 (실명)" sub="비공개 · 대회 등록 시 확인용">
-   <input placeholder="홍길동" ... />
+ <Field label="이름 *">
+   <input placeholder="홍길동" ... />
```
> sub 제거. 비공개 안내는 [공개·계정] 탭의 섹션 헤더에 일괄.

#### B-3: profile/edit/page.tsx:501 휴대폰
```diff
- <Field label="휴대폰" sub="대회 연락용">
-   <input placeholder="01012345678" ... />
+ <Field label="휴대폰">
+   <input placeholder="01012345678" ... />
```

#### B-4: profile/edit/page.tsx:572 신장
```diff
- <input placeholder="예: 180" ... />
+ <input placeholder="180" ... />
```

#### B-5: profile/edit/page.tsx:585 체중
```diff
- <Field label="체중 (kg)" sub="비공개">
-   <input placeholder="예: 75" ... />
+ <Field label="체중">
+   <input placeholder="75" ... />
```

#### B-6: teams/new/_v2/step-basic.tsx:65 팀 이름
```diff
- <input placeholder="예: REDEEM, 3POINT, 몽키즈" ... />
- <small>한글·영문 2~20자</small>
+ <input placeholder="REDEEM" ... />
+ <small>2~20자</small>
```

#### B-7: community/new/page.tsx:148 게시글 제목
```diff
- <input placeholder="제목을 입력하세요 (최대 80자)" maxLength={80} ... />
+ <input placeholder="제목" maxLength={80} ... />
```

#### B-8: profile/complete/page.tsx:337 닉네임
```diff
- <input placeholder="닉네임 (2~20자)" minLength={2} maxLength={20} ... />
+ <input placeholder="닉네임" minLength={2} maxLength={20} ... />
```

### 2-3. Step 2 검증 + 커밋

```bash
npm run typecheck

# 모바일 390x844 시각 — 다음 폼 확인
# /profile/edit (전체 탭 순회)
# /teams/new (4스텝)
# /community/new
# /profile/complete

# 커밋 1건 (8 건 묶음)
git add -A
git commit -m "fix(forms): placeholder/helper 정리 8건 (대회 직전 사용성 §B)

- profile/edit: 닉네임/이름/휴대폰/신장/체중 sub 제거 + '예: ' 제거
- teams/new: 팀 이름 placeholder 단순화
- community/new: 제목 placeholder 단순화 (maxLength 보존)
- profile/complete: 닉네임 placeholder 단순화

근거: Dev/design/pre-tournament-polish-2026-04-30.md §2 / 사용자 직접 요청"
```

### 2-4. Step 2 보고

```
✅ Step 2 — 폼 placeholder 8건 정리 완료. 1 커밋. 모바일 시각 밀도 향상. Step 3 진행 OK?
```

---

## 3. Step 3 — D-3 (web) 404 + E 모바일 검증 (30분)

### 3-1. (web)/not-found.tsx 신규

파일: `src/app/(web)/not-found.tsx` (신규)

```tsx
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="page" style={{ maxWidth: 520, margin: "60px auto", textAlign: "center" }}>
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 72, color: "var(--color-primary)" }}
      >
        sports_basketball
      </span>
      <h1 style={{ margin: "20px 0 12px", fontSize: 24, fontWeight: 800 }}>
        페이지를 찾을 수 없어요
      </h1>
      <p style={{ margin: "0 0 28px", color: "var(--ink-mute)", fontSize: 14, lineHeight: 1.6 }}>
        URL 이 바뀌었거나 삭제됐을 수 있어요.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/" className="btn btn--primary btn--xl">
          홈으로
        </Link>
        <Link href="/games" className="btn btn--xl">
          경기 둘러보기
        </Link>
      </div>
    </div>
  );
}
```

### 3-2. 모바일 첫인상 검증 (10 라우트)

Chrome DevTools 모바일 390x844 (또는 iPhone SE 320x568) 으로 다음 라우트 시각 검증:

```
1. /                    (홈, 비로그인)
2. /                    (홈, 로그인 후)
3. /signup              (3 step 위저드)
4. /verify              (인증)
5. /onboarding/setup    (6 step)
6. /tournaments         (대회 목록)
7. /tournaments/[id]    (대회 상세 5탭)
8. /tournaments/[id]/join (4 step)
9. /pricing/checkout    (결제 폼)
10. /존재안하는라우트     (404 검증)
```

각 라우트 체크포인트:
- ✅ 가로 스크롤 0
- ✅ 글자 단위 줄바꿈 0
- ✅ 헤더 정상 (utility bar 우측 / 검색·알림 박스 X / 다크 토글 단일 아이콘)
- ✅ 폼 input 16px (iOS 자동 줌 X)
- ✅ 버튼 44px

### 3-3. Step 3 커밋 + 검증 보고

```bash
git add src/app/\(web\)/not-found.tsx
git commit -m "feat(404): (web) 영역 전용 not-found 페이지 + 농구 톤 (§D-3)"

# 검증 결과는 보고로만 (커밋 X)
```

### 3-4. Step 3 보고

```
✅ Step 3 — 404 신규 + 모바일 10 라우트 검증 완료. 1 커밋.
검증 결과: <발견 0 또는 발견 N건 위치 보고>
Step 4 진행 OK?
```

---

## 4. Step 4 — G 백버튼 컴포넌트 + 21 페이지 일괄 (1.5h, 사용자 보고)

> 사용자 직접 보고: "프로필 영역 등 진입 후 뒤로 나가는 버튼이 없음"

### 4-1. PageBackButton 컴포넌트 신규 (15분)

파일: `src/components/shared/page-back-button.tsx` (신규)

```tsx
"use client";

import { useRouter } from "next/navigation";

interface Props {
  /** router.back() 안 되면 (history.length === 1) 갈 곳 */
  fallbackHref?: string;
  /** 기본 "뒤로" */
  label?: string;
}

/**
 * PageBackButton — 모바일 전용 뒤로가기 버튼.
 *
 * Why: 사용자 보고 — 프로필 등 깊은 페이지 진입 후 모바일에서 복귀 동선 없음.
 * Pattern: 페이지 셸 첫 줄에 배치. lg+ 데스크톱은 사이드바/breadcrumb가 대체 → hidden.
 * Touch target: min-height 44px (사용자 결정 §2-7).
 */
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

### 4-2. /profile/* 12 페이지 일괄 적용 (45분)

각 페이지의 `<div className="page">` 또는 `.page--wide` 셸 첫 줄에 추가:

```tsx
import { PageBackButton } from "@/components/shared/page-back-button";

<div className="page">
  <PageBackButton fallbackHref="/profile" />
  ...기존 콘텐츠...
</div>
```

대상 12 페이지 (fallbackHref 매핑):
```
src/app/(web)/profile/page.tsx                          fallbackHref="/"
src/app/(web)/profile/achievements/page.tsx             fallbackHref="/profile"
src/app/(web)/profile/activity/page.tsx                 fallbackHref="/profile"
src/app/(web)/profile/billing/page.tsx                  fallbackHref="/profile/settings"
src/app/(web)/profile/bookings/page.tsx                 fallbackHref="/profile"
src/app/(web)/profile/complete/page.tsx                 fallbackHref="/"
src/app/(web)/profile/complete/preferences/page.tsx     fallbackHref="/profile/complete"
src/app/(web)/profile/edit/page.tsx                     fallbackHref="/profile"
src/app/(web)/profile/growth/page.tsx                   fallbackHref="/profile"
src/app/(web)/profile/notification-settings/page.tsx    fallbackHref="/profile/settings"
src/app/(web)/profile/payments/page.tsx                 fallbackHref="/profile/settings"
src/app/(web)/profile/preferences/page.tsx              fallbackHref="/profile/settings"
src/app/(web)/profile/subscription/page.tsx             fallbackHref="/profile/settings"
```

> 13개 listed but 1개 (notification-settings) 는 이미 backbtn 있을 가능성. grep "router\.back\|arrow_back\|chevron_left" 로 검수 후 skip.

### 4-3. /organizations/* 4 페이지 + /courts/* 5 페이지 (30분)

```
src/app/(web)/organizations/page.tsx                    fallbackHref="/"
src/app/(web)/organizations/[slug]/page.tsx             fallbackHref="/organizations"
src/app/(web)/organizations/[slug]/series/[seriesSlug]/page.tsx  fallbackHref="/organizations/[slug]"
src/app/(web)/organizations/apply/page.tsx              fallbackHref="/organizations"

src/app/(web)/courts/page.tsx                           fallbackHref="/"
src/app/(web)/courts/[id]/booking/page.tsx              fallbackHref="/courts/[id]"
src/app/(web)/courts/[id]/booking/payment-fail/page.tsx fallbackHref="/courts/[id]/booking"
src/app/(web)/courts/[id]/checkin/page.tsx              fallbackHref="/courts/[id]"
src/app/(web)/courts/[id]/manage/page.tsx               fallbackHref="/courts/[id]"
```

### 4-4. Step 4 검증 + 커밋

```bash
npm run typecheck

# 모바일 검증
# - 21 페이지 좌상단에 "← 뒤로" 노출 (lg:hidden)
# - 데스크톱 1024px+ 에서 백버튼 hidden
# - 클릭 시: 정상 → router.back(), 직진 진입 → fallbackHref

# 커밋 4 단위 분리
git add src/components/shared/page-back-button.tsx
git commit -m "feat(shared): PageBackButton 컴포넌트 신규 — 모바일 백버튼 표준 (§G)"

git add src/app/\(web\)/profile/
git commit -m "fix(profile): 12 페이지 PageBackButton 일괄 적용 (사용자 보고 §G-1)"

git add src/app/\(web\)/organizations/
git commit -m "fix(organizations): 4 페이지 PageBackButton 일괄 적용 (§G-2)"

git add src/app/\(web\)/courts/
git commit -m "fix(courts): 5 페이지 PageBackButton 일괄 적용 (§G-3)"
```

### 4-5. Step 4 보고

```
✅ Step 4 — 백버튼 일괄 적용 완료. 4 커밋 (컴포넌트 + 21 페이지).
사용자 보고 해소: 모바일 21 페이지에서 ← 뒤로 노출.
Step 5 진행 OK?
```

---

## 5. Step 5 — H 커뮤니티 모바일 탭 회귀 픽스 (1h, 사용자 보고)

> 사용자 직접 보고: "디자인 시스템 적용 이전에는 모바일에서 탭으로 표시하던 부분이 사라졌다"

### 5-1. CommunityAside.tsx 모바일 분기 추가 (30분)

파일: `src/app/(web)/community/_components/community-aside.tsx`

기존 `<aside className="aside">` 만 있는 구조를 다음으로 수정:

```tsx
return (
  <>
    {/* 모바일: 가로 스크롤 탭 (lg 미만) — 사용자 보고 회귀 픽스 */}
    <div className="aside-mobile-tabs lg:hidden">
      {BOARDS.map((b) => (
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
      {/* 기존 코드 그대로 유지 — 글쓰기 버튼 + 그룹 트리 */}
      ...
    </aside>
  </>
);
```

### 5-2. globals.css 룰 추가 (15분)

파일: `src/app/globals.css` 적절한 위치 (커뮤니티 섹션 또는 모바일 미디어 쿼리):

```css
/* ============================================================
   커뮤니티 모바일 카테고리 탭 — 사용자 회귀 픽스 (Phase 12)
   v2 박제 시 사이드바가 본문 위 stack → 모바일 사용자 본문 도달 어려움
   해소: 모바일에서 가로 스크롤 탭 (8 카테고리)
   ============================================================ */

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
.aside-mobile-tabs::-webkit-scrollbar {
  display: none;
}

.aside-mobile-tab {
  flex: 0 0 auto;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 4px;        /* 사용자 결정 §2-3 — pill 9999px 금지 */
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

.aside-mobile-tab:hover {
  background: var(--bg-alt);
}

.aside-mobile-tab.active:hover {
  background: var(--accent-hover, var(--accent));
}
```

### 5-3. Step 5 검증 + 커밋

```bash
npm run typecheck

# 모바일 시각 검증
# - /community 진입 → 본문 위에 가로 스크롤 탭 8개
# - 가로 스크롤로 카테고리 탐색 가능
# - 활성 카테고리 BDR Red 배경 + 흰 글씨
# - 데스크톱 1024px+: 좌측 사이드바 그대로
# - /community/[id], /community/new, /community/[id]/edit 도 동일

# 커밋
git add src/app/\(web\)/community/_components/community-aside.tsx src/app/globals.css
git commit -m "fix(community): 모바일 카테고리 가로 탭 회귀 픽스 (사용자 보고 §H)

데스크톱 사이드바 보존 + 모바일에서만 가로 스크롤 탭 8 카테고리.
border-radius 4px (사용자 결정 §2-3 pill 금지 준수).

근거: Dev/design/pre-tournament-polish-2026-04-30.md §8"
```

### 5-4. Step 5 보고

```
✅ Step 5 — 커뮤니티 모바일 탭 회귀 픽스 완료. 1 커밋.
사용자 보고 해소: 모바일에서 카테고리 가로 탭 노출.
Step 6 (통합 검증 + push) 진행 OK?
```

---

## 6. Step 6 — 통합 검증 + push + PR 생성 (30분)

### 6-1. 전체 검증

```bash
cd "C:\0. Programing\mybdr"

# 1. tsc 무에러
npm run typecheck

# 2. lint
npm run lint

# 3. 디자인 회귀 검사
npm run check:design

# 4. 빌드 통과
npm run build 2>&1 | tail -20

# 5. 커밋 카운트 확인
git log --oneline @{u}..HEAD | wc -l    # 약 10~12 기대
git log --oneline @{u}..HEAD
```

### 6-2. 회귀 자동 검사 (사용자 결정 §2 + 작업 결과)

```bash
# 가짜링크 4건 추가 안 됐는지
grep -rE "id:\s*['\"](guestApps|gameResult|gameReport)['\"]" src/components/bdr-v2/more-groups.ts
# → 0건 기대

# 글로벌 카피 위반
grep -rE "서울 3x3|서울을 중심으로 한 3x3" src/app/\(web\)/
# → 0건 기대

# lucide-react import
grep -rE "from ['\"]lucide-react['\"]" src/
# → 1건만 (personal-hero.tsx, P1-1 별도 작업)

# placeholder "예: " 잔존
grep -rnE 'placeholder=["\047]예: ' src/app/\(web\)/
# → 작업 외 영역만, B-1~B-8 영역은 0 기대

# 백버튼 적용 카운트
grep -rln "PageBackButton" src/app/\(web\)/
# → 21+ 기대

# aside-mobile-tabs CSS 존재
grep -c "aside-mobile-tabs" src/app/globals.css
# → 1+ 기대
```

### 6-3. 모바일 종합 시각 검증 (대표 라우트)

Chrome DevTools 390x844:
- ✅ /community (모바일 가로 탭)
- ✅ /profile (← 뒤로 노출)
- ✅ /profile/edit (폼 placeholder 정리됨)
- ✅ /tournaments/[id]/join 의 success (내 신청 내역 CTA)
- ✅ /존재안하는URL (404 농구 톤)

### 6-4. push + PR

```bash
# subin 브랜치 push
git push origin subin

# GitHub 에서 subin → dev PR 생성
# PR 제목: "feat(polish): 대회 직전 사용성 + 사용자 보고 (Phase 12)"
# PR 설명:
#   ## 변경 요약 (총 X 커밋)
#
#   ### Step 1 — 가입+대회 흐름 (3 커밋)
#   - onboarding 마지막 단계 CTA
#   - /tournaments/[id]/join success 후 내 신청 내역 CTA
#   - /pricing/checkout 401 redirect 보존
#
#   ### Step 2 — 폼 placeholder 정리 (1 커밋, 8건)
#
#   ### Step 3 — (web) 404 + 모바일 검증 (1 커밋)
#
#   ### Step 4 — 백버튼 일괄 (4 커밋, 사용자 보고)
#   - PageBackButton 컴포넌트 신규
#   - /profile/* 12 페이지
#   - /organizations/* 4 페이지
#   - /courts/* 5 페이지
#
#   ### Step 5 — 커뮤니티 모바일 탭 회귀 (1 커밋, 사용자 보고)
#
#   ### 검증 통과
#   - tsc / lint / check:design / build 모두 통과
#   - 사용자 결정 §2 위반 0건 (가짜링크/카피/lucide)
#   - 모바일 5+ 라우트 시각 통과
#
#   ### 시급성
#   주말 대회 직전 사용성 강화 — Vercel 배포 후 즉시 효과
#
#   근거: Dev/design/pre-tournament-polish-2026-04-30.md
```

### 6-5. 작업 로그 갱신

```bash
# .claude/scratchpad.md 작업 로그 1줄 추가
# Dev/design/README.md 의 활성 Phase 12 추가 + 진행 상황
```

### 6-6. 최종 보고

```
✅ Step 6 — 대회 직전 폴리시 일괄 작업 완료.

통계:
- 총 ~10 커밋 / subin → dev PR 생성
- 사용자 직접 보고 2건 해소 (백버튼 + 커뮤니티 모바일 탭)
- 사용자 결정 §2 위반 0건 (자체 검증 통과)
- 가입/대회/결제 흐름 자연스러움 강화
- 폼 placeholder 8건 정리 (모바일 시각 밀도 향상)

다음 단계 (PM):
1. 원영님 dev → main 머지 + Vercel 배포
2. 주말 대회 시작 전 마지막 모바일 시각 검증 1회
3. 토요일 대회 모니터링 + 핫픽스 대기

월요일 이후 백로그:
- P1: D EmptyState/Skeleton 표준화 + F UI 미세 통일성
- P2: B+C 등급 14+9 페이지 A 등급 승격 (대회 후 박제율 100%)
```

---

## 7. 토큰 부족 시 분할 전략

### 옵션 A — 사용자 보고 우선 (Step 4+5 만, 2.5h)
사용자 직접 보고 2건만 처리. 나머지는 다음 세션.

### 옵션 B — 가입+사용자 보고 (Step 1+4+5, 4h)
가입자 영향 큰 흐름 + 사용자 보고 2건.

### 옵션 C — 페이지 단위 분할
한 Step 만 한 세션에 진행.

---

## 8. 위반 시 즉시 중단

다음 발견 시 즉시 작업 중단 + PM 보고:

1. **사용자 결정 §2 위반** — 가짜링크 / 서울 3x3 / 레이팅 / 핑크 등
2. **CLAUDE.md 룰 위반** — main 직접 push / 운영 DB push
3. **백버튼 적용으로 기존 router 동작 회귀** — 기존 `router.back()` 사용처 깨짐
4. **커뮤니티 가로 탭이 데스크톱에 노출** — `lg:hidden` 동작 안 함
5. **tsc 5건+ 누적**

```
🚨 작업 중단 — <위반 항목>
근거: <파일:라인>
조치: A) <옵션> B) <옵션>
PM 결정 대기.
```

---

## 9. 시작 신호

이 프롬프트 받자마자:

```
✅ BDR 대회 직전 폴리시 일괄 위임 확인 완료.

이해한 내용:
- 5 단계 일괄 (Step 1~6, 6.5h)
- 사용자 결정 §2 절대 보존 (9 룰)
- 사용자 직접 보고 2건 (백버튼 + 커뮤니티 모바일 탭) Step 4/5 에 포함
- 분할 가능 — 사용자 보고 우선 Step 4+5 만 (2.5h)

질문 / 가정 (필요 시):
1. (PM 결정 필요 항목)
2. ...

작업 시작: Step 0 사전 점검 → Step 1 가입+대회 흐름.
```

이후 § "0. 사전 준비" 의 체크리스트 명령부터 실행.

---

## 프롬프트 (복사 끝)

---

## 부록 A — 외부 참조

- **상세 보고서**: `Dev/design/pre-tournament-polish-2026-04-30.md`
- **사용자 결정**: `Dev/design/user-design-decisions-2026-04-30.md`
- **CLAUDE.md**: 프로젝트 룰
- **이전 작업 로그**: `.claude/scratchpad.md`
- **v2.2 박제 완료 시점**: HEAD `1df88a7` (refereeInfo 진입점 등록, 2026-04-30 16:28)

## 부록 B — 사용 가이드

1. § "프롬프트 (복사 시작)" ~ § "프롬프트 (복사 끝)" 통째 복사
2. 클로드 CLI 새 세션에 붙여넣기
3. § "9. 시작 신호" 응답 받으면 진행 OK
4. Step 별 PM 보고 받으면 다음 Step 승인
5. 토큰 부족 시 § "7. 분할 전략" 채택

## 부록 C — 견적 요약

| Step | 작업 | 견적 | 사용자 보고? |
|------|------|------|----------|
| 0 | 사전 점검 | 5분 | - |
| 1 | A 가입 + C 대회 흐름 | 1.5h | - |
| 2 | B 폼 placeholder 정리 8건 | 2h | ✅ |
| 3 | D-3 (web) 404 + E 모바일 검증 | 30분 | - |
| 4 | G 백버튼 컴포넌트 + 21 페이지 | 1.5h | ✅ |
| 5 | H 커뮤니티 모바일 탭 회귀 | 1h | ✅ |
| 6 | 통합 검증 + push + PR | 30분 | - |
| **총** | | **6.5h** | **3 항목** |
