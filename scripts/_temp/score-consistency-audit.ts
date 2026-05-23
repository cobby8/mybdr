/**
 * 점수 정합성 시스템 분석 - 4 source 불일치 감사 script
 * --------------------------------------------------------------------
 * 박제일: 2026-05-21
 * 분류: read-only (SELECT만 / 운영 DB 영향 0)
 * 목적: status='completed' 매치 전수의 4 source 점수 불일치 실측
 *       → Sprint 1 결재 근거 + F2 cron 검증 layer 설계 데이터
 *
 * 4 source:
 *   ① match.homeScore / awayScore         (헤더 / SSOT 기준값)
 *   ② match.quarterScores (JSON 합)        (paper override)
 *   ③ matchPlayerStat.points 합 (팀별)     (선수별 박제 합산)
 *   ④ play_by_plays.points_scored 합 (팀별)(PBP made events)
 *
 * 불일치 분류:
 *   A. all-match           (4 source 모두 정합)
 *   B. pbp-only            (① = ② = ③ ≠ ④, PBP만 다름 = Flutter 시계 결손 류)
 *   C. mps-only            (① = ② = ④ ≠ ③, matchPlayerStat 사일런트 버그)
 *   D. qs-only             (① = ③ = ④ ≠ ②, quarterScores 미동기화 / paper 모드)
 *   E. multi-mismatch      (2개 이상 동시 불일치)
 *   X. header-zero-but-stats (① = 0/0 인데 ②~④ 어딘가 박제 = stale 헤더)
 *
 * 실행:
 *   npx tsx scripts/_temp/score-consistency-audit.ts > Dev/score-consistency-audit-2026-05-21.md
 *
 * 사후 정리: 본 사고 끝나면 즉시 삭제 (운영 DB 자격 노출 방지)
 */

import { prisma } from "../../src/lib/db/prisma";

type QS = {
  home: { q1: number; q2: number; q3: number; q4: number; ot: number[] };
  away: { q1: number; q2: number; q3: number; q4: number; ot: number[] };
};

type Bucket = "A" | "B" | "C" | "D" | "E" | "X";

type Row = {
  matchId: bigint;
  tournamentId: string;
  tournamentName: string | null;
  matchCode: string | null;
  scheduledAt: Date | null;
  recordingMode: string;
  // 4 source 값
  headerHome: number;
  headerAway: number;
  qsHome: number;
  qsAway: number;
  mpsHome: number;
  mpsAway: number;
  pbpHome: number;
  pbpAway: number;
  // PBP 갯수 (0건이면 무의미)
  pbpCount: number;
  mpsCount: number;
  // 분류
  bucket: Bucket;
  notes: string;
};

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

function classify(r: Omit<Row, "bucket" | "notes">): { bucket: Bucket; notes: string } {
  const eqH_QS = r.headerHome === r.qsHome;
  const eqA_QS = r.headerAway === r.qsAway;
  const eqH_MPS = r.headerHome === r.mpsHome;
  const eqA_MPS = r.headerAway === r.mpsAway;
  const eqH_PBP = r.headerHome === r.pbpHome;
  const eqA_PBP = r.headerAway === r.pbpAway;

  const qsOk = eqH_QS && eqA_QS;
  const mpsOk = eqH_MPS && eqA_MPS;
  const pbpOk = eqH_PBP && eqA_PBP;
  // PBP 0건 = is_made 박제 0 = 비교 불가 (skip 처리)
  const pbpIgnored = r.pbpCount === 0;
  const mpsIgnored = r.mpsCount === 0;

  // 헤더가 0/0인데 어딘가 박제값 있음
  if (r.headerHome === 0 && r.headerAway === 0) {
    if (r.mpsHome > 0 || r.mpsAway > 0 || r.qsHome > 0 || r.qsAway > 0 || r.pbpHome > 0 || r.pbpAway > 0) {
      return { bucket: "X", notes: "헤더 0/0 + 다른 source 박제 = stale 헤더" };
    }
  }

  const mismatches: string[] = [];
  if (!qsOk) mismatches.push("QS");
  if (!mpsOk && !mpsIgnored) mismatches.push("MPS");
  if (!pbpOk && !pbpIgnored) mismatches.push("PBP");

  if (mismatches.length === 0) {
    return { bucket: "A", notes: pbpIgnored ? "PBP 0건 skip" : mpsIgnored ? "MPS 0건 skip" : "" };
  }
  if (mismatches.length >= 2) {
    return { bucket: "E", notes: mismatches.join("+") + " 동시 불일치" };
  }
  // single source mismatch
  if (mismatches[0] === "PBP") {
    return {
      bucket: "B",
      notes: `PBP ${r.pbpHome}/${r.pbpAway} (헤더 ${r.headerHome}/${r.headerAway})`,
    };
  }
  if (mismatches[0] === "MPS") {
    return {
      bucket: "C",
      notes: `MPS ${r.mpsHome}/${r.mpsAway} (헤더 ${r.headerHome}/${r.headerAway})`,
    };
  }
  return {
    bucket: "D",
    notes: `QS ${r.qsHome}/${r.qsAway} (헤더 ${r.headerHome}/${r.headerAway})`,
  };
}

async function main() {
  console.log("# 점수 정합성 시스템 분석 — 4 source 불일치 실측");
  console.log("");
  console.log(`- 실행 시각: ${new Date().toISOString()}`);
  console.log(`- DB: 운영 (Supabase / .env DATABASE_URL)`);
  console.log(`- 대상: status='completed' 매치 전수`);
  console.log(`- 모드: SELECT only (운영 DB 영향 0)`);
  console.log("");

  // 1. completed 매치 전수 + 토너먼트 이름
  const matches = await prisma.tournamentMatch.findMany({
    where: { status: "completed" },
    select: {
      id: true,
      tournamentId: true,
      match_code: true,
      scheduledAt: true,
      homeScore: true,
      awayScore: true,
      quarterScores: true,
      settings: true,
      tournament: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  console.log(`- 총 completed 매치: ${matches.length}건`);
  console.log("");

  if (matches.length === 0) {
    console.log("> completed 매치 0건. 종료.");
    return;
  }

  // 2. 각 매치별 4 source 합산
  const rows: Row[] = [];
  for (const m of matches) {
    // ② quarterScores 합
    const qsSum = sumQS(m.quarterScores);
    // ③ matchPlayerStat 합 (팀별)
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
    // homeTeamId/awayTeamId 별도 SELECT
    const teams = await prisma.tournamentMatch.findUnique({
      where: { id: m.id },
      select: { homeTeamId: true, awayTeamId: true },
    });
    const homeId = teams?.homeTeamId ? Number(teams.homeTeamId) : null;
    const awayId = teams?.awayTeamId ? Number(teams.awayTeamId) : null;
    for (const r of mpsRaw) {
      const tid = Number(r.team_id);
      const pts = Number(r.pts);
      mpsCount += Number(r.cnt);
      if (tid === homeId) mpsHome = pts;
      else if (tid === awayId) mpsAway = pts;
    }
    // ④ PBP 합 (팀별, is_made=true, points_scored>0)
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

    // recording_mode (settings JSON)
    const settings = (m.settings as Record<string, unknown> | null) ?? {};
    const recordingMode = (settings["recording_mode"] as string | undefined) ?? "flutter";

    const base = {
      matchId: m.id,
      tournamentId: m.tournamentId,
      tournamentName: m.tournament?.name ?? null,
      matchCode: m.match_code,
      scheduledAt: m.scheduledAt,
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
    const { bucket, notes } = classify(base);
    rows.push({ ...base, bucket, notes });
  }

  // 3. 통계 출력
  const counts: Record<Bucket, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, X: 0 };
  for (const r of rows) counts[r.bucket]++;

  console.log("## 📊 분류별 분포");
  console.log("");
  console.log("| 분류 | 정의 | 매치수 | 비율 |");
  console.log("|------|------|--------|------|");
  const total = rows.length;
  const labels: Record<Bucket, string> = {
    A: "✅ 4 source 정합",
    B: "⚠️ PBP만 불일치 (시계 결손 류)",
    C: "🔴 matchPlayerStat 불일치 (사일런트 버그)",
    D: "🔴 quarterScores 불일치 (paper/sync 결손)",
    E: "🚨 다중 불일치 (2개+ 동시)",
    X: "🚨 헤더 0/0 + 박제값 있음 (stale)",
  };
  for (const b of ["A", "B", "C", "D", "E", "X"] as Bucket[]) {
    const pct = total > 0 ? ((counts[b] / total) * 100).toFixed(1) : "0.0";
    console.log(`| ${b} | ${labels[b]} | ${counts[b]} | ${pct}% |`);
  }
  console.log("");

  // 4. recording_mode 별 분포
  const modeCount: Record<string, number> = {};
  for (const r of rows) modeCount[r.recordingMode] = (modeCount[r.recordingMode] ?? 0) + 1;
  console.log("## 📋 recording_mode 분포");
  console.log("");
  console.log("| 모드 | 매치수 |");
  console.log("|------|--------|");
  for (const [k, v] of Object.entries(modeCount).sort((a, b) => b[1] - a[1])) {
    console.log(`| ${k} | ${v} |`);
  }
  console.log("");

  // 5. 불일치 매치 상세 (A 제외)
  const issues = rows.filter((r) => r.bucket !== "A");
  console.log(`## 🚨 불일치 매치 상세 (${issues.length}건)`);
  console.log("");
  if (issues.length === 0) {
    console.log("> 4 source 모두 정합. 영구 fix layer 필요성 ↓");
  } else {
    console.log("| ID | 분류 | 토너먼트 | 매치코드 | 헤더 | QS | MPS | PBP | mode | 비고 |");
    console.log("|----|------|---------|---------|------|----|----|-----|------|------|");
    for (const r of issues.slice(0, 80)) {
      const t = (r.tournamentName ?? "").slice(0, 20);
      console.log(
        `| ${r.matchId} | ${r.bucket} | ${t} | ${r.matchCode ?? "-"} | ${r.headerHome}/${r.headerAway} | ${r.qsHome}/${r.qsAway} | ${r.mpsHome}/${r.mpsAway} | ${r.pbpHome}/${r.pbpAway} | ${r.recordingMode} | ${r.notes} |`
      );
    }
    if (issues.length > 80) {
      console.log("");
      console.log(`> ... ${issues.length - 80}건 생략 (상위 80건만 표시)`);
    }
  }
  console.log("");

  // 6. 토너먼트별 불일치 집계
  const byTournament: Record<string, { name: string; total: number; issues: number }> = {};
  for (const r of rows) {
    const key = r.tournamentId;
    if (!byTournament[key]) byTournament[key] = { name: r.tournamentName ?? "(no-title)", total: 0, issues: 0 };
    byTournament[key].total++;
    if (r.bucket !== "A") byTournament[key].issues++;
  }
  const tList = Object.entries(byTournament)
    .map(([id, v]) => ({ id, ...v, rate: v.total > 0 ? (v.issues / v.total) * 100 : 0 }))
    .filter((t) => t.issues > 0)
    .sort((a, b) => b.issues - a.issues);

  console.log(`## 🏆 토너먼트별 불일치 집계 (${tList.length}개 토너먼트)`);
  console.log("");
  if (tList.length > 0) {
    console.log("| 토너먼트 | 매치수 | 불일치 | 비율 |");
    console.log("|---------|--------|--------|------|");
    for (const t of tList.slice(0, 30)) {
      console.log(`| ${t.name.slice(0, 30)} | ${t.total} | ${t.issues} | ${t.rate.toFixed(1)}% |`);
    }
  }
  console.log("");

  // 7. 영구 fix 권장 결론
  console.log("## 🎯 영구 fix 우선순위 권장");
  console.log("");
  const pctMismatch = total > 0 ? ((total - counts.A) / total) * 100 : 0;
  console.log(`- 전체 불일치 비율: ${pctMismatch.toFixed(1)}%`);
  if (counts.D > 0) {
    console.log(`- **F1 (quarterScores 자동 갱신 layer)** 우선순위 ★★★★★ — D 분류 ${counts.D}건 (paper override 자동화)`);
  }
  if (counts.C > 0) {
    console.log(`- **F3 (matchPlayerStat trigger)** 우선순위 ★★★★ — C 분류 ${counts.C}건 (사일런트 박제 누락)`);
  }
  if (counts.B > 0) {
    console.log(`- **F2 (PBP 검증 cron)** 우선순위 ★★★ — B 분류 ${counts.B}건 (PBP 무효 이벤트 / 시계 결손)`);
  }
  if (counts.E > 0) {
    console.log(`- **F4 (SSOT migration script)** 우선순위 ★★★★★ — E 분류 ${counts.E}건 (운영 정정 필요)`);
  }
  if (counts.X > 0) {
    console.log(`- **F6 (stale 헤더 백필)** 우선순위 ★★★ — X 분류 ${counts.X}건 (헤더 0/0)`);
  }
  console.log(`- **F5 (FIBA 룰 가드)** 우선순위 ★★★★ — OT1 동점 시 자동 종료 차단 (매치 124 사고 재발 방지 / completed 매치 룰 검증)`);
}

main()
  .catch((e) => {
    console.error("FATAL:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
