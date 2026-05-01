"use client";

/* ============================================================
 * BottomNav — 모바일 fixed 하단 네비게이션 바
 *
 * 왜 (2026-05-01 Phase B — 사용자 결정 C3):
 *  - 시안 v2.3 의 모바일 fixed BottomNav 풀 도입.
 *  - Phase A 의 BottomNavEditor (Settings) 가 localStorage 에 저장한 5슬롯을
 *    실제로 모바일 화면 하단에 노출.
 *  - 13 룰 #11/#12 정합 — SSR hydration mismatch 방지 + DB/API 0 변경.
 *
 * 어떻게:
 *  - 시안 components.jsx:442-477 BottomNav 컴포넌트를 Next.js App Router 환경으로 이식.
 *  - 시안의 setRoute 콜백 → Next.js Link/router 이동 (운영은 라우트 기반).
 *  - 활성 슬롯 판단: usePathname + findActiveSlotId (가장 긴 prefix 매치).
 *  - 시안의 SVG Icon[item.icon] → Material Symbols Outlined (CLAUDE.md: lucide-react ❌).
 *  - 모바일 ≤720px 만 노출 — CSS @media 분기 (JS resize 감지 ❌).
 *  - mounted 가드 — SSR 시 BOTTOM_NAV_DEFAULT 5슬롯 렌더 → CSR 시 localStorage 값으로 갱신.
 *
 * 박제 룰 준수:
 *  - 13 룰 #1~#7 (AppNav): 변경 0 ✅ (별도 컴포넌트)
 *  - 13 룰 #5: 가짜링크 4건 카탈로그에서 제외 ✅ (storage.ts 에서 처리)
 *  - 13 룰 #6: 9 메인 탭 + 5 보조 ✅ (storage.ts 카탈로그)
 *  - 13 룰 #10: 토큰만 / 9999px ❌ ✅ (CSS 별도 — 본체 0건)
 *  - 13 룰 #11: SSR hydration mismatch 방지 (mounted state) ✅
 *  - 13 룰 #13: 720px 분기 / 버튼 44px+ (min-height 56px) ✅
 * ============================================================ */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BOTTOM_NAV_DEFAULT,
  BOTTOM_NAV_CHANGE_EVENT,
  findActiveSlotId,
  findCatalogItem,
  getBottomNavSlots,
} from "@/lib/bottom-nav-storage";

export function BottomNav() {
  const pathname = usePathname();

  // SSR hydration mismatch 방지 — 마운트 후에만 localStorage 값 사용.
  // 초기 렌더는 BOTTOM_NAV_DEFAULT 로 5슬롯 자리 유지 → CSR hydration 시 localStorage 동기화.
  const [mounted, setMounted] = useState(false);
  const [slots, setSlots] = useState<string[]>([...BOTTOM_NAV_DEFAULT]);

  useEffect(() => {
    setSlots(getBottomNavSlots());
    setMounted(true);
  }, []);

  // Settings 편집기에서 슬롯 변경 시 즉시 동기화 (CustomEvent + storage 이벤트)
  useEffect(() => {
    const onChange = () => setSlots(getBottomNavSlots());
    window.addEventListener(BOTTOM_NAV_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(BOTTOM_NAV_CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  // 활성 슬롯 판단 — mounted 후에만. SSR/초기 렌더에서는 활성 표시 X (false negative 허용).
  // 가장 긴 prefix 매치로 충돌 회피 (예: /profile/payments → billing 우선, profile 차순위).
  const activeId = mounted ? findActiveSlotId(pathname, slots) : null;

  const items = slots.map((id) => findCatalogItem(id));

  return (
    <nav className="bottom-nav" aria-label="하단 자주가기" role="navigation">
      {items.map((item, idx) => {
        const isActive = item.id === activeId;
        return (
          <Link
            key={`${item.id}-${idx}`}
            href={item.href}
            className={`bottom-nav__btn${isActive ? " is-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            {/* Material Symbols Outlined — CLAUDE.md 룰 (lucide-react ❌) */}
            <span className="bottom-nav__icon material-symbols-outlined" aria-hidden="true">
              {item.icon}
            </span>
            <span className="bottom-nav__label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
