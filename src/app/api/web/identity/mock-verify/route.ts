/**
 * POST /api/web/identity/mock-verify (5/8 본인인증 mock 자체 입력 폴백)
 *
 * 왜:
 *   - PortOne 콘솔 채널 발급 전 (이번 주 내 활성화 예정) 사용자가 onboarding 1단계에서
 *     빨간 에러로 막히는 문제 해결.
 *   - channel key 환경변수 미설정 시 사용자가 자체 입력으로 임시 통과 허용.
 *   - PortOne 활성화 시 환경변수 추가 1회 → 본 endpoint 자동 503 거부 (mock 우회 차단).
 *
 * 어떻게:
 *   1. 가드 1 — isIdentityGateEnabled() 가 true 면 503 (PortOne 활성 시 mock 차단)
 *   2. 가드 2 — withWebAuth (자기 본인 user 만 update 가능)
 *   3. 가드 3 — 이미 name_verified=true 인 user 는 409 (재인증 차단)
 *   4. zod 검증 — 한글 실명 / 010 휴대폰 / 생년월일 (선택) 패턴 (클라 동일)
 *   5. user.update + identity_method='mock' 표식 + 사용자 결정 §1 동기화 (name/phone/birth_date)
 *   6. admin_logs INSERT — severity='info' / event="mock_identity_verified" (사용자 결정 Q5)
 *   7. apiSuccess 응답 (snake_case 자동 변환)
 *
 * 보안:
 *   - 환경변수 단일 신호로 PortOne 활성화 시 자동 비활성화 (코드 변경 0)
 *   - 클라 데이터 신뢰 X (서버 zod 재검증 + withWebAuth 본인 한정)
 *   - admin_logs 감사 로그 — mock 통과자 사후 식별 + 운영 모니터링
 *
 * 결정 근거: decisions.md [2026-05-08] 본인인증 mock 자체 입력 폴백 설계.
 */

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { isIdentityGateEnabled } from "@/lib/auth/identity-gate-flag";
import { adminLog } from "@/lib/admin/log";

/**
 * 요청 페이로드 검증 — 클라이언트 검증과 동일 패턴 (서버 신뢰 재검증)
 *  - name: 한글 2~20자 (서버 결정 — 한글 실명만 허용)
 *  - phone: 010-XXXX-XXXX 또는 01XXXXXXXXX (하이픈 선택)
 *  - birth_date: YYYY-MM-DD 선택 입력 (사용자 결정 Q1)
 */
const mockVerifySchema = z.object({
  name: z.string().regex(/^[가-힣]{2,20}$/, "실명은 한글 2~20자"),
  phone: z.string().regex(/^010-?\d{4}-?\d{4}$/, "휴대폰 번호 형식 오류"),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "생년월일 형식 오류")
    .optional(),
});

export const POST = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  try {
    // 가드 1 — PortOne 활성화 시 mock endpoint 자동 비활성화 (보안 핵심)
    // 환경변수 NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY 추가 = 즉시 503
    if (isIdentityGateEnabled()) {
      return apiError(
        "정식 본인인증이 활성화되어 임시 입력은 사용할 수 없습니다.",
        503,
        "MOCK_DISABLED",
      );
    }

    // 가드 2 — body 검증 (zod) — 클라 검증 신뢰 X
    const body = await req.json();
    const parsed = mockVerifySchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        "입력값 검증 실패",
        400,
        "VALIDATION_ERROR",
        { details: parsed.error.format() },
      );
    }
    const { name, phone, birth_date } = parsed.data;

    // 가드 3 — 이미 인증된 사용자는 재인증 차단
    // 정식 인증 통과 후 mock 으로 덮어쓰는 위변조 차단
    const existing = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { name_verified: true, identity_method: true },
    });
    if (!existing) {
      return apiError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND");
    }
    if (existing.name_verified === true) {
      return apiError(
        "이미 본인인증이 완료되었습니다.",
        409,
        "ALREADY_VERIFIED",
      );
    }

    // 생년월일 — 선택 입력 (입력 없으면 null)
    let birthDateObj: Date | null = null;
    if (birth_date) {
      const d = new Date(birth_date);
      if (!isNaN(d.getTime())) {
        birthDateObj = d;
      }
    }

    // user 업데이트 — verified_* + identity_method='mock' + 사용자 결정 §1 동기화
    // 패턴: 기존 PortOne endpoint (verify/route.ts) 와 동일 (identity_method 만 추가)
    const updated = await prisma.user.update({
      where: { id: ctx.userId },
      data: {
        verified_name: name,
        verified_phone: phone,
        verified_birth: birthDateObj,
        name_verified: true,
        verified_at: new Date(),
        // 5/8 신규 — mock 출처 표식 (PortOne 활성화 후 사후 식별)
        identity_method: "mock",
        // 사용자 결정 §1: 인증 완료 시 User.name/phone/birth_date 도 동기화 (PortOne 패턴 동일)
        name,
        phone,
        ...(birthDateObj ? { birth_date: birthDateObj } : {}),
      },
      select: {
        id: true,
        verified_name: true,
        verified_phone: true,
        name_verified: true,
        verified_at: true,
        identity_method: true,
      },
    });

    // 감사 로그 — 사용자 결정 Q5 (mock 통과자 운영 추적)
    // adminLog 헬퍼는 admin_id 에 현재 세션 user 를 자동 사용 — 본인이 본인을 self-update
    // severity=info 로 일반 운영 이벤트 표시 (warning/error 아님)
    await adminLog("mock_identity_verified", "user", {
      resourceId: ctx.userId,
      targetType: "user",
      targetId: ctx.userId,
      severity: "info",
      description: `mock 본인인증 통과 (PortOne 활성화 전 임시 입력)`,
      changesMade: {
        identity_method: "mock",
        name_verified: true,
        // 개인정보 raw 값 박제 X — 운영자가 SELECT 로 user 테이블 조회 가능
      },
    });

    // 응답 envelope — apiSuccess 가 snake_case 자동 변환 (errors.md 8회 재발 함정 회피)
    return apiSuccess({
      id: updated.id.toString(),
      verified_name: updated.verified_name,
      verified_phone: updated.verified_phone,
      name_verified: updated.name_verified,
      verified_at: updated.verified_at,
      identity_method: updated.identity_method,
    });
  } catch (e) {
    console.error("[POST /api/web/identity/mock-verify]", e);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
});
