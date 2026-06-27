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
import { PageHead } from "@/components/admin/console-kit";
import { Icon } from "@/components/admin-toss";

export const dynamic = "force-dynamic";

// 2026-05-15 Admin-4-A 박제 (v2.14):
// - h1 직접 → <PageHead> (eyebrow + actions) v2.41 Toss 패턴
// - severity 뱃지 inline color → .ad-pill[data-tone=...] (admin.css)
// - 비즈 로직 (Prisma admin_logs / formatUser / enrichDescription) 100% 보존.
//
// severity → ad-pill data-tone 매핑 (시안 v2.14 박제)
const SEVERITY_TONE: Record<string, "mute" | "warn" | "err" | "info"> = {
  info: "info",
  warning: "warn",
  error: "err",
  critical: "err",
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

  // admin_id → user nickname 매핑 + previous/changes JSON 에 등장한 userId 일괄 매핑
  // 2026-05-12 사용자 요청: 운영자 변경 감사 로그 등에서 ID 옆에 이름(실명) 표시
  const adminIds = new Set<bigint>();
  for (const l of logs) {
    adminIds.add(l.admin_id);
    // previous/changes JSON 에서 userId 후보 추출 (organizerId / newOrganizerId / userId / claimed_user_id 등)
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

  // userId(string) → "이름 (#id)" 포맷 헬퍼 (감사 로그 description 가독성)
  const formatUser = (id: string | bigint): string => {
    const key = typeof id === "bigint" ? id.toString() : id;
    const u = adminMap.get(key);
    if (!u) return `(userId ${key})`;
    const display = u.nickname ?? u.name ?? u.email;
    const real = u.name && u.name !== u.nickname ? ` (${u.name})` : "";
    return `${display}${real} #${key}`;
  };

  // description 내의 "userId 숫자 → 숫자" 또는 "이관: 숫자 → 숫자" 패턴 자동 치환 (단방향 — 표시 가공)
  const enrichDescription = (raw: string | null): string => {
    if (!raw) return "-";
    return raw.replace(/(\d{2,})\s*(→|->)\s*(\d{2,})/g, (m, from, arrow, to) => {
      return `${formatUser(from)} ${arrow} ${formatUser(to)}`;
    });
  };

  return (
    <div data-skin="toss">
      <PageHead
        eyebrow={`대회 관리자 · ${tournament.name}`}
        icon="history"
        title="감사 로그"
        sub={`${tournament.name} · 최근 ${logs.length}건`}
        actions={
          <Link href="/admin/tournaments" className="ts-btn ts-btn--secondary ts-btn--sm">
            대회 관리
          </Link>
        }
      />

      {logs.length === 0 ? (
        <div
          className="ts-card p-12 text-center"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-elevated)",
            color: "var(--color-text-muted)",
          }}
        >
          <span className="ts-empty__icon">
            <Icon name="history" size={30} />
          </span>
          <p className="mt-2 text-sm">감사 로그가 없습니다.</p>
          <p className="mt-1 text-xs">
            description 필드에 대회 UUID 가 박제된 admin_logs 만 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="ad-native-table">
          <table className="ad-native-table__table">
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
                      {/* Vercel 서버 = UTC 이므로 Asia/Seoul 강제 — KST 로 표시 */}
                      {l.created_at.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                    </td>
                    <td data-primary="true" data-label="액션" className="px-4 py-3 font-medium">
                      {l.action}
                    </td>
                    <td data-label="관리자" className="px-4 py-3 text-sm">
                      {/* 이름 (실명) + userId 표시 — 사용자 요청 */}
                      <div>{admin?.nickname ?? admin?.email ?? "-"}</div>
                      {admin?.name && admin.name !== admin.nickname && (
                        <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                          {admin.name}
                        </div>
                      )}
                      <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                        userId {l.admin_id.toString()}
                      </div>
                    </td>
                    <td
                      data-label="설명"
                      className="px-4 py-3 text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {/* description 내 userId 숫자 → "이름 (실명) #id" 자동 치환 */}
                      {enrichDescription(l.description)}
                    </td>
                    <td data-label="레벨" className="px-4 py-3">
                      {/* Admin-4-A 박제 — ad-pill[data-tone] (admin.css) */}
                      <span
                        className="ad-pill"
                        data-tone={SEVERITY_TONE[l.severity ?? "info"] ?? "info"}
                        style={{ fontFamily: "var(--ff-mono)", fontWeight: 700, letterSpacing: "0.04em", fontSize: 10 }}
                      >
                        {(l.severity ?? "info").toUpperCase()}
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
