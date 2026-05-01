"use client";

// 2026-05-02: 옛 page.tsx 의 BoxScoreTable 풀 복원
// 이유: v2 의 단순 17컬럼 테이블 → 옛 풍부한 박스스코어 (쿼터 필터 / DNP 분리 / TOTAL 행 / 안내 배너) 로 교체.
// 사용자 요청: "기존에 구현했었던 기록 UI와 순서 그대로 복구".
//
// 출처: src/app/live/[id]/page.tsx L970-1345 의 BoxScoreTable 컴포넌트.
// 변경: PlayerRow 타입 → PlayerRowV2 (game-result.tsx 의 v2 타입). 동일 필드 + quarter_stats 옵셔널.
// 디자인: --color-* 호환 토큰 사용 (globals.css L1958~ alias 레이어). 옛 코드와 동일 시각.

import { useState } from "react";
import type { PlayerRowV2 } from "./game-result";

// 얼룩무늬 / TOTAL / 짝수행 배경 — 옛 page.tsx L425-432 그대로 카피
const ZEBRA_BG = "color-mix(in srgb, var(--color-card), #7f7f7f 6%)";
const TOTAL_ROW_BG = "color-mix(in srgb, var(--color-card), #7f7f7f 10%)";
const ROW_EVEN_BG = "var(--color-card)";

// 게임 클럭 포맷 — 초 → "M:SS" (옛 page.tsx L165-169)
function formatGameClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function BoxScoreTable({
  teamName,
  color,
  players,
  hasOT = false,
  hasQuarterEventDetail = true,
}: {
  teamName: string;
  color: string;
  players: PlayerRowV2[];
  // OT 쿼터 존재 시 쿼터 필터 버튼에 OT 노출
  hasOT?: boolean;
  // 쿼터별 이벤트 상세 스탯 존재 여부 — false + 쿼터 필터 활성 시 안내 배너 + 스탯 "-"
  hasQuarterEventDetail?: boolean;
}) {
  // 쿼터 필터 state — "all" | "1" ~ "5"
  // 이유: 사용자가 특정 쿼터만 집중해서 보고 싶을 때 활용. "all"은 전체 합계(기본값).
  const [quarterFilter, setQuarterFilter] = useState<string>("all");

  if (!players || players.length === 0) return null;

  // 이벤트 없는 경기 + 쿼터 필터 활성 → MIN/+- 외 모든 스탯 "-"
  const showPlaceholder = !hasQuarterEventDetail && quarterFilter !== "all";

  // 쿼터 필터 헬퍼 — "all" 이면 원본, 특정 쿼터면 quarter_stats[k] 으로 치환
  // dnp 필드는 원본 유지 (쿼터 필터와 무관하게 등록만 하고 출전 0인 선수 구분)
  const applyQuarterFilter = (p: PlayerRowV2): PlayerRowV2 => {
    if (quarterFilter === "all") return p;
    const qs = p.quarter_stats?.[quarterFilter];
    if (!qs) {
      // 해당 쿼터 미기록 → 모두 0 (UI 에서 0% 또는 "-" 표시)
      return {
        ...p,
        min: 0,
        min_seconds: 0,
        pts: 0,
        fgm: 0,
        fga: 0,
        tpm: 0,
        tpa: 0,
        ftm: 0,
        fta: 0,
        oreb: 0,
        dreb: 0,
        reb: 0,
        ast: 0,
        stl: 0,
        blk: 0,
        to: 0,
        fouls: 0,
        plus_minus: 0,
      };
    }
    return {
      ...p,
      min: qs.min,
      min_seconds: qs.min_seconds,
      pts: qs.pts,
      fgm: qs.fgm,
      fga: qs.fga,
      tpm: qs.tpm,
      tpa: qs.tpa,
      ftm: qs.ftm,
      fta: qs.fta,
      oreb: qs.oreb,
      dreb: qs.dreb,
      reb: qs.reb,
      ast: qs.ast,
      stl: qs.stl,
      blk: qs.blk,
      to: qs.to,
      fouls: qs.fouls,
      plus_minus: qs.plus_minus,
    };
  };

  // DNP 분리 + 활성 선수 정렬 (스타팅 우선 → 백넘버 오름차순)
  const activePlayers = players.filter((p) => !p.dnp).map(applyQuarterFilter);
  const dnpPlayers = players.filter((p) => p.dnp);
  const sortByStarterJersey = (a: PlayerRowV2, b: PlayerRowV2) => {
    const aS = a.is_starter ? 1 : 0;
    const bS = b.is_starter ? 1 : 0;
    if (aS !== bS) return bS - aS;
    const aJ = a.jersey_number ?? 999;
    const bJ = b.jersey_number ?? 999;
    return aJ - bJ;
  };
  const sorted = [...activePlayers].sort(sortByStarterJersey);
  dnpPlayers.sort(sortByStarterJersey);

  // 슈팅 확률 헬퍼 — 시도 0 이면 0%
  const pct = (made: number, attempted: number) =>
    attempted > 0 ? Math.round((made / attempted) * 100) : 0;

  // PTS 셀 좌측 팀색 띠 (3px) — NBA.com 스타일.
  // 이유: 라이트 모드에서 흰색에 가까운 팀 컬러가 안 보이는 문제 해결.
  const PtsTeamBar = () => (
    <span
      aria-hidden
      style={{
        position: "absolute",
        left: 0,
        top: "20%",
        bottom: "20%",
        width: "3px",
        backgroundColor: color,
        borderRadius: "2px",
      }}
    />
  );

  return (
    <div className="print-team-table-wrap">
      {/* 팀명 + 쿼터 필터 — 프린트에서는 hidden */}
      <div className="flex items-center gap-2 mb-2 print:hidden flex-wrap">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {teamName}
        </span>
        {/* 쿼터 필터 버튼 그룹 — 전체/1Q/2Q/3Q/4Q/OT(있을 때만) */}
        <div className="ml-auto flex items-center gap-1 print:hidden">
          {[
            { key: "all", label: "전체" },
            { key: "1", label: "1Q" },
            { key: "2", label: "2Q" },
            { key: "3", label: "3Q" },
            { key: "4", label: "4Q" },
            ...(hasOT ? [{ key: "5", label: "OT" }] : []),
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setQuarterFilter(key)}
              className="px-2 py-1 text-xs rounded transition-colors"
              style={{
                backgroundColor:
                  quarterFilter === key ? "var(--color-primary)" : "var(--color-surface)",
                color: quarterFilter === key ? "#ffffff" : "var(--color-text-muted)",
                border: `1px solid ${
                  quarterFilter === key ? "var(--color-primary)" : "var(--color-border)"
                }`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 이벤트 없는 경기 + 쿼터 필터 활성 안내 배너 */}
      {showPlaceholder && (
        <div
          className="mb-2 px-3 py-2 rounded text-xs print:hidden"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <span className="material-symbols-outlined align-middle text-base mr-1">info</span>
          이 경기는 실시간 이벤트 기록 없이 최종 스탯만 입력되어, 쿼터별 세부 스탯(PTS/FG/REB
          등)은 표시되지 않습니다. MIN과 +/-만 유효합니다.
        </div>
      )}

      {/* 테이블 본체 */}
      <div className="rounded-md overflow-hidden" style={{ backgroundColor: "var(--color-card)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr
                className="border-b"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-muted)",
                }}
              >
                <th
                  className="py-2 px-3 text-left font-normal sticky left-0 z-10 print:static print:bg-transparent"
                  style={{ backgroundColor: "var(--color-card)" }}
                >
                  #
                </th>
                <th
                  className="py-2 px-1 text-left font-normal sticky left-8 z-10 min-w-[70px] print:static print:bg-transparent"
                  style={{ backgroundColor: "var(--color-card)" }}
                >
                  이름
                </th>
                <th className="py-2 px-0.5 text-center font-normal">MIN</th>
                <th
                  className="py-2 px-0.5 text-center font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  PTS
                </th>
                <th className="py-2 px-0.5 text-center font-normal">FG</th>
                <th className="py-2 px-0.5 text-center font-normal">FG%</th>
                <th className="py-2 px-0.5 text-center font-normal">3P</th>
                <th className="py-2 px-0.5 text-center font-normal">3P%</th>
                <th className="py-2 px-0.5 text-center font-normal">FT</th>
                <th className="py-2 px-0.5 text-center font-normal">FT%</th>
                <th className="py-2 px-0.5 text-center font-normal">OR</th>
                <th className="py-2 px-0.5 text-center font-normal">DR</th>
                <th className="py-2 px-0.5 text-center font-normal">REB</th>
                <th className="py-2 px-0.5 text-center font-normal">AST</th>
                <th className="py-2 px-0.5 text-center font-normal">STL</th>
                <th className="py-2 px-0.5 text-center font-normal">BLK</th>
                <th className="py-2 px-0.5 text-center font-normal">TO</th>
                <th className="py-2 px-0.5 text-center font-normal">PF</th>
                <th className="py-2 px-0.5 text-center font-normal">+/-</th>
              </tr>
            </thead>
            <tbody>
              {/* 활성 선수 행 — 얼룩무늬 + sticky 셀(번호/이름) */}
              {sorted.map((p, i) => (
                <tr
                  key={p.id}
                  className="border-b"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: i % 2 === 0 ? ROW_EVEN_BG : ZEBRA_BG,
                  }}
                >
                  <td
                    className="py-2 px-3 sticky left-0 z-10 bg-inherit print:static print:bg-transparent"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {p.jersey_number ?? "-"}
                  </td>
                  <td
                    className="py-2 px-1 sticky left-8 z-10 bg-inherit min-w-[70px] truncate max-w-[70px] print:static print:bg-transparent print:max-w-none"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {p.name}
                  </td>
                  <td
                    className="py-2 px-0.5 text-center"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {formatGameClock(p.min_seconds ?? p.min * 60)}
                  </td>
                  {/* PTS — 팀색 좌측 띠 (3px) + 텍스트 기본색. 부모 td 가 relative */}
                  <td
                    className="py-2 px-0.5 text-center font-bold relative"
                    style={{
                      color: showPlaceholder
                        ? "var(--color-text-muted)"
                        : "var(--color-text-primary)",
                    }}
                  >
                    {!showPlaceholder && <PtsTeamBar />}
                    {showPlaceholder ? "-" : p.pts}
                  </td>
                  {/* 슈팅 스탯 — showPlaceholder 시 "-" */}
                  <td
                    className="py-2 px-0.5 text-center"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {showPlaceholder ? "-" : `${p.fgm}/${p.fga}`}
                  </td>
                  <td
                    className="py-2 px-0.5 text-center"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {showPlaceholder ? "-" : `${pct(p.fgm, p.fga)}%`}
                  </td>
                  <td
                    className="py-2 px-0.5 text-center"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {showPlaceholder ? "-" : `${p.tpm}/${p.tpa}`}
                  </td>
                  <td
                    className="py-2 px-0.5 text-center"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {showPlaceholder ? "-" : `${pct(p.tpm, p.tpa)}%`}
                  </td>
                  <td
                    className="py-2 px-0.5 text-center"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {showPlaceholder ? "-" : `${p.ftm}/${p.fta}`}
                  </td>
                  <td
                    className="py-2 px-0.5 text-center"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {showPlaceholder ? "-" : `${pct(p.ftm, p.fta)}%`}
                  </td>
                  <td
                    className="py-2 px-0.5 text-center"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {showPlaceholder ? "-" : p.oreb}
                  </td>
                  <td
                    className="py-2 px-0.5 text-center"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {showPlaceholder ? "-" : p.dreb}
                  </td>
                  <td
                    className="py-2 px-0.5 text-center font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {showPlaceholder ? "-" : p.reb}
                  </td>
                  <td
                    className="py-2 px-0.5 text-center"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {showPlaceholder ? "-" : p.ast}
                  </td>
                  <td
                    className="py-2 px-0.5 text-center"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {showPlaceholder ? "-" : p.stl}
                  </td>
                  <td
                    className="py-2 px-0.5 text-center"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {showPlaceholder ? "-" : p.blk}
                  </td>
                  <td
                    className="py-2 px-0.5 text-center"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {showPlaceholder ? "-" : p.to}
                  </td>
                  <td
                    className="py-2 px-0.5 text-center"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {showPlaceholder ? "-" : p.fouls}
                  </td>
                  <td
                    className="py-2 px-0.5 text-center"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {p.plus_minus != null
                      ? p.plus_minus > 0
                        ? `+${p.plus_minus}`
                        : p.plus_minus
                      : "-"}
                  </td>
                </tr>
              ))}

              {/* DNP 행 — MIN 셀에 "DNP" 표시, 나머지 16개 셀은 "-" */}
              {dnpPlayers.map((p, i) => (
                <tr
                  key={`dnp-${p.id}`}
                  className="border-b"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: (sorted.length + i) % 2 === 0 ? ROW_EVEN_BG : ZEBRA_BG,
                  }}
                >
                  <td
                    className="py-2 px-3 sticky left-0 z-10 bg-inherit print:static print:bg-transparent"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {p.jersey_number ?? "-"}
                  </td>
                  <td
                    className="py-2 px-1 sticky left-8 z-10 bg-inherit min-w-[70px] truncate max-w-[70px] print:static print:bg-transparent print:max-w-none"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {p.name}
                  </td>
                  <td
                    className="py-2 px-0.5 text-center text-xs font-semibold tracking-wider"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    DNP
                  </td>
                  {Array.from({ length: 16 }).map((_, idx) => (
                    <td
                      key={idx}
                      className="py-2 px-0.5 text-center"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      -
                    </td>
                  ))}
                </tr>
              ))}

              {/* TOTAL 합산 행 — 출전 선수만 (DNP 제외) */}
              {(() => {
                const total = activePlayers.reduce(
                  (acc, p) => ({
                    min: acc.min + p.min,
                    min_seconds: acc.min_seconds + (p.min_seconds ?? p.min * 60),
                    pts: acc.pts + p.pts,
                    fgm: acc.fgm + p.fgm,
                    fga: acc.fga + p.fga,
                    tpm: acc.tpm + p.tpm,
                    tpa: acc.tpa + p.tpa,
                    ftm: acc.ftm + p.ftm,
                    fta: acc.fta + p.fta,
                    oreb: acc.oreb + p.oreb,
                    dreb: acc.dreb + p.dreb,
                    reb: acc.reb + p.reb,
                    ast: acc.ast + p.ast,
                    stl: acc.stl + p.stl,
                    blk: acc.blk + p.blk,
                    to: acc.to + p.to,
                    fouls: acc.fouls + p.fouls,
                  }),
                  {
                    min: 0,
                    min_seconds: 0,
                    pts: 0,
                    fgm: 0,
                    fga: 0,
                    tpm: 0,
                    tpa: 0,
                    ftm: 0,
                    fta: 0,
                    oreb: 0,
                    dreb: 0,
                    reb: 0,
                    ast: 0,
                    stl: 0,
                    blk: 0,
                    to: 0,
                    fouls: 0,
                  },
                );
                const totalStickyBg = "var(--color-elevated)";
                return (
                  <tr
                    className="border-t font-semibold print-total-row"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: TOTAL_ROW_BG,
                    }}
                  >
                    <td
                      className="py-2 px-3 sticky left-0 z-10 print:static print:bg-transparent"
                      style={{
                        color: "var(--color-text-secondary)",
                        backgroundColor: totalStickyBg,
                      }}
                    />
                    <td
                      className="py-2 px-1 sticky left-8 z-10 print:static print:bg-transparent"
                      style={{
                        color: "var(--color-text-primary)",
                        backgroundColor: totalStickyBg,
                      }}
                    >
                      TOTAL
                    </td>
                    <td
                      className="py-2 px-0.5 text-center"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {formatGameClock(total.min_seconds)}
                    </td>
                    <td
                      className="py-2 px-0.5 text-center relative"
                      style={{
                        color: showPlaceholder
                          ? "var(--color-text-muted)"
                          : "var(--color-text-primary)",
                      }}
                    >
                      {!showPlaceholder && <PtsTeamBar />}
                      {showPlaceholder ? "-" : total.pts}
                    </td>
                    <td
                      className="py-2 px-0.5 text-center"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {showPlaceholder ? "-" : `${total.fgm}/${total.fga}`}
                    </td>
                    <td
                      className="py-2 px-0.5 text-center"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {showPlaceholder ? "-" : `${pct(total.fgm, total.fga)}%`}
                    </td>
                    <td
                      className="py-2 px-0.5 text-center"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {showPlaceholder ? "-" : `${total.tpm}/${total.tpa}`}
                    </td>
                    <td
                      className="py-2 px-0.5 text-center"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {showPlaceholder ? "-" : `${pct(total.tpm, total.tpa)}%`}
                    </td>
                    <td
                      className="py-2 px-0.5 text-center"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {showPlaceholder ? "-" : `${total.ftm}/${total.fta}`}
                    </td>
                    <td
                      className="py-2 px-0.5 text-center"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {showPlaceholder ? "-" : `${pct(total.ftm, total.fta)}%`}
                    </td>
                    <td
                      className="py-2 px-0.5 text-center"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {showPlaceholder ? "-" : total.oreb}
                    </td>
                    <td
                      className="py-2 px-0.5 text-center"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {showPlaceholder ? "-" : total.dreb}
                    </td>
                    <td
                      className="py-2 px-0.5 text-center"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {showPlaceholder ? "-" : total.reb}
                    </td>
                    <td
                      className="py-2 px-0.5 text-center"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {showPlaceholder ? "-" : total.ast}
                    </td>
                    <td
                      className="py-2 px-0.5 text-center"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {showPlaceholder ? "-" : total.stl}
                    </td>
                    <td
                      className="py-2 px-0.5 text-center"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {showPlaceholder ? "-" : total.blk}
                    </td>
                    <td
                      className="py-2 px-0.5 text-center"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {showPlaceholder ? "-" : total.to}
                    </td>
                    <td
                      className="py-2 px-0.5 text-center"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {showPlaceholder ? "-" : total.fouls}
                    </td>
                    <td
                      className="py-2 px-0.5 text-center"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      -
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
