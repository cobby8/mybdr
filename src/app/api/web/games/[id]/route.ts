/**
 * GET /api/web/games/[id] — 경기 상세 조회 (공개)
 * PATCH /api/web/games/[id] — 경기 수정 (호스트만)
 * DELETE /api/web/games/[id] — 경기 취소 (호스트만, soft delete: status=5)
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
// M1: 취소 시 신청자 전원 알림 (다수 발송 → bulk 유틸)
import { createNotificationBulk } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";

type RouteCtx = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────────────
// GET: 경기 상세 조회 (수정 폼용 — uuid 기반)
// ─────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: RouteCtx
) {
  const { id } = await params;

  // uuid로 경기 조회 (경기 상세 페이지와 동일한 식별자 사용)
  const game = await prisma.games.findUnique({
    where: { uuid: id },
    select: {
      id: true,
      uuid: true,
      title: true,
      description: true,
      game_type: true,
      status: true,
      city: true,
      district: true,
      venue_name: true,
      venue_address: true,
      scheduled_at: true,
      duration_hours: true,
      max_participants: true,
      min_participants: true,
      fee_per_person: true,
      skill_level: true,
      requirements: true,
      notes: true,
      contact_phone: true,
      organizer_id: true,
      // BDR v2.2 P0-2: edit 페이지의 잠금 배너/위험 액션 안내에 활용 (신청자 수 노출)
      current_participants: true,
    },
  }).catch(() => null);

  if (!game) {
    return apiError("존재하지 않는 경기입니다.", 404, "NOT_FOUND");
  }

  // BigInt/Date 직렬화
  return apiSuccess({
    id: game.id.toString(),
    uuid: game.uuid,
    title: game.title,
    description: game.description,
    game_type: game.game_type,
    status: game.status,
    city: game.city,
    district: game.district,
    venue_name: game.venue_name,
    venue_address: game.venue_address,
    scheduled_at: game.scheduled_at?.toISOString() ?? null,
    duration_hours: game.duration_hours,
    max_participants: game.max_participants,
    min_participants: game.min_participants,
    fee_per_person: game.fee_per_person,
    skill_level: game.skill_level,
    requirements: game.requirements,
    notes: game.notes,
    contact_phone: game.contact_phone,
    organizer_id: game.organizer_id.toString(),
    // BDR v2.2 P0-2: edit 페이지 잠금 배너 (현재 신청/참가자 수)
    current_participants: game.current_participants ?? 0,
  });
}

// ─────────────────────────────────────────────────
// PATCH: 경기 수정 (호스트만)
// - 완료(3)/취소(4) 상태인 경기는 수정 불가
// - organizer_id로 호스트 여부 검증
// ─────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: RouteCtx
) {
  // 인증 확인
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다.", 401, "UNAUTHORIZED");
  }

  const { id } = await params;
  const userId = BigInt(session.sub);

  // 경기 존재 + 호스트 확인
  const game = await prisma.games.findUnique({
    where: { uuid: id },
    select: { id: true, organizer_id: true, status: true },
  });
  if (!game) {
    return apiError("존재하지 않는 경기입니다.", 404, "NOT_FOUND");
  }
  // IDOR 방지: 호스트만 수정 가능
  if (game.organizer_id !== userId) {
    return apiError("경기 호스트만 수정할 수 있습니다.", 403, "FORBIDDEN");
  }
  // 완료(3)/취소(4) 상태 경기는 수정 불가 (status=5는 잔존 데이터 방어)
  if (game.status === 3 || game.status === 4 || game.status === 5) {
    return apiError("이미 종료되거나 취소된 경기는 수정할 수 없습니다.", 400, "GAME_ENDED");
  }

  // 요청 본문 파싱
  let body: {
    title?: string;
    description?: string;
    scheduled_at?: string;
    duration_hours?: number;
    max_participants?: number;
    min_participants?: number;
    fee_per_person?: number;
    skill_level?: string;
    requirements?: string;
    notes?: string;
    contact_phone?: string;
    venue_name?: string;
    venue_address?: string;
    city?: string;
    district?: string;
  };
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }

  // 수정 가능한 필드만 추출 (부분 업데이트)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {};

  // 제목 검증: 2~100자
  if (body.title !== undefined) {
    const trimmed = body.title.trim();
    if (trimmed.length < 2 || trimmed.length > 100) {
      return apiError("제목은 2~100자로 입력해주세요.", 400, "INVALID_TITLE");
    }
    updateData.title = trimmed;
  }
  // 설명 (선택)
  if (body.description !== undefined) {
    updateData.description = body.description?.trim() || null;
  }
  // 일정: ISO 날짜 문자열
  if (body.scheduled_at !== undefined) {
    const date = new Date(body.scheduled_at);
    if (isNaN(date.getTime())) {
      return apiError("유효하지 않은 날짜 형식입니다.", 400, "INVALID_DATE");
    }
    updateData.scheduled_at = date;
  }
  // 경기 시간 (시간 단위)
  if (body.duration_hours !== undefined) {
    if (body.duration_hours < 1 || body.duration_hours > 12) {
      return apiError("경기 시간은 1~12시간 사이로 입력해주세요.", 400, "INVALID_DURATION");
    }
    updateData.duration_hours = body.duration_hours;
  }
  // 최대 참가자
  if (body.max_participants !== undefined) {
    if (body.max_participants < 2 || body.max_participants > 50) {
      return apiError("최대 인원은 2~50명 사이로 입력해주세요.", 400, "INVALID_MAX");
    }
    updateData.max_participants = body.max_participants;
  }
  // 최소 참가자
  if (body.min_participants !== undefined) {
    if (body.min_participants < 1 || body.min_participants > 50) {
      return apiError("최소 인원은 1~50명 사이로 입력해주세요.", 400, "INVALID_MIN");
    }
    updateData.min_participants = body.min_participants;
  }
  // 참가비
  if (body.fee_per_person !== undefined) {
    if (body.fee_per_person < 0) {
      return apiError("참가비는 0 이상이어야 합니다.", 400, "INVALID_FEE");
    }
    updateData.fee_per_person = body.fee_per_person;
  }
  // 실력 수준
  if (body.skill_level !== undefined) {
    updateData.skill_level = body.skill_level;
  }
  // 참가 조건
  if (body.requirements !== undefined) {
    updateData.requirements = body.requirements?.trim() || null;
  }
  // 비고
  if (body.notes !== undefined) {
    updateData.notes = body.notes?.trim() || null;
  }
  // 연락처
  if (body.contact_phone !== undefined) {
    updateData.contact_phone = body.contact_phone?.trim() || null;
  }
  // 장소명
  if (body.venue_name !== undefined) {
    updateData.venue_name = body.venue_name?.trim() || null;
  }
  // 장소 주소
  if (body.venue_address !== undefined) {
    updateData.venue_address = body.venue_address?.trim() || null;
  }
  // 도시
  if (body.city !== undefined) {
    updateData.city = body.city?.trim() || null;
  }
  // 지역구
  if (body.district !== undefined) {
    updateData.district = body.district?.trim() || null;
  }

  // 수정할 항목이 없으면 에러
  if (Object.keys(updateData).length === 0) {
    return apiError("수정할 항목이 없습니다.", 400, "NO_CHANGES");
  }

  // updated_at 갱신
  updateData.updated_at = new Date();

  const updated = await prisma.games.update({
    where: { id: game.id },
    data: updateData,
  });

  return apiSuccess({
    id: updated.id.toString(),
    uuid: updated.uuid,
    title: updated.title,
    status: updated.status,
  });
}

// ─────────────────────────────────────────────────
// DELETE: 경기 취소 (호스트만)
// - 실제 삭제가 아닌 status를 4(취소)로 변경 (soft delete)
//   ※ M1(2026-06-19): 과거 status=5 set → STATUS_LABEL 라벨 깨짐. 취소=4로 통일.
// - 완료(3)/취소(4) 상태인 경기는 취소 불가
// - 취소 시 활성 신청자(0=대기, 1=승인, 3=대기열) 전원에게 GAME_CANCELLED 알림 발송
//   ※ reviewer 후속②(2026-06-20): M2 추가된 대기자 status=3 누락 → [0,1,3]로 확장. 거절(2)은 제외 유지.
// ─────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: RouteCtx
) {
  // 인증 확인
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다.", 401, "UNAUTHORIZED");
  }

  const { id } = await params;
  const userId = BigInt(session.sub);

  // 경기 존재 + 호스트 확인 (취소 알림 문구에 title 필요)
  const game = await prisma.games.findUnique({
    where: { uuid: id },
    select: { id: true, uuid: true, title: true, organizer_id: true, status: true },
  });
  if (!game) {
    return apiError("존재하지 않는 경기입니다.", 404, "NOT_FOUND");
  }
  // IDOR 방지: 호스트만 취소 가능
  if (game.organizer_id !== userId) {
    return apiError("경기 호스트만 취소할 수 있습니다.", 403, "FORBIDDEN");
  }
  // 이미 완료(3)/취소(4)된 경기
  // (status=5는 더 이상 set 하지 않지만, 잔존 데이터 방어를 위해 함께 체크)
  if (game.status === 3 || game.status === 4 || game.status === 5) {
    return apiError("이미 종료되거나 취소된 경기입니다.", 400, "GAME_ENDED");
  }

  // soft delete: status를 4(취소)로 변경
  await prisma.games.update({
    where: { id: game.id },
    data: { status: 4, updated_at: new Date() },
  });

  // 취소 알림: 아직 활성인 신청자(0=신청완료/대기, 1=승인, 3=대기열) 전원에게 발송.
  // 이유: 거절(2)된 신청자는 이미 탈락이므로 제외. M2 대기자(3)도 경기가 사라지면 통보 필요 → 포함.
  // fire-and-forget(취소 자체는 이미 커밋됨).
  const applicants = await prisma.game_applications.findMany({
    where: { game_id: game.id, status: { in: [0, 1, 3] } },
    select: { user_id: true },
  });
  if (applicants.length > 0) {
    const shortId = game.uuid?.slice(0, 8) ?? game.id.toString();
    createNotificationBulk(
      applicants.map((a) => ({
        userId: a.user_id,
        notificationType: NOTIFICATION_TYPES.GAME_CANCELLED,
        title: "경기 취소",
        content: `"${game.title ?? "경기"}"가 호스트에 의해 취소되었습니다.`,
        actionUrl: `/games/${shortId}`,
        notifiableType: "game",
        notifiableId: game.id,
      }))
    ).catch(() => {});
  }

  return apiSuccess({ message: "경기가 취소되었습니다." });
}
