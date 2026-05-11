/**
 * 2026-05-12 Phase 4 — super_admin 전용 user 검색 API.
 * 운영자 변경 폼에서 신규 운영자 후보 검색.
 *
 * 쿼리: ?q=<email|nickname|userId>
 * 권한: super_admin
 * 응답: { users: [{ id, nickname, email, name }, ...] } (최대 20건)
 */

import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";

export async function GET(req: NextRequest) {
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401);
  if (!isSuperAdmin(session)) return apiError("권한이 없습니다.", 403);

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return apiSuccess({ users: [] });

  // userId 숫자 검색 / email / nickname OR
  const numericId = /^\d+$/.test(q) ? BigInt(q) : null;
  const users = await prisma.user.findMany({
    where: {
      OR: [
        ...(numericId ? [{ id: numericId }] : []),
        { email: { contains: q, mode: "insensitive" as const } },
        { nickname: { contains: q, mode: "insensitive" as const } },
      ],
      status: "active",
    },
    select: { id: true, nickname: true, email: true, name: true },
    take: 20,
    orderBy: { id: "desc" },
  });

  return apiSuccess({
    users: users.map((u) => ({
      id: u.id.toString(),
      nickname: u.nickname,
      email: u.email,
      name: u.name,
    })),
  });
}
