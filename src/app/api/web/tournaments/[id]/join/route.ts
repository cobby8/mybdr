import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getWebUser } from "@/lib/auth/tournament-auth";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { apiSuccess, apiError } from "@/lib/api/response";
// 2026-05-05 Phase 5 PR14 — 활동 추적 (대회 출전 = 활동 5종 중 #2)
import { trackTeamMemberActivity } from "@/lib/team-members/track-activity";

type Ctx = { params: Promise<{ id: string }> };

// 참가신청 입력 스키마
// 2026-05-05 PR3: 옵션 C+UI — 사용자/운영자가 jersey/position 직접 입력 X.
//   ttp.jerseyNumber / ttp.position 은 팀 영구 번호 (`team_members.*`) 에서 서버가 자동 복사.
//   클라이언트가 보내도 무해 (서버에서 무시) — 호환을 위해 schema 에서는 .optional() 유지하되
//   POST handler 에서 사용하지 않음. 추후 클라가 필드를 떼면 자연 제거됨.
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
      // 호환 필드 — 서버에서 사용 X (team_members 자동 복사로 대체). 클라가 보내도 무시.
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

  // 2026-05-05 PR3: 옵션 C+UI — ttp 자동 sync.
  //   왜: 등번호는 "팀별 영구 번호" 가 자연 도메인. team_members.jersey_number 가 single source.
  //        사용자/운영자가 ttp 에 별도 입력 = 도메인 분리 위반 + 데이터 mismatch 위험 (errors.md 5/2).
  //   어떻게:
  //     1) 선택된 player(userId) 의 team_members row 일괄 SELECT (해당 팀, status=active)
  //     2) role + jersey 분기:
  //        - role=player + jersey=NULL → 차단 (422, 누락 선수 닉네임 나열)
  //        - role=coach/captain + jersey=NULL → 허용 (선택)
  //     3) ttp INSERT 시 team_members.jersey_number / position 을 ttp.jerseyNumber / position 으로 복사
  //   회귀 가드: 5/5 ef7e78e role 분기 룰 보존 (player 필수 / coach 선택).

  // (a) 일괄 SELECT — 해당 팀 active 멤버 (선택 player userId 만)
  const playerUserIds = data.players.map((p) => BigInt(p.userId));
  const teamMembers = await prisma.teamMember.findMany({
    where: { teamId, userId: { in: playerUserIds }, status: "active" },
    select: { userId: true, jerseyNumber: true, position: true, role: true },
  });
  // userId → team_members row 빠른 lookup 용 Map (BigInt 비교 회피)
  const memberMap = new Map<string, { jerseyNumber: number | null; position: string | null; role: string | null }>();
  for (const m of teamMembers) {
    if (m.userId !== null) {
      memberMap.set(m.userId.toString(), {
        jerseyNumber: m.jerseyNumber,
        position: m.position,
        role: m.role,
      });
    }
  }

  // (b) role 분기 검증 — player 만 jersey 필수
  const missingJerseyPlayers: number[] = [];
  for (const p of data.players) {
    const member = memberMap.get(BigInt(p.userId).toString());
    // team_members row 자체가 없으면 "팀에 가입되지 않은 사용자" → 별도 차단 (방어)
    if (!member) {
      return apiError(
        `userId=${p.userId} 는 해당 팀의 활성 멤버가 아닙니다. 팀 멤버 등록을 먼저 진행해 주세요.`,
        422,
      );
    }
    // role=player 인데 jersey 없음 → 차단 누적
    // (role 이 null/undefined 이면 기본 player 로 간주 — schema default 'player')
    const memberRole = member.role ?? "player";
    if (memberRole === "player" && (member.jerseyNumber === null || member.jerseyNumber === undefined)) {
      missingJerseyPlayers.push(p.userId);
    }
  }
  if (missingJerseyPlayers.length > 0) {
    // userId → 닉네임 (운영자가 누구 누락인지 즉시 파악)
    const userIds = missingJerseyPlayers.map((id) => BigInt(id));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nickname: true, name: true },
    });
    const names = missingJerseyPlayers
      .map((id) => {
        const u = users.find((x) => x.id === BigInt(id));
        return u?.nickname ?? u?.name ?? `userId=${id}`;
      })
      .join(", ");
    return apiError(
      `다음 선수의 팀 등번호가 등록되지 않았습니다: ${names}\n` +
        `등번호는 팀별 영구 번호로, 팀 페이지에서 먼저 등록해야 대회 출전이 가능합니다.`,
      422,
    );
  }

  // (c) ttp 등번호 중복 체크 — team_members 에서 가져온 번호 기준
  //     UNIQUE(tournament_team_id, jersey_number) 제약 사전 차단 (DB 에러 방지).
  //     NULL 은 중복 허용 (coach 다수가 NULL 가능).
  const jerseyNumbersFromMembers = data.players
    .map((p) => memberMap.get(BigInt(p.userId).toString())?.jerseyNumber)
    .filter((n): n is number => n !== null && n !== undefined);
  if (new Set(jerseyNumbersFromMembers).size !== jerseyNumbersFromMembers.length) {
    return apiError(
      "팀 내 등번호가 중복됩니다. 팀 페이지에서 등번호를 먼저 정리해 주세요.",
      422,
    );
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
    // 2026-05-05 PR3: ttp.jerseyNumber / position 은 team_members 자동 복사 (옵션 C+UI).
    //   클라이언트가 보낸 p.jerseyNumber / p.position 은 무시 — single source = team_members.
    await tx.tournamentTeamPlayer.createMany({
      data: data.players.map((p) => {
        const member = memberMap.get(BigInt(p.userId).toString());
        return {
          tournamentTeamId: tournamentTeam.id,
          userId: BigInt(p.userId),
          // team_members.jersey_number 자동 복사 (NULL 가능 — coach/captain)
          jerseyNumber: member?.jerseyNumber ?? null,
          // position 도 동일 도메인 룰 — team_members 우선
          position: member?.position ?? null,
          player_name: p.playerName ?? null,
          birth_date: p.birthDate ?? null,
          is_elite: p.isElite,
          auto_registered: true,
        };
      }),
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

  // --- 2026-05-05 Phase 5 PR14: 활동 추적 (대회 출전 = 본 팀의 모든 player 활동 갱신) ---
  // 이유(왜): 보고서 §3-2 — 대회 출전 시점에 ttp 가 신설되는 player 들 = 본 팀의 활동 멤버.
  //   각 player 별 본 팀 last_activity_at 갱신 (5분 throttle 내부 처리).
  //   fire-and-forget — 실패해도 참가신청 자체 영향 0.
  for (const p of data.players) {
    trackTeamMemberActivity(BigInt(teamId), BigInt(p.userId)).catch(() => {});
  }

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
