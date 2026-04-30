import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * Phase 10-4 후속 — 호스트 매치 신청 인박스 (GET 목록 조회)
 * ─────────────────────────────────────────────────────────
 * 이유(왜): POST(/match-request)는 단건 생성용. 호스트가 받은 신청을 한 번에 보려면
 * 별도의 목록 엔드포인트가 필요. 복수형(`match-requests`)으로 분리해 의미 명확화.
 *
 * 흐름:
 * 1) URL [id] = to_team_id (호스트 측 팀)
 * 2) 권한: 팀 운영진(captain/vice/manager) — members 가드와 일관
 * 3) 정렬: pending 우선 → 그 외 status → 최신순
 * 4) include: from_team(name/color), proposer(닉네임)
 *
 * 보안:
 * - team_id 일치 필수 (다른 팀의 신청 노출 차단)
 * - 운영진 가드 (members route 와 동일 패턴)
 */

type RouteCtx = { params: Promise<{ id: string }> };

// 운영진 가드 — members / match-request POST 와 일관
const TEAM_MANAGER_ROLES = ["captain", "vice", "manager"] as const;

export const GET = withWebAuth(
  async (_req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
    const { id } = await routeCtx.params;

    let teamId: bigint;
    try {
      teamId = BigInt(id);
    } catch {
      return apiError("유효하지 않은 팀 ID 입니다.", 400);
    }

    // IDOR 방어: 호출자가 해당 팀의 운영진인지 확인
    // super_admin 은 모든 팀 인박스 조회 허용 (운영툴 호환성)
    const isManager = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: ctx.userId,
        role: { in: [...TEAM_MANAGER_ROLES] },
        status: "active",
      },
      select: { id: true },
    });
    if (!isManager && ctx.session.role !== "super_admin") {
      return apiError("FORBIDDEN", 403);
    }

    // 호스트 팀이 받은 매치 신청 — pending 우선 + 그 외 status 도 포함
    // 정렬: status 'pending' 을 위로 올리려면 raw status ordering 보다는
    // pending 만 먼저 + 나머지 created_at desc 두 번 쿼리로 단순화 가능하지만,
    // 한 번에 받아 클라이언트 정렬을 줄이려고 status asc + created_at desc 사용.
    // (status 알파벳 순: accepted < pending < rejected — pending 이 중간에 옴)
    // 따라서 단일 쿼리 + JS 정렬로 pending 우선을 보장한다.
    const requests = await prisma.team_match_requests.findMany({
      where: { to_team_id: teamId },
      include: {
        from_team: {
          select: {
            id: true,
            name: true,
            // Team 모델은 primaryColor (camelCase + @map("primary_color")) — 응답 키는 snake_case
            primaryColor: true,
            city: true,
            district: true,
          },
        },
        proposer: {
          select: {
            id: true,
            nickname: true,
            name: true,
            profile_image: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // pending 우선 정렬 — 호스트가 가장 먼저 처리해야 할 항목을 위로
    const sorted = [...requests].sort((a, b) => {
      const aPending = a.status === "pending" ? 0 : 1;
      const bPending = b.status === "pending" ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      // 같은 그룹 내에서는 최신이 위
      return b.created_at.getTime() - a.created_at.getTime();
    });

    return apiSuccess({
      requests: sorted.map((r) => ({
        id: r.id.toString(),
        status: r.status,
        message: r.message,
        preferred_date: r.preferred_date ? r.preferred_date.toISOString() : null,
        created_at: r.created_at.toISOString(),
        updated_at: r.updated_at.toISOString(),
        from_team: r.from_team
          ? {
              id: r.from_team.id.toString(),
              name: r.from_team.name,
              // 클라이언트는 snake_case 로 받기 (apiSuccess 가 자동 변환하지만 명시적으로 매핑)
              primary_color: r.from_team.primaryColor,
              city: r.from_team.city,
              district: r.from_team.district,
            }
          : null,
        proposer: r.proposer
          ? {
              id: r.proposer.id.toString(),
              // nickname 우선, 없으면 name 으로 폴백 (members GET 패턴과 동일)
              nickname: r.proposer.nickname ?? r.proposer.name ?? "운영진",
              profile_image: r.proposer.profile_image,
            }
          : null,
      })),
    });
  }
);
