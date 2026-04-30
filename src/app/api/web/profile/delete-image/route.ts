/**
 * DELETE /api/web/profile/delete-image
 *
 * 왜:
 *  - /profile/edit 사진 탭에서 "제거" 버튼이 호출
 *  - 헤더 UserDropdown 이 이니셜 fallback 으로 돌아가도록 profile_image_url 초기화
 *
 * 어떻게:
 *  - withWebAuth 가드
 *  - 현재 user.profile_image_url 조회
 *  - URL 있으면 @vercel/blob del() 호출 (best effort — 외부 URL/이미 삭제됨 등은 무시)
 *  - prisma.user.update profile_image_url = null
 *  - 응답: { profile_image_url: null }
 *
 * 환경변수 미설정 시:
 *  - del() 호출이 실패할 수 있으나, DB 초기화는 정상 진행
 *    (사용자 입장에서 이미지가 안 보이는 게 우선)
 */

import { del } from "@vercel/blob";
import { prisma } from "@/lib/db/prisma";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

export const DELETE = withWebAuth(async (_req: Request, ctx: WebAuthContext) => {
  try {
    // 현재 이미지 URL 조회
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { profile_image_url: true },
    });

    // 사용자 자체가 없으면 401 대신 404 (withWebAuth 통과한 sub 인데 DB 에 없는 케이스)
    if (!user) {
      return apiError("사용자를 찾을 수 없습니다.", 404);
    }

    // Blob 정리 — 실패해도 DB 초기화 진행 (best effort)
    // 환경변수 미설정 / 외부 URL / 이미 삭제됨 등은 모두 무시
    if (user.profile_image_url) {
      try {
        await del(user.profile_image_url);
      } catch (delErr) {
        console.warn(
          "[DELETE /api/web/profile/delete-image] Blob 삭제 실패 (DB 만 초기화):",
          delErr,
        );
      }
    }

    // DB 초기화 — null 로 설정해 헤더가 이니셜 fallback 으로 돌아가게 함
    await prisma.user.update({
      where: { id: ctx.userId },
      data: { profile_image_url: null },
    });

    return apiSuccess({ profile_image_url: null });
  } catch (e) {
    console.error("[DELETE /api/web/profile/delete-image]", e);
    return apiError("Internal error", 500);
  }
});
