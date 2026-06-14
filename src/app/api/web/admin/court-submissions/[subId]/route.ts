/**
 * PATCH /api/web/admin/court-submissions/[subId] — 코트 제보 승인/반려 (P1-a, 관리자 전용)
 *
 * body: { action: "approve" | "reject", review_note?: string }
 *
 * approve: 트랜잭션으로
 *   1) court_infos.create(제보 → 코트, 기본좌표 서울시청 + 관리자 보정 전제)
 *   2) submission.update(status=approved, reviewed_by/at, approved_court_info_id)
 *   3) 제보자에게 court_submit XP 지급
 *   4) adminLog
 * reject: submission.update(status=rejected, reviewed_by/at, review_note) — court INSERT 0 / XP 0
 *
 * super_admin 가드(suggestions / ambassadors route 동일 패턴).
 * apiSuccess 는 응답 키를 snake_case 변환 → 프론트 접근자도 snake_case.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { addXP } from "@/lib/services/gamification";
import { XP_REWARDS } from "@/lib/constants/gamification";
import { adminLog } from "@/lib/admin/log";

type RouteCtx = { params: Promise<{ subId: string }> };

// 제보 court_type(indoor/outdoor/3x3) → court_infos 매핑.
//   court_infos.court_type 은 indoor/outdoor 체계 → 3x3 은 outdoor + court_size="3x3" 로 보존
function mapCourtType(submissionType: string): { court_type: string; court_size: string | null } {
  if (submissionType === "indoor") return { court_type: "indoor", court_size: null };
  if (submissionType === "3x3") return { court_type: "outdoor", court_size: "3x3" };
  return { court_type: "outdoor", court_size: null };
}

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  // 관리자 인증 필수 (super_admin)
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") {
    return apiError("관리자 권한이 필요합니다", 403, "FORBIDDEN");
  }

  const { subId } = await params;
  const submissionId = BigInt(subId);
  const reviewerId = BigInt(session.sub);

  // 요청 본문 파싱
  let body: { action?: string; review_note?: string };
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }

  if (body.action !== "approve" && body.action !== "reject") {
    return apiError("action은 approve 또는 reject이어야 합니다", 400, "INVALID_ACTION");
  }

  // 제보 조회 — pending 상태만(중복 승인 1차 방어)
  const submission = await prisma.court_submissions.findFirst({
    where: { id: submissionId, status: "pending" },
  });
  if (!submission) {
    return apiError("존재하지 않거나 이미 처리된 제보입니다", 404, "NOT_FOUND");
  }

  const now = new Date();
  const reviewNote = body.review_note?.trim() || null;

  if (body.action === "approve") {
    // ─── 승인: 트랜잭션 court_infos 생성 + 상태 전환 + XP ───
    const { court_type, court_size } = mapCourtType(submission.court_type);
    // region("서울 중구") → city/district 분리(첫 토큰=city, 나머지=district)
    const regionParts = submission.region.trim().split(/\s+/);
    const city = regionParts[0] ?? submission.region;
    const district = regionParts.length > 1 ? regionParts.slice(1).join(" ") : null;
    // 사진 배열 첫 장 → photo_url(나머지는 metadata 보존)
    const photos = Array.isArray(submission.photos) ? (submission.photos as string[]) : [];

    const newCourtId = await prisma.$transaction(async (tx) => {
      // 1) court_infos 생성 (createCourtAction 기본좌표 패턴 답습 — 관리자 보정 전제)
      const court = await tx.court_infos.create({
        data: {
          name: submission.name,
          address: submission.address,
          city,
          district,
          court_type,
          court_size,
          description: submission.description,
          // 편의시설 키 배열 → facilities(Json) 보존
          facilities: submission.amenities ?? [],
          photo_url: photos[0] ?? null,
          // 위경도 기본값(서울 시청) — 승인 후 관리자 지도 보정
          latitude: 37.5665,
          longitude: 126.978,
          user_id: submission.user_id, // 제보자를 등록자로
          status: "active",
          // 제보 메타 보존(이용료 자유텍스트·운영시간·전체 사진)
          metadata: {
            source: "court_submission",
            submission_id: submission.id.toString(),
            fee_text: submission.fee_text,
            operating_hours_text: submission.operating_hours,
            photos,
          },
          created_at: now,
          updated_at: now,
        },
        select: { id: true },
      });

      // 2) 제보 상태 approved + 심사정보 + 생성 코트 역참조
      await tx.court_submissions.update({
        where: { id: submissionId },
        data: {
          status: "approved",
          reviewed_by: reviewerId,
          reviewed_at: now,
          review_note: reviewNote,
          approved_court_info_id: court.id,
        },
      });

      // 3) 제보자에게 코트 제보 승인 XP 지급
      await addXP(submission.user_id, XP_REWARDS.court_submit, "court_submit");

      return court.id;
    });

    // 4) 관리자 로그(트랜잭션 외 — 실패해도 승인 자체엔 영향 없음)
    await adminLog("court.submission.approve", "Court", {
      resourceId: newCourtId.toString(),
      description: `코트 제보 승인 → 등록: ${submission.name}`,
      changesMade: { submission_id: submission.id.toString(), name: submission.name },
    });

    return apiSuccess({
      id: submissionId.toString(),
      status: "approved",
      court_info_id: newCourtId.toString(),
    });
  }

  // ─── 반려: 상태만 변경, court INSERT 0 / XP 0 ───
  await prisma.court_submissions.update({
    where: { id: submissionId },
    data: {
      status: "rejected",
      reviewed_by: reviewerId,
      reviewed_at: now,
      review_note: reviewNote,
    },
  });

  await adminLog("court.submission.reject", "Court", {
    resourceId: submission.id.toString(),
    description: `코트 제보 반려: ${submission.name}`,
    changesMade: { review_note: reviewNote },
  });

  return apiSuccess({ id: submissionId.toString(), status: "rejected" });
}
