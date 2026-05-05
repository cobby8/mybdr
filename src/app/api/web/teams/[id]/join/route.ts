import { z } from "zod";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { apiSuccess, apiError } from "@/lib/api/response";
import { mergeTempMember } from "@/lib/teams/merge-temp-member";

type RouteCtx = { params: Promise<{ id: string }> };

// 이유(왜): PR2 — 가입 신청 시 선호 등번호/포지션을 받아 team_join_requests 에 저장.
//   승인 단계에서 jerseyNumber 자동 복사. body 가 없거나 빈 객체여도 호환 유지.
const JoinBodySchema = z.object({
  // 0~99 등번호 표준 (Phase 1 PR1 captain 검증과 동일 범위)
  preferred_jersey_number: z.number().int().min(0).max(99).nullable().optional(),
  // position: 자유 텍스트 (PG/SG/SF/PF/C 등) — 길이 상한 20자
  preferred_position: z.string().trim().max(20).nullable().optional(),
});

export const POST = withWebAuth(async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;

  try {
    const teamId = BigInt(id);

    // body 파싱 — 빈 body 호환 (기존 클라이언트 회귀 0)
    let bodyRaw: unknown = {};
    try {
      bodyRaw = await req.json();
    } catch {
      bodyRaw = {};
    }
    const parsed = JoinBodySchema.safeParse(bodyRaw);
    if (!parsed.success) {
      return apiError("등번호는 0~99, 포지션은 20자 이내로 입력해 주세요.", 400);
    }
    const preferredJersey = parsed.data.preferred_jersey_number ?? null;
    const preferredPosition = parsed.data.preferred_position?.trim() || null;

    // 이미 가입 요청했는지 확인
    const existingRequest = await prisma.team_join_requests.findFirst({
      where: { team_id: teamId, user_id: ctx.userId, status: "pending" },
    });
    if (existingRequest) {
      return apiError("이미 가입 신청한 팀입니다.", 409);
    }

    // 이미 멤버인지 확인
    const existingMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: ctx.userId } },
    });
    if (existingMember) {
      return apiError("이미 팀 멤버입니다.", 409);
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return apiError("팀을 찾을 수 없습니다.", 404);

    if (team.auto_accept_members) {
      // 사전 등록 계정 병합: 같은 닉네임 + 미로그인 멤버가 있으면 등번호/포지션/역할 이관
      const merged = await mergeTempMember(teamId, ctx.userId);

      // 자동 수락 흐름에서도 jersey 충돌 사전 검증
      // 이유: 자동 수락 팀은 승인 단계가 없어 충돌 차단을 여기서 처리해야 함.
      // merged 가 있으면 그 값을 우선. 없으면 사용자가 보낸 preferredJersey 검증.
      let finalJersey: number | null = merged?.jerseyNumber ?? null;
      let finalPosition: string | null = merged?.position ?? null;

      if (!merged && preferredJersey != null) {
        const conflict = await prisma.teamMember.findFirst({
          where: { teamId, jerseyNumber: preferredJersey, status: "active" },
        });
        if (conflict) {
          return apiError(
            `등번호 #${preferredJersey} 는 이미 사용 중입니다. 다른 번호로 신청해 주세요.`,
            409,
          );
        }
        finalJersey = preferredJersey;
        finalPosition = preferredPosition;
      }

      // 자동 수락
      await prisma.teamMember.create({
        data: {
          teamId,
          userId: ctx.userId,
          role: merged?.role ?? "member",
          status: "active",
          joined_at: new Date(),
          ...(finalJersey != null && { jerseyNumber: finalJersey }),
          ...(finalPosition && { position: finalPosition }),
        },
      });
      await prisma.team.update({
        where: { id: teamId },
        data: { members_count: { increment: 1 } },
      });
      return apiSuccess({
        success: true,
        message: merged
          ? `팀에 가입되었습니다. (등번호 #${merged.jerseyNumber}, 포지션 ${merged.position} 자동 배정)`
          : finalJersey != null
            ? `팀에 가입되었습니다. (등번호 #${finalJersey} 배정)`
            : "팀에 가입되었습니다.",
      });
    }

    // 가입 신청 (preferred_jersey_number / preferred_position 함께 저장)
    await prisma.team_join_requests.create({
      data: {
        team_id: teamId,
        user_id: ctx.userId,
        status: "pending",
        // PR2: 선호 등번호/포지션 — 승인 단계에서 자동 복사
        preferred_jersey_number: preferredJersey,
        preferred_position: preferredPosition,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // 팀장(captain)에게 가입 신청 알림 발송 (fire-and-forget)
    const captain = await prisma.teamMember.findFirst({
      where: { teamId, role: "captain" },
    });
    if (captain) {
      // 신청자 닉네임 조회
      const applicant = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { nickname: true },
      });

      createNotification({
        userId: captain.userId,
        notificationType: NOTIFICATION_TYPES.TEAM_JOIN_REQUEST_RECEIVED,
        title: "새 팀 가입 신청",
        content: `${applicant?.nickname ?? "사용자"}님이 "${team.name}" 팀에 가입 신청했습니다.`,
        // 팀장이 알림 클릭 시 곧장 가입 신청 탭으로 진입 (manage 페이지 useSearchParams 처리됨)
        actionUrl: `/teams/${team.id}/manage?tab=requests`,
        metadata: {
          team: {
            id: team.id.toString(),
            name: team.name,
          },
          applicant: {
            id: ctx.userId.toString(),
            nickname: applicant?.nickname ?? null,
          },
        },
      }).catch(() => {});
    }

    return apiSuccess({ success: true, message: "가입 신청이 완료되었습니다. 승인을 기다려 주세요." });
  } catch {
    return apiError("가입 신청 중 오류가 발생했습니다.", 500);
  }
});
