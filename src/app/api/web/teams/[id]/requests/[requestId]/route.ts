import { z } from "zod";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { apiSuccess, apiError } from "@/lib/api/response";
import type { Prisma } from "@prisma/client";
// Phase 4 PR13 — requestType 별 권한 매핑 (jersey_change → jerseyChangeApprove 등)
import { hasTeamOfficerPermission, type TeamOfficerPermission } from "@/lib/team-members/permissions";

// ─────────────────────────────────────────────────────────────────────────────
// 2026-05-05 Phase 2 PR6 — 팀 멤버 신청 승인/거부 (단건 PATCH)
// ─────────────────────────────────────────────────────────────────────────────
// 이유(왜): 팀장/매니저가 pending 신청을 approve/reject 처리. PR6 = 인프라만, type 별
//   실제 동작 (jersey UPDATE / dormant 상태전환 / withdraw 명단삭제) 은 PR7+ dispatcher 에서.
// dispatcher 패턴: action='approve' 시 switch(requestType) 으로 분기 — PR6 은 placeholder TODO.
// 모든 처리는 history INSERT 로 이력 보존 (탈퇴 후에도 영구).
// 권한: captain (team.captainId) 또는 manager (team_members.role='manager' AND status='active')
//   Phase 4 PR12 에서 team_officer_permissions 통합 — 본 PR6 은 captain + manager 한정.
// ─────────────────────────────────────────────────────────────────────────────

type RouteCtx = { params: Promise<{ id: string; requestId: string }> };

const PatchBodySchema = z.object({
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().trim().max(500).optional(),
});

export const PATCH = withWebAuth(async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id, requestId } = await routeCtx.params;

  let teamId: bigint;
  let reqId: bigint;
  try {
    teamId = BigInt(id);
    reqId = BigInt(requestId);
  } catch {
    return apiError("ID 값이 올바르지 않습니다.", 400, "INVALID_ID");
  }

  // body 파싱
  let bodyRaw: unknown;
  try {
    bodyRaw = await req.json();
  } catch {
    return apiError("요청 데이터를 읽을 수 없습니다.", 400, "INVALID_JSON");
  }
  const parsed = PatchBodySchema.safeParse(bodyRaw);
  if (!parsed.success) {
    return apiError(
      `요청 데이터가 올바르지 않습니다: ${parsed.error.issues.map((i) => i.message).join(", ")}`,
      400,
      "INVALID_PAYLOAD",
    );
  }
  const { action, rejectionReason } = parsed.data;

  // 신청 조회 + 팀 일치 확인
  const memberRequest = await prisma.teamMemberRequest.findUnique({
    where: { id: reqId },
    include: {
      team: { select: { id: true, captainId: true, name: true } },
      user: { select: { id: true, nickname: true, name: true } },
    },
  });
  if (!memberRequest || memberRequest.teamId !== teamId) {
    return apiError("신청을 찾을 수 없습니다.", 404, "NOT_FOUND");
  }
  if (memberRequest.status !== "pending") {
    return apiError("이미 처리된 신청입니다.", 409, "ALREADY_PROCESSED");
  }

  // 권한 검증 — PR13: captain (자동) 또는 requestType 별 위임 권한 보유자
  // 이유(왜): PR12 운영진 권한 위임 인프라 — captain 만 위임 가능, 위임받은 자는
  //   permissions JSON 의 해당 키 true 시 처리 가능. captain + manager 직접 검증 →
  //   hasTeamOfficerPermission 단일 진입점으로 교체.
  const PERMISSION_BY_TYPE: Record<string, TeamOfficerPermission> = {
    jersey_change: "jerseyChangeApprove",
    dormant: "dormantApprove",
    withdraw: "withdrawApprove",
  };
  const requiredPermission = PERMISSION_BY_TYPE[memberRequest.requestType];
  if (!requiredPermission) {
    return apiError(`알 수 없는 신청 유형: ${memberRequest.requestType}`, 400, "INVALID_REQUEST_TYPE");
  }
  const allowed = await hasTeamOfficerPermission(teamId, ctx.userId, requiredPermission);
  if (!allowed) {
    const labelByType: Record<string, string> = {
      jersey_change: "번호 변경 승인",
      dormant: "휴면 승인",
      withdraw: "탈퇴 승인",
    };
    return apiError(
      `팀장 또는 ${labelByType[memberRequest.requestType] ?? "해당"} 권한을 위임받은 운영진만 처리할 수 있습니다.`,
      403,
      "FORBIDDEN",
    );
  }

  // 거부 사유 정리
  const rejectionReasonClean =
    action === "reject" && rejectionReason ? rejectionReason : null;

  const now = new Date();
  const newStatus = action === "approve" ? "approved" : "rejected";

  // ─────────────────────────────────────────────────────
  // dispatcher (PR7 jersey_change / PR8 dormant / PR9 withdraw 모두 활성화)
  // ─────────────────────────────────────────────────────
  // 이유(왜): approve 시점에 type 별 실제 동작을 수행. status UPDATE + history INSERT
  //   와 함께 같은 prisma.$transaction 으로 묶어 일관성 보장.
  // jersey_change 경우 사전 검증(POST 시점)은 통과했어도 그 사이에 다른 멤버가 같은
  //   번호를 사용했을 수 있으므로 **승인 시점 재충돌 검증** 필수.
  // ⚠ ttp.jerseyNumber 자동 sync 는 의도적으로 제외 (옵션 C+UI = historical 보존).
  //   미래 대회 신청부터 PR3 의 자동 복사 hook 으로 새 번호가 적용된다.
  // PR8 dormant: team_members.status='dormant' UPDATE — 미묘 룰 #6 status 컬럼 값만 추가
  //   (신규 컬럼 0). until/oldJersey/oldPosition 등 부가 정보는 history.payload 보존.
  // PR9 withdraw: team_members.status='withdrawn' UPDATE — 명단 완전 삭제 X (Phase 5
  //   에서 옵션화). prevStatus / prevJersey / prevPosition history 보존.
  let oldJersey: number | null = null;
  let newJersey: number | null = null;
  // PR8/PR9 — 본인 active row 정보 (history.payload 박제용)
  let prevMemberStatus: string | null = null;
  let prevMemberJersey: number | null = null;
  let prevMemberPosition: string | null = null;
  let dormantUntil: string | null = null; // PR8 — payload.until ISO 보존
  if (action === "approve" && memberRequest.requestType === "jersey_change") {
    // payload 에서 newJersey 추출 (POST 시 zod 로 0~99 정수 보장됨)
    const payload = memberRequest.payload as { newJersey?: number } | null;
    if (!payload || typeof payload.newJersey !== "number") {
      return apiError("신청 데이터가 손상되었습니다.", 400, "INVALID_PAYLOAD");
    }
    newJersey = payload.newJersey;

    // 신청자의 현재 active 멤버 row 조회 (oldJersey 기록 + UPDATE 대상 식별)
    const myActive = await prisma.teamMember.findFirst({
      where: { teamId, userId: memberRequest.userId, status: "active" },
      select: { id: true, jerseyNumber: true },
    });
    if (!myActive) {
      // 신청자가 그 사이 탈퇴했거나 휴면 처리된 경우
      return apiError(
        "신청자가 더 이상 활성 멤버가 아닙니다.",
        409,
        "APPLICANT_NOT_ACTIVE",
      );
    }
    oldJersey = myActive.jerseyNumber ?? null;

    // 재충돌 검증 — 같은 팀 active 멤버 중 새 번호 사용자가 신청자 본인이 아니어야 함
    const conflict = await prisma.teamMember.findFirst({
      where: {
        teamId,
        jerseyNumber: newJersey,
        status: "active",
        NOT: { userId: memberRequest.userId },
      },
      select: { id: true },
    });
    if (conflict) {
      return apiError(
        `등번호 #${newJersey} 가 이미 사용 중입니다. 신청자에게 다른 번호를 신청하도록 안내해 주세요.`,
        409,
        "JERSEY_CONFLICT",
      );
    }
    // ⚠ 실제 UPDATE 는 아래 트랜잭션에서 status UPDATE/history INSERT 와 함께 수행.
  } else if (
    action === "approve" &&
    (memberRequest.requestType === "dormant" || memberRequest.requestType === "withdraw")
  ) {
    // 이유: 본인 active row 가 존재해야 status 전이 가능. jersey/position 은 history
    //   에 박제해 추후 복귀 시점에 시야 회복 (현재는 status 만 변경 — 미묘 룰 #6).
    const myActive = await prisma.teamMember.findFirst({
      where: { teamId, userId: memberRequest.userId, status: "active" },
      select: { id: true, status: true, jerseyNumber: true, position: true },
    });
    if (!myActive) {
      // 신청자가 그 사이 다른 흐름으로 active 가 아닌 경우 (예: 휴면 또는 강퇴)
      return apiError(
        "신청자가 더 이상 활성 멤버가 아닙니다.",
        409,
        "APPLICANT_NOT_ACTIVE",
      );
    }
    prevMemberStatus = myActive.status ?? "active";
    prevMemberJersey = myActive.jerseyNumber ?? null;
    prevMemberPosition = myActive.position ?? null;

    // PR8 dormant — payload.until 보존 (POST 시점에 +3개월 기본값으로 채워져 있음)
    if (memberRequest.requestType === "dormant") {
      const payload = memberRequest.payload as { until?: string } | null;
      if (payload && typeof payload.until === "string") {
        const d = new Date(payload.until);
        if (!Number.isNaN(d.getTime())) {
          dormantUntil = d.toISOString();
        }
      }
      // until 이 손상되어도 신청 자체는 진행 (lazy 복구 hook 이 until 없는 row 는 그대로 유지)
    }
  }

  // request 상태 UPDATE + history INSERT (+ jersey_change approve 시 team_members UPDATE) 트랜잭션
  // 이유(왜): jersey_change approve 분기 활성화 — status/history/team_members 3 작업을
  //   하나의 트랜잭션으로 묶어 부분 실패 시 일관성 보장 (request 만 approved 인데
  //   team_members.jersey_number 미반영 같은 사일런트 분기 방지).
  // history.eventType 명명 (보고서 §3):
  //   - reject 시: '{requestType}_rejected' (예: jersey_change_rejected / dormant_rejected / withdraw_rejected)
  //   - approve 시 분기:
  //       jersey_change → 'jersey_changed'
  //       dormant       → 'dormant'      (PR8)
  //       withdraw      → 'withdrawn'    (PR9)
  let eventType: string;
  if (action !== "approve") {
    eventType = `${memberRequest.requestType}_${newStatus}`;
  } else if (memberRequest.requestType === "jersey_change") {
    eventType = "jersey_changed";
  } else if (memberRequest.requestType === "dormant") {
    eventType = "dormant";
  } else if (memberRequest.requestType === "withdraw") {
    eventType = "withdrawn";
  } else {
    eventType = `${memberRequest.requestType}_${newStatus}`;
  }

  // history payload 분기 — type 별 박제 정보 차등
  // jersey_change approve: 보고서 §3 형식 ({old, new, reason})
  // dormant approve: {until, reason, prevStatus} (PR8)
  // withdraw approve: {reason, prevStatus, prevJersey, prevPosition} (PR9 — 복귀 시 시야 회복)
  // 그 외 (reject 모두): PR6 기존 형식 유지
  let historyPayload: Prisma.InputJsonValue;
  if (action === "approve" && memberRequest.requestType === "jersey_change") {
    historyPayload = {
      requestId: memberRequest.id.toString(),
      requestType: memberRequest.requestType,
      old: oldJersey, // 변경 전 번호 (null 가능 — 미배정 상태)
      new: newJersey, // 변경 후 번호 (재충돌 검증 통과)
      reason: memberRequest.reason ?? null,
    };
  } else if (action === "approve" && memberRequest.requestType === "dormant") {
    historyPayload = {
      requestId: memberRequest.id.toString(),
      requestType: memberRequest.requestType,
      until: dormantUntil, // ISO 또는 null (손상 시)
      reason: memberRequest.reason ?? null,
      prevStatus: prevMemberStatus ?? "active",
    };
  } else if (action === "approve" && memberRequest.requestType === "withdraw") {
    historyPayload = {
      requestId: memberRequest.id.toString(),
      requestType: memberRequest.requestType,
      reason: memberRequest.reason ?? null,
      prevStatus: prevMemberStatus ?? "active",
      prevJersey: prevMemberJersey, // 복귀 시 시야 회복용 (재가입 신청 시점에 참고)
      prevPosition: prevMemberPosition,
    };
  } else {
    historyPayload = {
      requestId: memberRequest.id.toString(),
      requestType: memberRequest.requestType,
      requestPayload: memberRequest.payload as Prisma.InputJsonValue,
      oldStatus: "pending",
      newStatus,
      ...(rejectionReasonClean && { rejectionReason: rejectionReasonClean }),
    };
  }

  // 트랜잭션 작업 배열 — jersey_change approve 시에만 team_members UPDATE 추가
  // 이유: prisma.$transaction 은 동일 batch 내 작업 모두 성공 or 모두 롤백 보장.
  const txOps: Prisma.PrismaPromise<unknown>[] = [
    prisma.teamMemberRequest.update({
      where: { id: reqId },
      data: {
        status: newStatus,
        processedById: ctx.userId,
        processedAt: now,
        rejectionReason: rejectionReasonClean,
      },
      select: {
        id: true,
        requestType: true,
        status: true,
        processedAt: true,
      },
    }),
    prisma.teamMemberHistory.create({
      data: {
        teamId,
        userId: memberRequest.userId,
        eventType,
        payload: historyPayload,
        reason: memberRequest.reason ?? null,
        createdById: ctx.userId,
      },
    }),
  ];

  // jersey_change approve — team_members.jersey_number UPDATE 추가
  if (action === "approve" && memberRequest.requestType === "jersey_change" && newJersey !== null) {
    txOps.push(
      prisma.teamMember.updateMany({
        // 이유: updateMany 사용 — (teamId, userId, status='active') 복합 조건 매칭.
        //   team_members.id 단일키 UPDATE 를 쓰려면 위에서 myActive.id 로 조회해뒀지만,
        //   updateMany 가 status 보호 + 중복 row 방지 (가능성 낮지만 안전망)
        where: { teamId, userId: memberRequest.userId, status: "active" },
        data: { jerseyNumber: newJersey },
      }),
    );
  }

  // PR8 dormant approve — team_members.status='dormant' UPDATE
  // 이유: 미묘 룰 #6 — status 컬럼 값만 추가 (신규 컬럼 0). until 은 history.payload 박제.
  // lazy 복구 hook (`checkAndExpireDormant`) 이 본인 SSR 시점에 until < now 자동 active 복귀.
  if (action === "approve" && memberRequest.requestType === "dormant") {
    txOps.push(
      prisma.teamMember.updateMany({
        where: { teamId, userId: memberRequest.userId, status: "active" },
        data: { status: "dormant" },
      }),
    );
  }

  // PR9 withdraw approve — team_members.status='withdrawn' UPDATE
  // 이유: 명단 완전 삭제 X (Phase 5 옵션). status='withdrawn' = roster 자동 제외 (active 필터),
  //   history 영구 보존 → 활동 기록/통계 회귀 0. 재가입은 별도 가입 신청 흐름으로.
  if (action === "approve" && memberRequest.requestType === "withdraw") {
    txOps.push(
      prisma.teamMember.updateMany({
        where: { teamId, userId: memberRequest.userId, status: "active" },
        data: { status: "withdrawn" },
      }),
    );
  }

  const txResults = await prisma.$transaction(txOps);
  // 첫 번째 결과 = teamMemberRequest.update — select 한 필드 반환
  const updated = txResults[0] as {
    id: bigint;
    requestType: string;
    status: string;
    processedAt: Date | null;
  };

  // 신청자에게 결과 알림
  const typeLabel =
    memberRequest.requestType === "jersey_change"
      ? "번호 변경"
      : memberRequest.requestType === "dormant"
      ? "휴면"
      : "탈퇴";
  const teamName = memberRequest.team.name ?? "팀";

  createNotification({
    userId: memberRequest.userId,
    notificationType:
      action === "approve"
        ? NOTIFICATION_TYPES.TEAM_MEMBER_REQUEST_APPROVED
        : NOTIFICATION_TYPES.TEAM_MEMBER_REQUEST_REJECTED,
    title:
      action === "approve"
        ? `[${teamName}] ${typeLabel} 신청 승인`
        : `[${teamName}] ${typeLabel} 신청 거부`,
    content:
      action === "approve"
        ? `${typeLabel} 신청이 승인되었습니다.`
        : rejectionReasonClean
        ? `${typeLabel} 신청이 거부되었습니다. 사유: ${rejectionReasonClean}`
        : `${typeLabel} 신청이 거부되었습니다.`,
    actionUrl: `/teams/${teamId}`,
    notifiableType: "team_member_request",
    notifiableId: memberRequest.id,
  }).catch(() => {});

  return apiSuccess({
    request: {
      id: updated.id.toString(),
      requestType: updated.requestType,
      status: updated.status,
      processedAt: updated.processedAt?.toISOString() ?? null,
    },
  });
});
