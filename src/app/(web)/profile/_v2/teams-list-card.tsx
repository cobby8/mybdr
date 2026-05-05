/* ============================================================
 * TeamsListCard — 마이페이지 aside 다중 팀 목록 카드 (PR2)
 *
 * 이유(왜): 기존 단일 primaryTeam (teamMembers[0]) 표시 한계.
 *   여러 팀 가입 사용자가 본인 jersey + 지역 + 팀명을 한눈에 보고
 *   /teams/[id] 로 이동할 수 있어야 한다.
 *
 * 어떻게:
 *   - Server Component (Link 사용 — 별도 클라이언트 hook 없음)
 *   - row 표시: [로고] [지역] [팀명(name_primary)] [#jersey]
 *   - 0 팀 = "가입한 팀이 없습니다" 빈 상태 + CTA
 *
 * 보안: SSR 단계에서 본인 teamMembers 만 조회 (page.tsx 가 IDOR 처리)
 * ============================================================ */

import Link from "next/link";

export type TeamsListItem = {
  teamId: string;
  teamName: string; // 표시용 (한글 또는 영문 — name_primary 결정)
  teamNameSecondary: string | null; // 보조 표기 (한글 vs 영문 — primary 가 ko 면 en 보조)
  city: string | null;
  district: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  jerseyNumber: number | null;
  // 팀 이름 첫 2글자 — 로고 fallback
  tag: string;
};

type Props = {
  teams: TeamsListItem[];
};

export function TeamsListCard({ teams }: Props) {
  // 0 팀 빈 상태
  if (teams.length === 0) {
    return (
      <div className="card mypage-aside-card">
        <div className="mypage-aside-card__head">
          <span className="eyebrow" style={{ fontSize: 10 }}>
            소속 팀
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-mute)", padding: "8px 0" }}>
          가입한 팀이 없습니다.
        </div>
        <Link
          href="/teams"
          className="btn btn--sm"
          style={{ width: "100%", display: "block", textAlign: "center" }}
        >
          팀 둘러보기 →
        </Link>
      </div>
    );
  }

  return (
    <div className="card mypage-aside-card">
      <div className="mypage-aside-card__head">
        <span className="eyebrow" style={{ fontSize: 10 }}>
          소속 팀{" "}
          <span style={{ color: "var(--ink-mute)", fontWeight: 400 }}>({teams.length})</span>
        </span>
        <Link href="/teams" className="mypage-aside-card__more">
          전체
        </Link>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {teams.map((t) => {
          // 지역 표시: city + district 합치기 (둘 다 있으면 "서울 강남구")
          const region = [t.city, t.district].filter(Boolean).join(" ") || "지역 미설정";
          // 로고 fallback 색상 — primaryColor 또는 accent
          const tagBg = t.primaryColor ?? "var(--accent)";
          // 정의된 토큰 사용 — 미정의 --ink-on-accent 대신 --color-on-accent (#ffffff)
          const tagInk = "var(--color-on-accent, #fff)";

          return (
            <li key={t.teamId}>
              <Link
                href={`/teams/${t.teamId}`}
                className="mypage-team"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 0",
                }}
              >
                {/* 로고 (있으면 img, 없으면 tag) */}
                {t.logoUrl ? (
                  // 이유: 다음 이미지 도메인 미설정 가능 — 일반 img 태그 (작은 사이즈, 성능 영향 0)
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.logoUrl}
                    alt={t.teamName}
                    width={32}
                    height={32}
                    style={{ borderRadius: 4, objectFit: "cover", flexShrink: 0 }}
                  />
                ) : (
                  <span
                    className="mypage-team__tag"
                    style={{
                      background: tagBg,
                      color: tagInk,
                      width: 32,
                      height: 32,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {t.tag}
                  </span>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* 1행: 지역 (작은 글자) */}
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--ink-mute)",
                      lineHeight: 1.2,
                      marginBottom: 2,
                    }}
                  >
                    {region}
                  </div>
                  {/* 2행: 팀명 (한글/영문 우선순위 적용) */}
                  <div
                    className="mypage-team__name"
                    style={{
                      fontSize: 13,
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
                          fontSize: 10,
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

                {/* 본인 jersey (없으면 미표시) */}
                {t.jerseyNumber != null && (
                  <span
                    className="t-mono"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--accent)",
                      flexShrink: 0,
                      padding: "2px 8px",
                      background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                      borderRadius: 4,
                    }}
                  >
                    #{t.jerseyNumber}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
