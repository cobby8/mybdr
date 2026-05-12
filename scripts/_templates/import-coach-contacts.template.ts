/**
 * 코치 연락처 일괄 import 템플릿 (재사용 가능).
 *
 * 사용 시나리오: 카톡/시트에서 받은 코치 명단 (팀명 + 코치 이름 + 연락처) 일괄 박제.
 *
 * 사용법:
 *   1. 본 파일을 `scripts/_temp/import-coach-contacts.ts` 로 카피
 *   2. TOURNAMENT_KEYWORD 와 CONTACTS 배열 수정
 *   3. npx tsx scripts/_temp/import-coach-contacts.ts        # dry-run
 *   4. npx tsx scripts/_temp/import-coach-contacts.ts --apply # 실제 UPDATE
 *   5. 작업 후 즉시 삭제
 *
 * 안전:
 *   - 팀명 fuzzy match (LIKE %name%) — 동명 발견 시 경고 + skip
 *   - phone 정규화 (010-XXXX-XXXX)
 *   - dry-run 기본 / --apply 인자만 실행
 *   - applied_via='admin' 보존 (코치가 토큰으로 입력 시 'coach_token' 으로 자동 변경)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================
// 수정 영역
// ============================================================

/** 대회 검색 키워드 (Tournament.name LIKE %keyword%) */
const TOURNAMENT_KEYWORD = "강남구협회장배";

/** 코치 연락처 명단 — 팀명은 TournamentTeam.team_name 또는 Team.name 과 일치/유사 */
interface CoachContact {
  teamName: string; // 팀명 (Team.name 또는 별칭)
  managerName: string; // 코치 이름
  managerPhone: string; // 010-XXXX-XXXX 또는 01012345678
}

const CONTACTS: CoachContact[] = [
  // 예시 — 실제 데이터로 교체
  // { teamName: "강남U9-A", managerName: "홍길동", managerPhone: "010-1234-5678" },
  // { teamName: "강남U11-B", managerName: "김철수", managerPhone: "01098765432" },
];

// ============================================================
// 로직 (수정 불필요)
// ============================================================

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("010")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  return raw;
}

async function main() {
  const apply = process.argv.includes("--apply");
  console.log(`[import-coach-contacts] apply=${apply}`);

  if (CONTACTS.length === 0) {
    console.error("[fail] CONTACTS 배열이 비어 있습니다. 명단 입력 후 재실행하세요.");
    await prisma.$disconnect();
    return;
  }

  // 1. 대회 찾기
  const tournament = await prisma.tournament.findFirst({
    where: { name: { contains: TOURNAMENT_KEYWORD } },
    select: { id: true, name: true },
  });
  if (!tournament) {
    console.error(`[fail] 대회 미발견 (keyword="${TOURNAMENT_KEYWORD}")`);
    await prisma.$disconnect();
    return;
  }
  console.log(`[tournament] id=${tournament.id} name="${tournament.name}"`);

  // 2. 대회 팀 목록 (Team.name + TournamentTeam.team_name 둘 다 매칭)
  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId: tournament.id },
    select: {
      id: true,
      team_name: true,
      team: { select: { name: true } },
    },
  });
  console.log(`[teams] ${teams.length}건 로드`);

  // 3. 매칭
  let matched = 0;
  let ambiguous = 0;
  let notFound = 0;
  const updates: { tournamentTeamId: bigint; name: string; phone: string; matchedName: string }[] = [];

  for (const c of CONTACTS) {
    const phone = normalizePhone(c.managerPhone);
    const matches = teams.filter((t) => {
      const teamName = t.team?.name ?? t.team_name ?? "";
      return teamName.includes(c.teamName) || c.teamName.includes(teamName);
    });
    if (matches.length === 0) {
      console.log(`  ❌ "${c.teamName}" → 매칭 0건`);
      notFound++;
    } else if (matches.length > 1) {
      console.log(
        `  ⚠️ "${c.teamName}" → ${matches.length}건 매칭 (모호) — skip:`,
        matches.map((m) => m.team?.name ?? m.team_name)
      );
      ambiguous++;
    } else {
      const m = matches[0];
      const matchedName = m.team?.name ?? m.team_name ?? "(이름 없음)";
      console.log(
        `  ✅ "${c.teamName}" → "${matchedName}" (id=${m.id}) / ${c.managerName} ${phone}`
      );
      updates.push({
        tournamentTeamId: m.id,
        name: c.managerName,
        phone,
        matchedName,
      });
      matched++;
    }
  }

  console.log(
    `\n[summary] 매칭 ${matched}건 / 모호 ${ambiguous}건 / 미발견 ${notFound}건`
  );

  if (!apply) {
    console.log(`[dry-run] UPDATE 0 — --apply 인자로 실행`);
    await prisma.$disconnect();
    return;
  }

  // 4. UPDATE
  for (const u of updates) {
    await prisma.tournamentTeam.update({
      where: { id: u.tournamentTeamId },
      data: { manager_name: u.name, manager_phone: u.phone },
    });
  }
  console.log(`[done] ${updates.length}건 UPDATE 완료`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
