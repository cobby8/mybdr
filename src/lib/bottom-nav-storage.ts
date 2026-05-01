/* ============================================================
 * bottom-nav-storage — BottomNav 슬롯 상태 (localStorage 기반)
 *
 * 왜 (2026-05-01 신설 — 사용자 결정 C3):
 *  - 시안 v2.3 의 모바일 fixed BottomNav (5슬롯 + 카탈로그 14항목) 풀 도입.
 *  - DB/API 0 변경 — 사용자별 슬롯 선호는 localStorage 만 사용.
 *  - 시안 components.jsx L398-486 의 BOTTOM_NAV_CATALOG / BOTTOM_NAV_DEFAULT /
 *    getBottomNavSlots / setBottomNavSlots 를 mybdr Next.js 환경으로 이식.
 *
 * 어떻게:
 *  - SSR 환경: typeof window 가드 — Next.js App Router 의 기본 SSR 실행 시
 *    localStorage 접근 시 ReferenceError 발생 방지.
 *  - 카탈로그 14항목: 9 메인 탭 (홈/경기/대회/단체/팀/코트/랭킹/커뮤니티/마이) + 5 보조 (일정/보관함/쪽지/심판/결제).
 *    가짜링크 4건 (gameResult/gameReport/guestApps/referee) 제외 — 13 룰 #5.
 *  - CustomEvent "mybdr:bottomNavChange": Settings 편집기 ↔ BottomNav 동기화.
 *  - storage 이벤트: 다른 탭에서 변경 시 동기화.
 *
 * 박제 룰 준수:
 *  - 13 룰 #5: 가짜링크 4건 카탈로그에서 제외 ✅
 *  - 13 룰 #6: 9 메인 탭 + 5 보조 = 14 항목 ✅
 *  - 13 룰 #11: SSR hydration mismatch 방지 (window 가드) ✅
 *  - 13 룅 #12: DB/API 0 변경 ✅
 * ============================================================ */

// 카탈로그 항목 타입 — id (저장 키), label (시안 라벨), icon (Material Symbols 이름), href (Next.js 라우트), match (활성 패턴)
export interface BottomNavCatalogItem {
  id: string;
  label: string;
  // Material Symbols Outlined 아이콘 이름 (CLAUDE.md: lucide-react 금지)
  icon: string;
  // 클릭 시 이동할 운영 라우트 (Next.js href)
  href: string;
  // 현재 pathname 이 이 패턴들 중 하나로 시작하면 활성으로 표시. 정규식 X (시작 매치만).
  match: string[];
}

/* 카탈로그 14 항목.
 *
 * 9 메인 탭 (시안 AppNav 메인 9 탭 1:1 매칭) + 5 보조.
 *
 * 가짜링크 4건은 제외 — 13 룰 #5:
 *  - gameResult / gameReport / guestApps / referee
 */
export const BOTTOM_NAV_CATALOG: ReadonlyArray<BottomNavCatalogItem> = [
  // 9 메인 탭 (AppNav 와 동일 순서)
  { id: "home",     label: "홈",       icon: "home",              href: "/",              match: ["/"] },
  { id: "games",    label: "경기",     icon: "sports_basketball", href: "/games",         match: ["/games"] },
  { id: "match",    label: "대회",     icon: "emoji_events",      href: "/tournaments",   match: ["/tournaments"] },
  { id: "orgs",     label: "단체",     icon: "corporate_fare",    href: "/organizations", match: ["/organizations"] },
  { id: "team",     label: "팀",       icon: "groups",            href: "/teams",         match: ["/teams"] },
  { id: "court",    label: "코트",     icon: "location_on",       href: "/courts",        match: ["/courts"] },
  { id: "rank",     label: "랭킹",     icon: "leaderboard",       href: "/rankings",      match: ["/rankings"] },
  { id: "board",    label: "커뮤니티", icon: "forum",             href: "/community",     match: ["/community"] },
  { id: "profile",  label: "마이",     icon: "person",            href: "/profile",       match: ["/profile"] },
  // 5 보조 (시안 components.jsx 와 1:1)
  { id: "calendar",    label: "일정",   icon: "calendar_month", href: "/calendar",        match: ["/calendar"] },
  { id: "saved",       label: "보관함", icon: "bookmark",       href: "/saved",           match: ["/saved"] },
  { id: "messages",    label: "쪽지",   icon: "mail",           href: "/messages",        match: ["/messages"] },
  { id: "refereeInfo", label: "심판",   icon: "sports",         href: "/referee-info",    match: ["/referee-info"] },
  { id: "billing",     label: "결제",   icon: "credit_card",    href: "/profile/payments", match: ["/profile/payments", "/pricing"] },
] as const;

// 기본 5슬롯 (시안 BOTTOM_NAV_DEFAULT 와 동일)
export const BOTTOM_NAV_DEFAULT: ReadonlyArray<string> = [
  "home",
  "games",
  "match",
  "board",
  "profile",
] as const;

// localStorage 키 — 시안과 동일 (호환성 위해)
export const BOTTOM_NAV_KEY = "mybdr.bottomNav";

// CustomEvent 이름 — Settings 편집기 ↔ BottomNav 동기화용
export const BOTTOM_NAV_CHANGE_EVENT = "mybdr:bottomNavChange";

/**
 * 현재 저장된 슬롯 ID 배열을 반환.
 * SSR 환경에서는 BOTTOM_NAV_DEFAULT 반환 (window 가드).
 * 저장된 값이 5개가 아니거나 손상 시 기본값으로 fallback.
 */
export function getBottomNavSlots(): string[] {
  // SSR 환경 가드 — hydration mismatch 방지
  if (typeof window === "undefined") {
    return [...BOTTOM_NAV_DEFAULT];
  }
  try {
    const raw = window.localStorage.getItem(BOTTOM_NAV_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // 배열 + 길이 1~5 + 모두 카탈로그에 존재해야 유효
      if (
        Array.isArray(parsed) &&
        parsed.length >= 1 &&
        parsed.length <= 5 &&
        parsed.every(
          (id) =>
            typeof id === "string" &&
            BOTTOM_NAV_CATALOG.some((c) => c.id === id),
        )
      ) {
        return parsed;
      }
    }
  } catch {
    // JSON parse / localStorage 오류 시 fallback
  }
  return [...BOTTOM_NAV_DEFAULT];
}

/**
 * 슬롯 ID 배열을 저장 + 변경 이벤트 dispatch.
 * SSR 환경에서는 no-op (window 가드).
 */
export function setBottomNavSlots(slots: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BOTTOM_NAV_KEY, JSON.stringify(slots));
    // 같은 탭 내 동기화 (storage 이벤트는 다른 탭에만 발생하므로 CustomEvent 도 dispatch)
    window.dispatchEvent(new CustomEvent(BOTTOM_NAV_CHANGE_EVENT));
  } catch {
    // localStorage 오류 무시 (private mode / quota 초과 등)
  }
}

/**
 * 카탈로그에서 id 로 항목 찾기. 없으면 카탈로그 첫 항목 fallback.
 */
export function findCatalogItem(id: string): BottomNavCatalogItem {
  return (
    BOTTOM_NAV_CATALOG.find((c) => c.id === id) ?? BOTTOM_NAV_CATALOG[0]
  );
}

/**
 * 현재 pathname 에 매칭되는 슬롯 id 를 반환 (활성 표시용).
 * 가장 긴 prefix match 우선 (예: /profile/payments 는 billing 이 우선, profile 보다).
 */
export function findActiveSlotId(
  pathname: string,
  slots: ReadonlyArray<string>,
): string | null {
  let bestMatch: { id: string; length: number } | null = null;
  for (const id of slots) {
    const item = BOTTOM_NAV_CATALOG.find((c) => c.id === id);
    if (!item) continue;
    for (const pattern of item.match) {
      // pathname 이 pattern 으로 시작하거나, pattern === "/" 인 경우 정확히 "/" 만 매치
      const matches =
        pattern === "/"
          ? pathname === "/"
          : pathname === pattern || pathname.startsWith(pattern + "/");
      if (matches) {
        if (!bestMatch || pattern.length > bestMatch.length) {
          bestMatch = { id, length: pattern.length };
        }
      }
    }
  }
  return bestMatch?.id ?? null;
}
