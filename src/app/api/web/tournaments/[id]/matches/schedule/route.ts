import { type NextRequest } from "next/server";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

// ============================================================
// PATCH /api/web/tournaments/[id]/matches/schedule
//   대회 운영 일정 패널(#7 일정 영속화 v1)의 "일정 저장" 단일 진입점.
//   - 배치 결과(시각·코트·장소)를 기존 3칸에만 bulk UPDATE (스키마 0변경):
//       scheduled_at(DateTime, KST→UTC) · court_number(String) · venue_name(String)
//   - 미배치 매치 = 3칸 모두 null (저장 시 일정 해제).
//   ★ score/status/winner/home/away 등 결과 컬럼은 절대 미접촉 (3칸 외 0접촉).
// ============================================================

type Ctx = { params: Promise<{ id: string }> };

// body 단건 타입(adminFetch deep camel→snake 변환 후 — scheduledAt→scheduled_at 등)
type ScheduleInput = {
  id: unknown;
  scheduled_at: unknown;
  court_number: unknown;
  venue_name: unknown;
};

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  // ── 권한: 해당 대회 관리자 (기존 매치 route 와 동일 가드) ──
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  // ── body 파싱 ──
  let body: { matches?: unknown };
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }
  if (!Array.isArray(body.matches)) {
    return apiError("일정 데이터(matches)가 필요합니다.", 400);
  }
  const rows = body.matches as ScheduleInput[];

  // ── 각 row 정규화: id(BigInt) + 3칸 값 ──
  //   scheduled_at: ISO 문자열(UTC) 또는 null / court_number·venue_name: string 또는 null
  type Normalized = {
    matchId: bigint;
    scheduledAt: Date | null;
    courtNumber: string | null;
    venueName: string | null;
  };
  const normalized: Normalized[] = [];
  for (const r of rows) {
    const matchId = parseBigIntParam(String(r.id));
    if (matchId === null) {
      return apiError("유효하지 않은 경기 ID가 포함되어 있습니다.", 400);
    }
    // scheduled_at: 빈값/null → null, 그 외 Date 파싱(유효성 검증)
    let scheduledAt: Date | null = null;
    if (r.scheduled_at != null && String(r.scheduled_at).trim() !== "") {
      const d = new Date(String(r.scheduled_at));
      if (Number.isNaN(d.getTime())) {
        return apiError("유효하지 않은 일시 형식이 포함되어 있습니다.", 400);
      }
      scheduledAt = d;
    }
    const courtNumber =
      r.court_number != null && String(r.court_number).trim() !== ""
        ? String(r.court_number)
        : null;
    const venueName =
      r.venue_name != null && String(r.venue_name).trim() !== ""
        ? String(r.venue_name)
        : null;
    normalized.push({ matchId, scheduledAt, courtNumber, venueName });
  }

  if (normalized.length === 0) {
    return apiSuccess({ updated: 0, skipped: [] as string[] });
  }

  // ── IDOR 가드: body 의 모든 id 가 이 대회 소속인지 1회 조회로 검증 ──
  const ids = normalized.map((n) => n.matchId);
  const owned = await prisma.tournamentMatch.findMany({
    where: { tournamentId: id, id: { in: ids } },
    select: { id: true, status: true },
  });
  const statusById = new Map<string, string | null>(
    owned.map((m) => [m.id.toString(), m.status]),
  );
  // 외부(타 대회) id 가 하나라도 섞이면 전체 403 (부분 적용 아님)
  const foreign = normalized.filter((n) => !statusById.has(n.matchId.toString()));
  if (foreign.length > 0) {
    return apiError("이 대회에 속하지 않은 경기가 포함되어 있습니다.", 403);
  }

  // ── 진행/종료 매치 가드: in_progress·completed 는 일정 덮어쓰기 제외(skip) ──
  //   reject-all 이 아니라 부분 적용 — 나머지만 저장하고 skip 목록 반환.
  const LOCKED = new Set(["in_progress", "completed"]);
  const skipped: string[] = [];
  const toApply: Normalized[] = [];
  for (const n of normalized) {
    const st = statusById.get(n.matchId.toString());
    if (st != null && LOCKED.has(st)) {
      skipped.push(n.matchId.toString());
    } else {
      toApply.push(n);
    }
  }

  // ── 트랜잭션: 적용 대상만 3칸 UPDATE (오직 이 3칸 — 결과 컬럼 미포함) ──
  if (toApply.length > 0) {
    await prisma.$transaction(
      toApply.map((n) =>
        prisma.tournamentMatch.update({
          where: { id: n.matchId },
          data: {
            scheduledAt: n.scheduledAt, // @map scheduled_at (KST→UTC 변환은 클라가 ISO 로 전달)
            court_number: n.courtNumber,
            venue_name: n.venueName,
          },
        }),
      ),
    );
  }

  return apiSuccess({ updated: toApply.length, skipped });
}
