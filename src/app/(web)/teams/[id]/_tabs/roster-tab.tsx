import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

interface RosterTabProps {
  teamId: bigint;
  accent: string;
}

// 포지션 → 대분류 매핑 (G/F/C)
function normalizePosition(pos: string | null): string {
  if (!pos) return "기타";
  const upper = pos.toUpperCase();
  if (["PG", "SG", "G"].includes(upper)) return "G";
  if (["SF", "PF", "F"].includes(upper)) return "F";
  if (upper === "C") return "C";
  return "기타";
}

const POSITION_GROUP_ORDER = ["G", "F", "C", "기타"];
const POSITION_GROUP_LABEL: Record<string, string> = { G: "가드 (G)", F: "포워드 (F)", C: "센터 (C)", "기타": "기타" };

// 포지션 대분류로 멤버 그룹핑
function groupByPosition<T extends { position: string | null }>(members: T[]) {
  const groups: Record<string, T[]> = {};
  for (const m of members) {
    const group = normalizePosition(m.position);
    if (!groups[group]) groups[group] = [];
    groups[group].push(m);
  }
  return POSITION_GROUP_ORDER
    .filter((g) => groups[g]?.length)
    .map((g) => [g, groups[g]] as [string, T[]]);
}

const ROLE_LABEL: Record<string, string> = {
  director: "감독",
  coach: "코치",
  captain: "팀장",
  manager: "매니저",
  treasurer: "총무",
  member: "멤버",
};

export async function RosterTab({ teamId, accent }: RosterTabProps) {
  // 기존 쿼리 100% 유지
  const members = await prisma.teamMember.findMany({
    where: { teamId, status: "active" },
    include: { user: { select: { id: true, nickname: true, name: true, position: true, city: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  }).catch(() => []);

  // 스태프 (감독/코치/매니저/총무) vs 선수 (팀장/멤버)
  const staffRoles = ["director", "coach", "manager", "treasurer"];
  const staff = members
    .filter((m) => staffRoles.includes(m.role ?? ""))
    .sort((a, b) => staffRoles.indexOf(a.role ?? "") - staffRoles.indexOf(b.role ?? ""));
  const players = members.filter((m) => !staffRoles.includes(m.role ?? ""));
  const grouped = groupByPosition(players.map((m) => ({ ...m, position: m.user?.position ?? null })));

  // 행 컴포넌트
  function MemberRow({ m }: { m: typeof members[0] }) {
    const displayName = m.user?.nickname ?? m.user?.name ?? "멤버";
    const isCaptain = m.role === "captain";
    const roleLabel = ROLE_LABEL[m.role ?? "member"] ?? m.role ?? "멤버";
    const userId = m.user?.id?.toString();

    const inner = (
      <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 transition-all hover:bg-[var(--color-card-hover)]">
        {/* 등번호 */}
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-black"
          style={{
            backgroundColor: isCaptain ? `${accent}22` : "var(--color-surface-high)",
            color: isCaptain ? accent : "var(--color-text-secondary)",
          }}
        >
          {m.jerseyNumber != null ? `#${m.jerseyNumber}` : "-"}
        </div>
        {/* 이름 */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{displayName}</p>
        </div>
        {/* 역할 배지 (멤버 제외) */}
        {m.role !== "member" && (
          <span
            className="rounded px-2 py-0.5 text-xs font-medium flex-shrink-0"
            style={
              isCaptain
                ? { backgroundColor: `${accent}22`, color: accent }
                : { backgroundColor: "var(--color-surface-high)", color: "var(--color-text-muted)" }
            }
          >
            {roleLabel}
          </span>
        )}
      </div>
    );

    return userId ? (
      <Link href={`/users/${userId}`} className="block">{inner}</Link>
    ) : (
      <div>{inner}</div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="rounded border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-10 text-center">
        <span className="material-symbols-outlined text-4xl text-[var(--color-text-muted)] mb-2">groups</span>
        <p className="text-sm text-[var(--color-text-muted)]">멤버가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 스태프 */}
      {staff.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            코칭 스태프
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {staff.map((m) => <MemberRow key={m.id.toString()} m={m} />)}
          </div>
        </div>
      )}

      {/* 포지션별 선수 — G / F / C */}
      {grouped.map(([pos, posMembers]) => (
        <div key={pos}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {POSITION_GROUP_LABEL[pos] ?? pos} <span className="text-[var(--color-text-secondary)]">({posMembers.length})</span>
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {posMembers.map((m) => <MemberRow key={m.id.toString()} m={m} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
