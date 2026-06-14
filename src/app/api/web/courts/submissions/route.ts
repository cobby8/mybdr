/**
 * 코트 신규 등록 제보 API (P1-a) — 웹 전용(getWebSession)
 *
 * POST /api/web/courts/submissions
 *   - 로그인 사용자가 DB 미등록 코트를 제보 → court_submissions INSERT(status=pending)
 *   - 관리자 승인 시 court_infos 생성(별도 admin PATCH 라우트)
 *
 * GET /api/web/courts/submissions
 *   - 본인 제보 내역(최신순) + 승인 기여 count 반환
 *
 * 주의: apiSuccess 는 응답 키를 snake_case 로 변환한다(response.ts).
 *       프론트 접근자도 snake_case 로 작성할 것(my_submissions / approved_count 등).
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

// 폼 → submissions 매핑. court_type 은 폼 select 영문 키(indoor/outdoor/3x3)
const SubmissionSchema = z.object({
  name: z.string().trim().min(1, "코트 이름을 입력하세요").max(100),
  region: z.string().trim().min(1, "지역을 선택하세요").max(60),
  court_type: z.enum(["indoor", "outdoor", "3x3"]),
  address: z.string().trim().min(1, "상세 주소를 입력하세요").max(200),
  operating_hours: z.string().trim().max(100).optional().nullable(),
  fee_text: z.string().trim().max(100).optional().nullable(),
  // 편의시설 키 배열(shower/parking/indoor/light/locker/rental) — 화이트리스트
  amenities: z
    .array(z.enum(["shower", "parking", "indoor", "light", "locker", "rental"]))
    .max(6)
    .optional()
    .default([]),
  // 사진 URL 배열(최대 5) — 현재 폼은 업로드 미동작이라 보통 빈 배열
  photos: z.array(z.string().url()).max(5).optional().default([]),
  description: z.string().trim().max(1000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  // 로그인 가드 (web 세션)
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  // 본문 파싱 + Zod 검증
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }

  const parsed = SubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    // 첫 번째 검증 메시지를 사용자에게 안내
    const first = parsed.error.issues[0];
    return apiError(first?.message ?? "입력값을 확인하세요", 422, "VALIDATION_ERROR");
  }

  const d = parsed.data;

  // court_submissions INSERT (status=pending 기본값)
  const created = await prisma.court_submissions.create({
    data: {
      user_id: BigInt(session.sub),
      name: d.name,
      region: d.region,
      court_type: d.court_type,
      address: d.address,
      operating_hours: d.operating_hours?.trim() || null,
      fee_text: d.fee_text?.trim() || null,
      amenities: d.amenities,
      photos: d.photos,
      description: d.description?.trim() || null,
    },
    select: { id: true, status: true },
  });

  return apiSuccess(
    { id: created.id.toString(), status: created.status },
    201
  );
}

export async function GET() {
  // 로그인 가드 — 본인 제보 내역만 노출(IDOR 방지)
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  const userId = BigInt(session.sub);

  // 내 제보 내역(최신순) + 승인 기여 count 병렬 조회
  const [submissions, approvedCount] = await Promise.all([
    prisma.court_submissions.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        region: true,
        court_type: true,
        status: true,
        review_note: true,
        created_at: true,
      },
    }),
    prisma.court_submissions.count({
      where: { user_id: userId, status: "approved" },
    }),
  ]);

  // BigInt/Date 직렬화 — apiSuccess 가 키를 snake_case 변환하므로 키는 그대로 유지
  const mySubmissions = submissions.map((s) => ({
    id: s.id.toString(),
    name: s.name,
    region: s.region,
    court_type: s.court_type,
    status: s.status,
    review_note: s.review_note,
    created_at: s.created_at.toISOString(),
  }));

  return apiSuccess({
    my_submissions: mySubmissions,
    approved_count: approvedCount,
  });
}
