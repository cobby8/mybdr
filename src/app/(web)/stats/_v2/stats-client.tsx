"use client";

/* ============================================================
 * /stats — StatsClient (시즌 셀렉터 · 3탭 · KPI · TREND · 클럽순위 · GAME_LOG · ZONES)
 *
 * 왜 client 인가:
 *  - 시즌 셀렉터/탭 전환 = 인터랙션. server 에서 전 시즌을 선계산(perSeason)해 prop 으로
 *    받으므로(옵션 A), 전환은 클라 useState 필터만 = 추가 fetch/라우트 0.
 *
 * 강조색 규칙 (errors[2026-06-10] 폴백 함정):
 *  - 시안 Stats.jsx 의 var(--accent)(빨강) 강조 → 전부 var(--cafe-blue) 로 박제(.st-* CSS).
 *  - 승/패 badge 만 의미색(ex-badge--ok / --red = 기존 운영 토큰).
 *
 * 데이터 매핑:
 *  - KPI 8칸: 7칸 실값(PPG/APG/RPG/SPG/FG%/3P%/FT%) + 레이팅 = "—"(avg_rating 0행, 대체 안 함).
 *  - TREND: 선택 시즌 경기별 득점(헬퍼 trend[]).
 *  - 클럽순위: 팀동료 대비 부문 순위(rows 0 → 카드 hide).
 *  - GAME_LOG: 최근 N 경기 row.
 *  - ZONES: 항상 "집계 준비중"(ShotZoneStat 0행 + MPS 존정보 무 → hide).
 * ============================================================ */

import { useState } from "react";
import type { MySeasonStatsResult } from "@/lib/stats/my-season-stats";

interface Props {
  /** 데이터 있는 시즌 연도 목록(내림차순) */
  seasons: number[];
  /** 기본 선택 시즌(최근 시즌 or "career") */
  defaultSeason: number | "career";
  /** 시즌키("career" | "2026"…) → 선계산 결과 */
  perSeason: Record<string, MySeasonStatsResult>;
}

type Mode = "overview" | "zones" | "log";

/** number|null → 표시 문자열. null 은 "-"(0% 왜곡 금지) */
const fmt = (v: number | null): string => (v == null ? "-" : String(v));

export default function StatsClient({ seasons, defaultSeason, perSeason }: Props) {
  // 시즌 키는 문자열로 통일("career" | 연도). 셀렉터/조회 일관.
  const [seasonKey, setSeasonKey] = useState<string>(String(defaultSeason));
  const [mode, setMode] = useState<Mode>("overview");

  // 선택 시즌 데이터. 없으면 career fallback(방어).
  const data = perSeason[seasonKey] ?? perSeason["career"];
  const totals = data?.totals ?? null;

  // 시즌 셀렉터 칩 = 데이터 있는 연도 + 커리어. (mock seasons 박제 ❌)
  const seasonChips: { key: string; label: string }[] = [
    ...seasons.map((y) => ({ key: String(y), label: `${y}` })),
    { key: "career", label: "커리어" },
  ];

  // KPI 8칸 — 7칸 실값 + 레이팅 "—"(결재: 대체 안 함).
  const kpi: { l: string; v: string; s: string; rating?: boolean }[] = totals
    ? [
        { l: "PPG", v: String(totals.ppg), s: "경기당 득점" },
        { l: "APG", v: String(totals.apg), s: "어시스트" },
        { l: "RPG", v: String(totals.rpg), s: "리바운드" },
        { l: "SPG", v: String(totals.spg), s: "스틸" },
        { l: "FG%", v: fmt(totals.fgPct), s: "야투" },
        { l: "3P%", v: fmt(totals.tpPct), s: "3점" },
        { l: "FT%", v: fmt(totals.ftPct), s: "자유투" },
        { l: "레이팅", v: "—", s: "집계 준비중", rating: true },
      ]
    : [];

  // 모드 탭 — 시안 3탭 그대로(요약/슈팅존/경기로그).
  const modes: [Mode, string][] = [
    ["overview", "요약"],
    ["zones", "슈팅 존"],
    ["log", "경기 로그"],
  ];

  // 선택 시즌 기록 0건 → KPI/탭 대신 시즌 내 빈상태(다른 시즌 칩은 유지).
  const seasonEmpty = !totals;

  // 헤더 부제 — 승/패/경기수 요약(있을 때).
  const headSub = totals
    ? `${totals.gamesPlayed}경기 · ${totals.wins}승 ${totals.losses}패${
        totals.winRate != null ? ` · 승률 ${totals.winRate}%` : ""
      }`
    : "선택한 시즌의 기록이 아직 없습니다.";

  // TREND 좌표 산출 — 득점 최대값 기준 스케일링(고정 4배수 대신 동적).
  const trend = data?.trend ?? [];
  const trendMax = Math.max(10, ...trend);
  const trendPts = trend
    .map((v, i) => {
      const x = trend.length > 1 ? (i / (trend.length - 1)) * 520 : 0;
      const y = 140 - (v / trendMax) * 120; // 0~120px 높이 매핑
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="page">
      <div className="ex-page-w">
        {/* 브레드크럼 */}
        <div className="ex-crumb">
          <a href="/">홈</a>
          <span className="sep">›</span>
          <a href="/profile">프로필</a>
          <span className="sep">›</span>
          <span className="cur">스탯 분석</span>
        </div>

        {/* 헤더 + 시즌 셀렉터 */}
        <div className="ex-head">
          <div>
            <div className="eyebrow">ADVANCED STATS</div>
            <h1 className="ex-head__title">시즌 스탯</h1>
            <p className="ex-head__sub">{headSub}</p>
          </div>
          <div className="ex-head__actions">
            <div className="ex-chips" style={{ margin: 0 }}>
              {seasonChips.map((c) => (
                <button
                  key={c.key}
                  className={"ex-chip" + (seasonKey === c.key ? " is-on" : "")}
                  onClick={() => setSeasonKey(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {seasonEmpty ? (
          /* 빈상태 ③: 선택 시즌 기록 0건 — 다른 시즌 칩은 위에 노출됨 */
          <div className="card">
            <div className="ex-empty">
              <span className="ico material-symbols-outlined">query_stats</span>
              <div className="ex-empty__t">이번 시즌 기록이 아직 없습니다</div>
              <div className="ex-empty__d">
                다른 시즌을 선택하거나, 대회에 출전해 경기를 치르면 기록이 쌓입니다.
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* KPI 8칸 */}
            <div className="st-kpi">
              {kpi.map((k, i) => (
                <div key={i} className="st-kpi__cell">
                  <div className="st-kpi__l">{k.l}</div>
                  {/* 강조색 = cafe-blue(.st-kpi__v--hl). 레이팅 "—"는 강조 안 함(dim). */}
                  <div
                    className={
                      "st-kpi__v" + (k.rating ? " st-kpi__v--dim" : "")
                    }
                  >
                    {k.v}
                  </div>
                  <div className="st-kpi__s">{k.s}</div>
                </div>
              ))}
            </div>

            {/* 모드 탭 */}
            <div className="ex-tabs">
              {modes.map(([k, l]) => (
                <button
                  key={k}
                  className={"ex-tab" + (mode === k ? " is-on" : "")}
                  onClick={() => setMode(k)}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* 요약 — 득점 추이 + 클럽 내 순위 */}
            {mode === "overview" && (
              <div className="st-2col">
                <div className="card st-panel">
                  <h3 className="st-panel__h">
                    시즌 득점 추이{" "}
                    <span className="st-panel__h-note">
                      {trend.length}경기
                    </span>
                  </h3>
                  {trend.length > 0 ? (
                    <>
                      <svg
                        viewBox="0 0 520 160"
                        style={{ width: "100%", height: 180 }}
                      >
                        {/* 가이드 라인 */}
                        {[0, 0.33, 0.66, 1].map((r, i) => (
                          <line
                            key={i}
                            x1="0"
                            x2="520"
                            y1={140 - r * 120}
                            y2={140 - r * 120}
                            stroke="var(--border)"
                            strokeDasharray="3 3"
                          />
                        ))}
                        {/* 면적 — cafe-blue 반투명 */}
                        <polygon
                          fill="var(--cafe-blue)"
                          opacity="0.1"
                          points={`0,140 ${trendPts} 520,140`}
                        />
                        {/* 추이선 — cafe-blue */}
                        <polyline
                          fill="none"
                          stroke="var(--cafe-blue)"
                          strokeWidth="2"
                          points={trendPts}
                        />
                        {/* 포인트 */}
                        {trend.map((v, i) => {
                          const x =
                            trend.length > 1
                              ? (i / (trend.length - 1)) * 520
                              : 0;
                          const y = 140 - (v / trendMax) * 120;
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r="2.5"
                              fill="var(--cafe-blue)"
                            />
                          );
                        })}
                      </svg>
                      <div className="st-trend__axis">
                        <span>오래된 경기</span>
                        <span>최근</span>
                      </div>
                    </>
                  ) : (
                    <div className="st-mini-empty">표시할 경기가 없습니다</div>
                  )}
                </div>

                {/* 클럽 내 순위 — rows 0 이면 카드 hide(설계 §4) */}
                {data.clubRanks.length > 0 && (
                  <div className="card st-panel">
                    <h3 className="st-panel__h">클럽 내 순위</h3>
                    {data.clubRanks.map((r, i) => (
                      <div key={i} className="st-rank">
                        <span>{r.label}</span>
                        {/* 상위 3 강조 = cafe-blue */}
                        <span
                          className={
                            "st-rank__v" +
                            (r.rank <= 3 ? " st-rank__v--hl" : "")
                          }
                        >
                          {r.rank}
                          <small>/{r.of}</small>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 슈팅 존 — 항상 준비중(ShotZoneStat 0행 + MPS 존정보 무 → hide) */}
            {mode === "zones" && (
              <div className="card">
                <div className="ex-empty">
                  <span className="ico material-symbols-outlined">
                    sports_basketball
                  </span>
                  <div className="ex-empty__t">슈팅 존 집계 준비 중</div>
                  <div className="ex-empty__d">
                    슛 위치(존)별 성공률은 기록 시스템이 좌표를 수집하면 자동으로
                    제공됩니다.
                    <br />
                    현재는 위 KPI·경기 로그에서 야투/3점/자유투 성공률을 확인할 수
                    있어요.
                  </div>
                </div>
              </div>
            )}

            {/* 경기 로그 */}
            {mode === "log" && (
              <div className="card st-log-card">
                {data.gameLog.length > 0 ? (
                  <table className="st-log">
                    <thead>
                      <tr>
                        {["날짜", "상대", "MIN", "PTS", "REB", "AST", "FG", "3P", "결과"].map(
                          (h, i) => (
                            <th
                              key={i}
                              className={i === 1 ? "is-left" : "is-right"}
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.gameLog.map((g, i) => (
                        <tr key={i}>
                          <td className="st-log__date">{g.date}</td>
                          <td className="st-log__opp">
                            {g.opponentName ?? "상대"}
                          </td>
                          <td className="is-right st-log__soft">{g.minutes}</td>
                          {/* 20+ 득점 강조 = cafe-blue */}
                          <td
                            className={
                              "is-right" +
                              (g.points >= 20 ? " st-log__hl" : "")
                            }
                          >
                            {g.points}
                          </td>
                          <td className="is-right st-log__soft">{g.rebounds}</td>
                          <td className="is-right st-log__soft">{g.assists}</td>
                          <td className="is-right st-log__soft">{g.fg}</td>
                          <td className="is-right st-log__soft">{g.tp}</td>
                          <td className="is-right">
                            {/* 승/패 = 의미색(기존 토큰). 미정은 dash 텍스트 */}
                            {g.result === "-" ? (
                              <span className="st-log__soft">-</span>
                            ) : (
                              <span
                                className={
                                  "ex-badge " +
                                  (g.result === "W"
                                    ? "ex-badge--ok"
                                    : "ex-badge--red")
                                }
                              >
                                {g.result}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="ex-empty">
                    <div className="ex-empty__t">경기 로그가 없습니다</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
