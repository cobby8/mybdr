import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

type Ctx = { params: Promise<{ id: string }> };

/**
 * 대회 참가팀 탭 공개 API (인증 불필요)
 * GET /api/web/tournaments/[id]/public-teams
 *
 * 대회 상세 페이지에서 "참가팀" 탭 클릭 시 호출
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return apiError("Invalid tournament ID", 400);
  }

  const teamsWithPlayers = await prisma.tournamentTeam.findMany({
    where: { tournamentId: id },
    include: {
      // 카드에 지역/로고/전적/모집중 표시를 위해 select 확장 (TeamCard 공통 스키마)
      team: {
        select: {
          name: true,
          // Phase 2A-2: 영문명/대표언어 — 참가팀 카드도 Phase 2C에서 언어 스위칭 적용 가능하게 필드 내려줌
          name_en: true,
          name_primary: true,
          primaryColor: true,
          secondaryColor: true,
          logoUrl: true,
          city: true,
          district: true,
          wins: true,
          losses: true,
          accepting_members: true,
          tournaments_count: true,
          // TeamCardV2 가 창단 연도 표시에 사용 (B-1 디자인 일치, 2026-04-29)
          createdAt: true,
        },
      },
      players: {
        select: {
          id: true,
          userId: true, // 선수 프로필 링크용
          jerseyNumber: true,
          position: true,
          users: { select: { nickname: true } },
        },
      },
    },
  });

  // BigInt -> string 직렬화
  const serialized = teamsWithPlayers.map((t) => ({
    id: t.id.toString(),
    teamId: t.teamId.toString(), // Team 테이블의 실제 id (팀 페이지 링크용)
    teamName: t.team.name,
    // Phase 2A-2: 영문 팀명 + 대표 언어
    // → 참가팀 카드가 Phase 2C에서 name_primary에 따라 한/영 타이틀을 바꿀 수 있게 한다.
    teamNameEn: t.team.name_en,
    teamNamePrimary: t.team.name_primary,
    primaryColor: t.team.primaryColor,
    secondaryColor: t.team.secondaryColor,
    // 로고 URL — 프론트에서 이미지/플레이스홀더 분기 판단용
    logoUrl: t.team.logoUrl,
    // 참가팀 탭 카드용 지역 정보 추가
    city: t.team.city,
    district: t.team.district,
    // TeamCard 재사용을 위한 전적/모집중 필드
    wins: t.team.wins,
    losses: t.team.losses,
    accepting_members: t.team.accepting_members,
    tournaments_count: t.team.tournaments_count,
    // 창단 연도 — TeamCardV2 가 사용 (Date → ISO 문자열 직렬화)
    createdAt: t.team.createdAt ? t.team.createdAt.toISOString() : null,
    groupName: t.groupName,
    players: t.players.map((p) => ({
      id: p.id.toString(),
      userId: p.userId ? p.userId.toString() : null, // 선수 프로필 링크용 (null이면 미연결)
      jerseyNumber: p.jerseyNumber,
      position: p.position,
      nickname: p.users?.nickname ?? "선수",
    })),
  }));

  return apiSuccess({ teams: serialized });
}
