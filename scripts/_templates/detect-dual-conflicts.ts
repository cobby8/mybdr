// 듀얼토너먼트 매치 home=away 충돌 검출
// 사용: 운영 중 의심되는 토너먼트에 대해 수동 실행, 또는 Vercel cron 통합 시 base
// (cron 인프라 미구성 — 수동 실행 우선. 회귀 안전망용)
//
// 실행: npx tsx scripts/_templates/detect-dual-conflicts.ts
// 옵션: TOURNAMENT_ID="<uuid>" 환경변수로 특정 대회만 검사

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

(async () => {
  const targetId = process.env.TOURNAMENT_ID ?? null;

  // dual_tournament 형식의 in_progress / scheduled 토너먼트
  const tournaments = await prisma.tournament.findMany({
    where: {
      ...(targetId ? { id: targetId } : {}),
      format: "dual_tournament",
      status: { in: ["in_progress", "registration_closed", "scheduled"] },
    },
    select: { id: true, name: true },
  });

  if (tournaments.length === 0) {
    console.log("⚠️  대상 토너먼트 없음 (dual_tournament + in_progress)");
    await prisma.$disconnect();
    return;
  }

  let totalConflicts = 0;

  for (const t of tournaments) {
    console.log(`\n[${t.name}] (${t.id})`);

    // home_team_id == away_team_id 인 매치 (둘 다 NOT NULL)
    const conflicts = await prisma.tournamentMatch.findMany({
      where: {
        tournamentId: t.id,
        homeTeamId: { not: null },
        awayTeamId: { not: null },
        // raw 비교는 prisma 미지원 → JS 측 필터
      },
      select: {
        id: true,
        match_number: true,
        round_number: true,
        group_name: true,
        homeTeamId: true,
        awayTeamId: true,
        status: true,
        homeTeam: { select: { team: { select: { name: true } } } },
      },
    });

    const sameTeam = conflicts.filter(m => m.homeTeamId === m.awayTeamId);
    if (sameTeam.length === 0) {
      console.log(`  ✅ 충돌 없음`);
      continue;
    }

    totalConflicts += sameTeam.length;
    console.log(`  ⚠️  충돌 ${sameTeam.length}건:`);
    for (const m of sameTeam) {
      console.log(
        `    Match #${m.match_number} (${m.group_name}조 R${m.round_number}, ${m.status}): ` +
          `home=away=${m.homeTeam?.team.name} (tt=${m.homeTeamId})`,
      );
    }
  }

  console.log(`\n[검사 결과] 총 ${totalConflicts}건 충돌`);
  if (totalConflicts > 0) {
    console.log(`\n해결 방법:`);
    console.log(`  1) 충돌 매치의 source 매치 (다른 매치의 next_match_id 가 가리킴) 가 진행 중이면`);
    console.log(`     자연 복구 — source 매치 종료 시 progressDualMatch 가 자동 덮어쓰기`);
    console.log(`  2) 즉시 fix 필요 시 awayTeamId NULL UPDATE (또는 homeTeamId NULL)`);
  }

  await prisma.$disconnect();
})();
