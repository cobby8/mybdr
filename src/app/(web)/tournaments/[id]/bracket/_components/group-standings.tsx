// 조별리그 순위표 컴포넌트
// 2026-05-15 — 조 탭 → 세로 배열 (사용자 결정 / 모든 조를 한눈에 스크롤로 확인).
// 시안: 빨간 세로 막대 + 조별 제목 + 팀별 순위 테이블.
// 컬럼: 순위 / 팀명 / 경기 / 승 / 패 / 득실차 (무·승점 미사용 — 농구 표준).

"use client";

import { useMemo } from "react";
// 5/10 PlayerLink/TeamLink 3-A 단계 — 팀명 클릭 시 팀 페이지 이동 (글로벌 패턴 통일).
import { TeamLink } from "@/components/links/team-link";

// DB에서 가져온 팀 데이터 타입
export type GroupTeam = {
  id: string;
  teamId: string; // Team 테이블의 실제 id (팀 페이지 링크용)
  teamName: string;
  // 2026-05-15 — 팀 로고 URL (사용자 결재 옵션 B / DB team.logoUrl). null = 이니셜 fallback.
  logoUrl?: string | null;
  groupName: string | null;
  // 2026-05-16 PR-Public-1 — 종별 코드 (다종별 view 에서 종별별 필터링용).
  //   단일 종별 운영 = null (회귀 0 / GroupStandings 가 division 미사용 = 모든 그룹 표시).
  division?: string | null;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
  // 2026-05-17 강남구 승점 — DB 박제값 (강남구 = 가산점 / 그 외 = wins*3).
  //   showWinPoints=true 일 때만 컬럼 노출 (강남구 한정 — 다른 대회 시각 변경 0).
  winPoints?: number;
};

type GroupStandingsProps = {
  teams: GroupTeam[];
  // 2026-05-15 — advancedCount prop deprecated (ADVANCED 뱃지 삭제됨 / 호환 위해 남김)
  advancedCount?: number;
  // 2026-05-17 — pointsRule="gnba" 일 때 "P" 컬럼 + 승점 정렬 적용.
  //   미전달 시 default 동작 (기존 = 회귀 0).
  pointsRule?: "gnba" | "default";
};

export function GroupStandings({
  teams,
  pointsRule = "default",
}: GroupStandingsProps) {
  // 강남구 룰 ON 여부 — "P" 컬럼 노출 + 1차 정렬키 결정.
  const showWinPoints = pointsRule === "gnba";
  // 그룹별로 팀을 분류
  const groups = useMemo(() => {
    const map = new Map<string, GroupTeam[]>();
    for (const t of teams) {
      const key = t.groupName ?? "미배정";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    // 2026-05-17 강남구 승점 룰 — pointsRule="gnba" 일 때 1차키 = winPoints / 그 외 = wins (기존).
    //   강남구: 승점 → 득실차 → 다득점 (규정 정합).
    //   default: 승수 → 득실차 (기존 / 회귀 0).
    for (const [, groupTeams] of map) {
      if (showWinPoints) {
        groupTeams.sort((a, b) => {
          const aWP = a.winPoints ?? 0;
          const bWP = b.winPoints ?? 0;
          if (bWP !== aWP) return bWP - aWP;
          if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
          return b.pointsFor - a.pointsFor;
        });
      } else {
        groupTeams.sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          return b.pointDifference - a.pointDifference;
        });
      }
    }
    // 그룹명 알파벳 순 정렬
    return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [teams, showWinPoints]);

  const groupNames = Array.from(groups.keys());

  // 그룹 데이터가 없으면 표시하지 않음
  if (groupNames.length === 0) return null;

  return (
    <section className="mb-12">
      {/* 섹션 헤더 */}
      <div className="mb-6 flex items-center gap-2">
        <h3 className="text-xl font-bold flex items-center gap-2">
          {/* 빨간 세로 막대 */}
          <span
            className="w-1.5 h-6 rounded-sm"
            style={{ backgroundColor: "var(--color-primary)" }}
          />
          조별리그 순위표 (Group Stage)
        </h3>
      </div>

      {/* 2026-05-15 — 조별 탭 → 세로 배열 (모든 조 한눈에 스크롤).
                      각 조 = 제목 (예: "A조") + 테이블 1개. 조 간격 mb-6. */}
      <div className="space-y-6">
        {groupNames.map((groupName) => {
          const groupTeams = groups.get(groupName) ?? [];
          return (
            <div key={groupName}>
              {/* 조 제목 */}
              <h4
                className="mb-3 text-base font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {groupName}조
              </h4>

              {/* 순위 테이블 */}
              <div
                className="rounded overflow-hidden"
                style={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{
                        backgroundColor: "var(--color-surface)",
                        color: "var(--color-text-muted)",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <th className="px-3 py-4 sm:px-6">순위</th>
                      <th className="px-3 py-4 sm:px-6">팀명</th>
                      <th className="px-2 py-4 text-center sm:px-6">경기</th>
                      <th
                        className="px-2 py-4 text-center sm:px-6"
                        style={{ color: "var(--color-primary)" }}
                      >
                        승
                      </th>
                      <th className="px-2 py-4 text-center sm:px-6">패</th>
                      <th className="px-2 py-4 text-center sm:px-6">득실차</th>
                      {/* 2026-05-17 (사용자 명시 이미지 #181) — 득실차 다음에 승점 (강남구 한정). */}
                      {showWinPoints && (
                        <th
                          className="px-2 py-4 text-center sm:px-6"
                          style={{ color: "var(--color-primary)" }}
                          title="승점 (강남구협회장배 규정)"
                        >
                          승점
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {groupTeams.map((team, idx) => {
                      const rank = idx + 1;
                      const totalGames = team.wins + team.losses + team.draws;

                      return (
                        <tr
                          key={team.id}
                          className="transition-colors"
                          style={{
                            borderBottom: "1px solid var(--color-border)",
                          }}
                        >
                          {/* 순위 */}
                          <td
                            className="px-3 py-4 font-bold sm:px-6"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {String(rank).padStart(2, "0")}
                          </td>

                          {/* 팀명 */}
                          <td className="px-3 py-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              {/* 2026-05-15 — 팀 로고 (logoUrl 있으면 이미지 / 없으면 이니셜 fallback).
                                              운영자 권장: DB team.logoUrl 박제 시 정상 표시. */}
                              {team.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={team.logoUrl}
                                  alt={team.teamName}
                                  className="w-8 h-8 rounded object-cover shrink-0"
                                />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded flex items-center justify-center shrink-0 text-xs font-bold"
                                  style={{
                                    backgroundColor: "var(--color-surface)",
                                    color: "var(--color-text-secondary)",
                                  }}
                                >
                                  {team.teamName.charAt(0)}
                                </div>
                              )}
                              <TeamLink
                                teamId={team.teamId}
                                name={team.teamName}
                                className="font-bold"
                                style={{ color: "var(--color-text-primary)" }}
                              />
                            </div>
                          </td>

                          {/* 경기 수 */}
                          <td
                            className="px-2 py-4 text-center font-medium sm:px-6"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            {totalGames}
                          </td>

                          {/* 승 */}
                          <td
                            className="px-2 py-4 text-center font-bold sm:px-6"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {team.wins}
                          </td>

                          {/* 패 */}
                          <td
                            className="px-2 py-4 text-center sm:px-6"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            {team.losses}
                          </td>

                          {/* 득실차 */}
                          <td
                            className="px-2 py-4 text-center sm:px-6"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            {team.pointDifference > 0
                              ? `+${team.pointDifference}`
                              : team.pointDifference === 0
                                ? "0"
                                : String(team.pointDifference)}
                          </td>

                          {/* 2026-05-17 (사용자 명시 이미지 #181) — 득실차 다음에 승점 (강남구 한정 노출). */}
                          {showWinPoints && (
                            <td
                              className="px-2 py-4 text-center font-bold sm:px-6"
                              style={{ color: "var(--color-primary)" }}
                            >
                              {team.winPoints ?? 0}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
