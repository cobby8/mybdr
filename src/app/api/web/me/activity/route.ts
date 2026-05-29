import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/web/me/activity?type=tournaments|games|teams|myteams|manner&limit=20
 *
 * 이유: W4 M4 "내 활동 통합 뷰"(/profile/activity)에서 3개 탭의 데이터를
 *      각각 호출한다. 탭이 바뀔 때만 해당 type 데이터만 fetch → 초기 페인트
 *      비용 최소화 + 응답 키 일관성 확보를 위해 단일 라우트로 통합.
 *
 * 응답 (apiSuccess → snake_case 자동 변환):
 *   - items: type별 구조가 다름 (아래 주석 참조)
 *
 * ⚠️ BigInt: Prisma → JSON 직렬화가 자동으로 안 되므로 toString() 수동 처리.
 *   (기존 my-application route.ts 동일 패턴)
 *
 * IDOR: 모든 where 절에 user_id/registered_by_id = session 본인 고정.
 */
export const GET = withWebAuth(async (req: Request, _routeCtx, ctx: WebAuthContext) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  // 상한 50 — 무한 스크롤은 현재 범위 밖. 최신 N건만
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20")));

  try {
    if (type === "tournaments") {
      /* 내가 등록한 대회 팀 (registered_by_id=me). 인덱스 활용. */
      const rows = await prisma.tournamentTeam.findMany({
        where: { registered_by_id: ctx.userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              startDate: true,
              venue_name: true,
              city: true,
              status: true,
            },
          },
          team: {
            select: { id: true, uuid: true, name: true },
          },
        },
      });

      return apiSuccess({
        items: rows.map((r) => ({
          id: r.id.toString(), // BigInt → string
          status: r.status ?? "pending",
          createdAt: r.createdAt,
          // 커스텀 응답 키 — 최소한의 정보만 노출 (IDOR/과다 전송 방지)
          tournament: {
            id: r.tournament.id, // Tournament.id는 UUID string
            name: r.tournament.name,
            startDate: r.tournament.startDate,
            venueName: r.tournament.venue_name,
            city: r.tournament.city,
            status: r.tournament.status,
          },
          team: {
            id: r.team.id.toString(),
            uuid: r.team.uuid,
            name: r.team.name,
          },
        })),
      });
    }

    if (type === "games") {
      /* 내가 신청한 경기. 인덱스: game_applications.user_id */
      const rows = await prisma.game_applications.findMany({
        where: { user_id: ctx.userId },
        orderBy: { created_at: "desc" },
        take: limit,
        include: {
          games: {
            select: {
              id: true,
              uuid: true,
              title: true,
              scheduled_at: true,
              venue_name: true,
              city: true,
              status: true,
            },
          },
        },
      });

      return apiSuccess({
        items: rows.map((r) => ({
          id: r.id.toString(),
          status: r.status, // 숫자 코드 (0=대기/1=승인/2=거부)
          createdAt: r.created_at,
          game: r.games
            ? {
                id: r.games.id.toString(),
                uuid: r.games.uuid,
                title: r.games.title,
                scheduledAt: r.games.scheduled_at,
                venueName: r.games.venue_name,
                city: r.games.city,
                status: r.games.status,
              }
            : null,
        })),
      });
    }

    if (type === "manner") {
      /* PR-2C-3 (BG2): 내 매너 평가 — game_player_ratings 본인 대상 최근 50건.
       * ⚠️ 노출 룰 (사용자 결재): 평균 + flag "종류"(키워드)만.
       *    개별 건수(예 "no_show 2회")는 절대 집계/노출 ❌.
       * 이유: 본인 매너 피드백은 동기부여용 — 부정 건수 카운트는 위축/낙인 유발.
       *      따라서 flags 는 Set 으로 distinct 만 추출하고 발생 횟수는 버린다.
       * IDOR: rated_user_id = session 본인 고정. */
      const rows = await prisma.game_player_ratings.findMany({
        where: { rated_user_id: ctx.userId },
        orderBy: { created_at: "desc" },
        take: 50, // 최근 50건 (의뢰서 §3-UC1-2)
        select: { rating: true, flags: true },
      });

      // 평가 0건 → 빈 상태로 응답 (mock ❌ / 프론트가 빈 카드 분기)
      const totalEvaluations = rows.length;
      const avg =
        totalEvaluations === 0
          ? 0
          : // 평균 평점 = rating 합 / 건수 (소수 1자리는 프론트에서 toFixed)
            rows.reduce((sum, r) => sum + r.rating, 0) / totalEvaluations;

      // flag 종류만 distinct — 건수 미집계 (Set 으로 중복 제거 후 종류 배열)
      const flagKinds = Array.from(
        new Set(rows.flatMap((r) => r.flags ?? [])),
      );

      return apiSuccess({
        // 단일 객체 — items 리스트 아님 (집계 결과)
        manner: {
          avg, // 평균 평점 (0 = 평가 없음)
          totalEvaluations, // 평가 받은 "사람 수"(건수)는 노출 OK — flag별 건수만 ❌
          flagKinds, // 받은 flag 종류 (키워드 / 건수 없음)
        },
      });
    }

    if (type === "myteams") {
      /* PR-3C-3 (TU5 "내 팀"): 내가 현재 소속(active)인 팀 현황.
       * ⚠️ "teams"(가입 신청 이력)와 다른 개념 — 이건 이미 멤버인 팀 목록.
       *
       * 박제 요소(실값만 / mock ❌):
       *   - 팀명·지역·멤버수·내 role·마지막 활동(last_activity_at) — TeamMember+Team 실값
       *   - 운영진(captain/vice/manager)인 팀에 한해 pending 카운트 3종:
       *     · BT1 가입 신청  = team_join_requests.status='pending'
       *     · BT2 멤버 변경  = team_member_requests.status='pending'
       *     · BT5 매치 신청  = team_match_requests(to_team).status='pending'
       *   - 팀 매너 평균: 운영 DB에 팀 단위 매너 집계 컬럼 없음 → 응답에서 제외(프론트 hide)
       *
       * IDOR: userId = session 본인 고정. pending count 도 본인이 운영진인 팀만 조회.
       *
       * 운영진 판정 룰(teams/[id]/route.ts 동일): team.captainId === me 가 1순위 신뢰,
       *   team_members.role ∈ {captain,vice,manager} 가 fallback. role 은 'director' 등
       *   비표준 값이 섞여 있어 captainId 직접 매칭을 우선한다.
       */
      const TEAM_MANAGER_ROLES = ["captain", "vice", "manager"];

      // 1) 내가 active 멤버인 팀들 — 팀 정보 + 내 role/last_activity_at 동봉
      const memberships = await prisma.teamMember.findMany({
        where: { userId: ctx.userId, status: "active" },
        orderBy: { last_activity_at: { sort: "desc", nulls: "last" } },
        take: limit,
        include: {
          team: {
            select: {
              id: true,
              uuid: true,
              name: true,
              logoUrl: true,
              city: true,
              district: true,
              members_count: true,
              captainId: true, // 운영진 1순위 판정용
              primaryColor: true,
              secondaryColor: true,
            },
          },
        },
      });

      // 2) 운영진인 팀 id 만 추려 pending 카운트를 묶음 조회(N+1 회피).
      //    captainId 본인 OR role 이 운영진 → 운영진으로 인정.
      const operatorTeamIds = memberships
        .filter(
          (m) =>
            m.team.captainId === ctx.userId ||
            TEAM_MANAGER_ROLES.includes(m.role ?? ""),
        )
        .map((m) => m.teamId);

      // pending 카운트를 teamId 별 Map 으로 모은다(운영진 팀이 없으면 빈 Map).
      const joinPendingMap = new Map<bigint, number>();
      const changePendingMap = new Map<bigint, number>();
      const matchPendingMap = new Map<bigint, number>();

      if (operatorTeamIds.length > 0) {
        // BT1 가입 신청 pending — team_join_requests.status='pending'
        const joinGroups = await prisma.team_join_requests.groupBy({
          by: ["team_id"],
          where: { team_id: { in: operatorTeamIds }, status: "pending" },
          _count: { _all: true },
        });
        for (const g of joinGroups) joinPendingMap.set(g.team_id, g._count._all);

        // BT2 멤버 변경 신청 pending — team_member_requests.status='pending'
        const changeGroups = await prisma.teamMemberRequest.groupBy({
          by: ["teamId"],
          where: { teamId: { in: operatorTeamIds }, status: "pending" },
          _count: { _all: true },
        });
        for (const g of changeGroups)
          changePendingMap.set(g.teamId, g._count._all);

        // BT5 받은 매치 신청 pending — team_match_requests(to_team).status='pending'
        const matchGroups = await prisma.team_match_requests.groupBy({
          by: ["to_team_id"],
          where: { to_team_id: { in: operatorTeamIds }, status: "pending" },
          _count: { _all: true },
        });
        for (const g of matchGroups)
          matchPendingMap.set(g.to_team_id, g._count._all);
      }

      return apiSuccess({
        items: memberships.map((m) => {
          const isOperator =
            m.team.captainId === ctx.userId ||
            TEAM_MANAGER_ROLES.includes(m.role ?? "");
          return {
            id: m.id.toString(),
            // 내 role — captainId 본인이면 비표준 role 이라도 'captain' 으로 보정
            role: m.team.captainId === ctx.userId ? "captain" : (m.role ?? "member"),
            isOperator,
            // last_activity_at NULL → null 그대로(프론트가 hide), 값 있으면 ISO
            lastActivityAt: m.last_activity_at,
            // 운영진 팀만 pending 카운트(멤버 팀은 0 — 권한 밖 데이터 노출 ❌)
            pendingJoin: isOperator ? (joinPendingMap.get(m.teamId) ?? 0) : 0,
            pendingChange: isOperator ? (changePendingMap.get(m.teamId) ?? 0) : 0,
            pendingMatch: isOperator ? (matchPendingMap.get(m.teamId) ?? 0) : 0,
            team: {
              id: m.team.id.toString(),
              uuid: m.team.uuid,
              name: m.team.name,
              logoUrl: m.team.logoUrl,
              city: m.team.city,
              district: m.team.district,
              membersCount: m.team.members_count ?? 0,
              primaryColor: m.team.primaryColor,
              secondaryColor: m.team.secondaryColor,
            },
          };
        }),
      });
    }

    if (type === "teams") {
      /* 내 팀 가입 신청 이력. 인덱스: team_join_requests.user_id */
      const rows = await prisma.team_join_requests.findMany({
        where: { user_id: ctx.userId },
        orderBy: { created_at: "desc" },
        take: limit,
        include: {
          teams: {
            select: { id: true, uuid: true, name: true, city: true, district: true },
          },
        },
      });

      return apiSuccess({
        items: rows.map((r) => ({
          id: r.id.toString(),
          status: r.status, // "pending" | "approved" | "rejected"
          createdAt: r.created_at,
          rejectionReason: r.rejection_reason,
          team: {
            id: r.teams.id.toString(),
            uuid: r.teams.uuid,
            name: r.teams.name,
            city: r.teams.city,
            district: r.teams.district,
          },
        })),
      });
    }

    return apiError("type 파라미터가 필요합니다 (tournaments | games | teams | myteams | manner).", 400, "INVALID_TYPE");
  } catch {
    return apiError("활동 내역을 불러오지 못했습니다.", 500);
  }
});
