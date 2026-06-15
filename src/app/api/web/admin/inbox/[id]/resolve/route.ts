/**
 * POST /api/web/admin/inbox/[id]/resolve — Admin Console S1-5 통합 디스패처(인박스 항목 처리)
 *
 * 왜 (이유):
 * - S2 통합 인박스(GET /api/web/admin/inbox)가 6개 도메인(game_reports / community_posts /
 *   organizations / court_submissions / payments / teams)을 union 한 단일 목록을 내려준다.
 * - 운영자가 그 목록에서 항목 하나를 바로 처리(승인/반려/숨김 등)할 수 있도록,
 *   도메인을 가리지 않는 단일 처리 엔드포인트가 필요하다.
 * - 각 도메인의 기존 처리 라우트는 그대로 두고(멀티세션 안전·무수정), 디스패처가
 *   검증 로직을 1:1 복제해 내부에서 처리한다. court 처리는 (A) 디스패처 내부 트랜잭션 복제
 *   채택 — 기존 court PATCH 라우트를 import 하지 않아 결합도/회귀 위험 0.
 *
 * 어떻게:
 * - 세션 + super_admin 통합 가드(getWebSession + isSuperAdmin) → 비통과 403.
 * - id 형식 = "<domain>:<refId>" (인박스 item.id 와 동일) → split(":") 으로 분해.
 * - domain 별 Zod body 화이트리스트로 검증 → switch(domain) 에서 직접 prisma 처리 → adminLog.
 * - 응답은 apiSuccess() 경유 → 키 자동 snake_case 변환 (errors.md 2026-04-17).
 *
 * 제약:
 * - schema 변경 0 / 신규 모델 0 / api/v1 미접촉.
 * - payments 는 status-only(환불 요청 승인/반려) — 실제 PG 환불 호출 0, refund_amount 미접촉.
 * - 기존 game-reports/community/organizations/court-submissions 라우트 및 inbox(목록) 미수정.
 * - teams 는 DB 미지원 → 400 UNSUPPORTED_DOMAIN.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { adminLog } from "@/lib/admin/log";
import { addXP } from "@/lib/services/gamification";
import { XP_REWARDS } from "@/lib/constants/gamification";

type RouteCtx = { params: Promise<{ id: string }> };

// 처리 가능한 도메인(teams 제외 — DB 미지원).
const SUPPORTED_DOMAINS = [
  "game_reports",
  "community_posts",
  "organizations",
  "court_submissions",
  "payments",
] as const;

// ── 도메인별 body 스키마(action 화이트리스트) ──────────────────────
// 기존 각 라우트의 Zod/검증과 1:1 동일. 디스패처는 domain 으로 분기해 해당 스키마만 적용.
const gameReportsBody = z.object({
  action: z.enum(["resolve", "dismiss"]),
  memo: z.string().trim().max(2000).optional(),
});
const communityBody = z.object({
  action: z.enum(["hide", "restore"]),
  reason: z.string().trim().max(2000).optional(),
});
const organizationsBody = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(2000).optional(),
});
const courtBody = z.object({
  action: z.enum(["approve", "reject"]),
  review_note: z.string().trim().max(2000).optional(),
});
const paymentsBody = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(2000).optional(),
});

// ── court 제보 court_type 매핑(기존 court-submissions PATCH 라우트와 동일 복제) ──
// court_infos.court_type 은 indoor/outdoor 체계 → 3x3 은 outdoor + court_size="3x3" 보존.
function mapCourtType(submissionType: string): {
  court_type: string;
  court_size: string | null;
} {
  if (submissionType === "indoor") return { court_type: "indoor", court_size: null };
  if (submissionType === "3x3") return { court_type: "outdoor", court_size: "3x3" };
  return { court_type: "outdoor", court_size: null };
}

export async function POST(req: NextRequest, { params }: RouteCtx) {
  // ── super_admin 통합 가드(콘솔 표준) ──
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    return apiError("super_admin 권한이 필요합니다", 403, "FORBIDDEN");
  }
  // isSuperAdmin 통과 후에도 헬퍼가 TS narrowing 을 안 하므로 session 은 명시적으로 non-null.
  const adminId = BigInt(session!.sub);

  // ── id 분해: "<domain>:<refId>" ──
  const { id } = await params;
  const sep = id.indexOf(":");
  if (sep < 0) {
    return apiError("잘못된 항목 식별자입니다", 400, "BAD_ITEM_ID");
  }
  const domain = id.slice(0, sep);
  const refId = id.slice(sep + 1);
  if (!refId) {
    return apiError("잘못된 항목 식별자입니다", 400, "BAD_ITEM_ID");
  }

  // teams: DB 미지원(팀 승인 큐 모델 부재) → 명시적 미지원 응답.
  if (domain === "teams") {
    return apiError("아직 지원하지 않는 도메인입니다", 400, "UNSUPPORTED_DOMAIN");
  }
  if (!SUPPORTED_DOMAINS.includes(domain as (typeof SUPPORTED_DOMAINS)[number])) {
    return apiError("알 수 없는 도메인입니다", 400, "UNKNOWN_DOMAIN");
  }

  // ── body 파싱(도메인 분기 전 공통) ──
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }

  // refId 는 모든 지원 도메인이 BigInt PK(인박스 union 시 .toString() 박제) → 공통 변환.
  let pk: bigint;
  try {
    pk = BigInt(refId);
  } catch {
    return apiError("잘못된 항목 식별자입니다", 400, "BAD_ITEM_ID");
  }

  const now = new Date();

  // ── 도메인별 처리(기존 라우트 검증 로직 1:1 복제) ──────────────────
  switch (domain) {
    // ① game_reports — 경기 평가(신고) resolve/dismiss
    case "game_reports": {
      const parsed = gameReportsBody.safeParse(raw);
      if (!parsed.success) {
        return apiError("요청 값이 올바르지 않습니다", 400, "VALIDATION_ERROR");
      }
      const { action, memo } = parsed.data;

      // submitted 상태만 처리 가능(중복 처리 방어).
      const report = await prisma.game_reports.findUnique({
        where: { id: pk },
        select: { id: true, status: true },
      });
      if (!report) {
        return apiError("존재하지 않는 경기 평가입니다", 404, "NOT_FOUND");
      }
      if (report.status !== "submitted") {
        return apiError(
          `이미 ${report.status} 상태인 평가입니다`,
          400,
          "INVALID_STATE",
        );
      }

      const nextStatus = action === "resolve" ? "resolved" : "dismissed";
      await prisma.game_reports.update({
        where: { id: pk },
        data: { status: nextStatus },
      });

      // memo 는 game_reports 컬럼 부재 → adminLog.changesMade 에만 박제.
      await adminLog(`game_report.${action}`, "GameReport", {
        resourceId: report.id.toString(),
        description: `경기 평가 ${action === "resolve" ? "처리 완료" : "반려"} #${report.id}`,
        changesMade: { status: nextStatus, memo: memo ?? null },
      });

      return apiSuccess({ id: report.id.toString(), status: nextStatus });
    }

    // ② community_posts — 커뮤니티 글 hide/restore
    case "community_posts": {
      const parsed = communityBody.safeParse(raw);
      if (!parsed.success) {
        return apiError("요청 값이 올바르지 않습니다", 400, "VALIDATION_ERROR");
      }
      const { action, reason } = parsed.data;

      const post = await prisma.community_posts.findUnique({
        where: { id: pk },
        select: { id: true, status: true, title: true },
      });
      if (!post) {
        return apiError("존재하지 않는 게시글입니다", 404, "NOT_FOUND");
      }

      const nextStatus = action === "hide" ? "hidden" : "published";
      await prisma.community_posts.update({
        where: { id: pk },
        data: { status: nextStatus },
      });

      // reason 은 community_posts 컬럼 부재 → adminLog.changesMade 에만 박제.
      await adminLog(`community.${action}`, "CommunityPost", {
        resourceId: post.id.toString(),
        description: `커뮤니티 글 ${action === "hide" ? "숨김" : "복원"}: ${post.title ?? `#${post.id}`}`,
        changesMade: { status: nextStatus, reason: reason ?? null },
      });

      return apiSuccess({ id: post.id.toString(), status: nextStatus });
    }

    // ③ organizations — 단체 approve/reject (reject 는 reason 필수)
    case "organizations": {
      const parsed = organizationsBody.safeParse(raw);
      if (!parsed.success) {
        return apiError("요청 값이 올바르지 않습니다", 400, "VALIDATION_ERROR");
      }
      const { action, reason } = parsed.data;

      // pending 상태만 처리 가능(기존 approve/reject 라우트 동일).
      const org = await prisma.organizations.findUnique({
        where: { id: pk },
        select: { id: true, status: true, name: true },
      });
      if (!org) {
        return apiError("단체를 찾을 수 없습니다", 404, "NOT_FOUND");
      }
      if (org.status !== "pending") {
        return apiError(`이미 ${org.status} 상태인 단체입니다`, 400, "INVALID_STATE");
      }

      if (action === "approve") {
        // 승인: status → approved + 승인 시각/관리자 기록.
        await prisma.organizations.update({
          where: { id: pk },
          data: {
            status: "approved",
            approved_at: now,
            approved_by: adminId,
          },
        });
        await adminLog("organization.approve", "Organization", {
          resourceId: org.id.toString(),
          description: `단체 승인: ${org.name}`,
          changesMade: { status: "approved" },
        });
        return apiSuccess({ id: org.id.toString(), status: "approved" });
      }

      // 거절: ★ reason 필수(기존 reject 라우트 동일) → 누락 시 400.
      const trimmed = reason?.trim();
      if (!trimmed) {
        return apiError("거절 사유를 입력해주세요", 400, "REASON_REQUIRED");
      }
      await prisma.organizations.update({
        where: { id: pk },
        data: {
          status: "rejected",
          rejection_reason: trimmed,
          rejection_at: now,
        },
      });
      await adminLog("organization.reject", "Organization", {
        resourceId: org.id.toString(),
        description: `단체 거절: ${org.name}`,
        changesMade: { status: "rejected", rejection_reason: trimmed },
      });
      return apiSuccess({ id: org.id.toString(), status: "rejected" });
    }

    // ④ court_submissions — 코트 제보 approve/reject
    //    ★ (A) 디스패처 내부 트랜잭션 복제(기존 court-submissions PATCH 라우트 무수정)
    case "court_submissions": {
      const parsed = courtBody.safeParse(raw);
      if (!parsed.success) {
        return apiError("요청 값이 올바르지 않습니다", 400, "VALIDATION_ERROR");
      }
      const { action, review_note } = parsed.data;
      const reviewNote = review_note?.trim() || null;

      // pending 상태만(중복 승인 방어) — 기존 라우트와 동일 findFirst.
      const submission = await prisma.court_submissions.findFirst({
        where: { id: pk, status: "pending" },
      });
      if (!submission) {
        return apiError(
          "존재하지 않거나 이미 처리된 제보입니다",
          404,
          "NOT_FOUND",
        );
      }

      if (action === "approve") {
        // ─── 승인: 트랜잭션 court_infos 생성 + 상태 전환 + XP(기존 라우트 복제) ───
        const { court_type, court_size } = mapCourtType(submission.court_type);
        // region("서울 중구") → city/district 분리(첫 토큰=city, 나머지=district).
        const regionParts = submission.region.trim().split(/\s+/);
        const city = regionParts[0] ?? submission.region;
        const district =
          regionParts.length > 1 ? regionParts.slice(1).join(" ") : null;
        const photos = Array.isArray(submission.photos)
          ? (submission.photos as string[])
          : [];

        const newCourtId = await prisma.$transaction(async (tx) => {
          // 1) court_infos 생성(기본좌표 서울시청 — 관리자 보정 전제).
          const court = await tx.court_infos.create({
            data: {
              name: submission.name,
              address: submission.address,
              city,
              district,
              court_type,
              court_size,
              description: submission.description,
              facilities: submission.amenities ?? [],
              photo_url: photos[0] ?? null,
              latitude: 37.5665,
              longitude: 126.978,
              user_id: submission.user_id,
              status: "active",
              metadata: {
                source: "court_submission",
                submission_id: submission.id.toString(),
                fee_text: submission.fee_text,
                operating_hours_text: submission.operating_hours,
                photos,
              },
              created_at: now,
              updated_at: now,
            },
            select: { id: true },
          });

          // 2) 제보 상태 approved + 심사정보 + 생성 코트 역참조.
          await tx.court_submissions.update({
            where: { id: pk },
            data: {
              status: "approved",
              reviewed_by: adminId,
              reviewed_at: now,
              review_note: reviewNote,
              approved_court_info_id: court.id,
            },
          });

          // 3) 제보자에게 코트 제보 승인 XP 지급.
          await addXP(submission.user_id, XP_REWARDS.court_submit, "court_submit");

          return court.id;
        });

        // 4) 관리자 로그(트랜잭션 외 — 실패해도 승인 자체엔 영향 없음).
        await adminLog("court.submission.approve", "Court", {
          resourceId: newCourtId.toString(),
          description: `코트 제보 승인 → 등록: ${submission.name}`,
          changesMade: {
            submission_id: submission.id.toString(),
            name: submission.name,
          },
        });

        return apiSuccess({
          id: submission.id.toString(),
          status: "approved",
          court_info_id: newCourtId.toString(),
        });
      }

      // ─── 반려: 상태만 변경, court INSERT 0 / XP 0 ───
      await prisma.court_submissions.update({
        where: { id: pk },
        data: {
          status: "rejected",
          reviewed_by: adminId,
          reviewed_at: now,
          review_note: reviewNote,
        },
      });
      await adminLog("court.submission.reject", "Court", {
        resourceId: submission.id.toString(),
        description: `코트 제보 반려: ${submission.name}`,
        changesMade: { review_note: reviewNote },
      });
      return apiSuccess({ id: submission.id.toString(), status: "rejected" });
    }

    // ⑤ payments — 환불 요청 approve/reject (★ status-only)
    //    실제 PG(토스) 환불 호출 0 / refund_amount 미접촉 / refund_status 컬럼만 전환.
    //    멱등: refund_status="requested" 인 건만 처리 → 재처리 차단.
    case "payments": {
      const parsed = paymentsBody.safeParse(raw);
      if (!parsed.success) {
        return apiError("요청 값이 올바르지 않습니다", 400, "VALIDATION_ERROR");
      }
      const { action, reason } = parsed.data;

      // refund_status="requested" 인 건만 처리(인박스 큐 조건과 동일·멱등 보장).
      const payment = await prisma.payments.findUnique({
        where: { id: pk },
        select: { id: true, refund_status: true },
      });
      if (!payment) {
        return apiError("결제 내역을 찾을 수 없습니다", 404, "NOT_FOUND");
      }
      if (payment.refund_status !== "requested") {
        return apiError(
          `이미 처리된 환불 요청입니다(${payment.refund_status ?? "none"})`,
          400,
          "INVALID_STATE",
        );
      }

      const nextStatus = action === "approve" ? "approved" : "rejected";
      const trimmedReason = reason?.trim() || null;

      // ★ refund_status 만 전환 — refund_amount/refunded_at/payments.status 미접촉(PG 호출 0).
      await prisma.payments.update({
        where: { id: pk },
        data: {
          refund_status: nextStatus,
          updated_at: now,
        },
      });

      // 환불은 금전 관련 → severity:warning 으로 감사 강조.
      await adminLog(`payment.refund.${action}`, "Payment", {
        resourceId: payment.id.toString(),
        description: `환불 요청 ${action === "approve" ? "승인" : "반려"} #${payment.id}`,
        changesMade: { refund_status: nextStatus, reason: trimmedReason },
        severity: "warning",
      });

      return apiSuccess({ id: payment.id.toString(), refund_status: nextStatus });
    }

    default:
      return apiError("알 수 없는 도메인입니다", 400, "UNKNOWN_DOMAIN");
  }
}
