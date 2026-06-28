// ============================================================
// referee-console/assignments/page.tsx — 배정 현황 (정본 referee-pages RF_ASSIGN 기반)
//   ★글로벌 super 스코프 — 협회 필터 0(전 협회 배정 통합). READ only(읽기 드로어).
//   ★모델 적응: 정본은 경기-중심(crew 요약) 데모지만 실 RefereeAssignment 는
//     (심판 1 × 경기 1) 단위 → 행 = 심판/경기/역할/일시/상태로 충실 매핑(보고).
//   - 경기 정보(라운드/일시/코트)는 tournament_match 관계가 모델에 없어 2차 배치 조회로 보강.
//   - 데이터 0행 → SchemaList Empty(mock 0).
// ============================================================

import { prisma } from "@/lib/db/prisma";
import {
  refereeName,
  assignRoleLabel,
  assignStatusBadge,
  matchLabel,
  fmtDateTime,
  avColor,
} from "../_referee-data";
import { AssignmentsList, type RfAssignRow } from "./_assignments";

export const dynamic = "force-dynamic";

export default async function RefereeAssignmentsPage() {
  // 전역 배정 목록(협회 필터 0) — 최근 배정 우선.
  const assignments = await prisma.refereeAssignment.findMany({
    orderBy: { assigned_at: "desc" },
    take: 200,
    select: {
      id: true,
      tournament_match_id: true,
      role: true,
      status: true,
      assigned_at: true,
      referee: {
        select: { registered_name: true, verified_name: true },
      },
    },
  });

  // 경기 정보 보강(RefereeAssignment 에 TournamentMatch 관계 선언 없음 → 2차 배치 조회).
  const matchIds = Array.from(
    new Set(assignments.map((a) => a.tournament_match_id))
  );
  const matches =
    matchIds.length > 0
      ? await prisma.tournamentMatch.findMany({
          where: { id: { in: matchIds } },
          select: {
            id: true,
            roundName: true,
            match_code: true,
            scheduledAt: true,
            court_number: true,
          },
        })
      : [];
  const matchById = new Map(matches.map((m) => [m.id.toString(), m]));

  const rows: RfAssignRow[] = assignments.map((a, i) => {
    const m = matchById.get(a.tournament_match_id.toString());
    const stt = assignStatusBadge(a.status);
    return {
      id: a.id.toString(),
      name: refereeName(a.referee),
      sub: assignRoleLabel(a.role),
      color: avColor(i),
      game: m
        ? matchLabel({
            roundName: m.roundName,
            match_code: m.match_code,
            id: m.id,
          })
        : `경기 #${a.tournament_match_id.toString()}`,
      when: m ? fmtDateTime(m.scheduledAt) : "—",
      court: m?.court_number || "—",
      badge: stt.label,
      tone: stt.tone,
    };
  });

  return <AssignmentsList rows={rows} />;
}
