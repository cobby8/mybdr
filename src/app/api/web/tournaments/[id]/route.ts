import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { updateTournamentSchema } from "@/lib/validation/tournament";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getTournament, updateTournament } from "@/lib/services/tournament";
// 2026-05-12 PR1 — series_id 변경 시 시리즈 소유자 검증 헬퍼.
import {
  requireSeriesOwner,
  SeriesPermissionError,
} from "@/lib/auth/series-permission";
// 2026-05-12 Phase B — DELETE 시 super_admin 분기 + admin_logs 박제.
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { adminLog } from "@/lib/admin/log";

// 다른 시리즈로 "이동" 가능한 대회 status — Q2 결재: draft/registration_open 만 허용.
// 분리(null) 는 모든 status 에서 허용.
// 이유: in_progress/completed 진행 중 대회를 다른 시리즈로 이동하면 단체 events 탭 데이터
//   일관성 깨짐 (이미 노출된 대회가 다른 단체로 점프). 분리만 허용해 운영 fix 여지 보존.
const SERIES_CHANGE_ALLOWED_STATUSES = new Set(["draft", "registration_open"]);

type Ctx = { params: Promise<{ id: string }> };

// GET /api/web/tournaments/[id]
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const tournament = await getTournament(id);

  if (!tournament)
    return apiError("대회를 찾을 수 없습니다.", 404);

  return apiSuccess(tournament);
}

// PATCH /api/web/tournaments/[id]
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  const result = updateTournamentSchema.safeParse(body);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return apiError(firstIssue?.message ?? "유효하지 않은 값입니다.", 400);
  }

  const data = result.data;

  // T3-02: completed로 변경 시 미완료 경기 존재하면 에러
  if (data.status === "completed") {
    const incompleteMatches = await prisma.tournamentMatch.count({
      where: {
        tournamentId: id,
        status: { notIn: ["completed", "cancelled"] },
      },
    });
    if (incompleteMatches > 0) {
      return apiError(`미완료 경기가 ${incompleteMatches}건 있습니다. 모든 경기를 완료한 후 대회를 종료하세요.`, 400);
    }
  }

  // Zod 검증 통과된 데이터를 Prisma update 형식으로 변환
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.format !== undefined) updateData.format = data.format;
  if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.venue_name !== undefined) updateData.venue_name = data.venue_name;
  if (data.venue_address !== undefined) updateData.venue_address = data.venue_address;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.district !== undefined) updateData.district = data.district;
  if (data.maxTeams !== undefined) updateData.maxTeams = data.maxTeams;
  if (data.team_size !== undefined) updateData.team_size = data.team_size;
  if (data.roster_min !== undefined) updateData.roster_min = data.roster_min;
  if (data.roster_max !== undefined) updateData.roster_max = data.roster_max;
  if (data.entry_fee !== undefined) updateData.entry_fee = data.entry_fee;
  if (data.registration_start_at !== undefined) updateData.registration_start_at = data.registration_start_at ? new Date(data.registration_start_at) : null;
  if (data.registration_end_at !== undefined) updateData.registration_end_at = data.registration_end_at ? new Date(data.registration_end_at) : null;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.rules !== undefined) updateData.rules = data.rules;
  if (data.prize_info !== undefined) updateData.prize_info = data.prize_info;
  if (data.is_public !== undefined) updateData.is_public = data.is_public;
  if (data.auto_approve_teams !== undefined) updateData.auto_approve_teams = data.auto_approve_teams;
  if (data.primary_color !== undefined) updateData.primary_color = data.primary_color;
  if (data.secondary_color !== undefined) updateData.secondary_color = data.secondary_color;
  // 접수 설정
  if (data.categories !== undefined) updateData.categories = data.categories;
  if (data.div_caps !== undefined) updateData.div_caps = data.div_caps;
  if (data.div_fees !== undefined) updateData.div_fees = data.div_fees;
  if (data.allow_waiting_list !== undefined) updateData.allow_waiting_list = data.allow_waiting_list;
  if (data.waiting_list_cap !== undefined) updateData.waiting_list_cap = data.waiting_list_cap;
  if (data.bank_name !== undefined) updateData.bank_name = data.bank_name;
  if (data.bank_account !== undefined) updateData.bank_account = data.bank_account;
  if (data.bank_holder !== undefined) updateData.bank_holder = data.bank_holder;
  if (data.fee_notes !== undefined) updateData.fee_notes = data.fee_notes;
  // 새 필드: 주최/주관/후원/성별/경기설정/장소
  if (data.organizer !== undefined) updateData.organizer = data.organizer;
  if (data.host !== undefined) updateData.host = data.host;
  if (data.sponsors !== undefined) updateData.sponsors = data.sponsors;
  if (data.gender !== undefined) updateData.gender = data.gender;
  if (data.game_time !== undefined) updateData.game_time = data.game_time;
  if (data.game_ball !== undefined) updateData.game_ball = data.game_ball;
  if (data.game_method !== undefined) updateData.game_method = data.game_method;
  if (data.places !== undefined) updateData.places = data.places;
  // 디자인 템플릿 + 이미지 URL
  if (data.design_template !== undefined) updateData.design_template = data.design_template;
  if (data.logo_url !== undefined) updateData.logo_url = data.logo_url || null;
  if (data.banner_url !== undefined) updateData.banner_url = data.banner_url || null;
  if (data.court_bg_url !== undefined) updateData.court_bg_url = data.court_bg_url || null;

  // settings JSON — 기존 settings와 머지하여 업데이트 (contact_phone 등)
  if (data.settings !== undefined) {
    const current = await prisma.tournament.findUnique({ where: { id }, select: { settings: true } });
    const existing = (current?.settings as Record<string, unknown>) ?? {};
    const incoming = data.settings as Record<string, unknown>;
    updateData.settings = { ...existing, ...incoming };
  }

  // 2026-05-12 PR1 — series_id 분리 처리.
  // 이유: series_id 변경은 (1) 권한 검증 (2) status 가드 (3) 카운터 동기화 (이전 시리즈 -1 / 새
  //   시리즈 +1) 가 묶여있어 일반 필드 처리와 별도 $transaction 으로 원자적 처리해야 한다.
  //   updateTournament(id, data) 서비스 함수는 단순 prisma.update wrapper 라 카운터 로직을 거기에
  //   넣으면 다른 호출자(생성/wizard)에도 side-effect 영향 — route 단에서 명시 처리.
  // data.series_id: undefined = 무변경 / null = 분리 / "8" = 변경.
  if (data.series_id !== undefined) {
    // 현재 대회 row 조회 — status 가드 + 이전 series_id (카운터 감소 대상) 확보.
    const currentTournament = await prisma.tournament.findUnique({
      where: { id },
      select: { status: true, series_id: true },
    });

    if (!currentTournament) {
      return apiError("대회를 찾을 수 없습니다.", 404);
    }

    // 새 series_id 파싱 — null = 분리, 문자열 = BigInt 변환.
    // 빈 문자열은 분리로 취급 (UI 드롭다운 "선택 안 함" 옵션이 "" 보낼 수 있음).
    let newSeriesId: bigint | null;
    if (data.series_id === null || data.series_id === "") {
      newSeriesId = null;
    } else {
      try {
        newSeriesId = BigInt(data.series_id);
      } catch {
        return apiError("유효하지 않은 시리즈 ID입니다.", 400);
      }
    }

    const previousSeriesId = currentTournament.series_id;

    // 변경 없음(같은 값) — 카운터 동기화 skip, 일반 update 흐름에 합류 X (이미 무영향).
    const isSame =
      (previousSeriesId === null && newSeriesId === null) ||
      (previousSeriesId !== null &&
        newSeriesId !== null &&
        previousSeriesId === newSeriesId);

    if (!isSame) {
      // 다른 시리즈로 "이동" (newSeriesId !== null) 시 status 가드.
      // null 분리는 모든 status 허용 (Q2 결재).
      if (
        newSeriesId !== null &&
        !SERIES_CHANGE_ALLOWED_STATUSES.has(currentTournament.status ?? "")
      ) {
        return apiError(
          "진행 중이거나 종료된 대회는 시리즈 변경이 불가합니다. 분리만 가능합니다.",
          400,
        );
      }

      // 새 시리즈로 이동 시 권한 검증 — 본인 소유 시리즈만 (super_admin 우회 허용).
      if (newSeriesId !== null) {
        try {
          await requireSeriesOwner(newSeriesId, auth.userId, {
            allowSuperAdmin: true,
            session: auth.session,
          });
        } catch (e) {
          if (e instanceof SeriesPermissionError) {
            return apiError(e.message, e.status);
          }
          throw e;
        }
      }

      // 카운터 동기화 + 대회 update 를 $transaction 으로 원자적 처리.
      // 이전 시리즈 -1 / 새 시리즈 +1 / tournament UPDATE — 셋 중 하나라도 실패 시 전체 롤백.
      // 일반 필드 update 도 같은 transaction 안에 합류 (한 번의 DB 왕복).
      const updated = await prisma.$transaction(async (tx) => {
        // 이전 시리즈 카운터 -1 (NULL → 분리/이동 시 skip)
        if (previousSeriesId !== null) {
          await tx.tournament_series.update({
            where: { id: previousSeriesId },
            data: { tournaments_count: { decrement: 1 } },
          });
        }
        // 새 시리즈 카운터 +1 (NULL = 분리만 시 skip)
        if (newSeriesId !== null) {
          await tx.tournament_series.update({
            where: { id: newSeriesId },
            data: { tournaments_count: { increment: 1 } },
          });
        }
        // 대회 UPDATE — series_id + 나머지 일반 필드 함께
        return tx.tournament.update({
          where: { id },
          data: { ...updateData, series_id: newSeriesId },
        });
      });

      return apiSuccess(updated);
    }
    // isSame 이면 일반 update 흐름으로 fallthrough (series_id 는 updateData 에 안 넣음 — 무영향).
  }

  const updated = await updateTournament(id, updateData);

  return apiSuccess(updated);
}

// ============================================================
// DELETE /api/web/tournaments/[id]
// ============================================================
// 2026-05-12 Phase B 정합성 가드 신규 — 대회 삭제 흐름 자체 부재 차단.
//
// 정책 (사용자 결재 default — 추후 변경 가능):
//   - Soft DELETE (default): status='cancelled' UPDATE + 카운터 변경 X (현재 카운터 룰 = status 무관 전체 count).
//     · 권한: tournament organizer 본인 + super_admin (TAM 도 통과 — requireTournamentAdmin 자동 분기).
//     · 복구: PATCH status='draft' 등으로 운영 복원 가능.
//   - Hard DELETE (`?hard=1`): row 실제 삭제 + series 카운터 -1 + cascade 정책 (현재 schema FK NoAction
//     이라 cascade X — 사전 정리 책임은 호출자/운영자에게).
//     · 권한: super_admin only (운영 안전상 일반 organizer 차단).
//     · 위험: 관련 매치/팀/통계가 NoAction FK 로 묶여있으면 외래키 위반 에러 — 호출자가 사전 정리 필요.
//
// 후속 큐: Phase D 에서 단체 admin/owner 도 단체 소속 시리즈 대회 DELETE 가능하도록 권한 확장.
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  // hard 쿼리 파라미터 — "1" / "true" 면 hard delete 모드. 그 외 (없음/0/false) 는 soft.
  const hardParam = req.nextUrl.searchParams.get("hard");
  const isHard = hardParam === "1" || hardParam === "true";

  // 현재 대회 row — series_id (카운터 -1 대상) 확보 + 존재 검증.
  const currentTournament = await prisma.tournament.findUnique({
    where: { id },
    select: { id: true, name: true, status: true, series_id: true, organizerId: true },
  });

  if (!currentTournament) {
    return apiError("대회를 찾을 수 없습니다.", 404);
  }

  if (isHard) {
    // Hard DELETE — super_admin 만 허용 (운영 안전상).
    // requireTournamentAdmin 가 organizer/TAM 도 통과시키므로 super_admin 추가 검증 필요.
    if (!isSuperAdmin(auth.session)) {
      return apiError("Hard DELETE 는 super_admin 만 가능합니다.", 403);
    }

    // $transaction — (1) tournament 실제 삭제 (2) series 카운터 -1.
    // FK NoAction 이라 관련 row (매치/팀/통계) 가 있으면 외래키 위반 throw — 운영자가 사전 정리 책임.
    try {
      await prisma.$transaction(async (tx) => {
        await tx.tournament.delete({ where: { id } });
        if (currentTournament.series_id !== null) {
          await tx.tournament_series.update({
            where: { id: currentTournament.series_id },
            data: { tournaments_count: { decrement: 1 } },
          });
        }
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // FK 위반 — Prisma P2003 등.
      if (msg.includes("Foreign key") || msg.includes("P2003")) {
        return apiError(
          "관련 매치/팀/통계가 남아있어 삭제할 수 없습니다. 사전 정리 후 다시 시도하세요.",
          409,
        );
      }
      throw e;
    }

    // 감사 로그 — critical (영구 삭제).
    await adminLog("tournament_hard_delete", "tournament", {
      resourceId: undefined, // tournament.id 는 UUID 문자열 — admin_logs.resource_id 는 BigInt 라 박제 불가
      targetType: "tournament",
      description: `대회 영구 삭제 (Hard DELETE): ${currentTournament.name} (${currentTournament.id})`,
      previousValues: {
        id: currentTournament.id,
        name: currentTournament.name,
        status: currentTournament.status,
        series_id: currentTournament.series_id?.toString() ?? null,
        organizer_id: currentTournament.organizerId.toString(),
      },
      severity: "critical",
    });

    return apiSuccess({ deleted: true, mode: "hard", id: currentTournament.id });
  }

  // Soft DELETE — status='cancelled' UPDATE.
  // 이미 cancelled 상태면 멱등 처리 (재요청 안전).
  if (currentTournament.status === "cancelled") {
    return apiSuccess({ deleted: true, mode: "soft", id: currentTournament.id, alreadyCancelled: true });
  }

  const previousStatus = currentTournament.status;
  await prisma.tournament.update({
    where: { id },
    data: { status: "cancelled" },
  });

  // 감사 로그 — warning (복구 가능, 운영 액션 추적).
  await adminLog("tournament_soft_delete", "tournament", {
    targetType: "tournament",
    description: `대회 취소 (Soft DELETE): ${currentTournament.name} (${currentTournament.id})`,
    previousValues: {
      id: currentTournament.id,
      name: currentTournament.name,
      status: previousStatus,
    },
    changesMade: { status: "cancelled" },
    severity: "warning",
  });

  return apiSuccess({ deleted: true, mode: "soft", id: currentTournament.id });
}
