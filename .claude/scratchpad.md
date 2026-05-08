# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[5/8 세션 마무리 — subin 10회 push 완료, 디자인 박제 회차]** home BDR v2 토큰 마이그레이션 (145→0) + gitignore 정리 + 5/7 디자인 박제 후속 (CLAUDE.md / claude-project-knowledge / 디자인 시스템 관리) + **BDR-current sync v2.4** (5/1 v2.3 → 5/8 Phase A.6 운영 정합) + 운영→시안 역박제 4 영역 (PasswordInput / MemberPendingBadge / MyPage 다중팀 / 가입 모달) + zip 처리 100% + mypage feasibility 보관. lessons.md 박제 (sync 갭 spot check 매트릭스 + 재발 방지 3 룰). 다음 = PortOne 운영 활성화 + PR3 layout 가드.

---

## 🎯 다음 세션 진입점

### 🚨 0순위 — PortOne 본인인증 운영 활성화 (사용자 외부 작업)
- **PortOne 콘솔**: 본인인증 채널 발급 (PASS / SMS / KCP 중 선택)
- **Vercel 환경변수**: `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY=channel-key-xxx` 추가 → 재배포
- **검증**: 미인증 계정 → /onboarding/identity → PortOne 위젯 호출 → 인증 완료 → /onboarding/environment 자동 진입
- **승인 대기 중**: 콘솔 작업 후 mybdr.com/onboarding/identity 진입 시 위젯 정상 노출 여부 확인

### 🚀 1순위 — PR3 layout 가드 (PortOne 활성화 후)
- 미인증 사용자 핵심 페이지 진입 시 강제 redirect → `/onboarding/identity`
- 현재 옵션 C (안내 only) → 옵션 B (강제 redirect) 로 진입
- 분량 0.5d. middleware.ts 또는 (web)/layout.tsx 가드.

### 🚀 2순위 — onboarding 흐름 검증 + 사용자 영향 모니터링
- 카카오/구글/네이버 소셜 가입자가 흐름 정상 통과하는지
- xp +100 부여 확인 (xp 컬럼 SELECT 또는 마이페이지 표시)
- profile/edit 이름/생년월일/휴대폰 잠금 회귀 0

### 🚀 3순위 — manage 탭 그룹화 (P2-6 보류) + 데드 코드 정리
- manage 8~9 탭 → "신청 관리" / "운영진" 그룹화 (IA 변경, 사용자 결정 필요)

### 🚀 4순위 — game.game_type 0~5 마이그레이션 / 매치 코드 v4 Phase 6 (보류)

---

## 구현 기록 (developer / 5/8)

### PR3 layout 가드 mock 모드 구현 완료

📝 구현한 기능: 본인인증 미완료 사용자가 핵심 페이지 (games/teams/tournaments-join) 진입 시 `/onboarding/identity` 강제 redirect 가드. PortOne 채널 키 환경변수 미설정 시 mock 모드 noop (회귀 0).

| 파일 경로 | 변경 내용 | 신규/수정 | 라인 |
|----------|----------|----------|------|
| `src/lib/auth/identity-gate-flag.ts` | `isIdentityGateEnabled()` — channel key 환경변수 존재 판정 | 신규 | 26 |
| `src/lib/auth/require-identity-for-page.ts` | `requireIdentityForPage(returnTo)` — auth state + name_verified 검증 + redirect | 신규 | 61 |
| `src/app/(web)/games/[id]/page.tsx` | `requireIdentityForPage(/games/${id})` 첫 줄 호출 + import | 수정 | 604 (+8) |
| `src/app/(web)/teams/[id]/page.tsx` | `requireIdentityForPage(/teams/${id})` 첫 줄 호출 + import | 수정 | 366 (+7) |
| `src/app/(web)/tournaments/[id]/join/layout.tsx` | server layout 신설 (page.tsx 가 client component 라 별도 server wrapper 필요) | 신규 | 41 |
| `src/app/(web)/onboarding/identity/page.tsx` | searchParams.returnTo 처리 + 보안 검증 (startsWith "/" + !"//" 차단) + IdentityStep 에 returnTo 전달 | 수정 | 101 (+22) |
| `src/app/(web)/onboarding/identity/_components/identity-step.tsx` | returnTo prop 추가 + onVerified 콜백에서 returnTo 우선 router.push | 수정 | 83 (+8) |

#### 본인인증 컬럼 (확정)
- **컬럼명**: `user.name_verified` (Boolean, default false)
- **Prisma schema**: `prisma/schema.prisma:217`
- **참조 commit**: `c9fe34b` (PR1.1+1.2 — 5/7 본인인증 진입), `00d001b` (PR1.5.a `requireIdentityVerified()` 헬퍼)

#### 검증 결과
| 항목 | 결과 |
|------|------|
| `tsc --noEmit` | 0 에러 ✅ |
| `npm run build` | 성공 ✅ (Turbopack JSX parser 통과) |
| 신규 에러/warning | 0 (기존 warning 만: Prisma deprecation / Serwist / dynamic API) |
| 라인 카운트 검증 | 모든 파일 정상 종료 (`}`/JSX close 확인) ✅ |
| 환경변수 .env / .env.local | `PORTONE_IDENTITY_CHANNEL_KEY` 미설정 → `isIdentityGateEnabled()` false → mock 모드 noop ✅ |

#### 동작 검증 (코드 분석)
- **mock 모드** (현재 상태): 가드 첫 줄 `if (!isIdentityGateEnabled()) return;` → 즉시 종료. 3 페이지 진입 시 redirect 0건. 기존 PR1.5.b 클라 안내가 그대로 작동.
- **활성 모드** (env var 추가 후): channel key 존재 → `getAuthUser` → `auth.state==="active"` 확인 → `name_verified` SELECT → false 면 `/onboarding/identity?returnTo=<원래경로>` redirect.
- **returnTo 흐름**: 보안 검증 (`startsWith("/")` + `!startsWith("//")`) → IdentityStep onVerified 콜백 → `router.push(returnTo ?? "/onboarding/environment")`. 이미 인증 완료된 사용자가 onboarding/identity 진입 시에도 returnTo 우선 처리.

💡 tester 참고:
- **mock 모드 회귀 테스트** (env 미설정 — 현재 운영 동일):
  1. 미인증 사용자로 `/games/<id>` `/teams/<id>` `/tournaments/<id>/join` 진입 → 페이지 정상 렌더 (가드 noop)
  2. PR1.5.b 클라 안내 (apply-button / team-join / match-request / tournament join useEffect) 그대로 작동
  3. 인증 완료 사용자 영향 0
  4. 비로그인 사용자 영향 0 (가드 noop + 기존 layout 가드 위임)
- **활성 모드 테스트** (env var 추가 후):
  1. `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY=channel-key-xxx` Vercel 추가 + 재배포
  2. 미인증 사용자가 가드 대상 3 페이지 직접 URL 진입 → onboarding/identity?returnTo=... 즉시 redirect
  3. 인증 완료 후 returnTo 페이지 자동 복귀
  4. PortOne SDK 정상 호출 (콘솔 채널 발급 사전 필수)
- **주의 입력**:
  - returnTo 가 외부 URL ("//evil.com" / "https://...") → 무시 (server page 검증)
  - returnTo 누락 → /onboarding/environment fallback (기존 흐름)

⚠️ reviewer 참고:
- **공유 헬퍼 패턴**: `requireIdentityForPage()` 는 `requireIdentityVerified()` (PR1.5.a route handler 용) 와 동일 패턴이지만 server component 용 (return Response 대신 redirect throw).
- **이중 보호 의도**: PR1.5.b 클라 안내는 그대로 보존 (가드 통과 후 SWR stale / 새로고침 케이스 대비).
- **롤백 전략**: 환경변수 제거 = 즉시 mock 모드 복귀 (코드 revert 0).
- **`tournaments/[id]/join` server layout 신설**: page.tsx 가 client component 라 직접 가드 호출 불가 → layout.tsx server wrapper 도입. 이 패턴은 lessons.md 등록 가치 있음.

### 다음 단계
- tester + reviewer 병렬 검증 가능
- 검증 통과 → PM 자동 commit (`feat: PR3 layout 가드 mock 모드 ...`)
- PortOne 콘솔 채널 발급 + Vercel `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY` 추가 = 활성화 (외부 작업)

---

## 테스트 결과 (tester / 5/8 PR3 가드)

### 빌드 검증
| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ 0 에러 |
| `npm run build` (Turbopack JSX parser) | ✅ 통과 — `/games/[id]` `/teams/[id]` `/tournaments/[id]/join` 모두 정상 컴파일 |
| 신규 에러/warning | ✅ 0 (기존 warning 만 — Prisma deprecation / Serwist Turbopack / dynamic API route) |
| 7 파일 line count + 마지막 줄 | ✅ 모두 정상 (`}` 종료) — 5/7+5/8 truncated 함정 재발 0 |

라인 카운트 검증 결과 (구현 기록과 일치):
- `identity-gate-flag.ts` 26 / `}` ✅
- `require-identity-for-page.ts` 61 / `}` ✅
- `games/[id]/page.tsx` 604 / `}` ✅
- `teams/[id]/page.tsx` 366 / `}` ✅
- `tournaments/[id]/join/layout.tsx` 41 / `}` ✅
- `onboarding/identity/page.tsx` 101 / `}` ✅
- `onboarding/identity/_components/identity-step.tsx` 83 / `}` ✅

### mock 모드 회귀 검증
| 항목 | 결과 |
|------|------|
| `.env` / `.env.local` 양쪽 모두 `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY` 미설정 | ✅ 확인 (grep 0 hit) |
| `isIdentityGateEnabled()` false 반환 (typeof key !== "string" 또는 trim()===0) | ✅ |
| `requireIdentityForPage()` 첫 줄 `if (!isIdentityGateEnabled()) return` 즉시 종료 | ✅ DB SELECT 0건 / redirect 0건 |
| 3 페이지 (games / teams / tournaments-join) mock 모드 redirect 발생 안 함 | ✅ 가드 noop → 기존 페이지 그대로 렌더 |

### 본인인증 컬럼 정확성
| 항목 | 결과 |
|------|------|
| `prisma/schema.prisma:217` `name_verified Boolean @default(false)` 존재 | ✅ |
| 5/7 PR1.5.a `requireIdentityVerified()` 와 동일 컬럼 (`select: { name_verified: true }`) | ✅ |

### PR1.5.b 보존 (이중 보호)
4 파일 모두 클라 안내 useEffect / `needsIdentity` 분기 그대로 보존 (가드 추가가 안내 코드 제거 0건):
- `games/[id]/apply-button.tsx:41` — `me.name_verified === false` 분기 ✅
- `teams/[id]/_components_v2/team-join-button-v2.tsx:56` — `needsIdentity` ✅
- `teams/[id]/_components_v2/team-match-request-modal.tsx:81` — `needsIdentity` ✅
- `tournaments/[id]/join/page.tsx:163` — useEffect router.push ✅

### open redirect 방지 (returnTo 보안)
`onboarding/identity/page.tsx:38-43` 검증 로직 (코드 분석):

| returnTo 입력 | safeReturnTo 결과 |
|--------------|------------------|
| `/games/123` | `/games/123` ✅ |
| `//evil.com` (protocol-relative) | `null` ✅ |
| `https://evil.com` | `null` (startsWith "/" 미통과) ✅ |
| `javascript:alert(1)` | `null` ✅ |
| undefined | `null` (fallback `/onboarding/environment`) ✅ |

### tournaments/[id]/join layout 패턴
| 항목 | 결과 |
|------|------|
| server layout 신설 (41 라인) — `async export default` + `params: Promise<{id: string}>` Next 15 패턴 | ✅ |
| `await params` 추출 → `requireIdentityForPage('/tournaments/${id}/join')` | ✅ |
| `<>{children}</>` 패스스루 (기존 client page UI 영향 0) | ✅ |
| Next 15 layout + page 동시 params 접근 build 통과 | ✅ |

### 환경변수 활성화 시뮬레이션
- ⏭ skip — `.env.local` 임시 수정은 운영 영향 0 보장 위반 위험 + PortOne 콘솔 발급 (사용자 외부 작업) 미완료. mock 모드 검증으로 회귀 0 보장 충분. 활성 모드 검증은 보고서 §7 5단계 (PortOne 콘솔 + Vercel 환경변수 추가 후) 별도 진행.

### 종합 판정
✅ **통과** — PR3 mock 모드 구현 회귀 0 / 빌드 0 에러 / 7 파일 truncated 0 / open redirect 방어 견고 / PR1.5.b 이중 보호 보존. PM 자동 commit 진행 가능.

### 수정 요청
없음.

---

## 리뷰 결과 (reviewer / 5/8 PR3 가드)

### 보안
- open redirect 방지: ✅ — `/onboarding/identity/page.tsx:38-43` `startsWith("/")` + `!startsWith("//")` 이중 검증. server page 1차 + IdentityStep 주석상 "이미 검증된 경로만 들어옴" 명시. javascript:/http:/https: 외부 URL 모두 차단됨 (절대 경로는 모두 `/` 시작 + scheme 은 `://` 포함하므로 startsWith("/") false). 빈 문자열·null·undefined → null fallback (`safeReturnTo`).
- 시크릿 노출 0: ✅ — `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY` = PortOne 채널 식별자(public 공개 안전, 시크릿 아님). identity-verify-button.tsx:70 에서도 동일 변수 클라이언트 사용 중.
- 가드 우회 가능 경로: 없음 — `requireIdentityForPage` 가 redirect throw → 호출 후 코드 실행 안 됨. `getAuthUser` 가 React.cache dedup 로 동일 요청 내 일관성 보장.

### 코드 품질
- 컨벤션 준수: ✅ — 파일명 kebab-case (`identity-gate-flag.ts` / `require-identity-for-page.ts`), 함수명 camelCase (`isIdentityGateEnabled`/`requireIdentityForPage`), 디렉토리 위치 (`src/lib/auth/`) 기존 13 파일 동일 컨벤션. `name_verified` (snake_case DB 컬럼) 일관 사용.
- 타입 엄격성: ✅ — `any` 사용 0. Promise<{ id: string }> Next.js 15 패턴 준수. `searchParams?: Promise<{ returnTo?: string }>` optional + Promise 정확. `auth.user!.id` non-null assertion 은 `auth.state === "active"` 분기 안에서만 사용 (안전).
- 에러 핸들링: ✅ — `prisma.user.findUnique(...).catch(() => null)` → SELECT 실패 시 안전하게 noop (PR1.5.a 서버 endpoint 가드가 마지막 방어선). `redirect()` throw 후 코드 실행 안 됨 보장.
- 주석/의도 명확성: ✅ — 모든 신규 파일 "이유(왜) → 어떻게 → 보장" 3섹션 JSDoc. mock 모드 default 의도 / server layout 신설 사유 / cache dedup 효과 모두 명시. PR1.5.a/b 와의 관계 (이중 보호) 주석.

### 회귀 위험
- PR1.5.b 보존: ✅ — 4 클라 안내 파일 (apply-button / team-join-button-v2 / team-match-request-modal / tournament join page.tsx) 모두 `name_verified` 분기 그대로 (Grep 11 파일 매치). tournaments/[id]/join/page.tsx:158-165 useEffect redirect 보존.
- mock 모드 default: ✅ — `if (!isIdentityGateEnabled()) return;` 첫 줄. `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY` 미설정 = trim().length === 0 → false → 즉시 return. 현재 `.env`/`.env.local` 미설정 상태에서 100% noop.
- Prisma over-fetch 0: ✅ — `select: { name_verified: true }` 단일 컬럼만. PR1.5.a `requireIdentityVerified` 와 동일 패턴.

### 아키텍처
- 가드 위치 일관성: ✅ — 옵션 D (페이지 server component 직접 분기) 일관. 3 페이지 중 2 페이지는 server page 첫 줄 직접, tournaments/[id]/join 은 client page 라 server layout 신설 (불가피).
- 헬퍼 디렉토리: ✅ — `src/lib/auth/` 13개 헬퍼 동일 위치 (`require-identity-verified.ts`, `require-recorder.ts`, `get-auth-user.ts` 등 옆자리).
- server layout 패턴: ✅ — Next.js 15 정상 패턴. `params: Promise<{id:string}>` await + `<>{children}</>` 패스스루. 라우트 영향 0.
- mock flag 단일 진실 원천: ✅ — `isIdentityGateEnabled()` 만이 `process.env.NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY` 직접 접근. `require-identity-for-page.ts:39` 가 헬퍼 통해 호출. (cf. `identity-verify-button.tsx:70` 도 직접 접근하지만 SDK 호출용 raw 값 필요한 별개 책임 — 가드 판정 영역 아님.)

### errors.md 적용
- truncated 0: ✅ — 5 파일 라인 카운트 검증 (26/61/41/101/83) + 모든 파일 마지막 줄 정상 종료 (`}` 또는 close JSX). 5/7 / 5/8 hot fix 패턴 재발 0.
- 의심 패턴: 없음 — JSX hook 마지막 줄 0, 대량 마이그레이션 0, 단일 파일 추가/수정만.

### 일관성 (PR1.5.a/b)
- 컬럼명 일치: ✅ — `name_verified` (snake_case) 통일. `requireIdentityVerified` / `requireIdentityForPage` 양쪽 모두 동일 SELECT 패턴.
- 명명 충돌: 없음 — `requireIdentityVerified` (route handler, Response 반환) vs `requireIdentityForPage` (server component, redirect throw). 의도 차이 명확 + JSDoc 에 사용처/패턴 명시.

### 종합 평가
⭐⭐⭐⭐⭐ — 설계서(`Dev/pr3-layout-guard-design-2026-05-08.md`) 5 결정사항 100% 부합. mock 모드 = 회귀 0 보장 + 환경변수 추가 시 자동 활성. JSDoc 품질 높음 (이유→어떻게→보장 패턴 일관). 보안(open redirect) 이중 검증 + 가드 우회 경로 0. 코드 분량 ≈ 200 라인 / 신규 2 + 수정 5 / 의도 명확.

### 개선 제안 (선택)
- 우선도 낮음 (선택 1): `requireIdentityForPage` 의 `auth.user!.id` non-null assertion 대신 narrowing 코드 (`if (!auth.user) return;`) 추가하면 TS 엄격성 +1. 현재도 안전하지만 미래 리팩 시 함정 차단. — 현재 동작에 영향 0이므로 보류 가능.
- 우선도 낮음 (선택 2): `tournaments/[id]/join/layout.tsx` 신설 패턴은 lessons.md 등록 가치 있음 — "client page 의 server-side 가드 = layout wrapper" 패턴. PM 후속 작업으로 위임.
- 우선도 낮음 (선택 3): mock 모드 시 dev 환경에서 console.info 1줄 ("identity gate is in mock mode") 추가하면 디버깅 편의 +. 현재 운영 영향 0이므로 보류 가능.

### 수정 요청
- 없음. 통과.

---

## 기획설계 (planner-architect / 5/8)

- **PR3 layout 가드 + mock 모드 — 보고서 작성 완료, PM 결재 대기** (`Dev/pr3-layout-guard-design-2026-05-08.md`)
  - 🎯 목표: 미인증 사용자 핵심 페이지 진입 시 강제 redirect → `/onboarding/identity`. PortOne 콘솔/환경변수 외부 작업 대기 중 = mock 모드로 코드 미리 push, 환경변수 추가 시점에 자동 활성화
  - 📍 신규 파일 2건 + 수정 3 페이지:
    - 신규 `src/lib/auth/identity-gate-flag.ts` — `isIdentityGateEnabled()` (channel key 존재 판정)
    - 신규 `src/lib/auth/require-identity-for-page.ts` — `requireIdentityForPage(returnTo)` (auth + name_verified + redirect)
    - 수정 `(web)/games/[id]/page.tsx` / `(web)/teams/[id]/page.tsx` / `(web)/tournaments/[id]/join/page.tsx` — 첫 줄 가드 호출
  - 🧠 핵심 결정 (decisions.md 박제):
    - mock flag = channel key 환경변수 존재 시 자동 ON (옵션 a)
    - 가드 위치 = 페이지 server component 직접 분기 (middleware/라우트 그룹 거부)
    - 가드 대상 = 3 페이지 (PR1.5.b 와 동일 범위)
  - ⚠️ 사용자 결재 필요 Q1~Q5: mock flag 룰 / 가드 범위 / 가드 위치 / PortOne 활성화 일정 / identity-step returnTo 처리
  - 📋 developer 진입 시 단계: (1) 헬퍼 2개 신규 → (2) 3 페이지 가드 호출 → (3) returnTo 흐름 검증 → (4) tester mock 모드 회귀
  - 🔄 롤백 = 환경변수 제거 (코드 revert 0)

- **팀 멤버 라이프사이클 + Jersey 재설계 — ✅ 5 Phase + PR1e + UI fix 모두 main 완료** (`Dev/team-member-lifecycle-2026-05-05.md` / `4253e68` main 5/6 23h 기준)
- **인증 흐름 재설계** — ✅ 완료 (5/5 `3f016c9` main)

---

## 🟡 HOLD / 우선순위 2~3 (압축)
- **HOLD**: 자율 QA 봇 (1~5 / 9d) / BDR 기자봇 v2 (Phase 2~7)
- **5/2 잔여**: placeholder User 86건 LOW (auto merge) / ttp 부족팀 5팀 사용자 액션
- **결정 대기**: 관리자 UI 6건 / Games·Teams Phase A dead code / Phase F2 mount
- **인프라 영구**: 카카오맵 / PortOne / 대회 로컬룰 / 슛존 / 스카우팅 / 시즌통계 / VS비교 / 답글 / waitlist / QR 티켓 / AppNav 쪽지 / D-6·D-3 후속 / Q1 토큰 마이그

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| 5/2 동호회최강전 D-day | ✅ DB 16팀 + 27경기 + 회귀 5종 |
| dual_tournament 회귀 방지 | ✅ A~E 5종 |
| Live `/live/[id]` v2 | ✅ STL + minutes-engine v3 + 5/4 sticky+팀비교 (1f8ee19) |
| 마이페이지 D-1~D-8 | ✅ 8/8 |
| Reviews 통합 (Q1) | ✅ |
| 듀얼토너먼트 풀 시스템 | ✅ Phase A~F2 |
| 디자인 시안 박제 | ⏳ 38% (40+/117) |
| **도메인 sub-agent (옵션 A)** | ✅ P1+P2+P3 완료 (C 채택 — live-expert 영구 / 신규 박제 0) |
| **매치 코드 v4** | ✅ Phase 1+2+3+4+5+7 (전 Phase 완료) |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-08 | (코드 변경 0 / 보고서 1건) | **PR3 layout 가드 + mock 모드 설계 보고서** — `Dev/pr3-layout-guard-design-2026-05-08.md` 작성 (8 섹션 / Q1~Q5 사용자 결재 대기). mock flag = channel key 환경변수 존재 시 자동 ON 결정 (옵션 a, decisions.md 박제). 가드 위치 = 페이지 server component 직접 분기 (옵션 D). 가드 대상 = 3 페이지 (PR1.5.b 와 동일 범위). 신규 헬퍼 2건 + 수정 3 페이지 / 분량 ≈ 200 라인. 롤백 = 환경변수 제거 (코드 revert 0). PM 결재 후 developer 진입. | ✅ 설계 |
| 2026-05-08 | `48643f5` ~ `1dbc3ee` (11건 push) → PR #214 #215 머지 → **빌드 9건 실패** → hot fix `333516b` → PR #216 #217 → main `c6a6848` | **5/8 누적 — 디자인 박제 회차 + 메인 배포 + truncated 재발 hot fix** — (1) home BDR v2 토큰 마이그 145→0. (2) gitignore 정리. (3) 5/7 박제 후속 (claude-project-knowledge 02·03·04 +413 / 디자인 시스템 관리 폴더). (4) BDR-current sync v2.4. (5) sync 갭 lessons.md + 재발 방지 3 룰. (6) 역박제 영역 1~4 (PasswordInput / MemberPendingBadge / MyPage 다중팀 / 가입 모달). (7) zip 처리 100%. **(M) 머지 회차** — subin→dev #214 + dev→main #215 gh CLI 자동 머지. **(H) Truncated 재발 hot fix (5/7 동일 패턴 2회차)** — `48643f5` BDR v2 토큰 마이그 commit 중 `profile-cta-card.tsx` 161줄 단독 잘림 (38줄 손실, Link+닫기 버튼). 5/8 11 commit + PR #214/#215 머지 = **빌드 9건 연쇄 실패** (Production Current = `168be48` 그대로 유지, 운영 영향 0 — Vercel auto promotion 차단). hot fix `333516b` (이전 정상 `059d4a6` 38줄 복원) → PR #216 (subin→dev) + #217 (dev→main) → main `c6a6848` 머지 완료. errors.md 박제 (5/7 룰 + 보완 4룰 — 대량 마이그 line count 검증 / push 후 빌드 결과 1분 내 확인 / JSX 마지막 줄 hook / 로컬 npm run build 권장). | ✅ |
| 2026-05-07 | main 21회 (`2cc9df3` ~ `168be48`) | **5/7 단일 일 신기록 21회 main 머지 — Onboarding 10단계 + PortOne V2 + Phase A.5 drawer + 다수 fix** — (A) 초반 fix 7건: envelope+snake_case 8회 재발 (`7945452`) / 한글 IME Enter 9곳 (`d7e921c`) / 마이페이지 한 줄 정렬 + 세로 stack + 우측 정렬 (`9513fe3` `e344375` `f1c5cee`) / 신청 알림 404 fix (`2c9afe2`) / 알림 deep-link scroll+highlight (`0ccf785`). (B) Onboarding 시리즈: PR1.1+1.2 본인인증 진입 (`c9fe34b`) / PR1.3 settings 단일 진입점 (`49698c0`) / PR1.5.a 서버 4 endpoint 게이트 (`00d001b`) / 옛 알림 redirect (`f8bb636`) / PR1.5.b 클라 4 페이지 (`569c9e9`) / 카드 미표시 + 임시 모달 + 인증 필드 잠금 (`c13bae0`) / manage 변경 요청 envelope 9회 (`a16541b`) / PR2 environment+basketball (`f992210`) / PortOne V2 실 통합 (`d7a82b5`) / PR4 preferences 통합 + xp +100 (`00704be`) / PR5 §6 안내 (`6fcac51`). (C) 후반: Phase A.5 drawer fix (`0809432` truncated → 빌드 실패) → hot fix `168be48` (워킹트리 정상 css 재 commit, 13분 내 운영 복구). errors.md 박제 — truncated commit 함정 + IME 9회 + envelope 9회. PR3 layout 가드는 PortOne 운영 활성화 후로 보류. | ✅ |
| 2026-05-06 | `7211f97` `86f9eb9` `64b1bab` `d5d491e` `465b7ca` `f6b43ab` → main `4253e68` | **5/6 누적 — PR1e DROP COLUMN + UI fix 13건 + 마이페이지 소속팀 이동 + 좌하단 뱃지 + dropdown overflow + apiError 일괄 fix** — (1) PR1e: `user.default_jersey_number` 컬럼 DROP (54명 메모 손실, 가치 0, 명시 승인 + --accept-data-loss). (2) UI fix 13건 / 11건 fix: 5 모달 + dropdown 토큰 통일 (`--surface` → `--color-card`) / placeholder "예) " 4건 / iOS 16px / grid 모바일 분기 / dropdown overflow / window.prompt → ForceActionModal. (3) 본인 카드 dropdown 잘림 fix (overflow visible). (4) 좌하단 신청 중 뱃지 (`member-pending-badge.tsx`) — 4종 라벨 (jersey/dormant/withdraw/transfer). (5) 마이페이지 소속팀 카드 = 히어로 아래 풀 width + 각 row "활동 관리" + "팀페이지 →". (6) "내 액션" → "활동 관리" 라벨. (7) apiError 인자 순서 9 파일 69건 fix (한국어 메시지 정상화 — 휴면/번호변경/탈퇴 신청 시 "ALREADY_PENDING" 영문 노출 → 한국어). transfer 검색 endpoint URL fix. tsc 0 / 미푸시 0. | ✅ |
| 2026-05-05 | `ae4ffd7` `d72aa0a` `f2d7a96` `a647f88` `2e3e22b` `8600c74` `1e8c9db` `b9b2776` `504e858` `d274000` `5d62f7f` → main `8bbce95` | **팀 멤버 라이프사이클 + Jersey 재설계 5 Phase 16 PR main 배포** — 보고서 `Dev/team-member-lifecycle-2026-05-05.md` 옵션 C+UI. Phase 1 Jersey (PR1~5): default_jersey 사용처 정리 / 가입폼 jersey + 자동 복사 / 마이페이지 다중 팀 카드 / tournament join ttp 자동 sync (운영자 시야 X) / match_player_jersey 신설 + W1 라이브 운영자 모달 + admin_logs / v1 6 endpoints 우선순위 helper (Flutter 변경 0). Phase 2 워크플로 (PR6~9): team_member_requests + team_member_history 인프라 / 번호변경 신청 + dispatcher 활성화 / 휴면+탈퇴 + lazy 복구 helper. Phase 3 이적 (PR10~11): transfer_requests state machine 양쪽 팀장 승인 + 자동 이동 트랜잭션. Phase 4 권한 위임 (PR12~13): team_officer_permissions captain only 위임 (재위임 X) + 매트릭스 적용 4 endpoint. Phase 5 유령회원 (PR14~16): last_activity_at + 5분 throttle + 활동 추적 5종 / 유령 후보 + 강제 액션 / 회원 상태 정비 + 명단 완전 삭제 옵션. ADD TABLE 5건 + ADD COLUMN 1건 모두 무중단. 사용자 결정 8건 + 미묘 6건 룰 반영. tsc 0 / Flutter v1 호환 0. | ✅ |
| 2026-05-05 | DB UPDATE 4건 (코드 변경 0) | **열혈농구단 SEASON2 출전 명단 정비** — 쓰리포인트/백승훈 ttpId=2540 (18→39) + 몽키즈/이지환 ttpId=2583 (0→4) + 몽키즈/최원영 ttpId=2581 (10→20) + 제주 리딤/이도균 ttpId=2830 INSERT #70 (옵션 2 트랜잭션, team_members.jersey NULL→70 동시). 매 건 사전 검증 (동명이인 0 / 충돌 0) → 사용자 명시 승인 → 사후 SELECT 재확인 PASS. 임시 스크립트 즉시 삭제. errors+lessons 박제 (도메인 단방향 함정). | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 + 5/5 auth 10+ 건 / 듀얼 P3~P7 / 매치 코드 v4 Phase 1~7 / 5/5 SEASON2 PDF vs DB / 5/5 onboarding 10단계 합의 / 5/5 인증 흐름 재설계 옵션 A+B-PR1 `7f26b6f` `60e8468` `61e9ab1` `5fd1716` `d8bba4a` `eb015aa` → main `3f016c9` (로그인 hard reload + getAuthUser 단일 헬퍼 + 쿠키 자동 cleanup) / 5/5 SEASON2 출전 명단 정비 4건 DB UPDATE / 5/6 UI fix 13건 + apiError 일괄 fix / 5/7 envelope 8회 `7945452` — 모두 5/7 main 21회 누적의 baseline) — 복원: git log -- .claude/scratchpad.md -->
