// ============================================================
// referee-console/evals/page.tsx — 평가 리포트 (정본 referee-data RF_EVAL 1:1 · R6-C)
//   ★글로벌 super 스코프 — 협회 필터 0(전 협회 평가 통합). READ = Prisma 직접.
//   ★mutation = 상태변경(확인모달). 신규 엔드포인트:
//     PATCH /api/web/admin/referee-evaluations/[id]/status { status }(super 가드).
//   - 데이터 0행 → SchemaList Empty(mock 0). RefereeEvaluation = R6-C 신규 모델.
// ============================================================

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import {
  refereeName,
  evalStatusBadge,
  avColor,
  getRefereeScope,
} from "../_referee-data";
import { EvalsList, type RfEvalRow } from "./_evals";

export const dynamic = "force-dynamic";

export default async function RefereeEvalsPage() {
  // ★4-2 스코프 — 협회 admin 은 자기 협회 심판 평가만(referee 관계경유), 전역=전 협회.
  const scope = await getRefereeScope();
  if (!scope) notFound();

  // 평가 목록(스코프 필터) — 최근 평가 우선.
  const evals = await prisma.refereeEvaluation.findMany({
    where: scope.isSuper
      ? {}
      : { referee: { association_id: scope.associationId } },
    orderBy: { evaluated_at: "desc" },
    take: 200,
    select: {
      id: true,
      tournament_match_id: true,
      overall_score: true,
      status: true,
      evaluator_label: true,
      referee: {
        select: { registered_name: true, verified_name: true },
      },
    },
  });

  const rows: RfEvalRow[] = evals.map((e, i) => {
    const stt = evalStatusBadge(e.status);
    return {
      id: e.id.toString(),
      evalId: e.id.toString(),
      statusCode: e.status,
      name: refereeName(e.referee),
      sub: stt.label,
      color: avColor(i),
      // 평가 경기: tournament_match 관계 미선언(평문 FK) → 경기 번호 표기(정직·mock 0).
      game: `경기 #${e.tournament_match_id.toString()}`,
      // Decimal(2,1) → "4.8" 표기.
      score: Number(e.overall_score).toFixed(1),
      // 평가자: evaluator_label(단체 포함) 없으면 "평가자".
      by: e.evaluator_label || "평가자",
      badge: stt.label,
      tone: stt.tone,
    };
  });

  return <EvalsList rows={rows} />;
}
