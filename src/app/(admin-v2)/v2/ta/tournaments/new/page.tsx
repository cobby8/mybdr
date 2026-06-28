// ============================================================
// ta/tournaments/new/page.tsx — 대회 생성 마법사 진입(R5-A · 서버 컴포넌트)
//   인증은 부모 (admin-v2)/v2/layout(getWebSession+membershipType≥3/super) +
//   ta/layout(TaShell) 이 이미 담당.
//
//   R5-A 보강:
//     ① 기존 대회 복사 — organizer-scoped 대회 목록(스칼라만)을 마법사에 주입(피커).
//     ② ?copyFrom=<id> — 선택 대회 1건을 Prisma READ → buildCopyForm 으로 prefill.
//        (이름·일정·접수기간은 비움). 권한 = canManageTournament(대회 단위).
//   ⚠ 백엔드/DB/Prisma 0변경 — 서버 READ + 순수 변환만. 새 API 0(클라는 ?copyFrom 재진입).
//   생성 권한은 POST 엔드포인트(hasCreatePermission) 가 서버에서 재검증.
// ============================================================

import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { prisma } from "@/lib/db/prisma";
import { canManageTournament } from "@/lib/auth/tournament-permission";
import { CreateWizard, type CopyableTournament, type FormState } from "./_create-wizard";
import { buildCopyForm } from "./_form-prefill";
import { tournamentStatus, fmtDate } from "../../_helpers";

export const dynamic = "force-dynamic";

// 복사 source READ select(= edit/page.tsx 와 동일 필드. 이름은 안내용으로 추가).
const COPY_SELECT = {
  name: true,
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
  bank_name: true,
  bank_account: true,
  bank_holder: true,
  fee_notes: true,
  auto_approve_teams: true,
  allow_waiting_list: true,
  game_ball: true,
  format: true,
  game_rules: true,
  categories: true,
  div_caps: true,
  div_fees: true,
  places: true,
} as const;

export default async function NewTournamentPage({
  searchParams,
}: {
  searchParams: Promise<{ copyFrom?: string }>;
}) {
  const { copyFrom } = await searchParams;
  const session = await getWebSession();
  const userId = session ? BigInt(session.sub) : BigInt(0);
  const isSuper = isSuperAdmin(session);

  // ── organizer-scoped 복사 목록(스칼라만 — jsonb 미접촉) ──
  const scope = isSuper
    ? {}
    : {
        OR: [
          { organizerId: userId },
          { adminMembers: { some: { userId, isActive: true } } },
        ],
      };
  const listRows = await prisma.tournament.findMany({
    where: scope,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, name: true, status: true, startDate: true },
  });
  const copyableList: CopyableTournament[] = listRows.map((t) => ({
    id: t.id,
    name: t.name || "이름 미정",
    statusLabel: tournamentStatus(t.status).label,
    dateLabel: t.startDate ? fmtDate(t.startDate) : "일정 미정",
  }));

  // ── ?copyFrom prefill (권한 검증 후 1건 READ → buildCopyForm) ──
  let initialForm: FormState | undefined;
  let copiedFromName: string | undefined;
  if (copyFrom) {
    const allowed = await canManageTournament(copyFrom, userId, session);
    if (allowed) {
      const [t, ruleRows] = await Promise.all([
        prisma.tournament.findUnique({ where: { id: copyFrom }, select: COPY_SELECT }),
        prisma.tournamentDivisionRule.findMany({
          where: { tournamentId: copyFrom },
          orderBy: { sortOrder: "asc" },
          select: { code: true, label: true, feeKrw: true },
        }),
      ]);
      if (t) {
        initialForm = buildCopyForm(t, ruleRows);
        copiedFromName = t.name || "이름 미정";
      }
    }
  }

  return <CreateWizard initialForm={initialForm} copyableList={copyableList} copiedFromName={copiedFromName} />;
}
