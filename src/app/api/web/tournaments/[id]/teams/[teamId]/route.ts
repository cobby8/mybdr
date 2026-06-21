import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { apiSuccess, apiError } from "@/lib/api/response";

type Ctx = { params: Promise<{ id: string; teamId: string }> };

// PATCH /api/web/tournaments/[id]/teams/[teamId]
// 팀 상태 변경: pending → approved / rejected, 시드 배정
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, teamId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  // TC-NEW-005: BigInt 변환 실패 방지
  const teamBigInt = parseBigIntParam(teamId);
  if (teamBigInt === null) {
    return apiError("팀을 찾을 수 없습니다.", 404);
  }

  const tt = await prisma.tournamentTeam.findFirst({
    where: { id: teamBigInt, tournamentId: id },
  });
  if (!tt)
    return apiError("팀을 찾을 수 없습니다.", 404);

  const { status, seedNumber, groupName, division, paymentStatus, payment_status } =
    body as Record<string, string | number | null | undefined>;

  // TC-NEW-006: 시드 번호 범위 검증
  if (seedNumber !== undefined && seedNumber !== null) {
    const n = Number(seedNumber);
    if (!Number.isInteger(n) || n < 1) {
      return apiError("시드 번호는 1 이상의 정수여야 합니다.", 400);
    }
  }

  // Track B-a: payment_status 수용 (snake/camel 양쪽 키 허용 — 클라가 어떤 표기로 보내도 인식).
  //   값집합 = unpaid / paid / refunded (schema default unpaid). 그 외 값은 400.
  const rawPayment = payment_status ?? paymentStatus;
  const ALLOWED_PAYMENT = ["unpaid", "paid", "refunded"] as const;
  let nextPayment: string | undefined;
  if (rawPayment !== undefined && rawPayment !== null) {
    const p = String(rawPayment);
    if (!ALLOWED_PAYMENT.includes(p as (typeof ALLOWED_PAYMENT)[number])) {
      return apiError("납부 상태 값이 올바르지 않습니다.", 400);
    }
    nextPayment = p;
  }

  const wasApproved = tt.status === "approved";
  const nowApproved = status === "approved";
  const nowRejected = status === "rejected";

  // ── Track B-a: 입금→자동확정 트리거 판정 ────────────────────────────────
  // 이유(왜): 운영자가 입금 확인 후 payment_status="paid"만 바꿔도 자동으로 승인 처리되게 한다.
  //   단, 정원 초과 팀이 자동 승격되면 안 되므로 join 신청과 동일한 div_caps 정원 가드를 적용한다.
  // 조건: paid 수신 + 현재 status가 pending/waiting (이미 approved면 자동승격 불필요).
  //   status를 명시적으로 바꾸는 요청(status 키 동봉)이 오면 그 요청을 우선하고 자동승격은 건너뛴다.
  const wantsAutoPromote =
    nextPayment === "paid" &&
    status === undefined &&
    (tt.status === "pending" || tt.status === "waiting");

  // 정원 가드: div_caps[division] 대비 현재 approved 수가 cap 미만일 때만 승격 허용.
  //   cap 미설정(또는 division 없음)이면 무제한 승격(기존 정책 — join/route.ts와 동일).
  let promoted = false;
  let promoteReason: string | null = null;
  if (wantsAutoPromote) {
    const divCaps = (await prisma.tournament.findUnique({
      where: { id },
      select: { div_caps: true },
    }))?.div_caps as Record<string, number> | null;
    const cap = tt.division ? divCaps?.[tt.division] : undefined;

    if (cap) {
      // 현재 승인된(approved) 팀 수만 카운트 — 자기 자신은 아직 pending/waiting이라 미포함.
      const approvedCount = await prisma.tournamentTeam.count({
        where: { tournamentId: id, division: tt.division, status: "approved" },
      });
      if (approvedCount < cap) {
        promoted = true;
      } else {
        // 정원 초과 → 승격 보류. payment만 paid로 반영하고 status는 유지한다.
        promoteReason = "division_full";
      }
    } else {
      // cap 미설정 → 무제한 승격.
      promoted = true;
    }
  }

  // TC-NEW-007 / B-a: 팀 업데이트 + payment + status + teams_count 동기화를 단일 트랜잭션으로 처리.
  const updated = await prisma.$transaction(async (tx) => {
    // 명시적 status 변경(승인 시) 또는 자동승격으로 approved가 되는지 통합 판정.
    const becomingApproved = (!wasApproved && nowApproved) || promoted;

    const u = await tx.tournamentTeam.update({
      where: { id: teamBigInt },
      data: {
        // 자동승격 시 status를 approved로 덮어쓴다(요청에 status 키가 없을 때만 wantsAutoPromote=true).
        ...(status !== undefined && { status: String(status) }),
        ...(promoted && { status: "approved" }),
        ...(seedNumber !== undefined && { seedNumber: seedNumber ? Number(seedNumber) : null }),
        ...(groupName !== undefined && { groupName: groupName ? String(groupName) : null }),
        ...(division !== undefined && { division: division ? String(division) : null }),
        // payment_status 반영 + paid일 때 paid_at 기록(멱등: 이미 값 있으면 갱신만, no-op 수준).
        ...(nextPayment !== undefined && { payment_status: nextPayment }),
        ...(nextPayment === "paid" && { paid_at: new Date() }),
        // approved로 전이될 때 approved_at 기록(기존엔 없던 경우만).
        ...(becomingApproved && !wasApproved && { approved_at: new Date() }),
      },
    });

    // teams_count 동기화 — approved 진입 시 +1, approved 이탈(거절/취소) 시 -1.
    if (becomingApproved && !wasApproved) {
      await tx.tournament.update({ where: { id }, data: { teams_count: { increment: 1 } } });
    } else if (wasApproved && (nowRejected || status === "withdrawn")) {
      await tx.tournament.update({ where: { id }, data: { teams_count: { decrement: 1 } } });
    }

    return u;
  });

  // B-a: 자동승격 결과를 응답에 동봉(UI 토스트 안내용). promoted=false+reason="division_full"이면 정원초과 보류.
  return apiSuccess({ ...updated, promoted, promote_reason: promoteReason });
}

// DELETE /api/web/tournaments/[id]/teams/[teamId]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, teamId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  // TC-NEW-005: BigInt 변환 실패 방지
  const teamBigInt = parseBigIntParam(teamId);
  if (teamBigInt === null) {
    return apiError("팀을 찾을 수 없습니다.", 404);
  }

  const tt = await prisma.tournamentTeam.findFirst({
    where: { id: teamBigInt, tournamentId: id },
  });
  if (!tt)
    return apiError("팀을 찾을 수 없습니다.", 404);

  // TC-NEW-009: 삭제 + teams_count decrement 원자적 트랜잭션
  await prisma.$transaction(async (tx) => {
    await tx.tournamentTeam.delete({ where: { id: teamBigInt } });
    if (tt.status === "approved") {
      await tx.tournament.update({ where: { id }, data: { teams_count: { decrement: 1 } } });
    }
  });

  return apiSuccess({ deleted: true });
}
