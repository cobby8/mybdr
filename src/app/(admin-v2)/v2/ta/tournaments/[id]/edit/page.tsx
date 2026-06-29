// ============================================================
// [id]/edit/page.tsx — 대회 수정 마법사 진입(R5-B · 서버 컴포넌트)
//   - 권한: 부모 (admin-v2)/v2/layout(membershipType≥3/super) + ta/layout(TaShell) 위에
//     ★대회 단위 운영 권한★(canManageTournament — organizer/adminMember/단체admin/super) 추가.
//     미권한 → 대회 목록 리다이렉트. 없는 대회 → notFound.
//   - 데이터 READ = 서버 Prisma 직접(raw fetch 0). jsonb(categories/div_*/places/
//     schedule_dates/game_rules)는 verbatim 스칼라/배열 lookup(F-2b 재귀변환 0).
//   - prefill → FormState 매핑 후 클라 EditWizard 마운트.
//   ⚠ 백엔드/DB/Prisma 0변경. 수정 = PATCH /api/web/tournaments/[id](클라에서 호출).
// ============================================================

import { notFound, redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { canManageTournament } from "@/lib/auth/tournament-permission";
import { normalizeGameRules } from "@/lib/tournaments/game-rules";
import { EditWizard, type EditMeta } from "./_edit-wizard";
import type { FormState } from "../../new/_create-wizard";
import { sponsorsFromValue } from "../../new/_create-wizard";
import { divisionsFromTournament } from "../../new/_form-prefill";

export const dynamic = "force-dynamic";

// 대회 status → 표시 라벨 + ct-pill data-tone (operate page statusPill 1:1)
function statusPill(s: string | null | undefined): EditMeta {
  switch (s) {
    case "in_progress":
      return { statusLabel: "진행중", statusTone: "ok" };
    case "published":
    case "registration_open":
    case "open":
      return { statusLabel: "접수중", statusTone: "info" };
    case "draft":
      return { statusLabel: "준비중", statusTone: "mute" };
    case "completed":
      return { statusLabel: "종료", statusTone: "mute" };
    case "cancelled":
      return { statusLabel: "취소", statusTone: "err" };
    default:
      return { statusLabel: s || "준비중", statusTone: "mute" };
  }
}

// jsonb 안전 객체화(F-2b — 재귀변환 0, 값 verbatim)
function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
function jsonNum(v: unknown, d: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return d;
}
// Date(UTC) → datetime-local 문자열 "YYYY-MM-DDTHH:mm".
//   ★ UTC slice 사용 = 라운드트립 정확성 우선(저장 시 new Date(문자열)=UTC 로 동일 복원).
//     KST 변환을 쓰면 미변경 저장에도 시간이 밀려 운영 대회 시간 손상 위험 → UTC 고정.
function toLocalInput(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 16);
}

export default async function EditTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // ── 권한: 이 대회 운영 권한(organizer/adminMember active/단체admin/super) ──
  const session = await getWebSession();
  const userId = session ? BigInt(session.sub) : BigInt(0);
  const allowed = await canManageTournament(id, userId, session);
  if (!allowed) redirect("/v2/ta/tournaments");

  // ── 데이터 READ (Prisma 직접) ──
  const [t, ruleRows] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id },
      select: {
        name: true,
        status: true,
        format: true,
        startDate: true,
        endDate: true,
        organizer: true,
        host: true,
        sponsors: true,
        description: true,
        rules: true,
        prize_info: true,
        entry_fee: true,
        team_size: true,
        roster_min: true,
        roster_max: true,
        registration_start_at: true,
        registration_end_at: true,
        bank_name: true,
        bank_account: true,
        bank_holder: true,
        fee_notes: true,
        auto_approve_teams: true,
        allow_waiting_list: true,
        waiting_list_cap: true,
        game_ball: true,
        logo_url: true,
        banner_url: true,
        game_rules: true,
        categories: true,
        div_caps: true,
        div_fees: true,
        places: true,
        schedule_dates: true,
      },
    }),
    prisma.tournamentDivisionRule.findMany({
      where: { tournamentId: id },
      orderBy: { sortOrder: "asc" },
      // 종별별 진행방식 복원 — format/settings 포함(prefill 헬퍼가 디비전명 매칭으로 부착).
      select: { code: true, label: true, feeKrw: true, format: true, settings: true },
    }),
  ]);

  if (!t) notFound();

  const meta = statusPill(t.status);
  const entryFee = Number(t.entry_fee ?? 0); // Decimal/number/null → number(FormState.entryFee)

  // 종별 prefill — categories(그룹 펼침) 우선, 없으면 division rule 폴백(공용 헬퍼).
  //   ★ 레거시 그룹 {종별명:[디비전,...]} 도 디비전 단위로 펼쳐 category 태깅(생성 마법사와 일관).
  const divisions: FormState["divisions"] = divisionsFromTournament(
    t.categories,
    t.div_caps,
    t.div_fees,
    ruleRows,
    entryFee,
  );

  // 장소 prefill — places jsonb(★ 저장된 id 보존: court id = `${id}_c${n}` 참조 무결성 유지)
  //   rawPlacesById = id→원본객체 맵(저장 시 지도 메타 보존용)
  const places = Array.isArray(t.places) ? (t.places as unknown[]) : [];
  const rawPlacesById: Record<string, Record<string, unknown>> = {};
  const venues: FormState["venues"] = places
    .map((row, index) => {
      const r = asObj(row);
      const name = typeof r.name === "string" ? r.name.trim() : "";
      if (!name) return null;
      const cc = jsonNum(r.courtCount ?? r.court_count, 1);
      const vid = typeof r.id === "string" && r.id ? r.id : `v_${index}`;
      rawPlacesById[vid] = r; // 원본 보존(lat/lng/address/mapUrl 등)
      return {
        id: vid,
        name,
        region: typeof r.region === "string" ? r.region : "",
        courtCount: cc > 0 ? Math.trunc(cc) : 1,
        naming: r.naming === "alpha" ? ("alpha" as const) : ("num" as const),
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  // 일정 prefill — schedule_dates jsonb(★ 저장된 id + court_ids verbatim 보존)
  const schedRows = Array.isArray(t.schedule_dates) ? (t.schedule_dates as unknown[]) : [];
  const dates: FormState["dates"] = schedRows
    .map((row, index) => {
      const r = asObj(row);
      const date = typeof r.date === "string" ? r.date.trim() : "";
      if (!date) return null;
      const rawCourtIds = r.court_ids ?? r.courtIds;
      return {
        id: typeof r.id === "string" && r.id ? r.id : `dt_${index}`,
        date,
        courtIds: Array.isArray(rawCourtIds)
          ? rawCourtIds.filter((c): c is string => typeof c === "string")
          : [],
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  // 경기설정 prefill — game_rules jsonb → normalizeGameRules 로 19키 전체 정규화.
  //   ★ 14개 신규 키가 undefined 면 컨트롤(Stepper/SegSm)이 깨지므로 디폴트로 채움.
  //   gr = 원본 전체(저장 시 고급 필드 보존용으로 그대로 EditWizard 에 전달)
  const gr = asObj(t.game_rules);
  const gameRules: FormState["gameRules"] = normalizeGameRules(gr);

  const initialForm: FormState = {
    name: t.name ?? "",
    organizer: t.organizer ?? "",
    host: t.host ?? "",
    sponsors: sponsorsFromValue(t.sponsors), // 후원사 칩 복원(배열/문자열 형태 무관 방어)
    description: t.description ?? "",
    venues,
    dates,
    format: t.format || "single_elimination",
    divisions,
    gameBall: t.game_ball ?? "",
    teamSize: t.team_size ?? 5,
    rosterMin: t.roster_min ?? 5,
    rosterMax: t.roster_max ?? 12,
    rules: t.rules ?? "",
    prize: t.prize_info ?? "",
    gameRules,
    regStart: toLocalInput(t.registration_start_at),
    regEnd: toLocalInput(t.registration_end_at),
    bankName: t.bank_name ?? "",
    bankAccount: t.bank_account ?? "",
    bankHolder: t.bank_holder ?? "",
    entryFee,
    feeNotes: t.fee_notes ?? "",
    autoApprove: t.auto_approve_teams ?? false,
    allowWaiting: t.allow_waiting_list ?? true,
    waitingCap: t.waiting_list_cap ?? null, // 대기 정원 prefill(없으면 무제한)
    logoUrl: t.logo_url ?? "", // 대표 로고 prefill(없으면 미설정)
    bannerUrl: t.banner_url ?? "", // 대표 포스터 prefill(없으면 미설정)
  };

  return (
    <EditWizard
      tournamentId={id}
      tournamentName={t.name || "이름 미정"}
      meta={meta}
      initialForm={initialForm}
      rawPlacesById={rawPlacesById}
      rawGameRules={gr}
    />
  );
}
