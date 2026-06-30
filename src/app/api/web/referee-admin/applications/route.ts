import { apiSuccess, apiError } from "@/lib/api/response";
import { getAssociationAdmin } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import type { NextRequest } from "next/server";

/**
 * /api/web/referee-admin/applications
 *
 * GET — 협회 관리자가 받은 배정 신청 목록 (inbox)
 *
 * 이유: 공고(AssignmentAnnouncement)별로 흩어진 신청을 한 화면에서 모아 보고
 *       상태(대기/승인/거절)별로 승인·거절 처리하기 위한 "신청 관리" 진입점.
 *       (공고 상세의 일자별 선정과 별개 경로 — 결정 R1: 두 경로 공존)
 *
 * 보안:
 *   - getAssociationAdmin() — 모든 관리자 열람 가능 (super = 첫 협회 sentinel)
 *   - where 에 announcement.association_id 를 강제로 끼워 협회 스코프 잠금 (IDOR 방지)
 *     → 다른 협회 공고에 달린 신청은 절대 조회되지 않음.
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 1) 권한 — 협회 관리자 누구나 열람. associationId 가 스코프 키.
  const admin = await getAssociationAdmin();
  if (!admin) return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");

  // 2) 쿼리 파싱 — 상태/공고/대회/역할 필터 + 페이지네이션
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // submitted | approved | rejected | withdrawn
  const announcementId = searchParams.get("announcement_id");
  const tournamentId = searchParams.get("tournament_id");
  const roleType = searchParams.get("role_type"); // referee | game_official

  // page/limit — 음수/과대값 방어 (1 이상, limit 최대 100)
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  const skip = (page - 1) * limit;

  // 3) where 조립 — announcement.association_id 는 항상 강제 (IDOR 잠금)
  //    status/announcement_id 는 신청(application) 직속 컬럼,
  //    tournament_id/role_type 은 공고(announcement) 경유 필터.
  const announcementWhere: Record<string, unknown> = {
    association_id: admin.associationId,
  };
  if (tournamentId) announcementWhere.tournament_id = tournamentId;
  if (roleType) announcementWhere.role_type = roleType;

  const where: Record<string, unknown> = {
    announcement: announcementWhere,
  };
  if (status) where.status = status;
  // announcement_id 는 BigInt 컬럼 — 숫자 문자열만 허용 (변환 실패 시 무시)
  if (announcementId) {
    try {
      where.announcement_id = BigInt(announcementId);
    } catch {
      return apiError("announcement_id 형식이 올바르지 않습니다.", 400, "BAD_REQUEST");
    }
  }

  try {
    // 4) 목록 + 총개수 동시 조회 (페이지네이션 메타용)
    const [rows, total] = await Promise.all([
      prisma.assignmentApplication.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          memo: true,
          created_at: true,
          referee_id: true,
          announcement_id: true,
          announcement: {
            select: { title: true, tournament_id: true, role_type: true },
          },
          referee: {
            select: {
              id: true,
              registered_name: true,
              registered_phone: true,
              user: { select: { name: true, nickname: true, phone: true } },
            },
          },
          dates: { select: { date: true }, orderBy: { date: "asc" } },
        },
      }),
      prisma.assignmentApplication.count({ where }),
    ]);

    // 5) 대회명 보강 — announcement 에는 tournament_id(UUID)만 있고 관계가 없으므로
    //    이번 페이지에 등장한 대회들만 한 번에 조회해 map 으로 합친다.
    const tournamentIds = Array.from(
      new Set(rows.map((r) => r.announcement.tournament_id))
    );
    const tournaments = tournamentIds.length
      ? await prisma.tournament.findMany({
          where: { id: { in: tournamentIds } },
          select: { id: true, name: true },
        })
      : [];
    const tNameMap = new Map(tournaments.map((t) => [t.id, t.name]));

    // 6) 응답 포맷 — 표시용 이름/연락처 정리 (snake 키 그대로 → apiSuccess 가 변환)
    const items = rows.map((r) => ({
      id: r.id,
      status: r.status,
      memo: r.memo,
      created_at: r.created_at,
      referee_id: r.referee_id,
      referee_name:
        r.referee.user?.name ??
        r.referee.user?.nickname ??
        r.referee.registered_name ??
        `심판 #${r.referee.id.toString()}`,
      referee_phone:
        r.referee.user?.phone ?? r.referee.registered_phone ?? null,
      announcement_id: r.announcement_id,
      announcement_title: r.announcement.title,
      tournament_id: r.announcement.tournament_id,
      tournament_name: tNameMap.get(r.announcement.tournament_id) ?? null,
      role_type: r.announcement.role_type,
      dates: r.dates.map((d) => d.date),
    }));

    return apiSuccess({ items, total, page, limit });
  } catch (error) {
    console.error("[referee-admin/applications] GET 실패:", error);
    return apiError("신청 목록을 불러오지 못했습니다.", 500, "INTERNAL_ERROR");
  }
}
