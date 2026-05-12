/**
 * /api/web/series/[id] — 시리즈 단건 GET/PATCH/DELETE.
 *
 * 2026-05-12 (Phase C) — PATCH/DELETE 추가:
 *   - PATCH: name/description/is_public/organization_id 변경.
 *     · 권한 = requireSeriesEditor (organizer + 단체 owner/admin + super_admin / Q2 결재).
 *     · organization_id 변경 시 카운터 동기화 ($transaction):
 *         이전 organization.series_count -1 / 새 organization.series_count +1
 *     · organization_id 변경 권한: 이전 단체 + 새 단체 모두 isOrganizationEditor 통과 필수
 *       (super_admin 은 우회 — 운영 사고 fix 여지).
 *   - DELETE (?hard=1, super_admin only): row 실제 삭제 + tournaments series_id NULL 분리 +
 *     organizations.series_count -1.
 *     · soft DELETE 는 본 PR 미구현 (status 컬럼 정책 결재 별 PR 큐잉).
 *
 * 정책 박제 (사용자 결재 Q2/Q3):
 *   - Q2 = "단체 owner/admin + super_admin" — 적용 (requireSeriesEditor)
 *   - Q3 = Phase D 본격 적용 — 본 PR 은 시리즈 PATCH/DELETE 권한 확장만
 */

import { z } from "zod";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import {
  requireSeriesEditor,
  isOrganizationEditor,
  SeriesPermissionError,
} from "@/lib/auth/series-permission";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { adminLog } from "@/lib/admin/log";

type RouteCtx = { params: Promise<{ id: string }> };

// ============================================================
// GET — 시리즈 단건 (organizer 본인만 — 기존 동작 유지)
// ============================================================
export const GET = withWebAuth(async (_req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;

  try {
    const series = await prisma.tournament_series.findUnique({
      where: { id: BigInt(id) },
      include: {
        tournaments: {
          orderBy: { edition_number: "asc" },
          select: {
            id: true,
            name: true,
            edition_number: true,
            startDate: true,
            status: true,
            venue_name: true,
            city: true,
            maxTeams: true,
            teams_count: true,
          },
        },
      },
    });

    if (!series) return apiError("시리즈를 찾을 수 없습니다.", 404);
    if (series.organizer_id !== ctx.userId) {
      return apiError("접근 권한이 없습니다.", 403);
    }

    const totalTeams = series.tournaments.reduce((sum, t) => sum + (t.teams_count ?? 0), 0);

    return apiSuccess({
      id: series.id.toString(),
      name: series.name,
      slug: series.slug,
      description: series.description,
      tournaments_count: series.tournaments_count ?? 0,
      total_teams: totalTeams,
      editions: series.tournaments.map((t) => ({
        id: t.id,
        name: t.name,
        edition_number: t.edition_number,
        startDate: t.startDate?.toISOString() ?? null,
        status: t.status,
        venue_name: t.venue_name,
        city: t.city,
        maxTeams: t.maxTeams,
        teams_count: t.teams_count ?? 0,
      })),
    });
  } catch {
    return apiError("서버 오류가 발생했습니다.", 500);
  }
});

// ============================================================
// PATCH — 시리즈 메타 수정 (Q2 권한 — Editor)
// ============================================================
// zod schema — name 50자, description 200자, is_public bool, organization_id nullable string
// (빈 문자열 = null 분리 처리. UI 에서 "단체 미연결" 옵션이 "" 보낼 수 있음.)
const seriesPatchBody = z.object({
  name: z.string().trim().min(1, "시리즈 이름은 필수입니다.").max(50, "시리즈 이름은 50자 이내입니다.").optional(),
  description: z.string().trim().max(200, "설명은 200자 이내입니다.").nullable().optional(),
  is_public: z.boolean().optional(),
  // organization_id: undefined = 무변경 / null/"" = 분리 / "8" 등 = 변경
  organization_id: z.union([z.string(), z.null()]).optional(),
});

export const PATCH = withWebAuth(async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id: idStr } = await routeCtx.params;

  // (1) seriesId BigInt 파싱
  let seriesId: bigint;
  try {
    seriesId = BigInt(idStr);
  } catch {
    return apiError("유효하지 않은 시리즈 ID입니다.", 400);
  }

  // (2) body 파싱
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }
  const parsed = seriesPatchBody.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return apiError(firstIssue?.message ?? "유효하지 않은 값입니다.", 400);
  }
  const data = parsed.data;

  // (3) 권한 검증 — requireSeriesEditor (organizer + 단체 owner/admin + super_admin)
  let series: NonNullable<Awaited<ReturnType<typeof prisma.tournament_series.findUnique>>>;
  try {
    const result = await requireSeriesEditor(seriesId, ctx.userId, ctx.session);
    if (!result.series) {
      // 타입 가드 — requireSeriesEditor 가 이미 throw 처리, 도달 X
      return apiError("시리즈를 찾을 수 없습니다.", 404);
    }
    series = result.series;
  } catch (e) {
    if (e instanceof SeriesPermissionError) {
      return apiError(e.message, e.status);
    }
    throw e;
  }

  // (4) organization_id 변경 처리 — 카운터 동기화 + 양쪽 단체 권한 검증
  const isOrgChange = data.organization_id !== undefined;
  let newOrgId: bigint | null = series.organization_id;

  if (isOrgChange) {
    // data.organization_id 는 zod 가 string | null | undefined 허용. isOrgChange 가 true 면
    // undefined 는 아니지만 ts 가 좁히지 못하므로 명시적으로 분기.
    const rawOrgId = data.organization_id;
    if (rawOrgId === null || rawOrgId === undefined || rawOrgId === "") {
      newOrgId = null;
    } else {
      try {
        newOrgId = BigInt(rawOrgId);
      } catch {
        return apiError("유효하지 않은 단체 ID입니다.", 400);
      }
    }

    const previousOrgId = series.organization_id;

    // 같은 단체로 변경 = 변경 없음 (skip)
    const isSameOrg =
      (previousOrgId === null && newOrgId === null) ||
      (previousOrgId !== null && newOrgId !== null && previousOrgId === newOrgId);

    if (!isSameOrg) {
      // super_admin 은 단체 권한 검증 우회 (운영 사고 fix 여지 보존).
      // 일반 사용자는 이전 단체 + 새 단체 모두 owner/admin 권한 확인.
      if (!isSuperAdmin(ctx.session)) {
        // 이전 단체 권한 — 분리 시에도 본인이 만질 수 있어야 함 (NULL 이면 skip)
        if (previousOrgId !== null) {
          const ok = await isOrganizationEditor(previousOrgId, ctx.userId);
          if (!ok) {
            return apiError("이전 단체에 대한 관리 권한이 없습니다.", 403);
          }
        }
        // 새 단체 권한 — 새 단체로 이동 시 (NULL 분리 시 skip)
        if (newOrgId !== null) {
          const ok = await isOrganizationEditor(newOrgId, ctx.userId);
          if (!ok) {
            return apiError("새 단체에 대한 관리 권한이 없습니다.", 403);
          }
          // 새 단체가 approved 상태인지 확인 (생성 API 동일 정책)
          const org = await prisma.organizations.findUnique({
            where: { id: newOrgId },
            select: { status: true },
          });
          if (!org || org.status !== "approved") {
            return apiError("승인된 단체에만 시리즈를 연결할 수 있습니다.", 400);
          }
        }
      }
    }

    // 변경 없음이면 카운터 transaction skip — 일반 필드만 update
    if (isSameOrg) {
      const updateData: Record<string, unknown> = { updated_at: new Date() };
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.is_public !== undefined) updateData.is_public = data.is_public;

      const updated = await prisma.tournament_series.update({
        where: { id: seriesId },
        data: updateData,
      });

      await adminLog("series_patch", "tournament_series", {
        resourceId: seriesId,
        targetType: "tournament_series",
        targetId: seriesId,
        description: `시리즈 메타 수정: ${updated.name}`,
        changesMade: { name: data.name, description: data.description, is_public: data.is_public },
        severity: "info",
      });

      return apiSuccess({
        id: updated.id.toString(),
        name: updated.name,
        description: updated.description,
        is_public: updated.is_public,
        organization_id: updated.organization_id?.toString() ?? null,
      });
    }

    // organization_id 변경 + 카운터 동기화 — $transaction 원자 처리
    const updated = await prisma.$transaction(async (tx) => {
      // 이전 단체 카운터 -1 (NULL 이면 skip)
      if (previousOrgId !== null) {
        await tx.organizations.update({
          where: { id: previousOrgId },
          data: { series_count: { decrement: 1 } },
        });
      }
      // 새 단체 카운터 +1 (NULL 이면 skip)
      if (newOrgId !== null) {
        await tx.organizations.update({
          where: { id: newOrgId },
          data: { series_count: { increment: 1 } },
        });
      }
      // 시리즈 UPDATE — organization_id + 일반 필드 함께
      const seriesUpdateData: Record<string, unknown> = {
        organization_id: newOrgId,
        updated_at: new Date(),
      };
      if (data.name !== undefined) seriesUpdateData.name = data.name;
      if (data.description !== undefined) seriesUpdateData.description = data.description;
      if (data.is_public !== undefined) seriesUpdateData.is_public = data.is_public;

      return tx.tournament_series.update({
        where: { id: seriesId },
        data: seriesUpdateData,
      });
    });

    await adminLog("series_organization_change", "tournament_series", {
      resourceId: seriesId,
      targetType: "tournament_series",
      targetId: seriesId,
      description: `시리즈 단체 변경: ${updated.name} (${previousOrgId?.toString() ?? "null"} → ${newOrgId?.toString() ?? "null"})`,
      previousValues: {
        organization_id: previousOrgId?.toString() ?? null,
      },
      changesMade: {
        organization_id: newOrgId?.toString() ?? null,
        name: data.name,
        description: data.description,
        is_public: data.is_public,
      },
      severity: "warning",
    });

    return apiSuccess({
      id: updated.id.toString(),
      name: updated.name,
      description: updated.description,
      is_public: updated.is_public,
      organization_id: updated.organization_id?.toString() ?? null,
    });
  }

  // (5) organization_id 미변경 — 일반 필드만 update
  const updateData: Record<string, unknown> = { updated_at: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.is_public !== undefined) updateData.is_public = data.is_public;

  // 변경 사항 0건 — 무영향 응답
  if (Object.keys(updateData).length === 1) {
    return apiSuccess({
      id: series.id.toString(),
      name: series.name,
      description: series.description,
      is_public: series.is_public,
      organization_id: series.organization_id?.toString() ?? null,
      noop: true,
    });
  }

  const updated = await prisma.tournament_series.update({
    where: { id: seriesId },
    data: updateData,
  });

  await adminLog("series_patch", "tournament_series", {
    resourceId: seriesId,
    targetType: "tournament_series",
    targetId: seriesId,
    description: `시리즈 메타 수정: ${updated.name}`,
    changesMade: { name: data.name, description: data.description, is_public: data.is_public },
    severity: "info",
  });

  return apiSuccess({
    id: updated.id.toString(),
    name: updated.name,
    description: updated.description,
    is_public: updated.is_public,
    organization_id: updated.organization_id?.toString() ?? null,
  });
});

// ============================================================
// DELETE — 시리즈 삭제 (?hard=1, super_admin only)
// ============================================================
// 본 PR 정책 = Hard DELETE 만 구현 (super_admin only).
// Soft DELETE 는 status 컬럼 정책 결재 후 별 PR 큐잉 (status="cancelled" or "archived" 결정 필요).
//
// Hard DELETE 동작:
//   1. tournaments series_id = NULL 분리 (FK NoAction — schema 활용)
//   2. organizations.series_count -1 (NULL 이면 skip)
//   3. tournament_series row 삭제
//   $transaction 원자 처리.
//
// 영향 범위:
//   - 묶인 대회는 보존 (개인 대회로 분리). 대회 자체 카운터는 없으므로 영향 0.
//   - organization 페이지 events 탭에서 대회들이 사라짐 (시리즈 분리되므로) — 의도된 동작.
export const DELETE = withWebAuth(async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id: idStr } = await routeCtx.params;

  let seriesId: bigint;
  try {
    seriesId = BigInt(idStr);
  } catch {
    return apiError("유효하지 않은 시리즈 ID입니다.", 400);
  }

  // hard 쿼리 파라미터 — 본 PR 은 hard 만 지원 (soft 는 별 PR)
  const url = new URL(req.url);
  const hardParam = url.searchParams.get("hard");
  const isHard = hardParam === "1" || hardParam === "true";

  if (!isHard) {
    return apiError(
      "시리즈 Soft DELETE 는 아직 지원하지 않습니다. ?hard=1 (super_admin) 만 가능합니다.",
      400,
    );
  }

  // Hard DELETE — super_admin 만 허용
  if (!isSuperAdmin(ctx.session)) {
    return apiError("Hard DELETE 는 super_admin 만 가능합니다.", 403);
  }

  // 현재 시리즈 row — organization_id (카운터 -1 대상) + 메타 (감사 로그용)
  const series = await prisma.tournament_series.findUnique({
    where: { id: seriesId },
    select: {
      id: true,
      name: true,
      organization_id: true,
      organizer_id: true,
      tournaments_count: true,
    },
  });

  if (!series) {
    return apiError("시리즈를 찾을 수 없습니다.", 404);
  }

  // $transaction — (1) tournaments series_id NULL 분리 (2) organization 카운터 -1 (3) series 삭제
  // 순서 중요: tournaments 분리 먼저 → series 삭제 시 FK 에러 방지 (FK NoAction 이라 자동 분리 X)
  let detachedCount = 0;
  try {
    await prisma.$transaction(async (tx) => {
      // 묶인 대회 series_id NULL 분리
      const detachResult = await tx.tournament.updateMany({
        where: { series_id: seriesId },
        data: { series_id: null },
      });
      detachedCount = detachResult.count;

      // organization 카운터 -1 (NULL 이면 skip)
      if (series.organization_id !== null) {
        await tx.organizations.update({
          where: { id: series.organization_id },
          data: { series_count: { decrement: 1 } },
        });
      }

      // series row 삭제
      await tx.tournament_series.delete({ where: { id: seriesId } });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Foreign key") || msg.includes("P2003")) {
      return apiError(
        "관련 데이터가 남아있어 삭제할 수 없습니다. 사전 정리 후 다시 시도하세요.",
        409,
      );
    }
    throw e;
  }

  await adminLog("series_hard_delete", "tournament_series", {
    targetType: "tournament_series",
    targetId: seriesId,
    description: `시리즈 영구 삭제 (Hard DELETE): ${series.name} (${seriesId.toString()})`,
    previousValues: {
      id: seriesId.toString(),
      name: series.name,
      organization_id: series.organization_id?.toString() ?? null,
      organizer_id: series.organizer_id.toString(),
      tournaments_count: series.tournaments_count,
    },
    changesMade: {
      detached_tournaments_count: detachedCount,
    },
    severity: "critical",
  });

  return apiSuccess({
    deleted: true,
    mode: "hard",
    id: seriesId.toString(),
    detached_tournaments_count: detachedCount,
  });
});
