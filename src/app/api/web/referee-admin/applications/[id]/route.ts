import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import type { NextRequest } from "next/server";
// 승인 시 선정된 심판 본인에게 알림 발송 — 헬퍼 내부 try/catch
import { notifyPoolSelected } from "@/lib/notifications/referee-events";
// 헬스체크 봇의 쓰기 작업 차단 가드
import { requireNotBot } from "@/lib/healthcheck/is-bot";

/**
 * /api/web/referee-admin/applications/[id]
 *
 * PATCH — 배정 신청 승인(approve) / 거절(reject)
 *
 * 이유: "신청 관리" inbox 에서 신청 단위로 한 번에 승인/거절한다.
 *       승인 = 신청한 일자 전부를 일자별 선정 풀(DailyAssignmentPool)로 자동 연동
 *       (공고 상세의 일자별 선정과 결과적으로 같은 풀에 쌓임 — 결정: 두 경로 공존).
 *
 * 결정 사항:
 *   - 승인=풀 선정 연동 (신청 일자 전부 → createMany skipDuplicates, 역할=공고 role_type)
 *   - R2: 승인→거절 전환 시 이미 생성된 풀은 삭제하지 않음 (status 만 전환)
 *   - R3: 거절 알림 생략
 *
 * 보안:
 *   - getAssociationAdmin() + requirePermission("assignment_manage") + requireNotBot
 *   - IDOR: 신청 → 공고.association_id === admin.associationId 아니면 403
 *   - 풀 생성 시 association_id 는 세션값 강제 (다른 협회 오염 차단)
 */

export const dynamic = "force-dynamic";

// ── Zod: PATCH body ──
// action 필수. memo 는 선택(승인 시 풀 메모로 전달).
const patchSchema = z.object({
  action: z.enum(["approve", "reject"]),
  memo: z.string().max(1000).optional().nullable(),
});

// id(BigInt) 파서
function parseId(raw: string): bigint | null {
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1) 권한 — 승인/거절은 팀장급 이상(assignment_manage)
  const admin = await getAssociationAdmin();
  if (!admin) return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  const denied = requirePermission(admin.role, "assignment_manage");
  if (denied) return denied;

  // 1-1) 봇 방어 — 헬스체크 봇 계정은 쓰기 차단
  const botCheck = await requireNotBot(admin.userId);
  if (botCheck) return botCheck.error;

  // 2) id 파싱
  const { id: idRaw } = await params;
  const id = parseId(idRaw);
  if (id === null) return apiError("유효하지 않은 id입니다.", 400, "BAD_REQUEST");

  // 3) body 파싱 + 검증
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error.issues);
  const { action, memo } = parsed.data;

  try {
    // 4) 신청 + 공고(스코프 키/풀 조립용) + 신청 일자 조회
    const application = await prisma.assignmentApplication.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        referee_id: true,
        announcement: {
          select: {
            association_id: true,
            tournament_id: true,
            role_type: true,
          },
        },
        dates: { select: { date: true } },
      },
    });
    if (!application) {
      return apiError("신청을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    // 4-1) IDOR — 다른 협회 공고에 달린 신청은 처리 불가
    if (application.announcement.association_id !== admin.associationId) {
      return apiError(
        "다른 협회 신청은 처리할 수 없습니다.",
        403,
        "FORBIDDEN"
      );
    }

    // ── 거절(reject) ──
    if (action === "reject") {
      // 이미 거절된 신청을 또 거절 = 충돌(409)
      if (application.status === "rejected") {
        return apiError("이미 거절된 신청입니다.", 409, "ALREADY_REJECTED");
      }
      // R2: 풀은 삭제하지 않고 상태만 거절로 전환. R3: 알림 없음.
      await prisma.assignmentApplication.update({
        where: { id },
        data: { status: "rejected" },
      });
      return apiSuccess({
        application: { id: application.id, status: "rejected" },
        pools_created: 0,
      });
    }

    // ── 승인(approve) ──
    // 신청 일자가 0개면 풀로 내릴 대상이 없음 → 데이터 정합 오류로 차단.
    if (application.dates.length === 0) {
      return apiError(
        "신청한 일자가 없어 승인할 수 없습니다.",
        400,
        "NO_DATES"
      );
    }

    const { tournament_id, role_type } = application.announcement;

    // 5) 신청 일자 전부 → 일자별 선정 풀로 생성.
    //    unique(tournament_id+date+referee_id+role_type) 충돌은 skipDuplicates 로 멱등 처리
    //    → 이미 일자별 선정에서 뽑힌 경우/재승인 시에도 안전.
    //    association_id 는 세션값 강제(IDOR), selected_by = 처리한 관리자.
    const created = await prisma.dailyAssignmentPool.createMany({
      data: application.dates.map((d) => ({
        tournament_id,
        association_id: admin.associationId, // ★ 세션 강제
        date: d.date,
        referee_id: application.referee_id,
        role_type, // ★ 공고의 역할 유형
        is_chief: false,
        selected_by: admin.userId,
        memo: memo ?? null,
      })),
      skipDuplicates: true,
    });

    // 6) 신청 상태 = 승인 (이미 approved 여도 멱등 — 위 createMany 가 보강 역할)
    await prisma.assignmentApplication.update({
      where: { id },
      data: { status: "approved" },
    });

    // 7) 알림 — 선정된 심판에게 일자별로 발송 (헬퍼는 단일 date 단위)
    const tournamentInfo = await prisma.tournament.findUnique({
      where: { id: tournament_id },
      select: { name: true },
    });
    const tournamentName = tournamentInfo?.name ?? "대회";
    for (const d of application.dates) {
      await notifyPoolSelected([application.referee_id], {
        tournament_name: tournamentName,
        date: d.date,
        role_type,
      });
    }

    return apiSuccess({
      application: { id: application.id, status: "approved" },
      pools_created: created.count,
    });
  } catch (error) {
    console.error("[referee-admin/applications/:id] PATCH 실패:", error);
    return apiError("신청 처리에 실패했습니다.", 500, "INTERNAL_ERROR");
  }
}
