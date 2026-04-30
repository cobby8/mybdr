/**
 * POST /api/web/identity/verify
 *
 * Phase 12-3 (12-C): Portone 본인인증 콜백 — 현재는 mock 모드
 *
 * Why: Portone JS SDK 가 클라이언트에서 본인인증 위젯을 띄운 후, 검증 결과를
 *      서버에 보내 User 모델에 영구 저장하기 위함. Phase 12-5 에서 실제 Portone
 *      API Secret 으로 imp_uid 재조회 검증을 추가할 예정 — 지금은 키 발급 전이라
 *      클라이언트 데이터를 그대로 받는 mock 모드.
 *
 * 보안 가드 (Phase 12-5 실제 통합 시점):
 *   - imp_uid 가 있으면 Portone POST /payments/{imp_uid} 로 서버에서 재조회
 *   - 재조회 응답의 verified_name 만 신뢰 (클라가 보낸 값은 무시)
 *   - 응답에 customer_uid 가 있으면 동일 인증으로 재인증 차단
 *
 * 사용자 결정 §1: 본인인증 완료 시 User.name 도 verified_name 으로 동기화
 *                 (실명 자동 입력 — 닉네임은 nickname 컬럼이 별도)
 */

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

// 요청 페이로드 검증 스키마
// imp_uid: Phase 12-5 실 통합 시점에 Portone 트랜잭션 ID (mock 모드에선 빈 문자열 허용)
const verifySchema = z.object({
  verified_name: z.string().min(1).max(100),
  verified_phone: z.string().min(10).max(20),
  verified_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  imp_uid: z.string().optional(),
});

export const POST = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      // apiError 4번째 인자(extra)에 zod format() 결과 첨부 — 클라 폼이 필드별 표시
      return apiError("입력값 검증 실패", 400, undefined, parsed.error.format());
    }

    const { verified_name, verified_phone, verified_birth /*, imp_uid */ } =
      parsed.data;

    // TODO Phase 12-5: imp_uid 가 비어있지 않으면 Portone Secret 으로 재조회 후
    //                  응답에서 추출한 verified_name 으로 덮어쓰기.
    //                  현재는 mock — 클라이언트 데이터 그대로 신뢰.

    const updated = await prisma.user.update({
      where: { id: ctx.userId },
      data: {
        verified_name,
        verified_phone,
        // verified_birth 는 Date 컬럼이므로 ISO 문자열 → Date 변환
        verified_birth: verified_birth ? new Date(verified_birth) : null,
        name_verified: true,
        verified_at: new Date(),
        // 사용자 결정 §1: 인증 완료 시 표시용 name 도 동기화 (실명 자동 입력)
        name: verified_name,
      },
      select: {
        id: true,
        verified_name: true,
        verified_phone: true,
        name_verified: true,
        verified_at: true,
      },
    });

    // BigInt 직렬화 — id 는 string 으로
    return apiSuccess({
      id: updated.id.toString(),
      verified_name: updated.verified_name,
      verified_phone: updated.verified_phone,
      name_verified: updated.name_verified,
      verified_at: updated.verified_at,
    });
  } catch (e) {
    // errors.md 04-30 패턴: catch raw 에러 console 노출 (디버깅 가능 + 클라엔 일반 메시지)
    console.error("[POST /api/web/identity/verify]", e);
    return apiError("Internal error", 500);
  }
});
