import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import Link from "next/link";

/**
 * partner-admin 레이아웃 — 서버 컴포넌트로 권한 검증 수행.
 * partner_members 테이블에서 user_id로 소속을 확인한다.
 * 미로그인이거나 파트너 소속이 아니면 홈으로 리다이렉트.
 *
 * 2026-05-11 Phase 1-A — super_admin 우회 추가.
 *   기존: super_admin 도 partner_members row 없으면 / redirect (canManageTournament 등 다른 헬퍼와
 *     일관성 어긋남 — super_admin = 전능 권한 정책 위반).
 *   변경: super_admin 이면 partner_members SELECT skip + 첫 active partner 자동 선택 (있으면) /
 *     없으면 sentinel "(super_admin 권한 진입)" 표시.
 */
export default async function PartnerAdminLayout({ children }: { children: React.ReactNode }) {
  // 로그인 확인
  const session = await getWebSession();
  if (!session) redirect("/login");

  // 2026-05-11 Phase 1-A — super_admin 분기 (정책: 전능 권한).
  // 이유: super_admin 본인은 어느 partner_members 소속이 없을 수 있음 — 그래도 진입 허용.
  const superAdmin = isSuperAdmin(session);

  // partner_members에서 현재 유저의 활성 멤버십 확인 (일반 사용자만 강제 검증)
  const membership = await prisma.partner_members.findFirst({
    where: {
      user_id: BigInt(session.sub),
      is_active: true,
    },
    include: {
      partner: { select: { name: true, status: true } },
    },
  });

  // 일반 사용자 — 파트너 소속이 아니면 홈으로 리다이렉트
  // super_admin — membership 없어도 진입 허용 (sentinel 표시 단계 진행)
  if (!membership && !superAdmin) redirect("/");

  // 표시용 파트너 정보 (super_admin sentinel 분기)
  // - 일반 사용자: 본인 membership.partner 사용 (기존 동작 유지)
  // - super_admin + membership 있음: 본인 membership.partner 사용 (자기 소속 우선)
  // - super_admin + membership 없음: sentinel "(super_admin 권한 진입)" 표시
  const partnerDisplay = membership
    ? { name: membership.partner.name, status: membership.partner.status }
    : { name: "(super_admin 권한으로 진입)", status: "approved" as const };

  // 파트너사가 승인 상태가 아닐 때 안내 (super_admin sentinel = approved 처리 — 경고 미표시)
  const isApproved = partnerDisplay.status === "approved";

  // 네비게이션 메뉴 항목
  const navItems = [
    { href: "/partner-admin", label: "대시보드", icon: "dashboard" },
    { href: "/partner-admin/campaigns", label: "캠페인", icon: "campaign" },
    { href: "/partner-admin/venue", label: "대관 관리", icon: "stadium" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* 상단 파트너 헤더 */}
      <header
        className="border-b px-6 py-4"
        style={{
          backgroundColor: "var(--color-card)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          {/* 파트너사 이름 */}
          <div className="flex items-center gap-3">
            <span
              className="material-symbols-outlined text-xl"
              style={{ color: "var(--color-primary)" }}
            >
              storefront
            </span>
            <div>
              <h1 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                {partnerDisplay.name}
              </h1>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                파트너 관리
              </p>
            </div>
          </div>

          {/* 상태 뱃지 */}
          {!isApproved && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: "var(--color-warning-bg, rgba(255,171,0,0.1))",
                color: "var(--color-warning, #FFAB00)",
              }}
            >
              <span className="material-symbols-outlined text-sm">pending</span>
              승인 대기중
            </span>
          )}
        </div>
      </header>

      {/* 네비게이션 탭 */}
      <nav
        className="border-b px-6"
        style={{
          backgroundColor: "var(--color-card)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="mx-auto max-w-6xl flex gap-1 overflow-x-auto no-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors hover:opacity-80"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
