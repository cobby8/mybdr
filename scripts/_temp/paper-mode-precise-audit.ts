/**
 * paper 모드 정밀 조사 — 강남구 6 매치 player별 분포 + audit log 추적
 * --------------------------------------------------------------------
 * 박제일: 2026-05-21
 * 분류: read-only (SELECT만 / 운영 DB 영향 0)
 * 목적: C/D/B 분류 3가지 결함 패턴의 근본 원인 추적
 *
 * 매치 159 (C / MPS +2점):
 *   - player별 MPS.points vs PBP.points_scored 합 비교 → 어느 선수가 +2점 박제됐는지
 *   - tournament_match_audits 시간순 추적 → submit 횟수 + edit_mode 흔적
 *
 * 매치 170/187 (D / 헤더만 SET):
 *   - tournament_match_audits 추적 → 어떤 경로로 헤더가 박제됐는지
 *   - settings JSON 박제 흔적 (recording_mode / score-sheet 박제 흔적)
 *
 * 매치 208 (B / PBP INSERT 실패):
 *   - PBP 박제 quarter별 분포 → 어느 쿼터에서 INSERT 누락됐는지
 *   - PBP local_id 분포 ("paper-fix-*" prefix 확인)
 *
 * 실행: npx tsx scripts/_temp/paper-mode-precise-audit.ts > Dev/paper-mode-precise-audit-2026-05-21.md
 */

import { prisma } from "../../src/lib/db/prisma";

const TARGETS = [
  { id: 159n, label: "C 매치 159 — MPS 9/3 (헤더 7/3)" },
  { id: 164n, label: "C 매치 164 — MPS 9/23 (헤더 9/21)" },
  { id: 186n, label: "C 매치 186 — MPS 18/41 (헤더 16/41)" },
  { id: 170n, label: "D 매치 170 — 헤더 11/1 / 다른 source 0/0" },
  { id: 187n, label: "D 매치 187 — 헤더 26/13 / 다른 source 0/0" },
  { id: 208n, label: "B 매치 208 — PBP 12/12 (헤더 22/16)" },
];

async function inspectMatch(id: bigint, label: string) {
  console.log(`\n## ${label} (id=${id})\n`);
  // 매치 헤더
  const m = await prisma.tournamentMatch.findUnique({
    where: { id },
    select: {
      id: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      quarterScores: true,
      status: true,
      winner_team_id: true,
      settings: true,
      scheduledAt: true,
      started_at: true,
      ended_at: true,
      updatedAt: true,
      createdAt: true,
      homeTeam: { select: { team: { select: { name: true } } } },
      awayTeam: { select: { team: { select: { name: true } } } },
    },
  });
  if (!m) {
    console.log("> 매치 없음 (skip)");
    return;
  }

  const settings = (m.settings as Record<string, unknown> | null) ?? {};
  console.log("### 매치 헤더");
  console.log("| 컬럼 | 값 |");
  console.log("|------|-----|");
  console.log(`| home / away | ${m.homeTeam?.team?.name ?? "?"} (${m.homeTeamId}) vs ${m.awayTeam?.team?.name ?? "?"} (${m.awayTeamId}) |`);
  console.log(`| homeScore / awayScore | ${m.homeScore} / ${m.awayScore} |`);
  console.log(`| status / winner | ${m.status} / ${m.winner_team_id ?? "NULL"} |`);
  console.log(`| recording_mode | ${settings["recording_mode"] ?? "(미박제)"} |`);
  console.log(`| quarter_scores | \`${JSON.stringify(m.quarterScores)}\` |`);
  console.log(`| created / updated / ended | ${m.createdAt?.toISOString()} / ${m.updatedAt?.toISOString()} / ${m.ended_at?.toISOString() ?? "NULL"} |`);

  // player별 MPS 분포
  const mps = await prisma.$queryRaw<
    Array<{ ttp_id: bigint; team_id: bigint; player_name: string | null; jersey: string | null; points: number; fg_made: number; ft_made: number; three_made: number; updated_at: Date }>
  >`
    SELECT mps.tournament_team_player_id AS ttp_id,
           ttp.tournament_team_id AS team_id,
           u.name AS player_name,
           ttp.jersey_number AS jersey,
           mps.points AS points,
           mps.field_goals_made AS fg_made,
           mps.free_throws_made AS ft_made,
           mps.three_pointers_made AS three_made,
           mps.updated_at AS updated_at
    FROM match_player_stats mps
    JOIN tournament_team_players ttp ON ttp.id = mps.tournament_team_player_id
    LEFT JOIN users u ON u.id = ttp.user_id
    WHERE mps.tournament_match_id = ${id}
      AND mps.points > 0
    ORDER BY mps.updated_at ASC, mps.points DESC
  `;
  console.log("\n### MatchPlayerStat (points > 0 / updated_at ASC)");
  if (mps.length === 0) {
    console.log("> MPS 박제 0건");
  } else {
    console.log("| ttp_id | 팀 | 등번호 | 선수 | points | FG/FT/3P made | updated_at |");
    console.log("|--------|-----|--------|------|--------|----------------|------------|");
    for (const r of mps) {
      const side = Number(r.team_id) === Number(m.homeTeamId) ? "H" : "A";
      console.log(`| ${r.ttp_id} | ${side} | ${r.jersey ?? "-"} | ${r.player_name ?? "-"} | ${r.points} | ${r.fg_made}/${r.ft_made}/${r.three_made} | ${r.updated_at?.toISOString()} |`);
    }
    // MPS 팀별 합
    const homeSum = mps.filter((r) => Number(r.team_id) === Number(m.homeTeamId)).reduce((s, r) => s + r.points, 0);
    const awaySum = mps.filter((r) => Number(r.team_id) === Number(m.awayTeamId)).reduce((s, r) => s + r.points, 0);
    console.log(`\n> **MPS 합**: 홈 ${homeSum} / 어웨이 ${awaySum}`);
  }

  // PBP 분포
  const pbpStats = await prisma.$queryRaw<
    Array<{ team_id: bigint; quarter: number; action_type: string; action_subtype: string | null; cnt: bigint; pts_sum: bigint; local_id_sample: string }>
  >`
    SELECT tournament_team_id AS team_id,
           quarter,
           action_type,
           action_subtype,
           COUNT(*) AS cnt,
           COALESCE(SUM(points_scored), 0) AS pts_sum,
           MIN(local_id) AS local_id_sample
    FROM play_by_plays
    WHERE tournament_match_id = ${id}
    GROUP BY tournament_team_id, quarter, action_type, action_subtype
    ORDER BY quarter, tournament_team_id, action_type
  `;
  console.log("\n### PBP 분포 (action_type별)");
  if (pbpStats.length === 0) {
    console.log("> PBP 박제 0건");
  } else {
    console.log("| 팀 | Q | action | subtype | 건수 | pts 합 | local_id 샘플 |");
    console.log("|-----|---|--------|---------|------|--------|---------------|");
    for (const r of pbpStats) {
      const side = Number(r.team_id) === Number(m.homeTeamId) ? "H" : "A";
      console.log(`| ${side} | ${r.quarter} | ${r.action_type} | ${r.action_subtype ?? "-"} | ${Number(r.cnt)} | ${Number(r.pts_sum)} | ${r.local_id_sample.slice(0, 30)} |`);
    }
  }

  // audit log 시간순
  const audits = await prisma.$queryRaw<
    Array<{ id: bigint; source: string; context: string | null; changes: unknown; changed_at: Date; changed_by: bigint | null }>
  >`
    SELECT id, source, context, changes, changed_at, changed_by
    FROM tournament_match_audits
    WHERE match_id = ${id}
    ORDER BY changed_at ASC
  `;
  console.log("\n### tournament_match_audits (시간순)");
  if (audits.length === 0) {
    console.log("> audit 박제 0건 — **score-sheet BFF 미경유 가능성** (다른 경로로 헤더 박제)");
  } else {
    console.log("| id | source | context | by | changed_at | changes 키 |");
    console.log("|----|--------|---------|-----|------------|------------|");
    for (const r of audits) {
      const c = (r.changes as Record<string, unknown> | null) ?? {};
      const cKeys = Object.keys(c).slice(0, 5).join(",");
      console.log(`| ${r.id} | ${r.source} | ${r.context ?? "-"} | ${r.changed_by ?? "-"} | ${r.changed_at?.toISOString()} | ${cKeys} |`);
    }
  }

  // admin_logs (별도 audit)
  const adminLogs = await prisma.$queryRaw<
    Array<{ id: bigint; action: string; resource_type: string; resource_id: bigint | null; created_at: Date; admin_id: bigint }>
  >`
    SELECT id, action, resource_type, resource_id, created_at, admin_id
    FROM admin_logs
    WHERE resource_type = 'tournament_match'
      AND resource_id = ${id}
    ORDER BY created_at ASC
  `;
  if (adminLogs.length > 0) {
    console.log("\n### admin_logs (시간순)");
    console.log("| id | action | admin | created_at |");
    console.log("|----|--------|-------|------------|");
    for (const r of adminLogs) {
      console.log(`| ${r.id} | ${r.action} | ${r.admin_id} | ${r.created_at?.toISOString()} |`);
    }
  }
}

async function main() {
  console.log("# paper 모드 정밀 조사 — 강남구 6 매치 분포 + audit 추적");
  console.log("");
  console.log(`- 실행 시각: ${new Date().toISOString()}`);
  console.log(`- DB: 운영 (Supabase / SELECT only)`);
  console.log(`- 목적: C/D/B 분류 결함 패턴 근본 원인 추적`);

  for (const t of TARGETS) {
    await inspectMatch(t.id, t.label);
  }
}

main()
  .catch((e) => {
    console.error("FATAL:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
