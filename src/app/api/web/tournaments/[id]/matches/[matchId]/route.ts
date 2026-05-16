import { type NextRequest } from "next/server";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { VALID_TRANSITIONS } from "@/lib/tournaments/match-transitions";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getMatch, updateMatch, deleteMatch } from "@/lib/services/match";
import { prisma } from "@/lib/db/prisma";
import { createNotificationBulk } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
// 2026-05-10: pending → scheduled 자동 전환 헬퍼
// (homeTeam + awayTeam + scheduledAt 모두 채워지면 자동 scheduled — stale pending 재발 방지)
import { shouldAutoSchedule } from "@/lib/tournaments/auto-status";
// 2026-05-16 영구 fix (PR-G5.5-followup-B): post-process 5종 통합 헬퍼.
//   기존 분산 호출 (updateTeamStandings / progressDualMatch / advanceAllDivisions /
//   advanceTournamentPlaceholders) → 본 헬퍼 1회 호출로 통합 (단일 source 박제).
//   alreadyCompleted 가드 = 본 route 책임 (헬퍼 호출 조건 if 안에서 보존).
import { finalizeMatchCompletion } from "@/lib/tournaments/finalize-match-completion";

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

  // 2026-05-10: pending → scheduled 자동 전환 가드
  // 이유: dual-tournament-generator 가 8강/4강/결승 매치를 status="pending" 으로 박제.
  //       운영자가 homeTeamId/awayTeamId/scheduledAt 채워도 status 가 pending 으로 남아
  //       2026-05-10 운영 DB 에서 stale pending 3건 발견 (matchId 150/151/152, 정정 완료).
  // 룰: update 후 (homeTeam + awayTeam + scheduledAt 모두 NULL 아님 + 현재 pending) → 자동 scheduled
  // 사용자 명시 status 가 있으면 그대로 존중 (override X — 사용자 의도 우선).
  const willHomeTeam: bigint | null =
    homeTeamId !== undefined
      ? (homeTeamId ? BigInt(String(homeTeamId)) : null)
      : match.homeTeamId;
  const willAwayTeam: bigint | null =
    awayTeamId !== undefined
      ? (awayTeamId ? BigInt(String(awayTeamId)) : null)
      : match.awayTeamId;
  const willScheduledAt: Date | null =
    scheduledAt !== undefined
      ? (scheduledAt ? new Date(String(scheduledAt)) : null)
      : match.scheduledAt;

  // 사용자 명시 status 없을 때만 자동 전환 시도 (사용자 의도 보존)
  const autoSchedule =
    status === undefined &&
    shouldAutoSchedule({
      currentStatus: match.status,
      homeTeamId: willHomeTeam,
      awayTeamId: willAwayTeam,
      scheduledAt: willScheduledAt,
    });

  // 자동 전환 시 effectiveStatus = "scheduled" (updateMatch input.status 로 전달 → audit 자동 기록)
  const effectiveStatus = autoSchedule ? "scheduled" : status;

  // Service 호출: 매치 업데이트 + 다음 경기 팀 배치 (트랜잭션) + audit
  const { updated, alreadyCompleted } = await updateMatch(
    matchBigInt,
    { status: match.status },
    {
      ...(homeScore !== undefined && { homeScore: Number(homeScore) }),
      ...(awayScore !== undefined && { awayScore: Number(awayScore) }),
      // status: 사용자 명시값 우선, 없으면 autoSchedule 결과 (있을 때만)
      ...(effectiveStatus !== undefined && { status: String(effectiveStatus) }),
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
      // autoSchedule 일 때 context 에 명시 (audit 추적성 — admin trigger 와 구분)
      context: autoSchedule
        ? `PATCH /api/web/tournaments/${id}/matches/${matchId} (auto-schedule pending→scheduled)`
        : `PATCH /api/web/tournaments/${id}/matches/${matchId}`,
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
  //
  // 2026-05-16 영구 fix (PR-G5.5-followup-B): post-process 5종 호출을 finalizeMatchCompletion 통합.
  //   기존 분산 호출 (updateTeamStandings / progressDualMatch / advanceAllDivisions /
  //   advanceTournamentPlaceholders) = 헬퍼 1회로 통합 (단일 source 박제).
  //   alreadyCompleted 가드 보존 — 본 if 안에서만 헬퍼 호출 (중복 increment 차단).
  let standingsWarning: string | undefined;
  if (status === "completed" && !alreadyCompleted) {
    try {
      const finalizeResult = await finalizeMatchCompletion(
        matchBigInt,
        id,
        "admin-patch",
        // winner_team_id 캐스팅 — 본 route 는 string | null 로 받음
        {
          winnerTeamId:
            winner_team_id != null ? BigInt(String(winner_team_id)) : null,
        },
      );
      if (finalizeResult.warnings.length > 0) {
        // 첫 warning 만 사용자 응답에 박제 (기존 standingsWarning 단일 메시지 패턴 보존)
        standingsWarning = finalizeResult.warnings[0];
      }
    } catch (err) {
      // 헬퍼 자체 throw 는 사실상 발생 X (내부 try/catch + allSettled)
      console.error(
        `[finalize-match] matchId=${matchBigInt} 후처리 실패:`,
        err,
      );
      standingsWarning =
        "경기 상태는 변경되었으나 팀 전적 갱신에 실패했습니다. 관리자에게 문의하세요.";
    }

    // ✨ Phase 2A: full_league_knockout 대회의 리그 전부 완료 시 토너먼트 경기 자동 생성
    // 본 분기는 finalizeMatchCompletion 과 별개 — knockout 트리 자동 INSERT (별도 비즈니스 로직).
    // 실패해도 경기 완료 응답 자체는 성공으로 처리 (사용자 요청 흐름 보존).
    try {
      const tournament = await prisma.tournament.findUnique({
        where: { id },
        select: { format: true, settings: true },
      });

      if (tournament?.format === "full_league_knockout") {
        // 동적 import: 자동 생성 로직은 엣지 케이스이므로 번들 크기 최적화
        const {
          isLeagueComplete,
          assignTeamsToKnockout,
          generateKnockoutMatches,
          calculateLeagueRanking,
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
            // 2026-05-16 PR-G5.5-NBA-seed: settings.bracket.seedingMode === "nba" 이면 NBA 표준 generator 호출
            //   default sequential 보존 (운영 회귀 0 / 강남구 / 4차 뉴비리그 영향 0)
            const settings = tournament.settings as Record<string, unknown> | null;
            const bracket = settings?.bracket as Record<string, unknown> | undefined;
            const knockoutSize = (bracket?.knockoutSize as number | undefined) ?? 4;
            const bronzeMatch = (bracket?.bronzeMatch as boolean | undefined) ?? false;
            const seedingMode = (bracket?.seedingMode as "nba" | "sequential" | undefined) ?? "sequential";

            if (seedingMode === "nba") {
              const { generateNbaSeedKnockout } = await import("@/lib/tournaments/nba-seed-knockout");
              const ranking = await calculateLeagueRanking(id);
              const seedingTeams = ranking.map((r) => ({
                tournamentTeamId: r.tournamentTeamId,
                seedNumber: r.rank,
              }));
              await generateNbaSeedKnockout(id, seedingTeams, knockoutSize, bronzeMatch);
            } else {
              await generateKnockoutMatches(id, knockoutSize, bronzeMatch);
            }
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
