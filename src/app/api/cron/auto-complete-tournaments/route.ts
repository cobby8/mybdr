// 2026-06-15 Phase3 — 종료일 경과 + 매치0 대회 자동 completed 전환 cron (1일 1회 KST 03:00).
//
// 이유(왜):
//   - 매치(tournamentMatches)가 0건인 대회는 finalize/auto-complete 흐름(set-champion 등)을
//     타지 못해 종료일이 지나도 status 가 진행 상태로 남는다.
//   - 사람이 매번 수동으로 닫을 수 없으므로, 종료일이 KST 기준 어제까지 지난
//     "매치 0건" 대회를 매일 1회 자동으로 completed 처리한다.
//   - stale-pending-fix cron 패턴을 그대로 답습 (Bearer 가드 / findMany → updateMany
//     이중 가드 / admin_logs audit / silent log fail).
//
// 방법(어떻게):
//   1) Vercel Cron Bearer 가드 (CRON_SECRET 환경변수) — 다른 cron 과 동일 패턴
//   2) KST 오늘 00:00 경계를 UTC 로 환산 (kstMidnightUtc) — "당일"은 보호, 어제까지만 대상
//   3) findMany 후보: ★ tournamentMatches: { none: {} } (매치0 생명선)
//        + status NOT IN(completed/ended/closed/cancelled/draft/upcoming)
//        + endDate/startDate select → 코드에서 (endDate ?? startDate) < 경계 필터 (둘 다 null 제외)
//   4) updateMany(status: "completed") — ★ 매치0 + status 가드 재확인 (race 방지)
//        champion_team_id / mvp_player_id 미접촉
//   5) admin_logs createMany — 각 대회별 audit 박제 (resolveSystemAdminId 패턴 동일, silent fail)
//
// 가드:
//   - 대상 0건 → 200 + count:0 (정상 / idle)
//   - ★ 매치0 가드(none:{})는 findMany + updateMany 둘 다 필수 (race 방지)
//   - champion/mvp 0 접촉 / DB schema 변경 0 / DROP·TRUNCATE 0
//   - KST 경계 정확 — 당일 종료 대회는 보호 (어제까지만 처리)
//
// 회귀:
//   - finalize / auto-complete / set-champion (① 병렬 작업) 미접촉 — 본 cron + vercel.json 만
//   - 디자인 미접촉 / Flutter v1 영향 0 / 다른 cron 영향 0
//
// vercel.json: { "path": "/api/cron/auto-complete-tournaments", "schedule": "0 18 * * *" }
//   (UTC 18:00 = KST 03:00)

import { type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

// 자동 전환 대상에서 제외할 status (이미 종료됐거나 아직 시작 전인 상태).
// completed/ended/closed/cancelled = 이미 종료, draft/upcoming = 진행 전 → 모두 제외.
const EXCLUDED_STATUSES = [
  "completed",
  "ended",
  "closed",
  "cancelled",
  "draft",
  "upcoming",
];

/**
 * KST(UTC+9) 기준 "오늘 00:00" 을 UTC Date 로 환산한 순수함수.
 *
 * 이유: 서버는 UTC 로 동작하므로, "대회 종료일이 KST 기준 어제까지 지났는가"를
 *       정확히 판정하려면 KST 자정 경계를 UTC 로 변환해야 한다.
 *
 * 예) now(UTC) = 2026-06-15T01:00:00Z → KST 로는 2026-06-15 10:00.
 *     KST 오늘 00:00 = 2026-06-15 00:00 KST = 2026-06-14T15:00:00Z 를 반환.
 *     → endDate < 이 값 이면 "어제(KST)까지 종료된 대회" 로 판정 (당일 보호).
 *
 * 방법: now 에 +9h 한 시각의 UTC 연/월/일을 취해 그 날 00:00 KST 를 만들고,
 *       다시 -9h 하여 UTC 로 되돌린다. (Date.UTC 사용 — 로컬 타임존 영향 0)
 */
export function kstMidnightUtc(now: Date): Date {
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  // now 를 KST 로 이동한 시각 (이 시각의 UTC 달력 필드 = KST 달력 필드)
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  // KST 기준 오늘 00:00 을 UTC epoch 로 구성
  const kstMidnightAsUtcEpoch = Date.UTC(
    kstNow.getUTCFullYear(),
    kstNow.getUTCMonth(),
    kstNow.getUTCDate(),
    0,
    0,
    0,
    0,
  );
  // KST 00:00 → 실제 UTC 로 되돌리려면 -9h
  return new Date(kstMidnightAsUtcEpoch - KST_OFFSET_MS);
}

/**
 * admin_logs.admin_id 는 NOT NULL + User FK.
 * Cron 무인증 endpoint 라 session 이 없으므로 super_admin 첫 번째를 system actor 로 사용.
 * stale-pending-fix / PR-B 와 동일 패턴. cache: 모듈 단위 1회 조회.
 */
let cachedSystemAdminId: bigint | null = null;
async function resolveSystemAdminId(): Promise<bigint | null> {
  if (cachedSystemAdminId !== null) return cachedSystemAdminId;
  const sa = await prisma.user.findFirst({
    where: { admin_role: "super_admin", isAdmin: true },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  cachedSystemAdminId = sa?.id ?? null;
  return cachedSystemAdminId;
}

/**
 * GET /api/cron/auto-complete-tournaments
 *
 * Vercel Cron 만 호출 가능 (Bearer CRON_SECRET 가드).
 * 1일 1회 폴링 (`0 18 * * *` = KST 03:00).
 *
 * 200 응답:
 *   { count: number, completed_at: ISO, tournaments: [{ id, name }] }
 * 401 = Bearer 가드 실패
 */
export async function GET(req: NextRequest) {
  // 1) Vercel Cron 만 호출 가능 — Bearer 가드 (다른 cron 과 동일)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError("Unauthorized", 401);
  }

  const now = new Date();
  // KST 오늘 00:00 의 UTC 경계 — endDate/startDate 가 이 값보다 과거여야 "어제까지 종료" 로 인정
  const boundary = kstMidnightUtc(now);

  // 2) 후보 검색
  //    ★ tournamentMatches: { none: {} } — 매치 0건 대회만 (생명선 가드)
  //    status NOT IN(제외 status) — 이미 종료/진행 전 제외
  //    종료일 비교는 (endDate ?? startDate) 라 DB where 로는 표현이 까다로워
  //    날짜 필드만 select 후 코드에서 필터링한다.
  const candidates = await prisma.tournament.findMany({
    where: {
      tournamentMatches: { none: {} }, // ★ 매치 0건 생명선
      status: { notIn: EXCLUDED_STATUSES },
    },
    select: {
      id: true,
      name: true,
      endDate: true,
      startDate: true,
    },
  });

  // 3) 코드 필터: 종료일(없으면 시작일) 이 KST 어제까지 지난 대회만.
  //    endDate / startDate 둘 다 null 인 대회는 판단 불가 → 제외.
  const targets = candidates.filter((t) => {
    const effectiveDate = t.endDate ?? t.startDate;
    if (!effectiveDate) return false; // 둘 다 null → 제외 (자동 종료 판단 불가)
    return effectiveDate < boundary; // 경계보다 과거 = 어제까지 종료
  });

  // 4) 대상 0건 → idle 응답
  if (targets.length === 0) {
    return apiSuccess({
      count: 0,
      completed_at: now.toISOString(),
      tournaments: [],
    });
  }

  const targetIds = targets.map((t) => t.id);

  // 5) 일괄 completed 전환 — updateMany 1회
  //    ★ 매치0(none:{}) + status 가드 재확인 (race condition 방지 — findMany 이후 매치/상태
  //      변경됐을 수 있으므로 update 시점에 다시 검증)
  //    champion_team_id / mvp_player_id 는 data 에 미포함 → 미접촉
  const result = await prisma.tournament.updateMany({
    where: {
      id: { in: targetIds },
      tournamentMatches: { none: {} }, // ★ update 시점 재확인
      status: { notIn: EXCLUDED_STATUSES }, // ★ update 시점 재확인
    },
    data: { status: "completed" },
  });

  // 6) admin_logs createMany — 각 대회별 audit 박제 (silent fail)
  try {
    const systemAdminId = await resolveSystemAdminId();
    if (systemAdminId !== null) {
      await prisma.admin_logs.createMany({
        data: targets.map((t) => ({
          admin_id: systemAdminId,
          action: "auto_complete_tournament_cron",
          resource_type: "tournament",
          resource_id: null, // tournament.id 는 UUID(String) — bigint FK 컬럼에 미사용
          target_type: "tournament",
          target_id: null,
          // changes_made — 정정 전후 + 대회 메타 박제 (audit 추적용)
          changes_made: {
            to: "completed",
            trigger: "auto_complete_tournament_cron",
            tournament_id: t.id,
            tournament_name: t.name,
            end_date: t.endDate?.toISOString() ?? null,
            start_date: t.startDate?.toISOString() ?? null,
            boundary_kst_midnight_utc: boundary.toISOString(),
          } as unknown as Prisma.InputJsonValue,
          severity: "info",
          description: `종료일 경과 + 매치0 대회 자동 completed 처리 tournament=${t.name} (${t.id})`,
          created_at: now,
          updated_at: now,
        })),
      });
    }
  } catch (err) {
    // log 실패 = 전환 자체에 영향 0 (audit 누락만)
    console.error(
      "[auto-complete-tournaments] admin_logs.createMany failed:",
      err,
    );
  }

  // 7) 응답 — 전환된 대회 목록
  return apiSuccess({
    count: result.count,
    completed_at: now.toISOString(),
    tournaments: targets.map((t) => ({
      id: t.id,
      name: t.name,
    })),
  });
}
