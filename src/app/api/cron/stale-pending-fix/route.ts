// 2026-05-10 후속 #2 — stale pending 매치 자동 정정 cron (1시간 폴링).
//
// 이유(왜):
//   - 후속 #1 (자동 전환 로직 보강) 으로 신규 stale pending 재발 차단 이후,
//     기존에 누락된 stale pending 을 자동 정정 + admin_log audit 박제.
//   - stale pending = status="pending" + homeTeamId + awayTeamId + scheduledAt 모두 채워졌는데
//     자동 전환 (pending → scheduled) 미실행된 매치.
//   - 1시간 폴링 (5분 폴링은 과함 — pending 정정은 즉시성 불필요).
//
// 방법(어떻게):
//   1) Vercel Cron Bearer 가드 (CRON_SECRET 환경변수) — lineup-reminder 와 동일 패턴
//   2) 미래 매치만 (scheduledAt >= now()) — 지난 pending 매치는 데이터 stale 이지만 manual 검토 필요
//   3) updateMany 1회 (pending → scheduled) — 일괄 처리
//   4) admin_logs createMany 1회 — 각 매치별 audit (resolveSystemAdminId 패턴 PR-B 동일)
//
// 가드:
//   - 미래 매치 0건 → 200 + count:0 (정상 / idle 상태)
//   - 후속 #1 가 잘 박제됐다면 cron 발사 시 매번 0건 처리 (idle)
//   - admin_logs.admin_id NOT NULL FK → super_admin 첫 번째 system actor
//
// 회귀:
//   - matches PATCH route (후속 #1) 와 별도 폴링 — 충돌 0
//   - DB schema 변경 0 (admin_logs 기존 룰 사용)
//   - Flutter v1 영향 0 / 다른 cron 영향 0
//
// 운영 영향:
//   - 1시간마다 stale pending 자동 정정 (사람 개입 0)
//   - 정정 시 admin_log 박제 → 추후 audit 가능
//
// vercel.json: { "path": "/api/cron/stale-pending-fix", "schedule": "0 * * * *" }

import { type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * admin_logs.admin_id 는 NOT NULL + User FK.
 * Cron 무인증 endpoint 라 session 이 없으므로 super_admin 첫 번째를 system actor 로 사용.
 * PR-B (auto-register) 와 동일 패턴.
 * cache: 모듈 단위 1회 조회.
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
 * GET /api/cron/stale-pending-fix
 *
 * Vercel Cron 만 호출 가능 (Bearer CRON_SECRET 가드).
 * 1시간 폴링 (`0 * * * *`).
 *
 * 200 응답:
 *   { count: number, fixed_at: ISO, matches: [{ id, match_code }] }
 * 401 = Bearer 가드 실패
 */
export async function GET(req: NextRequest) {
  // 1) Vercel Cron 만 호출 가능 — Bearer 가드 (lineup-reminder 와 동일)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError("Unauthorized", 401);
  }

  const now = new Date();

  // 2) stale pending 검색 — 미래 매치만 (이미 지난 pending 매치는 manual 검토 / 본 cron 범위 외)
  // homeTeamId + awayTeamId + scheduledAt 모두 채워져있는데 status="pending" 인 매치.
  const stale = await prisma.tournamentMatch.findMany({
    where: {
      status: "pending",
      homeTeamId: { not: null },
      awayTeamId: { not: null },
      scheduledAt: {
        not: null,
        gte: now, // 미래 매치만 — 지난 pending 매치는 데이터 stale (별도 정책)
      },
    },
    select: {
      id: true,
      tournamentId: true,
      scheduledAt: true,
      homeTeamId: true,
      awayTeamId: true,
      match_code: true,
    },
  });

  // 3) 정정 대상 0건 → idle 응답 (후속 #1 정상 동작 시 매번 0건)
  if (stale.length === 0) {
    return apiSuccess({
      count: 0,
      fixed_at: now.toISOString(),
      matches: [],
    });
  }

  // 4) 일괄 scheduled 전환 — updateMany 1회
  // status="pending" 가드 재확인 (race condition 방지 — 다른 PATCH 와 동시 실행 시 안전)
  const result = await prisma.tournamentMatch.updateMany({
    where: {
      id: { in: stale.map((m) => m.id) },
      status: "pending",
    },
    data: { status: "scheduled" },
  });

  // 5) admin_logs createMany — 각 매치별 audit 박제
  // admin_id NOT NULL FK → super_admin 첫 번째 system actor (PR-B 패턴 동일)
  // 실패해도 정정 자체는 성공 — log 만 silent fail
  try {
    const systemAdminId = await resolveSystemAdminId();
    if (systemAdminId !== null) {
      await prisma.admin_logs.createMany({
        data: stale.map((m) => ({
          admin_id: systemAdminId,
          action: "auto_stale_pending_fix",
          resource_type: "tournament_match",
          resource_id: m.id,
          target_type: "tournament_match",
          target_id: m.id,
          // changes_made — 정정 전후 상태 + 매치 메타 박제 (audit 추적용)
          changes_made: {
            from: "pending",
            to: "scheduled",
            trigger: "stale_pending_cron",
            match_code: m.match_code,
            tournament_id: m.tournamentId?.toString() ?? null,
            scheduled_at: m.scheduledAt?.toISOString() ?? null,
          } as unknown as Prisma.InputJsonValue,
          previous_values: { status: "pending" } as Prisma.InputJsonValue,
          severity: "info",
          description: `stale pending 자동 정정 match_code=${m.match_code ?? m.id.toString()}`,
          created_at: now,
          updated_at: now,
        })),
      });
    }
  } catch (err) {
    // log 실패 = 정정 자체에 영향 0 (audit 누락만)
    console.error("[stale-pending-fix] admin_logs.createMany failed:", err);
  }

  // 6) 응답 — 정정된 매치 목록 (id 는 string 변환 / BigInt JSON 직렬화 회피)
  return apiSuccess({
    count: result.count,
    fixed_at: now.toISOString(),
    matches: stale.map((m) => ({
      id: m.id.toString(),
      match_code: m.match_code,
    })),
  });
}
