import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getDisplayName } from "@/lib/utils/player-display-name";

import "./roster-tab-v2.css";

/**
 * RosterTabV2 — 팀 로스터 카드 그리드
 *
 * 2026-05-02 사용자 요청:
 * - 행 → 카드 그리드 (TeamCardV2 패턴 차용)
 * - 모바일 2열 / 태블릿 3열 / PC 4열
 *
 * DB 매핑 / 미지원:
 * - jerseyNumber → 등번호 (좌상)
 * - nickname/name → 이름 (getDisplayName, 실명 우선 — conventions.md 2026-05-01)
 * - user.position → 포지션
 * - role: captain → 빨강 배지 / director·coach·manager·treasurer → soft 배지
 * - PPG → DB 미지원 (추후 match_player_stat 집계)
 *
 * 회귀 방지 (errors.md 04-29):
 * - 인라인 grid 안티패턴 ❌ → roster-tab-v2.css className + media query
 */

type Props = {
  teamId: bigint;
  accent: string;
};

const ROLE_LABEL: Record<string, string> = {
  director: "감독",
  coach: "코치",
  captain: "주장",
  manager: "매니저",
  treasurer: "총무",
  member: "선수",
};

const ROLE_ORDER: Record<string, number> = {
  captain: 0,
  director: 1,
  coach: 2,
  manager: 3,
  treasurer: 4,
  member: 5,
};

export async function RosterTabV2({ teamId, accent }: Props) {
  const members = await prisma.teamMember
    .findMany({
      where: { teamId, status: "active" },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            name: true,
            position: true,
          },
        },
      },
      orderBy: [{ jerseyNumber: "asc" }, { createdAt: "asc" }],
    })
    .catch(() => []);

  if (members.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: "40px 20px",
          textAlign: "center",
          color: "var(--ink-mute)",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 32, marginBottom: 8, display: "block" }}
        >
          groups
        </span>
        <p style={{ margin: 0, fontSize: 14 }}>로스터가 비어 있습니다.</p>
      </div>
    );
  }

  // 역할 우선 정렬 (DB orderBy는 jerseyNumber 기준이므로 역할 기준 재정렬)
  const sorted = [...members].sort((a, b) => {
    const ra = ROLE_ORDER[a.role ?? "member"] ?? 99;
    const rb = ROLE_ORDER[b.role ?? "member"] ?? 99;
    if (ra !== rb) return ra - rb;
    const ja = a.jerseyNumber ?? 999;
    const jb = b.jerseyNumber ?? 999;
    return ja - jb;
  });

  return (
    <div
      className="roster-grid"
      // accent 변수 (팀 고유색) — 카드 상단 띠 + 등번호 색에 사용
      style={{ ["--roster-accent" as string]: accent }}
    >
      {sorted.map((m) => {
        const displayName = getDisplayName(m.user);
        const userId = m.user?.id?.toString();
        const position = m.user?.position ?? "—";
        const role = m.role ?? "member";
        const roleLabel = ROLE_LABEL[role] ?? role;
        const jersey = m.jerseyNumber ?? "—";

        const cardInner = (
          <>
            {/* 등번호 (큰, accent 색) */}
            <div className="roster-card__jersey">{jersey}</div>

            {/* 이니셜 + 이름 */}
            <div className="roster-card__identity">
              <span className="roster-card__avatar">
                {displayName.charAt(0)}
              </span>
              <span className="roster-card__name">{displayName}</span>
            </div>

            {/* 포지션 + 역할 */}
            <div className="roster-card__meta">
              <span className="roster-card__position">{position}</span>
              {role === "captain" ? (
                <span className="badge badge--red">주장</span>
              ) : role === "director" ||
                role === "coach" ||
                role === "manager" ||
                role === "treasurer" ? (
                <span className="badge badge--soft">{roleLabel}</span>
              ) : null}
            </div>
          </>
        );

        return userId ? (
          <Link
            key={m.id.toString()}
            href={`/users/${userId}`}
            className="roster-card"
          >
            {cardInner}
          </Link>
        ) : (
          <div key={m.id.toString()} className="roster-card">
            {cardInner}
          </div>
        );
      })}
    </div>
  );
}
