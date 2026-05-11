/**
 * 2026-05-11 — Phase 1 tournament-admin "기록 모드" 카드 BFF.
 *
 * 도메인 컨텍스트 (사용자 결재 §3 — 하이브리드 정책 c):
 *   - 대회 단위 default + 매치별 override (settings JSON 활용)
 *   - 카드에서 일괄 토글 시 본 라우트 호출 → 영향 매치 수 + audit 박제
 *   - schema 변경 0 (TournamentMatch.settings / Tournament.settings 활용)
 *
 * 엔드포인트:
 *   POST /api/web/admin/tournaments/[id]/recording-mode/bulk
 *     body: {
 *       mode: "flutter" | "paper",
 *       scope: "all" | "new_only" | "exclude_in_progress",
 *       reason: string,            // 5자 이상 — 운영 history 추적
 *     }
 *
 * scope 분기 (사용자 결재 §3 — 라디오 3개):
 *   - "all"                  → 모든 매치
 *   - "new_only"             → recording_mode 미설정 매치만 (settings 에 키 없음 = 신규 + 기존 unchanged)
 *   - "exclude_in_progress"  → status != "in_progress" 매치만 (라이브 진행 중 매치 보호)
 *
 * 권한 (canManageTournament 단일 진입점 — conventions.md):
 *   super_admin / tournament.organizerId / TAM is_active.
 *
 * audit 2층 박제 (forfeit fix 5단계 패턴 — decisions.md [2026-05-09]):
 *   1. tournament_match_audits createMany (source="mode_switch", 변경 매치마다 1행 — N+1 회피)
 *   2. admin_logs warning (action="tournament_recording_mode_bulk", payload={mode, scope, reason, affected_count})
 *
 * 응답 envelope: apiSuccess (snake_case 자동 변환 — errors.md 2026-04-17).
 *   { affected_count: number, mode, scope, default_changed: boolean }
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { canManageTournament } from "@/lib/auth/tournament-permission";
import {
  getRecordingMode,
  withRecordingMode,
  withTournamentDefaultMode,
  type RecordingMode,
} from "@/lib/tournaments/recording-mode";
import { adminLog } from "@/lib/admin/log";

// 본 라우트 입력 zod schema.
// reason 5자 이상 — 사용자 결재 명시 (운영 history 추적 필수).
const PostBodySchema = z.object({
  mode: z.enum(["flutter", "paper"]),
  scope: z.enum(["all", "new_only", "exclude_in_progress"]),
  reason: z
    .string()
    .trim()
    .min(5, "사유는 5자 이상 입력해주세요.")
    .max(500),
});

type Ctx = { params: Promise<{ id: string }> };

// scope="new_only" 분기에서 "신규 매치" 판단 = recording_mode 키 자체가 settings 에 없는 매치.
// settings={} / settings=null / settings={ otherKey: ... } 모두 신규로 간주.
// 명시적 recording_mode 키가 있는 매치는 운영자가 이미 의식적으로 설정한 매치 → 변경 skip.
function isNewMatch(settings: unknown): boolean {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    // 비객체/null 은 신규 매치로 간주 (한번도 운영자가 settings 만진 적 없음)
    return true;
  }
  return !("recording_mode" in (settings as Record<string, unknown>));
}

// POST /api/web/admin/tournaments/[id]/recording-mode/bulk
// id = tournamentId (uuid string).
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: tournamentId } = await params;

  // 1) 세션 검증 — 미로그인 = 401
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401);
  const userId = BigInt(session.sub);

  // 2) zod 입력 검증 (parse 실패 시 422 — VALIDATION_ERROR)
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }
  const parsed = PostBodySchema.safeParse(body);
  if (!parsed.success) {
    // zod 에러 메시지 첫번째만 사용자에게 노출 (내부 schema 상세 숨김 — response.ts validationError 패턴)
    const firstMsg = parsed.error.issues[0]?.message ?? "유효하지 않은 입력입니다.";
    return apiError(firstMsg, 422, "VALIDATION_ERROR");
  }
  const { mode: newMode, scope, reason } = parsed.data;

  // 3) tournament 존재 확인 + settings 추출 (default mode 보존용)
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, settings: true },
  });
  if (!tournament) return apiError("대회를 찾을 수 없습니다.", 404);

  // 4) 권한 검증 — canManageTournament 단일 진입점
  const allowed = await canManageTournament(tournamentId, userId, session);
  if (!allowed) return apiError("권한이 없습니다.", 403);

  // 5) 매치 list 1회 SELECT — settings/status 만 (BigInt id 만 select 해서 update 대상 추리기)
  // findMany 후 JS 에서 scope 분기 — N+1 회피 (매치당 update 만 트랜잭션 묶음)
  const allMatches = await prisma.tournamentMatch.findMany({
    where: { tournamentId },
    select: { id: true, settings: true, status: true },
  });

  // 6) scope 별 영향 매치 필터링
  const targetMatches = allMatches.filter((m) => {
    // 현재 매치 mode — 이미 newMode 이면 skip (idempotent / noise audit 방지)
    const currentMode: RecordingMode = getRecordingMode({ settings: m.settings });
    if (currentMode === newMode && !isNewMatch(m.settings)) {
      // 이미 동일 mode 가 명시 박제된 매치는 변경 skip (audit noise 줄이기)
      return false;
    }

    if (scope === "all") return true;
    if (scope === "exclude_in_progress") return m.status !== "in_progress";
    // scope === "new_only"
    return isNewMatch(m.settings);
  });

  // 7) tournament default mode 갱신 — bulk 호출 시 항상 동기화 (운영자 의도 박제)
  // 변경 전 default 도 산출해서 audit 박제 (default_changed 응답용)
  const oldDefault = ((): RecordingMode => {
    const s = tournament.settings;
    if (!s || typeof s !== "object" || Array.isArray(s)) return "flutter";
    return (s as Record<string, unknown>).default_recording_mode === "paper"
      ? "paper"
      : "flutter";
  })();
  const defaultChanged = oldDefault !== newMode;
  const newTournamentSettings = withTournamentDefaultMode(tournament.settings, newMode);

  // 8) 트랜잭션 1건 — tournament default UPDATE + 매치 일괄 UPDATE + audit createMany
  // 매치 수가 많을 수 있으므로 트랜잭션 안에서 Promise.all 로 병렬 처리 (각 매치 update 가 settings JSON merge 라 createMany 불가)
  try {
    await prisma.$transaction(async (tx) => {
      // 8-1) tournament.settings 갱신 (default mode 박제)
      await tx.tournament.update({
        where: { id: tournamentId },
        data: { settings: newTournamentSettings as object },
      });

      // 8-2) 매치별 settings UPDATE — settings JSON 의 다른 키 보존 (withRecordingMode)
      // 각 매치마다 다른 기존 settings 가 있을 수 있어서 raw SQL bulk 보다 개별 update 가 안전.
      // 매치 100건 = ~200ms 추가 (트랜잭션 안에서 병렬). 운영 대회 평균 30~50건 = 60~100ms.
      await Promise.all(
        targetMatches.map((m) =>
          tx.tournamentMatch.update({
            where: { id: m.id },
            data: {
              settings: withRecordingMode(m.settings, newMode) as object,
            },
          })
        )
      );

      // 8-3) audit createMany — per-match 1행. source="mode_switch" (기존 단일 라우트 동일).
      // context 에 bulk 표식 박제 — admin_logs 와 cross-reference 가능.
      if (targetMatches.length > 0) {
        await tx.tournament_match_audits.createMany({
          data: targetMatches.map((m) => ({
            matchId: m.id,
            changedBy: userId,
            source: "mode_switch",
            // context: bulk 작업 표식 + 사유 — 후속 분석/검색 용이
            context: `bulk_mode_switch ${scope} → ${newMode}: ${reason}`,
            // changes: before/after diff (per-match oldMode 산출)
            changes: {
              recording_mode: {
                before: getRecordingMode({ settings: m.settings }),
                after: newMode,
              },
              scope,
              reason,
            },
          })),
        });
      }
    });
  } catch (err) {
    console.error(
      `[recording-mode/bulk] tournament=${tournamentId} scope=${scope} mode=${newMode} failed:`,
      err
    );
    return apiError("일괄 모드 전환에 실패했습니다.", 500);
  }

  // 9) admin_logs warning 박제 — 트랜잭션 외부 (fire-and-forget, adminLog 내부 try/catch).
  // bulk 작업은 일반 단일 토글보다 영향 ↑ 이므로 severity=warning 명시 (decisions.md [2026-05-09]).
  await adminLog("tournament_recording_mode_bulk", "Tournament", {
    resourceId: tournamentId,
    targetType: "Tournament",
    description: `${scope} → ${newMode} (${targetMatches.length}건): ${reason}`,
    changesMade: {
      mode: newMode,
      scope,
      reason,
      affected_count: targetMatches.length,
      default_changed: defaultChanged,
      old_default: oldDefault,
    },
    previousValues: {
      default_recording_mode: oldDefault,
    },
    severity: "warning",
  });

  // 10) 응답 — snake_case 자동 변환 (apiSuccess)
  return apiSuccess({
    affected_count: targetMatches.length,
    total_match_count: allMatches.length,
    mode: newMode,
    scope,
    default_changed: defaultChanged,
  });
}
