// ============================================================
// org-console/_org-data.ts — 단체 Self-Serve 콘솔 서버 데이터 헬퍼 (P1)
//   정본 참조: Dev/design/BDR v2.41-admin-toss/org-console/org-data.jsx
//   브리프: Dev/design/prompts/org-selfserve-console-brief-2026-07-02.md
//
//   - getOrgContext: 세션 → organization_members(owner/admin, is_active) 로 단체 스코프 확정.
//     · 일반 유저 + 미소속(owner/admin 아님) → null (호출부 layout 에서 redirect).
//     · super_admin 무소속 → 첫 단체를 미리보기 컨텍스트로 자동 선택(스위처는 후속 — 브리프 §3-3).
//     · 다중 소속(owner/admin) 시 첫 가입(created_at asc) 단체 자동 선택(스위처는 후속 — 브리프 §1-2 #1).
//   ★백엔드/DB/Prisma 0변경 — READ(count/findFirst/findUnique) 만. 레거시 0 import.
//   ⚠ 서버 전용 모듈(getWebSession/next-headers/prisma) — client 컴포넌트가 직접 import 금지.
//     orgColor(브랜드 해시 팔레트)는 client 도 쓰므로 "./_org-color"(서버 의존성 0)로 분리했다.
//     (2026-07-02 buildfix: client가 이 파일을 import하면 next build 시 서버 전용 코드가
//      클라 번들에 섞여 EXIT1 — tsc --noEmit 은 타입만 봐서 못 잡는다. 재발 방지 기록.)
// ============================================================

import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { prisma } from "@/lib/db/prisma";

export type OrgRole = "owner" | "admin" | null;

export type OrgContext = {
  userId: bigint;
  /** 스코프 확정된 단체 id. super_admin 무소속 + 단체 0건이면 null(빈 상태). */
  orgId: bigint | null;
  orgName: string;
  /** 실 멤버십 role. super_admin 미리보기(무소속)면 null. */
  role: OrgRole;
  isSuper: boolean;
};

/**
 * 세션 → 단체 콘솔 컨텍스트.
 * 일반 유저가 owner/admin 소속이 아니면 null 반환(layout 에서 redirect 처리).
 */
export async function getOrgContext(): Promise<OrgContext | null> {
  const session = await getWebSession();
  if (!session) return null;

  const userId = BigInt(session.sub);
  const isSuper = isSuperAdmin(session);

  // 활성 owner/admin 소속 단체(다중 소속 시 첫 가입 단체 — 스위처는 후속).
  const membership = await prisma.organization_members.findFirst({
    where: { user_id: userId, is_active: true, role: { in: ["owner", "admin"] } },
    orderBy: { created_at: "asc" },
    select: { role: true, organization: { select: { id: true, name: true } } },
  });

  if (membership) {
    return {
      userId,
      orgId: membership.organization.id,
      orgName: membership.organization.name,
      role: membership.role as OrgRole,
      isSuper,
    };
  }

  if (isSuper) {
    // super_admin 무소속 — 첫 단체를 미리보기 컨텍스트로 자동 선택(스위처는 후속).
    const anyOrg = await prisma.organizations.findFirst({
      orderBy: { created_at: "asc" },
      select: { id: true, name: true },
    });
    return {
      userId,
      orgId: anyOrg?.id ?? null,
      orgName: anyOrg?.name ?? "(등록된 단체 없음)",
      role: null,
      isSuper,
    };
  }

  // 일반 유저 + owner/admin 미소속 — 콘솔 진입 불가(브리프 §3-3).
  return null;
}

// KST 날짜 "2026.06.15" (서버=UTC → Asia/Seoul). 없으면 "—".
export function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return d
    .toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" })
    .replace(/\.\s/g, ".")
    .replace(/\.$/, "");
}
