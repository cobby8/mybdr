/**
 * 로그인 redirect 흐름 공통 헬퍼.
 *
 * 2026-05-12 신규 — 비로그인 → 보호 페이지 → 로그인 → 원래 페이지 자동 복귀 흐름 통합.
 *
 * 왜 (이유):
 *   - 기존에 admin/tournament-admin layout 은 `redirect("/login")` 만 호출 → 로그인 후 무조건 홈으로 이동.
 *   - guest-apply / report 페이지는 각자 다른 쿼리명 (`next=`, `returnTo=`) 사용 → 로그인 페이지는
 *     `redirect=` 만 읽으므로 사일런트 무시 (사용자 결과: 홈 복귀).
 *   - 분산된 isValidRedirect 함수가 여러 파일에 중복 (login/page.tsx, api/auth/login/route.ts) — 단일 source 필요.
 *
 * 방법 (어떻게):
 *   - 모든 진입점이 본 헬퍼 3 개 함수 (`isValidRedirect` / `buildLoginRedirect` / `safeRedirect`) 만 사용.
 *   - 쿼리 파라미터명 = `redirect` 1 개로 통일 (기존 `next` / `returnTo` 제거).
 *
 * 보안 가드 (open redirect 방어):
 *   - 외부 URL (`https://evil.com`) 차단
 *   - protocol-relative URL (`//evil.com`) 차단
 *   - 로그인 페이지 자체 (`/login...`) 차단 → 무한 루프 방지
 *   - API 경로 (`/api/...`) 차단 → 사용자가 도달해도 의미 없음
 *   - 2000자 초과 차단 (비정상 긴 URL 거부)
 */

const REDIRECT_QUERY_KEY = "redirect" as const;

/**
 * redirect 경로 유효성 검증.
 *
 * @returns true 면 사용자에게 안전한 내부 경로 — false 면 차단 (fallback 처리).
 *
 * 차단 케이스:
 *   - null / undefined / 빈 문자열 / 비문자열
 *   - 비정상 긴 URL (>2000자)
 *   - 절대 경로 아님 (`/` 로 시작 안 함)
 *   - protocol-relative URL (`//evil.com` 형태 — 브라우저가 외부로 인식)
 *   - 로그인 페이지 자체 (`/login` 또는 `/login?...`)
 *   - API 경로 (`/api/...`)
 */
export function isValidRedirect(path: string | null | undefined): path is string {
  // 타입 가드 — null / undefined / 비문자열 차단
  if (!path) return false;
  if (typeof path !== "string") return false;
  // 비정상 긴 URL 차단 (DoS / 로그 오염 방지)
  if (path.length > 2000) return false;
  // 절대 경로만 허용
  if (!path.startsWith("/")) return false;
  // protocol-relative URL 차단 — `//evil.com` 은 브라우저가 외부 호스트로 해석
  if (path.startsWith("//")) return false;
  // 로그인 페이지 자체 차단 — 로그인 후 다시 로그인 페이지로 보내면 무한 루프
  if (path === "/login" || path.startsWith("/login?") || path.startsWith("/login/")) {
    return false;
  }
  // API 경로 차단 — 사용자가 도달해도 의미 없음
  if (path.startsWith("/api/")) return false;
  return true;
}

/**
 * 현재 경로 + 쿼리스트링을 안전하게 인코딩하여 로그인 URL 빌드.
 *
 * @example
 *   buildLoginRedirect("/tournament-admin/tournaments/123/wizard")
 *   → "/login?redirect=%2Ftournament-admin%2Ftournaments%2F123%2Fwizard"
 *
 *   buildLoginRedirect("/games/abc/guest-apply", "?source=card")
 *   → "/login?redirect=%2Fgames%2Fabc%2Fguest-apply%3Fsource%3Dcard"
 *
 * @returns 유효한 경로면 `/login?redirect=...` — 무효하면 `/login` (쿼리 없음).
 */
export function buildLoginRedirect(
  currentPath: string,
  currentSearch?: string | URLSearchParams | null,
): string {
  // 쿼리스트링 정규화 — string 이든 URLSearchParams 든 ? 접두 보장
  let searchPart = "";
  if (currentSearch) {
    if (typeof currentSearch === "string") {
      // 빈 문자열 / "?" 단독은 무시
      if (currentSearch.length > 0 && currentSearch !== "?") {
        searchPart = currentSearch.startsWith("?") ? currentSearch : `?${currentSearch}`;
      }
    } else {
      // URLSearchParams — toString() 이 빈 문자열이면 "?" prefix 도 추가 ❌
      const s = currentSearch.toString();
      if (s.length > 0) {
        searchPart = `?${s}`;
      }
    }
  }

  const fullPath = `${currentPath}${searchPart}`;

  // 무효 경로면 redirect 쿼리 없이 /login 으로 fallback (로그 무의미 데이터 차단)
  if (!isValidRedirect(fullPath)) {
    return "/login";
  }

  // 정상 — encodeURIComponent 로 안전 인코딩 (한글 / 특수문자 대비)
  return `/login?${REDIRECT_QUERY_KEY}=${encodeURIComponent(fullPath)}`;
}

/**
 * 사용자 입력 / 쿼리 / 쿠키에서 받은 redirect 값을 정리.
 *
 * @example
 *   safeRedirect("/tournament-admin/...")  → "/tournament-admin/..."
 *   safeRedirect("https://evil.com")       → "/" (기본 fallback)
 *   safeRedirect(null, "/dashboard")        → "/dashboard"
 *
 * @returns 유효하면 그대로 — 무효하면 fallback (기본 "/").
 */
export function safeRedirect(input: string | null | undefined, fallback = "/"): string {
  return isValidRedirect(input) ? input : fallback;
}

/**
 * 쿼리스트링에서 안전한 redirect 경로를 추출.
 *
 * 2026-05-12 신규 — proxy.ts 가 비로그인 보호 페이지 접근 시 `/login?callbackUrl=...` 으로 redirect
 * 하는데, 로그인 페이지/액션은 `redirect` 만 읽음 → 운영 사고 (사용자가 보호 페이지 진입 후 로그인
 * 했는데 홈으로 복귀, 원래 페이지 못 감).
 *
 * 왜 (이유):
 *   - proxy.ts (Next.js middleware 자리) 의 `callbackUrl` 쿼리 박제는 NextAuth 컨벤션을 그대로
 *     채택한 흔적. 본 프로젝트의 redirect 통합 (2026-05-12) 후에도 proxy.ts 는 callbackUrl 사용.
 *   - 모든 호출처에서 `redirect` 우선 / `callbackUrl` 폴백 패턴이 일관되게 적용되어야 사일런트
 *     무시 사고 영구 차단.
 *
 * 방법 (어떻게):
 *   - `redirect` 우선 시도 → 무효 시 `callbackUrl` 시도 → 둘 다 무효면 null.
 *   - 각 후보값은 isValidRedirect 검증 후 통과한 값만 반환 (open redirect 방어 동일 적용).
 *
 * @example
 *   // /login?redirect=%2Fadmin
 *   extractRedirectFromQuery(searchParams) → "/admin"
 *
 *   // /login?callbackUrl=%2Ftournament-admin (proxy.ts 흐름)
 *   extractRedirectFromQuery(searchParams) → "/tournament-admin"
 *
 *   // 둘 다 없거나 무효
 *   extractRedirectFromQuery(searchParams) → null
 *
 * @param searchParams URLSearchParams 또는 동등 인터페이스 (`{ get: (k) => string | null }`).
 * @returns 유효한 경로 문자열 — 둘 다 무효면 null.
 */
export function extractRedirectFromQuery(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
): string | null {
  // redirect 우선 (본 프로젝트 표준 쿼리명)
  const primary = searchParams.get("redirect");
  if (isValidRedirect(primary)) return primary;
  // callbackUrl 폴백 — proxy.ts 가 박제한 NextAuth 호환 쿼리명
  const fallback = searchParams.get("callbackUrl");
  if (isValidRedirect(fallback)) return fallback;
  return null;
}

/**
 * FormData 같은 평면 키-값 인터페이스에서 안전한 redirect 경로 추출.
 *
 * 본 프로젝트 server action(loginAction) 이 FormData 를 받아 redirect/callbackUrl 둘 중 어떤
 * 키로 들어와도 처리하도록 별도 분리.
 *
 * @param getValue 키별 값 반환 함수 — `(key) => formData.get(key) as string | null` 같은 시그니처.
 */
export function extractRedirectFromValues(
  getValue: (key: string) => string | null,
): string | null {
  const primary = getValue("redirect");
  if (isValidRedirect(primary)) return primary;
  const fallback = getValue("callbackUrl");
  if (isValidRedirect(fallback)) return fallback;
  return null;
}

export { REDIRECT_QUERY_KEY };
