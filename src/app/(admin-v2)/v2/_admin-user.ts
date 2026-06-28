// ============================================================
// _admin-user.ts — admin-v2 셸 표시용 사용자 정보 빌더 (R3 공용)
//   인증 게이트는 /v2/layout.tsx 가 담당(redirect). 여기선 이미 인증된
//   세션에서 셸 푸터 UserChip 에 보여줄 { name, role, initial } 만 만든다.
//   백오피스(V2Shell)·대회 콘솔(TaShell) 두 그룹 레이아웃이 공용으로 호출.
// ============================================================

import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import type { AdminUser } from "@/components/admin-v2";

// 인증은 부모 layout 에서 끝났으므로 여기선 표시 정보만 구성(미인증 시 기본값).
export async function buildAdminV2User(): Promise<AdminUser> {
  const session = await getWebSession();
  const name = session?.name || "관리자";

  let isSuperAdmin =
    session?.role === "super_admin" || session?.admin_role === "super_admin";

  // role 라벨용 membershipType/admin_role 보강 조회(인증게이트와 동일 기준)
  if (session) {
    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(session.sub) },
      select: { isAdmin: true, admin_role: true },
    });
    if (dbUser?.isAdmin === true || dbUser?.admin_role === "super_admin") {
      isSuperAdmin = true;
    }
  }

  return {
    name,
    role: isSuperAdmin ? "최고 관리자" : "대회 관리자",
    initial: name.slice(0, 1).toUpperCase(),
  };
}
