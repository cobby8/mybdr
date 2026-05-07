/**
 * POST /api/web/identity/verify
 *
 * 5/7: PortOne V2 본인인증 실 통합 (mock 모드 → 실 API 재조회)
 *
 * Why:
 *   - 클라이언트 SDK 가 본인인증 완료 후 보낸 identityVerificationId 를
 *     서버에서 PortOne V2 API 로 재조회하여 위변조 차단.
 *   - 클라가 보낸 verified_name / phone 등은 절대 신뢰 X (위조 가능) —
 *     서버 재조회 응답의 verifiedCustomer 만 신뢰.
 *
 * 흐름:
 *   1. 클라이언트가 PortOne.requestIdentityVerification 호출 후 identityVerificationId 전송
 *   2. 서버: GET https://api.portone.io/identity-verifications/{id}?storeId={storeId}
 *      Authorization: PortOne {API_SECRET}
 *   3. 응답.status === "VERIFIED" 검증
 *   4. verifiedCustomer.name / phoneNumber / birthDate 추출
 *   5. User.verified_name / verified_phone / verified_birth / name_verified=true / verified_at 저장
 *
 * 환경변수:
 *   - PORTONE_V2_API_SECRET (서버) — 기존 결제 통합과 공유
 *   - NEXT_PUBLIC_PORTONE_STORE_ID — storeId 에 사용
 *
 * Fallback (PORTONE_V2_API_SECRET 미설정):
 *   - 운영자 환경 미완료 → 503 응답 ("본인인증 설정이 완료되지 않았습니다")
 *
 * 사용자 결정 §1: 인증 완료 시 User.name 도 verifiedCustomer.name 으로 동기화
 */

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

// 요청 페이로드 — 클라가 보낼 수 있는 유일한 값 = identityVerificationId
const verifySchema = z.object({
  identityVerificationId: z.string().min(1).max(200),
});

// PortOne V2 응답 타입 (필요한 필드만)
interface PortOneIdentityVerification {
  status: string; // "VERIFIED" | "FAILED" | "READY" | ...
  verifiedCustomer?: {
    name?: string;
    phoneNumber?: string;
    birthDate?: string; // YYYY-MM-DD
  };
}

const PORTONE_V2_BASE = "https://api.portone.io";

export const POST = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return apiError("입력값 검증 실패", 400, undefined, parsed.error.format());
    }
    const { identityVerificationId } = parsed.data;

    // 환경변수 검증 — 미설정 시 운영자 안내
    const apiSecret = process.env.PORTONE_V2_API_SECRET;
    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
    if (!apiSecret || !storeId) {
      console.error("[identity/verify] PortOne 환경변수 미설정");
      return apiError(
        "본인인증 설정이 완료되지 않았습니다. 운영자에게 문의해 주세요.",
        503,
        "PORTONE_NOT_CONFIGURED",
      );
    }

    // PortOne V2 API 재조회 — 위변조 차단
    const url = `${PORTONE_V2_BASE}/identity-verifications/${encodeURIComponent(
      identityVerificationId,
    )}?storeId=${encodeURIComponent(storeId)}`;
    const portoneRes = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `PortOne ${apiSecret}`,
        Accept: "application/json",
      },
    });

    if (!portoneRes.ok) {
      // 404 = 미존재 / 401 = 인증 키 오류 / 기타 = 일시 오류
      console.error(
        "[identity/verify] PortOne API 응답 오류",
        portoneRes.status,
      );
      return apiError(
        "본인인증 결과를 확인할 수 없습니다. 다시 시도해 주세요.",
        502,
        "PORTONE_LOOKUP_FAILED",
      );
    }

    const data = (await portoneRes.json()) as PortOneIdentityVerification;

    // 상태 검증 — VERIFIED 만 통과
    if (data.status !== "VERIFIED") {
      return apiError(
        `본인인증이 완료되지 않았습니다 (상태: ${data.status}).`,
        400,
        "VERIFICATION_INCOMPLETE",
      );
    }

    const customer = data.verifiedCustomer;
    if (!customer || !customer.name || !customer.phoneNumber) {
      return apiError(
        "본인인증 응답에 필수 정보가 없습니다.",
        400,
        "VERIFICATION_DATA_MISSING",
      );
    }

    // birthDate (YYYY-MM-DD) → Date 변환 (선택 필드)
    let birthDateObj: Date | null = null;
    if (customer.birthDate) {
      const d = new Date(customer.birthDate);
      if (!isNaN(d.getTime())) {
        birthDateObj = d;
      }
    }

    const updated = await prisma.user.update({
      where: { id: ctx.userId },
      data: {
        verified_name: customer.name,
        verified_phone: customer.phoneNumber,
        verified_birth: birthDateObj,
        name_verified: true,
        verified_at: new Date(),
        // 사용자 결정 §1: 인증 완료 시 User.name 도 동기화 (실명 자동 입력)
        name: customer.name,
        // 휴대폰도 동기화 — 일관성 (인증된 번호 = 신뢰 가능)
        phone: customer.phoneNumber,
        // birth_date 도 동기화 (있을 때만)
        ...(birthDateObj ? { birth_date: birthDateObj } : {}),
      },
      select: {
        id: true,
        verified_name: true,
        verified_phone: true,
        name_verified: true,
        verified_at: true,
      },
    });

    return apiSuccess({
      id: updated.id.toString(),
      verified_name: updated.verified_name,
      verified_phone: updated.verified_phone,
      name_verified: updated.name_verified,
      verified_at: updated.verified_at,
    });
  } catch (e) {
    console.error("[POST /api/web/identity/verify]", e);
    return apiError("Internal error", 500);
  }
});
