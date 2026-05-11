/**
 * GET /api/web/tournaments/my-unlinked — 운영자 본인 소유 + 시리즈 미연결 대회 목록.
 *
 * 2026-05-12 — 대회-시리즈 연결 흡수 모달 (PR3) 신규.
 *
 * 이유 (왜):
 *   - 단체 관리 페이지에서 운영자가 자신의 미연결 대회를 한 번에 시리즈에 흡수(연결)할 수 있도록
 *     모달에서 표시할 후보 목록 API. (`series_id IS NULL` 조건 + 본인 organizer_id)
 *   - 본 API 가 1차 status 가드 (draft / registration_open / registration) 를 적용해 흡수 가능한
 *     대회만 노출 — UI 가 "흡수 불가능한 대회를 회색" 처리할 필요 없이 단순 목록 렌더링.
 *   - PR1 PATCH 가 적용한 SERIES_CHANGE_ALLOWED_STATUSES 와 정책 일치 — 두 API status 정합 보장.
 *
 * 어떻게:
 *   - withWebAuth 로 로그인 강제 (비로그인 → 401).
 *   - where: organizerId = userId AND series_id IS NULL AND status IN (...허용 status).
 *   - 응답: id, name, status, startDate, edition_number — 모달 표시 최소 필드.
 *   - BigInt 직렬화: edition_number 는 Int 라 안전, id 는 String UUID 라 그대로.
 *
 * 응답 예시:
 *   {
 *     data: [
 *       {
 *         id: "bd527531-...",
 *         name: "2026 강남구협회장배 농구대회 (유소년부)",
 *         status: "draft",
 *         startDate: null,
 *         editionNumber: null
 *       }
 *     ]
 *   }
 */

import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

// PR1 PATCH 의 SERIES_CHANGE_ALLOWED_STATUSES 와 동일 정책 — 진행 중/종료 대회는 흡수 후보에서 제외.
// "registration" 은 wizard 의 잘못된 enum 값 (실제 DB enum = registration_open) 이지만 PR2 와
// 마찬가지로 폴백 차원에서 함께 허용.
const ABSORB_ALLOWED_STATUSES = ["draft", "registration_open", "registration"];

export const GET = withWebAuth(async (_req: Request, ctx: WebAuthContext) => {
  try {
    // 본인 소유 + 시리즈 미연결 + 흡수 허용 status 만 — UI 가 단순 렌더링하도록 1차 필터링.
    const tournaments = await prisma.tournament.findMany({
      where: {
        organizerId: ctx.userId,
        series_id: null,
        status: { in: ABSORB_ALLOWED_STATUSES },
      },
      // 모달 목록 표시에 필요한 최소 필드만 — 무거운 settings/categories 등 제외.
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        edition_number: true,
      },
      // 최근 생성순 — 운영자가 방금 만든 대회를 최상단에서 빠르게 찾도록.
      orderBy: { startDate: "desc" },
    });

    // 응답 키 자동 snake_case 변환 (apiSuccess) — 프론트는 start_date / edition_number 로 접근.
    // BigInt 필드 없음 (id=String, edition_number=Int) — toString() 불필요.
    const data = tournaments.map((t) => ({
      id: t.id,
      name: t.name,
      status: t.status,
      // Date 직렬화 — null 그대로 유지, Date 는 ISO 문자열로 자동 변환.
      startDate: t.startDate ? t.startDate.toISOString() : null,
      editionNumber: t.edition_number,
    }));

    return apiSuccess({ data });
  } catch {
    return apiError("미연결 대회 목록 조회 중 오류가 발생했습니다.", 500);
  }
});
