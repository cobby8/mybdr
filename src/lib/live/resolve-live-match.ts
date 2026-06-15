import { prisma } from "@/lib/db/prisma";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import type { CourtKeyParts } from "@/lib/live/court-key";

export interface ResolvedLiveMatch {
  matchId: bigint;
  /** in_progress 매치가 2건 이상이라 started_at 최신 1건을 골랐을 때 true(운영 알림용) */
  ambiguous: boolean;
}

/**
 * KST "YYYY-MM-DD" 하루를 UTC 경계 [start, end) 로 변환.
 *
 * ★전제: DB tournament_matches.scheduled_at(@db.Timestamp(6))은 Rails 관례대로 UTC 로 저장된다.
 *   KST(UTC+9) 하루의 시작 00:00 KST = (그 날짜 00:00 UTC) - 9시간.
 *   즉 KST 2026-06-15 00:00 == UTC 2026-06-14 15:00.
 *   eq 비교(타임존 함정)를 피하고 [start, end) 범위 필터로 "그 날 그 코트" 경기군을 묶는다.
 */
function kstDateToUtcRange(date: string): { start: Date; end: Date } {
  // date = "YYYY-MM-DD". 그 날 00:00 UTC 를 만든 뒤 9시간 빼면 KST 00:00 의 UTC 시각.
  const startUtcMidnight = new Date(`${date}T00:00:00.000Z`).getTime();
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const start = new Date(startUtcMidnight - KST_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/**
 * 코트키 → "지금 그 코트에서 진행 중인 경기" 1건 resolve.
 *
 * 조건: 같은 대회(tournamentId) + 같은 코트(venue_id 또는 court_number) +
 *       scheduled_at 이 KST 그 날짜 범위 + status="in_progress".
 * ★서버 라이브 상태값 = "in_progress" (NOT "live"). "live"는 앱 로컬 값이고
 *   서버 동기화 시 in_progress 로 매핑된다(status/route.ts statusSchema 근거).
 *
 * 반환:
 *   - 매치 있음 → { matchId, ambiguous } (2건 이상이면 started_at 최신 1건 + ambiguous:true)
 *   - 매치 없음(쉬는시간) → null  (호출부에서 204 빈 응답 → 오버레이 투명)
 */
export async function resolveLiveMatch(
  parts: CourtKeyParts
): Promise<ResolvedLiveMatch | null> {
  const { start, end } = kstDateToUtcRange(parts.date);

  // courtRef 접두사로 venue_id / court_number 분기
  const courtFilter = (() => {
    if (parts.courtRef.startsWith("v:")) {
      const venueId = parseBigIntParam(parts.courtRef.slice(2));
      if (venueId === null) return null;
      return { venue_id: venueId };
    }
    if (parts.courtRef.startsWith("n:")) {
      return { court_number: parts.courtRef.slice(2) };
    }
    return null;
  })();

  if (courtFilter === null) return null; // 코트 식별 불가

  const matches = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId: parts.tournamentId,
      status: "in_progress",
      scheduledAt: { gte: start, lt: end },
      ...courtFilter,
    },
    // 최신 시작 경기 우선. started_at null 은 뒤로(NULLS LAST 의도) — 정렬 후 first 사용.
    orderBy: { started_at: "desc" },
    select: { id: true },
    take: 2, // 동시 라이브 감지용으로 2건까지만 조회
  });

  if (matches.length === 0) return null;

  return {
    matchId: matches[0].id,
    ambiguous: matches.length > 1, // 1코트 1라이브가 정상 — 2건 이상이면 운영 경고
  };
}
