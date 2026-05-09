// 2026-05-10 PR4 — 사전 라인업 시작 1h 전 푸시 알림 cron (5분 폴링).
//
// 이유(왜):
//   - 매치 시작 1시간 전에 라인업 미입력 매치의 양 팀 captain/manager 에게 알림 발송.
//   - 5분 폴링 윈도우 → -65~-55분 사이 매치 정확 1회 포착.
//   - lineup_reminder_sent_at 박제로 중복 발송 0 (같은 매치 같은 윈도우 재실행 무해).
//
// 방법(어떻게):
//   1) Vercel Cron Bearer 가드 (CRON_SECRET 환경변수)
//   2) -65~-55분 윈도우 + status ∈ [scheduled, ready] + lineup_reminder_sent_at IS NULL + 양 팀 매칭됨
//   3) 라인업 이미 입력된 매치 (양 팀 모두 입력) → 발송 skip + sent_at set (같은 윈도우 재실행 시 skip)
//   4) 양 팀 captain + manager 수집 (중복 제거) → createNotificationBulk
//   5) sent_at = now() 박제 → 다음 실행 시 자동 skip
//
// 가드:
//   - 미발송 매치 0건 → 200 + count:0 (정상)
//   - 같은 매치 5분 윈도우 안 2회 cron 실행 → 첫 실행만 발송 (sent_at 박제)
//   - 매치 status 가 in_progress / completed → 발송 0 (윈도우 통과해도 status filter 차단)
//
// 회귀:
//   - DB schema 변경 = NULL 허용 ADD COLUMN 1건 (무중단)
//   - createNotificationBulk 재사용 (변경 0)
//   - Flutter v1 영향 0 / 다른 cron 영향 0
//
// vercel.json: { "crons": [{ "path": "/api/cron/lineup-reminder", "schedule": "*/5 * * * *" }] }

import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createNotificationBulk } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  // 1) Vercel Cron 만 호출 가능 — Bearer 가드 (다른 cron 라우트와 동일 패턴)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError("Unauthorized", 401);
  }

  // 2) 시작 1시간 전 ±5분 윈도우 (5분 폴링이라 정확히 1h 전 포착 가능)
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const fiveMinBuffer = 5 * 60 * 1000;
  const windowStart = new Date(oneHourLater.getTime() - fiveMinBuffer); // 시작 -65분
  const windowEnd = new Date(oneHourLater.getTime() + fiveMinBuffer); // 시작 -55분

  // 3) 윈도우 내 미발송 매치 SELECT — 양 팀 매칭됨 + status 가드 + sent_at IS NULL
  const matches = await prisma.tournamentMatch.findMany({
    where: {
      scheduledAt: { gte: windowStart, lte: windowEnd },
      // status 가드 — null = scheduled 취급 (PR2/PR3 와 동일)
      status: { in: ["scheduled", "ready"] },
      lineup_reminder_sent_at: null,
      homeTeamId: { not: null },
      awayTeamId: { not: null },
    },
    select: {
      id: true,
      tournamentId: true,
      scheduledAt: true,
      homeTeam: {
        select: {
          team: {
            select: { name: true, captainId: true, manager_id: true },
          },
        },
      },
      awayTeam: {
        select: {
          team: {
            select: { name: true, captainId: true, manager_id: true },
          },
        },
      },
      tournament: { select: { name: true } },
    },
  });

  if (matches.length === 0) {
    return apiSuccess({
      success: true,
      count: 0,
      sent_at: now.toISOString(),
    });
  }

  // 4) 각 매치별 라인업 이미 입력 여부 batch 조회 (N+1 회피)
  // 양 팀 모두 입력 완료 매치 → 알림 skip + sent_at 박제 (재실행 시 skip)
  const matchIds = matches.map((m) => m.id);
  const lineups = await prisma.matchLineupConfirmed.findMany({
    where: { matchId: { in: matchIds } },
    select: { matchId: true, teamSide: true },
  });
  // matchId → Set<teamSide> 매핑 (양 팀 입력 여부 빠른 판단)
  const lineupSidesByMatch = new Map<bigint, Set<string>>();
  for (const l of lineups) {
    const sides = lineupSidesByMatch.get(l.matchId) ?? new Set<string>();
    sides.add(l.teamSide);
    lineupSidesByMatch.set(l.matchId, sides);
  }

  // 5) 매치별 알림 input 구성 + sent_at 박제 대상 ID 수집
  const inputs: Parameters<typeof createNotificationBulk>[0] = [];
  const sentMatchIds: bigint[] = [];

  for (const match of matches) {
    // 양 팀 모두 입력 완료 → 발송 skip + sent_at 박제 (다음 실행 시 skip)
    const sides = lineupSidesByMatch.get(match.id);
    const bothLineupsConfirmed =
      sides && sides.has("home") && sides.has("away");
    if (bothLineupsConfirmed) {
      sentMatchIds.push(match.id);
      continue;
    }

    // 양 팀 captain + manager 수집 (중복 제거)
    const recipientIds = new Set<bigint>();
    if (match.homeTeam?.team?.captainId) {
      recipientIds.add(match.homeTeam.team.captainId);
    }
    if (match.homeTeam?.team?.manager_id) {
      recipientIds.add(match.homeTeam.team.manager_id);
    }
    if (match.awayTeam?.team?.captainId) {
      recipientIds.add(match.awayTeam.team.captainId);
    }
    if (match.awayTeam?.team?.manager_id) {
      recipientIds.add(match.awayTeam.team.manager_id);
    }

    // 수신자 0명 (방어적 — 양 팀 매칭됐지만 captain 0 케이스 거의 없음)
    if (recipientIds.size === 0) {
      sentMatchIds.push(match.id);
      continue;
    }

    const homeName = match.homeTeam?.team?.name ?? "홈팀";
    const awayName = match.awayTeam?.team?.name ?? "원정팀";
    const tournamentName = match.tournament?.name ?? "대회";
    // 라인업 입력 페이지 URL (PR3 페이지)
    const actionUrl = `/lineup-confirm/${match.id.toString()}`;

    for (const userId of recipientIds) {
      inputs.push({
        userId,
        notificationType: NOTIFICATION_TYPES.LINEUP_REMINDER,
        title: "사전 라인업 입력 안내",
        content: `${tournamentName} ${homeName} vs ${awayName} 매치 1시간 전입니다. 라인업 확정 부탁드립니다.`,
        actionUrl,
      });
    }

    sentMatchIds.push(match.id);
  }

  // 6) 알림 발송 — DB INSERT + 푸시 (createNotificationBulk 내부 처리)
  if (inputs.length > 0) {
    await createNotificationBulk(inputs);
  }

  // 7) sent_at 박제 — 같은 매치 다음 cron 실행 시 자동 skip
  // updateMany 1회 (배치 처리 / 매치당 UPDATE 분리 X)
  if (sentMatchIds.length > 0) {
    await prisma.tournamentMatch.updateMany({
      where: { id: { in: sentMatchIds } },
      data: { lineup_reminder_sent_at: now },
    });
  }

  return apiSuccess({
    success: true,
    count: inputs.length,
    matches_processed: matches.length,
    matches_marked: sentMatchIds.length,
    sent_at: now.toISOString(),
  });
}
