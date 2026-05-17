// 리그(풀리그) 순위표 컴포넌트
// round_robin / full_league / full_league_knockout 포맷에서 대진표 탭 상단에 표시
//
// 왜 순위 탭(StandingsTabContent)과 별도인가:
// - 순위 탭은 /public-standings API를 사용하고, 대진표 탭은 /public-bracket API를 사용한다.
// - 대진표 탭에서 다시 API 호출을 하지 않고 이미 받은 데이터를 재사용하기 위해 별도 컴포넌트로 분리.
// - 대진표 탭 내부에서는 "리그 순위표" 제목으로 조금 더 간결하게 표시한다.

"use client";

// 5/10 PlayerLink/TeamLink 3-A 단계 — 팀명 클릭 시 팀 페이지(`/teams/[id]`) 이동.
// 이유: 글로벌 패턴(2단계 라이브 페이지) 과 일관 — TeamLink 는 hover:underline + null fallback 처리.
import { TeamLink } from "@/components/links/team-link";

export type LeagueTeam = {
  id: string;
  teamId: string; // Team 테이블의 실제 id (팀 페이지 링크용)
  teamName: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
  // 2026-05-17 강남구 승점 — DB 박제값 (강남구 = 가산점 / 그 외 = wins*3).
  winPoints?: number;
};

type Props = {
  teams: LeagueTeam[];
  tournamentStatus?: string | null; // "completed"면 공동순위 판단 기준이 엄격해짐
  // 2026-05-17 — pointsRule="gnba" 일 때 "P" 컬럼 + 승점 기반 공동순위 판단.
  //   미전달 시 default = 승률 기반 (기존 / 회귀 0).
  pointsRule?: "gnba" | "default";
};

export function LeagueStandings({ teams, tournamentStatus, pointsRule = "default" }: Props) {
  // 대회 상태에 따라 공동순위 기준이 다름 (순위 탭과 동일한 로직)
  // - 진행 중: 승률만 같으면 공동순위
  // - 종료: 승률+득실차+다득점 모두 같아야 공동순위 (사실상 확정 순위)
  const isCompleted = tournamentStatus === "completed";
  // 2026-05-17 — 강남구 룰 ON 여부 (P 컬럼 + 공동순위 1차키 분기).
  const showWinPoints = pointsRule === "gnba";

  let rank = 1;
  const ranks = teams.map((t, i) => {
    if (i > 0) {
      const prev = teams[i - 1];
      // 2026-05-17 강남구 룰 — 공동순위 1차키 = winPoints 동일 여부.
      //   default 룰 = 기존 승률 동일 여부.
      if (showWinPoints) {
        const tWP = t.winPoints ?? 0;
        const prevWP = prev.winPoints ?? 0;
        if (isCompleted) {
          if (
            tWP === prevWP &&
            t.pointDifference === prev.pointDifference &&
            t.pointsFor === prev.pointsFor
          ) {
            // 공동순위 유지
          } else {
            rank = i + 1;
          }
        } else {
          if (tWP === prevWP) {
            // 공동순위 유지
          } else {
            rank = i + 1;
          }
        }
      } else if (isCompleted) {
        if (
          t.winRate === prev.winRate &&
          t.pointDifference === prev.pointDifference &&
          t.pointsFor === prev.pointsFor
        ) {
          // 공동순위 유지
        } else {
          rank = i + 1;
        }
      } else {
        if (t.winRate === prev.winRate) {
          // 공동순위 유지
        } else {
          rank = i + 1;
        }
      }
    }
    return rank;
  });

  // KBL 승률 표기: .XXX 형식 (전승만 1.000, 0경기는 "-")
  const formatWinRate = (t: LeagueTeam) => {
    if (t.gamesPlayed === 0) return "-";
    if (t.winRate === 1) return "1.000";
    return t.winRate.toFixed(3).replace(/^0/, "");
  };

  return (
    <section className="mb-8">
      <h3
        className="mb-4 text-lg font-bold sm:text-xl"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        리그 순위표
      </h3>
      <div
        className="overflow-x-auto rounded-lg border"
        style={{ borderColor: "var(--color-border)" }}
      >
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr style={{ backgroundColor: "var(--color-surface)" }}>
              <th
                className="px-2 py-2.5 text-left text-xs font-medium sm:px-3"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                #
              </th>
              <th
                className="px-2 py-2.5 text-left text-xs font-medium sm:px-3"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                팀
              </th>
              <th
                className="px-2 py-2.5 text-center text-xs font-medium sm:px-3"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                경기
              </th>
              <th
                className="px-2 py-2.5 text-center text-xs font-medium sm:px-3"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                승
              </th>
              <th
                className="px-2 py-2.5 text-center text-xs font-medium sm:px-3"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                패
              </th>
              <th
                className="px-2 py-2.5 text-center text-xs font-medium sm:px-3"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                승률
              </th>
              <th
                className="hidden px-2 py-2.5 text-center text-xs font-medium sm:table-cell sm:px-3"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                득실차
              </th>
              {/* 2026-05-17 (사용자 명시 이미지 #181) — 득실차 다음에 승점 (강남구 한정 노출 / 모바일도 노출). */}
              {showWinPoints && (
                <th
                  className="px-2 py-2.5 text-center text-xs font-medium sm:px-3"
                  style={{ color: "var(--color-primary)" }}
                  title="승점 (강남구협회장배 규정)"
                >
                  승점
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => {
              // 2026-05-17 (사용자 명시 이미지 #185) — 4위까지 플레이오프 진출 강조 (이전 = 3위까지).
              //   열혈농구단 전국최강전 등 일반 농구 플레이오프 표준 (1~4위 진출).
              const isPlayoff = ranks[i] <= 4;
              return (
                <tr
                  key={t.id}
                  style={{
                    borderTop: "1px solid var(--color-border)",
                    borderLeft: isPlayoff
                      ? "3px solid var(--color-primary)"
                      : "3px solid transparent",
                  }}
                >
                  <td
                    className="px-2 py-2.5 text-sm font-bold sm:px-3"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {ranks[i]}
                  </td>
                  <td className="px-2 py-2.5 font-medium sm:px-3">
                    {/* 5/10: 팀명 클릭 → 팀 페이지. TeamLink 가 hover:underline + null fallback 자동 처리. */}
                    <TeamLink teamId={t.teamId} name={t.teamName} />
                  </td>
                  <td className="px-2 py-2.5 text-center sm:px-3">{t.gamesPlayed}</td>
                  <td className="px-2 py-2.5 text-center sm:px-3">{t.wins}</td>
                  <td className="px-2 py-2.5 text-center sm:px-3">{t.losses}</td>
                  <td className="px-2 py-2.5 text-center font-mono sm:px-3">
                    {formatWinRate(t)}
                  </td>
                  <td
                    className="hidden px-2 py-2.5 text-center sm:table-cell sm:px-3"
                    style={{
                      color:
                        t.pointDifference > 0
                          ? "var(--color-primary)"
                          : "var(--color-text-muted)",
                    }}
                  >
                    {t.pointDifference > 0 ? "+" : ""}
                    {t.pointDifference}
                  </td>
                  {/* 2026-05-17 (사용자 명시 이미지 #181) — 득실차 다음에 승점 (강남구 한정 노출). */}
                  {showWinPoints && (
                    <td
                      className="px-2 py-2.5 text-center font-bold sm:px-3"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {t.winPoints ?? 0}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
