/**
 * 2026-05-12 Phase 3.5 — 종별 진행 방식 (format + settings) 관리 API.
 *
 * 도메인:
 *   - Tournament.format = 단일 enum (대회 전체 1 진행 방식 가정).
 *   - 강남구협회장배 = 6 종별 × 다른 진행 방식 (i3-U9 링크제 / i2-U11 듀얼 / 등)
 *   - TournamentDivisionRule.format 컬럼 (Phase 3.5 신설) → 종별 단위 박제.
 *
 * 엔드포인트:
 *   GET  /api/web/admin/tournaments/[id]/division-rules
 *        → 종별 룰 목록 + format + settings
 *
 *   PATCH /api/web/admin/tournaments/[id]/division-rules/[ruleId]
 *        body: { format?, settings?, groupCount?, ... }
 *        → 단일 종별 룰 UPDATE
 *
 * 권한: canManageTournament (super_admin / organizer / TAM / 단체 admin).
 */

import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { canManageTournament } from "@/lib/auth/tournament-permission";
import { apiSuccess, unauthorized, forbidden } from "@/lib/api/response";
// 2026-05-12 Phase 3.5-D — ALLOWED_FORMATS 단일 source of truth (lib/tournaments/division-formats.ts).
import { ALLOWED_FORMATS } from "@/lib/tournaments/division-formats";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getWebSession();
  if (!session) return unauthorized();
  const userId = BigInt(session.sub);
  const allowed = await canManageTournament(id, userId, session);
  if (!allowed) return forbidden();

  const rules = await prisma.tournamentDivisionRule.findMany({
    where: { tournamentId: id },
    orderBy: { sortOrder: "asc" },
  });

  // 2026-06-22 F-2b — 디비전별 날짜/코트 표시용 읽기 select(추가만, write 0).
  //   새 생성폼이 settings.div_schedule({디비전명:{dateId,courtId}}) 에 저장한 일정을
  //   divisions 화면에서 사람이 읽는 라벨로 역참조하려면 schedule_dates/places 가 필요.
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { settings: true, schedule_dates: true, places: true },
  });
  // settings.div_schedule 만 추출(나머지 settings 키는 표시에 불필요).
  const settingsObj =
    tournament?.settings && typeof tournament.settings === "object"
      ? (tournament.settings as Record<string, unknown>)
      : {};

  // 🔑 div_schedule 을 map → 배열로 변환하는 이유:
  //   apiSuccess() = convertKeysToSnakeCase 가 응답 전체를 재귀 변환한다(case.ts L5~18).
  //   원본 map {디비전명:{dateId,courtId}} 를 그대로 내보내면
  //     ① 내부 키 dateId/courtId → date_id/court_id 변환(소비처 정합 깨짐)
  //     ② 디비전명이 "키" 라서 영문 디비전명(U10)까지 snake 변환됨 → "_u10" 으로 망가짐
  //   → 디비전명을 "값"(division 필드)으로 옮긴 배열로 만들면 디비전명은 보존되고
  //     내부 식별자만 snake(date_id/court_id) 로 변환된다. 소비처는 배열 + snake 로 읽는다.
  const rawDivSchedule = settingsObj.div_schedule;
  const divScheduleList: Array<{
    division: string;
    dateId?: unknown;
    courtId?: unknown;
  }> =
    rawDivSchedule && typeof rawDivSchedule === "object"
      ? Object.entries(rawDivSchedule as Record<string, unknown>).map(
          ([division, v]) => {
            const entry =
              v && typeof v === "object" ? (v as Record<string, unknown>) : {};
            return {
              division, // 디비전명 = 값 → snake 변환 영향 없음(원본 보존)
              dateId: entry.dateId, // → 응답에선 date_id 로 변환됨
              courtId: entry.courtId, // → 응답에선 court_id 로 변환됨
            };
          },
        )
      : [];

  return apiSuccess({
    rules: rules.map((r) => ({
      id: r.id.toString(),
      code: r.code,
      label: r.label,
      grade_min: r.gradeMin,
      grade_max: r.gradeMax,
      fee_krw: r.feeKrw,
      sort_order: r.sortOrder,
      format: r.format,
      settings: r.settings,
    })),
    allowed_formats: ALLOWED_FORMATS,
    // F-2b 읽기 추가분 — 디비전 일정 역참조 데이터(배열·apiSuccess 가 snake 변환)
    div_schedule: divScheduleList,
    schedule_dates: tournament?.schedule_dates ?? [],
    places: tournament?.places ?? [],
  });
}
