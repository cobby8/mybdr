/**
 * 2026-05-11 — Phase 1-A 매치별 recording_mode admin 토글 API.
 *
 * 도메인 컨텍스트 (decisions.md [2026-05-11] §3 / scratchpad 결재 3):
 *   - 매치 단위 mode 게이팅 ("flutter" | "paper") — Flutter ↔ 웹 충돌 자체 차단.
 *   - 본 라우트 = 운영자가 매치별 mode 전환 1회 호출.
 *   - settings JSON 의 recording_mode 키만 갱신 (기존 settings 보존).
 *   - schema 변경 0 (settings 컬럼 이미 존재).
 *
 * 엔드포인트:
 *   POST /api/web/admin/matches/[id]/recording-mode
 *     body: { mode: "flutter" | "paper", reason?: string }
 *
 * 권한 (Q7 youtube-stream 패턴 차용):
 *   super_admin / tournament.organizerId / tournamentAdminMember(is_active=true).
 *
 * audit 박제 2 곳 (forfeit fix 5단계 절차 패턴 — decisions.md [2026-05-09]):
 *   1. tournament_match_audits (source="mode_switch") — 매치 변경 이력 1-stop
 *   2. admin_logs (action="match_recording_mode_change", severity="warning") — 관리자 감사
 *
 * 응답 envelope: apiSuccess() / apiError() — snake_case 자동 변환.
 *   성공 응답: { recording_mode: "flutter" | "paper", match_id: "..." }
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { canManageMatchStream } from "@/lib/auth/match-stream";
import {
  getRecordingMode,
  withRecordingMode,
} from "@/lib/tournaments/recording-mode";
import { adminLog } from "@/lib/admin/log";

// 본 라우트 입력 zod schema.
// reason 은 권장 사항 (운영 history 추적용) — 선택. mode 만 필수.
const PostBodySchema = z.object({
  mode: z.enum(["flutter", "paper"]),
  reason: z.string().trim().max(200).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

// POST /api/web/admin/matches/[id]/recording-mode
// id = matchId (BigInt string).
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  // 1) 세션 검증 — 미로그인 = 401
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401);
  const userId = BigInt(session.sub);

  // 2) matchId BigInt 변환 가드 (TC-026 패턴)
  const matchBigInt = parseBigIntParam(id);
  if (matchBigInt === null) {
    return apiError("경기를 찾을 수 없습니다.", 404);
  }

  // 3) zod 입력 검증
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }
  const parsed = PostBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("유효하지 않은 입력입니다.", 422, "VALIDATION_ERROR");
  }
  const { mode: newMode, reason } = parsed.data;

  // 4) 매치 조회 + 권한 검증
  // matchId 존재 + settings 추출 (audit 박제용 oldMode 산출)
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchBigInt },
    select: {
      id: true,
      tournamentId: true,
      status: true,
      settings: true,
    },
  });
  if (!match) return apiError("경기를 찾을 수 없습니다.", 404);

  // 권한 — super_admin / organizer / tournamentAdminMember
  // canManageMatchStream 패턴 차용 (matchId 단일 인자 — 본 라우트가 matchId 만 받으므로 적합)
  const allowed = await canManageMatchStream(userId, matchBigInt, session);
  if (!allowed) return apiError("권한이 없습니다.", 403);

  // 5) oldMode 산출 — audit 박제용 (idempotent 검사용도)
  const oldMode = getRecordingMode({ settings: match.settings });

  // 변경 없음 — 응답만 반환 (audit 박제 skip — noise 줄이기)
  if (oldMode === newMode) {
    return apiSuccess({
      recording_mode: newMode,
      match_id: matchBigInt.toString(),
      changed: false,
    });
  }

  // 6) settings 갱신 — recording_mode 만 set / 기존 keys 보존
  const newSettings = withRecordingMode(match.settings, newMode);

  // 7) DB 업데이트 + audit 박제 (트랜잭션 1건)
  // - tournament_match_audits: source="mode_switch" (신규 분류 — admin/flutter/system 외)
  // - 동일 트랜잭션 안에서 처리 — UPDATE 성공 시만 audit 박제 보장
  try {
    await prisma.$transaction(async (tx) => {
      await tx.tournamentMatch.update({
        where: { id: matchBigInt },
        data: {
          // settings 통째 set (recording_mode 만 변경된 신규 객체 — withRecordingMode 가 보존)
          settings: newSettings as object,
        },
      });

      await tx.tournament_match_audits.create({
        data: {
          matchId: matchBigInt,
          changedBy: userId,
          source: "mode_switch",
          context: `recording_mode ${oldMode} → ${newMode}${reason ? `: ${reason}` : ""}`,
          // changes = before/after diff (JSON) — 표준 audit 형식
          changes: {
            recording_mode: { before: oldMode, after: newMode },
            ...(reason ? { reason } : {}),
          },
        },
      });
    });
  } catch (err) {
    console.error(
      `[recording-mode] match=${matchBigInt} ${oldMode}→${newMode} failed:`,
      err
    );
    return apiError("모드 전환에 실패했습니다.", 500);
  }

  // 8) admin_logs warning 박제 (forfeit fix 5단계 패턴 — decisions.md [2026-05-09]).
  //    중요 운영 액션이므로 severity=warning + 사유 박제 (PIPA / 운영 감사 추적).
  //    fire-and-forget — 박제 실패가 응답 실패를 만들지 않도록 (adminLog 내부 catch).
  await adminLog("match_recording_mode_change", "TournamentMatch", {
    resourceId: matchBigInt,
    targetType: "Tournament",
    targetId: match.tournamentId,
    description: reason ?? `${oldMode} → ${newMode}`,
    changesMade: {
      recording_mode: { before: oldMode, after: newMode },
      ...(reason ? { reason } : {}),
    },
    previousValues: { recording_mode: oldMode },
    severity: "warning",
  });

  // 9) 응답 (snake_case 자동 변환 — apiSuccess 가 처리)
  return apiSuccess({
    recording_mode: newMode,
    match_id: matchBigInt.toString(),
    changed: true,
  });
}
