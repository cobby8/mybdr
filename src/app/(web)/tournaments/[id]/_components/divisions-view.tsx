/**
 * 2026-05-16 PR-Public-1 — 공개 bracket 탭 다종별 view (시안 4 사진 통합).
 *
 * 이유(왜):
 *   - 강남구협회장배 같은 다종별 + 풀리그/조별/순위전 placeholder 대회는
 *     기존 BracketView (round_number/bracket_position 기반 SVG 트리) 로 표시 불가능.
 *   - 매치 59건 = round_number/bracket_position NULL → bracketOnlyMatches.length=0 →
 *     hasKnockout=false → BracketEmpty 노출되는 사고 fix.
 *   - 신규 view = 종별 탭 + (조편성 / 예선 매치 / 순위전 placeholder / 결승) 5 섹션.
 *
 * 5 섹션:
 *   1) 조편성 (DivisionGroupComposition) — 시안 사진 1
 *   2) 종별 standings (조별 순위 — 진행 중/완료 시 표시)
 *   3) 예선 매치 일정 표 (DivisionScheduleTable preliminary) — 시안 사진 2~3
 *   4) 순위전 placeholder 표 (DivisionScheduleTable ranking) — 시안 사진 4
 *   5) 결승 + 우승팀 (DivisionScheduleTable final) — 박제된 경우만 (Q4 권장값)
 *
 * 종별 탭 가드:
 *   - divisionRules.length >= 2 시만 탭 노출 (단일 종별 운영 회귀 0)
 *   - URL ?division=i3-U9 deep link (admin /playoffs:142 패턴 답습)
 *
 * admin /playoffs 회귀 0:
 *   - admin /playoffs 컴포넌트 (StandingsTable / playoffs-client / Banner / Advance) 변경 0
 *   - 본 컴포넌트 = 공개 페이지 별도 view / admin 의존 0
 *
 * 디자인 룰 (BDR 13):
 *   - var(--color-info) Navy 활성 / var(--color-elevated) 비활성 / rounded-[4px]
 *   - material-symbols-outlined / lucide-react ❌ / pill 9999px ❌
 *   - 모바일 flex-wrap / 44px+ 터치
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { GroupTeam } from "../bracket/_components/group-standings";
import { DivisionGroupComposition } from "./division-group-composition";
import {
  DivisionScheduleTable,
  type DivisionMatch,
} from "./division-schedule-table";

// 종별 룰 (route.ts:357 응답 shape)
export type DivisionRule = {
  code: string;
  label: string;
  format: string | null;
  // settings 는 server-side JSON → unknown (group_size / homeSlotLabel 등 옵셔널)
  settings: Record<string, unknown> | null;
};

// 종별 standings (division-advancement.ts:29 DivisionStanding 동등)
export type DivisionStandingItem = {
  tournamentTeamId: string;
  teamName: string;
  groupName: string;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
  groupRank: number;
};

export type DivisionStandingBundle = {
  code: string;
  label: string;
  standings: DivisionStandingItem[];
};

type Props = {
  divisionRules: DivisionRule[];
  divisionStandings: DivisionStandingBundle[];
  groupTeams: GroupTeam[];
  // leagueMatches = route.ts leagueMatches 그대로 (DivisionMatch shape 호환)
  leagueMatches: DivisionMatch[];
};

// 정규식 — admin /playoffs:78 동등 (단일 source 룰)
const RANKING_ROUND_REGEX = /순위/;
const FINAL_ROUND_REGEX = /결승|final/i;

// 매치 분류 — preliminary / ranking / final
function classifyMatch(m: DivisionMatch): "preliminary" | "ranking" | "final" {
  if (m.roundName && FINAL_ROUND_REGEX.test(m.roundName)) return "final";
  if (m.roundName && RANKING_ROUND_REGEX.test(m.roundName)) return "ranking";
  return "preliminary";
}

export function DivisionsView({
  divisionRules,
  divisionStandings,
  groupTeams,
  leagueMatches,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ─────────────────────────────────────────────────────────────
  // 종별 탭 state — null = 전체 / "i3-U9" 등 = 단일 종별
  //   admin /playoffs:127 패턴 답습 (검증된 패턴 / premature abstraction 회피)
  //   URL ?division= deep link (브라우저 뒤로가기 / 공유 가능)
  // ─────────────────────────────────────────────────────────────
  const [selectedDivision, setSelectedDivision] = useState<string | null>(
    searchParams?.get("division") ?? null,
  );

  // 종별 코드 목록 (탭 렌더 source)
  const divisionCodes = useMemo(
    () => divisionRules.map((r) => r.code),
    [divisionRules],
  );

  // 종별 라벨 lookup
  const labelByCode = useMemo(
    () => new Map(divisionRules.map((r) => [r.code, r.label])),
    [divisionRules],
  );

  // 탭 가드 — 종별 ≥2 시만 탭 노출 (단일 종별 운영 회귀 0 / Q3 권장값)
  const showDivisionTabs = divisionRules.length > 1;

  // URL deep link 폴백 — ?division= 잘못된 코드 / 단일 종별 모드 = null 강제
  useEffect(() => {
    if (!showDivisionTabs && selectedDivision !== null) {
      setSelectedDivision(null);
      return;
    }
    if (selectedDivision !== null && !divisionCodes.includes(selectedDivision)) {
      setSelectedDivision(null);
    }
  }, [selectedDivision, divisionCodes, showDivisionTabs]);

  // selectedDivision → URL 동기화 (admin /playoffs:153 패턴)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (selectedDivision) {
      params.set("division", selectedDivision);
    } else {
      params.delete("division");
    }
    // tab=bracket 보존 — bracket 탭에서 진입한 경우 (page.tsx 기본 탭)
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
    // searchParams dependency 제외 — replace 호출 시 자기 자신 변경 → 무한 loop 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDivision, router]);

  // ─────────────────────────────────────────────────────────────
  // 표시할 종별 결정 — selectedDivision = null 이면 모든 종별 / 아니면 단일 종별
  // ─────────────────────────────────────────────────────────────
  const visibleDivisions = useMemo(() => {
    if (selectedDivision) {
      const single = divisionRules.find((r) => r.code === selectedDivision);
      return single ? [single] : divisionRules;
    }
    return divisionRules;
  }, [selectedDivision, divisionRules]);

  // 매치 카운트 (탭 라벨용) — 종별별 매치 수 + 분류별
  const matchCountByDivision = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of leagueMatches) {
      const code = m.division ?? "_no_division";
      map.set(code, (map.get(code) ?? 0) + 1);
    }
    return map;
  }, [leagueMatches]);

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          종별 탭 (≥2 종별 시만 노출 / admin /playoffs:224 패턴 답습)
          ───────────────────────────────────────────────────────────── */}
      {showDivisionTabs && (
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            종별:
          </span>
          {/* 전체 탭 — selectedDivision = null */}
          <button
            type="button"
            onClick={() => setSelectedDivision(null)}
            className="min-h-[44px] rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor:
                selectedDivision === null
                  ? "var(--color-info)"
                  : "var(--color-elevated)",
              color:
                selectedDivision === null
                  ? "#fff"
                  : "var(--color-text-muted)",
            }}
          >
            전체 ({divisionRules.length}종별)
          </button>
          {/* 종별별 탭 — 카운트 = 해당 종별 매치 수 */}
          {divisionRules.map((d) => {
            const count = matchCountByDivision.get(d.code) ?? 0;
            const tabLabel = d.label === d.code ? d.code : d.label;
            const active = selectedDivision === d.code;
            return (
              <button
                key={d.code}
                type="button"
                onClick={() => setSelectedDivision(d.code)}
                className="min-h-[44px] rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: active
                    ? "var(--color-info)"
                    : "var(--color-elevated)",
                  color: active ? "#fff" : "var(--color-text-muted)",
                }}
              >
                {tabLabel} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          종별별 5 섹션 렌더 (selectedDivision 에 따라 1개 또는 N개)
          ───────────────────────────────────────────────────────────── */}
      {visibleDivisions.map((rule) => {
        // 종별 매치 + 종별 그룹 팀 필터링
        const divisionMatches = leagueMatches.filter(
          (m) => m.division === rule.code,
        );
        const divisionGroupTeams = groupTeams.filter(
          (t) => t.division === rule.code,
        );

        // 매치 분류 — preliminary / ranking / final
        const preliminaryMatches = divisionMatches.filter(
          (m) => classifyMatch(m) === "preliminary",
        );
        const rankingMatches = divisionMatches.filter(
          (m) => classifyMatch(m) === "ranking",
        );
        const finalMatches = divisionMatches.filter(
          (m) => classifyMatch(m) === "final",
        );

        // 종별 standings (해당 코드만)
        const standingsBundle = divisionStandings.find(
          (s) => s.code === rule.code,
        );

        const divisionLabel =
          rule.label === rule.code ? rule.code : rule.label;

        return (
          <article
            key={rule.code}
            className="space-y-6"
            // 종별 N개 표시 시 시각적 구분 — 종별 사이 가벼운 구분선
            style={{
              borderTop:
                visibleDivisions.length > 1
                  ? "1px solid var(--color-border)"
                  : "none",
              paddingTop: visibleDivisions.length > 1 ? "1.5rem" : 0,
            }}
          >
            {/* 종별 헤더 (종별 N개 표시 시) — 단일 종별 모드 시 생략 (탭이 이미 표시) */}
            {visibleDivisions.length > 1 && (
              <header className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined"
                  style={{ color: "var(--color-info)", fontSize: 28 }}
                  aria-hidden="true"
                >
                  groups
                </span>
                <div>
                  <h2
                    className="text-lg font-bold sm:text-xl"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {divisionLabel}
                  </h2>
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {divisionGroupTeams.length}팀 · {divisionMatches.length}경기
                    {rule.format ? ` · ${rule.format}` : ""}
                  </p>
                </div>
              </header>
            )}

            {/* 섹션 1 — 조편성 표 (시안 사진 1) */}
            <DivisionGroupComposition
              divisionLabel={divisionLabel}
              groupTeams={divisionGroupTeams}
            />

            {/* 섹션 2 — 종별 standings (예선 결과 / 진행 중 시 표시).
                standings 0건 (예선 시작 전) = 미렌더 (회귀 0) */}
            {standingsBundle && standingsBundle.standings.length > 0 && (
              <DivisionStandingsView
                divisionLabel={divisionLabel}
                standings={standingsBundle.standings}
              />
            )}

            {/* 섹션 3 — 예선 매치 일정 표 (시안 사진 2~3) */}
            <DivisionScheduleTable
              title={`${divisionLabel} · 예선 일정`}
              matches={preliminaryMatches}
              emptyMessage="예선 매치가 박제되지 않았습니다."
            />

            {/* 섹션 4 — 순위전 placeholder 표 (시안 사진 4).
                순위전 매치 0건이면 미렌더 (Q4 권장값 — 빈 카드 노출 X) */}
            {rankingMatches.length > 0 && (
              <DivisionScheduleTable
                title={`${divisionLabel} · 순위결정전`}
                matches={rankingMatches}
              />
            )}

            {/* 섹션 5 — 결승 + 우승팀 (Q4 권장값 — 박제된 경우만 표시) */}
            {finalMatches.length > 0 && (
              <DivisionScheduleTable
                title={`${divisionLabel} · 결승전`}
                matches={finalMatches}
              />
            )}
          </article>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// DivisionStandingsView — 종별 standings 표 (admin StandingsTable 패턴 답습 / web 디자인).
//   admin StandingsTable 은 admin 콤팩트 디자인 → 공개 페이지에 어울림 X.
//   GroupStandings (web) 는 GroupTeam[] 타입 (이미 사용 중) → standings 시각화엔
//   "groupRank" 별 정렬 + 그룹 헤더 표시 필요. 본 컴포넌트가 그 역할.
// ─────────────────────────────────────────────────────────────────────────

function DivisionStandingsView({
  divisionLabel,
  standings,
}: {
  divisionLabel: string;
  standings: DivisionStandingItem[];
}) {
  // 그룹별 분류 (standings 는 이미 groupRank 정렬됨 — division-advancement.ts:82)
  const byGroup = useMemo(() => {
    const map = new Map<string, DivisionStandingItem[]>();
    for (const s of standings) {
      const key = s.groupName ?? "X";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [standings]);

  const groupNames = Array.from(byGroup.keys()).sort();
  if (groupNames.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <span
          className="w-1.5 h-6 rounded-sm"
          style={{ backgroundColor: "var(--color-primary)" }}
          aria-hidden="true"
        />
        <h3
          className="text-base font-bold sm:text-lg"
          style={{ color: "var(--color-text-primary)" }}
        >
          {divisionLabel} · 예선 결과
        </h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {groupNames.map((groupName) => {
          const groupStandings = byGroup.get(groupName) ?? [];
          return (
            <div
              key={groupName}
              className="rounded-[4px] overflow-hidden border"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-card)",
              }}
            >
              <div
                className="px-4 py-2 text-sm font-bold"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {groupName}조
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr
                    className="text-xs uppercase tracking-wide"
                    style={{
                      color: "var(--color-text-muted)",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <th className="px-3 py-2 w-10 text-center">순위</th>
                    <th className="px-3 py-2">팀명</th>
                    <th className="px-2 py-2 text-center w-12">승</th>
                    <th className="px-2 py-2 text-center w-12">패</th>
                    <th className="px-2 py-2 text-center w-16">득실</th>
                  </tr>
                </thead>
                <tbody>
                  {groupStandings.map((s) => (
                    <tr
                      key={s.tournamentTeamId}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <td
                        className="px-3 py-2 text-center font-bold tabular-nums"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {s.groupRank}
                      </td>
                      <td
                        className="px-3 py-2 truncate"
                        style={{ color: "var(--color-text-primary)" }}
                        title={s.teamName}
                      >
                        {s.teamName}
                      </td>
                      <td
                        className="px-2 py-2 text-center font-medium tabular-nums"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {s.wins}
                      </td>
                      <td
                        className="px-2 py-2 text-center tabular-nums"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {s.losses}
                      </td>
                      <td
                        className="px-2 py-2 text-center tabular-nums"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {s.pointDifference > 0
                          ? `+${s.pointDifference}`
                          : s.pointDifference}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </section>
  );
}
