import { type NextRequest } from "next/server";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { updateTeamStandings } from "@/lib/tournaments/update-standings";
import { VALID_TRANSITIONS } from "@/lib/tournaments/match-transitions";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getMatch, updateMatch, deleteMatch } from "@/lib/services/match";
import { prisma } from "@/lib/db/prisma";
import { createNotificationBulk } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
// Phase C: 듀얼토너먼트 매치 종료 시 winner/loser 자동 진출 처리
// (single elim 의 winner 진출은 services/match.ts 의 updateMatch 가 이미 처리하므로
//  본 함수는 dual_tournament 분기에서만 호출하여 loser 진출만 신규 효과를 만든다.
//  winner 진출 update 는 idempotent — 같은 슬롯/같은 winnerTeamId 두 번 UPDATE 안전)
import { progressDualMatch } from "@/lib/tournaments/dual-progression";

type Ctx = { params: Promise<{ id: string; matchId: string }> };

// PATCH /api/web/tournaments/[id]/matches/[matchId]
// 점수 입력, 상태 변경, 승자 설정
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, matchId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  // TC-026: BigInt 변환 실패 방지
  const matchBigInt = parseBigIntParam(matchId);
  if (matchBigInt === null) {
    return apiError("경기를 찾을 수 없습니다.", 404);
  }

  const match = await getMatch(matchBigInt, id);
  if (!match) return apiError("경기를 찾을 수 없습니다.", 404);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  const {
    homeScore, awayScore, status, winner_team_id,
    scheduledAt, venue_name, roundName, notes,
    homeTeamId, awayTeamId,
  } = body as Record<string, string | number | null | undefined>;

  // TC-NEW-012: 상태 전환 유효성 검증
  if (status !== undefined && status !== match.status) {
    const currentStatus = match.status ?? "pending";
    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(String(status))) {
      return apiError(`'${currentStatus}' 상태에서 '${status}'로 변경할 수 없습니다.`, 400);
    }
  }

  // TC-031: 완료 처리 시 승자 팀 필수
  if (status === "completed" && !winner_team_id) {
    return apiError("완료 처리 시 승자 팀을 지정해야 합니다.", 400);
  }

  // TC-NEW-011: 점수 음수 방지
  if (homeScore !== undefined && homeScore !== null) {
    const n = Number(homeScore);
    if (n < 0 || !Number.isFinite(n)) {
      return apiError("점수는 0 이상이어야 합니다.", 400);
    }
  }
  if (awayScore !== undefined && awayScore !== null) {
    const n = Number(awayScore);
    if (n < 0 || !Number.isFinite(n)) {
      return apiError("점수는 0 이상이어야 합니다.", 400);
    }
  }

  // TC-NEW-013: winner_team_id는 해당 매치에 속한 팀이어야 함 (IDOR 방지)
  if (winner_team_id) {
    const wid = parseBigIntParam(String(winner_team_id));
    if (wid === null) {
      return apiError("유효하지 않은 승자 팀 ID입니다.", 400);
    }
    if (wid !== match.homeTeamId && wid !== match.awayTeamId) {
      return apiError("승자는 경기에 참여한 팀이어야 합니다.", 400);
    }
  }

  // 2026-05-02 회귀 방지 가드 (errors.md "양쪽 같은 팀 (피벗·아울스)" 케이스):
  // 진출 destination 매치 (다른 매치의 next_match_id 또는 settings.loserNextMatchId 가
  // 이 매치를 가리키는 경우) 는 home/away 직접 set 금지.
  // 이유: admin frontend page.tsx 가 변경 안 된 필드도 항상 PATCH body 에 포함하므로,
  // 운영자가 venue/scheduledAt 만 수정해도 home/away 가 같이 send 되어
  // progressDualMatch 가 채운 슬롯이 stale data 로 덮어써질 위험.
  if (homeTeamId !== undefined || awayTeamId !== undefined) {
    const newHome = homeTeamId !== undefined
      ? (homeTeamId ? BigInt(String(homeTeamId)) : null)
      : match.homeTeamId;
    const newAway = awayTeamId !== undefined
      ? (awayTeamId ? BigInt(String(awayTeamId)) : null)
      : match.awayTeamId;

    // 변경되는 경우만 검증
    const homeChanged = homeTeamId !== undefined && newHome !== match.homeTeamId;
    const awayChanged = awayTeamId !== undefined && newAway !== match.awayTeamId;

    if (homeChanged || awayChanged) {
      // 이 매치를 next_match_id 로 가리키는 source 매치 존재 여부
      const isWinnerDest = await prisma.tournamentMatch.count({
        where: { tournamentId: id, next_match_id: matchBigInt },
      });
      // settings.loserNextMatchId 가 이 매치를 가리키는 source 매치 존재 여부 (JSON path)
      const matchIdStr = String(matchBigInt);
      const isLoserDest = await prisma.tournamentMatch.count({
        where: {
          tournamentId: id,
          OR: [
            { settings: { path: ["loserNextMatchId"], equals: matchIdStr } },
            { settings: { path: ["loserNextMatchId"], equals: Number(matchBigInt) } },
          ],
        },
      });

      if (isWinnerDest > 0 || isLoserDest > 0) {
        return apiError(
          "이 경기는 다른 경기 결과로 자동 채워지는 슬롯입니다. " +
            "홈팀/원정팀을 직접 수정할 수 없습니다 (자동 진출 처리에 의해 갱신됩니다).",
          400,
        );
      }
    }
  }

  // Service 호출: 매치 업데이트 + 다음 경기 팀 배치 (트랜잭션) + audit
  const { updated, alreadyCompleted } = await updateMatch(
    matchBigInt,
    { status: match.status },
    {
      ...(homeScore !== undefined && { homeScore: Number(homeScore) }),
      ...(awayScore !== undefined && { awayScore: Number(awayScore) }),
      ...(status !== undefined && { status: String(status) }),
      ...(winner_team_id !== undefined && {
        winnerTeamId: winner_team_id ? BigInt(String(winner_team_id)) : null,
      }),
      ...(scheduledAt !== undefined && {
        scheduledAt: scheduledAt ? new Date(String(scheduledAt)) : null,
      }),
      ...(venue_name !== undefined && { venueName: venue_name ? String(venue_name) : null }),
      ...(roundName !== undefined && { roundName: roundName ? String(roundName) : null }),
      ...(notes !== undefined && { notes: notes ? String(notes) : null }),
      ...(homeTeamId !== undefined && {
        homeTeamId: homeTeamId ? BigInt(String(homeTeamId)) : null,
      }),
      ...(awayTeamId !== undefined && {
        awayTeamId: awayTeamId ? BigInt(String(awayTeamId)) : null,
      }),
    },
    {
      source: "admin",
      context: `PATCH /api/web/tournaments/${id}/matches/${matchId}`,
      changedBy: "userId" in auth ? auth.userId : null,
    },
  );

  // 경기 취소 시 참가자(양 팀 선수)에게 알림 발송 (fire-and-forget)
  if (status === "cancelled") {
    const teamIds = [match.homeTeamId, match.awayTeamId].filter(
      (tid): tid is bigint => tid !== null && tid !== undefined
    );

    if (teamIds.length > 0) {
      // 양 팀의 모든 활성 선수(userId) 조회 후 알림 일괄 발송
      prisma.tournamentTeamPlayer
        .findMany({
          where: { tournamentTeamId: { in: teamIds }, is_active: true },
          select: { userId: true },
        })
        .then((players) => {
          // null userId 필터링 (BigInt?로 변경되어 null 가능)
          const uniqueUserIds = [...new Set(players.map((p) => p.userId).filter((id): id is bigint => id !== null))];
          if (uniqueUserIds.length === 0) return;

          return createNotificationBulk(
            uniqueUserIds.map((uid) => ({
              userId: uid,
              notificationType: NOTIFICATION_TYPES.GAME_CANCELLED,
              title: "경기가 취소되었습니다",
              content: `배정된 경기가 취소되었습니다. 자세한 내용은 대회 페이지를 확인해주세요.`,
              actionUrl: `/tournaments/${id}`,
              notifiableType: "TournamentMatch",
              notifiableId: matchBigInt,
            }))
          );
        })
        .catch(() => {}); // 알림 실패가 취소 처리를 실패시키면 안 됨
    }
  }

  // TC-006: 이미 completed였던 매치는 전적 재갱신 금지 (중복 increment 방지)
  // M-04: fire-and-forget 제거 -> await + 실패 시 warning 응답
  let standingsWarning: string | undefined;
  if (status === "completed" && !alreadyCompleted) {
    try {
      await updateTeamStandings(matchBigInt);
    } catch (err) {
      console.error(`[updateTeamStandings] matchId=${matchBigInt} 전적 갱신 실패:`, err);
      standingsWarning = "경기 상태는 변경되었으나 팀 전적 갱신에 실패했습니다. 관리자에게 문의하세요.";
    }

    // ✨ Phase 2A: full_league_knockout 대회의 리그 전부 완료 시 토너먼트 경기 자동 생성
    // ✨ Phase C (2026-05-02): dual_tournament 매치 완료 시 winner/loser 자동 진출
    // 실패해도 경기 완료 응답 자체는 성공으로 처리 (사용자 요청 흐름 보존)
    try {
      const tournament = await prisma.tournament.findUnique({
        where: { id },
        select: { format: true, settings: true },
      });

      // Phase C: dual_tournament 분기 — winner/loser 다음 매치 슬롯 자동 채움
      // - winner 진출: services/match.ts:updateMatch 가 이미 처리 (next_match_id + slot UPDATE)
      //   → 본 호출은 idempotent (같은 슬롯에 같은 winnerTeamId 두 번 UPDATE 안전)
      // - loser 진출: settings.loserNextMatchId 매핑된 패자전 슬롯 채움 (신규 효과)
      // - winner_team_id null / next_match_id null → progressDualMatch 내부에서 자체 가드
      // 별도 트랜잭션으로 호출 (match.ts 트랜잭션은 이미 commit 됨, loser update 1건만 atomic 보장)
      if (
        tournament?.format === "dual_tournament" &&
        winner_team_id != null
      ) {
        try {
          await prisma.$transaction(async (tx) => {
            await progressDualMatch(
              tx,
              matchBigInt,
              BigInt(String(winner_team_id)),
            );
          });
        } catch (e) {
          // 진출 실패 = 매치 자체는 이미 update 됨 (trx 분리)
          // → 사용자 응답은 성공 유지, 로그만 남김 (admin 이 수동 정정 가능)
          console.error(
            `[dual-progression] matchId=${matchBigInt} 자동 진출 실패:`,
            e,
          );
        }
      }

      if (tournament?.format === "full_league_knockout") {
        // 동적 import: 자동 생성 로직은 엣지 케이스이므로 번들 크기 최적화
        const {
          isLeagueComplete,
          assignTeamsToKnockout,
          generateKnockoutMatches,
        } = await import("@/lib/tournaments/tournament-seeding");

        const leagueDone = await isLeagueComplete(id);
        if (leagueDone) {
          // Phase 2C: 이미 빈 뼈대가 있는지 확인
          //  - 있음 → assignTeamsToKnockout (팀 ID만 UPDATE, 빠름)
          //  - 없음 → 구버전 대회이므로 기존 generateKnockoutMatches fallback
          const existingKnockout = await prisma.tournamentMatch.count({
            where: { tournamentId: id, round_number: { not: null } },
          });

          if (existingKnockout > 0) {
            // 빈 뼈대가 존재 → 1라운드 빈 슬롯에 팀 할당
            await assignTeamsToKnockout(id);
          } else {
            // 뼈대가 없는 구버전 대회 fallback — 기존 방식으로 전체 생성
            const settings = tournament.settings as Record<string, unknown> | null;
            const bracket = settings?.bracket as Record<string, unknown> | undefined;
            const knockoutSize = (bracket?.knockoutSize as number | undefined) ?? 4;
            const bronzeMatch = (bracket?.bronzeMatch as boolean | undefined) ?? false;

            await generateKnockoutMatches(id, knockoutSize, bronzeMatch);
          }
        }
      }
    } catch (e) {
      // 토너먼트 자동 생성 실패는 로그만 남기고 사용자 응답은 성공 유지
      // admin이 수동 트리거 API로 재시도 가능
      console.error("[auto-knockout-gen]", e);
    }
  }

  if (standingsWarning) {
    return apiSuccess({ ...JSON.parse(JSON.stringify(updated, (_k, v) => typeof v === "bigint" ? v.toString() : v)), warning: standingsWarning });
  }
  return apiSuccess(updated);
}

// DELETE /api/web/tournaments/[id]/matches/[matchId]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, matchId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const deleteBigInt = parseBigIntParam(matchId);
  if (deleteBigInt === null) {
    return apiError("경기를 찾을 수 없습니다.", 404);
  }

  try {
    const result = await deleteMatch(deleteBigInt, id);
    if (!result) return apiError("경기를 찾을 수 없습니다.", 404);
    return apiSuccess(result);
  } catch (err) {
    if (err instanceof Error && err.message === "COMPLETED_MATCH_DELETE") {
      return apiError("완료된 경기는 삭제할 수 없습니다.", 400);
    }
    throw err;
  }
}
