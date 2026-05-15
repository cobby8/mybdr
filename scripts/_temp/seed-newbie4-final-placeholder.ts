/**
 * 4차 BDR 뉴비리그 (Tournament 443f23f8 / 5/16 시작) 단판 결승 매치 232
 * placeholder 박제 1회성 스크립트.
 *
 * ⚠️ 본 스크립트 실행 = 운영 DB UPDATE 1건. CLAUDE.md §DB 정책 따라 사용자 결재 후 실행.
 *
 * 사유:
 *   - 4차 뉴비리그 = division_rule 0건 + 매치 settings.division_code 없음
 *   - 매치 232 (단판 결승) 가 homeTeamId/awayTeamId NULL + notes NULL 상태로 박혀있음
 *   - 본 스크립트 = notes "A조 1위 vs B조 1위" + settings.{homeSlotLabel/awaySlotLabel} 박제
 *   - 5/17 예선 6건 종료 직후 advanceTournamentPlaceholders 가 자동 채움 가능하도록 준비
 *
 * 실행 명령 (PM 이 사용자 결재 후):
 *   npx tsx scripts/_temp/seed-newbie4-final-placeholder.ts
 *
 * 안전 가드 5중:
 *   1) tournamentId UUID 일치 검증 (잘못된 매치 보호)
 *   2) homeTeamId/awayTeamId 모두 NULL 검증 (이미 실팀 박혀있으면 skip)
 *   3) placeholder-helpers (buildSlotLabel + buildPlaceholderNotes) 통과 의무 — raw 문자열 ❌
 *   4) settings 병합 (기존 키 보존 — settings JSON 단일 UPDATE 통합 패턴)
 *   5) 사후 검증 — ADVANCEMENT_REGEX 매칭 + settings.homeSlotLabel/awaySlotLabel 박제 확인
 *
 * 사후 정리: 작업 후 본 파일 삭제 (CLAUDE.md §DB 정책 §3 — 운영 credentials 노출 방지).
 */
import { PrismaClient } from "@prisma/client";
import { buildSlotLabel, buildPlaceholderNotes } from "@/lib/tournaments/placeholder-helpers";

const TOURNAMENT_ID = "443f23f8-0000-41d4-bcbd-1843f7e16e1f";
const MATCH_ID = 232n;

const prisma = new PrismaClient();

async function main() {
  console.log("=== 4차 뉴비리그 매치 232 placeholder 박제 스크립트 ===\n");

  // ─────────────────────────────────────────────────────────────────────
  // 1) 사전 SELECT 검증 (DESTRUCTIVE 아님 / 가드 0)
  // ─────────────────────────────────────────────────────────────────────
  console.log("[1/4] 사전 검증 — 매치 232 fetch...");
  const before = await prisma.tournamentMatch.findUnique({
    where: { id: MATCH_ID },
    select: {
      id: true,
      tournamentId: true,
      homeTeamId: true,
      awayTeamId: true,
      notes: true,
      settings: true,
      status: true,
      roundName: true,
    },
  });

  if (!before) {
    throw new Error(`match id=${MATCH_ID} not found — 운영 DB 매치 부재 (스크립트 실행 중단)`);
  }

  // tournamentId 일치 검증 — 잘못된 매치 보호
  if (before.tournamentId !== TOURNAMENT_ID) {
    throw new Error(
      `tournament mismatch — expected=${TOURNAMENT_ID} / actual=${before.tournamentId} (스크립트 실행 중단)`,
    );
  }

  console.log("  ✓ 매치 232 확인:", {
    id: before.id.toString(),
    tournamentId: before.tournamentId,
    homeTeamId: before.homeTeamId?.toString() ?? null,
    awayTeamId: before.awayTeamId?.toString() ?? null,
    notes: before.notes,
    status: before.status,
    roundName: before.roundName,
  });

  // idempotent 가드 — 이미 실팀 박혀있으면 skip
  if (before.homeTeamId !== null || before.awayTeamId !== null) {
    console.log("\n  ⚠ 이미 실팀 박힘 — UPDATE skip (idempotent 보호)");
    return;
  }

  // ─────────────────────────────────────────────────────────────────────
  // 2) placeholder-helpers 통과 — 인라인 문자열 박제 ❌ (강남구 사고 영구 차단)
  // ─────────────────────────────────────────────────────────────────────
  console.log("\n[2/4] placeholder-helpers 통과 — slot label / notes 생성...");
  const homeSlot = buildSlotLabel({ kind: "group_rank", group: "A", rank: 1 }); // "A조 1위"
  const awaySlot = buildSlotLabel({ kind: "group_rank", group: "B", rank: 1 }); // "B조 1위"
  const notes = buildPlaceholderNotes(homeSlot, awaySlot); // "A조 1위 vs B조 1위"

  console.log("  ✓ homeSlot:", homeSlot);
  console.log("  ✓ awaySlot:", awaySlot);
  console.log("  ✓ notes:", notes);

  // ─────────────────────────────────────────────────────────────────────
  // 3) settings 병합 — 기존 키 보존 (settings JSON 단일 UPDATE 통합 패턴)
  // ─────────────────────────────────────────────────────────────────────
  // 사유: settings 가 null/array/primitive 시 빈 객체로 시작 (방어).
  //   기존 키 (예: recording_mode) 자동 보존.
  const baseSettings =
    before.settings && typeof before.settings === "object" && !Array.isArray(before.settings)
      ? (before.settings as Record<string, unknown>)
      : {};
  const nextSettings = {
    ...baseSettings,
    homeSlotLabel: homeSlot,
    awaySlotLabel: awaySlot,
  };

  console.log("\n[3/4] settings 병합 검증...");
  console.log("  ✓ baseSettings:", JSON.stringify(baseSettings));
  console.log("  ✓ nextSettings:", JSON.stringify(nextSettings));

  // ─────────────────────────────────────────────────────────────────────
  // 4) UPDATE 1건 (운영 DB 영향 = 매치 232 row 1건만)
  // ─────────────────────────────────────────────────────────────────────
  console.log("\n[4/4] UPDATE 실행...");
  const result = await prisma.tournamentMatch.update({
    where: { id: MATCH_ID },
    data: {
      notes,
      settings: nextSettings,
    },
    select: {
      id: true,
      notes: true,
      settings: true,
      homeTeamId: true,
      awayTeamId: true,
    },
  });

  console.log("  ✓ UPDATE result:", {
    id: result.id.toString(),
    notes: result.notes,
    settings: result.settings,
    homeTeamId: result.homeTeamId?.toString() ?? null,
    awayTeamId: result.awayTeamId?.toString() ?? null,
  });

  // ─────────────────────────────────────────────────────────────────────
  // 5) 사후 검증 — ADVANCEMENT_REGEX 매칭 + settings 박제 확인
  // ─────────────────────────────────────────────────────────────────────
  console.log("\n=== 사후 검증 ===");
  const advancementRegex = /([A-Z])조\s*(\d+)위\s*vs\s*([A-Z])조\s*(\d+)위/;
  const notesMatch = advancementRegex.test(result.notes ?? "");
  if (!notesMatch) {
    throw new Error(`ADVANCEMENT_REGEX 호환 실패 — notes=${result.notes}`);
  }
  console.log("  ✓ notes ADVANCEMENT_REGEX 매칭:", notesMatch);

  const resultSettings = result.settings as Record<string, unknown> | null;
  if (resultSettings?.homeSlotLabel !== homeSlot) {
    throw new Error(`settings.homeSlotLabel 박제 실패 — actual=${String(resultSettings?.homeSlotLabel)}`);
  }
  if (resultSettings?.awaySlotLabel !== awaySlot) {
    throw new Error(`settings.awaySlotLabel 박제 실패 — actual=${String(resultSettings?.awaySlotLabel)}`);
  }
  console.log("  ✓ settings.homeSlotLabel/awaySlotLabel 박제 OK");

  // count 1건 검증 — 운영 DB 영향 = 매치 232 row 단 1건
  const count = await prisma.tournamentMatch.count({
    where: {
      id: MATCH_ID,
      tournamentId: TOURNAMENT_ID,
      notes: { contains: "A조 1위 vs B조 1위" },
    },
  });
  if (count !== 1) {
    throw new Error(`사후 count 검증 실패 — expected=1 / actual=${count}`);
  }
  console.log("  ✓ 사후 count 검증:", count, "(매치 232 단 1건)");

  console.log("\n=== 완료 — 매치 232 placeholder 박제 OK ===");
  console.log("후속: 5/17 예선 6건 종료 후 advanceTournamentPlaceholders() trigger → A1/B1 실팀 자동 채움.");
}

main()
  .catch((err) => {
    console.error("[ERROR]", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
