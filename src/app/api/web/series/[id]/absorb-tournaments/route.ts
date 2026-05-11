/**
 * POST /api/web/series/[id]/absorb-tournaments — 시리즈에 본인 소유 대회 다건 흡수.
 *
 * 2026-05-12 — 대회-시리즈 연결 흡수 모달 (PR3) 신규.
 *
 * 이유 (왜):
 *   - 단체 관리 페이지에서 운영자가 본인 미연결 대회 N건을 "한 번에" 시리즈에 박을 수 있어야 한다.
 *     (단건 PATCH 를 N번 호출하면 트랜잭션 보장 X / 카운터 +N 도 race 위험)
 *   - PR1 PATCH 의 series_id 처리 흐름과 정책 일치 — status 가드, requireSeriesOwner, 카운터
 *     동기화. 본 API 는 다건 + skip 패턴 (오류 row 는 응답에 분리 표기, 정상 row 만 처리).
 *
 * 어떻게:
 *   - withWebAuth 로 로그인 강제.
 *   - zod: tournament_ids = string UUID 배열, min 1 / max 50 (한 번에 너무 많은 흡수 차단).
 *   - requireSeriesOwner(seriesId, userId, allowSuperAdmin) — 본인 시리즈만 + super_admin 우회.
 *   - 각 tournament 검증 (3 조건):
 *       (a) 존재 / (b) organizerId === userId 본인 소유 / (c) status IN allowed
 *     위반 시 → skipped 배열에 reason 박제 (전체 400 X — 부분 성공 허용).
 *   - $transaction: 이전 series_id 별 group by → 카운터 -1*count / 새 시리즈 +absorbed.length /
 *     tournament UPDATE updateMany (series_id = 새 ID).
 *   - 응답: { absorbed: [...ids], skipped: [{id, reason}] } — UI 가 개별 결과 표시.
 *
 * 응답 예시:
 *   {
 *     absorbed: ["bd527531-...", "..."],
 *     skipped: [
 *       { id: "abc-...", reason: "본인 소유 대회가 아닙니다." },
 *       { id: "xyz-...", reason: "진행 중인 대회는 흡수 불가합니다." }
 *     ]
 *   }
 */

import { z } from "zod";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import {
  requireSeriesOwner,
  SeriesPermissionError,
} from "@/lib/auth/series-permission";

type RouteCtx = { params: Promise<{ id: string }> };

// PR1 PATCH 의 SERIES_CHANGE_ALLOWED_STATUSES + my-unlinked GET 과 동일 정책.
const ABSORB_ALLOWED_STATUSES = new Set([
  "draft",
  "registration_open",
  "registration",
]);

// zod schema — 한 번에 최대 50건 흡수 제한 (운영 사고 방어 + transaction 부하 제한).
// uuid() 검증 — Tournament.id 는 UUID 라 형식 1차 차단.
const absorbBodySchema = z.object({
  tournament_ids: z.array(z.string().uuid()).min(1).max(50),
});

export const POST = withWebAuth(
  async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
    const { id: seriesIdStr } = await routeCtx.params;

    // (1) seriesId BigInt 파싱 — 잘못된 형식이면 400.
    let seriesId: bigint;
    try {
      seriesId = BigInt(seriesIdStr);
    } catch {
      return apiError("유효하지 않은 시리즈 ID입니다.", 400);
    }

    // (2) 요청 body 파싱.
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError("잘못된 요청입니다.", 400);
    }
    const parsed = absorbBodySchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return apiError(firstIssue?.message ?? "유효하지 않은 값입니다.", 400);
    }
    const { tournament_ids: tournamentIds } = parsed.data;

    // (3) 시리즈 권한 검증 — 본인 시리즈만 + super_admin 우회 허용 (PR1 정책 일치).
    try {
      await requireSeriesOwner(seriesId, ctx.userId, {
        allowSuperAdmin: true,
        session: ctx.session,
      });
    } catch (e) {
      if (e instanceof SeriesPermissionError) {
        return apiError(e.message, e.status);
      }
      throw e;
    }

    // (4) 후보 대회 일괄 조회 — IN 절 1번으로 전체 가져온 뒤 메모리에서 분기.
    //   필요 컬럼: id (응답) / organizerId (소유 검증) / status (가드) / series_id (이전 시리즈 카운터 감소용).
    const candidates = await prisma.tournament.findMany({
      where: { id: { in: tournamentIds } },
      select: {
        id: true,
        organizerId: true,
        status: true,
        series_id: true,
      },
    });

    // 요청 ID 중 DB 에 없는 것 추출 — 미존재로 skip.
    const foundIds = new Set(candidates.map((t) => t.id));
    const missingIds = tournamentIds.filter((tid) => !foundIds.has(tid));

    // (5) 각 후보를 검증 → absorbed / skipped 분리.
    const absorbed: string[] = [];
    const skipped: Array<{ id: string; reason: string }> = [];

    // 미존재 건은 그대로 skip.
    for (const mid of missingIds) {
      skipped.push({ id: mid, reason: "대회를 찾을 수 없습니다." });
    }

    // 이전 시리즈 카운터 감소를 group by 하기 위한 map (key=이전 series_id BigInt 문자열, value=count).
    const prevSeriesDecrement = new Map<string, number>();

    for (const t of candidates) {
      // (a) 본인 소유 검증 — super_admin 도 본 API 는 본인 소유만 흡수 (자기 시리즈 + 자기 대회).
      // 정책: super_admin 우회는 시리즈 권한만 — 대회 소유는 본인 일관성 유지 (PR1 PATCH 와 다름:
      //   PR1 은 단건이라 wizard 진입자가 본인 organizer 인지 requireTournamentAdmin 가 검증.
      //   본 API 는 wizard 진입 X — 시리즈 단에서 임의 대회 흡수 시 본인 소유 외 차단 필수).
      if (t.organizerId !== ctx.userId) {
        skipped.push({ id: t.id, reason: "본인 소유 대회가 아닙니다." });
        continue;
      }
      // (b) 이미 같은 시리즈에 박혀 있으면 skip — 중복 흡수 방지.
      if (t.series_id !== null && t.series_id === seriesId) {
        skipped.push({
          id: t.id,
          reason: "이미 이 시리즈에 연결된 대회입니다.",
        });
        continue;
      }
      // (c) status 가드 — draft / registration_open / registration 만.
      if (!ABSORB_ALLOWED_STATUSES.has(t.status ?? "")) {
        skipped.push({
          id: t.id,
          reason: "진행 중이거나 종료된 대회는 흡수 불가합니다.",
        });
        continue;
      }
      // 통과 — 흡수 대상.
      absorbed.push(t.id);
      // 이전 시리즈 카운터 감소 누적 (NULL 이면 skip — 새 시리즈에 +1 만).
      if (t.series_id !== null) {
        const key = t.series_id.toString();
        prevSeriesDecrement.set(key, (prevSeriesDecrement.get(key) ?? 0) + 1);
      }
    }

    // 흡수 가능한 대회 0건이면 skipped 만 반환 — transaction 진입 X.
    if (absorbed.length === 0) {
      return apiSuccess({ absorbed, skipped });
    }

    // (6) $transaction — 카운터 동기화 + 대회 일괄 UPDATE.
    //   - 이전 시리즈 N개 → 각각 -count
    //   - 새 시리즈 → +absorbed.length
    //   - tournament.updateMany(where IN absorbed, data series_id = 새 ID)
    //   하나라도 실패 시 전체 롤백.
    try {
      await prisma.$transaction(async (tx) => {
        // 이전 시리즈별 -count (group by)
        for (const [prevSeriesIdStr, count] of prevSeriesDecrement.entries()) {
          await tx.tournament_series.update({
            where: { id: BigInt(prevSeriesIdStr) },
            data: { tournaments_count: { decrement: count } },
          });
        }
        // 새 시리즈 +absorbed.length
        await tx.tournament_series.update({
          where: { id: seriesId },
          data: { tournaments_count: { increment: absorbed.length } },
        });
        // 대회 일괄 UPDATE — series_id = 새 시리즈 ID.
        await tx.tournament.updateMany({
          where: { id: { in: absorbed } },
          data: { series_id: seriesId },
        });
      });
    } catch {
      return apiError("대회 흡수 중 오류가 발생했습니다.", 500);
    }

    return apiSuccess({ absorbed, skipped });
  },
);
