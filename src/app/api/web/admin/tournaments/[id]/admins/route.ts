/**
 * 2026-05-12 — 운영자(TAM) 추가/삭제 API (사이트 관리자 전용).
 *
 * 기존 /api/web/tournaments/[id]/admins 와 차이:
 *   - 권한: super_admin (사이트 관리자 페이지에서 사용)
 *   - 검색 범위: 소속 단체 멤버 한정 (eligible-users API 의 결과 = userId 직접 입력)
 *   - admin_logs 박제
 *
 * POST: TAM INSERT (이미 있으면 reactivate)
 * DELETE: TAM 비활성화 (소프트 삭제)
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { adminLog } from "@/lib/admin/log";

type Ctx = { params: Promise<{ id: string }> };

const PostSchema = z.object({
  userId: z.string().regex(/^\d+$/),
  role: z.string().trim().min(1).max(20).optional(),
});

const DeleteSchema = z.object({
  userId: z.string().regex(/^\d+$/),
});

// GET — 현재 TAM 목록 + 현 organizer 정보
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id: tournamentId } = await params;
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401);
  if (!isSuperAdmin(session)) return apiError("권한이 없습니다.", 403);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true, name: true, organizerId: true,
      users_tournaments_organizer_idTousers: {
        select: { id: true, nickname: true, email: true, name: true },
      },
    },
  });
  if (!tournament) return apiError("대회를 찾을 수 없습니다.", 404);

  const admins = await prisma.tournamentAdminMember.findMany({
    where: { tournamentId, isActive: true },
    include: {
      user: { select: { id: true, nickname: true, email: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return apiSuccess({
    organizer: tournament.users_tournaments_organizer_idTousers
      ? {
          id: tournament.organizerId.toString(),
          nickname: tournament.users_tournaments_organizer_idTousers.nickname,
          email: tournament.users_tournaments_organizer_idTousers.email,
          name: tournament.users_tournaments_organizer_idTousers.name,
        }
      : null,
    admins: admins.map((a) => ({
      id: a.id.toString(),
      userId: a.userId.toString(),
      role: a.role,
      isActive: a.isActive,
      createdAt: a.createdAt.toISOString(),
      user: a.user
        ? {
            id: a.user.id.toString(),
            nickname: a.user.nickname,
            email: a.user.email,
            name: a.user.name,
          }
        : null,
    })),
  });
}

// POST — TAM 추가 (이미 있으면 reactivate)
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: tournamentId } = await params;
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401);
  if (!isSuperAdmin(session)) return apiError("권한이 없습니다.", 403);

  let body: unknown;
  try { body = await req.json(); }
  catch { return apiError("잘못된 요청입니다.", 400); }
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) return apiError("유효하지 않은 입력입니다.", 422);
  const { userId, role } = parsed.data;
  const userIdBig = BigInt(userId);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, name: true, organizerId: true },
  });
  if (!tournament) return apiError("대회를 찾을 수 없습니다.", 404);

  // organizer 본인이면 거부 (중복 권한)
  if (tournament.organizerId === userIdBig) {
    return apiError("이미 대회 주최자입니다 (TAM 등록 불요).", 422);
  }

  const user = await prisma.user.findUnique({
    where: { id: userIdBig },
    select: { id: true, nickname: true, email: true, status: true },
  });
  if (!user) return apiError("사용자를 찾을 수 없습니다.", 404);
  if (user.status !== "active") return apiError("비활성 사용자입니다.", 422);

  // 기존 TAM 확인
  const existing = await prisma.tournamentAdminMember.findFirst({
    where: { tournamentId, userId: userIdBig },
  });

  if (existing && existing.isActive) {
    return apiError("이미 운영자로 등록된 사용자입니다.", 409);
  }

  let member;
  if (existing) {
    // 비활성 → reactivate
    member = await prisma.tournamentAdminMember.update({
      where: { id: existing.id },
      data: { isActive: true, role: role ?? "admin" },
    });
  } else {
    member = await prisma.tournamentAdminMember.create({
      data: {
        tournamentId,
        userId: userIdBig,
        role: role ?? "admin",
        isActive: true,
      },
    });
  }

  await adminLog("tournament_admin.add", "Tournament", {
    description: `${tournament.name} 운영자 추가 — userId ${userId} (${user.nickname ?? user.email}) / role=${role ?? "admin"}`,
    changesMade: { userId, role: role ?? "admin", reactivated: !!existing },
    severity: "info",
  });

  return apiSuccess({ ok: true, member: { id: member.id.toString(), userId, role: member.role } });
}

// DELETE — TAM 비활성화
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id: tournamentId } = await params;
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401);
  if (!isSuperAdmin(session)) return apiError("권한이 없습니다.", 403);

  let body: unknown;
  try { body = await req.json(); }
  catch { return apiError("잘못된 요청입니다.", 400); }
  const parsed = DeleteSchema.safeParse(body);
  if (!parsed.success) return apiError("유효하지 않은 입력입니다.", 422);
  const { userId } = parsed.data;
  const userIdBig = BigInt(userId);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, name: true },
  });
  if (!tournament) return apiError("대회를 찾을 수 없습니다.", 404);

  const existing = await prisma.tournamentAdminMember.findFirst({
    where: { tournamentId, userId: userIdBig, isActive: true },
  });
  if (!existing) return apiError("운영자로 등록되어 있지 않습니다.", 404);

  await prisma.tournamentAdminMember.update({
    where: { id: existing.id },
    data: { isActive: false },
  });

  await adminLog("tournament_admin.remove", "Tournament", {
    description: `${tournament.name} 운영자 제거 — userId ${userId}`,
    previousValues: { isActive: true, role: existing.role },
    severity: "warning",
  });

  return apiSuccess({ ok: true });
}
