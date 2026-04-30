/**
 * GET /api/web/profile/check-nickname?nickname=xxx
 *
 * 왜:
 *  - /profile/edit 에서 사용자가 저장 전에 닉네임 사용 가능 여부를 확인할 수 있도록
 *    하는 사전 검증 API. PATCH 시점에만 P2002 충돌이 잡히면 사용자 경험이 나쁘고
 *    (이미 1시간 진단 지연 회귀 76c9d26 발생), 입력 단계에서 중복 알림을 줘야 한다.
 *  - 본인이 현재 쓰는 nickname 은 충돌이 아니므로 available: true 를 반환.
 *
 * 어떻게:
 *  - withWebAuth (로그인 사용자만 호출 가능 — 봇/스크레이핑 방지)
 *  - zod 검증: 2~20 자 (PATCH 라우트 90~95 라인 룰과 일치)
 *  - prisma.user.findFirst 로 NOT 본인 + nickname 일치 1건만 조회
 *  - select: { id: true } 만 — BigInt 직렬화 없음 (응답 노출 X), 효율 위해 최소
 *
 * 응답 (apiSuccess 가 자동 snake_case 변환 — 이 객체는 이미 snake_case):
 *   { available: boolean, message: string }
 */

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

// 닉네임 검증 스키마 — PATCH route.ts L91-95 와 동일한 길이 룰
const nicknameSchema = z
  .string()
  .trim()
  .min(2, "닉네임은 2자 이상 20자 이하여야 합니다.")
  .max(20, "닉네임은 2자 이상 20자 이하여야 합니다.");

export const GET = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  try {
    // 쿼리스트링에서 nickname 추출. URL 파싱은 Next.js Request 의 url 사용
    const url = new URL(req.url);
    const raw = url.searchParams.get("nickname") ?? "";

    // zod 검증 — 빈 문자열/길이 위반은 400 + 친화 메시지
    const parsed = nicknameSchema.safeParse(raw);
    if (!parsed.success) {
      // zod issues 의 첫 메시지를 그대로 노출 (모두 한국어 친화 메시지)
      const msg = parsed.error.issues[0]?.message ?? "닉네임 형식이 올바르지 않습니다.";
      return apiError(msg, 400);
    }
    const nickname = parsed.data;

    // 본인이 현재 쓰는 nickname 이면 충돌 X — 자기 자신 제외 조건으로 검색
    // select: { id: true } 만 — 응답에 다른 사용자 id 노출 없음 (보안)
    const existing = await prisma.user.findFirst({
      where: {
        nickname,
        NOT: { id: ctx.userId },
      },
      select: { id: true },
    });

    if (existing) {
      return apiSuccess({
        available: false,
        message: "이미 사용 중인 닉네임입니다.",
      });
    }

    return apiSuccess({
      available: true,
      message: "사용 가능한 닉네임입니다.",
    });
  } catch (e) {
    // errors.md 04-30: catch raw 에러 삼키지 말고 console.error 명시
    console.error("[GET /api/web/profile/check-nickname]", e);
    return apiError("Internal error", 500);
  }
});
