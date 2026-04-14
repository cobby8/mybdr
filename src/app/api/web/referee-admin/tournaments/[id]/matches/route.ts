import { apiSuccess, apiError } from "@/lib/api/response";
import { getAssociationAdmin } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import type { NextRequest } from "next/server";

/**
 * GET /api/web/referee-admin/tournaments/[id]/matches
 *
 * 특정 대회의 경기 목록 + 배정 현황.
 *
 * 이유: 배정 관리 UI의 2단계에서 사용. 대회를 선택하면 해당 대회의 경기들이
 *      테이블로 나오고, 각 경기 옆에 "이미 배정된 심판" 목록이 표시되어야 한다.
 *
 * 데이터 조인:
 *   1. TournamentMatch (tournamentId = params.id)
 *   2. homeTeam / awayTeam (TournamentTeam → Team)
 *   3. RefereeAssignment (referee 포함) — 관계가 스키마에 없어 수동 쿼리로 조인
 *
 * 권한: getAssociationAdmin() — 모든 관리자 열람 가능 (배정 여부는 협회 무관 공개 정보)
 *
 * 응답: {
 *   tournament: { id, name, status },
 *   items: [{
 *     id, scheduled_at, round_name, status, court_number,
 *     home_team_name, away_team_name,
 *     assignments: [{ id, referee_id, referee_name, role, status }]
 *   }]
 * }
 */

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1) 관리자 인증
  const admin = await getAssociationAdmin();
  if (!admin) {
    return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  }

  const { id: tournamentId } = await params;

  try {
    // 2) 대회 존재 확인 + 헤더 정보
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        venue_name: true,
      },
    });
    if (!tournament) {
      return apiError("대회를 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    // 3) 해당 대회의 경기 목록 — homeTeam/awayTeam 조인 (TournamentTeam → Team)
    const matches = await prisma.tournamentMatch.findMany({
      where: { tournamentId },
      orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        scheduledAt: true,
        roundName: true,
        status: true,
        court_number: true,
        homeScore: true,
        awayScore: true,
        homeTeam: {
          select: { team: { select: { name: true } } },
        },
        awayTeam: {
          select: { team: { select: { name: true } } },
        },
      },
    });

    // 4) 경기 ID 리스트로 배정 전체 조회 (수동 조인)
    //    RefereeAssignment 모델엔 tournament_match 관계가 없으므로
    //    tournament_match_id로 in 쿼리하여 별도 조회.
    const matchIds = matches.map((m) => m.id);
    const assignments = matchIds.length
      ? await prisma.refereeAssignment.findMany({
          where: { tournament_match_id: { in: matchIds } },
          select: {
            id: true,
            referee_id: true,
            tournament_match_id: true,
            role: true,
            status: true,
            memo: true,
            referee: {
              select: {
                id: true,
                registered_name: true,
                association_id: true,
                user: { select: { name: true, nickname: true } },
              },
            },
          },
        })
      : [];

    // 5) 경기별 배정 그룹화 (match_id → assignments[])
    const assignmentsByMatch = new Map<
      bigint,
      Array<{
        id: bigint;
        referee_id: bigint;
        referee_name: string;
        role: string;
        status: string;
        memo: string | null;
        is_own_association: boolean; // 우리 협회 소속 심판인지 (UI에서 뱃지 표시용)
      }>
    >();
    for (const a of assignments) {
      // 심판명 표출: 사전등록이면 registered_name, 매칭된 계정이면 user.name 또는 nickname
      const name =
        a.referee.user?.name ??
        a.referee.user?.nickname ??
        a.referee.registered_name ??
        `심판 #${a.referee.id.toString()}`;
      const isOwn = a.referee.association_id === admin.associationId;
      const list = assignmentsByMatch.get(a.tournament_match_id) ?? [];
      list.push({
        id: a.id,
        referee_id: a.referee_id,
        referee_name: name,
        role: a.role,
        status: a.status,
        memo: a.memo,
        is_own_association: isOwn,
      });
      assignmentsByMatch.set(a.tournament_match_id, list);
    }

    // 6) 응답 조립
    const items = matches.map((m) => ({
      id: m.id,
      scheduled_at: m.scheduledAt,
      round_name: m.roundName,
      status: m.status,
      court_number: m.court_number,
      home_score: m.homeScore,
      away_score: m.awayScore,
      // Team 관계를 따라가서 이름 추출 — null-safe
      home_team_name: m.homeTeam?.team?.name ?? null,
      away_team_name: m.awayTeam?.team?.name ?? null,
      assignments: assignmentsByMatch.get(m.id) ?? [],
    }));

    return apiSuccess({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        start_date: tournament.startDate,
        end_date: tournament.endDate,
        venue_name: tournament.venue_name,
      },
      items,
    });
  } catch (error) {
    console.error(
      "[referee-admin/tournaments/[id]/matches] GET 실패:",
      error
    );
    return apiError("경기 목록을 불러오지 못했습니다.", 500, "INTERNAL_ERROR");
  }
}
