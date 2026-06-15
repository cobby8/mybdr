/**
 * POST /api/web/admin/teams/[id]/review — Admin Console S1-4 팀 검수 처리
 *
 * 왜 (이유):
 * - 신규 팀은 pending_review 상태로 생성된다(actions/teams). 운영자가 검수해
 *   공개(active)하거나 반려(rejected)할 처리 엔드포인트가 필요하다.
 * - S2 통합 인박스 디스패처(inbox/[id]/resolve)가 teams 도메인을 본 라우트로 위임한다.
 *
 * 어떻게:
 * - 세션 + super_admin 통합 가드(getWebSession + isSuperAdmin) → 비통과 403.
 * - Zod body 화이트리스트 {action: approve|reject, reason?}.
 * - pending_review 상태인 팀만 처리(중복/오처리 방어) → approve=active / reject=rejected.
 * - 응답은 apiSuccess() 경유 → 키 자동 snake_case 변환 (errors.md 2026-04-17).
 *
 * 제약:
 * - schema 변경 0 (Team.status 문자열 컬럼 그대로). api/v1 미접촉.
 * - reason 은 teams 에 전용 컬럼이 없으므로 adminLog.changesMade 에만 박제(감사 추적).
 * - 기존 active 팀(소급 데이터)은 pending_review 가 아니므로 본 라우트에서 INVALID_STATE.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { adminLog } from "@/lib/admin/log";
import { TEAM_STATUS } from "@/lib/constants/team-status";

type RouteCtx = { params: Promise<{ id: string }> };

// 검수 액션 화이트리스트. reason 은 선택(반려 사유 등 감사 로그용).
const reviewBody = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(2000).optional(),
});

export async function POST(req: NextRequest, { params }: RouteCtx) {
  // ── super_admin 통합 가드(콘솔 표준) ──
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    return apiError("super_admin 권한이 필요합니다", 403, "FORBIDDEN");
  }

  // ── 팀 id(BigInt PK) 변환 ──
  const { id } = await params;
  let teamId: bigint;
  try {
    teamId = BigInt(id);
  } catch {
    return apiError("잘못된 팀 식별자입니다", 400, "BAD_ITEM_ID");
  }

  // ── body 파싱 ──
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }
  const parsed = reviewBody.safeParse(raw);
  if (!parsed.success) {
    return apiError("요청 값이 올바르지 않습니다", 400, "VALIDATION_ERROR");
  }
  const { action, reason } = parsed.data;
  const trimmedReason = reason?.trim() || null;

  // ── pending_review 상태인 팀만 처리(중복/오처리 방어) ──
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, status: true, name: true },
  });
  if (!team) {
    return apiError("존재하지 않는 팀입니다", 404, "NOT_FOUND");
  }
  if (team.status !== TEAM_STATUS.PENDING_REVIEW) {
    return apiError(
      `이미 ${team.status ?? "none"} 상태인 팀입니다`,
      400,
      "INVALID_STATE",
    );
  }

  // approve → active(공개) / reject → rejected.
  const nextStatus =
    action === "approve" ? TEAM_STATUS.ACTIVE : TEAM_STATUS.REJECTED;

  await prisma.team.update({
    where: { id: teamId },
    data: { status: nextStatus },
  });

  // reason 은 teams 전용 컬럼 부재 → adminLog.changesMade 에만 박제.
  await adminLog(`team.${action}`, "Team", {
    resourceId: team.id.toString(),
    description: `팀 ${action === "approve" ? "승인" : "반려"}: ${team.name}`,
    changesMade: { status: nextStatus, reason: trimmedReason },
  });

  return apiSuccess({ id: team.id.toString(), status: nextStatus });
}
