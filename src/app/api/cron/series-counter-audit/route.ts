/**
 * /api/cron/series-counter-audit — 시리즈/단체 카운터 정합성 monthly audit (DRY-RUN).
 *
 * 2026-05-12 (Phase B-3) — 운영 카운터 정합성 자동 점검.
 *
 * 이유 (왜):
 *   - Phase A 즉시 fix (createTournament +1 박제 + DELETE -1 박제) + Phase A 카운터 backfill 수행 후에도
 *     장기적으로 race condition / 미발견 path / 수동 DB 작업 등으로 카운터가 다시 깨질 수 있음.
 *   - 매월 1일 0시 cron 으로 자동 audit → 불일치 발견 시 console.warn (향후 Sentry/Slack 연동).
 *   - 본 cron 은 **DRY-RUN only** — UPDATE 0건. 발견 시 사람이 수동으로 `scripts/_temp/series-counter-recompute.ts --apply`
 *     실행 책임 (운영 안전 우선).
 *
 * 어떻게:
 *   - Vercel Cron Bearer 가드 (CRON_SECRET) — stale-pending-fix 와 동일 패턴.
 *   - tournament_series.tournaments_count vs actual count(tournaments) 비교
 *   - organizations.series_count vs actual count(tournament_series) 비교
 *   - 응답 = { ok: true, checked_at, series: {...}, organizations: {...} }
 *   - 불일치 시 console.warn (Vercel runtime logs 캡처) — 향후 Sentry capture 로 확장 가능
 *
 * vercel.json crons: { "path": "/api/cron/series-counter-audit", "schedule": "0 0 1 * *" } (매월 1일 0시)
 */

import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

interface MismatchItem {
  id: string;
  name: string;
  stored: number;
  actual: number;
  delta: number; // actual - stored (양수 = 박제 누락 / 음수 = 과다)
}

interface AuditReport {
  total: number;
  mismatch_count: number;
  mismatches: MismatchItem[];
}

/**
 * tournament_series.tournaments_count vs Prisma _count.tournaments 비교
 */
async function auditSeriesCounters(): Promise<AuditReport> {
  // 모든 시리즈 + 실제 tournament 개수 SELECT (Prisma _count relation count 활용)
  const all = await prisma.tournament_series.findMany({
    select: {
      id: true,
      name: true,
      tournaments_count: true,
      _count: {
        select: { tournaments: true },
      },
    },
  });

  const mismatches: MismatchItem[] = [];

  for (const s of all) {
    const stored = s.tournaments_count ?? 0;
    const actual = s._count.tournaments;
    if (stored !== actual) {
      mismatches.push({
        id: s.id.toString(),
        name: s.name,
        stored,
        actual,
        delta: actual - stored,
      });
    }
  }

  return {
    total: all.length,
    mismatch_count: mismatches.length,
    mismatches,
  };
}

/**
 * organizations.series_count vs Prisma _count.series 비교
 */
async function auditOrganizationCounters(): Promise<AuditReport> {
  const all = await prisma.organizations.findMany({
    select: {
      id: true,
      name: true,
      series_count: true,
      _count: {
        select: { series: true },
      },
    },
  });

  const mismatches: MismatchItem[] = [];

  for (const o of all) {
    const stored = o.series_count ?? 0;
    const actual = o._count.series;
    if (stored !== actual) {
      mismatches.push({
        id: o.id.toString(),
        name: o.name,
        stored,
        actual,
        delta: actual - stored,
      });
    }
  }

  return {
    total: all.length,
    mismatch_count: mismatches.length,
    mismatches,
  };
}

export async function GET(req: NextRequest) {
  // Vercel Cron Bearer 가드 — stale-pending-fix 와 동일 패턴
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError("Unauthorized", 401);
  }

  const checkedAt = new Date();

  try {
    const [seriesReport, orgReport] = await Promise.all([
      auditSeriesCounters(),
      auditOrganizationCounters(),
    ]);

    // 불일치 발견 시 console.warn (Vercel runtime logs 캡처)
    // 향후 Sentry/Slack 연동 후보 — 본 PR 은 console 만
    if (seriesReport.mismatch_count > 0) {
      console.warn(
        `[series-counter-audit] tournament_series.tournaments_count 불일치 ${seriesReport.mismatch_count}건 발견`,
        seriesReport.mismatches,
      );
    }
    if (orgReport.mismatch_count > 0) {
      console.warn(
        `[series-counter-audit] organizations.series_count 불일치 ${orgReport.mismatch_count}건 발견`,
        orgReport.mismatches,
      );
    }

    // 본 cron 은 DRY-RUN — UPDATE 0건. 사람이 수동으로 backfill 스크립트 실행 책임.
    return apiSuccess({
      ok: true,
      mode: "dry-run",
      checked_at: checkedAt.toISOString(),
      series: seriesReport,
      organizations: orgReport,
      total_mismatches: seriesReport.mismatch_count + orgReport.mismatch_count,
      action_required:
        seriesReport.mismatch_count + orgReport.mismatch_count > 0
          ? "scripts/_temp/series-counter-recompute.ts --apply 실행 필요"
          : null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[series-counter-audit] failed", { err: msg });
    return apiError("audit 실행 중 오류가 발생했습니다.", 500);
  }
}
