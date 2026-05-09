/**
 * Match Service — 경기(TournamentMatch) 관련 비즈니스 로직 중앙화
 *
 * Service 함수는 순수 데이터만 반환한다 (NextResponse 사용 금지).
 */
import { prisma } from "@/lib/db/prisma";
// 2026-05-02: dual_tournament 자동 진출 (loser → 패자전 / 조별 최종전 home 등)
// updateMatch + updateMatchStatus 가 호출. single elim 영향 0 (settings.loserNextMatchId 없으면 skip).
import { progressDualMatch } from "@/lib/tournaments/dual-progression";
import { recordMatchAudit, type AuditSource } from "@/lib/tournaments/match-audit";
// 2026-05-10: pending → scheduled 자동 전환 헬퍼 (winner 진출 시 다음 매치 status 결정에 사용)
import { shouldAutoSchedule } from "@/lib/tournaments/auto-status";
// 2026-05-03: Phase 2 — 매치 종료 시 알기자 단신 자동 생성
// 2026-05-09: Vercel serverless 환경에서 fire-and-forget Promise 가 응답 종료 후 abort 되는 문제
//             해결 — @vercel/functions 의 waitUntil 로 wrap. dev/local 에서는 단순 Promise 처리로 동작.
import { triggerMatchBriefPublish } from "@/lib/news/auto-publish-match-brief";
import { waitUntil } from "@vercel/functions";

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
  input: UpdateMatchInput,
  audit?: { source: AuditSource; context: string; changedBy: bigint | null },
) {
  const alreadyCompleted = current.status === "completed";

  const updated = await prisma.$transaction(async (tx) => {
    // audit 용 before 스냅샷 (audit 옵션 있을 때만)
    const before = audit
      ? await tx.tournamentMatch.findUnique({
          where: { id: matchId },
          select: {
            homeTeamId: true, awayTeamId: true, winner_team_id: true,
            status: true, homeScore: true, awayScore: true, scheduledAt: true,
          },
        })
      : null;

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

    // audit 기록 — caller 가 audit 옵션 전달한 경우만
    if (audit && before) {
      const after: Record<string, unknown> = {};
      if (input.homeScore !== undefined) after.homeScore = input.homeScore;
      if (input.awayScore !== undefined) after.awayScore = input.awayScore;
      if (input.status !== undefined) after.status = input.status;
      if (input.winnerTeamId !== undefined) after.winner_team_id = input.winnerTeamId;
      if (input.scheduledAt !== undefined) after.scheduledAt = input.scheduledAt;
      if (input.homeTeamId !== undefined) after.homeTeamId = input.homeTeamId;
      if (input.awayTeamId !== undefined) after.awayTeamId = input.awayTeamId;
      await recordMatchAudit(tx, matchId, before, after, audit.source, audit.context, audit.changedBy);
    }

    // 승자가 확정되고 next_match_id가 있으면 다음 경기에 팀 배치
    // 2026-05-02: self-heal 가드 + audit 추가 (errors.md "양쪽 같은 팀" 회귀 방지)
    if (input.winnerTeamId && u.next_match_id && u.next_match_slot) {
      const slot = u.next_match_slot as "home" | "away";
      const targetField = slot === "home" ? "homeTeamId" : "awayTeamId";
      const oppositeField = slot === "home" ? "awayTeamId" : "homeTeamId";

      // self-heal: next_match 의 반대 슬롯에 같은 winnerTeamId 가 있으면 NULL 정정
      const nextBefore = await tx.tournamentMatch.findUnique({
        where: { id: u.next_match_id },
        select: { homeTeamId: true, awayTeamId: true, status: true },
      });
      if (nextBefore && nextBefore[oppositeField] === input.winnerTeamId) {
        await tx.tournamentMatch.update({
          where: { id: u.next_match_id },
          data: { [oppositeField]: null },
        });
        await recordMatchAudit(
          tx,
          u.next_match_id,
          { [oppositeField]: nextBefore[oppositeField] },
          { [oppositeField]: null },
          audit?.source ?? "system",
          `updateMatch self-heal (source match ${matchId}, winnerTeamId=${input.winnerTeamId}, ${oppositeField} NULL 정정)`,
          audit?.changedBy ?? null,
        );
      }

      // 2026-05-10: status 자동 전환은 4 조건 충족 시만 (homeTeam + awayTeam + scheduledAt + 현재 pending)
      // - winner 진출로 채워지는 슬롯이 home 이면 awayTeamId 가 이미 있어야 함 (반대도 동일)
      // - scheduledAt 이 NULL 이면 "팀만 채워졌고 일정 미정" → pending 유지가 맞음 (자동 전환 X)
      // - 기존: 무조건 status="scheduled" 박았음 → 일정 미정인데도 scheduled 되어 stale 가능. 헬퍼로 가드.
      const projectedHome =
        targetField === "homeTeamId" ? input.winnerTeamId : (nextBefore?.homeTeamId ?? null);
      const projectedAway =
        targetField === "awayTeamId" ? input.winnerTeamId : (nextBefore?.awayTeamId ?? null);
      const nextScheduledAt = await tx.tournamentMatch.findUnique({
        where: { id: u.next_match_id },
        select: { scheduledAt: true },
      });
      const willAutoSchedule = shouldAutoSchedule({
        currentStatus: nextBefore?.status ?? null,
        homeTeamId: projectedHome,
        awayTeamId: projectedAway,
        scheduledAt: nextScheduledAt?.scheduledAt ?? null,
      });

      await tx.tournamentMatch.update({
        where: { id: u.next_match_id },
        data: {
          [targetField]: input.winnerTeamId,
          // 자동 전환 가능할 때만 status="scheduled" 박음 (조건 미충족 시 기존 status 유지)
          ...(willAutoSchedule && { status: "scheduled" }),
        },
      });
      await recordMatchAudit(
        tx,
        u.next_match_id,
        {
          [targetField]: nextBefore?.[targetField] ?? null,
          ...(willAutoSchedule && { status: nextBefore?.status ?? null }),
        },
        {
          [targetField]: input.winnerTeamId,
          ...(willAutoSchedule && { status: "scheduled" }),
        },
        audit?.source ?? "system",
        willAutoSchedule
          ? `updateMatch winner 진출 + auto-schedule pending→scheduled (source match ${matchId}, slot=${slot})`
          : `updateMatch winner 진출 (source match ${matchId}, slot=${slot})`,
        audit?.changedBy ?? null,
      );
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

  // 2026-05-03: 새로 completed 로 전환된 경우만 알기자 자동 발행 트리거
  // (이미 completed 였던 매치 점수 수정 시 중복 생성 X — triggerMatchBriefPublish 자체도 멱등)
  // 2026-05-09: waitUntil 로 wrap — Vercel serverless 응답 후에도 background Promise 완료 보장.
  // dev/local 에서는 waitUntil 가 단순 Promise 처리로 동작 (await X / 호출자 차단 X).
  if (input.status === "completed" && !alreadyCompleted) {
    waitUntil(triggerMatchBriefPublish(matchId));
  }

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
  status: string,
  audit?: { source: AuditSource; context: string; changedBy: bigint | null },
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

    // audit 기록 (caller 가 audit 옵션 전달한 경우만)
    if (audit) {
      const after: Record<string, unknown> = { status };
      if (winnerTeamId && winnerTeamId !== current.winner_team_id) {
        after.winner_team_id = winnerTeamId;
      }
      // before status 는 별도 조회 (current.status 없음)
      const beforeRow = await tx.tournamentMatch.findUnique({
        where: { id: matchId },
        select: { status: true, winner_team_id: true },
      });
      await recordMatchAudit(
        tx,
        matchId,
        { status: beforeRow?.status ?? null, winner_team_id: current.winner_team_id },
        after,
        audit.source,
        audit.context,
        audit.changedBy,
      );
    }

    // winner 진출 (single elim 호환) — 기존 updateMatch 와 같은 패턴
    // 2026-05-02: self-heal 가드 + audit 추가 (errors.md "양쪽 같은 팀" 회귀 방지)
    if (
      winnerTeamId &&
      status === "completed" &&
      current.next_match_id &&
      current.next_match_slot
    ) {
      const slot = current.next_match_slot as "home" | "away";
      const targetField = slot === "home" ? "homeTeamId" : "awayTeamId";
      const oppositeField = slot === "home" ? "awayTeamId" : "homeTeamId";

      const nextBefore = await tx.tournamentMatch.findUnique({
        where: { id: current.next_match_id },
        select: { homeTeamId: true, awayTeamId: true },
      });
      if (nextBefore && nextBefore[oppositeField] === winnerTeamId) {
        await tx.tournamentMatch.update({
          where: { id: current.next_match_id },
          data: { [oppositeField]: null },
        });
        await recordMatchAudit(
          tx,
          current.next_match_id,
          { [oppositeField]: nextBefore[oppositeField] },
          { [oppositeField]: null },
          audit?.source ?? "system",
          `updateMatchStatus self-heal (source match ${matchId}, winnerTeamId=${winnerTeamId}, ${oppositeField} NULL 정정)`,
          audit?.changedBy ?? null,
        );
      }

      // 2026-05-10: status 자동 전환 가드 (updateMatch 와 동일 룰)
      // 4 조건 모두 충족 시만 "scheduled" 전환 — scheduledAt 미정이면 pending 유지
      const projectedHome =
        targetField === "homeTeamId" ? winnerTeamId : (nextBefore?.homeTeamId ?? null);
      const projectedAway =
        targetField === "awayTeamId" ? winnerTeamId : (nextBefore?.awayTeamId ?? null);
      const nextStatusRow = await tx.tournamentMatch.findUnique({
        where: { id: current.next_match_id },
        select: { status: true, scheduledAt: true },
      });
      const willAutoSchedule = shouldAutoSchedule({
        currentStatus: nextStatusRow?.status ?? null,
        homeTeamId: projectedHome,
        awayTeamId: projectedAway,
        scheduledAt: nextStatusRow?.scheduledAt ?? null,
      });

      await tx.tournamentMatch.update({
        where: { id: current.next_match_id },
        data: {
          [targetField]: winnerTeamId,
          ...(willAutoSchedule && { status: "scheduled" }),
        },
      });
      await recordMatchAudit(
        tx,
        current.next_match_id,
        {
          [targetField]: nextBefore?.[targetField] ?? null,
          ...(willAutoSchedule && { status: nextStatusRow?.status ?? null }),
        },
        {
          [targetField]: winnerTeamId,
          ...(willAutoSchedule && { status: "scheduled" }),
        },
        audit?.source ?? "system",
        willAutoSchedule
          ? `updateMatchStatus winner 진출 + auto-schedule pending→scheduled (source match ${matchId}, slot=${slot})`
          : `updateMatchStatus winner 진출 (source match ${matchId}, slot=${slot})`,
        audit?.changedBy ?? null,
      );
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
  }).then((result) => {
    // 2026-05-03: status="completed" 변경 시 알기자 자동 발행 (트랜잭션 외부)
    // 2026-05-09: waitUntil 로 wrap — Vercel serverless 응답 종료 후 process abort 방지.
    // dev/local 에서도 동작 (waitUntil 가 단순 Promise 처리).
    if (status === "completed") {
      waitUntil(triggerMatchBriefPublish(matchId));
    }
    return result;
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
