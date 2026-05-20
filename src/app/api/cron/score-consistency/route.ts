/**
 * /api/cron/score-consistency — 점수 정합성 daily cron (4 source 불일치 검출 + score_consistency_audit INSERT).
 *
 * 2026-05-21 PR-4 F2 신규 (decisions.md [2026-05-21] 점수 정합성 영구 fix Sprint 1).
 *
 * 이유 (왜):
 *   - 운영 DB 56% (70/125) completed 매치가 4 source 불일치 잔존 (audit script 실측 2026-05-21).
 *   - 현재 검출 layer 0 → 운영자가 매치 종료 후 즉시 발견 불가.
 *   - daily cron 으로 자동 검출 + DB 박제 + admin 대시보드 위젯이 24h 알림 표시.
 *
 * 어떻게:
 *   - Vercel cron Bearer 가드 (CRON_SECRET) — series-counter-audit 패턴 답습.
 *   - status='completed' 매치 SELECT (paper + flutter 모두)
 *   - 매치별 4 source 합산: header / QS (JSON sum) / MPS (Σ points) / PBP (Σ points_scored where is_made)
 *   - 불일치 분류:
 *       HEADER_ZERO       : 헤더 0/0 + 다른 source 박제값 있음 (stale 헤더)
 *       MULTI_DIFF        : 2개 이상 동시 불일치
 *       MPS_HEADER_DIFF   : MPS 만 헤더와 다름
 *       PBP_HEADER_DIFF   : PBP 만 헤더와 다름
 *       QS_HEADER_DIFF    : QS 만 헤더와 다름 (헤더 != 0)
 *       QS_ZERO           : QS=0/0 인데 헤더 박제 있음
 *   - 불일치 매치만 score_consistency_audit INSERT (정합 매치 INSERT 0)
 *   - 응답 = { ok, audited, mismatches, duration_ms, by_type }
 *
 * 운영 안전:
 *   - read-only (SELECT + INSERT only / 운영 매치 변경 0)
 *   - 같은 매치 + 같은 mismatch_type 중복 INSERT 허용 (시간 추적용)
 *   - 결과는 admin 대시보드 ScoreConsistencyAlertCard 에서 운영자가 확인
 *
 * vercel.json crons: { "path": "/api/cron/score-consistency", "schedule": "0 16 * * *" } (UTC 16:00 = KST 01:00)
 *
 * 참조: scripts/_temp/score-consistency-audit.ts (SELECT only audit script — 본 cron 의 source-of-truth)
 */

import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

// quarterScores JSON 형식 (paper 모드 사용 / Flutter sync 도 박제)
type QS = {
  home: { q1: number; q2: number; q3: number; q4: number; ot: number[] };
  away: { q1: number; q2: number; q3: number; q4: number; ot: number[] };
};

// mismatch 분류 6종 (errors.md [2026-05-21] 박제 결과 기반)
type MismatchType =
  | "HEADER_ZERO"
  | "MULTI_DIFF"
  | "MPS_HEADER_DIFF"
  | "PBP_HEADER_DIFF"
  | "QS_HEADER_DIFF"
  | "QS_ZERO";

// 매치별 4 source 합산 결과
type MatchScore = {
  matchId: bigint;
  tournamentId: string;
  recordingMode: string;
  headerHome: number;
  headerAway: number;
  qsHome: number;
  qsAway: number;
  mpsHome: number;
  mpsAway: number;
  pbpHome: number;
  pbpAway: number;
  pbpCount: number;
  mpsCount: number;
};

/**
 * quarterScores JSON 합산 — home/away q1~q4 + ot[] sum.
 * audit script `sumQS` 답습 (NULL/undefined safe).
 */
function sumQS(qs: unknown): { home: number; away: number } {
  if (!qs || typeof qs !== "object") return { home: 0, away: 0 };
  const o = qs as Partial<QS>;
  const h = o.home;
  const a = o.away;
  if (!h || !a) return { home: 0, away: 0 };
  const otH = Array.isArray(h.ot) ? h.ot.reduce((s, v) => s + (v ?? 0), 0) : 0;
  const otA = Array.isArray(a.ot) ? a.ot.reduce((s, v) => s + (v ?? 0), 0) : 0;
  return {
    home: (h.q1 ?? 0) + (h.q2 ?? 0) + (h.q3 ?? 0) + (h.q4 ?? 0) + otH,
    away: (a.q1 ?? 0) + (a.q2 ?? 0) + (a.q3 ?? 0) + (a.q4 ?? 0) + otA,
  };
}

/**
 * 매치 1건의 4 source 합산 결과를 mismatch type 으로 분류.
 * audit script `classify` 답습 + DB INSERT 용 type label 표준화.
 *
 * @returns null = 정합 / MismatchType = 불일치 분류
 */
export function classifyMismatch(m: MatchScore): MismatchType | null {
  // PBP 0건 / MPS 0건 = 비교 불가 (skip 처리 — audit script 동일)
  const pbpIgnored = m.pbpCount === 0;
  const mpsIgnored = m.mpsCount === 0;

  const eqQS = m.headerHome === m.qsHome && m.headerAway === m.qsAway;
  const eqMPS = m.headerHome === m.mpsHome && m.headerAway === m.mpsAway;
  const eqPBP = m.headerHome === m.pbpHome && m.headerAway === m.pbpAway;

  // 헤더 0/0 + 다른 source 박제 = stale 헤더 (X 분류)
  if (m.headerHome === 0 && m.headerAway === 0) {
    if (
      m.mpsHome > 0 ||
      m.mpsAway > 0 ||
      m.qsHome > 0 ||
      m.qsAway > 0 ||
      m.pbpHome > 0 ||
      m.pbpAway > 0
    ) {
      return "HEADER_ZERO";
    }
    // 헤더 0/0 + 다른 source 도 0 = 모두 0/0 매치 (취소 등) → 정합
    return null;
  }

  // QS=0/0 인데 헤더 박제 있음 = QS 미동기화 (paper override 결손)
  if (m.qsHome === 0 && m.qsAway === 0 && (m.headerHome > 0 || m.headerAway > 0)) {
    // QS=0/0 단독 vs 다른 source 도 불일치 = MULTI_DIFF
    const otherMismatches: string[] = [];
    if (!eqMPS && !mpsIgnored) otherMismatches.push("MPS");
    if (!eqPBP && !pbpIgnored) otherMismatches.push("PBP");
    if (otherMismatches.length > 0) return "MULTI_DIFF";
    return "QS_ZERO";
  }

  const mismatches: string[] = [];
  if (!eqQS) mismatches.push("QS");
  if (!eqMPS && !mpsIgnored) mismatches.push("MPS");
  if (!eqPBP && !pbpIgnored) mismatches.push("PBP");

  if (mismatches.length === 0) return null; // 정합
  if (mismatches.length >= 2) return "MULTI_DIFF";

  // single source mismatch
  if (mismatches[0] === "MPS") return "MPS_HEADER_DIFF";
  if (mismatches[0] === "PBP") return "PBP_HEADER_DIFF";
  return "QS_HEADER_DIFF";
}

export async function GET(req: NextRequest) {
  // Vercel cron Bearer 가드 — 다른 cron route 패턴 동일
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError("Unauthorized", 401);
  }

  const startedAt = Date.now();

  try {
    // 1) completed 매치 전수 SELECT (paper + flutter 모두)
    const matches = await prisma.tournamentMatch.findMany({
      where: { status: "completed" },
      select: {
        id: true,
        tournamentId: true,
        homeScore: true,
        awayScore: true,
        homeTeamId: true,
        awayTeamId: true,
        quarterScores: true,
        settings: true,
      },
    });

    // 2) 매치별 4 source 합산 + 분류 + INSERT
    //    byType = 분류별 카운트 (apiSuccess snake_case 자동 변환이 enum 값을 건드리지 않도록
    //    Map → 배열 [{type, count}] 형식으로 응답 박제. type 값은 문자열이라 변환 안 됨)
    let mismatches = 0;
    const byTypeMap: Record<string, number> = {};
    const auditInserts: Array<{
      matchId: bigint;
      mismatchType: string;
      details: object;
    }> = [];

    for (const m of matches) {
      // ② quarterScores 합 (JSON / paper override source)
      const qsSum = sumQS(m.quarterScores);

      // ③ matchPlayerStat 합 (팀별 / Σ points)
      const mpsRaw = await prisma.$queryRaw<
        Array<{ team_id: bigint; pts: bigint; cnt: bigint }>
      >`
        SELECT ttp.tournament_team_id AS team_id,
               COALESCE(SUM(mps.points), 0) AS pts,
               COUNT(*) AS cnt
        FROM match_player_stats mps
        JOIN tournament_team_players ttp ON ttp.id = mps.tournament_team_player_id
        WHERE mps.tournament_match_id = ${m.id}
        GROUP BY ttp.tournament_team_id
      `;
      let mpsHome = 0;
      let mpsAway = 0;
      let mpsCount = 0;
      const homeId = m.homeTeamId ? Number(m.homeTeamId) : null;
      const awayId = m.awayTeamId ? Number(m.awayTeamId) : null;
      for (const r of mpsRaw) {
        const tid = Number(r.team_id);
        const pts = Number(r.pts);
        mpsCount += Number(r.cnt);
        if (tid === homeId) mpsHome = pts;
        else if (tid === awayId) mpsAway = pts;
      }

      // ④ PBP 합 (팀별 / is_made=true / points_scored>0)
      const pbpRaw = await prisma.$queryRaw<
        Array<{ team_id: bigint; pts: bigint; cnt: bigint }>
      >`
        SELECT tournament_team_id AS team_id,
               COALESCE(SUM(points_scored), 0) AS pts,
               COUNT(*) AS cnt
        FROM play_by_plays
        WHERE tournament_match_id = ${m.id}
          AND is_made = true
          AND points_scored > 0
        GROUP BY tournament_team_id
      `;
      let pbpHome = 0;
      let pbpAway = 0;
      let pbpCount = 0;
      for (const r of pbpRaw) {
        const tid = Number(r.team_id);
        const pts = Number(r.pts);
        pbpCount += Number(r.cnt);
        if (tid === homeId) pbpHome = pts;
        else if (tid === awayId) pbpAway = pts;
      }

      // recording_mode (settings JSON / 없으면 flutter 처리)
      const settings = (m.settings as Record<string, unknown> | null) ?? {};
      const recordingMode = (settings["recording_mode"] as string | undefined) ?? "flutter";

      const score: MatchScore = {
        matchId: m.id,
        tournamentId: m.tournamentId,
        recordingMode,
        headerHome: m.homeScore ?? 0,
        headerAway: m.awayScore ?? 0,
        qsHome: qsSum.home,
        qsAway: qsSum.away,
        mpsHome,
        mpsAway,
        pbpHome,
        pbpAway,
        pbpCount,
        mpsCount,
      };

      const mismatchType = classifyMismatch(score);
      if (mismatchType !== null) {
        mismatches += 1;
        byTypeMap[mismatchType] = (byTypeMap[mismatchType] ?? 0) + 1;
        // details JSON 박제 (위젯/상세 페이지에서 활용)
        auditInserts.push({
          matchId: m.id,
          mismatchType,
          details: {
            headerHome: score.headerHome,
            headerAway: score.headerAway,
            qsHome: score.qsHome,
            qsAway: score.qsAway,
            mpsHome: score.mpsHome,
            mpsAway: score.mpsAway,
            pbpHome: score.pbpHome,
            pbpAway: score.pbpAway,
            pbpCount: score.pbpCount,
            mpsCount: score.mpsCount,
            recordingMode: score.recordingMode,
            tournamentId: score.tournamentId,
          },
        });
      }
    }

    // 3) 불일치 매치 일괄 INSERT (createMany 활용 / details JSON 박제)
    if (auditInserts.length > 0) {
      await prisma.score_consistency_audit.createMany({
        data: auditInserts.map((a) => ({
          matchId: a.matchId,
          mismatchType: a.mismatchType,
          details: a.details,
        })),
      });
    }

    const durationMs = Date.now() - startedAt;

    // 불일치 발견 시 console.warn (Vercel runtime logs 캡처 / 향후 Sentry 연동 후보)
    if (mismatches > 0) {
      console.warn(
        `[score-consistency] 4 source 불일치 ${mismatches}건 검출 (총 ${matches.length}건 audit)`,
        byTypeMap,
      );
    }

    // 응답 byType = 배열 [{ type, count }] 형식 — apiSuccess 가 enum 값 (대문자) 을 snake_case 변환
    //  하지 못하도록 type 값을 문자열 (value) 로 박제 (key 가 아닌 value 위치 = 변환 0)
    const byType = Object.entries(byTypeMap).map(([type, count]) => ({ type, count }));

    return apiSuccess({
      ok: true,
      audited: matches.length,
      mismatches,
      duration_ms: durationMs,
      by_type: byType,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[score-consistency] failed", { err: msg });
    return apiError("audit 실행 중 오류가 발생했습니다.", 500);
  }
}
