"use client";

/* ============================================================
 * ProfileShell — 프로필 서브페이지 client 래퍼
 *
 * 왜:
 *  - layout.tsx는 server 컴포넌트로 metadata를 유지해야 한다.
 *  - 그러나 ProfileSideNav는 usePathname()을 쓰므로 client 컴포넌트.
 *  - 둘을 분리하기 위해 client wrapper로 ProfileSideNav + children을 감싼다.
 *
 * 어떻게:
 *  - lg 이상: flex 가로 배치 (aside 220px + main 1fr)
 *  - lg 미만: 세로 배치 (chip 위 + content 아래)
 *
 * [2026-05-01 v2.3 마이페이지 hub] /profile 루트(hub) 는 ProfileSideNav 숨김.
 *  - 이유: page.tsx 가 자체 좌 320px aside (프로필 ID / 소속팀 / 뱃지) 를 가짐 (5f5cfac)
 *          ProfileSideNav 220 + 자체 aside 320 = 3 컬럼 깨짐 → 사용자 보고 (캡처 14)
 *  - sub (/profile/edit, /profile/billing 등) 는 ProfileSideNav 그대로 유지
 * ============================================================ */

import { usePathname } from "next/navigation";
import { ProfileSideNav } from "./profile-side-nav";

export function ProfileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // /profile 정확 일치만 hub — sub 페이지는 ProfileSideNav 유지
  const isHubRoot = pathname === "/profile";

  if (isHubRoot) {
    // hub 는 page.tsx 자체 layout (좌 320 aside / 우 1fr) 사용 — Shell wrapper 없음
    return <>{children}</>;
  }

  return (
    /* lg 이상 가로 flex, 미만 세로 — gap-6은 PC에서만 의미 있음
     * (모바일은 chip이 sticky로 분리되어 gap 불필요) */
    <div className="lg:flex lg:gap-6">
      <ProfileSideNav />
      {/* min-w-0: flex 자식의 overflow 처리 (긴 콘텐츠 깨짐 방지) */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
