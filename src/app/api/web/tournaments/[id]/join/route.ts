import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getWebUser } from "@/lib/auth/tournament-auth";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { apiSuccess, apiError } from "@/lib/api/response";

type Ctx = { params: Promise<{ id: string }> };

// 참가신청 입력 스키마
const joinSchema = z.object({
  teamId: z.number().int().positive(),
  category: z.string().min(1).optional(),
  division: z.string().min(1).optional(),
  uniformHome: z.string().optional(),
  uniformAway: z.string().optional(),
  managerName: z.string().min(1, "대표자 이름을 입력하세요"),
  managerPhone: z.string().min(1, "대표자 연락처를 입력하세요"),
  players: z.array(
    z.object({
      userId: z.number().int().positive(),
      jerseyNumber: z.number().int().min(0).max(99).optional(),
      position: z.string().optional(),
      playerName: z.string().optional(),
      birthDate: z.string().optional(),
      isElite: z.boolean().default(false),
    })
  ).min(1, "최소 1명 이상의 선수를 등록해야 합니다"),
});

// GET /api/web/tournaments/[id]/join — 참가신청에 필요한 데이터 조회
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const user = await getWebUser();
  if (!user) return apiError("로그인이 필요합니다.", 401);

  // 대회 정보 (접수 관련 필드)
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      status: true,
      registration_start_at: true,
      registration_end_at: true,
      categories: true,
      div_caps: true,
      div_fees: true,
      allow_waiting_list: true,
      waiting_list_cap: true,
      entry_fee: true,
      bank_name: true,
      bank_account: true,
      bank_holder: true,
      fee_notes: true,
      roster_min: true,
      roster_max: true,
      auto_approve_teams: true,
      maxTeams: true,
    },
  });

  if (!tournament) return apiError("대회를 찾을 수 없습니다.", 404);

  // 접수 기간 체크
  const now = new Date();
  const regOpen = tournament.registration_start_at;
  const regClose = tournament.registration_end_at;
  const isRegistrationOpen =
    ["registration", "registration_open", "active", "published"].includes(tournament.status ?? "") &&
    (!regOpen || regOpen <= now) &&
    (!regClose || regClose >= now);

  // 유저의 팀 목록 (주장인 팀만)
  const myTeams = await prisma.team.findMany({
    where: {
      captainId: user.userId,
      status: "active",
    },
    select: {
      id: true,
      name: true,
      primaryColor: true,
      secondaryColor: true,
      teamMembers: {
        where: { status: "active" },
        select: {
          id: true,
          userId: true,
          jerseyNumber: true,
          position: true,
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              nickname: true,
              position: true,
              height: true,
              birth_date: true,
            },
          },
        },
      },
    },
  });

  // 이미 신청한 팀 ID 목록
  const existingEntries = await prisma.tournamentTeam.findMany({
    where: {
      tournamentId: id,
      registered_by_id: user.userId,
    },
    select: { teamId: true, status: true },
  });

  // 디비전별 현재 등록 팀 수
  const divisionCounts = await prisma.tournamentTeam.groupBy({
    by: ["division"],
    where: {
      tournamentId: id,
      status: { in: ["pending", "approved"] },
    },
    _count: { id: true },
  });

  // 유저 정보
  const userInfo = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { name: true, phone: true },
  });

  return apiSuccess({
    tournament,
    isRegistrationOpen,
    myTeams,
    existingEntries,
    divisionCounts,
    userInfo,
  });
}

// POST /api/web/tournaments/[id]/join — 참가신청 제출
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const user = await getWebUser();
  if (!user) return apiError("로그인이 필요합니다.", 401);

  // 대회 존재 및 접수 상태 확인
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,            // 알림 메시지에 대회명 표시용
      organizerId: true,     // 주최자에게 알림 발송용
      status: true,
      registration_start_at: true,
      registration_end_at: true,
      categories: true,
      div_caps: true,
      allow_waiting_list: true,
      waiting_list_cap: true,
      roster_min: true,
      roster_max: true,
      auto_approve_teams: true,
    },
  });

  if (!tournament) return apiError("대회를 찾을 수 없습니다.", 404);

  const now = new Date();
  const regOpen = tournament.registration_start_at;
  const regClose = tournament.registration_end_at;
  const isRegistrationOpen =
    ["registration", "registration_open", "active", "published"].includes(tournament.status ?? "") &&
    (!regOpen || regOpen <= now) &&
    (!regClose || regClose >= now);

  if (!isRegistrationOpen) {
    return apiError("현재 접수 기간이 아닙니다.", 400);
  }

  // 바디 파싱
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "유효하지 않은 입력입니다.", 422);
  }

  const data = parsed.data;
  const teamId = BigInt(data.teamId);

  // 팀 소유권 확인 (주장만 신청 가능)
  const team = await prisma.team.findFirst({
    where: { id: teamId, captainId: user.userId },
  });
  if (!team) {
    return apiError("팀의 주장만 참가신청할 수 있습니다.", 403);
  }

  // 2026-05-01: 본인(주장) 의 등번호·선출 필수 차단 (decisions.md 사용자 결정)
  // 2026-05-05 PR1 정리: 등번호 검증 source 변경 — user.default_jersey_number → team_members.jersey_number
  //   - 이유: 등번호는 "팀별 본인 등번호" 가 자연스러운 도메인. 같은 사람도 팀마다 다른 번호 가능.
  //   - 선출 여부 (is_elite) 는 사람 단위 속성이므로 user 컬럼 유지.
  //   - 검증: 해당 팀의 captain (= 본인) team_members row 의 jersey_number NULL 차단.
  const captainTeamMember = await prisma.teamMember.findFirst({
    where: { teamId, userId: user.userId, status: "active" },
    select: { jerseyNumber: true },
  });
  const captainUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { is_elite: true },
  });
  if (
    captainTeamMember?.jerseyNumber === null ||
    captainTeamMember?.jerseyNumber === undefined ||
    captainUser?.is_elite === null ||
    captainUser?.is_elite === undefined
  ) {
    return apiError(
      "대회 출전 신청 전에 본인의 팀 등번호와 선출 여부를 입력해 주세요. /profile/edit",
      400,
    );
  }

  // 중복 신청 확인
  const existing = await prisma.tournamentTeam.findUnique({
    where: { tournamentId_teamId: { tournamentId: id, teamId } },
  });
  if (existing) {
    return apiError("이미 참가신청된 팀입니다.", 409);
  }

  // 로스터 인원 체크
  const rosterMin = tournament.roster_min ?? 5;
  const rosterMax = tournament.roster_max ?? 12;
  if (data.players.length < rosterMin) {
    return apiError(`최소 ${rosterMin}명 이상의 선수를 등록해야 합니다.`, 422);
  }
  if (data.players.length > rosterMax) {
    return apiError(`최대 ${rosterMax}명까지 등록 가능합니다.`, 422);
  }

  // 2026-05-05: 선수 배번 필수 (사용자 정책 결정)
  //   - 대회 출전 = 선수(player) 활동 → 배번 필수 식별
  //   - 감독/팀장/매니저는 별도 흐름 (admin 추가 API). join 폼은 모두 player.
  //   - 누락 시 차단 + 친절 메시지 (어느 선수가 누락인지 표시)
  const noJersey = data.players.filter(
    (p) => p.jerseyNumber === undefined || p.jerseyNumber === null,
  );
  if (noJersey.length > 0) {
    // userId 로 닉네임 조회 (운영자가 누구 누락인지 즉시 파악)
    const userIds = noJersey.map((p) => BigInt(p.userId));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nickname: true, name: true },
    });
    const names = noJersey
      .map((p) => {
        const u = users.find((x) => x.id === BigInt(p.userId));
        return u?.nickname ?? u?.name ?? p.playerName ?? `userId=${p.userId}`;
      })
      .join(", ");
    return apiError(
      `다음 선수의 등번호가 입력되지 않았습니다: ${names}\n` +
        `대회 출전을 위해서는 모든 선수의 등번호가 필요합니다. ` +
        `각 선수의 본인 프로필에서 기본 등번호를 설정한 후 다시 시도해 주세요.`,
      422,
    );
  }

  // 등번호 중복 체크
  const jerseyNumbers = data.players
    .map((p) => p.jerseyNumber)
    .filter((n): n is number => n !== undefined && n !== null);
  if (new Set(jerseyNumbers).size !== jerseyNumbers.length) {
    return apiError("등번호가 중복됩니다.", 422);
  }

  // 디비전 정원 체크 + 대기접수 판단
  let isWaiting = false;
  let waitingNumber: number | null = null;

  if (data.division) {
    const divCaps = (tournament.div_caps as Record<string, number>) ?? {};
    const cap = divCaps[data.division];

    if (cap) {
      const currentCount = await prisma.tournamentTeam.count({
        where: {
          tournamentId: id,
          division: data.division,
          status: { in: ["pending", "approved"] },
        },
      });

      if (currentCount >= cap) {
        if (!tournament.allow_waiting_list) {
          return apiError(`${data.division} 디비전의 정원이 마감되었습니다.`, 400);
        }

        // 대기접수
        isWaiting = true;
        const maxWaiting = await prisma.tournamentTeam.count({
          where: {
            tournamentId: id,
            division: data.division,
            waiting_number: { not: null },
          },
        });

        const waitingCap = tournament.waiting_list_cap;
        if (waitingCap && maxWaiting >= waitingCap) {
          return apiError("대기접수도 마감되었습니다.", 400);
        }

        waitingNumber = maxWaiting + 1;
      }
    }
  }

  // 트랜잭션: TournamentTeam + TournamentTeamPlayers 생성
  const result = await prisma.$transaction(async (tx) => {
    const tournamentTeam = await tx.tournamentTeam.create({
      data: {
        tournamentId: id,
        teamId,
        status: isWaiting ? "waiting" : (tournament.auto_approve_teams ? "approved" : "pending"),
        registered_by_id: user.userId,
        category: data.category ?? null,
        division: data.division ?? null,
        uniform_home: data.uniformHome ?? null,
        uniform_away: data.uniformAway ?? null,
        manager_name: data.managerName,
        manager_phone: data.managerPhone,
        waiting_number: waitingNumber,
        applied_at: now,
        ...(tournament.auto_approve_teams && !isWaiting ? { approved_at: now } : {}),
      },
    });

    // 선수 등록
    await tx.tournamentTeamPlayer.createMany({
      data: data.players.map((p) => ({
        tournamentTeamId: tournamentTeam.id,
        userId: BigInt(p.userId),
        jerseyNumber: p.jerseyNumber ?? null,
        position: p.position ?? null,
        player_name: p.playerName ?? null,
        birth_date: p.birthDate ?? null,
        is_elite: p.isElite,
        auto_registered: true,
      })),
    });

    // teams_count 업데이트 (대기접수가 아닌 경우)
    if (!isWaiting && tournament.auto_approve_teams) {
      await tx.tournament.update({
        where: { id },
        data: { teams_count: { increment: 1 } },
      });
    }

    return tournamentTeam;
  });

  // --- 알림 발송 (fire-and-forget: 알림 실패가 참가신청을 실패시키지 않음) ---

  // (a) 신청자에게: 참가신청 완료 알림
  createNotification({
    userId: user.userId,
    notificationType: NOTIFICATION_TYPES.TOURNAMENT_JOIN_SUBMITTED,
    title: "대회 참가 신청 완료",
    content: `"${tournament.name}" 대회에 참가 신청이 완료되었습니다.${isWaiting ? ` (대기 ${waitingNumber}번)` : ""}`,
    actionUrl: `/tournaments/${tournament.id}`,
    notifiableType: "tournament",
    notifiableId: result.id,
    metadata: {
      tournament: {
        id: tournament.id,
        name: tournament.name,
      },
      team: {
        id: team.id.toString(),
        name: team.name,
      },
    },
  }).catch(() => {});

  // (b) 대회 주최자에게: 새 참가신청 접수 알림
  createNotification({
    userId: tournament.organizerId,
    notificationType: NOTIFICATION_TYPES.TOURNAMENT_JOIN_RECEIVED,
    title: "새 팀 참가 신청",
    content: `"${team.name}" 팀이 "${tournament.name}" 대회에 참가 신청했습니다.`,
    actionUrl: `/tournaments/${tournament.id}`,
    notifiableType: "tournament",
    notifiableId: result.id,
    metadata: {
      tournament: {
        id: tournament.id,
        name: tournament.name,
      },
      team: {
        id: team.id.toString(),
        name: team.name,
      },
      applicant: {
        id: user.userId.toString(),
      },
    },
  }).catch(() => {});

  return apiSuccess({
    id: result.id,
    status: result.status,
    waitingNumber: result.waiting_number,
    message: isWaiting
      ? `대기접수 완료 (대기 ${waitingNumber}번)`
      : tournament.auto_approve_teams
        ? "참가 승인 완료"
        : "참가신청 완료 (승인 대기중)",
  }, 201);
}
