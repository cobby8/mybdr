import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { withWebAuth, WEB_SESSION_COOKIE, type WebAuthContext } from "@/lib/auth/web-session";

/**
 * DELETE /api/web/auth/withdraw
 * 회원 탈퇴 (soft delete)
 * - 비밀번호를 확인한 후 status를 'withdrawn'으로 변경한다.
 * - 개인정보를 익명화하고 세션 쿠키를 삭제한다.
 */
export const DELETE = withWebAuth(async (req: NextRequest, ctx: WebAuthContext) => {
  try {
    const body = await req.json();
    const password = body.password ?? "";

    if (!password) {
      return apiError("비밀번호를 입력해주세요.", 400);
    }

    // 현재 유저 조회
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { id: true, passwordDigest: true, status: true },
    });

    if (!user || user.status === "withdrawn") {
      return apiError("이미 탈퇴한 계정입니다.", 400);
    }

    // 비밀번호 검증
    const isValid = await bcrypt.compare(password, user.passwordDigest);
    if (!isValid) {
      return apiError("비밀번호가 올바르지 않습니다.", 401);
    }

    // soft delete: 상태를 withdrawn으로 변경 + 개인정보 익명화
    const withdrawnAt = new Date();
    // 2026-05-05 fix (B3): email/uid 정리 — 같은 email/카카오 ID 재가입 가능
    //   본질: 기존 email/uid 보존 시 → 재가입 시 "이미 사용 중인 이메일" 에러 + OAuth callback
    //         가 기존 row 매칭 시도 (탈퇴 가드 통과해도 영구 차단).
    //   fix: 탈퇴 시 email = withdrawn_{id}_{ts}@deleted.local 로 변경 + uid=null
    //        → 같은 email 또는 OAuth ID 로 재가입 시 신규 row (의도된 동작).
    //   주의: email UNIQUE 제약 보존 — withdrawn_*@deleted.local 도 UNIQUE 충돌 0 (id+ts 포함).
    const anonymizedEmail = `withdrawn_${user.id}_${withdrawnAt.getTime()}@deleted.local`;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: "withdrawn",
        suspended_at: withdrawnAt,
        // email/uid 정리 — 재가입 가능 보장
        email: anonymizedEmail,
        uid: null,
        // 개인정보 익명화 (GDPR/개인정보보호법 대응)
        name: null,
        nickname: `탈퇴회원_${user.id}`,
        phone: null,
        bio: null,
        profile_image: null,
        profile_image_url: null,
        // OAuth 토큰 삭제
        oauth_token: null,
        // 비밀번호 재설정 토큰 삭제
        reset_token: null,
        reset_token_expires: null,
      },
    });

    // 세션 쿠키 삭제
    const cookieStore = await cookies();
    cookieStore.delete(WEB_SESSION_COOKIE);

    return apiSuccess({ message: "회원 탈퇴가 완료되었습니다." });
  } catch {
    return apiError("서버 오류가 발생했습니다.", 500);
  }
});
