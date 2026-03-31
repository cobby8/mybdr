/**
 * GET /api/web/games/[id] — 경기 상세 조회 (공개)
 * PATCH /api/web/games/[id] — 경기 수정 (호스트만)
 * DELETE /api/web/games/[id] — 경기 취소 (호스트만, soft delete: status=5)
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

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
  });
}

// ─────────────────────────────────────────────────
// PATCH: 경기 수정 (호스트만)
// - 완료(4)/취소(5) 상태인 경기는 수정 불가
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
  // 완료(4)/취소(5) 상태 경기는 수정 불가
  if (game.status === 4 || game.status === 5) {
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
// - 실제 삭제가 아닌 status를 5(취소)로 변경 (soft delete)
// - 완료(4)/취소(5) 상태인 경기는 취소 불가
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

  // 경기 존재 + 호스트 확인
  const game = await prisma.games.findUnique({
    where: { uuid: id },
    select: { id: true, organizer_id: true, status: true },
  });
  if (!game) {
    return apiError("존재하지 않는 경기입니다.", 404, "NOT_FOUND");
  }
  // IDOR 방지: 호스트만 취소 가능
  if (game.organizer_id !== userId) {
    return apiError("경기 호스트만 취소할 수 있습니다.", 403, "FORBIDDEN");
  }
  // 이미 완료/취소된 경기
  if (game.status === 4 || game.status === 5) {
    return apiError("이미 종료되거나 취소된 경기입니다.", 400, "GAME_ENDED");
  }

  // soft delete: status를 5(취소)로 변경
  await prisma.games.update({
    where: { id: game.id },
    data: { status: 5, updated_at: new Date() },
  });

  return apiSuccess({ message: "경기가 취소되었습니다." });
}
