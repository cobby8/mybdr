// ============================================================
// (admin-v2)/v2/(backoffice)/tournaments/[id]/audit-log/page.tsx — 대회 감사 로그 (컷오버 포팅)
//   레거시 (admin)/admin/tournaments/[id]/audit-log/page.tsx 를 admin-v2 백오피스로 1:1 포팅.
//   서버 컴포넌트: 권한 가드 + READ(Prisma 직접)만 담당. 표시/표는 _audit-table(클라).
//
//   ⚠ 백엔드 0변경 — route/Prisma/스키마/server action 수정 0. 신규 API 0. 읽기만(admin_logs/user).
//   ⚠ 권한 — /v2 layout 은 tournament_admin 까지 통과시키지만, 감사 로그는 레거시와 동일
//     super_admin 전용이다. categories/partner-console 과 동일한 페이지 레벨 super 가드 재현(비super redirect).
//   ⚠ 데이터 매핑 — admin_logs READ + admin_id/JSON 내 userId 일괄 user 매핑 + description enrich
//     까지 서버에서 끝내고, 직렬화 가능한 AuditRow[] 만 클라로 넘긴다(BigInt/Date → string).
//   ※ 레거시의 Prisma 쿼리/enrich 로직은 1:1 보존(표시 결과 동일).
// ============================================================

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { AuditTable, type AuditRow } from "./_audit-table";

export const dynamic = "force-dynamic";

export default async function AdminV2TournamentAuditLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // ── 페이지 단위 super_admin 방어 가드 (레거시 동일·비super 차단) ──
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    redirect("/v2");
  }

  // 대회 정보 (헤더 표시용)
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { id: true, name: true, status: true },
  });
  if (!tournament) notFound();

  // admin_logs 조회 — resource_type='Tournament' + description 에 UUID 포함(레거시 fallback 1:1)
  const logs = await prisma.admin_logs.findMany({
    where: {
      resource_type: "Tournament",
      OR: [{ description: { contains: id } }],
    },
    orderBy: { created_at: "desc" },
    take: 100,
    select: {
      id: true,
      action: true,
      severity: true,
      description: true,
      admin_id: true,
      created_at: true,
      changes_made: true,
      previous_values: true,
    },
  });

  // admin_id + previous/changes JSON 내 userId 후보를 한 번에 모아 user 매핑(레거시 1:1)
  const adminIds = new Set<bigint>();
  for (const l of logs) {
    adminIds.add(l.admin_id);
    const collect = (val: unknown) => {
      if (!val || typeof val !== "object") return;
      const rec = val as Record<string, unknown>;
      for (const k of Object.keys(rec)) {
        if (/^(organizer|user|admin|claimed_user|registered_by|captain)_?Id$/i.test(k)) {
          const v = rec[k];
          if (typeof v === "string" && /^\d+$/.test(v)) adminIds.add(BigInt(v));
          else if (typeof v === "number") adminIds.add(BigInt(v));
        }
      }
    };
    collect(l.previous_values);
    collect(l.changes_made);
  }
  const allIds = [...adminIds];
  const users = await prisma.user.findMany({
    where: { id: { in: allIds } },
    select: { id: true, nickname: true, name: true, email: true },
  });
  const adminMap = new Map(users.map((u) => [u.id.toString(), u]));

  // userId(string) → "이름 (실명) #id" 포맷(레거시 formatUser 1:1)
  const formatUser = (uid: string | bigint): string => {
    const key = typeof uid === "bigint" ? uid.toString() : uid;
    const u = adminMap.get(key);
    if (!u) return `(userId ${key})`;
    const display = u.nickname ?? u.name ?? u.email;
    const real = u.name && u.name !== u.nickname ? ` (${u.name})` : "";
    return `${display}${real} #${key}`;
  };

  // description 내 "숫자 → 숫자" 패턴 자동 치환(레거시 enrichDescription 1:1)
  const enrichDescription = (raw: string | null): string => {
    if (!raw) return "-";
    return raw.replace(/(\d{2,})\s*(→|->)\s*(\d{2,})/g, (_m, from, arrow, to) => {
      return `${formatUser(from)} ${arrow} ${formatUser(to)}`;
    });
  };

  // ── 직렬화: BigInt/Date → string, enrich 적용한 AuditRow[] 구성 ──
  const rows: AuditRow[] = logs.map((l) => {
    const admin = adminMap.get(l.admin_id.toString());
    return {
      id: l.id.toString(),
      // Vercel 서버 = UTC 이므로 Asia/Seoul 강제(레거시 동일)
      time: l.created_at.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
      action: l.action,
      adminName: admin?.nickname ?? admin?.email ?? "-",
      adminRealName:
        admin?.name && admin.name !== admin.nickname ? admin.name : null,
      adminId: l.admin_id.toString(),
      description: enrichDescription(l.description),
      severity: l.severity ?? "info",
    };
  });

  return <AuditTable tournamentName={tournament.name} rows={rows} />;
}
