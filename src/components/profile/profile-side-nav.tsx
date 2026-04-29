"use client";

/* ============================================================
 * ProfileSideNav — 프로필 서브페이지 네비게이션
 *
 * 왜:
 *  - /profile 하위 6개 서브페이지(edit/basketball/growth/preferences/subscription/weekly-report)를
 *    하나의 반응형 컴포넌트로 통합해, 어디서든 동일한 자리에서 좌측(데스크탑) 또는 상단(모바일)
 *    네비게이션이 보이게 한다.
 *  - 기존 (web)/layout.tsx의 sideNavItems 패턴(border-l-4 + bg-surface)을 그대로 따라
 *    BDR 전체 디자인 일관성 유지.
 *
 * 어떻게:
 *  - lg(1024px) 이상: 좌측 고정폭 aside, border-l-4 활성 표시.
 *  - lg 미만: sticky top-14(헤더 56px 바로 아래) 가로 스크롤 chip.
 *  - 활성 판정은 matchPaths 배열을 받아 다중 경로 매칭 (예: 설정 = preferences + notification-settings).
 * ============================================================ */

import Link from "next/link";
import { usePathname } from "next/navigation";

/* 네비게이션 항목 타입 정의
 * - matchPaths를 배열로 받는 이유: 한 메뉴가 여러 실제 경로를 포함할 수 있다
 *   (예: "설정" = /profile/preferences 와 /profile/notification-settings 둘 다 활성). */
type NavItem = {
  label: string;
  href: string;
  icon: string; // Material Symbols Outlined 이름
  matchPaths: string[];
  /* exactOnly: true 이면 matchPaths 는 정확 일치만 허용 (startsWith 하위 매칭 금지).
   * 왜: "내 정보" 가 /profile 을 포함하면 /profile/basketball 같은 하위 경로도 startsWith 로 걸려
   *    다른 네비 항목과 동시 활성되는 버그가 생긴다. /profile 처럼 루트 경로는 정확 일치만. */
  exactOnly?: boolean;
};

/* 그룹 정의.
 * 왜 그룹화: P1-C 통합 작업으로 항목이 9개로 늘면서 평면 나열은 가독성이 떨어진다.
 * - 4그룹(개인정보 / 활동 / 농구 / 설정·결제)으로 묶고 각 그룹에 라벨 헤더 부착.
 * - 모바일(<lg)에서는 라벨 숨김 + 가로 chip만 노출 (라벨까지 띄우면 chip 흐름 끊어짐). */
type NavGroup = {
  label: string;
  items: NavItem[];
};

/* 9개 서브페이지 매핑 — P1-C 통합 후.
 * 순서 원칙: 그룹 = 사용 빈도, 그룹 내부 = 사용자 멘탈 모델 우선. */
const NAV_GROUPS: NavGroup[] = [
  {
    label: "개인정보",
    items: [
      {
        label: "내 정보",
        // /profile 허브가 통합 대시보드("내 정보")이므로 href는 /profile.
        // /profile/edit 는 상세 편집 화면 — matchPaths에 포함해 둘 다 "내 정보" 활성.
        // exactOnly: true 필수 — 그렇지 않으면 /profile/basketball 등 하위 경로 전체가 startsWith("/profile/")에 걸려 오작동.
        href: "/profile",
        icon: "person",
        matchPaths: ["/profile", "/profile/edit"],
        exactOnly: true,
      },
      {
        // P1-C 추가: 프로필 완성도 페이지 (이전 진입점 0)
        label: "프로필 완성도",
        href: "/profile/complete",
        icon: "task_alt",
        matchPaths: ["/profile/complete"],
      },
    ],
  },
  {
    label: "활동",
    items: [
      {
        // W4 M4 "내 활동 통합 뷰"
        label: "내 활동",
        href: "/profile/activity",
        icon: "history",
        matchPaths: ["/profile/activity"],
      },
      {
        // P1-C 추가: 예약 이력 (이전 진입점 1 — 결제 실패에서만)
        label: "예약 이력",
        href: "/profile/bookings",
        icon: "event_note",
        matchPaths: ["/profile/bookings"],
      },
      {
        label: "주간 리포트",
        href: "/profile/weekly-report",
        icon: "summarize",
        matchPaths: ["/profile/weekly-report"],
      },
    ],
  },
  {
    label: "농구",
    items: [
      {
        label: "내 농구",
        href: "/profile/basketball",
        icon: "sports_basketball",
        matchPaths: ["/profile/basketball"],
      },
      {
        label: "내 성장",
        href: "/profile/growth",
        icon: "trending_up",
        matchPaths: ["/profile/growth"],
      },
    ],
  },
  {
    label: "설정·결제",
    items: [
      {
        label: "설정",
        // Day 8: 맞춤 설정 + 알림 설정을 /profile/settings 허브 (탭 2개)로 통합. href 는 허브 루트.
        href: "/profile/settings",
        icon: "settings",
        // 신 경로(/profile/settings) + 구 경로 모두 활성 (redirect 구간 + 외부 링크 진입 시)
        matchPaths: [
          "/profile/settings",
          "/profile/preferences",
          "/profile/notification-settings",
        ],
      },
      {
        label: "결제",
        // Day 8: 구독 + 결제 내역을 /profile/billing 허브 (탭 2개)로 통합.
        href: "/profile/billing",
        icon: "payments",
        // 신 경로 + 구 경로 양쪽 매칭 (redirect 구간에도 활성 유지)
        matchPaths: [
          "/profile/billing",
          "/profile/subscription",
          "/profile/payments",
        ],
      },
    ],
  },
];

// 모바일 가로 chip 용으로 그룹을 평면화 — 그룹 헤더 없이 9개 chip을 그룹 순서 그대로 배치.
const NAV_ITEMS_FLAT: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export function ProfileSideNav() {
  const pathname = usePathname();

  /* 활성 판정 로직.
   * - 정확 일치 (pathname === p): /profile/edit
   * - 하위 경로 (pathname.startsWith(p + '/')): /profile/edit/avatar 같은 미래 확장 대비
   * - exactOnly 플래그가 true 면 하위 경로 매칭 금지 (/profile 루트처럼 광범위한 경로 방어)
   * - matchPaths 중 하나라도 매칭되면 활성 */
  const isActive = (matchPaths: string[], exactOnly?: boolean): boolean =>
    matchPaths.some((p) => {
      if (pathname === p) return true;
      if (exactOnly) return false;
      return pathname.startsWith(p + "/");
    });

  return (
    <>
      {/* ============================================================
       * PC 좌측 사이드 네비 (lg 이상)
       * - 너비 220px, sticky로 스크롤 시 헤더 아래 고정
       * - (web)/layout.tsx의 sideNavItems 디자인을 그대로 따름
       *   (font-black uppercase tracking-wide + border-l-4 활성 표시)
       * ============================================================ */}
      <aside
        className="hidden shrink-0 lg:block lg:w-[220px]"
        aria-label="프로필 메뉴"
      >
        {/* PC: 그룹별 라벨 헤더 + 항목 — space-y-4로 그룹 간 여백, 각 그룹 내부는 space-y-1 */}
        <nav className="sticky top-20 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-1">
              {/* 그룹 라벨 헤더 — 작은 uppercase 텍스트로 시각적 분리.
                  px-4 로 항목 들여쓰기와 정렬 맞춤. */}
              {/* 그룹 라벨 색상: --ink-dim 사용 (가장 약한 톤, 보조 텍스트).
                  --color-text-tertiary 는 v2 토큰에 없으므로 사용 금지. */}
              <div
                className="px-4 pt-1 pb-2 text-[10px] font-black uppercase tracking-widest"
                style={{ color: "var(--ink-dim)" }}
              >
                {group.label}
              </div>
              {group.items.map((item) => {
                const active = isActive(item.matchPaths, item.exactOnly);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    // 토큰 매핑 정정 (2026-04-29):
                    // 기존 --color-* 는 globals.css에 미정의 → 브라우저 폴백(파란색)으로 표시되는 버그
                    // v2 정의 토큰으로 교체: --color-primary→--accent, --color-text-secondary→--ink-mute,
                    // --color-text-primary→--ink, --color-surface→--bg-alt
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-black uppercase tracking-wide transition-all rounded-none ${
                      active
                        ? "bg-[var(--bg-alt)] text-[var(--accent)] border-l-4 border-[var(--accent)]"
                        : "text-[var(--ink-mute)] border-l-4 border-transparent hover:bg-[var(--bg-alt)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {/* 활성 시 아이콘 FILL 1 (글로벌 layout 패턴과 동일) */}
                    <span
                      className="material-symbols-outlined text-xl"
                      style={
                        active ? { fontVariationSettings: "'FILL' 1" } : undefined
                      }
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* ============================================================
       * 모바일 상단 탭 네비 (lg 미만) — v2 탭 패턴
       * - sticky top-14: (web) 헤더 높이(h-14 = 56px) 바로 아래에 붙음
       * - 가로 스크롤로 9개 항목 모두 접근 가능
       * - 왜 chip 안티패턴(rounded 배경 + uppercase 굵은체 + 아이콘) 폐기:
       *   1) chip은 시각 노이즈가 크고 모바일에서 정보밀도를 떨어뜨림
       *   2) 활성 chip 배경 칠은 BDR Red 누적되며 헤더와 충돌
       *   3) /teams/[id] TeamTabsV2 패턴과 일관성 확보
       * - v2 패턴: 텍스트 only + 하단 2px BDR Red 강조선 + font-medium/semibold
       * ============================================================ */}
      <nav
        // 토큰 매핑 정정: --color-border→--border, --color-background→--bg
        className="sticky top-14 z-30 -mx-5 mb-4 border-b border-[var(--border)] bg-[var(--bg)] lg:hidden"
        aria-label="프로필 메뉴"
      >
        <div className="flex gap-1 overflow-x-auto px-5 scrollbar-none">
          {/* 모바일은 그룹 라벨을 숨기고 평면 리스트 — 가로 스크롤 흐름 유지 */}
          {NAV_ITEMS_FLAT.map((item) => {
            const active = isActive(item.matchPaths, item.exactOnly);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                /* v2 탭 패턴 핵심:
                 * - px-3 py-3: 좌우 12px + 상하 12px → 텍스트 높이 포함 약 44px (터치 타겟 확보)
                 * - text-sm: chip 의 text-xs 보다 가독성 향상
                 * - border-b-[3px]: 활성 표시 (TeamTabsV2 와 일관 — 2px → 3px 통일)
                 * - font-medium/semibold: uppercase font-bold 폐기, 자연스러운 무게
                 * 토큰 매핑 정정 (2026-04-29):
                 *   --color-primary→--accent, --color-text-primary→--ink, --color-text-secondary→--ink-mute */
                className={`flex shrink-0 items-center px-3 py-3 text-sm border-b-[3px] transition-colors ${
                  active
                    ? "border-[var(--accent)] text-[var(--ink)] font-semibold"
                    : "border-transparent text-[var(--ink-mute)] hover:text-[var(--ink)] font-medium"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
