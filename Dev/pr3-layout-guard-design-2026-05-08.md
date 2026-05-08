# PR3 — Layout 가드 + Mock 모드 설계 (2026-05-08)

> **목표**: 미인증 사용자가 핵심 페이지 진입 시 → 강제 redirect → `/onboarding/identity`. PortOne 콘솔 채널 / Vercel 환경변수가 외부 작업으로 대기 중인 상황에서, **mock 모드로 코드를 미리 작성 + push** 해두고 환경변수 추가 시점에 즉시 활성화되도록 설계.
>
> **분량**: 0.5d (코드 ≈ 200 라인 이내, 신규 파일 1~2개)
> **위치**: planner-architect 단계 — 코드 변경 0 / 본 문서로 PM 결재 후 developer 진입.

---

## 1. 현황 요약 (PR1~PR5 결과)

| PR | 영역 | 핵심 산출물 | Commit |
|---|---|---|---|
| PR1.1+1.2 | 본인인증 진입 | `/onboarding/identity` 페이지 + `IdentityStep` 클라 컴포넌트 + me API `name_verified` 노출 | `c9fe34b` |
| PR1.3 | settings 단일 진입점 | profile/settings 의 본인인증 진입을 `/onboarding/identity` 로 통합 | `49698c0` |
| PR1.5.a | 서버 4 endpoint 게이트 | `requireIdentityVerified()` 헬퍼 + 4 route 적용 (tournaments/teams/games/match-request) | `00d001b` |
| PR1.5.b | 클라 4 페이지 안내 (옵션 C) | apply-button / team-join / match-request / tournament join 에 `me.name_verified===false` 분기 + onboarding redirect | `569c9e9` |
| PR2 | 환경 + 농구 (2/10, 3/10) | `/onboarding/environment` + `/onboarding/basketball` | `f992210` |
| (PortOne 통합) | 실 통합 | identity-verify-button = PortOne V2 SDK 호출 / 서버 = identityVerificationId 재조회 검증 | `d7a82b5` |
| PR4 | preferences (4/10) | `/onboarding/preferences` 통합 + xp +100 부여 | `00704be` |
| PR5 | §6 안내 | profile/edit §6 onboarding 미완료 안내 카드 | `6fcac51` |

**현재 보호 패턴**:
- 서버 (PR1.5.a) — 4 endpoint POST 시 `requireIdentityVerified()` → 403 응답
- 클라 (PR1.5.b) — 같은 4 페이지 클릭 시 `me.name_verified===false` 면 onboarding redirect (옵션 C — **버튼 클릭 시점**)

**PR3 의 위치**:
- 옵션 C (클릭 시점 안내) → 옵션 B (페이지 진입 시점 강제 redirect) 진입
- 즉 사용자가 핵심 페이지 URL 직접 진입 시 (예: `/tournaments/77/join`) **로드 자체를 차단** + onboarding 으로

**보류 이유 (PortOne 콘솔)**:
- `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY` 환경변수가 아직 Vercel 에 미등록
- 가드를 켜면 모든 미인증 사용자가 onboarding/identity 로 진입 → PortOne SDK 호출 시 채널 미설정으로 에러 → 인증 자체 불가능
- → mock 모드로 가드 코드 push + 환경변수 활성화 시점에 자동 ON 되도록 설계

---

## 2. 설계 결정 5 항목

### 2.1 가드 위치 — `(web)/layout.tsx` 통합 vs 신규 layout vs middleware.ts

| 옵션 | 위치 | 장점 | 단점 |
|---|---|---|---|
| A | `(web)/layout.tsx` 단일 파일에 분기 추가 | 기존 getAuthUser 결과 재사용 / 캐시 1회 / 추가 layout 파일 0 | 가드 대상 페이지 화이트리스트가 layout 안에 박힘 / 후속 페이지 추가 시 같은 파일 수정 |
| B | **`(web)/(protected)/layout.tsx` 신규 라우트 그룹** | 보호 대상 페이지를 `(protected)` 그룹으로 이동 → 가드 자동 적용 / 화이트리스트 불필요 | 여러 페이지를 `(protected)` 로 이동 시 import 경로 영향 0 (라우트 그룹은 URL 영향 X) 이지만 파일 이동 작업 발생 |
| C | `middleware.ts` 신규 | edge 단계 차단 / 모든 요청 가로채기 | DB SELECT 가 Node 만 → middleware (edge) 에서 user.name_verified SELECT 어려움 (또 다른 endpoint 호출 필요 = 비용) / 기존 getAuthUser cache 와 별개 |
| D | **각 페이지 server component 안에서 직접 분기** | 가드 대상 페이지만 명시적 / layout 변경 0 | 페이지마다 같은 분기 반복 / 누락 회귀 패턴 (login layout 누락 사건 — errors.md 2026-05-05) |

**선택 → 옵션 D (각 페이지 server component 직접 분기) + 공유 헬퍼**

**사유**:
1. **가드 대상 = 4 페이지 한정** (PR1.5.b 와 동일 범위) → "모든 페이지 보호" 가 아니라 명시적 차단
2. middleware (옵션 C) = name_verified 판정에 DB 필요 → edge 부담 + getAuthUser cache 미활용 (이중 호출)
3. 옵션 B (라우트 그룹) = 4 페이지 이동 시 URL 변경 없지만 디렉토리 이동 = git diff 큼 + 향후 매핑 혼란
4. 옵션 A (layout 통합) = 4 페이지 안에서 layout 진입 자체 차단해야 하는데 url path 매칭 = layout 책임 영역 벗어남
5. 옵션 D + **공유 헬퍼 `requireIdentityForPage()`** → 페이지 server component 1줄 호출 / cache 활용 / 명시적

**구현 형태**:
```ts
// src/lib/auth/require-identity-for-page.ts (신규)
import { redirect } from "next/navigation";
import { getAuthUser } from "./get-auth-user";
import { prisma } from "@/lib/db/prisma";
import { isIdentityGateEnabled } from "./identity-gate-flag";

export async function requireIdentityForPage(returnTo: string): Promise<void> {
  // 1) 비로그인 → /login (returnTo 보존)
  const auth = await getAuthUser();
  if (auth.state !== "active") {
    redirect(`/login?redirect=${encodeURIComponent(returnTo)}`);
  }

  // 2) mock 모드 (PortOne 미활성) → noop (개발 시 테스트 자유)
  if (!isIdentityGateEnabled()) return;

  // 3) name_verified 검증 → 미인증 시 onboarding redirect
  const u = await prisma.user.findUnique({
    where: { id: auth.user!.id },
    select: { name_verified: true },
  });
  if (!u?.name_verified) {
    redirect(`/onboarding/identity?returnTo=${encodeURIComponent(returnTo)}`);
  }
}
```

각 보호 페이지 (4건) server component 첫 줄에 호출 → 미인증 시 즉시 redirect.

---

### 2.2 Mock flag 설계 — 환경변수 부재 시 가드 동작

| 옵션 | 판정 룰 | 장점 | 단점 |
|---|---|---|---|
| **a** | `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY` 존재 시 = 가드 ON | 환경변수 1개 — 사용자 외부 작업 1회로 자동 활성 / explicit flag 추가 0 | 디버깅 시 (channel key 있는데 가드 OFF 하고 싶다) 직접 환경변수 임시 제거 필요 |
| b | explicit flag (`PORTONE_IDENTITY_GATE_ENABLED=true`) 추가 | 가드 / channel key 분리 → 인증 채널 발급 후에도 가드 점진 활성화 가능 | 외부 작업 2개 (channel key + flag) — 운영자 실수 가능성 ↑ |
| c | dev only 활성화 (`NODE_ENV==="development"`) | 운영 영향 0 (배포 후에도 가드 OFF) | 운영 활성화 시점에 코드 수정 또 필요 = mock 의도 반대 |
| d | a + b 결합 (channel key 또는 flag 중 하나 ON 시 가드) | 두 케이스 모두 처리 | 룰 복잡 / 사용자 인지 부담 |

**선택 → 옵션 a (channel key 환경변수 존재 여부로 자동 판단)**

**사유**:
1. **외부 작업 1회 = channel key 추가** → 가드 자동 ON. 사용자 약속 "환경변수 추가 시점에 즉시 활성화" 만족
2. PortOne SDK 자체가 channel key 없으면 "본인인증 설정이 완료되지 않았습니다" 에러 — 가드를 channel key 있을 때만 켜야 일관 (UX 함정 차단)
3. 옵션 b (explicit flag) = 운영자 실수 위험 (key 만 추가 / flag 누락 → 가드 OFF) / 옵션 c (dev only) = mock 의도와 반대

**판정 헬퍼**:
```ts
// src/lib/auth/identity-gate-flag.ts (신규)
/**
 * 본인인증 가드 활성화 여부.
 *
 * 룰: NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY 환경변수 존재 = 가드 ON.
 *
 * 사유: PortOne 콘솔 채널 발급 + Vercel 환경변수 추가 1회 = 가드 자동 활성.
 *      key 없으면 SDK 호출 자체가 실패 → 가드를 켜면 사용자가 onboarding 진입해도
 *      인증 불가능 → mock 모드 (가드 OFF) 가 안전.
 */
export function isIdentityGateEnabled(): boolean {
  const key = process.env.NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY;
  return typeof key === "string" && key.trim().length > 0;
}
```

**중요 — server component 에서 `NEXT_PUBLIC_*` 환경변수 접근 가능 여부 확인**:
- Next.js 15 App Router: `NEXT_PUBLIC_*` 는 클라이언트 + 서버 모두 노출 (build time inline)
- server component 안에서 `process.env.NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY` 접근 → **정상 작동** (build 시 inline)
- 런타임 hot swap 0 (env 변경 시 재배포 필요) — 운영자 환경변수 추가 후 Vercel 재배포 = 즉시 활성

---

### 2.3 강제 Redirect 대상 페이지 정의

PR1.5.b 클라 안내 4 페이지와 **동일 범위** 사용 → 일관성 + 회귀 0 + 사용자 인지 단순.

| # | 페이지 경로 | server/client | 현재 PR1.5.b 안내 | 가드 위치 |
|---|---|---|---|---|
| 1 | `/games/[id]` (apply-button 진입) | client | useSWR + click handler 분기 | **부모 server page 에 가드 추가** |
| 2 | `/teams/[id]` (team-join-button-v2 + match-request-modal) | client | useSWR + click handler 분기 | **부모 server page 에 가드 추가** |
| 3 | `/tournaments/[id]/join` | server (page.tsx 자체) | client component 안 분기 | **page.tsx server 안에 가드 추가** |
| 4 | (#2 와 동일 — match-request 모달은 teams/[id] 부모 안) | | | |

→ **실제 가드 추가 페이지 = 3건**:
1. `src/app/(web)/games/[id]/page.tsx`
2. `src/app/(web)/teams/[id]/page.tsx`
3. `src/app/(web)/tournaments/[id]/join/page.tsx`

(team-match-request-modal 은 teams/[id] 부모 가드로 자동 차단됨 / apply-button 은 games/[id] 부모 가드로 자동 차단됨)

**추가 검토 — 더 넓은 범위?**:
- `/manage/*` (팀/대회 운영)? — 운영진 권한이 별도 검증 (이미 본인인증 완료한 사용자만 운영 가능) → **제외**
- `/profile/edit`? — 본인인증 정보 입력 페이지 자체이므로 차단하면 안 됨 → **제외**
- `/onboarding/*`? — 가드 대상이지만 진입점이라 차단하면 무한루프 → **제외**

→ **가드 대상 3 페이지 한정** (기존 안내 4 페이지와 일치)

---

### 2.4 회귀 영향 — 기존 PR1.5.b 안내와 충돌 분석

| 시나리오 | 현재 (PR1.5.b only) | PR3 가드 추가 후 |
|---|---|---|
| 미인증 사용자가 `/games/[id]` URL 직접 진입 | 페이지 정상 렌더 / 신청 버튼 클릭 시 onboarding redirect | **페이지 진입 자체 차단** → onboarding 으로 redirect |
| 미인증 사용자가 nav → games 목록 → 상세 클릭 | 동일 (페이지 렌더 + 클릭 시 redirect) | **상세 진입 차단** |
| 인증 완료 사용자 | 영향 0 (분기 false) | 영향 0 |
| mock 모드 (channel key 없음) | (가드 비활성) PR1.5.b 만 작동 → 클릭 시 onboarding (그러나 onboarding/identity 가 SDK 에러) | **가드 noop** → 기존 PR1.5.b 와 동일 동작 |

**충돌 0 보장**:
- mock 모드 시 PR3 가드 = noop → PR1.5.b 안내가 그대로 작동 (현재 운영 상태 유지)
- channel key 추가 시 PR3 가드 ON + PR1.5.b 안내는 그대로 (이중 보호 — 가드 통과 후 새로고침 / SWR stale 케이스 대비)

---

### 2.5 returnTo 흐름 (사용자 이탈 방지)

PR1.5.b 패턴 따라 onboarding 진입 시 원래 페이지 보존.

```
미인증 사용자가 /tournaments/77/join 진입
  ↓ requireIdentityForPage("/tournaments/77/join")
  ↓ redirect("/onboarding/identity?returnTo=/tournaments/77/join")
  ↓ onboarding/identity 페이지에서 PortOne 인증 완료
  ↓ identity-step 의 onVerified 콜백 → returnTo 있으면 거기로 / 없으면 /onboarding/environment
```

**검증 필요** — 현재 `IdentityStep` 컴포넌트가 returnTo query 를 처리하는지 확인:
- `src/app/(web)/onboarding/identity/_components/identity-step.tsx` 안에서 `returnTo` 검사 로직 존재 여부
- 없으면 PR3 안에 함께 추가 (분량 ≈ 5 라인)

---

## 3. 구현 단계 (developer 진입점)

| 순서 | 작업 | 산출 파일 | 역할 |
|---|---|---|---|
| 1 | mock flag 헬퍼 신규 | `src/lib/auth/identity-gate-flag.ts` | `isIdentityGateEnabled()` — channel key 존재 판정 |
| 2 | 페이지 가드 헬퍼 신규 | `src/lib/auth/require-identity-for-page.ts` | `requireIdentityForPage(returnTo)` — auth + name_verified 검증 + redirect |
| 3 | 3 페이지 가드 호출 추가 | `(web)/games/[id]/page.tsx` / `(web)/teams/[id]/page.tsx` / `(web)/tournaments/[id]/join/page.tsx` | 각 server component 첫 줄에 호출 |
| 4 | identity-step 의 returnTo 흐름 검증 + (필요 시) 추가 | `(web)/onboarding/identity/_components/identity-step.tsx` | onVerified 콜백에서 returnTo query 처리 |
| 5 | 회귀 테스트 — mock 모드 (env 없음) + 활성 모드 (env 있음) | (코드 변경 0, 수동 테스트) | tester |

**병렬 가능**: 1+2 (헬퍼 신규) → 3+4 (페이지 + 흐름) → 5 (테스트)
**의존**: 3 은 1+2 의존 / 4 는 독립 / 5 는 모두 의존

---

## 4. 테스트 계획 (tester 위임)

### 4.1 mock 모드 (channel key 없음 — 현재 운영 상태)
| 케이스 | 기대 동작 |
|---|---|
| 미인증 사용자 / `/tournaments/77/join` 진입 | **페이지 정상 렌더** (가드 noop) → 클라 click 시 PR1.5.b 안내 |
| 미인증 사용자 / `/games/123` 진입 | 페이지 정상 렌더 + apply-button 클릭 시 PR1.5.b redirect |
| 인증 완료 사용자 | 영향 0 (모든 페이지 정상) |
| 비로그인 사용자 | `/login?redirect=...` redirect (auth.state !== "active" 분기) |

### 4.2 활성 모드 (channel key 추가 후)
| 케이스 | 기대 동작 |
|---|---|
| 미인증 사용자 / `/tournaments/77/join` 진입 | **`/onboarding/identity?returnTo=/tournaments/77/join` 즉시 redirect** |
| 인증 완료 후 returnTo 흐름 | 인증 완료 → returnTo 페이지로 자동 진입 |
| 인증 완료 사용자 | 영향 0 |

### 4.3 회귀 (모든 사용자)
| 케이스 | 기대 동작 |
|---|---|
| `/profile/edit` 진입 (가드 대상 외) | 영향 0 |
| `/onboarding/*` 진입 | 영향 0 (가드 대상 외) |
| 운영진 / `/manage/*` 진입 | 영향 0 |
| 인증 완료 사용자가 가드 페이지 진입 | DB SELECT 1회 추가 (name_verified) → 성능 영향 미미 (React.cache dedup 활용 시 0) |

---

## 5. 위험 + 회귀 0 보장 방법

### 5.1 위험 분석
| 위험 | 영향 | 대응 |
|---|---|---|
| W1 — channel key 추가 직후 SDK 자체 에러 (PortOne 콘솔 설정 문제) | 미인증 사용자가 onboarding 진입 → 인증 불가 → 가드 통과 불가 → 핵심 페이지 영구 차단 | 가드 활성화 전 `/onboarding/identity` 수동 검증 (PortOne 위젯 정상 노출 + 인증 완료) 필수. 미통과 시 `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY` 환경변수 즉시 제거 = 가드 자동 OFF |
| W2 — getAuthUser cache 와 신규 SELECT 중복 | name_verified SELECT 가 layout.tsx 의 referee SELECT 와 따로 → 동일 요청 안 2 SELECT | React.cache dedup 활용 — `getAuthUser` 는 이미 cache. 새 SELECT 는 매 호출 새로 실행되지만 페이지 1회 진입 = 1 SELECT (영향 미미) |
| W3 — returnTo 흐름 누락 (identity-step 미처리) | 인증 완료 후 사용자가 원래 페이지로 못 돌아감 | 단계 4 에서 검증 + 필요 시 추가 |
| W4 — 외부 페이지 (Flutter app webview) 가드 영향 | Flutter 앱이 `/games/123` webview 로 로드 시 미인증 webview 사용자 가드 작동 | Flutter 앱 사용자는 별도 JWT 발급 받아 인증 완료 상태 (운영 가정) → 영향 0. 의심 시 webview UA 분기 추가 가능 |

### 5.2 회귀 0 보장
1. **mock 모드 default** — channel key 환경변수 추가 전까지 가드 noop = 현재 운영 상태와 동일
2. **PR1.5.b 보존** — 클라 안내 코드 그대로 유지 (가드와 이중 보호)
3. **가드 대상 3 페이지 한정** — 그 외 모든 페이지 영향 0
4. **page-level 분기** — middleware 가 아니므로 정적 자산 / API / Flutter v1 endpoint 영향 0
5. **롤백 = 환경변수 제거** — 활성화 후 문제 발생 시 `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY` 제거 → 즉시 noop 모드 복구 (코드 revert 불필요)

---

## 6. 사용자 결정 필요 항목 (PM 가 사용자에게 확인)

| # | 항목 | 옵션 | 본 문서 권장 |
|---|---|---|---|
| Q1 | **mock flag 룰** | (a) channel key 존재 시 = 가드 ON / (b) explicit flag 추가 / (c) dev only | (a) — 외부 작업 1회 / 자동 활성 |
| Q2 | **가드 대상 페이지 범위** | 3 페이지 한정 (PR1.5.b 와 동일) / 4+ 페이지 추가 (manage 등) | 3 페이지 한정 — 일관성 + 회귀 0 |
| Q3 | **가드 위치 선택** | 페이지 server component 직접 분기 / `(protected)` 라우트 그룹 / middleware | 페이지 분기 (옵션 D) — cache 활용 + 명시적 |
| Q4 | **PortOne 활성화 일정** | 본 문서 후 즉시 / PR3 코드 push 후 / 별도 일정 | (사용자 결정) — 코드 push 와 활성화 분리 가능이 본 설계의 핵심 |
| Q5 | **identity-step returnTo 처리 누락 시** | 본 PR3 안에 포함 / 별도 PR | 본 PR3 안에 포함 (분량 ≈ 5 라인 / 회귀 0) |

→ Q1~Q5 사용자 답변 받은 후 developer 진입.

---

## 7. 다음 단계 (developer 진입점)

1. **사용자 답변 받기** (Q1~Q5)
2. developer 진입 — 본 문서 §3 5단계 실행
3. tester 진입 — 본 문서 §4 mock 모드 테스트 (활성 모드는 PortOne 활성화 후 별도)
4. main 머지 — mock 모드로 push (PortOne 활성화 전이라 운영 영향 0)
5. (외부) PortOne 콘솔 채널 발급 + Vercel `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY` 추가 + 재배포
6. 활성 모드 회귀 테스트 → 문제 시 환경변수 제거 = 즉시 롤백

---

## 8. 참조

- `Dev/auth-flow-redesign-2026-05-05.md` — 5/5 인증 흐름 재설계 보고서 (옵션 A+B 합의)
- `.claude/knowledge/decisions.md` — onboarding 10단계 옵션 B 합의 / 인증 흐름 단일 진입점
- `.claude/knowledge/architecture.md` — `getAuthUser()` 단일 진입점 + 4 layout 위임
- `src/lib/auth/get-auth-user.ts` — 인증 단일 헬퍼 (재사용)
- `src/lib/auth/require-identity-verified.ts` — PR1.5.a 서버 가드 (참조 패턴)
- 5/7 main 머지 21회 (`2cc9df3` ~ `168be48`) — onboarding 시리즈 + PortOne V2

---

**작성**: planner-architect / 2026-05-08
**상태**: PM 결재 대기 (Q1~Q5)
**다음**: 사용자 답변 → developer 진입
