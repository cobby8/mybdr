/**
 * 2026-05-16 PR-Admin-6 — 종별 standings 표 (admin 흐름 §6.5 우선 6).
 *
 * 이유(왜):
 *   - admin-flow-audit-2026-05-16 §3 단계 10~11 = 예선 종료 → 순위전 → 결승 → 우승팀 결정.
 *   - 현재 종별 standings 시각화 = 0 (DB 만 존재 / 운영자가 매치 결과로 추정해야 함).
 *   - 본 컴포넌트 = playoffs hub 의 섹션 1 — getDivisionStandings 결과를 표로 렌더 (재사용 가능).
 *
 * 디자인 룰 (BDR 13):
 *   - 그룹별 카드 + 표 / rounded-[4px] / var(--color-*) 토큰만
 *   - 1위 = ok 톤 / 2위 = info 톤 강조 (운영자 시각 인지 보조)
 *   - 모바일 = 가로 스크롤 (overflow-x-auto)
 */

import { Card } from "@/components/ui/card";
import type { DivisionStanding } from "@/lib/tournaments/division-advancement";

type Props = {
  // 종별 표시명 (예: "i3 U9", "i2 U11"). divisionCode 그대로 폴백.
  divisionLabel: string;
  // getDivisionStandings 결과 (server component 에서 fetch 후 props 로 전달)
  standings: DivisionStanding[];
};

export function StandingsTable({ divisionLabel, standings }: Props) {
  // 그룹별 분류 — getDivisionStandings 가 이미 그룹별 정렬 산출 / 추가 그룹핑만 수행
  const byGroup = standings.reduce<Map<string, DivisionStanding[]>>((map, s) => {
    if (!map.has(s.groupName)) map.set(s.groupName, []);
    map.get(s.groupName)!.push(s);
    return map;
  }, new Map());

  // 그룹 키 알파벳 순 (A, B, C, ...)
  const groupKeys = Array.from(byGroup.keys()).sort();

  // standings 0건 = 예선 매치 미진행 또는 종별 팀 0
  if (standings.length === 0) {
    return (
      <Card>
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{divisionLabel}</p>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          예선 매치가 없거나 팀 등록 0건 — standings 산출 불가.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{divisionLabel}</p>
        <span className="rounded-[4px] bg-[var(--color-elevated)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
          {standings.length}팀
        </span>
      </div>

      <div className="space-y-3">
        {groupKeys.map((g) => {
          const rows = byGroup.get(g) ?? [];
          return (
            <div key={g} className="rounded-[4px] bg-[var(--color-surface)] p-2">
              <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                {g === "X" ? "그룹 미지정" : `${g}조`} ({rows.length}팀)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr
                      className="border-b text-left"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      <th className="px-2 py-1.5 font-semibold w-8">순위</th>
                      <th className="px-2 py-1.5 font-semibold">팀</th>
                      <th className="px-2 py-1.5 text-right font-semibold w-10">승</th>
                      <th className="px-2 py-1.5 text-right font-semibold w-10">패</th>
                      <th className="px-2 py-1.5 text-right font-semibold w-12">득</th>
                      <th className="px-2 py-1.5 text-right font-semibold w-12">실</th>
                      <th className="px-2 py-1.5 text-right font-semibold w-12">득실</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.tournamentTeamId}
                        className="border-b last:border-0"
                        style={{ borderColor: "var(--color-border-subtle)" }}
                      >
                        {/* 순위 — 1위 = success / 2위 = info / 그 외 = muted */}
                        <td className="px-2 py-1.5">
                          <span
                            className="rounded-[4px] px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
                            style={{
                              backgroundColor:
                                row.groupRank === 1
                                  ? "color-mix(in srgb, var(--color-success) 15%, transparent)"
                                  : row.groupRank === 2
                                    ? "color-mix(in srgb, var(--color-info) 15%, transparent)"
                                    : "var(--color-elevated)",
                              color:
                                row.groupRank === 1
                                  ? "var(--color-success)"
                                  : row.groupRank === 2
                                    ? "var(--color-info)"
                                    : "var(--color-text-muted)",
                            }}
                          >
                            {row.groupRank}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 font-medium text-[var(--color-text-primary)]">
                          {row.teamName}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{row.wins}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-[var(--color-text-muted)]">
                          {row.losses}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-[var(--color-text-muted)]">
                          {row.pointsFor}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-[var(--color-text-muted)]">
                          {row.pointsAgainst}
                        </td>
                        {/* 득실차 — 양수 = success / 음수 = warning / 0 = muted */}
                        <td
                          className="px-2 py-1.5 text-right font-semibold tabular-nums"
                          style={{
                            color:
                              row.pointDifference > 0
                                ? "var(--color-success)"
                                : row.pointDifference < 0
                                  ? "var(--color-warning)"
                                  : "var(--color-text-muted)",
                          }}
                        >
                          {row.pointDifference > 0 ? "+" : ""}
                          {row.pointDifference}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
