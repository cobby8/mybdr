/**
 * Phase 10-1 B-5/B-6 — 게임 리포트 라우트
 *
 * POST   /api/web/games/[id]/report  — 본인 리포트 제출 (@@unique: 1회 한정)
 * GET    /api/web/games/[id]/report  — 본인 리포트 조회 (수정 폼 prefill + can_edit)
 * PATCH  /api/web/games/[id]/report  — 본인 리포트 수정 (제출 후 24h 이내)
 *
 * 설계 결정
 * - params.id 는 디렉터리 컨벤션상 games.uuid (kebab-case 디렉터리의 다른 라우트와 동일).
 *   → uuid 로 game 을 조회한 뒤 BigInt id 를 얻어 다음 단계로 전달한다.
 * - IDOR 방지: GET/PATCH 는 (game_id, reporter_user_id) 복합키로 직접 자기 리포트만 조회.
 * - 동시성: POST 는 @@unique([game_id, reporter_user_id]) 위반 시 P2002 → 409 로 변환.
 * - 트랜잭션 분리: recomputeFinalMvp() 는 별도 update 다수 + 무거운 groupBy 이므로
 *   메인 write 트랜잭션 밖에서 호출 (실패해도 사용자 응답에는 영향 없음).
 */
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import {
  createReportSchema,
  updateReportSchema,
} from "@/lib/validation/game-report";
import { canReportGame, canEditReport } from "@/lib/games/report-auth";
import { recomputeFinalMvp } from "@/lib/games/mvp-aggregate";

type RouteCtx = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────────────────────────
// 공통: uuid → { gameId(BigInt) } 해석. 없거나 형식 이상이면 404 반환.
// 같은 라우트 안에서 3번 메서드가 모두 사용하므로 헬퍼로 추출.
// ─────────────────────────────────────────────────────────────
async function resolveGameByUuid(uuid: string) {
  // uuid 컬럼 단순 lookup — DB 에러는 catch 로 흡수해 404 와 동일하게 처리
  return prisma.games
    .findUnique({
      where: { uuid },
      select: { id: true },
    })
    .catch(() => null);
}

// ─────────────────────────────────────────────────────────────
// POST — 리포트 제출
// 1) 세션 / 2) uuid→gameId / 3) canReportGame
// 4) body 검증 / 5) 트랜잭션 create+createMany (+ P2002 → 409)
// 6) recomputeFinalMvp (외부)
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest, ctx: RouteCtx) {
  // 1. 세션 가드 — 비로그인 사용자는 모두 차단
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다.", 401, "UNAUTHORIZED");
  }
  const userId = BigInt(session.sub);

  // 2. uuid → game 조회 (없으면 404)
  const { id: uuid } = await ctx.params;
  const game = await resolveGameByUuid(uuid);
  if (!game) {
    return apiError("존재하지 않는 경기입니다.", 404, "GAME_NOT_FOUND");
  }
  const gameId = game.id;

  // 3. 권한 검증 — 게임 종료 + 호스트 OR 승인된 참가자
  const auth = await canReportGame(gameId, userId);
  if (!auth.canReport) {
    if (auth.reason === "GAME_NOT_FOUND") {
      return apiError("존재하지 않는 경기입니다.", 404, "GAME_NOT_FOUND");
    }
    if (auth.reason === "GAME_NOT_FINISHED") {
      return apiError(
        "종료된 경기에서만 리포트를 작성할 수 있습니다.",
        400,
        "GAME_NOT_FINISHED"
      );
    }
    // NOT_PARTICIPANT
    return apiError(
      "해당 경기 참가자만 리포트를 작성할 수 있습니다.",
      403,
      "NOT_PARTICIPANT"
    );
  }

  // 4. 본문 파싱 + zod 검증
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }
  const parsed = createReportSchema.safeParse(raw);
  if (!parsed.success) {
    // 상세 issue 는 노출하지 않음 — 422 + 일반 메시지
    return apiError("입력값이 유효하지 않습니다.", 422, "VALIDATION_ERROR");
  }
  const data = parsed.data;

  // 5. 트랜잭션: 부모(reports) + 자식(player_ratings) 일괄 생성
  // P2002 (@@unique 위반)는 "이미 제출된 리포트" 의미 → 409
  let createdReportId: bigint;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const report = await tx.game_reports.create({
        data: {
          game_id: gameId,
          reporter_user_id: userId,
          overall_rating: data.overall_rating,
          comment: data.comment ?? null,
          // mvp_user_id 는 유저가 BigInt 문자열로 보내므로 BigInt 변환
          mvp_user_id: data.mvp_user_id ? BigInt(data.mvp_user_id) : null,
        },
      });

      // 자식 ratings 일괄 삽입 (createMany 는 nested 가 아니라 별도 호출)
      await tx.game_player_ratings.createMany({
        data: data.ratings.map((r) => ({
          game_report_id: report.id,
          rated_user_id: BigInt(r.rated_user_id),
          rating: r.rating,
          flags: r.flags,
          is_noshow: r.is_noshow,
        })),
      });

      return report;
    });
    createdReportId = result.id;
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return apiError(
        "이미 이 경기에 대한 리포트를 제출했습니다.",
        409,
        "ALREADY_REPORTED"
      );
    }
    // 그 외는 그대로 throw — Next.js 가 500 처리
    throw e;
  }

  // 6. MVP 캐시 재계산 — 트랜잭션 외부에서 best-effort 실행
  // 실패해도 응답에는 영향 없도록 try/catch 로 흡수
  try {
    await recomputeFinalMvp(gameId);
  } catch {
    // 의도적 swallow: 다음 리포트 제출/수정 시 다시 갱신됨 (idempotent)
  }

  // 7. 응답 — 신규 생성 자원이므로 201
  // include ratings 까지 다시 읽어서 클라이언트에 반환
  const created = await prisma.game_reports.findUnique({
    where: { id: createdReportId },
    include: { ratings: true },
  });

  return apiSuccess({ report: serializeReport(created!) }, 201);
}

// ─────────────────────────────────────────────────────────────
// GET — 본인 리포트 조회 (수정 폼 prefill 용)
// IDOR: 복합 unique 키로 직접 자기 리포트만 조회
// ─────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, ctx: RouteCtx) {
  // 1. 세션 가드
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다.", 401, "UNAUTHORIZED");
  }
  const userId = BigInt(session.sub);

  // 2. uuid → game 조회
  const { id: uuid } = await ctx.params;
  const game = await resolveGameByUuid(uuid);
  if (!game) {
    return apiError("존재하지 않는 경기입니다.", 404, "GAME_NOT_FOUND");
  }
  const gameId = game.id;

  // 3. (game_id, reporter_user_id) 복합키로 본인 리포트 조회
  // — Prisma 가 자동 생성한 키 이름은 game_id_reporter_user_id
  const report = await prisma.game_reports.findUnique({
    where: {
      game_id_reporter_user_id: {
        game_id: gameId,
        reporter_user_id: userId,
      },
    },
    include: { ratings: true },
  });

  if (!report) {
    return apiError("작성한 리포트가 없습니다.", 404, "REPORT_NOT_FOUND");
  }

  // 4. 24h 수정 가능 여부 플래그 — 클라이언트가 수정 버튼 활성화 판단에 사용
  const canEdit = canEditReport(report.created_at);

  return apiSuccess({
    report: serializeReport(report),
    can_edit: canEdit,
  });
}

// ─────────────────────────────────────────────────────────────
// PATCH — 본인 리포트 수정 (24h 이내 + status==="submitted" 한정)
// ratings 는 부분 수정 대신 "전체 교체" 정책 — 단순/일관성 우선
// ─────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  // 1. 세션 가드
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다.", 401, "UNAUTHORIZED");
  }
  const userId = BigInt(session.sub);

  // 2. uuid → game 조회
  const { id: uuid } = await ctx.params;
  const game = await resolveGameByUuid(uuid);
  if (!game) {
    return apiError("존재하지 않는 경기입니다.", 404, "GAME_NOT_FOUND");
  }
  const gameId = game.id;

  // 3. 기존 리포트 조회 (IDOR — 본인 것만 검색됨)
  const existing = await prisma.game_reports.findUnique({
    where: {
      game_id_reporter_user_id: {
        game_id: gameId,
        reporter_user_id: userId,
      },
    },
    select: { id: true, created_at: true, status: true },
  });
  if (!existing) {
    return apiError("작성한 리포트가 없습니다.", 404, "REPORT_NOT_FOUND");
  }

  // 4. 24h 수정 윈도우 체크 — 만료 시 403
  if (!canEditReport(existing.created_at)) {
    return apiError(
      "리포트는 작성 후 24시간 이내에만 수정할 수 있습니다.",
      403,
      "EDIT_WINDOW_EXPIRED"
    );
  }

  // 5. status === "submitted" 인 경우만 수정 허용
  // (관리자 측에서 "reviewed"/"hidden" 등으로 상태 전이된 리포트는 잠금)
  if (existing.status !== "submitted") {
    return apiError(
      "현재 상태에서는 리포트를 수정할 수 없습니다.",
      409,
      "REPORT_NOT_EDITABLE"
    );
  }

  // 6. 본문 파싱 + zod 검증
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }
  const parsed = updateReportSchema.safeParse(raw);
  if (!parsed.success) {
    return apiError("입력값이 유효하지 않습니다.", 422, "VALIDATION_ERROR");
  }
  const data = parsed.data;

  // 7. 트랜잭션: 본문 update + ratings 전체 교체 (deleteMany → createMany)
  // 전체 교체 정책 이유: 부분 수정은 (a) 클라이언트 UX 가 복잡해지고
  // (b) @@unique([game_report_id, rated_user_id]) 충돌 회피 로직이 부담.
  await prisma.$transaction(async (tx) => {
    await tx.game_reports.update({
      where: { id: existing.id },
      data: {
        overall_rating: data.overall_rating,
        comment: data.comment ?? null,
        mvp_user_id: data.mvp_user_id ? BigInt(data.mvp_user_id) : null,
      },
    });

    // Cascade FK 가 자식 정리는 안 해주므로 명시적 deleteMany
    await tx.game_player_ratings.deleteMany({
      where: { game_report_id: existing.id },
    });

    await tx.game_player_ratings.createMany({
      data: data.ratings.map((r) => ({
        game_report_id: existing.id,
        rated_user_id: BigInt(r.rated_user_id),
        rating: r.rating,
        flags: r.flags,
        is_noshow: r.is_noshow,
      })),
    });
  });

  // 8. MVP 캐시 재계산 (best-effort)
  try {
    await recomputeFinalMvp(gameId);
  } catch {
    // swallow — POST 와 동일
  }

  // 9. 갱신된 리포트 재조회 후 반환
  const updated = await prisma.game_reports.findUnique({
    where: { id: existing.id },
    include: { ratings: true },
  });

  return apiSuccess({ report: serializeReport(updated!) });
}

// ─────────────────────────────────────────────────────────────
// 직렬화 헬퍼: BigInt/Date 를 string/ISO 로 변환
// apiSuccess 가 snake_case 변환은 해주지만 BigInt 직렬화는 직접 처리해야 함.
// ─────────────────────────────────────────────────────────────
type ReportWithRatings = Prisma.game_reportsGetPayload<{
  include: { ratings: true };
}>;

function serializeReport(r: ReportWithRatings) {
  return {
    id: r.id.toString(),
    game_id: r.game_id.toString(),
    reporter_user_id: r.reporter_user_id.toString(),
    overall_rating: r.overall_rating,
    comment: r.comment,
    mvp_user_id: r.mvp_user_id ? r.mvp_user_id.toString() : null,
    status: r.status,
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
    ratings: r.ratings.map((rt) => ({
      id: rt.id.toString(),
      rated_user_id: rt.rated_user_id.toString(),
      rating: rt.rating,
      flags: rt.flags,
      is_noshow: rt.is_noshow,
    })),
  };
}
