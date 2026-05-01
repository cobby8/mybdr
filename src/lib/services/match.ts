/**
 * Match Service — 경기(TournamentMatch) 관련 비즈니스 로직 중앙화
 *
 * Service 함수는 순수 데이터만 반환한다 (NextResponse 사용 금지).
 */
import { prisma } from "@/lib/db/prisma";
// 2026-05-02: dual_tournament 자동 진출 (loser → 패자전 / 조별 최종전 home 등)
// updateMatch + updateMatchStatus 가 호출. single elim 영향 0 (settings.loserNextMatchId 없으면 skip).
import { progressDualMatch } from "@/lib/tournaments/dual-progression";

// ---------------------------------------------------------------------------
// Select / Include 상수
// ---------------------------------------------------------------------------

export const MATCH_LIST_INCLUDE = {
  homeTeam: {
    include: {
      team: {
        select: { name: true, primaryColor: true, logoUrl: true },
      },
    },
  },
  awayTeam: {
    include: {
      team: {
        select: { name: true, primaryColor: true, logoUrl: true },
      },
    },
  },
  tournament_teams_tournament_matches_winner_team_idTotournament_teams: {
    select: { id: true },
  },
} as const;

// ---------------------------------------------------------------------------
// 타입
// ---------------------------------------------------------------------------

export interface CreateMatchInput {
  tournamentId: string;
  homeTeamId: bigint | null;
  awayTeamId: bigint | null;
  roundName?: string | null;
  roundNumber?: number | null;
  scheduledAt?: Date | null;
  venueName?: string | null;
}

export interface UpdateMatchInput {
  homeScore?: number;
  awayScore?: number;
  status?: string;
  winnerTeamId?: bigint | null;
  scheduledAt?: Date | null;
  venueName?: string | null;
  roundName?: string | null;
  notes?: string | null;
  homeTeamId?: bigint | null;
  awayTeamId?: bigint | null;
}

// ---------------------------------------------------------------------------
// Service 함수
// ---------------------------------------------------------------------------

/**
 * 대회 경기 목록 조회
 */
export async function listMatches(tournamentId: string) {
  return prisma.tournamentMatch.findMany({
    where: { tournamentId },
    include: MATCH_LIST_INCLUDE,
    orderBy: [{ round_number: "asc" }, { bracket_position: "asc" }],
  });
}

/**
 * 경기 단건 조회 (tournamentId 범위 검증 포함)
 */
export async function getMatch(matchId: bigint, tournamentId: string) {
  return prisma.tournamentMatch.findFirst({
    where: { id: matchId, tournamentId },
  });
}

/**
 * 경기 생성 + matches_count 원자적 증가
 */
export async function createMatch(input: CreateMatchInput) {
  return prisma.$transaction(async (tx) => {
    const match = await tx.tournamentMatch.create({
      data: {
        tournamentId: input.tournamentId,
        homeTeamId: input.homeTeamId,
        awayTeamId: input.awayTeamId,
        roundName: input.roundName ?? null,
        round_number: input.roundNumber ?? null,
        scheduledAt: input.scheduledAt ?? null,
        venue_name: input.venueName ?? null,
        status: "scheduled",
      },
    });
    await tx.tournament.update({
      where: { id: input.tournamentId },
      data: { matches_count: { increment: 1 } },
    });
    return match;
  });
}

/**
 * 경기 수정 (점수, 상태, 승자 등) + 승자 확정 시 다음 경기 팀 배치
 *
 * 반환값에 alreadyCompleted 플래그를 포함하여
 * 라우트에서 전적 갱신 여부를 결정할 수 있게 한다.
 */
export async function updateMatch(
  matchId: bigint,
  current: { status: string | null },
  input: UpdateMatchInput
) {
  const alreadyCompleted = current.status === "completed";

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.tournamentMatch.update({
      where: { id: matchId },
      data: {
        ...(input.homeScore !== undefined && { homeScore: input.homeScore }),
        ...(input.awayScore !== undefined && { awayScore: input.awayScore }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.winnerTeamId !== undefined && {
          winner_team_id: input.winnerTeamId,
        }),
        ...(input.scheduledAt !== undefined && {
          scheduledAt: input.scheduledAt,
        }),
        ...(input.venueName !== undefined && { venue_name: input.venueName }),
        ...(input.roundName !== undefined && { roundName: input.roundName }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.homeTeamId !== undefined && { homeTeamId: input.homeTeamId }),
        ...(input.awayTeamId !== undefined && { awayTeamId: input.awayTeamId }),
        ...(input.status === "completed" && { ended_at: new Date() }),
        ...(input.status === "in_progress" && { started_at: new Date() }),
      },
    });

    // 승자가 확정되고 next_match_id가 있으면 다음 경기에 팀 배치
    if (input.winnerTeamId && u.next_match_id) {
      const slot = u.next_match_slot; // "home" | "away"
      await tx.tournamentMatch.update({
        where: { id: u.next_match_id },
        data: {
          ...(slot === "home" && { homeTeamId: input.winnerTeamId }),
          ...(slot === "away" && { awayTeamId: input.winnerTeamId }),
          status: "scheduled",
        },
      });
    }

    // 2026-05-02: dual_tournament 면 loser 진출 + idempotent winner 진출 통합 처리
    // (winner 는 위 코드가 이미 처리, progressDualMatch 도 같은 슬롯에 같은 값 덮어쓰기 = 안전)
    if (input.winnerTeamId && input.status === "completed") {
      const tournament = await tx.tournament.findUnique({
        where: { id: u.tournamentId },
        select: { format: true },
      });
      if (tournament?.format === "dual_tournament") {
        await progressDualMatch(tx, matchId, input.winnerTeamId);
      }
    }

    return u;
  });

  return { updated, alreadyCompleted };
}

/**
 * 경기 삭제 + matches_count 원자적 감소
 * 완료된 경기는 삭제할 수 없다 (전적 롤백 불가).
 * @throws Error 완료된 경기 삭제 시도 시
 */
export async function deleteMatch(matchId: bigint, tournamentId: string) {
  const match = await prisma.tournamentMatch.findFirst({
    where: { id: matchId, tournamentId },
  });

  if (!match) return null;

  if (match.status === "completed") {
    throw new Error("COMPLETED_MATCH_DELETE");
  }

  await prisma.$transaction(async (tx) => {
    await tx.tournamentMatch.delete({ where: { id: matchId } });
    await tx.tournament.update({
      where: { id: tournamentId },
      data: { matches_count: { decrement: 1 } },
    });
  });

  return { deleted: true };
}

/**
 * 기록원 경기 상태 변경 (v1 API)
 */
export async function updateMatchStatus(
  matchId: bigint,
  status: string
) {
  // 2026-05-02: status="completed" 시 자동 winner 결정 + dual 자동 진출 통합
  // - homeScore vs awayScore 비교로 winner_team_id 자동 결정 (이미 채워져 있으면 그대로)
  // - winner → next_match_id 슬롯 채움 (single elim 호환, 기존 updateMatch 동일 패턴)
  // - dual_tournament 면 progressDualMatch 호출 (loser 진출 + idempotent winner 처리)
  return prisma.$transaction(async (tx) => {
    // 현재 매치 + tournament format 조회
    const current = await tx.tournamentMatch.findUnique({
      where: { id: matchId },
      select: {
        homeScore: true,
        awayScore: true,
        winner_team_id: true,
        homeTeamId: true,
        awayTeamId: true,
        next_match_id: true,
        next_match_slot: true,
        tournamentId: true,
      },
    });
    if (!current) {
      throw new Error(`updateMatchStatus: 매치 ${matchId} 를 찾을 수 없습니다.`);
    }

    // status="completed" + winner 미결정 + 점수 있으면 자동 결정
    let winnerTeamId: bigint | null = current.winner_team_id;
    if (
      status === "completed" &&
      !winnerTeamId &&
      current.homeTeamId &&
      current.awayTeamId
    ) {
      const h = current.homeScore ?? 0;
      const a = current.awayScore ?? 0;
      if (h > a) winnerTeamId = current.homeTeamId;
      else if (a > h) winnerTeamId = current.awayTeamId;
      // 동점 시 winnerTeamId = null → 진출 처리 X (별도 결정 필요)
    }

    // 매치 status + winner_team_id update
    const updated = await tx.tournamentMatch.update({
      where: { id: matchId },
      data: {
        status,
        ...(status === "in_progress" && { started_at: new Date() }),
        ...(status === "completed" && { ended_at: new Date() }),
        ...(winnerTeamId &&
          winnerTeamId !== current.winner_team_id && {
            winner_team_id: winnerTeamId,
          }),
      },
      select: { id: true, status: true, started_at: true, ended_at: true },
    });

    // winner 진출 (single elim 호환) — 기존 updateMatch 와 같은 패턴
    if (
      winnerTeamId &&
      status === "completed" &&
      current.next_match_id &&
      current.next_match_slot
    ) {
      const slot = current.next_match_slot as "home" | "away";
      await tx.tournamentMatch.update({
        where: { id: current.next_match_id },
        data: {
          ...(slot === "home" && { homeTeamId: winnerTeamId }),
          ...(slot === "away" && { awayTeamId: winnerTeamId }),
          status: "scheduled",
        },
      });
    }

    // dual_tournament 면 progressDualMatch (loser 진출 + idempotent winner 처리)
    if (winnerTeamId && status === "completed") {
      const tournament = await tx.tournament.findUnique({
        where: { id: current.tournamentId },
        select: { format: true },
      });
      if (tournament?.format === "dual_tournament") {
        await progressDualMatch(tx, matchId, winnerTeamId);
      }
    }

    return updated;
  });
}

/**
 * 경기 이벤트 목록 조회 (undone 제외)
 */
export async function listMatchEvents(matchId: bigint) {
  return prisma.match_events.findMany({
    where: { matchId, undone: false },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * 경기 이벤트 생성 (idempotency 검사 포함)
 * @returns { event, isDuplicate } — 중복이면 isDuplicate=true
 */
export async function createMatchEvent(
  matchId: bigint,
  tournamentId: string,
  recordedBy: bigint,
  data: {
    eventType: string;
    teamId?: bigint | null;
    playerId?: bigint | null;
    value?: number | null;
    quarter?: number | null;
    gameTime?: string | null;
    clientEventId?: string | null;
  }
) {
  // idempotency check
  if (data.clientEventId) {
    const existing = await prisma.match_events.findFirst({
      where: { matchId, clientEventId: data.clientEventId },
    });
    if (existing) {
      return { event: existing, isDuplicate: true };
    }
  }

  const event = await prisma.match_events.create({
    data: {
      matchId,
      tournamentId,
      eventType: data.eventType,
      teamId: data.teamId ?? null,
      playerId: data.playerId ?? null,
      value: data.value ?? null,
      quarter: data.quarter ?? null,
      gameTime: data.gameTime ?? null,
      clientEventId: data.clientEventId ?? null,
      recordedBy,
    },
  });

  return { event, isDuplicate: false };
}

/**
 * 경기 현재 점수 조회
 */
export async function getMatchScore(matchId: bigint) {
  return prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      homeScore: true,
      awayScore: true,
      status: true,
      tournamentId: true,
      homeTeamId: true,
      awayTeamId: true,
    },
  });
}
