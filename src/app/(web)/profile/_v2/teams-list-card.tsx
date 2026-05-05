/* ============================================================
 * TeamsListCard — 마이페이지 소속 팀 카드 (PR2 + 5/6 확장)
 *
 * 5/6 변경:
 *   - 위치: aside → 히어로 바로 아래 풀 width
 *   - row Link 제거 → 좌측 정보 (Link) + 우측 액션 (활동 관리 dropdown + 팀페이지 버튼)
 *   - MemberActionsMenu 마운트 (팀 페이지 본인 카드와 동일 4종 신청)
 *
 * row 구조:
 *   ┌────────────────────────────────────────────────────────────┐
 *   │ [로고] 지역             #N (jersey)                        │
 *   │       팀명 (한/영)                                          │
 *   │ ───────────────────────                                    │
 *   │                       [활동 관리 ▾]    [팀페이지 →]       │
 *   └────────────────────────────────────────────────────────────┘
 * ============================================================ */

import Link from "next/link";
import { MemberActionsMenu } from "../../teams/[id]/_components_v2/member-actions-menu";
import MemberPendingBadge from "../../teams/[id]/_components_v2/member-pending-badge";

export type TeamsListItem = {
  teamId: string;
  teamName: string;
  teamNameSecondary: string | null;
  city: string | null;
  district: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  jerseyNumber: number | null;
  tag: string;
};

type Props = {
  teams: TeamsListItem[];
};

export function TeamsListCard({ teams }: Props) {
  // 0 팀 빈 상태
  if (teams.length === 0) {
    return (
      <div className="card" style={{ marginTop: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span className="eyebrow" style={{ fontSize: 11 }}>
            소속 팀
          </span>
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-mute)", padding: "8px 0" }}>
          가입한 팀이 없습니다.
        </div>
        <Link
          href="/teams"
          className="btn btn--sm"
          style={{ width: "100%", display: "block", textAlign: "center", marginTop: 8 }}
        >
          팀 둘러보기 →
        </Link>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span className="eyebrow" style={{ fontSize: 11 }}>
          소속 팀{" "}
          <span style={{ color: "var(--ink-mute)", fontWeight: 400 }}>({teams.length})</span>
        </span>
        <Link href="/teams" style={{ fontSize: 11, color: "var(--ink-mute)", textDecoration: "none" }}>
          전체 →
        </Link>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {teams.map((t) => {
          const region = [t.city, t.district].filter(Boolean).join(" ") || "지역 미설정";
          const tagBg = t.primaryColor ?? "var(--accent)";
          const tagInk = "var(--color-on-accent, #fff)";

          return (
            <li
              key={t.teamId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                background: "var(--bg-alt, var(--bg))",
                borderRadius: 8,
                border: "1px solid var(--color-border, var(--line))",
                flexWrap: "wrap",
              }}
            >
              {/* 좌측: 로고 + 정보 (Link — 팀 페이지 이동 — 클릭 영역) */}
              <Link
                href={`/teams/${t.teamId}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flex: 1,
                  minWidth: 200,
                }}
              >
                {t.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.logoUrl}
                    alt={t.teamName}
                    width={36}
                    height={36}
                    style={{ borderRadius: 4, objectFit: "cover", flexShrink: 0 }}
                  />
                ) : (
                  <span
                    style={{
                      background: tagBg,
                      color: tagInk,
                      width: 36,
                      height: 36,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {t.tag}
                  </span>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: "var(--ink-mute)", lineHeight: 1.2, marginBottom: 2 }}>
                    {region}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--ink)",
                      lineHeight: 1.3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.teamName}
                    {t.teamNameSecondary && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--ink-mute)",
                          fontWeight: 400,
                          marginLeft: 6,
                        }}
                      >
                        {t.teamNameSecondary}
                      </span>
                    )}
                  </div>
                </div>

                {/* jersey */}
                {t.jerseyNumber != null && (
                  <span
                    className="t-mono"
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--accent)",
                      flexShrink: 0,
                      padding: "3px 9px",
                      background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                      borderRadius: 4,
                    }}
                  >
                    #{t.jerseyNumber}
                  </span>
                )}
              </Link>

              {/* 우측: 액션 영역 (활동 관리 dropdown + 팀페이지 버튼 + pending 뱃지) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <MemberPendingBadge teamId={t.teamId} />
                <MemberActionsMenu
                  teamId={t.teamId}
                  teamName={t.teamName}
                  currentJersey={t.jerseyNumber}
                />
                <Link
                  href={`/teams/${t.teamId}`}
                  className="btn btn--sm"
                  style={{
                    fontSize: 11,
                    padding: "4px 10px",
                    minHeight: 28,
                    textDecoration: "none",
                  }}
                >
                  팀페이지 →
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
