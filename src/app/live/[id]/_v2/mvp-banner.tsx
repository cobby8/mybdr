"use client";

// 2026-04-22: Phase 2 GameResult v2 — MVP 배너
// 시안: Dev/design/BDR v2/screens/GameResult.jsx L181~L190
// 2026-05-03: BDR Game Score 표시 + 물음표 tooltip 추가 (사용자 요청)

import { useState, useEffect, useRef } from "react";
import type { MatchDataV2, MvpPlayerV2 } from "./game-result";

export function MvpBanner({ mvp, match }: { mvp: MvpPlayerV2; match: MatchDataV2 }) {
  const mvpTeam = mvp.team_id === match.home_team.id ? match.home_team : match.away_team;
  const teamColor = mvpTeam.color;

  const fgPct = mvp.fga > 0 ? Math.round((mvp.fgm / mvp.fga) * 100) : null;
  const tpPct = mvp.tpa > 0 ? Math.round((mvp.tpm / mvp.tpa) * 100) : null;
  const pmStr = mvp.plus_minus > 0 ? `+${mvp.plus_minus}` : String(mvp.plus_minus);

  const statLine = [
    `${mvp.pts}점`,
    `${mvp.ast}어시스트`,
    `${mvp.reb}리바운드`,
    `${mvp.stl}스틸`,
    pmStr,
    mvp.fga > 0 ? `야투 ${mvp.fgm}/${mvp.fga}${fgPct != null ? ` (${fgPct}%)` : ""}` : null,
    mvp.tpa > 0 ? `3점 ${mvp.tpm}/${mvp.tpa}${tpPct != null ? ` (${tpPct}%)` : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // 2026-05-03: BDR Game Score tooltip
  const [showTip, setShowTip] = useState(false);
  const tipWrapRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!showTip) return;
    const onDocClick = (e: MouseEvent) => {
      if (!tipWrapRef.current) return;
      if (!tipWrapRef.current.contains(e.target as Node)) setShowTip(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showTip]);

  return (
    <div
      className="card"
      style={{
        padding: "16px 18px",
        marginBottom: 18,
        display: "flex",
        alignItems: "center",
        gap: 14,
        background:
          "linear-gradient(90deg, color-mix(in oklab, var(--accent) 12%, transparent), transparent)",
        borderRadius: 4,
        flexWrap: "wrap",
      }}
    >
      {/* 등번호 원형 배지 */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: teamColor,
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--ff-mono)",
          fontWeight: 800,
          fontSize: 14,
          flex: "0 0 auto",
        }}
      >
        #{mvp.jersey_number ?? "-"}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            color: "var(--accent)",
            fontWeight: 800,
            letterSpacing: ".12em",
          }}
        >
          GAME MVP
        </div>
        {/* 2026-05-03: 이름 + BDR Game Score + ? tooltip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            margin: "2px 0",
          }}
        >
          <span
            style={{
              fontSize: 17,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
            }}
          >
            {mvp.name}
          </span>
          <span
            ref={tipWrapRef}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: "var(--ink-mute)",
              fontWeight: 500,
              position: "relative",
            }}
          >
            BDR Game Score{" "}
            <span style={{ fontWeight: 700, color: "var(--accent)" }}>
              {mvp.game_score.toFixed(1)}
            </span>
            <button
              type="button"
              onClick={() => setShowTip((v) => !v)}
              aria-label="BDR Game Score 설명"
              style={{
                background: "transparent",
                border: 0,
                cursor: "pointer",
                padding: 0,
                marginLeft: 2,
                display: "inline-flex",
                alignItems: "center",
                color: "var(--ink-dim)",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16 }}
                aria-hidden="true"
              >
                help
              </span>
            </button>
            {showTip && (
              <div
                role="tooltip"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  zIndex: 30,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "12px 14px",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                  width: "min(360px, 90vw)",
                  fontSize: 12,
                  color: "var(--ink)",
                  lineHeight: 1.5,
                  fontWeight: 400,
                  textAlign: "left",
                  pointerEvents: "auto",
                }}
              >
                {/* 화살표 */}
                <div
                  style={{
                    position: "absolute",
                    top: -6,
                    left: 50,
                    width: 10,
                    height: 10,
                    background: "var(--bg)",
                    borderTop: "1px solid var(--border)",
                    borderLeft: "1px solid var(--border)",
                    transform: "rotate(45deg)",
                  }}
                />
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    marginBottom: 6,
                    color: "var(--ink)",
                  }}
                >
                  BDR Game Score
                </div>
                <div style={{ marginBottom: 8, color: "var(--ink-mute)" }}>
                  NBA John Hollinger 의 GameScore 공식 단순화. 한 선수의 종합
                  활약을 1개 숫자로. 승팀 선수 중 1위가 GAME MVP.
                </div>
                <code
                  style={{
                    display: "block",
                    background: "var(--bg-alt)",
                    padding: "8px 10px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontFamily: "var(--ff-mono)",
                    lineHeight: 1.6,
                    color: "var(--ink)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  pts{"\n"}
                  + 0.4 × fgm − 0.7 × fga{"\n"}
                  − 0.4 × (fta − ftm){"\n"}
                  + 0.7 × oreb + 0.3 × dreb{"\n"}
                  + stl + 0.7 × ast + 0.7 × blk{"\n"}
                  − 0.4 × fouls − to
                </code>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: "var(--ink-dim)",
                  }}
                >
                  Tie-breaker: GameScore → 점수 → 어시스트
                </div>
              </div>
            )}
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-mute)",
            fontFamily: "var(--ff-mono)",
            lineHeight: 1.5,
            wordBreak: "keep-all",
          }}
        >
          {statLine}
        </div>
      </div>
    </div>
  );
}
