import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import Link from "next/link";
// Toss 키트 — lucide 아이콘 래퍼(Icon). CDN injection 금지 규칙상 lucide-react 경유.
import { Icon } from "@/components/admin-toss";

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
 *
 * 2026-06-21 Phase 3 PR-A — Toss 재스킨(비주얼만).
 *   셸 루트에 data-skin="toss" opt-in → bare var(--ink)/--bg 등 Toss 토큰 활성화.
 *   헤더=라이트 카드, 가로탭=.ts-navlink 룩, 아이콘 Material→lucide(<Icon>).
 *   navItems/href/권한검증 server logic = 변경 0.
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

  // 네비게이션 메뉴 항목 — href/label/권한은 불변. icon 만 lucide name(kebab)으로 교체.
  // (Material dashboard/campaign/stadium → lucide layout-dashboard/megaphone/building)
  const navItems = [
    { href: "/partner-admin", label: "대시보드", icon: "layout-dashboard" },
    { href: "/partner-admin/campaigns", label: "캠페인", icon: "megaphone" },
    { href: "/partner-admin/venue", label: "대관 관리", icon: "building" },
  ];

  return (
    // data-skin="toss" — 셸 루트 opt-in. var(--bg)/--ink 등 Toss 토큰 활성화(미부착 시 .ts-* 무효).
    <div data-skin="toss" className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* 상단 파트너 헤더 — Toss 라이트 카드(흰 배경 + 연한 보더) */}
      <header
        className="border-b px-6 py-4"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
        }}
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          {/* 파트너사 이름 */}
          <div className="flex items-center gap-3">
            {/* storefront → lucide store */}
            <Icon name="store" size={22} color="var(--primary)" />
            <div>
              <h1 className="text-base font-bold" style={{ color: "var(--ink)" }}>
                {partnerDisplay.name}
              </h1>
              <p className="text-xs" style={{ color: "var(--ink-mute)" }}>
                파트너 관리
              </p>
            </div>
          </div>

          {/* 상태 뱃지 — 승인 대기 시 warn 톤(.ts-badge--warn) */}
          {!isApproved && (
            <span className="ts-badge ts-badge--warn">
              {/* pending → lucide clock */}
              <Icon name="clock" size={13} />
              승인 대기중
            </span>
          )}
        </div>
      </header>

      {/* 네비게이션 탭 — Toss .ts-navlink 룩(가로 배치) */}
      <nav
        className="border-b px-6"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
        }}
      >
        <div className="mx-auto max-w-6xl flex gap-1 overflow-x-auto no-scrollbar py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              // .ts-navlink = Toss 사이드/탭 링크 룩. 가로탭이라 width 고정 해제(w-auto).
              className="ts-navlink whitespace-nowrap"
              style={{ width: "auto" }}
            >
              <Icon name={item.icon} size={18} />
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
