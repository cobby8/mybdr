// 2026-05-02 회귀 방지 audit log — TournamentMatch 변경 이력 추적
// errors.md "양쪽 같은 팀 (피벗·아울스)" 케이스 대응. 추적 가능한 정확한 출처 확보.
//
// 사용:
//   const before = { homeTeamId: 250n, ... };
//   const after = { homeTeamId: null, ... };
//   await recordMatchAudit(tx, matchId, before, after, "system", "progressDualMatch winner", null);

import type { Prisma } from "@prisma/client";

// 추적 대상 필드 — 회귀 위험 큰 것만
export const TRACKED_FIELDS = [
  "homeTeamId",
  "awayTeamId",
  "winner_team_id",
  "status",
  "homeScore",
  "awayScore",
  "scheduledAt",
] as const;

type TrackedField = (typeof TRACKED_FIELDS)[number];

// 2026-05-11: Phase 1-A — admin matches 토글 source "mode_switch" / Phase 1-B-2 — 웹 종이 기록지 BFF source "web-score-sheet".
//   DB 컬럼은 String @db.VarChar 라 enum 차단 없으나, type narrow 용 union 확장 (Phase 1-A reviewer Minor 1 권고).
export type AuditSource = "admin" | "flutter" | "system" | "mode_switch" | "web-score-sheet";

// 직렬화 — BigInt → string / Date → ISO
function serializeValue(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v === "bigint") return v.toString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

/**
 * 매치 변경 이력 기록.
 * - before/after 의 추적 필드만 비교, 변경 있으면 INSERT
 * - 변경 0 시 INSERT 0 (no-op, 호출자 안전)
 * - tx 트랜잭션 안에서 호출 권장 (caller 의 update 와 같은 트랜잭션)
 */
export async function recordMatchAudit(
  tx: Prisma.TransactionClient,
  matchId: bigint,
  before: Partial<Record<TrackedField, unknown>>,
  after: Partial<Record<TrackedField, unknown>>,
  source: AuditSource,
  context: string,
  changedBy: bigint | null,
): Promise<void> {
  const changes: Record<string, { before: unknown; after: unknown }> = {};
  for (const field of TRACKED_FIELDS) {
    if (!(field in after)) continue; // after 에 명시 안 된 필드는 추적 X (변경 의도 없음)
    const bSer = serializeValue(before[field]);
    const aSer = serializeValue(after[field]);
    if (bSer !== aSer) {
      changes[field] = { before: bSer, after: aSer };
    }
  }
  if (Object.keys(changes).length === 0) return; // 변경 0 → audit skip

  await tx.tournament_match_audits.create({
    data: {
      matchId,
      source,
      context,
      changes: changes as Prisma.InputJsonValue,
      ...(changedBy ? { changedBy } : {}),
    },
  });
}
