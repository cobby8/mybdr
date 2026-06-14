"use server";

/**
 * 시즌 시상(P1-b) 관리자 입력 Server Action.
 *
 * 왜 server action(코트제보 admin-courts.ts 패턴 동형):
 *   - 시상 = 관리자가 곧 source of truth → 승인 큐 없음. 단순 INSERT/UPDATE/DELETE.
 *   - super_admin 가드 단일 진입점(requireSuperAdmin) + adminLog audit.
 *
 * 어떻게:
 *   - upsertSeasonAwardAction: id 있으면 update, 없으면 create.
 *     category 화이트리스트(8종) + series_id/user_id/team_id 선택 + payload(comment/quote 등).
 *   - deleteSeasonAwardAction: id 삭제.
 *   - 입력값은 formData (admin-courts 동형). 검증 실패 시 조용히 return (폼 측 사전 검증 병행).
 */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { adminLog } from "@/lib/admin/log";
import { isSeasonAwardCategory } from "@/lib/awards/season-award-categories";

// 슈퍼관리자 권한 확인 (admin-courts.ts 동형)
async function requireSuperAdmin() {
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") throw new Error("권한이 없습니다.");
  return session;
}

// "123" → BigInt / 빈값·비숫자 → null (FK 선택 필드 안전 변환)
function toBigIntOrNull(v: FormDataEntryValue | null): bigint | null {
  const s = (v as string | null)?.trim();
  if (!s || !/^\d+$/.test(s)) return null;
  return BigInt(s);
}

// "2026" → Int / 빈값 → null
function toIntOrNull(v: FormDataEntryValue | null): number | null {
  const s = (v as string | null)?.trim();
  if (!s || !/^\d+$/.test(s)) return null;
  return Number(s);
}

/**
 * 시상 추가/수정.
 * formData:
 *   id?         — 있으면 update
 *   series_id?  — tournament_series.id
 *   season_year?— 연도
 *   category    — 8종 화이트리스트(필수)
 *   user_id?    — 수상 선수
 *   team_id?    — 수상 팀
 *   comment?    — payload.comment
 *   quote?      — payload.quote (mvp_quote 용)
 *   display_order? — 정렬(올스타 5명)
 */
export async function upsertSeasonAwardAction(formData: FormData): Promise<void> {
  const session = await requireSuperAdmin();

  const idRaw = (formData.get("id") as string | null)?.trim() || null;
  const category = (formData.get("category") as string | null)?.trim() ?? "";

  // 카테고리 화이트리스트 검증 (8종 외 → 조용히 거부)
  if (!isSeasonAwardCategory(category)) return;

  const seriesId = toBigIntOrNull(formData.get("series_id"));
  const seasonYear = toIntOrNull(formData.get("season_year"));
  const userId = toBigIntOrNull(formData.get("user_id"));
  const teamId = toBigIntOrNull(formData.get("team_id"));
  const displayOrder = toIntOrNull(formData.get("display_order")) ?? 0;

  // 비정형 payload 조립 — 빈 값은 제외 (Json 노이즈 0)
  const comment = (formData.get("comment") as string | null)?.trim() || undefined;
  const quote = (formData.get("quote") as string | null)?.trim() || undefined;
  const payload: Record<string, string> = {};
  if (comment) payload.comment = comment;
  if (quote) payload.quote = quote;

  // 수상자(선수/팀)도 코멘트도 전부 비면 무의미 → 거부
  if (!userId && !teamId && Object.keys(payload).length === 0) return;

  if (idRaw) {
    // 수정
    await prisma.season_awards.update({
      where: { id: BigInt(idRaw) },
      data: {
        series_id: seriesId,
        season_year: seasonYear,
        category,
        user_id: userId,
        team_id: teamId,
        payload,
        display_order: displayOrder,
      },
    });
    await adminLog("season_award.update", "SeasonAward", {
      resourceId: idRaw,
      description: `시즌 시상 수정: ${category}`,
      changesMade: { category, series_id: seriesId?.toString() ?? null, user_id: userId?.toString() ?? null },
    });
  } else {
    // 추가
    const created = await prisma.season_awards.create({
      data: {
        series_id: seriesId,
        season_year: seasonYear,
        category,
        user_id: userId,
        team_id: teamId,
        payload,
        display_order: displayOrder,
        created_by: BigInt(session.sub),
      },
      select: { id: true },
    });
    await adminLog("season_award.create", "SeasonAward", {
      resourceId: created.id.toString(),
      description: `시즌 시상 추가: ${category}`,
      changesMade: { category, series_id: seriesId?.toString() ?? null, user_id: userId?.toString() ?? null },
    });
  }

  revalidatePath("/admin/season-awards");
}

/** 시상 삭제 */
export async function deleteSeasonAwardAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const id = (formData.get("id") as string | null)?.trim();
  if (!id || !/^\d+$/.test(id)) return;

  // 삭제 전 카테고리 조회 (로그용)
  const prev = await prisma.season_awards.findUnique({
    where: { id: BigInt(id) },
    select: { category: true },
  });

  await prisma.season_awards.delete({ where: { id: BigInt(id) } });

  await adminLog("season_award.delete", "SeasonAward", {
    resourceId: id,
    description: `시즌 시상 삭제: ${prev?.category ?? "?"}`,
  });

  revalidatePath("/admin/season-awards");
}
