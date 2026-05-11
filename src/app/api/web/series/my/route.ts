/**
 * GET /api/web/series/my — 운영자 본인 소유 시리즈 드롭다운용 목록.
 *
 * 2026-05-12 — 대회-시리즈 연결 UI (PR2) 신규.
 *
 * 이유 (왜):
 *   - 대회 wizard "대회 정보" 스텝에서 "소속 시리즈" 드롭다운을 렌더링하려면 운영자가 보유한
 *     시리즈 목록 + 단체 정보가 한 번의 호출로 필요하다. (`/api/web/series/[id]` 는 단일 시리즈 GET)
 *   - 드롭다운 라벨 "시리즈명 (단체명)" 형식 박제 — 단체 정보를 함께 내려줘야 클라이언트에서
 *     N+1 호출 없이 라벨 조립 가능.
 *
 * 어떻게:
 *   - withWebAuth 로 로그인 강제 (비로그인 → 401).
 *   - where: `organizer_id = userId AND status = 'active'`.
 *     (super_admin 도 본인 organizer_id 만 본다 — 본 API 는 wizard 드롭다운용 셀프서비스 한정.
 *      전체 시리즈 보기는 별도 admin API 가 담당.)
 *   - include: organization { id, name, slug } — drop-down 라벨 + 후속 영향 검증용.
 *   - 응답 키 자동 snake_case 변환 (apiSuccess) — 프론트는 organization 접근자 그대로 OK
 *     (apiSuccess 가 카멜케이스 키만 변환 / organization 은 이미 모두 snake 아님 → name 만 그대로).
 *   - BigInt 직렬화: id 를 toString() 으로 명시 변환 (JSON.stringify BigInt unsupported 회피).
 *
 * 응답 예시:
 *   {
 *     data: [
 *       { id: "8", name: "BDR 시리즈", organization: { id: "3", name: "강남구농구협회", slug: "org-ny6os" } },
 *       { id: "12", name: "내 단독 시리즈", organization: null }
 *     ]
 *   }
 */

import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

export const GET = withWebAuth(async (_req: Request, ctx: WebAuthContext) => {
  try {
    // 본인 소유 + active 상태 시리즈만 — 드롭다운에 archived/draft 시리즈는 노출 X.
    const seriesList = await prisma.tournament_series.findMany({
      where: {
        organizer_id: ctx.userId,
        status: "active",
      },
      // 단체 정보 함께 — 드롭다운 라벨 "시리즈명 (단체명)" 박제용.
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      // 최근 생성순 — 운영자가 방금 만든 시리즈를 최상단에서 빠르게 찾도록.
      orderBy: { created_at: "desc" },
    });

    // BigInt 직렬화 안전 처리 — id 는 문자열로 (JSON.stringify BigInt unsupported).
    // organization 이 null 일 수 있음 — 단체 미연결 시리즈는 라벨 "(단체 미연결)" 로 박제 (프론트 처리).
    const data = seriesList.map((s) => ({
      id: s.id.toString(),
      name: s.name,
      // 단체 연결 시 { id, name, slug } / 미연결 시 null — 라벨 분기 단일 source.
      organization: s.organization
        ? {
            id: s.organization.id.toString(),
            name: s.organization.name,
            slug: s.organization.slug,
          }
        : null,
    }));

    return apiSuccess({ data });
  } catch {
    return apiError("시리즈 목록 조회 중 오류가 발생했습니다.", 500);
  }
});
