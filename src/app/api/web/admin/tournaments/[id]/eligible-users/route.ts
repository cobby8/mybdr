/**
 * 2026-05-12 — 운영자 관리 페이지 (사이트 관리자) 검색 API.
 *
 * 대회의 소속 단체 멤버 중 검색 (organization_members 한정).
 * 사용자 요청: 운영자 후보 범위를 소속 단체 가입자로 축소.
 *
 * 흐름:
 *   Tournament.series_id → tournament_series.organization_id → organization_members
 *
 * 권한: super_admin
 * 쿼리: ?q=<nickname|email|userId>
 * 응답: { users: [...], organizationId, organizationName }
 *   - organization 미연결 시 → 빈 결과 + organizationId=null (UI 안내)
 */

import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id: tournamentId } = await params;

  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401);
  if (!isSuperAdmin(session)) return apiError("권한이 없습니다.", 403);

  // 대회 → 소속 단체 매핑 (series_id → organization_id)
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      tournament_series: {
        select: {
          organization_id: true,
          organization: { select: { name: true } },
        },
      },
    },
  });
  const organizationId = tournament?.tournament_series?.organization_id ?? null;
  const organizationName = tournament?.tournament_series?.organization?.name ?? null;

  if (!organizationId) {
    // 소속 단체 미연결 — 빈 결과 + 안내
    return apiSuccess({
      users: [],
      organizationId: null,
      organizationName: null,
      message: "이 대회는 소속 단체에 연결되어 있지 않습니다.",
    });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  // organization_members WHERE organization_id + is_active=true + 검색 필터
  const numericId = /^\d+$/.test(q) ? BigInt(q) : null;
  const members = await prisma.organization_members.findMany({
    where: {
      organization_id: organizationId,
      is_active: true,
      ...(q && {
        user: {
          OR: [
            ...(numericId ? [{ id: numericId }] : []),
            { email: { contains: q, mode: "insensitive" as const } },
            { nickname: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q } },
          ],
        },
      }),
    },
    include: {
      user: { select: { id: true, nickname: true, email: true, name: true, status: true } },
    },
    take: 50,
    orderBy: { created_at: "desc" },
  });

  return apiSuccess({
    users: members
      .filter((m) => m.user?.status === "active")
      .map((m) => ({
        id: m.user!.id.toString(),
        nickname: m.user!.nickname,
        email: m.user!.email,
        name: m.user!.name,
        role: m.role,
      })),
    organizationId: organizationId.toString(),
    organizationName,
  });
}
