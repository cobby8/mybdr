import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/api/response";

/**
 * 5/7 PR1.5 — 본인인증 필수 게이트 (Onboarding 옵션 C — 핵심 액션 시점 차단)
 *
 * 이유 (왜):
 *   기존 회원 + 신규 가입자 중 미인증 사용자가 핵심 액션 (대회 / 팀 / 매치 / 경기 신청) 시도 시
 *   서버 단에서 차단. 강제 redirect 가드 (옵션 B) 대신 자연스러운 UX (옵션 C) 채택.
 *
 * 사용처:
 *   - POST /api/web/tournaments/[id]/join (대회 신청)
 *   - POST /api/web/teams/[id]/join (팀 가입 신청)
 *   - POST /api/web/teams/[id]/match-request (매치 신청)
 *   - POST /api/web/games/[id]/apply (경기 신청)
 *
 * 패턴 (route handler 안):
 *   const guard = await requireIdentityVerified(ctx.userId);
 *   if (guard instanceof Response) return guard;
 *   // ... 통과 시 다음 단계
 *
 * 응답:
 *   - 미인증 → 403 IDENTITY_VERIFICATION_REQUIRED + 안내 한국어 메시지
 *   - DB user 없음 → 404 USER_NOT_FOUND (이론상 발생 X — withWebAuth 통과 후 호출)
 *
 * 회귀 가드:
 *   - errors.md [2026-04-17] apiError 인자 순서 (message, status, code) 준수
 *   - apiSuccess 자동 snake_case 변환 영향 없음 (apiError 는 변환 없음)
 */
export async function requireIdentityVerified(
  userId: bigint,
): Promise<{ ok: true } | Response> {
  const user = await prisma.user
    .findUnique({
      where: { id: userId },
      select: { name_verified: true },
    })
    .catch(() => null);

  if (!user) {
    return apiError("회원 정보를 찾을 수 없습니다.", 404, "USER_NOT_FOUND");
  }

  if (!user.name_verified) {
    return apiError(
      "본인인증이 필요합니다. 마이페이지에서 인증을 완료해 주세요.",
      403,
      "IDENTITY_VERIFICATION_REQUIRED",
    );
  }

  return { ok: true };
}
