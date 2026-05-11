/**
 * 2026-05-12 Phase 4 행정 메뉴 — 대회 감사 로그 페이지.
 *
 * 진입: /admin/tournaments → 모달 → "감사 로그" 클릭
 * 권한: super_admin (admin_logs 전체 조회)
 *
 * 데이터:
 *   admin_logs WHERE resource_type='Tournament' AND (resource_id BigInt 매핑 X)
 *   → Tournament.id 가 UUID 라 resource_id 직접 매칭 불가 → description LIKE %UUID% fallback
 *   또는 changes_made / previous_values JSON 안에 tournamentId 검색
 *
 * 표시: 시간순 (최근 100건) — action / severity / admin / description / changes
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";

export const dynamic = "force-dynamic";

const SEVERITY_COLOR: Record<string, string> = {
  info: "var(--color-text-muted)",
  warning: "var(--color-warning)",
  error: "var(--color-error)",
  critical: "var(--color-error)",
};

export default async function TournamentAuditLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getWebSession();
  if (!session) redirect("/login");
  if (!isSuperAdmin(session)) notFound();

  // 대회 정보 (헤더 표시용)
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { id: true, name: true, status: true },
  });
  if (!tournament) notFound();

  // admin_logs 조회 — resource_type='Tournament' + description 또는 JSON 에 UUID 포함
  // 가장 안전한 fallback = description ILIKE '%uuid%'
  const logs = await prisma.admin_logs.findMany({
    where: {
      resource_type: "Tournament",
      OR: [
        { description: { contains: id } },
        // changes_made / previous_values JSON path 검색은 prisma 비호환 — description fallback
      ],
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

  // admin_id → user nickname 매핑
  const adminIds = [...new Set(logs.map((l) => l.admin_id))];
  const admins = await prisma.user.findMany({
    where: { id: { in: adminIds } },
    select: { id: true, nickname: true, email: true },
  });
  const adminMap = new Map(admins.map((a) => [a.id.toString(), a]));

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/tournaments"
          className="text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          ← 대회 관리
        </Link>
        <h1
          className="mt-1 text-2xl font-extrabold uppercase tracking-wide sm:text-3xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          감사 로그
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          {tournament.name} · 최근 {logs.length}건
        </p>
      </div>

      {logs.length === 0 ? (
        <div
          className="rounded-[4px] border p-12 text-center"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-elevated)",
            color: "var(--color-text-muted)",
          }}
        >
          <span className="material-symbols-outlined text-4xl">history</span>
          <p className="mt-2 text-sm">감사 로그가 없습니다.</p>
          <p className="mt-1 text-xs">
            description 필드에 대회 UUID 가 박제된 admin_logs 만 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto admin-table-wrap">
          <table className="admin-table w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 font-medium">시각</th>
                <th className="px-4 py-3 font-medium">액션</th>
                <th className="px-4 py-3 font-medium">관리자</th>
                <th className="px-4 py-3 font-medium">설명</th>
                <th className="px-4 py-3 font-medium">레벨</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => {
                const admin = adminMap.get(l.admin_id.toString());
                return (
                  <tr key={l.id.toString()}>
                    <td
                      className="whitespace-nowrap px-4 py-3 text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                      data-label="시각"
                    >
                      {l.created_at.toLocaleString("ko-KR")}
                    </td>
                    <td data-primary="true" data-label="액션" className="px-4 py-3 font-medium">
                      {l.action}
                    </td>
                    <td data-label="관리자" className="px-4 py-3 text-sm">
                      {admin?.nickname ?? admin?.email ?? `(id ${l.admin_id})`}
                    </td>
                    <td
                      data-label="설명"
                      className="px-4 py-3 text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {l.description ?? "-"}
                    </td>
                    <td data-label="레벨" className="px-4 py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          background: `color-mix(in srgb, ${SEVERITY_COLOR[l.severity ?? "info"] ?? "var(--color-text-muted)"} 15%, transparent)`,
                          color: SEVERITY_COLOR[l.severity ?? "info"] ?? "var(--color-text-muted)",
                        }}
                      >
                        {l.severity ?? "info"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
        ※ admin_logs.resource_id 가 BigInt 라 UUID Tournament 매칭 불가 — description 필드 검색 fallback.
        향후 schema 확장 시 resource_uuid 컬럼 신설 권장.
      </p>
    </div>
  );
}
