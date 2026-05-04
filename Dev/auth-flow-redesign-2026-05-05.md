# 인증/세션/쿠키 흐름 전체 조사 + 재설계 안 (2026-05-05)

> 작성: planner-architect / 코드 변경 X / 조사 + 분석 + 재설계 옵션만
> 트리거: 5/5 사용자 신고 — 콘솔 `/api/web/me` 401 ×2 재발 + "탈퇴 회원 쿠키 이슈 해결 안 됐다" 평가 + 14건 fix 누적 충돌 의심
>
> 비유: **건물(웹사이트)에 들어오는 사람의 출입증(쿠키) 검사 시스템.** 지금까지는 입구마다 경비 (가드) 가 따로 있고, 어떤 경비는 출입증만 보고 (JWT) / 어떤 경비는 출입증 + 사원증 DB 까지 본다 (status). 하루에 14번 경비 룰이 바뀌어서 누가 무엇을 검사하는지 헷갈리는 상태.

---

## 0. 핵심 등장 요소

| 요소 | 위치 | 역할 |
|------|------|------|
| `WEB_SESSION_COOKIE` | `src/lib/auth/web-session.ts:11` | httpOnly JWT 쿠키. dev=`bdr_session` / prod=`__Host-bdr_session` |
| `getWebSession()` | `src/lib/auth/web-session.ts:17` | 쿠키 → JWT verify → payload (DB 조회 X) |
| `proxy.ts` | `src/proxy.ts:82` | Next.js middleware. JWT 검증만 (DB X). PROTECTED_PATHS = `/profile /notifications /admin /community/new ...` |
| `(web)/layout.tsx` | server component | force-dynamic + getWebSession + DB status 검증 + initialUser prop 주입 |
| `(web)/login/layout.tsx` | server component | session 있고 status==="active" 이면 `/` redirect |
| `(web)/profile/layout.tsx` | server component | session 없거나 status==="withdrawn" 이면 `/login` redirect |
| `(web)/signup/layout.tsx` | metadata 만 — **인증 가드 0** |
| `/api/web/me` | route handler | 옵션 B: 비로그인 = 200 + {id:null} / 탈퇴 = 401 / 정상 = 풀 데이터 |
| `/api/web/logout` | route handler | response.cookies.set 패턴 (Set-Cookie 명시) |
| `/api/auth/logout` | route handler | 카카오 분기 + redirect → response.cookies.set |
| `loginAction` | server action | bcrypt + cookies().set + return success (redirect X) |
| `signupAction` | server action | 시작부 cookies().delete + 가입 + redirect("/login?signup=success") |
| `withdrawAction (DELETE)` | route handler | bcrypt + status="withdrawn" + email 익명화 + cookies().delete |
| `handleOAuthLogin` | `src/lib/auth/oauth.ts` | provider+uid OR email 매칭 → 탈퇴 차단 → cookies().set + redirect |

---

## 1. 현재 흐름 매핑 — 4 케이스 × 5 시나리오 매트릭스

### 1-1. 케이스 정의

| 케이스 | 쿠키 | JWT verify | DB user | 의도 동작 |
|--------|------|-----------|---------|----------|
| A. 비로그인 | 없음 | — | — | 로그인 페이지 노출 + 익명 콘텐츠 |
| B. 정상 회원 | 있음 | OK | status="active" | 모든 기능 사용 |
| C. 탈퇴 회원 + JWT 잔존 | 있음 (7~30일) | OK | status="withdrawn" | 비로그인처럼 처리 + 안내 |
| D. DB 미존재 + JWT 잔존 | 있음 | OK | NULL (관리자 hard delete 등) | 비로그인처럼 처리 |

### 1-2. 시나리오 × 케이스 동작 표 (실제 코드 기반)

| 시나리오 | A 비로그인 | B 정상 | C 탈퇴+쿠키 | D 미존재+쿠키 |
|---------|-----------|--------|-------------|---------------|
| **1) 홈(/) 진입** | layout SSR `session=null` → initialUser=null → 비로그인 헤더. `/api/web/me` 호출 시 **200 + {id:null}** (옵션 B). | layout SSR DB SELECT → initialUser={nickname,...} → 로그인 헤더. me API = 풀 데이터 | layout SSR DB SELECT → status==="withdrawn" → initialUser=null → **비로그인 헤더 정상**. me API = **401** (탈퇴 분기) | layout SSR DB SELECT → user=null → initialUser=null → 비로그인 헤더. me API = `user=null` 분기 통과 후 **status 검증 없음** → adminInfo=null + nickname=null fallback session.name → 잘못된 응답 가능성 |
| **2) /login 진입** | login layout: session=null → 통과 → 로그인 페이지 노출 ✅ | login layout: session+status="active" → `/` redirect ✅ | login layout: session+status="withdrawn" → isActiveUser=false → 통과 → 로그인 페이지 노출 ✅ (fa5bd90 fix) | login layout: session+user=null → catch 분기 isActiveUser=false → 통과 → 로그인 페이지 노출 ✅ |
| **3) 로그인 시도** | loginAction → DB user 검증 → cookies.set + return success → 클라이언트 hard reload | 동일 (다른 계정 로그인 가능) | 동일 (loginAction 안에서 status="withdrawn" → "탈퇴한 계정입니다" 에러) | 동일 (다른 계정 로그인 = 새 쿠키로 덮어쓰기) |
| **4) 로그아웃** | (불가) | `/api/web/logout` POST → response.cookies.set maxAge:0 + 클라 리로드. `/api/auth/logout` GET = 카카오 추가 분기 | logoutAction (server action) → cookies.delete + revalidatePath + redirect("/login") | 동일 |
| **5) 새로고침** | 동일 시나리오 1 | 동일 시나리오 1 | 동일 시나리오 1 — **콘솔에 401 노출** (탈퇴 분기) | 시나리오 1 D — **layout 가드 정상이지만 me API 응답이 status 미검증** |

### 1-3. 가드 4개소 — 4 케이스 동작 일관성 검증

| 가드 위치 | A 비로그인 | B 정상 | C 탈퇴+쿠키 | D 미존재+쿠키 |
|----------|----------|--------|-------------|---------------|
| `proxy.ts` (middleware) | PROTECTED_PATHS 매칭 시 → /login (그 외 통과) | JWT verify OK → 통과 | JWT verify OK → 통과 (**status 검증 X**) | JWT verify OK → 통과 (**DB 검증 X**) |
| `(web)/layout.tsx` | initialUser=null | initialUser={...} | initialUser=null (헤더만) | initialUser=null |
| `(web)/login/layout.tsx` | 통과 | / redirect | 통과 (login 노출) | 통과 |
| `(web)/profile/layout.tsx` | /login redirect | 통과 | /login?withdrawn=expired | /login?withdrawn=expired |
| `(web)/signup/layout.tsx` | **가드 0** (metadata만) | **가드 0** | **가드 0** | **가드 0** |
| `/api/web/me` | 200 + {id:null} | 200 + 풀 데이터 | **401** (탈퇴 분기) | 200 + 부분 데이터 (status 검증 X) |
| `withWebAuth` 다른 web API (notifications 등) | 401 | 통과 | **통과** (status 검증 X) | **통과** (DB 검증 X) |

**불일치 발견**:
- `proxy.ts` 가 `/profile` 보호하지만 status="withdrawn" 검증은 layout 의무. **profile layout 이 fa5bd90 같은 회귀 발생할 가능성 높음**.
- `withWebAuth` 자체가 status 검증 0 — 탈퇴 회원이 다른 web API (예: `/api/web/notifications`, `/api/web/profile`) 직접 호출 시 통과한다.
- `signup` 진입 시 **이미 로그인된 정상 회원**도 signup 폼 노출. signupAction 시작부에서 cookies.delete 처리되지만, **가입 폼을 본 시점 = 다른 사용자 세션 그대로**. UX 함정.

---

## 2. 누적 fix 14건 분석 — 해결 / 죽은 코드 / 충돌

### 2-1. fix 카탈로그 + 분류

| # | 커밋 | 영역 | 케이스 | 상태 |
|---|------|------|--------|------|
| 1 | 4c6dcd3 | (web)/layout force-dynamic | A,B (캐시 stale) | ✅ 활성 |
| 2 | 9c682d8 | ProfileCtaCard 401 차단 (자체 fetcher) | A,C (콘솔 401) | ⚠️ **중복** (4번과 |
| 3 | 31b060c | hydration #418 + me 옵션 B | A (SSR/CSR mismatch) | ✅ 활성 (단 콘솔 401 노출은 미해결) |
| 4 | 2284212 | swr-provider 글로벌 fetcher 401→null | A,C (콘솔 401) | ✅ 활성 |
| 5 | 19d6d9c | signup 시작부 cookies.delete | B→A (다른 계정 가입) | ✅ 활성 |
| 6 | 06d1376 | 탈퇴 후 hard reload | C (탈퇴 직후 화면 미반영) | ✅ 활성 |
| 7 | b3c3ede | (web)/layout status 가드 | C (헤더 잘못 표시) | ✅ 활성 |
| 8 | 7437d27 | loginAction 메시지 + me API 401 분기 | C (탈퇴 회원 응답 차단) | ✅ 활성 |
| 9 | 8c95565 | OAuth 3 callback 탈퇴 가드 + email 정리 | C (재로그인 / 재가입) | ✅ 활성 |
| 10 | 66da645 | 탈퇴 회원 email anonymize | C (재가입 차단 회피) | ✅ 활성 |
| 11 | 164f307 | /api/web/logout response.cookies.set | B (로그아웃 후 잔존) | ✅ 활성 |
| 12 | 9a9d413 | web-layout-inner `if (u && u.id)` 검증 | A,C (옵션 B 후속) | ✅ 활성 |
| 13 | fa5bd90 | (web)/login/layout status 가드 | C (로그인 진입 차단 회귀) | ✅ 활성 |
| 14 | 7f26b6f | loginAction redirect → success+hard reload | B (가입 후 SSR 캐시) | ✅ 활성 |

### 2-2. 충돌 / 중복 / 죽은 코드 의심

#### **(A) 중복 — fix 2 vs fix 4 (ProfileCtaCard 자체 fetcher vs 글로벌 fetcher)**

- fix 4 (2284212) 가 swr-provider 글로벌 fetcher 에 401→null 처리 + retry 차단 적용.
- fix 2 (9c682d8) 는 ProfileCtaCard 가 **자체 `fetchMeOrNull` 정의 + useSWR 에 별도 옵션 (shouldRetryOnError:false 등) 명시 주입**.
- 결과: ProfileCtaCard 가 글로벌 fetcher 우회. 다른 컴포넌트 (ProfileCompletionBanner / profile-widget) 는 글로벌 fetcher 사용.
- **dedupingInterval cache key 는 같지만 fetcher 함수가 다르면 SWR 이 별도 캐시 entry 로 인식할 가능성** (SWR 의 cache key = url + serializeFetcher 가능). 즉 **두 컴포넌트가 me API 를 중복 호출** = 콘솔 401 ×2 의 진짜 원인 후보.
- **권고**: ProfileCtaCard 에서 자체 fetcher 제거 → 글로벌 fetcher 위임. fix 2 = **dead code 후보**.

#### **(B) 의도된 분기 차이 — me API 옵션 B (200) vs 탈퇴 (401)**

- 비로그인 = 200 + {id:null} / 탈퇴 = 401 / 정상 = 200 풀.
- 클라이언트 처리:
  - 글로벌 fetcher (fix 4): 401 → null. 비로그인이든 탈퇴든 동일 결과 (data=null) → **콘솔 401 만 노이즈**.
  - web-layout-inner (fix 12): `if (u && u.id)` → 비로그인/탈퇴 모두 setUser(null) → **동작 동일**.
- 결론: **콘솔 401 = 기능적으로는 정상 처리 + 콘솔 노이즈만**. 사용자 신고 "401 ×2" = 탈퇴 회원 쿠키 잔존 케이스에서 chunk 2곳 (글로벌 fetcher 캐시 + ProfileCtaCard 자체 fetcher 캐시) 별도 호출 결과.
- **분기 차이 자체가 dead code 는 아니지만**, 옵션 B 와 401 두 분기가 한 endpoint 안에 공존 = 클라이언트 코드 일관성 부담. **재설계 시 통일 권장**.

#### **(C) SSR initialUser vs client useEffect — 결과 일치성**

- SSR (web)/layout.tsx: status 검증 ✅ → C 케이스 = initialUser=null
- Client useEffect (web-layout-inner.tsx): me API → 401 → setUser(null)
- **SSR 와 client 결과 동일 → flash 0 ✅**.
- 단, 비로그인 (A) 케이스: SSR initialUser=null / Client me API 200+{id:null} → `if (u && u.id)` false → setUser(null) → **결과 동일**.
- 결론: **fix 12 (9a9d413) + fix 7 (b3c3ede) 조합이 정상 작동**. 다만 **fix 12 가 옵션 B 후속이라 fix 7 보다 시간상 뒤** — 두 fix 가 함께 있어야 정상.

#### **(D) signup 가드 누락 — 잠재적 함정**

- signupAction 은 시작부에서 cookies.delete 하지만 **signup 페이지 자체 가드 0**.
- 사용자가 다른 계정으로 로그인된 상태에서 `/signup` 진입 = 헤더는 기존 사용자 닉네임 + 본문은 가입 폼. **혼란 UX**.
- 회귀 가능성: 사용자가 가입 폼을 보고 닫으면 기존 세션 그대로. submit 시점에만 정리.
- **권고**: signup layout 에 fa5bd90 패턴과 대칭 가드 추가 (이미 로그인 = `/` redirect 또는 confirm 다이얼로그).

#### **(E) `withWebAuth` 의 status 검증 부재**

- 탈퇴 회원 JWT 잔존 시 `/api/web/notifications`, `/api/web/profile` 등 **모든 web API 가 통과**.
- me API 만 status="withdrawn" → 401 분기. 다른 web API 는 부분 응답 가능.
- 위험도 = 중. 실제 데이터 노출 (notifications 같은 경우 = withdrawn 사용자의 알림은 비어있으므로 영향 0). 그러나 일관성 부재.

---

## 3. 콘솔 401 진짜 원인 분석

### 3-1. 신고 사실
- 콘솔: `/api/web/me` 401 (Unauthorized) ×2
- chunk 2곳: `5f1261d33f7a2038.js:3` / `cf8d2fb1b9cd057b.js:1`
- 화면: 비로그인 헤더 정상 (탈퇴 회원 보호 작동 ✅)

### 3-2. me API 호출 위치 grep 결과 (홈 페이지 진입 시)

| 호출자 | 경로 | fetcher | dedupingInterval |
|--------|------|---------|------------------|
| `web-layout-inner.tsx:49` | (web)/layout 모든 페이지 | 직접 fetch (raw) | (1회만 — useEffect mount) |
| `home-hero.tsx:59` | 홈 hero 영역 | 직접 fetch (raw) | (1회만) |
| `home-greeting.tsx:24` | 홈 greeting | 직접 fetch (raw) | (1회만) |
| `home-sidebar.tsx:44` | 홈 sidebar | 직접 fetch (raw) | (1회만) |
| `profile-widget.tsx:60` | 홈 사이드 위젯 | useSWR + 글로벌 fetcher | 30s |
| `profile-completion-banner.tsx:159` | 홈 상단 배너 | useSWR + 글로벌 fetcher | 30s |
| `profile-cta-card.tsx:55` | 홈 상단 CTA | useSWR + **자체 fetcher** | 30s |
| `header.tsx:51` | (legacy) shared header | 직접 fetch | (1회만) |
| `referee-shell.tsx:129` | (referee) | 직접 fetch | (1회만) |

**총 9개 호출처**. 홈 진입 시 활성 = web-layout-inner + home-hero + home-greeting + home-sidebar + profile-widget + profile-completion-banner + profile-cta-card = **7개**.

### 3-3. SWR dedup vs 직접 fetch

- useSWR + 글로벌 fetcher: profile-widget + profile-completion-banner = **dedupingInterval 30s + 같은 fetcher → 1회만 호출** ✅
- useSWR + 자체 fetcher: profile-cta-card = **fetcher 다르므로 캐시 entry 별도 → 추가 1회 호출** ⚠️
- 직접 fetch (useEffect): web-layout-inner + home-hero + home-greeting + home-sidebar = **각 컴포넌트 mount 시 1회씩 = 총 4회**

### 3-4. 콘솔 401 ×2 의 진짜 출처 (추정)

탈퇴 회원 케이스에서 me API 가 401 반환. 호출 7개 중 **이 401 을 콘솔에 노출하는 호출**:
- 글로벌 fetcher: 401 → null 처리, **콘솔 GET 자체는 노출** (브라우저 default behavior, fetch 가 throw 하지 않으므로 catch X — but 콘솔 Network 탭 + 일부 JS 콘솔에 표기)
- 자체 fetcher: 동일 (401 → null + 콘솔 GET 표기)
- 직접 fetch (raw): `if (r.ok)` 분기 → null. 콘솔 GET 표기 + console.error 없음.

**chunk 2곳 = 압축된 빌드 파일 hash 다른 chunk 2개. 추정**:
- chunk A (`5f1261d33f7a2038.js:3`) = SWR 사용 컴포넌트 군 (profile-widget / profile-completion-banner / profile-cta-card 통합 chunk) — useSWR 내부 fetch 로깅
- chunk B (`cf8d2fb1b9cd057b.js:1`) = 직접 fetch 사용 컴포넌트 군 (web-layout-inner / home-hero / home-greeting / home-sidebar 중 하나 또는 통합)

**즉**:
- 401 자체 = **탈퇴 회원 분기에서 의도적으로 반환** (fix 8 = 7437d27).
- 클라이언트 = 401 → null 정상 처리 (fix 4 + fix 12).
- **콘솔 노출 = 브라우저 Network 패널의 default 동작 — 코드로 숨길 수 없음**.

**결론**: 콘솔 401 ×2 = **버그가 아니라 의도된 분기의 콘솔 노이즈**. 화면이 비로그인 헤더로 정상 표시되는 것이 그 증거. 단, 7개 호출처 중복은 비효율 — me API 1회로 통합 권고.

---

## 4. 재설계 안 — 옵션 비교

### 옵션 A. 현재 구조 유지 + 누락 가드 추가 (작은 변경)

**전제**: 14개 fix 의 본질은 살아있음. 누락 1~3개만 보완.

#### A-1. 변경 사항
1. `(web)/signup/layout.tsx` 가드 추가 (login/layout 패턴 대칭) — 이미 로그인 정상 회원 = `/` redirect.
2. `withWebAuth` 안에 status 검증 옵션 추가 (선택 — 모든 web API 일괄 보호) — `requireActiveStatus: true` 옵션.
3. me API 응답 통일 — 탈퇴 401 → 200 + {id:null} 로 변경 (옵션 B 통일). 콘솔 401 노이즈 제거.
4. ProfileCtaCard 자체 fetcher 제거 → 글로벌 fetcher 위임 (fix 2 dead code 회수).
5. 홈 페이지 me API 호출 통합 — 7개 → 1개 (Provider 패턴). **선택 사항** (별도 PR 가능).

#### A-2. 영향
- 영향 파일: 4~5개 (signup layout / web-session.ts / me/route.ts / profile-cta-card.tsx / 옵션: 홈 컴포넌트들)
- 영향 사용자: 0 (회귀 위험 낮음 — 추가 가드 + 콘솔 노이즈 제거)
- 회귀 위험: 낮음. me API 401 → 200 변경은 **기존 SWR 처리 path 유지** (data=null 동일).
- 작업량: 0.5d

#### A-3. 장단

| 장점 | 단점 |
|------|------|
| 기존 코드 보존 | 가드가 7개소 분산 (web/login/profile/signup/api/me/oauth/loginAction) — 신규 가드 추가 시 같은 패턴 반복 |
| 회귀 위험 낮음 | "재설계" 사용자 의도와 맞지 않을 수 있음 |
| 즉시 운영 적용 가능 | proxy.ts 가 status 검증 못함 (DB 조회 X) — 페이지 진입 시 layout 까지 가야 검증 |

---

### 옵션 B. 인증 흐름 전면 재설계 (큰 변경)

**전제**: 14건 fix 가 충돌/중복하므로 단일 진입점으로 통합.

#### B-1. 핵심 변경 — 단일 인증 헬퍼 `getAuthUser()`

```
getAuthUser(): {
  state: "anonymous" | "active" | "withdrawn" | "missing",
  session?: JwtPayload,
  user?: { id, nickname, status, ... },
}
```
- JWT verify + DB SELECT 1회 + status 분기를 **단일 함수로 캡슐화**.
- `unstable_cache` 또는 `React.cache` 로 동일 요청 내 dedup → DB 부담 0.

#### B-2. 가드 구조 단순화

| 가드 위치 | 역할 |
|----------|------|
| `proxy.ts` (middleware) | 그대로 (JWT 만 검증, PROTECTED_PATHS) |
| **`(web)/layout.tsx` 단일 가드** | `getAuthUser()` 호출 → state 별 분기 (anonymous/withdrawn/missing 모두 initialUser=null + 탈퇴 쿠키 자동 cleanup) |
| `(web)/login/layout.tsx` | state==="active" → / redirect (그 외 통과) |
| `(web)/signup/layout.tsx` | **신규 추가** 동일 패턴 |
| `(web)/profile/layout.tsx` | state!=="active" → /login redirect |
| `/api/web/me` | **단일 응답**: 항상 200, body={state, ...} (401 분기 제거) |
| `withWebAuth` | state!=="active" → 401 (모든 web API 일괄 보호) |
| OAuth callback | 그대로 (탈퇴 차단) |

#### B-3. 쿠키 자동 cleanup

- `getAuthUser()` 가 state==="withdrawn" 또는 "missing" 감지 시 **응답에 Set-Cookie maxAge:0 자동 첨부** (response 객체 mutation).
- 결과: **사용자가 한 번이라도 페이지 진입하면 잘못된 쿠키 자동 제거** → 5/5 신고 본질 해결.

#### B-4. me API 통합 응답

```json
{
  "state": "active" | "anonymous",
  "id": "123" | null,
  "nickname": "...",
  ...
}
```
- 클라이언트는 `me.state === "active"` 단일 분기로 판정.
- 401 분기 제거 → 콘솔 노이즈 0.

#### B-5. 영향
- 영향 파일: 8~12개 (web-session.ts / proxy.ts(선택) / 4개 layout / me/route.ts / withWebAuth / withdraw / 7개 me API 호출처 중 일부)
- 영향 사용자: 0 (백엔드 변경 + 클라이언트 호환 유지)
- 회귀 위험: 중. me API 응답 형식 변경 = 7개 호출처 모두 안전한지 사전 검증 필수.
- 작업량: 1.5~2d (PR1 = getAuthUser 도입 + 쿠키 cleanup / PR2 = me API 통일 + 호출처 점검 / PR3 = withWebAuth status 검증)

#### B-6. 장단

| 장점 | 단점 |
|------|------|
| 가드 7개소 → 단일 헬퍼 (재발 방지) | 작업량 큼 |
| 콘솔 401 노이즈 0 | me API 응답 형식 변경 = 호출처 안전성 점검 필수 (7개 위치) |
| 잘못된 쿠키 자동 cleanup → 사용자 신고 본질 해결 | unstable_cache / React.cache 검증 필요 |
| `withWebAuth` 일괄 보호 | 회귀 위험 중 (테스트 강화 필요) |
| 신규 가드 추가 시 1줄 (state 체크) | 단일 헬퍼 = 단일 장애점 (DB 실패 시 모든 가드 영향) — fallback 필수 |

---

## 5. 옵션 비교 표 + 권장

| 항목 | 옵션 A (작은 변경) | 옵션 B (전면 재설계) |
|------|-------------------|---------------------|
| 작업량 | 0.5d | 1.5~2d |
| 영향 파일 | 4~5개 | 8~12개 |
| 회귀 위험 | 낮음 | 중 |
| 사용자 본질 신고 (콘솔 401) | 부분 해결 (401→200 통일 시) | 완전 해결 (단일 응답) |
| 사용자 본질 신고 (탈퇴 쿠키) | 가드 추가만 → 사용자가 페이지 진입할 때 재차 차단 | **자동 cleanup → 1회 진입으로 영구 해결** |
| 14건 fix 정리 | dead code 1건 회수 | 가드 통합 → 14건 본질 단일화 |
| 향후 신규 가드 | 같은 패턴 7개소 반복 | 단일 헬퍼 1줄 |
| signup 가드 누락 | 추가 (옵션 A 도 처리) | 추가 (단일 헬퍼 위임) |

### 권장: **옵션 A 즉시 적용 + 옵션 B 별도 PR 분해**

**근거**:
1. 옵션 A 의 5개 변경은 서로 독립 → 점진 적용 가능. 즉시 콘솔 노이즈 + signup 가드 + dead code 정리.
2. 옵션 B 는 **사용자가 진짜 원하는 "재설계"** 와 맞지만 단일 PR 로 진행 시 회귀 위험 중. **PR1 (`getAuthUser` 도입)** + **PR2 (me API 통일)** + **PR3 (`withWebAuth` 강화)** 3단계 분해 권장.
3. 특히 옵션 B 의 **쿠키 자동 cleanup** 은 사용자 신고 ("탈퇴 회원 쿠키 이슈 해결 안 됐다") 의 본질 해결이라 **PR1 우선 진행** 가치 큼.
4. 옵션 A 만으로는 사용자가 **다른 브라우저에서 로그인 → 탈퇴 → 같은 브라우저 쿠키 잔존 케이스** 를 매번 layout 가드에 의존 — 옵션 B 의 cleanup 로 영구 해결.

### 추천 진행 순서

| 순서 | PR | 내용 | 작업 | 기여 |
|------|-----|------|------|------|
| 1 | A | signup 가드 + ProfileCtaCard fetcher 통일 + me API 401→200 통일 | 0.5d | 콘솔 노이즈 제거 + dead code 정리 |
| 2 | B-PR1 | `getAuthUser()` 단일 헬퍼 + 4개 layout 위임 + 쿠키 자동 cleanup | 0.5d | 사용자 신고 본질 해결 |
| 3 | B-PR2 | me API 응답 통일 + 7개 호출처 점검 | 0.5d | 클라이언트 일관성 |
| 4 | B-PR3 | `withWebAuth` status 검증 옵션 | 0.5d | 모든 web API 일괄 보호 |

총 2d. PR1 만으로도 **5/5 신고 핵심 해결**. PR2~4 는 follow-up.

---

## 6. 관련 파일 (절대 경로)

### 가드/세션 핵심
- `C:\0. Programing\mybdr\src\lib\auth\web-session.ts` — getWebSession + WEB_SESSION_COOKIE + withWebAuth
- `C:\0. Programing\mybdr\src\lib\auth\oauth.ts` — handleOAuthLogin (위임 단일점)
- `C:\0. Programing\mybdr\src\proxy.ts` — Next.js middleware (JWT 검증, PROTECTED_PATHS)

### 가드 layout
- `C:\0. Programing\mybdr\src\app\(web)\layout.tsx` — force-dynamic + status 가드
- `C:\0. Programing\mybdr\src\app\(web)\login\layout.tsx` — fa5bd90 status 가드
- `C:\0. Programing\mybdr\src\app\(web)\signup\layout.tsx` — **가드 0** (옵션 A 추가 대상)
- `C:\0. Programing\mybdr\src\app\(web)\profile\layout.tsx` — status 가드

### Server Actions / API
- `C:\0. Programing\mybdr\src\app\actions\auth.ts` — loginAction / signupAction / devLoginAction / logoutAction
- `C:\0. Programing\mybdr\src\app\api\web\me\route.ts` — 옵션 B + 401 분기 (재설계 핵심 대상)
- `C:\0. Programing\mybdr\src\app\api\web\logout\route.ts` — response.cookies.set 패턴
- `C:\0. Programing\mybdr\src\app\api\web\auth\withdraw\route.ts` — soft delete + email 익명화
- `C:\0. Programing\mybdr\src\app\api\auth\login\route.ts` — OAuth start
- `C:\0. Programing\mybdr\src\app\api\auth\logout\route.ts` — 카카오 분기 + redirect
- `C:\0. Programing\mybdr\src\app\api\auth\kakao\callback\route.ts` — 자체 callback (oauth.ts 미사용)
- `C:\0. Programing\mybdr\src\app\api\auth\google\callback\route.ts` — 자체 callback (oauth.ts 미사용)

### 클라이언트 (me API 호출 7개소 + 글로벌 fetcher)
- `C:\0. Programing\mybdr\src\components\providers\swr-provider.tsx` — 글로벌 fetcher 401→null
- `C:\0. Programing\mybdr\src\app\(web)\_layout\web-layout-inner.tsx` — fix 12 (id 검증)
- `C:\0. Programing\mybdr\src\components\home\profile-cta-card.tsx` — **자체 fetcher (dead code 후보)**
- `C:\0. Programing\mybdr\src\components\shared\profile-completion-banner.tsx` — useSWR
- `C:\0. Programing\mybdr\src\components\home\profile-widget.tsx` — useSWR
- `C:\0. Programing\mybdr\src\components\home\home-hero.tsx` — 직접 fetch
- `C:\0. Programing\mybdr\src\components\home\home-greeting.tsx` — 직접 fetch
- `C:\0. Programing\mybdr\src\components\home\home-sidebar.tsx` — 직접 fetch
- `C:\0. Programing\mybdr\src\components\shared\header.tsx` — 직접 fetch (legacy?)

### 미존재 (확인됨)
- `src/middleware.ts` — 없음 (proxy.ts 가 동등 역할)
- naver callback — `src/app/api/auth/naver/callback/route.ts` 없음 (oauth.ts handleOAuthLogin 미사용 또는 별도 파일 누락)

---

## 7. 결론 요약 (3줄)

1. **콘솔 401 ×2 = 탈퇴 회원 me API 의도된 분기 + chunk 2곳 (글로벌 fetcher / 자체 fetcher) 별도 호출**. 기능 정상, 노이즈만.
2. **14건 fix 중 13건은 활성 + 1건 (ProfileCtaCard 자체 fetcher) dead code 후보**. signup 가드 누락 = 잠재적 함정.
3. **권장 = 옵션 A 즉시 (0.5d) + 옵션 B 분해 PR1 (0.5d, 사용자 신고 본질)**. 옵션 B 가 진짜 "재설계" — `getAuthUser()` 단일 헬퍼 + 쿠키 자동 cleanup.

---

## 8. 근거 메모 (knowledge 박제 임시)

> **architecture.md 박제 항목 — 옵션 결정 후 PM 박제 예정**

### [2026-05-05] 인증/세션 흐름 박제 (현 시점)
- **분류**: architecture
- **발견자**: planner-architect
- **내용**:
  - 가드 5개소: `proxy.ts` (JWT 만) / `(web)/layout.tsx` (status 검증) / `(web)/login/layout.tsx` (fa5bd90 status 가드) / `(web)/profile/layout.tsx` (withdrawn → /login) / `/api/web/me` (옵션 B + withdrawn 401)
  - 가드 누락 1개소: `(web)/signup/layout.tsx` (metadata 만)
  - 쿠키 read/write: WEB_SESSION_COOKIE 11개소 (web-session.ts + 8 routes + 1 action). `cookies().set` (server action) vs `response.cookies.set` (route handler with redirect) 패턴 분리 — 후자가 안전 (164f307 fix 본질).
  - me API = 200 + {id:null} (비로그인) / 401 (탈퇴) / 200 풀 (정상). 옵션 B + 분기 차이 = 클라이언트 분기 부담.
  - withWebAuth = JWT verify 만, status 검증 0 → 탈퇴 회원의 다른 web API 호출 통과 가능 (실제 데이터 노출 위험 0 ~ 낮음).
  - me API 호출 7개소 (홈 진입 시) = 직접 fetch 4 + useSWR 글로벌 3 + useSWR 자체 1 (ProfileCtaCard, dead code 후보).
- **참조횟수**: 0

### [2026-05-05] 14건 fix 카탈로그 (planner)
- **분류**: decision
- **발견자**: planner-architect
- **내용**: fix 1~14 분류 = 활성 13 + dead code 1 (ProfileCtaCard 자체 fetcher). 충돌 0. 중복 1 (글로벌 fetcher vs 자체 fetcher). 누락 1 (signup 가드).
- **참조횟수**: 0
