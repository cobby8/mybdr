"use client";

// 2026-04-22: Phase 2 GameResult v2 — 타임라인 탭
// 시안: Dev/design/BDR v2/screens/GameResult.jsx L289~L308
// play_by_plays 기반 경기 이벤트 역순 표시 (쿼터 + 게임클럭 + 팀 배지 + 설명)
//
// 2026-05-02 사용자 요청: 쿼터별 탭 + '모두 보기' 추가 (긴 타임라인 필터링)

import { useState, useMemo } from "react";
import type { MatchDataV2, PlayByPlayRowV2 } from "./game-result";

type QuarterFilter = "all" | "1" | "2" | "3" | "4" | "5"; // 5 = OT1

export function TabTimeline({ match }: { match: MatchDataV2 }) {
  const events = match.play_by_plays ?? [];
  const [filter, setFilter] = useState<QuarterFilter>("all");

  // OT 쿼터 존재 여부 — 탭에 OT 노출 분기
  const hasOT = useMemo(
    () => events.some((e) => e.quarter > 4),
    [events],
  );

  // 필터 적용된 이벤트
  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;
    const targetQ = parseInt(filter, 10);
    return events.filter((e) => e.quarter === targetQ);
  }, [events, filter]);

  if (events.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: "32px 24px",
          textAlign: "center",
          borderRadius: 4,
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-dim)",
            lineHeight: 1.6,
          }}
        >
          이 경기에는 play-by-play 기록이 없습니다.
          <br />
          (최종 스탯 입력 모드로 기록된 경기일 수 있습니다)
        </div>
      </div>
    );
  }

  // 쿼터 탭 정의 — 전체 + Q1~Q4 + (OT 있을 때만)
  const tabs: { key: QuarterFilter; label: string }[] = [
    { key: "all", label: "전체" },
    { key: "1", label: "Q1" },
    { key: "2", label: "Q2" },
    { key: "3", label: "Q3" },
    { key: "4", label: "Q4" },
    ...(hasOT ? [{ key: "5" as QuarterFilter, label: "OT" }] : []),
  ];

  return (
    <div className="card" style={{ padding: "18px 22px", borderRadius: 4 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
          경기 타임라인
        </h3>
        {/* 쿼터별 탭 (사용자 요청 2026-05-02) */}
        <div
          role="tablist"
          aria-label="쿼터 필터"
          style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
        >
          {tabs.map((t) => {
            const active = filter === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(t.key)}
                className="btn btn--sm"
                style={{
                  padding: "5px 10px",
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  background: active ? "var(--accent)" : "var(--bg-alt)",
                  color: active ? "var(--on-accent, #fff)" : "var(--ink-soft)",
                  border: active
                    ? "1px solid var(--accent)"
                    : "1px solid var(--border)",
                  borderRadius: 4,
                  cursor: "pointer",
                  minWidth: 44,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div
          style={{
            padding: "24px 16px",
            textAlign: "center",
            fontSize: 13,
            color: "var(--ink-dim)",
          }}
        >
          이 쿼터에는 기록된 이벤트가 없습니다.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {filteredEvents.map((e) => (
            <TimelineRow key={e.id} event={e} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineRow({ event, match }: { event: PlayByPlayRowV2; match: MatchDataV2 }) {
  const isHome = event.team_id === match.home_team.id;
  const isAway = event.team_id === match.away_team.id;
  const teamTag = isHome
    ? match.home_team.name
    : isAway
      ? match.away_team.name
      : "";
  const teamColor = isHome ? match.home_team.color : isAway ? match.away_team.color : "var(--ink-dim)";

  // 2026-05-02: 칩 폰트/테두리 자동 대비 (사용자 요청 "팀 칩 색상과 폰트 색상 잘 보이도록").
  //  - team.color 가 흰색/매우 밝은 경우 → 흰 폰트 + 흰 배경 시 보이지 않음.
  //  - perceived luminance 계산 (Y = .299R + .587G + .114B).
  //  - lum > 186 (밝음) → 검은 폰트 + 회색 테두리. 그 외 → 흰 폰트 + 동색 테두리.
  const { textColor, borderColor } = pickChipColors(teamColor);

  const body = formatEventBody(event);
  const clockStr = formatGameClock(event.game_clock_seconds);
  const qLabel = event.quarter <= 4 ? `Q${event.quarter}` : `OT${event.quarter - 4}`;

  // 득점 이벤트는 굵게 강조
  const isScore = event.is_made === true && event.points_scored > 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "70px 60px 1fr",
        gap: 10,
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
        alignItems: "center",
        background: isScore ? "color-mix(in oklab, var(--accent) 4%, transparent)" : "transparent",
      }}
    >
      <div
        style={{
          fontFamily: "var(--ff-mono)",
          fontSize: 11,
          fontWeight: 700,
          color: "var(--ink-dim)",
        }}
      >
        {qLabel} {clockStr}
      </div>
      <div>
        {teamTag && (
          <span
            style={{
              background: teamColor,
              color: textColor,
              border: `1px solid ${borderColor}`,
              fontSize: 10,
              padding: "2px 7px",
              borderRadius: 3,
              fontWeight: 700,
              display: "inline-block",
              maxWidth: 56,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {teamTag}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: isScore ? 700 : 500,
          color: "var(--ink)",
        }}
      >
        {body}
      </div>
    </div>
  );
}

// 2026-05-02: 팀 칩 폰트/테두리 자동 대비 (사용자 요청 — 흰 배경 시 흰 폰트로 안 보이는 문제 fix)
//  - hex (#RRGGBB / #RGB) 기준 perceived luminance 계산 (Y = .299R + .587G + .114B).
//  - 너무 밝으면 (lum > 200) → 검은 폰트 + 회색 테두리.
//  - 너무 어두우면 (lum < 30) → 흰 폰트 + 흰색 약간 테두리.
//  - 그 외 → 흰 폰트 + 동색 테두리.
//  - hex 가 아닌 var(--*) / rgba 등은 안전 fallback (흰 폰트 + 투명 테두리).
function pickChipColors(bg: string): { textColor: string; borderColor: string } {
  if (!bg || !bg.startsWith("#")) {
    return { textColor: "#fff", borderColor: "rgba(255,255,255,0.2)" };
  }
  const hex = bg.replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  if (full.length !== 6) {
    return { textColor: "#fff", borderColor: "rgba(255,255,255,0.2)" };
  }
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return { textColor: "#fff", borderColor: "rgba(255,255,255,0.2)" };
  }
  const lum = r * 0.299 + g * 0.587 + b * 0.114;
  if (lum > 200) {
    // 매우 밝음 (흰색/연노랑 등) → 검정 폰트 + 회색 테두리 (윤곽 확보)
    return { textColor: "#1a1a1a", borderColor: "rgba(0,0,0,0.25)" };
  }
  if (lum < 30) {
    // 매우 어두움 (검정 등) → 흰 폰트 + 흰색 약간 테두리 (다크 배경에서 윤곽 확보)
    return { textColor: "#fff", borderColor: "rgba(255,255,255,0.25)" };
  }
  return { textColor: "#fff", borderColor: bg };
}

// action_type/subtype → 한국어 설명
function formatEventBody(e: PlayByPlayRowV2): string {
  const name = e.player_name || `#${e.jersey_number ?? "-"}`;
  const made = e.is_made === true;
  const missed = e.is_made === false;
  const pts = e.points_scored;
  const sub = e.action_subtype ?? "";
  const isThree = sub === "3pt" || pts === 3;
  const isTwo = sub === "2pt" || pts === 2;

  switch (e.action_type) {
    case "shot":
    case "made_shot":
      if (made) {
        if (isThree) return `${name} 3점 성공 (+3)`;
        if (isTwo) return `${name} 2점 성공 (+2)`;
        return `${name} ${pts}점 성공`;
      }
      return `${name} 슛`;
    case "missed_shot":
      if (isThree) return `${name} 3점 실패`;
      if (isTwo) return `${name} 2점 실패`;
      return `${name} 슛 실패`;
    case "free_throw":
      return made ? `${name} 자유투 성공 (+1)` : `${name} 자유투 실패`;
    case "rebound":
      if (sub === "offensive") return `${name} 공격 리바운드`;
      if (sub === "defensive") return `${name} 수비 리바운드`;
      return `${name} 리바운드`;
    case "assist":
      return `${name} 어시스트`;
    case "steal":
      return `${name} 스틸`;
    case "block":
      return `${name} 블록`;
    case "turnover":
      return `${name} 턴오버`;
    case "foul":
    case "foul_personal":
      return `${name} 파울`;
    case "foul_technical":
      return `${name} 테크니컬 파울`;
    case "substitution":
      return `${name} 교체`;
    case "timeout":
      return `타임아웃`;
    case "team_foul":
      return `팀 파울`;
    case "jump_ball":
      return `점프볼`;
    default:
      if (missed) return `${name} ${e.action_type} 실패`;
      if (made) return `${name} ${e.action_type} 성공`;
      return `${name} ${e.action_type}`;
  }
}

// 초 → "M:SS" (게임클럭)
function formatGameClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
