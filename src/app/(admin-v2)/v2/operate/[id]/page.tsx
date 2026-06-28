// ============================================================
// operate/[id]/page.tsx — 대회 운영 워크스페이스 (R4-A)
//   정본 operate.jsx OperateWorkspace 1:1. 특정 대회(by id)의 운영 화면.
//   - 권한: 해당 대회 canManageTournament(organizer/adminMember active/super).
//     미권한 → 대회 목록으로 리다이렉트(차단). 없는 대회 → notFound.
//   - 데이터 READ = 서버 Prisma 직접(raw fetch 0). snake → 표시 도메인 단일 매핑.
//     jsonb(div_caps)는 verbatim 스칼라 lookup만(F-2b 함정 회피).
//   - 백엔드/DB 0변경. 셸/패널은 클라(_operate-shell)로 주입.
// ============================================================

import { notFound, redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { canManageTournament } from "@/lib/auth/tournament-permission";
import { buildAdminV2User } from "../../_admin-user";
import { OperateShell, type OperateSummary } from "./_operate-shell";
import type { OperateTeam, OperateRule, TeamStatus, PayStatus, ViaKind } from "./_teams-panel";

export const dynamic = "force-dynamic";

// ── 표시 헬퍼(서버 단일 매핑 — snake/UTC → 도메인) ──────────────────────
// 아바타 폴백 팔레트(데이터 주입용 — 컴포넌트 하드코딩 아님)
const AV = ["#3182F6", "#15B86A", "#6D5AE6", "#FF9500", "#F04452", "#00B8D9", "#E0457B", "#8B5CF6"];
const avColor = (i: number) => AV[((i % AV.length) + AV.length) % AV.length];

// KST "2026.06.15" / 없으면 ""
function kstDot(d: Date | null | undefined): string {
  if (!d) return "";
  return d
    .toLocaleDateString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\.\s/g, ".")
    .replace(/\.$/, "");
}
// KST "2026-05-03" (신청일 표기)
function kstISO(d: Date | null | undefined): string {
  if (!d) return "미정";
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

// 대회 status → 표시 라벨 + ct-pill data-tone (정본 요약 칩)
function statusPill(s: string | null | undefined): { label: string; tone: string } {
  switch (s) {
    case "in_progress":
      return { label: "진행중", tone: "ok" };
    case "published":
    case "registration_open":
    case "open":
      return { label: "접수중", tone: "info" };
    case "draft":
      return { label: "준비중", tone: "mute" };
    case "completed":
      return { label: "종료", tone: "mute" };
    case "cancelled":
      return { label: "취소", tone: "err" };
    default:
      return { label: s || "준비중", tone: "mute" };
  }
}

const TEAM_STATUSES: TeamStatus[] = ["pending", "approved", "rejected", "withdrawn"];
const PAY_STATUSES: PayStatus[] = ["unpaid", "paid", "refunded", "waived"];

export default async function OperateWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // ── 권한: 이 대회 운영 권한(organizer/adminMember active/super) ──
  const session = await getWebSession();
  const userId = session ? BigInt(session.sub) : BigInt(0);
  const allowed = await canManageTournament(id, userId, session);
  if (!allowed) redirect("/v2/ta/tournaments");

  // ── 데이터 READ (Prisma 직접) ──
  const [t, teamRows, ruleRows, matchCount] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id },
      select: {
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        venue_name: true,
        venue_address: true,
        city: true,
        district: true,
        teams_count: true,
        div_caps: true,
      },
    }),
    prisma.tournamentTeam.findMany({
      where: { tournamentId: id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        status: true,
        category: true,
        payment_status: true,
        manager_name: true,
        waiting_number: true,
        applied_at: true,
        createdAt: true,
        applied_via: true,
        team: { select: { name: true, logoUrl: true, primaryColor: true } },
        _count: { select: { players: true } },
      },
    }),
    prisma.tournamentDivisionRule.findMany({
      where: { tournamentId: id },
      orderBy: { sortOrder: "asc" },
      select: { code: true, label: true, feeKrw: true },
    }),
    prisma.tournamentMatch.count({ where: { tournamentId: id } }),
  ]);

  if (!t) notFound();

  // div_caps jsonb verbatim — code별 정원 스칼라 lookup만(재귀변환 0)
  const divCaps = (t.div_caps ?? {}) as Record<string, number>;

  // ── 종별 룰 매핑 ──
  const rules: OperateRule[] = ruleRows.map((r) => ({
    code: r.code,
    label: r.label,
    fee: r.feeKrw ?? 0,
    cap: typeof divCaps[r.code] === "number" ? divCaps[r.code] : null,
  }));

  // ── 참가팀 매핑(snake → 도메인 camel 단일 지점) ──
  const teams: OperateTeam[] = teamRows.map((tt, i) => {
    const rawStatus = (tt.status ?? "pending") as string;
    const status: TeamStatus = TEAM_STATUSES.includes(rawStatus as TeamStatus)
      ? (rawStatus as TeamStatus)
      : "pending"; // "waiting" 등 비표준 → pending(대기번호 칩으로 별도 표기)
    const rawPay = (tt.payment_status ?? "unpaid") as string;
    const paid: PayStatus = PAY_STATUSES.includes(rawPay as PayStatus)
      ? (rawPay as PayStatus)
      : "unpaid";
    const rawVia = tt.applied_via as string | null;
    const via: ViaKind =
      rawVia === "admin" || rawVia === "coach_token" || rawVia === "self" ? rawVia : null;
    return {
      id: tt.id.toString(),
      name: tt.team?.name ?? "(이름 없음)",
      color: tt.team?.primaryColor || avColor(i),
      logo: tt.team?.logoUrl ?? null,
      category: tt.category ?? "기타",
      status,
      via,
      players: tt._count.players,
      paid,
      waiting: tt.waiting_number ?? null,
      manager: tt.manager_name ?? null,
      appliedAt: kstISO(tt.applied_at ?? tt.createdAt),
    };
  });

  // ── 요약 ──
  const approvedCount = teams.filter((x) => x.status === "approved").length;
  const start = kstDot(t.startDate);
  const end = kstDot(t.endDate);
  const period = start ? (end && end !== start ? `${start} ~ ${end}` : start) : "미정";
  const venue =
    t.venue_name ||
    t.venue_address ||
    [t.city, t.district].filter(Boolean).join(" ") ||
    "장소 미정";
  const st = statusPill(t.status);

  const summary: OperateSummary = {
    name: t.name || "이름 미정",
    period,
    venue,
    statusLabel: st.label,
    statusTone: st.tone,
    teamCount: t.teams_count ?? approvedCount,
    divisionCount: rules.length,
    matchCount,
  };

  const user = await buildAdminV2User();

  return (
    <OperateShell
      tournamentId={id}
      user={user}
      summary={summary}
      teams={teams}
      rules={rules}
    />
  );
}
