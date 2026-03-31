import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

/**
 * partner-admin 레이아웃 — 서버 컴포넌트로 권한 검증 수행.
 * partner_members 테이블에서 user_id로 소속을 확인한다.
 * 미로그인이거나 파트너 소속이 아니면 홈으로 리다이렉트.
 */
export default async function PartnerAdminLayout({ children }: { children: React.ReactNode }) {
  // 로그인 확인
  const session = await getWebSession();
  if (!session) redirect("/login");

  // partner_members에서 현재 유저의 활성 멤버십 확인
  const membership = await prisma.partner_members.findFirst({
    where: {
      user_id: BigInt(session.sub),
      is_active: true,
    },
    include: {
      partner: { select: { name: true, status: true } },
    },
  });

  // 파트너 소속이 아니면 홈으로 리다이렉트
  if (!membership) redirect("/");

  // 파트너사가 승인 상태가 아닐 때 안내
  const isApproved = membership.partner.status === "approved";

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
                {membership.partner.name}
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
