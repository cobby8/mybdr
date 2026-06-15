/**
 * POST /api/web/admin/inbox/[id]/snooze — Admin Console S3 인박스 항목 스누즈(나중에 다시 보기)
 *
 * 왜 (이유):
 * - S2 통합 인박스가 처리 대기 항목을 한 목록으로 모아주지만, 지금 당장 처리하기 어려운 항목을
 *   임시로 숨겨 두고 지정 시각 이후 다시 보고 싶을 때가 있다.
 * - 원본 도메인 테이블엔 상태 컬럼을 추가하지 않고(멀티세션·무수정 보장), 별도 메타 테이블
 *   admin_inbox_state 에 snoozed_until 을 보관해 GET 목록에서 기본 제외한다.
 *
 * 어떻게:
 * - 세션 + super_admin 통합 가드(getWebSession + isSuperAdmin) → 비통과 403.
 * - id 형식 = "<domain>:<refId>" (인박스 item.id 와 동일) → 첫 ":" 기준 분해.
 * - body { until: ISO8601 } 을 Zod 로 검증(미래 시각이 아니어도 형식만 통과 — 즉시 만료 허용).
 * - admin_inbox_state 를 (refType, refId) 복합 unique 키로 upsert → snoozed_until 갱신.
 * - 응답은 apiSuccess() 경유 → 키 자동 snake_case 변환 (errors.md 2026-04-17).
 *
 * 제약:
 * - snooze 만 담당(처리=resolve 라우트 분리). resolved_at/resolved_by/memo 미접촉.
 * - 원본 도메인 테이블 미접촉 / api/v1 미접촉.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteCtx = { params: Promise<{ id: string }> };

// body 스키마 — until 은 ISO8601 datetime 문자열만 허용.
const snoozeBody = z.object({
  until: z.string().datetime({ message: "until 은 ISO8601 형식이어야 합니다" }),
});

export async function POST(req: NextRequest, { params }: RouteCtx) {
  // ── super_admin 통합 가드(콘솔 표준) ──
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    return apiError("super_admin 권한이 필요합니다", 403, "FORBIDDEN");
  }
  // isSuperAdmin 통과 후에도 헬퍼가 TS narrowing 을 안 하므로 명시적 non-null 단언.
  const adminId = session!.sub;

  // ── id 분해: "<domain>:<refId>" (resolve 라우트와 동일 규칙) ──
  const { id } = await params;
  const sep = id.indexOf(":");
  if (sep < 0) {
    return apiError("잘못된 항목 식별자입니다", 400, "BAD_ITEM_ID");
  }
  const refType = id.slice(0, sep);
  const refId = id.slice(sep + 1);
  if (!refType || !refId) {
    return apiError("잘못된 항목 식별자입니다", 400, "BAD_ITEM_ID");
  }

  // ── body 파싱 + Zod 검증 ──
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }
  const parsed = snoozeBody.safeParse(raw);
  if (!parsed.success) {
    return apiError("요청 값이 올바르지 않습니다", 400, "VALIDATION_ERROR");
  }
  const snoozedUntil = new Date(parsed.data.until);

  try {
    // ── admin_inbox_state upsert ──
    // (refType, refId) 복합 unique 키 — 항목당 상태 1개. 있으면 snoozed_until 갱신, 없으면 생성.
    const state = await prisma.adminInboxState.upsert({
      where: { refType_refId: { refType, refId } },
      update: { snoozedUntil },
      create: {
        refType,
        refId,
        snoozedUntil,
        // 스누즈는 처리(resolved)와 별개 — resolved_by 에 누가 스누즈했는지 흔적은 남기지 않음.
        // (감사 추적이 필요하면 추후 별도 컬럼/로그로 분리)
      },
      select: { refType: true, refId: true, snoozedUntil: true },
    });
    // adminId 는 현재 미사용이나 향후 감사 로그 연동 시 사용 예정(린트 회피용 void).
    void adminId;

    return apiSuccess({
      id: `${state.refType}:${state.refId}`,
      snoozed_until: state.snoozedUntil?.toISOString() ?? null,
    });
  } catch {
    return apiError("스누즈 처리에 실패했습니다", 500);
  }
}
