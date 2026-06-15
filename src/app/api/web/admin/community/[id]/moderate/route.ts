/**
 * POST /api/web/admin/community/[id]/moderate — 커뮤니티 글 숨김/복원 (S1, 관리자 전용)
 *
 * body: { action: "hide" | "restore", reason?: string }
 *
 * - hide    : community_posts.status → hidden    (노출 차단)
 * - restore : community_posts.status → published (복원)
 *
 * 기존 community 라우트에 admin 의 status 변경(모더레이션) 지원이 없음을 실측 → 신규 라우트.
 *
 * 가드: getWebSession + isSuperAdmin → 비통과 403.
 * 검증: Zod (action 화이트리스트 + reason 옵션).
 * 감사: adminLog("community.hide" | "community.restore", ...). reason 은 changesMade 에 박제.
 *
 * apiSuccess 는 응답 키 자동 snake_case 변환 (errors.md 2026-04-17).
 * schema 변경 0 / api/v1 미접촉 / status update 외 부수효과 0.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { adminLog } from "@/lib/admin/log";

type RouteCtx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  action: z.enum(["hide", "restore"]),
  reason: z.string().trim().max(2000).optional(),
});

// action → community_posts.status 매핑
const STATUS_BY_ACTION: Record<"hide" | "restore", string> = {
  hide: "hidden",
  restore: "published",
};

export async function POST(req: NextRequest, { params }: RouteCtx) {
  // ── super_admin 가드(콘솔 표준) ──
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    return apiError("super_admin 권한이 필요합니다", 403, "FORBIDDEN");
  }

  const { id } = await params;
  const postId = BigInt(id);

  // ── Zod 검증 ──
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return apiError("요청 값이 올바르지 않습니다", 400, "VALIDATION_ERROR");
  }
  const { action, reason } = parsed.data;

  // ── 대상 존재 확인 ──
  const post = await prisma.community_posts.findUnique({
    where: { id: postId },
    select: { id: true, status: true, title: true },
  });
  if (!post) {
    return apiError("존재하지 않는 게시글입니다", 404, "NOT_FOUND");
  }

  const nextStatus = STATUS_BY_ACTION[action];

  // ── status 전환 ──
  await prisma.community_posts.update({
    where: { id: postId },
    data: { status: nextStatus },
  });

  // ── 감사 로그(reason → changesMade) ──
  await adminLog(`community.${action}`, "CommunityPost", {
    resourceId: post.id.toString(),
    description: `커뮤니티 글 ${action === "hide" ? "숨김" : "복원"}: ${post.title ?? `#${post.id}`}`,
    changesMade: { status: nextStatus, reason: reason ?? null },
  });

  return apiSuccess({ id: post.id.toString(), status: nextStatus });
}
